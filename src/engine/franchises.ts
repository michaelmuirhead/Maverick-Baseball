import type { Franchise } from './types';

export const FRANCHISES: Record<string, Franchise> = {
  nyy: { abbr: 'NYY', city: 'New York', name: 'Yankees', lg: 'AL', div: 'East', color: '#0A2342', market: 'nyc', park: 'Yankee Stadium', cap: 46537, premium: 4600, pf: 104, amen: 5, champ: 27 },
  bos: { abbr: 'BOS', city: 'Boston', name: 'Red Sox', lg: 'AL', div: 'East', color: '#BD3039', market: 'bos', park: 'Fenway Park', cap: 37755, premium: 2100, pf: 108, amen: 3, champ: 9 },
  tor: { abbr: 'TOR', city: 'Toronto', name: 'Blue Jays', lg: 'AL', div: 'East', color: '#134A8E', market: 'nyc', park: 'Rogers Centre', cap: 41500, premium: 5200, pf: 102, amen: 4, champ: 2 },
  bal: { abbr: 'BAL', city: 'Baltimore', name: 'Orioles', lg: 'AL', div: 'East', color: '#DF4601', market: 'bal', park: 'Camden Yards', cap: 44970, premium: 3200, pf: 100, amen: 4, champ: 3 },
  tb:  { abbr: 'TB',  city: 'Tampa Bay', name: 'Rays', lg: 'AL', div: 'East', color: '#092C5C', market: 'tb',  park: 'Tropicana Field', cap: 25000, premium: 1400, pf: 96, amen: 2, champ: 0 },
  cle: { abbr: 'CLE', city: 'Cleveland', name: 'Guardians', lg: 'AL', div: 'Central', color: '#00385D', market: 'cle', park: 'Progressive Field', cap: 34830, premium: 2100, pf: 99, amen: 4, champ: 2 },
  det: { abbr: 'DET', city: 'Detroit', name: 'Tigers', lg: 'AL', div: 'Central', color: '#0C2340', market: 'det', park: 'Comerica Park', cap: 41083, premium: 2500, pf: 97, amen: 3, champ: 4 },
  min: { abbr: 'MIN', city: 'Minneapolis', name: 'Twins', lg: 'AL', div: 'Central', color: '#002B5C', market: 'min', park: 'Target Field', cap: 38544, premium: 2700, pf: 100, amen: 4, champ: 3 },
  cws: { abbr: 'CWS', city: 'Chicago', name: 'White Sox', lg: 'AL', div: 'Central', color: '#27251F', market: 'chi', park: 'Guaranteed Rate Field', cap: 40615, premium: 2200, pf: 101, amen: 3, champ: 3 },
  kc:  { abbr: 'KC',  city: 'Kansas City', name: 'Royals', lg: 'AL', div: 'Central', color: '#004687', market: 'kc',  park: 'Kauffman Stadium', cap: 37903, premium: 1800, pf: 98, amen: 3, champ: 2 },
  hou: { abbr: 'HOU', city: 'Houston', name: 'Astros', lg: 'AL', div: 'West', color: '#002D62', market: 'hou', park: 'Minute Maid Park', cap: 41168, premium: 3300, pf: 101, amen: 4, champ: 2 },
  tex: { abbr: 'TEX', city: 'Arlington', name: 'Rangers', lg: 'AL', div: 'West', color: '#003278', market: 'dfw', park: 'Globe Life Field', cap: 40300, premium: 5600, pf: 98, amen: 5, champ: 1 },
  sea: { abbr: 'SEA', city: 'Seattle', name: 'Mariners', lg: 'AL', div: 'West', color: '#0C2C56', market: 'sea', park: 'T-Mobile Park', cap: 47929, premium: 4200, pf: 94, amen: 4, champ: 0 },
  laa: { abbr: 'LAA', city: 'Anaheim', name: 'Angels', lg: 'AL', div: 'West', color: '#BA0021', market: 'la',  park: 'Angel Stadium', cap: 45517, premium: 2800, pf: 96, amen: 3, champ: 1 },
  oak: { abbr: 'ATH', city: 'Sacramento', name: 'Athletics', lg: 'AL', div: 'West', color: '#003831', market: 'bay', park: 'Sutter Health Park', cap: 14014, premium: 800, pf: 100, amen: 2, champ: 9 },
  atl: { abbr: 'ATL', city: 'Atlanta', name: 'Braves', lg: 'NL', div: 'East', color: '#CE1141', market: 'atl', park: 'Truist Park', cap: 41084, premium: 3800, pf: 103, amen: 5, champ: 4 },
  phi: { abbr: 'PHI', city: 'Philadelphia', name: 'Phillies', lg: 'NL', div: 'East', color: '#E81828', market: 'phi', park: 'Citizens Bank Park', cap: 42792, premium: 3100, pf: 105, amen: 4, champ: 2 },
  nym: { abbr: 'NYM', city: 'New York', name: 'Mets', lg: 'NL', div: 'East', color: '#002D72', market: 'nyc', park: 'Citi Field', cap: 41922, premium: 3400, pf: 96, amen: 4, champ: 2 },
  mia: { abbr: 'MIA', city: 'Miami', name: 'Marlins', lg: 'NL', div: 'East', color: '#00A3E0', market: 'tb',  park: 'loanDepot park', cap: 36742, premium: 3000, pf: 97, amen: 4, champ: 2 },
  was: { abbr: 'WAS', city: 'Washington', name: 'Nationals', lg: 'NL', div: 'East', color: '#AB0003', market: 'was', park: 'Nationals Park', cap: 41339, premium: 3200, pf: 100, amen: 4, champ: 1 },
  chc: { abbr: 'CHC', city: 'Chicago', name: 'Cubs', lg: 'NL', div: 'Central', color: '#0E3386', market: 'chi', park: 'Wrigley Field', cap: 41649, premium: 2400, pf: 102, amen: 3, champ: 3 },
  stl: { abbr: 'STL', city: 'St. Louis', name: 'Cardinals', lg: 'NL', div: 'Central', color: '#C41E3A', market: 'stl', park: 'Busch Stadium', cap: 44494, premium: 3400, pf: 98, amen: 4, champ: 11 },
  mil: { abbr: 'MIL', city: 'Milwaukee', name: 'Brewers', lg: 'NL', div: 'Central', color: '#12284B', market: 'mil', park: 'American Family Field', cap: 41900, premium: 2600, pf: 102, amen: 3, champ: 0 },
  cin: { abbr: 'CIN', city: 'Cincinnati', name: 'Reds', lg: 'NL', div: 'Central', color: '#C6011F', market: 'cin', park: 'Great American Ball Park', cap: 42319, premium: 2400, pf: 106, amen: 3, champ: 5 },
  pit: { abbr: 'PIT', city: 'Pittsburgh', name: 'Pirates', lg: 'NL', div: 'Central', color: '#FDB827', market: 'pit', park: 'PNC Park', cap: 38747, premium: 2400, pf: 98, amen: 4, champ: 5 },
  lad: { abbr: 'LAD', city: 'Los Angeles', name: 'Dodgers', lg: 'NL', div: 'West', color: '#005A9C', market: 'la',  park: 'Dodger Stadium', cap: 56000, premium: 4500, pf: 99, amen: 4, champ: 8 },
  sf:  { abbr: 'SF',  city: 'San Francisco', name: 'Giants', lg: 'NL', div: 'West', color: '#FD5A1E', market: 'bay', park: 'Oracle Park', cap: 41915, premium: 3100, pf: 93, amen: 4, champ: 8 },
  sd:  { abbr: 'SD',  city: 'San Diego', name: 'Padres', lg: 'NL', div: 'West', color: '#2F241D', market: 'sd',  park: 'Petco Park', cap: 40222, premium: 2900, pf: 95, amen: 5, champ: 0 },
  col: { abbr: 'COL', city: 'Denver', name: 'Rockies', lg: 'NL', div: 'West', color: '#33006F', market: 'den', park: 'Coors Field', cap: 50144, premium: 2600, pf: 113, amen: 3, champ: 0 },
  ari: { abbr: 'ARI', city: 'Phoenix', name: 'Diamondbacks', lg: 'NL', div: 'West', color: '#A71930', market: 'phx', park: 'Chase Field', cap: 48405, premium: 3000, pf: 102, amen: 3, champ: 1 },
};

// Snapshot of the original 30 franchises — used to reset state when starting a new
// expansion world so previously-added 31st/32nd clubs don't leak across games.
export const ORIGINAL_FRANCHISES: Record<string, Franchise> =
  JSON.parse(JSON.stringify(FRANCHISES));

export function resetFranchises() {
  for (const id of Object.keys(FRANCHISES)) {
    if (!(id in ORIGINAL_FRANCHISES)) delete FRANCHISES[id];
  }
  for (const id of Object.keys(ORIGINAL_FRANCHISES)) {
    FRANCHISES[id] = JSON.parse(JSON.stringify(ORIGINAL_FRANCHISES[id]));
  }
}
