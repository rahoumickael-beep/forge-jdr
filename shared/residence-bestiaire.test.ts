// Bestiaire de la Résidence : mêmes exigences que la Ternelande (ternelande-bestiaire.test.ts), avec le canon et la charte cyberpunk ; vignettes et cartes après le choix du style.
import assert from "node:assert/strict";
import { test } from "node:test";
import { RESIDENCE } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleResidence } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const CP = creaturesFor("cyberpunk");
const FAMILLES: FamilleResidence[] = ["Bêtes de la ville", "Gens du Bail", "Drones et automates", "Cousus"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("résidence : une vingtaine de créatures, ids uniques, FP de 1/8 à 20, chaque famille représentée", () => {
  assert.ok(CP.length >= 22 && CP.length <= 25, `${CP.length} créatures`);
  const ids = CP.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of CP) assert.ok(step(c.cr) >= 1 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(CP.some((c) => c.cr <= 0.25) && CP.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(CP.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(CP.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("résidence : fiches cohérentes (PX, bonus de maîtrise, FP estimé à deux crans près)", () => {
  for (const c of CP) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 2, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("résidence : créatures dans les régions du canon", () => {
  const regions = new Set([...RESIDENCE.regions.map((r) => r.nom), ...RESIDENCE.autresLieux]);
  for (const c of CP) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("résidence : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => RESIDENCE.secrets.find((s) => t.includes(s));
  for (const c of CP) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName,`${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
  }
  assert.ok(CP.some((c) => c.id === "gerance" && c.publicName), "Gérance a un nom public");
});

test("résidence : planches au style cyberpunk, lumière de la famille en tête, ni négation ni licence connue", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes.cyberpunk, "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of CP) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("cyberpunk", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style cyberpunk`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(scene), `${c.id} : ${scene.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, CP.length, "graines en double");
});
