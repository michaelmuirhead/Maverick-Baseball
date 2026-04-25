import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';

const CATEGORY_COLOR: Record<string, string> = {
  team: COLORS.ink,
  league: COLORS.gold,
  trade: COLORS.green,
  draft: '#1f3627',
  fa: COLORS.gold,
  injury: COLORS.red,
  milestone: COLORS.gold,
};

export function News() {
  const { state } = useGame();
  if (!state) return null;

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>The Wire</h2>
        <div style={S.sectionSub}>{state.news.length} entries · season {state.season}</div>
      </div>
      <div style={S.panel}>
        {state.news.map((n) => (
          <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...S.badge, background: CATEGORY_COLOR[n.category] || COLORS.ink, color: COLORS.paper, borderColor: 'transparent' }}>
                {n.category}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }}>
                Season {n.season} · Day {n.day}
              </span>
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginTop: 4 }}>{n.headline}</div>
            <div style={{ ...S.byline, fontSize: 13 }}>{n.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
