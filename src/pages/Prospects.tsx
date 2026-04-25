import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { top100Prospects, teamTopProspects } from '../engine/prospects';
import { toScout } from '../engine/format';
import { SortableTable, type SortableColumn } from '../components/SortableTable';
import type { ProspectRank } from '../engine/prospects';

export function Prospects() {
  const { state, setSelectedPlayerId } = useGame();
  const [scope, setScope] = useState<'league' | 'team'>('league');
  if (!state) return null;

  const league = useMemo(() => top100Prospects(state), [state]);
  const mine = useMemo(() => teamTopProspects(state, state.userFranchiseId, 25), [state]);
  const rows = scope === 'league' ? league : mine;

  const cols: SortableColumn<ProspectRank>[] = [
    { key: 'rank', label: '#', sortValue: (r) => r.rank, render: (r) => r.rank, align: 'right', width: 40 },
    {
      key: 'name', label: 'Name',
      sortValue: (r) => `${r.player.lastName} ${r.player.firstName}`,
      render: (r) => (
        <span style={{ fontFamily: "'IBM Plex Serif', serif" }}>
          {r.player.firstName} {r.player.lastName}
        </span>
      ),
    },
    {
      key: 'pos', label: 'Pos',
      sortValue: (r) => r.player.pos,
      render: (r) => r.player.pos, align: 'right', width: 52,
    },
    {
      key: 'age', label: 'Age',
      sortValue: (r) => r.player.age,
      render: (r) => r.player.age, align: 'right', width: 50,
    },
    {
      key: 'team', label: 'Team',
      sortValue: (r) => r.player.franchiseId ? FRANCHISES[r.player.franchiseId].abbr : 'FA',
      render: (r) => r.player.franchiseId ? FRANCHISES[r.player.franchiseId].abbr : 'FA',
      align: 'right', width: 60,
    },
    {
      key: 'ovr', label: 'OVR',
      sortValue: (r) => r.player.ratings.overall,
      render: (r) => toScout(r.player.ratings.overall),
      align: 'right', width: 52,
    },
    {
      key: 'pot', label: 'POT',
      sortValue: (r) => r.player.potential,
      render: (r) => toScout(r.player.potential),
      align: 'right', width: 52,
    },
    {
      key: 'score', label: 'Score',
      sortValue: (r) => r.score,
      render: (r) => r.score.toFixed(1),
      align: 'right', width: 60,
    },
    {
      key: 'eta', label: 'ETA',
      sortValue: (r) => r.eta,
      render: (r) => r.eta === 0 ? 'Now' : `${r.eta}y`,
      align: 'right', width: 52,
    },
  ];

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Prospect Rankings</h2>
        <div style={S.sectionSub}>Top under-26 talent, ranked by projection</div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={S.radioBtn(scope === 'league')}
            onClick={() => setScope('league')}
          >
            League Top 100
          </button>
          <button
            style={S.radioBtn(scope === 'team')}
            onClick={() => setScope('team')}
          >
            Your Farm Top 25
          </button>
        </div>
      </div>

      <div style={S.panel}>
        <SortableTable
          rows={rows}
          columns={cols}
          rowKey={(r) => r.player.id}
          initialSortKey="rank"
          initialSortDir="asc"
          onRowClick={(r) => setSelectedPlayerId(r.player.id)}
          emptyMessage="No prospects found."
        />
      </div>
    </div>
  );
}
