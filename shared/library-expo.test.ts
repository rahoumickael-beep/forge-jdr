// « La soirée du Cocher », premier scénario de l'Exposition éternelle : canon, secrets, équilibre des rencontres.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BESTIARY } from "./bestiary";
import { EXPOSITION as C, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { LA_SOIREE_DU_COCHER as S } from "./library-expo";
import { LIBRARY } from "./library";
import { SKILLS } from "./rules";

const BANNED = [
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric", "véritable", "au-delà", "tisser", "tisse",
];

/** Tous les textes du scénario, avec leur chemin. */
function textes(o: unknown, chemin = ""): [string, string][] {
  if (typeof o === "string") return [[chemin, o]];
  if (!o || typeof o !== "object") return [];
  return Object.entries(o).flatMap(([k, v]) => (k === "creatureId" ? [] : textes(v, chemin ? `${chemin}.${k}` : k)));
}
const TOUT = textes(S);
/** Ce qui peut être lu ou montré aux joueurs : accroche, textes à lire, titre de la carte. Le reste est au MJ. */
const PUBLIC = textes({ title: S.title, hook: S.hook, readAloud: S.readAloud, mapHint: S.mapHint });

const creatures = BESTIARY.filter((c) => c.genre === "steampunk");
/** Noms de caractéristiques du monde, de compétences et de créatures : pas des noms du canon, mais permis. */
const AUTORISES = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence", ...SKILLS.map((s) => s.name), ...creatures.map((c) => c.name)];

test("La soirée du Cocher : branchée dans la bibliothèque, du bon monde", () => {
  assert.ok(LIBRARY.includes(S));
  assert.equal(S.genre, "steampunk");
  assert.equal(LIBRARY.filter((x) => x.id === S.id).length, 1, "identifiant unique");
  assert.equal(S.source, "bibliotheque");
  assert.ok(S.acts.length >= 3 && S.npcs.length >= 3 && S.encounters.length >= 2 && S.twists.length >= 2 && S.rewards.length >= 2);
  const choix = S.choices ?? [];
  assert.ok(choix.length >= S.acts.length, "un choix par scène");
  for (const ch of choix) assert.ok(ch.options.length >= 2 && ch.options.every((o) => o.consequence.length > 20), ch.title);
});

test("La soirée du Cocher : aucun nom hors du canon, aucun anachronisme, aucune date impossible", () => {
  assert.deepEqual(TOUT.flatMap(([ou, t]) => nomsInconnus(t, C, AUTORISES).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => anachronismesDans(t, C).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => datesImpossibles(t, C).map((n) => `${ou} : ${n}`)), []);
});

test("La soirée du Cocher : aucune tournure bannie", () => {
  for (const [ou, t] of TOUT) {
    const bas = t.toLowerCase();
    for (const mot of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${mot}([^a-zà-ÿœ]|$)`).test(bas), `${ou} contient « ${mot} »`);
  }
});

test("La soirée du Cocher : aucun secret du canon ni du scénario dans ce qu'un joueur peut lire", () => {
  const secretsDuScenario = [...S.npcs.map((n) => n.secret), ...S.twists, S.villain.motivation];
  for (const [ou, t] of PUBLIC) {
    for (const s of C.secrets) assert.ok(!t.includes(s), `${ou} : « ${s} »`);
    for (const s of secretsDuScenario) assert.ok(!t.includes(s.slice(0, 60)), `${ou} recopie un secret : « ${s.slice(0, 40)} »`);
    assert.ok(!/Veilleur|Delestrade|pièce mère|Dormeuse|Fosse/i.test(t), `${ou} nomme un secret du monde`);
  }
});

test("La soirée du Cocher : pas de magie, et les Gens des Villages, ouvrières et Réfractaires ne sont jamais des ennemis", () => {
  for (const [ou, t] of TOUT) assert.ok(!/\b(magie|magique|sortilèges?|enchantements?)/i.test(t), `${ou} parle de magie`);
  const interdits = ["impresario-des-villages", "artificier-refractaire", "anatole-gerfaux", "homme-au-manteau-gris", "medecin-en-manteau-gris", "cocher-mecanique"];
  for (const e of S.encounters) for (const x of e.enemies) assert.ok(!interdits.includes(x.creatureId ?? ""), `${e.title} : ${x.creatureId} n'est pas un ennemi de départ`);
});

test("La soirée du Cocher : les temps forts de la première séance sont dans le texte", () => {
  const tout = TOUT.map(([, t]) => t).join(" ");
  for (const mot of ["21 h 40", "22 h 10", "Pétrel", "Cordebard", "Dorlhac", "Quillebeuf", "Mauvezin", "infirmerie du Trocadéro", "nuit de grand courant", "Cocher mécanique", "valets", "Panne", "Pression"]) {
    assert.ok(tout.includes(mot), `manque : ${mot}`);
  }
});

test("La soirée du Cocher : chaque PNJ dit ce qu'il veut, ce qu'il cache et comment il parle", () => {
  for (const n of S.npcs) {
    assert.ok(n.secret.length > 60 && n.voice && n.voice.length > 20, n.name);
    assert.match(n.secret, /veut|ordre|fait son métier/i, `${n.name} : pas de désir`);
    assert.match(n.secret, /cache|ne sait pas|ne dit|ne parle|ne tuera|ne trahira|n'est pas|ignore/i, `${n.name} : rien de caché`);
  }
});

test("La soirée du Cocher : rencontres du bestiaire, équilibrées pour quatre personnages de niveau 1, avec enjeu et sortie sans combat", () => {
  // Seuils de la 5e pour quatre personnages de niveau 1 : facile 100, moyen 200, difficile 300, mortel 400.
  const multiplicateur = (n: number) => (n <= 1 ? 1 : n === 2 ? 1.5 : n <= 6 ? 2 : n <= 10 ? 2.5 : 3);
  for (const e of S.encounters) {
    assert.ok(e.enemies.length > 0, e.title);
    let px = 0;
    let nb = 0;
    for (const x of e.enemies) {
      const c = creatures.find((k) => k.id === x.creatureId);
      assert.ok(c, `${e.title} : créature ${x.creatureId} hors du bestiaire de l'Exposition`);
      assert.equal(x.hp, c.hp);
      assert.equal(x.ac, c.ac);
      px += c.xp * x.count;
      nb += x.count;
    }
    const ajuste = px * multiplicateur(nb);
    assert.ok(ajuste <= 300, `${e.title} : ${ajuste} PX ajustés, plus que « difficile » pour quatre personnages de niveau 1`);
    assert.ok(e.difficulty.includes(`${ajuste} PX`), `${e.title} : la difficulté annoncée (${e.difficulty}) ne correspond pas à ${ajuste} PX`);
    assert.ok(/sorties? sans combat/i.test(e.description), `${e.title} : pas de sortie sans combat`);
    assert.ok(/enjeu/i.test(e.description), `${e.title} : pas d'enjeu`);
    assert.match(e.difficulty, /évitable/, e.title);
  }
});
