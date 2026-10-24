// Bestiaire de la Côte des Noyés : mêmes exigences que la Résidence (residence-bestiaire.test.ts), avec le canon et la charte horreur ; vignettes et cartes après le choix du style.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COTE_DES_NOYES, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleNoyes } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const CN = creaturesFor("horreur");
const FAMILLES: FamilleNoyes[] = ["Bêtes de la côte", "Gens de 1923", "Ce que rend la mer", "La Fosse"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("côte des noyés : une vingtaine de créatures, ids uniques, FP de 1/8 à 20, chaque famille représentée", () => {
  assert.ok(CN.length >= 22 && CN.length <= 25, `${CN.length} créatures`);
  const ids = CN.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of CN) assert.ok(step(c.cr) >= 1 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(CN.some((c) => c.cr <= 0.25) && CN.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(CN.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(CN.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("côte des noyés : fiches cohérentes (PX, bonus de maîtrise, FP estimé à un cran près)", () => {
  for (const c of CN) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 1, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("côte des noyés : créatures dans les régions du canon", () => {
  const regions = new Set([...COTE_DES_NOYES.regions.map((r) => r.nom), ...COTE_DES_NOYES.autresLieux]);
  for (const c of CN) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("côte des noyés : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => COTE_DES_NOYES.secrets.find((s) => t.includes(s));
  for (const c of CN) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
  }
  assert.ok(CN.some((c) => c.id === "l-officier-du-matin" && c.publicName), "le dernier Revenu a un nom public");
});

test("côte des noyés : aucun anachronisme de 1923 ni licence connue dans les textes", () => {
  for (const c of CN) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...c.actions.map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, COTE_DES_NOYES), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, COTE_DES_NOYES), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(`${c.lore} ${c.gmNotes} ${textes}`), `${c.id} : nom de caractéristique de D&D`);
  }
});

test("côte des noyés : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of CN) {
    const connus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, COTE_DES_NOYES, [c.name, c.publicName ?? "", ...CN.map((x) => x.name)]);
    assert.deepEqual(connus, [], `${c.id} : nom propre hors canon`);
  }
});

test("côte des noyés : planches au style photographie argentique, lumière de la famille en tête, ni négation ni licence connue", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes.horreur, "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of CN) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("horreur", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style horreur`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(scene), `${c.id} : ${scene.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, CN.length, "graines en double");
});
