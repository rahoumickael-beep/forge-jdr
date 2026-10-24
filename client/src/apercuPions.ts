// Aperçu des pions, de la lumière et du brouillard : apercu.html?kind=donjon&seed=391&pions=1 (vue d'un joueur)
// ou pions=mj (vue du MJ). Quelques pions d'exemple posés autour du centre de la carte, dans le même ordre
// de dessin que la table (MapCanvas), à 48 px par case.
import { reachable } from "../../shared/maps";
import { T, type GameMap, type Token } from "../../shared/types";
import { visibleCells, visibleFrom } from "../../shared/vision";
import { BASE } from "./mapUtil";
import { Lighting, buildFog, drawActiveHalo, drawPanelFrame, drawFog, drawGrid, drawMeasure, drawPings, drawReach, drawRoomLabels, drawSelection, drawToken, drawVignette, fogDensity, labelBlocker, reachLoops, seedOf } from "./mapTokens";

// Classes des pions d'exemple (la coiffe du buste en dépend) ; Ser Corwin n'a pas de fiche : il garde son initiale.
const ROLES: Record<string, string> = { p1: "Paladin", p2: "Magicienne", p3: "Voleur", p4: "Druide", n1: "Clerc" };

export function renderTokensPreview(map: GameMap, image: HTMLCanvasElement, mode: string, time = 1.7): HTMLCanvasElement {
  const isGM = mode === "mj";
  const W = map.width;
  const H = map.height;
  const walk = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && [T.sol, T.route, T.porte, T.vegetation].includes(map.tiles[y * W + x] as 1);
  const used = new Set<number>();
  const free = (cx: number, cy: number): [number, number] => {
    for (let d = 0; d < 30; d++)
      for (let dy = -d; dy <= d; dy++)
        for (let dx = -d; dx <= d; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
          const x = Math.round(cx) + dx;
          const y = Math.round(cy) + dy;
          if (walk(x, y) && !used.has(y * W + x)) {
            used.add(y * W + x);
            return [x, y];
          }
        }
    return [Math.round(cx), Math.round(cy)];
  };
  // Salle la plus proche du centre pour les héros, la suivante pour les monstres.
  const mid = { x: W / 2, y: H / 2 };
  const rooms = [...map.rooms].sort((a, b) => Math.hypot(a.x + a.w / 2 - mid.x, a.y + a.h / 2 - mid.y) - Math.hypot(b.x + b.w / 2 - mid.x, b.y + b.h / 2 - mid.y));
  const r0 = rooms[0] ? { x: rooms[0].x + rooms[0].w / 2, y: rooms[0].y + rooms[0].h / 2 } : mid;
  const r1 = rooms[1] ? { x: rooms[1].x + rooms[1].w / 2, y: rooms[1].y + rooms[1].h / 2 } : { x: mid.x + 6, y: mid.y };
  const toward = { x: r0.x + (r1.x - r0.x) * 0.55, y: r0.y + (r1.y - r0.y) * 0.55 };
  const mk = (id: string, name: string, color: string, kind: Token["kind"], at: { x: number; y: number }, extra: Partial<Token> = {}): Token => {
    const [x, y] = free(at.x, at.y);
    return { id, name, color, kind, x, y, ...extra };
  };
  const tokens: Token[] = [
    mk("p1", "Aldric Veyne", "#a8342a", "joueur", r0, { hp: 27, hpMax: 30, ownerId: "moi" }),
    mk("p2", "Mira", "#2f6497", "joueur", { x: r0.x + 1, y: r0.y }, { hp: 18, hpMax: 18 }),
    mk("p3", "Tobias Fenn", "#3d7a42", "joueur", { x: r0.x, y: r0.y + 1 }, { hp: 4, hpMax: 22, conditions: ["empoisonné", "à terre"] }),
    mk("p4", "Ysolde", "#b07d2c", "joueur", { x: r0.x - 1, y: r0.y + 1 }, { hp: 9, hpMax: 20, conditions: ["effrayé", "empoisonné", "aveuglé"] }),
    mk("p5", "Ser Corwin", "#6d4a8a", "joueur", { x: r0.x - 1, y: r0.y - 1 }, { hp: 0, hpMax: 26 }),
    mk("m1", "Goule", "#6b7a3a", "monstre", toward, { hp: 22, hpMax: 22 }),
    mk("m2", "Goule 2", "#6b7a3a", "monstre", { x: toward.x + 1, y: toward.y + 1 }, { hp: 9, hpMax: 22 }),
    mk("m3", "Connétable d'os", "#8a7350", "monstre", r1, { hp: 60, hpMax: 75, size: 2 }),
    mk("m5", "Loup des cendres", "#7a6a58", "monstre", { x: toward.x + 2, y: toward.y - 1 }, { hp: 14, hpMax: 14 }),
    mk("m6", "Diablotin", "#9a3a22", "monstre", { x: toward.x - 1, y: toward.y + 1 }, { hp: 3, hpMax: 10 }),
    mk("n1", "Frère Anselme", "#7c7466", "pnj", { x: r0.x + 2, y: r0.y - 2 }),
    mk("o1", "Coffre", "#a07a3a", "objet", { x: r0.x + 3, y: r0.y + 2 }),
  ];
  if (isGM) tokens.push(mk("m4", "Ombre", "#2c2c3a", "monstre", { x: toward.x - 2, y: toward.y + 2 }, { hidden: true }));
  const players = tokens.filter((t) => t.kind === "joueur");
  const active = tokens[1];
  const reach = reachable(map, active, 6);

  // Brouillard : les héros ont déjà exploré leur salle et les salles voisines (ce qu'on en voit depuis leur centre),
  // ils voient ce que voient leurs pions ; le reste est inexploré.
  const explored = new Set<number>();
  for (const r of rooms.slice(0, 4)) visibleFrom(map, Math.floor(r.x + r.w / 2), Math.floor(r.y + r.h / 2), 7, explored);
  const fog = Array.from({ length: W * H }, (_, i) => !explored.has(i));
  const density = fogDensity(W * H, { fog, visible: [...visibleCells(map, players.map((p) => ({ ...p, vision: 7 })))], dynamic: true, mapKnown: false, isGM });

  // Vue d'un joueur : comme viewFor côté serveur, les pions qu'on ne voit pas maintenant ne sont pas envoyés.
  if (!isGM) {
    const seen = new Set([...visibleCells(map, players.map((p) => ({ ...p, vision: 7 })))]);
    for (let i = tokens.length - 1; i >= 0; i--) if (tokens[i].kind !== "joueur" && !seen.has(tokens[i].y * W + tokens[i].x)) tokens.splice(i, 1);
  }

  const cell = Number(new URLSearchParams(location.search).get("case")) || BASE; // case=28 : taille habituelle à la table
  const cv = document.createElement("canvas");
  cv.width = W * cell;
  cv.height = H * cell;
  const g = cv.getContext("2d")!;
  const t0 = performance.now();
  const light = new Lighting(map);
  const fogTex = buildFog(map, density, isGM ? [] : players.map((p) => ({ x: p.x, y: p.y, vision: 7 })));
  const loops = reachLoops(map, reach);
  const setup = performance.now() - t0;
  // Deux passes : la première remplit les caches (médaillons, torches), la seconde mesure une image ordinaire.
  // Brouillard : premier calcul (fonds de la carte compris), puis un recalcul ordinaire, comme après un pas.
  const fogAgain = performance.now();
  buildFog(map, density, isGM ? [] : players.map((p) => ({ x: p.x, y: p.y, vision: 7 })));
  const steps: Record<string, number> = { brouillardInitial: fogTex.ms, brouillardRecalcul: Math.round(performance.now() - fogAgain) };
  let tk = 0;
  const lap = (name: string) => {
    const now = performance.now();
    steps[name] = Math.round((steps[name] ?? 0) + now - tk);
    tk = now;
  };
  const paint = () => {
    tk = performance.now();
    g.drawImage(image, 0, 0, cv.width, cv.height);
    drawGrid(g, map, 0, 0, cell, cv.width, cv.height);
    const bearers = players.filter((p) => (p.hp ?? 1) > 0).map((p) => ({ x: p.x, y: p.y, seed: seedOf(p.id) }));
    light.draw(g, bearers, 0, 0, cell, cv.width, cv.height, time);
    light.drawShadows(g, tokens.filter((t) => isGM || !t.hidden).map((t) => ({ x: t.x, y: t.y, size: t.size ?? 1, seed: seedOf(t.id) })), bearers, 0, 0, cell);
    lap("lumiere");
    if (isGM) drawRoomLabels(g, map, 0, 0, cell);
    drawReach(g, loops, 0, 0, cell, "#d9a441", time);
    drawActiveHalo(g, (active.x + 0.5) * cell, (active.y + 0.5) * cell, cell, time, "#d9a441");
    for (const t of tokens) {
      const s = t.size ?? 1;
      const cx = (t.x + s / 2) * cell;
      const cy = (t.y + s / 2) * cell;
      if (t.id === "p1") drawSelection(g, t.id, cx, cy, cell * s, time, false, t.color);
      drawToken(g, t, cx, cy, cell * s, { mine: t.ownerId === "moi", role: ROLES[t.id] });
    }
    lap("pions");
    drawFog(g, fogTex, 0, 0, cell, W, H, cv.width, cv.height);
    lap("brouillard");
    const p4 = tokens[3];
    drawMeasure(g, (p4.x + 0.5) * cell, (p4.y + 0.5) * cell, (p4.x - 3 + 0.5) * cell, (p4.y + 2 + 0.5) * cell, "3 cases · 4,5 m", cell, labelBlocker(map, 0, 0, cell));
    drawPings(g, [{ id: 4, x: Math.round(toward.x) + 3, y: Math.round(toward.y) - 2, color: "#2f6497", name: "Mira" }], 0, 0, cell, time);
    drawVignette(g, cv.width, cv.height, false, map.kind === "nature");
    drawPanelFrame(g, cv.width, cv.height, 1);
    lap("fin");
  };
  paint();
  const t1 = performance.now();
  paint();
  const frame = performance.now() - t1;
  (window as unknown as { pions: object }).pions = { setup: Math.round(setup), brouillard: fogTex.ms, frame: Math.round(frame), steps };
  return cv;
}
