import { COLORS } from '../styles/tokens';
import { ratingClass, toScout } from '../engine/format';

export function RatingBar({ label, v }: { label: string; v?: number }) {
  if (v == null) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 90, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(26,24,20,0.1)' }}>
        <div style={{ width: `${(v / 80) * 100}%`, height: 6, background: ratingClass(v) }} />
      </div>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, width: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{toScout(v)}</span>
    </div>
  );
}
