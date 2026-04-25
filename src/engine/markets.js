export const MARKETS = {
    nyc: { tier: 'mega', loyalty: 78, corp: 99 },
    la: { tier: 'mega', loyalty: 72, corp: 92 },
    chi: { tier: 'large', loyalty: 82, corp: 85 },
    dfw: { tier: 'large', loyalty: 68, corp: 80 },
    hou: { tier: 'large', loyalty: 70, corp: 82 },
    phi: { tier: 'large', loyalty: 88, corp: 72 },
    atl: { tier: 'large', loyalty: 74, corp: 78 },
    was: { tier: 'large', loyalty: 62, corp: 76 },
    bos: { tier: 'large', loyalty: 92, corp: 74 },
    bay: { tier: 'large', loyalty: 78, corp: 88 },
    phx: { tier: 'large', loyalty: 58, corp: 65 },
    det: { tier: 'mid', loyalty: 78, corp: 60 },
    sea: { tier: 'mid', loyalty: 64, corp: 82 },
    min: { tier: 'mid', loyalty: 72, corp: 66 },
    tb: { tier: 'mid', loyalty: 48, corp: 55 },
    den: { tier: 'mid', loyalty: 66, corp: 62 },
    stl: { tier: 'mid', loyalty: 94, corp: 54 },
    bal: { tier: 'mid', loyalty: 68, corp: 52 },
    sd: { tier: 'mid', loyalty: 62, corp: 58 },
    pit: { tier: 'mid', loyalty: 70, corp: 50 },
    cin: { tier: 'mid', loyalty: 72, corp: 52 },
    cle: { tier: 'mid', loyalty: 68, corp: 48 },
    kc: { tier: 'small', loyalty: 70, corp: 45 },
    mil: { tier: 'small', loyalty: 74, corp: 42 },
};
export function resetExpansionMarkets() {
    for (const id of Object.keys(MARKETS)) {
        if (id.endsWith('_mkt'))
            delete MARKETS[id];
    }
}
