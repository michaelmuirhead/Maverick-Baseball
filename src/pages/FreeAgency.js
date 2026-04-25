import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import { estimateFairAAV } from '../engine/trades';
export function FreeAgency() {
    const { state, faPlaceBid, advanceTo, toggleDelegateFA } = useGame();
    const [selected, setSelected] = useState(null);
    const [aav, setAav] = useState(8_000_000);
    const [years, setYears] = useState(3);
    const [search, setSearch] = useState('');
    const [posFilter, setPosFilter] = useState('all');
    const [minOVR, setMinOVR] = useState(0);
    if (!state)
        return null;
    const fa = state.freeAgency;
    if (!fa) {
        return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Free Agency" }), _jsx("div", { style: S.sectionSub, children: "Free agency opens after the World Series." })] }), _jsxs("div", { style: S.panel, children: [_jsx("p", { style: S.byline, children: "The market hasn't opened yet -- current season is in progress." }), _jsx("button", { onClick: () => advanceTo('fa_open'), style: S.radioBtn(true), children: "Sim to FA Open" })] })] }));
    }
    const userFid = state.userFranchiseId;
    const fin = state.finances[userFid];
    const sortedListings = [...fa.listings]
        .map((l) => ({ l, p: state.players[l.playerId] }))
        .filter((x) => x.p)
        .filter((x) => {
        if (search && !`${x.p.firstName} ${x.p.lastName}`.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (posFilter !== 'all' && x.p.pos !== posFilter)
            return false;
        if (x.p.ratings.overall < minOVR)
            return false;
        return true;
    })
        .sort((a, b) => b.p.ratings.overall - a.p.ratings.overall);
    const onSelect = (id) => {
        setSelected(id);
        const p = state.players[id];
        if (p) {
            const fair = estimateFairAAV(p.ratings.overall, p.age);
            setAav(fair);
            setYears(p.age >= 35 ? 1 : p.age >= 32 ? 2 : 3);
        }
    };
    const submitBid = () => {
        if (!selected)
            return;
        const r = faPlaceBid(selected, aav, years);
        if (!r.ok)
            alert(r.reason);
        else
            alert(`Bid placed: ${fmtShort(aav)} x ${years} yr`);
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Free Agency" }), _jsx("div", { style: S.sectionSub, children: fa.open ? `Window open - closes day ${fa.closesOn}` : 'Window closed - leftover bargains only' })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Available Free Agents" }), _jsxs("div", { style: { display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }, children: [_jsx("input", { placeholder: "Search name...", value: search, onChange: (e) => setSearch(e.target.value), style: { flex: 1, padding: 6, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel } }), _jsxs("select", { value: posFilter, onChange: (e) => setPosFilter(e.target.value), style: { padding: 6, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: [_jsx("option", { value: "all", children: "All positions" }), ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'].map(p => _jsx("option", { value: p, children: p }, p))] }), _jsx("span", { style: { ...S.eyebrow, fontSize: 10 }, children: "Min OVR" }), _jsx("input", { type: "number", value: minOVR, onChange: (e) => setMinOVR(parseInt(e.target.value, 10) || 0), style: { width: 60, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel } }), _jsxs("span", { style: { ...S.byline, fontSize: 11 }, children: [sortedListings.length, " shown"] })] }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Asking AAV" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Yrs" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Bids" }), _jsx("th", { style: S.th, children: "Status" })] }) }), _jsx("tbody", { children: sortedListings.map(({ l, p }) => {
                                            const signed = !!l.signedBy;
                                            return (_jsxs("tr", { style: { background: selected === l.playerId ? '#f8f2e4' : 'transparent', cursor: 'pointer', opacity: signed ? 0.6 : 1 }, onClick: () => onSelect(l.playerId), children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.age }), _jsx("td", { style: { ...S.td, ...S.tdNum, fontWeight: 600 }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: fmtShort(l.asking) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: l.years }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: l.bids.length }), _jsx("td", { style: S.td, children: signed ? (_jsx("span", { style: { ...S.badge, ...S.badgeGreen }, children: `Signed → ${FRANCHISES[l.signedBy].abbr}` })) : (_jsx("span", { style: { ...S.badge, ...S.badgeGold }, children: "Open" })) })] }, l.playerId));
                                        }) })] })] }), _jsxs("div", { children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Your Treasury" }), _jsxs("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }, children: ["Cash: ", fmtShort(fin.teamCash), _jsx("br", {}), "Owner: ", fmtShort(fin.ownerCash)] })] }), _jsxs("div", { style: { ...S.panel, marginTop: 12 }, children: [_jsx("div", { style: S.panelTitle, children: "GM Delegation" }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: !!state.delegateFA, onChange: () => toggleDelegateFA() }), _jsx("span", { style: { fontFamily: "'IBM Plex Serif', serif", fontSize: 13 }, children: "Let my GM bid on free agents" })] }), _jsx("div", { style: { ...S.byline, fontSize: 11, marginTop: 6, color: COLORS.inkDim }, children: state.delegateFA
                                            ? "Your GM will identify roster gaps and pursue affordable FAs each day. You can still place your own bids."
                                            : "All FA bidding is yours. Toggle on to let your GM auto-bid on roster needs." })] }), selected && (() => {
                                const listing = fa.listings.find((l) => l.playerId === selected);
                                const p = state.players[selected];
                                if (!listing || !p)
                                    return null;
                                const signed = !!listing.signedBy;
                                const insufficient = fin.teamCash < aav;
                                const reason = signed
                                    ? `Already signed to ${FRANCHISES[listing.signedBy].abbr}`
                                    : insufficient
                                        ? `Need ${fmtShort(aav)} cash; have ${fmtShort(fin.teamCash)}`
                                        : !fa.open
                                            ? 'Window closed - leftover bargain bid'
                                            : null;
                                const canBid = !signed && !insufficient;
                                return (_jsxs("div", { style: { ...S.panel, marginTop: 12 }, children: [_jsx("div", { style: S.panelTitle, children: "Place Bid" }), _jsxs("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 18 }, children: [p.firstName, " ", p.lastName] }), _jsxs("div", { style: S.byline, children: [p.pos, " - Age ", p.age, " - OVR ", toScout(p.ratings.overall)] }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: S.eyebrow, children: "AAV (per year)" }), _jsx("input", { type: "number", value: aav, onChange: (e) => setAav(parseInt(e.target.value, 10) || 0), step: 500_000, style: { width: '100%', padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel } })] }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: S.eyebrow, children: "Years" }), _jsx("input", { type: "number", min: 1, max: 10, value: years, onChange: (e) => setYears(parseInt(e.target.value, 10) || 1), style: { width: '100%', padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel } })] }), _jsxs("div", { style: { marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }, children: ["Total: ", fmtShort(aav * years)] }), _jsx("button", { onClick: submitBid, disabled: !canBid, style: {
                                                ...S.radioBtn(true),
                                                background: canBid ? COLORS.red : COLORS.inkDim,
                                                borderColor: canBid ? COLORS.red : COLORS.inkDim,
                                                marginTop: 8,
                                                opacity: canBid ? 1 : 0.5,
                                                cursor: canBid ? 'pointer' : 'not-allowed',
                                            }, children: "Submit Bid" }), reason && (_jsx("div", { style: { ...S.byline, fontSize: 11, marginTop: 4, color: signed || insufficient ? COLORS.red : COLORS.inkDim }, children: reason })), _jsxs("div", { style: { marginTop: 12 }, children: [_jsx("div", { style: S.eyebrow, children: "Current Bids" }), listing.bids.length === 0 && _jsx("div", { style: S.byline, children: "No bids yet." }), listing.bids
                                                    .slice()
                                                    .sort((a, b) => b.aav - a.aav)
                                                    .map((b) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsx("span", { children: FRANCHISES[b.franchiseId].abbr }), _jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }, children: [fmtShort(b.aav), " x ", b.years] })] }, b.franchiseId + b.dayPlaced)))] })] }));
                            })()] })] })] }));
}
