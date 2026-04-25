import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmt, fmtShort } from '../engine/format';
import { Inline } from '../components/Stat';
import { newParkCost } from '../engine/stadiumReplace';

export function Stadium() {
  const { state, purchaseUpgradeAction, buildStadiumAction, relocateAction } = useGame();
  const [showBuild, setShowBuild] = useState(false);
  const [showReloc, setShowReloc] = useState(false);
  const [parkName, setParkName] = useState('Maverick Park');
  const [parkCap, setParkCap] = useState(42000);
  const [parkPrem, setParkPrem] = useState(3500);
  const [parkAmen, setParkAmen] = useState(4);
  const [parkPf, setParkPf] = useState(102);
  const [relocCity, setRelocCity] = useState('Las Vegas');
  const [relocName, setRelocName] = useState('Mavericks');
  const [relocAbbr, setRelocAbbr] = useState('LV');
  const [relocColor, setRelocColor] = useState('#1f3a5f');
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
      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>Build a New Ballpark</div>
        <div style={S.byline}>
          A complete replacement: new capacity, premium seats, amenities, and park factors.
          Estimated cost {fmtShort(newParkCost({ name: parkName, cap: parkCap, premium: parkPrem, amen: parkAmen, pf: parkPf }))}.
        </div>
        <button onClick={() => setShowBuild((v) => !v)} style={{ ...S.radioBtn(showBuild), marginTop: 6 }}>
          {showBuild ? 'Hide builder' : 'Open builder'}
        </button>
        {showBuild && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            <label style={{ ...S.eyebrow }}>Name<input value={parkName} onChange={(e) => setParkName(e.target.value)} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Capacity<input type="number" value={parkCap} onChange={(e) => setParkCap(Number(e.target.value))} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Premium<input type="number" value={parkPrem} onChange={(e) => setParkPrem(Number(e.target.value))} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Amenity (1-5)<input type="number" min={1} max={5} value={parkAmen} onChange={(e) => setParkAmen(Math.max(1, Math.min(5, Number(e.target.value))))} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Park Factor (95-115)<input type="number" min={95} max={115} value={parkPf} onChange={(e) => setParkPf(Math.max(95, Math.min(115, Number(e.target.value))))} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <button
              onClick={() => {
                const r = buildStadiumAction({ name: parkName, cap: parkCap, premium: parkPrem, amen: parkAmen, pf: parkPf });
                alert(r.ok ? `${parkName} ready for opening day!` : (r.reason || 'Failed'));
              }}
              style={{ ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red }}
            >
              Build
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>Relocate / Rebrand Franchise</div>
        <div style={S.byline}>
          Move the team to a new city with a new identity. $500M relocation fee. Triggers a 3-year market reset.
        </div>
        <button onClick={() => setShowReloc((v) => !v)} style={{ ...S.radioBtn(showReloc), marginTop: 6 }}>
          {showReloc ? 'Hide relocation' : 'Open relocation'}
        </button>
        {showReloc && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            <label style={{ ...S.eyebrow }}>City<input value={relocCity} onChange={(e) => setRelocCity(e.target.value)} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Team Name<input value={relocName} onChange={(e) => setRelocName(e.target.value)} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Abbr (3 chars)<input value={relocAbbr} onChange={(e) => setRelocAbbr(e.target.value.toUpperCase().slice(0, 3))} style={{ width: '100%', padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` }} /></label>
            <label style={{ ...S.eyebrow }}>Color<input type="color" value={relocColor} onChange={(e) => setRelocColor(e.target.value)} style={{ width: '100%', padding: 0, height: 30, border: `1px solid ${COLORS.ink}` }} /></label>
            <button
              onClick={() => {
                const r = relocateAction({ city: relocCity, name: relocName, abbr: relocAbbr, color: relocColor });
                alert(r.ok ? `Welcome to ${relocCity}!` : (r.reason || 'Failed'));
              }}
              style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, gridColumn: '1 / -1' }}
            >
              Move + Rebrand ($500M fee)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
