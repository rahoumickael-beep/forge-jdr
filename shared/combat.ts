// Mode combat : déclenchement (un joueur voit un monstre, ou le MJ le décide), initiative automatique,
// zone que la caméra cadre, et cases qu'un pion peut atteindre pendant son tour.
import { BESTIARY, crLabel } from "./bestiary";
import type { GameMap, InitiativeEntry, RoomState, Token } from "./types";
import { visibleCells } from "./vision";

// Le déplacement vit dans maps.ts : la table des joueurs le charge sans le bestiaire.
export { reachable } from "./maps";

export interface Combat {
  id: string;
  startedAt: number;
  /** Monstres qui ont déclenché le combat (l'animation montre le premier). */
  monsterIds: string[];
  /** Zone cadrée par la caméra, en cases. */
  focus: { x: number; y: number; w: number; h: number };
  /** « auto » : un joueur a vu le monstre ; « mj » : le MJ a lancé le combat. */
  cause: "auto" | "mj";
  /** Sous le nom, dans l'animation : type et puissance de la créature (calculé ici, le client des joueurs n'a pas le bestiaire). */
  sousTitre?: string;
}

const modOf = (v: number) => Math.floor((v - 10) / 2);

function sousTitreDe(t: Token | undefined): string | undefined {
  const c = t?.creatureId ? BESTIARY.find((x) => x.id === t.creatureId) : undefined;
  return c ? `${c.type.charAt(0).toUpperCase()}${c.type.slice(1)} · Puissance ${crLabel(c.cr)}` : undefined;
}
const center = (t: Token) => ({ x: t.x + (t.size ?? 1) / 2, y: t.y + (t.size ?? 1) / 2 });

/** Monstres visibles d'au moins un pion joueur (les monstres cachés par le MJ ne comptent pas). */
export function monstersSeen(st: RoomState): Token[] {
  if (!st.map) return [];
  const eyes = st.tokens.filter((t) => t.kind === "joueur");
  if (!eyes.length) return [];
  const seen = visibleCells(st.map, eyes);
  const w = st.map.width;
  return st.tokens.filter((t) => t.kind === "monstre" && !t.hidden && (t.hp ?? 1) > 0 && seen.has(Math.round(t.y) * w + Math.round(t.x)));
}

/** Bonus d'initiative : Dextérité du personnage lié, ou de la créature du bestiaire, ou celui noté sur le pion. */
export function initiativeBonus(st: RoomState, t: Token): number {
  if (typeof t.init === "number") return t.init;
  const c = st.characters.find((x) => x.id === t.characterId);
  if (c) return modOf(Object.values(c.stats)[1] ?? 10);
  const b = t.creatureId ? BESTIARY.find((x) => x.id === t.creatureId) : undefined;
  return b ? modOf(b.stats[1]) : 0;
}

/** Combattants : les pions joueurs et les monstres proches des monstres déclencheurs (même groupe). */
export function combatants(st: RoomState, triggers: Token[]): Token[] {
  const near = (t: Token, r: number) => triggers.some((m) => Math.hypot(center(m).x - center(t).x, center(m).y - center(t).y) <= r);
  return st.tokens.filter((t) => t.kind === "joueur" || (t.kind === "monstre" && (t.hp ?? 1) > 0 && (triggers.includes(t) || (!t.hidden && near(t, 8)))) || (t.kind === "pnj" && near(t, 8)));
}

/** Cadre de caméra : tous les combattants, avec une marge, au moins 14 × 10 cases, dans la carte. */
export function focusOf(map: GameMap | null, tokens: Token[]): Combat["focus"] {
  const W = map?.width ?? 40;
  const H = map?.height ?? 30;
  if (!tokens.length) return { x: 0, y: 0, w: W, h: H };
  let x0 = Math.min(...tokens.map((t) => t.x)) - 3;
  let y0 = Math.min(...tokens.map((t) => t.y)) - 3;
  let x1 = Math.max(...tokens.map((t) => t.x + (t.size ?? 1))) + 3;
  let y1 = Math.max(...tokens.map((t) => t.y + (t.size ?? 1))) + 3;
  const grow = (a: number, b: number, min: number) => (b - a >= min ? [a, b] : [a - (min - (b - a)) / 2, b + (min - (b - a)) / 2]);
  [x0, x1] = grow(x0, x1, 14);
  [y0, y1] = grow(y0, y1, 10);
  const x = Math.max(0, Math.min(W - (x1 - x0), x0));
  const y = Math.max(0, Math.min(H - (y1 - y0), y0));
  return { x: Math.round(x), y: Math.round(y), w: Math.round(Math.min(W, x1 - x0)), h: Math.round(Math.min(H, y1 - y0)) };
}

/** Lance le combat : initiative tirée pour chacun (d20 + bonus), ordre décroissant, égalités départagées par le bonus. */
export function startCombat(st: RoomState, triggers: Token[], cause: Combat["cause"], d20: () => number = () => 1 + Math.floor(Math.random() * 20)) {
  const fighters = combatants(st, triggers);
  const entries: (InitiativeEntry & { bonus: number })[] = fighters.map((t) => {
    const bonus = initiativeBonus(st, t);
    return { tokenId: t.id, name: t.name, value: d20() + bonus, bonus };
  });
  entries.sort((a, b) => b.value - a.value || b.bonus - a.bonus);
  st.initiative = { entries: entries.map(({ bonus: _b, ...e }) => e), turn: 0, round: 1 };
  st.combat = {
    id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    startedAt: Date.now(),
    monsterIds: triggers.map((t) => t.id),
    focus: focusOf(st.map, fighters),
    cause,
    ...(sousTitreDe(triggers[0]) ? { sousTitre: sousTitreDe(triggers[0]) } : {}),
  };
  return st.combat;
}

/** Fin du combat : les monstres encore en vue ne relanceront pas l'animation avant d'avoir été perdus de vue. */
export function endCombat(st: RoomState) {
  st.combat = null;
  st.initiative = { entries: [], turn: 0, round: 1 };
  st.combatDismissed = monstersSeen(st).map((t) => t.id);
}

/** À appeler après chaque changement : lance le combat si un joueur voit un monstre et que le mode auto est actif. */
export function autoCombat(st: RoomState): Combat | null {
  const seen = monstersSeen(st);
  // Un monstre perdu de vue redevient une menace.
  if (st.combatDismissed?.length) st.combatDismissed = st.combatDismissed.filter((id) => seen.some((t) => t.id === id));
  if (!st.autoCombat || st.combat) return null;
  const fresh = seen.filter((t) => !st.combatDismissed?.includes(t.id));
  return fresh.length ? startCombat(st, fresh, "auto") : null;
}

