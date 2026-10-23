import { useEffect, useMemo, useRef, useState } from "react";
import { reachable } from "../../../shared/combat";
import { charte } from "../../../shared/charte";
import { DEFAULT_VISION } from "../../../shared/vision";
import type { RoomView, Token } from "../../../shared/types";
import { mapImage } from "../mapImageCache";
import {
  Lighting,
  buildFog,
  drawActiveHalo,
  drawAmbient,
  drawBackdrop,
  drawFog,
  drawMeasure,
  drawPings,
  drawReach,
  drawRoomLabels,
  drawSelection,
  drawPanelFrame,
  drawToken,
  drawGrid,
  drawVignette,
  panelMargin,
  passePartout,
  fogDensity,
  fogLeaks,
  labelBlocker,
  reachLoops,
  seedOf,
} from "../mapTokens";
import { send, socket, useStore, type Ping } from "../store";
import { INTRO_MS } from "./CombatIntro";

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
  // Même cache que l'aperçu du MJ : une carte tirée puis posée n'est pas encrée deux fois.
  const image = useMemo(() => (map ? mapImage(map, room.genre) : null), [map, room.genre]);
  // Lumière : torches des salles calculées une fois par carte, celles des héros à chaque case atteinte.
  const lighting = useMemo(() => (map ? new Lighting(map) : null), [map]);

  const view = useRef({ ox: 0, oy: 0, cell: 28 });
  const drag = useRef<Drag | null>(null);
  const [localFog, setLocalFog] = useState<{ cells: Set<number>; hidden: boolean } | null>(null);
  // Les dernières valeurs, lues par la boucle d'animation sans la redémarrer.
  // Combat : pion dont c'est le tour, et cases qu'il peut atteindre (montrées au MJ et à son joueur).
  const active = room.combat ? room.tokens.find((t) => t.id === room.initiative.entries[room.initiative.turn]?.tokenId) ?? null : null;
  const reach = useMemo(() => {
    if (!map || !active || !(isGM || active.ownerId === room.you.id)) return null;
    const speed = active.speed ?? room.characters.find((c) => c.id === active.characterId)?.speed ?? 6;
    return reachable(map, active, speed);
  }, [map, active?.id, active?.x, active?.y, active?.speed, isGM, room.you.id, room.characters]);
  const accent = charte(room.genre).palette.or;
  const reachShape = useMemo(() => (map && reach ? reachLoops(map, reach) : null), [map, reach]);
  const live = useRef({ room, pings, selectedId, localFog, isGM, active, reachShape, accent, lighting });
  live.current = { room, pings, selectedId, localFog, isGM, active, reachShape, accent, lighting };

  // Pions qui voient pour ce joueur (comme viewFor côté serveur) : le bord de sa vue suit leur polygone de vue.
  const eyesKey =
    !isGM && room.visionMode === "dynamique"
      ? room.tokens
          .filter((t) => t.kind === "joueur" && (room.sharedVision || t.ownerId === room.you.id))
          .map((t) => `${Math.round(t.x)},${Math.round(t.y)},${Math.max(1, Math.min(40, t.vision ?? DEFAULT_VISION))}`)
          .join(";")
      : "";
  // Brouillard d'encre : texture refaite seulement quand ce qui est caché change.
  const fogMask = useMemo(() => {
    if (!map || !room.fogEnabled || !room.fog) return null;
    const density = fogDensity(map.width * map.height, {
      fog: room.fog,
      visible: room.visible,
      dynamic: room.visionMode === "dynamique",
      mapKnown: room.mapKnown,
      isGM,
      override: localFog,
    });
    const eyes = eyesKey ? eyesKey.split(";").map((e) => {
      const [x, y, vision] = e.split(",").map(Number);
      return { x, y, vision };
    }) : [];
    // Un joueur a toujours du brouillard : hors de la carte, rien n'est exploré.
    return !isGM || density.some((v) => v > 0) ? buildFog(map, density, eyes) : null;
  }, [map, room.fog, room.fogEnabled, room.visible, room.visionMode, room.mapKnown, localFog, isGM, eyesKey]);
  // Contrôle de secret pour scripts/apercu-cartes.mjs : cases inexplorées où la carte transparaît (doit rester vide).
  (window as unknown as { __forgeFogLeaks: (opaque?: number) => number[] | null }).__forgeFogLeaks = (opaque) => {
    if (!map || !fogMask || isGM) return null;
    const density = fogDensity(map.width * map.height, { fog: room.fog ?? [], visible: room.visible, dynamic: room.visionMode === "dynamique", mapKnown: room.mapKnown, isGM, override: localFog });
    return fogLeaks(fogMask, density, map.width, map.height, opaque);
  };
  const fogRef = useRef(fogMask);
  fogRef.current = fogMask;

  // Cadrer la carte quand elle change. Le MJ la voit entière ; un joueur arrive sur ce que voit son pion, assez près pour le lire,
  // au lieu d'une tache claire perdue dans le brouillard.
  // Les premières secondes sur une carte, tant que le joueur n'a ni glissé ni zoomé, la vue suit son pion (le serveur le pose,
  // puis la vue arrive) : on recadre doucement à chaque nouvelle position ou vue.
  const mine = isGM ? null : room.tokens.find((t) => t.ownerId === room.you.id && t.kind === "joueur") ?? null;
  const framed = useRef("");
  const autoFrame = useRef(0);
  // Le joueur a glissé ou zoomé lui-même : on ne recadre plus sa vue (même si la fenêtre change de taille).
  const userMoved = useRef(false);
  const visibleKey = room.visible?.length ?? -1;
  // Nombre de cases connues du joueur : quand le MJ cache tout, ou qu'une salle s'ouvre, la vue d'arrivée se recalcule.
  const knownKey = !isGM && room.fogEnabled && room.fog ? room.fog.reduce((n, h) => n + (h ? 0 : 1), 0) : -1;
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !map) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    if (!W || !H) return;
    if (frameIfNew(W, H)) return;
    if (!mine || performance.now() > autoFrame.current || cam.current) return;
    cam.current = { from: { ...view.current }, to: arrivalView(W, H, map.width, map.height, mine, seenBy(room)), start: performance.now(), dur: reducedMotion ? 1 : 450 };
  }, [map?.kind, map?.seed, map?.width, map?.height, map?.name, mine?.id, mine?.x, mine?.y, visibleKey, knownKey]);

  /** Première vue d'une carte (ou d'un nouveau pion) : vue d'arrivée du joueur, carte entière pour le MJ. Vrai si on a cadré. */
  function frameIfNew(W: number, H: number) {
    const { room } = live.current;
    const map = room.map;
    if (!map) return false;
    const me = room.you.isGM ? null : room.tokens.find((t) => t.ownerId === room.you.id && t.kind === "joueur") ?? null;
    const tag = `${map.kind}:${map.seed}:${map.width}:${map.height}:${map.name}:${me?.id ?? ""}`;
    if (framed.current === tag) return false;
    framed.current = tag;
    userMoved.current = false;
    autoFrame.current = me ? performance.now() + 8000 : 0;
    view.current = me ? arrivalView(W, H, map.width, map.height, me, seenBy(room)) : fitView(W, H, map.width, map.height);
    return true;
  }

  // Caméra : en combat, elle plonge sur la zone du combat (pendant que le titre de l'animation s'affiche),
  // puis revient sur toute la carte à la fin.
  const cam = useRef<{ from: typeof view.current; to: typeof view.current; start: number; dur: number } | null>(null);
  const combatId = room.combat?.id ?? null;
  const prevCombat = useRef<string | null>(combatId);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !map || prevCombat.current === combatId) return;
    const fresh = !!room.combat && Date.now() - room.combat.startedAt < 15000;
    prevCombat.current = combatId;
    const W = el.clientWidth;
    const H = el.clientHeight;
    let to: typeof view.current;
    if (room.combat) {
      const f = room.combat.focus;
      const cell = Math.max(10, Math.min(96, Math.min(W / f.w, H / f.h) * 0.94));
      to = { cell, ox: W / 2 - (f.x + f.w / 2) * cell, oy: H / 2 - (f.y + f.h / 2) * cell };
    } else {
      const me = live.current.isGM ? null : room.tokens.find((t) => t.ownerId === room.you.id && t.kind === "joueur");
      to = me ? arrivalView(W, H, map.width, map.height, me, seenBy(room)) : fitView(W, H, map.width, map.height);
    }
    const delay = room.combat && fresh ? INTRO_MS * 0.5 : 0;
    cam.current = { from: { ...view.current }, to, start: performance.now() + delay, dur: reducedMotion ? 1 : 1100 };
  }, [combatId, map]);

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
    autoFrame.current = 0; // le joueur prend la main : la vue ne le suit plus
    userMoved.current = true;
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
    autoFrame.current = 0;
    userMoved.current = true;
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
  const lastSize = useRef<{ w: number; h: number } | null>(null);

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
    const { room, pings, selectedId, isGM, active, reachShape, accent, lighting } = live.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    // Fenêtre redimensionnée (téléphone tourné, panneau replié) : une carte qui tenait entière est recadrée,
    // sinon le point au centre de l'écran y reste.
    const was = lastSize.current;
    lastSize.current = { w, h };
    const m0 = room.map;
    // La case de BD a pu n'avoir aucune taille quand la carte est arrivée : on cadre à la première image utile.
    if (w > 0 && h > 0) frameIfNew(w, h);
    if (was && (was.w !== w || was.h !== h) && m0 && !cam.current && w > 0 && h > 0) {
      const v = view.current;
      // Un joueur qui n'a pas touché à la vue garde sa vue d'arrivée, recalculée pour la nouvelle taille (la case de BD a pu
      // naître petite, pendant la création du personnage).
      const me = isGM ? null : room.tokens.find((t) => t.ownerId === room.you.id && t.kind === "joueur");
      if (me && !userMoved.current) view.current = arrivalView(w, h, m0.width, m0.height, me, seenBy(room));
      else if (v.cell === fitView(was.w, was.h, m0.width, m0.height).cell) view.current = fitView(w, h, m0.width, m0.height);
      else view.current = { cell: v.cell, ox: v.ox + (w - was.w) / 2, oy: v.oy + (h - was.h) / 2 };
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    // Autour de la carte : passe-partout sombre pour le MJ ; pour un joueur, le brouillard continue au-delà du bord.
    const fogged = !isGM && room.fogEnabled;
    drawBackdrop(g, w, h, fogged ? "brouillard" : "passe");
    const map = room.map;
    if (!map || !image) return;
    const c = cam.current;
    if (c && time * 1000 >= c.start) {
      const k = Math.min(1, (time * 1000 - c.start) / c.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; // ease in-out
      // Interpolation en échelle logarithmique : le zoom paraît régulier.
      const cellNow = Math.exp(Math.log(c.from.cell) + (Math.log(c.to.cell) - Math.log(c.from.cell)) * e);
      const lerp = (a: number, b: number) => a + (b - a) * e;
      // On interpole le centre visé, pas les décalages, pour que la zone reste au milieu.
      const cx0 = (w / 2 - c.from.ox) / c.from.cell;
      const cy0 = (h / 2 - c.from.oy) / c.from.cell;
      const cx1 = (w / 2 - c.to.ox) / c.to.cell;
      const cy1 = (h / 2 - c.to.oy) / c.to.cell;
      view.current = { cell: cellNow, ox: w / 2 - lerp(cx0, cx1) * cellNow, oy: h / 2 - lerp(cy0, cy1) * cellNow };
      if (k >= 1) cam.current = null;
    }
    const { ox, oy, cell } = view.current;
    const mw = map.width * cell;
    const mh = map.height * cell;
    (window as unknown as { __forgeTokenScreen: (id: string) => { x: number; y: number } | null }).__forgeTokenScreen = (id) => {
      const t = room.tokens.find((x) => x.id === id);
      return t ? { x: ox + (t.x + 0.5) * cell, y: oy + (t.y + 0.5) * cell } : null;
    };

    // Vue du MJ : la carte se prolonge, floue, dans les bandes vides au lieu d'un aplat noir.
    const filled = !fogged && drawAmbient(g, image, w, h, ox, oy, mw, mh);

    // Ombre de la carte posée sur le passe-partout (vue du MJ) ; pour un joueur, la carte se fond dans le brouillard.
    if (!fogged && !filled) {
      g.save();
      g.shadowColor = "rgba(30,18,6,.55)";
      g.shadowBlur = 18;
      g.shadowOffsetX = 4;
      g.shadowOffsetY = 6;
      g.fillStyle = "#000";
      g.fillRect(ox, oy, mw, mh);
      g.restore();
    }
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(image, ox, oy, mw, mh);
    // Grille repassée : en brun dans l'herbe, en sombre multiplié sur les dalles, pour compter les cases.
    drawGrid(g, map, ox, oy, cell, w, h);

    // Positions animées des pions : ils glissent vers leur nouvelle case au lieu de sauter.
    const d = drag.current;
    const pos = new Map<string, { x: number; y: number }>();
    for (const t of room.tokens) {
      const target = d?.type === "token" && d.id === t.id ? { x: d.x, y: d.y } : { x: t.x, y: t.y };
      const prev = shown.current.get(t.id) ?? target;
      const k = reducedMotion ? 1 : 0.35;
      const p = { x: prev.x + (target.x - prev.x) * k, y: prev.y + (target.y - prev.y) * k };
      if (Math.abs(p.x - target.x) < 0.01 && Math.abs(p.y - target.y) < 0.01) Object.assign(p, target);
      shown.current.set(t.id, p);
      pos.set(t.id, p);
    }

    // Lumière : pénombre froide, torches des salles, et la torche de chaque héros qui vacille avec lui.
    if (lighting) {
      const torches = room.tokens
        .filter((t) => t.kind === "joueur" && !t.hidden)
        .map((t) => ({ ...(pos.get(t.id) ?? t), seed: seedOf(t.id) }));
      lighting.draw(g, torches, ox, oy, cell, w, h, time, reducedMotion);
      // Ombres portées à l'encre, à l'opposé de la lumière la plus proche.
      lighting.drawShadows(
        g,
        room.tokens.filter((t) => !(t.hidden && !isGM)).map((t) => ({ ...(pos.get(t.id) ?? t), size: t.size ?? 1, seed: seedOf(t.id) })),
        torches,
        ox,
        oy,
        cell,
      );
    }

    // Étiquettes des salles, pour le MJ
    if (isGM) drawRoomLabels(g, map, ox, oy, cell);

    // Combat : cases atteignables du pion dont c'est le tour, puis auréole sous ce pion.
    if (reachShape && active) drawReach(g, reachShape, ox, oy, cell, accent, time, reducedMotion);
    if (active) {
      const p = pos.get(active.id) ?? active;
      const s = active.size ?? 1;
      drawActiveHalo(g, ox + (p.x + s / 2) * cell, oy + (p.y + s / 2) * cell, cell * s, time, accent, reducedMotion);
    }

    // Pions
    for (const t of room.tokens) {
      const p = pos.get(t.id) ?? t;
      const s = t.size ?? 1;
      const cx = ox + (p.x + s / 2) * cell;
      const cy = oy + (p.y + s / 2) * cell;
      const sheet = t.characterId ? room.characters.find((c) => c.id === t.characterId) : undefined;
      if (t.id === selectedId) drawSelection(g, t.id, cx, cy, cell * s, time, reducedMotion, t.color);
      drawToken(g, t, cx, cy, cell * s, {
        mine: t.ownerId === room.you.id,
        dpr,
        portrait: sheet?.portrait ? portraitImage(sheet.portrait) : null,
        role: sheet?.archetype,
      });
    }

    // Brouillard : grisaille de l'exploré, encre et fumée de l'inexploré.
    const fog = fogRef.current;
    if (fog) drawFog(g, fog, ox, oy, cell, map.width, map.height, w, h);

    // Mesure pendant le déplacement d'un pion
    if (d?.type === "token") {
      const cells = Math.max(Math.abs(d.x - d.fromX), Math.abs(d.y - d.fromY));
      const label = `${cells} case${cells > 1 ? "s" : ""} · ${(cells * METERS_PER_CELL).toLocaleString("fr-FR")} m`;
      drawMeasure(g, ox + (d.fromX + 0.5) * cell, oy + (d.fromY + 0.5) * cell, ox + (d.x + 0.5) * cell, oy + (d.y + 0.5) * cell, label, cell, labelBlocker(map, ox, oy, cell));
    }

    drawPings(g, pings, ox, oy, cell, time);
    drawVignette(g, w, h, !!room.combat, map.kind === "nature");
    // Cadre de case de BD : gouttière de papier, trait d'encre à peine tremblé, vignettage du pourtour.
    drawPanelFrame(g, w, h, dpr);
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
        <>
          <div className="map-hint">Glisser : déplacer · Molette : zoom · Double-clic : signaler</div>
          <div className="map-zoom">
            <button onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 1.25)} aria-label="Zoomer">+</button>
            <button onClick={() => zoomAt((wrapRef.current?.clientWidth ?? 0) / 2, (wrapRef.current?.clientHeight ?? 0) / 2, 0.8)} aria-label="Dézoomer">−</button>
          </div>
        </>
      )}
    </div>
  );
}

/** Carte entière dans la case de BD, posée sur le passe-partout : ajustée au plus juste (sans arrondi), et si elle laisse moins
 * de 4 % de vide d'un côté, on la pose bord à bord (au plus 2 % rogné) : le dessin touche le passe-partout. */
function fitView(W: number, H: number, mw: number, mh: number) {
  const m = (panelMargin(W) + passePartout(W)) * 2;
  const contain = Math.min((W - m) / mw, (H - m) / mh);
  const cover = Math.max((W - m) / mw, (H - m) / mh);
  const cell = Math.max(8, Math.min(56, cover / contain < 1.04 ? cover : contain));
  return { cell, ox: (W - mw * cell) / 2, oy: (H - mh * cell) / 2 };
}

/** Cases que le joueur voit ou a déjà explorées : c'est elles que la vue d'arrivée cadre. */
function seenBy(room: RoomView): (i: number) => boolean {
  if (!room.fogEnabled || !room.fog) return () => true;
  const fog = room.fog;
  const vis = room.visionMode === "dynamique" && room.visible?.length ? new Set(room.visible) : null;
  return (i) => !fog[i] || !!vis?.has(i);
}

/**
 * Vue d'arrivée d'un joueur sur une carte. Boîte englobante de ce qu'il connaît autour de son pion (cases vues ou explorées,
 * à 14 cases au plus) et de 6 cases tout autour du pion, plus 2 cases de marge. Centre pondéré : 60 % le pion, 40 % la boîte.
 * Le zoom fait occuper à la boîte 78 % de la case de BD, avec une case d'au moins 56 px à l'écran (on lit les pions et le
 * décor) et au plus 2,5 fois la vue d'ensemble (64 px au moins). Si le pion sortait du champ, la vue glisse juste assez.
 */
function arrivalView(W: number, H: number, mw: number, mh: number, t: { x: number; y: number }, seen: (i: number) => boolean) {
  const tx = Math.round(t.x);
  const ty = Math.round(t.y);
  let x0 = tx - 6;
  let x1 = tx + 7;
  let y0 = ty - 6;
  let y1 = ty + 7;
  for (let y = Math.max(0, ty - 14); y <= Math.min(mh - 1, ty + 14); y++)
    for (let x = Math.max(0, tx - 14); x <= Math.min(mw - 1, tx + 14); x++)
      if (seen(y * mw + x)) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x + 1);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y + 1);
      }
  x0 -= 2;
  y0 -= 2;
  x1 += 2;
  y1 += 2;
  const px = t.x + 0.5;
  const py = t.y + 0.5;
  const cx = px * 0.6 + ((x0 + x1) / 2) * 0.4;
  const cy = py * 0.6 + ((y0 + y1) / 2) * 0.4;
  const hx = Math.max(cx - x0, x1 - cx);
  const hy = Math.max(cy - y0, y1 - cy);
  const inner = panelMargin(W) * 2;
  const iw = W - inner;
  const ih = H - inner;
  const fit = fitView(W, H, mw, mh).cell;
  const share = W < 600 ? 0.7 : 0.78;
  const want = Math.min((iw * share) / (hx * 2), (ih * share) / (hy * 2));
  // Sur téléphone, cadrage plus large : 42 px par case au moins (une dizaine de cases en largeur) au lieu de 56.
  const floor = W < 600 ? 42 : 56;
  const cell = Math.max(floor, Math.min(want, Math.max(64, fit * 2.5)));
  let ox = W / 2 - cx * cell;
  let oy = H / 2 - cy * cell;
  // Le pion reste à une case et demie au moins du cadre.
  const keep = (o: number, p: number, span: number) => {
    const s = o + p * cell;
    const lo = panelMargin(W) + cell * 1.5;
    const hi = span - panelMargin(W) - cell * 1.5;
    if (hi <= lo) return span / 2 - p * cell;
    return s < lo ? o + lo - s : s > hi ? o + hi - s : o;
  };
  ox = keep(ox, px, W);
  oy = keep(oy, py, H);
  return { cell, ox, oy };
}

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
