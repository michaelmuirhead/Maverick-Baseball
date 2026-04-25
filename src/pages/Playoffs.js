import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
export function Playoffs() {
    const { state } = useGame();
    if (!state)
        return null;
    if (!state.bracket) {
        return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Playoffs" }), _jsx("div", { style: S.sectionSub, children: "The bracket sets at season's end." })] }), _jsx("div", { style: S.panel, children: _jsx("p", { style: S.byline, children: "No active bracket. Sim to the end of the regular season to seed the postseason field." }) })] }));
    }
    const b = state.bracket;
    const grouping = [
        { lg: 'AL', wcs: ['wc_AL_1', 'wc_AL_2'], dss: ['ds_AL_1', 'ds_AL_2'], lcs: 'lcs_AL' },
        { lg: 'NL', wcs: ['wc_NL_1', 'wc_NL_2'], dss: ['ds_NL_1', 'ds_NL_2'], lcs: 'lcs_NL' },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: ["Postseason ", state.season] }), _jsx("div", { style: S.sectionSub, children: b.champion
                            ? `Champion: ${FRANCHISES[b.champion].city} ${FRANCHISES[b.champion].name}`
                            : `Round: ${b.currentRound.replace('_', ' ').toUpperCase()}` })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: grouping.map(({ lg, wcs, dss, lcs }) => (_jsxs("div", { style: S.panel, children: [_jsxs("div", { style: S.panelTitle, children: [lg, " Bracket"] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }, children: [_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Wild Card" }), wcs.map((id) => _jsx(SeriesCard, { series: b.series[id], userFid: state.userFranchiseId }, id))] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "DS" }), dss.map((id) => _jsx(SeriesCard, { series: b.series[id], userFid: state.userFranchiseId }, id))] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "LCS" }), _jsx(SeriesCard, { series: b.series[lcs], userFid: state.userFranchiseId })] })] })] }, lg))) }), _jsxs("div", { style: { marginTop: 16, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "World Series" }), _jsx(SeriesCard, { series: b.series.ws, userFid: state.userFranchiseId })] })] }));
}
function SeriesCard({ series, userFid }) {
    if (!series)
        return null;
    if (!series.higherSeed) {
        return (_jsx("div", { style: { ...S.panel, padding: 8, marginTop: 6, opacity: 0.5 }, children: _jsx("div", { style: S.byline, children: "TBD" }) }));
    }
    const higher = series.higherSeed;
    const lower = series.lowerSeed;
    const homeStr = (id) => {
        const f = FRANCHISES[id];
        const isUser = id === userFid;
        return (_jsxs("span", { style: { fontWeight: isUser ? 700 : 400 }, children: [_jsx("span", { style: { display: 'inline-block', width: 6, height: 6, background: f.color, marginRight: 4 } }), "(", (higher.id === id || lower?.id === id) ? (higher.id === id ? higher.seed : lower?.seed) : '', ") ", f.abbr] }));
    };
    const completed = series.status === 'complete';
    const winner = series.winner;
    return (_jsxs("div", { style: { ...S.panel, padding: 8, marginTop: 6, fontSize: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [homeStr(higher.id), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: completed && winner === higher.id ? COLORS.green : COLORS.inkDim }, children: series.higherWins })] }), lower && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }, children: [homeStr(lower.id), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: completed && winner === lower.id ? COLORS.green : COLORS.inkDim }, children: series.lowerWins })] })), _jsx("div", { style: { ...S.eyebrow, fontSize: 9, marginTop: 4 }, children: series.status === 'pending' ? 'Awaiting' : completed ? 'Final' : `Best of ${series.gamesNeeded * 2 - 1}` })] }));
}
