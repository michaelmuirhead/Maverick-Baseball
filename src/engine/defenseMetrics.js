export function computeDefensiveMetrics(p, inningsByPos) {
    const r = p.ratings;
    const fld = r.fielding ?? 50;
    const arm = r.armStr ?? r.fielding ?? 50;
    const range = r.speed ?? 50;
    const totalIP = Object.values(inningsByPos).reduce((a, b) => a + (b || 0), 0);
    if (totalIP <= 0)
        return {};
    const ipShare = totalIP / 1300;
    const fieldComp = (fld - 50) * 0.6;
    const rangeComp = (range - 50) * 0.3;
    const armComp = (arm - 50) * 0.2;
    const drs = Math.round((fieldComp + rangeComp + armComp) * ipShare);
    const uzr = Math.round(drs * 0.85);
    const oaa = Math.round(drs * 0.95);
    const errorsExpected = Math.max(0, Math.round((50 - fld) * 0.2 * ipShare * 5));
    const fieldingPct = Math.max(0.95, Math.min(1.0, 0.99 - errorsExpected * 0.001));
    const rangeFactor = (range / 50) * 4.5;
    const out = {
        inningsPlayed: inningsByPos,
        drs, uzr, oaa,
        rangeFactor: parseFloat(rangeFactor.toFixed(2)),
        fieldingPct: parseFloat(fieldingPct.toFixed(3)),
        errors: errorsExpected,
    };
    if (p.pos === 'C') {
        out.catcherFraming = Math.round(((fld - 50) * 0.4 + (arm - 50) * 0.1) * ipShare);
        out.catcherBlocking = Math.round((fld - 50) * 0.2 * ipShare);
        out.catcherThrowing = Math.round(20 + ((arm - 50) * 0.6 + (fld - 50) * 0.2));
    }
    return out;
}
export function rollSeasonDefensiveMetrics(state) {
    const players = { ...state.players };
    for (const id of Object.keys(players)) {
        const p = players[id];
        if (p.retired || !p.franchiseId)
            continue;
        if (p.isPitcher && p.pos !== 'C')
            continue;
        const last = (p.statsHistory || [])[(p.statsHistory || []).length - 1];
        if (!last?.hitter)
            continue;
        const games = last.hitter.G || 0;
        if (games < 30)
            continue;
        const ip = games * 8.5;
        const inningsByPos = { [p.pos]: ip };
        const dm = computeDefensiveMetrics(p, inningsByPos);
        players[id] = { ...p, defensiveMetrics: dm };
    }
    return { ...state, players };
}
export function catcherEffectFor(state, franchiseId) {
    const catchers = Object.values(state.players).filter(p => p.franchiseId === franchiseId && p.pos === 'C' && !p.retired && !p.injury);
    if (catchers.length === 0)
        return { framing: 0, blocking: 0, throwing: 22 };
    catchers.sort((a, b) => (b.ratings.overall || 0) - (a.ratings.overall || 0));
    const top = catchers[0];
    const r = top.ratings;
    const fld = r.fielding ?? 50;
    const arm = r.armStr ?? 50;
    return {
        framing: Math.round((fld - 50) * 0.5),
        blocking: Math.round((fld - 50) * 0.3),
        throwing: Math.round(22 + (arm - 50) * 0.5),
    };
}
export function outfieldArmFor(state, franchiseId) {
    const ofs = Object.values(state.players).filter(p => p.franchiseId === franchiseId && (p.pos === 'LF' || p.pos === 'CF' || p.pos === 'RF') && !p.retired && !p.injury);
    if (ofs.length === 0)
        return 50;
    const avgArm = ofs.reduce((s, p) => s + (p.ratings.armStr || 50), 0) / ofs.length;
    return avgArm;
}
