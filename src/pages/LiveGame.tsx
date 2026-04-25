import { useState, useMemo } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { RNG } from '../engine/rng';
import {
  startLiveGame, simNextHalfInning, simFullLiveGame, describeAtbat,
  type LiveGameState,
} from '../engine/liveGame';
import { simGame, applyResult } from '../engine/sim';

export function LiveGame() {
  const { state, setPage, setState } = useGame();
  const [live, setLive] = useState<LiveGameState | null>(null);
  const [rngSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [committed, setCommitted] = useState(false);

  if (!state) return null;
  const fid = state.userFranchiseId;

  // Find next unplayed user-team game
  const upcomingGames = useMemo(() => {
    return state.schedule
      .filter((g) => !g.played && (g.home === fid || g.away === fid))
      .slice(0, 5);
  }, [state.schedule, fid]);

  if (!live) {
    return (
      <div>
        <div style={S.sectionRule}>
          <h2 style={S.sectionHead}>Live Game Feed</h2>
          <div style={S.sectionSub}>Watch a game unfold inning by inning</div>
        </div>
        <div style={S.panel}>
          <div style={S.panelTitle}>Pick an upcoming game</div>
          {upcomingGames.length === 0 ? (
            <div style={{ ...S.byline, marginTop: 8 }}>
              No upcoming games. Wait for the regular season to begin.
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {upcomingGames.map((g) => {
                const home = FRANCHISES[g.home];
                const away = FRANCHISES[g.away];
                return (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 4px',
                      borderBottom: '1px dotted rgba(26,24,20,0.13)',
                    }}
                  >
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.inkDim, width: 60 }}>
                      Day {g.day}
                    </span>
                    <span style={{ flex: 1, fontFamily: "'IBM Plex Serif', serif" }}>
                      {away.city} @ {home.city}
                    </span>
                    <button
                      onClick={() => setLive(startLiveGame(state, g))}
                      style={{ ...S.radioBtn(true), background: COLORS.green, borderColor: COLORS.green, fontSize: 11 }}
                    >
                      Start
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setPage('schedule')}
            style={{ ...S.radioBtn(false), marginTop: 12 }}
          >
            Back to schedule
          </button>
        </div>
      </div>
    );
  }

  const home = FRANCHISES[live.homeFid];
  const away = FRANCHISES[live.awayFid];

  const advance = () => {
    if (live.finished) return;
    const rng = new RNG(rngSeed + live.log.length);
    const next = simNextHalfInning(state, { ...live, log: [...live.log] }, rng);
    setLive(next);
  };

  const finish = () => {
    const rng = new RNG(rngSeed + 999);
    const sched = state.schedule.find((g) => g.id === live.gameId)!;
    const next = simFullLiveGame(state, sched, rng);
    setLive(next);
  };

  // Commit the live result into the actual game schedule + sim the rest of the
  // day's slate in the background. Runs once when live.finished flips true.
  if (live.finished && !committed && state) {
    const game = state.schedule.find((g) => g.id === live.gameId);
    if (game) {
      const winner = (live.scoreHome > live.scoreAway) ? game.home : game.away;
      const loser = winner === game.home ? game.away : game.home;
      game.result = {
        homeScore: live.scoreHome,
        awayScore: live.scoreAway,
        winner, loser,
        attendance: 0,
      };
      game.played = true;
      const rng = new RNG(rngSeed + 100);
      applyResult(state, game, rng);
      // Sim the rest of the day's games
      for (const idx of (state.byDay[game.day] || [])) {
        const g = state.schedule[idx];
        if (g && !g.played) {
          g.result = simGame(rng, state, g);
          g.played = true;
          applyResult(state, g, rng);
        }
      }
      setState({ ...state });
      setCommitted(true);
    }
  }

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{away.city} @ {home.city}</h2>
        <div style={S.sectionSub}>
          {live.finished ? 'FINAL' : `${live.half === 'top' ? 'Top' : 'Bot'} ${live.inning} - ${live.outs} outs`}
        </div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 32, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: COLORS.inkDim }}>
              {away.abbr}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, lineHeight: 1 }}>
              {live.scoreAway}
            </div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: COLORS.inkDim }}>
            INN {live.inning}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: COLORS.inkDim }}>
              {home.abbr}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, lineHeight: 1 }}>
              {live.scoreHome}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {!live.finished && (
            <>
              <button
                onClick={advance}
                style={{ ...S.radioBtn(true), background: COLORS.ink }}
              >
                Next half-inning
              </button>
              <button
                onClick={finish}
                style={{ ...S.radioBtn(true), background: COLORS.gold, borderColor: COLORS.gold }}
              >
                Sim to final
              </button>
            </>
          )}
          <button
            onClick={() => setLive(null)}
            style={S.radioBtn(false)}
          >
            New game
          </button>
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>Play-by-play</div>
        {live.log.length === 0 ? (
          <div style={{ ...S.byline, marginTop: 8 }}>Game hasn't started yet. Click "Next half-inning".</div>
        ) : (
          <div style={{ marginTop: 8, maxHeight: 480, overflowY: 'auto' }}>
            {(() => {
              const grouped: { key: string; half: string; inning: number; entries: typeof live.log }[] = [];
              for (const a of live.log) {
                const key = `${a.inning}-${a.half}`;
                let g = grouped.find((x) => x.key === key);
                if (!g) {
                  g = { key, half: a.half, inning: a.inning, entries: [] };
                  grouped.push(g);
                }
                g.entries.push(a);
              }
              return grouped.map((g) => (
                <div key={g.key} style={{ marginBottom: 12 }}>
                  <div style={{ ...S.eyebrow, marginBottom: 4 }}>
                    {g.half === 'top' ? 'Top' : 'Bot'} {g.inning} - {g.half === 'top' ? away.abbr : home.abbr} batting
                  </div>
                  {g.entries.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 8px',
                        fontFamily: "'IBM Plex Serif', serif",
                        fontSize: 13,
                        background: a.runs > 0 ? '#f8f2e4' : 'transparent',
                        borderLeft: a.outcome === 'HR' ? `3px solid ${COLORS.gold}` : 'none',
                        marginLeft: a.outcome === 'HR' ? -3 : 0,
                        paddingLeft: a.outcome === 'HR' ? 5 : 8,
                      }}
                    >
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim, marginRight: 8 }}>
                        [{a.outcome}]
                      </span>
                      {describeAtbat(a)}
                      <span style={{ marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.inkDim }}>
                        {a.scoreAway}-{a.scoreHome}
                      </span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
