// ============================================================
// Hot/cold streaks
// ============================================================
// Per-player `streakMod` drifts via small random walk weekly during regular
// season. Range -8 to +8 OVR. Applied transparently in teamStrength via
// effectiveOverall().
const STREAK_MAX = 8;
/**
 * Update streaks weekly (called every 7 days during regular season).
 * For each healthy player on a roster, drift streakMod by a small amount
 * with mean reversion toward 0.
 */
export function updateWeeklyStreaks(state, rng) {
    for (const fid of Object.keys(state.rosters)) {
        for (const pid of state.rosters[fid]) {
            const p = state.players[pid];
            if (!p)
                continue;
            const cur = p.streakMod ?? 0;
            // Mean-reverting random walk: pull toward 0, plus noise
            const drift = -cur * 0.25 + rng.normal(0, 2.5);
            const next = cur + drift;
            p.streakMod = Math.max(-STREAK_MAX, Math.min(STREAK_MAX, Math.round(next)));
        }
    }
}
/** Reset all streaks (called at season rollover so they don't carry across). */
export function resetStreaks(state) {
    for (const pid of Object.keys(state.players)) {
        if (state.players[pid].streakMod)
            state.players[pid].streakMod = 0;
    }
}
/** Returns the player's effective OVR including streak modifier. Used in sim.ts. */
export function effectiveOverall(p) {
    return Math.max(20, Math.min(99, (p.ratings.overall) + (p.streakMod ?? 0)));
}
/** Streak label for UI display. */
export function streakLabel(streakMod) {
    if (!streakMod)
        return 'Even';
    if (streakMod >= 5)
        return '🔥 Hot';
    if (streakMod >= 2)
        return 'Warm';
    if (streakMod <= -5)
        return '❄️ Cold';
    if (streakMod <= -2)
        return 'Cool';
    return 'Even';
}
