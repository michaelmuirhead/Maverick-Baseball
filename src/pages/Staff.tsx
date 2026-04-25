import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, ratingClass, toScout } from '../engine/format';
import type { Coach, CoachRole } from '../engine/types';
import { coachDevelopmentLog, projectedBump, developableYoungPlayers, topDevelopingCoaches, computeTacticalContribution } from '../engine/coaches';

const ROLE_LABEL: Record<CoachRole, string> = {
  manager: 'Manager',
  pitching_coach: 'Pitching Coach',
  hitting_coach: 'Hitting Coach',
};

export function Staff() {
  const { state, hireCoach, fireCoachAction, toggleDelegateStaffHiring } = useGame();
  const [hireRole, setHireRole] = useState<CoachRole>('manager');
  const [years, setYears] = useState<number>(2);
  const [selectedHire, setSelectedHire] = useState<string | null>(null);

  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const myStaff = state.staffByFid?.[fid];
  const coaches = state.coaches || {};
  const pool = (state.coachPool || []).map((id) => coaches[id]).filter(Boolean);

  const filtered = pool
    .filter((c) => c.role === hireRole)
    .sort((a, b) => b.ratings.overall - a.ratings.overall);

  const myStaffOpenSlot = myStaff && !myStaff[hireRole];

  function fireHandler(coachId: string) {
    const c = coaches[coachId];
    const yearsLeft = c?.contract?.years || 0;
    const salary = c?.contract?.salary || 0;
    const projectedBuyout = Math.round(yearsLeft * salary * 0.5);
    if (!confirm(`Fire ${c?.firstName} ${c?.lastName}? Estimated buyout: ${fmtShort(projectedBuyout)}.`)) return;
    const r = fireCoachAction(coachId);
    if (r.ok) alert(`Fired. Buyout paid: ${fmtShort(r.buyout)}.`);
    else alert(r.reason || 'Could not fire.');
  }

  function hireHandler(coachId: string) {
    const c = coaches[coachId];
    if (!c) return;
    if (myStaff && myStaff[c.role]) {
      if (!confirm(`The ${ROLE_LABEL[c.role]} slot is filled. Fire the current ${ROLE_LABEL[c.role]} first.`)) return;
      return;
    }
    hireCoach(coachId, years);
    setSelectedHire(null);
  }

  return (
    <div>
      <div style={S.sectionRule}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={S.sectionHead}>Coaching Staff</h2>
            <div style={S.sectionSub}>{f.city} {f.name} · {(state.coachPool || []).length} coaches on the market</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.inkDim }}>
            <input
              type="checkbox"
              checked={!!state.delegateStaffHiring}
              onChange={() => toggleDelegateStaffHiring()}
              style={{ accentColor: COLORS.green }}
            />
            Delegate Staff Hiring
          </label>
        </div>
      </div>

      {/* Current staff */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {(['manager', 'pitching_coach', 'hitting_coach'] as CoachRole[]).map((role) => {
          const cid = myStaff?.[role];
          const c = cid ? coaches[cid] : null;
          return (
            <div key={role} style={S.panelThick}>
              <div style={S.panelTitle}>{ROLE_LABEL[role]}</div>
              {!c && (
                <div style={{ ...S.byline, marginBottom: 8 }}>
                  Vacant. Hire from the market below.
                </div>
              )}
              {c && <CoachCard coach={c} onFire={() => fireHandler(c.id)} />}
            </div>
          );
        })}
      </div>

      {/* Tactical impact — manager's actual contribution */}
      <TacticalImpactPanel />

      {/* Hiring market */}
      <div style={{ marginTop: 24, ...S.panel }}>
        <div style={S.panelTitle}>Hiring Market</div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={S.eyebrow}>Filter by role</span>
          {(['manager', 'pitching_coach', 'hitting_coach'] as CoachRole[]).map((r) => (
            <button key={r} style={S.radioBtn(hireRole === r)} onClick={() => { setHireRole(r); setSelectedHire(null); }}>
              {ROLE_LABEL[r]}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={S.eyebrow}>Years</span>
          <input
            type="number"
            min={1}
            max={5}
            value={years}
            onChange={(e) => setYears(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)))}
            style={{ width: 60, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
          />
          {!myStaffOpenSlot && (
            <span style={{ ...S.badge, ...S.badgeRed }}>
              Slot filled — fire current {ROLE_LABEL[hireRole]} to hire
            </span>
          )}
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Name</th>
              <th style={{ ...S.th, ...S.thNum }}>Age</th>
              <th style={{ ...S.th, ...S.thNum }}>Exp</th>
              <th style={{ ...S.th, ...S.thNum }}>OVR</th>
              <th style={{ ...S.th, ...S.thNum }}>Tactical</th>
              <th style={{ ...S.th, ...S.thNum }}>Develop</th>
              <th style={{ ...S.th, ...S.thNum }}>Chem</th>
              <th style={{ ...S.th, ...S.thNum }}>Rings</th>
              <th style={{ ...S.th, ...S.thNum }}>Est AAV</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ ...S.td, ...S.byline, padding: 16 }}>No {ROLE_LABEL[hireRole].toLowerCase()}s available.</td></tr>
            )}
            {filtered.map((c) => {
              const aav = Math.max(700_000, Math.round(c.ratings.overall ** 1.7 * 1500));
              return (
                <tr key={c.id} style={{ background: selectedHire === c.id ? '#f8f2e4' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedHire(c.id)}>
                  <td style={{ ...S.td, ...S.tdName }}>{c.firstName} {c.lastName}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{c.age}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{c.experience}</td>
                  <td style={{ ...S.td, ...S.tdNum, fontWeight: 600, color: ratingClass(c.ratings.overall) }}>{toScout(c.ratings.overall)}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(c.ratings.tactical)}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(c.ratings.development)}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(c.ratings.chemistry)}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{c.championships > 0 ? '★'.repeat(Math.min(5, c.championships)) : '—'}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{fmtShort(aav)}</td>
                  <td style={S.td}>
                    <button
                      onClick={(e) => { e.stopPropagation(); hireHandler(c.id); }}
                      disabled={!myStaffOpenSlot}
                      style={{
                        ...S.radioBtn(true), padding: '4px 10px',
                        background: myStaffOpenSlot ? COLORS.green : '#999',
                        borderColor: myStaffOpenSlot ? COLORS.green : '#999',
                        cursor: myStaffOpenSlot ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Hire
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scouting reports — track record + projections */}
      <ScoutingReport />

      {/* League scoreboard — surface the great staffs */}
      <div style={{ marginTop: 24, ...S.panel }}>
        <div style={S.panelTitle}>League Staff Snapshot</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Team</th>
              <th style={S.th}>Manager</th>
              <th style={{ ...S.th, ...S.thNum }}>OVR</th>
              <th style={S.th}>Pitching Coach</th>
              <th style={{ ...S.th, ...S.thNum }}>OVR</th>
              <th style={S.th}>Hitting Coach</th>
              <th style={{ ...S.th, ...S.thNum }}>OVR</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(FRANCHISES).map((fid) => {
              const staff = state.staffByFid?.[fid];
              const mgr = staff?.manager ? coaches[staff.manager] : null;
              const pc = staff?.pitching_coach ? coaches[staff.pitching_coach] : null;
              const hc = staff?.hitting_coach ? coaches[staff.hitting_coach] : null;
              const isUser = fid === state.userFranchiseId;
              return (
                <tr key={fid} style={{ background: isUser ? '#f8f2e4' : 'transparent' }}>
                  <td style={{ ...S.td, fontWeight: isUser ? 600 : 400 }}>{FRANCHISES[fid].abbr}</td>
                  <td style={S.td}>{mgr ? `${mgr.firstName} ${mgr.lastName}` : <em style={{ color: COLORS.red }}>vacant</em>}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{mgr ? toScout(mgr.ratings.overall) : '—'}</td>
                  <td style={S.td}>{pc ? `${pc.firstName} ${pc.lastName}` : <em style={{ color: COLORS.red }}>vacant</em>}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{pc ? toScout(pc.ratings.overall) : '—'}</td>
                  <td style={S.td}>{hc ? `${hc.firstName} ${hc.lastName}` : <em style={{ color: COLORS.red }}>vacant</em>}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{hc ? toScout(hc.ratings.overall) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoachCard({ coach, onFire }: { coach: Coach; onFire: () => void }) {
  const yrs = coach.contract?.years || 0;
  const salary = coach.contract?.salary || 0;
  return (
    <div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>
        {coach.firstName} {coach.lastName}
      </div>
      <div style={S.byline}>
        Age {coach.age} · {coach.experience} yrs experience
        {coach.championships > 0 && ` · ${coach.championships} ring${coach.championships > 1 ? 's' : ''}`}
      </div>

      <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
        <RatingRow label="Overall" v={coach.ratings.overall} />
        <RatingRow label="Tactical" v={coach.ratings.tactical} />
        <RatingRow label="Develop" v={coach.ratings.development} />
        <RatingRow label="Chemistry" v={coach.ratings.chemistry} />
      </div>

      <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.inkDim }}>
        Contract: {fmtShort(salary)} / yr · {yrs} yr{yrs !== 1 ? 's' : ''} left
      </div>

      <button
        onClick={onFire}
        style={{
          ...S.radioBtn(true),
          background: COLORS.red, borderColor: COLORS.red,
          marginTop: 12, padding: '6px 14px',
        }}
      >
        Fire
      </button>
    </div>
  );
}

function RatingRow({ label, v }: { label: string; v: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ color: COLORS.inkDim, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10 }}>{label}</span>
      <span style={{ color: ratingClass(v), fontWeight: label === 'Overall' ? 600 : 400 }}>{toScout(v)}</span>
    </div>
  );
}


function ScoutingReport() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const myStaff = state.staffByFid?.[fid];
  const coaches = state.coaches || {};
  const pcId = myStaff?.pitching_coach;
  const hcId = myStaff?.hitting_coach;
  const pc = pcId ? coaches[pcId] : null;
  const hc = hcId ? coaches[hcId] : null;

  const devYoung = developableYoungPlayers(state, fid);
  const myHistoryPC = pcId ? coachDevelopmentLog(state, pcId) : [];
  const myHistoryHC = hcId ? coachDevelopmentLog(state, hcId) : [];
  const leaderboard = topDevelopingCoaches(state, 8);

  return (
    <div style={{ marginTop: 24, ...S.panel }}>
      <div style={S.panelTitle}>Scouting · Development Reports</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Projected bumps for young roster */}
        <div>
          <div style={S.eyebrow}>Next-Rollover Projection</div>
          {devYoung.length === 0 && (
            <div style={{ ...S.byline, marginTop: 6 }}>
              No players under 25 on the active roster.
            </div>
          )}
          {devYoung.length > 0 && (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Pos</th>
                  <th style={{ ...S.th, ...S.thNum }}>Age</th>
                  <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                  <th style={{ ...S.th, ...S.thNum }}>POT</th>
                  <th style={{ ...S.th, ...S.thNum }}>Coach</th>
                  <th style={{ ...S.th, ...S.thNum }}>Bump</th>
                </tr>
              </thead>
              <tbody>
                {devYoung.sort((a, b) => b.potential - a.potential).map((p) => {
                  const bump = projectedBump(state, p);
                  const role: CoachRole = p.isPitcher ? 'pitching_coach' : 'hitting_coach';
                  const coachId = myStaff?.[role];
                  const coach = coachId ? coaches[coachId] : null;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                      <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                      <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                      <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                      <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.potential)}</td>
                      <td style={{ ...S.td, ...S.tdNum, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                        {coach ? coach.lastName : '—'}
                      </td>
                      <td style={{ ...S.td, ...S.tdNum, color: bump > 0 ? COLORS.green : COLORS.inkDim, fontWeight: 600 }}>
                        {bump > 0 ? '+' + bump.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Coach track records */}
        <div>
          <div style={S.eyebrow}>Track Records</div>
          <CoachTrack coach={pc} history={myHistoryPC} state={state} role="Pitching Coach" />
          <div style={{ marginTop: 12 }} />
          <CoachTrack coach={hc} history={myHistoryHC} state={state} role="Hitting Coach" />
        </div>
      </div>

      {/* League leaderboard */}
      <div style={{ marginTop: 16 }}>
        <div style={S.eyebrow}>Top Developing Coaches (League-wide)</div>
        {leaderboard.length === 0 && (
          <div style={{ ...S.byline, marginTop: 6 }}>
            No development on record yet — bumps are awarded at season rollover.
          </div>
        )}
        {leaderboard.length > 0 && (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Coach</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Team</th>
                <th style={{ ...S.th, ...S.thNum }}>Players Developed</th>
                <th style={{ ...S.th, ...S.thNum }}>Total POT Gain</th>
                <th style={{ ...S.th, ...S.thNum }}>Total OVR Gain</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => {
                const c = coaches[row.coachId];
                if (!c) return null;
                const teamFid = c.franchiseId;
                return (
                  <tr key={row.coachId} style={{ background: teamFid === fid ? '#f8f2e4' : 'transparent' }}>
                    <td style={{ ...S.td, ...S.tdName }}>{c.firstName} {c.lastName}</td>
                    <td style={S.td}>{c.role.replace('_', ' ')}</td>
                    <td style={S.td}>{teamFid ? FRANCHISES[teamFid]?.abbr : <em style={{ color: COLORS.inkDim }}>FA</em>}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{row.bumps}</td>
                    <td style={{ ...S.td, ...S.tdNum, color: COLORS.green, fontWeight: 600 }}>+{row.totalPotentialGain}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>+{row.totalOverallGain}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CoachTrack({ coach, history, state, role }: { coach: Coach | null; history: any[]; state: any; role: string }) {
  if (!coach) {
    return (
      <div style={{ ...S.panel, padding: 12 }}>
        <div style={S.eyebrow}>{role}</div>
        <div style={S.byline}>Slot is vacant.</div>
      </div>
    );
  }
  const totalGain = history.reduce((s, r) => s + (r.postPotential - r.prePotential), 0);
  return (
    <div style={{ ...S.panel, padding: 12 }}>
      <div style={S.eyebrow}>{role}</div>
      <div style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 500, marginTop: 2 }}>
        {coach.firstName} {coach.lastName}
        <span style={{ ...S.byline, marginLeft: 6 }}>· OVR {toScout(coach.ratings.overall)} · DEV {toScout(coach.ratings.development)}</span>
      </div>
      <div style={{ ...S.eyebrow, marginTop: 8 }}>
        Lifetime: {history.length} bump(s) · +{totalGain} potential
      </div>
      {history.length === 0 && (
        <div style={{ ...S.byline, marginTop: 6 }}>
          No development on record yet.
        </div>
      )}
      {history.slice(-5).reverse().map((r, i) => {
        const p = state.players[r.playerId];
        if (!p) return null;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
            <span>{p.firstName} {p.lastName}</span>
            <span style={{ color: COLORS.inkDim }}>S{r.season}</span>
            <span style={{ color: COLORS.green, fontWeight: 600 }}>
              POT {toScout(r.prePotential)} → {toScout(r.postPotential)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TacticalImpactPanel() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const mine = computeTacticalContribution(state, fid);

  // League average for context
  const allFids = Object.keys(FRANCHISES);
  const allContribs = allFids.map((id) => computeTacticalContribution(state, id));
  const avg = (sel: (c: ReturnType<typeof computeTacticalContribution>) => number) =>
    allContribs.reduce((s, c) => s + sel(c), 0) / Math.max(1, allContribs.length);
  const leagueBench = avg((c) => c.benchLeverage);
  const leagueBullpen = avg((c) => c.bullpenLeverage);
  const leagueIntangibles = avg((c) => c.intangibles);

  const totalEdge = (mine.benchLeverage - leagueBench) +
    (mine.bullpenLeverage - leagueBullpen) +
    (mine.intangibles - leagueIntangibles);

  function delta(v: number, ref: number) {
    const d = v - ref;
    const sign = d >= 0 ? '+' : '';
    return <span style={{ color: d >= 0 ? COLORS.green : COLORS.red, fontWeight: 600 }}>{sign}{d.toFixed(2)}</span>;
  }

  function formatBonus(v: number) {
    const sign = v >= 0 ? '+' : '';
    return <span style={{ color: v >= 0 ? COLORS.green : COLORS.red, fontWeight: 600 }}>{sign}{v.toFixed(2)}</span>;
  }

  return (
    <div style={{ marginTop: 24, ...S.panelThick }}>
      <div style={S.panelTitle}>Tactical Impact · what your manager actually does</div>
      <div style={{ ...S.byline, marginBottom: 12 }}>
        Each value below is a contribution to <strong>team strength (OVR)</strong>.
        These are baked into every game sim — you can lose 5–8 wins a year to a poor tactical manager.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }}>
        <div style={S.stat}>
          <div style={S.statLabel}>Bench Leverage</div>
          <div style={{ ...S.statValue, color: mine.benchLeverage >= leagueBench ? COLORS.green : COLORS.red }}>
            {mine.benchLeverage >= 0 ? '+' : ''}{mine.benchLeverage.toFixed(2)}
          </div>
          <div style={S.statDelta}>
            League avg {leagueBench.toFixed(2)} · vs avg {delta(mine.benchLeverage, leagueBench)}
          </div>
        </div>
        <div style={S.stat}>
          <div style={S.statLabel}>Bullpen Leverage</div>
          <div style={{ ...S.statValue, color: mine.bullpenLeverage >= leagueBullpen ? COLORS.green : COLORS.red }}>
            {mine.bullpenLeverage >= 0 ? '+' : ''}{mine.bullpenLeverage.toFixed(2)}
          </div>
          <div style={S.statDelta}>
            League avg {leagueBullpen.toFixed(2)} · vs avg {delta(mine.bullpenLeverage, leagueBullpen)}
          </div>
        </div>
        <div style={S.stat}>
          <div style={S.statLabel}>Intangibles</div>
          <div style={{ ...S.statValue, color: mine.intangibles >= leagueIntangibles ? COLORS.green : COLORS.red }}>
            {mine.intangibles >= 0 ? '+' : ''}{mine.intangibles.toFixed(2)}
          </div>
          <div style={S.statDelta}>
            League avg {leagueIntangibles.toFixed(2)} · vs avg {delta(mine.intangibles, leagueIntangibles)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `2px solid ${COLORS.ink}`, paddingTop: 10 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.inkDim }}>
          Net edge over league average
        </span>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>
          {formatBonus(totalEdge)} OVR
        </span>
      </div>
      <div style={{ ...S.byline, fontSize: 12, marginTop: 6 }}>
        ≈ {totalEdge >= 0 ? '+' : ''}{Math.round(totalEdge * 2.7)} wins per 162 games vs a league-average tactical baseline (Bradley-Terry conversion, ~1 OVR ≈ 1.7 win-pct points)
      </div>
    </div>
  );
}
