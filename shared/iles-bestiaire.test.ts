// Bestiaire des Îles du Vent : mêmes exigences que le Champ-d'Asile (asile-bestiaire.test.ts), avec le canon et la charte pirates ;
// en plus, les chiffres de la table d'armes de 1715 (shared/iles-regles.ts) et les règles du monde sur les marrons et les captifs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ILES_DU_VENT, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { averageDice, CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleIles } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const IV = creaturesFor("pirates");
const FAMILLES: FamilleIles[] = ["Bêtes de mer et de côte", "Gens de mer", "Soldats et chasseurs", "Figures et navires"];
const step = (cr: number) => CR_STEPS.indexOf(cr);
const modOf = (v: number) => Math.floor((v - 10) / 2);
const actionsDe = (c: (typeof IV)[number]) => [...c.actions, ...(c.reactions ?? []), ...(c.bonusActions ?? []), ...(c.legendary?.actions ?? [])];

const BANNED = [
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric", "véritable", "au-delà", "tisser", "tisse",
];

test("îles du vent : une vingtaine de créatures, ids uniques, FP de 0 à 15, chaque famille représentée", () => {
  assert.ok(IV.length >= 22 && IV.length <= 26, `${IV.length} créatures`);
  const ids = IV.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of IV) assert.ok(step(c.cr) >= 0 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.equal(Math.min(...IV.map((c) => c.cr)), 0, "du menu fretin");
  assert.equal(Math.max(...IV.map((c) => c.cr)), 15, "jusqu'au boss de fin");
  for (const f of FAMILLES) assert.ok(IV.filter((c) => c.family === f).length >= 5, `famille ${f}`);
  for (const c of IV) assert.ok(FAMILLES.includes(c.family as FamilleIles), `${c.id} : famille ${c.family}`);
  assert.ok(IV.filter((c) => c.legendary).length >= 3, "au moins trois légendaires (Bras-de-Fer, le capitaine et le navire blancs)");
  // Chaque palier de niveaux a de quoi remplir des rencontres (les deux navires de fin de campagne tiennent le palier 11-15).
  for (const [lo, hi, min] of [[0, 1, 3], [2, 4, 3], [5, 10, 3], [11, 15, 2]]) {
    assert.ok(IV.filter((c) => c.cr >= lo && c.cr <= hi).length >= min, `pas assez de FP ${lo}-${hi}`);
  }
});

test("îles du vent : fiches cohérentes (PX, PV, bonus de maîtrise, bonus d'attaque, FP estimé à un cran près)", () => {
  for (const c of IV) {
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
        assert.ok(mods.some((m) => prof + m === a.attack!.toHit), `${c.id} : bonus d'attaque de ${a.name} (${a.attack.toHit}) ≠ maîtrise ${prof} + un modificateur`);
      }
      if (a.save) assert.ok(mods.some((m) => 8 + prof + m === a.save!.dc), `${c.id} : DD de ${a.name} (${a.save.dc})`);
      for (const n of Object.keys(a.multiattack ?? {})) assert.ok(c.actions.some((b) => b.name === n), `${c.id} : attaque multiple vers « ${n} » introuvable`);
    }
    const e = estimateCr(c);
    assert.ok(Math.abs(step(e.estimate) - step(c.cr)) <= 1, `${c.id} : FP ${c.cr}, estimé ${e.estimate} (défense ${e.defensive}, attaque ${e.offensive}, ${e.dpr} dégâts/round)`);
  }
});

test("îles du vent : les armes reprennent la table de 1715 (dés, portée)", () => {
  const ARMES: Record<string, { de: string; portee: string }> = {
    "Pistolet à silex": { de: "1d10", portee: "9/27 m" },
    "Mousquet": { de: "1d12", portee: "12/36 m" },
    "Fusil boucanier": { de: "1d12", portee: "18/54 m" },
    "Tromblon": { de: "2d6", portee: "6/18 m" },
    "Sabre d'abordage": { de: "1d8", portee: "1,5 m" },
    "Sabre": { de: "1d8", portee: "1,5 m" },
    "Coutelas": { de: "1d6", portee: "1,5 m" },
    "Hache d'abordage": { de: "1d8", portee: "1,5 m" },
    "Poignard": { de: "1d4", portee: "1,5 m" },
  };
  let vues = 0;
  for (const c of IV) {
    for (const a of actionsDe(c)) {
      const arme = ARMES[a.name];
      if (!arme || !a.attack) continue;
      vues++;
      assert.ok(a.attack.damage.startsWith(arme.de), `${c.id} : ${a.name} fait ${a.attack.damage}, la table dit ${arme.de}`);
      assert.equal(a.attack.reach, arme.portee, `${c.id} : portée de ${a.name}`);
      assert.equal(a.attack.kind, arme.portee === "1,5 m" ? "contact" : "distance", `${c.id} : ${a.name}`);
    }
    for (const a of c.actions.filter((x) => x.name === "Grenade de fer")) {
      assert.equal(a.save?.dc, 12, `${c.id} : grenade de fer DD 12`);
      assert.equal(a.save?.damage, "2d6", `${c.id} : grenade de fer 2d6`);
    }
    // Les armes à feu tirent un seul coup : le texte le rappelle.
    for (const a of c.actions.filter((x) => ["Pistolet à silex", "Mousquet", "Fusil boucanier"].includes(x.name) && x.attack)) {
      assert.match(a.text, /recharger prend une action/, `${c.id} : ${a.name} doit dire qu'on recharge`);
    }
  }
  assert.ok(vues >= 20, `${vues} attaques à la table`);
});

test("îles du vent : armes à un coup, jamais de mousquet ni de fusil boucanier dans une attaque multiple", () => {
  for (const c of IV) {
    for (const a of c.actions.filter((x) => x.multiattack)) {
      for (const n of Object.keys(a.multiattack!)) assert.ok(!/^(Mousquet|Fusil boucanier)$/.test(n), `${c.id} : ${n} dans une attaque multiple`);
    }
    if (/^navire|^tempête/.test(c.type)) continue;
    if (actionsDe(c).some((a) => a.attack && ["Pistolet à silex", "Mousquet", "Fusil boucanier"].includes(a.name))) {
      assert.ok(c.traits.some((t) => ["Armes chargées", "Quatre pistolets", "Deux pistolets"].includes(t.name)), `${c.id} : trait sur les armes chargées`);
    }
  }
});

test("îles du vent : créatures dans les régions du canon", () => {
  const regions = new Set([...ILES_DU_VENT.regions.map((r) => r.nom), ...ILES_DU_VENT.autresLieux]);
  for (const c of IV) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("îles du vent : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => ILES_DU_VENT.secrets.find((s) => t.includes(s));
  for (const c of IV) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.ok(!trahit(c.name) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
    for (const t of c.traits) assert.equal(trahit(t.text), undefined, `${c.id} : secret dans le trait ${t.name}`);
    for (const a of actionsDe(c)) assert.equal(trahit(a.text), undefined, `${c.id} : secret dans l'action ${a.name}`);
  }
  // Ce qui s'affiche avec le nom public (type, langues, prompt) ne livre ni secret ni nationalité.
  for (const c of IV.filter((x) => x.publicName)) {
    for (const t of [c.type, c.languages, c.illustration]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret dans le type, les langues ou le prompt`);
      assert.ok(!/espagn|spanish|spain|castill|havan/i.test(t), `${c.id} : nationalité dans « ${t.slice(0, 40)} »`);
    }
  }
  // Le Navire blanc et son capitaine ne se nomment que par leur rumeur.
  for (const id of ["navire-blanc", "capitaine-du-navire-blanc"]) {
    const c = IV.find((x) => x.id === id)!;
    assert.ok(c, id);
    assert.ok(c.publicName && /Navire blanc/.test(c.publicName), `${id} : nom public`);
    assert.ok(/Santa Clara|Larrañaga/.test(`${c.name}`), `${id} : le vrai nom reste dans la fiche du MJ`);
    assert.ok(c.legendary, `${id} : légendaire`);
  }
});

test("îles du vent : aucun anachronisme, aucune licence connue, aucun surnaturel, aucune tournure interdite", () => {
  for (const c of IV) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...actionsDe(c).map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, ILES_DU_VENT), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, ILES_DU_VENT), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(textes), `${c.id} : nom de caractéristique de D&D`);
    assert.ok(!/\b(171[7-9]|17[2-9]\d|18\d\d|19\d\d)\b/.test(`${c.lore} ${c.gmNotes}`), `${c.id} : date après 1716`);
    assert.ok(!/\b(magie|magique|sorcel\w*|enchant\w*|surnaturel\w*|sortilège)\b/i.test(`${c.lore} ${c.gmNotes} ${textes}`), `${c.id} : pas de surnaturel`);
    const bas = textes.toLowerCase();
    for (const word of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`).test(bas), `${c.id} contient « ${word} »`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    assert.match(c.gmNotes, /Niveaux? \d+/, `${c.id} : les gmNotes disent à quels niveaux la placer`);
  }
});

test("îles du vent : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of IV) {
    const inconnus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, ILES_DU_VENT, [c.name, c.publicName ?? "", ...IV.map((x) => x.name)]);
    assert.deepEqual(inconnus, [], `${c.id} : nom propre hors canon`);
  }
});

test("îles du vent : planches à la marine à l'huile, lumière de la famille en tête, créature en pied, ni négation ni licence connue", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["pirates"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of IV) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes("18th century maritime oil painting"), `${c.id} : style pirates`);
    assert.ok(/full body, centered, eye-level view/.test(c.illustration), `${c.id} : créature en pied, centrée, à hauteur d'yeux`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(c.illustration), `${c.id} : ${c.illustration.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, IV.length, "graines en double");
  for (const f of FAMILLES) assert.ok(LUMIERE_FAMILLE[f].length > 40, `lumière de ${f}`);
  assert.equal(new Set(FAMILLES.map((f) => LUMIERE_FAMILLE[f])).size, FAMILLES.length, "une lumière par famille");
});

test("îles du vent : la charte pirates ouvre sur la lumière et en a une par défaut", () => {
  assert.ok(stylePeinture("pirates", "creature", "").length > 0);
  assert.ok(stylePeinture("pirates", "creature").startsWith("stormy sea light"), "lumière par défaut en tête");
});

test("îles du vent : règles de Forge pour les marrons et les captifs", () => {
  // Une seule fiche de marron : la sentinelle, qu'on peut aborder et qui n'est jamais un ennemi par défaut.
  const marrons = IV.filter((c) => /marron/i.test(c.type));
  assert.ok(marrons.length >= 1);
  for (const c of marrons) {
    assert.equal(c.family, "Soldats et chasseurs", `${c.id}`);
    assert.match(c.gmNotes, /n'est pas un ennemi/, `${c.id} : les gmNotes disent que ce n'est pas un ennemi`);
    assert.match(c.gmNotes, /Persuasion/, `${c.id} : on peut lui parler`);
  }
  // Les chasseurs de marrons sont des adversaires, et chaque fiche dit comment éviter le combat.
  const chasseurs = IV.filter((c) => /chasseur de marrons|chef de chasse/i.test(c.name));
  assert.equal(chasseurs.length, 2);
  for (const c of chasseurs) {
    assert.match(c.gmNotes, /Éviter le combat/, `${c.id} : la sortie sans combat`);
    assert.match(c.gmNotes, /(Persuasion|Intimidation|Survie)/, `${c.id} : un jet pour l'éviter`);
    assert.match(c.gmNotes, /(pas un butin|jamais un butin|ne se chiffre pas)/, `${c.id} : une personne n'est pas un butin`);
  }
  // Aucun captif, plongeur ou évadé n'est chiffré comme une prise : pas de prix, pas de part, pas de butin.
  for (const c of IV) {
    const t = `${c.lore} ${c.gmNotes}`;
    assert.ok(!/(captifs?|esclaves?|plongeurs?|évad[ée]e?s?)[^.]{0,40}(piastres|à vendre|se partage|rapportent?)/i.test(t), `${c.id} : un captif n'a pas de prix`);
  }
  // Pas de fiche de captif, d'esclave ni de plongeur : ce ne sont pas des monstres.
  assert.ok(!IV.some((c) => /captif|esclave|plongeur/i.test(`${c.name} ${c.type}`)));
});
