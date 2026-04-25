// Pitch-by-pitch / inning-by-inning live game simulator. A thin layer over
// the Bradley-Terry model in sim.ts. Generates a play-by-play log with batter/
// pitcher matchups, outcomes derived from ratings.

import type { GameState, Player, Game } from './types';
import { RNG } from './rng';
import { FRANCHISES } from './franchises';

export interface Atbat {
  half: 'top' | 'bot';
  inning: number;
  batterName: string;
  pitcherName: string;
  outcome: 'K' | 'BB' | '1B' | '2B' | '3B' | 'HR' | 'GO' | 'FO' | 'HBP';
  runs: number;
  outsAfter: number;
  scoreHome: number;
  scoreAway: number;
}

export interface LiveGameState {
  gameId: string;
  homeFid: string;
  awayFid: string;
  inning: number;
  half: 'top' | 'bot';
  outs: number;
  scoreHome: number;
  scoreAway: number;
  log: Atbat[];
  finished: boolean;
  finalHomeScore?: number;
  finalAwayScore?: number;
}

function lineup(state: GameState, fid: string): Player[] {
  const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;
  const used = new Set<string>();
  const lineup: Player[] = [];
  const players = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && !p.isPitcher && p.health === 'healthy');
  for (const pos of POSITIONS) {
    const cand = players.filter((p) => !used.has(p.id) && p.pos === pos)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)[0];
    if (cand) {
      used.add(cand.id);
      lineup.push(cand);
    }
  }
  // pad to 9 if positions missing
  while (lineup.length < 9) {
    const remaining = players.filter((p) => !used.has(p.id))
      .sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (remaining[0]) {
      used.add(remaining[0].id);
      lineup.push(remaining[0]);
    } else break;
  }
  return lineup;
}

function startingPitcher(state: GameState, fid: string): Player | null {
  const sps = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && p.pos === 'SP' && p.health === 'healthy')
    .sort((a, b) => b.ratings.overall - a.ratings.overall);
  return sps[0] || null;
}

function reliever(state: GameState, fid: string, isCloser = false): Player | null {
  const rps = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && (p.pos === 'RP' || p.pos === 'CL') && p.health === 'healthy');
  if (isCloser) {
    const cl = rps.find((p) => p.pos === 'CL');
    if (cl) return cl;
  }
  rps.sort((a, b) => b.ratings.overall - a.ratings.overall);
  return rps[0] || null;
}

function rollAtbat(rng: RNG, batter: Player, pitcher: Player): Atbat['outcome'] {
  const contact = batter.ratings.contact || batter.ratings.overall;
  const power = batter.ratings.power || batter.ratings.overall;
  const eye = batter.ratings.eye || batter.ratings.overall;
  const fb = pitcher.ratings.fastball || pitcher.ratings.overall;
  const breakingP = pitcher.ratings.breaking || pitcher.ratings.overall;
  const command = pitcher.ratings.command || pitcher.ratings.overall;
  const pitcherStuff = (fb + breakingP) / 2;

  // Base probabilities (rough MLB averages)
  // K rate ~22%, BB rate ~8%, HBP ~1%
  // Otherwise contact: AVG ~.255, ISO ~.150
  const skill = ((contact + power + eye) / 3 - pitcherStuff) / 100;

  const kProb = Math.max(0.08, Math.min(0.35, 0.22 - (contact - 50) * 0.0035 + (pitcherStuff - 50) * 0.0035));
  const bbProb = Math.max(0.04, Math.min(0.16, 0.08 + (eye - 50) * 0.0028 - (command - 50) * 0.0028));
  const hbpProb = 0.01;

  const r = rng.next();
  if (r < kProb) return 'K';
  if (r < kProb + bbProb) return 'BB';
  if (r < kProb + bbProb + hbpProb) return 'HBP';

  // Ball in play
  const babip = Math.max(0.250, Math.min(0.380, 0.295 + skill * 0.18));
  const inPlay = rng.next();
  if (inPlay < babip) {
    // Hit type roll
    const hrChance = Math.max(0.020, Math.min(0.110, 0.038 + (power - 50) * 0.0012));
    const dblChance = 0.045 + (power - 50) * 0.0006;
    const tplChance = 0.005 + (batter.ratings.speed ? batter.ratings.speed - 50 : 0) * 0.0001;
    const hitRoll = rng.next();
    if (hitRoll < hrChance) return 'HR';
    if (hitRoll < hrChance + dblChance) return '2B';
    if (hitRoll < hrChance + dblChance + tplChance) return '3B';
    return '1B';
  }
  // Out in play
  return rng.chance(0.55) ? 'GO' : 'FO';
}

interface Bases { first: boolean; second: boolean; third: boolean; }

function applyAtbat(outcome: Atbat['outcome'], bases: Bases): { runs: number; outs: number; bases: Bases } {
  const b = { ...bases };
  let runs = 0;
  let outs = 0;
  switch (outcome) {
    case 'K':
    case 'FO':
      outs = 1;
      break;
    case 'GO':
      // Force at 1B if runner there with <2 outs; else regular out
      outs = 1;
      break;
    case 'BB':
    case 'HBP':
      // Force advances
      if (b.first && b.second && b.third) runs++;
      if (b.first && b.second) b.third = true;
      if (b.first) b.second = true;
      b.first = true;
      break;
    case '1B':
      if (b.third) runs++;
      if (b.second) runs++;
      b.third = b.first;
      b.second = false;
      b.first = true;
      break;
    case '2B':
      if (b.third) runs++;
      if (b.second) runs++;
      if (b.first) runs++;
      b.first = false;
      b.third = false;
      b.second = true;
      break;
    case '3B':
      if (b.first) runs++;
      if (b.second) runs++;
      if (b.third) runs++;
      b.first = false;
      b.second = false;
      b.third = true;
      break;
    case 'HR':
      runs = 1 + (b.first ? 1 : 0) + (b.second ? 1 : 0) + (b.third ? 1 : 0);
      b.first = false;
      b.second = false;
      b.third = false;
      break;
  }
  return { runs, outs, bases: b };
}

function describeOutcome(out: Atbat['outcome']): string {
  return ({
    K: 'strikes out',
    BB: 'walks',
    HBP: 'is hit by pitch',
    '1B': 'singles',
    '2B': 'doubles',
    '3B': 'triples',
    HR: 'homers',
    GO: 'grounds out',
    FO: 'flies out',
  } as const)[out];
}

export function startLiveGame(state: GameState, game: Game): LiveGameState {
  return {
    gameId: game.id,
    homeFid: game.home,
    awayFid: game.away,
    inning: 1,
    half: 'top',
    outs: 0,
    scoreHome: 0,
    scoreAway: 0,
    log: [],
    finished: false,
  };
}

export function simNextHalfInning(state: GameState, live: LiveGameState, rng: RNG): LiveGameState {
  if (live.finished) return live;
  const battingFid = live.half === 'top' ? live.awayFid : live.homeFid;
  const fieldingFid = live.half === 'top' ? live.homeFid : live.awayFid;
  const lineupOrder = lineup(state, battingFid);

  // Pick pitcher based on inning
  let pitcher: Player | null;
  if (live.inning <= 6) pitcher = startingPitcher(state, fieldingFid);
  else if (live.inning === 9 || (live.inning === 8 && Math.abs(live.scoreHome - live.scoreAway) <= 3)) {
    pitcher = reliever(state, fieldingFid, true) || startingPitcher(state, fieldingFid);
  } else {
    pitcher = reliever(state, fieldingFid, false) || startingPitcher(state, fieldingFid);
  }
  if (!pitcher || lineupOrder.length === 0) {
    live.finished = true;
    return live;
  }

  const bases: Bases = { first: false, second: false, third: false };
  let outs = 0;
  let batterIdx = ((live.log.filter((a) =>
    (live.half === 'top' && a.half === 'top') || (live.half === 'bot' && a.half === 'bot')
  ).length) % lineupOrder.length);

  let runsThisHalf = 0;
  let safety = 30;
  while (outs < 3 && safety-- > 0) {
    const batter = lineupOrder[batterIdx % lineupOrder.length];
    batterIdx++;
    const outcome = rollAtbat(rng, batter, pitcher);
    const r = applyAtbat(outcome, bases);
    bases.first = r.bases.first;
    bases.second = r.bases.second;
    bases.third = r.bases.third;
    outs += r.outs;
    runsThisHalf += r.runs;

    if (live.half === 'top') live.scoreAway += r.runs;
    else live.scoreHome += r.runs;

    live.log.push({
      half: live.half,
      inning: live.inning,
      batterName: `${batter.firstName} ${batter.lastName}`,
      pitcherName: `${pitcher.firstName} ${pitcher.lastName}`,
      outcome,
      runs: r.runs,
      outsAfter: outs,
      scoreHome: live.scoreHome,
      scoreAway: live.scoreAway,
    });
    // walk-off check
    if (live.half === 'bot' && live.inning >= 9 && live.scoreHome > live.scoreAway) {
      live.finished = true;
      return live;
    }
  }

  // Advance to next half / inning
  if (live.half === 'top') {
    live.half = 'bot';
  } else {
    live.inning += 1;
    live.half = 'top';
    // Check for game end after both halves of 9th (or extra)
    if (live.inning > 9 && live.scoreHome !== live.scoreAway) {
      live.finished = true;
    }
  }
  if (live.inning > 15) live.finished = true;     // safety bail
  return live;
}

export function simFullLiveGame(state: GameState, game: Game, rng: RNG): LiveGameState {
  let live = startLiveGame(state, game);
  let safety = 25;
  while (!live.finished && safety-- > 0) {
    live = simNextHalfInning(state, live, rng);
  }
  live.finalHomeScore = live.scoreHome;
  live.finalAwayScore = live.scoreAway;
  return live;
}

export function describeAtbat(a: Atbat): string {
  const verb = describeOutcome(a.outcome);
  const runText = a.runs === 0 ? '' : a.runs === 1 ? ' (1 run scores)' : ` (${a.runs} runs score)`;
  return `${a.batterName} ${verb} off ${a.pitcherName}${runText}.`;
}

export function homeTeamAbbr(state: GameState, live: LiveGameState): string {
  return FRANCHISES[live.homeFid]?.abbr || live.homeFid;
}
export function awayTeamAbbr(state: GameState, live: LiveGameState): string {
  return FRANCHISES[live.awayFid]?.abbr || live.awayFid;
}
