import type { RNG } from './rng';
import type { GameState, GMPhilosophy, Player, Franchise } from './types';
import { FRANCHISES } from './franchises';
import { MARKETS } from './markets';

export const GM_PHILOSOPHIES: GMPhilosophy[] = ['rebuilding', 'retooling', 'contending', 'win_now', 'balanced'];

export function assignGMPhilosophy(rng: RNG, franchise: Franchise): GMPhilosophy {
  const market = MARKETS[franchise.market];
  if (market.tier === 'mega') return rng.pick(['contending', 'win_now', 'balanced'] as GMPhilosophy[]);
  if (market.tier === 'large') return rng.pick(['contending', 'retooling', 'balanced', 'win_now'] as GMPhilosophy[]);
  if (market.tier === 'mid') return rng.pick(['retooling', 'balanced', 'contending', 'rebuilding'] as GMPhilosophy[]);
  return rng.pick(['rebuilding', 'retooling', 'balanced'] as GMPhilosophy[]);
}

export function effectivePhilosophy(state: GameState, fid: string): GMPhilosophy {
  const base = state.gmPhilosophies?.[fid] || 'balanced';
  const standing = state.standings[fid];
  const games = standing.wins + standing.losses;
  if (games < 30) return base;

  const winPct = standing.wins / games;
  const divRivals = Object.keys(FRANCHISES).filter(
    (id) => FRANCHISES[id].lg === FRANCHISES[fid].lg && FRANCHISES[id].div === FRANCHISES[fid].div && id !== fid,
  );
  const divLeader = Math.max(...divRivals.map((id) => state.standings[id].wins));
  const gamesBack = divLeader - standing.wins;

  if (winPct > 0.58 || (winPct > 0.52 && gamesBack <= 2)) {
    if (base === 'rebuilding') return 'retooling';
    if (base === 'retooling' || base === 'balanced') return 'contending';
    return base;
  }
  if (winPct < 0.42 && gamesBack > 8) {
    if (base === 'win_now' || base === 'contending') return 'retooling';
    if (base === 'balanced') return 'rebuilding';
    return base;
  }
  return base;
}

export function tradeValue(player: Player | null | undefined): number {
  if (!player || !player.contract) return 0;
  const r = player.ratings.overall;

  let baseVal: number;
  if (r >= 70) baseVal = 80 + (r - 70) * 6;
  else if (r >= 60) baseVal = 45 + (r - 60) * 3.5;
  else if (r >= 50) baseVal = 22 + (r - 50) * 2.3;
  else if (r >= 40) baseVal = 8 + (r - 40) * 1.4;
  else baseVal = Math.max(0, (r - 25) * 0.4);

  if (player.age < 27 && player.potential > r) {
    const upside = player.potential - r;
    const upsideFactor = Math.max(0, (27 - player.age) / 10);
    baseVal += upside * upsideFactor * 1.5;
  }

  if (player.age <= 24) baseVal *= 1.3;
  else if (player.age <= 28) baseVal *= 1.15;
  else if (player.age <= 31) baseVal *= 1.0;
  else if (player.age <= 34) baseVal *= 0.8;
  else baseVal *= 0.55;

  const fairAAV = estimateFairAAV(r, player.age);
  const aavDiff = fairAAV - player.contract.salary;
  const contractAdjust = Math.max(-40, Math.min(40, (aavDiff / 1_000_000) * 3));
  baseVal += contractAdjust;

  if (player.contract.status === 'pre-arb') baseVal *= 1.4;
  else if (player.contract.status === 'arb') baseVal *= 1.15;

  if (player.contract.status === 'extension') {
    if (r >= 55 && player.contract.years >= 3) baseVal *= 1.1;
    if (r < 50 && player.contract.years >= 3) baseVal *= 0.75;
  }

  if (player.contract.ntc) baseVal *= 0.85;

  return Math.max(0, Math.round(baseVal));
}

export function estimateFairAAV(rating: number, age: number): number {
  let base: number;
  if (rating >= 70) base = 40_000_000;
  else if (rating >= 60) base = 22_000_000;
  else if (rating >= 55) base = 14_000_000;
  else if (rating >= 50) base = 8_000_000;
  else if (rating >= 45) base = 3_500_000;
  else if (rating >= 40) base = 1_200_000;
  else base = 760_000;
  if (age >= 34) base *= 0.75;
  else if (age >= 31) base *= 0.9;
  return Math.round(base);
}

export interface TradeEval {
  accepted: boolean;
  countering?: boolean;
  givingValue?: number;
  receivingValue?: number;
  philosophy?: GMPhilosophy;
  reason: string;
}

export function cashToTradeValue(dollars: number): number {
  return Math.round(dollars / 2_000_000);
}

export function evaluateTradeForAI(
  state: GameState,
  aiFid: string,
  givingIds: string[],
  receivingIds: string[],
  aiGivingCash: number = 0,
  aiReceivingCash: number = 0,
): TradeEval {
  const giving = givingIds.map((id) => state.players[id]).filter(Boolean);
  const receiving = receivingIds.map((id) => state.players[id]).filter(Boolean);

  if (giving.length === 0 && aiGivingCash === 0) return { accepted: false, reason: 'Empty package' };
  if (receiving.length === 0 && aiReceivingCash === 0) return { accepted: false, reason: 'Empty package' };

  for (const p of giving) {
    if (p.contract?.ntc && Math.random() < 0.9) {
      return { accepted: false, reason: `${p.lastName} has a no-trade clause` };
    }
  }

  const givingValue = giving.reduce((s, p) => s + tradeValue(p), 0) + cashToTradeValue(aiGivingCash);
  const receivingValue = receiving.reduce((s, p) => s + tradeValue(p), 0) + cashToTradeValue(aiReceivingCash);
  const philosophy = effectivePhilosophy(state, aiFid);

  let recvMult = 1.0;
  let giveMult = 1.0;

  for (const p of receiving) {
    const tv = tradeValue(p);
    if (tv <= 0) continue;
    if (philosophy === 'rebuilding' || philosophy === 'retooling') {
      if (p.age <= 25) recvMult += 0.08 * (tv / Math.max(1, receivingValue));
      if (p.age >= 32) recvMult -= 0.12 * (tv / Math.max(1, receivingValue));
      if (p.contract?.status === 'pre-arb') recvMult += 0.06 * (tv / Math.max(1, receivingValue));
    }
    if (philosophy === 'contending' || philosophy === 'win_now') {
      if (p.ratings.overall >= 55 && p.age >= 27 && p.age <= 33) recvMult += 0.08 * (tv / Math.max(1, receivingValue));
      if (p.potential - p.ratings.overall > 12) recvMult -= 0.06 * (tv / Math.max(1, receivingValue));
    }
  }

  for (const p of giving) {
    const tv = tradeValue(p);
    if (tv <= 0) continue;
    if (philosophy === 'rebuilding' && p.age <= 26 && p.ratings.overall >= 55) giveMult += 0.15 * (tv / Math.max(1, givingValue));
    if (philosophy === 'win_now' && p.age >= 30 && p.ratings.overall >= 55) giveMult -= 0.08 * (tv / Math.max(1, givingValue));
  }

  recvMult = Math.max(0.75, Math.min(1.25, recvMult));
  giveMult = Math.max(0.75, Math.min(1.25, giveMult));

  const adjustedReceiving = receivingValue * recvMult;
  const adjustedGiving = givingValue * giveMult;
  const margin =
    philosophy === 'win_now' ? -3 :
    philosophy === 'contending' ? 0 :
    philosophy === 'balanced' ? 0 :
    philosophy === 'retooling' ? 2 :
    5;
  const ratio = adjustedReceiving / Math.max(1, adjustedGiving);
  const roundedGiving = Math.round(adjustedGiving);
  const roundedReceiving = Math.round(adjustedReceiving);

  if (adjustedReceiving >= adjustedGiving + margin) {
    return { accepted: true, givingValue: roundedGiving, receivingValue: roundedReceiving, reason: 'Deal makes sense', philosophy };
  }
  if (ratio >= 0.85) {
    return { accepted: false, countering: true, givingValue: roundedGiving, receivingValue: roundedReceiving, philosophy, reason: 'Package is close but needs a sweetener' };
  }
  return { accepted: false, givingValue: roundedGiving, receivingValue: roundedReceiving, philosophy, reason: describeTradeRejection(roundedReceiving, roundedGiving, philosophy) };
}

export function describeTradeRejection(receiving: number, giving: number, philosophy: GMPhilosophy): string {
  const gap = giving - receiving;
  if (gap > 80) return 'Not in the same zip code. Try again.';
  if (gap > 40) return "That's a non-starter for us.";
  if (philosophy === 'rebuilding') return "We're looking for younger pieces with more control.";
  if (philosophy === 'win_now') return "We need major-league help right now, not projects.";
  if (philosophy === 'contending') return "We'd need more proven talent to move that player.";
  return "Values don't line up for us.";
}

export function suggestCounter(
  state: GameState,
  _aiFid: string,
  userFid: string,
  _givingIds: string[],
  receivingIds: string[],
  evalResult: TradeEval,
): string | null {
  const userRoster = state.rosters[userFid];
  const alreadyIncluded = new Set(receivingIds);
  const candidates = userRoster
    .filter((id) => !alreadyIncluded.has(id))
    .map((id) => state.players[id])
    .filter((p) => p && p.contract && !p.contract.ntc);

  const gap = (evalResult.givingValue || 0) - (evalResult.receivingValue || 0);
  const ranked = candidates
    .map((p) => ({ p, v: tradeValue(p), diff: Math.abs(tradeValue(p) - gap) }))
    .filter((x) => x.v > 5 && x.v < gap * 1.8)
    .sort((a, b) => a.diff - b.diff);
  return ranked[0]?.p.id || null;
}

export function executeTradeWithCash(
  state: GameState,
  fromFid: string,
  toFid: string,
  fromPlayerIds: string[],
  toPlayerIds: string[],
  fromCash: number,
  toCash: number,
): GameState {
  let s = fromPlayerIds.length > 0 || toPlayerIds.length > 0
    ? executeTrade(state, fromFid, toFid, fromPlayerIds, toPlayerIds)
    : { ...state, finances: { ...state.finances }, news: [...state.news] };
  const net = fromCash - toCash;
  if (net !== 0 && s.finances[fromFid] && s.finances[toFid]) {
    s.finances[fromFid].teamCash -= net;
    s.finances[toFid].teamCash += net;
    if (net > 0) {
      s.news.unshift({
        id: `cash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        day: s.day,
        season: s.season,
        headline: `${FRANCHISES[fromFid].abbr} sends $${Math.round(net / 1_000_000)}M cash to ${FRANCHISES[toFid].abbr}`,
        body: 'Cash consideration attached to trade.',
        category: 'trade',
      });
    }
  }
  return s;
}

export function executeTrade(
  state: GameState,
  fromFid: string,
  toFid: string,
  fromPlayerIds: string[],
  toPlayerIds: string[],
): GameState {
  const s: GameState = {
    ...state,
    players: { ...state.players },
    rosters: {
      ...state.rosters,
      [fromFid]: [...state.rosters[fromFid]],
      [toFid]: [...state.rosters[toFid]],
    },
    news: [...state.news],
  };

  for (const pid of fromPlayerIds) {
    s.players[pid] = { ...s.players[pid], franchiseId: toFid };
    s.rosters[fromFid] = s.rosters[fromFid].filter((x) => x !== pid);
    s.rosters[toFid].push(pid);
  }
  for (const pid of toPlayerIds) {
    s.players[pid] = { ...s.players[pid], franchiseId: fromFid };
    s.rosters[toFid] = s.rosters[toFid].filter((x) => x !== pid);
    s.rosters[fromFid].push(pid);
  }

  const fromNames = fromPlayerIds.map((id) => `${s.players[id].firstName} ${s.players[id].lastName}`);
  const toNames = toPlayerIds.map((id) => `${s.players[id].firstName} ${s.players[id].lastName}`);

  s.news.unshift({
    id: `trade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    day: s.day,
    season: s.season,
    headline: `${FRANCHISES[fromFid].city} and ${FRANCHISES[toFid].city} swing deal`,
    body: `${FRANCHISES[fromFid].name} send ${fromNames.join(', ')} to ${FRANCHISES[toFid].name} in exchange for ${toNames.join(', ')}.`,
    category: 'trade',
  });

  return s;
}

export function simAITradeActivity(state: GameState, rng: RNG): GameState {
  const ids = Object.keys(FRANCHISES).filter((id) => id !== state.userFranchiseId);
  if (ids.length < 2) return state;

  const attempts = rng.int(1, 3);
  let s = state;
  for (let i = 0; i < attempts; i++) {
    const a = rng.pick(ids);
    const b = rng.pick(ids.filter((x) => x !== a));
    const philA = effectivePhilosophy(s, a);
    const philB = effectivePhilosophy(s, b);
    const complementary =
      ((philA === 'contending' || philA === 'win_now') && (philB === 'rebuilding' || philB === 'retooling')) ||
      ((philB === 'contending' || philB === 'win_now') && (philA === 'rebuilding' || philA === 'retooling'));
    if (!complementary) continue;

    const [seller, buyer] = (philA === 'rebuilding' || philA === 'retooling') ? [a, b] : [b, a];

    const sellerRoster = s.rosters[seller].map((id) => s.players[id]).filter(Boolean);
    const buyerRoster = s.rosters[buyer].map((id) => s.players[id]).filter(Boolean);

    const sellerCandidates = sellerRoster
      .filter((p) => p.age >= 29 && p.ratings.overall >= 50 && !p.contract?.ntc)
      .sort((x, y) => tradeValue(y) - tradeValue(x));
    if (sellerCandidates.length === 0) continue;
    const sellerPlayer = sellerCandidates[rng.int(0, Math.min(2, sellerCandidates.length - 1))];

    const targetVal = tradeValue(sellerPlayer);
    const buyerCandidates = buyerRoster
      .filter((p) => p.age <= 26 && !p.contract?.ntc)
      .map((p) => ({ p, v: tradeValue(p), diff: Math.abs(tradeValue(p) - targetVal) }))
      .sort((x, y) => x.diff - y.diff);
    if (buyerCandidates.length === 0) continue;
    const buyerPlayer = buyerCandidates[0].p;

    if (Math.abs(tradeValue(sellerPlayer) - tradeValue(buyerPlayer)) < 25) {
      s = executeTrade(s, seller, buyer, [sellerPlayer.id], [buyerPlayer.id]);
    }
  }
  return s;
}

export function tradeWindowOpen(state: GameState): boolean {
  if (state.phase === 'offseason' && state.day >= -100 && state.day <= -30) return true;
  if (state.phase === 'regular_season' && state.day <= 120) return true;
  return false;
}

export function tradeWindowLabel(state: GameState): string {
  if (!tradeWindowOpen(state)) {
    if (state.day > 120 && state.day <= 183) return 'Deadline has passed';
    if (state.phase === 'postseason') return 'Postseason - window closed';
    return 'Window closed';
  }
  if (state.phase === 'regular_season') {
    const daysLeft = 120 - state.day;
    if (daysLeft <= 10 && daysLeft > 0) return `Deadline in ${daysLeft} days`;
    if (daysLeft > 10) return 'Trade window open';
    return 'Deadline day';
  }
  return 'Offseason window open';
}
