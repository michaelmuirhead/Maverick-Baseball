import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmt, fmtShort } from '../engine/format';
import { franchiseHistory, championsList } from '../engine/teamHistory';
import { SortableTable, type SortableColumn } from '../components/SortableTable';
import type { TeamSeasonRecord } from '../engine/types';

function resultLabel(entry: TeamSeasonRecord): string {
  if (entry.champion) return 'World Champion';
  switch (entry.playoff_result) {
    case 'ws_loss': return 'WS runner-up';
    case 'lcs_out': return 'LCS';
    case 'ds_out': return 'Division Series';
    case 'wc_out': return 'Wild Card';
    default: return entry.made_playoffs ? 'Postseason' : 'Missed playoffs';
  }
}

export function TeamHistory() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const team = FRANCHISES[fid];
  const history = franchiseHistory(state, fid);
  const champs = championsList(state);

  const cols: SortableColumn<TeamSeasonRecord>[] = [
    { key: 'season', label: 'Year', sortValue: (r) => r.season, render: (r) => r.season, align: 'right', width: 60 },
    {
      key: 'record', label: 'Record',
      sortValue: (r) => r.wins,
      render: (r) => `${r.wins}–${r.losses}`,
      align: 'right', width: 80,
    },
    {
      key: 'pct', label: 'Win %',
      sortValue: (r) => r.wins / Math.max(1, r.wins + r.losses),
      render: (r) => (r.wins / Math.max(1, r.wins + r.losses)).toFixed(3),
      align: 'right', width: 72,
    },
    {
      key: 'result', label: 'Result',
      sortValue: (r) => r.champion ? 5 : r.playoff_result === 'ws_loss' ? 4 :
        r.playoff_result === 'lcs_out' ? 3 : r.playoff_result === 'ds_out' ? 2 :
        r.playoff_result === 'wc_out' ? 1 : 0,
      render: (r) => (
        <span style={{
          color: r.champion ? COLORS.green : r.made_playoffs ? COLORS.ink : COLORS.inkDim,
          fontWeight: r.champion ? 600 : 400,
        }}>{resultLabel(r)}</span>
      ),
    },
    {
      key: 'payroll', label: 'Payroll',
      sortValue: (r) => r.payroll,
      render: (r) => fmtShort(r.payroll),
      align: 'right', width: 90,
    },
    {
      key: 'net', label: 'Net',
      sortValue: (r) => r.net || 0,
      render: (r) => (
        <span style={{ color: (r.net || 0) >= 0 ? COLORS.green : COLORS.red }}>
          {r.net ? fmtShort(r.net) : '—'}
        </span>
      ),
      align: 'right', width: 90,
    },
    {
      key: 'job', label: 'Job Sec',
      sortValue: (r) => r.jobSecurityEnd ?? 0,
      render: (r) => r.jobSecurityEnd != null ? Math.round(r.jobSecurityEnd) : '—',
      align: 'right', width: 72,
    },
  ];

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>Team History</h2>
        <div style={S.sectionSub}>{team.city} {team.name}</div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={S.panelTitle}>Franchise record book</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
          <Stat label="Seasons" value={history.length} />
          <Stat label="Playoff apps" value={history.filter((r) => r.made_playoffs).length} />
          <Stat label="Pennants" value={history.filter((r) => r.playoff_result === 'ws_loss' || r.champion).length} />
          <Stat label="Championships" value={history.filter((r) => r.champion).length} />
          <Stat label="Career W–L" value={`${history.reduce((s, r) => s + r.wins, 0)}–${history.reduce((s, r) => s + r.losses, 0)}`} />
        </div>
      </div>

      <div style={{ ...S.panel, marginBottom: 16 }}>
        <div style={S.panelTitle}>Season-by-season</div>
        {history.length === 0 ? (
          <div style={{ color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }}>
            No seasons completed yet. Come back after your first World Series.
          </div>
        ) : (
          <SortableTable
            rows={history}
            columns={cols}
            initialSortKey="season"
            initialSortDir="desc"
            rowKey={(r) => String(r.season)}
          />
        )}
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>League Champions</div>
        {!state.championHistory || state.championHistory.length === 0 ? (
          <div style={{ color: COLORS.inkDim, fontStyle: 'italic', marginTop: 8 }}>
            No champion crowned yet.
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {[...state.championHistory].sort((a, b) => b.season - a.season).map((c) => {
              const f = FRANCHISES[c.championFid];
              return (
                <div key={c.season} style={{ borderBottom: '1px solid ' + COLORS.ink, padding: '12px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 80, fontFamily: "'DM Serif Display', serif", fontSize: 28, color: COLORS.green }}>
                    {c.season}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>
                      {f ? f.city + ' ' + f.name : c.championFid}
                    </div>
                    <div style={{ ...S.byline, fontSize: 12 }}>
                      Regular season: {c.wins}-{c.losses} ({((c.wins / Math.max(1, c.wins + c.losses)) * 100).toFixed(1)}%)
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, fontFamily: "'IBM Plex Serif', serif" }}>
                      <strong>Path:</strong>
                      {' '}
                      {c.defeated.map((d, i) => {
                        const opp = FRANCHISES[d.opponentFid];
                        const roundLabel = ({ wild_card: 'WC', division: 'DS', lcs: 'LCS', world_series: 'WS' } as const)[d.round];
                        return (
                          <span key={i}>
                            {i > 0 && <span style={{ color: COLORS.inkDim }}> &rarr; </span>}
                            <span><strong>{roundLabel}</strong> def. {opp?.abbr || d.opponentFid} {d.gamesWon}-{d.gamesLost}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const headStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: `1px solid ${COLORS.ink}`,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: COLORS.inkDim,
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={S.eyebrow}>{label}</div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24 }}>{value}</div>
    </div>
  );
}
