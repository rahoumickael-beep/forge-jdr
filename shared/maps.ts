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
  // Portes : là où un couloir entre dans une salle, une seule par ouverture.
  for (const r of rooms) {
    doorIfCorridor(tiles, w, h, r.x, r.y - 1, 1, 0, 0, -1, r.w);
    doorIfCorridor(tiles, w, h, r.x + r.w, r.y, 0, 1, 1, 0, r.h);
    doorIfCorridor(tiles, w, h, r.x, r.y + r.h, 1, 0, 0, 1, r.w);
    doorIfCorridor(tiles, w, h, r.x - 1, r.y, 0, 1, -1, 0, r.h);
  }
  // Un bassin dans une salle au hasard.
  if (rooms.length > 3) {
    const r = rng.pick(rooms);
    for (let yy = r.y + 1; yy < r.y + r.h - 1; yy++) for (let xx = r.x + 1; xx < r.x + r.w - 1; xx++) if (rng.chance(0.55)) tiles[yy * w + xx] = T.eau;
    // Pas de poche d'eau d'une case : une case d'eau qui n'en touche pas au moins deux autres redevient du sol.
    for (let changed = true; changed; ) {
      changed = false;
      for (let yy = r.y + 1; yy < r.y + r.h - 1; yy++)
        for (let xx = r.x + 1; xx < r.x + r.w - 1; xx++) {
          if (tiles[yy * w + xx] !== T.eau) continue;
          const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => tiles[(yy + dy) * w + xx + dx] === T.eau).length;
          if (n < 2) {
            tiles[yy * w + xx] = T.sol;
            changed = true;
          }
        }
    }
  }
  const labels = ["Entrée", "Salle des gardes", "Crypte", "Armurerie", "Salle du trône", "Bibliothèque", "Cellules", "Autel", "Trésor", "Cuisine"];
  rooms.forEach((r, i) => (r.label = i === 0 ? "Entrée" : labels[1 + ((i - 1) % (labels.length - 1))]));
  // La salle du trône a besoin de place (estrade de 3 × 2 cases et allée) : on l'échange avec une salle d'au moins 5 × 5.
  const big = (r: Room) => r.w >= 5 && r.h >= 5;
  const throne = rooms.find((r) => r.label === "Salle du trône");
  if (throne && !big(throne)) {
    const other = rooms.find((r, i) => i > 0 && big(r) && r.label !== "Salle du trône");
    if (other) [throne.label, other.label] = [other.label, throne.label];
  }
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

/**
 * Portes d'un côté de salle : la ligne de `len` cases qui part de (x0, y0) dans la direction (ax, ay),
 * juste hors de la salle ; (ox, oy) pointe vers l'extérieur.
 * Un couloir qui longe la salle ouvre une suite de cases sur ce côté : on n'y garde que les cases
 * qui mènent ailleurs (couloir qui part vers l'extérieur, ou qui continue au-delà du coin), les autres
 * redeviennent du mur. Une ouverture d'une case reçoit une porte (sauf si une autre porte est à deux cases ou moins) ;
 * une ouverture plus large reste une arche.
 */
function doorIfCorridor(tiles: Tile[], w: number, h: number, x0: number, y0: number, ax: number, ay: number, ox: number, oy: number, len: number) {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? T.vide : tiles[y * w + x]);
  const open = (t: Tile) => t !== T.vide && t !== T.mur;
  const cell = (i: number) => [x0 + ax * i, y0 + ay * i] as const;
  let i = 0;
  while (i < len) {
    if (at(...cell(i)) !== T.route) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < len && at(...cell(j + 1)) === T.route) j++;
    // Cases du passage [i, j] qui mènent ailleurs que dans la salle.
    const needed: boolean[] = [];
    for (let k = i; k <= j; k++) {
      const [x, y] = cell(k);
      needed.push(open(at(x + ox, y + oy)) || (k === i && open(at(...cell(i - 1)))) || (k === j && open(at(...cell(j + 1)))));
    }
    if (!needed.some(Boolean)) needed[0] = true;
    for (let k = i; k <= j; k++) {
      const [x, y] = cell(k);
      if (!needed[k - i]) {
        tiles[y * w + x] = T.mur;
        continue;
      }
      // Pas de porte à deux cases ou moins d'une autre (entre deux salles proches, ou deux départs de couloir
      // voisins sur le même mur) : la seconde ouverture reste une arche.
      let crowded = false;
      for (let dy = -2; dy <= 2 && !crowded; dy++) for (let dx = -2 + Math.abs(dy); dx <= 2 - Math.abs(dy); dx++) if (at(x + dx, y + dy) === T.porte) crowded = true;
      if (!needed[k - i - 1] && !needed[k - i + 1] && !crowded) tiles[y * w + x] = T.porte;
    }
    i = j + 1;
  }
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

/**
 * Lieux d'un village, chacun une seule fois. Le temple et l'auberge sont les repères, posés en premier
 * au bord de la place ; les autres sont tirés dans cette liste sans remise.
 */
const VILLAGE_PLACES = ["Forge", "Maison du chef", "Écurie", "Échoppe", "Moulin", "Herboriste", "Caserne", "Marché", "Boulangerie", "Tonnellerie", "Grange", "Tannerie"];

type Cell = [number, number];

/**
 * Village : une grand-rue qui serpente d'un bord à l'autre, une place irrégulière avec son puits, une rue coudée
 * qui en part, une autre plus loin, des ruelles d'une case. Les maisons s'alignent de face sur la rue (porte
 * tournée vers elle), en retrait variable. Les lieux nommés (rooms) sont ouverts : murs, sol, porte. Les simples
 * logis sont des blocs pleins (murs), dessinés avec leur toit ; certains ont une aile ou un appentis (plan en L).
 * Toute emprise bâtie garde une case libre autour d'elle : le praticable reste d'un seul tenant.
 */
function village(w0: number, h0: number, rng: Rng) {
  // On trace toujours en largeur (grand-rue d'ouest en est), puis on retourne la carte si elle est en hauteur.
  const flip = h0 > w0;
  const w = flip ? h0 : w0;
  const h = flip ? w0 : h0;
  const tiles: Tile[] = noiseField(w, h, 6, rng).map((v) => (v > 0.7 ? T.vegetation : T.sol));
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const isRoad = (x: number, y: number) => inside(x, y) && (tiles[y * w + x] === T.route || tiles[y * w + x] === T.eau);

  // Chemin de cases 4-connexe le long d'une courbe de Catmull-Rom passant par les points de contrôle.
  const trace = (ctrl: Cell[]): Cell[] => {
    const out: Cell[] = [];
    const push = (x: number, y: number) => {
      const l = out[out.length - 1];
      if (l && l[0] === x && l[1] === y) return;
      if (l && l[0] !== x && l[1] !== y) out.push([x, l[1]]);
      out.push([x, y]);
    };
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)];
      const p1 = ctrl[i];
      const p2 = ctrl[i + 1];
      const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      const n = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 4) + 1;
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const t2 = t * t;
        const t3 = t2 * t;
        const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        push(Math.floor(cr(p0[0], p1[0], p2[0], p3[0]) + 0.5), Math.floor(cr(p0[1], p1[1], p2[1], p3[1]) + 0.5));
      }
    }
    const last = ctrl[ctrl.length - 1];
    push(Math.floor(last[0] + 0.5), Math.floor(last[1] + 0.5));
    return out;
  };
  // Une rue : le chemin, doublé d'une case de l'autre côté de sa direction (deux cases de large) ; une ruelle : une case.
  const chains: Cell[][] = [];
  const pave = (ctrl: Cell[], wide: boolean) => {
    const chain = trace(ctrl);
    chain.forEach(([x, y], i) => {
      if (inside(x, y) && tiles[y * w + x] !== T.eau) tiles[y * w + x] = T.route;
      if (!wide) return;
      const a = chain[Math.max(0, i - 2)];
      const b = chain[Math.min(chain.length - 1, i + 2)];
      const [nx, ny] = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? [x, y + 1] : [x + 1, y];
      if (inside(nx, ny) && tiles[ny * w + nx] !== T.eau) tiles[ny * w + nx] = T.route;
    });
    const kept = chain.filter(([x, y]) => inside(x, y));
    chains.push(kept);
    return kept;
  };

  // 1. Grand-rue : d'un bord à l'autre, elle ondule ; elle entre sur la place d'un côté du puits et en repart
  // de l'autre, décalée de deux rangs (jamais une croix de routes droites qui traverse la place dans l'axe).
  const midY = Math.floor(h / 2);
  const dev = Math.max(1, Math.round(h * 0.16));
  const pcx = clamp(Math.round(w * (0.4 + rng.next() * 0.2)), 4, w - 5);
  const pcy = clamp(midY + Math.round(rng.int(-dev, dev) / 2), 3, h - 4);
  const jog = rng.chance(0.5) ? 1 : -1;
  const yAt = (base: number, lo: number, hi: number) => clamp(base + jog * rng.int(lo, hi), 3, h - 5);
  const west = pave([[-2, yAt(pcy, -dev, 0)], [w * 0.2, yAt(pcy, -dev, -1)], [pcx - 2, pcy - jog], [pcx - 1, pcy - jog]], true);
  const east = pave([[pcx + 1, pcy + jog], [pcx + 2, pcy + jog], [w * 0.8, yAt(pcy, 1, dev)], [w + 1, yAt(pcy, 0, dev)]], true);
  const main = [...west, ...east];

  // 2. Place : quelques ovales qui se chevauchent autour du puits, qui débordent du côté où il y a le plus d'espace.
  const pc: Cell = [pcx, pcy];
  const toward = pc[1] < h / 2 ? 1 : -1;
  const ks = Math.min(1, h / 30);
  for (let b = 0; b < 3; b++) {
    const cx = pc[0] + rng.int(-2, 2) * ks;
    const cy = pc[1] + (b === 0 ? 0 : toward * rng.int(0, 2)) * ks;
    const rx = (2.6 + rng.next() * 1.6) * Math.max(0.7, ks);
    const ry = (1.9 + rng.next() * 1.1) * Math.max(0.7, ks);
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (inside(x, y) && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) tiles[y * w + x] = T.route;
  }
  for (let y = pc[1] - 1; y <= pc[1] + 1; y++) for (let x = pc[0] - 1; x <= pc[0] + 1; x++) tiles[y * w + x] = T.route;
  tiles[pc[1] * w + pc[0]] = T.eau; // puits

  // 3. Rue coudée qui part de la place vers le bord le plus éloigné.
  const dir = toward;
  const edgeY = dir > 0 ? h + 1 : -2;
  const xa = clamp(pc[0] + rng.int(-2, 2), 3, w - 4);
  const ya = clamp(pc[1] + dir * rng.int(4, 6), 2, h - 3);
  const xb = clamp(xa + rng.pick([-1, 1]) * rng.int(4, 8), 3, w - 4);
  const yb = clamp(ya + dir * rng.int(2, 4), 1, h - 2);
  const branchA = pave([pc, [xa, ya], [xb, yb], [clamp(xb + rng.int(-2, 2), 3, w - 4), edgeY]], true);

  // 4. Une autre rue de l'autre côté de la grand-rue, loin de la place.
  const left = rng.chance(0.5);
  const sx = Math.round(w * (left ? 0.12 + rng.next() * 0.16 : 0.72 + rng.next() * 0.16));
  const s0 = main.find(([x]) => x === sx) ?? [sx, midY];
  const otherEdge = dir > 0 ? -2 : h + 1;
  // elle part droit de la grand-rue puis se coude franchement (3 à 6 cases de côté) avant de filer vers le bord
  const elbow = (left ? 1 : -1) * rng.int(3, 6);
  const e1: Cell = [clamp(sx + rng.int(-1, 1), 3, w - 4), clamp(s0[1] - dir * rng.int(3, 4), 1, h - 2)];
  const e2: Cell = [clamp(e1[0] + elbow, 3, w - 4), clamp(e1[1] - dir * rng.int(2, 3), 1, h - 2)];
  pave([s0, e1, e2, [clamp(e2[0] + rng.int(-1, 1), 3, w - 4), otherEdge]], true);

  // 5. Ruelles d'une case : une qui relie la grand-rue à la rue coudée (un pâté de maisons), une qui file vers les champs.
  const farA = branchA.filter(([x, y]) => Math.abs(y - pc[1]) >= 4 && inside(x, y));
  if (farA.length) {
    const [ex, ey] = rng.pick(farA);
    const fromX = clamp(ex + (ex < pc[0] ? -1 : 1) * rng.int(5, 9), 2, w - 3);
    const m0 = main.find(([x]) => x === fromX);
    if (m0) pave([m0, [fromX + rng.int(-1, 1), clamp(m0[1] + dir * 3, 1, h - 2)], [ex, ey]], false);
  }
  {
    const lx = Math.round(w * (left ? 0.62 + rng.next() * 0.12 : 0.26 + rng.next() * 0.12));
    const m0 = main.find(([x]) => x === lx);
    if (m0) pave([m0, [lx + rng.int(-3, 3), clamp(m0[1] - dir * 4, 1, h - 2)], [lx + rng.int(-4, 4), otherEdge]], false);
  }

  // 5 bis. Chemins de ferme : un quart de carte sans rue resterait vide (personne ne bâtit loin d'un chemin).
  // On y fait passer un chemin d'une case, de la rue la plus proche jusqu'au bord, qui serpente par le milieu du quart.
  if (w >= 24 && h >= 20)
    for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x0 = Math.floor((qx * w) / 2);
      const y0 = Math.floor((qy * h) / 2);
      const x1 = Math.floor(((qx + 1) * w) / 2);
      const y1 = Math.floor(((qy + 1) * h) / 2);
      let roads = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (isRoad(x, y)) roads++;
      if (roads >= ((x1 - x0) * (y1 - y0)) / 22) continue;
      const qc: Cell = [Math.round((x0 + x1) / 2 + rng.int(-2, 2)), Math.round((y0 + y1) / 2 + rng.int(-2, 2))];
      let start: Cell | null = null;
      let best = Infinity;
      for (const chain of chains)
        for (const c of chain) {
          const d = Math.hypot(c[0] - qc[0], c[1] - qc[1]);
          if (d < best && Math.hypot(c[0] - pc[0], c[1] - pc[1]) > 5) [start, best] = [c, d];
        }
      if (!start) continue;
      // sortie par le bord le plus proche du milieu du quart (côté extérieur de la carte)
      const toX = qx ? w - 1 - qc[0] : qc[0];
      const toY = qy ? h - 1 - qc[1] : qc[1];
      const exit: Cell = toX < toY ? [qx ? w + 1 : -2, clamp(qc[1] + rng.int(-3, 3), 2, h - 3)] : [clamp(qc[0] + rng.int(-3, 3), 2, w - 3), qy ? h + 1 : -2];
      pave([start, qc, exit], false);
    }

  // Aucune rue ne finit en cul-de-sac au milieu des maisons : on rogne les bouts de rue qui n'ont qu'un voisin
  // (marches d'escalier des diagonales, ruelle qui s'arrête court) ; seules les rues qui sortent de la carte gardent un bout.
  for (let changed = true; changed; ) {
    changed = false;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        if (tiles[y * w + x] !== T.route) continue;
        const n = (isRoad(x + 1, y) ? 1 : 0) + (isRoad(x - 1, y) ? 1 : 0) + (isRoad(x, y + 1) ? 1 : 0) + (isRoad(x, y - 1) ? 1 : 0);
        if (n >= 2) continue;
        tiles[y * w + x] = T.sol;
        changed = true;
      }
  }
  for (const chain of chains) for (let i = chain.length - 1; i >= 0; i--) if (!isRoad(chain[i][0], chain[i][1])) chain.splice(i, 1);

  // 6. Façades possibles : la première case hors de la rue, de part et d'autre de chaque tronçon.
  interface Front {
    x: number;
    y: number;
    nx: number;
    ny: number;
  }
  const fronts: Front[] = [];
  const seen = new Set<string>();
  for (const chain of chains)
    chain.forEach(([x, y], i) => {
      const a = chain[Math.max(0, i - 2)];
      const b = chain[Math.min(chain.length - 1, i + 2)];
      const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
      for (const s of [-1, 1]) {
        const [nx, ny] = horiz ? [0, s] : [s, 0];
        let ex = x;
        let ey = y;
        for (let k = 0; k < 6 && isRoad(ex, ey); k++) [ex, ey] = [ex + nx, ey + ny];
        if (!inside(ex, ey) || isRoad(ex, ey)) continue;
        const key = `${ex},${ey},${nx},${ny}`;
        if (seen.has(key)) continue;
        seen.add(key);
        fronts.push({ x: ex, y: ey, nx, ny });
      }
    });
  // tour de la place
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (Math.hypot(x - pc[0], y - pc[1]) > 7 || !isRoad(x, y)) continue;
      for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Cell[]) {
        const ex = x + nx;
        const ey = y + ny;
        if (!inside(ex, ey) || isRoad(ex, ey)) continue;
        const key = `${ex},${ey},${nx},${ny}`;
        if (!seen.has(key)) {
          seen.add(key);
          fronts.push({ x: ex, y: ey, nx, ny });
        }
      }
    }

  // 7. Bâtiments. `built` : cases bâties (emprises, ailes comprises).
  const built = new Uint8Array(w * h);
  interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }
  const fits = (rs: Rect[]) => {
    for (const r of rs) {
      if (r.x0 < 1 || r.y0 < 1 || r.x1 > w - 2 || r.y1 > h - 2) return false;
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (isRoad(x, y)) return false;
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) if (inside(x, y) && built[y * w + x]) return false;
    }
    return true;
  };
  /** Rectangle d'un bâtiment de `L` cases de façade et `D` de profondeur, posé derrière la façade `f` avec `s` cases de retrait. */
  const body = (f: Front, L: number, D: number, s: number, shift: number): Rect => {
    if (f.ny !== 0) {
      const x0 = f.x - Math.floor(L / 2) + shift;
      const yf = f.y + f.ny * s;
      return f.ny < 0 ? { x0, y0: yf - D + 1, x1: x0 + L - 1, y1: yf } : { x0, y0: yf, x1: x0 + L - 1, y1: yf + D - 1 };
    }
    const y0 = f.y - Math.floor(L / 2) + shift;
    const xf = f.x + f.nx * s;
    return f.nx < 0 ? { x0: xf - D + 1, y0, x1: xf, y1: y0 + L - 1 } : { x0: xf, y0, x1: xf + D - 1, y1: y0 + L - 1 };
  };
  /** Aile accolée au côté `side` (repère : la façade est devant), alignée sur l'arrière ou sur l'avant. */
  const wing = (b: Rect, f: Front, side: "gauche" | "droite" | "fond", len: number, depth: number, back: boolean): Rect => {
    // vecteurs : n vers la rue, t le long de la façade
    const [nx, ny] = [f.nx, f.ny]; // vers l'arrière
    const horizFront = ny !== 0;
    const xs = [b.x0, b.x1];
    const yy = [b.y0, b.y1];
    if (side === "fond") {
      // derrière, centrée ou décalée
      if (ny !== 0) {
        const yb = ny > 0 ? b.y1 + 1 : b.y0 - depth;
        const x0 = back ? b.x0 : b.x1 - len + 1;
        return { x0, y0: yb, x1: x0 + len - 1, y1: yb + depth - 1 };
      }
      const xb = nx > 0 ? b.x1 + 1 : b.x0 - depth;
      const y0 = back ? b.y0 : b.y1 - len + 1;
      return { x0: xb, y0, x1: xb + depth - 1, y1: y0 + len - 1 };
    }
    const right = side === "droite";
    if (horizFront) {
      // façade horizontale : aile à gauche (x0 - depth) ou à droite (x1 + 1), alignée sur l'arrière ou l'avant
      const x0 = right ? xs[1] + 1 : xs[0] - depth;
      const alignBack = back ? (ny > 0 ? yy[1] - len + 1 : yy[0]) : ny > 0 ? yy[0] : yy[1] - len + 1;
      return { x0, y0: alignBack, x1: x0 + depth - 1, y1: alignBack + len - 1 };
    }
    const y0 = right ? yy[1] + 1 : yy[0] - depth;
    const alignBack = back ? (nx > 0 ? xs[1] - len + 1 : xs[0]) : nx > 0 ? xs[0] : xs[1] - len + 1;
    return { x0: alignBack, y0, x1: alignBack + len - 1, y1: y0 + depth - 1 };
  };

  const rooms: Room[] = [];
  const closed: Rect[] = [];
  const dist = (f: Front) => Math.hypot(f.x - pc[0], f.y - pc[1]);
  function shuffled<X>(list: X[]): X[] {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const near = [...fronts].sort((a, b) => dist(a) - dist(b));

  /** Porte : sur la façade, là où la rue est la plus proche devant. */
  const doorOf = (b: Rect, f: Front): Cell | null => {
    const cells: Cell[] = [];
    if (f.ny !== 0) for (let x = b.x0 + 1; x < b.x1; x++) cells.push([x, f.ny < 0 ? b.y1 : b.y0]);
    else for (let y = b.y0 + 1; y < b.y1; y++) cells.push([f.nx < 0 ? b.x1 : b.x0, y]);
    let best: Cell | null = null;
    let bestD = 99;
    for (const [x, y] of cells) {
      let d = 1;
      while (d < 5 && !isRoad(x - f.nx * d, y - f.ny * d)) d++;
      const score = d + Math.abs((f.ny !== 0 ? x - (b.x0 + b.x1) / 2 : y - (b.y0 + b.y1) / 2)) * 0.15 + rng.next() * 0.3;
      if (score < bestD) [best, bestD] = [[x, y], score];
    }
    return best;
  };

  const place = (spec: { open: boolean; label?: string; L: [number, number]; D: [number, number]; wing?: number; tower?: boolean; cands: Front[] }) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const L = rng.int(spec.L[0], spec.L[1]) - attempt;
      const D = rng.int(spec.D[0], spec.D[1]) - (attempt > 1 ? 1 : 0);
      if (L < (spec.open ? 4 : 3) || D < 3) break;
      for (const f of spec.cands) {
        // retrait sur la rue : les logis se serrent au bord ou reculent derrière un jardinet
        const s = spec.open ? (rng.chance(0.7) ? 1 : 0) : rng.pick([0, 0, 1, 1, 2, 3]);
        const b = body(f, L, D, s, rng.int(-1, 1));
        const parts: Rect[] = [b];
        if (spec.tower) {
          // clocher carré contre un flanc, aligné sur la façade
          const t = L >= 6 ? 3 : 2;
          parts.push(wing(b, f, rng.chance(0.5) ? "gauche" : "droite", t, t, false));
        } else if (spec.wing && rng.chance(spec.wing)) {
          const side = rng.pick(["gauche", "droite", "fond"] as const);
          const along = side === "fond" ? L : D;
          const len = clamp(rng.int(2, Math.max(2, along - 1)), 2, along);
          parts.push(wing(b, f, side, len, rng.int(2, 3), rng.chance(0.65)));
        }
        if (!fits(parts)) continue;
        const door = spec.open ? doorOf(b, f) : null;
        if (spec.open && !door) continue;
        for (const p of parts) for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) built[y * w + x] = 1;
        if (spec.open) {
          for (let y = b.y0; y <= b.y1; y++)
            for (let x = b.x0; x <= b.x1; x++) tiles[y * w + x] = x === b.x0 || x === b.x1 || y === b.y0 || y === b.y1 ? T.mur : T.sol;
          tiles[door![1] * w + door![0]] = T.porte;
          rooms.push({ x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1, label: spec.label });
          // grande maison : parfois une porte de derrière, sur le mur du fond, hors de l'aile
          if (D >= 5 && rng.chance(0.35)) {
            const back: Cell = f.ny !== 0 ? [rng.int(b.x0 + 1, b.x1 - 1), f.ny < 0 ? b.y0 : b.y1] : [f.nx < 0 ? b.x0 : b.x1, rng.int(b.y0 + 1, b.y1 - 1)];
            const [ox, oy] = [back[0] + f.nx, back[1] + f.ny];
            if (inside(ox, oy) && !built[oy * w + ox]) tiles[back[1] * w + back[0]] = T.porte;
          }
          for (const p of parts.slice(1)) closed.push(p);
        } else for (const p of parts) closed.push(p);
        return true;
      }
    }
    return false;
  };

  // repères d'abord : le temple et l'auberge au bord de la place
  const area = w * h;
  const big = area >= 900;
  // (au plus près de la place ; à défaut, plus loin dans le village plutôt que pas du tout)
  for (const cands of [near.slice(0, 40), near]) if (place({ open: true, label: "Temple", L: big ? [6, 8] : [5, 6], D: big ? [7, 9] : [5, 6], tower: true, cands })) break;
  for (const cands of [near.slice(0, 60), near]) if (place({ open: true, label: "Auberge", L: big ? [6, 8] : [5, 6], D: big ? [5, 6] : [4, 5], wing: 0.75, cands })) break;
  const nOpen = clamp(Math.round(area / 230), 2, VILLAGE_PLACES.length + 2);
  const names = shuffled(VILLAGE_PLACES);
  let made = rooms.length;
  for (const label of names) {
    if (made >= nOpen) break;
    const ok = place({ open: true, label, L: [4, 7], D: [4, 6], wing: 0.4, cands: shuffled(fronts) });
    if (ok) made++;
  }
  // cours : un muret de pierres sèches d'une case, une barrière côté rue, un appentis de 2 × 2 au fond.
  // Le muret garde une case libre tout autour (comme les maisons) : il ne coupe jamais le praticable,
  // et l'appentis est à une case du muret, donc l'intérieur de la cour reste d'un seul tenant.
  const yards: { ring: Rect; gate: Cell; shed: Rect }[] = [];
  const nYards = area >= 900 ? rng.int(1, 2) : area >= 400 ? rng.int(0, 1) : 0;
  for (let k = 0, tries = 0; k < nYards && tries < 3; tries++) {
    const L = rng.int(6, 8);
    const D = rng.int(6, 7);
    for (const f of shuffled(fronts)) {
      const ring = body(f, L, D, rng.int(1, 2), rng.int(-1, 1));
      if (!fits([ring])) continue;
      // barrière au milieu du côté qui regarde la rue ; appentis dans le coin opposé
      const gate: Cell = f.ny !== 0 ? [Math.round((ring.x0 + ring.x1) / 2), f.ny < 0 ? ring.y1 : ring.y0] : [f.nx < 0 ? ring.x1 : ring.x0, Math.round((ring.y0 + ring.y1) / 2)];
      const farX = f.nx > 0 ? ring.x1 - 3 : f.nx < 0 ? ring.x0 + 2 : rng.chance(0.5) ? ring.x0 + 2 : ring.x1 - 3;
      const farY = f.ny > 0 ? ring.y1 - 3 : f.ny < 0 ? ring.y0 + 2 : rng.chance(0.5) ? ring.y0 + 2 : ring.y1 - 3;
      const shed: Rect = { x0: farX, y0: farY, x1: farX + 1, y1: farY + 1 };
      for (let y = ring.y0; y <= ring.y1; y++) for (let x = ring.x0; x <= ring.x1; x++) built[y * w + x] = 1;
      yards.push({ ring, gate, shed });
      k++;
      break;
    }
  }
  // logis : blocs pleins le long des rues, jusqu'à ce qu'il n'y ait plus de place
  const nClosed = Math.round(area / 80);
  for (let i = 0, fails = 0; i < nClosed && fails < 12; i++) {
    if (place({ open: false, L: [3, 6], D: [3, 5], wing: 0.38, cands: shuffled(fronts) })) fails = 0;
    else fails++;
  }
  for (const c of closed) for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) tiles[y * w + x] = T.mur;
  for (const { ring, gate, shed } of yards) {
    for (let y = ring.y0; y <= ring.y1; y++)
      for (let x = ring.x0; x <= ring.x1; x++) {
        const edge = x === ring.x0 || x === ring.x1 || y === ring.y0 || y === ring.y1;
        const inShed = x >= shed.x0 && x <= shed.x1 && y >= shed.y0 && y <= shed.y1;
        tiles[y * w + x] = edge || inShed ? T.mur : T.sol;
      }
    tiles[gate[1] * w + gate[0]] = T.sol;
  }

  // 8. Ruelles : le passage d'une case entre deux maisons voisines devient une venelle de terre battue, prolongée
  // des deux côtés jusqu'à une rue (jamais de cul-de-sac). Deux au plus, et seulement si le détour est court.
  const isWall = (x: number, y: number) => inside(x, y) && tiles[y * w + x] === T.mur;
  const free = (x: number, y: number) => inside(x, y) && !built[y * w + x] && (tiles[y * w + x] === T.sol || tiles[y * w + x] === T.vegetation);
  /** Chemin le plus court sur les cases libres depuis `from` jusqu'à une case voisine d'une rue (sans passer par `ban`). */
  const toRoad = (from: Cell, ban: Set<number>, max: number): Cell[] | null => {
    const prev = new Map<number, number>([[from[1] * w + from[0], -1]]);
    let ring = [from];
    for (let d = 0; d < max && ring.length; d++) {
      const next: Cell[] = [];
      for (const [x, y] of ring) {
        const steps: Cell[] = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        if (steps.some(([a, b]) => inside(a, b) && tiles[b * w + a] === T.route)) {
          const path: Cell[] = [];
          for (let i = y * w + x; i >= 0; i = prev.get(i)!) path.push([i % w, Math.floor(i / w)]);
          return path.reverse();
        }
        for (const [a, b] of steps) {
          const i = b * w + a;
          if (!free(a, b) || ban.has(i) || prev.has(i)) continue;
          prev.set(i, y * w + x);
          next.push([a, b]);
        }
      }
      ring = next;
    }
    return null;
  };
  let alleys = 0;
  const cells = shuffled([...Array(w * h).keys()]);
  for (const i of cells) {
    if (alleys >= 2) break;
    const x = i % w;
    const y = Math.floor(i / w);
    if (!free(x, y) || Math.hypot(x - pc[0], y - pc[1]) < 5) continue;
    // entre deux murs sur au moins deux cases de suite : c'est bien un passage entre deux façades
    const ns = isWall(x - 1, y) && isWall(x + 1, y) && free(x, y + 1) && isWall(x - 1, y + 1) && isWall(x + 1, y + 1);
    const ew = isWall(x, y - 1) && isWall(x, y + 1) && free(x + 1, y) && isWall(x + 1, y - 1) && isWall(x + 1, y + 1);
    if (!ns && !ew) continue;
    const [dx, dy] = ns ? [0, 1] : [1, 0];
    const a = toRoad([x, y], new Set([(y + dy) * w + x + dx]), 10);
    if (!a) continue;
    const b = toRoad([x + dx, y + dy], new Set(a.map(([p, q]) => q * w + p)), 10);
    if (!b) continue;
    for (const [p, q] of [...a, ...b]) tiles[q * w + p] = T.route;
    alleys++;
  }

  if (!flip) return { tiles, rooms };
  // carte en hauteur : on retourne tout (x ↔ y)
  const out: Tile[] = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x * h + y] = tiles[y * w + x];
  return { tiles: out, rooms: rooms.map((r) => ({ x: r.y, y: r.x, w: r.h, h: r.w, label: r.label })) };
}

/** Une case est-elle praticable pour un pion ? */
export function walkable(t: Tile): boolean {
  return t === T.sol || t === T.route || t === T.porte || t === T.vegetation || t === T.eau;
}

/** Cases atteignables en `speed` cases de déplacement (diagonales comptées comme une case, façon 5e). */
export function reachable(map: GameMap, from: { x: number; y: number }, speed: number, blocked: Set<number> = new Set()): Set<number> {
  const out = new Set<number>();
  const start = Math.round(from.y) * map.width + Math.round(from.x);
  const dist = new Map<number, number>([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    const d = dist.get(i)!;
    out.add(i);
    if (d >= speed) continue;
    const x = i % map.width;
    const y = Math.floor(i / map.width);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
        const j = ny * map.width + nx;
        if (dist.has(j) || blocked.has(j) || !walkable(map.tiles[j])) continue;
        // Pas de diagonale à travers un coin de mur.
        if (dx && dy && (!walkable(map.tiles[y * map.width + nx]) || !walkable(map.tiles[ny * map.width + x]))) continue;
        dist.set(j, d + 1);
        queue.push(j);
      }
  }
  return out;
}
