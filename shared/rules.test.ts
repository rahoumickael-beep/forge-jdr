import assert from "node:assert/strict";
import { test } from "node:test";
import { subclassLevel } from "./origins";
import { classesFor, CLASSES } from "./rules";

const fantasy = classesFor("fantasy");

test("sous-classes : deux par classe fantasy, avec un titre", () => {
  assert.equal(fantasy.length, 14);
  for (const c of fantasy) {
    assert.equal(c.subclasses.length, 2, `${c.name} : ${c.subclasses.length} sous-classes`);
    assert.ok(c.subclassTitle && c.subclassTitle !== "Sous-classe", `${c.name} : pas de titre de sous-classe`);
  }
});

test("sous-classes : ids uniques", () => {
  const ids = CLASSES.flatMap((c) => c.subclasses.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, "id de sous-classe en double");
});

test("sous-classes : premier pouvoir au niveau de choix, puis 3 ou 4 de plus", () => {
  for (const c of fantasy) {
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
  for (const c of fantasy) {
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
  for (const c of fantasy) {
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
