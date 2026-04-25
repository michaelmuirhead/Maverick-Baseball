import type { RNG } from './rng';
import type { Bracket, GameState, League, Series, SeedEntry } from './types';
import { FRANCHISES } from './franchises';
import { simGame } from './sim';

export function seedBracket(state: GameState): Bracket {
  const leagueSeeds: Record<League, SeedEntry[]> = { AL: [], NL: [] };

  for (const lg of ['AL', 'NL'] as League[]) {
    const byDiv: Record<string, string[]> = { East: [], Central: [], West: [] };
    for (const fid of Object.keys(FRANCHISES)) {
      if (FRANCHISES[fid].lg === lg) byDiv[FRANCHISES[fid].div].push(fid);
    }

    const divWinners: SeedEntry[] = [];
    for (const div of ['East', 'Central', 'West'] as const) {
      const teams = byDiv[div].map((id) => ({
        seed: 0, id,
        wins: state.standings[id].wins,
        rd: state.standings[id].rf - state.standings[id].ra,
      }));
      teams.sort((a, b) => b.wins - a.wins || b.rd - a.rd);
      divWinners.push(teams[0]);
    }
    divWinners.sort((a, b) => b.wins - a.wins || b.rd - a.rd);

    const divWinnerIds = new Set(divWinners.map((d) => d.id));
    const wcCandidates = Object.keys(FRANCHISES)
      .filter((id) => FRANCHISES[id].lg === lg && !divWinnerIds.has(id))
      .map((id) => ({ seed: 0, id, wins: state.standings[id].wins, rd: state.standings[id].rf - state.standings[id].ra }))
      .sort((a, b) => b.wins - a.wins || b.rd - a.rd);
    const wildCards = wcCandidates.slice(0, 3);

    leagueSeeds[lg] = [
      { ...divWinners[0], seed: 1 },
      { ...divWinners[1], seed: 2 },
      { ...divWinners[2], seed: 3 },
      { ...wildCards[0], seed: 4 },
      { ...wildCards[1], seed: 5 },
      { ...wildCards[2], seed: 6 },
    ];
  }

  const series: Record<string, Series> = {};

  for (const lg of ['AL', 'NL'] as League[]) {
    const s = leagueSeeds[lg];
    series[`wc_${lg}_1`] = {
      id: `wc_${lg}_1`, round: 'wild_card', lg, status: 'active',
      higherSeed: s[2], lowerSeed: s[5],
      higherWins: 0, lowerWins: 0, gamesNeeded: 2, games: [], atHigher: 'all',
    };
    series[`wc_${lg}_2`] = {
      id: `wc_${lg}_2`, round: 'wild_card', lg, status: 'active',
      higherSeed: s[3], lowerSeed: s[4],
      higherWins: 0, lowerWins: 0, gamesNeeded: 2, games: [], atHigher: 'all',
    };
    series[`ds_${lg}_1`] = {
      id: `ds_${lg}_1`, round: 'division', lg, status: 'pending',
      higherSeed: s[0], lowerSeed: null,
      sourceSeries: `wc_${lg}_2`,
      higherWins: 0, lowerWins: 0, gamesNeeded: 3, games: [], atHigher: '2-2-1',
    };
    series[`ds_${lg}_2`] = {
      id: `ds_${lg}_2`, round: 'division', lg, status: 'pending',
      higherSeed: s[1], lowerSeed: null,
      sourceSeries: `wc_${lg}_1`,
      higherWins: 0, lowerWins: 0, gamesNeeded: 3, games: [], atHigher: '2-2-1',
    };
    series[`lcs_${lg}`] = {
      id: `lcs_${lg}`, round: 'lcs', lg, status: 'pending',
      higherSeed: null, lowerSeed: null,
      sourceSeries: [`ds_${lg}_1`, `ds_${lg}_2`],
      higherWins: 0, lowerWins: 0, gamesNeeded: 4, games: [], atHigher: '2-3-2',
    };
  }

  series.ws = {
    id: 'ws', round: 'world_series', lg: 'BOTH', status: 'pending',
    higherSeed: null, lowerSeed: null,
    sourceSeries: ['lcs_AL', 'lcs_NL'],
    higherWins: 0, lowerWins: 0, gamesNeeded: 4, games: [], atHigher: '2-3-2',
  };

  return {
    seeds: leagueSeeds,
    series,
    currentRound: 'wild_card',
    dayStarted: state.day,
    champion: null,
  };
}

export function simSeriesGame(state: GameState, series: Series, rng: RNG): Series {
  if (series.status !== 'active' || !series.higherSeed || !series.lowerSeed) return series;
  const gameNum = series.games.length + 1;
  let homeFid: string;
  if (series.atHigher === 'all') homeFid = series.higherSeed.id;
  else if (series.atHigher === '2-2-1') homeFid = (gameNum <= 2 || gameNum === 5) ? series.higherSeed.id : series.lowerSeed.id;
  else if (series.atHigher === '2-3-2') homeFid = (gameNum <= 2 || gameNum >= 6) ? series.higherSeed.id : series.lowerSeed.id;
  else homeFid = series.higherSeed.id;
  const awayFid = homeFid === series.higherSeed.id ? series.lowerSeed.id : series.higherSeed.id;

  const fakeGame = { id: `${series.id}_g${gameNum}`, day: state.day, home: homeFid, away: awayFid, played: false };
  const result = simGame(rng, state, fakeGame);

  const fin = state.finances[homeFid];
  fin.ledger.postseasonRev = (fin.ledger.postseasonRev || 0) + Math.round(result.attendance * (fin.premiumPrice * 0.3 + fin.ticketPrice * 1.8));

  const winnerId = result.winner;
  if (winnerId === series.higherSeed.id) series.higherWins++;
  else series.lowerWins++;

  series.games.push({
    gameNum, day: state.day, home: homeFid, away: awayFid,
    homeScore: result.homeScore, awayScore: result.awayScore, winner: winnerId,
  });

  if (series.higherWins >= series.gamesNeeded) {
    series.status = 'complete';
    series.winner = series.higherSeed.id;
    series.loser = series.lowerSeed.id;
  } else if (series.lowerWins >= series.gamesNeeded) {
    series.status = 'complete';
    series.winner = series.lowerSeed.id;
    series.loser = series.higherSeed.id;
  }
  return series;
}

export function advancePostseasonDay(state: GameState, rng: RNG): GameState {
  const bracket = state.bracket;
  if (!bracket || bracket.champion) return state;

  const s: GameState = { ...state, bracket: { ...bracket, series: { ...bracket.series } } };
  const sBracket = s.bracket!;

  const activeIds = Object.keys(sBracket.series).filter((id) => sBracket.series[id].status === 'active');
  for (const id of activeIds) {
    sBracket.series[id] = simSeriesGame(s, sBracket.series[id], rng);
  }

  for (const id of Object.keys(sBracket.series)) {
    const series = sBracket.series[id];
    if (series.status !== 'complete' || series._promoted) continue;

    if (series.round === 'wild_card') {
      const dsTargetId = id.endsWith('_1')
        ? id.replace(/_1$/, '').replace('wc_', 'ds_') + '_2'
        : id.replace(/_2$/, '').replace('wc_', 'ds_') + '_1';
      const target = sBracket.series[dsTargetId];
      if (target) {
        const winnerSeed = series.winner === series.higherSeed!.id ? series.higherSeed! : series.lowerSeed!;
        target.lowerSeed = winnerSeed;
        target.status = 'active';
      }
    } else if (series.round === 'division') {
      const lcsId = `lcs_${series.lg}`;
      const lcs = sBracket.series[lcsId];
      const winnerSeed = series.winner === series.higherSeed!.id ? series.higherSeed! : series.lowerSeed!;
      if (!lcs.higherSeed) {
        lcs.higherSeed = winnerSeed;
      } else {
        if (winnerSeed.seed < lcs.higherSeed.seed) {
          lcs.lowerSeed = lcs.higherSeed;
          lcs.higherSeed = winnerSeed;
        } else {
          lcs.lowerSeed = winnerSeed;
        }
        lcs.status = 'active';
      }
    } else if (series.round === 'lcs') {
      const ws = sBracket.series.ws;
      const winnerSeed = series.winner === series.higherSeed!.id ? series.higherSeed! : series.lowerSeed!;
      if (!ws.higherSeed) {
        ws.higherSeed = winnerSeed;
      } else {
        const currentWins = state.standings[ws.higherSeed.id]?.wins || 0;
        const newWins = state.standings[winnerSeed.id]?.wins || 0;
        if (newWins > currentWins) {
          ws.lowerSeed = ws.higherSeed;
          ws.higherSeed = winnerSeed;
        } else {
          ws.lowerSeed = winnerSeed;
        }
        ws.status = 'active';
      }
    } else if (series.round === 'world_series') {
      sBracket.champion = series.winner!;
      FRANCHISES[series.winner!].champ += 1;
      FRANCHISES[series.winner!].pennants = (FRANCHISES[series.winner!].pennants || 0) + 1;
      const champStaff = state.staffByFid?.[series.winner!];
      if (champStaff && state.coaches) {
        for (const role of ['manager', 'pitching_coach', 'hitting_coach'] as const) {
          const cid = champStaff[role];
          if (cid && state.coaches[cid]) state.coaches[cid].championships += 1;
        }
      }
    }

    const winnerName = `${FRANCHISES[series.winner!].city} ${FRANCHISES[series.winner!].name}`;
    const loserName = `${FRANCHISES[series.loser!].city} ${FRANCHISES[series.loser!].name}`;
    const roundLabel =
      series.round === 'wild_card' ? 'Wild Card Series' :
      series.round === 'division' ? 'Division Series' :
      series.round === 'lcs' ? `${series.lg} Championship Series` :
      'World Series';
    const score = `${Math.max(series.higherWins, series.lowerWins)}–${Math.min(series.higherWins, series.lowerWins)}`;

    s.news = [{
      id: `post_${id}_${s.season}`,
      day: s.day,
      season: s.season,
      headline: series.round === 'world_series' ? `${winnerName} win the World Series` : `${winnerName} advance, defeat ${FRANCHISES[series.loser!].abbr} ${score}`,
      body: series.round === 'world_series'
        ? `${winnerName} capture the ${s.season} championship, defeating ${loserName} ${score} in the Fall Classic.`
        : `${winnerName} close out the ${roundLabel} ${score} over ${loserName}.`,
      category: series.round === 'world_series' ? 'league' : 'team',
    }, ...s.news];

    series._promoted = true;
  }

  const allWcDone = Object.values(sBracket.series).filter((x) => x.round === 'wild_card').every((x) => x.status === 'complete');
  const allDsDone = Object.values(sBracket.series).filter((x) => x.round === 'division').every((x) => x.status === 'complete');
  const allLcsDone = Object.values(sBracket.series).filter((x) => x.round === 'lcs').every((x) => x.status === 'complete');
  if (sBracket.champion) sBracket.currentRound = 'complete';
  else if (allLcsDone) sBracket.currentRound = 'world_series';
  else if (allDsDone) sBracket.currentRound = 'lcs';
  else if (allWcDone) sBracket.currentRound = 'division';

  return s;
}
