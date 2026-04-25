// Stadium replacement: build a brand-new park. Costs $1B - $2B, takes 2 yrs.
// Replaces the existing park stats entirely.

import type { GameState } from './types';
import { FRANCHISES } from './franchises';

export interface NewParkSpec {
  name: string;
  cap: number;
  premium: number;
  amen: number;            // 1-5 amenity tier (5 = state of the art)
  pf: number;              // overall park factor target (95-110)
}

const COST_PER_AMEN: Record<number, number> = {
  1: 600_000_000,
  2: 800_000_000,
  3: 1_100_000_000,
  4: 1_500_000_000,
  5: 2_000_000_000,
};

export function newParkCost(spec: NewParkSpec): number {
  const baseCost = COST_PER_AMEN[spec.amen] || 1_000_000_000;
  const capPremium = (spec.cap - 38_000) * 6_000;
  return Math.max(500_000_000, Math.round(baseCost + capPremium));
}

export function buildNewStadium(state: GameState, spec: NewParkSpec): { ok: boolean; reason?: string } {
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  if (!f) return { ok: false, reason: 'No franchise' };
  const fin = state.finances[fid];
  const cost = newParkCost(spec);
  const liquid = fin.teamCash + fin.ownerCash;
  if (liquid < cost * 0.4) return { ok: false, reason: `Need at least $${Math.round(cost * 0.4 / 1e6)}M between team and owner cash for a 40% down payment` };

  // Down payment from team cash + owner injection; rest financed (debt)
  const cashShare = Math.min(fin.teamCash, cost * 0.30);
  const ownerShare = Math.min(fin.ownerCash, cost * 0.10);
  fin.teamCash -= cashShare;
  fin.ownerCash -= ownerShare;
  fin.debt += cost - cashShare - ownerShare;
  fin.ledger.signingBonuses = (fin.ledger.signingBonuses || 0) + cashShare;

  // Replace the franchise's stadium specs
  f.park = spec.name;
  f.cap = spec.cap;
  f.premium = spec.premium;
  f.amen = spec.amen;
  f.pf = spec.pf;
  // Recompute per-stat park factors
  const pf = spec.pf;
  f.pfHR = pf >= 100 ? Math.round(100 + (pf - 100) * 1.4) : Math.round(100 - (100 - pf) * 1.2);
  f.pfDouble = Math.round(95 + (pf - 100) * 0.6);
  f.pfTriple = Math.round(95 + (pf - 100) * 1.8);
  f.pfBABIP = Math.round(100 + (pf - 100) * 0.4);

  state.news.unshift({
    id: `park_${fid}_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${f.city} unveils ${spec.name}`,
    body: `New $${(cost / 1e9).toFixed(2)}B ballpark opens with ${spec.cap.toLocaleString()} capacity, amenity tier ${spec.amen}, and a park factor of ${spec.pf}.`,
    category: 'team',
    involves: [fid],
  });
  return { ok: true };
}
