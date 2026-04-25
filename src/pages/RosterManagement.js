import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import { describeClauses } from '../engine/contractClauses';
export function RosterManagement() {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    const fortyMan = (state.fortyMan?.[fid] || []).map(id => state.players[id]).filter(Boolean);
    const active = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
    const arb = active.filter(p => p.contract?.status === 'arb');
    const nearFA = active.filter(p => p.contract && p.contract.years <= 1 && p.contract.status !== 'pre-arb');
    const qos = state.qualifyingOffers || [];
    const myQOs = qos.filter(qo => qo.fromFid === fid);
    const optionsRemaining = (p) => 3 - (p.optionsUsed || 0);
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [f.city, " ", f.name, " Roster Management"] }), _jsx("div", { style: S.sectionSub, children: "40-man, options used, arbitration, and qualifying offers." })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }, children: [_jsx(Box, { label: "Active 26", value: `${active.length}/26` }), _jsx(Box, { label: "40-Man", value: `${fortyMan.length}/40` }), _jsx(Box, { label: "Arb-Eligible", value: String(arb.length) }), _jsx(Box, { label: "QOs Issued", value: String(myQOs.length) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "40-Man Roster" }), _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Pos" }), _jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Age" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Opts" }), _jsx("th", { style: S.th, children: "Status" })] }) }), _jsx("tbody", { children: fortyMan.slice(0, 40).map(p => (_jsxs("tr", { children: [_jsx("td", { style: { ...S.td, ...S.tdPos }, children: p.pos }), _jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.age }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: optionsRemaining(p) }), _jsx("td", { style: S.td, children: p.prospect ? 'Prospect' : 'MLB' })] }, p.id))) })] })] }), _jsxs("div", { children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Arbitration Eligible" }), arb.length === 0
                                        ? _jsx("div", { style: { fontSize: 12, color: '#777' }, children: "No arb-eligible players this offseason." })
                                        : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Salary" })] }) }), _jsx("tbody", { children: arb.map(p => (_jsxs("tr", { children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.contract ? fmtShort(p.contract.salary) : '-' })] }, p.id))) })] }))] }), _jsxs("div", { style: { ...S.panel, marginTop: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Approaching Free Agency (final year)" }), nearFA.length === 0
                                        ? _jsx("div", { style: { fontSize: 12, color: '#777' }, children: "No expiring contracts." })
                                        : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Name" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "OVR" }), _jsx("th", { style: { ...S.th, ...S.thNum }, children: "Salary" }), _jsx("th", { style: S.th, children: "Clauses" })] }) }), _jsx("tbody", { children: nearFA.map(p => (_jsxs("tr", { children: [_jsxs("td", { style: { ...S.td, ...S.tdName }, children: [p.firstName, " ", p.lastName] }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: toScout(p.ratings.overall) }), _jsx("td", { style: { ...S.td, ...S.tdNum }, children: p.contract ? fmtShort(p.contract.salary) : '-' }), _jsx("td", { style: { ...S.td, fontSize: 11 }, children: describeClauses(p.contract?.clauses).join(', ') || '—' })] }, p.id))) })] }))] }), _jsxs("div", { style: { ...S.panel, marginTop: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Qualifying Offers Tendered" }), myQOs.length === 0
                                        ? _jsx("div", { style: { fontSize: 12, color: '#777' }, children: "No QOs out." })
                                        : myQOs.map(qo => {
                                            const p = state.players[qo.playerId];
                                            return (_jsxs("div", { style: { fontSize: 12, padding: '4px 0' }, children: [p?.firstName, " ", p?.lastName, " \u2014 ", qo.declined ? 'Declined' : qo.signedElsewhere ? 'Signed elsewhere (comp pick)' : 'Pending'] }, qo.playerId));
                                        })] })] })] })] }));
}
function Box({ label, value }) {
    return (_jsxs("div", { style: { ...S.panel, padding: 12 }, children: [_jsx("div", { style: { fontSize: 11, color: '#777', textTransform: 'uppercase' }, children: label }), _jsx("div", { style: { fontSize: 22, fontWeight: 700, marginTop: 4 }, children: value })] }));
}
