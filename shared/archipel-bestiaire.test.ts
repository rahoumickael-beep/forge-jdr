// Bestiaire de l'Archipel : mêmes exigences qu'Aubreterre (bestiary.test.ts), avec le canon et la charte SF.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ARCHIPEL } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleArchipel } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const SF = creaturesFor("science-fiction");
const FAMILLES: FamilleArchipel[] = ["Faune des mondes", "Équipages", "Machines", "Choses des Routes"];
const step = (cr: number) => CR_STEPS.indexOf(cr);

test("archipel : une vingtaine de créatures, ids uniques, FP de 0 à 20, chaque famille représentée", () => {
  assert.ok(SF.length >= 20 && SF.length <= 30, `${SF.length} créatures`);
  const ids = SF.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of SF) assert.ok(step(c.cr) >= 0 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.ok(SF.some((c) => c.cr <= 0.25) && SF.some((c) => c.cr >= 15), "du menu fretin au boss de fin");
  for (const f of FAMILLES) assert.ok(SF.filter((c) => c.family === f).length >= 3, `famille ${f}`);
  assert.ok(SF.filter((c) => c.legendary).length >= 2, "au moins deux légendaires");
});

test("archipel : fiches cohérentes (PX, bonus de maîtrise, FP estimé à deux crans près)", () => {
  for (const c of SF) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    const prof = proficiencyForCr(c.cr);
    assert.ok(prof >= 2, `${c.id} : maîtrise`);
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 2, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("archipel : créatures dans les régions du canon", () => {
  const regions = new Set([...ARCHIPEL.regions.map((r) => r.nom), ...ARCHIPEL.autresLieux]);
  for (const c of SF) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("archipel : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => ARCHIPEL.secrets.find((s) => t.includes(s));
  for (const c of SF) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    if (trahit(c.name)) assert.ok(c.publicName && !trahit(c.publicName), `${c.id} : nom public`);
  }
});

test("archipel : planches au style SF, lumière de la famille en tête, ni négation ni copie de licence", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["science-fiction"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of SF) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes(stylePeinture("science-fiction", "creature", "").replace(/^, /, "").slice(0, 40)), `${c.id} : style SF`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(scene), `${c.id} : ${scene.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, SF.length, "graines en double");
});

test("archipel : chaque créature a sa vignette et sa carte, sous un nom de fichier qui ne trahit aucun secret", async () => {
  const { existsSync, readdirSync, readFileSync } = await import("node:fs");
  const { fichierCreature, pionDeCreature } = await import("./bestiary");
  const script = readFileSync("scripts/vignettes-figurines.mjs", "utf8");
  const enAttente = new Set(["garde-hegemonique", "rakka-sel-noir"]); // repeintes (25/10/2026)
  for (const c of SF) {
    if (c.publicName) assert.ok(script.includes(`"${c.id}": "${fichierCreature(c)}"`), `alias de ${c.id} dans vignettes-figurines.mjs`);
    assert.equal(pionDeCreature(c.id), `/pions/${fichierCreature(c)}.webp`);
    if (!enAttente.has(c.id)) for (const d of ["pions", "cartes"]) assert.ok(existsSync(`client/public/${d}/${fichierCreature(c)}.webp`), `${d}/${fichierCreature(c)}.webp`);
  }
  const mots = ARCHIPEL.secrets.map((s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-"));
  for (const d of ["client/public/pions", "client/public/cartes"]) for (const f of readdirSync(d)) for (const m of mots) assert.ok(!f.includes(m), `${d}/${f} trahit « ${m} »`);
});
