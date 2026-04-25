import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';

/**
 * Banner shown when the user has been fired and has GM job offers.
 */
export function GMJobOffers() {
  const { state, acceptGMOfferAction } = useGame();
  if (!state || state.playMode !== 'gm') return null;
  if (!state.fired || !state.gmJobOffers || state.gmJobOffers.length === 0) return null;

  return (
    <div style={{ ...S.panel, marginBottom: 16, background: '#e8dfc9', borderColor: COLORS.gold, borderWidth: 2 }}>
      <div style={S.panelTitle}>You're a free-agent GM</div>
      <div style={S.byline}>
        Multiple teams have approached you. Pick a new home:
      </div>
      <div style={{ marginTop: 8 }}>
        {state.gmJobOffers.map((offer) => {
          const f = FRANCHISES[offer.franchiseId];
          if (!f) return null;
          return (
            <div
              key={offer.franchiseId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px dotted rgba(26,24,20,0.13)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17 }}>
                  {f.city} {f.name}
                </div>
                <div style={{ ...S.byline, fontSize: 12 }}>{offer.reason}</div>
                <div style={{ ...S.byline, fontSize: 11, color: COLORS.inkDim }}>
                  Starting job security: {offer.security}
                </div>
              </div>
              <button
                onClick={() => acceptGMOfferAction(offer.franchiseId)}
                style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }}
              >
                Accept
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
