import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, ratingClass, toScout } from '../engine/format';
import { RatingBar } from '../components/RatingBar';
import { streakLabel } from '../engine/streaks';

const AWARD_LABEL: Record<string, string> = {
  mvp: 'MVP', cy_young: 'Cy Young', rookie: 'Rookie of the Year',
  gold_glove: 'Gold Glove', silver_slugger: 'Silver Slugger',
};

export function PlayerCareer() {
  const { state, selectedPlayerId, setSelectedPlayerId, setPage } = useGame();
  if (!state) return null;
  const p = selectedPlayerId ? state.players[selectedPlayerId] : null;

  if (!p) {
    // Choose-a-player view
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

  // Group awards by type
  const awardCounts: Record<string, number> = {};
  for (const a of awards) awardCounts[a.type] = (awardCounts[a.type] || 0) + 1;

  return (
    <div>
      <div style={S.sectionRule}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={S.sectionHead}>{p.firstName} {p.lastName}</h2>
            <div style={S.sectionSub}>
              {p.pos} · Age {p.age} · {p.nat} ·{' '}
              {p.retired ? `Retired ${p.retiredOn}` : team ? `${team.city} ${team.name}` : 'Free Agent'}
              {p.hallOfFame && <> · <span style={{ color: COLORS.gold, fontWeight: 600 }}>HALL OF FAME ({p.hallOfFame.inducted})</span></>}
            </div>
          </div>
          <button onClick={() => { setSelectedPlayerId(null); setPage('roster'); }} style={S.radioBtn(false)}>← Back</button>
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
                    <tr><td style={{ color: COLORS.inkDim }}>Drafted</td><td>{p.draftYear} · Round {p.draftRound} · Pick {p.draftPick}</td></tr>
                    {p.draftedBy && <tr><td style={{ color: COLORS.inkDim }}>By</td><td>{FRANCHISES[p.draftedBy]?.abbr ?? '?'}</td></tr>}
                  </>
                )}
                {p.contract && (
                  <>
                    <tr><td style={{ color: COLORS.inkDim }}>Contract</td><td>{fmtShort(p.contract.salary)} × {p.contract.years}</td></tr>
                    <tr><td style={{ color: COLORS.inkDim }}>Status</td><td>{p.contract.status}{p.contract.ntc ? ' · NTC' : ''}</td></tr>
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
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>×{count}</span>
              </div>
            ))}
            {allAwardsSorted.length > 0 && (
              <div style={{ marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }}>
                {allAwardsSorted.map((a) => `${a.season} ${a.league} ${AWARD_LABEL[a.type] || a.type}`).join(' · ')}
              </div>
            )}
          </div>

          {p.injury && (
            <div style={{ ...S.panel, marginTop: 12 }}>
              <div style={S.panelTitle}>Current Injury</div>
              <div style={{ ...S.badge, ...S.badgeRed }}>{p.injury.severity.toUpperCase()}</div>
              <div style={{ marginTop: 6 }}>{p.injury.type} — recovers day {p.injury.recoversOn}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
