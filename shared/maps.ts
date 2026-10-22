// Générateurs de cartes procédurales en grille.
// donjon : salles + couloirs ; caverne : automate cellulaire ; nature : bruit de valeur ; village : rues + maisons.
import { Rng } from "./random";
import { T, type GameMap, type MapKind, type Tile } from "./types";

export interface MapOptions {
  kind: MapKind;
  width: number;
  height: number;
  seed: number;
  name?: string;
}

const KIND_NAMES: Record<MapKind, string> = {
  donjon: "Donjon",
  caverne: "Cavernes",
  nature: "Contrée sauvage",
  village: "Village",
};

export function generateMap(opts: MapOptions): GameMap {
  const width = clamp(opts.width, 12, 80);
  const height = clamp(opts.height, 12, 80);
  const rng = new Rng(opts.seed);
  const base = { width, height, seed: opts.seed, kind: opts.kind, name: opts.name || `${KIND_NAMES[opts.kind]} n°${opts.seed % 1000}` };
  switch (opts.kind) {
    case "caverne":
      return { ...base, ...cave(width, height, rng) };
    case "nature":
      return { ...base, ...wilderness(width, height, rng) };
    case "village":
      return { ...base, ...village(width, height, rng) };
    default:
      return { ...base, ...dungeon(width, height, rng) };
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, Math.round(v)));
}

type Room = GameMap["rooms"][number];

function dungeon(w: number, h: number, rng: Rng) {
  const tiles: Tile[] = new Array(w * h).fill(T.vide);
  const rooms: Room[] = [];
  const attempts = Math.floor((w * h) / 18);
  for (let i = 0; i < attempts && rooms.length < Math.floor((w * h) / 90) + 3; i++) {
    const rw = rng.int(4, 9);
    const rh = rng.int(4, 8);
    const x = rng.int(1, w - rw - 2);
    const y = rng.int(1, h - rh - 2);
    if (rooms.some((r) => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    rooms.push({ x, y, w: rw, h: rh });
  }
  for (const r of rooms) for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) tiles[yy * w + xx] = T.sol;
  // Couloirs : chaque salle est reliée à la suivante (triées), plus quelques boucles.
  const sorted = [...rooms].sort((a, b) => a.x + a.y - (b.x + b.y));
  const center = (r: Room) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) });
  const links: [Room, Room][] = [];
  for (let i = 1; i < sorted.length; i++) links.push([sorted[i - 1], sorted[i]]);
  for (let i = 0; i < Math.floor(sorted.length / 4); i++) links.push([rng.pick(sorted), rng.pick(sorted)]);
  for (const [a, b] of links) {
    const ca = center(a);
    const cb = center(b);
    const horizontalFirst = rng.chance(0.5);
    carveLine(tiles, w, ca.x, ca.y, horizontalFirst ? cb.x : ca.x, horizontalFirst ? ca.y : cb.y);
    carveLine(tiles, w, horizontalFirst ? cb.x : ca.x, horizontalFirst ? ca.y : cb.y, cb.x, cb.y);
  }
  // Murs autour de tout ce qui est creusé.
  wallAround(tiles, w, h);
  // Portes : là où un couloir entre dans une salle.
  for (const r of rooms) {
    for (let xx = r.x; xx < r.x + r.w; xx++) {
      doorIfCorridor(tiles, w, h, xx, r.y - 1);
      doorIfCorridor(tiles, w, h, xx, r.y + r.h);
    }
    for (let yy = r.y; yy < r.y + r.h; yy++) {
      doorIfCorridor(tiles, w, h, r.x - 1, yy);
      doorIfCorridor(tiles, w, h, r.x + r.w, yy);
    }
  }
  // Un bassin dans une salle au hasard.
  if (rooms.length > 3) {
    const r = rng.pick(rooms);
    for (let yy = r.y + 1; yy < r.y + r.h - 1; yy++) for (let xx = r.x + 1; xx < r.x + r.w - 1; xx++) if (rng.chance(0.55)) tiles[yy * w + xx] = T.eau;
  }
  const labels = ["Entrée", "Salle des gardes", "Crypte", "Armurerie", "Salle du trône", "Bibliothèque", "Cellules", "Autel", "Trésor", "Cuisine"];
  rooms.forEach((r, i) => (r.label = i === 0 ? "Entrée" : labels[1 + ((i - 1) % (labels.length - 1))]));
  return { tiles, rooms };
}

function carveLine(tiles: Tile[], w: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.sign(x1 - x0);
  const dy = Math.sign(y1 - y0);
  let x = x0;
  let y = y0;
  tiles[y * w + x] = tiles[y * w + x] === T.vide ? T.route : tiles[y * w + x];
  while (x !== x1 || y !== y1) {
    if (x !== x1) x += dx;
    else y += dy;
    if (tiles[y * w + x] === T.vide) tiles[y * w + x] = T.route;
  }
}

function wallAround(tiles: Tile[], w: number, h: number) {
  const copy = [...tiles];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (copy[y * w + x] !== T.vide) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const t = copy[ny * w + nx];
          if (t === T.sol || t === T.route || t === T.eau) tiles[y * w + x] = T.mur;
        }
    }
}

function doorIfCorridor(tiles: Tile[], w: number, h: number, x: number, y: number) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  if (tiles[y * w + x] === T.route) tiles[y * w + x] = T.porte;
}

function cave(w: number, h: number, rng: Rng) {
  let grid: boolean[] = Array.from({ length: w * h }, (_, i) => {
    const x = i % w;
    const y = Math.floor(i / w);
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return true;
    return rng.chance(0.45);
  });
  for (let step = 0; step < 5; step++) {
    grid = grid.map((wall, i) => {
      const x = i % w;
      const y = Math.floor(i / w);
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return true;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && grid[(y + dy) * w + x + dx]) n++;
      return n >= 5 || (n === 0 && step < 2) ? true : n <= 3 ? false : wall;
    });
  }
  // On garde seulement la plus grande zone connectée, pour que tout soit atteignable.
  const open = grid.map((wall) => !wall);
  const keep = largestRegion(open, w, h);
  const tiles: Tile[] = grid.map((_, i) => (keep.has(i) ? T.sol : T.vide));
  // Lacs souterrains
  const lakes = rng.int(1, 3);
  for (let l = 0; l < lakes; l++) {
    const cells = [...keep];
    const start = cells[rng.int(0, cells.length - 1)];
    floodSome(tiles, w, h, start, rng.int(6, 20), T.eau, rng);
  }
  wallAround(tiles, w, h);
  return { tiles, rooms: [] as Room[] };
}

function largestRegion(open: boolean[], w: number, h: number): Set<number> {
  const seen = new Uint8Array(open.length);
  let best = new Set<number>();
  for (let i = 0; i < open.length; i++) {
    if (!open[i] || seen[i]) continue;
    const region = new Set<number>();
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      region.add(c);
      const x = c % w;
      const y = Math.floor(c / w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (open[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    if (region.size > best.size) best = region;
  }
  return best;
}

function floodSome(tiles: Tile[], w: number, h: number, start: number, size: number, tile: Tile, rng: Rng) {
  const frontier = [start];
  let placed = 0;
  while (frontier.length && placed < size) {
    const c = frontier.splice(rng.int(0, frontier.length - 1), 1)[0];
    if (tiles[c] !== T.sol) continue;
    tiles[c] = tile;
    placed++;
    const x = c % w;
    const y = Math.floor(c / w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h) frontier.push(ny * w + nx);
    }
  }
}

/** Bruit de valeur lissé, entre 0 et 1. */
function noiseField(w: number, h: number, scale: number, rng: Rng): number[] {
  const gw = Math.ceil(w / scale) + 2;
  const gh = Math.ceil(h / scale) + 2;
  const grid = Array.from({ length: gw * gh }, () => rng.next());
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const out: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = x / scale;
      const gy = y / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = smooth(gx - x0);
      const ty = smooth(gy - y0);
      const a = grid[y0 * gw + x0];
      const b = grid[y0 * gw + x0 + 1];
      const c = grid[(y0 + 1) * gw + x0];
      const d = grid[(y0 + 1) * gw + x0 + 1];
      out.push(a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
    }
  return out;
}

function wilderness(w: number, h: number, rng: Rng) {
  const n1 = noiseField(w, h, 8, rng);
  const n2 = noiseField(w, h, 3, rng);
  const tiles: Tile[] = n1.map((v, i) => {
    const e = v * 0.75 + n2[i] * 0.25;
    if (e < 0.28) return T.eau;
    if (e > 0.78) return T.mur; // rochers / falaises
    if (e > 0.56) return T.vegetation; // forêt
    return T.sol; // prairie
  });
  // Un chemin qui traverse la carte de gauche à droite.
  let y = rng.int(Math.floor(h / 4), Math.floor((3 * h) / 4));
  for (let x = 0; x < w; x++) {
    tiles[y * w + x] = T.route;
    if (rng.chance(0.3)) y = clamp(y + rng.pick([-1, 1]), 1, h - 2);
    tiles[y * w + x] = T.route;
  }
  const rooms: Room[] = [];
  for (let i = 0; i < 3; i++) {
    const x = rng.int(2, w - 6);
    const yy = rng.int(2, h - 6);
    rooms.push({ x, y: yy, w: 3, h: 3, label: rng.pick(["Campement", "Ruine", "Grotte", "Clairière", "Tour de guet", "Pont"]) });
  }
  return { tiles, rooms };
}

function village(w: number, h: number, rng: Rng) {
  const tiles: Tile[] = noiseField(w, h, 6, rng).map((v) => (v > 0.7 ? T.vegetation : T.sol));
  const midY = Math.floor(h / 2);
  const midX = Math.floor(w / 2);
  for (let x = 0; x < w; x++) for (const yy of [midY, midY + 1]) tiles[yy * w + x] = T.route;
  for (let yy = 0; yy < h; yy++) for (const xx of [midX, midX + 1]) tiles[yy * w + xx] = T.route;
  // Place centrale
  for (let yy = midY - 2; yy <= midY + 3; yy++) for (let xx = midX - 2; xx <= midX + 3; xx++) tiles[yy * w + xx] = T.route;
  tiles[midY * w + midX] = T.eau; // fontaine
  const rooms: Room[] = [];
  const labels = ["Auberge", "Forge", "Temple", "Marché", "Maison du chef", "Écurie", "Échoppe", "Moulin", "Herboriste", "Caserne"];
  for (let i = 0; i < 80 && rooms.length < Math.floor((w * h) / 70); i++) {
    const bw = rng.int(4, 7);
    const bh = rng.int(3, 6);
    const x = rng.int(1, w - bw - 1);
    const y = rng.int(1, h - bh - 1);
    const overlaps = rooms.some((r) => x < r.x + r.w + 1 && x + bw + 1 > r.x && y < r.y + r.h + 1 && y + bh + 1 > r.y);
    let onRoad = false;
    for (let yy = y - 1; yy <= y + bh && !onRoad; yy++) for (let xx = x - 1; xx <= x + bw; xx++) if (tiles[yy * w + xx] === T.route) onRoad = true;
    if (overlaps || onRoad) continue;
    rooms.push({ x, y, w: bw, h: bh, label: labels[rooms.length % labels.length] });
  }
  for (const r of rooms) {
    for (let yy = r.y; yy < r.y + r.h; yy++)
      for (let xx = r.x; xx < r.x + r.w; xx++) {
        const edge = yy === r.y || xx === r.x || yy === r.y + r.h - 1 || xx === r.x + r.w - 1;
        tiles[yy * w + xx] = edge ? T.mur : T.sol;
      }
    // Porte du côté de la route la plus proche
    const doorX = r.x + Math.floor(r.w / 2);
    const doorY = r.y + r.h / 2 < midY ? r.y + r.h - 1 : r.y;
    tiles[doorY * w + doorX] = T.porte;
  }
  return { tiles, rooms };
}

/** Une case est-elle praticable pour un pion ? */
export function walkable(t: Tile): boolean {
  return t === T.sol || t === T.route || t === T.porte || t === T.vegetation || t === T.eau;
}
