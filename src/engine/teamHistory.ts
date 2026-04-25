// Per-team season history recorder.
// Called at season finalization; also updated when a champion is crowned.

import type { GameState, TeamSeasonRecord } from './types';
import { FRANCHISES } from './franchises';

export function recordSeasonForAllTeams(state: GameState) {
  state.teamHistory = state.teamHistory || {};
  for (const fid of Object.keys(FRANCHISES)) {
    const standing = state.standings[fid];
    if (!standing) continue;
    const fin = state.finances[fid];
    const payroll = state.rosters[fid].reduce(
      (s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0,
    );

    // Determine playoff result from this season's bracket
    let playoffResult: TeamSeasonRecord['playoff_result'] | undefined;
    let madePlayoffs = false;
    let champion = false;
    const bracket = state.bracket;
    if (bracket) {
      const allSeeds = [...bracket.seeds.AL, ...bracket.seeds.NL];
      if (allSeeds.some((s) => s.id === fid)) {
        madePlayoffs = true;
        if (bracket.champion === fid) { playoffResult = 'champion'; champion = true; }
        else {
          // Find the last series they played in
          const series = Object.values(bracket.series)
            .filter((s) => s.higherSeed?.id === fid || s.lowerSeed?.id === fid)
            .sort((a, b) => {
              const order = { wild_card: 0, division: 1, lcs: 2, world_series: 3 };
              return order[b.round] - order[a.round];
            });
          const last = series[0];
          if (last) {
            if (last.round === 'world_series') playoffResult = 'ws_loss';
            else if (last.round === 'lcs') playoffResult = 'lcs_out';
            else if (last.round === 'division') playoffResult = 'ds_out';
            else playoffResult = 'wc_out';
          }
        }
      }
    }

    const lastFinance = fin?.history[fin.history.length - 1];
    const history = state.teamHistory[fid] = state.teamHistory[fid] || [];
    // Avoid double-recording same season
    if (history.some((r) => r.season === state.season)) continue;
    const entry: TeamSeasonRecord = {
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

export function championsList(state: GameState): TeamSeasonRecord[] {
  if (!state.teamHistory) return [];
  const out: TeamSeasonRecord[] = [];
  for (const fid of Object.keys(state.teamHistory)) {
    for (const entry of state.teamHistory[fid]) {
      if (entry.champion) {
        out.push({ ...entry, season: entry.season });
      }
    }
  }
  return out.sort((a, b) => b.season - a.season);
}

export function franchiseHistory(state: GameState, fid: string): TeamSeasonRecord[] {
  return state.teamHistory?.[fid] || [];
}
