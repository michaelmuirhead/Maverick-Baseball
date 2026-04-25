// Local-storage save/load with multi-slot + JSON export/import.

import type { GameState } from '../engine/types';
import { FRANCHISES, ORIGINAL_FRANCHISES } from '../engine/franchises';
import { MARKETS } from '../engine/markets';

const KEY_STATE = 'mvb_state_v1';
const KEY_REG = 'mvb_registry_v1';
const KEY_SLOT_PREFIX = 'mvb_slot_';
const KEY_REG_SLOT_PREFIX = 'mvb_slot_reg_';

export const SLOT_COUNT = 3;

function buildPayload(state: GameState) {
  const expansionFranchises: Record<string, any> = {};
  for (const id of Object.keys(FRANCHISES)) {
    if (!(id in ORIGINAL_FRANCHISES)) expansionFranchises[id] = FRANCHISES[id];
  }
  const expansionMarkets: Record<string, any> = {};
  for (const id of Object.keys(MARKETS)) {
    if (id.endsWith('_mkt')) expansionMarkets[id] = MARKETS[id];
  }
  return { state, expansionFranchises, expansionMarkets };
}

export function saveGame(state: GameState) {
  try {
    const { expansionFranchises, expansionMarkets } = buildPayload(state);
    localStorage.setItem(KEY_REG, JSON.stringify({ expansionFranchises, expansionMarkets }));
    localStorage.setItem(KEY_STATE, JSON.stringify(state));
  } catch (e) {
    console.warn('saveGame failed', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const reg = localStorage.getItem(KEY_REG);
    const raw = localStorage.getItem(KEY_STATE);
    if (!raw) return null;
    if (reg) {
      const { expansionFranchises, expansionMarkets } = JSON.parse(reg);
      for (const [id, val] of Object.entries(expansionFranchises || {})) FRANCHISES[id] = val as any;
      for (const [id, val] of Object.entries(expansionMarkets || {})) MARKETS[id] = val as any;
    }
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.warn('loadGame failed', e);
    return null;
  }
}

export function hasSave(): boolean {
  try { return !!localStorage.getItem(KEY_STATE); } catch { return false; }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY_STATE);
    localStorage.removeItem(KEY_REG);
  } catch { /* ignore */ }
}

// ---------- Slot management ----------

export interface SlotInfo {
  index: number;
  filled: boolean;
  label?: string;
  season?: number;
  day?: number;
  userTeam?: string;
}

export function listSlots(): SlotInfo[] {
  const result: SlotInfo[] = [];
  for (let i = 1; i <= SLOT_COUNT; i++) {
    const raw = localStorage.getItem(KEY_SLOT_PREFIX + i);
    if (!raw) {
      result.push({ index: i, filled: false });
      continue;
    }
    try {
      const s: GameState = JSON.parse(raw);
      result.push({
        index: i,
        filled: true,
        season: s.season,
        day: s.day,
        userTeam: FRANCHISES[s.userFranchiseId]?.abbr || s.userFranchiseId,
      });
    } catch {
      result.push({ index: i, filled: false });
    }
  }
  return result;
}

export function saveToSlot(slotIndex: number, state: GameState): boolean {
  try {
    const { expansionFranchises, expansionMarkets } = buildPayload(state);
    localStorage.setItem(KEY_SLOT_PREFIX + slotIndex, JSON.stringify(state));
    localStorage.setItem(KEY_REG_SLOT_PREFIX + slotIndex, JSON.stringify({ expansionFranchises, expansionMarkets }));
    return true;
  } catch (e) {
    console.warn('saveToSlot failed', e);
    return false;
  }
}

export function loadFromSlot(slotIndex: number): GameState | null {
  try {
    const raw = localStorage.getItem(KEY_SLOT_PREFIX + slotIndex);
    if (!raw) return null;
    const reg = localStorage.getItem(KEY_REG_SLOT_PREFIX + slotIndex);
    if (reg) {
      const { expansionFranchises, expansionMarkets } = JSON.parse(reg);
      for (const [id, val] of Object.entries(expansionFranchises || {})) FRANCHISES[id] = val as any;
      for (const [id, val] of Object.entries(expansionMarkets || {})) MARKETS[id] = val as any;
    }
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.warn('loadFromSlot failed', e);
    return null;
  }
}

export function deleteSlot(slotIndex: number): void {
  try {
    localStorage.removeItem(KEY_SLOT_PREFIX + slotIndex);
    localStorage.removeItem(KEY_REG_SLOT_PREFIX + slotIndex);
  } catch { /* ignore */ }
}

// ---------- JSON export/import ----------

export function exportToJSON(state: GameState): string {
  return JSON.stringify(buildPayload(state), null, 2);
}

export function importFromJSON(jsonStr: string): GameState | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.state) return null;
    if (parsed.expansionFranchises) {
      for (const [id, val] of Object.entries(parsed.expansionFranchises)) FRANCHISES[id] = val as any;
    }
    if (parsed.expansionMarkets) {
      for (const [id, val] of Object.entries(parsed.expansionMarkets)) MARKETS[id] = val as any;
    }
    return parsed.state as GameState;
  } catch (e) {
    console.warn('importFromJSON failed', e);
    return null;
  }
}
