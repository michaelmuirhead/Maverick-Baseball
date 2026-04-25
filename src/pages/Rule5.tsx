import { useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';
import { SortableTable, type SortableColumn } from '../components/SortableTable';
import { rule5CurrentTeam } from '../engine/rule5';
import type { Player } from '../engine/types';

export function Rule5() {
  const { state, rule5PickAction, rule5AutoComplete } = useGame();
  if (!state) return null;
  const draft = state.rule5;

  if (!draft) {
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Rule 5 Draft</h2>
          <div style={S.sectionSub}>Fires on offseason day -20</div>
        </div>
        <div style={S.panel}>
          The Rule 5 draft has not started yet. Advance the offseason to day -20 to trigger it.
        </div>
      </div>
    );
  }

  const currentFid = rule5CurrentTeam(state);
  const isUserTurn = currentFid === state.userFranchiseId && !draft.complete;
  const pickNumber = draft.currentPickIndex + 1;
  const totalPicks = draft.order.length;

  const eligible: Player[] = useMemo(() => {
    return draft.eligible.map((id) => state.players[id]).filter(Boolean)
      .sort((a, b) => b.potential - a.potential);
  }, [draft.eligible, state.players]);

  const cols: SortableColumn<Player>[] = [
    { key: 'name', label: 'Name', sortValue: (p) => `${p.lastName} ${p.firstName}`, render: (p) => `${p.firstName} ${p.lastName}` },
    { key: 'pos', label: 'Pos', sortValue: (p) => p.pos, render: (p) => p.pos, width: 52, align: 'right' },
    { key: 'age', label: 'Age', sortValue: (p) => p.age, render: (p) => p.age, width: 48, align: 'right' },
    {
      key: 'from', label: 'From',
      sortValue: (p) => p.franchiseId || 'FA',
      render: (p) => p.franchiseId ? FRANCHISES[p.franchiseId].abbr : 'FA',
      width: 60, align: 'right',
    },
    { key: 'ovr', label: 'OVR', sortValue: (p) => p.ratings.overall, render: (p) => toScout(p.ratings.overall), width: 52, align: 'right' },
    { key: 'pot', label: 'POT', sortValue: (p) => p.potential, render: (p) => toScout(p.potential), width: 52, align: 'right' },
    {
      key: 'sel', label: '',
      sortable: false,
      render: (p) => (
        <button
          disabled={!isUserTurn}
          style={{ ...S.radioBtn(true), background: isUserTurn ? COLORS.ink : COLORS.inkDim, opacity: isUserTurn ? 1 : 0.5, fontSize: 11, padding: '4px 8px' }}
          onClick={() => rule5PickAction(p.id)}
        >
          Select
        </button>
      ),
      align: 'right', width: 72,
    },
  ];

  const picksRows = draft.picks.slice(-10).reverse();

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Rule 5 Draft</h2>
        <div style={S.sectionSub}>{state.season} — pick {pickNumber} of {totalPicks}</div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={S.eyebrow}>On the clock</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>
              {draft.complete ? 'Draft complete' : (currentFid ? `${FRANCHISES[currentFid].city} ${FRANCHISES[currentFid].name}` : '—')}
            </div>
          </div>
          <div>
            <div style={S.eyebrow}>Exposed</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>{eligible.length}</div>
          </div>
          <div>
            <div style={S.eyebrow}>Fee</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>$100K</div>
          </div>
          <div style={{ flex: 1 }} />
          {!draft.complete && (
            <button style={S.radioBtn(true)} onClick={() => rule5AutoComplete()}>Auto-complete</button>
          )}
        </div>
        {isUserTurn && (
          <div style={{ ...S.eyebrow, marginTop: 8, color: COLORS.green }}>
            You're on the clock. Select a player or pass via auto-complete.
          </div>
        )}
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={S.panelTitle}>Exposed prospects</div>
        <SortableTable rows={eligible} columns={cols} rowKey={(p) => p.id} initialSortKey="pot" maxHeight={480} />
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Recent picks</div>
        {picksRows.length === 0 ? (
          <div style={{ color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }}>No picks yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <thead>
              <tr>
                <th style={headStyle}>Team</th>
                <th style={headStyle}>Player</th>
                <th style={headStyle}>From</th>
              </tr>
            </thead>
            <tbody>
              {picksRows.map((pick, i) => {
                const p = pick.playerId ? state.players[pick.playerId] : null;
                return (
                  <tr key={i} style={{ borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                    <td style={{ padding: '6px 8px' }}>{FRANCHISES[pick.franchiseId].abbr}</td>
                    <td style={{ padding: '6px 8px' }}>{p ? `${p.firstName} ${p.lastName} (${p.pos})` : <em style={{ color: COLORS.inkDim }}>Pass</em>}</td>
                    <td style={{ padding: '6px 8px' }}>{pick.previousFid ? FRANCHISES[pick.previousFid]?.abbr : '—'}</td>
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

const headStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: `1px solid ${COLORS.ink}`,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: COLORS.inkDim,
};
