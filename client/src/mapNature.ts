// Rendu des cartes de nature, façon planche de roman graphique encrée puis lavée à l'aquarelle :
// sol, chemins, eau et ponts (mapOutdoor), puis rochers taillés en blocs, forêts en masses de canopée,
// lieux nommés dessinés (campement, grotte, ruine, tour de guet, clairière, gué), menus détails des prairies.
// Le décor ne change aucune règle : les cases restent celles de la carte, rien ne cache une case praticable.
// Une seule lumière, du haut à gauche ; toutes les ombres portées suivent le même vecteur (SUN).
import { T, type GameMap } from "../../shared/types";
import { paintDoors, paintFloors, type MapCtx } from "./mapCommon";
import {
  INK,
  canvas,
  paperTexture,
  blobPoints,
  inkOutline,
  inkPolyline,
  mixColor,
  noise2,
  rng,
  shapeOf,
  smoothPoints,
  stipple,
  tint,
  type Pt,
  type Rng,
} from "./mapInk";
import {
  bendLoops,
  distField,
  indoorCells,
  muted,
  paintWildBridges,
  paintWildGround,
  paintWildPaths,
  paintWildWater,
  pebble,
  wildContour,
  wildOf,
  wildWash,
  type Wild,
} from "./mapOutdoor";
import { hash } from "./mapUtil";

/** Direction de la lumière (du haut à gauche, un peu au-dessus) pour les facettes. */
const LIGHT = (() => {
  const v = [-0.55, -0.68, 0.72];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((k) => k / l) as [number, number, number];
})();

/** Ombre portée d'un objet haut de 1 px : décalage en x et en y (même vecteur pour tout). */
const SUN: Pt = [0.6, 0.8];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function renderNature(c: MapCtx): HTMLCanvasElement {
  const { map, theme, g } = c;
  const w = wildOf(map, theme);
  const plan = planSites(map, w);
  paintWildGround(g, w, plan.reserved);
  paintWildPaths(g, w);
  paintWildWater(g, w);
  paintWildBridges(g, w);
  // Bâtiments posés par le MJ (murs et portes) : leurs sols intérieurs restent des sols.
  const doors = map.tiles.includes(T.porte);
  if (doors) paintFloors(c, indoorCells(map));
  paintScatter(c, w, plan.reserved);
  paintRelics(c, w, plan.reserved);
  paintRocks(c, w);
  paintSites(c, w, plan, "sol");
  paintForest(c, w, plan.reserved);
  const glows = paintSites(c, w, plan, "objets");
  if (doors) paintDoors(c);
  finish(c, glows);
  return c.cv;
}

/** Dernière main : papier, auréoles d'aquarelle, palette ramenée vers la sépia, lueurs des feux, vignette, quadrillage. */
function finish(c: MapCtx, glows: Pt[]) {
  const { map, g, S, W, H } = c;
  const { width: PW, height: PH } = c.cv;
  // Deux ou trois grands lavis qui ont séché sur la planche : bord irrégulier (bruit seuillé), pigment accumulé en
  // liseré plus sombre ; l'intérieur ne bouge la valeur que de quelques pour cent.
  const r = rng(map.seed, 7);
  {
    const k = 8;
    const lw = Math.ceil(PW / k);
    const lh = Math.ceil(PH / k);
    const lo = canvas(lw, lh);
    const lc = lo.getContext("2d")!;
    const img = lc.createImageData(lw, lh);
    const nz = noise2(map.seed + 701);
    const blobs = Array.from({ length: 2 + Math.floor(r() * 2) }, () => ({ x: r() * lw, y: r() * lh, rad: (0.18 + r() * 0.16) * Math.max(lw, lh) }));
    for (let y = 0; y < lh; y++)
      for (let x = 0; x < lw; x++) {
        let v = -1;
        for (const b of blobs) v = Math.max(v, 1 - Math.hypot(x - b.x, y - b.y) / b.rad);
        v += nz(x / 19, y / 19) * 0.45 + nz(x / 5.5 + 20, y / 5.5) * 0.15;
        if (v <= 0) continue;
        // liseré : le pigment se dépose là où la flaque a fini de sécher
        const a = v < 0.06 ? 0.13 : 0.045 + (v < 0.14 ? 0.03 : 0);
        const i = (y * lw + x) * 4;
        img.data[i] = 128;
        img.data[i + 1] = 96;
        img.data[i + 2] = 54;
        img.data[i + 3] = Math.round(a * 255);
      }
    lc.putImageData(img, 0, 0);
    g.save();
    g.globalCompositeOperation = "multiply";
    g.imageSmoothingEnabled = true;
    g.drawImage(lo, 0, 0, lw * k, lh * k);
    g.restore();
  }
  // palette désaturée d'un cinquième, puis grain du papier et ton ocre posés ensemble (une seule passe « multiply »)
  g.save();
  g.globalCompositeOperation = "saturation";
  g.fillStyle = "rgba(128,128,128,.2)";
  g.fillRect(0, 0, PW, PH);
  const paper = paperTexture(PW, PH, map.seed, 0.9);
  const pg = paper.getContext("2d")!;
  pg.globalCompositeOperation = "multiply";
  pg.fillStyle = "rgba(246,230,200,.55)";
  pg.fillRect(0, 0, PW, PH);
  g.globalCompositeOperation = "multiply";
  g.drawImage(paper, 0, 0);
  g.restore();
  // Lumière : l'eau libre ouvre le ciel, ses abords sont plus clairs (lumière douce, en « soft-light »).
  {
    const seen = new Uint8Array(W * H);
    for (let s0 = 0; s0 < W * H; s0++) {
      if (seen[s0] || map.tiles[s0] !== T.eau) continue;
      const q = [s0];
      seen[s0] = 1;
      let sx = 0;
      let sy = 0;
      for (let h = 0; h < q.length; h++) {
        const i = q[h];
        const x = i % W;
        const y = (i - x) / W;
        sx += x;
        sy += y;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || map.tiles[ny * W + nx] !== T.eau) continue;
          seen[ny * W + nx] = 1;
          q.push(ny * W + nx);
        }
      }
      if (q.length < 4) continue;
      const cx = (sx / q.length + 0.5) * S;
      const cy = (sy / q.length + 0.5) * S;
      const R = (Math.sqrt(q.length) * 0.8 + 2.5) * S;
      const grad = g.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
      grad.addColorStop(0, "rgba(255,244,214,.38)");
      grad.addColorStop(0.6, "rgba(255,244,214,.16)");
      grad.addColorStop(1, "rgba(255,244,214,0)");
      g.save();
      g.globalCompositeOperation = "soft-light";
      g.fillStyle = grad;
      g.fillRect(cx - R, cy - R, R * 2, R * 2);
      g.restore();
    }
  }
  // Lueurs des feux, par-dessus le papier : la seule lumière chaude de la planche (mode additif).
  for (const [x, y] of glows) {
    const R = S * 2.2;
    const grad = g.createRadialGradient(x, y, 2, x, y, R);
    grad.addColorStop(0, "rgba(255,170,70,.42)");
    grad.addColorStop(0.3, "rgba(230,120,40,.2)");
    grad.addColorStop(1, "rgba(230,120,40,0)");
    g.save();
    g.globalCompositeOperation = "lighter";
    g.fillStyle = grad;
    g.fillRect(x - R, y - R, R * 2, R * 2);
    g.restore();
  }
  // Vignette : les bords de la planche s'assombrissent, le regard reste au centre.
  const vig = g.createRadialGradient(PW * 0.45, PH * 0.42, Math.min(PW, PH) * 0.3, PW / 2, PH / 2, Math.hypot(PW, PH) * 0.6);
  vig.addColorStop(0, "rgba(34,20,8,0)");
  vig.addColorStop(0.55, "rgba(34,20,8,.12)");
  vig.addColorStop(1, "rgba(30,17,6,.42)");
  g.fillStyle = vig;
  g.fillRect(0, 0, PW, PH);
  natureGrid(c);
}

/**
 * Quadrillage : discret sur la prairie et les chemins, plus effacé encore sur l'eau et sous la canopée (il ne doit pas
 * s'imposer au dessin). Les mêmes cases que le quadrillage commun, deux opacités.
 */
function natureGrid(c: MapCtx) {
  const { map, theme, g, W, H, S } = c;
  const soft = new Path2D();
  const hard = new Path2D();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = map.tiles[y * W + x];
      if (t === T.mur || t === T.vide) continue;
      (t === T.eau || t === T.vegetation ? soft : hard).rect(x * S + 0.5, y * S + 0.5, S, S);
    }
  g.save();
  g.strokeStyle = theme.grid;
  g.lineWidth = 1;
  g.globalAlpha = 0.11;
  g.stroke(soft);
  g.globalAlpha = 0.22;
  g.stroke(hard);
  g.restore();
}

// ——— Outils ———

/** Composantes d'une couleur #rrggbb. */
function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/**
 * Motif de hachures à la plume, raccord sans couture (tuile de 192 px) : à poser comme remplissage d'une forme.
 * Une seule opération de dessin, quelle que soit la taille de la zone. `dir` : « / », « \\ », « | », ou « x » (croisées).
 */
function hatchPattern(g: CanvasRenderingContext2D, seed: number, dir: "/" | "\\" | "|" | "x", step: number, width: number, color: string): CanvasPattern {
  const T = 192;
  const tile = canvas(T, T);
  const c = tile.getContext("2d")!;
  const r = rng(seed, T, Math.round(step * 10));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  const n = Math.max(1, Math.round(T / step));
  const p = new Path2D();
  const families = dir === "x" ? (["/", "\\"] as const) : ([dir] as const);
  for (const fam of families) {
    for (let i = 0; i < n; i++) {
      const c0 = (i * T) / n;
      const L = fam === "|" ? T : T * Math.SQRT2;
      let t = -r() * 10;
      while (t < L) {
        const len = 10 + r() * 34;
        const t1 = Math.min(L, t + len);
        const at = (u: number): [number, number] => {
          const v = u / (fam === "|" ? 1 : Math.SQRT2);
          if (fam === "|") return [c0 + (r() - 0.5) * 0.6, v];
          if (fam === "/") return [c0 + v, T - v];
          return [c0 + v, v];
        };
        const [ax, ay] = at(Math.max(0, t));
        const [bx, by] = at(t1);
        for (const ox of [-T, 0, T])
          for (const oy of [-T, 0, T]) {
            p.moveTo(ax + ox, ay + oy);
            p.lineTo(bx + ox, by + oy);
          }
        t = t1 + (r() < 0.75 ? 1.5 + r() * 2.5 : 5 + r() * 7);
      }
    }
  }
  c.stroke(p);
  return g.createPattern(tile, "repeat")!;
}

/** Copie de l'alpha d'un calque, décalée, remplie d'une couleur ou d'un motif. */
function recolor(src: HTMLCanvasElement, fill: string | CanvasPattern, dx = 0, dy = 0): HTMLCanvasElement {
  const cv = canvas(src.width, src.height);
  const c = cv.getContext("2d")!;
  c.drawImage(src, dx, dy);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = fill;
  c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

function centroid(poly: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

/** Enveloppe convexe (chaîne monotone). */
function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
    up.push(p[i]);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** Ombre portée d'un objet de hauteur `h` posé au sol sur le polygone `foot` (balayage le long du soleil). */
function castShadow(g: CanvasRenderingContext2D, foot: Pt[], h: number, color = "rgba(16,10,5,.4)") {
  const moved = foot.map(([x, y]) => [x + SUN[0] * h, y + SUN[1] * h] as Pt);
  g.fillStyle = color;
  g.fill(shapeOf(hull([...foot, ...moved])).path);
}

// ——— Rochers et falaises ———

/** Éclat de pierre anguleux (éboulis) : polygone à 4-6 pans, dessus éclairé, pan sombre au sud-est, ombre nette. */
function scree(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number, stone: string) {
  const n = 4 + Math.floor(r() * 3);
  const a0 = r() * Math.PI * 2;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const d = s * (0.7 + r() * 0.45);
    return [x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8];
  });
  castShadow(g, pts, s * 0.9, "rgba(16,10,5,.42)");
  g.fillStyle = mixColor(stone, INK, 0.42);
  g.fill(shapeOf(pts).path);
  // dessus : le même polygone resserré vers le haut à gauche
  const top = pts.map(([u, v]) => [x - s * 0.18 + (u - x) * 0.62, y - s * 0.2 + (v - y) * 0.62] as Pt);
  g.fillStyle = tint(mixColor(stone, "#efe4cc", 0.3), (r() - 0.5) * 0.08);
  g.fill(shapeOf(top).path);
  inkPolyline(g, pts, r, { closed: true, width: s > 4 ? 1 : 0.75, wobble: 0.2, pressure: 0.3 });
}

/**
 * Rochers : chaque amas est un tas de blocs de tailles différentes (gros au cœur, plus petits au bord), posés du fond
 * vers l'avant. Un bloc : contour irrégulier de 8 à 14 sommets (rayon bruité), dessus éclairé au nord-ouest en deux
 * facettes, face d'ombre au sud-est en deux tons hachurée à 45° (croisé dans le plus sombre), arête claire au nord-ouest,
 * deux ou trois fissures, mousse en petites taches sur le haut. Sous le dessus, la paroi du bloc se voit au sud, à
 * traits verticaux inégaux ; au bord sud d'un massif elle est plus haute : une petite falaise. Les blocs restent dans
 * les cases de rocher (à un dixième de case près) : rien ne déborde sur ce qui se marche.
 */
function paintRocks(c: MapCtx, w: Wild) {
  const { map, theme, g, W, H, S } = c;
  if (!map.tiles.includes(T.mur)) return;
  const seed = map.seed;
  // hors cadre, la roche continue
  const rockCell = (x: number, y: number) => map.tiles[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)] === T.mur;
  const isRock = (x: number, y: number) => map.tiles[y * W + x] === T.mur;
  const rdist = distField(isRock, W, H);
  // taille de l'amas de chaque case (composantes à 4 voisins)
  const comp = new Int32Array(W * H).fill(-1);
  const compSize: number[] = [];
  for (let s = 0; s < W * H; s++) {
    if (map.tiles[s] !== T.mur || comp[s] >= 0) continue;
    const id = compSize.length;
    const q = [s];
    comp[s] = id;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      const x = i % W;
      const y = (i - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || comp[ny * W + nx] >= 0 || !isRock(nx, ny)) continue;
        comp[ny * W + nx] = id;
        q.push(ny * W + nx);
      }
    }
    compSize.push(q.length);
  }
  /** Distance (px) du point à la plus proche case qui n'est pas du rocher. */
  const room = (px: number, py: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    let best = S * 3;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        if (rockCell(cx + dx, cy + dy)) continue;
        const x0 = (cx + dx) * S;
        const y0 = (cy + dy) * S;
        best = Math.min(best, Math.hypot(Math.max(x0 - px, 0, px - x0 - S), Math.max(y0 - py, 0, py - y0 - S)));
      }
    return best;
  };
  const margin = S * 0.1;

  interface Block {
    x: number;
    y: number;
    R: number;
    /** Hauteur de la paroi visible au sud (px). */
    h: number;
    P: Pt[];
    i: number;
  }
  const blocks: Block[] = [];
  const covered = new Uint8Array(W * H);
  const shapeBlock = (rr: Rng, x: number, y: number, R: number): Pt[] => {
    const n = 7 + Math.floor(rr() * 6);
    const a0 = rr() * Math.PI * 2;
    const ell = 0.78 + rr() * 0.22;
    const rot = rr() * Math.PI;
    const ph = rr() * 6.28;
    const P: Pt[] = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + ((k + (rr() - 0.5) * 0.55) / n) * Math.PI * 2;
      // rayon bruité : une bosse lente et un éclat par sommet
      const rad = R * (0.86 + Math.sin(a * 2 + ph) * 0.09 + (rr() - 0.5) * 0.3);
      const u = Math.cos(a) * rad;
      const v = Math.sin(a) * rad * ell;
      P.push([x + u * Math.cos(rot) - v * Math.sin(rot), y + u * Math.sin(rot) + v * Math.cos(rot)]);
    }
    // les sommets tournent dans le sens des angles croissants (repère écran)
    P.sort((p, q) => Math.atan2(p[1] - y, p[0] - x) - Math.atan2(q[1] - y, q[0] - x));
    return P;
  };
  const place = (x: number, y: number, Rt: number, rr: Rng, cell: number) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    const big = compSize[comp[cell]] >= 8;
    // au bord sud d'un massif, la paroi est haute (falaise) ; ailleurs, elle se devine
    const southEdge = !rockCell(cx, Math.floor((y + Rt * 0.9) / S) + 1) || !rockCell(cx, cy + 1);
    let h = big && southEdge ? S * (0.3 + rr() * 0.16) : Rt * (0.2 + rr() * 0.18);
    let R = Math.min(Rt, room(x, y) + margin, room(x, y + h) + margin);
    if (R < S * 0.22) {
      h *= 0.5;
      R = Math.min(Rt, room(x, y) + margin, room(x, y + h) + margin);
    }
    if (R < S * 0.18) return false;
    h = Math.min(h, R * 0.9);
    const i = blocks.length;
    blocks.push({ x, y, R, h, P: shapeBlock(rr, x, y, R), i });
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const u = cx + dx;
        const v = cy + dy;
        if (u < 0 || v < 0 || u >= W || v >= H) continue;
        if (Math.hypot((u + 0.5) * S - x, (v + 0.5) * S - y) < R * 0.55) covered[v * W + u] = 1;
      }
    return true;
  };
  // 1. du cœur vers le bord : un gros bloc là où rien ne couvre encore la case ; le premier de chaque amas (au plus
  // épais) domine les autres, les suivants vont de la moitié au double
  const dominant = new Uint8Array(compSize.length);
  const order: [number, number][] = [];
  for (let i = 0; i < W * H; i++) if (map.tiles[i] === T.mur) order.push([i, Math.min(4, rdist[i]) + hash(i % W, Math.floor(i / W), seed + 24) * 0.9]);
  order.sort((a, b) => b[1] - a[1]);
  for (const [i] of order) {
    if (covered[i]) continue;
    const x = i % W;
    const y = (i - x) / W;
    const rr = rng(seed, x, y, 23);
    const core = Math.min(3, rdist[i] - 1);
    const first = !dominant[comp[i]] && compSize[comp[i]] >= 3;
    dominant[comp[i]] = 1;
    const Rt = S * (0.6 + core * 0.24) * (first ? 1.6 + rr() * 0.4 : 0.8 + rr() * 0.45);
    const px = (x + 0.5 + (rr() - 0.5) * 0.45) * S;
    const py = (y + 0.5 + (rr() - 0.5) * 0.45) * S;
    if (!place(px, py, Rt, rr, i)) place((x + 0.5) * S, (y + 0.5) * S, Rt, rr, i);
    covered[i] = 1;
  }
  // 2. éclats et petits blocs entre les gros : le tas a toutes les tailles
  for (const [i] of order) {
    const x = i % W;
    const y = (i - x) / W;
    const rr = rng(seed, x, y, 26);
    for (let k = 0; k < 2; k++) {
      if (rr() > 0.8) continue;
      place((x + 0.1 + rr() * 0.8) * S, (y + 0.1 + rr() * 0.8) * S, S * (0.24 + rr() * 0.3), rr, i);
    }
  }
  // du fond vers l'avant : le pied de chaque bloc décide de l'ordre
  blocks.sort((a, b) => a.y + a.h + a.R * 0.6 - (b.y + b.h + b.R * 0.6));

  // pierre grise et froide (jamais brun chaume), un soupçon de la teinte du genre
  const base = muted(mixColor(mixColor(theme.wall, "#878c8e", 0.62), theme.floor, 0.06), 0.25);
  const moss = mixColor(theme.vegetation, "#7d9a2c", 0.55);

  // Fond de l'amas : bord bosselé (jamais une galette à bords droits), terre éboulée tout autour, ombre portée floue.
  const loops = bendLoops(wildContour(isRock, W, H, { smooth: 3, jitter: 4, round: 2, seed: seed + 71 }), seed + 72, S * 0.08);
  const mass = shapeOf(loops);
  const dirt = mixColor(mixColor(theme.road, "#6e5a40", 0.5), w.grass, 0.25);
  {
    // terre éboulée : bande de largeur changeante, plus large au sud-est (là où tombent les pierres)
    const nd = noise2(seed + 73);
    const apron = [new Path2D(), new Path2D(), new Path2D()];
    for (const loop of loops)
      for (let i = 0; i < loop.length; i += 4) {
        const seg = loop.slice(i, i + 5);
        if (seg.length < 2) continue;
        const [x0, y0] = seg[0];
        const [x1, y1] = seg[seg.length - 1];
        const face = ((y1 - y0) * SUN[0] - (x1 - x0) * SUN[1]) / (Math.hypot(x1 - x0, y1 - y0) || 1);
        const k = clamp((nd(x0 / 60, y0 / 60) + 1) * 0.5 + face * 0.4, 0, 0.999);
        const p = apron[Math.floor(k * 3)];
        seg.forEach(([u, v], j) => (j ? p.lineTo(u, v) : p.moveTo(u, v)));
      }
    g.save();
    g.lineJoin = "round";
    g.lineCap = "round";
    apron.forEach((p, j) => {
      g.strokeStyle = tint(dirt, 0, 0.3);
      g.lineWidth = S * (0.35 + j * 0.3);
      g.stroke(p);
      g.strokeStyle = tint(dirt, -0.05, 0.35);
      g.lineWidth = S * (0.2 + j * 0.18);
      g.stroke(p);
    });
    g.restore();
    // ombre portée de tout l'amas : floue, décalée vers le sud-est, toujours dans le même sens
    const k = 4;
    const lo = canvas(Math.ceil((W * S) / k), Math.ceil((H * S) / k));
    const lc = lo.getContext("2d")!;
    lc.filter = "blur(3px)";
    lc.setTransform(1 / k, 0, 0, 1 / k, SUN[0] * S * 0.55 / k, SUN[1] * S * 0.55 / k);
    lc.fillStyle = "rgba(20,14,8,.55)";
    lc.fill(mass.path, "nonzero");
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = "multiply";
    g.drawImage(lo, 0, 0, lo.width * k, lo.height * k);
    g.restore();
  }
  // Ombres portées des blocs : toutes dans un seul tracé (une seule valeur, pas de chevauchement plus sombre).
  const shadow = new Path2D();
  for (const b of blocks) {
    const foot = b.P.map(([x, y]) => [x, y + b.h] as Pt);
    const k = b.h + b.R * 0.45;
    shadow.addPath(shapeOf(hull([...foot, ...foot.map(([x, y]) => [x + SUN[0] * k, y + SUN[1] * k] as Pt)])).path);
  }
  g.fillStyle = "rgba(16,10,5,.3)";
  g.fill(shadow, "nonzero");
  // Le socle : pierre sombre, hachures croisées dans les creux entre les blocs ; au sud et à l'est, la falaise montre
  // ses strates (traits parallèles au bord, interrompus) et des coulures verticales.
  g.fillStyle = mixColor(mixColor(base, dirt, 0.45), INK, 0.38);
  g.fill(mass.path, "nonzero");
  g.save();
  g.clip(mass.path, "nonzero");
  g.fillStyle = hatchPattern(g, seed + 74, "x", 3.6, 0.7, tint(INK, 0, 0.42));
  g.fill(mass.path, "nonzero");
  {
    const strata = new Path2D();
    const drip = new Path2D();
    const sr = rng(seed, 75);
    for (const loop of loops) {
      const L = loop.length;
      const ns = loop.map((_, i) => {
        const p = loop[(i - 2 + L) % L];
        const q = loop[(i + 2) % L];
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        return [(q[1] - p[1]) / l, -(q[0] - p[0]) / l] as Pt;
      });
      // sens des normales : vers l'extérieur de la roche
      let vote = 0;
      for (let i = 0; i < L; i += 3) vote += rockCell(Math.floor((loop[i][0] + ns[i][0] * S * 0.4) / S), Math.floor((loop[i][1] + ns[i][1] * S * 0.4) / S)) ? -1 : 1;
      const sg = vote >= 0 ? 1 : -1;
      for (const [d, a] of [[3, 0.9], [7, 0.75], [11.5, 0.6], [17, 0.45]] as const) {
        let open = false;
        for (let i = 0; i < L; i++) {
          const nx = ns[i][0] * sg;
          const ny = ns[i][1] * sg;
          // falaise : seulement là où le bord regarde le sud ou l'est
          const on = nx * SUN[0] + ny * SUN[1] > 0.3 && sr() < 0.93 + a * 0.05;
          const px = loop[i][0] - nx * (d + Math.sin(i * 0.7 + d) * 0.8);
          const py = loop[i][1] - ny * (d + Math.sin(i * 0.7 + d) * 0.8);
          if (on && open) strata.lineTo(px, py);
          else if (on) strata.moveTo(px, py);
          open = on;
          if (on && d === 3 && i % 2 === 0) {
            const l = 4 + sr() * 12;
            drip.moveTo(px, py + 1);
            drip.lineTo(px + (sr() - 0.5), py - l * ny);
          }
        }
      }
    }
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = tint(INK, 0, 0.7);
    g.lineWidth = 0.9;
    g.stroke(strata);
    g.strokeStyle = tint(INK, 0, 0.45);
    g.lineWidth = 0.7;
    g.stroke(drip);
  }
  g.restore();
  inkOutline(g, loops, rng(seed, 76), { width: 2.2, wobble: 0.5 });
  // éclats tombés au fond des creux (on ne les voit qu'entre les blocs)
  {
    const rubble = mixColor(base, INK, 0.35);
    for (const [i] of order) {
      const x = i % W;
      const y = (i - x) / W;
      const rr = rng(seed, x, y, 27);
      for (let k = 0; k < 3; k++) scree(g, rr, (x + 0.1 + rr() * 0.8) * S, (y + 0.1 + rr() * 0.8) * S, 2 + rr() * 3.5, rubble);
    }
  }

  const all = new Path2D();
  const angleOf = (b: Block, j: number) => Math.atan2(b.P[j][1] - b.y, b.P[j][0] - b.x);
  /** Sommet dont l'angle (vu du centre) est le plus proche de `a`. */
  const nearestAt = (b: Block, a: number) => {
    let best = 0;
    let bd = 9;
    for (let j = 0; j < b.P.length; j++) {
      let d = Math.abs(angleOf(b, j) - a);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    return best;
  };
  /** Sommets de i à j (inclus) en tournant dans le sens des indices. */
  const run = (P: Pt[], i: number, j: number) => {
    const out: Pt[] = [];
    for (let k = i; ; k = (k + 1) % P.length) {
      out.push(P[k]);
      if (k === j || out.length > P.length) break;
    }
    return out;
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const b of blocks) {
    const rr = rng(seed, b.i, Math.round(b.x), 25);
    const { P, x, y, R, h } = b;
    // chaque bloc sa pierre : gris chaud, gris froid ou ocre, plus ou moins clair (±12 %)
    const hk = hash(b.i, Math.round(b.y), seed + 28);
    const lum = (rr() - 0.5) * 0.24;
    const bb0 = mixColor(base, hk < 0.42 ? "#8c8273" : hk < 0.78 ? "#77838b" : "#a08a58", 0.3 + rr() * 0.25);
    const bb = mixColor(bb0, lum > 0 ? "#ffffff" : "#000000", Math.abs(lum));
    const lit = mixColor(bb, "#ebe9e0", 0.45);
    const mid = mixColor(bb, INK, 0.3);
    const sideL = mixColor(bb, INK, 0.42);
    const sideR = mixColor(bb, INK, 0.68);
    const top = shapeOf(P);
    all.addPath(top.path);
    // Paroi : le bloc vu un peu de biais, plus claire à gauche ; traits verticaux de longueur inégale depuis le pied.
    if (h > 1.5) {
      const side = hull([...P, ...P.map(([u, v]) => [u, v + h] as Pt)]);
      const sp = shapeOf(side).path;
      all.addPath(sp);
      const grad = g.createLinearGradient(x - R, 0, x + R, 0);
      grad.addColorStop(0, sideL);
      grad.addColorStop(1, sideR);
      g.fillStyle = grad;
      g.fill(sp);
      const fall = new Path2D();
      // falaise : traits verticaux serrés (un tous les deux pixels), plus denses sur une haute paroi
      const nf = Math.max(3, Math.round((R * 2) / (h > S * 0.25 ? 1.9 : 2.6)));
      for (let k = 0; k < nf; k++) {
        const u = x - R + ((k + rr() * 0.8) / nf) * R * 2;
        // pied de la paroi sous ce point : le plus bas des côtés du bloc à cette abscisse, abaissé de h
        let foot = -Infinity;
        for (let j = 0; j < P.length; j++) {
          const p = P[j];
          const q = P[(j + 1) % P.length];
          if ((p[0] - u) * (q[0] - u) > 0 || p[0] === q[0]) continue;
          foot = Math.max(foot, p[1] + ((q[1] - p[1]) * (u - p[0])) / (q[0] - p[0]));
        }
        if (foot === -Infinity) continue;
        const l = h * (0.3 + rr() * 0.8);
        fall.moveTo(u, foot + h - 0.5);
        fall.lineTo(u + (rr() - 0.5) * 0.8, foot + h - l);
      }
      g.save();
      g.clip(sp);
      g.strokeStyle = tint(INK, 0, 0.7);
      g.lineWidth = 0.85;
      g.stroke(fall);
      g.restore();
      inkPolyline(g, side, rr, { closed: true, width: 2.4, wobble: 0.3, pressure: 0.4 });
    }
    // Dessus : la pierre éclairée reste claire (papier presque nu) ; tout le modelé est à la plume. Le flanc tourné vers
    // le sud-est (le contour décalé vers la lumière en découpe un croissant) reçoit un lavis gris froid, puis des
    // hachures de pente : des traits qui partent du bord vers l'intérieur, longs là où le flanc fait face à l'ombre,
    // serrés ou lâches selon un bruit propre au bloc ; dans le plus sombre, une seconde passe en travers.
    const iN = nearestAt(b, -Math.PI * 0.62 + (rr() - 0.5) * 0.3);
    const tone = (rr() - 0.5) * 0.07;
    g.fillStyle = tint(lit, tone);
    g.fill(top.path);
    const off = R * (0.42 + rr() * 0.2);
    const shifted = P.map(([u, v]) => [u - off * 0.6 + (u - x) * -0.04, v - off * 0.8 + (v - y) * -0.04] as Pt);
    const crescent = new Path2D(top.path);
    crescent.addPath(shapeOf(shifted).path);
    g.save();
    g.clip(top.path);
    g.fillStyle = tint(mid, tone, 0.8);
    g.fill(crescent, "evenodd");
    {
      const sh = g.createLinearGradient(x - R * 0.5, y - R * 0.6, x + R * 0.8, y + R);
      sh.addColorStop(0, "rgba(60,56,70,0)");
      sh.addColorStop(0.5, "rgba(60,56,70,0)");
      sh.addColorStop(1, "rgba(44,40,56,.5)");
      g.globalCompositeOperation = "multiply";
      g.fillStyle = sh;
      g.fillRect(x - R * 1.1, y - R * 1.1, R * 2.2, R * 2.2);
      g.globalCompositeOperation = "source-over";
    }
    // l'arête entre le dessus et le flanc : un trait brisé, la plume se relève par endroits
    {
      let seg: Pt[] = [];
      shifted.forEach((p, j) => {
        seg.push(p);
        if (seg.length > 2 + rr() * 3 || j === shifted.length - 1) {
          if (rr() < 0.7) inkPolyline(g, seg, rr, { width: 0.9, wobble: 0.3, taper: 3, color: tint(INK, 0, 0.55) });
          seg = [p];
        }
      });
    }
    // hachures de pente
    const hp = new Path2D();
    const hp2 = new Path2D();
    const ph = rr() * 6.28;
    const n = P.length;
    for (let j = 0; j < n; j++) {
      const p = P[j];
      const q = P[(j + 1) % n];
      const ex = q[0] - p[0];
      const ey = q[1] - p[1];
      const el = Math.hypot(ex, ey) || 1;
      // normale sortante (sommets dans le sens des angles croissants : la normale sortante est à gauche du parcours)
      const nx = ey / el;
      const ny = -ex / el;
      const face = nx * SUN[0] + ny * SUN[1];
      if (face < 0.05) continue;
      let t = rr() * 2;
      while (t < el) {
        const u = p[0] + (ex * t) / el;
        const v = p[1] + (ey * t) / el;
        // écart des traits : 1,8 à 4,4 px selon un bruit lent le long du bord
        const gap = 1.8 + (1 - face) * 1.4 + (Math.sin(u * 0.21 + v * 0.17 + ph) * 0.5 + 0.5) * 1.2 + rr() * 0.6;
        const len = Math.min(R * 0.8, (6 + face * 11) * (0.6 + rr() * 0.6));
        const tw = (rr() - 0.5) * 0.3;
        const dx = -(nx * Math.cos(tw) - ny * Math.sin(tw));
        const dy = -(ny * Math.cos(tw) + nx * Math.sin(tw));
        hp.moveTo(u - dx * 0.5, v - dy * 0.5);
        hp.quadraticCurveTo(u + dx * len * 0.5 + dy * 0.8, v + dy * len * 0.5 - dx * 0.8, u + dx * len, v + dy * len);
        if (face > 0.55 && rr() < 0.75) {
          // passe croisée, courte, en travers de la pente
          const cx = u + dx * len * 0.3;
          const cy = v + dy * len * 0.3;
          const cl = len * (0.35 + rr() * 0.3);
          hp2.moveTo(cx - dy * cl * 0.5, cy + dx * cl * 0.5);
          hp2.lineTo(cx + dy * cl * 0.5 + dx * 1.5, cy - dx * cl * 0.5 + dy * 1.5);
        }
        t += gap;
      }
    }
    g.lineCap = "round";
    g.strokeStyle = tint(INK, 0, 0.62);
    g.lineWidth = 0.8;
    g.stroke(hp);
    g.strokeStyle = tint(INK, 0, 0.42);
    g.lineWidth = 0.65;
    g.stroke(hp2);
    // fissures en Y : un trait fin qui part du bord, fourche une fois
    const nCrack = R > S * 0.5 ? 2 + (rr() < 0.35 ? 1 : 0) : rr() < 0.4 ? 1 : 0;
    for (let k = 0; k < nCrack; k++) {
      const j = Math.floor(rr() * P.length);
      const pts: Pt[] = [P[j]];
      let a = Math.atan2(y - P[j][1], x - P[j][0]) + (rr() - 0.5) * 0.7;
      const steps = 2 + Math.floor(rr() * 2);
      for (let s = 0; s < steps; s++) {
        a += (s % 2 ? 1 : -1) * (0.25 + rr() * 0.45);
        const [px, py] = pts[pts.length - 1];
        const l = R * (0.14 + rr() * 0.16);
        pts.push([px + Math.cos(a) * l, py + Math.sin(a) * l]);
      }
      inkPolyline(g, pts, rr, { width: 0.95, wobble: 0.25, taper: 6, color: tint(INK, 0, 0.85) });
      const fork = pts[Math.min(pts.length - 1, 1 + Math.floor(rr() * (pts.length - 1)))];
      const fa = a + (rr() < 0.5 ? 1 : -1) * (0.6 + rr() * 0.5);
      const fl = R * (0.12 + rr() * 0.14);
      inkPolyline(g, [fork, [fork[0] + Math.cos(fa) * fl * 0.5 + (rr() - 0.5), fork[1] + Math.sin(fa) * fl * 0.5], [fork[0] + Math.cos(fa) * fl, fork[1] + Math.sin(fa) * fl]], rr, {
        width: 0.7,
        wobble: 0.2,
        taper: 5,
        color: tint(INK, 0, 0.75),
      });
    }
    // mousse : trois à six amas de petits points vert vif sur le haut du bloc, côté nord
    if (rr() < 0.75) {
      const m = new Path2D();
      const mDark = new Path2D();
      const [nx, ny] = P[iN];
      const clusters = 3 + Math.floor(rr() * 4);
      for (let k = 0; k < clusters; k++) {
        const t = 0.1 + rr() * 0.4;
        const ox = nx + (x - nx) * t + (rr() - 0.5) * R * 0.7;
        const oy = ny + (y - ny) * t + (rr() - 0.5) * R * 0.3;
        const dots = 4 + Math.floor(rr() * 7);
        for (let d = 0; d < dots; d++) {
          const da = rr() * 6.28;
          const dd = Math.sqrt(rr()) * (2 + R * 0.08);
          const u = ox + Math.cos(da) * dd;
          const v = oy + Math.sin(da) * dd * 0.8;
          const s = 0.6 + rr() * 1.1;
          mDark.moveTo(u + s + 0.5, v + 0.5);
          mDark.arc(u + 0.5, v + 0.5, s, 0, Math.PI * 2);
          m.moveTo(u + s, v);
          m.arc(u, v, s, 0, Math.PI * 2);
        }
      }
      g.fillStyle = tint(mixColor(moss, INK, 0.5), 0, 0.7);
      g.fill(mDark);
      g.fillStyle = moss;
      g.fill(m);
    }
    g.restore();
    // arête claire au nord-ouest, juste en dedans du contour
    const iA = nearestAt(b, Math.PI * 0.75 + (rr() - 0.5) * 0.4);
    const iB = nearestAt(b, -Math.PI * 0.25 + (rr() - 0.5) * 0.4);
    const rim = run(P, iA, iB).map(([u, v]) => [u + (x - u) * 0.09, v + (y - v) * 0.09] as Pt);
    if (rim.length > 1) inkPolyline(g, rim, rr, { width: Math.max(1, R * 0.05), wobble: 0.2, taper: R * 0.5, color: "rgba(252,250,240,.55)" });
    // contour : trait épais tout autour, plus lourd côté ombre
    inkPolyline(g, P, rr, { closed: true, width: 1.8 + Math.min(1, R / S) * 0.6, wobble: 0.35, pressure: 0.45 });
    if (iB !== iA) inkPolyline(g, run(P, iB, iA), rr, { width: 2.6 + Math.min(1, R / S), wobble: 0.3, taper: R * 0.4, pressure: 0.4 });
  }
  // grain d'aquarelle sur la pierre, en une passe
  g.save();
  g.clip(all, "nonzero");
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.45;
  g.drawImage(w.tex[1], 0, 0, W * S, H * S);
  g.restore();

  // éboulis au pied, surtout côté ombre : éclats anguleux, quelques gros blocs tombés
  const stone = mixColor(base, "#d9d0bc", 0.2);
  for (const loop of loops)
    for (let i = 0; i < loop.length; i += 4) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const l = Math.hypot(dx, dy) || 1;
      const ox = dy / l;
      const oy = -dx / l;
      const facing = ox * SUN[0] + oy * SUN[1];
      const rr = rng(seed, Math.round(p[0]), Math.round(p[1]), 22);
      if (rr() > 0.3 + Math.max(0, facing) * 0.5) continue;
      const k = 1 + Math.floor(rr() * (2 + Math.max(0, facing) * 4));
      for (let j = 0; j < k; j++) {
        // beaucoup de pierres au pied, de moins en moins à mesure qu'on s'éloigne
        const d = 3 + rr() * rr() * (14 + Math.max(0, facing) * S * 0.6);
        const x = p[0] + ox * d + (rr() - 0.5) * 10;
        const y = p[1] + oy * d + (rr() - 0.5) * 10;
        const t = w.tile(Math.floor(x / S), Math.floor(y / S));
        if (t === T.eau || t === T.mur || t === T.route || t === T.porte) continue;
        scree(g, rr, x, y, j === 0 && rr() < 0.2 ? 4 + rr() * 3 : 1.5 + rr() * 2.4, stone);
      }
    }
}

// ——— Forêts ———

interface Tree {
  x: number;
  y: number;
  R: number;
  /** 0 feuillu, 1 conifère, 2 bouleau, 3 arbre mort, 4 buisson bas. */
  kind: number;
  /** Teinte (bosquet). */
  hue: number;
  /** En lisière sud : on voit le tronc sous la ramure. */
  edge: boolean;
  /** Rotation du dessin : l'éclairage de chaque arbre varie de ±20°. */
  rot: number;
  /** Variante du dessin. */
  v: number;
  /** Vieil arbre repère, dessiné à sa vraie taille. */
  big?: boolean;
}

/** Contour festonné d'une ramure : bosses arrondies séparées par de petits creux. */
function scallop(r: Rng, cx: number, cy: number, R: number, bumps: number): Pt[] {
  const ph = r() * Math.PI * 2;
  const ph2 = r() * Math.PI * 2;
  const n = bumps * 6;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.abs(Math.sin((bumps * a) / 2 + ph));
    const rr = R * (0.84 + 0.16 * Math.sqrt(s) + 0.07 * Math.sin(2 * a + ph2) + (r() - 0.5) * 0.03);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

/** Arc d'un contour fermé (indices dont l'angle tombe dans [a0, a1], en radians, sens écran). */
function arcOf(pts: Pt[], cx: number, cy: number, a0: number, a1: number): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  // départ au début de l'arc pour qu'il soit d'un seul tenant
  let start = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.atan2(pts[i][1] - cy, pts[i][0] - cx);
    const d = (((a - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (d < 0.2) {
      start = i;
      break;
    }
  }
  for (let k = 0; k < n; k++) {
    const p = pts[(start + k) % n];
    const a = Math.atan2(p[1] - cy, p[0] - cx);
    const d = (((a - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (d <= (((a1 - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) out.push(p);
    else if (out.length) break;
  }
  return out;
}

/** Touffe de feuillage : forme festonnée éclairée selon sa place, liseré clair au nord-ouest, trait fin au sud-est. */
function clump(g: CanvasRenderingContext2D, r: Rng, px: number, py: number, cr: number, litK: number, base: string, light: string, dark: string, line: string): Pt[] {
  const pts = scallop(r, px, py, cr, 5 + Math.floor(r() * 2));
  g.fillStyle = litK > 0 ? mixColor(base, light, 0.12 + 0.5 * Math.min(1, litK)) : mixColor(base, dark, 0.4 * Math.min(1, -litK));
  g.fill(shapeOf(pts).path);
  const lw = Math.max(0.6, cr * 0.07);
  const nw = arcOf(pts, px, py, Math.PI * 0.95, Math.PI * 1.62);
  if (nw.length > 1) inkPolyline(g, nw, r, { width: lw * 1.5, wobble: 0.2, taper: cr * 0.6, color: tint(light, 0.04, 0.8) });
  const se = arcOf(pts, px, py, -Math.PI * 0.12, Math.PI * 0.68);
  if (se.length > 1) inkPolyline(g, se, r, { width: lw, wobble: 0.2, taper: cr * 0.5, color: tint(line, 0, 0.85) });
  return pts;
}

/**
 * Hachures d'encre côté ombre (sud-est) d'une ramure, qui suivent le volume : des arcs concentriques autour du point
 * le plus éclairé (en haut à gauche, un peu tourné à chaque arbre), coupés en morceaux de longueur inégale ; dans la
 * partie la plus sombre, une seconde famille d'arcs, parallèles au bord, les croise. Écart et angle tirés à la graine.
 * À appeler dans la découpe de la ramure.
 */
function crownHatch(g: CanvasRenderingContext2D, r: Rng, cx: number, cy: number, R: number) {
  const a = Math.atan2(-0.68, -0.55) + (r() - 0.5) * 0.7;
  const off = R * (0.38 + r() * 0.18);
  const lx = cx + Math.cos(a) * off;
  const ly = cy + Math.sin(a) * off;
  const step = Math.max(1.9, R * (0.055 + r() * 0.045));
  const back = a + Math.PI;
  const p = new Path2D();
  for (let rad = R * (0.95 + r() * 0.12); rad < R + off; rad += step * (0.8 + r() * 0.45)) {
    // plus on s'éloigne de la lumière, plus l'arc couvre large
    const span = 0.55 + ((rad - R * 0.95) / (off + R * 0.05)) * 0.9 + r() * 0.2;
    let t = back - span + r() * 0.15;
    const end = back + span;
    while (t < end) {
      const len = ((R * (0.2 + r() * 0.45)) / rad) * (r() < 0.2 ? 0.4 : 1);
      p.moveTo(lx + Math.cos(t) * rad, ly + Math.sin(t) * rad);
      p.arc(lx, ly, rad, t, Math.min(end, t + len));
      t += len + (1.5 + r() * 4) / rad;
    }
  }
  g.lineCap = "round";
  g.strokeStyle = "rgba(14,16,6,.5)";
  g.lineWidth = Math.max(0.55, R * 0.018);
  g.stroke(p);
  // croisées : arcs parallèles au bord, seulement dans le croissant le plus sombre
  const q = new Path2D();
  const b = back + (r() - 0.5) * 0.4;
  for (let rad = R * (0.62 + r() * 0.08); rad < R * 1.02; rad += step * (1 + r() * 0.5)) {
    const span = 0.35 + ((rad - R * 0.6) / (R * 0.4)) * 0.45;
    let t = b - span;
    while (t < b + span) {
      const len = (R * (0.15 + r() * 0.3)) / rad;
      q.moveTo(cx + Math.cos(t) * rad, cy + Math.sin(t) * rad);
      q.arc(cx, cy, rad, t, Math.min(b + span, t + len));
      t += len + (2 + r() * 5) / rad;
    }
  }
  g.strokeStyle = "rgba(14,16,6,.36)";
  g.stroke(q);
}

/** Touffes de feuilles à la plume : petits « c » et « 3 » bombés vers la lumière (haut à gauche), clairs ou sombres selon leur place. */
function leafMarks(g: CanvasRenderingContext2D, r: Rng, cx: number, cy: number, R: number, light: string, line: string) {
  const lit = new Path2D();
  const shade = new Path2D();
  const n = Math.round(R / 3.2);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.15 + Math.sqrt(r()) * 0.7);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const s = 1.4 + r() * (R / 22);
    const p = -(Math.cos(a) + Math.sin(a)) * (d / R) > 0.05 ? lit : shade;
    // arc tourné vers le haut à gauche ; « 3 » : deux arcs l'un sous l'autre
    const a0 = Math.PI * (0.85 + (r() - 0.5) * 0.2);
    const k = r() < 0.4 ? 2 : 1;
    for (let j = 0; j < k; j++) {
      const ox = x + j * s * 0.9;
      const oy = y + j * s * 1.1;
      p.moveTo(ox + Math.cos(a0) * s, oy + Math.sin(a0) * s);
      p.arc(ox, oy, s, a0, a0 + Math.PI * 0.85);
    }
  }
  g.lineCap = "round";
  g.lineWidth = Math.max(0.7, R * 0.02);
  g.strokeStyle = tint(light, 0.05, 0.6);
  g.stroke(lit);
  g.strokeStyle = tint(line, 0, 0.55);
  g.stroke(shade);
}
/** Couleurs d'une ramure à partir de sa teinte. */
function crownColors(base: string) {
  return {
    light: mixColor(base, "#f1e4b0", 0.42),
    dark: mixColor(base, "#14180c", 0.45),
    line: mixColor(base, "#14180c", 0.66),
  };
}

/** Feuillu vu d'en haut : ramure en lobes, modelé décentré, croissant clair, touffes, hachures courbes. */
function leafy(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, base: string): Pt[][] {
  const { light, dark, line } = crownColors(base);
  const bumps = Math.max(6, Math.round(R / 6.5)) + Math.floor(r() * 3);
  const outer = scallop(r, cx, cy, R, bumps);
  const shape = shapeOf(outer);
  g.fillStyle = base;
  g.fill(shape.path);
  g.save();
  g.clip(shape.path);
  const grad = g.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.08, cx - R * 0.15, cy - R * 0.2, R * 1.4);
  // les grandes ramures restent dans la masse : moins de lumière, sinon elles sautent aux yeux
  grad.addColorStop(0, tint(light, 0, R > 40 ? 0.28 : 0.5));
  grad.addColorStop(0.38, tint(base, 0, 0));
  grad.addColorStop(0.72, tint(dark, 0, 0.45));
  grad.addColorStop(1, tint(dark, 0, 0.95));
  g.fillStyle = grad;
  g.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
  // touffes, les plus sombres d'abord : celles du haut à gauche passent devant
  const k = 3 + Math.round(R / 8) + Math.floor(r() * 3);
  const list = Array.from({ length: k }, () => {
    const a = r() * Math.PI * 2;
    const d = R * (0.12 + r() * 0.48);
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, cr: R * (R > 40 ? 0.18 + r() * 0.12 : 0.24 + r() * 0.16), lit: (-(Math.cos(a) + Math.sin(a)) / Math.SQRT2) * (d / (R * 0.6)) };
  }).sort((a, b) => a.lit - b.lit);
  for (const c of list) clump(g, r, c.x, c.y, c.cr, c.lit, base, light, dark, line);
  // croissant clair le long du bord éclairé
  g.strokeStyle = tint(light, 0.03, 0.5);
  g.lineCap = "round";
  g.lineWidth = R * 0.13;
  g.beginPath();
  g.arc(cx + R * 0.05, cy + R * 0.07, R * 0.84, Math.PI * 1.02, Math.PI * 1.5);
  g.stroke();
  leafMarks(g, r, cx, cy, R, light, line);
  crownHatch(g, r, cx, cy, R);
  g.restore();
  inkPolyline(g, outer, r, { closed: true, width: 1.3, wobble: 0.25, pressure: 0.4, color: line });
  return [outer];
}

/** Conifère vu d'en haut : étages d'aiguilles en étoile, facettes éclairées selon leur face, nervures. */
function conifer(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, base: string): Pt[][] {
  const shades = [mixColor(base, "#e9e2b8", 0.3), base, mixColor(base, INK, 0.32), mixColor(base, INK, 0.58)];
  const { line } = crownColors(base);
  const n = 13 + Math.floor(r() * 7) + Math.round(R / 20);
  let outer: Pt[] = [];
  const rot0 = r() * Math.PI;
  for (const [L, off, depth] of [[R, 0, 0.78], [R * 0.7, 0.5, 0.72], [R * 0.4, 0.25, 0.64]] as const) {
    const pts: Pt[] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot0 + ((i + off * 2) * Math.PI) / n + (r() - 0.5) * 0.08;
      const rad = i % 2 === 0 ? L * (0.9 + r() * 0.12) : L * (depth + r() * 0.06);
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    if (!outer.length) outer = pts;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      let nx = q[1] - p[1];
      let ny = -(q[0] - p[0]);
      const mx = (p[0] + q[0]) / 2 - cx;
      const my = (p[1] + q[1]) / 2 - cy;
      if (nx * mx + ny * my < 0) {
        nx = -nx;
        ny = -ny;
      }
      const l = Math.hypot(nx, ny) || 1;
      const lit = ((nx / l) * LIGHT[0] + (ny / l) * LIGHT[1]) * 0.6 + ((mx * LIGHT[0] + my * LIGHT[1]) / (Math.hypot(mx, my) || 1)) * 0.6;
      const tone = lit > 0.42 ? 0 : lit > -0.05 ? 1 : lit > -0.5 ? 2 : 3;
      g.fillStyle = shades[tone];
      g.strokeStyle = shades[tone];
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(p[0], p[1]);
      g.lineTo(q[0], q[1]);
      g.closePath();
      g.fill();
      g.stroke();
    }
    inkPolyline(g, pts, r, { closed: true, width: L === R ? 0.95 : 0.7, wobble: 0.25, pressure: 0.4, color: tint(line, 0, L === R ? 1 : 0.75) });
  }
  g.strokeStyle = tint(line, 0, 0.55);
  g.lineWidth = 0.8;
  g.beginPath();
  for (let i = 0; i < outer.length; i += 2) {
    if (r() < 0.45) continue;
    const [px, py] = outer[i];
    g.moveTo(cx + (px - cx) * 0.15, cy + (py - cy) * 0.15);
    g.lineTo(cx + (px - cx) * 0.78, cy + (py - cy) * 0.78);
  }
  g.stroke();
  g.fillStyle = tint(line, -0.05);
  g.beginPath();
  g.arc(cx, cy, Math.max(1.5, R * 0.06), 0, Math.PI * 2);
  g.fill();
  return [outer];
}

/** Bouleau ou arbuste clair : couronne légère faite de petites touffes séparées, silhouette irrégulière. */
function birch(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, base: string, bush = false): Pt[][] {
  const out: Pt[][] = [];
  const { light, dark, line } = crownColors(base);
  const n = 6 + Math.round(R / 9) + Math.floor(r() * 3);
  const list = Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2;
    const d = R * Math.sqrt(r()) * (bush ? 0.5 : 0.62);
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, cr: R * (bush ? 0.34 + r() * 0.14 : 0.27 + r() * 0.13), lit: (-(Math.cos(a) + Math.sin(a)) / Math.SQRT2) * (d / (R * 0.6)) + 0.2 };
  }).sort((a, b) => a.lit - b.lit);
  for (const c of list) {
    out.push(clump(g, r, c.x, c.y, c.cr, c.lit, base, light, dark, line));
    if (c.lit < 0.1) {
      g.save();
      g.clip(shapeOf(scallop(rng(1, Math.round(c.x), Math.round(c.y)), c.x, c.y, c.cr, 5)).path);
      crownHatch(g, r, c.x, c.y, c.cr);
      g.restore();
    }
  }
  if (bush) return out;
  // quelques branches blanches qui percent
  g.strokeStyle = "rgba(240,236,220,.8)";
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2;
    g.moveTo(cx + Math.cos(a) * R * 0.15, cy + Math.sin(a) * R * 0.15);
    g.lineTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45);
  }
  g.stroke();
  return out;
}

/**
 * Arbre mort vu d'en haut, à l'échelle d'un vrai arbre (`R` : rayon de la ramure nue, trois quarts de case environ) :
 * une silhouette d'encre presque noire, quatre à six maîtresses branches qui partent du tronc et se ramifient trois
 * fois (fourches inégales, rameaux de côté), de plus en plus fines jusqu'aux brindilles ; un fil de lumière sur le dessus
 * des grosses branches ; l'ombre portée des branches au sol, longue et nette (l'arbre est haut) ; le tronc cassé au milieu.
 */
function deadTree(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, bark: string) {
  const wood = mixColor(mixColor(bark, INK, 0.45), "#6d675c", 0.25);
  const strokes: { pts: Pt[]; wd: number; len: number }[] = [];
  const branch = (x: number, y: number, a: number, len: number, wd: number, depth: number) => {
    // tronçon coudé une ou deux fois
    const bend = (r() - 0.5) * 0.6;
    const mx = x + Math.cos(a + bend) * len * 0.5;
    const my = y + Math.sin(a + bend) * len * 0.5;
    const ex = mx + Math.cos(a - bend * 0.7) * len * 0.5;
    const ey = my + Math.sin(a - bend * 0.7) * len * 0.5;
    strokes.push({ pts: [[x, y], [mx, my], [ex, ey]], wd, len });
    if (depth <= 0 || wd < 0.5) return;
    const ang = a - bend * 0.7;
    // fourche inégale : une branche maîtresse continue, l'autre s'écarte plus court
    const spread = 0.3 + r() * 0.35;
    const side = r() < 0.5 ? -1 : 1;
    branch(ex, ey, ang + side * spread * 0.5 + (r() - 0.5) * 0.2, len * (0.62 + r() * 0.15), wd * 0.66, depth - 1);
    branch(ex, ey, ang - side * spread * 1.2 + (r() - 0.5) * 0.3, len * (0.42 + r() * 0.2), wd * 0.55, depth - 1);
    // rameau de côté au milieu du tronçon
    if (r() < 0.55) branch(mx, my, a + (r() < 0.5 ? -1 : 1) * (0.8 + r() * 0.5), len * (0.3 + r() * 0.15), wd * 0.45, Math.min(1, depth - 1));
  };
  const k = 4 + Math.floor(r() * 3);
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < k; i++) branch(cx, cy, a0 + (i / k) * Math.PI * 2 + (r() - 0.5) * 0.8, R * (0.3 + r() * 0.14), Math.max(2.4, R * (0.09 + r() * 0.035)), 3);
  // ombre nette, longue, puis encre, puis le cœur du bois à peine plus clair (la silhouette reste noire)
  const sh = R * 1.05;
  const shadow = new Path2D();
  for (const s of strokes) {
    const [p0, p1, p2] = s.pts.map(([u, v]) => [u + SUN[0] * sh, v + SUN[1] * sh] as Pt);
    shadow.moveTo(p0[0], p0[1]);
    shadow.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
  }
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(14,9,5,.32)";
  g.lineWidth = 1.6;
  g.stroke(shadow);
  g.restore();
  for (const s of strokes) if (s.wd > 1.5) inkPolyline(g, s.pts.map(([u, v]) => [u + SUN[0] * sh, v + SUN[1] * sh] as Pt), r, { width: s.wd * 0.9, wobble: 0.2, taper: s.len * 0.7, color: "rgba(14,9,5,.3)" });
  for (const s of strokes) inkPolyline(g, s.pts, r, { width: s.wd + 1.1, wobble: 0.25, taper: s.len * 0.7, color: INK });
  for (const s of strokes) if (s.wd > 1.6) inkPolyline(g, s.pts, r, { width: s.wd * 0.45, wobble: 0.2, taper: s.len * 0.6, color: wood });
  // lumière sur le dessus des grosses branches (côté nord-ouest)
  for (const s of strokes) if (s.wd > 2.4) inkPolyline(g, s.pts.map(([u, v]) => [u - s.wd * 0.2, v - s.wd * 0.24] as Pt), r, { width: s.wd * 0.22, wobble: 0.2, taper: s.len * 0.6, color: "rgba(226,216,192,.4)" });
  const knot = smoothPoints(blobPoints(r, cx, cy, R * 0.11 + 1.5, R * 0.1 + 1.4, 8, 0.2));
  g.fillStyle = mixColor(wood, "#d8ccb0", 0.35);
  g.fill(shapeOf(knot).path);
  // tronc cassé : bois clair, cernes
  g.strokeStyle = tint(INK, 0, 0.45);
  g.lineWidth = 0.6;
  g.beginPath();
  g.ellipse(cx - 0.5, cy - 0.5, R * 0.05, R * 0.045, 0, 0, Math.PI * 2);
  g.stroke();
  inkPolyline(g, knot, r, { closed: true, width: 1.2, wobble: 0.15 });
}

/**
 * Vieux chêne repère vu d'en haut : un houppier fait de cinq à sept lobes autour d'un lobe central, chacun modelé comme
 * un feuillu (les lobes du sud-est d'abord, ceux du nord-ouest, éclairés, devant, le cœur en dernier) ; un contour
 * d'encre épais autour de l'ensemble. Renvoie la silhouette (un cercle par lobe).
 */
function oak(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, base: string): Pt[][] {
  const n = 5 + Math.floor(r() * 3);
  const a0 = r() * Math.PI * 2;
  const lobes: { x: number; y: number; R: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const d = R * (0.4 + r() * 0.14);
    lobes.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, R: R * (0.4 + r() * 0.14) });
  }
  lobes.sort((p, q) => q.x + q.y - (p.x + p.y));
  lobes.push({ x: cx - R * 0.06 + (r() - 0.5) * R * 0.1, y: cy - R * 0.06 + (r() - 0.5) * R * 0.1, R: R * (0.48 + r() * 0.06) });
  const rings = lobes.map((l) => Array.from({ length: 18 }, (_, k) => [l.x + Math.cos((k / 18) * Math.PI * 2) * l.R * 0.97, l.y + Math.sin((k / 18) * Math.PI * 2) * l.R * 0.97] as Pt));
  const sil = shapeOf(rings).path;
  const { line } = crownColors(base);
  g.save();
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 5;
  g.stroke(sil);
  g.fillStyle = mixColor(base, INK, 0.35);
  g.fill(sil, "nonzero");
  g.restore();
  for (const l of lobes) leafy(g, l.x, l.y, l.R, r, base);
  // l'ombre que le houppier jette sur lui-même, au sud-est du cœur
  g.save();
  g.clip(sil, "nonzero");
  g.globalCompositeOperation = "multiply";
  const sh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.2, cx, cy, R * 1.15);
  sh.addColorStop(0, "rgba(255,255,255,0)");
  sh.addColorStop(0.55, "rgba(150,150,120,.2)");
  sh.addColorStop(1, "rgba(30,36,22,.5)");
  g.fillStyle = sh;
  g.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
  g.restore();
  inkPolyline(g, rings[rings.length - 1], r, { closed: true, width: 1.1, wobble: 0.3, pressure: 0.5, color: tint(line, 0, 0.6) });
  return rings;
}

/** Ramures dessinées d'avance, par graine et palette : [image, silhouette, rayon de référence]. */
const treeSprites = new Map<string, Map<string, [HTMLCanvasElement, Pt[][], number]>>();

/** Tailles de référence des arbres dessinés d'avance (rayon en px) : le trait garde la même épaisseur à l'écran. */
const CLASSES = [20, 30, 46, 72];
const classOf = (R: number) => {
  let best = 0;
  for (let k = 1; k < CLASSES.length; k++) if (Math.abs(Math.log(R / CLASSES[k])) < Math.abs(Math.log(R / CLASSES[best]))) best = k;
  return best;
};

/**
 * Forêts. Sous les arbres, le sol du sous-bois, sombre, et des clairières de soleil au cœur des bois épais. Les arbres
 * sont semés dans les cases de bois (vieux arbres repères, géants, lisière le long du contour, cœur), dessinés d'avance
 * par taille et posés directement sur la planche ; leur silhouette, réduite au quart, donne la masse : ombre portée au
 * sol, contour d'encre épais autour de la lisière, bande sombre sous le bord, côté sud-est lavé et hachuré.
 */
function paintForest(c: MapCtx, w: Wild, reserved: Uint8Array) {
  const { map, theme, g, W, H, S } = c;
  if (!map.tiles.includes(T.vegetation)) return;
  const seed = map.seed;
  const PW = W * S;
  const PH = H * S;
  const isVeg = (x: number, y: number) => map.tiles[y * W + x] === T.vegetation && !reserved[y * W + x];
  const vegAt = (x: number, y: number) => {
    const cx = clamp(x, 0, W - 1);
    const cy = clamp(y, 0, H - 1);
    return map.tiles[cy * W + cx] === T.vegetation && !reserved[cy * W + cx];
  };
  const loops = wildContour(isVeg, W, H, { smooth: 3, jitter: 6, round: 2, seed: seed + 83 });
  if (!loops.length) return;
  const veg = muted(mixColor(theme.vegetation, "#77735a", 0.22), 0.12);
  const under = mixColor(mixColor(veg, INK, 0.62), "#2e2c1a", 0.3);
  const vdist = distField(isVeg, W, H);
  const bark = mixColor(theme.door, "#4a3d30", 0.62);

  // ——— Clairières ———
  // Une ou deux par massif de plus de trente cases (deux au-delà de cent quarante), là où le bois est le plus épais,
  // espacées de sept cases au moins : un disque d'une à une case et demie de rayon, sans arbre. Ce n'est que du décor :
  // les cases restent des cases de bois (praticables).
  interface Glade {
    x: number;
    y: number;
    R: number;
    pts: Pt[];
  }
  const glades: Glade[] = [];
  {
    const gn = noise2(seed + 91);
    const comp = new Int32Array(W * H).fill(-1);
    const cands: [number, number, number][][] = [];
    for (let s = 0; s < W * H; s++) {
      if (comp[s] >= 0 || !isVeg(s % W, Math.floor(s / W))) continue;
      const id = cands.length;
      const list: [number, number, number][] = [];
      const q = [s];
      comp[s] = id;
      for (let h = 0; h < q.length; h++) {
        const i = q[h];
        const x = i % W;
        const y = (i - x) / W;
        if (vdist[i] >= 2) list.push([x, y, Math.min(4, vdist[i]) * 0.5 + gn(x / 3, y / 3) * 0.6 + hash(x, y, seed + 92) * 0.4]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || comp[ny * W + nx] >= 0 || !isVeg(nx, ny)) continue;
          comp[ny * W + nx] = id;
          q.push(ny * W + nx);
        }
      }
      if (q.length > 30) cands.push(list.sort((a, b) => b[2] - a[2]).concat([[-1, q.length, 0]]));
    }
    for (const list of cands) {
      const size = list[list.length - 1][1];
      const most = size > 140 ? 2 : 1;
      let made = 0;
      for (const [x, y] of list) {
        if (x < 0 || made >= most) break;
        const cx = (x + 0.5) * S;
        const cy = (y + 0.5) * S;
        if (glades.some((q) => Math.hypot(q.x - cx, q.y - cy) < S * 7)) continue;
        const rr = rng(seed, x, y, 93);
        const R = S * (1.05 + rr() * 0.45) * Math.min(1, (vdist[y * W + x] - 0.6) / 2);
        const pts = smoothPoints(blobPoints(rr, cx, cy, R, R * (0.75 + rr() * 0.25), 15, 0.3, rr() * 3), 2);
        glades.push({ x: cx, y: cy, R, pts });
        made++;
      }
    }
  }
  /** Le point est-il dans le cœur dégagé d'une clairière (marge `pad` en px) ? */
  const inGlade = (px: number, py: number, pad = 0) => glades.some((q) => Math.hypot(px - q.x, py - q.y) < q.R + pad);

  // ——— Semis des arbres ———
  const edgeN = noise2(seed + 88);
  const margin = (x: number, y: number) => {
    const cx = clamp(x, 0, W - 1);
    const cy = clamp(y, 0, H - 1);
    if (reserved[cy * W + cx]) return S * (0.1 + 0.2 * (edgeN(cx / 1.3 + 50, cy / 1.3) + 1));
    const t = map.tiles[cy * W + cx];
    // sur l'herbe, le débord varie le long de la lisière (bord qui avance et recule)
    return t === T.route || t === T.porte ? S * 0.1 : t === T.eau ? S * 0.28 : t === T.mur ? S * 0.12 : S * (0.28 + 0.2 * (edgeN(cx / 2.2, cy / 2.2) + 1));
  };
  /** Rayon maximal d'une ramure en (px, py) : elle ne déborde que d'un peu sur les cases voisines qui ne sont pas du bois. */
  const maxR = (px: number, py: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    let best = S * 2.6;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        if (vegAt(cx + dx, cy + dy) && cx + dx >= -2 && cy + dy >= -2 && cx + dx < W + 2 && cy + dy < H + 2) continue;
        const x0 = (cx + dx) * S;
        const y0 = (cy + dy) * S;
        const ex = Math.max(x0 - px, 0, px - (x0 + S));
        const ey = Math.max(y0 - py, 0, py - (y0 + S));
        best = Math.min(best, Math.hypot(ex, ey) + margin(cx + dx, cy + dy));
      }
    // une clairière n'est couverte qu'à son bord
    for (const q of glades) best = Math.min(best, Math.max(0, Math.hypot(px - q.x, py - q.y) - q.R * 0.88));
    return best;
  };
  const species = noise2(seed + 81);
  const hueN = noise2(seed + 85);
  const gapN = noise2(seed + 87);
  const insetN = noise2(seed + 89);
  /** Échancrures de la lisière : là où ce bruit est bas, les cases du bord restent dégarnies. */
  const bite = (px: number, py: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    return cx >= 0 && cy >= 0 && cx < W && cy < H && vdist[cy * W + cx] === 1 && edgeN(px / S / 1.6 + 17, py / S / 1.6) < -0.25;
  };
  const trees: Tree[] = [];
  const buckets = new Map<number, Tree[]>();
  const key = (cx: number, cy: number) => (cy + 8) * (W + 16) + cx + 8;
  const fits = (px: number, py: number, R: number, k: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++)
        for (const t of buckets.get(key(cx + dx, cy + dy)) ?? []) if (Math.hypot(t.x - px, t.y - py) < (t.R + R) * k) return false;
    return true;
  };
  const add = (t: Tree) => {
    trees.push(t);
    const k = key(Math.floor(t.x / S), Math.floor(t.y / S));
    const list = buckets.get(k);
    if (list) list.push(t);
    else buckets.set(k, [t]);
  };
  // essences mêlées selon un bruit lent : des conifères parmi les feuillus, plus nombreux par endroits
  const kindAt = (px: number, py: number, rr: Rng) => {
    const n = species(px / S / 7, py / S / 7);
    if (rr() < smoothstep(-0.45, 0.4, n) * 0.75 + 0.04) return 1;
    return rr() < 0.05 + Math.max(0, hueN(px / S / 5 + 9, py / S / 5)) * 0.35 ? 2 : 0;
  };
  const hueAt = (px: number, py: number, rr: Rng) => clamp(Math.floor((hueN(px / S / 6, py / S / 6) + 1) * 1.6 + (rr() - 0.5) * 0.6), 0, 2);
  const tree = (px: number, py: number, R: number, rr: Rng, kind = kindAt(px, py, rr)): Tree => ({
    x: px,
    y: py,
    R,
    kind,
    hue: hueAt(px, py, rr),
    edge: false,
    rot: (rr() - 0.5) * 0.7,
    v: Math.floor(rr() * 4),
  });
  const inVeg = (px: number, py: number) => vegAt(Math.floor(px / S), Math.floor(py / S));
  // Massifs : composantes de cases de bois (taille de chacune, pour chaque case).
  const massOf = new Int32Array(W * H).fill(-1);
  const massSize: number[] = [];
  for (let s0 = 0; s0 < W * H; s0++) {
    if (massOf[s0] >= 0 || !isVeg(s0 % W, Math.floor(s0 / W))) continue;
    const id = massSize.length;
    const q = [s0];
    massOf[s0] = id;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      const x = i % W;
      const y = (i - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || massOf[ny * W + nx] >= 0 || !isVeg(nx, ny)) continue;
        massOf[ny * W + nx] = id;
        q.push(ny * W + nx);
      }
    }
    massSize.push(q.length);
  }
  // 1. Vieux chênes repères : un par massif de plus de trente cases, deux au-delà de cent quarante, deux cases et demie
  // à trois de diamètre, là où le bois est le plus épais, à six cases au moins l'un de l'autre.
  {
    const cands: [number, number][][] = massSize.map(() => []);
    for (let i = 0; i < W * H; i++) {
      if (massOf[i] < 0 || massSize[massOf[i]] < 30 || vdist[i] < 2) continue;
      const x = i % W;
      const y = (i - x) / W;
      cands[massOf[i]].push([i, Math.min(5, vdist[i]) + hash(x, y, seed + 96) * 1.6]);
    }
    const spots: Pt[] = [];
    cands.forEach((list, m) => {
      list.sort((p, q) => q[1] - p[1]);
      let made = 0;
      for (const [i] of list) {
        if (made >= (massSize[m] > 140 ? 2 : 1)) break;
        const x = i % W;
        const y = (i - x) / W;
        const rr = rng(seed, x, y, 97);
        const px = (x + 0.3 + rr() * 0.4) * S;
        const py = (y + 0.3 + rr() * 0.4) * S;
        if (spots.some(([u, v]) => Math.hypot(u - px, v - py) < S * 6) || inGlade(px, py, S * 1.2)) continue;
        const R = Math.min(S * (1.25 + rr() * 0.25), maxR(px, py) + S * 0.35);
        if (R < S * 1.05) continue;
        const t = tree(px, py, R, rr, 0);
        t.hue = 3 + ((spots.length + Math.floor(hash(seed, 5, 95) * 3)) % 3);
        t.big = true;
        t.rot = (rr() - 0.5) * 0.3;
        add(t);
        spots.push([px, py]);
        made++;
      }
    });
  }
  // 2. quelques grands arbres de trois cases au cœur des bois
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isVeg(x, y) || vdist[y * W + x] < 3) continue;
      const rr = rng(seed, x, y, 34);
      if (rr() > 0.035) continue;
      const px = (x + 0.2 + rr() * 0.6) * S;
      const py = (y + 0.2 + rr() * 0.6) * S;
      const R = Math.min(S * (0.95 + rr() * 0.3), maxR(px, py));
      if (R < S * 0.9 || !fits(px, py, R, 0.85)) continue;
      const big = tree(px, py, R, rr, rr() < 0.2 ? 1 : 0);
      // un géant reste dans la teinte de la masse (jamais le plus clair)
      big.hue = Math.max(1, big.hue);
      add(big);
    }
  // 3. cœur des bois : beaucoup de petits et de moyens, quelques grands ; des trouées laissent voir le sol sombre
  const inGap = (px: number, py: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    return gapN(px / S / 3.2, py / S / 3.2) > 0.66 && cx >= 0 && cy >= 0 && cx < W && cy < H && vdist[cy * W + cx] >= 2;
  };
  const interior = (pass: number, tries: number, k: number) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!isVeg(x, y)) continue;
        for (let j = 0; j < tries; j++) {
          const rr = rng(seed, x, y, 36 + pass * 4 + j);
          const px = (x + rr()) * S;
          const py = (y + rr()) * S;
          if (inGap(px, py) || bite(px, py) || inGlade(px, py, S * 0.1)) continue;
          const u = rr();
          let R = pass ? S * (0.3 + rr() * 0.2) : u < 0.3 ? S * (0.38 + rr() * 0.22) : u < 0.72 ? S * (0.6 + rr() * 0.32) : u < 0.94 ? S * (0.92 + rr() * 0.35) : S * (1.25 + rr() * 0.4);
          R = Math.min(R, maxR(px, py));
          if (R < S * 0.26 || !fits(px, py, R, k)) continue;
          add(tree(px, py, R, rr));
        }
      }
  };
  interior(0, 3, 0.62);
  // 4. lisière : des arbres de toutes tailles comblent le bord le long d'un contour arrondi, plus ou moins enfoncés
  // (bord festonné, jamais droit) ; au sud, les plus petits laissent voir leur tronc
  const edgeLoops = wildContour(isVeg, W, H, { smooth: 3, jitter: 11, round: 4, seed: seed + 86 });
  for (const loop of edgeLoops) {
    let acc = 0;
    for (let i = 0; i < loop.length; i++) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      const seg = Math.hypot(q[0] - p[0], q[1] - p[1]);
      acc += seg;
      if (acc < S * 0.38) continue;
      acc = 0;
      const tx = (q[0] - p[0]) / (seg || 1);
      const ty = (q[1] - p[1]) / (seg || 1);
      const nx = -ty;
      const ny = tx;
      const rr = rng(seed, Math.round(p[0]), Math.round(p[1]), 35);
      // le bord avance (gros arbres poussés vers l'extérieur) ou recule, selon le même bruit que le débord permis
      const e = edgeN(p[0] / S / 2.2, p[1] / S / 2.2);
      let R = S * (0.32 + rr() * rr() * 0.55 + Math.max(0, e) * 0.35);
      const ins = R * (0.25 + rr() * 0.4) + insetN(p[0] / S / 2, p[1] / S / 2) * S * 0.2 - e * S * 0.28;
      const px = p[0] + nx * ins;
      const py = p[1] + ny * ins;
      if (px < -S || py < -S || px > PW + S || py > PH + S || !inVeg(px, py) || bite(px, py)) continue;
      R = Math.min(R, maxR(px, py));
      if (R < S * 0.26 || !fits(px, py, R, 0.5)) continue;
      const southward = ny < -0.35;
      // arbre mort, buisson bas ou arbre ; au sud, on voit le tronc et les racines sous la ramure
      const t = tree(px, py, R, rr, southward && rr() < 0.06 ? 3 : R < S * 0.5 && rr() < 0.75 ? 4 : undefined);
      t.edge = southward && t.kind < 3 && R < S * 0.95 && rr() < 0.85;
      add(t);
    }
  }
  // 5. bouche-trous
  interior(1, 3, 0.72);
  // Au bord nord d'une clairière, on voit aussi les troncs ; quelques chicots morts percent la canopée.
  for (const t of trees) if (t.kind < 3 && !t.edge && inGlade(t.x, t.y + t.R * 1.05, -S * 0.1) && !inGlade(t.x, t.y)) t.edge = true;
  {
    let snags = 0;
    for (const t of trees) {
      if (snags >= 1 + Math.floor(trees.length / 260) || t.kind !== 0 || t.R > S * 0.7 || t.big) continue;
      const cx = Math.floor(t.x / S);
      const cy = Math.floor(t.y / S);
      if (cx < 0 || cy < 0 || cx >= W || cy >= H || vdist[cy * W + cx] < 2 || hash(cx, cy, seed + 98) > 0.06) continue;
      t.kind = 3;
      snags++;
    }
  }
  trees.sort((a, b) => a.R - b.R || a.y - b.y);

  // ——— Ramures dessinées d'avance ———
  // trois premières : la masse ; puis les vieux arbres repères (moutarde, rouille, vert bleuté)
  const hues = [mixColor(veg, "#9a8f45", 0.28), veg, mixColor(veg, "#2f4836", 0.32), mixColor(veg, "#33502a", 0.45), mixColor(veg, "#4d6230", 0.4), mixColor(veg, "#2a4436", 0.5)];
  const conHues = [mixColor(veg, "#1d3a32", 0.45), mixColor(veg, "#2a3824", 0.5)];
  // bouleaux : un vert tendre, jamais jaune pâle (une tache claire dans la masse se lit comme une faute)
  const birHues = [mixColor(veg, "#7f9a48", 0.32), mixColor(veg, "#8e9c52", 0.26)];
  const bushHues = [mixColor(veg, "#26331c", 0.32), mixColor(veg, "#4a4a26", 0.3)];
  // ramures gardées d'un rendu à l'autre pour la même graine et la même palette (la carte redessinée les retrouve)
  const cacheKey = `${seed}|${theme.vegetation}|${theme.floor}`;
  let sprites = treeSprites.get(cacheKey);
  if (!sprites) {
    if (treeSprites.size >= 4) treeSprites.clear();
    sprites = new Map();
    treeSprites.set(cacheKey, sprites);
  }
  const spriteOf = (t: Tree): [HTMLCanvasElement, Pt[][], number] => {
    const cls = classOf(t.R);
    const v = t.v % (cls >= 3 ? 2 : 3);
    const hue = t.kind === 0 ? t.hue : t.hue % 2;
    // un vieil arbre repère est dessiné à sa vraie taille, à part
    const id = t.big ? `big:${Math.round(t.x)}:${Math.round(t.y)}` : `${t.kind}:${hue}:${cls}:${v}`;
    const R0 = t.big ? t.R : CLASSES[cls];
    let sp = sprites.get(id);
    if (!sp) {
      const half = Math.ceil(R0 * 1.12 + 4);
      const cv = canvas(half * 2, half * 2);
      const sg = cv.getContext("2d")!;
      const rr = t.big ? rng(seed, Math.round(t.x), Math.round(t.y), 99) : rng(seed, t.kind * 10 + hue, cls, v, 90);
      const outline = t.big ? oak(sg, half, half, R0, rr, hues[t.hue]) : t.kind === 1 ? conifer(sg, half, half, R0, rr, conHues[hue]) : t.kind === 2 ? birch(sg, half, half, R0, rr, birHues[hue]) : t.kind === 4 ? birch(sg, half, half, R0, rr, bushHues[hue], true) : leafy(sg, half, half, R0, rr, hues[hue]);
      sp = [cv, outline.map((l) => l.map(([x, y]) => [x - half, y - half] as Pt)), R0];
      sprites.set(id, sp);
    }
    return sp;
  };
  const crownY = (t: Tree) => (t.edge ? t.y - t.R * 0.36 : t.y);
  // Silhouettes : toutes pour la masse (ombre, masques), celles du bord seulement pour le contour d'encre épais.
  const outline = new Path2D();
  const rimOutline = new Path2D();
  const massOutline = new Path2D();
  const nearOpen = (t: Tree) => {
    const cx = clamp(Math.floor(t.x / S), 0, W - 1);
    const cy = clamp(Math.floor(t.y / S), 0, H - 1);
    return vdist[cy * W + cx] <= 1 || t.R > S * 0.9 || inGlade(t.x, t.y, t.R + S * 0.3) || inGap(t.x, t.y + S * 0.6) || inGap(t.x + S * 0.6, t.y);
  };
  for (const t of trees) {
    if (t.kind === 3) continue;
    const [, loops, R0] = spriteOf(t);
    const s = t.R / R0;
    const ty = crownY(t);
    const ca = Math.cos(t.rot) * s;
    const sa = Math.sin(t.rot) * s;
    const rimToo = nearOpen(t);
    const tc = clamp(Math.floor(t.y / S), 0, H - 1) * W + clamp(Math.floor(t.x / S), 0, W - 1);
    const inMass = massOf[tc] >= 0 && massSize[massOf[tc]] >= 12;
    for (const loop of loops) {
      // un point sur deux suffit à la silhouette (ombre, masques, contour épais)
      loop.forEach(([x, y], i) => {
        if (i % 2) return;
        const px = t.x + x * ca - y * sa;
        const py = ty + x * sa + y * ca;
        if (i) {
          outline.lineTo(px, py);
          if (rimToo) rimOutline.lineTo(px, py);
        } else {
          outline.moveTo(px, py);
          if (rimToo) rimOutline.moveTo(px, py);
        }
      });
      outline.closePath();
      if (rimToo) rimOutline.closePath();
    }
    if (inMass) for (const loop of loops) massOutline.addPath(shapeOf(loop.filter((_, i) => i % 2 === 0).map(([x, y]) => [t.x + x * ca - y * sa, ty + x * sa + y * ca] as Pt)).path);
  }
  // ——— Reflets ———
  // Les arbres à moins d'une case de la berge se reflètent : leur silhouette retournée sous le pied, tassée, floue
  // (dessinée au quart puis agrandie), vert-bleu sombre à un quart d'opacité, découpée par l'eau.
  if (w.water) {
    const toWater = distField((x, y) => map.tiles[y * W + x] !== T.eau, W, H);
    const refl = new Path2D();
    for (const t of trees) {
      if (t.kind === 3) continue;
      const cx = clamp(Math.floor(t.x / S), 0, W - 1);
      const cy = clamp(Math.floor(t.y / S), 0, H - 1);
      if (toWater[cy * W + cx] > Math.ceil(t.R / S) + 1) continue;
      const [, loops, R0] = spriteOf(t);
      const s = t.R / R0;
      const ca = Math.cos(t.rot) * s;
      const sa = Math.sin(t.rot) * s;
      const foot = t.y + t.R * 0.9;
      for (const loop of loops)
        loop.forEach(([x, y], i) => {
          if (i % 2) return;
          const px = t.x + x * ca - y * sa;
          const py = t.y + x * sa + y * ca;
          const ry = foot + (foot - py) * 0.7;
          if (i) refl.lineTo(px, ry);
          else refl.moveTo(px, ry);
        });
    }
    const Q = 4;
    const lo = canvas(Math.ceil(PW / Q), Math.ceil(PH / Q));
    const lc = lo.getContext("2d")!;
    lc.filter = "blur(1.5px)";
    lc.setTransform(1 / Q, 0, 0, 1 / Q, 0, 0);
    lc.fillStyle = "#0c2622";
    lc.fill(refl, "nonzero");
    g.save();
    g.clip(w.water.path, "nonzero");
    g.globalAlpha = 0.28;
    g.globalCompositeOperation = "multiply";
    g.imageSmoothingEnabled = true;
    g.drawImage(lo, 0, 0, lo.width * Q, lo.height * Q);
    g.restore();
  }

  // ——— Sol du sous-bois ———
  // Sous la ramure, un sol sombre (on le voit entre les couronnes), plus noir au cœur des bois. Hors des couronnes,
  // c'est l'herbe de la lisière qu'on voit.
  g.fillStyle = under;
  g.fill(outline, "nonzero");
  const inner = wildContour((x, y) => vdist[y * W + x] >= 2, W, H, { smooth: 3, jitter: 10, round: 3, seed: seed + 82 });
  if (inner.length) wildWash(g, shapeOf(inner), under, w, { alpha: 0.92, edge: 0, variation: 0.8, tex: 0 });
  const deep = wildContour((x, y) => vdist[y * W + x] >= 3, W, H, { smooth: 2, jitter: 8, round: 3, seed: seed + 84 });
  if (deep.length) {
    g.fillStyle = "rgba(10,14,6,.2)";
    g.fill(shapeOf(deep).path, "nonzero");
  }
  // fougères et ronces du sous-bois, là où la ramure laisse voir le sol
  const brush = new Path2D();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (vdist[y * W + x] < 2) continue;
      const rr = rng(seed, x, y, 33);
      for (let k = 0; k < 2; k++) {
        const px = (x + rr()) * S;
        const py = (y + rr()) * S;
        const a = rr() * Math.PI * 2;
        const n = 3 + Math.floor(rr() * 3);
        const l = 4 + rr() * 6;
        for (let j = 0; j < n; j++) {
          const b = a + (j - (n - 1) / 2) * (0.3 + rr() * 0.15);
          brush.moveTo(px, py);
          brush.lineTo(px + Math.cos(b) * l, py + Math.sin(b) * l);
        }
      }
    }
  g.strokeStyle = "rgba(160,172,110,.3)";
  g.lineWidth = 0.9;
  g.stroke(brush);
  const gladeGrass = mixColor(mixColor(w.grass, theme.vegetation, 0.3), "#b8b070", 0.18);
  const fernCol = muted(mixColor(theme.vegetation, "#56703a", 0.4), 0.15);
  // Trouées : la lumière tombe par taches, des fougères y poussent, un tronc pourrit de loin en loin.
  {
    const ferns = fernBatch();
    const sun = new Path2D();
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const px = (x + 0.5) * S;
        const py = (y + 0.5) * S;
        if (!isVeg(x, y) || !inGap(px, py)) continue;
        const rr = rng(seed, x, y, 38);
        const sx = px + (rr() - 0.5) * S * 0.5;
        const sy = py + (rr() - 0.5) * S * 0.5;
        const sr = S * (0.2 + rr() * 0.22);
        sun.moveTo(sx + sr, sy);
        sun.ellipse(sx, sy, sr, sr * 0.75, rr() * 3, 0, Math.PI * 2);
        for (let k = 0; k < 2; k++) ferns.add(rr, px + (rr() - 0.5) * S * 0.8, py + (rr() - 0.5) * S * 0.8, S * (0.16 + rr() * 0.14));
        if (rr() < 0.08) log(g, rr, px, py, S * (0.7 + rr() * 0.5), S * 0.08, rr() * Math.PI, bark);
      }
    g.fillStyle = tint(gladeGrass, 0, 0.35);
    g.fill(sun);
    ferns.draw(g, fernCol);
  }
  // Clairières : herbe fraîche au soleil, feuilles mortes, fougères au bord, une souche ou un tronc couché.
  glades.forEach((q, i) => {
    const rr = rng(seed, i, 94);
    const sh = shapeOf(q.pts);
    wildWash(g, sh, gladeGrass, w, { alpha: 0.9, edge: 3, variation: 0.9, tex: 1 });
    stipple(g, sh, rr, { density: 1.2, radius: 0.8, color: "rgba(120,84,40,.45)" });
    const tufts = new Path2D();
    for (let k = 0; k < Math.round(q.R / 3); k++) {
      const a = rr() * Math.PI * 2;
      const d = Math.sqrt(rr()) * q.R * 0.85;
      const x = q.x + Math.cos(a) * d;
      const y = q.y + Math.sin(a) * d * 0.8;
      const n = 2 + Math.floor(rr() * 4);
      const lean = (rr() - 0.5) * 0.9;
      for (let j = 0; j < n; j++) {
        const b = -Math.PI / 2 + lean + (j - (n - 1) / 2) * (0.25 + rr() * 0.25);
        const l = 3 + rr() * 6;
        tufts.moveTo(x + j, y);
        tufts.quadraticCurveTo(x + j + Math.cos(b) * l * 0.4, y + Math.sin(b) * l * 0.6, x + j + Math.cos(b) * l, y + Math.sin(b) * l);
      }
    }
    g.lineCap = "round";
    g.strokeStyle = tint(mixColor(gladeGrass, INK, 0.6), 0, 0.6);
    g.lineWidth = 0.9;
    g.stroke(tufts);
    for (let k = 0; k < 4; k++) {
      const a = rr() * Math.PI * 2;
      fern(g, rr, q.x + Math.cos(a) * q.R * 0.85, q.y + Math.sin(a) * q.R * 0.7, S * (0.2 + rr() * 0.15), fernCol);
    }
    const a = rr() * Math.PI;
    if (rr() < 0.55) log(g, rr, q.x + (rr() - 0.5) * q.R * 0.5, q.y + (rr() - 0.5) * q.R * 0.4, Math.min(q.R * 1.3, S * 1.4), S * (0.09 + rr() * 0.04), a, bark);
    else stump(g, rr, q.x + (rr() - 0.5) * q.R * 0.4, q.y + (rr() - 0.5) * q.R * 0.4, S * 0.17, bark);
    gladeLight(g, q.x, q.y, Math.min(S, q.R));
  });


  // Lisière : une bande de sous-bois qui déborde des ramures des grands massifs (pas autour des arbres isolés). Sa
  // largeur suit un bruit le long du bord, d'un cinquième à quatre cinquièmes de case ; elle s'interrompt par endroits
  // (l'herbe entre sous les arbres) ; plus large et presque noire côté ombre (sud-est), plus claire côté soleil.
  {
    const Q = 4;
    const qw = Math.ceil(PW / Q);
    const qh = Math.ceil(PH / Q);
    const mc = canvas(qw, qh);
    const mg = mc.getContext("2d", { willReadFrequently: true })!;
    mg.setTransform(1 / Q, 0, 0, 1 / Q, 0, 0);
    mg.fill(massOutline, "nonzero");
    const src = mg.getImageData(0, 0, qw, qh).data;
    const CAP = Math.ceil((S * 1.15) / Q);
    const D = new Float32Array(qw * qh);
    for (let i = 0; i < qw * qh; i++) D[i] = src[i * 4 + 3] > 127 ? 0 : CAP;
    // distance au massif (chanfrein, deux passes)
    for (let y = 0; y < qh; y++)
      for (let x = 0; x < qw; x++) {
        const i = y * qw + x;
        if (!D[i]) continue;
        let v = D[i];
        if (x > 0) v = Math.min(v, D[i - 1] + 1);
        if (y > 0) {
          v = Math.min(v, D[i - qw] + 1);
          if (x > 0) v = Math.min(v, D[i - qw - 1] + 1.414);
          if (x < qw - 1) v = Math.min(v, D[i - qw + 1] + 1.414);
        }
        D[i] = v;
      }
    for (let y = qh - 1; y >= 0; y--)
      for (let x = qw - 1; x >= 0; x--) {
        const i = y * qw + x;
        if (!D[i]) continue;
        let v = D[i];
        if (x < qw - 1) v = Math.min(v, D[i + 1] + 1);
        if (y < qh - 1) {
          v = Math.min(v, D[i + qw] + 1);
          if (x < qw - 1) v = Math.min(v, D[i + qw + 1] + 1.414);
          if (x > 0) v = Math.min(v, D[i + qw - 1] + 1.414);
        }
        D[i] = v;
      }
    const bw = noise2(seed + 77);
    const bc = canvas(qw, qh);
    const bg = bc.getContext("2d")!;
    const img = bg.createImageData(qw, qh);
    const [ur, ug, ub] = hexRgb(mixColor(under, "#3a4424", 0.25));
    const [kr, kg, kb] = hexRgb("#0b1008");
    for (let y = 1; y < qh - 1; y++)
      for (let x = 1; x < qw - 1; x++) {
        const i = y * qw + x;
        const d = D[i] * Q;
        if (d <= 0 || d >= CAP * Q) continue;
        const u = (x * Q) / S;
        const v = (y * Q) / S;
        const n = bw(u / 1.6, v / 1.6) * 0.75 + bw(u / 0.6 + 20, v / 0.6) * 0.25;
        // trouée : l'herbe vient jusqu'aux troncs
        if (n < -0.42) continue;
        const gx = D[i + 1] - D[i - 1];
        const gy = D[i + qw] - D[i - qw];
        const gl = Math.hypot(gx, gy) || 1;
        const shadeK = clamp((gx * SUN[0] + gy * SUN[1]) / gl, -1, 1);
        const width = S * (0.22 + 0.62 * smoothstep(-0.42, 0.6, n)) * (1 + Math.max(0, shadeK) * 0.3 - Math.max(0, -shadeK) * 0.12);
        if (d > width) continue;
        const edge = smoothstep(width, width - 5, d);
        const k = clamp(0.35 + shadeK * 0.5 + (1 - d / width) * 0.25, 0, 1);
        img.data[i * 4] = ur + (kr - ur) * k;
        img.data[i * 4 + 1] = ug + (kg - ug) * k;
        img.data[i * 4 + 2] = ub + (kb - ub) * k;
        img.data[i * 4 + 3] = edge * (0.4 + k * 0.28) * (0.75 + 0.25 * smoothstep(-0.4, 0.5, bw(u / 3.2 + 50, v / 3.2))) * 255;
      }
    bg.putImageData(img, 0, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.drawImage(bc, 0, 0, qw * Q, qh * Q);
    g.restore();
    // buissons bas et souches dans la bande, côté ombre surtout
    const br = rng(seed, 78);
    for (const loop of edgeLoops) {
      let acc = 0;
      for (let i = 0; i < loop.length; i++) {
        const p = loop[i];
        const q = loop[(i + 1) % loop.length];
        const seg = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        acc += seg;
        if (acc < S * 0.7) continue;
        acc = 0;
        const nx = (q[1] - p[1]) / seg;
        const ny = -(q[0] - p[0]) / seg;
        const shadeK = nx * SUN[0] + ny * SUN[1];
        if (br() > 0.3 + Math.max(0, shadeK) * 0.35) continue;
        const dd = S * (0.3 + br() * 0.35);
        const x = p[0] + nx * dd;
        const y = p[1] + ny * dd;
        const cx = Math.floor(x / S);
        const cy = Math.floor(y / S);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H || map.tiles[cy * W + cx] !== T.sol || reserved[cy * W + cx]) continue;
        const ix = clamp(Math.floor(x / Q), 0, qw - 1);
        const iy = clamp(Math.floor(y / Q), 0, qh - 1);
        if (img.data[(iy * qw + ix) * 4 + 3] < 20 && D[iy * qw + ix] * Q > S * 0.5) continue;
        if (br() < 0.8) {
          const bt: Tree = { x, y, R: S * (0.2 + br() * 0.1), kind: 4, hue: br() < 0.5 ? 0 : 1, edge: false, rot: br() * 6, v: Math.floor(br() * 3) };
          const [sp, , R0] = spriteOf(bt);
          const sc = bt.R / R0;
          g.fillStyle = "rgba(10,12,6,.4)";
          g.beginPath();
          g.ellipse(x + SUN[0] * bt.R * 0.6, y + SUN[1] * bt.R * 0.6, bt.R * 0.95, bt.R * 0.85, 0, 0, Math.PI * 2);
          g.fill();
          g.save();
          g.translate(x, y);
          g.rotate(bt.rot);
          g.drawImage(sp, (-sp.width / 2) * sc, (-sp.height / 2) * sc, sp.width * sc, sp.height * sc);
          g.restore();
        } else stump(g, br, x, y, S * (0.11 + br() * 0.06), bark);
      }
    }
  }
  // Ombre portée de toute la masse : bord net, hachurée ; les vieux arbres repères, plus hauts, la jettent deux fois
  // plus loin.
  g.save();
  g.translate(SUN[0] * 26, SUN[1] * 26);
  g.fillStyle = "rgba(14,20,8,.3)";
  g.fill(outline, "nonzero");
  for (const t of trees) {
    if (!t.big) continue;
    const k = t.R * 1.3;
    g.beginPath();
    g.moveTo(t.x + t.R * 0.85, t.y);
    g.arc(t.x, t.y, t.R * 0.85, 0, Math.PI * 2);
    g.moveTo(t.x + SUN[0] * k + t.R * 0.7, t.y + SUN[1] * k);
    g.arc(t.x + SUN[0] * k, t.y + SUN[1] * k, t.R * 0.7, 0, Math.PI * 2);
    g.fill();
    g.fill(shapeOf(hull([[t.x - t.R * 0.6, t.y + t.R * 0.6], [t.x + t.R * 0.6, t.y - t.R * 0.6], [t.x + SUN[0] * k + t.R * 0.5, t.y + SUN[1] * k - t.R * 0.5], [t.x + SUN[0] * k - t.R * 0.5, t.y + SUN[1] * k + t.R * 0.5]])).path);
  }
  g.fillStyle = hatchPattern(g, seed + 4, "\\", 4.4, 0.8, tint(INK, 0, 0.28));
  g.fill(outline, "nonzero");
  g.restore();

  // Lisière : fougères et ronces qui sortent de l'ombre du bois, plus serrées côté ombre (sud-est).
  const ferns = fernBatch();
  for (const loop of edgeLoops) {
    let acc = 0;
    for (let i = 0; i < loop.length; i++) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      const seg = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      acc += seg;
      if (acc < S * 0.45) continue;
      acc = 0;
      const nx = -(q[1] - p[1]) / seg;
      const ny = (q[0] - p[0]) / seg;
      const rr = rng(seed, Math.round(p[0]), Math.round(p[1]), 37);
      const shade = -(nx * SUN[0] + ny * SUN[1]);
      if (rr() > 0.35 + Math.max(0, shade) * 0.4) continue;
      const d = S * (0.05 + rr() * 0.3);
      const x = p[0] - nx * d + (rr() - 0.5) * S * 0.3;
      const y = p[1] - ny * d;
      const cx = Math.floor(x / S);
      const cy = Math.floor(y / S);
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
      const tt = map.tiles[cy * W + cx];
      if (tt !== T.sol && tt !== T.vegetation) continue;
      if (reserved[cy * W + cx]) continue;
      ferns.add(rr, x, y, S * (0.18 + rr() * 0.16));
    }
  }
  ferns.draw(g, fernCol);

  // Troncs visibles sous la ramure (lisière sud, bord nord des clairières), racines, ombre nette de chaque tronc ;
  // la ramure, posée ensuite, en cache le haut.
  for (const t of trees) {
    if (!t.edge) continue;
    const rr = rng(seed, Math.round(t.x), Math.round(t.y), 32);
    const bx = t.x + t.R * (rr() - 0.5) * 0.2;
    const by = t.y + t.R * (0.95 + rr() * 0.12);
    const tw = Math.max(3, t.R * (0.14 + rr() * 0.06));
    const top = crownY(t);
    const len = t.R * 0.9;
    g.fillStyle = "rgba(12,8,4,.38)";
    g.fill(shapeOf([[bx - tw * 0.5, by], [bx + tw * 0.5, by - 1], [bx + tw * 0.4 + SUN[0] * len, by + SUN[1] * len], [bx - tw * 0.4 + SUN[0] * len, by + SUN[1] * len + 1]]).path);
    const trunk: Pt[] = [[bx - tw / 2, top], [bx + tw / 2, top], [bx + tw * 0.55, by - 2], [bx - tw * 0.55, by - 2]];
    g.fillStyle = bark;
    g.fill(shapeOf(trunk).path);
    g.fillStyle = mixColor(bark, INK, 0.5);
    g.fillRect(bx + tw * 0.05, top, tw * 0.5, by - top - 2);
    g.strokeStyle = tint(INK, 0, 0.5);
    g.lineWidth = 0.6;
    g.beginPath();
    for (let yy = top + 2; yy < by - 3; yy += 2.5 + rr() * 2) {
      const x0 = bx - tw * 0.4 + rr() * tw * 0.3;
      g.moveTo(x0, yy);
      g.lineTo(x0 + tw * 0.25, yy + 0.8);
    }
    g.stroke();
    inkPolyline(g, [[bx - tw / 2, top], [bx - tw * 0.55, by - 2]], rr, { width: 1.1, wobble: 0.2, taper: 3 });
    inkPolyline(g, [[bx + tw / 2, top], [bx + tw * 0.55, by - 2]], rr, { width: 1.4, wobble: 0.2, taper: 3 });
    const nr = 2 + Math.floor(rr() * 2);
    for (let k = 0; k < nr; k++) {
      const a = Math.PI * (0.15 + ((k + rr() * 0.6) / nr) * 0.7);
      const l = tw * (1 + rr() * 1.2);
      const sx = bx + (k / (nr - 1) - 0.5) * tw * 0.9;
      const root: Pt[] = [[sx, by - 3], [sx + Math.cos(a) * l * 0.5, by - 1 + Math.sin(a) * l * 0.25], [sx + Math.cos(a) * l, by + Math.sin(a) * l * 0.45]];
      inkPolyline(g, root, rr, { width: tw * 0.42, taper: l * 0.9, wobble: 0.3, color: INK });
      inkPolyline(g, root, rr, { width: tw * 0.22, taper: l * 0.8, wobble: 0.2, color: mixColor(bark, "#d8c29a", 0.15) });
    }
  }

  // Un seul contour d'encre autour de la masse : le trait des silhouettes du bord, plus épais côté ombre ; les ramures
  // posées ensuite en recouvrent la moitié intérieure.
  g.save();
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.stroke(rimOutline);
  g.translate(SUN[0] * 1.8, SUN[1] * 1.8);
  g.lineWidth = 5.2;
  g.stroke(rimOutline);
  g.restore();

  // Ramures, directement sur la planche.
  g.imageSmoothingEnabled = true;
  for (const t of trees) {
    if (t.kind === 3 || t.big) continue;
    const [sp, , R0] = spriteOf(t);
    const s = t.R / R0;
    g.save();
    g.translate(t.x, crownY(t));
    g.rotate(t.rot);
    g.drawImage(sp, (-sp.width / 2) * s, (-sp.height / 2) * s, sp.width * s, sp.height * s);
    g.restore();
  }

  // Masques de la masse au quart de la taille : bande sombre sous toute la lisière, côté sud-est lavé et hachuré.
  const Q = 4;
  const qw = Math.ceil(PW / Q);
  const qh = Math.ceil(PH / Q);
  const low = (draw: (q: CanvasRenderingContext2D) => void) => {
    const cv = canvas(qw, qh);
    draw(cv.getContext("2d")!);
    return cv;
  };
  // silhouette de la canopée au quart, une seule fois ; les autres masques en sont des copies décalées
  const small = low((q) => {
    q.setTransform(1 / Q, 0, 0, 1 / Q, 0, 0);
    q.fill(outline, "nonzero");
  });
  const e = (S * 0.45) / Q;
  const rim = low((q) => {
    q.drawImage(small, 0, 0);
    q.globalCompositeOperation = "source-in";
    q.fillStyle = "rgba(14,18,6,.3)";
    q.fillRect(0, 0, qw, qh);
    // moins la silhouette rognée d'une demi-case (intersection de huit copies décalées) : reste la bande du bord
    const ero = low((o) => {
      o.drawImage(small, 0, 0);
      o.globalCompositeOperation = "destination-in";
      for (let k = 0; k < 8; k++) o.drawImage(small, Math.cos((k * Math.PI) / 4) * e, Math.sin((k * Math.PI) / 4) * e);
    });
    q.globalCompositeOperation = "destination-out";
    q.drawImage(ero, 0, 0);
  });
  const se = low((q) => {
    q.drawImage(small, 0, 0);
    q.globalCompositeOperation = "source-in";
    q.fillStyle = "rgb(184,188,168)";
    q.fillRect(0, 0, qw, qh);
    q.globalCompositeOperation = "destination-out";
    q.drawImage(small, (-SUN[0] * S * 0.6) / Q, (-SUN[1] * S * 0.6) / Q);
  });
  // Grandes masses de valeur sur la canopée (bruit lent, quatre à six cases) : des bosquets entiers prennent le soleil,
  // d'autres restent dans l'ombre ; la forêt se lit par groupes et non arbre par arbre.
  const massV = (() => {
    const k = 8;
    const cv = canvas(PW / k, PH / k);
    const q = cv.getContext("2d")!;
    const img = q.createImageData(cv.width, cv.height);
    const nz = noise2(seed + 79);
    for (let y = 0; y < cv.height; y++)
      for (let x = 0; x < cv.width; x++) {
        const n0 = nz((x * k) / S / 5, (y * k) / S / 5) * 0.75 + nz((x * k) / S / 2 + 40, (y * k) / S / 2) * 0.25;
        // plus on s'enfonce dans le bois, plus il fait sombre ; une clairière rallume les alentours
        const px = (x + 0.5) * k;
        const py = (y + 0.5) * k;
        const fx = clamp(px / S - 0.5, 0, W - 1.001);
        const fy = clamp(py / S - 0.5, 0, H - 1.001);
        const ci = Math.floor(fx);
        const cj = Math.floor(fy);
        const tx = fx - ci;
        const ty = fy - cj;
        const at = (u: number, v: number) => Math.min(6, vdist[v * W + u]);
        const dv = (at(ci, cj) * (1 - tx) + at(ci + 1, cj) * tx) * (1 - ty) + (at(ci, cj + 1) * (1 - tx) + at(ci + 1, cj + 1) * tx) * ty;
        let lift = 0;
        for (const q of glades) lift = Math.max(lift, 1 - Math.max(0, Math.hypot(px - q.x, py - q.y) - q.R) / (S * 2.2));
        const n = n0 * 0.7 - smoothstep(1.4, 4.2, dv) * 0.75 * (1 - lift) + lift * 0.3;
        const i = (y * cv.width + x) * 4;
        if (n > 0.1) {
          img.data[i] = 250;
          img.data[i + 1] = 236;
          img.data[i + 2] = 170;
          img.data[i + 3] = Math.round(Math.min(1, (n - 0.1) * 2.2) * 0.2 * 255);
        } else if (n < -0.1) {
          img.data[i] = 10;
          img.data[i + 1] = 16;
          img.data[i + 2] = 8;
          img.data[i + 3] = Math.round(Math.min(1, (-n - 0.1) * 1.6) * 0.3 * 255);
        }
      }
    q.putImageData(img, 0, 0);
    q.globalCompositeOperation = "destination-in";
    q.imageSmoothingEnabled = true;
    q.drawImage(small, 0, 0, cv.width, cv.height);
    return cv;
  })();
  {
    const rc = rim.getContext("2d")!;
    rc.globalCompositeOperation = "destination-over";
    rc.imageSmoothingEnabled = true;
    rc.drawImage(massV, 0, 0, qw, qh);
  }
  g.save();
  g.imageSmoothingEnabled = true;
  g.drawImage(rim, 0, 0, PW, PH);
  g.globalCompositeOperation = "multiply";
  g.drawImage(se, 0, 0, PW, PH);
  g.restore();

  // Vieux chênes : ils dépassent la canopée et prennent la lumière ; leur ombre tombe sur les ramures voisines.
  for (const t of trees) {
    if (!t.big) continue;
    const [sp, loops, R0] = spriteOf(t);
    const s = t.R / R0;
    const off = t.R * 0.45;
    const sh = new Path2D();
    for (const loop of loops) sh.addPath(shapeOf(loop.map(([x, y]) => [t.x + off * SUN[0] + x * s, t.y + off * SUN[1] + y * s] as Pt)).path);
    g.fillStyle = "rgba(6,9,4,.36)";
    g.fill(sh, "nonzero");
    g.save();
    g.translate(t.x, t.y);
    g.rotate(t.rot);
    g.drawImage(sp, (-sp.width / 2) * s, (-sp.height / 2) * s, sp.width * s, sp.height * s);
    g.restore();
  }

  // Arbres morts : branches nues par-dessus la canopée ou devant la lisière.
  for (const t of trees) if (t.kind === 3) deadTree(g, t.x, t.y, S * (0.66 + hash(Math.round(t.x), Math.round(t.y), seed + 30) * 0.14), rng(seed, Math.round(t.x), Math.round(t.y), 31), bark);
}

// ——— Menus détails des prairies ———

/**
 * Souches, troncs couchés, buissons secs, arbres morts. Presque tous en lisière (une case au plus du bois) ; en pleine
 * prairie, seulement une souche ou un tronc de loin en loin. Chacun tourné, mis à l'échelle et dessiné à sa graine.
 */
function paintScatter(c: MapCtx, w: Wild, reserved: Uint8Array) {
  const { map, theme, g, W, H, S } = c;
  const seed = map.seed;
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && map.tiles[y * W + x] === T.sol && !reserved[y * W + x];
  const near = (x: number, y: number, t: number, rad: number) => {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (w.tile(x + dx, y + dy) === t) return true;
    return false;
  };
  const bark = muted(mixColor(theme.door, "#5a4c3c", 0.72), 0.2);
  const fernCol = muted(mixColor(theme.vegetation, "#56703a", 0.4), 0.15);
  let cells = 0;
  for (let i = 0; i < W * H; i++) if (map.tiles[i] === T.sol) cells++;
  let logs = Math.max(1, Math.floor(cells / 130));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!free(x, y) || near(x, y, T.route, 1)) continue;
      const edge = near(x, y, T.vegetation, 1);
      const h = hash(x, y, seed + 401);
      if (h > (edge ? 0.09 : 0.012)) continue;
      const rr = rng(seed, x, y, 41);
      const px = (x + 0.25 + rr() * 0.5) * S;
      const py = (y + 0.25 + rr() * 0.5) * S;
      const sc = 0.7 + rr() * 0.6;
      const u = rr();
      if (edge && u < 0.16) deadTree(g, px, py, S * (0.62 + rr() * 0.16), rr, bark);
      else if (u < 0.72 || logs <= 0) {
        stump(g, rr, px, py, S * 0.15 * sc, bark);
        if (rr() < 0.45) fern(g, rr, px + (rr() - 0.5) * S * 0.5, py + S * (0.15 + rr() * 0.2), S * 0.28 * sc, fernCol);
      } else {
        logs--;
        const L = S * (0.6 + rr() * 0.8);
        const a = rr() * Math.PI;
        const th = S * (0.08 + rr() * 0.05);
        if (rr() < 0.3) {
          // tronc brisé en deux, les morceaux un peu désaxés
          const gap = S * 0.08;
          const l1 = L * (0.4 + rr() * 0.2);
          const l2 = L - l1 - gap;
          log(g, rr, px - Math.cos(a) * (L / 2 - l1 / 2), py - Math.sin(a) * (L / 2 - l1 / 2), l1, th, a, bark);
          log(g, rr, px + Math.cos(a) * (L / 2 - l2 / 2), py + Math.sin(a) * (L / 2 - l2 / 2), l2, th * 0.95, a + (rr() - 0.5) * 0.4, bark);
        } else log(g, rr, px, py, L, th, a, bark);
      }
    }
}

/** Fougère : quatre à six frondes arquées, folioles en épi, un côté clair et un côté sombre. */
function fern(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, R: number, col: string) {
  const b = fernBatch();
  b.add(r, x, y, R);
  b.draw(g, col);
}

/** Plusieurs fougères tracées en deux traits seulement (côté sombre, côté clair) : `add` pour chacune, puis `draw`. */
function fernBatch() {
  const dark = new Path2D();
  const lit = new Path2D();
  return {
    add(r: Rng, x: number, y: number, R: number) {
      const n = 4 + Math.floor(r() * 3);
      const a0 = r() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
        const L = R * (0.7 + r() * 0.4);
        const bend = (r() - 0.5) * 0.7;
        const at = (t: number): Pt => [x + Math.cos(a + bend * t) * L * t, y + Math.sin(a + bend * t) * L * t];
        const p = -(Math.cos(a) + Math.sin(a)) > 0 ? lit : dark;
        p.moveTo(x, y);
        for (let t = 0.1; t <= 1.001; t += 0.1) {
          const [qx, qy] = at(t);
          p.lineTo(qx, qy);
        }
        for (let t = 0.2; t < 0.95; t += 0.12) {
          const [qx, qy] = at(t);
          const l = L * 0.22 * (1 - t * 0.7);
          for (const s of [-1, 1]) {
            const b = a + bend * t + s * 1.1;
            p.moveTo(qx, qy);
            p.lineTo(qx + Math.cos(b) * l, qy + Math.sin(b) * l);
          }
        }
      }
    },
    draw(g: CanvasRenderingContext2D, col: string) {
      g.lineCap = "round";
      g.lineWidth = 1;
      g.strokeStyle = mixColor(col, INK, 0.45);
      g.stroke(dark);
      g.strokeStyle = mixColor(col, "#e2dca0", 0.25);
      g.stroke(lit);
    },
  };
}

/** Souche coupée : ombre, racines, cernes inégaux, fente. */
function stump(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, R: number, bark: string) {
  const pts = smoothPoints(blobPoints(r, x, y, R, R * (0.82 + r() * 0.15), 9, 0.14, r() * 3));
  castShadow(g, pts, R * 1.1, "rgba(14,9,5,.38)");
  const nr = 3 + Math.floor(r() * 3);
  for (let i = 0; i < nr; i++) {
    const a = (i / nr) * Math.PI * 2 + r() * 0.8;
    const l = R * (1.35 + r() * 0.5);
    const root: Pt[] = [[x + Math.cos(a) * R * 0.7, y + Math.sin(a) * R * 0.7], [x + Math.cos(a + 0.2) * l, y + Math.sin(a + 0.2) * l]];
    inkPolyline(g, root, r, { width: R * 0.42, taper: R, color: INK, wobble: 0.2 });
    inkPolyline(g, root, r, { width: R * 0.22, taper: R * 0.9, color: mixColor(bark, INK, 0.15), wobble: 0.2 });
  }
  g.fillStyle = mixColor(bark, INK, 0.3);
  g.fill(shapeOf(pts).path);
  const ox = x - R * 0.08;
  const oy = y - R * 0.12;
  const topPts = pts.map(([u, v]) => [ox + (u - x) * 0.78, oy + (v - y) * 0.78] as Pt);
  g.fillStyle = mixColor(bark, "#e8d4a4", 0.42 + r() * 0.12);
  g.fill(shapeOf(topPts).path);
  // cernes : anneaux déformés, plus serrés vers l'écorce
  g.strokeStyle = tint(INK, 0, 0.42);
  g.lineWidth = 0.55;
  const cx = ox + (r() - 0.5) * R * 0.2;
  const cy = oy + (r() - 0.5) * R * 0.2;
  const rings = 3 + Math.floor(r() * 3);
  for (let k = 1; k <= rings; k++) {
    const f = Math.sqrt(k / (rings + 1)) * 0.74;
    g.beginPath();
    topPts.forEach(([u, v], i) => (i ? g.lineTo(cx + (u - ox) * f, cy + (v - oy) * f) : g.moveTo(cx + (u - ox) * f, cy + (v - oy) * f)));
    g.closePath();
    g.stroke();
  }
  inkPolyline(g, [[cx, cy], [cx + R * 0.7 * Math.cos(r() * 6), cy + R * 0.6]], r, { width: 0.8, taper: 3 });
  inkPolyline(g, pts, r, { closed: true, width: 1.3, wobble: 0.3 });
}

/** Tronc couché : écorce hachurée en long, côté ombre, cernes au bout scié, bout cassé en dents, teinte propre. */
function log(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, L: number, th: number, a: number, bark0: string) {
  const bark = tint(bark0, (r() - 0.5) * 0.2);
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const P = (u: number, v: number): Pt => [x + ca * u - sa * v, y + sa * u + ca * v];
  const body: Pt[] = [
    P(-L / 2, -th),
    P(-L / 6, -th * (0.95 + r() * 0.1)),
    P(L / 6, -th * (0.9 + r() * 0.1)),
    P(L / 2, -th * 0.85),
    P(L / 2 + th * 0.3, -th * 0.3),
    P(L / 2 - th * 0.2, th * 0.1),
    P(L / 2 + th * 0.25, th * 0.5),
    P(L / 2, th * 0.85),
    P(L / 6, th),
    P(-L / 2, th),
  ];
  castShadow(g, body, th * 1.5, "rgba(14,9,5,.36)");
  g.fillStyle = bark;
  g.fill(shapeOf(body).path);
  const shadeSide = -sa * SUN[0] + ca * SUN[1] > 0 ? 1 : -1;
  g.fillStyle = tint(mixColor(bark, INK, 0.45), 0, 0.85);
  g.fill(shapeOf([P(-L / 2, th * 0.15 * shadeSide), P(L / 2, th * 0.15 * shadeSide), P(L / 2, th * 0.85 * shadeSide), P(-L / 2, th * shadeSide)]).path);
  g.strokeStyle = tint(INK, 0, 0.5);
  g.lineWidth = 0.6;
  g.beginPath();
  const n = Math.round(L / 4);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * th * 1.7;
    const u0 = -L / 2 + r() * L * 0.85;
    const [ax, ay] = P(u0, v);
    const [bx, by] = P(Math.min(L / 2, u0 + L * (0.08 + r() * 0.18)), v + (r() - 0.5));
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
  }
  g.stroke();
  const [ex, ey] = P(-L / 2, 0);
  g.fillStyle = mixColor(bark, "#e8d4a4", 0.5);
  g.beginPath();
  g.ellipse(ex, ey, th * 0.45, th, a, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = tint(INK, 0, 0.5);
  for (const k of [0.25, 0.55]) {
    g.beginPath();
    g.ellipse(ex, ey, th * 0.45 * k, th * k, a, 0, Math.PI * 2);
    g.stroke();
  }
  g.lineWidth = 1;
  g.strokeStyle = INK;
  g.beginPath();
  g.ellipse(ex, ey, th * 0.45, th, a, 0, Math.PI * 2);
  g.stroke();
  if (r() < 0.7) {
    const u = (r() - 0.3) * L * 0.6;
    const side = r() < 0.5 ? -1 : 1;
    const [bx, by] = P(u, side * th);
    inkPolyline(g, [[bx, by], P(u + L * 0.1, side * th * (2 + r()))], r, { width: 2.2, taper: 5, color: mixColor(bark, INK, 0.3) });
  }
  inkPolyline(g, body, r, { closed: true, width: 1.2, wobble: 0.3 });
}

// ——— Lieux nommés ———

type Room = GameMap["rooms"][number];
type SiteKind = "camp" | "cave" | "pit" | "ruin" | "tower" | "glade" | "ford";

interface Site {
  kind: SiteKind;
  room: Room;
  i: number;
  /** Case du lieu (centre du campement, case de rocher de la grotte…). */
  x: number;
  y: number;
  /** Grotte : direction de l'ouverture. */
  dir?: [number, number];
  /** Campement trop à l'étroit : une seule tente. */
  small?: boolean;
}

interface Plan {
  sites: Site[];
  /** Cases occupées par un lieu dessiné : pas d'arbre, pas de menu détail. */
  reserved: Uint8Array;
}

/** Où dessiner chaque lieu du générateur (rooms[].label) ; calculé une fois, avant la forêt qui s'écarte. */
function planSites(map: GameMap, w: Wild): Plan {
  const { width: W, height: H, tiles } = map;
  const reserved = new Uint8Array(W * H);
  const t = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? T.vide : tiles[y * W + x]);
  const grassy = (x: number, y: number) => (t(x, y) === T.sol || t(x, y) === T.vegetation) && !reserved[y * W + x];
  const reserve = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) reserved[y * W + x] = 1;
  };
  const sites: Site[] = [];
  map.rooms.forEach((room, i) => {
    const label = (room.label || "").toLowerCase();
    const mx = room.x + (room.w - 1) / 2;
    const my = room.y + (room.h - 1) / 2;
    const nearest = (ok: (x: number, y: number) => boolean, reach: number, cost: (x: number, y: number) => number = () => 0): [number, number] | null => {
      let best: [number, number] | null = null;
      let bs = Infinity;
      for (let y = Math.floor(my - reach); y <= my + reach; y++)
        for (let x = Math.floor(mx - reach); x <= mx + reach; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H || !ok(x, y)) continue;
          const s = Math.hypot(x - mx, y - my) + cost(x, y);
          if (s < bs) {
            bs = s;
            best = [x, y];
          }
        }
      return best;
    };
    if (label.includes("campement")) {
      // trois cases sur trois d'herbe, à une case au moins de l'eau
      const cell = nearest(
        (x, y) => {
          let road = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              if (t(x + dx, y + dy) === T.route) road++;
              else if (!grassy(x + dx, y + dy)) return false;
            }
          if (road > 1) return false;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (t(x + dx, y + dy) === T.eau) return false;
          return true;
        },
        6,
        (x, y) => {
          let k = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) k += t(x + dx, y + dy) === T.vegetation ? 0.3 : t(x + dx, y + dy) === T.route ? 1.5 : 0;
          return k;
        },
      );
      if (cell) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t(cell[0] + dx, cell[1] + dy) !== T.route) reserve(cell[0] + dx, cell[1] + dy);
        // Campement dans le bois : une trouée de deux cases de large vers la prairie ou le chemin le plus proche.
        let best: [number, number, number] | null = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          for (let k = 2; k <= 9; k++) {
            const x = cell[0] + dx * k;
            const y = cell[1] + dy * k;
            const v = t(x, y);
            if (v === T.vide || v === T.eau || v === T.mur) break;
            if (v === T.sol || v === T.route) {
              if (k > 2 && (!best || k < best[2])) best = [dx, dy, k];
              break;
            }
          }
        }
        if (best) {
          const [dx, dy, k] = best;
          for (let j = 2; j < k; j++)
            // la case du couloir et sa voisine de côté (et, en diagonale, celle qui recoud les coins)
            for (const [ox, oy] of dx && dy ? [[0, 0], [dx, 0], [-dy, dx]] : [[0, 0], [-dy, dx]]) {
              const x = cell[0] + dx * j + ox;
              const y = cell[1] + dy * j + oy;
              if (t(x, y) === T.vegetation) reserve(x, y);
            }
        }
        sites.push({ kind: "camp", room, i, x: cell[0], y: cell[1] });
      } else {
        const one = nearest((x, y) => grassy(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => grassy(x + dx, y + dy)).length >= 2, 4);
        if (one) {
          reserve(one[0], one[1]);
          sites.push({ kind: "camp", room, i, x: one[0], y: one[1], small: true });
        }
      }
    } else if (label.includes("grotte")) {
      const spot = caveSpot(map, mx, my, reserved);
      if (spot) {
        const [x, y, dx, dy] = spot;
        const px = -dy;
        const py = dx;
        // devant l'entrée, deux rangs de cases sans arbre : le sentier y mène
        for (const k of [1, 2]) for (const s of [0, 1]) if (grassy(x + px * s + dx * k, y + py * s + dy * k)) reserve(x + px * s + dx * k, y + py * s + dy * k);
        sites.push({ kind: "cave", room, i, x, y, dir: [dx, dy] });
      } else {
        const pit = nearest(grassy, 3);
        if (pit) {
          reserve(pit[0], pit[1]);
          sites.push({ kind: "pit", room, i, x: pit[0], y: pit[1] });
        }
      }
    } else if (label.includes("ruine")) {
      for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) if (grassy(x, y)) reserve(x, y);
      sites.push({ kind: "ruin", room, i, x: room.x, y: room.y });
    } else if (label.includes("tour")) {
      const cell = nearest(grassy, 3);
      if (cell) {
        reserve(cell[0], cell[1]);
        sites.push({ kind: "tower", room, i, x: cell[0], y: cell[1] });
      }
    } else if (label.includes("clairi")) {
      for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) if (t(x, y) === T.vegetation) reserve(x, y);
      const cell = nearest((x, y) => t(x, y) === T.sol || (t(x, y) === T.vegetation && reserved[y * W + x] === 1), 3);
      if (cell) sites.push({ kind: "glade", room, i, x: cell[0], y: cell[1] });
    } else if (label.includes("pont")) {
      // Le pont du chemin est déjà dessiné s'il passe près ; sinon, un gué de pierres plates.
      const near = w.bridges.some((b) => b.some(([x, y]) => Math.hypot(x / BASE_S - mx, y / BASE_S - my) < 6));
      if (!near) sites.push({ kind: "ford", room, i, x: room.x, y: room.y });
    }
  });
  return { sites, reserved };
}

const BASE_S = 48;

/**
 * Entrée de grotte : deux cases de rocher côte à côte, adossées à au moins une case de rocher, qui donnent sur deux cases
 * praticables (prairie ou chemin de préférence ; une ouverture vers le bois serait cachée). Ouverture au sud de préférence.
 */
function caveSpot(map: GameMap, mx: number, my: number, reserved: Uint8Array): [number, number, number, number] | null {
  const { width: W, height: H, tiles } = map;
  const t = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? T.vide : tiles[y * W + x]);
  const rock = (x: number, y: number) => t(x, y) === T.mur;
  const openK = (x: number, y: number) => (t(x, y) === T.sol || t(x, y) === T.route ? 0 : t(x, y) === T.vegetation && !reserved[y * W + x] ? 1.5 : 99);
  let best: [number, number, number, number] | null = null;
  let bs = Infinity;
  const dirs: [number, number, number][] = [
    [0, 1, 0],
    [1, 0, 1.2],
    [-1, 0, 1.2],
    [0, -1, 2.5],
  ];
  for (let y = Math.floor(my - 8); y <= my + 8; y++)
    for (let x = Math.floor(mx - 8); x <= mx + 8; x++)
      for (const [dx, dy, pen] of dirs) {
        const px = -dy;
        const py = dx;
        const bx = x + px;
        const by = y + py;
        if (!rock(x, y) || !rock(bx, by) || !rock(x - dx, y - dy) || !rock(bx - dx, by - dy)) continue;
        const o = openK(x + dx, y + dy) + openK(bx + dx, by + dy);
        if (o >= 99) continue;
        const s = Math.hypot(x + px * 0.5 - mx, y + py * 0.5 - my) + pen + o;
        if (s < bs) {
          bs = s;
          best = [x, y, dx, dy];
        }
      }
  return best;
}

/** Dessine les lieux : `sol` pose ce qui est au ras du sol (sous les arbres), `objets` le reste ; renvoie les feux. */
function paintSites(c: MapCtx, w: Wild, plan: Plan, phase: "sol" | "objets"): Pt[] {
  const { map, theme, g, W, H, S } = c;
  const glows: Pt[] = [];
  const t = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? T.vide : map.tiles[y * W + x]);
  const stone = muted(mixColor(mixColor(theme.wall, "#8f877a", 0.5), theme.floor, 0.12), 0.15);
  const wood = muted(mixColor(theme.door, "#7f6244", 0.62), 0.15);
  const dirt = muted(mixColor(mixColor(theme.road, theme.floor, 0.3), "#8a6a44", 0.3), 0.15);
  for (const s of plan.sites) {
    const r = rng(map.seed, 40 + s.i, phase === "sol" ? 1 : 2);
    const cx = (s.x + 0.5) * S;
    const cy = (s.y + 0.5) * S;
    if (s.kind === "camp") {
      if (phase === "sol") campGround(g, r, cx, cy, S, dirt, !!s.small);
      else glows.push(camp(g, rng(map.seed, 40 + s.i, 3), cx, cy, S, wood, stone, dirt, !!s.small, s.i));
    } else if (s.kind === "cave") {
      const [dx, dy] = s.dir!;
      // milieu du bord commun entre les deux cases de rocher et les cases ouvertes
      const ex = (s.x + 0.5 + dx * 0.5 - dy * 0.5) * S;
      const ey = (s.y + 0.5 + dy * 0.5 + dx * 0.5) * S;
      if (phase === "sol") {
        caveTrail(g, r, ex, ey, [dx, dy], S, dirt);
        trailToRoad(g, r, w, ex + dx * S * 1.2, ey + dy * S * 1.2, [dx, dy], dirt);
      }
      else caveMouth(g, r, ex, ey, [dx, dy], S, stone);
    } else if (s.kind === "pit") {
      if (phase === "objets") sinkhole(g, r, cx, cy, S, stone);
    } else if (s.kind === "ruin") {
      const ok = (x: number, y: number) => plan.reserved[y * W + x] === 1 || t(x, y) === T.sol;
      if (phase === "sol") ruinFloor(g, r, s.room, W, H, S, ok, stone);
      else ruinWalls(g, r, s.room, W, H, S, (x, y) => ok(x, y) && t(x, y) !== T.route, stone, theme.vegetation);
    } else if (s.kind === "tower") {
      if (phase === "objets") watchtower(g, r, cx, cy, S, wood, stone);
    } else if (s.kind === "glade") {
      if (phase === "sol") gladeLight(g, cx, cy, S);
      else glade(g, r, cx, cy, S, wood);
    } else if (s.kind === "ford" && phase === "objets") {
      const room = s.room;
      for (let y = room.y - 1; y <= room.y + room.h; y++)
        for (let x = room.x - 1; x <= room.x + room.w; x++) {
          if (t(x, y) !== T.eau) continue;
          const rr = rng(map.seed, x, y, 44);
          for (let k = 0; k < 2; k++) pebble(g, rr, (x + 0.25 + k * 0.5 + (rr() - 0.5) * 0.15) * S, (y + 0.5 + (rr() - 0.5) * 0.3) * S, 7 + rr() * 3, stone);
        }
    }
  }
  return glows;
}

// — Campement —

function campGround(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, dirt: string, small: boolean) {
  const R = small ? S * 0.55 : S * 1.25;
  const ground = smoothPoints(blobPoints(r, x, y, R, R * 0.88, 12, 0.18), 2);
  const sh = shapeOf(ground);
  g.fillStyle = tint(dirt, 0, 0.42);
  g.fill(sh.path);
  g.fillStyle = tint(dirt, 0, 0.35);
  g.fill(shapeOf(smoothPoints(blobPoints(r, x, y, R * 0.6, R * 0.55, 9, 0.2), 2)).path);
  stipple(g, sh, r, { density: 1.4, radius: 0.6, color: "rgba(40,28,16,.5)" });
  // herbe couchée sur le pourtour
  g.strokeStyle = "rgba(60,70,30,.45)";
  g.lineWidth = 0.8;
  g.beginPath();
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.75 + r() * 0.3);
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d;
    g.moveTo(px, py);
    g.lineTo(px + Math.cos(a + 1.2) * 5, py + Math.sin(a + 1.2) * 5);
  }
  g.stroke();
}

/** Campement : feu dans un cercle de pierres, deux ou trois tentes tournées vers lui, bûches pour s'asseoir, un sac. */
function camp(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, wood: string, stone: string, dirt: string, small: boolean, i: number): Pt {
  const fx = x + (r() - 0.5) * S * 0.2;
  const fy = y + (r() - 0.5) * S * 0.2;
  const cloths = ["#c9b48a", "#9c5b3c", "#7d8059", "#a8956a"];
  const n = small ? 1 : 2 + (r() < 0.5 ? 1 : 0);
  const a0 = r() * Math.PI * 2;
  const angles = Array.from({ length: n }, (_, k) => a0 + (k * Math.PI * 2) / n + (r() - 0.5) * 0.5);
  // bûches-sièges entre les tentes
  if (!small)
    angles.forEach((a, k) => {
      if (k === n - 1 && n === 3 && r() < 0.5) return;
      const b = a + Math.PI / n;
      log(g, r, fx + Math.cos(b) * S * 0.62, fy + Math.sin(b) * S * 0.62, S * (0.42 + r() * 0.12), S * 0.09, b + Math.PI / 2, wood);
    });
  angles.forEach((a, k) => {
    const d = small ? S * 0 : S * (0.98 + r() * 0.1);
    tent(g, r, fx + Math.cos(a) * d, fy + Math.sin(a) * d * 0.95, a + Math.PI, S, cloths[(i + k) % cloths.length]);
  });
  if (small) return [x, y];
  // sac et ballot près de la première tente
  const sa = angles[0] + 0.62;
  sack(g, r, fx + Math.cos(sa) * S * 0.92, fy + Math.sin(sa) * S * 0.92, S * 0.13, mixColor(cloths[i % 4], "#6b5a3a", 0.4));
  campfire(g, r, fx, fy, S, wood, stone, dirt);
  return [fx, fy];
}

function sack(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, R: number, cloth: string) {
  const pts = smoothPoints(blobPoints(r, x, y, R, R * 0.85, 8, 0.15));
  castShadow(g, pts, R * 0.9, "rgba(14,9,5,.38)");
  g.fillStyle = cloth;
  g.fill(shapeOf(pts).path);
  g.fillStyle = tint(mixColor(cloth, "#f3e7c8", 0.35), 0, 0.9);
  g.beginPath();
  g.ellipse(x - R * 0.3, y - R * 0.3, R * 0.4, R * 0.28, -0.6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = tint(INK, 0, 0.6);
  g.lineWidth = 0.7;
  g.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + r();
    g.moveTo(x + R * 0.1, y + R * 0.05);
    g.lineTo(x + Math.cos(a) * R * 0.7, y + Math.sin(a) * R * 0.7);
  }
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x + R * 0.1, y + R * 0.05, 1.6, 0, Math.PI * 2);
  g.fill();
  inkPolyline(g, pts, r, { closed: true, width: 1.1, wobble: 0.3 });
}

function campfire(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, wood: string, stone: string, dirt: string) {
  // cendres
  g.fillStyle = tint(mixColor(dirt, INK, 0.5), 0, 0.55);
  g.beginPath();
  g.arc(x + 2, y + 2, S * 0.36, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2d2620";
  g.beginPath();
  g.arc(x, y, S * 0.22, 0, Math.PI * 2);
  g.fill();
  stipple(g, shapeOf(blobPoints(r, x, y, S * 0.21, S * 0.21, 10, 0.05)), r, { density: 3, radius: 0.7, color: "rgba(170,160,150,.5)" });
  // pierres du foyer
  const n = 10 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + r() * 0.25;
    pebble(g, r, x + Math.cos(a) * S * 0.27, y + Math.sin(a) * S * 0.27, 3.6 + r() * 1.6, stone);
  }
  // bûches croisées, charbonneuses
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + r() * 0.4;
    const dx = Math.cos(a) * S * 0.17;
    const dy = Math.sin(a) * S * 0.17;
    inkPolyline(g, [[x - dx, y - dy], [x + dx, y + dy]], r, { width: 4.6, color: mixColor(wood, INK, 0.55), wobble: 0.2, taper: 2 });
    inkPolyline(g, [[x - dx * 0.4, y - dy * 0.4], [x + dx * 0.9, y + dy * 0.9]], r, { width: 1.2, color: "rgba(255,120,40,.8)", wobble: 0.2, taper: 3 });
  }
  // braises
  for (let k = 0; k < 14; k++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * S * 0.18;
    g.fillStyle = ["#ff7a2a", "#ffb347", "#c43c12"][k % 3];
    g.beginPath();
    g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.9 + r() * 1.1, 0, Math.PI * 2);
    g.fill();
  }
  // flammes
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.2;
    const len = S * (0.12 + r() * 0.1);
    const bx = x + (r() - 0.5) * 6;
    const by = y + (r() - 0.5) * 6;
    const tx = bx + Math.cos(a) * len;
    const ty = by + Math.sin(a) * len;
    const px = -Math.sin(a) * 3.2;
    const py = Math.cos(a) * 3.2;
    g.fillStyle = k % 2 ? "#e98a2c" : "#f4c552";
    g.beginPath();
    g.moveTo(bx + px, by + py);
    g.quadraticCurveTo((bx + tx) / 2 + px * 1.4, (by + ty) / 2 + py * 1.4, tx, ty);
    g.quadraticCurveTo((bx + tx) / 2 - px * 1.4, (by + ty) / 2 - py * 1.4, bx - px, by - py);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(90,30,8,.8)";
    g.lineWidth = 0.7;
    g.stroke();
  }
  g.fillStyle = "#fff2c0";
  g.beginPath();
  g.arc(x, y, 2.6, 0, Math.PI * 2);
  g.fill();
}

/** Tente à deux pans vue de dessus : faîtage, pans éclairés différemment, plis, porte ouverte vers +x, cordes et piquets. */
function tent(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, ang: number, S: number, cloth: string) {
  const L = S * 0.47;
  const Wd = S * 0.34;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const P = (u: number, v: number): Pt => [x + ca * u - sa * v, y + sa * u + ca * v];
  const foot = [P(-L, -Wd), P(L, -Wd), P(L, Wd), P(-L, Wd)];
  // ombre : le faîtage est haut, l'ombre s'étire depuis lui
  g.fillStyle = "rgba(14,9,5,.4)";
  const ridge = [P(-L - 2, 0), P(L + 2, 0)];
  const h = S * 0.36;
  g.fill(shapeOf(hull([...foot, ...ridge.map(([u, v]) => [u + SUN[0] * h, v + SUN[1] * h] as Pt)])).path);
  // cordes et piquets
  g.strokeStyle = tint(INK, 0, 0.6);
  g.lineWidth = 0.7;
  g.beginPath();
  const pegs: Pt[] = [];
  for (const [u0, v0, u1, v1] of [
    [-L - 2, 0, -L - S * 0.24, 0],
    [L + 2, 0, L + S * 0.2, 0],
    [-L * 0.8, -Wd, -L * 1.05, -Wd - S * 0.16],
    [L * 0.6, -Wd, L * 0.8, -Wd - S * 0.16],
    [-L * 0.8, Wd, -L * 1.05, Wd + S * 0.16],
    [L * 0.6, Wd, L * 0.8, Wd + S * 0.16],
  ]) {
    const a = P(u0, v0);
    const b = P(u1, v1);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    pegs.push(b);
  }
  g.stroke();
  g.fillStyle = INK;
  for (const [px, py] of pegs) g.fillRect(px - 1.1, py - 1.1, 2.2, 2.2);
  // deux pans : celui tourné vers la lumière est clair, l'autre plus sombre et hachuré
  const upN: Pt = [sa, -ca]; // normale du pan v < 0, dans le monde
  const litUp = upN[0] * LIGHT[0] + upN[1] * LIGHT[1] > 0;
  for (const side of [-1, 1]) {
    const lit = (side < 0) === litUp;
    const pan = [P(-L, 0), P(L, 0), P(L * 0.96, Wd * side), P(-L * 0.96, Wd * side)];
    g.fillStyle = lit ? mixColor(cloth, "#f4ebd2", 0.12) : mixColor(cloth, "#2a1c10", 0.42);
    g.fill(shapeOf(pan).path);
    g.strokeStyle = tint(INK, 0, lit ? 0.22 : 0.4);
    g.lineWidth = 0.7;
    g.beginPath();
    for (let s = -L + 4; s < L - 2; s += lit ? 7 : 3) {
      const a = P(s, 0);
      const b = P(s * 0.96 + (r() - 0.5), Wd * side);
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0], b[1]);
    }
    g.stroke();
  }
  // porte ouverte côté feu (+u) : intérieur sombre, rabats repliés
  const door = [P(L, 0), P(L * 0.62, -Wd * 0.5), P(L * 0.62, Wd * 0.5)];
  g.fillStyle = "#1c140c";
  g.fill(shapeOf(door).path);
  for (const side of [-1, 1]) {
    const flap = [P(L, 0), P(L * 0.62, Wd * 0.5 * side), P(L + S * 0.1, Wd * 0.75 * side)];
    g.fillStyle = mixColor(cloth, "#f4ebd2", 0.15);
    g.fill(shapeOf(flap).path);
    inkPolyline(g, flap, r, { closed: true, width: 0.8, wobble: 0.2 });
  }
  inkPolyline(g, foot, r, { closed: true, width: 1.4, wobble: 0.3 });
  inkPolyline(g, ridge, r, { width: 2.2, wobble: 0.2, taper: 2 });
}

// — Grotte —

/**
 * Sentier de terre foulée entre un lieu et le chemin le plus proche (dix cases au plus) : courbe douce qui part dans
 * l'axe de l'entrée, lavis ocre, herbe couchée au bord, traces. Abandonné s'il devrait traverser l'eau ou le rocher.
 */
function trailToRoad(g: CanvasRenderingContext2D, r: Rng, w: Wild, x: number, y: number, dir: [number, number], dirt: string) {
  const S = BASE_S;
  let best: Pt | null = null;
  let bd = S * 10;
  for (const line of w.routes)
    for (const p of line) {
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
  if (!best || bd < S * 0.8) return;
  const ctl: Pt = [x + dir[0] * bd * 0.45, y + dir[1] * bd * 0.45];
  const pts: Pt[] = [];
  const n = Math.max(6, Math.round(bd / 8));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = (1 - t) * (1 - t) * x + 2 * t * (1 - t) * ctl[0] + t * t * best[0];
    const py = (1 - t) * (1 - t) * y + 2 * t * (1 - t) * ctl[1] + t * t * best[1];
    const tile = w.tile(Math.floor(px / S), Math.floor(py / S));
    if (tile === T.eau || tile === T.mur) return;
    pts.push([px, py]);
  }
  const line = jitterLine(pts, 4, w.seed + 501);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  const stroke = (col: string, wd: number) => {
    g.strokeStyle = col;
    g.lineWidth = wd;
    g.beginPath();
    line.forEach(([u, v], i) => (i ? g.lineTo(u, v) : g.moveTo(u, v)));
    g.stroke();
  };
  stroke(tint(mixColor(w.grass, dirt, 0.5), -0.04, 0.35), S * 0.62);
  stroke(tint(dirt, 0, 0.5), S * 0.42);
  stroke(tint(dirt, 0.08, 0.35), S * 0.18);
  g.restore();
  // bords à la plume, en morceaux
  for (const side of [-1, 1]) {
    const edge = line.map((p, i) => {
      const a = line[Math.max(0, i - 1)];
      const b = line[Math.min(line.length - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [p[0] - ((b[1] - a[1]) / l) * side * S * 0.21, p[1] + ((b[0] - a[0]) / l) * side * S * 0.21] as Pt;
    });
    for (let i = 0; i < edge.length - 2; i += 3) if (r() < 0.6) inkPolyline(g, edge.slice(i, i + 4), r, { width: 0.8, color: tint(INK, 0, 0.55), wobble: 0.3, taper: 6 });
  }
}

/** Ondule légèrement une polyligne ouverte (bruit à graine), sans bouger ses extrémités. */
function jitterLine(pts: Pt[], amount: number, seed: number): Pt[] {
  const nz = noise2(seed);
  return pts.map(([x, y], i) => {
    const k = Math.sin((Math.PI * i) / (pts.length - 1));
    return [x + nz(x / 40, y / 40) * amount * k, y + nz(x / 40 + 30, y / 40) * amount * k] as Pt;
  });
}

function caveTrail(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, dir: [number, number], S: number, dirt: string) {
  const [dx, dy] = dir;
  const pts = smoothPoints(blobPoints(r, x + dx * S * 0.9, y + dy * S * 0.9, S * 1.1, S * 0.55, 10, 0.18, Math.atan2(dy, dx)), 2);
  const sh = shapeOf(pts);
  g.fillStyle = tint(dirt, 0, 0.4);
  g.fill(sh.path);
  stipple(g, sh, r, { density: 1.6, radius: 0.6, color: "rgba(40,28,16,.5)" });
}

/**
 * Entrée de grotte sur la face du rocher, deux cases de large : bouche en demi-ellipse, intérieur noir qui tire au brun,
 * linteau de trois ou quatre voussoirs facettés à l'arête claire, éboulis devant et ombre portée.
 */
function caveMouth(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, dir: [number, number], S: number, stone: string) {
  const [dx, dy] = dir;
  const px = -dy;
  const py = dx;
  // repère local : u le long de la face, v vers l'extérieur
  const P = (u: number, v: number): Pt => [x + px * u + dx * v, y + py * u + dy * v];
  const rx = S * 0.86;
  const ry = S * 0.9;
  // bouche irrégulière : le rayon ondule, la roche a été taillée par l'eau, pas au compas
  const ph = r() * 6;
  const wob = (a: number) => 1 + 0.07 * Math.sin(3 * a + ph) + 0.04 * Math.sin(7 * a + ph * 2);
  const arc = (k: number, a0: number, a1: number, n: number, ex = 0, jag = 0): Pt[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      const j = jag ? 1 + (r() - 0.5) * jag : 1;
      return P(Math.cos(a) * (rx * wob(a) + ex * j) * k, -Math.sin(a) * (ry * wob(a) + ex * j) * k + S * 0.06);
    });
  // éboulis devant, avec leurs ombres
  const n = 6 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const side = r() < 0.5 ? -1 : 1;
    const [ex, ey] = P(side * S * (0.25 + r() * 0.65), S * (0.18 + r() * 0.6));
    pebble(g, r, ex, ey, 2.4 + r() * 3.6, stone);
  }
  // la roche s'enfonce : un dégradé sombre gagne le rocher autour de la bouche
  {
    const [hx, hy] = P(0, -S * 0.2);
    const halo = g.createRadialGradient(hx, hy, S * 0.5, hx, hy, S * 1.5);
    halo.addColorStop(0, "rgba(10,6,3,.55)");
    halo.addColorStop(1, "rgba(10,6,3,0)");
    g.save();
    g.beginPath();
    const a0 = P(-S * 1.6, S * 0.1);
    const a1 = P(S * 1.6, S * 0.1);
    const a2 = P(S * 1.6, -S * 1.8);
    const a3 = P(-S * 1.6, -S * 1.8);
    g.moveTo(a0[0], a0[1]);
    g.lineTo(a1[0], a1[1]);
    g.lineTo(a2[0], a2[1]);
    g.lineTo(a3[0], a3[1]);
    g.closePath();
    g.clip();
    g.fillStyle = halo;
    g.fillRect(hx - S * 1.6, hy - S * 1.6, S * 3.2, S * 3.2);
    g.restore();
  }
  // ombre du linteau sur le seuil
  const outer = arc(1, 0, Math.PI, 18, S * 0.38);
  castShadow(g, outer, S * 0.25, "rgba(14,9,5,.35)");
  // bouche
  const mouth = arc(1, 0, Math.PI, 20);
  mouth.push(P(-rx, S * 0.16), P(rx, S * 0.16));
  const [gx, gy] = P(0, -ry * 0.6);
  const grad = g.createRadialGradient(gx, gy, 1, gx, gy, ry * 1.25);
  grad.addColorStop(0, "#020101");
  grad.addColorStop(0.55, "#0c0805");
  grad.addColorStop(0.85, "#2a1d12");
  grad.addColorStop(1, "#4a3826");
  g.fillStyle = grad;
  g.fill(shapeOf(mouth).path);
  // l'ombre du linteau tombe dans la bouche : hachures serrées sous la voûte
  g.save();
  g.clip(shapeOf(mouth).path);
  g.strokeStyle = "rgba(0,0,0,.6)";
  g.lineWidth = 0.8;
  g.beginPath();
  for (let k = 0; k < 14; k++) {
    const a = 0.15 + (k / 14) * (Math.PI - 0.3);
    const [ax, ay] = P(Math.cos(a) * rx * 0.98, -Math.sin(a) * ry * 0.98 + S * 0.06);
    const [bx, by] = P(Math.cos(a) * rx * 0.62, -Math.sin(a) * ry * 0.62 + S * 0.06);
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
  }
  g.stroke();
  g.restore();
  // voussoirs
  const k = 3 + Math.floor(r() * 2);
  const cuts = [0, ...Array.from({ length: k - 1 }, (_, i) => ((i + 1) / k) * Math.PI + (r() - 0.5) * 0.18), Math.PI];
  const light: Pt = [LIGHT[0], LIGHT[1]];
  for (let i = 0; i < k; i++) {
    const a0 = cuts[i] - (i === 0 ? 0.12 : 0);
    const a1 = cuts[i + 1] + (i === k - 1 ? 0.12 : 0);
    const ex = S * (0.3 + r() * 0.16);
    const outerArc = arc(1, a0, a1, 6, ex, 0.35);
    const innerArc = arc(1, a0, a1, 6).reverse();
    const block = [...outerArc, ...innerArc];
    // la face regarde vers l'extérieur de l'arc : éclairée si elle est tournée vers le soleil
    const am = (a0 + a1) / 2;
    const [nx0, ny0] = P(Math.cos(am), -Math.sin(am));
    const nx = nx0 - x;
    const ny = ny0 - y;
    const d = (nx * light[0] + ny * light[1]) / (Math.hypot(nx, ny) || 1);
    const tone = d > 0.25 ? mixColor(stone, "#f3ead2", 0.42) : d > -0.3 ? stone : mixColor(stone, INK, 0.4);
    g.fillStyle = tone;
    g.fill(shapeOf(block).path);
    if (d <= -0.3) {
      g.save();
      g.clip(shapeOf(block).path);
      g.fillStyle = hatchPattern(g, 7 + i, "\\", 3, 0.8, tint(INK, 0, 0.55));
      g.fill(shapeOf(block).path);
      g.restore();
    }
    // arête claire sur le bord extérieur éclairé
    if (d > -0.3) inkPolyline(g, outerArc.slice(1, -1), r, { width: 1.3, color: "rgba(250,244,226,.7)", wobble: 0.2, taper: 3 });
    inkPolyline(g, block, r, { closed: true, width: 1.6, wobble: 0.35 });
  }
  inkPolyline(g, arc(1, -0.05, Math.PI + 0.05, 22), r, { width: 2.6, wobble: 0.3, taper: 4 });
  // racines et lierre qui pendent du linteau dans le noir
  const roots = 3 + Math.floor(r() * 3);
  for (let i = 0; i < roots; i++) {
    const a = 0.45 + r() * (Math.PI - 0.9);
    const pts: Pt[] = [];
    let u = Math.cos(a) * rx * wob(a);
    let v = -Math.sin(a) * ry * wob(a) + S * 0.06;
    const len = S * (0.18 + r() * 0.3);
    for (let k = 0; k < 5; k++) {
      pts.push(P(u, v));
      u += (r() - 0.5) * 4;
      v += len / 4;
    }
    inkPolyline(g, pts, r, { width: 1.2, color: i % 2 ? "rgba(70,86,40,.95)" : "rgba(90,70,48,.95)", wobble: 0.6, taper: 6 });
  }
  // mousse sur le linteau, côté ombre
  g.fillStyle = "rgba(92,112,50,.8)";
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI;
    const [mx, my] = P(Math.cos(a) * (rx + S * 0.2), -Math.sin(a) * (ry + S * 0.2) + S * 0.06);
    g.beginPath();
    g.arc(mx + (r() - 0.5) * 6, my + (r() - 0.5) * 6, 1 + r() * 1.8, 0, Math.PI * 2);
    g.fill();
  }
}

function sinkhole(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, stone: string) {
  const hole = smoothPoints(blobPoints(r, x, y, S * 0.32, S * 0.26, 9, 0.18));
  g.fillStyle = "#070504";
  g.fill(shapeOf(hole).path);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    pebble(g, r, x + Math.cos(a) * S * 0.38, y + Math.sin(a) * S * 0.32, 3 + r() * 3, stone);
  }
  inkPolyline(g, hole, r, { closed: true, width: 2.2 });
}

// — Ruine —

/**
 * Dallage d'une ruine : une grille de dalles légèrement désaxées (trame tournée, coins déplacés), fendues, dont une ou
 * deux manquent ; l'herbe pousse dans les joints et mange le bord du dallage.
 */
function ruinFloor(g: CanvasRenderingContext2D, r: Rng, room: Room, W: number, H: number, S: number, ok: (x: number, y: number) => boolean, stone: string) {
  const ang = (r() - 0.5) * 0.4;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const cx = (room.x + room.w / 2 + (r() - 0.5) * 0.4) * S;
  const cy = (room.y + room.h / 2 + (r() - 0.5) * 0.4) * S;
  const n = room.w >= 3 && room.h >= 3 ? 5 : 4;
  const step = S * 0.47;
  const okAt = (x: number, y: number) => {
    const gx = Math.floor(x / S);
    const gy = Math.floor(y / S);
    return gx >= 0 && gy >= 0 && gx < W && gy < H && ok(gx, gy);
  };
  const missing = new Set<number>();
  const nMiss = 1 + Math.floor(r() * 3);
  for (let k = 0; k < nMiss; k++) missing.add(Math.floor(r() * n * n));
  // coins de la trame partagés par les dalles voisines (déplacés au hasard) : les joints restent parallèles, inégaux
  const grid: Pt[][] = [];
  for (let j = 0; j <= n; j++) {
    const row: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const u = (i - n / 2) * step + (r() - 0.5) * 4;
      const v = (j - n / 2) * step + (r() - 0.5) * 4;
      row.push([cx + ca * u - sa * v, cy + sa * u + ca * v]);
    }
    grid.push(row);
  }
  const grassInk = new Path2D();
  const grassLight = new Path2D();
  const crack = new Path2D();
  const blade = (p: Path2D, x: number, y: number, k: number, len: number) => {
    for (let b = 0; b < k; b++) {
      const a = -Math.PI / 2 + (b - (k - 1) / 2) * 0.35 + (r() - 0.5) * 0.3;
      const l = len * (0.6 + r() * 0.6);
      p.moveTo(x + (b - (k - 1) / 2) * 1.2, y);
      p.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 1, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    }
  };
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const idx = j * n + i;
      const corners = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
      const mid = centroid(corners);
      if (!corners.every(([x, y]) => okAt(x, y))) continue;
      // dalle manquante : un creux de terre où l'herbe a repris
      if (missing.has(idx)) {
        for (let k = 0; k < 3; k++) blade(r() < 0.6 ? grassInk : grassLight, mid[0] + (r() - 0.5) * step * 0.6, mid[1] + (r() - 0.5) * step * 0.6, 3 + Math.floor(r() * 4), 6 + r() * 5);
        continue;
      }
      // joints : la dalle est rentrée d'un pixel et demi vers son centre
      const pts = corners.map(([x, y]) => [x + (mid[0] - x) * 0.06, y + (mid[1] - y) * 0.06] as Pt);
      // bord extérieur du dallage : l'herbe a mangé un coin
      const outer = i === 0 || j === 0 || i === n - 1 || j === n - 1;
      if (outer && r() < 0.55) {
        const k = Math.floor(r() * 4);
        const [px, py] = pts[k];
        pts[k] = [px + (mid[0] - px) * (0.3 + r() * 0.3), py + (mid[1] - py) * (0.3 + r() * 0.3)];
      }
      g.fillStyle = "rgba(20,14,8,.3)";
      g.fill(shapeOf(pts.map(([px, py]) => [px + 1.2, py + 1.6] as Pt)).path);
      g.fillStyle = tint(mixColor(stone, "#e6e0cc", 0.22), (r() - 0.5) * 0.12, 0.95);
      g.fill(shapeOf(pts).path);
      // usure : un côté de la dalle hachuré (le plus enfoncé), en traits fins
      if (r() < 0.5) {
        const e = Math.floor(r() * 4);
        const [ax, ay] = pts[e];
        const [bx, by] = pts[(e + 1) % 4];
        const hp = new Path2D();
        for (let t = 0.1; t < 0.9; t += 0.11 + r() * 0.05) {
          const x = ax + (bx - ax) * t;
          const y = ay + (by - ay) * t;
          hp.moveTo(x, y);
          hp.lineTo(x + (mid[0] - x) * (0.18 + r() * 0.15), y + (mid[1] - y) * (0.18 + r() * 0.15));
        }
        g.strokeStyle = tint(INK, 0, 0.4);
        g.lineWidth = 0.7;
        g.stroke(hp);
      }
      inkPolyline(g, [pts[3], pts[0], pts[1]], r, { width: 0.9, color: "rgba(250,246,232,.45)", taper: 2, wobble: 0.2 });
      inkPolyline(g, pts, r, { closed: true, width: 0.9, wobble: 0.35, color: tint(INK, 0, 0.8) });
      // fente en Y
      if (r() < 0.45) {
        const a0 = pts[Math.floor(r() * 4)];
        const m: Pt = [mid[0] + (r() - 0.5) * step * 0.3, mid[1] + (r() - 0.5) * step * 0.3];
        crack.moveTo(a0[0] + (mid[0] - a0[0]) * 0.1, a0[1] + (mid[1] - a0[1]) * 0.1);
        crack.lineTo(m[0], m[1]);
        const b0 = pts[Math.floor(r() * 4)];
        crack.lineTo(m[0] + (b0[0] - m[0]) * 0.8, m[1] + (b0[1] - m[1]) * 0.8);
        crack.moveTo(m[0], m[1]);
        crack.lineTo(m[0] + (r() - 0.5) * step * 0.4, m[1] + (r() - 0.5) * step * 0.4);
      }
      // herbe dans les joints : quelques touffes à cheval sur les arêtes
      for (let e = 0; e < 4; e++) {
        if (r() < 0.45) continue;
        const [ax, ay] = corners[e];
        const [bx, by] = corners[(e + 1) % 4];
        const t = r();
        blade(r() < 0.6 ? grassInk : grassLight, ax + (bx - ax) * t, ay + (by - ay) * t, 2 + Math.floor(r() * 3), 4 + r() * 4);
      }
    }
  g.strokeStyle = tint(INK, 0, 0.7);
  g.lineWidth = 0.7;
  g.stroke(crack);
  g.lineCap = "round";
  g.strokeStyle = "rgba(52,62,30,.85)";
  g.lineWidth = 1;
  g.stroke(grassInk);
  g.strokeStyle = "rgba(170,160,96,.8)";
  g.lineWidth = 0.9;
  g.stroke(grassLight);
}

/**
 * Ruine debout : un muret en appareillage (deux rangs de moellons de longueurs inégales, jointifs, cernés d'encre) qui
 * suit deux ou trois côtés de la ruine, avec une brèche d'une case ; sa paroi tournée vers le sud-est est hachurée, son
 * ombre portée nette ; une traînée d'éboulis s'étale d'un côté. Au milieu, une colonne couchée : fût en tambours séparés
 * par des fentes, section ronde à la cassure, base carrée à l'autre bout. Mousse et lierre.
 */
function ruinWalls(g: CanvasRenderingContext2D, r: Rng, room: Room, W: number, H: number, S: number, ok: (x: number, y: number) => boolean, stone: string, veg: string) {
  const okAt = (x: number, y: number) => {
    const gx = Math.floor(x / S);
    const gy = Math.floor(y / S);
    return gx >= 0 && gy >= 0 && gx < W && gy < H && ok(gx, gy);
  };
  const x0 = (room.x + 0.2) * S;
  const y0 = (room.y + 0.2) * S;
  const x1 = (room.x + room.w - 0.2) * S;
  const y1 = (room.y + room.h - 0.2) * S;
  const corners: Pt[] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  // deux ou trois côtés qui se suivent, puis la brèche d'une case quelque part au milieu
  const start = Math.floor(r() * 4);
  const nSides = r() < 0.55 ? 2 : 3;
  const poly: Pt[] = [];
  for (let k = 0; k <= nSides; k++) poly.push(corners[(start + k) % 4]);
  const segs: { a: Pt; tx: number; ty: number; s0: number; s1: number }[] = [];
  let total = 0;
  for (let k = 0; k < nSides; k++) {
    const a = poly[k];
    const b = poly[k + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, tx: (b[0] - a[0]) / len, ty: (b[1] - a[1]) / len, s0: total, s1: total + len });
    total += len;
  }
  const breach = total * (0.3 + r() * 0.4);
  const endA = r() * S * 0.4;
  const endB = total - r() * S * 0.5;
  const th = S * 0.3;
  const stoneLit = mixColor(stone, "#ece6d4", 0.25);
  const face = mixColor(stone, INK, 0.5);
  interface Block {
    pts: Pt[];
    h: number;
  }
  const blocks: Block[] = [];
  for (const sg of segs) {
    const nx = -sg.ty;
    const ny = sg.tx;
    for (const row of [0, 1]) {
      let s = Math.max(sg.s0, endA) + (row ? r() * S * 0.12 : 0);
      while (s < Math.min(sg.s1, endB)) {
        const l = S * (0.12 + r() * 0.2);
        const e = Math.min(sg.s1, endB, s + l);
        if (e - s < 3) break;
        const midS = (s + e) / 2;
        if (Math.abs(midS - breach) < S * 0.5) {
          s = e;
          continue;
        }
        // hauteur : plus basse près des bouts cassés et de la brèche
        const f = Math.min(1, (midS - endA) / (S * 0.8), (endB - midS) / (S * 0.8), Math.abs(midS - breach) / (S * 1.2));
        const h = S * (0.12 + 0.3 * f) * (0.8 + r() * 0.35);
        const v0 = -th / 2 + row * (th / 2) + 0.5 + (r() - 0.5) * 1.2;
        const v1 = v0 + th / 2 - 1 + (r() - 0.5) * 1.2;
        const u0 = s - sg.s0 + 0.6;
        const u1 = e - sg.s0 - 0.6;
        const P = (u: number, v: number): Pt => [sg.a[0] + sg.tx * u + nx * v + (r() - 0.5) * 0.8, sg.a[1] + sg.ty * u + ny * v + (r() - 0.5) * 0.8];
        const pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
        if (pts.every(([x, y]) => okAt(x, y))) blocks.push({ pts, h });
        s = e;
      }
    }
  }
  // ombres portées (un seul tracé : une seule valeur), parois, puis dessus des moellons, du fond vers l'avant
  const shadow = new Path2D();
  for (const b of blocks) shadow.addPath(shapeOf(hull([...b.pts, ...b.pts.map(([x, y]) => [x + SUN[0] * b.h, y + SUN[1] * b.h] as Pt)])).path);
  g.fillStyle = "rgba(16,10,5,.38)";
  g.fill(shadow, "nonzero");
  blocks.sort((p, q) => centroid(p.pts)[1] - centroid(q.pts)[1]);
  const lift = (b: Block) => b.pts.map(([x, y]) => [x - SUN[0] * b.h * 0.3, y - SUN[1] * b.h * 0.3] as Pt);
  for (const b of blocks) {
    const up = lift(b);
    const side = shapeOf(hull([...b.pts, ...up])).path;
    g.fillStyle = face;
    g.fill(side);
    // paroi : hachures serrées dans le sens de la hauteur
    const hp = new Path2D();
    for (const [x, y] of b.pts) {
      for (let k = -2; k <= 2; k++) {
        hp.moveTo(x + k * 1.6, y + k * 0.4);
        hp.lineTo(x + k * 1.6 - SUN[0] * b.h * 0.3, y + k * 0.4 - SUN[1] * b.h * 0.3);
      }
    }
    g.save();
    g.clip(side);
    g.strokeStyle = tint(INK, 0, 0.55);
    g.lineWidth = 0.7;
    g.stroke(hp);
    g.restore();
    b.pts = up;
  }
  const mossP = new Path2D();
  for (const b of blocks) {
    g.fillStyle = tint(stoneLit, (r() - 0.5) * 0.12);
    g.fill(shapeOf(b.pts).path);
    inkPolyline(g, [b.pts[3], b.pts[0], b.pts[1]], r, { width: 0.8, color: "rgba(252,248,232,.5)", taper: 2, wobble: 0.2 });
    inkPolyline(g, b.pts, r, { closed: true, width: 1.05, wobble: 0.3 });
    if (r() < 0.3) {
      const [cx, cy] = centroid(b.pts);
      for (let i = 0; i < 5; i++) {
        const u = cx + (r() - 0.5) * 7;
        const v = cy + (r() - 0.5) * 4;
        const s = 0.6 + r() * 1;
        mossP.moveTo(u + s, v);
        mossP.arc(u, v, s, 0, Math.PI * 2);
      }
    }
  }
  g.fillStyle = mixColor(veg, "#7d9a2c", 0.5);
  g.fill(mossP);
  // éboulis : d'un seul côté du mur, denses au pied et de plus en plus rares en s'éloignant
  const out = r() < 0.5 ? -1 : 1;
  for (const sg of segs) {
    const nx = -sg.ty * out;
    const ny = sg.tx * out;
    for (let s = sg.s0; s < sg.s1; s += 3 + r() * 6) {
      const d = th * 0.6 + Math.pow(r(), 1.8) * S * 0.9;
      const u = s - sg.s0;
      const x = sg.a[0] + sg.tx * u + nx * d + (r() - 0.5) * 4;
      const y = sg.a[1] + sg.ty * u + ny * d + (r() - 0.5) * 4;
      if (!okAt(x, y)) continue;
      scree(g, r, x, y, d < S * 0.35 ? 2.5 + r() * 3.5 : 1.5 + r() * 2, stone);
    }
  }
  // près de la brèche, un moellon entier tombé
  for (const sg of segs) {
    if (breach < sg.s0 || breach > sg.s1) continue;
    const u = breach - sg.s0;
    const x = sg.a[0] + sg.tx * u - sg.ty * out * S * 0.35;
    const y = sg.a[1] + sg.ty * u + sg.tx * out * S * 0.35;
    if (okAt(x, y)) scree(g, r, x, y, 5 + r() * 2, stone);
  }
  fallenColumn(g, r, room, S, okAt, stone, veg);
}

/** Colonne couchée vue de dessus : fût en tambours (rectangle long ombré en cylindre), cassure ronde, base carrée. */
function fallenColumn(g: CanvasRenderingContext2D, r: Rng, room: Room, S: number, okAt: (x: number, y: number) => boolean, stone: string, veg: string) {
  const cx0 = (room.x + room.w / 2) * S;
  const cy0 = (room.y + room.h / 2) * S;
  const rad = S * (0.19 + r() * 0.04);
  const L = S * (1.7 + r() * 0.5);
  const a0 = r() * Math.PI;
  let pick: [number, number, number] | null = null;
  for (let k = 0; k < 8 && !pick; k++) {
    const a = a0 + (k * Math.PI) / 8;
    const ox = cx0 + (r() - 0.5) * S * 0.6;
    const oy = cy0 + (r() - 0.5) * S * 0.6;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const ends = [-L / 2 - rad, 0, L / 2 + rad].flatMap((t) => [
      [ox + ux * t - uy * rad * 1.3, oy + uy * t + ux * rad * 1.3],
      [ox + ux * t + uy * rad * 1.3, oy + uy * t - ux * rad * 1.3],
    ]);
    if (ends.every(([x, y]) => okAt(x, y))) pick = [ox, oy, a];
  }
  if (!pick) return;
  const [ox, oy, a] = pick;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const nx = -uy;
  const ny = ux;
  const P = (t: number, v: number): Pt => [ox + ux * t + nx * v, oy + uy * t + ny * v];
  // côté ombre du fût : celui dont la normale regarde à l'opposé de la lumière
  const sh = nx * SUN[0] + ny * SUN[1] > 0 ? 1 : -1;
  const lit = mixColor(stone, "#efe9d8", 0.3);
  const body = [P(-L / 2, -rad), P(L / 2, -rad), P(L / 2, rad), P(-L / 2, rad)];
  castShadow(g, body, rad * 2, "rgba(16,10,5,.4)");
  // base carrée, à un bout
  const bs = rad * 1.35;
  const base = [P(-L / 2 - bs * 0.9, -bs), P(-L / 2 + bs * 0.5, -bs), P(-L / 2 + bs * 0.5, bs), P(-L / 2 - bs * 0.9, bs)];
  castShadow(g, base, bs, "rgba(16,10,5,.4)");
  g.fillStyle = tint(lit, -0.04);
  g.fill(shapeOf(base).path);
  inkPolyline(g, base, r, { closed: true, width: 1.3, wobble: 0.3 });
  // tambours, séparés par des fentes et un peu désaxés
  let t = -L / 2 + bs * 0.5;
  const drums: Pt[][] = [];
  while (t < L / 2 - 2) {
    const l = Math.min(L / 2 - t, S * (0.42 + r() * 0.2));
    const off = (r() - 0.5) * 1.6;
    drums.push([P(t + 0.8, -rad + off), P(t + l - 0.8, -rad + off), P(t + l - 0.8, rad + off), P(t + 0.8, rad + off)]);
    t += l;
  }
  for (const d of drums) {
    const sp = shapeOf(d).path;
    g.fillStyle = lit;
    g.fill(sp);
    // modelé du cylindre : la moitié côté ombre en lavis, puis des hachures parallèles à l'axe, serrées vers le bord
    const [p0, p1, p2, p3] = d;
    const m0: Pt = [(p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2];
    const m1: Pt = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const half = sh > 0 ? [m0, m1, p2, p3] : [p0, p1, m1, m0];
    g.fillStyle = tint(mixColor(stone, INK, 0.3), 0, 0.55);
    g.fill(shapeOf(half).path);
    const hp = new Path2D();
    for (const v of [0.35, 0.55, 0.7, 0.82, 0.92]) {
      const vv = v * rad * sh;
      const q0 = [m0[0] + nx * vv, m0[1] + ny * vv];
      const q1 = [m1[0] + nx * vv, m1[1] + ny * vv];
      const a1 = 0.05 + r() * 0.2;
      const b1 = 0.8 + r() * 0.15;
      hp.moveTo(q0[0] + (q1[0] - q0[0]) * a1, q0[1] + (q1[1] - q0[1]) * a1);
      hp.lineTo(q0[0] + (q1[0] - q0[0]) * b1, q0[1] + (q1[1] - q0[1]) * b1);
    }
    g.strokeStyle = tint(INK, 0, 0.5);
    g.lineWidth = 0.75;
    g.stroke(hp);
    // cannelure : un trait fin côté lumière
    const k = -0.45 * rad * sh;
    inkPolyline(g, [[m0[0] + nx * k, m0[1] + ny * k], [m1[0] + nx * k, m1[1] + ny * k]], r, { width: 0.6, wobble: 0.2, color: tint(INK, 0, 0.35) });
    inkPolyline(g, d, r, { closed: true, width: 1.2, wobble: 0.3 });
  }
  // cassure : la section ronde du fût, plus sombre, cernée, avec ses éclats
  const [ex, ey] = P(L / 2, 0);
  g.save();
  g.translate(ex, ey);
  g.rotate(a);
  g.beginPath();
  g.ellipse(0, 0, rad * 0.38, rad, 0, 0, Math.PI * 2);
  g.fillStyle = mixColor(stone, INK, 0.2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.stroke();
  g.beginPath();
  g.ellipse(0, 0, rad * 0.2, rad * 0.55, 0, 0, Math.PI * 2);
  g.strokeStyle = tint(INK, 0, 0.45);
  g.lineWidth = 0.7;
  g.stroke();
  g.restore();
  for (let k = 0; k < 4; k++) {
    const d = rad * 0.8 + r() * S * 0.4;
    const o = (r() - 0.5) * rad * 2;
    const x = ex + ux * d + nx * o;
    const y = ey + uy * d + ny * o;
    if (okAt(x, y)) scree(g, r, x, y, 1.5 + r() * 2.5, stone);
  }
  // lierre sur le fût
  if (r() < 0.7) {
    const ivy = mixColor(veg, "#2b3a1c", 0.4);
    const t0 = (r() - 0.5) * L * 0.5;
    for (let k = 0; k < 7; k++) {
      const [px, py] = P(t0 + (k - 3) * 4 + (r() - 0.5) * 3, (r() - 0.5) * rad * 1.6);
      g.fillStyle = ivy;
      g.beginPath();
      g.ellipse(px, py, 2.4, 1.5, r() * 3, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = tint(INK, 0, 0.7);
      g.lineWidth = 0.5;
      g.stroke();
    }
  }
}

// — Vestiges propres au genre —

/**
 * Deux ou trois vestiges qui disent où l'on est : barque retournée et cordage sur la rive, tonneau éventré (pirates,
 * western) ; carcasse de voiture rouillée et pneus (post-apo) ; débris d'une capsule tombée (science-fiction). En
 * fantasy, rien de plus (les ruines et les campements suffisent). Posés sur la prairie, loin des chemins ; ils ne
 * changent aucune case.
 */
function paintRelics(c: MapCtx, w: Wild, reserved: Uint8Array) {
  const { map, theme, g, W, H, S, material } = c;
  if (material === "pierre") return;
  const seed = map.seed;
  const r = rng(seed, 470);
  const free = (x: number, y: number) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 && map.tiles[y * W + x] === T.sol && !reserved[y * W + x];
  const near = (x: number, y: number, t: number, rad: number) => {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (w.tile(x + dx, y + dy) === t) return true;
    return false;
  };
  // places : deux cases libres côte à côte, loin des chemins ; au bord de l'eau d'abord pour la barque
  const spots: [number, number, boolean][] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 2; x++) {
      if (!free(x, y) || !free(x + 1, y) || near(x, y, T.route, 1) || near(x + 1, y, T.route, 1)) continue;
      spots.push([x, y, near(x, y, T.eau, 1) || near(x + 1, y, T.eau, 1)]);
    }
  if (!spots.length) return;
  const taken: Pt[] = [];
  const take = (wantWater: boolean) => {
    for (let k = 0; k < 40; k++) {
      const s = spots[Math.floor(r() * spots.length)];
      if (wantWater && !s[2] && k < 30) continue;
      if (taken.some(([x, y]) => Math.hypot(x - s[0], y - s[1]) < 7)) continue;
      taken.push([s[0], s[1]]);
      return s;
    }
    return null;
  };
  const wood = muted(mixColor(theme.door, "#6f5a42", 0.6), 0.35);
  const rust = "#7a4426";
  const metal = mixColor(theme.wall, "#8a9098", 0.6);
  const n = 2 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const s = take(material === "planches" && i === 0);
    if (!s) break;
    const x = (s[0] + 1) * S;
    const y = (s[1] + 0.5) * S;
    const a = (r() - 0.5) * 0.9;
    const rr = rng(seed, s[0], s[1], 471);
    if (material === "planches") {
      if (i === 0) rowboat(g, rr, x, y, a, S, wood);
      else barrel(g, rr, x + (r() - 0.5) * S * 0.4, y, S, wood);
    } else if (material === "terre") {
      if (i % 2 === 0) carcass(g, rr, x, y, a, S, rust);
      else for (let k = 0; k < 2 + Math.floor(rr() * 2); k++) tire(g, rr, x + (rr() - 0.5) * S * 0.9, y + (rr() - 0.5) * S * 0.5, S);
    } else podDebris(g, rr, x, y, S, metal);
  }
}

/** Ombre portée d'un objet bas posé au sol (forme décalée le long du soleil). */
function lowShadow(g: CanvasRenderingContext2D, pts: Pt[], h: number) {
  castShadow(g, pts, h, "rgba(16,10,5,.4)");
}

/** Barque retournée sur la rive : coque en fuseau, quille au milieu, bordages, un cordage lové à côté. */
function rowboat(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, a: number, S: number, wood: string) {
  const L = S * 0.85;
  const B = S * 0.32;
  const P = (u: number, v: number): Pt => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v];
  const hullPts: Pt[] = [];
  for (let k = 0; k <= 16; k++) {
    const t = (k / 16) * Math.PI * 2;
    const u = Math.cos(t) * L;
    // fuseau : pointu à la proue (u > 0), arrondi à la poupe
    const v = Math.sin(t) * B * (u > 0 ? 1 - (u / L) ** 2 * 0.75 : 1 - (u / L) ** 4 * 0.5);
    hullPts.push(P(u, v));
  }
  lowShadow(g, hullPts, S * 0.18);
  g.fillStyle = tint(wood, 0.05);
  g.fill(shapeOf(hullPts).path);
  // flanc à l'ombre
  g.save();
  g.clip(shapeOf(hullPts).path);
  g.fillStyle = tint(mixColor(wood, INK, 0.45), 0, 0.7);
  const sh: Pt[] = [P(-L, 0), P(L, 0), P(L, B * 2), P(-L, B * 2)];
  g.fill(shapeOf(sh).path);
  // bordages : lignes qui suivent la coque
  const planks = new Path2D();
  for (const f of [-0.66, -0.33, 0.33, 0.66]) {
    for (let k = 0; k <= 12; k++) {
      const u = -L + (k / 12) * L * 2;
      const v = f * B * (u > 0 ? 1 - (u / L) ** 2 * 0.75 : 1 - (u / L) ** 4 * 0.5);
      const [px, py] = P(u, v);
      if (k) planks.lineTo(px, py);
      else planks.moveTo(px, py);
    }
  }
  g.strokeStyle = tint(INK, 0, 0.55);
  g.lineWidth = 0.7;
  g.stroke(planks);
  g.restore();
  inkPolyline(g, [P(-L * 0.95, 0), P(L * 0.98, 0)], r, { width: 1.6, wobble: 0.2, color: tint(INK, 0, 0.85) });
  inkPolyline(g, hullPts, r, { closed: true, width: 1.5, wobble: 0.3 });
  // cordage lové
  const [cx, cy] = P(-L * 0.6, B * 2.1);
  const coil = new Path2D();
  for (let k = 0; k < 4; k++) {
    coil.moveTo(cx + 8 - k * 1.7, cy);
    coil.ellipse(cx, cy, 8 - k * 1.7, 6 - k * 1.3, a, 0, Math.PI * 2);
  }
  g.strokeStyle = "#8a7550";
  g.lineWidth = 1.6;
  g.stroke(coil);
  g.strokeStyle = tint(INK, 0, 0.6);
  g.lineWidth = 0.5;
  g.stroke(coil);
  inkPolyline(g, [[cx + 5, cy], [cx + 10, cy - 4 + r() * 3], [cx + 15, cy - 2 + r() * 4]], r, { width: 1.2, wobble: 0.6, color: "#6a5a3c" });
}

/** Tonneau éventré, couché : douelles, cercles de fer, quelques douelles tombées à côté. */
function barrel(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, wood: string) {
  const a = r() * Math.PI;
  const L = S * 0.3;
  const R = S * 0.18;
  const P = (u: number, v: number): Pt => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v];
  const body: Pt[] = [];
  for (let k = 0; k <= 12; k++) body.push(P(-L + (k / 12) * L * 2, -R * (0.85 + Math.sin((k / 12) * Math.PI) * 0.15)));
  for (let k = 12; k >= 0; k--) body.push(P(-L + (k / 12) * L * 2, R * (0.85 + Math.sin((k / 12) * Math.PI) * 0.15)));
  lowShadow(g, body, R * 1.4);
  g.fillStyle = wood;
  g.fill(shapeOf(body).path);
  const st = new Path2D();
  for (const f of [-0.5, 0, 0.5]) {
    const [p, q] = [P(-L, f * R), P(L, f * R)];
    st.moveTo(p[0], p[1]);
    st.lineTo(q[0], q[1]);
  }
  g.strokeStyle = tint(INK, 0, 0.5);
  g.lineWidth = 0.7;
  g.stroke(st);
  for (const u of [-L * 0.6, L * 0.6]) inkPolyline(g, [P(u, -R), P(u, R)], r, { width: 1.8, wobble: 0.1, color: "#3a3430" });
  inkPolyline(g, body, r, { closed: true, width: 1.3, wobble: 0.3 });
  const [ex, ey] = P(L, 0);
  g.fillStyle = "#1a120a";
  g.beginPath();
  g.ellipse(ex, ey, R * 0.35, R * 0.85, a, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 3; k++) {
    const d = S * (0.3 + r() * 0.3);
    const b = a + (r() - 0.5) * 1.5;
    const sx = ex + Math.cos(b) * d;
    const sy = ey + Math.sin(b) * d;
    const c = b + Math.PI / 2 + (r() - 0.5);
    const stave: Pt[] = [
      [sx - Math.cos(c) * 6, sy - Math.sin(c) * 6],
      [sx + Math.cos(c) * 6, sy + Math.sin(c) * 6],
    ];
    inkPolyline(g, stave, r, { width: 3, wobble: 0.1, color: tint(wood, -0.05) });
    inkPolyline(g, stave, r, { width: 0.6, wobble: 0.1, color: tint(INK, 0, 0.7) });
  }
}

/** Carcasse de voiture vue de dessus : caisse aux angles arrondis, toit enfoncé, vitres crevées, rouille en coulures. */
function carcass(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, a: number, S: number, rust: string) {
  const L = S * 0.82;
  const B = S * 0.36;
  const P = (u: number, v: number): Pt => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v];
  const box = (l: number, b: number, k: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < 4; i++) {
      const cx = (i === 0 || i === 3 ? -1 : 1) * (l - k);
      const cy = (i < 2 ? -1 : 1) * (b - k);
      const a0 = [Math.PI, -Math.PI / 2, 0, Math.PI / 2][i];
      for (let j = 0; j <= 3; j++) {
        const t = a0 + (j / 3) * (Math.PI / 2);
        out.push(P(cx + Math.cos(t) * k, cy + Math.sin(t) * k));
      }
    }
    return out;
  };
  const shell = box(L, B, S * 0.12);
  lowShadow(g, shell, S * 0.3);
  // pneus crevés aux quatre coins
  g.fillStyle = "#1b1714";
  for (const [u, v] of [[-0.62, -1.05], [0.62, -1.05], [0.62, 1.05], [-0.62, 1.05]] as const) {
    const [px, py] = P(u * L, v * B);
    g.beginPath();
    g.ellipse(px, py, S * 0.11, S * 0.05, a, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = mixColor(rust, "#6d6a5e", 0.35);
  g.fill(shapeOf(shell).path);
  // coulures de rouille et plaques de peinture qui restent
  g.save();
  g.clip(shapeOf(shell).path);
  for (let k = 0; k < 16; k++) {
    const [px, py] = P((r() - 0.5) * L * 2, (r() - 0.5) * B * 2);
    const u = r();
    g.fillStyle = u < 0.45 ? tint("#4a2412", 0, 0.75) : u < 0.75 ? tint("#b0602c", 0, 0.6) : tint("#5f6b62", 0, 0.7);
    g.beginPath();
    g.ellipse(px, py, 2 + r() * 7, 1.5 + r() * 3.5, a + (r() - 0.5), 0, Math.PI * 2);
    g.fill();
  }
  // flanc sud-est à l'ombre, hachuré
  const hp = new Path2D();
  for (let u = -L; u < L; u += 2.2) {
    const [p, q] = [P(u, B * 0.55), P(u + 1.5, B)];
    hp.moveTo(p[0], p[1]);
    hp.lineTo(q[0], q[1]);
  }
  g.strokeStyle = tint(INK, 0, 0.5);
  g.lineWidth = 0.7;
  g.stroke(hp);
  g.restore();
  inkPolyline(g, shell, r, { closed: true, width: 1.6, wobble: 0.3 });
  // toit et vitres : pare-brise noir, lunette arrière crevée
  const roof = box(L * 0.42, B * 0.78, S * 0.06).map(([u, v]) => [u + Math.cos(a) * -S * 0.05, v + Math.sin(a) * -S * 0.05] as Pt);
  g.fillStyle = mixColor(rust, "#4a4038", 0.5);
  g.fill(shapeOf(roof).path);
  inkPolyline(g, roof, r, { closed: true, width: 1.1, wobble: 0.3 });
  const glass = (u0: number, u1: number) => [P(u0, -B * 0.72), P(u1, -B * 0.66), P(u1, B * 0.66), P(u0, B * 0.72)];
  g.fillStyle = "#151311";
  g.fill(shapeOf(glass(L * 0.42, L * 0.62)).path);
  g.fill(shapeOf(glass(-L * 0.68, -L * 0.52)).path);
  inkPolyline(g, [P(L * 0.62, -B * 0.5), P(L * 0.5, -B * 0.1), P(L * 0.58, B * 0.3)], r, { width: 0.6, color: "rgba(220,220,210,.5)" });
  // capot : deux nervures
  for (const v of [-0.35, 0.35]) inkPolyline(g, [P(L * 0.66, v * B), P(L * 0.95, v * B * 0.9)], r, { width: 0.7, color: tint(INK, 0, 0.6) });
}

/** Pneu abandonné, vu de dessus : anneau noir, sculptures, herbe qui pousse au milieu. */
function tire(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number) {
  const R = S * (0.13 + r() * 0.04);
  g.fillStyle = "rgba(16,10,5,.4)";
  g.beginPath();
  g.arc(x + 2.5, y + 3.2, R, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#211d1a";
  g.beginPath();
  g.arc(x, y, R, 0, Math.PI * 2);
  g.arc(x, y, R * 0.5, 0, Math.PI * 2, true);
  g.fill("evenodd");
  const tr = new Path2D();
  for (let k = 0; k < 18; k++) {
    const t = (k / 18) * Math.PI * 2;
    tr.moveTo(x + Math.cos(t) * R * 0.75, y + Math.sin(t) * R * 0.75);
    tr.lineTo(x + Math.cos(t + 0.1) * R * 0.98, y + Math.sin(t + 0.1) * R * 0.98);
  }
  g.strokeStyle = "rgba(120,112,100,.6)";
  g.lineWidth = 0.7;
  g.stroke(tr);
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(x, y, R, 0, Math.PI * 2);
  g.stroke();
}

/** Débris d'une capsule tombée : cratère peu profond, plaques de blindage tordues, un feu de position éteint. */
function podDebris(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, metal: string) {
  const crater = smoothPoints(blobPoints(r, x, y, S * 0.6, S * 0.42, 9, 0.2), 2);
  g.fillStyle = "rgba(40,30,20,.35)";
  g.fill(shapeOf(crater).path);
  inkPolyline(g, crater, r, { closed: true, width: 1, wobble: 0.5, color: tint(INK, 0, 0.5) });
  for (let k = 0; k < 5; k++) {
    const px = x + (r() - 0.5) * S * 0.9;
    const py = y + (r() - 0.5) * S * 0.6;
    const s = S * (0.08 + r() * 0.12);
    const m = 4 + Math.floor(r() * 2);
    const pts = Array.from({ length: m }, (_, i) => {
      const t = (i / m) * Math.PI * 2 + r() * 0.5;
      return [px + Math.cos(t) * s * (0.6 + r() * 0.6), py + Math.sin(t) * s * (0.5 + r() * 0.5)] as Pt;
    });
    lowShadow(g, pts, s * 0.5);
    g.fillStyle = tint(metal, (r() - 0.5) * 0.15);
    g.fill(shapeOf(pts).path);
    inkPolyline(g, [pts[0], pts[1]], r, { width: 0.8, color: "rgba(240,244,250,.6)" });
    inkPolyline(g, pts, r, { closed: true, width: 1.1, wobble: 0.2 });
  }
  g.fillStyle = "#c2452a";
  g.beginPath();
  g.arc(x + (r() - 0.5) * 10, y + (r() - 0.5) * 8, 1.8, 0, Math.PI * 2);
  g.fill();
}

// — Tour de guet, clairière —

/**
 * Tour de guet vue d'en haut : plan carré en pierres appareillées, chemin de ronde crénelé (merlons clairs, créneaux
 * sombres), plancher de bois à l'intérieur avec sa trappe, paroi visible au sud-est et ombre portée d'une demi-case.
 */
function watchtower(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, wood: string, stone: string) {
  const o = S * 0.44;
  const th = S * 0.13;
  const lift = 4;
  const sq = (h: number, dx = 0, dy = 0): Pt[] => [[x - h + dx, y - h + dy], [x + h + dx, y - h + dy], [x + h + dx, y + h + dy], [x - h + dx, y + h + dy]];
  const foot = sq(o);
  castShadow(g, foot, S * 0.5, "rgba(14,9,5,.42)");
  // paroi au sud-est : le haut du mur est décalé vers la lumière
  const top = sq(o, -SUN[0] * lift, -SUN[1] * lift);
  g.fillStyle = mixColor(stone, INK, 0.55);
  g.fill(shapeOf(hull([...foot, ...top])).path);
  g.strokeStyle = tint(INK, 0, 0.5);
  g.lineWidth = 0.7;
  g.beginPath();
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    g.moveTo(foot[1][0] - 1, foot[1][1] + (foot[2][1] - foot[1][1]) * t);
    g.lineTo(top[1][0], top[1][1] + (top[2][1] - top[1][1]) * t);
    g.moveTo(foot[3][0] + (foot[2][0] - foot[3][0]) * t, foot[3][1] - 1);
    g.lineTo(top[3][0] + (top[2][0] - top[3][0]) * t, top[3][1]);
  }
  g.stroke();
  const cx = x - SUN[0] * lift;
  const cy = y - SUN[1] * lift;
  // plancher intérieur, dans l'ombre du mur nord-ouest
  const inner = sq(o - th, -SUN[0] * lift, -SUN[1] * lift);
  g.fillStyle = mixColor(wood, INK, 0.25);
  g.fill(shapeOf(inner).path);
  g.strokeStyle = tint(INK, 0, 0.45);
  g.lineWidth = 0.7;
  g.beginPath();
  const iw = (o - th) * 2;
  for (let k = 1; k < 5; k++) {
    const yy = inner[0][1] + (iw * k) / 5;
    g.moveTo(inner[0][0], yy);
    g.lineTo(inner[1][0], yy);
  }
  g.stroke();
  // trappe et échelle
  const tx = cx + (o - th) * 0.25;
  const ty = cy + (o - th) * 0.2;
  const ts = S * 0.13;
  g.fillStyle = "#120c07";
  g.fillRect(tx - ts, ty - ts, ts * 2, ts * 2);
  g.strokeStyle = mixColor(wood, "#e2cfa0", 0.2);
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(tx - ts * 0.5, ty - ts);
  g.lineTo(tx - ts * 0.5, ty + ts);
  g.moveTo(tx + ts * 0.5, ty - ts);
  g.lineTo(tx + ts * 0.5, ty + ts);
  for (let k = -1; k <= 1; k++) {
    g.moveTo(tx - ts * 0.5, ty + k * ts * 0.55);
    g.lineTo(tx + ts * 0.5, ty + k * ts * 0.55);
  }
  g.stroke();
  inkPolyline(g, [[tx - ts, ty - ts], [tx + ts, ty - ts], [tx + ts, ty + ts], [tx - ts, ty + ts]], r, { closed: true, width: 0.9, wobble: 0.1 });
  // ombre du mur nord-ouest sur le plancher
  g.fillStyle = "rgba(14,9,5,.42)";
  g.fill(shapeOf([inner[0], inner[1], [inner[1][0] - 3, inner[1][1] + 6], [inner[0][0] + 6, inner[0][1] + 6], [inner[3][0] + 6, inner[3][1] - 3], inner[3]]).path);
  // dessus du mur : moellons, un tour de pierres de tailles inégales
  const ring = new Path2D();
  top.forEach(([px, py], i) => (i ? ring.lineTo(px, py) : ring.moveTo(px, py)));
  ring.closePath();
  [...inner].reverse().forEach(([px, py], i) => (i ? ring.lineTo(px, py) : ring.moveTo(px, py)));
  ring.closePath();
  g.fillStyle = mixColor(stone, "#efe6cf", 0.22);
  g.fill(ring, "evenodd");
  // merlons : un pierre sur deux dépasse, plus claire ; créneaux sombres entre eux
  const sides: [Pt, Pt, Pt, Pt][] = [
    [top[0], top[1], inner[0], inner[1]],
    [top[1], top[2], inner[1], inner[2]],
    [top[2], top[3], inner[2], inner[3]],
    [top[3], top[0], inner[3], inner[0]],
  ];
  sides.forEach(([a, b, ia, ib], si) => {
    const n = 5;
    for (let k = 0; k < n; k++) {
      const t0 = k / n;
      const t1 = (k + 1) / n;
      const P = (u: number, v: number): Pt => {
        const ox = a[0] + (b[0] - a[0]) * u;
        const oy = a[1] + (b[1] - a[1]) * u;
        const ix = ia[0] + (ib[0] - ia[0]) * u;
        const iy = ia[1] + (ib[1] - ia[1]) * u;
        return [ox + (ix - ox) * v, oy + (iy - oy) * v];
      };
      const blk = [P(t0, 0), P(t1, 0), P(t1, 1), P(t0, 1)];
      const merlon = k % 2 === 0;
      const litSide = si === 0 || si === 3;
      g.fillStyle = merlon ? mixColor(stone, "#f3ead6", litSide ? 0.45 : 0.25) : mixColor(stone, INK, litSide ? 0.25 : 0.42);
      g.fill(shapeOf(blk).path);
      if (!merlon) {
        g.save();
        g.clip(shapeOf(blk).path);
        g.fillStyle = hatchPattern(g, 31 + si, "\\", 2.6, 0.7, tint(INK, 0, 0.5));
        g.fill(shapeOf(blk).path);
        g.restore();
      }
      inkPolyline(g, blk, r, { closed: true, width: merlon ? 1 : 0.7, wobble: 0.15, color: tint(INK, 0, merlon ? 0.9 : 0.6) });
      if (merlon && litSide) inkPolyline(g, [blk[0], blk[1]], r, { width: 0.9, color: "rgba(250,244,226,.6)", taper: 2, wobble: 0.1 });
    }
  });
  // mousse et lierre sur un angle
  g.fillStyle = "rgba(96,118,52,.85)";
  const corner = top[Math.floor(r() * 4)];
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    g.arc(corner[0] + (r() - 0.5) * 9, corner[1] + (r() - 0.5) * 9, 0.8 + r() * 1.3, 0, Math.PI * 2);
    g.fill();
  }
  inkPolyline(g, inner, r, { closed: true, width: 1.2, wobble: 0.2 });
  inkPolyline(g, foot, r, { closed: true, width: 1.6, wobble: 0.3 });
  inkPolyline(g, top, r, { closed: true, width: 2.6, wobble: 0.3, pressure: 0.3 });
}

function gladeLight(g: CanvasRenderingContext2D, x: number, y: number, S: number) {
  const grad = g.createRadialGradient(x - S * 0.2, y - S * 0.2, 2, x, y, S * 1.7);
  grad.addColorStop(0, "rgba(255,244,200,.22)");
  grad.addColorStop(1, "rgba(255,244,200,0)");
  g.fillStyle = grad;
  g.fillRect(x - S * 2, y - S * 2, S * 4, S * 4);
}

function glade(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number, wood: string) {
  stump(g, r, x, y, S * 0.2, wood);
  // cercle de champignons
  const n = 10 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.2;
    const d = S * (0.7 + r() * 0.1);
    const mx = x + Math.cos(a) * d;
    const my = y + Math.sin(a) * d * 0.9;
    const s = 2 + r() * 1.4;
    g.fillStyle = "rgba(14,9,5,.4)";
    g.beginPath();
    g.arc(mx + SUN[0] * 2, my + SUN[1] * 2, s, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = r() < 0.6 ? "#e6dcc2" : "#a8432f";
    g.beginPath();
    g.arc(mx, my, s, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 0.7;
    g.stroke();
  }
}
