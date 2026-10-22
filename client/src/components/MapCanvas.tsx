import { useEffect, useMemo, useRef, useState } from "react";
import { getGenre } from "../../../shared/genres";
import type { RoomView, Token } from "../../../shared/types";
import { BASE, makeMistPattern, materialFor, renderMapImage, shade } from "../mapRender";
import { send, socket, useStore, type Ping } from "../store";

export type MapTool = "deplacer" | "reveler" | "cacher";

interface Props {
  room: RoomView;
  tool: MapTool;
  brush: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const METERS_PER_CELL = 1.5;
const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w && !/^\d+$/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

type Drag =
  | { type: "pan"; sx: number; sy: number; ox: number; oy: number }
  | { type: "token"; id: string; fromX: number; fromY: number; x: number; y: number }
  | { type: "fog"; cells: Set<number> };

export function MapCanvas({ room, tool, brush, selectedId, onSelect }: Props) {
  const { pings } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isGM = room.you.isGM;
  const map = room.map;
  const genre = getGenre(room.genre);
  const image = useMemo(() => (map ? renderMapImage(map, genre.theme, materialFor(room.genre)) : null), [map, genre, room.genre]);
  const mist = useMemo(() => makeMistPattern(), []);

  const view = useRef({ ox: 0, oy: 0, cell: 28 });
  const drag = useRef<Drag | null>(null);
  const [localFog, setLocalFog] = useState<{ cells: Set<number>; hidden: boolean } | null>(null);
  // Les dernières valeurs, lues par la boucle d'animation sans la redémarrer.
  const live = useRef({ room, pings, selectedId, localFog, isGM });
  live.current = { room, pings, selectedId, localFog, isGM };

  // Masque de brouillard à une case par pixel : agrandi avec lissage, il donne des bords doux.
  const fogMask = useMemo(() => {
    if (!map || !room.fogEnabled || !room.fog) return null;
    const cv = document.createElement("canvas");
    cv.width = map.width;
    cv.height = map.height;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(map.width, map.height);
    const visible = room.visible ? new Set(room.visible) : null;
    for (let i = 0; i < map.width * map.height; i++) {
      let hidden = room.fog[i];
      if (localFog?.cells.has(i)) hidden = localFog.hidden;
      let alpha = 0;
      if (isGM) alpha = hidden ? 150 : 0;
      else if (room.visionMode === "dynamique") {
        if (visible?.has(i)) alpha = 0;
        else if (!hidden || room.mapKnown) alpha = 175; // déjà exploré ou plan connu : sombre
        else alpha = 255;
      } else alpha = hidden ? 255 : 0;
      img.data[i * 4 + 3] = alpha;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }, [map, room.fog, room.fogEnabled, room.visible, room.visionMode, room.mapKnown, localFog, isGM]);
  const fogRef = useRef(fogMask);
  fogRef.current = fogMask;

  // Cadrer la carte quand elle change.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !map) return;
    const cell = Math.max(10, Math.min(56, Math.floor(Math.min(el.clientWidth / map.width, el.clientHeight / map.height))));
    view.current = { cell, ox: (el.clientWidth - map.width * cell) / 2, oy: (el.clientHeight - map.height * cell) / 2 };
  }, [map?.seed, map?.width, map?.height]);

  const toCell = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const v = view.current;
    return { x: Math.floor((clientX - rect.left - v.ox) / v.cell), y: Math.floor((clientY - rect.top - v.oy) / v.cell) };
  };

  const canMove = (t: Token) => isGM || (t.ownerId === room.you.id && !room.movementLocked);

  const tokenAt = (x: number, y: number) =>
    [...room.tokens].reverse().find((t) => {
      const s = t.size ?? 1;
      return x >= t.x && x < t.x + s && y >= t.y && y < t.y + s;
    });

  const paintFog = (cx: number, cy: number, cells: Set<number>) => {
    if (!map) return;
    const r = brush - 1;
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + r) cells.add(y * map.width + x);
      }
    setLocalFog({ cells: new Set(cells), hidden: tool === "cacher" });
  };

  function onPointerDown(e: React.PointerEvent) {
    canvasRef.current!.setPointerCapture(e.pointerId);
    const v = view.current;
    const { x, y } = toCell(e.clientX, e.clientY);
    if (e.button === 1 || e.button === 2) {
      drag.current = { type: "pan", sx: e.clientX, sy: e.clientY, ox: v.ox, oy: v.oy };
      return;
    }
    if (isGM && tool !== "deplacer") {
      const cells = new Set<number>();
      drag.current = { type: "fog", cells };
      paintFog(x, y, cells);
      return;
    }
    const t = tokenAt(x, y);
    if (t) {
      onSelect(t.id);
      if (canMove(t)) {
        drag.current = { type: "token", id: t.id, fromX: t.x, fromY: t.y, x: t.x, y: t.y };
        return;
      }
    } else onSelect(null);
    drag.current = { type: "pan", sx: e.clientX, sy: e.clientY, ox: v.ox, oy: v.oy };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (d.type === "pan") {
      view.current.ox = d.ox + e.clientX - d.sx;
      view.current.oy = d.oy + e.clientY - d.sy;
    } else if (d.type === "token") {
      const { x, y } = toCell(e.clientX, e.clientY);
      d.x = x;
      d.y = y;
    } else if (d.type === "fog") {
      const { x, y } = toCell(e.clientX, e.clientY);
      paintFog(x, y, d.cells);
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (d?.type === "token" && (d.x !== d.fromX || d.y !== d.fromY)) {
      void send("token:move", { id: d.id, x: d.x, y: d.y });
    } else if (d?.type === "fog" && d.cells.size) {
      void send("fog:paint", { cells: [...d.cells], hidden: tool === "cacher" }).then(() => setLocalFog(null));
    }
  }

  function zoomAt(px: number, py: number, factor: number) {
    const v = view.current;
    const cell = Math.max(6, Math.min(110, v.cell * factor));
    const k = cell / v.cell;
    view.current = { cell, ox: px - (px - v.ox) * k, oy: py - (py - v.oy) * k };
  }

  function onWheel(e: React.WheelEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }

  // Flèches du clavier : déplacer le pion sélectionné.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId || (e.target as HTMLElement)?.closest("input, textarea, select")) return;
      const t = room.tokens.find((x) => x.id === selectedId);
      if (!t || !canMove(t)) return;
      const delta: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const dd = delta[e.key];
      if (!dd) return;
      e.preventDefault();
      void send("token:move", { id: t.id, x: t.x + dd[0], y: t.y + dd[1] });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Position animée des pions : ils glissent vers leur nouvelle case au lieu de sauter.
  const shown = useRef(new Map<string, { x: number; y: number }>());

  // --- Boucle de rendu ---
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < (reducedMotion ? 200 : 33)) return; // ~30 images/s suffisent
      last = now;
      draw(now / 1000);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [image]);

  function draw(time: number) {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const { room, pings, selectedId, isGM } = live.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const map = room.map;
    if (!map || !image) return;
    const { ox, oy, cell } = view.current;
    const mw = map.width * cell;
    const mh = map.height * cell;
    (window as unknown as { __forgeTokenScreen: (id: string) => { x: number; y: number } | null }).__forgeTokenScreen = (id) => {
      const t = room.tokens.find((x) => x.id === id);
      return t ? { x: ox + (t.x + 0.5) * cell, y: oy + (t.y + 0.5) * cell } : null;
    };

    // Ombre de la carte posée sur la table
    g.save();
    g.shadowColor = "rgba(0,0,0,.7)";
    g.shadowBlur = 40;
    g.shadowOffsetY = 12;
    g.fillStyle = "#000";
    g.fillRect(ox, oy, mw, mh);
    g.restore();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(image, ox, oy, mw, mh);

    // Lumières : torches dans les salles (donjon, cavernes), qui vacillent.
    const lit = map.kind === "donjon" || map.kind === "caverne";
    if (lit) {
      g.save();
      g.globalCompositeOperation = "multiply";
      g.fillStyle = "rgba(20,24,40,.38)"; // pénombre générale
      g.fillRect(ox, oy, mw, mh);
      g.restore();
      g.save();
      g.globalCompositeOperation = "screen";
      const lights = map.rooms.length ? map.rooms : [];
      lights.forEach((r, i) => {
        const flick = reducedMotion ? 1 : 0.9 + Math.sin(time * 7 + i * 1.7) * 0.05 + Math.sin(time * 13.3 + i) * 0.04;
        const cx = ox + (r.x + r.w / 2) * cell;
        const cy = oy + (r.y + r.h / 2) * cell;
        const rad = Math.max(r.w, r.h) * cell * 0.85 * flick;
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, "rgba(255,190,110,.32)");
        grad.addColorStop(0.5, "rgba(255,150,70,.12)");
        grad.addColorStop(1, "rgba(255,140,60,0)");
        g.fillStyle = grad;
        g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      });
      g.restore();
    }

    // Étiquettes des salles, pour le MJ
    if (isGM && cell >= 16) {
      g.font = `600 ${Math.max(10, cell * 0.36)}px Cinzel, "IM Fell English SC", Georgia, serif`;
      g.textAlign = "center";
      for (const r of map.rooms) {
        if (!r.label) continue;
        const cx = ox + (r.x + r.w / 2) * cell;
        const cy = oy + (r.y + 0.62) * cell;
        g.lineWidth = 3;
        g.strokeStyle = "rgba(0,0,0,.65)";
        g.strokeText(r.label, cx, cy);
        g.fillStyle = "#f6e7c1";
        g.fillText(r.label, cx, cy);
      }
    }

    // Pions
    const d = drag.current;
    for (const t of room.tokens) {
      const target = d?.type === "token" && d.id === t.id ? { x: d.x, y: d.y } : { x: t.x, y: t.y };
      const prev = shown.current.get(t.id) ?? target;
      const k = reducedMotion ? 1 : 0.35;
      const pos = { x: prev.x + (target.x - prev.x) * k, y: prev.y + (target.y - prev.y) * k };
      if (Math.abs(pos.x - target.x) < 0.01 && Math.abs(pos.y - target.y) < 0.01) Object.assign(pos, target);
      shown.current.set(t.id, pos);
      drawToken(g, t, ox + (pos.x + (t.size ?? 1) / 2) * cell, oy + (pos.y + (t.size ?? 1) / 2) * cell, cell * (t.size ?? 1), {
        selected: t.id === selectedId,
        mine: t.ownerId === room.you.id,
        time,
        portrait: t.characterId ? portraitImage(room.characters.find((c) => c.id === t.characterId)?.portrait) : null,
      });
    }

    // Brouillard : masque lissé + brume qui dérive.
    const fog = fogRef.current;
    if (fog) {
      const layer = document.createElement("canvas");
      layer.width = Math.ceil(w);
      layer.height = Math.ceil(h);
      const lg = layer.getContext("2d")!;
      lg.imageSmoothingEnabled = true;
      lg.drawImage(fog, ox - cell * 0.5, oy - cell * 0.5, mw + cell, mh + cell);
      lg.drawImage(fog, ox, oy, mw, mh);
      lg.globalCompositeOperation = "source-in";
      lg.fillStyle = isGM ? "#0b0e12" : "#141116";
      lg.fillRect(0, 0, w, h);
      if (!reducedMotion) {
        lg.globalCompositeOperation = "source-atop";
        // Deux couches de fumée qui dérivent en sens contraires : les volutes se croisent et se défont.
        const scale = Math.max(1, cell / 20);
        const span = 256 * scale;
        for (const [speed, dir, extra] of [[7, 1, 1], [4, -1, 1.6]] as const) {
          const pattern = lg.createPattern(mist, "repeat")!;
          const shift = time * speed;
          pattern.setTransform(new DOMMatrix().translate((dir * shift) % span, (shift * 0.35) % span).scale(scale * extra));
          lg.fillStyle = pattern;
          lg.fillRect(0, 0, w, h);
        }
      }
      g.drawImage(layer, 0, 0, w, h);
    }

    // Mesure pendant le déplacement d'un pion
    if (d?.type === "token") {
      const fx = ox + (d.fromX + 0.5) * cell;
      const fy = oy + (d.fromY + 0.5) * cell;
      const tx = ox + (d.x + 0.5) * cell;
      const ty = oy + (d.y + 0.5) * cell;
      g.strokeStyle = "#f3d58a";
      g.lineWidth = 2;
      g.setLineDash([6, 5]);
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(tx, ty);
      g.stroke();
      g.setLineDash([]);
      const cells = Math.max(Math.abs(d.x - d.fromX), Math.abs(d.y - d.fromY));
      const label = `${cells} case${cells > 1 ? "s" : ""} · ${(cells * METERS_PER_CELL).toLocaleString("fr-FR")} m`;
      g.font = `600 13px "Source Sans 3", system-ui, sans-serif`;
      const wl = g.measureText(label).width + 16;
      g.fillStyle = "rgba(14,10,6,.92)";
      g.beginPath();
      g.roundRect(tx + 12, ty - 30, wl, 22, 4);
      g.fill();
      g.strokeStyle = "rgba(243,213,138,.5)";
      g.stroke();
      g.fillStyle = "#f6e7c1";
      g.textAlign = "left";
      g.fillText(label, tx + 20, ty - 14);
    }

    drawPings(g, pings, ox, oy, cell, time);

    // Vignette : les bords de l'écran s'assombrissent comme sous une lampe.
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.55)");
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);
  }

  return (
    <div className="map-area" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={(e) => socket.emit("map:ping", toCell(e.clientX, e.clientY))}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: isGM && tool !== "deplacer" ? "crosshair" : "grab" }}
        aria-label="Carte de jeu"
      />
      {!map && (
        <div className="map-empty">
          <div>
            <h2 className="gilded">La table est vide</h2>
            <p>{isGM ? "Génère une carte dans l'onglet Carte pour commencer." : "Le maître du jeu prépare la carte…"}</p>
          </div>
        </div>
      )}
      {room.scene && <div className="scene-banner">{room.scene}</div>}
      {map && (
        <div className="map-hint">
          Glisser : déplacer · Molette : zoom · Double-clic : signaler
          <button className="btn small ghost" onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 1.25)} aria-label="Zoomer">+</button>
          <button className="btn small ghost" onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 0.8)} aria-label="Dézoomer">−</button>
        </div>
      )}
    </div>
  );
}

/** Pion en médaillon : liseré métallique, disque coloré bombé, initiales gravées. */
// Portraits des personnages, décodés une fois puis gardés en mémoire.
const portraits = new Map<string, HTMLImageElement>();
function portraitImage(url: string | undefined): HTMLImageElement | null {
  if (!url) return null;
  let img = portraits.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    portraits.set(url, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

function drawToken(g: CanvasRenderingContext2D, t: Token, cx: number, cy: number, size: number, o: { selected: boolean; mine: boolean; time: number; portrait?: HTMLImageElement | null }) {
  const r = size * 0.43;
  const rim = t.kind === "monstre" ? "#8a2a20" : t.kind === "pnj" ? "#8a8a8a" : "#d4a94c";
  g.save();
  g.globalAlpha = t.hidden ? 0.5 : 1;
  // halo de sélection qui pulse
  if (o.selected) {
    const pulse = reducedMotion ? 0.6 : 0.5 + Math.sin(o.time * 4) * 0.25;
    const grad = g.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.7);
    grad.addColorStop(0, `rgba(255,220,130,${pulse})`);
    grad.addColorStop(1, "rgba(255,220,130,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
    g.fill();
  }
  // ombre portée
  g.fillStyle = "rgba(0,0,0,.55)";
  g.beginPath();
  g.ellipse(cx + r * 0.12, cy + r * 0.22, r * 1.02, r * 0.95, 0, 0, Math.PI * 2);
  g.fill();
  // anneau métallique
  const ring = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, shade(rim, 0.35));
  ring.addColorStop(0.45, rim);
  ring.addColorStop(0.55, shade(rim, -0.25));
  ring.addColorStop(1, shade(rim, 0.15));
  g.fillStyle = ring;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  // disque intérieur bombé
  const inner = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r * 0.82);
  inner.addColorStop(0, shade(t.color, 0.25));
  inner.addColorStop(1, shade(t.color, -0.18));
  g.fillStyle = inner;
  g.beginPath();
  g.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  g.fill();
  if (o.portrait) {
    g.save();
    g.clip();
    g.drawImage(o.portrait, cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
    g.restore();
    g.beginPath();
    g.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  }
  g.strokeStyle = "rgba(0,0,0,.5)";
  g.lineWidth = Math.max(1, r * 0.06);
  if (t.hidden) g.setLineDash([3, 3]);
  g.stroke();
  g.setLineDash([]);
  // reflet
  g.fillStyle = "rgba(255,255,255,.18)";
  g.beginPath();
  g.ellipse(cx - r * 0.2, cy - r * 0.38, r * 0.45, r * 0.2, -0.4, 0, Math.PI * 2);
  g.fill();
  // initiales gravées
  if (size >= 18 && !o.portrait) {
    g.font = `700 ${Math.max(9, r * 0.72)}px Cinzel, "Source Sans 3", serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,.45)";
    g.fillText(initials(t.name), cx + 0.8, cy + 1.8);
    g.fillStyle = "#fff8e6";
    g.fillText(initials(t.name), cx, cy + 1);
    g.textBaseline = "alphabetic";
  }
  // repère « à moi » : petit losange doré au sommet
  if (o.mine) {
    g.fillStyle = "#f3d58a";
    g.beginPath();
    g.moveTo(cx, cy - r - 6);
    g.lineTo(cx + 4, cy - r - 2);
    g.lineTo(cx, cy - r + 2);
    g.lineTo(cx - 4, cy - r - 2);
    g.closePath();
    g.fill();
  }
  // barre de vie en arc sous le médaillon
  if (t.hpMax && size >= 16) {
    const ratio = Math.max(0, Math.min(1, (t.hp ?? t.hpMax) / t.hpMax));
    g.lineWidth = Math.max(2.5, r * 0.14);
    g.lineCap = "round";
    g.strokeStyle = "rgba(0,0,0,.6)";
    g.beginPath();
    g.arc(cx, cy, r * 1.12, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
    g.strokeStyle = ratio > 0.5 ? "#6fbf5a" : ratio > 0.25 ? "#e3a63c" : "#d2412c";
    g.beginPath();
    g.arc(cx, cy, r * 1.12, Math.PI * 0.8 - Math.PI * 0.6 * ratio, Math.PI * 0.8);
    g.stroke();
  }
  if (t.conditions?.length && size >= 16) {
    g.fillStyle = "#d2412c";
    g.beginPath();
    g.arc(cx + r * 0.78, cy - r * 0.78, Math.max(3, r * 0.2), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawPings(g: CanvasRenderingContext2D, pings: Ping[], ox: number, oy: number, cell: number, time: number) {
  for (const p of pings) {
    const cx = ox + (p.x + 0.5) * cell;
    const cy = oy + (p.y + 0.5) * cell;
    const phase = (time * 1.4) % 1;
    g.strokeStyle = p.color;
    for (let k = 0; k < 3; k++) {
      const f = (phase + k / 3) % 1;
      g.globalAlpha = 1 - f;
      g.lineWidth = 3 * (1 - f) + 1;
      g.beginPath();
      g.arc(cx, cy, cell * (0.4 + f * 1.6), 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.font = `600 12px "Source Sans 3", sans-serif`;
    g.textAlign = "center";
    g.fillStyle = "#fff";
    g.fillText(p.name, cx, cy - cell * 0.9);
  }
}
