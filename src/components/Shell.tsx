import type { ReactNode } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame, type Page } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, phaseLabel, seasonDate } from '../engine/format';
import { NAV, findGroupForPage, firstSubOfGroup } from './navConfig';

export function Shell({ children }: { children: ReactNode }) {
  const { state, page, setPage, lastSubByGroup, advanceOne, advanceTo, clearSavedGame, setView } = useGame();
  if (!state) return <>{children}</>;
  const userTeam = FRANCHISES[state.userFranchiseId];
  const standing = state.standings[state.userFranchiseId];
  const fin = state.finances[state.userFranchiseId];

  const activeGroup = findGroupForPage(page);
  const activeGroupDef = NAV.find(g => g.id === activeGroup) || NAV[0];

  const onTopClick = (groupId: string) => {
    const remembered = lastSubByGroup[groupId];
    if (remembered) {
      setPage(remembered);
    } else {
      setPage(firstSubOfGroup(groupId));
    }
  };

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
          {NAV.map((g) => (
            <button
              key={g.id}
              type="button"
              style={S.navItem(g.id === activeGroup)}
              onClick={() => onTopClick(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={subBarStyle}>
        <div style={subBarInnerStyle}>
          {activeGroupDef.subs.map((s) => (
            <button
              key={s.id}
              type="button"
              style={subPillStyle(s.id === page)}
              onClick={() => setPage(s.id as Page)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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
          >Quit</button>
        </div>
      </footer>
    </div>
  );
}

const subBarStyle: React.CSSProperties = {
  background: '#f5efe0',
  borderBottom: `1px solid ${COLORS.ink}`,
  borderTop: `1px solid ${COLORS.ink}22`,
};

const subBarInnerStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
    display: 'flex',
  gap: 4,
  padding: '6px 16px',
  flexWrap: 'wrap',
};

const subPillStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#ebe2cb' : 'transparent',
  border: 0,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  color: active ? COLORS.ink : '#555',
  cursor: 'pointer',
  borderRadius: 3,
  fontFamily: 'inherit',
});
