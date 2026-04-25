// Shared domain types.
export type League = 'AL' | 'NL';
export type Division = 'East' | 'Central' | 'West';

export interface Market {
  tier: 'mega' | 'large' | 'mid' | 'small';
  loyalty: number;
  corp: number;
}

export interface Franchise {
  abbr: string;
  city: string;
  name: string;
  lg: League;
  div: Division;
  color: string;
  market: string;
  park: string;
  cap: number;
  premium: number;
  pf: number;
  amen: number;
  champ: number;
  pennants?: number;
  expansion?: boolean;
  secondaryColor?: string;
  state?: string;
  seasonsActive?: number;
}

export type Nationality = 'USA' | 'DOM' | 'VEN' | 'JPN' | 'CUB' | 'PRI' | 'MEX';

export type Position =
  | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH'
  | 'SP' | 'RP' | 'CL' | 'IF' | 'OF';

export interface HitterRatings {
  contact?: number;
  power?: number;
  eye?: number;
  speed?: number;
  fielding?: number;
  arm?: number;
  overall: number;
}
export interface PitcherRatings {
  fastball?: number;
  breaking?: number;
  changeup?: number;
  command?: number;
  movement?: number;
  velo?: number;
  stamina?: number;
  overall: number;
}
export type Ratings = HitterRatings & PitcherRatings;

export type ContractStatus = 'pre-arb' | 'arb' | 'extension' | 'fa';

export interface Contract {
  salary: number;
  years: number;
  status: ContractStatus;
  serviceDays: number;
  ntc?: boolean;
}

export interface Injury {
  type: string;
  severity: 'day_to_day' | 'il_10' | 'il_15' | 'il_60';
  dayStarted: number;
  season: number;
  recoversOn: number;
  ratingPenalty: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nat: Nationality;
  pos: Position;
  isPitcher: boolean;
  ratings: Ratings;
  potential: number;
  tier: 'elite' | 'star' | 'solid' | 'fringe' | 'org';
  franchiseId: string | null;
  contract: Contract | null;
  health: 'healthy' | 'day_to_day' | 'il_10' | 'il_15' | 'il_60';
  injury: Injury | null;
  prospect?: boolean;
  draftYear?: number;
  draftRound?: number;
  draftPick?: number;
  draftedBy?: string;
  // Aging + retirement
  retired?: boolean;
  retiredOn?: number;       // season retired
  // Awards & honors
  awards?: { season: number; type: AwardType; league?: League }[];
  hallOfFame?: { inducted: number };
  // Career production summary (filled by aging/awards engine over time)
  careerHigh?: number;       // best OVR ever achieved
  // Hot/cold streak modifier (-8 to +8); drifts weekly during regular season
  streakMod?: number;
}

export interface Ledger {
  ticketRev: number; premiumRev: number; concRev: number; parkRev: number; merchRev: number;
  localTV: number; natTV: number; sponsorRev: number; namingRev: number;
  payroll: number; staff: number; stadium: number; minors: number; scouting: number; analytics: number;
  medical: number; marketing: number; travel: number; debtService: number;
  attendance: number; homeGames: number;
  postseasonRev?: number;
  signingBonuses?: number;
  // Revenue-sharing & CBT lines (computed at season finalization)
  cbtTax?: number;             // luxury tax paid (expense)
  revShareIn?: number;          // revenue sharing received (revenue)
  revShareOut?: number;         // revenue sharing contributed (expense)
  ownerInjection?: number;      // owner capital injection (revenue, increases debt)
}

export interface FinanceHistoryEntry {
  year: number;
  revenue: number;
  expenses: number;
  net: number;
  endingCash: number;
  attendance: number;
  record: { w: number; l: number };
}

export interface Finance {
  teamCash: number;
  ownerCash: number;
  debt: number;
  tvValue: number;
  tvYearsLeft: number;
  nameRightsValue: number;
  nameRightsYearsLeft: number;
  sponsors: number;
  ticketPrice: number;
  premiumPrice: number;
  parkingPrice: number;
  franchiseValue: number;
  ledger: Ledger;
  history: FinanceHistoryEntry[];
}

export interface Standing {
  wins: number;
  losses: number;
  rf: number;
  ra: number;
  streak: number;
  l10: ('W' | 'L')[];
}

export interface Game {
  id: string;
  day: number;
  home: string;
  away: string;
  played: boolean;
  result?: {
    homeScore: number;
    awayScore: number;
    winner: string;
    loser: string;
    attendance: number;
  };
}

export interface NewsItem {
  id: string;
  day: number;
  season: number;
  headline: string;
  body: string;
  category: 'team' | 'league' | 'trade' | 'draft' | 'fa' | 'injury' | 'milestone';
}

export type Phase = 'offseason' | 'regular_season' | 'postseason';
export type GMPhilosophy = 'rebuilding' | 'retooling' | 'contending' | 'win_now' | 'balanced';

export interface SeedEntry {
  seed: number;
  id: string;
  wins: number;
  rd: number;
}
export interface Series {
  id: string;
  round: 'wild_card' | 'division' | 'lcs' | 'world_series';
  lg: League | 'BOTH';
  status: 'pending' | 'active' | 'complete';
  higherSeed: SeedEntry | null;
  lowerSeed: SeedEntry | null;
  sourceSeries?: string | string[];
  higherWins: number;
  lowerWins: number;
  gamesNeeded: number;
  games: {
    gameNum: number; day: number; home: string; away: string;
    homeScore: number; awayScore: number; winner: string;
  }[];
  atHigher: 'all' | '2-2-1' | '2-3-2';
  winner?: string;
  loser?: string;
  _promoted?: boolean;
}
export interface Bracket {
  seeds: Record<League, SeedEntry[]>;
  series: Record<string, Series>;
  currentRound: 'wild_card' | 'division' | 'lcs' | 'world_series' | 'complete';
  dayStarted: number;
  champion: string | null;
  _rolled?: boolean;
}

export interface DraftPick {
  round: number;
  overall: number;
  franchiseId: string;
  originalFid: string;
  playerId: string | null;
  signed: boolean;
  bonusPaid: number;
  year: number;
}
export interface DraftState {
  year: number;
  order: string[];
  pool: string[];
  picks: DraftPick[];
  currentPickIndex: number;
  complete: boolean;
  roundsTotal: number;
  teamBonusPools: Record<string, number>;
}

export interface FABid {
  franchiseId: string;
  aav: number;
  years: number;
  total: number;
  philosophy: GMPhilosophy;
  dayPlaced: number;
}
export interface FAListing {
  playerId: string;
  asking: number;
  years: number;
  bids: FABid[];
  signedBy: string | null;
  signedOn: number | null;
  declined: boolean;
  qualifyingOffer?: boolean;
}
export interface FreeAgencyState {
  year: number;
  listings: FAListing[];
  open: boolean;
  closesOn: number;
}

export type ManagerStyle = 'small_ball' | 'analytical' | 'vet_friendly' | 'balanced';

export type CoachRole = 'manager' | 'pitching_coach' | 'hitting_coach';

export interface CoachContract {
  salary: number;
  years: number;
  signedOn: number;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  role: CoachRole;
  experience: number;
  ratings: {
    tactical: number;
    development: number;
    chemistry: number;
    overall: number;
  };
  contract: CoachContract | null;
  franchiseId: string | null;
  championships: number;
  history: { season: number; franchiseId: string; record?: string; result?: string }[];
  style?: ManagerStyle;       // only meaningful for manager role
}

export interface FranchiseCoaches {
  manager: string | null;
  pitching_coach: string | null;
  hitting_coach: string | null;
}


export interface DevelopmentRecord {
  playerId: string;
  season: number;             // season the bump was applied (entering this season)
  franchiseId: string;
  coachId: string;             // coach who deserves credit
  role: CoachRole;             // which role (pitching_coach or hitting_coach)
  prePotential: number;
  postPotential: number;
  preOverall: number;
  postOverall: number;
  ageAtBump: number;
}


export type AwardType = 'mvp' | 'cy_young' | 'rookie' | 'gold_glove' | 'silver_slugger' | 'mgr_of_year';

export interface SeasonObjective {
  id: 'wins' | 'playoffs' | 'profit' | 'attendance';
  label: string;
  target: number;
  actual?: number;
  achieved?: boolean;
}

export interface OwnerObjectives {
  season: number;
  objectives: SeasonObjective[];
}

export interface GameState {
  seed: number;
  userFranchiseId: string;
  scenario: 'normal' | 'turnaround' | 'expansion';
  day: number;
  season: number;
  phase: Phase;
  players: Record<string, Player>;
  rosters: Record<string, string[]>;
  finances: Record<string, Finance>;
  standings: Record<string, Standing>;
  schedule: Game[];
  byDay: Record<number, number[]>;
  news: NewsItem[];
  gmPhilosophies: Record<string, GMPhilosophy>;
  bracket: Bracket | null;
  expansionAutoTeamFid?: string | null;
  rngState: number;
  gmDelegated: boolean;
  delegateStaffHiring?: boolean;
  draft?: DraftState | null;
  freeAgency?: FreeAgencyState | null;
  freeAgents: string[];
  prospects: string[];
  injuryLog?: { playerId: string; season: number; day: number; type: string; severity: string }[];
  coaches?: Record<string, Coach>;
  staffByFid?: Record<string, FranchiseCoaches>;
  coachPool?: string[];
  developmentHistory?: DevelopmentRecord[];
  // Awards + HoF
  awardsBySeason?: Record<number, { type: AwardType; league?: League; playerId: string; coachId?: string }[]>;
  // Objectives + job security
  jobSecurity?: number;            // 0-100
  ownerObjectives?: OwnerObjectives | null;
  fired?: boolean;
  jobSecurityHistory?: { season: number; security: number; objectives: SeasonObjective[] }[];
  userMadePlayoffs?: boolean;
  // Settings
  settings?: { newsVerbosity: 'all' | 'team' | 'major'; autosave: boolean };
}

export interface ExpansionConfig {
  abbr: string;
  city: string;
  state?: string;
  name: string;
  lg: League;
  div: Division;
  color: string;
  secondaryColor?: string;
  park: string;
  cap: number;
  premium: number;
  pf: number;
  amen: number;
  marketTier: Market['tier'];
  marketLoyalty: number;
  marketCorp: number;
  champ?: number;
  pennants?: number;
}
