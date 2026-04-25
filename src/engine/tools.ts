import type { Player, ToolGrades, GameState } from './types';

function r2g(r: number): number {
  if (r <= 0) return 20;
  if (r >= 99) return 80;
  const g = Math.round(20 + ((r - 10) * 60) / 90);
  return Math.max(20, Math.min(80, g));
}

export function deriveToolGrades(p: Player): ToolGrades {
  const r: any = p.ratings || {};
  const tg: ToolGrades = {};
  if (!p.isPitcher) {
    tg.hit = r2g(r.contact ?? r.overall ?? 50);
    tg.power = r2g(r.power ?? r.overall ?? 50);
    tg.run = r2g(r.speed ?? 50);
    tg.arm = r2g(r.armStr ?? r.fielding ?? 50);
    tg.field = r2g(r.fielding ?? 50);
    if (p.pos === 'C') {
      tg.framing = r2g(((r.fielding ?? 50) + (r.armStr ?? 50)) / 2);
      tg.blocking = r2g(r.fielding ?? 50);
      tg.throwing = r2g(r.armStr ?? r.fielding ?? 50);
    }
  } else {
    const fb = r.fastball ?? r.overall ?? 50;
    const sl = r.slider ?? 0;
    const cb = r.curve ?? r.curveball ?? 0;
    const ch = r.changeup ?? 0;
    const ct = r.cutter ?? 0;
    const sp = r.splitter ?? 0;
    const kn = r.knuckleball ?? 0;
    tg.fb = r2g(fb);
    if (sl) tg.sl = r2g(sl);
    if (cb) tg.cb = r2g(cb);
    if (ch) tg.ch = r2g(ch);
    if (ct) tg.ct = r2g(ct);
    if (sp) tg.sp = r2g(sp);
    if (kn) tg.kn = r2g(kn);
    tg.control = r2g(r.control ?? 50);
    tg.command = r2g(((r.control ?? 50) + (r.movement ?? 50)) / 2);
  }
  if (p.prospect && typeof p.potential === 'number') {
    tg.ceiling = r2g(p.potential);
    tg.floor = r2g(Math.max(20, (r.overall ?? 50) - 10));
  }
  return tg;
}

export function ensureAllToolGrades(state: GameState): GameState {
  const updated: Record<string, Player> = { ...state.players };
  for (const id of Object.keys(updated)) {
    const p = updated[id];
    if (!p.toolGrades) updated[id] = { ...p, toolGrades: deriveToolGrades(p) };
  }
  return { ...state, players: updated };
}

export function refreshToolGrades(p: Player): Player {
  return { ...p, toolGrades: deriveToolGrades(p) };
}

export function gradeStr(g?: number): string {
  if (typeof g !== 'number') return '—';
  return String(g);
}

export function gradeColor(g?: number): string {
  if (typeof g !== 'number') return '#888';
  if (g >= 70) return '#fbbf24';
  if (g >= 60) return '#34d399';
  if (g >= 50) return '#cbd5e1';
  if (g >= 40) return '#f59e0b';
  return '#ef4444';
}

export function topToolsForPlayer(p: Player, n = 3): { tool: string; grade: number }[] {
  if (!p.toolGrades) return [];
  const tg = p.toolGrades;
  const labels: Record<string, string> = {
    hit: 'Hit', power: 'Pow', run: 'Run', arm: 'Arm', field: 'Fld',
    fb: 'FB', sl: 'SL', cb: 'CB', ch: 'CH', ct: 'CT', sp: 'SP', kn: 'KN',
    control: 'Cmd', command: 'Ctrl',
    framing: 'Frm', blocking: 'Blk', throwing: 'Thr',
  };
  const out: { tool: string; grade: number }[] = [];
  for (const [k, v] of Object.entries(tg)) {
    if (typeof v === 'number' && labels[k]) out.push({ tool: labels[k], grade: v });
  }
  out.sort((a, b) => b.grade - a.grade);
  return out.slice(0, n);
}
