import assert from "node:assert/strict";
import { test } from "node:test";
import { subclassLevel } from "./origins";
import { ARCHIPEL, RESIDENCE, TERNELANDE } from "./canon";
import { classesFor, CLASSES, SKILLS } from "./rules";
import { HISTORIQUES_RESIDENCE, ORIGINES_RESIDENCE, PERSONNALITE_RESIDENCE } from "./residence-origines";
import { REGLES_RESIDENCE } from "./residence-regles";

const fantasy = classesFor("fantasy");
const archipel = classesFor("science-fiction");
const ternelande = classesFor("dark-fantasy");
const residence = classesFor("cyberpunk");
const jouables = [...fantasy, ...archipel, ...ternelande, ...residence];

test("sous-classes : deux par classe fantasy, avec un titre", () => {
  assert.equal(fantasy.length, 14);
  assert.equal(archipel.length, 10);
  assert.equal(ternelande.length, 10);
  assert.equal(residence.length, 10);
  for (const c of jouables) {
    assert.equal(c.subclasses.length, 2, `${c.name} : ${c.subclasses.length} sous-classes`);
    assert.ok(c.subclassTitle && c.subclassTitle !== "Sous-classe", `${c.name} : pas de titre de sous-classe`);
  }
});

test("sous-classes : ids uniques", () => {
  const ids = CLASSES.flatMap((c) => c.subclasses.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, "id de sous-classe en double");
});

test("sous-classes : premier pouvoir au niveau de choix, puis 3 ou 4 de plus", () => {
  for (const c of jouables) {
    const entry = subclassLevel(c.id);
    for (const s of c.subclasses) {
      const levels = s.powers.map((p) => p.level);
      assert.equal(Math.min(...levels), entry, `${s.name} : premier pouvoir au niveau ${Math.min(...levels)}, attendu ${entry}`);
      assert.ok(levels.every((l) => l >= 1 && l <= 20), `${s.name} : niveau hors de 1 à 20`);
      const later = new Set(levels.filter((l) => l > entry));
      assert.ok(later.size >= 3 && later.size <= 4, `${s.name} : ${later.size} niveaux après l'entrée`);
      // Pas deux pouvoirs du même nom sur la fiche (classe + sous-classe)
      const names = [...c.powers, ...s.powers].map((p) => p.name);
      assert.equal(new Set(names).size, names.length, `${s.name} : nom de pouvoir en double avec la classe`);
      assert.ok(s.pitch.length > 20 && s.description.length > 80, `${s.name} : textes trop courts`);
      for (const p of s.powers) {
        if (p.recharge === "repos court" || p.recharge === "repos long") {
          // un pouvoir limité dit combien de fois, sauf s'il coûte des points de souffle
          assert.ok(p.uses || /souffle/.test(p.effect), `${s.name} / ${p.name} : nombre d'utilisations manquant`);
        }
      }
    }
  }
});

test("sous-classes : les deux d'une classe tombent aux mêmes niveaux", () => {
  for (const c of jouables) {
    const [a, b] = c.subclasses.map((s) => s.powers.map((p) => p.level).join(","));
    assert.equal(a, b, `${c.name} : niveaux différents entre sous-classes`);
  }
});

const BANNED = [
  // Skill ecrire-scenario
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric",
  // Tics repérés ailleurs dans le projet
  "véritable", "au-delà", "tisser", "tisse",
];

// Sous-classes de la 5e hors SRD 5.1 : leurs noms ne doivent pas apparaître.
const PROTECTED = [
  "maître de guerre", "chevalier occulte", "arnaqueur arcanique", "assassin", "domaine de la tempête", "domaine de la guerre",
  "domaine de la lumière", "domaine de la ruse", "domaine de la nature", "domaine de la tombe", "domaine de la forge",
  "serment des anciens", "serment de vengeance", "serment de la couronne", "cercle de la lune", "maître des bêtes",
  "collège de la vaillance", "voie du totem", "totem", "voie de l'ombre", "quatre éléments", "magie sauvage",
  "grand ancien", "archifée", "céleste déchu", "lame maudite", "école d'abjuration", "école de nécromancie",
  "école d'illusion", "école de divination",
];

test("sous-classes : ni tournure bannie, ni nom protégé, ni Gorvan dans le texte joueur", () => {
  for (const c of jouables) {
    for (const s of c.subclasses) {
      const text = JSON.stringify(s).toLowerCase();
      for (const word of [...BANNED, ...PROTECTED]) {
        const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
        assert.ok(!re.test(text), `${s.id} contient « ${word} »`);
      }
      assert.ok(!text.includes("gorvan"), `${s.id} nomme Gorvan, qui doit rester caché aux joueurs`);
    }
  }
});

test("classes de l'Archipel : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify(archipel);
  for (const secret of ARCHIPEL.secrets) assert.ok(!text.includes(secret), secret);
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de l'Archipel : « ${word} »`);
  }
});

test("classes de la Ternelande : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify(ternelande);
  for (const secret of TERNELANDE.secrets) assert.ok(!text.includes(secret), secret);
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de la Ternelande : « ${word} »`);
  }
});

test("classes de la Résidence : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([residence, ORIGINES_RESIDENCE, HISTORIQUES_RESIDENCE, REGLES_RESIDENCE, PERSONNALITE_RESIDENCE]);
  for (const secret of RESIDENCE.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Concierge", "Gérance", "Hector est mort", "mort d'Hector", "transfert d'heures", "Compteurs de morts"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur de la Résidence : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de la Résidence : « ${word} »`);
  }
  for (const mot of RESIDENCE.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans la Résidence : « ${mot} »`);
  }
});

test("classes de la Résidence : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Corps", "Réflexes", "Endurance", "Technique", "Instinct", "Aplomb"]);
  for (const c of residence) {
    assert.ok(c.id.startsWith("cp-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
  }
  for (const h of HISTORIQUES_RESIDENCE) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_RESIDENCE.length, 6);
  assert.equal(HISTORIQUES_RESIDENCE.length, 8);
});
