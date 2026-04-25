import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { top100Prospects, teamTopProspects } from '../engine/prospects';
import { toScout } from '../engine/format';
import { SortableTable } from '../components/SortableTable';
export function Prospects() {
    const { state, setSelectedPlayerId } = useGame();
    const [scope, setScope] = useState('league');
    if (!state)
        return null;
    const league = useMemo(() => top100Prospects(state), [state]);
    const mine = useMemo(() => teamTopProspects(state, state.userFranchiseId, 25), [state]);
    const rows = scope === 'league' ? league : mine;
    const cols = [
        { key: 'rank', label: '#', sortValue: (r) => r.rank, render: (r) => r.rank, align: 'right', width: 40 },
        {
            key: 'name', label: 'Name',
            sortValue: (r) => `${r.player.lastName} ${r.player.firstName}`,
            render: (r) => (_jsxs("span", { style: { fontFamily: "'IBM Plex Serif', serif" }, children: [r.player.firstName, " ", r.player.lastName] })),
        },
        {
            key: 'pos', label: 'Pos',
            sortValue: (r) => r.player.pos,
            render: (r) => r.player.pos, align: 'right', width: 52,
        },
        {
            key: 'age', label: 'Age',
            sortValue: (r) => r.player.age,
            render: (r) => r.player.age, align: 'right', width: 50,
        },
        {
            key: 'team', label: 'Team',
            sortValue: (r) => r.player.franchiseId ? FRANCHISES[r.player.franchiseId].abbr : 'FA',
            render: (r) => r.player.franchiseId ? FRANCHISES[r.player.franchiseId].abbr : 'FA',
            align: 'right', width: 60,
        },
        {
            key: 'ovr', label: 'OVR',
            sortValue: (r) => r.player.ratings.overall,
            render: (r) => toScout(r.player.ratings.overall),
            align: 'right', width: 52,
        },
        {
            key: 'pot', label: 'POT',
            sortValue: (r) => r.player.potential,
            render: (r) => toScout(r.player.potential),
            align: 'right', width: 52,
        },
        {
            key: 'score', label: 'Score',
            sortValue: (r) => r.score,
            render: (r) => r.score.toFixed(1),
            align: 'right', width: 60,
        },
        {
            key: 'eta', label: 'ETA',
            sortValue: (r) => r.eta,
            render: (r) => r.eta === 0 ? 'Now' : `${r.eta}y`,
            align: 'right', width: 52,
        },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Prospect Rankings" }), _jsx("div", { style: S.sectionSub, children: "Top under-26 talent, ranked by projection" })] }), _jsx("div", { style: { ...S.panel, marginBottom: 16 }, children: _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { style: S.radioBtn(scope === 'league'), onClick: () => setScope('league'), children: "League Top 100" }), _jsx("button", { style: S.radioBtn(scope === 'team'), onClick: () => setScope('team'), children: "Your Farm Top 25" })] }) }), _jsx("div", { style: S.panel, children: _jsx(SortableTable, { rows: rows, columns: cols, rowKey: (r) => r.player.id, initialSortKey: "rank", initialSortDir: "asc", onRowClick: (r) => setSelectedPlayerId(r.player.id), emptyMessage: "No prospects found." }) })] }));
}
