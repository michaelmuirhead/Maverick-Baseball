import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';

const ACTIVE_TARGET = 22;
const ROSTER_TARGET = 26;

export function RosterShortfallAlert() {
  const { state, setPage, toggleDelegateRoster } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const roster = state.rosters[fid] || [];
  const players = roster.map((id) => state.players[id]).filter(Boolean);
  const healthy = players.filter((p) => p.health === 'healthy');
  const totalCount = players.length;
  const healthyCount = healthy.length;

  const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  const missingPositions: string[] = [];
  for (const p of POS) if (!healthy.some((pl) => pl.pos === p)) missingPositions.push(p);

  const fewSP = healthy.filter((p) => p.pos === 'SP').length < 5;
  const fewRP = healthy.filter((p) => ['RP', 'CL'].includes(p.pos)).length < 5;

  const hasIssue = healthyCount < ACTIVE_TARGET || totalCount < ROSTER_TARGET ||
                   missingPositions.length > 0 || fewSP || fewRP;
  if (!hasIssue) return null;

  const issues: string[] = [];
  if (totalCount < ROSTER_TARGET) issues.push(`Active roster at ${totalCount} (target ${ROSTER_TARGET})`);
  if (healthyCount < ACTIVE_TARGET) issues.push(`Only ${healthyCount} healthy players`);
  if (missingPositions.length > 0) issues.push(`No starter at ${missingPositions.join(', ')}`);
  if (fewSP) issues.push(`Short on SP (${healthy.filter((p) => p.pos === 'SP').length}/5)`);
  if (fewRP) issues.push(`Short on RP (${healthy.filter((p) => ['RP', 'CL'].includes(p.pos)).length}/5)`);

  const callupCandidate = (state.prospects || [])
    .map((id) => state.players[id])
    .filter((p) => p && p.franchiseId === fid && !p.contract && p.age >= 19)
    .sort((a, b) => b.ratings.overall - a.ratings.overall)[0];

  const faAvailable = (state.freeAgency?.listings || []).some((l) => !l.signedBy);

  return (
    <div style={{ ...S.panel, marginBottom: 16, background: '#f5e2c8', borderColor: COLORS.gold }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: COLORS.gold, color: COLORS.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Serif Display', serif", fontSize: 22, flexShrink: 0,
        }}>!</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.ink }}>
            Roster needs attention
          </div>
          <ul style={{ margin: '6px 0 8px 0', paddingLeft: 18, fontFamily: "'IBM Plex Serif', serif", fontSize: 13 }}>
            {issues.map((i, k) => <li key={k}>{i}</li>)}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {callupCandidate && (
              <button
                onClick={() => setPage('prospects')}
                style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green, fontSize: 11 }}
              >
                Review prospects ({callupCandidate.firstName} {callupCandidate.lastName} top)
              </button>
            )}
            {faAvailable && (
              <button
                onClick={() => setPage('free_agency')}
                style={{ ...S.radioBtn(true), background: COLORS.ink, fontSize: 11 }}
              >
                Sign a free agent
              </button>
            )}
            <button
              onClick={() => setPage('trades')}
              style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, fontSize: 11 }}
            >
              Open trade desk
            </button>
            <button
              onClick={() => toggleDelegateRoster()}
              style={{
                ...S.radioBtn(!!state.delegateRoster),
                background: state.delegateRoster ? COLORS.green : 'transparent',
                color: state.delegateRoster ? COLORS.cream : COLORS.ink,
                fontSize: 11,
              }}
            >
              {state.delegateRoster ? 'Auto-fill: ON' : 'Let GM auto-fill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
