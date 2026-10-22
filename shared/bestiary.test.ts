import assert from "node:assert/strict";
import { test } from "node:test";
import {
  averageDice,
  BESTIARY,
  CR_STEPS,
  creaturesFor,
  estimateCr,
  ILLUSTRATION_STYLE,
  illustrationSeed,
  modOf,
  proficiencyForCr,
  toEncounterEnemy,
  xpForCr,
} from "./bestiary";

const step = (cr: number) => CR_STEPS.indexOf(cr);

test("bestiaire : ids uniques et nombre de créatures", () => {
  const ids = BESTIARY.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  assert.ok(BESTIARY.length >= 45 && BESTIARY.length <= 60, `${BESTIARY.length} créatures`);
  assert.equal(creaturesFor("fantasy").length, BESTIARY.length);
  assert.equal(creaturesFor("cyberpunk").length, 0);
});

test("bestiaire : FP de 0 à 20, un tiers de morts, des légendaires", () => {
  const crs = BESTIARY.map((c) => c.cr);
  assert.equal(Math.min(...crs), 0);
  assert.equal(Math.max(...crs), 20);
  for (const c of BESTIARY) assert.ok(step(c.cr) >= 0, `${c.id} : FP ${c.cr} inconnu`);
  // Chaque palier de niveaux a de quoi remplir des rencontres.
  for (const [lo, hi] of [[0, 1], [2, 4], [5, 10], [11, 16], [17, 20]]) {
    assert.ok(crs.filter((cr) => cr >= lo && cr <= hi).length >= 4, `pas assez de FP ${lo}-${hi}`);
  }
  const morts = BESTIARY.filter((c) => c.family === "Morts").length;
  assert.ok(morts >= BESTIARY.length / 4 && morts <= BESTIARY.length / 2, `${morts} morts`);
  const legendaires = BESTIARY.filter((c) => c.legendary);
  assert.ok(legendaires.length >= 3);
  assert.ok(legendaires.some((c) => /Gorvan/.test(c.name)));
  assert.ok(legendaires.some((c) => /Ostral/.test(c.name)));
});

test("bestiaire : fiches cohérentes (PV, PX, bonus)", () => {
  for (const c of BESTIARY) {
    assert.equal(c.stats.length, 6, c.id);
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.equal(Math.floor(averageDice(c.hpDice)), c.hp, `${c.id} : PV ${c.hp} ≠ ${c.hpDice}`);
    const m = /^(\d+)d\d+([+-]\d+)?$/.exec(c.hpDice)!;
    assert.equal(Number(m[2] ?? 0), Number(m[1]) * modOf(c.stats[2]), `${c.id} : bonus de Constitution aux PV`);
    assert.ok(c.ac >= 8 && c.ac <= 22, `${c.id} : CA ${c.ac}`);
    assert.ok(c.speed.marche >= 0 && c.speed.marche % 1.5 === 0, `${c.id} : vitesse en cases de 1,5 m`);
    assert.ok(c.actions.length > 0, `${c.id} : aucune action`);
    // Bonus au toucher et DD = maîtrise + modificateur d'une caractéristique.
    const prof = proficiencyForCr(c.cr);
    const mods = c.stats.map(modOf);
    for (const a of [...c.actions, ...(c.bonusActions ?? []), ...(c.reactions ?? []), ...(c.legendary?.actions ?? [])]) {
      if (a.attack) {
        assert.ok(mods.some((x) => x + prof === a.attack!.toHit), `${c.id} : ${a.name} +${a.attack.toHit}`);
        averageDice(a.attack.damage);
      }
      if (a.save) assert.ok(mods.some((x) => 8 + prof + x === a.save!.dc), `${c.id} : ${a.name} DD ${a.save.dc}`);
      for (const n of Object.keys(a.multiattack ?? {})) {
        assert.ok(c.actions.some((b) => b.name === n), `${c.id} : attaque multiple vers « ${n} » introuvable`);
      }
    }
  }
});

test("bestiaire : FP cohérent avec PV, CA, dégâts et bonus (méthode du Guide du maître, à deux crans près)", () => {
  for (const c of BESTIARY) {
    const e = estimateCr(c);
    const gap = Math.abs(step(e.estimate) - step(c.cr));
    assert.ok(gap <= 2, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

const FORBIDDEN = [
  // Créatures et noms protégés hors SRD 5.1
  "beholder", "tyrannoeil", "tyrannœil", "illithid", "flagelleur mental", "mind flayer", "githyanki", "githzerai",
  "displaceur", "displacer", "ours-hibou", "owlbear", "tiamat", "vecna", "bahamut", "lolth", "xanathar",
  "strahd", "mordenkainen", "elminster", "drizzt", "faerûn", "royaumes oubliés", "forgotten realms",
  "eauprofonde", "waterdeep", "baldur", "padhiver", "neverwinter", "ravenloft", "greyhawk", "kuo-toa",
  "yuan-ti", "umber hulk", "slaad", "dracoliche", "dracolich",
  // Noms et tournures bannis par la skill ecrire-scenario
  "elara", "lyra", "kael", "thorne", "eldoria", "aldric", "au cœur de", "voile de mystère", "tapisserie",
  "palpable", "une aura", "sombre secret", "véritable", "au-delà", "tisser", "tisse",
];

test("bestiaire : aucun nom protégé ni tournure interdite", () => {
  for (const c of BESTIARY) {
    const text = JSON.stringify(c).toLowerCase();
    for (const word of [...FORBIDDEN, "vex"]) {
      const re = new RegExp(`(^|[^a-zà-ÿ])${word.replace(/[-]/g, "\\-")}([^a-zà-ÿ]|$)`);
      assert.ok(!re.test(text), `${c.id} contient « ${word} »`);
    }
  }
});

test("bestiaire : chaque créature a un prompt d'illustration et des textes", () => {
  const seeds = new Set<number>();
  for (const c of BESTIARY) {
    assert.ok(c.illustration.startsWith(ILLUSTRATION_STYLE), `${c.id} : préfixe de style`);
    assert.ok(c.illustration.length > ILLUSTRATION_STYLE.length + 80, `${c.id} : prompt trop court`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, BESTIARY.length, "graines d'illustration en double");
});

test("bestiaire : conversion en ennemi de rencontre", () => {
  const leve = BESTIARY.find((c) => c.id === "leve")!;
  const e = toEncounterEnemy(leve, 6);
  assert.deepEqual(
    { name: e.name, count: e.count, hp: e.hp, ac: e.ac, danger: e.danger },
    { name: "Levé", count: 6, hp: 22, ac: 8, danger: "Faible" },
  );
  assert.match(e.attack, /Coup \(\+3, 1d6\+1 contondants\)/);
  const aigle = toEncounterEnemy(BESTIARY.find((c) => c.id === "porte-aigle")!, 1, 3);
  assert.equal(aigle.danger, "Élevé");
  assert.match(aigle.attack, /3 × Épée longue/);
});
