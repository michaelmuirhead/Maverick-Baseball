import type { CSSProperties } from 'react';
import { S, COLORS } from '../styles/tokens';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  warn?: boolean;
}

export function Stat({ label, value, delta, warn }: Props) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: warn ? COLORS.red : COLORS.ink }}>{value}</div>
      {delta && <div style={S.statDelta}>{delta}</div>}
    </div>
  );
}

export function Inline({ label, value }: { label: string; value: string | number }) {
  const row: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px dotted rgba(26,24,20,0.13)',
  };
  return (
    <div style={row}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export function grid(cols: string): CSSProperties {
  return { display: 'grid', gridTemplateColumns: cols, gap: 16 };
}
