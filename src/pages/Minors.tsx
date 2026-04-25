import { useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { ratingClass, toScout } from '../engine/format';
import type { MinorLevel } from '../engine/types';

export function Minors() {
  const { state, callUpAction, sendDownAction, setSelectedPlayerId } = useGame();
  const [tab, setTab] = useState<MinorLevel>('aaa');
  const [flash, setFlash] = useState<string | null>(null);
  if (!state) return null;

  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const minors = state.minorRosters?.[fid] || { aaa: [], aa: [], a: [] };

  const playersAtLevel = minors[tab]
    .map((id) => state.players[id])
    .filter(Boolean)
    .sort((a, b) => b.ratings.overall - a.ratings.overall);

  const flashMsg = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const onCallUp = (pid: string, name: string) => {
    const r = callUpAction(pid);
    flashMsg(r.ok ? `Called up ${name}` : (r.reason || 'Failed'));
  };

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name} Farm System</h2>
        <div style={S.sectionSub}>
          AAA: {minors.aaa.length} - AA: {minors.aa.length} - A: {minors.a.length}
        </div>
      </div>

      {flash && (
        <div style={{ ...S.panel, marginBottom: 12, background: '#f5e2c8' }}>{flash}</div>
      )}

      <div style={{ ...S.panel, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['aaa', 'aa', 'a'] as MinorLevel[]).map((lvl) => (
            <button
              key={lvl}
              style={S.radioBtn(tab === lvl)}
              onClick={() => setTab(lvl)}
            >
              {lvl.toUpperCase()} ({minors[lvl].length})
            </button>
          ))}
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>{tab.toUpperCase()} Roster</div>
        {playersAtLevel.length === 0 ? (
          <div style={{ color: COLORS.inkDim, fontStyle: 'italic', marginTop: 12 }}>
            No players at this level.
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Pos</th>
                <th style={S.th}>Name</th>
                <th style={{ ...S.th, ...S.thNum }}>Age</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={{ ...S.th, ...S.thNum }}>POT</th>
                <th style={S.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {playersAtLevel.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
                  <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                  <td
                    style={{ ...S.td, ...S.tdName, color: COLORS.red, textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => setSelectedPlayerId(p.id)}
                  >
                    {p.firstName} {p.lastName}
                  </td>
                  <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                  <td style={{ ...S.td, ...S.tdNum, color: ratingClass(p.ratings.overall), fontWeight: 600 }}>
                    {toScout(p.ratings.overall)}
                  </td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.potential)}</td>
                  <td style={S.td}>
                    <button
                      onClick={() => onCallUp(p.id, `${p.firstName} ${p.lastName}`)}
                      style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green, fontSize: 11, padding: '2px 8px' }}
                    >
                      Call up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ ...S.panel, marginTop: 12 }}>
        <div style={S.panelTitle}>Send a player down</div>
        <div style={S.byline}>
          Active-roster players (with less than 5 yrs service) can be optioned to AAA.
        </div>
        <ActiveSendDown onSend={(pid, name) => {
          const r = sendDownAction(pid, 'aaa');
          flashMsg(r.ok ? `Sent ${name} to AAA` : (r.reason || 'Failed'));
        }} />
      </div>
    </div>
  );
}

function ActiveSendDown({ onSend }: { onSend: (pid: string, name: string) => void }) {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const eligible = (state.rosters[fid] || [])
    .map((id) => state.players[id])
    .filter((p) => p && (p.contract?.serviceDays || 0) < 5 * 172)
    .sort((a, b) => a.ratings.overall - b.ratings.overall);

  if (eligible.length === 0) return <div style={{ ...S.byline, marginTop: 8 }}>No eligible players.</div>;

  return (
    <div style={{ marginTop: 8, maxHeight: 240, overflowY: 'auto' }}>
      {eligible.slice(0, 12).map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
            borderBottom: '1px dotted rgba(26,24,20,0.13)',
          }}
        >
          <span style={{ width: 36, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim }}>
            {p.pos}
          </span>
          <span style={{ flex: 1, fontFamily: "'IBM Plex Serif', serif" }}>
            {p.firstName} {p.lastName} ({toScout(p.ratings.overall)})
          </span>
          <button
            onClick={() => onSend(p.id, `${p.firstName} ${p.lastName}`)}
            style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, fontSize: 10, padding: '2px 6px' }}
          >
            Send to AAA
          </button>
        </div>
      ))}
    </div>
  );
}
