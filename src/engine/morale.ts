// Player morale + demands. Morale 0-100 (50 neutral). Drives complaint news,
// trade requests at very low values, willingness to re-sign at high values.

import type { GameState, Player } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';

export function initMorale(state: GameState) {
  for (const pid of Object.keys(state.players)) {
    const p = state.players[pid];
    if (p.morale === undefined) p.morale = 50;
    if (!p.demands) p.demands = {};
  }
}

/** Weekly morale tick: shift toward 50 + based on playing time + recent results. */
export function updateWeeklyMorale(state: GameState, _rng: RNG) {
  for (const pid of Object.keys(state.players)) {
    const p = state.players[pid];
    if (p.retired) continue;
    if (p.morale === undefined) p.morale = 50;
    // Mean revert
    p.morale += Math.sign(50 - p.morale) * 1.0;
    // Streaks affect morale
    if (p.streakMod && p.streakMod > 4) p.morale += 1;
    if (p.streakMod && p.streakMod < -4) p.morale -= 1;
    p.morale = Math.max(0, Math.min(100, p.morale));
  }
}

/** Annual offseason: high-rated under-contract players develop demands. */
export function rollDemands(state: GameState, rng: RNG) {
  for (const pid of Object.keys(state.players)) {
    const p = state.players[pid];
    if (!p.contract || p.retired) continue;
    p.demands = p.demands || {};
    if (p.ratings.overall >= 65 && (p.contract.years <= 2) && rng.chance(0.35)) {
      p.demands.wantsExtension = true;
    }
    if ((p.morale || 50) < 35 && rng.chance(0.20) && p.franchiseId) {
      // Player publicly grumbles
      const f = FRANCHISES[p.franchiseId];
      state.news.unshift({
        id: `morale_${pid}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${p.firstName} ${p.lastName} unhappy in ${f?.city || 'team'}`,
        body: `Sources say ${p.lastName} has expressed displeasure with their role and may seek a change of scenery.`,
        category: 'team',
        involves: [p.franchiseId],
      });
    }
  }
}
