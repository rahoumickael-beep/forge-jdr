import assert from "node:assert/strict";
import { test } from "node:test";
import { armurePortee, classeArmureDepart, equipementDeDepart } from "./armures";
import { GENRES } from "./genres";
import { classesFor } from "./rules";

test("lit l'armure portée, pas l'armure maîtrisée", () => {
  const lignes: string[] = [];
  for (const g of GENRES) {
    for (const c of classesFor(g.id)) {
    const pouvoirs = c.powers.filter((p) => p.level <= 1).map((p) => p.effect);
    const ca = classeArmureDepart(c.armor, c.startingGear, pouvoirs, g.stats, [0, 2, 1, 0, 1, 0]);
    lignes.push(`${g.id} ${c.name} ${ca} ${armurePortee(c.startingGear) ? "" : "(sans armure)"}`);
    }
  }
  if (process.env.AFFICHER_CA) console.log(lignes.join("\n"));
  assert.ok(lignes.length > 0);
});

test("calcule les cas des livres", () => {
  const stats = ["Force", "Dextérité", "Constitution", "Intelligence", "Sagesse", "Charisme"];
  assert.equal(classeArmureDepart("Toutes les armures et boucliers", ["Cotte de mailles", "Épée longue et bouclier"], [], stats, [2, 3, 1, 0, 0, 0]), 18);
  assert.equal(classeArmureDepart("Armures légères et intermédiaires, boucliers", ["Cotte d'écailles", "Bouclier et symbole sacré"], [], stats, [0, 3, 0, 0, 0, 0]), 18);
  assert.equal(classeArmureDepart("Aucune", ["Bâton"], ["Sans armure ni bouclier, ta CA vaut 10 + Dextérité + Sagesse."], stats, [0, 3, 0, 0, 2, 0]), 15);
  assert.equal(classeArmureDepart("Armures légères", ["Tablier de cuir et gants épais"], [], stats, [0, 2, 0, 0, 0, 0]), 13);
});

test("fusionne l'équipement de départ", () => {
  assert.deepEqual(equipementDeDepart(["Gourde de douze godets", "30 godets"], ["Gourde", "40 godets", "Corde"], true), ["Gourde de douze godets", "Corde", "40 godets"]);
  assert.deepEqual(equipementDeDepart(["Sac", "10 po"], ["Sac", "5 po"]), ["Sac", "15 po"]);
});
