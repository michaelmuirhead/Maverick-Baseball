import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, ratingClass, toScout } from '../engine/format';
import { RatingBar } from '../components/RatingBar';
import { streakLabel } from '../engine/streaks';
import { careerHitterTotals, careerPitcherTotals } from '../engine/stats';

const AWARD_LABEL: Record<string, string> = {
  mvp: 'MVP', cy_young: 'Cy Young', rookie: 'Rookie of the Year',
  gold_glove: 'Gold Glove', silver_slugger: 'Silver Slugger',
};

export function PlayerCareer() {
  const { state, selectedPlayerId, setSelectedPlayerId, setPage } = useGame();
  if (!state) return null;
  const p = selectedPlayerId ? state.players[selectedPlayerId] : null;

  if (!p) {
    const playersWithOVR = Object.values(state.players)
      .filter((x) => !x.retired)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .slice(0, 50);
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Player Files</h2>
          <div style={S.sectionSub}>Click a player from a roster to view full career history</div>
        </div>
        <div style={S.panel}>
          <div style={S.panelTitle}>Top 50 active players</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Pos</th>
                <th style={{ ...S.th, ...S.thNum }}>Age</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={S.th}>Team</th>
              </tr>
            </thead>
            <tbody>
              {playersWithOVR.map((pl) => (
                <tr key={pl.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPlayerId(pl.id)}>
                  <td style={{ ...S.td, ...S.tdName, color: COLORS.red, textDecoration: 'underline' }}>
                    {pl.firstName} {pl.lastName}
                  </td>
                  <td style={{ ...S.td, ...S.tdPos }}>{pl.pos}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{pl.age}</td>
                  <td style={{ ...S.td, ...S.tdNum, color: ratingClass(pl.ratings.overall) }}>{toScout(pl.ratings.overall)}</td>
                  <td style={S.td}>{pl.franchiseId ? FRANCHISES[pl.franchiseId]?.abbr : 'FA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const team = p.franchiseId ? FRANCHISES[p.franchiseId] : null;
  const awards = p.awards || [];
  const allAwardsSorted = [...awards].sort((a, b) => a.season - b.season);

  const awardCounts: Record<string, number> = {};
  for (const a of awards) awardCounts[a.type] = (awardCounts[a.type] || 0) + 1;

  return (
    <div>
      <div style={S.sectionRule}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={S.sectionHead}>{p.firstName} {p.lastName}</h2>
            <div style={S.sectionSub}>
              {p.pos} - Age {p.age} - {p.nat} -{' '}
              {p.retired ? `Retired ${p.retiredOn}` : team ? `${team.city} ${team.name}` : 'Free Agent'}
              {p.hallOfFame && <> - <span style={{ color: COLORS.gold, fontWeight: 600 }}>HALL OF FAME ({p.hallOfFame.inducted})</span></>}
            </div>
          </div>
          <button onClick={() => { setSelectedPlayerId(null); setPage('roster'); }} style={S.radioBtn(false)}>Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Ratings</div>
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
            <RatingBar label="Career-High" v={p.careerHigh ?? p.ratings.overall} />
          </div>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Profile</div>
            <table style={{ width: '100%', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
              <tbody>
                <tr><td style={{ color: COLORS.inkDim }}>Tier</td><td>{p.tier.toUpperCase()}</td></tr>
                <tr><td style={{ color: COLORS.inkDim }}>Health</td><td>{p.health.toUpperCase()}</td></tr>
                <tr><td style={{ color: COLORS.inkDim }}>Streak</td><td>{streakLabel(p.streakMod)} ({p.streakMod ?? 0})</td></tr>
                {p.draftYear && (
                  <>
                    <tr><td style={{ color: COLORS.inkDim }}>Drafted</td><td>{p.draftYear} - Round {p.draftRound} - Pick {p.draftPick}</td></tr>
                    {p.draftedBy && <tr><td style={{ color: COLORS.inkDim }}>By</td><td>{FRANCHISES[p.draftedBy]?.abbr ?? '?'}</td></tr>}
                  </>
                )}
                {p.contract && (
                  <>
                    <tr><td style={{ color: COLORS.inkDim }}>Contract</td><td>{fmtShort(p.contract.salary)} x {p.contract.years}</td></tr>
                    <tr><td style={{ color: COLORS.inkDim }}>Status</td><td>{p.contract.status}{p.contract.ntc ? ' - NTC' : ''}</td></tr>
                    <tr><td style={{ color: COLORS.inkDim }}>Service</td><td>{(p.contract.serviceDays / 172).toFixed(1)} yrs</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ ...S.panel, marginTop: 12 }}>
            <div style={S.panelTitle}>Awards & Honors</div>
            {awards.length === 0 && <div style={S.byline}>No awards yet.</div>}
            {Object.entries(awardCounts).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ fontFamily: "'IBM Plex Serif', serif" }}>{AWARD_LABEL[type] || type}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>x{count}</span>
              </div>
            ))}
            {allAwardsSorted.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }}>
                {allAwardsSorted.map((a) => `${a.season} ${a.league} ${AWARD_LABEL[a.type] || a.type}`).join(' - ')}
              </div>
            )}
          </div>

          {p.injury && (
            <div style={{ ...S.panel, marginTop: 12 }}>
              <div style={S.panelTitle}>Current Injury</div>
              <div style={{ ...S.badge, ...S.badgeRed }}>{p.injury.severity.toUpperCase()}</div>
              <div style={{ marginTop: 6 }}>{p.injury.type} - recovers day {p.injury.recoversOn}</div>
            </div>
          )}
        </div>
      </div>

      <PlayerStatsTable player={p} />
    </div>
  );
}

function PlayerStatsTable({ player }: { player: any }) {
  const stats = (player.statsHistory || []).slice().sort((a: any, b: any) => a.season - b.season);
  if (stats.length === 0) {
    return (
      <div style={{ ...S.panel, marginTop: 16 }}>
        <div style={S.panelTitle}>Career Stats</div>
        <div style={S.byline}>No stat lines yet - finish a season to populate.</div>
      </div>
    );
  }

  if (player.isPitcher) {
    const career = careerPitcherTotals(player);
    return (
      <div style={{ ...S.panel, marginTop: 16 }}>
        <div style={S.panelTitle}>Career Stats - Pitching</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.ink}` }}>
                <th style={statTh}>Year</th><th style={statTh}>Team</th>
                <th style={statTh}>G</th><th style={statTh}>GS</th>
                <th style={statTh}>W</th><th style={statTh}>L</th><th style={statTh}>SV</th>
                <th style={statTh}>IP</th><th style={statTh}>H</th><th style={statTh}>ER</th>
                <th style={statTh}>BB</th><th style={statTh}>SO</th><th style={statTh}>HR</th>
                <th style={statTh}>ERA</th><th style={statTh}>WHIP</th>
              </tr>
            </thead>
            <tbody>
              {stats.filter((s: any) => s.pitcher).map((s: any) => {
                const tag = FRANCHISES[s.franchiseId]?.abbr || s.franchiseId;
                return (
                  <tr key={s.season} style={{ borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                    <td style={statTd}>{s.season}</td>
                    <td style={statTd}>{tag}</td>
                    <td style={statTd}>{s.pitcher.G}</td>
                    <td style={statTd}>{s.pitcher.GS}</td>
                    <td style={statTd}>{s.pitcher.W}</td>
                    <td style={statTd}>{s.pitcher.L}</td>
                    <td style={statTd}>{s.pitcher.SV}</td>
                    <td style={statTd}>{s.pitcher.IP}</td>
                    <td style={statTd}>{s.pitcher.H}</td>
                    <td style={statTd}>{s.pitcher.ER}</td>
                    <td style={statTd}>{s.pitcher.BB}</td>
                    <td style={statTd}>{s.pitcher.SO}</td>
                    <td style={statTd}>{s.pitcher.HR}</td>
                    <td style={statTd}>{s.pitcher.ERA.toFixed(2)}</td>
                    <td style={statTd}>{s.pitcher.WHIP.toFixed(2)}</td>
                  </tr>
                );
              })}
              {career && (
                <tr style={{ borderTop: `2px solid ${COLORS.ink}`, fontWeight: 700 }}>
                  <td style={statTd} colSpan={2}>CAREER</td>
                  <td style={statTd}>{career.G}</td><td style={statTd}>{career.GS}</td>
                  <td style={statTd}>{career.W}</td><td style={statTd}>{career.L}</td>
                  <td style={statTd}>{career.SV}</td><td style={statTd}>{career.IP}</td>
                  <td style={statTd}>{career.H}</td><td style={statTd}>{career.ER}</td>
                  <td style={statTd}>{career.BB}</td><td style={statTd}>{career.SO}</td>
                  <td style={statTd}>{career.HR}</td>
                  <td style={statTd}>{career.ERA.toFixed(2)}</td>
                  <td style={statTd}>{career.WHIP.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const career = careerHitterTotals(player);
  return (
    <div style={{ ...S.panel, marginTop: 16 }}>
      <div style={S.panelTitle}>Career Stats - Hitting</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.ink}` }}>
              <th style={statTh}>Year</th><th style={statTh}>Team</th>
              <th style={statTh}>G</th><th style={statTh}>AB</th>
              <th style={statTh}>R</th><th style={statTh}>H</th>
              <th style={statTh}>2B</th><th style={statTh}>3B</th>
              <th style={statTh}>HR</th><th style={statTh}>RBI</th>
              <th style={statTh}>BB</th><th style={statTh}>SO</th><th style={statTh}>SB</th>
              <th style={statTh}>AVG</th><th style={statTh}>OBP</th>
              <th style={statTh}>SLG</th><th style={statTh}>OPS</th>
            </tr>
          </thead>
          <tbody>
            {stats.filter((s: any) => s.hitter).map((s: any) => {
              const tag = FRANCHISES[s.franchiseId]?.abbr || s.franchiseId;
              return (
                <tr key={s.season} style={{ borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                  <td style={statTd}>{s.season}</td>
                  <td style={statTd}>{tag}</td>
                  <td style={statTd}>{s.hitter.G}</td>
                  <td style={statTd}>{s.hitter.AB}</td>
                  <td style={statTd}>{s.hitter.R}</td>
                  <td style={statTd}>{s.hitter.H}</td>
                  <td style={statTd}>{s.hitter.D}</td>
                  <td style={statTd}>{s.hitter.T}</td>
                  <td style={statTd}>{s.hitter.HR}</td>
                  <td style={statTd}>{s.hitter.RBI}</td>
                  <td style={statTd}>{s.hitter.BB}</td>
                  <td style={statTd}>{s.hitter.SO}</td>
                  <td style={statTd}>{s.hitter.SB}</td>
                  <td style={statTd}>{s.hitter.AVG.toFixed(3)}</td>
                  <td style={statTd}>{s.hitter.OBP.toFixed(3)}</td>
                  <td style={statTd}>{s.hitter.SLG.toFixed(3)}</td>
                  <td style={statTd}>{s.hitter.OPS.toFixed(3)}</td>
                </tr>
              );
            })}
            {career && (
              <tr style={{ borderTop: `2px solid ${COLORS.ink}`, fontWeight: 700 }}>
                <td style={statTd} colSpan={2}>CAREER</td>
                <td style={statTd}>{career.G}</td><td style={statTd}>{career.AB}</td>
                <td style={statTd}>{career.R}</td><td style={statTd}>{career.H}</td>
                <td style={statTd}>{career.D}</td><td style={statTd}>{career.T}</td>
                <td style={statTd}>{career.HR}</td><td style={statTd}>{career.RBI}</td>
                <td style={statTd}>{career.BB}</td><td style={statTd}>{career.SO}</td>
                <td style={statTd}>{career.SB}</td>
                <td style={statTd}>{career.AVG.toFixed(3)}</td>
                <td style={statTd}>{career.OBP.toFixed(3)}</td>
                <td style={statTd}>{career.SLG.toFixed(3)}</td>
                <td style={statTd}>{career.OPS.toFixed(3)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const statTh: React.CSSProperties = {
  textAlign: 'right', padding: '4px 6px', fontSize: 10,
  textTransform: 'uppercase', letterSpacing: 0.4, color: COLORS.inkDim,
};

const statTd: React.CSSProperties = {
  textAlign: 'right', padding: '4px 6px',
};
