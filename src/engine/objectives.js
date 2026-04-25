// ============================================================
// Owner objectives + job security
// ============================================================
// Each season the board sets 4 objectives for the user team. Hits raise
// jobSecurity (0-100); misses lower it. Below 0 = fired (game over).
// Targets scale by market tier — mega markets are expected to win 90+,
// small markets 78+. Profit and attendance targets scale with revenue.
import { generateGMJobOffers } from './gmCareer';
import { FRANCHISES } from './franchises';
import { RNG } from './rng';
import { MARKETS } from './markets';
const OBJECTIVE_REWARDS = { wins: 14, playoffs: 22, profit: 10, attendance: 8 };
const OBJECTIVE_PENALTIES = { wins: 8, playoffs: 8, profit: 6, attendance: 4 };
/**
 * Set the upcoming season's objectives. Called at start of each offseason.
 * Returns the OwnerObjectives object so it can be assigned to state.
 */
export function setSeasonObjectives(state) {
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const market = MARKETS[f.market];
    // Win target by market tier
    const winTarget = { mega: 92, large: 87, mid: 82, small: 78 }[market.tier];
    // Profit target — recent revenue × 0.05 (5% margin baseline expected)
    const lastRev = state.finances[fid].history.slice(-1)[0]?.revenue;
    const profitTarget = lastRev ? Math.round(lastRev * 0.05) : 5_000_000;
    // Attendance target — 60% of stadium capacity × 81 home games
    const attendanceTarget = Math.round(f.cap * 0.6 * 81);
    // Expansion-team grace period: lower targets first 3 seasons
    const isExpansionEarly = !!f.expansion && (f.seasonsActive ?? 0) < 3;
    const winsAdj = isExpansionEarly ? winTarget - 8 : winTarget;
    const attAdj = isExpansionEarly ? Math.round(attendanceTarget * 0.8) : attendanceTarget;
    const objectives = [
        { id: 'wins', label: `Win ${winsAdj}+ games`, target: winsAdj },
        { id: 'playoffs', label: 'Make the playoffs', target: 1 },
        { id: 'profit', label: `Net P&L ≥ $${(profitTarget / 1_000_000).toFixed(0)}M`, target: profitTarget },
        { id: 'attendance', label: `Total attendance ≥ ${(attAdj / 1_000_000).toFixed(2)}M`, target: attAdj },
    ];
    return { season: state.season, objectives };
}
/**
 * Score the just-completed season against the standing objectives.
 * Updates jobSecurity, fires the user if it goes below 0, and writes
 * a news item summarizing the report card.
 */
export function evaluateObjectives(state) {
    const obj = state.ownerObjectives;
    if (!obj)
        return;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const lastFin = state.finances[fid].history.slice(-1)[0];
    // standings have already been reset to 0-0 by this point in rollover;
    // pull actual W-L from the just-written finance history record.
    const wins = lastFin?.record.w ?? 0;
    const losses = lastFin?.record.l ?? 0;
    void losses;
    // Whether user made the playoffs is captured at bracket-seeding time,
    // before season rollover clears the bracket.
    const madePlayoffs = !!state.userMadePlayoffs;
    state.userMadePlayoffs = false; // reset for next season
    // Suppress unused-var warning for f
    void f;
    let netDelta = 0;
    for (const o of obj.objectives) {
        if (o.id === 'wins') {
            o.actual = wins;
            o.achieved = wins >= o.target;
        }
        else if (o.id === 'playoffs') {
            o.actual = madePlayoffs ? 1 : 0;
            o.achieved = madePlayoffs;
        }
        else if (o.id === 'profit') {
            o.actual = lastFin?.net ?? 0;
            o.achieved = (lastFin?.net ?? 0) >= o.target;
        }
        else if (o.id === 'attendance') {
            o.actual = lastFin?.attendance ?? 0;
            o.achieved = (lastFin?.attendance ?? 0) >= o.target;
        }
        netDelta += o.achieved
            ? OBJECTIVE_REWARDS[o.id]
            : -OBJECTIVE_PENALTIES[o.id];
    }
    state.jobSecurity = Math.max(-20, Math.min(100, (state.jobSecurity ?? 50) + netDelta));
    // Track history
    state.jobSecurityHistory = state.jobSecurityHistory || [];
    state.jobSecurityHistory.push({
        season: obj.season,
        security: state.jobSecurity,
        objectives: obj.objectives.map((o) => ({ ...o })),
    });
    const hitCount = obj.objectives.filter((o) => o.achieved).length;
    const totalCount = obj.objectives.length;
    // News: report card
    state.news.unshift({
        id: `objreport_${obj.season}`,
        day: state.day,
        season: state.season,
        headline: `Board review: ${hitCount}/${totalCount} objectives met (${netDelta >= 0 ? '+' : ''}${netDelta} security)`,
        body: obj.objectives
            .map((o) => `${o.achieved ? '✓' : '✗'} ${o.label} — ${o.id === 'profit' || o.id === 'attendance' ? '' : o.actual}`)
            .join(' · '),
        category: 'team',
    });
    // Fire check — only applies in GM mode. Owners (default) can't be fired:
    // job security still tracks owner satisfaction but doesn't end your tenure.
    const isGmMode = state.playMode === 'gm';
    if (isGmMode && state.jobSecurity < 0 && !state.fired) {
        state.fired = true;
        state.unemployedSince = state.season;
        const rng = new RNG(state.rngState ^ 0xfeedface);
        generateGMJobOffers(state, rng);
        state.news.unshift({
            id: `fired_${obj.season}`,
            day: state.day,
            season: state.season,
            headline: 'Ownership terminates the front office — you have been fired',
            body: `After failing to deliver on the board's expectations, your tenure with the ${f.city} ${f.name} comes to an end. Final job security: ${state.jobSecurity}.`,
            category: 'team',
        });
    }
    else if (!isGmMode && state.jobSecurity < 0) {
        // Owner mode: clamp at 0 and log a "rough season" item but don't fire
        state.jobSecurity = Math.max(0, state.jobSecurity);
        state.news.unshift({
            id: `disappointing_${obj.season}`,
            day: state.day,
            season: state.season,
            headline: `${f.city} owner disappointed in season ${obj.season}`,
            body: 'Stakeholders demand a turnaround. As owner you remain in charge - but the spotlight is hot.',
            category: 'team',
        });
    }
    else if (state.jobSecurity < 25 && !state.fired) {
        state.news.unshift({
            id: `warning_${obj.season}`,
            day: state.day,
            season: state.season,
            headline: `Hot seat alert - ownership warns of potential dismissal`,
            body: `Your job security has dropped to ${state.jobSecurity}/100. The board expects significant improvement next season.`,
            category: 'team',
        });
    }
}
