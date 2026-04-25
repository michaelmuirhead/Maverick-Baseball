import { S } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { fmtShort, toScout } from '../engine/format';
import { describeClauses } from '../engine/contractClauses';

export function RosterManagement() {
  const { state } = useGame();
  if (!state) return null;
  const fid = state.userFranchiseId;
  const f = FRANCHISES[fid];
  const fortyMan = (state.fortyMan?.[fid] || []).map(id => state.players[id]).filter(Boolean);
  const active = (state.rosters[fid] || []).map(id => state.players[id]).filter(Boolean);
  const arb = active.filter(p => p.contract?.status === 'arb');
  const nearFA = active.filter(p => p.contract && p.contract.years <= 1 && p.contract.status !== 'pre-arb');
  const qos = state.qualifyingOffers || [];
  const myQOs = qos.filter(qo => qo.fromFid === fid);
  const optionsRemaining = (p: any) => 3 - (p.optionsUsed || 0);

  return (
    <div>
      <div style={S.sectionRule}>
        <h2 style={S.sectionHead}>{f.city} {f.name} Roster Management</h2>
        <div style={S.sectionSub}>40-man, options used, arbitration, and qualifying offers.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Box label="Active 26" value={`${active.length}/26`} />
        <Box label="40-Man" value={`${fortyMan.length}/40`} />
        <Box label="Arb-Eligible" value={String(arb.length)} />
        <Box label="QOs Issued" value={String(myQOs.length)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.panel}>
          <div style={S.panelTitle}>40-Man Roster</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Pos</th>
                <th style={S.th}>Name</th>
                <th style={{ ...S.th, ...S.thNum }}>Age</th>
                <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                <th style={{ ...S.th, ...S.thNum }}>Opts</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {fortyMan.slice(0, 40).map(p => (
                <tr key={p.id}>
                  <td style={{ ...S.td, ...S.tdPos }}>{p.pos}</td>
                  <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{p.age}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                  <td style={{ ...S.td, ...S.tdNum }}>{optionsRemaining(p)}</td>
                  <td style={S.td}>{p.prospect ? 'Prospect' : 'MLB'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Arbitration Eligible</div>
            {arb.length === 0
              ? <div style={{ fontSize: 12, color: '#777' }}>No arb-eligible players this offseason.</div>
              : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Name</th>
                      <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                      <th style={{ ...S.th, ...S.thNum }}>Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arb.map(p => (
                      <tr key={p.id}>
                        <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{p.contract ? fmtShort(p.contract.salary) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>

          <div style={{ ...S.panel, marginTop: 16 }}>
            <div style={S.panelTitle}>Approaching Free Agency (final year)</div>
            {nearFA.length === 0
              ? <div style={{ fontSize: 12, color: '#777' }}>No expiring contracts.</div>
              : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Name</th>
                      <th style={{ ...S.th, ...S.thNum }}>OVR</th>
                      <th style={{ ...S.th, ...S.thNum }}>Salary</th>
                      <th style={S.th}>Clauses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearFA.map(p => (
                      <tr key={p.id}>
                        <td style={{ ...S.td, ...S.tdName }}>{p.firstName} {p.lastName}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{toScout(p.ratings.overall)}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{p.contract ? fmtShort(p.contract.salary) : '-'}</td>
                        <td style={{ ...S.td, fontSize: 11 }}>
                          {describeClauses(p.contract?.clauses).join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>

          <div style={{ ...S.panel, marginTop: 16 }}>
            <div style={S.panelTitle}>Qualifying Offers Tendered</div>
            {myQOs.length === 0
              ? <div style={{ fontSize: 12, color: '#777' }}>No QOs out.</div>
              : myQOs.map(qo => {
                const p = state.players[qo.playerId];
                return (
                  <div key={qo.playerId} style={{ fontSize: 12, padding: '4px 0' }}>
                    {p?.firstName} {p?.lastName} — {qo.declined ? 'Declined' : qo.signedElsewhere ? 'Signed elsewhere (comp pick)' : 'Pending'}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...S.panel, padding: 12 }}>
      <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
