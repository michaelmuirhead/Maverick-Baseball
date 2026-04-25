import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
export function Stat({ label, value, delta, warn }) {
    return (_jsxs("div", { style: S.stat, children: [_jsx("div", { style: S.statLabel, children: label }), _jsx("div", { style: { ...S.statValue, color: warn ? COLORS.red : COLORS.ink }, children: value }), delta && _jsx("div", { style: S.statDelta, children: delta })] }));
}
export function Inline({ label, value }) {
    const row = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: '1px dotted rgba(26,24,20,0.13)',
    };
    return (_jsxs("div", { style: row, children: [_jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, letterSpacing: '0.15em', textTransform: 'uppercase' }, children: label }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontVariantNumeric: 'tabular-nums' }, children: value })] }));
}
export function grid(cols) {
    return { display: 'grid', gridTemplateColumns: cols, gap: 16 };
}
