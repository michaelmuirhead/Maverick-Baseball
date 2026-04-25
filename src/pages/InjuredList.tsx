import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
import { injuredPlayers } from '../engine/injuries';

export function InjuredList() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const own = injuredPlayers(state, fid);

  // League-wide IL count
  const leagueWide: Record<string, { team: string; count: number; severe: number }> = {};
  for (const id of Object.keys(state.rosters)) {
    const inj = injuredPlayers(state, id);
    leagueWide[id] = {
      team: FRANCHISES[id].abbr,
      count: inj.length,
      severe: inj.filter((p) => p.injury?.severity === 'il_60').length,
    };
  }
  const leagueRows = Object.entries(leagueWide).filter(([, v]) => v.count > 0).sort((a, b) => b[1].count - a[1].count);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Injured List</h2>
        <div style={S.sectionSub}>{f.city} {f.name} · {own.length} on the IL</div>
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Your Injured Players</div>
        {own.length === 0 && <div style={S.byline}>No injuries to report. The training staff is doing its job.</div>}
        {own.length > 0 && (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Pos</th>
                <th style={{ ...S.th, ...S.thNum }}>Age</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={S.th}>Diagnosis</th>
                <th style={S.th}>Severity</th>
                <th style={{ ...S.th, ...S.thNum }}>Recovers Day</th>
                <th style={{ ...S.th, ...S.thNum }}>Days Out</th>
              </tr>
            </thead>
            <tbody>
              {own.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                  <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                  <td style={S.td}>{p.injury?.type || '—'}</td>
                  <td style={S.td}>
                    <span style={{
                      ...S.badge,
                      ...(p.injury?.severity === 'il_60' ? S.badgeRed
                        : p.injury?.severity === 'il_15' ? { background: COLORS.gold, color: COLORS.paper, borderColor: COLORS.gold }
                        : { background: COLORS.cream, color: COLORS.ink }),
                    }}>
                      {(p.injury?.severity || '—').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...S.td, ...S.tdNum }}>{p.injury?.recoversOn ?? '—'}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>
                    {p.injury ? Math.max(0, p.injury.recoversOn - state.day) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>League Injuries</div>
        {leagueRows.length === 0 && <div style={S.byline}>No injuries reported across the league.</div>}
        {leagueRows.length > 0 && (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Team</th>
                <th style={{ ...S.th, ...S.thNum }}>Total IL</th>
                <th style={{ ...S.th, ...S.thNum }}>60-Day</th>
              </tr>
            </thead>
            <tbody>
              {leagueRows.map(([fid, v]) => (
                <tr key={fid}>
                  <td style={S.td}>{v.team}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{v.count}</td>
                  <td style={{ ...S.td, ...S.tdNum, color: v.severe > 0 ? COLORS.red : COLORS.inkDim }}>{v.severe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
