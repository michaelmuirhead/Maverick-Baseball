import type { RNG } from './rng';
import type { Game } from './types';
import { FRANCHISES } from './franchises';

/**
 * Generate a full 162-game schedule across days 1–183 (regular season).
 * - Division rivals: ~60 games (12 or 13 each, split home/away)
 * - Cross-division same league: 6 each
 * - Interleague: 3 each
 */
export function generateSchedule(rng: RNG): { schedule: Game[]; byDay: Record<number, number[]> } {
  const ids = Object.keys(FRANCHISES);
  const byDiv: Record<string, string[]> = {};
  const byLg: { AL: string[]; NL: string[] } = { AL: [], NL: [] };
  for (const id of ids) {
    const f = FRANCHISES[id];
    byLg[f.lg].push(id);
    const k = `${f.lg}-${f.div}`;
    byDiv[k] = byDiv[k] || [];
    byDiv[k].push(id);
  }

  const matchups: { home: string; away: string }[] = [];
  const divRivalCount = Object.values(byDiv)[0].length - 1;
  const divGamesEach = divRivalCount >= 5 ? 12 : 13;
  const homeShare = Math.ceil(divGamesEach / 2);
  const awayShare = divGamesEach - homeShare;

  for (const teams of Object.values(byDiv)) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        for (let g = 0; g < homeShare; g++) matchups.push({ home: teams[i], away: teams[j] });
        for (let g = 0; g < awayShare; g++) matchups.push({ home: teams[j], away: teams[i] });
      }
    }
  }

  for (const lg of ['AL', 'NL'] as const) {
    const lt = byLg[lg];
    for (let i = 0; i < lt.length; i++) {
      for (let j = i + 1; j < lt.length; j++) {
        if (FRANCHISES[lt[i]].div === FRANCHISES[lt[j]].div) continue;
        for (let g = 0; g < 3; g++) matchups.push({ home: lt[i], away: lt[j] });
        for (let g = 0; g < 3; g++) matchups.push({ home: lt[j], away: lt[i] });
      }
    }
  }

  for (let i = 0; i < byLg.AL.length; i++) {
    for (let j = 0; j < byLg.NL.length; j++) {
      const a = byLg.AL[i], b = byLg.NL[j];
      const aFirst = (i + j) % 2 === 0;
      if (aFirst) {
        matchups.push({ home: a, away: b });
        matchups.push({ home: a, away: b });
        matchups.push({ home: b, away: a });
      } else {
        matchups.push({ home: b, away: a });
        matchups.push({ home: b, away: a });
        matchups.push({ home: a, away: b });
      }
    }
  }

  rng.shuffle(matchups);
  const teamDays: Record<string, Set<number>> = {};
  for (const id of ids) teamDays[id] = new Set();
  const schedule: Game[] = [];
  let gid = 0;
  for (const m of matchups) {
    let placed = false;
    for (let a = 0; a < 80 && !placed; a++) {
      const d = rng.int(1, 183);
      if (!teamDays[m.home].has(d) && !teamDays[m.away].has(d)) {
        teamDays[m.home].add(d); teamDays[m.away].add(d);
        schedule.push({ id: `g_${gid++}`, day: d, home: m.home, away: m.away, played: false });
        placed = true;
      }
    }
    if (!placed) {
      for (let d = 1; d <= 183; d++) {
        if (!teamDays[m.home].has(d) && !teamDays[m.away].has(d)) {
          teamDays[m.home].add(d); teamDays[m.away].add(d);
          schedule.push({ id: `g_${gid++}`, day: d, home: m.home, away: m.away, played: false });
          break;
        }
      }
    }
  }
  schedule.sort((a, b) => a.day - b.day);
  const byDay: Record<number, number[]> = {};
  schedule.forEach((g, i) => { byDay[g.day] = byDay[g.day] || []; byDay[g.day].push(i); });
  return { schedule, byDay };
}
