// Owner profiles per franchise + periodic owner changes (franchise sales).
// Owner style affects FA bid aggressiveness, payroll discipline, and the
// pressure put on the GM/team via objectives.
import { FRANCHISES } from './franchises';
const FIRST_NAMES = ['Marcus', 'David', 'Steven', 'Robert', 'Jennifer', 'Lisa', 'Richard', 'Thomas', 'Karen', 'Patricia', 'Charles', 'Mark', 'Susan', 'Joseph', 'Andrew', 'Frank'];
const LAST_NAMES = ['Westwood', 'Halloran', 'Marchetti', 'Goldstein', 'Vaughn', 'Carrigan', 'Whitfield', 'Dempsey', 'Sandoval', 'Kowalski', 'Brennan', 'Patel', 'Fitzgerald', 'Yamamoto'];
export function generateOwner(rng, season) {
    const r = rng.next();
    const style = r < 0.30 ? 'cheap' : r < 0.75 ? 'balanced' : 'spendthrift';
    const patience = style === 'cheap' ? rng.int(20, 50)
        : style === 'spendthrift' ? rng.int(35, 70)
            : rng.int(45, 80);
    return {
        name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
        style,
        acquiredSeason: season,
        patience,
    };
}
export function initOwnerProfiles(state, rng) {
    state.ownerProfiles = state.ownerProfiles || {};
    for (const fid of Object.keys(FRANCHISES)) {
        if (!state.ownerProfiles[fid]) {
            state.ownerProfiles[fid] = generateOwner(rng, state.season);
        }
    }
}
/** Run yearly chance of franchise sale per team. ~3% chance per team per year. */
export function maybeRollOwnerChanges(state, rng) {
    if (!state.ownerProfiles)
        return;
    for (const fid of Object.keys(FRANCHISES)) {
        if (fid === state.userFranchiseId)
            continue; // user is the owner
        const owner = state.ownerProfiles[fid];
        if (!owner)
            continue;
        const yearsHeld = state.season - owner.acquiredSeason;
        if (yearsHeld < 4)
            continue;
        if (rng.chance(0.03)) {
            const next = generateOwner(rng, state.season);
            state.ownerProfiles[fid] = next;
            const f = FRANCHISES[fid];
            state.news.unshift({
                id: `sale_${fid}_${state.season}`,
                day: state.day,
                season: state.season,
                headline: `${f.city} ${f.name} sold to new ownership`,
                body: `${next.name} group buys the club; new ownership is ${next.style}.`,
                category: 'team',
                involves: [fid],
            });
        }
    }
}
/** Aggressiveness multiplier for FA bidding. */
export function ownerBidMultiplier(state, fid) {
    const o = state.ownerProfiles?.[fid];
    if (!o)
        return 1.0;
    if (o.style === 'spendthrift')
        return 1.18;
    if (o.style === 'cheap')
        return 0.82;
    return 1.0;
}
