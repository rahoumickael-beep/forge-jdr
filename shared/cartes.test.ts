import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { creaturesFor, fichierCreature } from "./bestiary";
import { AUBRETERRE } from "./canon";
import { nettoyerCarte, tirerCarte, TYPES_DE_CARTE } from "./cartes";
import { GENRES } from "./genres";

test("cartes : chaque pioche donne une carte complète, dans chaque genre", () => {
  for (const g of GENRES)
    for (const t of TYPES_DE_CARTE) {
      const c = tirerCarte(t.id, g.id, 5, 42);
      assert.ok(c.titre && c.texte && c.type === t.id, `${g.id} ${t.id}`);
    }
});

test("cartes : une rencontre fantasy a son illustration, et toute la pioche fantasy reste sans secret", () => {
  const vues = new Set<string>();
  for (let seed = 1; seed <= 400; seed++)
    for (const t of TYPES_DE_CARTE) {
      const c = tirerCarte(t.id, "fantasy", 20, seed);
      vues.add(c.id);
      const json = JSON.stringify(c);
      for (const s of AUBRETERRE.secrets) assert.ok(!json.toLowerCase().includes(s.toLowerCase()) && !/gorvan/i.test(json), `${c.id} contient « ${s} »`);
      if (c.image) assert.ok(existsSync(`client/public${c.image}`), `${c.image} manque : node scripts/vignettes-figurines.mjs`);
    }
  // Les créatures au nom secret sortent bien, sous leur nom public.
  assert.ok(vues.has("rencontre:bouche-du-dessous"));
  assert.ok(creaturesFor("fantasy").filter((c) => !c.legendary).every((c) => vues.has(`rencontre:${fichierCreature(c)}`)), "toutes les rencontres finissent par sortir");
});

test("cartes : la pioche évite les cartes déjà sorties", () => {
  const deja = AUBRETERRE.cartes!.evenements.slice(1).map((e) => `evenement:${e.titre}`);
  assert.equal(tirerCarte("evenement", "fantasy", 3, 7, deja).titre, AUBRETERRE.cartes!.evenements[0].titre);
});

test("cartes : le serveur ne garde qu'une carte propre", () => {
  assert.equal(nettoyerCarte({ type: "sortilege", titre: "x" }), null);
  assert.equal(nettoyerCarte({ type: "objet", titre: "  " }), null);
  const c = nettoyerCarte({ type: "objet", titre: "Clou", texte: "x".repeat(900), image: "https://ailleurs.example/x.png", pirate: true })!;
  assert.equal(c.texte.length, 600);
  assert.equal(c.image, undefined);
  assert.ok(!("pirate" in c));
  assert.equal(nettoyerCarte({ type: "rencontre", titre: "Noyé", image: "/cartes/noye.webp" })!.image, "/cartes/noye.webp");
});
