// Bestiaire de la Cellule Hermès : mêmes exigences que l'Exposition éternelle (expo-bestiaire.test.ts), avec le canon et la charte contemporain ;
// en plus, les chiffres de la table d'armes (shared/hermes-regles.ts) et les règles du monde : la violence a des suites, les policiers ne sont pas des monstres.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CELLULE_HERMES, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { FIN_DE_STYLE, stylePeinture } from "./charte";
import { averageDice, CR_STEPS, creaturesFor, estimateCr, illustrationSeed, LUMIERE_FAMILLE, proficiencyForCr, xpForCr } from "./bestiary";
import type { FamilleHermes } from "./bestiary";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const HE = creaturesFor("contemporain");
const FAMILLES: FamilleHermes[] = ["La rue et les témoins", "Forces de l'ordre", "Les privés", "Figures et scènes"];
const step = (cr: number) => CR_STEPS.indexOf(cr);
const modOf = (v: number) => Math.floor((v - 10) / 2);
const actionsDe = (c: (typeof HE)[number]) => [...c.actions, ...(c.reactions ?? []), ...(c.bonusActions ?? []), ...(c.legendary?.actions ?? [])];

const BANNED = [
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric", "véritable", "au-delà", "tisser", "tisse",
];

test("hermès : une vingtaine de créatures, ids uniques, FP de 0 à 15, chaque famille représentée", () => {
  assert.ok(HE.length >= 22 && HE.length <= 26, `${HE.length} créatures`);
  const ids = HE.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "id en double");
  for (const c of HE) assert.ok(step(c.cr) >= 0 && c.cr <= 20, `${c.id} : FP ${c.cr}`);
  assert.equal(Math.min(...HE.map((c) => c.cr)), 0, "du menu fretin");
  assert.equal(Math.max(...HE.map((c) => c.cr)), 15, "jusqu'au site verrouillé de fin");
  for (const f of FAMILLES) assert.ok(HE.filter((c) => c.family === f).length >= 5, `famille ${f}`);
  for (const c of HE) assert.ok(FAMILLES.includes(c.family as FamilleHermes), `${c.id} : famille ${c.family}`);
  assert.ok(HE.filter((c) => c.legendary).length >= 3, "au moins trois légendaires (Tournemine et son escorte, le coup de filet, la caserne verrouillée)");
  for (const [lo, hi, min] of [[0, 1, 3], [2, 4, 3], [5, 10, 3], [11, 15, 3]]) {
    assert.ok(HE.filter((c) => c.cr >= lo && c.cr <= hi).length >= min, `pas assez de FP ${lo}-${hi}`);
  }
});

test("hermès : fiches cohérentes (PX, PV, bonus de maîtrise, bonus d'attaque, FP estimé à un cran près)", () => {
  for (const c of HE) {
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

test("hermès : les armes reprennent la table du monde (dés, portée, chargeur) et la règle des armes à feu", () => {
  const ARMES: Record<string, { de: string; portee: string }> = {
    "Couteau de poche": { de: "1d4", portee: "1,5 m" },
    "Matraque télescopique": { de: "1d4", portee: "1,5 m" },
    "Manche de pioche ou barre de chantier": { de: "1d6", portee: "1,5 m" },
    "Pistolet à impulsion électrique": { de: "0", portee: "3/9 m" },
    "Pistolet semi-automatique de 9 mm": { de: "1d10", portee: "15/45 m" },
    "Fusil de chasse": { de: "2d6", portee: "9/27 m" },
  };
  let vues = 0;
  for (const c of HE) {
    for (const a of actionsDe(c)) {
      const arme = ARMES[a.name];
      if (!arme || !a.attack) continue;
      vues++;
      assert.ok(a.attack.damage.startsWith(arme.de), `${c.id} : ${a.name} fait ${a.attack.damage}, la table dit ${arme.de}`);
      assert.equal(a.attack.reach, arme.portee, `${c.id} : portée de ${a.name}`);
      assert.equal(a.attack.kind, arme.portee === "1,5 m" ? "contact" : "distance", `${c.id} : ${a.name}`);
      assert.equal(a.attack.extra, undefined, `${c.id} : pas de dégâts supplémentaires dans ${a.name}`);
    }
    // Un pistolet a un chargeur de quinze, change en action bonus, et la règle des armes à feu est rappelée.
    for (const a of c.actions.filter((x) => x.name === "Pistolet semi-automatique de 9 mm" && x.attack)) {
      assert.match(a.text, /changer de chargeur prend une action bonus/, `${c.id} : ${a.name} doit dire qu'on change de chargeur`);
      assert.match(a.text, /mourante et meurt à la fin de son troisième tour sans soins/, `${c.id} : règle des armes à feu`);
      assert.ok(c.traits.some((t) => t.name === "Chargeur" && /quinze cartouches/.test(t.text)), `${c.id} : trait « Chargeur »`);
    }
    // Le pistolet à impulsion : attaque à distance, puis sauvegarde d'Endurance DD 13.
    for (const a of c.actions.filter((x) => x.name === "Pistolet à impulsion électrique")) {
      assert.match(a.text, /Endurance DD 13/, `${c.id} : sauvegarde d'Endurance DD 13`);
      assert.match(a.text, /incapable d'agir et sa vitesse tombe à 0/, `${c.id} : effet de l'impulsion`);
      assert.match(a.text, /désavantage à ses attaques/, `${c.id} : effet en cas de réussite`);
    }
  }
  assert.ok(vues >= 30,`${vues} attaques à la table`);
  // Pas de marque d'arme dans le monde, ni dans le texte ni dans les noms.
  const tout = JSON.stringify(HE);
  for (const marque of ["Glock", "Beretta", "Taser", "Kalachnikov", "Smith"]) assert.ok(!tout.includes(marque), marque);
});

test("hermès : créatures dans les régions du canon", () => {
  const regions = new Set([...CELLULE_HERMES.regions.map((r) => r.nom), ...CELLULE_HERMES.autresLieux]);
  for (const c of HE) assert.ok(regions.has(c.region), `${c.id} : région ${c.region}`);
});

test("hermès : aucun secret dans ce que lisent les joueurs, un nom public si le vrai nom trahit", () => {
  const trahit = (t: string) => CELLULE_HERMES.secrets.find((s) => t.includes(s));
  const MOTS_SECRETS = ["Vareilles", "Dunoyer", "Chassagne", "Dissolution", "Collection", "Rachat", "Coffre", "Écoute", "Orlhac", "Zumbrunn", "Kerdilès", "Deluchat", "conservation", "dissous", "dissoute", "Cabinet"];
  const mot = (t: string) => MOTS_SECRETS.find((m) => t.includes(m));
  for (const c of HE) {
    assert.equal(trahit(c.lore), undefined, `${c.id} : secret dans le texte des joueurs`);
    assert.equal(mot(c.lore), undefined, `${c.id} : mot du secret dans le texte des joueurs`);
    assert.ok(!(trahit(c.name) || mot(c.name)) || c.publicName, `${c.id} : le nom trahit un secret, il faut un nom public`);
    if (c.publicName) {
      assert.equal(trahit(c.publicName), undefined, `${c.id} : le nom public trahit un secret`);
      assert.equal(mot(c.publicName), undefined, `${c.id} : le nom public contient un mot du secret`);
    }
    assert.equal(trahit(c.illustration), undefined, `${c.id} : secret dans le prompt d'image`);
    assert.equal(trahit(c.id), undefined, `${c.id} : secret dans l'identifiant`);
    for (const t of c.traits) {
      assert.equal(trahit(t.text), undefined, `${c.id} : secret dans le trait ${t.name}`);
      assert.equal(mot(t.text), undefined, `${c.id} : mot du secret dans le trait ${t.name}`);
    }
    for (const a of actionsDe(c)) {
      assert.equal(trahit(a.text), undefined, `${c.id} : secret dans l'action ${a.name}`);
      assert.equal(mot(a.text), undefined, `${c.id} : mot du secret dans l'action ${a.name}`);
    }
    assert.equal(trahit(c.type), undefined, `${c.id} : secret dans le type`);
  }
  // Ce qui s'affiche avec le nom public ne livre rien.
  for (const c of HE.filter((x) => x.publicName)) {
    for (const t of [c.type, c.languages, c.illustration, c.id, c.lore]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret dans ce que voit le joueur`);
      assert.ok(!/cabinet|orlhac|coffre|collection|rachat|dissolution|vareilles|chassagne|zumbrunn/i.test(t), `${c.id} : un mot du secret dans ce que voit le joueur`);
    }
  }
  // L'exécutant et le site verrouillé ne se nomment que par leur nom public.
  for (const [id, vrai, publicName] of [["intendant-de-la-caserne", /Orlhac/, /intendant/], ["caserne-en-alerte", /Coffre/, /caserne en alerte/]] as const) {
    const c = HE.find((x) => x.id === id)!;
    assert.ok(c, id);
    assert.ok(c.publicName && publicName.test(c.publicName), `${id} : nom public`);
    assert.ok(vrai.test(c.name), `${id} : le vrai nom reste dans la fiche du MJ`);
  }
});

test("hermès : aucune licence connue, aucun surnaturel, aucune date impossible, aucune tournure interdite", () => {
  for (const c of HE) {
    const textes = [c.name, c.publicName ?? "", c.lore, c.gmNotes, ...c.traits.map((t) => t.text), ...actionsDe(c).map((a) => a.text)].join(" \n ");
    assert.deepEqual(anachronismesDans(textes, CELLULE_HERMES), [], `${c.id} : anachronisme`);
    assert.deepEqual(datesImpossibles(textes, CELLULE_HERMES), [], `${c.id} : date impossible`);
    assert.ok(!/\b(Dextérité|Sagesse|Constitution|Intelligence|Charisme)\b/.test(textes), `${c.id} : nom de caractéristique de D&D`);
    assert.ok(!/\b(202[7-9]|20[3-9]\d)\b/.test(`${c.lore} ${c.gmNotes}`), `${c.id} : date après 2026`);
    assert.ok(!/\b(magie|magique|sorcel\w*|enchant\w*|surnaturel\w*|sortilège)\b/i.test(textes), `${c.id} : rien de surnaturel`);
    const bas = textes.toLowerCase();
    for (const word of BANNED) assert.ok(!new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`).test(bas), `${c.id} contient « ${word} »`);
    assert.ok(c.lore.length > 60 && c.gmNotes.length > 60, `${c.id} : textes`);
    assert.match(c.gmNotes, /Niveaux? \d+/, `${c.id} : les gmNotes disent à quels niveaux la placer`);
  }
});

test("hermès : les noms propres des textes des joueurs sont dans le canon", () => {
  for (const c of HE) {
    const inconnus = nomsInconnus(`${c.name}. ${c.publicName ?? ""}. ${c.lore}`, CELLULE_HERMES, [c.name, c.publicName ?? "", ...HE.map((x) => x.name)]);
    assert.deepEqual(inconnus, [], `${c.id} : nom propre hors canon`);
  }
});

test("hermès : photos de dossier, lumière de la famille en tête, créature en pied, ni négation ni marque", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["contemporain"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const seeds = new Set<number>();
  for (const c of HE) {
    assert.ok(c.illustration.startsWith(LUMIERE_FAMILLE[c.family]), `${c.id} : lumière de la famille`);
    assert.ok(c.illustration.includes("candid documentary photograph"), `${c.id} : style contemporain`);
    assert.ok(/full body, centered, eye-level view/.test(c.illustration), `${c.id} : créature en pied, centrée, à hauteur d'yeux`);
    const scene = c.illustration.replace(FIN_DE_STYLE, "");
    assert.ok(scene.length > 80, `${c.id} : scène trop courte`);
    assert.ok(!/[àâçéèêëîïôûùœ]/i.test(c.illustration), `${c.id} : prompt pas en anglais`);
    assert.ok(!interdit.test(c.illustration), `${c.id} : ${c.illustration.match(interdit)?.[0]}`);
    assert.ok(!negation.test(c.illustration), `${c.id} : négation`);
    assert.ok(!/\b(light|lit|glow|lamp|neon)\b/i.test(scene), `${c.id} : la scène nomme une lumière, celle de la famille décide`);
    seeds.add(illustrationSeed(c.id));
  }
  assert.equal(seeds.size, HE.length, "graines en double");
  for (const f of FAMILLES) assert.ok(LUMIERE_FAMILLE[f].length > 40, `lumière de ${f}`);
  assert.equal(new Set(FAMILLES.map((f) => LUMIERE_FAMILLE[f])).size, FAMILLES.length, "une lumière par famille");
});

test("hermès : la charte contemporain ouvre sur la lumière et cadre la créature en pied", () => {
  assert.ok(stylePeinture("contemporain", "creature", "").length > 0);
  assert.ok(stylePeinture("contemporain", "creature").startsWith("harsh direct flash"), "lumière par défaut en tête");
  assert.match(stylePeinture("contemporain", "creature"), /full body, centered, eye-level view/);
});

test("hermès : la violence a des suites, les policiers ne sont pas des monstres", () => {
  // Chaque fiche dit ce que coûte la violence en Empreinte et comment éviter le combat par un jet.
  for (const c of HE) {
    assert.match(c.gmNotes, /Empreinte/, `${c.id} : les gmNotes parlent de l'Empreinte`);
    assert.match(c.gmNotes, /Éviter le combat/, `${c.id} : la sortie sans combat`);
    assert.match(c.gmNotes, /(Persuasion|Intimidation|Tromperie|Investigation|Discrétion|Escamotage|Intuition)/, `${c.id} : un jet pour l'éviter`);
  }
  // Les forces de l'ordre : un coup de feu sur elles se paie, dit en toutes lettres.
  for (const c of HE.filter((x) => x.family === "Forces de l'ordre" && x.actions.some((a) => a.name === "Pistolet semi-automatique de 9 mm"))) {
    assert.match(c.gmNotes, /(Empreinte \+2|Empreinte monte de 2|Empreinte à 10|l'Empreinte monte à 10|Empreinte monte de 1|Empreinte \+1)/, `${c.id} : le prix d'un coup de feu`);
  }
  // Aucun policier, douanier ou inspecteur au-dessus de 5 : la fiche d'équipe est la plus haute.
  for (const c of HE.filter((x) => x.family === "Forces de l'ordre")) assert.ok(c.cr <= 5, `${c.id} : FP ${c.cr} pour un policier`);
  // Les grandes fiches de fin de campagne sont des légendaires, pour les niveaux 11 et plus.
  for (const id of ["gael-tournemine", "coup-de-filet", "caserne-en-alerte"]) {
    const c = HE.find((x) => x.id === id)!;
    assert.ok(c?.legendary, `${id} : légendaire`);
    assert.ok(c.cr >= 11, `${id} : FP 11 ou plus`);
  }
});
