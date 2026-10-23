// Rendu des cavernes, façon planche encrée au lavis. La roche est une masse brun-noir : seule une lèvre
// d'une case le long du sol prend la lumière (haut à gauche), taillée en facettes à deux valeurs aux arêtes
// encrées ; elle s'éteint en paliers francs, hachurés puis croisés, jusqu'au noir plein. Le sol, seule zone
// claire, mêle terre ocre, dalles naturelles, pierres plates, gravier et grain du papier ; un ruisseau sort d'une
// encoche de la paroi et rejoint le lac ; stalagmites, champignons, amas d'os, un campement abandonné, des rais
// de lumière tombés d'une fissure ; pénombre froide, ambre près du feu.
// Les cases restent la règle : le décor est purement visuel, petit dans les passages d'une case,
// jamais sur une porte, et le sol praticable se lit comme du sol. Tout vient de map.seed.
import { T } from "../../shared/types";
import { isOpen, isSolid, paintDoors, type MapCtx } from "./mapCommon";
import {
  INK,
  applyPaper,
  between,
  blobPoints,
  canvas,
  cellContour,
  inkLine,
  inkOutline,
  inkPolyline,
  jitterPoints,
  mixColor,
  noise2,
  pick,
  rng,
  shapeOf,
  smoothPoints,
  tint,
  washFill,
  type Pt,
  type Rng,
  type Shape,
} from "./mapInk";

/** Échelle des champs de distance : 1 pixel du champ pour F pixels de l'image. */
const F = 4;
/** Direction de la lumière (vers où elle va : du haut à gauche vers le bas à droite). */
const LX = Math.SQRT1_2;
const LY = Math.SQRT1_2;

type RGB = [number, number, number];
const rgbOf = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const lerp3 = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Rapproche une couleur de son gris (k = 0,5 : saturation divisée par deux). */
const desaturate = (hex: string, k: number) => {
  const [r0, g0, b0] = rgbOf(hex);
  const l = 0.3 * r0 + 0.59 * g0 + 0.11 * b0;
  const h = (v: number) => Math.round(v + (l - v) * k).toString(16).padStart(2, "0");
  return `#${h(r0)}${h(g0)}${h(b0)}`;
};
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ——— Champs ———

/** Transformée de distance (chanfrein 3-4) : distance de chaque pixel au plus proche pixel « source », en pixels du champ. */
function chamfer(src: Uint8Array, w: number, h: number): Float32Array {
  const d = new Float32Array(w * h);
  const BIG = 1e9;
  for (let i = 0; i < w * h; i++) d[i] = src[i] ? 0 : BIG;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - w] + 3);
        if (x > 0) v = Math.min(v, d[i - w - 1] + 4);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4);
      }
      d[i] = v;
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + 3);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + w - 1] + 4);
      }
      d[i] = v;
    }
  for (let i = 0; i < w * h; i++) d[i] /= 3;
  return d;
}

/** Masque binaire (au pas du champ) d'une forme vectorielle. */
function rasterize(shape: Shape, w: number, h: number): Uint8Array {
  const cv = canvas(w, h);
  const c = cv.getContext("2d", { willReadFrequently: true })!;
  c.scale(1 / F, 1 / F);
  c.fillStyle = "#fff";
  c.fill(shape.path, "evenodd");
  const data = c.getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  return out;
}

/** Courbes de niveau d'un champ (carrés marchants), en polylignes chaînées, coordonnées multipliées par `scale`. */
function isolines(f: Float32Array, w: number, h: number, level: number, scale: number): Pt[][] {
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    const la = adj.get(a);
    if (la) la.push(b);
    else adj.set(a, [b]);
    const lb = adj.get(b);
    if (lb) lb.push(a);
    else adj.set(b, [a]);
  };
  const Hh = (x: number, y: number) => (y * w + x) * 2;
  const Vv = (x: number, y: number) => (y * w + x) * 2 + 1;
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w - 1; x++) {
      const a = f[y * w + x] >= level;
      const b = f[y * w + x + 1] >= level;
      const cc = f[(y + 1) * w + x + 1] >= level;
      const d = f[(y + 1) * w + x] >= level;
      if (a === b && b === cc && cc === d) continue;
      const e: number[] = [];
      if (a !== b) e.push(Hh(x, y));
      if (b !== cc) e.push(Vv(x + 1, y));
      if (cc !== d) e.push(Hh(x, y + 1));
      if (d !== a) e.push(Vv(x, y));
      if (e.length === 2) link(e[0], e[1]);
      else if (e.length === 4) {
        // selle : on tranche selon la valeur au centre
        const mid = (f[y * w + x] + f[y * w + x + 1] + f[(y + 1) * w + x + 1] + f[(y + 1) * w + x]) / 4 >= level;
        if (a === mid) {
          link(e[0], e[1]);
          link(e[2], e[3]);
        } else {
          link(e[0], e[3]);
          link(e[1], e[2]);
        }
      }
    }
  const ptOf = (id: number): Pt => {
    const k = id >> 1;
    const x = k % w;
    const y = Math.floor(k / w);
    const va = f[k];
    const vb = id & 1 ? f[k + w] : f[k + 1];
    const t = Math.abs(vb - va) < 1e-6 ? 0.5 : clamp01((level - va) / (vb - va));
    return id & 1 ? [x * scale, (y + t) * scale] : [(x + t) * scale, y * scale];
  };
  const seen = new Set<number>();
  const lines: Pt[][] = [];
  const walk = (start: number) => {
    const line: Pt[] = [];
    let prev = -1;
    let cur = start;
    while (cur >= 0 && !seen.has(cur)) {
      seen.add(cur);
      line.push(ptOf(cur));
      const nb: number[] = adj.get(cur) ?? [];
      const nxt = nb.find((n) => n !== prev && !seen.has(n));
      prev = cur;
      cur = nxt ?? -1;
    }
    if (line.length > 3) lines.push(line);
  };
  for (const [id, nb] of adj) if (nb.length === 1 && !seen.has(id)) walk(id);
  for (const id of adj.keys()) if (!seen.has(id)) walk(id);
  return lines;
}

// ——— Géométrie ———

/** Points espacés de `step` le long d'une boucle fermée. */
function resampleLoop(loop: Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  let carry = 0;
  for (let i = 0; i < loop.length; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    let s = carry;
    while (s < len) {
      out.push([ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len]);
      s += step;
    }
    carry = s - len;
  }
  return out;
}

/** Normales unitaires d'une polyligne : (ty, −tx), c'est-à-dire vers la roche pour les contours de sol. */
function normalsOf(p: Pt[], closed: boolean): Pt[] {
  const n = p.length;
  return p.map((_, i) => {
    const a = p[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = p[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l] as Pt;
  });
}

/** Points régulièrement espacés le long d'une boucle, avec la normale vers la roche. */
function alongLoop(loop: Pt[], step: number): { x: number; y: number; nx: number; ny: number }[] {
  const pts = resampleLoop(loop, step);
  const nrm = normalsOf(pts, true);
  return pts.map(([x, y], i) => ({ x, y, nx: nrm[i][0], ny: nrm[i][1] }));
}

/**
 * Contour organique : chaque boucle est rééchantillonnée tous les quarts de case, puis poussée le long de sa
 * normale par un bruit à deux octaves et des « dents » (avancées et renfoncements). `limits` borne le
 * déplacement vers le sol (pour ne jamais fermer un passage) et vers la roche (pour ne pas percer une cloison).
 */
function organicLoops(
  loops: Pt[][],
  seed: number,
  S: number,
  amp: number,
  teeth: number,
  limits: (x: number, y: number, nx: number, ny: number) => [number, number],
): Pt[][] {
  const nA = noise2(seed + 1);
  const nB = noise2(seed + 2);
  const nC = noise2(seed + 3);
  return loops.map((loop, li) => {
    const pts = resampleLoop(loop, S / 4);
    const n = pts.length;
    if (n < 8) return loop;
    const nrm = normalsOf(pts, true);
    const r = rng(seed, 17, li);
    const disp = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      disp[i] = nA(x / (2.6 * S), y / (2.6 * S)) * amp + nB(x / (1.05 * S) + 50, y / (1.05 * S)) * amp * 0.45;
    }
    // dents : une avancée ou un renfoncement toutes les 1 à 3 cases
    if (teeth > 0)
      for (let i = Math.floor(r() * 6); i < n; i += 4 + Math.floor(r() * 9)) {
        const half = 1 + Math.floor(r() * 2.5);
        const a = between(r, 0.2, 0.5) * S * teeth * (r() < 0.55 ? 1 : -1);
        for (let j = -half * 2; j <= half * 2; j++) disp[(i + j + n) % n] += a * (0.5 + 0.5 * Math.cos((Math.PI * j) / (half * 2)));
      }
    const lim = pts.map(([x, y], i) => limits(x, y, nrm[i][0], nrm[i][1]));
    const clampAll = () => {
      for (let i = 0; i < n; i++) disp[i] = Math.max(-lim[i][0], Math.min(lim[i][1], disp[i]));
    };
    clampAll();
    for (let pass = 0; pass < 2; pass++) {
      const cp = disp.slice();
      for (let i = 0; i < n; i++) disp[i] = (cp[(i - 1 + n) % n] + 2 * cp[i] + cp[(i + 1) % n]) / 4;
      clampAll();
    }
    const out = pts.map(([x, y], i) => {
      const d = disp[i] + nC(x / 9, y / 9) * 1.3;
      return [x + nrm[i][0] * d, y + nrm[i][1] * d] as Pt;
    });
    return smoothPoints(out, 1);
  });
}

/** Spline de Catmull-Rom passant par les points, échantillonnée tous les `step` px. */
function catmullRom(p: Pt[], step: number): Pt[] {
  if (p.length < 3) return p;
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

/** Ruban (polygone) autour d'une polyligne : demi-largeur `half(i)`. */
function ribbon(p: Pt[], nrm: Pt[], half: (i: number) => number): Pt[] {
  const left = p.map(([x, y], i) => [x + nrm[i][0] * half(i), y + nrm[i][1] * half(i)] as Pt);
  const right = p.map(([x, y], i) => [x - nrm[i][0] * half(i), y - nrm[i][1] * half(i)] as Pt).reverse();
  return [...left, ...right];
}

/** Découpe une polyligne en morceaux de longueur variable dont certains sont sautés (trait repris à la main). */
function brokenRuns(line: Pt[], r: Rng, minLen: number, maxLen: number, skip: number, closed = false): Pt[][] {
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  let want = between(r, minLen, maxLen);
  let acc = 0;
  let drawing = r() > skip;
  const n = closed ? line.length + 1 : line.length;
  for (let i = 0; i < n; i++) {
    const p = line[i % line.length];
    if (cur.length) acc += Math.hypot(p[0] - cur[cur.length - 1][0], p[1] - cur[cur.length - 1][1]);
    cur.push(p);
    if (acc >= want) {
      if (drawing && cur.length > 1) runs.push(cur);
      cur = [p];
      acc = 0;
      want = between(r, minLen, maxLen) * (drawing ? 1 : 0.35);
      drawing = r() > skip;
    }
  }
  if (drawing && cur.length > 1) runs.push(cur);
  return runs;
}

const polyPath = (pts: Pt[]) => {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
};

/**
 * Traits de plume en fuseau : chaque trait est un mince polygone pointu aux deux bouts, renflé au milieu
 * (pression de la plume), légèrement courbé. Tous les traits d'une couleur sont remplis d'un seul coup.
 */
class Spindles {
  readonly path = new Path2D();
  add(x0: number, y0: number, x1: number, y1: number, w: number, bend = 0) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const mx = (x0 + x1) / 2 + nx * bend;
    const my = (y0 + y1) / 2 + ny * bend;
    const h = w; // les deux courbes s'écartent de ±w au contrôle : ≈ w d'épaisseur au milieu
    this.path.moveTo(x0, y0);
    this.path.quadraticCurveTo(mx + nx * h, my + ny * h, x1, y1);
    this.path.quadraticCurveTo(mx - nx * h, my - ny * h, x0, y0);
  }
  fill(g: CanvasRenderingContext2D, color: string) {
    g.fillStyle = color;
    g.fill(this.path);
  }
}

/** Hachures parallèles (angle `a`, pas `step`) qui couvrent la boîte ; à découper par un clip. */
function hatchBox(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, a: number, step: number) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const R = Math.hypot(w, h) / 2 + 2;
  g.beginPath();
  for (let k = -R; k <= R; k += step) {
    g.moveTo(cx - sa * k - ca * R, cy + ca * k - sa * R);
    g.lineTo(cx - sa * k + ca * R, cy + ca * k + sa * R);
  }
  g.stroke();
}

// ——— Objets ———

/**
 * Direction de la lumière en un point (vers où elle va), fixée par renderCave le temps du rendu : le feu et les
 * rais tombés des fissures l'emportent près d'eux, la lumière du haut à gauche partout ailleurs.
 */
let lightAt: (x: number, y: number) => Pt = () => [LX, LY];

/** Luminance maximale d'une face éclairée de pierre (fixée par renderCave sous celle du sol) : 1 = sans limite. */
let litMax = 1;

/** Assombrit une couleur vers l'encre jusqu'à passer sous litMax : une pierre ne brille jamais plus que le sol. */
function capLit(hex: string): string {
  const lumOf = (h: string) => {
    const [r0, g0, b0] = rgbOf(h);
    return (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255;
  };
  for (let k = 0; k < 12 && lumOf(hex) > litMax; k++) hex = mixColor(hex, INK, 0.08);
  return hex;
}

/** Centre (moyenne des sommets) d'un polygone. */
function centerOf(pts: Pt[]): Pt {
  let x = 0, y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
}

/**
 * Hachures d'ombre tirées pour un seul objet : angle de base ± 8°, pas de 2,5 à 4 px, traits de longueur et
 * d'épaisseur (0,6 à 1,2 px) inégales, chacun un fuseau un peu courbé. À découper par un clip.
 */
function looseHatch(g: CanvasRenderingContext2D, r: Rng, box: [number, number, number, number], a: number, color: string, gap0 = 2.5, gap1 = 4) {
  const [x0, y0, x1, y1] = box;
  const ang = a + (r() - 0.5) * 0.28;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  const gap = between(r, gap0, gap1);
  const sp = new Spindles();
  for (let k = -R; k <= R; k += gap * between(r, 0.8, 1.2)) {
    const t0 = -R * between(r, 0.6, 1), t1 = R * between(r, 0.6, 1);
    const ox = cx - sa * k, oy = cy + ca * k;
    sp.add(ox + ca * t0, oy + sa * t0, ox + ca * t1, oy + sa * t1, between(r, 0.6, 1.2), (r() - 0.5) * 1.2);
  }
  sp.fill(g, color);
}

/**
 * Ombre portée nette, à l'opposé de la source de lumière la plus proche : la silhouette balayée sur la longueur
 * de l'ombre (enveloppe de l'objet et de son décalage), un lavis léger puis des hachures propres à l'objet.
 */
function castShadow(g: CanvasRenderingContext2D, pts: Pt[], dx: number, dy: number, alpha: number) {
  const len = Math.hypot(dx, dy);
  const [cx, cy] = centerOf(pts);
  const [lx, ly] = lightAt(cx, cy);
  const ox = lx * len, oy = ly * len;
  const shape = len > 0.5 ? hull([...pts, ...pts.map(([x, y]) => [x + ox, y + oy] as Pt)]) : pts;
  const path = polyPath(shape);
  g.fillStyle = `rgba(12,8,4,${alpha * 0.45})`;
  g.fill(path);
  const box = boxOf(shape);
  if (box[2] - box[0] < 6) return;
  // une graine par objet, tirée de sa position : deux pierres voisines n'ont jamais les mêmes hachures
  const r = rng(Math.round(cx * 7.3) ^ Math.round(cy * 13.1), 97);
  g.save();
  g.clip(path);
  looseHatch(g, r, box, Math.atan2(ly, lx) - Math.PI / 4, `rgba(14,9,5,${Math.min(0.9, alpha * 1.3)})`);
  g.restore();
}

/**
 * Contour à l'encre dont l'épaisseur suit la lumière : fin côté éclairé (haut-gauche), gras côté ombre,
 * le trait gras s'amincissant aux bouts. Contour en sens horaire (normale extérieure = (ty, −tx)).
 */
function inkLitOutline(g: CanvasRenderingContext2D, pts: Pt[], r: Rng, thin: number, thick: number, color = INK, lx = LX, ly = LY) {
  if (thin > 0) inkPolyline(g, pts, r, { width: thin, wobble: 0.3, pressure: 0.3, taper: 0, closed: true, color });
  const n = pts.length;
  const facing = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const l = Math.hypot(ex, ey) || 1;
    return (ey / l) * lx + (-ex / l) * ly;
  });
  // départ sur une arête éclairée, pour ne pas couper un passage d'ombre en deux
  let start = facing.findIndex((f) => f <= 0.05);
  if (start < 0) start = 0;
  let run: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const i = (start + k) % n;
    if (k < n && facing[i] > 0.05) {
      if (!run.length) run.push(pts[i]);
      run.push(pts[(i + 1) % n]);
    } else if (run.length) {
      if (run.length > 1) inkPolyline(g, run, r, { width: thick, wobble: 0.3, pressure: 0.35, taper: 5, color });
      run = [];
    }
  }
}

/** Polygone homothétique de rapport k autour de (x, y). */
const scaled2 = (pts: Pt[], x: number, y: number, k: number) => pts.map(([px, py]) => [x + (px - x) * k, y + (py - y) * k] as Pt);

/** Enveloppe convexe (chaîne monotone d'Andrew), parcourue dans le sens horaire à l'écran. */
function hull(p: Pt[]): Pt[] {
  const s = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  const hi: Pt[] = [];
  for (const q of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = s.length - 1; i >= 0; i--) {
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], s[i]) <= 0) hi.pop();
    hi.push(s[i]);
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

/** Boîte englobante d'un polygone. */
function boxOf(pts: Pt[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

/**
 * Hachures d'ombre dans une facette : 4 à 8 traits parallèles couchés dans le sens de la lumière,
 * d'épaisseur et de longueur inégales, qui partent du côté sombre et s'arrêtent avant le côté clair.
 */
function facetHatch(g: CanvasRenderingContext2D, r: Rng, face: Pt[], color: string, minN = 4, maxN = 8) {
  const a = Math.atan2(LY, LX) + (r() - 0.5) * 0.35;
  const ux = Math.cos(a), uy = Math.sin(a);
  const vx = -uy, vy = ux;
  let v0 = Infinity, v1 = -Infinity, u0 = Infinity, u1 = -Infinity;
  for (const [x, y] of face) {
    const v = x * vx + y * vy;
    const u = x * ux + y * uy;
    v0 = Math.min(v0, v); v1 = Math.max(v1, v); u0 = Math.min(u0, u); u1 = Math.max(u1, u);
  }
  const span = v1 - v0;
  if (span < 3) return;
  const m = Math.max(minN, Math.min(maxN, Math.round(span / 2.6)));
  g.save();
  g.clip(polyPath(face));
  const sp = new Spindles();
  for (let k = 1; k <= m; k++) {
    const v = v0 + (span * k) / (m + 1) + (r() - 0.5) * 0.8;
    // du bout sombre (u grand) vers la lumière, plus ou moins loin
    const ue = u1 + 2;
    const us = u0 + (u1 - u0) * between(r, 0, 0.55);
    sp.add(vx * v + ux * us, vy * v + uy * us, vx * v + ux * ue, vy * v + uy * ue, between(r, 0.45, 0.95), (r() - 0.5) * 0.8);
  }
  sp.fill(g, color);
  g.restore();
}

/** Couleurs d'un rocher : corps (face d'ombre), face éclairée (plafonnée par l'appelant), encre. */
interface CragCols {
  body: string;
  lit: string;
}

/**
 * Rocher vu de dessus, dessiné comme à la plume : silhouette tirée au sort (5 à 9 sommets bruités, trapue,
 * allongée ou en éclat), une arête interne encrée qui sépare la face tournée vers la lumière (la plus proche :
 * feu, rai ou haut-gauche) de la face d'ombre ; seule cette dernière est hachurée. Ombre portée balayée,
 * contour fin côté lumière, gras côté ombre. `flat` : affleurement à fleur de sol (ombre courte, faible relief).
 */
function crag(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, rad: number, cols: CragCols, flat = false) {
  const [lx, ly] = lightAt(x, y);
  const px = -ly, py = lx; // le long de l'arête
  const kind = r();
  const n = flat ? 7 + Math.floor(r() * 4) : 5 + Math.floor(r() * 5);
  const asp = kind < 0.35 ? between(r, 0.42, 0.62) : between(r, 0.65, 1);
  const rot = r() * Math.PI;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = ((k + (r() - 0.5) * 0.75) / n) * Math.PI * 2;
    // éclat : quelques rentrants profonds ; sinon des rayons inégaux, jamais un ovale
    const notch = r() < (kind > 0.8 ? 0.35 : 0.15);
    const rr = rad * (notch ? between(r, 0.5, 0.68) : between(r, 0.78, 1.05));
    const ax = Math.cos(a) * rr, ay = Math.sin(a) * rr * asp;
    pts.push([x + ax * cr - ay * sr, y + ax * sr + ay * cr]);
  }
  castShadow(g, pts, flat ? rad * 0.18 + 2.5 : rad * 0.5 + 3, 0, flat ? 0.7 : 0.75);
  const path = polyPath(pts);
  g.fillStyle = cols.body;
  g.fill(path);
  // arête interne : une ligne brisée en travers de la lumière, décalée vers la source
  const off = rad * between(r, 0.02, 0.3);
  const ridge: Pt[] = [];
  const m = 3 + Math.floor(r() * 2);
  for (let k = 0; k <= m; k++) {
    const t = (k / m - 0.5) * 2.6 * rad;
    const j = (r() - 0.5) * rad * 0.32;
    ridge.push([x - lx * (off + j) + px * t, y - ly * (off + j) + py * t]);
  }
  g.save();
  g.clip(path);
  // face éclairée
  const litFace: Pt[] = [...ridge, [ridge[m][0] - lx * rad * 3, ridge[m][1] - ly * rad * 3], [ridge[0][0] - lx * rad * 3, ridge[0][1] - ly * rad * 3]];
  g.fillStyle = capLit(cols.lit);
  g.fill(polyPath(litFace));
  // gros bloc : une seconde facette, à mi-valeur, coupe la face éclairée
  if (rad > 13 && !flat) {
    const k = 1 + Math.floor(r() * (m - 1));
    const [qx, qy] = ridge[k];
    const b = Math.atan2(-ly, -lx) + (r() < 0.5 ? 1 : -1) * between(r, 0.5, 0.9);
    const tip: Pt = [qx + Math.cos(b) * rad * 2, qy + Math.sin(b) * rad * 2];
    const side = ridge[k + (b > Math.atan2(-ly, -lx) ? 1 : -1)] ?? ridge[m];
    g.fillStyle = mixColor(cols.lit, cols.body, 0.4);
    g.fill(polyPath([[qx, qy], tip, side]));
    inkLine(g, qx, qy, qx + Math.cos(b) * rad * 0.9, qy + Math.sin(b) * rad * 0.9, r, { width: 0.7, taper: 5, wobble: 0.2, color: "rgba(16,11,6,.7)" });
  }
  // face d'ombre : un lavis puis des hachures qui partent de l'arête vers le bord sombre
  const shadeFace: Pt[] = [...ridge, [ridge[m][0] + lx * rad * 3, ridge[m][1] + ly * rad * 3], [ridge[0][0] + lx * rad * 3, ridge[0][1] + ly * rad * 3]];
  const shade = polyPath(shadeFace);
  g.fillStyle = "rgba(14,9,5,.16)";
  g.fill(shade);
  g.clip(shade);
  {
    const sp = new Spindles();
    const gap = between(r, 2.5, 3.6) * (flat ? 1.15 : 1);
    const ha = Math.atan2(ly, lx) + (r() - 0.5) * 0.28;
    const hx = Math.cos(ha), hy = Math.sin(ha);
    for (let t = -1.4 * rad; t <= 1.4 * rad; t += gap * between(r, 0.8, 1.2)) {
      // point de départ : l'arête, à peu près
      const sx = x - lx * off + px * t, sy = y - ly * off + py * t;
      const s0 = between(r, -0.1, 0.35) * rad;
      const s1 = s0 + between(r, 0.5, 1.6) * rad;
      sp.add(sx + hx * s0, sy + hy * s0, sx + hx * s1, sy + hy * s1, between(r, 0.6, 1.2), (r() - 0.5) * 1);
    }
    sp.fill(g, flat ? "rgba(12,8,4,.62)" : "rgba(10,6,3,.78)");
  }
  g.restore();
  // grain : quelques piqûres sur la face éclairée
  if (rad > 9) {
    g.save();
    g.clip(path);
    g.fillStyle = "rgba(16,11,6,.4)";
    g.beginPath();
    for (let k = 0; k < (rad * rad) / 30; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad * 0.9;
      const qx = x + Math.cos(a) * d, qy = y + Math.sin(a) * d * asp;
      const s = between(r, 0.35, 0.8);
      g.moveTo(qx + s, qy);
      g.arc(qx, qy, s, 0, Math.PI * 2);
    }
    g.fill();
    g.restore();
  }
  // l'arête, à l'encre, s'arrête au contour
  g.save();
  g.clip(path);
  inkPolyline(g, ridge, r, { width: between(r, 0.8, 1.25), taper: 6, wobble: 0.25, pressure: 0.4, color: "rgba(14,9,5,.85)" });
  g.restore();
  if (flat && r() < 0.6) vCrack(g, r, x + (r() - 0.5) * rad * 0.6, y + (r() - 0.5) * rad * 0.4, rot + (r() - 0.5) * 1.2, rad * between(r, 0.5, 0.9), 1);
  inkLitOutline(g, pts, r, flat ? 0.9 : 1.05, (flat ? 2 : 2.3) + rad * 0.03, "rgba(14,9,5,.95)", lx, ly);
}

/** Gros bloc libre : corps un peu plus sombre que sa couleur, face éclairée à peine plus claire. */
function boulder(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, rad: number, col: string) {
  crag(g, r, x, y, rad, { body: mixColor(col, INK, 0.14), lit: mixColor(col, "#efe3c8", 0.08) });
}

/** Pierre anguleuse vue de dessus : ombre portée, face éclairée en haut à gauche, face d'ombre hachurée, encre. */
function stone(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, rad: number, col: string, verts = 0) {
  if (rad > 7.5) return boulder(g, r, x, y, rad, col);
  // chaque pierre a sa valeur et sa forme : anguleuse, roulée ou en éclat plat
  col = mixColor(col, r() < 0.8 ? INK : "#d9ccae", between(r, 0, 0.2));
  const kind = verts ? 0 : r();
  const rot = r() * Math.PI;
  const pts =
    kind < 0.45
      ? blobPoints(r, x, y, rad, rad * between(r, 0.62, 1), verts || 5 + Math.floor(r() * 3), 0.3, rot)
      : kind < 0.75
        ? smoothPoints(blobPoints(r, x, y, rad, rad * between(r, 0.6, 1), 5 + Math.floor(r() * 5), 0.28, rot), 1)
        : blobPoints(r, x, y, rad * 1.2, rad * between(r, 0.38, 0.55), 5 + Math.floor(r() * 2), 0.2, rot);
  castShadow(g, pts, rad * 0.35 + 0.8, rad * 0.45 + 1.2, 0.55);
  const path = polyPath(pts);
  g.fillStyle = tint(col, -0.05);
  g.fill(path);
  if (rad < 2.6) {
    g.strokeStyle = INK;
    g.lineWidth = 0.6;
    g.stroke(path);
    return;
  }
  // arête qui sépare la face éclairée de la face d'ombre, en travers de la lumière la plus proche
  const [llx, lly] = lightAt(x, y);
  const a = Math.atan2(lly, llx) + (r() - 0.5) * 0.9;
  const dx = -Math.cos(a);
  const dy = -Math.sin(a);
  const ox = x + dx * rad * 0.12;
  const oy = y + dy * rad * 0.12;
  const px = -dy;
  const py = dx;
  g.save();
  g.clip(path);
  g.fillStyle = capLit(mixColor(col, "#efe3c8", 0.13));
  g.beginPath();
  g.moveTo(ox + px * rad * 3, oy + py * rad * 3);
  g.lineTo(ox - px * rad * 3, oy - py * rad * 3);
  g.lineTo(ox - px * rad * 3 + dx * rad * 3, oy - py * rad * 3 + dy * rad * 3);
  g.lineTo(ox + px * rad * 3 + dx * rad * 3, oy + py * rad * 3 + dy * rad * 3);
  g.fill();
  if (rad > 3.5) {
    g.strokeStyle = "rgba(22,16,10,.6)";
    g.lineWidth = 0.6;
    g.beginPath();
    for (let k = -rad; k <= rad; k += 2.1) {
      g.moveTo(ox + px * k - dx * 1, oy + py * k - dy * 1);
      g.lineTo(ox + px * k - dx * rad * 1.3, oy + py * k - dy * rad * 1.3);
    }
    g.stroke();
  }
  g.restore();
  if (rad > 4.5) inkLine(g, ox + px * rad * 0.7, oy + py * rad * 0.7, ox - px * rad * 0.5, oy - py * rad * 0.5, r, { width: 0.6, taper: 3, wobble: 0.2, color: "rgba(22,16,10,.75)" });
  inkOutline(g, pts, r, { width: 0.55 + rad * 0.06, wobble: 0.25, pressure: 0.5 });
}

/** Stalagmite vue de dessus : anneaux concentriques irréguliers, ombre allongée, hachures en arcs côté ombre. */
function stalagmite(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, R: number, col: string, ink = 1.5) {
  const base = smoothPoints(blobPoints(r, x, y, R, R * between(r, 0.82, 1), 11, 0.26, r() * Math.PI), 1);
  // ombre portée allongée, à l'opposé de la lumière la plus proche
  const [lx, ly] = lightAt(x, y);
  const shade = new Path2D();
  for (const k of [0.25, 0.55, 0.85, 1.15, 1.45]) {
    const s = 1 - k * 0.22;
    base.forEach(([px, py], i) => {
      const qx = x + (px - x) * s + lx * R * k * 1.7;
      const qy = y + (py - y) * s + ly * R * k * 1.7;
      if (i) shade.lineTo(qx, qy);
      else shade.moveTo(qx, qy);
    });
    shade.closePath();
  }
  g.fillStyle = "rgba(12,8,4,.22)";
  g.fill(shade, "nonzero");
  g.save();
  g.clip(shade, "nonzero");
  looseHatch(g, r, [x - R * 3, y - R * 3, x + R * 3, y + R * 3], Math.atan2(ly, lx) - Math.PI / 4, "rgba(14,9,5,.6)");
  g.restore();
  const tipX = x - lx * R * between(r, 0.26, 0.4);
  const tipY = y - ly * R * between(r, 0.26, 0.4);
  const grad = g.createRadialGradient(tipX - R * 0.2, tipY - R * 0.2, 0, x, y, R * 1.1);
  // pointe à peine plus claire que la roche : un cône de pierre, pas un œuf
  grad.addColorStop(0, mixColor(col, "#efe3c8", 0.16));
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, mixColor(col, INK, 0.35));
  const path = polyPath(base);
  g.fillStyle = grad;
  g.fill(path);
  // hachures droites sur la moitié à l'ombre (pas d'arcs concentriques : on lirait une cible)
  {
    const dots = base.map(([px, py]) => (px - x) * LX + (py - y) * LY);
    const s0 = dots.findIndex((d) => d < -R * 0.1);
    const half: Pt[] = [];
    for (let k = 0; k < base.length; k++) {
      const i = (Math.max(0, s0) + k) % base.length;
      if (dots[i] >= -R * 0.1) half.push(base[i]);
    }
    if (half.length >= 3) facetHatch(g, r, half, "rgba(14,9,5,.62)", 4, 7);
  }
  // cannelures : des arêtes qui descendent de la pointe, plus marquées du côté de l'ombre (on lit un cône)
  if (R > 7) {
    const nf = 4 + Math.floor(r() * 3);
    for (let k = 0; k < nf; k++) {
      // seulement sur la moitié à l'ombre, à intervalles inégaux (sinon on lit un coquillage)
      const a = Math.atan2(LY, LX) + (r() - 0.5) * 2.4;
      const sh = Math.cos(a) * LX + Math.sin(a) * LY;
      const r0 = R * between(r, 0.2, 0.4), r1 = R * between(r, 0.6, 0.95);
      inkLine(g, tipX + Math.cos(a) * r0, tipY + Math.sin(a) * r0, tipX + Math.cos(a) * r1 + (x - tipX) * 0.6, tipY + Math.sin(a) * r1 + (y - tipY) * 0.6, r, { width: 0.5 + 0.5 * clamp01(sh + 0.5), taper: 5, wobble: 0.2, color: "rgba(16,11,6,.7)" });
    }
  }
  // un anneau de calcaire, interrompu, autour de la pointe
  if (R > 9) {
    const k = between(r, 0.45, 0.6);
    const ring = base.map(([px, py]) => [tipX + (px - x) * k + (r() - 0.5) * 0.8, tipY + (py - y) * k + (r() - 0.5) * 0.8] as Pt);
    for (const run of brokenRuns(ring, r, R * 0.8, R * 2.2, 0.45, true)) inkPolyline(g, run, r, { width: 0.6 + R * 0.012, wobble: 0.35, taper: 4, color: "rgba(22,16,10,.6)" });
  }
  if (R > 12 && r() < 0.5) crack(g, r, x + (r() - 0.5) * R * 0.5, y + (r() - 0.5) * R * 0.5, r() * Math.PI * 2, 0.7, 1);
  inkLitOutline(g, base, r, ink * 0.6, ink * 1.35);
  g.fillStyle = tint(mixColor(col, "#efe3c8", 0.35), 0, 0.7);
  g.beginPath();
  g.arc(tipX - R * 0.04, tipY - R * 0.04, Math.max(0.8, R * 0.07), 0, Math.PI * 2);
  g.fill();
}

/**
 * Champignon vu de trois quarts : pied pâle qui part du sol (x, y), chapeau bombé au-dessus, lamelles
 * sombres sous le bord, reflet et taches ; ombre hachurée au sol vers le bas à droite.
 */
function mushroom(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number, col: string, lean: number) {
  const h = s * between(r, 1.05, 1.5);
  const tx = x + Math.sin(lean) * h;
  const ty = y - Math.cos(lean) * h;
  const foot: Pt[] = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 10) * Math.PI * 2;
    return [x + s * 0.9 + Math.cos(a) * s * 0.95, y + s * 0.35 + Math.sin(a) * s * 0.42] as Pt;
  });
  castShadow(g, foot, 0, 0, 0.42);
  // pied
  const sw = s * 0.24;
  const stem = new Path2D();
  stem.moveTo(x - sw * 1.2, y);
  stem.quadraticCurveTo(x - sw * 0.6, (y + ty) / 2, tx - sw, ty);
  stem.lineTo(tx + sw, ty);
  stem.quadraticCurveTo(x + sw * 0.7, (y + ty) / 2, x + sw * 1.2, y);
  stem.quadraticCurveTo(x, y + sw * 0.6, x - sw * 1.2, y);
  g.fillStyle = "#e6dcc4";
  g.fill(stem);
  g.save();
  g.clip(stem);
  g.fillStyle = "rgba(60,44,30,.35)";
  g.fillRect(x + sw * 0.15, ty, sw * 2, y - ty + sw);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = s > 6 ? 0.9 : 0.7;
  g.stroke(stem);
  // dessous du chapeau : lamelles qui rayonnent du pied
  const ry = s * 0.3;
  g.fillStyle = tint(col, -0.32);
  g.beginPath();
  g.ellipse(tx, ty, s, ry, lean * 0.3, 0, Math.PI * 2);
  g.fill();
  if (s > 5) {
    g.strokeStyle = "rgba(22,16,10,.6)";
    g.lineWidth = 0.5;
    g.beginPath();
    for (let k = 1; k < 9; k++) {
      const a = (k / 9) * Math.PI;
      g.moveTo(tx, ty + ry * 0.1);
      g.lineTo(tx + Math.cos(a) * s * 0.95, ty + Math.sin(a) * ry * 0.95);
    }
    g.stroke();
  }
  // chapeau bombé
  const cap = new Path2D();
  cap.ellipse(tx, ty, s, s * 0.72, lean * 0.3, Math.PI, Math.PI * 2);
  cap.quadraticCurveTo(tx, ty + ry * 0.55, tx - s * Math.cos(lean * 0.3), ty - s * Math.sin(lean * 0.3));
  const grad = g.createRadialGradient(tx - s * 0.4, ty - s * 0.5, 0, tx, ty - s * 0.2, s * 1.1);
  grad.addColorStop(0, tint(col, 0.22));
  grad.addColorStop(0.6, col);
  grad.addColorStop(1, tint(col, -0.18));
  g.fillStyle = grad;
  g.fill(cap);
  if (s > 5) {
    // modelé hachuré côté ombre, taches, reflet
    g.save();
    g.clip(cap);
    g.strokeStyle = "rgba(22,16,10,.4)";
    g.lineWidth = 0.55;
    hatchBox(g, tx + s * 0.25, ty - s, s, s, Math.PI / 3, 1.8);
    g.restore();
    g.fillStyle = "rgba(255,250,232,.8)";
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.ellipse(tx + (r() - 0.6) * s * 1.1, ty - s * between(r, 0.2, 0.55), s * 0.09, s * 0.06, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(255,248,230,.6)";
    g.lineWidth = Math.max(0.8, s * 0.1);
    g.beginPath();
    g.ellipse(tx, ty, s * 0.62, s * 0.45, lean * 0.3, Math.PI * 1.1, Math.PI * 1.45);
    g.stroke();
  }
  g.strokeStyle = INK;
  g.lineWidth = s > 6 ? 1.1 : 0.8;
  g.stroke(cap);
}

/** Os long : diaphyse, deux têtes doubles, encre puis os, ombre portée et liseré d'ombre. */
function bone(g: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, col: string) {
  const ca = Math.cos(ang) * len * 0.5;
  const sa = Math.sin(ang) * len * 0.5;
  const px = -Math.sin(ang);
  const py = Math.cos(ang);
  const k = Math.max(1.4, len * 0.085);
  const shape = (dx: number, dy: number, grow: number) => {
    const p = new Path2D();
    p.moveTo(x - ca + px * k * 0.5 + dx, y - sa + py * k * 0.5 + dy);
    p.lineTo(x + ca + px * k * 0.5 + dx, y + sa + py * k * 0.5 + dy);
    p.lineTo(x + ca - px * k * 0.5 + dx, y + sa - py * k * 0.5 + dy);
    p.lineTo(x - ca - px * k * 0.5 + dx, y - sa - py * k * 0.5 + dy);
    p.closePath();
    for (const e of [-1, 1])
      for (const s of [-1, 1]) {
        const cx = x + e * ca + px * s * k * 0.62 + dx;
        const cy = y + e * sa + py * s * k * 0.62 + dy;
        p.moveTo(cx + k * 0.78 + grow, cy);
        p.arc(cx, cy, k * 0.78 + grow, 0, Math.PI * 2);
      }
    return p;
  };
  g.fillStyle = "rgba(12,8,4,.45)";
  g.fill(shape(1.6, 2.2, 0), "nonzero");
  g.fillStyle = INK;
  g.fill(shape(0, 0, 0.9), "nonzero");
  g.fillStyle = col;
  g.fill(shape(0, 0, 0), "nonzero");
  g.strokeStyle = tint(col, -0.3, 0.8);
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(x - ca * 0.8 - px * k * 0.3, y - sa * 0.8 - py * k * 0.3);
  g.lineTo(x + ca * 0.8 - px * k * 0.3, y + sa * 0.8 - py * k * 0.3);
  g.stroke();
}

/** Crâne vu de dessus et un peu de face : boîte crânienne, orbites, fosse nasale, mâchoire et dents. */
function skull(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number, col: string, ang = r() * Math.PI * 2) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  g.fillStyle = "rgba(12,8,4,.45)";
  g.beginPath();
  g.ellipse(s * 0.25, s * 0.35, s * 0.62, s * 0.72, 0, 0, Math.PI * 2);
  g.fill();
  // mâchoire supérieure (vers +y)
  const jaw = new Path2D();
  jaw.moveTo(-s * 0.36, s * 0.28);
  jaw.quadraticCurveTo(-s * 0.36, s * 0.78, 0, s * 0.82);
  jaw.quadraticCurveTo(s * 0.36, s * 0.78, s * 0.36, s * 0.28);
  jaw.closePath();
  const cran = new Path2D();
  cran.ellipse(0, -s * 0.05, s * 0.55, s * 0.62, 0, 0, Math.PI * 2);
  for (const p of [jaw, cran]) {
    g.fillStyle = col;
    g.fill(p);
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.stroke(p);
  }
  g.fillStyle = col;
  g.fill(cran);
  // modelé : ombre du côté droit
  g.save();
  g.clip(cran);
  g.strokeStyle = "rgba(22,16,10,.45)";
  g.lineWidth = 0.6;
  g.beginPath();
  for (let k = 0; k < 5; k++) {
    g.moveTo(s * (0.15 + k * 0.1), -s * 0.6);
    g.lineTo(s * (0.35 + k * 0.1), s * 0.4);
  }
  g.stroke();
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.stroke(cran);
  // orbites et nez
  g.fillStyle = INK;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * s * 0.22, s * 0.3, s * 0.15, s * 0.13, sx * 0.3, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.moveTo(0, s * 0.44);
  g.lineTo(-s * 0.07, s * 0.58);
  g.lineTo(s * 0.07, s * 0.58);
  g.closePath();
  g.fill();
  // dents
  g.strokeStyle = INK;
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(-s * 0.2, s * 0.7);
  g.quadraticCurveTo(0, s * 0.78, s * 0.2, s * 0.7);
  for (let k = -2; k <= 2; k++) {
    g.moveTo(k * s * 0.07, s * 0.68);
    g.lineTo(k * s * 0.07, s * 0.78);
  }
  g.stroke();
  // suture et reflet
  g.lineWidth = 0.5;
  g.beginPath();
  g.moveTo(-s * 0.05, -s * 0.6);
  g.lineTo(s * 0.03, -s * 0.35);
  g.lineTo(-s * 0.02, -s * 0.15);
  g.stroke();
  g.fillStyle = "rgba(255,250,236,.75)";
  g.beginPath();
  g.ellipse(-s * 0.2, -s * 0.28, s * 0.12, s * 0.07, -0.6, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Squelette allongé (tête vers −y dans le repère tourné) : crâne, colonne, côtes, bassin, membres. */
function skeleton(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, ang: number, S: number, col: string) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const L = S * 1.45;
  // colonne
  const spine: Pt[] = [];
  for (let k = 0; k <= 10; k++) spine.push([Math.sin(k * 0.5 + r()) * 1.5, -L * 0.3 + (k / 10) * L * 0.5]);
  // côtes
  for (let k = 0; k < 5; k++) {
    const [sx, sy] = spine[1 + k];
    for (const side of [-1, 1]) {
      const rad = S * (0.2 - k * 0.012);
      for (const [w, c] of [[2.8, INK], [1.4, col]] as const) {
        g.strokeStyle = c;
        g.lineWidth = w;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(sx, sy);
        g.quadraticCurveTo(sx + side * rad * 1.1, sy - rad * 0.2, sx + side * rad * 0.9, sy + rad * 0.75);
        g.stroke();
      }
    }
  }
  for (const [w, c] of [[3.6, INK], [2, col]] as const) {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.beginPath();
    spine.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
  }
  // vertèbres
  g.fillStyle = INK;
  for (const [px, py] of spine) g.fillRect(px - 1.2, py - 0.4, 2.4, 0.8);
  // bassin
  const [bx, by] = spine[spine.length - 1];
  g.fillStyle = col;
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(bx, by + S * 0.04, S * 0.17, S * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = INK;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(bx + side * S * 0.07, by + S * 0.05, S * 0.035, S * 0.03, 0, 0, Math.PI * 2);
    g.fill();
  }
  // bras et jambes, un peu de travers
  const limbs: [number, number, number, number][] = [
    [-S * 0.2, -L * 0.22, S * 0.42, Math.PI / 2 + 0.5 + (r() - 0.5) * 0.6],
    [S * 0.2, -L * 0.22, S * 0.4, Math.PI / 2 - 0.4 + (r() - 0.5) * 0.9],
    [-S * 0.1, by + S * 0.28, S * 0.48, Math.PI / 2 + 0.15 + (r() - 0.5) * 0.3],
    [S * 0.12, by + S * 0.3, S * 0.48, Math.PI / 2 - 0.25 + (r() - 0.5) * 0.5],
  ];
  for (const [lx, ly, len, a] of limbs) bone(g, lx, ly, len, a, col);
  g.restore();
  skull(g, r, x + Math.sin(ang) * L * 0.42, y - Math.cos(ang) * L * 0.42, S * 0.3, col, ang + Math.PI + (r() - 0.5) * 0.8);
}

/** Épée rouillée posée au sol. */
function sword(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, ang: number, S: number) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const L = S * 0.85;
  g.fillStyle = "rgba(12,8,4,.4)";
  g.fillRect(-L * 0.45 + 2, -1.6 + 2.5, L, 3.6);
  const blade = new Path2D();
  blade.moveTo(-L * 0.25, -1.9);
  blade.lineTo(L * 0.5, -0.8);
  blade.lineTo(L * 0.56, 0);
  blade.lineTo(L * 0.5, 0.8);
  blade.lineTo(-L * 0.25, 1.9);
  blade.closePath();
  g.fillStyle = "#8d8a80";
  g.fill(blade);
  g.fillStyle = "rgba(140,70,30,.55)";
  for (let k = 0; k < 5; k++) g.fillRect(between(r, -L * 0.2, L * 0.4), between(r, -1.6, 1), between(r, 1.5, 4), 1.2);
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.stroke(blade);
  g.beginPath();
  g.moveTo(-L * 0.22, 0);
  g.lineTo(L * 0.45, 0);
  g.lineWidth = 0.5;
  g.stroke();
  g.fillStyle = "#4a3a28";
  g.fillRect(-L * 0.28, -5, 3, 10);
  g.strokeRect(-L * 0.28, -5, 3, 10);
  g.fillStyle = "#3a2a1a";
  g.fillRect(-L * 0.45, -1.4, L * 0.17, 2.8);
  g.strokeRect(-L * 0.45, -1.4, L * 0.17, 2.8);
  g.restore();
}

/**
 * Fissure en V dans la roche : une ligne brisée à l'encre, effilée, et sa lèvre claire du côté de la lumière
 * (la paroi de la fente qui fait face au haut-gauche).
 */
function vCrack(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, a: number, len: number, w = 1.2) {
  const pts: Pt[] = [[x, y]];
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    a += (r() - 0.5) * 1.1;
    const l = (len / n) * between(r, 0.7, 1.3);
    const [lx, ly] = pts[pts.length - 1];
    pts.push([lx + Math.cos(a) * l, ly + Math.sin(a) * l]);
  }
  inkPolyline(g, pts.map(([px, py]) => [px + 0.9, py + 0.9] as Pt), r, { width: w * 0.7, taper: 8, wobble: 0.2, color: "rgba(255,244,214,.28)" });
  inkPolyline(g, pts, r, { width: w, taper: 10, wobble: 0.3, pressure: 0.4, color: "rgba(16,11,6,.9)" });
  if (r() < 0.5) {
    const k = 1 + Math.floor(r() * (pts.length - 2));
    const b = a + (r() < 0.5 ? 1 : -1) * between(r, 0.6, 1.1);
    const l = len * between(r, 0.25, 0.45);
    inkLine(g, pts[k][0], pts[k][1], pts[k][0] + Math.cos(b) * l, pts[k][1] + Math.sin(b) * l, r, { width: w * 0.6, taper: 6, wobble: 0.3, color: "rgba(16,11,6,.8)" });
  }
}

/** Fissure ramifiée : tronc de 3 à 7 segments qui s'amincit, 0 à 2 branches. */
function crack(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, a: number, width: number, depth = 0) {
  const pts: Pt[] = [[x, y]];
  const n = 3 + Math.floor(r() * 5) - depth * 2;
  for (let s = 0; s < n; s++) {
    a += (r() - 0.5) * 0.9;
    const l = between(r, 5, 11) * (1 - depth * 0.3);
    const [lx, ly] = pts[pts.length - 1];
    pts.push([lx + Math.cos(a) * l, ly + Math.sin(a) * l]);
  }
  inkPolyline(g, pts, r, { width, taper: 14, wobble: 0.3, pressure: 0.35, color: "rgba(22,16,10,.8)" });
  if (depth < 1) {
    const branches = Math.floor(r() * 3);
    for (let b = 0; b < branches; b++) {
      const k = 1 + Math.floor(r() * (pts.length - 2));
      crack(g, r, pts[k][0], pts[k][1], a + (r() < 0.5 ? 1 : -1) * between(r, 0.5, 1.1), width * 0.6, depth + 1);
    }
  }
}

// ——— Campement ———

/** Couchage roulé, vu de dessus : couverture repliée, plis, rouleau de tête. Repère : centre, axe long vertical. */
function bedroll(g: CanvasRenderingContext2D, r: Rng, w: number, h: number, col: string) {
  const outline = (inset: number): Path2D => {
    const p = new Path2D();
    const rr = 5;
    p.roundRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, rr);
    return p;
  };
  g.save();
  g.translate(2.5, 3.5);
  g.fillStyle = "rgba(12,8,4,.4)";
  g.fill(outline(0));
  g.restore();
  washFill(g, { path: outline(0), box: [-w / 2, -h / 2, w, h] }, col, r, { alpha: 0.96, edge: 3, blot: 9, granulation: 0.9 });
  // couverture rabattue : triangle plus clair, ombre sous le pli
  g.fillStyle = tint(col, 0.12);
  g.beginPath();
  g.moveTo(-w / 2 + 1, -h * 0.05);
  g.lineTo(w / 2 - 1, -h * 0.16);
  g.lineTo(w / 2 - 1, h * 0.04);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(12,8,4,.3)";
  g.beginPath();
  g.moveTo(-w / 2 + 1, -h * 0.05);
  g.lineTo(w / 2 - 1, h * 0.04);
  g.lineTo(w / 2 - 1, h * 0.09);
  g.lineTo(-w / 2 + 1, h * 0.01);
  g.closePath();
  g.fill();
  inkLine(g, -w / 2 + 1, -h * 0.05, w / 2 - 1, -h * 0.16, r, { width: 0.9, taper: 2 });
  inkLine(g, -w / 2 + 1, -h * 0.05, w / 2 - 1, h * 0.04, r, { width: 1, taper: 2 });
  // rouleau de tête
  const ry = -h / 2 + 6;
  g.fillStyle = tint(col, -0.08);
  g.beginPath();
  g.ellipse(0, ry, w / 2 - 0.5, 5.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(22,16,10,.6)";
  g.lineWidth = 0.6;
  g.beginPath();
  for (const k of [-0.25, 0.1]) {
    g.moveTo(-w / 2 + 2, ry + k * 10);
    g.quadraticCurveTo(0, ry + k * 10 + 2, w / 2 - 2, ry + k * 10);
  }
  g.stroke();
  // le bout loin du feu (en haut dans ce repère) retombe dans l'ombre : hachures qui s'arrêtent avant le pli
  g.save();
  g.clip(outline(0));
  g.beginPath();
  g.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h * between(r, 0.3, 0.4));
  g.clip();
  looseHatch(g, r, [-w / 2, -h / 2, w / 2, -h / 8], Math.PI * between(r, 0.3, 0.45), "rgba(16,11,6,.55)", 2.2, 3);
  g.restore();
  // trois ou quatre plis encrés, en travers de la couverture
  const nf = 3 + Math.floor(r() * 2);
  for (let q = 0; q < nf; q++) {
    const y0 = between(r, -h * 0.02, h * 0.42);
    const x0 = between(r, -w / 2 + 2, -w / 6), x1 = between(r, w / 8, w / 2 - 2);
    inkPolyline(g, [[x0, y0], [(x0 + x1) / 2 + between(r, -2, 2), y0 + between(r, -3, 3)], [x1, y0 + between(r, -3, 4)]], r, { width: between(r, 0.7, 1.05), taper: 5, wobble: 0.3, color: "rgba(16,11,6,.8)" });
  }
  inkOutline(g, [[-w / 2, -h / 2 + 3], [w / 2, -h / 2 + 2], [w / 2 + 0.5, h / 2 - 2], [-w / 2 + 0.5, h / 2 - 1]], r, { width: 1.25, wobble: 0.35 });
}

/** Sac de toile noué, vu de dessus. */
function sack(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number, col: string) {
  const pts = smoothPoints(blobPoints(r, x, y, s, s * 0.85, 8, 0.18, r() * Math.PI), 2);
  castShadow(g, pts, s * 0.35, s * 0.45, 0.45);
  const grad = g.createRadialGradient(x - s * 0.35, y - s * 0.35, 1, x, y, s * 1.1);
  grad.addColorStop(0, tint(col, 0.14));
  grad.addColorStop(1, tint(col, -0.16));
  g.fillStyle = grad;
  g.fill(polyPath(pts));
  // plis qui convergent vers le nœud
  const kx = x + between(r, -0.15, 0.15) * s;
  const ky = y + between(r, -0.15, 0.15) * s;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + r() * 0.6;
    inkLine(g, kx + Math.cos(a) * s * 0.25, ky + Math.sin(a) * s * 0.25, kx + Math.cos(a) * s * 0.8, ky + Math.sin(a) * s * 0.8, r, { width: 0.55, taper: 3, color: "rgba(22,16,10,.6)" });
  }
  g.fillStyle = tint(col, -0.25);
  g.beginPath();
  g.arc(kx, ky, s * 0.22, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 0.8;
  g.stroke();
  inkOutline(g, pts, r, { width: 1.1, wobble: 0.3 });
}

/** Marmite de fonte : bord épais, fond sombre, anse. */
function cauldron(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number) {
  g.fillStyle = "rgba(12,8,4,.5)";
  g.beginPath();
  g.arc(x + s * 0.35, y + s * 0.45, s, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2a2622";
  g.beginPath();
  g.arc(x, y, s, 0, Math.PI * 2);
  g.fill();
  const inner = g.createRadialGradient(x - s * 0.2, y - s * 0.2, 0, x, y, s * 0.75);
  inner.addColorStop(0, "#4a3a26");
  inner.addColorStop(1, "#1a140e");
  g.fillStyle = inner;
  g.beginPath();
  g.arc(x, y, s * 0.74, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(220,210,190,.45)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(x, y, s * 0.87, Math.PI * 0.95, Math.PI * 1.6);
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(x, y, s, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, s * 0.74, 0, Math.PI * 2);
  g.stroke();
  // anse
  const a = r() * Math.PI;
  g.lineWidth = 1.3;
  g.beginPath();
  g.ellipse(x, y, s * 1.25, s * 0.5, a, Math.PI * 1.05, Math.PI * 1.95);
  g.stroke();
}

/** Tas de bois : bûches empilées, cernes au bout. */
function woodpile(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, S: number) {
  g.save();
  g.translate(x, y);
  g.rotate(between(r, -0.6, 0.6));
  const L = S * 0.62;
  const logs: [number, number, number][] = [];
  for (let k = 0; k < 4; k++) logs.push([between(r, -3, 3), (k - 1.5) * 5.4, between(r, 4.4, 5.6)]);
  logs.push([between(r, -3, 3), -2.7, 5], [between(r, -3, 3), 2.7, 5]);
  g.fillStyle = "rgba(12,8,4,.45)";
  g.fillRect(-L / 2 + 3, -13 + 4, L, 26);
  logs.forEach(([lx, ly, rad], i) => {
    const top = i >= 4;
    const col = top ? "#7a5a38" : "#6a4c2e";
    g.fillStyle = col;
    g.strokeStyle = INK;
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(lx - L / 2, ly - rad / 2, L, rad, rad / 2);
    g.fill();
    g.stroke();
    // écorce
    g.strokeStyle = "rgba(22,16,10,.5)";
    g.lineWidth = 0.5;
    g.beginPath();
    for (let q = 0; q < 3; q++) {
      const sx = lx - L / 2 + between(r, 4, L - 10);
      g.moveTo(sx, ly + between(r, -1.5, 1.5));
      g.lineTo(sx + between(r, 4, 9), ly + between(r, -1.5, 1.5));
    }
    g.stroke();
    // bout scié avec ses cernes
    g.fillStyle = "#c8a878";
    g.beginPath();
    g.ellipse(lx + L / 2, ly, 1.8, rad / 2, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 0.7;
    g.stroke();
  });
  g.restore();
}

/** Caisse en planches clouées, couvercle de travers. */
function crate(g: CanvasRenderingContext2D, r: Rng, x: number, y: number, s: number) {
  g.save();
  g.translate(x, y);
  g.rotate(r() * Math.PI);
  const box: Pt[] = [[-s, -s * 0.8], [s, -s * 0.8], [s, s * 0.8], [-s, s * 0.8]];
  castShadow(g, box, 3, 4, 0.5);
  washFill(g, shapeOf(box), "#7a5a38", r, { alpha: 1, edge: 3, blot: 8, granulation: 0.9 });
  g.strokeStyle = "rgba(22,16,10,.7)";
  g.lineWidth = 0.7;
  g.beginPath();
  for (const yy of [-s * 0.27, s * 0.27]) {
    g.moveTo(-s, yy);
    g.lineTo(s, yy);
  }
  g.stroke();
  // fil du bois
  g.strokeStyle = "rgba(22,16,10,.3)";
  g.lineWidth = 0.5;
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const yy = between(r, -s * 0.75, s * 0.75);
    const xx = between(r, -s * 0.8, s * 0.2);
    g.moveTo(xx, yy);
    g.lineTo(xx + between(r, 4, 10), yy + between(r, -0.5, 0.5));
  }
  g.stroke();
  inkLine(g, -s, -s * 0.8, s, s * 0.8, r, { width: 0.9, taper: 1 });
  g.fillStyle = INK;
  for (const [cx, cy] of box) {
    g.beginPath();
    g.arc(cx * 0.85, cy * 0.8, 0.8, 0, Math.PI * 2);
    g.fill();
  }
  inkOutline(g, box, r, { width: 1.3, wobble: 0.3 });
  g.restore();
}

// ——— Rendu ———

/** Tout ce que les lavis de base doivent connaître (fonctions à part : V8 optimise mal une fonction géante). */
interface BaseCtx {
  seed: number;
  S: number;
  IW: number;
  IH: number;
  fw: number;
  fh: number;
  P: number;
  pw: number;
  ph: number;
  inFloor: Uint8Array;
  inWater: Uint8Array;
  dOut: Float32Array;
  dIn: Float32Array;
  dW: Float32Array;
  dToW: Float32Array;
  floor: Shape;
  /** Distance au sol dans la roche, ondulée : ses seuils font les paliers de la masse. */
  stepF: Float32Array;
  /** 1 pour la roche reliée au bord de l'image : seule elle plonge dans le noir plein (un pilier isolé reste de la roche). */
  outer: Uint8Array;
  /** Dans la roche : 1 si la facette est tournée vers la lumière, 0 sinon. */
  lam: Float32Array;
  /** Couronne extérieure : 0 au bord de la bande de paroi, 1 où commence le noir d'encre (−1 hors couronne). */
  crown: Float32Array;
  pal: Record<"earth" | "stoneC" | "gravelC" | "dampC" | "vigC" | "waterShallow" | "waterMid" | "waterDeep" | "lipLit" | "lipSh" | "s2Lit" | "s2Sh" | "s3" | "s4" | "black", string>;
}

/** Paliers de la roche, en cases depuis le sol : lèvre éclairée, deux paliers qui s'éteignent, noir. */
const STEPS = [0.62, 1.08, 1.55, 2.05];

/** Sol et eau au pas du champ : terre ocre, dalle gris-vert, gravier, humidité ; eau en lavis superposés. */
function paintGround(g: CanvasRenderingContext2D, c: BaseCtx) {
  const { seed, S, fw, fh, inWater, dW, dIn, dToW } = c;
  const { earth, stoneC, gravelC, dampC, vigC, waterShallow, waterMid, waterDeep } = c.pal;
  const n1 = noise2(seed + 1);
  const n2 = noise2(seed + 2);
  const n3 = noise2(seed + 3);
  const n4 = noise2(seed + 4);
  const n5 = noise2(seed + 5);
  const n6 = noise2(seed + 6);
  const n7 = noise2(seed + 7);
  const cE = rgbOf(earth), cS = rgbOf(stoneC), cG = rgbOf(gravelC), cDp = rgbOf(dampC), cV = rgbOf(vigC);
  // terre détrempée au bord de l'eau : plus sombre et tirée vers le bleu-vert de l'eau
  const cDpW = lerp3(cDp, rgbOf(waterMid), 0.3);
  // l'eau en quatre couches de lavis, du bord clair au fond sombre, chaque couche cernée de pigment
  const cW = [rgbOf(waterShallow), lerp3(rgbOf(waterShallow), rgbOf(waterMid), 0.55), rgbOf(waterMid), lerp3(rgbOf(waterMid), rgbOf(waterDeep), 0.7)];
  const wSteps = [0.14 * S, 0.34 * S, 0.7 * S];
  const small = canvas(fw, fh);
  const sg = small.getContext("2d")!;
  const img = sg.createImageData(fw, fh);
  const d = img.data;
  for (let y = 0; y < fh; y++)
    for (let x = 0; x < fw; x++) {
      const i = y * fw + x;
      const X = x * F;
      const Y = y * F;
      let col: RGB;
      if (inWater[i]) {
        const t = dW[i] * F + n3(X / 50, Y / 50) * 7;
        const k = t < wSteps[0] ? 0 : t < wSteps[1] ? 1 : t < wSteps[2] ? 2 : 3;
        col = cW[k];
        // pigment accumulé juste avant le bord de chaque couche
        const next = k < 3 ? wSteps[k] : Infinity;
        if (next - t < 5) col = [col[0] * 0.86, col[1] * 0.86, col[2] * 0.88];
      } else {
        const e = n1(X / 170, Y / 170) * 0.65 + n2(X / 58, Y / 58) * 0.35;
        // bruit de nuages réduit de moitié : il ne fait plus que la texture, les valeurs viennent des lavis
        col = lerp3(cE, cS, smooth(-0.25, 0.35, e) * 0.5);
        col = lerp3(col, cG, smooth(0.3, 0.75, n5(X / 46 + 13, Y / 46)) * 0.28);
        const wd = dToW[i] * F + n3(X / 30, Y / 30) * 10;
        col = lerp3(col, cDpW, (1 - smooth(0, 1.6 * S, wd)) * 0.72);
        // terre plus fraîche par endroits : un voile lent et fondu (les vraies plaques humides sont posées à part)
        const wv = n6(X / 150, Y / 150) * 0.7 + n2(X / 44 + 7, Y / 44) * 0.3;
        col = lerp3(col, cDp, smooth(0.05, 0.45, wv) * 0.12);
        // valeur : la lumière se pose au large des salles, la terre s'assombrit franchement vers les parois
        const di = dIn[i] * F;
        const open = smooth(0.6 * S, 4.5 * S, di) * (0.55 + 0.45 * (n7(X / 260, Y / 260) * 0.5 + 0.5));
        const fine = (0.9 + 0.12 * open) * (1 + n4(X / 15, Y / 15) * 0.04);
        col = [col[0] * fine, col[1] * fine, col[2] * fine];
        col = lerp3(col, cV, 0.24 * Math.exp(-di / 14) + 0.1 * (1 - smooth(0, 2.5 * S, di)));
      }
      const k = i * 4;
      d[k] = col[0];
      d[k + 1] = col[1];
      d[k + 2] = col[2];
      d[k + 3] = 255;
    }
  sg.putImageData(img, 0, 0);
  g.drawImage(small, 0, 0, fw * F, fh * F);
}

/**
 * Grain du papier et lavis du sol, posés en « multiply ». Trois couches de taches au bruit continu (fBm à
 * graine), chacune assombrit de 4 à 6 % avec un bord fondu de 6 à 10 px ; sur un tiers environ de leur contour,
 * par morceaux, le pigment s'est accumulé en séchant : un bord humide de 1 à 2 px un peu plus foncé.
 * Le grain de pigment (2 à 8 %) change d'une zone à l'autre. Les bruits lents sont tirés au quart de la
 * résolution puis interpolés : le bord reste net au demi-pixel sans payer le bruit à chaque point.
 */
function paintGrain(g: CanvasRenderingContext2D, c: BaseCtx) {
  const { seed, S, P, pw, ph, fw, fh, floor, inFloor, dIn } = c;
  const cv = canvas(pw, ph);
  const cg = cv.getContext("2d")!;
  const img = cg.createImageData(pw, ph);
  const d = img.data;
  const layers = [
    { a: noise2(seed + 81), b: noise2(seed + 82), sc: 200, th: 0.22, k: 0.955 },
    { a: noise2(seed + 83), b: noise2(seed + 84), sc: 120, th: 0.3, k: 0.96 },
    { a: noise2(seed + 85), b: noise2(seed + 86), sc: 70, th: 0.36, k: 0.965 },
  ];
  const nM = noise2(seed + 71);
  const nRim = noise2(seed + 72);
  const nGr = noise2(seed + 74);
  const nWall = noise2(seed + 87);
  // champs au quart : un par couche, puis bord humide (interrompu), marbrure et force du grain
  const NL = layers.length;
  const fld = new Float32Array(fw * fh * (NL + 3));
  for (let y = 0; y < fh; y++)
    for (let x = 0; x < fw; x++) {
      const X = (x + 0.5) * F, Y = (y + 0.5) * F;
      const o = (y * fw + x) * (NL + 3);
      layers.forEach((L, j) => (fld[o + j] = L.a(X / L.sc, Y / L.sc) * 0.78 + L.b(X / (L.sc * 0.3), Y / (L.sc * 0.3)) * 0.22));
      fld[o + NL] = smooth(0.12, 0.32, nRim(X / 55, Y / 55));
      fld[o + NL + 1] = nM(X / 38, Y / 38) * 0.5 + 0.5;
      fld[o + NL + 2] = 0.025 + 0.055 * smooth(-0.4, 0.5, nGr(X / 140, Y / 140));
    }
  const NF = NL + 3;
  const vals = new Float32Array(NF);
  // Pied des parois : un dégradé continu, −25 % contre la roche, qui s'éteint sur une case et demie (bruitée).
  const wallD = 1.5 * S;
  let h = (Math.imul(seed | 0, 2654435761) ^ 0x9e3779b9) >>> 0 || 1;
  for (let y = 0; y < ph; y++) {
    const Y = (y + 0.5) * P;
    const gyf = Math.min(fh - 1.001, Math.max(0, Y / F - 0.5));
    const y0 = Math.floor(gyf);
    const ay = gyf - y0;
    for (let x = 0; x < pw; x++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      h >>>= 0;
      const rnd = (h >>> 8) / 16777216;
      const X = (x + 0.5) * P;
      const k = (y * pw + x) * 4;
      const fi = Math.min(fh - 1, Math.floor(Y / F)) * fw + Math.min(fw - 1, Math.floor(X / F));
      const gxf = Math.min(fw - 1.001, Math.max(0, X / F - 0.5));
      const x0 = Math.floor(gxf);
      const ax = gxf - x0;
      const i = y0 * fw + x0;
      const w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay), w01 = (1 - ax) * ay, w11 = ax * ay;
      const o00 = i * NF, o10 = o00 + NF, o01 = o00 + fw * NF, o11 = o01 + NF;
      for (let j = 0; j < NF; j++) vals[j] = fld[o00 + j] * w00 + fld[o10 + j] * w10 + fld[o01 + j] * w01 + fld[o11 + j] * w11;
      let v = 1 - vals[NL + 2] * rnd - 0.035 * vals[NL + 1];
      if (inFloor[fi]) {
        const wet = vals[NL];
        for (let j = 0; j < NL; j++) {
          const L = layers[j];
          const n = vals[j];
          if (n < L.th - 0.03) continue;
          // fondu du bord, puis bord humide : différence entre un bord serré et un bord large
          const m = smooth(L.th - 0.03, L.th + 0.03, n);
          const rim = smooth(L.th - 0.004, L.th + 0.008, n) - smooth(L.th + 0.012, L.th + 0.03, n);
          v *= 1 - (1 - L.k) * m - 0.06 * rim * wet;
        }
        const di = (dIn[i] * w00 + dIn[i + 1] * w10 + dIn[i + fw] * w01 + dIn[i + fw + 1] * w11) * F;
        if (di < wallD * 1.3) {
          const lim = wallD * (1 + nWall(X / 70, Y / 70) * 0.3);
          if (di < lim) {
            const t = 1 - di / lim;
            v *= 1 - 0.25 * t * t * (3 - 2 * t);
          }
        }
      }
      v *= 255;
      d[k] = v;
      d[k + 1] = v * 0.995;
      d[k + 2] = v * 0.985;
      d[k + 3] = 255;
    }
  }
  cg.putImageData(img, 0, 0);
  // fibres : petits traits courbes, couchés dans tous les sens
  const r = rng(seed, 73);
  cg.strokeStyle = "rgba(70,50,30,.16)";
  cg.lineWidth = 0.5;
  cg.beginPath();
  for (let k = 0; k < (pw * ph) / 260; k++) {
    const x = r() * pw;
    const y = r() * ph;
    const a = r() * Math.PI;
    const l = between(r, 2, 7);
    cg.moveTo(x, y);
    cg.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 2, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 2, x + Math.cos(a) * l, y + Math.sin(a) * l);
  }
  cg.stroke();
  g.save();
  g.clip(floor.path, "evenodd");
  g.globalCompositeOperation = "multiply";
  g.drawImage(cv, 0, 0, pw * P, ph * P);
  g.restore();
}

/** Flou de boîte (deux passes) d'un champ, rayon en pixels du champ. */
function blurField(src: Float32Array, fw: number, fh: number, rad: number) {
  let a = src;
  for (let pass = 0; pass < 2; pass++) {
    const tmp = new Float32Array(fw * fh);
    for (let y = 0; y < fh; y++) {
      let acc = 0;
      for (let x = -rad; x <= rad; x++) acc += a[y * fw + Math.min(fw - 1, Math.max(0, x))];
      for (let x = 0; x < fw; x++) {
        tmp[y * fw + x] = acc / (2 * rad + 1);
        acc += a[y * fw + Math.min(fw - 1, x + rad + 1)] - a[y * fw + Math.max(0, x - rad)];
      }
    }
    const out = new Float32Array(fw * fh);
    for (let x = 0; x < fw; x++) {
      let acc = 0;
      for (let y = -rad; y <= rad; y++) acc += tmp[Math.min(fh - 1, Math.max(0, y)) * fw + x];
      for (let y = 0; y < fh; y++) {
        out[y * fw + x] = acc / (2 * rad + 1);
        acc += tmp[Math.min(fh - 1, y + rad + 1) * fw + x] - tmp[Math.max(0, y - rad) * fw + x];
      }
    }
    a = out;
  }
  return a;
}

/**
 * Roche au demi-pixel. La masse est sombre ; seule une lèvre d'une demi-case à une case, le long du sol,
 * prend la lumière. Elle s'éteint en paliers francs (pas de flou), puis noir plein au-delà de deux cases.
 * Dans la lèvre et le palier suivant, la roche est taillée en facettes à deux valeurs : éclairée si la pente
 * regarde le haut-gauche, dans l'ombre sinon ; l'arête entre deux facettes de valeurs différentes est encrée.
 */
function paintRock(g: CanvasRenderingContext2D, c: BaseCtx) {
  const { seed, S, IW, IH, fw, fh, P, pw, ph, dOut, stepF, outer, floor, lam, crown } = c;
  const { lipLit, lipSh, s2Lit, s2Sh, s3, s4, black } = c.pal;
  const T0 = STEPS[0] * S, T1 = STEPS[1] * S, T2 = STEPS[2] * S, T3 = STEPS[3] * S;
  // pente de la distance au sol, lissée : l'orientation de la paroi
  const ds = blurField(dOut, fw, fh, 3);
  const sx = new Float32Array(fw * fh);
  const sy = new Float32Array(fw * fh);
  const wxF = new Float32Array(fw * fh);
  const wyF = new Float32Array(fw * fh);
  {
    const nWa = noise2(seed + 36);
    const nWb = noise2(seed + 37);
    for (let y = 1; y < fh - 1; y++)
      for (let x = 1; x < fw - 1; x++) {
        const i = y * fw + x;
        if (dOut[i] * F > T3 + S) continue;
        const gx = (ds[i + 1] - ds[i - 1]) * 0.5;
        const gy = (ds[i + fw] - ds[i - fw]) * 0.5;
        const l = Math.hypot(gx, gy);
        if (l > 1e-4) {
          sx[i] = gx / l;
          sy[i] = gy / l;
        }
        wxF[i] = nWa((x * F) / 36, (y * F) / 36) * 7;
        wyF[i] = nWb((x * F) / 36, (y * F) / 36) * 7;
      }
  }
  // facettes : graines sur une grille déformée, chacune avec son inclinaison propre (vers la lumière ou non)
  const SF = 0.85 * S;
  const gw = Math.ceil(IW / SF) + 2;
  const gh = Math.ceil(IH / SF) + 2;
  const fx = new Float32Array(gw * gh);
  const fy = new Float32Array(gw * gh);
  const td = new Float32Array(gw * gh);
  {
    const r = rng(seed, 101);
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i;
        fx[k] = (i - 1 + 0.15 + r() * 0.7) * SF;
        fy[k] = (j - 1 + 0.15 + r() * 0.7) * SF;
        td[k] = between(r, -0.62, 0.62);
      }
  }
  // masque du sol au demi-pixel : la roche s'arrête net au bord (l'encre du contour passe dessus)
  const rockIn = (() => {
    const m = canvas(pw, ph);
    const mc = m.getContext("2d", { willReadFrequently: true })!;
    mc.scale(1 / P, 1 / P);
    mc.fillStyle = "#fff";
    mc.fill(floor.path, "evenodd");
    return mc.getImageData(0, 0, pw, ph).data;
  })();
  const cLL = rgbOf(lipLit), cLS = rgbOf(lipSh), c2L = rgbOf(s2Lit), c2S = rgbOf(s2Sh), c3 = rgbOf(s3), c4 = rgbOf(s4), cBk = rgbOf(black);
  const c3L = lerp3(c3, c2S, 0.45);
  const cCr = lerp3(c3, c4, 0.5);
  const cInk = rgbOf(INK);
  const small = canvas(pw, ph);
  const sg = small.getContext("2d")!;
  const img = sg.createImageData(pw, ph);
  const d = img.data;
  for (let y = 0; y < ph; y++) {
    const Y = (y + 0.5) * P;
    const gyf = Math.min(fh - 1.001, Math.max(0, Y / F - 0.5));
    const y0 = Math.floor(gyf);
    const ay = gyf - y0;
    for (let x = 0; x < pw; x++) {
      const o = y * pw + x;
      const alpha = rockIn[o * 4 + 3];
      if (alpha > 250) continue;
      const k4 = o * 4;
      const X = (x + 0.5) * P;
      const gxf = Math.min(fw - 1.001, Math.max(0, X / F - 0.5));
      const x0 = Math.floor(gxf);
      const ax = gxf - x0;
      const i = y0 * fw + x0;
      const w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay), w01 = (1 - ax) * ay, w11 = ax * ay;
      const sv = stepF[i] * w00 + stepF[i + 1] * w10 + stepF[i + fw] * w01 + stepF[i + fw + 1] * w11;
      if (sv >= T3 && outer[i]) {
        // couronne : la roche s'enfonce dans le noir d'encre (les hachures à la plume viennent par-dessus)
        const hv = crown[i] * w00 + crown[i + 1] * w10 + crown[i + fw] * w01 + crown[i + fw + 1] * w11;
        // la roche s'assombrit en s'éloignant ; le noir d'encre seulement dans les poches
        const col = hv >= 1 ? cBk : lerp3(cCr, cBk, 0.12 + 0.62 * hv * hv);
        d[k4] = col[0];
        d[k4 + 1] = col[1];
        d[k4 + 2] = col[2];
        d[k4 + 3] = 255 - alpha;
        continue;
      }
      const step = sv < T0 ? 0 : sv < T1 ? 1 : sv < T2 ? 2 : 3;
      if (sv >= T3 + 0.4 * S) {
        // cœur d'un pilier isolé : roche sombre, sans facettes (les hachures croisées font le reste)
        d[k4] = c4[0];
        d[k4 + 1] = c4[1];
        d[k4 + 2] = c4[2];
        d[k4 + 3] = 255 - alpha;
        continue;
      }
      const gx = sx[i] * w00 + sx[i + 1] * w10 + sx[i + fw] * w01 + sx[i + fw + 1] * w11;
      const gy = sy[i] * w00 + sy[i + 1] * w10 + sy[i + fw] * w01 + sy[i + fw + 1] * w11;
      const ni = Math.min(fh - 1, Math.floor(Y / F)) * fw + Math.min(fw - 1, Math.floor(X / F));
      const wx = X + wxF[ni];
      const wy = Y + wyF[ni];
      const ci = Math.floor(wx / SF) + 1;
      const cj = Math.floor(wy / SF) + 1;
      let d1 = Infinity, d2 = Infinity, best = 0, second = 0;
      for (let j = cj - 1; j <= cj + 1; j++) {
        if (j < 0 || j >= gh) continue;
        for (let ii = ci - 1; ii <= ci + 1; ii++) {
          if (ii < 0 || ii >= gw) continue;
          const k = j * gw + ii;
          const ddx = fx[k] - wx;
          const ddy = fy[k] - wy;
          const dd = ddx * ddx + ddy * ddy;
          if (dd < d1) {
            d2 = d1;
            second = best;
            d1 = dd;
            best = k;
          } else if (dd < d2) {
            d2 = dd;
            second = k;
          }
        }
      }
      // éclairée si la pente monte vers le bas-droite (la face regarde la lumière du haut-gauche)
      const base = (gx * LX + gy * LY) * 0.78;
      const lit = base + td[best] > 0;
      lam[o] = lit ? 1 : 0;
      let col: RGB = step === 0 ? (lit ? cLL : cLS) : step === 1 ? (lit ? c2L : c2S) : step === 2 ? (lit ? c3L : c3) : c4;
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      if (step <= 1 && edge < 1.5 && base + td[second] > 0 !== lit) col = lerp3(col, cInk, 0.85);
      else if (step <= 2 && edge < 1) col = lerp3(col, cInk, 0.28);
      d[k4] = col[0];
      d[k4 + 1] = col[1];
      d[k4 + 2] = col[2];
      d[k4 + 3] = 255 - alpha;
    }
  }
  sg.putImageData(img, 0, 0);
  g.drawImage(small, 0, 0, pw * P, ph * P);
}

export function renderCave(c: MapCtx): HTMLCanvasElement {
  const { map, theme, material, g, cv, W, H, S, at } = c;
  const seed = map.seed;
  const IW = cv.width;
  const IH = cv.height;
  const fw = Math.ceil(IW / F);
  const fh = Math.ceil(IH / F);
  const crystal = material === "metal";

  // ——— 0. Lecture des cases ———
  const open = (x: number, y: number) => isOpen(at(x, y));
  const dry = (x: number, y: number) => {
    const t = at(x, y);
    return t === T.sol || t === T.route || t === T.vegetation;
  };
  const nearDoor = (x: number, y: number, k = 1) => {
    for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) if (at(x + dx, y + dy) === T.porte) return true;
    return false;
  };
  const narrow = (x: number, y: number) => (isSolid(at(x - 1, y)) && isSolid(at(x + 1, y))) || (isSolid(at(x, y - 1)) && isSolid(at(x, y + 1)));
  const solidAround = (x: number, y: number) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isSolid(at(x + dx, y + dy))) n++;
    return n;
  };
  // distance en cases à la roche (1 = case qui touche une paroi)
  const cellDist = new Int16Array(W * H);
  {
    const q: number[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!open(x, y)) continue;
        if (!open(x - 1, y) || !open(x + 1, y) || !open(x, y - 1) || !open(x, y + 1)) {
          cellDist[y * W + x] = 1;
          q.push(y * W + x);
        }
      }
    for (let h = 0; h < q.length; h++) {
      const k = q[h];
      const x = k % W;
      const y = Math.floor(k / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!open(nx, ny) || cellDist[ny * W + nx]) continue;
        cellDist[ny * W + nx] = cellDist[k] + 1;
        q.push(ny * W + nx);
      }
    }
  }
  let floorCells = 0;
  for (let i = 0; i < W * H; i++) if (cellDist[i]) floorCells++;
  // Salles : centres aux creux les plus larges, chaque case rattachée au centre le plus proche.
  const centers: Pt[] = [];
  {
    const order: number[] = [];
    for (let i = 0; i < W * H; i++) if (cellDist[i] >= 2) order.push(i);
    order.sort((a, b) => cellDist[b] - cellDist[a] || ((a * 7919 + seed) % 977) - ((b * 7919 + seed) % 977));
    for (const i of order) {
      const x = i % W;
      const y = Math.floor(i / W);
      if (centers.every(([cx, cy]) => Math.hypot(cx - x, cy - y) >= 7)) centers.push([x, y]);
    }
  }
  const zoneOf = new Int16Array(W * H).fill(-1);
  for (let i = 0; i < W * H; i++) {
    if (!cellDist[i]) continue;
    const x = i % W;
    const y = Math.floor(i / W);
    let best = -1;
    let bd = Infinity;
    centers.forEach(([cx, cy], k) => {
      const d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    });
    zoneOf[i] = best;
  }

  // ——— 1. Formes : contours organiques du sol et de l'eau ———
  const floorLimits = (x: number, y: number, nx: number, ny: number): [number, number] => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    if (nearDoor(cx, cy) || nearDoor(Math.floor((x + nx * 6) / S), Math.floor((y + ny * 6) / S))) return [0, 0];
    // épaisseur de roche devant, largeur de sol derrière
    let out = 3 * S;
    let solidSeen = false;
    for (let s = 3; s <= 3 * S; s += 4) {
      const t = at(Math.floor((x + nx * s) / S), Math.floor((y + ny * s) / S));
      if (isSolid(t)) solidSeen = true;
      else if (solidSeen) {
        out = s;
        break;
      }
    }
    let inn = 3 * S;
    let openSeen = false;
    for (let s = 3; s <= 3 * S; s += 4) {
      const t = at(Math.floor((x - nx * s) / S), Math.floor((y - ny * s) / S));
      if (isOpen(t)) openSeen = true;
      else if (openSeen) {
        inn = s;
        break;
      }
    }
    return [Math.min(0.32 * S, inn * 0.2), Math.min(0.75 * S, out * 0.34)];
  };
  const floorLoops = organicLoops(cellContour((x, y) => open(x, y), W, H, S, { smooth: 1, round: 1 }), seed + 11, S, 0.42 * S, 1, floorLimits);
  const floor = shapeOf(floorLoops);
  const waterLoops = organicLoops(
    cellContour((x, y) => at(x, y) === T.eau, W, H, S, { smooth: 1, round: 2 }),
    seed + 23,
    S,
    0.38 * S,
    0.7,
    (x, y) => (nearDoor(Math.floor(x / S), Math.floor(y / S)) ? [0, 0] : [0.3 * S, 0.34 * S]),
  );
  const water = waterLoops.length ? shapeOf(waterLoops) : null;
  const rockPath = new Path2D();
  rockPath.rect(-10, -10, IW + 20, IH + 20);
  rockPath.addPath(floor.path);
  const dryPath = new Path2D(floor.path);
  if (water) dryPath.addPath(water.path);

  // ——— 2. Champs de distance (au quart de la résolution) ———
  const inFloor = rasterize(floor, fw, fh);
  const inWater = water ? rasterize(water, fw, fh) : new Uint8Array(fw * fh);
  for (let i = 0; i < fw * fh; i++) inWater[i] &= inFloor[i];
  const dOut = chamfer(inFloor, fw, fh); // dans la roche : distance au sol
  // roche reliée au bord de l'image (le reste : piliers et cloisons entourés de sol)
  const outer = new Uint8Array(fw * fh);
  {
    const q: number[] = [];
    for (let x = 0; x < fw; x++) for (const y of [0, fh - 1]) if (!inFloor[y * fw + x] && !outer[y * fw + x]) (outer[y * fw + x] = 1), q.push(y * fw + x);
    for (let y = 0; y < fh; y++) for (const x of [0, fw - 1]) if (!inFloor[y * fw + x] && !outer[y * fw + x]) (outer[y * fw + x] = 1), q.push(y * fw + x);
    for (let h = 0; h < q.length; h++) {
      const k = q[h];
      const x = k % fw;
      for (const j of [k - fw, k + fw, x > 0 ? k - 1 : -1, x < fw - 1 ? k + 1 : -1]) {
        if (j < 0 || j >= fw * fh || outer[j] || inFloor[j]) continue;
        outer[j] = 1;
        q.push(j);
      }
    }
  }
  const notFloor = new Uint8Array(fw * fh);
  for (let i = 0; i < fw * fh; i++) notFloor[i] = inFloor[i] ? 0 : 1;
  const dIn = chamfer(notFloor, fw, fh); // sur le sol : distance à la paroi
  const notWater = new Uint8Array(fw * fh);
  for (let i = 0; i < fw * fh; i++) notWater[i] = inWater[i] ? 0 : 1;
  const dW = chamfer(notWater, fw, fh); // dans l'eau : distance à la rive
  const dToW = water ? chamfer(inWater, fw, fh) : new Float32Array(fw * fh).fill(1e6); // hors de l'eau : distance à l'eau
  const idx = (x: number, y: number) => Math.min(fh - 1, Math.max(0, Math.floor(y / F))) * fw + Math.min(fw - 1, Math.max(0, Math.floor(x / F)));
  const fieldAt = (f: Float32Array, x: number, y: number) => f[idx(x, y)] * F;
  const onDry = (x: number, y: number) => inFloor[idx(x, y)] === 1 && inWater[idx(x, y)] === 0;
  /** Pente de la distance à la paroi dans la roche (vers l'extérieur), normalisée. */
  const gradOut = (x: number, y: number): Pt => {
    const i = idx(x, y);
    const gx = (dOut[Math.min(i + 1, fw * fh - 1)] - dOut[Math.max(i - 1, 0)]) * 0.5;
    const gy = (dOut[Math.min(i + fw, fw * fh - 1)] - dOut[Math.max(i - fw, 0)]) * 0.5;
    const l = Math.hypot(gx, gy);
    return l < 1e-4 ? [0, 0] : [gx / l, gy / l];
  };
  const gradIn = (x: number, y: number): Pt => {
    const i = idx(x, y);
    const gx = (dIn[Math.min(i + 1, fw * fh - 1)] - dIn[Math.max(i - 1, 0)]) * 0.5;
    const gy = (dIn[Math.min(i + fw, fw * fh - 1)] - dIn[Math.max(i - fw, 0)]) * 0.5;
    const l = Math.hypot(gx, gy);
    return l < 1e-4 ? [0, 0] : [gx / l, gy / l];
  };

  // ——— Palette : couleurs du genre, poussées vers la terre, l'ocre et le vert-de-gris ———
  const lum = (hex: string) => {
    const [r0, g0, b0] = rgbOf(hex);
    return (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255;
  };
  // Genres au sol sombre (horreur, science-fiction, cyberpunk) : la nuit est plus noire, les lumières comptent.
  const darkTheme = lum(theme.floor) < 0.32;
  // En genre sombre, le praticable remonte d'environ 15 % : sol, paroi et vide gardent trois paliers de valeur.
  // Retouche : le sol sombre tire vers l'ocre chaud (il tournait au gris-vert) pour trancher sur la paroi.
  const earth = darkTheme ? mixColor(mixColor(mixColor(theme.floor, theme.road, 0.5), "#a49d8c", 0.24), "#b8a06a", 0.34) : mixColor(theme.floor, theme.road, 0.5);
  const stoneC = mixColor(theme.floor, "#7c8577", 0.35);
  const gravelC = mixColor(theme.floor, "#a49b8a", 0.35);
  const dampC = mixColor(earth, "#2c2015", 0.55);
  const vigC = mixColor(theme.background, INK, 0.35);
  // Roche : masse brun-noir ; seule la lèvre le long du sol est claire, et toujours nettement plus sombre
  // que le sol (au moins un tiers de luminance en moins), quel que soit le genre.
  let lipLit = mixColor(theme.wall, theme.floor, 0.22);
  for (let k = 0; k < 14 && lum(lipLit) > lum(earth) * (darkTheme ? 0.5 : 0.62); k++) lipLit = mixColor(lipLit, INK, 0.12);
  // En genre sombre, la paroi se confondait avec l'encre : la lèvre garde au moins la moitié de la valeur du sol,
  // pour que le trait noir du contour se lise encore.
  if (darkTheme) for (let k = 0; k < 14 && lum(lipLit) < lum(earth) * 0.4; k++) lipLit = mixColor(lipLit, "#8e8a7e", 0.12);
  const s3 = mixColor(theme.wall, INK, 0.56);
  const s4 = mixColor(theme.wall, INK, 0.6);
  const lipSh = mixColor(lipLit, s3, 0.42);
  const s2Lit = mixColor(lipLit, s3, 0.6);
  const s2Sh = mixColor(lipLit, s3, 0.85);
  // le noir d'encre du hors-carte : presque pur, à peine teinté par le genre
  const black = mixColor(theme.background, "#0d0a08", 0.94);
  const rockLit = mixColor(theme.wall, theme.floor, 0.3);
  // Blocs et colonnes : proches de la bande de paroi, jamais plus clairs qu'un pion ; en genre sombre, on leur
  // rend quand même une face éclairée lisible.
  const blockCol = darkTheme ? mixColor(theme.floor, "#8e8a7e", 0.22) : mixColor(lipLit, s2Sh, 0.3);
  const columnCol = darkTheme ? mixColor(theme.floor, "#8e8a7e", 0.3) : mixColor(mixColor(lipLit, rockLit, 0.25), INK, 0.08);
  // Blocs effondrés contre la paroi : de la même roche que la lèvre ; leur face éclairée ne dépasse jamais la
  // paroi éclairée de plus de 10 %, et reste toujours sous le sol de la salle.
  let blockLit = mixColor(lipLit, "#efe3c8", 0.06);
  for (let k = 0; k < 10 && (lum(blockLit) > lum(lipLit) * 1.1 || lum(blockLit) > lum(earth) * 0.8); k++) blockLit = mixColor(blockLit, INK, 0.06);
  const blockCols = { body: mixColor(lipSh, s2Sh, 0.35), lit: blockLit };
  const rockSh = mixColor(theme.wall, INK, 0.5);
  const waterShallow = mixColor(mixColor(theme.water, theme.floor, 0.35), earth, 0.3);
  const waterMid = mixColor(mixColor(theme.water, INK, 0.36), dampC, 0.2);
  const waterDeep = mixColor(mixColor(theme.water, INK, 0.74), dampC, 0.15);
  const boneCol = mixColor("#e6dcc2", theme.floor, 0.18);
  // pierres libres : une teinte chaude tirée de la terre du lieu, pas un gris froid
  const rockCol = mixColor(mixColor(earth, INK, 0.32), theme.wall, 0.3);
  const inkWater = mixColor(INK, theme.water, 0.3);
  // pierres libres : leur face éclairée reste sous la terre de la salle
  litMax = lum(earth) * 0.88;

  // Distance au sol, ondulée lentement : ses seuils (STEPS) font les paliers de la roche et ses corniches.
  const stepF = new Float32Array(fw * fh);
  {
    const nI = noise2(seed + 41);
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x;
        const v = dOut[i] * F;
        stepF[i] = inFloor[i] ? -100 : v + nI((x * F) / 85, (y * F) / 85) * 0.22 * S * smooth(0, 0.45 * S, v);
      }
  }
  const TH = STEPS.map((s) => s * S);
  const stepAt = (x: number, y: number) => stepF[idx(x, y)];
  const stepOf = (sv: number) => (sv < TH[0] ? 0 : sv < TH[1] ? 1 : sv < TH[2] ? 2 : sv < TH[3] ? 3 : 4);
  // Couronne : au-delà de la bande de paroi, la masse rocheuse en strates hachurées court jusqu'au cadre. La hauteur
  // monte vite près de la paroi puis de plus en plus lentement (1 − e^(−d/L)) : les strates s'écartent en
  // s'éloignant. Le noir d'encre (valeur ≥ 1) ne tombe que dans des poches irrégulières, loin de la paroi,
  // là où un bruit lent le décide ; un bruit fin déchire leur bord (bord de case de BD, jamais un vignettage flou).
  const crown = new Float32Array(fw * fh);
  {
    const nA = noise2(seed + 45);
    const nB = noise2(seed + 46);
    const nC = noise2(seed + 48);
    const nP = noise2(seed + 49);
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x;
        if (!outer[i]) {
          crown[i] = -1;
          continue;
        }
        const X = x * F, Y = y * F;
        const v = Math.max(0, stepF[i] - TH[3]);
        const L = S * (2.2 + 1.4 * (nA(X / 320, Y / 320) * 0.5 + 0.5)) + nB(X / 70, Y / 70) * 0.35 * S;
        const h = 1 - Math.exp(-v / L);
        // poches de noir : bruit lent, seulement au-delà d'environ 2,5 cases de la paroi
        const pocket = Math.max(0, nP(X / 170, Y / 170) * 0.8 + nB(X / 60, Y / 60) * 0.3 - 0.22) * 1.6 * smooth(0.72, 0.93, h);
        const hv = h + pocket;
        crown[i] = hv + (pocket > 0 ? nC(X / 22, Y / 22) * 0.07 : 0);
      }
  }

  // ——— 3. Lavis de base : sol et eau au pas du champ, roche en paliers et facettes au demi-pixel ———
  const P = 2;
  const pw = Math.ceil(IW / P);
  const ph = Math.ceil(IH / P);
  const lam = new Float32Array(pw * ph); // roche : 1 facette éclairée, 0 facette d'ombre
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  const base: BaseCtx = {
    seed, S, IW, IH, fw, fh, P, pw, ph, inFloor, inWater, dOut, dIn, dW, dToW, floor, stepF, outer, lam, crown,
    pal: { earth, stoneC, gravelC, dampC, vigC, waterShallow, waterMid, waterDeep, lipLit, lipSh, s2Lit, s2Sh, s3, s4, black },
  };
  paintGround(g, base);
  paintRock(g, base);
  const litAt = (x: number, y: number) => lam[Math.min(ph - 1, Math.max(0, Math.floor(y / P))) * pw + Math.min(pw - 1, Math.max(0, Math.floor(x / P)))] > 0.5;

  // ——— 4. La roche à la plume : corniches, hachures dirigées par la paroi, arêtes, liseré du pied ———
  g.save();
  g.clip(rockPath, "evenodd");
  {
    const r = rng(seed, 201);
    // Corniches : le bord de chaque palier, en traits repris qui s'amincissent.
    const ledges: [number, number, number][] = [
      [TH[0], 1.5, 0.92],
      [TH[1], 1.1, 0.75],
    ];
    for (const [lv, w, a] of ledges)
      for (const line of isolines(stepF, fw, fh, lv, F))
        for (const run of brokenRuns(line, r, 25, 110, lv === TH[0] ? 0.3 : 0.5))
          inkPolyline(g, run, r, { width: w * between(r, 0.75, 1.2), taper: 12, wobble: 0.5, pressure: 0.5, color: `rgba(10,7,4,${a})` });

    // Hachures dirigées : sur une grille déformée, des paquets de 3 à 7 traits en fuseau couchés dans le sens de
    // la pente (selon la normale à la paroi la plus proche), comme les hachures d'un relief gravé : serrés au
    // pied, plus espacés vers la crête ; épaisseur et longueur tirées pour chaque trait. Rares sur les facettes
    // éclairées de la lèvre. Une seconde passe croisée, couchée le long de la paroi, seulement dans le tiers sombre.
    const lip = new Spindles();
    const mass = new Spindles();
    const cross = new Spindles();
    const G = 9;
    for (let gy0 = 0; gy0 < IH; gy0 += G)
      for (let gx0 = 0; gx0 < IW; gx0 += G) {
        const x = gx0 + r() * G;
        const y = gy0 + r() * G;
        const v = fieldAt(dOut, x, y);
        if (v < 3) continue;
        const sv = stepAt(x, y);
        const step = stepOf(sv);
        if (step === 4 && outer[idx(x, y)]) continue;
        const lit = litAt(x, y);
        const foot = v < 0.28 * S;
        const p = ([lit ? 0.12 : 0.5, lit ? 0.32 : 0.62, 0.7, 0.62][step] ?? 1) * (foot ? 1.5 : 1);
        if (r() > p) continue;
        const [ux, uy] = gradOut(x, y);
        if (!ux && !uy) continue;
        const ta = Math.atan2(ux, -uy) + (r() - 0.5) * 0.3;
        const tx = Math.cos(ta);
        const ty = Math.sin(ta);
        const deep = step >= 2;
        const m = 3 + Math.floor(r() * 5);
        // écart : serré au pied, lâche vers la crête
        const gap = (lit ? 2.6 : 2.1) * (1 + 0.6 * clamp01(v / (1.8 * S))) * between(r, 0.9, 1.15);
        const len = (deep ? between(r, 10, 20) : between(r, 6, 13)) * between(r, 0.7, 1.25);
        const w = between(r, 0.5, 1.45) * (deep ? 1.1 : 1);
        const o0 = (-(m - 1) / 2) * gap;
        const dest = step === 0 ? lip : mass;
        for (let k = 0; k < m; k++) {
          const ox = x + tx * (o0 + k * gap) + ux * (r() - 0.5) * 3;
          const oy = y + ty * (o0 + k * gap) + uy * (r() - 0.5) * 3;
          const l = len * between(r, 0.6, 1.1);
          dest.add(ox - ux * l * 0.5, oy - uy * l * 0.5, ox + ux * l * 0.5, oy + uy * l * 0.5, w * between(r, 0.7, 1.25), (r() - 0.5) * 1.4);
        }
        if (step >= 3 || (step === 2 && !lit && r() < 0.6)) {
          const cg = gap * 0.9;
          for (let k = 0; k < m; k++) {
            const ox = x + ux * (o0 + k * cg);
            const oy = y + uy * (o0 + k * cg);
            const l = len * between(r, 0.6, 1);
            cross.add(ox - tx * l * 0.5, oy - ty * l * 0.5, ox + tx * l * 0.5, oy + ty * l * 0.5, w * 0.85, (r() - 0.5) * 1.2);
          }
        }
      }
    lip.fill(g, "rgba(18,12,7,.82)");
    mass.fill(g, "rgba(8,5,3,.92)");
    cross.fill(g, "rgba(6,4,2,.88)");

    // Couronne, première passe : des hachures couchées dans le sens de la pente, longues près de la paroi,
    // qui raccourcissent et s'épaississent en allant vers le noir ; quelques-unes croisées.
    {
      const sp = new Spindles();
      const G2 = 8;
      for (let gy0 = 0; gy0 < IH; gy0 += G2)
        for (let gx0 = 0; gx0 < IW; gx0 += G2) {
          const x = gx0 + r() * G2;
          const y = gy0 + r() * G2;
          const hv = crown[idx(x, y)];
          if (hv < 0 || hv > 1.04) continue;
          // près du noir, les hachures se croisent et s'effilochent : plus denses, plus courtes, en tous sens
          const fray = smooth(0.62, 0.95, hv);
          if (r() > 0.78 - hv * 0.3 + fray * 0.35) continue;
          const [ux, uy] = gradOut(x, y);
          if (!ux && !uy) continue;
          const m = 2 + Math.floor(r() * 4);
          // les traits s'écartent avec la distance à la paroi
          const gap = between(r, 2.4, 3.6) * (1 + hv * 0.7);
          const len = between(r, 8, 20) * (1 - hv * 0.35) * (1 - fray * 0.3);
          const w = between(r, 0.55, 1.25) * (1 + hv * 0.8);
          const skew = (r() - 0.5) * 0.5 * (1 + fray * 2);
          const cs = Math.cos(skew), sn = Math.sin(skew);
          const vx = ux * cs - uy * sn, vy = ux * sn + uy * cs;
          const wx = -vy, wy = vx;
          for (let k = 0; k < m; k++) {
            const o = (k - (m - 1) / 2) * gap;
            const ox = x + wx * o, oy = y + wy * o;
            const l = len * between(r, 0.45, 1.15);
            const t0 = between(r, 0.3, 0.7);
            if (r() < 0.25 + hv * 0.3 + fray * 0.3) sp.add(ox - wx * l * t0, oy - wy * l * t0, ox + wx * l * (1 - t0), oy + wy * l * (1 - t0), w * 0.9, (r() - 0.5) * 1.2);
            else sp.add(ox - vx * l * t0, oy - vy * l * t0, ox + vx * l * (1 - t0), oy + vy * l * (1 - t0), w, (r() - 0.5) * 1.4);
          }
        }
      sp.fill(g, black);
    }
    // Couronne, seconde passe : des traits parallèles au contour, de plus en plus gras, qui se fondent dans le noir d'encre ;
    // repris à la main (morceaux interrompus), plus lâches près de la paroi.
    {
      // strates à pas irrégulier : l'écart grandit avec la distance et chaque strate a son propre tremblé
      const lvs: number[] = [];
      for (let lv = between(r, 0.035, 0.08); lv < 0.985; lv += 0.05 * (1 + 0.5 * lv) * between(r, 0.5, 1.55)) lvs.push(lv);
      lvs.forEach((lv, k) => {
        const w = 0.7 + 3.2 * Math.pow(lv, 1.3);
        const path = new Path2D();
        for (const line of isolines(crown, fw, fh, lv, F)) {
          const sm = smoothPoints(jitterPoints(line, between(r, 1.5, 3.8), seed + k * 13, 1 / between(r, 18, 40)), 1, false);
          for (const run of brokenRuns(sm, r, 25, 160, 0.3 * (1 - lv) + 0.08)) {
            run.forEach(([px, py], i) => (i ? path.lineTo(px, py) : path.moveTo(px, py)));
          }
        }
        g.strokeStyle = black;
        g.lineWidth = w * between(r, 0.8, 1.2);
        g.lineCap = "round";
        g.lineJoin = "round";
        g.stroke(path);
      });
      // Fissures rayonnantes : tous les 40 à 80 px le long du pied de la couronne, une cassure encrée part vers
      // le noir et coupe les strates ; sa lèvre tournée vers la lumière accroche un peu de clair.
      const lipC = tint(lipLit, 0.04, 0.32);
      for (const line of isolines(stepF, fw, fh, TH[3] + 0.15 * S, F)) {
        let acc = between(r, 0, 40);
        for (let k = 1; k < line.length; k++) {
          const [x, y] = line[k];
          acc -= Math.hypot(x - line[k - 1][0], y - line[k - 1][1]);
          if (acc > 0) continue;
          acc = between(r, 40, 80);
          if (!outer[idx(x, y)]) continue;
          let [dx, dy] = gradOut(x, y);
          if (!dx && !dy) continue;
          const pts: Pt[] = [[x, y]];
          const maxL = between(r, 0.8, 3.2) * S;
          for (let len = 0; len < maxL; ) {
            const [cx, cy] = pts[pts.length - 1];
            const [gx, gy] = gradOut(cx, cy);
            const ja = (r() - 0.5) * 0.9;
            const nx = dx * 0.6 + gx * 0.4, ny = dy * 0.6 + gy * 0.4;
            dx = nx * Math.cos(ja) - ny * Math.sin(ja);
            dy = nx * Math.sin(ja) + ny * Math.cos(ja);
            const l0 = Math.hypot(dx, dy) || 1;
            dx /= l0;
            dy /= l0;
            const st = between(r, 5, 11);
            const q: Pt = [cx + dx * st, cy + dy * st];
            if (crown[idx(q[0], q[1])] > 1.02) break;
            pts.push(q);
            len += st;
          }
          if (pts.length < 3) continue;
          inkPolyline(g, pts.map(([px, py]) => [px + 1.2, py + 1.2] as Pt), r, { width: 0.9, taper: 8, wobble: 0.2, color: lipC });
          inkPolyline(g, pts, r, { width: between(r, 1.3, 2.4), taper: 12, wobble: 0.3, pressure: 0.45, color: black });
          if (pts.length > 4 && r() < 0.45) {
            const j = 2 + Math.floor(r() * (pts.length - 3));
            const b = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]) + (r() < 0.5 ? 1 : -1) * between(r, 0.5, 1);
            const l = between(r, 10, 24);
            inkLine(g, pts[j][0], pts[j][1], pts[j][0] + Math.cos(b) * l, pts[j][1] + Math.sin(b) * l, r, { width: 1, taper: 6, wobble: 0.3, color: black });
          }
        }
      }
      // trait extérieur épais au bord de la bande de paroi
      for (const line of isolines(stepF, fw, fh, TH[3], F)) {
        let run: Pt[] = [];
        const flush = () => {
          if (run.length > 4) for (const part of brokenRuns(smoothPoints(run, 1, false), r, 60, 220, 0.08)) inkPolyline(g, part, r, { width: between(r, 2.8, 3.6), taper: 10, wobble: 0.5, pressure: 0.45, color: "rgba(8,5,3,.95)" });
          run = [];
        };
        for (const p of line) {
          if (outer[idx(p[0], p[1])]) run.push(p);
          else flush();
        }
        flush();
      }
    }

    // Bord du noir : l'encre profonde mord sur la roche en coups de pinceau effilés (pinceau sec, comme le
    // bord d'une case de BD), longs et serrés par endroits, presque absents ailleurs ; des gouttes isolées.
    {
      const brush = new Spindles();
      const nB = noise2(seed + 47);
      for (const line of isolines(crown, fw, fh, 0.99, F)) {
        let acc = 0;
        for (let k = 1; k < line.length; k++) {
          const [x, y] = line[k];
          acc += Math.hypot(x - line[k - 1][0], y - line[k - 1][1]);
          if (acc < 2.6) continue;
          acc = between(r, -1.5, 0);
          if (!outer[idx(x, y)]) continue;
          const [ux, uy] = gradOut(x, y);
          if (!ux && !uy) continue;
          const kv = nB(x / 60, y / 60) * 0.5 + 0.5;
          if (r() > 0.45 + kv * 0.55) continue;
          const a = Math.atan2(-uy, -ux) + (r() - 0.5) * 0.35; // vers le sol
          const len = (6 + 20 * kv) * between(r, 0.55, 1.2);
          const back = between(r, 2, 6);
          const x0 = x + ux * back, y0 = y + uy * back;
          brush.add(x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, between(r, 1.1, 2.6) * (0.7 + kv * 0.5), (r() - 0.5) * 2);
          if (kv > 0.6 && r() < 0.12) {
            const d = len + between(r, 3, 8);
            const bx = x0 + Math.cos(a) * d, by = y0 + Math.sin(a) * d;
            if (fieldAt(dOut, bx, by) > 4) {
              const s = between(r, 0.7, 1.6);
              brush.path.moveTo(bx + s, by);
              brush.path.arc(bx, by, s, 0, Math.PI * 2);
            }
          }
        }
      }
      brush.fill(g, black);
    }

    // Arêtes : partent de la paroi et montent vers la crête, avec un liseré de lumière côté haut-gauche.
    for (const loop of floorLoops) {
      const pts = alongLoop(loop, S * 0.5);
      let next = Math.floor(r() * 5);
      for (let k = 0; k < pts.length; k++) {
        if (k < next) continue;
        next = k + 4 + Math.floor(r() * 7);
        const p = pts[k];
        if (nearDoor(Math.floor(p.x / S), Math.floor(p.y / S), 1)) continue;
        const maxL = between(r, 0.5, 1.6) * S;
        const line: Pt[] = [[p.x + p.nx * 2, p.y + p.ny * 2]];
        let dx = p.nx;
        let dy = p.ny;
        let len = 0;
        while (len < maxL) {
          const [cx, cy] = line[line.length - 1];
          const [gx, gy] = gradOut(cx, cy);
          const ja = (r() - 0.5) * 0.7;
          let nx = dx * 0.55 + gx * 0.45;
          let ny = dy * 0.55 + gy * 0.45;
          const nl = Math.hypot(nx, ny) || 1;
          nx /= nl;
          ny /= nl;
          dx = nx * Math.cos(ja) - ny * Math.sin(ja);
          dy = nx * Math.sin(ja) + ny * Math.cos(ja);
          const q: Pt = [cx + dx * 6, cy + dy * 6];
          if (fieldAt(dOut, q[0], q[1]) < fieldAt(dOut, cx, cy) - 2) break; // crête atteinte
          line.push(q);
          len += 6;
        }
        if (line.length < 3) continue;
        inkPolyline(g, line.map(([x, y]) => [x - 1.3, y - 1.3] as Pt), r, { width: 1, taper: 10, wobble: 0.3, color: tint(lipLit, 0.12, 0.55) });
        inkPolyline(g, line, r, { width: between(r, 1, 1.6), taper: 12, wobble: 0.4, pressure: 0.5 });
      }
    }

    // Pied de paroi : traits perpendiculaires dont la longueur suit un bruit le long du contour (4 à 14 px),
    // avec des trous ; plus longs et plus gras côté ombre. Sur les portions hautes, le contour est doublé
    // d'un trait fin à 3 px dans la roche : on lit des ressauts et des corniches.
    const foot = new Spindles();
    const nT = noise2(seed + 43);
    floorLoops.forEach((loop, li) => {
      const pts = alongLoop(loop, 2.5);
      let run: Pt[] = [];
      const flush = () => {
        if (run.length > 6) inkPolyline(g, run, r, { width: 0.95, taper: 8, wobble: 0.35, pressure: 0.4, color: "rgba(12,8,5,.9)" });
        run = [];
      };
      pts.forEach((p, j) => {
        const s = j * 2.5;
        const high = nT(s / 70 + 20, li * 3.1) > 0.12;
        if (high && !nearDoor(Math.floor(p.x / S), Math.floor(p.y / S), 1)) run.push([p.x + p.nx * 3.5, p.y + p.ny * 3.5]);
        else flush();
        if (nT(s / 19 + 50, li * 3.1) < -0.38 || r() < 0.1) return;
        const shadowSide = clamp01((p.nx * -LX + p.ny * -LY) * 0.6 + 0.5);
        let L = (4 + 10 * (0.5 + 0.5 * nT(s / 34, li * 3.1 + 9))) * (0.7 + 0.5 * shadowSide) * between(r, 0.8, 1.1);
        const a = Math.atan2(p.ny, p.nx) + (r() - 0.5) * 0.22;
        const x0 = p.x + p.nx * 1.5;
        const y0 = p.y + p.ny * 1.5;
        while (L > 3 && fieldAt(dOut, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L) < 2) L *= 0.6;
        if (L <= 3) return;
        foot.add(x0, y0, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L, between(r, 0.6, 1.5) * (0.7 + 0.45 * shadowSide), (r() - 0.5) * 0.8);
      });
      flush();
    });
    foot.fill(g, INK);

    // Grain de pierre près du sol.
    g.fillStyle = "rgba(22,16,10,.5)";
    g.beginPath();
    for (let i = 0; i < W * H * 2.5; i++) {
      const x = r() * IW;
      const y = r() * IH;
      const v = fieldAt(dOut, x, y);
      if (v < 2 || v > 1.2 * S || r() > 1 - v / (1.3 * S)) continue;
      const s = between(r, 0.5, 1.1);
      g.moveTo(x + s, y);
      g.arc(x, y, s, 0, Math.PI * 2);
    }
    g.fill();
  }
  g.restore();

  // ——— 5. Le sol : lavis superposés, pied des parois, grain du papier, gravier ———
  paintGrain(g, base);
  g.save();
  g.clip(floor.path, "evenodd");
  {
    // Gravier, poussière et pointillés : plus denses au pied des parois et dans les plaques de gravier.
    const r = rng(seed, 331);
    const nG = noise2(seed + 5);
    const darkDots = new Path2D();
    const lightDots = new Path2D();
    for (let i = 0; i < floorCells * 34; i++) {
      const x = r() * IW;
      const y = r() * IH;
      const di = fieldAt(dIn, x, y);
      if (di < 1) continue;
      const gv = nG(x / 46 + 13, y / 46);
      const p = 0.1 + 0.5 * Math.exp(-di / 26) + 0.4 * smooth(0.25, 0.7, gv) + (di < 1.4 * S ? 0.3 : 0);
      if (r() > p) continue;
      const s = between(r, 0.45, 1.2);
      const path = r() < 0.65 ? darkDots : lightDots;
      path.moveTo(x + s, y);
      path.arc(x, y, s, 0, Math.PI * 2);
    }
    g.fillStyle = "rgba(22,16,10,.5)";
    g.fill(darkDots);
    g.fillStyle = tint(gravelC, 0.15, 0.55);
    g.fill(lightDots);
  }
  g.restore();

  // ——— 6. L'eau : berge humide, lac profond, remous, reflets ———
  const r6 = rng(seed, 401);
  const lakes: number[][] = [];
  {
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || map.tiles[i] !== T.eau) continue;
      const comp: number[] = [];
      const stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const k = stack.pop()!;
        comp.push(k);
        const x = k % W;
        const y = Math.floor(k / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (!seen[j] && map.tiles[j] === T.eau) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
      lakes.push(comp);
    }
  }
  // Les quatre lavis de l'eau, communs au lac, au ruisseau et aux flaques : bord clair, fond sombre.
  const waterLayers = [waterShallow, mixColor(waterShallow, waterMid, 0.55), waterMid, mixColor(waterMid, waterDeep, 0.7)];
  /** Galet mouillé sur la rive : la pierre, puis un point de lumière. */
  const wetPebble = (r: Rng, x: number, y: number, rad: number) => {
    stone(g, r, x, y, rad, mixColor(mixColor(rockCol, theme.floor, 0.25), theme.water, 0.15));
    // reflet mouillé : une virgule décentrée, chaque fois ailleurs, du côté de la lumière
    const [lx, ly] = lightAt(x, y);
    const a = Math.atan2(-ly, -lx) + (r() - 0.5) * 1.3;
    const d = rad * between(r, 0.2, 0.5);
    const hx = x + Math.cos(a) * d, hy = y + Math.sin(a) * d;
    const l = rad * between(r, 0.3, 0.6);
    const t = a + Math.PI / 2 + (r() - 0.5) * 0.6;
    const w = Math.max(0.7, rad * between(r, 0.14, 0.26));
    inkLine(g, hx - Math.cos(t) * l * 0.5, hy - Math.sin(t) * l * 0.5, hx + Math.cos(t) * l * 0.5, hy + Math.sin(t) * l * 0.5, r, { width: w, taper: 3, wobble: 0.2, color: `rgba(240,246,242,${between(r, 0.55, 0.8)})` });
  };
  // le lac est peint avant le ruisseau ; le ruisseau, découpé sur la terre sèche, rejoint l'eau sans couture
  const drawLake = (water: Shape) => {
    // tout reste dans le sol : le contour de l'eau peut déborder sous la roche
    g.save();
    g.clip(floor.path, "evenodd");
    // berge de sable mouillé : une bande nette plus sombre, puis l'humidité qui s'éteint
    g.save();
    g.clip(dryPath, "evenodd");
    g.lineJoin = "round";
    g.strokeStyle = tint(dampC, -0.03, 0.22);
    g.lineWidth = 28;
    g.stroke(water.path);
    g.strokeStyle = mixColor(dampC, earth, 0.2);
    g.lineWidth = 11;
    g.stroke(water.path);
    g.restore();
    g.save();
    g.clip(water.path, "evenodd");
    // reflets : traits clairs couchés, parallèles, en petits groupes
    g.lineCap = "round";
    for (const comp of lakes)
      for (const k of comp) {
        if (r6() < 0.5) continue;
        const x = (k % W + r6()) * S;
        const y = (Math.floor(k / W) + r6()) * S;
        if (fieldAt(dW, x, y) < 5) continue;
        const n = 1 + Math.floor(r6() * 3);
        for (let q = 0; q < n; q++) {
          const l = between(r6, 5, 14);
          const yy = y + q * 3;
          const xx = x + (r6() - 0.5) * 6;
          inkLine(g, xx - l, yy, xx + l, yy - 0.5, r6, { width: between(r6, 0.7, 1.2), taper: 4, wobble: 0.2, color: `rgba(232,242,240,${between(r6, 0.3, 0.6)})` });
        }
      }
    // pierres émergées entourées de remous concentriques
    for (const comp of lakes) {
      const n = Math.min(3, Math.floor(comp.length / 6) + 1);
      for (let q = 0; q < n; q++) {
        const k = comp[Math.floor(r6() * comp.length)];
        const x = (k % W + between(r6, 0.25, 0.75)) * S;
        const y = (Math.floor(k / W) + between(r6, 0.25, 0.75)) * S;
        if (fieldAt(dW, x, y) > 1.4 * S || fieldAt(dW, x, y) < 6) continue;
        const rad = between(r6, 3.5, 8);
        for (let ring = 1; ring <= 3; ring++) {
          g.strokeStyle = `rgba(225,238,236,${0.5 - ring * 0.12})`;
          g.lineWidth = 0.9;
          g.beginPath();
          g.ellipse(x, y, rad + ring * 4, (rad + ring * 4) * 0.8, 0.2, 0, Math.PI * 2);
          g.stroke();
        }
        wetPebble(r6, x, y, rad);
      }
      // gouttes qui tombent de la voûte : cercles de ride autour d'un point clair
      const drips = 1 + Math.floor(r6() * Math.min(3, comp.length / 8));
      for (let q = 0; q < drips; q++) {
        const k = comp[Math.floor(r6() * comp.length)];
        const x = (k % W + between(r6, 0.2, 0.8)) * S;
        const y = (Math.floor(k / W) + between(r6, 0.2, 0.8)) * S;
        if (fieldAt(dW, x, y) < 0.35 * S) continue;
        for (let ring = 0; ring < 4; ring++) {
          const rr = 2.5 + ring * between(r6, 3.5, 5);
          g.strokeStyle = `rgba(236,244,242,${0.62 - ring * 0.14})`;
          g.lineWidth = ring ? 0.8 : 1.1;
          g.beginPath();
          g.ellipse(x, y, rr, rr * 0.82, 0, 0, Math.PI * 2);
          g.stroke();
        }
        g.fillStyle = "rgba(245,250,248,.9)";
        g.beginPath();
        g.arc(x, y, 1.1, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    // rive : trait d'encre continu, interrompu là où le ruisseau entre (l'eau ne fait qu'une), puis des galets
    // mouillés posés sur le sable
    const ribs = streams.map((st) => polyPath(ribbon(st.pts, st.nrm, (i) => st.w[i] / 2 + 2)));
    const wet = (p: Pt) => ribs.some((rb) => g.isPointInPath(rb, p[0], p[1]));
    for (const loop of waterLoops) {
      const cut = loop.map(wet);
      if (!cut.some(Boolean)) {
        inkPolyline(g, loop, r6, { width: 1.6, wobble: 0.5, pressure: 0.5, closed: true, color: inkWater });
        continue;
      }
      // départ sur un point coupé, pour que chaque morceau soit d'un seul tenant
      const s0 = cut.indexOf(true);
      let run: Pt[] = [];
      for (let k = 1; k <= loop.length; k++) {
        const i = (s0 + k) % loop.length;
        if (!cut[i]) run.push(loop[i]);
        else if (run.length) {
          if (run.length > 1) inkPolyline(g, run, r6, { width: 1.6, wobble: 0.5, pressure: 0.5, taper: 4, color: inkWater });
          run = [];
        }
      }
      if (run.length > 1) inkPolyline(g, run, r6, { width: 1.6, wobble: 0.5, pressure: 0.5, taper: 4, color: inkWater });
    }
    g.restore();
    for (const loop of waterLoops)
      for (const p of alongLoop(loop, 13)) {
        if (r6() > 0.32) continue;
        const o = between(r6, 3, 9);
        const x = p.x + p.nx * o;
        const y = p.y + p.ny * o;
        if (!onDry(x, y) || fieldAt(dIn, x, y) < 4 || !isFree(x, y, 2)) continue;
        wetPebble(r6, x, y, between(r6, 1.6, 3.8));
      }
  };

  // ——— 7. Le ruisseau : sort d'une paroi, traverse les salles, rejoint le lac (ou repart sous la roche) ———
  const OW = W * 2;
  const OH = H * 2;
  const occ = new Uint8Array(OW * OH);
  const half = S / 2;
  const isFree = (x: number, y: number, rad: number) => {
    const x0 = Math.floor((x - rad) / half), x1 = Math.floor((x + rad) / half);
    const y0 = Math.floor((y - rad) / half), y1 = Math.floor((y + rad) / half);
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) if (xx < 0 || yy < 0 || xx >= OW || yy >= OH || occ[yy * OW + xx]) return false;
    return true;
  };
  const take = (x: number, y: number, rad: number) => {
    const x0 = Math.floor((x - rad) / half), x1 = Math.floor((x + rad) / half);
    const y0 = Math.floor((y - rad) / half), y1 = Math.floor((y + rad) / half);
    for (let yy = Math.max(0, y0); yy <= Math.min(OH - 1, y1); yy++) for (let xx = Math.max(0, x0); xx <= Math.min(OW - 1, x1); xx++) occ[yy * OW + xx] = 1;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === T.porte) take((x + 0.5) * S, (y + 0.5) * S, S);
  const streams: { pts: Pt[]; nrm: Pt[]; w: number[] }[] = [];
  {
    const r = rng(seed, 451);
    // départs possibles : case sèche contre une paroi épaisse
    const cands: { x: number; y: number; dx: number; dy: number }[] = [];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (!dry(x, y) || nearDoor(x, y, 2) || narrow(x, y)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          if (isSolid(at(x + dx, y + dy)) && isSolid(at(x + 2 * dx, y + 2 * dy)) && isSolid(at(x + dx + dy, y + dy + dx)) && isSolid(at(x + dx - dy, y + dy - dx))) cands.push({ x, y, dx, dy });
      }
    // Dijkstra sur les cases, en préférant le milieu des salles
    const route = (sources: number[]): { dist: Float64Array; prev: Int32Array } => {
      const dist = new Float64Array(W * H).fill(Infinity);
      const prev = new Int32Array(W * H).fill(-1);
      const heap: [number, number][] = [];
      const push = (d: number, k: number) => {
        heap.push([d, k]);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          [heap[p], heap[i]] = [heap[i], heap[p]];
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop()!;
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const a = 2 * i + 1, b = a + 1;
            let m = i;
            if (a < heap.length && heap[a][0] < heap[m][0]) m = a;
            if (b < heap.length && heap[b][0] < heap[m][0]) m = b;
            if (m === i) break;
            [heap[m], heap[i]] = [heap[i], heap[m]];
            i = m;
          }
        }
        return top;
      };
      for (const s of sources) {
        dist[s] = 0;
        push(0, s);
      }
      while (heap.length) {
        const [d, k] = pop();
        if (d > dist[k]) continue;
        const x = k % W, y = Math.floor(k / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (!dry(nx, ny) || nearDoor(nx, ny, 1)) continue;
          const j = ny * W + nx;
          const cd = cellDist[j];
          const nd = d + 1 + 2.4 / (cd * cd) + (narrow(nx, ny) ? 3 : 0);
          if (nd < dist[j]) {
            dist[j] = nd;
            prev[j] = k;
            push(nd, j);
          }
        }
      }
      return { dist, prev };
    };
    const pathTo = (prev: Int32Array, k: number) => {
      const out: number[] = [];
      for (let c = k; c >= 0; c = prev[c]) out.push(c);
      return out;
    };
    const lake = lakes.reduce<number[] | null>((b, l) => (!b || l.length > b.length ? l : b), null);
    const plans: { cells: number[]; from: (typeof cands)[number]; to: (typeof cands)[number] | null }[] = [];
    if (cands.length) {
      if (lake && lake.length >= 4) {
        // sources : les cases sèches qui bordent le lac
        const shore: number[] = [];
        for (const k of lake) {
          const x = k % W, y = Math.floor(k / W);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (dry(x + dx, y + dy)) shore.push((y + dy) * W + x + dx);
        }
        const { dist, prev } = route(shore);
        const ok = cands.filter((c) => dist[c.y * W + c.x] >= 9 && dist[c.y * W + c.x] <= 34);
        const a = ok.length ? ok[Math.floor(r() * ok.length)] : null;
        if (a) {
          plans.push({ cells: pathTo(prev, a.y * W + a.x), from: a, to: null });
          // trop-plein : repart de l'autre côté du lac, sous une autre paroi
          const far = ok.filter((c) => Math.hypot(c.x - a.x, c.y - a.y) > 12);
          const b = far.length ? far[Math.floor(r() * far.length)] : null;
          if (b) plans.push({ cells: pathTo(prev, b.y * W + b.x), from: b, to: null });
        }
      } else {
        const a = cands[Math.floor(r() * cands.length)];
        const { dist, prev } = route([a.y * W + a.x]);
        const ok = cands.filter((c) => dist[c.y * W + c.x] >= 16 && dist[c.y * W + c.x] < Infinity);
        ok.sort((p, q) => dist[q.y * W + q.x] - dist[p.y * W + p.x]);
        const b = ok.length ? ok[Math.floor(r() * Math.min(5, ok.length))] : null;
        if (b) plans.push({ cells: pathTo(prev, b.y * W + b.x).reverse(), from: a, to: b });
      }
    }
    const nS = noise2(seed + 61);
    for (const plan of plans) {
      // de la paroi (case `from`) vers le lac ou vers l'autre paroi
      const cells = plan.cells[0] === plan.from.y * W + plan.from.x ? plan.cells : [...plan.cells].reverse();
      const ctrl: Pt[] = [[(plan.from.x + 0.5 + plan.from.dx * 1.1) * S, (plan.from.y + 0.5 + plan.from.dy * 1.1) * S]];
      // chemin de cases adouci (plus d'angles droits), puis méandres le long de sa normale
      let mid: Pt[] = cells.map((k) => [(k % W + 0.5) * S, (Math.floor(k / W) + 0.5) * S] as Pt);
      for (let pass = 0; pass < 4; pass++)
        mid = mid.map((p, i) => {
          if (i === 0 || i === mid.length - 1) return p;
          const q: Pt = [(mid[i - 1][0] + 2 * p[0] + mid[i + 1][0]) / 4, (mid[i - 1][1] + 2 * p[1] + mid[i + 1][1]) / 4];
          return onDry(q[0], q[1]) && fieldAt(dIn, q[0], q[1]) > 0.35 * S ? q : p;
        });
      const mn = normalsOf(mid, false);
      const phase = r() * Math.PI * 2;
      const lambda = between(r, 3.5, 5.5) * S;
      let run = 0;
      mid.forEach((p, i) => {
        if (i) run += Math.hypot(p[0] - mid[i - 1][0], p[1] - mid[i - 1][1]);
        const ends = Math.min(1, i / 2, (mid.length - 1 - i) / 2);
        let a = Math.sin((run / lambda) * Math.PI * 2 + phase) * 0.3 * S * ends + (r() - 0.5) * 0.12 * S;
        for (let tries = 0; tries < 3; tries++) {
          const q: Pt = [p[0] + mn[i][0] * a, p[1] + mn[i][1] * a];
          if (onDry(q[0], q[1]) && fieldAt(dIn, q[0], q[1]) > 0.38 * S) break;
          a *= 0.4;
        }
        ctrl.push([p[0] + mn[i][0] * a, p[1] + mn[i][1] * a]);
      });
      if (plan.to) ctrl.push([(plan.to.x + 0.5 + plan.to.dx * 1.1) * S, (plan.to.y + 0.5 + plan.to.dy * 1.1) * S]);
      else {
        // finit dans le lac : on prolonge d'une case dans la direction d'arrivée
        const [lx, ly] = ctrl[ctrl.length - 1];
        const [px, py] = ctrl[ctrl.length - 2];
        const l = Math.hypot(lx - px, ly - py) || 1;
        ctrl.push([lx + ((lx - px) / l) * S * 0.9, ly + ((ly - py) / l) * S * 0.9]);
      }
      // un point sur deux suffit pour une courbe souple
      const thin = ctrl.filter((_, i) => i === 0 || i === ctrl.length - 1 || i % 2 === 1);
      const pts = smoothPoints(catmullRom(thin, 5), 1, false);
      const nrm = normalsOf(pts, false);
      // Largeur : filet à la source, qui s'élargit vers l'aval, avec des goulets et des replats (retouche).
      const lens: number[] = [0];
      pts.forEach((p, i) => i && lens.push(lens[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])));
      const tot = lens[lens.length - 1] || 1;
      const w = pts.map((_, i) => {
        const s = lens[i];
        const u = s / tot;
        const grow = plan.to ? Math.sin(Math.PI * u) : smooth(0, 1, u);
        const v = 0.58 + 0.34 * grow + 0.3 * nS(s / (1.05 * S), 3.3) + 0.18 * Math.max(0, nS(s / (2.4 * S) + 9, 5.1));
        return S * Math.min(1.25, Math.max(0.5, v));
      });
      streams.push({ pts, nrm, w });
      for (const [x, y] of pts) take(x, y, S * 0.45);
    }
  }
  // Embouchures : là où le ruisseau sort de la roche (ou s'y perd), une encoche taillée dans la paroi,
  // dessinée après le contour.
  if (water) drawLake(water);
  const mouths: { x: number; y: number; a: number; w: number }[] = [];
  for (const st of streams) {
    const r = rng(seed, 461, streams.indexOf(st));
    const { pts, nrm, w } = st;
    const rib = (k: number, add = 0) => polyPath(ribbon(pts, nrm, (i) => (w[i] * k) / 2 + add));
    g.save();
    g.clip(floor.path, "evenodd");
    g.clip(dryPath, "evenodd");
    g.lineJoin = "round";
    // berge de sable mouillé, plus sombre, sur 4 à 6 px de chaque côté, et l'humidité au-delà
    g.fillStyle = tint(dampC, -0.02, 0.22);
    g.fill(rib(1, 14));
    g.fillStyle = mixColor(dampC, earth, 0.2);
    g.fill(rib(1, 5));
    // lavis superposés, du bord clair au centre sombre, chaque couche cernée de pigment
    const ks = [1, 0.74, 0.46, 0.2];
    ks.forEach((k, li) => {
      const p = rib(k);
      g.fillStyle = waterLayers[li];
      g.fill(p);
      g.strokeStyle = tint(waterLayers[li], -0.1, 0.55);
      g.lineWidth = 1.1;
      g.stroke(p);
    });
    // lit de galets vus à travers l'eau
    g.fillStyle = tint(waterShallow, 0.1, 0.4);
    g.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      if (r() < 0.55) continue;
      const o = (r() - 0.5) * w[i] * 0.8;
      const x = pts[i][0] + nrm[i][0] * o;
      const y = pts[i][1] + nrm[i][1] * o;
      g.moveTo(x + 2.4, y);
      g.ellipse(x, y, between(r, 1.2, 2.6), between(r, 0.9, 1.8), r() * Math.PI, 0, Math.PI * 2);
    }
    g.fill();
    // courant : traits blancs courts, dans le sens du flux, groupés au milieu
    for (let i = 2; i < pts.length - 3; i++) {
      if (r() > 0.42) continue;
      const o = (r() - 0.5) * 0.6;
      const j = Math.min(pts.length - 1, i + 1 + Math.floor(r() * 2));
      const x0 = pts[i][0] + nrm[i][0] * w[i] * o;
      const y0 = pts[i][1] + nrm[i][1] * w[i] * o;
      const x1 = pts[j][0] + nrm[j][0] * w[j] * o;
      const y1 = pts[j][1] + nrm[j][1] * w[j] * o;
      inkLine(g, x0, y0, x1, y1, r, { width: between(r, 0.7, 1.3), taper: 3, wobble: 0.15, color: `rgba(238,246,242,${between(r, 0.4, 0.75)})` });
    }
    // Remous : des pierres émergées dans le courant, chacune avec son sillage en V vers l'aval et sa moustache
    // d'écume en amont (retouche : le ruisseau n'avait ni rochers ni vagues).
    {
      const nSt = Math.max(2, Math.round(pts.length / 16));
      for (let k = 0; k < nSt; k++) {
        const i = 3 + Math.floor(r() * Math.max(1, pts.length - 7));
        if (i >= pts.length - 2) continue;
        const o = (r() - 0.5) * w[i] * 0.55;
        const x = pts[i][0] + nrm[i][0] * o, y = pts[i][1] + nrm[i][1] * o;
        const rad = between(r, 2.4, 5.2);
        const fa = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]);
        for (const side of [-1, 1]) {
          const ang = fa + side * between(r, 0.28, 0.42);
          const l = between(r, 12, 26);
          const sx = x + Math.cos(fa) * rad * 0.8, sy = y + Math.sin(fa) * rad * 0.8;
          inkLine(g, sx, sy, sx + Math.cos(ang) * l, sy + Math.sin(ang) * l, r, { width: between(r, 0.8, 1.3), taper: 6, wobble: 0.3, color: "rgba(238,246,242,.62)" });
          if (r() < 0.6) inkLine(g, sx + Math.cos(ang) * l * 0.3, sy + Math.sin(ang) * l * 0.3, sx + Math.cos(ang + side * 0.15) * l * 1.05, sy + Math.sin(ang + side * 0.15) * l * 1.05, r, { width: 0.7, taper: 4, wobble: 0.3, color: "rgba(238,246,242,.4)" });
        }
        g.strokeStyle = "rgba(240,248,244,.7)";
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(x - Math.cos(fa) * rad * 0.5, y - Math.sin(fa) * rad * 0.5, rad * 0.5, rad * 1.25, fa, Math.PI * 0.55, Math.PI * 1.45);
        g.stroke();
        wetPebble(r, x, y, rad);
      }
    }
    // Berges : un trait d'encre repris par morceaux, lourd côté ombre (bas-droite), fin et claire côté lumière ;
    // la lèvre de terre sèche accroche un liseré ; des hachures courtes et des galets sur la rive.
    const bankHatch = new Spindles();
    for (const side of [-1, 1]) {
      const line = pts.map(([x, y], i) => [x + nrm[i][0] * w[i] * 0.5 * side, y + nrm[i][1] * w[i] * 0.5 * side] as Pt);
      for (const run of brokenRuns(line, r, 40, 150, 0.1)) {
        const m = Math.max(1, Math.floor(run.length / 2));
        if (run.length < 3) continue;
        // normale locale (même convention que nrm), tournée du côté de la berge
        const tl = Math.hypot(run[m + 1 > run.length - 1 ? m : m + 1][0] - run[m - 1][0], run[m + 1 > run.length - 1 ? m : m + 1][1] - run[m - 1][1]) || 1;
        const q1 = run[m + 1 > run.length - 1 ? m : m + 1];
        const bnx = ((q1[1] - run[m - 1][1]) / tl) * side, bny = (-(q1[0] - run[m - 1][0]) / tl) * side;
        // berge dont la pente regarde vers le bas-droite (opposée à la lumière) : à l'ombre, trait lourd
        const shade = clamp01(-(bnx * LX + bny * LY) * 0.9 + 0.5);
        if (shade < 0.5) {
          inkPolyline(g, run.map(([x, y]) => [x + bnx * 2.6, y + bny * 2.6] as Pt), r, { width: 1.2, taper: 6, wobble: 0.4, color: tint(earth, 0.16, 0.5) });
        }
        inkPolyline(g, run, r, { width: between(r, 1.5, 2.1) * (0.65 + 0.9 * shade), taper: 7, wobble: 0.5, pressure: 0.55, color: `rgba(12,9,6,${0.55 + 0.4 * shade})` });
      }
      // petites hachures d'ombre jetées dans l'eau par la berge du haut-gauche, perpendiculaires à la berge
      for (let i = 1; i < pts.length - 1; i++) {
        const shade = -(nrm[i][0] * side * LX + nrm[i][1] * side * LY);
        if (shade < 0.15 || r() < 0.45) continue;
        const [bx, by] = line[i];
        const l = between(r, 3, 7) * (0.6 + shade * 0.6);
        bankHatch.add(bx, by, bx - nrm[i][0] * side * l, by - nrm[i][1] * side * l, between(r, 0.4, 0.7), (r() - 0.5) * 0.8);
      }
      for (let i = 0; i < pts.length; i += 2) {
        if (r() < 0.3) continue;
        const o = (w[i] * 0.5 + between(r, 2.5, 10)) * side;
        const x = pts[i][0] + nrm[i][0] * o;
        const y = pts[i][1] + nrm[i][1] * o;
        if (!onDry(x, y) || fieldAt(dIn, x, y) < 4) continue;
        wetPebble(r, x, y, between(r, 1.6, 4.6));
      }
    }
    bankHatch.fill(g, "rgba(14,10,6,.7)");
    g.restore();
    for (const end of [0, pts.length - 1]) {
      if (fieldAt(dOut, pts[end][0], pts[end][1]) <= 0) continue;
      const dir = end === 0 ? 1 : -1;
      let i = end;
      while (i >= 0 && i < pts.length && fieldAt(dOut, pts[i][0], pts[i][1]) > 0) i += dir;
      if (i <= 0 || i >= pts.length - 1) continue;
      const [mx, my] = pts[i];
      const [bx, by] = pts[i - dir];
      mouths.push({ x: mx, y: my, a: Math.atan2(by - my, bx - mx), w: w[i] });
    }
  }
  /** Encoche dans la paroi : bouche noire qui s'enfonce, langue d'eau qui s'y perd, bords à l'encre. */
  const drawMouths = () => {
    const r = rng(seed, 471);
    for (const m of mouths) {
      g.save();
      g.translate(m.x, m.y);
      g.rotate(m.a);
      const hw = m.w * 0.66;
      const D = between(r, 0.5, 0.7) * S;
      const side: Pt[] = [[-5, -hw], [D * 0.45, -hw * 1.08], [D * 0.9, -hw * 0.6], [D, 0], [D * 0.9, hw * 0.6], [D * 0.45, hw * 1.08], [-5, hw]];
      const curve = catmullRom(side, 3);
      const p = polyPath(curve);
      const gr = g.createLinearGradient(-5, 0, D, 0);
      gr.addColorStop(0, mixColor(waterDeep, INK, 0.35));
      gr.addColorStop(0.5, "#0b0806");
      gr.addColorStop(1, "#020101");
      g.fillStyle = gr;
      g.fill(p);
      const wt = g.createLinearGradient(-5, 0, D * 0.75, 0);
      wt.addColorStop(0, tint(waterMid, 0.02, 0.9));
      wt.addColorStop(1, tint(waterMid, 0, 0));
      g.fillStyle = wt;
      g.beginPath();
      g.ellipse(D * 0.1, 0, D * 0.55, m.w * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      inkPolyline(g, curve, r, { width: 2.6, taper: 5, wobble: 0.4, pressure: 0.4 });
      g.restore();
    }
  };


  // Flaques : d'une demi-case à une case et demie, parfois deux ou trois lobes fondus ; regroupées près du
  // ruisseau et dans les creux. Auréole de terre mouillée, eau en deux lavis, bord à l'encre interrompu,
  // reflet en un ou deux traits courbes du côté de la lumière.
  {
    const r = rng(seed, 473);
    const nLow = noise2(seed + 7);
    /** Contour d'une flaque : rayon, dans chaque direction, du plus lointain des lobes, puis bruité. */
    const puddleShape = (x: number, y: number, R: number): Pt[] => {
      const lobes: [number, number, number][] = [[x, y, R]];
      const extra = r() < 0.6 ? 1 + Math.floor(r() * 2) : 0;
      for (let k = 0; k < extra; k++) {
        const a = r() * Math.PI * 2;
        const d = R * between(r, 0.35, 0.65);
        lobes.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, R * between(r, 0.5, 0.8)]);
      }
      const m = 8 + Math.floor(r() * 5);
      const asp = between(r, 0.6, 0.95);
      const rot = r() * Math.PI;
      const out: Pt[] = [];
      for (let j = 0; j < m * 3; j++) {
        const th = (j / (m * 3)) * Math.PI * 2;
        const ux = Math.cos(th), uy = Math.sin(th);
        let t = 0;
        for (const [lx, ly, lr] of lobes) {
          // lobe aplati selon l'axe de la flaque
          const dx = (lx - x) * Math.cos(-rot) - (ly - y) * Math.sin(-rot);
          const dy = ((lx - x) * Math.sin(-rot) + (ly - y) * Math.cos(-rot)) / asp;
          const b = dx * ux + dy * uy;
          const disc = b * b - (dx * dx + dy * dy - lr * lr);
          if (disc >= 0) t = Math.max(t, b + Math.sqrt(disc));
        }
        out.push([ux * t, uy * t * asp]);
      }
      // m sommets bruités, repris en courbe
      // rayon modulé par deux harmoniques tirées au hasard, puis m sommets repris en courbe
      const h2 = between(r, 0.08, 0.2), h3 = between(r, 0.06, 0.16), f2 = r() * 6.3, f3 = r() * 6.3;
      const verts: Pt[] = [];
      for (let j = 0; j < m; j++) {
        const q = j * 3 + Math.floor(r() * 3);
        const th = (q / (m * 3)) * Math.PI * 2;
        const [px, py] = out[q];
        const f = 1 + h2 * Math.sin(2 * th + f2) + h3 * Math.sin(3 * th + f3) + (r() - 0.5) * 0.14;
        verts.push([x + (px * Math.cos(rot) - py * Math.sin(rot)) * f, y + (px * Math.sin(rot) + py * Math.cos(rot)) * f]);
      }
      return smoothPoints(verts, 2);
    };
    const scaled = (pts: Pt[], x: number, y: number, k: number, ox = 0, oy = 0) => pts.map(([px, py]) => [x + ox + (px - x) * k, y + oy + (py - y) * k] as Pt);
    const drawPuddle = (x: number, y: number, R: number) => {
      const pts = puddleShape(x, y, R);
      const path = polyPath(pts);
      // auréole de terre mouillée : 4 à 8 px autour du bord, un lavis sombre au bord fondu
      const grow = between(r, 4, 8);
      const ring = smoothPoints(pts.map(([px, py]) => {
        const l = Math.hypot(px - x, py - y) || 1;
        const k = (l + grow * between(r, 0.7, 1.3)) / l;
        return [x + (px - x) * k, y + (py - y) * k] as Pt;
      }), 2);
      g.save();
      g.clip(floor.path, "evenodd");
      g.filter = "blur(2.5px)";
      g.globalCompositeOperation = "multiply";
      g.fillStyle = tint(mixColor(dampC, waterMid, 0.25), 0, 0.4);
      // un anneau seulement : l'eau elle-même n'est pas assombrie deux fois
      const annulus = polyPath(ring);
      annulus.addPath(polyPath(smoothPoints(pts.map(([px, py]) => [x + (px - x) * 0.85, y + (py - y) * 0.85] as Pt), 1)));
      g.fill(annulus, "evenodd");
      g.filter = "none";
      g.restore();
      // l'eau : le sol vu à travers, en « multiply » d'une teinte froide ; plus profonde vers le haut-gauche
      g.save();
      g.globalCompositeOperation = "multiply";
      const gr = g.createLinearGradient(x - R * LX, y - R * LY, x + R * LX, y + R * LY);
      gr.addColorStop(0, mixColor(theme.water, "#ffffff", 0.42));
      gr.addColorStop(0.6, mixColor(theme.water, "#ffffff", 0.58));
      gr.addColorStop(1, mixColor(theme.water, "#ffffff", 0.68));
      g.fillStyle = gr;
      g.fill(path);
      // la berge du haut-gauche porte son ombre dans l'eau : un croissant, pas un liseré tout autour
      g.clip(path);
      const sh = new Path2D();
      sh.rect(x - R * 3, y - R * 3, R * 6, R * 6);
      const ox = between(r, 2.5, 4.5);
      sh.addPath(polyPath(pts), new DOMMatrix([1, 0, 0, 1, ox, ox * between(r, 0.8, 1.2)]));
      g.fillStyle = mixColor(mixColor(theme.water, INK, 0.3), "#ffffff", 0.55);
      g.fill(sh, "evenodd");
      g.restore();
      // reflets : un ou deux traits blancs cassés, décentrés vers la lumière, jamais au même endroit
      g.save();
      g.clip(path);
      const nRef = R > 0.38 * S && r() < 0.6 ? 2 : 1;
      for (let q = 0; q < nRef; q++) {
        const a = Math.atan2(-LY, -LX) + (r() - 0.5) * 1.6;
        const d = R * between(r, 0.1, 0.4);
        const cx = x - Math.cos(a) * d * 0.3 + (r() - 0.5) * R * 0.3, cy = y + Math.sin(a) * d * 0.5 + R * 0.15;
        const l = R * between(r, 0.4, 0.75) * (q ? 0.6 : 1);
        const t = between(r, -0.4, 0.1);
        const ca = Math.cos(t), sa = Math.sin(t);
        // le trait est coupé en deux ou trois morceaux inégaux
        let u = -l / 2;
        while (u < l / 2) {
          const seg = l * between(r, 0.18, 0.45);
          const u1 = Math.min(l / 2, u + seg);
          const bend = (r() - 0.5) * 1.6;
          inkPolyline(g, [[cx + ca * u, cy + sa * u], [cx + ca * (u + u1) / 2 - sa * bend, cy + sa * (u + u1) / 2 + ca * bend], [cx + ca * u1, cy + sa * u1]], r, { width: between(r, 0.9, 1.6) * (q ? 0.75 : 1), taper: 3, wobble: 0.15, color: `rgba(246,249,246,${between(r, 0.5, 0.8).toFixed(2)})` });
          u = u1 + l * between(r, 0.06, 0.16);
        }
      }
      g.restore();
      // bord à l'encre, repris par morceaux, plus appuyé côté ombre (bas-droite)
      for (const run of brokenRuns([...pts, pts[0]], r, 8, 30, 0.4)) {
        const [mx, my] = run[Math.floor(run.length / 2)];
        const shade = ((mx - x) * LX + (my - y) * LY) / R;
        inkPolyline(g, run, r, { width: between(r, 0.7, 1.1) * (1 + 0.5 * clamp01(shade)), wobble: 0.35, pressure: 0.45, taper: 4, color: inkWater });
      }
    };
    const want = Math.max(3, Math.round(floorCells / 85));
    const placed: Pt[] = [];
    for (let t = 0, made = 0; t < want * 40 && made < want; t++) {
      const cx = Math.floor(r() * W), cy = Math.floor(r() * H);
      if (!dry(cx, cy) || narrow(cx, cy) || nearDoor(cx, cy, 1)) continue;
      const x = (cx + between(r, 0.2, 0.8)) * S, y = (cy + between(r, 0.2, 0.8)) * S;
      // près de l'eau, dans les creux (bruit bas) ou à côté d'une autre flaque
      const dw = fieldAt(dToW, x, y);
      const low = nLow(x / 260, y / 260);
      const nearP = placed.some(([px, py]) => Math.hypot(px - x, py - y) < 2.2 * S);
      const pr = dw < 2.4 * S ? 0.7 : nearP ? 0.5 : low < -0.3 ? 0.35 : 0.04;
      if (r() > pr) continue;
      const R = between(r, 0.25, nearP ? 0.45 : 0.72) * S;
      if (dw < R + 6 || fieldAt(dIn, x, y) < R + 8 || !isFree(x, y, R * 0.8)) continue;
      take(x, y, R);
      placed.push([x, y]);
      made++;
      drawPuddle(x, y, R);
    }
    // Plaques de terre humide : une par grande salle au plus (deux près de l'eau), à deux cases des parois ;
    // lavis sombres empilés au bord fondu, un fin trait d'encre irrégulier à 30 %, quelques reflets en virgule.
    // On doit lire de la terre mouillée, pas un relief.
    g.save();
    g.clip(floor.path, "evenodd");
    centers.forEach(([zx, zy], zi) => {
      const cd = cellDist[zy * W + zx];
      if (cd < 4 || r() > 0.65) return;
      for (let t = 0; t < 30; t++) {
        const cx = Math.round(zx + (r() - 0.5) * 2 * (cd - 1)), cy = Math.round(zy + (r() - 0.5) * 2 * (cd - 1));
        if (!dry(cx, cy) || cellDist[cy * W + cx] < 3 || nearDoor(cx, cy, 1) || zoneOf[cy * W + cx] !== zi) continue;
        const x = (cx + r()) * S, y = (cy + r()) * S;
        const R = between(r, 0.6, 1.05) * S;
        if (!onDry(x, y) || fieldAt(dIn, x, y) < R + S || !isFree(x, y, R * 0.6)) continue;
        const blob = smoothPoints(blobPoints(r, x, y, R, R * between(r, 0.5, 0.8), 12, 0.35, r() * Math.PI), 2);
        for (const k of [1.3, 1.2, 1.1, 1, 0.9, 0.78]) {
          g.fillStyle = tint(dampC, -0.08, 0.06);
          g.fill(polyPath(scaled(blob, x, y, k * between(r, 0.96, 1.04))));
        }
        for (const run of brokenRuns(jitterPoints(blob, 1.2, seed + zi * 31, 1 / 9), r, 12, 40, 0.35, true))
          inkPolyline(g, run, r, { width: between(r, 0.5, 0.8), taper: 4, wobble: 0.4, color: "rgba(22,16,10,.3)" });
        for (let q = 0; q < 3; q++) {
          const a = r() * Math.PI * 2;
          const d = Math.sqrt(r()) * R * 0.6;
          const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7;
          const l = between(r, 3, 6);
          inkPolyline(g, [[px - l / 2, py + 0.6], [px, py - between(r, 0.4, 1.2)], [px + l / 2, py]], r, { width: 0.9, taper: 3, wobble: 0.1, color: "rgba(236,240,232,.42)" });
        }
        break;
      }
    });
    g.restore();
  }

  // ——— Lumières, posées avant le décor : le feu du campement et les rais ; chaque ombre portée en part ———
  const rCamp = rng(seed, 501);
  let fire: Pt | null = null;
  {
    const r = rCamp;
    let best = -1;
    let bx = 0;
    let by = 0;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        if (!dry(x, y)) continue;
        const px = (x + 0.5) * S, py = (y + 0.5) * S;
        if (fieldAt(dToW, px, py) < 2.5 * S || !isFree(px, py, 1.8 * S)) continue;
        const d = Math.min(fieldAt(dIn, px, py), 3 * S) + r() * 18;
        if (d > best) {
          best = d;
          bx = x;
          by = y;
        }
      }
    if (best > S * 1.8) {
      const fx = (bx + 0.5) * S, fy = (by + 0.5) * S;
      fire = [fx, fy];
      take(fx, fy, 1.8 * S);
    }
  }
  const r12 = rng(seed, 701);
  const shafts: { x: number; y: number; L: number; a: number; hw: number; ex: number; ey: number }[] = [];
  {
    const cands: { x: number; y: number; nx: number; ny: number }[] = [];
    for (const loop of floorLoops)
      for (const p of alongLoop(loop, 20)) {
        if (p.nx * -LX + p.ny * -LY < 0.6) continue;
        if (fieldAt(dIn, p.x + 1.8 * S * LX, p.y + 1.8 * S * LY) < 0.7 * S || !onDry(p.x + 2 * S * LX, p.y + 2 * S * LY)) continue;
        if (fieldAt(dOut, p.x + p.nx * S, p.y + p.ny * S) < 6) continue;
        cands.push(p);
      }
    const want = Math.min(cands.length, 1 + Math.floor((W * H) / 900) + (r12() < 0.5 ? 1 : 0));
    for (let tries = 0; tries < 80 && shafts.length < want; tries++) {
      const p = cands[Math.floor(r12() * cands.length)];
      if (!p || shafts.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < S * 9)) continue;
      if (fire && Math.hypot(fire[0] - p.x, fire[1] - p.y) < S * 4) continue;
      // chaque rai a son angle et sa longueur ; on raccourcit s'il sortirait du sol
      const a = Math.atan2(-p.ny, -p.nx) * 0.5 + Math.atan2(LY, LX) * 0.5 + between(r12, -0.3, 0.3);
      let L = between(r12, 2.2, 3.8) * S;
      while (L > 1.6 * S && !onDry(p.x + Math.cos(a) * L, p.y + Math.sin(a) * L)) L *= 0.85;
      if (!onDry(p.x + Math.cos(a) * L, p.y + Math.sin(a) * L)) continue;
      shafts.push({ x: p.x, y: p.y, L, a, hw: between(r12, 0.55, 0.9) * S, ex: p.x + Math.cos(a) * L, ey: p.y + Math.sin(a) * L });
    }
  }
  // direction de la lumière : depuis le feu (5 cases) ou le bout d'un rai (3 cases), sinon du haut à gauche
  lightAt = (x, y) => {
    let best: Pt = [LX, LY];
    let bestW = 0;
    const tryLight = (sx: number, sy: number, reach: number) => {
      const d = Math.hypot(x - sx, y - sy);
      const w = 1 - smooth(reach * 0.55, reach, d);
      if (d < 3 || w <= bestW) return;
      bestW = w;
      best = [(x - sx) / d, (y - sy) / d];
    };
    if (fire) tryLight(fire[0], fire[1], 5 * S);
    for (const sh of shafts) tryLight(sh.ex, sh.ey, 3 * S);
    if (bestW <= 0) return [LX, LY];
    const vx = best[0] * bestW + LX * (1 - bestW), vy = best[1] * bestW + LY * (1 - bestW);
    const l = Math.hypot(vx, vy) || 1;
    return [vx / l, vy / l];
  };

  // ——— 8. Stalagmites isolées, affleurements, gravier et fissures (avant les objets, qui se posent dessus) ———
  {
    // Dans chaque salle large, 1 à 3 stalagmites ou souches, sous une goutte qui tombe depuis des siècles.
    // Posées sur un coin de case : aucune case n'est couverte, le sol reste lisible comme praticable.
    const r = rng(seed, 491);
    const col = mixColor(columnCol, INK, 0.12);
    centers.forEach(([zx, zy]) => {
      const cd = cellDist[zy * W + zx];
      if (cd < 3) return;
      const want = cd >= 5 ? 3 + Math.floor(r() * 2) : cd >= 4 ? 2 + Math.floor(r() * 2) : r() < 0.7 ? 1 : 0;
      for (let t = 0, made = 0; t < 70 && made < want; t++) {
        const reach = Math.max(1, cd - 1.5);
        const cx = Math.round(zx + 0.5 + (r() - 0.5) * 2 * reach);
        const cy = Math.round(zy + 0.5 + (r() - 0.5) * 2 * reach);
        let ok = true;
        for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
          const k = (cy + dy) * W + cx + dx;
          if (!dry(cx + dx, cy + dy) || cellDist[k] < 3 || nearDoor(cx + dx, cy + dy, 1)) ok = false;
        }
        if (!ok) continue;
        const x = cx * S + (r() - 0.5) * 4, y = cy * S + (r() - 0.5) * 4;
        const R = between(r, 0.28, 0.42) * S;
        if (!onDry(x, y) || fieldAt(dToW, x, y) < S || !isFree(x, y, S * 0.9)) continue;
        take(x, y, S * 0.6);
        made++;
        const ring = smoothPoints(blobPoints(r, x, y, R * 2.2, R * 1.8, 12, 0.32, r() * Math.PI), 2);
        g.filter = "blur(5px)";
        g.fillStyle = tint(dampC, -0.05, 0.3);
        g.fill(polyPath(ring));
        g.filter = "none";
        for (let q = 0; q < 4; q++) {
          const a = r() * Math.PI * 2;
          const d = R * between(r, 1.3, 2.3);
          if (onDry(x + Math.cos(a) * d, y + Math.sin(a) * d)) stone(g, r, x + Math.cos(a) * d, y + Math.sin(a) * d, between(r, 1.6, 3.4), rockCol);
        }
        // une grande et parfois sa cadette ; une souche brisée sur trois (pointe tombée à côté)
        const broken = r() < 0.33;
        stalagmite(g, r, x, y, R, col, R > 10 ? 1.8 : 1.3);
        if (broken) {
          const a = r() * Math.PI * 2;
          stone(g, r, x + Math.cos(a) * R * 2.1, y + Math.sin(a) * R * 1.8, R * 0.55, col);
        } else if (r() < 0.6) {
          const a = r() * Math.PI * 2;
          const d = R + between(r, 4, 8);
          stalagmite(g, r, x + Math.cos(a) * d, y + Math.sin(a) * d, R * between(r, 0.4, 0.6), col, 1.1);
        }
      }
    });
  }
  {
    // Affleurements de roche-mère : quelques bosses de roche à fleur de sol, au large des salles ou à un pas
    // des parois. Jamais près d'une porte ni sur l'eau.
    const r = rng(seed, 471);
    const want = Math.max(2, Math.round(floorCells / between(r, 120, 190)));
    // la terre du lieu, assombrie : la face d'ombre à 30 %, la face éclairée à peine sous le sol
    const col = mixColor(mixColor(earth, stoneC, 0.15), INK, 0.3);
    g.save();
    g.clip(floor.path, "evenodd");
    for (let t = 0, made = 0; t < want * 30 && made < want; t++) {
      const k = Math.floor(r() * W * H);
      const cx = k % W, cy = Math.floor(k / W);
      if (!dry(cx, cy) || cellDist[k] < 2 || nearDoor(cx, cy, 2)) continue;
      const x = (cx + r()) * S, y = (cy + r()) * S;
      const rad = between(r, 0.4, cellDist[k] >= 4 ? 0.85 : 0.65) * S;
      if (fieldAt(dIn, x, y) < rad * 0.75 || fieldAt(dToW, x, y) < rad || !isFree(x, y, rad * 0.75)) continue;
      take(x, y, rad * 0.8);
      const body = mixColor(col, r() < 0.5 ? INK : earth, between(r, 0, 0.1));
      crag(g, r, x, y, rad, { body, lit: mixColor(earth, INK, between(r, 0.12, 0.18)) }, true);
      // quelques éclats tombés au pied, côté ombre
      for (let q = 0; q < 3; q++) {
        const px = x + rad * between(r, 0.4, 0.9) * LX + (r() - 0.5) * rad, py = y + rad * between(r, 0.4, 0.9) * LY + (r() - 0.5) * rad * 0.6;
        if (onDry(px, py) && fieldAt(dIn, px, py) > 6) stone(g, r, px, py, between(r, 2.2, 4.5), mixColor(col, INK, 0.15));
      }
      made++;
    }
    g.restore();
  }
  {
    // Plaques de gravier : des dizaines de cailloux roulés dans un creux, serrés au cœur, épars au bord.
    const r = rng(seed, 476);
    const want = Math.max(2, Math.round(floorCells / between(r, 110, 170)));
    for (let t = 0, made = 0; t < want * 30 && made < want; t++) {
      const k = Math.floor(r() * W * H);
      const cx = k % W, cy = Math.floor(k / W);
      if (!dry(cx, cy) || cellDist[k] < 2 || nearDoor(cx, cy, 1)) continue;
      const x = (cx + r()) * S, y = (cy + r()) * S;
      const R = between(r, 0.6, 1.3) * S;
      if (!onDry(x, y) || fieldAt(dToW, x, y) < 0.5 * S || !isFree(x, y, R * 0.6)) continue;
      take(x, y, R * 0.5);
      made++;
      g.save();
      g.clip(floor.path, "evenodd");
      const blob = smoothPoints(blobPoints(r, x, y, R, R * between(r, 0.55, 0.85), 12, 0.35, r() * Math.PI), 2);
      g.filter = "blur(6px)";
      g.fillStyle = tint(dampC, 0, 0.24);
      g.fill(polyPath(blob));
      g.filter = "none";
      g.restore();
      const n = 40 + Math.floor(r() * 30);
      for (let q = 0; q < n; q++) {
        const a = r() * Math.PI * 2;
        const d = Math.pow(r(), 0.9);
        const px = x + Math.cos(a) * d * R, py = y + Math.sin(a) * d * R * 0.75;
        if (!onDry(px, py) || fieldAt(dIn, px, py) < 4) continue;
        stone(g, r, px, py, between(r, 1.8, 4.4) * (1.15 - d * 0.6), mixColor(gravelC, r() < 0.6 ? rockCol : rockSh, r() * 0.7));
      }
    }
  }
  {
    const r = rng(seed, 481);
    // fissures ramifiées, groupées près des parois
    for (let i = 0, made = 0; i < floorCells * 2 && made < floorCells / 12; i++) {
      const x = r() * IW, y = r() * IH;
      const di = fieldAt(dIn, x, y);
      if (di < 5 || !onDry(x, y) || !isFree(x, y, 10) || r() > Math.exp(-di / (1.1 * S))) continue;
      const [gx, gy] = gradIn(x, y);
      crack(g, r, x, y, Math.atan2(gy, gx) + (r() - 0.5) * 1.6, between(r, 0.8, 1.3));
      made++;
    }
  }

  {
    // Retouche : le sol redevient un sol. Boue, coulées de calcite, tas d'éboulis et failles au large des salles,
    // en plus des fissures du pied des parois. Tout reste à plat, sans toucher aux cases.
    const r = rng(seed, 497);
    g.save();
    g.clip(floor.path, "evenodd");
    // — zones de boue : lavis sombres empilés, croûte craquelée au bord, reflets mouillés en virgule —
    const mudCol = mixColor(dampC, darkTheme ? "#1c130b" : "#2a1c10", 0.35);
    const mudWant = Math.max(3, Math.round(floorCells / 60));
    for (let t = 0, made = 0; t < mudWant * 40 && made < mudWant; t++) {
      const k = Math.floor(r() * W * H);
      const cx = k % W, cy = Math.floor(k / W);
      if (!dry(cx, cy) || cellDist[k] < 2 || nearDoor(cx, cy, 2)) continue;
      const R = between(r, 0.55, 1.2) * S;
      const x = (cx + r()) * S, y = (cy + r()) * S;
      if (!onDry(x, y) || fieldAt(dIn, x, y) < R * 0.55 || fieldAt(dToW, x, y) < R * 0.7 || !isFree(x, y, R * 0.55)) continue;
      take(x, y, R * 0.4);
      made++;
      const blob = smoothPoints(blobPoints(r, x, y, R, R * between(r, 0.5, 0.8), 12, 0.38, r() * Math.PI), 2);
      g.save();
      g.globalCompositeOperation = "multiply";
      for (const [kk, a] of [[1.18, 0.14], [1.04, 0.2], [0.86, 0.26], [0.64, 0.3], [0.4, 0.28]] as const) {
        g.fillStyle = tint(mudCol, 0, a);
        g.fill(polyPath(scaled2(blob, x, y, kk * between(r, 0.96, 1.04))));
      }
      g.restore();
      // croûte séchée : bord encré par morceaux, craquelures au cœur
      for (const run of brokenRuns(jitterPoints(blob, 1.3, seed + made * 17, 1 / 9), r, 14, 46, 0.4, true))
        inkPolyline(g, run, r, { width: between(r, 0.6, 1), taper: 4, wobble: 0.4, color: "rgba(20,14,8,.5)" });
      g.save();
      g.clip(polyPath(blob));
      for (let q = 0; q < 4; q++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.5;
        crack(g, r, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r() * Math.PI * 2, 0.8, 1);
      }
      g.restore();
      for (let q = 0; q < 3; q++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.5;
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7, l = between(r, 3, 7);
        inkPolyline(g, [[px - l / 2, py + 0.7], [px, py - between(r, 0.4, 1.2)], [px + l / 2, py]], r, { width: 1, taper: 3, wobble: 0.1, color: "rgba(236,240,232,.4)" });
      }
      // quelques cailloux pris dans la boue
      for (let q = 0; q < 3; q++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.6;
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7;
        if (onDry(px, py) && fieldAt(dIn, px, py) > 6) stone(g, r, px, py, between(r, 1.6, 3.4), mixColor(rockCol, mudCol, 0.3));
      }
    }
    g.restore();

    // — coulées de calcite : du pied d'une paroi haute, une langue claire qui s'étale vers le sol, cernée d'encre —
    const calc = mixColor(earth, darkTheme ? "#cbbf9e" : "#d4c8a6", 0.34);
    const calcWant = Math.max(2, Math.round(floorCells / 130));
    let calcMade = 0;
    for (const loop of floorLoops) {
      if (calcMade >= calcWant) break;
      for (const p of alongLoop(loop, S * 0.5)) {
        if (calcMade >= calcWant || r() > 0.05) continue;
        const cx = Math.floor((p.x - p.nx * 10) / S), cy = Math.floor((p.y - p.ny * 10) / S);
        if (!dry(cx, cy) || nearDoor(cx, cy, 2) || narrow(cx, cy)) continue;
        if (fieldAt(dOut, p.x + p.nx * 1.4 * S, p.y + p.ny * 1.4 * S) < 0.9 * S) continue;
        const L = between(r, 0.9, 1.7) * S;
        // axe de la coulée : vers l'intérieur du sol, avec un léger balancement
        const axis: Pt[] = [];
        const sway = between(r, -0.5, 0.5);
        const n = 7;
        let ok = true;
        for (let q = 0; q <= n; q++) {
          const u = q / n;
          const along = Math.sin(u * 2.4) * sway * 0.2 * S;
          const ax = p.x - p.nx * (u * L - 3) - p.ny * along, ay = p.y - p.ny * (u * L - 3) + p.nx * along;
          if (q > 1 && (!onDry(ax, ay) || !isFree(ax, ay, 4))) {
            ok = false;
            break;
          }
          axis.push([ax, ay]);
        }
        if (!ok) continue;
        const nrm2 = normalsOf(axis, false);
        const hw = (i: number) => {
          const u = i / n;
          return S * (0.05 + 0.13 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.62) + 0.03 * Math.sin(i * 2.7)) * (u > 0.8 ? 1 - (u - 0.8) * 2.2 : 1);
        };
        const body = smoothPoints(ribbon(axis, nrm2, hw), 2);
        calcMade++;
        take(axis[Math.floor(n / 2)][0], axis[Math.floor(n / 2)][1], S * 0.35);
        const path = polyPath(body);
        castShadow(g, body, 3, 4, 0.4);
        g.fillStyle = calc;
        g.fill(path);
        g.save();
        g.clip(path);
        // bourrelets de croissance : arcs en travers de la coulée
        g.strokeStyle = "rgba(60,48,32,.32)";
        g.lineWidth = 0.7;
        for (let q = 1; q < n; q++) {
          const [ax, ay] = axis[q];
          const [bx, by] = axis[q + 1];
          const h = hw(q) * 0.95;
          g.beginPath();
          g.moveTo(ax + nrm2[q][0] * h, ay + nrm2[q][1] * h);
          g.quadraticCurveTo(ax + (bx - ax) * 0.9, ay + (by - ay) * 0.9, ax - nrm2[q][0] * h, ay - nrm2[q][1] * h);
          g.stroke();
        }
        // ombre côté bas-droite
        g.fillStyle = "rgba(60,46,30,.16)";
        g.translate(2.2, 2.2);
        g.fill(path);
        g.restore();
        for (const run of brokenRuns([...body, body[0]], r, 12, 40, 0.18))
          inkPolyline(g, run, r, { width: between(r, 0.7, 1.2), taper: 4, wobble: 0.3, pressure: 0.45, color: "rgba(20,14,8,.78)" });
        // mini-vasque de calcite au bout : un lavis plus clair
        const [ex, ey] = axis[n];
        g.fillStyle = tint(calc, 0.07, 0.7);
        g.beginPath();
        g.ellipse(ex, ey, hw(n - 1) * 0.7 + 2, hw(n - 1) * 0.5 + 1.5, Math.atan2(p.ny, p.nx), 0, Math.PI * 2);
        g.fill();
      }
    }

    // — tas d'éboulis au large des salles : un bloc mûr, des éclats autour, un peu de poussière dessous —
    const scree = Math.max(2, Math.round(floorCells / 95));
    for (let t = 0, made = 0; t < scree * 40 && made < scree; t++) {
      const k = Math.floor(r() * W * H);
      const cx = k % W, cy = Math.floor(k / W);
      if (!dry(cx, cy) || cellDist[k] < 2 || nearDoor(cx, cy, 2)) continue;
      const R = between(r, 0.4, 0.85) * S;
      const x = (cx + r()) * S, y = (cy + r()) * S;
      if (!onDry(x, y) || fieldAt(dIn, x, y) < R || fieldAt(dToW, x, y) < R || !isFree(x, y, R * 0.8)) continue;
      take(x, y, R * 0.6);
      made++;
      g.save();
      g.clip(floor.path, "evenodd");
      g.filter = "blur(5px)";
      g.fillStyle = tint(dampC, -0.04, 0.3);
      g.fill(polyPath(smoothPoints(blobPoints(r, x, y, R * 1.1, R * 0.8, 10, 0.3, r() * Math.PI), 2)));
      g.filter = "none";
      g.restore();
      const items: [number, number, number][] = [];
      const big = 1 + Math.floor(r() * 2);
      for (let q = 0; q < big; q++) items.push([x + (r() - 0.5) * R * 0.7, y + (r() - 0.5) * R * 0.5, between(r, 0.1, 0.2) * S]);
      for (let q = 0, m = 10 + Math.floor(r() * 10); q < m; q++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R;
        items.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, between(r, 2, 6)]);
      }
      items.sort((a, b) => b[2] - a[2]);
      for (const [px, py, rad] of items) if (onDry(px, py) && fieldAt(dIn, px, py) > rad + 2) stone(g, r, px, py, rad, mixColor(rockCol, r() < 0.4 ? theme.floor : rockSh, between(r, 0, 0.35)));
    }

    // — failles : de longues cassures encrées qui traversent le sol, avec leur lèvre claire —
    const faults = Math.max(2, Math.round(floorCells / 70));
    for (let t = 0, made = 0; t < faults * 50 && made < faults; t++) {
      const x = r() * IW, y = r() * IH;
      if (!onDry(x, y) || fieldAt(dIn, x, y) < 0.5 * S || fieldAt(dToW, x, y) < S || !isFree(x, y, 8)) continue;
      let a = r() * Math.PI * 2;
      const pts: Pt[] = [[x, y]];
      const n = 7 + Math.floor(r() * 8);
      for (let q = 0; q < n; q++) {
        a += (r() - 0.5) * 0.8;
        const l = between(r, 7, 13);
        const [lx, ly] = pts[pts.length - 1];
        const nx = lx + Math.cos(a) * l, ny = ly + Math.sin(a) * l;
        if (!onDry(nx, ny) || fieldAt(dIn, nx, ny) < 5 || !isFree(nx, ny, 3)) break;
        pts.push([nx, ny]);
      }
      if (pts.length < 5) continue;
      made++;
      for (const [px, py] of pts.filter((_, i) => i % 3 === 0)) take(px, py, 4);
      inkPolyline(g, pts.map(([px, py]) => [px + 1.3, py + 1.3] as Pt), r, { width: 1, taper: 10, wobble: 0.2, color: tint(earth, 0.14, 0.55) });
      inkPolyline(g, pts, r, { width: between(r, 1.3, 2), taper: 16, wobble: 0.35, pressure: 0.4, color: "rgba(18,12,7,.82)" });
      for (let b = 0; b < 2; b++) {
        const j = 1 + Math.floor(r() * (pts.length - 2));
        const ba = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]) + (r() < 0.5 ? 1 : -1) * between(r, 0.5, 1);
        crack(g, r, pts[j][0], pts[j][1], ba, 1, 1);
      }
    }
  }

  // ——— 9. Décor posé sur le sol ———
  const edgeItems: (() => void)[] = []; // objets à cheval sur la paroi, dessinés après son contour
  const zoneUsed = new Uint8Array(Math.max(1, centers.length));
  const zoneAt = (x: number, y: number) => zoneOf[Math.floor(y / S) * W + Math.floor(x / S)] ?? -1;

  // Campement abandonné, au plus large d'une salle sèche : trois cases sur trois autour d'un foyer cerclé de
  // pierres ; couchages, sacs, marmite, bûches ; chaque objet jette une longue ombre qui part du feu.
  {
    const r = rCamp;
    if (fire) {
      const [fx, fy] = fire;
      const z = zoneAt(fx, fy);
      if (z >= 0) zoneUsed[z] = 1;
      // terre battue autour du feu : deux lavis nets, piétinés
      g.save();
      g.clip(floor.path, "evenodd");
      for (const [k, a] of [[1.75, 0.1], [1.05, 0.12]] as const) {
        const pts = smoothPoints(blobPoints(r, fx, fy, k * S, k * S * between(r, 0.8, 0.95), 14, 0.22, r() * Math.PI), 2);
        g.fillStyle = `rgba(30,20,12,${a})`;
        g.fill(polyPath(pts));
        for (const run of brokenRuns(pts, r, 20, 60, 0.55, true)) inkPolyline(g, run, r, { width: 0.6, taper: 5, wobble: 0.4, color: "rgba(22,16,10,.35)" });
      }
      g.restore();
      // traces de pas qui partent du camp
      {
        let a = r() * Math.PI * 2;
        let x = fx + Math.cos(a) * 1.8 * S, y = fy + Math.sin(a) * 1.8 * S;
        g.fillStyle = "rgba(22,16,10,.38)";
        for (let k = 0; k < 18; k++) {
          a += (r() - 0.5) * 0.35;
          x += Math.cos(a) * 11;
          y += Math.sin(a) * 11;
          if (fieldAt(dIn, x, y) < 14 || !onDry(x, y)) break;
          const side = k % 2 ? 1 : -1;
          const px = x - Math.sin(a) * side * 4, py = y + Math.cos(a) * side * 4;
          g.beginPath();
          g.ellipse(px, py, 3.4, 1.7, a, 0, Math.PI * 2);
          g.fill();
        }
      }
      /** Ombre longue, du feu vers l'extérieur, qui s'éteint en s'éloignant. */
      const longShadow = (x: number, y: number, hw: number, len: number) => {
        const dx = x - fx, dy = y - fy;
        const l = Math.hypot(dx, dy) || 1;
        const ux = dx / l, uy = dy / l;
        const gr = g.createLinearGradient(x, y, x + ux * len, y + uy * len);
        gr.addColorStop(0, "rgba(12,8,4,.5)");
        gr.addColorStop(1, "rgba(12,8,4,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(x - uy * hw, y + ux * hw);
        g.lineTo(x + ux * len - uy * hw * 1.35, y + uy * len + ux * hw * 1.35);
        g.lineTo(x + ux * len + uy * hw * 1.35, y + uy * len - ux * hw * 1.35);
        g.lineTo(x + uy * hw, y - ux * hw);
        g.closePath();
        g.fill();
      };
      const fits = (x: number, y: number, rad: number) => fieldAt(dIn, x, y) > rad + 4 && onDry(x, y);
      const a0 = r() * Math.PI * 2;
      const rolls = 2 + Math.floor(r() * 2);
      // toiles usées : bruns, ocres, gris-vert, saturation divisée par deux
      const cloth = ["#7a5248", "#6f6b62", "#6b5640", "#5d6658", "#7a6a48"].map((c) => desaturate(c, 0.5));
      const slots = rolls + 4;
      const angle = (k: number) => a0 + (k / slots) * Math.PI * 2 + between(r, -0.12, 0.12);
      let slot = 0;
      for (let k = 0; k < rolls; k++, slot++) {
        const a = angle(slot);
        const dist = between(r, 1.35, 1.5) * S;
        const x = fx + Math.cos(a) * dist, y = fy + Math.sin(a) * dist;
        if (!fits(x, y, S * 0.5)) continue;
        longShadow(x, y, S * 0.3, S * 1.1);
        g.save();
        g.translate(x, y);
        g.rotate(a + Math.PI / 2 + between(r, -0.2, 0.2));
        bedroll(g, r, S * 0.62, S * 1.3, mixColor(pick(r, cloth), theme.floor, 0.12));
        g.restore();
      }
      {
        const a = angle(slot++);
        const x = fx + Math.cos(a) * 1.35 * S, y = fy + Math.sin(a) * 1.35 * S;
        if (fits(x, y, 16)) {
          longShadow(x, y, S * 0.36, S * 0.9);
          woodpile(g, r, x, y, S * 1.3);
        }
      }
      for (let k = 0; k < 2; k++) {
        const a = angle(slot++);
        const x = fx + Math.cos(a) * between(r, 1.2, 1.45) * S, y = fy + Math.sin(a) * between(r, 1.2, 1.45) * S;
        if (!fits(x, y, 12)) continue;
        const s = between(r, 9, 11.5);
        longShadow(x, y, s * 0.9, S * 0.8);
        sack(g, r, x, y, s, mixColor("#8a7a5a", theme.floor, 0.15));
        if (r() < 0.6) sack(g, r, x + between(r, 6, 10) * (r() < 0.5 ? 1 : -1), y + between(r, 4, 9), s * 0.7, mixColor("#7a6a4a", theme.floor, 0.15));
      }
      {
        const a = angle(slot++);
        const x = fx + Math.cos(a) * 1.4 * S, y = fy + Math.sin(a) * 1.4 * S;
        if (fits(x, y, 15)) {
          longShadow(x, y, 14, S * 0.9);
          crate(g, r, x, y, 13);
        }
      }
      // tout le campement baigne dans la couleur du feu (posée en « multiply ») : il appartient à la scène
      {
        g.save();
        g.clip(floor.path, "evenodd");
        g.globalCompositeOperation = "multiply";
        const R = 2.3 * S;
        const warm = g.createRadialGradient(fx, fy, 0, fx, fy, R);
        warm.addColorStop(0, "rgba(255,186,118,.5)");
        warm.addColorStop(0.6, "rgba(240,170,110,.3)");
        warm.addColorStop(1, "rgba(240,170,110,0)");
        g.fillStyle = warm;
        g.fillRect(fx - R, fy - R, R * 2, R * 2);
        g.restore();
      }
      // foyer : ombre, cendre, bûches calcinées, braises, cercle de pierres, marmite au bord
      g.fillStyle = "rgba(12,8,4,.4)";
      g.beginPath();
      g.arc(fx + 3, fy + 4, 0.6 * S, 0, Math.PI * 2);
      g.fill();
      const ash = g.createRadialGradient(fx - 3, fy - 3, 2, fx, fy, 0.48 * S);
      ash.addColorStop(0, "#2a2420");
      ash.addColorStop(0.55, "#4e4740");
      ash.addColorStop(1, "rgba(110,102,92,.75)");
      g.fillStyle = ash;
      g.beginPath();
      g.arc(fx, fy, 0.48 * S, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 4; k++) {
        const a = r() * Math.PI;
        const l = between(r, 11, 17);
        inkLine(g, fx - Math.cos(a) * l, fy - Math.sin(a) * l, fx + Math.cos(a) * l, fy + Math.sin(a) * l, r, { width: 4, taper: 3, pressure: 0.3 });
        g.strokeStyle = "rgba(235,120,45,.95)";
        g.lineWidth = 1.1;
        g.beginPath();
        g.moveTo(fx - Math.cos(a) * l * 0.35, fy - Math.sin(a) * l * 0.35);
        g.lineTo(fx + Math.cos(a) * l * 0.2, fy + Math.sin(a) * l * 0.2);
        g.stroke();
      }
      g.fillStyle = "rgba(255,180,80,.95)";
      for (let k = 0; k < 14; k++) g.fillRect(fx + (r() - 0.5) * 18, fy + (r() - 0.5) * 18, 1.5, 1.5);
      for (let k = 0; k < 13; k++) {
        const a = (k / 13) * Math.PI * 2 + r() * 0.2;
        stone(g, r, fx + Math.cos(a) * 0.56 * S, fy + Math.sin(a) * 0.56 * S, between(r, 4.5, 6.8), rockCol);
      }
      {
        const a = a0 - Math.PI / slots;
        const x = fx + Math.cos(a) * 0.88 * S, y = fy + Math.sin(a) * 0.88 * S;
        longShadow(x, y, 0.24 * S, S * 0.7);
        cauldron(g, r, x, y, 0.24 * S);
      }
    }
  }

  // Ossements : un squelette contre une paroi (avec son épée), quelques os épars.
  {
    const r = rng(seed, 521);
    const scenes = Math.max(1, Math.round(floorCells / 500));
    for (let t = 0, made = 0; t < 400 && made < scenes; t++) {
      const k = Math.floor(r() * W * H);
      const x0 = k % W, y0 = Math.floor(k / W);
      if (!dry(x0, y0) || narrow(x0, y0) || cellDist[k] !== 1) continue;
      const z = zoneOf[k];
      if (z >= 0 && zoneUsed[z]) continue;
      const x = (x0 + 0.5) * S, y = (y0 + 0.5) * S;
      if (!isFree(x, y, S * 0.9) || fieldAt(dIn, x, y) < S * 0.42 || fieldAt(dToW, x, y) < S) continue;
      // le long de la paroi
      const [gx, gy] = gradIn(x, y);
      const ang = Math.atan2(gx, -gy) + (r() - 0.5) * 0.5;
      // il faut que tout le corps tienne sur le sol
      const ends: Pt[] = [[x + Math.sin(ang) * S * 0.75, y - Math.cos(ang) * S * 0.75], [x - Math.sin(ang) * S * 0.75, y + Math.cos(ang) * S * 0.75]];
      if (ends.some(([ex, ey]) => fieldAt(dIn, ex, ey) < 8 || !onDry(ex, ey))) continue;
      take(x, y, S * 0.9);
      if (z >= 0) zoneUsed[z] = 1;
      skeleton(g, r, x, y, ang, S, boneCol);
      if (!crystal) {
        const sa = ang + Math.PI / 2 + between(r, -0.4, 0.4);
        sword(g, r, x + Math.cos(sa) * S * 0.45, y + Math.sin(sa) * S * 0.45, ang + between(r, -0.6, 0.6), S);
      }
      made++;
    }
    // Amas d'os dans les recoins (cases bordées de roche sur au moins quatre côtés) : os longs croisés,
    // un crâne bien lisible, des esquilles.
    const piles = 2 + (r() < 0.5 ? 1 : 0);
    for (let t = 0, made = 0; t < 900 && made < piles; t++) {
      const k = Math.floor(r() * W * H);
      const x0 = k % W, y0 = Math.floor(k / W);
      if (!dry(x0, y0) || cellDist[k] !== 1 || solidAround(x0, y0) < 4 || nearDoor(x0, y0, 1)) continue;
      const [gx, gy] = gradIn((x0 + 0.5) * S, (y0 + 0.5) * S);
      const x = (x0 + 0.5) * S + gx * 6, y = (y0 + 0.5) * S + gy * 6;
      if (!isFree(x, y, S * 0.5) || fieldAt(dIn, x, y) < S * 0.36 || fieldAt(dToW, x, y) < S) continue;
      take(x, y, S * 0.55);
      made++;
      const main = r() * Math.PI;
      const n = 3 + Math.floor(r() * 3);
      for (let q = 0; q < n; q++) {
        const a = main + (q % 2 ? Math.PI / 2 : 0) + between(r, -0.35, 0.35);
        const bx = x + (r() - 0.5) * S * 0.4, by = y + (r() - 0.5) * S * 0.4;
        if (fieldAt(dIn, bx, by) < 8) continue;
        bone(g, bx, by, between(r, 0.5, 0.68) * S, a, boneCol);
      }
      for (let q = 0; q < 4; q++) {
        const bx = x + (r() - 0.5) * S * 0.8, by = y + (r() - 0.5) * S * 0.8;
        if (fieldAt(dIn, bx, by) < 5 || !onDry(bx, by)) continue;
        bone(g, bx, by, between(r, 0.16, 0.26) * S, r() * Math.PI, boneCol);
      }
      skull(g, r, x + gx * 4 + (r() - 0.5) * 8, y + gy * 4 + (r() - 0.5) * 8, S * 0.36, boneCol, Math.atan2(gy, gx) - Math.PI / 2 + between(r, -0.6, 0.6));
    }
    // quelques os isolés
    for (let i = 0; i < floorCells / 260; i++) {
      const k = Math.floor(r() * W * H);
      const x0 = k % W, y0 = Math.floor(k / W);
      if (!dry(x0, y0)) continue;
      const x = (x0 + 0.5) * S, y = (y0 + 0.5) * S;
      if (!isFree(x, y, S * 0.4) || fieldAt(dIn, x, y) < 14) continue;
      take(x, y, S * 0.4);
      bone(g, x, y, between(r, 0.5, 0.6) * S, r() * Math.PI, boneCol);
    }
  }

  // Éboulis : cônes de pierres au pied des parois, plus denses contre la roche.
  {
    const r = rng(seed, 541);
    for (const loop of floorLoops) {
      const pts = alongLoop(loop, S * 0.6);
      for (const p of pts) {
        // cônes d'éboulis au pied des parois hautes (roche épaisse derrière), quelques cailloux ailleurs
        const high = fieldAt(dOut, p.x + p.nx * 1.6 * S, p.y + p.ny * 1.6 * S) > 1.25 * S;
        if (r() > (high ? 0.1 : 0.06)) continue;
        const cx = Math.floor((p.x - p.nx * 10) / S), cy = Math.floor((p.y - p.ny * 10) / S);
        if (!dry(cx, cy) || nearDoor(cx, cy, 1)) continue;
        const tight = narrow(cx, cy) || cellDist[cy * W + cx] === 0;
        const n = tight ? 3 + Math.floor(r() * 3) : high ? 16 + Math.floor(r() * 16) : 5 + Math.floor(r() * 6);
        const reach = tight ? 0.3 * S : high ? 1.5 * S : 0.8 * S;
        const items: [number, number, number][] = [];
        for (let k = 0; k < n; k++) {
          const t = Math.pow(r(), 1.7);
          const inn = 2 + t * reach;
          const along = (r() + r() - 1) * S * (0.35 + t * 0.6);
          const x = p.x - p.nx * inn - p.ny * along, y = p.y - p.ny * inn + p.nx * along;
          if (!onDry(x, y) || !isFree(x, y, 2)) continue;
          const big = tight ? between(r, 0.05, 0.12) : between(r, 0.05, 0.4) * (1 - t * 0.7) * (r() < 0.25 ? 1 : 0.55);
          items.push([x, y, Math.max(2.2, big * S)]);
        }
        // les plus grosses d'abord, les petites roulent par-dessus
        items.sort((a, b) => b[2] - a[2]);
        for (const [x, y, rad] of items) stone(g, r, x, y, rad, mixColor(rockCol, r() < 0.35 ? theme.floor : rockSh, between(r, 0, 0.35)));
      }
    }
    // gros blocs effondrés contre la paroi, 1 ou 2 par salle (à cheval sur le contour, ils ne mangent pas les cases)
    const perZone = new Uint8Array(Math.max(1, centers.length));
    for (const loop of floorLoops) {
      const pts = alongLoop(loop, S * 0.8);
      for (const p of pts) {
        if (r() > 0.08) continue;
        const z = zoneAt(p.x - p.nx * S * 0.5, p.y - p.ny * S * 0.5);
        if (z < 0 || perZone[z] >= 2) continue;
        const rad = between(r, 0.45, 0.72) * S;
        const ox = p.x + p.nx * (rad - 0.32 * S), oy = p.y + p.ny * (rad - 0.32 * S);
        if (fieldAt(dOut, p.x + p.nx * rad * 2, p.y + p.ny * rad * 2) < 4) continue;
        const cx = Math.floor((p.x - p.nx * 10) / S), cy = Math.floor((p.y - p.ny * 10) / S);
        if (nearDoor(cx, cy, 1) || !isFree(p.x - p.nx * 8, p.y - p.ny * 8, 4)) continue;
        perZone[z]++;
        take(p.x - p.nx * 8, p.y - p.ny * 8, 6);
        const rr = rng(seed, 551, Math.round(p.x), Math.round(p.y));
        edgeItems.push(() => {
          crag(g, rr, ox, oy, rad, blockCols);
          for (let k = 0; k < 4; k++) {
            const a = Math.atan2(-p.ny, -p.nx) + between(rr, -1.2, 1.2);
            const d = rad + between(rr, 2, 9);
            const x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d;
            if (onDry(x, y)) stone(g, rr, x, y, between(rr, 2.5, 5.5), mixColor(blockCol, rockCol, 0.5));
          }
        });
      }
    }
    // Rochers de bordure (retouche) : le contour s'accidente de gros blocs encrés qui mordent sur le sol, par
    // grappes de un à trois, serrés là où la roche est épaisse derrière ; jamais près d'une porte.
    {
      const placed: Pt[] = [];
      for (const loop of floorLoops) {
        for (const p of alongLoop(loop, S * 0.5)) {
          if (r() > 0.2) continue;
          const cx = Math.floor((p.x - p.nx * 10) / S), cy = Math.floor((p.y - p.ny * 10) / S);
          if (!dry(cx, cy) || nearDoor(cx, cy, 1)) continue;
          const rad = between(r, 0.26, 0.46) * S * (r() < 0.18 ? 1.5 : 1);
          if (fieldAt(dOut, p.x + p.nx * rad * 2, p.y + p.ny * rad * 2) < 4) continue;
          if (placed.some(([qx, qy]) => Math.hypot(qx - p.x, qy - p.y) < 0.95 * S)) continue;
          if (!isFree(p.x - p.nx * 8, p.y - p.ny * 8, 4)) continue;
          placed.push([p.x, p.y]);
          take(p.x - p.nx * 8, p.y - p.ny * 8, 6);
          const rr = rng(seed, 553, Math.round(p.x), Math.round(p.y));
          const group: [number, number, number][] = [[p.x + p.nx * (rad - 0.3 * S), p.y + p.ny * (rad - 0.3 * S), rad]];
          if (rr() < 0.45) {
            const side = rr() < 0.5 ? 1 : -1;
            const r2 = rad * between(rr, 0.5, 0.75);
            const al = (rad + r2) * 0.8 * side;
            group.push([p.x - p.ny * al + p.nx * (r2 - 0.24 * S), p.y + p.nx * al + p.ny * (r2 - 0.24 * S), r2]);
          }
          const dust = rad;
          edgeItems.push(() => {
            for (const [ox, oy, rd] of group) crag(g, rr, ox, oy, rd, blockCols);
            for (let k = 0; k < 3; k++) {
              const a = Math.atan2(-p.ny, -p.nx) + between(rr, -1.3, 1.3);
              const d = dust + between(rr, 3, 10);
              const x = group[0][0] + Math.cos(a) * d, y = group[0][1] + Math.sin(a) * d;
              if (onDry(x, y) && fieldAt(dIn, x, y) > 3) stone(g, rr, x, y, between(rr, 2, 4.5), mixColor(blockCol, rockCol, 0.5));
            }
          });
        }
      }
    }
  }

  // Stalagmites : grappes de 2 à 5 contre les parois ; colonnes sur les piliers de roche isolés.
  {
    const r = rng(seed, 561);
    const col = columnCol;
    for (const loop of floorLoops)
      for (const p of alongLoop(loop, S * 0.7)) {
        if (r() > 0.06) continue;
        const cx = Math.floor((p.x - p.nx * 12) / S), cy = Math.floor((p.y - p.ny * 12) / S);
        if (!dry(cx, cy) || nearDoor(cx, cy, 1)) continue;
        if (fieldAt(dOut, p.x + p.nx * S * 0.5, p.y + p.ny * S * 0.5) < 4) continue;
        const tight = narrow(cx, cy);
        const R = (tight ? between(r, 0.18, 0.24) : between(r, 0.26, 0.4)) * S;
        if (!isFree(p.x - p.nx * 6, p.y - p.ny * 6, 4)) continue;
        take(p.x - p.nx * 6, p.y - p.ny * 6, R * 0.5);
        const items: [number, number, number][] = [[p.x + p.nx * R * 0.3, p.y + p.ny * R * 0.3, R]];
        const n = tight ? 1 : 1 + Math.floor(r() * 4);
        for (let k = 0; k < n; k++) {
          const inn = R * 0.6 + between(r, 2, 0.55 * S);
          const along = (r() - 0.5) * S * 0.9;
          const x = p.x - p.nx * inn - p.ny * along, y = p.y - p.ny * inn + p.nx * along;
          const rr = between(r, 0.09, 0.2) * S;
          if (!onDry(x, y) || fieldAt(dIn, x, y) < 3 || !isFree(x, y, rr)) continue;
          items.push([x, y, rr]);
        }
        const rr = rng(seed, 563, Math.round(p.x), Math.round(p.y));
        edgeItems.push(() => {
          for (const [x, y, R2] of items) stalagmite(g, rr, x, y, R2, col, R2 > 12 ? 1.8 : 1.1);
        });
      }
    // piliers isolés (1 à 4 cases de roche entourées de sol) : une grosse colonne
    const seen = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || !isSolid(map.tiles[i]) || map.tiles[i] === T.porte) continue;
      const comp: number[] = [];
      const stack = [i];
      seen[i] = 1;
      let border = false;
      while (stack.length && comp.length < 6) {
        const k = stack.pop()!;
        comp.push(k);
        const x = k % W, y = Math.floor(k / W);
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const j = (y + dy) * W + x + dx;
          if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= H || seen[j] || !isSolid(at(x + dx, y + dy))) continue;
          seen[j] = 1;
          stack.push(j);
        }
      }
      if (border || stack.length || comp.length > 4) {
        // grande masse : on marque tout pour ne pas la reparcourir
        while (stack.length) {
          const k = stack.pop()!;
          const x = k % W, y = Math.floor(k / W);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const j = (y + dy) * W + x + dx;
            if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= H || seen[j] || !isSolid(at(x + dx, y + dy))) continue;
            seen[j] = 1;
            stack.push(j);
          }
        }
        continue;
      }
      const rr = rng(seed, 567, i);
      // Un massif, pas une boîte d'œufs : une colonne maîtresse au centre du pilier, des cadettes plus basses
      // sur les cases écartées, chacune de sa taille.
      let mx = 0, my = 0;
      for (const k of comp) (mx += (k % W) + 0.5), (my += Math.floor(k / W) + 0.5);
      mx /= comp.length;
      my /= comp.length;
      const mainR = (comp.length === 1 ? between(rr, 0.42, 0.48) : comp.length === 2 ? between(rr, 0.52, 0.6) : between(rr, 0.6, 0.7)) * S;
      edgeItems.push(() => {
        for (const k of comp) {
          const cx = (k % W) + 0.5, cy = Math.floor(k / W) + 0.5;
          const d = Math.hypot(cx - mx, cy - my);
          if (d < 0.45) continue;
          // poussée vers l'extérieur du massif, un peu décalée
          const ox = ((cx - mx) / d) * 0.12 + (rr() - 0.5) * 0.12, oy = ((cy - my) / d) * 0.12 + (rr() - 0.5) * 0.12;
          stalagmite(g, rr, (cx + ox) * S, (cy + oy) * S, between(rr, 0.26, 0.36) * S, mixColor(col, INK, 0.08), 1.6);
        }
        stalagmite(g, rr, mx * S, my * S, mainR, col, 2.1);
      });
    }
  }

  // Champignons (cristaux en science-fiction et cyberpunk) : colonies dans les recoins et au bord de l'eau.
  const glows: [number, number, string][] = [];
  {
    const r = rng(seed, 581);
    const capCols = crystal ? ["#7fd4e0", "#a6e8d2", "#c9a8f0"] : ["#8e6446", "#c2b48e", "#7a5040", "#7fb8a4", "#a8905a"];
    const want = Math.max(3, Math.round(floorCells / 110));
    for (let t = 0, made = 0; t < 600 && made < want; t++) {
      const x0 = Math.floor(r() * W), y0 = Math.floor(r() * H);
      if (!dry(x0, y0)) continue;
      let wet = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x0 + dx, y0 + dy) === T.eau) wet = true;
      if (solidAround(x0, y0) < 3 && !wet) continue;
      const x = (x0 + between(r, 0.3, 0.7)) * S, y = (y0 + between(r, 0.3, 0.7)) * S;
      if (!onDry(x, y) || !isFree(x, y, S * 0.3)) continue;
      take(x, y, S * 0.35);
      made++;
      const colA = pick(r, capCols);
      const glow = crystal || colA === "#7fb8a4" || r() < 0.45;
      const gcol = crystal ? colA : "#86e6dc";
      if (glow) glows.push([x, y, gcol]);
      // une grappe d'environ 0,6 case : un grand, deux moyens, des petits
      const n = 4 + Math.floor(r() * 6);
      const caps: [number, number, number][] = [];
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2;
        const d = k === 0 ? between(r, 0, 3) : Math.pow(r(), 0.7) * S * 0.3;
        const mx = x + Math.cos(a) * d, my = y + Math.sin(a) * d;
        if (!onDry(mx, my) || fieldAt(dIn, mx, my) < 3) continue;
        caps.push([mx, my, k === 0 ? between(r, 0.16, 0.21) * S : k < 3 ? between(r, 0.1, 0.14) * S : between(r, 0.06, 0.09) * S]);
      }
      // du fond vers l'avant : le pied le plus haut à l'écran est peint d'abord
      caps.sort((a, b) => a[1] - b[1]);
      for (const [mx, my, s] of caps) {
        const col = glow && !crystal ? "#9fd8cc" : r() < 0.75 ? colA : pick(r, capCols);
        if (crystal) {
          const a = -Math.PI / 2 + (r() - 0.5) * 1.6;
          const ca = Math.cos(a), sn = Math.sin(a);
          const tip: Pt = [mx + ca * s * 2.2, my + sn * s * 2.2];
          const l: Pt = [mx - sn * s * 0.7, my + ca * s * 0.7];
          const rr: Pt = [mx + sn * s * 0.7, my - ca * s * 0.7];
          const base: Pt = [mx - ca * s * 0.5, my - sn * s * 0.5];
          castShadow(g, [tip, l, base, rr], 2, 3, 0.4);
          g.fillStyle = tint(col, 0.2);
          g.fill(polyPath([tip, l, base]));
          g.fillStyle = tint(col, -0.22);
          g.fill(polyPath([tip, rr, base]));
          inkOutline(g, [tip, l, base, rr], r, { width: 0.9, wobble: 0.15 });
          continue;
        }
        mushroom(g, r, mx, my, s, col, between(r, -0.3, 0.3));
      }
    }
  }

  // ——— 10. Ombres : la paroi porte une ombre nette sur le sol (lumière du haut à gauche), sans flou ———
  {
    g.save();
    g.clip(floor.path, "evenodd");
    for (const [dx, dy, a, hatched] of [[8, 10, 0.3, true], [3, 4, 0.22, false]] as const) {
      const sh = new Path2D();
      sh.addPath(rockPath, new DOMMatrix().translate(dx, dy));
      g.fillStyle = `rgba(10,6,3,${a})`;
      g.fill(sh, "evenodd");
      if (!hatched) continue;
      // l'ombre large est aussi hachurée à la plume
      g.save();
      g.clip(sh, "evenodd");
      g.strokeStyle = "rgba(14,9,5,.3)";
      g.lineWidth = 0.7;
      hatchBox(g, 0, 0, IW, IH, Math.PI / 4 + 0.12, 3);
      g.restore();
    }
    g.restore();
  }

  // ——— 11. Contour de la paroi : encre forte, repassée ; embouchures du ruisseau ———
  inkOutline(g, floorLoops, rng(seed, 801), { width: 3.2, wobble: 0.9, pressure: 0.6, double: true });
  drawMouths();
  for (const draw of edgeItems) draw();

  // ——— 12. Lumières : froid loin du feu, ambre près du feu et sous les rais tombés des fissures ———
  // Carte de lumière posée en « multiply » : une pénombre froide, vert-de-gris, partout ; des flaques chaudes
  // autour du feu et sous les rais, une lueur froide autour des champignons.
  {
    const lm = canvas(fw, fh);
    const lg = lm.getContext("2d")!;
    lg.fillStyle = darkTheme ? "#b2ab98" : "#b6bab2";
    lg.fillRect(0, 0, fw, fh);
    lg.scale(1 / F, 1 / F);
    lg.globalCompositeOperation = "lighter";
    const lin = lg.createLinearGradient(0, 0, IW, IH);
    lin.addColorStop(0, "rgba(34,30,22,1)");
    lin.addColorStop(1, "rgba(0,0,0,1)");
    lg.fillStyle = lin;
    lg.fillRect(0, 0, IW, IH);
    const spot = (x: number, y: number, R: number, a: number, rgb: string) => {
      const gr = lg.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(${rgb},${a})`);
      gr.addColorStop(0.5, `rgba(${rgb},${a * 0.45})`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      lg.fillStyle = gr;
      lg.fillRect(x - R, y - R, R * 2, R * 2);
    };
    if (fire) spot(fire[0], fire[1], 4.6 * S, darkTheme ? 0.95 : 0.62, "255,190,120");
    for (const s of shafts) {
      spot(s.ex, s.ey, 1.9 * S, 0.45, "255,222,160");
      spot(s.x + Math.cos(s.a) * s.L * 0.5, s.y + Math.sin(s.a) * s.L * 0.5, 1.4 * S, 0.2, "255,222,160");
    }
    for (const [x, y, col] of glows) {
      const n = parseInt(col.slice(1), 16);
      spot(x, y, (darkTheme ? 3 : 1.4) * S, darkTheme ? 0.6 : 0.3, `${n >> 16},${(n >> 8) & 255},${n & 255}`);
    }
    g.save();
    g.globalCompositeOperation = "multiply";
    g.drawImage(lm, 0, 0, fw * F, fh * F);
    g.restore();
    // genre sombre : dans trois cases autour du feu et des lueurs, le sol remonte à une valeur moyenne
    if (darkTheme) {
      g.save();
      g.clip(floor.path, "evenodd");
      g.globalCompositeOperation = "screen";
      const lift = (x: number, y: number, R: number, rgb: string, a: number) => {
        const gr = g.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(${rgb},${a})`);
        gr.addColorStop(0.55, `rgba(${rgb},${a * 0.5})`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr;
        g.fillRect(x - R, y - R, R * 2, R * 2);
      };
      if (fire) lift(fire[0], fire[1], 3.2 * S, "150,118,84", 0.42);
      for (const [x, y] of glows) lift(x, y, 3 * S, "92,120,112", 0.3);
      for (const s of shafts) lift(s.ex, s.ey, 2 * S, "140,128,104", 0.3);
      g.restore();
    }
  }
  // Halo du feu (ajouté, ambre) et lueurs des champignons.
  g.save();
  g.globalCompositeOperation = "lighter";
  if (fire) {
    const [fx, fy] = fire;
    const R = 4 * S;
    const halo = g.createRadialGradient(fx, fy, 0, fx, fy, R);
    halo.addColorStop(0, "rgba(255,150,60,.42)");
    halo.addColorStop(0.18, "rgba(235,120,45,.24)");
    halo.addColorStop(0.5, "rgba(160,75,25,.09)");
    halo.addColorStop(1, "rgba(120,50,20,0)");
    g.fillStyle = halo;
    g.fillRect(fx - R, fy - R, R * 2, R * 2);
  }
  for (const [x, y, col] of glows) {
    const R = 1.1 * S;
    const halo = g.createRadialGradient(x, y, 0, x, y, R);
    halo.addColorStop(0, tint(col, 0, 0.3));
    halo.addColorStop(0.55, tint(col, 0, 0.12));
    halo.addColorStop(0.62, tint(col, 0, 0.05));
    halo.addColorStop(1, tint(col, 0, 0));
    g.fillStyle = halo;
    g.fillRect(x - R, y - R, R * 2, R * 2);
  }
  g.restore();
  // Rais de lumière : une fissure ramifiée dans la paroi, d'où tombe un cône au bord fondu ; au pied, une
  // flaque de lumière chaude au bord flou, grains de poussière.
  for (const sh of shafts) {
    const r = r12;
    const { x: px, y: py, L, a, hw: hwEnd, ex, ey } = sh;
    const ux = Math.cos(a), uy = Math.sin(a);
    // la fissure : un tronc de 3 ou 4 segments qui s'enfonce dans la roche, et 2 ou 3 branches plus fines
    {
      const trunk: Pt[] = [[px + ux * 3, py + uy * 3]];
      const n = 3 + Math.floor(r() * 2);
      let dir = Math.atan2(-uy, -ux);
      for (let k = 0; k < n; k++) {
        dir += (r() - 0.5) * 1.1;
        const st = between(r, 0.22, 0.42) * S;
        const [lx, ly] = trunk[trunk.length - 1];
        trunk.push([lx + Math.cos(dir) * st, ly + Math.sin(dir) * st]);
      }
      const branches: Pt[][] = [];
      const nb = 2 + Math.floor(r() * 2);
      for (let b = 0; b < nb; b++) {
        const j = 1 + Math.floor(r() * (trunk.length - 2));
        const [bx, by] = trunk[j];
        const [nx, ny] = trunk[j + 1];
        let bd = Math.atan2(ny - by, nx - bx) + (r() < 0.5 ? 1 : -1) * between(r, 0.5, 1.1);
        const br: Pt[] = [[bx, by]];
        for (let k = 0; k < 2; k++) {
          bd += (r() - 0.5) * 0.8;
          const st = between(r, 0.12, 0.26) * S;
          br.push([br[br.length - 1][0] + Math.cos(bd) * st, br[br.length - 1][1] + Math.sin(bd) * st]);
        }
        branches.push(br);
      }
      g.save();
      g.filter = "blur(3px)";
      g.globalCompositeOperation = "screen";
      inkPolyline(g, trunk, r, { width: 7, taper: 10, wobble: 0.2, color: "rgba(255,214,150,.55)" });
      g.restore();
      inkPolyline(g, trunk, r, { width: 4.2, taper: 14, pressure: 0.35, wobble: 0.4 });
      for (const br of branches) inkPolyline(g, br, r, { width: 2, taper: 8, wobble: 0.4 });
      // la lumière passe par le tronc, près du bord
      inkPolyline(g, trunk, r, { width: 1.7, taper: 10, wobble: 0.2, color: "rgba(255,238,196,.95)" });
    }
    // le cône, tramé par cellules de 2 px
    const Q = 2;
    const xs = [px, ex - uy * hwEnd, ex + uy * hwEnd, ex + ux * 0.2 * S];
    const ys = [py, ey + ux * hwEnd, ey - ux * hwEnd, ey + uy * 0.2 * S];
    const bx0 = Math.floor(Math.min(...xs) - 8), by0 = Math.floor(Math.min(...ys) - 8);
    const bw = Math.ceil((Math.max(...xs) + 8 - bx0) / Q), bh = Math.ceil((Math.max(...ys) + 8 - by0) / Q);
    const off = canvas(bw, bh);
    const oc = off.getContext("2d")!;
    const img = oc.createImageData(bw, bh);
    for (let j = 0; j < bh; j++)
      for (let i = 0; i < bw; i++) {
        const X = bx0 + (i + 0.5) * Q - px, Y = by0 + (j + 0.5) * Q - py;
        const t = (X * ux + Y * uy) / L;
        if (t < 0 || t > 1.1) continue;
        const u = Math.abs(-X * uy + Y * ux);
        const hw = 0.13 * S + (hwEnd - 0.13 * S) * Math.min(1, t);
        let v = (1 - smooth(hw * 0.4, hw, u)) * (1 - 0.5 * t);
        if (t > 1) v *= 1 - (t - 1) / 0.1;
        const k = (j * bw + i) * 4;
        const level = v * 0.36;
        if (level < 0.01) continue;
        img.data[k] = 255;
        img.data[k + 1] = 232;
        img.data[k + 2] = 184;
        img.data[k + 3] = level * 255;
      }
    oc.putImageData(img, 0, 0);
    g.save();
    g.globalCompositeOperation = "screen";
    g.drawImage(off, bx0, by0, bw * Q, bh * Q);
    // quelques traits clairs dans l'axe du rai, à la plume
    for (let k = 0; k < 4; k++) {
      const o = (r() - 0.5) * 0.9;
      const t0 = between(r, 0.05, 0.3), t1 = between(r, 0.6, 0.95);
      const w0 = (0.13 * S + (hwEnd - 0.13 * S) * t0) * o, w1 = (0.13 * S + (hwEnd - 0.13 * S) * t1) * o;
      inkLine(g, px + ux * L * t0 - uy * w0, py + uy * L * t0 + ux * w0, px + ux * L * t1 - uy * w1, py + uy * L * t1 + ux * w1, r, { width: between(r, 0.6, 1.1), taper: 8, wobble: 0.15, color: `rgba(255,240,205,${between(r, 0.25, 0.45)})` });
    }
    // flaque de lumière au sol : un halo chaud au bord flou, plus intense au cœur
    {
      const pts = smoothPoints(blobPoints(r, ex, ey, hwEnd * 1.5, hwEnd * 1.05, 12, 0.14, a), 2);
      g.filter = `blur(${Math.round(hwEnd * 0.35)}px)`;
      g.fillStyle = "rgba(255,214,150,.2)";
      g.fill(polyPath(pts));
      g.filter = "blur(4px)";
      g.fillStyle = "rgba(255,232,180,.16)";
      g.fill(polyPath(smoothPoints(blobPoints(r, ex, ey, hwEnd * 0.8, hwEnd * 0.55, 10, 0.15, a), 2)));
      g.filter = "none";
    }
    // poussière dans la lumière
    for (let k = 0; k < 30; k++) {
      const t = r();
      const w = (r() - 0.5) * 2 * (5 + (hwEnd - 5) * t) * 0.8;
      g.fillStyle = `rgba(255,246,220,${between(r, 0.35, 0.95)})`;
      const s = between(r, 0.8, 1.8);
      g.fillRect(px + ux * L * t - uy * w, py + uy * L * t + ux * w, s, s);
    }
    g.restore();
  }

  // Portes éventuelles (cavernes aménagées par un MJ).
  paintDoors(c);

  // ——— 13. Quadrillage : fin, seulement sur le sol ———
  g.save();
  g.clip(floor.path, "evenodd");
  g.strokeStyle = theme.grid;
  g.lineWidth = 1;
  const grid = new Path2D();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y))) continue;
      grid.moveTo(x * S + S + 0.5, y * S);
      grid.lineTo(x * S + S + 0.5, y * S + S);
      grid.moveTo(x * S, y * S + S + 0.5);
      grid.lineTo(x * S + S, y * S + S + 0.5);
      if (!isOpen(at(x - 1, y))) {
        grid.moveTo(x * S + 0.5, y * S);
        grid.lineTo(x * S + 0.5, y * S + S);
      }
      if (!isOpen(at(x, y - 1))) {
        grid.moveTo(x * S, y * S + 0.5);
        grid.lineTo(x * S + S, y * S + 0.5);
      }
    }
  if (darkTheme) {
    // dans le noir, la grille s'efface (−40 %) ; elle reprend sa force là où il y a de la lumière
    g.globalAlpha = 0.6;
    g.stroke(grid);
    const lit = new Path2D();
    const disc = (x: number, y: number, R: number) => {
      lit.moveTo(x + R, y);
      lit.arc(x, y, R, 0, Math.PI * 2);
    };
    if (fire) disc(fire[0], fire[1], 3.2 * S);
    for (const [x, y] of glows) disc(x, y, 2.6 * S);
    for (const s of shafts) disc(s.ex, s.ey, 1.6 * S);
    g.clip(lit);
    g.globalAlpha = 0.45;
    g.stroke(grid);
    g.globalAlpha = 1;
  } else g.stroke(grid);
  g.restore();

  // ——— 14. Le papier (pas de cadre de case : comme le donjon, la nature et le village, la roche court jusqu'au bord) ———
  applyPaper(g, seed, 0.9);
  lightAt = () => [LX, LY];
  litMax = 1;
  return cv;
}
