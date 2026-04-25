import { useMemo, useState } from 'react';
import { S, COLORS } from '../styles/tokens';
import { useGame } from '../state/store';
import { FRANCHISES } from '../engine/franchises';
import { EXPANSION_CITIES, EXPANSION_COLORS } from '../engine/expansion';
import type { ExpansionConfig, League, Division } from '../engine/types';

export function NewGame() {
  const { setView, newGame } = useGame();

  const [scenario, setScenario] = useState<'normal' | 'turnaround' | 'expansion'>('normal');
  const [pickedFid, setPickedFid] = useState<string>('nyy');
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1e9));
  const [expansionCity, setExpansionCity] = useState<string>(EXPANSION_CITIES[0].city);
  const [expansionName, setExpansionName] = useState<string>('Mavericks');
  const [expansionLg, setExpansionLg] = useState<League>('AL');
  const [expansionDiv, setExpansionDiv] = useState<Division>('West');
  const [expansionColor, setExpansionColor] = useState<number>(0);

  const groupedFranchises = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const fid of Object.keys(FRANCHISES)) {
      const f = FRANCHISES[fid];
      const k = `${f.lg} ${f.div}`;
      groups[k] = groups[k] || [];
      groups[k].push(fid);
    }
    return groups;
  }, []);

  function start() {
    if (scenario === 'expansion') {
      const cityChoice = EXPANSION_CITIES.find((c) => c.city === expansionCity)!;
      const colors = EXPANSION_COLORS[expansionColor];
      const config: ExpansionConfig = {
        abbr: expansionName.slice(0, 3).toUpperCase(),
        city: cityChoice.city,
        state: cityChoice.state,
        name: expansionName,
        lg: expansionLg,
        div: expansionDiv,
        color: colors.primary,
        secondaryColor: colors.secondary,
        park: `${expansionCity} Ballpark`,
        cap: 42000,
        premium: 3200,
        pf: 100,
        amen: 4,
        marketTier: cityChoice.market as ExpansionConfig['marketTier'],
        marketLoyalty: cityChoice.loyaltyBase,
        marketCorp: cityChoice.corp,
      };
      newGame(seed, 'exp_user', 'expansion', config);
    } else {
      newGame(seed, pickedFid, scenario);
    }
  }

  return (
    <div style={S.shell}>
      <header style={S.masthead}>
        <div style={S.mastheadInner}>
          <div style={S.mastheadMeta}>NEW GAME</div>
          <div>
            <div style={S.mastheadTitle}>Maverick Baseball</div>
            <div style={S.mastheadSub}>Choose Your Club</div>
          </div>
          <div style={S.mastheadMeta}>SEED · {seed}</div>
        </div>
      </header>
      <main style={S.page}>
        <h2 style={S.sectionHead}>Scenario</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {(['normal', 'turnaround', 'expansion'] as const).map((s) => (
            <button key={s} style={S.radioBtn(scenario === s)} onClick={() => setScenario(s)}>
              {s === 'normal' ? 'Standard' : s === 'turnaround' ? 'Turnaround' : 'Expansion'}
            </button>
          ))}
        </div>

        {scenario !== 'expansion' && (
          <>
            <h2 style={S.sectionHead}>Pick a Franchise</h2>
            <div style={S.sectionRule} />
            {Object.entries(groupedFranchises).map(([div, fids]) => (
              <div key={div} style={{ marginBottom: 24 }}>
                <div style={S.eyebrow}>{div}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {fids.map((fid) => {
                    const f = FRANCHISES[fid];
                    return (
                      <button key={fid} style={S.franchiseCard(pickedFid === fid)} onClick={() => setPickedFid(fid)}>
                        <div style={{ height: 6, background: f.color, marginBottom: 8 }} />
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16 }}>{f.city}</div>
                        <div style={{ fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic', color: COLORS.inkDim, fontSize: 13 }}>
                          {f.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {scenario === 'expansion' && (
          <>
            <h2 style={S.sectionHead}>Build an Expansion Franchise</h2>
            <div style={S.sectionRule} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.panel}>
                <div style={S.panelTitle}>Identity</div>
                <label style={{ ...S.eyebrow, display: 'block', marginTop: 8 }}>Team Name</label>
                <input
                  type="text"
                  value={expansionName}
                  onChange={(e) => setExpansionName(e.target.value)}
                  style={{ width: '100%', padding: 8, fontFamily: 'inherit', fontSize: 16, border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
                />
                <label style={{ ...S.eyebrow, display: 'block', marginTop: 12 }}>Home City</label>
                <select
                  value={expansionCity}
                  onChange={(e) => setExpansionCity(e.target.value)}
                  style={{ width: '100%', padding: 8, fontFamily: 'inherit', fontSize: 14, border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
                >
                  {EXPANSION_CITIES.map((c) => (
                    <option key={c.city} value={c.city}>{c.city}, {c.state}</option>
                  ))}
                </select>
                <label style={{ ...S.eyebrow, display: 'block', marginTop: 12 }}>Color Palette</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EXPANSION_COLORS.map((c, i) => (
                    <button
                      key={i}
                      style={{
                        width: 36, height: 36, cursor: 'pointer',
                        background: c.primary, border: i === expansionColor ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.ink}`,
                      }}
                      onClick={() => setExpansionColor(i)}
                    />
                  ))}
                </div>
              </div>
              <div style={S.panel}>
                <div style={S.panelTitle}>League Placement</div>
                <label style={{ ...S.eyebrow, display: 'block' }}>League</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.radioBtn(expansionLg === 'AL')} onClick={() => setExpansionLg('AL')}>AL</button>
                  <button style={S.radioBtn(expansionLg === 'NL')} onClick={() => setExpansionLg('NL')}>NL</button>
                </div>
                <label style={{ ...S.eyebrow, display: 'block', marginTop: 12 }}>Division</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['East', 'Central', 'West'] as Division[]).map((d) => (
                    <button key={d} style={S.radioBtn(expansionDiv === d)} onClick={() => setExpansionDiv(d)}>{d}</button>
                  ))}
                </div>
                <p style={{ ...S.byline, marginTop: 16, fontSize: 13 }}>
                  A second expansion team will be auto-generated in the opposite league's same division to keep the league balanced at 32 clubs (6 per division).
                </p>
              </div>
            </div>
          </>
        )}

        <div style={{ ...S.sectionRule, marginTop: 24 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={S.eyebrow}>Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
            style={{ width: 160, padding: 6, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.ink}`, background: COLORS.panel }}
          />
          <button onClick={() => setSeed(Math.floor(Math.random() * 1e9))} style={S.radioBtn(false)}>Reroll</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setView('splash')} style={S.radioBtn(false)}>← Back</button>
          <button onClick={start} style={{ ...S.radioBtn(true), background: COLORS.red, borderColor: COLORS.red }}>
            Start Career
          </button>
        </div>
      </main>
    </div>
  );
}
