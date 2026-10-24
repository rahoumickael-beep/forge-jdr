import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { catalogue, carteDuCatalogue, nettoyerCollections, TAILLE_PAQUET, tirerPaquet } from "./collection";

const CAT = catalogue("fantasy");

for (const genre of ["fantasy", "science-fiction", "dark-fantasy", "cyberpunk", "horreur", "post-apo", "western", "pirates", "steampunk"] as const) test(`collection : un catalogue ${genre} avec des ids uniques et chaque rareté`, () => {
  const CAT = catalogue(genre);
  assert.ok(CAT.length >= 25, `${CAT.length} cartes`);
  assert.equal(new Set(CAT.map((c) => c.id)).size, CAT.length);
  for (const r of ["commune", "peu-commune", "rare", "relique"]) assert.ok(CAT.some((c) => c.rarete === r), r);
  for (const c of CAT) {
    assert.ok(c.texte && c.usage, c.id);
    if (c.image) assert.ok(existsSync(`client/public/cartes/${c.image}.webp`), `${c.image} manque : node scripts/vignettes-figurines.mjs`);
  }
});

test("collection : un paquet = 3 communes, 2 peu communes, puis une rare ou une relique", () => {
  let reliques = 0;
  const N = 2000;
  for (let seed = 1; seed <= N; seed++) {
    const ids = tirerPaquet("fantasy", seed);
    assert.equal(ids.length, TAILLE_PAQUET);
    const r = ids.map((id) => carteDuCatalogue("fantasy", id)!.rarete);
    assert.deepEqual(r.slice(0, 5), ["commune", "commune", "commune", "peu-commune", "peu-commune"]);
    assert.ok(r[5] === "rare" || r[5] === "relique");
    if (r[5] === "relique") reliques++;
    assert.equal(new Set(ids).size, ids.length, "pas de doublon dans un même paquet");
  }
  assert.ok(reliques / N > 0.2 && reliques / N < 0.3, `reliques : ${reliques / N}`);
  assert.deepEqual(tirerPaquet("contemporain", 1), [], "un monde sans catalogue ne donne rien");
});

test("collection : une collection importée ne garde que des cartes du catalogue et des joueurs présents", () => {
  const c = nettoyerCollections(
    { p1: { paquets: 500, cartes: [{ id: "sel-benit", signature: true, pirate: 1 }, { id: "inventee" }, "x"] }, intrus: { paquets: 3, cartes: [] } },
    "fantasy",
    ["p1"],
  );
  assert.deepEqual(Object.keys(c), ["p1"]);
  assert.equal(c.p1.paquets, 99);
  assert.deepEqual(c.p1.cartes, [{ id: "sel-benit", signature: true }]);
});
