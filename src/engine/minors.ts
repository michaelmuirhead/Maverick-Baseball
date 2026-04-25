// Minor-league system: AAA / AA / A.
// Each franchise has three farm rosters. Prospects get assigned to the level
// that matches their potential and age. Players can be called up to the
// active roster or sent down. AAA acts as the immediate replacement bench.

import type { GameState, Player, MinorRosters, MinorLevel } from './types';
import type { RNG } from './rng';
import { FRANCHISES } from './franchises';

const TARGET_PER_LEVEL: Record<MinorLevel, number> = { aaa: 28, aa: 28, a: 30 };

export function emptyMinors(): MinorRosters {
  return { aaa: [], aa: [], a: [] };
}

export function initMinorRosters(state: GameState) {
  state.minorRosters = state.minorRosters || {};
  for (const fid of Object.keys(FRANCHISES)) {
    if (!state.minorRosters[fid]) state.minorRosters[fid] = emptyMinors();
  }

  // Migrate existing prospects into appropriate levels
  const prospects = state.prospects || [];
  for (const pid of prospects) {
    const p = state.players[pid];
    if (!p || !p.franchiseId) continue;
    const level = levelForProspect(p);
    const minors = state.minorRosters[p.franchiseId];
    if (!minors) continue;
    if (!isInAnyMinor(state, pid)) {
      minors[level].push(pid);
    }
  }
}

/** Pick a starting tier based on age + potential + current OVR. */
export function levelForProspect(p: Player): MinorLevel {
  if (p.age >= 22 && p.ratings.overall >= 50) return 'aaa';
  if (p.age >= 21 && p.ratings.overall >= 42) return 'aa';
  if (p.age >= 20 && p.potential >= 55) return 'aa';
  return 'a';
}

function isInAnyMinor(state: GameState, pid: string): boolean {
  const ms = state.minorRosters || {};
  for (const fid of Object.keys(ms)) {
    const m = ms[fid];
    if (m.aaa.includes(pid) || m.aa.includes(pid) || m.a.includes(pid)) return true;
  }
  return false;
}

function findMinorPlayer(state: GameState, pid: string): { fid: string; level: MinorLevel } | null {
  const ms = state.minorRosters || {};
  for (const fid of Object.keys(ms)) {
    const m = ms[fid];
    if (m.aaa.includes(pid)) return { fid, level: 'aaa' };
    if (m.aa.includes(pid)) return { fid, level: 'aa' };
    if (m.a.includes(pid)) return { fid, level: 'a' };
  }
  return null;
}

/** Promote a prospect from minors onto the active roster. */
export function callUpFromMinors(
  state: GameState,
  playerId: string,
): { ok: boolean; reason?: string } {
  const found = findMinorPlayer(state, playerId);
  if (!found) return { ok: false, reason: 'Player not in minor leagues' };
  const p = state.players[playerId];
  if (!p) return { ok: false, reason: 'Unknown player' };

  state.minorRosters![found.fid][found.level] =
    state.minorRosters![found.fid][found.level].filter((id) => id !== playerId);
  state.prospects = (state.prospects || []).filter((id) => id !== playerId);

  // Give them a league-min contract if they don't have one
  if (!p.contract) {
    p.contract = {
      salary: 760_000,
      years: 1,
      status: 'pre-arb',
      serviceDays: 0,
    };
  }
  p.prospect = false;
  p.franchiseId = found.fid;
  state.rosters[found.fid] = state.rosters[found.fid] || [];
  if (!state.rosters[found.fid].includes(playerId)) {
    state.rosters[found.fid].push(playerId);
  }
  return { ok: true };
}

/** Send an active-roster player down to AAA. */
export function sendDownToMinors(
  state: GameState,
  playerId: string,
  targetLevel: MinorLevel = 'aaa',
): { ok: boolean; reason?: string } {
  const p = state.players[playerId];
  if (!p || !p.franchiseId) return { ok: false, reason: 'Player not on roster' };
  const fid = p.franchiseId;
  // Veterans w/ 5+ yrs service can refuse assignment - skip those
  if (p.contract && (p.contract.serviceDays || 0) >= 5 * 172) {
    return { ok: false, reason: 'Veteran has 5+ yrs service - cannot be optioned' };
  }
  state.rosters[fid] = (state.rosters[fid] || []).filter((id) => id !== playerId);
  state.minorRosters = state.minorRosters || {};
  state.minorRosters[fid] = state.minorRosters[fid] || emptyMinors();
  if (!state.minorRosters[fid][targetLevel].includes(playerId)) {
    state.minorRosters[fid][targetLevel].push(playerId);
  }
  return { ok: true };
}

/**
 * AI roster maintenance - each team auto-promotes from AAA when active count
 * drops below 22 or a position is empty.
 */
export function maintainAIRoster(state: GameState, fid: string, _rng: RNG) {
  const roster = state.rosters[fid] || [];
  const minors = state.minorRosters?.[fid];
  if (!minors) return;

  const players = roster.map((id) => state.players[id]).filter(Boolean);
  const healthy = players.filter((p) => p.health === 'healthy');

  // Position coverage check - hitters
  const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  const missingPos = POS.filter((pos) => !healthy.some((pl) => pl.pos === pos));
  const spCount = healthy.filter((p) => p.pos === 'SP').length;
  const rpCount = healthy.filter((p) => ['RP', 'CL'].includes(p.pos)).length;

  // Promote from AAA to fill gaps
  for (const pos of missingPos) {
    const candidate = minors.aaa
      .map((id) => state.players[id])
      .filter((p) => p && p.pos === pos)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)[0];
    if (candidate) callUpFromMinors(state, candidate.id);
  }
  if (spCount < 5) {
    const need = 5 - spCount;
    const sps = minors.aaa
      .map((id) => state.players[id])
      .filter((p) => p && p.pos === 'SP')
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .slice(0, need);
    for (const sp of sps) callUpFromMinors(state, sp.id);
  }
  if (rpCount < 5) {
    const need = 5 - rpCount;
    const rps = minors.aaa
      .map((id) => state.players[id])
      .filter((p) => p && (p.pos === 'RP' || p.pos === 'CL'))
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .slice(0, need);
    for (const rp of rps) callUpFromMinors(state, rp.id);
  }
  // Top up to 26
  if (state.rosters[fid].length < 26) {
    const slotsNeeded = 26 - state.rosters[fid].length;
    const best = minors.aaa
      .map((id) => state.players[id])
      .filter(Boolean)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .slice(0, slotsNeeded);
    for (const p of best) callUpFromMinors(state, p.id);
  }
}

/**
 * At season rollover, promote young players up the ladder based on
 * development - good prospects move from A to AA, AA to AAA.
 */
export function promoteMinorLeaguers(state: GameState, rng: RNG) {
  const ms = state.minorRosters;
  if (!ms) return;
  for (const fid of Object.keys(ms)) {
    const m = ms[fid];

    // A -> AA: best 4-6 each year if performing
    const aPromos = m.a
      .map((id) => state.players[id])
      .filter((p) => p && !p.retired && p.age >= 20 && p.ratings.overall >= 42)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, rng.int(3, 6));
    for (const p of aPromos) {
      m.a = m.a.filter((id) => id !== p.id);
      m.aa.push(p.id);
    }

    // AA -> AAA: best 3-5
    const aaPromos = m.aa
      .map((id) => state.players[id])
      .filter((p) => p && !p.retired && p.age >= 21 && p.ratings.overall >= 50)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, rng.int(2, 5));
    for (const p of aaPromos) {
      m.aa = m.aa.filter((id) => id !== p.id);
      m.aaa.push(p.id);
    }
  }
}

/** Each team's AAA gives slight development boost (offseason); call at rollover. */
export function minorLeagueDevelopment(state: GameState, rng: RNG) {
  const ms = state.minorRosters;
  if (!ms) return;
  for (const fid of Object.keys(ms)) {
    const m = ms[fid];
    for (const level of ['aaa', 'aa', 'a'] as MinorLevel[]) {
      const bonus = level === 'aaa' ? 1.8 : level === 'aa' ? 1.3 : 0.9;
      for (const pid of m[level]) {
        const p = state.players[pid];
        if (!p || p.retired) continue;
        if (p.age > 25) continue;
        // Each year +0.5 to 2 OVR for prospects below their potential
        if (p.ratings.overall < p.potential) {
          const bump = Math.round(rng.float(0.3, bonus));
          p.ratings.overall = Math.min(p.potential, p.ratings.overall + bump);
        }
      }
    }
  }
}

export function minorRosterCounts(state: GameState, fid: string): { aaa: number; aa: number; a: number } {
  const m = state.minorRosters?.[fid];
  if (!m) return { aaa: 0, aa: 0, a: 0 };
  return { aaa: m.aaa.length, aa: m.aa.length, a: m.a.length };
}
