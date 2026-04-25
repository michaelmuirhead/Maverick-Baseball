export type League = 'AL' | 'NL';
export type Division = 'East' | 'Central' | 'West';

export interface Market { tier: 'mega' | 'large' | 'mid' | 'small'; loyalty: number; corp: number; }

export interface Franchise {
  abbr: string; city: string; name: string;
  lg: League; div: Division; color: string;
  market: string; park: string;
  cap: number; premium: number; pf: number; amen: number;
  // Per-stat park factors. 100 = neutral. >100 favors hitters of that type.
  pfHR?: number;
  pfDouble?: number;
  pfTriple?: number;
  pfBABIP?: number;
  champ: number; pennants?: number;
  expansion?: boolean; secondaryColor?: string; state?: string;
  seasonsActive?: number;
}

export type Nationality = 'USA' | 'DOM' | 'VEN' | 'JPN' | 'CUB' | 'PRI' | 'MEX';
export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP' | 'CL' | 'IF' | 'OF';

export interface HitterRatings { contact?: number; power?: number; eye?: number; speed?: number; fielding?: number; arm?: number; overall: number; }
export interface PitcherRatings {
  fastball?: number; breaking?: number; changeup?: number;
  command?: number; movement?: number; velo?: number; stamina?: number;
  // Specific pitch types — pitchers carry 2-4 of these
  curveball?: number; slider?: number; splitter?: number; cutter?: number; knuckleball?: number; sinker?: number;
  overall: number;
}
export type Handedness = 'L' | 'R' | 'S';     // S = switch (hitters only)
export type Ratings = HitterRatings & PitcherRatings;

export type ContractStatus = 'pre-arb' | 'arb' | 'extension' | 'fa';
export interface Contract { salary: number; years: number; status: ContractStatus; serviceDays: number; ntc?: boolean; }

export interface Injury {
  type: string;
  severity: 'day_to_day' | 'il_10' | 'il_15' | 'il_60';
  dayStarted: number; season: number; recoversOn: number; ratingPenalty: number;
}

export interface HitterStats {
  G: number; AB: number; R: number; H: number;
  D: number; T: number; HR: number; RBI: number;
  BB: number; SO: number; SB: number;
  AVG: number; OBP: number; SLG: number; OPS: number;
  // Advanced
  BABIP?: number;
  ISO?: number;
  wOBA?: number;
  OPSplus?: number;
  WAR?: number;
}

export interface SplitLine {
  AB: number; H: number; HR: number; BB: number; SO: number;
  AVG: number; OBP: number; SLG: number; OPS: number;
}

export interface HitterSplits {
  vsL?: SplitLine; vsR?: SplitLine;
  home?: SplitLine; away?: SplitLine;
  byMonth?: Record<number, SplitLine>;       // month index 1-6 (Apr-Sep)
}

export interface PitcherSplitLine {
  IP: number; H: number; ER: number; BB: number; SO: number; HR: number;
  ERA: number; WHIP: number;
}

export interface PitcherSplits {
  vsL?: PitcherSplitLine; vsR?: PitcherSplitLine;
  home?: PitcherSplitLine; away?: PitcherSplitLine;
  byMonth?: Record<number, PitcherSplitLine>;
}
export interface PitcherStats {
  G: number; GS: number; W: number; L: number; SV: number;
  IP: number; H: number; ER: number; BB: number; SO: number; HR: number;
  ERA: number; WHIP: number;
  // Advanced
  FIP?: number;
  ERAplus?: number;
  WAR?: number;
  K9?: number;
  BB9?: number;
}
export interface SeasonStats {
  season: number;
  franchiseId: string;
  hitter?: HitterStats;
  pitcher?: PitcherStats;
  hitterSplits?: HitterSplits;
  pitcherSplits?: PitcherSplits;
  postseason?: { hitter?: HitterStats; pitcher?: PitcherStats };
  pitcherFatigue?: { lastAppearanceDay: number; consecutiveDays: number; seasonIP: number };
}

export interface Player {
  id: string;
  firstName: string; lastName: string;
  age: number; nat: Nationality; pos: Position;
  isPitcher: boolean;
  ratings: Ratings;
  potential: number;
  tier: 'legend' | 'elite' | 'star' | 'solid' | 'fringe' | 'org';
  franchiseId: string | null;
  contract: Contract | null;
  health: 'healthy' | 'day_to_day' | 'il_10' | 'il_15' | 'il_60';
  injury: Injury | null;
  prospect?: boolean;
  bats?: Handedness;
  throws?: Exclude<Handedness, 'S'>;
  bullpenRole?: 'closer' | 'setup' | 'middle' | 'loogy';
  morale?: number;                // 0-100; 50 neutral
  demands?: { wantsRole?: string; wantsPlayingTime?: boolean; wantsExtension?: boolean };
  optionsUsed?: number;           // 0-3 minor-league option years used
  onFortyMan?: boolean;           // included on protected 40-man roster
  fatigue?: { lastAppearance: number; consecutiveDays: number; pitchCount: number };
  draftYear?: number; draftRound?: number; draftPick?: number; draftedBy?: string;
  retired?: boolean; retiredOn?: number;
  awards?: { season: number; type: AwardType; league?: League }[];
  hallOfFame?: { inducted: number };
  careerHigh?: number;
  streakMod?: number;
  statsHistory?: SeasonStats[];
}

export interface Ledger {
  ticketRev: number; premiumRev: number; concRev: number; parkRev: number; merchRev: number;
  localTV: number; natTV: number; sponsorRev: number; namingRev: number;
  payroll: number; staff: number; stadium: number; minors: number; scouting: number; analytics: number;
  medical: number; marketing: number; travel: number; debtService: number;
  attendance: number; homeGames: number;
  postseasonRev?: number; signingBonuses?: number;
  cbtTax?: number; revShareIn?: number; revShareOut?: number; ownerInjection?: number;
}

export interface FinanceHistoryEntry {
  year: number; revenue: number; expenses: number; net: number;
  endingCash: number; attendance: number;
  record: { w: number; l: number };
}

export interface Finance {
  teamCash: number; ownerCash: number; debt: number;
  tvValue: number; tvYearsLeft: number;
  nameRightsValue: number; nameRightsYearsLeft: number;
  sponsors: number;
  ticketPrice: number; premiumPrice: number; parkingPrice: number;
  franchiseValue: number;
  ledger: Ledger;
  history: FinanceHistoryEntry[];
}

export interface Standing { wins: number; losses: number; rf: number; ra: number; streak: number; l10: ('W' | 'L')[]; }

export interface Game {
  id: string; day: number; home: string; away: string; played: boolean;
  result?: { homeScore: number; awayScore: number; winner: string; loser: string; attendance: number };
}

export interface NewsItem {
  id: string; day: number; season: number;
  headline: string; body: string;
  category: 'team' | 'league' | 'trade' | 'draft' | 'fa' | 'injury' | 'milestone';
  involves?: string[];
}

export type Phase = 'offseason' | 'regular_season' | 'postseason';
export type GMPhilosophy = 'rebuilding' | 'retooling' | 'contending' | 'win_now' | 'balanced';

export interface SeedEntry { seed: number; id: string; wins: number; rd: number; }
export interface Series {
  id: string;
  round: 'wild_card' | 'division' | 'lcs' | 'world_series';
  lg: League | 'BOTH';
  status: 'pending' | 'active' | 'complete';
  higherSeed: SeedEntry | null;
  lowerSeed: SeedEntry | null;
  sourceSeries?: string | string[];
  higherWins: number; lowerWins: number;
  gamesNeeded: number;
  games: { gameNum: number; day: number; home: string; away: string; homeScore: number; awayScore: number; winner: string }[];
  atHigher: 'all' | '2-2-1' | '2-3-2';
  winner?: string; loser?: string;
  _promoted?: boolean;
}
export interface Bracket {
  seeds: Record<League, SeedEntry[]>;
  series: Record<string, Series>;
  currentRound: 'wild_card' | 'division' | 'lcs' | 'world_series' | 'complete';
  dayStarted: number; champion: string | null;
  _rolled?: boolean;
}

export interface DraftPick { round: number; overall: number; franchiseId: string; originalFid: string; playerId: string | null; signed: boolean; bonusPaid: number; year: number; }
export interface DraftState { year: number; order: string[]; pool: string[]; picks: DraftPick[]; currentPickIndex: number; complete: boolean; roundsTotal: number; teamBonusPools: Record<string, number>; }

export interface FABid { franchiseId: string; aav: number; years: number; total: number; philosophy: GMPhilosophy; dayPlaced: number; }
export interface FAListing { playerId: string; asking: number; years: number; bids: FABid[]; signedBy: string | null; signedOn: number | null; declined: boolean; qualifyingOffer?: boolean; }
export interface FreeAgencyState { year: number; listings: FAListing[]; open: boolean; closesOn: number; }

export type ManagerStyle = 'small_ball' | 'analytical' | 'vet_friendly' | 'balanced';
export type CoachRole = 'manager' | 'pitching_coach' | 'hitting_coach';
export interface CoachContract { salary: number; years: number; signedOn: number; }
export interface Coach {
  id: string;
  firstName: string; lastName: string; age: number;
  role: CoachRole; experience: number;
  ratings: { tactical: number; development: number; chemistry: number; overall: number };
  contract: CoachContract | null;
  franchiseId: string | null;
  championships: number;
  history: { season: number; franchiseId: string; record?: string; result?: string }[];
  style?: ManagerStyle;
}
export interface FranchiseCoaches { manager: string | null; pitching_coach: string | null; hitting_coach: string | null; }
export interface DevelopmentRecord {
  playerId: string; season: number; franchiseId: string; coachId: string;
  role: CoachRole;
  prePotential: number; postPotential: number; preOverall: number; postOverall: number;
  ageAtBump: number;
}

export type AwardType = 'mvp' | 'cy_young' | 'rookie' | 'gold_glove' | 'silver_slugger' | 'mgr_of_year';

export interface SeasonObjective { id: 'wins' | 'playoffs' | 'profit' | 'attendance'; label: string; target: number; actual?: number; achieved?: boolean; }
export interface OwnerObjectives { season: number; objectives: SeasonObjective[]; }

export interface TeamSeasonRecord {
  season: number; wins: number; losses: number;
  payroll: number;
  made_playoffs: boolean;
  playoff_result?: 'wc_out' | 'ds_out' | 'lcs_out' | 'ws_loss' | 'champion';
  champion?: boolean;
  revenue?: number; expenses?: number; net?: number;
  jobSecurityEnd?: number;
}

export interface IntlProspect {
  id: string;
  firstName: string; lastName: string;
  age: number; nat: Nationality;
  pos: Position; isPitcher: boolean;
  ratings: Ratings; potential: number;
  bonusAsk: number;
  signedBy: string | null;
  signedFor: number | null;
}
export interface IntlSigningState { year: number; prospects: IntlProspect[]; open: boolean; closesOn: number; pools: Record<string, number>; poolsSpent: Record<string, number>; }

export interface Rule5Eligible { playerId: string; signingTeamYears: number; previousTeam: string; }
export interface Rule5DraftState {
  year: number;
  eligible: string[];
  order: string[];
  picks: { franchiseId: string; playerId: string | null; previousFid: string }[];
  complete: boolean;
  currentPickIndex: number;
}

export interface TeamChemistry { value: number; leaders: string[]; }

export type MinorLevel = 'aaa' | 'aa' | 'a';
export interface MinorRosters { aaa: string[]; aa: string[]; a: string[]; }

export interface ChampionRecord {
  season: number;
  championFid: string;
  wins: number;
  losses: number;
  defeated: { round: 'wild_card' | 'division' | 'lcs' | 'world_series'; opponentFid: string; gamesWon: number; gamesLost: number }[];
}

export interface GameState {
  seed: number;
  userFranchiseId: string;
  scenario: 'normal' | 'turnaround' | 'expansion';
  playMode?: 'owner' | 'gm';                  // default 'owner' — owners can't be fired
  day: number; season: number; phase: Phase;
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
  delegateFA?: boolean;
  delegateRoster?: boolean;
  draft?: DraftState | null;
  freeAgency?: FreeAgencyState | null;
  freeAgents: string[];
  prospects: string[];
  injuryLog?: { playerId: string; season: number; day: number; type: string; severity: string }[];
  coaches?: Record<string, Coach>;
  staffByFid?: Record<string, FranchiseCoaches>;
  coachPool?: string[];
  developmentHistory?: DevelopmentRecord[];
  awardsBySeason?: Record<number, { type: AwardType; league?: League; playerId: string; coachId?: string }[]>;
  jobSecurity?: number;
  ownerObjectives?: OwnerObjectives | null;
  fired?: boolean;
  unemployedSince?: number;
  gmJobOffers?: { franchiseId: string; reason: string; security: number }[];
  jobSecurityHistory?: { season: number; security: number; objectives: SeasonObjective[] }[];
  userMadePlayoffs?: boolean;
  settings?: { newsVerbosity: 'all' | 'team' | 'major'; autosave: boolean };
  teamHistory?: Record<string, TeamSeasonRecord[]>;
  intlSignings?: IntlSigningState | null;
  rule5?: Rule5DraftState | null;
  chemistry?: Record<string, TeamChemistry>;
  championHistory?: ChampionRecord[];
  minorRosters?: Record<string, MinorRosters>;
  springTraining?: { active: boolean; cutDeadline: number };
  // League-average stat anchors used by OPS+/ERA+ calc each season
  leagueAverages?: Record<number, { OPS: number; ERA: number; AVG: number; OBP: number; SLG: number }>;
  ownerProfiles?: Record<string, OwnerProfile>;
  leagueRules?: LeagueRules;
  // Per-team depth charts: ordered list of player IDs at each position
  depthCharts?: Record<string, Record<string, string[]>>;
  // 40-man rosters per team
  fortyMan?: Record<string, string[]>;
  // Pending waiver claims
  waiverWire?: { playerId: string; fromFid: string; placedDay: number; expiresOnDay: number; claimedBy?: string }[];
  // Per-game weather (key: gameId)
  gameWeather?: Record<string, { temp: number; wind: number; conditions: 'clear' | 'cloudy' | 'rain' | 'wind' }>;
  // QO offers + comp picks
  qualifyingOffers?: { playerId: string; fromFid: string; declined?: boolean; signedElsewhere?: boolean }[];
  compPicks?: { fid: string; round: number; year: number; reason: string }[];
}

export type OwnerStyle = 'cheap' | 'balanced' | 'spendthrift';
export interface OwnerProfile {
  name: string;
  style: OwnerStyle;
  acquiredSeason: number;
  patience: number;
}

export interface LeagueRules {
  dh: 'al' | 'both' | 'none';
  pitchClock: boolean;
  ballType: 'dead' | 'normal' | 'juiced';
  changes: { season: number; description: string }[];
}

export interface ExpansionConfig {
  abbr: string; city: string; state?: string; name: string;
  lg: League; div: Division;
  color: string; secondaryColor?: string;
  park: string; cap: number; premium: number; pf: number; amen: number;
  marketTier: Market['tier'];
  marketLoyalty: number; marketCorp: number;
  champ?: number; pennants?: number;
}