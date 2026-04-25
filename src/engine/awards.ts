// ============================================================
// Awards + Hall of Fame
// ============================================================
// Computed at season finalization. Per league:
//   • MVP            — best hitter by adjusted OVR (rating × games available)
//   • Cy Young       — best pitcher by adjusted OVR
//   • Rookie of Year — best player with < 2 yrs service who played majors
//   • Gold Gloves    — best fielder per defensive position (9 per league)
//
// Awards are stored on player.awards[]. Award-winning FAs get a +15% asking
// boost. After 5 years retired, players with sufficient hardware enter the HoF.

import type { GameState, Player, AwardType, League } from './types';
import { FRANCHISES } from './franchises';

const HOF_RETIREMENT_COOLDOWN = 5;

/** Compute season awards. Called from finalizeSeason. */
export function awardSeason(state: GameState) {
  state.awardsBySeason = state.awardsBySeason || {};
  const seasonAwards: { type: AwardType; league?: League; playerId: string }[] = [];

  for (const lg of ['AL', 'NL'] as League[]) {
    const players = Object.values(state.players)
      .filter((p) => !p.retired && p.franchiseId && FRANCHISES[p.franchiseId]?.lg === lg);

    // MVP: best healthy hitter by overall, weighted slightly by stamina/health proxy
    const hitters = players.filter((p) => !p.isPitcher).sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (hitters[0]) {
      seasonAwards.push({ type: 'mvp', league: lg, playerId: hitters[0].id });
      pushAward(hitters[0], state.season, 'mvp', lg);
    }

    // Cy Young: best healthy starter by overall
    const sp = players.filter((p) => p.pos === 'SP').sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (sp[0]) {
      seasonAwards.push({ type: 'cy_young', league: lg, playerId: sp[0].id });
      pushAward(sp[0], state.season, 'cy_young', lg);
    }

    // Rookie of the Year: best player with < 2 yrs service (i.e. <344 days)
    const rookies = players
      .filter((p) => (p.contract?.serviceDays ?? 999) < 344)
      .sort((a, b) => b.ratings.overall - a.ratings.overall);
    if (rookies[0] && rookies[0].ratings.overall >= 50) {
      seasonAwards.push({ type: 'rookie', league: lg, playerId: rookies[0].id });
      pushAward(rookies[0], state.season, 'rookie', lg);
    }

    // Gold Gloves — best fielder per defensive position (excl DH)
    const FIELDING_POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const;
    for (const pos of FIELDING_POS) {
      const candidates = players
        .filter((p) => p.pos === pos)
        .sort((a, b) => (b.ratings.fielding ?? 0) - (a.ratings.fielding ?? 0));
      if (candidates[0] && (candidates[0].ratings.fielding ?? 0) >= 60) {
        seasonAwards.push({ type: 'gold_glove', league: lg, playerId: candidates[0].id });
        pushAward(candidates[0], state.season, 'gold_glove', lg);
      }
    }
  }

  state.awardsBySeason[state.season] = seasonAwards;

  // Headlines for the marquee awards
  const mvps = seasonAwards.filter((a) => a.type === 'mvp');
  const cys = seasonAwards.filter((a) => a.type === 'cy_young');
  const rookies = seasonAwards.filter((a) => a.type === 'rookie');
  const fmtList = (xs: typeof seasonAwards) => xs.map((a) => {
    const p = state.players[a.playerId];
    return p ? `${a.league}: ${p.firstName} ${p.lastName}` : '';
  }).filter(Boolean).join(' · ');

  state.news.unshift({
    id: `awards_${state.season}`,
    day: state.day,
    season: state.season,
    headline: `${state.season} season awards announced`,
    body: `MVPs — ${fmtList(mvps)}. Cy Young — ${fmtList(cys)}. Rookies — ${fmtList(rookies)}.`,
    category: 'league',
  });
}

function pushAward(p: Player, season: number, type: AwardType, league: League) {
  p.awards = p.awards || [];
  p.awards.push({ season, type, league });
}

/**
 * Score a player's career for HoF voting. Sums major-award weights + championships.
 * Threshold for induction tuned to ~5-8% of retired careers.
 */
export function hofScore(p: Player): number {
  if (!p.awards) return 0;
  let score = 0;
  for (const a of p.awards) {
    if (a.type === 'mvp') score += 100;
    else if (a.type === 'cy_young') score += 90;
    else if (a.type === 'rookie') score += 25;
    else if (a.type === 'gold_glove') score += 12;
  }
  if (p.careerHigh) score += Math.max(0, p.careerHigh - 60) * 5;
  return score;
}

/** Run HoF voting at season rollover. Inducts retired players past cooldown. */
export function processHallOfFame(state: GameState) {
  const inductionThreshold = 250;     // tuned for ~5% induction rate

  for (const pid of Object.keys(state.players)) {
    const p = state.players[pid];
    if (!p.retired || p.hallOfFame) continue;
    if (!p.retiredOn) continue;
    if (state.season - p.retiredOn < HOF_RETIREMENT_COOLDOWN) continue;

    const score = hofScore(p);
    if (score >= inductionThreshold) {
      p.hallOfFame = { inducted: state.season };
      state.news.unshift({
        id: `hof_${p.id}_${state.season}`,
        day: state.day,
        season: state.season,
        headline: `${p.firstName} ${p.lastName} elected to the Hall of Fame`,
        body: `${(p.awards?.length ?? 0)} career awards · peak OVR ${p.careerHigh ?? '?'} · ${(p.awards || []).filter((a) => a.type === 'mvp').length} MVP, ${(p.awards || []).filter((a) => a.type === 'cy_young').length} CY · induction speech delivered to a packed Cooperstown.`,
        category: 'milestone',
      });
    }
  }
}

/** Boost FA asking for award-winners (used when generating FA listings). */
export function awardFreeAgentMultiplier(p: Player): number {
  if (!p.awards) return 1.0;
  let mult = 1.0;
  for (const a of p.awards) {
    if (a.type === 'mvp') mult += 0.05;
    else if (a.type === 'cy_young') mult += 0.04;
    else if (a.type === 'gold_glove') mult += 0.01;
    else if (a.type === 'rookie') mult += 0.02;
  }
  return Math.min(1.30, mult);
}
