// ============================================================
// Waiver wire / DFA
// ============================================================
// User can drop a player from their roster mid-season. Team eats 50% of
// remaining contract obligations as a hit to teamCash. Player goes to
// freeAgents pool, available for any team to claim/sign.
import { FRANCHISES } from './franchises';
export function waivePlayer(state, playerId) {
    const p = state.players[playerId];
    if (!p)
        return { ok: false, deadMoney: 0, reason: 'Player not found' };
    if (!p.franchiseId)
        return { ok: false, deadMoney: 0, reason: 'Player not on a roster' };
    const fid = p.franchiseId;
    const f = FRANCHISES[fid];
    if (!f)
        return { ok: false, deadMoney: 0, reason: 'Franchise not found' };
    // Compute dead-money obligation: 50% of remaining-year salary × years
    const yearsLeft = p.contract?.years ?? 1;
    const salary = p.contract?.salary ?? 0;
    const deadMoney = Math.round(salary * yearsLeft * 0.5);
    // Apply to ledger
    const fin = state.finances[fid];
    if (fin) {
        fin.ledger.payroll = (fin.ledger.payroll || 0) + deadMoney;
        fin.teamCash -= deadMoney;
    }
    // Remove from roster
    state.rosters[fid] = state.rosters[fid].filter((id) => id !== playerId);
    // Player becomes a free agent (sub-market asking)
    p.franchiseId = null;
    p.contract = null;
    state.freeAgents = state.freeAgents || [];
    if (!state.freeAgents.includes(playerId))
        state.freeAgents.push(playerId);
    // News
    state.news.unshift({
        id: `waive_${playerId}_${state.day}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${f.city} designate ${p.firstName} ${p.lastName} for assignment`,
        body: `${p.pos}, age ${p.age}, OVR ${p.ratings.overall}. Club eats $${(deadMoney / 1_000_000).toFixed(2)}M in dead money.`,
        category: 'team',
    });
    return { ok: true, deadMoney };
}
