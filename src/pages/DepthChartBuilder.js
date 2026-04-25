import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'];
export function DepthChartBuilder() {
    const { state, setDepthAtAction, setBullpenRoleAction } = useGame();
    const [selectedPos, setSelectedPos] = useState('C');
    const [editingChart, setEditingChart] = useState(null);
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const roster = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
    const dc = state.depthCharts?.[fid] || {};
    const currentChart = editingChart || dc[selectedPos] || [];
    const eligible = roster.filter(p => {
        if (selectedPos === 'SP' || selectedPos === 'RP')
            return p.isPitcher;
        if (selectedPos === 'DH')
            return !p.isPitcher;
        return !p.isPitcher && (p.pos === selectedPos || matchesUtility(p.pos, selectedPos));
    });
    const inChart = currentChart.map(id => state.players[id]).filter(Boolean);
    const notInChart = eligible.filter(p => !currentChart.includes(p.id));
    const move = (idx, dir) => {
        const ni = idx + dir;
        if (ni < 0 || ni >= currentChart.length)
            return;
        const next = [...currentChart];
        [next[idx], next[ni]] = [next[ni], next[idx]];
        setEditingChart(next);
    };
    const add = (pid) => setEditingChart([...currentChart, pid]);
    const remove = (pid) => setEditingChart(currentChart.filter(x => x !== pid));
    const save = () => {
        setDepthAtAction(selectedPos, currentChart);
        setEditingChart(null);
    };
    const bullpen = roster.filter(p => p.isPitcher && p.pos === 'RP');
    const closers = bullpen.filter(p => p.bullpenRole === 'closer');
    const setups = bullpen.filter(p => p.bullpenRole === 'setup');
    const middles = bullpen.filter(p => p.bullpenRole === 'middle');
    const loogies = bullpen.filter(p => p.bullpenRole === 'loogy');
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [f.city, " ", f.name, " Depth Chart"] }), _jsx("div", { style: S.sectionSub, children: "Set the order at each position. Topmost is the starter." })] }), _jsx("div", { style: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }, children: POSITIONS.map(pos => (_jsx("button", { onClick: () => { setSelectedPos(pos); setEditingChart(null); }, style: {
                        ...S.btn,
                        fontSize: 12,
                        padding: '4px 10px',
                        background: selectedPos === pos ? '#1c3144' : '#fff',
                        color: selectedPos === pos ? '#fff' : '#000',
                    }, children: pos }, pos))) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsxs("div", { style: S.panelTitle, children: [selectedPos, " Depth (", inChart.length, ")"] }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "#" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Move" })] }) }), _jsx("tbody", { children: inChart.map((p, idx) => (_jsxs("tr", { children: [_jsx("td", { style: { ...S.td, ...S.tdNum, fontWeight: 700 }, children: idx === 0 ? 'S' : idx === 1 ? 'B' : idx + 1 }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsxs("td", { style: S.td, children: [_jsx("button", { onClick: () => move(idx, -1), style: { ...S.btn, fontSize: 11, padding: '2px 6px' }, children: "\u2191" }), _jsx("button", { onClick: () => move(idx, 1), style: { ...S.btn, fontSize: 11, padding: '2px 6px', marginLeft: 4 }, children: "\u2193" }), _jsx("button", { onClick: () => remove(p.id), style: { ...S.btn, fontSize: 11, padding: '2px 6px', marginLeft: 4 }, children: "x" })] })] }, p.id))) })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { onClick: save, style: { ...S.btn, background: '#1c3144', color: '#fff' }, children: "Save" }) })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Available" }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Add" })] }) }), _jsx("tbody", { children: notInChart.map(p => (_jsxs("tr", { children: [_jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: S.td, children: _jsx("button", { onClick: () => add(p.id), style: { ...S.btn, fontSize: 11, padding: '2px 8px' }, children: "+" }) })] }, p.id))) })] })] })] }), selectedPos === 'RP' && (_jsxs("div", { style: { ...S.panel, marginTop: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Bullpen Roles" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }, children: [
                            { role: 'closer', label: 'Closer', list: closers },
                            { role: 'setup', label: 'Setup', list: setups },
                            { role: 'middle', label: 'Middle', list: middles },
                            { role: 'loogy', label: 'LOOGY', list: loogies },
                        ].map(({ role, label, list }) => (_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 600, marginBottom: 6 }, children: [label, " (", list.length, ")"] }), list.map(p => (_jsxs("div", { style: { fontSize: 12, padding: '2px 0' }, children: [p.lastName, " (", toScout(p.ratings.overall), ")"] }, p.id)))] }, role))) }), _jsxs("div", { style: { marginTop: 12, fontSize: 12 }, children: [_jsx("span", { style: { marginRight: 8 }, children: "Assign:" }), bullpen.slice(0, 8).map(p => (_jsxs("span", { style: { marginRight: 8 }, children: [p.lastName, ":", ['closer', 'setup', 'middle', 'loogy'].map(r => (_jsx("button", { onClick: () => setBullpenRoleAction(p.id, r), style: {
                                            ...S.btn,
                                            fontSize: 10,
                                            padding: '1px 4px',
                                            marginLeft: 2,
                                            background: p.bullpenRole === r ? '#1c3144' : '#fff',
                                            color: p.bullpenRole === r ? '#fff' : '#000',
                                        }, children: r[0].toUpperCase() }, r)))] }, p.id)))] })] }))] }));
}
function matchesUtility(playerPos, slot) {
    if (playerPos === 'IF' && ['1B', '2B', '3B', 'SS'].includes(slot))
        return true;
    if (playerPos === 'OF' && ['LF', 'CF', 'RF'].includes(slot))
        return true;
    return false;
}
