// Depth charts + bullpen role assignment per franchise.
// Auto-fills from current roster but user can reorder via UI.

import type { GameState, Player } from './types';
import { FRANCHISES } from './franchises';

const HITTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;

export function emptyDepthChart(): Record<string, string[]> {
  const chart: Record<string, string[]> = {};
  for (const pos of HITTER_POSITIONS) chart[pos] = [];
  chart.SP = [];
  chart.RP = [];
  return chart;
}

/** Auto-fill depth chart from active roster, sorting by OVR per position. */
export function autoFillDepthChart(state: GameState, fid: string) {
  state.depthCharts = state.depthCharts || {};
  const chart = state.depthCharts[fid] = state.depthCharts[fid] || emptyDepthChart();
  const roster = state.rosters[fid] || [];
  const players = roster.map((id) => state.players[id]).filter(Boolean);

  for (const pos of HITTER_POSITIONS) {
    chart[pos] = players
      .filter((p) => !p.isPitcher && p.pos === pos)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .map((p) => p.id);
  }
  chart.SP = players.filter((p) => p.pos === 'SP')
    .sort((a, b) => b.ratings.overall - a.ratings.overall).map((p) => p.id);
  chart.RP = players.filter((p) => ['RP', 'CL'].includes(p.pos))
    .sort((a, b) => b.ratings.overall - a.ratings.overall).map((p) => p.id);
}

/** Auto-assign bullpen roles based on rating + position. */
export function assignBullpenRoles(state: GameState, fid: string) {
  const roster = (state.rosters[fid] || []).map((id) => state.players[id]).filter(Boolean);
  const pitchers = roster.filter((p) => ['RP', 'CL'].includes(p.pos));

  // Closer: existing CL or top RP
  const cl = pitchers.find((p) => p.pos === 'CL') ||
             pitchers.sort((a, b) => b.ratings.overall - a.ratings.overall)[0];
  if (cl) cl.bullpenRole = 'closer';

  const remaining = pitchers
    .filter((p) => p.id !== cl?.id)
    .sort((a, b) => b.ratings.overall - a.ratings.overall);

  // Top 2 → setup
  for (let i = 0; i < Math.min(2, remaining.length); i++) {
    remaining[i].bullpenRole = 'setup';
  }

  // LOOGY: best LHP after setups
  const lhp = remaining.slice(2).find((p) => p.throws === 'L');
  if (lhp) lhp.bullpenRole = 'loogy';

  // Rest → middle
  for (const p of remaining.slice(2)) {
    if (p.id === lhp?.id) continue;
    p.bullpenRole = 'middle';
  }
}

export function setUserDepthAt(state: GameState, fid: string, pos: string, orderedIds: string[]) {
  state.depthCharts = state.depthCharts || {};
  state.depthCharts[fid] = state.depthCharts[fid] || emptyDepthChart();
  state.depthCharts[fid][pos] = orderedIds;
}

export function setBullpenRoleAction(state: GameState, playerId: string, role: 'closer' | 'setup' | 'middle' | 'loogy') {
  const p = state.players[playerId];
  if (!p) return { ok: false, reason: 'no player' };
  if (!['RP', 'CL'].includes(p.pos)) return { ok: false, reason: 'not a reliever' };
  p.bullpenRole = role;
  return { ok: true };
}

/** Initialize all teams' depth charts at world init. */
export function initAllDepthCharts(state: GameState) {
  state.depthCharts = state.depthCharts || {};
  state.fortyMan = state.fortyMan || {};
  for (const fid of Object.keys(FRANCHISES)) {
    autoFillDepthChart(state, fid);
    assignBullpenRoles(state, fid);
    // Start with all rostered players + top 14 minor leaguers on the 40-man
    const active = state.rosters[fid] || [];
    const aaa = state.minorRosters?.[fid]?.aaa || [];
    const topMinors = aaa
      .map((id) => state.players[id])
      .filter(Boolean)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 14)
      .map((p) => p.id);
    state.fortyMan[fid] = [...active.slice(0, 26), ...topMinors];
    // Mark them
    for (const pid of state.fortyMan[fid]) {
      const p = state.players[pid];
      if (p) p.onFortyMan = true;
    }
  }
}
