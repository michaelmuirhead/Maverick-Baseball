import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { fmtShort, toScout } from '../engine/format';
import { SortableTable } from '../components/SortableTable';
export function InternationalSignings() {
    const { state, signIntlAction } = useGame();
    const [search, setSearch] = useState('');
    const [offerBonus, setOfferBonus] = useState({});
    const [flash, setFlash] = useState(null);
    if (!state)
        return null;
    const intl = state.intlSignings;
    const fid = state.userFranchiseId;
    if (!intl) {
        return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "International Signings" }), _jsx("div", { style: S.sectionSub, children: "Window opens on offseason day -90" })] }), _jsx("div", { style: S.panel, children: "The J2 international signing window has not opened yet this offseason." })] }));
    }
    const poolSize = intl.pools[fid] || 0;
    const spent = intl.poolsSpent[fid] || 0;
    const remaining = poolSize - spent;
    const filteredAvail = useMemo(() => {
        return intl.prospects
            .filter((p) => !p.signedBy)
            .filter((p) => {
            if (!search)
                return true;
            const q = search.toLowerCase();
            return (p.firstName.toLowerCase().includes(q) ||
                p.lastName.toLowerCase().includes(q) ||
                p.nat.toLowerCase().includes(q) ||
                p.pos.toLowerCase().includes(q));
        });
    }, [intl.prospects, search]);
    const signed = intl.prospects.filter((p) => p.signedBy === fid);
    const availCols = [
        {
            key: 'name', label: 'Name',
            sortValue: (r) => `${r.lastName} ${r.firstName}`,
            render: (r) => _jsxs("span", { style: { fontFamily: "'IBM Plex Serif', serif" }, children: [r.firstName, " ", r.lastName] }),
        },
        { key: 'nat', label: 'Nat', sortValue: (r) => r.nat, render: (r) => r.nat, width: 52, align: 'right' },
        { key: 'pos', label: 'Pos', sortValue: (r) => r.pos, render: (r) => r.pos, width: 48, align: 'right' },
        { key: 'age', label: 'Age', sortValue: (r) => r.age, render: (r) => r.age, width: 48, align: 'right' },
        {
            key: 'ovr', label: 'OVR',
            sortValue: (r) => r.ratings.overall,
            render: (r) => toScout(r.ratings.overall), width: 52, align: 'right',
        },
        {
            key: 'pot', label: 'POT',
            sortValue: (r) => r.potential,
            render: (r) => toScout(r.potential), width: 52, align: 'right',
        },
        {
            key: 'ask', label: 'Asking',
            sortValue: (r) => r.bonusAsk,
            render: (r) => fmtShort(r.bonusAsk), width: 90, align: 'right',
        },
        {
            key: 'offer', label: 'Offer',
            sortValue: (r) => offerBonus[r.id] ?? r.bonusAsk,
            sortable: false,
            render: (r) => (_jsx("input", { type: "number", value: offerBonus[r.id] ?? r.bonusAsk, min: 0, step: 50_000, onChange: (e) => setOfferBonus({ ...offerBonus, [r.id]: Number(e.target.value) }), style: { width: 110, padding: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 } })),
            align: 'right', width: 120,
        },
        {
            key: 'sign', label: '',
            sortable: false,
            render: (r) => {
                const bonus = offerBonus[r.id] ?? r.bonusAsk;
                return (_jsx("button", { style: {
                        ...S.radioBtn(true),
                        background: bonus > remaining ? COLORS.inkDim : COLORS.ink,
                        opacity: bonus > remaining ? 0.5 : 1,
                        fontSize: 11, padding: '4px 8px',
                    }, onClick: () => {
                        const result = signIntlAction(r.id, bonus);
                        setFlash(result.ok ? `Signed ${r.firstName} ${r.lastName}` : result.reason || 'Failed');
                        setTimeout(() => setFlash(null), 3000);
                    }, children: "Sign" }));
            },
            align: 'right', width: 72,
        },
    ];
    const signedCols = [
        {
            key: 'name', label: 'Name',
            sortValue: (r) => `${r.lastName} ${r.firstName}`,
            render: (r) => `${r.firstName} ${r.lastName}`,
        },
        { key: 'nat', label: 'Nat', sortValue: (r) => r.nat, render: (r) => r.nat, width: 60, align: 'right' },
        { key: 'pos', label: 'Pos', sortValue: (r) => r.pos, render: (r) => r.pos, width: 52, align: 'right' },
        { key: 'ovr', label: 'OVR', sortValue: (r) => r.ratings.overall, render: (r) => toScout(r.ratings.overall), width: 52, align: 'right' },
        { key: 'pot', label: 'POT', sortValue: (r) => r.potential, render: (r) => toScout(r.potential), width: 52, align: 'right' },
        { key: 'paid', label: 'Bonus', sortValue: (r) => r.signedFor || 0, render: (r) => fmtShort(r.signedFor || 0), width: 100, align: 'right' },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: S.sectionRule, children: [_jsx("h2", { style: S.sectionHead, children: "International Signings" }), _jsx("div", { style: S.sectionSub, children: intl.open ? `J2 window open · closes on day ${intl.closesOn}` : 'Window closed' })] }), _jsx("div", { style: { ...S.panel, marginBottom: 16 }, children: _jsxs("div", { style: { display: 'flex', gap: 24 }, children: [_jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Bonus pool" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: fmtShort(poolSize) })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Spent" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: fmtShort(spent) })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Remaining" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22, color: remaining > 0 ? COLORS.green : COLORS.red }, children: fmtShort(remaining) })] }), _jsxs("div", { children: [_jsx("div", { style: S.eyebrow, children: "Signed" }), _jsx("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 22 }, children: signed.length })] })] }) }), flash && (_jsx("div", { style: { ...S.panel, marginBottom: 16, background: '#f8f2e4' }, children: flash })), _jsxs("div", { style: { ...S.panel, marginBottom: 16 }, children: [_jsxs("div", { style: S.panelTitle, children: ["Available prospects (", filteredAvail.length, ")"] }), _jsx("input", { placeholder: "Search by name, nationality, or position", value: search, onChange: (e) => setSearch(e.target.value), style: { width: 280, padding: 8, marginTop: 8, marginBottom: 8, fontFamily: 'inherit', border: `1px solid ${COLORS.ink}` } }), _jsx(SortableTable, { rows: filteredAvail, columns: availCols, rowKey: (r) => r.id, initialSortKey: "pot", maxHeight: 520 })] }), _jsxs("div", { style: S.panel, children: [_jsxs("div", { style: S.panelTitle, children: ["Your signings (", signed.length, ")"] }), signed.length === 0 ? (_jsx("div", { style: { color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }, children: "No international prospects signed yet." })) : (_jsx(SortableTable, { rows: signed, columns: signedCols, rowKey: (r) => r.id, initialSortKey: "pot" }))] })] }));
}
