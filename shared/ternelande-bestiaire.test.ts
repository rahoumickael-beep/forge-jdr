// Bestiaire de la Ternelande : mêmes exigences que l'Archipel (archipel-bestiaire.test.ts), avec le canon et la charte dark fantasy ; vignettes et cartes après le choix du style.
import assert from "node:assert/strict";
import { test } from "node:test";
import { TERNELANDE } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleTernelande } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const DF = creaturesFor("dark-fantasy");
const FAMILLES: FamilleTernelande[] = ["Bêtes d'hiver", "Gens de la Dîme", "Choses de la terre", "Reflets"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("ternelande : une vingtaine de créatures, ids uniques, FP de 0 à 20, chaque famille représentée", () => {
  assert.ok(DF.length >= 20 && DF.length <= 30, `${DF.length} créatures`);
  const ids = DF.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of DF) assert.ok(step(c.cr) >= 0 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(DF.some((c) => c.cr <= 0.25) && DF.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(DF.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(DF.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("ternelande : fiches cohérentes (PX, bonus de maîtrise, FP estimé à deux crans près)", () => {
  for (const c of DF) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 2, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("ternelande : créatures dans les régions du canon", () => {
  const regions = new Set([...TERNELANDE.regions.map((r) => r.nom), ...TERNELANDE.autresLieux]);
  for (const c of DF) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("ternelande : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => TERNELANDE.secrets.find((s) => t.includes(s));
  for (const c of DF) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    if (trahit(c.name)) assert.ok(c.publicName && !trahit(c.publicName), `${c.id} : nom public`);
  }
});

test("ternelande : planches au style dark fantasy, lumière de la famille en tête, ni négation ni anachronisme", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["dark-fantasy"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of DF) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("dark-fantasy", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style DF`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(scene), `${c.id} : ${scene.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, DF.length, "graines en double");
});

