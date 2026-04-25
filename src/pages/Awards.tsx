import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
import { hofScore } from '../engine/awards';
import type { AwardType, League } from '../engine/types';

const AWARD_LABEL: Record<AwardType, string> = {
  mvp: 'MVP',
  cy_young: 'Cy Young',
  rookie: 'Rookie of the Year',
  gold_glove: 'Gold Glove',
  silver_slugger: 'Silver Slugger',
  mgr_of_year: 'Manager of the Year',
};

export function Awards() {
  const { state } = useGame();
  const [tab, setTab] = useState<'season' | 'hof'>('season');

  if (!state) return null;

  const seasons = Object.keys(state.awardsBySeason || {})
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Awards & Honors</h2>
        <div style={S.sectionSub}>
          {seasons.length} seasons recorded · {Object.values(state.players).filter((p) => p.hallOfFame).length} Hall of Famers
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={S.radioBtn(tab === 'season')} onClick={() => setTab('season')}>Season Awards</button>
        <button style={S.radioBtn(tab === 'hof')} onClick={() => setTab('hof')}>Hall of Fame</button>
      </div>

      {tab === 'season' && <SeasonAwards />}
      {tab === 'hof' && <HallOfFame />}
    </div>
  );
}

function SeasonAwards() {
  const { state } = useGame();
  if (!state || !state.awardsBySeason) return null;
  const seasons = Object.keys(state.awardsBySeason).map(Number).sort((a, b) => b - a);

  if (seasons.length === 0) {
    return <div style={S.panel}><div style={S.byline}>No awards yet — sim a season to crown winners.</div></div>;
  }

  return (
    <div>
      {seasons.map((yr) => {
        const list = state.awardsBySeason![yr] || [];
        const byType: Record<string, typeof list> = {};
        for (const a of list) {
          const k = a.type;
          byType[k] = byType[k] || [];
          byType[k].push(a);
        }
        return (
          <div key={yr} style={{ ...S.panel, marginBottom: 16 }}>
            <div style={S.panelTitle}>Season {yr}</div>

            {/* Marquee awards: MVP, Cy Young, Rookie */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              {(['mvp', 'cy_young', 'rookie'] as AwardType[]).map((t) => (
                <div key={t} style={{ ...S.stat }}>
                  <div style={S.statLabel}>{AWARD_LABEL[t]}</div>
                  {(byType[t] || []).map((a) => {
                    const p = state.players[a.playerId];
                    if (!p) return null;
                    return (
                      <div key={a.league} style={{ marginTop: 4 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim, marginRight: 6 }}>{a.league}</span>
                        <span style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 500 }}>{p.firstName} {p.lastName}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, marginLeft: 6 }}>OVR {toScout(p.ratings.overall)}</span>
                      </div>
                    );
                  })}
                  {!byType[t] && <div style={S.byline}>—</div>}
                </div>
              ))}
            </div>

            {/* Gold Gloves */}
            {byType.gold_glove && byType.gold_glove.length > 0 && (
              <div>
                <div style={S.eyebrow}>Gold Gloves</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 6 }}>
                  {byType.gold_glove.map((a) => {
                    const p = state.players[a.playerId];
                    if (!p) return null;
                    return (
                      <div key={a.league + p.id} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                        {a.league} · {p.pos} · {p.firstName} {p.lastName}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HallOfFame() {
  const { state } = useGame();
  if (!state) return null;
  const inductees = Object.values(state.players)
    .filter((p) => p.hallOfFame)
    .sort((a, b) => (b.hallOfFame?.inducted ?? 0) - (a.hallOfFame?.inducted ?? 0));

  if (inductees.length === 0) {
    return (
      <div style={S.panel}>
        <div style={S.byline}>The Hall is empty. Inductions begin 5 seasons after a great career retires.</div>
      </div>
    );
  }

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Hall of Fame · {inductees.length} inductees</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Year</th>
            <th style={S.th}>Player</th>
            <th style={S.th}>Pos</th>
            <th style={{ ...S.th, ...S.thNum }}>Career-High OVR</th>
            <th style={{ ...S.th, ...S.thNum }}>MVP</th>
            <th style={{ ...S.th, ...S.thNum }}>Cy Young</th>
            <th style={{ ...S.th, ...S.thNum }}>Gold Gloves</th>
            <th style={{ ...S.th, ...S.thNum }}>HoF Score</th>
          </tr>
        </thead>
        <tbody>
          {inductees.map((p) => {
            const mvps = (p.awards || []).filter((a) => a.type === 'mvp').length;
            const cys = (p.awards || []).filter((a) => a.type === 'cy_young').length;
            const ggs = (p.awards || []).filter((a) => a.type === 'gold_glove').length;
            return (
              <tr key={p.id}>
                <td style={S.td}>{p.hallOfFame?.inducted}</td>
                <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.careerHigh ?? p.ratings.overall)}</td>
                <td style={{ ...S.td, ...S.tdNum }}>{mvps}</td>
                <td style={{ ...S.td, ...S.tdNum }}>{cys}</td>
                <td style={{ ...S.td, ...S.tdNum }}>{ggs}</td>
                <td style={{ ...S.td, ...S.tdNum, fontWeight: 600 }}>{Math.round(hofScore(p))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
