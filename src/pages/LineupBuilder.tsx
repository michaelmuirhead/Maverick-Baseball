import { useState } from 'react';
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';

export function LineupBuilder() {
  const { state } = useGame();
  const [order, setOrder] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const roster = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
  const hitters = roster.filter(p => !p.isPitcher);

  // Initialize from current best 9
  if (order.length === 0 && hitters.length >= 9) {
    const initial = [...hitters].sort((a, b) => b.ratings.overall - a.ratings.overall).slice(0, 9).map(p => p.id);
    setOrder(initial);
    return null;
  }

  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (idx: number) => {
    if (dragIdx === null) return;
    const next = [...order];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setOrder(next);
    setDragIdx(null);
  };

  const benchHitters = hitters.filter(p => !order.includes(p.id));

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name} Lineup</h2>
        <div style={S.sectionSub}>Drag to reorder the batting order. Top of the order bats first.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Batting Order</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Pos</th>
                <th style={S.th}>Name</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={{ ...S.th, ...S.thNum }}>Hit</th>
                <th style={{ ...S.th, ...S.thNum }}>Pow</th>
                <th style={{ ...S.th, ...S.thNum }}>Run</th>
              </tr>
            </thead>
            <tbody>
              {order.map((pid, idx) => {
                const p = state.players[pid];
                if (!p) return null;
                const tg = p.toolGrades || {};
                return (
                  <tr
                    key={pid}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(idx)}
                    style={{ cursor: 'grab', background: dragIdx === idx ? '#fff5e0' : 'transparent' }}
                  >
                    <td style={{ ...S.td, ...S.tdNum, fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                    <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{tg.hit ?? '—'}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{tg.power ?? '—'}</td>
                    <td style={{ ...S.td, ...S.tdNum }}>{tg.run ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 12, color: '#777' }}>
            Tip: leadoff = high contact + speed. 3-4 hole = power. 9-hole = pitcher or weakest hitter.
          </div>
        </div>

        <div style={S.panel}>
          <div style={S.panelTitle}>Bench / Available</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Pos</th>
                <th style={S.th}>Name</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={S.th}>Add</th>
              </tr>
            </thead>
            <tbody>
              {benchHitters.map(p => (
                <tr key={p.id}>
                  <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                  <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                  <td style={S.td}>
                    <button
                      onClick={() => order.length < 9 && setOrder([...order, p.id])}
                      style={{ ...S.btn, fontSize: 11, padding: '2px 8px' }}
                    >
                      ↑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
