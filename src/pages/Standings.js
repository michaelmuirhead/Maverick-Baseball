import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { pythagoreanWins, magicNumber, playoffOdds } from '../engine/playoffOdds';
export function Standings() {
    const { state } = useGame();
    if (!state)
        return null;
    const groups = {};
    for (const fid of Object.keys(FRANCHISES)) {
        const f = FRANCHISES[fid];
        const k = `${f.lg} ${f.div}`;
        groups[k] = groups[k] || [];
        groups[k].push(fid);
    }
    for (const k of Object.keys(groups)) {
        groups[k].sort((a, b) => state.standings[b].wins - state.standings[a].wins);
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Standings" }), _jsxs("div", { style: S.sectionSub, children: [state.season, " season - day ", state.day] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }, children: Object.entries(groups).map(([div, fids]) => {
                    const leaderWins = state.standings[fids[0]].wins;
                    return (_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: div }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Team" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "W" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "L" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "PCT" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "GB" }), _jsx("th", { style: { ...S.th, ...S.thNum }, title: "Pythagorean expected wins", children: "Pyth" }), _jsx("th", { style: { ...S.th, ...S.thNum }, title: "Magic number to clinch division", children: "M#" }), _jsx("th", { style: { ...S.th, ...S.thNum }, title: "Playoff odds", children: "PO%" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "RD" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "L10" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Strk" })] }) }), _jsx("tbody", { children: fids.map((fid) => {
                                            const s = state.standings[fid];
                                            const f = FRANCHISES[fid];
                                            const games = s.wins + s.losses;
                                            const pct = games > 0 ? (s.wins / games).toFixed(3).replace(/^0/, '') : '.000';
                                            const gb = leaderWins - s.wins;
                                            const wins10 = s.l10.filter((x) => x === 'W').length;
                                            const isUser = fid === state.userFranchiseId;
                                            const pyth = pythagoreanWins(s.rf, s.ra, games);
                                            const m = magicNumber(state, fid);
                                            const odds = playoffOdds(state, fid);
                                            return (_jsxs("tr", { style: { background: isUser ? '#f8f2e4' : 'transparent' }, children: [_jsxs("td", { style: { ...S.td, fontWeight: isUser ? 600 : 400 }, children: [_jsx("span", { style: { display: 'inline-block', width: 8, height: 8, background: f.color, marginRight: 6, verticalAlign: 'middle' } }), f.abbr, " ", f.name] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: s.wins }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: s.losses }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: pct }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: gb === 0 ? '-' : gb }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: COLORS.inkDim }, children: pyth }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: m === 0 ? COLORS.green : COLORS.inkDim, fontWeight: m === 0 ? 700 : 400 }, children: m === null ? '-' : m === 0 ? 'CLNCHD' : m }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: odds >= 70 ? COLORS.green : odds >= 30 ? COLORS.gold : COLORS.red }, children: odds }), _jsxs("td", { style: { ...S.td, ...S.tdNum, color: s.rf - s.ra >= 0 ? COLORS.green : COLORS.red }, children: [s.rf - s.ra >= 0 ? '+' : '', s.rf - s.ra] }), _jsxs("td", { style: { ...S.td, ...S.tdNum }, children: [wins10, "-", s.l10.length - wins10] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: s.streak === 0 ? '-' : `${s.streak > 0 ? 'W' : 'L'}${Math.abs(s.streak)}` })] }, fid));
                                        }) })] })] }, div));
                }) })] }));
}
