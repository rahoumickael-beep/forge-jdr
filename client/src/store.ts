// Connexion temps réel et état de la partie, partagés par tous les composants.
import { useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import type { RoomView } from "../../shared/types";

export interface Ping {
  id: number;
  x: number;
  y: number;
  color: string;
  name: string;
}

interface Snapshot {
  connected: boolean;
  room: RoomView | null;
  pings: Ping[];
  toast: string | null;
}

let snapshot: Snapshot = { connected: false, room: null, pings: [], toast: null };
const listeners = new Set<() => void>();

function set(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((l) => l());
}

export const socket: Socket = io({ autoConnect: true });

socket.on("connect", () => {
  set({ connected: true });
  // Reconnexion automatique à la dernière partie (après une coupure réseau ou un rechargement).
  const last = lastSession();
  if (last) socket.emit("room:join", last, (res: AckResult) => res.ok || forgetSession());
});
socket.on("disconnect", () => set({ connected: false }));
socket.on("state", (room: RoomView) => set({ room }));
let pingId = 0;
socket.on("map:ping", (p: Omit<Ping, "id">) => {
  const ping = { ...p, id: ++pingId };
  set({ pings: [...snapshot.pings, ping] });
  setTimeout(() => set({ pings: snapshot.pings.filter((x) => x.id !== ping.id) }), 2200);
});

// Aide au test automatisé (scripts/playtest.mjs) : lire l'état depuis la console.
(window as unknown as { __forge: () => RoomView | null }).__forge = () => snapshot.room;

export function useStore(): Snapshot {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string) {
  set({ toast: message });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => set({ toast: null }), 3500);
}

export interface AckResult {
  ok: boolean;
  error?: string;
  [k: string]: unknown;
}

/** Envoie une action au serveur ; affiche l'erreur s'il la refuse. */
export function send<T = unknown>(event: string, payload?: T): Promise<AckResult> {
  return new Promise((resolve) => {
    socket.timeout(8000).emit(event, payload, (err: Error | null, res: AckResult) => {
      const result = err ? { ok: false, error: "Le serveur ne répond pas." } : res;
      if (!result.ok && result.error) toast(result.error);
      resolve(result);
    });
  });
}

// --- Mémoire locale : retrouver sa place à la table ---
interface SessionInfo {
  code: string;
  name: string;
  playerId?: string;
  gmKey?: string;
}

export function saveSession(s: SessionInfo) {
  try {
    localStorage.setItem("forge:session", JSON.stringify(s));
    if (s.gmKey) localStorage.setItem(`forge:gm:${s.code}`, s.gmKey);
  } catch {
    /* stockage indisponible : on rejouera le code à la main */
  }
}

export function lastSession(): SessionInfo | null {
  try {
    return JSON.parse(localStorage.getItem("forge:session") || "null");
  } catch {
    return null;
  }
}

export function gmKeyFor(code: string): string | undefined {
  try {
    return localStorage.getItem(`forge:gm:${code}`) ?? undefined;
  } catch {
    return undefined;
  }
}

export function forgetSession() {
  try {
    localStorage.removeItem("forge:session");
  } catch {
    /* rien à faire */
  }
  set({ room: null });
}
