import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
import { injuredPlayers } from '../engine/injuries';
export function InjuredList() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const own = injuredPlayers(state, fid);
    // League-wide IL count
    const leagueWide = {};
    for (const id of Object.keys(state.rosters)) {
        const inj = injuredPlayers(state, id);
        leagueWide[id] = {
            team: FRANCHISES[id].abbr,
            count: inj.length,
            severe: inj.filter((p) => p.injury?.severity === 'il_60').length,
        };
    }
    const leagueRows = Object.entries(leagueWide).filter(([, v]) => v.count > 0).sort((a, b) => b[1].count - a[1].count);
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Injured List" }), _jsxs("div", { style: S.sectionSub, children: [f.city, " ", f.name, " \u00B7 ", own.length, " on the IL"] })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Your Injured Players" }), own.length === 0 && _jsx("div", { style: S.byline, children: "No injuries to report. The training staff is doing its job." }), own.length > 0 && (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Diagnosis" }), _jsx("th", { style: S.th, children: "Severity" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Recovers Day" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Days Out" })] }) }), _jsx("tbody", { children: own.map((p) => (_jsxs("tr", { children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.age }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: S.td, children: p.injury?.type || '—' }), _jsx("td", { style: S.td, children: _jsx("span", { style: {
                                                    ...S.badge,
                                                    ...(p.injury?.severity === 'il_60' ? S.badgeRed
                                                        : p.injury?.severity === 'il_15' ? { background: COLORS.gold, color: COLORS.paper, borderColor: COLORS.gold }
                                                            : { background: COLORS.cream, color: COLORS.ink }),
                                                }, children: (p.injury?.severity || '—').toUpperCase() }) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.injury?.recoversOn ?? '—' }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.injury ? Math.max(0, p.injury.recoversOn - state.day) : 0 })] }, p.id))) })] }))] }), _jsxs("div", { style: { marginTop: 16, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "League Injuries" }), leagueRows.length === 0 && _jsx("div", { style: S.byline, children: "No injuries reported across the league." }), leagueRows.length > 0 && (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Team" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Total IL" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "60-Day" })] }) }), _jsx("tbody", { children: leagueRows.map(([fid, v]) => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: v.team }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: v.count }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: v.severe > 0 ? COLORS.red : COLORS.inkDim }, children: v.severe })] }, fid))) })] }))] })] }));
}
