// « La barre noire », premier scénario des Îles du Vent : canon, secrets, équilibre des rencontres.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BESTIARY } from "./bestiary";
import { ILES_DU_VENT as C, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { LA_BARRE_NOIRE as S } from "./library-iles";
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

const creatures = BESTIARY.filter((c) => c.genre === "pirates");
/** Noms de caractéristiques du monde, de compétences et de créatures : pas des noms du canon, mais permis. */
const AUTORISES = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence", ...SKILLS.map((s) => s.name), ...creatures.map((c) => c.name)];

test("La barre noire : branchée dans la bibliothèque, du bon monde", () => {
  assert.ok(LIBRARY.includes(S));
  assert.equal(S.genre, "pirates");
  assert.equal(LIBRARY.filter((x) => x.id === S.id).length, 1, "identifiant unique");
  assert.equal(S.source, "bibliotheque");
  assert.ok(S.acts.length >= 3 && S.npcs.length >= 3 && S.encounters.length >= 2 && S.twists.length >= 2 && S.rewards.length >= 2);
});

test("La barre noire : aucun nom hors du canon, aucun anachronisme, aucune date impossible", () => {
  assert.deepEqual(TOUT.flatMap(([ou, t]) => nomsInconnus(t, C, AUTORISES).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => anachronismesDans(t, C).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => datesImpossibles(t, C).map((n) => `${ou} : ${n}`)), []);
});

test("La barre noire : aucune tournure bannie", () => {
  for (const [ou, t] of TOUT) {
    const bas = t.toLowerCase();
    for (const mot of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${mot}([^a-zà-ÿœ]|$)`).test(bas), `${ou} contient « ${mot} »`);
  }
});

test("La barre noire : aucun secret du canon ni du scénario dans ce qu'un joueur peut lire", () => {
  const secretsDuScenario = [...S.npcs.map((n) => n.secret), ...S.twists, S.villain.motivation];
  for (const [ou, t] of PUBLIC) {
    for (const s of C.secrets) assert.ok(!t.includes(s), `${ou} : « ${s} »`);
    for (const s of secretsDuScenario) assert.ok(!t.includes(s.slice(0, 60)), `${ou} recopie un secret : « ${s.slice(0, 40)} »`);
    assert.ok(!/\bfaux\b|\bfausse/i.test(t), `${ou} parle du faux`);
  }
});

test("La barre noire : la caisse et la croix sont des indices, le faux n'est jamais expliqué aux joueurs ni au MJ en clair dans une scène", () => {
  const dansLeScenario = TOUT.map(([, t]) => t).join(" ");
  assert.ok(dansLeScenario.includes("croix peinte en rouge") && dansLeScenario.includes("caisse"));
  for (const [ou, t] of TOUT) assert.ok(!/(piastres? (de plomb|fausses?)|argent (était|est) faux|pièces? fausses?)/i.test(t), `${ou} révèle le faux`);
});

test("La barre noire : une cargaison de captifs n'est jamais une prise", () => {
  for (const [ou, t] of TOUT) {
    assert.ok(!/captifs?[^.]{0,60}(butin|prise|part de)|(butin|prise)[^.]{0,40}captifs?/i.test(t.replace(/n'est jamais une prise|ne leur donne pas de prix/g, "")), `${ou} chiffre ou partage des captifs`);
  }
});

test("La barre noire : rencontres du bestiaire, équilibrées pour quatre personnages de niveau 1-2, avec une sortie sans combat", () => {
  // Seuils de la 5e pour quatre personnages : niveau 1 (facile 100, moyen 200, difficile 300, mortel 400) ; niveau 2 (×2).
  const multiplicateur = (n: number) => (n <= 1 ? 1 : n === 2 ? 1.5 : n <= 6 ? 2 : n <= 10 ? 2.5 : 3);
  for (const e of S.encounters) {
    assert.ok(e.enemies.length > 0, e.title);
    let px = 0;
    let nb = 0;
    for (const x of e.enemies) {
      const c = creatures.find((k) => k.id === x.creatureId);
      assert.ok(c, `${e.title} : créature ${x.creatureId} hors du bestiaire des Îles`);
      assert.equal(x.hp, c.hp);
      assert.equal(x.ac, c.ac);
      px += c.xp * x.count;
      nb += x.count;
    }
    const ajuste = px * multiplicateur(nb);
    assert.ok(ajuste <= 300, `${e.title} : ${ajuste} PX ajustés, plus que « difficile » pour quatre personnages de niveau 1`);
    assert.ok(/sorties? sans combat/i.test(e.description), `${e.title} : pas de sortie sans combat`);
    assert.ok(/enjeu/i.test(e.description), `${e.title} : pas d'enjeu`);
    assert.match(e.difficulty, /évitable/, e.title);
  }
});

test("La barre noire : le Moral de départ, la Chance et les armes à un coup sont dits", () => {
  const tout = TOUT.map(([, t]) => t).join(" ");
  assert.match(tout, /Moral de la Pie-Noire est à 5/);
  assert.match(tout, /Chance/);
  assert.match(tout, /coup de main/i);
  assert.match(tout, /un seul coup|un coup/);
  assert.match(tout, /chasse-partie/);
});
