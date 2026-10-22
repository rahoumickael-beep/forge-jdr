import assert from "node:assert/strict";
import { test } from "node:test";
import { extractJson, toScenario } from "./ai";
import { rollDice } from "./dice";
import { GENRES } from "./genres";
import { generateCharacter, generateEncounter, generateScenario, modifier } from "./generators";
import { generateMap, walkable } from "./maps";
import type { MapKind } from "./types";

test("modificateurs façon D&D", () => {
  assert.equal(modifier(10), 0);
  assert.equal(modifier(8), -1);
  assert.equal(modifier(15), 2);
  assert.equal(modifier(20), 5);
});

test("dés : formules et bornes", () => {
  const r = rollDice("3d6+2", () => 0.999);
  assert.equal(r.total, 20);
  assert.equal(rollDice("1d20adv", () => 0).kept.length, 1);
  assert.equal(rollDice("4d6kh3", () => 0.5).kept.length, 3);
  assert.throws(() => rollDice("bonjour"));
});

test("même graine, même résultat", () => {
  const a = generateScenario({ genre: "fantasy", ton: "epique", level: 3, players: 4, seed: 42 });
  const b = generateScenario({ genre: "fantasy", ton: "epique", level: 3, players: 4, seed: 42 });
  assert.equal(a.title, b.title);
  assert.deepEqual(a.acts, b.acts);
});

test("chaque genre produit personnages, rencontres et scénarios complets", () => {
  for (const g of GENRES) {
    for (const level of [1, 8, 14, 20]) {
      const c = generateCharacter({ genre: g.id, level, seed: level });
      assert.equal(Object.keys(c.stats).length, 6, g.id);
      assert.ok(c.hpMax > 0 && c.ac >= 10, g.id);
      const e = generateEncounter(g.id, level, 4, level);
      assert.ok(e.enemies.length > 0 && e.enemies.every((x) => x.count > 0 && x.hp > 0), g.id);
      const s = generateScenario({ genre: g.id, ton: "sombre", level, players: 4, seed: level });
      assert.ok(s.acts.length >= 3 && s.acts.every((a) => a.summary), g.id);
    }
  }
});

test("cartes : dimensions et cases praticables", () => {
  for (const kind of ["donjon", "caverne", "nature", "village"] as MapKind[]) {
    for (const seed of [1, 7, 99]) {
      const m = generateMap({ kind, width: 40, height: 30, seed });
      assert.equal(m.tiles.length, 40 * 30, kind);
      const open = m.tiles.filter(walkable).length;
      assert.ok(open > 120, `${kind} trop fermé (${open})`);
    }
  }
});

test("lecture du JSON renvoyé par une IA bavarde", () => {
  const raw = extractJson('<think>hmm</think>Voici : ```json\n{"title": "Le Puits", "acts": [{"title": "A", "summary": "B {x}", "location": "C"}]}\n``` Bonne partie !');
  const s = toScenario(raw, { kind: "scenario", genre: "fantasy", ton: "epique", level: 2, players: 4 });
  assert.equal(s.title, "Le Puits");
  assert.equal(s.acts[0].summary, "B {x}");
  assert.ok(s.npcs.length > 0, "complété par le générateur");
});
