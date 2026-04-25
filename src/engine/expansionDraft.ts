// ============================================================
// Expansion Draft
// ============================================================
// Real MLB expansion runs an "expansion draft" where new clubs select
// unprotected players from existing rosters. Each existing team protects a
// list of their best, leaving the rest exposed. New teams alternately pick.
//
// Our model:
//   - Each existing team protects 11 best hitters + 10 best pitchers (~21 of 25).
//   - The remaining ~4-5 players per team form the unprotected pool (~120-150 across the league).
//   - Each expansion team makes 8 picks in alternating order (16 players moved total).
//   - Picked players join expansion roster, replacing the lowest-OVR generated cap-62 player.
//   - News items announce the draft and major picks.
//
// Triggered once at world init when scenario === 'expansion'.

import type { RNG } from './rng';
import type { GameState, Player } from './types';
import { FRANCHISES } from './franchises';

const PROTECTED_HITTERS = 6;
const PROTECTED_PITCHERS = 5;
const PICKS_PER_EXPANSION_TEAM = 12;

/**
 * Run the expansion draft. Mutates state in place.
 *
 * @param state         The freshly-initialized world state
 * @param expansionFids The 1-2 expansion franchise IDs (e.g. ['exp_user', 'exp_auto'])
 * @param rng           Seeded RNG for ordering ties
 */
export function runExpansionDraft(state: GameState, expansionFids: string[], rng: RNG) {
  if (expansionFids.length === 0) return;

  // Collect unprotected players from each existing (non-expansion) team
  const unprotected: { fromFid: string; player: Player }[] = [];
  for (const fid of Object.keys(FRANCHISES)) {
    if (FRANCHISES[fid].expansion) continue;       // skip expansion teams themselves

    const roster = state.rosters[fid].map((pid) => state.players[pid]).filter(Boolean);
    const hitters = roster.filter((p) => !p.isPitcher).sort((a, b) => b.ratings.overall - a.ratings.overall);
    const pitchers = roster.filter((p) => p.isPitcher).sort((a, b) => b.ratings.overall - a.ratings.overall);

    const protectedIds = new Set<string>([
      ...hitters.slice(0, PROTECTED_HITTERS).map((p) => p.id),
      ...pitchers.slice(0, PROTECTED_PITCHERS).map((p) => p.id),
    ]);

    for (const p of roster) {
      if (!protectedIds.has(p.id)) unprotected.push({ fromFid: fid, player: p });
    }
  }

  // Sort the unprotected pool by OVR desc — picks go in order of who's "best available"
  unprotected.sort((a, b) => b.player.ratings.overall - a.player.ratings.overall);
  // Add small RNG jitter to break ties so picks aren't deterministic
  unprotected.sort((a, b) => {
    const diff = b.player.ratings.overall - a.player.ratings.overall;
    if (Math.abs(diff) > 0.001) return diff;
    return rng.next() - 0.5;
  });

  // Track picks per team
  const picksByExpansion: Record<string, Player[]> = {};
  for (const fid of expansionFids) picksByExpansion[fid] = [];

  // Snake order: Team A, Team B, Team B, Team A, A, B, B, A, ...
  const totalPicks = expansionFids.length * PICKS_PER_EXPANSION_TEAM;
  let availIdx = 0;
  const teamsTakenFrom: Record<string, number> = {};   // limit 1 player per existing team per expansion

  for (let pick = 0; pick < totalPicks; pick++) {
    const round = Math.floor(pick / expansionFids.length);
    const inRoundIdx = pick % expansionFids.length;
    const expFid = round % 2 === 0
      ? expansionFids[inRoundIdx]
      : expansionFids[expansionFids.length - 1 - inRoundIdx];

    // Find next available player whose origin team hasn't already lost a player to THIS expansion team
    let chosen: number = -1;
    while (availIdx < unprotected.length) {
      const candidate = unprotected[availIdx];
      const key = `${expFid}__${candidate.fromFid}`;
      if (!teamsTakenFrom[key]) {
        chosen = availIdx;
        teamsTakenFrom[key] = 1;
        break;
      }
      availIdx++;
    }
    if (chosen === -1) break;       // pool exhausted

    const picked = unprotected[chosen];
    picksByExpansion[expFid].push(picked.player);

    // Move player on rosters
    const oldFid = picked.fromFid;
    state.rosters[oldFid] = state.rosters[oldFid].filter((id) => id !== picked.player.id);
    picked.player.franchiseId = expFid;

    // Mark slot used and continue
    unprotected.splice(chosen, 1);
    if (chosen <= availIdx) availIdx = Math.max(0, availIdx - 1);
  }

  // Each expansion team replaces its lowest-OVR generated players with the picked players
  for (const expFid of expansionFids) {
    const picks = picksByExpansion[expFid];
    if (picks.length === 0) continue;

    const expRoster = state.rosters[expFid].map((pid) => state.players[pid]).filter(Boolean);
    // Sort generated roster ascending by OVR — drop the worst N
    expRoster.sort((a, b) => a.ratings.overall - b.ratings.overall);
    const droppedCount = picks.length;
    const dropped = expRoster.slice(0, droppedCount);
    const droppedIds = new Set(dropped.map((p) => p.id));

    state.rosters[expFid] = state.rosters[expFid].filter((id) => !droppedIds.has(id));
    // Add the picked players
    for (const p of picks) {
      if (!state.rosters[expFid].includes(p.id)) state.rosters[expFid].push(p.id);
    }
    // Dropped players become free agents (cut)
    for (const p of dropped) {
      p.franchiseId = null;
      state.freeAgents = state.freeAgents || [];
      if (!state.freeAgents.includes(p.id)) state.freeAgents.push(p.id);
    }

    // News
    const team = FRANCHISES[expFid];
    if (team) {
      const headliners = picks.slice(0, 3).map((p) => `${p.firstName} ${p.lastName}`);
      state.news.unshift({
        id: `expdraft_${expFid}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${team.city} ${team.name} select ${picks.length} in Expansion Draft`,
        body: `Headliners: ${headliners.join(', ')}. Avg OVR of class: ${Math.round(picks.reduce((s, p) => s + p.ratings.overall, 0) / picks.length)}.`,
        category: 'draft',
      });
    }
  }
}
