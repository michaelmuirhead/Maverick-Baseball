import { NAT_WEIGHTS, pickName } from './names';
export const POSITIONS_HITTER = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
export const MLB_STRUCTURE = [
    { pos: 'C', count: 2 }, { pos: '1B', count: 1 }, { pos: '2B', count: 1 },
    { pos: '3B', count: 1 }, { pos: 'SS', count: 1 }, { pos: 'LF', count: 1 },
    { pos: 'CF', count: 1 }, { pos: 'RF', count: 1 }, { pos: 'DH', count: 1 },
    { pos: 'IF', count: 1 }, { pos: 'OF', count: 1 },
    { pos: 'SP', count: 5 }, { pos: 'RP', count: 7 }, { pos: 'CL', count: 1 },
];
let PLAYER_ID_COUNTER = 0;
export function newPlayerId() { return `p_${(++PLAYER_ID_COUNTER).toString(36)}`; }
export function resetPlayerIdCounter() { PLAYER_ID_COUNTER = 0; }
// Internal ratings: 0-99 scale (real-MLB-style scouting).
// 95+ generational, 80+ all-star, 70+ star, 60+ above avg, 50 avg.
export function ratingFromMean(mean, rng, spread = 8) {
    return Math.round(Math.max(20, Math.min(99, rng.normal(mean, spread))));
}
export function talentTier(rng) {
    const r = rng.next();
    if (r < 0.005)
        return 'legend';
    if (r < 0.05)
        return 'elite';
    if (r < 0.25)
        return 'star';
    if (r < 0.75)
        return 'solid';
    if (r < 0.95)
        return 'fringe';
    return 'org';
}
export function meanForTier(tier) {
    return {
        legend: 86,
        elite: 74,
        star: 62,
        solid: 52,
        fringe: 44,
        org: 36,
    }[tier];
}
export function genPlayer(rng, franchiseId, pos) {
    const nat = rng.weightedPick(NAT_WEIGHTS);
    const { first, last } = pickName(nat, rng);
    let position = pos;
    if (pos === 'IF')
        position = rng.pick(['2B', '3B', 'SS']);
    else if (pos === 'OF')
        position = rng.pick(['LF', 'CF', 'RF']);
    const isPitcher = ['SP', 'RP', 'CL'].includes(position);
    const tier = talentTier(rng);
    const mean = meanForTier(tier);
    const age = Math.max(20, Math.min(40, Math.round(rng.normal(28, 3.5))));
    const ratings = {};
    if (isPitcher) {
        const isRelief = position !== 'SP';
        ratings.fastball = ratingFromMean(mean + (isRelief ? 2 : 0), rng);
        ratings.breaking = ratingFromMean(mean, rng);
        ratings.changeup = ratingFromMean(isRelief ? mean - 4 : mean, rng);
        ratings.command = ratingFromMean(mean, rng);
        ratings.movement = ratingFromMean(mean, rng);
        ratings.velo = Math.round(rng.normal(isRelief ? 95 : 93, 2.5));
        ratings.stamina = ratingFromMean(isRelief ? 30 : 60, rng, 10);
        const ovr = position === 'SP'
            ? Math.round(ratings.fastball * 0.2 + ratings.breaking * 0.2 + ratings.changeup * 0.12 + ratings.command * 0.2 + ratings.movement * 0.15 + ratings.stamina * 0.13)
            : Math.round(ratings.fastball * 0.28 + ratings.breaking * 0.26 + ratings.command * 0.2 + ratings.movement * 0.16 + ratings.changeup * 0.1);
        ratings.overall = ovr;
    }
    else {
        const powerMod = ['1B', 'LF', 'RF', 'DH', '3B'].includes(position) ? 3 : -1;
        const speedMod = ['CF', 'SS', '2B'].includes(position) ? 4 : 0;
        const fieldMod = ['C', 'SS', 'CF', '2B'].includes(position) ? 4 : 0;
        ratings.contact = ratingFromMean(mean, rng);
        ratings.power = ratingFromMean(mean + powerMod, rng);
        ratings.eye = ratingFromMean(mean, rng);
        ratings.speed = ratingFromMean(mean + speedMod, rng);
        ratings.fielding = ratingFromMean(mean + fieldMod, rng);
        ratings.arm = ratingFromMean(mean + (['C', 'RF', 'SS', '3B'].includes(position) ? 4 : 0), rng);
        const off = ratings.contact * 0.28 + ratings.power * 0.26 + ratings.eye * 0.2 + ratings.speed * 0.13 + ratings.fielding * 0.07 + ratings.arm * 0.06;
        const offWeight = ['C', 'SS', 'CF'].includes(position) ? 0.55 : 0.72;
        const def = ratings.fielding * 0.55 + ratings.arm * 0.45;
        ratings.overall = Math.round(off * offWeight + def * (1 - offWeight));
    }
    const potential = Math.min(99, Math.max(ratings.overall, ratings.overall + Math.round(rng.float(0, 10) + Math.max(0, 27 - age) * 0.4)));
    // Handedness — realistic distributions
    const batsRoll = rng.next();
    const bats = isPitcher
        ? (batsRoll < 0.30 ? 'L' : 'R')
        : (batsRoll < 0.32 ? 'L' : batsRoll < 0.36 ? 'S' : 'R');
    const throws = isPitcher
        ? (rng.next() < 0.30 ? 'L' : 'R')
        : (rng.next() < 0.10 ? 'L' : 'R');
    // For pitchers: assign 2-4 specific pitch type ratings
    if (isPitcher) {
        const pitchTypes = ['curveball', 'slider', 'splitter', 'cutter', 'sinker'];
        const numPitches = rng.int(2, 4);
        const shuffled = [...pitchTypes].sort(() => rng.next() - 0.5).slice(0, numPitches);
        const baseBreaking = ratings.breaking || 50;
        for (const pt of shuffled) {
            ratings[pt] = ratingFromMean(baseBreaking + rng.int(-6, 6), rng);
        }
        if (rng.chance(0.02)) {
            ratings.knuckleball = ratingFromMean(60, rng);
        }
    }
    let contract = null;
    const serviceYears = Math.max(0, Math.min(12, age - 22 + Math.round(rng.normal(0, 1.5))));
    if (serviceYears < 3) {
        contract = { salary: 740000 + rng.int(0, 80000), years: 1, status: 'pre-arb', serviceDays: serviceYears * 172 };
    }
    else if (serviceYears < 6) {
        contract = { salary: Math.max(800000, Math.round(1_200_000 + (ratings.overall - 45) * 180_000 + rng.normal(0, 500_000))), years: 1, status: 'arb', serviceDays: serviceYears * 172 };
    }
    else {
        const years = rng.int(1, 5);
        const aav = Math.max(800000, Math.round(4_000_000 + Math.max(0, ratings.overall - 50) * 900_000 + rng.normal(0, 2_000_000)));
        contract = { salary: aav, years, status: 'extension', serviceDays: serviceYears * 172, ntc: ratings.overall >= 62 && rng.chance(0.3) };
    }
    return {
        id: newPlayerId(),
        firstName: first, lastName: last,
        age, nat,
        pos: position,
        isPitcher,
        ratings,
        potential,
        tier,
        franchiseId,
        contract,
        health: 'healthy',
        injury: null,
        bats,
        throws,
    };
}
export function genRoster(rng, franchiseId, opts = {}) {
    const players = [];
    for (const slot of MLB_STRUCTURE) {
        for (let i = 0; i < slot.count; i++)
            players.push(genPlayer(rng, franchiseId, slot.pos));
    }
    for (let i = 0; i < 2; i++)
        players.push(genPlayer(rng, franchiseId, rng.pick(POSITIONS_HITTER)));
    if (opts.isExpansion) {
        for (const p of players) {
            if (p.ratings.overall > 62) {
                const excess = p.ratings.overall - 62;
                p.ratings.overall = 62;
                if (p.ratings.contact)
                    p.ratings.contact = Math.max(35, p.ratings.contact - excess);
                if (p.ratings.power)
                    p.ratings.power = Math.max(35, p.ratings.power - excess);
                if (p.ratings.fastball)
                    p.ratings.fastball = Math.max(35, p.ratings.fastball - excess);
                if (p.ratings.breaking)
                    p.ratings.breaking = Math.max(35, p.ratings.breaking - excess);
            }
        }
    }
    return players;
}
