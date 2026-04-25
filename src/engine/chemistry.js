// Team chemistry / clubhouse leaders.
// Chemistry is a 0-100 scalar that slightly modifies team strength, nudged up
// by veteran leaders (age >= 30, rating >= 55) and shaken by collective streak
// volatility.
import { FRANCHISES } from './franchises';
export function initChemistry(state) {
    state.chemistry = state.chemistry || {};
    for (const fid of Object.keys(FRANCHISES)) {
        if (!state.chemistry[fid]) {
            state.chemistry[fid] = { value: 55, leaders: [] };
        }
        recomputeLeaders(state, fid);
    }
}
export function recomputeLeaders(state, fid) {
    if (!state.chemistry)
        state.chemistry = {};
    const chem = state.chemistry[fid] = state.chemistry[fid] || { value: 55, leaders: [] };
    const leaders = state.rosters[fid]
        .map((id) => state.players[id])
        .filter((p) => p && !p.injury && p.age >= 30 && p.ratings.overall >= 55)
        .sort((a, b) => b.age - a.age)
        .slice(0, 3)
        .map((p) => p.id);
    chem.leaders = leaders;
}
/** Weekly tick. Veteran leaders slowly raise chemistry; volatility drops it. */
export function updateWeeklyChemistry(state, _rng) {
    if (!state.chemistry)
        initChemistry(state);
    for (const fid of Object.keys(FRANCHISES)) {
        recomputeLeaders(state, fid);
        const chem = state.chemistry[fid];
        // Leader influence — each leader nudges chemistry toward 70.
        const target = 55 + chem.leaders.length * 5;
        chem.value += Math.sign(target - chem.value) * 0.8;
        // Mean-revert slightly toward 55.
        chem.value += (55 - chem.value) * 0.04;
        // Hot streaks lift chemistry, cold streaks drag it down.
        const streakSum = state.rosters[fid]
            .map((id) => state.players[id]?.streakMod || 0)
            .reduce((s, m) => s + m, 0);
        chem.value += Math.max(-2, Math.min(2, streakSum / 30));
        chem.value = Math.max(0, Math.min(100, Math.round(chem.value * 10) / 10));
    }
}
/**
 * Returns a multiplier in ~0.97–1.03 range applied to team strength.
 * Chemistry 55 is neutral (1.00).
 */
export function chemistryMultiplier(state, fid) {
    const c = state.chemistry?.[fid];
    if (!c)
        return 1.0;
    const delta = (c.value - 55) / 100; // -0.55 to +0.45 scaled
    return 1 + delta * 0.055; // ~±3%
}
/** Called at season rollover — fade chemistry back toward neutral and update leaders. */
export function chemistrySeasonReset(state) {
    if (!state.chemistry)
        return;
    for (const fid of Object.keys(FRANCHISES)) {
        const c = state.chemistry[fid];
        if (!c)
            continue;
        c.value = Math.round(55 + (c.value - 55) * 0.35); // heavy mean-revert
        recomputeLeaders(state, fid);
    }
}
export function leaderLabel(state) {
    if (!state)
        return '—';
    const v = state.value;
    if (v >= 80)
        return 'Elite';
    if (v >= 70)
        return 'Strong';
    if (v >= 60)
        return 'Good';
    if (v >= 45)
        return 'Neutral';
    if (v >= 30)
        return 'Tense';
    return 'Toxic';
}
