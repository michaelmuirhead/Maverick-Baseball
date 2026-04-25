import type { ReactNode } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame, type Page } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel, seasonDate } from '../engine/format';

const PAGES: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'roster', label: 'Roster' },
  { id: 'minors', label: 'Minors' },
  { id: 'staff', label: 'Staff' },
  { id: 'trades', label: 'Trades' },
  { id: 'free_agency', label: 'Free Agency' },
  { id: 'draft', label: 'Draft' },
  { id: 'international', label: 'Intl' },
  { id: 'rule5', label: 'Rule 5' },
  { id: 'prospects', label: 'Prospects' },
  { id: 'injured_list', label: 'Injured List' },
  { id: 'standings', label: 'Standings' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'live_game', label: 'Live' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'finances', label: 'Finances' },
  { id: 'stadium', label: 'Stadium' },
  { id: 'news', label: 'News' },
  { id: 'awards', label: 'Awards' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { state, page, setPage, advanceOne, advanceTo, clearSavedGame, setView } = useGame();
  if (!state) return <>{children}</>;
  const userTeam = FRANCHISES[state.userFranchiseId];
  const standing = state.standings[state.userFranchiseId];
  const fin = state.finances[state.userFranchiseId];

  return (
    <div style={S.shell}>
      <header style={S.masthead}>
        <div style={S.mastheadInner}>
          <div style={S.mastheadMeta}>VOL. {state.season - 2025} - NO. {state.day < 0 ? `OFF-${Math.abs(state.day)}` : state.day}</div>
          <div>
            <div style={S.mastheadTitle}>Maverick Baseball</div>
            <div style={S.mastheadSub}>The Front-Office Broadsheet</div>
          </div>
          <div style={{ ...S.mastheadMeta, textAlign: 'right' }}>
            {userTeam.city} {userTeam.name} - {standing.wins}-{standing.losses} - {fmtShort(fin.teamCash)}
          </div>
        </div>
      </header>

      <nav style={S.nav}>
        <div style={S.navInner}>
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              style={S.navItem(p.id === page)}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={S.page}>{children}</main>

      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerDate}>{seasonDate(state.day, state.season)}</div>
          <div style={S.footerPhase}>{phaseLabel(state.phase, state)}</div>
          <div style={{ flex: 1 }} />
          <button style={S.footerBtn} onClick={() => advanceOne()}>+1 Day</button>
          <button style={S.footerBtn} onClick={() => advanceTo('next_week')}>+1 Week</button>
          {state.phase === 'offseason' && (
            <>
              <button style={S.footerBtn} onClick={() => advanceTo('fa_open')}>FA Open</button>
              <button style={S.footerBtn} onClick={() => advanceTo('draft_day')}>Draft Day</button>
              <button style={S.footerBtnPrimary} onClick={() => advanceTo('opening_day')}>Opening Day</button>
            </>
          )}
          {state.phase === 'regular_season' && (
            <>
              <button style={S.footerBtn} onClick={() => advanceTo('trade_deadline')}>Deadline</button>
              <button style={S.footerBtnPrimary} onClick={() => advanceTo('end_of_season')}>End of Season</button>
            </>
          )}
          {state.phase === 'postseason' && (
            <button style={S.footerBtnPrimary} onClick={() => advanceTo('champion_crowned')}>Crown a Champion</button>
          )}
          <button
            style={{ ...S.footerBtn, borderColor: COLORS.cream }}
            onClick={() => {
              if (confirm('Quit to splash and clear saved game?')) {
                clearSavedGame();
                setView('splash');
              }
            }}
          >
            Quit
          </button>
        </div>
      </footer>
    </div>
  );
}
