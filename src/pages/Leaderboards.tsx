import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import type { Player } from '../engine/types';

type HCat = 'WAR' | 'OPS' | 'OPSplus' | 'AVG' | 'HR' | 'RBI' | 'SB' | 'wOBA' | 'OBP' | 'SLG';
type PCat = 'WAR' | 'ERA' | 'ERAplus' | 'FIP' | 'WHIP' | 'SO' | 'W' | 'SV' | 'IP' | 'K9';

const HITTER_CATS: { key: HCat; label: string; lower?: boolean }[] = [
  { key: 'WAR', label: 'WAR' },
  { key: 'OPSplus', label: 'OPS+' },
  { key: 'OPS', label: 'OPS' },
  { key: 'wOBA', label: 'wOBA' },
  { key: 'AVG', label: 'AVG' },
  { key: 'OBP', label: 'OBP' },
  { key: 'SLG', label: 'SLG' },
  { key: 'HR', label: 'HR' },
  { key: 'RBI', label: 'RBI' },
  { key: 'SB', label: 'SB' },
];

const PITCHER_CATS: { key: PCat; label: string; lower?: boolean }[] = [
  { key: 'WAR', label: 'WAR' },
  { key: 'ERA', label: 'ERA', lower: true },
  { key: 'ERAplus', label: 'ERA+' },
  { key: 'FIP', label: 'FIP', lower: true },
  { key: 'WHIP', label: 'WHIP', lower: true },
  { key: 'SO', label: 'SO' },
  { key: 'W', label: 'W' },
  { key: 'SV', label: 'SV' },
  { key: 'IP', label: 'IP' },
  { key: 'K9', label: 'K/9' },
];

export function Leaderboards() {
  const { state, setSelectedPlayerId } = useGame();
  const [tab, setTab] = useState<'hit' | 'pitch'>('hit');
  const [season, setSeason] = useState<number | 'career'>(0);

  if (!state) return null;

  const seasonsAvailable = useMemo(() => {
    const set = new Set<number>();
    for (const p of Object.values(state.players)) {
      for (const ss of p.statsHistory || []) set.add(ss.season);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [state.players]);

  const targetSeason = season || (seasonsAvailable[0] || state.season);

  function leaderboardForHitter(cat: HCat) {
    if (!state) return [];
    const rows: { player: Player; value: number }[] = [];
    for (const p of Object.values(state.players)) {
      if (p.isPitcher || p.retired) continue;
      const ss = p.statsHistory?.find((s) => s.season === targetSeason);
      if (!ss?.hitter) continue;
      if (ss.hitter.AB < 100 && ['AVG', 'OBP', 'SLG', 'OPS', 'OPSplus', 'wOBA'].includes(cat)) continue;
      const v = (ss.hitter as any)[cat];
      if (v === undefined || v === null) continue;
      rows.push({ player: p, value: v });
    }
    return rows.sort((a, b) => b.value - a.value).slice(0, 10);
  }

  function leaderboardForPitcher(cat: PCat) {
    if (!state) return [];
    const lower = PITCHER_CATS.find((c) => c.key === cat)?.lower;
    const rows: { player: Player; value: number }[] = [];
    for (const p of Object.values(state.players)) {
      if (!p.isPitcher || p.retired) continue;
      const ss = p.statsHistory?.find((s) => s.season === targetSeason);
      if (!ss?.pitcher) continue;
      if (ss.pitcher.IP < 30 && ['ERA', 'ERAplus', 'FIP', 'WHIP', 'K9'].includes(cat)) continue;
      const v = (ss.pitcher as any)[cat];
      if (v === undefined || v === null) continue;
      rows.push({ player: p, value: v });
    }
    return rows.sort((a, b) => lower ? a.value - b.value : b.value - a.value).slice(0, 10);
  }

  const cats = tab === 'hit' ? HITTER_CATS : PITCHER_CATS;
  const fmtVal = (v: number, key: string) => {
    if (['AVG', 'OBP', 'SLG', 'OPS', 'wOBA'].includes(key)) return v.toFixed(3);
    if (['ERA', 'FIP', 'WHIP', 'K9', 'WAR'].includes(key)) return v.toFixed(2);
    return Math.round(v).toString();
  };

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>League Leaderboards</h2>
        <div style={S.sectionSub}>Top 10 by category for season {targetSeason}</div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={S.radioBtn(tab === 'hit')} onClick={() => setTab('hit')}>Hitting</button>
          <button style={S.radioBtn(tab === 'pitch')} onClick={() => setTab('pitch')}>Pitching</button>
          <span style={S.eyebrow}>Season:</span>
          <select
            value={targetSeason}
            onChange={(e) => setSeason(Number(e.target.value))}
            style={{ padding: 4, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
          >
            {seasonsAvailable.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {cats.map((cat) => {
          const rows = tab === 'hit'
            ? leaderboardForHitter(cat.key as HCat)
            : leaderboardForPitcher(cat.key as PCat);
          return (
            <div key={cat.key} style={S.panel}>
              <div style={S.panelTitle}>{cat.label}</div>
              {rows.length === 0 ? (
                <div style={{ ...S.byline, marginTop: 8 }}>No qualifiers.</div>
              ) : (
                <table style={{ width: '100%', fontSize: 12, marginTop: 8 }}>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r.player.id}
                        style={{ cursor: 'pointer', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}
                        onClick={() => setSelectedPlayerId(r.player.id)}
                      >
                        <td style={{ padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 22 }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '4px 6px', fontFamily: "'IBM Plex Serif', serif" }}>
                          {r.player.firstName} {r.player.lastName}
                        </td>
                        <td style={{ padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }}>
                          {r.player.franchiseId ? FRANCHISES[r.player.franchiseId]?.abbr : '—'}
                        </td>
                        <td style={{ padding: '4px 6px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, textAlign: 'right' }}>
                          {fmtVal(r.value, cat.key)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
