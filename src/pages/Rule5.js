import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
import { SortableTable } from '../components/SortableTable';
import { rule5CurrentTeam } from '../engine/rule5';
export function Rule5() {
    const { state, rule5PickAction, rule5AutoComplete } = useGame();
    if (!state)
        return null;
    const draft = state.rule5;
    if (!draft) {
        return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Rule 5 Draft" }), _jsx("div", { style: S.sectionSub, children: "Fires on offseason day -20" })] }), _jsx("div", { style: S.panel, children: "The Rule 5 draft has not started yet. Advance the offseason to day -20 to trigger it." })] }));
    }
    const currentFid = rule5CurrentTeam(state);
    const isUserTurn = currentFid === state.userFranchiseId && !draft.complete;
    const pickNumber = draft.currentPickIndex + 1;
    const totalPicks = draft.order.length;
    const eligible = useMemo(() => {
        return draft.eligible.map((id) => state.players[id]).filter(Boolean)
            .sort((a, b) => b.potential - a.potential);
    }, [draft.eligible, state.players]);
    const cols = [
        { key: 'name', label: 'Name', sortValue: (p) => `${p.lastName} ${p.firstName}`, render: (p) => `${p.firstName} ${p.lastName}` },
        { key: 'pos', label: 'Pos', sortValue: (p) => p.pos, render: (p) => p.pos, width: 52, align: 'right' },
        { key: 'age', label: 'Age', sortValue: (p) => p.age, render: (p) => p.age, width: 48, align: 'right' },
        {
            key: 'from', label: 'From',
            sortValue: (p) => p.franchiseId || 'FA',
            render: (p) => p.franchiseId ? FRANCHISES[p.franchiseId].abbr : 'FA',
            width: 60, align: 'right',
        },
        { key: 'ovr', label: 'OVR', sortValue: (p) => p.ratings.overall, render: (p) => toScout(p.ratings.overall), width: 52, align: 'right' },
        { key: 'pot', label: 'POT', sortValue: (p) => p.potential, render: (p) => toScout(p.potential), width: 52, align: 'right' },
        {
            key: 'sel', label: '',
            sortable: false,
            render: (p) => (_jsx("button", { disabled: !isUserTurn, style: { ...S.radioBtn(true), background: isUserTurn ? COLORS.ink : COLORS.inkDim, opacity: isUserTurn ? 1 : 0.5, fontSize: 11, padding: '4px 8px' }, onClick: () => rule5PickAction(p.id), children: "Select" })),
            align: 'right', width: 72,
        },
    ];
    const picksRows = draft.picks.slice(-10).reverse();
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Rule 5 Draft" }), _jsxs("div", { style: S.sectionSub, children: [state.season, " \u2014 pick ", pickNumber, " of ", totalPicks] })] }), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsxs("div", { style: { display: 'flex', gap: 24 }, children: [_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "On the clock" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: draft.complete ? 'Draft complete' : (currentFid ? `${FRANCHISES[currentFid].city} ${FRANCHISES[currentFid].name}` : '—') })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Exposed" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: eligible.length })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Fee" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: "$100K" })] }), _jsx("div", { style: { flex: 1 } }), !draft.complete && (_jsx("button", { style: S.radioBtn(true), onClick: () => rule5AutoComplete(), children: "Auto-complete" }))] }), isUserTurn && (_jsx("div", { style: { ...S.eyebrow, marginTop: 8, color: COLORS.green }, children: "You're on the clock. Select a player or pass via auto-complete." }))] }), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Exposed prospects" }), _jsx(SortableTable, { rows: eligible, columns: cols, rowKey: (p) => p.id, initialSortKey: "pot", maxHeight: 480 })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Recent picks" }), picksRows.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }, children: "No picks yet." })) : (_jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: headStyle, children: "Team" }), _jsx("th", { style: headStyle, children: "Player" }), _jsx("th", { style: headStyle, children: "From" })] }) }), _jsx("tbody", { children: picksRows.map((pick, i) => {
                                    const p = pick.playerId ? state.players[pick.playerId] : null;
                                    return (_jsxs("tr", { style: { borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsx("td", { style: { padding: '6px 8px' }, children: FRANCHISES[pick.franchiseId].abbr }), _jsx("td", { style: { padding: '6px 8px' }, children: p ? `${p.firstName} ${p.lastName} (${p.pos})` : _jsx("em", { style: { color: COLORS.inkDim }, children: "Pass" }) }), _jsx("td", { style: { padding: '6px 8px' }, children: pick.previousFid ? FRANCHISES[pick.previousFid]?.abbr : '—' })] }, i));
                                }) })] }))] })] }));
}
const headStyle = {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: `1px solid ${COLORS.ink}`,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.inkDim,
};
