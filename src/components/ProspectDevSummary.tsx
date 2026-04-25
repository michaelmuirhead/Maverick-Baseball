import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { teamTopProspects } from '../engine/prospects';
import { toScout } from '../engine/format';

/**
 * Top 3 user prospects with estimated callup ETA based on age + ratings gap.
 */
export function ProspectDevSummary() {
  const { state, setSelectedPlayerId } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const top = teamTopProspects(state, fid, 3);
  if (top.length === 0) return null;

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Top Farm Talent</div>
      <div style={{ marginTop: 8 }}>
        {top.map((r) => {
          const p = r.player;
          const gap = p.potential - p.ratings.overall;
          const eta = r.eta;
          const etaLabel = eta === 0 ? 'Ready now'
            : eta === 1 ? '1 yr away'
            : `${eta} yrs away`;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                cursor: 'pointer',
                borderBottom: '1px dotted rgba(26,24,20,0.13)',
              }}
            >
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.inkDim, fontSize: 11, width: 24 }}>
                #{r.rank}
              </span>
              <span style={{ flex: 1, fontFamily: "'IBM Plex Serif', serif" }}>
                {p.firstName} {p.lastName}{' '}
                <span style={{ color: COLORS.inkDim, fontSize: 11 }}>({p.pos}, age {p.age})</span>
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                {toScout(p.ratings.overall)}/{toScout(p.potential)} <span style={{ color: COLORS.inkDim }}>({gap > 0 ? '+' : ''}{gap})</span>
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: eta === 0 ? COLORS.green : COLORS.inkDim, width: 90, textAlign: 'right' }}>
                {etaLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
