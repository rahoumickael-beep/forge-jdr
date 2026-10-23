// Cartes d'extérieur (nature, village) : herbe, chemins de terre et eau aux contours organiques.
// Les cases restent la règle du jeu ; seules les formes dessinées s'affranchissent de la grille.
import type { MapTheme } from "../../shared/genres";
import { T, type GameMap } from "../../shared/types";
import { BASE, hash, shade } from "./mapUtil";
import { INK, blobPoints, canvas, cellContour, inkOutline, inkPolyline, jitterPoints, mixColor, noise2, rng, shapeOf, smoothPoints, stipple, tint, type Pt, type Rng, type Shape } from "./mapInk";

const S = BASE;

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Cases d'intérieur : celles qu'on n'atteint pas depuis le bord sans franchir un mur ou une porte. */
export function indoorCells(map: GameMap): Uint8Array {
  const { width: W, height: H, tiles } = map;
  const outside = new Uint8Array(W * H);
  const stack: number[] = [];
  const passable = (i: number) => tiles[i] !== T.mur && tiles[i] !== T.porte && tiles[i] !== T.vide;
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || !passable(i)) continue;
    outside[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  const indoor = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) indoor[i] = !outside[i] && tiles[i] !== T.mur && tiles[i] !== T.vide ? 1 : 0;
  return indoor;
}

/**
 * Masque lissé : une case par pixel, agrandi, flouté, bruité puis seuillé.
 * Donne des rives et des chemins aux bords naturels qui suivent quand même les cases.
 */
function organicMask(map: GameMap, pick: (t: number, i: number) => boolean, blurCells: number, wobble: number, seed: number): HTMLCanvasElement {
  const { width: W, height: H } = map;
  const small = document.createElement("canvas");
  small.width = W;
  small.height = H;
  const sg = small.getContext("2d")!;
  const img = sg.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    if (!pick(map.tiles[i], i)) continue;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = 255;
  }
  sg.putImageData(img, 0, 0);

  const big = document.createElement("canvas");
  big.width = W * S;
  big.height = H * S;
  const bg = big.getContext("2d", { willReadFrequently: true })!;
  bg.imageSmoothingEnabled = true;
  bg.filter = `blur(${blurCells * S}px)`;
  bg.drawImage(small, 0, 0, big.width, big.height);
  bg.filter = "none";

  // Bruit à basse résolution (une valeur par demi-case), interpolé, pour casser les courbes trop régulières.
  const NW = W * 2 + 2;
  const NH = H * 2 + 2;
  const noise = new Float32Array(NW * NH);
  for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) noise[y * NW + x] = hash(x, y, seed) - 0.5;
  const data = bg.getImageData(0, 0, big.width, big.height);
  const d = data.data;
  const q = S / 2;
  for (let py = 0; py < big.height; py++) {
    const fy = py / q;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    for (let px = 0; px < big.width; px++) {
      const fx = px / q;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const n00 = noise[y0 * NW + x0];
      const n10 = noise[y0 * NW + x0 + 1];
      const n01 = noise[(y0 + 1) * NW + x0];
      const n11 = noise[(y0 + 1) * NW + x0 + 1];
      const n = (n00 * (1 - tx) + n10 * tx) * (1 - ty) + (n01 * (1 - tx) + n11 * tx) * ty;
      const k = (py * big.width + px) * 4 + 3;
      const v = d[k] + n * wobble;
      d[k] = Math.max(0, Math.min(255, (v - 120) * 6));
    }
  }
  bg.putImageData(data, 0, 0);
  return big;
}

/** Remplit un calque avec `paint`, puis ne garde que la forme du masque. */
function layer(w: number, h: number, mask: HTMLCanvasElement, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  paint(g);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(mask, 0, 0);
  return cv;
}

export function paintOutdoorGround(g: CanvasRenderingContext2D, map: GameMap, theme: MapTheme, indoor: Uint8Array) {
  const W = map.width * S;
  const H = map.height * S;
  const grass = mix(theme.vegetation, theme.floor, 0.38);

  // Herbe : fond, grandes taches de lumière et d'ombre, touffes.
  g.fillStyle = grass;
  g.fillRect(0, 0, W, H);
  const blobs = Math.round((map.width * map.height) / 3);
  for (let i = 0; i < blobs; i++) {
    const x = hash(i, 1, map.seed) * W;
    const y = hash(i, 2, map.seed) * H;
    const r = S * (0.8 + hash(i, 3, map.seed) * 2.6);
    const light = hash(i, 4, map.seed) > 0.5;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, light ? shade(grass, 0.07, 0.5) : shade(grass, -0.08, 0.5));
    grad.addColorStop(1, light ? shade(grass, 0.07, 0) : shade(grass, -0.08, 0));
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.lineCap = "round";
  for (let cy = 0; cy < map.height; cy++)
    for (let cx = 0; cx < map.width; cx++) {
      for (let k = 0; k < 7; k++) {
        const h1 = hash(cx * 7 + k, cy, map.seed + 11);
        const h2 = hash(cx, cy * 7 + k, map.seed + 13);
        const x = cx * S + h1 * S;
        const y = cy * S + h2 * S;
        g.strokeStyle = h1 > 0.5 ? shade(grass, -0.14, 0.55) : shade(grass, 0.1, 0.5);
        g.lineWidth = 1.1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x - 2 + h2 * 4, y - 4 - h1 * 3);
        g.stroke();
      }
      // quelques fleurs et cailloux
      const f = hash(cx, cy, map.seed + 17);
      if (f > 0.93) {
        g.fillStyle = f > 0.97 ? "rgba(235,225,190,.8)" : "rgba(120,110,95,.55)";
        g.beginPath();
        g.arc(cx * S + hash(cy, cx, 3) * S, cy * S + hash(cx, cy, 5) * S, f > 0.97 ? 1.6 : 2.6, 0, Math.PI * 2);
        g.fill();
      }
    }

  // Chemins de terre battue, avec ornières et bord d'herbe plus sombre.
  const roadMask = organicMask(map, (t) => t === T.route, 0.45, 45, map.seed + 23);
  const dirt = mix(theme.road, theme.floor, 0.35);
  const edge = layer(W, H, roadMask, (lg) => {
    lg.fillStyle = shade(grass, -0.16, 0.8);
    lg.fillRect(0, 0, W, H);
  });
  g.drawImage(edge, 3, 4);
  g.drawImage(
    layer(W, H, roadMask, (lg) => {
      lg.fillStyle = dirt;
      lg.fillRect(0, 0, W, H);
      for (let i = 0; i < blobs * 2; i++) {
        const x = hash(i, 5, map.seed) * W;
        const y = hash(i, 6, map.seed) * H;
        const r = 2 + hash(i, 7, map.seed) * 7;
        lg.fillStyle = hash(i, 8, map.seed) > 0.5 ? shade(dirt, -0.09, 0.6) : shade(dirt, 0.07, 0.6);
        lg.beginPath();
        lg.ellipse(x, y, r, r * 0.6, hash(i, 9, map.seed) * 3, 0, Math.PI * 2);
        lg.fill();
      }
    }),
    0,
    0,
  );

  // Intérieurs (maisons) : rendus par le code des sols habituels, on vide simplement l'herbe dessous.
  g.fillStyle = theme.floor;
  for (let i = 0; i < indoor.length; i++) if (indoor[i]) g.fillRect((i % map.width) * S, Math.floor(i / map.width) * S, S, S);
}

export function paintOutdoorWater(g: CanvasRenderingContext2D, map: GameMap, theme: MapTheme, time = 0) {
  if (!map.tiles.includes(T.eau)) return;
  const W = map.width * S;
  const H = map.height * S;
  const shore = organicMask(map, (t) => t === T.eau, 0.55, 55, map.seed + 31);
  const deep = organicMask(map, (t) => t === T.eau, 1.4, 22, map.seed + 37);
  const water = theme.water;

  // Berge humide et sombre, un peu plus large que l'eau.
  const bank = document.createElement("canvas");
  bank.width = W;
  bank.height = H;
  const kg = bank.getContext("2d")!;
  kg.filter = `blur(${S * 0.18}px)`;
  kg.drawImage(shore, 0, 0);
  kg.filter = "none";
  kg.globalCompositeOperation = "source-in";
  kg.fillStyle = "rgba(40,34,22,.55)";
  kg.fillRect(0, 0, W, H);
  g.drawImage(bank, 0, 0);

  // Eau peu profonde, puis eau profonde au centre, reflets.
  g.drawImage(
    layer(W, H, shore, (lg) => {
      lg.fillStyle = shade(water, 0.08);
      lg.fillRect(0, 0, W, H);
    }),
    0,
    0,
  );
  g.drawImage(
    layer(W, H, deep, (lg) => {
      lg.fillStyle = shade(water, -0.1);
      lg.fillRect(0, 0, W, H);
      lg.strokeStyle = shade(water, 0.12, 0.45);
      lg.lineWidth = 1.2;
      const n = Math.round((map.width * map.height) / 2);
      for (let i = 0; i < n; i++) {
        const x = hash(i, 41, map.seed) * W;
        const y = hash(i, 43, map.seed) * H + time;
        const w = 8 + hash(i, 47, map.seed) * 16;
        lg.beginPath();
        lg.moveTo(x, y);
        lg.quadraticCurveTo(x + w / 2, y - 3, x + w, y);
        lg.stroke();
      }
    }),
    0,
    0,
  );

  // Liseré d'écume et trait d'encre sur la rive.
  const rim = document.createElement("canvas");
  rim.width = W;
  rim.height = H;
  const rg = rim.getContext("2d")!;
  rg.drawImage(shore, 0, 0);
  rg.globalCompositeOperation = "destination-out";
  rg.drawImage(shore, 0, 2.5);
  rg.drawImage(shore, 2.5, 0);
  rg.drawImage(shore, 0, -2.5);
  rg.drawImage(shore, -2.5, 0);
  rg.globalCompositeOperation = "source-in";
  rg.fillStyle = "rgba(25,22,16,.75)";
  rg.fillRect(0, 0, W, H);
  g.drawImage(rim, 0, 0);
  const foam = document.createElement("canvas");
  foam.width = W;
  foam.height = H;
  const fg = foam.getContext("2d")!;
  fg.drawImage(shore, 0, 0);
  fg.globalCompositeOperation = "destination-out";
  fg.drawImage(shore, 0, 6);
  fg.drawImage(shore, 6, 0);
  fg.drawImage(shore, 0, -6);
  fg.drawImage(shore, -6, 0);
  fg.globalCompositeOperation = "source-in";
  fg.fillStyle = "rgba(235,240,230,.32)";
  fg.fillRect(0, 0, W, H);
  g.drawImage(foam, 0, 0);

  // Roseaux sur les rives des marais.
  g.lineCap = "round";
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y * map.width + x] !== T.eau) continue;
      let land = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const t = map.tiles[(y + dy) * map.width + x + dx];
        if (t !== undefined && t !== T.eau) land = true;
      }
      if (!land || hash(x, y, map.seed + 51) < 0.55) continue;
      const bx = x * S + hash(x, y, 53) * S;
      const by = y * S + hash(y, x, 59) * S;
      for (let k = 0; k < 5; k++) {
        const h = hash(x * 5 + k, y, 61);
        g.strokeStyle = h > 0.5 ? shade(theme.vegetation, -0.1, 0.9) : shade(theme.vegetation, 0.08, 0.85);
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(bx + k * 2, by + 6);
        g.lineTo(bx + k * 2 + (h - 0.5) * 6, by - 8 - h * 8);
        g.stroke();
      }
    }
}

// ——— Contrée sauvage, façon planche encrée ———
// Sol en lavis, herbes à la plume, chemins de terre à ornières, eau aux rives encrées, ponts.
// Ces fonctions servent aux cartes de nature (mapNature) ; le village garde les précédentes.

/** Couleur ramenée d'environ `k` vers une sépia de même clarté (palette d'aquarelle, jamais d'aplat criard). */
export function muted(hex: string, k = 0.2): string {
  const [r, g, b] = hexToRgb(hex);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return mix(hex, `#${h(l * 1.08 + 6)}${h(l * 0.98 + 2)}${h(l * 0.8 - 2)}`, k);
}

/** Ce qu'il faut savoir d'une carte sauvage pour la dessiner, calculé une fois. */
export interface Wild {
  map: GameMap;
  theme: MapTheme;
  W: number;
  H: number;
  seed: number;
  /** Case en (x, y) ; hors carte, la case du bord la plus proche (les masses continuent au-delà du cadre). */
  tile: (x: number, y: number) => number;
  /** Cases de chemin posées sur l'eau : le pont passe là. */
  wet: Uint8Array;
  /** Distance en cases à la rive, pour chaque case d'eau (0 ailleurs). */
  waterDist: Uint8Array;
  /** Lignes médianes des chemins, en pixels, lissées. */
  routes: Pt[][];
  /** Morceaux des lignes médianes qui passent sur l'eau (tabliers de pont), prolongés jusqu'à la terre ferme. */
  bridges: Pt[][];
  /** Herbe : teinte de fond du lavis. */
  grass: string;
  /** Textures d'aquarelle partagées par tous les lavis de la carte (voir wildWash). */
  tex: HTMLCanvasElement[];
  /** Altitude lissée de chaque case (eau au fond, rochers au sommet) : talus, ombrage du sol. */
  elev: Float32Array;
  /** Ruisseaux de décor entre les étangs (lignes médianes en pixels). */
  streams: Pt[][];
  /** Forme de l'eau dessinée (rives déformées), une fois l'eau peinte : les reflets des arbres s'y découpent. */
  water?: Shape;
}

/**
 * Texture d'aquarelle à demi-résolution, gris neutre : taches de pigment plus claires ou plus sombres, grain du papier
 * où le pigment se dépose. Posée en « overlay » sur un aplat, elle le rend vivant ; calculée une fois par carte.
 */
function washTexture(PW: number, PH: number, seed: number, blot: number): HTMLCanvasElement {
  const cv = canvas(PW / 2, PH / 2);
  const c = cv.getContext("2d", { willReadFrequently: true })!;
  const w = cv.width;
  const h = cv.height;
  c.fillStyle = "rgb(128,128,128)";
  c.fillRect(0, 0, w, h);
  const r = rng(seed, 9);
  const b = blot / 2;
  const n = Math.ceil((w * h) / (b * b));
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = b * (0.5 + r() * 1.2);
    const k = 0.1 + r() * 0.16;
    const grad = c.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < 0.55 ? "0,0,0" : "255,255,255";
    grad.addColorStop(0, `rgba(${col},${k})`);
    grad.addColorStop(0.7, `rgba(${col},${k * 0.5})`);
    grad.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = grad;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // grain : quelques pixels plus sombres, plus nombreux par plaques
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const nz = noise2(seed + 3);
  const pw = (w >> 4) + 1;
  const plaque = new Float32Array(pw * ((h >> 4) + 1));
  for (let j = 0; j <= h >> 4; j++) for (let i = 0; i < pw; i++) plaque[j * pw + i] = Math.max(0, nz(i / 1.9, j / 1.9)) * 0.18;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = hash(x, y, seed);
      const k = (y * w + x) * 4;
      const dens = 0.1 + plaque[(y >> 4) * pw + (x >> 4)];
      const dv = v < dens ? -38 * (1 - v / dens) : (v - 0.5) * 10;
      d[k] += dv;
      d[k + 1] += dv;
      d[k + 2] += dv;
    }
  c.putImageData(img, 0, 0);
  return cv;
}

/**
 * Lavis rapide dans une forme : aplat, texture d'aquarelle partagée en « overlay », pigment accumulé au bord.
 * Avec `alpha` à 0 : seulement la texture, sur ce qui est déjà peint.
 */
export function wildWash(g: CanvasRenderingContext2D, shape: Shape, color: string, w: Wild, o: { alpha?: number; edge?: number; variation?: number; tex?: number } = {}) {
  const { alpha = 0.95, edge = 7, variation = 0.8, tex = 0 } = o;
  g.save();
  g.clip(shape.path, "nonzero");
  if (alpha > 0) {
    g.fillStyle = tint(color, 0, alpha);
    g.fill(shape.path, "nonzero");
  }
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = variation;
  g.drawImage(w.tex[tex % w.tex.length], 0, 0, w.W * S, w.H * S);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  if (edge > 0) {
    g.lineJoin = "round";
    for (const [lw, a] of [[edge * 2.2, 0.12], [edge, 0.16], [2.2, 0.4]] as const) {
      g.strokeStyle = tint(color, -0.3, a);
      g.lineWidth = lw;
      g.stroke(shape.path);
    }
  }
  g.restore();
}

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

/** Décale chaque point d'un contour sur sa normale d'au plus `amp` px (bruit lent + bruit fin), puis lisse. */
export function bendLoops(loops: Pt[][], seed: number, amp: number): Pt[][] {
  const nz = noise2(seed);
  return loops.map((loop) =>
    smoothPoints(
      loop.map(([x, y], i) => {
        const p = loop[(i + loop.length - 1) % loop.length];
        const q = loop[(i + 1) % loop.length];
        const tx = q[0] - p[0];
        const ty = q[1] - p[1];
        const l = Math.hypot(tx, ty) || 1;
        const d = (nz(x / 90, y / 90) * 0.7 + nz(x / 26 + 17, y / 26) * 0.3) * amp;
        return [x - (ty / l) * d, y + (tx / l) * d] as Pt;
      }),
      1,
    ),
  );
}

/** Distance (pas de 4-voisins, plafonnée à 12) de chaque case `inside` à la plus proche case dehors. Le hors-carte ne compte pas comme dehors. */
export function distField(inside: (x: number, y: number) => boolean, W: number, H: number): Uint8Array {
  const d = new Uint8Array(W * H);
  const q: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (inside(x, y)) d[y * W + x] = 12;
      else q.push(y * W + x);
    }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    const x = i % W;
    const y = (i - x) / W;
    for (const [dx, dy] of NB4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (d[j] > d[i] + 1) {
        d[j] = d[i] + 1;
        q.push(j);
      }
    }
  }
  return d;
}

/**
 * Isolignes d'un champ échantillonné sur une grille (carrés marchants), chaînées en polylignes, en pixels de la carte :
 * l'échantillon (x, y) est au centre du carré de `k` px qui lui correspond. Les lignes fermées reviennent à leur début.
 */
export function isolines(f: Float32Array, gw: number, gh: number, level: number, k: number): Pt[][] {
  const segs: [Pt, Pt][] = [];
  for (let y = 0; y < gh - 1; y++)
    for (let x = 0; x < gw - 1; x++) {
      const v = [f[y * gw + x], f[y * gw + x + 1], f[(y + 1) * gw + x + 1], f[(y + 1) * gw + x]];
      const above = (v[0] > level ? 1 : 0) | (v[1] > level ? 2 : 0) | (v[2] > level ? 4 : 0) | (v[3] > level ? 8 : 0);
      if (above === 0 || above === 15) continue;
      const c: Pt[] = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const pts: Pt[] = [];
      for (let e = 0; e < 4; e++) {
        const a = v[e] - level;
        const b = v[(e + 1) % 4] - level;
        if (a > 0 !== b > 0) {
          const t = a / (a - b);
          const p = c[e];
          const q = c[(e + 1) % 4];
          pts.push([(p[0] + (q[0] - p[0]) * t + 0.5) * k, (p[1] + (q[1] - p[1]) * t + 0.5) * k]);
        }
      }
      if (pts.length === 2) segs.push([pts[0], pts[1]]);
      else if (pts.length === 4) {
        segs.push([pts[0], pts[1]]);
        segs.push([pts[2], pts[3]]);
      }
    }
  const key = ([x, y]: Pt) => `${Math.round(x * 8)},${Math.round(y * 8)}`;
  const ends = new Map<string, number[]>();
  segs.forEach(([a, b], i) => {
    for (const p of [a, b]) {
      const kk = key(p);
      const l = ends.get(kk);
      if (l) l.push(i);
      else ends.set(kk, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const lines: Pt[][] = [];
  for (let s0 = 0; s0 < segs.length; s0++) {
    if (used[s0]) continue;
    used[s0] = 1;
    const line: Pt[] = [segs[s0][0], segs[s0][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const tip = dir > 0 ? line[line.length - 1] : line[0];
        const next = (ends.get(key(tip)) ?? []).find((i) => !used[i]);
        if (next === undefined) break;
        used[next] = 1;
        const [a, b] = segs[next];
        const far = key(a) === key(tip) ? b : a;
        if (dir > 0) line.push(far);
        else line.unshift(far);
      }
    }
    if (line.length >= 3) lines.push(line);
  }
  return lines;
}

/** Contour organique d'un ensemble de cases ; au bord de la carte la masse continue hors cadre (pas de trait le long du bord). */
export function wildContour(
  inside: (x: number, y: number) => boolean,
  W: number,
  H: number,
  opts: { smooth?: number; jitter?: number; round?: number; seed?: number } = {},
): Pt[][] {
  const cl = (v: number, n: number) => Math.max(0, Math.min(n - 1, v));
  const loops = cellContour((x, y) => inside(cl(x - 2, W), cl(y - 2, H)), W + 4, H + 4, S, opts);
  return loops.map((l) => l.map(([x, y]) => [x - 2 * S, y - 2 * S] as Pt));
}

/**
 * Lignes médianes des chemins (indices de cases), sans boucles parasites : pour chaque morceau de chemin,
 * le plus long trajet d'un bout à l'autre, puis les embranchements d'au moins 6 cases qui s'y raccrochent.
 */
function traceRoutes(map: GameMap): number[][] {
  const { width: W, height: H, tiles } = map;
  const isR = (i: number) => tiles[i] === T.route;
  const nbs = (i: number) => {
    const x = i % W;
    const out: number[] = [];
    if (x < W - 1 && isR(i + 1)) out.push(i + 1);
    if (x > 0 && isR(i - 1)) out.push(i - 1);
    if (i + W < W * H && isR(i + W)) out.push(i + W);
    if (i - W >= 0 && isR(i - W)) out.push(i - W);
    return out;
  };
  const dist = new Int32Array(W * H);
  const prev = new Int32Array(W * H);
  /** Parcours en largeur depuis `src` ; renvoie la case atteinte la plus loin (hors `skip`) et les cases vues. */
  const bfs = (src: number[], skip?: Uint8Array) => {
    const seen: number[] = [];
    for (const s of src) {
      dist[s] = 0;
      prev[s] = -1;
    }
    const q = [...src];
    const mark = new Set(src);
    let far = src[0];
    let fd = -1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      seen.push(i);
      if ((!skip || !skip[i]) && dist[i] > fd) {
        fd = dist[i];
        far = i;
      }
      for (const j of nbs(i)) {
        if (mark.has(j)) continue;
        mark.add(j);
        dist[j] = dist[i] + 1;
        prev[j] = i;
        q.push(j);
      }
    }
    return { far, fd, seen };
  };
  const back = (i: number) => {
    const line: number[] = [];
    for (let k = i; k >= 0; k = prev[k]) line.push(k);
    return line;
  };
  const done = new Uint8Array(W * H);
  const onLine = new Uint8Array(W * H);
  const lines: number[][] = [];
  for (let s = 0; s < W * H; s++) {
    if (!isR(s) || done[s]) continue;
    const first = bfs([s]);
    for (const i of first.seen) done[i] = 1;
    const a = first.far;
    const main = back(bfs([a]).far);
    for (const i of main) onLine[i] = 1;
    if (main.length > 1) lines.push(main);
    for (let guard = 0; guard < 64; guard++) {
      const src = first.seen.filter((i) => onLine[i]);
      const res = bfs(src, onLine);
      if (res.fd < 6) break; // un bout de chemin plus court ne mène nulle part : pas d'ornières dessus
      const branch = back(res.far);
      for (const i of branch) onLine[i] = 1;
      lines.push(branch);
    }
  }
  return lines;
}

export function wildOf(map: GameMap, theme: MapTheme): Wild {
  const { width: W, height: H, tiles, seed } = map;
  const cl = (v: number, n: number) => Math.max(0, Math.min(n - 1, v));
  const tile = (x: number, y: number) => tiles[cl(y, H) * W + cl(x, W)];
  // Chemin sur l'eau : de l'eau des deux côtés, ou au moins 4 cases d'eau autour.
  const wet = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (tiles[y * W + x] !== T.route) continue;
      const w = (dx: number, dy: number) => tile(x + dx, y + dy) === T.eau;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && w(dx, dy)) n++;
      if ((w(0, -1) && w(0, 1)) || (w(-1, 0) && w(1, 0)) || n >= 4) wet[y * W + x] = 1;
    }
  // Une case de chemin coincée entre deux cases de pont est sur le pont aussi.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tiles[i] !== T.route || wet[i]) continue;
      let k = 0;
      for (const [dx, dy] of NB4) if (x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H && wet[(y + dy) * W + x + dx] === 1) k++;
      if (k >= 2) wet[i] = 2;
    }
  const waterDist = distField((x, y) => tiles[y * W + x] === T.eau || wet[y * W + x] > 0, W, H);
  for (let i = 0; i < W * H; i++) if (tiles[i] !== T.eau) waterDist[i] = 0;

  const routes: Pt[][] = [];
  const bridges: Pt[][] = [];
  const isWet = ([x, y]: Pt) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    return cx >= 0 && cy >= 0 && cx < W && cy < H && wet[cy * W + cx] > 0;
  };
  /** Point au-dessus de l'eau (case d'eau ou de pont) : le tablier doit le couvrir. */
  const overWater = ([x, y]: Pt) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    return cx >= 0 && cy >= 0 && cx < W && cy < H && (wet[cy * W + cx] > 0 || tiles[cy * W + cx] === T.eau);
  };
  for (const line of traceRoutes(map)) {
    let pts: Pt[] = line.map((i) => [((i % W) + 0.5) * S, (Math.floor(i / W) + 0.5) * S] as Pt);
    const ext = (p: Pt, q: Pt): Pt => [p[0] + (p[0] - q[0]) * 2, p[1] + (p[1] - q[1]) * 2];
    const onEdge = ([x, y]: Pt) => x < S || y < S || x > (W - 1) * S || y > (H - 1) * S;
    if (pts.length > 1 && onEdge(pts[0])) pts.unshift(ext(pts[0], pts[1]));
    if (pts.length > 1 && onEdge(pts[pts.length - 1])) pts.push(ext(pts[pts.length - 1], pts[pts.length - 2]));
    for (let pass = 0; pass < 2; pass++)
      pts = pts.map((p, i) => {
        if (i === 0 || i === pts.length - 1) return p;
        const k = Math.min(2, i, pts.length - 1 - i);
        let sx = 0;
        let sy = 0;
        for (let j = -k; j <= k; j++) {
          sx += pts[i + j][0];
          sy += pts[i + j][1];
        }
        return [sx / (2 * k + 1), sy / (2 * k + 1)] as Pt;
      });
    pts = smoothPoints(pts, 3, false);
    pts = jitterPoints(pts, 3, seed + 211, 1 / 60);
    routes.push(pts);
    // Tabliers : points dont la case est mouillée, prolongés tant qu'on est au-dessus de l'eau, puis d'un bout de berge.
    let a = -1;
    for (let i = 0; i <= pts.length; i++) {
      const wetHere = i < pts.length && isWet(pts[i]);
      if (wetHere && a < 0) a = i;
      if (!wetHere && a >= 0) {
        let lo = a;
        let hi = i;
        while (lo > 0 && overWater(pts[lo - 1])) lo--;
        while (hi < pts.length && overWater(pts[hi])) hi++;
        bridges.push(pts.slice(Math.max(0, lo - 5), Math.min(pts.length, hi + 5)));
        a = -1;
        i = hi;
      }
    }
  }
  // olive éteint : désaturé et assombri d'un bon dixième (la contrée est sauvage, pas un jardin)
  // herbe vivante : un vert de pré franc, tiré vers le jaune au soleil, seulement un peu éteint
  const grass = mixColor(muted(mixColor(mixColor(theme.vegetation, theme.floor, 0.3), "#b3a983", 0.12), 0.18), "#6f8f3a", 0.3);
  // une seule texture calculée ; la seconde en est le reflet retourné (les taches ne tombent plus au même endroit)
  const t0 = washTexture(W * S, H * S, seed + 301, 80);
  const t1 = canvas(t0.width, t0.height);
  const c1 = t1.getContext("2d")!;
  c1.translate(t0.width, t0.height);
  c1.scale(-1, -1);
  c1.drawImage(t0, 0, 0);
  const elev = elevationOf(map);
  const streams = streamsOf(map, elev);
  return { map, theme, W, H, seed, tile, wet, waterDist, routes, bridges, grass, tex: [t0, t1], elev, streams };
}

/**
 * Petite touffe d'herbe à la plume, tirée à la graine : 3 à 9 brins d'un même pied, chacun sa longueur, son écart, sa
 * courbure (certains ploient, d'autres restent droits), penchés ensemble de `lean` ; épi au bout de certains.
 */
function tuft(p: Path2D, r: Rng, x: number, y: number, len: number, lean = (r() - 0.5) * 0.8, heads?: Path2D) {
  const n = 3 + Math.floor(r() * r() * 7);
  const fan = 0.15 + r() * 0.4;
  const asym = (r() - 0.5) * 0.5;
  for (let k = 0; k < n; k++) {
    const u = n > 1 ? k / (n - 1) - 0.5 : 0;
    const a = -Math.PI / 2 + lean + u * (fan * n * 0.45) + asym * u * u + (r() - 0.5) * 0.25;
    // les brins du milieu sont les plus longs
    const l = len * (0.45 + r() * 0.5 + (0.5 - Math.abs(u)) * 0.4);
    const bend = (r() - 0.5) * 0.9 + lean * 0.6;
    const bx = x + u * (1 + r() * 2.2);
    const ex = bx + Math.cos(a + bend * 0.5) * l;
    const ey = y + Math.sin(a + bend * 0.5) * l;
    p.moveTo(bx, y);
    p.quadraticCurveTo(bx + Math.cos(a) * l * 0.55, y + Math.sin(a) * l * 0.55, ex, ey);
    if (heads && r() < 0.4) {
      heads.moveTo(ex + 1, ey);
      heads.arc(ex, ey, 0.7 + r() * 0.6, 0, Math.PI * 2);
    }
  }
}

/** Herbes hautes : trois à sept longs brins en « v » ouvert qui ploient du côté du vent (`lean`) ; épis sur certains. */
function tallBlades(p: Path2D, r: Rng, x: number, y: number, len: number, lean = (r() - 0.5) * 0.9, heads?: Path2D) {
  const n = 3 + Math.floor(r() * 5);
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + lean + (k - (n - 1) / 2) * (0.18 + r() * 0.18);
    const l = len * (0.55 + r() * 0.55);
    const bx = x + (k - (n - 1) / 2) * 0.8;
    const b = a + lean * 0.5;
    const ex = bx + Math.cos(b) * l;
    const ey = y + Math.sin(b) * l;
    p.moveTo(bx, y);
    p.quadraticCurveTo(bx + Math.cos(a) * l * 0.4, y + Math.sin(a) * l * 0.6, ex, ey);
    if (heads && r() < 0.18) {
      heads.moveTo(ex + 1, ey);
      heads.ellipse(ex, ey, 1, 2.2, b + Math.PI / 2, 0, Math.PI * 2);
    }
  }
}

/** Petit caillou lavé, ombre et trait d'encre. */
export function pebble(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number, stone: string) {
  const pts = blobPoints(r, x, y, s, s * 0.75, 7, 0.25);
  g.fillStyle = "rgba(20,14,8,.42)";
  g.fill(shapeOf(pts.map(([a, b]) => [a + s * 0.45, b + s * 0.6] as Pt)).path);
  g.fillStyle = tint(stone, (r() - 0.3) * 0.12);
  g.fill(shapeOf(pts).path);
  g.fillStyle = tint(stone, 0.14, 0.8);
  g.beginPath();
  g.ellipse(x - s * 0.25, y - s * 0.25, s * 0.4, s * 0.28, -0.6, 0, Math.PI * 2);
  g.fill();
  inkPolyline(g, pts, r, { width: Math.min(1.1, 0.5 + s * 0.12), closed: true, wobble: 0.25 });
}

/**
 * Sol de la contrée : lavis d'herbe à grandes zones sèches ou grasses, ombré par le relief (pentes tournées vers la
 * lumière plus claires), puis des zones peintes à part, à bord net : herbes hautes couleur paille, plaques de terre nue,
 * boue au bord de l'eau. Herbes à la plume couchées par le vent (jamais deux touffes pareilles), fleurs en colonies,
 * cailloux, talus hachurés. `reserved` : cases des lieux dessinés.
 */
export function paintWildGround(g: CanvasRenderingContext2D, w: Wild, reserved?: Uint8Array) {
  const { map, W, H, seed, grass, elev } = w;
  const PW = W * S;
  const PH = H * S;

  // Couleur de fond calculée à basse résolution (3 px par case), puis agrandie.
  const lo = canvas(W * 3, H * 3);
  const lg = lo.getContext("2d")!;
  const img = lg.createImageData(lo.width, lo.height);
  const n1 = noise2(seed + 5);
  const n2 = noise2(seed + 9);
  const nv = noise2(seed + 11);
  const dryC = mixColor(grass, mixColor(w.theme.road, "#c9a964", 0.4), 0.5);
  const lush = mixColor(grass, mixColor(w.theme.vegetation, "#2e3f24", 0.3), 0.42);
  const rgbOf = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const warm = mixColor(lush, "#5d6a2e", 0.3);
  const [G, D, L, Wm] = [rgbOf(grass), rgbOf(dryC), rgbOf(lush), rgbOf(warm)];
  const wdist = distField((x, y) => map.tiles[y * W + x] !== T.eau, W, H);
  /** Altitude interpolée (en cases). */
  const E = (x: number, y: number) => {
    const fx = Math.max(0, Math.min(W - 1.001, x - 0.5));
    const fy = Math.max(0, Math.min(H - 1.001, y - 0.5));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const a = elev[j * W + i] + (elev[j * W + i + 1] - elev[j * W + i]) * tx;
    const b = elev[(j + 1) * W + i] + (elev[(j + 1) * W + i + 1] - elev[(j + 1) * W + i]) * tx;
    return a + (b - a) * ty;
  };
  for (let y = 0; y < lo.height; y++)
    for (let x = 0; x < lo.width; x++) {
      const a = n1(x / 14, y / 14) * 0.7 + n1(x / 5, y / 5) * 0.3;
      const b = n2(x / 9, y / 9);
      const cx = Math.min(W - 1, Math.floor(x / 3));
      const cy = Math.min(H - 1, Math.floor(y / 3));
      const wet = map.tiles[cy * W + cx] === T.eau ? 1 : Math.max(0, 1 - (wdist[cy * W + cx] - 1) / 3);
      // taches lentes à peine marquées : ce sont les zones peintes plus bas qui distinguent les sols
      const td = Math.max(0, a) * 0.28 * (1 - wet);
      const tl = Math.max(0, -a) * 0.2 + Math.max(0, b) * 0.06;
      const tw = wet * 0.45;
      // ombrage du relief : pente tournée vers le haut à gauche = éclairée
      const ux = (x + 0.5) / 3;
      const uy = (y + 0.5) / 3;
      const lit = (E(ux + 0.5, uy) - E(ux - 0.5, uy)) * 0.6 + (E(ux, uy + 0.5) - E(ux, uy - 0.5)) * 0.8;
      // et un lavis lent de ±8 % de valeur, qui casse l'aplat
      const k = (1 + Math.max(-0.2, Math.min(0.13, lit * 0.9))) * (1 + nv(x / 26, y / 26) * 0.06 + nv(x / 8 + 40, y / 8) * 0.025);
      const o = (y * lo.width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let v = G[c] + (D[c] - G[c]) * td + (L[c] - G[c]) * tl;
        v += (Wm[c] - v) * tw;
        img.data[o + c] = v * k;
      }
      img.data[o + 3] = 255;
    }
  lg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(lo, 0, 0, PW, PH);
  g.save();
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.3;
  g.drawImage(w.tex[1], 0, 0, PW, PH);
  g.restore();

  const free = (x: number, y: number) => map.tiles[y * W + x] === T.sol;
  const near = (x: number, y: number, t: number, rad: number) => {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (w.tile(x + dx, y + dy) === t) return true;
    return false;
  };

  // Zones peintes : herbes hautes (plus fréquentes le long des bois et des rives) et terre nue (loin de l'eau et des
  // bois). Elles ne suivent pas les cases : deux champs de bruit continus, calculés à 1/6 de la résolution, seuillés
  // en douceur puis agrandis ; le pigment s'accumule au bord du lavis, et la terre nue est cernée d'un trait d'encre
  // interrompu (le rebord de la motte), sur un tiers de son tour environ.
  const nt = noise2(seed + 15);
  const nb = noise2(seed + 16);
  const ne = noise2(seed + 20);
  const vd = distField((x, y) => map.tiles[y * W + x] !== T.vegetation, W, H);
  const okCell = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) okCell[i] = map.tiles[i] === T.sol && !reserved?.[i] ? 1 : 0;
  /** Valeur bilinéaire d'un tableau par case, au point (u, v) en cases. */
  const bil = (a: ArrayLike<number>, u: number, v: number) => {
    const fx = Math.max(0, Math.min(W - 1.001, u - 0.5));
    const fy = Math.max(0, Math.min(H - 1.001, v - 0.5));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const p = a[j * W + i] + (a[j * W + i + 1] - a[j * W + i]) * tx;
    const q = a[(j + 1) * W + i] + (a[(j + 1) * W + i + 1] - a[(j + 1) * W + i]) * tx;
    return p + (q - p) * ty;
  };
  const wdc = new Float32Array(W * H);
  const vdc = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    wdc[i] = Math.min(5, wdist[i]);
    vdc[i] = Math.min(5, vd[i]);
  }
  const zk = 6;
  const zw = Math.ceil(PW / zk);
  const zh = Math.ceil(PH / zk);
  const fTall = new Float32Array(zw * zh);
  const fBare = new Float32Array(zw * zh);
  const TH_TALL = 0.3;
  const TH_BARE = 0.36;
  for (let y = 0; y < zh; y++)
    for (let x = 0; x < zw; x++) {
      const u = ((x + 0.5) * zk) / S;
      const v = ((y + 0.5) * zk) / S;
      const nearV = Math.max(0, 1 - (bil(vdc, u, v) - 1) / 2.5);
      const nearW = Math.max(0, 1 - (bil(wdc, u, v) - 1) / 3);
      const b = nb(u / 4.5 + 30, v / 4.5) + nb(u / 1.6, v / 1.6 + 9) * 0.22 - nearV * 0.7 - nearW * 0.9;
      const t = nt(u / 5.5, v / 5.5) + nt(u / 1.8 + 11, v / 1.8) * 0.2 + nearV * 0.35 + nearW * 0.3 - Math.max(0, b - 0.15) * 1.5;
      const m = bil(okCell, u, v);
      // hors de la prairie, le champ retombe : les zones s'arrêtent avant les chemins, l'eau et les bois
      fBare[y * zw + x] = b - (1 - m) * 1.2;
      fTall[y * zw + x] = t - (1 - m) * 1.2;
    }
  const zone = new Uint8Array(W * H); // 1 herbes hautes, 2 terre nue
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!free(x, y) || reserved?.[y * W + x]) continue;
      const j = Math.min(zh - 1, Math.floor(((y + 0.5) * S) / zk)) * zw + Math.min(zw - 1, Math.floor(((x + 0.5) * S) / zk));
      if (fBare[j] > TH_BARE) zone[y * W + x] = 2;
      else if (fTall[j] > TH_TALL) zone[y * W + x] = 1;
    }
  const straw = mixColor(mixColor(grass, "#c9b46a", 0.45), w.theme.vegetation, 0.12);
  // herbes hautes : plus sombres que la prairie rase (l'ombre reste entre les tiges)
  const tallC = mixColor(mixColor(grass, w.theme.vegetation, 0.35), "#23261a", 0.22);
  const bare = mixColor(mixColor(w.theme.road, w.theme.floor, 0.4), "#8f6e48", 0.4);
  {
    const cv = canvas(zw, zh);
    const q = cv.getContext("2d")!;
    const img = q.createImageData(zw, zh);
    const [tr, tg, tb] = hexToRgb(tallC);
    const [br, bg, bb] = hexToRgb(bare);
    const [er, eg, eb] = hexToRgb(mixColor(bare, "#3a2a18", 0.45));
    for (let i = 0; i < zw * zh; i++) {
      const b = fBare[i] - TH_BARE;
      const t = fTall[i] - TH_TALL;
      let a = 0;
      let c: [number, number, number] = [0, 0, 0];
      if (b > -0.05) {
        const s = smoothstep(-0.05, 0.05, b);
        // liseré : le pigment se dépose là où la flaque a fini de sécher
        const rim = Math.exp(-((b - 0.04) * (b - 0.04)) / 0.0012);
        a = s * 0.5 + rim * 0.22;
        const m = rim * 0.6;
        c = [br + (er - br) * m, bg + (eg - bg) * m, bb + (eb - bb) * m];
      } else if (t > -0.06) {
        const s = smoothstep(-0.06, 0.06, t);
        const rim = Math.exp(-((t - 0.05) * (t - 0.05)) / 0.002);
        a = s * 0.4 + rim * 0.08;
        c = [tr * (1 - rim * 0.15), tg * (1 - rim * 0.15), tb * (1 - rim * 0.15)];
      }
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = a * 255;
    }
    q.putImageData(img, 0, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.drawImage(cv, 0, 0, zw * zk, zh * zk);
    g.restore();
  }
  const bareLines = isolines(fBare, zw, zh, TH_BARE, zk);
  const tallLines = isolines(fTall, zw, zh, TH_TALL, zk);
  // la limite n'est pas un trait mais une frange de petits traits qui la chevauchent (brins, mottes)
  const fringe = new Path2D();
  const fringeOf = (lines: Pt[][], reach: number, sd: number) => {
    const fr = rng(seed, sd);
    for (const line of lines)
      for (let i = 0; i + 2 < line.length; i += 2) {
        const p = line[i];
        const q = line[i + 2];
        const dx = q[0] - p[0];
        const dy = q[1] - p[1];
        const l = Math.hypot(dx, dy) || 1;
        if (fr() < 0.35) continue;
        const o = (fr() - 0.35) * reach;
        const len = 2.5 + fr() * reach;
        const x = p[0] + (dy / l) * o;
        const y = p[1] - (dx / l) * o;
        const a = -Math.PI / 2 + (fr() - 0.5) * 0.9;
        fringe.moveTo(x, y);
        fringe.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (fr() - 0.5) * 2, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      }
  };
  fringeOf(tallLines, 7, 22);
  fringeOf(bareLines, 5, 23);
  // rebord de la terre nue : morceaux d'encre là où un bruit le long du bord le veut (un tiers du tour)
  {
    const er = rng(seed, 25);
    for (const line of bareLines) {
      let run: Pt[] = [];
      const flush = () => {
        if (run.length > 3) inkPolyline(g, run, er, { width: 0.9 + er() * 0.5, wobble: 0.3, taper: 8, pressure: 0.5, color: tint(mixColor(bare, INK, 0.7), 0, 0.75) });
        run = [];
      };
      for (const p of line) {
        if (ne(p[0] / S / 1.4, p[1] / S / 1.4) > 0.25) run.push(p);
        else flush();
      }
      flush();
    }
  }
  // terre nue : grain de petits traits, mottes pointillées, réseau de fentes sèches
  {
    const grit = new Path2D();
    const dots = new Path2D();
    for (let y = 0; y < zh; y += 2)
      for (let x = 0; x < zw; x += 2) {
        const b = fBare[y * zw + x] - TH_BARE;
        if (b < 0.02) continue;
        const rr = rng(seed, x, y, 26);
        const k = Math.round(rr() * (1 + Math.min(1, b * 4) * 2));
        for (let j = 0; j < k; j++) {
          const px = (x + rr() * 2) * zk;
          const py = (y + rr() * 2) * zk;
          if (rr() < 0.55) {
            const a = rr() * Math.PI;
            const l = 1.5 + rr() * 2.5;
            grit.moveTo(px, py);
            grit.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l * 0.6);
          } else {
            const s = 0.5 + rr() * 0.7;
            dots.moveTo(px + s, py);
            dots.arc(px, py, s, 0, Math.PI * 2);
          }
        }
      }
    g.lineCap = "round";
    g.strokeStyle = tint(mixColor(bare, INK, 0.55), 0, 0.5);
    g.lineWidth = 0.7;
    g.stroke(grit);
    g.fillStyle = tint(mixColor(bare, INK, 0.45), 0, 0.45);
    g.fill(dots);
  }

  // Herbes : le vent les couche dans un même sens par endroits (bruit lent) ; chaque touffe a son nombre de brins,
  // sa taille, son penchant ; certaines portent des épis.
  const ink = new Path2D();
  const inkTall = new Path2D();
  const light = new Path2D();
  const inkDeep = new Path2D();
  const dry = new Path2D();
  const heads = new Path2D();
  const crack = new Path2D();
  const n3 = noise2(seed + 13);
  const wind = noise2(seed + 14);
  for (let cy = 0; cy < H; cy++)
    for (let cx = 0; cx < W; cx++) {
      if (!free(cx, cy)) continue;
      const rr = rng(seed, cx, cy, 3);
      const z = zone[cy * W + cx];
      const dens = n3(cx / 4.5, cy / 4.5) * 0.75 + n3(cx / 1.7 + 30, cy / 1.7) * 0.25;
      const count = z === 1 ? 7 + Math.floor(rr() * 6) : z === 2 ? (rr() < 0.4 ? 1 : 0) : z === 3 ? 2 + Math.floor(rr() * 3) : dens < -0.55 ? 1 + Math.floor(rr() * 2) : Math.round((dens + 0.7) * 9 * rr() + 1 + rr() * 2);
      const hubs: Pt[] = Array.from({ length: 1 + Math.floor(rr() * 3) }, () => [(cx + 0.1 + rr() * 0.8) * S, (cy + 0.1 + rr() * 0.8) * S]);
      for (let k = 0; k < count; k++) {
        const [hx, hy] = hubs[k % hubs.length];
        const a = rr() * Math.PI * 2;
        const d = Math.sqrt(rr()) * S * (z === 1 ? 0.45 : 0.3);
        const x = hx + Math.cos(a) * d;
        const y = hy + Math.sin(a) * d;
        const lean = wind(x / 300, y / 300) * 0.9 + (rr() - 0.5) * 0.5;
        if (z === 1) tallBlades(rr() < 0.7 ? inkTall : light, rr, x, y, 11 + rr() * 11, lean, heads);
        else if (z === 3) tallBlades(inkTall, rr, x, y, 6 + rr() * 6, lean * 0.3);
        else {
          // quatre encres pour les touffes : olive sombre, olive, paille, verte et fraîche
          const c = rr();
          tuft(c < 0.3 ? ink : c < 0.45 ? light : c < 0.65 ? inkDeep : dry, rr, x, y, (3 + rr() * 6.5) * (0.7 + rr() * 0.6), lean, rr() < 0.18 ? heads : undefined);
        }
      }
      // terre nue : fentes de sécheresse
      if (z === 2 && rr() < 0.5) {
        let x = (cx + 0.2 + rr() * 0.6) * S;
        let y = (cy + 0.2 + rr() * 0.6) * S;
        let ang = rr() * Math.PI * 2;
        crack.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          ang += (rr() - 0.5) * 1.4;
          x += Math.cos(ang) * (3 + rr() * 5);
          y += Math.sin(ang) * (3 + rr() * 5);
          crack.lineTo(x, y);
        }
      }
    }
  g.lineCap = "round";
  g.lineWidth = 1.1;
  g.strokeStyle = tint(mixColor(grass, INK, 0.5), -0.02, 0.8);
  g.stroke(ink);
  g.lineWidth = 1.05;
  g.strokeStyle = tint(mixColor(straw, INK, 0.62), 0, 0.72);
  g.stroke(inkTall);
  g.lineWidth = 1;
  g.strokeStyle = tint(straw, 0.12, 0.65);
  g.stroke(light);
  g.lineWidth = 1;
  g.strokeStyle = tint(mixColor(grass, "#1c2410", 0.6), 0, 0.75);
  g.stroke(inkDeep);
  g.lineWidth = 1.1;
  g.strokeStyle = tint(mixColor(grass, "#a3c456", 0.6), 0.12, 0.9);
  g.stroke(dry);
  g.fillStyle = tint(mixColor(straw, "#e8d79a", 0.4), 0, 0.9);
  g.fill(heads);
  g.lineWidth = 0.7;
  g.strokeStyle = tint(mixColor(bare, INK, 0.6), 0, 0.6);
  g.stroke(crack);
  g.lineWidth = 0.8;
  g.strokeStyle = tint(mixColor(grass, INK, 0.55), 0, 0.5);
  g.stroke(fringe);

  paintTalus(g, w, wdist);

  // Fleurs en colonies d'une seule couleur (plus fréquentes en lisière et près de l'eau), cailloux, terre pointillée.
  const petals = ["#d8b640", "#eee8d2", "#8a72a8", "#c4573f", "#e0cf6a", "#d98aa0"];
  const flowers = petals.map(() => new Path2D());
  const flowerShade = new Path2D();
  const nf = noise2(seed + 17);
  const stone = muted(mixColor(w.theme.wall, "#9a9282", 0.55), 0.15);
  for (let cy = 0; cy < H; cy++)
    for (let cx = 0; cx < W; cx++) {
      if (!free(cx, cy) || reserved?.[cy * W + cx]) continue;
      const rr = rng(seed, cx, cy, 4);
      const edge = near(cx, cy, T.vegetation, 1) || near(cx, cy, T.eau, 1) ? 0.4 : 0;
      if (nf(cx / 2.5, cy / 2.5) + edge * 0.5 > 0.3 && rr() < 0.6 && zone[cy * W + cx] !== 2) {
        const ci = Math.floor((nf(cx / 9, cy / 9) + 1) * 2.5 + rr() * 1.4) % petals.length;
        const n = 5 + Math.floor(rr() * 8);
        const ox = (cx + 0.2 + rr() * 0.6) * S;
        const oy = (cy + 0.2 + rr() * 0.6) * S;
        const spread = S * (0.25 + rr() * 0.2);
        for (let k = 0; k < n; k++) {
          const a = rr() * Math.PI * 2;
          const d = Math.sqrt(rr()) * spread;
          const x = ox + Math.cos(a) * d;
          const y = oy + Math.sin(a) * d;
          const rad = 1.6 + rr() * 1.1;
          flowerShade.moveTo(x + 0.6 + rad + 0.4, y + 0.8);
          flowerShade.arc(x + 0.6, y + 0.8, rad + 0.4, 0, Math.PI * 2);
          flowers[ci].moveTo(x + rad, y);
          flowers[ci].arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      const z = zone[cy * W + cx];
      if (rr() < (z === 2 ? 0.3 : 0.06)) pebble(g, rr, (cx + 0.15 + rr() * 0.7) * S, (cy + 0.15 + rr() * 0.7) * S, 2.5 + rr() * 3.5, stone);
    }
  g.fillStyle = tint(INK, 0, 0.35);
  g.fill(flowerShade);
  flowers.forEach((p, i) => {
    g.fillStyle = petals[i];
    g.fill(p);
  });
}

/**
 * Talus : les ruptures de pente d'un relief lent, propre à la graine (l'altitude des terrains — eau au fond, rochers en
 * haut — plus de grandes ondulations de bruit). On en trace deux ou trois courbes de niveau, on garde les morceaux de
 * quatre à huit cases posés sur la prairie, de préférence ceux qui partent d'un rocher, d'une rive ou d'une lisière.
 * Chacun : une arête d'encre effilée aux deux bouts, des hachures perpendiculaires qui descendent la pente, plus
 * longues et plus serrées là où elle est raide, en coin (appuyées à l'arête, effilées en bas), et un lavis d'ombre
 * côté aval. Seulement sur la prairie : l'eau, les chemins, les bois et les rochers passent par-dessus, rien ne bloque.
 */
function paintTalus(g: CanvasRenderingContext2D, w: Wild, wdist: Uint8Array) {
  const { map, W, H, seed, elev, grass } = w;
  const r = rng(seed, 530);
  const hn = noise2(seed + 532);
  const at = (x: number, y: number) => elev[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  /** Altitude des terrains interpolée (u, v en cases). */
  const E = (u: number, v: number) => {
    const fx = Math.max(0, Math.min(W - 1.001, u - 0.5));
    const fy = Math.max(0, Math.min(H - 1.001, v - 0.5));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * tx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * tx;
    return a + (b - a) * ty;
  };
  /** Relief : terrains + grandes ondulations (en cases). */
  const F = (u: number, v: number) => E(u, v) * 0.55 + hn(u / 8, v / 8) * 0.7 + hn(u / 3 + 9, v / 3) * 0.1;
  const okCell = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && map.tiles[y * W + x] === T.sol && wdist[y * W + x] > 1;
  const okPt = (px: number, py: number) => okCell(Math.floor(px / S), Math.floor(py / S));
  // champ à la demi-case
  const k = S / 2;
  const gw = W * 2;
  const gh = H * 2;
  const f = new Float32Array(gw * gh);
  const vals: number[] = [];
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const v = F(((x + 0.5) * k) / S, ((y + 0.5) * k) / S);
      f[y * gw + x] = v;
      if (okPt((x + 0.5) * k, (y + 0.5) * k)) vals.push(v);
    }
  if (vals.length < 40) return;
  vals.sort((a, b) => a - b);
  const grad = (px: number, py: number): Pt => {
    const u = px / S;
    const v = py / S;
    return [(F(u + 0.35, v) - F(u - 0.35, v)) / 0.7, (F(u, v + 0.35) - F(u, v - 0.35)) / 0.7];
  };
  const near = (px: number, py: number, t: number, rad: number) => {
    const cx = Math.floor(px / S);
    const cy = Math.floor(py / S);
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (w.tile(cx + dx, cy + dy) === t) return true;
    return false;
  };
  // 1. morceaux de courbes de niveau sur la prairie, coupés en tronçons de quatre à huit cases
  const runs: { pts: Pt[]; score: number }[] = [];
  const lenOf = (l: Pt[]) => l.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - l[i - 1][0], p[1] - l[i - 1][1]) : 0), 0);
  for (const q of [0.35, 0.6, 0.82]) {
    const level = vals[Math.floor(vals.length * q)];
    for (const line of isolines(f, gw, gh, level, k)) {
      const sm = smoothPoints(line, 2, false);
      let cur: Pt[] = [];
      const flush = () => {
        let L = lenOf(cur);
        while (L > S * 3.5) {
          // tronçon de quatre à huit cases ; le reste après un blanc d'une case
          const want = S * (4 + r() * 4);
          let acc = 0;
          let cut = cur.length;
          for (let i = 1; i < cur.length; i++) {
            acc += Math.hypot(cur[i][0] - cur[i - 1][0], cur[i][1] - cur[i - 1][1]);
            if (acc > want) {
              cut = i;
              break;
            }
          }
          const piece = cur.slice(0, cut + 1);
          let gsum = 0;
          for (const p of piece) gsum += Math.hypot(...grad(p[0], p[1]));
          const a = piece[0];
          const b = piece[piece.length - 1];
          const anchored = [a, b].some(([x, y]) => near(x, y, T.mur, 1) || near(x, y, T.eau, 1) || near(x, y, T.vegetation, 1));
          runs.push({ pts: piece, score: (gsum / piece.length) * lenOf(piece) / S + (anchored ? 3 : 0) });
          // un blanc d'une case environ, puis la suite
          let skip = 0;
          let j = cut;
          while (j < cur.length - 1 && skip < S * (0.8 + r() * 0.8)) {
            skip += Math.hypot(cur[j + 1][0] - cur[j][0], cur[j + 1][1] - cur[j][1]);
            j++;
          }
          cur = cur.slice(j);
          L = lenOf(cur);
        }
        cur = [];
      };
      for (const p of sm) {
        if (okPt(p[0], p[1]) && Math.hypot(...grad(p[0], p[1])) > 0.12) cur.push(p);
        else flush();
      }
      flush();
    }
  }
  // 2. les plus marqués, sans qu'ils se touchent
  runs.sort((a, b) => b.score - a.score);
  const kept: Pt[][] = [];
  const most = 4 + Math.floor((W * H) / 450);
  for (const run of runs) {
    if (kept.length >= most) break;
    if (kept.some((l) => l.some((p) => run.pts.some((q, i) => i % 3 === 0 && Math.hypot(p[0] - q[0], p[1] - q[1]) < S * 2.6)))) continue;
    kept.push(run.pts);
  }
  const hatchP = new Path2D();
  const hatchLight = new Path2D();
  const shadeP = new Path2D();
  const shadeCore = new Path2D();
  for (const line of kept) {
    const L = lenOf(line);
    const down: Pt[] = [];
    const steep: number[] = [];
    for (const p of line) {
      const [gx, gy] = grad(p[0], p[1]);
      const l = Math.hypot(gx, gy) || 1;
      down.push([-gx / l, -gy / l]);
      steep.push(Math.min(1, l / 0.32));
    }
    // arête : effilée aux deux bouts, plus appuyée là où la pente est raide
    inkPolyline(g, line, r, { width: 1.1 + r() * 0.4, wobble: 0.4, taper: S * 0.8, pressure: 0.55, color: tint(INK, 0, 0.62) });
    let acc = 0;
    let next = r() * 3;
    let n = 0;
    const band: Pt[] = [...line];
    const core: Pt[] = [...line];
    const reach: number[] = [];
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (next <= acc + seg) {
        const t = (next - acc) / (seg || 1);
        const px = a[0] + (b[0] - a[0]) * t;
        const py = a[1] + (b[1] - a[1]) * t;
        const [dx, dy] = down[i];
        const prof = Math.sin(Math.PI * Math.min(1, Math.max(0, next / L))) ** 0.7;
        const st = steep[i];
        const l = (7 + st * 13) * (n % 3 === 2 ? 0.55 : n % 2 ? 0.78 : 1) * (0.8 + r() * 0.45) * prof;
        if (l > 2.5 && okPt(px + dx * l, py + dy * l)) {
          const hw = 0.6 + prof * 0.5 + st * 0.3;
          const tw = (r() - 0.5) * 0.24;
          const ux = dx * Math.cos(tw) - dy * Math.sin(tw);
          const uy = dy * Math.cos(tw) + dx * Math.sin(tw);
          const bend = (r() - 0.5) * 2;
          const p = r() < 0.82 ? hatchP : hatchLight;
          p.moveTo(px - uy * hw, py + ux * hw);
          p.lineTo(px + uy * hw, py - ux * hw);
          p.quadraticCurveTo(px + ux * l * 0.5 + uy * bend, py + uy * l * 0.5 - ux * bend, px + ux * l, py + uy * l);
          p.closePath();
        }
        n++;
        // plus la pente est raide, plus les traits se serrent
        next += 2.6 + (1 - st) * 3 + r() * 1.6;
      }
      acc += seg;
    }
    for (let i = line.length - 1; i >= 0; i--) {
      const prof = Math.sin(Math.PI * (i / (line.length - 1))) ** 0.6;
      const d = (8 + steep[i] * 16) * prof;
      reach.push(d);
      band.push([line[i][0] + down[i][0] * d * 1.4, line[i][1] + down[i][1] * d * 1.4]);
      core.push([line[i][0] + down[i][0] * d * 0.7, line[i][1] + down[i][1] * d * 0.7]);
    }
    shadeP.addPath(shapeOf(band).path);
    shadeCore.addPath(shapeOf(core).path);
  }
  g.save();
  g.globalCompositeOperation = "multiply";
  g.fillStyle = tint(mixColor(grass, INK, 0.4), 0, 0.14);
  g.fill(shadeP, "nonzero");
  g.fillStyle = tint(mixColor(grass, INK, 0.4), 0, 0.14);
  g.fill(shadeCore, "nonzero");
  g.restore();
  g.fillStyle = tint(mixColor(grass, INK, 0.82), 0, 0.72);
  g.fill(hatchP);
  g.fillStyle = tint(mixColor(grass, INK, 0.6), 0, 0.5);
  g.fill(hatchLight);
}
/** Décale une polyligne de `d(i)` px sur sa normale (à gauche du sens de parcours). */
function offsetLine(line: Pt[], d: (i: number) => number): Pt[] {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 3)];
    const b = line[Math.min(line.length - 1, i + 3)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * d(i), p[1] + (dx / l) * d(i)] as Pt;
  });
}

/**
 * Chemins de terre battue : herbe foulée au bord, lavis ocre, deux ornières continues avec une bande d'herbe au milieu,
 * flaques qui reflètent le ciel, traces de pas, cailloux ; l'herbe empiète sur le bord ; lèvre d'encre interrompue.
 */
export function paintWildPaths(g: CanvasRenderingContext2D, w: Wild) {
  const { map, W, H, seed, grass } = w;
  const isPath = (x: number, y: number) => map.tiles[y * W + x] === T.route && !w.wet[y * W + x];
  if (!map.tiles.some((t, i) => t === T.route && !w.wet[i])) return;
  const r = rng(seed, 2);
  const loops = wildContour(isPath, W, H, { smooth: 3, jitter: 7, round: 2, seed: seed + 41 });
  const path = shapeOf(loops);
  const dirt = muted(mixColor(mixColor(w.theme.road, w.theme.floor, 0.3), "#b39363", 0.25), 0.15);
  const darkDirt = mixColor(dirt, INK, 0.45);
  // herbe foulée autour
  g.save();
  g.lineJoin = "round";
  g.strokeStyle = tint(mixColor(grass, dirt, 0.45), -0.06, 0.45);
  g.lineWidth = 16;
  g.stroke(path.path);
  g.restore();
  wildWash(g, path, dirt, w, { alpha: 0.95, edge: 6, variation: 0.9, tex: 1 });

  g.save();
  g.clip(path.path, "nonzero");
  const nw = noise2(seed + 43);
  for (const line of w.routes) {
    // la bande d'herbe du milieu : lavis vert, touffes
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = tint(mixColor(grass, dirt, 0.3), 0, 0.4);
    g.lineWidth = 5;
    g.beginPath();
    line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    const mid = new Path2D();
    line.forEach(([x, y], i) => {
      if (i % 2 === 0 && r() < 0.6) tuft(mid, r, x + (r() - 0.5) * 3, y + 2, 3 + r() * 3.5);
    });
    g.strokeStyle = tint(mixColor(grass, INK, 0.45), 0, 0.7);
    g.lineWidth = 0.9;
    g.stroke(mid);
    // deux ornières continues, l'écart varie un peu
    for (const side of [-1, 1]) {
      const off = offsetLine(line, (i) => side * BASE * (0.15 + 0.03 * nw(line[i][0] / 90, line[i][1] / 90 + side * 7)));
      g.strokeStyle = tint(darkDirt, 0, 0.32);
      g.lineWidth = 4.5;
      g.beginPath();
      off.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      inkPolyline(g, off, r, { width: 1.15, color: tint(INK, 0, 0.55), wobble: 0.6, taper: 30, pressure: 0.6 });
      // traces de sabots et de pas dans l'ornière, par endroits
      off.forEach(([x, y], i) => {
        if (i % 5 || nw(x / 60 + 40, y / 60) < 0.25) return;
        g.fillStyle = tint(darkDirt, 0, 0.45);
        g.beginPath();
        g.ellipse(x + (r() - 0.5) * 3, y + (r() - 0.5) * 3, 2.2, 1.4, r() * 3, 0, Math.PI * 2);
        g.fill();
      });
    }
  }
  // flaques dans les creux : deux ou trois sur la carte, qui reflètent le ciel
  const all = w.routes.flat();
  let puddles = 0;
  for (let i = 30; i < all.length && puddles < 3; i += 9) {
    const [x, y] = all[i];
    if (hash(Math.round(x / S), Math.round(y / S), seed + 47) > 0.12) continue;
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    if (cx < 0 || cy < 0 || cx >= W || cy >= H || !isPath(cx, cy)) continue;
    puddles++;
    i += 120;
    const b = all[Math.min(all.length - 1, i - 117)];
    const rot = Math.atan2(b[1] - y, b[0] - x);
    // dans une ornière : décalée d'un côté du milieu, forme bruitée, taille propre
    const side = r() < 0.5 ? -1 : 1;
    const px = x - Math.sin(rot) * side * BASE * 0.15;
    const py = y + Math.cos(rot) * side * BASE * 0.15;
    const pts = smoothPoints(blobPoints(r, px, py, 7 + r() * 12, 3.5 + r() * 3.5, 7 + Math.floor(r() * 5), 0.4, rot), 1);
    g.fillStyle = tint(darkDirt, 0, 0.55);
    g.fill(shapeOf(pts.map(([u, v]) => [u - 1.5, v - 2] as Pt)).path);
    g.fillStyle = mixColor(mixColor(w.theme.water, "#a9b8b4", 0.55), dirt, 0.15);
    g.fill(shapeOf(pts).path);
    g.save();
    g.clip(shapeOf(pts).path);
    g.strokeStyle = "rgba(250,250,240,.75)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(px - 9, py - 1);
    g.lineTo(px - 2, py - 2.5);
    g.moveTo(px + 1, py + 1.5);
    g.lineTo(px + 6, py + 0.5);
    g.stroke();
    g.restore();
    inkPolyline(g, pts, r, { width: 0.9, closed: true, wobble: 0.3, color: tint(INK, 0, 0.8) });
  }
  // gravier
  stipple(g, path, r, { density: 0.5, radius: 0.8, color: tint(darkDirt, 0, 0.55) });
  g.restore();
  // l'herbe empiète sur le bord : petits traits verts posés à cheval sur la lisière du chemin
  const blades = new Path2D();
  const bladesLight = new Path2D();
  for (const loop of loops)
    for (let i = 0; i < loop.length; i += 2) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l;
      const ny = dx / l;
      const k = 1 + Math.floor(r() * 2);
      for (let j = 0; j < k; j++) {
        if (r() < 0.35) continue;
        const sx = p[0] - nx * (1 + r() * 3) + (r() - 0.5) * 3;
        const sy = p[1] - ny * (1 + r() * 3) + (r() - 0.5) * 3;
        const len = 3 + r() * 5;
        const a = Math.atan2(ny, nx) + (r() - 0.5) * 1.1;
        const path2 = r() < 0.7 ? blades : bladesLight;
        path2.moveTo(sx, sy);
        path2.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      }
    }
  g.lineCap = "round";
  g.strokeStyle = tint(mixColor(grass, INK, 0.5), 0, 0.75);
  g.lineWidth = 0.9;
  g.stroke(blades);
  g.strokeStyle = tint(grass, 0.1, 0.7);
  g.stroke(bladesLight);
  // lèvre d'encre, en morceaux : la plume se relève
  for (const loop of loops) {
    let seg: Pt[] = [];
    loop.forEach((p, i) => {
      seg.push(p);
      if (seg.length > 8 + r() * 18 || i === loop.length - 1) {
        if (r() > 0.4) inkPolyline(g, seg, r, { width: 1.1, color: tint(INK, 0, 0.7), wobble: 0.5, taper: 10 });
        seg = [p];
      }
    });
  }
  // cailloux en bordure
  const stone = muted(mixColor(w.theme.wall, "#9a9282", 0.55), 0.15);
  for (const loop of loops)
    for (let i = 0; i < loop.length; i += 7) {
      const [x, y] = loop[i];
      if (hash(Math.round(x), Math.round(y), seed + 49) > 0.18) continue;
      pebble(g, r, x + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 1.8 + r() * 2.4, stone);
    }
}

/** Champs de profondeur déjà calculés (une carte redessinée garde le sien). */
const depthCache = new Map<string, Float32Array>();

/**
 * Distance à la rive (px) de chaque point de l'eau, à 1/k de la résolution : la forme de l'eau rastérisée, puis une
 * transformée de distance par chanfrein (deux passes, pas de 1 et de √2). 0 hors de l'eau.
 */
function waterDepth(water: Shape, loops: Pt[][], lw: number, lh: number, k: number, seed: number): Float32Array {
  let sig = 0;
  for (const loop of loops) for (let i = 0; i < loop.length; i += 7) sig = (sig * 31 + Math.round(loop[i][0] * 3 + loop[i][1] * 7)) % 1e9;
  const key = `${seed}:${lw}x${lh}:${loops.length}:${sig}`;
  const hit = depthCache.get(key);
  if (hit) return hit;
  const cv = canvas(lw, lh);
  const q = cv.getContext("2d")!;
  q.scale(1 / k, 1 / k);
  q.fillStyle = "#000";
  q.fill(water.path, "nonzero");
  const a = q.getImageData(0, 0, lw, lh).data;
  const D = new Float32Array(lw * lh);
  const BIG = 1e6;
  for (let i = 0; i < lw * lh; i++) D[i] = a[i * 4 + 3] > 127 ? BIG : 0;
  const R2 = Math.SQRT2;
  for (let y = 0; y < lh; y++)
    for (let x = 0; x < lw; x++) {
      const i = y * lw + x;
      if (!D[i]) continue;
      let v = D[i];
      if (x > 0) v = Math.min(v, D[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, D[i - lw] + 1);
        if (x > 0) v = Math.min(v, D[i - lw - 1] + R2);
        if (x < lw - 1) v = Math.min(v, D[i - lw + 1] + R2);
      }
      D[i] = v;
    }
  for (let y = lh - 1; y >= 0; y--)
    for (let x = lw - 1; x >= 0; x--) {
      const i = y * lw + x;
      if (!D[i]) continue;
      let v = D[i];
      if (x < lw - 1) v = Math.min(v, D[i + 1] + 1);
      if (y < lh - 1) {
        v = Math.min(v, D[i + lw] + 1);
        if (x < lw - 1) v = Math.min(v, D[i + lw + 1] + R2);
        if (x > 0) v = Math.min(v, D[i + lw - 1] + R2);
      }
      D[i] = v;
    }
  // hors cadre, l'eau continue : on ne mesure pas la distance au bord de l'image
  for (let i = 0; i < lw * lh; i++) D[i] = D[i] >= BIG ? 400 : D[i] * k;
  if (depthCache.size > 6) depthCache.clear();
  depthCache.set(key, D);
  return D;
}

/**
 * Eau : berge boueuse, lavis, eau profonde, ligne d'eau doublée à 3 px, lignes de rive concentriques, reflets du ciel
 * plus serrés près de la rive éclairée, trait d'encre, roseaux en massifs et nénuphars.
 */
export function paintWildWater(g: CanvasRenderingContext2D, w: Wild) {
  const { map, W, H, seed } = w;
  const isW = (x: number, y: number) => map.tiles[y * W + x] === T.eau || w.wet[y * W + x] > 0;
  if (!map.tiles.includes(T.eau)) return;
  const PW = W * S;
  const PH = H * S;
  const r = rng(seed, 3);
  // rive déformée par un bruit à deux octaves : plus de formes de gélule, des anses et des avancées
  const loops = bendLoops(wildContour(isW, W, H, { smooth: 3, jitter: 7, round: 4, seed: seed + 31 }), seed + 33, S * 0.24);
  const water = shapeOf(loops);
  const col = muted(mixColor(w.theme.water, "#5f8478", 0.3), 0.15);
  const mud = mixColor(mixColor(w.theme.road, "#3b3022", 0.55), w.grass, 0.2);
  const nr = noise2(seed + 61);
  paintStreams(g, w, col, mud);

  // Berge : une bande de boue brun foncé d'un tiers à une demi-case autour de l'eau, plus large là où la rive est basse
  // (bruit lent), bord extérieur effrangé ; plus sombre et luisante contre l'eau.
  g.save();
  g.lineJoin = "round";
  g.lineCap = "round";
  const mudDark = mixColor(mud, "#2a2016", 0.35);
  const fray = [new Path2D(), new Path2D(), new Path2D()];
  for (const loop of loops)
    for (let i = 0; i < loop.length; i += 5) {
      const seg = loop.slice(i, i + 6);
      if (seg.length < 2) continue;
      const [x, y] = seg[0];
      const k = smoothstep(-0.5, 0.6, nr(x / 110, y / 110) + nr(x / 31 + 7, y / 31) * 0.35);
      const p = fray[Math.min(2, Math.floor(k * 3))];
      seg.forEach(([u, v], j) => (j ? p.lineTo(u, v) : p.moveTo(u, v)));
    }
  fray.forEach((p, j) => {
    // largeur totale = deux fois la bande (la moitié intérieure passe sous l'eau)
    g.strokeStyle = tint(mud, 0, 0.26);
    g.lineWidth = S * (0.62 + j * 0.2) + 10;
    g.stroke(p);
    g.strokeStyle = tint(mudDark, 0, 0.5);
    g.lineWidth = S * (0.62 + j * 0.2);
    g.stroke(p);
  });
  g.strokeStyle = tint(mixColor(mudDark, INK, 0.3), 0, 0.55);
  g.lineWidth = 14;
  g.stroke(water.path);
  g.restore();
  // traces dans la boue : des pas qui longent la rive (bête venue boire), quelques pattes d'oiseau
  {
    const prints = new Path2D();
    const birds = new Path2D();
    const pr = rng(seed, 66);
    for (const loop of loops) {
      const L = loop.length;
      for (let i = Math.floor(pr() * 20); i < L; i += 14 + Math.floor(pr() * 30)) {
        const [x, y] = loop[i];
        const q = loop[(i + 3) % L];
        const p0 = loop[(i - 3 + L) % L];
        let tx = q[0] - p0[0];
        let ty = q[1] - p0[1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        // côté terre : on essaie les deux normales
        let nx = -ty;
        let ny = tx;
        if (w.tile(Math.floor((x + nx * S * 0.4) / S), Math.floor((y + ny * S * 0.4) / S)) === T.eau) {
          nx = -nx;
          ny = -ny;
        }
        const d = S * (0.12 + pr() * 0.22);
        let px = x + nx * d;
        let py = y + ny * d;
        const cx = Math.floor(px / S);
        const cy = Math.floor(py / S);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H || map.tiles[cy * W + cx] !== T.sol) continue;
        if (pr() < 0.7) {
          const a = Math.atan2(ty, tx) + (pr() - 0.5) * 0.6 + (pr() < 0.5 ? Math.PI : 0);
          const n = 3 + Math.floor(pr() * 4);
          for (let k = 0; k < n; k++) {
            for (const sd of [-1, 1]) {
              const ux = px + Math.cos(a + Math.PI / 2) * sd * 1.7 + Math.cos(a) * sd * 2;
              const uy = py + Math.sin(a + Math.PI / 2) * sd * 1.7 + Math.sin(a) * sd * 2;
              prints.moveTo(ux + 1.2, uy);
              prints.ellipse(ux, uy, 1.2, 2, a + Math.PI / 2, 0, Math.PI * 2);
            }
            px += Math.cos(a) * 9 + (pr() - 0.5) * 2;
            py += Math.sin(a) * 9 + (pr() - 0.5) * 2;
          }
        } else {
          for (let k = 0; k < 3; k++) {
            const bx = px + (pr() - 0.5) * 12;
            const by = py + (pr() - 0.5) * 8;
            const a = pr() * Math.PI * 2;
            for (const da of [-0.6, 0, 0.6]) {
              birds.moveTo(bx, by);
              birds.lineTo(bx + Math.cos(a + da) * 3, by + Math.sin(a + da) * 3);
            }
          }
        }
      }
    }
    g.fillStyle = tint(mixColor(mudDark, INK, 0.5), 0, 0.6);
    g.fill(prints);
    g.strokeStyle = tint(INK, 0, 0.45);
    g.lineWidth = 0.7;
    g.stroke(birds);
  }

  wildWash(g, water, col, w, { alpha: 0.96, edge: 9, variation: 0.1, tex: 0 });
  w.water = water;
  // Profondeur : distance (en px) à la rive dessinée, calculée au quart de la résolution (mise en cache par carte),
  // adoucie par trois flous en boîte, déformée d'un bruit lent ; une rampe continue, clair et verdâtre sur le haut-fond,
  // presque noir au milieu. Seul le profond porte des hachures horizontales, plus serrées à mesure qu'il s'enfonce.
  const k = 4;
  const lw = Math.ceil(PW / k);
  const lh = Math.ceil(PH / k);
  const depth = waterDepth(water, loops, lw, lh, k, seed);
  {
    const ramp: [number, [number, number, number], number][] = [
      [0, hexToRgb(mixColor(col, "#cdcf98", 0.5)), 0.6],
      [14, hexToRgb(mixColor(col, "#3d5e58", 0.2)), 0.42],
      [40, hexToRgb(mixColor(col, "#0f262c", 0.5)), 0.56],
      [95, hexToRgb(mixColor(col, "#07141a", 0.76)), 0.7],
    ];
    const cv = canvas(lw, lh);
    const q = cv.getContext("2d")!;
    const img = q.createImageData(lw, lh);
    const nd = noise2(seed + 64);
    const [wx, wy, ww, wh] = water.box;
    const x0 = Math.max(0, Math.floor(wx / k) - 1);
    const x1 = Math.min(lw, Math.ceil((wx + ww) / k) + 2);
    const y0 = Math.max(0, Math.floor(wy / k) - 1);
    const y1 = Math.min(lh, Math.ceil((wy + wh) / k) + 2);
    // flou en boîte séparable (rayon 2), trois passes, sur le rectangle de l'eau seulement
    const sm = new Float32Array(depth);
    const tmp = new Float32Array(lw * lh);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          let s = 0;
          for (let d = -2; d <= 2; d++) s += sm[y * lw + Math.max(x0, Math.min(x1 - 1, x + d))];
          tmp[y * lw + x] = s / 5;
        }
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          let s = 0;
          for (let d = -2; d <= 2; d++) s += tmp[Math.max(y0, Math.min(y1 - 1, y + d)) * lw + x];
          sm[y * lw + x] = s / 5;
        }
    }
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = y * lw + x;
        if (depth[i] <= 0) continue;
        const d = Math.min(depth[i], sm[i] * 1.1) * (1 + nd(x / 22, y / 22) * 0.14);
        sm[i] = d;
        let s = 0;
        while (s < ramp.length - 2 && d >= ramp[s + 1][0]) s++;
        const m = smoothstep(ramp[s][0], ramp[s + 1][0], d);
        const [c0, a0] = [ramp[s][1], ramp[s][2]];
        const [c1, a1] = [ramp[s + 1][1], ramp[s + 1][2]];
        img.data[i * 4] = c0[0] + (c1[0] - c0[0]) * m;
        img.data[i * 4 + 1] = c0[1] + (c1[1] - c0[1]) * m;
        img.data[i * 4 + 2] = c0[2] + (c1[2] - c0[2]) * m;
        img.data[i * 4 + 3] = (a0 + (a1 - a0) * m) * 255;
      }
    q.putImageData(img, 0, 0);
    g.save();
    g.clip(water.path, "nonzero");
    g.imageSmoothingEnabled = true;
    g.drawImage(cv, 0, 0, lw * k, lh * k);
    g.restore();
    // hachures horizontales du profond : chaque rangée a son propre seuil, ses traits leur longueur et leurs blancs ;
    // plus on s'enfonce, plus les traits se suivent
    const hz = [new Path2D(), new Path2D()];
    const [bx, by, bw, bh] = water.box;
    const dAt = (x: number, y: number) => sm[Math.min(lh - 1, Math.max(0, Math.floor(y / k))) * lw + Math.min(lw - 1, Math.max(0, Math.floor(x / k)))];
    for (let y = by + r() * 3; y < by + bh; y += 2.6 + r() * 2.2) {
      const need = 30 + r() * 22;
      let x = Math.max(0, bx);
      while (x < Math.min(PW, bx + bw)) {
        const d = dAt(x, y);
        if (d < need) {
          x += k;
          continue;
        }
        const dens = smoothstep(need, need + 45, d);
        if (r() > 0.25 + dens * 0.75) {
          x += 4 + r() * 10;
          continue;
        }
        const len = 4 + r() * (8 + dens * 26);
        let e = x;
        while (e < x + len && dAt(e, y) >= need) e += 2;
        const yy = y + Math.sin(x * 0.05 + y) * 0.4;
        hz[dens > 0.5 ? 1 : 0].moveTo(x, yy);
        hz[dens > 0.5 ? 1 : 0].lineTo(e, yy + (r() - 0.5) * 0.7);
        x = e + 2 + r() * (14 - dens * 9);
      }
    }
    g.lineCap = "round";
    g.strokeStyle = tint(INK, 0, 0.26);
    g.lineWidth = 0.75;
    g.stroke(hz[0]);
    g.strokeStyle = tint(INK, 0, 0.4);
    g.lineWidth = 0.85;
    g.stroke(hz[1]);
  }

  // Ligne d'eau à 3 px de la rive, une ligne de rive (façon carte gravée), écume en arcs blancs de longueur, d'épaisseur
  // et d'écart inégaux, plus serrés dans les anses : tracées sur la rive décalée vers le large (le côté de l'eau est
  // trouvé point par point sur les cases).
  {
    const waterAt = (x: number, y: number) => w.tile(Math.floor(x / S), Math.floor(y / S)) === T.eau;
    const normals = loops.map((loop) => {
      const n = loop.length;
      const ns = loop.map((_, i) => {
        const p = loop[(i - 2 + n) % n];
        const q = loop[(i + 2) % n];
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        return [-(q[1] - p[1]) / l, (q[0] - p[0]) / l] as Pt;
      });
      let vote = 0;
      for (let i = 0; i < n; i += 3) vote += waterAt(loop[i][0] + ns[i][0] * 14, loop[i][1] + ns[i][1] * 14) ? 1 : -1;
      return vote >= 0 ? ns : ns.map(([x, y]) => [-x, -y] as Pt);
    });
    const inset = (d: number) => {
      const p = new Path2D();
      loops.forEach((loop, k) =>
        loop.forEach(([x, y], i) => {
          const [nx, ny] = normals[k][i];
          if (i) p.lineTo(x + nx * d, y + ny * d);
          else p.moveTo(x + nx * d, y + ny * d);
        }),
      );
      return p;
    };
    g.save();
    g.clip(water.path, "nonzero");
    g.lineJoin = "round";
    for (const [d, a, lw] of [[3.5, 0.7, 1.1], [12, 0.22, 0.9]] as const) {
      g.strokeStyle = tint(INK, 0, a);
      g.lineWidth = lw;
      g.stroke(inset(d));
    }
    // écume : trois épaisseurs de plume (1 à 3 px) ; le vent pousse de l'ouest-nord-ouest, l'écume s'amasse sur les
    // rives sous le vent, en traits longs et appuyés, et ne laisse que quelques fils sur les rives au vent
    const foam = [new Path2D(), new Path2D(), new Path2D()];
    const WIND: Pt = [0.92, 0.38];
    loops.forEach((loop, k) => {
      const L = loop.length;
      let area = 0;
      for (let i = 0; i < L; i++) area += loop[i][0] * loop[(i + 1) % L][1] - loop[(i + 1) % L][0] * loop[i][1];
      const ns = normals[k];
      for (const [d0, dens] of [[5, 1], [9, 0.55], [14, 0.25]] as const) {
        let i = Math.floor(r() * 4);
        while (i < L) {
          const [x, y] = loop[i];
          // anse : la rive s'enroule autour de l'eau (virage du côté de l'eau)
          const a = loop[(i - 6 + L) % L];
          const b = loop[(i + 6) % L];
          const cross = (x - a[0]) * (b[1] - y) - (y - a[1]) * (b[0] - x);
          const ccw = Math.sign(area) || 1;
          const cove = Math.max(0, (cross * ccw) / (S * S * 0.1));
          // rive sous le vent : la terre est du côté où souffle le vent (normale vers la terre = -ns)
          const lee = Math.max(0, -(ns[i][0] * WIND[0] + ns[i][1] * WIND[1]));
          const pDraw = Math.min(0.95, (0.18 + lee * 0.75 + cove * 0.35) * dens);
          const len = 2 + Math.floor(r() * (3 + lee * 7));
          if (r() < pDraw) {
            const p = foam[Math.min(2, Math.floor(r() * (1.4 + lee * 1.8)))];
            const d = d0 + (r() - 0.5) * 2.5;
            for (let j = 0; j <= len && i + j < L; j++) {
              const [u, v] = loop[i + j];
              const [nx, ny] = ns[i + j];
              const dd = d + Math.sin((j / len) * Math.PI) * 1.2;
              if (j) p.lineTo(u + nx * dd, v + ny * dd);
              else p.moveTo(u + nx * dd, v + ny * dd);
            }
          }
          i += len + 1 + Math.floor(r() * (cove > 0.5 ? 2 : 5));
        }
      }
    });
    g.lineCap = "round";
    foam.forEach((p, j) => {
      g.strokeStyle = `rgba(242,238,222,${0.42 + j * 0.18})`;
      g.lineWidth = 0.9 + j * 0.95;
      g.stroke(p);
    });
    g.restore();
  }
  g.save();
  g.clip(water.path, "nonzero");
  // Rives : la berge nord-ouest jette son ombre sur l'eau (bande sombre), la rive sud-est prend la lumière (liseré clair).
  g.lineCap = "round";
  // segments rangés par intensité (quatre paliers) : huit tracés en tout, quelle que soit la longueur des rives
  const darkBands = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  const litBands = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  for (const loop of loops)
    for (let i = 0; i < loop.length; i += 3) {
      const p = loop[i];
      const q = loop[(i + 3) % loop.length];
      const nx = -(q[1] - p[1]);
      const ny = q[0] - p[0];
      const l = Math.hypot(nx, ny) || 1;
      // normale tournée vers la terre : on teste de quel côté la case est sèche
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      const side = w.tile(Math.floor((mx + (nx / l) * S * 0.4) / S), Math.floor((my + (ny / l) * S * 0.4) / S)) === T.eau ? -1 : 1;
      const dot = ((nx / l) * side * SUN_X + (ny / l) * side * SUN_Y);
      if (Math.abs(dot) < 0.25) continue;
      const band = (dot < 0 ? darkBands : litBands)[Math.min(3, Math.floor(((Math.abs(dot) - 0.25) / 0.75) * 4))];
      band.moveTo(p[0], p[1]);
      band.lineTo(q[0], q[1]);
    }
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = `rgba(8,16,20,${((k + 0.5) / 4) * 0.75 * 0.5})`;
    g.lineWidth = 16;
    g.stroke(darkBands[k]);
    g.strokeStyle = `rgba(236,240,224,${((k + 0.5) / 4) * 0.75 * 0.6})`;
    g.lineWidth = 4;
    g.stroke(litBands[k]);
  }
  // reflets du ciel : tirets horizontaux clairs, en paquets au large (bruit lent), longueurs et opacités variables
  const [bx, by, bw, bh] = water.box;
  const shine = new Path2D();
  const shineSoft = new Path2D();
  const ripple = new Path2D();
  const nsh = noise2(seed + 63);
  const n = Math.round((bw * bh) / 500);
  for (let i = 0; i < n; i++) {
    const x = bx + r() * bw;
    const y = by + r() * bh;
    const cx = Math.max(0, Math.min(W - 1, Math.floor(x / S)));
    const cy = Math.max(0, Math.min(H - 1, Math.floor(y / S)));
    const d = w.waterDist[cy * W + cx];
    const p = smoothstep(0.05, 0.6, nsh(x / 120, y / 120)) * (d >= 2 ? 0.9 : 0.25);
    if (r() > p) continue;
    const l = 4 + r() * r() * 26;
    if (r() < 0.75) {
      const k = 1 + Math.floor(r() * 3);
      const path = r() < 0.4 ? shine : shineSoft;
      for (let j = 0; j < k; j++) {
        const ox = (r() - 0.5) * 6;
        path.moveTo(x + ox, y + j * 3.2);
        path.lineTo(x + ox + l * (1 - j * 0.3), y + j * 3.2 + (r() - 0.5));
      }
    } else {
      ripple.moveTo(x, y);
      ripple.quadraticCurveTo(x + l / 2, y - 2.5, x + l, y);
    }
  }
  g.lineCap = "round";
  g.strokeStyle = "rgba(238,240,226,.6)";
  g.lineWidth = 1.3;
  g.stroke(shine);
  g.strokeStyle = "rgba(238,240,226,.28)";
  g.lineWidth = 1.1;
  g.stroke(shineSoft);
  g.strokeStyle = tint(INK, 0, 0.3);
  g.lineWidth = 0.8;
  g.stroke(ripple);
  g.restore();

  inkOutline(g, loops, r, { width: 2.4, wobble: 0.7, double: true });

  // nénuphars en petites colonies
  const pad = muted(mixColor(w.theme.vegetation, "#6f8f45", 0.35), 0.15);
  for (let cy = 0; cy < H; cy++)
    for (let cx = 0; cx < W; cx++) {
      const d = w.waterDist[cy * W + cx];
      if (map.tiles[cy * W + cx] !== T.eau || d < 1 || d > 3) continue;
      const rr = rng(seed, cx, cy, 6);
      if (rr() > 0.14) continue;
      const k = 2 + Math.floor(rr() * 4);
      for (let i = 0; i < k; i++) {
        const x = (cx + 0.2 + rr() * 0.6) * S;
        const y = (cy + 0.2 + rr() * 0.6) * S;
        const rad = 3.5 + rr() * 4;
        const a = rr() * Math.PI * 2;
        g.fillStyle = "rgba(10,20,25,.35)";
        g.beginPath();
        g.arc(x + 1.2, y + 1.6, rad, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = tint(pad, (rr() - 0.5) * 0.1);
        g.beginPath();
        g.moveTo(x, y);
        g.arc(x, y, rad, a + 0.35, a + Math.PI * 2 - 0.05);
        g.closePath();
        g.fill();
        g.strokeStyle = tint(INK, 0, 0.8);
        g.lineWidth = 0.8;
        g.stroke();
        g.strokeStyle = tint(INK, 0, 0.35);
        g.lineWidth = 0.5;
        g.beginPath();
        for (let v = 0; v < 4; v++) {
          const b = a + 0.9 + v * 1.3;
          g.moveTo(x, y);
          g.lineTo(x + Math.cos(b) * rad * 0.8, y + Math.sin(b) * rad * 0.8);
        }
        g.stroke();
        if (rr() < 0.18) {
          g.fillStyle = "#efe2e2";
          g.beginPath();
          g.arc(x - rad * 0.2, y - rad * 0.2, 2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#d9a2a6";
          g.beginPath();
          g.arc(x - rad * 0.2, y - rad * 0.2, 0.9, 0, Math.PI * 2);
          g.fill();
        }
      }
    }

  // roseaux : massifs dans les anses (là où la rive s'enroule autour de l'eau) et par endroits le long des rives basses,
  // chaque massif fait de touffes de 5 à 12 tiges, quelques massettes
  const reedInk = new Path2D();
  const reedLight = new Path2D();
  const heads: Pt[] = [];
  for (const loop of loops) {
    let area = 0;
    for (let i = 0; i < loop.length; i++) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      area += p[0] * q[1] - q[0] * p[1];
    }
    const orient = Math.sign(area) || 1;
    const L = loop.length;
    loop.forEach(([x, y], i) => {
      if (i % 4 || x < -4 || y < -4 || x > PW + 4 || y > PH + 4) return;
      const a = loop[(i - 8 + L) % L];
      const b = loop[(i + 8) % L];
      const t1 = Math.atan2(y - a[1], x - a[0]);
      const t2 = Math.atan2(b[1] - y, b[0] - x);
      let turn = t2 - t1;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const cove = turn * orient > 0.45;
      if (!cove && (nr(x / 70 + 13, y / 70) < 0.35 || hash(i, Math.round(x), seed) < 0.6)) return;
      if (cove && hash(i, Math.round(y), seed + 1) < 0.25) return;
      const cx = Math.max(0, Math.min(W - 1, Math.floor(x / S)));
      const cy = Math.max(0, Math.min(H - 1, Math.floor(y / S)));
      if (map.tiles[cy * W + cx] === T.route || w.wet[cy * W + cx]) return;
      const rr = rng(seed, Math.round(x), Math.round(y), 8);
      const tufts = 1 + Math.floor(rr() * (cove ? 3 : 2));
      for (let t = 0; t < tufts; t++) {
        const bx = x + (rr() - 0.5) * 14;
        const by = y + (rr() - 0.5) * 9;
        const k = 5 + Math.floor(rr() * 8);
        const lean = (rr() - 0.5) * 0.5;
        for (let j = 0; j < k; j++) {
          const a = -Math.PI / 2 + lean + (j - (k - 1) / 2) * (1.1 / k) + (rr() - 0.5) * 0.14;
          const l = 9 + rr() * 13;
          const sx = bx + (j - (k - 1) / 2) * 1.1;
          const p = rr() < 0.6 ? reedInk : reedLight;
          p.moveTo(sx, by);
          p.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + 1, by + Math.sin(a) * l * 0.5, sx + Math.cos(a) * l, by + Math.sin(a) * l);
          if (rr() < 0.08) heads.push([sx + Math.cos(a) * l * 0.8, by + Math.sin(a) * l * 0.8]);
        }
      }
    });
  }
  g.lineCap = "round";
  g.strokeStyle = tint(mixColor(w.theme.vegetation, INK, 0.55), 0, 0.9);
  g.lineWidth = 1.2;
  g.stroke(reedInk);
  g.strokeStyle = tint(mixColor(w.theme.vegetation, "#c9b56a", 0.35), 0, 0.9);
  g.lineWidth = 1;
  g.stroke(reedLight);
  g.fillStyle = "#4a2f1c";
  for (const [x, y] of heads) {
    g.beginPath();
    g.ellipse(x, y, 1.4, 3.2, -0.2, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * Ponts de bois là où le chemin franchit l'eau : une planche tous les quarts de case, en travers du tracé, plus large que
 * le chemin d'une demi-case ; deux longerons, garde-corps, poteaux aux bouts et sur les rives, ombre portée sur l'eau.
 */
export function paintWildBridges(g: CanvasRenderingContext2D, w: Wild) {
  const { W, H, map } = w;
  const r = rng(w.seed, 4);
  // bois vieilli : désaturé, grisé par la pluie
  const wood = muted(mixColor(w.theme.door, "#7f6a52", 0.7), 0.4);
  const stone = muted(mixColor(w.theme.wall, "#9a9282", 0.55), 0.15);
  const dark = mixColor(wood, INK, 0.5);
  const cellAt = ([x, y]: Pt) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    return cx < 0 || cy < 0 || cx >= W || cy >= H ? -1 : cy * W + cx;
  };
  const wetAt = (p: Pt) => {
    const i = cellAt(p);
    return i >= 0 && (w.wet[i] > 0 || map.tiles[i] === T.eau);
  };
  for (const deck of w.bridges) {
    if (deck.length < 2) continue;
    const half = S * 0.62;
    const norms = deck.map((_, i): Pt => {
      const a = deck[Math.max(0, i - 3)];
      const b = deck[Math.min(deck.length - 1, i + 3)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    });
    const side = (k: number) => deck.map((p, i) => [p[0] + norms[i][0] * k, p[1] + norms[i][1] * k] as Pt);
    const left = side(half);
    const right = side(-half);
    const shape = shapeOf([...left, ...[...right].reverse()]);
    // ombre portée sur l'eau (le tablier est à une demi-case au-dessus)
    g.save();
    g.translate(SUN_X * 16, SUN_Y * 16);
    g.fillStyle = "rgba(8,14,18,.45)";
    g.fill(shape.path);
    g.restore();
    // culées de pierre sur chaque rive : trois moellons de part et d'autre du tablier
    for (const end of [0, deck.length - 1]) {
      const [ex, ey] = deck[end];
      const [nx, ny] = norms[end];
      const tx = -ny;
      const ty = nx;
      const out = end === 0 ? -1 : 1;
      for (const sd of [-1, 1])
        for (let k = 0; k < 3; k++) {
          const cx = ex + nx * sd * (half + 2 + k * 2) + tx * out * (k * 7 - 4);
          const cy = ey + ny * sd * (half + 2 + k * 2) + ty * out * (k * 7 - 4);
          const a = 5 + r() * 2;
          const b = 4 + r() * 2;
          const blk: Pt[] = [[cx - tx * a - nx * b, cy - ty * a - ny * b], [cx + tx * a - nx * b, cy + ty * a - ny * b], [cx + tx * a + nx * b, cy + ty * a + ny * b], [cx - tx * a + nx * b, cy - ty * a + ny * b]];
          g.fillStyle = "rgba(16,10,5,.4)";
          g.fill(shapeOf(blk.map(([u, v]) => [u + SUN_X * 4, v + SUN_Y * 4] as Pt)).path);
          g.fillStyle = tint(stone, (r() - 0.4) * 0.14);
          g.fill(shapeOf(blk).path);
          inkPolyline(g, blk, r, { closed: true, width: 1, wobble: 0.2 });
        }
    }
    // poteaux : aux deux bouts, sur chaque rive, et tous les trois quarts de case au-dessus de l'eau
    const posts: number[] = [1, deck.length - 2];
    let run = 0;
    for (let i = 1; i < deck.length; i++) {
      run += Math.hypot(deck[i][0] - deck[i - 1][0], deck[i][1] - deck[i - 1][1]);
      if (wetAt(deck[i]) !== wetAt(deck[i - 1])) {
        posts.push(i);
        run = 0;
      } else if (run > S * 0.75 && wetAt(deck[i])) {
        posts.push(i);
        run = 0;
      }
    }
    // pieux dans l'eau : rides autour
    for (const i of posts) {
      if (!wetAt(deck[i])) continue;
      for (const s of [left, right]) {
        const [x, y] = s[i];
        g.strokeStyle = "rgba(236,240,226,.45)";
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(x + SUN_X * 6, y + SUN_Y * 6 + 2, 6, 2.5, 0, 0, Math.PI);
        g.stroke();
      }
    }
    // longerons, sous les planches
    for (const s of [side(half - 3), side(-half + 3)]) inkPolyline(g, s, r, { width: 5, color: dark, wobble: 0.3, taper: 0 });
    // planches en travers, d'épaisseur et de teinte inégales
    let acc = 99;
    for (let i = 0; i < deck.length; i++) {
      if (i) acc += Math.hypot(deck[i][0] - deck[i - 1][0], deck[i][1] - deck[i - 1][1]);
      if (acc < S * 0.235) continue;
      acc = 0;
      if (r() < 0.03 && i > 4 && i < deck.length - 4) continue; // planche manquante
      const [nx, ny] = norms[i];
      const [px, py] = deck[i];
      const tx = -ny;
      const ty = nx;
      const wd = S * (0.15 + r() * 0.08);
      const l1 = half * (0.93 + r() * 0.1);
      const l2 = half * (0.93 + r() * 0.1);
      const sk = (r() - 0.5) * 2;
      const plank: Pt[] = [
        [px + nx * l1 - (tx * wd) / 2 + tx * sk, py + ny * l1 - (ty * wd) / 2 + ty * sk],
        [px + nx * l1 + (tx * wd) / 2 + tx * sk, py + ny * l1 + (ty * wd) / 2 + ty * sk],
        [px - nx * l2 + (tx * wd) / 2, py - ny * l2 + (ty * wd) / 2],
        [px - nx * l2 - (tx * wd) / 2, py - ny * l2 - (ty * wd) / 2],
      ];
      g.fillStyle = tint(mixColor(wood, "#8f8a80", r() * 0.35), (r() - 0.45) * 0.24);
      g.fill(shapeOf(plank).path);
      // côté à l'ombre de chaque planche, fil du bois, clous
      const shadeK = tx * SUN_X + ty * SUN_Y > 0 ? [1, 2] : [3, 0];
      g.strokeStyle = tint(INK, 0, 0.38);
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(plank[shadeK[0]][0], plank[shadeK[0]][1]);
      g.lineTo(plank[shadeK[1]][0], plank[shadeK[1]][1]);
      g.stroke();
      g.strokeStyle = tint(INK, 0, 0.28);
      g.lineWidth = 0.6;
      g.beginPath();
      const off = (r() - 0.5) * wd * 0.5;
      g.moveTo(px + nx * l1 * 0.8 + tx * off, py + ny * l1 * 0.8 + ty * off);
      g.quadraticCurveTo(px + tx * (off + 1), py + ty * (off + 1), px - nx * l2 * 0.6 + tx * off, py - ny * l2 * 0.6 + ty * off);
      g.stroke();
      g.fillStyle = INK;
      for (const k of [half - 3, -half + 3]) {
        g.beginPath();
        g.arc(px + nx * k, py + ny * k, 0.9, 0, Math.PI * 2);
        g.fill();
      }
      inkPolyline(g, plank, r, { width: 0.75, closed: true, wobble: 0.2, color: tint(INK, 0, 0.85) });
    }
    // garde-corps : main courante cernée d'encre, poteaux carrés
    for (const s of [left, right]) {
      const rail = s.slice(1, -1);
      inkPolyline(g, rail.map(([x, y]) => [x + SUN_X * 3, y + SUN_Y * 3] as Pt), r, { width: 4, color: "rgba(10,8,5,.35)", wobble: 0.2, taper: 0 });
      inkPolyline(g, rail, r, { width: 5.4, color: INK, wobble: 0.3, taper: 0 });
      inkPolyline(g, rail, r, { width: 3, color: mixColor(wood, "#e9d9b0", 0.25), wobble: 0.2, taper: 0 });
      for (const i of posts) {
        const [x, y] = s[Math.max(1, Math.min(s.length - 2, i))];
        const p: Pt[] = [[x - 3.6, y - 3.6], [x + 3.6, y - 3.6], [x + 3.6, y + 3.6], [x - 3.6, y + 3.6]];
        g.fillStyle = "rgba(10,8,5,.4)";
        g.fill(shapeOf(p.map(([u, v]) => [u + SUN_X * 6, v + SUN_Y * 6] as Pt)).path);
        g.fillStyle = mixColor(wood, "#e9d9b0", 0.2);
        g.fill(shapeOf(p).path);
        g.fillStyle = dark;
        g.fill(shapeOf([p[1], p[2], p[3], [x, y]]).path);
        inkPolyline(g, p, r, { closed: true, width: 1.2, wobble: 0.2 });
      }
    }
  }
}

/** Direction des ombres portées (lumière du haut à gauche), la même que dans mapNature. */
const SUN_X = 0.6;
const SUN_Y = 0.8;

// ——— Relief et ruisseaux ———

/**
 * Altitude lissée de chaque case, à partir de ce que le générateur a posé : l'eau au fond, la prairie, les bois un peu
 * plus haut, les rochers au sommet ; plus des buttes lentes. Sert aux talus, à l'ombrage du sol et au cours des ruisseaux.
 */
function elevationOf(map: GameMap): Float32Array {
  const { width: W, height: H, tiles, seed } = map;
  const nz = noise2(seed + 501);
  let e = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = tiles[y * W + x];
      const base = t === T.eau ? -1 : t === T.vegetation ? 0.55 : t === T.mur ? 1.3 : 0;
      e[y * W + x] = base + nz(x / 6, y / 6) * 0.35 + nz(x / 2.5 + 30, y / 2.5) * 0.08;
    }
  // deux flous en boîte de 5 × 5 : des pentes douces, des ruptures là où les terrains changent vite
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        let n = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const u = Math.max(0, Math.min(W - 1, x + dx));
            const v = Math.max(0, Math.min(H - 1, y + dy));
            s += e[v * W + u];
            n++;
          }
        out[y * W + x] = s / n;
      }
    e = out;
  }
  return e;
}

/** Tas binaire minimal (indices triés par coût) pour les plus courts chemins. */
function heap() {
  const k: number[] = [];
  const v: number[] = [];
  return {
    get size() {
      return k.length;
    },
    push(i: number, c: number) {
      k.push(i);
      v.push(c);
      let j = k.length - 1;
      while (j > 0) {
        const p = (j - 1) >> 1;
        if (v[p] <= v[j]) break;
        [k[p], k[j]] = [k[j], k[p]];
        [v[p], v[j]] = [v[j], v[p]];
        j = p;
      }
    },
    pop(): [number, number] {
      const top: [number, number] = [k[0], v[0]];
      const lk = k.pop()!;
      const lv = v.pop()!;
      if (k.length) {
        k[0] = lk;
        v[0] = lv;
        let j = 0;
        for (;;) {
          const a = j * 2 + 1;
          const b = a + 1;
          let m = j;
          if (a < k.length && v[a] < v[m]) m = a;
          if (b < k.length && v[b] < v[m]) m = b;
          if (m === j) break;
          [k[m], k[j]] = [k[j], k[m]];
          [v[m], v[j]] = [v[j], v[m]];
          j = m;
        }
      }
      return top;
    },
  };
}

/**
 * Ruisseaux de décor : ils relient les étangs voisins en suivant les creux (arbre couvrant des plus courts chemins),
 * ou mènent l'eau d'un étang isolé jusqu'au bord de la carte. Ils passent sur l'herbe et sous les bois, jamais sur
 * un rocher ni une porte, et évitent les chemins ; ils ne changent aucune case (on les enjambe).
 */
function streamsOf(map: GameMap, elev: Float32Array): Pt[][] {
  const { width: W, height: H, tiles, seed } = map;
  // étangs : composantes de cases d'eau
  const body = new Int32Array(W * H).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < W * H; s++) {
    if (tiles[s] !== T.eau || body[s] >= 0) continue;
    const id = sizes.length;
    const q = [s];
    body[s] = id;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      const x = i % W;
      for (const [dx, dy] of NB4) {
        const nx = x + dx;
        const ny = (i - x) / W + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (tiles[j] === T.eau && body[j] < 0) {
          body[j] = id;
          q.push(j);
        }
      }
    }
    sizes.push(q.length);
  }
  if (!sizes.length) return [];
  const cost = (i: number) => {
    const t = tiles[i];
    if (t === T.mur || t === T.porte || t === T.vide) return Infinity;
    if (t === T.route) return 4;
    if (t === T.eau) return 0.3;
    // sous les bois, un ruisseau disparaît sous la ramure (il semblerait finir contre la lisière) : il les contourne
    const x = i % W;
    const y = (i - x) / W;
    // le long du cadre, un ruisseau ne se verrait qu'à moitié
    const rim = x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 3 : 0;
    // au plus bas : l'eau descend ; un peu de bruit pour que le lit serpente
    return rim + (t === T.vegetation ? 4 : 1) + Math.max(0, elev[i] + 0.3) * 1.2 + hash(x, y, seed + 511) * 0.4;
  };
  const dist = new Float64Array(W * H);
  const prev = new Int32Array(W * H);
  const run = (src: number[]) => {
    dist.fill(Infinity);
    prev.fill(-1);
    const hp = heap();
    for (const s of src) {
      dist[s] = 0;
      hp.push(s, 0);
    }
    while (hp.size) {
      const [i, d] = hp.pop();
      if (d > dist[i]) continue;
      const x = i % W;
      // huit voisins : le lit coupe en biais au lieu de faire des escaliers
      for (const [dx, dy] of NB8) {
        const nx = x + dx;
        const ny = (i - x) / W + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        const nd = d + cost(j) * (dx && dy ? 1.42 : 1);
        if (nd < dist[j]) {
          dist[j] = nd;
          prev[j] = i;
          hp.push(j, nd);
        }
      }
    }
  };
  const back = (end: number) => {
    const cells: number[] = [];
    for (let k = end; k >= 0; k = prev[k]) cells.push(k);
    return cells;
  };
  const cellsOf = (id: number) => {
    const out: number[] = [];
    for (let i = 0; i < W * H; i++) if (body[i] === id) out.push(i);
    return out;
  };
  const lines: number[][] = [];
  const linked = new Uint8Array(sizes.length);
  // arbre couvrant : on relie d'abord les étangs les plus proches (coût du lit), jusqu'à 90 de coût (une trentaine de cases)
  const edges: [number, number, number][] = [];
  for (let a = 0; a < sizes.length; a++) {
    run(cellsOf(a));
    for (let b = a + 1; b < sizes.length; b++) {
      let best = Infinity;
      for (let i = 0; i < W * H; i++) if (body[i] === b && dist[i] < best) best = dist[i];
      // une flaque d'une ou deux cases ne fait pas un étang : on n'y mène pas de ruisseau
      if (best < 90 && sizes[a] >= 4 && sizes[b] >= 4) edges.push([best, a, b]);
    }
  }
  edges.sort((p, q) => p[0] - q[0]);
  const root = sizes.map((_, i) => i);
  const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i])));
  for (const [, a, b] of edges) {
    if (find(a) === find(b)) continue;
    root[find(a)] = find(b);
    run(cellsOf(a));
    let end = -1;
    for (let i = 0; i < W * H; i++) if (body[i] === b && (end < 0 || dist[i] < dist[end])) end = i;
    lines.push(back(end));
    linked[a] = linked[b] = 1;
  }
  // étang resté seul (assez grand) : un ruisseau s'en échappe vers le bord le plus bas, s'il n'est pas trop loin
  for (let a = 0; a < sizes.length; a++) {
    if (linked[a] || sizes[a] < 5) continue;
    run(cellsOf(a));
    let end = -1;
    for (let i = 0; i < W * H; i++) {
      const x = i % W;
      const y = (i - x) / W;
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) continue;
      if (dist[i] < 22 && tiles[i] !== T.eau && (end < 0 || dist[i] < dist[end])) end = i;
    }
    if (end >= 0) lines.push(back(end));
  }
  // en points : centres des cases (le bout dans l'étang reste, le ruisseau s'y jette), prolongés hors cadre au bord
  return lines
    .map((cells) => {
      // on ne garde qu'une case d'eau à chaque bout : le lit commence à la rive
      let a = 0;
      let b = cells.length - 1;
      while (a < b - 1 && tiles[cells[a + 1]] === T.eau) a++;
      while (b > a + 1 && tiles[cells[b - 1]] === T.eau) b--;
      const pts = cells.slice(a, b + 1).map((i) => [((i % W) + 0.5) * S, (Math.floor(i / W) + 0.5) * S] as Pt);
      const last = pts[pts.length - 1];
      if (pts.length > 1 && (last[0] < S || last[1] < S || last[0] > (W - 1) * S || last[1] > (H - 1) * S)) {
        const p = pts[pts.length - 2];
        pts.push([last[0] + (last[0] - p[0]) * 2, last[1] + (last[1] - p[1]) * 2]);
      }
      return pts;
    })
    .filter((p) => {
      if (p.length < 3) return false;
      // un ruisseau qui passe surtout sous les bois ne se verrait qu'en tronçons sans début ni fin : on n'en dessine pas
      let hidden = 0;
      for (const [x, y] of p) if (tiles[Math.max(0, Math.min(H - 1, Math.floor(y / S))) * W + Math.max(0, Math.min(W - 1, Math.floor(x / S)))] === T.vegetation) hidden++;
      return hidden / p.length < 0.3;
    })
    // une case sur deux (les coudes s'effacent), lissé, puis des méandres lents
    .map((pts) => pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1))
    .map((pts, k) => {
      const line = smoothPoints(pts, 4, false);
      // méandres : une ondulation d'une case et demie de pas, nulle aux deux bouts (le ruisseau sort bien de l'étang)
      const acc = [0];
      for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
      const L = acc[acc.length - 1] || 1;
      const ph = hash(k, 3, seed + 521) * 6.28;
      const wave = offsetLine(line, (i) => Math.sin(acc[i] / (S * 1.5) + ph + Math.sin(acc[i] / (S * 4.3)) * 1.7) * S * 0.42 * Math.min(1, acc[i] / S, (L - acc[i]) / S));
      return jitterPoints(wave, S * 0.15, seed + 520 + k, 1 / 40);
    });
}

/**
 * Ruisseaux : lit dont la largeur respire le long du cours (un cinquième à deux cinquièmes de case), berge de terre
 * brune de 2 à 4 px de chaque côté, ombre de la berge nord-ouest sur l'eau et trait d'encre de ce seul côté, à épaisseur
 * variable ; reflets en virgules ; écume et galets aux coudes (l'eau creuse la rive extérieure, dépose sur l'intérieure) ;
 * une ou deux petites cascades là où le lit descend ; un caillou ou une touffe de joncs de loin en loin. Sur un chemin,
 * le ruisseau devient un gué clair et peu profond, semé de pierres plates.
 */
function paintStreams(g: CanvasRenderingContext2D, w: Wild, col: string, mud: string) {
  const { seed } = w;
  if (!w.streams.length) return;
  const r = rng(seed, 540);
  const stone = muted(mixColor(w.theme.wall, "#9a9282", 0.55), 0.15);
  const tileAt = ([x, y]: Pt) => w.tile(Math.floor(x / S), Math.floor(y / S));
  const nb = noise2(seed + 541);
  const nwid = noise2(seed + 543);
  const mudDark = mixColor(mud, "#2a2016", 0.3);
  const deepC = mixColor(col, "#10202a", 0.45);
  const damp = new Path2D();
  const bank = new Path2D();
  const bed = new Path2D();
  const core = new Path2D();
  const shade = new Path2D();
  const thinBank = new Path2D();
  const commas = new Path2D();
  const foam = new Path2D();
  const reeds = new Path2D();
  const inked: { pts: Pt[]; w: number }[] = [];
  const pebbles: [number, number, number][] = [];
  const falls: { p: Pt; d: Pt; hw: number }[] = [];
  const crossings: { p: Pt; d: Pt; hw: number; bk: number; id: number }[] = [];
  const poly = (a: Pt[], b: Pt[]) => shapeOf([...a, ...b.slice().reverse()]).path;
  const elevAt = (p: Pt) => {
    const cx = Math.max(0, Math.min(w.W - 1, Math.floor(p[0] / S)));
    const cy = Math.max(0, Math.min(w.H - 1, Math.floor(p[1] / S)));
    return w.elev[cy * w.W + cx];
  };
  w.streams.forEach((line, li) => {
    const n = line.length;
    if (n < 2) return;
    const acc = [0];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const L = acc[n - 1] || 1;
    // demi-largeur : bruit lent le long du cours (×0,6 à ×1,6), un peu plus étroit aux bouts
    const hw = acc.map((s) => {
      const v = (nwid(s / (S * 2.4) + li * 17, li * 3.1) + 1) / 2;
      const ends = Math.min(1, 0.7 + Math.min(s, L - s) / (S * 2));
      return S * (0.085 + v * 0.12) * ends;
    });
    // berge : 2 à 4 px, et par endroits une plage de boue plus large
    const bk = acc.map((s) => 2 + (nb(s / (S * 1.3) + li * 9, 4.2) + 1) * 1.1 + (hash(Math.floor(s / 30), li, seed + 544) < 0.15 ? 4 : 0));
    damp.addPath(poly(offsetLine(line, (i) => hw[i] + bk[i] + 7), offsetLine(line, (i) => -hw[i] - bk[i] - 7)));
    bank.addPath(poly(offsetLine(line, (i) => hw[i] + bk[i]), offsetLine(line, (i) => -hw[i] - bk[i])));
    bed.addPath(poly(offsetLine(line, (i) => hw[i]), offsetLine(line, (i) => -hw[i])));
    core.addPath(poly(offsetLine(line, (i) => hw[i] * 0.4), offsetLine(line, (i) => -hw[i] * 0.4)));
    // normale de chaque point (du même côté que offsetLine avec un décalage positif)
    const left = line.map((_, i) => {
      const a = line[Math.max(0, i - 3)];
      const b = line[Math.min(n - 1, i + 3)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l] as Pt;
    });
    // côté ombré : la berge nord-ouest (normale tournée vers la lumière) ; on ne change de côté que franchement
    let side = left[0][0] * SUN_X + left[0][1] * SUN_Y < 0 ? 1 : -1;
    let runIn: Pt[] = [];
    let runOut: Pt[] = [];
    let runLit: Pt[] = [];
    const flushLit = () => {
      if (runLit.length > 2) {
        const p = new Path2D();
        runLit.forEach(([x, y], k) => (k ? p.lineTo(x, y) : p.moveTo(x, y)));
        thinBank.addPath(p);
      }
      runLit = [];
    };
    const flush = () => {
      if (runIn.length > 2) {
        shade.addPath(poly(runOut, runIn));
        inked.push({ pts: runOut, w: 1.1 + r() * 0.7 });
      }
      runIn = [];
      runOut = [];
      flushLit();
    };
    for (let i = 0; i < n; i++) {
      const dot = left[i][0] * SUN_X + left[i][1] * SUN_Y;
      const want = dot < -0.15 ? 1 : dot > 0.15 ? -1 : side;
      if (want !== side) {
        flush();
        side = want;
      }
      const t = tileAt(line[i]);
      if (t === T.eau || t === T.route) {
        flush();
        continue;
      }
      const [x, y] = line[i];
      const [nx, ny] = left[i];
      runOut.push([x + nx * side * (hw[i] + 0.4), y + ny * side * (hw[i] + 0.4)]);
      runIn.push([x + nx * side * hw[i] * 0.25, y + ny * side * hw[i] * 0.25]);
      // l'autre berge, au soleil : un fil brun clair, interrompu çà et là
      if (hash(Math.floor(acc[i] / 11), li, seed + 542) > 0.2) runLit.push([x - nx * side * (hw[i] + 0.6), y - ny * side * (hw[i] + 0.6)]);
      else flushLit();
    }
    flush();
    let j = 0;
    const at = (s: number): [Pt, Pt, number] => {
      while (j < n - 2 && acc[j + 1] < s) j++;
      while (j > 0 && acc[j] > s) j--;
      const a = line[j];
      const b = line[Math.min(n - 1, j + 1)];
      const l = acc[Math.min(n - 1, j + 1)] - acc[j] || 1;
      const t = Math.max(0, Math.min(1, (s - acc[j]) / l));
      return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], [(b[0] - a[0]) / l, (b[1] - a[1]) / l], hw[j]];
    };
    // virgules de lumière, deux ou trois par case
    for (let s = r() * 10; s < L; s += 12 + r() * 20) {
      const [[x, y], [dx, dy], h] = at(s);
      if (tileAt([x, y]) === T.eau) continue;
      const o = (r() - 0.5) * h;
      const px = x - dy * o;
      const py = y + dx * o;
      const l = 2.5 + r() * 3 + h * 0.2;
      commas.moveTo(px, py);
      commas.quadraticCurveTo(px + dx * l * 0.6 - dy * 1.2, py + dy * l * 0.6 + dx * 1.2, px + dx * l, py + dy * l);
    }
    // coudes : écume contre la rive extérieure, galets sur la rive intérieure
    for (let i = 4; i < n - 4; i += 2) {
      const a = line[i - 4];
      const b = line[i];
      const c = line[i + 4];
      let turn = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      if (Math.abs(turn) < 0.42 || tileAt(b) !== T.sol || hash(i, li, seed + 545) < 0.35) continue;
      const [nx, ny] = left[i];
      // la normale « left » est du côté où le virage tourne quand turn < 0 : l'extérieur est de l'autre côté
      const out = turn < 0 ? -1 : 1;
      const h = hw[i];
      for (let k = -2; k <= 2; k++) {
        const q = line[Math.max(0, Math.min(n - 1, i + k))];
        const d = h * (0.5 + r() * 0.3);
        const px = q[0] + nx * out * d;
        const py = q[1] + ny * out * d;
        if (k === -2) foam.moveTo(px, py);
        else foam.lineTo(px, py);
      }
      const nP = 2 + Math.floor(r() * 3);
      for (let k = 0; k < nP; k++) {
        const q = line[Math.max(0, Math.min(n - 1, i + Math.floor((r() - 0.5) * 5)))];
        const d = h + bk[i] * 0.5 + r() * 4;
        pebbles.push([q[0] - nx * out * d + (r() - 0.5) * 3, q[1] - ny * out * d + (r() - 0.5) * 3, 1.4 + r() * 2]);
      }
    }
    // cascade : là où le lit descend le plus vite (altitude lissée), loin des bouts, à découvert
    if (L > S * 5 && falls.length < 2) {
      let best = -1;
      let bestI = -1;
      for (let i = 3; i < n - 3; i++) {
        if (acc[i] < S * 1.5 || acc[i] > L - S * 1.5 || tileAt(line[i]) !== T.sol) continue;
        const v = Math.abs(elevAt(line[i - 3]) - elevAt(line[i + 3])) + hash(i, li, seed + 546) * 0.05;
        if (v > best) {
          best = v;
          bestI = i;
        }
      }
      if (bestI > 0 && best > 0.06) {
        const a = line[bestI - 1];
        const b = line[bestI + 1];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        falls.push({ p: line[bestI], d: [(b[0] - a[0]) / l, (b[1] - a[1]) / l], hw: hw[bestI] });
      }
    }
    // cailloux, joncs sur la berge (toutes les deux à quatre cases), gué sur les chemins
    for (let s = S * (0.5 + r() * 2); s < L; s += S * (2 + r() * 2)) {
      const [[x, y], [dx, dy], h] = at(s);
      const t = tileAt([x, y]);
      if (t === T.eau || t === T.route) continue;
      const sd = r() < 0.5 ? -1 : 1;
      const bx = x - dy * sd * (h + 4);
      const by = y + dx * sd * (h + 4);
      if (r() < 0.45) pebbles.push([bx, by, 1.8 + r() * 2.2]);
      else {
        const k = 4 + Math.floor(r() * 5);
        for (let q = 0; q < k; q++) {
          const a = -Math.PI / 2 + (q - (k - 1) / 2) * 0.2 + (r() - 0.5) * 0.2;
          const l = 6 + r() * 7;
          const sx = bx + (q - (k - 1) / 2) * 1.1;
          reeds.moveTo(sx, by);
          reeds.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + 0.8, by + Math.sin(a) * l * 0.5, sx + Math.cos(a) * l, by + Math.sin(a) * l);
        }
      }
    }
    // croisements chemin/eau : un gué de pierres ou un petit pont de planches à chaque traversée
    for (let i = 0; i < n; i++) {
      if (tileAt(line[i]) !== T.route) continue;
      let k = i;
      while (k + 1 < n && (tileAt(line[k + 1]) === T.route || (k + 2 < n && tileAt(line[k + 2]) === T.route))) k++;
      const m = Math.floor((i + k) / 2);
      const a = line[Math.max(0, i - 2)];
      const b = line[Math.min(n - 1, k + 2)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      crossings.push({ p: line[m], d: [(b[0] - a[0]) / l, (b[1] - a[1]) / l], hw: hw[m], bk: bk[m], id: crossings.length + li * 7 });
      i = k;
    }
    line.forEach((p, i) => {
      if (tileAt(p) === T.route && i % 3 === 0) pebbles.push([p[0] + (r() - 0.5) * 8, p[1] + (r() - 0.5) * 8, 3.5 + r() * 2.5]);
    });
  });
  g.save();
  g.fillStyle = tint(mud, 0, 0.22);
  g.fill(damp, "nonzero");
  g.fillStyle = tint(mudDark, 0, 0.78);
  g.fill(bank, "nonzero");
  g.fillStyle = col;
  g.fill(bed, "nonzero");
  g.fillStyle = tint(deepC, 0, 0.32);
  g.fill(core, "nonzero");
  g.fillStyle = "rgba(8,16,20,.38)";
  g.fill(shade, "nonzero");
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = tint(mixColor(mudDark, "#b89a6a", 0.25), 0, 0.7);
  g.lineWidth = 0.9;
  g.stroke(thinBank);
  g.strokeStyle = "rgba(240,242,228,.5)";
  g.stroke(commas);
  g.strokeStyle = "rgba(244,242,230,.75)";
  g.lineWidth = 1.4;
  g.stroke(foam);
  g.restore();
  for (const { pts, w: wd } of inked) inkPolyline(g, pts, r, { width: wd, wobble: 0.25, taper: 10, pressure: 0.6, color: tint(INK, 0, 0.85) });
  // cascades : un ressaut de pierres en travers du lit, l'eau blanchit en dessous
  for (const { p, d, hw } of falls) {
    const [x, y] = p;
    const [dx, dy] = d;
    const nx = -dy;
    const ny = dx;
    const lip: Pt[] = [];
    for (let k = -3; k <= 3; k++) lip.push([x + nx * (k / 3) * (hw + 3) + dx * Math.sin(k) * 1.2, y + ny * (k / 3) * (hw + 3) + dy * Math.sin(k) * 1.2]);
    g.fillStyle = "rgba(8,16,20,.35)";
    g.fill(shapeOf([...lip, ...lip.slice().reverse().map(([u, v]) => [u + dx * 4, v + dy * 4] as Pt)]).path);
    const white = new Path2D();
    for (let k = 0; k < 4; k++) {
      const o = 3 + k * 2.6;
      for (let m = -2; m <= 2; m++) {
        const u = x + dx * o + nx * (m / 2) * hw * 0.9 + dx * Math.sin(m * 2 + k) * 1.2;
        const v = y + dy * o + ny * (m / 2) * hw * 0.9 + dy * Math.sin(m * 2 + k) * 1.2;
        if (m === -2) white.moveTo(u, v);
        else white.lineTo(u, v);
      }
    }
    g.save();
    g.lineCap = "round";
    g.strokeStyle = "rgba(246,244,234,.8)";
    g.lineWidth = 1.2;
    g.stroke(white);
    g.restore();
    for (const sd of [-1, 1]) {
      pebbles.push([x + nx * sd * (hw + 3), y + ny * sd * (hw + 3), 3.5 + r() * 2]);
      pebbles.push([x + nx * sd * (hw + 6) - dx * 4, y + ny * sd * (hw + 6) - dy * 4, 2 + r() * 1.5]);
    }
    inkPolyline(g, lip, r, { width: 1.2, wobble: 0.3, taper: 4 });
  }
  for (const [x, y, s] of pebbles) pebble(g, r, x, y, s, stone);
  g.save();
  g.lineCap = "round";
  g.strokeStyle = tint(mixColor(w.theme.vegetation, INK, 0.5), 0, 0.9);
  g.lineWidth = 1;
  g.stroke(reeds);
  g.restore();
  paintCrossings(g, w, crossings, stone);
}

/**
 * Traversées du ruisseau par un chemin : un gué (eau claire et peu profonde, pierres plates posées en travers, rides)
 * ou un petit pont de planches (tablier, deux garde-corps bas, pieux aux bouts), choisi à la graine.
 */
function paintCrossings(g: CanvasRenderingContext2D, w: Wild, list: { p: Pt; d: Pt; hw: number; bk: number; id: number }[], stone: string) {
  const wood = muted(mixColor(w.theme.door, "#7f6a52", 0.7), 0.4);
  const dark = mixColor(wood, INK, 0.5);
  for (const { p, d, hw, bk, id } of list) {
    const r = rng(w.seed, 548, id);
    const [x, y] = p;
    const [ux, uy] = d; // sens du courant
    const tx = -uy; // sens du chemin, en travers du ruisseau
    const ty = ux;
    const half = hw + bk + 8;
    const corner = (a: number, b: number): Pt => [x + tx * a + ux * b, y + ty * a + uy * b];
    if (hash(id, 5, w.seed + 549) < 0.5) {
      // gué : lame d'eau claire, rides, six pierres plates en travers
      g.fillStyle = "rgba(214,230,222,.3)";
      g.beginPath();
      g.ellipse(x, y, half + 2, S * 0.3, Math.atan2(ty, tx), 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(244,244,232,.55)";
      g.lineWidth = 1;
      g.lineCap = "round";
      for (let k = 0; k < 5; k++) {
        const o = (r() - 0.5) * 2 * half * 0.8;
        const q = (r() - 0.5) * S * 0.45;
        const [qx, qy] = corner(o, q);
        g.beginPath();
        g.moveTo(qx - ux * 3, qy - uy * 3);
        g.lineTo(qx + ux * 3, qy + uy * 3);
        g.stroke();
      }
      const n = 6;
      for (let k = 0; k < n; k++) {
        const o = ((k / (n - 1)) * 2 - 1) * (half + 4) + (r() - 0.5) * 3;
        const [qx, qy] = corner(o, (r() - 0.5) * 6);
        pebble(g, r, qx, qy, 4.2 + r() * 2.2, stone);
      }
    } else {
      // pont de planches : tablier en travers du lit, plus long que l'eau de part et d'autre
      const wd = S * 0.3;
      const deck: Pt[] = [corner(-half - 3, -wd), corner(half + 3, -wd), corner(half + 3, wd), corner(-half - 3, wd)];
      g.fillStyle = "rgba(8,14,18,.4)";
      g.fill(shapeOf(deck.map(([a, b]) => [a + SUN_X * 5, b + SUN_Y * 5] as Pt)).path);
      for (const sd of [-1, 1]) inkPolyline(g, [corner(-half - 3, sd * (wd - 3)), corner(half + 3, sd * (wd - 3))], r, { width: 4, color: dark, wobble: 0.2, taper: 0 });
      for (let o = -half - 2; o <= half + 2; o += 4.4) {
        const a = o + (r() - 0.5) * 0.8;
        const pl: Pt[] = [corner(a - 1.8, -wd - r() * 1.5), corner(a + 1.8, -wd - r() * 1.5), corner(a + 1.8, wd + r() * 1.5), corner(a - 1.8, wd + r() * 1.5)];
        g.fillStyle = tint(mixColor(wood, "#8f8a80", r() * 0.35), (r() - 0.45) * 0.24);
        g.fill(shapeOf(pl).path);
        g.strokeStyle = tint(INK, 0, 0.4);
        g.lineWidth = 0.6;
        g.stroke(shapeOf(pl).path);
      }
      // garde-corps bas : une lisse et quatre pieux par côté
      for (const sd of [-1, 1]) {
        inkPolyline(g, [corner(-half - 3, sd * (wd + 1)), corner(half + 3, sd * (wd + 1))], r, { width: 1.8, color: dark, wobble: 0.2, taper: 0 });
        for (const o of [-half - 3, -half / 3, half / 3, half + 3]) {
          const [qx, qy] = corner(o, sd * (wd + 1));
          g.fillStyle = mixColor(wood, INK, 0.25);
          g.beginPath();
          g.arc(qx, qy, 2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
}
