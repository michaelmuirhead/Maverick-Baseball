import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { teamTopProspects } from '../engine/prospects';
import { toScout } from '../engine/format';
/**
 * Top 3 user prospects with estimated callup ETA based on age + ratings gap.
 */
export function ProspectDevSummary() {
    const { state, setSelectedPlayerId } = useGame();
    if (!state)
        return null;
    const fid = state.userFranchiseId;
    const top = teamTopProspects(state, fid, 3);
    if (top.length === 0)
        return null;
    return (_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Top Farm Talent" }), _jsx("div", { style: { marginTop: 8 }, children: top.map((r) => {
                    const p = r.player;
                    const gap = p.potential - p.ratings.overall;
                    const eta = r.eta;
                    const etaLabel = eta === 0 ? 'Ready now'
                        : eta === 1 ? '1 yr away'
                            : `${eta} yrs away`;
                    return (_jsxs("div", { onClick: () => setSelectedPlayerId(p.id), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 0',
                            cursor: 'pointer',
                            borderBottom: '1px dotted rgba(26,24,20,0.13)',
                        }, children: [_jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", color: COLORS.inkDim, fontSize: 11, width: 24 }, children: ["#", r.rank] }), _jsxs("span", { style: { flex: 1, fontFamily: "'IBM Plex Serif', serif" }, children: [p.firstName, " ", p.lastName, ' ', _jsxs("span", { style: { color: COLORS.inkDim, fontSize: 11 }, children: ["(", p.pos, ", age ", p.age, ")"] })] }), _jsxs("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }, children: [toScout(p.ratings.overall), "/", toScout(p.potential), " ", _jsxs("span", { style: { color: COLORS.inkDim }, children: ["(", gap > 0 ? '+' : '', gap, ")"] })] }), _jsx("span", { style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: eta === 0 ? COLORS.green : COLORS.inkDim, width: 90, textAlign: 'right' }, children: etaLabel })] }, p.id));
                }) })] }));
}
