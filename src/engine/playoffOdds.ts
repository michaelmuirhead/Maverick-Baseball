// Pythagorean record, magic numbers, simple playoff odds.

import type { GameState, Standing } from './types';
import { FRANCHISES } from './franchises';

export function pythagoreanWins(rf: number, ra: number, gamesPlayed: number, totalGames = 162): number {
  if (rf === 0 && ra === 0) return Math.round(totalGames * 0.5);
  const ratio = Math.pow(rf, 1.83) / (Math.pow(rf, 1.83) + Math.pow(ra, 1.83));
  return Math.round(ratio * totalGames);
}

export function projectFinalRecord(s: Standing, played: number, total = 162): { w: number; l: number } {
  if (played === 0) return { w: 0, l: 0 };
  const ratio = s.wins / played;
  const w = Math.round(ratio * total);
  return { w, l: total - w };
}

/**
 * Magic number: games until a team clinches a division spot.
 * Formula: max(0, totalGames + 1 - leaderWins - secondWonLosses)
 * Simplification: returns games until clinch over the second-place team.
 */
export function magicNumber(state: GameState, fid: string, totalGames = 162): number | null {
  const team = state.standings[fid];
  if (!team) return null;
  const f = FRANCHISES[fid];
  const divRivals = Object.keys(FRANCHISES).filter(
    (id) => id !== fid && FRANCHISES[id].lg === f.lg && FRANCHISES[id].div === f.div,
  );
  if (divRivals.length === 0) return null;
  const second = Math.max(...divRivals.map((id) => state.standings[id].wins));
  const teamGamesLeft = totalGames - team.wins - team.losses;
  if (teamGamesLeft <= 0) return null;
  // Magic number = games needed in any combination of team wins + 2nd-place losses
  const m = totalGames + 1 - team.wins - (totalGames - second - Math.max(...divRivals.map((id) => state.standings[id].losses)));
  return Math.max(0, m);
}

/**
 * Quick playoff odds: based on current win pct projection vs typical playoff cutoff.
 * Returns 0-100. Uses logistic function around projected wins.
 */
export function playoffOdds(state: GameState, fid: string, totalGames = 162): number {
  const team = state.standings[fid];
  if (!team) return 0;
  const played = team.wins + team.losses;
  if (played === 0) return 50;
  const projected = projectFinalRecord(team, played, totalGames).w;
  const cutoff = 87;     // typical playoff cutoff
  // Logistic with progress-weighted certainty
  const certainty = Math.min(played / 100, 1);
  const diff = projected - cutoff;
  const odds = 1 / (1 + Math.exp(-diff / (4 * (1 - certainty * 0.85) + 1)));
  return Math.round(odds * 100);
}
