import { nouvelleCampagne } from "./campagne";
import assert from "node:assert/strict";
import { test } from "node:test";
import { autoCombat, endCombat, focusOf, monstersSeen, reachable, startCombat } from "./combat";
import type { GameMap, RoomState, Tile, Token } from "./types";

/** Salle de 20 × 10 coupée en deux par un mur plein en x = 10. */
function salle(): GameMap {
  const tiles: Tile[] = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) tiles.push(x === 0 || y === 0 || x === 19 || y === 9 || x === 10 ? 2 : 1);
  return { name: "Test", kind: "donjon", seed: 1, width: 20, height: 10, tiles, rooms: [] };
}

function etat(tokens: Token[]): RoomState {
  return {
    code: "TEST", name: "t", genre: "fantasy", ton: "sombre", level: 1, createdAt: 0, map: salle(), fog: null, fogEnabled: true,
    visionMode: "dynamique", sharedVision: true, mapKnown: false, abilityMethod: "points", deathRule: "heroique",
    tokens, players: [], chat: [], initiative: { entries: [], turn: 0, round: 1 }, combat: null, autoCombat: true,
    handouts: [], characters: [], scenarios: [], gmNotes: "", movementLocked: false, scene: "",
    campagne: nouvelleCampagne("fantasy"),
  };
}

const heros: Token = { id: "h", name: "Aubin", x: 3, y: 5, color: "#fff", kind: "joueur", vision: 12 };
const leve = (x: number, extra: Partial<Token> = {}): Token => ({ id: `m${x}`, name: "Levé", x, y: 5, color: "#000", kind: "monstre", creatureId: "leve", ...extra });

test("combat : un monstre derrière un mur ne déclenche rien", () => {
  const st = etat([heros, leve(14)]);
  assert.equal(monstersSeen(st).length, 0);
  assert.equal(autoCombat(st), null);
});

test("combat : un monstre en vue lance le combat et l'initiative", () => {
  const st = etat([heros, leve(7)]);
  const c = autoCombat(st);
  assert.ok(c);
  assert.equal(c.cause, "auto");
  assert.deepEqual(c.monsterIds, ["m7"]);
  assert.equal(st.initiative.entries.length, 2);
  assert.ok(st.initiative.entries[0].value >= st.initiative.entries[1].value);
});

test("combat : un monstre caché par le MJ ou à 0 PV ne déclenche rien", () => {
  assert.equal(autoCombat(etat([heros, leve(7, { hidden: true })])), null);
  assert.equal(autoCombat(etat([heros, leve(7, { hp: 0 })])), null);
  const off = etat([heros, leve(7)]);
  off.autoCombat = false;
  assert.equal(autoCombat(off), null);
});

test("combat : après la fin, le même monstre ne relance rien tant qu'il reste en vue", () => {
  const st = etat([heros, leve(7)]);
  autoCombat(st);
  endCombat(st);
  assert.equal(autoCombat(st), null);
  st.tokens[1].x = 14; // perdu de vue derrière le mur
  assert.equal(autoCombat(st), null);
  st.tokens[1].x = 8; // il revient
  assert.ok(autoCombat(st));
});

test("combat : l'initiative ajoute la Dextérité du bestiaire", () => {
  const st = etat([heros, leve(7)]);
  startCombat(st, [st.tokens[1]], "mj", () => 10);
  const levé = st.initiative.entries.find((e) => e.tokenId === "m7")!;
  assert.equal(levé.value, 10 - 2); // Dex 6
});

test("combat : le cadre de caméra contient tout le monde et reste dans la carte", () => {
  const f = focusOf(salle(), [heros, leve(7)]);
  assert.ok(f.x <= 3 && f.x + f.w >= 8);
  assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= 20 && f.y + f.h <= 10);
});

test("combat : les cases atteignables s'arrêtent aux murs", () => {
  const map = salle();
  const r = reachable(map, { x: 8, y: 5 }, 6);
  assert.ok(r.has(5 * 20 + 2));
  assert.ok(!r.has(5 * 20 + 11)); // de l'autre côté du mur
  assert.ok(!r.has(5 * 20 + 10));
});
