import type { RNG } from './rng';
import type { Finance, Franchise, GameState, Ledger } from './types';
import { MARKETS } from './markets';
import { FRANCHISES } from './franchises';
import { awardSeason } from './awards';

export const CBT_TIER1 = 237_000_000;     // 20% on overage above this
export const CBT_TIER2 = 257_000_000;     // +32% on overage above this
export const CBT_TIER3 = 277_000_000;     // +62.5% on overage above this

// Revenue sharing — top half of teams by revenue contribute, bottom half receive.
export const REV_SHARE_RATE = 0.05;       // 5% of revenue from contributors

// Owner financing — when team cash drops below this, owner injects.
export const OWNER_INJECT_THRESHOLD = -50_000_000;
export const OWNER_INJECT_MAX = 200_000_000;

export function emptyLedger(): Ledger {
  return {
    ticketRev: 0, premiumRev: 0, concRev: 0, parkRev: 0, merchRev: 0,
    localTV: 0, natTV: 0, sponsorRev: 0, namingRev: 0,
    payroll: 0, staff: 0, stadium: 0, minors: 0, scouting: 0, analytics: 0,
    medical: 0, marketing: 0, travel: 0, debtService: 0,
    attendance: 0, homeGames: 0,
    postseasonRev: 0,
    signingBonuses: 0,
    cbtTax: 0,
    revShareIn: 0,
    revShareOut: 0,
    ownerInjection: 0,
  };
}

export function genFinance(rng: RNG, franchise: Franchise): Finance {
  const market = MARKETS[franchise.market];
  const tvBase = ({ mega: 180_000_000, large: 95_000_000, mid: 55_000_000, small: 35_000_000 } as const)[market.tier];
  const tv = Math.round(tvBase * rng.float(0.8, 1.25));
  const nameRights = rng.chance(0.7)
    ? Math.round(({ mega: 20, large: 9, mid: 5, small: 3 } as const)[market.tier] * 1_000_000 * rng.float(0.8, 1.4))
    : 0;
  const sponsors = Math.round((3_000_000 + market.corp / 80 * 8_000_000) * 4 * rng.float(0.8, 1.2));
  const tierMult = ({ mega: 1.4, large: 1.15, mid: 1.0, small: 0.85 } as const)[market.tier];
  const ticketPrice = Math.round(35 * tierMult * rng.float(0.85, 1.15));
  const premiumPrice = Math.round(ticketPrice * rng.float(3.5, 5.5));
  const parkingPrice = Math.round(15 * tierMult);

  // CALIBRATED: working capital is now realistic. Real MLB clubs hold $80M-$200M
  // cash reserves to handle seasonal cashflow + offseason FA spending.
  const cashByTier = ({
    mega:  () => rng.int(120_000_000, 200_000_000),
    large: () => rng.int(100_000_000, 160_000_000),
    mid:   () => rng.int(80_000_000, 130_000_000),
    small: () => rng.int(60_000_000, 110_000_000),
  } as const);
  const teamCash = cashByTier[market.tier]();
  const ownerCash = rng.int(150_000_000, 600_000_000);
  const debt = rng.chance(0.7) ? rng.int(50_000_000, 400_000_000) : 0;

  const approxRev = tv + nameRights + sponsors + ticketPrice * franchise.cap * 70 + 75_000_000;
  // CALIBRATED: franchise valuation multipliers up so mega markets hit ~$5-8B
  const valMult = ({ mega: 9.5, large: 7.0, mid: 5.0, small: 3.8 } as const)[market.tier];
  const value = Math.round(approxRev * valMult);

  return {
    teamCash, ownerCash, debt,
    tvValue: tv, tvYearsLeft: rng.int(2, 9),
    nameRightsValue: nameRights, nameRightsYearsLeft: nameRights > 0 ? rng.int(3, 15) : 0,
    sponsors, ticketPrice, premiumPrice, parkingPrice,
    franchiseValue: value,
    ledger: emptyLedger(),
    history: [],
  };
}

export function gameDayRev(
  rng: RNG,
  franchise: Franchise,
  finance: Finance,
  wins: number,
  losses: number,
  day: number,
  rivalry: boolean,
) {
  const market = MARKETS[franchise.market];
  const winPct = wins + losses > 0 ? wins / (wins + losses) : 0.5;
  const recordFactor = 0.5 + (winPct - 0.5) * 0.7;
  const loyaltyFactor = 0.5 + market.loyalty / 200;
  let seasonArc = 1.0;
  if (day < 20) seasonArc = 0.78;
  else if (day < 60) seasonArc = 0.95;
  else if (day < 130) seasonArc = 1.05;
  else if (winPct > 0.52) seasonArc = 1.1;
  else seasonArc = 0.85;
  const parkAppeal = 0.9 + franchise.amen * 0.03;
  let demand = recordFactor * loyaltyFactor * seasonArc * parkAppeal;
  if (rivalry) demand *= 1.15;
  // Expansion handicap: brand-new teams pull smaller crowds for first 3 seasons.
  if (franchise.expansion && (franchise.seasonsActive ?? 0) < 3) {
    demand *= 0.85;
  }
  demand = Math.max(0.2, Math.min(1.0, demand + rng.normal(0, 0.05)));

  const attendance = Math.round(franchise.cap * demand);
  const premiumFilled = Math.round(franchise.premium * Math.min(1.0, demand + 0.1));
  const standardFilled = Math.max(0, attendance - premiumFilled);
  const ticket = standardFilled * finance.ticketPrice;
  const premium = premiumFilled * finance.premiumPrice;
  const concessionsPerCap = 12 + franchise.amen * 2;
  const conc = Math.round(attendance * concessionsPerCap);
  const park = Math.round(attendance * 0.42 * finance.parkingPrice);
  const merch = Math.round(attendance * (5 + franchise.amen * 0.8));
  return { attendance, ticket, premium, conc, park, merch };
}

export function applyAccruals(state: GameState) {
  for (const fid of Object.keys(state.finances)) {
    const fin = state.finances[fid];
    fin.ledger.localTV += Math.round(fin.tvValue / 365);
    fin.ledger.natTV += Math.round(95_000_000 / 365);
    fin.ledger.sponsorRev += Math.round(fin.sponsors / 365);
    fin.ledger.namingRev += Math.round(fin.nameRightsValue / 365);
    const f = FRANCHISES[fid];
    const market = MARKETS[f.market];
    fin.ledger.stadium += Math.round((32_000_000 + f.amen * 2_000_000) / 365);
    fin.ledger.scouting += Math.round(6_000_000 / 365);
    fin.ledger.minors += Math.round(14_000_000 / 365);
    fin.ledger.analytics += Math.round(5_000_000 / 365);
    fin.ledger.medical += Math.round(4_000_000 / 365);
    fin.ledger.marketing += Math.round(6_000_000 * (market.tier === 'mega' ? 1.6 : 1) / 365);
    fin.ledger.travel += Math.round(11_000_000 / 365);
    if (fin.debt > 0) fin.ledger.debtService += Math.round(fin.debt * 0.055 / 365);
    if (state.day >= 1 && state.day <= 183) {
      const annualPay = state.rosters[fid].reduce(
        (s, pid) => s + (state.players[pid]?.contract?.salary || 0),
        0,
      );
      fin.ledger.payroll += Math.round(annualPay / 183);
    }
    fin.ledger.staff += Math.round(40_000_000 / 365);
  }
}

/**
 * Compute luxury tax owed on a given annual payroll. Tiered marginal rates:
 *   0% up to $237M
 *   20% on overage from $237M-$257M
 *   +12% (32% total marginal) on overage from $257M-$277M
 *   +30.5% (62.5% total marginal) on overage above $277M
 * Returns the dollar tax owed.
 */
export function computeLuxuryTax(annualPayroll: number): number {
  if (annualPayroll <= CBT_TIER1) return 0;
  let tax = 0;
  const t1 = Math.min(annualPayroll, CBT_TIER2) - CBT_TIER1;
  tax += t1 * 0.20;
  if (annualPayroll > CBT_TIER2) {
    const t2 = Math.min(annualPayroll, CBT_TIER3) - CBT_TIER2;
    tax += t2 * 0.32;
  }
  if (annualPayroll > CBT_TIER3) {
    const t3 = annualPayroll - CBT_TIER3;
    tax += t3 * 0.625;
  }
  return Math.round(tax);
}

/**
 * Finalize a season: assess CBT, distribute revenue sharing, run owner financing,
 * roll TV deals, write history.
 *
 * Order of operations matters:
 *   1. Compute provisional revenue/expenses per team (excluding rev share)
 *   2. Assess CBT from end-of-season payroll → adds to expenses
 *   3. Top half by revenue contribute REV_SHARE_RATE × revenue → out
 *   4. Pool = sum of contributions + sum of CBT
 *   5. Pool distributed equally to bottom half by revenue → in
 *   6. Owner financing for any team still underwater
 *   7. Apply final net to teamCash, write history, reset ledgers, roll TV deals
 */
export function finalizeSeason(state: GameState, rng: RNG) {
  // Compute season awards before histories are written
  awardSeason(state);
  const fids = Object.keys(state.finances);

  // --- Step 1: provisional revenue/expense (no rev share yet) ---
  type SeasonRecord = {
    fid: string;
    revenue: number;
    expenses: number;
    payroll: number;
    cbtTax: number;
  };
  const provisional: SeasonRecord[] = [];
  for (const fid of fids) {
    const fin = state.finances[fid];
    const l = fin.ledger;
    // End-of-season payroll for CBT (use roster's annual salaries summed)
    const payroll = state.rosters[fid].reduce(
      (s, pid) => s + (state.players[pid]?.contract?.salary || 0), 0,
    );
    const cbtTax = computeLuxuryTax(payroll);
    l.cbtTax = cbtTax;

    const revenue =
      l.ticketRev + l.premiumRev + l.concRev + l.parkRev + l.merchRev +
      l.localTV + l.natTV + l.sponsorRev + l.namingRev + (l.postseasonRev || 0);
    const expenses =
      l.payroll + l.staff + l.stadium + l.minors + l.scouting + l.analytics +
      l.medical + l.marketing + l.travel + l.debtService +
      (l.signingBonuses || 0) + cbtTax;

    provisional.push({ fid, revenue, expenses, payroll, cbtTax });
  }

  // --- Step 2: revenue sharing pool ---
  // Sort by revenue, top 15 contribute, bottom 15 receive
  const sortedByRev = [...provisional].sort((a, b) => b.revenue - a.revenue);
  const half = Math.floor(sortedByRev.length / 2);
  const contributors = sortedByRev.slice(0, half);
  const recipients = sortedByRev.slice(half);

  let pool = 0;
  // Contributors pay 5% of revenue
  for (const r of contributors) {
    const out = Math.round(r.revenue * REV_SHARE_RATE);
    state.finances[r.fid].ledger.revShareOut = out;
    r.expenses += out;
    pool += out;
  }
  // CBT taxes also flow into pool
  for (const r of provisional) {
    pool += r.cbtTax;
  }
  // Distribute equally among recipients
  if (recipients.length > 0) {
    const share = Math.round(pool / recipients.length);
    for (const r of recipients) {
      state.finances[r.fid].ledger.revShareIn = share;
      r.revenue += share;
    }
  }

  // --- Step 3: apply nets and run owner financing ---
  for (const r of provisional) {
    const fin = state.finances[r.fid];
    const net = r.revenue - r.expenses;
    fin.teamCash += net;

    // Owner injection: if cash dropped below threshold, owner pumps in funds
    let injected = 0;
    if (fin.teamCash < OWNER_INJECT_THRESHOLD && fin.ownerCash > 0) {
      // Inject up to OWNER_INJECT_MAX or whatever brings cash to +$30M
      const needed = Math.min(OWNER_INJECT_MAX, 30_000_000 - fin.teamCash, fin.ownerCash);
      if (needed > 0) {
        injected = needed;
        fin.teamCash += injected;
        fin.ownerCash -= injected;
        fin.debt += injected;             // recorded as debt (owner expects repayment)
        fin.ledger.ownerInjection = injected;

        const f = FRANCHISES[r.fid];
        if (f) {
          state.news.unshift({
            id: `inject_${r.fid}_${state.season}`,
            day: state.day,
            season: state.season,
            headline: `${f.city} ownership injects $${(injected / 1_000_000).toFixed(0)}M to stabilize ledger`,
            body: `The capital infusion adds to long-term debt but keeps the club solvent through the offseason.`,
            category: 'team',
          });
        }
      }
    }

    fin.history.push({
      year: state.season,
      revenue: r.revenue + injected,        // include injection in totals shown
      expenses: r.expenses,
      net: r.revenue - r.expenses + injected,
      endingCash: fin.teamCash,
      attendance: fin.ledger.attendance,
      record: { w: state.standings[r.fid].wins, l: state.standings[r.fid].losses },
    });
    fin.ledger = emptyLedger();
    fin.tvYearsLeft -= 1;
    if (fin.tvYearsLeft <= 0) {
      const market = MARKETS[FRANCHISES[r.fid].market];
      const base = ({ mega: 200_000_000, large: 110_000_000, mid: 65_000_000, small: 40_000_000 } as const)[market.tier];
      const modifier = state.standings[r.fid].wins >= 90 ? 1.15 : state.standings[r.fid].wins <= 65 ? 0.85 : 1.0;
      fin.tvValue = Math.round(base * modifier * rng.float(0.95, 1.1));
      fin.tvYearsLeft = rng.int(6, 10);
    }
    // Updated franchise value with new multipliers
    const valMult = ({ mega: 9.5, large: 7.0, mid: 5.0, small: 3.8 } as const)[MARKETS[FRANCHISES[r.fid].market].tier];
    fin.franchiseValue = Math.round(
      r.revenue * valMult + FRANCHISES[r.fid].champ * 30_000_000 - fin.debt,
    );
  }
}
