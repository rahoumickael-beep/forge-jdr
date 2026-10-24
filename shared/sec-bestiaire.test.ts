// Bestiaire du Grand Sec : mêmes exigences que la Côte des Noyés (noyes-bestiaire.test.ts), avec le canon et la charte post-apo ; vignettes et cartes après le choix du style.
import assert from "node:assert/strict";
import { test } from "node:test";
import { GRAND_SEC, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleSec } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const GS = creaturesFor("post-apo");
const FAMILLES: FamilleSec[] = ["Bêtes du Sec", "Gens de la Route", "Gens des citadelles", "Machines d'avant"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("grand sec : une vingtaine de créatures, ids uniques, FP de 1/8 à 20, chaque famille représentée", () => {
  assert.ok(GS.length >= 22 && GS.length <= 25, `${GS.length} créatures`);
  const ids = GS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of GS) assert.ok(step(c.cr) >= 1 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(GS.some((c) => c.cr <= 0.25) && GS.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(GS.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(GS.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("grand sec : fiches cohérentes (PX, bonus de maîtrise, bonus d'attaque, FP estimé à un cran près)", () => {
  for (const c of GS) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const mods = c.stats.map((v) => Math.floor((v - 10) / 2));
    for (const a of [...c.actions, ...(c.reactions ?? []), ...(c.bonusActions ?? [])])
      if (a.attack) assert.ok(mods.some((m) => prof + m === a.attack!.toHit), `${c.id} : bonus d'attaque de ${a.name} (${a.attack.toHit}) ≠ maîtrise ${prof} + un modificateur`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 1, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("grand sec : créatures dans les régions du canon", () => {
  const regions = new Set([...GRAND_SEC.regions.map((r) => r.nom), ...GRAND_SEC.autresLieux]);
  for (const c of GS) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("grand sec : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => GRAND_SEC.secrets.find((s) => t.includes(s));
  for (const c of GS) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
  }
  const mat = GS.find((c) => c.id === "mat-qui-se-defend");
  assert.ok(mat && /Mât/.test(mat.name) && !GRAND_SEC.secrets.some((s) => mat.name.includes(s)), "le Mât de fin de campagne a un nom neutre");
});

test("grand sec : aucun anachronisme ni licence connue dans les textes, ni magie, mutant ou radiation", () => {
  for (const c of GS) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...c.actions.map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, GRAND_SEC), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, GRAND_SEC), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(`${c.lore} ${c.gmNotes} ${textes}`), `${c.id} : nom de caractéristique de D&D`);
  }
});

test("grand sec : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of GS) {
    const connus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, GRAND_SEC, [c.name, c.publicName ?? "", ...GS.map((x) => x.name)]);
    assert.deepEqual(connus, [], `${c.id} : nom propre hors canon`);
  }
});

test("grand sec : planches au style affiche passée au soleil, lumière de la famille en tête, ni négation ni licence connue", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["post-apo"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of GS) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("post-apo", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style post-apo`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(scene), `${c.id} : ${scene.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, GS.length, "graines en double");
});

test("grand sec : un seul engin volant d'avant, et rare", () => {
  const volants = GS.filter((c) => c.family === "Machines d'avant" && (c.speed.vol ?? 0) > 0);
  assert.equal(volants.length, 1, "un seul engin volant d'avant le Sec");
});
