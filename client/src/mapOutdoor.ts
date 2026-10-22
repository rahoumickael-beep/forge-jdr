// Cartes d'extérieur (nature, village) : herbe, chemins de terre et eau aux contours organiques.
// Les cases restent la règle du jeu ; seules les formes dessinées s'affranchissent de la grille.
import type { MapTheme } from "../../shared/genres";
import { T, type GameMap } from "../../shared/types";
import { BASE, hash, shade } from "./mapUtil";

const S = BASE;

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
