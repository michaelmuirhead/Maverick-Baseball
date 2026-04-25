import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';

export function Splash() {
  const { setView, hasSavedGame, loadFromStorage } = useGame();
  const canResume = hasSavedGame();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 40,
      background: COLORS.paper, backgroundImage: 'radial-gradient(rgba(26, 24, 20, 0.05) 1px, transparent 1px)',
      backgroundSize: '4px 4px',
    }}>
      <div style={{ ...S.eyebrow, fontSize: 11, letterSpacing: '0.35em' }}>A Front-Office Simulation · Est. 2026</div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 72, letterSpacing: '0.01em', lineHeight: 1, textAlign: 'center', margin: '8px 0' }}>
        Maverick Baseball
      </h1>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', color: COLORS.inkDim, marginTop: 2, textAlign: 'center' }}>
        Owner · General Manager · Architect
      </div>
      <div style={{ borderBottom: `3px double ${COLORS.ink}`, width: 280, margin: '20px 0' }} />
      <p style={{ ...S.byline, fontSize: 16, textAlign: 'center', maxWidth: 540, marginBottom: 40 }}>
        Buy a ballclub. Build a front office. Shape a franchise across decades — from the amateur draft to the luxury tax,
        from the gate to the Commissioner's Trophy.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setView('new_game')}
          style={{
            padding: '14px 32px', fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
            background: COLORS.ink, color: COLORS.paper,
            border: `2px solid ${COLORS.ink}`, cursor: 'pointer',
          }}
        >
          Begin Ownership
        </button>
        {canResume && (
          <button
            onClick={() => loadFromStorage()}
            style={{
              padding: '14px 32px', fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
              background: COLORS.panel, color: COLORS.ink,
              border: `2px solid ${COLORS.ink}`, cursor: 'pointer',
            }}
          >
            Resume Saved Game
          </button>
        )}
      </div>
    </div>
  );
}
