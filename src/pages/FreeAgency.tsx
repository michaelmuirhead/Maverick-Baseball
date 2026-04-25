import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import { estimateFairAAV } from '../engine/trades';

export function FreeAgency() {
  const { state, faPlaceBid, advanceTo } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const [aav, setAav] = useState<number>(8_000_000);
  const [years, setYears] = useState<number>(3);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [minOVR, setMinOVR] = useState<number>(0);

  if (!state) return null;
  const fa = state.freeAgency;

  if (!fa) {
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Free Agency</h2>
          <div style={S.sectionSub}>Free agency opens after the World Series.</div>
        </div>
        <div style={S.panel}>
          <p style={S.byline}>The market hasn't opened yet — current season is in progress.</p>
          <button onClick={() => advanceTo('fa_open')} style={S.radioBtn(true)}>Sim to FA Open</button>
        </div>
      </div>
    );
  }

  const userFid = state.userFranchiseId;
  const fin = state.finances[userFid];

  const sortedListings = [...fa.listings]
    .map((l) => ({ l, p: state.players[l.playerId] }))
    .filter((x) => x.p)
    .filter((x) => {
      if (search && !`${x.p.firstName} ${x.p.lastName}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (posFilter !== 'all' && x.p.pos !== posFilter) return false;
      if (x.p.ratings.overall < minOVR) return false;
      return true;
    })
    .sort((a, b) => b.p.ratings.overall - a.p.ratings.overall);

  const onSelect = (id: string) => {
    setSelected(id);
    const p = state.players[id];
    if (p) {
      const fair = estimateFairAAV(p.ratings.overall, p.age);
      setAav(fair);
      setYears(p.age >= 35 ? 1 : p.age >= 32 ? 2 : 3);
    }
  };

  const submitBid = () => {
    if (!selected) return;
    const r = faPlaceBid(selected, aav, years);
    if (!r.ok) alert(r.reason);
    else alert(`Bid placed: ${fmtShort(aav)} × ${years} yr`);
  };

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Free Agency</h2>
        <div style={S.sectionSub}>
          {fa.open ? `Window open · closes day ${fa.closesOn}` : 'Window closed — leftover bargains only'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Available Free Agents</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: 6, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
            />
            <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} style={{ padding: 6, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}>
              <option value="all">All positions</option>
              {['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ ...S.eyebrow, fontSize: 10 }}>Min OVR</span>
            <input
              type="number"
              value={minOVR}
              onChange={(e) => setMinOVR(parseInt(e.target.value, 10) || 0)}
              style={{ width: 60, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
            />
            <span style={{ ...S.byline, fontSize: 11 }}>{sortedListings.length} shown</span>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Pos</th>
                <th style={{ ...S.th, ...S.thNum }}>Age</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={{ ...S.th, ...S.thNum }}>Asking AAV</th>
                <th style={{ ...S.th, ...S.thNum }}>Yrs</th>
                <th style={{ ...S.th, ...S.thNum }}>Bids</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedListings.map(({ l, p }) => {
                const signed = !!l.signedBy;
                return (
                  <tr key={l.playerId} style={{ background: selected === l.playerId ? '#f8f2e4' : 'transparent', cursor: 'pointer', opacity: signed ? 0.6 : 1 }}
                      onClick={() => onSelect(l.playerId)}>
                    <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                    <td style={{ ...S.td, ...S.tdNum, fontWeight: 600 }}>{toScout(p.ratings.overall)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{fmtShort(l.asking)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{l.years}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{l.bids.length}</td>
                    <td style={S.td}>
                      {signed ? (
                        <span style={{ ...S.badge, ...S.badgeGreen }}>Signed → {FRANCHISES[l.signedBy!].abbr}</span>
                      ) : (
                        <span style={{ ...S.badge, ...S.badgeGold }}>Open</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Your Treasury</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              Cash: {fmtShort(fin.teamCash)}<br />
              Owner: {fmtShort(fin.ownerCash)}
            </div>
          </div>

          {selected && (() => {
            const listing = fa.listings.find((l) => l.playerId === selected);
            const p = state.players[selected];
            if (!listing || !p) return null;
            return (
              <div style={{ ...S.panel, marginTop: 12 }}>
                <div style={S.panelTitle}>Place Bid</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>{p.firstName} {p.lastName}</div>
                <div style={S.byline}>{p.pos} · Age {p.age} · OVR {toScout(p.ratings.overall)}</div>

                <div style={{ marginTop: 8 }}>
                  <div style={S.eyebrow}>AAV (per year)</div>
                  <input
                    type="number"
                    value={aav}
                    onChange={(e) => setAav(parseInt(e.target.value, 10) || 0)}
                    step={500_000}
                    style={{ width: '100%', padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={S.eyebrow}>Years</div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={years}
                    onChange={(e) => setYears(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
                  />
                </div>
                <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                  Total: {fmtShort(aav * years)}
                </div>
                <button onClick={submitBid} disabled={!fa.open} style={{ ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red, marginTop: 8, opacity: fa.open ? 1 : 0.5 }}>
                  Submit Bid
                </button>

                <div style={{ marginTop: 12 }}>
                  <div style={S.eyebrow}>Current Bids</div>
                  {listing.bids.length === 0 && <div style={S.byline}>No bids yet.</div>}
                  {listing.bids
                    .slice()
                    .sort((a, b) => b.aav - a.aav)
                    .map((b) => (
                      <div key={b.franchiseId + b.dayPlaced} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                        <span>{FRANCHISES[b.franchiseId].abbr}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                          {fmtShort(b.aav)} × {b.years}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
