// Gestion des parties : création, sauvegarde sur disque, vue filtrée pour chaque joueur.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { uid } from "../shared/random";
import type { ChatEntry, GenreId, Player, RoomState, RoomView, Ton } from "../shared/types";

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
    genre: opts.genre,
    ton: opts.ton,
    level: opts.level,
    createdAt: Date.now(),
    map: null,
    fog: null,
    fogEnabled: true,
    tokens: [],
    players: [gm],
    chat: [],
    initiative: { entries: [], turn: 0, round: 1 },
    handouts: [],
    characters: [],
    scenarios: [],
    gmNotes: "",
    movementLocked: false,
    scene: "",
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

/** Ce qu'un joueur a le droit de voir. Le MJ voit tout. */
export function viewFor(room: StoredRoom, player: Player): RoomView {
  const s = room.state;
  if (player.isGM) return { ...s, you: player };
  const { gmNotes: _hidden, ...rest } = s;
  const fogged = (x: number, y: number) => !!(s.fogEnabled && s.fog && s.map && s.fog[Math.floor(y) * s.map.width + Math.floor(x)]);
  return {
    ...rest,
    you: player,
    tokens: s.tokens.filter((t) => t.ownerId === player.id || (!t.hidden && !fogged(t.x, t.y))),
    chat: s.chat.filter((c) => !c.secret || c.fromId === player.id),
    scenarios: [], // les scénarios sont la préparation du MJ
    characters: s.characters,
  };
}
