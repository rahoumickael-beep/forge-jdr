// Générateur pseudo-aléatoire à graine : la même graine donne toujours le même résultat.
export class Rng {
  private s: number;
  constructor(seed: number = Date.now()) {
    this.s = seed >>> 0 || 1;
  }
  /** Nombre entre 0 (inclus) et 1 (exclu). Algorithme mulberry32. */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }
  pickMany<T>(list: readonly T[], n: number): T[] {
    const copy = [...list];
    const out: T[] = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(this.next() * copy.length), 1)[0]);
    return out;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}
