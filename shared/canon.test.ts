import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { BESTIARY } from "./bestiary";
import { AUBRETERRE, anachronismesDans, datesImpossibles, nomsDuCanon, nomsInconnus } from "./canon";
import { generateEncounter, generateScenario } from "./generators";
import { getGenre } from "./genres";
import { LIBRARY } from "./library";
import { BACKGROUNDS, ORIGINS } from "./origins";
import { CLASSES, CONDITIONS, SKILLS } from "./rules";

const C = AUBRETERRE;
/** Champs écrits en anglais pour Flux : ni noms du monde, ni français. */
const CHAMPS_ANGLAIS = new Set(["illustration", "scene", "prompt", "id", "creatureId"]);

/** Tous les textes d'un objet, avec leur chemin. */
function textes(o: unknown, chemin = ""): [string, string][] {
  if (typeof o === "string") return [[chemin, o]];
  if (!o || typeof o !== "object") return [];
  return Object.entries(o).flatMap(([k, v]) => (CHAMPS_ANGLAIS.has(k) ? [] : textes(v, chemin ? `${chemin}.${k}` : k)));
}

const fantasy = <T extends { genre: string }>(l: T[]) => l.filter((x) => x.genre === "fantasy");
const LIVRE_JOUEURS = "content/aubreterre/joueurs";
const chapitresJoueurs = readdirSync(LIVRE_JOUEURS).map((f) => [f, readFileSync(`${LIVRE_JOUEURS}/${f}`, "utf8")] as [string, string]);

/** Ce que lit un joueur : livre des joueurs, origines, historiques, classes. */
const POUR_LES_JOUEURS: [string, string][] = [
  ...chapitresJoueurs,
  ...textes(C.cartes, "cartes"),
  ...textes(fantasy(ORIGINS), "origines"),
  ...textes(fantasy(BACKGROUNDS), "historiques"),
  ...textes(fantasy(CLASSES), "classes"),
];
/** Tout le contenu fantasy écrit à la main. */
const TOUT: [string, string][] = [
  ...POUR_LES_JOUEURS,
  ...textes(fantasy(LIBRARY), "bibliotheque"),
  ...textes(fantasy(BESTIARY), "bestiaire"),
  ...textes(getGenre("fantasy"), "genre"),
  ...textes(C.cartes, "cartes"),
];

test("canon : chronologie dans l'ordre, âges et années d'accord", () => {
  const ans = C.chronologie.map((e) => e.an);
  assert.deepEqual(ans, [...ans].sort((a, b) => a - b), "événements dans l'ordre");
  assert.ok(ans.every((a) => a <= C.calendrier.anDeJeu), "rien après l'année de jeu");
  assert.equal(C.chronologie.find((e) => e.quoi.startsWith("Le Glas"))?.an, C.calendrier.debutCourt);
  for (const f of C.figures.filter((f) => f.age !== undefined)) {
    const naissance = C.chronologie.find((e) => e.quoi.startsWith("Naissance") && e.quoi.includes(f.nom));
    if (naissance) assert.equal(C.calendrier.anDeJeu - naissance.an, f.age, f.nom);
  }
});

test("canon : chaque figure et chaque accroche tiennent à une faction ou un lieu connus", () => {
  const factions = new Set(C.factions.map((f) => f.id));
  const lieux = new Set(nomsDuCanon(C));
  for (const f of C.figures) {
    if (f.faction) assert.ok(factions.has(f.faction), `${f.nom} : faction ${f.faction}`);
    assert.ok(lieux.has(f.ou), `${f.nom} : lieu « ${f.ou} » absent du canon`);
  }
  for (const a of C.accroches) {
    assert.ok(a.factions.length > 0 && a.factions.every((id) => factions.has(id)), a.texte);
  }
  const scenarios = new Set(LIBRARY.map((s) => s.id));
  for (const f of C.figures.filter((f) => f.scenario)) assert.ok(scenarios.has(f.scenario!), `${f.nom} : scénario ${f.scenario}`);
});

test("canon : le bestiaire ne vit que dans des régions du canon", () => {
  const regions = new Set([...C.regions.map((r) => r.nom), ...C.autresLieux]);
  for (const c of fantasy(BESTIARY)) assert.ok(regions.has(c.region), `${c.name} : région ${c.region}`);
});

test("canon : aucun nom inventé dans le contenu du monde (hors chapitres de règles)", () => {
  // Les noms des créatures sont leur propre registre ; ceux des pouvoirs et des traits aussi.
  const registres = [...TOUT.filter(([k]) => /\.name$/.test(k)).map(([, v]) => v), ...SKILLS.map((x) => x.name), ...CONDITIONS.map((x) => x.name)];
  const monde = TOUT.filter(([ou]) => !ou.endsWith(".md"));
  const fautes = monde.flatMap(([ou, t]) => nomsInconnus(t, C, registres).map((n) => `${ou} : ${n}`));
  assert.deepEqual(fautes, []);
});

test("canon : aucun anachronisme, aucune date après l'année de jeu", () => {
  assert.deepEqual(TOUT.flatMap(([ou, t]) => anachronismesDans(t, C).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => datesImpossibles(t, C).map((n) => `${ou} : ${n}`)), []);
});

test("canon : aucun secret du MJ dans ce que lisent les joueurs", () => {
  const fuites = POUR_LES_JOUEURS.flatMap(([ou, t]) => C.secrets.filter((s) => t.includes(s)).map((s) => `${ou} : ${s}`));
  assert.deepEqual(fuites, []);
});

test("canon : une créature dont le nom trahit un secret a un nom public qui n'en trahit aucun", () => {
  const trahit = (n: string) => C.secrets.some((s) => n.includes(s));
  for (const c of fantasy(BESTIARY).filter((c) => trahit(c.name))) {
    assert.ok(c.publicName && !trahit(c.publicName), c.name);
  }
});

test("canon : un PNJ tiré au hasard ne devient jamais une figure du canon", () => {
  const figures = new Set(C.figures.flatMap((f) => [f.nom, ...(f.alias ?? [])]));
  for (const p of C.noms.prenoms) for (const n of C.noms.familles) assert.ok(!figures.has(p + n), p + n);
  for (let seed = 1; seed <= 200; seed++) {
    const s = generateScenario({ genre: "fantasy", ton: "sombre", level: 1 + (seed % 20), players: 4, seed });
    for (const n of [s.villain.name, ...s.npcs.map((x) => x.name)]) assert.ok(!figures.has(n), `graine ${seed} : ${n}`);
  }
});

test("canon : les rencontres fantasy prennent leurs créatures et leurs lieux dans le monde", () => {
  const ids = new Set(fantasy(BESTIARY).map((c) => c.id));
  const lieux = new Set([...C.regions.map((r) => r.lieuDeRencontre), "une fissure sous la Rotonde"]);
  for (let seed = 1; seed <= 200; seed++) {
    const level = 1 + (seed % 20);
    const e = generateEncounter("fantasy", level, 4, seed);
    for (const x of e.enemies) {
      assert.ok(x.creatureId && ids.has(x.creatureId), `graine ${seed} : ${x.name}`);
      const cr = BESTIARY.find((c) => c.id === x.creatureId)!.cr;
      assert.ok(cr <= Math.max(0.5, level), `graine ${seed} : ${x.name} (FP ${cr}) trop fort au niveau ${level}`);
    }
    assert.ok([...lieux].some((l) => e.title.endsWith(l)), `graine ${seed} : ${e.title}`);
  }
});
