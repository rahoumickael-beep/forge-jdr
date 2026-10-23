// Gestion des parties : création, sauvegarde sur disque, vue filtrée pour chaque joueur.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { uid } from "../shared/random";
import { visibleCells } from "../shared/vision";
import { nomVuParLesJoueurs } from "../shared/bestiary";
import { campagnePourJoueur, nettoyerCampagne, nouvelleCampagne } from "../shared/campagne";
import { GENRES, TONS } from "../shared/genres";
import type { Character, ChatEntry, GameMap, GenreId, Player, RoomState, RoomView, Token, Ton } from "../shared/types";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const MAX_LOG = 200;
export const MAX_PLAYERS = 8; // 4 prévus, de la marge pour les invités

export interface StoredRoom {
  state: RoomState;
  gmKey: string;
}

const rooms = new Map<string, StoredRoom>();
const saveTimers = new Map<string, NodeJS.Timeout>();

const PLAYER_COLORS = ["#d9480f", "#1971c2", "#2f9e44", "#ae3ec9", "#f08c00", "#0c8599", "#e03131", "#5c7cfa"];

export function loadRooms() {
  mkdirSync(DATA_DIR, { recursive: true });
  for (const file of readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const stored = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as StoredRoom;
      stored.state.players.forEach((p) => (p.online = false));
      stored.state.visionMode ??= "dynamique";
      stored.state.abilityMethod ??= "points";
      stored.state.deathRule ??= "heroique";
      stored.state.combat ??= null;
      stored.state.autoCombat ??= true;
      stored.state.sharedVision ??= true;
      stored.state.mapKnown ??= false;
      stored.state.campagne = nettoyerCampagne(stored.state.campagne, stored.state.genre);
      rooms.set(stored.state.code, stored);
    } catch (err) {
      console.warn(`Partie illisible ignorée : ${file}`, err);
    }
  }
  console.log(`${rooms.size} partie(s) chargée(s) depuis ${DATA_DIR}`);
}

export function saveSoon(code: string) {
  clearTimeout(saveTimers.get(code));
  saveTimers.set(
    code,
    setTimeout(() => {
      const stored = rooms.get(code);
      if (!stored) return;
      writeFileSync(join(DATA_DIR, `${code}.json`), JSON.stringify(stored));
    }, 1500),
  );
}

function newCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  } while (rooms.has(code));
  return code;
}

export function createRoom(opts: { name: string; genre: GenreId; ton: Ton; level: number; gmName: string }) {
  const code = newCode();
  const gm: Player = { id: uid("p_"), name: opts.gmName || "Maître du jeu", color: "#c8a24a", online: false, isGM: true };
  const state: RoomState = {
    code,
    name: opts.name || "Nouvelle campagne",
    genre: isGenre(opts.genre) ? opts.genre : "fantasy",
    ton: isTon(opts.ton) ? opts.ton : "epique",
    level: Math.max(1, Math.min(20, Math.round(Number(opts.level)) || 1)),
    createdAt: Date.now(),
    map: null,
    fog: null,
    fogEnabled: true,
    visionMode: "dynamique",
    abilityMethod: "points",
    deathRule: "heroique",
    sharedVision: true,
    mapKnown: false,
    tokens: [],
    players: [gm],
    chat: [],
    initiative: { entries: [], turn: 0, round: 1 },
    combat: null,
    autoCombat: true,
    handouts: [],
    characters: [],
    scenarios: [],
    gmNotes: "",
    movementLocked: false,
    scene: "",
    campagne: nouvelleCampagne(isGenre(opts.genre) ? opts.genre : "fantasy"),
  };
  const stored = { state, gmKey: uid("gm_") + uid() };
  rooms.set(code, stored);
  saveSoon(code);
  return { stored, gm };
}

export function getRoom(code: string): StoredRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function addPlayer(room: StoredRoom, name: string): Player {
  const used = new Set(room.state.players.map((p) => p.color));
  const color = PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[room.state.players.length % PLAYER_COLORS.length];
  const player: Player = { id: uid("p_"), name: name.slice(0, 40) || "Aventurier", color, online: true, isGM: false };
  room.state.players.push(player);
  return player;
}

export function log(room: StoredRoom, entry: Omit<ChatEntry, "id" | "at">) {
  room.state.chat.push({ ...entry, id: uid("m_"), at: Date.now() });
  if (room.state.chat.length > MAX_LOG) room.state.chat.splice(0, room.state.chat.length - MAX_LOG);
}

/** En vision dynamique, tout ce que voit le groupe devient « exploré » (on retire le brouillard). */
export function updateExplored(room: StoredRoom) {
  const s = room.state;
  if (s.visionMode !== "dynamique" || !s.map || !s.fog) return;
  for (const i of visibleCells(s.map, s.tokens.filter((t) => t.kind === "joueur"))) s.fog[i] = false;
}

/** Joueur à qui appartient une fiche : celui qui l'a créée, ou à défaut celui du pion joueur lié (parties anciennes). */
export function characterOwner(s: RoomState, c: Character): string | undefined {
  return c.ownerId ?? s.tokens.find((t) => t.characterId === c.id && t.kind === "joueur")?.ownerId;
}

/** Ce qu'un joueur a le droit de voir. Le MJ voit tout. */
export function viewFor(room: StoredRoom, player: Player): RoomView {
  const s = room.state;
  if (player.isGM) return { ...s, you: player };
  const { gmNotes: _hidden, ...rest } = s;
  const base = {
    ...rest,
    you: player,
    combatDismissed: undefined,
    chat: s.chat.filter((c) => !c.secret || c.fromId === player.id),
    scenarios: [], // les scénarios sont la préparation du MJ
    characters: s.characters.filter((c) => characterOwner(s, c)), // les fiches de PNJ restent chez le MJ
    handouts: s.handouts.filter((h) => !h.to?.length || h.to.includes(player.id)),
    campagne: campagnePourJoueur(s.campagne),
  };
  const map = s.map;
  if (!map || !s.fogEnabled) return { ...base, tokens: s.tokens.filter((t) => t.ownerId === player.id || !t.hidden) };
  const cell = (x: number, y: number) => Math.round(y) * map.width + Math.round(x);
  if (s.visionMode === "dynamique") {
    const eyes = s.tokens.filter((t) => t.kind === "joueur" && (s.sharedVision || t.ownerId === player.id));
    const visible = visibleCells(map, eyes);
    return {
      ...base,
      visible: [...visible],
      tokens: s.tokens.filter((t) => t.ownerId === player.id || (!t.hidden && visible.has(cell(t.x, t.y)))),
    };
  }
  const fogged = (x: number, y: number) => !!s.fog?.[cell(x, y)];
  return { ...base, tokens: s.tokens.filter((t) => t.ownerId === player.id || (!t.hidden && !fogged(t.x, t.y))) };
}

/** Vue joueur : pas de nom ni d'identifiant de monstre qu'il ne voit pas, même dans l'initiative ou le combat. */
export function hideUnseen(view: RoomView): RoomView {
  if (view.you.isGM) return view;
  const seen = new Set(view.tokens.map((t) => t.id));
  // Le vrai nom de certaines créatures trahit un secret du canon : les joueurs voient leur nom public.
  const creatureOf = new Map(view.tokens.map((t) => [t.id, t.creatureId]));
  return {
    ...view,
    tokens: view.tokens.map((t) => (t.creatureId ? { ...t, name: nomVuParLesJoueurs(t.name, t.creatureId) } : t)),
    initiative: {
      ...view.initiative,
      entries: view.initiative.entries.map((e) =>
        e.tokenId && !seen.has(e.tokenId) ? { value: e.value, name: "Quelque chose" } : e.tokenId ? { ...e, name: nomVuParLesJoueurs(e.name, creatureOf.get(e.tokenId)) } : e,
      ),
    },
    combat: view.combat ? { ...view.combat, monsterIds: view.combat.monsterIds.filter((id) => seen.has(id)) } : null,
  };
}

export const isGenre = (g: unknown): g is GenreId => GENRES.some((x) => x.id === g);
export const isTon = (t: unknown): t is Ton => TONS.some((x) => x.id === t);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
/** Les éléments d'une liste qui ont au moins un identifiant texte. */
const withIds = <X>(v: unknown): X[] => (Array.isArray(v) ? v.filter((x) => isObj(x) && typeof x.id === "string") : []) as X[];

function cleanMap(v: unknown): GameMap | null {
  if (!isObj(v) || !isInt(v.width, 4, 200) || !isInt(v.height, 4, 200)) return null;
  const { width, height } = v;
  if (!Array.isArray(v.tiles) || v.tiles.length !== width * height || !v.tiles.every((t) => isInt(t, 0, 6))) return null;
  const kinds = ["donjon", "caverne", "nature", "village"];
  return {
    name: String(v.name ?? "Carte").slice(0, 80),
    kind: (kinds.includes(v.kind as string) ? v.kind : "donjon") as GameMap["kind"],
    seed: Number.isFinite(v.seed) ? (v.seed as number) : 0,
    width,
    height,
    tiles: v.tiles as GameMap["tiles"],
    rooms: (Array.isArray(v.rooms) ? v.rooms : [])
      .filter((r): r is Record<string, unknown> => isObj(r) && [r.x, r.y, r.w, r.h].every((n) => isInt(n, 0, 200)))
      .map((r) => ({ x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number, ...(typeof r.label === "string" ? { label: r.label.slice(0, 60) } : {}) })),
  };
}

/** Sauvegarde importée par le MJ : on ne garde que des champs connus et bien typés. Le code et les joueurs de la table restent. */
export function sanitizeImport(data: unknown, current: RoomState): RoomState {
  if (!isObj(data) || !Array.isArray(data.tokens)) throw new Error("Fichier de partie invalide.");
  const map = cleanMap(data.map);
  const cells = map ? map.width * map.height : 0;
  const fog = map && Array.isArray(data.fog) && data.fog.length === cells ? data.fog.map(Boolean) : map ? new Array(cells).fill(true) : null;
  const bool = (k: keyof RoomState, fallback: boolean) => (typeof data[k] === "boolean" ? (data[k] as boolean) : fallback);
  const str = (k: keyof RoomState, max: number, fallback: string) => (typeof data[k] === "string" ? (data[k] as string).slice(0, max) : fallback);
  const tokens = withIds<Token>(data.tokens)
    .filter((t) => Number.isFinite(t.x) && Number.isFinite(t.y))
    .map((t) => ({ ...t, name: String(t.name ?? "Pion").slice(0, 40), x: Math.max(0, Math.min((map?.width ?? 40) - 1, Math.round(t.x))), y: Math.max(0, Math.min((map?.height ?? 30) - 1, Math.round(t.y))) }));
  const ini = isObj(data.initiative) && Array.isArray(data.initiative.entries) ? data.initiative : null;
  return {
    ...current,
    name: str("name", 80, current.name),
    genre: isGenre(data.genre) ? data.genre : current.genre,
    ton: isTon(data.ton) ? data.ton : current.ton,
    level: isInt(data.level, 1, 20) ? data.level : current.level,
    map,
    fog,
    fogEnabled: bool("fogEnabled", true),
    visionMode: data.visionMode === "manuel" ? "manuel" : "dynamique",
    sharedVision: bool("sharedVision", true),
    mapKnown: bool("mapKnown", false),
    abilityMethod: data.abilityMethod === "des" || data.abilityMethod === "fixe" ? data.abilityMethod : "points",
    deathRule: str("deathRule", 40, current.deathRule),
    autoCombat: bool("autoCombat", true),
    movementLocked: bool("movementLocked", false),
    tokens,
    chat: withIds<ChatEntry>(data.chat).slice(-MAX_LOG),
    initiative: ini
      ? {
          entries: (ini.entries as unknown[]).filter((e): e is RoomState["initiative"]["entries"][number] => isObj(e) && typeof e.name === "string" && Number.isFinite(e.value)),
          turn: isInt(ini.turn, 0, 999) ? ini.turn : 0,
          round: isInt(ini.round, 1, 9999) ? ini.round : 1,
        }
      : { entries: [], turn: 0, round: 1 },
    combat: null, // un combat reprend proprement depuis l'écran du MJ
    combatDismissed: [],
    handouts: withIds<RoomState["handouts"][number]>(data.handouts),
    characters: withIds<Character>(data.characters),
    scenarios: withIds<RoomState["scenarios"][number]>(data.scenarios),
    gmNotes: str("gmNotes", 50000, ""),
    scene: str("scene", 2000, ""),
    campagne: nettoyerCampagne(data.campagne, isGenre(data.genre) ? data.genre : current.genre),
  };
}
