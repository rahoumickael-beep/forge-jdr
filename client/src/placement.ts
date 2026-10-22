import { walkable } from "../../shared/maps";
import { uid } from "../../shared/random";
import type { Character, Encounter, RoomView, Token } from "../../shared/types";

/** Trouve une case libre et praticable, en spirale autour d'un point de départ. */
export function freeCell(room: RoomView, near?: { x: number; y: number }): { x: number; y: number } {
  const map = room.map;
  if (!map) return { x: 2, y: 2 };
  const start = near ?? (map.rooms[0] ? { x: map.rooms[0].x + 1, y: map.rooms[0].y + 1 } : { x: Math.floor(map.width / 2), y: Math.floor(map.height / 2) });
  const taken = new Set(room.tokens.map((t) => `${t.x},${t.y}`));
  for (let r = 0; r < Math.max(map.width, map.height); r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = start.x + dx;
        const y = start.y + dy;
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
        if (walkable(map.tiles[y * map.width + x]) && !taken.has(`${x},${y}`)) return { x, y };
      }
  return start;
}

export function tokenForCharacter(room: RoomView, c: Character, color: string, ownerId?: string): Token {
  const pos = freeCell(room);
  return { id: uid("t_"), name: c.name, x: pos.x, y: pos.y, color, kind: ownerId ? "joueur" : "pnj", ownerId, hp: c.hp, hpMax: c.hpMax, ac: c.ac, characterId: c.id };
}

const ENEMY_COLORS = ["#7a2a22", "#5b3a6b", "#3c4a2a", "#6b4a1f"];

/** Place les ennemis d'une rencontre, cachés, regroupés dans une salle au hasard. */
export function tokensForEncounter(room: RoomView, e: Encounter): Token[] {
  const map = room.map;
  const area = map?.rooms.length ? map.rooms[Math.floor(Math.random() * map.rooms.length)] : undefined;
  const near = area ? { x: area.x + Math.floor(area.w / 2), y: area.y + Math.floor(area.h / 2) } : undefined;
  const placed: Token[] = [];
  e.enemies.forEach((en, k) => {
    for (let i = 0; i < Math.min(en.count, 12); i++) {
      const pos = freeCell({ ...room, tokens: [...room.tokens, ...placed] }, near);
      placed.push({
        id: uid("t_"),
        name: en.count > 1 ? `${en.name} ${i + 1}` : en.name,
        x: pos.x,
        y: pos.y,
        color: ENEMY_COLORS[k % ENEMY_COLORS.length],
        kind: "monstre",
        hidden: true,
        hp: en.hp,
        hpMax: en.hp,
        ac: en.ac,
      });
    }
  });
  return placed;
}
