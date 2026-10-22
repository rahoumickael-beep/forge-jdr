// Rendu de la carte, version « dessinée » : matières par genre, ombres portées des murs,
// occlusion ambiante, contours à l'encre. Le fond est calculé une fois par carte ; les lumières,
// la brume et les pions sont dessinés à chaque image par MapCanvas.
import type { MapTheme } from "../../shared/genres";
import { T, type GameMap, type GenreId, type Tile } from "../../shared/types";

export const BASE = 48; // pixels par case dans l'image pré-rendue

export type Material = "pierre" | "metal" | "planches" | "terre";

export function materialFor(genre: GenreId): Material {
  if (genre === "science-fiction" || genre === "cyberpunk") return "metal";
  if (genre === "pirates" || genre === "western") return "planches";
  if (genre === "post-apo") return "terre";
  return "pierre";
}

export function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

export function shade(hex: string, amount: number, alpha = 1) {
  const [r, g, b] = rgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgba(${c(r)},${c(g)},${c(b)},${alpha})`;
}

const isSolid = (t: Tile | undefined) => t === undefined || t === T.mur || t === T.vide;
const isOpen = (t: Tile | undefined) => t !== undefined && !isSolid(t);

export function renderMapImage(map: GameMap, theme: MapTheme, material: Material): HTMLCanvasElement {
  const W = map.width;
  const H = map.height;
  const cv = document.createElement("canvas");
  cv.width = W * BASE;
  cv.height = H * BASE;
  const g = cv.getContext("2d")!;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? undefined : map.tiles[y * W + x]);
  const S = BASE;

  // 1. Fond : roche ou vide, avec hachures croisées à l'encre près des murs (style carte de donjon dessinée).
  g.fillStyle = theme.background;
  g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.vide) continue;
      let nearOpen = false;
      for (let dy = -2; dy <= 2 && !nearOpen; dy++) for (let dx = -2; dx <= 2; dx++) if (isOpen(at(x + dx, y + dy))) nearOpen = true;
      if (!nearOpen) continue;
      g.strokeStyle = shade(theme.background, 0.09, 0.9);
      g.lineWidth = 1;
      const r = hash(x, y, map.seed);
      const n = 3 + Math.floor(r * 3);
      const ang = r * Math.PI;
      for (let i = 0; i < n; i++) {
        const off = (i / n) * S;
        g.beginPath();
        g.moveTo(x * S + off + Math.cos(ang) * 4, y * S + 2);
        g.lineTo(x * S + off - Math.cos(ang) * 4 + 6, y * S + S - 2);
        g.stroke();
      }
    }

  // 2. Sols selon la matière.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = at(x, y)!;
      if (isSolid(t)) continue;
      const px = x * S;
      const py = y * S;
      const r = hash(x, y, map.seed);
      if (t === T.eau) continue; // l'eau est dessinée plus tard, par-dessus son lit
      if (t === T.vegetation) {
        g.fillStyle = shade(theme.vegetation, -0.12 + r * 0.06);
        g.fillRect(px, py, S, S);
        continue;
      }
      const base = t === T.route ? theme.road : theme.floor;
      if (material === "metal") {
        g.fillStyle = shade(base, (r - 0.5) * 0.05);
        g.fillRect(px, py, S, S);
        g.strokeStyle = shade(base, -0.18, 0.8);
        g.strokeRect(px + 1.5, py + 1.5, S - 3, S - 3);
        g.fillStyle = shade(base, 0.12, 0.8);
        for (const [rx, ry] of [[5, 5], [S - 5, 5], [5, S - 5], [S - 5, S - 5]]) {
          g.beginPath();
          g.arc(px + rx, py + ry, 1.6, 0, Math.PI * 2);
          g.fill();
        }
        if (r > 0.86) {
          g.strokeStyle = shade(base, -0.1, 0.6);
          for (let i = 6; i < S - 6; i += 4) {
            g.beginPath();
            g.moveTo(px + i, py + 8);
            g.lineTo(px + i, py + S - 8);
            g.stroke();
          }
        }
      } else if (material === "planches") {
        const vertical = (x + y) % 2 === 0 && t === T.route;
        g.fillStyle = shade(base, (r - 0.5) * 0.06);
        g.fillRect(px, py, S, S);
        g.strokeStyle = shade(base, -0.2, 0.7);
        g.lineWidth = 1;
        const planks = 3;
        for (let i = 1; i < planks; i++) {
          g.beginPath();
          if (vertical) {
            g.moveTo(px + (i * S) / planks, py);
            g.lineTo(px + (i * S) / planks, py + S);
          } else {
            g.moveTo(px, py + (i * S) / planks);
            g.lineTo(px + S, py + (i * S) / planks);
          }
          g.stroke();
        }
        // veines du bois et clous
        g.strokeStyle = shade(base, -0.08, 0.5);
        for (let i = 0; i < planks; i++) {
          const yy = py + (i + 0.5) * (S / planks) + (hash(x, i, map.seed) - 0.5) * 6;
          g.beginPath();
          g.moveTo(px + 3, yy);
          g.bezierCurveTo(px + S * 0.3, yy - 2, px + S * 0.7, yy + 2, px + S - 3, yy);
          g.stroke();
        }
      } else if (material === "terre") {
        g.fillStyle = shade(base, (r - 0.5) * 0.1);
        g.fillRect(px, py, S, S);
        for (let i = 0; i < 6; i++) {
          g.fillStyle = shade(base, hash(x * 7 + i, y, map.seed) > 0.5 ? 0.06 : -0.08, 0.7);
          g.fillRect(px + hash(i, x, map.seed) * S, py + hash(y, i, map.seed) * S, 2, 2);
        }
        if (r > 0.8) {
          g.strokeStyle = shade(base, -0.18, 0.6);
          g.beginPath();
          g.moveTo(px + r * 20, py + 8);
          g.lineTo(px + 18 + r * 10, py + 22);
          g.lineTo(px + 30, py + 34);
          g.stroke();
        }
      } else {
        // Pierre : dalles irrégulières, joints sombres, petites taches.
        g.fillStyle = shade(base, -0.16);
        g.fillRect(px, py, S, S);
        const split = r < 0.33 ? "h" : r < 0.66 ? "v" : "none";
        const slabs: [number, number, number, number][] =
          split === "h" ? [[0, 0, S, S / 2], [0, S / 2, S, S / 2]] : split === "v" ? [[0, 0, S / 2, S], [S / 2, 0, S / 2, S]] : [[0, 0, S, S]];
        slabs.forEach(([sx, sy, sw, sh], i) => {
          const v = (hash(x + i, y - i, map.seed) - 0.5) * 0.09;
          const grad = g.createLinearGradient(px + sx, py + sy, px + sx + sw, py + sy + sh);
          grad.addColorStop(0, shade(base, v + 0.03));
          grad.addColorStop(1, shade(base, v - 0.03));
          g.fillStyle = grad;
          g.beginPath();
          g.roundRect(px + sx + 1.2, py + sy + 1.2, sw - 2.4, sh - 2.4, 3);
          g.fill();
        });
        if (r > 0.7) {
          g.fillStyle = shade(base, -0.12, 0.5);
          g.beginPath();
          g.ellipse(px + r * 30 + 8, py + (1 - r) * 30 + 8, 3, 2, r * 3, 0, Math.PI * 2);
          g.fill();
        }
        if (t === T.route) {
          // pavés plus petits dans les couloirs
          g.strokeStyle = shade(base, -0.2, 0.35);
          g.beginPath();
          g.moveTo(px, py + S / 2);
          g.lineTo(px + S, py + S / 2);
          g.stroke();
        }
      }
    }

  // 3. Eau : lit sombre, dégradé de profondeur, écume au bord.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.eau) continue;
      const px = x * S;
      const py = y * S;
      let landNear = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(x + dx, y + dy) !== T.eau) landNear++;
      g.fillStyle = shade(theme.water, landNear ? 0.06 : -0.06);
      g.fillRect(px, py, S, S);
      g.strokeStyle = shade(theme.water, 0.18, 0.55);
      g.lineWidth = 1.2;
      const r = hash(x, y, map.seed);
      for (let k = 0; k < 2; k++) {
        const wy = py + 12 + k * 18 + r * 6;
        g.beginPath();
        g.moveTo(px + 6, wy);
        g.quadraticCurveTo(px + 15, wy - 4, px + 24, wy);
        g.quadraticCurveTo(px + 33, wy + 4, px + 42, wy);
        g.stroke();
      }
      // écume
      g.strokeStyle = "rgba(255,255,255,.35)";
      g.lineWidth = 2;
      if (at(x, y - 1) !== T.eau) line(g, px, py + 2, px + S, py + 2);
      if (at(x, y + 1) !== T.eau) line(g, px, py + S - 2, px + S, py + S - 2);
      if (at(x - 1, y) !== T.eau) line(g, px + 2, py, px + 2, py + S);
      if (at(x + 1, y) !== T.eau) line(g, px + S - 2, py, px + S - 2, py + S);
    }

  // 4. Occlusion ambiante : les sols s'assombrissent près des murs.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y))) continue;
      const px = x * S;
      const py = y * S;
      const edge = (dx: number, dy: number) => isSolid(at(x + dx, y + dy));
      const ao = (x0: number, y0: number, x1: number, y1: number) => {
        const grad = g.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, "rgba(0,0,0,.42)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || S, Math.abs(y1 - y0) || S);
      };
      if (edge(0, -1)) ao(px, py, px, py + S * 0.45);
      if (edge(-1, 0)) ao(px, py, px + S * 0.45, py);
      if (edge(0, 1)) ao(px, py + S, px, py + S * 0.7);
      if (edge(1, 0)) ao(px + S, py, px + S * 0.7, py);
    }

  // 5. Arbres : canopée en couches avec lumière venant du haut à gauche et ombre portée.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.vegetation) continue;
      const r = hash(x, y, map.seed);
      const cx = x * S + S / 2 + (r - 0.5) * 10;
      const cy = y * S + S / 2 + (hash(y, x, map.seed) - 0.5) * 10;
      const rad = S * (0.42 + r * 0.22);
      g.fillStyle = "rgba(0,0,0,.28)";
      g.beginPath();
      g.ellipse(cx + 6, cy + 8, rad, rad * 0.9, 0, 0, Math.PI * 2);
      g.fill();
      const grad = g.createRadialGradient(cx - rad * 0.35, cy - rad * 0.35, rad * 0.1, cx, cy, rad);
      grad.addColorStop(0, shade(theme.vegetation, 0.16));
      grad.addColorStop(0.7, shade(theme.vegetation, 0));
      grad.addColorStop(1, shade(theme.vegetation, -0.14));
      g.fillStyle = grad;
      g.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const rr = rad * (0.85 + hash(x + i, y, map.seed) * 0.25);
        const qx = cx + Math.cos(a) * rr;
        const qy = cy + Math.sin(a) * rr;
        if (i === 0) g.moveTo(qx, qy);
        else g.lineTo(qx, qy);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = shade(theme.vegetation, -0.25, 0.7);
      g.lineWidth = 1.2;
      g.stroke();
    }

  // 6. Murs : dessus en relief, ombre portée vers le bas et la droite, contour épais à l'encre.
  g.save();
  g.shadowColor = "rgba(0,0,0,.55)";
  g.shadowBlur = 10;
  g.shadowOffsetX = 4;
  g.shadowOffsetY = 6;
  g.fillStyle = theme.wall;
  g.beginPath();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === T.mur) g.rect(x * S, y * S, S, S);
  g.fill();
  g.restore();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.mur) continue;
      const px = x * S;
      const py = y * S;
      const r = hash(x, y, map.seed);
      const grad = g.createLinearGradient(px, py, px + S, py + S);
      grad.addColorStop(0, shade(theme.wall, 0.08 + (r - 0.5) * 0.04));
      grad.addColorStop(1, shade(theme.wall, -0.06 + (r - 0.5) * 0.04));
      g.fillStyle = grad;
      g.fillRect(px, py, S, S);
      // appareillage de briques ou plaques
      g.strokeStyle = shade(theme.wall, -0.16, 0.8);
      g.lineWidth = 1;
      if (material === "metal") {
        g.strokeRect(px + 3, py + 3, S - 6, S - 6);
      } else {
        const off = y % 2 ? S / 2 : 0;
        line(g, px, py + S / 2, px + S, py + S / 2);
        line(g, px + ((off + S / 2) % S), py, px + ((off + S / 2) % S), py + S / 2);
        line(g, px + off, py + S / 2, px + off, py + S);
      }
    }
  // contour à l'encre, seulement là où un mur touche un sol
  g.strokeStyle = "rgba(12,8,4,.9)";
  g.lineWidth = 3;
  g.lineCap = "round";
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y))) continue;
      const px = x * S;
      const py = y * S;
      if (isSolid(at(x, y - 1))) line(g, px, py, px + S, py);
      if (isSolid(at(x, y + 1))) line(g, px, py + S, px + S, py + S);
      if (isSolid(at(x - 1, y))) line(g, px, py, px, py + S);
      if (isSolid(at(x + 1, y))) line(g, px + S, py, px + S, py + S);
    }

  // 7. Portes : battant en bois, ferrures.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.porte) continue;
      const px = x * S;
      const py = y * S;
      const horizontal = isSolid(at(x - 1, y)) && isSolid(at(x + 1, y));
      g.save();
      g.translate(px + S / 2, py + S / 2);
      if (!horizontal) g.rotate(Math.PI / 2);
      g.fillStyle = "rgba(0,0,0,.4)";
      g.fillRect(-S / 2 + 2, -S * 0.16 + 3, S - 2, S * 0.36);
      g.fillStyle = theme.door;
      g.fillRect(-S / 2 + 1, -S * 0.17, S - 2, S * 0.34);
      g.strokeStyle = shade(theme.door, -0.25);
      g.lineWidth = 1;
      for (let i = -S / 2 + 1 + S / 4; i < S / 2; i += S / 4) line(g, i, -S * 0.17, i, S * 0.17);
      g.strokeStyle = "#1a1410";
      g.lineWidth = 2;
      g.strokeRect(-S / 2 + 1, -S * 0.17, S - 2, S * 0.34);
      g.fillStyle = "#c9a34e";
      g.beginPath();
      g.arc(S * 0.28, 0, 2.2, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

  // 8. Quadrillage discret.
  g.strokeStyle = theme.grid;
  g.lineWidth = 1;
  g.beginPath();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isOpen(at(x, y))) continue;
      g.rect(x * S + 0.5, y * S + 0.5, S, S);
    }
  g.stroke();
  return cv;
}

function line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}

/** Motif de brume (bruit doux) pour animer le brouillard de guerre. */
export function makeMistPattern(): HTMLCanvasElement {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const g = cv.getContext("2d")!;
  for (let i = 0; i < 70; i++) {
    const x = hash(i, 1, 7) * size;
    const y = hash(i, 2, 7) * size;
    const r = 20 + hash(i, 3, 7) * 60;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      // Fumée sombre : volutes presque noires, liseré à peine plus clair sur les bords.
      const light = hash(i, 4, 7) < 0.3;
      grad.addColorStop(0, light ? "rgba(70,62,72,.16)" : "rgba(0,0,0,.22)");
      grad.addColorStop(0.7, light ? "rgba(90,80,92,.07)" : "rgba(10,8,12,.10)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  return cv;
}
