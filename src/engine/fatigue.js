// Pitcher fatigue tracking. Updated every game appearance via sim.
// Fatigue penalty: 0 if rested, -3 OVR if appeared yesterday, -8 if back-to-back-to-back.
// Pinch-hit/run usage tracked too but currently advisory.
export function ensureFatigue(p) {
    if (!p.fatigue)
        p.fatigue = { lastAppearance: -999, consecutiveDays: 0, pitchCount: 0 };
}
export function recordAppearance(p, day, pitchCount = 0) {
    ensureFatigue(p);
    if (p.fatigue.lastAppearance === day - 1) {
        p.fatigue.consecutiveDays += 1;
    }
    else if (p.fatigue.lastAppearance < day - 1) {
        p.fatigue.consecutiveDays = 1;
    }
    p.fatigue.lastAppearance = day;
    p.fatigue.pitchCount = pitchCount;
}
/** Effective overall rating after fatigue penalty. */
export function effectiveOvrWithFatigue(p, currentDay) {
    ensureFatigue(p);
    const f = p.fatigue;
    const daysSince = currentDay - f.lastAppearance;
    let penalty = 0;
    if (daysSince === 1) {
        if (f.consecutiveDays >= 2)
            penalty = 8;
        else
            penalty = 3;
    }
    else if (daysSince === 2 && f.consecutiveDays >= 2) {
        penalty = 4;
    }
    // SP need 4 days rest
    if (p.pos === 'SP' && daysSince < 4) {
        penalty = Math.max(penalty, 12);
    }
    return Math.max(20, p.ratings.overall - penalty);
}
/** Daily decay: reset consecutiveDays if rested 2+ days. */
export function decayFatigue(state) {
    for (const pid of Object.keys(state.players)) {
        const p = state.players[pid];
        if (!p.fatigue)
            continue;
        const daysSince = state.day - p.fatigue.lastAppearance;
        if (daysSince >= 3)
            p.fatigue.consecutiveDays = 0;
    }
}
