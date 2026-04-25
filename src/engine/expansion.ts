import type { RNG } from './rng';
import type { ExpansionConfig, League, Division } from './types';
import { FRANCHISES } from './franchises';
import { MARKETS } from './markets';

export const EXPANSION_CITIES = [
  { city: 'Nashville', state: 'TN', market: 'mid', loyaltyBase: 70, corp: 58 },
  { city: 'Charlotte', state: 'NC', market: 'mid', loyaltyBase: 62, corp: 66 },
  { city: 'Portland', state: 'OR', market: 'mid', loyaltyBase: 68, corp: 56 },
  { city: 'Las Vegas', state: 'NV', market: 'mid', loyaltyBase: 52, corp: 60 },
  { city: 'Austin', state: 'TX', market: 'large', loyaltyBase: 60, corp: 72 },
  { city: 'Salt Lake City', state: 'UT', market: 'mid', loyaltyBase: 65, corp: 52 },
  { city: 'Indianapolis', state: 'IN', market: 'mid', loyaltyBase: 68, corp: 50 },
  { city: 'Columbus', state: 'OH', market: 'mid', loyaltyBase: 64, corp: 48 },
  { city: 'Raleigh', state: 'NC', market: 'mid', loyaltyBase: 60, corp: 55 },
  { city: 'Montréal', state: 'QC', market: 'large', loyaltyBase: 72, corp: 65 },
  { city: 'Vancouver', state: 'BC', market: 'large', loyaltyBase: 68, corp: 62 },
  { city: 'San Antonio', state: 'TX', market: 'mid', loyaltyBase: 60, corp: 48 },
  { city: 'Sacramento', state: 'CA', market: 'mid', loyaltyBase: 58, corp: 52 },
  { city: 'Orlando', state: 'FL', market: 'mid', loyaltyBase: 52, corp: 56 },
  { city: 'New Orleans', state: 'LA', market: 'mid', loyaltyBase: 76, corp: 44 },
] as const;

export const EXPANSION_TEAM_NAMES = [
  'Stars', 'Knights', 'Pioneers', 'Steel', 'Monarchs', 'Explorers',
  'Voyagers', 'Falcons', 'Mavericks', 'Coyotes', 'Titans', 'Thunder',
  'Rapids', 'Lumberjacks', 'Sound', 'Capitals', 'Admirals', 'Ridgebacks',
  'Cardinals', 'Hawks', 'Legends', 'Stallions', 'Wolves', 'Surge',
];

export const EXPANSION_COLORS = [
  { primary: '#1C3144', secondary: '#D4A017' },
  { primary: '#4A5D23', secondary: '#C6A664' },
  { primary: '#6B2737', secondary: '#F1D1A1' },
  { primary: '#2D3047', secondary: '#E8871E' },
  { primary: '#1B4332', secondary: '#F4D35E' },
  { primary: '#6A1B1A', secondary: '#F3E8EE' },
  { primary: '#0F4C5C', secondary: '#E36414' },
  { primary: '#3C1642', secondary: '#FFCE51' },
  { primary: '#2E2E38', secondary: '#BCB6FF' },
  { primary: '#154734', secondary: '#FFB81C' },
];

const BALLPARK_QUALIFIERS = ['Park', 'Field', 'Stadium', 'Grounds', 'Yards', 'Ballpark'];
const BALLPARK_SPONSORS = ['Meridian', 'Summit', 'First National', 'Liberty', 'Pinnacle', 'Vanguard', 'Horizon', 'Crestview', 'Heritage', 'Ironwood'];

export function generateExpansionTeam(
  rng: RNG,
  opts: Partial<ExpansionConfig> & { excludeCities?: string[] } = {},
): ExpansionConfig {
  const cityPool = (opts.excludeCities || []).length > 0
    ? EXPANSION_CITIES.filter((c) => !opts.excludeCities!.includes(c.city))
    : EXPANSION_CITIES;
  const cityChoice = opts.city
    ? EXPANSION_CITIES.find((c) => c.city === opts.city) ?? rng.pick(cityPool as any)
    : rng.pick(cityPool as any);
  const name = opts.name || rng.pick(EXPANSION_TEAM_NAMES);
  const colors = opts.color
    ? { primary: opts.color, secondary: opts.secondaryColor || '#D4A017' }
    : rng.pick(EXPANSION_COLORS);
  const ballparkSponsor = rng.pick(BALLPARK_SPONSORS);
  const ballparkQualifier = rng.pick(BALLPARK_QUALIFIERS);
  const marketTier = opts.marketTier || (cityChoice as any).market || 'mid';

  return {
    abbr: opts.abbr || name.slice(0, 3).toUpperCase(),
    city: (cityChoice as any).city,
    state: (cityChoice as any).state,
    name,
    lg: opts.lg as League,
    div: opts.div as Division,
    color: colors.primary,
    secondaryColor: colors.secondary,
    marketTier,
    marketLoyalty: (cityChoice as any).loyaltyBase,
    marketCorp: (cityChoice as any).corp,
    park: opts.park || `${ballparkSponsor} ${ballparkQualifier}`,
    cap: opts.cap || rng.int(38000, 45000),
    premium: opts.premium || rng.int(2800, 3800),
    pf: opts.pf || rng.int(97, 103),
    amen: opts.amen || 4,
    champ: 0,
    pennants: 0,
  };
}

/** Pick the opposite league's most-symmetric division to keep alignment balanced. */
export function chooseAutoTeamSlot(userLg: League, userDiv: Division) {
  const oppLg: League = userLg === 'AL' ? 'NL' : 'AL';
  return { lg: oppLg, div: userDiv };
}

/** Register an expansion franchise in the global FRANCHISES and MARKETS maps. */
export function registerExpansionFranchise(id: string, config: ExpansionConfig) {
  const marketId = `${id}_mkt`;
  MARKETS[marketId] = {
    tier: config.marketTier,
    loyalty: config.marketLoyalty,
    corp: config.marketCorp,
  };
  FRANCHISES[id] = {
    abbr: config.abbr,
    city: config.city,
    name: config.name,
    lg: config.lg,
    div: config.div,
    color: config.color,
    market: marketId,
    park: config.park,
    cap: config.cap,
    premium: config.premium,
    pf: config.pf,
    amen: config.amen,
    champ: config.champ || 0,
    pennants: config.pennants || 0,
    expansion: true,
    secondaryColor: config.secondaryColor,
    seasonsActive: 0,
  };
}
