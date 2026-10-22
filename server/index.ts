// Serveur : sert le client, gère les parties en temps réel (Socket.IO) et l'IA Claude optionnelle.
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { Server, type Socket } from "socket.io";
import { rollDice } from "../shared/dice";
import { uid } from "../shared/random";
import type { Character, GameMap, InitiativeEntry, Player, RoomState, Scenario, Token } from "../shared/types";
import { claudeAvailable, generateWithClaude } from "./claude";
import { addPlayer, createRoom, getRoom, loadRooms, log, MAX_PLAYERS, saveSoon, viewFor, type StoredRoom } from "./rooms";

// Charge .env sans dépendance supplémentaire.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PORT = Number(process.env.PORT) || 3001;
const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/sante", (_req, res) => res.json({ ok: true, claude: claudeAvailable() }));

app.post("/api/claude", async (req, res) => {
  const room = getRoom(String(req.body?.code ?? ""));
  if (!room || req.body?.gmKey !== room.gmKey) return res.status(403).json({ error: "Réservé au maître du jeu." });
  if (!claudeAvailable()) return res.status(503).json({ error: "Aucune clé ANTHROPIC_API_KEY configurée sur le serveur." });
  try {
    res.json({ text: await generateWithClaude(req.body.system, req.body.user) });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const dist = join(process.cwd(), "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/(api|socket\.io)).*/, (_req, res) => res.sendFile(join(dist, "index.html")));
}

const http = createServer(app);
const io = new Server(http, { maxHttpBufferSize: 4e6 });

interface Session {
  room: StoredRoom;
  player: Player;
}

type Ack = (res: { ok: boolean; error?: string; [k: string]: unknown }) => void;

/** Envoie à chaque joueur connecté sa propre vue de la partie. */
async function broadcast(room: StoredRoom) {
  saveSoon(room.state.code);
  const sockets = await io.in(room.state.code).fetchSockets();
  for (const s of sockets) {
    const session = s.data.session as Session | undefined;
    if (!session) continue;
    const player = room.state.players.find((p) => p.id === session.player.id);
    if (player) s.emit("state", viewFor(room, player));
  }
}

function attach(socket: Socket, room: StoredRoom, player: Player) {
  player.online = true;
  socket.data.session = { room, player } satisfies Session;
  socket.join(room.state.code);
}

io.on("connection", (socket) => {
  const session = () => socket.data.session as Session | undefined;

  /** Exécute une action réservée au MJ puis diffuse l'état. */
  const gm = <T>(event: string, fn: (state: RoomState, payload: T, room: StoredRoom) => void) =>
    socket.on(event, (payload: T, ack?: Ack) => {
      const s = session();
      if (!s?.player.isGM) return ack?.({ ok: false, error: "Réservé au maître du jeu." });
      try {
        fn(s.room.state, payload, s.room);
        ack?.({ ok: true });
        void broadcast(s.room);
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    });

  socket.on("room:create", (p: { name: string; genre: RoomState["genre"]; ton: RoomState["ton"]; level: number; gmName: string }, ack: Ack) => {
    const { stored, gm: gmPlayer } = createRoom(p);
    attach(socket, stored, gmPlayer);
    log(stored, { from: "Système", text: `Partie « ${stored.state.name} » créée.`, kind: "systeme" });
    ack({ ok: true, code: stored.state.code, playerId: gmPlayer.id, gmKey: stored.gmKey });
    void broadcast(stored);
  });

  socket.on("room:join", (p: { code: string; name: string; playerId?: string; gmKey?: string }, ack: Ack) => {
    const room = getRoom(String(p.code || ""));
    if (!room) return ack({ ok: false, error: "Aucune partie avec ce code." });
    let player = p.playerId ? room.state.players.find((x) => x.id === p.playerId) : undefined;
    if (player?.isGM && p.gmKey !== room.gmKey) player = undefined;
    if (!player && p.gmKey && p.gmKey === room.gmKey) player = room.state.players.find((x) => x.isGM);
    if (!player) {
      if (room.state.players.length >= MAX_PLAYERS) return ack({ ok: false, error: "La table est complète." });
      player = addPlayer(room, String(p.name || ""));
      log(room, { from: "Système", text: `${player.name} rejoint la table.`, kind: "systeme" });
    }
    attach(socket, room, player);
    ack({ ok: true, code: room.state.code, playerId: player.id, isGM: player.isGM });
    void broadcast(room);
  });

  socket.on("disconnect", async () => {
    const s = session();
    if (!s) return;
    const others = (await io.in(s.room.state.code).fetchSockets()).filter((x) => (x.data.session as Session | undefined)?.player.id === s.player.id);
    if (!others.length) s.player.online = false;
    void broadcast(s.room);
  });

  // --- Pions ---
  socket.on("token:move", (p: { id: string; x: number; y: number }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const token = st.tokens.find((t) => t.id === p.id);
    if (!token) return ack?.({ ok: false, error: "Pion introuvable." });
    const own = token.ownerId === s.player.id;
    if (!s.player.isGM && (!own || st.movementLocked)) return ack?.({ ok: false, error: st.movementLocked ? "Le MJ a bloqué les déplacements." : "Ce pion n'est pas à toi." });
    const w = st.map?.width ?? 40;
    const h = st.map?.height ?? 30;
    token.x = Math.max(0, Math.min(w - 1, Math.round(p.x)));
    token.y = Math.max(0, Math.min(h - 1, Math.round(p.y)));
    ack?.({ ok: true });
    void broadcast(s.room);
  });

  /** Un joueur peut créer et modifier son propre pion ; le MJ, tous. */
  socket.on("token:upsert", (t: Token, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const existing = st.tokens.find((x) => x.id === t.id);
    if (!s.player.isGM) {
      if (existing && existing.ownerId !== s.player.id) return ack?.({ ok: false, error: "Ce pion n'est pas à toi." });
      if (!existing && st.tokens.filter((x) => x.ownerId === s.player.id).length >= 2) return ack?.({ ok: false, error: "Deux pions maximum par joueur." });
      t = { ...t, ownerId: s.player.id, kind: "joueur", hidden: false };
    }
    const clean: Token = { ...t, id: t.id || uid("t_"), name: String(t.name || "Pion").slice(0, 40) };
    if (existing) Object.assign(existing, clean);
    else st.tokens.push(clean);
    ack?.({ ok: true, id: clean.id });
    void broadcast(s.room);
  });

  socket.on("token:remove", (id: string, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const token = st.tokens.find((t) => t.id === id);
    if (!token || (!s.player.isGM && token.ownerId !== s.player.id)) return ack?.({ ok: false, error: "Impossible." });
    st.tokens = st.tokens.filter((t) => t.id !== id);
    ack?.({ ok: true });
    void broadcast(s.room);
  });

  // --- Dés ---
  socket.on("dice:roll", (p: { expr: string; label?: string; secret?: boolean }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    try {
      const r = rollDice(p.expr);
      const crit = /^1?d20/i.test(r.expression) && r.kept.length === 1 ? (r.kept[0] === 20 ? " — réussite critique !" : r.kept[0] === 1 ? " — échec critique !" : "") : "";
      log(s.room, {
        from: s.player.name,
        fromId: s.player.id,
        text: `${p.label ? p.label + " : " : ""}${r.expression} → ${r.total} ${r.detail}${crit}`,
        kind: "des",
        secret: !!p.secret,
      });
      ack?.({ ok: true, total: r.total });
      void broadcast(s.room);
    } catch (err) {
      ack?.({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  /** Signal visuel temporaire sur la carte (pas sauvegardé). */
  socket.on("map:ping", (p: { x: number; y: number }) => {
    const s = session();
    if (!s) return;
    io.to(s.room.state.code).emit("map:ping", { x: p.x, y: p.y, color: s.player.color, name: s.player.name });
  });

  /** Fiche de personnage : le MJ ou le joueur propriétaire du pion lié. */
  socket.on("character:upsert", (c: Character & { ownerId?: string }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const linked = st.tokens.find((t) => t.characterId === c.id);
    if (!s.player.isGM && linked && linked.ownerId !== s.player.id) return ack?.({ ok: false, error: "Ce personnage n'est pas à toi." });
    const i = st.characters.findIndex((x) => x.id === c.id);
    if (i >= 0) st.characters[i] = c;
    else st.characters.push(c);
    if (linked) {
      linked.hp = c.hp;
      linked.hpMax = c.hpMax;
      linked.ac = c.ac;
      linked.name = c.name;
    }
    ack?.({ ok: true });
    void broadcast(s.room);
  });

  // --- Actions du MJ ---
  gm<Token[]>("token:bulk", (st, tokens) => st.tokens.push(...tokens.map((t) => ({ ...t, id: t.id || uid("t_") }))));
  gm<string>("character:remove", (st, id) => (st.characters = st.characters.filter((c) => c.id !== id)));
  gm<{ map: GameMap; keepTokens?: boolean }>("map:set", (st, p, room) => {
    st.map = p.map;
    st.fog = new Array(p.map.width * p.map.height).fill(st.fogEnabled);
    if (!p.keepTokens) st.tokens = st.tokens.filter((t) => t.kind === "joueur");
    for (const t of st.tokens) {
      t.x = Math.min(t.x, p.map.width - 1);
      t.y = Math.min(t.y, p.map.height - 1);
    }
    log(room, { from: "MJ", text: `Nouvelle carte : ${p.map.name}.`, kind: "systeme" });
  });
  gm<{ cells: number[]; hidden: boolean }>("fog:paint", (st, p) => {
    if (!st.fog) return;
    for (const c of p.cells) if (c >= 0 && c < st.fog.length) st.fog[c] = p.hidden;
  });
  gm<{ hidden: boolean }>("fog:all", (st, p) => st.fog && st.fog.fill(p.hidden));
  gm<{ enabled: boolean }>("fog:enabled", (st, p) => (st.fogEnabled = p.enabled));
  gm<{ text: string }>("narrate", (_st, p, room) => log(room, { from: "MJ", text: String(p.text).slice(0, 4000), kind: "narration" }));
  gm<{ text: string }>("scene:set", (st, p) => (st.scene = String(p.text).slice(0, 2000)));
  gm<{ text: string }>("notes:set", (st, p) => (st.gmNotes = String(p.text).slice(0, 50000)));
  gm<{ entries: InitiativeEntry[] }>("initiative:set", (st, p) => (st.initiative = { entries: [...p.entries].sort((a, b) => b.value - a.value), turn: 0, round: 1 }));
  gm<{ delta: 1 | -1 }>("initiative:step", (st, p) => {
    const n = st.initiative.entries.length;
    if (!n) return;
    let turn = st.initiative.turn + p.delta;
    if (turn >= n) {
      turn = 0;
      st.initiative.round++;
    } else if (turn < 0) {
      turn = n - 1;
      st.initiative.round = Math.max(1, st.initiative.round - 1);
    }
    st.initiative.turn = turn;
  });
  gm<{ title: string; text: string }>("handout:add", (st, p) => st.handouts.unshift({ id: uid("h_"), title: p.title.slice(0, 120), text: p.text.slice(0, 8000), at: Date.now() }));
  gm<string>("handout:remove", (st, id) => (st.handouts = st.handouts.filter((h) => h.id !== id)));
  gm<Scenario>("scenario:add", (st, sc) => st.scenarios.unshift(sc));
  gm<string>("scenario:remove", (st, id) => (st.scenarios = st.scenarios.filter((x) => x.id !== id)));
  gm<Partial<Pick<RoomState, "name" | "genre" | "ton" | "level" | "movementLocked">>>("settings:set", (st, p) => {
    if (typeof p.name === "string") st.name = p.name.slice(0, 80);
    if (p.genre) st.genre = p.genre;
    if (p.ton) st.ton = p.ton;
    if (typeof p.level === "number") st.level = Math.max(1, Math.min(20, p.level));
    if (typeof p.movementLocked === "boolean") st.movementLocked = p.movementLocked;
  });
  gm<string>("player:kick", (st, id, room) => {
    const p = st.players.find((x) => x.id === id && !x.isGM);
    if (!p) return;
    st.players = st.players.filter((x) => x.id !== id);
    st.tokens = st.tokens.filter((t) => t.ownerId !== id);
    log(room, { from: "Système", text: `${p.name} a quitté la table.`, kind: "systeme" });
  });
  gm<RoomState>("room:import", (st, data) => {
    if (!data || typeof data !== "object" || !Array.isArray(data.tokens)) throw new Error("Fichier de partie invalide.");
    const keep = { code: st.code, players: st.players };
    Object.assign(st, data, keep);
  });
});

loadRooms();
http.listen(PORT, () => console.log(`Forge JdR prête sur http://localhost:${PORT}`));
