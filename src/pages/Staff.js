import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, ratingClass, toScout } from '../engine/format';
import { coachDevelopmentLog, projectedBump, developableYoungPlayers, topDevelopingCoaches, computeTacticalContribution } from '../engine/coaches';
const ROLE_LABEL = {
    manager: 'Manager',
    pitching_coach: 'Pitching Coach',
    hitting_coach: 'Hitting Coach',
};
export function Staff() {
    const { state, hireCoach, fireCoachAction, toggleDelegateStaffHiring } = useGame();
    const [hireRole, setHireRole] = useState('manager');
    const [years, setYears] = useState(2);
    const [selectedHire, setSelectedHire] = useState(null);
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const myStaff = state.staffByFid?.[fid];
    const coaches = state.coaches || {};
    const pool = (state.coachPool || []).map((id) => coaches[id]).filter(Boolean);
    const filtered = pool
        .filter((c) => c.role === hireRole)
        .sort((a, b) => b.ratings.overall - a.ratings.overall);
    const myStaffOpenSlot = myStaff && !myStaff[hireRole];
    function fireHandler(coachId) {
        const c = coaches[coachId];
        const yearsLeft = c?.contract?.years || 0;
        const salary = c?.contract?.salary || 0;
        const projectedBuyout = Math.round(yearsLeft * salary * 0.5);
        if (!confirm(`Fire ${c?.firstName} ${c?.lastName}? Estimated buyout: ${fmtShort(projectedBuyout)}.`))
            return;
        const r = fireCoachAction(coachId);
        if (r.ok)
            alert(`Fired. Buyout paid: ${fmtShort(r.buyout)}.`);
        else
            alert(r.reason || 'Could not fire.');
    }
    function hireHandler(coachId) {
        const c = coaches[coachId];
        if (!c)
            return;
        if (myStaff && myStaff[c.role]) {
            if (!confirm(`The ${ROLE_LABEL[c.role]} slot is filled. Fire the current ${ROLE_LABEL[c.role]} first.`))
                return;
            return;
        }
        hireCoach(coachId, years);
        setSelectedHire(null);
    }
    return (_jsxs("div", { children: [_jsx("div", { style: S.sectionRule, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, children: [_jsxs("div", { children: [_jsx("h2", { style: S.sectionHead, children: "Coaching Staff" }), _jsxs("div", { style: S.sectionSub, children: [f.city, " ", f.name, " \u00B7 ", (state.coachPool || []).length, " coaches on the market"] })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.inkDim }, children: [_jsx("input", { type: "checkbox", checked: !!state.delegateStaffHiring, onChange: () => toggleDelegateStaffHiring(), style: { accentColor: COLORS.green } }), "Delegate Staff Hiring"] })] }) }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }, children: ['manager', 'pitching_coach', 'hitting_coach'].map((role) => {
                    const cid = myStaff?.[role];
                    const c = cid ? coaches[cid] : null;
                    return (_jsxs("div", { style: S.panelThick, children: [_jsx("div", { style: S.panelTitle, children: ROLE_LABEL[role] }), !c && (_jsx("div", { style: { ...S.byline, marginBottom: 8 }, children: "Vacant. Hire from the market below." })), c && _jsx(CoachCard, { coach: c, onFire: () => fireHandler(c.id) })] }, role));
                }) }), _jsx(TacticalImpactPanel, {}), _jsxs("div", { style: { marginTop: 24, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "Hiring Market" }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }, children: [_jsx("span", { style: S.eyebrow, children: "Filter by role" }), ['manager', 'pitching_coach', 'hitting_coach'].map((r) => (_jsx("button", { style: S.radioBtn(hireRole === r), onClick: () => { setHireRole(r); setSelectedHire(null); }, children: ROLE_LABEL[r] }, r))), _jsx("div", { style: { flex: 1 } }), _jsx("span", { style: S.eyebrow, children: "Years" }), _jsx("input", { type: "number", min: 1, max: 5, value: years, onChange: (e) => setYears(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1))), style: { width: 60, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel } }), !myStaffOpenSlot && (_jsxs("span", { style: { ...S.badge, ...S.badgeRed }, children: ["Slot filled \u2014 fire current ", ROLE_LABEL[hireRole], " to hire"] }))] }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Exp" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Tactical" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Develop" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Chem" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Rings" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Est AAV" }), _jsx("th", { style: S.th })] }) }), _jsxs("tbody", { children: [filtered.length === 0 && (_jsx("tr", { children: _jsxs("td", { colSpan: 10, style: { ...S.td, ...S.byline, padding: 16 }, children: ["No ", ROLE_LABEL[hireRole].toLowerCase(), "s available."] }) })), filtered.map((c) => {
                                        const aav = Math.max(700_000, Math.round(c.ratings.overall ** 1.7 * 1500));
                                        return (_jsxs("tr", { style: { background: selectedHire === c.id ? '#f8f2e4' : 'transparent', cursor: 'pointer' }, onClick: () => setSelectedHire(c.id), children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [c.firstName, " ", c.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: c.age }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: c.experience }), _jsx("td", { style: { ...S.td, ...S.tdNum, fontWeight: 600, color: ratingClass(c.ratings.overall) }, children: toScout(c.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(c.ratings.tactical) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(c.ratings.development) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(c.ratings.chemistry) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: c.championships > 0 ? '★'.repeat(Math.min(5, c.championships)) : '—' }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: fmtShort(aav) }), _jsx("td", { style: S.td, children: _jsx("button", { onClick: (e) => { e.stopPropagation(); hireHandler(c.id); }, disabled: !myStaffOpenSlot, style: {
                                                            ...S.radioBtn(true), padding: '4px 10px',
                                                            background: myStaffOpenSlot ? COLORS.green : '#999',
                                                            borderColor: myStaffOpenSlot ? COLORS.green : '#999',
                                                            cursor: myStaffOpenSlot ? 'pointer' : 'not-allowed',
                                                        }, children: "Hire" }) })] }, c.id));
                                    })] })] })] }), _jsx(ScoutingReport, {}), _jsxs("div", { style: { marginTop: 24, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "League Staff Snapshot" }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Team" }), _jsx("th", { style: S.th, children: "Manager" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Pitching Coach" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: S.th, children: "Hitting Coach" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" })] }) }), _jsx("tbody", { children: Object.keys(FRANCHISES).map((fid) => {
                                    const staff = state.staffByFid?.[fid];
                                    const mgr = staff?.manager ? coaches[staff.manager] : null;
                                    const pc = staff?.pitching_coach ? coaches[staff.pitching_coach] : null;
                                    const hc = staff?.hitting_coach ? coaches[staff.hitting_coach] : null;
                                    const isUser = fid === state.userFranchiseId;
                                    return (_jsxs("tr", { style: { background: isUser ? '#f8f2e4' : 'transparent' }, children: [_jsx("td", { style: { ...S.td, fontWeight: isUser ? 600 : 400 }, children: FRANCHISES[fid].abbr }), _jsx("td", { style: S.td, children: mgr ? `${mgr.firstName} ${mgr.lastName}` : _jsx("em", { style: { color: COLORS.red }, children: "vacant" }) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: mgr ? toScout(mgr.ratings.overall) : '—' }), _jsx("td", { style: S.td, children: pc ? `${pc.firstName} ${pc.lastName}` : _jsx("em", { style: { color: COLORS.red }, children: "vacant" }) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: pc ? toScout(pc.ratings.overall) : '—' }), _jsx("td", { style: S.td, children: hc ? `${hc.firstName} ${hc.lastName}` : _jsx("em", { style: { color: COLORS.red }, children: "vacant" }) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: hc ? toScout(hc.ratings.overall) : '—' })] }, fid));
                                }) })] })] })] }));
}
function CoachCard({ coach, onFire }) {
    const yrs = coach.contract?.years || 0;
    const salary = coach.contract?.salary || 0;
    return (_jsxs("div", { children: [_jsxs("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: [coach.firstName, " ", coach.lastName] }), _jsxs("div", { style: S.byline, children: ["Age ", coach.age, " \u00B7 ", coach.experience, " yrs experience", coach.championships > 0 && ` · ${coach.championships} ring${coach.championships > 1 ? 's' : ''}`] }), _jsxs("div", { style: { marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }, children: [_jsx(RatingRow, { label: "Overall", v: coach.ratings.overall }), _jsx(RatingRow, { label: "Tactical", v: coach.ratings.tactical }), _jsx(RatingRow, { label: "Develop", v: coach.ratings.development }), _jsx(RatingRow, { label: "Chemistry", v: coach.ratings.chemistry })] }), _jsxs("div", { style: { marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.inkDim }, children: ["Contract: ", fmtShort(salary), " / yr \u00B7 ", yrs, " yr", yrs !== 1 ? 's' : '', " left"] }), _jsx("button", { onClick: onFire, style: {
                    ...S.radioBtn(true),
                    background: COLORS.red, borderColor: COLORS.red,
                    marginTop: 12, padding: '6px 14px',
                }, children: "Fire" })] }));
}
function RatingRow({ label, v }) {
    return (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '2px 0' }, children: [_jsx("span", { style: { color: COLORS.inkDim, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10 }, children: label }), _jsx("span", { style: { color: ratingClass(v), fontWeight: label === 'Overall' ? 600 : 400 }, children: toScout(v) })] }));
}
function ScoutingReport() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const myStaff = state.staffByFid?.[fid];
    const coaches = state.coaches || {};
    const pcId = myStaff?.pitching_coach;
    const hcId = myStaff?.hitting_coach;
    const pc = pcId ? coaches[pcId] : null;
    const hc = hcId ? coaches[hcId] : null;
    const devYoung = developableYoungPlayers(state, fid);
    const myHistoryPC = pcId ? coachDevelopmentLog(state, pcId) : [];
    const myHistoryHC = hcId ? coachDevelopmentLog(state, hcId) : [];
    const leaderboard = topDevelopingCoaches(state, 8);
    return (_jsxs("div", { style: { marginTop: 24, ...S.panel }, children: [_jsx("div", { style: S.panelTitle, children: "Scouting \u00B7 Development Reports" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Next-Rollover Projection" }), devYoung.length === 0 && (_jsx("div", { style: { ...S.byline, marginTop: 6 }, children: "No players under 25 on the active roster." })), devYoung.length > 0 && (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "POT" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Coach" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Bump" })] }) }), _jsx("tbody", { children: devYoung.sort((a, b) => b.potential - a.potential).map((p) => {
                                            const bump = projectedBump(state, p);
                                            const role = p.isPitcher ? 'pitching_coach' : 'hitting_coach';
                                            const coachId = myStaff?.[role];
                                            const coach = coachId ? coaches[coachId] : null;
                                            return (_jsxs("tr", { children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.age }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.potential) }), _jsx("td", { style: { ...S.td, ...S.tdNum, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }, children: coach ? coach.lastName : '—' }), _jsx("td", { style: { ...S.td, ...S.tdNum, color: bump > 0 ? COLORS.green : COLORS.inkDim, fontWeight: 600 }, children: bump > 0 ? '+' + bump.toFixed(1) : '—' })] }, p.id));
                                        }) })] }))] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Track Records" }), _jsx(CoachTrack, { coach: pc, history: myHistoryPC, state: state, role: "Pitching Coach" }), _jsx("div", { style: { marginTop: 12 } }), _jsx(CoachTrack, { coach: hc, history: myHistoryHC, state: state, role: "Hitting Coach" })] })] }), _jsxs("div", { style: { marginTop: 16 }, children: [_jsx("div", { style: S.eyebrow, children: "Top Developing Coaches (League-wide)" }), leaderboard.length === 0 && (_jsx("div", { style: { ...S.byline, marginTop: 6 }, children: "No development on record yet \u2014 bumps are awarded at season rollover." })), leaderboard.length > 0 && (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Coach" }), _jsx("th", { style: S.th, children: "Role" }), _jsx("th", { style: S.th, children: "Team" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Players Developed" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Total POT Gain" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Total OVR Gain" })] }) }), _jsx("tbody", { children: leaderboard.map((row) => {
                                    const c = coaches[row.coachId];
                                    if (!c)
                                        return null;
                                    const teamFid = c.franchiseId;
                                    return (_jsxs("tr", { style: { background: teamFid === fid ? '#f8f2e4' : 'transparent' }, children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [c.firstName, " ", c.lastName] }), _jsx("td", { style: S.td, children: c.role.replace('_', ' ') }), _jsx("td", { style: S.td, children: teamFid ? FRANCHISES[teamFid]?.abbr : _jsx("em", { style: { color: COLORS.inkDim }, children: "FA" }) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: row.bumps }), _jsxs("td", { style: { ...S.td, ...S.tdNum, color: COLORS.green, fontWeight: 600 }, children: ["+", row.totalPotentialGain] }), _jsxs("td", { style: { ...S.td, ...S.tdNum }, children: ["+", row.totalOverallGain] })] }, row.coachId));
                                }) })] }))] })] }));
}
function CoachTrack({ coach, history, state, role }) {
    if (!coach) {
        return (_jsxs("div", { style: { ...S.panel, padding: 12 }, children: [_jsx("div", { style: S.eyebrow, children: role }), _jsx("div", { style: S.byline, children: "Slot is vacant." })] }));
    }
    const totalGain = history.reduce((s, r) => s + (r.postPotential - r.prePotential), 0);
    return (_jsxs("div", { style: { ...S.panel, padding: 12 }, children: [_jsx("div", { style: S.eyebrow, children: role }), _jsxs("div", { style: { fontFamily: "'IBM Plex Serif', serif", fontWeight: 500, marginTop: 2 }, children: [coach.firstName, " ", coach.lastName, _jsxs("span", { style: { ...S.byline, marginLeft: 6 }, children: ["\u00B7 OVR ", toScout(coach.ratings.overall), " \u00B7 DEV ", toScout(coach.ratings.development)] })] }), _jsxs("div", { style: { ...S.eyebrow, marginTop: 8 }, children: ["Lifetime: ", history.length, " bump(s) \u00B7 +", totalGain, " potential"] }), history.length === 0 && (_jsx("div", { style: { ...S.byline, marginTop: 6 }, children: "No development on record yet." })), history.slice(-5).reverse().map((r, i) => {
                const p = state.players[r.playerId];
                if (!p)
                    return null;
                return (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }, children: [_jsxs("span", { children: [p.firstName, " ", p.lastName] }), _jsxs("span", { style: { color: COLORS.inkDim }, children: ["S", r.season] }), _jsxs("span", { style: { color: COLORS.green, fontWeight: 600 }, children: ["POT ", toScout(r.prePotential), " \u2192 ", toScout(r.postPotential)] })] }, i));
            })] }));
}
function TacticalImpactPanel() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const mine = computeTacticalContribution(state, fid);
    // League average for context
    const allFids = Object.keys(FRANCHISES);
    const allContribs = allFids.map((id) => computeTacticalContribution(state, id));
    const avg = (sel) => allContribs.reduce((s, c) => s + sel(c), 0) / Math.max(1, allContribs.length);
    const leagueBench = avg((c) => c.benchLeverage);
    const leagueBullpen = avg((c) => c.bullpenLeverage);
    const leagueIntangibles = avg((c) => c.intangibles);
    const totalEdge = (mine.benchLeverage - leagueBench) +
        (mine.bullpenLeverage - leagueBullpen) +
        (mine.intangibles - leagueIntangibles);
    function delta(v, ref) {
        const d = v - ref;
        const sign = d >= 0 ? '+' : '';
        return _jsxs("span", { style: { color: d >= 0 ? COLORS.green : COLORS.red, fontWeight: 600 }, children: [sign, d.toFixed(2)] });
    }
    function formatBonus(v) {
        const sign = v >= 0 ? '+' : '';
        return _jsxs("span", { style: { color: v >= 0 ? COLORS.green : COLORS.red, fontWeight: 600 }, children: [sign, v.toFixed(2)] });
    }
    return (_jsxs("div", { style: { marginTop: 24, ...S.panelThick }, children: [_jsx("div", { style: S.panelTitle, children: "Tactical Impact \u00B7 what your manager actually does" }), _jsxs("div", { style: { ...S.byline, marginBottom: 12 }, children: ["Each value below is a contribution to ", _jsx("strong", { children: "team strength (OVR)" }), ". These are baked into every game sim \u2014 you can lose 5\u20138 wins a year to a poor tactical manager."] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }, children: [_jsxs("div", { style: S.stat, children: [_jsx("div", { style: S.statLabel, children: "Bench Leverage" }), _jsxs("div", { style: { ...S.statValue, color: mine.benchLeverage >= leagueBench ? COLORS.green : COLORS.red }, children: [mine.benchLeverage >= 0 ? '+' : '', mine.benchLeverage.toFixed(2)] }), _jsxs("div", { style: S.statDelta, children: ["League avg ", leagueBench.toFixed(2), " \u00B7 vs avg ", delta(mine.benchLeverage, leagueBench)] })] }), _jsxs("div", { style: S.stat, children: [_jsx("div", { style: S.statLabel, children: "Bullpen Leverage" }), _jsxs("div", { style: { ...S.statValue, color: mine.bullpenLeverage >= leagueBullpen ? COLORS.green : COLORS.red }, children: [mine.bullpenLeverage >= 0 ? '+' : '', mine.bullpenLeverage.toFixed(2)] }), _jsxs("div", { style: S.statDelta, children: ["League avg ", leagueBullpen.toFixed(2), " \u00B7 vs avg ", delta(mine.bullpenLeverage, leagueBullpen)] })] }), _jsxs("div", { style: S.stat, children: [_jsx("div", { style: S.statLabel, children: "Intangibles" }), _jsxs("div", { style: { ...S.statValue, color: mine.intangibles >= leagueIntangibles ? COLORS.green : COLORS.red }, children: [mine.intangibles >= 0 ? '+' : '', mine.intangibles.toFixed(2)] }), _jsxs("div", { style: S.statDelta, children: ["League avg ", leagueIntangibles.toFixed(2), " \u00B7 vs avg ", delta(mine.intangibles, leagueIntangibles)] })] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `2px solid ${COLORS.ink}`, paddingTop: 10 }, children: [_jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.inkDim }, children: "Net edge over league average" }), _jsxs("span", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: [formatBonus(totalEdge), " OVR"] })] }), _jsxs("div", { style: { ...S.byline, fontSize: 12, marginTop: 6 }, children: ["\u2248 ", totalEdge >= 0 ? '+' : '', Math.round(totalEdge * 2.7), " wins per 162 games vs a league-average tactical baseline (Bradley-Terry conversion, ~1 OVR \u2248 1.7 win-pct points)"] })] }));
}
