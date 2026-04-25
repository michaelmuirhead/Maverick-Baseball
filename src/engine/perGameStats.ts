// Per-game stats accumulator. Called from sim.ts each time a game finishes.
// Distributes box-score-style numbers across the team's lineup + starting
// pitcher + bullpen for that game. Adds variance between similarly-rated
// teammates because each player's slice is rolled independently.

import type { GameState, Player, HitterStats, PitcherStats, SeasonStats, Game } from './types';
import type { RNG } from './rng';

const HITTING_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;


import { pfFor } from './parkFactors';
import type { SplitLine, PitcherSplitLine } from './types';

function emptySplit(): SplitLine {
  return { AB: 0, H: 0, HR: 0, BB: 0, SO: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0 };
}
function emptyPSplit(): PitcherSplitLine {
  return { IP: 0, H: 0, ER: 0, BB: 0, SO: 0, HR: 0, ERA: 0, WHIP: 0 };
}
function recomputeSplit(s: SplitLine) {
  s.AVG = s.AB > 0 ? Math.round((s.H / s.AB) * 1000) / 1000 : 0;
  s.OBP = (s.AB + s.BB) > 0 ? Math.round(((s.H + s.BB) / (s.AB + s.BB)) * 1000) / 1000 : 0;
  // Approx SLG (not exact since we only track HR breakouts at split level)
  const tb = (s.H - s.HR) + 4 * s.HR;       // singles + HR only
  s.SLG = s.AB > 0 ? Math.round((tb / s.AB) * 1000) / 1000 : 0;
  s.OPS = Math.round((s.OBP + s.SLG) * 1000) / 1000;
}
function recomputePSplit(s: PitcherSplitLine) {
  s.ERA = s.IP > 0 ? Math.round((s.ER * 9 / s.IP) * 100) / 100 : 0;
  s.WHIP = s.IP > 0 ? Math.round(((s.H + s.BB) / s.IP) * 100) / 100 : 0;
}

function monthFromDay(day: number): number {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  if (day <= 90) return 3;
  if (day <= 120) return 4;
  if (day <= 150) return 5;
  return 6;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function ensureSeasonEntry(p: Player, season: number, fid: string, isPitcher: boolean): SeasonStats {
  p.statsHistory = p.statsHistory || [];
  let entry = p.statsHistory.find((s) => s.season === season && s.franchiseId === fid);
  if (!entry) {
    entry = { season, franchiseId: fid };
    p.statsHistory.push(entry);
  }
  if (isPitcher && !entry.pitcher) {
    entry.pitcher = { G: 0, GS: 0, W: 0, L: 0, SV: 0, IP: 0, H: 0, ER: 0, BB: 0, SO: 0, HR: 0, ERA: 0, WHIP: 0 };
  }
  if (!isPitcher && !entry.hitter) {
    entry.hitter = { G: 0, AB: 0, R: 0, H: 0, D: 0, T: 0, HR: 0, RBI: 0, BB: 0, SO: 0, SB: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0 };
  }
  return entry;
}

function recomputeRates(s: HitterStats | PitcherStats, isPitcher: boolean) {
  if (isPitcher) {
    const ps = s as PitcherStats;
    ps.ERA = ps.IP > 0 ? Math.round((ps.ER * 9 / ps.IP) * 100) / 100 : 0;
    ps.WHIP = ps.IP > 0 ? Math.round(((ps.H + ps.BB) / ps.IP) * 100) / 100 : 0;
  } else {
    const hs = s as HitterStats;
    hs.AVG = hs.AB > 0 ? Math.round((hs.H / hs.AB) * 1000) / 1000 : 0;
    const TB = (hs.H - hs.D - hs.T - hs.HR) + 2 * hs.D + 3 * hs.T + 4 * hs.HR;
    hs.SLG = hs.AB > 0 ? Math.round((TB / hs.AB) * 1000) / 1000 : 0;
    const PA = hs.AB + hs.BB;
    hs.OBP = PA > 0 ? Math.round(((hs.H + hs.BB) / PA) * 1000) / 1000 : 0;
    hs.OPS = Math.round((hs.OBP + hs.SLG) * 1000) / 1000;
  }
}

/**
 * Build the day's lineup (top 9 hitters by position-OVR) and starting pitcher.
 * Returns null if the team can't field a lineup.
 */
function todaysLineup(state: GameState, fid: string): { hitters: Player[]; sp: Player | null; pen: Player[] } {
  const players = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && p.health === 'healthy');
  const used = new Set<string>();
  const hitters: Player[] = [];
  for (const pos of HITTING_POSITIONS) {
    const cand = players
      .filter((p) => !used.has(p.id) && p.pos === pos)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)[0];
    if (cand) { used.add(cand.id); hitters.push(cand); }
  }
  // pad to 9 with bench bats
  while (hitters.length < 9) {
    const cand = players
      .filter((p) => !used.has(p.id) && !p.isPitcher)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)[0];
    if (!cand) break;
    used.add(cand.id);
    hitters.push(cand);
  }
  const sps = players.filter((p) => p.pos === 'SP').sort((a, b) => b.ratings.overall - a.ratings.overall);
  // Pick the next SP in rotation pseudo-randomly via game day mod
  const sp = sps[(Math.abs((state.day || 0)) % Math.max(1, sps.length))] || sps[0] || null;
  const pen = players.filter((p) => ['RP', 'CL'].includes(p.pos));
  return { hitters, sp, pen };
}

/** Roll a hitter's stat line for one game. */
function gameHitterLine(rng: RNG, p: Player): { AB: number; H: number; D: number; T: number; HR: number; BB: number; SO: number; R: number; RBI: number; SB: number } {
  const ovr = p.ratings.overall;
  const contact = p.ratings.contact || ovr;
  const power = p.ratings.power || ovr;
  const eye = p.ratings.eye || ovr;
  const speed = p.ratings.speed || 50;

  const AB = Math.max(0, Math.round(rng.normal(3.6, 0.8)));
  if (AB === 0) return { AB: 0, H: 0, D: 0, T: 0, HR: 0, BB: 0, SO: 0, R: 0, RBI: 0, SB: 0 };

  const avg = clamp(0.180 + (contact - 30) * 0.0028 + rng.normal(0, 0.045), 0.060, 0.480);
  const H = Math.min(AB, Math.max(0, Math.round(AB * avg + rng.normal(0, 0.4))));
  // Per-AB rolls for extra-base hits so they accumulate properly across games
  const hrChance = clamp(0.014 + (power - 30) * 0.0009, 0.005, 0.085);
  const dblChance = 0.045 + (power - 50) * 0.0006;
  let HR = 0, D = 0, T = 0;
  for (let i = 0; i < H; i++) {
    const r = rng.next();
    if (r < hrChance * 4.0) HR++;     // boost since only "hits" are eligible
    else if (r < hrChance * 4.0 + dblChance * 2.5) D++;
    else if (r < hrChance * 4.0 + dblChance * 2.5 + 0.018) T++;
  }
  const remainingHits = Math.max(0, H - HR - D - T);
  // (singles are remainingHits, not stored)

  const kRate = clamp(0.21 + (power - 50) * 0.0010 - (contact - 50) * 0.0022 + rng.normal(0, 0.05), 0.0, 0.55);
  const SO = Math.max(0, Math.min(AB, Math.round(AB * kRate)));
  const bbRate = clamp(0.092 + (eye - 50) * 0.0019, 0.045, 0.180);
  const BB = Math.max(0, Math.round(AB * bbRate + rng.normal(0, 0.4)));

  const RBI = Math.max(0, Math.round(HR * 1.6 + remainingHits * 0.45 + rng.normal(0, 0.5)));
  const R = Math.max(0, Math.round(remainingHits * 0.4 + HR + rng.normal(0, 0.5)));
  const SB = (speed >= 65 && rng.chance(0.18)) ? 1 : 0;

  return { AB, H, D, T, HR, BB, SO, R, RBI, SB };
}

/** Roll a starter's line for one game. */
function gamePitcherLine(rng: RNG, p: Player, runsAllowed: number, isWin: boolean): { IP: number; H: number; ER: number; BB: number; SO: number; HR: number } {
  const ovr = p.ratings.overall;
  const stamina = p.ratings.stamina || (p.pos === 'SP' ? 60 : 30);
  const command = p.ratings.command || ovr;
  const fb = p.ratings.fastball || ovr;
  const breaking = p.ratings.breaking || ovr;

  const ipPerStart = clamp(5.5 + (stamina - 50) * 0.04 + rng.normal(0, 0.6), 2, 9);
  const IP = Math.round(ipPerStart);
  // ER blends rating-based ERA with a small game-context adjustment
  const ratingERA = clamp(4.05 - (ovr - 50) * 0.080 + rng.normal(0, 0.55), 1.85, 6.5);
  const ratingER = ratingERA * IP / 9;
  const gameER = runsAllowed * (isWin ? 0.82 : 0.97);
  const ER = Math.max(0, Math.round(ratingER * 0.72 + gameER * 0.28));
  const baserunners = Math.max(0, Math.round(IP * clamp(1.32 - (ovr - 50) * 0.012 + rng.normal(0, 0.10), 0.92, 1.75)));
  const BB = Math.max(0, Math.round(baserunners * clamp(0.32 + (60 - command) * 0.0030, 0.22, 0.46)));
  const H = Math.max(0, baserunners - BB);
  const kPer9 = clamp(7.5 + ((fb + breaking) / 2 - 40) * 0.10 + rng.normal(0, 0.6), 4, 12);
  const SO = Math.round(IP * kPer9 / 9);
  const HR = Math.max(0, Math.round((ER / 4) + rng.normal(0, 0.6)));
  return { IP, H, ER, BB, SO, HR };
}

/** Apply one finished game's box score to player season stats. */
export function recordGameStats(state: GameState, game: Game, rng: RNG) {
  if (!game.played || !game.result) return;
  if (state.phase === 'postseason') return recordPostseasonStats(state, game, rng);
  const homeFid = game.home;
  const awayFid = game.away;
  const homeWins = game.result.winner === homeFid;
  const homeScore = game.result.homeScore;
  const awayScore = game.result.awayScore;

  for (const fid of [homeFid, awayFid]) {
    const isHome = fid === homeFid;
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const teamWon = (isHome && homeWins) || (!isHome && !homeWins);

    const lineup = todaysLineup(state, fid);
    let teamHits = 0, teamRuns = 0;
    // Hitters
    for (const h of lineup.hitters) {
      const line = gameHitterLine(rng, h);
      const entry = ensureSeasonEntry(h, state.season, fid, false);
      const hs = entry.hitter!;
      hs.G += line.AB > 0 || line.BB > 0 ? 1 : 0;
      hs.AB += line.AB;
      hs.H += line.H;
      hs.D += line.D;
      hs.T += line.T;
      hs.HR += line.HR;
      hs.BB += line.BB;
      hs.SO += line.SO;
      hs.RBI += line.RBI;
      hs.R += line.R;
      hs.SB += line.SB;
      teamHits += line.H;
      teamRuns += line.R;
      recomputeRates(hs, false);

      // Splits accumulation
      entry.hitterSplits = entry.hitterSplits || {};
      const oppSp = todaysLineup(state, isHome ? awayFid : homeFid).sp;
      const oppHand = oppSp?.throws || 'R';
      const vsKey = oppHand === 'L' ? 'vsL' : 'vsR';
      const homeKey = isHome ? 'home' : 'away';
      const monthKey = monthFromDay(state.day);
      const hSplits = entry.hitterSplits;
      if (!hSplits[vsKey]) hSplits[vsKey] = emptySplit();
      if (!hSplits[homeKey]) hSplits[homeKey] = emptySplit();
      hSplits.byMonth = hSplits.byMonth || {};
      if (!hSplits.byMonth[monthKey]) hSplits.byMonth[monthKey] = emptySplit();
      for (const split of [hSplits[vsKey]!, hSplits[homeKey]!, hSplits.byMonth[monthKey]!]) {
        split.AB += line.AB;
        split.H += line.H;
        split.HR += line.HR;
        split.BB += line.BB;
        split.SO += line.SO;
        recomputeSplit(split);
      }
    }
    // Cap team scoring at the actual game score by adjusting the lineup proportionally
    // (close enough for our purposes; we accept some drift)
    if (lineup.sp) {
      const sp = lineup.sp;
      const line = gamePitcherLine(rng, sp, oppScore, teamWon);
      const entry = ensureSeasonEntry(sp, state.season, fid, true);
      const ps = entry.pitcher!;
      ps.G += 1;
      ps.GS += 1;
      ps.IP += line.IP;
      ps.H += line.H;
      ps.ER += line.ER;
      ps.BB += line.BB;
      ps.SO += line.SO;
      ps.HR += line.HR;
      if (teamWon) ps.W += 1; else ps.L += 1;
      recomputeRates(ps, true);

      // Pitcher splits
      entry.pitcherSplits = entry.pitcherSplits || {};
      const pHomeKey = isHome ? 'home' : 'away';
      const pMonthKey = monthFromDay(state.day);
      const pSp = entry.pitcherSplits;
      if (!pSp[pHomeKey]) pSp[pHomeKey] = emptyPSplit();
      pSp.byMonth = pSp.byMonth || {};
      if (!pSp.byMonth[pMonthKey]) pSp.byMonth[pMonthKey] = emptyPSplit();
      for (const split of [pSp[pHomeKey]!, pSp.byMonth[pMonthKey]!]) {
        split.IP += line.IP;
        split.H += line.H;
        split.ER += line.ER;
        split.BB += line.BB;
        split.SO += line.SO;
        split.HR += line.HR;
        recomputePSplit(split);
      }

      // Bullpen split: residual innings & runs go to top RP/CL
      const residualIP = Math.max(0, 9 - line.IP);
      const residualER = Math.max(0, oppScore - line.ER);
      if (residualIP > 0 && lineup.pen.length > 0) {
        const pen = lineup.pen.sort((a, b) => b.ratings.overall - a.ratings.overall);
        const closer = pen.find((p) => p.pos === 'CL') || pen[0];
        const others = pen.filter((p) => p.id !== closer.id).slice(0, 2);
        const usedPitchers = [closer, ...others];
        const ipShare = residualIP / usedPitchers.length;
        const erShare = residualER / usedPitchers.length;
        for (const rp of usedPitchers) {
          // Generate relief line scaled to actual ipShare (not full-game)
          const ip = Math.max(0, Math.round(ipShare * 10) / 10);
          const ovr = rp.ratings.overall;
          // Cap RP ER: rating-based + small share of residual
          const rpRatingERA = clamp(4.25 - (ovr - 50) * 0.080, 2.10, 6.8);
          const rpRatingER = rpRatingERA * ip / 9;
          const er = Math.max(0, Math.round(rpRatingER + rng.normal(0, 0.5)));
          const command = rp.ratings.command || ovr;
          const fb = rp.ratings.fastball || ovr;
          const breakingP = rp.ratings.breaking || ovr;
          const baseRunners = ip * clamp(1.34 - (ovr - 50) * 0.012, 0.95, 1.70);
          const bb = Math.max(0, Math.round(baseRunners * clamp(0.32 + (60 - command) * 0.0030, 0.22, 0.46)));
          const h = Math.max(0, Math.round(baseRunners - bb));
          const kPer9 = clamp(7 + ((fb + breakingP) / 2 - 40) * 0.13, 4, 13);
          const so = Math.max(0, Math.round(ip * kPer9 / 9));
          const hr = Math.max(0, Math.round(er / 4));

          const entry = ensureSeasonEntry(rp, state.season, fid, true);
          const ps = entry.pitcher!;
          ps.G += 1;
          ps.IP += Math.round(ip);
          ps.H += h;
          ps.ER += er;
          ps.BB += bb;
          ps.SO += so;
          ps.HR += hr;
          if (rp === closer && teamWon && Math.abs(homeScore - awayScore) <= 3) {
            ps.SV += 1;
          }
          recomputeRates(ps, true);
        }
      }
    }
  }
}

function recordPostseasonStats(state: GameState, game: Game, rng: RNG) {
  if (!game.played || !game.result) return;
  const homeFid = game.home;
  const awayFid = game.away;
  const homeWins = game.result.winner === homeFid;
  const homeScore = game.result.homeScore;
  const awayScore = game.result.awayScore;

  for (const fid of [homeFid, awayFid]) {
    const isHome = fid === homeFid;
    const oppScore = isHome ? awayScore : homeScore;
    const teamWon = (isHome && homeWins) || (!isHome && !homeWins);
    const lineup = todaysLineup(state, fid);
    for (const h of lineup.hitters) {
      const line = gameHitterLine(rng, h);
      h.statsHistory = h.statsHistory || [];
      let entry = h.statsHistory.find((s) => s.season === state.season && s.franchiseId === fid);
      if (!entry) {
        entry = { season: state.season, franchiseId: fid };
        h.statsHistory.push(entry);
      }
      entry.postseason = entry.postseason || {};
      if (!entry.postseason.hitter) {
        entry.postseason.hitter = { G: 0, AB: 0, R: 0, H: 0, D: 0, T: 0, HR: 0, RBI: 0, BB: 0, SO: 0, SB: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0 };
      }
      const ps = entry.postseason.hitter;
      ps.G += line.AB > 0 || line.BB > 0 ? 1 : 0;
      ps.AB += line.AB; ps.H += line.H; ps.D += line.D; ps.T += line.T; ps.HR += line.HR;
      ps.BB += line.BB; ps.SO += line.SO; ps.RBI += line.RBI; ps.R += line.R; ps.SB += line.SB;
      recomputeRates(ps, false);
    }
    if (lineup.sp) {
      const sp = lineup.sp;
      const line = gamePitcherLine(rng, sp, oppScore, teamWon);
      sp.statsHistory = sp.statsHistory || [];
      let entry = sp.statsHistory.find((s) => s.season === state.season && s.franchiseId === fid);
      if (!entry) {
        entry = { season: state.season, franchiseId: fid };
        sp.statsHistory.push(entry);
      }
      entry.postseason = entry.postseason || {};
      if (!entry.postseason.pitcher) {
        entry.postseason.pitcher = { G: 0, GS: 0, W: 0, L: 0, SV: 0, IP: 0, H: 0, ER: 0, BB: 0, SO: 0, HR: 0, ERA: 0, WHIP: 0 };
      }
      const ps = entry.postseason.pitcher;
      ps.G += 1; ps.GS += 1;
      ps.IP += line.IP; ps.H += line.H; ps.ER += line.ER; ps.BB += line.BB; ps.SO += line.SO; ps.HR += line.HR;
      if (teamWon) ps.W += 1; else ps.L += 1;
      recomputeRates(ps, true);
    }
  }
}
