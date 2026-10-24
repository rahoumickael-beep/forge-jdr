// Rendu d'une carte d'espace (combat de vaisseaux) : vide profond, champ d'étoiles, nébuleuses, débris,
// astéroïdes ombrés, la spirale d'un Phare vue de dessus et une station en anneau.
// Couleurs tirées du thème du genre ; même graine, même ciel.
import { T } from "../../shared/types";
import type { MapCtx } from "./mapCommon";
import { hash, shade } from "./mapUtil";

export function renderSpace(c: MapCtx): HTMLCanvasElement {
  const { map, theme, g, cv, W, H, S, at } = c;
  const seed = map.seed;
  const IW = cv.width;
  const IH = cv.height;

  // 1. Le vide : un dégradé à peine plus clair vers le centre.
  const fond = g.createRadialGradient(IW * 0.55, IH * 0.45, 0, IW * 0.5, IH * 0.5, Math.max(IW, IH) * 0.75);
  fond.addColorStop(0, shade(theme.background, 0.12));
  fond.addColorStop(1, shade(theme.background, -0.35));
  g.fillStyle = fond;
  g.fillRect(0, 0, IW, IH);

  // 2. Une bande de galaxie lointaine, en diagonale, très douce.
  g.save();
  g.translate(IW / 2, IH / 2);
  g.rotate(-0.5 + hash(1, 2, seed) * 0.4);
  const bande = g.createLinearGradient(0, -IH * 0.3, 0, IH * 0.3);
  bande.addColorStop(0, "rgba(180,170,255,0)");
  bande.addColorStop(0.5, "rgba(200,190,255,0.07)");
  bande.addColorStop(1, "rgba(180,170,255,0)");
  g.fillStyle = bande;
  g.fillRect(-IW, -IH * 0.3, IW * 2, IH * 0.6);
  g.restore();

  // 3. Nébuleuses : nuages additifs sur les cases de gaz.
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.eau || hash(x, y, seed + 7) > 0.45) continue;
      const cx = (x + 0.5) * S;
      const cy = (y + 0.5) * S;
      const r = S * (1.6 + hash(x, y, seed + 9) * 1.8);
      const violet = hash(x, y, seed + 11) > 0.5;
      const n = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      n.addColorStop(0, violet ? "rgba(150,80,200,0.16)" : "rgba(60,170,190,0.14)");
      n.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = n;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }
  g.restore();

  // 4. Étoiles : petites, quelques grosses avec une croix de lumière.
  const nb = Math.round(W * H * 1.4);
  for (let i = 0; i < nb; i++) {
    const x = hash(i, 1, seed) * IW;
    const y = hash(i, 2, seed) * IH;
    const t = hash(i, 3, seed);
    const r = t > 0.985 ? 1.8 : t > 0.9 ? 1.1 : 0.6;
    const teinte = hash(i, 4, seed);
    g.fillStyle = teinte > 0.85 ? "rgba(255,210,170,0.9)" : teinte > 0.7 ? "rgba(170,200,255,0.9)" : "rgba(235,240,255,0.8)";
    g.globalAlpha = 0.35 + hash(i, 5, seed) * 0.65;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    if (r > 1.5) {
      g.strokeStyle = "rgba(235,240,255,0.35)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x - 6, y);
      g.lineTo(x + 6, y);
      g.moveTo(x, y - 6);
      g.lineTo(x, y + 6);
      g.stroke();
    }
  }
  g.globalAlpha = 1;

  // 5. Débris : éclats de tôle et de roche, anguleux.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.vegetation) continue;
      const n = 2 + Math.floor(hash(x, y, seed + 21) * 4);
      for (let k = 0; k < n; k++) {
        const px = (x + hash(x * 7 + k, y, seed + 22)) * S;
        const py = (y + hash(x, y * 7 + k, seed + 23)) * S;
        const r = 2 + hash(x + k, y + k, seed + 24) * 5;
        const a = hash(k, x + y, seed + 25) * Math.PI;
        g.fillStyle = hash(k, x, seed) > 0.5 ? "#6d7480" : "#8a6a4e";
        g.beginPath();
        g.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
        g.lineTo(px + Math.cos(a + 2.2) * r * 0.6, py + Math.sin(a + 2.2) * r * 0.6);
        g.lineTo(px + Math.cos(a + 4) * r * 0.8, py + Math.sin(a + 4) * r * 0.8);
        g.closePath();
        g.fill();
      }
    }

  // 6. Astéroïdes : un rocher irrégulier par case, éclairé d'en haut à gauche, avec ses cratères.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== T.mur) continue;
      const cx = (x + 0.5) * S;
      const cy = (y + 0.5) * S;
      const R = S * (0.55 + hash(x, y, seed + 31) * 0.25);
      const pts = 9;
      g.beginPath();
      for (let k = 0; k < pts; k++) {
        const a = (k / pts) * Math.PI * 2;
        const rr = R * (0.78 + hash(x * 13 + k, y, seed + 32) * 0.3);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (k) g.lineTo(px, py);
        else g.moveTo(px, py);
      }
      g.closePath();
      const roche = g.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1);
      roche.addColorStop(0, "#9c8d7a");
      roche.addColorStop(0.6, "#5a5048");
      roche.addColorStop(1, "#231f1d");
      g.fillStyle = roche;
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.5)";
      g.lineWidth = 1.5;
      g.stroke();
      const crateres = 1 + Math.floor(hash(x, y, seed + 33) * 3);
      for (let k = 0; k < crateres; k++) {
        const kx = cx + (hash(k, x, seed + 34) - 0.5) * R;
        const ky = cy + (hash(k, y, seed + 35) - 0.5) * R;
        const kr = R * (0.1 + hash(k, x + y, seed + 36) * 0.12);
        g.fillStyle = "rgba(20,16,14,0.45)";
        g.beginPath();
        g.arc(kx, ky, kr, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(200,185,160,0.25)";
        g.beginPath();
        g.arc(kx - 0.5, ky - 0.5, kr, Math.PI, Math.PI * 1.6);
        g.stroke();
      }
    }

  // 7. Lieux : le Phare en spirale de coquille, la station en anneau.
  for (const r of map.rooms) {
    const cx = (r.x + r.w / 2) * S;
    const cy = (r.y + r.h / 2) * S;
    if (r.label === "Phare") {
      const halo = g.createRadialGradient(cx, cy, 0, cx, cy, S * 3);
      halo.addColorStop(0, "rgba(210,230,255,0.45)");
      halo.addColorStop(1, "rgba(210,230,255,0)");
      g.fillStyle = halo;
      g.beginPath();
      g.arc(cx, cy, S * 3, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#e8e2d0";
      g.lineWidth = 5;
      g.beginPath();
      for (let a = 0; a < Math.PI * 7; a += 0.08) {
        const rr = 3 + a * S * 0.07;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (a) g.lineTo(px, py);
        else g.moveTo(px, py);
      }
      g.stroke();
      g.strokeStyle = "rgba(150,200,255,0.8)";
      g.lineWidth = 1.5;
      g.stroke();
    } else {
      g.strokeStyle = "#9aa6b8";
      g.lineWidth = 6;
      g.beginPath();
      g.arc(cx, cy, S * 0.9, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + 0.3;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a) * S * 0.9, cy + Math.sin(a) * S * 0.9);
        g.stroke();
      }
      g.fillStyle = "#c8a24a";
      g.beginPath();
      g.arc(cx, cy, S * 0.22, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        g.fillStyle = k % 2 ? "rgba(255,170,80,0.9)" : "rgba(120,200,255,0.9)";
        g.fillRect(cx + Math.cos(a) * S * 0.9 - 1.5, cy + Math.sin(a) * S * 0.9 - 1.5, 3, 3);
      }
    }
  }
  return cv;
}
