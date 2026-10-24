// Tout ce qui bouge sur la carte, redessiné à chaque image par MapCanvas : pions en médaillons encrés,
// lumière des torches et ombres portées, brouillard de lavis et d'encre, sélection, portée, signaux, mesure.
// Même main que le décor (mapInk) : trait d'encre tremblé, lavis, hachures. Rien n'est tiré au hasard
// à chaque image : chaque pion a sa graine (son id), chaque bout de brouillard la sienne (la carte et la case),
// la flamme vacille sur un bruit à graine piloté par le temps : tout se redessine à l'identique.
import { T, type GameMap, type Token } from "../../shared/types";
import { INK, blobPoints, canvas, cellContour, inkPolyline, jitterPoints, mixColor, noise2, rng, smoothPoints, type Pt, type Rng } from "./mapInk";
import { BASE } from "./mapUtil";

const PAPER = "#ecdfc2";
const BLOOD = "#7a0e0e";
const BLOOD_DARK = "#3a0605";
const BRASS = "#d8b25a";
const OCHRE = "#a86c22";
const DISPLAY = `"IM Fell English SC", Cinzel, Georgia, serif`;
/** Écriture à la plume des étiquettes (nom d'un signal, distance). */
const HAND = `italic 600 1em "Cormorant Garamond", "EB Garamond", Georgia, serif`;
const handFont = (px: number) => HAND.replace("1em", `${px}px`);
/** Taille minimale d'une case pour dessiner un pion : au zoom le plus loin, le médaillon garde ~30 px de diamètre à l'écran. */
const MIN_TOKEN = 30;
/** Sous cette taille de case (px écran), version simplifiée : cerclage, liseré épais, une seule marque d'état ; ni grain, ni griffes longues. Le portrait reste. */
const SMALL = 36;

/** Graine stable tirée d'un texte (id de pion, nom). */
export function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rgbOf(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})/i.exec(hex.trim());
  if (!m) return [128, 110, 90];
  const s = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const n = parseInt(s, 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
const rgba = (hex: string, a: number) => {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${a})`;
};
const hex6 = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};

/** Couleur rapprochée de son gris (luminance) de `k` (0,25 = un quart moins saturée). */
function desaturate(hex: string, k: number) {
  const [r, g, b] = rgbOf(hex);
  const l = r * 0.3 + g * 0.59 + b * 0.11;
  return "#" + [r, g, b].map((v) => Math.round(v + (l - v) * k).toString(16).padStart(2, "0")).join("");
}

/** Initiale du pion : la première lettre du nom (« Goule 2 » → G). */
export function initial(name: string) {
  const w = name.split(/\s+/).find((x) => x && !/^\d+$/.test(x));
  return (w?.[0] ?? "?").toUpperCase();
}

/** Cercle tremblé : `n` points autour d'un centre, rayon qui ondule doucement (même forme pour une même graine). */
function wobblyCircle(r: Rng, cx: number, cy: number, rad: number, irr: number, n = 32): Pt[] {
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const ph3 = r() * 6.28;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (Math.sin(a * 2 + ph1) * 0.5 + Math.sin(a * 3 + ph2) * 0.3 + Math.sin(a * 7 + ph3) * 0.2) * irr;
    pts.push([cx + Math.cos(a) * rad * k, cy + Math.sin(a) * rad * k]);
  }
  return pts;
}

function polyPath(pts: Pt[]) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

function loopsPath(loops: Pt[][]) {
  const p = new Path2D();
  for (const l of loops) {
    l.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
  }
  return p;
}

function circlePath(cx: number, cy: number, rad: number) {
  const p = new Path2D();
  p.arc(cx, cy, rad, 0, Math.PI * 2);
  return p;
}

/** Anneau entre deux rayons, à découper en « evenodd ». */
function annulusPath(cx: number, cy: number, r0: number, r1: number) {
  const p = circlePath(cx, cy, r1);
  p.moveTo(cx + r0, cy);
  p.arc(cx, cy, r0, 0, Math.PI * 2);
  return p;
}

/** Hachures parallèles dans le rectangle [x, y, w, h], à l'angle `a` (déjà découpées par l'appelant). */
function hatchLines(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number, step: number, width: number, color: string, r: Rng) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const L = Math.hypot(w, h) / 2 + step;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  c.strokeStyle = color;
  c.lineCap = "round";
  for (let s = -L; s <= L; s += step) {
    const px = cx - dy * (s + (r() - 0.5) * step * 0.3);
    const py = cy + dx * (s + (r() - 0.5) * step * 0.3);
    c.lineWidth = width * (0.6 + r() * 0.8);
    c.beginPath();
    c.moveTo(px - dx * L, py - dy * L);
    c.lineTo(px + dx * L, py + dy * L);
    c.stroke();
  }
}

/** Ruban d'encre d'épaisseur donnée point par point (trait de pinceau). Les bouts s'effilent sur `taper` px. */
function ribbon(c: CanvasRenderingContext2D, pts: Pt[], widths: number[], taper = 0) {
  if (pts.length < 2) return;
  const left: Pt[] = [];
  const right: Pt[] = [];
  let L = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push((L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    let w = widths[i];
    if (taper > 0) w *= 0.25 + 0.75 * Math.min(1, cum[i] / taper, (L - cum[i]) / taper);
    left.push([pts[i][0] - ty * w * 0.5, pts[i][1] + tx * w * 0.5]);
    right.push([pts[i][0] + ty * w * 0.5, pts[i][1] - tx * w * 0.5]);
  }
  c.beginPath();
  left.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
  c.closePath();
  c.fill();
}

/** Cercle au pinceau, non fermé : il s'ouvre de `gap` radians, début et fin décalés en spirale. */
function openCircle(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, seed: number, o: { width: number; color: string; gap?: number; under?: string; wobble?: number; a0?: number }) {
  const r = rng(seed, 31);
  const gap = o.gap ?? 0.35;
  const a0 = o.a0 ?? r() * Math.PI * 2;
  const span = Math.PI * 2 - gap;
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const drift = (0.04 + r() * 0.04) * R;
  const pts: Pt[] = [];
  const N = Math.max(18, Math.round(R * 0.8));
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = a0 + span * t;
    const rad = R + Math.sin(a * 2 + ph1) * (o.wobble ?? 0.8) + Math.sin(a * 5 + ph2) * 0.4 + (t - 0.5) * drift;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  if (o.under) inkPolyline(g, pts, rng(seed, 32), { width: o.width + 2, color: o.under, wobble: 0.25, pressure: 0.55, taper: R * 0.7 });
  inkPolyline(g, pts, rng(seed, 32), { width: o.width, color: o.color, wobble: 0.25, pressure: 0.55, taper: R * 0.7 });
}

// ——— Pions ———

export interface TokenLook {
  selected?: boolean;
  mine: boolean;
  portrait?: HTMLImageElement | null;
  /** Classe ou métier du personnage (« Paladin », « Canonnier ») : choisit la coiffe du buste quand il n'y a pas de portrait. */
  role?: string;
  dpr?: number;
  /** Figurine saisie par la main : elle quitte le sol, son ombre s'élargit et reste en bas. */
  lifted?: boolean;
}

const sprites = new Map<string, HTMLCanvasElement>();
const imageIds = new WeakMap<HTMLImageElement, number>();
let imageCount = 0;
const imageId = (im: HTMLImageElement) => {
  let id = imageIds.get(im);
  if (!id) imageIds.set(im, (id = ++imageCount));
  return id;
};

/** Pion en médaillon encré, centré sur (cx, cy), `size` = taille de sa case en px écran. Mis en cache par apparence. */
export function drawToken(g: CanvasRenderingContext2D, t: Token, cx: number, cy: number, size: number, o: TokenLook) {
  const dpr = o.dpr ?? 1;
  const eff = Math.max(size, MIN_TOKEN * (t.size ?? 1));
  const ratio = t.hpMax ? Math.max(0, Math.min(1, (t.hp ?? t.hpMax) / t.hpMax)) : null;
  // Taille arrondie par paliers : pendant un zoom, on ne repeint pas les médaillons à chaque image.
  const raw = eff * dpr;
  const step = Math.max(1, Math.round(raw / 24));
  const px = Math.max(4, Math.round(raw / step) * step);
  // Une figurine garde son visage à toute taille : c'est lui qui la distingue sur le plateau.
  const portrait = o.portrait;
  const key = [t.id, t.name, t.color, t.kind, t.size ?? 1, t.hidden ? 1 : 0, ratio === null ? "-" : Math.round(ratio * 40), (t.conditions ?? []).join(","), o.mine ? 1 : 0, portrait ? imageId(portrait) : 0, o.role ?? "", px].join("|");
  let sp = sprites.get(key);
  if (!sp) {
    if (sprites.size > 400) sprites.clear();
    // Place pour l'ombre, les griffes et la languette des états (24 px écran sous le médaillon).
    const D = Math.ceil(px * 1.9 + 48 * (px / eff));
    sp = canvas(D, D);
    const c = sp.getContext("2d")!;
    c.scale(px / eff, px / eff);
    paintMedallion(c, t, (D / 2) * (eff / px), (D / 2) * (eff / px), eff, ratio, { ...o, portrait });
    sprites.set(key, sp);
  }
  const d = sp.width * (eff / px);
  if (!o.lifted) {
    g.drawImage(sp, cx - d / 2, cy - d / 2, d, d);
    return;
  }
  // Soulevée : ombre floue restée au sol, décalée vers le bas à droite, et figurine 12 % plus grande, montée d'un cinquième de case.
  const r = eff * 0.45;
  g.save();
  g.filter = `blur(${Math.max(2, eff * 0.08)}px)`;
  g.fillStyle = "rgba(6,3,1,.5)";
  g.beginPath();
  g.ellipse(cx + eff * 0.12, cy + eff * 0.18, r * 1.1, r * 0.95, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const k = 1.12;
  g.drawImage(sp, cx - (d * k) / 2, cy - eff * 0.22 - (d * k) / 2, d * k, d * k);
}

/** Ce qui menace dans un monstre, lu dans son nom : bête (griffes), démon (cornes), mort-vivant (côtes). */
type Menace = "bete" | "demon" | "mort";
const UNDEAD = /goule|squelet|\bmorts?\b|\bd'os\b|\bos\b|spectre|zombi|liche|revenant|fant[oô]me|momie|vampire|ombre|cadavre|n[ée]cro|cr[âa]ne|banshee|wight|nonmort|non-mort/i;
const DEMON = /d[ée]mon|diable|diablotin|infernal|\bimp\b|succube|incube|cornu|fi[ée]lon|abyss|bal?rog|m[ée]phit/i;
export function menaceOf(name: string): Menace {
  if (UNDEAD.test(name)) return "mort";
  if (DEMON.test(name)) return "demon";
  return "bete";
}

/** Pointe courbe posée sur l'anneau : base de demi-largeur `w`, longueur `len`, pointe déportée de `bend` × len. */
function spikePath(cx: number, cy: number, a: number, base: number, len: number, w: number, bend: number) {
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const P = (along: number, side: number): Pt => [cx + ux * (base + along) - uy * side, cy + uy * (base + along) + ux * side];
  const tip = P(len, bend * len);
  const l0 = P(-w * 0.4, -w);
  const r0 = P(-w * 0.4, w);
  const cl = P(len * 0.55, -w * 0.6 + bend * len * 0.25);
  const cr = P(len * 0.45, w * 0.4 + bend * len * 0.6);
  const p = new Path2D();
  p.moveTo(l0[0], l0[1]);
  p.quadraticCurveTo(cl[0], cl[1], tip[0], tip[1]);
  p.quadraticCurveTo(cr[0], cr[1], r0[0], r0[1]);
  p.closePath();
  return { p, tip };
}

/** Griffes, cornes ou côtes autour de l'anneau d'un monstre ; chaque pointe a sa longueur et sa courbure (graine du pion). */
function threats(c: CanvasRenderingContext2D, kind: Menace, r: Rng, cx: number, cy: number, R: number, reach: number, big: boolean, small: boolean) {
  const edge = Math.max(0.9, R * 0.07);
  // Pointe en matière claire (ivoire, corne) cernée d'encre : elle se lit sur la dalle comme dans le noir.
  const paint = (p: Path2D, fill: string) => {
    c.strokeStyle = INK;
    c.lineWidth = edge * 2;
    c.lineJoin = "round";
    c.stroke(p);
    c.fillStyle = fill;
    c.fill(p);
  };
  if (kind === "demon") {
    // Deux cornes en haut, chacune sa courbe, annelées ; une ou deux épines dans le dos des gros.
    for (const side of [-1, 1]) {
      const a = -Math.PI / 2 + side * (0.5 + r() * 0.28);
      const len = reach * (1.7 + r() * 0.6);
      const w = R * (0.19 + r() * 0.06);
      const s = spikePath(cx, cy, a, R * 0.9, len, w, side * (0.45 + r() * 0.35));
      paint(s.p, "#6b4a32");
      if (!small) {
        c.save();
        c.clip(s.p);
        c.strokeStyle = "rgba(20,10,6,.6)";
        c.lineWidth = Math.max(0.5, R * 0.03);
        for (let k = 1; k <= 3; k++) {
          const d = R * 0.9 + len * (k / 4.2);
          const ax = cx + Math.cos(a) * d;
          const ay = cy + Math.sin(a) * d;
          c.beginPath();
          c.moveTo(ax + Math.sin(a) * w * 1.4, ay - Math.cos(a) * w * 1.4);
          c.lineTo(ax - Math.sin(a) * w * 1.4, ay + Math.cos(a) * w * 1.4);
          c.stroke();
        }
        c.restore();
      }
    }
    if (big) for (let k = 0; k < 2; k++) paint(spikePath(cx, cy, Math.PI * (0.35 + k * 0.3 + (r() - 0.5) * 0.1), R * 0.92, reach * (0.7 + r() * 0.3), R * 0.09, (r() - 0.5) * 0.4).p, "#6b4a32");
    return;
  }
  if (kind === "mort") {
    // Côtes : arcs d'os qui partent des flancs et retombent, un peu de travers.
    const per = big ? 3 : small ? 1 : 2;
    const w = Math.max(1.2, R * (big ? 0.1 : 0.13));
    for (const side of [-1, 1]) {
      for (let j = 0; j < per; j++) {
        const a = (side > 0 ? 0 : Math.PI) + side * ((j - (per - 1) / 2) * 0.42 - 0.12 + (r() - 0.5) * 0.14);
        const L = reach * (0.85 + r() * 0.5);
        const drop = L * (0.4 + r() * 0.35);
        const p0: Pt = [cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88];
        const p1: Pt = [cx + Math.cos(a) * (R + L * 0.6), cy + Math.sin(a) * (R + L * 0.6) + drop * 0.25];
        const p2: Pt = [cx + Math.cos(a) * (R + L * 0.95) + side * -L * 0.15, cy + Math.sin(a) * (R + L * 0.95) + drop];
        const pts = smoothPoints([p0, p1, p2], 2, false);
        inkPolyline(c, pts, r, { width: w + Math.max(1.4, R * 0.08), color: INK, wobble: 0.15, pressure: 0.3, taper: L * 0.5 });
        inkPolyline(c, pts, r, { width: w, color: "#e4d8b8", wobble: 0.15, pressure: 0.3, taper: L * 0.5 });
      }
    }
    return;
  }
  // Bête : 3 ou 4 griffes (5 pour les grosses), toutes crochues du même côté, comme une patte qui tourne.
  const n = big ? 5 : 3 + (r() < 0.5 ? 1 : 0);
  const hook = r() < 0.5 ? 1 : -1;
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + (r() - 0.5) * 0.45) / n) * Math.PI * 2;
    paint(spikePath(cx, cy, a, R * 0.92, reach * (1.25 + r() * 0.6), R * (0.1 + r() * 0.06), hook * (0.3 + r() * 0.35)).p, "#e2d4b0");
  }
}

/** Silhouette noire en ombre chinoise (gros monstres), dans un disque de rayon `s`. */
function silhouette(c: CanvasRenderingContext2D, kind: Menace, cx: number, cy: number, s: number, r: Rng, ink = "#0b0705") {
  const P = (x: number, y: number): Pt => [cx + x * s, cy + y * s];
  const p = new Path2D();
  const poly = (pts: [number, number][]) => {
    pts.forEach(([x, y], i) => {
      const [X, Y] = P(x + (r() - 0.5) * 0.03, y + (r() - 0.5) * 0.03);
      if (i) p.lineTo(X, Y);
      else p.moveTo(X, Y);
    });
    p.closePath();
  };
  const hole = (x: number, y: number, rx: number, ry: number) => {
    const [X, Y] = P(x, y);
    p.moveTo(X + rx * s, Y);
    p.ellipse(X, Y, rx * s, ry * s, 0, 0, Math.PI * 2);
  };
  if (kind === "mort") {
    // Crâne : boîte, pommettes, mâchoire, orbites et nez creusés.
    const [X, Y] = P(0, -0.12);
    p.moveTo(X + s * 0.56, Y);
    p.ellipse(X, Y, s * 0.56, s * 0.52, 0, 0, Math.PI * 2);
    poly([[-0.34, 0.2], [0.34, 0.2], [0.3, 0.62], [-0.3, 0.62]]);
    hole(-0.21, -0.06, 0.15, 0.13);
    hole(0.21, -0.06, 0.15, 0.13);
    poly([[0, 0.12], [0.07, 0.26], [-0.07, 0.26]]);
    c.fillStyle = ink;
    c.fill(p, "evenodd");
    c.strokeStyle = ink;
    c.lineWidth = Math.max(0.8, s * 0.05);
    for (let k = -2; k <= 2; k++) {
      const [x0, y0] = P(k * 0.1, 0.44);
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0, y0 + s * 0.2);
      c.stroke();
    }
    return;
  }
  if (kind === "demon") {
    poly([[-0.36, -0.2], [-0.62, -0.62], [-0.78, -0.95], [-0.52, -0.7], [-0.2, -0.38], [0.2, -0.38], [0.52, -0.7], [0.78, -0.95], [0.62, -0.62], [0.36, -0.2], [0.42, 0.18], [0.2, 0.6], [0, 0.78], [-0.2, 0.6], [-0.42, 0.18]]);
    poly([[-0.3, -0.05], [-0.08, 0.04], [-0.26, 0.08]]);
    poly([[0.3, -0.05], [0.08, 0.04], [0.26, 0.08]]);
    c.fillStyle = ink;
    c.fill(p, "evenodd");
    return;
  }
  // Bête : tête de loup, oreilles dressées, museau.
  poly([[-0.55, -0.82], [-0.22, -0.42], [0.22, -0.42], [0.55, -0.82], [0.62, -0.18], [0.4, 0.2], [0.2, 0.72], [0, 0.82], [-0.2, 0.72], [-0.4, 0.2], [-0.62, -0.18]]);
  poly([[-0.34, -0.1], [-0.12, -0.02], [-0.3, 0.04]]);
  poly([[0.34, -0.1], [0.12, -0.02], [0.3, 0.04]]);
  c.fillStyle = ink;
  c.fill(p, "evenodd");
}

/** Métal du cerclage : laiton (héros), étain (PNJ), fer noirci (monstres). Clair → sombre, de la lumière (haut gauche) à l'ombre. */
type Metal = "laiton" | "etain" | "fer";
const METALS: Record<Metal, [string, string, string, string]> = {
  laiton: ["#f7e3a2", "#c99a3e", "#6e4c17", "#24170a"],
  etain: ["#eeebe2", "#a9a59b", "#59554d", "#1c1a17"],
  fer: ["#9d978e", "#57524c", "#262321", "#080706"],
};

/** Cerclage de métal entre r0 et r1 : dégradé de la lumière, chanfrein intérieur, reflet franc en haut à gauche, usure. */
function metalRing(c: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, metal: Metal, rr: Rng, fine: boolean) {
  const m = METALS[metal];
  const w = r1 - r0;
  const band = annulusPath(cx, cy, r0, r1);
  // Dégradé radial venu du haut gauche : le métal est bombé, la lumière s'y pose puis tourne vers l'ombre.
  const gr = c.createRadialGradient(cx - r1 * 0.55, cy - r1 * 0.6, r1 * 0.08, cx - r1 * 0.1, cy - r1 * 0.12, r1 * 1.55);
  gr.addColorStop(0, m[0]);
  gr.addColorStop(0.32, m[1]);
  gr.addColorStop(0.7, m[2]);
  gr.addColorStop(1, m[3]);
  c.fillStyle = gr;
  c.fill(band, "evenodd");
  // Chanfrein : le bord intérieur descend vers l'émail, éclairé à l'inverse (sombre en haut à gauche).
  const bev = c.createLinearGradient(cx - r0, cy - r0, cx + r0, cy + r0);
  bev.addColorStop(0, "rgba(12,7,3,.6)");
  bev.addColorStop(0.5, "rgba(12,7,3,0)");
  bev.addColorStop(1, rgba(m[0], 0.55));
  c.fillStyle = bev;
  c.fill(annulusPath(cx, cy, r0, r0 + w * 0.4), "evenodd");
  c.save();
  c.clip(band, "evenodd");
  c.lineCap = "round";
  const rm = r0 + w * 0.64;
  const a = Math.PI * 1.06 + (rr() - 0.5) * 0.14;
  c.strokeStyle = metal === "fer" ? "rgba(230,224,212,.6)" : "rgba(255,251,236,.9)";
  c.lineWidth = Math.max(0.8, w * 0.3);
  c.beginPath();
  c.arc(cx, cy, rm, a, a + 0.6 + rr() * 0.15);
  c.stroke();
  c.lineWidth = Math.max(0.6, w * 0.16);
  c.beginPath();
  c.arc(cx, cy, rm, a + 0.86, a + 1.02);
  c.stroke();
  // Lumière renvoyée, courte, en bas à droite.
  c.strokeStyle = rgba(m[1], 0.7);
  c.lineWidth = Math.max(0.5, w * 0.12);
  c.beginPath();
  c.arc(cx, cy, r0 + w * 0.3, Math.PI * 0.1, Math.PI * 0.32);
  c.stroke();
  if (fine) {
    // Usure : piqûres et rayures ; rouille dans les creux du fer.
    for (let i = 0; i < 34; i++) {
      const aa = rr() * 6.28;
      const d = r0 + w * (0.1 + rr() * 0.8);
      c.fillStyle = rr() < 0.65 ? "rgba(20,12,4,.35)" : "rgba(255,248,228,.3)";
      c.beginPath();
      c.arc(cx + Math.cos(aa) * d, cy + Math.sin(aa) * d, Math.max(0.3, w * (0.04 + rr() * 0.07)), 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 4; i++) {
      const aa = rr() * 6.28;
      const d = r0 + w * (0.25 + rr() * 0.5);
      const l = w * (0.6 + rr() * 0.9);
      c.strokeStyle = "rgba(255,248,228,.28)";
      c.lineWidth = Math.max(0.3, w * 0.05);
      c.beginPath();
      c.moveTo(cx + Math.cos(aa) * d, cy + Math.sin(aa) * d);
      c.lineTo(cx + Math.cos(aa + l / d) * (d + w * 0.15), cy + Math.sin(aa + l / d) * (d + w * 0.15));
      c.stroke();
    }
    if (metal === "fer") {
      for (let i = 0; i < 3; i++) {
        const aa = rr() * 6.28;
        const d = r0 + w * 0.5;
        c.fillStyle = "rgba(122,52,18,.55)";
        c.fill(polyPath(blobPoints(rr, cx + Math.cos(aa) * d, cy + Math.sin(aa) * d, w * (0.4 + rr() * 0.4), w * 0.3, 7, 0.4, aa + 1.57)));
      }
    }
    // Ombre du cerclage, en hachures, côté bas droit.
    const cut = new Path2D();
    cut.rect(cx - r1 * 2, cy - r1 * 2, r1 * 4, r1 * 4);
    cut.arc(cx - r1 * 0.16, cy - r1 * 0.2, r1 * 0.98, 0, Math.PI * 2);
    c.clip(cut, "evenodd");
    hatchLines(c, cx - r1, cy - r1, r1 * 2, r1 * 2, -Math.PI / 4, Math.max(1.8, w * 0.42), Math.max(0.5, w * 0.11), "rgba(10,6,2,.55)", rr);
  }
  c.restore();
  // Rivets du fer : 5 à 7, inégalement espacés, chacun son reflet.
  if (metal === "fer" && w > 2.6) {
    const n = 5 + Math.floor(rr() * 3);
    const a0 = rr() * 6.28;
    for (let i = 0; i < n; i++) {
      const aa = a0 + ((i + (rr() - 0.5) * 0.35) / n) * Math.PI * 2;
      const x = cx + Math.cos(aa) * (r0 + w * 0.52);
      const y = cy + Math.sin(aa) * (r0 + w * 0.52);
      const s = Math.max(0.8, w * 0.2);
      c.fillStyle = "#0b0908";
      c.beginPath();
      c.arc(x + s * 0.25, y + s * 0.3, s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#7d776f";
      c.beginPath();
      c.arc(x, y, s * 0.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(240,234,220,.75)";
      c.beginPath();
      c.arc(x - s * 0.3, y - s * 0.3, s * 0.3, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** Coiffe du buste, lue dans la classe : c'est elle (et ce que le personnage porte) qui fait reconnaître un pion de loin. */
type Coiffe = "heaume" | "casque" | "cornes" | "capuche" | "druide" | "pointu" | "large" | "tricorne" | "aureole" | "bois" | "bulle" | "plume" | "nu";
/** Ce que le personnage tient : épée et bouclier, arc, dagues, bâton, masse, luth, hache, sabre, pistolet. */
type Attribut = "bouclier" | "arc" | "dagues" | "baton" | "masse" | "luth" | "hache" | "sabre" | "pistolet" | null;
const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function coiffeOf(role: string): Coiffe {
  const n = sansAccents(role);
  if (/barbare|viking|berserk/.test(n)) return "cornes";
  if (/pilote|xeno|astronaut|scaphandr|aeronaute/.test(n)) return "bulle";
  if (/vaudou|pistolero|sherif|prime|prospect|predicat|detective|journal|photograph|poker|cowboy|antiquaire|professeur|fixer|chirurgien/.test(n)) return "large";
  if (/magicien|ensorcel|sorci|occult|mage\b|psioni|enchant|invoca/.test(n)) return "pointu";
  if (/capitaine|corsaire|canonnier|navigat|pirate|mousse|flibust|boucan/.test(n)) return "tricorne";
  if (/clerc|pretre|templi|saint|abbe|nonne|soeur/.test(n)) return "aureole";
  if (/druide/.test(n)) return "druide";
  if (/chaman|sylv/.test(n)) return "bois";
  if (/barde|duelliste|aristocrat|menestrel|maitre d'armes|diplomate|courtis/.test(n)) return "plume";
  if (/paladin|chevalier|croise/.test(n)) return "heaume";
  if (/guerrier|mercenaire|soldat|solo|militaire|garde|policier|flic|convoi|pillard|legion|sergent/.test(n)) return "casque";
  if (/voleur|rodeu|chasseur|eclaireu|espion|pelerin|heretique|fossoyeur|netrunner|contrebandier|veilleur|assassin|hackeu|agent|nomade/.test(n)) return "capuche";
  return "nu";
}
function attributOf(role: string): Attribut {
  const n = sansAccents(role);
  if (/prime|pistol|sherif|cowboy|flic|policier|solo|soldat d'elite|agent|detective/.test(n)) return "pistolet";
  if (/barbare|viking|berserk|bucheron/.test(n)) return "hache";
  if (/paladin|chevalier|templi|guerrier|mercenaire|legion|sergent|garde\b/.test(n)) return "bouclier";
  if (/rodeu|chasseur|eclaireu/.test(n)) return "arc";
  if (/voleur|assassin|espion|contrebandier|veilleur/.test(n)) return "dagues";
  if (/magicien|mage\b|ensorcel|sorci|occult|psioni|enchant|druide|chaman|pelerin|moine/.test(n)) return "baton";
  if (/clerc|pretre|abbe|predicat/.test(n)) return "masse";
  if (/barde|menestrel/.test(n)) return "luth";
  if (/capitaine|corsaire|maitre d'armes|duelliste|pirate|flibust/.test(n)) return "sabre";
  return null;
}

/** Couleurs du personnage dessiné : papier clair (85 % de luminance), ombre de lavis, acier, orbe. */
const FIG = "#e9dab6";
const FIG_SHADE = "rgba(92,58,26,.5)";
const STEEL = "#dcdad0";
/** Drap des manteaux et capuchons : un ton plus bas que la peau, pour que la silhouette ne soit pas un seul bloc clair. */
const CLOTH = "#a8895e";

/**
 * Personnage du médaillon, en traits d'encre sur le lavis sépia : chaque pièce (épaules, tête, coiffe, arme) est remplie de papier
 * clair, modelée par un lavis d'ombre du côté opposé à la lumière (haut gauche), deux ou trois hachures qui suivent la forme
 * dans cette ombre, puis cernée d'un trait d'encre de `lw` px. Peintes dans l'ordre : ce qui est dans le dos, le corps, la tête,
 * la coiffe, ce qui est tenu devant. `s` : unité du dessin (≈ 0,6 rayon du disque). `small` : ni hachures ni petits détails.
 */
function heroFigure(c: CanvasRenderingContext2D, coiffe: Coiffe, attr: Attribut, cx: number, cy: number, s: number, lw: number, r: Rng, small: boolean) {
  const P = (x: number, y: number): Pt => [cx + x * s, cy + y * s];
  const j = () => (r() - 0.5) * 0.03;
  c.lineJoin = "round";
  c.lineCap = "round";
  /** Modelé d'une pièce : lavis d'ombre en bas à droite, hachures dans l'ombre, puis le trait. */
  const model = (path: Path2D, box: [number, number, number, number], hatch: number) => {
    const [x0, y0, x1, y1] = box;
    c.save();
    c.clip(path);
    const gr = c.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, "rgba(255,250,232,.35)");
    gr.addColorStop(0.42, "rgba(255,250,232,0)");
    gr.addColorStop(0.62, "rgba(92,58,26,0)");
    gr.addColorStop(1, FIG_SHADE);
    c.fillStyle = gr;
    c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    if (!small && hatch > 0) {
      const w = x1 - x0;
      const h = y1 - y0;
      for (let i = 0; i < hatch; i++) {
        const u = 0.6 + i * 0.12 + (r() - 0.5) * 0.05;
        const ax = x0 + w * u;
        const ay = y0 + h * (0.98 - (u - 0.6) * 0.5);
        const len = Math.min(w, h) * (0.32 + r() * 0.14);
        inkPolyline(c, [[ax, ay], [ax + len * 0.55, ay - len * 0.85]], r, { width: Math.max(0.6, lw * 0.5), color: "rgba(26,16,8,.75)", wobble: 0.2, pressure: 0.4, taper: len * 0.4 });
      }
    }
    c.restore();
    c.strokeStyle = INK;
    c.lineWidth = lw;
    c.stroke(path);
  };
  const boxOf = (pts: Pt[]): [number, number, number, number] => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    return [x0, y0, x1, y1];
  };
  const poly = (pts: [number, number][], o: { fill?: string; hatch?: number; smooth?: number } = {}) => {
    const q = smoothPoints(pts.map(([x, y]) => P(x + j(), y + j())), o.smooth ?? 1);
    const path = polyPath(q);
    c.fillStyle = o.fill ?? FIG;
    c.fill(path);
    model(path, boxOf(q), o.hatch ?? 0);
  };
  const oval = (x: number, y: number, rx: number, ry: number, rot = 0, o: { fill?: string; hatch?: number } = {}) => {
    const [X, Y] = P(x, y);
    const path = new Path2D();
    path.ellipse(X, Y, rx * s, ry * s, rot, 0, Math.PI * 2);
    c.fillStyle = o.fill ?? FIG;
    c.fill(path);
    const m = Math.max(rx, ry) * s;
    model(path, [X - m, Y - m, X + m, Y + m], o.hatch ?? 0);
  };
  /** Hampe, lame, corde : trait d'encre épais, puis le papier par-dessus (l'objet est cerné des deux côtés). */
  const rod = (pts: [number, number][], w: number, fill = FIG) => {
    const q = pts.map(([x, y]) => P(x, y));
    c.strokeStyle = INK;
    c.lineWidth = w * s + lw * 2;
    c.beginPath();
    q.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    if (w * s > lw * 0.6) {
      c.strokeStyle = fill;
      c.lineWidth = w * s;
      c.stroke();
    }
  };
  const ink = (pts: [number, number][], w: number) => inkPolyline(c, pts.map(([x, y]) => P(x, y)), r, { width: Math.max(0.7, w * s), color: INK, wobble: 0.12, pressure: 0.35, taper: s * 0.12 });
  const dark = (x: number, y: number, rx: number, ry: number) => {
    const [X, Y] = P(x, y);
    c.fillStyle = "#2a1a0d";
    c.beginPath();
    c.ellipse(X, Y, rx * s, ry * s, 0, 0, Math.PI * 2);
    c.fill();
  };

  // — Dans le dos —
  if (attr === "arc") {
    // Arc en travers du dos, de la hanche gauche à l'épaule droite ; corde fine ; empennes du carquois sur l'épaule droite.
    const bow: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const m = 1 - t;
      bow.push([m * m * -0.98 + 2 * m * t * -1.08 + t * t * 0.62, m * m * 0.95 + 2 * m * t * -0.82 + t * t * -1.02]);
    }
    rod(bow, small ? 0.11 : 0.09);
    if (!small) ink([[-0.98, 0.95], [0.62, -1.02]], 0.02);
    for (const [dx, dy] of [[0.5, -0.5], [0.64, -0.44], [0.78, -0.34]] as const) {
      rod([[dx - 0.18, dy + 0.62], [dx, dy]], 0.04);
      if (!small) poly([[dx - 0.05, dy + 0.06], [dx - 0.02, dy - 0.14], [dx + 0.09, dy - 0.06], [dx + 0.05, dy + 0.1]], { smooth: 0 });
    }
  } else if (attr === "hache") {
    // Hache à deux mains sur l'épaule droite, fer en croissant au-dessus.
    rod([[0.2, 1.15], [0.86, -0.62]], 0.1);
    poly([[0.62, -0.5], [0.66, -0.82], [0.9, -1.02], [1.08, -0.9], [1.02, -0.62], [0.98, -0.4], [0.82, -0.36]], { fill: STEEL, hatch: 1 });
  }

  // — Le corps —
  const cloak = coiffe === "capuche" || coiffe === "druide";
  const armored = coiffe === "heaume" || coiffe === "casque";
  if (cloak) {
    poly([[-1.08, 1.4], [-1.0, 0.7], [-0.72, 0.36], [-0.4, 0.2], [0.4, 0.2], [0.72, 0.36], [1.0, 0.7], [1.08, 1.4]], { fill: CLOTH, hatch: 3 });
    // Pli du manteau, de l'épaule vers le bas.
    if (!small) ink([[0.36, 0.42], [0.46, 0.8], [0.44, 1.2]], 0.035);
  } else if (armored) {
    // Spalières : deux plaques d'épaule en bombé, puis le torse.
    poly([[-0.62, 1.4], [-0.6, 0.5], [-0.3, 0.26], [0.3, 0.26], [0.6, 0.5], [0.62, 1.4]], { hatch: 2 });
    oval(-0.72, 0.56, 0.36, 0.26, -0.3, { fill: STEEL, hatch: 1 });
    oval(0.72, 0.56, 0.36, 0.26, 0.3, { fill: STEEL, hatch: 2 });
  } else {
    poly([[-1.04, 1.4], [-0.98, 0.74], [-0.76, 0.44], [-0.36, 0.28], [-0.15, 0.14], [0.15, 0.14], [0.36, 0.28], [0.76, 0.44], [0.98, 0.74], [1.04, 1.4]], { hatch: 3 });
    if (!small) ink([[-0.12, 0.3], [0, 0.5], [0.12, 0.3]], 0.03);
  }

  // — La tête et la coiffe —
  const head = () => oval(0, -0.36, 0.29, 0.34, 0, { hatch: 2 });
  switch (coiffe) {
    case "heaume":
      // Heaume fermé à sommet plat ; fente des yeux et croix de souffles à l'encre.
      poly([[-0.36, 0.1], [-0.38, -0.5], [-0.28, -0.74], [0, -0.8], [0.28, -0.74], [0.38, -0.5], [0.36, 0.1], [0, 0.16]], { fill: STEEL, hatch: 2 });
      ink([[-0.27, -0.36], [0.27, -0.36]], 0.08);
      ink([[0, -0.3], [0, 0.06]], 0.045);
      if (!small) ink([[-0.12, -0.12], [0.12, -0.12]], 0.035);
      break;
    case "casque":
      head();
      poly([[-0.34, -0.3], [-0.33, -0.55], [-0.2, -0.74], [0, -0.79], [0.2, -0.74], [0.33, -0.55], [0.34, -0.3]], { fill: STEEL, hatch: 1 });
      rod([[0, -0.32], [0, -0.06]], 0.06, STEEL);
      break;
    case "cornes":
      head();
      for (const sd of [-1, 1]) poly([[sd * 0.26, -0.5], [sd * 0.5, -0.56], [sd * 0.66, -0.78], [sd * 0.62, -1.02], [sd * 0.54, -0.8], [sd * 0.4, -0.66], [sd * 0.22, -0.62]], { hatch: sd > 0 ? 1 : 0 });
      poly([[-0.34, -0.3], [-0.33, -0.55], [-0.2, -0.72], [0, -0.76], [0.2, -0.72], [0.33, -0.55], [0.34, -0.3]], { fill: STEEL, hatch: 1 });
      break;
    case "capuche":
      // Capuchon qui retombe sur les épaules ; le visage se perd dans l'ombre (deux yeux à peine).
      poly([[-0.56, 0.34], [-0.5, -0.12], [-0.4, -0.5], [-0.2, -0.74], [0.04, -0.8], [0.22, -0.72], [0.42, -0.48], [0.5, -0.12], [0.56, 0.34], [0.2, 0.22], [-0.2, 0.22]], { fill: CLOTH, hatch: 3 });
      dark(0.02, -0.28, 0.2, 0.25);
      if (!small) {
        c.fillStyle = "rgba(233,218,182,.7)";
        for (const ex of [-0.08, 0.1]) {
          const [X, Y] = P(ex, -0.32);
          c.fillRect(X - s * 0.04, Y - s * 0.012, s * 0.08, Math.max(0.8, s * 0.025));
        }
      }
      break;
    case "druide":
      // Capuchon rond, couronne de feuilles posée dessus.
      poly([[-0.62, 0.36], [-0.56, -0.1], [-0.46, -0.5], [-0.24, -0.76], [0, -0.82], [0.24, -0.76], [0.46, -0.5], [0.56, -0.1], [0.62, 0.36], [0.2, 0.22], [-0.2, 0.22]], { fill: CLOTH, hatch: 3 });
      dark(0.02, -0.26, 0.19, 0.24);
      if (!small) for (let i = 0; i < 5; i++) oval(-0.4 + i * 0.2, -0.7 - Math.sin((i / 4) * Math.PI) * 0.1, 0.11, 0.06, (i - 2) * 0.5, { fill: "#8f8a52" });
      break;
    case "pointu":
      // Chapeau pointu à large bord, la pointe cassée vers la droite.
      head();
      oval(0, -0.6, 0.66, 0.14, -0.05, { hatch: 1 });
      poly([[-0.32, -0.62], [-0.16, -0.92], [0.04, -1.2], [0.3, -1.38], [0.2, -1.1], [0.18, -0.86], [0.32, -0.62]], { hatch: 2 });
      break;
    case "large":
      head();
      oval(0, -0.58, 0.7, 0.13, 0.04, { hatch: 1 });
      poly([[-0.3, -0.6], [-0.3, -0.88], [-0.12, -0.98], [0, -0.9], [0.12, -0.98], [0.3, -0.88], [0.3, -0.6]], { hatch: 1 });
      break;
    case "tricorne":
      head();
      poly([[-0.68, -0.52], [-0.42, -0.76], [-0.1, -0.84], [0, -0.94], [0.1, -0.84], [0.42, -0.76], [0.68, -0.52], [0.3, -0.5], [0, -0.58], [-0.3, -0.5]], { hatch: 2 });
      break;
    case "aureole": {
      head();
      // Auréole : un anneau à l'encre, rempli de papier clair, au-dessus de la tête.
      const [X, Y] = P(0, -0.78);
      c.strokeStyle = INK;
      c.lineWidth = s * 0.1 + lw * 2;
      c.beginPath();
      c.ellipse(X, Y, s * 0.42, s * 0.13, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "#f6e7b8";
      c.lineWidth = s * 0.1;
      c.stroke();
      break;
    }
    case "bois":
      head();
      for (const sd of [-1, 1]) {
        rod([[sd * 0.16, -0.62], [sd * 0.34, -0.86], [sd * 0.58, -1.12]], 0.06);
        rod([[sd * 0.3, -0.8], [sd * 0.16, -1.04]], 0.05);
        rod([[sd * 0.46, -0.98], [sd * 0.72, -0.98]], 0.05);
      }
      break;
    case "bulle": {
      head();
      const [X, Y] = P(0, -0.36);
      c.strokeStyle = INK;
      c.lineWidth = lw * 1.2;
      c.beginPath();
      c.arc(X, Y, s * 0.48, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(255,250,236,.85)";
      c.lineWidth = Math.max(0.8, s * 0.05);
      c.beginPath();
      c.arc(X, Y, s * 0.38, Math.PI * 1.1, Math.PI * 1.45);
      c.stroke();
      break;
    }
    case "plume":
      head();
      oval(-0.04, -0.62, 0.42, 0.13, -0.2, { hatch: 1 });
      poly([[0.16, -0.66], [0.34, -0.84], [0.5, -1.06], [0.56, -1.24], [0.44, -1.04], [0.26, -0.82]], { hatch: 0 });
      break;
    case "nu":
      head();
      // Cheveux : une calotte d'encre posée sur le crâne, mèche vers la droite.
      poly([[-0.3, -0.36], [-0.28, -0.6], [-0.1, -0.72], [0.12, -0.72], [0.28, -0.6], [0.3, -0.42], [0.16, -0.56], [-0.06, -0.58]], { fill: "#3a2614" });
      break;
  }

  // — Devant —
  switch (attr) {
    case "bouclier": {
      // Épée dressée à droite, bouclier à gauche : en amande à croix pour le heaume, rond à umbo sinon.
      rod([[0.74, 1.05], [0.76, -0.62]], 0.1, STEEL);
      rod([[0.56, 0.62], [0.96, 0.6]], 0.08);
      oval(0.75, 0.84, 0.07, 0.07);
      if (coiffe === "heaume") {
        poly([[-0.98, 0.3], [-0.36, 0.28], [-0.34, 0.8], [-0.66, 1.26], [-0.98, 0.82]], { hatch: 2, smooth: 1 });
        ink([[-0.66, 0.36], [-0.66, 1.08]], 0.07);
        ink([[-0.92, 0.6], [-0.4, 0.6]], 0.07);
      } else {
        oval(-0.66, 0.72, 0.42, 0.44, 0, { hatch: 2 });
        oval(-0.66, 0.72, 0.12, 0.12, 0, { fill: STEEL });
      }
      break;
    }
    case "dagues":
      // Deux dagues croisées sur la poitrine, pointes vers le haut.
      for (const sd of [-1, 1]) {
        rod([[sd * -0.42, 1.0], [sd * 0.22, 0.12]], 0.09, STEEL);
        rod([[sd * -0.42 - 0.12, 0.84], [sd * -0.42 + 0.12 * sd + 0.06, 0.92]], 0.06);
      }
      break;
    case "baton": {
      // Bâton tenu à gauche, qui dépasse la tête ; orbe pour les mages, nœuds et feuilles sinon.
      rod([[-0.8, 1.3], [-0.76, 0.3], [-0.72, -0.5], [-0.7, -1.0]], 0.1);
      oval(-0.74, 0.5, 0.11, 0.13);
      if (coiffe === "pointu" || coiffe === "aureole") oval(-0.7, -1.1, 0.16, 0.16, 0, { fill: "#f4e6b4" });
      else if (!small) {
        oval(-0.88, -1.0, 0.12, 0.06, -0.7);
        oval(-0.52, -1.08, 0.11, 0.055, 0.6);
      }
      break;
    }
    case "masse":
      rod([[0.62, 1.1], [0.7, -0.04]], 0.08);
      oval(0.71, -0.16, 0.17, 0.19, 0, { fill: STEEL, hatch: 1 });
      if (!small) for (const a of [-0.5, 0.6, 1.6, 2.6]) ink([[0.71 + Math.cos(a) * 0.17, -0.16 + Math.sin(a) * 0.19], [0.71 + Math.cos(a) * 0.28, -0.16 + Math.sin(a) * 0.3]], 0.05);
      break;
    case "luth":
      rod([[0.0, 0.5], [-0.58, -0.06]], 0.08);
      oval(0.3, 0.78, 0.34, 0.25, -0.62, { hatch: 2 });
      dark(0.26, 0.74, 0.07, 0.07);
      break;
    case "sabre": {
      const blade: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        blade.push([0.72 + Math.sin(t * 1.2) * 0.2, 1.0 - t * 1.6]);
      }
      rod(blade, 0.09, STEEL);
      rod([[0.56, 0.72], [0.9, 0.7]], 0.07);
      break;
    }
    case "pistolet":
      rod([[0.66, 0.92], [0.7, 0.5]], 0.12);
      rod([[0.62, 0.52], [0.98, 0.34]], 0.1, STEEL);
      break;
  }
}

/** Monstre qui se lit comme une bête (tête de loup) ; les autres gardent leur initiale. */
const BEAST = /loup|chien|molosse|hy[èe]ne|chacal|renard|ours|warg|worg|b[êe]te|fauve/i;

/** Objet qui se lit comme un coffre (médaillon à coffret) ; les autres objets portent leur initiale gravée. */
const CHEST = /coffre|malle|caisse|cassette|tr[ée]sor|chest|butin|cantine/i;

function paintMedallion(c: CanvasRenderingContext2D, t: Token, cx: number, cy: number, size: number, ratio: number | null, o: TokenLook) {
  const small = size < SMALL * (t.size ?? 1);
  const monster = t.kind === "monstre";
  const objet = t.kind === "objet";
  const pnj = t.kind === "pnj";
  const boss = monster && (t.size ?? 1) >= 2;
  // Médaillon de 0,9 case pour les héros (0,86 pour les monstres, dont griffes et cornes débordent ; 0,76 pour un objet).
  const r = size * (objet ? 0.38 : monster ? 0.43 : 0.45);
  const seed = seedOf(t.id);
  const rr = rng(seed, 3);
  const fine = !small; // grain, hachures, usure, portrait
  const lw = Math.max(1.1, r * 0.075); // trait d'encre principal
  const menace = menaceOf(t.name);
  const color = hex6(t.color);
  const down = ratio !== null && ratio <= 0;
  const unit = size / (t.size ?? 1); // une case
  const metal: Metal = monster ? "fer" : objet || pnj ? "etain" : "laiton";
  const k = c.getTransform().a; // px du calque par px écran

  // Socle de figurine : on voit sa tranche sous le médaillon, peinte à la couleur du pion comme le bord d'un socle de figurine,
  // éclairée du haut à gauche. Un mort est couché : pas de socle visible.
  if (!down && !objet) {
    const h = r * (small ? 0.14 : 0.24);
    const rs = r * (monster ? 1.0 : 1.03) + (monster ? 0 : 1.6);
    c.save();
    c.shadowColor = "rgba(6,3,1,.6)";
    c.shadowBlur = 5 * k;
    c.shadowOffsetX = 2 * k;
    c.shadowOffsetY = 3 * k;
    c.fillStyle = mixColor(color, "#120c07", 0.3);
    c.fill(circlePath(cx, cy + h, rs));
    c.restore();
    // Le bas de la tranche est dans l'ombre, le haut gauche prend la lumière.
    const side = c.createLinearGradient(cx - rs, cy, cx + rs, cy + h + rs);
    side.addColorStop(0, "rgba(255,240,210,.32)");
    side.addColorStop(0.5, "rgba(255,240,210,0)");
    side.addColorStop(1, "rgba(8,4,2,.55)");
    c.fillStyle = side;
    c.fill(circlePath(cx, cy + h, rs));
    c.strokeStyle = "rgba(10,6,3,.85)";
    c.lineWidth = Math.max(1, lw * 0.6);
    c.stroke(circlePath(cx, cy + h, rs));
  }

  // Ombre portée : décalée de (2, 3) px et floutée de 4, lumière du haut à gauche. Un mort est à plat : ombre écrasée, courte.
  c.save();
  c.shadowColor = down ? "rgba(6,3,1,.45)" : "rgba(6,3,1,.62)";
  c.shadowBlur = (down ? 2 : 4) * k;
  c.shadowOffsetX = (down ? 1 : 2) * k;
  c.shadowOffsetY = (down ? 1.5 : 3) * k;
  c.fillStyle = "#0b0705";
  c.beginPath();
  if (down) c.ellipse(cx, cy + r * 0.1, r * 1.02, r * 0.86, 0.2, 0, Math.PI * 2);
  else c.arc(cx, cy, r + (monster ? 0 : 1.6), 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Les monstres se décollent du sol même dans le noir : halo sombre.
  if (monster && !down) {
    c.strokeStyle = "rgba(6,3,2,.35)";
    c.lineWidth = 7;
    c.stroke(circlePath(cx, cy, r + 2.2));
  }

  // Un mort : le médaillon est renversé (tête en bas, de biais).
  c.save();
  if (down) {
    c.translate(cx, cy);
    c.rotate(Math.PI * (0.86 + rng(seed, 9)() * 0.16));
    c.translate(-cx, -cy);
  }

  // Griffes, cornes, côtes : derrière l'anneau, à 0,15 case du bord.
  if (monster) threats(c, menace, rng(seed, 5), cx, cy, r, unit * (small ? 0.11 : 0.15) + (boss ? r * 0.15 : 0), boss, small);

  // Gros monstres : un second cerclage de fer, plus large.
  if (boss) {
    metalRing(c, cx, cy, r * 0.98, r * 1.14, "fer", rr, fine);
    inkPolyline(c, wobblyCircle(rr, cx, cy, r * 1.14, 0.015, 48), rr, { closed: true, width: lw, wobble: r * 0.015, pressure: 0.5 });
  }

  // Trois anneaux : cerclage de métal (r0 → r), gorge (ri → r0), disque central (ri). Monstre : la gorge est un émail de sang épais ;
  // héros et PNJ : le métal domine, la gorge est un nielle sombre où la vie perdue s'inscrit en rouge.
  const peint = !!o.portrait;
  const r0 = monster ? r * (small ? 0.81 : peint ? 0.85 : 0.79) : r * (small ? 0.8 : 0.79);
  const ri = monster ? r * (small ? 0.63 : peint ? 0.74 : 0.6) : r * (small ? 0.68 : 0.71);
  c.fillStyle = INK;
  c.fill(circlePath(cx, cy, r));
  metalRing(c, cx, cy, r0, r, metal, rr, fine);

  const rimColor = monster ? mixColor("#8e1612", color, 0.18) : "#1d150e";
  const rimBand = annulusPath(cx, cy, ri, r0);
  c.fillStyle = rimColor;
  c.fill(rimBand, "evenodd");
  c.save();
  c.clip(rimBand, "evenodd");
  if (fine && monster) {
    const wr = rng(seed, 7);
    for (let i = 0; i < 5; i++) {
      const a = wr() * 6.28;
      const blob = polyPath(blobPoints(wr, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * (0.2 + wr() * 0.18), r * (0.1 + wr() * 0.08), 7, 0.35, a));
      c.fillStyle = wr() < 0.5 ? "rgba(255,244,214,.2)" : "rgba(30,12,4,.25)";
      c.fill(blob);
    }
  }
  // L'émail est creux : ombre portée par le métal en haut à gauche, éclat en bas à droite.
  const sh = c.createLinearGradient(cx - r0, cy - r0, cx + r0, cy + r0);
  sh.addColorStop(0, "rgba(10,5,2,.55)");
  sh.addColorStop(0.45, "rgba(10,5,2,0)");
  sh.addColorStop(0.85, "rgba(255,244,220,.0)");
  sh.addColorStop(1, "rgba(255,244,220,.28)");
  c.fillStyle = sh;
  c.fillRect(cx - r0, cy - r0, r0 * 2, r0 * 2);
  c.restore();

  // Vie : l'encre envahit l'émail à mesure des dégâts, depuis le haut, en tournant (rouge sombre hachuré de noir).
  if (ratio !== null && ratio < 1 && !down) {
    const lost = 1 - ratio;
    const a0 = -Math.PI / 2;
    const a1 = a0 - lost * Math.PI * 2;
    const hr = rng(seed, 12, Math.round(lost * 40));
    const sec: Pt[] = [[cx, cy]];
    const n = Math.max(3, Math.ceil(lost * 40));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      sec.push([cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2]);
    }
    c.save();
    c.clip(rimBand, "evenodd");
    c.clip(polyPath(sec));
    c.fillStyle = monster ? "rgba(30,4,3,.96)" : "#8e1612";
    c.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
    hatchLines(c, cx - r, cy - r, r * 2, r * 2, Math.PI / 4, Math.max(1.8, r * 0.12), Math.max(0.6, r * 0.05), monster ? "rgba(0,0,0,.85)" : "rgba(40,4,2,.7)", hr);
    c.restore();
  }

  // Disque central. Héros : lavis sépia soutenu, plus sombre que le métal, éclairci en haut à gauche ; le personnage s'y dessine
  // en papier clair. PNJ : lavis plus gris. Objet : parchemin. Monstres : nuit rougie ; gros monstres : papier rougi.
  const innerPts = wobblyCircle(rr, cx, cy, ri, 0.02, 28);
  const inner = polyPath(innerPts);
  const disc = boss ? "#c8a483" : monster ? mixColor(color, "#1a0806", 0.75) : objet ? "#d6c29a" : pnj ? "#5b5446" : "#5a3f25";
  c.fillStyle = disc;
  c.fill(inner);
  c.save();
  c.clip(inner);
  const dark = monster && !boss;
  if (!monster) {
    const lx = cx - ri * 0.4;
    const ly = cy - ri * 0.45;
    const gr = c.createRadialGradient(lx, ly, 0, cx, cy, ri * 1.05);
    if (objet) {
      gr.addColorStop(0, "#efe2c0");
      gr.addColorStop(0.55, disc);
      gr.addColorStop(1, "#9c8458");
    } else {
      gr.addColorStop(0, pnj ? "#837a68" : "#86603a");
      gr.addColorStop(0.5, disc);
      gr.addColorStop(1, pnj ? "#2e2a22" : "#2c1c0e");
    }
    c.fillStyle = gr;
    c.fillRect(cx - ri, cy - ri, ri * 2, ri * 2);
    // Un soupçon de la couleur du joueur dans le lavis, pour que deux héros de même classe ne se confondent pas.
    if (!pnj && !objet) {
      c.globalCompositeOperation = "soft-light";
      c.fillStyle = rgba(signatureOf(color), 0.5);
      c.fillRect(cx - ri, cy - ri, ri * 2, ri * 2);
      c.globalCompositeOperation = "source-over";
    }
  }
  for (let i = 0; i < (fine ? 70 : 14); i++) {
    const a = rr() * 6.28;
    const d = ri * Math.sqrt(rr());
    c.fillStyle = rr() < 0.6 ? (dark || !monster ? "rgba(0,0,0,.16)" : "rgba(90,62,30,.14)") : dark ? "rgba(200,120,90,.1)" : "rgba(255,240,210,.1)";
    c.beginPath();
    c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(0.35, ri * (0.01 + rr() * 0.025)), 0, Math.PI * 2);
    c.fill();
  }
  // Ce qu'on voit dans le médaillon : portrait, sinon personnage selon la classe, sinon tête de la menace, sinon lettrine.
  let lettre = false;
  // Le personnage est plus grand que le disque : les épaules passent sous le métal. Sous 40 px, la silhouette se simplifie.
  const simple = size < 40 * (t.size ?? 1);
  if (o.portrait) paintPortrait(c, o.portrait, cx, cy, ri);
  else if (t.vaisseauId) shipIcon(c, cx, cy, ri * 0.82, monster);
  else if (objet && CHEST.test(t.name)) chestIcon(c, cx, cy + ri * 0.04, ri * 0.62, lw * 0.9, rr);
  else if (objet) lettre = true;
  else if (boss) silhouette(c, menace, cx, cy + ri * 0.04, ri * 0.82, rng(seed, 15));
  else if (monster && (menace !== "bete" || BEAST.test(t.name))) silhouette(c, menace, cx, cy + ri * 0.06, ri * 0.78, rng(seed, 15), "#e6d6b0");
  else if (!monster) {
    const role = o.role ?? "";
    heroFigure(c, coiffeOf(role), role ? attributOf(role) : null, cx, cy + ri * 0.22, ri * 0.8, simple ? Math.max(1.2, lw * 0.85) : Math.max(1.2, Math.min(2, ri * 0.075)), rng(seed, 16), simple);
  } else lettre = true;
  // Vignettage interne : le bord du disque s'enfonce sous le métal (et le portrait s'y fond en sépia).
  if (!monster && fine) {
    const vg = c.createRadialGradient(cx, cy, ri * 0.55, cx, cy, ri * 1.02);
    vg.addColorStop(0, "rgba(40,22,8,0)");
    vg.addColorStop(1, o.portrait ? "rgba(60,36,14,.55)" : "rgba(14,8,3,.4)");
    c.fillStyle = vg;
    c.fillRect(cx - ri, cy - ri, ri * 2, ri * 2);
  }
  // Monstres : modelé du disque, croissant d'ombre hachuré côté bas droit (un portrait peint a déjà son modelé).
  if (monster && !o.portrait) {
    const cut = new Path2D();
    cut.rect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    cut.arc(cx - ri * 0.26, cy - ri * 0.32, ri * 1.04, 0, Math.PI * 2);
    c.clip(cut, "evenodd");
    if (fine) {
      hatchLines(c, cx - ri, cy - ri, ri * 2, ri * 2, -Math.PI / 4, Math.max(2, ri * 0.14), Math.max(0.5, ri * 0.04), dark ? "rgba(0,0,0,.6)" : "rgba(40,24,10,.5)", rr);
      hatchLines(c, cx - ri, cy - ri, ri * 2, ri * 2, Math.PI / 4, Math.max(2.6, ri * 0.2), Math.max(0.4, ri * 0.03), dark ? "rgba(0,0,0,.4)" : "rgba(40,24,10,.3)", rr);
    } else {
      c.fillStyle = dark ? "rgba(0,0,0,.35)" : "rgba(60,36,14,.28)";
      c.fillRect(cx - ri, cy - ri, ri * 2, ri * 2);
    }
  }
  c.restore();
  if (lettre) {
    if (objet) graven(c, initial(t.name), cx, cy, ri);
    else lettrine(c, initial(t.name), cx, cy, r * 0.92, monster, small);
  }

  // Traits d'encre de 1,5 px dedans et dehors du métal : bord du disque, bord de l'émail, puis le dehors du cerclage.
  inkPolyline(c, innerPts, rr, { closed: true, width: Math.max(1.2, lw * 0.75), wobble: r * 0.01, pressure: 0.45 });
  c.strokeStyle = "rgba(14,8,4,.9)";
  c.lineWidth = 1.5;
  c.stroke(circlePath(cx, cy, r0));
  const ring = wobblyCircle(rr, cx, cy, r * 0.99, 0.012, 40);
  inkPolyline(c, ring, rr, { closed: true, width: Math.max(1.5, lw * (monster ? 1.2 : 0.9)), wobble: r * 0.012, pressure: 0.4 });

  // Blessé : à moins de la moitié des PV, le cerclage se fend (deux fêlures sous le quart).
  const palier = ratio === null || down ? 0 : ratio <= 0.25 ? 3 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 1 : 0;
  if (palier >= 2) crackRing(c, cx, cy, r0, r, rng(seed, 18), palier >= 3 ? 2 : 1, lw);
  c.restore(); // fin du renversement

  // Signature du joueur : un liseré de sa couleur, fin (2 px), posé dehors contre le métal, cerné d'un fil d'encre pour qu'il
  // tienne sur un sol clair comme dans le noir.
  if (!monster && !objet) {
    const lis = small ? 2.6 : 2;
    const R = r + lis / 2 + 0.4;
    c.save();
    c.strokeStyle = down ? desaturate(color, 0.7) : color;
    c.lineWidth = lis;
    c.stroke(circlePath(cx, cy, R));
    c.strokeStyle = "rgba(12,7,3,.8)";
    c.lineWidth = 0.9;
    c.stroke(circlePath(cx, cy, R + lis / 2 + 0.3));
    c.restore();
  }

  // Numéro des monstres de même nom (« Goule 2 ») : gravé sur une plaque de fer en bas du cerclage.
  const num = /\b(\d+)\s*$/.exec(t.name)?.[1];
  if (monster && num && !small && !down) {
    const fs = Math.max(9, r * 0.5);
    const py = cy + r * 1.0;
    c.font = `bold ${fs}px Georgia, serif`;
    const tw = c.measureText(num).width + fs * 0.6;
    const plate = polyPath(smoothPoints([[cx - tw / 2, py - fs * 0.55], [cx + tw / 2, py - fs * 0.6], [cx + tw / 2 + 1, py + fs * 0.55], [cx - tw / 2 - 1, py + fs * 0.6]], 1));
    c.fillStyle = "#cfc6b4";
    c.fill(plate);
    c.strokeStyle = INK;
    c.lineWidth = Math.max(1, fs * 0.12);
    c.stroke(plate);
    c.fillStyle = "#1a0d08";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(num, cx, py + fs * 0.04);
    c.textBaseline = "alphabetic";
  }

  // Sang : taches d'encre rouge sombre, plates, sur le bord du médaillon ; deux à un quart des PV perdus, puis trois, puis quatre.
  if (palier) inkSplats(c, cx, cy, r, rng(seed, 17), palier + 1, small);

  // Mort : désaturé (il n'en reste que 30 %), assombri, barré de deux traits de plume fins et tremblés.
  if (down) {
    c.save();
    c.clip(circlePath(cx, cy, r * 1.06));
    c.globalCompositeOperation = "saturation";
    c.globalAlpha = 0.7;
    c.fillStyle = "#808080";
    c.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "rgba(150,138,122,.7)";
    c.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
    c.restore();
    const xr = rng(seed, 19);
    const kk = r * 1.02;
    for (const [a, b] of [[[-kk, -kk * 0.86], [kk * 0.92, kk]], [[kk * 0.88, -kk], [-kk, kk * 0.9]]] as const) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        pts.push([cx + a[0] + (b[0] - a[0]) * u + (xr() - 0.5) * r * 0.06, cy + a[1] + (b[1] - a[1]) * u + (xr() - 0.5) * r * 0.06]);
      }
      inkPolyline(c, pts, rng(seed, 20), { width: Math.max(1.3, r * 0.08) + 1.6, color: "rgba(236,223,194,.55)", taper: kk * 0.5, pressure: 0.6, wobble: 0.5 });
      inkPolyline(c, pts, xr, { width: Math.max(1.3, r * 0.08), color: INK, taper: kk * 0.5, pressure: 0.6, wobble: 0.5 });
    }
  }

  // États : une languette de parchemin sous le médaillon, pictos à la plume de 14 px (trois au plus, puis « +n »).
  const conds = t.conditions ?? [];
  if (conds.length && !down) condTab(c, conds, cx, cy + r + (small ? 2 : 3), small, seed);

  // « À moi » : petit fanion de laiton au-dessus du médaillon.
  if (o.mine) {
    const fy = cy - r * 1.12;
    const fw = Math.max(3.5, r * 0.24);
    const tri: Pt[] = [[cx - fw, fy - fw * 1.1], [cx + fw, fy - fw * 1.1], [cx, fy + fw * 0.35]];
    c.fillStyle = BRASS;
    c.fill(polyPath(tri));
    inkPolyline(c, tri, rr, { closed: true, width: Math.max(1, r * 0.06), wobble: 0.2 });
  }

  if (t.hidden) ghost(c, cx, cy, r, size);
}

/** Couleur du joueur ramenée vers le sépia : elle teinte le lavis sans le colorier. */
function signatureOf(color: string) {
  return mixColor(desaturate(color, 0.3), "#8a6a44", 0.35);
}

/** Initiale gravée dans le parchemin d'un objet : creux sombre décalé en haut à gauche, arête claire en bas à droite. */
function graven(c: CanvasRenderingContext2D, L: string, cx: number, cy: number, ri: number) {
  const fs = Math.max(9, ri * 1.15);
  c.font = `${fs}px ${DISPLAY}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const ty = cy + fs * 0.06;
  c.fillStyle = "rgba(255,248,226,.8)";
  c.fillText(L, cx + fs * 0.05, ty + fs * 0.05);
  c.fillStyle = "#2a1a0c";
  c.fillText(L, cx, ty);
  c.textBaseline = "alphabetic";
}

/** Coffret dessiné à l'encre : couvercle bombé, caisse, ferrures et serrure, ombre sous la caisse. */
function chestIcon(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, lw: number, r: Rng) {
  const w = s * 1.5;
  const h = s * 0.8;
  const x0 = cx - w / 2;
  const y0 = cy - h * 0.1;
  c.fillStyle = "rgba(30,18,8,.35)";
  c.beginPath();
  c.ellipse(cx + s * 0.08, y0 + h + s * 0.08, w * 0.55, s * 0.12, 0, 0, Math.PI * 2);
  c.fill();
  const body = new Path2D();
  body.rect(x0, y0, w, h);
  const lid = new Path2D();
  lid.moveTo(x0, y0);
  lid.lineTo(x0, y0 - h * 0.35);
  lid.quadraticCurveTo(cx, y0 - h * 1.05, x0 + w, y0 - h * 0.35);
  lid.lineTo(x0 + w, y0);
  lid.closePath();
  for (const [p, col] of [[body, "#8a5a2c"], [lid, "#a06a34"]] as const) {
    c.fillStyle = col;
    c.fill(p);
    c.save();
    c.clip(p);
    hatchLines(c, x0, y0 - h, w, h * 2, -Math.PI / 4, Math.max(1.6, s * 0.16), Math.max(0.4, s * 0.03), "rgba(40,20,6,.45)", r);
    c.restore();
  }
  c.strokeStyle = INK;
  c.lineWidth = lw;
  c.stroke(body);
  c.stroke(lid);
  // Ferrures : deux bandes verticales et la serrure.
  c.lineWidth = Math.max(1, s * 0.12);
  c.strokeStyle = "#2a1a0c";
  for (const fx of [0.22, 0.78]) {
    c.beginPath();
    c.moveTo(x0 + w * fx, y0 - h * 0.62);
    c.lineTo(x0 + w * fx, y0 + h);
    c.stroke();
  }
  c.fillStyle = "#d8b25a";
  c.fillRect(cx - s * 0.12, y0 - s * 0.06, s * 0.24, s * 0.28);
  c.strokeStyle = INK;
  c.lineWidth = Math.max(0.8, lw * 0.6);
  c.strokeRect(cx - s * 0.12, y0 - s * 0.06, s * 0.24, s * 0.28);
}

/** Fêlures du cerclage : un trait d'encre brisé en zigzag à travers le métal, du dehors vers la gorge, avec son arête claire. */
function crackRing(c: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, r: Rng, n: number, lw: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.15 + i * 0.75 + r() * 0.25);
    const pts: Pt[] = [];
    const steps = 4;
    for (let k = 0; k <= steps; k++) {
      const d = r1 + 0.6 - ((r1 - r0) * 1.15 * k) / steps;
      const da = (k % 2 ? 1 : -1) * (0.05 + r() * 0.05);
      pts.push([cx + Math.cos(a + da) * d, cy + Math.sin(a + da) * d]);
    }
    inkPolyline(c, pts.map(([x, y]) => [x + 0.7, y + 0.7] as Pt), r, { width: Math.max(0.7, lw * 0.45), color: "rgba(255,244,220,.6)", wobble: 0.05, taper: 1 });
    inkPolyline(c, pts, r, { width: Math.max(0.9, lw * 0.7), color: INK, wobble: 0.05, taper: (r1 - r0) * 0.4 });
  }
}

/** Taches de sang à l'encre : `n` éclaboussures plates, irrégulières, rouge sombre sans dégradé ni reflet, posées à cheval sur le
 * bord du médaillon (côté gauche et bas : la languette des états est dessous, le fanion dessus), et quelques gouttelettes. */
function inkSplats(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: Rng, n: number, small: boolean) {
  c.save();
  c.fillStyle = "#5c0d0a";
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.62 + i * 0.36 + (r() - 0.5) * 0.2);
    const d = R * (0.82 + r() * 0.2);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const s = R * (0.15 + r() * 0.1) * (small ? 1.2 : 1);
    c.fill(polyPath(smoothPoints(blobPoints(r, x, y, s * (1 + r() * 0.5), s, 9, 0.45, a), 1)));
    // Gouttelettes projetées vers le dehors.
    const drops = small ? 1 : 2 + Math.floor(r() * 2);
    for (let k = 0; k < drops; k++) {
      const dd = s * (1.4 + k * 0.9 + r() * 0.5);
      const da = (r() - 0.5) * 0.5;
      c.beginPath();
      c.arc(x + Math.cos(a + da) * dd, y + Math.sin(a + da) * dd, Math.max(0.6, s * (0.28 - k * 0.07)), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** Languette de parchemin sous le médaillon : un bout de papier déchiré, cerné d'encre, qui porte les pictos des états (14 px). */
function condTab(c: CanvasRenderingContext2D, conds: string[], cx: number, top: number, small: boolean, seed: number) {
  const shown = conds.slice(0, small ? 1 : 3);
  const extra = conds.length - shown.length;
  const icon = 14;
  const gap = 3;
  const pad = 4;
  c.font = `bold 11px Georgia, serif`;
  const extraW = extra > 0 ? c.measureText(`+${extra}`).width + 3 : 0;
  const w = shown.length * icon + (shown.length - 1) * gap + pad * 2 + extraW;
  const h = icon + 4;
  const r = rng(seed, 27);
  const x0 = cx - w / 2;
  const pts: Pt[] = [];
  // Bord du haut droit (coupé aux ciseaux), bords du bas et des côtés déchirés.
  pts.push([x0, top], [x0 + w, top + (r() - 0.5)]);
  for (let y = top + 3; y < top + h; y += 3) pts.push([x0 + w + (r() - 0.5) * 1.4, y]);
  for (let x = x0 + w; x > x0; x -= 3) pts.push([x, top + h + (r() - 0.5) * 1.8]);
  for (let y = top + h; y > top + 2; y -= 3) pts.push([x0 + (r() - 0.5) * 1.4, y]);
  const path = polyPath(pts);
  c.save();
  c.shadowColor = "rgba(6,3,1,.5)";
  c.shadowBlur = 2 * c.getTransform().a;
  c.shadowOffsetX = 1 * c.getTransform().a;
  c.shadowOffsetY = 1.5 * c.getTransform().a;
  c.fillStyle = "#eadcb8";
  c.fill(path);
  c.restore();
  c.strokeStyle = INK;
  c.lineWidth = 1;
  c.stroke(path);
  shown.forEach((name, i) => glyph(c, condGlyph(name), x0 + pad + icon / 2 + i * (icon + gap), top + h / 2 + 0.5, icon * 0.5));
  if (extra > 0) {
    c.fillStyle = INK;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(`+${extra}`, x0 + w - pad - extraW + 2, top + h / 2 + 1);
    c.textBaseline = "alphabetic";
  }
}

/** Caché aux joueurs (vu du MJ) : médaillon fantôme, cerné de pointillés. */
function ghost(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, size: number) {
  c.save();
  c.globalCompositeOperation = "destination-out";
  c.fillStyle = "rgba(0,0,0,.5)";
  c.fillRect(cx - size, cy - size, size * 2, size * 2);
  c.restore();
  c.fillStyle = INK;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    c.beginPath();
    c.arc(cx + Math.cos(a) * r * 1.16, cy + Math.sin(a) * r * 1.16, Math.max(0.8, r * 0.045), 0, Math.PI * 2);
    c.fill();
  }
}

/** Lettrine : lettre à l'encre sur papier crème, ombre portée en bas à droite, contour repassé deux fois à la plume. */
function lettrine(c: CanvasRenderingContext2D, L: string, cx: number, cy: number, r: number, monster: boolean, small: boolean, dark = false) {
  const fs = Math.max(9, r * (small ? 0.98 : 0.8));
  c.font = `${fs}px ${DISPLAY}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  const ty = cy + fs * 0.05;
  if (monster) {
    // Lettre d'os sur la nuit rouge, cernée d'encre.
    c.lineWidth = Math.max(2, fs * 0.18);
    c.strokeStyle = "rgba(8,3,2,.9)";
    c.strokeText(L, cx, ty);
    c.fillStyle = "#ecd9b4";
    c.fillText(L, cx, ty);
  } else if (dark) {
    // Héros : lettre gravée dans le parchemin sombre, ombre en bas à droite, arête ocre sous la lumière.
    c.fillStyle = "rgba(6,3,1,.8)";
    c.fillText(L, cx + fs * 0.06, ty + fs * 0.07);
    c.fillStyle = "#d9b77a";
    c.fillText(L, cx, ty);
    c.lineWidth = Math.max(0.6, fs * 0.04);
    c.strokeStyle = "rgba(20,12,6,.85)";
    c.strokeText(L, cx, ty);
  } else {
    if (!small) {
      c.fillStyle = "rgba(96,62,30,.38)";
      c.fillText(L, cx + fs * 0.07, ty + fs * 0.07);
    }
    c.fillStyle = "#1a120b";
    c.fillText(L, cx, ty);
    c.strokeStyle = "#1a120b";
    c.lineWidth = Math.max(0.5, fs * 0.035);
    c.strokeText(L, cx + 0.5, ty - 0.3);
    c.strokeText(L, cx - 0.35, ty + 0.5);
  }
  c.textBaseline = "alphabetic";
}

/** Glyphe à la plume d'un état. */
type Glyph = "goutte" | "flamme" | "crane" | "chute" | "coeur" | "oeil" | "chaine" | "peur" | "spirale";
function condGlyph(name: string): Glyph {
  const n = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/poison|venin|saign|malad/.test(n)) return "goutte";
  if (/feu|brul|enflam|ardent/.test(n)) return "flamme";
  if (/inconscient|mourant|maudit|mort|agonis/.test(n)) return "crane";
  if (/terre|renvers|couche/.test(n)) return "chute";
  if (/charm/.test(n)) return "coeur";
  if (/aveugl|invisible|cache/.test(n)) return "oeil";
  if (/entrav|agripp|empetr|lie|captur/.test(n)) return "chaine";
  if (/effray|peur|terrif|panique/.test(n)) return "peur";
  return "spirale";
}

function glyph(c: CanvasRenderingContext2D, kind: Glyph, x: number, y: number, s: number) {
  const lw = Math.max(0.9, s * 0.22);
  c.save();
  c.fillStyle = INK;
  c.strokeStyle = INK;
  c.lineWidth = lw;
  c.lineCap = "round";
  c.lineJoin = "round";
  const p = new Path2D();
  switch (kind) {
    case "goutte":
      p.moveTo(x, y - s * 0.75);
      p.quadraticCurveTo(x + s * 0.6, y - s * 0.02, x + s * 0.45, y + s * 0.3);
      p.arc(x, y + s * 0.22, s * 0.46, 0.15, Math.PI - 0.15);
      p.quadraticCurveTo(x - s * 0.6, y - s * 0.02, x, y - s * 0.75);
      c.fillStyle = "#2c4a1a";
      c.fill(p);
      break;
    case "flamme":
      p.moveTo(x + s * 0.05, y - s * 0.8);
      p.quadraticCurveTo(x + s * 0.65, y - s * 0.05, x + s * 0.38, y + s * 0.5);
      p.quadraticCurveTo(x, y + s * 0.78, x - s * 0.38, y + s * 0.5);
      p.quadraticCurveTo(x - s * 0.55, y + s * 0.05, x - s * 0.15, y - s * 0.25);
      p.quadraticCurveTo(x - s * 0.02, y - s * 0.4, x + s * 0.05, y - s * 0.8);
      c.fillStyle = "#a3361a";
      c.fill(p);
      break;
    case "crane":
      p.arc(x, y - s * 0.12, s * 0.52, 0, Math.PI * 2);
      p.rect(x - s * 0.3, y + s * 0.12, s * 0.6, s * 0.42);
      c.fill(p);
      c.fillStyle = "#fbf6ea";
      c.beginPath();
      c.arc(x - s * 0.2, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
      c.arc(x + s * 0.2, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
      c.fill();
      break;
    case "chute":
      c.beginPath();
      c.moveTo(x, y - s * 0.7);
      c.lineTo(x, y + s * 0.5);
      c.moveTo(x - s * 0.42, y + s * 0.1);
      c.lineTo(x, y + s * 0.55);
      c.lineTo(x + s * 0.42, y + s * 0.1);
      c.moveTo(x - s * 0.6, y + s * 0.72);
      c.lineTo(x + s * 0.6, y + s * 0.72);
      c.stroke();
      break;
    case "coeur":
      p.moveTo(x, y + s * 0.65);
      p.bezierCurveTo(x - s * 0.95, y - s * 0.05, x - s * 0.45, y - s * 0.85, x, y - s * 0.3);
      p.bezierCurveTo(x + s * 0.45, y - s * 0.85, x + s * 0.95, y - s * 0.05, x, y + s * 0.65);
      c.fillStyle = "#8e1f3a";
      c.fill(p);
      break;
    case "oeil":
      c.beginPath();
      c.moveTo(x - s * 0.8, y);
      c.quadraticCurveTo(x, y - s * 0.75, x + s * 0.8, y);
      c.quadraticCurveTo(x, y + s * 0.75, x - s * 0.8, y);
      c.stroke();
      c.beginPath();
      c.arc(x, y, s * 0.24, 0, Math.PI * 2);
      c.fill();
      break;
    case "chaine":
      c.beginPath();
      c.ellipse(x - s * 0.3, y + s * 0.18, s * 0.38, s * 0.24, -0.6, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(x + s * 0.3, y - s * 0.18, s * 0.38, s * 0.24, -0.6, 0, Math.PI * 2);
      c.stroke();
      break;
    case "peur":
      c.beginPath();
      c.moveTo(x - s * 0.1, y - s * 0.72);
      c.lineTo(x + s * 0.15, y - s * 0.72);
      c.lineTo(x + s * 0.06, y + s * 0.25);
      c.lineTo(x - s * 0.04, y + s * 0.25);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(x + s * 0.01, y + s * 0.55, s * 0.15, 0, Math.PI * 2);
      c.fill();
      break;
    case "spirale": {
      c.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 3.6;
        const rad = s * 0.08 + (i / 24) * s * 0.7;
        const px = x + Math.cos(a) * rad;
        const py = y + Math.sin(a) * rad;
        if (i) c.lineTo(px, py);
        else c.moveTo(px, py);
      }
      c.stroke();
      break;
    }
  }
  c.restore();
}

/** Portrait découpé en cercle, viré au sépia et posterisé (5 tons) : il rejoint l'encre et le papier de la carte. */
function paintPortrait(c: CanvasRenderingContext2D, im: HTMLImageElement, cx: number, cy: number, ri: number) {
  // Portrait peint, en couleurs : la vignette est déjà cadrée sur le buste, on la centre un peu haut.
  const k = Math.max((ri * 2) / im.naturalWidth, (ri * 2) / im.naturalHeight);
  c.drawImage(im, cx - (im.naturalWidth * k) / 2, cy - (im.naturalHeight * k) / 2.2, im.naturalWidth * k, im.naturalHeight * k);
  // Vernis : un voile chaud qui accorde les illustrations entre elles et avec le laiton du cerclage.
  c.globalCompositeOperation = "soft-light";
  c.fillStyle = "rgba(214,170,100,.35)";
  c.fillRect(cx - ri, cy - ri, ri * 2, ri * 2);
  c.globalCompositeOperation = "source-over";
}

// ——— Sélection, tour de combat, portée ———

/** Sélection : un trait de pinceau épais de la couleur du joueur, presque fermé (ouvert de 20°), début et fin décalés. */
export function drawSelection(g: CanvasRenderingContext2D, id: string, cx: number, cy: number, size: number, time: number, still = false, color = "#f0cf7a") {
  const eff = Math.max(size, MIN_TOKEN);
  const R = eff * 0.5 - Math.max(2, eff * 0.04);
  const breath = still ? 1 : 0.9 + Math.sin(time * 2.2) * 0.1;
  const s = seedOf(id);
  g.save();
  g.globalAlpha = breath;
  openCircle(g, cx, cy, R, s, { width: Math.max(3, eff * 0.085), color: rgba(hex6(color), 0.9), under: "rgba(12,7,4,.7)", gap: (20 * Math.PI) / 180, a0: -Math.PI * 0.62 + (rng(s, 2)() - 0.5) * 0.6 });
  g.restore();
}

/** Pion dont c'est le tour : un chevron d'encre au-dessus, qui monte et descend, et un lavis doré sous ses pieds. */
export function drawActiveHalo(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number, accent: string, still = false) {
  const pulse = still ? 0.5 : (Math.sin(time * 2.6) + 1) / 2;
  const grad = g.createRadialGradient(cx, cy, size * 0.25, cx, cy, size * 0.62);
  grad.addColorStop(0, rgba(accent, 0.32 + pulse * 0.08));
  grad.addColorStop(1, rgba(accent, 0));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, size * 0.62, 0, Math.PI * 2);
  g.fill();
  const W = Math.max(10, size * 0.24);
  const bob = still ? 0 : Math.sin(time * 3.1) * 1.6;
  const y = cy - size * 0.5 - W * 0.05 + bob;
  const r = rng(77, 5);
  const pts: Pt[] = [[cx - W * 0.55, y - W * 0.5], [cx, y + W * 0.08], [cx + W * 0.55, y - W * 0.5]];
  inkPolyline(g, pts, r, { width: W * 0.38, color: "rgba(12,7,4,.95)", wobble: 0.2, pressure: 0.4, taper: W * 0.3 });
  inkPolyline(g, pts, rng(77, 5), { width: W * 0.18, color: accent, wobble: 0.2, pressure: 0.4, taper: W * 0.3 });
}

/** Portée de déplacement : contour des cases atteignables et ses tirets de plume, en pixels de l'image (BASE par case). */
export interface ReachShape {
  path: Path2D;
  dashes: { pts: Pt[]; w: number; seed: number }[];
}

/** Calculé une fois par position du pion actif. */
export function reachLoops(map: GameMap, reach: Set<number>): ReachShape {
  const loops = cellContour((x, y) => reach.has(y * map.width + x), map.width, map.height, BASE, { smooth: 2, jitter: 2.5, round: 0, seed: map.seed + 9 });
  const dashes: ReachShape["dashes"] = [];
  loops.forEach((l, li) => {
    const r = rng(map.seed, 19, li);
    const pts = [...l, l[0]];
    // Tirets irréguliers : longueur de 7 à 16 px, blancs de 4 à 9 px, chacun sa pression de plume.
    let want = 7 + r() * 9;
    let gap = false;
    let cur: Pt[] = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      let [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      let d = Math.hypot(bx - ax, by - ay);
      while (acc + d >= want) {
        const t = (want - acc) / d;
        const px = ax + (bx - ax) * t;
        const py = ay + (by - ay) * t;
        if (!gap) {
          cur.push([px, py]);
          dashes.push({ pts: cur, w: 1 + r() * 2, seed: dashes.length });
        }
        cur = [[px, py]];
        gap = !gap;
        d -= Math.hypot(px - ax, py - ay);
        ax = px;
        ay = py;
        acc = 0;
        want = gap ? 4 + r() * 5 : 7 + r() * 9;
      }
      acc += d;
      if (!gap) cur.push([bx, by]);
    }
    if (!gap && cur.length > 1) dashes.push({ pts: cur, w: 1 + r() * 2, seed: dashes.length });
  });
  return { path: loopsPath(loops), dashes };
}

/** Portée de déplacement : lavis léger de la couleur de la partie, bord en tirets de plume ocre brun (1 à 3 px). */
export function drawReach(g: CanvasRenderingContext2D, shape: ReachShape, ox: number, oy: number, cell: number, accent: string, time: number, still = false) {
  const k = cell / BASE;
  g.save();
  g.translate(ox, oy);
  g.scale(k, k);
  g.fillStyle = rgba(accent, 0.1 + (still ? 0 : Math.sin(time * 2.4) * 0.025));
  g.fill(shape.path, "evenodd");
  for (const d of shape.dashes) inkPolyline(g, d.pts, rng(d.seed, 23), { width: (d.w + 1.6) / k, color: "rgba(14,9,5,.55)", wobble: 0.3, pressure: 0.35, taper: 3 / k });
  for (const d of shape.dashes) inkPolyline(g, d.pts, rng(d.seed, 23), { width: d.w / k, color: OCHRE, wobble: 0.3, pressure: 0.35, taper: 3 / k });
  g.restore();
}

// ——— Lumière ———

/** Rayon de la torche d'un héros, en cases ; dehors, de jour, rayon de la vision nette. */
const TORCH = 6;
const DAYLIGHT = 9;
const LQ = 16; // pixels par case des masques de lumière

function blocksLight(map: GameMap, x: number, y: number) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
  const t = map.tiles[y * map.width + x];
  return t === T.mur || t === T.vide;
}

/** Polygone de visibilité (en cases) depuis (cx, cy) : rayons lancés jusqu'aux murs (qu'ils mordent à peine),
 * rayon modulé de quelques % par un sinus à 7 lobes : la lumière meurt en courbe, pas en cercle de compas. */
function lightPolygon(map: GameMap, cx: number, cy: number, R: number, ph: number, N = 240): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const Ra = R * (1 + Math.sin(a * 7 + ph) * 0.04 + Math.sin(a * 3 + ph * 1.7) * 0.025);
    let d = 0;
    while (d < Ra) {
      d += 0.08;
      if (blocksLight(map, Math.floor(cx + dx * d), Math.floor(cy + dy * d))) {
        d = Math.min(Ra, d + 0.1);
        break;
      }
    }
    pts.push([cx + dx * Math.min(d, Ra), cy + dy * Math.min(d, Ra)]);
  }
  return pts;
}

/** Chute de la lumière : forte jusqu'à mi-rayon puis s'éteint en courbe (≈ racine de 1 - t), sans bord net. */
const CUT_STOPS: [number, number][] = [[0, 1], [0.25, 0.97], [0.5, 0.86], [0.68, 0.66], [0.82, 0.42], [0.92, 0.18], [1, 0]];

/** Une source fixe ou portée : centre en cases, rayon en cases. */
export interface LightSource {
  x: number;
  y: number;
  R: number;
}

interface VisMask {
  cv: HTMLCanvasElement;
  x0: number;
  y0: number;
  n: number;
}

/** Lumière de la carte : pénombre froide, torches des salles (fixes) et torches des héros (qui suivent les pions). */
export class Lighting {
  /** Torches fixes des salles (donjon, caverne), contre un mur. */
  readonly lamps: LightSource[] = [];
  private roomCut: HTMLCanvasElement | null = null;
  private roomWarm: HTMLCanvasElement | null = null;
  private masks = new Map<string, VisMask>();
  private layer = canvas(1, 1);
  private warm = canvas(1, 1);
  private tmp = canvas(1, 1);
  private hatchLayer = canvas(1, 1);
  private hatchFill: CanvasPattern | null = null;
  readonly lit: boolean;
  constructor(private map: GameMap) {
    this.lit = map.kind === "donjon" || map.kind === "caverne";
    if (this.lit && map.rooms.length) {
      const W = map.width * LQ;
      const H = map.height * LQ;
      const cut = canvas(W, H);
      const warm = canvas(W, H);
      const cc = cut.getContext("2d")!;
      const wc = warm.getContext("2d")!;
      for (const c of [cc, wc]) {
        c.scale(LQ, LQ);
        c.globalCompositeOperation = "lighter";
      }
      for (const r of map.rooms) {
        // Une torche au mur, d'un côté tiré par la graine : la salle s'éclaire d'un bord, pas en rectangle uniforme.
        const lr = rng(map.seed, r.x, r.y, 61);
        const side = Math.floor(lr() * 4);
        let x = r.x + 0.8 + lr() * Math.max(0, r.w - 1.6);
        let y = r.y + 0.8 + lr() * Math.max(0, r.h - 1.6);
        if (side === 0) y = r.y + 0.6;
        else if (side === 1) y = r.y + r.h - 0.6;
        else if (side === 2) x = r.x + 0.6;
        else x = r.x + r.w - 0.6;
        if (blocksLight(map, Math.floor(x), Math.floor(y))) {
          x = r.x + r.w / 2;
          y = r.y + r.h / 2;
          if (blocksLight(map, Math.floor(x), Math.floor(y))) continue;
        }
        const R = Math.max(3.5, Math.min(9, Math.max(r.w, r.h) * 0.85));
        this.lamps.push({ x, y, R });
        const poly = polyPath(lightPolygon(map, x, y, R, lr() * 6.28));
        cc.fillStyle = falloff(cc, x, y, R, (a) => `rgba(0,0,0,${a * 0.78})`);
        cc.fill(poly);
        wc.fillStyle = falloff(wc, x, y, R, (a) => `rgba(255,196,118,${a * 0.7})`);
        wc.fill(poly);
      }
      this.roomCut = blurred(cut, LQ * 0.45);
      this.roomWarm = blurred(warm, LQ * 0.45);
    }
  }

  /** Masque de visibilité d'une torche posée sur la case (x, y) : polygone flouté de ~0,45 case, gardé en cache. */
  private mask(x: number, y: number, R: number): VisMask {
    const k = `${x},${y},${R}`;
    let m = this.masks.get(k);
    if (!m) {
      if (this.masks.size > 300) this.masks.clear();
      const n = (Math.ceil(R) + 2) * 2;
      const x0 = x + 0.5 - n / 2;
      const y0 = y + 0.5 - n / 2;
      const raw = canvas(n * LQ, n * LQ);
      const c = raw.getContext("2d")!;
      c.scale(LQ, LQ);
      c.translate(-x0, -y0);
      c.fillStyle = "#fff";
      c.fill(polyPath(lightPolygon(this.map, x + 0.5, y + 0.5, R, ((x * 73856093) ^ (y * 19349663)) % 628 / 100)));
      m = { cv: blurred(raw, LQ * 0.45), x0, y0, n };
      this.masks.set(k, m);
    }
    return m;
  }

  /** Dessine ombre et halos. `lights` : positions (en cases, coin haut gauche de la case) des porteurs de torche. */
  draw(g: CanvasRenderingContext2D, lights: { x: number; y: number; seed: number }[], ox: number, oy: number, cell: number, w: number, h: number, time: number, still = false) {
    const map = this.map;
    const lit = this.lit;
    const R0 = lit ? TORCH : DAYLIGHT;
    // Calques à demi-résolution : la lumière est douce, ça divise le travail par quatre.
    const Q = 0.5;
    const LW = Math.ceil(w * Q);
    const LH = Math.ceil(h * Q);
    for (const cv of [this.layer, this.warm])
      if (cv.width !== LW || cv.height !== LH) {
        cv.width = LW;
        cv.height = LH;
      }
    const x0 = Math.max(0, Math.floor(ox));
    const y0 = Math.max(0, Math.floor(oy));
    const x1 = Math.min(w, Math.ceil(ox + map.width * cell));
    const y1 = Math.min(h, Math.ceil(oy + map.height * cell));
    if (x1 <= x0 || y1 <= y0) return;
    const mw = map.width * cell;
    const mh = map.height * cell;
    // Chaque flamme vacille sur un bruit à graine piloté par le temps : rayon ±3 %, centre de ±1 px.
    const flames = lights.map((l) => {
      const nz = noise2(l.seed % 100003);
      const f = still ? 1 : 1 + nz(time * 1.9, 0.5) * 0.03;
      const jx = still ? 0 : nz(time * 2.7, 7.3) / cell;
      const jy = still ? 0 : nz(time * 2.4, 13.1) / cell;
      const gx = Math.round(l.x);
      const gy = Math.round(l.y);
      return { x: l.x + 0.5 + jx, y: l.y + 0.5 + jy, f, rad: R0 * f, mask: this.mask(gx, gy, R0), heat: still ? 1 : 1 + nz(time * 3.3, 21.7) * 0.06 };
    });
    const c = this.layer.getContext("2d")!;
    const wc = this.warm.getContext("2d")!;
    c.setTransform(Q, 0, 0, Q, 0, 0);
    wc.setTransform(Q, 0, 0, Q, 0, 0);
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.clearRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    wc.clearRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    c.fillStyle = lit ? "#2f281f" : "#2e2a22";
    c.fillRect(ox, oy, mw, mh);
    c.globalCompositeOperation = "destination-out";
    c.imageSmoothingEnabled = true;
    if (this.roomCut) c.drawImage(this.roomCut, ox, oy, mw, mh);
    // Chaque torche : dégradé radial (vacillant) découpé par son masque de visibilité flouté.
    const t = this.tmp.getContext("2d")!;
    for (const fl of flames) {
      const m = fl.mask;
      const sx = ox + m.x0 * cell;
      const sy = oy + m.y0 * cell;
      const sw = m.n * cell;
      const tw = Math.max(2, Math.ceil(sw * Q));
      if (this.tmp.width < tw) this.tmp.width = this.tmp.height = tw;
      const lx = (fl.x - m.x0) * cell * Q;
      const ly = (fl.y - m.y0) * cell * Q;
      const lr = fl.rad * cell * Q;
      for (const pass of [0, 1]) {
        t.setTransform(1, 0, 0, 1, 0, 0);
        t.globalCompositeOperation = "source-over";
        t.clearRect(0, 0, tw, tw);
        const gr = t.createRadialGradient(lx, ly, 0, lx, ly, lr);
        if (pass === 0) for (const [s, a] of CUT_STOPS) gr.addColorStop(s, `rgba(0,0,0,${a})`);
        else {
          // Cœur ambré, ocre vers 4 cases, rien au bout.
          const a = (lit ? 0.95 : 0.4) * fl.heat;
          gr.addColorStop(0, `rgba(255,214,140,${Math.min(1, a)})`);
          gr.addColorStop(0.3, `rgba(255,207,122,${a * 0.85})`);
          gr.addColorStop(0.66, `rgba(196,126,52,${a * 0.42})`);
          gr.addColorStop(1, "rgba(150,80,30,0)");
        }
        t.fillStyle = gr;
        t.fillRect(0, 0, tw, tw);
        t.globalCompositeOperation = "destination-in";
        t.imageSmoothingEnabled = true;
        t.drawImage(m.cv, 0, 0, tw, tw);
        if (pass === 0) c.drawImage(this.tmp, 0, 0, tw, tw, sx, sy, sw, sw);
        else wc.drawImage(this.tmp, 0, 0, tw, tw, sx, sy, sw, sw);
      }
    }
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = lit ? 0.62 : 0.15;
    g.drawImage(this.layer, x0 * Q, y0 * Q, (x1 - x0) * Q, (y1 - y0) * Q, x0, y0, x1 - x0, y1 - y0);
    if (lit) {
      // Hachures d'ombre : leur densité suit l'ombre, nulles près de la flamme, serrées au-delà de 60 % du rayon.
      if (this.hatchLayer.width !== w || this.hatchLayer.height !== h) {
        this.hatchLayer.width = w;
        this.hatchLayer.height = h;
        this.hatchFill = null;
      }
      const hc = this.hatchLayer.getContext("2d")!;
      hc.globalCompositeOperation = "source-over";
      hc.clearRect(x0, y0, x1 - x0, y1 - y0);
      hc.imageSmoothingEnabled = true;
      hc.drawImage(this.layer, x0 * Q, y0 * Q, (x1 - x0) * Q, (y1 - y0) * Q, x0, y0, x1 - x0, y1 - y0);
      hc.globalCompositeOperation = "source-in";
      if (!this.hatchFill) this.hatchFill = hc.createPattern(shadowHatch(), "repeat");
      const ks = Math.max(0.6, cell / BASE);
      this.hatchFill!.setTransform(new DOMMatrix().translate(ox, oy).scale(ks));
      hc.fillStyle = this.hatchFill!;
      hc.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.globalAlpha = 0.32;
      g.drawImage(this.hatchLayer, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    }
    // Teinte chaude en lumière douce, plafonnée : le grain des dalles, les joints et la grille restent lisibles.
    g.globalCompositeOperation = "soft-light";
    if (this.roomWarm) {
      g.globalAlpha = 0.3;
      g.drawImage(this.roomWarm, ox, oy, mw, mh);
    }
    g.globalAlpha = lit ? 0.42 : 0.3;
    g.drawImage(this.warm, x0 * Q, y0 * Q, (x1 - x0) * Q, (y1 - y0) * Q, x0, y0, x1 - x0, y1 - y0);
    // Un éclat, à peine, au cœur de la flamme.
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 1;
    if (lit)
      for (const fl of flames) {
        const X = ox + fl.x * cell;
        const Y = oy + fl.y * cell;
        const gr = g.createRadialGradient(X, Y, 0, X, Y, cell * 1.4 * fl.f);
        gr.addColorStop(0, `rgba(255,214,150,${0.12 * fl.heat})`);
        gr.addColorStop(1, "rgba(255,214,150,0)");
        g.fillStyle = gr;
        g.fillRect(X - cell * 1.5, Y - cell * 1.5, cell * 3, cell * 3);
      }
    g.restore();
  }

  /**
   * Ombres portées à l'encre : sous chaque pion, une ellipse noire à 25 % étirée à l'opposé de la lumière
   * la plus proche (torche d'un autre héros ou torche d'une salle), plus longue quand la lumière est loin,
   * et 4 à 6 hachures dedans. Sans lumière proche (ou dehors) : soleil en haut à gauche, ombre courte.
   */
  drawShadows(g: CanvasRenderingContext2D, items: { x: number; y: number; size: number; seed: number }[], bearers: { x: number; y: number }[], ox: number, oy: number, cell: number) {
    const lights: LightSource[] = this.lit ? [...this.lamps, ...bearers.map((b) => ({ x: b.x + 0.5, y: b.y + 0.5, R: TORCH }))] : [];
    for (const it of items) {
      const cx = it.x + it.size / 2;
      const cy = it.y + it.size / 2;
      let best: LightSource | null = null;
      let bd = Infinity;
      for (const l of lights) {
        const d = Math.hypot(cx - l.x, cy - l.y);
        if (d < 0.4 * it.size || d > l.R * 1.1 || d >= bd) continue;
        best = l;
        bd = d;
      }
      let dx = 0.62;
      let dy = 0.78;
      let len = 0.3 * it.size;
      let alpha = 0.2;
      if (best) {
        dx = (cx - best.x) / bd;
        dy = (cy - best.y) / bd;
        len = it.size * (0.3 + 0.95 * Math.min(1, bd / best.R));
        alpha = 0.25;
      }
      const rad = 0.41 * it.size * cell;
      const L = len * cell;
      const X = ox + cx * cell + dx * (L * 0.5 + rad * 0.15);
      const Y = oy + cy * cell + dy * (L * 0.5 + rad * 0.15);
      const ang = Math.atan2(dy, dx);
      const rx = L * 0.5 + rad * 0.6;
      const ry = rad * 0.78;
      const p = new Path2D();
      p.ellipse(X, Y, rx, ry, ang, 0, Math.PI * 2);
      g.save();
      g.fillStyle = `rgba(10,6,4,${alpha})`;
      g.fill(p);
      g.clip(p);
      const r = rng(it.seed, 88);
      const n = 4 + Math.floor(r() * 3);
      const ha = ang + Math.PI / 3;
      const hx = Math.cos(ha);
      const hy = Math.sin(ha);
      const tx = Math.cos(ang);
      const ty = Math.sin(ang);
      for (let i = 0; i < n; i++) {
        const u = ((i + 0.5) / n - 0.5) * rx * 1.6 + rx * 0.15;
        const bx = X + tx * u;
        const by = Y + ty * u;
        const hl = ry * (1.1 + r() * 0.5);
        inkPolyline(g, [[bx - hx * hl, by - hy * hl], [bx + hx * hl, by + hy * hl]], r, { width: Math.max(0.6, cell * 0.022), color: "rgba(14,8,4,.42)", wobble: 0.25, pressure: 0.4, taper: hl * 0.5 });
      }
      g.restore();
    }
  }
}

/** Copie floutée d'un canvas (filtre du navigateur, une fois). */
function blurred(src: HTMLCanvasElement, px: number) {
  const out = canvas(src.width, src.height);
  const c = out.getContext("2d")!;
  c.filter = `blur(${px}px)`;
  c.drawImage(src, 0, 0);
  c.filter = "none";
  return out;
}

/** Décroissance quadratique (1 - t²) d'une lumière, en dégradé radial. */
function falloff(c: CanvasRenderingContext2D, x: number, y: number, R: number, color: (a: number) => string, peak = 1) {
  const gr = c.createRadialGradient(x, y, 0, x, y, R);
  for (const t of [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1]) gr.addColorStop(t, color(peak * (1 - t * t)));
  return gr;
}

/** Tuile de traits de plume interrompus (384 px), à l'angle donné : hachures d'ombre et du brouillard. */
const penTiles = new Map<string, HTMLCanvasElement>();
function penTile(deg: number, spacing: number, seed: number, alpha: [number, number] = [0.55, 0.95]) {
  const key = `${deg}:${spacing}:${seed}`;
  const hit = penTiles.get(key);
  if (hit) return hit;
  const S = 384;
  const cv = canvas(S, S);
  const c = cv.getContext("2d")!;
  const r = rng(seed, 1);
  c.lineCap = "round";
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  for (let s = -S; s < S * 2; s += spacing + r() * spacing * 0.4) {
    let t = -S;
    while (t < S * 1.5) {
      const len = 14 + r() * 40;
      c.strokeStyle = `rgba(16,10,6,${alpha[0] + r() * (alpha[1] - alpha[0])})`;
      c.lineWidth = 0.6 + r() * 0.8;
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
        const x0 = S / 2 - dy * s + dx * t + ox;
        const y0 = dx * s + dy * t + oy - S / 2;
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x0 + dx * len, y0 + dy * len);
        c.stroke();
      }
      t += len + 3 + r() * 6;
    }
  }
  penTiles.set(key, cv);
  return cv;
}
const shadowHatch = () => penTile(-38, 6, 53);

// ——— Brouillard ———

/**
 * Brouillard de lavis et d'encre, peint à chaque changement de ce qui est caché.
 * Vue d'un joueur : `deep`, l'inexploré (lavis sépia, hachures qui se croisent et se serrent à mesure qu'on s'éloigne de ce qui
 * est connu, lisière effilochée en traits de plume et volutes de fumée) ; `memory`, l'exploré hors de vue, posé en grisaille.
 * Les deux débordent la carte de FOG_PAD cases, et drawFog prolonge l'inexploré sur toute la case de BD avec les mêmes tuiles,
 * calées sur la carte : le bord de la carte ne se voit jamais. Le bord du brouillard suit un champ de distance aux cases connues,
 * mordu par un bruit à graine (deux octaves, 0,6 case) puis adouci : ni marche de case, ni encoche.
 * Vue du MJ : `memory` est un voile clair sur ce que les joueurs n'ont pas vu, `edge` son contour en pointillés d'encre.
 */
export interface FogTexture {
  deep: HTMLCanvasElement | null;
  memory: HTMLCanvasElement | null;
  gm: boolean;
  edge: HTMLCanvasElement | null;
  /** Cases de marge autour de la carte dans `deep` et `memory` (0 pour le MJ). */
  pad: number;
  /** Pixels par case des textures. */
  S: number;
  /** Temps de calcul, en ms. */
  ms: number;
}

/**
 * Contrôle de secret : cases d'inexploré (densité 255) dont les huit voisines le sont aussi (au moins une case de la lisière,
 * donc hors du fondu voulu) et où le calque `deep` laisse passer la carte (opacité < 250 en l'un des 9 points testés).
 * Doit rendre une liste vide : sinon un joueur devine du terrain qu'il n'a pas exploré. Rend les indices de case fautifs.
 */
export function fogLeaks(fog: FogTexture, density: Uint8Array, W: number, H: number, opaque = 250): number[] {
  if (!fog.deep) return [];
  const { S, pad } = fog;
  const cv = fog.deep;
  const data = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
  const deep = (x: number, y: number) => x < 0 || y < 0 || x >= W || y >= H || density[y * W + x] === 255;
  const bad: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (density[y * W + x] !== 255) continue;
      let inner = true;
      for (let dy = -1; dy <= 1 && inner; dy++) for (let dx = -1; dx <= 1; dx++) if (!deep(x + dx, y + dy)) inner = false;
      if (!inner) continue;
      let leak = false;
      for (const fy of [0.08, 0.5, 0.92])
        for (const fx of [0.08, 0.5, 0.92]) {
          const px = Math.min(cv.width - 1, Math.floor((x + pad + fx) * S));
          const py = Math.min(cv.height - 1, Math.floor((y + pad + fy) * S));
          if (data[(py * cv.width + px) * 4 + 3] < opaque) leak = true;
        }
      if (leak) bad.push(y * W + x);
    }
  return bad;
}

/** Un pion qui voit : case (coin haut gauche) et portée de vue, en cases. Sa torche réchauffe le brouillard autour de lui. */
export interface FogEye {
  x: number;
  y: number;
  vision: number;
}

/** Cases de brouillard peintes autour de la carte : au-delà, drawFog continue avec les tuiles seules. */
const FOG_PAD = 6;
/** Échantillons du champ de distance par case (le masque est ensuite étiré et lissé). */
const FQ = 8;
/** Seuil du bord dans le champ (en cases, côté brouillard) et demi-largeur du fondu. */
const FOG_EDGE = 0.15;
const FOG_SOFT = 0.2;

/** Pixels par case des textures du brouillard (marge comprise) : jusqu'à 48, moins sur les très grandes cartes. */
function fogScale(W: number, H: number) {
  return Math.max(16, Math.min(BASE, Math.floor(Math.sqrt(4.2e6 / (W * H)))));
}

/** Frontière d'un ensemble de cases (bords de carte prolongés) : coins arrondis sur une case, puis bord mordu par un bruit
 * fixé par la position (amplitude `amp` px, longueur d'onde ~ une case). Sert au voile du MJ. */
function fogLoops(map: GameMap, inside: (i: number) => boolean, S: number, seed: number, amp: number): Pt[][] {
  const W = map.width;
  const H = map.height;
  const at = (x: number, y: number) => inside(Math.max(0, Math.min(H - 1, y - 1)) * W + Math.max(0, Math.min(W - 1, x - 1)));
  return cellContour(at, W + 2, H + 2, S, { smooth: 2, round: 3 }).map((l) =>
    smoothPoints(jitterPoints(l.map(([x, y]) => [x - S, y - S] as Pt), amp, seed, 1 / (S * 0.9)), 1),
  );
}

export function buildFog(map: GameMap, density: Uint8Array, eyes: FogEye[] = []): FogTexture {
  const t0 = performance.now();
  let deep = false;
  let gm = false;
  for (const v of density) {
    if (v === 255) deep = true;
    else if (v === 150) gm = true;
  }
  const W = map.width;
  const H = map.height;
  if (gm) {
    const S = fogScale(W, H);
    const { veil, edge } = paintGmVeil(map, density, S, S / 36);
    return { deep: null, memory: veil, gm: true, edge, pad: 0, S, ms: Math.round(performance.now() - t0) };
  }
  const P = FOG_PAD;
  const PW = W + 2 * P;
  const PH = H + 2 * P;
  const S = fogScale(PW, PH);
  const k = S / 36;
  // Une poche d'inexploré de moins de 4 cases au milieu du révélé (un recoin derrière un pilier) ferait une tache noire isolée :
  // elle passe en grisaille.
  const speck = new Uint8Array(W * H);
  if (deep) {
    const seen = new Uint8Array(W * H);
    const stack: number[] = [];
    for (let s = 0; s < W * H; s++) {
      if (seen[s] || density[s] !== 255) continue;
      const comp: number[] = [];
      seen[s] = 1;
      stack.push(s);
      while (stack.length) {
        const i = stack.pop()!;
        comp.push(i);
        const x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
          if (j >= 0 && j < W * H && !seen[j] && density[j] === 255) {
            seen[j] = 1;
            stack.push(j);
          }
      }
      if (comp.length < 4) for (const i of comp) speck[i] = 1;
    }
  }
  // Grilles avec marge : hors de la carte, tout est inexploré.
  const deepGrid = new Uint8Array(PW * PH).fill(1);
  const memGrid = new Uint8Array(PW * PH).fill(1);
  let mem = false;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const j = (y + P) * PW + x + P;
      deepGrid[j] = density[i] === 255 && !speck[i] ? 1 : 0;
      memGrid[j] = density[i] > 0 ? 1 : 0;
      if (density[i] > 0 && density[i] < 255) mem = true;
    }
  const geo = { W, H, P, PW, PH, S, k, seed: map.seed };
  const deepField = fogField(geo, deepGrid, 0.6, true);
  const memory = mem ? paintMemory(geo, fogField(geo, memGrid, 0.35, true)) : null;
  const ink = paintDeep(geo, deepField, eyes);
  return { deep: ink, memory, gm: false, edge: null, pad: P, S, ms: Math.round(performance.now() - t0) };
}

interface FogGeo {
  W: number;
  H: number;
  P: number;
  PW: number;
  PH: number;
  S: number;
  k: number;
  seed: number;
}

/**
 * Champ du brouillard, FQ échantillons par case sur la grille avec marge : distance signée (en cases) au bord des cases
 * cachées, positive dedans, interpolée entre les centres des cases, plus un bruit à graine à deux octaves (amplitude `amp`).
 * Près du bord de la carte, le champ monte : le brouillard couvre toujours la limite du dessin. Une case révélée isolée devient
 * une tache ronde qui se fond avec ses voisines, pas un carré.
 */
function fogField(geo: FogGeo, hidden: Uint8Array, amp: number, border: boolean) {
  const { W, H, P, PW, PH, seed } = geo;
  const out = fogDistance(PW, PH, (i) => hidden[i] === 1);
  const inn = fogDistance(PW, PH, (i) => hidden[i] === 0);
  const fc = new Float32Array(PW * PH);
  for (let i = 0; i < PW * PH; i++) fc[i] = hidden[i] ? Math.min(out[i], 40) - 0.5 : 0.5 - Math.min(inn[i], 40);
  const FW = PW * FQ;
  const FH = PH * FQ;
  const f = new Float32Array(FW * FH);
  const n1 = noise2(seed + 611);
  const n2 = noise2(seed + 612);
  for (let v = 0; v < FH; v++) {
    const y = (v + 0.5) / FQ;
    const gy = Math.max(0, Math.min(PH - 1.001, y - 0.5));
    const iy = Math.floor(gy);
    const ty = gy - iy;
    const my = y - P;
    for (let u = 0; u < FW; u++) {
      const x = (u + 0.5) / FQ;
      const gx = Math.max(0, Math.min(PW - 1.001, x - 0.5));
      const ix = Math.floor(gx);
      const tx = gx - ix;
      const a = iy * PW + ix;
      const top = fc[a] + (fc[a + 1] - fc[a]) * tx;
      const bot = fc[a + PW] + (fc[a + PW + 1] - fc[a + PW]) * tx;
      let e = top + (bot - top) * ty;
      // Le bruit ne joue qu'autour du bord : au cœur du brouillard ou du révélé, il ne change rien.
      if (e > -2 && e < 3) e += (n1(x * 0.78, y * 0.78) * 0.68 + n2(x * 1.9 + 7.1, y * 1.9) * 0.32) * amp;
      if (border) {
        const mx = x - P;
        const m = Math.min(mx, my, W - mx, H - my);
        if (m < 1.1) e += (1.1 - m) * 0.95;
      }
      f[v * FW + u] = e;
    }
  }
  return f;
}

const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Masque (alpha) tiré du champ, à FQ px par case : `fn` donne l'opacité d'un échantillon. */
function fieldMask(geo: FogGeo, f: Float32Array, fn: (e: number) => number) {
  const FW = geo.PW * FQ;
  const FH = geo.PH * FQ;
  const cv = canvas(FW, FH);
  const c = cv.getContext("2d")!;
  const img = c.createImageData(FW, FH);
  const d = img.data;
  for (let i = 0; i < FW * FH; i++) d[i * 4 + 3] = Math.round(255 * fn(f[i]));
  c.putImageData(img, 0, 0);
  return cv;
}

/** Distance (en cases) de chaque case de `inside` à la plus proche case dehors, en chanfrein 1 / 1,41 (le bord de la grille
 * ne compte pas). */
function fogDistance(W: number, H: number, inside: (i: number) => boolean) {
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = inside(i) ? 1e6 : 0;
  const D = Math.SQRT2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 1);
        if (x > 0) v = Math.min(v, d[i - W - 1] + D);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + D);
      }
      d[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 1);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + D);
        if (x > 0) v = Math.min(v, d[i + W - 1] + D);
      }
      d[i] = v;
    }
  return d;
}

/**
 * Hachures à la main dans une tuile carrée de `T` px qui se raccorde sur ses bords : des paquets ronds qui se chevauchent
 * (croisillons là où ils se recouvrent), chacun son angle (celui de la couche ± 8°) et son pas ; chaque trait coupé en segments
 * de 30 à 120 px (× k) avec des arrêts, épaisseur de 0,6 à 1,6 px (× k) et alpha qui suivent un bruit à basse fréquence.
 * Chaque paquet est repassé aux huit tuiles voisines : les traits qui sortent d'un côté rentrent de l'autre.
 */
function tileHatch(c: CanvasRenderingContext2D, T: number, S: number, k: number, seed: number, o: { angles: number[]; step: number; alpha: [number, number]; rgb: string; packet: number }) {
  const nz = noise2(seed + 3);
  const n = Math.max(1, Math.round(T / (o.packet * S)));
  const P = T / n;
  const paths: Path2D[] = [];
  o.angles.forEach((base, li) => {
    for (let gy = 0; gy < n; gy++)
      for (let gx = 0; gx < n; gx++) {
        const r = rng(seed, gx, gy, li);
        const px = (gx + 0.5 + (r() - 0.5) * 0.7) * P + (li % 2) * P * 0.5;
        const py = (gy + 0.5 + (r() - 0.5) * 0.7) * P;
        const R = P * (0.62 + r() * 0.2);
        const a = ((base + (r() - 0.5) * 16) * Math.PI) / 180;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const step = o.step * k * (0.85 + r() * 0.35);
        for (let s = -R; s <= R; s += step * (0.8 + r() * 0.4)) {
          const half = Math.sqrt(Math.max(0, R * R - s * s));
          if (half < 4 * k) continue;
          const bx = px - dy * s;
          const by = py + dx * s;
          let t = -half * (0.85 + r() * 0.3) + r() * 12 * k;
          const end = half * (0.85 + r() * 0.3);
          while (t < end) {
            const len = Math.min(end - t, (30 + r() * 90) * k);
            const mx = bx + dx * (t + len / 2);
            const my = by + dy * (t + len / 2);
            const v = nz(mx / (S * 5), my / (S * 5));
            const wi = Math.max(0, Math.min(3, Math.floor((0.5 + 0.5 * v) * 4 + (r() - 0.5))));
            const ai = Math.max(0, Math.min(2, Math.floor((0.5 - 0.5 * nz(my / (S * 4) + 9, mx / (S * 4))) * 3 + (r() - 0.5))));
            const key = li * 12 + wi * 3 + ai;
            const p = paths[key] ?? (paths[key] = new Path2D());
            p.moveTo(bx + dx * t, by + dy * t);
            p.lineTo(bx + dx * (t + len), by + dy * (t + len));
            t += len + (3 + r() * 11) * k;
          }
        }
      }
  });
  c.lineCap = "round";
  paths.forEach((p, key) => {
    if (!p) return;
    const wi = Math.floor((key % 12) / 3);
    const ai = key % 3;
    c.lineWidth = (0.6 + wi * 0.33) * k;
    c.strokeStyle = `rgba(${o.rgb},${o.alpha[0] + ((o.alpha[1] - o.alpha[0]) * ai) / 2})`;
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        c.setTransform(1, 0, 0, 1, ox * T, oy * T);
        c.stroke(p);
      }
  });
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/** Graine fixe du brouillard : son grain et ses hachures ne dépendent ni de la carte ni de ce qu'elle cache. Hors de ce qui est
 * révélé, rien de la géométrie ne transparaît. */
const FOG_SEED = 7331;

/** Couches de hachures de l'inexploré : la première, rare, dès la lisière ; la deuxième la croise à une case ; la troisième serre
 * le tout à deux cases et demie. Chacune a sa tuile, de taille différente (en cases) : leurs répétitions ne tombent jamais ensemble. */
const DEEP_HATCH: { angles: number[]; step: number; alpha: [number, number]; packet: number; cells: number }[] = [
  { angles: [52], step: 12, alpha: [0.26, 0.55], packet: 4.6, cells: 14 },
  { angles: [-38], step: 9, alpha: [0.3, 0.6], packet: 4, cells: 17 },
  { angles: [74, 12], step: 7, alpha: [0.32, 0.66], packet: 3.4, cells: 19 },
];
/** Opacité finale de chaque couche, et du lavis d'encre du cœur : le noir vient des traits accumulés, le lavis ne fait que l'asseoir. */
const DEEP_MAX = [0.9, 1, 1];
const DEEP_WASH = 0.3;

/** Tuiles du brouillard, par taille de case : fond de lavis (11 cases), trois couches de hachures, grisaille de l'exploré (10). */
const fogTiles = new Map<number, { base: HTMLCanvasElement; hatch: HTMLCanvasElement[]; memory: HTMLCanvasElement }>();
function fogTileSet(S: number) {
  let set = fogTiles.get(S);
  if (set) return set;
  if (fogTiles.size > 2) fogTiles.clear();
  const k = S / 36;
  // Fond : lavis sépia moyen (c'est l'accumulation des hachures qui fera le noir), variations à peine sensibles, grain.
  const TB = 11 * S;
  const base = canvas(TB, TB);
  {
    const c = base.getContext("2d")!;
    c.fillStyle = "#1e150e";
    c.fillRect(0, 0, TB, TB);
    const r = rng(FOG_SEED, 340);
    const n1 = noise2(FOG_SEED + 331);
    const blobs: { p: Path2D; col: string }[] = [];
    for (let i = 0; i < 121 / 1.4; i++) {
      const x = r() * TB;
      const y = r() * TB;
      const v = n1(x / (S * 3), y / (S * 3));
      blobs.push({
        p: polyPath(blobPoints(r, x, y, S * (0.25 + r() * 0.3), S * (0.2 + r() * 0.2), 7, 0.35, r() * 6.28)),
        col: v > 0 ? `rgba(130,96,62,${0.03 + v * 0.03})` : `rgba(0,0,0,${0.03 - v * 0.03})`,
      });
    }
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        c.setTransform(1, 0, 0, 1, ox * TB, oy * TB);
        for (const b of blobs) {
          c.fillStyle = b.col;
          c.fill(b.p);
        }
      }
    c.setTransform(1, 0, 0, 1, 0, 0);
    const gr = rng(FOG_SEED, 91);
    for (let i = 0; i < (TB * TB) / (260 * k * k); i++) {
      const s = (0.6 + gr() * 1.3) * k;
      c.fillStyle = gr() < 0.5 ? "rgba(150,118,80,.12)" : "rgba(0,0,0,.2)";
      c.fillRect(gr() * (TB - s), gr() * (TB - s), s, s);
    }
  }
  const hatch = DEEP_HATCH.map((o, i) => {
    const T = o.cells * S;
    const cv = canvas(T, T);
    tileHatch(cv.getContext("2d")!, T, S, k, FOG_SEED + 801 + i * 37, { ...o, rgb: "12,8,4" });
    return cv;
  });
  const TM = 10 * S;
  const memory = canvas(TM, TM);
  {
    const c = memory.getContext("2d")!;
    c.fillStyle = "#a48f6e";
    c.fillRect(0, 0, TM, TM);
    tileHatch(c, TM, S, k, FOG_SEED + 44, { angles: [44], step: 7.5, alpha: [0.18, 0.38], rgb: "44,30,18", packet: 5 });
  }
  set = { base, hatch, memory };
  fogTiles.set(S, set);
  return set;
}

/** Motifs des tuiles, créés une fois par tuile et par contexte ; `m` les cale (identité par défaut). */
const tilePatterns = new WeakMap<CanvasRenderingContext2D, Map<HTMLCanvasElement, CanvasPattern>>();
function tilePattern(c: CanvasRenderingContext2D, tile: HTMLCanvasElement, m: DOMMatrix = new DOMMatrix()) {
  let byTile = tilePatterns.get(c);
  if (!byTile) tilePatterns.set(c, (byTile = new Map()));
  let p = byTile.get(tile);
  if (!p) {
    if (byTile.size > 12) byTile.clear();
    p = c.createPattern(tile, "repeat")!;
    byTile.set(tile, p);
  }
  p.setTransform(m);
  return p;
}

/** Calque de travail de la taille d'une texture de brouillard, réutilisé. */
let fogScratch = canvas(1, 1);
function scratch(cw: number, ch: number) {
  if (fogScratch.width !== cw || fogScratch.height !== ch) fogScratch = canvas(cw, ch);
  const c = fogScratch.getContext("2d")!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
  c.clearRect(0, 0, cw, ch);
  return c;
}

/** Grisaille de l'exploré hors de vue : la tuile, découpée par le champ (fondu d'un tiers de case, sans liseré). */
function paintMemory(geo: FogGeo, f: Float32Array) {
  const cw = geo.PW * geo.S;
  const ch = geo.PH * geo.S;
  const cv = canvas(cw, ch);
  const c = cv.getContext("2d")!;
  c.fillStyle = tilePattern(c, fogTileSet(geo.S).memory);
  c.fillRect(0, 0, cw, ch);
  c.globalCompositeOperation = "destination-in";
  c.imageSmoothingEnabled = true;
  c.drawImage(fieldMask(geo, f, (e) => smooth01(-0.2, 0.35, e)), 0, 0, cw, ch);
  c.globalCompositeOperation = "source-over";
  return cv;
}

/**
 * L'inexploré, peint comme un calque opaque qui ne doit rien à la carte : le lavis, puis les hachures selon la distance à la
 * lisière (une couche au bord, deux croisées à une case, trois à deux cases et demie, lavis d'encre au-delà), un lavis chaud
 * là où porte la torche d'un pion ; découpé par le champ ; enfin la lisière : volutes de fumée qui débordent sur le révélé,
 * traits de plume courts en travers du bord.
 */
function paintDeep(geo: FogGeo, f: Float32Array, eyes: FogEye[]) {
  const { PW, PH, P, S, k } = geo;
  const cw = PW * S;
  const ch = PH * S;
  const cv = canvas(cw, ch);
  const c = cv.getContext("2d")!;
  const tiles = fogTileSet(S);
  c.fillStyle = tilePattern(c, tiles.base);
  c.fillRect(0, 0, cw, ch);
  c.imageSmoothingEnabled = true;
  const ramps: [number, number][] = [
    [-0.25, 0.45],
    [0.7, 1.7],
    [1.6, 2.9],
  ];
  tiles.hatch.forEach((tile, i) => {
    const [a, b] = ramps[i];
    const t = scratch(cw, ch);
    t.fillStyle = tilePattern(t, tile);
    t.fillRect(0, 0, cw, ch);
    t.globalCompositeOperation = "destination-in";
    t.imageSmoothingEnabled = true;
    t.drawImage(fieldMask(geo, f, (e) => DEEP_MAX[i] * smooth01(a, b, e - FOG_EDGE)), 0, 0, cw, ch);
    c.drawImage(fogScratch, 0, 0);
  });
  {
    const t = scratch(cw, ch);
    t.fillStyle = "#0b0705";
    t.fillRect(0, 0, cw, ch);
    t.globalCompositeOperation = "destination-in";
    t.imageSmoothingEnabled = true;
    t.drawImage(fieldMask(geo, f, (e) => DEEP_WASH * smooth01(2.2, 4, e - FOG_EDGE)), 0, 0, cw, ch);
    c.drawImage(fogScratch, 0, 0);
  }
  // La torche d'un pion déborde un peu sur l'inexploré : lavis ocre, très léger, qui s'éteint à sa portée.
  c.globalCompositeOperation = "source-atop";
  for (const e of eyes) {
    const x = (e.x + 0.5 + P) * S;
    const y = (e.y + 0.5 + P) * S;
    const R = (Math.min(8, e.vision) + 1) * S;
    const gr = c.createRadialGradient(x, y, R * 0.3, x, y, R);
    gr.addColorStop(0, "rgba(168,108,44,.07)");
    gr.addColorStop(0.6, "rgba(168,108,44,.025)");
    gr.addColorStop(1, "rgba(168,108,44,0)");
    c.fillStyle = gr;
    c.fillRect(x - R, y - R, R * 2, R * 2);
  }
  c.globalCompositeOperation = "destination-in";
  c.drawImage(fieldMask(geo, f, (e) => smooth01(FOG_EDGE - FOG_SOFT, FOG_EDGE + FOG_SOFT, e)), 0, 0, cw, ch);
  c.globalCompositeOperation = "source-over";
  const edge = edgePoints(geo, f);
  c.drawImage(smoke(geo, edge), 0, 0, cw, ch);
  edgeStrokes(c, geo, edge);
  return cv;
}

/** Points du bord du brouillard (en px de texture), un tous les FQ/3 échantillons environ, avec la normale vers le révélé. */
interface EdgePt {
  x: number;
  y: number;
  nx: number;
  ny: number;
  /** Hachage stable du point (graine des tirages). */
  h: number;
}
function edgePoints(geo: FogGeo, f: Float32Array): EdgePt[] {
  const FW = geo.PW * FQ;
  const FH = geo.PH * FQ;
  const s = geo.S / FQ;
  const pts: EdgePt[] = [];
  const T = FOG_EDGE;
  for (let v = 1; v < FH - 2; v++)
    for (let u = 1; u < FW - 2; u++) {
      const i = v * FW + u;
      const a = f[i];
      const right = f[i + 1];
      const down = f[i + FW];
      let fx = -1;
      let fy = -1;
      if ((a - T) * (right - T) < 0) {
        fx = u + (T - a) / (right - a);
        fy = v;
      } else if ((a - T) * (down - T) < 0) {
        fx = u;
        fy = v + (T - a) / (down - a);
      } else continue;
      const gx = f[i + 1] - f[i - 1];
      const gy = f[i + FW] - f[i - FW];
      const gl = Math.hypot(gx, gy) || 1;
      pts.push({ x: (fx + 0.5) * s, y: (fy + 0.5) * s, nx: -gx / gl, ny: -gy / gl, h: u * 4096 + v });
    }
  return pts;
}

/** Volutes de fumée : là où un bruit le long du bord le veut, deux ou trois béziers de lavis brun (15 à 25 %) partent du brouillard
 * et s'enroulent sur le révélé, de 0,5 à 1 case ; peintes à demi-résolution puis adoucies. */
function smoke(geo: FogGeo, edge: EdgePt[]) {
  const { PW, PH, S, seed } = geo;
  const q = 0.5;
  const cv = canvas(Math.ceil(PW * S * q), Math.ceil(PH * S * q));
  const c = cv.getContext("2d")!;
  c.scale(q, q);
  const nz = noise2(seed + 77);
  for (const p of edge) {
    const r = rng(seed, p.h, 41);
    if (r() > 0.045) continue;
    if (nz(p.x / (S * 2.6), p.y / (S * 2.6)) < -0.15) continue;
    const curls = 2 + (r() < 0.4 ? 1 : 0);
    for (let j = 0; j < curls; j++) {
      const reach = S * (0.5 + r() * 0.5);
      const side = (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.6);
      const tx = -p.ny;
      const ty = p.nx;
      const x0 = p.x - p.nx * S * 0.2 + tx * (r() - 0.5) * S * 0.5;
      const y0 = p.y - p.ny * S * 0.2 + ty * (r() - 0.5) * S * 0.5;
      const pts: Pt[] = [];
      const c1: Pt = [x0 + p.nx * reach * 0.45 + tx * side * reach * 0.1, y0 + p.ny * reach * 0.45 + ty * side * reach * 0.1];
      const c2: Pt = [x0 + p.nx * reach * 0.9 + tx * side * reach * 0.55, y0 + p.ny * reach * 0.9 + ty * side * reach * 0.55];
      const e: Pt = [x0 + p.nx * reach * 0.55 + tx * side * reach * 0.85, y0 + p.ny * reach * 0.55 + ty * side * reach * 0.85];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const m = 1 - t;
        pts.push([
          m * m * m * x0 + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * e[0],
          m * m * m * y0 + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * e[1],
        ]);
      }
      const w0 = S * (0.32 + r() * 0.2);
      c.fillStyle = `rgba(46,32,20,${0.16 + r() * 0.1})`;
      ribbon(c, pts, pts.map((_, i) => w0 * (1 - (i / 12) * 0.85)), S * 0.15);
    }
  }
  return blurred(cv, Math.max(1, S * q * 0.07));
}

/** Traits de plume en travers du bord : courts (6 à 18 px × k), perpendiculaires à la lisière à ±20°, partis de l'ombre vers le
 * révélé ; longueur, épaisseur et encre tirées à la graine du point. Par endroits, une rafale de trois ; ailleurs le bord respire. */
function edgeStrokes(c: CanvasRenderingContext2D, geo: FogGeo, edge: EdgePt[]) {
  const { S, k, seed } = geo;
  const nz = noise2(seed + 13);
  c.lineCap = "round";
  for (const p of edge) {
    const r = rng(seed, p.h, 7);
    const v = nz(p.x / (S * 1.4), p.y / (S * 1.4));
    if (r() > 0.3 + v * 0.12) continue;
    const len = (6 + r() * 12) * k * (1.15 + v * 0.3);
    const lean = (r() - 0.5) * 0.7;
    const dx = p.nx - p.ny * lean;
    const dy = p.ny + p.nx * lean;
    const dl = Math.hypot(dx, dy) || 1;
    const back = len * (0.35 + r() * 0.3);
    const x0 = p.x - (dx / dl) * back;
    const y0 = p.y - (dy / dl) * back;
    const bend = (r() - 0.5) * 0.35;
    const pts: Pt[] = [
      [x0, y0],
      [x0 + (dx / dl) * len * 0.5 - (dy / dl) * len * bend * 0.3, y0 + (dy / dl) * len * 0.5 + (dx / dl) * len * bend * 0.3],
      [x0 + (dx / dl) * len - (dy / dl) * len * bend, y0 + (dy / dl) * len + (dx / dl) * len * bend],
    ];
    inkPolyline(c, pts, r, { width: (0.8 + r() * 1.1) * k, color: `rgba(12,8,4,${0.45 + r() * 0.45})`, wobble: 0.2 * k, pressure: 0.4, taper: len * 0.6 });
  }
}

/** Vue du MJ : voile qui éclaircit ce que les joueurs n'ont pas vu (posé en « screen » et en saturation par drawFog),
 * et son contour en pointillés d'encre adoucis. */
function paintGmVeil(map: GameMap, density: Uint8Array, S: number, k: number) {
  const cw = map.width * S;
  const ch = map.height * S;
  const loops = fogLoops(map, (i) => density[i] > 0, S, map.seed + 401, 6 * k);
  const q = 0.5;
  const m = canvas(Math.ceil(cw * q), Math.ceil(ch * q));
  const mc = m.getContext("2d")!;
  mc.scale(q, q);
  mc.fillStyle = "#1e1914";
  mc.fill(loopsPath(loops), "evenodd");
  const veil = blurred(m, Math.max(1.5, S * q * 0.25));
  const edge = canvas(cw, ch);
  const ec = edge.getContext("2d")!;
  loops.forEach((l, li) => {
    if (l.length < 3) return;
    const { total, at } = walker(l);
    const r = rng(map.seed, 57, li);
    for (let s = r() * 8 * k; s < total; ) {
      const len = (7 + r() * 4) * k;
      const pts: Pt[] = [];
      for (let u = 0; u <= len; u += 2 * k) pts.push(at(Math.min(total, s + u)).p);
      if (pts.length > 1) inkPolyline(ec, pts, r, { width: (1.4 + r() * 0.7) * k, color: "rgba(118,76,36,.9)", wobble: 0.2 * k, pressure: 0.4, taper: len * 0.3 });
      s += len + (5 + r() * 4) * k;
    }
  });
  return { veil, edge: blurred(edge, 0.5 * k) };
}

/** Abscisse curviligne d'une boucle fermée : points, longueurs cumulées et lecteur position/tangente. */
function walker(loop: Pt[]) {
  const pts = [...loop, loop[0]];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  let j = 0;
  const at = (s: number): { p: Pt; tx: number; ty: number } => {
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    while (j > 0 && cum[j] > s) j--;
    const a = pts[j];
    const b = pts[j + 1];
    const L = cum[j + 1] - cum[j] || 1;
    const u = (s - cum[j]) / L;
    return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], tx: (b[0] - a[0]) / L, ty: (b[1] - a[1]) / L };
  };
  return { total, at };
}

/** Le cœur de l'inexploré, peint directement à l'écran avec les tuiles (mêmes couches, à pleine opacité), calé sur la carte :
 * hors de la texture du brouillard, sur toute la case de BD. */
function fogBeyond(g: CanvasRenderingContext2D, fog: FogTexture, ox: number, oy: number, cell: number, mapW: number, mapH: number, w: number, h: number) {
  const P = fog.pad;
  const x0 = ox - P * cell;
  const y0 = oy - P * cell;
  const x1 = ox + (mapW + P) * cell;
  const y1 = oy + (mapH + P) * cell;
  if (x0 <= 0 && y0 <= 0 && x1 >= w && y1 >= h) return;
  const tiles = fogTileSet(fog.S);
  const s = cell / fog.S;
  const m = new DOMMatrix([s, 0, 0, s, x0, y0]);
  g.save();
  const clip = new Path2D();
  clip.rect(0, 0, w, h);
  // Une marge d'un pixel sous la texture : aucun fil de fond entre les deux.
  clip.rect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2);
  g.clip(clip, "evenodd");
  const layer = (tile: HTMLCanvasElement, alpha: number) => {
    g.globalAlpha = alpha;
    g.fillStyle = tilePattern(g, tile, m);
    g.fillRect(0, 0, w, h);
  };
  layer(tiles.base, 1);
  tiles.hatch.forEach((t, i) => layer(t, DEEP_MAX[i]));
  g.globalAlpha = DEEP_WASH;
  g.fillStyle = "#0b0705";
  g.fillRect(0, 0, w, h);
  g.restore();
}

/** Pose le brouillard sur la carte. Joueur : la grisaille de l'exploré, puis le lavis de l'inexploré, prolongé sur toute la vue
 * (`w`, `h`) s'ils sont donnés. MJ : ce que les joueurs n'ont pas vu, un peu désaturé et éclairci (le plan reste lisible),
 * cerné de pointillés. */
export function drawFog(g: CanvasRenderingContext2D, fog: FogTexture, ox: number, oy: number, cell: number, mapW: number, mapH: number, w = 0, h = 0) {
  const P = fog.pad;
  const x = ox - P * cell;
  const y = oy - P * cell;
  const tw = (mapW + 2 * P) * cell;
  const th = (mapH + 2 * P) * cell;
  g.save();
  g.imageSmoothingEnabled = true;
  // En réduction, le lissage « low » suffit (les traits sont déjà doux) et coûte bien moins.
  g.imageSmoothingQuality = cell >= fog.S ? "medium" : "low";
  if (fog.memory && fog.gm) {
    g.globalCompositeOperation = "saturation";
    g.globalAlpha = 0.45;
    g.drawImage(fog.memory, x, y, tw, th);
    g.globalCompositeOperation = "screen";
    g.globalAlpha = 1;
    g.drawImage(fog.memory, x, y, tw, th);
  } else if (fog.memory) {
    g.globalCompositeOperation = "saturation";
    g.globalAlpha = 0.85;
    g.drawImage(fog.memory, x, y, tw, th);
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = 1;
    g.drawImage(fog.memory, x, y, tw, th);
  }
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  if (fog.edge) g.drawImage(fog.edge, x, y, tw, th);
  if (fog.deep) g.drawImage(fog.deep, x, y, tw, th);
  g.restore();
  if (!fog.gm && fog.pad && w && h) fogBeyond(g, fog, ox, oy, cell, mapW, mapH, w, h);
}

/** Vue d'un joueur sans carte encore calculée (ou sans brouillard) : le cœur de l'inexploré sur toute la vue. */
export function drawFogBackdrop(g: CanvasRenderingContext2D, w: number, h: number) {
  const S = 36;
  const tiles = fogTileSet(S);
  g.save();
  const layer = (tile: HTMLCanvasElement, alpha: number) => {
    g.globalAlpha = alpha;
    g.fillStyle = tilePattern(g, tile);
    g.fillRect(0, 0, w, h);
  };
  layer(tiles.base, 1);
  tiles.hatch.forEach((t, i) => layer(t, DEEP_MAX[i]));
  g.globalAlpha = DEEP_WASH;
  g.fillStyle = "#0b0705";
  g.fillRect(0, 0, w, h);
  g.restore();
}

// ——— Signaux, mesure, étiquettes ———

export interface PingMark {
  id: number;
  x: number;
  y: number;
  color: string;
  name: string;
}

/** Bout de parchemin déchiré avec un texte à la plume. (x, y) : coin bas gauche, ou centre si `center`. Pastille de lavis si `dot`. */
function paperLabel(g: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, seed: number, o: { center?: boolean; dot?: string } = {}) {
  g.font = handFont(px);
  const tw = g.measureText(text).width;
  const r = rng(seed, 21);
  const lead = o.dot ? px * 0.85 : 0;
  const pw = tw + px * 1.2 + lead;
  const ph = px * 1.6;
  const tilt = (r() - 0.5) * 0.1;
  g.save();
  g.translate(o.center ? x - pw / 2 : x, o.center ? y + ph / 2 : y);
  g.rotate(tilt);
  // Bord déchiré : petites dents irrégulières, un coin arraché.
  const pts: Pt[] = [];
  const steps = Math.max(5, Math.round(pw / 5));
  const bite = Math.floor(r() * 4);
  for (let i = 0; i <= steps; i++) pts.push([(pw * i) / steps, -ph + (r() - 0.5) * 2.2 + (bite === 0 && i === steps ? px * 0.35 : 0)]);
  for (let i = steps; i >= 0; i--) pts.push([(pw * i) / steps + (r() - 0.5) * 1.6, (r() - 0.3) * 2.6 - (bite === 1 && i === 0 ? px * 0.3 : 0)]);
  const shape = polyPath(pts);
  g.save();
  g.shadowColor = "rgba(8,5,2,.5)";
  g.shadowBlur = 6;
  g.shadowOffsetX = 2;
  g.shadowOffsetY = 3;
  g.fillStyle = PAPER;
  g.fill(shape);
  g.restore();
  // Bords roussis.
  g.save();
  g.clip(shape);
  g.strokeStyle = "rgba(130,90,40,.35)";
  g.lineWidth = 4;
  g.stroke(shape);
  g.restore();
  inkPolyline(g, pts, r, { closed: true, width: 0.9, wobble: 0.3, color: "rgba(40,26,14,.8)" });
  if (o.dot) {
    g.fillStyle = o.dot;
    g.fill(polyPath(wobblyCircle(r, px * 0.72, -ph * 0.5, px * 0.27, 0.15, 12)));
  }
  g.fillStyle = "#24170d";
  g.textAlign = "left";
  g.fillText(text, px * 0.6 + lead, -ph * 0.3);
  g.restore();
}

/** Signal d'un joueur (double-clic) : trois cercles au pinceau de sa couleur qui s'élargissent sur 1,2 s, trois traits d'impact,
 * une flèche courte vers le point, son nom sur un bout de parchemin. */
export function drawPings(g: CanvasRenderingContext2D, pings: PingMark[], ox: number, oy: number, cell: number, time: number) {
  for (const p of pings) {
    const cx = ox + (p.x + 0.5) * cell;
    const cy = oy + (p.y + 0.5) * cell;
    const R = cell * 0.5;
    const col = hex6(p.color);
    const nz = noise2(p.id * 7 + 5);
    for (let i = 0; i < 3; i++) {
      const ph = (time / 1.2 + i / 3) % 1;
      const rad = R * (0.3 + ph * 0.95) * (1 + nz(time * 1.3, i * 3.1) * 0.05);
      g.save();
      g.globalAlpha = Math.pow(1 - ph, 1.2);
      openCircle(g, cx, cy, Math.max(3, rad), p.id * 13 + i, { width: Math.max(1.6, cell * 0.06) * (1 - ph * 0.5), color: col, under: "rgba(12,7,4,.6)", gap: 0.5 + i * 0.25 });
      g.restore();
    }
    // Cible fixe au centre et trois traits d'impact.
    openCircle(g, cx, cy, Math.max(3, R * 0.3), p.id * 13 + 7, { width: Math.max(1.6, cell * 0.05), color: col, under: "rgba(12,7,4,.75)", gap: 0.6 });
    const r = rng(p.id, 9);
    const a0 = r() * 6.28;
    for (let i = 0; i < 3; i++) {
      const a = a0 + (i / 3) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const pts: Pt[] = [[cx + Math.cos(a) * R * 0.48, cy + Math.sin(a) * R * 0.48], [cx + Math.cos(a) * R * (0.72 + r() * 0.15), cy + Math.sin(a) * R * (0.72 + r() * 0.15)]];
      inkPolyline(g, pts, r, { width: Math.max(2.2, cell * 0.07), color: "rgba(12,7,4,.8)", taper: 3, wobble: 0.2 });
      inkPolyline(g, pts, r, { width: Math.max(1.2, cell * 0.035), color: col, taper: 3, wobble: 0.2 });
    }
    // Flèche courte qui pique vers le point, depuis le haut à gauche.
    const fx = cx - R * 1.55;
    const fy = cy - R * 1.35;
    const tx = cx - R * 0.62;
    const ty = cy - R * 0.55;
    pointer(g, fx, fy, tx, ty, Math.max(2.2, cell * 0.07), rng(p.id, 11));
    paperLabel(g, p.name, cx + cell * 0.45, cy - cell * 0.55, 15, p.id, { dot: col });
  }
}

/** Trait d'encre noire à pointe calligraphique (deux barbes effilées, un peu courbes). */
function pointer(g: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number, w: number, r: Rng, halo = "rgba(236,223,194,.55)") {
  const L = Math.hypot(tx - fx, ty - fy);
  if (L < 2) return;
  const ux = (tx - fx) / L;
  const uy = (ty - fy) / L;
  const shaft: Pt[] = [[fx, fy], [fx + ux * L * 0.5 - uy * L * 0.04, fy + uy * L * 0.5 + ux * L * 0.04], [tx, ty]];
  inkPolyline(g, shaft, r, { width: w + 2.5, color: halo, taper: L * 0.3, wobble: 0.3 });
  inkPolyline(g, shaft, r, { width: w, color: INK, taper: L * 0.3, wobble: 0.3, pressure: 0.5 });
  const a = Math.max(7, w * 3.2);
  for (const side of [1, -1]) {
    const bx = tx - ux * a - uy * a * 0.5 * side;
    const by = ty - uy * a + ux * a * 0.5 * side;
    const barb: Pt[] = [[tx, ty], [(tx + bx) / 2 - uy * a * 0.1 * side, (ty + by) / 2 + ux * a * 0.1 * side], [bx, by]];
    ribbon(g, barb, [w * 1.5, w * 1.1, w * 0.2]);
  }
}

/**
 * Mesure pendant qu'on traîne un pion : trait d'encre noire interrompu, à pointe calligraphique, distance sur un bout de parchemin
 * posé au milieu du chemin, décalé sur le côté ; `blocked(x, y)` (px écran) dit où il ne doit pas se poser (mur, porte).
 */
export function drawMeasure(g: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number, label: string, cell: number, blocked?: (x: number, y: number) => boolean) {
  const L = Math.hypot(tx - fx, ty - fy);
  if (L < 2) return;
  const ux = (tx - fx) / L;
  const uy = (ty - fy) / L;
  const r = rng(7, Math.round(fx), Math.round(fy));
  let s = cell * 0.42;
  const end = L - cell * 0.3;
  while (s < end - cell * 0.3) {
    const len = Math.min(end - cell * 0.3 - s, cell * (0.3 + r() * 0.25));
    if (len > 2) {
      const p: Pt[] = [[fx + ux * s, fy + uy * s], [fx + ux * (s + len), fy + uy * (s + len)]];
      const w = 1.6 + r() * 1.6;
      inkPolyline(g, p, rng(7, Math.round(s)), { width: w + 2.6, color: "rgba(236,223,194,.55)", taper: 3, wobble: 0.3 });
      inkPolyline(g, p, rng(7, Math.round(s)), { width: w, color: INK, taper: len * 0.35, wobble: 0.3, pressure: 0.6 });
    }
    s += len + cell * (0.08 + r() * 0.06);
  }
  pointer(g, fx + ux * Math.max(s, end - cell * 0.6), fy + uy * Math.max(s, end - cell * 0.6), fx + ux * end, fy + uy * end, Math.max(2.4, cell * 0.07), r);
  // Étiquette au milieu, décalée perpendiculairement ; on change de côté (puis on s'éloigne) si elle couvre un mur ou une porte.
  const px = 16;
  g.font = handFont(px);
  const hw = (g.measureText(label).width + px * 1.2) / 2;
  const hh = px * 0.8;
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;
  let best: Pt = [mx - uy * cell * 0.75, my + ux * cell * 0.75];
  for (const off of [0.75, -0.75, 1.3, -1.3, 1.9, -1.9]) {
    const cx = mx - uy * cell * off;
    const cy = my + ux * cell * off;
    const probes: Pt[] = [[cx, cy], [cx - hw, cy - hh], [cx + hw, cy - hh], [cx - hw, cy + hh], [cx + hw, cy + hh]];
    if (!blocked || !probes.some(([x, y]) => blocked(x, y))) {
      best = [cx, cy];
      break;
    }
  }
  paperLabel(g, label, best[0], best[1], px, 3, { center: true });
}

/** Copies floues de la carte, posées dans les bandes vides autour d'elle (vue du MJ) : une par image et par taille de canevas. */
const ambients = new WeakMap<object, { key: string; cv: HTMLCanvasElement }>();
/**
 * Remplit toute la zone avec la carte elle-même, agrandie, floue et assombrie, au lieu d'une bande noire quand la carte ne
 * prend pas toute la hauteur (ou la largeur) : le bord de la carte se prolonge dans son ombre. À appeler avant la carte ; rend vrai si une bande a été remplie.
 */
export function drawAmbient(g: CanvasRenderingContext2D, image: HTMLCanvasElement, w: number, h: number, ox: number, oy: number, mw: number, mh: number): boolean {
  if (ox <= 2 && oy <= 2 && ox + mw >= w - 2 && oy + mh >= h - 2) return false;
  const key = `${w}x${h}`;
  let a = ambients.get(image);
  if (!a || a.key !== key) {
    // Vignette étirée puis floutée une fois (le résultat est gardé) : pas de blocs visibles.
    const q = 1 / 4;
    const cv = canvas(Math.max(8, Math.round(w * q)), Math.max(8, Math.round(h * q)));
    const c = cv.getContext("2d")!;
    c.imageSmoothingEnabled = true;
    const k = Math.max(cv.width / image.width, cv.height / image.height) * 1.15;
    const tiny = canvas(Math.max(4, Math.round(cv.width / 4)), Math.max(4, Math.round(cv.height / 4)));
    const tc = tiny.getContext("2d")!;
    tc.drawImage(image, (tiny.width - (image.width * k) / 4) / 2, (tiny.height - (image.height * k) / 4) / 2, (image.width * k) / 4, (image.height * k) / 4);
    c.filter = "blur(7px)";
    c.drawImage(tiny, -12, -12, cv.width + 24, cv.height + 24);
    c.filter = "none";
    c.fillStyle = "rgba(10,6,3,.3)";
    c.fillRect(0, 0, cv.width, cv.height);
    a = { key, cv };
    ambients.set(image, a);
  }
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(a.cv, 0, 0, w, h);
  g.restore();
  return true;
}

/** Nom des salles : lettres à la plume, détourées de papier pour rester lisibles sur l'ombre.
 * Le MJ les voit toutes ; un joueur, seulement celles qu'il a explorées (`shown`). */
export function drawRoomLabels(g: CanvasRenderingContext2D, map: GameMap, ox: number, oy: number, cell: number, shown?: Set<number>) {
  if (cell < 16) return;
  const px = Math.max(13, cell * 0.48);
  g.font = `italic ${px}px ${DISPLAY}`;
  g.textAlign = "center";
  g.lineJoin = "round";
  for (const [i, r] of map.rooms.entries()) {
    if (!r.label || (shown && !shown.has(i))) continue;
    const cx = ox + (r.x + r.w / 2) * cell;
    const cy = oy + (r.y + 0.62) * cell;
    g.lineWidth = Math.max(4, px * 0.4);
    g.strokeStyle = "rgba(244,234,208,.96)";
    g.strokeText(r.label, cx, cy);
    g.fillStyle = INK;
    g.fillText(r.label, cx, cy);
  }
}

/** Vignette : les bords de l'écran s'enfoncent à peine, comme sous une lampe ; le centre reste net. En combat, l'ombre se resserre.
 * Dehors (`warm`), le pourtour est multiplié vers un brun, à 18 %. */
export function drawVignette(g: CanvasRenderingContext2D, w: number, h: number, combat: boolean, warm = false) {
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * (combat ? 0.35 : 0.48), w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(8,5,3,0)");
  vg.addColorStop(1, combat ? "rgba(8,5,3,.66)" : warm ? "rgba(8,5,3,.14)" : "rgba(8,5,3,.26)");
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  if (!warm) return;
  g.save();
  g.globalCompositeOperation = "multiply";
  const bg = g.createRadialGradient(w * 0.45, h * 0.42, Math.min(w, h) * 0.4, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  bg.addColorStop(0, "rgba(120,82,44,0)");
  bg.addColorStop(1, "rgba(120,82,44,.18)");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.restore();
}

/** Grille repassée sur la carte, seulement sur la partie visible, en traits d'un pixel. Dehors (nature), brun foncé à 12 %
 * partout : celle du décor se perd dans l'herbe. Sur les dalles (donjon, village), en sombre multiplié à 18 %, et seulement entre
 * cases praticables : les cases se comptent sur la pierre beige, les murs restent nets. */
export function drawGrid(g: CanvasRenderingContext2D, map: GameMap, ox: number, oy: number, cell: number, w: number, h: number) {
  const kind = map.kind === "nature" ? "herbe" : map.kind === "donjon" || map.kind === "village" ? "dalles" : null;
  if (!kind || cell < 9) return;
  const mapW = map.width;
  const mapH = map.height;
  const x0 = Math.max(0, Math.floor(-ox / cell));
  const x1 = Math.min(mapW, Math.ceil((w - ox) / cell));
  const y0 = Math.max(0, Math.floor(-oy / cell));
  const y1 = Math.min(mapH, Math.ceil((h - oy) / cell));
  if (x1 <= x0 || y1 <= y0) return;
  const p = new Path2D();
  if (kind === "herbe") {
    for (let x = x0; x <= x1; x++) {
      const X = Math.round(ox + x * cell) + 0.5;
      p.moveTo(X, oy + y0 * cell);
      p.lineTo(X, oy + y1 * cell);
    }
    for (let y = y0; y <= y1; y++) {
      const Y = Math.round(oy + y * cell) + 0.5;
      p.moveTo(ox + x0 * cell, Y);
      p.lineTo(ox + x1 * cell, Y);
    }
  } else {
    const floor = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= mapW || y >= mapH) return false;
      const t = map.tiles[y * mapW + x];
      return t === T.sol || t === T.route;
    };
    // Une ligne de grille n'est tracée qu'entre deux cases de sol : par tronçons continus.
    for (let x = Math.max(1, x0); x <= Math.min(mapW - 1, x1); x++) {
      const X = Math.round(ox + x * cell) + 0.5;
      let run = -1;
      for (let y = y0; y <= y1; y++) {
        const on = y < y1 && floor(x - 1, y) && floor(x, y);
        if (on && run < 0) run = y;
        if (!on && run >= 0) {
          p.moveTo(X, oy + run * cell);
          p.lineTo(X, oy + y * cell);
          run = -1;
        }
      }
    }
    for (let y = Math.max(1, y0); y <= Math.min(mapH - 1, y1); y++) {
      const Y = Math.round(oy + y * cell) + 0.5;
      let run = -1;
      for (let x = x0; x <= x1; x++) {
        const on = x < x1 && floor(x, y - 1) && floor(x, y);
        if (on && run < 0) run = x;
        if (!on && run >= 0) {
          p.moveTo(ox + run * cell, Y);
          p.lineTo(ox + x * cell, Y);
          run = -1;
        }
      }
    }
  }
  g.save();
  if (kind === "dalles") g.globalCompositeOperation = "multiply";
  g.strokeStyle = kind === "dalles" ? "rgba(46,30,16,.18)" : "rgba(52,34,16,.12)";
  g.lineWidth = 1;
  g.stroke(p);
  g.restore();
}

/** Fond de la case autour de la carte, mis en cache par taille. `passe` (MJ) : passe-partout sombre et uniforme, à peine grainé,
 * qui ne dispute rien au dessin ; `brouillard` (joueur) : le cœur de l'inexploré, celui que drawFog prolonge. */
const backdrops = new Map<string, HTMLCanvasElement>();
export function drawBackdrop(g: CanvasRenderingContext2D, w: number, h: number, mode: "passe" | "brouillard" = "brouillard") {
  if (w < 4 || h < 4) return;
  if (mode === "brouillard") {
    drawFogBackdrop(g, w, h);
    return;
  }
  const key = `${mode}:${w}x${h}`;
  let b = backdrops.get(key);
  if (!b) {
    if (backdrops.size > 6) backdrops.clear();
    b = canvas(w, h);
    const c = b.getContext("2d")!;
    const r = rng(FOG_SEED, 17);
    c.fillStyle = "#1b140e";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 120; i++) {
      c.fillStyle = r() < 0.55 ? "rgba(0,0,0,.22)" : "rgba(170,140,100,.05)";
      c.fillRect(r() * w, r() * h, 0.8 + r(), 0.8 + r());
    }
    backdrops.set(key, b);
  }
  g.drawImage(b, 0, 0, w, h);
}

/** Gouttière de papier entre le bord de la zone de carte et le trait du cadre, puis épaisseur du trait (px écran). */
const gutterOf = (w: number) => (w < 600 ? 5 : 7);
const strokeOf = (w: number) => (w < 600 ? 3 : 3.6);
/** Marge entre le bord de la zone de carte et l'intérieur du cadre de la case (px écran). */
export function panelMargin(w: number) {
  return Math.ceil(gutterOf(w) + strokeOf(w));
}
/** Passe-partout du MJ : la carte entière laisse au moins cette marge sombre entre elle et le trait du cadre (px écran). */
export function passePartout(w: number) {
  return w < 600 ? 8 : 12;
}

/**
 * Cadre de case de BD, mis en cache par taille : gouttière couleur papier dehors (6 à 8 px), trait d'encre noir de 3 à 4 px
 * en polyligne à peine tremblée (bruit à graine de ±0,7 px, épaisseur qui respire), bouts qui débordent d'un ou deux pixels
 * dans les angles comme tirés à la règle ; dedans, un vignettage radial discret, seulement sur le pourtour.
 */
const frames = new Map<string, HTMLCanvasElement>();
export function drawPanelFrame(g: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
  if (w < 40 || h < 40) return;
  const key = `${w}x${h}@${dpr}`;
  let f = frames.get(key);
  if (!f) {
    if (frames.size > 6) frames.clear();
    f = canvas(Math.round(w * dpr), Math.round(h * dpr));
    const c = f.getContext("2d")!;
    c.scale(dpr, dpr);
    const G = gutterOf(w);
    const sw = strokeOf(w);
    const x0 = G + sw / 2;
    const y0 = G + sw / 2;
    const x1 = w - G - sw / 2;
    const y1 = h - G - sw / 2;
    const r = rng(w * 7 + h, 61);
    // Vignettage du pourtour : rien au centre, 0,22 dans les coins.
    const vx = w / 2;
    const vy = h / 2;
    const vr = Math.hypot(x1 - x0, y1 - y0) / 2;
    const vg = c.createRadialGradient(vx, vy, vr * 0.62, vx, vy, vr);
    vg.addColorStop(0, "rgba(10,6,3,0)");
    vg.addColorStop(0.7, "rgba(10,6,3,.08)");
    vg.addColorStop(1, "rgba(10,6,3,.22)");
    c.fillStyle = vg;
    c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // Gouttière : le papier de la page, un peu plus clair en haut à gauche, grain fin.
    const out = new Path2D();
    out.rect(0, 0, w, h);
    out.rect(x0, y0, x1 - x0, y1 - y0);
    c.save();
    c.clip(out, "evenodd");
    const pg = c.createLinearGradient(0, 0, w, h);
    pg.addColorStop(0, "#d9c79f");
    pg.addColorStop(1, "#bba67c");
    c.fillStyle = pg;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < (w + h) * 2.2; i++) {
      const along = r() * (w + h) * 2;
      const x = along < w ? along : along < w + h ? w - r() * G : along < w * 2 + h ? along - w - h : r() * G;
      const y = along < w ? r() * G : along < w + h ? along - w : along < w * 2 + h ? h - r() * G : along - w * 2 - h;
      c.fillStyle = r() < 0.6 ? "rgba(90,62,30,.22)" : "rgba(255,248,226,.3)";
      c.fillRect(x, y, 0.7 + r() * 0.8, 0.7 + r() * 0.8);
    }
    c.restore();
    // Trait d'encre : un ruban par côté, épaisseur qui respire (±0,4 px), tremblé de ±0,7 px ; les bouts dépassent de 1 à 3 px.
    const nz = noise2(w * 13 + h * 7);
    let along = 0;
    c.fillStyle = "#0b0705";
    const side = (ax: number, ay: number, bx: number, by: number) => {
      const L = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / L;
      const uy = (by - ay) / L;
      const o0 = 1 + r() * 2;
      const o1 = 1 + r() * 2;
      const pts: Pt[] = [];
      const ws: number[] = [];
      const n = Math.max(4, Math.round((L + o0 + o1) / 5));
      for (let i = 0; i <= n; i++) {
        const d = -o0 + ((L + o0 + o1) * i) / n;
        const wob = nz((along + d) / 60, 3.1) * 0.5 + nz((along + d) / 13, 8.4) * 0.2;
        pts.push([ax + ux * d - uy * wob, ay + uy * d + ux * wob]);
        ws.push(sw + nz((along + d) / 80, 0.7) * 0.4);
      }
      along += L;
      ribbon(c, pts, ws, 2);
    };
    side(x0, y0, x1, y0);
    side(x1, y0, x1, y1);
    side(x1, y1, x0, y1);
    side(x0, y1, x0, y0);
    frames.set(key, f);
  }
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(f, 0, 0);
  g.restore();
}

/** Case qui arrête une étiquette (mur, roche, porte), pour drawMeasure. */
export function labelBlocker(map: GameMap, ox: number, oy: number, cell: number) {
  return (sx: number, sy: number) => {
    const x = Math.floor((sx - ox) / cell);
    const y = Math.floor((sy - oy) / cell);
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
    const t = map.tiles[y * map.width + x];
    return t === T.mur || t === T.vide || t === T.porte;
  };
}

/** Densité du brouillard par case, telle que la voit ce joueur (ou le MJ). */
export function fogDensity(
  n: number,
  o: { fog: boolean[]; visible: number[] | null | undefined; dynamic: boolean; mapKnown: boolean; isGM: boolean; override?: { cells: Set<number>; hidden: boolean } | null },
): Uint8Array {
  const out = new Uint8Array(n);
  const visible = o.visible ? new Set(o.visible) : null;
  for (let i = 0; i < n; i++) {
    let hidden = o.fog[i];
    if (o.override?.cells.has(i)) hidden = o.override.hidden;
    if (o.isGM) out[i] = hidden ? 150 : 0;
    else if (o.dynamic) {
      if (visible?.has(i)) out[i] = 0;
      else if (!hidden || o.mapKnown) out[i] = 175; // déjà exploré ou plan connu : grisaille
      else out[i] = 255;
    } else out[i] = hidden ? 255 : 0;
  }
  return out;
}

/** Salles qu'un joueur a explorées : plus de la moitié de leurs cases hors du brouillard. Sans brouillard, toutes. */
export function exploredRooms(map: GameMap, fog: boolean[] | null, fogEnabled: boolean): Set<number> {
  const out = new Set<number>();
  map.rooms.forEach((r, i) => {
    if (!fogEnabled || !fog) return out.add(i);
    let seen = 0;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (!fog[y * map.width + x]) seen++;
    if (seen * 2 > r.w * r.h) out.add(i);
  });
  return out;
}

/** Vaisseau vu de dessus dans le médaillon : coque en pointe, ailes, deux tuyères allumées. Rouille pour l'ennemi. */
function shipIcon(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, ennemi: boolean) {
  const coque = ennemi ? "#c98a5a" : "#e6dcc4";
  const ombre = ennemi ? "#6b3a20" : "#7d7462";
  c.save();
  // Tuyères : lueur sous la poupe.
  for (const dx of [-0.22, 0.22]) {
    const halo = c.createRadialGradient(cx + dx * r, cy + r * 0.78, 0, cx + dx * r, cy + r * 0.78, r * 0.35);
    halo.addColorStop(0, ennemi ? "rgba(255,120,60,.95)" : "rgba(120,200,255,.95)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx + dx * r, cy + r * 0.78, r * 0.35, 0, Math.PI * 2);
    c.fill();
  }
  // Ailes
  c.fillStyle = ombre;
  c.beginPath();
  c.moveTo(cx - r * 0.16, cy - r * 0.1);
  c.lineTo(cx - r * 0.86, cy + r * 0.5);
  c.lineTo(cx - r * 0.74, cy + r * 0.66);
  c.lineTo(cx - r * 0.14, cy + r * 0.42);
  c.closePath();
  c.moveTo(cx + r * 0.16, cy - r * 0.1);
  c.lineTo(cx + r * 0.86, cy + r * 0.5);
  c.lineTo(cx + r * 0.74, cy + r * 0.66);
  c.lineTo(cx + r * 0.14, cy + r * 0.42);
  c.closePath();
  c.fill();
  // Coque
  const g = c.createLinearGradient(cx - r * 0.3, cy, cx + r * 0.3, cy);
  g.addColorStop(0, ombre);
  g.addColorStop(0.45, coque);
  g.addColorStop(1, ombre);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(cx, cy - r * 0.92);
  c.quadraticCurveTo(cx + r * 0.32, cy - r * 0.3, cx + r * 0.3, cy + r * 0.72);
  c.lineTo(cx - r * 0.3, cy + r * 0.72);
  c.quadraticCurveTo(cx - r * 0.32, cy - r * 0.3, cx, cy - r * 0.92);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(10,6,3,.8)";
  c.lineWidth = Math.max(1, r * 0.05);
  c.stroke();
  // Verrière
  c.fillStyle = ennemi ? "rgba(255,190,120,.85)" : "rgba(150,210,255,.85)";
  c.beginPath();
  c.ellipse(cx, cy - r * 0.42, r * 0.09, r * 0.17, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
