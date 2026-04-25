// Mulberry32 PRNG — deterministic, seedable, fast.
// Ported from DiamondDesk.jsx unchanged so replaying a seed yields identical worlds.
export class RNG {
    constructor(seed) {
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.state = seed >>> 0;
    }
    next() {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    float(min, max) {
        return this.next() * (max - min) + min;
    }
    normal(mean, sd) {
        const u1 = Math.max(this.next(), 1e-12);
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + Math.max(-3, Math.min(3, z)) * sd;
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    weightedPick(items) {
        const total = items.reduce((s, x) => s + Math.max(0, x.weight), 0);
        let r = this.next() * total;
        for (const { item, weight } of items) {
            r -= Math.max(0, weight);
            if (r <= 0)
                return item;
        }
        return items[items.length - 1].item;
    }
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    chance(p) {
        return this.next() < p;
    }
}
