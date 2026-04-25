// ============================================================
// Stadium upgrades
// ============================================================
// User can spend cash on three types of upgrades to their ballpark.
// Each upgrade has an upfront cost and a permanent franchise improvement
// that increases revenue, attendance demand, or fan loyalty.

import type { GameState } from './types';
import { FRANCHISES } from './franchises';

export type UpgradeType = 'capacity' | 'premium' | 'amenity';

export interface UpgradeSpec {
  cost: number;
  delta: number;
  label: string;
  description: string;
}

const SPECS: Record<UpgradeType, UpgradeSpec> = {
  capacity: {
    cost: 80_000_000,
    delta: 2000,
    label: 'Expand capacity',
    description: '+2,000 seats. Higher gate revenue ceiling.',
  },
  premium: {
    cost: 40_000_000,
    delta: 500,
    label: 'Add premium seating',
    description: '+500 premium/club seats at ~4x ticket price.',
  },
  amenity: {
    cost: 60_000_000,
    delta: 1,
    label: 'Amenity tier upgrade',
    description: '+1 amenity tier (max 5). Boosts concessions, merch, and demand.',
  },
};

export function upgradeSpecs(): Record<UpgradeType, UpgradeSpec> {
  return SPECS;
}

export function purchaseUpgrade(state: GameState, type: UpgradeType): { ok: boolean; reason?: string } {
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const fin = state.finances[fid];
  if (!f || !fin) return { ok: false, reason: 'no team' };

  const spec = SPECS[type];

  if (fin.teamCash < spec.cost) {
    return { ok: false, reason: `Need ${(spec.cost / 1_000_000).toFixed(0)}M; have ${(fin.teamCash / 1_000_000).toFixed(0)}M.` };
  }
  if (type === 'amenity' && f.amen >= 5) {
    return { ok: false, reason: 'Amenity tier already maxed at 5.' };
  }
  if (type === 'capacity' && f.cap >= 60_000) {
    return { ok: false, reason: 'Capacity already at MLB maximum.' };
  }

  // Apply
  fin.teamCash -= spec.cost;
  fin.ledger.stadium = (fin.ledger.stadium || 0) + spec.cost;
  if (type === 'capacity') f.cap += spec.delta;
  if (type === 'premium') f.premium += spec.delta;
  if (type === 'amenity') f.amen += spec.delta;

  state.news.unshift({
    id: `upgrade_${type}_${state.season}_${state.day}`,
    day: state.day,
    season: state.season,
    headline: `${f.city} ${f.name} announce ${spec.label.toLowerCase()}`,
    body: `${spec.description} Project cost: $${(spec.cost / 1_000_000).toFixed(0)}M.`,
    category: 'team',
  });

  return { ok: true };
}
