// « Le coffret d'Ixelles », premier scénario de la Cellule Hermès : canon, secrets, équilibre des rencontres.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BESTIARY } from "./bestiary";
import { CELLULE_HERMES as C, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { LE_COFFRET_D_IXELLES as S } from "./library-hermes";
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

const creatures = BESTIARY.filter((c) => c.genre === "contemporain");
/** Noms de caractéristiques du monde, de compétences et de créatures : pas des noms du canon, mais permis. */
const AUTORISES = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence", "OK", ...SKILLS.map((s) => s.name), ...creatures.map((c) => c.name)];

test("Le coffret d'Ixelles : branché dans la bibliothèque, du bon monde", () => {
  assert.ok(LIBRARY.includes(S));
  assert.equal(S.genre, "contemporain");
  assert.equal(LIBRARY.filter((x) => x.id === S.id).length, 1, "identifiant unique");
  assert.equal(S.source, "bibliotheque");
  assert.ok(S.acts.length >= 3 && S.npcs.length >= 3 && S.encounters.length >= 2 && S.twists.length >= 2 && S.rewards.length >= 2);
  const choix = S.choices ?? [];
  assert.ok(choix.length >= S.acts.length, "un choix par scène");
  for (const ch of choix) assert.ok(ch.options.length >= 2 && ch.options.every((o) => o.consequence.length > 20), ch.title);
});

test("Le coffret d'Ixelles : aucun nom hors du canon, aucun anachronisme, aucune date impossible", () => {
  assert.deepEqual(TOUT.flatMap(([ou, t]) => nomsInconnus(t, C, AUTORISES).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => anachronismesDans(t, C).map((n) => `${ou} : ${n}`)), []);
  assert.deepEqual(TOUT.flatMap(([ou, t]) => datesImpossibles(t, C).map((n) => `${ou} : ${n}`)), []);
});

test("Le coffret d'Ixelles : aucune tournure bannie, aucune fausse opposition", () => {
  for (const [ou, t] of TOUT) {
    const bas = t.toLowerCase();
    for (const mot of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${mot}([^a-zà-ÿœ]|$)`).test(bas), `${ou} contient « ${mot} »`);
    assert.ok(!/ce n'est pas[^.]*, c'est/i.test(t), `${ou} : « ce n'est pas X, c'est Y »`);
  }
});

test("Le coffret d'Ixelles : aucun secret du canon ni du scénario dans ce qu'un joueur peut lire", () => {
  const secretsDuScenario = [...S.npcs.map((n) => n.secret), ...S.twists, S.villain.motivation];
  for (const [ou, t] of PUBLIC) {
    for (const s of C.secrets) assert.ok(!t.includes(s), `${ou} : « ${s} »`);
    for (const s of secretsDuScenario) assert.ok(!t.includes(s.slice(0, 60)), `${ou} recopie un secret : « ${s.slice(0, 40)} »`);
    assert.ok(!/Cabinet|dissolution|contrat de conservation|Collection|Rachat|Boîte lue|Chassagne|Vareilles|Orlhac|Zumbrunn|Kerdilès|Deluchat/i.test(t), `${ou} nomme un secret du monde`);
    assert.ok(!/\bCoffre\b/.test(t), `${ou} nomme le Coffre`);
  }
});

test("Le coffret d'Ixelles : la lettre ne dit que la fin du contrat de prestation", () => {
  const lettre = S.readAloud?.find((r) => /lettre/i.test(r.title ?? ""));
  assert.ok(lettre);
  assert.match(lettre.text, /mettons fin au contrat de prestation/);
  assert.ok(!/2019|décret|dissol|conservation/i.test(lettre.text));
});

test("Le coffret d'Ixelles : rien de surnaturel, et la police n'est jamais un ennemi par défaut", () => {
  for (const [ou, t] of TOUT) assert.ok(!/\b(magie|magique|sortilèges?|enchantements?)/i.test(t), `${ou} parle de magie`);
  const interdits = ["dorian-meyssonnier", "inspectrice-de-la-section", "policier-d-intervention", "brigade-d-intervention", "equipe-d-extraction", "gael-tournemine", "intendant-de-la-caserne", "coup-de-filet", "caserne-en-alerte"];
  for (const e of S.encounters) for (const x of e.enemies) assert.ok(!interdits.includes(x.creatureId ?? ""), `${e.title} : ${x.creatureId} n'est pas un adversaire de départ`);
  const police = S.encounters.filter((e) => e.enemies.some((x) => /policier/.test(x.creatureId ?? "")));
  for (const e of police) assert.match(e.description, /ne sont pas des ennemis/, `${e.title} : la police n'est pas un ennemi`);
});

test("Le coffret d'Ixelles : les temps forts de la première séance sont dans le texte", () => {
  const tout = TOUT.map(([, t]) => t).join(" ");
  for (const mot of ["9 h 30", "10 h 15", "10 h 40", "11 h 05", "11 h 30", "13 h", "pli n° 4271", "Aldenhove", "Meyssonnier", "Aldebert", "Mercadier", "ligne du fond", "double fond", "coffret", "clé", "escalier", "cour de service", "cave", "Empreinte", "Caisse", "couverture", "Écoute", "Avertissement de contenu"]) {
    assert.ok(tout.includes(mot), `manque : ${mot}`);
  }
});

test("Le coffret d'Ixelles : chaque PNJ dit ce qu'il veut, ce qu'il cache et comment il parle", () => {
  for (const n of S.npcs) {
    assert.ok(n.secret.length > 60 && n.voice && n.voice.length > 20, n.name);
    assert.match(n.secret, /veut|ordre|fait son métier/i, `${n.name} : pas de désir`);
    assert.match(n.secret, /cache|ne sait pas|ne dit|ne parle|ne trahira|n'est pas|ignore/i, `${n.name} : rien de caché`);
  }
});

test("Le coffret d'Ixelles : rencontres du bestiaire, équilibrées pour quatre personnages de niveau 1, avec enjeu, sortie sans combat et prix en Empreinte", () => {
  // Seuils de la 5e pour quatre personnages de niveau 1 : facile 100, moyen 200, difficile 300, mortel 400.
  const multiplicateur = (n: number) => (n <= 1 ? 1 : n === 2 ? 1.5 : n <= 6 ? 2 : n <= 10 ? 2.5 : 3);
  for (const e of S.encounters) {
    assert.ok(e.enemies.length > 0, e.title);
    let px = 0;
    let nb = 0;
    for (const x of e.enemies) {
      const c = creatures.find((k) => k.id === x.creatureId);
      assert.ok(c, `${e.title} : créature ${x.creatureId} hors du bestiaire de la Cellule Hermès`);
      assert.equal(x.hp, c.hp);
      assert.equal(x.ac, c.ac);
      px += c.xp * x.count;
      nb += x.count;
    }
    const ajuste = px * multiplicateur(nb);
    assert.ok(ajuste <= 400, `${e.title} : ${ajuste} PX ajustés, plus que « mortelle » pour quatre personnages de niveau 1`);
    assert.ok(e.difficulty.includes(`${ajuste} PX`), `${e.title} : la difficulté annoncée (${e.difficulty}) ne correspond pas à ${ajuste} PX`);
    const mot = ajuste >= 400 ? "Mortelle" : ajuste >= 300 ? "Difficile" : ajuste >= 200 ? "Moyenne" : "Facile";
    assert.ok(e.difficulty.startsWith(mot), `${e.title} : ${ajuste} PX ajustés est « ${mot} »`);
    assert.ok(/sorties? sans combat/i.test(e.description), `${e.title} : pas de sortie sans combat`);
    assert.ok(/enjeu/i.test(e.description), `${e.title} : pas d'enjeu`);
    assert.ok(/Empreinte/.test(e.description), `${e.title} : pas de prix en Empreinte`);
    assert.match(e.difficulty, /évitable/, e.title);
  }
});
