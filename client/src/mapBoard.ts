// Le plateau et la table : la carte est un plateau de jeu épais, posé sur une table en bois sous une lampe.
// La table reste fixe à l'écran ; le plateau suit la carte quand on zoome ou qu'on se déplace.
import { canvas, noise2, rng } from "./mapInk";

const DISPLAY = `"IM Fell English SC", Cinzel, Georgia, serif`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Largeur de la marge imprimée autour de la carte et épaisseur du plateau, en px écran, pour une case de `cell` px. */
export function boardSize(cell: number) {
  return { border: clamp(cell * 0.9, 18, 42), thick: clamp(cell * 0.32, 7, 14) };
}
/** Ce que le plateau ajoute à la carte, en cases, pour le cadrage : la marge des deux côtés, plus la tranche en bas. */
export const BOARD_CELLS = { x: 2.4, y: 2.9 };

const tables = new Map<string, HTMLCanvasElement>();

/** Table de noyer en planches, éclairée par une lampe au-dessus du plateau. Mise en cache par taille. */
export function drawTable(g: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
  if (w < 4 || h < 4) return;
  const key = `${w}x${h}@${dpr}`;
  let t = tables.get(key);
  if (!t) {
    if (tables.size > 6) tables.clear();
    t = canvas(Math.round(w * dpr), Math.round(h * dpr));
    const c = t.getContext("2d")!;
    c.scale(dpr, dpr);
    const r = rng(9137, 4);
    const nz = noise2(4421);
    c.fillStyle = "#24160d";
    c.fillRect(0, 0, w, h);
    // Planches horizontales de 70 à 110 px, chacune de sa teinte ; joints sombres entre elles.
    let y = -r() * 40;
    let k = 0;
    while (y < h) {
      const ph = 70 + r() * 40;
      const tint = r();
      c.fillStyle = tint < 0.33 ? "rgba(70,40,20,.35)" : tint < 0.66 ? "rgba(20,10,4,.25)" : "rgba(110,70,38,.18)";
      c.fillRect(0, y, w, ph);
      // Fil du bois : longues lignes ondulées, plus serrées au cœur de la planche.
      for (let i = 0; i < ph / 3; i++) {
        const yy = y + r() * ph;
        const amp = 1 + r() * 3;
        const fr = 0.004 + r() * 0.006;
        c.strokeStyle = r() < 0.5 ? "rgba(10,5,2,.22)" : "rgba(150,100,55,.09)";
        c.lineWidth = 0.6 + r() * 0.9;
        c.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const yv = yy + Math.sin(x * fr + i) * amp + nz(x / 90, yy / 40 + k) * 2.5;
          if (x === 0) c.moveTo(x, yv);
          else c.lineTo(x, yv);
        }
        c.stroke();
      }
      // Un nœud de temps en temps.
      if (r() < 0.5) {
        const nx = r() * w;
        const ny = y + ph * (0.3 + r() * 0.4);
        for (let j = 0; j < 5; j++) {
          c.strokeStyle = `rgba(12,6,2,${0.25 - j * 0.04})`;
          c.lineWidth = 1;
          c.beginPath();
          c.ellipse(nx, ny, 5 + j * 4, 2 + j * 1.6, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }
      y += ph;
      c.fillStyle = "rgba(4,2,1,.75)";
      c.fillRect(0, y - 1, w, 2);
      c.fillStyle = "rgba(160,110,60,.08)";
      c.fillRect(0, y + 1, w, 1);
      k++;
    }
    // La lampe : un cercle de lumière chaude au centre, la pièce dans l'ombre autour.
    const lg = c.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.hypot(w, h) * 0.62);
    lg.addColorStop(0, "rgba(255,196,120,.16)");
    lg.addColorStop(0.45, "rgba(255,170,90,.04)");
    lg.addColorStop(1, "rgba(0,0,0,.62)");
    c.fillStyle = lg;
    c.fillRect(0, 0, w, h);
    tables.set(key, t);
  }
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(t, 0, 0);
  g.restore();
}

let toile: CanvasPattern | null = null;
/** Toile de reliure sombre, en motif répété : fines hachures croisées. */
function clothPattern(g: CanvasRenderingContext2D) {
  if (toile) return toile;
  const cv = canvas(48, 48);
  const c = cv.getContext("2d")!;
  const r = rng(77, 1);
  c.fillStyle = "#5a2c1c";
  c.fillRect(0, 0, 48, 48);
  for (let i = 0; i < 48; i += 2) {
    c.fillStyle = r() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(180,130,80,.06)";
    c.fillRect(0, i, 48, 1);
    c.fillStyle = r() < 0.5 ? "rgba(0,0,0,.12)" : "rgba(180,130,80,.05)";
    c.fillRect(i, 0, 1, 48);
  }
  toile = g.createPattern(cv, "repeat");
  return toile;
}

/** Coin renforcé en laiton, deux rivets. (x, y) : le coin du plateau ; sx, sy : vers l'intérieur (+1 ou -1). */
function brassCorner(g: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, s: number) {
  g.save();
  g.translate(x, y);
  g.scale(sx, sy);
  const gr = g.createLinearGradient(0, 0, s, s);
  gr.addColorStop(0, "#f1d48a");
  gr.addColorStop(0.45, "#b8893c");
  gr.addColorStop(1, "#6e4a1c");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(s, 0);
  g.quadraticCurveTo(s * 0.42, s * 0.42, 0, s);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(40,22,6,.8)";
  g.lineWidth = 1;
  g.stroke();
  for (const [a, b] of [[s * 0.55, s * 0.16], [s * 0.16, s * 0.55]]) {
    g.fillStyle = "#3b250c";
    g.beginPath();
    g.arc(a, b, Math.max(1, s * 0.07), 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,240,200,.7)";
    g.beginPath();
    g.arc(a - s * 0.02, b - s * 0.02, Math.max(0.5, s * 0.03), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Le plateau sous la carte : ombre sur la table, tranche de carton, marge de toile, filets de laiton, coins renforcés, titre. */
export function drawBoard(g: CanvasRenderingContext2D, ox: number, oy: number, mw: number, mh: number, cell: number, title?: string) {
  const { border: b, thick: t } = boardSize(cell);
  const x = ox - b;
  const y = oy - b;
  const W = mw + b * 2;
  const H = mh + b * 2;
  // Ombre portée sur la table, la lampe est au-dessus et un peu devant.
  g.save();
  g.shadowColor = "rgba(0,0,0,.7)";
  g.shadowBlur = 26;
  g.shadowOffsetX = 5;
  g.shadowOffsetY = 12;
  g.fillStyle = "#120a05";
  g.fillRect(x, y, W, H + t);
  g.restore();
  // Tranche : carton contrecollé, deux lignes de couches plus claires.
  g.fillStyle = "#2a1a0e";
  g.fillRect(x, y + H, W, t);
  g.fillStyle = "rgba(214,180,128,.28)";
  g.fillRect(x, y + H + t * 0.35, W, 1);
  g.fillRect(x, y + H + t * 0.7, W, 1);
  g.fillStyle = "rgba(0,0,0,.5)";
  g.fillRect(x, y + H + t - 1, W, 1);
  // Face : toile de reliure, éclairée du haut.
  g.fillStyle = clothPattern(g) ?? "#5a2c1c";
  g.fillRect(x, y, W, H);
  const lit = g.createLinearGradient(0, y, 0, y + H);
  lit.addColorStop(0, "rgba(255,220,160,.08)");
  lit.addColorStop(1, "rgba(0,0,0,.18)");
  g.fillStyle = lit;
  g.fillRect(x, y, W, H);
  // Filets de laiton : un près du bord, un qui encadre la carte.
  g.strokeStyle = "rgba(216,178,90,.85)";
  g.lineWidth = Math.max(1, b * 0.06);
  g.strokeRect(x + b * 0.22, y + b * 0.22, W - b * 0.44, H - b * 0.44);
  g.lineWidth = Math.max(0.8, b * 0.035);
  g.strokeRect(ox - b * 0.18, oy - b * 0.18, mw + b * 0.36, mh + b * 0.36);
  // La carte est imprimée dans le plateau : un trait sombre la sertit.
  g.strokeStyle = "rgba(8,4,2,.9)";
  g.lineWidth = 2;
  g.strokeRect(ox - 1, oy - 1, mw + 2, mh + 2);
  // Arête supérieure du plateau, qui prend la lumière.
  g.fillStyle = "rgba(255,230,180,.18)";
  g.fillRect(x, y, W, 1);
  const s = b * 0.95;
  brassCorner(g, x, y, 1, 1, s);
  brassCorner(g, x + W, y, -1, 1, s);
  brassCorner(g, x, y + H, 1, -1, s);
  brassCorner(g, x + W, y + H, -1, -1, s);
  // Titre de la carte, doré à chaud dans la marge du bas.
  if (title && W > 260) {
    g.save();
    g.font = `${Math.round(b * 0.5)}px ${DISPLAY}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,.6)";
    g.fillText(title, ox + mw / 2 + 1, oy + mh + b * 0.55 + 1);
    g.fillStyle = "#d8b25a";
    g.fillText(title, ox + mw / 2, oy + mh + b * 0.55);
    g.restore();
  }
}
