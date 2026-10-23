// Rendu des donjons, façon plan encré puis lavé à l'aquarelle (l'esprit des plans de Dyson Logos, en couleur) :
// roche sombre hachurée en bande autour des murs, murs épais tracés d'un seul trait, dalles calées sur la grille,
// mobilier selon la salle, portes variées, lumière du haut à gauche, flaques de clarté autour des flammes, grain du papier.
// Purement visuel : les cases (praticable, murs, portes) ne changent jamais, et tout dépend de map.seed.
import { T } from "../../shared/types";
import { isOpen, type MapCtx } from "./mapCommon";
import { hash } from "./mapUtil";
import {
  applyPaper,
  between,
  blobPoints,
  canvas,
  cellContour,
  cellMask,
  hatch,
  INK,
  inkLine,
  inkOutline,
  inkPolyline,
  mixColor,
  noise2,
  pick,
  rectShape,
  rng,
  shapeOf,
  smoothPoints,
  stipple,
  tint,
  washFill,
  withArea,
  type Pt,
  type Rng,
  type Shape,
} from "./mapInk";

type Room = MapCtx["map"]["rooms"][number];

/** Repère local d'un objet : origine, rotation. En local, y s'éloigne du mur contre lequel l'objet est posé. */
interface Frame {
  ox: number;
  oy: number;
  rot: number;
}

interface Light {
  x: number;
  y: number;
  rad: number;
  /** Force de la lueur chaude, 0 à 1. */
  k: number;
}

interface Palette {
  floor: string;
  road: string;
  grout: string;
  wall: string;
  block: string;
  rock: string;
  /** Frange de roche autour des murs, où vivent les hachures. */
  band: string;
  /** Dessus des murs : nettement plus sombre que le sol éclairé. */
  wallTop: string;
  stone: string;
  wood: string;
  woodDark: string;
  iron: string;
  steel: string;
  cloth: string;
  gold: string;
  bone: string;
  straw: string;
  moss: string;
  water: string;
  paper: string;
}

interface Dungeon {
  c: MapCtx;
  g: CanvasRenderingContext2D;
  W: number;
  H: number;
  S: number;
  seed: number;
  at: MapCtx["at"];
  pal: Palette;
  /** Numéro de salle de chaque case (−1 hors salle). */
  roomAt: Int16Array;
  /** Cases à laisser libres (devant les portes) ou déjà meublées. */
  busy: Uint8Array;
  /** Cases laissées libres devant les portes (avant le mobilier). */
  doorway: Uint8Array;
  floorMask: HTMLCanvasElement;
  /** Distance de chaque case au sol praticable, en cases (8 voisins) : 0 pour le sol, plafonnée à 9. */
  wallDist: Uint8Array;
  /** Distance au sol en px (calculée avec la roche). */
  field?: Field;
  /** Piliers : petits massifs pleins cernés de sol, peints en roche hachurée sans bandeau de mur. */
  pillar: Uint8Array;
  lights: Light[];
  /** Silhouettes des meubles hauts, pour leur ombre portée à l'opposé de la flamme la plus proche. */
  casters: { pts: Pt[]; h: number }[];
  /** Torches murales prévues avant le mobilier (pour poser les scènes dans leur lumière), dessinées après. */
  sconces: Frame[];
  /** Graisse du trait des volumes : 1 pour le décor, plus pour les pièces de scène qui doivent sauter aux yeux. */
  ink: number;
}

const SHADOW = "rgba(0,0,0,.45)";

export function renderDungeon(c: MapCtx): HTMLCanvasElement {
  const d = prepare(c);
  // Dans l'ordre : chaque étape peint par-dessus la précédente.
  const steps: [string, (d: Dungeon) => void][] = [
    ["roche", paintRock],
    ["murs", paintMasonry],
    ["dalles", paintFloorStones],
    ["usure", paintFloorWear],
    ["bassins", paintPools],
    ["ombres", paintWallShadows],
    ["bord", paintInnerEdge],
    ["couloirs", paintCorridorDebris],
    ["mobilier", paintFurniture],
    ["portes", paintDoorsInk],
    ["toiles", paintCobwebs],
    ["appliques", paintSconces],
    ["lumiere", paintLight],
    ["papier", finish],
    ["grille", paintDungeonGrid],
  ];
  for (const [, step] of steps) step(d);
  return c.cv;
}

/** Finition de planche : vernis sépia très léger et grain du papier, en multiplication sur toute l'image. */
function finish(d: Dungeon) {
  const { g } = d;
  g.save();
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(236,222,196,.35)";
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.restore();
  applyPaper(g, d.seed, 1.1);
}

// ——— Préparation ———

function prepare(c: MapCtx): Dungeon {
  const { theme: th, material, W, H, S, at, map } = c;
  const metal = material === "metal";
  const stoneFloor = material === "pierre" ? mixColor(th.floor, "#9a9682", 0.18) : th.floor;
  const wood = metal ? mixColor(th.wall, "#6c7680", 0.6) : mixColor(th.door, "#6a4426", 0.35);
  const stone = material === "pierre";
  const floor = stone ? mixColor(mixColor(stoneFloor, "#a8a294", 0.35), "#fff6e0", 0.06) : mixColor(stoneFloor, "#fff6e0", 0.1);
  const block = stone ? mixColor(mixColor(th.wall, th.floor, 0.3), "#77716a", 0.6) : mixColor(th.wall, th.floor, 0.3);
  // roche : brun-noir en pierre ; les autres genres gardent leur fond, nettement assombri
  const rock = stone ? mixColor("#1a1510", th.background, 0.08) : mixColor(mixColor(mixColor(th.wall, th.background, 0.3), "#6e665a", 0.15), "#000000", 0.45);
  const pal: Palette = {
    // pierre : sol clair mais désaturé (la teinte vient de chaque salle) ; ailleurs, le sol du thème un peu éclairci
    floor,
    // couloirs : une valeur entre le sol des salles et le dessus des murs, pour qu'on les lise comme du sol
    road: stone ? mixColor(mixColor(floor, "#6e685a", 0.5), th.road, 0.15) : mixColor(th.road, "#fff6e0", 0.04),
    grout: stone ? "#3a3229" : mixColor(th.floor, "#3a2414", 0.62),
    wall: th.wall,
    // pierre de taille (statues, marches, margelles) : gris pierre moyen
    block,
    rock,
    band: stone ? mixColor("#76695a", th.wall, 0.1) : mixColor(rock, mixColor(th.wall, "#a09682", 0.5), 0.6),
    // dessus des murs : à peu près 55 % de la valeur du sol éclairé
    wallTop: stone ? mixColor(block, "#3d362e", 0.68) : mixColor(block, "#000000", 0.4),
    stone: mixColor(th.wall, th.floor, 0.58),
    wood,
    woodDark: mixColor(wood, "#140c06", 0.45),
    iron: "#34322f",
    steel: "#a7aaa6",
    cloth: metal ? mixColor(th.door, "#2a2a30", 0.35) : "#7c2619",
    gold: "#cfa443",
    bone: "#e4d8ba",
    straw: "#c6a352",
    moss: "#5e6c44",
    water: th.water,
    paper: "#e8dcc0",
  };
  const roomAt = new Int16Array(W * H).fill(-1);
  map.rooms.forEach((r, i) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (x >= 0 && y >= 0 && x < W && y < H) roomAt[y * W + x] = i;
  });
  // Devant chaque entrée de salle : la case d'arrivée et celle d'après restent libres.
  const busy = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ri = roomAt[y * W + x];
      if (ri < 0) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!isOpen(at(nx, ny)) || roomAt[ny * W + nx] === ri) continue;
        for (let k = 0; k <= 2; k++) {
          const ix = x - dx * k;
          const iy = y - dy * k;
          if (ix >= 0 && iy >= 0 && ix < W && iy < H) busy[iy * W + ix] = 1;
          // les voisines de la case d'arrivée aussi, pour qu'on entre sans se cogner
          if (k === 0) for (const s of [-1, 1]) if (dx === 0) mark(busy, W, H, ix + s, iy);
            else mark(busy, W, H, ix, iy + s);
        }
      }
    }
  // pierres de gué (sol cerné d'eau) : rien n'y est posé
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (at(x, y) === T.sol && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => at(x + dx, y + dy) === T.eau).length >= 3) busy[y * W + x] = 1;
  return { c, g: c.g, W, H, S, seed: map.seed, at, pal, roomAt, busy, doorway: busy.slice(), floorMask: cellMask((x, y) => isOpen(at(x, y)), W, H, S), wallDist: distanceToFloor(c), pillar: smallPillars(c), lights: [], casters: [], sconces: [], ink: 1 };
}

/**
 * Petits massifs pleins (au plus 6 cases, voisins par les côtés) entièrement cernés de sol, loin du bord : entre
 * deux couloirs, un bandeau de mur tout autour laisserait un trou sombre au milieu qu'on prendrait pour une fosse.
 */
function smallPillars(c: MapCtx): Uint8Array {
  const { W, H, at } = c;
  const out = new Uint8Array(W * H);
  const seen = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || isOpen(at(s % W, Math.floor(s / W)))) continue;
    const comp = [s];
    seen[s] = 1;
    let border = false;
    for (let i = 0; i < comp.length; i++) {
      const k = comp[i];
      const x = k % W;
      const y = (k - x) / W;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (seen[n] || isOpen(at(nx, ny))) continue;
        seen[n] = 1;
        comp.push(n);
      }
    }
    if (!border && comp.length <= 6) for (const k of comp) out[k] = 1;
  }
  return out;
}

/** Parcours en largeur depuis toutes les cases praticables (8 voisins), plafonné à 9 cases. */
function distanceToFloor(c: MapCtx): Uint8Array {
  const { W, H, at } = c;
  const dist = new Uint8Array(W * H).fill(9);
  let front: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (isOpen(at(x, y))) {
        dist[y * W + x] = 0;
        front.push(y * W + x);
      }
  for (let d = 1; d < 9 && front.length; d++) {
    const next: number[] = [];
    for (const k of front) {
      const x = k % W;
      const y = (k - x) / W;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (dist[n] <= d) continue;
          dist[n] = d;
          next.push(n);
        }
    }
    front = next;
  }
  return dist;
}

function mark(a: Uint8Array, W: number, H: number, x: number, y: number) {
  if (x >= 0 && y >= 0 && x < W && y < H) a[y * W + x] = 1;
}

// ——— Roche ———

/** Le dehors du sol : rectangle de la carte moins les cases praticables (pour peindre la roche sans déborder). */
function outsideFloor(d: Dungeon): Shape {
  const { W, H, S, at } = d;
  const path = new Path2D();
  path.rect(0, 0, W * S, H * S);
  path.addPath(cellShape((x, y) => isOpen(at(x, y)), W, H, S).path);
  return { path, box: [0, 0, W * S, H * S] };
}

/** Champ de distance au sol praticable, en px, échantillonné tous les `q` px (chanfrein 3 × 3 en deux passes). */
interface Field {
  q: number;
  gw: number;
  gh: number;
  dist: Float32Array;
  /** Échantillons des poches de roche enfermées (remplies de hachures claires au lieu du noir). */
  pocket: Uint8Array;
}

function floorField(d: Dungeon): Field {
  const { W, H, S, at } = d;
  const q = 4;
  const gw = Math.ceil((W * S) / q);
  const gh = Math.ceil((H * S) / q);
  const dist = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    const cy = Math.floor(((j + 0.5) * q) / S);
    for (let i = 0; i < gw; i++) dist[j * gw + i] = isOpen(at(Math.floor(((i + 0.5) * q) / S), cy)) ? 0 : 1e6;
  }
  const qd = q * Math.SQRT2;
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      let v = dist[k];
      if (!v) continue;
      if (i > 0) v = Math.min(v, dist[k - 1] + q);
      if (j > 0) {
        v = Math.min(v, dist[k - gw] + q);
        if (i > 0) v = Math.min(v, dist[k - gw - 1] + qd);
        if (i < gw - 1) v = Math.min(v, dist[k - gw + 1] + qd);
      }
      dist[k] = v;
    }
  for (let j = gh - 1; j >= 0; j--)
    for (let i = gw - 1; i >= 0; i--) {
      const k = j * gw + i;
      let v = dist[k];
      if (!v) continue;
      if (i < gw - 1) v = Math.min(v, dist[k + 1] + q);
      if (j < gh - 1) {
        v = Math.min(v, dist[k + gw] + q);
        if (i < gw - 1) v = Math.min(v, dist[k + gw + 1] + qd);
        if (i > 0) v = Math.min(v, dist[k + gw - 1] + qd);
      }
      dist[k] = v;
    }
  // la distance va du centre de l'échantillon au bord du sol, pas au centre de l'échantillon voisin
  for (let k = 0; k < dist.length; k++) if (dist[k]) dist[k] = Math.max(0.5, dist[k] - q / 2);
  return { q, gw, gh, dist, pocket: rockPockets(dist, gw, gh, wallReach(S) + S * 1.2, (S * S * 50) / (q * q)) };
}

/**
 * Poches de roche enfermées entre les salles : les zones trop loin des murs pour la frange, qui ne touchent
 * pas le bord de la carte et restent petites (moins de `most` échantillons). Sans cela elles feraient des taches
 * noires au milieu des hachures ; on les remplit de roche hachurée.
 */
function rockPockets(dist: Float32Array, gw: number, gh: number, beyond: number, most: number): Uint8Array {
  const pocket = new Uint8Array(gw * gh);
  const seen = new Uint8Array(gw * gh);
  const stack: number[] = [];
  const comp: number[] = [];
  for (let s0 = 0; s0 < dist.length; s0++) {
    if (seen[s0] || dist[s0] <= beyond) continue;
    comp.length = 0;
    let border = false;
    seen[s0] = 1;
    stack.push(s0);
    while (stack.length) {
      const k = stack.pop()!;
      if (comp.length <= most) comp.push(k);
      const i = k % gw;
      const j = (k - i) / gw;
      if (i === 0 || j === 0 || i === gw - 1 || j === gh - 1) border = true;
      for (const n of [i > 0 ? k - 1 : -1, i < gw - 1 ? k + 1 : -1, j > 0 ? k - gw : -1, j < gh - 1 ? k + gw : -1])
        if (n >= 0 && !seen[n] && dist[n] > beyond) {
          seen[n] = 1;
          stack.push(n);
        }
    }
    if (!border && comp.length <= most) for (const k of comp) pocket[k] = 1;
  }
  return pocket;
}

/** Distance au sol (px) au point (x, y) du champ, et direction qui s'éloigne du sol (normale du mur le plus proche). */
function fieldAt(f: Field, x: number, y: number): number {
  const i = Math.min(f.gw - 1, Math.max(0, Math.floor(x / f.q)));
  const j = Math.min(f.gh - 1, Math.max(0, Math.floor(y / f.q)));
  return f.dist[j * f.gw + i];
}
function fieldNormal(f: Field, x: number, y: number): number {
  const s = f.q * 2;
  return Math.atan2(fieldAt(f, x, y + s) - fieldAt(f, x, y - s), fieldAt(f, x + s, y) - fieldAt(f, x - s, y));
}

/** Épaisseur du bandeau de mur, contour noir compris : la roche hachurée commence au-delà. */
const wallReach = (S: number) => Math.round(S * 0.36) + 4;

/**
 * Roche pleine, à la manière des plans de Dyson Logos mais en couleur : un aplat brun-noir à grain fin, puis,
 * autour des murs, une frange de papier sombre qui fonce en s'éloignant et s'arrête net sur un bord irrégulier ;
 * dans cette frange, les hachures (voir rockHatch). Aucun flou : c'est l'arrêt des traits qui dessine le bord.
 */
function paintRock(d: Dungeon) {
  const { g, pal, seed, S, W } = d;
  const cv = g.canvas;
  const cw = cv.width;
  const ch = cv.height;
  const field = floorField(d);
  d.field = field;
  g.fillStyle = pal.rock;
  g.fillRect(0, 0, cw, ch);
  // Grain : valeur au hasard par pixel de 2 × 2.
  const gr = canvas(Math.ceil(cw / 2), Math.ceil(ch / 2));
  const gg = gr.getContext("2d")!;
  const gimg = gg.createImageData(gr.width, gr.height);
  const gd = gimg.data;
  for (let j = 0; j < gr.height; j++)
    for (let i = 0; i < gr.width; i++) {
      let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      const v = ((h ^ (h >>> 16)) & 255) / 255;
      const k = (j * gr.width + i) * 4;
      const light = v > 0.5;
      gd[k] = gd[k + 1] = gd[k + 2] = light ? 200 : 0;
      gd[k + 3] = Math.round(Math.abs(v - 0.5) * 2 * (light ? 12 : 30));
    }
  gg.putImageData(gimg, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(gr, 0, 0, gr.width * 2, gr.height * 2);
  g.restore();
  // Frange : un échantillon par point du champ (4 px), tout ou rien ; la teinte fonce du mur vers le bord.
  const { gw, gh, q, dist, pocket } = field;
  const band = canvas(gw, gh);
  const bgx = band.getContext("2d")!;
  const bimg = bgx.createImageData(gw, gh);
  const bd = bimg.data;
  const near = hexRgb(pal.band);
  const far = hexRgb(mixColor(pal.band, pal.rock, 0.72));
  const w0 = wallReach(S);
  const edge = noise2(seed + 6);
  const mott = noise2(seed + 5);
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      const x = (i + 0.5) * q;
      const y = (j + 0.5) * q;
      const held = pocket[k] === 1 || d.pillar[Math.floor(y / S) * W + Math.floor(x / S)] === 1;
      const wr = dist[k] - w0;
      const reach = bandReach(S, edge, x, y);
      if (!held && wr >= reach) continue;
      const t = held ? 0.35 : Math.max(0, Math.min(1, wr / reach));
      const m = Math.max(0, Math.min(1, t * (0.55 + t * 0.45) + mott(x / 120, y / 120) * 0.08));
      bd[k * 4] = near[0] + (far[0] - near[0]) * m;
      bd[k * 4 + 1] = near[1] + (far[1] - near[1]) * m;
      bd[k * 4 + 2] = near[2] + (far[2] - near[2]) * m;
      bd[k * 4 + 3] = 255;
    }
  bgx.putImageData(bimg, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "low";
  g.drawImage(band, 0, 0, gw * q, gh * q);
  g.restore();
  rockHatch(d, field);
}

/** Largeur de la frange de roche hachurée au point (x, y), en px depuis la face du mur : 2,3 cases, bord ondulé. */
function bandReach(S: number, edge: (x: number, y: number) => number, x: number, y: number): number {
  return S * (2.3 + edge(x / 70, y / 70) * 0.4 + edge(x / 23 + 31, y / 23) * 0.1);
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Découpe un polygone convexe par le demi-plan des points plus proches de a que de b. */
function clipHalf(poly: Pt[], ax: number, ay: number, bx: number, by: number): Pt[] {
  const nx = bx - ax;
  const ny = by - ay;
  const c = (nx * (ax + bx) + ny * (ay + by)) / 2;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = p[0] * nx + p[1] * ny - c;
    const fq = q[0] * nx + q[1] * ny - c;
    if (fp <= 0) out.push(p);
    if (fp < 0 !== fq < 0 && fp !== fq) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/**
 * Un groupe de traits parallèles d'angle `a`, espacés de `gap` (±15 %), coupés au polygone convexe `poly`
 * (ajoutés au chemin). Chaque trait déborde du polygone de 0 à `ext` px à chaque bout : les groupes voisins se
 * chevauchent au lieu de laisser un joint. `ragged` (0 à 1) raccourcit un bout au hasard : la frange s'effiloche.
 */
function hatchGroup(p: number[], poly: Pt[], a: number, gap: number, r: Rng, ext: number, ragged = 0) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  let lo = Infinity;
  let hi = -Infinity;
  for (const [x, y] of poly) {
    const o = -sa * x + ca * y;
    if (o < lo) lo = o;
    if (o > hi) hi = o;
  }
  for (let o = lo + gap * (0.25 + r() * 0.45); o < hi - gap * 0.15; o += gap * (0.85 + r() * 0.3)) {
    let t0 = Infinity;
    let t1 = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const [px, py] = poly[i];
      const [qx, qy] = poly[(i + 1) % poly.length];
      const fp = -sa * px + ca * py - o;
      const fq = -sa * qx + ca * qy - o;
      if (fp < 0 === fq < 0) continue;
      const t = fp / (fp - fq);
      const along = ca * (px + (qx - px) * t) + sa * (py + (qy - py) * t);
      if (along < t0) t0 = along;
      if (along > t1) t1 = along;
    }
    if (t1 - t0 < 2.5) continue;
    let s0 = t0 - r() * ext;
    let s1 = t1 + r() * ext;
    if (ragged && r() < ragged) {
      const cut = (s1 - s0) * r() * 0.45;
      if (r() < 0.5) s0 += cut;
      else s1 -= cut;
    }
    // trait droit, à peine de travers : la plume ne suit pas la règle
    const w = (r() - 0.5) * 0.8;
    p.push(ca * s0 - sa * o, sa * s0 + ca * o, ca * s1 - sa * (o + w), sa * s1 + ca * (o + w));
  }
}

/**
 * Hachures de roche à la Dyson Logos, réglées par la distance au mur. Des points de Poisson à espacement
 * variable (petits groupes serrés contre le mur, plus grands au loin) découpent la frange en cellules de
 * Voronoï ; chaque groupe (3 à 7 traits) déborde d'un ou deux pixels sur ses voisins, sans joint. Son
 * orientation est tirée au hasard, à au moins 35° de celle des groupes voisins déjà tracés.
 * Chance de tracer un groupe : 1 dans la première demi-case, 0,6 vers une case, 0,3 vers 1,75 case, 0 au bord
 * de la frange ; les groupes absents laissent voir le papier sombre, les traits s'espacent et s'affinent.
 * Contre le mur (moins de 0,4 case), une seconde couche croisée à 60-90°. Piliers et poches enfermées : pleins.
 * Des blocs éboulés surtout près des angles, des fissures en zigzag qui partent des coins.
 */
function rockHatch(d: Dungeon, field: Field) {
  const { W, H, S, seed, pal, c } = d;
  const cw = W * S;
  const ch = H * S;
  const w0 = wallReach(S);
  const edge = noise2(seed + 6);
  const wdAt = (x: number, y: number) => fieldAt(field, x, y) - w0;
  const sampleAt = (x: number, y: number) => Math.min(field.gh - 1, Math.floor(y / field.q)) * field.gw + Math.min(field.gw - 1, Math.floor(x / field.q));
  const pillarAt = (x: number, y: number) => d.pillar[Math.min(H - 1, Math.floor(y / S)) * W + Math.min(W - 1, Math.floor(x / S))] === 1;
  const inBand = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return false;
    if (pillarAt(x, y) || field.pocket[sampleAt(x, y)] === 1) return true;
    const wd = wdAt(x, y);
    return wd > -6 && wd < bandReach(S, edge, x, y);
  };
  const R0 = 10;
  const R1 = 17;
  const radiusAt = (x: number, y: number) => (pillarAt(x, y) ? R0 : R0 + (R1 - R0) * Math.min(1, Math.max(0, wdAt(x, y)) / (S * 1.8)));
  // Poisson-disc (Bridson) à rayon variable, lancé depuis chaque coin de frange encore vide.
  const cs = R0 / Math.SQRT2;
  const gx = Math.ceil(cw / cs);
  const gy = Math.ceil(ch / cs);
  const win = Math.ceil(R1 / cs);
  const grid = new Int32Array(gx * gy).fill(-1);
  const xs: number[] = [];
  const ys: number[] = [];
  const rs: number[] = [];
  const r = rng(seed, 2);
  const far = (x: number, y: number, rad: number) => {
    const i = Math.floor(x / cs);
    const j = Math.floor(y / cs);
    for (let v = Math.max(0, j - win); v <= Math.min(gy - 1, j + win); v++)
      for (let u = Math.max(0, i - win); u <= Math.min(gx - 1, i + win); u++) {
        const k = grid[v * gx + u];
        if (k < 0) continue;
        const m = (rad + rs[k]) / 2;
        if ((xs[k] - x) ** 2 + (ys[k] - y) ** 2 < m * m) return false;
      }
    return true;
  };
  const add = (x: number, y: number, rad: number) => {
    grid[Math.floor(y / cs) * gx + Math.floor(x / cs)] = xs.length;
    xs.push(x);
    ys.push(y);
    rs.push(rad);
    return xs.length - 1;
  };
  for (let j = 0; j < gy; j += 3)
    for (let i = 0; i < gx; i += 3) {
      const x0 = (i + r()) * cs;
      const y0 = (j + r()) * cs;
      if (!inBand(x0, y0)) continue;
      const r0 = radiusAt(x0, y0);
      if (!far(x0, y0, r0)) continue;
      const active = [add(x0, y0, r0)];
      while (active.length) {
        const ai = Math.floor(r() * active.length);
        const k = active[ai];
        let ok = false;
        for (let t = 0; t < 12; t++) {
          const a = r() * Math.PI * 2;
          const l = rs[k] * (1 + r());
          const x = xs[k] + Math.cos(a) * l;
          const y = ys[k] + Math.sin(a) * l;
          if (!inBand(x, y)) continue;
          const rad = radiusAt(x, y);
          if (!far(x, y, rad)) continue;
          active.push(add(x, y, rad));
          ok = true;
          break;
        }
        if (!ok) active.splice(ai, 1);
      }
    }
  // Blocs éboulés : 2 à 5 par salle, à moins d'une case du mur, de préférence près des angles.
  const skip = new Uint8Array(xs.length);
  const blocks: { pts: Pt[]; cx: number; cy: number; rad: number }[] = [];
  const cracks: Pt[][] = [];
  const rb = rng(seed, 4);
  for (const room of c.map.rooms) {
    const x0 = (room.x - 1.5) * S;
    const y0 = (room.y - 1.5) * S;
    const x1 = (room.x + room.w + 1.5) * S;
    const y1 = (room.y + room.h + 1.5) * S;
    const corners: Pt[] = [[room.x * S, room.y * S], [(room.x + room.w) * S, room.y * S], [room.x * S, (room.y + room.h) * S], [(room.x + room.w) * S, (room.y + room.h) * S]];
    const cand: number[] = [];
    for (let j = Math.max(0, Math.floor(y0 / cs)); j <= Math.min(gy - 1, Math.floor(y1 / cs)); j++)
      for (let i = Math.max(0, Math.floor(x0 / cs)); i <= Math.min(gx - 1, Math.floor(x1 / cs)); i++) {
        const k = grid[j * gx + i];
        if (k < 0 || pillarAt(xs[k], ys[k])) continue;
        const wd = wdAt(xs[k], ys[k]);
        if (wd > S * 0.08 && wd < S * 0.95) cand.push(k);
      }
    const want = 2 + Math.floor(rb() * 4);
    let got = 0;
    for (let n = 0; n < cand.length * 3 && got < want && cand.length; n++) {
      const k = cand[Math.floor(rb() * cand.length)];
      const nearCorner = corners.some(([qx, qy]) => Math.hypot(qx - xs[k], qy - ys[k]) < S * 1.6);
      if (!nearCorner && rb() < 0.7) continue;
      const rad = S * between(rb, 0.1, 0.4);
      if (skip[k] || blocks.some((b) => Math.hypot(b.cx - xs[k], b.cy - ys[k]) < b.rad + rad + 6) || wdAt(xs[k], ys[k]) < rad * 0.6) continue;
      const nv = 5 + Math.floor(rb() * 4);
      const rot = rb() * Math.PI;
      const stretch = between(rb, 1, 1.45);
      const pts: Pt[] = [];
      for (let v = 0; v < nv; v++) {
        const a = (v / nv) * Math.PI * 2 + (rb() - 0.5) * 0.6;
        const l = rad * between(rb, 0.6, 1.1);
        const lx = Math.cos(a) * l * stretch;
        const ly = Math.sin(a) * l;
        pts.push([xs[k] + lx * Math.cos(rot) - ly * Math.sin(rot), ys[k] + lx * Math.sin(rot) + ly * Math.cos(rot)]);
      }
      blocks.push({ pts, cx: xs[k], cy: ys[k], rad: rad * stretch });
      for (let m = 0; m < xs.length; m++) if (Math.abs(xs[m] - xs[k]) < rad * 2 && Math.hypot(xs[m] - xs[k], ys[m] - ys[k]) < rad * stretch * 0.75) skip[m] = 1;
      got++;
    }
    // Fissures en zigzag depuis les angles extérieurs du mur.
    const outer: [number, number, number, number][] = [
      [room.x, room.y, -1, -1],
      [room.x + room.w, room.y, 1, -1],
      [room.x + room.w, room.y + room.h, 1, 1],
      [room.x, room.y + room.h, -1, 1],
    ];
    const nc = 2 + (rb() < 0.5 ? 1 : 0);
    for (let n = 0; n < nc; n++) {
      const [cx0, cy0, sx, sy] = outer[Math.floor(rb() * 4)];
      let x = cx0 * S + sx * (w0 - 1);
      let y = cy0 * S + sy * (w0 - 1);
      if (wdAt(x + sx * 4, y + sy * 4) < 0) continue;
      let a = Math.atan2(sy, sx) + (rb() - 0.5) * 0.9;
      const pts: Pt[] = [[x, y]];
      const steps = 4 + Math.floor(rb() * 4);
      for (let s = 0; s < steps; s++) {
        const turn = (s % 2 ? 0.65 : -0.65) + (rb() - 0.5) * 0.5;
        const l = between(rb, 6, 11);
        x += Math.cos(a + turn) * l;
        y += Math.sin(a + turn) * l;
        pts.push([x, y]);
        a += (rb() - 0.5) * 0.3;
      }
      cracks.push(pts);
      if (rb() < 0.6) {
        const from = pts[2];
        cracks.push(crackPoints(rb, from[0], from[1], a + (rb() < 0.5 ? 0.9 : -0.9), between(rb, 10, 20)));
      }
    }
  }
  // Groupes : cellule de Voronoï élargie de chaque point tracé.
  const heavy: number[] = [];
  const cross: number[] = [];
  const mid: number[] = [];
  const light: number[] = [];
  const faint: number[] = [];
  const ang = new Float32Array(xs.length).fill(NaN);
  const diff = (a: number, b: number) => {
    const x = Math.abs(a - b) % Math.PI;
    return Math.min(x, Math.PI - x);
  };
  const nb: number[] = [];
  for (let k = 0; k < xs.length; k++) {
    if (skip[k]) continue;
    const ax = xs[k];
    const ay = ys[k];
    const rr = rng(seed, 3, k);
    const wd = wdAt(ax, ay);
    const u = wd / S;
    const lim = bandReach(S, edge, ax, ay) / S;
    const pillar = pillarAt(ax, ay);
    const pocket = field.pocket[sampleAt(ax, ay)] === 1;
    // tous les groupes jusqu'à 1,6 case (les traits s'y espacent et s'affinent), puis de moins en moins jusqu'au bord :
    // une frange qui s'effiloche, pas des taches de papier au milieu de la roche
    const keep = pillar || pocket || u < 1.6 ? 1 : Math.max(0, 1 - (u - 1.6) / Math.max(0.3, lim - 1.6)) ** 0.7;
    if (rr() > keep) continue;
    const reach = rs[k] * 1.5;
    let poly: Pt[] = [[ax - reach, ay - reach], [ax + reach, ay - reach], [ax + reach, ay + reach], [ax - reach, ay + reach]];
    const i = Math.floor(ax / cs);
    const j = Math.floor(ay / cs);
    const wn = Math.ceil((rs[k] * 2.3) / cs);
    nb.length = 0;
    for (let v = Math.max(0, j - wn); v <= Math.min(gy - 1, j + wn) && poly.length > 2; v++)
      for (let w = Math.max(0, i - wn); w <= Math.min(gx - 1, i + wn) && poly.length > 2; w++) {
        const m = grid[v * gx + w];
        if (m < 0 || m === k) continue;
        const dd = (xs[m] - ax) ** 2 + (ys[m] - ay) ** 2;
        if (dd > (rs[k] * 2.3) ** 2) continue;
        poly = clipHalf(poly, ax, ay, xs[m], ys[m]);
        if (!Number.isNaN(ang[m]) && dd < ((rs[k] + rs[m]) * 1.15) ** 2) nb.push(ang[m]);
      }
    if (poly.length < 3) continue;
    // la cellule déborde d'un pixel : les groupes se touchent, jamais de liseré entre eux
    poly = poly.map(([x, y]) => {
      const l = Math.hypot(x - ax, y - ay) || 1;
      return [x + ((x - ax) / l) * 1.1, y + ((y - ay) / l) * 1.1] as Pt;
    });
    let a = 0;
    let best = -1;
    for (let t = 0; t < 10; t++) {
      const cand = rr() * Math.PI;
      let mn = Math.PI;
      for (const b of nb) mn = Math.min(mn, diff(cand, b));
      if (mn > best) {
        best = mn;
        a = cand;
      }
      if (mn >= 0.62) break;
    }
    ang[k] = a;
    if (pillar || u < 0.45) {
      hatchGroup(heavy, poly, a, between(rr, 2.3, 2.8), rr, 1.5);
      if (pillar || rr() < 1.1 - u / 0.45) hatchGroup(cross, poly, a + between(rr, 1.05, 1.57) * (rr() < 0.5 ? 1 : -1), between(rr, 2.8, 3.6), rr, 1);
    } else if (u < 1.1) hatchGroup(mid, poly, a, between(rr, 2.7, 3.3), rr, 1.5);
    else if (u < 1.75 || pocket) hatchGroup(light, poly, a, between(rr, 3.3, 4.1), rr, 1.2, 0.2);
    else hatchGroup(faint, poly, a, between(rr, 4.2, 5.2), rr, 1, 0.45);
  }
  const ink = "18,13,9";
  const cg = d.g;
  // pas de découpe : le sol est peint ensuite par-dessus (une découpe complexe coûte cher au tramage) ;
  // encres opaques, déjà mêlées au papier : un trait transparent sur un chemin aussi long coûte cher
  cg.lineCap = "butt";
  cg.lineJoin = "bevel";
  for (const [p, w, k] of [[heavy, 1.7, 0.06], [cross, 1.15, 0.14], [mid, 1.45, 0.1], [light, 1.25, 0.16], [faint, 1.05, 0.26]] as const) {
    cg.strokeStyle = mixColor("#120d09", pal.band, k);
    cg.lineWidth = w;
    // par paquets de 1200 traits : le tramage d'un seul chemin géant coûte bien plus cher
    for (let i0 = 0; i0 < p.length; i0 += 4800) {
      cg.beginPath();
      for (let i = i0; i < Math.min(p.length, i0 + 4800); i += 4) {
        cg.moveTo(p[i], p[i + 1]);
        cg.lineTo(p[i + 2], p[i + 3]);
      }
      cg.stroke();
    }
  }
  const r2 = rng(seed, 9);
  // fissures : une réserve de papier puis le trait noir, pour qu'elles se lisent sur les hachures
  for (const pts of cracks) {
    inkPolyline(cg, pts, r2, { width: 3.6, taper: 0, wobble: 0.2, color: tint(pal.band, 0.04, 0.9) });
    inkPolyline(cg, pts, r2, { width: 1.6, taper: 8, wobble: 0.3, color: `rgba(${ink},.95)` });
  }
  // blocs : ombre en bas à droite, pierre dans la valeur de la roche, facettes, deux ou trois hachures, encre
  for (const b of blocks) {
    fillPoly(cg, b.pts.map(([x, y]) => [x + 2.5, y + 3.2] as Pt), "rgba(6,4,2,.8)");
    fillPoly(cg, b.pts, tint(mixColor(pal.band, pal.rock, 0.35), between(r2, -0.08, 0.08)));
    const top = b.pts.reduce((m, p) => (p[0] + p[1] < m[0] + m[1] ? p : m), b.pts[0]);
    const inner: Pt = [b.cx + (r2() - 0.5) * b.rad * 0.4, b.cy + (r2() - 0.5) * b.rad * 0.4];
    // facettes : du sommet le plus haut vers un point intérieur, puis vers un ou deux autres sommets
    inkLine(cg, top[0], top[1], inner[0], inner[1], r2, { width: 0.9, wobble: 0.2, color: `rgba(${ink},.8)` });
    const n = 1 + Math.floor(r2() * 2);
    for (let f = 0; f < n; f++) {
      const p = b.pts[Math.floor(r2() * b.pts.length)];
      if (p === top) continue;
      inkLine(cg, inner[0], inner[1], p[0], p[1], r2, { width: 0.8, wobble: 0.2, color: `rgba(${ink},.7)` });
    }
    shadeHatch(cg, b.pts, Math.max(3, b.rad * 0.35), 3, `rgba(${ink},.75)`, 0.9);
    inkOutline(cg, b.pts, r2, { width: 1.7, wobble: 0.25, pressure: 0.3, color: `rgb(${ink})` });
  }
}

// ——— Murs ———

/** Une arête droite entre des cases de sol et des cases pleines ; (nx, ny) pointe hors du sol. */
interface Run {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  nx: number;
  ny: number;
}

/** Arêtes entre les cases `inside` et le reste, regroupées en segments droits ; la normale pointe hors des cases. */
function edgeRuns(inside: (x: number, y: number) => boolean, W: number, H: number, S: number): Run[] {
  const runs: Run[] = [];
  for (const ny of [-1, 1])
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        if (!(inside(x, y) && !inside(x, y + ny))) {
          x++;
          continue;
        }
        let e = x;
        while (e + 1 < W && inside(e + 1, y) && !inside(e + 1, y + ny)) e++;
        const yy = (ny < 0 ? y : y + 1) * S;
        runs.push({ x0: x * S, y0: yy, x1: (e + 1) * S, y1: yy, nx: 0, ny });
        x = e + 1;
      }
    }
  for (const nx of [-1, 1])
    for (let x = 0; x < W; x++) {
      let y = 0;
      while (y < H) {
        if (!(inside(x, y) && !inside(x + nx, y))) {
          y++;
          continue;
        }
        let e = y;
        while (e + 1 < H && inside(x, e + 1) && !inside(x + nx, e + 1)) e++;
        const xx = (nx < 0 ? x : x + 1) * S;
        runs.push({ x0: xx, y0: y * S, x1: xx, y1: (e + 1) * S, nx, ny: 0 });
        y = e + 1;
      }
    }
  return runs;
}

/** Chemin d'une liste de boucles (polygones fermés). */
function loopsPath(loops: Pt[][]): Path2D {
  const p = new Path2D();
  for (const l of loops) addPoly(p, l);
  return p;
}

/**
 * Murs épais en un seul tracé : le contour du sol (marche case à case, à peine tremblé) est tracé deux fois
 * hors du sol, en encre puis en pierre, ce qui donne un bandeau continu sans blocs qui se chevauchent aux angles.
 * Les joints sont de petits traits en travers du bandeau ; aux angles saillants, une grosse pierre d'angle.
 */
function paintMasonry(d: Dungeon) {
  const { g, W, H, S, at, pal, seed, c } = d;
  const metal = c.material === "metal";
  const open = (x: number, y: number) => isOpen(at(x, y));
  // les piliers ne reçoivent pas de bandeau : ils restent en roche hachurée, cernés d'un trait gras
  const framed = (x: number, y: number) => open(x, y) || d.pillar[y * W + x] === 1;
  const loops = cellContour(open, W, H, S, { smooth: 0, jitter: 0.7, seed: seed + 11 });
  const edge = loopsPath(loops);
  // second contour plus tremblé : réuni au premier, il fait varier la graisse du trait côté roche
  const edge2 = loopsPath(cellContour(open, W, H, S, { smooth: 0, jitter: 1.8, seed: seed + 12 }));
  const t = Math.round(S * 0.36);
  const runs = edgeRuns(open, W, H, S).filter((run) => {
    // un bandeau dont la case pleine voisine est un pilier : rien à appareiller
    const mx = (run.x0 + run.x1) / 2 + run.nx * 4;
    const my = (run.y0 + run.y1) / 2 + run.ny * 4;
    return d.pillar[Math.floor(my / S) * W + Math.floor(mx / S)] !== 1;
  });
  const area: Shape = { path: new Path2D(), box: [0, 0, W * S, H * S] };
  area.path.rect(0, 0, W * S, H * S);
  area.path.addPath(cellShape(framed, W, H, S).path);
  withArea(g, area, (cg) => {
    cg.lineJoin = "miter";
    cg.miterLimit = 3;
    // ombre du bandeau sur la roche (lumière du haut à gauche)
    cg.save();
    cg.translate(4, 5);
    cg.strokeStyle = "rgba(6,4,2,.55)";
    cg.lineWidth = 2 * t + 12;
    cg.stroke(edge);
    cg.restore();
    // contour noir gras côté roche (4 px), le trait côté salle restant fin (1,5 px)
    cg.strokeStyle = INK;
    cg.lineWidth = 2 * t + 8;
    cg.stroke(edge);
    cg.lineWidth = 2 * t + 7;
    cg.stroke(edge2);
    cg.strokeStyle = pal.wallTop;
    cg.lineWidth = 2 * t;
    cg.stroke(edge);
    // Appareil : deux assises de pierres de longueur au hasard, joints décalés d'une assise à l'autre ;
    // chaque pan de mur a sa propre teinte, chaque pierre la sienne autour.
    const N = 11;
    const tones = Array.from({ length: N }, () => new Path2D());
    const joints = new Path2D();
    const lit = new Path2D();
    const cracks: Pt[][] = [];
    for (const run of runs) {
      const r = rng(seed + 3, run.x0, run.y0, run.nx * 3 + run.ny);
      const horiz = run.ny !== 0;
      const sgn = horiz ? run.ny : run.nx;
      const base = horiz ? run.y0 : run.x0;
      const pt = (s: number, k: number): Pt => (horiz ? [s, base + sgn * k] : [base + sgn * k, s]);
      const s0 = horiz ? run.x0 : run.y0;
      const s1 = horiz ? run.x1 : run.y1;
      // bout saillant : la case qui prolonge le mur est pleine des deux côtés → le bandeau tourne l'angle
      const cellOf = (s: number): [number, number] => (horiz ? [Math.floor(s / S), Math.floor((base + sgn * 4) / S)] : [Math.floor((base + sgn * 4) / S), Math.floor(s / S)]);
      const before = cellOf(s0 - 4);
      const after = cellOf(s1 + 4);
      const outerA = horiz && !open(...before) && !open(before[0], before[1] - sgn);
      const outerB = horiz && !open(...after) && !open(after[0], after[1] - sgn);
      const a0 = outerA ? s0 - t : s0;
      const a1 = outerB ? s1 + t : s1;
      const pan = Math.floor(r() * 5) - 2;
      // assises : la ligne de lit tremble un peu, sa hauteur varie d'un pan à l'autre
      const rows = metal ? [0, t] : [0, t * between(r, 0.42, 0.6), t];
      for (let row = 0; row < rows.length - 1; row++) {
        const k0 = rows[row];
        const k1 = rows[row + 1];
        const cuts: number[] = [];
        let s = a0 + between(r, S * 0.08, S * 0.5);
        while (s < a1 - S * 0.12) {
          cuts.push(s);
          s += between(r, S * 0.3, S * 0.75) * (metal ? 1.6 : 1);
        }
        const marks = [a0, ...cuts, a1];
        for (let i = 0; i < marks.length - 1; i++) {
          const q: Pt[] = [pt(marks[i], k0), pt(marks[i + 1], k0), pt(marks[i + 1], k1), pt(marks[i], k1)];
          addPoly(tones[Math.max(0, Math.min(N - 1, 5 + pan + Math.floor((r() - 0.5) * 5)))], q);
          // arête éclairée de la pierre, côté lumière
          if (sgn > 0 && row === rows.length - 2) {
            const [lx0, ly0] = pt(marks[i] + 1.5, k1 - 1.5);
            const [lx1, ly1] = pt(marks[i + 1] - 1.5, k1 - 1.5);
            lit.moveTo(lx0, ly0);
            lit.lineTo(lx1, ly1);
          }
          if (!metal && r() < 0.05) {
            const m = between(r, 0.3, 0.7);
            const span = marks[i + 1] - marks[i];
            cracks.push([pt(marks[i] + span * m, k0 + 0.5), pt(marks[i] + span * between(r, 0.3, 0.7), (k0 + k1) / 2), pt(marks[i] + span * between(r, 0.2, 0.8), k1 - 0.5)]);
          }
        }
        for (const k of cuts) {
          const [x0, y0] = pt(k + (r() - 0.5) * 1.2, k0);
          const [x1, y1] = pt(k + (r() - 0.5) * 1.6, k1);
          joints.moveTo(x0, y0);
          joints.lineTo(x1, y1);
        }
        if (row > 0) {
          // ligne de lit : un trait qui ondule à peine
          const n = Math.max(2, Math.round((a1 - a0) / 16));
          for (let i = 0; i <= n; i++) {
            const [x, y] = pt(a0 + ((a1 - a0) * i) / n, k0 + (r() - 0.5) * 0.9);
            if (i) joints.lineTo(x, y);
            else joints.moveTo(x, y);
          }
        }
      }
    }
    tones.forEach((p, k) => {
      cg.fillStyle = tint(pal.wallTop, (k - 5) * 0.028, 0.6);
      cg.fill(p);
    });
    cg.lineCap = "round";
    cg.strokeStyle = "rgba(16,11,7,.82)";
    cg.lineWidth = 0.95;
    cg.stroke(joints);
    cg.strokeStyle = tint(pal.wallTop, 0.3, 0.4);
    cg.lineWidth = 1.1;
    cg.stroke(lit);
    const rr = rng(seed, 13);
    for (const k of cracks) inkPolyline(cg, k, rr, { width: 0.8, taper: 3, wobble: 0.3, color: "rgba(20,14,9,.7)" });
    if (!metal) wallStones(d, cg, runs, t);
  });
  // piliers : un trait d'encre gras tout autour, le reste est de la roche hachurée
  const pl = cellContour((x, y) => d.pillar[y * W + x] === 1, W, H, S, { smooth: 0, jitter: 0.8, seed: seed + 15 });
  if (pl.length) {
    g.save();
    g.translate(3, 4);
    g.strokeStyle = "rgba(6,4,2,.5)";
    g.lineWidth = 3;
    g.stroke(loopsPath(pl));
    g.restore();
    inkOutline(g, pl, rng(seed, 16), { width: 3.2, wobble: 0.4, pressure: 0.3 });
  }
}

/**
 * Pierres de taille posées sur le bandeau : grosses pierres d'angle aux angles saillants du mur,
 * et de loin en loin un bloc qui dépasse dans la roche (jamais côté salle).
 */
function wallStones(d: Dungeon, g: CanvasRenderingContext2D, runs: Run[], t: number) {
  const { W, H, S, at, pal, seed } = d;
  const open = (x: number, y: number) => isOpen(at(x, y));
  const r = rng(seed, 14);
  const stone = (pts: Pt[], k: number) => {
    fillPoly(g, pts.map(([x, y]) => [x + 3, y + 4] as Pt), "rgba(6,4,2,.5)");
    fillPoly(g, pts, tint(pal.wallTop, k));
    // face éclairée en haut à gauche, sombre en bas à droite
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const grad = g.createLinearGradient(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    grad.addColorStop(0, "rgba(255,244,220,.22)");
    grad.addColorStop(0.5, "rgba(255,244,220,0)");
    grad.addColorStop(1, "rgba(14,9,5,.3)");
    g.fillStyle = grad;
    fillPath(g, pts);
    inkOutline(g, pts, r, { width: 2, wobble: 0.35, pressure: 0.4 });
  };
  const jit = (p: Pt): Pt => [p[0] + (r() - 0.5) * 2.4, p[1] + (r() - 0.5) * 2.4];
  // Angles saillants : un seul des quatre carrés autour du sommet est du sol.
  for (let y = 1; y < H; y++)
    for (let x = 1; x < W; x++) {
      const q = [open(x - 1, y - 1), open(x, y - 1), open(x - 1, y), open(x, y)];
      if (q.filter(Boolean).length !== 1) continue;
      // une pierre d'angle sur deux ou trois seulement : l'appareil n'est pas tiré au cordeau
      if (r() < 0.45) continue;
      const i = q.indexOf(true);
      // direction vers la roche
      const sx = i % 2 === 0 ? 1 : -1;
      const sy = i < 2 ? 1 : -1;
      const vx = x * S;
      const vy = y * S;
      // taille ±20 %, une sur deux ébréchée à son coin extérieur
      const e = (t + 4 + r() * 3) * between(r, 0.8, 1.2);
      const a = (r() < 0.5 ? 1.35 : 1) * e;
      const b = a === e ? 1.35 * e : e;
      const cut = r() < 0.5 ? between(r, 4, 8) : 0;
      const far: Pt[] = cut ? [[vx + sx * a, vy + sy * (b - cut)], [vx + sx * (a - cut * 0.8), vy + sy * b]] : [[vx + sx * a, vy + sy * b]];
      const pts = ([[vx - sx * 2, vy - sy * 2], [vx + sx * a, vy - sy * 2], ...far, [vx - sx * 2, vy + sy * b]] as Pt[]).map(jit);
      stone(pts, between(r, 0.02, 0.1));
    }
  // Blocs saillants : seulement là où le mur a au moins deux cases d'épaisseur.
  for (const run of runs) {
    const horiz = run.ny !== 0;
    const sgn = horiz ? run.ny : run.nx;
    const base = horiz ? run.y0 : run.x0;
    const s0 = horiz ? run.x0 : run.y0;
    const s1 = horiz ? run.x1 : run.y1;
    for (let s = s0 + S * 0.5; s < s1 - S * 0.5; s += S) {
      if (r() > 0.16) continue;
      const cell = Math.floor(s / S);
      const out1 = Math.floor((base + sgn * S * 0.5) / S);
      const out2 = Math.floor((base + sgn * S * 1.5) / S);
      const solidAt = (u: number, v: number) => (horiz ? !open(u, v) : !open(v, u));
      if (![-1, 0, 1].every((k) => solidAt(cell + k, out1) && solidAt(cell + k, out2))) continue;
      const len = S * between(r, 0.45, 0.8);
      const from = s - len / 2 + (r() - 0.5) * S * 0.3;
      const depth = t + between(r, 4, 9);
      const pt = (u: number, k: number): Pt => (horiz ? [u, base + sgn * k] : [base + sgn * k, u]);
      stone([pt(from, t * 0.4), pt(from + len, t * 0.4), pt(from + len, depth), pt(from, depth)].map(jit), between(r, -0.06, 0.06));
    }
  }
}

// ——— Sols ———

/** Teinte du sol selon la salle : [couleur mêlée, part du mélange, éclaircissement]. Crypte froide, trésor et trône chauds, cellules boueuses. */
const ROOM_FLOOR: Record<string, [string, number, number]> = {
  Entrée: ["#a0947c", 0.2, 0.02],
  "Salle des gardes": ["#ad9a7a", 0.22, 0],
  Crypte: ["#7f8c84", 0.42, -0.06],
  Armurerie: ["#8a8a86", 0.3, -0.03],
  "Salle du trône": ["#c4a676", 0.36, 0.03],
  Bibliothèque: ["#b0956c", 0.3, 0],
  Cellules: ["#6e6448", 0.45, -0.1],
  Autel: ["#9a948c", 0.28, -0.03],
  Trésor: ["#c9a466", 0.4, 0.02],
  Cuisine: ["#a6825e", 0.3, -0.03],
};

function roomFloor(d: Dungeon, room: Room, i: number): string {
  const spec = ROOM_FLOOR[room.label ?? ""];
  if (d.c.material !== "pierre") return d.pal.floor;
  if (spec) return shade(mixColor(d.pal.floor, spec[0], spec[1]), spec[2]);
  return mixColor(d.pal.floor, i % 2 ? "#9a8a70" : "#b4a684", 0.1);
}

/** Dalles (ou plaques, planches, terre battue selon la matière) salle par salle, pavés plus petits dans les couloirs. */
function paintFloorStones(d: Dungeon) {
  const { g, W, H, S, at, pal, seed, roomAt, c } = d;
  const rooms = c.map.rooms;
  g.save();
  g.fillStyle = pal.grout;
  g.beginPath();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isOpen(at(x, y))) g.rect(x * S, y * S, S, S);
  g.fill();
  g.restore();
  const corridor = cellShape((x, y) => isOpen(at(x, y)) && roomAt[y * W + x] < 0, W, H, S);
  // vrai si le pavé centré là (demi-taille ~12 px) touche une case de couloir
  const near = (px: number, py: number, fn: (x: number, y: number) => boolean) => {
    for (const [dx, dy] of [[0, 0], [-14, -14], [14, -14], [-14, 14], [14, 14]]) if (fn(Math.floor((px + dx) / S), Math.floor((py + dy) / S))) return true;
    return false;
  };
  const inCorr = (x: number, y: number) => isOpen(at(x, y)) && roomAt[y * W + x] < 0;
  const mat = c.material;
  // Couloirs
  withArea(g, corridor, (cg) => {
    const r = rng(seed, 20);
    const box: [number, number, number, number] = [0, 0, W * S, H * S];
    // joints des pavés à mi-chemin entre le pavé et le mortier noir : le couloir reste du sol, pas un damier contrasté
    cg.fillStyle = mixColor(pal.road, pal.grout, 0.5);
    cg.fillRect(0, 0, W * S, H * S);
    if (mat === "pierre" || mat === "terre") layStones(cg, r, box, 13, seed + 21, pal.road, (px, py) => near(px, py, inCorr), { merge: 0.3, jit: 3, sparse: mat === "terre" ? 0.45 : 0, round: 2 });
    else if (mat === "metal") layPlates(cg, r, box, S, pal.road, (px, py) => near(px, py, inCorr), true);
    else layPlanks(cg, r, box, pal.road, (px, py) => near(px, py, inCorr), false);
  });
  // Salles
  rooms.forEach((room, i) => {
    const r = rng(seed, 30, i);
    const box: [number, number, number, number] = [room.x * S, room.y * S, room.w * S, room.h * S];
    const label = room.label ?? "";
    const base = roomFloor(d, room, i);
    withArea(g, rectShape(...box), (cg) => {
      if (mat === "metal") return layPlates(cg, r, box, S, base, () => true, false);
      if (mat === "planches") return layPlanks(cg, r, box, base, () => true, (room.x + room.y) % 2 === 0);
      if (mat === "terre") return layStones(cg, r, box, 24, seed + 40 + i, base, () => true, { merge: 0.3, jit: 7, sparse: 0.6, round: 2 });
      if (label === "Salle du trône") layCellSlabs(d, cg, room, r, seed + 40 + i, base, true);
      else layCellSlabs(d, cg, room, r, seed + 40 + i, base, false);
    });
    if (mat !== "pierre") wornPath(d, room, i);
  });
  // Lavis par-dessus : unifie, tache, et laisse le pigment s'accumuler le long des murs.
  floorWash(d);
  stipple(g, cellShape((x, y) => isOpen(at(x, y)), W, H, S), rng(seed, 7), { density: 0.03, radius: 0.6, color: "rgba(30,20,10,.5)" });
  // Couloirs à peine plus sombres que les salles : on doit toujours les distinguer de la roche.
  withArea(g, corridor, (cg) => {
    cg.fillStyle = "rgba(20,12,6,.06)";
    cg.fillRect(0, 0, W * S, H * S);
  });
}

/**
 * Usure du passage : une traînée plus claire d'une entrée de la salle à l'autre (en passant près du centre),
 * là où des générations de bottes ont poli la pierre.
 */
function wornPath(d: Dungeon, room: Room, i: number) {
  const { g, S, W, at, roomAt } = d;
  const ways: Pt[] = [];
  for (let x = room.x; x < room.x + room.w; x++)
    for (const y of [room.y - 1, room.y + room.h]) if (isOpen(at(x, y)) && roomAt[y * W + x] !== i) ways.push([(x + 0.5) * S, (y + 0.5) * S]);
  for (let y = room.y; y < room.y + room.h; y++)
    for (const x of [room.x - 1, room.x + room.w]) if (isOpen(at(x, y)) && roomAt[y * W + x] !== i) ways.push([(x + 0.5) * S, (y + 0.5) * S]);
  if (ways.length < 2) return;
  const cx = (room.x + room.w / 2) * S;
  const cy = (room.y + room.h / 2) * S;
  g.save();
  g.beginPath();
  g.rect(room.x * S, room.y * S, room.w * S, room.h * S);
  g.clip();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (let a = 0; a < ways.length; a++)
    for (let b = a + 1; b < ways.length; b++) {
      const [x0, y0] = ways[a];
      const [x1, y1] = ways[b];
      for (const [w, al] of [[S * 1.3, 0.045], [S * 0.8, 0.05], [S * 0.4, 0.05]] as const) {
        g.strokeStyle = `rgba(255,246,222,${al})`;
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(x0, y0);
        g.quadraticCurveTo((cx + (x0 + x1) / 2) / 2, (cy + (y0 + y1) / 2) / 2, x1, y1);
        g.stroke();
      }
    }
  g.restore();
}

/** Éclaircit (k > 0) ou assombrit (k < 0) une couleur #rrggbb, en restant en #rrggbb. */
function shade(hex: string, k: number): string {
  return k >= 0 ? mixColor(hex, "#ffffff", k) : mixColor(hex, "#000000", -k);
}

/**
 * Lavis sur les sols : petites taches de pigment (jamais de grandes auréoles floues), puis, salle par salle,
 * une pénombre multipliée qui gagne vers les murs (environ 35 % au bord) : le centre de la salle respire.
 */
function floorWash(d: Dungeon) {
  const { g, pal, seed, W, H, S, at, c } = d;
  const cv = g.canvas;
  const r = rng(seed, 6);
  withArea(g, cellShape((x, y) => isOpen(at(x, y)), W, H, S), (cg) => {
    const n = Math.ceil((cv.width * cv.height) / (95 * 95));
    for (let i = 0; i < n; i++) {
      const x = r() * cv.width;
      const y = r() * cv.height;
      if (!isOpen(at(Math.floor(x / S), Math.floor(y / S)))) continue;
      const rad = between(r, 14, 34);
      const dark = r() < 0.6;
      const grad = cg.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, dark ? tint(pal.floor, -0.25, 0.12) : tint(pal.floor, 0.18, 0.1));
      grad.addColorStop(0.75, dark ? tint(pal.floor, -0.25, 0.08) : tint(pal.floor, 0.18, 0.04));
      grad.addColorStop(1, tint(pal.floor, 0, 0));
      cg.fillStyle = grad;
      cg.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
  g.save();
  g.globalCompositeOperation = "multiply";
  for (const room of c.map.rooms) {
    const cx = (room.x + room.w / 2) * S;
    const cy = (room.y + room.h / 2) * S;
    const rx = (room.w / 2) * S;
    const ry = (room.h / 2) * S;
    g.save();
    g.beginPath();
    g.rect(room.x * S, room.y * S, room.w * S, room.h * S);
    g.clip();
    g.translate(cx, cy);
    g.scale(rx, ry);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, "#f6f2ec");
    grad.addColorStop(0.72, "#ddd5ca");
    grad.addColorStop(1, "#bdb2a4");
    g.fillStyle = grad;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  }
  g.restore();
}

/** Forme vectorielle (réunion de carrés) des cases choisies : découpe bien moins coûteuse qu'un masque. */
function cellShape(inside: (x: number, y: number) => boolean, W: number, H: number, S: number): Shape {
  const path = new Path2D();
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!inside(x, y)) {
        x++;
        continue;
      }
      let e = x;
      while (e + 1 < W && inside(e + 1, y)) e++;
      path.rect(x * S, y * S, (e - x + 1) * S, S);
      x = e + 1;
    }
  }
  return { path, box: [0, 0, W * S, H * S] };
}

interface StoneOpts {
  /** Proportion de dalles fusionnées en grandes dalles. */
  merge: number;
  /** Écart des sommets du réseau, en px. */
  jit: number;
  /** Proportion de pierres manquantes (terre battue entre). */
  sparse: number;
  /** Passes d'arrondi des coins (usure). */
  round: number;
  checker?: boolean;
}

/** Pavage de dalles irrégulières : réseau aux sommets décalés, dalles fusionnées, joints sombres, usure. */
function layStones(g: CanvasRenderingContext2D, r: Rng, [bx, by, bw, bh]: [number, number, number, number], s: number, seed: number, base: string, keep: (px: number, py: number) => boolean, o: StoneOpts) {
  const ox = bx - s * (0.3 + r() * 0.4);
  const oy = by - s * (0.3 + r() * 0.4);
  const nx = Math.ceil(bw / s) + 2;
  const ny = Math.ceil(bh / s) + 2;
  const vx = (i: number, j: number): Pt => {
    const h1 = hashPair(i, j, seed);
    return [ox + i * s + (h1[0] - 0.5) * 2 * o.jit, oy + j * s + (h1[1] - 0.5) * 2 * o.jit];
  };
  const used = new Uint8Array(nx * ny);
  const alts = ["#a48c62", "#8e8f7b", "#b9a27a", "#9c8a6c"];
  // Teintes : 12 variations, ou 6 claires + 6 sombres pour un damier.
  const tones = Array.from({ length: 12 }, (_, k) =>
    o.checker
      ? tint(mixColor(base, k < 6 ? "#d8ccaa" : "#6f6a5c", 0.35), ((k % 6) / 6 - 0.5) * 0.05)
      : tint(mixColor(base, alts[k % alts.length], ((k * 5) % 12) / 12 * 0.16), (((k * 7) % 12) / 12 - 0.5) * 0.08),
  );
  const fills = tones.map(() => new Path2D());
  const shadow = new Path2D();
  const lit = new Path2D();
  const joints = new Path2D();
  const worn = new Path2D();
  const chips = new Path2D();
  const grain = new Path2D();
  const cracks: Pt[][] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      if (used[j * nx + i]) continue;
      let a = 1;
      let b = 1;
      const m = r();
      if (m < o.merge) {
        const k = r();
        const freeAt = (ii: number, jj: number) => ii < nx && jj < ny && !used[jj * nx + ii];
        if (k < 0.4 && freeAt(i + 1, j)) a = 2;
        else if (k < 0.75 && freeAt(i, j + 1)) b = 2;
        else if (freeAt(i + 1, j) && freeAt(i, j + 1) && freeAt(i + 1, j + 1)) a = b = 2;
      }
      for (let jj = j; jj < j + b; jj++) for (let ii = i; ii < i + a; ii++) used[jj * nx + ii] = 1;
      const cx = ox + (i + a / 2) * s;
      const cy = oy + (j + b / 2) * s;
      if (!keep(cx, cy)) continue;
      if (o.sparse && r() < o.sparse) continue;
      // Contour : tous les sommets du réseau le long du bord, pour que les joints se partagent.
      let pts: Pt[] = [];
      for (let ii = i; ii < i + a; ii++) pts.push(vx(ii, j));
      for (let jj = j; jj < j + b; jj++) pts.push(vx(i + a, jj));
      for (let ii = i + a; ii > i; ii--) pts.push(vx(ii, j + b));
      for (let jj = j + b; jj > j; jj--) pts.push(vx(i, jj));
      const gx = pts.reduce((t, p) => t + p[0], 0) / pts.length;
      const gy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
      const gap = o.sparse ? 2.5 : 1.1;
      pts = pts.map(([px, py]) => {
        const dx = gx - px;
        const dy = gy - py;
        const l = Math.hypot(dx, dy) || 1;
        return [px + (dx / l) * gap, py + (dy / l) * gap] as Pt;
      });
      if (o.round) pts = smoothPoints(pts, o.round);
      const tone = o.checker ? ((i + j) % 2) * 6 + Math.floor(r() * 6) : Math.floor(r() * 12);
      addPoly(shadow, pts.map(([px, py]) => [px + 1.2, py + 1.5] as Pt));
      addPoly(fills[tone], pts);
      lit.moveTo(pts[pts.length - 1][0] + 0.6, pts[pts.length - 1][1] + 0.6);
      for (let k = 0; k < Math.ceil(pts.length / 2); k++) lit.lineTo(pts[k][0] + 0.6, pts[k][1] + 0.6);
      addPoly(joints, pts);
      // Usure : creux plus sombre, fissure, coin ébréché, grain.
      const w = r();
      if (w < 0.1) {
        addPoly(worn, smoothPoints(blobPoints(r, gx, gy, s * 0.3 * a, s * 0.3 * b, 7, 0.3), 2));
      } else if (w < 0.19) {
        cracks.push(crackPoints(r, gx + (r() - 0.5) * s * 0.6, gy - s * 0.4, r() * Math.PI, s * Math.max(a, b) * 0.7));
      } else if (w < 0.25) {
        const p = pts[Math.floor(r() * pts.length)];
        addPoly(chips, blobPoints(r, p[0] + (gx - p[0]) * 0.12, p[1] + (gy - p[1]) * 0.12, 3, 2.5, 5, 0.4));
      }
      if (r() < 0.35) {
        for (let k = 0; k < 5; k++) {
          const px = gx + (r() - 0.5) * s * a * 0.7;
          const py = gy + (r() - 0.5) * s * b * 0.7;
          const pr = 0.5 + r() * 0.5;
          grain.moveTo(px + pr, py);
          grain.arc(px, py, pr, 0, Math.PI * 2);
        }
      }
    }
  // ombre de chaque pavé, côté bas-droite : un contour plus épais du côté de l'ombre, brun et non noir
  g.fillStyle = "rgba(40,26,14,.3)";
  g.fill(shadow);
  tones.forEach((t, k) => {
    g.fillStyle = t;
    g.fill(fills[k]);
  });
  g.fillStyle = "rgba(40,26,12,.1)";
  g.fill(worn);
  g.fillStyle = "rgba(30,20,10,.55)";
  g.fill(chips);
  g.fillStyle = "rgba(30,20,10,.25)";
  g.fill(grain);
  g.strokeStyle = "rgba(255,244,220,.16)";
  g.lineWidth = 1;
  g.stroke(lit);
  g.strokeStyle = "rgba(66,46,28,.45)";
  g.lineWidth = 0.8;
  g.stroke(joints);
  for (const c of cracks) inkPolyline(g, c, r, { width: 0.7, taper: 5, wobble: 0.4, color: "rgba(22,14,8,.75)" });
}

/**
 * Dallage calé sur la grille : les joints principaux tombent sur les lignes de case (sommets tremblés de 1 à 2 px),
 * joint sombre de 2 px. Une case porte une dalle, ou deux ou trois (coupe droite, en T ou en L) ; de temps en temps
 * une grande dalle couvre 1 × 2 ou 2 × 2 cases. Teinte ±6 % par dalle, coins émoussés par endroits, arête éclairée
 * en haut à gauche, mousse dans les joints près des murs et de l'eau. Deux à quatre dalles par salle sont fendues,
 * brisées ou arrachées (trou au fond hachuré, bord éclairé côté lumière, débris).
 * `checker` : damier de marbre, une dalle par case, claire et sombre en alternance, usure et ébréchures variées.
 */
function layCellSlabs(d: Dungeon, g: CanvasRenderingContext2D, room: Room, r: Rng, seed: number, base: string, checker: boolean) {
  const { S, at, pal, W } = d;
  const J = 1.8;
  const v = (i: number, j: number): Pt => {
    const [hx, hy] = hashPair(i, j, seed);
    return [i * S + (hx - 0.5) * 2 * J, j * S + (hy - 0.5) * 2 * J];
  };
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const inside = (x: number, y: number) => x >= room.x && y >= room.y && x < room.x + room.w && y < room.y + room.h && isOpen(at(x, y)) && at(x, y) !== T.eau;
  const used = new Set<number>();
  const key = (x: number, y: number) => y * 4096 + x;
  const wet = d.c.material !== "metal" && (ROOM_DARK[room.label ?? ""] ?? 0.6) >= 0.7;
  const mossy = noise2(seed + 17);
  // Cases abîmées : jamais devant une porte.
  const damaged = new Map<number, number>();
  // damier du trône : l'usure suit l'allée du tapis (de part et d'autre des axes de la salle), coins ébréchés et fentes
  const want = checker ? 5 + Math.floor(r() * 3) : 2 + Math.floor(r() * 3);
  const cx0 = room.x + room.w / 2;
  const cy0 = room.y + room.h / 2;
  for (let n = 0; n < 80 && damaged.size < want; n++) {
    const x = room.x + Math.floor(r() * room.w);
    const y = room.y + Math.floor(r() * room.h);
    if (!inside(x, y) || d.doorway[y * W + x] || damaged.has(key(x, y))) continue;
    if (checker && Math.min(Math.abs(x + 0.5 - cx0), Math.abs(y + 0.5 - cy0)) > 2) continue;
    // 0 : fendue, 1 : brisée, 2 : arrachée, 3 : ébréchée (damier)
    damaged.set(key(x, y), checker ? (r() < 0.55 ? 3 : 0) : Math.floor(r() * 3));
  }
  const N = 10;
  const tones = Array.from({ length: N }, (_, k) => {
    const alt = pick(r, ["#a89a7c", "#8f9284", "#b2a282", "#9a8e78"]);
    return tint(mixColor(base, alt, 0.1), (k / (N - 1) - 0.5) * 0.16);
  });
  const dark = checker ? Array.from({ length: 4 }, (_, k) => tint(mixColor(base, "#5a544a", 0.62), (k / 3 - 0.5) * 0.08)) : [];
  const light = checker ? Array.from({ length: 4 }, (_, k) => tint(mixColor(base, "#e6dcc2", 0.35), (k / 3 - 0.5) * 0.08)) : [];
  const all = [...tones, ...dark, ...light];
  const fills = all.map(() => new Path2D());
  const rim = new Path2D();
  const lit = new Path2D();
  const grain = new Path2D();
  const worn = new Path2D();
  const dirt = new Path2D();
  const mossDots = new Path2D();
  const mossLines: Pt[][] = [];
  const veins: Pt[][] = [];
  const cracks: Pt[][] = [];
  const broken: Pt[][] = [];
  const holes: Pt[][] = [];
  const chips: Pt[][] = [];
  // près d'un mur ou de l'eau : la mousse prend dans les joints
  const damp = (x: number, y: number) => {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = at(x + dx, y + dy);
      if (t === T.eau || !isOpen(t)) return true;
    }
    return false;
  };
  const slab = (pts: Pt[], tone: number, cx: number, cy: number) => {
    const gx = pts.reduce((t, p) => t + p[0], 0) / pts.length;
    const gy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
    let q = pts.map(([px, py]) => {
      const dx = gx - px;
      const dy = gy - py;
      const l = Math.hypot(dx, dy) || 1;
      return [px + (dx / l) * 1.1, py + (dy / l) * 1.1] as Pt;
    });
    // coins émoussés par-ci par-là
    const soft: Pt[] = [];
    for (let k = 0; k < q.length; k++) {
      const p = q[k];
      if (r() < 0.22) {
        const a = q[(k + q.length - 1) % q.length];
        const b = q[(k + 1) % q.length];
        const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
        const lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
        const e = between(r, 1.8, 3.4);
        soft.push([p[0] + ((a[0] - p[0]) / la) * e, p[1] + ((a[1] - p[1]) / la) * e], [p[0] + ((b[0] - p[0]) / lb) * e, p[1] + ((b[1] - p[1]) / lb) * e]);
      } else soft.push(p);
    }
    q = soft;
    // un point au milieu de chaque côté long, poussé de ±0,8 px : l'arête n'est jamais tirée à la règle
    const rough: Pt[] = [];
    for (let k = 0; k < q.length; k++) {
      const a = q[k];
      const b = q[(k + 1) % q.length];
      rough.push(a);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 10) rough.push([(a[0] + b[0]) / 2 + (r() - 0.5) * 1.6, (a[1] + b[1]) / 2 + (r() - 0.5) * 1.6]);
    }
    addPoly(fills[tone], rough);
    addPoly(rim, rough);
    for (let k = 0; k < q.length; k++) {
      const a = q[k];
      const b = q[(k + 1) % q.length];
      if (b[1] - a[1] + a[0] - b[0] < 0) {
        lit.moveTo(a[0] + 0.9, a[1] + 0.9);
        lit.lineTo(b[0] + 0.9, b[1] + 0.9);
      }
    }
    if (r() < 0.3)
      for (let k = 0; k < 4; k++) {
        const px = gx + (r() - 0.5) * S * 0.5;
        const py = gy + (r() - 0.5) * S * 0.5;
        const pr = 0.5 + r() * 0.6;
        grain.moveTo(px + pr, py);
        grain.arc(px, py, pr, 0, Math.PI * 2);
      }
    // usure : un creux poli plus clair, ou une crasse plus sombre
    const w = r();
    if (w < 0.1) addPoly(worn, smoothPoints(blobPoints(r, gx, gy, S * 0.22, S * 0.18, 7, 0.35), 2));
    else if (w < 0.17) addPoly(dirt, smoothPoints(blobPoints(r, gx + (r() - 0.5) * 10, gy + (r() - 0.5) * 10, S * 0.16, S * 0.12, 7, 0.4), 2));
    if (checker && r() < 0.45) {
      const a = r() * Math.PI;
      const l = S * between(r, 0.25, 0.45);
      veins.push(smoothPoints([[gx - Math.cos(a) * l, gy - Math.sin(a) * l], [gx + (r() - 0.5) * 8, gy + (r() - 0.5) * 8], [gx + Math.cos(a) * l, gy + Math.sin(a) * l]], 2, false));
    }
    // mousse : des traits vert sombre le long d'un ou deux joints, près des murs et de l'eau (plus dans les salles humides)
    if (damp(cx, cy) && mossy(gx / 70, gy / 70) > (wet ? -0.25 : 0.1) && r() < (wet ? 0.75 : 0.45)) {
      const k0 = Math.floor(r() * q.length);
      for (let e = 0; e < 1 + Math.floor(r() * 2); e++) {
        const a = q[(k0 + e) % q.length];
        const b = q[(k0 + e + 1) % q.length];
        const t0 = r() * 0.4;
        const t1 = t0 + between(r, 0.35, 0.6);
        const pts: Pt[] = [];
        for (let t = t0; t <= t1; t += 0.12) pts.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 1.6, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 1.6]);
        if (pts.length > 1) mossLines.push(pts);
        for (let n = 0; n < 3; n++) {
          const t = between(r, t0, t1);
          const px = a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 3;
          const py = a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 3;
          const pr = between(r, 0.9, 2);
          mossDots.moveTo(px + pr, py);
          mossDots.arc(px, py, pr, 0, Math.PI * 2);
        }
      }
    }
    return q;
  };
  const toneFor = (x: number, y: number) => (checker ? ((x + y) % 2 ? N + Math.floor(r() * 4) : N + 4 + Math.floor(r() * 4)) : Math.floor(r() * N));
  if (!checker) bondSlabs(d, room, r, seed, (q, cx, cy, harm) => {
    const p = slab(q, toneFor(cx, cy), cx, cy);
    if (harm === 0) cracks.push(zigzag(r, p, S));
    else if (harm === 1) broken.push(p);
    else if (harm === 2) holes.push(p);
  });
  else
    for (let y = room.y; y < room.y + room.h; y++)
      for (let x = room.x; x < room.x + room.w; x++) {
        if (used.has(key(x, y)) || !inside(x, y)) continue;
        used.add(key(x, y));
        const v00 = v(x, y);
        const v10 = v(x + 1, y);
        const v11 = v(x + 1, y + 1);
        const v01 = v(x, y + 1);
        const harm = damaged.get(key(x, y));
        if (checker || harm !== undefined) {
          const q = slab([v00, v10, v11, v01], toneFor(x, y), x, y);
          if (harm === 0) cracks.push(zigzag(r, q, S));
          else if (harm === 1) broken.push(q);
          else if (harm === 2) holes.push(q);
          else if (harm === 3) chips.push(q);
          continue;
        }
        const free = (ix: number, iy: number) => inside(ix, iy) && !used.has(key(ix, iy)) && !damaged.has(key(ix, iy));
        const m = r();
        if (m < 0.04 && free(x + 1, y) && free(x, y + 1) && free(x + 1, y + 1)) {
          for (const [ix, iy] of [[x + 1, y], [x, y + 1], [x + 1, y + 1]]) used.add(key(ix, iy));
          slab([v00, v10, v(x + 2, y), v(x + 2, y + 1), v(x + 2, y + 2), v(x + 1, y + 2), v(x, y + 2), v01], toneFor(x, y), x, y);
          continue;
        }
        if (m < 0.11 && free(x + 1, y)) {
          used.add(key(x + 1, y));
          slab([v00, v10, v(x + 2, y), v(x + 2, y + 1), v11, v01], toneFor(x, y), x, y);
          continue;
        }
        if (m < 0.18 && free(x, y + 1)) {
          used.add(key(x, y + 1));
          slab([v00, v10, v11, v(x + 1, y + 2), v(x, y + 2), v01], toneFor(x, y), x, y);
          continue;
        }
        const p = r();
        const tm = lerp(v00, v10, between(r, 0.35, 0.65));
        const bm = lerp(v01, v11, between(r, 0.35, 0.65));
        const lm = lerp(v00, v01, between(r, 0.35, 0.65));
        const rm = lerp(v10, v11, between(r, 0.35, 0.65));
        if (p < 0.58) slab([v00, v10, v11, v01], toneFor(x, y), x, y);
        else if (p < 0.72) {
          // coupe droite
          if (r() < 0.5) {
            slab([v00, tm, bm, v01], toneFor(x, y), x, y);
            slab([tm, v10, v11, bm], toneFor(x, y), x, y);
          } else {
            slab([v00, v10, rm, lm], toneFor(x, y), x, y);
            slab([lm, rm, v11, v01], toneFor(x, y), x, y);
          }
        } else if (p < 0.86) {
          // coupe en T : une moitié entière, l'autre recoupée en travers
          const mid = lerp(tm, bm, between(r, 0.35, 0.65));
          if (r() < 0.5) {
            slab([v00, tm, bm, v01], toneFor(x, y), x, y);
            slab([tm, v10, rm, mid], toneFor(x, y), x, y);
            slab([mid, rm, v11, bm], toneFor(x, y), x, y);
          } else {
            slab([tm, v10, v11, bm], toneFor(x, y), x, y);
            slab([v00, tm, mid, lm], toneFor(x, y), x, y);
            slab([lm, mid, bm, v01], toneFor(x, y), x, y);
          }
        } else {
          // coupe en L : un petit carré pris dans un coin
          const c: Pt = [(tm[0] + bm[0]) / 2 + (r() - 0.5) * 3, (lm[1] + rm[1]) / 2 + (r() - 0.5) * 3];
          const k = Math.floor(r() * 4);
          if (k === 0) {
            slab([v00, tm, c, lm], toneFor(x, y), x, y);
            slab([tm, v10, v11, v01, lm, c], toneFor(x, y), x, y);
          } else if (k === 1) {
            slab([tm, v10, rm, c], toneFor(x, y), x, y);
            slab([v00, tm, c, rm, v11, v01], toneFor(x, y), x, y);
          } else if (k === 2) {
            slab([c, rm, v11, bm], toneFor(x, y), x, y);
            slab([v00, v10, rm, c, bm, v01], toneFor(x, y), x, y);
          } else {
            slab([lm, c, bm, v01], toneFor(x, y), x, y);
            slab([v00, v10, v11, bm, c, lm], toneFor(x, y), x, y);
          }
        }
      }
  all.forEach((t, k) => {
    g.fillStyle = t;
    g.fill(fills[k]);
  });
  g.lineJoin = "round";
  g.lineCap = "round";
  // pigment accumulé au bord de chaque dalle
  g.strokeStyle = tint(base, -0.32, 0.35);
  g.lineWidth = 1.6;
  g.stroke(rim);
  g.strokeStyle = "rgba(255,248,230,.2)";
  g.lineWidth = 1.1;
  g.stroke(lit);
  g.fillStyle = "rgba(255,246,226,.09)";
  g.fill(worn);
  g.fillStyle = "rgba(48,34,20,.14)";
  g.fill(dirt);
  g.fillStyle = "rgba(30,22,14,.22)";
  g.fill(grain);
  for (const m of mossLines) inkPolyline(g, m, r, { width: 2.4, taper: 4, wobble: 0.5, color: "rgba(58,78,34,.85)" });
  g.fillStyle = "rgba(74,96,42,.85)";
  g.fill(mossDots);
  for (const vn of veins) inkPolyline(g, vn, r, { width: 0.7, taper: 6, wobble: 0.6, color: "rgba(70,60,48,.35)" });
  for (const c of cracks) {
    inkPolyline(g, c.map(([x, y]) => [x + 0.8, y + 0.8] as Pt), r, { width: 0.9, taper: 5, wobble: 0.2, color: "rgba(255,244,220,.2)" });
    inkPolyline(g, c, r, { width: 1.2, taper: 5, wobble: 0.25, color: "rgba(20,14,8,.85)" });
  }
  // damier : coins ébréchés, éclat sombre et arête claire
  for (const q of chips) {
    const k = Math.floor(r() * q.length);
    const p = q[k];
    const a = q[(k + 1) % q.length];
    const b = q[(k + q.length - 1) % q.length];
    const e = between(r, 6, 11);
    const ua = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
    const ub = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const chip: Pt[] = [p, [p[0] + ((a[0] - p[0]) / ua) * e, p[1] + ((a[1] - p[1]) / ua) * e], [p[0] + ((a[0] + b[0]) / 2 - p[0]) * 0.22 + (r() - 0.5) * 3, p[1] + ((a[1] + b[1]) / 2 - p[1]) * 0.22 + (r() - 0.5) * 3], [p[0] + ((b[0] - p[0]) / ub) * e * 0.8, p[1] + ((b[1] - p[1]) / ub) * e * 0.8]];
    fillPoly(g, chip, mixColor(pal.grout, "#4a3a28", 0.4));
    inkOutline(g, chip, r, { width: 0.9, wobble: 0.2 });
  }
  // dalles brisées : un point d'impact, des fentes qui rayonnent jusqu'aux bords, des éclats
  for (const h of broken) {
    const gx = h.reduce((t, p) => t + p[0], 0) / h.length;
    const gy = h.reduce((t, p) => t + p[1], 0) / h.length;
    const c: Pt = [gx + (r() - 0.5) * 12, gy + (r() - 0.5) * 10];
    // l'éclat sauté au point d'impact : un polygone anguleux qui montre la terre, deux traits d'ombre dedans
    const chip = blobPoints(r, c[0], c[1], between(r, 5, 8), between(r, 4, 6.5), 5 + Math.floor(r() * 3), 0.35, r() * 3);
    fillPoly(g, chip, "#3b2d20");
    for (let k = 0; k < 2; k++) ln(d, r, WORLD, c[0] - 3 + k * 3, c[1] - 2, c[0] - 5 + k * 3, c[1] + 3, 0.8, "rgba(10,6,3,.7)");
    inkOutline(g, chip, r, { width: 1.3, wobble: 0.2 });
    const n = 4 + Math.floor(r() * 2);
    const a0 = r() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2 + (r() - 0.5) * 0.6;
      const pts = crackPoints(r, c[0], c[1], a, between(r, 14, 24));
      inkPolyline(g, pts.map(([x, y]) => [x + 0.8, y + 0.8] as Pt), r, { width: 0.8, taper: 5, wobble: 0.2, color: "rgba(255,244,220,.22)" });
      inkPolyline(g, pts, r, { width: 1.3, taper: 6, wobble: 0.25, color: "rgba(20,14,8,.85)" });
    }
    for (let k = 0; k < 3; k++) {
      const pts = blobPoints(r, c[0] + (r() - 0.5) * 22, c[1] + (r() - 0.5) * 18, between(r, 1.6, 3), between(r, 1.4, 2.6), 5, 0.35, r() * 3);
      fillPoly(g, pts.map(([x, y]) => [x + 1, y + 1.4] as Pt), "rgba(10,6,3,.5)");
      fillPoly(g, pts, tint(base, (r() - 0.5) * 0.12));
      inkOutline(g, pts, r, { width: 0.7, wobble: 0.15 });
    }
  }
  for (const h of holes) slabHole(d, g, r, h, base);
}

/**
 * Dallage en appareil, découplé de la grille de jeu : rangs de 0,8 à 1,25 case, dalles de 1 à 1,8 case de long,
 * joints décalés d'un rang à l'autre, rangs dans le sens de la longueur de la salle. Les lits de joint penchent
 * à peine, les joints montants tremblent de ±2 px : aucune dalle n'est tirée à l'équerre. Deux ou trois dalles
 * fendues ou brisées, une ou deux arrachées (jamais devant une porte). `lay(q, cx, cy, harm)` reçoit chaque dalle
 * (harm : −1 intacte, 0 fendue, 1 brisée, 2 arrachée), (cx, cy) étant la case sous son centre.
 */
function bondSlabs(d: Dungeon, room: Room, r: Rng, seed: number, lay: (q: Pt[], cx: number, cy: number, harm: number) => void) {
  const { S, W, at } = d;
  const along = room.w >= room.h;
  const X0 = room.x * S;
  const Y0 = room.y * S;
  const U = (along ? room.w : room.h) * S;
  const V = (along ? room.h : room.w) * S;
  const xy = (u: number, v: number): Pt => (along ? [X0 + u, Y0 + v] : [X0 + v, Y0 + u]);
  const slabs: { q: Pt[]; cx: number; cy: number }[] = [];
  // lits de joint : v = base + pente × u
  let base = -S * between(r, 0.2, 0.6);
  let slope = 0;
  while (base < V) {
    const h = S * between(r, 0.8, 1.25);
    const nextSlope = (r() - 0.5) * 0.02;
    const top = (u: number) => base + slope * u;
    const bot = (u: number) => base + h + nextSlope * u;
    let u = -S * between(r, 0, 1.2);
    let jt = (r() - 0.5) * 4;
    let jb = (r() - 0.5) * 4;
    while (u < U) {
      const len = S * between(r, 1, 1.8);
      const nt = (r() - 0.5) * 4;
      const nb = (r() - 0.5) * 4;
      const u0t = u + jt;
      const u0b = u + jb;
      const u1t = u + len + nt;
      const u1b = u + len + nb;
      const q: Pt[] = [xy(u0t, top(u0t)), xy(u1t, top(u1t)), xy(u1b, bot(u1b)), xy(u0b, bot(u0b))];
      const gx = q.reduce((t, p) => t + p[0], 0) / 4;
      const gy = q.reduce((t, p) => t + p[1], 0) / 4;
      const cx = Math.max(room.x, Math.min(room.x + room.w - 1, Math.floor(gx / S)));
      const cy = Math.max(room.y, Math.min(room.y + room.h - 1, Math.floor(gy / S)));
      slabs.push({ q, cx, cy });
      u += len;
      jt = nt;
      jb = nb;
    }
    base += h;
    slope = nextSlope;
  }
  // dalles abîmées : entières dans la salle, sur du sol sec, jamais devant une porte
  const harm = new Map<number, number>();
  const want = [2 + Math.floor(r() * 2), 1 + Math.floor(r() * 2)];
  for (let n = 0; n < 60 && (want[0] > 0 || want[1] > 0); n++) {
    const i = Math.floor(r() * slabs.length);
    const { q, cx, cy } = slabs[i];
    if (harm.has(i) || d.doorway[cy * W + cx] || at(cx, cy) !== T.sol) continue;
    // une dalle arrachée est une courte : un trou d'une case et demie se lirait comme une fosse
    const short = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) < S * 1.25;
    if (q.some(([x, y]) => x < X0 + 2 || y < Y0 + 2 || x > X0 + room.w * S - 2 || y > Y0 + room.h * S - 2)) continue;
    const k = want[1] > 0 && short && r() < 0.5 ? 2 : want[0] > 0 ? (r() < 0.5 ? 0 : 1) : -1;
    if (k < 0) continue;
    if (k === 2) want[1]--;
    else want[0]--;
    harm.set(i, k);
  }
  slabs.forEach(({ q, cx, cy }, i) => lay(q, cx, cy, harm.get(i) ?? -1));
}

/** Fissure en zigzag d'un coin de la dalle vers le milieu, qui s'éteint avant l'autre bord. */
function zigzag(r: Rng, q: Pt[], S: number): Pt[] {
  const gx = q.reduce((t, p) => t + p[0], 0) / q.length;
  const gy = q.reduce((t, p) => t + p[1], 0) / q.length;
  const [px, py] = q[Math.floor(r() * q.length)];
  let a = Math.atan2(gy - py, gx - px) + (r() - 0.5) * 0.7;
  const pts: Pt[] = [[px, py]];
  let x = px;
  let y = py;
  const seg = S * between(r, 0.18, 0.24);
  for (let i = 0; i < 5; i++) {
    a += (i % 2 ? 0.75 : -0.75) + (r() - 0.5) * 0.4;
    x += Math.cos(a) * seg;
    y += Math.sin(a) * seg;
    pts.push([x, y]);
  }
  return pts;
}

/**
 * Dalle arrachée : un trou au contour cassé dans la dalle, fond de terre brun-noir hachuré, paroi éclairée
 * en bas à droite (la lumière vient du haut à gauche), débris dedans et quelques éclats sur les dalles voisines.
 */
function slabHole(d: Dungeon, g: CanvasRenderingContext2D, r: Rng, q: Pt[], base: string) {
  const gx = q.reduce((t, p) => t + p[0], 0) / q.length;
  const gy = q.reduce((t, p) => t + p[1], 0) / q.length;
  const S = d.S;
  // la dalle entière est partie : son contour, cassé par endroits (morceaux restés pris dans le mortier)
  const hole: Pt[] = [];
  for (let k = 0; k < q.length; k++) {
    const a = q[k];
    const b = q[(k + 1) % q.length];
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const bite = r() < 0.25 ? between(r, 2, 5) : between(r, 0, 1.2);
      const px = a[0] + (b[0] - a[0]) * t;
      const py = a[1] + (b[1] - a[1]) * t;
      const l = Math.hypot(gx - px, gy - py) || 1;
      hole.push([px + ((gx - px) / l) * bite, py + ((gy - py) / l) * bite]);
    }
  }
  const shape = shapeOf(hole);
  withArea(g, shape, (cg) => {
    // terre battue sous la dalle : brune, pas noire (ce n'est pas une fosse)
    cg.fillStyle = mixColor(base, "#4a3622", 0.7);
    cg.fill(shape.path);
    // paroi éclairée : ce qui reste du trou quand on le décale vers le haut à gauche
    const lit = new Path2D();
    lit.rect(gx - S, gy - S, S * 2, S * 2);
    addPoly(lit, hole.map(([x, y]) => [x - 4, y - 5] as Pt));
    cg.save();
    cg.clip(lit, "evenodd");
    cg.fillStyle = mixColor(base, "#5a4632", 0.55);
    cg.fillRect(gx - S, gy - S, S * 2, S * 2);
    cg.restore();
    // ombre du bord haut-gauche sur la terre : hachures serrées dans une bande de 5 px
    const shade = new Path2D();
    shade.rect(gx - S * 1.2, gy - S * 1.2, S * 2.4, S * 2.4);
    addPoly(shade, hole.map(([x, y]) => [x + 4, y + 5] as Pt));
    cg.save();
    cg.clip(shade, "evenodd");
    cg.fillStyle = "rgba(20,12,6,.45)";
    cg.fillRect(gx - S * 1.2, gy - S * 1.2, S * 2.4, S * 2.4);
    hatch(cg, rectShape(gx - S * 1.2, gy - S * 1.2, S * 2.4, S * 2.4), r, { angle: -Math.PI / 4, spacing: 2.6, width: 0.8, color: "rgba(8,5,3,.7)" });
    cg.restore();
    // grain de la terre
    cg.fillStyle = "rgba(20,12,6,.45)";
    for (let k = 0; k < 26; k++) dot(cg, gx + (r() - 0.5) * S * 1.3, gy + (r() - 0.5) * S * 1.1, between(r, 0.5, 1.1));
    for (let k = 0; k < 5; k++) {
      const pts = blobPoints(r, gx + (r() - 0.5) * S * 0.5, gy + (r() - 0.5) * S * 0.45, between(r, 2, 4.5), between(r, 1.8, 3.5), 5, 0.3, r() * 3);
      fillPoly(cg, pts.map(([x, y]) => [x + 1.2, y + 1.6] as Pt), "rgba(0,0,0,.5)");
      fillPoly(cg, pts, tint(base, -0.08 + (r() - 0.5) * 0.15));
      inkOutline(cg, pts, r, { width: 0.6, wobble: 0.2 });
    }
  });
  inkOutline(g, hole, r, { width: 1.5, wobble: 0.35, pressure: 0.3 });
  // éclats sortis du trou, sur les dalles autour
  for (let k = 0; k < 3; k++) {
    const a = r() * Math.PI * 2;
    const l = S * between(r, 0.45, 0.7);
    const pts = blobPoints(r, gx + Math.cos(a) * l, gy + Math.sin(a) * l, between(r, 1.8, 3.4), between(r, 1.4, 2.8), 5, 0.35, r() * 3);
    fillPoly(g, pts.map(([x, y]) => [x + 1, y + 1.4] as Pt), "rgba(10,6,3,.45)");
    fillPoly(g, pts, tint(base, (r() - 0.5) * 0.12));
    inkOutline(g, pts, r, { width: 0.7, wobble: 0.15 });
  }
}

/** Plaques de métal (une ou deux cases), rivets, grilles d'aération. */
function layPlates(g: CanvasRenderingContext2D, r: Rng, [bx, by, bw, bh]: [number, number, number, number], S: number, base: string, keep: (px: number, py: number) => boolean, small: boolean) {
  const s = small ? S / 2 : S;
  for (let y = by; y < by + bh; y += s)
    for (let x = bx; x < bx + bw; x += s) {
      if (!keep(x + s / 2, y + s / 2)) continue;
      const pts: Pt[] = [[x + 1.5, y + 1.5], [x + s - 1.5, y + 1.5], [x + s - 1.5, y + s - 1.5], [x + 1.5, y + s - 1.5]];
      fillPoly(g, pts.map(([px, py]) => [px + 1, py + 1.3] as Pt), "rgba(5,8,12,.5)");
      fillPoly(g, pts, tint(base, (r() - 0.5) * 0.08));
      g.strokeStyle = "rgba(5,8,12,.55)";
      g.lineWidth = 0.9;
      strokePoly(g, pts);
      g.fillStyle = tint(base, 0.18, 0.8);
      for (const [rx, ry] of [[4, 4], [s - 4, 4], [4, s - 4], [s - 4, s - 4]]) dot(g, x + rx, y + ry, 1.3);
      const k = r();
      if (!small && k < 0.12) {
        g.fillStyle = "rgba(5,8,12,.6)";
        for (let i = 9; i < s - 9; i += 5) g.fillRect(x + i, y + 10, 2.2, s - 20);
      } else if (k < 0.2) {
        g.strokeStyle = "rgba(5,8,12,.3)";
        g.beginPath();
        g.moveTo(x + 6, y + s * r());
        g.lineTo(x + s - 6, y + s * r());
        g.stroke();
      }
    }
}

/** Plancher : planches de longueur variable, joints décalés, clous, veines du bois. */
function layPlanks(g: CanvasRenderingContext2D, r: Rng, [bx, by, bw, bh]: [number, number, number, number], base: string, keep: (px: number, py: number) => boolean, vertical: boolean) {
  g.save();
  if (vertical) {
    g.translate(bx + bw, by);
    g.rotate(Math.PI / 2);
    [bx, by, bw, bh] = [0, 0, bh, bw];
  }
  const back = (px: number, py: number): [number, number] => (vertical ? [bx + py, by] : [px, py]);
  for (let y = by; y < by + bh; y += 12) {
    let x = bx - r() * 80;
    while (x < bx + bw) {
      const len = between(r, 60, 150);
      const [kx, ky] = vertical ? [bx + bw - (y + 6), x + len / 2] : back(x + len / 2, y + 6);
      if (keep(vertical ? kx : kx, vertical ? ky : ky)) {
        const pts: Pt[] = [[x + 0.8, y + 0.8], [x + len - 0.8, y + 0.8], [x + len - 0.8, y + 11.2], [x + 0.8, y + 11.2]];
        fillPoly(g, pts, tint(base, (r() - 0.5) * 0.12));
        g.strokeStyle = "rgba(25,15,8,.55)";
        g.lineWidth = 0.9;
        strokePoly(g, pts);
        g.strokeStyle = "rgba(25,15,8,.18)";
        g.beginPath();
        const yy = y + 3 + r() * 6;
        g.moveTo(x + 3, yy);
        g.bezierCurveTo(x + len * 0.3, yy - 2, x + len * 0.6, yy + 2, x + len - 3, yy + (r() - 0.5) * 2);
        g.stroke();
        g.fillStyle = "rgba(25,15,8,.6)";
        dot(g, x + 4, y + 4, 0.9);
        dot(g, x + 4, y + 8, 0.9);
      }
      x += len;
    }
  }
  g.restore();
}

/** Deux nombres au hasard dans [0, 1[ attachés à un sommet du réseau (partagés par les dalles voisines). */
function hashPair(i: number, j: number, seed: number): [number, number] {
  return [hash(i, j, seed), hash(j + 7919, i - 104729, seed)];
}

/** Taches, fissures, mousse, flaques, gravats : le sol a vécu. */
function paintFloorWear(d: Dungeon) {
  const { g, W, H, S, at, pal, seed, c } = d;
  const rooms = c.map.rooms;
  const wet = c.material !== "metal";
  rooms.forEach((room, i) => {
    const r = rng(seed, 50, i);
    const px = room.x * S;
    const py = room.y * S;
    const pw = room.w * S;
    const ph = room.h * S;
    // Grandes taches délavées.
    for (let k = 0; k < 2 + Math.floor(r() * 3); k++) {
      const x = px + r() * pw;
      const y = py + r() * ph;
      const rad = between(r, 18, 46);
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      const col = pick(r, ["58,40,22", "46,46,32", "70,44,24"]);
      grad.addColorStop(0, `rgba(${col},.12)`);
      grad.addColorStop(0.7, `rgba(${col},.09)`);
      grad.addColorStop(0.85, `rgba(${col},.14)`);
      grad.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grad;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // Fissures qui partent d'un mur (deux par salle en moyenne).
    for (let n = 0; n < 1 + Math.floor(r() * 2.6); n++) {
      const side = Math.floor(r() * 4);
      const sx = side === 1 ? px + pw : side === 3 ? px : px + r() * pw;
      const sy = side === 0 ? py : side === 2 ? py + ph : py + r() * ph;
      const ang = side === 0 ? Math.PI / 2 : side === 1 ? Math.PI : side === 2 ? -Math.PI / 2 : 0;
      const main = crackPoints(r, sx, sy, ang + (r() - 0.5) * 0.8, between(r, 50, 130));
      inkPolyline(g, main.map(([x, y]) => [x + 0.8, y + 0.8] as Pt), r, { width: 1.1, taper: 10, color: "rgba(255,240,210,.22)", wobble: 0.3 });
      inkPolyline(g, main, r, { width: 1.3, taper: 10, wobble: 0.3, color: "rgba(22,15,9,.75)" });
      const from = main[Math.floor(main.length / 2)];
      inkPolyline(g, crackPoints(r, from[0], from[1], ang + (r() < 0.5 ? 0.9 : -0.9), between(r, 20, 50)), r, { width: 0.8, taper: 8, wobble: 0.3 });
    }
    // Mousse au pied du mur le plus humide (et dans ses coins) : touffes de points et de petits traits verts.
    if (wet && r() < 0.75) moss(d, r, room, Math.floor(r() * 4));
    // Flaques : polygones irréguliers, reflet en croissant, bord sombre.
    if (wet && hash(i, 7, seed) < 0.33)
      for (let n = 0; n < 1 + (r() < 0.35 ? 1 : 0); n++) {
        const cx = px + between(r, 0.2, 0.8) * pw;
        const cy = py + between(r, 0.2, 0.8) * ph;
        if (d.at(Math.floor(cx / S), Math.floor(cy / S)) !== T.sol) continue;
        puddle(d, r, cx, cy, between(r, 10, 26), between(r, 7, 16));
      }
    // Gravats le long des murs.
    for (let k = 0; k < 4 + Math.floor(r() * 5); k++) {
      const side = Math.floor(r() * 4);
      const cx = side === 1 ? px + pw - 8 : side === 3 ? px + 8 : px + r() * pw;
      const cy = side === 0 ? py + 8 : side === 2 ? py + ph - 8 : py + r() * ph;
      const cell = d.roomAt[Math.floor(cy / S) * W + Math.floor(cx / S)];
      if (cell !== i || d.busy[Math.floor(cy / S) * W + Math.floor(cx / S)]) continue;
      rubble(d, r, cx, cy, 3 + Math.floor(r() * 5), 12);
    }
  });
  // Couloirs : poussière et éboulis.
  const r = rng(seed, 60);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.route || d.roomAt[y * W + x] >= 0) continue;
      if (r() < 0.12) rubble(d, r, (x + 0.2 + r() * 0.6) * S, (y + 0.2 + r() * 0.6) * S, 2 + Math.floor(r() * 3), 8);
      if (r() < 0.1) inkPolyline(g, crackPoints(r, (x + r()) * S, y * S, Math.PI / 2 + (r() - 0.5), between(r, 20, 40)), r, { width: 0.9, taper: 6, wobble: 0.3, color: "rgba(22,15,9,.7)" });
    }
}

/** Flaque : polygone de 8 à 12 sommets bruités, eau sombre, reflet clair en croissant, contour sombre. */
function puddle(d: Dungeon, r: Rng, cx: number, cy: number, rx: number, ry: number) {
  const { g, pal } = d;
  const n = 8 + Math.floor(r() * 5);
  const rot = r() * Math.PI;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.4;
    const k2 = between(r, 0.65, 1.15);
    const x = Math.cos(a) * rx * k2;
    const y = Math.sin(a) * ry * k2;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  const shape = smoothPoints(pts, 1);
  washFill(g, shapeOf(shape), mixColor(mixColor(pal.water, "#3a3a2c", 0.55), "#14140f", 0.45), r, { alpha: 0.45, edge: 2.5, variation: 0.6, blot: 8, granulation: 0.2 });
  // reflet en croissant, en haut à gauche
  g.save();
  g.beginPath();
  shape.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  g.fillStyle = "rgba(225,236,228,.3)";
  g.beginPath();
  g.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.55, ry * 0.4, rot * 0.2, Math.PI * 0.95, Math.PI * 1.75);
  g.ellipse(cx - rx * 0.15, cy - ry * 0.15, rx * 0.5, ry * 0.32, rot * 0.2, Math.PI * 1.75, Math.PI * 0.95, true);
  g.fill();
  g.restore();
  inkOutline(g, shape, r, { width: 1, wobble: 0.3, color: "rgba(18,14,10,.75)" });
}

/** Mousse au pied d'un mur de la salle (côté 0 haut, 1 droite, 2 bas, 3 gauche), plus dense dans les coins. */
function moss(d: Dungeon, r: Rng, room: Room, side: number) {
  const { g, S } = d;
  const greens = ["#56703a", "#3e5428", "#7d9148", "#647a3c"];
  const along = (side % 2 === 0 ? room.w : room.h) * S;
  const dots = new Map<string, Path2D>();
  const strokes = new Path2D();
  const n = Math.round(along / 6);
  for (let k = 0; k < n; k++) {
    // densité : forte dans les coins, par plaques ailleurs
    const t = r();
    const corner = Math.min(t, 1 - t) * along;
    if (corner > S * 1.2 && r() < 0.65) continue;
    const off = r() * r() * S * 0.45;
    const u = t * along;
    let x: number;
    let y: number;
    if (side === 0) [x, y] = [room.x * S + u, room.y * S + 3 + off];
    else if (side === 1) [x, y] = [(room.x + room.w) * S - 3 - off, room.y * S + u];
    else if (side === 2) [x, y] = [room.x * S + u, (room.y + room.h) * S - 3 - off];
    else [x, y] = [room.x * S + 3 + off, room.y * S + u];
    const cell = Math.floor(y / S) * d.W + Math.floor(x / S);
    if (d.at(Math.floor(x / S), Math.floor(y / S)) !== T.sol || d.busy[cell]) continue;
    for (let j = 0; j < 4; j++) {
      const c = pick(r, greens);
      if (!dots.has(c)) dots.set(c, new Path2D());
      const px = x + (r() - 0.5) * 7;
      const py = y + (r() - 0.5) * 7;
      const rad = between(r, 0.7, 1.7);
      dots.get(c)!.moveTo(px + rad, py);
      dots.get(c)!.arc(px, py, rad, 0, Math.PI * 2);
    }
    if (r() < 0.6) {
      const a = r() * Math.PI * 2;
      strokes.moveTo(x, y);
      strokes.lineTo(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5);
    }
  }
  g.save();
  g.beginPath();
  g.rect(room.x * S, room.y * S, room.w * S, room.h * S);
  g.clip();
  for (const [c, p] of dots) {
    g.fillStyle = c;
    g.fill(p);
  }
  g.strokeStyle = "rgba(40,56,24,.85)";
  g.lineWidth = 0.8;
  g.lineCap = "round";
  g.stroke(strokes);
  g.restore();
}

/** Petits éclats de pierre autour d'un point. */
function rubble(d: Dungeon, r: Rng, cx: number, cy: number, n: number, spread: number) {
  const { g, pal } = d;
  for (let k = 0; k < n; k++) {
    const pts = blobPoints(r, cx + (r() - 0.5) * spread * 2, cy + (r() - 0.5) * spread * 2, between(r, 1.6, 4.2), between(r, 1.4, 3.4), 6, 0.35, r() * 3);
    fillPoly(g, pts.map(([x, y]) => [x + 1.5, y + 2] as Pt), SHADOW);
    fillPoly(g, pts, tint(pal.stone, (r() - 0.5) * 0.12));
    inkOutline(g, pts, r, { width: 0.8, wobble: 0.2, pressure: 0.3 });
  }
}

/**
 * Bassins au contour arrondi (contour des cases d'eau lissé), margelle de pierres de taille irrégulières,
 * eau bleu-vert sombre et désaturée, plus claire au bord et plus profonde au centre, rides fines qui suivent la rive.
 * Une case de sol cernée d'eau devient une pierre de gué ronde, avec son ombre sur l'eau et ses rides.
 */
function paintPools(d: Dungeon) {
  const { g, W, H, S, at, pal, seed } = d;
  const water = (x: number, y: number) => at(x, y) === T.eau;
  const island = (x: number, y: number) => at(x, y) === T.sol && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => water(x + dx, y + dy)).length >= 3;
  const area = (x: number, y: number) => water(x, y) || island(x, y);
  const loops = cellContour(area, W, H, S, { smooth: 2, round: 2, jitter: 1.6, seed: seed + 70 });
  if (!loops.length) return;
  const path = loopsPath(loops);
  const shape: Shape = { path, box: [0, 0, W * S, H * S] };
  const r = rng(seed, 70);
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const l of loops)
    for (const [x, y] of l) {
      bx0 = Math.min(bx0, x);
      by0 = Math.min(by0, y);
      bx1 = Math.max(bx1, x);
      by1 = Math.max(by1, y);
    }
  const pad = S;
  const box: [number, number, number, number] = [Math.floor(bx0 - pad), Math.floor(by0 - pad), Math.ceil(bx1 - bx0 + pad * 2), Math.ceil(by1 - by0 + pad * 2)];
  const outside = new Path2D();
  outside.rect(...box);
  outside.addPath(path);
  // Margelle : bandeau de pierres taillées autour de l'eau, posé sur le sol.
  const rimW = S * 0.26;
  const rim = mixColor(pal.block, "#cfc4aa", 0.35);
  withArea(g, { path: outside, box }, (cg) => {
    cg.lineJoin = "round";
    cg.save();
    cg.translate(3, 4);
    cg.strokeStyle = "rgba(8,5,3,.35)";
    cg.lineWidth = 2 * rimW + 8;
    cg.stroke(path);
    cg.restore();
    cg.strokeStyle = INK;
    cg.lineWidth = 2 * rimW + 6;
    cg.stroke(path);
    cg.strokeStyle = rim;
    cg.lineWidth = 2 * rimW;
    cg.stroke(path);
    // joints en travers, teinte par pierre, arête claire côté sol
    const joints = new Path2D();
    const lit = new Path2D();
    for (const loop of loops) {
      let acc = 0;
      let next = between(r, S * 0.35, S * 0.65);
      const n = loop.length;
      for (let i = 0; i < n; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % n];
        const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!seg) continue;
        const tx = (b[0] - a[0]) / seg;
        const ty = (b[1] - a[1]) / seg;
        // normale vers l'extérieur de l'eau (l'eau est à droite du sens de parcours)
        const nx = ty;
        const ny = -tx;
        lit.moveTo(a[0] + nx * (rimW - 1.5), a[1] + ny * (rimW - 1.5));
        lit.lineTo(b[0] + nx * (rimW - 1.5), b[1] + ny * (rimW - 1.5));
        acc += seg;
        if (acc >= next) {
          acc = 0;
          next = between(r, S * 0.35, S * 0.65);
          joints.moveTo(b[0] + (r() - 0.5), b[1] + (r() - 0.5));
          joints.lineTo(b[0] + nx * rimW + (r() - 0.5) * 2, b[1] + ny * rimW + (r() - 0.5) * 2);
          // une pierre sur trois un peu plus sombre
          if (r() < 0.35) {
            cg.fillStyle = tint(rim, -0.12, 0.35);
            cg.beginPath();
            cg.arc(b[0] + nx * rimW * 0.5 - tx * S * 0.2, b[1] + ny * rimW * 0.5 - ty * S * 0.2, rimW * 0.45, 0, Math.PI * 2);
            cg.fill();
          }
        }
      }
    }
    cg.lineCap = "round";
    cg.strokeStyle = "rgba(255,248,230,.35)";
    cg.lineWidth = 1.3;
    cg.stroke(lit);
    cg.strokeStyle = "rgba(24,16,10,.8)";
    cg.lineWidth = 1.2;
    cg.stroke(joints);
  });
  // Eau : fond profond, bords moins profonds plus clairs.
  const deep = mixColor(mixColor(pal.water, "#24363a", 0.55), "#0c1416", 0.35);
  const shallow = mixColor(mixColor(pal.water, "#6f8a86", 0.5), "#b8c8bc", 0.2);
  withArea(g, shape, (cg) => {
    cg.fillStyle = deep;
    cg.fillRect(...box);
    cg.lineJoin = "round";
    for (const [w, a] of [[S * 1.5, 0.12], [S * 0.9, 0.16], [S * 0.45, 0.2], [10, 0.26]] as const) {
      cg.strokeStyle = tint(shallow, 0, a);
      cg.lineWidth = w;
      cg.stroke(path);
    }
    stipple(cg, rectShape(...box), r, { density: 0.08, radius: 0.7, color: "rgba(6,12,14,.4)" });
  });
  // Rides parallèles à la rive : anneaux fins découpés dans un calque.
  const ring = canvas(box[2], box[3]);
  const rg = ring.getContext("2d")!;
  rg.translate(-box[0], -box[1]);
  rg.lineJoin = "round";
  for (const k of [9, 17, 27]) {
    rg.globalCompositeOperation = "source-over";
    rg.strokeStyle = `rgba(214,232,226,${k === 9 ? 0.4 : 0.28})`;
    rg.lineWidth = 2 * k + 1.6;
    rg.setLineDash([between(r, 20, 50), between(r, 8, 24)]);
    rg.stroke(path);
    rg.globalCompositeOperation = "destination-out";
    rg.setLineDash([]);
    rg.lineWidth = 2 * k;
    rg.strokeStyle = "#000";
    rg.stroke(path);
  }
  withArea(g, shape, (cg) => cg.drawImage(ring, box[0], box[1]));
  // Ombre de la margelle sur l'eau (lumière du haut à gauche), hachurée.
  const shifted = new Path2D();
  shifted.rect(...box);
  shifted.addPath(path, new DOMMatrix().translate(7, 9));
  g.save();
  g.clip(path);
  g.clip(shifted, "evenodd");
  g.fillStyle = "rgba(2,6,8,.4)";
  g.fillRect(...box);
  hatch(g, rectShape(...box), r, { angle: -Math.PI / 4, spacing: 3.4, width: 0.7, color: "rgba(2,6,8,.5)" });
  g.restore();
  // Reflets : quelques traits clairs horizontaux.
  withArea(g, shape, (cg) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!water(x, y) || r() < 0.7) continue;
        const px = (x + r()) * S;
        const py = (y + r()) * S;
        inkLine(cg, px, py, px + between(r, 8, 16), py + (r() - 0.5) * 2, r, { width: 1.1, color: "rgba(232,244,238,.45)", wobble: 0.2 });
      }
  });
  inkOutline(g, loops, r, { width: 1.6, wobble: 0.4, pressure: 0.35 });
  // Pierres de gué.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!island(x, y)) continue;
      const rr = rng(seed, 72, x, y);
      const cx = (x + 0.5) * S + (rr() - 0.5) * 4;
      const cy = (y + 0.5) * S + (rr() - 0.5) * 4;
      const pts = smoothPoints(blobPoints(rr, cx, cy, S * between(rr, 0.38, 0.44), S * between(rr, 0.34, 0.42), 9, 0.14, rr() * 3), 2);
      // rides autour de la pierre
      g.strokeStyle = "rgba(214,232,226,.4)";
      g.lineWidth = 1;
      for (const k of [6, 12]) {
        g.beginPath();
        g.ellipse(cx + 1, cy + 1, S * 0.42 + k, S * 0.4 + k * 0.9, 0, Math.PI * between(rr, 0.1, 0.4), Math.PI * between(rr, 1.1, 1.6));
        g.stroke();
      }
      fillPoly(g, pts.map(([px, py]) => [px + 5, py + 6] as Pt), "rgba(2,6,8,.5)");
      fillPoly(g, pts, tint(mixColor(pal.block, "#bdb29a", 0.3), (rr() - 0.5) * 0.1));
      const grad = g.createRadialGradient(cx - S * 0.15, cy - S * 0.18, 0, cx, cy, S * 0.45);
      grad.addColorStop(0, "rgba(255,246,224,.32)");
      grad.addColorStop(0.55, "rgba(255,246,224,0)");
      grad.addColorStop(1, "rgba(20,12,6,.38)");
      g.fillStyle = grad;
      fillPath(g, pts);
      // mousse humide au ras de l'eau, fissure
      g.fillStyle = "rgba(70,96,52,.45)";
      for (let k = 0; k < 6; k++) {
        const p = pts[Math.floor(rr() * pts.length)];
        dot(g, p[0] + (cx - p[0]) * 0.12, p[1] + (cy - p[1]) * 0.12, between(rr, 1, 2.2));
      }
      inkPolyline(g, crackPoints(rr, cx + (rr() - 0.5) * S * 0.3, cy - S * 0.25, Math.PI / 2 + (rr() - 0.5), S * 0.35), rr, { width: 0.8, taper: 4, wobble: 0.2 });
      inkOutline(g, pts, rr, { width: 1.9, wobble: 0.35, pressure: 0.35 });
    }
}

/**
 * Ombre portée des murs sur le sol, lumière du haut à gauche : toute la masse pleine (roche et murs) décalée
 * vers le bas à droite en quatre paliers jusqu'à 0,25 case, en multiplication : un dégradé qui vaut 0,45 au
 * pied du mur et s'éteint, donc marqué au pied des murs nord et ouest. Puis, au pied de tous les murs, une
 * bande sombre de 7 px en dégradé (le pigment s'accumule dans l'angle).
 */
function paintWallShadows(d: Dungeon) {
  const { g, W, H, S, at, seed } = d;
  const open = (x: number, y: number) => isOpen(at(x, y));
  const floor = cellShape(open, W, H, S).path;
  const mass = outsideFloor(d).path;
  g.save();
  g.clip(floor);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(40,26,16,.15)";
  for (let i = 4; i >= 1; i--) {
    const f = (S * 0.25 * i) / 4;
    g.save();
    g.translate(f * 0.6, f * 0.8);
    g.fill(mass, "evenodd");
    g.restore();
  }
  const edge = loopsPath(cellContour(open, W, H, S, { smooth: 0, jitter: 0.6, seed: seed + 18 }));
  g.lineJoin = "miter";
  g.strokeStyle = "rgba(40,26,16,.13)";
  for (const w of [14, 9, 5]) {
    g.lineWidth = w;
    g.stroke(edge);
  }
  g.restore();
}

/** Trait d'encre entre sol et mur, côté salle : fin (1,5 px), le gras est côté roche. */
function paintInnerEdge(d: Dungeon) {
  const { g, W, H, S, at, seed } = d;
  const loops = cellContour((x, y) => isOpen(at(x, y)), W, H, S, { smooth: 0 });
  inkOutline(g, loops, rng(seed, 10), { width: 1.6, wobble: 0.5, pressure: 0.25 });
}

/**
 * Quadrillage posé en dernier, seulement sur les cases praticables (découpé au sol, jamais sur la roche
 * ni dans les murs) : un trait net de 1 px, sombre à 34 %, doublé d'un reflet clair très léger.
 */
function paintDungeonGrid(d: Dungeon) {
  const { g, W, H, S, at } = d;
  const p = new Path2D();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y))) continue;
      if (isOpen(at(x, y - 1))) {
        p.moveTo(x * S, y * S + 0.5);
        p.lineTo((x + 1) * S, y * S + 0.5);
      }
      if (isOpen(at(x - 1, y))) {
        p.moveTo(x * S + 0.5, y * S);
        p.lineTo(x * S + 0.5, (y + 1) * S);
      }
    }
  g.save();
  g.clip(cellShape((x, y) => isOpen(at(x, y)), W, H, S).path);
  g.lineCap = "butt";
  g.lineWidth = 1;
  // un filet sombre posé franchement (lisible aussi sur les dalles déjà noires) et son reflet clair juste à côté :
  // la grille reste discrète mais se voit partout, de jour comme dans la pénombre
  g.strokeStyle = "rgba(12,8,4,.34)";
  g.stroke(p);
  g.translate(1, 1);
  g.strokeStyle = "rgba(255,238,205,.11)";
  g.stroke(p);
  g.restore();
}

// ——— Mobilier ———

/** Point local → image. */
function P(f: Frame, x: number, y: number): Pt {
  const c = Math.cos(f.rot);
  const s = Math.sin(f.rot);
  return [f.ox + x * c - y * s, f.oy + x * s + y * c];
}
const L = (f: Frame, pts: Pt[]) => pts.map(([x, y]) => P(f, x, y));
const rectL = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const ellL = (cx: number, cy: number, rx: number, ry: number, n = 18): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry] as Pt);
const WORLD: Frame = { ox: 0, oy: 0, rot: 0 };

interface SolidOpts {
  /** Hauteur apparente : longueur de l'ombre portée (5 par défaut, 0 = posé à plat). */
  h?: number;
  line?: number;
  /** Modelé : éclairé en haut à gauche, sombre en bas à droite. */
  light?: number;
  alpha?: number;
}

/** Volume en vue de dessus (points en coordonnées image) : ombre portée, couleur, modelé, contour d'encre. */
function solid(d: Dungeon, r: Rng, pts: Pt[], color: string, o: SolidOpts = {}) {
  const { g } = d;
  const { h = 5, line = 1.5, light = 1, alpha = 1 } = o;
  if (h > 0) fillPoly(g, pts.map(([x, y]) => [x + Math.max(2, h * 0.6), y + Math.max(2, h * 0.75)] as Pt), SHADOW);
  if (h >= 3 && polyArea(pts) > d.S * d.S * 0.4) d.casters.push({ pts, h });
  g.globalAlpha = alpha;
  fillPoly(g, pts, color);
  g.globalAlpha = 1;
  if (light > 0) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, `rgba(255,240,210,${0.22 * light})`);
    grad.addColorStop(0.45, "rgba(255,240,210,0)");
    grad.addColorStop(1, `rgba(12,7,3,${0.32 * light})`);
    g.fillStyle = grad;
    fillPath(g, pts);
  }
  if (h >= 4 && light > 0) shadeHatch(g, pts, Math.min(7, 2 + h * 0.6));
  // trait d'encre un peu plus appuyé que demandé : les objets doivent se détacher du dallage
  if (line > 0) inkOutline(g, pts, r, { width: line * 1.3 * d.ink, wobble: 0.35, pressure: 0.35 });
}

/** Hachures à la plume sur le flanc d'un volume opposé à la lumière : la forme moins elle-même décalée vers le haut à gauche. */
function shadeHatch(g: CanvasRenderingContext2D, pts: Pt[], depth: number, gap = 3, color = "rgba(16,10,5,.5)", width = 0.75) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if ((x1 - x0) * (y1 - y0) < 260) return;
  const own = new Path2D();
  addPoly(own, pts);
  const cut = new Path2D();
  cut.rect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  addPoly(cut, pts.map(([x, y]) => [x - depth, y - depth] as Pt));
  const lines = new Path2D();
  for (let k = x0 + y0 - 4; k < x1 + y1 + 4; k += gap) {
    lines.moveTo(k - y0 + 2, y0 - 2);
    lines.lineTo(k - y1 - 2, y1 + 2);
  }
  g.save();
  g.clip(own);
  g.clip(cut, "evenodd");
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke(lines);
  g.restore();
}

/** Aire d'un polygone (valeur absolue, formule du lacet). */
function polyArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
}

function addPoly(p: Path2D, pts: Pt[]) {
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
}
function fillPath(g: CanvasRenderingContext2D, pts: Pt[]) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function fillPoly(g: CanvasRenderingContext2D, pts: Pt[], color: string) {
  g.fillStyle = color;
  fillPath(g, pts);
}
function strokePoly(g: CanvasRenderingContext2D, pts: Pt[]) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.stroke();
}
function dot(g: CanvasRenderingContext2D, x: number, y: number, rad: number) {
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
}
/** Trait fin d'encre en coordonnées locales. */
function ln(d: Dungeon, r: Rng, f: Frame, x0: number, y0: number, x1: number, y1: number, width = 0.8, color = INK) {
  const [a, b] = P(f, x0, y0);
  const [c, e] = P(f, x1, y1);
  inkLine(d.g, a, b, c, e, r, { width, color, wobble: 0.3, taper: 3, pressure: 0.3 });
}

/** Fissure : marche au hasard qui dévie peu à peu. */
function crackPoints(r: Rng, x: number, y: number, ang: number, len: number): Pt[] {
  const pts: Pt[] = [[x, y]];
  let a = ang;
  for (let s = 0; s < len; s += 7) {
    a += (r() - 0.5) * 0.9;
    x += Math.cos(a) * 7;
    y += Math.sin(a) * 7;
    pts.push([x, y]);
  }
  return pts;
}

/** Place libre contre un mur de la salle : `len` cases le long du mur, `depth` vers l'intérieur. */
function wallSlot(d: Dungeon, ri: number, side: number, len: number, depth: number, r: Rng, centred = false): Frame | null {
  const room = d.c.map.rooms[ri];
  const along = side % 2 === 0 ? room.w : room.h;
  if (len > along) return null;
  const offs = Array.from({ length: along - len + 1 }, (_, i) => i);
  if (centred) offs.sort((a, b) => Math.abs(a - (along - len) / 2) - Math.abs(b - (along - len) / 2));
  else for (let i = offs.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [offs[i], offs[j]] = [offs[j], offs[i]];
  }
  for (const off of offs) {
    const f = sideFrame(d, room, side, off);
    if (claim(d, ri, f, len, depth)) return f;
  }
  return null;
}

function sideFrame(d: Dungeon, room: Room, side: number, off: number): Frame {
  const S = d.S;
  if (side === 0) return { ox: (room.x + off) * S, oy: room.y * S, rot: 0 };
  if (side === 1) return { ox: (room.x + room.w) * S, oy: (room.y + off) * S, rot: Math.PI / 2 };
  if (side === 2) return { ox: (room.x + room.w - off) * S, oy: (room.y + room.h) * S, rot: Math.PI };
  return { ox: room.x * S, oy: (room.y + room.h - off) * S, rot: -Math.PI / 2 };
}

/** Réserve les cases couvertes par un objet de len × depth cases dans le repère f, si elles sont toutes libres. */
function claim(d: Dungeon, ri: number, f: Frame, len: number, depth: number, dry = false, awayFromWater = false): boolean {
  const { S, W } = d;
  const cells: number[] = [];
  for (let j = 0; j < depth; j++)
    for (let i = 0; i < len; i++) {
      const [x, y] = P(f, (i + 0.5) * S, (j + 0.5) * S);
      const cx = Math.floor(x / S);
      const cy = Math.floor(y / S);
      const k = cy * W + cx;
      if (d.roomAt[k] !== ri || d.busy[k] || d.at(cx, cy) !== T.sol) return false;
      if (awayFromWater && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => d.at(cx + dx, cy + dy) === T.eau)) return false;
      cells.push(k);
    }
  if (!dry) for (const k of cells) d.busy[k] = 1;
  return true;
}

/** Place libre au milieu de la salle : rectangle de w × h cases (repère sans rotation). */
function floorSlot(d: Dungeon, ri: number, w: number, h: number, r: Rng, margin = 1): Frame | null {
  const room = d.c.map.rooms[ri];
  const opts: [number, number][] = [];
  for (let y = room.y + margin; y + h <= room.y + room.h - margin; y++) for (let x = room.x + margin; x + w <= room.x + room.w - margin; x++) opts.push([x, y]);
  const cx = room.x + room.w / 2;
  const cy = room.y + room.h / 2;
  opts.sort((a, b) => Math.hypot(a[0] + w / 2 - cx, a[1] + h / 2 - cy) - Math.hypot(b[0] + w / 2 - cx, b[1] + h / 2 - cy) + (r() - 0.5) * 0.8);
  for (const [x, y] of opts) {
    const f = { ox: x * d.S, oy: y * d.S, rot: 0 };
    if (claim(d, ri, f, w, h, false, true)) return f;
  }
  return null;
}

/** Côtés de la salle, du plus dégagé (le moins de cases réservées devant les portes) au plus encombré. */
function sidesByCalm(d: Dungeon, room: Room, r: Rng): number[] {
  const score = (side: number) => {
    let n = 0;
    const along = side % 2 === 0 ? room.w : room.h;
    for (let i = 0; i < along; i++) {
      const [x, y] = P(sideFrame(d, room, side, i), d.S / 2, d.S / 2);
      if (d.busy[Math.floor(y / d.S) * d.W + Math.floor(x / d.S)]) n++;
    }
    return n - along * 0.05 + r() * 0.5;
  };
  return [0, 1, 2, 3].map((s) => [s, score(s)]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
}

function paintFurniture(d: Dungeon) {
  planSconces(d);
  d.c.map.rooms.forEach((room, ri) => {
    const r = rng(d.seed, 100, ri);
    const label = room.label ?? "";
    const recipe = RECIPES[label] ?? furnishStore;
    recipe(d, ri, room, r);
    // la scène de la salle : trait plus gras (2,5 px au lieu de 1,5) pour qu'elle passe devant le décor
    d.ink = 1.6;
    roomScene(d, ri, room, rng(d.seed, 120, ri));
    d.ink = 1;
    ambient(d, ri, room, r);
  });
}

type Recipe = (d: Dungeon, ri: number, room: Room, r: Rng) => void;

const RECIPES: Record<string, Recipe> = {
  Entrée: furnishEntrance,
  "Salle des gardes": furnishGuards,
  Crypte: furnishCrypt,
  Armurerie: furnishArmory,
  "Salle du trône": furnishThrone,
  Bibliothèque: furnishLibrary,
  Cellules: furnishCells,
  Autel: furnishAltar,
  Trésor: furnishTreasure,
  Cuisine: furnishKitchen,
};

/** Ce qui traîne partout : éboulis contre un mur, caisse éventrée, os rongés, restes de feu. */
function ambient(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  // un seul amas contre un mur, qui raconte quelque chose : os rongés et crâne, tessons, chiffon, éclats ;
  // chaque pièce fait au moins un tiers de case
  {
    const [x, y] = freeSpot(d, ri, r, true);
    const at = (): Pt => [x + (r() - 0.5) * 30, y + (r() - 0.5) * 30];
    const what = pick(r, ["os", "repas", "fuite"]);
    if (what === "os") {
      for (let j = 0; j < 3; j++) bone(d, r, ...at(), r() * Math.PI, between(r, 15, 20));
      skull(d, r, ...at(), 7.5, r() * Math.PI * 2);
      rubble(d, r, x, y, 4, 14);
    } else if (what === "repas") {
      shards(d, r, ...at());
      const [cx, cy] = at();
      const pts = smoothPoints(blobPoints(r, cx, cy, between(r, 9, 12), between(r, 6, 8), 8, 0.35, r() * 3), 2);
      solid(d, r, pts, mixColor(d.pal.cloth, "#6e6250", 0.55), { h: 1.5, line: 0.9, light: 0.5 });
      ln(d, r, WORLD, cx - 4, cy - 1, cx + 4, cy + 1, 0.6, "rgba(22,14,8,.5)");
      bone(d, r, ...at(), r() * Math.PI, between(r, 15, 18));
    } else {
      const f = { ox: x, oy: y, rot: r() * Math.PI };
      solid(d, r, L(f, [[-14, -2.6], [14, -3.2], [13, 2.8], [-14, 3]]), tint(d.pal.wood, -0.1), { h: 2, line: 1 });
      shards(d, r, ...at());
      rubble(d, r, x, y, 5, 16);
    }
  }
  if (r() < 0.55) {
    const [x, y] = freeSpot(d, ri, r, true);
    rubble(d, r, x, y, 8 + Math.floor(r() * 8), 15);
    if (r() < 0.5) {
      // bloc tombé de la voûte
      const pts = blobPoints(r, x + between(r, -8, 8), y + between(r, -8, 8), between(r, 7, 11), between(r, 5, 8), 6, 0.2, r() * 3);
      solid(d, r, pts, tint(d.pal.block, 0.06), { h: 5, line: 1.4 });
      inkPolyline(d.g, crackPoints(r, pts[0][0], pts[0][1], r() * 6, 8), r, { width: 0.6, taper: 3 });
    }
  }
  if (r() < 0.35) {
    const [x, y] = freeSpot(d, ri, r, true);
    brokenCrate(d, r, x, y);
  }
  if (r() < 0.25 && room.w * room.h >= 24) {
    // vieux feu de camp : cendres, pierres, bûches noircies
    const [x, y] = freeSpot(d, ri, r);
    const ash = smoothPoints(blobPoints(r, x, y, 13, 11, 9, 0.25), 2);
    washFill(d.g, shapeOf(ash), "#2a2622", r, { alpha: 0.55, edge: 2, variation: 0.6, blot: 8, granulation: 0.8 });
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      solid(d, r, blobPoints(r, x + Math.cos(a) * 14, y + Math.sin(a) * 12, 3.6, 3, 6, 0.25), tint(d.pal.stone, (r() - 0.5) * 0.1), { h: 2, line: 0.9 });
    }
    ln(d, r, WORLD, x - 7, y - 3, x + 6, y + 4, 2.6, "#1a120c");
    ln(d, r, WORLD, x - 5, y + 5, x + 7, y - 4, 2.6, "#1a120c");
    void S;
  }
}

/** Tessons d'une cruche cassée : arcs de terre cuite autour d'un fond resté entier. */
function shards(d: Dungeon, r: Rng, x: number, y: number) {
  const c = pick(r, ["#9a5a34", "#8a6a48", "#6e6450"]);
  solid(d, r, ellL(x, y, 5, 5, 12), tint(c, -0.08), { h: 2, line: 0.9 });
  for (let k = 0; k < 4 + Math.floor(r() * 3); k++) {
    const a = r() * Math.PI * 2;
    const dd = between(r, 8, 15);
    const f = { ox: x + Math.cos(a) * dd, oy: y + Math.sin(a) * dd, rot: r() * Math.PI * 2 };
    solid(d, r, L(f, [[-4, -1.5], [0, -3], [4, -1.5], [3, 1.5], [-3, 1.5]]), tint(c, (r() - 0.5) * 0.12), { h: 1.5, line: 0.7, light: 0.6 });
  }
}

function brokenCrate(d: Dungeon, r: Rng, x: number, y: number) {
  const c = mixColor(d.pal.wood, "#b89060", 0.25);
  for (let k = 0; k < 5; k++) {
    const f = { ox: x + (r() - 0.5) * 22, oy: y + (r() - 0.5) * 22, rot: r() * Math.PI };
    solid(d, r, L(f, [[-9, -2], [9, -2.4], [8, 2], [-9, 2.2]]), tint(c, (r() - 0.5) * 0.1), { h: 2, line: 0.9 });
  }
  d.g.fillStyle = "rgba(22,14,8,.8)";
  for (let k = 0; k < 4; k++) dot(d.g, x + (r() - 0.5) * 20, y + (r() - 0.5) * 20, 0.8);
}

// ——— Petites scènes : ce qui s'est passé ici ———

const BLOOD = "#5a120d";

/** Points d'entrée de la salle : centre de la case de salle collée à chaque ouverture. */
function roomExits(d: Dungeon, ri: number): Pt[] {
  const { S, W, at, roomAt } = d;
  const room = d.c.map.rooms[ri];
  const out: Pt[] = [];
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++) {
      if (roomAt[y * W + x] !== ri || !isOpen(at(x, y))) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        // le point est dans l'ouverture même : la traînée sort par la porte
        if (isOpen(at(nx, ny)) && roomAt[ny * W + nx] !== ri) out.push([(x + 0.5 + dx * 1.1) * S, (y + 0.5 + dy * 1.1) * S]);
      }
    }
  return out;
}

/** Vrai si un meuble occupe la case sous ce point (les traces passent dessous : on les interrompt). */
function underFurniture(d: Dungeon, x: number, y: number): boolean {
  const k = Math.floor(y / d.S) * d.W + Math.floor(x / d.S);
  return d.busy[k] === 1 && !d.doorway[k];
}

/** Chemin un peu sinueux de a vers b (on ne marche jamais droit en fuyant). */
function wanderPath(r: Rng, a: Pt, b: Pt, step: number): Pt[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / step));
  const nx = -(b[1] - a[1]) / (len || 1);
  const ny = (b[0] - a[0]) / (len || 1);
  const bend = (r() - 0.5) * len * 0.35;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = Math.sin(t * Math.PI) * bend + Math.sin(t * 9 + r()) * 2;
    pts.push([a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o]);
  }
  return pts;
}

/** Traînée de sang : un corps qu'on a tiré, des frottis qui pâlissent, deux sillons, quelques gouttes. */
function bloodTrail(d: Dungeon, r: Rng, a: Pt, b: Pt) {
  const { g } = d;
  const pts = wanderPath(r, a, b, 4);
  const flow = noise2(Math.floor(r() * 1e6));
  g.save();
  g.lineCap = "round";
  for (let i = 1; i < pts.length; i++) {
    const t = i / pts.length;
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (underFurniture(d, x1, y1)) continue;
    // le sang s'épuise : frottis qui s'amincissent et pâlissent, interrompus par endroits
    const ink = 0.5 + 0.5 * flow(i * 0.09, 0.5);
    if (ink < 0.2 + t * 0.35) continue;
    g.strokeStyle = tint(BLOOD, 0, (0.18 + 0.32 * ink) * (1 - t * 0.7));
    g.lineWidth = (5 + 7 * ink) * (1 - t * 0.55);
    g.beginPath();
    g.moveTo(x0 + (r() - 0.5) * 2, y0 + (r() - 0.5) * 2);
    g.lineTo(x1 + (r() - 0.5) * 2, y1 + (r() - 0.5) * 2);
    g.stroke();
    // sillons des doigts ou des talons
    g.strokeStyle = tint(BLOOD, -0.05, 0.5 * (1 - t * 0.7));
    g.lineWidth = 1.1;
    for (const s of [-2.6, 2.4]) {
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      const ox = (-(y1 - y0) / l) * s;
      const oy = ((x1 - x0) / l) * s;
      g.beginPath();
      g.moveTo(x0 + ox, y0 + oy);
      g.lineTo(x1 + ox, y1 + oy);
      g.stroke();
    }
    if (r() < 0.25) {
      g.fillStyle = tint(BLOOD, 0, 0.6);
      dot(g, x1 + (r() - 0.5) * 16, y1 + (r() - 0.5) * 16, between(r, 0.8, 1.8));
    }
  }
  g.restore();
}

/** Empreintes de pas sanglantes, de plus en plus pâles, de a vers b. */
function footprints(d: Dungeon, r: Rng, a: Pt, b: Pt) {
  const { g } = d;
  const pts = wanderPath(r, a, b, 13);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (underFurniture(d, x1, y1)) continue;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const side = i % 2 ? 1 : -1;
    const f: Frame = { ox: x1 - Math.sin(ang) * side * 4, oy: y1 + Math.cos(ang) * side * 4, rot: ang };
    const fade = 1 - i / pts.length;
    g.globalAlpha = 0.2 + 0.6 * fade;
    fillPoly(g, L(f, ellL(1.5, 0, 4.2, 2.6, 10)), BLOOD);
    fillPoly(g, L(f, ellL(-5, 0, 2.4, 2.2, 8)), BLOOD);
    g.globalAlpha = 1;
  }
}

/** Gisant : un aventurier tombé là, sur une flaque de sang ; son arme a glissé un peu plus loin. Repère : corps le long de x, tête en +x. */
function corpse(d: Dungeon, r: Rng, f: Frame, armed: boolean) {
  const { g, pal } = d;
  const cloth = pick(r, ["#4c5a3c", "#5c4632", "#3f4a5c", "#6a3828", "#55504a"]);
  const skin = pick(r, ["#c9a07a", "#a87c58", "#7a5638", "#d8b490"]);
  const hair = pick(r, ["#2a1c12", "#5a3a1c", "#8a6a3a", "#1a1614", "#9a958a"]);
  // flaque sous le corps
  const [bx, by] = P(f, 4 + r() * 8, (r() - 0.5) * 10);
  washFill(g, shapeOf(smoothPoints(blobPoints(r, bx, by, between(r, 32, 42), between(r, 20, 28), 11, 0.35, f.rot), 2)), BLOOD, r, { alpha: 0.85, edge: 3, variation: 0.7, blot: 12, granulation: 0.3 });
  // cape étalée
  solid(d, r, L(f, smoothPoints(blobPoints(r, 2, 0, 24, 16, 9, 0.22), 2)), tint(cloth, -0.12), { h: 1, line: 1.1, light: 0.3 });
  // jambes : hanche, genou, pied
  const legs: Pt[][] = [-1, 1].map((s) => [[-8, s * 5], [-22, s * between(r, 4, 11)], [-36, s * between(r, 3, 14)]] as Pt[]);
  for (const leg of legs) {
    const w = L(f, leg);
    inkPolyline(g, w.map(([x, y]) => [x + 2, y + 3] as Pt), r, { width: 8, color: "rgba(0,0,0,.35)", taper: 0, wobble: 0.2 });
    inkPolyline(g, w, r, { width: 8.5, color: INK, taper: 0, wobble: 0.2 });
    inkPolyline(g, w, r, { width: 5.6, color: mixColor(cloth, "#2a2420", 0.45), taper: 0, wobble: 0.2 });
    const [fx, fy] = leg[2];
    solid(d, r, L(f, ellL(fx - 2, fy, 5, 3.6, 10)), "#2e2218", { h: 2, line: 1 });
  }
  // torse et ceinture
  solid(d, r, L(f, smoothPoints(rectL(-11, -10, 27, 20), 1)), cloth, { h: 3, line: 1.5 });
  ln(d, r, f, -6, -9, -6, 9, 2.2, "#2a1a0e");
  fillPoly(g, L(f, rectL(-7.5, -2, 3, 4)), pal.gold);
  // bras : l'un tendu vers l'arme, l'autre replié
  const reach: Pt[] = [[13, -9], [20, -17], [28, -21]];
  const bent: Pt[] = [[13, 9], [5, 17], [12, 23]];
  for (const arm of [reach, bent]) {
    const w = L(f, arm);
    inkPolyline(g, w, r, { width: 6.5, color: INK, taper: 0, wobble: 0.2 });
    inkPolyline(g, w, r, { width: 4, color: tint(cloth, 0.04), taper: 0, wobble: 0.2 });
    solid(d, r, L(f, ellL(arm[2][0] + 1.5, arm[2][1], 2.8, 2.4, 8)), skin, { h: 1, line: 0.8, light: 0.3 });
  }
  // tête tournée sur le côté : cheveux, joue
  solid(d, r, L(f, ellL(23, 1, 7, 6.4, 14)), skin, { h: 3, line: 1.3 });
  fillPoly(g, L(f, [[17, -5], [26, -6.5], [30, -2], [29.5, 3], [24, 1], [18, 4]]), hair);
  inkOutline(g, L(f, ellL(23, 1, 7, 6.4, 14)), r, { width: 1.2, wobble: 0.2 });
  if (armed) {
    // épée tombée au bout des doigts
    const sw: Frame = { ...P2F(P(f, 8, -27)), rot: f.rot + between(r, -0.5, 0.3) };
    solid(d, r, L(sw, [[0, -1.8], [30, -1.6], [34, 0], [30, 1.6], [0, 1.8]]), pal.steel, { h: 2, line: 1 });
    ln(d, r, sw, 4, 0, 28, 0, 0.5, "rgba(40,40,40,.6)");
    solid(d, r, L(sw, rectL(-2.5, -6, 3, 12)), "#3a3028", { h: 2, line: 0.9 });
    solid(d, r, L(sw, rectL(-11, -1.6, 8.5, 3.2)), "#4a3420", { h: 1.5, line: 0.8 });
  }
}

/** Chaise renversée sur le flanc : assise, dossier par terre, deux pieds qui pointent. */
function fallenChair(d: Dungeon, r: Rng, x: number, y: number, a: number) {
  const { pal } = d;
  const f: Frame = { ox: x, oy: y, rot: a };
  // 0,6 case de large : on la voit de loin
  const k = 1.75;
  const R = (pts: Pt[]) => L(f, pts.map(([u, v]) => [u * k, v * k] as Pt));
  solid(d, r, R(rectL(-8, -2, 16, 4)), tint(pal.wood, 0.04), { h: 2, line: 1.1 });
  solid(d, r, R(rectL(-8, 2, 16, 14)), pal.wood, { h: 5, line: 1.3 });
  for (const y of [5, 9, 13]) ln(d, r, f, -7 * k, y * k, 7 * k, y * k, 0.6, "rgba(22,14,8,.5)");
  for (const s of [-1, 1]) solid(d, r, R(rectL(s * 6 - 1.6, -16, 3.2, 14)), pal.woodDark, { h: 4, line: 1 });
}

/** Chope renversée : la bière a fait une flaque brune. */
function spilledMug(d: Dungeon, r: Rng, x: number, y: number) {
  const a = r() * Math.PI * 2;
  washFill(d.g, shapeOf(smoothPoints(blobPoints(r, x + Math.cos(a) * 9, y + Math.sin(a) * 9, 12, 7, 9, 0.4, a), 2)), "#5a3e1c", r, { alpha: 0.45, edge: 2, variation: 0.6, blot: 6, granulation: 0.2 });
  const f: Frame = { ox: x, oy: y, rot: a };
  solid(d, r, L(f, rectL(-5, -3.6, 10, 7.2)), "#8d8a80", { h: 2, line: 1 });
  fillPoly(d.g, L(f, ellL(5, 0, 1.6, 3.2, 8)), "#2a1a0c");
}

/** Griffures profondes dans la dalle : quatre sillons parallèles, arête claire. */
function clawMarks(d: Dungeon, r: Rng, x: number, y: number, a: number) {
  const f: Frame = { ox: x, oy: y, rot: a };
  const len = between(r, 26, 38);
  const bow = between(r, -5, 5);
  for (let k = 0; k < 4; k++) {
    const o = (k - 1.5) * 5;
    const pts = L(f, [[-len / 2, o], [0, o + bow], [len / 2 - k * 2, o + bow * 0.4]]);
    inkPolyline(d.g, smoothPoints(pts, 2, false).map(([px, py]) => [px + 0.9, py + 0.9] as Pt), r, { width: 1.1, taper: 9, wobble: 0.2, color: "rgba(255,244,220,.3)" });
    inkPolyline(d.g, smoothPoints(pts, 2, false), r, { width: 2.2, taper: 9, wobble: 0.2, color: "rgba(12,8,4,.9)" });
  }
}

/** Lanterne tombée, verre étoilé, huile répandue qui brûle encore. */
function droppedLantern(d: Dungeon, r: Rng, x: number, y: number) {
  const { g, pal } = d;
  const a = r() * Math.PI * 2;
  const oil = smoothPoints(blobPoints(r, x + Math.cos(a) * 10, y + Math.sin(a) * 10, 13, 8, 9, 0.35, a), 2);
  washFill(g, shapeOf(oil), "#3a2a14", r, { alpha: 0.5, edge: 2, variation: 0.5, blot: 6, granulation: 0.2 });
  const f: Frame = { ox: x, oy: y, rot: a };
  solid(d, r, L(f, rectL(-7, -5, 14, 10)), pal.iron, { h: 3, line: 1.2 });
  fillPoly(g, L(f, rectL(-5, -3.4, 10, 6.8)), "#e8b04a");
  ln(d, r, f, -4, -3, 3, 2, 0.5, "rgba(40,20,0,.7)");
  ln(d, r, f, 2, -3, -1, 3, 0.5, "rgba(40,20,0,.7)");
  ln(d, r, f, -7, 0, -13, 0, 1.4, INK);
  for (let k = 0; k < 6; k++) {
    g.fillStyle = pick(r, ["#ff9a3a", "#ffcf5a", "#e0522a"]);
    dot(g, x + Math.cos(a) * 12 + (r() - 0.5) * 12, y + Math.sin(a) * 12 + (r() - 0.5) * 8, between(r, 0.8, 1.8));
  }
  d.lights.push({ x: x + Math.cos(a) * 8, y: y + Math.sin(a) * 8, rad: d.S * 1.5, k: 0.75 });
}

/**
 * Une scène par salle, choisie selon la salle : un corps et la traînée de sang qui mène à une sortie,
 * une chaise renversée et une chope répandue, des griffures, des pas sanglants qui s'enfuient,
 * une lanterne tombée qui brûle encore. Posée après le mobilier, sur les cases restées libres.
 */
function roomScene(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const label = room.label ?? "";
  const area = room.w * room.h;
  if (area < 9) return;
  const exits = roomExits(d, ri);
  const exit = (from: Pt): Pt | null => {
    if (!exits.length) return null;
    return exits.reduce((best, e) => (Math.hypot(e[0] - from[0], e[1] - from[1]) > Math.hypot(best[0] - from[0], best[1] - from[1]) ? e : best));
  };
  const options: Record<string, string[]> = {
    "Salle des gardes": ["bagarre", "corps", "bagarre"],
    Crypte: ["griffes", "pas", "corps"],
    Cellules: ["pas", "griffes", "corps"],
    Trésor: ["corps", "pas"],
    Autel: ["trainee", "corps"],
    Bibliothèque: ["bagarre", "lanterne", "corps"],
    Cuisine: ["bagarre", "trainee"],
    Armurerie: ["corps", "griffes"],
    Entrée: ["lanterne", "pas", "corps"],
    "Salle du trône": ["corps", "trainee"],
  };
  const kind = pick(r, options[label] ?? ["corps", "lanterne", "griffes", "bagarre", "trainee"]);
  // la scène se joue dans la flaque de lumière : cases rangées de la plus proche d'une flamme de la salle à la plus loin
  const lit = d.lights.filter((l) => d.roomAt[Math.floor(l.y / S) * d.W + Math.floor(l.x / S)] === ri && l.k >= 1);
  const near = (x: number, y: number) => (lit.length ? Math.min(...lit.map((l) => Math.hypot(l.x - x, l.y - y))) : 0) + r() * S * 1.5;
  const cells: [number, number, number][] = [];
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) for (let x = room.x + 1; x < room.x + room.w - 1; x++) cells.push([x, y, near((x + 0.5) * S, (y + 0.5) * S)]);
  cells.sort((a, b) => a[2] - b[2]);
  const spot = (): Pt | null => {
    for (const [x, y] of cells) if (claim(d, ri, { ox: x * S, oy: y * S, rot: 0 }, 1, 1, false, true)) return [(x + 0.5) * S, (y + 0.5) * S];
    return null;
  };
  if (kind === "corps") {
    const horiz = r() < 0.5;
    let slot: Frame | null = null;
    for (const [x, y] of cells) {
      const f = { ox: x * S, oy: y * S, rot: 0 };
      if (claim(d, ri, f, horiz ? 2 : 1, horiz ? 1 : 2, false, true)) {
        slot = f;
        break;
      }
    }
    if (!slot) slot = floorSlot(d, ri, horiz ? 2 : 1, horiz ? 1 : 2, r, 0);
    if (!slot) return;
    const c: Pt = [slot.ox + (horiz ? S : S / 2), slot.oy + (horiz ? S / 2 : S)];
    const e = exit(c);
    // le corps a été traîné depuis la sortie, ou il a rampé vers elle : la tête regarde vers la porte
    const rot = e ? Math.atan2(e[1] - c[1], e[0] - c[0]) + between(r, -0.5, 0.5) : r() * Math.PI * 2;
    if (e && r() < 0.75) bloodTrail(d, r, [c[0] - Math.cos(rot) * 12, c[1] - Math.sin(rot) * 12], e);
    corpse(d, r, { ox: c[0], oy: c[1], rot }, r() < 0.7);
  } else if (kind === "trainee") {
    const p = spot();
    if (!p) return;
    const e = exit(p);
    if (!e) return;
    bloodStain(d, r, p[0], p[1]);
    bloodTrail(d, r, p, e);
    clawMarks(d, r, p[0] + (r() - 0.5) * 16, p[1] + (r() - 0.5) * 16, r() * Math.PI);
  } else if (kind === "pas") {
    const p = spot();
    if (!p) return;
    const e = exit(p);
    if (!e) return;
    bloodStain(d, r, p[0], p[1]);
    bloodStain(d, r, p[0] + (r() - 0.5) * 20, p[1] + (r() - 0.5) * 20);
    footprints(d, r, p, e);
  } else if (kind === "griffes") {
    const p = spot();
    if (!p) return;
    const a = r() * Math.PI;
    clawMarks(d, r, p[0], p[1], a);
    if (r() < 0.6) clawMarks(d, r, p[0] + Math.cos(a + 1.2) * 20, p[1] + Math.sin(a + 1.2) * 20, a + between(r, -0.4, 0.4));
    const [sx, sy] = freeSpot(d, ri, r);
    shield(d, r, sx, sy, 10);
    ln(d, r, WORLD, sx - 8, sy - 6, sx + 6, sy + 7, 1.6, INK);
    bloodStain(d, r, p[0] + (r() - 0.5) * 30, p[1] + (r() - 0.5) * 30);
  } else if (kind === "bagarre") {
    const p = spot();
    if (!p) return;
    fallenChair(d, r, p[0] - 6, p[1] - 4, r() * Math.PI * 2);
    spilledMug(d, r, p[0] + 16, p[1] + 14);
    for (let k = 0; k < 3; k++) {
      const [x, y] = freeSpot(d, ri, r);
      if (k === 0) bloodStain(d, r, x, y);
      else if (k === 1) tableItem(d, r, pick(r, ["des", "cartes", "pain"]), x, y);
      else shards(d, r, x, y);
    }
  } else if (kind === "lanterne") {
    const p = spot();
    if (!p) return;
    droppedLantern(d, r, p[0], p[1]);
    const e = exit(p);
    if (e && r() < 0.6) footprints(d, r, p, e);
    for (let k = 0; k < 4; k++) {
      const x = p[0] + (r() - 0.5) * 60;
      const y = p[1] + (r() - 0.5) * 60;
      if (inRoom(d, ri, x, y) && !underFurniture(d, x, y)) loosePage(d, r, x, y);
    }
  }
}

// ——— Recettes de salles ———

function furnishEntrance(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  for (const side of sidesByCalm(d, room, r)) {
    const f = wallSlot(d, ri, side, 2, 2, r, true);
    if (!f) continue;
    stairs(d, r, f, 4, S * 2 - 8, S * 1.8);
    const b = P(f, S * 0.15, S * 2.3);
    if (takeSpot(d, ri, b)) brazier(d, r, b, 7);
    break;
  }
  storeCorner(d, ri, room, r, 2);
}

function furnishGuards(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  bigTable(d, ri, room, r, ["chope", "chope", "des", "cartes", "bougie", "pain", "assiette", "chope"]);
  const sides = sidesByCalm(d, room, r);
  const rack = wallSlot(d, ri, sides[0], 2, 1, r);
  if (rack) weaponRack(d, r, rack, S * 2);
  const beds = wallSlot(d, ri, sides[1], 2, 1, r) ?? wallSlot(d, ri, sides[2], 2, 1, r);
  if (beds) {
    bunk(d, r, beds, 4);
    bunk(d, r, beds, S + 4);
  }
  // braséro de veille et un tonnelet de bière en perce, quand la salle le permet
  const fire = floorSlot(d, ri, 1, 1, r, 1);
  if (fire) brazier(d, r, [fire.ox + S / 2, fire.oy + S / 2], 10);
  const keg = wallSlot(d, ri, sides[2] ?? sides[0], 1, 1, r);
  if (keg) {
    const [kx, ky] = P(keg, S / 2, S * 0.45);
    barrel(d, r, kx, ky, 13);
    const [cx, cy] = P(keg, S / 2 + 14, S * 0.85);
    tableItem(d, r, "chope", cx, cy);
  }
  if (rack && r() < 0.7) {
    const [sx, sy] = P(rack, S * 0.4, S * 0.75);
    shield(d, r, sx, sy, 10);
  }
  storeCorner(d, ri, room, r, 1);
}

/** Grande table au milieu de la salle, dans le sens de la longueur, avec bancs. */
function bigTable(d: Dungeon, ri: number, room: Room, r: Rng, items: string[], benches = true) {
  const S = d.S;
  const horiz = room.w >= room.h;
  const big = Math.min(room.w, room.h) >= 5 && Math.max(room.w, room.h) >= 6;
  const len = big ? 3 : 2;
  const wide = big ? 2 : 1;
  let f = floorSlot(d, ri, horiz ? len : wide, horiz ? wide : len, r);
  const fit = big && f !== null;
  // pas la place pour la grande : une table de 2 × 1
  if (!f && big) f = floorSlot(d, ri, horiz ? 2 : 1, horiz ? 1 : 2, r);
  if (!f) return;
  const l2 = fit ? len : 2;
  const w2 = fit ? wide : 1;
  const ff = horiz ? f : { ox: f.ox + w2 * S, oy: f.oy, rot: Math.PI / 2 };
  table(d, r, ff, 6, fit ? 20 : 13, l2 * S - 12, fit ? w2 * S - 40 : S - 26, benches, items);
}

function furnishCrypt(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  let n = 0;
  for (const side of sidesByCalm(d, room, r).slice(0, 2)) {
    const along = side % 2 === 0 ? room.w : room.h;
    for (let off = 0; off < along; off += 2) {
      const f = sideFrame(d, room, side, off);
      if (!claim(d, ri, f, 1, 2)) continue;
      sarcophagus(d, r, f, S / 2, S * 1.75, S * 0.41, r() < 0.3);
      // cierge au pied de la tombe
      if (r() < 0.6) candle(d, r, ...P(f, S * (r() < 0.5 ? 0.12 : 0.88), S * 1.9));
      n++;
    }
  }
  // au milieu : un sarcophage ouvert, couvercle glissé de côté (deux cases dans le sens de la salle)
  const horiz = room.w > room.h;
  const mid = floorSlot(d, ri, horiz ? 2 : 1, horiz ? 1 : 2, r, 1);
  if (mid) {
    const f: Frame = horiz ? { ox: mid.ox, oy: mid.oy + S, rot: -Math.PI / 2 } : { ox: mid.ox, oy: mid.oy, rot: 0 };
    sarcophagus(d, r, f, S / 2, S * 1.75, S * 0.4, true);
  }
  // ossements entassés contre un mur, os épars, urnes funéraires
  const pile = wallSlot(d, ri, sidesByCalm(d, room, r)[2] ?? 0, 1, 1, r);
  if (pile) boneHeap(d, r, ...P(pile, S / 2, S * 0.4));
  for (let k = 0; k < 4 + Math.floor(r() * 4); k++) {
    const [x, y] = freeSpot(d, ri, r);
    if (r() < 0.3) skull(d, r, x, y, 4.5, r() * 6);
    else bone(d, r, x, y, r() * Math.PI, between(r, 10, 18));
  }
  // urnes groupées contre un mur
  const shelf = wallSlot(d, ri, sidesByCalm(d, room, r)[1] ?? 1, 1, 1, r);
  if (shelf) {
    urn(d, r, ...P(shelf, S * 0.3, S * 0.3), between(r, 8, 10));
    urn(d, r, ...P(shelf, S * 0.72, S * 0.36), between(r, 7, 9));
    if (r() < 0.6) urn(d, r, ...P(shelf, S * 0.5, S * 0.74), between(r, 6, 8));
  }
  for (let k = 0; k < 3; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    candle(d, r, x, y);
  }
}

/** Tas d'ossements : os croisés, crânes posés dessus, poussière dessous. */
function boneHeap(d: Dungeon, r: Rng, x: number, y: number) {
  const { g } = d;
  g.fillStyle = "rgba(60,48,30,.25)";
  fillPath(g, smoothPoints(blobPoints(r, x + 2, y + 3, 20, 15, 9, 0.25), 2));
  for (let k = 0; k < 14; k++) bone(d, r, x + (r() - 0.5) * 30, y + (r() - 0.5) * 22, r() * Math.PI, between(r, 9, 16));
  for (let k = 0; k < 3; k++) skull(d, r, x + (r() - 0.5) * 20, y + (r() - 0.5) * 14, between(r, 4.2, 5.2), r() * 6);
}

function furnishArmory(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const sides = sidesByCalm(d, room, r);
  for (const side of sides.slice(0, 3)) {
    const len = Math.min(3, (side % 2 === 0 ? room.w : room.h) - 2);
    const f = wallSlot(d, ri, side, Math.max(1, len), 1, r);
    if (f) weaponRack(d, r, f, Math.max(1, len) * S);
  }
  bigTable(d, ri, room, r, ["epee", "casque", "epee", "bouclier"], false);
  for (let k = 0; k < 2; k++) {
    const f = floorSlot(d, ri, 1, 1, r);
    if (f) armorStand(d, r, f.ox + S / 2, f.oy + S / 2, r() * 0.6 - 0.3);
  }
  storeCorner(d, ri, room, r, 2);
}

function furnishThrone(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const sides = sidesByCalm(d, room, r);
  for (const side of sides) {
    const along = side % 2 === 0 ? room.w : room.h;
    const depthAll = side % 2 === 0 ? room.h : room.w;
    if (along < 5 || depthAll < 5) continue;
    const f = wallSlot(d, ri, side, 3, 2, r, true);
    if (!f) continue;
    const w = 3 * S;
    // tapis de l'estrade jusqu'au mur d'en face (posé à plat, il ne gêne rien)
    rug(d, r, f, w / 2 - S * 0.65, S * 1.9, S * 1.3, (depthAll - 1.9) * S - 3);
    dais(d, r, f, 2, w - 4, S * 1.9);
    throne(d, r, f, w / 2, S * 0.06, 1.45);
    for (const bx of [S * 0.42, w - S * 0.42]) brazier(d, r, P(f, bx, S * 1.35), 9);
    for (const bx of [-S * 0.5, w + S * 0.5]) {
      const cell: Frame = { ...P2F(P(f, bx - S / 2, 0)), rot: f.rot };
      if (claim(d, ri, cell, 1, 1)) statue(d, r, { ...P2F(P(f, bx, S * 0.5)), rot: f.rot });
      else if (solidBehind(d, f, bx) && takeSpot(d, ri, P(f, bx, S * 0.3))) banner(d, r, P(f, bx, 0), f.rot);
    }
    // bannières sur le mur du fond, de part et d'autre
    for (const bx of [-S * 1.5, w + S * 1.5]) if (solidBehind(d, f, bx) && takeSpot(d, ri, P(f, bx, S * 0.3))) banner(d, r, P(f, bx, 0), f.rot);
    storeCorner(d, ri, room, r, 1);
    return;
  }
  // salle trop petite pour une estrade : le trône seul, contre le mur le plus calme
  for (const side of sides) {
    const f = wallSlot(d, ri, side, 1, 1, r, true);
    if (!f) continue;
    const depthAll = side % 2 === 0 ? room.h : room.w;
    rug(d, r, f, S * 0.04, S * 0.9, S * 0.92, (depthAll - 1.6) * S);
    throne(d, r, f, S / 2, S * 0.04, 0.8);
    const b = P(f, -S * 0.3, S * 0.6);
    if (takeSpot(d, ri, b)) brazier(d, r, b, 7);
    return;
  }
}

function furnishLibrary(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  for (const side of [0, 1, 2, 3]) {
    const along = side % 2 === 0 ? room.w : room.h;
    let off = 0;
    while (off < along) {
      // le plus long rayonnage possible à partir d'ici
      let len = 0;
      while (off + len < along && claim(d, ri, sideFrame(d, room, side, off + len), 1, 1, true)) len++;
      if (len >= 1) {
        const f = sideFrame(d, room, side, off);
        claim(d, ri, f, len, 1);
        bookshelf(d, r, f, 2, len * S - 4);
        if (len >= 3 && r() < 0.5) book(d, r, ...P(f, between(r, 14, len * S - 14), 30), f.rot + r() - 0.5, false);
        off += len;
      } else off++;
    }
  }
  if (Math.min(room.w, room.h) >= 5) bigTable(d, ri, room, r, ["livre", "livre", "bougie", "parchemin", "encrier"], false);
  // piles de livres posées par terre, faute de place sur les rayonnages
  for (let k = 0; k < 2; k++) {
    const p = floorSlot(d, ri, 1, 1, r, 0);
    if (!p) break;
    const [x, y] = [p.ox + d.S / 2 + (r() - 0.5) * 10, p.oy + d.S / 2 + (r() - 0.5) * 10];
    const a0 = r() * Math.PI;
    for (let j = 0; j < 3 + Math.floor(r() * 3); j++) book(d, r, x + (r() - 0.5) * 3, y - j * 1.2, a0 + (r() - 0.5) * 0.5, false);
  }
  const f = floorSlot(d, ri, 1, 1, r);
  if (f) lectern(d, r, f.ox + S / 2, f.oy + S / 2, r() * 0.8 - 0.4);
  for (let k = 0; k < 5; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    if (r() < 0.6) loosePage(d, r, x, y);
    else book(d, r, x, y, r() * 6);
  }
}

function furnishCells(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const sides = sidesByCalm(d, room, r);
  let done = false;
  // la plus longue rangée de cellules possible, sur deux cases de profondeur, sinon sur une
  for (const depth of [2, 1]) {
    for (const side of sides) {
      const along = side % 2 === 0 ? room.w : room.h;
      const depthAll = side % 2 === 0 ? room.h : room.w;
      if (depthAll < depth + 2) continue;
      for (let len = along; len >= 2 && !done; len--) {
        const f = wallSlot(d, ri, side, len, depth, r);
        if (!f) continue;
        cellBlock(d, r, f, len * S, S * depth - 4);
        done = true;
      }
      if (done) break;
    }
    if (done) break;
  }
  // chaînes et fers scellés dans les autres murs
  for (const side of sides.slice(1, 3)) {
    const f = wallSlot(d, ri, side, 1, 1, r);
    if (f) {
      chain(d, r, f, S * 0.3, 0, S * 0.45);
      chain(d, r, f, S * 0.7, 0, S * 0.35);
      if (r() < 0.5) skull(d, r, ...P(f, S * 0.5, S * 0.7), 4, r() * 6);
    }
  }
  for (let k = 0; k < 2; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    straw(d, r, x, y, between(r, 10, 16));
  }
}

function furnishAltar(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const horiz = room.w >= room.h;
  // l'autel (2 × 1 cases) au milieu, le cercle gravé tout autour
  const mid = floorSlot(d, ri, horiz ? 2 : 1, horiz ? 1 : 2, r, 1);
  let cx = (room.x + room.w / 2) * S;
  let cy = (room.y + room.h / 2) * S;
  if (mid) {
    cx = mid.ox + (horiz ? S : S / 2);
    cy = mid.oy + (horiz ? S / 2 : S);
  }
  // le cercle tient dans la salle, sans toucher les murs
  const room0 = Math.min(cx - room.x * S, (room.x + room.w) * S - cx, cy - room.y * S, (room.y + room.h) * S - cy);
  const rad = Math.max(S * 1.15, Math.min(room0 - 8, Math.min(room.w, room.h) * S * 0.42));
  d.g.save();
  d.g.beginPath();
  d.g.rect(room.x * S, room.y * S, room.w * S, room.h * S);
  d.g.clip();
  carvedCircle(d, r, cx, cy, rad);
  d.g.restore();
  if (mid) {
    const f: Frame = horiz ? { ox: mid.ox, oy: mid.oy, rot: 0 } : { ox: mid.ox + S, oy: mid.oy, rot: Math.PI / 2 };
    altar(d, r, f, 2 * S);
  } else
    for (const side of sidesByCalm(d, room, r)) {
      const along = side % 2 === 0 ? room.w : room.h;
      const f = wallSlot(d, ri, side, Math.min(2, along - 2), 1, r, true);
      if (!f) continue;
      altar(d, r, f, Math.min(2, along - 2) * S);
      break;
    }
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (inRoom(d, ri, x, y) && !d.busy[Math.floor(y / S) * d.W + Math.floor(x / S)]) bigCandle(d, r, x, y);
  }
  for (let k = 0; k < 2; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    bloodStain(d, r, x, y);
  }
  for (let k = 0; k < 2; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    skull(d, r, x, y, 4.5, r() * 6);
  }
}

/** Gros cierge sur son pied de cire coulée, avec un halo propre. */
function bigCandle(d: Dungeon, r: Rng, x: number, y: number) {
  const { g } = d;
  g.fillStyle = "rgba(240,230,200,.6)";
  fillPath(g, smoothPoints(blobPoints(r, x + 1, y + 2, 7, 6, 8, 0.4), 1));
  inkOutline(g, smoothPoints(blobPoints(r, x + 1, y + 2, 7, 6, 8, 0.4), 1), r, { width: 0.6, wobble: 0.2, color: "rgba(60,40,20,.5)" });
  solid(d, r, ellL(x, y, 3.8, 3.8, 12), "#efe3c2", { h: 5, line: 1, light: 0.5 });
  g.fillStyle = "#ffcf6a";
  dot(g, x - 0.4, y - 0.6, 2);
  g.fillStyle = "#fff6d8";
  dot(g, x - 0.6, y - 0.8, 0.9);
  d.lights.push({ x, y, rad: 52, k: 0.75 });
}

function furnishTreasure(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  let n = 0;
  for (const side of sidesByCalm(d, room, r).slice(0, 3)) {
    for (let k = 0; k < 2 && n < 5; k++) {
      const f = wallSlot(d, ri, side, 1, 1, r);
      if (!f) break;
      chest(d, r, f, S / 2, S * 0.48, S * 0.84, S * 0.6, r() < 0.45);
      n++;
    }
  }
  // tas d'or au milieu de la salle
  const heap2 = Math.min(room.w, room.h) >= 5 ? floorSlot(d, ri, 2, 2, r) : null;
  const heap = heap2 ?? floorSlot(d, ri, 1, 1, r);
  if (heap) {
    const big = heap2 !== null;
    const cx = heap.ox + (big ? S : S / 2);
    const cy = heap.oy + (big ? S : S / 2);
    goldHeap(d, r, cx, cy, big ? S * 0.75 : S * 0.38);
  }
  for (let k = 0; k < 3; k++) {
    const f = floorSlot(d, ri, 1, 1, r, 0);
    if (f) urn(d, r, f.ox + S / 2 + (r() - 0.5) * 10, f.oy + S / 2 + (r() - 0.5) * 10, between(r, 8, 11));
  }
  for (let k = 0; k < 5; k++) {
    const [x, y] = freeSpot(d, ri, r, true);
    coins(d, r, x, y, 6 + Math.floor(r() * 14), between(r, 5, 10));
  }
  for (let k = 0; k < 6; k++) {
    const [x, y] = freeSpot(d, ri, r);
    gem(d, r, x, y);
  }
}

/** Monceau de pièces : butte dorée lavée, couverte de pièces dessinées, qui s'éparpillent au pied ; objets qui dépassent. */
function goldHeap(d: Dungeon, r: Rng, cx: number, cy: number, rad: number) {
  const { g, pal } = d;
  const pts = smoothPoints(blobPoints(r, cx, cy, rad, rad * 0.85, 11, 0.22, r() * 3), 2);
  fillPoly(g, pts.map(([x, y]) => [x + 5, y + 7] as Pt), SHADOW);
  washFill(g, shapeOf(pts), pal.gold, r, { alpha: 1, edge: 5, variation: 0.9, blot: rad * 0.5, granulation: 0.6 });
  // modelé du tas : plus clair vers le haut à gauche
  const grad = g.createRadialGradient(cx - rad * 0.3, cy - rad * 0.35, 0, cx, cy, rad);
  grad.addColorStop(0, "rgba(255,240,170,.5)");
  grad.addColorStop(0.6, "rgba(255,240,170,0)");
  grad.addColorStop(1, "rgba(60,30,5,.45)");
  g.fillStyle = grad;
  fillPath(g, pts);
  inkOutline(g, pts, r, { width: 1.8, wobble: 0.5 });
  // pièces sur la butte, de l'arrière vers l'avant
  const list: Pt[] = [];
  for (let k = 0; k < rad * 2.4; k++) {
    const a = r() * Math.PI * 2;
    const dd = Math.sqrt(r()) * rad * 0.88;
    list.push([cx + Math.cos(a) * dd, cy + Math.sin(a) * dd * 0.85]);
  }
  list.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of list) coin(g, x, y, between(r, 2.4, 3), tint(pal.gold, (r() - 0.5) * 0.16 + (cy - y) / rad * 0.06));
  // ce qui dépasse : une épée, une coupe
  const f = { ox: cx + rad * 0.2, oy: cy - rad * 0.1, rot: r() * 3 };
  solid(d, r, L(f, [[-rad * 0.6, -1.8], [rad * 0.3, -1.8], [rad * 0.42, 0], [rad * 0.3, 1.8], [-rad * 0.6, 1.8]]), pal.steel, { h: 2, line: 0.9 });
  ln(d, r, f, -rad * 0.6, -5, -rad * 0.6, 5, 2, pal.gold);
  solid(d, r, ellL(cx - rad * 0.35, cy + rad * 0.2, 5.5, 5.5, 12), tint(pal.gold, 0.08), { h: 2, line: 1 });
  fillPoly(g, ellL(cx - rad * 0.35, cy + rad * 0.2, 3, 3, 10), "#5a3a08");
  // l'éboulis au pied du tas
  coins(d, r, cx + rad * 0.95, cy + rad * 0.55, 10, rad * 0.32);
  coins(d, r, cx - rad * 0.85, cy + rad * 0.75, 7, rad * 0.28);
}

/** Urne funéraire vue de dessus : panse ombrée, col, couvercle à bouton, reflet sur le haut à gauche. */
function urn(d: Dungeon, r: Rng, x: number, y: number, rad: number) {
  const { g } = d;
  const c = pick(r, ["#8e5634", "#6f6a52", "#a07040", "#5e6a62"]);
  solid(d, r, ellL(x, y, rad, rad, 16), c, { h: 7, line: 1.4 });
  inkOutline(g, ellL(x, y, rad * 0.8, rad * 0.8, 16), r, { width: 0.6, wobble: 0.2, color: "rgba(25,15,8,.55)" });
  solid(d, r, ellL(x, y, rad * 0.56, rad * 0.56, 12), tint(c, -0.1), { h: 2, line: 1 });
  solid(d, r, ellL(x - 0.5, y - 0.5, rad * 0.2, rad * 0.2, 8), tint(c, 0.12), { h: 1.5, line: 0.8 });
  g.strokeStyle = "rgba(255,244,214,.55)";
  g.lineWidth = 1.2;
  g.lineCap = "round";
  g.beginPath();
  g.arc(x, y, rad * 0.86, Math.PI * 1.05, Math.PI * 1.45);
  g.stroke();
}

function furnishKitchen(d: Dungeon, ri: number, room: Room, r: Rng) {
  const S = d.S;
  const sides = sidesByCalm(d, room, r);
  // une citerne dans la salle : pas d'âtre, on cuisine ailleurs
  if (!roomHasWater(d, room)) for (const side of sides) {
    const f = wallSlot(d, ri, side, 2, 1, r, true);
    if (!f) continue;
    hearth(d, r, f, S * 2);
    break;
  }
  const t = floorSlot(d, ri, 2, 1, r);
  if (t) table(d, r, t, 6, 10, S * 2 - 12, S - 20, false, ["couteau", "legumes", "planche", "chope", "pain"]);
  storeCorner(d, ri, room, r, 3);
}

function roomHasWater(d: Dungeon, room: Room): boolean {
  for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) if (d.at(x, y) === T.eau) return true;
  return false;
}

/** Réserve : caisses, tonneaux, sacs dans un coin. */
function furnishStore(d: Dungeon, ri: number, room: Room, r: Rng) {
  storeCorner(d, ri, room, r, 3);
}

function storeCorner(d: Dungeon, ri: number, room: Room, r: Rng, n: number) {
  const S = d.S;
  const corners: [number, number][] = [
    [room.x, room.y],
    [room.x + room.w - 1, room.y],
    [room.x, room.y + room.h - 1],
    [room.x + room.w - 1, room.y + room.h - 1],
  ];
  let placed = 0;
  for (const [x, y] of corners.sort(() => r() - 0.5)) {
    if (placed >= n) break;
    const f = { ox: x * S, oy: y * S, rot: 0 };
    if (!claim(d, ri, f, 1, 1)) continue;
    placed++;
    const kind = r();
    const cx = (x + 0.5) * S + (x === room.x ? -3 : 3);
    const cy = (y + 0.5) * S + (y === room.y ? -3 : 3);
    if (kind < 0.4) {
      barrel(d, r, cx - 6, cy - 5, 11);
      barrel(d, r, cx + 9, cy + 8, 9.5);
    } else if (kind < 0.75) {
      crate(d, r, cx - 2, cy - 2, 26, (r() - 0.5) * 0.4);
      if (r() < 0.6) sack(d, r, cx + 12, cy + 12);
    } else {
      sack(d, r, cx - 6, cy - 4);
      sack(d, r, cx + 7, cy + 5);
      barrel(d, r, cx + 8, cy - 10, 8);
    }
  }
}

/** Réserve la case sous un point (pour un petit objet posé hors de sa place réservée) si elle est libre. */
function takeSpot(d: Dungeon, ri: number, [x, y]: Pt): boolean {
  const cx = Math.floor(x / d.S);
  const cy = Math.floor(y / d.S);
  const k = cy * d.W + cx;
  if (d.roomAt[k] !== ri || d.busy[k] || d.at(cx, cy) !== T.sol) return false;
  d.busy[k] = 1;
  return true;
}

/** Le mur derrière ce point (en repère local, le long du mur) est-il plein ? Pas de bannière sur une porte. */
function solidBehind(d: Dungeon, f: Frame, x: number): boolean {
  const [px, py] = P(f, x, -d.S * 0.5);
  return !isOpen(d.at(Math.floor(px / d.S), Math.floor(py / d.S)));
}

function inRoom(d: Dungeon, ri: number, x: number, y: number) {
  const cx = Math.floor(x / d.S);
  const cy = Math.floor(y / d.S);
  return d.roomAt[cy * d.W + cx] === ri && d.at(cx, cy) === T.sol;
}

/** Point au hasard dans la salle, sur une case libre ; `edge` le colle plutôt aux murs. */
function freeSpot(d: Dungeon, ri: number, r: Rng, edge = false): Pt {
  const room = d.c.map.rooms[ri];
  const S = d.S;
  for (let k = 0; k < 30; k++) {
    let x = room.x + r() * room.w;
    let y = room.y + r() * room.h;
    if (edge) {
      if (r() < 0.5) x = r() < 0.5 ? room.x + 0.25 + r() * 0.4 : room.x + room.w - 0.25 - r() * 0.4;
      else y = r() < 0.5 ? room.y + 0.25 + r() * 0.4 : room.y + room.h - 0.25 - r() * 0.4;
    }
    const cell = Math.floor(y) * d.W + Math.floor(x);
    if (d.roomAt[cell] === ri && !d.busy[cell] && d.at(Math.floor(x), Math.floor(y)) === T.sol) return [x * S, y * S];
  }
  return [(room.x + room.w / 2) * S, (room.y + room.h / 2) * S];
}

// ——— Objets ———

function table(d: Dungeon, r: Rng, f: Frame, x: number, y: number, w: number, h: number, benches: boolean, items: string[]) {
  const { pal } = d;
  if (benches) {
    solid(d, r, L(f, rectL(x + 4, y - 10, w - 8, 7)), pal.woodDark, { h: 3, line: 1.1 });
    solid(d, r, L(f, rectL(x + 4, y + h + 3, w - 8, 7)), pal.woodDark, { h: 3, line: 1.1 });
  }
  solid(d, r, L(f, rectL(x, y, w, h)), pal.wood, { h: 6, line: 1.7 });
  for (let k = 1; k < 3; k++) ln(d, r, f, x + 3, y + (h * k) / 3, x + w - 3, y + (h * k) / 3, 0.6, "rgba(22,14,8,.55)");
  for (let k = 0; k < 3; k++) {
    const kx = x + 6 + r() * (w - 12);
    ln(d, r, f, kx, y + 2 + r() * h * 0.3, kx + 6 + r() * 6, y + 2 + r() * h * 0.3, 0.4, "rgba(22,14,8,.35)");
  }
  const n = Math.max(2, Math.round(w / 26) + Math.floor(r() * 2));
  for (let k = 0; k < n; k++) {
    const [ix, iy] = P(f, x + 10 + ((k + 0.5) / n) * (w - 20) + (r() - 0.5) * 6, y + h * between(r, 0.3, 0.7));
    tableItem(d, r, pick(r, items), ix, iy);
  }
}

function tableItem(d: Dungeon, r: Rng, kind: string, x: number, y: number) {
  const { g, pal } = d;
  if (kind === "chope") {
    solid(d, r, ellL(x, y, 3.6, 3.6, 10), "#8d8a80", { h: 2, line: 0.9 });
    fillPoly(g, ellL(x, y, 2.2, 2.2, 8), "#3a2510");
  } else if (kind === "bougie") candle(d, r, x, y);
  else if (kind === "des") {
    for (let i = 0; i < 2; i++) solid(d, r, rotRect(x + i * 6, y + (r() - 0.5) * 4, 3.4, 3.4, r() * 2), "#eee5cf", { h: 1.5, line: 0.6 });
  } else if (kind === "cartes") {
    for (let i = 0; i < 3; i++) solid(d, r, rotRect(x + i * 3, y + (r() - 0.5) * 3, 5, 7.5, r() * 1.4), i % 2 ? "#d9cbb0" : "#e9dfc6", { h: 0.8, line: 0.5, light: 0 });
  } else if (kind === "pain") {
    solid(d, r, smoothPoints(blobPoints(r, x, y, 6, 4, 8, 0.15, r() * 3), 1), "#b07a3c", { h: 2, line: 0.8 });
  } else if (kind === "couteau") {
    const a = r() * Math.PI;
    inkLine(g, x - Math.cos(a) * 7, y - Math.sin(a) * 7, x + Math.cos(a) * 7, y + Math.sin(a) * 7, r, { width: 1.6, color: pal.steel, wobble: 0.1 });
    inkLine(g, x - Math.cos(a) * 7, y - Math.sin(a) * 7, x - Math.cos(a) * 2, y - Math.sin(a) * 2, r, { width: 2.2, color: pal.woodDark, wobble: 0.1 });
  } else if (kind === "legumes") {
    for (let i = 0; i < 4; i++) solid(d, r, ellL(x + (r() - 0.5) * 10, y + (r() - 0.5) * 6, 2.6, 2.6, 8), pick(r, ["#a8582a", "#7a8a3a", "#c49a3a", "#6d3a4a"]), { h: 1.2, line: 0.6 });
  } else if (kind === "assiette") {
    solid(d, r, ellL(x, y, 5.5, 5.5, 14), "#cfc4a8", { h: 1.2, line: 0.8, light: 0.5 });
    inkOutline(g, ellL(x, y, 3.4, 3.4, 12), r, { width: 0.4, wobble: 0.1, color: "rgba(30,20,10,.5)" });
  } else if (kind === "livre") book(d, r, x, y, r() * 1.2 - 0.6, r() < 0.5);
  else if (kind === "parchemin") loosePage(d, r, x, y);
  else if (kind === "encrier") {
    solid(d, r, ellL(x, y, 2.8, 2.8, 10), "#1c1a22", { h: 2, line: 0.8 });
    inkLine(g, x + 1, y - 1, x + 9, y - 8, r, { width: 0.9, color: "#e8e0cc", wobble: 0.1 });
  } else if (kind === "epee") {
    const f = { ox: x, oy: y, rot: r() * 0.6 - 0.3 };
    solid(d, r, L(f, [[-16, -1.6], [10, -1.6], [14, 0], [10, 1.6], [-16, 1.6]]), pal.steel, { h: 2, line: 0.8 });
    ln(d, r, f, -16, -5, -16, 5, 1.8, pal.iron);
    ln(d, r, f, -22, 0, -16, 0, 2.4, pal.woodDark);
  } else if (kind === "casque") {
    solid(d, r, ellL(x, y, 6, 6.5, 14), mixColor(pal.steel, "#555", 0.35), { h: 3, line: 1 });
    ln(d, r, WORLD, x - 4, y + 1, x + 4, y + 1, 1, INK);
  } else if (kind === "bouclier") shield(d, r, x, y, 8);
  else if (kind === "planche") {
    solid(d, r, rotRect(x, y, 14, 9, r() - 0.5), mixColor(pal.wood, "#d0b080", 0.3), { h: 1.5, line: 0.8 });
  }
}

function rotRect(cx: number, cy: number, w: number, h: number, a: number): Pt[] {
  return L({ ox: cx, oy: cy, rot: a }, rectL(-w / 2, -h / 2, w, h));
}

function bunk(d: Dungeon, r: Rng, f: Frame, x: number) {
  const S = d.S;
  const { pal } = d;
  solid(d, r, L(f, rectL(x, 3, S - 8, S * 0.8)), pal.woodDark, { h: 5, line: 1.4 });
  solid(d, r, L(f, rectL(x + 3, 5, S - 14, S * 0.8 - 5)), mixColor(pal.cloth, "#6e6250", 0.6), { h: 0, line: 0.9 });
  solid(d, r, L(f, rectL(x + 6, 7, S - 20, 9)), "#d8ccb0", { h: 1.5, line: 0.8 });
  ln(d, r, f, x + 4, S * 0.45, x + S - 12, S * 0.5, 0.6, "rgba(22,14,8,.6)");
}

/** Râtelier contre le mur : lances à pointe en feuille, épées à garde, haches ; l'arme se lit à sa silhouette. */
function weaponRack(d: Dungeon, r: Rng, f: Frame, len: number) {
  const { pal } = d;
  solid(d, r, L(f, rectL(4, 3, len - 8, 7)), pal.woodDark, { h: 4, line: 1.4 });
  for (let x = 13; x < len - 9; x += between(r, 11, 15)) {
    const kind = r();
    if (kind < 0.38) {
      // lance
      ln(d, r, f, x, 2, x + (r() - 0.5) * 3, 38, 2.2, pal.wood);
      solid(d, r, L(f, [[x - 3.4, 36], [x, 34], [x + 3.4, 36], [x, 47]]), pal.steel, { h: 2, line: 0.9 });
    } else if (kind < 0.78) {
      // épée : lame, garde, fusée, pommeau
      solid(d, r, L(f, [[x - 2.2, 9], [x + 2.2, 9], [x + 2, 36], [x, 41], [x - 2, 36]]), pal.steel, { h: 2, line: 0.9 });
      ln(d, r, f, x, 11, x, 34, 0.5, "rgba(22,14,8,.5)");
      ln(d, r, f, x - 6.5, 9, x + 6.5, 9, 2.4, pal.iron);
      ln(d, r, f, x, 2, x, 8, 2.6, pal.woodDark);
      d.g.fillStyle = pal.gold;
      dot(d.g, ...P(f, x, 1.5), 1.8);
    } else {
      // hache
      ln(d, r, f, x, 2, x, 36, 2.4, pal.wood);
      solid(d, r, L(f, [[x, 22], [x + 10, 18], [x + 12, 26], [x + 10, 33], [x, 30]]), pal.steel, { h: 2, line: 0.9 });
    }
  }
  solid(d, r, L(f, rectL(4, 17, len - 8, 4)), pal.woodDark, { h: 2, line: 1.1 });
}

function armorStand(d: Dungeon, r: Rng, cx: number, cy: number, a: number) {
  const { pal } = d;
  const f = { ox: cx, oy: cy, rot: a };
  solid(d, r, L(f, ellL(0, 0, 15, 15, 16)), pal.woodDark, { h: 3, line: 1.2 });
  ln(d, r, f, -17, -2, 17, -2, 3, pal.woodDark);
  solid(d, r, L(f, [[-13, -8], [13, -8], [15, 2], [8, 10], [-8, 10], [-15, 2]]), pal.steel, { h: 7, line: 1.5 });
  solid(d, r, L(f, ellL(-14, -5, 5, 4, 10)), mixColor(pal.steel, "#666", 0.3), { h: 3, line: 1.1 });
  solid(d, r, L(f, ellL(14, -5, 5, 4, 10)), mixColor(pal.steel, "#666", 0.3), { h: 3, line: 1.1 });
  ln(d, r, f, 0, -7, 0, 9, 0.8, "rgba(22,14,8,.6)");
  ln(d, r, f, -10, 2, 10, 2, 0.6, "rgba(22,14,8,.45)");
  solid(d, r, L(f, ellL(0, -12, 6.5, 6, 12)), mixColor(pal.steel, "#555", 0.3), { h: 5, line: 1.3 });
  ln(d, r, f, -4, -11, 4, -11, 1.2, INK);
}

function shield(d: Dungeon, r: Rng, cx: number, cy: number, rad: number) {
  const { pal, g } = d;
  solid(d, r, ellL(cx, cy, rad, rad, 16), pal.cloth, { h: 3, line: 1.3 });
  g.strokeStyle = pal.iron;
  g.lineWidth = 1.6;
  strokePoly(g, ellL(cx, cy, rad - 1.5, rad - 1.5, 16));
  solid(d, r, ellL(cx, cy, rad * 0.32, rad * 0.32, 10), pal.steel, { h: 1, line: 0.8 });
}

function barrel(d: Dungeon, r: Rng, cx: number, cy: number, rad: number) {
  const { pal, g } = d;
  solid(d, r, ellL(cx, cy, rad, rad, 20), pal.wood, { h: 7, line: 1.5 });
  g.save();
  g.beginPath();
  g.arc(cx, cy, rad * 0.78, 0, Math.PI * 2);
  g.clip();
  g.strokeStyle = "rgba(22,14,8,.45)";
  g.lineWidth = 0.7;
  for (let k = -2; k <= 2; k++) {
    g.beginPath();
    g.moveTo(cx - rad, cy + k * rad * 0.3);
    g.lineTo(cx + rad, cy + k * rad * 0.3);
    g.stroke();
  }
  g.restore();
  inkOutline(g, ellL(cx, cy, rad * 0.8, rad * 0.8, 16), r, { width: 1.5, color: pal.iron, wobble: 0.2 });
  g.fillStyle = "rgba(22,14,8,.8)";
  dot(g, cx + rad * 0.35, cy - rad * 0.1, 1.3);
}

function crate(d: Dungeon, r: Rng, cx: number, cy: number, s: number, a: number) {
  const { pal } = d;
  const f = { ox: cx, oy: cy, rot: a };
  const c = mixColor(pal.wood, "#b89060", 0.25);
  solid(d, r, L(f, rectL(-s / 2, -s / 2, s, s)), c, { h: 7, line: 1.5 });
  for (let k = 1; k < 3; k++) ln(d, r, f, -s / 2 + 2, -s / 2 + (s * k) / 3, s / 2 - 2, -s / 2 + (s * k) / 3, 0.6, "rgba(22,14,8,.5)");
  ln(d, r, f, -s / 2 + 2, -s / 2 + 2, s / 2 - 2, s / 2 - 2, 2.4, mixColor(c, "#000000", 0.3));
  ln(d, r, f, -s / 2 + 2, -s / 2 + 2, s / 2 - 2, s / 2 - 2, 0.6);
}

function sack(d: Dungeon, r: Rng, cx: number, cy: number) {
  const pts = smoothPoints(blobPoints(r, cx, cy, between(r, 7, 9), between(r, 6, 8), 8, 0.18, r() * 3), 2);
  solid(d, r, pts, "#ad9668", { h: 4, line: 1.1 });
  d.g.fillStyle = "rgba(22,14,8,.7)";
  dot(d.g, cx + 2, cy - 2, 1.6);
  ln(d, r, WORLD, cx - 3, cy + 2, cx + 1, cy + 4, 0.5, "rgba(22,14,8,.4)");
}

function sarcophagus(d: Dungeon, r: Rng, f: Frame, x: number, len: number, hw: number, broken: boolean) {
  const { pal } = d;
  const y0 = 5;
  const base = [[x - hw, y0], [x + hw, y0], [x + hw * 0.82, y0 + len], [x - hw * 0.82, y0 + len]] as Pt[];
  solid(d, r, L(f, base), mixColor(pal.stone, "#5f5a4c", 0.25), { h: 7, line: 1.7 });
  if (broken) {
    // couvercle glissé de travers : on voit le creux et les os
    fillPoly(d.g, L(f, [[x - hw + 4, y0 + 4], [x + hw - 4, y0 + 4], [x + hw * 0.82 - 4, y0 + len - 4], [x - hw * 0.82 + 4, y0 + len - 4]]), "#140d08");
    bone(d, r, ...P(f, x - 2, y0 + len * 0.5), Math.PI / 2 + f.rot + 0.2, 14);
    skull(d, r, ...P(f, x, y0 + 12), 4, f.rot);
    const lid: Frame = { ...P2F(P(f, x + hw * 0.6, y0 + len * 0.55)), rot: f.rot + 0.35 };
    lidWithEffigy(d, r, lid, len * 0.95, hw * 0.95);
  } else {
    lidWithEffigy(d, r, { ...P2F(P(f, x, y0 + len / 2)), rot: f.rot }, len - 6, hw - 3);
  }
}
const P2F = ([ox, oy]: Pt) => ({ ox, oy });

/** Couvercle de sarcophage centré sur l'origine du repère, gisant gravé dessus. */
function lidWithEffigy(d: Dungeon, r: Rng, f: Frame, len: number, hw: number) {
  const { pal } = d;
  const top = -len / 2;
  solid(d, r, L(f, [[-hw, top], [hw, top], [hw * 0.82, top + len], [-hw * 0.82, top + len]]), tint(pal.stone, 0.06), { h: 3, line: 1.3 });
  const ink = "rgba(22,14,8,.7)";
  // gisant : tête, épaules, mains jointes sur une épée
  const hy = top + hw * 0.75;
  inkOutline(d.g, L(f, ellL(0, hy, hw * 0.34, hw * 0.38, 12)), r, { width: 0.8, color: ink, wobble: 0.2 });
  const body: Pt[] = [[-hw * 0.6, hy + hw * 0.5], [hw * 0.6, hy + hw * 0.5], [hw * 0.42, top + len - 5], [-hw * 0.42, top + len - 5]];
  inkOutline(d.g, L(f, body), r, { width: 0.8, color: ink, wobble: 0.3 });
  ln(d, r, f, 0, hy + hw * 0.7, 0, top + len - 8, 1.1, ink);
  ln(d, r, f, -hw * 0.25, hy + hw * 1.0, hw * 0.25, hy + hw * 1.0, 1.1, ink);
}

function bone(d: Dungeon, r: Rng, x: number, y: number, a: number, len: number) {
  const { g, pal } = d;
  const dx = (Math.cos(a) * len) / 2;
  const dy = (Math.sin(a) * len) / 2;
  g.strokeStyle = SHADOW;
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x - dx + 1, y - dy + 1.5);
  g.lineTo(x + dx + 1, y + dy + 1.5);
  g.stroke();
  inkLine(g, x - dx, y - dy, x + dx, y + dy, r, { width: 4, color: INK, wobble: 0.2, taper: 0 });
  inkLine(g, x - dx, y - dy, x + dx, y + dy, r, { width: 2.2, color: pal.bone, wobble: 0.2, taper: 0 });
  for (const s of [-1, 1]) {
    const ex = x + s * dx;
    const ey = y + s * dy;
    for (const t of [-1, 1]) {
      const px = ex - Math.sin(a) * t * 1.6;
      const py = ey + Math.cos(a) * t * 1.6;
      g.fillStyle = INK;
      dot(g, px, py, 2.3);
      g.fillStyle = pal.bone;
      dot(g, px, py, 1.5);
    }
  }
}

function skull(d: Dungeon, r: Rng, x: number, y: number, rad: number, a: number) {
  const { g, pal } = d;
  const f = { ox: x, oy: y, rot: a };
  solid(d, r, L(f, rectL(-rad * 0.55, rad * 0.4, rad * 1.1, rad * 1.1)), d.pal.bone, { h: 2, line: 0.8, light: 0.6 });
  solid(d, r, L(f, ellL(0, 0, rad, rad * 1.05, 14)), pal.bone, { h: 2, line: 0.9, light: 0.6 });
  g.fillStyle = "#1a120b";
  for (const s of [-1, 1]) {
    const [ex, ey] = P(f, s * rad * 0.42, rad * 0.25);
    dot(g, ex, ey, rad * 0.26);
  }
}

function candle(d: Dungeon, r: Rng, x: number, y: number) {
  const { g } = d;
  g.fillStyle = "rgba(240,230,200,.5)";
  fillPath(g, smoothPoints(blobPoints(r, x + 1, y + 2, 4, 3, 6, 0.4), 1));
  solid(d, r, ellL(x, y, 2.6, 2.6, 10), "#efe3c2", { h: 3, line: 0.8, light: 0.4 });
  g.fillStyle = "#ffcf6a";
  dot(g, x - 0.4, y - 0.6, 1.4);
  d.lights.push({ x, y, rad: 34, k: 0.5 });
}

function brazier(d: Dungeon, r: Rng, [x, y]: Pt, rad: number) {
  const { g, pal } = d;
  solid(d, r, ellL(x, y, rad, rad, 14), pal.iron, { h: 6, line: 1.4 });
  fillPoly(g, ellL(x, y, rad * 0.72, rad * 0.72, 12), "#2a140a");
  for (let k = 0; k < 6; k++) {
    g.fillStyle = pick(r, ["#ff9a3a", "#ffcf5a", "#e0522a"]);
    dot(g, x + (r() - 0.5) * rad, y + (r() - 0.5) * rad, between(r, 1, 2.4));
  }
  d.lights.push({ x, y, rad: 92, k: 1 });
}

/** Escalier qui monte vers la surface, contre le mur : marches de plus en plus claires vers le jour. */
function stairs(d: Dungeon, r: Rng, f: Frame, x: number, w: number, depth: number) {
  const { pal, g } = d;
  const n = 8;
  const sd = depth / n;
  solid(d, r, L(f, rectL(x - 7, 0, w + 14, depth)), mixColor(pal.block, "#0b0704", 0.2), { h: 6, line: 0 });
  for (let k = 0; k < n; k++) {
    // k = 0 : marche du bas, côté salle ; elles se resserrent un peu en montant
    const y = depth - (k + 1) * sd;
    const inset = k * 0.9;
    const col = mixColor(mixColor(pal.floor, "#0b0704", 0.55), "#f4ead0", Math.pow(k / (n - 1), 1.4) * 0.75);
    const pts = L(f, rectL(x + inset, y, w - inset * 2, sd + 0.5));
    fillPoly(g, pts, col);
    // nez de marche : trait d'encre franc, ombre portée sur la marche d'en dessous
    ln(d, r, f, x + inset, y + sd, x + w - inset, y + sd, 1.8, "rgba(8,5,3,.9)");
    fillPoly(g, L(f, rectL(x + inset, y + sd, w - inset * 2, 2.6)), "rgba(10,6,3,.35)");
    if (k % 2 === 0) ln(d, r, f, x + inset + w * 0.3 * r(), y + sd * 0.3, x + inset + w * (0.4 + r() * 0.3), y + sd * 0.45, 0.5, "rgba(22,14,8,.4)");
  }
  // murets de chaque côté
  for (const sx of [x - 7, x + w]) solid(d, r, L(f, rectL(sx, 0, 7, depth)), tint(pal.block, 0.08), { h: 3, line: 1.4 });
  inkOutline(g, L(f, rectL(x - 7, 0, w + 14, depth)), r, { width: 2.2, wobble: 0.4 });
  // flèche de montée, peinte sur les marches
  const ax = x + w / 2;
  inkPolyline(g, L(f, [[ax, depth - 8], [ax, depth * 0.3]]), r, { width: 1.6, color: "rgba(40,22,10,.75)", wobble: 0.2, taper: 3 });
  inkPolyline(g, L(f, [[ax - 7, depth * 0.3 + 8], [ax, depth * 0.3], [ax + 7, depth * 0.3 + 8]]), r, { width: 1.6, color: "rgba(40,22,10,.75)", wobble: 0.2, taper: 2 });
  const [lx, ly] = P(f, x + w / 2, depth * 0.3);
  d.lights.push({ x: lx, y: ly, rad: depth * 1.3, k: 0.7 });
}

/** Estrade à deux marches : chaque contremarche est hachurée, la marche haute plus claire. */
function dais(d: Dungeon, r: Rng, f: Frame, x: number, w: number, depth: number) {
  const { pal, g } = d;
  const low = mixColor(pal.stone, "#b4a686", 0.25);
  const high = mixColor(pal.stone, "#d4c8a8", 0.3);
  solid(d, r, L(f, rectL(x, 0, w, depth)), low, { h: 5, line: 1.7 });
  const riser = (pts: Pt[]) => {
    fillPoly(g, pts, "rgba(30,20,10,.28)");
    hatch(g, shapeOf(pts), r, { angle: f.rot + Math.PI / 2 + 0.35, spacing: 2.8, width: 0.7, color: "rgba(26,16,8,.7)" });
  };
  riser(L(f, rectL(x + 1, depth - 9, w - 2, 8)));
  // joints des grandes dalles de l'estrade
  for (let k = 1; k < 3; k++) ln(d, r, f, x + (w * k) / 3, depth - 10, x + (w * k) / 3 + (r() - 0.5) * 2, depth - 2, 0.7, "rgba(48,32,18,.7)");
  solid(d, r, L(f, rectL(x + 10, 0, w - 20, depth - 20)), high, { h: 4, line: 1.6 });
  riser(L(f, rectL(x + 11, depth - 28, w - 22, 8)));
  inkOutline(g, L(f, rectL(x, 0, w, depth)), r, { width: 2.2, wobble: 0.4, pressure: 0.3 });
}

/** Trône à haut dossier vu de dessus : dossier à fronton contre le mur, accoudoirs, coussin, pommeaux dorés. */
function throne(d: Dungeon, r: Rng, f: Frame, cx: number, y: number, k = 1) {
  const { pal, g } = d;
  const s = (v: number) => v * k;
  // dossier haut : planche épaisse à fronton pointu, qui dépasse de chaque côté
  solid(d, r, L(f, [[cx - s(24), y], [cx + s(24), y], [cx + s(24), y + s(10)], [cx + s(6), y + s(13)], [cx, y + s(16)], [cx - s(6), y + s(13)], [cx - s(24), y + s(10)]]), pal.woodDark, { h: 8, line: 2 });
  ln(d, r, f, cx - s(20), y + s(5), cx + s(20), y + s(5), 1.4, pal.gold);
  // siège et accoudoirs
  solid(d, r, L(f, rectL(cx - s(19), y + s(10), s(38), s(30))), pal.wood, { h: 6, line: 1.8 });
  solid(d, r, L(f, rectL(cx - s(13), y + s(13), s(26), s(23))), pal.cloth, { h: 0, line: 1.1, light: 0.8 });
  // capitons du coussin
  g.fillStyle = "rgba(20,8,4,.55)";
  for (const [px, py] of [[-6, 20], [6, 20], [0, 27], [-6, 32], [6, 32]]) dot(g, ...P(f, cx + s(px), y + s(py)), 0.9);
  for (const sx of [-1, 1]) {
    solid(d, r, L(f, rectL(sx < 0 ? cx - s(23) : cx + s(16), y + s(10), s(7), s(30))), pal.woodDark, { h: 4, line: 1.4 });
    g.fillStyle = INK;
    dot(g, ...P(f, cx + sx * s(19.5), y + s(38)), s(3.4));
    g.fillStyle = pal.gold;
    dot(g, ...P(f, cx + sx * s(19.5), y + s(38)), s(2.4));
  }
  g.fillStyle = pal.gold;
  dot(g, ...P(f, cx, y + s(4)), s(2.4));
}

/** Statue de chevalier vue de dessus sur un socle octogonal : cape, épaulières, heaume à cimier, épée pointe en bas. */
function statue(d: Dungeon, r: Rng, f: Frame) {
  const { pal } = d;
  const stone = mixColor(pal.block, "#c4bcaa", 0.4);
  const oct = (rad: number): Pt[] => Array.from({ length: 8 }, (_, k) => [Math.cos((k + 0.5) * (Math.PI / 4)) * rad, Math.sin((k + 0.5) * (Math.PI / 4)) * rad] as Pt);
  solid(d, r, L(f, oct(23)), tint(stone, -0.18), { h: 7, line: 1.8 });
  // cape qui tombe dans le dos (vers le mur)
  solid(d, r, L(f, [[-17, -4], [17, -4], [15, -16], [0, -20], [-15, -16]]), tint(stone, -0.06), { h: 6, line: 1.4 });
  // épaules, bras, épaulières
  solid(d, r, L(f, [[-18, -6], [18, -6], [16, 6], [7, 10], [-7, 10], [-16, 6]]), stone, { h: 10, line: 1.6 });
  for (const sx of [-1, 1]) solid(d, r, L(f, ellL(sx * 14, -2, 6.5, 6, 12)), tint(stone, 0.08), { h: 3, line: 1.2 });
  // heaume et cimier
  solid(d, r, L(f, ellL(0, -1, 7.5, 8, 14)), tint(stone, 0.12), { h: 4, line: 1.4 });
  ln(d, r, f, 0, -8, 0, 6, 1.6, tint(stone, -0.3));
  ln(d, r, f, -4.5, 3, 4.5, 3, 1, INK);
  // épée : garde et lame pointe en bas, devant la statue
  solid(d, r, L(f, [[-2.2, 9], [2.2, 9], [2, 20], [0, 24], [-2, 20]]), tint(stone, 0.16), { h: 2, line: 1 });
  ln(d, r, f, -7, 10, 7, 10, 2.6, tint(stone, -0.25));
  d.g.fillStyle = "rgba(90,110,60,.5)";
  for (let k = 0; k < 6; k++) dot(d.g, ...P(f, between(r, -19, 19), between(r, 13, 20)), between(r, 0.8, 1.8));
}

function rug(d: Dungeon, r: Rng, f: Frame, x: number, y: number, w: number, len: number) {
  const { g, pal } = d;
  if (len < 20) return;
  const pts = L(f, rectL(x, y, w, len));
  fillPoly(g, pts, pal.cloth);
  washFill(g, shapeOf(pts), pal.cloth, r, { alpha: 0.5, edge: 3, variation: 0.8, blot: 14, granulation: 0.6 });
  inkOutline(g, L(f, rectL(x + 4, y + 4, w - 8, len - 8)), r, { width: 1.4, color: pal.gold, wobble: 0.3 });
  // losanges
  for (let k = y + 16; k < y + len - 12; k += 22) {
    const c = x + w / 2;
    inkOutline(g, L(f, [[c, k - 7], [c + 8, k], [c, k + 7], [c - 8, k]]), r, { width: 0.9, color: tint(pal.gold, -0.05, 0.85), wobble: 0.2 });
  }
  inkOutline(g, pts, r, { width: 1.2, wobble: 0.3 });
  // franges
  for (let k = x + 2; k < x + w - 1; k += 3) ln(d, r, f, k, y + len, k + (r() - 0.5), y + len + 4, 0.6, "rgba(220,200,150,.9)");
  // usure : le tapis est râpé au milieu
  g.fillStyle = "rgba(230,210,170,.12)";
  fillPath(g, L(f, rectL(x + w * 0.3, y + len * 0.4, w * 0.4, len * 0.3)));
}

function banner(d: Dungeon, r: Rng, [x, y]: Pt, rot: number) {
  const { pal } = d;
  const f = { ox: x, oy: y, rot };
  solid(d, r, L(f, [[-7, 0], [7, 0], [7, 16], [0, 12], [-7, 16]]), pal.cloth, { h: 3, line: 1.1 });
  ln(d, r, f, -9, 1, 9, 1, 1.8, pal.gold);
}

/** Rayonnage contre le mur (2/3 de case de profondeur) : montants, dos de livres serrés, quelques volumes couchés. */
function bookshelf(d: Dungeon, r: Rng, f: Frame, x: number, len: number) {
  const { pal, g } = d;
  const deep = 30;
  solid(d, r, L(f, rectL(x, 1, len, deep)), pal.woodDark, { h: 7, line: 1.8 });
  fillPoly(g, L(f, rectL(x + 3, 3, len - 6, deep - 6)), "#160e08");
  const colors = ["#7a2a1e", "#3f5240", "#8a6a2c", "#2f3c52", "#5a3a28", "#9a8a6a", "#4a2a3a", "#6a5a2a"];
  // deux rangs de livres : le rang du fond dépasse à peine
  for (const [y0, y1, dim] of [[3.5, 13, 0.12], [13, deep - 3, 0]] as const) {
    let bx = x + 4;
    while (bx < x + len - 6) {
      const bw = between(r, 2.6, 5.4);
      if (r() < 0.07) {
        // volume couché
        const lw = between(r, 9, 14);
        if (bx + lw < x + len - 6) fillPoly(g, L(f, rectL(bx, y0 + 1, lw, y1 - y0 - 2)), tint(pick(r, colors), -dim));
        bx += lw + 1;
        continue;
      }
      const bh = (y1 - y0) * between(r, 0.75, 1);
      const c = tint(pick(r, colors), (r() - 0.5) * 0.12 - dim);
      fillPoly(g, L(f, rectL(bx, y1 - bh, bw, bh)), c);
      g.fillStyle = "rgba(255,240,200,.2)";
      fillPath(g, L(f, rectL(bx, y1 - bh, bw * 0.35, bh)));
      if (r() < 0.3) ln(d, r, f, bx + 0.3, y1 - bh * 0.7, bx + bw - 0.3, y1 - bh * 0.7, 0.6, pal.gold);
      bx += bw + 0.35;
    }
  }
  inkOutline(g, L(f, rectL(x + 3, 3, len - 6, deep - 6)), r, { width: 0.9, wobble: 0.2 });
  for (let k = x + 44; k < x + len - 20; k += 46) ln(d, r, f, k, 2, k, deep, 2.6, pal.woodDark);
}

function lectern(d: Dungeon, r: Rng, cx: number, cy: number, a: number) {
  const { pal } = d;
  const f = { ox: cx, oy: cy, rot: a };
  // pupitre sur pied : plateau incliné, rebord, livre ouvert, bougie et encrier
  solid(d, r, L(f, ellL(0, 6, 9, 7, 12)), pal.woodDark, { h: 3, line: 1.2 });
  solid(d, r, L(f, rectL(-16, -12, 32, 24)), pal.wood, { h: 9, line: 1.8 });
  ln(d, r, f, -16, 10, 16, 10, 2.4, pal.woodDark);
  book(d, r, cx, cy - 1, a, true);
  candle(d, r, ...P(f, 20, -12));
  solid(d, r, L(f, ellL(-20, -9, 2.8, 2.8, 10)), "#1c1a22", { h: 2, line: 0.8 });
  ln(d, r, f, -19, -10, -12, -17, 0.9, "#e8e0cc");
}

function book(d: Dungeon, r: Rng, cx: number, cy: number, a: number, open = r() < 0.5) {
  const f = { ox: cx, oy: cy, rot: a };
  if (open) {
    solid(d, r, L(f, rectL(-10, -7, 10, 14)), d.pal.paper, { h: 1.5, line: 0.8, light: 0.4 });
    solid(d, r, L(f, rectL(0, -7, 10, 14)), d.pal.paper, { h: 1.5, line: 0.8, light: 0.4 });
    for (let k = -4; k <= 4; k += 2) {
      ln(d, r, f, -8, k, -2, k, 0.4, "rgba(30,20,10,.55)");
      ln(d, r, f, 2, k, 8, k, 0.4, "rgba(30,20,10,.55)");
    }
  } else solid(d, r, L(f, rectL(-6, -8, 12, 16)), pick(r, ["#6a2a1e", "#344a3a", "#4a3a2a"]), { h: 2, line: 0.9 });
}

function loosePage(d: Dungeon, r: Rng, x: number, y: number) {
  const f = { ox: x, oy: y, rot: r() * Math.PI };
  solid(d, r, L(f, rectL(-5, -7, 10, 14)), d.pal.paper, { h: 0.8, line: 0.6, light: 0.3 });
  for (let k = -4; k <= 4; k += 2.5) ln(d, r, f, -3.5, k, 3.5, k, 0.35, "rgba(30,20,10,.5)");
}

function cellBlock(d: Dungeon, r: Rng, f: Frame, len: number, depth: number) {
  const { pal, g, S } = d;
  const bays = Math.max(1, Math.floor(len / (S * 2)));
  const bw = len / bays;
  fillPoly(g, L(f, rectL(0, 0, len, depth)), "rgba(20,12,6,.22)");
  for (let b = 0; b < bays; b++) {
    const x0 = b * bw;
    // paille, chaîne et seau au fond de la cellule
    straw(d, r, ...P(f, x0 + bw * between(r, 0.35, 0.65), depth * 0.38), between(r, 13, 18));
    chain(d, r, f, x0 + bw * 0.18, 0, depth * 0.5);
    if (r() < 0.6) {
      const [sx, sy] = P(f, x0 + bw * 0.82, depth * 0.3);
      solid(d, r, ellL(sx, sy, 6, 6, 12), mixColor(pal.wood, "#555", 0.3), { h: 3, line: 1.1 });
      fillPoly(g, ellL(sx, sy, 4, 4, 10), "#2a2014");
    }
    if (r() < 0.35) skull(d, r, ...P(f, x0 + bw * 0.6, depth * 0.65), 4.5, r() * 6);
    if (b > 0) bars(d, r, f, x0, 0, x0, depth);
    // grille de façade sur toute la largeur, avec une porte grillagée entrouverte
    const gap0 = x0 + bw * 0.5;
    const gap1 = gap0 + S * 0.62;
    bars(d, r, f, x0, depth, gap0, depth);
    bars(d, r, f, gap1, depth, x0 + bw, depth);
    const [hx, hy] = P(f, gap1, depth);
    const door: Frame = { ox: hx, oy: hy, rot: f.rot + Math.PI * 0.8 };
    bars(d, r, door, 0, 0, S * 0.62, 0);
    // traverse de la porte et serrure
    ln(d, r, door, S * 0.1, 0, S * 0.55, 0, 1.2, "#8a857c");
    solid(d, r, L(door, rectL(S * 0.5, -3, 6, 6)), pal.iron, { h: 1, line: 0.9 });
  }
}

/** Rangée de barreaux en fer vus de dessus : traverse épaisse (4 px) avec reflet, barreaux en têtes rondes. */
function bars(d: Dungeon, r: Rng, f: Frame, x0: number, y0: number, x1: number, y1: number) {
  const { g } = d;
  const [ax, ay] = P(f, x0, y0);
  const [bx, by] = P(f, x1, y1);
  g.lineCap = "round";
  g.strokeStyle = SHADOW;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(ax + 2, ay + 3);
  g.lineTo(bx + 2, by + 3);
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.stroke();
  g.strokeStyle = "rgba(170,166,156,.75)";
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(ax - 0.7, ay - 0.7);
  g.lineTo(bx - 0.7, by - 0.7);
  g.stroke();
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.round(len / 6));
  for (let k = 0; k <= n; k++) {
    const [x, y] = P(f, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
    g.fillStyle = "rgba(0,0,0,.4)";
    dot(g, x + 2.5, y + 3, 2.2);
    g.fillStyle = INK;
    dot(g, x, y, 2.4);
    g.fillStyle = "#86827a";
    dot(g, x - 0.7, y - 0.7, 0.9);
  }
  void r;
}

function chain(d: Dungeon, r: Rng, f: Frame, x: number, y0: number, len: number) {
  const { g, pal } = d;
  for (let y = y0 + 2; y < y0 + len; y += 4.5) {
    const [cx, cy] = P(f, x + Math.sin(y * 0.15) * 1.5, y);
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.beginPath();
    g.ellipse(cx, cy, Math.round(y) % 9 < 4.5 ? 1.6 : 2.6, Math.round(y) % 9 < 4.5 ? 2.8 : 1.6, f.rot, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#76716a";
    g.lineWidth = 0.8;
    g.stroke();
  }
  const [mx, my] = P(f, x, y0 + len + 3);
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(mx, my, 4, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = pal.steel;
  g.lineWidth = 0.9;
  g.stroke();
}

/** Botte de paille étalée : brins jaunes croisés un à un, plus sombres dessous, quelques brins échappés. */
function straw(d: Dungeon, r: Rng, x: number, y: number, rad: number) {
  const { g, pal } = d;
  const pts = smoothPoints(blobPoints(r, x, y, rad * 1.3, rad, 9, 0.3, r() * 3), 2);
  washFill(g, shapeOf(pts), mixColor(pal.straw, "#6a5020", 0.35), r, { alpha: 0.55, edge: 1.5, variation: 0.6, blot: 8, granulation: 0.4 });
  g.lineCap = "round";
  const tones = ["rgba(96,66,20,.85)", "rgba(196,160,74,.95)", "rgba(232,206,120,.95)", "rgba(150,112,40,.9)"];
  const paths = tones.map(() => new Path2D());
  const n = Math.round(rad * 7);
  for (let k = 0; k < n; k++) {
    const a = (k % 2 ? 0.5 : -0.5) + (r() - 0.5) * 1.4;
    const t = Math.sqrt(r());
    const b = r() * Math.PI * 2;
    const px = x + Math.cos(b) * t * rad * 1.2;
    const py = y + Math.sin(b) * t * rad * 0.9;
    const l = between(r, 4, 9) * (t > 0.85 && r() < 0.3 ? 1.6 : 1);
    const p = paths[k < n * 0.3 ? 0 : 1 + Math.floor(r() * 3)];
    p.moveTo(px - Math.cos(a) * l, py - Math.sin(a) * l);
    p.quadraticCurveTo(px + (r() - 0.5) * 2, py + (r() - 0.5) * 2, px + Math.cos(a) * l, py + Math.sin(a) * l);
  }
  paths.forEach((p, k) => {
    g.strokeStyle = tones[k];
    g.lineWidth = k === 0 ? 1 : 0.85;
    g.stroke(p);
  });
}

function altar(d: Dungeon, r: Rng, f: Frame, len: number) {
  const { pal } = d;
  solid(d, r, L(f, rectL(8, 4, len - 16, d.S * 0.62)), tint(pal.stone, -0.02), { h: 7, line: 1.8 });
  solid(d, r, L(f, rectL(len / 2 - 9, 3, 18, d.S * 0.62 + 6)), pal.cloth, { h: 1, line: 1, light: 0.6 });
  ln(d, r, f, len / 2 - 5, d.S * 0.62 + 6, len / 2 - 5, d.S * 0.62 + 9, 1, pal.gold);
  solid(d, r, L(f, ellL(len / 2, d.S * 0.32, 5, 4, 10)), pal.gold, { h: 2, line: 0.9 });
  for (const x of [14, len - 14]) {
    candle(d, r, ...P(f, x, 12));
    candle(d, r, ...P(f, x + (x < len / 2 ? 6 : -6), 22));
  }
}

function carvedCircle(d: Dungeon, r: Rng, cx: number, cy: number, rad: number) {
  const { g } = d;
  const red = "rgba(98,22,16,.85)";
  // sillon gravé : ombre claire décalée puis trait rouge sombre (pigment séché dans la rainure)
  for (const rr of [rad, rad - 13]) {
    inkOutline(g, ellL(cx + 1, cy + 1, rr, rr, 64), r, { width: 1.4, color: "rgba(255,240,215,.25)", wobble: 0.3 });
    inkOutline(g, ellL(cx, cy, rr, rr, 64), r, { width: 2, color: red, wobble: 0.4, pressure: 0.3 });
  }
  // runes entre les deux cercles
  const n = Math.round((rad * Math.PI * 2) / 15);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const f = { ox: cx + Math.cos(a) * (rad - 6.5), oy: cy + Math.sin(a) * (rad - 6.5), rot: a + Math.PI / 2 };
    const t = Math.floor(r() * 6);
    const w = 1.1;
    if (t === 0) ln(d, r, f, -2.5, -3, 2.5, 3, w, red), ln(d, r, f, 0, -3, 0, 3, w, red);
    if (t === 1) ln(d, r, f, 0, -3.5, 0, 3.5, w, red), ln(d, r, f, 0, -1, 3, -3, w, red);
    if (t === 2) ln(d, r, f, -2.5, -2.5, 2.5, 0, w, red), ln(d, r, f, 2.5, 0, -2.5, 2.5, w, red);
    if (t === 3) ln(d, r, f, -3, 3, 0, -3, w, red), ln(d, r, f, 0, -3, 3, 3, w, red);
    if (t === 4) ln(d, r, f, -3, -3, 3, -3, w, red), ln(d, r, f, 0, -3, 0, 3, w, red);
    if (t === 5) ln(d, r, f, -2.5, 0, 2.5, 0, w, red), ln(d, r, f, 0, -3, -2, 3, w, red);
  }
  // pentagramme
  const pts: Pt[] = [];
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + ((k * 2) / 5) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * (rad - 14), cy + Math.sin(a) * (rad - 14)]);
  }
  inkOutline(g, pts, r, { width: 1.3, color: "rgba(98,22,16,.6)", wobble: 0.5 });
  bloodStain(d, r, cx + (r() - 0.5) * rad * 0.6, cy + rad * 0.35);
}

function bloodStain(d: Dungeon, r: Rng, x: number, y: number) {
  const pts = smoothPoints(blobPoints(r, x, y, between(r, 6, 13), between(r, 5, 10), 9, 0.45), 2);
  washFill(d.g, shapeOf(pts), "#5a1410", r, { alpha: 0.5, edge: 2.5, variation: 0.7, blot: 6, granulation: 0.3 });
  for (let k = 0; k < 4; k++) {
    d.g.fillStyle = "rgba(80,16,12,.55)";
    dot(d.g, x + (r() - 0.5) * 34, y + (r() - 0.5) * 34, between(r, 0.8, 2));
  }
}

/** Coffre cerclé de fer : couvercle en planches, deux bandes de fer rivetées, coins ferrés, serrure ; ouvert, plein d'or. */
function chest(d: Dungeon, r: Rng, f: Frame, cx: number, cy: number, w: number, h: number, open: boolean) {
  const { pal, g } = d;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const iron = "#1f1d1b";
  const bandsAt = [x + w * 0.22, x + w * 0.78];
  if (open) {
    // couvercle rabattu contre le mur, vu par-dessous
    solid(d, r, L(f, rectL(x - 1, y - 11, w + 2, 11)), pal.woodDark, { h: 2, line: 1.4 });
    for (const bx of bandsAt) fillPoly(g, L(f, rectL(bx - 2, y - 11, 4, 11)), iron);
  }
  solid(d, r, L(f, rectL(x, y, w, h)), pal.wood, { h: 6, line: 1.7 });
  if (open) {
    fillPoly(g, L(f, rectL(x + 3, y + 3, w - 6, h - 6)), "#1c120a");
    // tas de pièces qui déborde
    const [mx, my] = P(f, cx, cy);
    coins(d, r, mx, my, 18, Math.min(w, h) * 0.34);
  } else {
    for (const k of [1 / 3, 2 / 3]) ln(d, r, f, x + 2, y + h * k, x + w - 2, y + h * k, 0.7, "rgba(30,18,8,.7)");
    const grad = g.createLinearGradient(...P(f, cx, y), ...P(f, cx, y + h));
    grad.addColorStop(0, "rgba(255,240,210,.18)");
    grad.addColorStop(1, "rgba(12,7,3,.2)");
    g.fillStyle = grad;
    fillPath(g, L(f, rectL(x, y, w, h)));
  }
  // bandes de fer et rivets, coins ferrés
  for (const bx of bandsAt) {
    fillPoly(g, L(f, rectL(bx - 2.2, y - 0.5, 4.4, h + 1)), iron);
    g.fillStyle = "#9a948a";
    for (const k of [0.2, 0.5, 0.8]) if (!open || k !== 0.5) dot(g, ...P(f, bx, y + h * k), 0.75);
  }
  for (const [px, py] of [[x, y], [x + w - 5, y], [x, y + h - 5], [x + w - 5, y + h - 5]]) fillPoly(g, L(f, rectL(px, py, 5, 5)), iron);
  // serrure côté salle
  solid(d, r, L(f, rectL(cx - 4, y + h - 3, 8, 7)), pal.gold, { h: 1.5, line: 1, light: 0.8 });
  g.fillStyle = INK;
  dot(g, ...P(f, cx, y + h + 0.5), 1.1);
  inkOutline(g, L(f, rectL(x, y, w, h)), r, { width: 2, wobble: 0.3, pressure: 0.3 });
}

/** Une pièce : disque doré cerné d'encre, liseré intérieur, reflet. */
function coin(g: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string) {
  g.fillStyle = INK;
  dot(g, x, y, rad + 0.75);
  g.fillStyle = color;
  dot(g, x, y, rad);
  g.strokeStyle = "rgba(110,70,10,.7)";
  g.lineWidth = 0.6;
  g.beginPath();
  g.arc(x, y, rad * 0.62, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,250,215,.85)";
  dot(g, x - rad * 0.35, y - rad * 0.38, rad * 0.32);
}

/** Pièces en tas : le cœur empilé (piles de deux ou trois), le bord qui éclate en pièces isolées. */
function coins(d: Dungeon, r: Rng, x: number, y: number, n: number, spread: number) {
  const { g, pal } = d;
  g.fillStyle = SHADOW;
  fillPath(g, smoothPoints(blobPoints(r, x + 2, y + 3, spread * 0.75, spread * 0.6, 8, 0.2), 1));
  const list: [number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2;
    let dd = Math.sqrt(r()) * spread;
    // un quart des pièces a roulé plus loin
    if (r() < 0.25) dd = spread * between(r, 1.05, 1.7);
    const px = x + Math.cos(a) * dd;
    const py = y + Math.sin(a) * dd * 0.8;
    const stack = dd < spread * 0.6 && r() < 0.45 ? 2 + Math.floor(r() * 2) : 1;
    list.push([px, py, stack]);
  }
  list.sort((a, b) => a[1] - b[1]);
  for (const [px, py, stack] of list)
    for (let k = 0; k < stack; k++) coin(g, px + k * 0.4, py - k * 1.5, between(r, 2.5, 3.1), tint(pal.gold, (r() - 0.5) * 0.14 + k * 0.03));
}

function gem(d: Dungeon, r: Rng, x: number, y: number) {
  const c = pick(r, ["#2a7a6a", "#8a1e2a", "#3a4aa0", "#7a3a8a"]);
  solid(d, r, rotRect(x, y, 4, 4, Math.PI / 4 + (r() - 0.5) * 0.4), c, { h: 1.5, line: 0.7, light: 1.4 });
}

function hearth(d: Dungeon, r: Rng, f: Frame, len: number) {
  const { pal, g, S } = d;
  solid(d, r, L(f, [[0, 0], [len, 0], [len, S * 0.7], [len - 12, S * 0.84], [12, S * 0.84], [0, S * 0.7]]), mixColor(pal.stone, "#4a4034", 0.25), { h: 7, line: 2 });
  for (let k = 1; k < 5; k++) ln(d, r, f, (len * k) / 5, S * 0.55, (len * k) / 5 + (r() - 0.5) * 3, S * 0.8, 0.8, "rgba(22,14,8,.6)");
  fillPoly(g, L(f, [[10, 0], [len - 10, 0], [len - 15, S * 0.56], [15, S * 0.56]]), "#130b06");
  for (let k = 0; k < 3; k++) ln(d, r, f, 18 + k * 8, 6 + r() * 4, len - 22 - k * 6, 14 + r() * 8, 3.2, pal.woodDark);
  for (let k = 0; k < 14; k++) {
    g.fillStyle = pick(r, ["#ff8a2a", "#ffcf5a", "#d8401e", "#ffb040"]);
    dot(g, ...P(f, between(r, 20, len - 20), between(r, 4, S * 0.45)), between(r, 0.8, 2.4));
  }
  const [lx, ly] = P(f, len / 2, S * 0.3);
  d.lights.push({ x: lx, y: ly, rad: 130, k: 1.1 });
  // chaudron devant le feu
  const [cx, cy] = P(f, len / 2, S * 0.92);
  solid(d, r, ellL(cx, cy, 11, 11, 18), "#1e1c1a", { h: 6, line: 1.8 });
  fillPoly(g, ellL(cx, cy, 8, 8, 14), "#5a5a2c");
  g.strokeStyle = "rgba(220,220,160,.4)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.arc(cx - 2, cy - 2, 4, Math.PI, Math.PI * 1.6);
  g.stroke();
  ln(d, r, WORLD, cx + 2, cy, cx + 13, cy - 9, 1.6, pal.woodDark);
}

// ——— Portes, toiles, appliques ———

/**
 * Portes posées dans l'axe du mur de la salle (au milieu du bandeau, pas au milieu de la case), une seule par
 * passage : si la case suivante vers la salle est aussi une porte, c'est elle qui porte le battant.
 * Trois états qu'on distingue au premier coup d'œil : porte fermée (bois plein, ferrures, liseré clair côté
 * salle), porte ouverte (battant pivoté à 90° vers la salle, avec son ombre), herse (barreaux noirs en rang
 * sur une rainure sombre) pour la crypte et les cellules.
 */
function paintDoorsInk(d: Dungeon) {
  const { g, W, H, S, at, pal, seed, roomAt, c } = d;
  const t = Math.round(S * 0.36);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.porte) continue;
      const r = rng(seed, 200, x, y);
      const solidAt = (dx: number, dy: number) => !isOpen(at(x + dx, y + dy));
      let horizontal: boolean;
      if (solidAt(-1, 0) && solidAt(1, 0)) horizontal = true;
      else if (solidAt(0, -1) && solidAt(0, 1)) horizontal = false;
      else horizontal = roomAt[(y - 1) * W + x] >= 0 || roomAt[(y + 1) * W + x] >= 0;
      // côté salle : +1 si la salle est en y local positif
      const roomSide = horizontal ? (roomAt[(y + 1) * W + x] >= 0 ? 1 : -1) : roomAt[y * W + x - 1] >= 0 ? 1 : -1;
      // case suivante vers la salle (y local positif × roomSide)
      const [tx, ty] = horizontal ? [x, y + roomSide] : [x - roomSide, y];
      const ri = roomAt[ty * W + tx];
      if (at(tx, ty) === T.porte) continue;
      const label = c.map.rooms[ri]?.label ?? "";
      const f: Frame = { ox: (x + 0.5) * S, oy: (y + 0.5) * S, rot: horizontal ? 0 : Math.PI / 2 };
      // axe du mur : milieu du bandeau, du côté de la salle si la porte la touche
      const cy = ri >= 0 ? roomSide * (S / 2 - t / 2) : 0;
      // seuil : une dalle usée en travers de l'ouverture
      const sill = L(f, rectL(-S / 2 + 1, cy - t / 2 - 1, S - 2, t + 2));
      fillPoly(g, sill, tint(mixColor(pal.wallTop, pal.floor, 0.7), 0.06));
      ln(d, r, f, -S * 0.3, cy + 1, S * 0.2, cy + 2, 0.6, "rgba(30,20,12,.5)");
      inkOutline(g, sill, r, { width: 0.9, wobble: 0.3, color: "rgba(20,14,8,.7)" });
      // chambranles : pierres de taille aux deux bouts de l'ouverture, dans le bandeau
      for (const sx of [-1, 1]) {
        const x0 = sx < 0 ? -S / 2 - 6 : S / 2 - 3;
        const jamb = L(f, rectL(x0, cy - t / 2 - 3, 9, t + 6));
        fillPoly(g, jamb.map(([px, py]) => [px + 2, py + 3] as Pt), "rgba(0,0,0,.4)");
        fillPoly(g, jamb, tint(pal.wallTop, 0.12));
        ln(d, r, f, x0 + 1.5, cy, x0 + 7.5, cy + 0.5, 0.7, "rgba(14,10,6,.6)");
        inkOutline(g, jamb, r, { width: 1.6, wobble: 0.25, pressure: 0.3 });
      }
      if (label === "Crypte" || label === "Cellules") {
        portcullis(d, r, f, cy);
        continue;
      }
      const kind = r();
      if (kind < 0.28) {
        // ouverte : le battant a pivoté de 90° vers la salle, collé au chambranle du gond
        const hinge = r() < 0.5 ? -1 : 1;
        const hx = hinge * (S / 2 - 3);
        const hf: Frame = { ...P2F(P(f, hx, cy)), rot: f.rot + roomSide * (Math.PI / 2 - between(r, 0, 0.12)) };
        const inward = hinge * roomSide;
        doorLeaf(d, r, hf, 0, inward > 0 ? 0 : -8, S - 6, 8, "planches", 6);
        // le sol nu de l'ouverture, avec le liseré de lumière qui passe
        ln(d, r, f, -S / 2 + 6, cy + roomSide * 2, S / 2 - 6, cy + roomSide * 2, 1, "rgba(255,240,200,.35)");
      } else if (kind < 0.45) {
        // deux vantaux fermés
        doorLeaf(d, r, f, -S / 2 - 2, cy - 6, S / 2 + 2, 12, "planches", 4);
        doorLeaf(d, r, f, 0, cy - 6, S / 2 + 2, 12, "planches", 4);
        ring(d, P(f, -4, cy + roomSide * 7.5));
        ring(d, P(f, 4, cy + roomSide * 7.5));
        ln(d, r, f, -S / 2 + 3, cy + roomSide * 6.2, S / 2 - 3, cy + roomSide * 6.2, 1.1, "rgba(255,238,196,.45)");
      } else {
        // arc d'ouverture discret, côté salle, depuis le gond
        const hinge = r() < 0.5 ? -1 : 1;
        const [ax, ay] = P(f, hinge * (S / 2 - 2), cy);
        const a0 = f.rot + (hinge < 0 ? 0 : Math.PI);
        const sweep = roomSide * hinge * (Math.PI / 2);
        g.save();
        g.setLineDash([2.5, 3]);
        g.strokeStyle = "rgba(24,16,8,.4)";
        g.lineWidth = 0.9;
        g.beginPath();
        g.arc(ax, ay, S - 6, Math.min(a0, a0 + sweep), Math.max(a0, a0 + sweep));
        g.stroke();
        g.restore();
        doorLeaf(d, r, f, -S / 2 - 2, cy - 6, S + 4, 12, kind < 0.7 ? "cloutee" : "planches", 4);
        ring(d, P(f, S * 0.14, cy + roomSide * 7.5));
        ln(d, r, f, -S / 2 + 3, cy + roomSide * 6.2, S / 2 - 3, cy + roomSide * 6.2, 1.1, "rgba(255,238,196,.45)");
      }
    }
}

/** Battant de porte vu de dessus, rectangle (x, y, w, h) dans le repère f : bois plein, pentures ou clous, ombre portée. */
function doorLeaf(d: Dungeon, r: Rng, f: Frame, x: number, y: number, w: number, h: number, kind: "planches" | "cloutee", lift = 4) {
  const { g, pal } = d;
  // bois clair, qui tranche sur le mur sombre ; ferrures noires
  const wood = kind === "cloutee" ? mixColor(pal.wood, "#b4885a", 0.35) : tint(mixColor(pal.wood, "#c4945e", 0.45), (r() - 0.5) * 0.12);
  const leaf = L(f, rectL(x, y, w, h));
  fillPoly(g, leaf.map(([px, py]) => [px + lift * 0.8, py + lift] as Pt), "rgba(0,0,0,.45)");
  fillPoly(g, leaf, wood);
  // planches dans la longueur, veines
  for (const k of [1 / 3, 2 / 3]) ln(d, r, f, x + 1, y + h * k, x + w - 1, y + h * k, 0.8, "rgba(26,16,8,.75)");
  for (let k = 0; k < 3; k++) {
    const vx = x + 4 + r() * (w - 14);
    const vy = y + (h * (k + 0.5)) / 3;
    ln(d, r, f, vx, vy, vx + 5 + r() * 6, vy + (r() - 0.5), 0.4, "rgba(26,16,8,.4)");
  }
  if (kind === "cloutee") {
    for (const bx of [x + 3, x + w - 6]) fillPoly(g, L(f, rectL(bx, y - 1, 3, h + 2)), "#1d1b19");
    g.fillStyle = "#9a948a";
    for (let k = x + 9; k < x + w - 7; k += 6) for (const yy of [0.3, 0.7]) dot(g, ...P(f, k, y + h * yy), 0.8);
  } else {
    // pentures : deux bandes de fer qui débordent un peu du battant
    for (const bx of [x + w * 0.2, x + w * 0.8]) {
      fillPoly(g, L(f, rectL(bx - 2, y - 1.5, 4, h + 3)), "#1d1b19");
      g.fillStyle = "#8a857c";
      dot(g, ...P(f, bx, y + h * 0.3), 0.7);
      dot(g, ...P(f, bx, y + h * 0.7), 0.7);
    }
  }
  // arête éclairée du côté de la lumière
  ln(d, r, f, x + 1, y + 1.2, x + w - 1, y + 1.2, 0.8, "rgba(255,230,180,.35)");
  inkOutline(g, leaf, r, { width: 2.2, wobble: 0.3, pressure: 0.25 });
}

function ring(d: Dungeon, [hx, hy]: Pt) {
  const { g } = d;
  g.strokeStyle = INK;
  g.lineWidth = 2.2;
  g.beginPath();
  g.arc(hx, hy, 2.6, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#a89a7a";
  g.lineWidth = 0.8;
  g.stroke();
}

/** Herse vue de dessus : rainure sombre en travers de l'ouverture, rang de barreaux noirs à tête ronde, reflet en haut à gauche. */
function portcullis(d: Dungeon, r: Rng, f: Frame, cy: number) {
  const { g, S } = d;
  const groove = L(f, rectL(-S / 2 - 2, cy - 4.5, S + 4, 9));
  fillPoly(g, groove, "rgba(10,7,5,.88)");
  // traverse basse, à peine visible entre les têtes
  ln(d, r, f, -S / 2, cy, S / 2, cy, 1, "rgba(60,58,54,.8)");
  const n = 8;
  for (let k = 0; k < n; k++) {
    const x = -S / 2 + 3.5 + (k * (S - 7)) / (n - 1);
    const [px, py] = P(f, x, cy + (r() - 0.5) * 0.6);
    // ombre du barreau sur le sol, vers le bas à droite
    g.fillStyle = "rgba(0,0,0,.45)";
    dot(g, px + 2.5, py + 3.2, 2.4);
    g.fillStyle = INK;
    dot(g, px, py, 2.5);
    g.fillStyle = "rgba(176,170,158,.85)";
    dot(g, px - 0.8, py - 0.8, 0.85);
  }
}

/**
 * Toiles d'araignée dans les coins des salles, en cinq façons (classique, déchirée, serrée, de travers,
 * avec un cocon), retournées au hasard : on n'en voit jamais deux pareilles.
 */
function paintCobwebs(d: Dungeon) {
  const { g, S, seed, c } = d;
  c.map.rooms.forEach((room, i) => {
    const r = rng(seed, 300, i);
    const corners: [number, number, number][] = [
      [room.x, room.y, 0],
      [room.x + room.w, room.y, Math.PI / 2],
      [room.x + room.w, room.y + room.h, Math.PI],
      [room.x, room.y + room.h, -Math.PI / 2],
    ];
    for (const [cx, cy, rot] of corners) {
      if (r() > 0.4) continue;
      const kind = Math.floor(r() * 5);
      // retournement : on échange les deux murs du coin
      const flip = r() < 0.5;
      const f = { ox: cx * S, oy: cy * S, rot };
      const Q = (x: number, y: number) => (flip ? P(f, y, x) : P(f, x, y));
      const len = S * between(r, 0.5, kind === 2 ? 0.6 : 0.95);
      const spokes = kind === 2 ? 5 + Math.floor(r() * 2) : 3 + Math.floor(r() * 3);
      const ends: Pt[] = [];
      g.lineCap = "round";
      g.strokeStyle = "rgba(236,232,220,.7)";
      g.lineWidth = 1;
      for (let k = 0; k <= spokes; k++) {
        const a = (k / spokes) * (Math.PI / 2) + (kind === 3 ? (r() - 0.5) * 0.3 : 0);
        const l = len * (kind === 3 ? between(r, 0.5, 1.2) : between(r, 0.8, 1.1));
        const e: Pt = [Math.cos(a) * l, Math.sin(a) * l];
        ends.push(e);
        // fil cassé : il s'arrête plus tôt et pend
        const broken = kind === 1 && r() < 0.35;
        g.beginPath();
        g.moveTo(...Q(0, 0));
        g.lineTo(...Q(e[0] * (broken ? 0.55 : 1), e[1] * (broken ? 0.55 : 1)));
        if (broken) g.quadraticCurveTo(...Q(e[0] * 0.7 + 4, e[1] * 0.7 + 6), ...Q(e[0] * 0.6 + 7, e[1] * 0.6 + 12));
        g.stroke();
      }
      g.lineWidth = 0.75;
      const rings = kind === 2 ? [0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92] : [0.28, 0.48, 0.68, 0.88];
      for (const t of rings) {
        g.beginPath();
        for (let k = 0; k < ends.length - 1; k++) {
          const a: Pt = [ends[k][0] * t, ends[k][1] * t];
          const b: Pt = [ends[k + 1][0] * t, ends[k + 1][1] * t];
          const m: Pt = [((a[0] + b[0]) / 2) * 0.86, ((a[1] + b[1]) / 2) * 0.86];
          if (kind === 1 && r() < 0.3) {
            g.moveTo(...Q(...b));
            continue;
          }
          if (k === 0 || (kind === 1 && r() < 0.01)) g.moveTo(...Q(...a));
          if (kind === 3) g.lineTo(...Q(...b));
          else g.quadraticCurveTo(...Q(...m), ...Q(...b));
        }
        g.stroke();
      }
      if (kind === 4) {
        // cocon : petit fuseau blanc pris dans la toile
        const [px, py] = Q(len * 0.38, len * 0.3);
        const pts = smoothPoints(blobPoints(r, px, py, 4.5, 2.6, 7, 0.2, r() * 3), 1);
        fillPoly(g, pts.map(([x, y]) => [x + 1.5, y + 2] as Pt), "rgba(0,0,0,.3)");
        fillPoly(g, pts, "#e6e0d0");
        inkOutline(g, pts, r, { width: 0.7, wobble: 0.2 });
        for (let k = -2; k <= 2; k += 2) ln(d, r, WORLD, px - 3, py + k, px + 3, py + k + 1, 0.4, "rgba(80,70,60,.6)");
      }
    }
  });
}

/**
 * Torches sur les murs des salles (une, deux dans les grandes), chacune avec sa flaque de lumière. La crypte et
 * les cellules n'en ont pas : seules leurs bougies, s'il y en a, y font un peu de jour.
 */
function planSconces(d: Dungeon) {
  const { S, seed, c, W } = d;
  c.map.rooms.forEach((room, i) => {
    const r = rng(seed, 400, i);
    if (room.label === "Crypte" || room.label === "Cellules") return;
    const n = room.w * room.h > 30 ? 2 : 1;
    let placed = 0;
    for (const side of [0, 2, 1, 3].sort(() => r() - 0.5)) {
      if (placed >= n) break;
      const along = side % 2 === 0 ? room.w : room.h;
      const off = Math.floor(along / 2 + (r() - 0.5) * (along - 2));
      const f = sideFrame(d, room, side, off);
      const [x, y] = P(f, S / 2, S / 2);
      const k = Math.floor(y / S) * W + Math.floor(x / S);
      // jamais devant une porte, jamais sur une ouverture
      if ((d.busy[k] && d.roomAt[k] === i) || !solidBehind(d, f, S / 2)) continue;
      placed++;
      // la case sous la torche reste libre : pas de meuble haut contre elle
      d.busy[k] = 1;
      const [bx, by] = P(f, S / 2, 0);
      const ff = { ox: bx, oy: by, rot: f.rot };
      d.sconces.push(ff);
      d.lights.push({ ...P2(P(ff, 0, 16)), rad: S * 3, k: 1 });
    }
  });
}

function paintSconces(d: Dungeon) {
  const { g, seed } = d;
  d.sconces.forEach((ff, i) => {
    const r = rng(seed, 410, i);
    // applique scellée dans le parement, torche penchée vers la salle, flamme de 12 px
    solid(d, r, L(ff, rectL(-5, -12, 10, 9)), d.pal.iron, { h: 2, line: 1.4, light: 0.6 });
    g.fillStyle = "#8a857c";
    dot(g, ...P(ff, -2.6, -9.5), 0.9);
    dot(g, ...P(ff, 2.6, -9.5), 0.9);
    ln(d, r, ff, 0, -5, 0, 4, 2.8, INK);
    solid(d, r, L(ff, [[-3, 2], [3, 2], [2.3, 12], [-2.3, 12]]), d.pal.woodDark, { h: 3, line: 1.1 });
    solid(d, r, L(ff, ellL(0, 3, 4, 2.2, 10)), d.pal.iron, { h: 0, line: 1, light: 0 });
    // halo serré autour de la flamme, avant elle
    const [hx, hy] = P(ff, 0, 17);
    const halo = g.createRadialGradient(hx, hy, 0, hx, hy, 16);
    halo.addColorStop(0, "rgba(255,200,110,.55)");
    halo.addColorStop(1, "rgba(255,200,110,0)");
    g.fillStyle = halo;
    g.fillRect(hx - 16, hy - 16, 32, 32);
    const flame = smoothPoints(L(ff, [[-5.6, 14], [0, 11], [5.6, 14], [2.8, 20.5], [0, 25], [-2.8, 20.5]] as Pt[]), 2);
    fillPoly(g, flame, "#e2622a");
    fillPoly(g, smoothPoints(L(ff, [[-3.4, 14.4], [0, 12.4], [3.4, 14.4], [0, 21.5]] as Pt[]), 2), "#ffb347");
    g.fillStyle = "#fff4c8";
    dot(g, ...P(ff, 0, 14.8), 1.8);
    inkOutline(g, flame, r, { width: 0.9, wobble: 0.15, color: "rgba(90,24,6,.85)" });
  });
}
const P2 = ([x, y]: Pt) => ({ x, y });

/** Pénombre de base de chaque salle (0 : en pleine lumière, 1 : noir) : la crypte et les cellules restent presque dans le noir. */
const ROOM_DARK: Record<string, number> = {
  Entrée: 0.56,
  "Salle des gardes": 0.6,
  Crypte: 0.84,
  Armurerie: 0.64,
  "Salle du trône": 0.58,
  Bibliothèque: 0.62,
  Cellules: 0.84,
  Autel: 0.7,
  Trésor: 0.66,
  Cuisine: 0.58,
};

/**
 * Motif de hachures diagonales sur une tuile de 256 px qui se raccorde sans couture (espacements tirés au hasard,
 * traits un peu inclinés de travers) : aussi rapide qu'un aplat, sans la régularité d'une trame mécanique.
 * dir = 1 : traits vers le bas à droite ; −1 : vers le bas à gauche.
 */
function hatchPattern(g: CanvasRenderingContext2D, r: Rng, gap0: number, gap1: number, width: number, color: string, dir: 1 | -1): CanvasPattern {
  const T = 256;
  const tile = canvas(T, T);
  const tg = tile.getContext("2d")!;
  tg.strokeStyle = color;
  tg.lineWidth = width;
  tg.lineCap = "butt";
  const p = new Path2D();
  for (let k = 0; k < T - gap0 * 0.6; k += between(r, gap0, gap1)) {
    const w = (r() - 0.5) * 1.2;
    for (const o of [-T, 0, T, 2 * T]) {
      const x0 = dir > 0 ? k + o - T : k + o;
      p.moveTo(x0, 0);
      p.lineTo(x0 + dir * T + w, T);
    }
  }
  tg.stroke(p);
  return g.createPattern(tile, "repeat")!;
}

/** Enveloppe convexe (chaîne monotone). */
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/**
 * Ce que la flamme éclaire : polygone de visibilité lancé depuis la source (rayons tous les 3,75°, pas de 3 px)
 * qui s'arrête sur les murs (il mord le bandeau de 12 px : le dessus du mur prend la lumière) et passe par les
 * portes. Le rayon est modulé par un bruit angulaire attaché à la flamme : le bord n'est jamais un cercle.
 */
function lightPoly(d: Dungeon, l: Light, rad: number, seed: number): Pt[] {
  const { S, at } = d;
  const n = noise2(seed);
  const pts: Pt[] = [];
  const m = 96;
  for (let k = 0; k < m; k++) {
    const a = (k / m) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const w = 1 + n(ca * 1.6 + l.x * 0.01, sa * 1.6 + l.y * 0.01) * 0.16 + n(ca * 4 + 40, sa * 4) * 0.05;
    const max = rad * w;
    let s = 0;
    let wall = -1;
    while (s < max) {
      s += 3;
      const x = l.x + ca * s;
      const y = l.y + sa * s;
      if (!isOpen(at(Math.floor(x / S), Math.floor(y / S)))) {
        if (wall < 0) wall = s;
        if (s - wall > 12) break;
      } else if (wall >= 0 && s - wall < 3) wall = -1;
    }
    s = Math.min(s, max);
    pts.push([l.x + ca * s, l.y + sa * s]);
  }
  return pts;
}

/**
 * Couloirs : de loin en loin (au moins 6 cases entre deux accidents, et jamais près d'une salle), un tas de gravats,
 * une flaque, des os ou une porte défoncée. Tout reste sur un bord ou occupe peu de la case : le passage est libre.
 */
function paintCorridorDebris(d: Dungeon) {
  const { W, H, S, at, roomAt, seed } = d;
  const r = rng(seed, 77);
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && isOpen(at(x, y));
  const done: Pt[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!open(x, y) || roomAt[y * W + x] >= 0) continue;
      // les couloirs font souvent deux cases de large : on repère le sens du tronçon par ses voisins ouverts
      const h = open(x - 1, y) && open(x + 1, y) && !(open(x, y - 1) && open(x, y + 1));
      const v = open(x, y - 1) && open(x, y + 1) && !(open(x - 1, y) && open(x + 1, y));
      if (!h && !v) continue;
      // ni près d'une salle ni près d'un autre accident
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (open(x + dx, y + dy) && roomAt[(y + dy) * W + x + dx] >= 0) near = true;
      if (near || done.some(([a, b]) => Math.hypot(a - x, b - y) < 5)) continue;
      if (r() > 0.2) continue;
      done.push([x, y]);
      const cx = (x + 0.5) * S;
      const cy = (y + 0.5) * S;
      const side = r() < 0.5 ? -1 : 1;
      // décalage vers un bord du couloir, perpendiculaire à sa direction
      const ox = v ? side * S * 0.22 : 0;
      const oy = h ? side * S * 0.22 : 0;
      const kind = Math.floor(r() * 4);
      if (kind === 0) {
        rubble(d, r, cx + ox, cy + oy, 7 + Math.floor(r() * 5), S * 0.3);
        const pts = blobPoints(r, cx + ox, cy + oy, between(r, 6, 9), between(r, 4, 7), 6, 0.2, r() * 3);
        solid(d, r, pts, tint(d.pal.block, 0.04), { h: 3, line: 1.2 });
      } else if (kind === 1) {
        puddle(d, r, cx + ox * 0.5, cy + oy * 0.5, S * between(r, 0.28, 0.4), S * between(r, 0.16, 0.24));
      } else if (kind === 2) {
        bone(d, r, cx + ox, cy + oy, r() * Math.PI, between(r, 14, 19));
        bone(d, r, cx + ox + between(r, -8, 8), cy + oy + between(r, -8, 8), r() * Math.PI, between(r, 12, 17));
        if (r() < 0.6) skull(d, r, cx + ox * 1.4 + between(r, -6, 6), cy + oy * 1.4 + between(r, -6, 6), 7, r() * Math.PI * 2);
      } else {
        // porte défoncée : battant brisé couché contre un mur, planches et éclats ; le milieu du couloir reste libre
        const f = { ox: cx + ox * 1.5, oy: cy + oy * 1.5, rot: (v ? Math.PI / 2 : 0) + (r() - 0.5) * 0.5 };
        solid(d, r, L(f, [[-13, -3], [4, -4], [5, 3], [-12, 4]]), tint(d.pal.wood, -0.08), { h: 2, line: 1 });
        solid(d, r, L(f, [[6, -7], [17, -5], [15, -1], [7, -2]]), tint(d.pal.wood, -0.14), { h: 1.5, line: 0.9 });
        solid(d, r, L(f, [[-5, 8], [9, 7], [10, 10], [-4, 11]]), tint(d.pal.wood, -0.04), { h: 1.5, line: 0.9 });
        rubble(d, r, f.ox, f.oy, 5, 14);
      }
    }
}

/**
 * Clair-obscur de planche. Un calque d'obscurité sépia couvre tout (environ 60 % dans les salles habitées,
 * plus de 80 % dans la crypte et les cellules ; les couloirs foncent loin des salles, culs-de-sac plus encore),
 * et chaque flamme y perce un trou en dégradé radial centré sur elle, rogné par les murs (polygone de
 * visibilité) : une flaque entière, jamais fragmentée, et aucune flaque sans sa source. Puis une lueur ambre
 * (#ffb060, en écran) dans la même flaque, et les meubles hauts projettent leur silhouette à l'opposé de la
 * flamme la plus proche. Enfin l'ombre est encrée : des hachures qui ne prennent que là où il fait sombre.
 */
/** Plancher de clarté : jamais plus de 72 % d'obscurité, donc 28 % de lumière froide même sans flamme. */
const MAX_DARK = 0.72;

function paintLight(d: Dungeon) {
  const { g, c, S, W, H, at, roomAt, seed } = d;
  const cv = g.canvas;
  const rooms = c.map.rooms;
  // Distance de chaque case de couloir à la salle la plus proche (en cases).
  const far = new Uint8Array(W * H).fill(255);
  let front: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y)) || roomAt[y * W + x] >= 0) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roomAt[(y + dy) * W + x + dx] >= 0 && x + dx >= 0 && x + dx < W)) {
        far[y * W + x] = 0;
        front.push(y * W + x);
      }
    }
  for (let n = 1; front.length && n < 30; n++) {
    const next: number[] = [];
    for (const k of front) {
      const x = k % W;
      const y = (k - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isOpen(at(nx, ny)) || roomAt[ny * W + nx] >= 0) continue;
        if (far[ny * W + nx] <= n) continue;
        far[ny * W + nx] = n;
        next.push(ny * W + nx);
      }
    }
    front = next;
  }
  // un sol déjà sombre (science-fiction, horreur) supporte moins d'obscurité : on la réduit selon sa clarté
  const [fr, fg, fb] = hexRgb(d.pal.floor);
  const soft = Math.max(0.72, Math.min(1, 0.5 + ((0.3 * fr + 0.59 * fg + 0.11 * fb) / 255) * 0.75));
  const darkOf = (x: number, y: number): number => {
    if (!isOpen(at(x, y))) return -1;
    const ri = roomAt[y * W + x];
    if (ri >= 0) return Math.min(MAX_DARK, (ROOM_DARK[rooms[ri].label ?? ""] ?? 0.6) * soft);
    const exits = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isOpen(at(x + dx, y + dy))).length;
    return Math.min(MAX_DARK, (0.66 + Math.min(far[y * W + x], 8) * 0.02 + (exits <= 1 ? 0.1 : 0)) * soft);
  };
  // Valeur par case ; un mur prend presque la pénombre de ses voisins de sol, la roche une valeur faible.
  const small = canvas(W, H);
  const sg = small.getContext("2d")!;
  const img = sg.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = darkOf(x, y);
      if (v < 0) {
        let best = -1;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) best = Math.max(best, darkOf(x + dx, y + dy));
        v = best < 0 ? 0.3 : best * 0.75;
      }
      const k = (y * W + x) * 4;
      // ombre sépia, pas bleu-noir : le lavis reste chaud ; là où l'obscurité est la plus forte,
      // elle vire à la lumière froide d'ambiance, qui garde cercueils et mobilier lisibles
      const cold = Math.max(0, Math.min(1, (v - 0.6) / (MAX_DARK - 0.6)));
      img.data[k] = Math.round(20 - 4 * cold);
      img.data[k + 1] = Math.round(13 + 3 * cold);
      img.data[k + 2] = Math.round(8 + 14 * cold);
      img.data[k + 3] = Math.round(255 * v);
    }
  sg.putImageData(img, 0, 0);
  const mid = canvas(W * 4, H * 4);
  const mg = mid.getContext("2d")!;
  mg.filter = "blur(0.9px)";
  mg.imageSmoothingEnabled = true;
  mg.drawImage(small, 0, 0, W * 4, H * 4);
  const dark = canvas(cv.width, cv.height);
  const dg = dark.getContext("2d")!;
  dg.imageSmoothingEnabled = true;
  dg.imageSmoothingQuality = "high";
  dg.drawImage(mid, 0, 0, cv.width, cv.height);
  // Crypte et cellules : une seule petite source fait un peu de jour, les autres bougies ne sont que des points.
  const seen = new Set<number>();
  d.lights = d.lights.filter((l) => {
    const ri = roomAt[Math.floor(l.y / S) * W + Math.floor(l.x / S)];
    const label = rooms[ri]?.label;
    if (label !== "Crypte" && label !== "Cellules") return true;
    if (seen.has(ri)) return false;
    seen.add(ri);
    return true;
  });
  // Chaque flamme perce l'obscurité : dégradé radial centré sur elle, dans son polygone de visibilité.
  const pools = d.lights.map((l, i) => lightPoly(d, l, l.rad, seed + 900 + i));
  dg.globalCompositeOperation = "destination-out";
  d.lights.forEach((l, i) => {
    // torches et braseros percent franchement ; cierges et lanternes ne font qu'une lueur
    const a = l.k >= 1 ? 1 : 0.2 + 0.55 * l.k;
    const grad = dg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.rad * 1.15);
    grad.addColorStop(0, `rgba(0,0,0,${a})`);
    grad.addColorStop(0.3, `rgba(0,0,0,${a * 0.92})`);
    grad.addColorStop(0.62, `rgba(0,0,0,${a * 0.55})`);
    grad.addColorStop(0.85, `rgba(0,0,0,${a * 0.18})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    dg.fillStyle = grad;
    fillPath(dg, pools[i]);
  });
  // Ombres portées des meubles hauts, à l'opposé de la flamme la plus proche, coupées par les murs.
  if (d.casters.length && d.lights.length) {
    const sh = canvas(cv.width, cv.height);
    const shg = sh.getContext("2d")!;
    shg.fillStyle = "#000";
    const done: Pt[][] = [];
    for (const { pts, h } of d.casters) {
      const cx = pts.reduce((t, p) => t + p[0], 0) / pts.length;
      const cy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
      let best: Light | null = null;
      let bd = Infinity;
      for (const l of d.lights) {
        const dd = Math.hypot(l.x - cx, l.y - cy);
        if (dd < bd && roomAt[Math.floor(l.y / S) * W + Math.floor(l.x / S)] === roomAt[Math.floor(cy / S) * W + Math.floor(cx / S)]) {
          bd = dd;
          best = l;
        }
      }
      if (!best || bd > best.rad * 2) continue;
      const ux = (cx - best.x) / (bd || 1);
      const uy = (cy - best.y) / (bd || 1);
      const len = Math.max(6, Math.min(20, h * 1.6 + bd * 0.05));
      fillPath(shg, hull([...pts, ...pts.map(([x, y]) => [x + ux * len, y + uy * len] as Pt)]));
      done.push(pts);
    }
    shg.globalCompositeOperation = "destination-out";
    for (const pts of done) fillPath(shg, pts);
    shg.globalCompositeOperation = "destination-in";
    shg.drawImage(d.floorMask, 0, 0);
    g.save();
    g.globalAlpha = 0.35;
    g.drawImage(sh, 0, 0);
    g.restore();
  }
  // L'ombre encrée : hachures diagonales sur le sol, dont l'opacité suit celle du calque d'ombre
  // (prise deux fois : la pénombre légère ne reçoit presque rien, l'ombre franche reçoit l'encre).
  const ink = canvas(cv.width, cv.height);
  const ig = ink.getContext("2d")!;
  const r = rng(seed, 950);
  ig.fillStyle = hatchPattern(ig, r, 4, 5.2, 0.8, "rgba(14,10,6,.7)", 1);
  ig.fillRect(0, 0, cv.width, cv.height);
  ig.globalCompositeOperation = "destination-in";
  ig.drawImage(dark, 0, 0);
  ig.drawImage(d.floorMask, 0, 0);
  ig.drawImage(dark, 0, 0);
  g.drawImage(dark, 0, 0);
  g.drawImage(ink, 0, 0);
  // Lueur ambre dans chaque flaque : un glacis chaud en multiplication, puis la clarté en écran.
  d.lights.forEach((l, i) => {
    // une bougie dore le sol presque autant qu'une torche, mais l'éclaire bien moins
    const k = l.k >= 1 ? 1 : l.k * l.k;
    g.save();
    g.globalCompositeOperation = "multiply";
    let grad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.rad);
    grad.addColorStop(0, `rgba(255,160,80,${0.34 * Math.min(1, l.k + 0.2)})`);
    grad.addColorStop(1, "rgba(255,170,90,0)");
    g.fillStyle = grad;
    fillPath(g, pools[i]);
    g.globalCompositeOperation = "screen";
    grad = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.rad * 0.85);
    grad.addColorStop(0, `rgba(255,176,96,${0.42 * k})`);
    grad.addColorStop(0.18, `rgba(255,176,96,${0.26 * k})`);
    grad.addColorStop(0.55, `rgba(255,176,96,${0.08 * k})`);
    grad.addColorStop(1, "rgba(255,176,96,0)");
    g.fillStyle = grad;
    fillPath(g, pools[i]);
    g.restore();
  });
}
