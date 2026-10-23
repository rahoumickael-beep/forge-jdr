// Boîte à outils de dessin des cartes, façon planche de roman graphique : encre tremblée,
// lavis d'aquarelle, hachures, pointillés, papier. Tout est déterministe à partir d'une graine
// (jamais de Math.random) : la même carte se redessine toujours à l'identique.
// Coordonnées en pixels de l'image de la carte (BASE = 48 px par case).
import { hash } from "./mapUtil";

export type Pt = [number, number];
export type Rng = () => number;
/** Rectangle englobant : x, y, largeur, hauteur. */
export type Box = [number, number, number, number];
/** Forme vectorielle : chemin à remplir ou à découper, et son rectangle englobant. */
export interface Shape {
  path: Path2D;
  box: Box;
}
/** Zone de dessin : forme vectorielle, ou masque (canvas dont l'opacité dit où peindre, à la taille de l'image). */
export type Area = Shape | HTMLCanvasElement;

export const INK = "#16100a";

// ——— Hasard à graine ———

/** Générateur pseudo-aléatoire (mulberry32) dans [0, 1[, graine mêlée aux clés (case, numéro d'objet…). */
export function rng(seed: number, ...keys: number[]): Rng {
  let s = Math.floor(hash(keys[0] ?? 0, keys[1] ?? 0, seed) * 4294967296) ^ Math.floor(hash(keys[2] ?? 0, keys[3] ?? 0, seed + 7) * 4294967296);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nombre au hasard entre a et b. */
export const between = (r: Rng, a: number, b: number) => a + (b - a) * r();

/** Élément au hasard d'une liste. */
export const pick = <V>(r: Rng, list: readonly V[]): V => list[Math.floor(r() * list.length) % list.length];

/** Bruit de valeur 2D lissé dans [-1, 1], continu (pour faire onduler traits, bords et taches). */
export function noise2(seed: number): (x: number, y: number) => number {
  const v = (i: number, j: number) => hash(i, j, seed) * 2 - 1;
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const tx = sm(x - i);
    const ty = sm(y - j);
    const a = v(i, j) + (v(i + 1, j) - v(i, j)) * tx;
    const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * tx;
    return a + (b - a) * ty;
  };
}

// ——— Formes ———

/** Forme à partir d'un polygone ou de plusieurs boucles (les trous se font en règle pair-impair). */
export function shapeOf(loops: Pt[] | Pt[][]): Shape {
  const list = (typeof loops[0]?.[0] === "number" ? [loops] : loops) as Pt[][];
  const path = new Path2D();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const loop of list) {
    loop.forEach(([x, y], i) => {
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    });
    path.closePath();
  }
  return { path, box: [x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)] };
}

/** Forme rectangulaire. */
export function rectShape(x: number, y: number, w: number, h: number): Shape {
  return shapeOf([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}

/** Polygone irrégulier autour d'un centre (rocher, tache, buisson) : `n` sommets, rayon qui varie de ±`irr`. */
export function blobPoints(r: Rng, cx: number, cy: number, rx: number, ry: number, n = 9, irr = 0.25, rot = 0): Pt[] {
  const pts: Pt[] = [];
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (r() - 0.5) * (Math.PI / n);
    const k = 1 + (r() * 2 - 1) * irr;
    const px = Math.cos(a) * rx * k;
    const py = Math.sin(a) * ry * k;
    pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  return pts;
}

/** Lissage de Chaikin d'une polyligne (fermée par défaut) : chaque passe arrondit les angles. */
export function smoothPoints(pts: Pt[], passes = 2, closed = true): Pt[] {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const out: Pt[] = [];
    const n = p.length;
    if (!closed) out.push(p[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const [ax, ay] = p[i];
      const [bx, by] = p[(i + 1) % n];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    if (!closed) out.push(p[n - 1]);
    p = out;
  }
  return p;
}

/** Déplace chaque point d'une polyligne d'au plus `amount` px, selon un bruit continu (bord tremblé sans dents de scie). */
export function jitterPoints(pts: Pt[], amount: number, seed: number, scale = 1 / 40): Pt[] {
  const nx = noise2(seed);
  const ny = noise2(seed + 101);
  return pts.map(([x, y]) => [x + nx(x * scale, y * scale) * amount, y + ny(x * scale, y * scale) * amount] as Pt);
}

/**
 * Contour d'un ensemble de cases : boucles fermées en pixels (sens horaire autour de l'intérieur).
 * Suit les bords de cases, arrondit les escaliers (`round` passes de moyenne, qui rognent un peu les coins saillants),
 * fait onduler (`jitter` px) puis lisse (Chaikin) : bords organiques qui restent sur la grille.
 * Les cases qui ne se touchent que par un coin restent séparées.
 */
export function cellContour(
  inside: (x: number, y: number) => boolean,
  W: number,
  H: number,
  S: number,
  opts: { smooth?: number; jitter?: number; round?: number; seed?: number } = {},
): Pt[][] {
  const { smooth = 2, jitter = 0, round = 0, seed = 0 } = opts;
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && inside(x, y);
  // Arêtes orientées entre une case dedans et une case dehors, l'intérieur à droite (sens horaire à l'écran).
  const VW = W + 1;
  const next = new Map<number, number[]>();
  const add = (ax: number, ay: number, bx: number, by: number) => {
    const k = ay * VW + ax;
    const list = next.get(k);
    if (list) list.push(by * VW + bx);
    else next.set(k, [by * VW + bx]);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  const loops: Pt[][] = [];
  const dirOf = (a: number, b: number) => [(b % VW) - (a % VW), Math.floor(b / VW) - Math.floor(a / VW)];
  for (const start of [...next.keys()]) {
    while (next.get(start)?.length) {
      const verts: number[] = [];
      let cur = start;
      let prev = -1;
      for (let guard = 0; guard < 4 * W * H + 8; guard++) {
        const outs = next.get(cur);
        if (!outs || !outs.length) break;
        let idx = 0;
        if (outs.length > 1 && prev >= 0) {
          // Sommet en selle : on reste autour de la même case, pour séparer celles qui ne se touchent que par un coin.
          const [dx, dy] = dirOf(prev, cur);
          idx = Math.max(0, outs.findIndex((o) => {
            const [ex, ey] = dirOf(cur, o);
            return dx * ey - dy * ex > 0;
          }));
        }
        const nxt = outs.splice(idx, 1)[0];
        verts.push(cur);
        prev = cur;
        cur = nxt;
        if (cur === start) break;
      }
      // On ne garde que les coins (les sommets alignés n'apportent rien au lissage).
      let pts: Pt[] = verts.map((v) => [(v % VW) * S, Math.floor(v / VW) * S] as Pt);
      pts = pts.filter((p, i) => {
        const a = pts[(i - 1 + pts.length) % pts.length];
        const b = pts[(i + 1) % pts.length];
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) !== 0;
      });
      if (pts.length < 3) continue;
      // Points intermédiaires sur les longs côtés pour que l'arrondi et l'ondulation aient de quoi travailler.
      if (jitter > 0 || round > 0) {
        const dense: Pt[] = [];
        pts.forEach((p, i) => {
          const q = pts[(i + 1) % pts.length];
          const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / (S / 2)));
          for (let k = 0; k < n; k++) dense.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
        });
        pts = dense;
        for (let k = 0; k < round; k++) pts = pts.map((p, i) => {
          const a = pts[(i - 1 + pts.length) % pts.length];
          const b = pts[(i + 1) % pts.length];
          return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4] as Pt;
        });
        if (jitter > 0) pts = jitterPoints(pts, jitter, seed + loops.length);
      }
      loops.push(smoothPoints(pts, smooth));
    }
  }
  return loops;
}

/** Masque net (canvas à la taille de l'image) des cases choisies. */
export function cellMask(inside: (x: number, y: number) => boolean, W: number, H: number, S: number): HTMLCanvasElement {
  const cv = canvas(W * S, H * S);
  const g = cv.getContext("2d")!;
  g.fillStyle = "#fff";
  g.beginPath();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y)) g.rect(x * S, y * S, S, S);
  g.fill();
  return cv;
}

/** Masque (canvas w×h) d'une forme vectorielle. */
export function shapeMask(shape: Shape, w: number, h: number): HTMLCanvasElement {
  const cv = canvas(w, h);
  const g = cv.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fill(shape.path, "evenodd");
  return cv;
}

// ——— Encre ———

export interface InkOpts {
  /** Épaisseur moyenne en px (2 par défaut). */
  width?: number;
  color?: string;
  /** Tremblement de la main en px (0,8 par défaut). */
  wobble?: number;
  /** Variation d'épaisseur le long du trait, 0 à 1 (0,45 par défaut). */
  pressure?: number;
  /** Longueur d'amincissement aux extrémités en px (8 par défaut ; ignorée si fermé). */
  taper?: number;
  closed?: boolean;
}

/** Trait d'encre tremblé, à épaisseur variable, le long d'une polyligne (fermée si `closed`). */
export function inkPolyline(g: CanvasRenderingContext2D, pts: Pt[], r: Rng, o: InkOpts = {}) {
  if (pts.length < 2) return;
  const { width = 2, color = INK, wobble = 0.8, pressure = 0.45, taper = 8, closed = false } = o;
  const src = closed ? [...pts, pts[0]] : pts;
  // Rééchantillonnage tous les ~4 px.
  const samp: Pt[] = [];
  const dist: number[] = [];
  let L = 0;
  for (let i = 0; i < src.length - 1; i++) {
    const [ax, ay] = src[i];
    const [bx, by] = src[i + 1];
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(d / 4));
    for (let k = 0; k < n; k++) {
      samp.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
      dist.push(L + (d * k) / n);
    }
    L += d;
  }
  samp.push(src[src.length - 1]);
  dist.push(L);
  // Ondulations basse fréquence : une valeur tous les 30 px, interpolée.
  const knots = Math.ceil(L / 30) + 2;
  const wob = Array.from({ length: knots }, () => r() * 2 - 1);
  const prs = Array.from({ length: knots }, () => r() * 2 - 1);
  if (closed) {
    wob[knots - 1] = wob[0];
    prs[knots - 1] = prs[0];
  }
  const interp = (arr: number[], s: number) => {
    const f = Math.min(knots - 1.0001, (s / Math.max(L, 1)) * (knots - 1));
    const i = Math.floor(f);
    const t = f - i;
    const u = t * t * (3 - 2 * t);
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < samp.length; i++) {
    const a = samp[Math.max(0, i - 1)];
    const b = samp[Math.min(samp.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const s = dist[i];
    const off = interp(wob, s) * wobble + (r() - 0.5) * wobble * 0.3;
    let w = width * (1 + interp(prs, s) * pressure);
    if (!closed && taper > 0) w *= 0.3 + 0.7 * Math.min(1, s / taper, (L - s) / taper);
    const cx = samp[i][0] - ty * off;
    const cy = samp[i][1] + tx * off;
    left.push([cx - ty * w * 0.5, cy + tx * w * 0.5]);
    right.push([cx + ty * w * 0.5, cy - tx * w * 0.5]);
  }
  g.fillStyle = color;
  g.beginPath();
  if (closed) {
    left.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    for (let i = right.length - 1; i >= 0; i--) (i === right.length - 1 ? g.moveTo : g.lineTo).call(g, right[i][0], right[i][1]);
    g.closePath();
    g.fill("evenodd");
  } else {
    left.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath();
    g.fill();
  }
}

/** Trait d'encre tremblé, à épaisseur variable, d'un point à un autre. */
export function inkLine(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: Rng, o: InkOpts = {}) {
  inkPolyline(g, [[x0, y0], [x1, y1]], r, o);
}

/** Contour d'encre d'un polygone ou de plusieurs boucles ; `double` repasse un second trait fin décalé (main qui insiste). */
export function inkOutline(g: CanvasRenderingContext2D, loops: Pt[] | Pt[][], r: Rng, o: InkOpts & { double?: boolean } = {}) {
  const list = (typeof loops[0]?.[0] === "number" ? [loops] : loops) as Pt[][];
  for (const loop of list) {
    inkPolyline(g, loop, r, { ...o, closed: true });
    if (o.double) inkPolyline(g, loop, r, { ...o, closed: true, width: (o.width ?? 2) * 0.4, wobble: (o.wobble ?? 0.8) * 2.2 });
  }
}

// ——— Couleur ———

/** Couleur #rrggbb éclaircie (amount > 0) ou assombrie (< 0), avec opacité. */
export function tint(hex: string, amount: number, alpha = 1): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgba(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)},${alpha})`;
}

/** Mélange de deux couleurs #rrggbb (t = 0 donne a, t = 1 donne b). */
export function mixColor(a: string, b: string, t: number): string {
  const p = (h: string) => {
    const n = parseInt(h.replace("#", "").slice(0, 6), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export interface WashOpts {
  /** Opacité du lavis (0,9 par défaut). */
  alpha?: number;
  /** Largeur du liseré de pigment accumulé au bord, en px (7 par défaut). */
  edge?: number;
  /** Force des taches de pigment, 0 à 1 (0,5 par défaut). */
  variation?: number;
  /** Taille moyenne des taches en px (40 par défaut). */
  blot?: number;
  /** Grain : densité de grains de pigment, 0 à 1 (0,5 par défaut). */
  granulation?: number;
}

/** Lavis d'aquarelle dans une zone : aplat transparent, taches de pigment, grain, bord plus sombre où l'eau a séché. */
export function washFill(g: CanvasRenderingContext2D, area: Area, color: string, r: Rng, o: WashOpts = {}) {
  const { alpha = 0.9, edge = 7, variation = 0.5, blot = 40, granulation = 0.5 } = o;
  const paintInside = (c: CanvasRenderingContext2D, [bx, by, bw, bh]: Box) => {
    c.fillStyle = tint(color, 0, alpha);
    c.fillRect(bx, by, bw, bh);
    // Taches : pigment plus dense ou délavé, en grands ronds doux.
    const n = Math.ceil((bw * bh) / (blot * blot)) + 1;
    for (let i = 0; i < n; i++) {
      const x = bx + r() * bw;
      const y = by + r() * bh;
      const rad = blot * (0.5 + r() * 1.1);
      const dark = r() < 0.55;
      const k = variation * (0.08 + r() * 0.1);
      const grad = c.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, dark ? tint(color, -0.18, k * 2) : tint(color, 0.16, k * 1.6));
      grad.addColorStop(1, tint(color, 0, 0));
      c.fillStyle = grad;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // Grain du pigment déposé dans le creux du papier.
    const grains = Math.round(((bw * bh) / 70) * granulation);
    c.fillStyle = tint(color, -0.25, 0.22);
    for (let i = 0; i < grains; i++) c.fillRect(bx + r() * bw, by + r() * bh, 1 + r(), 1 + r());
  };
  if (area instanceof HTMLCanvasElement) {
    const w = area.width;
    const h = area.height;
    const cv = canvas(w, h);
    const c = cv.getContext("2d")!;
    paintInside(c, [0, 0, w, h]);
    // Liseré : masque moins sa version floutée = bande intérieure le long du bord.
    if (edge > 0) {
      const rim = canvas(w, h);
      const rg = rim.getContext("2d")!;
      rg.drawImage(area, 0, 0);
      rg.globalCompositeOperation = "destination-out";
      rg.filter = `blur(${edge * 0.6}px)`;
      rg.drawImage(area, 0, 0);
      rg.filter = "none";
      rg.globalCompositeOperation = "source-in";
      rg.fillStyle = tint(color, -0.32, 0.85);
      rg.fillRect(0, 0, w, h);
      c.drawImage(rim, 0, 0);
    }
    c.globalCompositeOperation = "destination-in";
    c.drawImage(area, 0, 0);
    g.drawImage(cv, 0, 0);
    return;
  }
  g.save();
  g.clip(area.path, "evenodd");
  paintInside(g, area.box);
  if (edge > 0) {
    g.lineJoin = "round";
    for (const [w, a] of [[edge * 2, 0.1], [edge, 0.14], [2.2, 0.38]] as const) {
      g.strokeStyle = tint(color, -0.3, a);
      g.lineWidth = w;
      g.stroke(area.path);
    }
  }
  g.restore();
}

// ——— Hachures, pointillés ———

export interface HatchOpts {
  /** Angle des traits en radians (−π/4 par défaut, la main qui descend vers la gauche). */
  angle?: number;
  /** Écart entre traits en px (5 par défaut). */
  spacing?: number;
  width?: number;
  color?: string;
  /** Seconde passe croisée (décalée de ~70°). */
  cross?: boolean;
  /** « lignes » : traits parallèles interrompus ; « touffes » : petits paquets de traits d'orientations variées (façon Dyson). */
  mode?: "lignes" | "touffes";
  /** Taille d'une touffe en px (14 par défaut). */
  tuft?: number;
}

/** Hachures (croisées ou en touffes) dans une zone. */
export function hatch(g: CanvasRenderingContext2D, area: Area, r: Rng, o: HatchOpts = {}) {
  const { angle = -Math.PI / 4, spacing = 5, width = 0.9, color = INK, cross = false, mode = "lignes", tuft = 14 } = o;
  withArea(g, area, (c, [bx, by, bw, bh]) => {
    c.strokeStyle = color;
    c.lineCap = "round";
    if (mode === "touffes") {
      const step = tuft * 0.85;
      for (let y = by - step; y < by + bh + step; y += step)
        for (let x = bx - step; x < bx + bw + step; x += step) {
          const cx = x + (r() - 0.5) * step * 0.8;
          const cy = y + (r() - 0.5) * step * 0.8;
          const a = r() * Math.PI;
          const n = 3 + Math.floor(r() * 3);
          const len = tuft * (0.7 + r() * 0.5);
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          c.lineWidth = width * (0.7 + r() * 0.6);
          c.beginPath();
          for (let k = 0; k < n; k++) {
            const o2 = (k - (n - 1) / 2) * (len / n) * 0.9;
            const l = len * (0.75 + r() * 0.25) * 0.5;
            const px = cx - sa * o2;
            const py = cy + ca * o2;
            c.moveTo(px - ca * l, py - sa * l);
            c.lineTo(px + ca * l + (r() - 0.5), py + sa * l + (r() - 0.5));
          }
          c.stroke();
        }
      return;
    }
    const passes = cross ? [angle, angle + (Math.PI * 7) / 18] : [angle];
    const diag = Math.hypot(bw, bh);
    const mx = bx + bw / 2;
    const my = by + bh / 2;
    for (const a of passes) {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let d = -diag / 2; d <= diag / 2; d += spacing * (0.8 + r() * 0.4)) {
        // Un trait = plusieurs tirets de longueur variable, avec de petits sauts (la plume se relève).
        let s = -diag / 2 - r() * 20;
        while (s < diag / 2) {
          const len = 18 + r() * 60;
          const gap = r() < 0.7 ? 1 + r() * 3 : 6 + r() * 10;
          const px = mx - sa * d + ca * s;
          const py = my + ca * d + sa * s;
          const ex = px + ca * len;
          const ey = py + sa * len;
          c.lineWidth = width * (0.65 + r() * 0.7);
          c.beginPath();
          c.moveTo(px, py);
          c.quadraticCurveTo((px + ex) / 2 + (r() - 0.5) * 1.6, (py + ey) / 2 + (r() - 0.5) * 1.6, ex, ey);
          c.stroke();
          s += len + gap;
        }
      }
    }
  });
}

/** Pointillés dans une zone : `density` points par 100 px² (0,6 par défaut), rayon moyen `radius`. */
export function stipple(g: CanvasRenderingContext2D, area: Area, r: Rng, o: { density?: number; radius?: number; color?: string } = {}) {
  const { density = 0.6, radius = 0.9, color = INK } = o;
  withArea(g, area, (c, [bx, by, bw, bh]) => {
    const n = Math.round((bw * bh * density) / 100);
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const x = bx + r() * bw;
      const y = by + r() * bh;
      const rad = radius * (0.5 + r());
      c.moveTo(x + rad, y);
      c.arc(x, y, rad, 0, Math.PI * 2);
    }
    c.fill();
  });
}

/**
 * Masque adouci (canvas à la taille du masque) : flou rapide, calculé au quart de la taille puis agrandi.
 * `gain` redessine le masque plusieurs fois pour épaissir le halo.
 */
export function softMask(mask: HTMLCanvasElement, radius: number, gain = 1): HTMLCanvasElement {
  const k = 4;
  const small = canvas(mask.width / k, mask.height / k);
  const sg = small.getContext("2d")!;
  sg.filter = `blur(${radius / k}px)`;
  for (let i = 0; i < gain; i++) sg.drawImage(mask, 0, 0, small.width, small.height);
  const out = canvas(mask.width, mask.height);
  const og = out.getContext("2d")!;
  og.imageSmoothingQuality = "high";
  og.drawImage(small, 0, 0, mask.width, mask.height);
  return out;
}

// ——— Ombre, papier ———

/** Ombre portée d'une zone, décalée vers le bas à droite (lumière du haut à gauche), bord presque net. */
export function dropShadow(g: CanvasRenderingContext2D, area: Area, o: { dx?: number; dy?: number; blur?: number; color?: string } = {}) {
  const { dx = 5, dy = 7, blur = 1.5, color = "rgba(12,8,5,.55)" } = o;
  g.save();
  if (blur > 0) g.filter = `blur(${blur}px)`;
  if (area instanceof HTMLCanvasElement) {
    const cv = canvas(area.width, area.height);
    const c = cv.getContext("2d")!;
    c.drawImage(area, 0, 0);
    c.globalCompositeOperation = "source-in";
    c.fillStyle = color;
    c.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(cv, dx, dy);
  } else {
    g.translate(dx, dy);
    g.fillStyle = color;
    g.fill(area.path, "evenodd");
  }
  g.restore();
}

/** Grain de papier w×h (canvas à poser en « multiply ») : fibres, grain fin et grandes auréoles, sans motif répété. */
export function paperTexture(w: number, h: number, seed: number, strength = 1): HTMLCanvasElement {
  const T = 384;
  const tile = canvas(T, T);
  const tg = tile.getContext("2d")!;
  const img = tg.createImageData(T, T);
  const n1 = noise2(seed + 3);
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const k = (y * T + x) * 4;
      // grain fin + fibres allongées en diagonale
      const v = 248 + (hash(x, y, seed) - 0.5) * 14 * strength + n1(x / 3 + y / 9, y / 3 - x / 9) * 5 * strength;
      img.data[k] = Math.min(255, v + 4);
      img.data[k + 1] = Math.min(255, v + 1);
      img.data[k + 2] = Math.min(255, v - 5);
      img.data[k + 3] = 255;
    }
  tg.putImageData(img, 0, 0);
  const cv = canvas(w, h);
  const g = cv.getContext("2d")!;
  // Tuile posée avec décalage différent à chaque rangée et retournée une fois sur deux : la répétition ne se voit pas.
  for (let ty = 0, row = 0; ty < h; ty += T, row++)
    for (let tx = -Math.floor(hash(row, 0, seed) * T), col = 0; tx < w; tx += T, col++) {
      g.save();
      g.translate(tx + (col % 2 ? T : 0), ty + (row % 2 ? T : 0));
      g.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1);
      g.drawImage(tile, 0, 0);
      g.restore();
    }
  // Auréoles : l'eau a gondolé le papier et laissé des marques plus foncées.
  const r = rng(seed, 77);
  const n = Math.ceil((w * h) / 90000);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 80 + r() * 260;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(120,90,50,${0.03 * strength})`);
    grad.addColorStop(0.75, `rgba(120,90,50,${0.045 * strength})`);
    grad.addColorStop(0.92, `rgba(110,80,45,${0.06 * strength})`);
    grad.addColorStop(1, "rgba(120,90,50,0)");
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return cv;
}

/** Pose le grain de papier sur toute l'image (multiply). */
export function applyPaper(g: CanvasRenderingContext2D, seed: number, strength = 1) {
  const { width, height } = g.canvas;
  g.save();
  g.globalCompositeOperation = "multiply";
  g.drawImage(paperTexture(width, height, seed, strength), 0, 0);
  g.restore();
}

// ——— Interne ———

/** Canvas hors écran. */
export function canvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
}

/** Dessine `draw` limité à une zone (découpe vectorielle, ou calque recoupé par le masque). */
export function withArea(g: CanvasRenderingContext2D, area: Area, draw: (c: CanvasRenderingContext2D, box: Box) => void) {
  if (area instanceof HTMLCanvasElement) {
    const cv = canvas(area.width, area.height);
    const c = cv.getContext("2d")!;
    draw(c, [0, 0, area.width, area.height]);
    c.globalCompositeOperation = "destination-in";
    c.drawImage(area, 0, 0);
    g.drawImage(cv, 0, 0);
    return;
  }
  g.save();
  g.clip(area.path, "evenodd");
  draw(g, area.box);
  g.restore();
}
