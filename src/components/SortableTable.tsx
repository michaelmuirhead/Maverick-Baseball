import { useMemo, useState, type ReactNode } from 'react';
import { COLORS } from '../styles/tokens';

export type SortDir = 'asc' | 'desc';

export interface SortableColumn<T> {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  // The value used for sorting — defaults to the rendered cell if omitted.
  sortValue?: (row: T) => number | string;
  // The cell renderer.
  render: (row: T) => ReactNode;
  // If false, clicking the header does nothing.
  sortable?: boolean;
}

export interface SortableTableProps<T> {
  rows: T[];
  columns: SortableColumn<T>[];
  initialSortKey?: string;
  initialSortDir?: SortDir;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowStyle?: (row: T) => React.CSSProperties | undefined;
  emptyMessage?: string;
  maxHeight?: number;
}

export function useSortable<T>(
  rows: T[],
  columns: SortableColumn<T>[],
  initialSortKey?: string,
  initialSortDir: SortDir = 'desc',
) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey || null);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  function toggle(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return { sorted, sortKey, sortDir, toggle };
}

export function SortableTable<T>({
  rows, columns, initialSortKey, initialSortDir,
  rowKey, onRowClick, rowStyle, emptyMessage, maxHeight,
}: SortableTableProps<T>) {
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, columns, initialSortKey, initialSortDir);

  if (rows.length === 0 && emptyMessage) {
    return (
      <div style={{ padding: 16, color: COLORS.inkDim, fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sortKey === c.key;
              const sortable = c.sortable !== false && !!c.sortValue;
              return (
                <th
                  key={c.key}
                  onClick={sortable ? () => toggle(c.key) : undefined}
                  style={{
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
                  }}
                >
                  {c.label}
                  {active && (
                    <span style={{ marginLeft: 4, color: COLORS.ink }}>
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const extra = rowStyle?.(row);
            return (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  borderBottom: '1px dotted rgba(26,24,20,0.13)',
                  ...(extra || {}),
                }}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '6px 8px',
                      textAlign: c.align || 'left',
                      fontFamily: c.align === 'right' ? "'IBM Plex Mono', monospace" : undefined,
                    }}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
