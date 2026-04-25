import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { CBT_TIER1, CBT_TIER2, CBT_TIER3, teamPayroll, computeLuxuryTax } from '../engine/finance';
import { fmtShort } from '../engine/format';
/**
 * Visual payroll vs CBT-tier indicator. Shows current annual payroll, the
 * three CBT thresholds, and projected luxury tax owed.
 */
export function PayrollBar({ compact = false }) {
    const { state } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const payroll = teamPayroll(state, fid);
    const tax = computeLuxuryTax(payroll);
    // Scale the bar to $300M (above tier 3)
    const SCALE = 300_000_000;
    const pct = (v) => Math.min(100, (v / SCALE) * 100);
    const tierColor = payroll >= CBT_TIER3 ? COLORS.red :
        payroll >= CBT_TIER2 ? '#c47a00' :
            payroll >= CBT_TIER1 ? COLORS.gold :
                COLORS.green;
    return (_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Payroll & CBT Cap" }), _jsxs("div", { style: { display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 4, marginBottom: 8 }, children: [_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Current payroll" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: compact ? 22 : 28, color: tierColor }, children: fmtShort(payroll) })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Projected tax" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: compact ? 18 : 24, color: tax > 0 ? COLORS.red : COLORS.inkDim }, children: tax > 0 ? fmtShort(tax) : 'None' })] })] }), _jsxs("div", { style: { position: 'relative', height: 28, background: '#e6dcc4', border: `1px solid ${COLORS.ink}`, borderRadius: 2 }, children: [_jsx("div", { style: {
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${pct(payroll)}%`,
                            background: tierColor,
                            transition: 'width 0.3s',
                        } }), [CBT_TIER1, CBT_TIER2, CBT_TIER3].map((t, i) => (_jsx("div", { style: {
                            position: 'absolute', left: `${pct(t)}%`, top: -2, bottom: -2,
                            width: 2, background: COLORS.ink,
                        }, children: _jsxs("div", { style: {
                                position: 'absolute', top: 32, left: -20, width: 60,
                                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                                color: COLORS.inkDim, textAlign: 'center',
                            }, children: ["T", i + 1, _jsx("br", {}), fmtShort(t)] }) }, t)))] }), !compact && (_jsxs("div", { style: { marginTop: 36, fontSize: 11, color: COLORS.inkDim, fontFamily: "'IBM Plex Serif', serif" }, children: [payroll < CBT_TIER1 && (_jsxs("span", { children: [fmtShort(CBT_TIER1 - payroll), " of room before Tier 1 (20% tax)."] })), payroll >= CBT_TIER1 && payroll < CBT_TIER2 && (_jsxs("span", { children: ["Above Tier 1 \u2014 20% on the next ", fmtShort(CBT_TIER2 - payroll), " until Tier 2."] })), payroll >= CBT_TIER2 && payroll < CBT_TIER3 && (_jsxs("span", { children: ["Above Tier 2 \u2014 32% marginal. ", fmtShort(CBT_TIER3 - payroll), " until Tier 3."] })), payroll >= CBT_TIER3 && (_jsxs("span", { style: { color: COLORS.red }, children: ["In Tier 3 \u2014 62.5% marginal rate on every dollar above ", fmtShort(CBT_TIER3), "."] }))] }))] }));
}
