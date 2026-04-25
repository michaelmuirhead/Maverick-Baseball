// Mulberry32 PRNG — deterministic, seedable, fast.
// Ported from DiamondDesk.jsx unchanged so replaying a seed yields identical worlds.

export class RNG {
  state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  normal(mean: number, sd: number): number {
    const u1 = Math.max(this.next(), 1e-12);
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + Math.max(-3, Math.min(3, z)) * sd;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  weightedPick<T>(items: { item: T; weight: number }[]): T {
    const total = items.reduce((s, x) => s + Math.max(0, x.weight), 0);
    let r = this.next() * total;
    for (const { item, weight } of items) {
      r -= Math.max(0, weight);
      if (r <= 0) return item;
    }
    return items[items.length - 1].item;
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }
}
