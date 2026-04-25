import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
export function Schedule() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const games = state.schedule.filter((g) => g.home === fid || g.away === fid);
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Schedule" }), _jsxs("div", { style: S.sectionSub, children: [games.length, " games \u00B7 ", games.filter((g) => g.played).length, " played"] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }, children: games.map((g) => {
                    const home = g.home === fid;
                    const oppFid = home ? g.away : g.home;
                    const opp = FRANCHISES[oppFid];
                    let status = `Day ${g.day}`;
                    let bg = COLORS.panel;
                    if (g.played && g.result) {
                        const us = home ? g.result.homeScore : g.result.awayScore;
                        const them = home ? g.result.awayScore : g.result.homeScore;
                        const win = us > them;
                        status = `${win ? 'W' : 'L'} ${us}–${them}`;
                        bg = win ? '#dde7e0' : '#ecd9d9';
                    }
                    return (_jsxs("div", { style: { ...S.panel, padding: 8, fontSize: 12, background: bg }, children: [_jsxs("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }, children: [home ? 'vs' : '@', " ", opp.abbr] }), _jsx("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, marginTop: 2, fontWeight: 600 }, children: status })] }, g.id));
                }) })] }));
}
