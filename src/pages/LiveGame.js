import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { RNG } from '../engine/rng';
import { startLiveGame, simNextHalfInning, simFullLiveGame, describeAtbat, } from '../engine/liveGame';
import { simGame, applyResult } from '../engine/sim';
export function LiveGame() {
    const { state, setPage, setState } = useGame();
    const [live, setLive] = useState(null);
    const [rngSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
    const [committed, setCommitted] = useState(false);
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    // Find next unplayed user-team game
    const upcomingGames = useMemo(() => {
        return state.schedule
            .filter((g) => !g.played && (g.home === fid || g.away === fid))
            .slice(0, 5);
    }, [state.schedule, fid]);
    if (!live) {
        return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Live Game Feed" }), _jsx("div", { style: S.sectionSub, children: "Watch a game unfold inning by inning" })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Pick an upcoming game" }), upcomingGames.length === 0 ? (_jsx("div", { style: { ...S.byline, marginTop: 8 }, children: "No upcoming games. Wait for the regular season to begin." })) : (_jsx("div", { style: { marginTop: 8 }, children: upcomingGames.map((g) => {
                                const home = FRANCHISES[g.home];
                                const away = FRANCHISES[g.away];
                                return (_jsxs("div", { style: {
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '8px 4px',
                                        borderBottom: '1px dotted rgba(26,24,20,0.13)',
                                    }, children: [_jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 60 }, children: ["Day ", g.day] }), _jsxs("span", { style: { flex: 1, fontFamily: "'IBM Plex Serif', serif" }, children: [away.city, " @ ", home.city] }), _jsx("button", { onClick: () => setLive(startLiveGame(state, g)), style: { ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green, fontSize: 11 }, children: "Start" })] }, g.id));
                            }) })), _jsx("button", { onClick: () => setPage('schedule'), style: { ...S.radioBtn(false), marginTop: 12 }, children: "Back to schedule" })] })] }));
    }
    const home = FRANCHISES[live.homeFid];
    const away = FRANCHISES[live.awayFid];
    const advance = () => {
        if (live.finished)
            return;
        const rng = new RNG(rngSeed + live.log.length);
        const next = simNextHalfInning(state, { ...live, log: [...live.log] }, rng);
        setLive(next);
    };
    const finish = () => {
        const rng = new RNG(rngSeed + 999);
        const sched = state.schedule.find((g) => g.id === live.gameId);
        const next = simFullLiveGame(state, sched, rng);
        setLive(next);
    };
    // Commit the live result into the actual game schedule + sim the rest of the
    // day's slate in the background. Runs once when live.finished flips true.
    if (live.finished && !committed && state) {
        const game = state.schedule.find((g) => g.id === live.gameId);
        if (game) {
            const winner = (live.scoreHome > live.scoreAway) ? game.home : game.away;
            const loser = winner === game.home ? game.away : game.home;
            game.result = {
                homeScore: live.scoreHome,
                awayScore: live.scoreAway,
                winner, loser,
                attendance: 0,
            };
            game.played = true;
            const rng = new RNG(rngSeed + 100);
            applyResult(state, game, rng);
            // Sim the rest of the day's games
            for (const idx of (state.byDay[game.day] || [])) {
                const g = state.schedule[idx];
                if (g && !g.played) {
                    g.result = simGame(rng, state, g);
                    g.played = true;
                    applyResult(state, g, rng);
                }
            }
            setState({ ...state });
            setCommitted(true);
        }
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsxs("h2", { style: S.sectionHead, children: [away.city, " @ ", home.city] }), _jsx("div", { style: S.sectionSub, children: live.finished ? 'FINAL' : `${live.half === 'top' ? 'Top' : 'Bot'} ${live.inning} - ${live.outs} outs` })] }), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: 32, justifyContent: 'center' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 14, color: COLORS.inkDim }, children: away.abbr }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 56, lineHeight: 1 }, children: live.scoreAway })] }), _jsxs("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: COLORS.inkDim }, children: ["INN ", live.inning] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 14, color: COLORS.inkDim }, children: home.abbr }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 56, lineHeight: 1 }, children: live.scoreHome })] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }, children: [!live.finished && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: advance, style: { ...S.radioBtn(true), background: COLORS.ink }, children: "Next half-inning" }), _jsx("button", { onClick: finish, style: { ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold }, children: "Sim to final" })] })), _jsx("button", { onClick: () => setLive(null), style: S.radioBtn(false), children: "New game" })] })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Play-by-play" }), live.log.length === 0 ? (_jsx("div", { style: { ...S.byline, marginTop: 8 }, children: "Game hasn't started yet. Click \"Next half-inning\"." })) : (_jsx("div", { style: { marginTop: 8, maxHeight: 480, overflowY: 'auto' }, children: (() => {
                            const grouped = [];
                            for (const a of live.log) {
                                const key = `${a.inning}-${a.half}`;
                                let g = grouped.find((x) => x.key === key);
                                if (!g) {
                                    g = { key, half: a.half, inning: a.inning, entries: [] };
                                    grouped.push(g);
                                }
                                g.entries.push(a);
                            }
                            return grouped.map((g) => (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("div", { style: { ...S.eyebrow, marginBottom: 4 }, children: [g.half === 'top' ? 'Top' : 'Bot', " ", g.inning, " - ", g.half === 'top' ? away.abbr : home.abbr, " batting"] }), g.entries.map((a, i) => (_jsxs("div", { style: {
                                            padding: '4px 8px',
                                            fontFamily: "'IBM Plex Serif', serif",
                                            fontSize: 13,
                                            background: a.runs > 0 ? '#f8f2e4' : 'transparent',
                                            borderLeft: a.outcome === 'HR' ? `3px solid ${COLORS.gold}` : 'none',
                                            marginLeft: a.outcome === 'HR' ? -3 : 0,
                                            paddingLeft: a.outcome === 'HR' ? 5 : 8,
                                        }, children: [_jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim, marginRight: 8 }, children: ["[", a.outcome, "]"] }), describeAtbat(a), _jsxs("span", { style: { marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }, children: [a.scoreAway, "-", a.scoreHome] })] }, i)))] }, g.key)));
                        })() }))] })] }));
}
