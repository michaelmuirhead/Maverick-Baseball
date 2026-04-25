import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { toScout } from '../engine/format';
import { hofScore } from '../engine/awards';
const AWARD_LABEL = {
    mvp: 'MVP',
    cy_young: 'Cy Young',
    rookie: 'Rookie of the Year',
    gold_glove: 'Gold Glove',
    silver_slugger: 'Silver Slugger',
    mgr_of_year: 'Manager of the Year',
};
export function Awards() {
    const { state } = useGame();
    const [tab, setTab] = useState('season');
    if (!state)
        return null;
    const seasons = Object.keys(state.awardsBySeason || {})
        .map(Number)
        .sort((a, b) => b - a);
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Awards & Honors" }), _jsxs("div", { style: S.sectionSub, children: [seasons.length, " seasons recorded \u00B7 ", Object.values(state.players).filter((p) => p.hallOfFame).length, " Hall of Famers"] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 16 }, children: [_jsx("button", { style: S.radioBtn(tab === 'season'), onClick: () => setTab('season'), children: "Season Awards" }), _jsx("button", { style: S.radioBtn(tab === 'hof'), onClick: () => setTab('hof'), children: "Hall of Fame" })] }), tab === 'season' && _jsx(SeasonAwards, {}), tab === 'hof' && _jsx(HallOfFame, {})] }));
}
function SeasonAwards() {
    const { state } = useGame();
    if (!state || !state.awardsBySeason)
        return null;
    const seasons = Object.keys(state.awardsBySeason).map(Number).sort((a, b) => b - a);
    if (seasons.length === 0) {
        return _jsx("div", { style: S.panel, children: _jsx("div", { style: S.byline, children: "No awards yet \u2014 sim a season to crown winners." }) });
    }
    return (_jsx("div", { children: seasons.map((yr) => {
            const list = state.awardsBySeason[yr] || [];
            const byType = {};
            for (const a of list) {
                const k = a.type;
                byType[k] = byType[k] || [];
                byType[k].push(a);
            }
            return (_jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsxs("div", { style: S.panelTitle, children: ["Season ", yr] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }, children: ['mvp', 'cy_young', 'rookie'].map((t) => (_jsxs("div", { style: { ...S.stat }, children: [_jsx("div", { style: S.statLabel, children: AWARD_LABEL[t] }), (byType[t] || []).map((a) => {
                                    const p = state.players[a.playerId];
                                    if (!p)
                                        return null;
                                    return (_jsxs("div", { style: { marginTop: 4 }, children: [_jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim, marginRight: 6 }, children: a.league }), _jsxs("span", { style: { fontFamily: "'IBM Plex Serif', serif", fontWeight: 500 }, children: [p.firstName, " ", p.lastName] }), _jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, marginLeft: 6 }, children: ["OVR ", toScout(p.ratings.overall)] })] }, a.league));
                                }), !byType[t] && _jsx("div", { style: S.byline, children: "\u2014" })] }, t))) }), byType.gold_glove && byType.gold_glove.length > 0 && (_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Gold Gloves" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 6 }, children: byType.gold_glove.map((a) => {
                                    const p = state.players[a.playerId];
                                    if (!p)
                                        return null;
                                    return (_jsxs("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }, children: [a.league, " \u00B7 ", p.pos, " \u00B7 ", p.firstName, " ", p.lastName] }, a.league + p.id));
                                }) })] }))] }, yr));
        }) }));
}
function HallOfFame() {
    const { state } = useGame();
    if (!state)
        return null;
    const inductees = Object.values(state.players)
        .filter((p) => p.hallOfFame)
        .sort((a, b) => (b.hallOfFame?.inducted ?? 0) - (a.hallOfFame?.inducted ?? 0));
    if (inductees.length === 0) {
        return (_jsx("div", { style: S.panel, children: _jsx("div", { style: S.byline, children: "The Hall is empty. Inductions begin 5 seasons after a great career retires." }) }));
    }
    return (_jsxs("div", { style: S.panel, children: [_jsxs("div", { style: S.panelTitle, children: ["Hall of Fame \u00B7 ", inductees.length, " inductees"] }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Year" }), _jsx("th", { style: S.th, children: "Player" }), _jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Career-High OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "MVP" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Cy Young" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Gold Gloves" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "HoF Score" })] }) }), _jsx("tbody", { children: inductees.map((p) => {
                            const mvps = (p.awards || []).filter((a) => a.type === 'mvp').length;
                            const cys = (p.awards || []).filter((a) => a.type === 'cy_young').length;
                            const ggs = (p.awards || []).filter((a) => a.type === 'gold_glove').length;
                            return (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: p.hallOfFame?.inducted }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.careerHigh ?? p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: mvps }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: cys }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: ggs }), _jsx("td", { style: { ...S.td, ...S.tdNum, fontWeight: 600 }, children: Math.round(hofScore(p)) })] }, p.id));
                        }) })] })] }));
}
