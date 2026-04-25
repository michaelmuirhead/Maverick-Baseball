import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { Stat, grid } from '../components/Stat';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel } from '../engine/format';
import { teamStrength } from '../engine/sim';
import { tradeWindowLabel } from '../engine/trades';

export function Dashboard() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const standing = state.standings[fid];
  const fin = state.finances[fid];
  const games = standing.wins + standing.losses;
  const winPct = games > 0 ? (standing.wins / games).toFixed(3) : '.000';
  const strength = Math.round(teamStrength(state, fid));
  const payroll = state.rosters[fid].reduce(
    (s, pid) => s + (state.players[pid].contract?.salary || 0),
    0,
  );

  const recent = state.schedule
    .filter((g) => g.played && (g.home === fid || g.away === fid))
    .slice(-5)
    .reverse();
  const upcoming = state.schedule
    .filter((g) => !g.played && (g.home === fid || g.away === fid))
    .slice(0, 5);

  const headlines = state.news.slice(0, 5);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name}</h2>
        <div style={S.sectionSub}>{phaseLabel(state.phase, state)} · {tradeWindowLabel(state)}</div>
      </div>

      <VacancyBanner />
      <ObjectivesWidget />

      <div style={{ ...grid('repeat(4, 1fr)'), marginBottom: 20 }}>
        <Stat label="Record" value={`${standing.wins}–${standing.losses}`} delta={winPct} />
        <Stat label="Team Strength" value={strength} delta={`OVR (top 8 hitters + 5 SP + 4 RP)`} />
        <Stat label="Payroll" value={fmtShort(payroll)} delta={`${state.rosters[fid].length} players`} />
        <Stat label="Cash on Hand" value={fmtShort(fin.teamCash)} delta={`Owner: ${fmtShort(fin.ownerCash)}`} warn={fin.teamCash < 0} />
      </div>

      <div style={{ ...grid('1fr 1fr'), marginBottom: 20 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Recent Games</div>
          {recent.length === 0 && <div style={S.byline}>No games played yet.</div>}
          {recent.map((g) => {
            const home = g.home === fid;
            const oppFid = home ? g.away : g.home;
            const opp = FRANCHISES[oppFid];
            const us = home ? g.result!.homeScore : g.result!.awayScore;
            const them = home ? g.result!.awayScore : g.result!.homeScore;
            const win = us > them;
            return (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                <span>{home ? 'vs' : '@'} {opp.abbr}</span>
                <span style={{ fontWeight: 600, color: win ? COLORS.green : COLORS.red }}>
                  {win ? 'W' : 'L'} {us}–{them}
                </span>
              </div>
            );
          })}
        </div>
        <div style={S.panel}>
          <div style={S.panelTitle}>Upcoming</div>
          {upcoming.length === 0 && <div style={S.byline}>No games on the schedule.</div>}
          {upcoming.map((g) => {
            const home = g.home === fid;
            const oppFid = home ? g.away : g.home;
            const opp = FRANCHISES[oppFid];
            return (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                <span>{home ? 'vs' : '@'} {opp.abbr}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>Day {g.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Latest from Around the League</div>
        {headlines.map((n) => (
          <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16 }}>{n.headline}</div>
            <div style={{ ...S.byline, fontSize: 13 }}>{n.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VacancyBanner() {
  const { state, setPage } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const staff = state.staffByFid?.[fid];
  if (!staff) return null;
  const vacant: string[] = [];
  if (!staff.manager) vacant.push('manager');
  if (!staff.pitching_coach) vacant.push('pitching coach');
  if (!staff.hitting_coach) vacant.push('hitting coach');
  if (vacant.length === 0) return null;
  return (
    <div
      style={{
        background: '#9b2c2c', color: '#f3ecdc', padding: '10px 16px',
        marginBottom: 14, border: '2px solid #1a1814',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.12em',
      }}
    >
      <span>VACANT: {vacant.join(', ').toUpperCase()} — your team plays at a tactical penalty until filled</span>
      <button
        onClick={() => setPage('staff')}
        style={{
          background: '#f3ecdc', color: '#9b2c2c', border: '1px solid #f3ecdc',
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}
      >
        Hire Now
      </button>
    </div>
  );
}

function ObjectivesWidget() {
  const { state } = useGame();
  if (!state) return null;
  const obj = state.ownerObjectives;
  if (!obj) return null;
  const security = state.jobSecurity ?? 50;
  const securityColor = security >= 60 ? COLORS.green : security >= 25 ? COLORS.gold : COLORS.red;
  return (
    <div style={{ ...S.panelThick, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={S.panelTitle}>Owner Objectives · Season {obj.season}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.inkDim }}>
            Job Security
          </span>
          <div style={{ width: 140, height: 10, background: 'rgba(26,24,20,0.1)', position: 'relative' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, security))}%`, height: 10, background: securityColor }} />
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: securityColor, fontWeight: 600, width: 40, textAlign: 'right' }}>
            {security}
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
        {obj.objectives.map((o) => (
          <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderLeft: `3px solid ${o.achieved === undefined ? '#5f5a4d' : o.achieved ? '#2e4c38' : '#9b2c2c'}`, background: '#fbf7ec' }}>
            <span style={{ fontFamily: "'IBM Plex Serif', serif", fontSize: 13 }}>{o.label}</span>
            {o.achieved !== undefined && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: o.achieved ? COLORS.green : COLORS.red, fontWeight: 600 }}>
                {o.achieved ? '✓' : '✗'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
