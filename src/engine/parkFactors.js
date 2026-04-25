// Per-stat park factors. 100 = neutral. Higher = more of that event happens.
import { FRANCHISES } from './franchises';
export function ensureParkFactors() {
    for (const fid of Object.keys(FRANCHISES)) {
        const f = FRANCHISES[fid];
        // If the legacy single 'pf' was the only number, derive splits from it.
        if (f.pfHR === undefined) {
            const pf = f.pf || 100;
            // Hitter-friendly parks → HR + 2B factors above 100
            f.pfHR = pf >= 100 ? Math.round(100 + (pf - 100) * 1.4) : Math.round(100 - (100 - pf) * 1.2);
            f.pfDouble = Math.round(95 + (pf - 100) * 0.6);
            f.pfTriple = Math.round(95 + (pf - 100) * 1.8); // bigger gaps = more 3B
            f.pfBABIP = Math.round(100 + (pf - 100) * 0.4);
        }
    }
}
export function pfFor(franchiseId, kind) {
    const f = FRANCHISES[franchiseId];
    if (!f)
        return 100;
    switch (kind) {
        case 'HR': return f.pfHR ?? 100;
        case '2B': return f.pfDouble ?? 100;
        case '3B': return f.pfTriple ?? 100;
        case 'BABIP': return f.pfBABIP ?? 100;
    }
}
