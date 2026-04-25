import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
const CATEGORY_COLOR = {
    team: COLORS.ink,
    league: COLORS.gold,
    trade: COLORS.green,
    draft: '#1f3627',
    fa: COLORS.gold,
    injury: COLORS.red,
    milestone: COLORS.gold,
};
export function News() {
    const { state } = useGame();
    const [scope, setScope] = useState('world');
    const [season, setSeason] = useState('all');
    const [category, setCategory] = useState('all');
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const userTeam = FRANCHISES[fid];
    const teamAbbr = userTeam.abbr;
    const teamCity = userTeam.city;
    const teamName = userTeam.name;
    function involvesUser(n) {
        if (n.involves?.includes(fid))
            return true;
        const text = `${n.headline} ${n.body}`;
        return text.includes(teamAbbr) || text.includes(teamCity) || text.includes(teamName);
    }
    const filtered = useMemo(() => {
        return state.news.filter((n) => {
            if (scope === 'team' && !involvesUser(n))
                return false;
            if (scope === 'league' && n.category === 'team' && !involvesUser(n))
                return false;
            if (season !== 'all' && n.season !== season)
                return false;
            if (category !== 'all' && n.category !== category)
                return false;
            return true;
        });
    }, [state.news, scope, season, category, fid]);
    const seasons = Array.from(new Set(state.news.map((n) => n.season))).sort((a, b) => b - a);
    const scopeLabels = {
        world: 'World',
        league: 'League-wide',
        team: 'Your team',
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "The Wire" }), _jsxs("div", { style: S.sectionSub, children: [filtered.length, " of ", state.news.length, " entries"] })] }), _jsxs("div", { style: { ...S.panel, marginBottom: 12 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }, children: [_jsx("span", { style: S.eyebrow, children: "Scope:" }), ['world', 'league', 'team'].map((s) => (_jsx("button", { onClick: () => setScope(s), style: {
                                    ...S.radioBtn(scope === s),
                                    fontSize: 11,
                                    background: scope === s ? COLORS.ink : 'transparent',
                                    color: scope === s ? COLORS.cream : COLORS.ink,
                                }, children: scopeLabels[s] }, s)))] }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("span", { style: S.eyebrow, children: "Season:" }), _jsxs("select", { value: season === 'all' ? 'all' : String(season), onChange: (e) => setSeason(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)), style: { padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: [_jsx("option", { value: "all", children: "All seasons" }), seasons.map((y) => _jsx("option", { value: y, children: y }, y))] }), _jsx("span", { style: S.eyebrow, children: "Category:" }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), style: { padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "team", children: "Team" }), _jsx("option", { value: "league", children: "League" }), _jsx("option", { value: "trade", children: "Trade" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "fa", children: "Free Agent" }), _jsx("option", { value: "injury", children: "Injury" }), _jsx("option", { value: "milestone", children: "Milestone" })] })] })] }), _jsx("div", { style: S.panel, children: filtered.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', padding: 12 }, children: "No news matches the selected filters." })) : (filtered.map((n) => (_jsxs("div", { style: { padding: '10px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { ...S.badge, background: CATEGORY_COLOR[n.category] || COLORS.ink, color: COLORS.paper, borderColor: 'transparent' }, children: n.category }), _jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }, children: ["Season ", n.season, " - Day ", n.day] })] }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 18, marginTop: 4 }, children: n.headline }), _jsx("div", { style: { ...S.byline, fontSize: 13 }, children: n.body })] }, n.id)))) })] }));
}
