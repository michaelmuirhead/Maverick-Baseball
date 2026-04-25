import { FRANCHISES } from './franchises';
/**
 * Generate a 162-game schedule across days 1-183 with realistic structure:
 *  - 3-game series clustered on consecutive days (Fri-Sat-Sun feel)
 *  - Every 7th day is a default off-day (no games scheduled)
 *  - Division rivals get ~12 games each; cross-div same league 6 each;
 *    interleague 3 each
 */
export function generateSchedule(rng) {
    const ids = Object.keys(FRANCHISES);
    const byDiv = {};
    const byLg = { AL: [], NL: [] };
    for (const id of ids) {
        const f = FRANCHISES[id];
        byLg[f.lg].push(id);
        const k = `${f.lg}-${f.div}`;
        byDiv[k] = byDiv[k] || [];
        byDiv[k].push(id);
    }
    const seriesList = [];
    // Division rivals: 12 games = 4 series (2 home, 2 away) of 3 games each
    for (const teams of Object.values(byDiv)) {
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                seriesList.push({ home: teams[i], away: teams[j], games: 3 });
                seriesList.push({ home: teams[i], away: teams[j], games: 3 });
                seriesList.push({ home: teams[j], away: teams[i], games: 3 });
                seriesList.push({ home: teams[j], away: teams[i], games: 3 });
            }
        }
    }
    // Cross-division same league: 6 games = 1 home series + 1 away series
    for (const lg of ['AL', 'NL']) {
        const lt = byLg[lg];
        for (let i = 0; i < lt.length; i++) {
            for (let j = i + 1; j < lt.length; j++) {
                if (FRANCHISES[lt[i]].div === FRANCHISES[lt[j]].div)
                    continue;
                seriesList.push({ home: lt[i], away: lt[j], games: 3 });
                seriesList.push({ home: lt[j], away: lt[i], games: 3 });
            }
        }
    }
    // Interleague: 3 games each pair, alternating home
    for (let i = 0; i < byLg.AL.length; i++) {
        for (let j = 0; j < byLg.NL.length; j++) {
            const a = byLg.AL[i], b = byLg.NL[j];
            const aHome = (i + j) % 2 === 0;
            seriesList.push({ home: aHome ? a : b, away: aHome ? b : a, games: 3 });
        }
    }
    rng.shuffle(seriesList);
    const teamDays = {};
    for (const id of ids)
        teamDays[id] = new Set();
    // Off-days: every 7th day skipped. Real MLB has Monday off-days; we just pick
    // a fixed pattern.
    const isOffDay = (d) => d % 14 === 0; // ~13 off-days per season
    const schedule = [];
    let gid = 0;
    function tryPlaceSeries(series) {
        // Try to find 3 consecutive days where both teams are free
        for (let attempts = 0; attempts < 60; attempts++) {
            const startDay = rng.int(1, 183 - series.games + 1);
            let ok = true;
            for (let g = 0; g < series.games; g++) {
                const d = startDay + g;
                if (d > 183 || isOffDay(d) || teamDays[series.home].has(d) || teamDays[series.away].has(d)) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                for (let g = 0; g < series.games; g++) {
                    const d = startDay + g;
                    teamDays[series.home].add(d);
                    teamDays[series.away].add(d);
                    schedule.push({ id: `g_${gid++}`, day: d, home: series.home, away: series.away, played: false });
                }
                return true;
            }
        }
        return false;
    }
    // First pass: cluster as series
    for (const s of seriesList) {
        if (!tryPlaceSeries(s)) {
            // Fallback: single-game placement on any free day
            for (let g = 0; g < s.games; g++) {
                let placed = false;
                for (let a = 0; a < 60 && !placed; a++) {
                    const d = rng.int(1, 183);
                    if (!isOffDay(d) && !teamDays[s.home].has(d) && !teamDays[s.away].has(d)) {
                        teamDays[s.home].add(d);
                        teamDays[s.away].add(d);
                        schedule.push({ id: `g_${gid++}`, day: d, home: s.home, away: s.away, played: false });
                        placed = true;
                    }
                }
                if (!placed) {
                    for (let d = 1; d <= 183; d++) {
                        if (!isOffDay(d) && !teamDays[s.home].has(d) && !teamDays[s.away].has(d)) {
                            teamDays[s.home].add(d);
                            teamDays[s.away].add(d);
                            schedule.push({ id: `g_${gid++}`, day: d, home: s.home, away: s.away, played: false });
                            break;
                        }
                    }
                }
            }
        }
    }
    schedule.sort((a, b) => a.day - b.day);
    const byDay = {};
    schedule.forEach((g, i) => { byDay[g.day] = byDay[g.day] || []; byDay[g.day].push(i); });
    return { schedule, byDay };
}
