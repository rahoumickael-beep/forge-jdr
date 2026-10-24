// Rendu des cartes de navires des Îles du Vent : la pleine mer (îlots, hauts-fonds, sargasses, une épave) et les deux
// ponts bord à bord de l'abordage (lisses, mâts, écoutilles, planches et grappins). Couleurs tirées du thème du genre ;
// même graine, même mer. Le geste reste celui d'une carte dessinée : vaguelettes à la main, grain par case.
import { T } from "../../shared/types";
import type { MapCtx } from "./mapCommon";
import { hash, shade } from "./mapUtil";

/** La mer : un fond un peu plus clair au centre, puis des vaguelettes, chacune tirée par sa case. */
function peindreLaMer(c: MapCtx, saute: (x: number, y: number) => boolean) {
  const { theme, g, cv, W, H, S, map } = c;
  const seed = map.seed;
  const fond = g.createRadialGradient(cv.width * 0.5, cv.height * 0.45, 0, cv.width * 0.5, cv.height * 0.5, Math.max(cv.width, cv.height) * 0.8);
  fond.addColorStop(0, shade(theme.water, -0.02));
  fond.addColorStop(1, shade(theme.water, -0.24));
  g.fillStyle = fond;
  g.fillRect(0, 0, cv.width, cv.height);
  g.lineCap = "round";
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (saute(x, y)) continue;
      const n = hash(x, y, seed + 3) > 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        if (hash(x + k * 7, y, seed + 4) < 0.35) continue;
        const px = (x + 0.15 + hash(x, y + k, seed + 5) * 0.7) * S;
        const py = (y + 0.2 + hash(x + k, y, seed + 6) * 0.6) * S;
        const l = S * (0.22 + hash(x, y, seed + 7 + k) * 0.18);
        g.strokeStyle = `rgba(235,245,250,${0.1 + hash(x, y, seed + 8 + k) * 0.12})`;
        g.lineWidth = 1.1 + hash(x, y, seed + 9) * 0.8;
        g.beginPath();
        g.moveTo(px - l, py);
        g.quadraticCurveTo(px - l / 2, py - l * 0.45, px, py);
        g.quadraticCurveTo(px + l / 2, py + l * 0.45, px + l, py);
        g.stroke();
      }
    }
}

export function renderMer(c: MapCtx): HTMLCanvasElement {
  const { map, theme, g, cv, W, H, S, at } = c;
  const seed = map.seed;
  peindreLaMer(c, (x, y) => at(x, y) === T.mur);

  // Hauts-fonds : une eau plus claire, du sable qui affleure.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.eau) continue;
      const cx = (x + 0.5) * S;
      const cy = (y + 0.5) * S;
      const r = S * (0.9 + hash(x, y, seed + 11) * 0.6);
      const b = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      b.addColorStop(0, shade(theme.water, 0.3, 0.7));
      b.addColorStop(1, shade(theme.water, 0.3, 0));
      g.fillStyle = b;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 5; k++) {
        g.fillStyle = shade(theme.floor, 0, 0.18 + hash(x + k, y, seed + 12) * 0.2);
        g.beginPath();
        g.arc(cx + (hash(k, x, seed + 13) - 0.5) * S * 0.9, cy + (hash(k, y, seed + 14) - 0.5) * S * 0.9, 1 + hash(x, k, seed + 15) * 2, 0, Math.PI * 2);
        g.fill();
      }
    }

  // Sargasses : des paquets d'algues brunes qui dérivent.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.vegetation) continue;
      const n = 6 + Math.floor(hash(x, y, seed + 21) * 5);
      for (let k = 0; k < n; k++) {
        const px = (x + hash(x * 5 + k, y, seed + 22)) * S;
        const py = (y + hash(x, y * 5 + k, seed + 23)) * S;
        const r = 2 + hash(x + k, y, seed + 24) * 4;
        g.fillStyle = hash(k, x + y, seed + 25) > 0.5 ? shade(theme.vegetation, -0.28, 0.75) : "rgba(120,96,40,.7)";
        g.beginPath();
        g.ellipse(px, py, r * 1.5, r, hash(k, x, seed + 26) * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
    }

  // Îlots et récifs : une plage de sable, la roche, un peu de verdure ; l'écume tout autour.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.mur) continue;
      const cx = (x + 0.5) * S;
      const cy = (y + 0.5) * S;
      const R = S * (0.55 + hash(x, y, seed + 31) * 0.25);
      const blob = (rayon: number, graine: number) => {
        const pts = 10;
        g.beginPath();
        for (let k = 0; k < pts; k++) {
          const a = (k / pts) * Math.PI * 2;
          const rr = rayon * (0.82 + hash(x * 13 + k, y, seed + graine) * 0.3);
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          if (k) g.lineTo(px, py);
          else g.moveTo(px, py);
        }
        g.closePath();
      };
      blob(R * 1.35, 32);
      g.strokeStyle = "rgba(240,250,255,.4)";
      g.lineWidth = 2.5;
      g.stroke();
      blob(R * 1.15, 33);
      g.fillStyle = shade(theme.floor, -0.02, 0.9);
      g.fill();
      blob(R * 0.85, 34);
      const roche = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      roche.addColorStop(0, shade(theme.wall, 0.22));
      roche.addColorStop(1, shade(theme.wall, -0.18));
      g.fillStyle = roche;
      g.fill();
      g.strokeStyle = "rgba(20,12,4,.55)";
      g.lineWidth = 1.4;
      g.stroke();
      if (hash(x, y, seed + 35) > 0.35) {
        g.fillStyle = shade(theme.vegetation, -0.1, 0.85);
        g.beginPath();
        g.ellipse(cx - R * 0.1, cy - R * 0.1, R * 0.4, R * 0.3, 0.4, 0, Math.PI * 2);
        g.fill();
      }
    }

  // Lieux : un palmier sur l'îlot, une carcasse d'épave ou une bouée.
  for (const r of map.rooms) {
    const cx = (r.x + r.w / 2) * S;
    const cy = (r.y + r.h / 2) * S;
    if (r.label === "Îlot") {
      g.strokeStyle = "#4a3320";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, cy + S * 0.15);
      g.quadraticCurveTo(cx + S * 0.12, cy - S * 0.2, cx + S * 0.05, cy - S * 0.45);
      g.stroke();
      g.strokeStyle = shade(theme.vegetation, -0.05);
      g.lineWidth = 2.5;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + 0.3;
        g.beginPath();
        g.moveTo(cx + S * 0.05, cy - S * 0.45);
        g.quadraticCurveTo(cx + S * 0.05 + Math.cos(a) * S * 0.2, cy - S * 0.55 + Math.sin(a) * S * 0.1, cx + S * 0.05 + Math.cos(a) * S * 0.38, cy - S * 0.4 + Math.sin(a) * S * 0.2);
        g.stroke();
      }
    } else if (r.label === "Épave") {
      g.strokeStyle = "#2c1d10";
      g.fillStyle = "rgba(70,46,24,.9)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - S * 0.8, cy + S * 0.15);
      g.quadraticCurveTo(cx - S * 0.2, cy + S * 0.55, cx + S * 0.7, cy + S * 0.1);
      g.lineTo(cx + S * 0.45, cy - S * 0.05);
      g.lineTo(cx + S * 0.1, cy + S * 0.1);
      g.lineTo(cx - S * 0.2, cy - S * 0.1);
      g.lineTo(cx - S * 0.55, cy + S * 0.05);
      g.closePath();
      g.fill();
      g.stroke();
      for (let k = -2; k <= 2; k++) {
        g.beginPath();
        g.moveTo(cx + k * S * 0.22, cy + S * 0.02);
        g.lineTo(cx + k * S * 0.22, cy - S * 0.38 - (k % 2 ? 0 : S * 0.12));
        g.stroke();
      }
    } else {
      g.fillStyle = "#b3402a";
      g.strokeStyle = "#2c1d10";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, S * 0.2, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = "#e8e0cc";
      g.fillRect(cx - S * 0.2, cy - S * 0.04, S * 0.4, S * 0.08);
    }
  }
  return cv;
}

/** Deux ponts bord à bord : bordé de chêne, lisse sombre, mâts, écoutille, planches d'abordage tendues de cordages. */
export function renderPont(c: MapCtx): HTMLCanvasElement {
  const { map, theme, g, cv, W, H, S, at } = c;
  const seed = map.seed;
  const dehors = (x: number, y: number) => (at(x, y) ?? T.vide) === T.vide;
  peindreLaMer(c, (x, y) => !dehors(x, y));

  const bois = shade(theme.wall, 0.22);
  const boisSombre = shade(theme.wall, -0.12);

  // L'ombre portée de la coque sur l'eau, puis l'écume le long de la lisse.
  g.save();
  g.shadowColor = "rgba(0,0,0,.55)";
  g.shadowBlur = 12;
  g.shadowOffsetY = 5;
  g.fillStyle = boisSombre;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!dehors(x, y)) g.fillRect(x * S, y * S, S, S);
  g.restore();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!dehors(x, y)) continue;
      let voisin = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!dehors(x + dx, y + dy)) voisin = true;
      if (!voisin) continue;
      g.fillStyle = `rgba(240,250,255,${0.1 + hash(x, y, seed + 41) * 0.12})`;
      g.beginPath();
      g.arc((x + 0.5) * S, (y + 0.5) * S, S * 0.34, 0, Math.PI * 2);
      g.fill();
    }

  // Le pont : lattes de chêne, une teinte par latte, des clous.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = at(x, y);
      if (t === undefined || t === T.vide || t === T.mur) continue;
      const px = x * S;
      const py = y * S;
      g.fillStyle = shade(theme.wall, 0.2 + hash(x, y, seed + 51) * 0.06);
      g.fillRect(px, py, S, S);
      const lattes = 4;
      for (let k = 0; k < lattes; k++) {
        g.fillStyle = shade(theme.wall, 0.14 + hash(x, y * 4 + k, seed + 52) * 0.14, 0.8);
        g.fillRect(px, py + (k * S) / lattes, S, S / lattes - 1.5);
        g.fillStyle = "rgba(40,24,10,.5)";
        if (hash(x, y * 4 + k, seed + 53) > 0.5) g.fillRect(px + hash(x, y, seed + 54 + k) * S * 0.6, py + (k * S) / lattes + 1, 1.6, 1.6);
      }
      g.strokeStyle = "rgba(40,24,10,.35)";
      g.lineWidth = 1;
      g.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
    }

  // La lisse : une rambarde épaisse qui court tout le tour de chaque pont. Un mur isolé au milieu du pont est un mât.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.mur) continue;
      const px = x * S;
      const py = y * S;
      const ouvert = (dx: number, dy: number) => {
        const v = at(x + dx, y + dy);
        return v !== undefined && v !== T.vide && v !== T.mur;
      };
      const mat = ouvert(1, 0) && ouvert(-1, 0) && ouvert(0, 1) && ouvert(0, -1);
      if (mat) {
        const cx = px + S / 2;
        const cy = py + S / 2;
        g.fillStyle = "rgba(0,0,0,.28)";
        g.beginPath();
        g.ellipse(cx + 3, cy + 4, S * 0.4, S * 0.34, 0, 0, Math.PI * 2);
        g.fill();
        const f = g.createRadialGradient(cx - S * 0.1, cy - S * 0.1, S * 0.05, cx, cy, S * 0.4);
        f.addColorStop(0, bois);
        f.addColorStop(1, boisSombre);
        g.fillStyle = f;
        g.strokeStyle = "rgba(20,12,4,.8)";
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(cx, cy, S * 0.36, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.strokeStyle = "rgba(210,190,140,.6)";
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(cx, cy, S * 0.22, 0, Math.PI * 2);
        g.stroke();
        continue;
      }
      g.fillStyle = hash(x, y, seed + 61) > 0.5 ? boisSombre : shade(theme.wall, -0.17);
      g.fillRect(px, py, S, S);
      g.fillStyle = "rgba(255,230,180,.18)";
      g.fillRect(px, py + 2, S, 3);
      g.strokeStyle = "rgba(20,12,4,.7)";
      g.lineWidth = 1.4;
      g.strokeRect(px + 0.7, py + 0.7, S - 1.4, S - 1.4);
    }

  // L'écoutille : un grillage sombre.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.porte) continue;
      const px = x * S;
      const py = y * S;
      g.fillStyle = "rgba(24,14,6,.85)";
      g.fillRect(px + 4, py + 4, S - 8, S - 8);
      g.strokeStyle = shade(theme.wall, 0.15);
      g.lineWidth = 2;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(px + 4 + (k * (S - 8)) / 4, py + 4);
        g.lineTo(px + 4 + (k * (S - 8)) / 4, py + S - 4);
        g.moveTo(px + 4, py + 4 + (k * (S - 8)) / 4);
        g.lineTo(px + S - 4, py + 4 + (k * (S - 8)) / 4);
        g.stroke();
      }
      g.strokeRect(px + 4, py + 4, S - 8, S - 8);
    }

  // Les grappins : là où les deux lisses s'ouvrent, deux aussières tendues et des crocs de fer sur chaque bord.
  const nous = map.rooms[0];
  if (nous) {
    const haut = nous.y + nous.h; // lisse basse du premier pont
    for (let x = 0; x < W; x++) {
      const a = at(x, haut);
      const b = at(x, haut + 1);
      if (a === undefined || b === undefined || a === T.mur || b === T.mur || a === T.vide || b === T.vide) continue;
      const cx = (x + 0.5) * S;
      const y1 = haut * S + S * 0.15;
      const y2 = (haut + 2) * S - S * 0.15;
      g.strokeStyle = "rgba(20,12,4,.6)";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(cx - S * 0.18, y1);
      g.quadraticCurveTo(cx - S * 0.28, (y1 + y2) / 2, cx - S * 0.18, y2);
      g.moveTo(cx + S * 0.18, y1);
      g.quadraticCurveTo(cx + S * 0.28, (y1 + y2) / 2, cx + S * 0.18, y2);
      g.stroke();
      g.strokeStyle = "#c9b27a";
      g.lineWidth = 2.6;
      g.stroke();
      g.strokeStyle = "#3a3a3e";
      g.lineWidth = 2.4;
      for (const yy of [y1, y2]) {
        g.beginPath();
        g.moveTo(cx - S * 0.28, yy);
        g.lineTo(cx + S * 0.28, yy);
        g.stroke();
      }
    }
  }
  return cv;
}
