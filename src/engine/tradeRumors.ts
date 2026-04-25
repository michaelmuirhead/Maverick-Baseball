// Mid-season trade rumor news items. Generates "Team X reportedly shopping
// player Y" / "Team Z monitoring stars at the deadline" blurbs based on team
// philosophy and standings.

import type { GameState } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';
import { effectivePhilosophy } from './trades';

const VERBS_SHOPPING = [
  'reportedly listening on',
  'said to be open to dealing',
  'gauging interest in',
  'rumored to be shopping',
];

const VERBS_INTERESTED = [
  'kicking the tires on',
  'reportedly interested in adding',
  'said to be in pursuit of',
  'monitoring the market for',
];

export function maybeGenerateTradeRumor(state: GameState, rng: RNG) {
  // Only fire mid-season, more frequently as deadline approaches
  if (state.phase !== 'regular_season') return;
  if (state.day < 60 || state.day > 120) return;

  const daysToDeadline = 120 - state.day;
  const baseChance = daysToDeadline <= 5 ? 0.85
    : daysToDeadline <= 15 ? 0.55
    : daysToDeadline <= 30 ? 0.30
    : 0.10;
  if (!rng.chance(baseChance)) return;

  const fids = Object.keys(FRANCHISES);
  // Pick a "seller" — losing team
  const sellers = fids
    .filter((fid) => {
      const sd = state.standings[fid];
      const games = sd.wins + sd.losses;
      return games >= 30 && sd.wins / games < 0.45;
    });
  // Pick a "buyer" — winning team
  const buyers = fids
    .filter((fid) => {
      const sd = state.standings[fid];
      const games = sd.wins + sd.losses;
      return games >= 30 && sd.wins / games > 0.55;
    });
  if (sellers.length === 0 || buyers.length === 0) return;

  // 50/50 between shopping and interested rumors
  if (rng.chance(0.5)) {
    const fid = rng.pick(sellers);
    const team = FRANCHISES[fid];
    const sellerCandidates = (state.rosters[fid] || [])
      .map((id) => state.players[id])
      .filter((p) => p && p.age >= 28 && p.ratings.overall >= 55 && !p.contract?.ntc);
    if (sellerCandidates.length === 0) return;
    const target = rng.pick(sellerCandidates);
    const verb = rng.pick(VERBS_SHOPPING);
    state.news.unshift({
      id: `rumor_${Date.now()}_${rng.int(0, 9999)}`,
      day: state.day,
      season: state.season,
      headline: `${team.abbr} ${verb} ${target.firstName} ${target.lastName}`,
      body: `Multiple sources say the ${team.city} ${team.name} are open to offers for the ${target.pos} as the deadline approaches.`,
      category: 'trade',
      involves: [fid],
    });
  } else {
    const fid = rng.pick(buyers);
    const team = FRANCHISES[fid];
    // Pick a star from a losing team
    const targetSeller = rng.pick(sellers);
    const targets = (state.rosters[targetSeller] || [])
      .map((id) => state.players[id])
      .filter((p) => p && p.ratings.overall >= 60);
    if (targets.length === 0) return;
    const target = rng.pick(targets);
    const phil = effectivePhilosophy(state, fid);
    const verb = rng.pick(VERBS_INTERESTED);
    state.news.unshift({
      id: `rumor_${Date.now()}_${rng.int(0, 9999)}`,
      day: state.day,
      season: state.season,
      headline: `${team.abbr} ${verb} ${target.firstName} ${target.lastName}`,
      body: `The ${team.city} club is in ${phil.replace('_', ' ')} mode and reportedly believes ${target.lastName} could push them over the top.`,
      category: 'trade',
      involves: [fid, targetSeller],
    });
  }
}
