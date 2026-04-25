import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';

export function Schedule() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const games = state.schedule.filter((g) => g.home === fid || g.away === fid);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Schedule</h2>
        <div style={S.sectionSub}>{games.length} games · {games.filter((g) => g.played).length} played</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
        {games.map((g) => {
          const home = g.home === fid;
          const oppFid = home ? g.away : g.home;
          const opp = FRANCHISES[oppFid];
          let status = `Day ${g.day}`;
          let bg = COLORS.panel;
          if (g.played && g.result) {
            const us = home ? g.result.homeScore : g.result.awayScore;
            const them = home ? g.result.awayScore : g.result.homeScore;
            const win = us > them;
            status = `${win ? 'W' : 'L'} ${us}–${them}`;
            bg = win ? '#dde7e0' : '#ecd9d9';
          }
          return (
            <div key={g.id} style={{ ...S.panel, padding: 8, fontSize: 12, background: bg }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }}>
                {home ? 'vs' : '@'} {opp.abbr}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, marginTop: 2, fontWeight: 600 }}>
                {status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
