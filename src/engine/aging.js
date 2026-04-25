// ============================================================
// Player aging curves
// ============================================================
// Applied at season rollover after development bumps. Models the realistic
// arc of a baseball career:
//   • Hitters peak 26-29, gentle decline at 30+, steeper at 33+, falls off cliff at 36+
//   • Pitchers peak 27-30, decline at 31+, steeper at 34+, command holds longer than velo
//   • Speed declines fastest, power second, contact slowest for hitters
//   • Velocity declines for pitchers; command degrades less
//   • Players with overall < 32 at age 39+ retire automatically
//   • Late bloomers (rare): some players see a one-year boost in their late 20s
import { FRANCHISES } from './franchises';
/** Returns a multiplier to apply to ratings based on age + position type. */
function ageMultiplier(age, isPitcher) {
    if (isPitcher) {
        if (age <= 24)
            return 1.005; // gentle rise for young arms
        if (age <= 30)
            return 1.0; // peak window
        if (age <= 33)
            return 0.985; // -1.5%/yr
        if (age <= 35)
            return 0.97; // -3.0%/yr
        if (age <= 37)
            return 0.95;
        return 0.92; // 38+ steep decline
    }
    // Hitters
    if (age <= 25)
        return 1.005;
    if (age <= 29)
        return 1.0;
    if (age <= 32)
        return 0.99;
    if (age <= 34)
        return 0.975;
    if (age <= 36)
        return 0.955;
    return 0.92;
}
/**
 * Apply aging to all players. Called once per season-end rollover.
 * Returns count of retirements.
 */
export function ageAllPlayers(state, rng) {
    let aged = 0, retired = 0, bloomed = 0;
    for (const pid of Object.keys(state.players)) {
        const p = state.players[pid];
        if (p.retired)
            continue;
        if (p.prospect)
            continue; // prospects in minors don't age the same way
        const wasOVR = p.ratings.overall;
        const mult = ageMultiplier(p.age, p.isPitcher);
        // Apply age-rating decay/growth
        if (p.isPitcher) {
            // Velo declines first
            if (p.ratings.velo)
                p.ratings.velo = Math.max(70, Math.round(p.ratings.velo * (mult > 1 ? 1.001 : (mult + 0.005))));
            if (p.ratings.fastball)
                p.ratings.fastball = Math.round(Math.max(20, p.ratings.fastball * mult));
            if (p.ratings.breaking)
                p.ratings.breaking = Math.round(Math.max(20, p.ratings.breaking * Math.max(mult, 0.95)));
            if (p.ratings.changeup)
                p.ratings.changeup = Math.round(Math.max(20, p.ratings.changeup * Math.max(mult, 0.96)));
            // Command holds longer
            if (p.ratings.command)
                p.ratings.command = Math.round(Math.max(20, p.ratings.command * (mult > 1 ? mult : Math.max(mult + 0.01, 0.96))));
            if (p.ratings.movement)
                p.ratings.movement = Math.round(Math.max(20, p.ratings.movement * mult));
            if (p.ratings.stamina)
                p.ratings.stamina = Math.round(Math.max(15, p.ratings.stamina * mult));
        }
        else {
            // Speed declines fastest
            if (p.ratings.speed)
                p.ratings.speed = Math.round(Math.max(20, p.ratings.speed * Math.min(mult, 0.99)));
            // Power second
            if (p.ratings.power)
                p.ratings.power = Math.round(Math.max(20, p.ratings.power * Math.max(mult, 0.93)));
            // Contact slowest
            if (p.ratings.contact)
                p.ratings.contact = Math.round(Math.max(20, p.ratings.contact * Math.max(mult, 0.95)));
            if (p.ratings.eye)
                p.ratings.eye = Math.round(Math.max(20, p.ratings.eye * (mult > 1 ? mult : Math.max(mult + 0.015, 0.96))));
            if (p.ratings.fielding)
                p.ratings.fielding = Math.round(Math.max(20, p.ratings.fielding * Math.max(mult, 0.94)));
            if (p.ratings.arm)
                p.ratings.arm = Math.round(Math.max(20, p.ratings.arm * Math.max(mult, 0.95)));
        }
        // Recompute overall rating from component pieces
        p.ratings.overall = Math.max(20, Math.round(p.ratings.overall * mult));
        // Late-bloomer rule: very young players sometimes spike (rare, 2% chance for age 24-26)
        if (!p.isPitcher && p.age >= 24 && p.age <= 26 && rng.chance(0.02)) {
            const bump = rng.int(2, 5);
            p.ratings.overall = Math.min(99, p.ratings.overall + bump);
            p.potential = Math.min(99, Math.max(p.potential, p.ratings.overall));
            bloomed++;
            if (p.franchiseId) {
                const f = FRANCHISES[p.franchiseId];
                if (f) {
                    state.news.unshift({
                        id: `bloom_${pid}_${state.season}`,
                        day: state.day,
                        season: state.season,
                        headline: `${f.city}'s ${p.firstName} ${p.lastName} takes a leap`,
                        body: `Coaches praise the offseason work; OVR climbs ${bump} points.`,
                        category: 'team',
                    });
                }
            }
        }
        // Track career-high
        p.careerHigh = Math.max(p.careerHigh ?? 0, p.ratings.overall);
        // Retirement check
        const minOVR = p.isPitcher ? 32 : 30;
        if (p.age >= 39 ||
            (p.age >= 36 && p.ratings.overall < minOVR + 6) ||
            p.ratings.overall < minOVR) {
            // Retire
            retirePlayer(state, p);
            retired++;
        }
        if (Math.abs(p.ratings.overall - wasOVR) > 0)
            aged++;
    }
    return { aged, retired, bloomed };
}
function retirePlayer(state, p) {
    p.retired = true;
    p.retiredOn = state.season;
    // Remove from any roster
    if (p.franchiseId && state.rosters[p.franchiseId]) {
        state.rosters[p.franchiseId] = state.rosters[p.franchiseId].filter((id) => id !== p.id);
    }
    // Remove from FA pool / prospects too
    state.freeAgents = (state.freeAgents || []).filter((id) => id !== p.id);
    state.prospects = (state.prospects || []).filter((id) => id !== p.id);
    p.franchiseId = null;
    p.contract = null;
    // News for notable retirements (career-high OVR ≥ 60)
    if ((p.careerHigh ?? p.ratings.overall) >= 60) {
        state.news.unshift({
            id: `retire_${p.id}_${state.season}`,
            day: state.day,
            season: state.season,
            headline: `${p.firstName} ${p.lastName} announces retirement`,
            body: `${p.age}-year-old ${p.isPitcher ? 'pitcher' : 'hitter'} ends career. Peak OVR: ${p.careerHigh ?? p.ratings.overall}.`,
            category: 'milestone',
        });
    }
}
