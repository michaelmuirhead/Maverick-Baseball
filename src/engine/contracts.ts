// Contract systems: extensions, arbitration, qualifying offers, comp picks.

import type { GameState, Player } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';
import { estimateFairAAV } from './trades';

// ===== Extensions =====
export function offerExtension(
  state: GameState,
  playerId: string,
  years: number,
  aav: number,
): { ok: boolean; accepted: boolean; reason?: string } {
  const p = state.players[playerId];
  if (!p || !p.contract) return { ok: false, accepted: false, reason: 'No contract to extend' };
  if (p.franchiseId !== state.userFranchiseId) return { ok: false, accepted: false, reason: 'Not your player' };
  const fairAAV = estimateFairAAV(p.ratings.overall, p.age + Math.max(1, p.contract.years));
  const aavRatio = aav / fairAAV;
  // Players accept if total guarantee >= ~0.95 * fair, with morale boost
  const moraleBoost = (((p.morale || 50) - 50) / 100) * 0.10;
  const acceptThreshold = 0.94 - moraleBoost;
  const accepted = aavRatio >= acceptThreshold && years <= 8;
  if (accepted) {
    p.contract = {
      salary: aav,
      years,
      status: 'extension',
      serviceDays: p.contract.serviceDays,
      ntc: p.ratings.overall >= 70,
    };
    if (p.demands) p.demands.wantsExtension = false;
    p.morale = Math.min(100, (p.morale || 50) + 10);
    state.news.unshift({
      id: `ext_${playerId}_${state.season}`,
      day: state.day,
      season: state.season,
      headline: `${FRANCHISES[p.franchiseId!].abbr} extend ${p.firstName} ${p.lastName}`,
      body: `${years}-year, $${(aav * years / 1_000_000).toFixed(0)}M extension. AAV $${(aav / 1_000_000).toFixed(1)}M.`,
      category: 'team',
      involves: [p.franchiseId!],
    });
  }
  return { ok: true, accepted, reason: accepted ? undefined : `Player wants more — fair AAV is ~$${Math.round(fairAAV / 1e6)}M for ${years} yrs` };
}

// ===== Arbitration =====
export interface ArbCase {
  playerId: string;
  fid: string;
  teamOffer: number;
  playerWant: number;
  ruling?: number;
  resolved: boolean;
}

/** At offseason, identify arb-eligible players + assign team/player numbers. */
export function fileArbitrations(state: GameState, rng: RNG): ArbCase[] {
  const cases: ArbCase[] = [];
  for (const fid of Object.keys(FRANCHISES)) {
    for (const pid of state.rosters[fid] || []) {
      const p = state.players[pid];
      if (!p?.contract) continue;
      const sy = (p.contract.serviceDays || 0) / 172;
      if (sy >= 3 && sy < 6 && p.contract.status === 'arb' && p.contract.years === 0) {
        const fair = estimateFairAAV(p.ratings.overall, p.age);
        const teamOffer = Math.round(fair * rng.float(0.78, 0.95));
        const playerWant = Math.round(fair * rng.float(1.05, 1.30));
        cases.push({ playerId: pid, fid, teamOffer, playerWant, resolved: false });
      }
    }
  }
  return cases;
}

/** Resolve all arb cases. Panel chooses the side closer to fair AAV. */
export function resolveArbitrations(state: GameState, cases: ArbCase[], rng: RNG) {
  for (const c of cases) {
    const p = state.players[c.playerId];
    if (!p) continue;
    const fair = estimateFairAAV(p.ratings.overall, p.age);
    const teamDist = Math.abs(c.teamOffer - fair);
    const playerDist = Math.abs(c.playerWant - fair);
    const ruling = teamDist < playerDist ? c.teamOffer : c.playerWant;
    c.ruling = ruling;
    c.resolved = true;
    if (p.contract) {
      p.contract.salary = ruling;
      p.contract.years = 1;
    }
    if (rng.chance(0.20) && c.fid === state.userFranchiseId) {
      state.news.unshift({
        id: `arb_${c.playerId}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${p.firstName} ${p.lastName} arbitration ruling: $${(ruling / 1e6).toFixed(1)}M`,
        body: `Panel sided with ${ruling === c.teamOffer ? 'team' : 'player'}. Team offered $${(c.teamOffer / 1e6).toFixed(1)}M; player wanted $${(c.playerWant / 1e6).toFixed(1)}M.`,
        category: 'team',
        involves: [c.fid],
      });
    }
  }
}

// ===== Qualifying Offers =====
const QO_AMOUNT = 21_000_000;     // ~MLB QO

export function tenderQO(state: GameState, playerId: string): { ok: boolean; reason?: string } {
  const p = state.players[playerId];
  if (!p) return { ok: false, reason: 'No player' };
  if (p.franchiseId !== state.userFranchiseId) return { ok: false, reason: 'Not your player' };
  if (p.ratings.overall < 60) return { ok: false, reason: 'Not eligible (need OVR 60+)' };
  state.qualifyingOffers = state.qualifyingOffers || [];
  state.qualifyingOffers.push({
    playerId,
    fromFid: state.userFranchiseId,
  });
  state.news.unshift({
    id: `qo_${playerId}_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${FRANCHISES[state.userFranchiseId].abbr} extend QO to ${p.firstName} ${p.lastName}`,
    body: `1-year, $${(QO_AMOUNT / 1e6).toFixed(0)}M qualifying offer.`,
    category: 'fa',
    involves: [state.userFranchiseId],
  });
  return { ok: true };
}

/** When a QO'd player signs elsewhere, original team gets a comp pick. */
export function awardCompPick(state: GameState, playerId: string, signedTeamFid: string) {
  const qo = state.qualifyingOffers?.find((q) => q.playerId === playerId);
  if (!qo || qo.signedElsewhere) return;
  qo.signedElsewhere = true;
  qo.declined = true;
  state.compPicks = state.compPicks || [];
  state.compPicks.push({
    fid: qo.fromFid,
    round: 1,
    year: state.season + 1,
    reason: `Comp pick for losing ${state.players[playerId]?.lastName}`,
  });
  state.news.unshift({
    id: `comp_${playerId}_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${FRANCHISES[qo.fromFid].abbr} receive comp pick for ${state.players[playerId]?.lastName}`,
    body: `Compensation 1st-round pick awarded for next year's draft.`,
    category: 'draft',
    involves: [qo.fromFid, signedTeamFid],
  });
}
