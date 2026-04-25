// ============================================================
// Coaching staff
// ============================================================
// Three coach roles per team:
//   • manager           — sets lineups, manages bullpen → tactical + chemistry
//   • pitching coach    — develops pitchers → development (pitcher-weighted)
//   • hitting coach     — develops hitters  → development (hitter-weighted)
//
// Effects on the rest of the engine:
//   • teamStrength gets a small manager-tactical bonus (sim.ts)
//   • injury rates for pitchers reduce when pitching coach is strong (injuries.ts)
//   • at season rollover, coach development rating boosts young player potential growth (world.ts)
//
// Hiring/firing:
//   • every team starts with all 3 roles filled at world init
//   • contracts run 1–4 yrs, expire each offseason; expired coaches enter the pool
//   • user can fire any coach mid-season (pays remaining contract as buyout)
//   • AI teams fire after consistently disappointing seasons; AI rehires from pool
import { pickName, NAT_WEIGHTS } from './names';
import { FRANCHISES } from './franchises';
let COACH_ID_COUNTER = 0;
function newCoachId() { return `c_${(++COACH_ID_COUNTER).toString(36)}`; }
export function resetCoachIdCounter() { COACH_ID_COUNTER = 0; }
function ratingFromMean(mean, rng, spread = 9) {
    return Math.round(Math.max(20, Math.min(99, rng.normal(mean, spread))));
}
function computeOverall(role, ratings) {
    // Weights differ per role. A great manager can have weak development;
    // a great pitching coach can be tactically average.
    if (role === 'manager') {
        return Math.round(ratings.tactical * 0.5 + ratings.chemistry * 0.3 + ratings.development * 0.2);
    }
    // Pitching/hitting coaches: development is paramount, tactical secondary
    return Math.round(ratings.development * 0.6 + ratings.tactical * 0.25 + ratings.chemistry * 0.15);
}
export function generateCoach(rng, role) {
    const nat = rng.weightedPick(NAT_WEIGHTS);
    const { first, last } = pickName(nat, rng);
    const age = Math.max(35, Math.min(72, Math.round(rng.normal(52, 8))));
    const experience = Math.max(0, Math.min(35, age - 35 - Math.round(rng.normal(0, 3))));
    // Veteran coaches tend toward higher means
    const expBoost = Math.min(8, experience * 0.4);
    const baseMean = 50 + expBoost;
    const tactical = ratingFromMean(role === 'manager' ? baseMean + 2 : baseMean - 1, rng);
    const development = ratingFromMean(role === 'manager' ? baseMean - 2 : baseMean + 4, rng);
    const chemistry = ratingFromMean(baseMean, rng);
    const overall = computeOverall(role, { tactical, development, chemistry });
    const tier = overall >= 65 ? 'elite' : overall >= 55 ? 'star' : overall >= 45 ? 'solid' : 'fringe';
    const baseSalary = { elite: 4_500_000, star: 2_400_000, solid: 1_200_000, fringe: 700_000 }[tier];
    const style = role === 'manager'
        ? rng.pick(['small_ball', 'analytical', 'vet_friendly', 'balanced'])
        : undefined;
    return {
        id: newCoachId(),
        firstName: first,
        lastName: last,
        age,
        role,
        experience,
        ratings: { tactical, development, chemistry, overall },
        contract: null, // set when signed
        franchiseId: null,
        championships: 0,
        history: [],
        style,
    };
}
/** Sign a coach to a contract — used at hire time. */
export function signCoach(state, coachId, fid, years, salary) {
    const coach = state.coaches?.[coachId];
    if (!coach)
        return;
    const aav = salary ?? Math.max(700_000, Math.round(coach.ratings.overall ** 1.7 * 1500));
    coach.contract = { salary: aav, years, signedOn: state.season };
    coach.franchiseId = fid;
    // Remove from pool, attach to roster
    state.coachPool = (state.coachPool || []).filter((id) => id !== coachId);
    if (!state.staffByFid)
        state.staffByFid = {};
    state.staffByFid[fid] = state.staffByFid[fid] || { manager: null, pitching_coach: null, hitting_coach: null };
    state.staffByFid[fid][coach.role] = coachId;
}
/** Fire a coach — pays a buyout (remaining contract years × salary × 0.5). */
export function fireCoach(state, coachId) {
    const coach = state.coaches?.[coachId];
    if (!coach || !coach.franchiseId)
        return { ok: false, buyout: 0, reason: 'No coach found' };
    const fid = coach.franchiseId;
    const yearsLeft = coach.contract?.years || 0;
    const salary = coach.contract?.salary || 0;
    const buyout = Math.round(yearsLeft * salary * 0.5);
    // Charge ledger
    const fin = state.finances[fid];
    if (fin) {
        fin.ledger.staff = (fin.ledger.staff || 0) + buyout;
        fin.teamCash -= buyout;
    }
    // News
    state.news.unshift({
        id: `fire_${coachId}_${state.day}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${FRANCHISES[fid].city} part ways with ${coach.role.replace('_', ' ')} ${coach.firstName} ${coach.lastName}`,
        body: yearsLeft > 0
            ? `The club owes a $${(buyout / 1_000_000).toFixed(2)}M buyout on the remaining ${yearsLeft} year(s) of the contract.`
            : `Contract was set to expire — no buyout owed.`,
        category: 'team',
    });
    // Detach from team, return to pool
    if (state.staffByFid?.[fid]) {
        state.staffByFid[fid][coach.role] = null;
    }
    coach.franchiseId = null;
    coach.contract = null;
    state.coachPool = state.coachPool || [];
    if (!state.coachPool.includes(coachId))
        state.coachPool.push(coachId);
    return { ok: true, buyout };
}
/** Initialize coaches at world init: every team gets a fresh staff. */
export function initCoaches(state, rng) {
    resetCoachIdCounter();
    state.coaches = {};
    state.staffByFid = {};
    state.coachPool = [];
    for (const fid of Object.keys(FRANCHISES)) {
        const staff = { manager: null, pitching_coach: null, hitting_coach: null };
        for (const role of ['manager', 'pitching_coach', 'hitting_coach']) {
            const coach = generateCoach(rng, role);
            coach.franchiseId = fid;
            coach.contract = {
                salary: Math.max(700_000, Math.round(coach.ratings.overall ** 1.7 * 1500)),
                years: rng.int(1, 4),
                signedOn: state.season,
            };
            state.coaches[coach.id] = coach;
            staff[role] = coach.id;
        }
        state.staffByFid[fid] = staff;
    }
    // Seed the free-agent coach pool with ~20 unsigned options across roles
    for (let i = 0; i < 20; i++) {
        const role = rng.pick(['manager', 'pitching_coach', 'hitting_coach']);
        const coach = generateCoach(rng, role);
        state.coaches[coach.id] = coach;
        state.coachPool.push(coach.id);
    }
}
/** Decrement contracts at season rollover; expire coaches into the pool. */
export function rolloverCoaches(state, rng) {
    if (!state.coaches || !state.staffByFid)
        return;
    // Age coaches and decrement contracts
    for (const id of Object.keys(state.coaches)) {
        const c = state.coaches[id];
        c.age += 1;
        if (c.contract && c.franchiseId) {
            c.contract.years -= 1;
            if (c.contract.years <= 0) {
                // Contract expired — coach hits the market
                const oldFid = c.franchiseId;
                if (state.staffByFid[oldFid]) {
                    state.staffByFid[oldFid][c.role] = null;
                }
                // News for the USER team only (avoid noise)
                if (oldFid === state.userFranchiseId) {
                    const f = FRANCHISES[oldFid];
                    if (f) {
                        state.news.unshift({
                            id: `expire_${id}_${state.season}`,
                            day: state.day,
                            season: state.season,
                            headline: `${c.role.replace('_', ' ').toUpperCase()} contract expires — ${c.firstName} ${c.lastName} hits market`,
                            body: state.delegateStaffHiring
                                ? 'GM is delegated; the front office will sign a replacement automatically.'
                                : 'Visit the Staff page to hire a replacement before opening day.',
                            category: 'team',
                        });
                    }
                }
                c.franchiseId = null;
                c.contract = null;
                state.coachPool = state.coachPool || [];
                if (!state.coachPool.includes(id))
                    state.coachPool.push(id);
            }
        }
    }
    // Retire very old coaches (75+) randomly
    state.coachPool = (state.coachPool || []).filter((id) => {
        const c = state.coaches[id];
        if (!c)
            return false;
        if (c.age >= 73 && rng.chance(0.5)) {
            delete state.coaches[id];
            return false;
        }
        return true;
    });
    // AI fires underperforming staff
    aiFireStaff(state, rng);
    // Refill the pool with new entries
    const target = 20;
    while ((state.coachPool?.length || 0) < target) {
        const role = rng.pick(['manager', 'pitching_coach', 'hitting_coach']);
        const coach = generateCoach(rng, role);
        state.coaches[coach.id] = coach;
        state.coachPool.push(coach.id);
    }
    // AI re-fills empty slots
    aiHireStaff(state, rng);
}
/**
 * AI teams fire a manager after a disappointing season. Players still under
 * contract get a small chance of being fired anyway if the team finished poorly.
 */
export function aiFireStaff(state, rng) {
    for (const fid of Object.keys(FRANCHISES)) {
        if (fid === state.userFranchiseId)
            continue;
        const lastSeasonRecord = state.finances[fid]?.history?.slice(-1)[0]?.record;
        if (!lastSeasonRecord)
            continue;
        const winPct = lastSeasonRecord.w / Math.max(1, lastSeasonRecord.w + lastSeasonRecord.l);
        const staff = state.staffByFid?.[fid];
        if (!staff)
            continue;
        // <.420 → 50% chance to fire manager, 25% to fire pitching/hitting
        // <.470 → 20% manager only
        const mgrFireChance = winPct < 0.42 ? 0.5 : winPct < 0.47 ? 0.2 : 0;
        const cdFireChance = winPct < 0.42 ? 0.25 : winPct < 0.47 ? 0.08 : 0;
        if (staff.manager && rng.chance(mgrFireChance))
            fireCoach(state, staff.manager);
        if (staff.pitching_coach && rng.chance(cdFireChance))
            fireCoach(state, staff.pitching_coach);
        if (staff.hitting_coach && rng.chance(cdFireChance))
            fireCoach(state, staff.hitting_coach);
    }
}
/** Score a coach for an AI hiring decision (higher = better fit). */
function aiCoachScore(coach, role) {
    if (coach.role !== role)
        return -1;
    return coach.ratings.overall + coach.experience * 0.5 - Math.max(0, coach.age - 60);
}
/** AI teams fill empty staff slots from the pool. */
export function aiHireStaff(state, _rng) {
    for (const fid of Object.keys(FRANCHISES)) {
        // If user has delegated staff hiring, AI fills their slots too.
        if (fid === state.userFranchiseId && !state.delegateStaffHiring)
            continue;
        const staff = state.staffByFid?.[fid];
        if (!staff)
            continue;
        for (const role of ['manager', 'pitching_coach', 'hitting_coach']) {
            if (staff[role])
                continue; // slot filled
            const candidates = (state.coachPool || [])
                .map((id) => state.coaches[id])
                .filter((c) => c && c.role === role)
                .sort((a, b) => aiCoachScore(b, role) - aiCoachScore(a, role));
            if (candidates.length === 0)
                continue;
            const pick = candidates[0];
            const years = Math.max(1, Math.min(4, Math.round(pick.ratings.overall / 18)));
            signCoach(state, pick.id, fid, years);
        }
    }
}
// ---------------------------------------------------------------------------
// Effect helpers — called from sim.ts and injuries.ts
// ---------------------------------------------------------------------------
/** Manager strength bonus added to teamStrength: roughly -1.5 to +1.5. */
export function managerBonus(state, fid) {
    const mgrId = state.staffByFid?.[fid]?.manager;
    if (!mgrId)
        return -1.5; // no manager = real penalty
    const mgr = state.coaches?.[mgrId];
    if (!mgr)
        return 0;
    return (mgr.ratings.tactical - 50) / 30; // 50 → 0; 80 → +1.0; 20 → -1.0
}
/** Chemistry bonus for attendance arc — small percentage modifier. */
export function chemistryBonus(state, fid) {
    const mgrId = state.staffByFid?.[fid]?.manager;
    if (!mgrId)
        return 0;
    const mgr = state.coaches?.[mgrId];
    if (!mgr)
        return 0;
    return (mgr.ratings.chemistry - 50) / 100; // 50 → 0; 80 → +0.30 (3%)
}
/** Pitcher injury rate multiplier — 0.85 (great PC) to 1.15 (no PC). */
export function pitchingCoachInjuryMult(state, fid) {
    const pcId = state.staffByFid?.[fid]?.pitching_coach;
    if (!pcId)
        return 1.15;
    const pc = state.coaches?.[pcId];
    if (!pc)
        return 1.0;
    return Math.max(0.78, 1.0 - (pc.ratings.development - 50) / 200); // 80 dev → 0.85
}
/** Development bonus applied to young player potential at season rollover. */
export function developmentBonus(state, fid, isPitcher) {
    const role = isPitcher ? 'pitching_coach' : 'hitting_coach';
    const cid = state.staffByFid?.[fid]?.[role];
    if (!cid)
        return 0;
    const c = state.coaches?.[cid];
    if (!c)
        return 0;
    return Math.max(0, (c.ratings.development - 50) / 25); // 80 → +1.2 to potential
}
// ---------------------------------------------------------------------------
// Scouting reports
// ---------------------------------------------------------------------------
/**
 * Project the development bump a young player would receive at next rollover,
 * given their current team's coach. Returns 0 if the player wouldn't qualify.
 */
export function projectedBump(state, p) {
    if (!p.franchiseId)
        return 0;
    // The bump is applied at season rollover *after* the age increment, so the
    // gating threshold is "next-year age <= 25" — i.e. current age <= 24.
    if (p.age > 24)
        return 0;
    return developmentBonus(state, p.franchiseId, p.isPitcher);
}
/** All historical development records credited to a particular coach. */
export function coachDevelopmentLog(state, coachId) {
    return (state.developmentHistory || []).filter((r) => r.coachId === coachId);
}
/** All development records for a franchise across all coaches/seasons. */
export function franchiseDevelopmentLog(state, fid) {
    return (state.developmentHistory || []).filter((r) => r.franchiseId === fid);
}
/** Young (≤24) players on a franchise who would benefit from a bump next rollover. */
export function developableYoungPlayers(state, fid) {
    return (state.rosters[fid] || [])
        .map((pid) => state.players[pid])
        .filter((p) => p && p.age <= 24 && p.franchiseId === fid);
}
/**
 * League-wide leaderboard of top-developing coaches by total potential bump
 * delivered (sum of postPotential − prePotential across all credited bumps).
 */
export function topDevelopingCoaches(state, limit = 10) {
    const totals = {};
    for (const r of state.developmentHistory || []) {
        if (!totals[r.coachId]) {
            totals[r.coachId] = { coachId: r.coachId, bumps: 0, totalPotentialGain: 0, totalOverallGain: 0 };
        }
        totals[r.coachId].bumps += 1;
        totals[r.coachId].totalPotentialGain += r.postPotential - r.prePotential;
        totals[r.coachId].totalOverallGain += r.postOverall - r.preOverall;
    }
    return Object.values(totals).sort((a, b) => b.totalPotentialGain - a.totalPotentialGain).slice(0, limit);
}
/**
 * Compute the manager's tactical contribution numbers for a given franchise.
 * Sim and UI both call this so the displayed numbers match what actually
 * happens in games.
 */
/** Style multipliers for the three contribution channels. */
function styleMultipliers(style) {
    switch (style) {
        case 'small_ball': return { bench: 1.4, bullpen: 0.9, intangibles: 1.0 };
        case 'analytical': return { bench: 1.0, bullpen: 1.3, intangibles: 0.9 };
        case 'vet_friendly': return { bench: 0.85, bullpen: 1.0, intangibles: 1.3 };
        default: return { bench: 1.0, bullpen: 1.0, intangibles: 1.0 };
    }
}
export function computeTacticalContribution(state, fid) {
    const mgrId = state.staffByFid?.[fid]?.manager;
    const mgr = mgrId ? state.coaches?.[mgrId] : null;
    const tactical = mgr?.ratings.tactical ?? 35; // no manager = poor
    const tacticalNorm = Math.max(-1, Math.min(1, (tactical - 50) / 30));
    // Build the position-constrained lineup. The starters are the best player at
    // each of the 9 positions (C, 1B, 2B, 3B, SS, LF, CF, RF, DH); everyone else
    // is bench. This makes 'worst starter' meaningfully different from 'avg
    // starter' because catcher/SS/2B often force a lower OVR into the lineup.
    const allHitters = (state.rosters[fid] || [])
        .map((pid) => state.players[pid])
        .filter((p) => p && p.health === 'healthy' && !p.isPitcher);
    const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    const used = new Set();
    const starters = [];
    for (const pos of POSITIONS) {
        const candidates = allHitters
            .filter((p) => !used.has(p.id) && p.pos === pos)
            .sort((a, b) => b.ratings.overall - a.ratings.overall);
        if (candidates.length > 0) {
            starters.push(candidates[0]);
            used.add(candidates[0].id);
        }
    }
    const bench = allHitters.filter((p) => !used.has(p.id));
    let benchLeverage = 0;
    if (starters.length >= 8 && bench.length > 0) {
        const benchTop = Math.max(...bench.map((p) => p.ratings.overall));
        const worstStarter = Math.min(...starters.map((p) => p.ratings.overall));
        const upgrade = Math.max(0, benchTop - worstStarter);
        const pinchHitFreq = Math.max(0, 0.05 + 0.05 * tacticalNorm);
        // Contribution to teamStrength = (upgrade × freq / 8) × 0.5 weight on hitters
        benchLeverage = (upgrade * pinchHitFreq / 8) * 0.5;
    }
    const rp = (state.rosters[fid] || [])
        .map((pid) => state.players[pid])
        .filter((p) => p && p.health === 'healthy' && (p.pos === 'RP' || p.pos === 'CL'))
        .sort((a, b) => b.ratings.overall - a.ratings.overall);
    const rpTop2 = rp.slice(0, 2);
    const rpBack2 = rp.slice(2, 4);
    const rpTop2Avg = rpTop2.length > 0 ? rpTop2.reduce((s, p) => s + p.ratings.overall, 0) / rpTop2.length : 50;
    const rpBack2Avg = rpBack2.length > 0 ? rpBack2.reduce((s, p) => s + p.ratings.overall, 0) / rpBack2.length : rpTop2Avg;
    const leverageWeight = 0.5 + 0.25 * tacticalNorm;
    const flatRpAvg = (rpTop2Avg + rpBack2Avg) / 2;
    const leveragedRpAvg = rpTop2Avg * leverageWeight + rpBack2Avg * (1 - leverageWeight);
    // Contribution to teamStrength is via the 0.15 weight on relievers
    const bullpenLeverage = (leveragedRpAvg - flatRpAvg) * 0.15;
    const intangibles = managerIntangibleBonus(state, fid);
    // Apply manager-style multipliers
    const styleMgr = mgrId ? state.coaches?.[mgrId] : null;
    const sm = styleMultipliers(styleMgr?.style);
    const benchLeverageStyled = benchLeverage * sm.bench;
    const bullpenLeverageStyled = bullpenLeverage * sm.bullpen;
    const intangiblesStyled = intangibles * sm.intangibles;
    return { tactical, tacticalNorm, benchLeverage: benchLeverageStyled, bullpenLeverage: bullpenLeverageStyled, intangibles: intangiblesStyled };
}
/**
 * Small flat bonus from manager chemistry + tactical (in-game intangibles
 * that aren't captured by bench/bullpen leverage — defensive shifts,
 * baserunning calls, replay-review catches, lineup matchup choices).
 * Range roughly -0.6 to +0.6.
 */
export function managerIntangibleBonus(state, fid) {
    const mgrId = state.staffByFid?.[fid]?.manager;
    const mgr = mgrId ? state.coaches?.[mgrId] : null;
    if (!mgr)
        return -0.6;
    const tacNorm = Math.max(-1, Math.min(1, (mgr.ratings.tactical - 50) / 30));
    const chemNorm = Math.max(-1, Math.min(1, (mgr.ratings.chemistry - 50) / 30));
    return tacNorm * 0.3 + chemNorm * 0.3;
}
