// Serveur : sert le client, gère les parties en temps réel (Socket.IO) et l'IA Claude optionnelle.
import { autoCombat, endCombat, monstersSeen, startCombat, type Combat } from "../shared/combat";
import { DEATH_RULES } from "../shared/rules";
import { nomVuParLesJoueurs } from "../shared/bestiary";
import { nettoyerCarte } from "../shared/cartes";
import { carteDuCatalogue, collectionVide, tirerPaquet } from "../shared/collection";
import { cloreSeance, nettoyerCampagne, noterFait, ouvrirSeance, reglerJauge, reglerReserve } from "../shared/campagne";
import { canonDe } from "../shared/canon";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { Server, type Socket } from "socket.io";
import { rollDice } from "../shared/dice";
import { ACTIONS, jouerAction, nettoyerVaisseaux, nouveauRound, nouveauVaisseau, POSTES, synchroniserPions, type Poste, type Vaisseau } from "../shared/vaisseaux";
import { uid } from "../shared/random";
import { T, type Character, type GameMap, type InitiativeEntry, type Player, type RoomState, type Scenario, type Token } from "../shared/types";
import { COOKIE_MJ, cookieMJ, estMJ, FICHIER_MJ } from "./acces-mj";
import { claudeAvailable, generateWithClaude } from "./claude";
import { addPlayer, characterOwner, createRoom, getRoom, hideUnseen, isGenre, isTon, loadRooms, log, MAX_PLAYERS, sanitizeImport, saveSoon, updateExplored, viewFor, type StoredRoom } from "./rooms";

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

// Clé du MJ en cookie, pour que le navigateur puisse charger le code du MJ (voir acces-mj.ts).
app.post("/api/mj/acces", (req, res) => {
  const valeur = cookieMJ(req.body?.code, req.body?.gmKey);
  if (!valeur) return res.status(403).json({ error: "Réservé au maître du jeu." });
  res.setHeader("Set-Cookie", `${COOKIE_MJ}=${valeur}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`);
  res.json({ ok: true });
});

const dist = join(process.cwd(), "dist");
if (existsSync(dist)) {
  app.use((req, res, next) => (FICHIER_MJ.test(req.path) && !estMJ(req.headers.cookie) ? res.status(403).send("Réservé au maître du jeu.") : next()));
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
  updateExplored(room);
  const combat = autoCombat(room.state);
  if (combat) announce(room, combat);
  saveSoon(room.state.code);
  const sockets = await io.in(room.state.code).fetchSockets();
  for (const s of sockets) {
    const session = s.data.session as Session | undefined;
    if (!session) continue;
    const player = room.state.players.find((p) => p.id === session.player.id);
    if (player) s.emit("state", hideUnseen(viewFor(room, player)));
  }
}

/** Écrit le début du combat dans le journal ; le MJ reçoit l'ordre complet, les joueurs ce qu'ils voient. */
function announce(room: StoredRoom, combat: Combat) {
  const st = room.state;
  // Message public : les créatures y portent leur nom public.
  const names = combat.monsterIds.map((id) => st.tokens.find((t) => t.id === id)).filter((t) => !!t).map((t) => nomVuParLesJoueurs(t.name, t.creatureId));
  log(room, { from: "MJ", text: combat.cause === "auto" ? `Combat ! ${names.join(", ")} surgit devant le groupe.` : "Le combat commence.", kind: "narration" });
  noterFait(st.campagne, `Combat contre ${names.join(", ") || "des adversaires"}.`);
  log(room, { from: "Système", text: `Initiative : ${st.initiative.entries.map((e) => `${e.name} (${e.value})`).join(", ")}.`, kind: "systeme", secret: true });
}

/** La case praticable libre la plus proche du centre de la carte. */
function caseLibre(st: RoomState): { x: number; y: number } {
  const map = st.map!;
  const prises = new Set(st.tokens.map((t) => Math.round(t.y) * map.width + Math.round(t.x)));
  const cx = Math.floor(map.width / 2);
  const cy = Math.floor(map.height / 2);
  let meilleur = { x: cx, y: cy, d: Infinity };
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      const i = y * map.width + x;
      const tuile = map.tiles[i];
      if (prises.has(i) || tuile === T.mur || tuile === T.vide) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < meilleur.d) meilleur = { x, y, d };
    }
  return { x: meilleur.x, y: meilleur.y };
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
      const sheet = t.characterId ? st.characters.find((c) => c.id === t.characterId) : undefined;
      if (t.characterId && (!sheet || characterOwner(st, sheet) !== s.player.id)) return ack?.({ ok: false, error: "Cette fiche n'est pas à toi." });
      t = { ...t, ownerId: s.player.id, kind: "joueur", hidden: false, vision: existing?.vision };
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
        roll: { sides: r.sides, rolls: r.rolls.slice(0, 20), kept: r.kept.slice(0, 20), modifier: r.modifier, total: r.total },
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
    if (!c || typeof c.id !== "string" || !c.id) return ack?.({ ok: false, error: "Fiche invalide." });
    const linked = st.tokens.find((t) => t.characterId === c.id);
    const i = st.characters.findIndex((x) => x.id === c.id);
    const owner = i >= 0 ? characterOwner(st, st.characters[i]) : undefined;
    if (!s.player.isGM) {
      // Un joueur ne touche qu'à ses fiches, et n'en crée que deux.
      if (i >= 0 && owner !== s.player.id) return ack?.({ ok: false, error: "Ce personnage n'est pas à toi." });
      if (i < 0 && st.characters.filter((x) => characterOwner(st, x) === s.player.id).length >= 2) return ack?.({ ok: false, error: "Deux personnages maximum par joueur." });
    }
    c = { ...c, name: String(c.name || "Sans nom").slice(0, 60), ownerId: s.player.isGM ? owner : s.player.id };
    if (c.portrait && c.portrait.length > 300_000) delete c.portrait;
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
    noterFait(st.campagne, `Arrivée : ${p.map.name}.`);
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
  gm<{ tokenIds?: string[] }>("combat:start", (st, p, room) => {
    const chosen = (p?.tokenIds ?? []).map((id) => st.tokens.find((t) => t.id === id && t.kind === "monstre")).filter((t): t is Token => !!t);
    const triggers = chosen.length ? chosen : monstersSeen(st).length ? monstersSeen(st) : st.tokens.filter((t) => t.kind === "monstre" && !t.hidden);
    if (!triggers.length) throw new Error("Aucun monstre sur la carte.");
    announce(room, startCombat(st, triggers, "mj"));
  });
  gm<void>("combat:end", (st, _p, room) => {
    endCombat(st);
    log(room, { from: "MJ", text: "Fin du combat.", kind: "narration" });
  });
  gm<{ title: string; text: string; to?: string[] }>("handout:add", (st, p) => {
    const to = Array.isArray(p.to) ? p.to.filter((id) => st.players.some((x) => x.id === id && !x.isGM)) : [];
    st.handouts.unshift({ id: uid("h_"), title: String(p.title).slice(0, 120), text: String(p.text ?? "").slice(0, 8000), at: Date.now(), ...(to.length ? { to } : {}) });
    if (!to.length) noterFait(st.campagne, `Document remis : ${String(p.title).slice(0, 120)}.`);
  });
  gm<string>("handout:remove", (st, id) => (st.handouts = st.handouts.filter((h) => h.id !== id)));
  gm<Scenario>("scenario:add", (st, sc) => st.scenarios.unshift(sc));
  gm<string>("scenario:remove", (st, id) => (st.scenarios = st.scenarios.filter((x) => x.id !== id)));
  gm<Partial<Pick<RoomState, "name" | "genre" | "ton" | "level" | "movementLocked" | "visionMode" | "sharedVision" | "mapKnown" | "abilityMethod" | "deathRule" | "autoCombat">>>("settings:set", (st, p) => {
    if (typeof p.autoCombat === "boolean") st.autoCombat = p.autoCombat;
    if (p.abilityMethod === "points" || p.abilityMethod === "des" || p.abilityMethod === "fixe") st.abilityMethod = p.abilityMethod;
    if (typeof p.deathRule === "string" && DEATH_RULES.some((d) => d.id === p.deathRule)) st.deathRule = p.deathRule;
    if (p.visionMode === "dynamique" || p.visionMode === "manuel") st.visionMode = p.visionMode;
    if (typeof p.sharedVision === "boolean") st.sharedVision = p.sharedVision;
    if (typeof p.mapKnown === "boolean") st.mapKnown = p.mapKnown;
    if (typeof p.name === "string") st.name = p.name.slice(0, 80);
    if (isGenre(p.genre) && p.genre !== st.genre) {
      st.genre = p.genre;
      // Séances, fils et PNJ restent ; réputations et jauge suivent le canon du nouveau monde.
      st.campagne = nettoyerCampagne({ ...st.campagne, reputations: {}, jauge: undefined }, p.genre);
    }
    if (isTon(p.ton)) st.ton = p.ton;
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
  // --- Mémoire de campagne ---
  gm<void>("seance:ouvrir", (st, _p, room) => {
    const { seance, precedemment } = ouvrirSeance(st.campagne);
    // Les cartes « par séance » se rechargent.
    for (const c of Object.values(st.collections)) for (const e of c.cartes) delete e.utilisee;
    log(room, { from: "MJ", text: `Séance ${seance.numero}.${precedemment ? ` Précédemment : ${precedemment}` : ""}`, kind: "narration" });
  });
  gm<{ resume: string }>("seance:clore", (st, p, room) => {
    const s = cloreSeance(st.campagne, String(p.resume ?? ""));
    log(room, { from: "MJ", text: `Fin de la séance ${s.numero}.`, kind: "narration" });
    // Un paquet de cartes pour chaque joueur à la fin de chaque séance.
    const joueurs = st.players.filter((x) => !x.isGM);
    for (const j of joueurs) (st.collections[j.id] ??= collectionVide()).paquets++;
    if (joueurs.length) log(room, { from: "Système", text: "Chacun reçoit un paquet de cartes pour la séance.", kind: "systeme" });
  });
  gm<{ texte: string }>("seance:fait", (st, p) => noterFait(st.campagne, String(p.texte ?? "")));
  gm<{ id?: string; texte: string; secret?: boolean; ouvert?: boolean }>("fil:upsert", (st, p) => {
    const c = st.campagne;
    const fil = p.id ? c.fils.find((f) => f.id === p.id) : undefined;
    const texte = String(p.texte ?? "").slice(0, 500);
    if (fil) Object.assign(fil, { texte: texte || fil.texte, secret: p.secret ?? fil.secret, ouvert: p.ouvert ?? fil.ouvert });
    else if (texte.trim()) c.fils.unshift({ id: uid("f_"), texte, secret: !!p.secret, ouvert: true, seance: c.seances.length });
  });
  gm<string>("fil:remove", (st, id) => (st.campagne.fils = st.campagne.fils.filter((f) => f.id !== id)));
  gm<{ id?: string; nom: string; attitude?: number; public?: string; secret?: string }>("pnj:upsert", (st, p) => {
    const c = st.campagne;
    const pnj = p.id ? c.pnj.find((x) => x.id === p.id) : undefined;
    const attitude = Math.max(-2, Math.min(2, Math.round(Number(p.attitude) || 0)));
    const champs = { nom: String(p.nom ?? "").slice(0, 80), attitude, public: String(p.public ?? "").slice(0, 1000), secret: String(p.secret ?? "").slice(0, 2000) };
    if (pnj) Object.assign(pnj, champs, { nom: champs.nom || pnj.nom });
    else if (champs.nom.trim()) c.pnj.unshift({ id: uid("n_"), ...champs });
  });
  gm<string>("pnj:remove", (st, id) => (st.campagne.pnj = st.campagne.pnj.filter((x) => x.id !== id)));
  gm<{ jauge?: number; jaugeVisible?: boolean; reserve?: number; reputation?: { id: string; valeur: number }; preparation?: string }>("campagne:set", (st, p, room) => {
    const c = st.campagne;
    const canon = canonDe(st.genre);
    if (typeof p.jauge === "number") {
      for (const s of reglerJauge(c, p.jauge, canon)) log(room, { from: "Système", text: `${canon?.campagne?.jauge?.nom ?? "La jauge"} passe sous ${s.valeur} : ${s.effet}`, kind: "systeme", secret: true });
    }
    if (typeof p.jaugeVisible === "boolean") c.jaugeVisible = p.jaugeVisible;
    if (typeof p.reserve === "number") reglerReserve(c, p.reserve, canon);
    if (p.reputation && p.reputation.id in c.reputations) c.reputations[p.reputation.id] = Math.max(0, Math.min(3, Math.round(Number(p.reputation.valeur) || 0)));
    if (typeof p.preparation === "string") c.preparation = p.preparation.slice(0, 20000);
  });
  // --- Cartes à collectionner ---
  gm<{ playerId?: string; n?: number }>("paquet:donner", (st, p, room) => {
    const n = Math.max(1, Math.min(10, Math.round(Number(p.n) || 1)));
    const cibles = st.players.filter((x) => !x.isGM && (!p.playerId || x.id === p.playerId));
    if (!cibles.length) throw new Error("Aucun joueur à qui donner ce paquet.");
    for (const j of cibles) (st.collections[j.id] ??= collectionVide()).paquets += n;
    const qui = p.playerId ? cibles[0].name : "chaque joueur";
    log(room, { from: "MJ", text: `Le MJ donne ${n > 1 ? `${n} paquets` : "un paquet"} de cartes à ${qui}.`, kind: "narration" });
  });
  gm<{ playerId: string; id: string }>("carte:offrir", (st, p, room) => {
    const j = st.players.find((x) => x.id === p.playerId && !x.isGM);
    const carte = carteDuCatalogue(st.genre, String(p.id));
    if (!j || !carte) throw new Error("Joueur ou carte introuvable.");
    (st.collections[j.id] ??= collectionVide()).cartes.push({ id: carte.id, signature: true });
    log(room, { from: "MJ", text: `Le MJ offre à ${j.name} une carte signée : ${carte.nom}.`, kind: "narration" });
  });

  /** Un joueur ouvre un de ses paquets : le serveur tire les cartes et les lui renvoie dans l'ordre de la révélation. */
  socket.on("paquet:ouvrir", (_p: unknown, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const col = st.collections[s.player.id];
    if (s.player.isGM || !col || col.paquets <= 0) return ack?.({ ok: false, error: "Aucun paquet à ouvrir." });
    const ids = tirerPaquet(st.genre);
    if (!ids.length) return ack?.({ ok: false, error: "Ce monde n'a pas encore de cartes à collectionner." });
    col.paquets--;
    col.cartes.push(...ids.map((id) => ({ id })));
    const haute = carteDuCatalogue(st.genre, ids[ids.length - 1]);
    log(s.room, {
      from: "Système",
      text: haute?.rarete === "relique" ? `${s.player.name} ouvre un paquet… et en sort une relique : ${haute.nom} !` : `${s.player.name} ouvre un paquet de cartes.`,
      kind: "systeme",
    });
    ack?.({ ok: true, cartes: ids });
    void broadcast(s.room);
  });

  /** Un joueur joue une carte de sa collection : « une fois », elle part ; « par séance », elle attend la séance suivante. */
  socket.on("collection:jouer", (p: { index: number }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const col = st.collections[s.player.id];
    const e = col?.cartes[Math.round(Number(p?.index))];
    const carte = e && carteDuCatalogue(st.genre, e.id);
    if (!col || !e || !carte) return ack?.({ ok: false, error: "Cette carte n'est pas dans ta collection." });
    if (e.utilisee) return ack?.({ ok: false, error: "Déjà jouée cette séance." });
    if (carte.recharge === "une-fois") col.cartes.splice(col.cartes.indexOf(e), 1);
    else e.utilisee = true;
    const perso = st.characters.find((c) => c.ownerId === s.player.id)?.name ?? s.player.name;
    log(s.room, { from: s.player.name, fromId: s.player.id, text: `${perso} joue ${carte.nom} : ${carte.usage}`, kind: "narration" });
    ack?.({ ok: true });
    void broadcast(s.room);
  });

  // --- Pioche : le MJ retourne une carte devant toute la table ---
  gm<unknown>("carte:retourner", (st, p, room) => {
    const carte = nettoyerCarte(p);
    if (!carte) throw new Error("Carte invalide.");
    st.carte = { ...carte, at: Date.now() };
    log(room, { from: "MJ", text: `Le MJ retourne une carte : ${carte.titre}.`, kind: "narration" });
    noterFait(st.campagne, `Carte retournée : ${carte.titre}.`);
  });
  gm<void>("carte:ranger", (st) => (st.carte = null));
  gm<unknown>("room:import", (st, data) => Object.assign(st, sanitizeImport(data, st)));

  // --- Vaisseaux (shared/vaisseaux.ts) : le MJ les crée et les pose, chaque joueur tient un poste ---
  gm<{ modele: string; nom: string; equipage: Vaisseau["equipage"] }>("vaisseau:creer", (st, p) => {
    if (st.vaisseaux.length >= 30) throw new Error("Trente vaisseaux au plus.");
    st.vaisseaux.push(nouveauVaisseau(String(p?.modele ?? ""), String(p?.nom ?? ""), p?.equipage === "groupe" ? "groupe" : "autre"));
  });
  /** Le MJ corrige une fiche : nom, coque, boucliers, caché ou non, notes, améliorations. */
  gm<Partial<Vaisseau> & { id: string }>("vaisseau:modifier", (st, p) => {
    const v = st.vaisseaux.find((x) => x.id === p?.id);
    if (!v) throw new Error("Vaisseau introuvable.");
    const [propre] = nettoyerVaisseaux([{ ...v, ...p, id: v.id, postes: v.postes, tokenId: v.tokenId }]);
    Object.assign(v, propre, { effets: v.effets });
    synchroniserPions(st, v);
  });
  gm<string>("vaisseau:supprimer", (st, id) => {
    const v = st.vaisseaux.find((x) => x.id === id);
    if (!v) throw new Error("Vaisseau introuvable.");
    st.tokens = st.tokens.filter((t) => t.id !== v.tokenId);
    st.vaisseaux = st.vaisseaux.filter((x) => x !== v);
  });
  /** Pose le vaisseau sur la carte : pion « joueur » pour celui du groupe (il voit, le pilote le déplace), « monstre » sinon. */
  gm<string>("vaisseau:poser", (st, id) => {
    const v = st.vaisseaux.find((x) => x.id === id);
    if (!v) throw new Error("Vaisseau introuvable.");
    if (!st.map) throw new Error("Pose d'abord une carte.");
    st.tokens = st.tokens.filter((t) => t.id !== v.tokenId);
    const pos = caseLibre(st);
    const token: Token = {
      id: uid("t_"),
      name: v.nom,
      x: pos.x,
      y: pos.y,
      color: v.equipage === "groupe" ? "#c8a24a" : "#7a3d22",
      kind: v.equipage === "groupe" ? "joueur" : "monstre",
      hidden: !!v.cache,
      size: v.taille,
      speed: v.vitesse,
      vaisseauId: v.id,
      vision: v.equipage === "groupe" ? 20 : undefined,
    };
    st.tokens.push(token);
    v.tokenId = token.id;
    synchroniserPions(st, v);
  });
  gm<void>("vaisseau:round", (st, _p, room) => {
    for (const v of st.vaisseaux) nouveauRound(v);
    log(room, { from: "MJ", text: "Nouveau round : esquives, ordres et cibles désignées retombent.", kind: "systeme" });
  });

  /** Un joueur met son personnage à un poste du vaisseau du groupe (ou l'en retire) ; le MJ place qui il veut. */
  socket.on("vaisseau:poste", (p: { id: string; poste: Poste; characterId?: string | null }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const v = st.vaisseaux.find((x) => x.id === p?.id);
    if (!v || !POSTES.some((x) => x.id === p.poste)) return ack?.({ ok: false, error: "Poste introuvable." });
    const perso = p.characterId ? st.characters.find((c) => c.id === p.characterId) : undefined;
    if (p.characterId && !perso) return ack?.({ ok: false, error: "Fiche introuvable." });
    if (!s.player.isGM) {
      if (v.equipage !== "groupe") return ack?.({ ok: false, error: "Ce vaisseau n'est pas le vôtre." });
      const actuel = v.postes[p.poste] ? st.characters.find((c) => c.id === v.postes[p.poste]) : undefined;
      if (perso && characterOwner(st, perso) !== s.player.id) return ack?.({ ok: false, error: "Cette fiche n'est pas à toi." });
      if (!perso && actuel && characterOwner(st, actuel) !== s.player.id) return ack?.({ ok: false, error: "Ce poste est tenu par quelqu'un d'autre." });
    }
    // Un personnage ne tient qu'un poste à la fois.
    if (perso) for (const x of POSTES) if (v.postes[x.id] === perso.id) delete v.postes[x.id];
    if (perso) v.postes[p.poste] = perso.id;
    else delete v.postes[p.poste];
    synchroniserPions(st, v);
    ack?.({ ok: true });
    void broadcast(s.room);
  });

  /** Action de poste : seul le joueur dont le personnage tient le poste (ou le MJ) la joue ; le serveur lance les dés. */
  socket.on("vaisseau:action", (p: { id: string; action: string; cibleId?: string; arme?: number }, ack?: Ack) => {
    const s = session();
    if (!s) return;
    const st = s.room.state;
    const v = st.vaisseaux.find((x) => x.id === p?.id);
    const action = ACTIONS.find((a) => a.id === p?.action);
    if (!v || !action) return ack?.({ ok: false, error: "Action introuvable." });
    const perso = v.postes[action.poste] ? st.characters.find((c) => c.id === v.postes[action.poste]) : undefined;
    if (!s.player.isGM && (!perso || characterOwner(st, perso) !== s.player.id)) return ack?.({ ok: false, error: "Ton personnage ne tient pas ce poste." });
    const cible = p.cibleId ? st.vaisseaux.find((x) => x.id === p.cibleId && (s.player.isGM || !x.cache)) : undefined;
    try {
      const r = jouerAction(st.genre, v, action.id, perso, { cible, arme: Number.isInteger(p.arme) ? p.arme : 0 });
      const premier = r.jets[0];
      log(s.room, {
        from: s.player.isGM ? "MJ" : s.player.name,
        fromId: s.player.id,
        text: r.texte,
        kind: "des",
        roll: premier ? { sides: premier.sides, rolls: premier.rolls.slice(0, 20), kept: premier.kept.slice(0, 20), modifier: premier.modifier, total: premier.total } : undefined,
      });
      synchroniserPions(st, v);
      if (cible) synchroniserPions(st, cible);
      ack?.({ ok: true });
      void broadcast(s.room);
    } catch (err) {
      ack?.({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });
});

loadRooms();
http.listen(PORT, () => console.log(`Forge JdR prête sur http://localhost:${PORT}`));
