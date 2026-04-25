import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { COLORS } from '../styles/tokens';
export function useSortable(rows, columns, initialSortKey, initialSortDir = 'desc') {
    const [sortKey, setSortKey] = useState(initialSortKey || null);
    const [sortDir, setSortDir] = useState(initialSortDir);
    const sorted = useMemo(() => {
        if (!sortKey)
            return rows;
        const col = columns.find((c) => c.key === sortKey);
        if (!col || !col.sortValue)
            return rows;
        const copy = [...rows];
        copy.sort((a, b) => {
            const av = col.sortValue(a);
            const bv = col.sortValue(b);
            if (av === bv)
                return 0;
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av;
            }
            const as = String(av);
            const bs = String(bv);
            return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
        });
        return copy;
    }, [rows, columns, sortKey, sortDir]);
    function toggle(key) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    }
    return { sorted, sortKey, sortDir, toggle };
}
export function SortableTable({ rows, columns, initialSortKey, initialSortDir, rowKey, onRowClick, rowStyle, emptyMessage, maxHeight, }) {
    const { sorted, sortKey, sortDir, toggle } = useSortable(rows, columns, initialSortKey, initialSortDir);
    if (rows.length === 0 && emptyMessage) {
        return (_jsx("div", { style: { padding: 16, color: COLORS.inkDim, fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic' }, children: emptyMessage }));
    }
    return (_jsx("div", { style: maxHeight ? { maxHeight, overflowY: 'auto' } : undefined, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => {
                            const active = sortKey === c.key;
                            const sortable = c.sortable !== false && !!c.sortValue;
                            return (_jsxs("th", { onClick: sortable ? () => toggle(c.key) : undefined, style: {
                                    textAlign: c.align || 'left',
                                    padding: '6px 8px',
                                    borderBottom: `1px solid ${COLORS.ink}`,
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: 11,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    color: COLORS.inkDim,
                                    cursor: sortable ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    width: c.width,
                                    background: active ? '#f8f2e4' : 'transparent',
                                }, children: [c.label, active && (_jsx("span", { style: { marginLeft: 4, color: COLORS.ink }, children: sortDir === 'asc' ? '▲' : '▼' }))] }, c.key));
                        }) }) }), _jsx("tbody", { children: sorted.map((row) => {
                        const extra = rowStyle?.(row);
                        return (_jsx("tr", { onClick: onRowClick ? () => onRowClick(row) : undefined, style: {
                                cursor: onRowClick ? 'pointer' : 'default',
                                borderBottom: '1px dotted rgba(26,24,20,0.13)',
                                ...(extra || {}),
                            }, children: columns.map((c) => (_jsx("td", { style: {
                                    padding: '6px 8px',
                                    textAlign: c.align || 'left',
                                    fontFamily: c.align === 'right' ? "'IBM Plex Mono', monospace" : undefined,
                                }, children: c.render(row) }, c.key))) }, rowKey(row)));
                    }) })] }) }));
}
