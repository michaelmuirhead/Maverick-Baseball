export function fmtShort(n) {
    const sign = n < 0 ? '-' : '';
    const a = Math.abs(n);
    if (a >= 1e9)
        return `${sign}$${(a / 1e9).toFixed(2)}B`;
    if (a >= 1e6)
        return `${sign}$${(a / 1e6).toFixed(1)}M`;
    if (a >= 1e3)
        return `${sign}$${(a / 1e3).toFixed(0)}K`;
    return `${sign}$${a.toFixed(0)}`;
}
export function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
export function ratingClass(r) {
    if (r >= 85)
        return '#7a1f00';
    if (r >= 75)
        return '#7a4d00';
    if (r >= 60)
        return '#1f3627';
    if (r >= 50)
        return '#1a1814';
    if (r >= 40)
        return '#5f5a4d';
    return '#8a8575';
}
// Internal ratings live on a 0-99 scale; show as-is so users see real-MLB tiers.
export function toScout(r) {
    return Math.round(r);
}
export function seasonDate(day, season) {
    const base = new Date(season, 2, 28);
    const d = new Date(base.getTime() + day * 86400000);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
export function phaseLabel(p, state) {
    if (p === 'postseason' && state?.bracket) {
        if (state.bracket.champion)
            return 'Season Complete';
        const r = state.bracket.currentRound;
        return {
            wild_card: 'Wild Card Round',
            division: 'Division Series',
            lcs: 'Championship Series',
            world_series: 'World Series',
            complete: 'Postseason',
        }[r] || 'Postseason';
    }
    return { offseason: 'Offseason', regular_season: 'Regular Season', postseason: 'Postseason' }[p] || p;
}
