// Waiver system: when a player is DFA'd, other AI teams have 3 days to claim.
// If unclaimed, player goes to AAA (if optionable) or becomes FA.

import type { GameState, Player } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';
import { effectivePhilosophy } from './trades';

export function placeOnWaivers(state: GameState, playerId: string) {
  const p = state.players[playerId];
  if (!p || !p.franchiseId) return;
  state.waiverWire = state.waiverWire || [];
  state.waiverWire.push({
    playerId,
    fromFid: p.franchiseId,
    placedDay: state.day,
    expiresOnDay: state.day + 3,
  });
  state.news.unshift({
    id: `waiver_${playerId}_${state.day}`,
    day: state.day,
    season: state.season,
    headline: `${FRANCHISES[p.franchiseId].abbr} DFA ${p.firstName} ${p.lastName}`,
    body: `Designated for assignment. Other clubs have 3 days to claim.`,
    category: 'team',
    involves: [p.franchiseId],
  });
}

/** Daily check: process expired waivers + AI claims. */
export function processWaivers(state: GameState, rng: RNG) {
  if (!state.waiverWire) return;
  const remaining: typeof state.waiverWire = [];
  for (const w of state.waiverWire) {
    if (w.claimedBy) continue;
    const p = state.players[w.playerId];
    if (!p) continue;

    // AI claim chance: scales with player rating
    if (state.day < w.expiresOnDay) {
      const candidates = Object.keys(FRANCHISES).filter((fid) => fid !== w.fromFid);
      // Sort by need: teams with fewer players at this position
      const interested = candidates.filter((fid) => {
        const phil = effectivePhilosophy(state, fid);
        if (phil === 'rebuilding' && p.ratings.overall < 50) return rng.chance(0.4);
        if (p.ratings.overall >= 60) return rng.chance(0.5);
        if (p.ratings.overall >= 50) return rng.chance(0.2);
        return rng.chance(0.05);
      });
      if (interested.length > 0) {
        const claimer = rng.pick(interested);
        // Move player
        state.rosters[w.fromFid] = (state.rosters[w.fromFid] || []).filter((id) => id !== w.playerId);
        state.rosters[claimer] = state.rosters[claimer] || [];
        state.rosters[claimer].push(w.playerId);
        p.franchiseId = claimer;
        w.claimedBy = claimer;
        state.news.unshift({
          id: `claim_${w.playerId}_${state.day}`,
          day: state.day,
          season: state.season,
          headline: `${FRANCHISES[claimer].abbr} claim ${p.firstName} ${p.lastName} off waivers`,
          body: `${FRANCHISES[w.fromFid].abbr} loses player on waiver claim.`,
          category: 'trade',
          involves: [claimer, w.fromFid],
        });
        continue;
      }
    }

    if (state.day >= w.expiresOnDay) {
      // Unclaimed → goes to AAA (if optionable) or becomes FA
      const optionsUsed = p.optionsUsed || 0;
      if (optionsUsed < 3) {
        p.optionsUsed = optionsUsed + 1;
        state.minorRosters = state.minorRosters || {};
        const minors = state.minorRosters[w.fromFid] = state.minorRosters[w.fromFid] || { aaa: [], aa: [], a: [] };
        if (!minors.aaa.includes(w.playerId)) minors.aaa.push(w.playerId);
        state.rosters[w.fromFid] = (state.rosters[w.fromFid] || []).filter((id) => id !== w.playerId);
      } else {
        // Out of options → FA
        p.franchiseId = null;
        p.contract = null;
        state.rosters[w.fromFid] = (state.rosters[w.fromFid] || []).filter((id) => id !== w.playerId);
        state.freeAgents = state.freeAgents || [];
        state.freeAgents.push(w.playerId);
      }
      continue;
    }
    remaining.push(w);
  }
  state.waiverWire = remaining;
}

export function isOutOfOptions(p: Player): boolean {
  return (p.optionsUsed || 0) >= 3;
}
