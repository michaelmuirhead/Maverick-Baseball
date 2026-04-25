import type { Player, GameState, HitterRatings, PitcherRatings } from './types';
import { RNG } from './rng';

export function isTwoWay(p: Player): boolean {
  return !!p.twoWay?.isTwoWay;
}

export function detectTwoWayCandidate(p: Player): boolean {
  const r: any = p.ratings;
  const hitterScore = ((r.contact || 0) + (r.power || 0)) / 2;
  const pitcherScore = ((r.fastball || 0) + (r.control || 0)) / 2;
  return hitterScore >= 60 && pitcherScore >= 60;
}

export function makeTwoWay(p: Player): Player {
  if (!p.ratings) return p;
  const r: any = p.ratings;
  const hitterRatings: HitterRatings = {
    contact: r.contact || 50,
    power: r.power || 50,
    eye: r.eye || 50,
    speed: r.speed || 50,
    fielding: r.fielding || 50,
    armStr: r.armStr || 50,
    overall: ((r.contact || 50) + (r.power || 50)) / 2,
  } as any;
  const pitcherRatings: PitcherRatings = {
    fastball: r.fastball || 50,
    control: r.control || 50,
    movement: r.movement || 50,
    stamina: r.stamina || 50,
    overall: ((r.fastball || 50) + (r.control || 50)) / 2,
  } as any;
  if (r.slider) (pitcherRatings as any).slider = r.slider;
  if (r.curve) (pitcherRatings as any).curve = r.curve;
  if (r.changeup) (pitcherRatings as any).changeup = r.changeup;
  if (r.cutter) (pitcherRatings as any).cutter = r.cutter;
  if (r.splitter) (pitcherRatings as any).splitter = r.splitter;
  return {
    ...p,
    twoWay: {
      isTwoWay: true,
      hitterRatings,
      pitcherRatings,
      pitchingRole: 'SP',
      hittingDays: 0,
      pitchingDays: 0,
    },
  };
}

export function decideTwoWayUsage(p: Player, day: number): 'hit' | 'pitch' | 'rest' {
  if (!isTwoWay(p)) return 'hit';
  const tw = p.twoWay!;
  const lastPitchedAgo = (tw.pitchingDays && tw.pitchingDays > 0) ? day - tw.pitchingDays : 99;
  if (lastPitchedAgo < 1) return 'rest';
  if (lastPitchedAgo >= 5) return 'pitch';
  return 'hit';
}

export function applyTwoWayContext(p: Player, mode: 'hit' | 'pitch'): Player {
  if (!isTwoWay(p)) return p;
  const tw = p.twoWay!;
  if (mode === 'pitch' && tw.pitcherRatings) {
    return { ...p, ratings: { ...p.ratings, ...tw.pitcherRatings } as any, isPitcher: true };
  }
  if (mode === 'hit' && tw.hitterRatings) {
    return { ...p, ratings: { ...p.ratings, ...tw.hitterRatings } as any, isPitcher: false };
  }
  return p;
}

export function flagTwoWayProspects(state: GameState, _rng: RNG, _maxPerLeague = 1): GameState {
  const arr = Object.values(state.players);
  const candidates = arr.filter(p => p.prospect && detectTwoWayCandidate(p));
  if (candidates.length === 0) return state;
  candidates.sort((a, b) => (b.ratings.overall || 0) - (a.ratings.overall || 0));
  const chosen = candidates.slice(0, Math.min(2, candidates.length));
  const players: Record<string, Player> = { ...state.players };
  for (const p of chosen) {
    players[p.id] = makeTwoWay(p);
  }
  return { ...state, players };
}
