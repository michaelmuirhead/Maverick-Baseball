// ============================================================
// Amateur Draft
// ============================================================
// Annual June draft (modeled at day -45 in the offseason): 10 rounds of
// prospects assigned to teams in reverse order of prior season's record.
// AI logic uses GM philosophy:
//   • rebuilders prioritize high-ceiling young talent
//   • contenders prefer near-MLB-ready college bats/arms
//   • balanced/retoolers split the difference
//
// Signing bonus pools scale by pick slot. Teams that exceed pool pay luxury
// tax (assessed against finances at draft completion).

import type { RNG } from './rng';
import type { GameState, Player, DraftState, DraftPick, GMPhilosophy, Position } from './types';
import { genPlayer, POSITIONS_HITTER } from './players';
import { FRANCHISES } from './franchises';
import { effectivePhilosophy } from './trades';

const ROUNDS = 10;

/**
 * Generate a draft class — ~30 prospects per round in pool, much higher upside,
 * younger ages, no MLB contract yet, marked as prospect.
 */
export function generateDraftClass(rng: RNG, year: number, teamCount: number): Player[] {
  const pool: Player[] = [];
  const targetPicks = teamCount * ROUNDS;
  // Generate ~1.4x picks so AI/UI can pass on reaches
  const total = Math.round(targetPicks * 1.4);

  for (let i = 0; i < total; i++) {
    // Tilt position distribution toward demand: pitchers ~40%, MIF/OF/C ~60%
    const pos: Position = rng.chance(0.4)
      ? rng.pick(['SP', 'SP', 'SP', 'RP'] as Position[])
      : rng.pick(['SS', '2B', 'CF', 'C', '3B', '1B', 'LF', 'RF'] as Position[]);

    const p = genPlayer(rng, null, pos);
    p.age = 18 + rng.int(0, 4);                       // 18–22 (HS, JuCo, college)
    p.prospect = true;
    p.draftYear = year;
    // Reduce current ratings (raw) but bump potential ceiling
    p.ratings.overall = Math.max(20, p.ratings.overall - rng.int(8, 16));
    p.potential = Math.min(80, p.ratings.overall + rng.int(8, 22));
    if (p.ratings.contact !== undefined) p.ratings.contact = Math.max(20, p.ratings.contact - rng.int(5, 12));
    if (p.ratings.power !== undefined) p.ratings.power = Math.max(20, p.ratings.power - rng.int(5, 10));
    if (p.ratings.fastball !== undefined) p.ratings.fastball = Math.max(20, p.ratings.fastball - rng.int(5, 10));
    p.contract = null;        // signed at draft
    p.franchiseId = null;
    p.health = 'healthy';
    pool.push(p);
  }
  // Sort by potential descending — gives a "consensus ranking"
  pool.sort((a, b) => b.potential - a.potential);
  return pool;
}

/**
 * Build the draft order from prior season standings (reverse — worst pick first).
 * Snake order: rounds 1, 3, 5... go worst→best; rounds 2, 4, 6... reverse.
 */
export function buildDraftOrder(state: GameState): string[] {
  const fids = Object.keys(FRANCHISES);
  // Use prior season's standings — finalizeSeason already wrote into history;
  // standings reset to 0 at season rollover, so use most recent finance history record's record.
  const ranked = fids
    .map((fid) => {
      const last = state.finances[fid]?.history?.slice(-1)[0];
      const wins = last?.record.w ?? 0;
      return { fid, wins };
    })
    .sort((a, b) => a.wins - b.wins);
  return ranked.map((x) => x.fid);
}

const SLOT_POOL: number[] = [
  // Approximated 2025 MLB pool values for picks 1-30, then descending for later picks.
  9_700_000, 7_200_000, 6_300_000, 5_700_000, 5_200_000,
  4_900_000, 4_600_000, 4_300_000, 4_100_000, 3_900_000,
  3_700_000, 3_500_000, 3_300_000, 3_150_000, 3_000_000,
  2_900_000, 2_800_000, 2_700_000, 2_600_000, 2_500_000,
  2_400_000, 2_300_000, 2_200_000, 2_100_000, 2_000_000,
  1_900_000, 1_800_000, 1_700_000, 1_600_000, 1_500_000,
];
function slotValue(overallPick: number): number {
  if (overallPick <= 30) return SLOT_POOL[overallPick - 1];
  if (overallPick <= 60) return Math.round(1_300_000 - (overallPick - 30) * 25_000);
  if (overallPick <= 100) return Math.round(700_000 - (overallPick - 60) * 8_000);
  return Math.max(150_000, Math.round(380_000 - (overallPick - 100) * 2_500));
}

export function startDraft(state: GameState, rng: RNG, year: number): DraftState {
  const fids = Object.keys(FRANCHISES);
  const order = buildDraftOrder(state);
  const pool = generateDraftClass(rng, year, fids.length);

  // Add prospects to state
  state.prospects = state.prospects || [];
  for (const p of pool) {
    state.players[p.id] = p;
  }

  // Build picks for all rounds with snake order
  const picks: DraftPick[] = [];
  let overall = 1;
  for (let r = 1; r <= ROUNDS; r++) {
    const roundOrder = r % 2 === 1 ? order : [...order].reverse();
    for (const fid of roundOrder) {
      picks.push({
        round: r,
        overall,
        franchiseId: fid,
        originalFid: fid,
        playerId: null,
        signed: false,
        bonusPaid: 0,
        year,
      });
      overall++;
    }
  }

  const teamBonusPools: Record<string, number> = {};
  for (const fid of fids) {
    let pool = 0;
    for (const pick of picks) if (pick.franchiseId === fid) pool += slotValue(pick.overall);
    teamBonusPools[fid] = pool;
  }

  return {
    year,
    order,
    pool: pool.map((p) => p.id),
    picks,
    currentPickIndex: 0,
    complete: false,
    roundsTotal: ROUNDS,
    teamBonusPools,
  };
}

/** AI valuation of a prospect by philosophy. */
function prospectValue(p: Player, philosophy: GMPhilosophy): number {
  let v = p.potential * 1.2 + p.ratings.overall * 0.4;
  if (philosophy === 'rebuilding') {
    v += (p.potential - p.ratings.overall) * 0.6;        // upside premium
    v -= p.age * 0.7;
  } else if (philosophy === 'win_now' || philosophy === 'contending') {
    v += p.ratings.overall * 0.3;                          // proximity to MLB
    v -= (p.potential - p.ratings.overall) * 0.2;
  } else if (philosophy === 'retooling') {
    v += p.ratings.overall * 0.15 + (p.potential - p.ratings.overall) * 0.3;
  }
  return v;
}

/** Make a single AI pick — selects best prospect by team philosophy. */
export function aiPick(state: GameState, draft: DraftState, _rng: RNG): string {
  const pick = draft.picks[draft.currentPickIndex];
  if (!pick) return '';
  const philosophy = state.gmPhilosophies?.[pick.franchiseId] || 'balanced';
  const ranked = draft.pool
    .map((id) => state.players[id])
    .filter(Boolean)
    .map((p) => ({ p, v: prospectValue(p, philosophy as GMPhilosophy) }))
    .sort((a, b) => b.v - a.v);
  return ranked[0]?.p.id || draft.pool[0];
}

/** Apply a pick — assigns player to team, removes from pool, advances index. */
export function makePick(state: GameState, draft: DraftState, playerId: string): DraftState {
  const pick = draft.picks[draft.currentPickIndex];
  if (!pick) return draft;
  const p = state.players[playerId];
  if (!p) return draft;

  const fid = pick.franchiseId;
  pick.playerId = playerId;
  // Sign for slot value (later: allow user to under/overpay)
  const bonus = slotValue(pick.overall);
  pick.bonusPaid = bonus;
  pick.signed = true;

  // Update player
  state.players[playerId] = {
    ...p,
    franchiseId: fid,
    draftedBy: fid,
    draftRound: pick.round,
    draftPick: pick.overall,
    draftYear: pick.year,
    contract: { salary: 760_000, years: 1, status: 'pre-arb', serviceDays: 0 },
  };

  // Add to prospect pool (not the active 26-man)
  state.prospects = state.prospects || [];
  if (!state.prospects.includes(playerId)) state.prospects.push(playerId);

  // Bonus paid out as ledger expense
  const fin = state.finances[fid];
  if (fin) {
    fin.ledger.signingBonuses = (fin.ledger.signingBonuses || 0) + bonus;
    fin.teamCash -= bonus;
  }

  // Remove from available pool
  draft.pool = draft.pool.filter((id) => id !== playerId);
  draft.currentPickIndex++;
  if (draft.currentPickIndex >= draft.picks.length) {
    draft.complete = true;
    state.news.unshift({
      id: `draft_done_${draft.year}`,
      day: state.day,
      season: state.season,
      headline: `${draft.year} amateur draft concludes`,
      body: `${draft.picks.length} amateur prospects sign across ${draft.roundsTotal} rounds.`,
      category: 'draft',
    });
  }
  return draft;
}

/** Run the AI through every pick until it hits the user — for fast advance. */
export function autoPickUntilUser(
  state: GameState,
  draft: DraftState,
  userFid: string,
  rng: RNG,
): DraftState {
  while (!draft.complete) {
    const pick = draft.picks[draft.currentPickIndex];
    if (!pick) break;
    if (pick.franchiseId === userFid) break;
    const playerId = aiPick(state, draft, rng);
    if (!playerId) break;
    draft = makePick(state, draft, playerId);
  }
  return draft;
}

/** Auto-complete the entire remaining draft (e.g. when user delegates). */
export function autoCompleteDraft(state: GameState, draft: DraftState, rng: RNG): DraftState {
  while (!draft.complete) {
    const playerId = aiPick(state, draft, rng);
    if (!playerId) break;
    draft = makePick(state, draft, playerId);
  }
  return draft;
}
