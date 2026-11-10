// mulberry32, bit-identical to the v5 prototype's rng(), but with its state
// held as a plain integer so run state stays JSON.

export function step(state: number): [value: number, state: number] {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** A mutable view over one integer RNG state stored on an object. */
export class Rng {
  constructor(public state: number) {}
  next(): number {
    const [v, s] = step(this.state);
    this.state = s;
    return v;
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  /** Fisher–Yates then take n: same call order as the prototype's pickN. */
  pick<T>(arr: readonly T[], n: number): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  }
}

export const SECOND_STREAM = 0x5bd1e995;
