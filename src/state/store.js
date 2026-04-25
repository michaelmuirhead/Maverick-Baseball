import { create } from 'zustand';
import { initWorld, advanceDay, advanceToMilestone } from '../engine/world';
import { executeTrade, executeTradeWithCash } from '../engine/trades';
import { userSignIntlProspect } from '../engine/internationalSignings';
import { userRule5Pick, autoCompleteRule5 } from '../engine/rule5';
import { callUpFromMinors, sendDownToMinors } from '../engine/minors';
import { acceptGMOffer } from '../engine/gmCareer';
import { buildNewStadium } from '../engine/stadiumReplace';
import { relocateFranchise } from '../engine/relocation';
import { setBullpenRoleAction as setRoleEng, setUserDepthAt } from '../engine/depth';
import { autoCompleteDraft, makePick, autoPickUntilUser } from '../engine/draft';
import { userPlaceBid, signFreeAgent } from '../engine/freeAgency';
import { fireCoach, signCoach } from '../engine/coaches';
import { waivePlayer } from '../engine/waiver';
import { purchaseUpgrade } from '../engine/stadium';
import { RNG } from '../engine/rng';
import { saveGame, loadGame, clearSave, hasSave } from './save';
export const useGame = create((set, get) => ({
    view: 'splash',
    page: 'dashboard',
    lastSubByGroup: {},
    state: null,
    selectedPlayerId: null,
    setSelectedPlayerId: (id) => set({ selectedPlayerId: id, page: id ? 'player_career' : get().page }),
    setState: (s) => { set({ state: s }); saveGame(s); },
    setView: (v) => set({ view: v }),
    setPage: (p) => {
        const cur = get();
        const NAV_GROUPS = [
            { id: 'team', subs: ['dashboard', 'roster', 'lineup', 'depth_chart', 'roster_management', 'minors', 'staff', 'injured_list'] },
            { id: 'players', subs: ['trades', 'free_agency', 'draft', 'international', 'rule5', 'prospects'] },
            { id: 'games', subs: ['schedule', 'standings', 'live_game', 'playoffs'] },
            { id: 'office', subs: ['finances', 'stadium', 'awards', 'leaderboards', 'history'] },
            { id: 'misc', subs: ['news', 'settings'] },
        ];
        const grp = NAV_GROUPS.find(g => g.subs.includes(p))?.id || 'team';
        set({ page: p, lastSubByGroup: { ...cur.lastSubByGroup, [grp]: p } });
    },
    newGame: (seed, franchiseId, scenario, expansionConfig, playMode) => {
        const state = initWorld(seed, franchiseId, scenario, expansionConfig || null, playMode || 'owner');
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
        if (!s)
            return;
        const next = advanceDay(s);
        set({ state: next });
        saveGame(next);
    },
    advanceTo: (milestone) => {
        const s = get().state;
        if (!s)
            return;
        const next = advanceToMilestone(s, milestone);
        set({ state: next });
        saveGame(next);
    },
    executeTradeAction: (fromFid, toFid, fromIds, toIds, fromCash, toCash) => {
        const s = get().state;
        if (!s)
            return;
        const hasCash = (fromCash && fromCash > 0) || (toCash && toCash > 0);
        const next = hasCash
            ? executeTradeWithCash(s, fromFid, toFid, fromIds, toIds, fromCash || 0, toCash || 0)
            : executeTrade(s, fromFid, toFid, fromIds, toIds);
        set({ state: next });
        saveGame(next);
    },
    signIntlAction: (prospectId, bonus) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = userSignIntlProspect(s, prospectId, bonus);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    rule5PickAction: (playerId) => {
        const s = get().state;
        if (!s || !s.rule5)
            return;
        userRule5Pick(s, playerId);
        set({ state: { ...s } });
        saveGame(s);
    },
    rule5AutoComplete: () => {
        const s = get().state;
        if (!s || !s.rule5)
            return;
        const rng = new RNG(s.rngState);
        autoCompleteRule5(s, rng);
        s.rngState = rng.state;
        set({ state: { ...s } });
        saveGame(s);
    },
    callUpAction: (playerId) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = callUpFromMinors(s, playerId);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    sendDownAction: (playerId, targetLevel) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = sendDownToMinors(s, playerId, targetLevel);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    setTicketPrice: (fid, price) => {
        const s = get().state;
        if (!s)
            return;
        s.finances[fid].ticketPrice = price;
        set({ state: { ...s } });
        saveGame(s);
    },
    setPremiumPrice: (fid, price) => {
        const s = get().state;
        if (!s)
            return;
        s.finances[fid].premiumPrice = price;
        set({ state: { ...s } });
        saveGame(s);
    },
    setParkingPrice: (fid, price) => {
        const s = get().state;
        if (!s)
            return;
        s.finances[fid].parkingPrice = price;
        set({ state: { ...s } });
        saveGame(s);
    },
    draftPick: (playerId) => {
        const s = get().state;
        if (!s || !s.draft)
            return;
        const draft = makePick(s, s.draft, playerId);
        set({ state: { ...s, draft } });
        saveGame(s);
    },
    draftAutoPickUntilUser: () => {
        const s = get().state;
        if (!s || !s.draft)
            return;
        const rng = new RNG(s.rngState);
        const draft = autoPickUntilUser(s, s.draft, s.userFranchiseId, rng);
        s.rngState = rng.state;
        set({ state: { ...s, draft } });
        saveGame(s);
    },
    draftAutoComplete: () => {
        const s = get().state;
        if (!s || !s.draft)
            return;
        const rng = new RNG(s.rngState);
        const draft = autoCompleteDraft(s, s.draft, rng);
        s.rngState = rng.state;
        set({ state: { ...s, draft } });
        saveGame(s);
    },
    faPlaceBid: (playerId, aav, years) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const result = userPlaceBid(s, s.userFranchiseId, playerId, aav, years);
        set({ state: { ...s } });
        saveGame(s);
        return result;
    },
    faAcceptBid: (playerId, fromFid) => {
        const s = get().state;
        if (!s || !s.freeAgency)
            return;
        const listing = s.freeAgency.listings.find((l) => l.playerId === playerId);
        if (!listing)
            return;
        const bid = listing.bids.find((b) => b.franchiseId === fromFid);
        if (!bid)
            return;
        signFreeAgent(s, listing, bid);
        set({ state: { ...s } });
        saveGame(s);
    },
    toggleGmDelegated: () => {
        const s = get().state;
        if (!s)
            return;
        s.gmDelegated = !s.gmDelegated;
        set({ state: { ...s } });
        saveGame(s);
    },
    toggleDelegateFA: () => {
        const s = get().state;
        if (!s)
            return;
        s.delegateFA = !s.delegateFA;
        set({ state: { ...s } });
        saveGame(s);
    },
    toggleDelegateRoster: () => {
        const s = get().state;
        if (!s)
            return;
        s.delegateRoster = !s.delegateRoster;
        set({ state: { ...s } });
        saveGame(s);
    },
    acceptGMOfferAction: (franchiseId) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = acceptGMOffer(s, franchiseId);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    buildStadiumAction: (spec) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = buildNewStadium(s, spec);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    relocateAction: (spec) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = relocateFranchise(s, spec);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    setBullpenRoleAction: (playerId, role) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = setRoleEng(s, playerId, role);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    setDepthAtAction: (pos, orderedIds) => {
        const s = get().state;
        if (!s)
            return;
        setUserDepthAt(s, s.userFranchiseId, pos, orderedIds);
        set({ state: { ...s } });
        saveGame(s);
    },
    toggleDelegateStaffHiring: () => {
        const s = get().state;
        if (!s)
            return;
        s.delegateStaffHiring = !s.delegateStaffHiring;
        set({ state: { ...s } });
        saveGame(s);
    },
    hireCoach: (coachId, years, salary) => {
        const s = get().state;
        if (!s)
            return;
        signCoach(s, coachId, s.userFranchiseId, years, salary);
        set({ state: { ...s } });
        saveGame(s);
    },
    fireCoachAction: (coachId) => {
        const s = get().state;
        if (!s)
            return { ok: false, buyout: 0, reason: 'no game' };
        const r = fireCoach(s, coachId);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    waivePlayerAction: (playerId) => {
        const s = get().state;
        if (!s)
            return { ok: false, deadMoney: 0, reason: 'no game' };
        const r = waivePlayer(s, playerId);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
    purchaseUpgradeAction: (type) => {
        const s = get().state;
        if (!s)
            return { ok: false, reason: 'no game' };
        const r = purchaseUpgrade(s, type);
        set({ state: { ...s } });
        saveGame(s);
        return r;
    },
}));
