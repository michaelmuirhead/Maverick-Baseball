import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import { evaluateTradeForAI, suggestCounter, tradeValue, tradeWindowOpen, tradeWindowLabel, } from '../engine/trades';
export function Trades() {
    const { state, executeTradeAction } = useGame();
    const [partner, setPartner] = useState('');
    const [giving, setGiving] = useState([]);
    const [receiving, setReceiving] = useState([]);
    const [givingCash, setGivingCash] = useState(0);
    const [receivingCash, setReceivingCash] = useState(0);
    const [evalResult, setEvalResult] = useState(null);
    const [aiCounter, setAiCounter] = useState(null);
    if (!state)
        return null;
    const userFid = state.userFranchiseId;
    const open = tradeWindowOpen(state);
    const partnerOptions = Object.keys(FRANCHISES).filter((id) => id !== userFid);
    function toggle(arr, setArr, id) {
        if (arr.includes(id))
            setArr(arr.filter((x) => x !== id));
        else
            setArr([...arr, id]);
    }
    function evaluate() {
        if (!partner || (giving.length === 0 && givingCash === 0) || (receiving.length === 0 && receivingCash === 0))
            return;
        const r = evaluateTradeForAI(state, partner, receiving, giving, receivingCash, givingCash);
        setEvalResult(r);
        if (r.countering) {
            const counter = suggestCounter(state, partner, userFid, receiving, giving, r);
            setAiCounter(counter);
        }
        else
            setAiCounter(null);
    }
    function execute() {
        if (!partner || (giving.length === 0 && givingCash === 0) || (receiving.length === 0 && receivingCash === 0))
            return;
        executeTradeAction(userFid, partner, giving, receiving, givingCash, receivingCash);
        setGiving([]);
        setReceiving([]);
        setGivingCash(0);
        setReceivingCash(0);
        setEvalResult(null);
        setAiCounter(null);
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Trade Desk" }), _jsx("div", { style: S.sectionSub, children: tradeWindowLabel(state) })] }), !open && (_jsx("div", { style: { ...S.panel, marginBottom: 16, background: '#ecd9d9' }, children: "The trade window is currently closed. Wait for the next eligible window." })), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Trade Partner" }), _jsxs("select", { value: partner, onChange: (e) => { setPartner(e.target.value); setGiving([]); setReceiving([]); setEvalResult(null); }, style: { width: 260, padding: 8, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: [_jsx("option", { value: "", children: "-- Pick a team --" }), partnerOptions.map((id) => {
                                const f = FRANCHISES[id];
                                return _jsxs("option", { value: id, children: [f.city, " ", f.name] }, id);
                            })] })] }), partner && state.minorRosters?.[partner] && (_jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsxs("div", { style: S.panelTitle, children: ["Scouting ", FRANCHISES[partner].abbr, " farm system"] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }, children: ['aaa', 'aa', 'a'].map((lvl) => {
                            const ids = state.minorRosters[partner][lvl] || [];
                            const sorted = ids
                                .map((id) => state.players[id])
                                .filter(Boolean)
                                .sort((a, b) => b.potential - a.potential)
                                .slice(0, 6);
                            return (_jsxs("div", { children: [_jsxs("div", { style: { ...S.eyebrow, marginBottom: 4 }, children: [lvl.toUpperCase(), " (", ids.length, ")"] }), sorted.map((p) => (_jsxs("div", { style: { fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", padding: '2px 0', color: COLORS.inkDim }, children: [_jsxs("span", { style: { color: COLORS.ink }, children: [p.firstName, " ", p.lastName] }), _jsxs("span", { children: [" ", p.pos, " OVR", toScout(p.ratings.overall), "/POT", toScout(p.potential)] })] }, p.id)))] }, lvl));
                        }) })] })), partner && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsx(PlayerPickList, { title: `You send`, subtitle: `from ${FRANCHISES[userFid].name}`, roster: state.rosters[userFid], players: state.players, selected: giving, onToggle: (id) => toggle(giving, setGiving, id) }), _jsx(PlayerPickList, { title: `You receive`, subtitle: `from ${FRANCHISES[partner].name}`, roster: state.rosters[partner], players: state.players, selected: receiving, onToggle: (id) => toggle(receiving, setReceiving, id) })] })), partner && (_jsxs("div", { style: { marginTop: 16, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "Cash Considerations" }), _jsx("div", { style: { ...S.byline, marginBottom: 8 }, children: "Up to $20M in cash may be attached in either direction." }), _jsxs("div", { style: { display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: S.eyebrow, children: "You send cash:" }), _jsx("input", { type: "number", min: 0, max: 20_000_000, step: 500_000, value: givingCash, onChange: (e) => setGivingCash(Math.max(0, Math.min(20_000_000, Number(e.target.value)))), style: { width: 140, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}` } })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: S.eyebrow, children: "You receive cash:" }), _jsx("input", { type: "number", min: 0, max: 20_000_000, step: 500_000, value: receivingCash, onChange: (e) => setReceivingCash(Math.max(0, Math.min(20_000_000, Number(e.target.value)))), style: { width: 140, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}` } })] })] })] })), partner && ((giving.length > 0 || givingCash > 0) && (receiving.length > 0 || receivingCash > 0)) && (_jsxs("div", { style: { marginTop: 16, ...S.panelThick }, children: [_jsx("div", { style: S.panelTitle, children: "Evaluation" }), _jsx("button", { onClick: evaluate, style: { ...S.radioBtn(true), background: COLORS.ink, marginRight: 8 }, children: "Run Evaluation" }), evalResult?.accepted && open && (_jsx("button", { onClick: execute, style: { ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }, children: "Execute Trade" })), evalResult && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx("div", { style: S.eyebrow, children: "Result" }), _jsxs("div", { style: {
                                    fontFamily: "'DM Serif Display', serif", fontSize: 18,
                                    color: evalResult.accepted ? COLORS.green : COLORS.red,
                                }, children: [evalResult.accepted ? 'Accepted' : 'Rejected', " -- ", evalResult.reason] }), _jsxs("div", { style: { ...S.byline, fontSize: 13 }, children: ["Their TVS evaluation: send ", evalResult.givingValue, " \u2192 receive ", evalResult.receivingValue] }), aiCounter && (_jsxs("div", { style: { marginTop: 8 }, children: [_jsx("span", { style: { ...S.badge, ...S.badgeGold }, children: "Counter" }), ' ', "They'd consider it if you also include", ' ', _jsxs("strong", { children: [state.players[aiCounter].firstName, " ", state.players[aiCounter].lastName] }), ' ', "(", state.players[aiCounter].pos, ", OVR ", toScout(state.players[aiCounter].ratings.overall), ")."] }))] }))] }))] }));
}
function PlayerPickList({ title, subtitle, roster, players, selected, onToggle, }) {
    const sorted = useMemo(() => {
        return [...roster]
            .map((id) => players[id])
            .filter(Boolean)
            .sort((a, b) => b.ratings.overall - a.ratings.overall);
    }, [roster, players]);
    const pickedTotalValue = selected.reduce((s, id) => s + tradeValue(players[id]), 0);
    return (_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: title }), _jsx("div", { style: S.byline, children: subtitle }), _jsxs("div", { style: { ...S.eyebrow, marginTop: 4 }, children: ["Total TVS: ", pickedTotalValue] }), _jsx("div", { style: { maxHeight: 480, overflowY: 'auto', marginTop: 8 }, children: sorted.map((p) => {
                    const checked = selected.includes(p.id);
                    return (_jsxs("div", { onClick: () => onToggle(p.id), style: {
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                            cursor: 'pointer', background: checked ? '#f8f2e4' : 'transparent',
                            borderBottom: '1px dotted rgba(26,24,20,0.13)',
                        }, children: [_jsx("input", { type: "checkbox", checked: checked, readOnly: true }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 36 }, children: p.pos }), _jsxs("span", { style: { flex: 1, fontFamily: "'IBM Plex Serif', serif" }, children: [p.firstName, " ", p.lastName] }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.inkDim, width: 30, textAlign: 'right' }, children: toScout(p.ratings.overall) }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 60, textAlign: 'right' }, children: p.contract ? fmtShort(p.contract.salary) : '--' }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, width: 30, textAlign: 'right' }, children: tradeValue(p) })] }, p.id));
                }) })] }));
}
