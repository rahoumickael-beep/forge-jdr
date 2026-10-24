import assert from "node:assert/strict";
import { test } from "node:test";
import { estVide, nettoyerSouvenirs, nouveauxPerdus, raconter, SOUVENIRS_MAX, user } from "./souvenirs";

test("souvenirs : user rend flou puis perdu, raconter rend intact un souvenir flou seulement", () => {
  assert.equal(user("intact"), "flou");
  assert.equal(user("flou"), "perdu");
  assert.equal(user("perdu"), "perdu");
  assert.equal(raconter("flou"), "intact");
  assert.equal(raconter("perdu"), "perdu", "un souvenir perdu ne revient pas en le racontant");
});

test("souvenirs : la liste est nettoyée, bornée, et compte les nouveaux souvenirs perdus", () => {
  const propre = nettoyerSouvenirs([{ texte: "  Le visage de ma mère ", etat: "intact" }, { texte: "", etat: "flou" }, { texte: "x", etat: "inventé" }, "n'importe quoi", ...Array(20).fill({ texte: "a", etat: "flou" })])!;
  assert.equal(propre.length, SOUVENIRS_MAX);
  assert.equal(propre[0].texte, "Le visage de ma mère");
  assert.equal(propre[1].etat, "intact", "un état inconnu redevient intact");
  assert.equal(nettoyerSouvenirs("pas une liste"), undefined);
  const avant = [{ texte: "a", etat: "flou" as const }, { texte: "b", etat: "intact" as const }];
  assert.equal(nouveauxPerdus(avant, [{ texte: "a", etat: "perdu" }, { texte: "b", etat: "intact" }]), 1);
  assert.equal(nouveauxPerdus(avant, avant), 0);
  assert.equal(estVide([{ texte: "a", etat: "flou" }]), true);
  assert.equal(estVide([]), false);
});
