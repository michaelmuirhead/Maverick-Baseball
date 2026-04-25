import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
export function LineupBuilder() {
    const { state } = useGame();
    const [order, setOrder] = useState([]);
    const [dragIdx, setDragIdx] = useState(null);
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const roster = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
    const hitters = roster.filter(p => !p.isPitcher);
    // Initialize from current best 9
    if (order.length === 0 && hitters.length >= 9) {
        const initial = [...hitters].sort((a, b) => b.ratings.overall - a.ratings.overall).slice(0, 9).map(p => p.id);
        setOrder(initial);
        return null;
    }
    const onDragStart = (idx) => setDragIdx(idx);
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (idx) => {
        if (dragIdx === null)
            return;
        const next = [...order];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(idx, 0, moved);
        setOrder(next);
        setDragIdx(null);
    };
    const benchHitters = hitters.filter(p => !order.includes(p.id));
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [f.city, " ", f.name, " Lineup"] }), _jsx("div", { style: S.sectionSub, children: "Drag to reorder the batting order. Top of the order bats first." })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Batting Order" }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "#" }), _jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Hit" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Pow" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Run" })] }) }), _jsx("tbody", { children: order.map((pid, idx) => {
                                            const p = state.players[pid];
                                            if (!p)
                                                return null;
                                            const tg = p.toolGrades || {};
                                            return (_jsxs("tr", { draggable: true, onDragStart: () => onDragStart(idx), onDragOver: onDragOver, onDrop: () => onDrop(idx), style: { cursor: 'grab', background: dragIdx === idx ? '#fff5e0' : 'transparent' }, children: [_jsx("td", { style: { ...S.td, ...S.tdNum, fontWeight: 700 }, children: idx + 1 }), _jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: tg.hit ?? '—' }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: tg.power ?? '—' }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: tg.run ?? '—' })] }, pid));
                                        }) })] }), _jsx("div", { style: { marginTop: 8, fontSize: 12, color: '#777' }, children: "Tip: leadoff = high contact + speed. 3-4 hole = power. 9-hole = pitcher or weakest hitter." })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Bench / Available" }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Add" })] }) }), _jsx("tbody", { children: benchHitters.map(p => (_jsxs("tr", { children: [_jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: S.td, children: _jsx("button", { onClick: () => order.length < 9 && setOrder([...order, p.id]), style: { ...S.btn, fontSize: 11, padding: '2px 8px' }, children: "\u2191" }) })] }, p.id))) })] })] })] })] }));
}
