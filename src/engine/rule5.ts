// Rule 5 draft — offseason day -20.
// Eligible: prospects (players with `prospect: true`) that are at least 19
// years old and whose team carries them unprotected.
// Approximation: a team protects its top 15 prospects (by potential); the rest
// are exposed. Teams with losing records pick first (reverse of standings).

import type { GameState, Rule5DraftState, Player } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';
import { effectivePhilosophy } from './trades';

const R5_FEE = 100_000;
const PROTECTED_COUNT = 4;

function isEligible(p: Player | undefined): boolean {
  if (!p) return false;
  if (!p.prospect) return false;
  if (p.retired) return false;
  if (p.age < 19) return false;
  if (p.age > 25) return false;
  if (p.contract) return false;        // already on 40-man (roughly)
  return true;
}

function exposedFor(state: GameState, fid: string): string[] {
  const pros = (state.rosters[fid] || [])
    .concat(state.prospects || [])
    .filter((id) => {
      const p = state.players[id];
      return p && p.franchiseId === fid && isEligible(p);
    });
  // Deduplicate and sort by potential desc
  const unique = Array.from(new Set(pros));
  const ranked = unique
    .map((id) => state.players[id])
    .sort((a, b) => b.potential - a.potential);
  const exposed = ranked.slice(PROTECTED_COUNT).map((p) => p.id);
  return exposed;
}

export function startRule5Draft(state: GameState, _rng: RNG): Rule5DraftState {
  // Pick order: reverse of prior-season standings (worst picks first)
  const fids = Object.keys(FRANCHISES);
  const order = [...fids].sort((a, b) => {
    const sa = state.standings[a]?.wins ?? 0;
    const sb = state.standings[b]?.wins ?? 0;
    return sa - sb;
  });

  const eligibleSet = new Set<string>();
  for (const fid of fids) {
    for (const id of exposedFor(state, fid)) eligibleSet.add(id);
  }

  return {
    year: state.season,
    eligible: Array.from(eligibleSet),
    order,
    picks: [],
    complete: false,
    currentPickIndex: 0,
  };
}

function currentTeam(draft: Rule5DraftState): string | null {
  if (draft.currentPickIndex >= draft.order.length) return null;
  return draft.order[draft.currentPickIndex];
}

function performPick(state: GameState, fid: string, playerId: string | null) {
  const draft = state.rule5!;
  if (playerId) {
    const p = state.players[playerId];
    if (p) {
      const previousFid = p.franchiseId || 'FA';
      // Remove from previous team
      if (previousFid && state.rosters[previousFid]) {
        state.rosters[previousFid] = state.rosters[previousFid].filter((x) => x !== playerId);
      }
      state.prospects = (state.prospects || []).filter((x) => x !== playerId);
      // Assign to picking team with a 1-year MLB contract at $760K (league min)
      p.franchiseId = fid;
      p.prospect = false;
      p.contract = {
        salary: 760_000,
        years: 1,
        status: 'pre-arb',
        serviceDays: 0,
      };
      state.rosters[fid] = state.rosters[fid] || [];
      state.rosters[fid].push(playerId);
      // Fee: picking team pays $100K to previous team
      if (state.finances[fid]) state.finances[fid].teamCash -= R5_FEE;
      if (previousFid !== 'FA' && state.finances[previousFid]) {
        state.finances[previousFid].teamCash += R5_FEE;
      }
      draft.picks.push({ franchiseId: fid, playerId, previousFid });
      // Remove from eligible pool
      draft.eligible = draft.eligible.filter((id) => id !== playerId);

      state.news.unshift({
        id: `r5_${playerId}`,
        day: state.day,
        season: state.season,
        headline: `${FRANCHISES[fid].abbr} selects ${p.firstName} ${p.lastName} in Rule 5 draft`,
        body: `Claimed from ${FRANCHISES[previousFid]?.abbr || 'farm system'} for the $${Math.round(R5_FEE / 1000)}K fee.`,
        category: 'draft',
      });
    }
  } else {
    draft.picks.push({ franchiseId: fid, playerId: null, previousFid: '' });
  }
  draft.currentPickIndex += 1;
}

export function userRule5Pick(state: GameState, playerId: string): boolean {
  const draft = state.rule5;
  if (!draft || draft.complete) return false;
  const fid = currentTeam(draft);
  if (fid !== state.userFranchiseId) return false;
  if (!draft.eligible.includes(playerId)) return false;
  performPick(state, fid, playerId);
  if (draft.currentPickIndex >= draft.order.length || draft.eligible.length === 0) {
    draft.complete = true;
  }
  return true;
}

export function autoRule5Pick(state: GameState, rng: RNG): boolean {
  const draft = state.rule5;
  if (!draft || draft.complete) return false;
  const fid = currentTeam(draft);
  if (!fid) { draft.complete = true; return false; }
  if (fid === state.userFranchiseId) return false;       // don't pick for user

  // AI decides whether to spend a pick: ~55% chance, skewed by philosophy
  const phil = effectivePhilosophy(state, fid);
  let willPick = rng.chance(0.55);
  if (phil === 'rebuilding') willPick = rng.chance(0.75);
  if (phil === 'win_now') willPick = rng.chance(0.3);

  if (!willPick || draft.eligible.length === 0) {
    performPick(state, fid, null);
    return true;
  }

  // Pick best available by potential
  const ranked = draft.eligible
    .map((id) => state.players[id])
    .filter(Boolean)
    .sort((a, b) => b.potential - a.potential);
  if (ranked.length === 0) {
    performPick(state, fid, null);
    return true;
  }
  performPick(state, fid, ranked[0].id);
  return true;
}

export function autoCompleteRule5(state: GameState, rng: RNG) {
  const draft = state.rule5;
  if (!draft) return;
  let safety = 50;
  while (!draft.complete && safety-- > 0) {
    const fid = currentTeam(draft);
    if (!fid) { draft.complete = true; break; }
    if (fid === state.userFranchiseId) {
      // Skip user if they haven't manually picked — treat as pass
      performPick(state, fid, null);
    } else {
      autoRule5Pick(state, rng);
    }
  }
  draft.complete = true;
}

/** Called once an AI team picks or the user is up. Used by world.ts each day the draft is active. */
export function simAIRule5Until(state: GameState, rng: RNG) {
  const draft = state.rule5;
  if (!draft || draft.complete) return;
  let safety = 40;
  while (!draft.complete && safety-- > 0) {
    const fid = currentTeam(draft);
    if (!fid) { draft.complete = true; break; }
    if (fid === state.userFranchiseId) break;
    autoRule5Pick(state, rng);
  }
}

export function rule5CurrentTeam(state: GameState): string | null {
  return state.rule5 ? currentTeam(state.rule5) : null;
}
