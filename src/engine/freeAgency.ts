import type { RNG } from './rng';
import type { GameState, Player, FAListing, FABid, GMPhilosophy, Position } from './types';
import { FRANCHISES } from './franchises';
import { estimateFairAAV, effectivePhilosophy } from './trades';
import { awardFreeAgentMultiplier } from './awards';

export function processOffseasonEligibility(state: GameState) {
  state.freeAgents = state.freeAgents || [];
  for (const fid of Object.keys(state.rosters)) {
    const remaining: string[] = [];
    for (const pid of state.rosters[fid]) {
      const p = state.players[pid];
      if (!p || !p.contract) { remaining.push(pid); continue; }

      p.contract.years -= 1;

      const expired = p.contract.years <= 0;
      const has6yrs = (p.contract.serviceDays || 0) >= 6 * 172;
      if (expired && has6yrs) {
        p.franchiseId = null;
        p.contract = null;
        state.freeAgents.push(pid);
      } else if (expired && p.contract.status === 'arb') {
        p.contract = {
          salary: Math.round(p.contract.salary * 1.18 + 500_000),
          years: 1,
          status: 'arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else if (expired && p.contract.status === 'pre-arb') {
        p.contract = {
          salary: 770_000,
          years: 1,
          status: (p.contract.serviceDays + 172) >= 3 * 172 ? 'arb' : 'pre-arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else if (expired && p.contract.status === 'extension') {
        p.contract = {
          salary: Math.max(800_000, Math.round(p.contract.salary * 0.95)),
          years: 1,
          status: 'arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else {
        p.contract.serviceDays += 172;
        remaining.push(pid);
      }
    }
    state.rosters[fid] = remaining;
  }

  if (!state.freeAgency) {
    state.freeAgency = {
      year: state.season,
      listings: [],
      open: true,
      closesOn: -10,
    };
  }
  for (const pid of state.freeAgents) {
    const p = state.players[pid];
    if (!p) continue;
    if (state.freeAgency.listings.find((l) => l.playerId === pid)) continue;
    const fairAAV = estimateFairAAV(p.ratings.overall, p.age);
    let askingMult = 1.05 + Math.max(0, (p.ratings.overall - 50)) * 0.01;
    askingMult *= awardFreeAgentMultiplier(p);
    const yearsAsk = p.age >= 35 ? 1 : p.age >= 32 ? 2 : p.age >= 28 ? 4 : 6;
    state.freeAgency.listings.push({
      playerId: pid,
      asking: Math.round(fairAAV * askingMult),
      years: yearsAsk,
      bids: [],
      signedBy: null,
      signedOn: null,
      declined: false,
    });
  }

  state.news.unshift({
    id: `fa_open_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `Free agency opens - ${state.freeAgents.length} players hit market`,
    body: `Headlining the class are ${topFreeAgents(state, 3).map((p) => `${p.firstName} ${p.lastName}`).join(', ')}.`,
    category: 'fa',
  });
}

export function topFreeAgents(state: GameState, n: number): Player[] {
  return (state.freeAgents || [])
    .map((id) => state.players[id])
    .filter(Boolean)
    .sort((a, b) => b.ratings.overall - a.ratings.overall)
    .slice(0, n);
}

export function bidScore(bid: FABid, listing: FAListing, p: Player): number {
  const totalValue = bid.aav * Math.min(bid.years, listing.years + 1);
  const askMatch = bid.aav >= listing.asking ? 1.0 : (bid.aav / Math.max(1, listing.asking));
  const yearsMatch = bid.years >= listing.years ? 1.0 : (bid.years / Math.max(1, listing.years));
  const fitBonus =
    p.age >= 30 && bid.philosophy === 'win_now' ? 1.05 :
    p.age <= 27 && bid.philosophy === 'rebuilding' ? 0.85 :
    1.0;
  return totalValue * askMatch * yearsMatch * fitBonus;
}

export function simAIFreeAgentBids(state: GameState, rng: RNG): GameState {
  const fa = state.freeAgency;
  if (!fa || !fa.open) return state;

  const fids = Object.keys(FRANCHISES).filter((fid) => fid !== state.userFranchiseId);

  for (const listing of fa.listings) {
    if (listing.signedBy) continue;
    const player = state.players[listing.playerId];
    if (!player) continue;

    const interestMult = 1 + Math.max(0, player.ratings.overall - 55) * 0.05;

    for (const fid of fids) {
      if (!rng.chance(0.06 * interestMult)) continue;

      const philosophy = effectivePhilosophy(state, fid) as GMPhilosophy;

      if (philosophy === 'rebuilding' && player.age >= 31) continue;
      if (philosophy === 'win_now' && player.age <= 24 && player.ratings.overall < 55) continue;

      const fin = state.finances[fid];
      if (!fin) continue;

      const currentPayroll = state.rosters[fid].reduce(
        (s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0,
      );
      const revenueProxy = fin.tvValue + fin.sponsors + fin.nameRightsValue + 75_000_000;
      if (currentPayroll > revenueProxy * 0.85) continue;

      if (fin.teamCash < listing.asking * 0.5) continue;

      const fairAAV = estimateFairAAV(player.ratings.overall, player.age);
      let aggressiveness =
        philosophy === 'win_now' ? rng.float(0.95, 1.15) :
        philosophy === 'contending' ? rng.float(0.9, 1.05) :
        philosophy === 'balanced' ? rng.float(0.85, 1.0) :
        rng.float(0.75, 0.92);
      if (FRANCHISES[fid].expansion && (FRANCHISES[fid].seasonsActive ?? 0) < 5) {
        aggressiveness *= 0.88;
      }
      // Cash-rich teams bid harder
      if (fin.teamCash > 300_000_000) aggressiveness *= 1.10;
      if (fin.teamCash > 500_000_000) aggressiveness *= 1.05;
      let aav = Math.round(fairAAV * aggressiveness);

      const aavCap = Math.round(fin.teamCash * 0.12 + fin.ownerCash * 0.08);
      if (aav > aavCap) aav = aavCap;
      if (aav < 760_000) continue;
      const years = player.age >= 35 ? 1
        : player.age >= 32 ? rng.int(1, 2)
        : player.age >= 29 ? rng.int(2, 4)
        : rng.int(3, 6);

      const existing = listing.bids.find((b) => b.franchiseId === fid);
      if (existing && existing.aav >= aav) continue;

      const bid: FABid = {
        franchiseId: fid,
        aav,
        years,
        total: aav * years,
        philosophy,
        dayPlaced: state.day,
      };
      if (existing) {
        listing.bids = listing.bids.filter((b) => b.franchiseId !== fid);
      }
      listing.bids.push(bid);
    }

    if (listing.bids.length > 0 && rng.chance(0.18)) {
      const ranked = listing.bids
        .map((b) => ({ b, s: bidScore(b, listing, player) }))
        .sort((a, b) => b.s - a.s);
      const top = ranked[0].b;

      if (top.aav >= listing.asking * 0.85) {
        signFreeAgent(state, listing, top);
      }
    }
  }
  return state;
}

export function userPlaceBid(
  state: GameState,
  fid: string,
  playerId: string,
  aav: number,
  years: number,
): { ok: boolean; reason?: string } {
  const fa = state.freeAgency;
  if (!fa) return { ok: false, reason: 'Free agency has not opened yet' };
  const fin = state.finances[fid];
  if (!fin || fin.teamCash < aav) return { ok: false, reason: 'Not enough cash on hand' };
  const listing = fa.listings.find((l) => l.playerId === playerId);
  if (!listing) return { ok: false, reason: 'Player not available' };
  if (listing.signedBy) return { ok: false, reason: 'Player already signed' };
  if (!fa.open && aav > listing.asking * 0.7) {
    return { ok: false, reason: `Window closed - bargain bids must be <= $${Math.round(listing.asking * 0.7 / 1_000_000)}M` };
  }

  const bid: FABid = {
    franchiseId: fid,
    aav,
    years,
    total: aav * years,
    philosophy: (state.gmPhilosophies?.[fid] || 'balanced') as GMPhilosophy,
    dayPlaced: state.day,
  };

  listing.bids = listing.bids.filter((b) => b.franchiseId !== fid);
  listing.bids.push(bid);
  return { ok: true };
}

export function signFreeAgent(state: GameState, listing: FAListing, bid: FABid) {
  const p = state.players[listing.playerId];
  if (!p) return;
  const fid = bid.franchiseId;
  state.players[listing.playerId] = {
    ...p,
    franchiseId: fid,
    contract: {
      salary: bid.aav,
      years: bid.years,
      status: 'extension',
      serviceDays: 6 * 172 + 172,
      ntc: p.ratings.overall >= 65 && Math.random() < 0.3,
    },
  };
  state.rosters[fid] = state.rosters[fid] || [];
  if (!state.rosters[fid].includes(listing.playerId)) {
    state.rosters[fid].push(listing.playerId);
  }
  listing.signedBy = fid;
  listing.signedOn = state.day;
  state.freeAgents = (state.freeAgents || []).filter((id) => id !== listing.playerId);

  state.news.unshift({
    id: `fa_sign_${listing.playerId}_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${FRANCHISES[fid].city} sign ${p.firstName} ${p.lastName}`,
    body: `${bid.years}-year, $${(bid.aav * bid.years / 1_000_000).toFixed(1)}M deal - $${(bid.aav / 1_000_000).toFixed(1)}M AAV.`,
    category: 'fa',
  });
}

export function closeFreeAgencyWindow(state: GameState) {
  if (!state.freeAgency) return;
  state.freeAgency.open = false;
  for (const listing of state.freeAgency.listings) {
    if (!listing.signedBy) {
      const p = state.players[listing.playerId];
      if (p) {
        listing.asking = Math.round(listing.asking * 0.6);
        listing.years = 1;
      }
    }
  }
  state.news.unshift({
    id: `fa_close_${state.season}`,
    day: state.day,
    season: state.season,
    headline: 'Free agency window closes',
    body: 'Unsigned veterans now available on minor-league or one-year deals.',
    category: 'fa',
  });
}

/**
 * GM auto-bid: when the user delegates FA to their GM, the AI evaluates the
 * unsigned free-agent pool on behalf of the user team using the same
 * payroll-discipline rules other AI clubs follow. Called once per offseason
 * day while delegateFA is true.
 *
 * Strategy:
 *  • Identify the team's biggest weak spots (position-by-position deficits
 *    relative to league average rating).
 *  • For each weak spot, find the best affordable FA at that position.
 *  • Place a market-rate bid; if the player accepts, we sign them.
 */
export function simUserGMFreeAgentBids(state: GameState, rng: RNG): GameState {
  const fa = state.freeAgency;
  if (!fa || !fa.open || !state.delegateFA) return state;
  const fid = state.userFranchiseId;
  const fin = state.finances[fid];
  if (!fin) return state;

  // Compute current roster by position
  const roster = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && !p.retired);

  const positionsToFill: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'];

  // Score each position on roster - lower means weaker (priority to fill)
  const posScores: Record<string, number> = {};
  for (const pos of positionsToFill) {
    const atPos = roster.filter((p) => p.pos === pos);
    if (atPos.length === 0) {
      posScores[pos] = 0;        // empty = highest priority
    } else {
      const best = Math.max(...atPos.map((p) => p.ratings.overall));
      posScores[pos] = best;
    }
  }
  // Pick top 3 weakest positions
  const weakest = positionsToFill
    .map((pos) => ({ pos, score: posScores[pos] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((x) => x.pos);

  // Payroll discipline gate
  const currentPayroll = state.rosters[fid].reduce(
    (s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0,
  );
  const revenueProxy = fin.tvValue + fin.sponsors + fin.nameRightsValue + 75_000_000;
  // Don't take on FA if payroll is already above 80% of revenue proxy
  if (currentPayroll > revenueProxy * 0.8) return state;

  // For each weak spot, look for the best fit FA
  for (const pos of weakest) {
    const candidates = fa.listings
      .filter((l) => !l.signedBy)
      .map((l) => ({ l, p: state.players[l.playerId] }))
      .filter((x) => x.p && x.p.pos === pos)
      .sort((a, b) => b.p.ratings.overall - a.p.ratings.overall);

    if (candidates.length === 0) continue;

    // Each day there's a 30% chance the GM acts on a top-3 candidate
    if (!rng.chance(0.3)) continue;

    const target = candidates[rng.int(0, Math.min(2, candidates.length - 1))];
    const player = target.p;
    const listing = target.l;

    // Don't double-bid
    if (listing.bids.find((b) => b.franchiseId === fid)) continue;

    // Compute fair AAV
    const fairAAV = estimateFairAAV(player.ratings.overall, player.age);
    let aav = Math.round(fairAAV * rng.float(0.95, 1.08));

    // Hard cap: 12% of cash + 8% of owner
    const aavCap = Math.round(fin.teamCash * 0.12 + fin.ownerCash * 0.08);
    if (aav > aavCap) aav = aavCap;
    if (aav < 760_000) continue;
    if (fin.teamCash < aav) continue;

    const years = player.age >= 35 ? 1
      : player.age >= 32 ? rng.int(1, 2)
      : player.age >= 29 ? rng.int(2, 4)
      : rng.int(3, 5);

    const bid: FABid = {
      franchiseId: fid,
      aav,
      years,
      total: aav * years,
      philosophy: (state.gmPhilosophies?.[fid] || 'balanced') as GMPhilosophy,
      dayPlaced: state.day,
    };
    listing.bids.push(bid);

    // Player decides — accept if AAV >= 85% of asking
    if (aav >= listing.asking * 0.85 && rng.chance(0.4)) {
      signFreeAgent(state, listing, bid);
      state.news.unshift({
        id: `gm_sign_${listing.playerId}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `Your GM signs ${player.firstName} ${player.lastName}`,
        body: `${years}-year, $${(aav * years / 1_000_000).toFixed(1)}M deal — auto-executed by delegated GM.`,
        category: 'fa',
      });
    }
  }
  return state;
}
