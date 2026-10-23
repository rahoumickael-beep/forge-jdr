// Dés qui roulent sur la table : chaque lancer du journal est rejoué chez tout le monde en même temps.
// Le résultat vient du serveur ; ici on ne fait que le mettre en scène (rebonds, faces qui défilent, arrêt sur la bonne valeur).
import { useEffect, useRef } from "react";
import type { ChatEntry, RoomView } from "../../../shared/types";

const DISPLAY = `"IM Fell English SC", Cinzel, Georgia, serif`;
const MAX_DICE = 8;
const ROLL_MAX = 1.6; // s : un dé finit toujours par s'arrêter
const SHOW = 3.4; // s affichés après l'arrêt
const FADE = 0.6;
const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Die {
  sides: number;
  value: number;
  dropped: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  face: number;
  nextFace: number;
  stopped: boolean;
}
interface Throw {
  id: string;
  who: string;
  color: string;
  dice: Die[];
  extra: number;
  start: number;
  settled: number | null;
  total: number;
  modifier: number;
  crit: "or" | "sang" | null;
}

/** Dés écartés par un avantage ou un « garder les meilleurs » : on retire les gardés, un par un, de la liste des lancés. */
function droppedFlags(rolls: number[], kept: number[]) {
  const left = [...kept];
  return rolls.map((v) => {
    const i = left.indexOf(v);
    if (i >= 0) {
      left.splice(i, 1);
      return false;
    }
    return true;
  });
}

let audio: AudioContext | null = null;
let lastClack = 0;
/** Choc d'un dé sur le bois : un bruit bref, filtré, plus fort quand il tape vite. */
function clack(force: number) {
  const now = performance.now();
  if (now - lastClack < 45 || force < 0.08) return;
  lastClack = now;
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 1400;
    bp.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.value = Math.min(0.5, force * 0.6);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  } catch {
    // pas de son : tant pis
  }
}

/** Contour du dé vu de dessus, selon son nombre de faces. */
function dieOutline(sides: number, r: number): [number, number][] {
  const poly = (n: number, rot: number, k = 1) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i * 2 * Math.PI) / n) * r * k, Math.sin(rot + (i * 2 * Math.PI) / n) * r * k] as [number, number]);
  if (sides === 4) return poly(3, -Math.PI / 2, 1.12);
  if (sides === 6) return poly(4, Math.PI / 4, 1.05);
  if (sides === 8) return poly(4, -Math.PI / 2, 1.1);
  if (sides === 10) return [[0, -r * 1.1], [r * 0.95, -r * 0.15], [r * 0.6, r * 0.9], [-r * 0.6, r * 0.9], [-r * 0.95, -r * 0.15]];
  if (sides === 12) return poly(10, -Math.PI / 2);
  if (sides === 20) return poly(6, -Math.PI / 2, 1.05);
  return poly(16, 0);
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function drawDie(g: CanvasRenderingContext2D, d: Die, r: number, color: string, alpha: number, glow: string | null) {
  const pts = dieOutline(d.sides, r);
  g.save();
  g.globalAlpha = alpha;
  // Ombre au sol, plus courte quand le dé est arrêté.
  g.save();
  g.translate(d.x + r * 0.18, d.y + r * 0.26);
  g.rotate(d.a);
  g.filter = `blur(${Math.max(2, r * 0.12)}px)`;
  g.fillStyle = "rgba(4,2,1,.55)";
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
  g.restore();
  if (glow) {
    const gl = g.createRadialGradient(d.x, d.y, r * 0.4, d.x, d.y, r * 2.2);
    gl.addColorStop(0, glow);
    gl.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gl;
    g.fillRect(d.x - r * 2.2, d.y - r * 2.2, r * 4.4, r * 4.4);
  }
  // Corps : couleur du joueur, éclairé du haut à gauche par la lampe.
  g.save();
  g.translate(d.x, d.y);
  g.rotate(d.a);
  const body = new Path2D();
  pts.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
  body.closePath();
  const lit = g.createLinearGradient(-r, -r, r, r);
  lit.addColorStop(0, shade(color, 0.35));
  lit.addColorStop(0.55, shade(color, -0.15));
  lit.addColorStop(1, shade(color, -0.6));
  g.fillStyle = lit;
  g.fill(body);
  // Facettes : du centre vers chaque coin, et une face centrale pour le d12 et le d20.
  g.strokeStyle = "rgba(255,240,210,.22)";
  g.lineWidth = Math.max(0.8, r * 0.04);
  const inner = d.sides === 20 ? 3 : d.sides === 12 ? 5 : 0;
  if (inner) {
    const ip = Array.from({ length: inner }, (_, i) => [Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / inner) * r * 0.55, Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / inner) * r * 0.55]);
    g.beginPath();
    ip.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.stroke();
    for (const [x, y] of pts) {
      const near = ip.reduce((b, p) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? p : b));
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(near[0], near[1]);
      g.stroke();
    }
  } else if (d.sides !== 6) {
    for (const [x, y] of pts) {
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(x, y);
      g.stroke();
    }
  }
  g.strokeStyle = "rgba(10,5,2,.9)";
  g.lineWidth = Math.max(1.2, r * 0.07);
  g.lineJoin = "round";
  g.stroke(body);
  g.restore();
  // Chiffre toujours droit, pour qu'on le lise même pendant que le dé tourne.
  g.font = `${Math.round(r * (d.sides >= 10 ? 0.78 : 0.9))}px ${DISPLAY}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const label = String(d.face);
  g.fillStyle = "rgba(0,0,0,.55)";
  g.fillText(label, d.x + 1, d.y + 2);
  g.fillStyle = "#f3e7c8";
  g.fillText(label, d.x, d.y + 1);
  if (d.face === 6 || d.face === 9) {
    g.fillRect(d.x - r * 0.18, d.y + r * 0.42, r * 0.36, Math.max(1, r * 0.06));
  }
  g.restore();
}

export function DesSurLaTable({ room }: { room: RoomView }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const throws = useRef<Throw[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const raf = useRef(0);

  // Nouveaux lancers du journal (pas ceux d'avant l'arrivée à la table).
  useEffect(() => {
    const entries = room.chat.filter((c): c is ChatEntry & { roll: NonNullable<ChatEntry["roll"]> } => c.kind === "des" && !!c.roll);
    if (!seen.current) {
      seen.current = new Set(entries.map((c) => c.id));
      return;
    }
    const fresh = entries.filter((c) => !seen.current!.has(c.id));
    if (!fresh.length) return;
    const cv = ref.current;
    const w = cv?.clientWidth ?? 800;
    const h = cv?.clientHeight ?? 600;
    for (const c of fresh) {
      seen.current.add(c.id);
      const who = room.players.find((p) => p.id === c.fromId);
      const color = who?.color ?? "#c8a24a";
      const dropped = droppedFlags(c.roll.rolls, c.roll.kept);
      const n = Math.min(MAX_DICE, c.roll.rolls.length);
      // Chaque joueur lance depuis son côté de la table : le bas de l'écran, décalé selon sa place.
      const seat = Math.max(0, room.players.findIndex((p) => p.id === c.fromId));
      const fromX = w * (0.25 + ((seat * 0.37) % 0.6));
      const dice: Die[] = Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        const speed = Math.min(w, h) * (1.5 + Math.random() * 0.6);
        return {
          sides: c.roll.sides,
          value: c.roll.rolls[i],
          dropped: dropped[i],
          x: fromX + (i - n / 2) * 30,
          y: h + 30 + i * 6,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          a: Math.random() * 6.28,
          va: (Math.random() - 0.5) * 22,
          face: 1 + Math.floor(Math.random() * c.roll.sides),
          nextFace: 0,
          stopped: false,
        };
      });
      const single = c.roll.kept.length === 1 && c.roll.sides === 20 ? c.roll.kept[0] : 0;
      throws.current.push({
        id: c.id,
        who: c.from,
        color,
        dice,
        extra: c.roll.rolls.length - n,
        start: performance.now(),
        settled: null,
        total: c.roll.total,
        modifier: c.roll.modifier,
        crit: single === 20 ? "or" : single === 1 ? "sang" : null,
      });
      if (reducedMotion) for (const d of dice) Object.assign(d, { x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.6, vx: 0, vy: 0, va: 0, face: d.value, stopped: true });
    }
    if (throws.current.length > 3) throws.current.splice(0, throws.current.length - 3);
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [room.chat]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  let last = performance.now();
  function loop(now: number) {
    const cv = ref.current;
    if (!cv) {
      raf.current = 0;
      return;
    }
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const r = w < 600 ? 19 : 28;
    throws.current = throws.current.filter((t) => !t.settled || now - t.settled < (SHOW + FADE) * 1000);
    for (const t of throws.current) {
      const age = (now - t.start) / 1000;
      for (const d of t.dice) {
        if (d.stopped) continue;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.a += d.va * dt;
        const fr = Math.exp(-2.6 * dt);
        d.vx *= fr;
        d.vy *= fr;
        d.va *= Math.exp(-2.2 * dt);
        // Rebonds sur les bords de la table (sauf le bas tant que le dé n'est pas encore entré).
        const m = r * 1.2;
        const hit = (v: number) => {
          clack(Math.abs(v) / 900);
          return -v * 0.55;
        };
        if (d.x < m && d.vx < 0) d.vx = hit(d.vx);
        if (d.x > w - m && d.vx > 0) d.vx = hit(d.vx);
        if (d.y < m && d.vy < 0) d.vy = hit(d.vy);
        if (d.y > h - m && d.vy > 0 && age > 0.3) d.vy = hit(d.vy);
        // Face qui défile tant que le dé roule vite.
        if (now > d.nextFace) {
          d.face = 1 + Math.floor(Math.random() * d.sides);
          d.nextFace = now + 60 + 220 * (1 - Math.min(1, Math.hypot(d.vx, d.vy) / 900));
        }
        if ((Math.hypot(d.vx, d.vy) < 30 && age > 0.5) || age > ROLL_MAX) {
          d.stopped = true;
          d.face = d.value;
          d.vx = d.vy = d.va = 0;
          d.x = Math.max(m, Math.min(w - m, d.x));
          d.y = Math.max(m, Math.min(h - m, d.y));
          clack(0.25);
        }
      }
      // Les dés se cognent entre eux au lieu de se traverser.
      for (let i = 0; i < t.dice.length; i++)
        for (let j = i + 1; j < t.dice.length; j++) {
          const a = t.dice[i];
          const b = t.dice[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < r * 2.1) {
            const push = (r * 2.1 - dist) / 2;
            a.x -= (dx / dist) * push;
            a.y -= (dy / dist) * push;
            b.x += (dx / dist) * push;
            b.y += (dy / dist) * push;
            if (!a.stopped && !b.stopped) {
              [a.vx, b.vx] = [b.vx * 0.8, a.vx * 0.8];
              [a.vy, b.vy] = [b.vy * 0.8, a.vy * 0.8];
              clack(Math.hypot(a.vx - b.vx, a.vy - b.vy) / 1400);
            }
          }
        }
      if (!t.settled && t.dice.every((d) => d.stopped)) t.settled = now;
      const fade = t.settled ? Math.max(0, Math.min(1, 1 - ((now - t.settled) / 1000 - SHOW) / FADE)) : 1;
      for (const d of t.dice) {
        const glow = t.settled && !d.dropped && t.crit ? (t.crit === "or" ? "rgba(255,206,90,.55)" : "rgba(170,20,14,.55)") : null;
        drawDie(g, d, r, t.color, fade * (t.settled && d.dropped ? 0.35 : 1), glow);
      }
      // Étiquette du total, posée près des dés quand ils sont arrêtés.
      if (t.settled) {
        const kept = t.dice.filter((d) => !d.dropped);
        const cx = kept.reduce((s, d) => s + d.x, 0) / Math.max(1, kept.length);
        const cy = Math.max(...t.dice.map((d) => d.y)) + r * 1.7;
        const mod = t.modifier ? ` (${t.modifier > 0 ? "+" : "−"}${Math.abs(t.modifier)})` : "";
        const more = t.extra > 0 ? ` · +${t.extra} dés` : "";
        const text = `${t.who} · ${t.total}${mod}${more}${t.crit === "or" ? " · critique !" : t.crit === "sang" ? " · échec critique" : ""}`;
        g.save();
        g.globalAlpha = fade;
        g.font = `${w < 600 ? 13 : 15}px ${DISPLAY}`;
        const tw = g.measureText(text).width + 18;
        const x = Math.max(4, Math.min(w - tw - 4, cx - tw / 2));
        const y = Math.min(h - 30, cy);
        g.fillStyle = "rgba(236,223,194,.95)";
        g.strokeStyle = "rgba(60,36,14,.8)";
        g.lineWidth = 1;
        g.beginPath();
        g.rect(x, y, tw, 24);
        g.fill();
        g.stroke();
        g.fillStyle = t.crit === "sang" ? "#7a0e0e" : "#2a1a0e";
        g.textBaseline = "middle";
        g.fillText(text, x + 9, y + 12.5);
        g.restore();
      }
    }
    raf.current = throws.current.length ? requestAnimationFrame(loop) : 0;
    if (!throws.current.length) g.clearRect(0, 0, w, h);
  }

  return <canvas ref={ref} className="des-table" aria-hidden="true" />;
}
