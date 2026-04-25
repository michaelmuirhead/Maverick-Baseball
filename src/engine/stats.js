// Season stat generator. Called at season finalization. Builds realistic per-
// player hitting + pitching stat lines from each player's ratings, the team's
// final record, and the position they played. Stats are stored on
// `player.statsHistory` and persist forever.
import { FRANCHISES } from './franchises';
// Derived rate scaling: rating 50 maps to roughly league-average production.
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lineupRoleAB(p, pos) {
    // Catchers play less (defensive load); regulars 130-155 G; bench 50-100 G.
    if (pos === 'C')
        return { games: 130, abPerGame: 3.6 };
    if (['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'].includes(pos)) {
        // OVR-driven games: stars play full season, fringes lose time
        const games = clamp(155 - Math.max(0, 60 - p.ratings.overall) * 2, 70, 158);
        return { games, abPerGame: 3.95 };
    }
    return { games: 80, abPerGame: 3.2 };
}
export function generateHitterStats(p, rng, teamRecord) {
    const ovr = p.ratings.overall;
    const contact = p.ratings.contact || ovr;
    const power = p.ratings.power || ovr;
    const eye = p.ratings.eye || ovr;
    const speed = p.ratings.speed || 50;
    const role = lineupRoleAB(p, p.pos);
    const G = Math.round(role.games + rng.normal(0, 6));
    const AB = Math.round(G * role.abPerGame + rng.normal(0, 8));
    // Batting avg: rating 50 = .255, rating 80 = .310, rating 95 = .345
    const avg = clamp(0.180 + (contact - 30) * 0.0028 + rng.normal(0, 0.012), 0.150, 0.395);
    const H = Math.round(AB * avg);
    // Power split: rating 50 ~ 18 HR per 600 AB, rating 80 ~ 38, 95 ~ 50
    const hrRate = clamp(0.014 + (power - 30) * 0.0009 + rng.normal(0, 0.0035), 0.005, 0.085);
    const HR = Math.round(AB * hrRate);
    const D = Math.round(H * (0.18 + rng.float(-0.03, 0.04)));
    const T = Math.round((H * 0.025) * (speed / 50) * rng.float(0.5, 1.5));
    const safeT = Math.max(0, Math.min(T, H - HR - D));
    const singles = Math.max(0, H - HR - D - safeT);
    const RBI = Math.round(HR * 2.7 + (H - HR) * 0.32 + rng.normal(0, 6));
    // Runs scored - lineup-position dependent, approximate
    const teamWinPct = (teamRecord.w + teamRecord.l) > 0 ? teamRecord.w / (teamRecord.w + teamRecord.l) : 0.5;
    const R = Math.round((H - HR) * 0.42 + HR + rng.normal(0, 6) + (teamWinPct - 0.5) * 25);
    const BB = Math.round(AB * clamp(0.055 + (eye - 50) * 0.0014, 0.025, 0.165) + rng.normal(0, 4));
    // K rate: high power, low contact = more Ks
    const kRate = clamp(0.21 + (power - 50) * 0.0010 - (contact - 50) * 0.0022, 0.10, 0.32);
    const SO = Math.round(AB * kRate + rng.normal(0, 6));
    const SB = Math.round(Math.max(0, (speed - 50) * 0.6 + rng.normal(0, 4)) * (G / 162));
    const PA = AB + BB;
    const OBP = PA > 0 ? (H + BB) / PA : 0;
    const TB = singles + 2 * D + 3 * safeT + 4 * HR;
    const SLG = AB > 0 ? TB / AB : 0;
    const OPS = OBP + SLG;
    return {
        G: Math.max(0, G), AB: Math.max(0, AB), R: Math.max(0, R), H: Math.max(0, H),
        D: Math.max(0, D), T: safeT, HR: Math.max(0, HR), RBI: Math.max(0, RBI),
        BB: Math.max(0, BB), SO: Math.max(0, SO), SB: Math.max(0, SB),
        AVG: Math.round(avg * 1000) / 1000,
        OBP: Math.round(OBP * 1000) / 1000,
        SLG: Math.round(SLG * 1000) / 1000,
        OPS: Math.round(OPS * 1000) / 1000,
    };
}
export function generatePitcherStats(p, rng, teamRecord) {
    const ovr = p.ratings.overall;
    const command = p.ratings.command || ovr;
    const stamina = p.ratings.stamina || (p.pos === 'SP' ? 60 : 30);
    const isSP = p.pos === 'SP';
    const isRP = p.pos === 'RP' || p.pos === 'CL';
    const isCloser = p.pos === 'CL';
    let G = 0, GS = 0, IP = 0;
    if (isSP) {
        GS = Math.round(clamp(31 - Math.max(0, 60 - ovr) * 0.4 + rng.normal(0, 2), 6, 34));
        G = GS;
        const ipPerStart = clamp(5.5 + (stamina - 50) * 0.04 + rng.normal(0, 0.3), 3.5, 7.5);
        IP = Math.round(GS * ipPerStart);
    }
    else if (isRP) {
        G = Math.round(clamp(60 + rng.normal(0, 10), 30, 80));
        IP = Math.round(G * (isCloser ? 1.0 : 1.15));
    }
    if (IP <= 0)
        return { G: 0, GS: 0, W: 0, L: 0, SV: 0, IP: 0, H: 0, ER: 0, BB: 0, SO: 0, HR: 0, ERA: 0, WHIP: 0 };
    // ERA target by rating: 50 ~ 4.50, 70 ~ 3.30, 85 ~ 2.40, 95 ~ 1.95
    const era = clamp(6.8 - (ovr - 30) * 0.062 + rng.normal(0, 0.40), 1.65, 7.0);
    const ER = Math.round(era * IP / 9);
    // WHIP target: rating 50 ~ 1.35, 70 ~ 1.18, 85 ~ 1.05, 95 ~ 0.95
    const whip = clamp(1.55 - (ovr - 30) * 0.0093 + rng.normal(0, 0.05), 0.85, 1.70);
    const baserunners = Math.round(whip * IP);
    const BB = Math.round(baserunners * (0.32 + (60 - command) * 0.003) + rng.normal(0, 3));
    const H = Math.max(0, baserunners - BB);
    // K rate: scales with overall + breaking + fastball
    const fastball = p.ratings.fastball || ovr;
    const breaking = p.ratings.breaking || ovr;
    const kPer9 = clamp(6.5 + ((fastball + breaking) / 2 - 40) * 0.11 + rng.normal(0, 0.5), 4, 13);
    const SO = Math.round(IP * kPer9 / 9);
    const HR = Math.round(IP * clamp(1.5 - (ovr - 30) * 0.012, 0.4, 2.2) / 9 + rng.normal(0, 1));
    // W/L for SP based on team performance + ERA
    const teamPct = (teamRecord.w + teamRecord.l) > 0 ? teamRecord.w / (teamRecord.w + teamRecord.l) : 0.5;
    let W = 0, L = 0, SV = 0;
    if (isSP) {
        const decisions = Math.round(GS * 0.65);
        W = Math.round(decisions * clamp(teamPct + (50 - era * 6) / 100, 0.25, 0.78));
        L = Math.max(0, decisions - W);
    }
    else if (isRP) {
        W = Math.round(rng.int(2, 7));
        L = Math.round(rng.int(2, 6));
        if (isCloser)
            SV = Math.round(clamp(35 - (5 - era) * -3 + rng.normal(0, 4), 5, 50));
        else if (ovr >= 60)
            SV = Math.round(rng.int(0, 5));
    }
    return {
        G, GS,
        W: Math.max(0, W), L: Math.max(0, L), SV: Math.max(0, SV),
        IP,
        H: Math.max(0, H), ER: Math.max(0, ER),
        BB: Math.max(0, BB), SO: Math.max(0, SO), HR: Math.max(0, HR),
        ERA: Math.round(era * 100) / 100,
        WHIP: Math.round(whip * 100) / 100,
    };
}
/**
 * Run after season finalization. Generates stat lines for every player on a
 * roster + appends to player.statsHistory.
 */
export function generateSeasonStats(state, rng) {
    for (const fid of Object.keys(FRANCHISES)) {
        const standing = state.standings[fid];
        if (!standing)
            continue;
        const record = { w: standing.wins, l: standing.losses };
        for (const pid of state.rosters[fid] || []) {
            const p = state.players[pid];
            if (!p || p.retired)
                continue;
            const entry = {
                season: state.season,
                franchiseId: fid,
            };
            if (p.isPitcher) {
                entry.pitcher = generatePitcherStats(p, rng, record);
            }
            else {
                entry.hitter = generateHitterStats(p, rng, record);
            }
            p.statsHistory = p.statsHistory || [];
            // Replace any existing entry for this season (re-runs shouldn't duplicate)
            p.statsHistory = p.statsHistory.filter((s) => s.season !== state.season);
            p.statsHistory.push(entry);
        }
    }
}
/** Compute career totals from statsHistory. */
export function careerHitterTotals(p) {
    const entries = (p.statsHistory || []).filter((s) => s.hitter).map((s) => s.hitter);
    if (entries.length === 0)
        return null;
    const sum = entries.reduce((a, b) => ({
        G: a.G + b.G, AB: a.AB + b.AB, R: a.R + b.R, H: a.H + b.H,
        D: a.D + b.D, T: a.T + b.T, HR: a.HR + b.HR, RBI: a.RBI + b.RBI,
        BB: a.BB + b.BB, SO: a.SO + b.SO, SB: a.SB + b.SB,
        AVG: 0, OBP: 0, SLG: 0, OPS: 0,
    }), { G: 0, AB: 0, R: 0, H: 0, D: 0, T: 0, HR: 0, RBI: 0, BB: 0, SO: 0, SB: 0, AVG: 0, OBP: 0, SLG: 0, OPS: 0 });
    sum.AVG = sum.AB ? Math.round((sum.H / sum.AB) * 1000) / 1000 : 0;
    const TB = (sum.H - sum.D - sum.T - sum.HR) + 2 * sum.D + 3 * sum.T + 4 * sum.HR;
    sum.SLG = sum.AB ? Math.round((TB / sum.AB) * 1000) / 1000 : 0;
    const PA = sum.AB + sum.BB;
    sum.OBP = PA ? Math.round(((sum.H + sum.BB) / PA) * 1000) / 1000 : 0;
    sum.OPS = Math.round((sum.OBP + sum.SLG) * 1000) / 1000;
    return sum;
}
export function careerPitcherTotals(p) {
    const entries = (p.statsHistory || []).filter((s) => s.pitcher).map((s) => s.pitcher);
    if (entries.length === 0)
        return null;
    const sum = entries.reduce((a, b) => ({
        G: a.G + b.G, GS: a.GS + b.GS, W: a.W + b.W, L: a.L + b.L,
        SV: a.SV + b.SV, IP: a.IP + b.IP, H: a.H + b.H, ER: a.ER + b.ER,
        BB: a.BB + b.BB, SO: a.SO + b.SO, HR: a.HR + b.HR,
        ERA: 0, WHIP: 0,
    }), { G: 0, GS: 0, W: 0, L: 0, SV: 0, IP: 0, H: 0, ER: 0, BB: 0, SO: 0, HR: 0, ERA: 0, WHIP: 0 });
    sum.ERA = sum.IP ? Math.round((sum.ER * 9 / sum.IP) * 100) / 100 : 0;
    sum.WHIP = sum.IP ? Math.round(((sum.H + sum.BB) / sum.IP) * 100) / 100 : 0;
    return sum;
}
