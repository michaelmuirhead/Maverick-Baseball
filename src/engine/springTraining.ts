// Spring training. Days -15 to 0. Active rosters can be expanded up to 40
// during ST. At day 0 (opening day eve) teams must cut to 26. Cuts go to AAA.

import type { GameState } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';
import { sendDownToMinors } from './minors';

export const ACTIVE_ROSTER_TARGET = 26;
export const ST_OPENS = -15;
export const ST_CLOSES = 0;

export function startSpringTraining(state: GameState) {
  state.springTraining = { active: true, cutDeadline: ST_CLOSES };
  state.news.unshift({
    id: `st_open_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${state.season} Spring Training opens`,
    body: 'Pitchers and catchers report. Rosters can carry up to 40 players. Cuts to 26 due opening day.',
    category: 'team',
  });
}

/**
 * Force cuts on every team that has more than 26 active players.
 * Worst-rated player gets sent to AAA first.
 */
export function executeCuts(state: GameState, _rng: RNG) {
  for (const fid of Object.keys(FRANCHISES)) {
    const roster = state.rosters[fid] || [];
    if (roster.length <= ACTIVE_ROSTER_TARGET) continue;

    // Cut worst-rated until 26
    const sorted = [...roster]
      .map((id) => ({ id, p: state.players[id] }))
      .filter((x) => x.p)
      // Don't cut veterans 5+ yrs service first
      .sort((a, b) => {
        const aVet = (a.p.contract?.serviceDays || 0) >= 5 * 172 ? 1 : 0;
        const bVet = (b.p.contract?.serviceDays || 0) >= 5 * 172 ? 1 : 0;
        if (aVet !== bVet) return aVet - bVet;
        return a.p.ratings.overall - b.p.ratings.overall;
      });

    const toCut = sorted.slice(0, roster.length - ACTIVE_ROSTER_TARGET).map((x) => x.id);
    for (const pid of toCut) {
      sendDownToMinors(state, pid, 'aaa');
    }
  }
  if (state.springTraining) state.springTraining.active = false;
  state.news.unshift({
    id: `st_close_${state.season}`,
    day: state.day,
    season: state.season,
    headline: 'Opening day rosters set - 26-man cuts complete',
    body: 'Final cuts have been processed. The bell rings tomorrow.',
    category: 'league',
  });
}
