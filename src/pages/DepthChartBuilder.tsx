import { useState } from 'react';
import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { toScout } from '../engine/format';

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP'];

export function DepthChartBuilder() {
  const { state, setDepthAtAction, setBullpenRoleAction } = useGame();
  const [selectedPos, setSelectedPos] = useState('C');
  const [editingChart, setEditingChart] = useState<string[] | null>(null);
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const roster = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
  const dc = state.depthCharts?.[fid] || {};
  const currentChart: string[] = editingChart || dc[selectedPos] || [];

  const eligible = roster.filter(p => {
    if (selectedPos === 'SP' || selectedPos === 'RP') return p.isPitcher;
    if (selectedPos === 'DH') return !p.isPitcher;
    return !p.isPitcher && (p.pos === selectedPos || matchesUtility(p.pos, selectedPos));
  });

  const inChart = currentChart.map(id => state.players[id]).filter(Boolean);
  const notInChart = eligible.filter(p => !currentChart.includes(p.id));

  const move = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= currentChart.length) return;
    const next = [...currentChart];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    setEditingChart(next);
  };
  const add = (pid: string) => setEditingChart([...currentChart, pid]);
  const remove = (pid: string) => setEditingChart(currentChart.filter(x => x !== pid));
  const save = () => {
    setDepthAtAction(selectedPos, currentChart);
    setEditingChart(null);
  };

  const bullpen = roster.filter(p => p.isPitcher && p.pos === 'RP');
  const closers = bullpen.filter(p => p.bullpenRole === 'closer');
  const setups = bullpen.filter(p => p.bullpenRole === 'setup');
  const middles = bullpen.filter(p => p.bullpenRole === 'middle');
  const loogies = bullpen.filter(p => p.bullpenRole === 'loogy');

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name} Depth Chart</h2>
        <div style={S.sectionSub}>Set the order at each position. Topmost is the starter.</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {POSITIONS.map(pos => (
          <button
            key={pos}
            onClick={() => { setSelectedPos(pos); setEditingChart(null); }}
            style={{
              ...S.btn,
              fontSize: 12,
              padding: '4px 10px',
              background: selectedPos === pos ? '#1c3144' : '#fff',
              color: selectedPos === pos ? '#fff' : '#000',
            }}
          >
            {pos}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>{selectedPos} Depth ({inChart.length})</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Name</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={S.th}>Move</th>
              </tr>
            </thead>
            <tbody>
              {inChart.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ ...S.td, ...S.tdNum, fontWeight: 700 }}>{idx === 0 ? 'S' : idx === 1 ? 'B' : idx + 1}</td>
                  <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                  <td style={S.td}>
                    <button onClick={() => move(idx, -1)} style={{ ...S.btn, fontSize: 11, padding: '2px 6px' }}>↑</button>
                    <button onClick={() => move(idx, 1)} style={{ ...S.btn, fontSize: 11, padding: '2px 6px', marginLeft: 4 }}>↓</button>
                    <button onClick={() => remove(p.id)} style={{ ...S.btn, fontSize: 11, padding: '2px 6px', marginLeft: 4 }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <button onClick={save} style={{ ...S.btn, background: '#1c3144', color: '#fff' }}>Save</button>
          </div>
        </div>

        <div style={S.panel}>
          <div style={S.panelTitle}>Available</div>
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
              {notInChart.map(p => (
                <tr key={p.id}>
                  <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                  <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                  <td style={S.td}>
                    <button onClick={() => add(p.id)} style={{ ...S.btn, fontSize: 11, padding: '2px 8px' }}>+</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPos === 'RP' && (
        <div style={{ ...S.panel, marginTop: 16 }}>
          <div style={S.panelTitle}>Bullpen Roles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { role: 'closer' as const, label: 'Closer', list: closers },
              { role: 'setup' as const, label: 'Setup', list: setups },
              { role: 'middle' as const, label: 'Middle', list: middles },
              { role: 'loogy' as const, label: 'LOOGY', list: loogies },
            ].map(({ role, label, list }) => (
              <div key={role}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{label} ({list.length})</div>
                {list.map(p => (
                  <div key={p.id} style={{ fontSize: 12, padding: '2px 0' }}>
                    {p.lastName} ({toScout(p.ratings.overall)})
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            <span style={{ marginRight: 8 }}>Assign:</span>
            {bullpen.slice(0, 8).map(p => (
              <span key={p.id} style={{ marginRight: 8 }}>
                {p.lastName}:
                {(['closer', 'setup', 'middle', 'loogy'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setBullpenRoleAction(p.id, r)}
                    style={{
                      ...S.btn,
                      fontSize: 10,
                      padding: '1px 4px',
                      marginLeft: 2,
                      background: p.bullpenRole === r ? '#1c3144' : '#fff',
                      color: p.bullpenRole === r ? '#fff' : '#000',
                    }}
                  >
                    {r[0].toUpperCase()}
                  </button>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function matchesUtility(playerPos: string, slot: string): boolean {
  if (playerPos === 'IF' && ['1B', '2B', '3B', 'SS'].includes(slot)) return true;
  if (playerPos === 'OF' && ['LF', 'CF', 'RF'].includes(slot)) return true;
  return false;
}
