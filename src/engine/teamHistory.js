import { FRANCHISES } from './franchises';
export function recordChampion(state) {
    if (!state.bracket || !state.bracket.champion)
        return;
    state.championHistory = state.championHistory || [];
    if (state.championHistory.some((c) => c.season === state.season))
        return;
    const championFid = state.bracket.champion;
    const standing = state.standings[championFid];
    const defeated = [];
    for (const series of Object.values(state.bracket.series)) {
        if (series.winner !== championFid)
            continue;
        const opponent = series.higherSeed?.id === championFid ? series.lowerSeed : series.higherSeed;
        if (!opponent)
            continue;
        const championWasHigher = series.higherSeed?.id === championFid;
        defeated.push({
            round: series.round,
            opponentFid: opponent.id,
            gamesWon: championWasHigher ? series.higherWins : series.lowerWins,
            gamesLost: championWasHigher ? series.lowerWins : series.higherWins,
        });
    }
    const order = { wild_card: 0, division: 1, lcs: 2, world_series: 3 };
    defeated.sort((a, b) => order[a.round] - order[b.round]);
    state.championHistory.push({
        season: state.season,
        championFid,
        wins: standing?.wins ?? 0,
        losses: standing?.losses ?? 0,
        defeated,
    });
}
export function recordSeasonForAllTeams(state) {
    state.teamHistory = state.teamHistory || {};
    for (const fid of Object.keys(FRANCHISES)) {
        const standing = state.standings[fid];
        if (!standing)
            continue;
        const fin = state.finances[fid];
        const payroll = state.rosters[fid].reduce((s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0);
        let playoffResult;
        let madePlayoffs = false;
        let champion = false;
        const bracket = state.bracket;
        if (bracket) {
            const allSeeds = [...bracket.seeds.AL, ...bracket.seeds.NL];
            if (allSeeds.some((s) => s.id === fid)) {
                madePlayoffs = true;
                if (bracket.champion === fid) {
                    playoffResult = 'champion';
                    champion = true;
                }
                else {
                    const series = Object.values(bracket.series)
                        .filter((s) => s.higherSeed?.id === fid || s.lowerSeed?.id === fid)
                        .sort((a, b) => {
                        const order = { wild_card: 0, division: 1, lcs: 2, world_series: 3 };
                        return order[b.round] - order[a.round];
                    });
                    const last = series[0];
                    if (last) {
                        if (last.round === 'world_series')
                            playoffResult = 'ws_loss';
                        else if (last.round === 'lcs')
                            playoffResult = 'lcs_out';
                        else if (last.round === 'division')
                            playoffResult = 'ds_out';
                        else
                            playoffResult = 'wc_out';
                    }
                }
            }
        }
        const lastFinance = fin?.history[fin.history.length - 1];
        const history = state.teamHistory[fid] = state.teamHistory[fid] || [];
        if (history.some((r) => r.season === state.season))
            continue;
        const entry = {
            season: state.season,
            wins: standing.wins,
            losses: standing.losses,
            payroll,
            made_playoffs: madePlayoffs,
            playoff_result: playoffResult,
            champion,
            revenue: lastFinance?.revenue,
            expenses: lastFinance?.expenses,
            net: lastFinance?.net,
            jobSecurityEnd: fid === state.userFranchiseId ? state.jobSecurity : undefined,
        };
        history.push(entry);
    }
}
export function championsList(state) {
    if (!state.teamHistory)
        return [];
    const out = [];
    for (const fid of Object.keys(state.teamHistory)) {
        for (const entry of state.teamHistory[fid]) {
            if (entry.champion) {
                out.push({ ...entry, season: entry.season });
            }
        }
    }
    return out.sort((a, b) => b.season - a.season);
}
export function franchiseHistory(state, fid) {
    return state.teamHistory?.[fid] || [];
}
