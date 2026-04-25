# Maverick Baseball

A front-office baseball management simulation. Vite + React + TypeScript + Zustand.

This is the **multi-file scaffold** version — built from the original
`DiamondDesk.jsx` artifact, ported to a typed, modular codebase ready for
GitHub + Vercel deployment.

## What's in the box

### Core (ported from the artifact)
- 30 real MLB franchises + 32-team expansion mode
- Full roster, finance, schedule, standings, trade, and playoff systems
- Bradley-Terry game sim
- AI GM trade evaluation by philosophy (rebuilding / contending / win_now / etc.)
- Full postseason bracket: WC → DS → LCS → WS
- Per-day accruals: TV, sponsorships, payroll, stadium, debt, etc.

### New systems built in this scaffold
- **Injuries + IL** (`engine/injuries.ts`) — daily injury rolls, 10/15/60-day IL,
  recovery timers, severity-weighted impact on team strength, per-team medical
  spend reduces rates.
- **Amateur Draft** (`engine/draft.ts`) — fires automatically at offseason day -45.
  10 rounds, snake order based on prior season standings, bonus pool slot values,
  AI picks by GM philosophy, user can pick or auto-complete.
- **Free Agency** (`engine/freeAgency.ts`) — opens after the World Series,
  closes at offseason day -10. Eligibility based on 6+ years of service. AI
  teams place bids by philosophy and budget; users place their own bids and
  see all rival offers.
- **Coaching staff** (`engine/coaches.ts`) — manager + pitching coach + hitting
  coach for all 30 teams. Ratings: tactical / development / chemistry. Manager
  tactical rating boosts team strength; pitching coach reduces pitcher injury
  rate; hitting/pitching coach development boosts young player potential at
  season rollover. Hire/fire with prorated buyouts. AI fires after losing
  seasons and refills from a 20-deep free-agent coach pool. World Series
  champion's full staff records a championship ring.
- **Coach scouting reports** (`engine/coaches.ts` helpers + `pages/Staff.tsx`)
  — every effective development bump is logged to `state.developmentHistory`
  with credited coach ID. Staff page shows next-rollover projections for your
  young players, lifetime track records for your pitching/hitting coaches, and
  a league-wide leaderboard of top-developing coaches.
- **Manager styles + hot/cold streaks + waiver wire** (`engine/coaches.ts` style
  multipliers, `engine/streaks.ts`, `engine/waiver.ts`) — managers get a
  `style: 'small_ball' | 'analytical' | 'vet_friendly' | 'balanced'` flag
  that biases their bench/bullpen/intangibles contributions (e.g. small-ball
  managers extract +40% bench leverage but lose 10% bullpen). Players develop
  hot/cold streaks via mean-reverting random walk weekly during the season,
  +/-8 OVR modifier shown on the roster page. User can DFA a player from
  Roster page (eats 50% of remaining contract). AI teams fire managers
  mid-season (~day 100) when below .360 with a 50% chance, signing an
  interim from the pool.
- **Stadium upgrades** (`engine/stadium.ts`) — Stadium page lets you spend
  cash on capacity (+2,000 seats, $80M), premium seating (+500 seats, $40M),
  or amenity tier (+1, $60M, max 5). Upgrades are permanent, raising long-term
  revenue and demand.
- **Settings page + multi-slot saves** (`pages/Settings.tsx`,
  `state/save.ts`) — 3 named save slots in localStorage, JSON export
  (downloads a file) and JSON import (paste-and-load). Plus news verbosity
  filter (all/team/major) and autosave toggle on `state.settings`.
- **Player career profile page** (`pages/PlayerCareer.tsx`) — click any
  player from the Roster to navigate to a full profile: ratings, draft info,
  contract, awards (with year-by-year breakdown), Hall of Fame status,
  current injury, streak. Standalone "Player Files" entry browses top 50
  active players when no specific player is selected.
- **FA market filters** — Free Agency page now has search, position dropdown
  filter, and minimum-OVR slider so you can navigate large pools.
- **Player aging curves** (`engine/aging.ts`) — at season rollover, every
  active player's ratings adjust by an age-based multiplier. Hitters peak
  26-29, pitchers 27-30; speed and velocity decline fastest, contact and
  command hold longest. Late bloomers (rare) spike at 24-26. Players with
  careerHigh ≥ 60 get retirement news; auto-retire at 39+ or with sub-30 OVR.
- **Owner objectives + job security** (`engine/objectives.ts`) — every season
  the board sets 4 objectives (win count target by market tier, playoffs,
  net P&L ≥ 5% of revenue, attendance). Hits raise jobSecurity (0-100),
  misses lower. Below 0 = fired. Dashboard shows live progress + a security
  bar; news posts a season report card. Expansion teams get reduced targets
  for first 3 seasons.
- **Awards + Hall of Fame** (`engine/awards.ts` + `pages/Awards.tsx`) — at
  season finalization compute MVP, Cy Young, Rookie of the Year (one per
  league each) plus 8 Gold Gloves per league. Awards stored on player.awards;
  award-winners get +5%/MVP, +4%/CY asking-price boost in free agency.
  Players retired 5+ years with career awards above 250-point threshold are
  inducted into the Hall of Fame. Awards page shows season-by-season list +
  HoF table with career stats.
- **Expansion overhaul** (`engine/expansionDraft.ts`, expansion handicap in
  `finance.ts` + `freeAgency.ts`, delegate hiring flag) — when starting an
  expansion world, an authentic expansion draft runs after roster generation:
  each existing team protects 6 best hitters + 5 best pitchers; the remainder
  forms an unprotected pool, and each new team picks 12 in alternating order
  (each existing team only loses one player per expansion team). Picked
  players replace the lowest-OVR generated (capped-62) bench players, lifting
  median roster OVR ~7 points. New teams also carry a **persistent handicap**:
  −15% game-day attendance demand for first 3 seasons (smaller fan base) and
  −12% AI free-agent bid aggressiveness for first 5 seasons (top FAs avoid
  brand-new losing teams). Each franchise tracks `seasonsActive` so the
  handicap fades on schedule. Coach contract expirations now post a news item
  for the user team, and a new **Delegate Staff Hiring** toggle on the Staff
  page lets the AI auto-fill user vacancies — Dashboard shows a red banner
  whenever any of the user's three slots is open.
- **CBT enforcement + revenue sharing** (`engine/finance.ts`) — luxury tax
  assessed in tiered rates (20%/32%/62.5%) above $237M / $257M / $277M
  thresholds. CBT taxes plus a 5%-of-revenue contribution from the top 15
  market-revenue clubs flow into a league pool, redistributed equally to the
  bottom 15. AI free-agent bidding now respects payroll-to-revenue ratio (skip
  if payroll > 85% of revenue proxy) and caps any single AAV at 12% of team
  cash + 8% of owner cash. When team cash drops below -$50M at season end, the
  owner injects up to $200M from owner cash, recorded as new debt. Initial
  team cash recalibrated to $60M-$200M (realistic working capital), franchise
  valuations bumped (mega 9.5×, large 7.0×, mid 5.0×, small 3.8×) so the
  Yankees/Dodgers/Blue Jays land in the $5-6B range as in real MLB.
- **Tactical manager decisions** (`engine/sim.ts` + `engine/coaches.ts`) — the
  manager's tactical rating now drives concrete in-game effects baked into
  every Bradley-Terry sim:
    - **Bench leverage:** position-aware lineup model → great managers pinch-hit
      the worst positional starter with the best bench bat at high-leverage
      moments (frequency scales with tactical rating).
    - **Bullpen leverage:** great managers ride closer + setup man in
      high-leverage innings; poor managers waste leverage on back-end relievers.
    - **Intangibles:** small flat bonus from tactical + chemistry (defensive
      shifts, baserunning calls, lineup matchups).
  An elite manager (tactical 80) is worth ~5 wins per 162 vs an average peer.
  The Staff page surfaces all three numbers + projected wins-edge over league
  average.

### Persistence
- `state/save.ts` writes the full game state plus expansion-team registry to
  `localStorage`, restored automatically on load.

## Run locally

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # produces dist/
npm run preview
```

## Deploy to Vercel

The included `vercel.json` configures a static SPA build. Connect a GitHub
repo and Vercel will pick up the Vite preset automatically. The framework
preset is `vite`; the build command is `npm run build`; the output directory
is `dist`.

```bash
git init && git add . && git commit -m "Initial Maverick Baseball"
git remote add origin <your-repo>
git push -u origin main
```

Then in Vercel: **Import Project → Framework: Vite → Deploy.**

## Project layout

```
src/
├── App.tsx                 # View/page router
├── main.tsx                # React entry
├── engine/
│   ├── types.ts            # Shared domain types
│   ├── rng.ts              # Mulberry32 PRNG
│   ├── markets.ts          # Market metadata
│   ├── franchises.ts       # 30 MLB franchises
│   ├── expansion.ts        # 31st/32nd team generator
│   ├── names.ts            # Name pools by nationality
│   ├── players.ts          # Player + roster generation
│   ├── finance.ts          # Revenue, ledger, accruals
│   ├── schedule.ts         # 162-game scheduler
│   ├── sim.ts              # Bradley-Terry game sim
│   ├── trades.ts           # AI GM trade evaluation
│   ├── playoffs.ts         # WC/DS/LCS/WS bracket
│   ├── injuries.ts         # Injury rolls + IL  ← NEW
│   ├── draft.ts            # Annual amateur draft  ← NEW
│   ├── freeAgency.ts       # FA market + AI bidding  ← NEW
│   ├── world.ts            # initWorld + advanceDay
│   └── format.ts           # fmt, fmtShort, etc.
├── state/
│   ├── store.ts            # Zustand store + actions
│   └── save.ts             # localStorage persistence
├── styles/
│   ├── tokens.ts           # Broadsheet design tokens
│   └── globals.css
├── components/
│   ├── Shell.tsx           # Masthead, nav, footer
│   ├── Stat.tsx
│   └── RatingBar.tsx
└── pages/
    ├── Splash.tsx
    ├── NewGame.tsx
    ├── Dashboard.tsx
    ├── Roster.tsx
    ├── Trades.tsx
    ├── Standings.tsx
    ├── Schedule.tsx
    ├── Playoffs.tsx
    ├── Finances.tsx
    ├── Stadium.tsx
    ├── News.tsx
    ├── InjuredList.tsx     ← NEW
    ├── Draft.tsx           ← NEW
    └── FreeAgency.tsx      ← NEW
```

## Verified behavior

A typecheck (`npx tsc --noEmit`) passes clean, and a full season-cycle smoke
test runs from init through:

- Regular season sim (~32 active injuries league-wide)
- Postseason bracket → World Series champion
- Season rollover with FA pool generated (~100 free agents)
- Amateur draft fires at offseason day -45 (300 picks across 10 rounds)
- New schedule generated for the next season

## Roadmap (next session)

- Spring training + 26-man roster cuts
- Manager firing / hiring
- International signing pool (separate from amateur draft)
- Rule 5 draft
- Live game feed (pitch-by-pitch sim layer over Bradley-Terry)
- Multiplayer / commissioner mode
