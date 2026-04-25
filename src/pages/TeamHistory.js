import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort } from '../engine/format';
import { franchiseHistory, championsList } from '../engine/teamHistory';
import { SortableTable } from '../components/SortableTable';
function resultLabel(entry) {
    if (entry.champion)
        return 'World Champion';
    switch (entry.playoff_result) {
        case 'ws_loss': return 'WS runner-up';
        case 'lcs_out': return 'LCS';
        case 'ds_out': return 'Division Series';
        case 'wc_out': return 'Wild Card';
        default: return entry.made_playoffs ? 'Postseason' : 'Missed playoffs';
    }
}
export function TeamHistory() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const team = FRANCHISES[fid];
    const history = franchiseHistory(state, fid);
    const champs = championsList(state);
    const cols = [
        { key: 'season', label: 'Year', sortValue: (r) => r.season, render: (r) => r.season, align: 'right', width: 60 },
        {
            key: 'record', label: 'Record',
            sortValue: (r) => r.wins,
            render: (r) => `${r.wins}–${r.losses}`,
            align: 'right', width: 80,
        },
        {
            key: 'pct', label: 'Win %',
            sortValue: (r) => r.wins / Math.max(1, r.wins + r.losses),
            render: (r) => (r.wins / Math.max(1, r.wins + r.losses)).toFixed(3),
            align: 'right', width: 72,
        },
        {
            key: 'result', label: 'Result',
            sortValue: (r) => r.champion ? 5 : r.playoff_result === 'ws_loss' ? 4 :
                r.playoff_result === 'lcs_out' ? 3 : r.playoff_result === 'ds_out' ? 2 :
                    r.playoff_result === 'wc_out' ? 1 : 0,
            render: (r) => (_jsx("span", { style: {
                    color: r.champion ? COLORS.green : r.made_playoffs ? COLORS.ink : COLORS.inkDim,
                    fontWeight: r.champion ? 600 : 400,
                }, children: resultLabel(r) })),
        },
        {
            key: 'payroll', label: 'Payroll',
            sortValue: (r) => r.payroll,
            render: (r) => fmtShort(r.payroll),
            align: 'right', width: 90,
        },
        {
            key: 'net', label: 'Net',
            sortValue: (r) => r.net || 0,
            render: (r) => (_jsx("span", { style: { color: (r.net || 0) >= 0 ? COLORS.green : COLORS.red }, children: r.net ? fmtShort(r.net) : '—' })),
            align: 'right', width: 90,
        },
        {
            key: 'job', label: 'Job Sec',
            sortValue: (r) => r.jobSecurityEnd ?? 0,
            render: (r) => r.jobSecurityEnd != null ? Math.round(r.jobSecurityEnd) : '—',
            align: 'right', width: 72,
        },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Team History" }), _jsxs("div", { style: S.sectionSub, children: [team.city, " ", team.name] })] }), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Franchise record book" }), _jsxs("div", { style: { display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }, children: [_jsx(Stat, { label: "Seasons", value: history.length }), _jsx(Stat, { label: "Playoff apps", value: history.filter((r) => r.made_playoffs).length }), _jsx(Stat, { label: "Pennants", value: history.filter((r) => r.playoff_result === 'ws_loss' || r.champion).length }), _jsx(Stat, { label: "Championships", value: history.filter((r) => r.champion).length }), _jsx(Stat, { label: "Career W\u2013L", value: `${history.reduce((s, r) => s + r.wins, 0)}–${history.reduce((s, r) => s + r.losses, 0)}` })] })] }), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Season-by-season" }), history.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }, children: "No seasons completed yet. Come back after your first World Series." })) : (_jsx(SortableTable, { rows: history, columns: cols, initialSortKey: "season", initialSortDir: "desc", rowKey: (r) => String(r.season) }))] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "League Champions" }), !state.championHistory || state.championHistory.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }, children: "No champion crowned yet." })) : (_jsx("div", { style: { marginTop: 8 }, children: [...state.championHistory].sort((a, b) => b.season - a.season).map((c) => {
                            const f = FRANCHISES[c.championFid];
                            return (_jsxs("div", { style: { borderBottom: '1px solid ' + COLORS.ink, padding: '12px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }, children: [_jsx("div", { style: { minWidth: 80, fontFamily: "'DM Serif Display', serif", fontSize: 28, color: COLORS.green }, children: c.season }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 18 }, children: f ? f.city + ' ' + f.name : c.championFid }), _jsxs("div", { style: { ...S.byline, fontSize: 12 }, children: ["Regular season: ", c.wins, "-", c.losses, " (", ((c.wins / Math.max(1, c.wins + c.losses)) * 100).toFixed(1), "%)"] }), _jsxs("div", { style: { marginTop: 6, fontSize: 12, fontFamily: "'IBM Plex Serif', serif" }, children: [_jsx("strong", { children: "Path:" }), ' ', c.defeated.map((d, i) => {
                                                        const opp = FRANCHISES[d.opponentFid];
                                                        const roundLabel = { wild_card: 'WC', division: 'DS', lcs: 'LCS', world_series: 'WS' }[d.round];
                                                        return (_jsxs("span", { children: [i > 0 && _jsx("span", { style: { color: COLORS.inkDim }, children: " \u2192 " }), _jsxs("span", { children: [_jsx("strong", { children: roundLabel }), " def. ", opp?.abbr || d.opponentFid, " ", d.gamesWon, "-", d.gamesLost] })] }, i));
                                                    })] })] })] }, c.season));
                        }) }))] })] }));
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
function Stat({ label, value }) {
    return (_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: label }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 24 }, children: value })] }));
}
