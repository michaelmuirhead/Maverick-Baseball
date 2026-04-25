import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort } from '../engine/format';
import { CBT_TIER1 } from '../engine/finance';

function row(label: string, value: number, debit = false) {
  return (
    <tr>
      <td style={S.ledgerTd}>{label}</td>
      <td style={{ ...S.ledgerTdNum, color: debit ? COLORS.red : 'inherit' }}>
        {debit ? `(${fmtShort(value)})` : fmtShort(value)}
      </td>
    </tr>
  );
}

export function Finances() {
  const { state, setTicketPrice, setPremiumPrice, setParkingPrice } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const fin = state.finances[fid];
  const l = fin.ledger;

  const annualPayroll = state.rosters[fid].reduce(
    (s, pid) => s + (state.players[pid].contract?.salary || 0),
    0,
  );

  const rev = l.ticketRev + l.premiumRev + l.concRev + l.parkRev + l.merchRev + l.localTV + l.natTV + l.sponsorRev + l.namingRev + (l.postseasonRev || 0);
  const exp = l.payroll + l.staff + l.stadium + l.minors + l.scouting + l.analytics + l.medical + l.marketing + l.travel + l.debtService + (l.signingBonuses || 0);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Finances</h2>
        <div style={S.sectionSub}>{f.city} {f.name} · season {state.season}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={S.panelThick}>
          <div style={S.panelTitle}>Year-to-Date Ledger</div>
          <table style={S.ledger}>
            <tbody>
              <tr><td style={S.ledgerDivider} colSpan={2}>Revenue</td></tr>
              {row('Tickets', l.ticketRev)}
              {row('Premium', l.premiumRev)}
              {row('Concessions', l.concRev)}
              {row('Parking', l.parkRev)}
              {row('Merchandise', l.merchRev)}
              {row('Local TV', l.localTV)}
              {row('National TV', l.natTV)}
              {row('Sponsorships', l.sponsorRev)}
              {row('Naming Rights', l.namingRev)}
              {(l.postseasonRev || 0) > 0 && row('Postseason', l.postseasonRev || 0)}
              <tr><td style={S.ledgerTotal}>Total Revenue</td><td style={{ ...S.ledgerTotal, textAlign: 'right' }}>{fmtShort(rev)}</td></tr>
              <tr><td style={S.ledgerDivider} colSpan={2}>Expenses</td></tr>
              {row('Payroll', l.payroll, true)}
              {row('Staff', l.staff, true)}
              {row('Stadium Ops', l.stadium, true)}
              {row('Minor League', l.minors, true)}
              {row('Scouting', l.scouting, true)}
              {row('Analytics', l.analytics, true)}
              {row('Medical', l.medical, true)}
              {row('Marketing', l.marketing, true)}
              {row('Travel', l.travel, true)}
              {row('Debt Service', l.debtService, true)}
              {(l.signingBonuses || 0) > 0 && row('Signing Bonuses', l.signingBonuses || 0, true)}
              <tr><td style={S.ledgerTotal}>Total Expenses</td><td style={{ ...S.ledgerTotal, textAlign: 'right' }}>{fmtShort(exp)}</td></tr>
              <tr>
                <td style={{ ...S.ledgerTotal, fontFamily: "'DM Serif Display', serif" }}>Net</td>
                <td style={{ ...S.ledgerTotal, textAlign: 'right', color: rev - exp >= 0 ? COLORS.green : COLORS.red }}>
                  {rev - exp >= 0 ? '+' : ''}{fmtShort(rev - exp)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Owner & Cash</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              Team Cash: {fmtShort(fin.teamCash)}<br />
              Owner Cash: {fmtShort(fin.ownerCash)}<br />
              Debt: {fmtShort(fin.debt)}<br />
              Franchise Value: {fmtShort(fin.franchiseValue)}
            </div>
          </div>

          <div style={{ ...S.panel, marginTop: 12 }}>
            <div style={S.panelTitle}>Payroll vs CBT</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              Annualized: {fmtShort(annualPayroll)}<br />
              CBT Tier 1: {fmtShort(CBT_TIER1)}<br />
              Headroom: <span style={{ color: annualPayroll < CBT_TIER1 ? COLORS.green : COLORS.red }}>
                {fmtShort(CBT_TIER1 - annualPayroll)}
              </span>
            </div>
          </div>

          <div style={{ ...S.panel, marginTop: 12 }}>
            <div style={S.panelTitle}>Pricing</div>
            <Pricer label="Tickets" value={fin.ticketPrice} onChange={(v) => setTicketPrice(fid, v)} step={1} />
            <Pricer label="Premium" value={fin.premiumPrice} onChange={(v) => setPremiumPrice(fid, v)} step={5} />
            <Pricer label="Parking" value={fin.parkingPrice} onChange={(v) => setParkingPrice(fid, v)} step={1} />
          </div>

          <div style={{ ...S.panel, marginTop: 12 }}>
            <div style={S.panelTitle}>TV / Naming Rights</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              Local TV: {fmtShort(fin.tvValue)}/yr · {fin.tvYearsLeft} yrs left<br />
              {fin.nameRightsValue > 0 && <>Naming: {fmtShort(fin.nameRightsValue)}/yr · {fin.nameRightsYearsLeft} yrs left</>}
              {fin.nameRightsValue === 0 && <>No naming rights deal</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pricer({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onChange(Math.max(1, value - step))} style={S.radioBtn(false)}>−</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, width: 50, textAlign: 'center' }}>${value}</span>
        <button onClick={() => onChange(value + step)} style={S.radioBtn(false)}>+</button>
      </div>
    </div>
  );
}
