import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { EXPANSION_CITIES, EXPANSION_COLORS } from '../engine/expansion';
export function NewGame() {
    const { setView, newGame } = useGame();
    const [scenario, setScenario] = useState('normal');
    const [playMode, setPlayMode] = useState('owner');
    const [pickedFid, setPickedFid] = useState('nyy');
    const [seed, setSeed] = useState(Math.floor(Math.random() * 1e9));
    const [expansionCity, setExpansionCity] = useState(EXPANSION_CITIES[0].city);
    const [expansionName, setExpansionName] = useState('Mavericks');
    const [expansionLg, setExpansionLg] = useState('AL');
    const [expansionDiv, setExpansionDiv] = useState('West');
    const [expansionColor, setExpansionColor] = useState(0);
    const groupedFranchises = useMemo(() => {
        const groups = {};
        for (const fid of Object.keys(FRANCHISES)) {
            const f = FRANCHISES[fid];
            const k = `${f.lg} ${f.div}`;
            groups[k] = groups[k] || [];
            groups[k].push(fid);
        }
        return groups;
    }, []);
    function start() {
        if (scenario === 'expansion') {
            const cityChoice = EXPANSION_CITIES.find((c) => c.city === expansionCity);
            const colors = EXPANSION_COLORS[expansionColor];
            const config = {
                abbr: expansionName.slice(0, 3).toUpperCase(),
                city: cityChoice.city,
                state: cityChoice.state,
                name: expansionName,
                lg: expansionLg,
                div: expansionDiv,
                color: colors.primary,
                secondaryColor: colors.secondary,
                park: `${expansionCity} Ballpark`,
                cap: 42000,
                premium: 3200,
                pf: 100,
                amen: 4,
                marketTier: cityChoice.market,
                marketLoyalty: cityChoice.loyaltyBase,
                marketCorp: cityChoice.corp,
            };
            newGame(seed, 'exp_user', 'expansion', config, playMode);
        }
        else {
            newGame(seed, pickedFid, scenario, null, playMode);
        }
    }
    return (_jsxs("div", { style: S.shell, children: [_jsx("header", { style: S.masthead, children: _jsxs("div", { style: S.mastheadInner, children: [_jsx("div", { style: S.mastheadMeta, children: "NEW GAME" }), _jsxs("div", { children: [_jsx("div", { style: S.mastheadTitle, children: "Maverick Baseball" }), _jsx("div", { style: S.mastheadSub, children: "Choose Your Club" })] }), _jsxs("div", { style: S.mastheadMeta, children: ["SEED \u00B7 ", seed] })] }) }), _jsxs("main", { style: S.page, children: [_jsx("h2", { style: S.sectionHead, children: "Your Role" }), _jsx("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }, children: ['owner', 'gm'].map((mode) => (_jsx("button", { style: {
                                ...S.radioBtn(playMode === mode),
                                background: playMode === mode ? COLORS.ink : 'transparent',
                                color: playMode === mode ? COLORS.cream : COLORS.ink,
                            }, onClick: () => setPlayMode(mode), children: mode === 'owner' ? 'Owner' : 'General Manager' }, mode))) }), _jsx("div", { style: { ...S.byline, fontSize: 12, marginBottom: 20, maxWidth: 640 }, children: playMode === 'owner'
                            ? "You own the team. You can't be fired — job security still tracks owner satisfaction, but you stay in charge through every season."
                            : "You're hired as GM. Miss enough owner objectives in a row and you can be terminated; other clubs may hire you afterwards." }), _jsx("h2", { style: S.sectionHead, children: "Scenario" }), _jsx("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }, children: ['normal', 'turnaround', 'expansion'].map((s) => (_jsx("button", { style: S.radioBtn(scenario === s), onClick: () => setScenario(s), children: s === 'normal' ? 'Standard' : s === 'turnaround' ? 'Turnaround' : 'Expansion' }, s))) }), scenario !== 'expansion' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: S.sectionHead, children: "Pick a Franchise" }), _jsx("div", { style: S.sectionRule }), Object.entries(groupedFranchises).map(([div, fids]) => (_jsxs("div", { style: { marginBottom: 24 }, children: [_jsx("div", { style: S.eyebrow, children: div }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }, children: fids.map((fid) => {
                                            const f = FRANCHISES[fid];
                                            return (_jsxs("button", { style: S.franchiseCard(pickedFid === fid), onClick: () => setPickedFid(fid), children: [_jsx("div", { style: { height: 6, background: f.color, marginBottom: 8 } }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 16 }, children: f.city }), _jsx("div", { style: { fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic', color: COLORS.inkDim, fontSize: 13 }, children: f.name })] }, fid));
                                        }) })] }, div)))] })), scenario === 'expansion' && (_jsxs(_Fragment, { children: [_jsx("h2", { style: S.sectionHead, children: "Build an Expansion Franchise" }), _jsx("div", { style: S.sectionRule }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Identity" }), _jsx("label", { style: { ...S.eyebrow, display: 'block', marginTop: 8 }, children: "Team Name" }), _jsx("input", { type: "text", value: expansionName, onChange: (e) => setExpansionName(e.target.value), style: { width: '100%', padding: 8, fontFamily: 'inherit', fontSize: 16, border: `1px solid ${COLORS.ink}`, background: COLORS.panel } }), _jsx("label", { style: { ...S.eyebrow, display: 'block', marginTop: 12 }, children: "Home City" }), _jsx("select", { value: expansionCity, onChange: (e) => setExpansionCity(e.target.value), style: { width: '100%', padding: 8, fontFamily: 'inherit', fontSize: 14, border: `1px solid ${COLORS.ink}`, background: COLORS.panel }, children: EXPANSION_CITIES.map((c) => (_jsxs("option", { value: c.city, children: [c.city, ", ", c.state] }, c.city))) }), _jsx("label", { style: { ...S.eyebrow, display: 'block', marginTop: 12 }, children: "Color Palette" }), _jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap' }, children: EXPANSION_COLORS.map((c, i) => (_jsx("button", { style: {
                                                        width: 36, height: 36, cursor: 'pointer',
                                                        background: c.primary, border: i === expansionColor ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.ink}`,
                                                    }, onClick: () => setExpansionColor(i) }, i))) })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "League Placement" }), _jsx("label", { style: { ...S.eyebrow, display: 'block' }, children: "League" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { style: S.radioBtn(expansionLg === 'AL'), onClick: () => setExpansionLg('AL'), children: "AL" }), _jsx("button", { style: S.radioBtn(expansionLg === 'NL'), onClick: () => setExpansionLg('NL'), children: "NL" })] }), _jsx("label", { style: { ...S.eyebrow, display: 'block', marginTop: 12 }, children: "Division" }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: ['East', 'Central', 'West'].map((d) => (_jsx("button", { style: S.radioBtn(expansionDiv === d), onClick: () => setExpansionDiv(d), children: d }, d))) }), _jsx("p", { style: { ...S.byline, marginTop: 16, fontSize: 13 }, children: "A second expansion club fills the open slot in your division, balancing the league at 32 teams." })] })] })] })), _jsxs("div", { style: { display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }, children: [_jsx("button", { onClick: start, style: { ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red, padding: '10px 24px' }, children: "Start Season" }), _jsx("button", { onClick: () => setView('splash'), style: S.radioBtn(false), children: "Back" }), _jsxs("span", { style: { ...S.byline, marginLeft: 'auto', fontSize: 11 }, children: ["Seed: ", seed] })] })] })] }));
}
