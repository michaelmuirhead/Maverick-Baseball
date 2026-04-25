// Sabermetric metric calculators. Computed at season finalization or on demand
// from raw counting stats.
const DEFAULT_LEAGUE = {
    OPS: 0.730, ERA: 4.20, AVG: 0.252, OBP: 0.320, SLG: 0.410,
};
export function computeLeagueAverages(state) {
    let totalAB = 0, totalH = 0, totalBB = 0, total1B = 0, total2B = 0, total3B = 0, totalHR = 0;
    let totalIP = 0, totalER = 0;
    for (const p of Object.values(state.players)) {
        if (p.retired)
            continue;
        const last = p.statsHistory?.find((s) => s.season === state.season);
        if (!last)
            continue;
        if (last.hitter) {
            totalAB += last.hitter.AB;
            totalH += last.hitter.H;
            totalBB += last.hitter.BB;
            total2B += last.hitter.D;
            total3B += last.hitter.T;
            totalHR += last.hitter.HR;
            total1B += last.hitter.H - last.hitter.D - last.hitter.T - last.hitter.HR;
        }
        if (last.pitcher) {
            totalIP += last.pitcher.IP;
            totalER += last.pitcher.ER;
        }
    }
    if (totalAB === 0)
        return DEFAULT_LEAGUE;
    const AVG = totalH / totalAB;
    const PA = totalAB + totalBB;
    const OBP = (totalH + totalBB) / Math.max(1, PA);
    const TB = total1B + 2 * total2B + 3 * total3B + 4 * totalHR;
    const SLG = TB / totalAB;
    const ERA = totalIP > 0 ? (totalER * 9 / totalIP) : DEFAULT_LEAGUE.ERA;
    return {
        OPS: Math.round((OBP + SLG) * 1000) / 1000,
        ERA: Math.round(ERA * 100) / 100,
        AVG: Math.round(AVG * 1000) / 1000,
        OBP: Math.round(OBP * 1000) / 1000,
        SLG: Math.round(SLG * 1000) / 1000,
    };
}
/** wOBA: weighted on-base avg. Approximation. */
export function woba(h) {
    const single = h.H - h.D - h.T - h.HR;
    const PA = h.AB + h.BB;
    if (PA === 0)
        return 0;
    // Linear-weights coefficients (close to 2024 MLB)
    const weighted = 0.69 * h.BB + 0.88 * single + 1.25 * h.D + 1.58 * h.T + 2.04 * h.HR;
    return Math.round(weighted / PA * 1000) / 1000;
}
/** BABIP: hits-on-balls-in-play. */
export function babip(h) {
    const denom = h.AB - h.SO - h.HR + h.T; // approx (+SF; we don't track SF)
    if (denom <= 0)
        return 0;
    return Math.round((h.H - h.HR) / denom * 1000) / 1000;
}
/** ISO: pure power. */
export function iso(h) {
    return Math.round((h.SLG - h.AVG) * 1000) / 1000;
}
/** OPS+: 100 = league avg. (player_OPS / lg_OPS) * 100, with park-neutral assumption. */
export function opsPlus(h, lg) {
    if (h.OPS === 0 || lg.OPS === 0)
        return 0;
    // Standard formula: 100*(OBP/lgOBP + SLG/lgSLG - 1)
    const v = 100 * (h.OBP / lg.OBP + h.SLG / lg.SLG - 1);
    return Math.round(v);
}
/** ERA+: 100 = league avg. (lg_ERA / player_ERA) * 100. */
export function eraPlus(p, lg) {
    if (p.ERA === 0 || p.IP === 0)
        return 0;
    const v = 100 * (lg.ERA / p.ERA);
    return Math.round(v);
}
/** FIP: defense-independent ERA. (13*HR + 3*BB - 2*K) / IP + constant */
export function fip(p, lg) {
    if (p.IP === 0)
        return 0;
    // Constant chosen so league FIP ~= league ERA
    const c = 3.10;
    const v = (13 * p.HR + 3 * p.BB - 2 * p.SO) / p.IP + c;
    return Math.round(v * 100) / 100;
}
/** Crude WAR: above-replacement. Combine wOBA-derived offense + IP-derived pitching. */
export function hitterWAR(h, lg) {
    if (h.AB < 50)
        return 0;
    // Calibrated so OPS+ ~200 maps to ~9 WAR over a full 600 PA season
    const wRC_per_PA = (h.OBP / lg.OBP + h.SLG / lg.SLG - 1.7);
    const PA = h.AB + h.BB;
    const oWAR = wRC_per_PA * PA / 110 + (PA / 600) * 1.5;
    return Math.round(oWAR * 10) / 10;
}
export function pitcherWAR(p, lg) {
    if (p.IP < 20)
        return 0;
    // Replacement-level ERA: lg + 1.20
    const replERA = lg.ERA + 1.20;
    const runsAvoided = (replERA - p.ERA) * p.IP / 9;
    // 10 runs ~ 1 WAR
    return Math.round(runsAvoided / 10 * 10) / 10;
}
/** Apply all advanced metrics to a single SeasonStats entry. */
export function attachAdvanced(season, lg, hStats, pStats) {
    if (hStats && hStats.AB > 0) {
        hStats.BABIP = babip(hStats);
        hStats.ISO = iso(hStats);
        hStats.wOBA = woba(hStats);
        hStats.OPSplus = opsPlus(hStats, lg);
        hStats.WAR = hitterWAR(hStats, lg);
    }
    if (pStats && pStats.IP > 0) {
        pStats.FIP = fip(pStats, lg);
        pStats.ERAplus = eraPlus(pStats, lg);
        pStats.WAR = pitcherWAR(pStats, lg);
        pStats.K9 = Math.round(pStats.SO * 9 / Math.max(1, pStats.IP) * 10) / 10;
        pStats.BB9 = Math.round(pStats.BB * 9 / Math.max(1, pStats.IP) * 10) / 10;
    }
}
/** Recompute advanced metrics for every player's current-season stat line. Called at season finalization. */
export function recomputeAllAdvanced(state) {
    const lg = computeLeagueAverages(state);
    state.leagueAverages = state.leagueAverages || {};
    state.leagueAverages[state.season] = lg;
    for (const p of Object.values(state.players)) {
        if (p.retired)
            continue;
        const ss = p.statsHistory?.find((s) => s.season === state.season);
        if (!ss)
            continue;
        attachAdvanced(state.season, lg, ss.hitter, ss.pitcher);
    }
}
