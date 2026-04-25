import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';

const CATEGORY_COLOR: Record<string, string> = {
  team: COLORS.ink,
  league: COLORS.gold,
  trade: COLORS.green,
  draft: '#1f3627',
  fa: COLORS.gold,
  injury: COLORS.red,
  milestone: COLORS.gold,
};

type Scope = 'world' | 'league' | 'team';

export function News() {
  const { state } = useGame();
  const [scope, setScope] = useState<Scope>('world');
  const [season, setSeason] = useState<number | 'all'>('all');
  const [category, setCategory] = useState<string>('all');

  if (!state) return null;
  const fid = state.userFranchiseId;
  const userTeam = FRANCHISES[fid];

  const teamAbbr = userTeam.abbr;
  const teamCity = userTeam.city;
  const teamName = userTeam.name;

  function involvesUser(n: NonNullable<typeof state>["news"][0]): boolean {
    if (n.involves?.includes(fid)) return true;
    const text = `${n.headline} ${n.body}`;
    return text.includes(teamAbbr) || text.includes(teamCity) || text.includes(teamName);
  }

  const filtered = useMemo(() => {
    return state.news.filter((n) => {
      if (scope === 'team' && !involvesUser(n)) return false;
      if (scope === 'league' && n.category === 'team' && !involvesUser(n)) return false;
      if (season !== 'all' && n.season !== season) return false;
      if (category !== 'all' && n.category !== category) return false;
      return true;
    });
  }, [state.news, scope, season, category, fid]);

  const seasons = Array.from(new Set(state.news.map((n) => n.season))).sort((a, b) => b - a);

  const scopeLabels: Record<Scope, string> = {
    world: 'World',
    league: 'League-wide',
    team: 'Your team',
  };

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>The Wire</h2>
        <div style={S.sectionSub}>{filtered.length} of {state.news.length} entries</div>
      </div>

      <div style={{ ...S.panel, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={S.eyebrow}>Scope:</span>
          {(['world', 'league', 'team'] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                ...S.radioBtn(scope === s),
                fontSize: 11,
                background: scope === s ? COLORS.ink : 'transparent',
                color: scope === s ? COLORS.cream : COLORS.ink,
              }}
            >
              {scopeLabels[s]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={S.eyebrow}>Season:</span>
          <select
            value={season === 'all' ? 'all' : String(season)}
            onChange={(e) => setSeason(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            style={{ padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
          >
            <option value="all">All seasons</option>
            {seasons.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={S.eyebrow}>Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
          >
            <option value="all">All</option>
            <option value="team">Team</option>
            <option value="league">League</option>
            <option value="trade">Trade</option>
            <option value="draft">Draft</option>
            <option value="fa">Free Agent</option>
            <option value="injury">Injury</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>
      </div>

      <div style={S.panel}>
        {filtered.length === 0 ? (
          <div style={{ color: COLORS.inkDim, fontStyle: 'italic', padding: 12 }}>
            No news matches the selected filters.
          </div>
        ) : (
          filtered.map((n) => (
            <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.badge, background: CATEGORY_COLOR[n.category] || COLORS.ink, color: COLORS.paper, borderColor: 'transparent' }}>
                  {n.category}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }}>
                  Season {n.season} - Day {n.day}
                </span>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginTop: 4 }}>{n.headline}</div>
              <div style={{ ...S.byline, fontSize: 13 }}>{n.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
