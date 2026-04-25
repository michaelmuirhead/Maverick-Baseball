// ============================================================
// Injuries + Injured List
// ============================================================
// Rolls injuries as games are simulated. A player on the IL misses games
// and counts against neither team-strength nor game-day roster selection,
// but stays on the 40-man roster and continues to be paid.

import type { RNG } from './rng';
import type { GameState, Player, Injury } from './types';
import { FRANCHISES } from './franchises';
import { pitchingCoachInjuryMult } from './coaches';

const INJURY_TYPES_HITTER = [
  { type: 'Hamstring strain', severity: 'il_10', ratingPenalty: 8, dayRange: [10, 18] },
  { type: 'Oblique strain', severity: 'il_15', ratingPenalty: 6, dayRange: [18, 35] },
  { type: 'Knee contusion', severity: 'day_to_day', ratingPenalty: 3, dayRange: [2, 5] },
  { type: 'Back tightness', severity: 'day_to_day', ratingPenalty: 4, dayRange: [2, 6] },
  { type: 'Wrist sprain', severity: 'il_15', ratingPenalty: 10, dayRange: [20, 40] },
  { type: 'Shoulder inflammation', severity: 'il_15', ratingPenalty: 7, dayRange: [18, 35] },
  { type: 'Concussion', severity: 'il_10', ratingPenalty: 5, dayRange: [10, 21] },
  { type: 'Labrum tear', severity: 'il_60', ratingPenalty: 15, dayRange: [75, 180] },
  { type: 'Broken hamate', severity: 'il_60', ratingPenalty: 9, dayRange: [60, 90] },
  { type: 'Thumb sprain', severity: 'il_15', ratingPenalty: 8, dayRange: [18, 28] },
];

const INJURY_TYPES_PITCHER = [
  { type: 'Forearm tightness', severity: 'il_15', ratingPenalty: 7, dayRange: [18, 30] },
  { type: 'Elbow inflammation', severity: 'il_15', ratingPenalty: 9, dayRange: [22, 45] },
  { type: 'Shoulder inflammation', severity: 'il_15', ratingPenalty: 8, dayRange: [20, 40] },
  { type: 'Back spasms', severity: 'day_to_day', ratingPenalty: 4, dayRange: [2, 6] },
  { type: 'Blister', severity: 'il_10', ratingPenalty: 3, dayRange: [10, 16] },
  { type: 'UCL sprain', severity: 'il_60', ratingPenalty: 20, dayRange: [120, 365] },
  { type: 'Lat strain', severity: 'il_15', ratingPenalty: 10, dayRange: [25, 50] },
  { type: 'Oblique strain', severity: 'il_15', ratingPenalty: 6, dayRange: [18, 30] },
];

function baseRate(p: Player): number {
  let r = 0.0011;
  if (p.age >= 33) r *= 1.4;
  if (p.age >= 36) r *= 1.5;
  if (p.age <= 24) r *= 0.8;
  if (p.isPitcher) r *= 1.25;
  if (p.isPitcher && p.pos === 'SP') r *= 1.1;
  if (['C', 'CF', 'SS'].includes(p.pos)) r *= 1.15;
  return r;
}

function rollInjuryType(rng: RNG, p: Player) {
  const pool = p.isPitcher ? INJURY_TYPES_PITCHER : INJURY_TYPES_HITTER;
  const weights = pool.map((i) => (
    i.severity === 'day_to_day' ? 40 :
    i.severity === 'il_10' ? 30 :
    i.severity === 'il_15' ? 22 :
    6
  ));
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}

export function rollDailyInjuries(state: GameState, rng: RNG): GameState {
  if (state.phase !== 'regular_season' && state.phase !== 'postseason') return state;

  for (const fid of Object.keys(state.rosters)) {
    const medicalSpend = state.finances[fid]?.ledger.medical || 0;
    const medFactor = medicalSpend > (state.day * 12_000) ? 0.85 : 1.0;
    const pcMult = pitchingCoachInjuryMult(state, fid);

    for (const pid of state.rosters[fid]) {
      const p = state.players[pid];
      if (!p || p.health !== 'healthy') continue;
      const coachMult = p.isPitcher ? pcMult : 1.0;
      if (rng.chance(baseRate(p) * medFactor * coachMult)) {
        applyInjury(state, rng, p);
      }
    }
  }

  for (const pid of Object.keys(state.players)) {
    const p = state.players[pid];
    if (!p.injury) continue;
    if (state.day >= p.injury.recoversOn) {
      recoverPlayer(state, p);
    }
  }

  return state;
}

export function applyInjury(state: GameState, rng: RNG, p: Player): Injury {
  const spec = rollInjuryType(rng, p);
  const days = rng.int(spec.dayRange[0], spec.dayRange[1]);
  const injury: Injury = {
    type: spec.type,
    severity: spec.severity as Injury['severity'],
    dayStarted: state.day,
    season: state.season,
    recoversOn: state.day + days,
    ratingPenalty: spec.ratingPenalty,
  };
  p.injury = injury;
  p.health = injury.severity;
  p.ratings.overall = Math.max(20, p.ratings.overall - injury.ratingPenalty);

  state.injuryLog = state.injuryLog || [];
  state.injuryLog.push({ playerId: p.id, season: state.season, day: state.day, type: spec.type, severity: spec.severity });

  if ((spec.severity === 'il_15' || spec.severity === 'il_60') && p.franchiseId) {
    const fid = p.franchiseId;
    const f = FRANCHISES[fid];
    if (!f) return injury;
    const label = spec.severity === 'il_60' ? '60-day IL' : '15-day IL';
    state.news.unshift({
      id: `inj_${p.id}_${state.day}_${state.season}`,
      day: state.day,
      season: state.season,
      headline: `${f.city} place ${p.firstName} ${p.lastName} on ${label}`,
      body: `Diagnosed with a ${spec.type.toLowerCase()}. Expected to miss roughly ${days} days.`,
      category: 'injury',
    });
  }
  return injury;
}

export function recoverPlayer(_state: GameState, p: Player) {
  if (!p.injury) return;
  p.ratings.overall = Math.min(80, p.ratings.overall + p.injury.ratingPenalty);
  p.health = 'healthy';
  p.injury = null;
}

export function injuredPlayers(state: GameState, fid: string): Player[] {
  return state.rosters[fid]
    .map((pid) => state.players[pid])
    .filter((p) => p && p.health !== 'healthy');
}

export function healthyPlayers(state: GameState, fid: string): Player[] {
  return state.rosters[fid]
    .map((pid) => state.players[pid])
    .filter((p) => p && p.health === 'healthy');
}
