import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
/**
 * Banner shown when the user has been fired and has GM job offers.
 */
export function GMJobOffers() {
    const { state, acceptGMOfferAction } = useGame();
    if (!state || state.playMode !== 'gm')
        return null;
    if (!state.fired || !state.gmJobOffers || state.gmJobOffers.length === 0)
        return null;
    return (_jsxs("div", { style: { ...S.panel, marginBottom: 16, background: '#e8dfc9', borderColor: COLORS.gold, borderWidth: 2 }, children: [_jsx("div", { style: S.panelTitle, children: "You're a free-agent GM" }), _jsx("div", { style: S.byline, children: "Multiple teams have approached you. Pick a new home:" }), _jsx("div", { style: { marginTop: 8 }, children: state.gmJobOffers.map((offer) => {
                    const f = FRANCHISES[offer.franchiseId];
                    if (!f)
                        return null;
                    return (_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '8px 0',
                            borderBottom: '1px dotted rgba(26,24,20,0.13)',
                        }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontFamily: "'DM Serif Display', serif", fontSize: 17 }, children: [f.city, " ", f.name] }), _jsx("div", { style: { ...S.byline, fontSize: 12 }, children: offer.reason }), _jsxs("div", { style: { ...S.byline, fontSize: 11, color: COLORS.inkDim }, children: ["Starting job security: ", offer.security] })] }), _jsx("button", { onClick: () => acceptGMOfferAction(offer.franchiseId), style: { ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green }, children: "Accept" })] }, offer.franchiseId));
                }) })] }));
}
