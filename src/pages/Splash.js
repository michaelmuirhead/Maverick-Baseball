import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
export function Splash() {
    const { setView, hasSavedGame, loadFromStorage } = useGame();
    const canResume = hasSavedGame();
    return (_jsxs("div", { style: {
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 40,
            background: COLORS.paper, backgroundImage: 'radial-gradient(rgba(26, 24, 20, 0.05) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
        }, children: [_jsx("div", { style: { ...S.eyebrow, fontSize: 11, letterSpacing: '0.35em' }, children: "A Front-Office Simulation \u00B7 Est. 2026" }), _jsx("h1", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 72, letterSpacing: '0.01em', lineHeight: 1, textAlign: 'center', margin: '8px 0' }, children: "Maverick Baseball" }), _jsx("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: COLORS.inkDim, marginTop: 2, textAlign: 'center' }, children: "Owner \u00B7 General Manager \u00B7 Architect" }), _jsx("div", { style: { borderBottom: `3px double ${COLORS.ink}`, width: 280, margin: '20px 0' } }), _jsx("p", { style: { ...S.byline, fontSize: 16, textAlign: 'center', maxWidth: 540, marginBottom: 40 }, children: "Buy a ballclub. Build a front office. Shape a franchise across decades \u2014 from the amateur draft to the luxury tax, from the gate to the Commissioner's Trophy." }), _jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }, children: [_jsx("button", { onClick: () => setView('new_game'), style: {
                            padding: '14px 32px', fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
                            background: COLORS.ink, color: COLORS.paper,
                            border: `2px solid ${COLORS.ink}`, cursor: 'pointer',
                        }, children: "Begin Ownership" }), canResume && (_jsx("button", { onClick: () => loadFromStorage(), style: {
                            padding: '14px 32px', fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
                            background: COLORS.panel, color: COLORS.ink,
                            border: `2px solid ${COLORS.ink}`, cursor: 'pointer',
                        }, children: "Resume Saved Game" }))] })] }));
}
