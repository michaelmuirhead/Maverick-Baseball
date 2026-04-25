import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmt, fmtShort } from '../engine/format';
import { Inline } from '../components/Stat';

export function Stadium() {
  const { state, purchaseUpgradeAction } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const fin = state.finances[fid];
  const l = fin.ledger;
  const avgAtt = l.homeGames > 0 ? Math.round(l.attendance / l.homeGames) : 0;

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.park}</h2>
        <div style={S.sectionSub}>{f.city} · capacity {fmt(f.cap)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Ballpark</div>
          <Inline label="Capacity" value={fmt(f.cap)} />
          <Inline label="Premium Seats" value={fmt(f.premium)} />
          <Inline label="Park Factor" value={f.pf} />
          <Inline label="Amenity Tier" value={`${f.amen} / 5`} />
          <Inline label="Naming Rights" value={fin.nameRightsValue > 0 ? `${fmtShort(fin.nameRightsValue)}/yr (${fin.nameRightsYearsLeft} yrs)` : 'None'} />
        </div>
        <div style={S.panel}>
          <div style={S.panelTitle}>This Season</div>
          <Inline label="Home Games" value={fmt(l.homeGames)} />
          <Inline label="Total Attendance" value={fmt(l.attendance)} />
          <Inline label="Avg Attendance" value={fmt(avgAtt)} />
          <Inline label="Gate Revenue" value={fmtShort(l.ticketRev + l.premiumRev)} />
          <Inline label="Concessions" value={fmtShort(l.concRev)} />
          <Inline label="Parking" value={fmtShort(l.parkRev)} />
          <Inline label="Merchandise" value={fmtShort(l.merchRev)} />
        </div>
      </div>
      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>Stadium Upgrades</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {([
            { t: 'capacity' as const, title: 'Expand Capacity', desc: '+2,000 seats', cost: 80, hint: 'Higher gate revenue ceiling.' },
            { t: 'premium' as const, title: 'Premium Seating', desc: '+500 premium', cost: 40, hint: 'Premium seats sell at ~4× ticket price.' },
            { t: 'amenity' as const, title: 'Amenity Tier', desc: f.amen >= 5 ? 'Maxed' : `+1 (now ${f.amen}/5)`, cost: 60, hint: 'Boosts concessions, merch, and fan demand.' },
          ]).map((up) => (
            <div key={up.t} style={S.stat}>
              <div style={S.statLabel}>{up.title}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginTop: 4 }}>{up.desc} · ${up.cost}M</div>
              <div style={{ ...S.byline, fontSize: 12, marginTop: 4 }}>{up.hint}</div>
              <button
                onClick={() => {
                  const r = purchaseUpgradeAction(up.t);
                  if (r.ok) alert(`${up.title} complete.`);
                  else alert(r.reason || 'Failed');
                }}
                disabled={fin.teamCash < up.cost * 1_000_000 || (up.t === 'amenity' && f.amen >= 5)}
                style={{
                  ...S.radioBtn(true), marginTop: 8,
                  background: fin.teamCash >= up.cost * 1_000_000 && !(up.t === 'amenity' && f.amen >= 5) ? COLORS.green : '#999',
                  borderColor: fin.teamCash >= up.cost * 1_000_000 && !(up.t === 'amenity' && f.amen >= 5) ? COLORS.green : '#999',
                  cursor: fin.teamCash >= up.cost * 1_000_000 && !(up.t === 'amenity' && f.amen >= 5) ? 'pointer' : 'not-allowed',
                  width: '100%',
                }}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>Color Identity</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 80, height: 30, background: f.color, border: `1px solid ${COLORS.ink}` }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{f.color}</span>
          {f.secondaryColor && <>
            <div style={{ width: 80, height: 30, background: f.secondaryColor, border: `1px solid ${COLORS.ink}`, marginLeft: 12 }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{f.secondaryColor}</span>
          </>}
        </div>
      </div>
    </div>
  );
}
