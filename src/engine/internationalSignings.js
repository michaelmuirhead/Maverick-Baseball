// International (J2) amateur signing pool.
// Each offseason on day -90 a pool of ~100 international prospects opens.
// Each team gets a bonus pool (typically ~$5-7M). Teams can sign as many
// prospects as they can fit inside their pool. Signings close on day -50.
import { FRANCHISES } from './franchises';
import { MARKETS } from './markets';
import { pickName } from './names';
import { newPlayerId, ratingFromMean } from './players';
import { effectivePhilosophy } from './trades';
const INTL_POSITIONS = ['C', 'SS', '2B', '3B', 'CF', 'LF', 'RF', '1B', 'SP', 'SP', 'RP'];
function makeProspect(rng, _yearOpen) {
    const nat = rng.weightedPick([
        { item: 'DOM', weight: 0.38 },
        { item: 'VEN', weight: 0.28 },
        { item: 'CUB', weight: 0.12 },
        { item: 'MEX', weight: 0.08 },
        { item: 'PRI', weight: 0.07 },
        { item: 'JPN', weight: 0.04 },
        { item: 'USA', weight: 0.03 },
    ]);
    const { first, last } = pickName(nat, rng);
    const age = rng.chance(0.15) ? rng.int(17, 18) : 16;
    const posRoll = rng.pick(INTL_POSITIONS);
    const pos = posRoll === 'SP' && rng.chance(0.3) ? 'RP' : posRoll;
    const isPitcher = ['SP', 'RP', 'CL'].includes(pos);
    // Tier distribution — more dispersed than domestic
    const tierRoll = rng.next();
    let mean;
    let bonus;
    if (tierRoll < 0.02) {
        mean = 50;
        bonus = rng.int(4_500_000, 7_500_000);
    } // elite
    else if (tierRoll < 0.10) {
        mean = 42;
        bonus = rng.int(2_200_000, 4_500_000);
    } // top
    else if (tierRoll < 0.35) {
        mean = 35;
        bonus = rng.int(600_000, 2_200_000);
    } // solid
    else if (tierRoll < 0.75) {
        mean = 28;
        bonus = rng.int(100_000, 700_000);
    } // speculative
    else {
        mean = 22;
        bonus = rng.int(10_000, 120_000);
    } // dart-throw
    const ratings = {};
    if (isPitcher) {
        ratings.fastball = ratingFromMean(mean, rng);
        ratings.breaking = ratingFromMean(mean, rng);
        ratings.changeup = ratingFromMean(mean - 5, rng);
        ratings.command = ratingFromMean(mean - 4, rng);
        ratings.movement = ratingFromMean(mean, rng);
        ratings.velo = Math.round(rng.normal(92, 2.5));
        ratings.stamina = ratingFromMean(pos === 'SP' ? 55 : 30, rng, 10);
        ratings.overall = Math.round(ratings.fastball * 0.25 + ratings.breaking * 0.2 + ratings.command * 0.18 + ratings.movement * 0.17 + ratings.changeup * 0.1 + ratings.stamina * 0.1);
    }
    else {
        ratings.contact = ratingFromMean(mean, rng);
        ratings.power = ratingFromMean(mean, rng);
        ratings.eye = ratingFromMean(mean - 3, rng);
        ratings.speed = ratingFromMean(mean + 3, rng);
        ratings.fielding = ratingFromMean(mean, rng);
        ratings.arm = ratingFromMean(mean, rng);
        ratings.overall = Math.round(ratings.contact * 0.24 + ratings.power * 0.22 + ratings.speed * 0.15 +
            ratings.fielding * 0.2 + ratings.arm * 0.1 + ratings.eye * 0.09);
    }
    // Potential is high — these are teenagers
    const ageRamp = Math.max(0, 22 - age) * 1.3;
    const potential = Math.min(99, ratings.overall + Math.round(ageRamp + rng.float(3, 15)));
    return {
        id: newPlayerId().replace('p_', 'i_'),
        firstName: first,
        lastName: last,
        age,
        nat,
        pos,
        isPitcher,
        ratings,
        potential,
        bonusAsk: bonus,
        signedBy: null,
        signedFor: null,
    };
}
export function startIntlSigningWindow(state, rng) {
    const prospects = [];
    const count = 100;
    for (let i = 0; i < count; i++) {
        prospects.push(makeProspect(rng, state.season));
    }
    const pools = {};
    const poolsSpent = {};
    for (const fid of Object.keys(FRANCHISES)) {
        // Smaller markets get a bigger international pool (real-MLB-ish)
        const market = MARKETS[FRANCHISES[fid].market];
        let pool = 5_500_000;
        if (market.tier === 'mega')
            pool = 4_500_000;
        else if (market.tier === 'large')
            pool = 5_200_000;
        else if (market.tier === 'mid')
            pool = 6_000_000;
        else
            pool = 6_800_000;
        pools[fid] = pool + rng.int(-400_000, 400_000);
        poolsSpent[fid] = 0;
    }
    state.intlSignings = {
        year: state.season,
        prospects,
        open: true,
        closesOn: -50,
        pools,
        poolsSpent,
    };
    state.news.unshift({
        id: `intl_open_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `International signing period opens — ${count} prospects available`,
        body: 'Each club has a J2 bonus pool to allocate across the international amateur market.',
        category: 'draft',
    });
}
/** Sign a prospect to a team. Converts the prospect to a proper Player in state.prospects. */
function materializeProspect(state, prospect, fid, bonus) {
    const player = {
        id: prospect.id,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        age: prospect.age,
        nat: prospect.nat,
        pos: prospect.pos,
        isPitcher: prospect.isPitcher,
        ratings: prospect.ratings,
        potential: prospect.potential,
        tier: 'fringe',
        franchiseId: fid,
        contract: null, // farmhand, no MLB contract yet
        health: 'healthy',
        injury: null,
        prospect: true,
    };
    state.players[player.id] = player;
    state.prospects = state.prospects || [];
    if (!state.prospects.includes(player.id))
        state.prospects.push(player.id);
    // Deduct bonus
    const fin = state.finances[fid];
    if (fin) {
        fin.teamCash -= bonus;
        fin.ledger.signingBonuses = (fin.ledger.signingBonuses || 0) + bonus;
    }
    state.intlSignings.poolsSpent[fid] = (state.intlSignings.poolsSpent[fid] || 0) + bonus;
}
export function userSignIntlProspect(state, prospectId, bonus) {
    const intl = state.intlSignings;
    if (!intl || !intl.open)
        return { ok: false, reason: 'Window closed' };
    const prospect = intl.prospects.find((p) => p.id === prospectId);
    if (!prospect || prospect.signedBy)
        return { ok: false, reason: 'Unavailable' };
    const fid = state.userFranchiseId;
    const remaining = (intl.pools[fid] || 0) - (intl.poolsSpent[fid] || 0);
    if (bonus > remaining)
        return { ok: false, reason: `Only $${Math.round(remaining / 1000)}K remaining in pool` };
    if (bonus < prospect.bonusAsk * 0.75)
        return { ok: false, reason: `${prospect.firstName} ${prospect.lastName} is asking at least $${Math.round(prospect.bonusAsk * 0.75 / 1000)}K` };
    prospect.signedBy = fid;
    prospect.signedFor = bonus;
    materializeProspect(state, prospect, fid, bonus);
    state.news.unshift({
        id: `intl_sign_${prospect.id}`,
        day: state.day,
        season: state.season,
        headline: `${FRANCHISES[fid].abbr} signs intl prospect ${prospect.firstName} ${prospect.lastName}`,
        body: `Signed for $${(bonus / 1_000_000).toFixed(2)}M out of ${prospect.nat}.`,
        category: 'fa',
    });
    return { ok: true };
}
/** AI teams allocate pool — prioritize top prospects within their tier; spread remainder. */
export function simAIIntlSigningBurst(state, rng) {
    const intl = state.intlSignings;
    if (!intl || !intl.open)
        return;
    const available = intl.prospects.filter((p) => !p.signedBy)
        .sort((a, b) => b.potential - a.potential);
    if (available.length === 0)
        return;
    // Pick a subset of prospects to sign this day — about 3-6 across the league
    const signingsToday = Math.min(available.length, rng.int(3, 7));
    for (let i = 0; i < signingsToday; i++) {
        const prospect = available[i];
        // Sort AI teams by pool remaining × appetite for this prospect
        const teams = Object.keys(FRANCHISES).filter((fid) => fid !== state.userFranchiseId);
        let best = null;
        for (const fid of teams) {
            const remaining = (intl.pools[fid] || 0) - (intl.poolsSpent[fid] || 0);
            if (remaining < prospect.bonusAsk)
                continue;
            const phil = effectivePhilosophy(state, fid);
            let weight = 1;
            if (phil === 'rebuilding' || phil === 'retooling')
                weight = 1.5;
            else if (phil === 'win_now' || phil === 'contending')
                weight = 0.7;
            // Higher potential → stronger preference
            const score = prospect.potential * weight + (remaining / prospect.bonusAsk) * 2;
            if (!best || score > best.score)
                best = { fid, score };
        }
        if (!best)
            continue;
        if (rng.chance(0.85)) {
            const bonus = Math.round(prospect.bonusAsk * rng.float(0.85, 1.15));
            const remaining = (intl.pools[best.fid] || 0) - (intl.poolsSpent[best.fid] || 0);
            const actualBonus = Math.min(bonus, remaining);
            prospect.signedBy = best.fid;
            prospect.signedFor = actualBonus;
            materializeProspect(state, prospect, best.fid, actualBonus);
        }
    }
}
export function closeIntlSigningWindow(state) {
    if (!state.intlSignings)
        return;
    state.intlSignings.open = false;
    const signed = state.intlSignings.prospects.filter((p) => p.signedBy).length;
    state.news.unshift({
        id: `intl_close_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `International signing period closes — ${signed} prospects signed`,
        body: 'Unsigned prospects return to the pool next season.',
        category: 'draft',
    });
}
