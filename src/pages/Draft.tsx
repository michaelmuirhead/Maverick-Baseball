import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout, fmtShort } from '../engine/format';

export function Draft() {
  const { state, draftPick, draftAutoPickUntilUser, draftAutoComplete, advanceTo } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  if (!state) return null;

  if (!state.draft) {
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Amateur Draft</h2>
          <div style={S.sectionSub}>Draft begins each offseason on Day -45.</div>
        </div>
        <div style={S.panel}>
          <p style={S.byline}>Not draft season. Sim forward to bring up the next class.</p>
          <button onClick={() => advanceTo('draft_day')} style={S.radioBtn(true)}>Skip to Draft Day</button>
        </div>
      </div>
    );
  }

  const d = state.draft;
  const onClock = d.complete ? null : d.picks[d.currentPickIndex];
  const userOnClock = onClock?.franchiseId === state.userFranchiseId;
  const userPicks = d.picks.filter((p) => p.franchiseId === state.userFranchiseId);
  const recent = d.picks.filter((p) => p.signed).slice(-12).reverse();

  const sortedPool = [...d.pool]
    .map((id) => state.players[id])
    .filter(Boolean)
    .sort((a, b) => b.potential - a.potential);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Amateur Draft {d.year}</h2>
        <div style={S.sectionSub}>
          {d.complete ? 'Draft complete' : `Pick ${onClock?.overall} of ${d.picks.length} · Round ${onClock?.round} · ${FRANCHISES[onClock!.franchiseId].abbr} on the clock`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div style={{ ...S.panel, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={S.panelTitle}>Available Prospects</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!d.complete && !userOnClock && (
                  <button onClick={draftAutoPickUntilUser} style={S.radioBtn(false)}>Auto-pick to me</button>
                )}
                {!d.complete && (
                  <button onClick={draftAutoComplete} style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold }}>Auto-complete draft</button>
                )}
              </div>
            </div>

            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Pos</th>
                  <th style={S.th}>Name</th>
                  <th style={{ ...S.th, ...S.thNum }}>Age</th>
                  <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                  <th style={{ ...S.th, ...S.thNum }}>POT</th>
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedPool.slice(0, 60).map((p) => (
                  <tr key={p.id} style={{ background: selected === p.id ? '#f8f2e4' : 'transparent', cursor: 'pointer' }} onClick={() => setSelected(p.id)}>
                    <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                    <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                    <td style={{ ...S.td, ...S.tdNum, fontWeight: 600 }}>{toScout(p.potential)}</td>
                    <td style={S.td}>
                      {userOnClock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); draftPick(p.id); setSelected(null); }}
                          style={{ ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red, padding: '4px 10px' }}
                        >
                          Draft
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Your Picks</div>
            <table style={{ ...S.table, fontSize: 12 }}>
              <thead>
                <tr><th style={S.th}>Rd</th><th style={S.th}>Ovr</th><th style={S.th}>Player</th></tr>
              </thead>
              <tbody>
                {userPicks.map((pk) => (
                  <tr key={pk.overall}>
                    <td style={S.td}>{pk.round}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{pk.overall}</td>
                    <td style={S.td}>
                      {pk.playerId ? `${state.players[pk.playerId].firstName} ${state.players[pk.playerId].lastName}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ ...S.panel, marginTop: 12 }}>
            <div style={S.panelTitle}>Recent Picks</div>
            <table style={{ ...S.table, fontSize: 12 }}>
              <tbody>
                {recent.map((pk) => (
                  <tr key={pk.overall}>
                    <td style={S.td}>{pk.overall}</td>
                    <td style={S.td}>{FRANCHISES[pk.franchiseId].abbr}</td>
                    <td style={S.td}>
                      {pk.playerId ? `${state.players[pk.playerId].firstName} ${state.players[pk.playerId].lastName}` : ''}
                    </td>
                    <td style={{ ...S.td, ...S.tdNum }}>{fmtShort(pk.bonusPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (() => {
            const p = state.players[selected];
            if (!p) return null;
            return (
              <div style={{ ...S.panel, marginTop: 12 }}>
                <div style={S.panelTitle}>Prospect Detail</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>{p.firstName} {p.lastName}</div>
                <div style={S.byline}>{p.pos} · Age {p.age} · {p.nat}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginTop: 8 }}>
                  Current: {toScout(p.ratings.overall)} OVR<br />
                  Potential: {toScout(p.potential)} OVR
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
