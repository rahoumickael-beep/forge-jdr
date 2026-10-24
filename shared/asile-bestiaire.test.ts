// Bestiaire du Champ-d'Asile : mêmes exigences que le Grand Sec (sec-bestiaire.test.ts), avec le canon et la charte western ; vignettes et cartes après le choix du style.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAMP_D_ASILE, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleAsile } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const CA = creaturesFor("western");
const FAMILLES: FamilleAsile[] = ["Bêtes de la prairie", "Gens de la loi", "Hors-la-loi", "Gens du rail"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("champ-d'asile : une vingtaine de créatures, ids uniques, FP de 1/8 à 17, chaque famille représentée", () => {
  assert.ok(CA.length >= 22 && CA.length <= 25, `${CA.length} créatures`);
  const ids = CA.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of CA) assert.ok(step(c.cr) >= 1 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(CA.some((c) => c.cr <= 0.25) && CA.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(CA.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(CA.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("champ-d'asile : fiches cohérentes (PX, bonus de maîtrise, bonus d'attaque, FP estimé à un cran près)", () => {
  for (const c of CA) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const mods = c.stats.map((v) => Math.floor((v - 10) / 2));
    for (const a of [...c.actions, ...(c.reactions ?? []), ...(c.bonusActions ?? []), ...(c.legendary?.actions ?? [])])
      if (a.attack) assert.ok(mods.some((m) => prof + m === a.attack!.toHit), `${c.id} : bonus d'attaque de ${a.name} (${a.attack.toHit}) ≠ maîtrise ${prof} + un modificateur`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 1, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("champ-d'asile : créatures dans les régions du canon", () => {
  const regions = new Set([...CHAMP_D_ASILE.regions.map((r) => r.nom), ...CHAMP_D_ASILE.autresLieux]);
  for (const c of CA) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("champ-d'asile : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => CHAMP_D_ASILE.secrets.find((s) => t.includes(s));
  for (const c of CA) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
    for (const t of c.traits) assert.equal(trahit(t.text), undefined, `${c.id} : secret dans le trait ${t.name}`);
    for (const a of c.actions) assert.equal(trahit(a.text), undefined, `${c.id} : secret dans l'action ${a.name}`);
  }
});

test("champ-d'asile : aucun anachronisme ni licence connue dans les textes, ni magie", () => {
  for (const c of CA) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...c.actions.map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, CHAMP_D_ASILE), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, CHAMP_D_ASILE), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(textes), `${c.id} : nom de caractéristique de D&D`);
    assert.ok(!/\b(18(79|8\d)|19\d\d)\b/.test(`${c.lore} ${c.gmNotes}`), `${c.id} : date après 1878`);
  }
});

test("champ-d'asile : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of CA) {
    const connus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, CHAMP_D_ASILE, [c.name, c.publicName ?? "", ...CA.map((x) => x.name)]);
    assert.deepEqual(connus, [], `${c.id} : nom propre hors canon`);
  }
});

test("champ-d'asile : planches à la peinture de l'Ouest, lumière de la famille en tête, ni négation ni licence connue", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["western"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of CA) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("western", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style western`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(c.illustration), `${c.id} : ${c.illustration.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, CA.length, "graines en double");
});

test("champ-d'asile : la charte western ouvre sur la lumière et en a une par défaut", () => {
  assert.ok(stylePeinture("western", "creature", "").length > 0);
  assert.ok(stylePeinture("western", "creature").startsWith("golden late afternoon sun"), "lumière par défaut en tête");
});

test("champ-d'asile : les Numunuu ne sont pas des monstres, un gardien du Traité dans les gens de la loi qu'on peut aborder", () => {
  const numunuu = CA.filter((c) => /numunuu|comanche/i.test(`${c.type} ${c.name} ${c.languages}`));
  assert.ok(numunuu.length >= 1);
  for (const c of numunuu) {
    assert.equal(c.family, "Gens de la loi", `${c.id} : un Numunuu est de la famille des gens de la loi`);
    assert.ok(/parler|Persuasion|ce n'est pas un ennemi/i.test(c.gmNotes), `${c.id} : les gmNotes disent qu'on peut parler`);
  }
  for (const c of CA) assert.ok(!/magi|sorcel|enchant/i.test(`${c.lore} ${c.gmNotes}`), `${c.id} : pas de magie`);
});
