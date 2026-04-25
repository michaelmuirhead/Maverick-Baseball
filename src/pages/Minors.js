import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { ratingClass, toScout } from '../engine/format';
export function Minors() {
    const { state, callUpAction, sendDownAction, setSelectedPlayerId } = useGame();
    const [tab, setTab] = useState('aaa');
    const [flash, setFlash] = useState(null);
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const minors = state.minorRosters?.[fid] || { aaa: [], aa: [], a: [] };
    const playersAtLevel = minors[tab]
        .map((id) => state.players[id])
        .filter(Boolean)
        .sort((a, b) => b.ratings.overall - a.ratings.overall);
    const flashMsg = (msg) => {
        setFlash(msg);
        setTimeout(() => setFlash(null), 2500);
    };
    const onCallUp = (pid, name) => {
        const r = callUpAction(pid);
        flashMsg(r.ok ? `Called up ${name}` : (r.reason || 'Failed'));
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [f.city, " ", f.name, " Farm System"] }), _jsxs("div", { style: S.sectionSub, children: ["AAA: ", minors.aaa.length, " - AA: ", minors.aa.length, " - A: ", minors.a.length] })] }), flash && (_jsx("div", { style: { ...S.panel, marginBottom: 12, background: '#f5e2c8' }, children: flash })), _jsx("div", { style: { ...S.panel, marginBottom: 12 }, children: _jsx("div", { style: { display: 'flex', gap: 8 }, children: ['aaa', 'aa', 'a'].map((lvl) => (_jsxs("button", { style: S.radioBtn(tab === lvl), onClick: () => setTab(lvl), children: [lvl.toUpperCase(), " (", minors[lvl].length, ")"] }, lvl))) }) }), _jsxs("div", { style: S.panel, children: [_jsxs("div", { style: S.panelTitle, children: [tab.toUpperCase(), " Roster"] }), playersAtLevel.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', marginTop: 12 }, children: "No players at this level." })) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "POT" }), _jsx("th", { style: S.th, children: "Action" })] }) }), _jsx("tbody", { children: playersAtLevel.map((p) => (_jsxs("tr", { style: { borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsxs("td", { style: { ...S.td, ...S.tdName, color: COLORS.red, textDecoration: 'underline', cursor: 'pointer' }, onClick: () => setSelectedPlayerId(p.id), children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.age }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: ratingClass(p.ratings.overall), fontWeight: 600 }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.potential) }), _jsx("td", { style: S.td, children: _jsx("button", { onClick: () => onCallUp(p.id, `${p.firstName} ${p.lastName}`), style: { ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green, fontSize: 11, padding: '2px 8px' }, children: "Call up" }) })] }, p.id))) })] }))] }), _jsxs("div", { style: { ...S.panel, marginTop: 12 }, children: [_jsx("div", { style: S.panelTitle, children: "Send a player down" }), _jsx("div", { style: S.byline, children: "Active-roster players (with less than 5 yrs service) can be optioned to AAA." }), _jsx(ActiveSendDown, { onSend: (pid, name) => {
                            const r = sendDownAction(pid, 'aaa');
                            flashMsg(r.ok ? `Sent ${name} to AAA` : (r.reason || 'Failed'));
                        } })] })] }));
}
function ActiveSendDown({ onSend }) {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const eligible = (state.rosters[fid] || [])
        .map((id) => state.players[id])
        .filter((p) => p && (p.contract?.serviceDays || 0) < 5 * 172)
        .sort((a, b) => a.ratings.overall - b.ratings.overall);
    if (eligible.length === 0)
        return _jsx("div", { style: { ...S.byline, marginTop: 8 }, children: "No eligible players." });
    return (_jsx("div", { style: { marginTop: 8, maxHeight: 240, overflowY: 'auto' }, children: eligible.slice(0, 12).map((p) => (_jsxs("div", { style: {
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
                borderBottom: '1px dotted rgba(26,24,20,0.13)',
            }, children: [_jsx("span", { style: { width: 36, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }, children: p.pos }), _jsxs("span", { style: { flex: 1, fontFamily: "'IBM Plex Serif', serif" }, children: [p.firstName, " ", p.lastName, " (", toScout(p.ratings.overall), ")"] }), _jsx("button", { onClick: () => onSend(p.id, `${p.firstName} ${p.lastName}`), style: { ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, fontSize: 10, padding: '2px 6px' }, children: "Send to AAA" })] }, p.id))) }));
}
