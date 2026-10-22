// Outils communs au rendu des cartes.
export const BASE = 48; // pixels par case dans l'image pré-rendue

export function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

export function shade(hex: string, amount: number, alpha = 1) {
  const [r, g, b] = rgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgba(${c(r)},${c(g)},${c(b)},${alpha})`;
}

