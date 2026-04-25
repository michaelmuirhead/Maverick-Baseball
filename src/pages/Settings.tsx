import { useState, useEffect } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { listSlots, saveToSlot, loadFromSlot, deleteSlot, exportToJSON, importFromJSON } from '../state/save';
import type { SlotInfo } from '../state/save';
import { FRANCHISES } from '../engine/franchises';

export function Settings() {
  const { state, setState } = useGame();
  const [slots, setSlots] = useState<SlotInfo[]>(listSlots());
  const [importText, setImportText] = useState('');

  useEffect(() => { setSlots(listSlots()); }, [state]);

  const settings = state?.settings ?? { newsVerbosity: 'all' as const, autosave: true };

  function setNewsVerbosity(v: 'all' | 'team' | 'major') {
    if (!state) return;
    state.settings = { ...settings, newsVerbosity: v };
    setState({ ...state });
  }

  function setAutosave(v: boolean) {
    if (!state) return;
    state.settings = { ...settings, autosave: v };
    setState({ ...state });
  }

  function handleSaveSlot(idx: number) {
    if (!state) return;
    saveToSlot(idx, state);
    setSlots(listSlots());
    alert(`Saved to slot ${idx}`);
  }

  function handleLoadSlot(idx: number) {
    const s = loadFromSlot(idx);
    if (!s) return alert('Slot is empty');
    if (!confirm('Loading this slot will replace your current game. Continue?')) return;
    setState(s);
  }

  function handleDeleteSlot(idx: number) {
    if (!confirm(`Delete slot ${idx}?`)) return;
    deleteSlot(idx);
    setSlots(listSlots());
  }

  function handleExport() {
    if (!state) return;
    const json = exportToJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maverick-baseball-${state.season}-${FRANCHISES[state.userFranchiseId]?.abbr ?? 'save'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    if (!importText.trim()) return alert('Paste JSON in the box first.');
    const s = importFromJSON(importText);
    if (!s) return alert('Invalid save JSON.');
    if (!confirm('Import this save? Current game will be replaced.')) return;
    setState(s);
  }

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Settings</h2>
        <div style={S.sectionSub}>Saves, preferences, and game options</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Preferences</div>

          <div style={{ marginTop: 8 }}>
            <div style={S.eyebrow}>News Verbosity</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {(['all', 'team', 'major'] as const).map((v) => (
                <button key={v} style={S.radioBtn(settings.newsVerbosity === v)} onClick={() => setNewsVerbosity(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ ...S.byline, fontSize: 11, marginTop: 4 }}>
              All = every event. Team = only your franchise. Major = only marquee league moments.
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!settings.autosave}
                onChange={(e) => setAutosave(e.target.checked)}
                style={{ accentColor: COLORS.green }}
              />
              <span style={S.eyebrow}>Autosave on every action</span>
            </label>
          </div>
        </div>

        <div style={S.panel}>
          <div style={S.panelTitle}>Save Slots</div>
          {slots.map((s) => (
            <div key={s.index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>Slot {s.index}</div>
                <div style={S.byline}>
                  {s.filled
                    ? `${s.userTeam ?? '?'} · S${s.season} · Day ${s.day}`
                    : 'Empty'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => handleSaveSlot(s.index)} style={S.radioBtn(false)}>Save Here</button>
                {s.filled && (
                  <>
                    <button onClick={() => handleLoadSlot(s.index)} style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }}>Load</button>
                    <button onClick={() => handleDeleteSlot(s.index)} style={{ ...S.radioBtn(false), color: COLORS.red, borderColor: COLORS.red }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.panel, marginTop: 16 }}>
        <div style={S.panelTitle}>Export / Import (JSON)</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={handleExport} style={{ ...S.radioBtn(true), background: COLORS.ink }}>
            Export current game to JSON file
          </button>
        </div>
        <textarea
          placeholder="Paste a previously-exported save JSON here..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          style={{ width: '100%', height: 120, padding: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
        />
        <button onClick={handleImport} style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, marginTop: 8 }}>
          Import from JSON
        </button>
      </div>
    </div>
  );
}
