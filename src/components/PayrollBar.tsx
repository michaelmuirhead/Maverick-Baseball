import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { CBT_TIER1, CBT_TIER2, CBT_TIER3, teamPayroll, computeLuxuryTax } from '../engine/finance';
import { fmtShort } from '../engine/format';

/**
 * Visual payroll vs CBT-tier indicator. Shows current annual payroll, the
 * three CBT thresholds, and projected luxury tax owed.
 */
export function PayrollBar({ compact = false }: { compact?: boolean }) {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const payroll = teamPayroll(state, fid);
  const tax = computeLuxuryTax(payroll);

  // Scale the bar to $300M (above tier 3)
  const SCALE = 300_000_000;
  const pct = (v: number) => Math.min(100, (v / SCALE) * 100);

  const tierColor =
    payroll >= CBT_TIER3 ? COLORS.red :
    payroll >= CBT_TIER2 ? '#c47a00' :
    payroll >= CBT_TIER1 ? COLORS.gold :
    COLORS.green;

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Payroll & CBT Cap</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 4, marginBottom: 8 }}>
        <div>
          <div style={S.eyebrow}>Current payroll</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: compact ? 22 : 28, color: tierColor }}>
            {fmtShort(payroll)}
          </div>
        </div>
        <div>
          <div style={S.eyebrow}>Projected tax</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: compact ? 18 : 24, color: tax > 0 ? COLORS.red : COLORS.inkDim }}>
            {tax > 0 ? fmtShort(tax) : 'None'}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: 28, background: '#e6dcc4', border: `1px solid ${COLORS.ink}`, borderRadius: 2 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct(payroll)}%`,
          background: tierColor,
          transition: 'width 0.3s',
        }} />
        {/* Tier markers */}
        {[CBT_TIER1, CBT_TIER2, CBT_TIER3].map((t, i) => (
          <div key={t} style={{
            position: 'absolute', left: `${pct(t)}%`, top: -2, bottom: -2,
            width: 2, background: COLORS.ink,
          }}>
            <div style={{
              position: 'absolute', top: 32, left: -20, width: 60,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              color: COLORS.inkDim, textAlign: 'center',
            }}>
              T{i + 1}<br />{fmtShort(t)}
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <div style={{ marginTop: 36, fontSize: 11, color: COLORS.inkDim, fontFamily: "'IBM Plex Serif', serif" }}>
          {payroll < CBT_TIER1 && (
            <span>{fmtShort(CBT_TIER1 - payroll)} of room before Tier 1 (20% tax).</span>
          )}
          {payroll >= CBT_TIER1 && payroll < CBT_TIER2 && (
            <span>Above Tier 1 — 20% on the next {fmtShort(CBT_TIER2 - payroll)} until Tier 2.</span>
          )}
          {payroll >= CBT_TIER2 && payroll < CBT_TIER3 && (
            <span>Above Tier 2 — 32% marginal. {fmtShort(CBT_TIER3 - payroll)} until Tier 3.</span>
          )}
          {payroll >= CBT_TIER3 && (
            <span style={{ color: COLORS.red }}>In Tier 3 — 62.5% marginal rate on every dollar above {fmtShort(CBT_TIER3)}.</span>
          )}
        </div>
      )}
    </div>
  );
}
