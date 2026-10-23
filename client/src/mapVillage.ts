// Rendu des villages, façon planche de roman graphique : herbe et terre au lavis, usée là où l'on passe,
// rues à ornières, place pavée avec ses flaques. Deux sortes de bâtiments :
// - les lieux nommés (map.rooms : auberge, forge, temple…) sont ouverts au jeu : coupés à hauteur d'homme,
//   rebord de toit en avancée tout autour, murs encrés, intérieur meublé selon le nom ;
// - les simples logis (blocs de murs pleins, sans intérieur) sont vus d'en haut avec leur toit : chaume, tuiles,
//   ardoise, tôle selon le genre, faîtage, croupes ou pignons, cheminée, ombre portée ; un appentis accolé à un lieu
//   ouvert n'a qu'un pan, le clocher du temple un toit en pavillon et une longue ombre.
// Le genre change les objets du village (réservoir, conteneurs et bacs hydroponiques en science-fiction, filets et
// tonneaux au port, ferraille et pneus après l'apocalypse), pas seulement les couleurs.
// Le décor est purement visuel : seules les cases (map.tiles) font la règle du jeu. Aucun objet ne
// se pose devant une porte, et rien ne cache une case praticable au point de la faire lire comme un mur.
import { T, type GameMap } from "../../shared/types";
import { paintGrid, type MapCtx } from "./mapCommon";
import {
  applyPaper,
  between,
  blobPoints,
  canvas,
  cellContour,
  hatch,
  INK,
  inkLine,
  inkOutline,
  inkPolyline,
  jitterPoints,
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
  type Pt,
  type Rng,
  type Shape,
} from "./mapInk";
import { paintOutdoorWater } from "./mapOutdoor";
import { hash } from "./mapUtil";

type Side = "N" | "S" | "E" | "W";
type WallStyle = "pierre" | "colombage" | "planches" | "metal" | "pise";
type RoofStyle = "chaume" | "tuiles" | "ardoise" | "bardeaux" | "plaques" | "tole";
type FloorStyle = "planches" | "dalles" | "terre" | "plaques";

/** Ombre portée des volumes : lumière du haut à gauche. */
const SHX = 13;
const SHY = 17;
/** Ancienne avancée (gardée pour le décor posé le long des façades), en px. */
const OVER = 5;
/** Rebord du toit en avancée sur la rue (0,3 case), seulement côté rue. */
const EAVE = 18;
const SHADOW = "rgba(16,10,5,.56)";
const INK_SOFT = "rgba(22,16,10,.55)";
/** Encre des murs et des toits : brun-noir, un peu plus chaud que l'encre commune. */
const WALL_INK = "#1e1610";

interface Pal {
  grass: string;
  grassDry: string;
  grassLush: string;
  dirt: string;
  mud: string;
  cobble: string;
  wood: string;
  woodDark: string;
  woodLight: string;
  plank: string;
  flag: string;
  stone: string;
  daub: string;
  timber: string;
  metal: string;
  straw: string;
  water: string;
  leaves: string[];
  cloth: string[];
  roof: Record<RoofStyle, string>;
}

interface Door {
  x: number;
  y: number;
  /** Côté du bâtiment où s'ouvre la porte. */
  side: Side;
}

interface Building {
  label: string;
  /** Cases extrêmes du bâtiment, murs compris. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  doors: Door[];
  wall: WallStyle;
  roof: RoofStyle;
  floor: FloorStyle;
  /** Épaisseur du mur dessiné, en px, depuis le bord extérieur de la case de mur. */
  t: number;
  /** Côtés qui donnent sur la rue : seuls ceux-là portent un rebord de toit. */
  eaves: Set<Side>;
  windows: { x: number; y: number; side: Side }[];
  chimney: { side: Side; at: number } | null;
}

interface V {
  c: MapCtx;
  g: CanvasRenderingContext2D;
  map: GameMap;
  W: number;
  H: number;
  S: number;
  seed: number;
  pal: Pal;
  tile: (x: number, y: number) => number | undefined;
  indoor: Uint8Array;
  /** Cases d'extérieur déjà prises par un décor (champ, potager, objet). */
  used: Uint8Array;
  buildings: Building[];
  /** Cases de mur qui n'appartiennent à aucun bâtiment reconnu (dessinées à part). */
  looseWalls: number[];
  /** Arbres, tirés une fois (ombres puis houppiers). */
  trees?: Tree[];
  /** Courbe des rues dessinées (px → px). */
  warp: (p: Pt) => Pt;
  /** Cases d'enclos (arrière-cours clôturées), où l'herbe pousse plus haut. */
  fence: Uint8Array;
  yards: Yard[];
  /** Logis fermés, appentis et clocher, dessinés avec leur toit. */
  blocks: Block[];
  flavor: Flavor;
  /** Cases pavées de la place (calculées avec les rues). */
  paved?: Uint8Array;
  /** Usure du sol par case, de 0 (herbe intacte) à 1 (terre battue). */
  wear?: Float32Array;
}

export function renderVillage(c: MapCtx): HTMLCanvasElement {
  const v = setup(c);
  planYards(v);
  paintGround(v);
  paintPaths(v);
  paintFields(v);
  paintRoads(v);
  paintGrassDetail(v);
  paintYards(v);
  paintPalisade(v);
  paintShadows(v);
  paintTrees(v);
  paintOutdoorProps(v);
  paintStreetLife(v);
  paintStumps(v);
  for (const b of v.buildings) paintInterior(v, b);
  // toits des logis fermés et des appentis avant les murs des lieux ouverts : le rebord du grand toit recouvre l'appentis
  paintBlocks(v);
  paintBlockDoors(v);
  for (const b of v.buildings) paintShell(v, b);
  paintAnnexJoins(v);
  paintSpireShadow(v);
  paintLooseWalls(v);
  paintWater(v);
  // quadrillage un peu plus appuyé qu'ailleurs : il doit se lire sur l'herbe sombre et sur les pavés
  paintGrid(c, 0.34);
  applyPaper(v.g, v.seed, 1.25);
  vignette(v);
  return c.cv;
}

/**
 * Unité de la planche : voile sépia en multiply, bords assombris comme un lavis qui a coulé vers la marge,
 * grain fin du papier en overlay.
 */
function vignette(v: V) {
  const { g, W, H, S } = v;
  const w = W * S;
  const h = H * S;
  g.save();
  // Même main que la carte de nature : palette désaturée d'un quart, ramenée vers l'ocre.
  g.globalCompositeOperation = "saturation";
  g.fillStyle = "rgba(128,128,128,.25)";
  g.fillRect(0, 0, w, h);
  // voile sépia et bords assombris en une seule passe : les deux multiplications composées d'avance
  // (sépia #c8a470 à 20 %, puis brun #785c3c à 25 % vers les bords)
  g.globalCompositeOperation = "multiply";
  const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.5);
  grad.addColorStop(0, "rgb(244,237,226)");
  grad.addColorStop(0.55, "rgb(226,216,202)");
  grad.addColorStop(1, "rgb(188,172,154)");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.restore();
  // grain : une tuile de bruit à graine, posée en quinconce et retournée pour ne pas se répéter
  const T0 = 256;
  const tile = canvas(T0, T0);
  const tg = tile.getContext("2d")!;
  const img = tg.createImageData(T0, T0);
  for (let y = 0; y < T0; y++)
    for (let x = 0; x < T0; x++) {
      const i = (y * T0 + x) * 4;
      const n = Math.round(128 + (hash(x, y, v.seed + 17) - 0.5) * 255);
      img.data[i] = n;
      img.data[i + 1] = n;
      img.data[i + 2] = n;
      img.data[i + 3] = 255;
    }
  tg.putImageData(img, 0, 0);
  g.save();
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.06;
  for (let ty = 0, row = 0; ty < h; ty += T0, row++)
    for (let tx = -((row * 97) % T0), col = 0; tx < w; tx += T0, col++) {
      g.save();
      g.translate(tx + (col % 2 ? T0 : 0), ty + (row % 2 ? T0 : 0));
      g.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1);
      g.drawImage(tile, 0, 0);
      g.restore();
    }
  g.restore();
}

// ——— Préparation ———

function palette(c: MapCtx): Pal {
  const th = c.theme;
  // La fantasy est poussée vers les terres et les ocres de l'aquarelle ; les autres genres gardent leurs couleurs.
  const k = c.material === "pierre" ? 1 : 0.35;
  const m = (a: string, b: string, t: number) => mixColor(a, b, t * k);
  const grass = m(mixColor(th.vegetation, th.floor, 0.3), "#7a8250", 0.45);
  const wood = m(th.door, "#6e4a2c", 0.45);
  const dirt = m(mixColor(th.road, th.floor, 0.25), "#9c7a4c", 0.3);
  const roofBase = mixColor(th.wall, th.door, 0.35);
  const pal: Pal = {
    grass,
    grassDry: m(grass, "#b39b5c", 0.55),
    grassLush: m(grass, "#46664c", 0.5),
    dirt,
    mud: mixColor(dirt, "#2e2014", 0.4),
    cobble: m(mixColor(th.floor, th.wall, 0.3), "#8d877a", 0.55),
    wood,
    woodDark: mixColor(wood, "#1c120a", 0.45),
    woodLight: mixColor(wood, "#e0c497", 0.4),
    plank: m(mixColor(th.floor, wood, 0.4), "#a07a50", 0.3),
    flag: m(th.floor, "#a29d90", 0.5),
    stone: m(mixColor(th.wall, th.floor, 0.35), "#8f887c", 0.5),
    daub: m(mixColor(th.floor, "#ffffff", 0.15), "#ddcca2", 0.5),
    timber: mixColor(th.wall, "#24170e", 0.45),
    metal: mixColor(th.wall, "#7c848a", 0.5),
    straw: m(mixColor(th.road, "#ffffff", 0.2), "#c9a95e", 0.6),
    water: th.water,
    leaves: [m(th.vegetation, "#3f5a2e", 0.35), m(th.vegetation, "#6f7c3c", 0.4), m(th.vegetation, "#47685a", 0.4), m(th.vegetation, "#566b30", 0.3)],
    cloth: [m(th.door, "#8e3b2a", 0.6), m(th.water, "#3f5f7a", 0.5), m(th.vegetation, "#5d6b3a", 0.4), "#c8b48a", m(th.door, "#7a5a8a", 0.5)],
    roof: {
      chaume: m(mixColor(th.road, th.floor, 0.3), "#b8995a", 0.65),
      tuiles: m(roofBase, "#9a5236", 0.75),
      ardoise: m(th.wall, "#4f5960", 0.7),
      bardeaux: mixColor(roofBase, "#7a5638", 0.4),
      plaques: mixColor(th.wall, "#6c7680", 0.35),
      tole: mixColor(th.wall, "#8a6c4c", 0.4),
    },
  };
  // Science-fiction : le thème est très sombre ; on remonte la valeur du sol et du pavé pour garder le contraste
  // avec les toits et les pions (béton clair, herbe rase grisée).
  if (c.material === "metal") {
    pal.grass = mixColor(pal.grass, "#7e8c78", 0.35);
    pal.grassDry = mixColor(pal.grassDry, "#a4a48c", 0.35);
    pal.grassLush = mixColor(pal.grassLush, "#5e7262", 0.25);
    pal.dirt = mixColor(pal.dirt, "#a6a49c", 0.4);
    pal.mud = mixColor(pal.dirt, "#3a3832", 0.4);
    pal.cobble = mixColor(pal.cobble, "#bcbeb8", 0.55);
    pal.metal = mixColor(pal.metal, "#a8b0b4", 0.25);
    pal.roof.plaques = mixColor(pal.roof.plaques, "#9aa2a6", 0.3);
  }
  return pal;
}

/** Caractère des bâtiments selon leur nom (matière « pierre », c'est-à-dire la fantasy). */
const LABELS: Record<string, { wall: WallStyle; roof: RoofStyle; floor: FloorStyle }> = {
  Auberge: { wall: "colombage", roof: "tuiles", floor: "planches" },
  Forge: { wall: "pierre", roof: "ardoise", floor: "terre" },
  Temple: { wall: "pierre", roof: "ardoise", floor: "dalles" },
  Marché: { wall: "colombage", roof: "tuiles", floor: "dalles" },
  "Maison du chef": { wall: "pierre", roof: "tuiles", floor: "planches" },
  Écurie: { wall: "colombage", roof: "chaume", floor: "terre" },
  Échoppe: { wall: "colombage", roof: "tuiles", floor: "planches" },
  Moulin: { wall: "pierre", roof: "chaume", floor: "dalles" },
  Herboriste: { wall: "colombage", roof: "chaume", floor: "planches" },
  Caserne: { wall: "pierre", roof: "ardoise", floor: "planches" },
  Boulangerie: { wall: "pierre", roof: "tuiles", floor: "dalles" },
  Tonnellerie: { wall: "colombage", roof: "tuiles", floor: "terre" },
  Grange: { wall: "planches", roof: "chaume", floor: "terre" },
  Tannerie: { wall: "colombage", roof: "chaume", floor: "terre" },
};

function setup(c: MapCtx): V {
  const { map, W, H, S, g } = c;
  const tile = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? undefined : map.tiles[y * W + x]);
  const v: V = {
    c,
    g,
    map,
    W,
    H,
    S,
    seed: map.seed,
    pal: palette(c),
    tile,
    indoor: indoorOf(map),
    used: new Uint8Array(W * H),
    buildings: [],
    looseWalls: [],
    warp: roadWarpOf(map, S),
    fence: new Uint8Array(W * H),
    yards: [],
    blocks: [],
    flavor: flavorOf(c),
  };
  const owned = new Int16Array(W * H).fill(-1);
  map.rooms.forEach((room, i) => {
    const x0 = room.x;
    const y0 = room.y;
    const x1 = room.x + room.w - 1;
    const y1 = room.y + room.h - 1;
    if (room.w < 3 || room.h < 3 || x0 < 0 || y0 < 0 || x1 >= W || y1 >= H) return;
    const doors: Door[] = [];
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const ring = x === x0 || x === x1 || y === y0 || y === y1;
        const t = tile(x, y);
        if (ring && t !== T.mur && t !== T.porte) return;
        if (ring && t === T.porte) {
          const corner = (x === x0 || x === x1) && (y === y0 || y === y1);
          if (corner) return;
          doors.push({ x, y, side: y === y0 ? "N" : y === y1 ? "S" : x === x0 ? "W" : "E" });
        }
      }
    const r = rng(map.seed, 500 + i);
    const label = room.label ?? "";
    const known = LABELS[label] ?? { wall: pick(r, ["pierre", "colombage"] as const), roof: pick(r, ["chaume", "tuiles"] as const), floor: "planches" as const };
    let { wall, roof, floor } = known;
    if (c.material === "metal") {
      wall = "metal";
      roof = "plaques";
      floor = "plaques";
    } else if (c.material === "planches") {
      wall = "planches";
      roof = r() < 0.7 ? "bardeaux" : "tuiles";
    } else if (c.material === "terre") {
      wall = "pise";
      roof = r() < 0.65 ? "tole" : "chaume";
    }
    const b: Building = {
      label,
      x0,
      y0,
      x1,
      y1,
      doors,
      wall,
      roof,
      floor,
      t: wall === "pierre" ? 17 : wall === "pise" ? 16 : wall === "colombage" ? 14 : 12,
      eaves: new Set(),
      windows: [],
      chimney: null,
    };
    // Rebord de toit en avancée sur les quatre côtés.
    for (const side of ["N", "S", "W", "E"] as Side[]) b.eaves.add(side);
    // Fenêtres : une ou deux par façade, jamais à côté d'une porte.
    for (const side of ["N", "S", "W", "E"] as Side[]) {
      // jamais à côté d'une porte, ni dans un mur contre lequel s'appuie un appentis
      const [ox, oy] = side === "N" ? [0, -1] : side === "S" ? [0, 1] : side === "W" ? [-1, 0] : [1, 0];
      const cells = sideCells(b, side).filter((p) => !doors.some((d) => Math.abs(d.x - p[0]) + Math.abs(d.y - p[1]) <= 1) && tile(p[0] + ox, p[1] + oy) !== T.mur);
      if (!cells.length) continue;
      const n = cells.length >= 4 && r() < 0.5 ? 2 : r() < 0.75 ? 1 : 0;
      for (let k = 0; k < n; k++) {
        const p = cells[Math.floor(((k + 0.5 + (r() - 0.5) * 0.6) / n) * cells.length) % cells.length];
        if (!b.windows.some((w) => w.x === p[0] && w.y === p[1])) b.windows.push({ x: p[0], y: p[1], side });
      }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) owned[y * W + x] = v.buildings.length;
    v.buildings.push(b);
  });
  for (let i = 0; i < W * H; i++) if (map.tiles[i] === T.mur && owned[i] < 0) v.looseWalls.push(i);
  planBlocks(v, owned);
  return v;
}

/** Cases d'intérieur : celles qu'on n'atteint pas depuis le bord sans franchir un mur ou une porte. */
function indoorOf(map: GameMap): Uint8Array {
  const { width: W, height: H, tiles } = map;
  const out = new Uint8Array(W * H);
  const stack: number[] = [];
  const pass = (i: number) => tiles[i] !== T.mur && tiles[i] !== T.porte && tiles[i] !== T.vide;
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (out[i] || !pass(i)) continue;
    out[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  const indoor = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) indoor[i] = !out[i] && tiles[i] !== T.mur && tiles[i] !== T.vide ? 1 : 0;
  return indoor;
}

/** Cases de mur d'une façade, coins exclus, qui donnent sur l'intérieur. */
function sideCells(b: Building, side: Side): Pt[] {
  const out: Pt[] = [];
  if (side === "N" || side === "S") for (let x = b.x0 + 1; x < b.x1; x++) out.push([x, side === "N" ? b.y0 : b.y1]);
  else for (let y = b.y0 + 1; y < b.y1; y++) out.push([side === "W" ? b.x0 : b.x1, y]);
  return out;
}

const isOutdoorGround = (v: V, x: number, y: number) => v.tile(x, y) === T.sol && !v.indoor[y * v.W + x];

/** Case libre pour un décor d'extérieur : sol nu, pas déjà prise, loin des portes. */
function freeCell(v: V, x: number, y: number): boolean {
  if (!isOutdoorGround(v, x, y) || v.used[y * v.W + x]) return false;
  for (const b of v.buildings)
    for (const d of b.doors) {
      const [ox, oy] = outward(d);
      if (Math.max(Math.abs(x - ox), Math.abs(y - oy)) <= 1) return false;
    }
  return true;
}

/** Case juste devant une porte, côté rue. */
function outward(d: Door): Pt {
  return d.side === "N" ? [d.x, d.y - 1] : d.side === "S" ? [d.x, d.y + 1] : d.side === "W" ? [d.x - 1, d.y] : [d.x + 1, d.y];
}

// ——— Petits outils de dessin ———

/**
 * Hachures à la plume dans une forme, comme `hatch` de mapInk mais tracées d'un seul geste : tous les tirets
 * dans deux chemins (deux épaisseurs de plume), une découpe et deux traits en tout. Dix fois plus rapide sur
 * les grandes ombres, et le dessin est le même (tirets de longueur variable, petits sauts de plume, courbure).
 */
function hatchLines(g: CanvasRenderingContext2D, area: Shape, r: Rng, o: { angle?: number; spacing?: number; width?: number; color?: string; cross?: boolean } = {}) {
  const { angle = -Math.PI / 4, spacing = 5, width = 0.9, color = INK, cross = false } = o;
  const [bx, by, bw, bh] = area.box;
  if (bw <= 0 || bh <= 0) return;
  const thin = new Path2D();
  const thick = new Path2D();
  const diag = Math.hypot(bw, bh);
  const mx = bx + bw / 2;
  const my = by + bh / 2;
  for (const a of cross ? [angle, angle + (Math.PI * 7) / 18] : [angle]) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let d = -diag / 2; d <= diag / 2; d += spacing * (0.8 + r() * 0.4)) {
      let s = -diag / 2 - r() * 20;
      while (s < diag / 2) {
        const len = 18 + r() * 60;
        const gap = r() < 0.7 ? 1 + r() * 3 : 6 + r() * 10;
        const px = mx - sa * d + ca * s;
        const py = my + ca * d + sa * s;
        const p = r() < 0.5 ? thin : thick;
        p.moveTo(px, py);
        p.quadraticCurveTo(px + (ca * len) / 2 + (r() - 0.5) * 1.6, py + (sa * len) / 2 + (r() - 0.5) * 1.6, px + ca * len, py + sa * len);
        s += len + gap;
      }
    }
  }
  g.save();
  g.clip(area.path, "evenodd");
  g.strokeStyle = color;
  g.lineCap = "round";
  g.lineWidth = width * 0.8;
  g.stroke(thin);
  g.lineWidth = width * 1.2;
  g.stroke(thick);
  g.restore();
}

/**
 * Lavis rapide pour une grande forme (la chaussée) : aplat découpé, taches de pigment peintes en quart de résolution
 * sans découpe puis posées d'un coup, grain en un seul chemin, liseré plus sombre au bord.
 */
function washLarge(g: CanvasRenderingContext2D, sh: Shape, color: string, r: Rng, o: { alpha: number; edge: number; variation: number; blot: number; granulation: number }) {
  const [bx, by, bw, bh] = sh.box;
  const q = 4;
  const lw = Math.ceil(bw / q) + 2;
  const lh = Math.ceil(bh / q) + 2;
  const cv = canvas(lw, lh);
  const c = cv.getContext("2d")!;
  const n = Math.ceil((bw * bh) / (o.blot * o.blot)) + 1;
  for (let i = 0; i < n; i++) {
    const x = r() * bw;
    const y = r() * bh;
    const rad = o.blot * (0.5 + r() * 1.1);
    const dark = r() < 0.55;
    const k = o.variation * (0.08 + r() * 0.1);
    const grad = c.createRadialGradient(x / q, y / q, 0, x / q, y / q, rad / q);
    grad.addColorStop(0, dark ? tint(color, -0.18, k * 2) : tint(color, 0.16, k * 1.6));
    grad.addColorStop(1, tint(color, 0, 0));
    c.fillStyle = grad;
    c.fillRect((x - rad) / q, (y - rad) / q, (rad * 2) / q, (rad * 2) / q);
  }
  g.save();
  g.clip(sh.path, "evenodd");
  g.fillStyle = tint(color, 0, o.alpha);
  g.fillRect(bx, by, bw, bh);
  g.imageSmoothingEnabled = true;
  g.drawImage(cv, bx, by, lw * q, lh * q);
  const grains = new Path2D();
  const ng = Math.round(((bw * bh) / 70) * o.granulation);
  for (let i = 0; i < ng; i++) grains.rect(bx + r() * bw, by + r() * bh, 1 + r(), 1 + r());
  g.fillStyle = tint(color, -0.25, 0.22);
  g.fill(grains);
  g.lineJoin = "round";
  if (o.edge > 0)
    for (const [w, a] of [[o.edge * 2, 0.1], [o.edge, 0.14], [2.2, 0.38]] as const) {
      g.strokeStyle = tint(color, -0.3, a);
      g.lineWidth = w;
      g.stroke(sh.path);
    }
  g.restore();
}

function rectPts(x: number, y: number, w: number, h: number): Pt[] {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function pathOf(pts: Pt[]): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

/** Objet plein : petite ombre portée, couleur, contour d'encre tremblé. */
function solid(g: CanvasRenderingContext2D, pts: Pt[], fill: string, r: Rng, o: { ink?: number; shadow?: number; light?: boolean } = {}) {
  const { ink = 1.3, shadow = 3, light = true } = o;
  const p = pathOf(pts);
  if (shadow > 0) {
    g.save();
    g.translate(shadow * 0.8, shadow);
    g.fillStyle = "rgba(18,12,6,.42)";
    g.fill(p);
    g.restore();
  }
  g.fillStyle = fill;
  g.fill(p);
  if (light && fill.startsWith("#")) {
    // modelé : lumière en haut à gauche, ombre propre en bas à droite
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, tint(fill, 0.1, 0.5));
    grad.addColorStop(0.55, tint(fill, 0, 0));
    grad.addColorStop(1, tint(fill, -0.14, 0.6));
    g.fillStyle = grad;
    g.fill(p);
  }
  if (ink > 0) inkPolyline(g, pts, r, { width: ink, closed: true, wobble: 0.5, pressure: 0.5 });
}

function disc(g: CanvasRenderingContext2D, cx: number, cy: number, rad: number, fill: string, r: Rng, o: { ink?: number; shadow?: number; light?: boolean } = {}) {
  const pts: Pt[] = [];
  const n = Math.max(10, Math.round(rad * 1.6));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  solid(g, pts, fill, r, o);
}

/** Halo chaud d'un foyer ou d'une flamme, ajouté à la lumière (lighter). */
function glow(g: CanvasRenderingContext2D, x: number, y: number, rad: number, a = 0.32) {
  const grad = g.createRadialGradient(x, y, 0, x, y, rad);
  grad.addColorStop(0, `rgba(255,170,80,${a * 0.6})`);
  grad.addColorStop(0.45, `rgba(220,110,40,${a * 0.22})`);
  grad.addColorStop(1, "rgba(200,90,30,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grad;
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
}

function flame(g: CanvasRenderingContext2D, x: number, y: number, rad = 1.6) {
  g.fillStyle = "#ffe7a8";
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
}

/** Lignes fines à la plume, toutes dans un seul tracé. */
function strokes(g: CanvasRenderingContext2D, color: string, width: number, draw: (p: CanvasRenderingContext2D) => void) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = "round";
  g.beginPath();
  draw(g);
  g.stroke();
}

/** Dessine dans un repère tourné : x le long du côté, y vers l'intérieur (ou vers l'extérieur pour les objets dehors). */
function inFrame(g: CanvasRenderingContext2D, ox: number, oy: number, side: Side, fn: () => void) {
  g.save();
  g.translate(ox, oy);
  g.rotate(side === "N" ? 0 : side === "S" ? Math.PI : side === "W" ? -Math.PI / 2 : Math.PI / 2);
  fn();
  g.restore();
}

// ——— Sol : herbe, champs, rues ———

function paintGround(v: V) {
  const { g, W, H, S, pal } = v;
  const Wp = W * S;
  const Hp = H * S;
  const r = rng(v.seed, 1);
  // Couches de pigment à basse fréquence, sans bord : terre ocre et mousse sombre posées en multiply,
  // herbe jaunie par-dessus, terre battue là où l'on passe. Toutes composées d'un coup en petit (1 px pour 12)
  // sur la couleur de l'herbe, puis agrandies en une seule fois : le lavis reste doux, et c'est quatre fois plus rapide.
  const k = 12;
  const lw = Math.ceil(Wp / k);
  const lh = Math.ceil(Hp / k);
  const wear = wearField(v);
  const wearAt = (fx: number, fy: number) => {
    const x = Math.max(0, Math.min(W - 1.001, fx - 0.5));
    const y = Math.max(0, Math.min(H - 1.001, fy - 0.5));
    const i = Math.floor(x);
    const j = Math.floor(y);
    const tx = x - i;
    const ty = y - j;
    const at = (a: number, b: number) => wear[Math.min(H - 1, b) * W + Math.min(W - 1, a)];
    return (at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - ty) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * ty;
  };
  const rgb = (col: string) => [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
  const ochre = mixColor(pal.dirt, "#c49a5c", 0.5);
  const moss = mixColor(pal.grassLush, "#3c4a2c", 0.45);
  const layers: { seed: number; scale: number; from: number; to: number; col: number[]; max: number; multiply: boolean; worn: boolean }[] = [
    { seed: 31, scale: 7, from: -0.05, to: 0.55, col: rgb(ochre), max: 0.38, multiply: true, worn: false },
    { seed: 37, scale: 4, from: 0.05, to: 0.7, col: rgb(moss), max: 0.3, multiply: true, worn: false },
    { seed: 43, scale: 9, from: 0.1, to: 0.65, col: rgb(mixColor(pal.grassDry, "#d6c27e", 0.4)), max: 0.3, multiply: false, worn: false },
    { seed: 47, scale: 2.2, from: 0.05, to: 0.6, col: rgb(mixColor(pal.dirt, pal.grassDry, 0.35)), max: 0.62, multiply: false, worn: true },
    { seed: 53, scale: 1.3, from: 0.35, to: 0.8, col: rgb(mixColor(pal.dirt, pal.mud, 0.3)), max: 0.5, multiply: false, worn: true },
  ];
  const noises = layers.map((l) => [noise2(v.seed + l.seed), noise2(v.seed + l.seed + 1)]);
  const base = rgb(pal.grass);
  const cv = canvas(lw, lh);
  const cx2 = cv.getContext("2d")!;
  const img = cx2.createImageData(lw, lh);
  for (let y = 0; y < lh; y++)
    for (let x = 0; x < lw; x++) {
      const px = (x * k) / S;
      const py = (y * k) / S;
      let [cr, cg, cb] = base;
      const wv = wearAt(px, py);
      layers.forEach((l, li) => {
        const [n1, n2] = noises[li];
        if (l.worn && wv <= 0) return;
        let n = n1(px / l.scale, py / l.scale) * 0.7 + n2(px / (l.scale * 0.35), py / (l.scale * 0.35)) * 0.3;
        if (l.worn) n = wv * 1.25 - 0.45 + n * 0.55;
        const t = Math.max(0, Math.min(1, (n - l.from) / (l.to - l.from)));
        const a = t * t * (3 - 2 * t) * l.max;
        if (a <= 0) return;
        if (l.multiply) {
          cr *= 1 - a + (a * l.col[0]) / 255;
          cg *= 1 - a + (a * l.col[1]) / 255;
          cb *= 1 - a + (a * l.col[2]) / 255;
        } else {
          cr += (l.col[0] - cr) * a;
          cg += (l.col[1] - cg) * a;
          cb += (l.col[2] - cb) * a;
        }
      });
      const i = (y * lw + x) * 4;
      img.data[i] = cr;
      img.data[i + 1] = cg;
      img.data[i + 2] = cb;
      img.data[i + 3] = 255;
    }
  cx2.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "low";
  g.drawImage(cv, 0, 0, lw * k, lh * k);
  g.restore();
  // Lavis par-dessus, à peine modulé : le pigment se dépose un peu inégalement.
  washLarge(g, rectShape(0, 0, Wp, Hp), pal.grass, r, { alpha: 0.2, edge: 0, variation: 0.35, blot: 110, granulation: 0.25 });
  // Sous les bosquets, l'herbe est plus sombre et plus grasse.
  const veg = (x: number, y: number) => v.tile(x, y) === T.vegetation;
  const loops = cellContour(veg, W, H, S, { round: 2, jitter: 8, smooth: 2, seed: v.seed + 13 });
  if (loops.length) {
    const vp = shapeOf(loops).path;
    g.save();
    g.globalCompositeOperation = "multiply";
    g.fillStyle = tint(moss, 0.1, 0.35);
    g.fill(vp, "evenodd");
    g.restore();
  }
  // Creux du terrain : hachures parallèles à 45°, légères, là où la mousse est la plus dense.
  const nz = noise2(v.seed + 37);
  const hollow = (x: number, y: number) => {
    if (!isOutdoorGround(v, x, y)) return false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (v.tile(x + dx, y + dy) === T.route || v.tile(x + dx, y + dy) === T.mur) return false;
    return nz((x + 0.5) / 5, (y + 0.5) / 5) > 0.42;
  };
  for (const loop of cellContour(hollow, W, H, S, { round: 3, jitter: 10, smooth: 3, seed: v.seed + 38 })) {
    const sh = shapeOf(loop);
    if (sh.box[2] * sh.box[3] < S * S * 1.5) continue;
    hatchLines(g, sh, r, { spacing: 4.2, width: 0.6, color: tint(moss, -0.45, 0.32), angle: -Math.PI / 4 });
  }
}

/**
 * Usure du sol, par case : forte au bord de la place (on y piétine), devant les portes et à l'entrée des cours,
 * moyenne le long des rues, nulle ailleurs.
 */
function wearField(v: V): Float32Array {
  if (v.wear) return v.wear;
  const { W, H } = v;
  const out = new Float32Array(W * H);
  const road = (x: number, y: number) => v.tile(x, y) === T.route || v.tile(x, y) === T.eau;
  // place : case de rue dont les environs (5 × 5) sont presque tout en rue
  const plaza = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!road(x, y)) continue;
      let n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (road(x + dx, y + dy)) n++;
      if (n >= 19) plaza[y * W + x] = 1;
    }
  const bump = (x: number, y: number, val: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (val > out[i]) out[i] = val;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const near = plaza[i] ? 3 : road(x, y) ? 1 : 0;
      if (!near) continue;
      for (let dy = -near; dy <= near; dy++)
        for (let dx = -near; dx <= near; dx++) {
          const d = Math.hypot(dx, dy);
          bump(x + dx, y + dy, plaza[i] ? Math.max(0, 1 - d / 3.4) : Math.max(0, 0.55 - d * 0.3));
        }
    }
  for (const b of v.buildings)
    for (const d of b.doors) {
      const [ox, oy] = outward(d);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) bump(ox + dx, oy + dy, Math.max(0, 1 - Math.hypot(dx, dy) / 2.6));
    }
  // devant les logis fermés aussi : on y entre et on en sort, même si la partie ne le montre pas
  for (const d of blockDoors(v)) {
    const [ox, oy] = outward(d);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) bump(ox + dx, oy + dy, Math.max(0, 0.75 - Math.hypot(dx, dy) / 2.2));
  }
  for (let i = 0; i < W * H; i++) if (v.tile(i % W, Math.floor(i / W)) === T.mur || v.indoor[i]) out[i] = 0;
  v.wear = out;
  return out;
}

/**
 * Seuil des logis fermés : le milieu de la façade côté rue (une case de mur, pas une porte de jeu).
 * Sert aux sentiers et à l'usure de l'herbe ; rien n'y est dessiné qui ressemble à une porte.
 */
function blockDoors(v: V): Door[] {
  const out: Door[] = [];
  for (const bk of v.blocks) {
    if (bk.kind !== "maison") continue;
    const m = bk.rects[0];
    const s = bk.front;
    const x = s === "N" || s === "S" ? Math.floor((m.x0 + m.x1 + 1) / 2) : s === "W" ? m.x0 : m.x1;
    const y = s === "W" || s === "E" ? Math.floor((m.y0 + m.y1 + 1) / 2) : s === "N" ? m.y0 : m.y1;
    const [ox, oy] = outward({ x, y, side: s });
    const t = v.tile(ox, oy);
    if (t === T.sol || t === T.vegetation || t === T.route) out.push({ x, y, side: s });
  }
  return out;
}

/**
 * Porte des logis couverts : on ne la voit pas sous le toit, mais son auvent de planches dépasse sur la rue,
 * avec son ombre, et une marche de pierre usée devant. Purement décoratif : la case reste un mur.
 */
function paintBlockDoors(v: V) {
  const { g, S, pal } = v;
  blockDoors(v).forEach((d, k) => {
    const r = rng(v.seed, 7900 + k);
    // repère local : x le long du mur (0 à S), y vers l'extérieur (0 sur la face du mur)
    const [ox, oy, cos, sin] =
      d.side === "S" ? [d.x * S, (d.y + 1) * S, 1, 0] : d.side === "N" ? [(d.x + 1) * S, d.y * S, -1, 0] : d.side === "W" ? [d.x * S, d.y * S, 0, 1] : [(d.x + 1) * S, (d.y + 1) * S, 0, -1];
    const W = (x: number, y: number): Pt => (d.side === "S" || d.side === "N" ? [ox + cos * x, oy + cos * y] : [ox - sin * y, oy + sin * x]);
    const at = (pts: [number, number][]) => pts.map(([x, y]) => W(x, y));
    // éventail de terre battue : le seuil qu'on piétine, une case et quart vers la rue, plus foncé au pied de la marche
    const [fx, fy] = W(S * 0.5, S * 0.3);
    const [ex, ey] = W(S * 0.5, S * 1.4);
    const fan = g.createRadialGradient(fx, fy, 2, fx, fy, S * 1.15);
    fan.addColorStop(0, tint(pal.mud, 0.05, 0.5));
    fan.addColorStop(0.55, tint(pal.dirt, -0.05, 0.32));
    fan.addColorStop(1, tint(pal.dirt, 0, 0));
    g.fillStyle = fan;
    g.beginPath();
    g.moveTo(...W(S * 0.1, 4));
    g.quadraticCurveTo(...W(-S * 0.35, S * 0.9), ex + (ex - fx) * 0.05, ey + (ey - fy) * 0.05);
    g.quadraticCurveTo(...W(S * 1.35, S * 0.9), ...W(S * 0.9, 4));
    g.closePath();
    g.fill();
    // l'embrasure, dans l'ombre du rebord : un trait noir franc de la largeur de la porte
    const sill = at([[S * 0.2, -1], [S * 0.8, -1], [S * 0.8, 6], [S * 0.2, 6]]);
    g.fillStyle = "#140d07";
    g.fill(pathOf(sill));
    // marche de pierre posée au sol, arête claire côté lumière
    const step = at([[S * 0.16, 6], [S * 0.84, 6], [S * 0.81, S * 0.4], [S * 0.19, S * 0.42]]);
    solid(g, smoothPoints(step, 1), tint(pal.stone, 0.12 + (r() - 0.5) * 0.1), r, { ink: 1.3, shadow: 4 });
    const e0 = W(S * 0.22, S * 0.38);
    const e1 = W(S * 0.78, S * 0.37);
    inkLine(g, e0[0], e0[1], e1[0], e1[1], r, { width: 0.6, color: "rgba(22,16,10,.5)", taper: 2 });
    // battant ouvert vers la rue (0,6 case), ferré, avec son ombre : on ne peut pas le prendre pour une caisse
    const hinge = r() < 0.5;
    const hx = hinge ? S * 0.2 : S * 0.8;
    const ang = 1.0 + r() * 0.4;
    const len = S * 0.6;
    const [dx, dy] = [(hinge ? 1 : -1) * Math.cos(ang), Math.sin(ang)];
    /** Point du battant : u le long depuis le gond, w dans son épaisseur. */
    const leafAt = (u: number, w: number): Pt => W(hx + dx * u - dy * w * (hinge ? 1 : -1), 6 + dy * u + Math.abs(dx) * w);
    const leaf = [leafAt(0, 0), leafAt(len, 0), leafAt(len, 6), leafAt(0, 6)];
    g.save();
    g.translate(5, 6);
    g.fillStyle = SHADOW;
    g.fill(pathOf(leaf));
    g.restore();
    const doorCol = mixColor(v.c.theme.door, pal.woodLight, 0.2);
    solid(g, leaf, doorCol, r, { ink: 1.4, shadow: 0 });
    const [s0, s1] = [leafAt(len * 0.25, 0), leafAt(len * 0.25, 6)];
    const [t0, t1] = [leafAt(len * 0.78, 0), leafAt(len * 0.78, 6)];
    strokes(g, "rgba(14,10,6,.85)", 1.1, (p) => {
      p.moveTo(...s0);
      p.lineTo(...s1);
      p.moveTo(...t0);
      p.lineTo(...t1);
    });
  });
}

/** Sentiers de terre tassée de chaque porte à la rue la plus proche (le chemin le plus court sur les cases praticables). */
function paintPaths(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 8);
  const pass = (x: number, y: number) => {
    const t = v.tile(x, y);
    return (t === T.sol || t === T.vegetation || t === T.route) && !v.indoor[y * W + x];
  };
  const routes: Pt[][] = [];
  const wig = noise2(v.seed + 81);
  for (const d of [...v.buildings.flatMap((b) => b.doors), ...blockDoors(v)]) {
    const [sx, sy] = outward(d);
    if (!pass(sx, sy)) continue;
    // parcours en largeur, limité à 14 cases
    const prev = new Int32Array(W * H).fill(-1);
    const dist = new Uint8Array(W * H);
    const q = [sy * W + sx];
    prev[q[0]] = q[0];
    let end = -1;
    for (let k = 0; k < q.length && end < 0; k++) {
      const i = q[k];
      if (v.tile(i % W, Math.floor(i / W)) === T.route) {
        end = i;
        break;
      }
      if (dist[i] >= 14) continue;
      const x = i % W;
      const y = Math.floor(i / W);
      // on préfère s'éloigner d'abord tout droit de la porte
      const dirs: Pt[] =
        d.side === "N"
          ? [[0, -1], [-1, 0], [1, 0], [0, 1]]
          : d.side === "S" ? [[0, 1], [-1, 0], [1, 0], [0, -1]] : d.side === "W" ? [[-1, 0], [0, -1], [0, 1], [1, 0]] : [[1, 0], [0, -1], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !pass(nx, ny)) continue;
        const j = ny * W + nx;
        if (prev[j] >= 0) continue;
        prev[j] = i;
        dist[j] = dist[i] + 1;
        q.push(j);
      }
    }
    if (end < 0) continue;
    const cells: number[] = [];
    for (let i = end; ; i = prev[i]) {
      cells.push(i);
      if (prev[i] === i) break;
    }
    cells.reverse();
    for (const i of cells) if (v.tile(i % W, Math.floor(i / W)) !== T.route) v.used[i] = 1;
    // de la porte (bord de la façade) jusque dans la rue, en courbe lissée
    const door: Pt = d.side === "N" ? [(d.x + 0.5) * S, d.y * S] : d.side === "S" ? [(d.x + 0.5) * S, (d.y + 1) * S] : d.side === "W" ? [d.x * S, (d.y + 0.5) * S] : [(d.x + 1) * S, (d.y + 0.5) * S];
    // quelques points de passage seulement (un sur trois), poussés de côté : le sentier serpente
    const keyCells = cells.filter((_, k) => k === 0 || k === cells.length - 1 || k % 3 === 0);
    const pts: Pt[] = [
      door,
      ...keyCells.map((i, k) => {
        const lat = k === 0 ? 0.1 : 0.42;
        const cx = i % W;
        const cy = Math.floor(i / W);
        return [(cx + 0.5 + wig(cx / 3, cy / 3) * lat) * S, (cy + 0.5 + wig(cy / 3 + 7, cx / 3) * lat) * S] as Pt;
      }),
    ];
    const last = pts[pts.length - 1];
    const before = pts[pts.length - 2];
    pts.push([last[0] + (last[0] - before[0]) * 0.6, last[1] + (last[1] - before[1]) * 0.6]);
    // le bout du sentier rejoint la rue là où elle est dessinée (elle serpente)
    const sm = smoothPoints(pts, 4, false);
    routes.push(
      sm.map((p, k) => {
        const w = v.warp(p);
        const t = k / (sm.length - 1);
        return [p[0] + (w[0] - p[0]) * t, p[1] + (w[1] - p[1]) * t] as Pt;
      }),
    );
  }
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  const stroke = (pts: Pt[], w: number, col: string, jit: number) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    pts.forEach(([x, y], k) => {
      const ox = (r() - 0.5) * jit;
      const oy = (r() - 0.5) * jit;
      if (k) g.lineTo(x + ox, y + oy);
      else g.moveTo(x, y);
    });
    g.stroke();
  };
  // sentier foulé : herbe usée sur les bords, terre au milieu, plus étroit qu'une rue
  for (const pts of routes) stroke(pts, S * 0.8, tint(mixColor(pal.dirt, pal.grassDry, 0.5), 0, 0.3), 5);
  for (const pts of routes) stroke(pts, S * 0.5, tint(pal.dirt, 0, 0.72), 6);
  for (const pts of routes) stroke(pts, S * 0.16, tint(pal.mud, 0, 0.16), 4);
  g.restore();
  // bords mordus par l'herbe : touffes et petits traits d'encre interrompus
  for (const pts of routes) {
    for (const side of [-1, 1]) {
      const edge: Pt[] = [];
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1];
        const [bx, by] = pts[k];
        const l = Math.hypot(bx - ax, by - ay) || 1;
        edge.push([bx + (-(by - ay) / l) * side * S * 0.27 + (r() - 0.5) * 3, by + ((bx - ax) / l) * side * S * 0.27 + (r() - 0.5) * 2]);
      }
      let run: Pt[] = [];
      for (const p of edge) {
        run.push(p);
        if (run.length > 3 && r() < 0.18) {
          inkPolyline(g, run, r, { width: 0.8, color: INK_SOFT, wobble: 0.8, taper: 6 });
          run = [];
        }
      }
      if (run.length > 1) inkPolyline(g, run, r, { width: 0.8, color: INK_SOFT, wobble: 0.8, taper: 6 });
      strokes(g, tint(pal.grassLush, -0.25, 0.75), 0.75, (p) => {
        for (const [x, y] of edge) if (r() < 0.3) tuft(p, x + (r() - 0.5) * 4, y + (r() - 0.5) * 4, 4 + r() * 3, r);
      });
    }
  }
}

/** Champs labourés ou blés dans les grands espaces vides, loin des maisons et des rues. */
function paintFields(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 2);
  const clearOf = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const t = v.tile(x + dx, y + dy);
        if (t === T.mur || t === T.porte || t === T.route || t === T.eau) return false;
      }
    return isOutdoorGround(v, x, y) && !v.used[y * W + x];
  };
  let made = 0;
  for (let tries = 0; tries < 400 && made < 3; tries++) {
    const fw = 3 + Math.floor(r() * 3);
    const fh = 2 + Math.floor(r() * 3);
    const fx = 1 + Math.floor(r() * (W - fw - 2));
    const fy = 1 + Math.floor(r() * (H - fh - 2));
    let ok = true;
    for (let y = fy; y < fy + fh && ok; y++) for (let x = fx; x < fx + fw && ok; x++) if (!clearOf(x, y)) ok = false;
    if (!ok) continue;
    for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fw; x++) v.used[y * W + x] = 1;
    made++;
    const inside = (x: number, y: number) => x >= fx && x < fx + fw && y >= fy && y < fy + fh;
    const loops = cellContour(inside, W, H, S, { round: 1, jitter: 4, smooth: 2, seed: v.seed + 70 + made });
    // rogné de quelques px pour laisser un liseré d'herbe autour
    const sh = shapeOf(loops);
    // le genre change ce qu'on cultive : panneaux solaires, enclos de ranch, filets qui sèchent
    if (v.flavor === "sf" || v.flavor === "western" || v.flavor === "port") {
      if (v.flavor === "sf") solarField(v, sh, r);
      else if (v.flavor === "western") corral(v, sh, r);
      else netField(v, sh, r);
      if (v.flavor === "sf") inkOutline(g, loops, r, { width: 1.1, color: INK_SOFT, wobble: 1 });
      continue;
    }
    const kind = pick(r, ["labour", "ble", "chou"] as const);
    const base = kind === "labour" ? mixColor(pal.dirt, pal.mud, 0.35) : kind === "ble" ? mixColor(pal.straw, pal.grassDry, 0.3) : mixColor(pal.dirt, pal.grassLush, 0.25);
    washFill(g, sh, base, r, { alpha: 0.92, edge: 5, variation: 0.8, blot: 40, granulation: 0.8 });
    const vertical = fw < fh ? r() < 0.75 : r() < 0.25;
    g.save();
    g.clip(sh.path);
    const [bx, by, bw, bh] = sh.box;
    const step = kind === "chou" ? 12 : 7;
    for (let k = (vertical ? bx : by) + 4; k < (vertical ? bx + bw : by + bh); k += step) {
      const pts: Pt[] = [];
      for (let s = vertical ? by - 4 : bx - 4; s < (vertical ? by + bh + 8 : bx + bw + 8); s += 18) pts.push(vertical ? [k + (r() - 0.5) * 1.5, s] : [s, k + (r() - 0.5) * 1.5]);
      inkPolyline(g, pts, r, { width: kind === "ble" ? 0.7 : 1.1, color: kind === "ble" ? tint(pal.mud, 0, 0.35) : tint(pal.mud, -0.1, 0.55), wobble: 0.8, taper: 0 });
      if (kind === "ble") {
        // épis : petits traits en chevron le long du sillon
        strokes(g, tint(pal.straw, -0.35, 0.7), 0.7, (p) => {
          for (let s = vertical ? by : bx; s < (vertical ? by + bh : bx + bw); s += 2.6) {
            const o = 1.5 + r() * 4;
            const [px, py] = vertical ? [k + o, s] : [s, k + o];
            p.moveTo(px, py);
            p.lineTo(px + 1.5 + r(), py - 3 - r() * 2);
          }
        });
        strokes(g, tint(pal.straw, 0.12, 0.6), 0.6, (p) => {
          for (let s = vertical ? by : bx; s < (vertical ? by + bh : bx + bw); s += 4) {
            const o = 2 + r() * 3;
            const [px, py] = vertical ? [k + o, s] : [s, k + o];
            p.moveTo(px, py);
            p.lineTo(px - 1, py - 3);
          }
        });
      } else if (kind === "chou") {
        for (let s = (vertical ? by : bx) + 6; s < (vertical ? by + bh : bx + bw); s += 8 + r() * 9) {
          if (r() < 0.15) continue;
          const [px, py] = vertical ? [k + 6 + (r() - 0.5) * 3, s] : [s, k + 6 + (r() - 0.5) * 3];
          const rad = 2.4 + r() * 2.2;
          solid(g, smoothPoints(blobPoints(r, px, py, rad, rad, 6, 0.3), 1), pick(r, pal.leaves), r, { ink: 0.6, shadow: 1.5 });
        }
      } else {
        stipple(g, rectShape(bx, by, bw, bh), r, { density: 0.25, radius: 0.7, color: tint(pal.mud, -0.15, 0.5) });
      }
    }
    g.restore();
    inkOutline(g, loops, r, { width: 1.1, color: INK_SOFT, wobble: 1 });
    // après l'apocalypse, une carcasse de voiture rouille au bout du champ
    if (v.flavor === "ruines" && r() < 0.8) carWreck(v, bx + bw * between(r, 0.3, 0.7), by + bh * between(r, 0.3, 0.7), r() * Math.PI, r);
    // Épouvantail au milieu du blé, parfois.
    if (kind === "ble" && r() < 0.6) {
      const cx = bx + bw * between(r, 0.3, 0.7);
      const cy = by + bh * between(r, 0.3, 0.7);
      inkLine(g, cx - 9, cy, cx + 9, cy + 1, r, { width: 2, color: pal.woodDark });
      disc(g, cx, cy, 4, pal.straw, r, { ink: 1, shadow: 4 });
      disc(g, cx, cy, 2.6, mixColor(pal.woodDark, pal.straw, 0.4), r, { ink: 0.6, shadow: 0 });
    }
  }
}

function paintRoads(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 3);
  const fountain = (x: number, y: number) => v.tile(x, y) === T.eau && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => v.tile(x + dx, y + dy) === T.route);
  const road = (x: number, y: number) => v.tile(x, y) === T.route || fountain(x, y);
  if (!v.map.tiles.includes(T.route)) return;
  const warp = v.warp;
  const rawLoops = cellContour(road, W, H, S, { round: 2, jitter: 7, smooth: 2, seed: v.seed + 21 }).map((l) => densify(l, 10, true));
  const loops = rawLoops.map((l) => l.map(warp));
  const sh = shapeOf(loops);
  // Bord de terre foulée, plus sombre que l'herbe.
  g.save();
  g.lineJoin = "round";
  g.globalCompositeOperation = "multiply";
  g.strokeStyle = tint(pal.mud, 0.25, 0.3);
  g.lineWidth = 16;
  g.stroke(sh.path);
  g.restore();
  washLarge(g, sh, pal.dirt, r, { alpha: 0.96, edge: 7, variation: 0.9, blot: 90, granulation: 0.15 });

  // Place pavée : cases de rue entourées de rue, élargies d'une case.
  const core = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!road(x + dx, y + dy)) return false;
    return true;
  };
  const paved = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!road(x, y)) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (core(x + dx, y + dy)) paved[y * W + x] = 1;
    }
  // seule la place autour du puits est pavée (deux rues qui se croisent ne font pas une place)
  {
    let seed = -1;
    for (let i = 0; i < W * H && seed < 0; i++) if (paved[i] && fountain(i % W, Math.floor(i / W))) seed = i;
    const keep = new Uint8Array(W * H);
    if (seed >= 0) {
      const st = [seed];
      keep[seed] = 1;
      while (st.length) {
        const i = st.pop()!;
        const x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && paved[j] && !keep[j]) ((keep[j] = 1), st.push(j));
      }
    }
    paved.set(keep);
  }
  v.paved = paved;
  const isPaved = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && paved[y * W + x] === 1;

  // Ornières : à un peu plus d'une demi-case de chaque bord, elles suivent le contour de la rue, donc ses courbes.
  // Seulement là où la rue fait deux cases de large (pas dans les ruelles), et loin de la place.
  const roadPx = (x: number, y: number) => road(Math.floor(x / S), Math.floor(y / S));
  const nearPaved = (x: number, y: number) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (isPaved(cx + dx, cy + dy)) return true;
    return false;
  };
  const puddles = { left: 3 + Math.floor(r() * 3) };
  const hump: Pt[][] = [];
  for (const loop of rawLoops) {
    const n = loop.length;
    if (n < 8) continue;
    let seg: Pt[] = [];
    let mid: Pt[] = [];
    const flush = () => {
      if (seg.length > 4) rut(v, smoothPoints(seg, 2, false).map(warp), r, puddles);
      if (mid.length > 4) hump.push(smoothPoints(mid, 2, false).map(warp));
      seg = [];
      mid = [];
    };
    for (let i = 0; i < n; i++) {
      const [px, py] = loop[i];
      const a = loop[(i - 2 + n) % n];
      const b = loop[(i + 2) % n];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let nx = -(b[1] - a[1]) / l;
      let ny = (b[0] - a[0]) / l;
      if (!roadPx(px + nx * S * 0.4, py + ny * S * 0.4)) [nx, ny] = [-nx, -ny];
      const at = (k: number): Pt => [px + nx * S * k, py + ny * S * k];
      const ok = roadPx(...at(0.55)) && roadPx(...at(1.4)) && !roadPx(...at(2.6)) && !nearPaved(...at(0.9));
      if (!ok) {
        flush();
        continue;
      }
      seg.push(at(0.5 + noise2(v.seed + 40)(px / 90, py / 90) * 0.08));
      // dos d'âne (herbe et sabots) une seule fois par rue : depuis le bord dont la normale va vers le bas ou la droite
      if (nx + ny > 0.2) mid.push(at(0.98));
    }
    flush();
  }
  // Traces de sabots entre les ornières, herbe sur le dos d'âne.
  strokes(g, tint(pal.mud, -0.2, 0.5), 0.75, (p) => {
    for (const line of hump)
      for (let k = 1; k < line.length; k++) {
        if (r() < 0.45) continue;
        const [ax, ay] = line[k - 1];
        const [x, y] = line[k];
        const a = Math.atan2(y - ay, x - ax) + (r() < 0.5 ? 0 : Math.PI);
        const ox = x + (r() < 0.5 ? -4 : 4) * Math.sin(a);
        const oy = y + (r() < 0.5 ? -4 : 4) * Math.cos(a);
        p.moveTo(ox + Math.cos(a + 1.2) * 2.2, oy + Math.sin(a + 1.2) * 2.2);
        p.arc(ox, oy, 2.2, a + 1.2, a + Math.PI * 2 - 1.2);
      }
  });
  strokes(g, tint(pal.grassLush, -0.2, 0.55), 0.75, (p) => {
    for (const line of hump)
      for (const [x, y] of line) {
        if (r() < 0.45) continue;
        blade(p, r() < 0.6 ? 0 : 2, x + (r() - 0.5) * 5, y + (r() - 0.5) * 5, 3 + r() * 3, (r() - 0.5) * 0.6, r);
      }
  });

  // Place : les pavés suivent la grand-rue qui la traverse (rangs parallèles qui ondulent un peu), deux rangs
  // en couronne autour du puits. Le bord est mangé par la terre : pavés manquants, d'autres arrachés et renversés
  // dans la boue. Aucune bordure en chapelet.
  const pavedLoops = cellContour(isPaved, W, H, S, { round: 3, jitter: 4, smooth: 3, seed: v.seed + 27 });
  if (pavedLoops.length) {
    const ps = shapeOf(pavedLoops);
    let wx = ps.box[0] + ps.box[2] / 2;
    let wy = ps.box[1] + ps.box[3] / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fountain(x, y) && isPaved(x, y)) [wx, wy] = [(x + 0.5) * S, (y + 0.5) * S];
    // direction des rues qui arrivent : axe principal des cases de rue non pavées autour de la place
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!road(x, y) || isPaved(x, y)) continue;
        const dx = (x + 0.5) * S - wx;
        const dy = (y + 0.5) * S - wy;
        const d = Math.hypot(dx, dy);
        if (d > S * 11) continue;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
      }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    const joint = mixColor(pal.dirt, pal.mud, 0.45);
    g.save();
    g.clip(ps.path);
    g.fillStyle = tint(joint, 0, 0.92);
    g.fill(ps.path);
    const nz = noise2(v.seed + 29);
    const [bx, by, bw, bh] = ps.box;
    const reach = Math.hypot(bw, bh);
    const tones = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const light = new Path2D();
    const dark = new Path2D();
    const joints = new Path2D();
    const holes = new Path2D();
    const torn: Pt[] = [];
    const inside = (x: number, y: number) => g.isPointInPath(ps.path, x, y);
    const ring0 = S * 0.74 + 3;
    const ring1 = ring0 + 22;
    const stone = (pts: Pt[], mx: number, my: number) => {
      // près du bord, la terre a mangé le pavage par plaques (bruit large), pas un pavé sur deux
      const edge = [[14, 0], [-14, 0], [0, 14], [0, -14]].some(([dx, dy]) => !inside(mx + dx, my + dy));
      if (edge && nz(mx / 34, my / 34) + r() * 0.5 > 0.15) {
        if (r() < 0.12) torn.push([mx, my]);
        return;
      }
      if (r() < 0.012) {
        holes.addPath(pathOf(pts));
        return;
      }
      const soft = smoothPoints(pts, 1);
      const k = Math.max(0, Math.min(4, Math.floor(2.5 + (r() - 0.5) * 2.4 + nz(mx / 60, my / 60) * 1.4)));
      const p = pathOf(soft);
      tones[k].addPath(p);
      joints.addPath(p);
      light.addPath(pathOf(soft.map(([px, py]) => [px - 0.7 - (px - mx) * 0.35, py - 0.7 - (py - my) * 0.35] as Pt)));
      dark.addPath(pathOf(soft.map(([px, py]) => [px + 0.8 - (px - mx) * 0.4, py + 0.8 - (py - my) * 0.4] as Pt)));
    };
    // couronne autour du puits : deux rangs
    for (let rad = ring0; rad < ring1 - 2;) {
      const rowH = 11;
      const r1 = rad + rowH;
      const n = Math.max(6, Math.round((Math.PI * 2 * (rad + rowH / 2)) / 14));
      const a0 = r() * Math.PI * 2;
      const da = (Math.PI * 2) / n;
      for (let k = 0; k < n; k++) {
        const a = a0 + k * da;
        const b = a + da * 0.9;
        const pts: Pt[] = [];
        for (let j = 0; j <= 3; j++) pts.push([wx + Math.cos(a + ((b - a) * j) / 3) * (r1 - 0.9), wy + Math.sin(a + ((b - a) * j) / 3) * (r1 - 0.9)]);
        for (let j = 3; j >= 0; j--) pts.push([wx + Math.cos(a + ((b - a) * j) / 3) * (rad + 0.9), wy + Math.sin(a + ((b - a) * j) / 3) * (rad + 0.9)]);
        const am = (a + b) / 2;
        const mx = wx + Math.cos(am) * (rad + rowH / 2);
        const my = wy + Math.sin(am) * (rad + rowH / 2);
        if (inside(mx, my)) stone(pts, mx, my);
      }
      rad = r1;
    }
    // rangs le long de la rue : coordonnées (s le long de la rue, t en travers), une ondulation lente par rang
    const at = (s: number, t: number): Pt => {
      const bend = Math.sin(s / 140 + t / 90) * 7;
      return [wx + ux * s - uy * (t + bend), wy + uy * s + ux * (t + bend)];
    };
    for (let t = -reach, row = 0; t < reach; row++) {
      const rowH = 10 + r() * 2.4;
      for (let s = -reach - (row % 2) * 7 - r() * 5; s < reach;) {
        const sl = 12 + r() * 6;
        const c = at(s + sl / 2, t + rowH / 2);
        const dw = Math.hypot(c[0] - wx, c[1] - wy);
        if (dw > ring1 + 3 && c[0] > bx - 20 && c[0] < bx + bw + 20 && c[1] > by - 20 && c[1] < by + bh + 20 && inside(c[0], c[1])) {
          const g0 = 0.9;
          stone([at(s + g0, t + g0), at(s + sl / 2, t + g0), at(s + sl - g0, t + g0), at(s + sl - g0, t + rowH - g0), at(s + sl / 2, t + rowH - g0), at(s + g0, t + rowH - g0)], c[0], c[1]);
        }
        s += sl;
      }
      t += rowH;
    }
    tones.forEach((p, k) => {
      g.fillStyle = tint(pal.cobble, -0.16 + k * 0.07);
      g.fill(p);
    });
    g.fillStyle = "rgba(255,248,230,.18)";
    g.fill(light);
    g.fillStyle = "rgba(18,12,6,.15)";
    g.fill(dark);
    g.strokeStyle = "rgba(22,16,10,.6)";
    g.lineWidth = 0.75;
    g.stroke(joints);
    // trous de pavés arrachés : le lit de sable sombre, ombré côté lumière
    g.fillStyle = tint(pal.mud, -0.1, 0.85);
    g.fill(holes);
    g.strokeStyle = "rgba(22,16,10,.55)";
    g.stroke(holes);
    // bordure : un rang de boutisses, pavés plus longs posés en travers, qui suit le contour ; la terre en a mangé
    // par endroits (le même bruit que le bord), quelques-unes sont de travers
    {
      const kerb = new Path2D();
      const kerbLight = new Path2D();
      for (const loop of pavedLoops) {
        const pts = densify(loop, 4, true);
        const n = pts.length;
        let acc = 0;
        for (let k = 0; k < n; k++) {
          const [px, py] = pts[k];
          const [qx, qy] = pts[(k + 1) % n];
          acc += Math.hypot(qx - px, qy - py);
          if (acc < 9 + r() * 3) continue;
          acc = 0;
          if (nz(px / 34, py / 34) + r() * 0.5 > 0.55) continue;
          const [ax, ay] = pts[(k - 2 + n) % n];
          const [bx2, by2] = pts[(k + 2) % n];
          const l = Math.hypot(bx2 - ax, by2 - ay) || 1;
          let [nx, ny] = [-(by2 - ay) / l, (bx2 - ax) / l];
          if (!inside(px + nx * 8, py + ny * 8)) [nx, ny] = [-nx, -ny];
          const [tx, ty] = [ny, -nx];
          const cx = px + nx * 9;
          const cy = py + ny * 9;
          const tw = 4.2 + r() * 0.8;
          const tl = 7 + r() * 2;
          const skew = (r() - 0.5) * 0.35;
          const q = (u: number, w: number): Pt => [cx + tx * (u + w * skew) + nx * w, cy + ty * (u + w * skew) + ny * w];
          const stoneP = smoothPoints([q(-tw, -tl), q(tw, -tl), q(tw, tl), q(-tw, tl)], 1);
          kerb.addPath(pathOf(stoneP));
          kerbLight.addPath(pathOf(stoneP.map(([sx, sy]) => [sx - 0.8 - (sx - cx) * 0.3, sy - 0.8 - (sy - cy) * 0.3] as Pt)));
        }
      }
      g.fillStyle = tint(pal.cobble, -0.08);
      g.fill(kerb);
      g.fillStyle = "rgba(255,248,230,.2)";
      g.fill(kerbLight);
      g.strokeStyle = "rgba(22,16,10,.75)";
      g.lineWidth = 0.95;
      g.stroke(kerb);
    }
    // la boue déborde sur les pavés du bord
    g.lineJoin = "round";
    g.strokeStyle = tint(pal.mud, 0, 0.2);
    g.lineWidth = 18;
    g.stroke(ps.path);
    g.restore();
    // pavés arrachés, renversés dans la terre au bord de la place
    for (const [x, y] of torn) {
      const a = r() * Math.PI;
      const p = smoothPoints(blobPoints(r, x + (r() - 0.5) * 10, y + (r() - 0.5) * 10, 6 + r() * 2, 4 + r(), 6, 0.2, a), 1);
      solid(g, p, tint(pal.cobble, (r() - 0.5) * 0.16), r, { ink: 0.8, shadow: 2 });
    }
  }

  // Boue : là où les rues débouchent sur la place, et en flaques entre les pavés (deux ou trois, jamais au même endroit).
  {
    const mudCol = mixColor(pal.mud, pal.dirt, 0.25);
    const spots: Pt[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!road(x, y) || isPaved(x, y)) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isPaved(x + dx, y + dy))) spots.push([x, y]);
      }
    g.save();
    g.globalCompositeOperation = "multiply";
    // bande de boue brun-noir là où les rues entrent sur la place : les roues et les sabots y tournent
    for (const [x, y] of spots) {
      if (r() < 0.2) continue;
      const p = smoothPoints(blobPoints(r, (x + 0.5) * S + (r() - 0.5) * 16, (y + 0.5) * S + (r() - 0.5) * 16, S * between(r, 0.55, 0.9), S * between(r, 0.35, 0.6), 11, 0.4, r() * 3), 2);
      g.fillStyle = tint(mudCol, -0.1, 0.42);
      g.fill(pathOf(p));
    }
    // plaques de boue entre les pavés, autour du puits (on y renverse les seaux) et devant les étals
    let well: Pt | null = null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fountain(x, y) && isPaved(x, y)) well = [x, y];
    if (well) {
      for (let k = 0; k < 5; k++) {
        const a = r() * Math.PI * 2;
        const d = S * (0.9 + r() * 1.8);
        const cx = (well[0] + 0.5) * S + Math.cos(a) * d;
        const cy = (well[1] + 0.5) * S + Math.sin(a) * d;
        if (!isPaved(Math.floor(cx / S), Math.floor(cy / S))) continue;
        const p = smoothPoints(blobPoints(r, cx, cy, S * between(r, 0.3, 0.7), S * between(r, 0.2, 0.4), 12, 0.5, a), 2);
        g.fillStyle = tint(mixColor(pal.mud, "#20160c", 0.3), 0, 0.38);
        g.fill(pathOf(p));
      }
    }
    g.restore();
    // une flaque au plus sur la place, dans un creux au bord du pavage (jamais au milieu)
    const wet: Pt[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!isPaved(x, y) || fountain(x, y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fountain(x + dx, y + dy))) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isPaved(x + dx, y + dy))) wet.push([x, y]);
      }
    if (wet.length && r() < 0.7) {
      const [x, y] = wet[Math.floor(r() * wet.length)];
      puddle(v, (x + 0.5) * S, (y + 0.5) * S, S * between(r, 0.35, 0.6), S * between(r, 0.2, 0.3), r() * Math.PI, r);
    }
  }

  // Ruelles serrées entre deux murs : le soleil n'y descend pas, un lavis plus sombre
  {
    const lane = new Path2D();
    const wall = (x: number, y: number) => v.tile(x, y) === T.mur;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (v.tile(x, y) !== T.route) continue;
        if ((wall(x - 1, y) && wall(x + 1, y)) || (wall(x, y - 1) && wall(x, y + 1))) lane.addPath(pathOf(smoothPoints(blobPoints(r, (x + 0.5) * S, (y + 0.5) * S, S * 0.75, S * 0.75, 9, 0.2), 2)));
      }
    g.save();
    g.globalCompositeOperation = "multiply";
    g.fillStyle = "rgba(90,70,52,.35)";
    g.fill(lane);
    g.restore();
  }
  // Cailloux et crottin, et le contour à l'encre de la rue (interrompu, plus appuyé côté ombre).
  stipple(g, sh, r, { density: 0.03, radius: 1.1, color: tint(pal.mud, -0.12, 0.5) });
  for (const loop of loops)
    inkStroke(g, loop, r, { width: 1.1, closed: true, color: INK_SOFT, wobble: 0.9 });
  // L'herbe mord sur le bord de la rue.
  strokes(g, tint(pal.grassLush, -0.32, 0.7), 0.75, (p) => {
    for (const loop of loops)
      for (let i = 0; i < loop.length; i++) {
        if (r() < 0.45) continue;
        const [x, y] = loop[i];
        if (isPaved(Math.floor(x / S), Math.floor(y / S))) continue;
        blade(p, r() < 0.3 ? 1 : 0, x + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 4 + r() * 3, (r() - 0.5) * 0.8, r);
      }
  });
}

/** Cellules de Voronoï de graines posées sur une grille secouée : chaque cellule touche ses voisines. */
function voronoiCells(r: Rng, bx: number, by: number, bw: number, bh: number, step: number): { c: Pt; pts: Pt[] }[] {
  const nx = Math.ceil(bw / step) + 4;
  const ny = Math.ceil(bh / step) + 4;
  const seeds: Pt[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) seeds.push([bx + (i - 2 + 0.12 + r() * 0.76) * step, by + (j - 2 + 0.12 + r() * 0.76) * step * 0.9]);
  const out: { c: Pt; pts: Pt[] }[] = [];
  for (let j = 2; j < ny - 2; j++)
    for (let i = 2; i < nx - 2; i++) {
      const s0 = seeds[j * nx + i];
      let poly: Pt[] = rectPts(s0[0] - step * 1.6, s0[1] - step * 1.6, step * 3.2, step * 3.2);
      for (let dj = -2; dj <= 2 && poly.length >= 3; dj++)
        for (let di = -2; di <= 2; di++) {
          if (!di && !dj) continue;
          const q = seeds[(j + dj) * nx + i + di];
          const mx = (s0[0] + q[0]) / 2;
          const my = (s0[1] + q[1]) / 2;
          const ux = q[0] - s0[0];
          const uy = q[1] - s0[1];
          const side = (p: Pt) => (p[0] - mx) * ux + (p[1] - my) * uy;
          const next: Pt[] = [];
          for (let k = 0; k < poly.length; k++) {
            const a = poly[k];
            const b = poly[(k + 1) % poly.length];
            const sa = side(a);
            const sb = side(b);
            if (sa <= 0) next.push(a);
            if (sa <= 0 !== sb <= 0) {
              const t = sa / (sa - sb);
              next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
            }
          }
          poly = next;
          if (poly.length < 3) break;
        }
      if (poly.length >= 3) out.push({ c: s0, pts: poly });
    }
  return out;
}

/** Une ornière : sillon sombre ondulé, bourrelet clair, flaques plates et allongées dans le creux. */
function rut(v: V, pts: Pt[], r: Rng, puddles: { left: number }) {
  const { g, pal } = v;
  inkPolyline(g, pts, r, { width: 7, color: tint(pal.mud, 0, 0.28), wobble: 1.6, pressure: 0.6, taper: 40 });
  inkPolyline(g, pts.map(([x, y]) => [x + 1.2, y + 1.6] as Pt), r, { width: 0.9, color: "rgba(22,16,10,.45)", wobble: 1, taper: 30 });
  inkPolyline(g, pts.map(([x, y]) => [x - 1.8, y - 2.6] as Pt), r, { width: 1.6, color: tint(pal.dirt, 0.16, 0.55), wobble: 1, taper: 30 });
  for (let i = 3; i < pts.length - 4; i++) {
    if (puddles.left <= 0 || r() > 0.03) continue;
    puddles.left--;
    // flaque couchée dans l'ornière, de taille inégale : une longue mare de roue ou une petite flache
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 2];
    const a = Math.atan2(ny - y, nx - x);
    const big = r() < 0.4;
    puddle(v, x, y, big ? 16 + r() * 14 : 7 + r() * 6, big ? 5 + r() * 3 : 3 + r() * 2, a, r);
  }
}

/**
 * Flaque : eau sombre, bord irrégulier (bruit sur le rayon) et flou, sans trait dur ; un liseré de boue autour,
 * le ciel qui s'y reflète en dégradé pâle du côté opposé à la berge éclairée, un seul reflet couché.
 */
function puddle(v: V, x: number, y: number, rx: number, ry: number, a: number, r: Rng) {
  const { g, pal } = v;
  const nz = noise2(Math.floor(r() * 1e6));
  const outline = (grow: number, n = 22): Pt[] => {
    const pts: Pt[] = [];
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let k = 0; k < n; k++) {
      const t = (k / n) * Math.PI * 2;
      const f = 1 + nz(Math.cos(t) * 1.6, Math.sin(t) * 1.6) * 0.38;
      const ex = Math.cos(t) * (rx * f + grow);
      const ey = Math.sin(t) * (ry * f + grow * 0.8);
      pts.push([x + ex * ca - ey * sa, y + ex * sa + ey * ca]);
    }
    return smoothPoints(pts, 2);
  };
  // liseré de boue : terre mouillée, plus sombre, qui s'estompe
  g.fillStyle = tint(pal.mud, -0.08, 0.22);
  g.fill(pathOf(outline(6)));
  g.fillStyle = tint(pal.mud, -0.15, 0.3);
  g.fill(pathOf(outline(2.5)));
  const path = pathOf(outline(0));
  // l'eau : presque noire au bord, reflet du ciel en dégradé au milieu (du bas à droite vers le haut à gauche)
  const deep = mixColor(mixColor(pal.water, pal.mud, 0.55), "#1a1612", 0.35);
  g.fillStyle = tint(deep, 0, 0.85);
  g.fill(path);
  g.save();
  g.clip(path);
  const sky = g.createLinearGradient(x - rx * 0.4, y - ry * 0.6, x + rx * 0.8, y + ry);
  sky.addColorStop(0, "rgba(200,212,214,0)");
  sky.addColorStop(0.55, "rgba(200,212,214,.32)");
  sky.addColorStop(1, "rgba(232,236,230,.5)");
  g.fillStyle = sky;
  g.fill(path);
  // bord flou : la terre déborde un peu sur l'eau
  g.strokeStyle = tint(pal.mud, -0.1, 0.35);
  g.lineWidth = 5;
  g.stroke(path);
  g.strokeStyle = "rgba(246,244,232,.6)";
  g.lineCap = "round";
  g.lineWidth = 1.1;
  g.beginPath();
  const l = rx * (0.3 + r() * 0.3);
  const oy = ry * (0.15 + r() * 0.25);
  g.moveTo(x - l / 2 + rx * 0.1, y + oy);
  g.lineTo(x + l / 2 + rx * 0.1, y + oy - 0.6);
  g.stroke();
  // la berge du haut à gauche jette son ombre sur l'eau
  g.strokeStyle = "rgba(14,10,6,.35)";
  g.lineWidth = 3;
  g.stroke(pathOf(outline(0).map(([px, py]) => [px + 1.6, py + 2] as Pt)));
  g.restore();
  // contour à la plume, interrompu : la berge se lit sans être un trait de bassin
  inkStroke(g, outline(0, 28), r, { width: 1, closed: true, breaks: true, color: "rgba(22,16,10,.75)", wobble: 0.5 });
}

/** Touffe d'herbe : quelques traits qui partent d'une base (à tracer dans un chemin ouvert). */
function tuft(p: CanvasRenderingContext2D, x: number, y: number, size: number, r: Rng, lean = 0) {
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + lean + (k / (n - 1) - 0.5) * 1.6 + (r() - 0.5) * 0.3;
    const l = size * (0.6 + r() * 0.5);
    const bx = x + (k - n / 2) * 0.9;
    p.moveTo(bx, y);
    p.quadraticCurveTo(bx + Math.cos(a) * l * 0.4, y + Math.sin(a) * l * 0.6, bx + Math.cos(a) * l, y + Math.sin(a) * l);
  }
}

/**
 * Herbe par plaques, pas en semis : un tirage de Poisson sur grille secouée dont la densité suit un bruit de valeur,
 * plus serrée au pied des murs, des clôtures et au bord des rues ; hautes herbes, fleurs, cailloux et terre battue
 * devant les seuils.
 */
function paintGrassDetail(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 4);
  const dens = noise2(v.seed + 9);
  const tall = noise2(v.seed + 10);
  const wind = noise2(v.seed + 11);
  // bruit très large (une dizaine de cases) : des prés entiers plus ras ou plus touffus, pas une trame régulière
  const broad = noise2(v.seed + 12);
  // distance (en cases, plafonnée à 3) au plus proche mur, porte, rue ou clôture d'enclos
  const near = new Float32Array(W * H).fill(3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = v.tile(x, y);
      if (t !== T.mur && t !== T.porte && t !== T.route && !v.fence[y * W + x]) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const d = Math.max(Math.abs(dx), Math.abs(dy)) - (t === T.route ? 0.5 : 0);
          near[ny * W + nx] = Math.min(near[ny * W + nx], d);
        }
    }
  // Terre battue devant chaque seuil (lieux ouverts et logis) : demi-ellipse d'herbe pelée, terre plus claire.
  for (const d of [...v.buildings.flatMap((b) => b.doors), ...blockDoors(v)]) {
    const [ox, oy] = outward(d);
    const cx = (ox + 0.5) * S + (d.side === "W" ? -6 : d.side === "E" ? 6 : 0);
    const cy = (oy + 0.5) * S + (d.side === "N" ? -6 : d.side === "S" ? 6 : 0);
    const p = pathOf(smoothPoints(blobPoints(r, cx, cy, S * 0.85, S * 0.62, 9, 0.3, d.side === "N" || d.side === "S" ? 0 : Math.PI / 2), 2));
    g.fillStyle = tint(pal.dirt, 0.06, 0.5);
    g.fill(p);
    stipple(g, shapeOf(smoothPoints(blobPoints(r, cx, cy, S * 0.6, S * 0.4, 8, 0.3), 1)), r, { density: 0.5, radius: 0.7, color: tint(pal.mud, -0.1, 0.45) });
  }
  const step = 9;
  const items: { x: number; y: number; kind: number; size: number; lean: number }[] = [];
  const pebbles: Pt[] = [];
  for (let gy = 0; gy < (H * S) / step; gy++)
    for (let gx = 0; gx < (W * S) / step; gx++) {
      const x = (gx + 0.1 + r() * 0.8) * step;
      const y = (gy + 0.1 + r() * 0.8) * step;
      const cx = Math.floor(x / S);
      const cy = Math.floor(y / S);
      if (!isOutdoorGround(v, cx, cy) && v.tile(cx, cy) !== T.vegetation) continue;
      if (v.used[cy * W + cx] && !v.fence[cy * W + cx]) continue;
      const fx = x / S;
      const fy = y / S;
      const dn = dens(fx / 3.5, fy / 3.5);
      const edge = near[cy * W + cx];
      const bn = broad(fx / 10, fy / 10);
      let p = (0.1 + Math.max(0, dn) * 0.55) * (0.45 + Math.max(0, bn + 0.4) * 1.1) + (edge < 1 ? 0.5 : edge < 2 ? 0.2 : 0);
      // l'herbe foulée est rase : peu de brins là où l'on passe
      p *= 1 - (v.wear?.[cy * W + cx] ?? 0) * 0.75;
      if (dn < -0.35 && edge >= 2) p *= 0.3;
      if (r() > p) {
        if (r() < 0.006) pebbles.push([x, y]);
        continue;
      }
      const tl = tall(fx / 4, fy / 4);
      // hautes herbes en colonies, et toujours le long des murs et des clôtures (la faux n'y passe pas)
      const kind = tl > 0.35 || (edge < 1 && r() < 0.55) ? (r() < 0.75 ? 1 : 0) : r() < 0.55 ? 0 : r() < 0.6 ? 2 : 3;
      const size = (kind === 1 ? 6 : 4) * (0.7 + r() * 0.7) * (edge < 1 ? 1.2 : 1);
      items.push({ x, y, kind, size, lean: wind(fx / 6, fy / 6) * 0.7 + (r() - 0.5) * 0.3 });
    }
  // deux encres : la sombre pour le gros des traits, un trait clair côté lumière sur une partie
  strokes(g, tint(pal.grassLush, -0.4, 0.6), 0.75, (p) => {
    for (const it of items) blade(p, it.kind, it.x, it.y, it.size, it.lean, r);
  });
  strokes(g, tint(pal.grassDry, 0.12, 0.45), 0.6, (p) => {
    for (const it of items) if (it.kind === 1 || r() < 0.25) blade(p, it.kind === 1 ? 1 : 3, it.x - 1.2, it.y - 0.8, it.size * 0.8, it.lean, r);
  });
  // Cailloux : petite pierre encrée, ombre en bas à droite.
  for (const [x, y] of pebbles) {
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const pts = smoothPoints(blobPoints(r, x + (r() - 0.5) * 8, y + (r() - 0.5) * 6, 2 + r() * 2.5, 1.6 + r() * 1.6, 6, 0.25, r() * 3), 1);
      solid(g, pts, tint(pal.stone, (r() - 0.5) * 0.15), r, { ink: 0.7, shadow: 1.4 });
    }
  }
  // Fleurs des prés en colonies d'une seule couleur, là où l'herbe est haute ou le long des clôtures.
  const flowers = ["#e8dcb0", "#d9b54a", "#b8473a", "#c9c2e0", "#e6e0d0"];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOutdoorGround(v, x, y) || (v.used[y * W + x] && !v.fence[y * W + x])) continue;
      const lush = tall(x / 4, y / 4) > 0.2 || near[y * W + x] < 1;
      if (r() > (lush ? 0.06 : 0.012)) continue;
      const col = pick(r, flowers);
      const cx = (x + 0.2 + r() * 0.6) * S;
      const cy = (y + 0.2 + r() * 0.6) * S;
      const n = 5 + Math.floor(r() * 8);
      const pts: Pt[] = Array.from({ length: n }, () => [cx + (r() - 0.5) * 16, cy + (r() - 0.5) * 11] as Pt);
      strokes(g, tint(pal.grassLush, -0.35, 0.7), 0.6, (p) => {
        for (const [fx, fy] of pts) {
          p.moveTo(fx, fy + 3.5);
          p.lineTo(fx + (r() - 0.5), fy);
        }
      });
      g.fillStyle = col;
      g.beginPath();
      for (const [fx, fy] of pts) {
        g.moveTo(fx + 1.4, fy - 0.5);
        g.arc(fx, fy - 0.5, 1.1 + r() * 0.5, 0, Math.PI * 2);
      }
      g.fill();
      g.fillStyle = "rgba(22,16,10,.35)";
      g.beginPath();
      for (const [fx, fy] of pts) {
        g.moveTo(fx + 0.9, fy + 0.1);
        g.arc(fx + 0.4, fy + 0.1, 0.45, 0, Math.PI * 2);
      }
      g.fill();
    }
}

/** Palissade de pieux taillés sur le pourtour du village, ouverte là où passent les rues. */
function paintPalisade(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 6);
  const edges: { cells: Pt[]; side: Side }[] = [
    { cells: Array.from({ length: W }, (_, x) => [x, 0] as Pt), side: "N" },
    { cells: Array.from({ length: W }, (_, x) => [x, H - 1] as Pt), side: "S" },
    { cells: Array.from({ length: H }, (_, y) => [0, y] as Pt), side: "W" },
    { cells: Array.from({ length: H }, (_, y) => [W - 1, y] as Pt), side: "E" },
  ];
  for (const { cells, side } of edges) {
    const ok = cells.map(([x, y]) => v.tile(x, y) === T.sol && !v.indoor[y * W + x]);
    let i = 0;
    while (i < cells.length) {
      if (!ok[i]) {
        i++;
        continue;
      }
      let e = i;
      while (e + 1 < cells.length && ok[e + 1]) e++;
      if (e - i >= 3) {
        // pieux à 0,25 case du bord, sur toute la longueur libre (un peu en retrait aux bouts)
        const along = (k: number) => (cells[i][side === "N" || side === "S" ? 0 : 1] + k) * S;
        // la palissade suit le terrain, pas le bord de la planche : elle ondule entre 0,15 et 0,75 case du bord
        const inset = S * 0.45;
        const across = side === "N" ? inset : side === "S" ? H * S - inset : side === "W" ? inset : W * S - inset;
        const a0 = along(0.3);
        const a1 = along(e - i + 1 - 0.3);
        // pieux taillés en pointe vers l'extérieur, sur une ligne qui ondule, avec des trouées
        const nz = noise2(v.seed + 60 + i);
        const horiz = side === "N" || side === "S";
        const out = side === "N" || side === "W" ? -1 : 1;
        const stakes: Pt[][] = [];
        const rail: Pt[] = [];
        for (let s = a0; s <= a1; s += 8.4 + r() * 1.2) {
          const wob = (nz(s / 160, 0) * 13 + nz(s / 40, 3) * 2.5) * (side === "N" || side === "W" ? 1 : -1);
          const base = across + wob;
          rail.push(horiz ? [s, base - out * 3] : [base - out * 3, s]);
          if (r() < 0.05) continue;
          const w = 3.4 + r() * 0.8;
          const len = 10 + r() * 4;
          const lean = (r() - 0.5) * 1.5;
          const loc: [number, number][] = [[-w, 2], [w, 2], [w, -len + 4], [lean, -len], [-w, -len + 4]];
          stakes.push(loc.map(([u, d]) => (horiz ? [s + u, base - out * d] : [base - out * d, s + u]) as Pt));
        }
        // hors fantasy et port, la palissade devient barrière de ranch, grillage ou mur de tôles
        if (genreFence(v, rail, r)) {
          i = e + 1;
          continue;
        }
        const sh = new Path2D();
        for (const st of stakes) sh.addPath(pathOf(st.map(([x, y]) => [x + 6, y + 8] as Pt)));
        g.save();
        g.globalCompositeOperation = "multiply";
        g.fillStyle = "rgba(52,40,28,.4)";
        g.fill(sh);
        g.restore();
        inkPolyline(g, rail, r, { width: 2.6, color: pal.woodDark, wobble: 0.6, taper: 0 });
        for (const st of stakes) {
          solid(g, st, tint(pal.wood, (r() - 0.5) * 0.16), r, { ink: 0, shadow: 0 });
          inkStroke(g, st, r, { width: 1, closed: true, breaks: false, wobble: 0.3 });
        }
      }
      i = e + 1;
    }
  }
}

// ——— Ombres, arbres ———

interface Lobe {
  x: number;
  y: number;
  rad: number;
}

interface Tree {
  x: number;
  y: number;
  rad: number;
  color: string;
  lobes: Lobe[];
  bush: boolean;
  trunk: boolean;
  /** Essence : chêne en boule (lobes), conifère en étoile, saule allongé. */
  kind: "chene" | "conifere" | "saule";
  /** Contour du houppier (union des lobes). */
  pts: Pt[];
}

/** Contour d'une union de disques vue depuis (cx, cy) : pour chaque direction, le bord le plus lointain. */
function lobeOutline(cx: number, cy: number, lobes: Lobe[], n: number): Pt[] {
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    let best = 0;
    for (const l of lobes) {
      const ox = l.x - cx;
      const oy = l.y - cy;
      const b = ux * ox + uy * oy;
      const disc = b * b - (ox * ox + oy * oy) + l.rad * l.rad;
      if (disc < 0) continue;
      best = Math.max(best, b + Math.sqrt(disc));
    }
    pts.push([cx + ux * best, cy + uy * best]);
  }
  return pts;
}

/** Arbres et buissons : tirage de Poisson dans les cases de végétation, taille limitée par les murs et les rues. */
function treesOf(v: V): Tree[] {
  if (v.trees) return v.trees;
  const { W, H, S, pal } = v;
  const r = rng(v.seed, 900);
  const cells: Pt[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (v.tile(x, y) === T.vegetation) cells.push([x, y]);
  const blocked = (x: number, y: number) => {
    const t = v.tile(x, y);
    return t === T.mur || t === T.porte || t === T.route || t === T.eau || (t !== undefined && v.indoor[y * W + x] === 1);
  };
  // distance (px) au plus proche obstacle à ne pas couvrir
  const room = (px: number, py: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    let best = S * 4;
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        if (!blocked(cx + dx, cy + dy)) continue;
        const qx = Math.max((cx + dx) * S, Math.min(px, (cx + dx + 1) * S));
        const qy = Math.max((cy + dy) * S, Math.min(py, (cy + dy + 1) * S));
        best = Math.min(best, Math.hypot(px - qx, py - qy));
      }
    return best;
  };
  const veg = (x: number, y: number) => v.tile(x, y) === T.vegetation;
  const trees: Tree[] = [];
  const tries = cells.length * 4;
  for (let k = 0; k < tries; k++) {
    const [x, y] = cells[Math.floor(r() * cells.length)];
    const px = (x + 0.15 + r() * 0.7) * S;
    const py = (y + 0.15 + r() * 0.7) * S;
    // plus le bosquet est épais, plus l'arbre peut être grand
    let depth = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (veg(x + dx, y + dy)) depth++;
    const want = S * (depth > 18 ? between(r, 0.75, 1.5) : depth > 10 ? between(r, 0.6, 1.15) : between(r, 0.32, 0.8));
    const rad = Math.min(want, room(px, py) + S * 0.1);
    if (rad < S * 0.3) continue;
    if (trees.some((t) => Math.hypot(t.x - px, t.y - py) < (t.rad + rad) * 0.72)) continue;
    const bush = rad < S * 0.5;
    const n = bush ? 5 + Math.floor(r() * 3) : 7 + Math.floor(r() * 6);
    const lobes: Lobe[] = [{ x: px, y: py, rad: rad * 0.58 }];
    const a0 = r() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      const a = a0 + (j / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const lr = rad * between(r, 0.3, 0.5);
      const d = rad - lr * between(r, 0.9, 1.15);
      lobes.push({ x: px + Math.cos(a) * d, y: py + Math.sin(a) * d, rad: lr });
    }
    const roll = r();
    const kind = bush ? "chene" : roll < 0.24 ? "conifere" : roll < 0.4 && rad > S * 0.6 ? "saule" : "chene";
    // chaque arbre a son vert, à ±15 % ; les conifères tirent vers le bleu-noir, les saules vers le jaune
    const base = kind === "conifere" ? mixColor(pick(r, pal.leaves), "#2c3f36", 0.45) : kind === "saule" ? mixColor(pick(r, pal.leaves), "#5f6e3a", 0.3) : pick(r, pal.leaves);
    const shade = (r() - 0.5) * 0.3;
    const color = mixColor(base, shade > 0 ? "#e8ecc8" : "#10160c", Math.abs(shade));
    let pts: Pt[];
    if (kind === "conifere") {
      const n = 11 + Math.floor(r() * 5);
      const a0 = r() * Math.PI;
      pts = [];
      for (let j = 0; j < n * 2; j++) {
        const a = a0 + (j / (n * 2)) * Math.PI * 2;
        const rr = rad * (j % 2 ? 0.66 + r() * 0.08 : 0.92 + r() * 0.1);
        pts.push([px + Math.cos(a) * rr, py + Math.sin(a) * rr]);
      }
    } else if (kind === "saule") {
      const rot = r() * Math.PI;
      pts = smoothPoints(jitterPoints(blobPoints(r, px, py, rad, rad * 0.72, 14, 0.12, rot), 3, v.seed + trees.length), 2);
    } else pts = lobeOutline(px, py, lobes, bush ? 40 : 72);
    trees.push({ x: px, y: py, rad, color, lobes, bush, trunk: !bush && kind === "chene" && r() < 0.5, kind, pts });
  }
  v.trees = trees;
  return trees;
}

/** Ombre portée nette, hachurée à 45° (les noirs du dessinateur), croisée là où elle est la plus dense. */
function castShadow(g: CanvasRenderingContext2D, shape: Shape, r: Rng, o: { alpha?: number; core?: Shape } = {}) {
  const { alpha = 0.3, core } = o;
  g.save();
  g.globalCompositeOperation = "multiply";
  if (alpha > 0) {
    g.fillStyle = `rgba(52,40,28,${alpha})`;
    g.fill(shape.path);
  }
  g.globalCompositeOperation = "source-over";
  hatchLines(g, shape, r, { spacing: 3.6, width: 0.7, color: "rgba(22,16,10,.5)", angle: -Math.PI / 4 });
  if (core) hatchLines(g, core, r, { spacing: 2.8, width: 0.6, color: "rgba(22,16,10,.5)", angle: Math.PI / 4 });
  g.restore();
}

/**
 * Ombre de la flèche du clocher : un long triangle de la tour jusqu'à la pointe projetée à plus de quatre cases,
 * posé après les lieux ouverts parce qu'il tombe aussi sur le toit ôté du temple (le dallage, les bancs).
 */
function paintSpireShadow(v: V) {
  const { g, S } = v;
  for (const bk of v.blocks) {
    if (bk.kind !== "clocher") continue;
    const r = rng(v.seed, 7700 + bk.rects[0].x0, bk.rects[0].y0);
    const [x0, y0, x1, y1] = roofRect(v, bk.rects[0], 4);
    const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
    const tip: Pt = [cx + S * 0.7 * 4.8, cy + S * 0.83 * 4.8];
    const h = bk.height;
    const spire: Pt[] = [[x1, y0], [x1 + S * 0.7 * h, y0 + S * 0.83 * h], tip, [x0 + S * 0.7 * h, y1 + S * 0.83 * h], [x0, y1]];
    const tower = rectPts(x0, y0, x1 - x0, y1 - y0);
    g.save();
    // la tour elle-même n'est pas dans son ombre
    const clip = new Path2D();
    clip.rect(x0 - 400, y0 - 400, 1200, 1200);
    clip.addPath(pathOf(tower));
    g.clip(clip, "evenodd");
    g.globalCompositeOperation = "multiply";
    g.fillStyle = "rgba(60,44,30,.38)";
    g.fill(pathOf(spire));
    g.globalCompositeOperation = "source-over";
    hatchLines(g, shapeOf(spire), r, { spacing: 3.4, width: 0.6, color: "rgba(22,16,10,.42)", angle: -Math.PI / 4 });
    g.restore();
  }
}

/** Polygone d'ombre d'un rectangle posé au sol et haut de (dx, dy) : le rectangle et sa projection. */
function boxShadow(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number): Pt[] {
  return [[x0, y0], [x1, y0], [x1 + dx, y0 + dy], [x1 + dx, y1 + dy], [x0 + dx, y1 + dy], [x0, y1]];
}

function paintShadows(v: V) {
  const { g, S } = v;
  const r = rng(v.seed, 7);
  // Toutes les ombres de la planche en un seul passage : chaque couche (lavis, hachures, contre-hachures du cœur)
  // est un seul chemin, découpé et tracé une fois. Les ombres qui se recouvrent se fondent au lieu de s'additionner.
  const tiers = [new Path2D(), new Path2D(), new Path2D()];
  const soft = new Path2D();
  const hatchA = { thin: new Path2D(), thick: new Path2D() };
  const hatchB = { thin: new Path2D(), thick: new Path2D() };
  const add = (sh: Pt[], coreSh: Pt[] | null) => {
    dashesInto(hatchA, sh, r, 3.6, -Math.PI / 4);
    if (coreSh) dashesInto(hatchB, coreSh, r, 2.8, Math.PI / 4);
  };
  // maisons : l'ombre part du rebord du toit, 0,6 case vers le bas à droite, plus dense au pied du mur
  // (trois couches emboîtées en multiply), hachurée, contre-hachures serrées contre la façade
  const box = (x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) => {
    [1, 0.62, 0.3].forEach((f, k) => tiers[k].addPath(pathOf(boxShadow(x0, y0, x1, y1, dx * f, dy * f))));
    add(boxShadow(x0, y0, x1, y1, dx, dy), boxShadow(x0, y0, x1, y1, dx * 0.38, dy * 0.38));
  };
  for (const b of v.buildings) {
    const [x0, y0, x1, y1] = roofBox(v, b);
    box(x0, y0, x1, y1, S * 0.6, S * 0.74);
  }
  // logis fermés : même ombre, plus longue pour le clocher, plus courte pour un appentis
  for (const bk of v.blocks)
    for (const rc of bk.rects) {
      const [x0, y0, x1, y1] = roofRect(v, rc, 4);
      box(x0, y0, x1, y1, S * 0.82 * bk.height, S * 0.98 * bk.height);
    }
  // arbres : le houppier projeté, le cœur de l'ombre croisé
  for (const t of treesOf(v)) {
    const off = t.rad * 0.38 + 5;
    const sh = t.pts.map(([x, y]) => [x + off * 0.8, y + off] as Pt);
    soft.addPath(pathOf(sh));
    add(sh, t.bush ? null : t.pts.map(([x, y]) => [t.x + (x - t.x) * 0.55 + off, t.y + (y - t.y) * 0.55 + off * 1.2] as Pt));
  }
  g.save();
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(60,44,30,.17)";
  for (const p of tiers) g.fill(p);
  g.fillStyle = "rgba(52,40,28,.26)";
  g.fill(soft);
  // les hachures à l'encre se posent normalement (le mode multiply ralentit beaucoup le tracé des traits)
  g.globalCompositeOperation = "source-over";
  g.lineCap = "butt";
  g.strokeStyle = "rgba(22,16,10,.5)";
  g.lineWidth = 0.55;
  g.stroke(hatchA.thin);
  g.lineWidth = 0.85;
  g.stroke(hatchA.thick);
  g.lineWidth = 0.5;
  g.stroke(hatchB.thin);
  g.lineWidth = 0.7;
  g.stroke(hatchB.thick);
  g.restore();
}

/**
 * Tirets de hachure (comme hatchLines) à l'intérieur d'un polygone, ajoutés à deux chemins d'épaisseurs différentes.
 * Chaque ligne est coupée aux bords du polygone par le calcul (règle pair-impair) : pas de découpe à faire au tracé.
 */
function dashesInto(into: { thin: Path2D; thick: Path2D }, pts: Pt[], r: Rng, spacing: number, angle: number) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const diag = Math.hypot(x1 - x0, y1 - y0);
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  // repère de la hachure : s le long du trait, d en travers
  const loc = pts.map(([x, y]) => [(x - mx) * ca + (y - my) * sa, -(x - mx) * sa + (y - my) * ca] as Pt);
  const n = loc.length;
  for (let d = -diag / 2; d <= diag / 2; d += spacing * (0.8 + r() * 0.4)) {
    const cuts: number[] = [];
    for (let i = 0; i < n; i++) {
      const [as, ad] = loc[i];
      const [bs, bd] = loc[(i + 1) % n];
      if (ad <= d === bd <= d) continue;
      cuts.push(as + ((d - ad) / (bd - ad)) * (bs - as));
    }
    cuts.sort((a, b) => a - b);
    for (let k = 0; k + 1 < cuts.length; k += 2) {
      let s = cuts[k] - r() * 6;
      const end = cuts[k + 1];
      while (s < end) {
        const len = Math.min(18 + r() * 60, end - s);
        const gap = r() < 0.7 ? 1 + r() * 3 : 6 + r() * 10;
        const a = Math.max(s, cuts[k]);
        if (len > 1.5) {
          const px = mx - sa * d + ca * a;
          const py = my + ca * d + sa * a;
          const l = s + len - a;
          const p = r() < 0.5 ? into.thin : into.thick;
          // trait droit légèrement dévié (la main ne tient pas la règle) : bien moins cher à tracer qu'une courbe
          const k = (r() - 0.5) * 0.03;
          p.moveTo(px, py);
          p.lineTo(px + (ca - sa * k) * l, py + (sa + ca * k) * l);
        }
        s += len + gap;
      }
    }
  }
}

function paintTrees(v: V) {
  const { g, pal } = v;
  // de haut en bas : les houppiers du bas recouvrent ceux du haut, comme sur une vue en plongée
  const trees = [...treesOf(v)].sort((a, b) => a.y + a.x * 0.3 - (b.y + b.x * 0.3));
  for (const t of trees) {
    const r = rng(v.seed, 1300 + Math.round(t.x), Math.round(t.y));
    const R = t.rad;
    // tronc qui dépasse côté ombre, sur la moitié des arbres
    if (t.trunk) {
      const ax = t.x + R * 0.55;
      const ay = t.y + R * 0.65;
      const bx = t.x + R * 0.82 + 3;
      const by = t.y + R * 1.02 + 4;
      inkPolyline(g, [[ax, ay], [bx, by]], r, { width: Math.max(5, R * 0.2), color: mixColor(pal.woodDark, "#000000", 0.2), wobble: 0.6, taper: 4 });
      inkLine(g, ax + 2, ay, bx + 1.5, by, r, { width: 0.9, taper: 3 });
    }
    if (t.kind === "conifere") {
      conifer(v, t, r);
      continue;
    }
    if (t.kind === "saule") {
      willow(v, t, r);
      continue;
    }
    const crown = shapeOf(t.pts);
    g.fillStyle = t.color;
    g.fill(crown.path);
    g.save();
    g.clip(crown.path);
    // modelé des lobes : chacun a son reflet en haut à gauche et sa teinte (trois tons par arbre)
    const tones = [tint(t.color, 0.07), t.color, mixColor(t.color, pick(r, pal.leaves), 0.5)];
    for (const l of t.lobes) {
      const lg = g.createRadialGradient(l.x - l.rad * 0.3, l.y - l.rad * 0.3, 0, l.x, l.y, l.rad);
      lg.addColorStop(0, tint(pick(r, tones), 0.04, 0.5));
      lg.addColorStop(1, tint(pick(r, tones), 0, 0));
      g.fillStyle = lg;
      g.fillRect(l.x - l.rad, l.y - l.rad, l.rad * 2, l.rad * 2);
      g.fillStyle = tint(t.color, 0.18, 0.22);
      g.beginPath();
      g.ellipse(l.x - l.rad * 0.28, l.y - l.rad * 0.3, l.rad * 0.55, l.rad * 0.42, -0.6, 0, Math.PI * 2);
      g.fill();
    }
    // croissant d'ombre en bas à droite : le houppier moins sa copie décalée vers la lumière
    const dark = new Path2D();
    dark.rect(t.x - R * 1.5, t.y - R * 1.5, R * 3, R * 3);
    dark.addPath(shapeOf(t.pts.map(([x, y]) => [x - R * 0.24, y - R * 0.26] as Pt)).path);
    g.save();
    g.clip(dark, "evenodd");
    g.fillStyle = tint(t.color, -0.25, 0.5);
    g.fillRect(t.x - R * 1.5, t.y - R * 1.5, R * 3, R * 3);
    hatchLines(g, rectShape(t.x - R, t.y - R, R * 2, R * 2), r, { spacing: 3, width: 0.6, color: "rgba(22,16,10,.6)", angle: -Math.PI / 4 });
    g.restore();
    // cœur du massif : contre-hachures sous les lobes, côté ombre
    if (!t.bush) hatchLines(g, shapeOf(blobPoints(r, t.x + R * 0.2, t.y + R * 0.25, R * 0.38, R * 0.3, 7, 0.3)), r, { spacing: 3.2, width: 0.55, color: "rgba(22,16,10,.38)", angle: Math.PI / 4 });
    // bord de chaque lobe tourné vers l'ombre : un arc d'encre interrompu
    for (const l of t.lobes.slice(1)) {
      if (r() < 0.25) continue;
      const a0 = -0.3 + (r() - 0.5) * 0.6;
      const span = 1.6 + r() * 1.2;
      const arc: Pt[] = [];
      for (let k = 0; k <= 8; k++) {
        const a = a0 + (span * k) / 8;
        arc.push([l.x + Math.cos(a) * l.rad, l.y + Math.sin(a) * l.rad]);
      }
      inkPolyline(g, arc, r, { width: 0.75, color: tint(t.color, -0.5, 0.85), wobble: 0.4, taper: 5 });
    }
    // feuillage piqué : petits traits côté lumière
    strokes(g, tint(t.color, 0.28, 0.6), 0.7, (p) => {
      const n = Math.round(R / 3);
      for (let k = 0; k < n; k++) {
        const a = between(r, Math.PI * 0.95, Math.PI * 1.75);
        const d = R * between(r, 0.2, 0.8);
        const x = t.x + Math.cos(a) * d;
        const y = t.y + Math.sin(a) * d;
        p.moveTo(x, y);
        p.lineTo(x + 2, y - 1.2);
      }
    });
    g.restore();
    inkStroke(g, t.pts, r, { width: t.bush ? 1.15 : 1.5, closed: true, wobble: 0.5 });
  }
}

// ——— Décor d'extérieur autour des maisons ———

type PropKind = "bois" | "tonneaux" | "caisses" | "foin" | "abreuvoir" | "potager" | "ruches" | "tombes" | "cible" | "charrette" | "banc" | "linge" | "sacs";

const PROPS: Record<string, PropKind[]> = {
  Auberge: ["tonneaux", "banc", "caisses", "linge"],
  Forge: ["bois", "abreuvoir", "sacs"],
  Temple: ["tombes", "tombes", "banc"],
  Marché: ["caisses", "tonneaux", "sacs", "charrette"],
  "Maison du chef": ["potager", "linge", "bois"],
  Écurie: ["foin", "abreuvoir", "charrette", "foin"],
  Échoppe: ["caisses", "tonneaux", "banc"],
  Moulin: ["sacs", "charrette", "sacs"],
  Herboriste: ["potager", "ruches", "potager"],
  Caserne: ["cible", "bois", "tonneaux"],
  Boulangerie: ["bois", "sacs", "bois"],
  Tonnellerie: ["tonneaux", "tonneaux", "bois"],
  Grange: ["foin", "charrette", "foin"],
  Tannerie: ["abreuvoir", "linge", "tonneaux"],
};

/** Longueur en cases le long du mur. */
const PROP_LEN: Record<PropKind, number> = { bois: 1, tonneaux: 1, caisses: 1, foin: 1, abreuvoir: 1, potager: 2, ruches: 1, tombes: 2, cible: 1, charrette: 2, banc: 1, linge: 2, sacs: 1 };

function paintOutdoorProps(v: V) {
  const { W, S } = v;
  v.buildings.forEach((b, bi) => {
    const r = rng(v.seed, 1600 + bi);
    const wanted = PROPS[b.label] ?? ["bois", "tonneaux"];
    const sides: Side[] = ["N", "S", "W", "E"];
    for (let k = sides.length - 1; k > 0; k--) {
      const j = Math.floor(r() * (k + 1));
      [sides[k], sides[j]] = [sides[j], sides[k]];
    }
    for (const kind of wanted) {
      if (r() < 0.2) continue;
      const len = PROP_LEN[kind];
      let placed = false;
      for (const side of sides) {
        if (placed) break;
        // cases dehors le long de la façade
        const run: Pt[] = [];
        if (side === "N" || side === "S") for (let x = b.x0; x <= b.x1; x++) run.push([x, side === "N" ? b.y0 - 1 : b.y1 + 1]);
        else for (let y = b.y0; y <= b.y1; y++) run.push([side === "W" ? b.x0 - 1 : b.x1 + 1, y]);
        const starts = run.map((_, i) => i).filter((i) => i + len <= run.length && run.slice(i, i + len).every(([x, y]) => freeCell(v, x, y)));
        if (!starts.length) continue;
        const i0 = pick(r, starts);
        const cells = run.slice(i0, i0 + len);
        for (const [x, y] of cells) v.used[y * W + x] = 1;
        // repère : x le long du mur, y en s'éloignant du mur
        const [fx, fy] = cells[0];
        const [lx, ly] = cells[len - 1];
        let ox: number, oy: number, rot: Side;
        if (side === "N") [ox, oy, rot] = [(lx + 1) * S, (fy + 1) * S, "S"];
        else if (side === "S") [ox, oy, rot] = [fx * S, fy * S, "N"];
        else if (side === "W") [ox, oy, rot] = [(fx + 1) * S, fy * S, "E"];
        else [ox, oy, rot] = [fx * S, (ly + 1) * S, "W"];
        // Pour N : repère tourné de π, l'axe x va vers la gauche ; on part donc du bout droit.
        inFrame(v.g, ox, oy, rot, () => drawProp(v, kind, len * S, r));
        placed = true;
      }
    }
  });
  // Une charrette dételée au bord de la rue, un puits s'il n'y a pas de fontaine.
  const r = rng(v.seed, 1700);
  const spots: Pt[] = [];
  for (let y = 1; y < v.H - 1; y++)
    for (let x = 1; x < v.W - 1; x++)
      if (freeCell(v, x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => v.tile(x + dx, y + dy) === T.route)) spots.push([x, y]);
  // la charrette : la case libre au bord de la rue la plus proche de la place, et sa voisine le long de la rue
  const [pcx, pcy] = [v.W / 2, v.H / 2];
  const pairs = spots
    .map(([x, y]) => {
      const alongX = v.tile(x, y - 1) === T.route || v.tile(x, y + 1) === T.route;
      const [nx, ny] = alongX ? [x + 1, y] : [x, y + 1];
      return { x, y, nx, ny, alongX, d: Math.hypot(x - pcx, y - pcy) };
    })
    .filter((p) => freeCell(v, p.nx, p.ny) && p.d > 4)
    .sort((a, b) => a.d - b.d);
  if (pairs.length) {
    const p = pairs[Math.floor(r() * Math.min(3, pairs.length))];
    v.used[p.y * W + p.x] = 1;
    v.used[p.ny * W + p.nx] = 1;
    const cx = (p.alongX ? p.x + 1 : p.x + 0.5) * S;
    const cy = (p.alongX ? p.y + 0.5 : p.y + 1) * S;
    cart(v, cx, cy, (p.alongX ? 0 : Math.PI / 2) + (r() < 0.5 ? Math.PI : 0) + (r() - 0.5) * 0.3, r);
  }
  if (!v.map.tiles.includes(T.eau) && spots.length > 3) {
    const [x, y] = spots[Math.floor(spots.length / 2)];
    v.used[y * W + x] = 1;
    placeWell(v, (x + 0.5) * S, (y + 0.5) * S, r, false);
  }
}

/** Objet d'extérieur dans le repère local : x de 0 à `len` le long du mur, y de 0 (mur) vers la rue. */
function drawProp(v: V, kind: PropKind, len: number, r: Rng) {
  const { g, pal, S } = v;
  const y0 = OVER + 4;
  switch (kind) {
    case "bois": {
      // tas de bûches rangées contre le mur, bouts sciés vers la rue
      const rows = 3;
      for (let k = 0; k < rows; k++)
        for (let x = 6 + (k % 2) * 4; x < len - 8; x += 8.5) {
          const yy = y0 + 4 + k * 7;
          solid(g, rectPts(x - 3.6, yy - 3, 7.4, 6.4), tint(pal.wood, (r() - 0.5) * 0.15 + 0.04), r, { ink: 0.8, shadow: k === rows - 1 ? 3 : 0 });
          g.strokeStyle = tint(pal.woodLight, 0, 0.8);
          g.lineWidth = 0.7;
          g.beginPath();
          g.arc(x + 0.2, yy + 0.2, 1.8, 0, Math.PI * 2);
          g.stroke();
        }
      // billot et hache
      disc(g, len * 0.72, y0 + 30, 6.5, pal.woodLight, r, { ink: 1.1 });
      inkLine(g, len * 0.72 - 2, y0 + 30, len * 0.72 + 9, y0 + 25, r, { width: 1.6, color: pal.woodDark });
      solid(g, [[len * 0.72 - 3, y0 + 27], [len * 0.72 + 1, y0 + 26], [len * 0.72 + 1, y0 + 33], [len * 0.72 - 3, y0 + 32]], pal.metal, r, { ink: 0.7, shadow: 0 });
      break;
    }
    case "tonneaux": {
      const n = 2 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) barrel(v, 12 + k * 13 + (r() - 0.5) * 3, y0 + 9 + (k % 2) * 9, 7 + r(), r);
      break;
    }
    case "caisses": {
      crate(v, 8, y0 + 2, 16, r, r() * 0.2);
      crate(v, 25, y0 + 4, 13, r, -0.15 + r() * 0.3);
      if (r() < 0.6) crate(v, 13, y0 + 20, 12, r, 0.5 + r() * 0.4);
      break;
    }
    case "foin": {
      for (let k = 0; k < 2; k++) {
        const x = 5 + k * 20;
        const yy = y0 + 2 + k * 6;
        solid(g, rectPts(x, yy, 18, 12), pal.straw, r, { ink: 1 });
        strokes(g, tint(pal.straw, -0.25, 0.7), 0.6, (p) => {
          for (let i = 0; i < 14; i++) {
            const sx = x + 1 + r() * 16;
            const sy = yy + 1 + r() * 10;
            p.moveTo(sx, sy);
            p.lineTo(sx + 3 + r() * 2, sy + (r() - 0.5) * 2);
          }
        });
        strokes(g, tint(pal.woodDark, 0, 0.8), 0.8, (p) => {
          p.moveTo(x + 6, yy);
          p.lineTo(x + 6, yy + 12);
          p.moveTo(x + 12, yy);
          p.lineTo(x + 12, yy + 12);
        });
      }
      stipple(g, rectShape(0, y0, len, 30), r, { density: 0.6, radius: 0.6, color: tint(pal.straw, -0.2, 0.6) });
      break;
    }
    case "abreuvoir": {
      solid(g, rectPts(5, y0 + 3, len - 12, 13), pal.wood, r, { ink: 1.3 });
      g.fillStyle = mixColor(pal.water, pal.mud, 0.25);
      g.fillRect(8, y0 + 6, len - 18, 7);
      g.fillStyle = "rgba(235,240,230,.35)";
      g.fillRect(10, y0 + 7, (len - 22) * 0.4, 1.2);
      inkLine(g, 8, y0 + 6, len - 10, y0 + 6, r, { width: 0.7 });
      // boue piétinée devant
      g.fillStyle = tint(pal.mud, 0, 0.3);
      g.beginPath();
      g.ellipse(len / 2 - 2, y0 + 24, len * 0.38, 6, 0, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "potager": {
      // carré de terre, rangs de légumes, clôture de branches tressées (bac hydroponique ou pneus selon le genre)
      const d = S - y0 - 6;
      if (v.flavor === "sf" || v.flavor === "ruines") {
        (v.flavor === "sf" ? hydroPlot : tirePlot)(v, 4, y0, len - 8, d, r);
        break;
      }
      const plot = rectPts(4, y0, len - 8, d);
      g.fillStyle = mixColor(pal.dirt, pal.mud, 0.45);
      g.fill(pathOf(plot));
      for (let row = 0; row < 3; row++) {
        const yy = y0 + 6 + row * ((d - 10) / 2);
        for (let x = 10; x < len - 10; x += 8 + r() * 2) {
          const col = row === 1 ? pal.leaves[1] : pal.leaves[(row + 2) % pal.leaves.length];
          disc(g, x, yy + (r() - 0.5) * 2, 2.6 + r() * 1.4, col, r, { ink: 0.6, shadow: 1 });
        }
      }
      wattle(v, [[4, y0], [4, y0 + d], [len - 4, y0 + d], [len - 4, y0]], r);
      break;
    }
    case "ruches": {
      for (let k = 0; k < 3; k++) {
        const cx = 10 + k * 13;
        const cy = y0 + 10 + (k % 2) * 4;
        disc(g, cx, cy, 5.5, pal.straw, r, { ink: 1 });
        g.strokeStyle = tint(pal.straw, -0.3, 0.8);
        g.lineWidth = 0.6;
        for (const rr of [2, 3.8]) {
          g.beginPath();
          g.arc(cx, cy, rr, 0, Math.PI * 2);
          g.stroke();
        }
      }
      break;
    }
    case "tombes": {
      // petit enclos des morts : stèles, tertres, une croix de bois
      const n = 3;
      for (let k = 0; k < n; k++) {
        const x = 16 + k * ((len - 32) / (n - 1)) + (r() - 0.5) * 4;
        const yy = y0 + 4 + (r() - 0.5) * 3;
        // tertre de terre fraîche ou herbue, stèle ou croix à la tête
        const mound = smoothPoints(blobPoints(r, x, yy + 16, 7.5, 12, 8, 0.12), 2);
        solid(g, mound, k === 1 ? mixColor(pal.dirt, pal.mud, 0.3) : mixColor(pal.grassLush, pal.mud, 0.35), r, { ink: 0.8, shadow: 0 });
        if (k === 1) {
          inkLine(g, x, yy - 5, x, yy + 7, r, { width: 2.6, color: pal.woodDark, taper: 0 });
          inkLine(g, x - 5, yy - 1, x + 5, yy - 1, r, { width: 2.4, color: pal.woodDark, taper: 0 });
        } else {
          const st: Pt[] = [[x - 7, yy + 3], [x - 7, yy - 1], [x - 4, yy - 4], [x + 4, yy - 4], [x + 7, yy - 1], [x + 7, yy + 3]];
          solid(g, st, pal.stone, r, { ink: 1.2, shadow: 4 });
          stipple(g, shapeOf(st), r, { density: 3, radius: 0.5, color: "rgba(70,95,50,.6)" });
        }
      }
      wattle(v, [[2, y0 - 2], [2, y0 + 32], [len - 2, y0 + 32], [len - 2, y0 - 2]], r);
      break;
    }
    case "cible": {
      // mannequin d'entraînement et cible de paille
      inkLine(g, 8, y0 + 14, 26, y0 + 14, r, { width: 2.5, color: pal.woodDark });
      disc(g, 17, y0 + 14, 5, pal.straw, r, { ink: 1 });
      const cx = 34;
      const cy = y0 + 22;
      disc(g, cx, cy, 8, "#e5d8b5", r, { ink: 1.2, shadow: 4 });
      disc(g, cx, cy, 5.5, pal.cloth[0], r, { ink: 0.6, shadow: 0, light: false });
      disc(g, cx, cy, 2.5, "#e5d8b5", r, { ink: 0.6, shadow: 0, light: false });
      inkLine(g, cx - 4, cy + 1, cx + 6, cy - 6, r, { width: 0.9 });
      break;
    }
    case "charrette": {
      cart(v, len / 2, y0 + S * 0.45, 0.05 * (r() - 0.5), r);
      break;
    }
    case "banc": {
      solid(g, rectPts(6, y0 + 1, len - 14, 7), pal.wood, r, { ink: 1.1 });
      if (r() < 0.6) {
        disc(g, len - 12, y0 + 18, 3.2, pal.metal, r, { ink: 0.8, shadow: 2 });
      }
      break;
    }
    case "linge": {
      // corde entre deux piquets, draps et chemises qui sèchent
      const yy = y0 + 18;
      disc(g, 8, yy, 2.5, pal.woodDark, r, { ink: 0.8 });
      disc(g, len - 8, yy, 2.5, pal.woodDark, r, { ink: 0.8 });
      let x = 14;
      while (x < len - 22) {
        const w = 10 + r() * 12;
        const col = r() < 0.5 ? "#e6dcc4" : pick(r, v.pal.cloth);
        solid(g, [[x, yy - 1.5], [x + w, yy - 1.5], [x + w + 1.5, yy + 6], [x - 1, yy + 6.5]], col, r, { ink: 0.9, shadow: 8 });
        x += w + 4 + r() * 4;
      }
      inkLine(g, 8, yy, len - 8, yy, r, { width: 0.7, wobble: 0.3 });
      break;
    }
    case "sacs": {
      sack(v, 10, y0 + 8, r);
      sack(v, 22, y0 + 6, r);
      sack(v, 16, y0 + 18, r);
      break;
    }
  }
}

/** Clôture de branches tressées : piquets et clayonnage. */
function wattle(v: V, pts: Pt[], r: Rng) {
  const { g, pal } = v;
  inkPolyline(g, pts, r, { width: 2.4, color: pal.woodDark, wobble: 0.6, taper: 0 });
  strokes(g, tint(pal.woodLight, 0, 0.7), 0.6, (p) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const d = Math.hypot(bx - ax, by - ay);
      for (let s = 2; s < d; s += 3) {
        const x = ax + ((bx - ax) * s) / d;
        const y = ay + ((by - ay) * s) / d;
        p.moveTo(x - 1, y - 1);
        p.lineTo(x + 1, y + 1);
      }
    }
  });
  for (const [x, y] of pts) {
    g.fillStyle = pal.woodDark;
    g.beginPath();
    g.arc(x, y, 2, 0, Math.PI * 2);
    g.fill();
  }
}

function barrel(v: V, cx: number, cy: number, rad: number, r: Rng) {
  const { g, pal } = v;
  disc(g, cx, cy, rad, pal.wood, r, { ink: 1.2, shadow: 3 });
  g.strokeStyle = "rgba(22,16,10,.85)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(cx, cy, rad * 0.78, 0, Math.PI * 2);
  g.stroke();
  strokes(g, tint(pal.woodDark, 0, 0.6), 0.6, (p) => {
    for (const k of [-0.35, 0, 0.35]) {
      p.moveTo(cx - rad * 0.6, cy + k * rad);
      p.lineTo(cx + rad * 0.6, cy + k * rad);
    }
  });
  g.fillStyle = "#1a120a";
  g.beginPath();
  g.arc(cx + rad * 0.3, cy - rad * 0.15, 0.9, 0, Math.PI * 2);
  g.fill();
}

function crate(v: V, x: number, y: number, s: number, r: Rng, rot = 0) {
  const { g, pal } = v;
  g.save();
  g.translate(x + s / 2, y + s / 2);
  g.rotate(rot);
  solid(g, rectPts(-s / 2, -s / 2, s, s), pal.woodLight, r, { ink: 1.1, shadow: 3 });
  strokes(g, tint(pal.woodDark, 0, 0.75), 0.8, (p) => {
    p.moveTo(-s / 2 + 2, -s / 2 + 2);
    p.lineTo(s / 2 - 2, s / 2 - 2);
    p.moveTo(-s / 2 + 2, -s / 2 + 2.5);
    p.lineTo(s / 2 - 2, -s / 2 + 2.5);
    p.moveTo(-s / 2 + 2, s / 2 - 2.5);
    p.lineTo(s / 2 - 2, s / 2 - 2.5);
  });
  g.restore();
}

function sack(v: V, cx: number, cy: number, r: Rng) {
  const { g, pal } = v;
  const col = mixColor(pal.straw, "#b8a27a", 0.5);
  solid(g, smoothPoints(blobPoints(r, cx, cy, 7, 6, 7, 0.15, r() * 3), 1), col, r, { ink: 1, shadow: 3 });
  inkLine(g, cx - 2, cy - 4, cx + 2, cy - 5, r, { width: 0.8 });
  strokes(g, tint(col, -0.25, 0.6), 0.6, (p) => {
    p.moveTo(cx - 3, cy);
    p.quadraticCurveTo(cx, cy + 2, cx + 3, cy + 1);
  });
}

/** Puits : margelle de pierres encrées, eau presque noire, deux montants et un treuil, un seau à côté. */
function paintWell(v: V, cx: number, cy: number, r: Rng, big = false) {
  const { g, S, pal } = v;
  const R = big ? S * 0.74 : S * 0.5;
  const Ri = R * 0.62;
  // ombre portée de la margelle et du treuil
  const shadow = new Path2D();
  shadow.arc(cx + 9, cy + 11, R, 0, Math.PI * 2);
  castShadow(g, { path: shadow, box: [cx - R + 9, cy - R + 11, R * 2, R * 2] }, r, { alpha: 0.4 });
  // margelle : 10 à 12 pierres taillées en couronne, chacune encrée
  const n = 10 + Math.floor(r() * 3);
  const a0 = r() * Math.PI;
  for (let k = 0; k < n; k++) {
    const a = a0 + (k / n) * Math.PI * 2 + 0.03;
    const b = a0 + ((k + 1) / n) * Math.PI * 2 - 0.03;
    const ro = R - r() * 1.5;
    const ri = Ri + r() * 1;
    const pts: Pt[] = [];
    for (let j = 0; j <= 4; j++) {
      const t = a + ((b - a) * j) / 4;
      pts.push([cx + Math.cos(t) * ro, cy + Math.sin(t) * ro]);
    }
    for (let j = 4; j >= 0; j--) {
      const t = a + ((b - a) * j) / 4;
      pts.push([cx + Math.cos(t) * ri, cy + Math.sin(t) * ri]);
    }
    const mid = (a + b) / 2;
    const lit = -(Math.cos(mid) * 0.6 + Math.sin(mid) * 0.8);
    solid(g, pts, tint(pal.stone, lit * 0.1 + (r() - 0.5) * 0.08), r, { ink: 0, shadow: 0 });
    if (r() < 0.3) hatchLines(g, shapeOf(pts), r, { spacing: 2.4, width: 0.5, color: "rgba(22,16,10,.45)" });
    inkStroke(g, pts, r, { width: 1.1, closed: true, breaks: false, wobble: 0.3 });
  }
  // eau sombre au fond, ombre de la margelle dedans, un reflet de ciel
  g.fillStyle = "#1d2a2a";
  g.beginPath();
  g.arc(cx, cy, Ri - 1, 0, Math.PI * 2);
  g.fill();
  const dg = g.createLinearGradient(cx - Ri, cy - Ri, cx + Ri * 0.3, cy + Ri * 0.3);
  dg.addColorStop(0, "rgba(5,6,6,.85)");
  dg.addColorStop(1, "rgba(5,6,6,0)");
  g.fillStyle = dg;
  g.beginPath();
  g.arc(cx, cy, Ri - 1, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = tint(mixColor(pal.water, "#cfe6ea", 0.4), 0, 0.85);
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx + 2, cy + 3, Ri * 0.45, 0.2, 1.3);
  g.stroke();
  inkStroke(
    g,
    densify(Array.from({ length: 24 }, (_, k) => [cx + Math.cos((k / 24) * Math.PI * 2) * (Ri - 1), cy + Math.sin((k / 24) * Math.PI * 2) * (Ri - 1)] as Pt), 6, true),
    r,
    { width: 1.4, closed: true, breaks: false },
  );
  // montants et treuil : poutre de bois au-dessus de l'eau, corde enroulée, manivelle
  const ang = (r() - 0.5) * 0.5;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const p0: Pt = [cx - ux * (R - 3), cy - uy * (R - 3)];
  const p1: Pt = [cx + ux * (R - 3), cy + uy * (R - 3)];
  g.save();
  g.translate(6, 8);
  inkPolyline(g, [p0, p1], r, { width: 7, color: "rgba(30,20,12,.35)", taper: 0 });
  g.restore();
  const beam: Pt[] = [[p0[0] - uy * 3.2, p0[1] + ux * 3.2], [p1[0] - uy * 3.2, p1[1] + ux * 3.2], [p1[0] + uy * 3.2, p1[1] - ux * 3.2], [p0[0] + uy * 3.2, p0[1] - ux * 3.2]];
  solid(g, beam, pal.wood, r, { ink: 0, shadow: 0 });
  strokes(g, tint(pal.woodDark, 0, 0.8), 0.6, (p) => {
    for (let k = -3; k <= 3; k++) {
      const x = cx + ux * k * 2.2;
      const y = cy + uy * k * 2.2;
      p.moveTo(x - uy * 3.2, y + ux * 3.2);
      p.lineTo(x + uy * 3.2, y - ux * 3.2);
    }
  });
  inkStroke(g, beam, r, { width: 1.2, closed: true, breaks: false });
  for (const [px, py] of [p0, p1]) {
    const post = rectPts(px - 4, py - 4, 8, 8);
    solid(g, post, pal.woodDark, r, { ink: 0, shadow: 3, light: false });
    inkStroke(g, post, r, { width: 1.2, closed: true, breaks: false });
  }
  // petit toit de bardeaux à deux pans au-dessus du treuil : faîte le long de la poutre, l'eau reste visible des deux côtés
  const half = big ? 9 : 7;
  const rl = R + 2;
  const at = (a: number, n: number): Pt => [cx + ux * a - uy * n, cy + uy * a + ux * n];
  g.save();
  g.translate(8, 10);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(60,44,30,.4)";
  g.fill(pathOf([at(-rl, -half), at(rl, -half), at(rl, half), at(-rl, half)]));
  g.restore();
  for (const sgn of [-1, 1]) {
    const pan = [at(-rl, 0), at(rl, 0), at(rl, sgn * half), at(-rl, sgn * half)];
    solid(g, pan, tint(pal.roof.bardeaux, sgn < 0 ? 0.1 : -0.12), r, { ink: 0, shadow: 0, light: false });
    strokes(g, tint(pal.roof.bardeaux, -0.35, 0.8), 0.6, (p) => {
      for (let n = 3; n < half; n += 3) {
        const [ax, ay] = at(-rl, sgn * n);
        const [bx, by] = at(rl, sgn * n);
        p.moveTo(ax, ay);
        p.lineTo(bx, by);
      }
      for (let a = -rl + 3; a < rl; a += 4 + r() * 2) {
        const n0 = 3 * Math.floor(r() * (half / 3));
        const [ax, ay] = at(a, sgn * n0);
        const [bx, by] = at(a, sgn * Math.min(half, n0 + 3));
        p.moveTo(ax, ay);
        p.lineTo(bx, by);
      }
    });
    inkStroke(g, densify(pan, 6, true), r, { width: 1.2, closed: true, breaks: false, color: WALL_INK });
  }
  inkLine(g, ...at(-rl - 2, 0), ...at(rl + 2, 0), r, { width: 1.8, color: WALL_INK, taper: 2, wobble: 0.2 });
  // manivelle et corde qui descend dans le puits
  inkLine(g, p1[0], p1[1], p1[0] + ux * 9 + uy * 4, p1[1] + uy * 9 - ux * 4, r, { width: 1.6, color: "#2b2a28", taper: 0 });
  inkLine(g, ...at(R * 0.2, half + 1), ...at(R * 0.3, half + 6), r, { width: 0.9, color: "#5a4a32", taper: 1 });
  // seau posé sur les pavés
  const bx = cx + R * 0.95;
  const by = cy + R * 0.7;
  disc(g, bx, by, 5.5, pal.wood, r, { ink: 1.1, shadow: 3 });
  g.strokeStyle = "#2b2a28";
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(bx, by, 4, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#1d2a2a";
  g.beginPath();
  g.arc(bx, by, 3, 0, Math.PI * 2);
  g.fill();
}

/** Le point d'eau du village selon le genre : puits, réservoir, buse de ferraille ; au port, des filets qui sèchent autour. */
function placeWell(v: V, cx: number, cy: number, r: Rng, big: boolean) {
  const { S } = v;
  if (v.flavor === "sf") return paintTank(v, cx, cy, r);
  if (v.flavor === "ruines") return paintScrapWell(v, cx, cy, r);
  if (v.flavor === "western") return westernWater(v, cx, cy, r);
  if (v.flavor === "port") {
    lobsterPot(v, cx - S * 1.2, cy + S * 0.75, r, 0.3);
    lobsterPot(v, cx - S * 0.75, cy + S * 1.05, r, -0.4);
    fishingNet(v, smoothPoints(blobPoints(r, cx - S * 1.05, cy - S * 0.8, S * 0.85, S * 0.45, 10, 0.3, -0.4), 2), r);
    barrel(v, cx + S * 1.0, cy - S * 0.6, 10, r);
    barrel(v, cx + S * 1.2, cy - S * 0.12, 9.5, r);
    barrel(v, cx + S * 0.75, cy - S * 0.05, 9, r);
  }
  paintWell(v, cx, cy, r, big);
}

/** Étals du marché sur la place : bâche rayée qui fléchit sur quatre perches, table de marchandises devant, paniers. */
function paintStalls(v: V, well: Pt) {
  const { g, S, pal } = v;
  const r = rng(v.seed, 5100);
  const [wx, wy] = well;
  // Contre le bord de la place : deux cases pavées côte à côte, le dos à l'herbe ou à un mur (sy : côté du bord),
  // loin du puits, jamais là où une rue entre sur la place ni devant une porte.
  const paved = v.paved;
  const pv = (x: number, y: number) => !!paved && x >= 0 && y >= 0 && x < v.W && y < v.H && paved[y * v.W + x] === 1;
  const rim = (x: number, y: number) => v.tile(x, y) !== T.route && v.tile(x, y) !== T.eau;
  const spots: [number, number, number, number][] = [];
  for (let y = 0; y < v.H; y++)
    for (let x = 0; x < v.W - 1; x++)
      for (const sy of [-1, 1]) {
        if (!pv(x, y) || !pv(x + 1, y) || !pv(x, y - sy) || !pv(x + 1, y - sy)) continue;
        if (!rim(x, y + sy) || !rim(x + 1, y + sy)) continue;
        if (Math.max(Math.abs(x + 0.5 - wx), Math.abs(y - wy)) < 2.5) continue;
        if ([x - 1, x + 2].some((xx) => v.tile(xx, y) === T.route && !pv(xx, y))) continue;
        let door = false;
        for (const b of v.buildings) for (const d of b.doors) if (Math.abs(outward(d)[1] - y) <= 1 && outward(d)[0] >= x - 1 && outward(d)[0] <= x + 2) door = true;
        if (!door) spots.push([x, y, 0, sy]);
      }
  for (let k = spots.length - 1; k > 0; k--) {
    const j = Math.floor(r() * (k + 1));
    [spots[k], spots[j]] = [spots[j], spots[k]];
  }
  const chosen: [number, number, number, number][] = [];
  for (const sp of spots) if (chosen.length < 3 && chosen.every((c) => Math.abs(c[0] - sp[0]) + Math.abs(c[1] - sp[1]) >= 4)) chosen.push(sp);
  let made = 0;
  const goods = ["pains", "poissons", "draps", "paniers", "pommes"] as const;
  for (const [x0, y0, , sy] of chosen) {
    made++;
    const x = x0 * S + 5;
    const y = y0 * S + (sy < 0 ? 3 : 10);
    const w = S * 2 - 10;
    const h = S * 0.78;
    // science-fiction : un conteneur ouvert ; post-apocalypse : un appentis de tôle et son bric-à-brac
    if (v.flavor === "sf") {
      container(v, x, y, w, h, r);
      continue;
    }
    if (v.flavor === "ruines") {
      scrapStall(v, x, y, w, h, sy, r);
      continue;
    }
    castShadow(g, shapeOf(boxShadow(x, y, x + w, y + h, 14, 17)), r, { alpha: 0.32 });
    // table de marchandises côté place, sous le bord avant de la bâche
    const front = sy < 0 ? y + h - 4 : y - 14;
    const table = rectPts(x + 4, front, w - 8, 18);
    solid(g, table, pal.woodLight, r, { ink: 1.3, shadow: 3 });
    // au port, on vend du poisson, et un filet sèche à côté de l'étal
    const kind = v.flavor === "port" && made === 1 ? "poissons" : goods[(made + Math.floor(r() * goods.length)) % goods.length];
    if (v.flavor === "port") fishingNet(v, smoothPoints(blobPoints(r, x + w + 16, y + h / 2, 20, 14, 9, 0.3), 2), r);
    const [tx0, ty0] = table[0];
    const [tx1, ty1] = table[2];
    for (let px = tx0 + 7; px < tx1 - 5; px += 9 + r() * 3) {
      const py = (ty0 + ty1) / 2 + (r() - 0.5) * 4;
      if (kind === "pains") {
        solid(g, smoothPoints(blobPoints(r, px, py, 4.6, 3.2, 7, 0.1, r()), 1), "#b98a4a", r, { ink: 0.8, shadow: 1 });
        inkLine(g, px - 2, py - 1, px + 2, py + 1, r, { width: 0.5, color: "rgba(80,40,10,.7)", taper: 1 });
      } else if (kind === "poissons") {
        const a = (r() - 0.5) * 0.6;
        g.save();
        g.translate(px, py);
        g.rotate(a);
        solid(g, [[-5, 0], [-2, -2.4], [3, -1.6], [5, 0], [3, 1.6], [-2, 2.4]], "#9aa4a4", r, { ink: 0.7, shadow: 1 });
        solid(g, [[5, 0], [8, -2.4], [8, 2.4]], "#7e8888", r, { ink: 0.6, shadow: 0 });
        g.restore();
      } else if (kind === "draps") {
        solid(g, rectPts(px - 3.5, ty0 + 2, 7, ty1 - ty0 - 4), pick(r, pal.cloth), r, { ink: 0.8, shadow: 1 });
        px += 1;
      } else if (kind === "pommes") {
        for (let k = 0; k < 3; k++) disc(g, px + (r() - 0.5) * 6, py + (r() - 0.5) * 6, 1.8, pick(r, ["#b8473a", "#c9a34e", "#7a8a3a"]), r, { ink: 0.5, shadow: 0, light: false });
      } else {
        disc(g, px, py, 4.2, pal.straw, r, { ink: 0.8, shadow: 1 });
        g.strokeStyle = tint(pal.straw, -0.35, 0.8);
        g.lineWidth = 0.5;
        g.beginPath();
        g.arc(px, py, 2.5, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // perches aux quatre coins
    for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]] as Pt[])
      disc(g, px, py, 2.6, pal.woodDark, r, { ink: 0.9, shadow: 3, light: false });
    // bâche : rayures, faîte au milieu, chaque pan fléchit entre les perches
    const sag = 3;
    const awning: Pt[] = [];
    for (let k = 0; k <= 8; k++) awning.push([x + (w * k) / 8, y + Math.sin((k / 8) * Math.PI) * sag]);
    for (let k = 8; k >= 0; k--) awning.push([x + (w * k) / 8, y + h - Math.sin((k / 8) * Math.PI) * sag]);
    const col = pick(r, [pal.cloth[0], pal.cloth[1], pal.cloth[4]]);
    g.save();
    g.clip(pathOf(awning));
    g.fillStyle = "#e3d6b4";
    g.fillRect(x, y, w, h);
    g.fillStyle = col;
    for (let k = 0; k < w; k += 12) g.fillRect(x + k, y, 6, h);
    const lg = g.createLinearGradient(0, y, 0, y + h);
    lg.addColorStop(0, "rgba(255,246,220,.2)");
    lg.addColorStop(0.5, "rgba(255,246,220,0)");
    lg.addColorStop(0.5, "rgba(18,12,6,.12)");
    lg.addColorStop(1, "rgba(18,12,6,.3)");
    g.fillStyle = lg;
    g.fillRect(x, y, w, h);
    // plis de la toile
    strokes(g, "rgba(22,16,10,.3)", 0.6, (p) => {
      for (let k = 1; k < 5; k++) {
        const px = x + (w * k) / 5 + (r() - 0.5) * 4;
        p.moveTo(px, y + 2);
        p.quadraticCurveTo(px + 2, y + h / 2, px, y + h - 2);
      }
    });
    g.restore();
    inkStroke(g, awning, r, { width: 1.6, closed: true, breaks: false, color: WALL_INK });
    inkLine(g, x - 2, y + h / 2, x + w + 2, y + h / 2, r, { width: 1.1, taper: 0, color: WALL_INK });
    // lambrequin festonné sur le bord avant
    const fy = sy < 0 ? y + h : y;
    const fest: Pt[] = [];
    for (let k = 0; k <= w; k += 6) fest.push([x + k, fy], [x + k + 3, fy + (sy < 0 ? 4 : -4)]);
    g.fillStyle = col;
    g.fill(pathOf([...fest, [x + w, fy]]));
    inkPolyline(g, fest, r, { width: 0.8, wobble: 0.2, taper: 0 });
    // paniers et sacs posés de côté
    const side = sy < 0 ? y + h + 22 : y - 30;
    sack(v, x + w + 8, side, r);
    if (r() < 0.7) crate(v, x - 18, side - 6, 13, r, (r() - 0.5) * 0.4);
  }
}

// ——— Intérieurs ———

type Anchor = "mur" | "coin" | "libre" | "centre" | "fond";
interface Item {
  /** Taille en demi-cases : w le long du mur, h vers le centre de la pièce. */
  w: number;
  h: number;
  anchor: Anchor;
  draw: (x: number, y: number, w: number, h: number, side: Side) => void;
}

function paintInterior(v: V, b: Building) {
  const { g, S } = v;
  const r = rng(v.seed, 2000 + b.x0, b.y0);
  // Le sol court jusqu'à la face intérieure du mur ; les meubles adossés mordent sur la case de mur.
  const { i } = shellRects(v, b);
  const [rx, ry, rw, rh] = [i[0], i[1], i[2] - i[0], i[3] - i[1]];
  const room = rectShape(rx, ry, rw, rh);
  paintFloor(v, b, room, rx, ry, rw, rh, r);
  stains(v, room, rx, ry, rw, rh, r);
  // Lumière des fenêtres côté jour (haut et gauche) : flaque claire sur le sol.
  for (const w of b.windows) {
    if (w.side !== "N" && w.side !== "W") continue;
    g.save();
    g.clip(room.path);
    const cx = (w.x + 0.5) * S;
    const cy = (w.y + 0.5) * S;
    const p: Pt[] = w.side === "N" ? [[cx - 10, ry], [cx + 10, ry], [cx + 24, ry + S * 1.5], [cx + 2, ry + S * 1.5]] : [[rx, cy - 10], [rx, cy + 10], [rx + S * 1.5, cy + 24], [rx + S * 1.5, cy + 2]];
    const grad = g.createLinearGradient(p[0][0], p[0][1], p[3][0], p[3][1]);
    grad.addColorStop(0, "rgba(255,244,210,.34)");
    grad.addColorStop(1, "rgba(255,244,210,0)");
    g.fillStyle = grad;
    g.fill(pathOf(p));
    g.restore();
  }
  furnish(v, b, (b.x0 + 1) * S, (b.y0 + 1) * S, (b.x1 - b.x0 - 1) * S, (b.y1 - b.y0 - 1) * S, r);
  // Ombre portée des murs nord et ouest sur le sol (lumière du haut à gauche) : hachures, croisées dans l'angle.
  g.save();
  g.clip(room.path);
  g.globalCompositeOperation = "multiply";
  const band = 11;
  const shade = shapeOf([[[rx, ry], [rx + rw, ry], [rx + rw - 4, ry + band], [rx + band, ry + band], [rx + band - 2, ry + rh - 4], [rx, ry + rh]]]);
  g.fillStyle = "rgba(60,44,28,.28)";
  g.fill(shade.path);
  g.globalCompositeOperation = "source-over";
  hatchLines(g, shade, r, { spacing: 3.4, width: 0.6, color: "rgba(22,16,10,.55)", angle: -Math.PI / 4 });
  hatchLines(g, rectShape(rx, ry, band + 6, band + 6), r, { spacing: 3, width: 0.55, color: "rgba(22,16,10,.5)", angle: Math.PI / 4 });
  g.restore();
}

function paintFloor(v: V, b: Building, room: Shape, ix: number, iy: number, iw: number, ih: number, r: Rng) {
  const { g, pal } = v;
  if (b.floor === "planches") {
    washFill(g, room, pal.plank, r, { alpha: 1, edge: 4, variation: 0.6, blot: 30, granulation: 0.5 });
    const alongX = iw >= ih;
    const len = alongX ? iw : ih;
    const across = alongX ? ih : iw;
    g.save();
    g.clip(room.path);
    for (let k = 0, j = 0; k < across; k += 9.6, j++) {
      // une latte : léger écart de teinte, joints d'about décalés
      const col = tint(pal.plank, (r() - 0.5) * 0.08, 0.5);
      g.fillStyle = col;
      if (alongX) g.fillRect(ix, iy + k, iw, 9.6);
      else g.fillRect(ix + k, iy, 9.6, ih);
      const pos = (alongX ? iy : ix) + k;
      const pts: Pt[] = alongX ? [[ix, pos], [ix + iw, pos]] : [[pos, iy], [pos, iy + ih]];
      if (k > 0) inkPolyline(g, pts, r, { width: 0.8, color: "rgba(30,18,8,.55)", wobble: 0.4, taper: 0 });
      let s = (j % 3) * 22 + r() * 20;
      while (s < len) {
        const a = (alongX ? ix : iy) + s;
        if (alongX)
          inkLine(g, a, pos + 1, a, pos + 8.6, r, { width: 0.7, color: "rgba(30,18,8,.5)", wobble: 0.2, taper: 0 });
        else
          inkLine(g, pos + 1, a, pos + 8.6, a, r, { width: 0.7, color: "rgba(30,18,8,.5)", wobble: 0.2, taper: 0 });
        s += 40 + r() * 50;
      }
      // fil du bois et nœuds
      strokes(g, tint(pal.plank, -0.15, 0.35), 0.5, (p) => {
        for (let q = 0; q < len; q += 30 + r() * 30) {
          const a = (alongX ? ix : iy) + q;
          const o = pos + 3 + r() * 4;
          if (alongX) {
            p.moveTo(a, o);
            p.quadraticCurveTo(a + 8, o - 1.2, a + 18, o);
          } else {
            p.moveTo(o, a);
            p.quadraticCurveTo(o - 1.2, a + 8, o, a + 18);
          }
        }
      });
    }
    g.restore();
  } else if (b.floor === "dalles" || b.floor === "plaques") {
    const metal = b.floor === "plaques";
    g.fillStyle = tint(metal ? pal.metal : pal.flag, -0.22);
    g.fill(room.path);
    g.save();
    g.clip(room.path);
    // dalles irrégulières : rangées de hauteur variable, découpées en longueurs inégales
    let y = iy;
    while (y < iy + ih) {
      const rh = metal ? 24 : 14 + r() * 12;
      let x = ix - r() * 14;
      while (x < ix + iw) {
        const rw = metal ? 24 : 16 + r() * 18;
        const pts: Pt[] = metal
          ? rectPts(x + 1, y + 1, rw - 2, rh - 2)
          : [[x + 1 + r(), y + 1 + r()], [x + rw - 1 - r(), y + 1 + r()], [x + rw - 1 - r(), y + rh - 1 - r()], [x + 1 + r(), y + rh - 1 - r()]];
        const col = tint(metal ? pal.metal : pal.flag, (r() - 0.5) * 0.1);
        g.fillStyle = col;
        g.fill(pathOf(pts));
        if (!metal && r() < 0.12) {
          // fissure
          inkPolyline(g, [[x + rw * 0.2, y + rh * 0.3], [x + rw * 0.5, y + rh * 0.55], [x + rw * 0.65, y + rh * 0.9]], r, { width: 0.6, color: "rgba(22,16,10,.6)", taper: 6 });
        }
        if (metal)
          for (const [px, py] of [[x + 4, y + 4], [x + rw - 4, y + 4], [x + 4, y + rh - 4], [x + rw - 4, y + rh - 4]]) {
            g.fillStyle = tint(pal.metal, 0.15, 0.8);
            g.fillRect(px - 1, py - 1, 2, 2);
          }
        inkPolyline(g, pts, r, { width: 0.7, closed: true, color: "rgba(22,16,10,.6)", wobble: 0.3 });
        x += rw;
      }
      y += rh;
    }
    stipple(g, room, r, { density: 0.12, radius: 0.6, color: "rgba(22,16,10,.35)" });
    g.restore();
  } else {
    // terre battue, paille éparse
    washFill(g, room, mixColor(pal.dirt, pal.mud, 0.25), r, { alpha: 1, edge: 5, variation: 0.9, blot: 26, granulation: 1 });
    g.save();
    g.clip(room.path);
    strokes(g, tint(pal.straw, 0, 0.6), 0.7, (p) => {
      const n = Math.round((iw * ih) / 90);
      for (let i = 0; i < n; i++) {
        const x = ix + r() * iw;
        const y = iy + r() * ih;
        const a = r() * Math.PI;
        p.moveTo(x, y);
        p.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
      }
    });
    stipple(g, room, r, { density: 0.3, radius: 0.6, color: tint(pal.mud, -0.15, 0.5) });
    g.restore();
  }
}

/** Meubles selon le nom du bâtiment, posés sur une grille de demi-cases, jamais devant la porte. */
function furnish(v: V, b: Building, ix: number, iy: number, iw: number, ih: number, r: Rng) {
  const { S } = v;
  const h = S / 2;
  const GW = Math.round(iw / h);
  const GH = Math.round(ih / h);
  const occ = new Uint8Array(GW * GH);
  // Case d'entrée (et la suivante si la pièce est profonde) laissée libre.
  const doorSides = new Set(b.doors.map((d) => d.side));
  for (const d of b.doors) {
    const cx = d.x - (b.x0 + 1);
    const cy = d.y - (b.y0 + 1);
    const [ex, ey] = d.side === "N" ? [cx, 0] : d.side === "S" ? [cx, GH / 2 - 1] : d.side === "W" ? [0, cy] : [GW / 2 - 1, cy];
    for (let k = 0; k < 2; k++) {
      const sx = ex + (d.side === "W" ? k : d.side === "E" ? -k : 0);
      const sy = ey + (d.side === "N" ? k : d.side === "S" ? -k : 0);
      if (k === 1 && (d.side === "N" || d.side === "S" ? GH < 6 : GW < 6)) break;
      for (let yy = sy * 2; yy < sy * 2 + 2; yy++) for (let xx = sx * 2; xx < sx * 2 + 2; xx++) if (xx >= 0 && yy >= 0 && xx < GW && yy < GH) occ[yy * GW + xx] = 1;
    }
  }
  // `halo` : demi-cases libres exigées autour (allée entre les meubles posés au milieu de la pièce)
  const free = (x: number, y: number, w: number, hh: number, halo = 0) => {
    if (x < 0 || y < 0 || x + w > GW || y + hh > GH) return false;
    for (let yy = Math.max(0, y - halo); yy < Math.min(GH, y + hh + halo); yy++) for (let xx = Math.max(0, x - halo); xx < Math.min(GW, x + w + halo); xx++) if (occ[yy * GW + xx]) return false;
    return true;
  };
  const far: Side = b.doors.length ? ({ N: "S", S: "N", W: "E", E: "W" } as const)[b.doors[0].side] : "N";
  const place = (it: Item, halo = it.anchor === "libre" || it.anchor === "centre" ? 1 : 0): boolean => {
    const cands: { x: number; y: number; w: number; h: number; side: Side; score: number }[] = [];
    for (const side of ["N", "S", "W", "E"] as Side[]) {
      const horiz = side === "N" || side === "S";
      const w = horiz ? it.w : it.h;
      const hh = horiz ? it.h : it.w;
      for (let y = 0; y + hh <= GH; y++)
        for (let x = 0; x + w <= GW; x++) {
          const touches = side === "N" ? y === 0 : side === "S" ? y + hh === GH : side === "W" ? x === 0 : x + w === GW;
          const corner = (x === 0 || x + w === GW) && (y === 0 || y + hh === GH);
          if (it.anchor === "mur" && (!touches || doorSides.has(side))) continue;
          if (it.anchor === "fond" && (!touches || side !== far)) continue;
          if (it.anchor === "coin" && (!touches || !corner)) continue;
          if ((it.anchor === "libre" || it.anchor === "centre") && side !== "S") continue;
          if (!free(x, y, w, hh, halo)) continue;
          const dx = x + w / 2 - GW / 2;
          const dy = y + hh / 2 - GH / 2;
          let score = r();
          if (it.anchor === "centre") score = -Math.hypot(dx, dy) + r() * 0.3;
          if (it.anchor === "libre") score = r() - (x === 0 || y === 0 || x + w === GW || y + hh === GH ? 0.6 : 0);
          cands.push({ x, y, w, h: hh, side, score });
        }
    }
    // sans allée possible tout autour, on accepte de coller le meuble à ses voisins
    if (!cands.length) return halo > 0 ? place(it, 0) : false;
    cands.sort((a, b2) => b2.score - a.score);
    const c = cands[0];
    for (let yy = c.y; yy < c.y + c.h; yy++) for (let xx = c.x; xx < c.x + c.w; xx++) occ[yy * GW + xx] = 1;
    // l'objet reçoit son rectangle en px ; `side` = mur contre lequel il est posé (S par défaut s'il est libre)
    // Meuble adossé : il recule jusqu'au mur dessiné, sur la case de mur (que les pions ne prennent pas).
    let [px, py, pw, ph] = [ix + c.x * h, iy + c.y * h, c.w * h, c.h * h];
    if (it.anchor === "mur" || it.anchor === "coin" || it.anchor === "fond") {
      const ext = S - b.t - 1;
      const toward = (s: Side) => s === c.side || it.anchor === "coin";
      if (c.y === 0 && toward("N")) [py, ph] = [py - ext, ph + ext];
      if (c.y + c.h === GH && toward("S")) ph += ext;
      if (c.x === 0 && toward("W")) [px, pw] = [px - ext, pw + ext];
      if (c.x + c.w === GW && toward("E")) pw += ext;
    }
    it.draw(px, py, pw, ph, c.side);
    return true;
  };

  const F = furniture2(v, r);
  // Écurie : les stalles prennent d'abord le mur du fond (1,5 case de profondeur).
  if (b.label === "Écurie") {
    const depth = far === "N" || far === "S" ? GH : GW;
    if (depth >= 4) {
      F.stalls(ix, iy, iw, ih, far);
      for (let k = 0; k < (depth >= 5 ? 3 : 2); k++)
        for (let a = 0; a < (far === "N" || far === "S" ? GW : GH); a++) {
          const [xx, yy] = far === "N" ? [a, k] : far === "S" ? [a, GH - 1 - k] : far === "W" ? [k, a] : [GW - 1 - k, a];
          occ[yy * GW + xx] = 1;
        }
    }
  }
  const hearth = (): Item => ({
    w: 3,
    h: 1,
    anchor: "mur",
    draw: (x, y, w, hh, side) => {
      F.hearth(x, y, w, hh, side);
      const at = side === "N" || side === "S" ? x + w / 2 : y + hh / 2;
      b.chimney = { side, at };
    },
  });
  const tableSet = (w: number, hh: number): Item => ({
    w,
    h: hh,
    anchor: "libre",
    draw: (x, y, ww, hhh) => (ww >= S * 1.6 || hhh >= S * 1.6 ? F.longTable(x, y, ww, hhh) : F.roundTable(x, y, ww, hhh)),
  });
  const it = (w: number, hh: number, anchor: Anchor, draw: Item["draw"]): Item => ({ w, h: hh, anchor, draw });

  let program: Item[] = [];
  switch (b.label) {
    case "Auberge":
      program = [hearth(), it(5, 2, "mur", F.counter), it(3, 3, "coin", F.barrelPile), tableSet(4, 3), tableSet(4, 3), tableSet(2, 2), tableSet(2, 2), it(2, 2, "coin", F.barrels), tableSet(2, 2)];
      break;
    case "Forge":
      program = [it(2, 2, "mur", F.forgeHearth), it(2, 2, "libre", F.anvil), it(2, 2, "coin", F.tub), it(3, 1, "mur", F.toolRack), it(1, 1, "coin", F.coal), it(2, 2, "coin", F.barrels)];
      break;
    case "Temple":
      program = [it(3, 1, "fond", F.altar), it(1, 1, "coin", F.candles), it(1, 1, "coin", F.candles), it(2, 2, "coin", F.font)];
      break;
    case "Marché":
      program = [it(3, 2, "libre", F.stall), it(3, 2, "libre", F.stall), it(1, 1, "coin", F.crates), it(1, 1, "coin", F.sacks), it(1, 1, "coin", F.barrels), it(2, 1, "mur", F.crates)];
      break;
    case "Maison du chef":
      program = [hearth(), it(4, 3, "centre", F.greatTable), it(3, 4, "mur", F.canopyBed), it(2, 1, "mur", F.chest), it(2, 1, "mur", F.shelves), it(2, 2, "coin", F.barrels)];
      break;
    case "Écurie":
      program = [it(3, 2, "coin", F.hay), it(1, 1, "coin", F.saddle), it(2, 2, "coin", F.hay), it(1, 1, "mur", F.bucket)];
      break;
    case "Échoppe":
      program = [it(4, 2, "mur", F.counter), it(4, 1, "mur", F.shelves), it(3, 1, "mur", F.shelves), it(1, 1, "coin", F.crates), it(1, 1, "coin", F.barrels), it(1, 1, "coin", F.sacks)];
      break;
    case "Moulin":
      program = [it(3, 3, "centre", F.millstone), it(2, 2, "centre", F.millstone), it(1, 1, "coin", F.sacks), it(1, 1, "coin", F.sacks), it(2, 1, "mur", F.sacks), it(1, 1, "coin", F.barrels)];
      break;
    case "Herboriste":
      program = [it(3, 1, "mur", F.workbench), it(3, 1, "mur", F.jars), it(2, 2, "libre", F.cauldron), it(1, 1, "coin", F.pots), it(1, 1, "coin", F.pots)];
      break;
    case "Caserne":
      program = [it(2, 3, "mur", F.bed), it(2, 3, "mur", F.bed), it(2, 3, "mur", F.bed), it(3, 1, "mur", F.weaponRack), it(2, 1, "mur", F.chest), it(2, 3, "mur", F.bed), tableSet(2, 2)];
      break;
    case "Boulangerie":
      // le four à pain contre le mur, le pétrin, les sacs de farine, l'étal des miches
      program = [it(2, 2, "mur", F.forgeHearth), it(3, 1, "mur", F.workbench), it(4, 1, "mur", F.counter), it(1, 1, "coin", F.sacks), it(1, 1, "coin", F.sacks), it(2, 1, "mur", F.shelves)];
      break;
    case "Tonnellerie":
      program = [it(3, 3, "coin", F.barrelPile), it(3, 1, "mur", F.workbench), it(2, 2, "libre", F.barrels), it(3, 1, "mur", F.toolRack), it(2, 2, "coin", F.barrels), it(1, 1, "coin", F.coal)];
      break;
    case "Grange":
      program = [it(3, 2, "coin", F.hay), it(2, 2, "coin", F.hay), it(1, 1, "coin", F.sacks), it(2, 1, "mur", F.sacks), it(1, 1, "mur", F.bucket), it(3, 2, "coin", F.hay)];
      break;
    case "Tannerie":
      program = [it(2, 2, "libre", F.tub), it(2, 2, "libre", F.tub), it(3, 1, "mur", F.workbench), it(2, 2, "coin", F.barrels), it(1, 1, "coin", F.pots)];
      break;
    default:
      program = [hearth(), tableSet(2, 2), it(2, 1, "mur", F.chest), it(1, 1, "coin", F.barrels)];
  }
  // Tapis : allée de l'entrée à l'autel au temple, tapis au milieu des pièces à vivre.
  if (b.label === "Temple" && b.doors.length) {
    const d = b.doors[0];
    const alongY = d.side === "N" || d.side === "S";
    const pts = alongY ? rectPts((d.x + 0.5) * S - 13, iy + 3, 26, ih - 6) : rectPts(ix + 3, (d.y + 0.5) * S - 13, iw - 6, 26);
    solid(v.g, pts, v.pal.cloth[0], r, { ink: 1, shadow: 0 });
    inkPolyline(v.g, alongY ? rectPts((d.x + 0.5) * S - 9, iy + 6, 18, ih - 12) : rectPts(ix + 6, (d.y + 0.5) * S - 9, iw - 12, 18), r, {
      width: 0.7,
      closed: true,
      color: tint(v.pal.cloth[3], 0, 0.9),
    });
  }
  if ((b.label === "Herboriste" || b.label === "Auberge" || b.label === "Caserne") && GW >= 6 && GH >= 4) {
    const rw = Math.min(iw - S * 1.6, S * 2.4);
    const rh = Math.min(ih - S * 1.4, S * 1.6);
    const rx = ix + (iw - rw) / 2 + (r() - 0.5) * 10;
    const ry = iy + (ih - rh) / 2 + (r() - 0.5) * 10;
    rug(v, rx, ry, rw, rh, r);
  }
  // Les grands meubles d'abord dans l'ordre du programme ; on retente en plus petit ce qui ne rentre pas.
  for (const item of program) {
    if (place(item)) continue;
    if (item.w > 2 && item.anchor !== "centre") place({ ...item, w: item.w - 1 });
  }
  // Temple : bancs en rangées de part et d'autre de l'allée, tapis de l'entrée à l'autel.
  if (b.label === "Temple" && b.doors.length) {
    // une rangée par demi-case entre l'entrée et l'autel, de chaque côté du tapis
    const d = b.doors[0];
    const alongX = far === "E" || far === "W";
    const aisle = alongX ? (d.y + 0.5) * S : (d.x + 0.5) * S;
    const lo = alongX ? iy : ix;
    const hi = alongX ? iy + ih : ix + iw;
    const spans: [number, number][] = [[lo + 4, aisle - 16], [aisle + 16, hi - 4]];
    const rows = alongX ? GW : GH;
    for (let k = 0; k < rows; k++) {
      for (const [a0, a1] of spans) {
        if (a1 - a0 < 14) continue;
        // demi-cases que couvre ce banc : il faut qu'elles soient toutes libres
        const c0 = Math.floor((a0 - lo) / h);
        const c1 = Math.ceil((a1 - lo) / h) - 1;
        let ok = true;
        for (let c = c0; c <= c1 && ok; c++) {
          const gx = alongX ? k : c;
          const gy = alongX ? c : k;
          if (gx < 0 || gy < 0 || gx >= GW || gy >= GH || occ[gy * GW + gx]) ok = false;
        }
        if (!ok) continue;
        const cell = (alongX ? ix : iy) + k * h;
        if (alongX) F.pew(cell, a0, h, a1 - a0, true);
        else F.pew(a0, cell, a1 - a0, h, false);
      }
    }
  }
  // Bric-à-brac le long des murs, jusqu'à ce que la pièce ait l'air habitée (sans l'encombrer).
  const fillers: Record<string, Item["draw"][]> = {
    Auberge: [F.barrels, F.crates, F.sacks, F.stool],
    Forge: [F.coal, F.barrels, F.ingots, F.tub],
    Temple: [F.candles, F.pots],
    Marché: [F.crates, F.sacks, F.barrels, F.pots],
    "Maison du chef": [F.pots, F.barrels, F.stool, F.crates],
    Écurie: [F.sacks, F.barrels, F.bucket],
    Échoppe: [F.crates, F.sacks, F.barrels, F.pots],
    Moulin: [F.sacks, F.sacks, F.barrels],
    Herboriste: [F.pots, F.sacks, F.bucket],
    Caserne: [F.barrels, F.crates, F.stool],
  };
  const pool = fillers[b.label] ?? [F.barrels, F.crates, F.sacks];
  const target = GW * GH * 0.58;
  for (let k = 0; k < 22; k++) {
    let filled = 0;
    for (let q = 0; q < occ.length; q++) filled += occ[q];
    if (filled >= target) break;
    place(it(1, 1, r() < 0.5 ? "coin" : "mur", pick(r, pool)));
  }
  // Herboriste : herbes qui sèchent sur des cordes tendues d'un mur à l'autre.
  if (b.label === "Herboriste" || b.label === "Tannerie") F.dryingLines(ix, iy, iw, ih);
}

/** Tapis tissé : bordure, motif en losanges, franges aux petits côtés. */
function rug(v: V, x: number, y: number, w: number, h: number, r: Rng) {
  const { g, pal } = v;
  const col = pick(r, [pal.cloth[0], pal.cloth[1], pal.cloth[4]]);
  solid(g, rectPts(x, y, w, h), col, r, { ink: 1, shadow: 0 });
  inkPolyline(g, rectPts(x + 4, y + 4, w - 8, h - 8), r, { width: 0.8, closed: true, color: tint(pal.cloth[3], 0, 0.85) });
  const n = Math.max(1, Math.round(w / 26));
  for (let k = 0; k < n; k++) {
    const cx = x + ((k + 0.5) * w) / n;
    const cy = y + h / 2;
    const s = Math.min(h * 0.3, 10);
    inkPolyline(g, [[cx, cy - s], [cx + s * 0.8, cy], [cx, cy + s], [cx - s * 0.8, cy]], r, { width: 0.8, closed: true, color: tint(pal.cloth[3], -0.05, 0.85) });
  }
  strokes(g, tint(pal.cloth[3], -0.1, 0.8), 0.6, (p) => {
    for (let yy = y + 2; yy < y + h - 1; yy += 2.5) {
      p.moveTo(x, yy);
      p.lineTo(x - 3, yy + (r() - 0.5));
      p.moveTo(x + w, yy);
      p.lineTo(x + w + 3, yy + (r() - 0.5));
    }
  });
}

/** Usure du sol : taches de vin, de suie ou d'eau, débris. */
function stains(v: V, room: Shape, ix: number, iy: number, iw: number, ih: number, r: Rng) {
  const { g, pal } = v;
  g.save();
  g.clip(room.path);
  const n = 1 + Math.floor((iw * ih) / 5000);
  g.lineJoin = "round";
  for (let k = 0; k < n; k++) {
    const x = ix + r() * iw;
    const y = iy + r() * ih;
    const rad = 5 + r() * 14;
    const col = pick(r, ["#3a1f14", "#1e1a16", pal.mud]);
    const p = pathOf(smoothPoints(blobPoints(r, x, y, rad, rad * 0.7, 8, 0.4, r() * 3), 2));
    g.fillStyle = tint(col, 0, 0.12);
    g.fill(p);
    g.strokeStyle = tint(col, 0, 0.2);
    g.lineWidth = 1;
    g.stroke(p);
  }
  stipple(g, room, r, { density: 0.05, radius: 0.8, color: "rgba(22,16,10,.45)" });
  g.restore();
}

/** Les meubles, dessinés dans le rectangle (px) que leur donne le placement. */
function furniture(v: V, r: Rng) {
  const { g, pal, S } = v;
  const inset = 3;
  const F = {
    hearth(x: number, y: number, w: number, hh: number, side: Side) {
      // cheminée de pierre adossée au mur : manteau, foyer noir, braises, lueur
      const [lx, ly, lw, lh] = [x + 2, y, w - 4, hh];
      const back: Pt[] =
        side === "N"
          ? rectPts(lx, ly - 4, lw, lh - 2)
          : side === "S" ? rectPts(lx, ly + 6, lw, lh - 2) : side === "W" ? rectPts(lx - 4, ly + 2, lw - 2, lh - 4) : rectPts(lx + 6, ly + 2, lw - 2, lh - 4);
      glow(g, x + w / 2, y + hh / 2, 62, 0.34);
      solid(g, back, v.pal.stone, r, { ink: 1.8, shadow: 3 });
      const cx = x + w / 2;
      const cy = y + hh / 2;
      g.fillStyle = "#17110b";
      g.beginPath();
      g.ellipse(cx, cy, side === "N" || side === "S" ? w * 0.28 : hh * 0.22, side === "N" || side === "S" ? hh * 0.22 : w * 0.28, 0, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 7; k++) {
        g.fillStyle = k % 3 ? "#e0702a" : "#ffc35a";
        g.beginPath();
        g.arc(cx + (r() - 0.5) * 12, cy + (r() - 0.5) * 6, 1 + r() * 1.4, 0, Math.PI * 2);
        g.fill();
      }
      // bûches croisées
      inkLine(g, cx - 7, cy - 2, cx + 6, cy + 3, r, { width: 2.2, color: "#2b1a0e" });
      inkLine(g, cx - 6, cy + 3, cx + 7, cy - 2, r, { width: 2.2, color: "#2b1a0e" });
    },
    tableSet(x: number, y: number, w: number, hh: number) {
      const tw = w - 16;
      const th = hh - 18;
      const tx = x + 8;
      const ty = y + 9;
      // tabourets autour
      for (const [sx, sy] of [[tx + tw * 0.3, ty - 4], [tx + tw * 0.7, ty + th + 5], [tx - 4, ty + th / 2], [tx + tw + 4, ty + th * 0.4]] as Pt[])
        if (r() < 0.8) disc(g, sx, sy, 4, pal.wood, r, { ink: 0.9, shadow: 2 });
      solid(g, rectPts(tx, ty, tw, th), pal.woodLight, r, { ink: 1.4, shadow: 4 });
      strokes(g, tint(pal.woodDark, 0, 0.45), 0.6, (p) => {
        for (let k = 1; k < 3; k++) {
          p.moveTo(tx + 2, ty + (th * k) / 3);
          p.lineTo(tx + tw - 2, ty + (th * k) / 3);
        }
      });
      tableware(x + w / 2, y + hh / 2, tw, th);
    },
    greatTable(x: number, y: number, w: number, hh: number) {
      // tapis dessous, longue table, chaises
      const rug = rectPts(x + 2, y + 2, w - 4, hh - 4);
      g.fillStyle = tint(pal.cloth[0], 0, 0.85);
      g.fill(pathOf(rug));
      inkPolyline(g, rectPts(x + 6, y + 6, w - 12, hh - 12), r, { width: 0.8, closed: true, color: tint(pal.cloth[3], 0, 0.8) });
      inkPolyline(g, rug, r, { width: 0.9, closed: true, color: INK_SOFT });
      const tx = x + 10;
      const ty = y + 13;
      const tw = w - 20;
      const th = hh - 26;
      for (let k = 0; k < Math.floor(tw / 18); k++) {
        disc(g, tx + 9 + k * 18, ty - 5, 4.2, pal.wood, r, { ink: 0.9, shadow: 2 });
        disc(g, tx + 9 + k * 18, ty + th + 5, 4.2, pal.wood, r, { ink: 0.9, shadow: 2 });
      }
      solid(g, rectPts(x + 4, ty + th / 2 - 5, 6, 10), pal.woodDark, r, { ink: 1, shadow: 2 });
      solid(g, rectPts(tx, ty, tw, th), pal.woodLight, r, { ink: 1.6, shadow: 5 });
      tableware(tx + tw / 2, ty + th / 2, tw, th);
    },
    counter(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const d = 13;
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 3 : y + hh - d - 3, w - inset * 2, d) : rectPts(side === "W" ? x + 3 : x + w - d - 3, y + inset, d, hh - inset * 2);
      solid(g, pts, pal.wood, r, { ink: 1.5, shadow: 4 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      // chopes, bouteilles et un torchon sur le comptoir
      for (let k = 0; k < 4; k++) {
        const t = 0.15 + k * 0.22 + r() * 0.05;
        const cx = horiz ? px + (qx - px) * t : (px + qx) / 2;
        const cy = horiz ? (py + qy) / 2 : py + (qy - py) * t;
        if (k % 2)
          disc(g, cx, cy, 2.4, k === 1 ? "#3d5a3a" : "#5a3a22", r, { ink: 0.7, shadow: 1 });
        else disc(g, cx, cy, 2.8, pal.metal, r, { ink: 0.7, shadow: 1 });
      }
    },
    bench(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 3 : y + hh - 11, w - inset * 2, 8) : rectPts(side === "W" ? x + 3 : x + w - 11, y + inset, 8, hh - inset * 2);
      solid(g, pts, pal.wood, r, { ink: 1.2, shadow: 3 });
    },
    stool(x: number, y: number, w: number, hh: number) {
      disc(g, x + w / 2 + (r() - 0.5) * 6, y + hh / 2 + (r() - 0.5) * 6, 4.5, pal.wood, r, { ink: 1, shadow: 2 });
    },
    bucket(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2 + (r() - 0.5) * 6;
      const cy = y + hh / 2 + (r() - 0.5) * 6;
      disc(g, cx, cy, 5.5, pal.wood, r, { ink: 1.1, shadow: 2 });
      g.fillStyle = mixColor(pal.water, "#202020", 0.35);
      g.beginPath();
      g.arc(cx, cy, 3.6, 0, Math.PI * 2);
      g.fill();
      inkLine(g, cx - 6, cy, cx + 6, cy, r, { width: 0.6, wobble: 0.2 });
    },
    ingots(x: number, y: number, w: number, hh: number) {
      // barres de fer et fers à cheval en tas
      for (let k = 0; k < 4; k++) {
        const a = (r() - 0.5) * 0.5;
        g.save();
        g.translate(x + w / 2 + (r() - 0.5) * 8, y + 6 + k * 3.5);
        g.rotate(a);
        solid(g, rectPts(-8, -1.4, 16, 2.8), "#4e5256", r, { ink: 0.6, shadow: 1, light: false });
        g.restore();
      }
      g.strokeStyle = "#2e3032";
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(x + w * 0.35, y + hh * 0.75, 3.5, Math.PI * 0.15, Math.PI * 1.85);
      g.stroke();
    },
    barrels(x: number, y: number, w: number, hh: number) {
      barrel(v, x + w * 0.5, y + hh * 0.5, Math.min(w, hh) * 0.36, r);
    },
    crates(x: number, y: number, w: number, hh: number) {
      const s = Math.min(w, hh) - 6;
      crate(v, x + 3, y + 3, s, r, (r() - 0.5) * 0.25);
      if (w > hh * 1.5) crate(v, x + w / 2 + 2, y + 4, s - 3, r, (r() - 0.5) * 0.4);
    },
    sacks(x: number, y: number, w: number, hh: number) {
      sack(v, x + w * 0.4, y + hh * 0.45, r);
      if (w > hh * 1.5) sack(v, x + w * 0.75, y + hh * 0.55, r);
    },
    chest(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + 8, side === "N" ? y + 3 : y + hh - 17, w - 16, 14) : rectPts(side === "W" ? x + 3 : x + w - 17, y + 8, 14, hh - 16);
      solid(g, pts, pal.wood, r, { ink: 1.4, shadow: 3 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      strokes(g, "rgba(22,16,10,.85)", 1.6, (p) => {
        for (const t of [0.25, 0.75]) {
          if (horiz) {
            p.moveTo(px + (qx - px) * t, py);
            p.lineTo(px + (qx - px) * t, qy);
          } else {
            p.moveTo(px, py + (qy - py) * t);
            p.lineTo(qx, py + (qy - py) * t);
          }
        }
      });
      g.fillStyle = "#c9a34e";
      g.fillRect((px + qx) / 2 - 1.5, (py + qy) / 2 - 1.5, 3, 3);
    },
    bed(x: number, y: number, w: number, hh: number, side: Side) {
      // tête contre le mur, couverture repliée au pied
      const horiz = side === "N" || side === "S";
      const bw = horiz ? w - 14 : w - 8;
      const bh = horiz ? hh - 8 : hh - 14;
      const bx = x + (w - bw) / 2;
      const by = y + (side === "N" ? 3 : side === "S" ? hh - bh - 3 : (hh - bh) / 2);
      const bx2 = side === "W" ? x + 3 : side === "E" ? x + w - bw - 3 : bx;
      const frame = rectPts(bx2, by, bw, bh);
      solid(g, frame, pal.woodDark, r, { ink: 1.4, shadow: 4 });
      solid(g, rectPts(bx2 + 2, by + 2, bw - 4, bh - 4), "#d9ccab", r, { ink: 0, shadow: 0 });
      const blanket = pick(r, pal.cloth);
      const head = 0.32;
      let cover: Pt[], pillow: Pt[];
      if (side === "N") {
        cover = rectPts(bx2 + 2, by + bh * head, bw - 4, bh * (1 - head) - 2);
        pillow = rectPts(bx2 + 4, by + 4, bw - 8, bh * head - 7);
      } else if (side === "S") {
        cover = rectPts(bx2 + 2, by + 2, bw - 4, bh * (1 - head) - 2);
        pillow = rectPts(bx2 + 4, by + bh * (1 - head) + 3, bw - 8, bh * head - 7);
      } else if (side === "W") {
        cover = rectPts(bx2 + bw * head, by + 2, bw * (1 - head) - 2, bh - 4);
        pillow = rectPts(bx2 + 4, by + 4, bw * head - 7, bh - 8);
      } else {
        cover = rectPts(bx2 + 2, by + 2, bw * (1 - head) - 2, bh - 4);
        pillow = rectPts(bx2 + bw * (1 - head) + 3, by + 4, bw * head - 7, bh - 8);
      }
      solid(g, cover, blanket, r, { ink: 1, shadow: 0 });
      solid(g, pillow, "#ece2c8", r, { ink: 0.9, shadow: 0 });
      // pli de la couverture
      const [cx0, cy0] = cover[0];
      const [cx1, cy1] = cover[2];
      strokes(g, tint(blanket, -0.25, 0.8), 0.8, (p) => {
        if (horiz) {
          const yy = side === "N" ? cy0 + 4 : cy1 - 4;
          p.moveTo(cx0 + 1, yy);
          p.lineTo(cx1 - 1, yy);
        } else {
          const xx = side === "W" ? cx0 + 4 : cx1 - 4;
          p.moveTo(xx, cy0 + 1);
          p.lineTo(xx, cy1 - 1);
        }
      });
    },
    shelves(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const d = 9;
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 2 : y + hh - d - 2, w - inset * 2, d) : rectPts(side === "W" ? x + 2 : x + w - d - 2, y + inset, d, hh - inset * 2);
      solid(g, pts, pal.woodDark, r, { ink: 1.3, shadow: 3 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      // livres, bocaux, rouleaux
      const L = horiz ? qx - px : qy - py;
      let s = 3;
      while (s < L - 4) {
        const bw = 2 + r() * 4;
        const col = pick(r, [...pal.cloth, "#d9ccab", pal.wood]);
        g.fillStyle = col;
        if (horiz) g.fillRect(px + s, py + 1.5, bw, d - 3);
        else g.fillRect(px + 1.5, py + s, d - 3, bw);
        s += bw + 0.6 + (r() < 0.15 ? 5 : 0);
      }
    },
    forgeHearth(x: number, y: number, w: number, hh: number) {
      // foyer de forge : bloc de pierre, lit de braises, soufflet de cuir à côté
      const fx = x + 5;
      const fy = y + 5;
      const fw = w - 10;
      const fh = hh - 10;
      glow(g, fx + fw / 2, fy + fh / 2, 80, 0.4);
      solid(g, rectPts(fx, fy, fw, fh), pal.stone, r, { ink: 1.8, shadow: 5 });
      strokes(g, "rgba(22,16,10,.5)", 0.7, (p) => {
        p.moveTo(fx, fy + fh / 2);
        p.lineTo(fx + fw, fy + fh / 2);
        p.moveTo(fx + fw / 2, fy);
        p.lineTo(fx + fw / 2, fy + fh / 2);
      });
      const cx = fx + fw / 2;
      const cy = fy + fh / 2;
      g.fillStyle = "#1a120c";
      g.beginPath();
      g.ellipse(cx, cy, fw * 0.3, fh * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, fw * 0.3);
      grad.addColorStop(0, "rgba(255,210,110,.95)");
      grad.addColorStop(0.5, "rgba(230,100,30,.8)");
      grad.addColorStop(1, "rgba(120,30,10,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(cx, cy, fw * 0.3, fh * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      stipple(g, rectShape(cx - fw * 0.25, cy - fh * 0.25, fw * 0.5, fh * 0.5), r, { density: 3, radius: 0.8, color: "rgba(40,15,5,.7)" });
      // soufflet
      const bx = fx + fw + 1;
      solid(g, [[bx - 2, cy - 2], [bx + 4, cy - 9], [bx + 9, cy - 4], [bx + 3, cy + 2]], "#6b4a2e", r, { ink: 1, shadow: 2 });
    },
    anvil(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      disc(g, cx, cy + 1, 10, pal.wood, r, { ink: 1.2, shadow: 4 });
      g.strokeStyle = tint(pal.woodDark, 0, 0.6);
      g.lineWidth = 0.6;
      g.beginPath();
      g.arc(cx, cy + 1, 5, 0, Math.PI * 2);
      g.stroke();
      solid(g, [[cx - 13, cy - 1], [cx - 6, cy - 4], [cx + 9, cy - 4], [cx + 11, cy - 2], [cx + 11, cy + 3], [cx - 6, cy + 3]], "#4a4e52", r, { ink: 1.4, shadow: 3 });
      g.fillStyle = "rgba(255,255,255,.3)";
      g.fillRect(cx - 5, cy - 3, 12, 1.4);
      // marteau posé
      inkLine(g, cx + 14, cy + 8, cx + 22, cy + 2, r, { width: 1.6, color: pal.woodDark });
      solid(g, rectPts(cx + 12, cy + 5, 5, 6), "#4a4e52", r, { ink: 0.8, shadow: 1 });
    },
    tub(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const R = Math.min(S * 0.3, Math.min(w, hh) * 0.38);
      disc(g, cx, cy, R, pal.wood, r, { ink: 1.3 });
      g.fillStyle = mixColor(mixColor(pal.water, "#3a3a34", 0.55), "#202020", 0.35);
      g.beginPath();
      g.arc(cx, cy, R * 0.74, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(235,240,230,.4)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.arc(cx - 1, cy - 1, Math.min(w, hh) * 0.18, Math.PI, Math.PI * 1.5);
      g.stroke();
    },
    toolRack(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 2 : y + hh - 8, w - inset * 2, 6) : rectPts(side === "W" ? x + 2 : x + w - 8, y + inset, 6, hh - inset * 2);
      solid(g, pts, pal.woodDark, r, { ink: 1.1, shadow: 2 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      const L = horiz ? qx - px : qy - py;
      for (let s = 6; s < L - 4; s += 9) {
        const ax = horiz ? px + s : side === "W" ? qx : px;
        const ay = horiz ? (side === "N" ? qy : py) : py + s;
        const dx = horiz ? 0 : side === "W" ? 9 : -9;
        const dy = horiz ? (side === "N" ? 9 : -9) : 0;
        inkLine(g, ax, ay, ax + dx, ay + dy, r, { width: 1.2, color: "#3a3c3e", taper: 2 });
      }
    },
    coal(x: number, y: number, w: number, hh: number) {
      const pts = smoothPoints(blobPoints(r, x + w / 2, y + hh / 2, w * 0.38, hh * 0.34, 8, 0.25), 1);
      solid(g, pts, "#262220", r, { ink: 1, shadow: 2 });
      stipple(g, shapeOf(pts), r, { density: 6, radius: 0.8, color: "rgba(120,110,100,.6)" });
    },
    altar(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + 6, side === "N" ? y + 4 : y + hh - 18, w - 12, 14) : rectPts(side === "W" ? x + 4 : x + w - 18, y + 6, 14, hh - 12);
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      glow(g, (px + qx) / 2, (py + qy) / 2, 54, 0.3);
      solid(g, pts, mixColor(pal.flag, "#ffffff", 0.2), r, { ink: 1.8, shadow: 5 });
      // nappe brodée, livre ouvert, deux cierges
      const cloth = horiz ? rectPts((px + qx) / 2 - 8, py - 1, 16, qy - py + 2) : rectPts(px - 1, (py + qy) / 2 - 8, qx - px + 2, 16);
      solid(g, cloth, pal.cloth[0], r, { ink: 0.8, shadow: 0 });
      disc(g, (px + qx) / 2, (py + qy) / 2, 3, "#ece2c8", r, { ink: 0.6, shadow: 1, light: false });
      for (const t of [0.12, 0.88]) {
        const cx = horiz ? px + (qx - px) * t : (px + qx) / 2;
        const cy = horiz ? (py + qy) / 2 : py + (qy - py) * t;
        glow(g, cx, cy, 14, 0.4);
        disc(g, cx, cy, 2, "#efe6cc", r, { ink: 0.5, shadow: 1, light: false });
        flame(g, cx, cy, 1);
      }
    },
    candles(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      glow(g, cx, cy, 26, 0.4);
      disc(g, cx, cy, 6, "#3a3632", r, { ink: 1, shadow: 3 });
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4;
        disc(g, cx + Math.cos(a) * 3.3, cy + Math.sin(a) * 3.3, 1.5, "#efe6cc", r, { ink: 0.4, shadow: 0, light: false });
        flame(g, cx + Math.cos(a) * 3.3, cy + Math.sin(a) * 3.3, 0.8);
      }
    },
    pew(x: number, y: number, w: number, hh: number, alongX: boolean) {
      const pts = alongX ? rectPts(x + 7, y, 10, hh) : rectPts(x, y + 7, w, 10);
      solid(g, pts, pal.wood, r, { ink: 1.2, shadow: 3 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      inkLine(g, alongX ? qx - 2.5 : px + 1, alongX ? py + 1 : qy - 2.5, alongX ? qx - 2.5 : qx - 1, alongX ? qy - 1 : qy - 2.5, r, { width: 0.8, color: pal.woodDark });
    },
    stall(x: number, y: number, w: number, hh: number) {
      // étal sous bâche rayée, caisses de légumes au pied
      const sx = x + 5;
      const sy = y + 6;
      const sw = w - 10;
      const sh = hh - 16;
      const c1 = pick(r, pal.cloth);
      crate(v, sx - 1, sy + sh + 1, 9, r, 0.1);
      crate(v, sx + sw - 9, sy + sh + 2, 9, r, -0.1);
      g.save();
      g.translate(4, 6);
      g.fillStyle = "rgba(18,12,6,.4)";
      g.fill(pathOf(rectPts(sx, sy, sw, sh)));
      g.restore();
      const n = Math.max(4, Math.round(sw / 7));
      for (let k = 0; k < n; k++) {
        g.fillStyle = k % 2 ? "#e6dcc0" : c1;
        g.fillRect(sx + (k * sw) / n, sy, sw / n + 0.5, sh);
      }
      // bord festonné de la bâche
      const fest: Pt[] = [];
      for (let k = 0; k <= n; k++) fest.push([sx + (k * sw) / n, sy + sh + (k % 2 ? 3 : 0)]);
      g.fillStyle = c1;
      g.beginPath();
      g.moveTo(sx, sy + sh);
      for (const [px, py] of fest) g.lineTo(px, py);
      g.fill();
      inkPolyline(g, rectPts(sx, sy, sw, sh), r, { width: 1.4, closed: true });
      inkLine(g, sx + 1, sy + sh / 2, sx + sw - 1, sy + sh / 2, r, { width: 0.8, color: tint(c1, -0.3, 0.9) });
    },
    hay(x: number, y: number, w: number, hh: number) {
      const pts = smoothPoints(blobPoints(r, x + w / 2, y + hh / 2, w * 0.42, hh * 0.4, 9, 0.2), 2);
      solid(g, pts, pal.straw, r, { ink: 1.1, shadow: 3 });
      strokes(g, tint(pal.straw, -0.28, 0.65), 0.6, (p) => {
        for (let i = 0; i < 40; i++) {
          const a = r() * Math.PI * 2;
          const d = r() * w * 0.36;
          const px = x + w / 2 + Math.cos(a) * d;
          const py = y + hh / 2 + Math.sin(a) * d * (hh / w);
          const b = r() * Math.PI;
          p.moveTo(px, py);
          p.lineTo(px + Math.cos(b) * 5, py + Math.sin(b) * 5);
        }
      });
      // fourche plantée
      inkLine(g, x + w * 0.7, y + hh * 0.3, x + w * 0.95, y + hh * 0.05, r, { width: 1.4, color: pal.woodDark });
    },
    trough(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 3 : y + hh - 15, w - inset * 2, 12) : rectPts(side === "W" ? x + 3 : x + w - 15, y + inset, 12, hh - inset * 2);
      solid(g, pts, pal.wood, r, { ink: 1.3, shadow: 3 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      g.fillStyle = mixColor(pal.straw, pal.mud, 0.3);
      g.fillRect(px + 2.5, py + 2.5, qx - px - 5, qy - py - 5);
    },
    saddle(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      inkLine(g, cx - 9, cy, cx + 9, cy, r, { width: 2.4, color: pal.woodDark });
      solid(g, smoothPoints([[cx - 7, cy - 6], [cx + 7, cy - 6], [cx + 8, cy + 6], [cx - 8, cy + 6]], 2), "#6b3e22", r, { ink: 1.1, shadow: 3 });
      inkLine(g, cx - 3, cy - 4, cx - 3, cy + 4, r, { width: 0.8, color: "#2a170c" });
    },
    stalls(ix: number, iy: number, iw: number, ih: number, far: Side) {
      // cloisons de planches perpendiculaires au mur du fond, une toutes les cases
      const S2 = v.S;
      const horiz = far === "N" || far === "S";
      const L = horiz ? iw : ih;
      const depth = Math.min(S2 * 1.1, (horiz ? ih : iw) - S2 * 0.9);
      if (depth < S2 * 0.6) return;
      for (let s = S2; s < L - 4; s += S2) {
        let pts: Pt[];
        if (horiz) {
          const y0 = far === "N" ? iy : iy + ih - depth;
          pts = rectPts(ix + s - 2, y0, 4, depth);
        } else {
          const x0 = far === "W" ? ix : ix + iw - depth;
          pts = rectPts(x0, iy + s - 2, depth, 4);
        }
        solid(g, pts, pal.wood, r, { ink: 1, shadow: 3 });
      }
    },
    workbench(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 3 : y + hh - 16, w - inset * 2, 13) : rectPts(side === "W" ? x + 3 : x + w - 16, y + inset, 13, hh - inset * 2);
      solid(g, pts, pal.woodLight, r, { ink: 1.4, shadow: 4 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      const mx = (px + qx) / 2;
      const my = (py + qy) / 2;
      disc(g, mx - (horiz ? 10 : 0), my - (horiz ? 0 : 10), 4, pal.stone, r, { ink: 0.9, shadow: 1 });
      for (let k = 0; k < 4; k++) disc(g, mx + (horiz ? 4 + k * 4 : (r() - 0.5) * 4), my + (horiz ? (r() - 0.5) * 4 : 4 + k * 4), 1.8, pick(r, pal.leaves), r, { ink: 0.4, shadow: 0, light: false });
      inkLine(g, mx + (horiz ? -2 : -3), my + (horiz ? -3 : -2), mx + (horiz ? 4 : 3), my + (horiz ? 3 : 4), r, { width: 0.9, color: "#4a4e52" });
    },
    jars(x: number, y: number, w: number, hh: number, side: Side) {
      F.shelves(x, y, w, hh, side);
    },
    cauldron(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const R = Math.min(w, hh) * 0.3;
      glow(g, cx, cy, R * 3.5, 0.3);
      // cercle de pierres du foyer, chaudron, louche
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        disc(g, cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R * 1.45, 3 + r() * 1.5, pal.stone, r, { ink: 0.7, shadow: 1 });
      }
      disc(g, cx, cy, R, "#2a2624", r, { ink: 1.8, shadow: 4 });
      const grad = g.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, R * 0.75);
      grad.addColorStop(0, "#9fbf6a");
      grad.addColorStop(1, "#3c5a2a");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, R * 0.75, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(235,245,220,.5)";
      g.lineWidth = 0.7;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(cx + (r() - 0.5) * R, cy + (r() - 0.5) * R, 1 + r() * 1.5, 0, Math.PI * 2);
        g.stroke();
      }
      inkLine(g, cx + R * 0.2, cy - R * 0.2, cx + R * 1.6, cy - R * 1.2, r, { width: 1.4, color: pal.woodDark });
    },
    pots(x: number, y: number, w: number, hh: number) {
      const terra = mixColor(pal.cloth[0], "#a8643c", 0.6);
      for (let k = 0; k < 3; k++) {
        const cx = x + 8 + (k % 2) * 9 + r() * 2;
        const cy = y + 8 + Math.floor(k / 2) * 9 + r() * 2;
        disc(g, cx, cy, 4 + r(), terra, r, { ink: 0.9, shadow: 2 });
        g.fillStyle = "#2a1a10";
        g.beginPath();
        g.arc(cx, cy, 1.8, 0, Math.PI * 2);
        g.fill();
      }
    },
    dryingLines(ix: number, iy: number, iw: number, ih: number) {
      const alongX = iw >= ih;
      const n = Math.max(1, Math.round((alongX ? ih : iw) / v.S));
      for (let k = 0; k < n; k++) {
        const off = ((k + 0.5) / n) * (alongX ? ih : iw) + (r() - 0.5) * 6;
        const a: Pt = alongX ? [ix + 2, iy + off] : [ix + off, iy + 2];
        const b2: Pt = alongX ? [ix + iw - 2, iy + off + 3] : [ix + off + 3, iy + ih - 2];
        const L = alongX ? iw : ih;
        for (let s = 10; s < L - 8; s += 9 + r() * 5) {
          const t = s / L;
          const px = a[0] + (b2[0] - a[0]) * t;
          const py = a[1] + (b2[1] - a[1]) * t;
          const col = pick(r, [pal.leaves[0], pal.leaves[1], "#8a6a3a", "#6a5a7a"]);
          g.save();
          g.translate(6, 9);
          g.fillStyle = "rgba(18,12,6,.3)";
          g.beginPath();
          g.ellipse(px, py, 3, 4, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
          const pts = blobPoints(r, px + (alongX ? 0 : 3), py + (alongX ? 3 : 0), alongX ? 3 : 4.5, alongX ? 4.5 : 3, 6, 0.3);
          solid(g, pts, col, r, { ink: 0.6, shadow: 0, light: false });
        }
        inkLine(g, a[0], a[1], b2[0], b2[1], r, { width: 0.7, wobble: 0.4, taper: 0 });
      }
    },
    weaponRack(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const pts = horiz ? rectPts(x + inset, side === "N" ? y + 2 : y + hh - 9, w - inset * 2, 7) : rectPts(side === "W" ? x + 2 : x + w - 9, y + inset, 7, hh - inset * 2);
      solid(g, pts, pal.woodDark, r, { ink: 1.2, shadow: 3 });
      const [px, py] = pts[0];
      const [qx, qy] = pts[2];
      const L = horiz ? qx - px : qy - py;
      for (let s = 5; s < L - 3; s += 6) {
        const ax = horiz ? px + s : (px + qx) / 2;
        const ay = horiz ? (py + qy) / 2 : py + s;
        const dx = horiz ? 3 : side === "W" ? 16 : -16;
        const dy = horiz ? (side === "N" ? 16 : -16) : 3;
        inkLine(g, ax, ay, ax + dx, ay + dy, r, { width: 1, color: pal.woodDark, taper: 2 });
        g.fillStyle = "#8a8e92";
        g.beginPath();
        g.arc(ax + dx, ay + dy, 1.2, 0, Math.PI * 2);
        g.fill();
      }
      disc(g, horiz ? px + L * 0.8 : (px + qx) / 2 + (side === "W" ? 12 : -12), horiz ? (side === "N" ? qy + 9 : py - 9) : py + L * 0.8, 6, pal.cloth[0], r, { ink: 1.1, shadow: 2 });
    },
    millstone(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const rad = Math.min(w, hh) * 0.42;
      // sillon circulaire usé par l'âne autour de la meule
      g.strokeStyle = tint(pal.mud, 0, 0.25);
      g.lineWidth = 6;
      g.beginPath();
      g.arc(cx, cy, rad + 7, 0, Math.PI * 2);
      g.stroke();
      disc(g, cx, cy, rad, pal.stone, r, { ink: 2, shadow: 5 });
      strokes(g, "rgba(22,16,10,.55)", 0.8, (p) => {
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2;
          p.moveTo(cx + Math.cos(a) * rad * 0.3, cy + Math.sin(a) * rad * 0.3);
          p.quadraticCurveTo(cx + Math.cos(a + 0.2) * rad * 0.6, cy + Math.sin(a + 0.2) * rad * 0.6, cx + Math.cos(a + 0.12) * rad * 0.92, cy + Math.sin(a + 0.12) * rad * 0.92);
        }
      });
      disc(g, cx, cy, rad * 0.18, pal.woodDark, r, { ink: 1, shadow: 1 });
      inkLine(g, cx, cy, cx + rad * 1.25, cy - rad * 0.5, r, { width: 3, color: pal.woodDark });
      stipple(g, rectShape(cx - rad, cy - rad, rad * 2, rad * 2), r, { density: 0.4, radius: 0.7, color: "rgba(250,245,230,.6)" });
    },
  };
  return F;

  function tableware(cx: number, cy: number, tw: number, th: number) {
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const px = cx + (r() - 0.5) * tw * 0.7;
      const py = cy + (r() - 0.5) * th * 0.6;
      const kind = r();
      if (kind < 0.4) {
        disc(g, px, py, 2.6, pal.metal, r, { ink: 0.7, shadow: 1 });
      } else if (kind < 0.75) {
        disc(g, px, py, 3.6, "#e2d8c0", r, { ink: 0.6, shadow: 1, light: false });
      } else {
        glow(g, px, py, 16, 0.35);
        disc(g, px, py, 1.6, "#efe6cc", r, { ink: 0.4, shadow: 1, light: false });
        flame(g, px, py, 0.9);
      }
    }
  }
}

// ——— Murs, toits, portes ———

/** Murs coupés, rebord de toit en avancée, portes et seuils, cheminée. */
/** Emprise exacte du bâtiment (o) et intérieur dessiné (i), en px : [x0, y0, x1, y1]. */
function shellRects(v: V, b: Building) {
  const { S } = v;
  const o = [b.x0 * S, b.y0 * S, (b.x1 + 1) * S, (b.y1 + 1) * S];
  const i = [o[0] + b.t, o[1] + b.t, o[2] - b.t, o[3] - b.t];
  return { o, i };
}

/** Rectangle du toit vu d'en haut, rebords compris (pour l'ombre portée). */
function roofBox(v: V, b: Building): number[] {
  const { o } = shellRects(v, b);
  return [o[0] - (b.eaves.has("W") ? EAVE : 0), o[1] - (b.eaves.has("N") ? EAVE : 0), o[2] + (b.eaves.has("E") ? EAVE : 0), o[3] + (b.eaves.has("S") ? EAVE : 0)];
}

/** Ouvertures dans le mur : portes (de part en part) et fenêtres, le long de chaque côté. */
interface Gap {
  side: Side;
  a: number;
  b: number;
  kind: "porte" | "fenetre";
}

function gapsOf(v: V, b: Building): Gap[] {
  const { S } = v;
  const out: Gap[] = [];
  for (const d of b.doors) {
    const p = d.side === "N" || d.side === "S" ? d.x * S : d.y * S;
    out.push({ side: d.side, a: p + 5, b: p + S - 5, kind: "porte" });
  }
  for (const w of b.windows) {
    const c = (w.side === "N" || w.side === "S" ? w.x + 0.5 : w.y + 0.5) * S;
    out.push({ side: w.side, a: c - 11, b: c + 11, kind: "fenetre" });
  }
  return out;
}

function paintShell(v: V, b: Building) {
  const { g, S, pal } = v;
  const r = rng(v.seed, 3000 + b.x0, b.y0);
  const t = b.t;
  const { o, i } = shellRects(v, b);
  const gaps = gapsOf(v, b);

  // 0. Ombre intérieure : la lumière vient du haut à gauche, les murs nord et ouest ombrent le pied de la salle.
  {
    g.save();
    g.beginPath();
    g.rect(i[0], i[1], i[2] - i[0], i[3] - i[1]);
    g.clip();
    g.globalCompositeOperation = "multiply";
    const deep = Math.min(26, (i[3] - i[1]) * 0.3);
    const gn = g.createLinearGradient(0, i[1], 0, i[1] + deep);
    gn.addColorStop(0, "rgba(70,52,36,.55)");
    gn.addColorStop(1, "rgba(70,52,36,0)");
    g.fillStyle = gn;
    g.fillRect(i[0], i[1], i[2] - i[0], deep);
    const gw = g.createLinearGradient(i[0], 0, i[0] + deep * 0.75, 0);
    gw.addColorStop(0, "rgba(70,52,36,.45)");
    gw.addColorStop(1, "rgba(70,52,36,0)");
    g.fillStyle = gw;
    g.fillRect(i[0], i[1], deep * 0.75, i[3] - i[1]);
    g.restore();
  }

  // 1. Le mur coupé à hauteur d'homme : un anneau de l'épaisseur du mur, troué aux portes et fenêtres.
  const ring = new Path2D();
  ring.rect(o[0], o[1], o[2] - o[0], o[3] - o[1]);
  ring.rect(i[0], i[1], i[2] - i[0], i[3] - i[1]);
  const holes = new Path2D();
  holes.rect(o[0] - 40, o[1] - 40, o[2] - o[0] + 80, o[3] - o[1] + 80);
  const gapRect = (gp: Gap): number[] =>
    gp.side === "N" ? [gp.a, o[1] - 1, gp.b, i[1] + 1] : gp.side === "S" ? [gp.a, i[3] - 1, gp.b, o[3] + 1] : gp.side === "W" ? [o[0] - 1, gp.a, i[0] + 1, gp.b] : [i[2] - 1, gp.a, o[2] + 1, gp.b];
  for (const gp of gaps) {
    const [x0, y0, x1, y1] = gapRect(gp);
    holes.rect(x0, y0, x1 - x0, y1 - y0);
  }
  const wallCol = b.wall === "pierre" ? pal.stone : b.wall === "colombage" ? pal.daub : b.wall === "planches" ? pal.wood : b.wall === "metal" ? pal.metal : mixColor(pal.dirt, pal.daub, 0.4);
  g.save();
  g.clip(holes, "evenodd");
  g.save();
  g.clip(ring, "evenodd");
  g.fillStyle = wallCol;
  g.fillRect(o[0], o[1], o[2] - o[0], o[3] - o[1]);
  for (const side of ["N", "S", "W", "E"] as Side[]) {
    const [ox, oy] = side === "N" ? [o[0], o[1]] : side === "S" ? [o[2], o[3]] : side === "W" ? [o[0], o[3]] : [o[2], o[1]];
    const L = side === "N" || side === "S" ? o[2] - o[0] : o[3] - o[1];
    inFrame(g, ox, oy, side, () => wallTexture(v, b, L, t, r));
  }
  // dessus du mur un peu plus sombre côté ombre (bas, droite)
  const grad = g.createLinearGradient(o[0], o[1], o[2], o[3]);
  grad.addColorStop(0, "rgba(255,246,220,.12)");
  grad.addColorStop(0.5, "rgba(255,246,220,0)");
  grad.addColorStop(1, "rgba(18,12,6,.18)");
  g.fillStyle = grad;
  g.fillRect(o[0], o[1], o[2] - o[0], o[3] - o[1]);
  g.restore();
  g.restore();

  // 2. Fenêtres : embrasure dans l'épaisseur, meneau sombre, volets de bois entrouverts dehors.
  for (const gp of gaps) {
    if (gp.kind !== "fenetre") continue;
    const [x0, y0, x1, y1] = gapRect(gp);
    const horiz = gp.side === "N" || gp.side === "S";
    g.fillStyle = mixColor(pal.woodDark, "#000000", 0.3);
    g.fillRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2);
    // appui clair côté intérieur, filet de vitre (verre épais, presque opaque) au milieu
    const mid = horiz ? (y0 + y1) / 2 : (x0 + x1) / 2;
    g.fillStyle = tint(pal.woodLight, 0, 0.85);
    if (horiz) g.fillRect(x0 + 1, gp.side === "N" ? mid + 1 : y0 + 1, x1 - x0 - 2, (y1 - y0) / 2 - 2);
    else g.fillRect(gp.side === "W" ? mid + 1 : x0 + 1, y0 + 1, (x1 - x0) / 2 - 2, y1 - y0 - 2);
    if (horiz) {
      inkLine(g, x0 + 1, mid, x1 - 1, mid, r, { width: 0.9, color: "rgba(200,214,205,.75)", taper: 0, wobble: 0.2 });
      inkLine(g, (x0 + x1) / 2, y0 + 1, (x0 + x1) / 2, y1 - 1, r, { width: 2.2, taper: 0, wobble: 0.2 });
    } else {
      inkLine(g, mid, y0 + 1, mid, y1 - 1, r, { width: 0.9, color: "rgba(200,214,205,.75)", taper: 0, wobble: 0.2 });
      inkLine(g, x0 + 1, (y0 + y1) / 2, x1 - 1, (y0 + y1) / 2, r, { width: 2.2, taper: 0, wobble: 0.2 });
    }
    // volets : deux battants posés à plat contre la façade, un peu décollés
    const [fx, fy] = gp.side === "N" ? [gp.a, o[1]] : gp.side === "S" ? [gp.b, o[3]] : gp.side === "W" ? [o[0], gp.b] : [o[2], gp.a];
    inFrame(g, fx, fy, gp.side, () => {
      const L = gp.b - gp.a;
      const open = 0.35 + r() * 0.35;
      for (const [hx, dir] of [[0, -1], [L, 1]] as const) {
        g.save();
        g.translate(hx, -1);
        g.rotate(dir * open);
        const leaf = rectPts(dir < 0 ? -12 : 0, -3.4, 12, 3.4);
        solid(g, leaf, mixColor(v.c.theme.door, pal.wood, 0.3), r, { ink: 1, shadow: 2.5, light: false });
        strokes(g, "rgba(22,16,10,.65)", 0.6, (p) => {
          p.moveTo(dir < 0 ? -6 : 6, -3.2);
          p.lineTo(dir < 0 ? -6 : 6, -0.2);
        });
        g.restore();
      }
    });
    // lumière ambrée qui tombe de la fenêtre sur le sol dehors
    if (r() < 0.5) {
      const [cx, cy] = gp.side === "N" ? [(gp.a + gp.b) / 2, o[1]] : gp.side === "S" ? [(gp.a + gp.b) / 2, o[3]] : gp.side === "W" ? [o[0], (gp.a + gp.b) / 2] : [o[2], (gp.a + gp.b) / 2];
      const [dx, dy] = gp.side === "N" ? [0, -1] : gp.side === "S" ? [0, 1] : gp.side === "W" ? [-1, 0] : [1, 0];
      const far = S * 0.85;
      const pool: Pt[] = [[cx - dy * 10, cy + dx * 10], [cx + dy * 10, cy - dx * 10], [cx + dx * far + dy * 20, cy + dy * far - dx * 20], [cx + dx * far - dy * 20, cy + dy * far + dx * 20]];
      const lg = g.createRadialGradient(cx, cy, 2, cx, cy, far);
      lg.addColorStop(0, "rgba(255,190,105,.24)");
      lg.addColorStop(1, "rgba(255,170,80,0)");
      g.save();
      g.globalCompositeOperation = "screen";
      g.fillStyle = lg;
      g.fill(pathOf(pool));
      g.restore();
    }
  }

  // 3. Encre du mur : chaque tronçon entre deux ouvertures est un bloc fermé, trait fort côté ombre.
  for (const side of ["N", "S", "W", "E"] as Side[]) {
    const horiz = side === "N" || side === "S";
    const lo = horiz ? o[0] : i[1];
    const hi = horiz ? o[2] : i[3];
    const cuts = gaps.filter((gp) => gp.side === side).sort((a, c) => a.a - c.a);
    let s = lo;
    const pieces: [number, number][] = [];
    for (const gp of cuts) {
      if (gp.a > s + 1) pieces.push([s, gp.a]);
      s = Math.max(s, gp.b);
    }
    if (hi > s + 1) pieces.push([s, hi]);
    for (const [a, c] of pieces) {
      const pts: Pt[] = side === "N" ? rectPts(a, o[1], c - a, t) : side === "S" ? rectPts(a, i[3], c - a, t) : side === "W" ? rectPts(o[0], a, t, c - a) : rectPts(i[2], a, t, c - a);
      inkStroke(g, densify(pts, 6, true), r, { width: 1.5, closed: true, color: WALL_INK, wobble: b.wall === "pierre" ? 0.55 : 0.4 });
    }
  }
  // face intérieure : trait appuyé côté ombre, et la plume dépasse de 2 à 3 px aux angles
  inkStroke(g, densify(rectPts(i[0], i[1], i[2] - i[0], i[3] - i[1]), 6, true), r, { width: 1.1, closed: true, color: WALL_INK, wobble: 0.4 });
  overshoot(g, rectPts(i[0], i[1], i[2] - i[0], i[3] - i[1]), r, 1);

  // 4. Rebord du toit, côté rue seulement : pan coupé net contre le mur, abouts de chevrons, bord encré.
  const roofCol = mixColor(pal.roof[b.roof], r() < 0.5 ? "#2a1c10" : "#e8d8b0", r() * 0.12);
  for (const side of ["N", "W", "E", "S"] as Side[]) {
    if (!b.eaves.has(side)) continue;
    const E = EAVE;
    const [ox, oy] = side === "N" ? [o[0] - E, o[1] - E] : side === "S" ? [o[2] + E, o[3] + E] : side === "W" ? [o[0] - E, o[3] + E] : [o[2] + E, o[1] - E];
    const L = (side === "N" || side === "S" ? o[2] - o[0] : o[3] - o[1]) + 2 * E;
    // position le long du rebord (repère tourné) d'une coordonnée du monde
    const local = (p: number) => (side === "N" ? p - (o[0] - E) : side === "S" ? o[2] + E - p : side === "W" ? o[3] + E - p : p - (o[1] - E));
    const doorSpans = b.doors .filter((d) => d.side === side)
      .map((d) => {
        const p = side === "N" || side === "S" ? d.x * S : d.y * S;
        const [a, c] = [local(p + 3), local(p + S - 3)];
        return [Math.min(a, c), Math.max(a, c)] as [number, number];
      });
    const light = side === "N" ? 0.1 : side === "W" ? 0.05 : side === "E" ? -0.08 : -0.14;
    const col = light > 0 ? mixColor(roofCol, "#fff4dc", light * 1.6) : mixColor(roofCol, "#140c06", -light * 2);
    inFrame(g, ox, oy, side, () => {
      // bord d'égout : chaume échevelé, tuiles et ardoises bien droites
      const edge: Pt[] = [];
      for (let x = 0; x <= L; x += 5) edge.push([x, b.roof === "chaume" ? (r() - 0.5) * 3.2 + Math.sin(x / 9 + r()) * 1.2 : (r() - 0.5) * 0.6]);
      const poly: Pt[] = [...edge, [L - E, E], [E, E]];
      const sh = pathOf(poly);
      const keep = new Path2D();
      keep.rect(-10, -10, L + 20, E + 20);
      for (const [a, c] of doorSpans) keep.rect(a, -10, c - a, E + 20);
      g.save();
      g.clip(keep, "evenodd");
      g.save();
      g.clip(sh);
      g.globalAlpha = 0.9;
      g.fillStyle = col;
      g.fillRect(-4, -4, L + 8, E + 8);
      roofTexture(v, b.roof, col, L, E, r);
      g.globalAlpha = 1;
      // dégradé du faîte (contre le mur, plus clair) vers l'égout (plus sombre)
      const rg = g.createLinearGradient(0, 0, 0, E);
      rg.addColorStop(0, "rgba(20,12,6,.32)");
      rg.addColorStop(0.55, "rgba(20,12,6,0)");
      rg.addColorStop(1, "rgba(255,244,220,.14)");
      g.fillStyle = rg;
      g.fillRect(-4, -4, L + 8, E + 8);
      // hachures du surplomb : le rebord est au-dessus du sol, à hauteur de toit, pas posé dessus
      hatchLines(g, rectShape(-4, -4, L + 8, E + 8), r, { spacing: 4.6, width: 0.55, color: "rgba(22,16,10,.26)", angle: Math.PI / 4 });
      // tranche du toit coupé : chevrons sciés, voliges et couverture vus en coupe (poché hachuré serré)
      const cut = 6;
      g.fillStyle = tint(pal.woodLight, 0.05, 0.95);
      g.fillRect(-4, E - cut, L + 8, cut + 2);
      hatchLines(g, rectShape(-4, E - cut, L + 8, cut + 2), r, { spacing: 2.3, width: 0.6, color: "rgba(22,16,10,.7)", angle: -Math.PI / 4 });
      for (let s = E + S / 4; s < L - E; s += S / 2) {
        // section d'un chevron scié : un carré de bois sombre dans la tranche
        g.fillStyle = pal.woodDark;
        g.fillRect(s - 2.4, E - cut + 0.6, 4.8, cut - 0.6);
        g.strokeStyle = "rgba(22,16,10,.9)";
        g.lineWidth = 0.7;
        g.strokeRect(s - 2.4, E - cut + 0.6, 4.8, cut - 0.6);
      }
      inkLine(g, E - 2, E - cut, L - E + 2, E - cut, r, { width: 1, color: WALL_INK, taper: 0, wobble: 0.3 });
      g.restore();
      // ligne d'égout : le contour le plus fort du dessin, appuyé côté ombre ; la plume dépasse aux angles
      const heavy = side === "S" || side === "E";
      const drip = densify(edge, 6);
      inkPolyline(g, drip, r, { width: heavy ? 3.8 : 2.4, color: WALL_INK, wobble: b.roof === "chaume" ? 1 : 0.4, pressure: 0.35, taper: 0 });
      inkLine(g, -3 - r() * 1.5, edge[0][1], 1, edge[0][1], r, { width: heavy ? 2.4 : 1.6, color: WALL_INK, taper: 2, wobble: 0.2 });
      inkLine(g, L - 1, edge[edge.length - 1][1], L + 3 + r() * 1.5, edge[edge.length - 1][1], r, { width: heavy ? 2.4 : 1.6, color: WALL_INK, taper: 2, wobble: 0.2 });
      // arêtiers aux angles
      inkStroke(g, [[0, edge[0][1]], [E, E]], r, { width: 1.3, breaks: false, color: WALL_INK });
      inkStroke(g, [[L, edge[edge.length - 1][1]], [L - E, E]], r, { width: 1.3, breaks: false, color: WALL_INK });
      // coupe nette du toit contre le mur
      inkStroke(g, densify([[E, E], [L - E, E]], 6), r, { width: 2.2, wobble: 0.35, breaks: false, color: WALL_INK });
      g.restore();
      // le rebord s'arrête net de part et d'autre de chaque porte
      for (const [a, c] of doorSpans) for (const x of [a, c]) inkLine(g, x, -1, x, E, r, { width: 1.6, taper: 0, wobble: 0.3 });
      // Toit soulevé : les chevrons sciés dépassent de la coupe et reposent sur le dessus du mur (sablière),
      // bouts déchiquetés, chacun avec son ombre ; on comprend que le toit a été ôté pour montrer la salle.
      const spans = gaps
        .filter((gp) => gp.side === side)
        .map((gp) => [local(gp.a), local(gp.b)].sort((p, q) => p - q) as [number, number]);
      const stubs = new Path2D();
      const stubShadow = new Path2D();
      for (let x = E + S * 0.28 + r() * 4; x < L - E - 4; x += S / 2 + (r() - 0.5) * 4) {
        if (spans.some(([a, c]) => x > a - 6 && x < c + 6)) continue;
        const reach = 3 + r() * 6;
        const w = 4.4;
        const tip: Pt[] = [[x - w / 2, E - 1], [x + w / 2, E - 1], [x + w / 2, E + reach - r() * 2], [x + w * 0.1, E + reach + 1.5], [x - w / 2, E + reach - r() * 2.5]];
        stubs.addPath(pathOf(tip));
        stubShadow.addPath(pathOf(tip.map(([a, c]) => [a + 2.5, c + 3] as Pt)));
      }
      g.fillStyle = "rgba(16,10,5,.4)";
      g.fill(stubShadow);
      g.fillStyle = mixColor(pal.woodDark, pal.wood, 0.3);
      g.fill(stubs);
      g.strokeStyle = WALL_INK;
      g.lineWidth = 0.9;
      g.stroke(stubs);
    });
  }

  // 5. Portes : seuil, jambages, battant ferré entrouvert vers l'intérieur, marches de pierre dehors.
  for (const d of b.doors) paintDoor(v, b, d, r);
  // la salle est éclairée : un halo chaud déborde de chaque porte sur le seuil
  g.save();
  g.globalCompositeOperation = "screen";
  for (const d of b.doors) {
    const [cx, cy] = [(d.x + 0.5) * S, (d.y + 0.5) * S];
    const [dx, dy] = d.side === "N" ? [0, -1] : d.side === "S" ? [0, 1] : d.side === "W" ? [-1, 0] : [1, 0];
    const [hx, hy] = [cx + dx * S * 0.7, cy + dy * S * 0.7];
    const halo = g.createRadialGradient(hx, hy, 2, hx, hy, S * 1.1);
    halo.addColorStop(0, "rgba(255,186,96,.3)");
    halo.addColorStop(1, "rgba(255,160,70,0)");
    g.fillStyle = halo;
    g.fillRect(hx - S * 1.1, hy - S * 1.1, S * 2.2, S * 2.2);
  }
  g.restore();

  // 6. Souche de cheminée dans l'épaisseur du mur, au droit de l'âtre, avec un filet de fumée.
  if (b.chimney) {
    const { side, at } = b.chimney;
    const half = 10;
    const pts: Pt[] =
      side === "N"
        ? rectPts(at - half, o[1] - 6, half * 2, t + 8)
        : side === "S" ? rectPts(at - half, i[3] - 2, half * 2, t + 8) : side === "W" ? rectPts(o[0] - 6, at - half, t + 8, half * 2) : rectPts(i[2] - 2, at - half, t + 8, half * 2);
    solid(g, pts, mixColor(pal.stone, "#2a2018", 0.15), r, { ink: 0, shadow: 4 });
    inkStroke(g, densify(pts, 10, true), r, { width: 1.8, closed: true });
    const cx = pts[0][0] + (pts[1][0] - pts[0][0]) / 2;
    const cy = pts[0][1] + (pts[2][1] - pts[1][1]) / 2;
    g.fillStyle = "#120d08";
    g.fillRect(cx - 5, cy - 5, 10, 10);
    g.fillStyle = "rgba(230,110,40,.4)";
    g.fillRect(cx - 2.5, cy - 2.5, 5, 5);
    strokes(g, "rgba(235,230,220,.32)", 1.4, (p) => {
      for (let k = 0; k < 2; k++) {
        p.moveTo(cx + 2 + k * 3, cy - 4);
        p.bezierCurveTo(cx + 12 + k * 3, cy - 12, cx + 4 + k * 4, cy - 22, cx + 18 + k * 5, cy - 32);
      }
    });
  }

  // 7. Enseigne pendue au-dessus de la rue : potence de fer qui sort sous le rebord du toit, panneau peint, son ombre.
  const sign: Record<string, string> = { Auberge: "chope", Forge: "fer", Échoppe: "bourse", Boulangerie: "pain", Tonnellerie: "tonneau" };
  const sg = sign[b.label];
  const d0 = b.doors[0];
  if (sg && d0) {
    const right = d0.side === "N" || d0.side === "S" ? d0.x + 1 <= b.x1 - 1 : d0.y + 1 <= b.y1 - 1;
    const E = b.eaves.has(d0.side) ? EAVE : 0;
    const sx = d0.side === "N" || d0.side === "S" ? (d0.x + (right ? 1.5 : -0.5)) * S : d0.side === "W" ? o[0] - E : o[2] + E;
    const sy = d0.side === "N" ? o[1] - E : d0.side === "S" ? o[3] + E : (d0.y + (right ? 1.5 : -0.5)) * S;
    const dx = d0.side === "W" ? -1 : d0.side === "E" ? 1 : 0;
    const dy = d0.side === "N" ? -1 : d0.side === "S" ? 1 : 0;
    const big = b.label === "Auberge" ? 1.7 : 1.05;
    const reach = 15 * big;
    const px = sx + dx * reach;
    const py = sy + dy * reach;
    // panneau : posé de chant, le long de la façade ; on le voit d'en haut comme une planche épaisse avec ses chaînes
    const hw = 15 * big;
    const ht = 5 * big;
    const board: Pt[] = dy !== 0 ? rectPts(px - hw, py - ht, hw * 2, ht * 2) : rectPts(px - ht, py - hw, ht * 2, hw * 2);
    g.save();
    g.translate(14, 18);
    g.fillStyle = "rgba(18,12,6,.45)";
    g.fill(pathOf(board));
    g.restore();
    inkLine(g, sx - dx * 4, sy - dy * 4, px + dx * 3, py + dy * 3, r, { width: 2.6, color: WALL_INK, taper: 0 });
    // volute de la potence
    g.strokeStyle = WALL_INK;
    g.lineWidth = 1.3;
    g.beginPath();
    g.arc(sx + dx * reach * 0.45 + dy * 0, sy + dy * reach * 0.45, 4 * big, 0, Math.PI * 1.5);
    g.stroke();
    solid(g, board, mixColor(pal.woodLight, pal.wood, 0.35), r, { ink: 1.5, shadow: 0 });
    // le motif peint, en rouge sang ou en or terni
    const motif = sg === "chope" ? "#c9a34e" : sg === "fer" ? "#2e3032" : sg === "pain" ? "#b98a4a" : sg === "tonneau" ? pal.woodDark : pal.cloth[0];
    g.fillStyle = motif;
    g.beginPath();
    if (sg === "fer") {
      g.lineWidth = 2;
      g.strokeStyle = motif;
      g.arc(px, py, 3.2 * big, Math.PI * 0.15, Math.PI * 1.85);
      g.stroke();
    } else if (sg === "pain") g.ellipse(px, py, 5 * big, 3 * big, dy !== 0 ? 0 : Math.PI / 2, 0, Math.PI * 2);
    else g.arc(px, py, 3 * big, 0, Math.PI * 2);
    g.fill();
    if (sg === "chope") {
      g.strokeStyle = motif;
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(px + (dy !== 0 ? 4 * big : 0), py + (dy !== 0 ? 0 : 4 * big), 2 * big, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

function wallTexture(v: V, b: Building, L: number, t: number, r: Rng) {
  const { g, pal, S } = v;
  if (b.wall === "pise") {
    stipple(g, rectShape(0, 0, L, t), r, { density: 1.2, radius: 0.6, color: tint(pal.mud, 0, 0.4) });
    for (let s = 20; s < L - 10; s += 30 + r() * 40)
      inkPolyline(g, [[s, 0], [s + 3, t * 0.4], [s + 1, t]], r, { width: 0.6, color: "rgba(22,16,10,.5)", taper: 3 });
    return;
  }
  if (b.wall === "pierre") {
    // moellons en deux assises, de taille et de gris chaque fois différents ; de grosses boutisses traversent tout le mur
    const joints = new Path2D();
    const rows = 2;
    const stones: { pts: Pt[]; col: string }[] = [];
    const spans: [number, number][] = [];
    for (let s = r() * 30; s < L - 12; s += 26 + r() * 40) {
      const len = 10 + r() * 6;
      spans.push([s, s + len]);
    }
    for (const [a, c] of spans)
      stones.push({ pts: [[a + 0.8, 0.8], [c - 0.8, 0.6 + r() * 0.6], [c - 0.6, t - 0.8], [a + 0.6, t - 0.6 - r() * 0.6]], col: tint(pal.stone, (r() - 0.5) * 0.2 + 0.03) });
    for (let k = 0; k < rows; k++) {
      const y0 = (k * t) / rows + (k ? (r() - 0.5) * 2 : 0);
      const y1 = ((k + 1) * t) / rows;
      let s = -r() * 10;
      while (s < L) {
        const len = 6 + r() * 14;
        const hit = spans.find(([a, c]) => s + len > a && s < c);
        if (hit) {
          if (hit[0] - s > 4) stones.push({ pts: [[s + 0.8, y0 + 0.8], [hit[0] - 0.8, y0 + 0.8], [hit[0] - 0.8, y1 - 0.8], [s + 0.8, y1 - 0.8]], col: tint(pal.stone, (r() - 0.5) * 0.24) });
          s = hit[1];
          continue;
        }
        const warm = r() < 0.2 ? mixColor(pal.stone, "#a08060", 0.25) : pal.stone;
        stones.push({
          pts: [[s + 0.8, y0 + 0.8], [s + len - 0.8, y0 + 0.6 + r() * 0.6], [s + len - 0.8 + (r() - 0.5), y1 - 0.8], [s + 0.8, y1 - 0.6 - r() * 0.6]],
          col: tint(warm, (r() - 0.5) * 0.24),
        });
        s += len;
      }
    }
    // joints de mortier sombres dessous, chaque pierre par-dessus avec son arête claire et son ombre
    g.fillStyle = tint(pal.stone, -0.38);
    g.fillRect(0, 0, L, t);
    for (const st of stones) {
      const p = pathOf(st.pts);
      g.fillStyle = st.col;
      g.fill(p);
      joints.addPath(p);
      const [ax, ay] = st.pts[0];
      const [bx2] = st.pts[1];
      const cy = st.pts[2][1];
      g.fillStyle = "rgba(255,248,230,.18)";
      g.fillRect(ax, ay, bx2 - ax, 1.2);
      g.fillStyle = "rgba(18,12,6,.2)";
      g.fillRect(ax, cy - 1.4, bx2 - ax, 1.4);
      if (r() < 0.12) hatchLines(g, shapeOf(st.pts), r, { spacing: 2.2, width: 0.5, color: "rgba(22,16,10,.45)" });
    }
    g.strokeStyle = "rgba(22,16,10,.8)";
    g.lineWidth = 0.75;
    g.stroke(joints);
    return;
  }
  if (b.wall === "colombage") {
    // torchis crème tacheté entre des bois sombres : sablières continues, poteaux aux angles et à chaque case,
    // une écharpe ou une croix de Saint-André dans un panneau sur deux
    g.fillStyle = pal.daub;
    g.fillRect(0, 0, L, t);
    stipple(g, rectShape(0, 0, L, t), r, { density: 2.2, radius: 0.45, color: tint(pal.daub, -0.22, 0.5) });
    stipple(g, rectShape(0, 0, L, t), r, { density: 0.5, radius: 0.9, color: tint(pal.daub, 0.1, 0.6) });
    const timber = new Path2D();
    const sab = 2.8;
    timber.rect(0, 0, L, sab);
    timber.rect(0, t - sab, L, sab);
    const posts = [3];
    for (let s = S; s < L - 6; s += S) posts.push(s);
    posts.push(L - 3);
    for (const p of posts) timber.rect(p - 3, 0, 6, t);
    g.fillStyle = pal.timber;
    g.fill(timber);
    g.lineCap = "butt";
    g.strokeStyle = pal.timber;
    g.lineWidth = 2.6;
    const startPanel = Math.floor(r() * 2);
    for (let k = startPanel; k < posts.length - 1; k += 2) {
      const a = posts[k] + 3;
      const c = posts[k + 1] - 3;
      if (c - a < 10) continue;
      g.beginPath();
      if (r() < 0.55) {
        g.moveTo(a, sab);
        g.lineTo(c, t - sab);
        g.moveTo(a, t - sab);
        g.lineTo(c, sab);
      } else if (r() < 0.5) {
        g.moveTo(a, t - sab);
        g.lineTo(c, sab);
      } else {
        g.moveTo(a, sab);
        g.lineTo(c, t - sab);
      }
      g.stroke();
    }
    // fil du bois clair et contour fin des bois
    g.strokeStyle = "rgba(22,16,10,.7)";
    g.lineWidth = 0.6;
    g.stroke(timber);
    g.strokeStyle = "rgba(255,236,200,.16)";
    g.beginPath();
    for (const p of posts) {
      g.moveTo(p - 1, 1);
      g.lineTo(p - 1, t - 1);
    }
    g.moveTo(0, 1);
    g.lineTo(L, 1);
    g.stroke();
    return;
  }
  if (b.wall === "planches") {
    for (let k = 1; k < 3; k++)
      inkLine(g, 0, (k * t) / 3, L, (k * t) / 3, r, { width: 0.6, color: "rgba(22,16,10,.6)", taper: 0 });
    for (let s = r() * 30; s < L; s += 30 + r() * 30)
      inkLine(g, s, 0, s, t, r, { width: 0.6, color: "rgba(22,16,10,.5)", taper: 0 });
    return;
  }
  // métal : tôles rivetées
  for (let s = 0; s < L; s += 24) {
    g.strokeStyle = "rgba(10,12,14,.6)";
    g.lineWidth = 0.8;
    g.strokeRect(s + 0.5, 0.5, 24, t - 1);
    g.fillStyle = tint(pal.metal, 0.2, 0.8);
    g.fillRect(s + 3, 2.5, 1.6, 1.6);
    g.fillRect(s + 3, t - 4, 1.6, 1.6);
  }
}

/** Texture d'un pan de toit dans son repère : x le long de l'égout (0 à L), y de l'égout (0) vers le faîte coupé (D). */
function roofTexture(v: V, style: RoofStyle, col: string, L: number, D: number, r: Rng) {
  const { g } = v;
  const dark = tint(col, -0.28, 0.7);
  const light = tint(col, 0.14, 0.55);
  switch (style) {
    case "chaume": {
      // trois rangs de bottes de paille qui se chevauchent : chaque rang fait une ombre sur le suivant
      const courses = [0, D * 0.36, D * 0.7];
      courses.forEach((c0, ci) => {
        const c1 = ci < courses.length - 1 ? courses[ci + 1] : D;
        const grad = g.createLinearGradient(0, c0, 0, c1);
        grad.addColorStop(0, tint(col, 0.08, 0.5));
        grad.addColorStop(1, tint(col, -0.18, 0.55));
        g.fillStyle = grad;
        g.fillRect(0, c0, L, c1 - c0);
        strokes(g, dark, 0.75, (p) => {
          for (let x = 0; x < L; x += 1.6) {
            const y0 = c0 + r() * 2.5;
            p.moveTo(x, y0);
            p.lineTo(x + (r() - 0.5) * 1.6, y0 + (c1 - c0) * (0.35 + r() * 0.65));
          }
        });
        strokes(g, light, 0.6, (p) => {
          for (let x = 0; x < L; x += 2.7) {
            const y0 = c0 + r() * (c1 - c0) * 0.5;
            p.moveTo(x, y0);
            p.lineTo(x + (r() - 0.5) * 1.5, y0 + 3 + r() * 6);
          }
        });
        if (ci > 0) inkPolyline(g, [[0, c0], [L, c0]], r, { width: 1, color: tint(col, -0.45, 0.75), wobble: 1.4, taper: 0 });
      });
      // mousse dans les creux
      for (let k = 0; k < L / 80; k++) {
        const x = r() * L;
        const y = D * (0.2 + r() * 0.5);
        stipple(g, shapeOf(blobPoints(r, x, y, 10, 5, 7, 0.3)), r, { density: 5, radius: 0.7, color: "rgba(70,95,50,.55)" });
      }
      break;
    }
    case "tuiles":
    case "ardoise":
    case "bardeaux": {
      courses(v, style, col, L, D, r);
      break;
    }
    case "plaques": {
      for (let x = 0; x < L; x += 26) {
        g.strokeStyle = "rgba(10,12,14,.7)";
        g.lineWidth = 0.9;
        g.strokeRect(x, -2, 26, D + 4);
        g.fillStyle = light;
        for (let y = 4; y < D; y += 8) {
          g.fillRect(x + 2.5, y, 1.5, 1.5);
          g.fillRect(x + 22, y, 1.5, 1.5);
        }
      }
      // un panneau de service de temps en temps (grille d'aération), et des voyants qui veillent
      if (D > 14 && r() < 0.6) {
        const x = 6 + r() * Math.max(1, L - 30);
        const y = 4 + r() * Math.max(1, D - 16);
        g.fillStyle = dark;
        g.fillRect(x, y, 16, 9);
        strokes(g, "rgba(200,210,215,.5)", 0.6, (p) => {
          for (let k = 2; k < 16; k += 3) {
            p.moveTo(x + k, y + 1.5);
            p.lineTo(x + k, y + 7.5);
          }
        });
        g.strokeStyle = "rgba(10,12,14,.8)";
        g.strokeRect(x, y, 16, 9);
      }
      for (let k = 0; k < L / 90; k++) {
        if (r() < 0.4) continue;
        const x = 8 + r() * (L - 16);
        const y = 3 + r() * Math.max(1, D - 6);
        const on = r() < 0.6 ? "rgba(120,230,150," : "rgba(240,90,70,";
        const halo = g.createRadialGradient(x, y, 0, x, y, 6);
        halo.addColorStop(0, on + ".55)");
        halo.addColorStop(1, on + "0)");
        g.fillStyle = halo;
        g.fillRect(x - 6, y - 6, 12, 12);
        g.fillStyle = on + "1)";
        g.fillRect(x - 1, y - 1, 2, 2);
      }
      break;
    }
    case "tole": {
      // tôle ondulée, coulures de rouille
      strokes(g, dark, 0.7, (p) => {
        for (let x = 0; x < L; x += 3.6) {
          p.moveTo(x, 0);
          p.lineTo(x, D);
        }
      });
      strokes(g, light, 0.6, (p) => {
        for (let x = 1.8; x < L; x += 3.6) {
          p.moveTo(x, 0);
          p.lineTo(x, D);
        }
      });
      for (let x = r() * 40; x < L; x += 40 + r() * 30)
        inkLine(g, x, 0, x, D, r, { width: 1, color: tint(col, -0.35, 0.8), taper: 0 });
      patches(v, col, L, D, r);
      for (let k = 0; k < L / 60; k++) {
        const x = r() * L;
        const grad = g.createRadialGradient(x, D * 0.5, 0, x, D * 0.5, 14);
        grad.addColorStop(0, "rgba(140,70,30,.45)");
        grad.addColorStop(1, "rgba(140,70,30,0)");
        g.fillStyle = grad;
        g.fillRect(x - 14, 0, 28, D);
      }
      break;
    }
  }
}

/**
 * Couverture en rangs (tuiles, ardoises, bardeaux), dans le repère du pan : x le long de l'égout, y de l'égout vers le faîte.
 * Une ligne d'encre par rang, parallèle au faîtage, qui ondule à peine ; joints en quinconce, décalés d'un demi-module
 * d'un rang à l'autre avec un peu de jeu ; sous chaque rang, la mince ombre du rang qui le recouvre ; le bord du rang
 * accroche la lumière. Deux ou trois éléments refaits par pan, dessinés comme les autres, d'une autre fournée.
 */
function courses(v: V, style: RoofStyle, col: string, L: number, D: number, r: Rng) {
  const { g } = v;
  const nz = noise2(Math.floor(r() * 1e6));
  const rowH = style === "tuiles" ? 6.2 : style === "ardoise" ? 6.8 : 7.4;
  const mod = style === "tuiles" ? 7 : style === "ardoise" ? 9.5 : 8;
  const shade = new Path2D();
  const lip = new Path2D();
  const joints = new Path2D();
  const course = new Path2D();
  // rangs refaits : quelques éléments seulement, choisis d'avance
  const nFix = Math.min(3, 1 + Math.floor((L * D) / 3000));
  const fixes = Array.from({ length: nFix }, () => [Math.floor(r() * (D / rowH)), r() * L] as [number, number]);
  const rows = Math.ceil(D / rowH) + 1;
  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    // ondulation du rang : la volige n'est jamais droite, un bruit lent qui suit x
    const wob = (x: number) => nz(x / 60, row * 0.37) * 0.9;
    shade.moveTo(-2, y + wob(-2));
    for (let x = 0; x <= L + 6; x += 6) shade.lineTo(x, y + wob(x));
    for (let x = L + 6; x >= -2; x -= 6) shade.lineTo(x, y + wob(x) + 2.1);
    shade.closePath();
    // joints : décalés d'un demi-module à chaque rang, chaque élément un peu plus ou moins large
    const tiles: [number, number][] = [];
    for (let x = (row % 2 ? -mod / 2 : 0) - r() * 1.5; x < L + mod; ) {
      const tw = mod * (style === "tuiles" ? 1 : 0.8 + r() * 0.45);
      tiles.push([x, tw]);
      x += tw;
    }
    if (style === "tuiles") {
      // tuiles canal : un arrondi par tuile au bord du rang, la crête claire au milieu
      course.moveTo(tiles[0][0], y + wob(tiles[0][0]));
      for (const [x, tw] of tiles) {
        course.quadraticCurveTo(x + tw / 2, y + wob(x) + 3.4, x + tw, y + wob(x + tw));
        lip.moveTo(x + tw * 0.32, y + wob(x) + 2.6);
        lip.quadraticCurveTo(x + tw / 2, y + wob(x) + 3.2, x + tw * 0.68, y + wob(x) + 2.6);
        joints.moveTo(x + tw, y + wob(x + tw) + 0.4);
        joints.lineTo(x + tw + (r() - 0.5) * 0.6, y + rowH * 0.62);
      }
    } else {
      for (const [x, tw] of tiles) {
        joints.moveTo(x + tw, y + wob(x + tw) + 0.3);
        joints.lineTo(x + tw + (r() - 0.5) * 0.7, y + rowH - 0.2);
      }
      lip.moveTo(-2, y + wob(-2) + 0.9);
      for (let x = 0; x <= L + 6; x += 6) lip.lineTo(x, y + wob(x) + 0.9);
      // le rang : traits de plume de longueur inégale, la plume se relève de temps en temps
      for (let x = -r() * 20; x < L + 4; ) {
        const len = 22 + r() * 50;
        course.moveTo(x, y + wob(x));
        for (let xx = x + 6; xx < x + len; xx += 6) course.lineTo(xx, y + wob(xx));
        course.lineTo(x + len, y + wob(x + len));
        x += len + (r() < 0.5 ? 0 : 1 + r() * 3);
      }
    }
    for (const [fr, fx] of fixes) {
      if (fr !== row) continue;
      const t = tiles.find(([x, tw]) => fx >= x && fx < x + tw);
      if (!t) continue;
      g.fillStyle = r() < 0.5 ? tint(mixColor(col, style === "ardoise" ? "#5a6670" : "#b4623e", 0.4), 0.06, 0.9) : tint(col, 0.2, 0.8);
      g.fillRect(t[0] + 0.5, y + 1, t[1] - 1, rowH - 1.2);
    }
  }
  g.fillStyle = tint(col, -0.5, 0.32);
  g.fill(shade);
  g.lineCap = "round";
  g.strokeStyle = tint(col, -0.38, 0.55);
  g.lineWidth = 0.55;
  g.stroke(joints);
  g.strokeStyle = tint(col, 0.28, 0.45);
  g.lineWidth = 0.7;
  g.stroke(lip);
  g.strokeStyle = tint(col, -0.62, 0.78);
  g.lineWidth = style === "tuiles" ? 0.85 : 0.75;
  g.stroke(course);
  // premier rang à l'égout : dans l'ombre de la gouttière
  g.fillStyle = tint(col, -0.45, 0.4);
  g.fillRect(-2, -2, L + 4, rowH * 0.55 + 2);
}

function paintDoor(v: V, b: Building, d: Door, r: Rng) {
  const { g, S, pal } = v;
  const t = b.t;
  const x = d.x * S;
  const y = d.y * S;
  // Repère de la porte : x le long du mur (0 à S), y de la façade (0) vers l'intérieur (t = face intérieure).
  let ox: number, oy: number;
  if (d.side === "N") [ox, oy] = [x, y];
  else if (d.side === "S") [ox, oy] = [x + S, y + S];
  else if (d.side === "W") [ox, oy] = [x, y + S];
  else [ox, oy] = [x + S, y];
  const big = b.label === "Temple" || b.label === "Maison du chef" || b.label === "Caserne";
  const stone = mixColor(pal.flag, pal.stone, 0.4);
  inFrame(g, ox, oy, d.side, () => {
    // marches de pierre dehors, sous le rebord du toit : une, ou deux pour les grandes maisons
    if (big) solid(g, [[6, -22], [S - 6, -21], [S - 7, -10], [7, -10]], tint(stone, -0.04), r, { ink: 0, shadow: 3 });
    const step: Pt[] = [[8, -12], [S - 8, -12.5], [S - 8, 0], [8, 0]];
    solid(g, step, stone, r, { ink: 0, shadow: 3 });
    if (big) inkStroke(g, [[6, -22], [S - 6, -21], [S - 7, -10], [7, -10]], r, { width: 1.3, closed: true, breaks: false });
    inkStroke(g, step, r, { width: 1.4, closed: true, breaks: false });
    // pierre usée au milieu, éclat au coin
    g.fillStyle = "rgba(22,16,10,.12)";
    g.beginPath();
    g.ellipse(S / 2, -6, S * 0.22, 3, 0, 0, Math.PI * 2);
    g.fill();
    inkLine(g, S - 14, -12, S - 10, -7, r, { width: 0.6, taper: 2 });
    // seuil dans l'épaisseur du mur
    solid(g, rectPts(5, -0.5, S - 10, t + 1), mixColor(pal.flag, "#ffffff", 0.08), r, { ink: 0, shadow: 0 });
    strokes(g, "rgba(22,16,10,.45)", 0.6, (p) => {
      p.moveTo(9, t * 0.5);
      p.lineTo(S - 9, t * 0.5 + (r() - 0.5));
    });
    // jambages (pierre de taille ou poteaux)
    const jamb = b.wall === "pierre" ? mixColor(pal.stone, "#ffffff", 0.12) : pal.timber;
    for (const jx of [3, S - 9]) {
      solid(g, rectPts(jx, -1.5, 6, t + 3), jamb, r, { ink: 0, shadow: 0, light: false });
      inkStroke(g, rectPts(jx, -1.5, 6, t + 3), r, { width: 1.2, closed: true, breaks: false });
    }
    // battant de planches, ferré, entrouvert vers l'intérieur, pivotant sur le jambage gauche
    g.save();
    g.translate(9, t);
    const swing = 1.05 + r() * 0.35;
    g.rotate(swing);
    // vantail plein de 0,15 case d'épaisseur : planches jointives, traverses, gond rond visible
    const leafLen = S - 18;
    const th = S * 0.15;
    const leaf = rectPts(0, -th / 2, leafLen, th);
    const wood = mixColor(v.c.theme.door, pal.wood, 0.25);
    solid(g, leaf, wood, r, { ink: 0, shadow: 4, light: false });
    strokes(g, "rgba(22,16,10,.55)", 0.55, (p) => {
      for (const f of [1 / 3, 2 / 3]) {
        p.moveTo(1, -th / 2 + th * f);
        p.lineTo(leafLen - 1, -th / 2 + th * f);
      }
    });
    g.fillStyle = tint(wood, 0.15, 0.5);
    g.fillRect(1, -th / 2 + 0.6, leafLen - 2, 1);
    // pentures de fer et gond
    g.fillStyle = "#2b2a28";
    g.fillRect(3, -th / 2 - 0.4, 10, th + 0.8);
    g.fillRect(leafLen - 10, -th / 2 - 0.4, 4, th + 0.8);
    inkStroke(g, leaf, r, { width: 1.3, closed: true, breaks: false, color: WALL_INK });
    disc(g, 0, 0, 2.4, "#3a3836", r, { ink: 0.9, shadow: 0, light: false });
    // arc de l'ouverture, en pointillé léger sur le sol
    g.setLineDash([2, 3]);
    g.strokeStyle = "rgba(22,16,10,.35)";
    g.lineWidth = 0.6;
    g.beginPath();
    g.arc(0, 0, leafLen, 0, -swing, true);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  });
  // lanterne à côté de l'entrée (auberge, temple, et une maison sur quatre)
  if (b.label === "Auberge" || b.label === "Temple" || r() < 0.25) {
    const e = b.eaves.has(d.side) ? EAVE - 4 : 4;
    const [lx, ly] = d.side === "N" ? [x + S + 3, y - e] : d.side === "S" ? [x - 3, y + S + e] : d.side === "W" ? [x - e, y - 3] : [x + S + e, y + S + 3];
    glow(g, lx, ly, 34, 0.42);
    disc(g, lx, ly, 2.8, "#2a2420", r, { ink: 0.9, shadow: 2, light: false });
    flame(g, lx, ly, 1.2);
  }
}

// ——— Le genre change les objets, pas seulement les couleurs ———

/**
 * Saveur du village selon le genre : la matière dit déjà beaucoup (métal, planches, terre), et parmi les planches
 * le fond bleu nuit de la carte distingue le port des pirates du bourg de western.
 */
type Flavor = "fantasy" | "sf" | "port" | "western" | "ruines";

function flavorOf(c: MapCtx): Flavor {
  if (c.material === "metal") return "sf";
  if (c.material === "terre") return "ruines";
  if (c.material === "planches") {
    const n = parseInt(c.theme.background.replace("#", "").slice(0, 6), 16);
    return (n & 255) > (n >> 16) + 12 ? "port" : "western";
  }
  return "fantasy";
}

/** Réservoir d'eau (science-fiction) : cuve ronde rivetée, trappe, échelle, conduite vers une pompe, vanne rouge. */
function paintTank(v: V, cx: number, cy: number, r: Rng) {
  const { g, S, pal } = v;
  const R = S * 0.82;
  const sh = new Path2D();
  sh.moveTo(cx + R, cy);
  sh.arc(cx, cy, R, 0, Math.PI * 2);
  // ombre longue : la cuve est haute
  const shadow = new Path2D();
  shadow.arc(cx + 26, cy + 32, R, 0, Math.PI * 2);
  shadow.rect(cx - R * 0.7 + 13, cy - R * 0.7 + 16, R * 1.4, R * 1.4);
  castShadow(g, { path: shadow, box: [cx - R + 13, cy - R + 16, R * 2 + 26, R * 2 + 32] }, r, { alpha: 0.42 });
  const metal = mixColor(pal.metal, "#8c969c", 0.35);
  g.fillStyle = metal;
  g.fill(sh);
  const lg = g.createRadialGradient(cx - R * 0.45, cy - R * 0.45, R * 0.1, cx, cy, R);
  lg.addColorStop(0, "rgba(255,255,255,.32)");
  lg.addColorStop(0.6, "rgba(255,255,255,0)");
  lg.addColorStop(1, "rgba(10,14,18,.4)");
  g.fillStyle = lg;
  g.fill(sh);
  // anneaux de tôle et rivets
  g.save();
  g.clip(sh);
  hatchLines(g, { path: sh, box: [cx - R, cy - R, R * 2, R * 2] }, r, { spacing: 3.4, width: 0.6, color: "rgba(10,14,18,.35)", angle: -Math.PI / 4 });
  g.restore();
  for (const k of [0.72, 0.42]) {
    g.strokeStyle = "rgba(10,14,18,.7)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, R * k, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "rgba(10,14,18,.75)";
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    g.fillRect(cx + Math.cos(a) * R * 0.86 - 0.8, cy + Math.sin(a) * R * 0.86 - 0.8, 1.6, 1.6);
  }
  inkStroke(
    g,
    densify(Array.from({ length: 32 }, (_, k) => [cx + Math.cos((k / 32) * Math.PI * 2) * R, cy + Math.sin((k / 32) * Math.PI * 2) * R] as Pt), 6, true),
    r,
    { width: 2.4, closed: true, breaks: false, color: WALL_INK },
  );
  // trappe de visite et sa poignée
  disc(g, cx - 4, cy - 3, R * 0.22, mixColor(metal, "#2a3036", 0.3), r, { ink: 1.2, shadow: 2 });
  inkLine(g, cx - 10, cy - 3, cx + 2, cy - 3, r, { width: 1.6, color: WALL_INK, taper: 0 });
  // échelle sur le flanc et conduite vers la pompe
  strokes(g, "rgba(10,14,18,.85)", 1.2, (p) => {
    p.moveTo(cx + R * 0.55, cy + R * 0.55);
    p.lineTo(cx + R * 0.95, cy + R * 0.95);
    p.moveTo(cx + R * 0.65, cy + R * 0.45);
    p.lineTo(cx + R * 1.05, cy + R * 0.85);
    for (let k = 0; k < 4; k++) {
      const t = 0.1 + k * 0.25;
      p.moveTo(cx + R * (0.55 + 0.4 * t), cy + R * (0.55 + 0.4 * t));
      p.lineTo(cx + R * (0.65 + 0.4 * t), cy + R * (0.45 + 0.4 * t));
    }
  });
  const px = cx - R * 1.25;
  const py = cy + R * 0.5;
  inkPolyline(g, [[cx - R * 0.9, cy + R * 0.3], [px + 6, py]], r, { width: 5, color: mixColor(pal.metal, "#2a3036", 0.4), wobble: 0.2, taper: 0 });
  solid(g, rectPts(px - 8, py - 7, 16, 14), mixColor(pal.metal, "#3a4046", 0.3), r, { ink: 1.3, shadow: 4 });
  disc(g, px, py, 3.2, "#b8473a", r, { ink: 0.9, shadow: 1 });
  // flaque d'eau claire sous la vanne
  puddle(v, px + 10, py + 16, 12, 6, 0.3, r);
}

/** Margelle de ferraille (post-apocalypse) : buse de béton fendue, fers à béton tordus, bidon, pompe à bras. */
function paintScrapWell(v: V, cx: number, cy: number, r: Rng) {
  const { g, S, pal } = v;
  const R = S * 0.7;
  const Ri = R * 0.62;
  const shadow = new Path2D();
  shadow.arc(cx + 9, cy + 11, R, 0, Math.PI * 2);
  castShadow(g, { path: shadow, box: [cx - R + 9, cy - R + 11, R * 2, R * 2] }, r, { alpha: 0.4 });
  const ring = new Path2D();
  ring.arc(cx, cy, R, 0, Math.PI * 2);
  ring.arc(cx, cy, Ri, 0, Math.PI * 2, true);
  const concrete = mixColor(pal.stone, "#9a968c", 0.4);
  g.fillStyle = concrete;
  g.fill(ring);
  stipple(g, { path: ring, box: [cx - R, cy - R, R * 2, R * 2] }, r, { density: 1.6, radius: 0.6, color: "rgba(22,16,10,.4)" });
  g.save();
  g.clip(ring);
  g.fillStyle = "rgba(18,12,6,.25)";
  g.beginPath();
  g.arc(cx + 3, cy + 4, R, 0, Math.PI * 2);
  g.arc(cx, cy, R + 4, 0, Math.PI * 2, true);
  g.fill();
  g.restore();
  // fissures et fers qui dépassent
  for (let k = 0; k < 3; k++) {
    const a = r() * Math.PI * 2;
    inkPolyline(
      g,
      [
        [cx + Math.cos(a) * Ri, cy + Math.sin(a) * Ri],
        [cx + (Math.cos(a + 0.08) * (Ri + R)) / 2, cy + (Math.sin(a + 0.08) * (Ri + R)) / 2],
        [cx + Math.cos(a - 0.04) * R, cy + Math.sin(a - 0.04) * R],
      ],
      r,
      { width: 0.8, taper: 2 },
    );
  }
  strokes(g, "#5a3a24", 1.4, (p) => {
    for (let k = 0; k < 4; k++) {
      const a = r() * Math.PI * 2;
      p.moveTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
      p.quadraticCurveTo(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2, cx + Math.cos(a + 0.4) * R * 1.3, cy + Math.sin(a + 0.4) * R * 1.25);
    }
  });
  inkStroke(
    g,
    densify(Array.from({ length: 28 }, (_, k) => [cx + Math.cos((k / 28) * Math.PI * 2) * R, cy + Math.sin((k / 28) * Math.PI * 2) * R] as Pt), 6, true),
    r,
    { width: 2, closed: true, breaks: false, color: WALL_INK },
  );
  g.fillStyle = "#1a2220";
  g.beginPath();
  g.arc(cx, cy, Ri - 1, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(200,214,180,.5)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(cx + 2, cy + 3, Ri * 0.45, 0.2, 1.3);
  g.stroke();
  // pompe à bras rouillée en travers
  inkLine(g, cx - R * 0.9, cy - R * 0.2, cx + R * 0.5, cy - R * 0.1, r, { width: 4, color: "#6a3c22", taper: 0 });
  solid(g, rectPts(cx - R * 0.9 - 6, cy - R * 0.2 - 6, 12, 12), "#7a4a2a", r, { ink: 1.2, shadow: 3 });
  // bidon d'huile et pneu à côté
  oilDrum(v, cx + R * 1.05, cy + R * 0.55, r);
  tire(v, cx - R * 1.1, cy + R * 0.75, 10, r);
}

/** Bidon de 200 litres vu d'en haut : couvercle cerclé, bonde, rouille. */
function oilDrum(v: V, cx: number, cy: number, r: Rng, col?: string) {
  const { g } = v;
  const c = col ?? pick(r, ["#7a3a26", "#4a5a3a", "#3a4a5a", "#8a6a2a"]);
  disc(g, cx, cy, 9, c, r, { ink: 1.3, shadow: 4 });
  g.strokeStyle = "rgba(18,12,6,.7)";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(cx, cy, 7, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#1a120a";
  g.beginPath();
  g.arc(cx + 3, cy - 3, 1.5, 0, Math.PI * 2);
  g.fill();
  const rust = g.createRadialGradient(cx - 2, cy + 3, 0, cx - 2, cy + 3, 6);
  rust.addColorStop(0, "rgba(150,70,30,.5)");
  rust.addColorStop(1, "rgba(150,70,30,0)");
  g.fillStyle = rust;
  g.fillRect(cx - 9, cy - 9, 18, 18);
}

/** Pneu couché : anneau noir à crampons, intérieur vide (ou rempli de terre et d'une plante). */
function tire(v: V, cx: number, cy: number, rad: number, r: Rng, plant = false) {
  const { g, pal } = v;
  g.save();
  g.translate(4, 5);
  g.fillStyle = "rgba(18,12,6,.35)";
  g.beginPath();
  g.arc(cx, cy, rad, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const ring = new Path2D();
  ring.arc(cx, cy, rad, 0, Math.PI * 2);
  ring.arc(cx, cy, rad * 0.55, 0, Math.PI * 2, true);
  g.fillStyle = "#24221f";
  g.fill(ring);
  strokes(g, "rgba(120,116,108,.6)", 0.8, (p) => {
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      p.moveTo(cx + Math.cos(a) * rad * 0.7, cy + Math.sin(a) * rad * 0.7);
      p.lineTo(cx + Math.cos(a + 0.12) * rad * 0.95, cy + Math.sin(a + 0.12) * rad * 0.95);
    }
  });
  g.fillStyle = plant ? mixColor(pal.dirt, pal.mud, 0.5) : "#3a3430";
  g.beginPath();
  g.arc(cx, cy, rad * 0.55, 0, Math.PI * 2);
  g.fill();
  if (plant) solid(g, smoothPoints(blobPoints(r, cx, cy, rad * 0.5, rad * 0.45, 7, 0.35), 1), pick(r, pal.leaves), r, { ink: 0.7, shadow: 1.5 });
  inkStroke(
    g,
    densify(Array.from({ length: 16 }, (_, k) => [cx + Math.cos((k / 16) * Math.PI * 2) * rad, cy + Math.sin((k / 16) * Math.PI * 2) * rad] as Pt), 5, true),
    r,
    { width: 1.2, closed: true, breaks: false },
  );
}

/** Filet de pêche qui sèche : maille losangée qui suit la forme, flotteurs de liège sur la ralingue. */
function fishingNet(v: V, pts: Pt[], r: Rng) {
  const { g } = v;
  const sh = shapeOf(pts);
  g.save();
  g.translate(5, 6);
  g.fillStyle = "rgba(18,12,6,.18)";
  g.fill(sh.path);
  g.restore();
  g.fillStyle = "rgba(120,104,72,.35)";
  g.fill(sh.path);
  hatchLines(g, sh, r, { spacing: 4.2, width: 0.6, color: "rgba(40,30,18,.75)", angle: Math.PI / 4, cross: true });
  inkStroke(g, densify(pts, 6, true), r, { width: 1, closed: true, color: "rgba(40,30,18,.85)", wobble: 0.6 });
  for (let k = 0; k < pts.length; k += 2)
    disc(g, pts[k][0], pts[k][1], 2.2, "#c9a35e", r, { ink: 0.6, shadow: 1, light: false });
}

/** Conteneur (science-fiction) : tôle nervurée, bandes de marquage, portes au bout, ombre franche. */
function container(v: V, x: number, y: number, w: number, h: number, r: Rng) {
  const { g } = v;
  const col = pick(r, ["#8a4a30", "#3e5a6a", "#6a7040", "#9a8a5a"]);
  castShadow(g, shapeOf(boxShadow(x, y, x + w, y + h, 12, 15)), r, { alpha: 0.35 });
  solid(g, rectPts(x, y, w, h), col, r, { ink: 0, shadow: 0 });
  strokes(g, tint(col, -0.3, 0.8), 0.8, (p) => {
    for (let k = 3; k < w; k += 4) {
      p.moveTo(x + k, y + 2);
      p.lineTo(x + k, y + h - 2);
    }
  });
  strokes(g, tint(col, 0.2, 0.6), 0.6, (p) => {
    for (let k = 4.6; k < w; k += 4) {
      p.moveTo(x + k, y + 2);
      p.lineTo(x + k, y + h - 2);
    }
  });
  g.fillStyle = "rgba(240,220,160,.75)";
  g.fillRect(x + w * 0.3, y + 3, w * 0.25, 3);
  g.fillStyle = "rgba(18,12,6,.55)";
  g.fillRect(x + w - 6, y + 2, 4, h - 4);
  inkStroke(g, densify(rectPts(x, y, w, h), 6, true), r, { width: 1.6, closed: true, breaks: false, color: WALL_INK });
}

/** Étal de ferraille (post-apocalypse) : appentis de tôle sur deux poteaux, pneus, bidons, pièces détachées. */
function scrapStall(v: V, x: number, y: number, w: number, h: number, sy: number, r: Rng) {
  const { g, pal } = v;
  castShadow(g, shapeOf(boxShadow(x, y, x + w, y + h, 13, 16)), r, { alpha: 0.32 });
  const col = mixColor(pal.metal, "#8a6c4c", 0.5);
  const sheet = rectPts(x, y, w, h);
  g.save();
  g.clip(pathOf(sheet));
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
  inFrame(g, x, y, "N", () => roofTexture(v, "tole", col, w, h, r));
  g.restore();
  inkStroke(g, densify(sheet, 6, true), r, { width: 1.5, closed: true, breaks: false, color: WALL_INK });
  // le bric-à-brac devant, côté place
  const fy = sy < 0 ? y + h + 10 : y - 10;
  tire(v, x + 12, fy, 9, r);
  oilDrum(v, x + w - 12, fy + (sy < 0 ? 4 : -4), r);
  for (let k = 0; k < 4; k++) crate(v, x + 26 + k * 9 + (r() - 0.5) * 3, fy - 5 + (r() - 0.5) * 4, 7, r, r() * 0.8);
}

/** Bac de culture hydroponique (science-fiction) : cadre de métal, rigoles d'eau bleue, rangs de pousses vert vif. */
function hydroPlot(v: V, x: number, y: number, w: number, h: number, r: Rng) {
  const { g, pal } = v;
  solid(g, rectPts(x, y, w, h), mixColor(pal.metal, "#2a3036", 0.3), r, { ink: 1.4, shadow: 4 });
  const rows = Math.max(2, Math.floor((h - 6) / 10));
  for (let k = 0; k < rows; k++) {
    const yy = y + 5 + k * ((h - 10) / Math.max(1, rows - 1));
    g.fillStyle = "rgba(60,140,170,.7)";
    g.fillRect(x + 4, yy - 1.5, w - 8, 3);
    for (let s = x + 7; s < x + w - 5; s += 6) {
      if (r() < 0.1) continue;
      disc(g, s, yy + (r() - 0.5), 2.2 + r(), mixColor(pal.leaves[1], "#7ad06a", 0.5), r, { ink: 0.5, shadow: 0.8, light: false });
    }
  }
}

// ——— Logis fermés : toits vus d'en haut ———

/** Rectangle de cases, bornes comprises. */
interface CellRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Bloc bâti sans intérieur (cases de mur pleines) : un logis qu'on ne visite pas, dessiné avec son toit.
 * Accolé à un lieu ouvert, c'est un appentis (un seul pan qui descend depuis le mur) ou, contre le temple,
 * le clocher (toit en pavillon et grande ombre).
 */
interface Block {
  /** Rectangles de cases, le plus grand d'abord (corps de logis, puis l'aile d'un plan en L). */
  rects: CellRect[];
  kind: "maison" | "appentis" | "clocher";
  /** Pour un appentis ou un clocher : côté du bloc où se trouve le bâtiment qui le porte. */
  hostSide: Side | null;
  roof: RoofStyle;
  /** Toit à quatre pans (croupes) plutôt qu'à deux pignons. */
  hip: boolean;
  /** Côté du logis qui donne sur la rue. */
  front: Side;
  /** Hauteur de l'ombre portée, en cases. */
  height: number;
}

/** Plus grand rectangle de cases contenues dans `cells` (balayage simple : les blocs font quelques dizaines de cases). */
function largestRect(cells: Set<number>, W: number): CellRect | null {
  let best: CellRect | null = null;
  let bestA = 0;
  for (const i of cells) {
    const x = i % W;
    const y = Math.floor(i / W);
    let maxW = 0;
    while (x + maxW < W && cells.has(y * W + x + maxW)) maxW++;
    for (let hh = 1, wcur = maxW; wcur > 0; hh++) {
      const a = wcur * hh;
      if (a > bestA) [best, bestA] = [{ x0: x, y0: y, x1: x + wcur - 1, y1: y + hh - 1 }, a];
      let nw = 0;
      while (nw < wcur && cells.has((y + hh) * W + x + nw)) nw++;
      wcur = nw;
    }
  }
  return best;
}

/** Repère les blocs pleins parmi les murs isolés ; ce qui reste (murets d'une case de large) garde le dessin de pierres sèches. */
function planBlocks(v: V, owner: Int16Array) {
  const { W, H } = v;
  const loose = new Set(v.looseWalls);
  const done = new Set<number>();
  const left: number[] = [];
  for (const start of v.looseWalls) {
    if (done.has(start)) continue;
    const comp = new Set<number>([start]);
    const stack = [start];
    done.add(start);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j < 0 || j >= W * H || !loose.has(j) || done.has(j)) continue;
        done.add(j);
        comp.add(j);
        stack.push(j);
      }
    }
    const rects: CellRect[] = [];
    while (comp.size) {
      const rc = largestRect(comp, W);
      // une bande d'une case de large n'est un morceau de toit que si elle prolonge un corps de logis
      if (!rc || (Math.min(rc.x1 - rc.x0, rc.y1 - rc.y0) < 1 && !rects.length)) break;
      rects.push(rc);
      for (let y = rc.y0; y <= rc.y1; y++) for (let x = rc.x0; x <= rc.x1; x++) comp.delete(y * W + x);
    }
    left.push(...comp);
    if (!rects.length) continue;
    const r = rng(v.seed, 7000 + start);
    const main = rects[0];
    // bâtiment ouvert collé au bloc ?
    let host: Building | null = null;
    let hostSide: Side | null = null;
    const look = (side: Side) => {
      const cells: Pt[] = [];
      if (side === "N" || side === "S") for (let x = main.x0; x <= main.x1; x++) cells.push([x, side === "N" ? main.y0 - 1 : main.y1 + 1]);
      else for (let y = main.y0; y <= main.y1; y++) cells.push([side === "W" ? main.x0 - 1 : main.x1 + 1, y]);
      for (const [x, y] of cells) if (x >= 0 && y >= 0 && x < W && y < H && owner[y * W + x] >= 0) return v.buildings[owner[y * W + x]];
      return null;
    };
    for (const side of ["N", "S", "W", "E"] as Side[]) {
      const b = look(side);
      if (b) [host, hostSide] = [b, side];
    }
    const square = main.x1 - main.x0 === main.y1 - main.y0;
    const hostLabel = (host as Building | null)?.label;
    const kind: Block["kind"] = host && hostLabel === "Temple" && square && rects.length === 1 ? "clocher" : host ? "appentis" : "maison";
    // côté rue : celui dont la rue est la plus proche, mesurée au milieu de la façade
    let front: Side = "S";
    let bestD = 99;
    for (const side of ["N", "S", "W", "E"] as Side[]) {
      const [cx, cy] = side === "N" || side === "S" ? [Math.round((main.x0 + main.x1) / 2), side === "N" ? main.y0 : main.y1] : [side === "W" ? main.x0 : main.x1, Math.round((main.y0 + main.y1) / 2)];
      const [dx, dy] = side === "N" ? [0, -1] : side === "S" ? [0, 1] : side === "W" ? [-1, 0] : [1, 0];
      let d = 1;
      while (d < 6 && v.tile(cx + dx * d, cy + dy * d) !== T.route) d++;
      if (d < bestD) [front, bestD] = [side, d];
    }
    const m = v.c.material;
    let roof: RoofStyle;
    if (m === "metal") roof = "plaques";
    else if (m === "planches") roof = r() < 0.75 ? "bardeaux" : "tuiles";
    else if (m === "terre") roof = r() < 0.6 ? "tole" : "chaume";
    else if (kind === "clocher") roof = "ardoise";
    else if (kind === "appentis" && host) roof = (host as Building).roof;
    else roof = r() < 0.5 ? "chaume" : r() < 0.6 ? "tuiles" : "ardoise";
    // croupes surtout sur le chaume, et rarement sur un logis carré (sinon toutes les petites maisons font pyramide)
    const sq = Math.abs(main.x1 - main.x0 - (main.y1 - main.y0)) <= 1;
    const hip = kind === "clocher" || (kind === "maison" && r() < (roof === "chaume" ? 0.5 : 0.22) * (sq ? 0.45 : 1));
    v.blocks.push({ rects, kind, hostSide, roof, hip, front, height: kind === "clocher" ? 2.1 : kind === "appentis" ? 0.5 : 0.95 });
  }
  v.looseWalls = left;
}

/** Emprise du toit d'un rectangle de cases, en px : le toit déborde un peu du mur. */
function roofRect(v: V, rc: CellRect, over = 4): [number, number, number, number] {
  const { S } = v;
  return [rc.x0 * S - over, rc.y0 * S - over, (rc.x1 + 1) * S + over, (rc.y1 + 1) * S + over];
}

/** Pan de toit : polygone (monde), et son repère pour la texture (origine, côté d'égout, longueur, profondeur). */
interface Plane {
  side: Side;
  poly: Pt[];
  ox: number;
  oy: number;
  L: number;
  D: number;
}

/** Pans d'un toit à deux pentes (pignons) ou à quatre (croupes), faîtage le long du grand côté. */
function roofPlanes(x0: number, y0: number, x1: number, y1: number, hip: boolean): { planes: Plane[]; ridge: [Pt, Pt]; hips: [Pt, Pt][] } {
  const along = x1 - x0 >= y1 - y0;
  if (along) {
    const cy = (y0 + y1) / 2;
    const half = (y1 - y0) / 2;
    const ins = hip ? Math.min(half, (x1 - x0) / 2) : 0;
    const planes: Plane[] = [
      { side: "N", poly: [[x0, y0], [x1, y0], [x1 - ins, cy], [x0 + ins, cy]], ox: x0, oy: y0, L: x1 - x0, D: half },
      { side: "S", poly: [[x1, y1], [x0, y1], [x0 + ins, cy], [x1 - ins, cy]], ox: x1, oy: y1, L: x1 - x0, D: half },
    ];
    if (hip) {
      planes.push({ side: "W", poly: [[x0, y1], [x0, y0], [x0 + ins, cy]], ox: x0, oy: y1, L: y1 - y0, D: ins });
      planes.push({ side: "E", poly: [[x1, y0], [x1, y1], [x1 - ins, cy]], ox: x1, oy: y0, L: y1 - y0, D: ins });
    }
    const a: Pt = [x0 + ins, cy];
    const b: Pt = [x1 - ins, cy];
    return { planes, ridge: [a, b], hips: hip ? [[[x0, y0], a], [[x0, y1], a], [[x1, y0], b], [[x1, y1], b]] : [] };
  }
  const cx = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  const ins = hip ? Math.min(half, (y1 - y0) / 2) : 0;
  const planes: Plane[] = [
    { side: "W", poly: [[x0, y1], [x0, y0], [cx, y0 + ins], [cx, y1 - ins]], ox: x0, oy: y1, L: y1 - y0, D: half },
    { side: "E", poly: [[x1, y0], [x1, y1], [cx, y1 - ins], [cx, y0 + ins]], ox: x1, oy: y0, L: y1 - y0, D: half },
  ];
  if (hip) {
    planes.push({ side: "N", poly: [[x0, y0], [x1, y0], [cx, y0 + ins]], ox: x0, oy: y0, L: x1 - x0, D: ins });
    planes.push({ side: "S", poly: [[x1, y1], [x0, y1], [cx, y1 - ins]], ox: x1, oy: y1, L: x1 - x0, D: ins });
  }
  const a: Pt = [cx, y0 + ins];
  const b: Pt = [cx, y1 - ins];
  return { planes, ridge: [a, b], hips: hip ? [[[x0, y0], a], [[x1, y0], a], [[x0, y1], b], [[x1, y1], b]] : [] };
}

/** Lumière du haut à gauche : pans tournés au nord et à l'ouest clairs, au sud et à l'est dans l'ombre. */
const PLANE_LIGHT: Record<Side, number> = { N: 0.16, W: 0.1, E: -0.14, S: -0.2 };

/** Un pan : couleur, texture du matériau dans son repère, modelé de l'égout au faîte, hachures s'il est à l'ombre. */
function paintPlane(v: V, pl: Plane, style: RoofStyle, col: string, r: Rng) {
  const { g } = v;
  const light = PLANE_LIGHT[pl.side];
  const tone = light > 0 ? mixColor(col, "#fff2d6", light * 1.4) : mixColor(col, "#140c06", -light * (style === "chaume" ? 1 : 1.4));
  const path = pathOf(pl.poly);
  g.save();
  g.clip(path);
  g.fillStyle = tone;
  g.fill(path);
  inFrame(g, pl.ox, pl.oy, pl.side, () => {
    if (style === "chaume") thatchPlane(v, tone, pl.L, pl.D + 2, r);
    else roofTexture(v, style, tone, pl.L, pl.D + 2, r);
    // usure : taches plus sombres (mousse, suie) et plus claires (tuiles neuves, paille refaite), jamais deux pareilles
    for (let k = 0; k < (pl.L * pl.D) / 4500; k++) {
      const x = r() * pl.L;
      const y = r() * pl.D;
      const rad = 10 + r() * 22;
      const sp = g.createRadialGradient(x, y, 0, x, y, rad);
      const dark = r() < 0.6;
      sp.addColorStop(0, dark ? "rgba(40,48,24,.16)" : "rgba(255,240,205,.1)");
      sp.addColorStop(1, dark ? "rgba(40,48,24,0)" : "rgba(255,240,205,0)");
      g.fillStyle = sp;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // mousse sur le pan nord, celui qui ne sèche jamais : plaques vertes qui remontent de l'égout
    if (pl.side === "N" && (style === "chaume" || style === "tuiles" || style === "bardeaux" || style === "ardoise")) {
      for (let k = 0; k < 1 + pl.L / 70; k++) {
        if (r() < 0.35) continue;
        const mx = r() * pl.L;
        const my = r() * pl.D * 0.45;
        const blob = blobPoints(r, mx, my, 7 + r() * 14, 3 + r() * 6, 8, 0.4);
        g.fillStyle = "rgba(78,98,48,.3)";
        g.fill(pathOf(smoothPoints(blob, 2)));
        stipple(g, shapeOf(blob), r, { density: 3, radius: 0.8, color: "rgba(58,78,36,.6)" });
      }
    }
    // l'égout est un peu plus sombre que le faîte
    const gr = g.createLinearGradient(0, 0, 0, pl.D);
    gr.addColorStop(0, "rgba(20,12,6,.22)");
    gr.addColorStop(0.5, "rgba(20,12,6,0)");
    gr.addColorStop(1, "rgba(255,244,220,.1)");
    g.fillStyle = gr;
    g.fillRect(-2, -2, pl.L + 4, pl.D + 4);
  });
  // pans à l'ombre : hachures à 45°, croisées sur le pan sud (le plus sombre), plus serrées vers l'égout
  if (light < 0) {
    const sh = shapeOf(pl.poly);
    hatchLines(g, sh, r, { spacing: pl.side === "S" ? 3.2 : 4.2, width: 0.65, color: "rgba(22,16,10,.4)", angle: -Math.PI / 4 });
    if (pl.side === "S") hatchLines(g, sh, r, { spacing: 5.2, width: 0.5, color: "rgba(22,16,10,.3)", angle: Math.PI / 4 });
  }
  g.restore();
}

/**
 * Chaume d'un grand pan (repère : x le long de l'égout, y vers le faîte) : rangs de bottes qui se recouvrent,
 * bord de chaque rang ondulé et ombré, brins tirés vers l'égout, plus clairs côté lumière.
 */
function thatchPlane(v: V, col: string, L: number, D: number, r: Rng) {
  const { g } = v;
  const nz = noise2(Math.floor(r() * 1e6));
  // Mèches : courts traits en quinconce, chacun tiré vers l'égout, plus serrés près du faîtage (la paille y est
  // tassée sous le boudin). Trois valeurs choisies par un bruit large : des paquets, pas une trame.
  const dark = new Path2D();
  const mid = new Path2D();
  const light = new Path2D();
  const lip = 7;
  for (let row = 0, y = lip - 1; y < D + 4; row++) {
    const near = Math.min(1, Math.max(0, y / Math.max(1, D)));
    const step = 3.7 - near * 1.4;
    for (let x = ((row % 2) * step) / 2 - 2; x < L + 2; x += step * (0.8 + r() * 0.4)) {
      const n = nz(x / 38, y / 22) + (r() - 0.5) * 0.7;
      const len = 3 + r() * 3.2 + near * 1.5;
      const x0 = x + (r() - 0.5) * 1.1;
      const lean = (r() - 0.5) * 1.1 + nz(x / 70, 3.3) * 0.9;
      const path = n > 0.32 ? light : n < -0.28 ? dark : mid;
      path.moveTo(x0 + lean, y + len);
      path.lineTo(x0, y);
    }
    y += 3.3 - near * 1 + r() * 0.6;
  }
  g.lineCap = "round";
  g.strokeStyle = tint(col, -0.12, 0.45);
  g.lineWidth = 0.6;
  g.stroke(mid);
  g.strokeStyle = tint(col, -0.34, 0.6);
  g.lineWidth = 0.75;
  g.stroke(dark);
  g.strokeStyle = tint(col, 0.24, 0.6);
  g.lineWidth = 0.6;
  g.stroke(light);
  // Bord d'égout épais et arrondi : la paille coupée net fait un bourrelet clair, qui jette une ombre sur le pan.
  const wave = (x: number) => Math.sin(x / 7 + nz(x / 20, 9) * 2) * 0.7;
  g.fillStyle = "rgba(30,18,8,.3)";
  g.beginPath();
  g.moveTo(-2, lip);
  for (let x = 0; x <= L + 4; x += 5) g.lineTo(x, lip + wave(x));
  for (let x = L + 4; x >= -2; x -= 5) g.lineTo(x, lip + 3.2 + wave(x));
  g.closePath();
  g.fill();
  g.fillStyle = tint(col, 0.12, 0.55);
  g.fillRect(-2, 0, L + 4, lip - 1 + 0.3);
  strokes(g, tint(col, -0.3, 0.55), 0.6, (p) => {
    for (let x = 0; x < L; x += 1.6 + r()) {
      p.moveTo(x, 0.6);
      p.lineTo(x + (r() - 0.5), lip - 1.5 - r() * 2);
    }
  });
  // bord d'égout dentelé : la paille coupée au croissant laisse des pointes inégales
  inkPolyline(g, Array.from({ length: Math.ceil(L / 2.6) + 1 }, (_, k) => [k * 2.6, lip - 0.6 + wave(k * 2.6) + (k % 2 ? -0.4 - r() * 1.6 : 0.4 + r() * 0.6)] as Pt), r, { width: 0.9, color: tint(col, -0.6, 0.8), wobble: 0.2, taper: 0 });
}

/** Rapiéçages d'une tôle (repère du pan) : feuilles de récupération clouées par-dessus, d'une autre couleur. */
function patches(v: V, col: string, L: number, D: number, r: Rng) {
  const { g } = v;
  for (let k = 0; k < 1 + L / 70; k++) {
    if (r() < 0.25) continue;
    const pw = 22 + r() * 30;
    const ph = Math.min(D - 2, 16 + r() * 20);
    if (ph < 6) continue;
    const px = r() * Math.max(1, L - pw);
    const py = r() * Math.max(1, D - ph);
    const sheet = rectPts(px, py, pw, ph).map(([a, c]) => [a + (r() - 0.5) * 2, c + (r() - 0.5) * 2] as Pt);
    const tone = pick(r, ["#8a4a26", "#6f7a72", "#a08452", "#5a5048"]);
    solid(g, sheet, mixColor(col, tone, 0.55), r, { ink: 1, shadow: 1.6 });
    const across = r() < 0.4;
    strokes(g, "rgba(22,16,10,.45)", 0.6, (p) => {
      if (across)
        for (let yy = py + 2.5; yy < py + ph - 1; yy += 3.4) {
          p.moveTo(px + 1, yy);
          p.lineTo(px + pw - 1, yy);
        }
      else
        for (let xx = px + 2.5; xx < px + pw - 1; xx += 3.4) {
          p.moveTo(xx, py + 1);
          p.lineTo(xx, py + ph - 1);
        }
    });
    // clous aux quatre coins
    g.fillStyle = "#1a120a";
    for (const [a, c] of sheet) g.fillRect(a + (a < px + pw / 2 ? 2 : -3), c + (c < py + ph / 2 ? 2 : -3), 1.3, 1.3);
  }
}

/**
 * Module à toit plat (science-fiction) : acrotère clair, panneaux rivetés, une ou deux bouches d'aération à hélice,
 * une antenne parabolique dont le mât jette une longue ombre fine, des voyants. Le volume se lit par l'acrotère
 * (arête claire en haut à gauche, sombre en bas à droite) et l'ombre portée commune.
 */
function flatModule(v: V, x0: number, y0: number, x1: number, y1: number, col: string, r: Rng) {
  const { g } = v;
  const w = x1 - x0;
  const h = y1 - y0;
  solid(g, rectPts(x0, y0, w, h), tint(col, 0.24), r, { ink: 0, shadow: 0 });
  const rim = 5;
  const inner = rectPts(x0 + rim, y0 + rim, w - rim * 2, h - rim * 2);
  g.fillStyle = tint(col, 0.06);
  g.fill(pathOf(inner));
  // l'acrotère jette son ombre dans le creux du toit, le long des bords haut et gauche
  g.fillStyle = "rgba(14,16,18,.35)";
  g.fill(pathOf([[x0 + rim, y0 + rim], [x1 - rim, y0 + rim], [x1 - rim, y0 + rim + 5], [x0 + rim + 5, y0 + rim + 5], [x0 + rim + 5, y1 - rim], [x0 + rim, y1 - rim]]));
  // panneaux : coutures en travers du grand côté, rivets le long des coutures
  const along = w >= h;
  const span = along ? w - rim * 2 : h - rim * 2;
  const n = Math.max(2, Math.round(span / 30));
  strokes(g, "rgba(12,14,16,.65)", 0.8, (p) => {
    for (let k = 1; k < n; k++) {
      const t = rim + (span * k) / n;
      if (along) {
        p.moveTo(x0 + t, y0 + rim);
        p.lineTo(x0 + t, y1 - rim);
      } else {
        p.moveTo(x0 + rim, y0 + t);
        p.lineTo(x1 - rim, y0 + t);
      }
    }
  });
  g.fillStyle = tint(col, 0.35, 0.9);
  for (let k = 1; k < n; k++) {
    const t = rim + (span * k) / n;
    for (let u = rim + 4; u < (along ? h : w) - rim - 2; u += 7) {
      if (along) g.fillRect(x0 + t + 1.5, y0 + u, 1.3, 1.3);
      else g.fillRect(x0 + u, y0 + t + 1.5, 1.3, 1.3);
    }
  }
  hatchLines(g, shapeOf(inner), r, { spacing: 6, width: 0.5, color: "rgba(12,14,16,.16)", angle: -Math.PI / 4 });
  // bouches d'aération : anneau, hélice à trois pales, moyeu
  const nv = w * h > 9000 ? 2 : 1;
  for (let k = 0; k < nv; k++) {
    const rad = 7 + r() * 3;
    const cx = x0 + rim + rad + 4 + r() * Math.max(1, w - rim * 2 - rad * 2 - 8);
    const cy = y0 + rim + rad + 4 + r() * Math.max(1, h - rim * 2 - rad * 2 - 8);
    g.fillStyle = "rgba(10,12,14,.4)";
    g.beginPath();
    g.arc(cx + 3, cy + 4, rad + 1, 0, Math.PI * 2);
    g.fill();
    disc(g, cx, cy, rad + 1.5, tint(col, 0.15), r, { ink: 1.1, shadow: 0 });
    disc(g, cx, cy, rad - 1, "#1a1e22", r, { ink: 0.6, shadow: 0, light: false });
    const a0 = r() * Math.PI;
    strokes(g, tint(col, 0.1, 0.9), 2, (p) => {
      for (let b = 0; b < 3; b++) {
        const a = a0 + (b * Math.PI * 2) / 3;
        p.moveTo(cx, cy);
        p.quadraticCurveTo(cx + Math.cos(a + 0.5) * rad * 0.6, cy + Math.sin(a + 0.5) * rad * 0.6, cx + Math.cos(a) * (rad - 2), cy + Math.sin(a) * (rad - 2));
      }
    });
    disc(g, cx, cy, 1.6, tint(col, 0.3), r, { ink: 0.5, shadow: 0 });
  }
  // antenne : socle, mât vu d'en haut et son ombre très longue, parabole claire tournée vers le ciel
  if (r() < 0.75) {
    const ax = r() < 0.5 ? x1 - rim - 9 : x0 + rim + 9;
    const ay = y0 + rim + 9;
    inkLine(g, ax + 2, ay + 2, ax + 34, ay + 42, r, { width: 1.4, color: "rgba(10,12,14,.5)", taper: 4 });
    solid(g, rectPts(ax - 4, ay - 4, 8, 8), tint(col, -0.05), r, { ink: 1, shadow: 1.5 });
    g.save();
    g.translate(ax - 6, ay + 10);
    g.rotate(-0.5);
    g.fillStyle = "rgba(10,12,14,.35)";
    g.beginPath();
    g.ellipse(4, 4, 8, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e4e8e6";
    g.beginPath();
    g.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#16191c";
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = "rgba(60,70,80,.35)";
    g.beginPath();
    g.ellipse(1.5, 1, 5, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    disc(g, ax, ay, 1.5, "#d04a3a", r, { ink: 0, shadow: 0 });
  }
  // voyants sur l'acrotère
  for (let k = 0; k < 2; k++) {
    if (r() < 0.4) continue;
    const x = x0 + rim + 3 + r() * (w - rim * 2 - 6);
    const y = r() < 0.5 ? y0 + 2.5 : y1 - 2.5;
    const on = r() < 0.6 ? "rgba(120,230,150," : "rgba(240,90,70,";
    const halo = g.createRadialGradient(x, y, 0, x, y, 6);
    halo.addColorStop(0, on + ".55)");
    halo.addColorStop(1, on + "0)");
    g.fillStyle = halo;
    g.fillRect(x - 6, y - 6, 12, 12);
    g.fillStyle = on + "1)";
    g.fillRect(x - 1, y - 1, 2, 2);
  }
  // acrotère : arête claire côté lumière, contour fort côté ombre
  strokes(g, "rgba(255,255,255,.35)", 1.2, (p) => {
    p.moveTo(x0 + 1.5, y1 - 2);
    p.lineTo(x0 + 1.5, y0 + 1.5);
    p.lineTo(x1 - 2, y0 + 1.5);
  });
  inkStroke(g, densify(inner, 6, true), r, { width: 0.9, closed: true, breaks: false, color: "rgba(12,14,16,.8)", wobble: 0.2 });
  inkStroke(g, densify([[x0, y1], [x0, y0], [x1, y0]], 6), r, { width: 1.5, color: "#101316", wobble: 0.25 });
  inkStroke(g, densify([[x1, y0], [x1, y1], [x0, y1]], 6), r, { width: 3, color: "#101316", wobble: 0.25 });
}

/** Dôme (science-fiction) : coque bombée à panneaux en fuseaux, reflet en haut à gauche, dalle carrée autour. */
function domeRoof(v: V, x0: number, y0: number, x1: number, y1: number, col: string, r: Rng, mast: boolean) {
  const { g } = v;
  solid(g, rectPts(x0, y0, x1 - x0, y1 - y0), tint(col, 0.1), r, { ink: 1.2, shadow: 0 });
  hatchLines(g, rectShape(x0, y0, x1 - x0, y1 - y0), r, { spacing: 4, width: 0.5, color: "rgba(12,14,16,.25)", angle: Math.PI / 4 });
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rad = Math.min(x1 - x0, y1 - y0) / 2 - 3;
  const shade = g.createRadialGradient(cx - rad * 0.4, cy - rad * 0.45, rad * 0.1, cx, cy, rad);
  shade.addColorStop(0, tint(col, 0.42));
  shade.addColorStop(0.55, tint(col, 0.05));
  shade.addColorStop(1, tint(col, -0.38));
  g.fillStyle = shade;
  g.beginPath();
  g.arc(cx, cy, rad, 0, Math.PI * 2);
  g.fill();
  // fuseaux : méridiens vus d'en haut (rayons à peine courbés) et deux parallèles
  strokes(g, "rgba(12,14,16,.5)", 0.7, (p) => {
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.2;
      p.moveTo(cx + Math.cos(a) * rad * 0.18, cy + Math.sin(a) * rad * 0.18);
      p.quadraticCurveTo(cx + Math.cos(a + 0.18) * rad * 0.65, cy + Math.sin(a + 0.18) * rad * 0.65, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    for (const f of [0.45, 0.75]) {
      p.moveTo(cx + rad * f, cy);
      p.arc(cx, cy, rad * f, 0, Math.PI * 2);
    }
  });
  // la moitié à l'ombre, hachurée
  g.save();
  g.beginPath();
  g.arc(cx, cy, rad, -Math.PI * 0.25, Math.PI * 0.75);
  g.closePath();
  g.clip();
  hatchLines(g, rectShape(cx - rad, cy - rad, rad * 2, rad * 2), r, { spacing: 3.4, width: 0.55, color: "rgba(12,14,16,.35)", angle: -Math.PI / 4 });
  g.restore();
  disc(g, cx, cy, rad * 0.18, tint(col, 0.2), r, { ink: 0.9, shadow: 0 });
  g.strokeStyle = "#101316";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, rad, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,.5)";
  g.lineWidth = 1.6;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy, rad * 0.82, Math.PI * 1.08, Math.PI * 1.42);
  g.stroke();
  if (mast) {
    // relais : mât au sommet, son ombre filée loin, feu rouge
    inkLine(g, cx + 2, cy + 2, cx + 60, cy + 72, r, { width: 1.6, color: "rgba(10,12,14,.5)", taper: 6 });
    disc(g, cx, cy, 3, "#2a2e32", r, { ink: 0.8, shadow: 0 });
    const halo = g.createRadialGradient(cx, cy, 0, cx, cy, 9);
    halo.addColorStop(0, "rgba(240,90,70,.6)");
    halo.addColorStop(1, "rgba(240,90,70,0)");
    g.fillStyle = halo;
    g.fillRect(cx - 9, cy - 9, 18, 18);
  }
}

/** Faîtage selon le matériau : tuiles faîtières, boudin de chaume ligaturé, ligne de plomb. */
function paintRidge(v: V, a: Pt, b: Pt, style: RoofStyle, col: string, r: Rng) {
  const { g } = v;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 2) return;
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  if (style === "chaume") {
    const w = 5;
    const band: Pt[] = [[a[0] - uy * w, a[1] + ux * w], [b[0] - uy * w, b[1] + ux * w], [b[0] + uy * w, b[1] - ux * w], [a[0] + uy * w, a[1] - ux * w]];
    solid(g, band, tint(col, -0.12), r, { ink: 1.1, shadow: 2.5 });
    strokes(g, tint(col, -0.45, 0.85), 0.8, (p) => {
      for (let s = 4; s < len - 3; s += 7) {
        const [x, y] = [a[0] + ux * s, a[1] + uy * s];
        p.moveTo(x - uy * w - ux * 3, y + ux * w - uy * 3);
        p.lineTo(x + uy * w + ux * 3, y - ux * w + uy * 3);
        p.moveTo(x + uy * w - ux * 3, y - ux * w - uy * 3);
        p.lineTo(x - uy * w + ux * 3, y + ux * w + uy * 3);
      }
    });
    return;
  }
  if (style === "tuiles" || style === "ardoise" || style === "bardeaux") {
    // faîtières : une bande de demi-rondes emboîtées (terre cuite, ou zinc sur l'ardoise), chacune son arrondi
    const w = style === "tuiles" ? 3.8 : 3.2;
    const band: Pt[] = [[a[0] - uy * w, a[1] + ux * w], [b[0] - uy * w, b[1] + ux * w], [b[0] + uy * w, b[1] - ux * w], [a[0] + uy * w, a[1] - ux * w]];
    const capCol = style === "ardoise" ? mixColor(col, "#8a9096", 0.35) : tint(col, 0.06);
    solid(g, band, capCol, r, { ink: 0, shadow: 2.5 });
    // moitié haute éclairée, moitié basse à l'ombre (lumière du haut à gauche)
    const lit = ux > uy ? -1 : 1;
    g.fillStyle = "rgba(255,244,220,.22)";
    g.fill(pathOf([a, b, [b[0] + lit * uy * w, b[1] - lit * ux * w], [a[0] + lit * uy * w, a[1] - lit * ux * w]]));
    strokes(g, tint(col, -0.55, 0.9), 0.8, (p) => {
      for (let s = 4 + r() * 3; s < len - 2; s += 8.5 + r() * 1.5) {
        const [x, y] = [a[0] + ux * s, a[1] + uy * s];
        p.moveTo(x - uy * w, y + ux * w);
        p.quadraticCurveTo(x + ux * 3.2, y + uy * 3.2, x + uy * w, y - ux * w);
      }
    });
    inkStroke(g, densify(band, 6, true), r, { width: 1.3, closed: true, breaks: false, color: WALL_INK, wobble: 0.3 });
    return;
  }
  inkLine(g, a[0], a[1], b[0], b[1], r, { width: style === "plaques" ? 2.6 : 2, color: WALL_INK, taper: 2, wobble: 0.3 });
}

/** Souche de cheminée sur le faîtage : son ombre sur le pan, la pierre, le conduit noir, un filet de fumée. */
function chimneyOnRoof(v: V, x: number, y: number, r: Rng, clip: Path2D) {
  const { g, pal } = v;
  const w = 15;
  const h = 13;
  const stack: Pt[] = rectPts(x - w / 2, y - h / 2, w, h);
  g.save();
  g.clip(clip);
  g.fillStyle = "rgba(18,12,6,.5)";
  g.fill(pathOf(boxShadow(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 13, 16)));
  g.restore();
  const stone = v.c.material === "metal" ? pal.metal : v.c.material === "terre" ? mixColor(pal.metal, pal.mud, 0.4) : mixColor(pal.stone, "#3a2c20", 0.1);
  solid(g, stack, stone, r, { ink: 0, shadow: 0 });
  strokes(g, "rgba(22,16,10,.55)", 0.6, (p) => {
    p.moveTo(x - w / 2, y);
    p.lineTo(x + w / 2, y);
    p.moveTo(x - 1, y - h / 2);
    p.lineTo(x - 1, y);
    p.moveTo(x + 3, y);
    p.lineTo(x + 3, y + h / 2);
  });
  inkStroke(g, densify(stack, 6, true), r, { width: 1.5, closed: true, breaks: false, color: WALL_INK });
  g.fillStyle = "#0e0a06";
  g.fillRect(x - 3.5, y - 3, 7, 6);
  strokes(g, "rgba(236,232,222,.38)", 1.3, (p) => {
    for (let k = 0; k < 2; k++) {
      p.moveTo(x + 1 + k * 2, y - 2);
      p.bezierCurveTo(x + 10 + k * 3, y - 4 + r() * 4, x + 6 + k * 4, y + 10, x + 22 + k * 5, y + 12 + r() * 6);
    }
  });
}

/** Usure d'un toit : mousse, tuiles ou bardeaux manquants, plaque de chaume clairsemée. Chaque toit en reçoit à sa façon. */
function weatherRoof(v: V, style: RoofStyle, x0: number, y0: number, x1: number, y1: number, clip: Path2D, r: Rng) {
  if (style === "plaques") return;
  const { g } = v;
  const w = x1 - x0;
  const h = y1 - y0;
  const wear = r();
  g.save();
  g.clip(clip);
  // mousse : une à trois taches vertes
  if (wear < 0.6) {
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const cx = x0 + w * (0.1 + r() * 0.8);
      const cy = y0 + h * (0.08 + r() * 0.6);
      const rad = 7 + r() * 11;
      const gr = g.createRadialGradient(cx, cy, 1, cx, cy, rad);
      gr.addColorStop(0, "rgba(70,96,42,.5)");
      gr.addColorStop(0.65, "rgba(78,102,46,.26)");
      gr.addColorStop(1, "rgba(78,102,46,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(cx, cy, rad * (1 + r() * 0.5), rad * 0.75, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  // éléments manquants : petits trous sombres, ou plaque de paille clairsemée sur le chaume
  if (wear > 0.3) {
    const n = 2 + Math.floor(r() * 5);
    const bx = x0 + w * (0.15 + r() * 0.7);
    const by = y0 + h * (0.15 + r() * 0.7);
    for (let k = 0; k < n; k++) {
      const cx = bx + (r() - 0.5) * 24;
      const cy = by + (r() - 0.5) * 18;
      if (style === "chaume") {
        g.fillStyle = r() < 0.5 ? "rgba(36,26,14,.34)" : "rgba(210,184,120,.28)";
        g.beginPath();
        g.ellipse(cx, cy, 5 + r() * 6, 3 + r() * 3, r() * 3, 0, Math.PI * 2);
        g.fill();
      } else {
        const tw = 5 + r() * 3;
        g.fillStyle = "rgba(20,14,8,.62)";
        g.fillRect(cx, cy, tw, 4 + r() * 2);
        g.fillStyle = "rgba(210,190,150,.22)";
        g.fillRect(cx, cy + 4, tw, 0.8);
      }
    }
  }
  g.restore();
}

/**
 * Jonction des appentis avec le lieu ouvert qui les porte : une porte de planches percée dans le mur commun,
 * sa marche et une sablière sombre le long de la jointure. On comprend alors que ce sont deux volumes, pas un chevauchement.
 */
function paintAnnexJoins(v: V) {
  const { g, S } = v;
  v.blocks.forEach((bk, bi) => {
    if (bk.kind !== "appentis" || !bk.hostSide) return;
    const r = rng(v.seed, 8300 + bi);
    const m = bk.rects[0];
    const side = bk.hostSide;
    const horiz = side === "N" || side === "S";
    // ligne de contact (px) et son milieu
    const line = side === "N" ? m.y0 * S : side === "S" ? (m.y1 + 1) * S : side === "W" ? m.x0 * S : (m.x1 + 1) * S;
    const a = (horiz ? m.x0 : m.y0) * S;
    const b = ((horiz ? m.x1 : m.y1) + 1) * S;
    const mid = (a + b) / 2;
    const dir = side === "N" || side === "W" ? 1 : -1; // vers l'appentis
    const e = EAVE; // le rebord du grand toit avance de EAVE px : la jointure visible est sur sa tranche
    const P = (u: number, d: number): Pt => (horiz ? [u, line + dir * d] : [line + dir * d, u]);
    const rect = (u0: number, u1: number, d0: number, d1: number) => [P(u0, d0), P(u1, d0), P(u1, d1), P(u0, d1)];
    // sablière : poutre sombre le long de la jointure
    g.fillStyle = "rgba(24,16,9,.78)";
    g.fill(pathOf(rect(a + 2, b - 2, e - 2.5, e + 2.5)));
    // porte de planches dans le mur, sur une demi-case
    const hw = S * 0.22;
    const doorCol = mixColor(v.c.theme.door, v.pal.woodLight, 0.15);
    g.fillStyle = "#120b06";
    g.fill(pathOf(rect(mid - hw - 2, mid + hw + 2, e - 8, e + 4)));
    solid(g, rect(mid - hw, mid + hw, e - 6, e + 2), doorCol, r, { ink: 1.2, shadow: 0 });
    strokes(g, "rgba(14,10,6,.7)", 0.8, (p) => {
      for (let k = -1; k <= 1; k++) {
        const [x0, y0] = P(mid + k * hw * 0.5, e - 6);
        const [x1, y1] = P(mid + k * hw * 0.5, e + 2);
        p.moveTo(x0, y0);
        p.lineTo(x1, y1);
      }
    });
    // marche de pierre sous la porte, côté appentis
    solid(g, rect(mid - hw - 3, mid + hw + 3, e + 4, e + 10), mixColor(v.pal.stone, "#3a2c20", 0.15), r, { ink: 1, shadow: 2 });
  });
}

/**
 * Signes de vie dans les rues : tonneaux au pied d'un mur, ligne de linge entre deux piquets, poules sur la terre.
 * Les objets se posent sur des cases libres bordant la rue (marquées prises) ; les poules sont sur la rue mais
 * ne comptent pas comme obstacles.
 */
function paintStreetLife(v: V) {
  const { g, S, W, H } = v;
  const r = rng(v.seed, 8700);
  const metal = v.c.material === "metal";
  const nearRoad = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => v.tile(x + dx, y + dy) === T.route);
  const edge: Pt[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (freeCell(v, x, y) && nearRoad(x, y)) edge.push([x, y]);
  // ordre mélangé, mais déterministe
  for (let k = edge.length - 1; k > 0; k--) {
    const j = Math.floor(r() * (k + 1));
    [edge[k], edge[j]] = [edge[j], edge[k]];
  }
  const taken: Pt[] = [];
  const far = (x: number, y: number, d: number) => taken.every(([tx, ty]) => Math.hypot(tx - x, ty - y) >= d);
  const cloths = ["#c9bfa6", "#8f3a2e", "#4a5f7a", "#b8a25a", "#6b7a52"];
  let barrels = 0;
  let lines = 0;
  for (const [x, y] of edge) {
    if (!freeCell(v, x, y) || !far(x, y, 5)) continue;
    const cx = (x + 0.5) * S;
    const cy = (y + 0.5) * S;
    if (lines < 2 && !metal) {
      // linge : la case voisine le long de la rue doit être libre aussi
      const n = ([[1, 0], [0, 1]] as Pt[]).map(([dx, dy]) => [x + dx, y + dy] as Pt).find(([nx, ny]) => freeCell(v, nx, ny) && nearRoad(nx, ny));
      if (n) {
        v.used[y * W + x] = 1;
        v.used[n[1] * W + n[0]] = 1;
        taken.push([x, y]);
        lines++;
        const ex = (n[0] + 0.5) * S;
        const ey = (n[1] + 0.5) * S;
        const sx = cx - (ex - cx) * 0.3;
        const sy = cy - (ey - cy) * 0.3;
        const tx = ex + (ex - cx) * 0.3;
        const ty = ey + (ey - cy) * 0.3;
        const hor = Math.abs(ex - cx) > Math.abs(ey - cy);
        const at = (t: number): Pt => [sx + (tx - sx) * t, sy + (ty - sy) * t + Math.sin(t * Math.PI) * 4];
        for (const t of [0.18, 0.4, 0.62, 0.82]) {
          const [px, py] = at(t);
          const cw = 8 + r() * 5;
          const col = cloths[Math.floor(r() * cloths.length)];
          const poly = hor ? rectPts(px - cw / 2, py, cw, 9 + r() * 4) : rectPts(px, py - cw / 2, 9 + r() * 4, cw);
          g.save();
          g.translate(4, 5);
          g.fillStyle = "rgba(30,22,12,.3)";
          g.fill(pathOf(poly));
          g.restore();
          solid(g, poly, col, r, { ink: 1, shadow: 0 });
        }
        inkLine(g, sx, sy, tx, ty, r, { width: 0.9, color: "rgba(40,28,16,.9)", taper: 0, wobble: 0.1 });
        for (const [px, py] of [[sx, sy], [tx, ty]]) disc(g, px, py, 2.6, "#5a4128", r, { ink: 1 });
        continue;
      }
    }
    if (barrels < 3) {
      v.used[y * W + x] = 1;
      taken.push([x, y]);
      barrels++;
      if (metal) oilDrum(v, cx - 8, cy, r);
      else {
        barrel(v, cx - 8, cy + 3, 9, r);
        if (r() < 0.6) barrel(v, cx + 9, cy - 4, 8, r);
      }
    }
  }
  // poules : une petite compagnie sur la terre de la rue
  if (metal) return;
  const road: Pt[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (v.tile(x, y) === T.route) road.push([x, y]);
  if (!road.length) return;
  for (let flock = 0; flock < 2; flock++) {
    const [rx, ry] = road[Math.floor(r() * road.length)];
    const n = 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) hen(v, (rx + 0.2 + r() * 0.6) * S, (ry + 0.2 + r() * 0.6) * S, r() * Math.PI * 2, r);
  }
}

/** Une poule vue d'en haut : corps, queue, tête, crête et bec. */
function hen(v: V, x: number, y: number, a: number, r: Rng) {
  const { g } = v;
  const col = r() < 0.5 ? "#e6dcc4" : r() < 0.5 ? "#9a5a2e" : "#5a4630";
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.fillStyle = "rgba(30,22,12,.3)";
  g.beginPath();
  g.ellipse(2, 3, 6, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = mixColor(col, "#000000", 0.2);
  g.beginPath();
  g.moveTo(-4, 0);
  g.lineTo(-9, -3);
  g.lineTo(-8, 1);
  g.closePath();
  g.fill();
  g.fillStyle = col;
  g.strokeStyle = "rgba(22,16,10,.8)";
  g.lineWidth = 0.9;
  g.beginPath();
  g.ellipse(0, 0, 5.5, 3.6, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(5.5, 0, 2.2, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = "#b02a1e";
  g.fillRect(5, -0.8, 2, 1.6);
  g.fillStyle = "#d8a22a";
  g.fillRect(7.6, -0.5, 1.8, 1);
  g.restore();
}

/** Toits des logis fermés, des appentis et du clocher. */
function paintBlocks(v: V) {
  const { g, pal } = v;
  v.blocks.forEach((bk, bi) => {
    const r = rng(v.seed, 7500 + bi);
    const hueTints = ["#2a1c10", "#e8d8b0", "#4a2a1a", "#3a4a3a", "#8a6a3a"];
    let base = mixColor(pal.roof[bk.roof], hueTints[Math.floor(r() * hueTints.length)], 0.04 + r() * 0.26);
    // le clocher, plus haut, a un toit plus sombre que ses voisins ; l'appentis, plus bas, aussi
    if (bk.kind === "clocher") base = mixColor(base, "#120c08", 0.22);
    if (bk.kind === "appentis") base = mixColor(base, "#140c06", 0.14);
    // Plan en L : l'aile passe sous le même toit que le corps de logis, rattachée par deux noues.
    const wing = bk.kind === "maison" && bk.rects.length > 1 ? bk.rects[1] : null;
    const joint = wing && bk.roof !== "plaques" ? wingJoint(bk.rects[0], wing) : null;
    // les autres morceaux d'abord : le corps de logis les recouvre à la jonction
    for (const rc of [...bk.rects].reverse()) {
      if (joint && rc === wing) continue;
      const [x0, y0, x1, y1] = roofRect(v, rc, bk.kind === "appentis" ? 2 : 5);
      const box = pathOf(rectPts(x0, y0, x1 - x0, y1 - y0));
      const col = rc === bk.rects[0] ? base : mixColor(base, r() < 0.5 ? "#1a120a" : "#f0e4c8", r() * 0.08);
      if (bk.kind === "appentis" && bk.hostSide) {
        // un seul pan, qui descend du mur du bâtiment vers l'extérieur
        const out = ({ N: "S", S: "N", W: "E", E: "W" } as const)[bk.hostSide];
        const poly = rectPts(x0, y0, x1 - x0, y1 - y0);
        const pl: Plane =
          out === "S"
            ? { side: "S", poly, ox: x1, oy: y1, L: x1 - x0, D: y1 - y0 }
            : out === "N"
              ? { side: "N", poly, ox: x0, oy: y0, L: x1 - x0, D: y1 - y0 }
              : out === "W" ? { side: "W", poly, ox: x0, oy: y1, L: y1 - y0, D: x1 - x0 } : { side: "E", poly, ox: x1, oy: y0, L: y1 - y0, D: x1 - x0 };
        paintPlane(v, pl, bk.roof, col, r);
        // le haut mur du bâtiment voisin jette son ombre sur le pan, plus longue s'il est du côté de la lumière
        const deep = bk.hostSide === "N" || bk.hostSide === "W" ? 22 : 9;
        const [gx0, gy0, gx1, gy1] =
          bk.hostSide === "N" ? [x0, y0, x0, y0 + deep] : bk.hostSide === "S" ? [x0, y1, x0, y1 - deep] : bk.hostSide === "W" ? [x0, y0, x0 + deep, y0] : [x1, y0, x1 - deep, y0];
        const sg = g.createLinearGradient(gx0, gy0, gx1, gy1);
        sg.addColorStop(0, "rgba(16,10,5,.5)");
        sg.addColorStop(0.75, "rgba(16,10,5,.22)");
        sg.addColorStop(1, "rgba(16,10,5,0)");
        g.fillStyle = sg;
        g.fill(pathOf(poly));
        inkStroke(g, densify(poly, 6, true), r, { width: 1.8, closed: true, color: WALL_INK, wobble: 0.4 });
        continue;
      }
      // science-fiction : pas de charpente ; modules à toit plat ou dômes, selon la forme du bloc
      if (bk.roof === "plaques") {
        const small = rc.x1 - rc.x0 <= 3 && rc.x1 - rc.x0 === rc.y1 - rc.y0 && (rc.x1 - rc.x0 <= 2 || r() < 0.5);
        if (small || bk.kind === "clocher") domeRoof(v, x0, y0, x1, y1, col, r, bk.kind === "clocher");
        else flatModule(v, x0, y0, x1, y1, col, r);
        continue;
      }
      const { planes, ridge, hips } = roofPlanes(x0, y0, x1, y1, bk.hip);
      for (const pl of planes) paintPlane(v, pl, bk.roof, col, r);
      for (const [a, b] of hips)
        inkLine(g, a[0], a[1], b[0], b[1], r, { width: 1.3, color: WALL_INK, taper: 2, wobble: 0.3 });
      paintRidge(v, ridge[0], ridge[1], bk.roof, col, r);
      // rive des pignons : planche de rive, double trait ; sur le chaume, la paille coupée en brosse, hachurée
      if (!bk.hip) {
        const along = x1 - x0 >= y1 - y0;
        if (bk.roof === "chaume")
          strokes(g, tint(col, -0.5, 0.75), 0.7, (p) => {
            for (const [e, dir] of along ? ([[x0, 1], [x1, -1]] as const) : ([[y0, 1], [y1, -1]] as const))
              for (let u = (along ? y0 : x0) + 2; u < (along ? y1 : x1) - 2; u += 2.2 + r() * 1.2) {
                const l = 3.5 + r() * 3;
                if (along) {
                  p.moveTo(e, u);
                  p.lineTo(e + dir * l, u + (r() - 0.5) * 1.5);
                } else {
                  p.moveTo(u, e);
                  p.lineTo(u + (r() - 0.5) * 1.5, e + dir * l);
                }
              }
          });
        for (const e of along ? [x0 + 3, x1 - 3] : [y0 + 3, y1 - 3]) {
          if (along)
            inkLine(g, e, y0 + 1, e, y1 - 1, r, { width: 0.8, color: "rgba(22,16,10,.6)", taper: 1, wobble: 0.2 });
          else
            inkLine(g, x0 + 1, e, x1 - 1, e, r, { width: 0.8, color: "rgba(22,16,10,.6)", taper: 1, wobble: 0.2 });
        }
      }
      // contour : trait d'égout fort côté ombre, plus léger côté lumière
      inkStroke(g, densify([[x0, y1], [x0, y0], [x1, y0]], 6), r, { width: 1.6, color: WALL_INK, wobble: bk.roof === "chaume" ? 0.9 : 0.4 });
      inkStroke(g, densify([[x1, y0], [x1, y1], [x0, y1]], 6), r, { width: 3.2, color: WALL_INK, wobble: bk.roof === "chaume" ? 0.9 : 0.4 });
      overshoot(g, rectPts(x0, y0, x1 - x0, y1 - y0), r, 1.2);
      // cheminée sur le corps de logis, plus souvent qu'à son tour
      if (bk.kind === "maison" && rc === bk.rects[0] && r() < 0.34) {
        const t = r() < 0.5 ? between(r, 0.18, 0.3) : between(r, 0.7, 0.82);
        const [a, b] = ridge;
        chimneyOnRoof(v, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, box);
      }
      if (bk.kind !== "clocher") weatherRoof(v, bk.roof, x0, y0, x1, y1, box, r);
      // clocher : chambre des cloches ouverte au sommet (la cloche de bronze dans son cadre), croix de fer au-dessus
      if (bk.kind === "clocher") belfry(v, ridge[0][0], ridge[0][1], Math.min(x1 - x0, y1 - y0), r);
    }
    if (joint && wing) paintWing(v, bk, bk.rects[0], wing, joint, base, r);
  });
}

/**
 * Côté de l'aile par lequel elle touche le corps de logis (le corps est au nord de l'aile : « N »), si l'aile
 * s'appuie entièrement sur un de ses murs ; sinon null (les deux toits restent séparés).
 */
function wingJoint(main: CellRect, w: CellRect): Side | null {
  if (w.x0 >= main.x0 && w.x1 <= main.x1) {
    if (w.y0 === main.y1 + 1) return "N";
    if (w.y1 === main.y0 - 1) return "S";
  }
  if (w.y0 >= main.y0 && w.y1 <= main.y1) {
    if (w.x0 === main.x1 + 1) return "W";
    if (w.x1 === main.x0 - 1) return "E";
  }
  return null;
}

/**
 * Toit de l'aile d'un plan en L : deux pans dont le faîtage part du pignon et s'enfonce dans le grand toit ;
 * à la rencontre, deux noues en diagonale (trait d'encre et triangle d'ombre), pas un trait droit.
 */
function paintWing(v: V, bk: Block, main: CellRect, wing: CellRect, c: Side, col: string, r: Rng) {
  const { g } = v;
  const [mx0, my0, mx1, my1] = roofRect(v, main, 5);
  const [wx0, wy0, wx1, wy1] = roofRect(v, wing, 5);
  const vert = c === "N" || c === "S";
  let planes: Plane[];
  let ridge: [Pt, Pt];
  let valleys: [Pt, Pt][];
  let gable: [Pt, Pt];
  if (vert) {
    const hw = (wx1 - wx0) / 2;
    const cx = (wx0 + wx1) / 2;
    const yC = c === "N" ? my1 : my0;
    const yF = c === "N" ? wy1 : wy0;
    const mid = (my0 + my1) / 2;
    const yA = c === "N" ? Math.max(yC - hw, mid) : Math.min(yC + hw, mid);
    const L = Math.abs(yF - yA);
    planes = [
      { side: "W", poly: [[wx0, yF], [wx0, yC], [cx, yA], [cx, yF]], ox: wx0, oy: Math.max(yF, yA), L, D: hw },
      { side: "E", poly: [[wx1, yC], [wx1, yF], [cx, yF], [cx, yA]], ox: wx1, oy: Math.min(yF, yA), L, D: hw },
    ];
    ridge = [[cx, yF], [cx, yA]];
    valleys = [[[wx0, yC], [cx, yA]], [[wx1, yC], [cx, yA]]];
    gable = [[wx0, yF], [wx1, yF]];
  } else {
    const hw = (wy1 - wy0) / 2;
    const cy = (wy0 + wy1) / 2;
    const xC = c === "W" ? mx1 : mx0;
    const xF = c === "W" ? wx1 : wx0;
    const mid = (mx0 + mx1) / 2;
    const xA = c === "W" ? Math.max(xC - hw, mid) : Math.min(xC + hw, mid);
    const L = Math.abs(xF - xA);
    planes = [
      { side: "N", poly: [[xF, wy0], [xC, wy0], [xA, cy], [xF, cy]], ox: Math.min(xF, xA), oy: wy0, L, D: hw },
      { side: "S", poly: [[xC, wy1], [xF, wy1], [xF, cy], [xA, cy]], ox: Math.max(xF, xA), oy: wy1, L, D: hw },
    ];
    ridge = [[xF, cy], [xA, cy]];
    valleys = [[[xC, wy0], [xA, cy]], [[xC, wy1], [xA, cy]]];
    gable = [[xF, wy0], [xF, wy1]];
  }
  for (const pl of planes) paintPlane(v, pl, bk.roof, col, r);
  // noues : l'eau des deux toits s'y rejoint ; un mince triangle d'ombre du côté opposé à la lumière
  for (const [a, b] of valleys) {
    const off = vert ? [a[0] < b[0] ? -5 : 5, 0] : [0, a[1] < b[1] ? -5 : 5];
    g.fillStyle = "rgba(18,12,6,.3)";
    g.fill(pathOf([a, b, [a[0] + off[0], a[1] + off[1]]]));
    inkLine(g, a[0], a[1], b[0], b[1], r, { width: 1.6, color: WALL_INK, taper: 2, wobble: 0.3 });
  }
  paintRidge(v, ridge[0], ridge[1], bk.roof, col, r);
  // rive du pignon (double trait), puis l'égout de l'aile : appuyé côté ombre
  const [g0, g1] = gable;
  const ins = vert ? [0, c === "N" ? -3 : 3] : [c === "W" ? -3 : 3, 0];
  inkLine(g, g0[0] + ins[0], g0[1] + ins[1], g1[0] + ins[0], g1[1] + ins[1], r, { width: 0.8, color: "rgba(22,16,10,.6)", taper: 1, wobble: 0.2 });
  const [pa, pb] = planes;
  const heavy = (s: Side) => (s === "S" || s === "E" ? 3.2 : 1.6);
  inkStroke(g, densify([pa.poly[0], pa.poly[1]], 6), r, { width: heavy(pa.side), color: WALL_INK, wobble: bk.roof === "chaume" ? 0.9 : 0.4 });
  inkStroke(g, densify([pb.poly[0], pb.poly[1]], 6), r, { width: heavy(pb.side), color: WALL_INK, wobble: bk.roof === "chaume" ? 0.9 : 0.4 });
  inkStroke(g, densify([g0, g1], 6), r, { width: vert ? (c === "N" ? 3.2 : 1.6) : c === "W" ? 3.2 : 1.6, color: WALL_INK, wobble: bk.roof === "chaume" ? 0.9 : 0.4 });
}

/**
 * Sommet du clocher vu d'en haut : la chambre des cloches, ouverte sur ses quatre côtés (abat-sons sombres),
 * la cloche de bronze au centre, et la croix de fer posée sur la pointe avec sa petite ombre.
 */
function belfry(v: V, cx: number, cy: number, size: number, r: Rng) {
  const { g, pal } = v;
  const h = Math.max(9, Math.min(15, size * 0.18));
  const sq: Pt[] = rectPts(cx - h, cy - h, h * 2, h * 2);
  g.save();
  g.translate(6, 8);
  g.fillStyle = "rgba(16,10,5,.45)";
  g.fill(pathOf(sq));
  g.restore();
  solid(g, sq, mixColor(pal.stone, "#2a2018", 0.1), r, { ink: 0, shadow: 0 });
  // abat-sons : quatre ouvertures sombres
  g.fillStyle = "#18110b";
  const o = h * 0.55;
  g.fillRect(cx - o, cy - h + 1.5, o * 2, h - 2.5);
  g.fillRect(cx - o, cy + 1, o * 2, h - 2.5);
  g.fillRect(cx - h + 1.5, cy - o, h - 2.5, o * 2);
  g.fillRect(cx + 1, cy - o, h - 2.5, o * 2);
  inkStroke(g, densify(sq, 5, true), r, { width: 1.6, closed: true, breaks: false, color: WALL_INK });
  // la cloche : bronze verdi, reflet en haut à gauche, battant sombre au centre
  const bell = v.flavor === "sf" ? "#9aa4a8" : "#a8823e";
  disc(g, cx, cy, h * 0.55, bell, r, { ink: 1.2, shadow: 2 });
  g.fillStyle = "rgba(255,240,200,.45)";
  g.beginPath();
  g.arc(cx - h * 0.18, cy - h * 0.18, h * 0.22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(70,110,90,.35)";
  g.beginPath();
  g.arc(cx + h * 0.15, cy + h * 0.2, h * 0.28, 0, Math.PI * 2);
  g.fill();
  disc(g, cx, cy, 1.8, "#1a120a", r, { ink: 0, shadow: 0 });
  // croix de fer, dressée au-dessus : son ombre tombe en bas à droite
  if (v.flavor !== "sf") {
    const k = h + 6;
    strokes(g, "rgba(16,10,5,.45)", 2, (p) => {
      p.moveTo(cx - k * 0.5 + 9, cy + 12);
      p.lineTo(cx + k * 0.5 + 9, cy + 12);
      p.moveTo(cx + 9, cy - k * 0.7 + 12);
      p.lineTo(cx + 9, cy + k * 0.5 + 12);
    });
  }
}

// ——— Trait de plume commun ———

/** Points intermédiaires sur une polyligne, tous les `step` px (pour que le tremblé ait de quoi travailler). */
function densify(pts: Pt[], step: number, closed = false): Pt[] {
  const out: Pt[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let k = 0; k < n; k++) {
    const [ax, ay] = pts[k];
    const [bx, by] = pts[(k + 1) % pts.length];
    const m = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let j = 0; j < m; j++) out.push([ax + ((bx - ax) * j) / m, ay + ((by - ay) * j) / m]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Trait de plume du village : deux passes un peu décalées, épaisseur qui suit la lumière (fine côté jour,
 * en haut à gauche ; appuyée côté ombre), petites reprises de plume dans les longues lignes.
 * Murs, toits, routes, arbres et meubles passent tous par ici.
 */
function inkStroke(g: CanvasRenderingContext2D, pts: Pt[], r: Rng, o: { width?: number; closed?: boolean; color?: string; wobble?: number; breaks?: boolean } = {}) {
  const { width = 1.8, closed = false, color = INK, wobble = 0.6, breaks = true } = o;
  if (pts.length < 2) return;
  const src = closed ? [...pts, pts[0]] : pts;
  // orientation de la boucle (repère écran) : la normale extérieure en dépend
  let area = 0;
  if (closed)
    for (let k = 0; k < pts.length; k++) {
      const [ax, ay] = pts[k];
      const [bx, by] = pts[(k + 1) % pts.length];
      area += ax * by - bx * ay;
    }
  const sgn = area >= 0 ? 1 : -1;
  const runs: { pts: Pt[]; k: number }[] = [];
  let cur: { pts: Pt[]; k: number } | null = null;
  for (let k = 0; k < src.length - 1; k++) {
    const [ax, ay] = src[k];
    const [bx, by] = src[k + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.01) continue;
    let cls = 1;
    if (closed) {
      const nx = (sgn * (by - ay)) / len;
      const ny = (sgn * -(bx - ax)) / len;
      const lit = nx * 0.6 + ny * 0.8;
      cls = lit > 0.25 ? 1.45 : lit < -0.25 ? 0.62 : 1;
    }
    if (!cur || cur.k !== cls) {
      cur = { pts: [cur ? cur.pts[cur.pts.length - 1] : [ax, ay]], k: cls };
      runs.push(cur);
    }
    if (breaks && len > 26 && r() < 0.16) {
      // la plume se relève un instant
      const f = 0.3 + r() * 0.4;
      const gap = 2 + r() * 2.5;
      const mx = ax + (bx - ax) * f;
      const my = ay + (by - ay) * f;
      const ux = (bx - ax) / len;
      const uy = (by - ay) / len;
      cur.pts.push([mx - (ux * gap) / 2, my - (uy * gap) / 2]);
      cur = { pts: [[mx + (ux * gap) / 2, my + (uy * gap) / 2]], k: cls };
      runs.push(cur);
    }
    cur.pts.push([bx, by]);
  }
  for (const run of runs) {
    if (run.pts.length < 2) continue;
    inkPolyline(g, run.pts, r, { width: width * run.k, color, wobble, pressure: 0.4, taper: 3 });
  }
  // seconde passe, plus fine et décalée : la main repasse
  g.save();
  g.globalAlpha *= 0.5;
  for (const run of runs) {
    if (run.pts.length < 2) continue;
    inkPolyline(g, run.pts.map(([px, py]) => [px + 0.7, py + 0.55] as Pt), r, { width: width * run.k * 0.38, color, wobble: wobble * 1.8, pressure: 0.6, taper: 5 });
  }
  g.restore();
}

/**
 * Murets (murs d'une case hors bâtiments, ceux des cours) : un mur bas qui court au milieu de ses cases,
 * en pierres sèches empilées en fantasy et au port, en pisé au Far West, en glissières de béton en
 * science-fiction, en tôles rivetées après l'apocalypse. Ombre portée nette, piliers de part et d'autre du portail.
 */
function paintLooseWalls(v: V) {
  if (!v.looseWalls.length) return;
  const { g, W, S, pal } = v;
  const set = new Set(v.looseWalls);
  const has = (x: number, y: number) => x >= 0 && x < W && set.has(y * W + x);
  const r = rng(v.seed, 4000);
  // tronçons d'un centre de case à l'autre
  const segs: [Pt, Pt][] = [];
  const ends: { p: Pt; dir: Pt }[] = [];
  for (const i of v.looseWalls) {
    const x = i % W;
    const y = Math.floor(i / W);
    const c: Pt = [(x + 0.5) * S, (y + 0.5) * S];
    if (has(x + 1, y)) segs.push([c, [c[0] + S, c[1]]]);
    if (has(x, y + 1)) segs.push([c, [c[0], c[1] + S]]);
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => has(x + dx, y + dy));
    if (n.length === 1) ends.push({ p: c, dir: [n[0][0], n[0][1]] });
    if (!n.length) segs.push([c, [c[0] + 0.1, c[1]]]);
  }
  const path = new Path2D();
  for (const [a, b] of segs) {
    path.moveTo(a[0], a[1]);
    path.lineTo(b[0], b[1]);
  }
  const fl = v.flavor;
  const wide = fl === "sf" ? S * 0.5 : fl === "ruines" ? S * 0.34 : S * 0.6;
  g.save();
  g.lineCap = fl === "sf" || fl === "ruines" ? "square" : "round";
  g.lineJoin = fl === "sf" || fl === "ruines" ? "miter" : "round";
  // ombre portée : le muret fait un peu plus d'une demi-hauteur d'homme
  g.translate(SHX * 0.55, SHY * 0.55);
  g.strokeStyle = SHADOW;
  g.lineWidth = wide;
  g.stroke(path);
  g.translate(-SHX * 0.55, -SHY * 0.55);
  // contour d'encre (le trait plus large dessous), puis le corps du mur
  g.strokeStyle = WALL_INK;
  g.lineWidth = wide + 3.2;
  g.stroke(path);
  const body =
    fl === "sf"
      ? mixColor(pal.metal, "#c4c6c0", 0.5)
      : fl === "ruines" ? mixColor(pal.metal, "#7a5a3c", 0.35) : fl === "western" ? mixColor(pal.daub, pal.dirt, 0.45) : mixColor(pal.stone, "#3a3026", 0.35);
  g.strokeStyle = body;
  g.lineWidth = wide;
  g.stroke(path);
  g.restore();
  const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (fl === "fantasy" || fl === "port") {
    // pierres sèches : deux rangs de moellons de tailles inégales, posés en long, et une pierre de chaperon de temps en temps
    const fills: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
    const ink = new Path2D();
    const lights = new Path2D();
    for (const [a, b] of segs) {
      const l = len(a, b);
      if (l < 1) continue;
      const ux = (b[0] - a[0]) / l;
      const uy = (b[1] - a[1]) / l;
      for (const lane of [-0.24, 0.24]) {
        for (let s = -wide * 0.35 + r() * 4; s < l + wide * 0.3;) {
          const sl = 7 + r() * 8;
          const half = wide * (0.17 + r() * 0.07);
          const cx = a[0] + ux * (s + sl / 2) - uy * lane * wide + (r() - 0.5) * 1.5;
          const cy = a[1] + uy * (s + sl / 2) + ux * lane * wide + (r() - 0.5) * 1.5;
          const pts = smoothPoints(blobPoints(r, cx, cy, sl / 2, half, 7, 0.22, Math.atan2(uy, ux)), 1);
          const p = pathOf(pts);
          fills[Math.floor(r() * 3)].addPath(p);
          ink.addPath(p);
          lights.addPath(pathOf(pts.map(([px, py]) => [px - 1.2 - (px - cx) * 0.3, py - 1.2 - (py - cy) * 0.3] as Pt)));
          s += sl + 1.2 + r() * 1.5;
        }
      }
    }
    fills.forEach((p, k) => {
      g.fillStyle = tint(pal.stone, [-0.08, 0.02, 0.1][k]);
      g.fill(p);
    });
    g.fillStyle = "rgba(255,248,230,.2)";
    g.fill(lights);
    g.strokeStyle = "rgba(22,16,10,.7)";
    g.lineWidth = 0.8;
    g.stroke(ink);
    // touffes au pied du mur, là où la faux ne passe pas
    strokes(g, tint(pal.grassLush, -0.3, 0.75), 0.75, (p) => {
      for (const [a, b] of segs)
        for (let k = 0; k < 3; k++) {
          const t = r();
          const side = r() < 0.5 ? -1 : 1;
          const l = len(a, b) || 1;
          const ux = (b[0] - a[0]) / l;
          const uy = (b[1] - a[1]) / l;
          blade(p, r() < 0.5 ? 1 : 0, a[0] + (b[0] - a[0]) * t - uy * side * (wide / 2 + 2), a[1] + (b[1] - a[1]) * t + ux * side * (wide / 2 + 2), 4 + r() * 4, (r() - 0.5) * 0.6, r);
        }
    });
  } else if (fl === "western") {
    // pisé : crevasses, chaperon de tuiles plates, traces de lissage
    strokes(g, "rgba(40,26,14,.55)", 0.8, (p) => {
      for (const [a, b] of segs) {
        if (r() < 0.5) continue;
        const t = 0.2 + r() * 0.6;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        p.moveTo(x - 3, y - wide * 0.4);
        p.lineTo(x + 1, y - 2);
        p.lineTo(x - 1, y + 4);
      }
    });
    g.save();
    g.lineCap = "round";
    g.strokeStyle = tint(pal.daub, 0.18, 0.55);
    g.lineWidth = wide * 0.28;
    g.translate(-1.5, -1.5);
    g.stroke(path);
    g.restore();
  } else if (fl === "sf") {
    // glissières de béton : éléments de 0,5 case, joint noir, bande de marquage jaune et noire aux extrémités
    strokes(g, "rgba(14,16,18,.8)", 1.2, (p) => {
      for (const [a, b] of segs) {
        const l = len(a, b);
        for (let s = S / 2; s < l; s += S / 2) {
          const x = a[0] + ((b[0] - a[0]) * s) / l;
          const y = a[1] + ((b[1] - a[1]) * s) / l;
          const vert = Math.abs(b[0] - a[0]) < 1;
          if (vert) {
            p.moveTo(x - wide / 2, y);
            p.lineTo(x + wide / 2, y);
          } else {
            p.moveTo(x, y - wide / 2);
            p.lineTo(x, y + wide / 2);
          }
        }
      }
    });
    g.save();
    g.lineCap = "butt";
    g.strokeStyle = "rgba(255,255,255,.22)";
    g.lineWidth = wide * 0.3;
    g.translate(-wide * 0.18, -wide * 0.18);
    g.stroke(path);
    g.restore();
  } else {
    // tôles rivetées : ondulations, et la rouille qui coule verticalement sous chaque rivet
    for (const [a, b] of segs) {
      const l = len(a, b);
      const vert = Math.abs(b[0] - a[0]) < 1;
      strokes(g, "rgba(30,20,14,.5)", 0.7, (p) => {
        for (let s = 0; s < l; s += 3.4) {
          const x = a[0] + ((b[0] - a[0]) * s) / l;
          const y = a[1] + ((b[1] - a[1]) * s) / l;
          if (vert) {
            p.moveTo(x - wide / 2, y);
            p.lineTo(x + wide / 2, y);
          } else {
            p.moveTo(x, y - wide / 2);
            p.lineTo(x, y + wide / 2);
          }
        }
      });
      for (let s = 4 + r() * 6; s < l; s += 9 + r() * 10) {
        const x = a[0] + ((b[0] - a[0]) * s) / l;
        const y = a[1] + ((b[1] - a[1]) * s) / l - (vert ? 0 : wide * 0.3);
        const run = 6 + r() * 12;
        const gr = g.createLinearGradient(x, y, x, y + run);
        gr.addColorStop(0, "rgba(150,70,26,.75)");
        gr.addColorStop(1, "rgba(150,70,26,0)");
        g.fillStyle = gr;
        g.fillRect(x - 1, y, 2 + r() * 1.5, run);
        g.fillStyle = "#2a1c12";
        g.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      }
    }
  }
  // portail : deux piliers carrés de part et d'autre de l'ouverture (bois au Far West et au port)
  for (const { p, dir } of ends) {
    const [x, y] = [p[0] - dir[0] * S * 0.32, p[1] - dir[1] * S * 0.32];
    const s = wide * 0.44 + 2;
    const post = smoothPoints(jitterPoints(rectPts(x - s, y - s, s * 2, s * 2), 1.2, v.seed + Math.round(x)), 1);
    const col = fl === "port" || fl === "western" ? pal.woodDark : fl === "sf" ? "#c8a038" : tint(pal.stone, -0.06);
    solid(g, post, col, r, { ink: 1.5, shadow: 7 });
    if (fl === "fantasy") solid(g, rectPts(x - s * 0.55, y - s * 0.55, s * 1.1, s * 1.1), tint(pal.stone, 0.08), r, { ink: 0.8, shadow: 1.5 });
  }
  yardLife(v);
}

/**
 * Ce qui vit dans les cours murées, selon le genre : meule de foin, poules et charrette ; tonneaux et casiers au port ;
 * caisses et fûts en science-fiction ; pneus, bidons et carcasse après l'apocalypse. Jamais devant le portail
 * ni devant l'appentis.
 */
function yardLife(v: V) {
  const { W, H, S } = v;
  const set = new Set(v.looseWalls);
  const done = new Set<number>();
  let n = 0;
  for (const start of v.looseWalls) {
    if (done.has(start)) continue;
    // une cour : composante de murets, et sa boîte
    let [x0, y0, x1, y1] = [W, H, 0, 0];
    const stack = [start];
    done.add(start);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % W;
      const y = Math.floor(i / W);
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      for (const j of [i - 1, i + 1, i - W, i + W]) if (set.has(j) && !done.has(j)) (done.add(j), stack.push(j));
    }
    if (x1 - x0 < 4 || y1 - y0 < 4) continue;
    const r = rng(v.seed, 8800 + n++);
    // cases libres : sol, loin des murs de l'appentis et de l'axe du portail
    const free: Pt[] = [];
    for (let y = y0 + 1; y < y1; y++)
      for (let x = x0 + 1; x < x1; x++) {
        if (v.tile(x, y) !== T.sol || v.used[y * W + x]) continue;
        let ok = true;
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (v.tile(x + dx, y + dy) === T.mur && !set.has((y + dy) * W + x + dx)) ok = false;
        if (ok) free.push([x, y]);
      }
    const gate = v.looseWalls.filter((i) => i % W >= x0 && i % W <= x1 && Math.floor(i / W) >= y0 && Math.floor(i / W) <= y1);
    const gateGap = (x: number, y: number) => (x === x0 || x === x1 || y === y0 || y === y1) && !gate.includes(y * W + x);
    const spots = free.filter(([x, y]) => ![[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => gateGap(x + dx, y + dy)));
    const take = (): Pt | null => {
      if (!spots.length) return null;
      const k = Math.floor(r() * spots.length);
      const [p] = spots.splice(k, 1);
      v.used[p[1] * W + p[0]] = 1;
      return [(p[0] + 0.5) * S + (r() - 0.5) * 10, (p[1] + 0.5) * S + (r() - 0.5) * 10];
    };
    const fl = v.flavor;
    const a = take();
    const b = take();
    const c = take();
    if (fl === "sf") {
      if (a) container(v, a[0] - S * 0.45, a[1] - S * 0.22, S * 0.9, S * 0.44, r);
      if (b) for (let k = 0; k < 3; k++) oilDrum(v, b[0] + (k % 2) * 13 - 6, b[1] + Math.floor(k / 2) * 13 - 6, r, "#5a6a74");
      if (c) crate(v, c[0] - 9, c[1] - 9, 18, r, r() * 0.4);
    } else if (fl === "ruines") {
      if (a) carWreck(v, a[0], a[1], r() * Math.PI, r);
      if (b) for (let k = 0; k < 3; k++) tire(v, b[0] + (r() - 0.5) * 14, b[1] + (r() - 0.5) * 14, 7, r);
      if (c) oilDrum(v, c[0], c[1], r);
    } else if (fl === "port") {
      if (a) for (let k = 0; k < 4; k++) barrel(v, a[0] + (k % 2) * 19 - 9, a[1] + Math.floor(k / 2) * 19 - 9, 9, r);
      if (b) (lobsterPot(v, b[0], b[1], r, r() - 0.5), lobsterPot(v, b[0] + 4, b[1] - 15, r, r() - 0.5));
      if (c) fishingNet(v, smoothPoints(blobPoints(r, c[0], c[1], 18, 11, 9, 0.3, r()), 2), r);
    } else {
      if (a) haystack(v, a[0], a[1], r);
      if (b) cart(v, b[0], b[1], r() * Math.PI, r);
      if (c) hens(v, c[0], c[1], r);
    }
  }
}

/** Meule de foin : dôme de paille, brins rayonnants depuis le sommet, ombre ronde. */
function haystack(v: V, cx: number, cy: number, r: Rng) {
  const { g, pal } = v;
  const R = 15 + r() * 4;
  disc(g, cx, cy, R, pal.straw, r, { ink: 1.3, shadow: 7 });
  strokes(g, tint(pal.straw, -0.3, 0.7), 0.7, (p) => {
    for (let k = 0; k < 40; k++) {
      const a = r() * Math.PI * 2;
      const d0 = R * (0.15 + r() * 0.4);
      p.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0);
      p.lineTo(cx + Math.cos(a) * (d0 + 4 + r() * 5), cy + Math.sin(a) * (d0 + 4 + r() * 5));
    }
  });
  g.fillStyle = "rgba(255,246,210,.3)";
  g.beginPath();
  g.arc(cx - R * 0.3, cy - R * 0.3, R * 0.4, 0, Math.PI * 2);
  g.fill();
}

/** Quelques poules qui picorent : corps blanc ou roux, crête rouge, chacune tournée ailleurs. */
function hens(v: V, cx: number, cy: number, r: Rng) {
  const { g } = v;
  for (let k = 0; k < 4; k++) {
    const x = cx + (r() - 0.5) * 30;
    const y = cy + (r() - 0.5) * 24;
    const a = r() * Math.PI * 2;
    const body = smoothPoints(blobPoints(r, x, y, 4, 2.8, 7, 0.15, a), 1);
    solid(g, body, r() < 0.6 ? "#e8e0cc" : "#a8643a", r, { ink: 0.7, shadow: 2 });
    g.fillStyle = "#b8322a";
    g.fillRect(x + Math.cos(a) * 4 - 0.8, y + Math.sin(a) * 4 - 0.8, 1.6, 1.6);
  }
}

/** Fontaine sur la case d'eau de la place ; les grandes eaux (mare, rivière) passent par le rendu d'extérieur. */
function paintWater(v: V) {
  const { g, W, H, S, pal } = v;
  const cells: Pt[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (v.tile(x, y) === T.eau) cells.push([x, y]);
  if (!cells.length) return;
  if (cells.length > 4) {
    paintOutdoorWater(g, v.map, v.c.theme);
    return;
  }
  const r = rng(v.seed, 5000);
  for (const [x, y] of cells) placeWell(v, (x + 0.5) * S, (y + 0.5) * S, r, true);
  paintStalls(v, cells[0]);
  plazaSeats(v, cells[0], r);
}

/**
 * Pour que la place vive : un abreuvoir de pierre (fantasy, port) et un banc de bois contre le bord du pavage,
 * à deux cases du puits, en travers d'aucune rue.
 */
function plazaSeats(v: V, well: Pt, r: Rng) {
  const { g, S, pal, W } = v;
  const pv = (x: number, y: number) => !!v.paved && x >= 0 && y >= 0 && x < W && y < v.H && v.paved[y * W + x] === 1;
  const [wx, wy] = well;
  const spots: Pt[] = [];
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 2) continue;
      const [x, y] = [wx + dx, wy + dy];
      if (!pv(x, y) || v.used[y * W + x]) continue;
      // au bord : une voisine non pavée qui n'est pas une rue (le banc a le dos à l'herbe ou à un mur)
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => !pv(x + ex, y + ey) && v.tile(x + ex, y + ey) !== T.route)) continue;
      spots.push([x, y]);
    }
  const pickSpot = (): Pt | null => {
    if (!spots.length) return null;
    const [p] = spots.splice(Math.floor(r() * spots.length), 1);
    v.used[p[1] * W + p[0]] = 1;
    for (let k = spots.length - 1; k >= 0; k--) if (Math.abs(spots[k][0] - p[0]) + Math.abs(spots[k][1] - p[1]) < 3) spots.splice(k, 1);
    return p;
  };
  const a = pickSpot();
  if (a && (v.flavor === "fantasy" || v.flavor === "port")) {
    // abreuvoir : auge de pierre taillée, eau sombre, un reflet ; le long du bord le plus proche
    const horiz = !pv(a[0], a[1] - 1) || !pv(a[0], a[1] + 1);
    const [w, h] = horiz ? [S * 0.92, S * 0.4] : [S * 0.4, S * 0.92];
    const x = a[0] * S + (S - w) / 2;
    const y = a[1] * S + (S - h) / 2;
    solid(g, rectPts(x, y, w, h), tint(pal.stone, 0.06), r, { ink: 1.4, shadow: 5 });
    g.fillStyle = mixColor(pal.water, "#1a1612", 0.4);
    g.fillRect(x + 4, y + 4, w - 8, h - 8);
    g.fillStyle = "rgba(230,236,230,.45)";
    g.fillRect(x + 7, y + 6, horiz ? w * 0.35 : 1.4, horiz ? 1.4 : h * 0.35);
  }
  const b = pickSpot();
  if (b) {
    // banc : planche épaisse sur deux pieds de pierre
    const horiz = !pv(b[0], b[1] - 1) || !pv(b[0], b[1] + 1);
    const [w, h] = horiz ? [S * 0.8, S * 0.26] : [S * 0.26, S * 0.8];
    const x = b[0] * S + (S - w) / 2;
    const y = b[1] * S + (S - h) / 2;
    solid(g, rectPts(x, y, w, h), v.flavor === "sf" ? pal.metal : pal.woodLight, r, { ink: 1.2, shadow: 5 });
    strokes(g, tint(pal.woodDark, 0, 0.6), 0.6, (p) => {
      if (horiz) {
        p.moveTo(x + 2, y + h / 2);
        p.lineTo(x + w - 2, y + h / 2);
      } else {
        p.moveTo(x + w / 2, y + 2);
        p.lineTo(x + w / 2, y + h - 2);
      }
    });
  }
}

/** Brins d'herbe en quatre tracés : touffe en éventail, hautes tiges couchées, V, et brins isolés. */
function blade(p: CanvasRenderingContext2D, kind: number, x: number, y: number, size: number, lean: number, r: Rng) {
  if (kind === 0) tuft(p, x, y, size, r, lean * 0.6);
  else if (kind === 1) {
    // hautes herbes : trois à cinq tiges longues couchées par le vent, pointe recourbée
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + lean + (r() - 0.5) * 0.7;
      const l = size * (1.3 + r() * 0.8);
      const bx = x + (r() - 0.5) * 4;
      const ex = bx + Math.cos(a) * l;
      const ey = y + Math.sin(a) * l;
      p.moveTo(bx, y);
      p.quadraticCurveTo(bx + Math.cos(a - lean * 0.6) * l * 0.6, y + Math.sin(a - lean * 0.6) * l * 0.6, ex, ey);
    }
  } else if (kind === 2) {
    const a = -Math.PI / 2 + lean;
    const l = size * 0.8;
    p.moveTo(x + Math.cos(a - 0.45) * l, y + Math.sin(a - 0.45) * l);
    p.lineTo(x, y);
    p.lineTo(x + Math.cos(a + 0.4) * l * 0.8, y + Math.sin(a + 0.4) * l * 0.8);
  } else {
    for (let k = 0; k < 2; k++) {
      const bx = x + (r() - 0.5) * 6;
      const by = y + (r() - 0.5) * 4;
      const a = -Math.PI / 2 + lean + (r() - 0.5) * 0.8;
      p.moveTo(bx, by);
      p.lineTo(bx + Math.cos(a) * size * 0.6, by + Math.sin(a) * size * 0.6);
    }
  }
}

/**
 * Déformation des rues : la chaussée dessinée serpente d'une case au plus autour des cases de rue (courbe lente
 * à graine), sa largeur respire, et tout se calme près de la place. Purement visuel : rue et herbe sont praticables.
 */
function roadWarpOf(map: GameMap, S: number): (p: Pt) => Pt {
  const { width: W, height: H, tiles } = map;
  let cx = (W / 2) * S;
  let cy = (H / 2) * S;
  for (let i = 0; i < W * H; i++)
    if (tiles[i] === T.eau) {
      const x = i % W;
      const y = Math.floor(i / W);
      const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => tiles[(y + dy) * W + x + dx] === T.route);
      if (around) {
        cx = (x + 1) * S;
        cy = (y + 1) * S;
        break;
      }
    }
  const n1 = noise2(map.seed + 301);
  const n2 = noise2(map.seed + 302);
  const n3 = noise2(map.seed + 303);
  // Les rues tournent déjà d'elles-mêmes (générateur) : la main ne fait plus que trembler un peu.
  const A = S * 0.3;
  const B = S * 0.14;
  return ([x, y]) => {
    const d = Math.hypot(x - cx, y - cy);
    const t = Math.max(0, Math.min(1, (d - S * 4.2) / (S * 4)));
    const f = t * t * (3 - 2 * t);
    if (f <= 0) return [x, y];
    const dx = A * n1(y / (S * 7), 0.5) + B * n3(y / (S * 3), x / (S * 1.6));
    const dy = A * n2(x / (S * 7), 0.5) + B * n3(x / (S * 3) + 40, y / (S * 1.6));
    return [x + dx * f, y + dy * f];
  };
}

/** Arrière-cour d'une maison : rectangle de cases contre le mur opposé à la porte, clôturé de piquets. */
interface Yard {
  b: CellRect;
  /** Mur auquel la cour est adossée. */
  side: Side;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Cherche, derrière chaque maison, une cour libre de 2 à 3 cases de profondeur (jamais devant une porte ni sur une rue). */
function planYards(v: V) {
  const { W, H } = v;
  const opp: Record<Side, Side> = { N: "S", S: "N", W: "E", E: "W" };
  const ok = (x: number, y: number) => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
    if (!freeCell(v, x, y)) return false;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const t = v.tile(x + dx, y + dy);
        if (t === T.route || t === T.porte || t === T.eau || v.fence[(y + dy) * W + x + dx]) return false;
      }
    return true;
  };
  // lieux ouverts (dos à la porte) et logis fermés (dos à la rue)
  const homes: (CellRect & { front: Side })[] = [
    ...v.buildings .filter((b) => b.doors.length) .map((b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, front: b.doors[0].side })),
    ...v.blocks.filter((bk) => bk.kind === "maison").map((bk) => ({ ...bk.rects[0], front: bk.front })),
  ];
  homes.forEach((b, bi) => {
    const r = rng(v.seed, 1900 + bi);
    if (r() < 0.2) return;
    const side = opp[b.front];
    const horiz = side === "N" || side === "S";
    const a0 = horiz ? b.x0 : b.y0;
    const a1 = horiz ? b.x1 : b.y1;
    for (const depth of [3, 2]) {
      let best: [number, number] | null = null;
      for (let lo = a0; lo <= a1 && !best; lo++)
        for (let hi = a1; hi - lo + 1 >= 3 && !best; hi--) {
          let good = true;
          for (let a = lo; a <= hi && good; a++)
            for (let k = 1; k <= depth && good; k++) {
              const x = horiz ? a : side === "W" ? b.x0 - k : b.x1 + k;
              const y = horiz ? (side === "N" ? b.y0 - k : b.y1 + k) : a;
              if (!ok(x, y)) good = false;
            }
          if (good) best = [lo, hi];
        }
      if (!best) continue;
      const [lo, hi] = best;
      const y: Yard = horiz
        ? { b, side, x0: lo, x1: hi, y0: side === "N" ? b.y0 - depth : b.y1 + 1, y1: side === "N" ? b.y0 - 1 : b.y1 + depth }
        : { b, side, y0: lo, y1: hi, x0: side === "W" ? b.x0 - depth : b.x1 + 1, x1: side === "W" ? b.x0 - 1 : b.x1 + depth };
      for (let yy = y.y0; yy <= y.y1; yy++)
        for (let xx = y.x0; xx <= y.x1; xx++) {
          v.used[yy * W + xx] = 1;
          v.fence[yy * W + xx] = 1;
        }
      v.yards.push(y);
      break;
    }
  });
}

/** Cours : clôture de piquets avec son ombre, potager en sillons, tas de bûches contre le mur, corde à linge. */
function paintYards(v: V) {
  const { g, S, pal } = v;
  v.yards.forEach((y, yi) => {
    const r = rng(v.seed, 1950 + yi);
    const horiz = y.side === "N" || y.side === "S";
    const L = ((horiz ? y.x1 - y.x0 : y.y1 - y.y0) + 1) * S;
    const D = ((horiz ? y.y1 - y.y0 : y.x1 - y.x0) + 1) * S;
    // repère : x le long du mur, y en s'éloignant du mur
    let ox: number, oy: number, rot: Side;
    if (y.side === "S") [ox, oy, rot] = [y.x0 * S, y.y0 * S, "N"];
    else if (y.side === "N") [ox, oy, rot] = [(y.x1 + 1) * S, (y.y1 + 1) * S, "S"];
    else if (y.side === "E") [ox, oy, rot] = [y.x0 * S, (y.y1 + 1) * S, "W"];
    else [ox, oy, rot] = [(y.x1 + 1) * S, y.y0 * S, "E"];
    inFrame(g, ox, oy, rot, () => {
      const m = 6;
      // portillon sur le grand côté du fond
      const gate = between(r, m + 12, L - m - 40);
      // terre de la cour, plus foulée près du portillon et du mur
      const yard = rectPts(m, EAVE + 2, L - 2 * m, D - m - EAVE - 2);
      g.fillStyle = tint(mixColor(pal.grassDry, pal.dirt, 0.4), 0, 0.28);
      g.fill(pathOf(smoothPoints(jitterPoints(yard, 3, v.seed + yi), 1)));
      // potager : planches de terre en sillons, rangs de légumes
      const plotW = Math.min(L - 2 * m - 16, Math.max(S * 1.6, (L - 2 * m) * between(r, 0.45, 0.6)));
      const left = r() < 0.5;
      const px = left ? m + 6 : L - m - 6 - plotW;
      const py = EAVE + 8;
      const ph = D - py - m - 10;
      if (ph > 24) {
        if (v.flavor === "sf") hydroPlot(v, px, py, plotW, ph, r);
        else if (v.flavor === "ruines") tirePlot(v, px, py, plotW, ph, r);
        else vegetablePlot(v, px, py, plotW, ph, r);
      }
      // tas de bois contre le mur, de l'autre côté
      const wx = left ? px + plotW + 10 : m + 6;
      const ww = Math.min(L - 2 * m - plotW - 22, S * 1.4);
      if (ww > 26) woodpile(v, wx, EAVE + 4, ww, r);
      // corde à linge en travers du reste de la cour
      const lx0 = left ? px + plotW + 12 : m + 8;
      const lx1 = left ? L - m - 8 : px - 10;
      if (lx1 - lx0 > S * 0.9 && D > S * 2.2) {
        // au port, un filet tendu entre deux piquets plutôt que du linge
        if (v.flavor === "port" && r() < 0.6) {
          const ya = D - S * 0.75;
          fishingNet(v, [[lx0, ya - 6], [(lx0 + lx1) / 2, ya - 9], [lx1, ya - 6], [lx1 - 4, ya + 8], [(lx0 + lx1) / 2, ya + 12], [lx0 + 4, ya + 8]], r);
        } else clothesline(v, [lx0, D - S * 0.75], [lx1, D - S * 0.65 - r() * 8], r);
      }
      // clôture de piquets sur trois côtés, ouverte au portillon
      const fence: Pt[][] = [[[m, EAVE - 2], [m, D - m], [gate, D - m]], [[gate + 28, D - m], [L - m, D - m], [L - m, EAVE - 2]]];
      for (const run of fence) pickets(v, run, r);
      // vantail du portillon, ouvert vers l'extérieur
      g.save();
      g.translate(gate + 28, D - m);
      g.rotate(0.9 + r() * 0.4);
      solid(g, rectPts(0, -1.6, 24, 3.2), pal.woodLight, r, { ink: 0.9, shadow: 2 });
      g.restore();
    });
  });
}

/** Clôture de piquets : lisse continue, un piquet tous les 8 px, ombre portée en trait décalé. */
function pickets(v: V, run: Pt[], r: Rng) {
  const { g, pal } = v;
  if (genreFence(v, run, r)) return;
  const pts = densify(run, 8);
  g.save();
  g.globalCompositeOperation = "multiply";
  inkPolyline(g, pts.map(([x, y]) => [x + 3, y + 4] as Pt), r, { width: 2.6, color: "rgba(60,44,30,.45)", wobble: 0.5, taper: 0 });
  g.restore();
  // la lisse casse par endroits : une travée manque, sa planche gît de travers dans l'herbe
  let seg: Pt[] = [pts[0]];
  const rail = mixColor(pal.woodDark, INK, 0.3);
  for (let k = 1; k < pts.length; k++) {
    if (k > 1 && k < pts.length - 2 && r() < 0.07) {
      if (seg.length > 1) inkPolyline(g, seg, r, { width: 1.8, color: rail, wobble: 0.5, taper: 0 });
      const [ax, ay] = pts[k - 1];
      const [bx, by] = pts[k];
      const a = Math.atan2(by - ay, bx - ax) + (r() - 0.5) * 1.2;
      const [mx, my] = [(ax + bx) / 2 + 3 + r() * 3, (ay + by) / 2 + 3 + r() * 3];
      inkLine(g, mx - Math.cos(a) * 5, my - Math.sin(a) * 5, mx + Math.cos(a) * 5, my + Math.sin(a) * 5, r, { width: 1.6, color: tint(pal.wood, -0.1), taper: 1 });
      seg = [pts[k]];
      continue;
    }
    seg.push(pts[k]);
  }
  if (seg.length > 1) inkPolyline(g, seg, r, { width: 1.8, color: rail, wobble: 0.5, taper: 0 });
  for (const [x, y] of pts) {
    if (r() < 0.07) continue;
    const s = 3.4 + r() * 0.8;
    g.fillStyle = "rgba(40,28,18,.4)";
    g.fillRect(x - s / 2 + 2, y - s / 2 + 2.5, s, s);
    g.fillStyle = tint(pal.wood, (r() - 0.5) * 0.2);
    g.fillRect(x - s / 2, y - s / 2, s, s);
    g.strokeStyle = INK;
    g.lineWidth = 0.7;
    g.strokeRect(x - s / 2, y - s / 2, s, s);
  }
}

/** Planche de potager : terre sombre, sillons encrés, rangs de choux, poireaux ou fanes, piquets de tuteurs. */
function vegetablePlot(v: V, x: number, y: number, w: number, h: number, r: Rng) {
  const { g, pal } = v;
  const soil = mixColor(pal.dirt, pal.mud, 0.5);
  const plot = smoothPoints(jitterPoints(densify(rectPts(x, y, w, h), 10, true), 1.6, Math.floor(r() * 1000)), 1);
  solid(g, plot, soil, r, { ink: 0.9, shadow: 0 });
  const rows = Math.max(2, Math.floor(h / 11));
  for (let k = 0; k < rows; k++) {
    const yy = y + 5 + (k * (h - 10)) / (rows - 1 || 1);
    inkPolyline(g, [[x + 3, yy + 3.5], [x + w - 3, yy + 3.5]], r, { width: 1, color: tint(pal.mud, -0.35, 0.6), wobble: 0.6, taper: 4 });
    inkPolyline(g, [[x + 3, yy - 1.5], [x + w - 3, yy - 1.5]], r, { width: 1.2, color: tint(soil, 0.18, 0.6), wobble: 0.6, taper: 4 });
    const kind = (k + Math.floor(r() * 3)) % 3;
    for (let s = x + 6; s < x + w - 5; s += kind === 1 ? 4 : 7 + r() * 2) {
      if (r() < 0.12) continue;
      if (kind === 0) solid(g, smoothPoints(blobPoints(r, s, yy, 3 + r(), 2.6 + r(), 6, 0.3), 1), pick(r, pal.leaves), r, { ink: 0.6, shadow: 1.2 });
      else if (kind === 1)
        inkLine(g, s, yy + 2, s + (r() - 0.5) * 2, yy - 4, r, { width: 1, color: tint(pal.leaves[1], -0.1), taper: 2, wobble: 0.2 });
      else
        strokes(g, tint(pal.leaves[0], -0.15, 0.9), 0.8, (p) => {
          for (let j = 0; j < 4; j++) {
            const a = -Math.PI / 2 + (j - 1.5) * 0.5;
            p.moveTo(s, yy + 1);
            p.lineTo(s + Math.cos(a) * 4, yy + 1 + Math.sin(a) * 4);
          }
        });
    }
  }
}

/** Potager de pneus (post-apocalypse) : pneus couchés en rangs, remplis de terre, un chou ou une courge dans chacun. */
function tirePlot(v: V, x: number, y: number, w: number, h: number, r: Rng) {
  const rad = 9;
  for (let yy = y + rad + 2; yy < y + h - rad + 2; yy += rad * 2 + 3)
    for (let xx = x + rad + 2 + (r() - 0.5) * 3; xx < x + w - rad; xx += rad * 2 + 3 + r() * 2) if (r() > 0.1) tire(v, xx, yy + (r() - 0.5) * 3, rad, r, true);
}

/** Tas de bûches empilées, bouts sciés ronds visibles, billot et hache à côté. */
function woodpile(v: V, x: number, y: number, w: number, r: Rng) {
  const { g, pal } = v;
  const rows = 3;
  const rad = 3.6;
  // ombre de contact
  g.fillStyle = "rgba(40,28,18,.35)";
  g.fillRect(x + 3, y + 4, w, rows * rad * 1.8 + 4);
  for (let k = 0; k < rows; k++) {
    const yy = y + rad + k * rad * 1.75;
    for (let xx = x + rad + (k % 2) * rad; xx < x + w - rad; xx += rad * 2 + 0.3) {
      const rr = rad * (0.85 + r() * 0.25);
      disc(g, xx, yy, rr, tint(pal.woodLight, (r() - 0.5) * 0.18), r, { ink: 0.8, shadow: 0, light: false });
      g.strokeStyle = tint(pal.wood, -0.1, 0.8);
      g.lineWidth = 0.5;
      g.beginPath();
      g.arc(xx + 0.2, yy + 0.2, rr * 0.5, 0, Math.PI * 2);
      g.stroke();
    }
  }
  // billot et hache plantée
  const bx = x + w * 0.5 + (r() - 0.5) * 10;
  const by = y + rows * rad * 1.8 + 12;
  disc(g, bx, by, 6.5, pal.woodLight, r, { ink: 1.1, shadow: 3 });
  g.strokeStyle = tint(pal.wood, -0.1, 0.8);
  g.lineWidth = 0.5;
  for (const rr of [2, 4]) {
    g.beginPath();
    g.arc(bx, by, rr, 0, Math.PI * 2);
    g.stroke();
  }
  inkLine(g, bx - 1, by, bx + 11, by - 6, r, { width: 1.6, color: pal.woodDark, taper: 0 });
  solid(g, [[bx - 3, by - 3], [bx + 1, by - 4], [bx + 1.5, by + 3], [bx - 2.5, by + 3]], pal.metal, r, { ink: 0.7, shadow: 0 });
  // copeaux
  stipple(g, rectShape(bx - 12, by - 8, 24, 16), r, { density: 1.6, radius: 0.7, color: tint(pal.woodLight, 0.1, 0.8) });
}

/** Corde à linge entre deux poteaux, draps et chemises qui pendent en losange, avec leur ombre. */
function clothesline(v: V, a: Pt, b: Pt, r: Rng) {
  const { g, pal } = v;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L;
  const uy = (b[1] - a[1]) / L;
  let s = 8;
  while (s < L - 18) {
    const w = 16 + r() * 12;
    const c = s + w / 2;
    const px = a[0] + ux * c;
    const py = a[1] + uy * c + Math.sin((c / L) * Math.PI) * 2;
    const col = r() < 0.5 ? "#e6dcc4" : pick(r, pal.cloth);
    const sag = 8 + r() * 5;
    const sheet: Pt[] = [[px - (ux * w) / 2, py - (uy * w) / 2], [px + uy * -sag * 0.4, py - sag * 0.7], [px + (ux * w) / 2, py + (uy * w) / 2], [px - uy * -sag * 0.4 + 2, py + sag]];
    solid(g, sheet, col, r, { ink: 0.9, shadow: 9 });
    inkLine(g, px, py - sag * 0.6, px + 1, py + sag * 0.8, r, { width: 0.5, color: tint(col, -0.3, 0.8), taper: 2 });
    s += w + 4 + r() * 5;
  }
  inkPolyline(g, densify([a, b], 8), r, { width: 0.8, wobble: 0.4, taper: 0 });
  for (const [x, y] of [a, b]) {
    disc(g, x, y, 2.8, pal.woodDark, r, { ink: 0.9, shadow: 6 });
  }
}

/** Débords de plume : à chaque angle du polygone, les deux traits dépassent de 2 à 3 px. */
function overshoot(g: CanvasRenderingContext2D, pts: Pt[], r: Rng, width = 1.2) {
  const n = pts.length;
  for (let k = 0; k < n; k++) {
    const p = pts[k];
    for (const q of [pts[(k + n - 1) % n], pts[(k + 1) % n]]) {
      const l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
      const ux = (p[0] - q[0]) / l;
      const uy = (p[1] - q[1]) / l;
      const e = 2 + r() * 1.5;
      inkLine(g, p[0] - ux * 1.5, p[1] - uy * 1.5, p[0] + ux * e, p[1] + uy * e, r, { width, color: WALL_INK, taper: 2, wobble: 0.15 });
    }
  }
}

/**
 * Meubles à l'échelle de la case (48 px = 1,5 m) : table pour six de 1 × 2 cases et ses bancs, tabouret de 0,3 case,
 * tonneau de 0,7 case, comptoir en L, lit à baldaquin, stalles, enclume à corne… Chacun a son ombre de contact.
 */
function furniture2(v: V, r: Rng) {
  const { g, pal, S } = v;
  const base = furniture(v, r);
  const stoolAt = (x: number, y: number) => {
    disc(g, x, y, S * 0.15, tint(pal.wood, (r() - 0.5) * 0.1), r, { ink: 1.2, shadow: 2.5 });
    g.strokeStyle = tint(pal.woodDark, 0, 0.5);
    g.lineWidth = 0.6;
    g.beginPath();
    g.arc(x, y, S * 0.08, 0, Math.PI * 2);
    g.stroke();
  };
  // planche de bois vue de dessus : lattes dans le sens de la longueur
  const board = (pts: Pt[], col: string, along: boolean, n: number, ink = 1.5) => {
    solid(g, pts, col, r, { ink, shadow: 4 });
    const [x0, y0] = pts[0];
    const [x1, y1] = pts[2];
    strokes(g, tint(col, -0.3, 0.6), 0.6, (p) => {
      for (let k = 1; k < n; k++) {
        if (along) {
          const yy = y0 + ((y1 - y0) * k) / n;
          p.moveTo(x0 + 1.5, yy);
          p.lineTo(x1 - 1.5, yy);
        } else {
          const xx = x0 + ((x1 - x0) * k) / n;
          p.moveTo(xx, y0 + 1.5);
          p.lineTo(xx, y1 - 1.5);
        }
      }
    });
  };
  const mug = (x: number, y: number) => {
    disc(g, x, y, 2.6, pal.wood, r, { ink: 0.8, shadow: 1 });
    g.fillStyle = r() < 0.5 ? "#e8d9a8" : "#3a2414";
    g.beginPath();
    g.arc(x, y, 1.5, 0, Math.PI * 2);
    g.fill();
  };
  const plate = (x: number, y: number) => {
    disc(g, x, y, 3.8, "#ddd2b8", r, { ink: 0.7, shadow: 1, light: false });
    g.strokeStyle = "rgba(22,16,10,.35)";
    g.lineWidth = 0.5;
    g.beginPath();
    g.arc(x, y, 2.4, 0, Math.PI * 2);
    g.stroke();
  };
  const F = {
    ...base,
    stool(x: number, y: number, w: number, hh: number) {
      stoolAt(x + w / 2 + (r() - 0.5) * 4, y + hh / 2 + (r() - 0.5) * 4);
    },
    barrels(x: number, y: number, w: number, hh: number) {
      barrel(v, x + w / 2, y + hh / 2, Math.min(S * 0.35, Math.min(w, hh) * 0.42), r);
    },
    /** Trois tonneaux debout serrés en triangle. */
    barrelPile(x: number, y: number, w: number, hh: number) {
      const rad = Math.min(S * 0.3, Math.min(w, hh) * 0.26);
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const a0 = r() * Math.PI * 2;
      for (let k = 0; k < 3; k++) {
        const a = a0 + (k * Math.PI * 2) / 3;
        barrel(v, cx + Math.cos(a) * rad * 1.08, cy + Math.sin(a) * rad * 1.08, rad, r);
      }
    },
    /** Table pour six : plateau de 1 × 2 cases au plus, un banc de chaque côté, couverts. */
    longTable(x: number, y: number, w: number, hh: number) {
      const along = w >= hh;
      const L = (along ? w : hh) - 10;
      const D = Math.min(S * 0.78, (along ? hh : w) - 30);
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const tbl: Pt[] = along ? rectPts(cx - L / 2, cy - D / 2, L, D) : rectPts(cx - D / 2, cy - L / 2, D, L);
      const bl = L - 12;
      const bd = S * 0.2;
      for (const sgn of [-1, 1]) {
        const off = D / 2 + 4 + bd / 2;
        const bench: Pt[] = along ? rectPts(cx - bl / 2, cy + sgn * off - bd / 2, bl, bd) : rectPts(cx + sgn * off - bd / 2, cy - bl / 2, bd, bl);
        board(bench, pal.wood, along, 2, 1.3);
      }
      board(tbl, pal.woodLight, along, 4, 1.6);
      // couverts : assiettes et chopes face aux places, une chandelle au milieu
      const n = Math.max(2, Math.floor(L / 26));
      for (let k = 0; k < n; k++) {
        for (const sgn of [-1, 1]) {
          if (r() < 0.35) continue;
          const t = (k + 0.5) / n - 0.5;
          const px = along ? cx + t * L : cx + sgn * D * 0.28;
          const py = along ? cy + sgn * D * 0.28 : cy + t * L;
          if (r() < 0.6) plate(px, py);
          else mug(px, py);
        }
      }
      if (r() < 0.7) {
        glow(g, cx, cy, 30, 0.35);
        disc(g, cx, cy, 2, "#efe6cc", r, { ink: 0.5, shadow: 1, light: false });
        flame(g, cx, cy, 1);
      }
    },
    /** Petite table ronde et ses tabourets. */
    roundTable(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const R = Math.min(w, hh) * 0.27;
      const a0 = r() * Math.PI;
      for (let k = 0; k < 3; k++) {
        if (r() < 0.2) continue;
        const a = a0 + (k * Math.PI * 2) / 3;
        stoolAt(cx + Math.cos(a) * (R + 9), cy + Math.sin(a) * (R + 9));
      }
      disc(g, cx, cy, R, pal.woodLight, r, { ink: 1.6, shadow: 4 });
      strokes(g, tint(pal.woodLight, -0.3, 0.55), 0.6, (p) => {
        p.moveTo(cx - R * 0.8, cy - R * 0.25);
        p.lineTo(cx + R * 0.8, cy - R * 0.25);
        p.moveTo(cx - R * 0.8, cy + R * 0.25);
        p.lineTo(cx + R * 0.8, cy + R * 0.25);
      });
      mug(cx - R * 0.3, cy + R * 0.2);
      if (r() < 0.6) plate(cx + R * 0.3, cy - R * 0.2);
    },
    /** Comptoir en L : long bar à distance du mur, retour jusqu'au mur, étagère de chopes derrière. */
    counter(x: number, y: number, w: number, hh: number, side: Side) {
      const horiz = side === "N" || side === "S";
      const d = S * 0.32;
      const gap = S * 0.5;
      // repère local : u le long du mur, w0 = distance au mur
      const U = horiz ? w : hh;
      const at = (u: number, n: number, du: number, dn: number): Pt[] => {
        if (side === "N") return rectPts(x + u, y + n, du, dn);
        if (side === "S") return rectPts(x + u, y + hh - n - dn, du, dn);
        if (side === "W") return rectPts(x + n, y + u, dn, du);
        return rectPts(x + w - n - dn, y + u, dn, du);
      };
      // étagère contre le mur, chopes et bouteilles alignées
      const shelf = at(4, 1, U - 8, 7);
      solid(g, shelf, pal.woodDark, r, { ink: 1.1, shadow: 2 });
      for (let u = 8; u < U - 8; u += 5.5) {
        const [sx, sy] = shelf[0];
        const [ex, ey] = shelf[2];
        const t = (u - 4) / (U - 8);
        const px = horiz ? sx + (ex - sx) * t : (sx + ex) / 2;
        const py = horiz ? (sy + ey) / 2 : sy + (ey - sy) * t;
        g.fillStyle = pick(r, ["#6b4a2e", "#3d5a3a", "#5a3a22", "#b9ab8a"]);
        g.beginPath();
        g.arc(px, py, 1.9, 0, Math.PI * 2);
        g.fill();
      }
      // bar et retour
      const left = r() < 0.5;
      const bar = at(left ? d + 2 : 4, gap + 3, U - d - 6, d);
      const ret = at(left ? 2 : U - d - 2, 3, d, gap + d);
      board(ret, pal.wood, !horiz, 2, 1.5);
      board(bar, pal.wood, horiz, 2, 1.7);
      const [bx0, by0] = bar[0];
      const [bx1, by1] = bar[2];
      for (let k = 0; k < 3; k++) {
        const t = 0.2 + k * 0.28 + r() * 0.06;
        mug(horiz ? bx0 + (bx1 - bx0) * t : (bx0 + bx1) / 2, horiz ? (by0 + by1) / 2 : by0 + (by1 - by0) * t);
      }
      // tabourets côté salle
      for (let k = 0; k < 3; k++) {
        if (r() < 0.25) continue;
        const t = 0.2 + k * 0.3;
        const [sx, sy] = horiz ? [bx0 + (bx1 - bx0) * t, side === "N" ? by1 + 11 : by0 - 11] : [side === "W" ? bx1 + 11 : bx0 - 11, by0 + (by1 - by0) * t];
        stoolAt(sx, sy);
      }
    },
    /** Âtre de pierre : manteau, foyer noir, chenets, bûches, chaudron pendu, lueur. */
    hearth(x: number, y: number, w: number, hh: number, side: Side) {
      base.hearth(x, y, w, hh, side);
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const horiz = side === "N" || side === "S";
      // chenets de part et d'autre des braises
      for (const sgn of [-1, 1]) {
        const [ax, ay] = horiz ? [cx + sgn * 9, cy] : [cx, cy + sgn * 9];
        inkLine(g, ax - (horiz ? 0 : 4), ay - (horiz ? 4 : 0), ax + (horiz ? 0 : 4), ay + (horiz ? 4 : 0), r, { width: 1.8, color: "#2b2a28", taper: 0 });
      }
      // chaudron
      const [kx, ky] = horiz ? [cx + 5, cy + (side === "N" ? 4 : -4)] : [cx + (side === "W" ? 4 : -4), cy + 5];
      disc(g, kx, ky, 5, "#24201d", r, { ink: 1.1, shadow: 0 });
      g.strokeStyle = "rgba(220,200,160,.35)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.arc(kx - 1, ky - 1, 3, Math.PI, Math.PI * 1.6);
      g.stroke();
      // bûches de réserve à côté
      for (let k = 0; k < 3; k++) {
        const [lx, ly] = horiz ? [x + w + 2, y + (side === "N" ? 6 : hh - 12) + k * 4] : [x + (side === "W" ? 6 : w - 18) + k * 0, y + hh + 3 + k * 4];
        solid(g, rectPts(lx - 6, ly, 12, 3.6), tint(pal.wood, (r() - 0.5) * 0.15), r, { ink: 0.7, shadow: 1 });
      }
    },
    /** Enclume à corne posée sur son billot, marteau et pinces. */
    anvil(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      disc(g, cx, cy + 1, S * 0.3, pal.wood, r, { ink: 1.4, shadow: 5 });
      g.strokeStyle = tint(pal.woodDark, 0, 0.6);
      g.lineWidth = 0.6;
      for (const rr of [4, 8, 11]) {
        g.beginPath();
        g.arc(cx, cy + 1, rr, 0, Math.PI * 2);
        g.stroke();
      }
      // table plate, talon carré, corne effilée
      const body: Pt[] = [[cx - 9, cy - 5], [cx + 7, cy - 5], [cx + 10, cy - 3.5], [cx + 21, cy - 0.5], [cx + 10, cy + 2.5], [cx + 7, cy + 5], [cx - 9, cy + 5], [cx - 11, cy + 3], [cx - 11, cy - 3]];
      solid(g, smoothPoints(body, 1), "#4a4e52", r, { ink: 1.6, shadow: 4 });
      g.fillStyle = "rgba(255,255,255,.28)";
      g.fillRect(cx - 7, cy - 3.5, 13, 1.5);
      g.fillStyle = "#1c1c1c";
      g.fillRect(cx - 7, cy - 1, 2.4, 2.4);
      inkLine(g, cx - 14, cy + 10, cx - 4, cy + 14, r, { width: 1.6, color: pal.woodDark, taper: 1 });
      solid(g, rectPts(cx - 17, cy + 7, 5, 6), "#3a3c3e", r, { ink: 0.8, shadow: 1 });
    },
    /** Foyer de forge, soufflet de cuir plissé en losange, bac de trempe. */
    forgeHearth(x: number, y: number, w: number, hh: number) {
      base.forgeHearth(x, y, w, hh);
      const fx = x + 5;
      const fw = w - 10;
      const cy = y + hh / 2;
      const bx = fx + fw + 2;
      const bel: Pt[] = [[bx, cy], [bx + 9, cy - 10], [bx + 22, cy], [bx + 9, cy + 10]];
      solid(g, bel, "#6b4a2e", r, { ink: 1.3, shadow: 3 });
      strokes(g, "rgba(22,16,10,.6)", 0.6, (p) => {
        for (let k = 1; k < 4; k++) {
          const t = k / 4;
          p.moveTo(bx + 9 * t + 1, cy - 10 * t + 1);
          p.lineTo(bx + 9 * t + 1, cy + 10 * t - 1);
        }
      });
      inkLine(g, bx + 22, cy, bx + 30, cy, r, { width: 2, color: pal.woodDark, taper: 0 });
    },
    /** Lit à baldaquin : quatre colonnes, ciel de lit tendu, rideaux repliés. */
    canopyBed(x: number, y: number, w: number, hh: number, side: Side) {
      base.bed(x, y, w, hh, side);
      const bw = w - 8;
      const bh = hh - 8;
      const bx = x + 4;
      const by = y + 4;
      const posts: Pt[] = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]];
      inkPolyline(g, posts, r, { width: 1.1, closed: true, color: tint(pal.cloth[0], -0.3, 0.9), wobble: 0.3 });
      for (const [px, py] of posts) {
        disc(g, px, py, 3.2, pal.woodDark, r, { ink: 1, shadow: 2 });
      }
      // rideaux noués aux colonnes de tête
      const head = side === "N" ? [posts[0], posts[1]] : side === "S" ? [posts[2], posts[3]] : side === "W" ? [posts[0], posts[3]] : [posts[1], posts[2]];
      for (const [px, py] of head) solid(g, smoothPoints(blobPoints(r, px + (px > bx + bw / 2 ? -5 : 5), py + (py > by + bh / 2 ? -5 : 5), 5, 4, 7, 0.3), 1), pal.cloth[0], r, { ink: 0.8, shadow: 1 });
    },
    /** Coffre ferré : couvercle bombé, bandes de fer, serrure. */
    chest(x: number, y: number, w: number, hh: number, side: Side) {
      base.chest(x, y, w, hh, side);
    },
    /** Chaise du chef : siège carré, dossier épais. */
    chair(x: number, y: number, side: Side) {
      const s = S * 0.36;
      solid(g, rectPts(x - s / 2, y - s / 2, s, s), pal.wood, r, { ink: 1.3, shadow: 3 });
      const back =
        side === "N"
          ? rectPts(x - s / 2, y - s / 2 - 4, s, 5)
          : side === "S" ? rectPts(x - s / 2, y + s / 2 - 1, s, 5) : side === "W" ? rectPts(x - s / 2 - 4, y - s / 2, 5, s) : rectPts(x + s / 2 - 1, y - s / 2, 5, s);
      solid(g, back, pal.woodDark, r, { ink: 1.3, shadow: 2 });
      disc(g, x, y, s * 0.28, pal.cloth[0], r, { ink: 0.6, shadow: 0, light: false });
    },
    greatTable(x: number, y: number, w: number, hh: number) {
      const along = w >= hh;
      F.longTable(x, y, w, hh);
      // chaise du chef au bout de la table
      if (along) F.chair(x + 7, y + hh / 2, "W");
      else F.chair(x + w / 2, y + 7, "N");
    },
    /** Stalles : cloisons de planches perpendiculaires au mur du fond, litière hachurée, seau, râtelier de foin. */
    stalls(ix: number, iy: number, iw: number, ih: number, far: Side) {
      const horiz = far === "N" || far === "S";
      const L = horiz ? iw : ih;
      const depth = Math.min(S * 1.5, (horiz ? ih : iw) - S * 1.1);
      if (depth < S * 0.8) return;
      const n = Math.max(2, Math.min(5, Math.floor(L / (S * 1.1))));
      const step = L / n;
      const rect = (a: number, d0: number, la: number, ld: number): Pt[] => {
        if (far === "N") return rectPts(ix + a, iy + d0, la, ld);
        if (far === "S") return rectPts(ix + a, iy + ih - d0 - ld, la, ld);
        if (far === "W") return rectPts(ix + d0, iy + a, ld, la);
        return rectPts(ix + iw - d0 - ld, iy + a, ld, la);
      };
      for (let k = 0; k < n; k++) {
        // litière de paille hachurée
        const bed = rect(k * step + 3, 2, step - 6, depth - 4);
        g.fillStyle = tint(mixColor(pal.straw, pal.mud, 0.25), 0, 0.75);
        g.fill(pathOf(bed));
        hatch(g, shapeOf(bed), r, { mode: "touffes", tuft: 7, width: 0.6, color: tint(pal.straw, -0.35, 0.8) });
        // auge contre le mur du fond, seau
        board(rect(k * step + 8, 2, step - 16, 9), pal.wood, horiz, 1, 1.2);
        if (r() < 0.5) {
          const [bx, by] = rect(k * step + step * 0.7, depth * 0.6, 1, 1)[0];
          F.bucket(bx - 6, by - 6, 12, 12);
        }
      }
      for (let k = 0; k <= n; k++) {
        const a = Math.min(L - 3, Math.max(0, k * step - 2));
        board(rect(a, 0, 4.5, depth), pal.wood, !horiz, 1, 1.3);
        // poteau au bout de la cloison
        const p = rect(a - 1, depth - 6, 6.5, 6.5);
        solid(g, p, pal.woodDark, r, { ink: 1.1, shadow: 2 });
      }
    },
    /** Bottes de foin cerclées de ficelle. */
    hay(x: number, y: number, w: number, hh: number) {
      const n = w > hh ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const bw = (w - 8) / n - 2;
        const pts = rectPts(x + 4 + k * (bw + 3), y + 5 + k * 2, bw, hh - 10);
        solid(g, pts, pal.straw, r, { ink: 1.2, shadow: 3 });
        hatchLines(g, shapeOf(pts), r, { spacing: 2.4, width: 0.5, color: tint(pal.straw, -0.35, 0.7), angle: 0.1 });
        const [px, py] = pts[0];
        const [qx, qy] = pts[2];
        strokes(g, tint(pal.woodDark, 0, 0.8), 0.9, (p) => {
          for (const t of [0.3, 0.7]) {
            p.moveTo(px + (qx - px) * t, py);
            p.lineTo(px + (qx - px) * t, qy);
          }
        });
      }
    },
    /** Bénitier de pierre près de l'entrée. */
    font(x: number, y: number, w: number, hh: number) {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      disc(g, cx, cy, S * 0.22, mixColor(pal.flag, "#ffffff", 0.15), r, { ink: 1.4, shadow: 3 });
      disc(g, cx, cy, S * 0.13, mixColor(pal.water, "#2a3a3a", 0.4), r, { ink: 0.8, shadow: 0, light: false });
    },
    /** Herbes qui sèchent : cordes tendues d'un mur à l'autre, bottes suspendues tête en bas. */
    dryingLines(ix: number, iy: number, iw: number, ih: number) {
      const alongX = iw >= ih;
      const n = Math.max(1, Math.round((alongX ? ih : iw) / (S * 1.2)));
      for (let k = 0; k < n; k++) {
        const off = ((k + 0.5) / n) * (alongX ? ih : iw) + (r() - 0.5) * 6;
        const a: Pt = alongX ? [ix - 4, iy + off] : [ix + off, iy - 4];
        const b2: Pt = alongX ? [ix + iw + 4, iy + off + 3] : [ix + off + 3, iy + ih + 4];
        const L = (alongX ? iw : ih) + 8;
        for (let s = 12; s < L - 10; s += 11 + r() * 6) {
          const t = s / L;
          const px = a[0] + (b2[0] - a[0]) * t;
          const py = a[1] + (b2[1] - a[1]) * t;
          const col = pick(r, [pal.leaves[0], pal.leaves[1], "#8a6a3a", "#6a5a7a", "#7a8a4a"]);
          // la botte : tiges liées au fil, feuilles en grappe qui s'évasent
          const dx = alongX ? 0 : 1;
          const dy = alongX ? 1 : 0;
          g.save();
          g.globalCompositeOperation = "multiply";
          g.fillStyle = "rgba(60,44,30,.3)";
          g.beginPath();
          g.ellipse(px + 7 + dx * 4, py + 9 + dy * 4, 4, 4, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
          strokes(g, tint(col, -0.3, 0.9), 0.7, (p) => {
            for (let j = -2; j <= 2; j++) {
              p.moveTo(px, py);
              p.lineTo(px + dx * 8 + dy * j * 1.8 + (r() - 0.5), py + dy * 8 + dx * j * 1.8 + (r() - 0.5));
            }
          });
          for (let j = 0; j < 5; j++) {
            const lx = px + dx * (5 + r() * 5) + dy * (r() - 0.5) * 8;
            const ly = py + dy * (5 + r() * 5) + dx * (r() - 0.5) * 8;
            solid(g, blobPoints(r, lx, ly, 2.4, 1.5, 5, 0.2, r() * 3), col, r, { ink: 0.45, shadow: 0, light: false });
          }
          g.fillStyle = "#c9b48a";
          g.fillRect(px - 1, py - 1, 2, 2);
        }
        inkLine(g, a[0], a[1], b2[0], b2[1], r, { width: 0.8, wobble: 0.4, taper: 0 });
      }
    },
  };
  return F;
}

/** Conifère vu d'en haut : étoile de branches en trois étages, du plus sombre (dessous) au plus clair (cime). */
function conifer(v: V, t: Tree, r: Rng) {
  const { g } = v;
  const R = t.rad;
  const layers = [1, 0.72, 0.42];
  layers.forEach((k, li) => {
    const n = 9 + Math.floor(r() * 4) - li * 2;
    const a0 = r() * Math.PI;
    const pts: Pt[] = [];
    for (let j = 0; j < n * 2; j++) {
      const a = a0 + (j / (n * 2)) * Math.PI * 2;
      const rr = R * k * (j % 2 ? 0.62 + r() * 0.1 : 0.95 + r() * 0.08);
      pts.push([t.x + Math.cos(a) * rr - li * 1.2, t.y + Math.sin(a) * rr - li * 1.5]);
    }
    const col = mixColor(t.color, "#e8ecc8", li * 0.13);
    g.fillStyle = col;
    g.fill(pathOf(pts));
    // aiguilles : traits du centre vers chaque pointe
    strokes(g, tint(col, -0.3, 0.7), 0.6, (p) => {
      for (let j = 0; j < pts.length; j += 2) {
        const [qx, qy] = pts[j];
        p.moveTo(t.x + (qx - t.x) * 0.25, t.y + (qy - t.y) * 0.25);
        p.lineTo(qx - (qx - t.x) * 0.08, qy - (qy - t.y) * 0.08);
      }
    });
    if (li === 0) {
      const dark = new Path2D();
      dark.addPath(pathOf(pts));
      g.save();
      g.clip(dark);
      g.fillStyle = tint(t.color, -0.3, 0.45);
      g.beginPath();
      g.ellipse(t.x + R * 0.45, t.y + R * 0.5, R * 0.9, R * 0.7, -0.7, 0, Math.PI * 2);
      g.fill();
      hatchLines(g, rectShape(t.x, t.y, R, R), r, { spacing: 3, width: 0.55, color: "rgba(22,16,10,.5)", angle: -Math.PI / 4 });
      g.restore();
    }
    inkStroke(g, pts, r, { width: li ? 0.8 : 1.4, closed: true, wobble: 0.3, breaks: false });
  });
  disc(g, t.x - 2, t.y - 2.5, 2, tint(t.color, 0.3), r, { ink: 0.6, shadow: 0, light: false });
}

/** Saule : masse allongée, rameaux qui retombent en traits courbes, plus clairs côté lumière. */
function willow(v: V, t: Tree, r: Rng) {
  const { g } = v;
  const crown = shapeOf(t.pts);
  g.fillStyle = t.color;
  g.fill(crown.path);
  g.save();
  g.clip(crown.path);
  const R = t.rad;
  g.fillStyle = tint(t.color, -0.28, 0.5);
  g.beginPath();
  g.ellipse(t.x + R * 0.5, t.y + R * 0.55, R, R * 0.8, -0.6, 0, Math.PI * 2);
  g.fill();
  // rameaux : courbes du centre vers le bord, qui s'affaissent
  for (const [col, w, n, off] of [[tint(t.color, -0.32, 0.8), 0.75, Math.round(R * 1.6), 0], [tint(t.color, 0.16, 0.55), 0.6, Math.round(R * 0.6), -1.5]] as const) {
    strokes(g, col, w, (p) => {
      for (let k = 0; k < n; k++) {
        // rameaux peignés qui retombent tous du même côté, en mèches
        const a = r() * Math.PI * 2;
        const d = R * Math.sqrt(r()) * 0.85;
        const x0 = t.x + Math.cos(a) * d + off;
        const y0 = t.y + Math.sin(a) * d * 0.72 + off;
        const dir = Math.PI / 2 + Math.cos(a) * 0.35 + (r() - 0.5) * 0.3;
        const l = R * between(r, 0.3, 0.55);
        const x1 = x0 + Math.cos(dir) * l;
        const y1 = y0 + Math.sin(dir) * l;
        p.moveTo(x0, y0);
        p.quadraticCurveTo(x0 + Math.cos(dir - 0.5) * l * 0.5, y0 + Math.sin(dir - 0.5) * l * 0.5, x1, y1);
      }
    });
  }
  hatchLines(g, shapeOf(t.pts.map(([x, y]) => [t.x + (x - t.x) * 0.5 + R * 0.35, t.y + (y - t.y) * 0.5 + R * 0.4] as Pt)), r, {
    spacing: 3,
    width: 0.55,
    color: "rgba(22,16,10,.4)",
    angle: -Math.PI / 4,
  });
  g.restore();
  // bord effrangé : la plume suit les rameaux
  inkStroke(g, t.pts, r, { width: 1.3, closed: true, wobble: 0.9 });
}

/**
 * Charrette dételée, centrée en (cx, cy), tournée de `ang` : plateau de planches à ridelles, deux roues à rayons
 * (vues un peu de biais), essieu, brancards posés au sol, chargement de sacs, de foin ou de tonneaux.
 */
function cart(v: V, cx: number, cy: number, ang: number, r: Rng) {
  const { g, pal, S } = v;
  const L = S * 0.95;
  const D = S * 0.62;
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  // ombre portée de l'ensemble (dans le repère du monde : on la décale avant la rotation)
  g.save();
  g.rotate(-ang);
  g.translate(10, 13);
  g.rotate(ang);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(60,44,30,.38)";
  g.fill(pathOf(rectPts(-L / 2, -D / 2 - 6, L, D + 12)));
  g.beginPath();
  g.moveTo(L / 2, -D / 4);
  g.lineTo(L / 2 + S * 0.75, -3);
  g.lineTo(L / 2 + S * 0.75, 3);
  g.lineTo(L / 2, D / 4);
  g.fill();
  g.restore();
  // brancards : deux longues pièces qui se rapprochent vers l'avant
  for (const sgn of [-1, 1])
    inkPolyline(g, [[L / 2 - 6, sgn * D * 0.3], [L / 2 + S * 0.8, sgn * 5]], r, { width: 3.4, color: pal.woodDark, taper: 3, wobble: 0.3 });
  for (const sgn of [-1, 1])
    inkPolyline(g, [[L / 2 - 6, sgn * D * 0.3 - 1.6], [L / 2 + S * 0.8, sgn * 5 - 1.6]], r, { width: 0.7, taper: 3, wobble: 0.2 });
  // roues de part et d'autre, au milieu : jante, moyeu, rayons
  for (const sgn of [-1, 1]) {
    const wy = sgn * (D / 2 + 3);
    g.fillStyle = tint(pal.woodDark, 0.05);
    g.beginPath();
    g.ellipse(0, wy, S * 0.34, 4.2, 0, 0, Math.PI * 2);
    g.fill();
    strokes(g, tint(pal.woodLight, 0, 0.8), 0.7, (p) => {
      for (let k = -3; k <= 3; k++) {
        p.moveTo(k * 3.6, wy - 3);
        p.lineTo(k * 3.6, wy + 3);
      }
    });
    inkPolyline(
      g,
      Array.from({ length: 20 }, (_, k) => [Math.cos((k / 20) * Math.PI * 2) * S * 0.34, wy + Math.sin((k / 20) * Math.PI * 2) * 4.2] as Pt),
      r,
      { width: 1.3, closed: true, wobble: 0.2 },
    );
    disc(g, 0, wy, 2.4, "#3a3836", r, { ink: 0.7, shadow: 0, light: false });
  }
  // plateau à ridelles
  const bed = rectPts(-L / 2, -D / 2, L, D);
  solid(g, bed, pal.wood, r, { ink: 0, shadow: 0 });
  strokes(g, tint(pal.woodDark, 0, 0.7), 0.7, (p) => {
    for (let k = 1; k < 5; k++) {
      p.moveTo(-L / 2 + 2, -D / 2 + (D * k) / 5);
      p.lineTo(L / 2 - 2, -D / 2 + (D * k) / 5);
    }
  });
  inkPolyline(g, rectPts(-L / 2 + 3, -D / 2 + 3, L - 6, D - 6), r, { width: 2.2, closed: true, color: pal.woodDark, wobble: 0.2 });
  inkStroke(g, densify(bed, 6, true), r, { width: 1.5, closed: true, breaks: false, color: WALL_INK });
  // chargement
  const load = r();
  if (load < 0.4) {
    sack(v, -L * 0.2, -D * 0.12, r);
    sack(v, L * 0.08, D * 0.1, r);
    sack(v, L * 0.22, -D * 0.15, r);
  } else if (load < 0.75) {
    const hay = smoothPoints(blobPoints(r, 0, 0, L * 0.38, D * 0.36, 9, 0.12), 2);
    solid(g, hay, pal.straw, r, { ink: 1, shadow: 2 });
    hatch(g, shapeOf(hay), r, { mode: "touffes", tuft: 6, width: 0.5, color: tint(pal.straw, -0.35, 0.75) });
  } else {
    barrel(v, -L * 0.18, 0, D * 0.3, r);
    barrel(v, L * 0.18, 0, D * 0.3, r);
  }
  g.restore();
}

/** Souches et buissons isolés dans l'herbe : quelques-uns, jamais devant une porte ni dans une cour. */
function paintStumps(v: V) {
  const { g, W, H, S, pal } = v;
  const r = rng(v.seed, 1450);
  const n = Math.round((W * H) / 220);
  for (let k = 0, tries = 0; k < n && tries < 400; tries++) {
    const x = 1 + Math.floor(r() * (W - 2));
    const y = 1 + Math.floor(r() * (H - 2));
    if (!freeCell(v, x, y) || v.fence[y * W + x]) continue;
    let nearRoad = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (v.tile(x + dx, y + dy) === T.route || v.tile(x + dx, y + dy) === T.mur) nearRoad = true;
    if (nearRoad) continue;
    k++;
    v.used[y * W + x] = 1;
    const cx = (x + 0.3 + r() * 0.4) * S;
    const cy = (y + 0.3 + r() * 0.4) * S;
    if (r() < 0.45) {
      // souche : racines, écorce, cernes, une fente
      const R = S * between(r, 0.14, 0.22);
      strokes(g, mixColor(pal.woodDark, INK, 0.3), 1.6, (p) => {
        for (let j = 0; j < 4; j++) {
          const a = r() * Math.PI * 2;
          p.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
          p.quadraticCurveTo(cx + Math.cos(a + 0.3) * R * 1.4, cy + Math.sin(a + 0.3) * R * 1.4, cx + Math.cos(a) * R * 1.9, cy + Math.sin(a) * R * 1.9);
        }
      });
      const bark = smoothPoints(blobPoints(r, cx, cy, R, R * 0.92, 9, 0.15), 1);
      solid(g, bark, pal.woodDark, r, { ink: 1.3, shadow: 5 });
      disc(g, cx - 0.8, cy - 0.8, R * 0.78, mixColor(pal.woodLight, "#d8c49a", 0.3), r, { ink: 0.7, shadow: 0, light: false });
      g.strokeStyle = tint(pal.wood, -0.05, 0.75);
      g.lineWidth = 0.5;
      for (let rr = R * 0.2; rr < R * 0.7; rr += 2.2) {
        g.beginPath();
        g.arc(cx - 0.8, cy - 0.8, rr, 0, Math.PI * 2);
        g.stroke();
      }
      inkLine(g, cx - 0.8, cy - 0.8, cx + R * 0.6, cy - R * 0.3, r, { width: 0.7, taper: 2 });
    } else {
      // buisson bas, quelques lobes, ombre portée hachurée
      const R = S * between(r, 0.25, 0.38);
      const lobes: Lobe[] = [{ x: cx, y: cy, rad: R * 0.55 }];
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 + r() * 0.5;
        lobes.push({ x: cx + Math.cos(a) * R * 0.55, y: cy + Math.sin(a) * R * 0.55, rad: R * between(r, 0.35, 0.5) });
      }
      const pts = lobeOutline(cx, cy, lobes, 36);
      castShadow(g, shapeOf(pts.map(([px, py]) => [px + 6, py + 8] as Pt)), r, { alpha: 0.25 });
      const col = mixColor(pick(r, pal.leaves), "#10160c", r() * 0.15);
      solid(g, pts, col, r, { ink: 0, shadow: 0 });
      g.save();
      g.clip(pathOf(pts));
      g.fillStyle = tint(col, -0.22, 0.5);
      g.beginPath();
      g.ellipse(cx + R * 0.4, cy + R * 0.45, R * 0.8, R * 0.6, -0.6, 0, Math.PI * 2);
      g.fill();
      for (const l of lobes.slice(1)) {
        g.fillStyle = tint(col, 0.14, 0.35);
        g.beginPath();
        g.ellipse(l.x - l.rad * 0.25, l.y - l.rad * 0.3, l.rad * 0.5, l.rad * 0.35, -0.6, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      inkStroke(g, pts, r, { width: 1.2, closed: true, wobble: 0.5 });
    }
  }
}

// ——— Le genre dans les objets : clôtures, point d'eau, champs ———

/**
 * Clôture selon le genre, le long d'une ligne (px) : barrière de ranch au Far West, grillage sur poteaux en
 * science-fiction (son ombre dessine la maille), tôles de récupération après l'apocalypse. Renvoie false pour
 * la fantasy et le port, qui gardent leurs piquets.
 */
function genreFence(v: V, line: Pt[], r: Rng): boolean {
  const { g, pal } = v;
  const fl = v.flavor;
  if (fl === "fantasy" || fl === "port") return false;
  const pts = densify(line, 6);
  const shade = pts.map(([x, y]) => [x + 5, y + 7] as Pt);
  if (fl === "western") {
    // deux lisses de bois brut et des poteaux ronds tous les 0,5 case environ
    g.save();
    g.globalCompositeOperation = "multiply";
    inkPolyline(g, shade, r, { width: 3.4, color: "rgba(60,44,30,.4)", wobble: 0.4, taper: 0 });
    g.restore();
    for (const off of [-2.2, 2.2]) {
      const rail = pts.map(([x, y], k) => {
        const [ax, ay] = pts[Math.max(0, k - 1)];
        const [bx, by] = pts[Math.min(pts.length - 1, k + 1)];
        const l = Math.hypot(bx - ax, by - ay) || 1;
        return [x - ((by - ay) / l) * off, y + ((bx - ax) / l) * off] as Pt;
      });
      inkPolyline(g, rail, r, { width: 2.2, color: mixColor(pal.woodLight, pal.wood, 0.5), wobble: 0.5, taper: 0 });
      inkPolyline(g, rail.map(([x, y]) => [x + 0.6, y + 0.8] as Pt), r, { width: 0.6, color: "rgba(22,16,10,.7)", wobble: 0.4, taper: 0 });
    }
    let acc = 0;
    for (let k = 0; k < pts.length; k++) {
      if (k > 0) acc += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (k > 0 && k < pts.length - 1 && acc < 22) continue;
      acc = 0;
      disc(g, pts[k][0], pts[k][1], 2.8 + r() * 0.6, pal.woodDark, r, { ink: 0.8, shadow: 3.5 });
    }
    return true;
  }
  if (fl === "sf") {
    // l'ombre du grillage montre la maille ; la clôture vue d'en haut n'est qu'un fil et des poteaux
    g.save();
    g.lineCap = "round";
    g.strokeStyle = "rgba(20,24,28,.22)";
    g.lineWidth = 6;
    g.beginPath();
    shade.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    g.restore();
    strokes(g, "rgba(20,24,28,.4)", 0.5, (p) => {
      for (let k = 1; k < shade.length; k++) {
        const [ax, ay] = shade[k - 1];
        const [bx, by] = shade[k];
        p.moveTo(ax - 2, ay - 2);
        p.lineTo(bx + 2, by + 2);
        p.moveTo(ax - 2, ay + 2);
        p.lineTo(bx + 2, by - 2);
      }
    });
    inkPolyline(g, pts, r, { width: 1.3, color: mixColor(pal.metal, "#d8dcdc", 0.5), wobble: 0.2, taper: 0 });
    let acc = 0;
    for (let k = 0; k < pts.length; k++) {
      if (k > 0) acc += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (k > 0 && k < pts.length - 1 && acc < 24) continue;
      acc = 0;
      solid(g, rectPts(pts[k][0] - 2, pts[k][1] - 2, 4, 4), mixColor(pal.metal, "#2a3036", 0.2), r, { ink: 0.8, shadow: 4 });
    }
    return true;
  }
  // après l'apocalypse : tôles de longueurs inégales, posées de travers, rouille qui coule sous les rivets
  let s = 0;
  let j = 0;
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1];
    const [bx, by] = pts[k];
    s += Math.hypot(bx - ax, by - ay);
    if (s < 14 + r() * 14 && k < pts.length - 1) continue;
    s = 0;
    const [sx, sy] = pts[j];
    j = k;
    const sheet: Pt[] = [[sx + (r() - 0.5) * 2, sy + (r() - 0.5) * 2], [bx, by]];
    const col = r() < 0.5 ? mixColor(pal.metal, "#8a5a32", 0.4) : mixColor(pal.metal, "#6c7466", 0.3);
    inkPolyline(g, sheet.map(([x, y]) => [x + 5, y + 7] as Pt), r, { width: 4, color: "rgba(40,28,18,.3)", wobble: 0.3, taper: 0 });
    inkPolyline(g, sheet, r, { width: 3.6, color: col, wobble: 0.6, taper: 0 });
    inkPolyline(g, sheet.map(([x, y]) => [x + 1.2, y + 1.5] as Pt), r, { width: 0.7, color: "rgba(22,16,10,.75)", wobble: 0.4, taper: 0 });
    g.fillStyle = "rgba(150,72,26,.6)";
    g.fillRect((sx + bx) / 2 - 0.8, (sy + by) / 2 - 1, 1.6, 4 + r() * 5);
  }
  return true;
}

/**
 * Point d'eau du Far West : citerne de bois cerclée sur pilotis (sa longue ombre montre les quatre pieds),
 * abreuvoir en planches où boivent les chevaux, et une barre d'attache à côté.
 */
function westernWater(v: V, cx: number, cy: number, r: Rng) {
  const { g, pal, S } = v;
  const R = S * 0.62;
  // ombre des pilotis et de la cuve, projetée loin (la citerne est haute)
  g.save();
  g.globalCompositeOperation = "multiply";
  g.fillStyle = "rgba(60,44,30,.38)";
  g.beginPath();
  g.ellipse(cx + 26, cy + 34, R, R * 0.92, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(60,44,30,.45)";
  g.lineWidth = 3;
  g.beginPath();
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.moveTo(cx + dx * R * 0.6, cy + dy * R * 0.6);
    g.lineTo(cx + dx * R * 0.6 + 26, cy + dy * R * 0.6 + 34);
  }
  g.stroke();
  g.restore();
  disc(g, cx, cy, R, mixColor(pal.wood, pal.woodLight, 0.25), r, { ink: 1.6, shadow: 0 });
  // douves du couvercle, cerclage de fer, trappe
  strokes(g, tint(pal.woodDark, 0, 0.7), 0.7, (p) => {
    for (let k = -R + 5; k < R; k += 5.5) {
      const h = Math.sqrt(Math.max(0, R * R - k * k)) - 1.5;
      p.moveTo(cx + k, cy - h);
      p.lineTo(cx + k, cy + h);
    }
  });
  g.strokeStyle = "#2a2622";
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(cx, cy, R - 2.5, 0, Math.PI * 2);
  g.stroke();
  solid(g, rectPts(cx - 6, cy - 6, 12, 12), pal.woodDark, r, { ink: 1, shadow: 1.5 });
  // abreuvoir : bac de planches, eau sombre avec un reflet
  const tx = cx - S * 1.6;
  const ty = cy + S * 0.55;
  solid(g, rectPts(tx, ty, S * 1.2, S * 0.42), pal.wood, r, { ink: 1.3, shadow: 4 });
  g.fillStyle = mixColor(pal.water, "#1a1612", 0.35);
  g.fillRect(tx + 3.5, ty + 3.5, S * 1.2 - 7, S * 0.42 - 7);
  g.fillStyle = "rgba(230,236,230,.4)";
  g.fillRect(tx + 8, ty + 6, S * 0.4, 1.4);
  // barre d'attache : deux poteaux et une traverse
  const hx = cx + S * 0.9;
  const hy = cy + S * 0.95;
  disc(g, hx, hy, 2.6, pal.woodDark, r, { ink: 0.8, shadow: 3 });
  disc(g, hx + S * 0.9, hy, 2.6, pal.woodDark, r, { ink: 0.8, shadow: 3 });
  inkLine(g, hx, hy, hx + S * 0.9, hy, r, { width: 2.4, color: pal.wood, taper: 0 });
  inkLine(g, hx, hy + 1.3, hx + S * 0.9, hy + 1.3, r, { width: 0.6, color: "rgba(22,16,10,.8)", taper: 0 });
}

/** Casier à homards : cage de lattes, une bouée de liège attachée. */
function lobsterPot(v: V, x: number, y: number, r: Rng, rot: number) {
  const { g, pal } = v;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  solid(g, rectPts(-9, -6, 18, 12), mixColor(pal.woodLight, pal.wood, 0.3), r, { ink: 1, shadow: 3 });
  strokes(g, tint(pal.woodDark, 0, 0.8), 0.8, (p) => {
    for (const k of [-5, 0, 5]) {
      p.moveTo(k, -6);
      p.lineTo(k, 6);
    }
    p.moveTo(-9, 0);
    p.lineTo(9, 0);
  });
  g.restore();
  disc(g, x + 12, y + 4, 2.4, "#c9a35e", r, { ink: 0.6, shadow: 1, light: false });
}

/** Champ de panneaux solaires : rangs de modules sombres à cellules, cadre clair, un boîtier. */
function solarField(v: V, sh: Shape, r: Rng) {
  const { g, pal } = v;
  const [bx, by, bw, bh] = sh.box;
  g.save();
  g.clip(sh.path);
  g.fillStyle = mixColor(pal.dirt, "#9a9c90", 0.4);
  g.fill(sh.path);
  const cell = mixColor("#24344a", pal.metal, 0.2);
  for (let y = by + 6; y < by + bh - 10; y += 22) {
    for (let x = bx + 6; x < bx + bw - 14; x += 30) {
      if (r() < 0.06) continue;
      const panel = rectPts(x, y, 26, 14);
      solid(g, panel, tint(cell, (r() - 0.5) * 0.12), r, { ink: 1, shadow: 5 });
      strokes(g, "rgba(180,200,215,.45)", 0.5, (p) => {
        for (let k = 1; k < 4; k++) {
          p.moveTo(x + k * 6.5, y + 1);
          p.lineTo(x + k * 6.5, y + 13);
        }
        p.moveTo(x + 1, y + 7);
        p.lineTo(x + 25, y + 7);
      });
      // reflet du ciel sur le verre
      g.fillStyle = "rgba(220,235,245,.18)";
      g.fill(pathOf([[x + 2, y + 2], [x + 12, y + 2], [x + 6, y + 12], [x + 2, y + 12]]));
    }
  }
  g.restore();
  solid(g, rectPts(bx + bw - 16, by + bh - 14, 10, 8), mixColor(pal.metal, "#c8c4b8", 0.4), r, { ink: 1, shadow: 3 });
  g.fillStyle = "#e0b040";
  g.fillRect(bx + bw - 13, by + bh - 12, 2, 2);
}

/** Enclos de ranch : terre battue, piétinée en rond, barrière de lisses tout autour. */
function corral(v: V, sh: Shape, r: Rng) {
  const { g, pal } = v;
  washFill(g, sh, mixColor(pal.dirt, pal.mud, 0.15), r, { alpha: 0.9, edge: 5, variation: 0.8, blot: 40, granulation: 0.8 });
  const [bx, by, bw, bh] = sh.box;
  g.save();
  g.clip(sh.path);
  strokes(g, tint(pal.mud, -0.1, 0.4), 0.8, (p) => {
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9;
      const rx = bw / 2.6 - k * 1.5;
      const ry = bh / 2.6 - k * 1.2;
      p.moveTo(bx + bw / 2 + rx * Math.cos(a), by + bh / 2 + ry * Math.sin(a));
      p.ellipse(bx + bw / 2, by + bh / 2, rx, ry, 0, a, a + 2.2 + r());
    }
  });
  g.restore();
  const ring = rectPts(bx + 3, by + 3, bw - 6, bh - 6);
  genreFence(v, [...ring, ring[0]], r);
}

/** Filets qui sèchent sur des perches en travers d'un pré, casiers empilés au pied. */
function netField(v: V, sh: Shape, r: Rng) {
  const { g, pal } = v;
  const [bx, by, bw, bh] = sh.box;
  for (let y = by + 12; y < by + bh - 10; y += 34) {
    const poles: Pt[] = [];
    for (let x = bx + 8; x < bx + bw - 4; x += 40 + r() * 10) poles.push([x, y + (r() - 0.5) * 4]);
    for (let k = 1; k < poles.length; k++) {
      const [ax, ay] = poles[k - 1];
      const [qx, qy] = poles[k];
      if (r() < 0.2) continue;
      fishingNet(v, [[ax, ay - 2], [(ax + qx) / 2, ay + 2], [qx, qy - 2], [qx - 3, qy + 13], [(ax + qx) / 2, qy + 17], [ax + 3, ay + 13]], r);
    }
    for (const [x, py] of poles) disc(g, x, py, 2.4, pal.woodDark, r, { ink: 0.8, shadow: 5 });
  }
  lobsterPot(v, bx + bw - 14, by + bh - 12, r, r() - 0.5);
  lobsterPot(v, bx + bw - 34, by + bh - 10, r, r() - 0.5);
}

/** Carcasse de voiture vue d'en haut : tôle rouillée, pare-brise crevé, plus de roues. */
function carWreck(v: V, cx: number, cy: number, a: number, r: Rng) {
  const { g, pal } = v;
  g.save();
  g.translate(cx, cy);
  g.rotate(a);
  const body = smoothPoints(rectPts(-26, -12, 52, 24), 1);
  solid(g, body, mixColor(pal.metal, "#7a4a2a", 0.45), r, { ink: 1.5, shadow: 6 });
  g.fillStyle = "#1a1612";
  g.fill(pathOf([[-4, -9], [6, -10], [6, 10], [-4, 9]]));
  g.fillStyle = "rgba(200,210,210,.35)";
  g.fill(pathOf([[-3, -8], [2, -8.5], [-1, 0]]));
  g.fillStyle = mixColor(pal.metal, "#8a5a32", 0.3);
  g.fillRect(8, -10, 14, 20);
  strokes(g, "rgba(22,16,10,.7)", 0.7, (p) => {
    p.moveTo(-16, -12);
    p.lineTo(-16, 12);
    p.moveTo(8, -12);
    p.lineTo(8, 12);
  });
  for (let k = 0; k < 4; k++) {
    const x = -20 + r() * 40;
    const gr = g.createLinearGradient(x, -12, x, 4);
    gr.addColorStop(0, "rgba(150,72,26,.6)");
    gr.addColorStop(1, "rgba(150,72,26,0)");
    g.fillStyle = gr;
    g.fillRect(x, -12, 2, 16);
  }
  g.restore();
}
