export function hasFullNoTrade(c) {
    if (!c?.clauses)
        return !!c?.ntc;
    return !!(c.clauses.noTradeFull || c.clauses.tenFiveRights);
}
export function blocksTradeTo(c, destFranchiseId) {
    if (!c)
        return false;
    if (hasFullNoTrade(c))
        return true;
    if (c.clauses?.noTradeList?.includes(destFranchiseId))
        return true;
    return false;
}
export function checkTenFiveRights(p) {
    const c = p.contract;
    if (!c)
        return false;
    return (c.serviceDays || 0) >= 162 * 10;
}
function estimateMarketAAV(ovr) {
    if (ovr < 50)
        return 1_000_000;
    return Math.round(1_000_000 + Math.pow(ovr - 49, 2.4) * 25_000);
}
export function resolvePlayerOptions(state, _rng) {
    const players = { ...state.players };
    for (const id of Object.keys(players)) {
        const p = players[id];
        const opt = p.contract?.clauses?.playerOption;
        if (!opt)
            continue;
        if (opt.exercised !== undefined && opt.exercised !== null)
            continue;
        if (opt.yearOffset > 0)
            continue;
        const ovr = p.ratings.overall || 50;
        const marketAAV = estimateMarketAAV(ovr);
        const exercise = opt.salary > marketAAV * 0.95;
        const newOpt = { ...opt, exercised: exercise };
        const newClauses = { ...(p.contract.clauses || {}), playerOption: newOpt };
        let newContract = { ...p.contract, clauses: newClauses };
        if (!exercise)
            newContract = { ...newContract, status: 'fa', years: 0 };
        else
            newContract = { ...newContract, salary: opt.salary, years: 1 };
        players[id] = { ...p, contract: newContract };
    }
    return { ...state, players };
}
export function resolveOptOuts(state, _rng) {
    const players = { ...state.players };
    for (const id of Object.keys(players)) {
        const p = players[id];
        const oo = p.contract?.clauses?.optOut;
        if (!oo || oo.used)
            continue;
        if (oo.yearOffset > 0)
            continue;
        const ovr = p.ratings.overall || 50;
        const marketAAV = estimateMarketAAV(ovr);
        const remaining = (p.contract.years || 0) * (p.contract.salary || 0);
        const ifReplace = marketAAV * (p.contract.years || 1);
        if (ifReplace > remaining * 1.10) {
            players[id] = {
                ...p,
                contract: {
                    ...p.contract,
                    status: 'fa',
                    years: 0,
                    clauses: { ...(p.contract.clauses || {}), optOut: { ...oo, used: true } },
                },
            };
        }
    }
    return { ...state, players };
}
export function applyPerformanceBonuses(state) {
    const payouts = [];
    for (const p of Object.values(state.players)) {
        const bonuses = p.contract?.clauses?.perfBonuses;
        if (!bonuses?.length)
            continue;
        const last = (p.statsHistory || [])[(p.statsHistory || []).length - 1];
        if (!last)
            continue;
        let total = 0;
        for (const b of bonuses) {
            let hit = false;
            if (b.metric === 'AB' && (last.hitter?.AB ?? 0) >= b.threshold)
                hit = true;
            if (b.metric === 'IP' && (last.pitcher?.IP ?? 0) >= b.threshold)
                hit = true;
            if (b.metric === 'GS' && (last.pitcher?.GS ?? 0) >= b.threshold)
                hit = true;
            if (hit)
                total += b.bonus;
        }
        if (total > 0)
            payouts.push({ playerId: p.id, bonus: total });
    }
    const finances = { ...state.finances };
    for (const pay of payouts) {
        const pl = state.players[pay.playerId];
        if (!pl?.franchiseId)
            continue;
        const f = finances[pl.franchiseId];
        if (f) {
            finances[pl.franchiseId] = {
                ...f,
                teamCash: f.teamCash - pay.bonus,
                ledger: { ...f.ledger, payroll: f.ledger.payroll + pay.bonus },
            };
        }
    }
    return { state: { ...state, finances }, payouts };
}
export function processDeferredPayments(state) {
    const finances = { ...state.finances };
    for (const p of Object.values(state.players)) {
        const def = p.contract?.clauses?.deferred;
        if (!def)
            continue;
        const startYr = def.startYear ?? state.season;
        if (state.season >= startYr && state.season < startYr + def.payoutYears) {
            if (p.franchiseId && finances[p.franchiseId]) {
                const f = finances[p.franchiseId];
                finances[p.franchiseId] = {
                    ...f,
                    teamCash: f.teamCash - def.perYear,
                    ledger: { ...f.ledger, payroll: f.ledger.payroll + def.perYear },
                };
            }
        }
    }
    return { ...state, finances };
}
export function processInjuryInsurance(state) {
    const refunds = [];
    const finances = { ...state.finances };
    for (const p of Object.values(state.players)) {
        const ins = p.contract?.clauses?.insurance;
        if (!ins?.activatesOnIL60 || p.health !== 'il_60' || !p.franchiseId)
            continue;
        const sal = p.contract?.salary ?? 0;
        const refund = Math.round((sal * ins.coveragePct) / 162);
        if (refund > 0 && finances[p.franchiseId]) {
            const f = finances[p.franchiseId];
            finances[p.franchiseId] = { ...f, teamCash: f.teamCash + refund };
            refunds.push({ playerId: p.id, amount: refund });
        }
    }
    return { state: { ...state, finances }, refunds };
}
export function attachClausesForSigning(p, years, aav, rng) {
    const clauses = {};
    const ovr = p.ratings.overall || 50;
    if (checkTenFiveRights(p))
        clauses.tenFiveRights = true;
    if (ovr >= 75 && years >= 4 && rng.next() < 0.4)
        clauses.noTradeFull = true;
    if (ovr >= 70 && years >= 4 && rng.next() < 0.5) {
        clauses.optOut = { yearOffset: Math.floor(years / 2) };
    }
    if (ovr >= 60 && rng.next() < 0.4) {
        clauses.perfBonuses = p.isPitcher
            ? [{ metric: 'IP', threshold: 180, bonus: 500_000 }, { metric: 'GS', threshold: 30, bonus: 250_000 }]
            : [{ metric: 'AB', threshold: 500, bonus: 500_000 }];
    }
    if (years >= 6 && aav >= 25_000_000 && rng.next() < 0.3) {
        clauses.deferred = { perYear: Math.round(aav * 0.15), payoutYears: years + 5 };
    }
    if (aav >= 15_000_000) {
        clauses.insurance = { coveragePct: 0.8, activatesOnIL60: true };
    }
    return clauses;
}
export function describeClauses(c) {
    if (!c)
        return [];
    const out = [];
    if (c.tenFiveRights)
        out.push('10/5 rights');
    if (c.noTradeFull)
        out.push('Full no-trade');
    if (c.noTradeList?.length)
        out.push(`Limited NTC (${c.noTradeList.length})`);
    if (c.playerOption)
        out.push(`Player option yr +${c.playerOption.yearOffset} ($${(c.playerOption.salary / 1e6).toFixed(1)}M)`);
    if (c.mutualOption)
        out.push(`Mutual option yr +${c.mutualOption.yearOffset}`);
    if (c.optOut)
        out.push(`Opt-out after yr +${c.optOut.yearOffset}`);
    if (c.perfBonuses?.length)
        out.push(`${c.perfBonuses.length} perf bonus(es)`);
    if (c.deferred)
        out.push(`Deferred $${(c.deferred.perYear / 1e6).toFixed(1)}M/yr x ${c.deferred.payoutYears}`);
    if (c.insurance)
        out.push(`Insurance ${Math.round(c.insurance.coveragePct * 100)}%`);
    return out;
}
