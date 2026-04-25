import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, ratingClass, toScout } from '../engine/format';
import { streakLabel } from '../engine/streaks';
import { RatingBar } from '../components/RatingBar';
import { PayrollBar } from '../components/PayrollBar';
import { RosterShortfallAlert } from '../components/RosterShortfallAlert';

export function Roster() {
  const { state, waivePlayerAction, setSelectedPlayerId } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const players = state.rosters[fid].map((id) => state.players[id]);

  const hitters = players.filter((p) => !p.isPitcher).sort((a, b) => b.ratings.overall - a.ratings.overall);
  const pitchers = players.filter((p) => p.isPitcher).sort((a, b) => b.ratings.overall - a.ratings.overall);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name} Roster</h2>
        <div style={S.sectionSub}>{players.length} players on the active roster</div>
      </div>

      <RosterShortfallAlert />

      <div style={{ marginBottom: 16 }}>
        <PayrollBar />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '2fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Position Players</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Pos</th>
                  <th style={S.th}>Name</th>
                  <th style={{ ...S.th, ...S.thNum }}>Age</th>
                  <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                  <th style={{ ...S.th, ...S.thNum }}>POT</th>
                  <th style={{ ...S.th, ...S.thNum }}>Salary</th>
                  <th style={{ ...S.th, ...S.thNum }}>Yrs</th>
                  <th style={S.th}>Streak</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hitters.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer', background: selected === p.id ? '#f8f2e4' : 'transparent' }} onClick={() => setSelected(p.id)}>
                    <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                    <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                    <td style={{ ...S.td, ...S.tdNum, color: ratingClass(p.ratings.overall), fontWeight: 600 }}>{toScout(p.ratings.overall)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.potential)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.contract ? fmtShort(p.contract.salary) : '-'}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.contract?.years ?? '-'}</td>
                    <td style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                      {streakLabel(p.streakMod)}
                    </td>
                    <td style={S.td}>
                      {p.health === 'healthy'
                        ? <span style={{ ...S.badge, ...S.badgeGreen }}>Active</span>
                        : <span style={{ ...S.badge, ...S.badgeRed }}>{p.health.toUpperCase()}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, ...S.panel }}>
            <div style={S.panelTitle}>Pitching Staff</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Pos</th>
                  <th style={S.th}>Name</th>
                  <th style={{ ...S.th, ...S.thNum }}>Age</th>
                  <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                  <th style={{ ...S.th, ...S.thNum }}>Velo</th>
                  <th style={{ ...S.th, ...S.thNum }}>Salary</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer', background: selected === p.id ? '#f8f2e4' : 'transparent' }} onClick={() => setSelected(p.id)}>
                    <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                    <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                    <td style={{ ...S.td, ...S.tdNum, color: ratingClass(p.ratings.overall), fontWeight: 600 }}>{toScout(p.ratings.overall)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.ratings.velo ?? '-'}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{p.contract ? fmtShort(p.contract.salary) : '-'}</td>
                    <td style={S.td}>
                      {p.health === 'healthy'
                        ? <span style={{ ...S.badge, ...S.badgeGreen }}>Active</span>
                        : <span style={{ ...S.badge, ...S.badgeRed }}>{p.health.toUpperCase()}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (() => {
          const p = state.players[selected];
          if (!p) return null;
          return (
            <div style={S.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={S.panelTitle}>Player Detail</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkDim }}>x</button>
              </div>
              <div
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, cursor: 'pointer', textDecoration: 'underline', color: COLORS.red }}
                onClick={() => setSelectedPlayerId(p.id)}
              >
                {p.firstName} {p.lastName}
              </div>
              <div style={S.byline}>{p.pos} - Age {p.age} - {p.nat}</div>
              <div style={{ marginTop: 12 }}>
                {p.isPitcher ? (
                  <>
                    <RatingBar label="Fastball" v={p.ratings.fastball} />
                    <RatingBar label="Breaking" v={p.ratings.breaking} />
                    <RatingBar label="Changeup" v={p.ratings.changeup} />
                    <RatingBar label="Command" v={p.ratings.command} />
                    <RatingBar label="Movement" v={p.ratings.movement} />
                    <RatingBar label="Stamina" v={p.ratings.stamina} />
                  </>
                ) : (
                  <>
                    <RatingBar label="Contact" v={p.ratings.contact} />
                    <RatingBar label="Power" v={p.ratings.power} />
                    <RatingBar label="Eye" v={p.ratings.eye} />
                    <RatingBar label="Speed" v={p.ratings.speed} />
                    <RatingBar label="Fielding" v={p.ratings.fielding} />
                    <RatingBar label="Arm" v={p.ratings.arm} />
                  </>
                )}
                <div style={{ borderTop: `1px solid ${COLORS.rule}`, marginTop: 8, paddingTop: 8 }}>
                  <RatingBar label="Overall" v={p.ratings.overall} />
                  <RatingBar label="Potential" v={p.potential} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    if (confirm(`Designate ${p.firstName} ${p.lastName} for assignment? Eats 50% of remaining contract.`)) {
                      const r = waivePlayerAction(p.id);
                      if (r.ok) setSelected(null);
                      else alert(r.reason);
                    }
                  }}
                  style={{ ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red, fontSize: 11 }}
                >
                  DFA
                </button>
              </div>
              {p.injury && (
                <div style={{ marginTop: 12 }}>
                  <div style={S.eyebrow}>Injury Status</div>
                  <div style={{ ...S.badge, ...S.badgeRed }}>{p.injury.severity.toUpperCase()}</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>{p.injury.type} - back day {p.injury.recoversOn}</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
