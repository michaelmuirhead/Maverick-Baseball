export function isTwoWay(p) {
    return !!p.twoWay?.isTwoWay;
}
export function detectTwoWayCandidate(p) {
    const r = p.ratings;
    const hitterScore = ((r.contact || 0) + (r.power || 0)) / 2;
    const pitcherScore = ((r.fastball || 0) + (r.control || 0)) / 2;
    return hitterScore >= 60 && pitcherScore >= 60;
}
export function makeTwoWay(p) {
    if (!p.ratings)
        return p;
    const r = p.ratings;
    const hitterRatings = {
        contact: r.contact || 50,
        power: r.power || 50,
        eye: r.eye || 50,
        speed: r.speed || 50,
        fielding: r.fielding || 50,
        armStr: r.armStr || 50,
        overall: ((r.contact || 50) + (r.power || 50)) / 2,
    };
    const pitcherRatings = {
        fastball: r.fastball || 50,
        control: r.control || 50,
        movement: r.movement || 50,
        stamina: r.stamina || 50,
        overall: ((r.fastball || 50) + (r.control || 50)) / 2,
    };
    if (r.slider)
        pitcherRatings.slider = r.slider;
    if (r.curve)
        pitcherRatings.curve = r.curve;
    if (r.changeup)
        pitcherRatings.changeup = r.changeup;
    if (r.cutter)
        pitcherRatings.cutter = r.cutter;
    if (r.splitter)
        pitcherRatings.splitter = r.splitter;
    return {
        ...p,
        twoWay: {
            isTwoWay: true,
            hitterRatings,
            pitcherRatings,
            pitchingRole: 'SP',
            hittingDays: 0,
            pitchingDays: 0,
        },
    };
}
export function decideTwoWayUsage(p, day) {
    if (!isTwoWay(p))
        return 'hit';
    const tw = p.twoWay;
    const lastPitchedAgo = (tw.pitchingDays && tw.pitchingDays > 0) ? day - tw.pitchingDays : 99;
    if (lastPitchedAgo < 1)
        return 'rest';
    if (lastPitchedAgo >= 5)
        return 'pitch';
    return 'hit';
}
export function applyTwoWayContext(p, mode) {
    if (!isTwoWay(p))
        return p;
    const tw = p.twoWay;
    if (mode === 'pitch' && tw.pitcherRatings) {
        return { ...p, ratings: { ...p.ratings, ...tw.pitcherRatings }, isPitcher: true };
    }
    if (mode === 'hit' && tw.hitterRatings) {
        return { ...p, ratings: { ...p.ratings, ...tw.hitterRatings }, isPitcher: false };
    }
    return p;
}
export function flagTwoWayProspects(state, _rng, _maxPerLeague = 1) {
    const arr = Object.values(state.players);
    const candidates = arr.filter(p => p.prospect && detectTwoWayCandidate(p));
    if (candidates.length === 0)
        return state;
    candidates.sort((a, b) => (b.ratings.overall || 0) - (a.ratings.overall || 0));
    const chosen = candidates.slice(0, Math.min(2, candidates.length));
    const players = { ...state.players };
    for (const p of chosen) {
        players[p.id] = makeTwoWay(p);
    }
    return { ...state, players };
}
