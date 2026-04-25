import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import {
  evaluateTradeForAI, suggestCounter, tradeValue, tradeWindowOpen, tradeWindowLabel,
} from '../engine/trades';

export function Trades() {
  const { state, executeTradeAction } = useGame();
  const [partner, setPartner] = useState<string>('');
  const [giving, setGiving] = useState<string[]>([]);
  const [receiving, setReceiving] = useState<string[]>([]);
  const [givingCash, setGivingCash] = useState<number>(0);
  const [receivingCash, setReceivingCash] = useState<number>(0);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [aiCounter, setAiCounter] = useState<string | null>(null);

  if (!state) return null;
  const userFid = state.userFranchiseId;
  const open = tradeWindowOpen(state);

  const partnerOptions = Object.keys(FRANCHISES).filter((id) => id !== userFid);

  function toggle(arr: string[], setArr: (v: string[]) => void, id: string) {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id));
    else setArr([...arr, id]);
  }

  function evaluate() {
    if (!partner || (giving.length === 0 && givingCash === 0) || (receiving.length === 0 && receivingCash === 0)) return;
    const r = evaluateTradeForAI(state!, partner, receiving, giving, receivingCash, givingCash);
    setEvalResult(r);
    if (r.countering) {
      const counter = suggestCounter(state!, partner, userFid, receiving, giving, r);
      setAiCounter(counter);
    } else setAiCounter(null);
  }

  function execute() {
    if (!partner || (giving.length === 0 && givingCash === 0) || (receiving.length === 0 && receivingCash === 0)) return;
    executeTradeAction(userFid, partner, giving, receiving, givingCash, receivingCash);
    setGiving([]); setReceiving([]); setGivingCash(0); setReceivingCash(0);
    setEvalResult(null); setAiCounter(null);
  }

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Trade Desk</h2>
        <div style={S.sectionSub}>{tradeWindowLabel(state)}</div>
      </div>

      {!open && (
        <div style={{ ...S.panel, marginBottom: 16, background: '#ecd9d9' }}>
          The trade window is currently closed. Wait for the next eligible window.
        </div>
      )}

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={S.panelTitle}>Trade Partner</div>
        <select
          value={partner}
          onChange={(e) => { setPartner(e.target.value); setGiving([]); setReceiving([]); setEvalResult(null); }}
          style={{ width: 260, padding: 8, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
        >
          <option value="">-- Pick a team --</option>
          {partnerOptions.map((id) => {
            const f = FRANCHISES[id];
            return <option key={id} value={id}>{f.city} {f.name}</option>;
          })}
        </select>
      </div>

      {partner && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <PlayerPickList
            title={`You send`}
            subtitle={`from ${FRANCHISES[userFid].name}`}
            roster={state.rosters[userFid]}
            players={state.players}
            selected={giving}
            onToggle={(id) => toggle(giving, setGiving, id)}
          />
          <PlayerPickList
            title={`You receive`}
            subtitle={`from ${FRANCHISES[partner].name}`}
            roster={state.rosters[partner]}
            players={state.players}
            selected={receiving}
            onToggle={(id) => toggle(receiving, setReceiving, id)}
          />
        </div>
      )}

      {partner && (
        <div style={{ marginTop: 16, ...S.panel }}>
          <div style={S.panelTitle}>Cash Considerations</div>
          <div style={{ ...S.byline, marginBottom: 8 }}>
            Up to $20M in cash may be attached in either direction.
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={S.eyebrow}>You send cash:</span>
              <input
                type="number"
                min={0}
                max={20_000_000}
                step={500_000}
                value={givingCash}
                onChange={(e) => setGivingCash(Math.max(0, Math.min(20_000_000, Number(e.target.value))))}
                style={{ width: 140, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}` }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={S.eyebrow}>You receive cash:</span>
              <input
                type="number"
                min={0}
                max={20_000_000}
                step={500_000}
                value={receivingCash}
                onChange={(e) => setReceivingCash(Math.max(0, Math.min(20_000_000, Number(e.target.value))))}
                style={{ width: 140, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}` }}
              />
            </label>
          </div>
        </div>
      )}

      {partner && ((giving.length > 0 || givingCash > 0) && (receiving.length > 0 || receivingCash > 0)) && (
        <div style={{ marginTop: 16, ...S.panelThick }}>
          <div style={S.panelTitle}>Evaluation</div>
          <button onClick={evaluate} style={{ ...S.radioBtn(true), background: COLORS.ink, marginRight: 8 }}>Run Evaluation</button>
          {evalResult?.accepted && open && (
            <button onClick={execute} style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }}>Execute Trade</button>
          )}
          {evalResult && (
            <div style={{ marginTop: 12 }}>
              <div style={S.eyebrow}>Result</div>
              <div style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 18,
                color: evalResult.accepted ? COLORS.green : COLORS.red,
              }}>
                {evalResult.accepted ? 'Accepted' : 'Rejected'} -- {evalResult.reason}
              </div>
              <div style={{ ...S.byline, fontSize: 13 }}>
                Their TVS evaluation: send {evalResult.givingValue} &rarr; receive {evalResult.receivingValue}
              </div>
              {aiCounter && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ ...S.badge, ...S.badgeGold }}>Counter</span>{' '}
                  They'd consider it if you also include{' '}
                  <strong>{state.players[aiCounter].firstName} {state.players[aiCounter].lastName}</strong>{' '}
                  ({state.players[aiCounter].pos}, OVR {toScout(state.players[aiCounter].ratings.overall)}).
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerPickList({
  title, subtitle, roster, players, selected, onToggle,
}: {
  title: string;
  subtitle: string;
  roster: string[];
  players: Record<string, any>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...roster]
      .map((id) => players[id])
      .filter(Boolean)
      .sort((a, b) => b.ratings.overall - a.ratings.overall);
  }, [roster, players]);
  const pickedTotalValue = selected.reduce((s, id) => s + tradeValue(players[id]), 0);

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>{title}</div>
      <div style={S.byline}>{subtitle}</div>
      <div style={{ ...S.eyebrow, marginTop: 4 }}>Total TVS: {pickedTotalValue}</div>
      <div style={{ maxHeight: 480, overflowY: 'auto', marginTop: 8 }}>
        {sorted.map((p) => {
          const checked = selected.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => onToggle(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                cursor: 'pointer', background: checked ? '#f8f2e4' : 'transparent',
                borderBottom: '1px dotted rgba(26,24,20,0.13)',
              }}
            >
              <input type="checkbox" checked={checked} readOnly />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 36 }}>
                {p.pos}
              </span>
              <span style={{ flex: 1, fontFamily: "'IBM Plex Serif', serif" }}>
                {p.firstName} {p.lastName}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.inkDim, width: 30, textAlign: 'right' }}>
                {toScout(p.ratings.overall)}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 60, textAlign: 'right' }}>
                {p.contract ? fmtShort(p.contract.salary) : '--'}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, width: 30, textAlign: 'right' }}>
                {tradeValue(p)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
