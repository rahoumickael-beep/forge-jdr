// Planche d'essai des outils de mapInk : apercu.html?kind=encre&seed=391
// Chaque case montre un outil seul, pour juger le trait avant de s'en servir sur les cartes.
import { applyPaper, blobPoints, cellContour, cellMask, dropShadow, hatch, inkLine, inkOutline, inkPolyline, rectShape, rng, shapeOf, stipple, washFill } from "./mapInk";

export function renderInkSheet(seed: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 1500;
  cv.height = 1000;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#ece2cc";
  g.fillRect(0, 0, cv.width, cv.height);
  const r = rng(seed, 1);
  const titre = (x: number, y: number, t: string) => {
    g.fillStyle = "#3a2c1c";
    g.font = "italic 15px Georgia, serif";
    g.fillText(t, x, y);
  };

  // 1. Traits : épaisseurs et tremblements.
  titre(20, 28, "inkLine / inkPolyline");
  for (let i = 0; i < 6; i++) inkLine(g, 30, 50 + i * 22, 330, 54 + i * 20, r, { width: 0.8 + i * 0.8, wobble: 0.4 + i * 0.4 });
  const zig: [number, number][] = [];
  for (let i = 0; i < 12; i++) zig.push([30 + i * 26, 230 + (i % 2 ? -22 : 18) + r() * 8]);
  inkPolyline(g, zig, r, { width: 2.4 });

  // 2. Contour d'encre et lavis vectoriel.
  titre(380, 28, "washFill + inkOutline (forme)");
  const rocher = blobPoints(r, 480, 140, 80, 60, 10, 0.22);
  dropShadow(g, shapeOf(rocher), { dx: 7, dy: 9 });
  washFill(g, shapeOf(rocher), "#8a7b62", r);
  inkOutline(g, rocher, r, { width: 3, double: true });
  const lavis = rectShape(600, 60, 150, 170);
  washFill(g, lavis, "#5f7a6a", r, { edge: 9 });
  inkOutline(g, [[600, 60], [750, 60], [750, 230], [600, 230]], r, { width: 2.2 });

  // 3. Hachures.
  titre(800, 28, "hatch lignes / croisées / touffes");
  const h1 = rectShape(800, 50, 200, 90);
  hatch(g, h1, r);
  const h2 = rectShape(800, 150, 200, 90);
  hatch(g, h2, r, { cross: true, spacing: 4.5 });
  const h3 = shapeOf(blobPoints(r, 1180, 140, 140, 90, 12, 0.18));
  hatch(g, h3, r, { mode: "touffes" });
  inkOutline(g, blobPoints(rng(seed, 9), 1180, 140, 60, 40, 9, 0.2), r, { width: 3 });

  // 4. Pointillés.
  titre(20, 300, "stipple");
  stipple(g, shapeOf(blobPoints(r, 170, 400, 140, 80, 11, 0.2)), r, { density: 1.2 });

  // 5. Contour lissé de cases (marching sur la grille) + lavis par masque + ombre de masque.
  titre(380, 300, "cellContour + cellMask + washFill (masque) + dropShadow");
  const W = 22;
  const H = 12;
  const S = 48;
  const salle = (x: number, y: number) => {
    const dx = x - 7;
    const dy = y - 6;
    return dx * dx * 0.5 + dy * dy < 18 || (y === 6 && x > 9 && x < 19) || (x - 16) ** 2 + (y - 4) ** 2 < 7 || (x === 3 && y === 10) || (x === 4 && y === 11);
  };
  const off = document.createElement("canvas");
  off.width = W * S;
  off.height = H * S;
  const og = off.getContext("2d")!;
  const loops = cellContour(salle, W, H, S, { round: 3, jitter: 6, seed });
  const forme = shapeOf(loops);
  hatch(og, rectShape(0, 0, W * S, H * S), r, { mode: "touffes", color: "rgba(22,16,10,.8)" });
  og.save();
  og.globalCompositeOperation = "destination-out";
  og.filter = "blur(30px)";
  og.lineWidth = 140;
  og.stroke(forme.path);
  og.restore();
  og.globalCompositeOperation = "source-over";
  dropShadow(og, forme, { dx: 0, dy: 0, blur: 14, color: "rgba(10,6,3,.5)" });
  washFill(og, forme, "#c9b48c", r, { edge: 10 });
  // quadrillage discret pour voir que le contour suit les cases
  og.save();
  og.clip(forme.path, "evenodd");
  og.strokeStyle = "rgba(60,40,20,.2)";
  for (let x = 0; x <= W; x++) og.strokeRect(x * S + 0.5, -1, 0, H * S + 2);
  for (let y = 0; y <= H; y++) og.strokeRect(-1, y * S + 0.5, W * S + 2, 0);
  og.restore();
  inkOutline(og, loops, r, { width: 3.2 });
  const masque = cellMask((x, y) => x >= 16 && x <= 20 && y >= 8 && y <= 10, W, H, S);
  dropShadow(og, masque);
  washFill(og, masque, "#7a5a3a", r);
  g.drawImage(off, 380, 310, W * S * 0.5, H * S * 0.5);

  // 6. Papier sur l'ensemble.
  titre(20, 640, "paperTexture / applyPaper (sur toute la planche)");
  applyPaper(g, seed, 1.2);
  return cv;
}
