// Team relocation / rebranding. Player can move their franchise to a new city
// + change name + colors. Cost: $500M (relocation fees + new stadium build).
import { FRANCHISES } from './franchises';
const RELOCATION_FEE = 500_000_000;
export function relocateFranchise(state, spec) {
    const fid = state.userFranchiseId;
    const f = FRANCHISES[fid];
    if (!f)
        return { ok: false, reason: 'No franchise' };
    const fin = state.finances[fid];
    if (fin.teamCash + fin.ownerCash < RELOCATION_FEE * 0.5) {
        return { ok: false, reason: `Need at least $${Math.round(RELOCATION_FEE * 0.5 / 1e6)}M to cover relocation fees` };
    }
    if (spec.name.length < 2 || spec.abbr.length !== 3)
        return { ok: false, reason: 'Need 2+ char name and 3-char abbr' };
    const oldName = `${f.city} ${f.name}`;
    // Pay the fee
    const cashShare = Math.min(fin.teamCash, RELOCATION_FEE * 0.6);
    const ownerShare = Math.min(fin.ownerCash, RELOCATION_FEE - cashShare);
    fin.teamCash -= cashShare;
    fin.ownerCash -= ownerShare;
    fin.debt += RELOCATION_FEE - cashShare - ownerShare;
    // Apply changes to the franchise
    f.city = spec.city;
    if (spec.state)
        f.state = spec.state;
    f.name = spec.name;
    f.abbr = spec.abbr;
    f.color = spec.color;
    if (spec.secondaryColor)
        f.secondaryColor = spec.secondaryColor;
    f.park = `${spec.city} Park`;
    // Reset park factors to neutral
    f.pf = 100;
    f.pfHR = 100;
    f.pfDouble = 100;
    f.pfTriple = 100;
    f.pfBABIP = 100;
    // Mark expansion-style handicap so demand starts low
    f.expansion = true;
    f.seasonsActive = 0;
    state.news.unshift({
        id: `reloc_${fid}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${oldName} relocate, rebrand as ${spec.city} ${spec.name}`,
        body: `The franchise moves to ${spec.city}${spec.state ? ', ' + spec.state : ''} with new colors and a fresh identity. $${(RELOCATION_FEE / 1e6).toFixed(0)}M in relocation fees.`,
        category: 'league',
        involves: [fid],
    });
    return { ok: true };
}
