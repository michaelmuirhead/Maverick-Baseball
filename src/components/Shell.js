import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel, seasonDate } from '../engine/format';
const PAGES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'roster', label: 'Roster' },
    { id: 'minors', label: 'Minors' },
    { id: 'staff', label: 'Staff' },
    { id: 'trades', label: 'Trades' },
    { id: 'free_agency', label: 'Free Agency' },
    { id: 'draft', label: 'Draft' },
    { id: 'international', label: 'Intl' },
    { id: 'rule5', label: 'Rule 5' },
    { id: 'prospects', label: 'Prospects' },
    { id: 'injured_list', label: 'Injured List' },
    { id: 'standings', label: 'Standings' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'live_game', label: 'Live' },
    { id: 'playoffs', label: 'Playoffs' },
    { id: 'finances', label: 'Finances' },
    { id: 'stadium', label: 'Stadium' },
    { id: 'news', label: 'News' },
    { id: 'awards', label: 'Awards' },
    { id: 'leaderboards', label: 'Leaders' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
];
export function Shell({ children }) {
    const { state, page, setPage, advanceOne, advanceTo, clearSavedGame, setView } = useGame();
    if (!state)
        return _jsx(_Fragment, { children: children });
    const userTeam = FRANCHISES[state.userFranchiseId];
    const standing = state.standings[state.userFranchiseId];
    const fin = state.finances[state.userFranchiseId];
    return (_jsxs("div", { style: S.shell, children: [_jsx("header", { style: S.masthead, children: _jsxs("div", { style: S.mastheadInner, children: [_jsxs("div", { style: S.mastheadMeta, children: ["VOL. ", state.season - 2025, " - NO. ", state.day < 0 ? `OFF-${Math.abs(state.day)}` : state.day] }), _jsxs("div", { children: [_jsx("div", { style: S.mastheadTitle, children: "Maverick Baseball" }), _jsx("div", { style: S.mastheadSub, children: "The Front-Office Broadsheet" })] }), _jsxs("div", { style: { ...S.mastheadMeta, textAlign: 'right' }, children: [userTeam.city, " ", userTeam.name, " - ", standing.wins, "-", standing.losses, " - ", fmtShort(fin.teamCash)] })] }) }), _jsx("nav", { style: S.nav, children: _jsx("div", { style: S.navInner, children: PAGES.map((p) => (_jsx("button", { type: "button", style: S.navItem(p.id === page), onClick: () => setPage(p.id), children: p.label }, p.id))) }) }), _jsx("main", { style: S.page, children: children }), _jsx("footer", { style: S.footer, children: _jsxs("div", { style: S.footerInner, children: [_jsx("div", { style: S.footerDate, children: seasonDate(state.day, state.season) }), _jsx("div", { style: S.footerPhase, children: phaseLabel(state.phase, state) }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { style: S.footerBtn, onClick: () => advanceOne(), children: "+1 Day" }), _jsx("button", { style: S.footerBtn, onClick: () => advanceTo('next_week'), children: "+1 Week" }), state.phase === 'offseason' && (_jsxs(_Fragment, { children: [_jsx("button", { style: S.footerBtn, onClick: () => advanceTo('fa_open'), children: "FA Open" }), _jsx("button", { style: S.footerBtn, onClick: () => advanceTo('draft_day'), children: "Draft Day" }), _jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('opening_day'), children: "Opening Day" })] })), state.phase === 'regular_season' && (_jsxs(_Fragment, { children: [_jsx("button", { style: S.footerBtn, onClick: () => advanceTo('trade_deadline'), children: "Deadline" }), _jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('end_of_season'), children: "End of Season" })] })), state.phase === 'postseason' && (_jsx("button", { style: S.footerBtnPrimary, onClick: () => advanceTo('champion_crowned'), children: "Crown a Champion" })), _jsx("button", { style: { ...S.footerBtn, borderColor: COLORS.cream }, onClick: () => {
                                if (confirm('Quit to splash and clear saved game?')) {
                                    clearSavedGame();
                                    setView('splash');
                                }
                            }, children: "Quit" })] }) })] }));
}
