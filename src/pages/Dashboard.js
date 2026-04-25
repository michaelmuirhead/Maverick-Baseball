import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { Stat, grid } from '../components/Stat';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel } from '../engine/format';
import { teamStrength } from '../engine/sim';
import { tradeWindowLabel } from '../engine/trades';
import { ProspectDevSummary } from '../components/ProspectDevSummary';
import { GMJobOffers } from '../components/GMJobOffers';
export function Dashboard() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const standing = state.standings[fid];
    const fin = state.finances[fid];
    const games = standing.wins + standing.losses;
    const winPct = games > 0 ? (standing.wins / games).toFixed(3) : '.000';
    const strength = Math.round(teamStrength(state, fid));
    const payroll = state.rosters[fid].reduce((s, pid) => s + (state.players[pid].contract?.salary || 0), 0);
    const recent = state.schedule
        .filter((g) => g.played && (g.home === fid || g.away === fid))
        .slice(-5)
        .reverse();
    const upcoming = state.schedule
        .filter((g) => !g.played && (g.home === fid || g.away === fid))
        .slice(0, 5);
    const headlines = state.news.slice(0, 5);
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [f.city, " ", f.name] }), _jsxs("div", { style: S.sectionSub, children: [phaseLabel(state.phase, state), " \u00B7 ", tradeWindowLabel(state)] })] }), _jsx(GMJobOffers, {}), _jsx(VacancyBanner, {}), _jsx("div", { style: { marginBottom: 16 }, children: _jsx(ProspectDevSummary, {}) }), _jsx(ObjectivesWidget, {}), _jsxs("div", { style: { ...grid('repeat(4, 1fr)'), marginBottom: 20 }, children: [_jsx(Stat, { label: "Record", value: `${standing.wins}–${standing.losses}`, delta: winPct }), _jsx(Stat, { label: "Team Strength", value: strength, delta: `OVR (top 8 hitters + 5 SP + 4 RP)` }), _jsx(Stat, { label: "Payroll", value: fmtShort(payroll), delta: `${state.rosters[fid].length} players` }), _jsx(Stat, { label: "Cash on Hand", value: fmtShort(fin.teamCash), delta: `Owner: ${fmtShort(fin.ownerCash)}`, warn: fin.teamCash < 0 })] }), _jsxs("div", { style: { ...grid('1fr 1fr'), marginBottom: 20 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Recent Games" }), recent.length === 0 && _jsx("div", { style: S.byline, children: "No games played yet." }), recent.map((g) => {
                                const home = g.home === fid;
                                const oppFid = home ? g.away : g.home;
                                const opp = FRANCHISES[oppFid];
                                const us = home ? g.result.homeScore : g.result.awayScore;
                                const them = home ? g.result.awayScore : g.result.homeScore;
                                const win = us > them;
                                return (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsxs("span", { children: [home ? 'vs' : '@', " ", opp.abbr] }), _jsxs("span", { style: { fontWeight: 600, color: win ? COLORS.green : COLORS.red }, children: [win ? 'W' : 'L', " ", us, "\u2013", them] })] }, g.id));
                            })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Upcoming" }), upcoming.length === 0 && _jsx("div", { style: S.byline, children: "No games on the schedule." }), upcoming.map((g) => {
                                const home = g.home === fid;
                                const oppFid = home ? g.away : g.home;
                                const opp = FRANCHISES[oppFid];
                                return (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsxs("span", { children: [home ? 'vs' : '@', " ", opp.abbr] }), _jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }, children: ["Day ", g.day] })] }, g.id));
                            })] })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Latest from Around the League" }), headlines.map((n) => (_jsxs("div", { style: { padding: '8px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 16 }, children: n.headline }), _jsx("div", { style: { ...S.byline, fontSize: 13 }, children: n.body })] }, n.id)))] })] }));
}
function VacancyBanner() {
    const { state, setPage } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const staff = state.staffByFid?.[fid];
    if (!staff)
        return null;
    const vacant = [];
    if (!staff.manager)
        vacant.push('manager');
    if (!staff.pitching_coach)
        vacant.push('pitching coach');
    if (!staff.hitting_coach)
        vacant.push('hitting coach');
    if (vacant.length === 0)
        return null;
    return (_jsxs("div", { style: {
            background: '#9b2c2c', color: '#f3ecdc', padding: '10px 16px',
            marginBottom: 14, border: '2px solid #1a1814',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.12em',
        }, children: [_jsxs("span", { children: ["VACANT: ", vacant.join(', ').toUpperCase(), " \u2014 your team plays at a tactical penalty until filled"] }), _jsx("button", { onClick: () => setPage('staff'), style: {
                    background: '#f3ecdc', color: '#9b2c2c', border: '1px solid #f3ecdc',
                    padding: '6px 14px', cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                }, children: "Hire Now" })] }));
}
function ObjectivesWidget() {
    const { state } = useGame();
    if (!state)
        return null;
    const obj = state.ownerObjectives;
    if (!obj)
        return null;
    const security = state.jobSecurity ?? 50;
    const securityColor = security >= 60 ? COLORS.green : security >= 25 ? COLORS.gold : COLORS.red;
    return (_jsxs("div", { style: { ...S.panelThick, marginBottom: 14 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: S.panelTitle, children: ["Owner Objectives \u00B7 Season ", obj.season] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.inkDim }, children: state.playMode === 'gm' ? 'Job Security' : 'Owner Satisfaction' }), _jsx("div", { style: { width: 140, height: 10, background: 'rgba(26,24,20,0.1)', position: 'relative' }, children: _jsx("div", { style: { width: `${Math.max(0, Math.min(100, security))}%`, height: 10, background: securityColor } }) }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: securityColor, fontWeight: 600, width: 40, textAlign: 'right' }, children: security })] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }, children: obj.objectives.map((o) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderLeft: `3px solid ${o.achieved === undefined ? '#5f5a4d' : o.achieved ? '#2e4c38' : '#9b2c2c'}`, background: '#fbf7ec' }, children: [_jsx("span", { style: { fontFamily: "'IBM Plex Serif', serif", fontSize: 13 }, children: o.label }), o.achieved !== undefined && (_jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: o.achieved ? COLORS.green : COLORS.red, fontWeight: 600 }, children: [o.actual !== undefined ? `${o.actual}/${o.target}` : `target ${o.target}`, " ", o.achieved ? '✓' : '✗'] }))] }, o.id))) })] }));
}
