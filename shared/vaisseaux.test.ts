import assert from "node:assert/strict";
import { test } from "node:test";
import type { Character } from "./types";
import { ACTIONS, encaisser, jouerAction, MODELES, nettoyerVaisseaux, nouveauRound, nouveauVaisseau, POSTES, vaisseauxPourJoueur } from "./vaisseaux";

/** Dés pipés : chaque appel rend la valeur suivante de la liste (entre 0 et 1). */
const pipe = (...faces: number[]) => {
  let i = 0;
  return () => faces[i++ % faces.length];
};
/** Valeur à donner à `random` pour obtenir une face précise d'un dé. */
const face = (n: number, cotes: number) => (n - 0.5) / cotes;

const artilleuse = { id: "c1", name: "Soline", level: 5, stats: { Réflexes: 16, Technique: 14, Instinct: 12, Présence: 10, Puissance: 10, Endurance: 12 } } as unknown as Character;

test("vaisseaux : chaque modèle est complet, chaque poste a une action", () => {
  for (const m of MODELES) {
    assert.ok(m.coque > 0 && m.ca >= 10 && m.vitesse > 0 && m.taille >= 1, m.id);
    for (const a of m.armes) assert.match(a.degats, /^\d+d\d+$/, `${m.id} : ${a.nom}`);
  }
  for (const p of POSTES) assert.ok(ACTIONS.some((a) => a.poste === p.id), p.id);
  const cargo = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  assert.equal(cargo.defauts.length, 3, "un vieux cargo a trois défauts");
  assert.equal(cargo.cache, false);
  assert.equal(nouveauVaisseau("fregate", "", "autre").cache, true, "un vaisseau ennemi commence caché");
});

test("vaisseaux : les boucliers prennent les dégâts avant la coque", () => {
  const v = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  assert.equal(encaisser(v, 15), 0);
  assert.equal(v.boucliers, 5);
  assert.equal(encaisser(v, 15), 10);
  assert.deepEqual([v.boucliers, v.coque], [0, 50]);
  encaisser(v, 999);
  assert.equal(v.coque, 0, "la coque ne descend pas sous zéro");
});

test("vaisseaux : un tir touche, désigner donne l'avantage, un 20 double les dés", () => {
  const nous = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  const eux = nouveauVaisseau("corvette-de-douane", "Corvette", "autre");
  // 15 au d20 + 4 (arme) + 3 (Réflexes 16) = 22 contre CA 14 ; dégâts 2d8 : 5 et 5.
  const r = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux, arme: 0 }, pipe(face(15, 20), face(5, 8), face(5, 8)));
  assert.match(r.texte, /22 contre CA 14/);
  assert.equal(eux.boucliers, 20, "10 dégâts sur 30 de boucliers");
  // La vigie désigne, puis un tir critique : 20 naturel, dégâts doublés (deux jets de 2d8).
  jouerAction("science-fiction", nous, "designer", artilleuse, {}, pipe(face(18, 20)));
  assert.equal(nous.effets.visee, true);
  const c = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux, arme: 0 }, pipe(face(20, 20), face(2, 20), face(8, 8), face(8, 8), face(8, 8), face(8, 8)));
  assert.match(c.texte, /coup critique/);
  assert.equal(c.jets.length, 3);
  assert.equal(nous.effets.visee, false, "l'avantage est consommé");
  assert.equal(eux.boucliers + eux.coque, 20 + 80 - 32);
});

test("vaisseaux : un 1 naturel manque, et bloque la tourelle du vieux cargo", () => {
  const nous = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  const eux = nouveauVaisseau("chasseur", "Chasseur", "autre");
  const r = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux }, pipe(face(1, 20)));
  assert.match(r.texte, /manqué\. La tourelle se bloque/);
  assert.equal(eux.coque, eux.coqueMax);
});

test("vaisseaux : esquive et ordre durent un round", () => {
  const v = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  jouerAction("science-fiction", v, "esquive", artilleuse, {}, pipe(face(15, 20)));
  assert.equal(v.effets.esquive, 4, "15 + 3 + 3 = 21 : +4 CA");
  nouveauRound(v);
  assert.deepEqual(v.effets, {});
  assert.throws(() => jouerAction("science-fiction", v, "tirer", artilleuse, {}), /vaisseau à viser/);
});

test("vaisseaux : les joueurs ne voient ni vaisseau caché ni note du MJ ; l'import est borné", () => {
  const nous = { ...nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe"), notes: "La Main Close a posé un traceur dans la soute." };
  const eux = nouveauVaisseau("fregate", "Frégate en embuscade", "autre");
  const vue = vaisseauxPourJoueur([nous, eux]);
  assert.equal(vue.length, 1);
  assert.equal(JSON.stringify(vue).includes("traceur"), false);
  const propre = nettoyerVaisseaux([{ ...nous, coque: 99999, armes: [{ nom: "Canon", bonus: 3, degats: "rm -rf", portee: 10 }] }, "n'importe quoi"]);
  assert.equal(propre.length, 1);
  assert.equal(propre[0].coque, propre[0].coqueMax);
  assert.equal(propre[0].armes[0].degats, "1d6");
});
