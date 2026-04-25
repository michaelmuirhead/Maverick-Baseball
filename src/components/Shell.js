import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel, seasonDate } from '../engine/format';
import { NAV, findGroupForPage, firstSubOfGroup } from './navConfig';
export function Shell({ children }) {
    const { state, page, setPage, lastSubByGroup, advanceOne, advanceTo, clearSavedGame, setView } = useGame();
    if (!state)
        return _jsx(_Fragment, { children: children });
    const userTeam = FRANCHISES[state.userFranchiseId];
    const standing = state.standings[state.userFranchiseId];
    const fin = state.finances[state.userFranchiseId];
    const activeGroup = findGroupForPage(page);
    const activeGroupDef = NAV.find(g => g.id === activeGroup) || NAV[0];
    const onTopClick = (groupId) => {
        const remembered = lastSubByGroup[groupId];
        if (remembered) {
            setPage(remembered);
        }
        else {
            setPage(firstSubOfGroup(groupId));
        }
    };
    return (_jsxs("div", { style: S.shell, children: [_jsx("header", { style: S.masthead, children: _jsxs("div", { style: S.mastheadInner, children: [_jsxs("div", { style: S.mastheadMeta, children: ["VOL. ", state.season - 2025, " - NO. ", state.day < 0 ? `OFF-${Math.abs(state.day)}` : state.day] }), _jsxs("div", { children: [_jsx("div", { style: S.mastheadTitle, children: "Maverick Baseball" }), _jsx("div", { style: S.mastheadSub, children: "The Front-Office Broadsheet" })] }), _jsxs("div", { style: { ...S.mastheadMeta, textAlign: 'right' }, children: [userTeam.city, " ", userTeam.name, " - ", standing.wins, "-", standing.losses, " - ", fmtShort(fin.teamCash)] })] }) }), _jsx("nav", { style: S.nav, children: _jsx("div", { style: S.navInner, children: NAV.map((g) => (_jsx("button", { type: "button", style: S.navItem(g.id === activeGroup), onClick: () => onTopClick(g.id), children: g.label }, g.id))) }) }), _jsx("div", { style: subBarStyle, children: _jsx("div", { style: subBarInnerStyle, children: activeGroupDef.subs.map((s) => (_jsx("button", { type: "button", style: subPillStyle(s.id === page), onClick: () => setPage(s.id), children: s.label }, s.id))) }) }), _jsx("main", { style: S.page, children: children }), _jsx("footer", { style: S.footer, children: _jsxs("div", { style: S.footerInner, children: [_jsx("div", { style: S.footerDate, children: seasonDate(state.day, state.season) }), _jsx("div", { style: S.footerPhase, children: phaseLabel(state.phase, state) }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { style: S.footerBtn, onClick: () => advanceOne(), children: "+1 Day" }), _jsx("button", { style: S.footerBtn, onClick: () => advanceTo('next_week'), children: "+1 Week" }), state.phase === 'offseason' && (_jsxs(_Fragment, { children: [_jsx("button", { style: S.footerBtn, onClick: () => advanceTo('fa_open'), children: "FA Open" }), _jsx("button", { style: S.footerBtn, onClick: () => advanceTo('draft_day'), children: "Draft Day" }), _jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('opening_day'), children: "Opening Day" })] })), state.phase === 'regular_season' && (_jsxs(_Fragment, { children: [_jsx("button", { style: S.footerBtn, onClick: () => advanceTo('trade_deadline'), children: "Deadline" }), _jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('end_of_season'), children: "End of Season" })] })), state.phase === 'postseason' && (_jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('champion_crowned'), children: "Crown a Champion" })), _jsx("button", { style: { ...S.footerBtn, borderColor: COLORS.cream }, onClick: () => {
                                if (confirm('Quit to splash and clear saved game?')) {
                                    clearSavedGame();
                                    setView('splash');
                                }
                            }, children: "Quit" })] }) })] }));
}
const subBarStyle = {
    background: '#f5efe0',
    borderBottom: `1px solid ${COLORS.ink}`,
    borderTop: `1px solid ${COLORS.ink}22`,
};
const subBarInnerStyle = {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    gap: 4,
    padding: '6px 16px',
    flexWrap: 'wrap',
};
const subPillStyle = (active) => ({
    background: active ? '#ebe2cb' : 'transparent',
    border: 0,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    color: active ? COLORS.ink : '#555',
    cursor: 'pointer',
    borderRadius: 3,
    fontFamily: 'inherit',
});
