import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';

export function Standings() {
  const { state } = useGame();
  if (!state) return null;

  const groups: Record<string, string[]> = {};
  for (const fid of Object.keys(FRANCHISES)) {
    const f = FRANCHISES[fid];
    const k = `${f.lg} ${f.div}`;
    groups[k] = groups[k] || [];
    groups[k].push(fid);
  }
  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) => state.standings[b].wins - state.standings[a].wins);
  }

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Standings</h2>
        <div style={S.sectionSub}>{state.season} season · day {state.day}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {Object.entries(groups).map(([div, fids]) => {
          const leaderWins = state.standings[fids[0]].wins;
          return (
            <div key={div} style={S.panel}>
              <div style={S.panelTitle}>{div}</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Team</th>
                    <th style={{ ...S.th, ...S.thNum }}>W</th>
                    <th style={{ ...S.th, ...S.thNum }}>L</th>
                    <th style={{ ...S.th, ...S.thNum }}>PCT</th>
                    <th style={{ ...S.th, ...S.thNum }}>GB</th>
                    <th style={{ ...S.th, ...S.thNum }}>RD</th>
                    <th style={{ ...S.th, ...S.thNum }}>L10</th>
                    <th style={{ ...S.th, ...S.thNum }}>Strk</th>
                  </tr>
                </thead>
                <tbody>
                  {fids.map((fid) => {
                    const s = state.standings[fid];
                    const f = FRANCHISES[fid];
                    const games = s.wins + s.losses;
                    const pct = games > 0 ? (s.wins / games).toFixed(3).replace(/^0/, '') : '.000';
                    const gb = leaderWins - s.wins;
                    const wins10 = s.l10.filter((x) => x === 'W').length;
                    const isUser = fid === state.userFranchiseId;
                    return (
                      <tr key={fid} style={{ background: isUser ? '#f8f2e4' : 'transparent' }}>
                        <td style={{ ...S.td, fontWeight: isUser ? 600 : 400 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, background: f.color, marginRight: 6, verticalAlign: 'middle' }} />
                          {f.abbr} {f.name}
                        </td>
                        <td style={{ ...S.td, ...S.tdNum }}>{s.wins}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{s.losses}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{pct}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{gb === 0 ? '—' : gb}</td>
                        <td style={{ ...S.td, ...S.tdNum, color: s.rf - s.ra >= 0 ? COLORS.green : COLORS.red }}>
                          {s.rf - s.ra >= 0 ? '+' : ''}{s.rf - s.ra}
                        </td>
                        <td style={{ ...S.td, ...S.tdNum }}>{wins10}–{s.l10.length - wins10}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>
                          {s.streak === 0 ? '—' : `${s.streak > 0 ? 'W' : 'L'}${Math.abs(s.streak)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
