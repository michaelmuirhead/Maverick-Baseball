import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { listSlots, saveToSlot, loadFromSlot, deleteSlot, exportToJSON, importFromJSON } from '../state/save';
import { FRANCHISES } from '../engine/franchises';
export function Settings() {
    const { state, setState } = useGame();
    const [slots, setSlots] = useState(listSlots());
    const [importText, setImportText] = useState('');
    useEffect(() => { setSlots(listSlots()); }, [state]);
    const settings = state?.settings ?? { newsVerbosity: 'all', autosave: true };
    function setNewsVerbosity(v) {
        if (!state)
            return;
        state.settings = { ...settings, newsVerbosity: v };
        setState({ ...state });
    }
    function setAutosave(v) {
        if (!state)
            return;
        state.settings = { ...settings, autosave: v };
        setState({ ...state });
    }
    function handleSaveSlot(idx) {
        if (!state)
            return;
        saveToSlot(idx, state);
        setSlots(listSlots());
        alert(`Saved to slot ${idx}`);
    }
    function handleLoadSlot(idx) {
        const s = loadFromSlot(idx);
        if (!s)
            return alert('Slot is empty');
        if (!confirm('Loading this slot will replace your current game. Continue?'))
            return;
        setState(s);
    }
    function handleDeleteSlot(idx) {
        if (!confirm(`Delete slot ${idx}?`))
            return;
        deleteSlot(idx);
        setSlots(listSlots());
    }
    function handleExport() {
        if (!state)
            return;
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
        if (!importText.trim())
            return alert('Paste JSON in the box first.');
        const s = importFromJSON(importText);
        if (!s)
            return alert('Invalid save JSON.');
        if (!confirm('Import this save? Current game will be replaced.'))
            return;
        setState(s);
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "Settings" }), _jsx("div", { style: S.sectionSub, children: "Saves, preferences, and game options" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Preferences" }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: S.eyebrow, children: "News Verbosity" }), _jsx("div", { style: { display: 'flex', gap: 6, marginTop: 4 }, children: ['all', 'team', 'major'].map((v) => (_jsx("button", { style: S.radioBtn(settings.newsVerbosity === v), onClick: () => setNewsVerbosity(v), children: v }, v))) }), _jsx("div", { style: { ...S.byline, fontSize: 11, marginTop: 4 }, children: "All = every event. Team = only your franchise. Major = only marquee league moments." })] }), _jsx("div", { style: { marginTop: 16 }, children: _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: !!settings.autosave, onChange: (e) => setAutosave(e.target.checked), style: { accentColor: COLORS.green } }), _jsx("span", { style: S.eyebrow, children: "Autosave on every action" })] }) })] }), _jsxs("div", { style: S.panel, children: [_jsx("div", { style: S.panelTitle, children: "Save Slots" }), slots.map((s) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dotted rgba(26,24,20,0.13)' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }, children: ["Slot ", s.index] }), _jsx("div", { style: S.byline, children: s.filled
                                                    ? `${s.userTeam ?? '?'} · S${s.season} · Day ${s.day}`
                                                    : 'Empty' })] }), _jsxs("div", { style: { display: 'flex', gap: 4 }, children: [_jsx("button", { onClick: () => handleSaveSlot(s.index), style: S.radioBtn(false), children: "Save Here" }), s.filled && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleLoadSlot(s.index), style: { ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }, children: "Load" }), _jsx("button", { onClick: () => handleDeleteSlot(s.index), style: { ...S.radioBtn(false), color: COLORS.red, borderColor: COLORS.red }, children: "Delete" })] }))] })] }, s.index)))] })] }), _jsxs("div", { style: { ...S.panel, marginTop: 16 }, children: [_jsx("div", { style: S.panelTitle, children: "Export / Import (JSON)" }), _jsx("div", { style: { display: 'flex', gap: 8, marginBottom: 10 }, children: _jsx("button", { onClick: handleExport, style: { ...S.radioBtn(true), background: COLORS.ink }, children: "Export current game to JSON file" }) }), _jsx("textarea", { placeholder: "Paste a previously-exported save JSON here...", value: importText, onChange: (e) => setImportText(e.target.value), style: { width: '100%', height: 120, padding: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, border: `1px solid ${COLORS.ink}`, background: COLORS.panel } }), _jsx("button", { onClick: handleImport, style: { ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold, marginTop: 8 }, children: "Import from JSON" })] })] }));
}
