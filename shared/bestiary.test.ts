import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { FIN_DE_STYLE } from "./charte";
import { AUBRETERRE } from "./canon/fantasy";
import {
  averageDice,
  BESTIARY as TOUT_LE_BESTIAIRE,
  fichierCreature,
  pionDeCreature,
  CR_STEPS,
  creaturesFor,
  estimateCr,
  ILLUSTRATION_STYLE,
  LUMIERE_FAMILLE,
  illustrationSeed,
  modOf,
  proficiencyForCr,
  toEncounterEnemy,
  xpForCr,
} from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

/** Les tests de ce fichier portent sur Aubreterre ; l'Archipel a les siens (archipel-bestiaire.test.ts). */
const BESTIARY = TOUT_LE_BESTIAIRE.filter((c) => c.genre === "fantasy");
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("bestiaire : ids uniques et nombre de créatures", () => {
  const ids = BESTIARY.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  assert.ok(BESTIARY.length >= 45 && BESTIARY.length <= 60, `${BESTIARY.length} créatures`);
  assert.equal(creaturesFor("fantasy").length, BESTIARY.length);
  // Les Îles du Vent ont leur bestiaire (iles-bestiaire.ts) et leurs tests (iles-bestiaire.test.ts).
  assert.ok(creaturesFor("pirates").length >= 22);
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
    assert.ok(c.illustration.includes(ILLUSTRATION_STYLE), `${c.id} : style de la charte`);
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

test("bestiaire : aucune planche fantasy ne décrit d'objet moderne", () => {
  // Flux dessine ce qu'on nomme : ni objet moderne, ni négation, ni route ou poteau qui appellent des pylônes (comfyui/regles-flux.json).
  const moderne = new RegExp(REGLES_FLUX.anachronismes.fantasy, "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  for (const c of BESTIARY) {
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 40, `${c.id} : scène introuvable`);
    assert.ok(!moderne.test(scene), `${c.id} : objet moderne dans la scène`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation dans le prompt`);
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : la lumière de la famille doit ouvrir le prompt`);
  }
});

test("figurines et cartes : aucun nom de fichier public ne trahit un secret", () => {
  const script = readFileSync("scripts/vignettes-figurines.mjs", "utf8");
  for (const c of BESTIARY.filter((x) => x.publicName && x.genre === "fantasy")) {
    assert.ok(script.includes(`"${c.id}": "${fichierCreature(c)}"`), `alias de ${c.id} dans vignettes-figurines.mjs`);
    assert.equal(pionDeCreature(c.id), `/pions/${fichierCreature(c)}.webp`);
  }
  const mots = AUBRETERRE.secrets.map((s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "-"));
  for (const dossier of ["client/public/pions", "client/public/cartes"])
    for (const f of readdirSync(dossier)) for (const m of [...mots, "gorvan"]) assert.ok(!f.includes(m), `${dossier}/${f} trahit « ${m} »`);
});
