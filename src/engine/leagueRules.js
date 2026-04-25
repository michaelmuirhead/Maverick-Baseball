// League rule changes over time. Periodic events that toggle DH / pitch clock /
// ball type. Each affects the sim or stats subtly.
export function defaultLeagueRules() {
    return {
        dh: 'both', // current MLB
        pitchClock: true,
        ballType: 'normal',
        changes: [],
    };
}
export function ensureLeagueRules(state) {
    if (!state.leagueRules) {
        state.leagueRules = defaultLeagueRules();
    }
}
/** Once per offseason, small chance of a rule change. */
export function maybeRollRuleChange(state, rng) {
    if (!state.leagueRules)
        return;
    if (state.day !== -50)
        return; // mid-offseason
    if (!rng.chance(0.10))
        return;
    const rules = state.leagueRules;
    const r = rng.next();
    let desc = '';
    if (r < 0.35) {
        rules.ballType = rules.ballType === 'normal' ? (rng.chance(0.5) ? 'juiced' : 'dead') : 'normal';
        desc = `League adopts ${rules.ballType} ball — ${rules.ballType === 'juiced' ? 'HR rates expected to spike' : rules.ballType === 'dead' ? 'HR rates expected to drop' : 'returning to normal'}.`;
    }
    else if (r < 0.65) {
        rules.pitchClock = !rules.pitchClock;
        desc = rules.pitchClock ? 'Pitch clock reinstated league-wide.' : 'Pitch clock suspended; pace of play returns to traditional.';
    }
    else {
        if (rules.dh === 'al') {
            rules.dh = 'both';
            desc = 'Universal DH adopted: NL adds the designated hitter.';
        }
        else if (rules.dh === 'both') {
            rules.dh = 'al';
            desc = 'NL DH rolled back; pitchers hit again in the National League.';
        }
        else {
            rules.dh = 'both';
            desc = 'Designated hitter rule restored.';
        }
    }
    rules.changes.push({ season: state.season, description: desc });
    state.news.unshift({
        id: `rule_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `League rule change`,
        body: desc,
        category: 'league',
    });
}
/** Apply ball-type modifier to HR rates. */
export function ballHRMultiplier(state) {
    switch (state.leagueRules?.ballType) {
        case 'juiced': return 1.12;
        case 'dead': return 0.88;
        default: return 1.0;
    }
}
