import { useEffect, useMemo, useRef, useState } from "react";
import { getGenre, type MapTheme } from "../../../shared/genres";
import { T, type GameMap, type RoomView, type Token } from "../../../shared/types";
import { send, socket, useStore } from "../store";

export type MapTool = "deplacer" | "reveler" | "cacher";

interface Props {
  room: RoomView;
  tool: MapTool;
  brush: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const BASE = 32; // taille d'une case dans l'image pré-rendue
const METERS_PER_CELL = 1.5;

/** Petit hachage déterministe : chaque case garde le même grain d'un rendu à l'autre. */
function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Dessine la carte une fois, avec son grain, dans une image hors écran. */
function renderMap(map: GameMap, theme: MapTheme): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = map.width * BASE;
  cv.height = map.height * BASE;
  const g = cv.getContext("2d")!;
  g.fillStyle = theme.background;
  g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      const t = map.tiles[y * map.width + x];
      const r = hash(x, y, map.seed);
      const px = x * BASE;
      const py = y * BASE;
      const fill = (color: string) => {
        g.fillStyle = shade(color, (r - 0.5) * 0.08);
        g.fillRect(px, py, BASE, BASE);
      };
      switch (t) {
        case T.vide:
          // Roche brute : quelques traits de hachure, comme sur une carte dessinée à la main
          if (r > 0.55) {
            g.strokeStyle = shade(theme.background, 0.06);
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(px + 4, py + BASE - 6);
            g.lineTo(px + BASE - 6, py + 4);
            g.stroke();
          }
          break;
        case T.sol:
          fill(theme.floor);
          if (r < 0.12) {
            g.fillStyle = shade(theme.floor, -0.08);
            g.fillRect(px + r * 200 % 24, py + r * 300 % 24, 3, 2);
          }
          break;
        case T.route:
          fill(theme.road);
          break;
        case T.mur: {
          fill(theme.wall);
          g.strokeStyle = shade(theme.wall, -0.12);
          g.lineWidth = 1.2;
          for (let i = -BASE; i < BASE; i += 7) {
            g.beginPath();
            g.moveTo(px + i, py + BASE);
            g.lineTo(px + i + BASE, py);
            g.stroke();
          }
          break;
        }
        case T.eau: {
          fill(theme.water);
          g.strokeStyle = shade(theme.water, 0.12);
          g.lineWidth = 1.2;
          g.beginPath();
          const wy = py + 10 + r * 12;
          g.moveTo(px + 5, wy);
          g.quadraticCurveTo(px + 11, wy - 4, px + 16, wy);
          g.quadraticCurveTo(px + 21, wy + 4, px + 27, wy);
          g.stroke();
          break;
        }
        case T.vegetation: {
          fill(theme.floor);
          g.fillStyle = shade(theme.vegetation, (r - 0.5) * 0.15);
          const n = 1 + Math.floor(r * 3);
          for (let i = 0; i < n; i++) {
            const cx = px + 8 + hash(x, y, i + 7) * 16;
            const cy = py + 8 + hash(y, x, i + 3) * 16;
            g.beginPath();
            g.arc(cx, cy, 6 + r * 4, 0, Math.PI * 2);
            g.fill();
          }
          break;
        }
        case T.porte:
          fill(theme.road);
          g.fillStyle = theme.door;
          g.fillRect(px + 6, py + 6, BASE - 12, BASE - 12);
          g.strokeStyle = shade(theme.door, -0.2);
          g.strokeRect(px + 6.5, py + 6.5, BASE - 13, BASE - 13);
          break;
      }
    }
  // Quadrillage
  g.strokeStyle = theme.grid;
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= map.width; x++) {
    g.moveTo(x * BASE + 0.5, 0);
    g.lineTo(x * BASE + 0.5, cv.height);
  }
  for (let y = 0; y <= map.height; y++) {
    g.moveTo(0, y * BASE + 0.5);
    g.lineTo(cv.width, y * BASE + 0.5);
  }
  g.stroke();
  return cv;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function MapCanvas({ room, tool, brush, selectedId, onSelect }: Props) {
  const { pings } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isGM = room.you.isGM;
  const map = room.map;
  const theme = getGenre(room.genre).theme;
  const image = useMemo(() => (map ? renderMap(map, theme) : null), [map, theme]);

  // Vue : décalage en pixels écran et taille d'une case.
  const view = useRef({ ox: 0, oy: 0, cell: 28 });
  const drag = useRef<
    | { type: "pan"; sx: number; sy: number; ox: number; oy: number }
    | { type: "token"; id: string; fromX: number; fromY: number; x: number; y: number }
    | { type: "fog"; cells: Set<number> }
    | null
  >(null);
  const [localFog, setLocalFog] = useState<{ cells: Set<number>; hidden: boolean } | null>(null);
  const [, force] = useState(0);
  const redraw = () => force((n) => n + 1);

  // Cadrer la carte quand elle change.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !map) return;
    const cell = Math.max(10, Math.min(48, Math.floor(Math.min(el.clientWidth / map.width, el.clientHeight / map.height))));
    view.current = { cell, ox: (el.clientWidth - map.width * cell) / 2, oy: (el.clientHeight - map.height * cell) / 2 };
    redraw();
  }, [map?.seed, map?.width, map?.height]);

  // Redimensionnement
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(redraw);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      redraw();
    } else if (d.type === "token") {
      const { x, y } = toCell(e.clientX, e.clientY);
      if (x !== d.x || y !== d.y) {
        d.x = x;
        d.y = y;
        redraw();
      }
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
    redraw();
  }

  function onWheel(e: React.WheelEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }

  function zoomAt(px: number, py: number, factor: number) {
    const v = view.current;
    const cell = Math.max(6, Math.min(96, v.cell * factor));
    const k = cell / v.cell;
    view.current = { cell, ox: px - (px - v.ox) * k, oy: py - (py - v.oy) * k };
    redraw();
  }

  function onDoubleClick(e: React.MouseEvent) {
    const { x, y } = toCell(e.clientX, e.clientY);
    socket.emit("map:ping", { x, y });
  }

  // Raccourcis clavier : flèches pour déplacer le pion sélectionné.
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

  // --- Rendu ---
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr;
      cv.height = h * dpr;
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!map || !image) return;
    const { ox, oy, cell } = view.current;
    (window as unknown as { __forgeTokenScreen: (id: string) => { x: number; y: number } | null }).__forgeTokenScreen = (id) => {
      const t = room.tokens.find((x) => x.id === id);
      return t ? { x: ox + (t.x + 0.5) * cell, y: oy + (t.y + 0.5) * cell } : null;
    };
    g.imageSmoothingEnabled = cell < BASE;
    g.drawImage(image, ox, oy, map.width * cell, map.height * cell);

    // Étiquettes des salles, pour le MJ
    if (isGM && cell >= 14) {
      g.font = `${Math.max(10, cell * 0.38)}px "IM Fell English SC", Georgia, serif`;
      g.textAlign = "center";
      for (const r of map.rooms) {
        if (!r.label) continue;
        const cx = ox + (r.x + r.w / 2) * cell;
        const cy = oy + (r.y + 0.6) * cell;
        g.fillStyle = "#0009";
        g.fillText(r.label, cx + 1, cy + 1);
        g.fillStyle = "#f3e9cf";
        g.fillText(r.label, cx, cy);
      }
    }

    // Pions
    const d = drag.current;
    for (const t of room.tokens) {
      const s = t.size ?? 1;
      const tx = d?.type === "token" && d.id === t.id ? d.x : t.x;
      const ty = d?.type === "token" && d.id === t.id ? d.y : t.y;
      const cx = ox + (tx + s / 2) * cell;
      const cy = oy + (ty + s / 2) * cell;
      const rad = cell * s * 0.42;
      g.globalAlpha = t.hidden ? 0.45 : 1;
      g.fillStyle = "#0007";
      g.beginPath();
      g.arc(cx + 1.5, cy + 2, rad, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = t.color;
      g.beginPath();
      g.arc(cx, cy, rad, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = Math.max(1.5, cell * 0.07);
      g.strokeStyle = t.id === selectedId ? "#e9c46a" : t.ownerId === room.you.id ? "#f5f0e4" : "#1a1410";
      if (t.hidden) g.setLineDash([4, 3]);
      g.stroke();
      g.setLineDash([]);
      if (cell * s >= 16) {
        g.fillStyle = "#fffaf0";
        g.font = `700 ${Math.max(9, rad * 0.8)}px "Source Sans 3", system-ui, sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(initials(t.name), cx, cy + 1);
        g.textBaseline = "alphabetic";
      }
      if (t.hpMax && cell >= 14) {
        const bw = cell * s * 0.8;
        const ratio = Math.max(0, Math.min(1, (t.hp ?? t.hpMax) / t.hpMax));
        g.fillStyle = "#000a";
        g.fillRect(cx - bw / 2, cy + rad + 2, bw, 4);
        g.fillStyle = ratio > 0.5 ? "#5fa052" : ratio > 0.25 ? "#d9a03a" : "#c2412f";
        g.fillRect(cx - bw / 2, cy + rad + 2, bw * ratio, 4);
      }
      if (t.conditions?.length && cell >= 16) {
        g.fillStyle = "#c2412f";
        g.beginPath();
        g.arc(cx + rad * 0.75, cy - rad * 0.75, Math.max(3, cell * 0.1), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    // Brouillard de guerre : opaque pour les joueurs, voilé pour le MJ.
    if (room.fogEnabled && room.fog) {
      const fog = room.fog;
      g.fillStyle = isGM ? "rgba(8,10,12,.55)" : "#0a0d0c";
      for (let y = 0; y < map.height; y++)
        for (let x = 0; x < map.width; x++) {
          const i = y * map.width + x;
          let hidden = fog[i];
          if (localFog?.cells.has(i)) hidden = localFog.hidden;
          if (hidden) g.fillRect(Math.floor(ox + x * cell), Math.floor(oy + y * cell), Math.ceil(cell), Math.ceil(cell));
        }
    }

    // Mesure pendant le déplacement d'un pion
    if (d?.type === "token") {
      const fx = ox + (d.fromX + 0.5) * cell;
      const fy = oy + (d.fromY + 0.5) * cell;
      const tx = ox + (d.x + 0.5) * cell;
      const ty = oy + (d.y + 0.5) * cell;
      g.strokeStyle = "#e9c46a";
      g.lineWidth = 2;
      g.setLineDash([6, 4]);
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(tx, ty);
      g.stroke();
      g.setLineDash([]);
      // Distance façon D&D : une diagonale compte une case.
      const cells = Math.max(Math.abs(d.x - d.fromX), Math.abs(d.y - d.fromY));
      const label = `${cells} case${cells > 1 ? "s" : ""} · ${(cells * METERS_PER_CELL).toLocaleString("fr-FR")} m`;
      g.font = `600 13px "Source Sans 3", system-ui, sans-serif`;
      const wLabel = g.measureText(label).width + 12;
      g.fillStyle = "#14100ce6";
      g.fillRect(tx + 10, ty - 26, wLabel, 20);
      g.fillStyle = "#f3e9cf";
      g.textAlign = "left";
      g.fillText(label, tx + 16, ty - 11);
    }

    // Signaux (double-clic)
    for (const p of pings) {
      const cx = ox + (p.x + 0.5) * cell;
      const cy = oy + (p.y + 0.5) * cell;
      g.strokeStyle = p.color;
      g.lineWidth = 3;
      for (const k of [0.6, 1.1, 1.6]) {
        g.globalAlpha = 1 - k / 2;
        g.beginPath();
        g.arc(cx, cy, cell * k, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  });

  return (
    <div className="map-area" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: isGM && tool !== "deplacer" ? "crosshair" : "grab" }}
        aria-label="Carte de jeu"
      />
      {!map && (
        <div className="map-empty">
          <div>
            <h2>La table est vide</h2>
            <p>{isGM ? "Génère une carte dans l'onglet Carte pour commencer." : "Le maître du jeu prépare la carte…"}</p>
          </div>
        </div>
      )}
      {room.scene && <div className="scene-banner">{room.scene}</div>}
      {map && (
        <div className="map-hint">
          Glisser : déplacer · Molette : zoom · Double-clic : signaler
          <button className="btn small ghost" onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 1.25)} aria-label="Zoomer">
            +
          </button>
          <button className="btn small ghost" onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 0.8)} aria-label="Dézoomer">
            −
          </button>
        </div>
      )}
    </div>
  );
}
