import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
const HITTER_CATS = [
    { key: 'WAR', label: 'WAR' },
    { key: 'OPSplus', label: 'OPS+' },
    { key: 'OPS', label: 'OPS' },
    { key: 'wOBA', label: 'wOBA' },
    { key: 'AVG', label: 'AVG' },
    { key: 'OBP', label: 'OBP' },
    { key: 'SLG', label: 'SLG' },
    { key: 'HR', label: 'HR' },
    { key: 'RBI', label: 'RBI' },
    { key: 'SB', label: 'SB' },
];
const PITCHER_CATS = [
    { key: 'WAR', label: 'WAR' },
    { key: 'ERA', label: 'ERA', lower: true },
    { key: 'ERAplus', label: 'ERA+' },
    { key: 'FIP', label: 'FIP', lower: true },
    { key: 'WHIP', label: 'WHIP', lower: true },
    { key: 'SO', label: 'SO' },
    { key: 'W', label: 'W' },
    { key: 'SV', label: 'SV' },
    { key: 'IP', label: 'IP' },
    { key: 'K9', label: 'K/9' },
];
export function Leaderboards() {
    const { state, setSelectedPlayerId } = useGame();
    const [tab, setTab] = useState('hit');
    const [season, setSeason] = useState(0);
    if (!state)
        return null;
    const seasonsAvailable = useMemo(() => {
        const set = new Set();
        for (const p of Object.values(state.players)) {
            for (const ss of p.statsHistory || [])
                set.add(ss.season);
        }
        return Array.from(set).sort((a, b) => b - a);
    }, [state.players]);
    const targetSeason = season || (seasonsAvailable[0] || state.season);
    function leaderboardForHitter(cat) {
        if (!state)
            return [];
        const rows = [];
        for (const p of Object.values(state.players)) {
            if (p.isPitcher || p.retired)
                continue;
            const ss = p.statsHistory?.find((s) => s.season === targetSeason);
            if (!ss?.hitter)
                continue;
            if (ss.hitter.AB < 100 && ['AVG', 'OBP', 'SLG', 'OPS', 'OPSplus', 'wOBA'].includes(cat))
                continue;
            const v = ss.hitter[cat];
            if (v === undefined || v === null)
                continue;
            rows.push({ player: p, value: v });
        }
        return rows.sort((a, b) => b.value - a.value).slice(0, 10);
    }
    function leaderboardForPitcher(cat) {
        if (!state)
            return [];
        const lower = PITCHER_CATS.find((c) => c.key === cat)?.lower;
        const rows = [];
        for (const p of Object.values(state.players)) {
            if (!p.isPitcher || p.retired)
                continue;
            const ss = p.statsHistory?.find((s) => s.season === targetSeason);
            if (!ss?.pitcher)
                continue;
            if (ss.pitcher.IP < 30 && ['ERA', 'ERAplus', 'FIP', 'WHIP', 'K9'].includes(cat))
                continue;
            const v = ss.pitcher[cat];
            if (v === undefined || v === null)
                continue;
            rows.push({ player: p, value: v });
        }
        return rows.sort((a, b) => lower ? a.value - b.value : b.value - a.value).slice(0, 10);
    }
    const cats = tab === 'hit' ? HITTER_CATS : PITCHER_CATS;
    const fmtVal = (v, key) => {
        if (['AVG', 'OBP', 'SLG', 'OPS', 'wOBA'].includes(key))
            return v.toFixed(3);
        if (['ERA', 'FIP', 'WHIP', 'K9', 'WAR'].includes(key))
            return v.toFixed(2);
        return Math.round(v).toString();
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "League Leaderboards" }), _jsxs("div", { style: S.sectionSub, children: ["Top 10 by category for season ", targetSeason] })] }), _jsx("div", { style: { ...S.panel, marginBottom: 16 }, children: _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("button", { style: S.radioBtn(tab === 'hit'), onClick: () => setTab('hit'), children: "Hitting" }), _jsx("button", { style: S.radioBtn(tab === 'pitch'), onClick: () => setTab('pitch'), children: "Pitching" }), _jsx("span", { style: S.eyebrow, children: "Season:" }), _jsx("select", { value: targetSeason, onChange: (e) => setSeason(Number(e.target.value)), style: { padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: seasonsAvailable.map((s) => _jsx("option", { value: s, children: s }, s)) })] }) }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }, children: cats.map((cat) => {
                    const rows = tab === 'hit'
                        ? leaderboardForHitter(cat.key)
                        : leaderboardForPitcher(cat.key);
                    return (_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: cat.label }), rows.length === 0 ? (_jsx("div", { style: { ...S.byline, marginTop: 8 }, children: "No qualifiers." })) : (_jsx("table", { style: { width: '100%', fontSize: 12, marginTop: 8 }, children: _jsx("tbody", { children: rows.map((r, i) => (_jsxs("tr", { style: { cursor: 'pointer', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, onClick: () => setSelectedPlayerId(r.player.id), children: [_jsx("td", { style: { padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 22 }, children: i + 1 }), _jsxs("td", { style: { padding: '4px 6px', fontFamily: "'IBM Plex Serif', serif" }, children: [r.player.firstName, " ", r.player.lastName] }), _jsx("td", { style: { padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }, children: r.player.franchiseId ? FRANCHISES[r.player.franchiseId]?.abbr : '—' }), _jsx("td", { style: { padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, textAlign: 'right' }, children: fmtVal(r.value, cat.key) })] }, r.player.id))) }) }))] }, cat.key));
                }) })] }));
}
