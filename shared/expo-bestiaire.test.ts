// Bestiaire de l'Exposition éternelle : mêmes exigences que les Îles du Vent (iles-bestiaire.test.ts), avec le canon et la charte steampunk ;
// en plus, les chiffres de la table d'armes de 1899 (shared/expo-regles.ts) et les règles du monde sur les Villages, les ouvrières et les Réfractaires.
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPOSITION, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { averageDice, CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleExpo } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const EX = creaturesFor("steampunk");
const FAMILLES: FamilleExpo[] = ["Automates et machines de la foire", "Gens de la foire et de la pègre", "Gardes, Sûreté et Commissariat", "Figures et grandes machines"];
const step = (cr: number) => CR_STEPS.indexOf(cr);
const modOf = (v: number) => Math.floor((v - 10) / 2);
const actionsDe = (c: (typeof EX)[number]) => [...c.actions, ...(c.reactions ?? []), ...(c.bonusActions ?? []), ...(c.legendary?.actions ?? [])];

const BANNED = [
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric", "véritable", "au-delà", "tisser", "tisse",
];

test("exposition : une vingtaine de créatures, ids uniques, FP de 0 à 15, chaque famille représentée", () => {
  assert.ok(EX.length >= 22 && EX.length <= 26, `${EX.length} créatures`);
  const ids = EX.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of EX) assert.ok(step(c.cr) >= 0 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.equal(Math.min(...EX.map((c) => c.cr)), 0, "du menu fretin");
  assert.equal(Math.max(...EX.map((c) => c.cr)), 15, "jusqu'au grand appareil de fin");
  for (const f of FAMILLES) assert.ok(EX.filter((c) => c.family === f).length >= 5, `famille ${f}`);
  for (const c of EX) assert.ok(FAMILLES.includes(c.family as FamilleExpo), `${c.id} : famille ${c.family}`);
  assert.ok(EX.filter((c) => c.legendary).length >= 3, "au moins trois légendaires (la machine n° 7, l'Éternelle, le Grand Brevet)");
  for (const [lo, hi, min] of [[0, 1, 3], [2, 4, 3], [5, 10, 3], [11, 15, 3]]) {
    assert.ok(EX.filter((c) => c.cr >= lo && c.cr <= hi).length >= min, `pas assez de FP ${lo}-${hi}`);
  }
});

test("exposition : fiches cohérentes (PX, PV, bonus de maîtrise, bonus d'attaque, FP estimé à un cran près)", () => {
  for (const c of EX) {
    assert.equal(c.xp, xpForCr(c.cr), `${c.id} : PX`);
    assert.ok(c.hp > 0 && c.ac >= 8 && c.ac <= 22, `${c.id} : PV ou CA`);
    assert.equal(Math.floor(averageDice(c.hpDice)), c.hp, `${c.id} : PV ${c.hp} ≠ ${c.hpDice}`);
    const m = /^(\d+)d\d+([+-]\d+)?$/.exec(c.hpDice)!;
    assert.equal(Number(m[2] ?? 0), Number(m[1]) * modOf(c.stats[2]), `${c.id} : bonus d'Endurance aux PV`);
    assert.ok(c.speed.marche >= 0 && c.speed.marche % 1.5 === 0, `${c.id} : vitesse en cases de 1,5 m`);
    const prof = proficiencyForCr(c.cr);
    const mods = c.stats.map(modOf);
    for (const a of actionsDe(c)) {
      if (a.attack) {
        averageDice(a.attack.damage);
        assert.ok(mods.some((x) => prof + x === a.attack!.toHit), `${c.id} : bonus d'attaque de ${a.name} (${a.attack.toHit}) ≠ maîtrise ${prof} + un modificateur`);
      }
      if (a.save) assert.ok(mods.some((x) => 8 + prof + x === a.save!.dc), `${c.id} : DD de ${a.name} (${a.save.dc})`);
      for (const n of Object.keys(a.multiattack ?? {})) assert.ok(c.actions.some((b) => b.name === n), `${c.id} : attaque multiple vers « ${n} » introuvable`);
    }
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 1, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("exposition : les armes reprennent la table de 1899 (dés, portée, décharge, dynamite)", () => {
  const ARMES: Record<string, { de: string; portee: string }> = {
    "Revolver d'ordonnance": { de: "1d8", portee: "12/36 m" },
    "Pistolet à répétition": { de: "1d8", portee: "12/36 m" },
    "Fusil de chasse": { de: "2d6", portee: "9/27 m" },
    "Fusil Lebel": { de: "1d10", portee: "24/72 m" },
    "Canne-épée": { de: "1d6", portee: "1,5 m" },
    "Épée de salle d'armes": { de: "1d8", portee: "1,5 m" },
    "Sabre-baïonnette": { de: "1d8", portee: "1,5 m" },
    "Matraque à tension": { de: "1d6", portee: "1,5 m" },
    "Couteau": { de: "1d4", portee: "1,5 m" },
    "Clef anglaise": { de: "1d6", portee: "1,5 m" },
    "Canne plombée": { de: "1d6", portee: "1,5 m" },
  };
  const TIREURS = ["Revolver d'ordonnance", "Pistolet à répétition", "Fusil de chasse", "Fusil Lebel"];
  let vues = 0;
  for (const c of EX) {
    for (const a of actionsDe(c)) {
      const arme = ARMES[a.name];
      if (!arme || !a.attack) continue;
      vues++;
      assert.ok(a.attack.damage.startsWith(arme.de), `${c.id} : ${a.name} fait ${a.attack.damage}, la table dit ${arme.de}`);
      assert.equal(a.attack.reach, arme.portee, `${c.id} : portée de ${a.name}`);
      assert.equal(a.attack.kind, arme.portee === "1,5 m" ? "contact" : "distance", `${c.id} : ${a.name}`);
      assert.equal(a.attack.extra, undefined, `${c.id} : la décharge de la matraque vit dans le trait, pas dans chaque coup`);
      if (a.name === "Matraque à tension") assert.equal(a.attack.damageType, "contondants", `${c.id} : la matraque est contondante`);
    }
    // Un bâton de dynamite : 2d6, DD 12, trois bâtons au plus.
    for (const a of c.actions.filter((x) => x.name === "Bâton de dynamite")) {
      assert.equal(a.save?.dc, 12, `${c.id} : dynamite DD 12`);
      assert.equal(a.save?.damage, "2d6", `${c.id} : dynamite 2d6`);
      assert.match(a.text, /rayon 3 m/, `${c.id} : rayon de 3 m`);
      assert.match(a.text, /trois au plus/, `${c.id} : trois bâtons au plus`);
    }
    // Les armes à feu ont un chargeur, puis on recharge : le texte et un trait le rappellent.
    for (const a of c.actions.filter((x) => TIREURS.includes(x.name) && x.attack)) {
      assert.match(a.text, /recharger prend une action/, `${c.id} : ${a.name} doit dire qu'on recharge`);
      assert.ok(c.traits.some((t) => t.name === "Chargeur"), `${c.id} : trait « Chargeur »`);
    }
    // La matraque à tension : une décharge par tour, DD 12, quatre décharges, 1d6 quand elle est vide.
    if (c.actions.some((x) => x.name === "Matraque à tension")) {
      const d = c.traits.find((t) => t.name === "Décharge");
      assert.ok(d, `${c.id} : trait « Décharge »`);
      assert.match(d!.text, /Une fois par tour/, `${c.id} : une décharge par tour`);
      assert.match(d!.text, /\+1d6 dégâts de foudre/, `${c.id} : +1d6 foudre`);
      assert.match(d!.text, /Endurance DD 12/, `${c.id} : Endurance DD 12`);
      assert.match(d!.text, /quatre décharges/, `${c.id} : quatre décharges`);
      assert.match(d!.text, /1d6/, `${c.id} : vide, 1d6`);
      assert.equal(d!.dpr, 3.5, `${c.id} : la décharge compte 3,5 dégâts par round`);
    }
  }
  assert.ok(vues >= 20, `${vues} attaques à la table`);
});

test("exposition : créatures dans les régions du canon", () => {
  const regions = new Set([...EXPOSITION.regions.map((r) => r.nom), ...EXPOSITION.autresLieux]);
  for (const c of EX) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("exposition : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => EXPOSITION.secrets.find((s) => t.includes(s));
  for (const c of EX) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
    for (const t of c.traits) assert.equal(trahit(t.text), undefined, `${c.id} : secret dans le trait ${t.name}`);
    for (const a of actionsDe(c)) assert.equal(trahit(a.text), undefined, `${c.id} : secret dans l'action ${a.name}`);
    assert.equal(trahit(c.type), undefined, `${c.id} : secret dans le type`);
  }
  // Ce qui s'affiche avec le nom public (type, langues, prompt, identifiant) ne livre rien.
  for (const c of EX.filter((x) => x.publicName)) {
    for (const t of [c.type, c.languages, c.illustration, c.id]) assert.equal(trahit(t), undefined, `${c.id} : secret dans le type, les langues, le prompt ou l'identifiant`);
    assert.ok(!/veilleur|delestrade|dormeuse|fosse|pi[èe]ce m[èe]re/i.test(`${c.type} ${c.languages} ${c.illustration} ${c.id} ${c.lore}`), `${c.id} : un mot du secret dans ce que voit le joueur`);
  }
  // Les Veilleurs et leur chef ne se nomment que par leur manteau gris.
  for (const [id, vrai, publicName] of [["homme-au-manteau-gris", /Veilleur/, /manteau gris/], ["medecin-en-manteau-gris", /Delestrade/, /manteau gris/]] as const) {
    const c = EX.find((x) => x.id === id)!;
    assert.ok(c, id);
    assert.ok(c.publicName && publicName.test(c.publicName), `${id} : nom public`);
    assert.ok(vrai.test(c.name), `${id} : le vrai nom reste dans la fiche du MJ`);
  }
});

test("exposition : aucun anachronisme, aucune licence connue, aucune magie, aucune tournure interdite", () => {
  for (const c of EX) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...actionsDe(c).map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, EXPOSITION), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, EXPOSITION), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(textes), `${c.id} : nom de caractéristique de D&D`);
    assert.ok(!/\b(190[1-9]|19[1-9]\d|20\d\d)\b/.test(`${c.lore} ${c.gmNotes}`), `${c.id} : date après 1900`);
    assert.ok(!/\b(magie|magique|sorcel\w*|enchant\w*|surnaturel\w*|sortilège)\b/i.test(textes), `${c.id} : pas de magie`);
    const bas = textes.toLowerCase();
    for (const word of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`).test(bas), `${c.id} contient « ${word} »`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    assert.match(c.gmNotes, /Niveaux? \d+/, `${c.id} : les gmNotes disent à quels niveaux la placer`);
  }
});

test("exposition : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of EX) {
    const inconnus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, EXPOSITION, [c.name, c.publicName ?? "", ...EX.map((x) => x.name)]);
    assert.deepEqual(inconnus, [], `${c.id} : nom propre hors canon`);
  }
});

test("exposition : planches en affiche Art nouveau, lumière de la famille en tête, créature en pied, ni négation ni anachronisme", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["steampunk"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of EX) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes("Art Nouveau poster illustration"), `${c.id} : style steampunk`);
    assert.ok(/full body, centered, eye-level view/.test(c.illustration), `${c.id} : créature en pied, centrée, à hauteur d'yeux`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(c.illustration), `${c.id} : ${c.illustration.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, EX.length, "graines en double");
  for (const f of FAMILLES) assert.ok(LUMIERE_FAMILLE[f].length > 40, `lumière de ${f}`);
  assert.equal(new Set(FAMILLES.map((f) => LUMIERE_FAMILLE[f])).size, FAMILLES.length, "une lumière par famille");
});

test("exposition : la charte steampunk ouvre sur la lumière et en a une par défaut", () => {
  assert.ok(stylePeinture("steampunk", "creature", "").length > 0);
  assert.ok(stylePeinture("steampunk", "creature").startsWith("warm gaslight evening glow"), "lumière par défaut en tête");
  assert.match(stylePeinture("steampunk", "creature"), /full body, centered, eye-level view/);
});

test("exposition : les Villages et les ouvrières ne sont pas des monstres ; les Réfractaires et l'impresario ne sont pas des ennemis par défaut", () => {
  // Aucune fiche d'engagé, d'ouvrière ou de mécanicien de la Chambre : ce sont des personnages, pas des monstres.
  assert.ok(!EX.some((c) => /engag[ée]|ouvri[èe]re|annamite|kanak|kabyle|sénégalais|mécanicien|bobineu/i.test(`${c.name} ${c.type}`)));
  // Les Réfractaires : adversaires qu'on peut éviter ou retourner.
  const refractaires = EX.filter((c) => /Réfractaire/.test(c.type));
  assert.equal(refractaires.length, 2);
  for (const c of refractaires) {
    assert.match(c.gmNotes, /n'est pas un ennemi par défaut/, `${c.id} : les gmNotes disent que ce n'est pas un ennemi par défaut`);
    assert.match(c.gmNotes, /Éviter le combat/, `${c.id} : la sortie sans combat`);
    assert.match(c.gmNotes, /(Persuasion|Intimidation|Investigation|Tromperie)/, `${c.id} : un jet pour l'éviter`);
  }
  // L'impresario, les automates de ronde, les gardes et les Veilleurs : une sortie sans combat.
  for (const id of ["impresario-des-villages", "automate-de-ronde", "homme-au-manteau-gris", "medecin-en-manteau-gris", "capitaine-de-la-garde", "inspecteur-de-la-surete"]) {
    const c = EX.find((x) => x.id === id)!;
    assert.ok(c, id);
    assert.match(c.gmNotes, /Éviter le combat/, `${id} : la sortie sans combat`);
    assert.match(c.gmNotes, /(Persuasion|Intimidation|Force|Tromperie|Investigation)/, `${id} : un jet pour l'éviter`);
  }
  // Une personne n'a pas de prix : aucune fiche ne chiffre un engagé ou un enfant comme une marchandise.
  for (const c of EX) assert.ok(!/(engag[ée]s?|enfants?)[^.]{0,40}(piastres|à vendre|se partage|rapportent?)/i.test(`${c.lore} ${c.gmNotes}`), `${c.id} : une personne n'a pas de prix`);
  // Les grandes machines de fin de campagne sont des légendaires, pour les niveaux 11 et plus.
  for (const id of ["machine-n-7", "l-eternelle", "grand-brevet-du-siecle"]) {
    const c = EX.find((x) => x.id === id)!;
    assert.ok(c?.legendary, `${id} : légendaire`);
    assert.ok(c.cr >= 11, `${id} : FP 11 ou plus`);
  }
});
