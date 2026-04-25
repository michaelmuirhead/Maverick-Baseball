import { create } from 'zustand';
import type { ExpansionConfig, GameState } from '../engine/types';
import { initWorld, advanceDay, advanceToMilestone } from '../engine/world';
import { executeTrade, executeTradeWithCash } from '../engine/trades';
import { userSignIntlProspect } from '../engine/internationalSignings';
import { userRule5Pick, autoCompleteRule5 } from '../engine/rule5';
import { autoCompleteDraft, makePick, autoPickUntilUser } from '../engine/draft';
import { userPlaceBid, signFreeAgent } from '../engine/freeAgency';
import { fireCoach, signCoach } from '../engine/coaches';
import { waivePlayer } from '../engine/waiver';
import { purchaseUpgrade, type UpgradeType } from '../engine/stadium';
import { RNG } from '../engine/rng';
import { saveGame, loadGame, clearSave, hasSave } from './save';

export type View = 'splash' | 'new_game' | 'game';
export type Page =
  | 'dashboard' | 'roster' | 'finances' | 'standings' | 'schedule'
  | 'trades' | 'playoffs' | 'stadium' | 'news'
  | 'injured_list' | 'draft' | 'free_agency' | 'staff' | 'awards' | 'player_career' | 'settings'
  | 'history' | 'prospects' | 'international' | 'rule5';

interface Store {
  view: View;
  page: Page;
  state: GameState | null;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  setState: (s: GameState) => void;

  setView: (v: View) => void;
  setPage: (p: Page) => void;

  newGame: (
    seed: number,
    franchiseId: string,
    scenario: 'normal' | 'turnaround' | 'expansion',
    expansionConfig?: ExpansionConfig | null,
  ) => void;
  loadFromStorage: () => boolean;
  hasSavedGame: () => boolean;
  clearSavedGame: () => void;

  advanceOne: () => void;
  advanceTo: (milestone: string) => void;

  executeTradeAction: (fromFid: string, toFid: string, fromIds: string[], toIds: string[], fromCash?: number, toCash?: number) => void;
  signIntlAction: (prospectId: string, bonus: number) => { ok: boolean; reason?: string };
  rule5PickAction: (playerId: string) => void;
  rule5AutoComplete: () => void;
  setTicketPrice: (fid: string, price: number) => void;
  setPremiumPrice: (fid: string, price: number) => void;
  setParkingPrice: (fid: string, price: number) => void;

  draftPick: (playerId: string) => void;
  draftAutoPickUntilUser: () => void;
  draftAutoComplete: () => void;

  faPlaceBid: (playerId: string, aav: number, years: number) => { ok: boolean; reason?: string };
  faAcceptBid: (playerId: string, fromFid: string) => void;

  toggleGmDelegated: () => void;

  hireCoach: (coachId: string, years: number, salary?: number) => void;
  toggleDelegateStaffHiring: () => void;
  fireCoachAction: (coachId: string) => { ok: boolean; buyout: number; reason?: string };
  waivePlayerAction: (playerId: string) => { ok: boolean; deadMoney: number; reason?: string };
  purchaseUpgradeAction: (type: UpgradeType) => { ok: boolean; reason?: string };
}

export const useGame = create<Store>((set, get) => ({
  view: 'splash',
  page: 'dashboard',
  state: null,
  selectedPlayerId: null,
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id, page: id ? 'player_career' : get().page }),
  setState: (s) => { set({ state: s }); saveGame(s); },

  setView: (v) => set({ view: v }),
  setPage: (p) => set({ page: p }),

  newGame: (seed, franchiseId, scenario, expansionConfig) => {
    const state = initWorld(seed, franchiseId, scenario, expansionConfig || null);
    set({ state, view: 'game', page: 'dashboard' });
    saveGame(state);
  },

  loadFromStorage: () => {
    const s = loadGame();
    if (s) {
      set({ state: s, view: 'game', page: 'dashboard' });
      return true;
    }
    return false;
  },

  hasSavedGame: () => hasSave(),
  clearSavedGame: () => clearSave(),

  advanceOne: () => {
    const s = get().state;
    if (!s) return;
    const next = advanceDay(s);
    set({ state: next });
    saveGame(next);
  },

  advanceTo: (milestone) => {
    const s = get().state;
    if (!s) return;
    const next = advanceToMilestone(s, milestone);
    set({ state: next });
    saveGame(next);
  },

  executeTradeAction: (fromFid, toFid, fromIds, toIds, fromCash, toCash) => {
    const s = get().state;
    if (!s) return;
    const hasCash = (fromCash && fromCash > 0) || (toCash && toCash > 0);
    const next = hasCash
      ? executeTradeWithCash(s, fromFid, toFid, fromIds, toIds, fromCash || 0, toCash || 0)
      : executeTrade(s, fromFid, toFid, fromIds, toIds);
    set({ state: next });
    saveGame(next);
  },

  signIntlAction: (prospectId, bonus) => {
    const s = get().state;
    if (!s) return { ok: false, reason: 'no game' };
    const r = userSignIntlProspect(s, prospectId, bonus);
    set({ state: { ...s } });
    saveGame(s);
    return r;
  },
  rule5PickAction: (playerId) => {
    const s = get().state;
    if (!s || !s.rule5) return;
    userRule5Pick(s, playerId);
    set({ state: { ...s } });
    saveGame(s);
  },
  rule5AutoComplete: () => {
    const s = get().state;
    if (!s || !s.rule5) return;
    const rng = new RNG(s.rngState);
    autoCompleteRule5(s, rng);
    s.rngState = rng.state;
    set({ state: { ...s } });
    saveGame(s);
  },

  setTicketPrice: (fid, price) => {
    const s = get().state;
    if (!s) return;
    s.finances[fid].ticketPrice = price;
    set({ state: { ...s } });
    saveGame(s);
  },
  setPremiumPrice: (fid, price) => {
    const s = get().state;
    if (!s) return;
    s.finances[fid].premiumPrice = price;
    set({ state: { ...s } });
    saveGame(s);
  },
  setParkingPrice: (fid, price) => {
    const s = get().state;
    if (!s) return;
    s.finances[fid].parkingPrice = price;
    set({ state: { ...s } });
    saveGame(s);
  },

  draftPick: (playerId) => {
    const s = get().state;
    if (!s || !s.draft) return;
    const draft = makePick(s, s.draft, playerId);
    set({ state: { ...s, draft } });
    saveGame(s);
  },
  draftAutoPickUntilUser: () => {
    const s = get().state;
    if (!s || !s.draft) return;
    const rng = new RNG(s.rngState);
    const draft = autoPickUntilUser(s, s.draft, s.userFranchiseId, rng);
    s.rngState = rng.state;
    set({ state: { ...s, draft } });
    saveGame(s);
  },
  draftAutoComplete: () => {
    const s = get().state;
    if (!s || !s.draft) return;
    const rng = new RNG(s.rngState);
    const draft = autoCompleteDraft(s, s.draft, rng);
    s.rngState = rng.state;
    set({ state: { ...s, draft } });
    saveGame(s);
  },

  faPlaceBid: (playerId, aav, years) => {
    const s = get().state;
    if (!s) return { ok: false, reason: 'no game' };
    const result = userPlaceBid(s, s.userFranchiseId, playerId, aav, years);
    set({ state: { ...s } });
    saveGame(s);
    return result;
  },
  faAcceptBid: (playerId, fromFid) => {
    const s = get().state;
    if (!s || !s.freeAgency) return;
    const listing = s.freeAgency.listings.find((l) => l.playerId === playerId);
    if (!listing) return;
    const bid = listing.bids.find((b) => b.franchiseId === fromFid);
    if (!bid) return;
    signFreeAgent(s, listing, bid);
    set({ state: { ...s } });
    saveGame(s);
  },

  toggleGmDelegated: () => {
    const s = get().state;
    if (!s) return;
    s.gmDelegated = !s.gmDelegated;
    set({ state: { ...s } });
    saveGame(s);
  },

  toggleDelegateStaffHiring: () => {
    const s = get().state;
    if (!s) return;
    s.delegateStaffHiring = !s.delegateStaffHiring;
    set({ state: { ...s } });
    saveGame(s);
  },

  hireCoach: (coachId, years, salary) => {
    const s = get().state;
    if (!s) return;
    signCoach(s, coachId, s.userFranchiseId, years, salary);
    set({ state: { ...s } });
    saveGame(s);
  },
  fireCoachAction: (coachId) => {
    const s = get().state;
    if (!s) return { ok: false, buyout: 0, reason: 'no game' };
    const r = fireCoach(s, coachId);
    set({ state: { ...s } });
    saveGame(s);
    return r;
  },
  waivePlayerAction: (playerId) => {
    const s = get().state;
    if (!s) return { ok: false, deadMoney: 0, reason: 'no game' };
    const r = waivePlayer(s, playerId);
    set({ state: { ...s } });
    saveGame(s);
    return r;
  },
  purchaseUpgradeAction: (type) => {
    const s = get().state;
    if (!s) return { ok: false, reason: 'no game' };
    const r = purchaseUpgrade(s, type);
    set({ state: { ...s } });
    saveGame(s);
    return r;
  },
}));
