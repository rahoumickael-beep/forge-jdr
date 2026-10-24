// Contrôles communs à tous les mondes : chaque canon branché dans CANONS doit tenir debout tout seul.
// Les contrôles propres à Aubreterre (contenu écrit, bestiaire, rencontres) restent dans canon.test.ts.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CANONS, nomsDuCanon } from "./canon";
import { LIEUX_AUBRETERRE, NOMS_AUBRETERRE } from "./canon/fantasy-table";
import { LIEUX_ARCHIPEL, NOMS_ARCHIPEL } from "./canon/science-fiction-table";
import { LIEUX_TERNELANDE, NOMS_TERNELANDE } from "./canon/dark-fantasy-table";
import { LIEUX_RESIDENCE, NOMS_RESIDENCE } from "./canon/cyberpunk-table";
import { LIEUX_COTE_DES_NOYES, NOMS_COTE_DES_NOYES } from "./canon/horreur-table";
import { LIEUX_GRAND_SEC, NOMS_GRAND_SEC } from "./canon/post-apo-table";
import type { Canon } from "./canon";

/** Ce que la table des joueurs charge de chaque canon. */
const TABLES: Record<string, { lieux: string[]; noms: Canon["noms"] }> = {
  fantasy: { lieux: LIEUX_AUBRETERRE, noms: NOMS_AUBRETERRE },
  "science-fiction": { lieux: LIEUX_ARCHIPEL, noms: NOMS_ARCHIPEL },
  "dark-fantasy": { lieux: LIEUX_TERNELANDE, noms: NOMS_TERNELANDE },
  cyberpunk: { lieux: LIEUX_RESIDENCE, noms: NOMS_RESIDENCE },
  horreur: { lieux: LIEUX_COTE_DES_NOYES, noms: NOMS_COTE_DES_NOYES },
  "post-apo": { lieux: LIEUX_GRAND_SEC, noms: NOMS_GRAND_SEC },
};

for (const C of Object.values(CANONS) as Canon[]) {
  const g = C.genre;

  test(`canon ${g} : chronologie dans l'ordre, calendrier et âges d'accord`, () => {
    const ans = C.chronologie.map((e) => e.an);
    assert.deepEqual(ans, [...ans].sort((a, b) => a - b), "événements dans l'ordre");
    assert.ok(ans.every((a) => a <= C.calendrier.anDeJeu), "rien après l'année de jeu");
    assert.ok(ans.includes(C.calendrier.debutCourt), "un événement ouvre le calendrier court");
    for (const f of C.figures.filter((f) => f.age !== undefined)) {
      const naissance = C.chronologie.find((e) => e.quoi.startsWith("Naissance") && e.quoi.includes(f.nom));
      if (naissance) assert.equal(C.calendrier.anDeJeu - naissance.an, f.age, f.nom);
    }
  });

  test(`canon ${g} : figures, accroches et jauge tiennent à des factions et des lieux connus`, () => {
    const factions = new Set(C.factions.map((f) => f.id));
    assert.equal(factions.size, C.factions.length, "ids de faction uniques");
    const lieux = new Set(nomsDuCanon(C));
    for (const f of C.figures) {
      if (f.faction) assert.ok(factions.has(f.faction), `${f.nom} : faction ${f.faction}`);
      assert.ok(lieux.has(f.ou), `${f.nom} : lieu « ${f.ou} » absent du canon`);
    }
    for (const a of [...C.accroches, ...(C.campagne?.accroches ?? [])]) {
      assert.ok(a.factions.length > 0 && a.factions.every((id) => factions.has(id)), JSON.stringify(a));
    }
    const seuils = C.campagne?.jauge?.seuils.map((s) => s.valeur) ?? [];
    assert.deepEqual(seuils, [...seuils].sort((a, b) => b - a), "seuils du plus haut au plus bas");
  });

  test(`canon ${g} : un nom tiré au hasard ne redonne jamais une figure`, () => {
    const figures = new Set(C.figures.flatMap((f) => [f.nom, ...(f.alias ?? [])]));
    for (const p of C.noms.prenoms) for (const n of C.noms.familles) assert.ok(!figures.has(p + n), p + n);
  });

  test(`canon ${g} : la table publique concorde avec le canon et ne trahit aucun secret`, () => {
    const table = TABLES[g];
    assert.ok(table, `table publique du genre ${g} à déclarer dans ce test`);
    assert.deepEqual(table.lieux, C.regions.map((r) => r.lieuDeRencontre));
    assert.equal(C.noms, table.noms);
    const texte = JSON.stringify(table);
    for (const secret of C.secrets) assert.ok(!texte.includes(secret), secret);
  });

  test(`canon ${g} : aucun secret dans les cartes que lisent les joueurs`, () => {
    const texte = JSON.stringify(C.cartes ?? {});
    for (const secret of C.secrets) assert.ok(!texte.includes(secret), secret);
  });
}

test("campagne : la jauge garde sa valeur de départ, même au-dessus de 100", async () => {
  const { nettoyerCampagne, nouvelleCampagne, reglerJauge } = await import("./campagne");
  const { ARCHIPEL } = await import("./canon");
  const c = nettoyerCampagne(JSON.parse(JSON.stringify(nouvelleCampagne("science-fiction"))), "science-fiction");
  assert.equal(c.jauge, 131);
  reglerJauge(c, 200, ARCHIPEL);
  assert.equal(c.jauge, 131);
});

test("bibliothèque : chaque figure d'un scénario renvoie à un scénario qui existe, du bon genre", async () => {
  const { LIBRARY } = await import("./library");
  for (const C of Object.values(CANONS) as Canon[])
    for (const f of C.figures.filter((x) => x.scenario)) {
      const s = LIBRARY.find((x) => x.id === f.scenario);
      assert.ok(s && s.genre === C.genre, `${f.nom} : scénario ${f.scenario}`);
    }
});

test("livres des joueurs : aucun secret du canon dans les chapitres écrits pour les joueurs", async () => {
  const { existsSync, readdirSync, readFileSync } = await import("node:fs");
  const dossiers: Record<string, string> = { fantasy: "content/aubreterre/joueurs", "science-fiction": "content/archipel/joueurs", "dark-fantasy": "content/ternelande/joueurs", cyberpunk: "content/residence/joueurs", horreur: "content/cote-des-noyes/joueurs", "post-apo": "content/grand-sec/joueurs" };
  for (const C of Object.values(CANONS) as Canon[]) {
    const d = dossiers[C.genre];
    if (!d || !existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      const t = readFileSync(`${d}/${f}`, "utf8");
      for (const s of C.secrets) assert.ok(!t.includes(s), `${d}/${f} : « ${s} »`);
    }
  }
});
