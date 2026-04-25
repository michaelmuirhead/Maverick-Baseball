// ============================================================
// Free Agency
// ============================================================
// At season's end (after WS), players whose extension years run out, plus any
// players completing 6+ years of service with expired arb deals, become FAs.
// The pool sits in `state.freeAgents`. The FA window opens at day -100 and
// closes at day -10 (right before opening day).
//
// AI bidding occurs in waves through the offseason — each daily tick during
// open window has a chance for AI teams to place bids on any unsigned FA.
// Best fitting bid (best AAV * years for player's age + philosophy alignment)
// gets accepted by the player.

import type { RNG } from './rng';
import type { GameState, Player, FAListing, FABid, GMPhilosophy } from './types';
import { FRANCHISES } from './franchises';
import { estimateFairAAV, effectivePhilosophy } from './trades';
import { awardFreeAgentMultiplier } from './awards';

/**
 * After the season completes, identify which rostered players become free agents.
 * Mutates state: removes their roster entry, sets contract to expired, pushes to freeAgents.
 */
export function processOffseasonEligibility(state: GameState) {
  state.freeAgents = state.freeAgents || [];
  for (const fid of Object.keys(state.rosters)) {
    const remaining: string[] = [];
    for (const pid of state.rosters[fid]) {
      const p = state.players[pid];
      if (!p || !p.contract) { remaining.push(pid); continue; }

      // Decrement contract years for non-FA
      p.contract.years -= 1;

      // FA eligibility: extension expired AND 6+ years service, OR pre-arb player who has 6+ yrs (rare)
      const expired = p.contract.years <= 0;
      const has6yrs = (p.contract.serviceDays || 0) >= 6 * 172;
      if (expired && has6yrs) {
        p.franchiseId = null;
        p.contract = null;
        state.freeAgents.push(pid);
      } else if (expired && p.contract.status === 'arb') {
        // re-up arb deal at slight bump
        p.contract = {
          salary: Math.round(p.contract.salary * 1.18 + 500_000),
          years: 1,
          status: 'arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else if (expired && p.contract.status === 'pre-arb') {
        // back to pre-arb (renewal)
        p.contract = {
          salary: 770_000,
          years: 1,
          status: (p.contract.serviceDays + 172) >= 3 * 172 ? 'arb' : 'pre-arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else if (expired && p.contract.status === 'extension') {
        // Extension ran out without 6 yrs service (rare) — drop to arb-style 1-year
        p.contract = {
          salary: Math.max(800_000, Math.round(p.contract.salary * 0.95)),
          years: 1,
          status: 'arb',
          serviceDays: p.contract.serviceDays + 172,
        };
        remaining.push(pid);
      } else {
        // Still under contract — accumulate service days
        p.contract.serviceDays += 172;
        remaining.push(pid);
      }
    }
    state.rosters[fid] = remaining;
  }

  // Generate listings for the FA pool
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
    let askingMult = 1.05 + Math.max(0, (p.ratings.overall - 50)) * 0.01;   // stars ask above market
    // Award winners ask for premium pricing (MVPs +5%/each, etc.)
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
    headline: `Free agency opens — ${state.freeAgents.length} players hit market`,
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

/** Compute how attractive a bid is to the player (player choice scoring). */
export function bidScore(bid: FABid, listing: FAListing, p: Player): number {
  // Players prefer total value (AAV * years), with diminishing return on years
  // beyond what they asked for, and slight bonus for "winning" markets.
  const totalValue = bid.aav * Math.min(bid.years, listing.years + 1);
  const askMatch = bid.aav >= listing.asking ? 1.0 : (bid.aav / Math.max(1, listing.asking));
  const yearsMatch = bid.years >= listing.years ? 1.0 : (bid.years / Math.max(1, listing.years));
  const fitBonus =
    p.age >= 30 && bid.philosophy === 'win_now' ? 1.05 :
    p.age <= 27 && bid.philosophy === 'rebuilding' ? 0.85 :
    1.0;
  return totalValue * askMatch * yearsMatch * fitBonus;
}

/** AI teams bid on FAs each offseason day. */
export function simAIFreeAgentBids(state: GameState, rng: RNG): GameState {
  const fa = state.freeAgency;
  if (!fa || !fa.open) return state;

  const fids = Object.keys(FRANCHISES).filter((fid) => fid !== state.userFranchiseId);

  for (const listing of fa.listings) {
    if (listing.signedBy) continue;
    const player = state.players[listing.playerId];
    if (!player) continue;

    // 25% chance per day a given AI considers a bid; bigger stars draw more interest
    const interestMult = 1 + Math.max(0, player.ratings.overall - 55) * 0.05;

    for (const fid of fids) {
      if (!rng.chance(0.04 * interestMult)) continue;

      // Already bid? Don't bid again unless improving
      const philosophy = effectivePhilosophy(state, fid) as GMPhilosophy;

      // Skip philosophy mismatches
      if (philosophy === 'rebuilding' && player.age >= 31) continue;
      if (philosophy === 'win_now' && player.age <= 24 && player.ratings.overall < 55) continue;

      const fin = state.finances[fid];
      if (!fin) continue;

      // ---- Payroll discipline ----
      // Skip bidding entirely when payroll already exceeds 40% of estimated
      // annual revenue (rough proxy: team cash + 4× annual TV) — overspending teams
      // can't sustainably take on more.
      const currentPayroll = state.rosters[fid].reduce(
        (s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0,
      );
      const revenueProxy = fin.tvValue + fin.sponsors + fin.nameRightsValue + 75_000_000;
      if (currentPayroll > revenueProxy * 0.85) continue;        // already overspent

      // Cash-affordability gate: cash must support at least the asking AAV
      if (fin.teamCash < listing.asking * 0.5) continue;

      // Bid AAV — varies by philosophy aggressiveness and player rating
      const fairAAV = estimateFairAAV(player.ratings.overall, player.age);
      let aggressiveness =
        philosophy === 'win_now' ? rng.float(0.95, 1.15) :
        philosophy === 'contending' ? rng.float(0.9, 1.05) :
        philosophy === 'balanced' ? rng.float(0.85, 1.0) :
        rng.float(0.75, 0.92);
      // Expansion handicap: brand-new teams less attractive to FAs for ~5 seasons
      if (FRANCHISES[fid].expansion && (FRANCHISES[fid].seasonsActive ?? 0) < 5) {
        aggressiveness *= 0.88;
      }
      let aav = Math.round(fairAAV * aggressiveness);

      // Hard cap: no AI team commits an AAV greater than 12% of current cash
      // + 8% of owner cash. This prevents a single signing from going underwater.
      const aavCap = Math.round(fin.teamCash * 0.12 + fin.ownerCash * 0.08);
      if (aav > aavCap) aav = aavCap;
      if (aav < 760_000) continue;       // below MLB minimum, skip
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

    // After all bids placed today, see if player accepts the best one
    if (listing.bids.length > 0 && rng.chance(0.18)) {
      const ranked = listing.bids
        .map((b) => ({ b, s: bidScore(b, listing, player) }))
        .sort((a, b) => b.s - a.s);
      const top = ranked[0].b;

      // Player accepts if best bid meets ~85% of asking AAV
      if (top.aav >= listing.asking * 0.85) {
        signFreeAgent(state, listing, top);
      }
    }
  }
  return state;
}

/** User-controlled bid placement. */
export function userPlaceBid(
  state: GameState,
  fid: string,
  playerId: string,
  aav: number,
  years: number,
): { ok: boolean; reason?: string } {
  const fa = state.freeAgency;
  if (!fa || !fa.open) return { ok: false, reason: 'Free agency window closed' };
  const fin = state.finances[fid];
  if (!fin || fin.teamCash < aav) return { ok: false, reason: 'Not enough cash on hand' };
  const listing = fa.listings.find((l) => l.playerId === playerId);
  if (!listing) return { ok: false, reason: 'Player not available' };
  if (listing.signedBy) return { ok: false, reason: 'Player already signed' };

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
      serviceDays: 6 * 172 + 172, // freshly signed FA, beyond 6 yrs service
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
    body: `${bid.years}-year, $${(bid.aav * bid.years / 1_000_000).toFixed(1)}M deal — $${(bid.aav / 1_000_000).toFixed(1)}M AAV.`,
    category: 'fa',
  });
}

export function closeFreeAgencyWindow(state: GameState) {
  if (!state.freeAgency) return;
  state.freeAgency.open = false;
  // Unsigned vets become available all season as cheap minor-league deals
  // (drop into freeAgents pool but with reduced asking)
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
