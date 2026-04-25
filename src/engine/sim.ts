import { RNG } from './rng';
import type { Game, GameState } from './types';
import { FRANCHISES } from './franchises';
import { gameDayRev } from './finance';
import { managerIntangibleBonus, computeTacticalContribution } from './coaches';
import { effectiveOverall } from './streaks';
import { chemistryMultiplier } from './chemistry';
import { recordGameStats } from './perGameStats';
import { ensureGameWeather } from './weather';

export function teamStrength(state: GameState, fid: string): number {
  const roster = state.rosters[fid];
  if (!roster || roster.length === 0) return 50;
  const players = roster.map((id) => state.players[id]).filter((p) => p && p.health === 'healthy');
  const hitters = players.filter((p) => !p.isPitcher);
  const sp = players.filter((p) => p.pos === 'SP').sort((a, b) => b.ratings.overall - a.ratings.overall);
  const rp = players.filter((p) => ['RP', 'CL'].includes(p.pos)).sort((a, b) => b.ratings.overall - a.ratings.overall);

  const tac = computeTacticalContribution(state, fid);

  const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;
  const used = new Set<string>();
  const starters: typeof hitters = [];
  for (const pos of POSITIONS) {
    const cand = hitters.filter((p) => !used.has(p.id) && p.pos === pos)
      .sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (cand.length > 0) {
      starters.push(cand[0]);
      used.add(cand[0].id);
    }
  }
  const bench = hitters.filter((p) => !used.has(p.id));

  const baseHit = starters.length > 0
    ? starters.reduce((s, p) => s + effectiveOverall(p), 0) / starters.length
    : 50;
  let hitWithBench = baseHit;
  if (starters.length >= 8 && bench.length > 0) {
    const benchTop = Math.max(...bench.map((p) => effectiveOverall(p)));
    const worstStarter = Math.min(...starters.map((p) => effectiveOverall(p)));
    const upgrade = Math.max(0, benchTop - worstStarter);
    const pinchHitFreq = Math.max(0, 0.05 + 0.05 * tac.tacticalNorm);
    hitWithBench = baseHit + upgrade * pinchHitFreq / 8;
  }

  const spAvg = sp.length > 0
    ? sp.slice(0, 5).reduce((s, p) => s + effectiveOverall(p), 0) / Math.min(5, sp.length)
    : 50;

  const rpTop2 = rp.slice(0, 2);
  const rpBack2 = rp.slice(2, 4);
  const rpTop2Avg = rpTop2.length > 0 ? rpTop2.reduce((s, p) => s + effectiveOverall(p), 0) / rpTop2.length : 50;
  const rpBack2Avg = rpBack2.length > 0 ? rpBack2.reduce((s, p) => s + effectiveOverall(p), 0) / rpBack2.length : rpTop2Avg;
  const leverageWeight = 0.5 + 0.25 * tac.tacticalNorm;
  const rpAvg = rpTop2Avg * leverageWeight + rpBack2Avg * (1 - leverageWeight);

  const park = (FRANCHISES[fid].pf - 100) * 0.05;
  const intangibles = managerIntangibleBonus(state, fid);

  const raw = hitWithBench * 0.5 + spAvg * 0.35 + rpAvg * 0.15 + park + intangibles;
  return raw * chemistryMultiplier(state, fid);
}

export function simGame(rng: RNG, state: GameState, game: Game) {
  ensureGameWeather(state, rng, game);
  const hs = teamStrength(state, game.home);
  const as = teamStrength(state, game.away);
  const diff = hs - as + 2.0;
  const homeWinProb = 1 / (1 + Math.exp(-diff / 15));
  let homeScore = Math.max(0, Math.round(rng.normal(4 + (hs - 50) * 0.05, 2.8)));
  let awayScore = Math.max(0, Math.round(rng.normal(4 + (as - 50) * 0.05, 2.8)));
  const actualHome = homeScore > awayScore;
  const desiredHome = rng.next() < homeWinProb;
  if (actualHome !== desiredHome) {
    if (desiredHome && homeScore <= awayScore) homeScore = awayScore + rng.int(1, 3);
    else if (!desiredHome && homeScore >= awayScore) awayScore = homeScore + rng.int(1, 3);
  }
  if (homeScore === awayScore) { if (rng.next() < homeWinProb) homeScore++; else awayScore++; }

  const fin = state.finances[game.home];
  const f = FRANCHISES[game.home];
  const s = state.standings[game.home];
  const rivalry = FRANCHISES[game.home].div === FRANCHISES[game.away].div && FRANCHISES[game.home].lg === FRANCHISES[game.away].lg;
  const r = gameDayRev(rng, f, fin, s.wins, s.losses, game.day, rivalry);
  fin.ledger.ticketRev += r.ticket;
  fin.ledger.premiumRev += r.premium;
  fin.ledger.concRev += r.conc;
  fin.ledger.parkRev += r.park;
  fin.ledger.merchRev += r.merch;
  fin.ledger.attendance += r.attendance;
  fin.ledger.homeGames += 1;

  const winner = homeScore > awayScore ? game.home : game.away;
  const loser = winner === game.home ? game.away : game.home;
  return { homeScore, awayScore, winner, loser, attendance: r.attendance };
}

export function applyResult(state: GameState, game: Game, rng?: RNG) {
  if (rng) recordGameStats(state, game, rng);
  const r = game.result!;
  const w = state.standings[r.winner], l = state.standings[r.loser];
  w.wins++; l.losses++;
  const hs = r.homeScore, as = r.awayScore;
  w.rf += r.winner === game.home ? hs : as;
  w.ra += r.winner === game.home ? as : hs;
  l.rf += r.loser === game.home ? hs : as;
  l.ra += r.loser === game.home ? as : hs;
  w.streak = w.streak >= 0 ? w.streak + 1 : 1;
  l.streak = l.streak <= 0 ? l.streak - 1 : -1;
  w.l10.push('W'); if (w.l10.length > 10) w.l10.shift();
  l.l10.push('L'); if (l.l10.length > 10) l.l10.shift();
}
