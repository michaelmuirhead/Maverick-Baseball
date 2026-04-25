// User GM career: when fired, instead of game-over, the user enters a free-
// agent GM phase. Other teams that just fired their GM (or whose previous
// season was disastrous) extend offers. User picks a new team.
import { FRANCHISES } from './franchises';
/**
 * Generate 1-3 GM job offers for the user after firing. Offers come from teams
 * with bad job-security situations or that just missed playoffs in a big way.
 */
export function generateGMJobOffers(state, rng) {
    if (!state.fired)
        return;
    const fids = Object.keys(FRANCHISES).filter((fid) => fid !== state.userFranchiseId);
    // Score each team's "GM vacancy" — losing teams or those with low job security
    const candidates = fids
        .map((fid) => {
        const sd = state.standings[fid];
        const games = sd ? sd.wins + sd.losses : 0;
        const winPct = games > 0 ? sd.wins / games : 0.5;
        // Teams that finished poorly are more likely to want a new GM
        const desperation = (1 - winPct) * 100;
        return { fid, desperation };
    })
        .sort((a, b) => b.desperation - a.desperation)
        .slice(0, 6);
    // Pick 1-3 offers
    const offerCount = rng.int(1, 3);
    const offers = [];
    for (let i = 0; i < Math.min(offerCount, candidates.length); i++) {
        const c = candidates[i];
        const f = FRANCHISES[c.fid];
        const reasons = [
            `${f.city} ownership wants a fresh voice in the front office.`,
            `${f.city} is rebuilding and willing to give you a long runway.`,
            `${f.city} has the budget to swing big — they want a competitive hire.`,
            `${f.city} parted ways with their previous GM and is moving fast.`,
        ];
        offers.push({
            franchiseId: c.fid,
            reason: rng.pick(reasons),
            security: rng.int(45, 65),
        });
    }
    state.gmJobOffers = offers;
}
/** User accepts a new GM offer and takes over that franchise. */
export function acceptGMOffer(state, franchiseId) {
    if (!state.fired)
        return { ok: false, reason: 'You are still employed' };
    const offer = state.gmJobOffers?.find((o) => o.franchiseId === franchiseId);
    if (!offer)
        return { ok: false, reason: 'Offer not found' };
    state.userFranchiseId = franchiseId;
    state.fired = false;
    state.unemployedSince = undefined;
    state.gmJobOffers = undefined;
    state.jobSecurity = offer.security;
    state.userMadePlayoffs = false;
    state.news.unshift({
        id: `gm_hired_${state.season}_${franchiseId}`,
        day: state.day,
        season: state.season,
        headline: `${FRANCHISES[franchiseId].city} hires you as new GM`,
        body: `A fresh start in ${FRANCHISES[franchiseId].city}. Your owner is watching.`,
        category: 'team',
        involves: [franchiseId],
    });
    return { ok: true };
}
