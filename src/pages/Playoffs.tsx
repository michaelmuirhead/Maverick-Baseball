import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import type { Series } from '../engine/types';

export function Playoffs() {
  const { state } = useGame();
  if (!state) return null;

  if (!state.bracket) {
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Playoffs</h2>
          <div style={S.sectionSub}>The bracket sets at season's end.</div>
        </div>
        <div style={S.panel}>
          <p style={S.byline}>No active bracket. Sim to the end of the regular season to seed the postseason field.</p>
        </div>
      </div>
    );
  }

  const b = state.bracket;
  const grouping = [
    { lg: 'AL', wcs: ['wc_AL_1', 'wc_AL_2'], dss: ['ds_AL_1', 'ds_AL_2'], lcs: 'lcs_AL' },
    { lg: 'NL', wcs: ['wc_NL_1', 'wc_NL_2'], dss: ['ds_NL_1', 'ds_NL_2'], lcs: 'lcs_NL' },
  ] as const;

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Postseason {state.season}</h2>
        <div style={S.sectionSub}>
          {b.champion
            ? `Champion: ${FRANCHISES[b.champion].city} ${FRANCHISES[b.champion].name}`
            : `Round: ${b.currentRound.replace('_', ' ').toUpperCase()}`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {grouping.map(({ lg, wcs, dss, lcs }) => (
          <div key={lg} style={S.panel}>
            <div style={S.panelTitle}>{lg} Bracket</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div style={S.eyebrow}>Wild Card</div>
                {wcs.map((id) => <SeriesCard key={id} series={b.series[id]} userFid={state.userFranchiseId} />)}
              </div>
              <div>
                <div style={S.eyebrow}>DS</div>
                {dss.map((id) => <SeriesCard key={id} series={b.series[id]} userFid={state.userFranchiseId} />)}
              </div>
              <div>
                <div style={S.eyebrow}>LCS</div>
                <SeriesCard series={b.series[lcs]} userFid={state.userFranchiseId} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, ...S.panel }}>
        <div style={S.panelTitle}>World Series</div>
        <SeriesCard series={b.series.ws} userFid={state.userFranchiseId} />
      </div>
    </div>
  );
}

function SeriesCard({ series, userFid }: { series: Series | undefined; userFid: string }) {
  if (!series) return null;
  if (!series.higherSeed) {
    return (
      <div style={{ ...S.panel, padding: 8, marginTop: 6, opacity: 0.5 }}>
        <div style={S.byline}>TBD</div>
      </div>
    );
  }
  const higher = series.higherSeed!;
  const lower = series.lowerSeed;
  const homeStr = (id: string) => {
    const f = FRANCHISES[id];
    const isUser = id === userFid;
    return (
      <span style={{ fontWeight: isUser ? 700 : 400 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, background: f.color, marginRight: 4 }} />
        ({(higher.id === id || lower?.id === id) ? (higher.id === id ? higher.seed : lower?.seed) : ''}) {f.abbr}
      </span>
    );
  };

  const completed = series.status === 'complete';
  const winner = series.winner;

  return (
    <div style={{ ...S.panel, padding: 8, marginTop: 6, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {homeStr(higher.id)}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: completed && winner === higher.id ? COLORS.green : COLORS.inkDim }}>
          {series.higherWins}
        </span>
      </div>
      {lower && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          {homeStr(lower.id)}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: completed && winner === lower.id ? COLORS.green : COLORS.inkDim }}>
            {series.lowerWins}
          </span>
        </div>
      )}
      <div style={{ ...S.eyebrow, fontSize: 9, marginTop: 4 }}>
        {series.status === 'pending' ? 'Awaiting' : completed ? 'Final' : `Best of ${series.gamesNeeded * 2 - 1}`}
      </div>
    </div>
  );
}
