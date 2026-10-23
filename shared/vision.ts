// Ligne de vue sur la grille : les murs et la roche bloquent la vue.
// Lancer de rayons vers chaque case du bord du cercle de vision (assez rapide pour des cartes de 80×80).
import { T, type GameMap, type Token } from "./types";

export const DEFAULT_VISION = 10; // en cases (15 m)

function blocks(map: GameMap, x: number, y: number) {
  const t = map.tiles[y * map.width + x];
  return t === T.mur || t === T.vide;
}

/** Cases vues depuis un point, mur qui bloque compris (on voit le mur, pas derrière). */
export function visibleFrom(map: GameMap, ox: number, oy: number, range: number, out: Set<number>) {
  if (ox < 0 || oy < 0 || ox >= map.width || oy >= map.height) return;
  out.add(oy * map.width + ox);
  const r2 = range * range;
  const targets: [number, number][] = [];
  for (let dy = -range; dy <= range; dy++)
    for (let dx = -range; dx <= range; dx++) {
      const edge = Math.abs(dx) === range || Math.abs(dy) === range;
      if (edge) targets.push([ox + dx, oy + dy]);
    }
  for (const [tx, ty] of targets) {
    // Rayon du centre de la case d'origine vers la cible, pas d'un quart de case.
    const steps = Math.max(Math.abs(tx - ox), Math.abs(ty - oy)) * 4;
    let lastCell = -1;
    for (let i = 1; i <= steps; i++) {
      const fx = ox + 0.5 + ((tx - ox) * i) / steps;
      const fy = oy + 0.5 + ((ty - oy) * i) / steps;
      const cx = Math.floor(fx);
      const cy = Math.floor(fy);
      if (cx < 0 || cy < 0 || cx >= map.width || cy >= map.height) break;
      if ((cx - ox) ** 2 + (cy - oy) ** 2 > r2) break;
      const idx = cy * map.width + cx;
      if (idx === lastCell) continue;
      lastCell = idx;
      out.add(idx);
      if (blocks(map, cx, cy)) break;
    }
  }
}

/** Union de ce que voient plusieurs pions. */
export function visibleCells(map: GameMap, tokens: Token[]): Set<number> {
  const out = new Set<number>();
  for (const t of tokens) visibleFrom(map, Math.round(t.x), Math.round(t.y), Math.max(1, Math.min(40, t.vision ?? DEFAULT_VISION)), out);
  return out;
}
