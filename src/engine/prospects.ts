// Prospect ranking helper — scores young players league-wide.

import type { GameState, Player } from './types';

export interface ProspectRank {
  player: Player;
  rank: number;
  score: number;
  eta: number;           // seasons until projected MLB contributor
}

/**
 * Score for a prospect = potential * 0.7 + current_OVR * 0.3
 *                      + youth bonus + contract status bonus
 */
export function prospectScore(p: Player): number {
  let s = p.potential * 0.7 + p.ratings.overall * 0.3;
  if (p.age <= 20) s += 6;
  else if (p.age <= 22) s += 4;
  else if (p.age <= 24) s += 2;
  if (p.prospect) s += 3;                 // bias toward farmhand prospects
  if (p.contract?.status === 'pre-arb') s += 2;
  return s;
}

function estimatedEta(p: Player): number {
  if (!p.prospect && p.ratings.overall >= 50) return 0;
  if (p.age <= 18) return 4;
  if (p.age <= 20) return 3;
  if (p.age <= 22) return 2;
  if (p.age <= 24) return 1;
  return 0;
}

export function top100Prospects(state: GameState): ProspectRank[] {
  const candidates: Player[] = [];
  for (const id of Object.keys(state.players)) {
    const p = state.players[id];
    if (!p || p.retired) continue;
    if (p.age > 25) continue;
    if (p.potential < 45) continue;
    candidates.push(p);
  }
  const ranked = candidates
    .map((p) => ({ player: p, score: prospectScore(p), eta: estimatedEta(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return ranked;
}

export function teamTopProspects(state: GameState, fid: string, limit = 15): ProspectRank[] {
  const rostered = (state.rosters[fid] || []).concat(
    (state.prospects || []).filter((id) => state.players[id]?.franchiseId === fid),
  );
  const unique = Array.from(new Set(rostered));
  const candidates: Player[] = [];
  for (const id of unique) {
    const p = state.players[id];
    if (!p || p.retired) continue;
    if (p.age > 25) continue;
    candidates.push(p);
  }
  return candidates
    .map((p) => ({ player: p, score: prospectScore(p), eta: estimatedEta(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
