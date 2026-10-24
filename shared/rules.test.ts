import assert from "node:assert/strict";
import { test } from "node:test";
import { subclassLevel } from "./origins";
import { ARCHIPEL, CELLULE_HERMES, CHAMP_D_ASILE, COTE_DES_NOYES, EXPOSITION, GRAND_SEC, ILES_DU_VENT, RESIDENCE, TERNELANDE } from "./canon";
import { classesFor, CLASSES, CLASS_NAMES_BY_GENRE, REGLES_DU_MONDE, SKILLS } from "./rules";
import { HISTORIQUES_RESIDENCE, ORIGINES_RESIDENCE, PERSONNALITE_RESIDENCE } from "./residence-origines";
import { REGLES_RESIDENCE } from "./residence-regles";
import { HISTORIQUES_NOYES, ORIGINES_NOYES, PERSONNALITE_NOYES } from "./noyes-origines";
import { REGLES_NOYES } from "./noyes-regles";
import { HISTORIQUES_SEC, ORIGINES_SEC, PERSONNALITE_SEC } from "./sec-origines";
import { REGLES_SEC } from "./sec-regles";
import { HISTORIQUES_ASILE, ORIGINES_ASILE, PERSONNALITE_ASILE } from "./asile-origines";
import { REGLES_ASILE } from "./asile-regles";
import { HISTORIQUES_ILES, ORIGINES_ILES, PERSONNALITE_ILES } from "./iles-origines";
import { REGLES_ILES } from "./iles-regles";
import { GRAINS_MAX, REGLE_DES_GRAINS } from "./canon/pirates";
import { HISTORIQUES_EXPO, ORIGINES_EXPO, PERSONNALITE_EXPO } from "./expo-origines";
import { REGLES_EXPO } from "./expo-regles";
import { PANNES_MAX, REGLE_DES_PANNES } from "./canon/steampunk";

const fantasy = classesFor("fantasy");
const archipel = classesFor("science-fiction");
const ternelande = classesFor("dark-fantasy");
const residence = classesFor("cyberpunk");
const noyes = classesFor("horreur");
const sec = classesFor("post-apo");
const asile = classesFor("western");
const iles = classesFor("pirates");
const expo = classesFor("steampunk");
const hermes = classesFor("contemporain");
const jouables = [...fantasy, ...archipel, ...ternelande, ...residence, ...noyes, ...sec, ...asile, ...iles, ...expo, ...hermes];

test("sous-classes : deux par classe fantasy, avec un titre", () => {
  assert.equal(fantasy.length, 14);
  assert.equal(archipel.length, 10);
  assert.equal(ternelande.length, 10);
  assert.equal(residence.length, 10);
  assert.equal(noyes.length, 10);
  assert.equal(sec.length, 10);
  assert.equal(asile.length, 10);
  assert.equal(iles.length, 10);
  assert.equal(expo.length, 10);
  assert.equal(hermes.length, 10);
  for (const c of jouables) {
    assert.equal(c.subclasses.length, 2, `${c.name} : ${c.subclasses.length} sous-classes`);
    assert.ok(c.subclassTitle && c.subclassTitle !== "Sous-classe", `${c.name} : pas de titre de sous-classe`);
  }
});

test("sous-classes : ids uniques", () => {
  const ids = CLASSES.flatMap((c) => c.subclasses.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, "id de sous-classe en double");
});

test("sous-classes : premier pouvoir au niveau de choix, puis 3 ou 4 de plus", () => {
  for (const c of jouables) {
    const entry = subclassLevel(c.id);
    for (const s of c.subclasses) {
      const levels = s.powers.map((p) => p.level);
      assert.equal(Math.min(...levels), entry, `${s.name} : premier pouvoir au niveau ${Math.min(...levels)}, attendu ${entry}`);
      assert.ok(levels.every((l) => l >= 1 && l <= 20), `${s.name} : niveau hors de 1 à 20`);
      const later = new Set(levels.filter((l) => l > entry));
      assert.ok(later.size >= 3 && later.size <= 4, `${s.name} : ${later.size} niveaux après l'entrée`);
      // Pas deux pouvoirs du même nom sur la fiche (classe + sous-classe)
      const names = [...c.powers, ...s.powers].map((p) => p.name);
      assert.equal(new Set(names).size, names.length, `${s.name} : nom de pouvoir en double avec la classe`);
      assert.ok(s.pitch.length > 20 && s.description.length > 80, `${s.name} : textes trop courts`);
      for (const p of s.powers) {
        if (p.recharge === "repos court" || p.recharge === "repos long") {
          // un pouvoir limité dit combien de fois, sauf s'il coûte des points de souffle
          assert.ok(p.uses || /souffle/.test(p.effect), `${s.name} / ${p.name} : nombre d'utilisations manquant`);
        }
      }
    }
  }
});

test("sous-classes : les deux d'une classe tombent aux mêmes niveaux", () => {
  for (const c of jouables) {
    const [a, b] = c.subclasses.map((s) => s.powers.map((p) => p.level).join(","));
    assert.equal(a, b, `${c.name} : niveaux différents entre sous-classes`);
  }
});

const BANNED = [
  // Skill ecrire-scenario
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric",
  // Tics repérés ailleurs dans le projet
  "véritable", "au-delà", "tisser", "tisse",
];

// Sous-classes de la 5e hors SRD 5.1 : leurs noms ne doivent pas apparaître.
const PROTECTED = [
  "maître de guerre", "chevalier occulte", "arnaqueur arcanique", "assassin", "domaine de la tempête", "domaine de la guerre",
  "domaine de la lumière", "domaine de la ruse", "domaine de la nature", "domaine de la tombe", "domaine de la forge",
  "serment des anciens", "serment de vengeance", "serment de la couronne", "cercle de la lune", "maître des bêtes",
  "collège de la vaillance", "voie du totem", "totem", "voie de l'ombre", "quatre éléments", "magie sauvage",
  "grand ancien", "archifée", "céleste déchu", "lame maudite", "école d'abjuration", "école de nécromancie",
  "école d'illusion", "école de divination",
];

test("sous-classes : ni tournure bannie, ni nom protégé, ni Gorvan dans le texte joueur", () => {
  for (const c of jouables) {
    for (const s of c.subclasses) {
      const text = JSON.stringify(s).toLowerCase();
      for (const word of [...BANNED, ...PROTECTED]) {
        const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
        assert.ok(!re.test(text), `${s.id} contient « ${word} »`);
      }
      assert.ok(!text.includes("gorvan"), `${s.id} nomme Gorvan, qui doit rester caché aux joueurs`);
    }
  }
});

test("classes de l'Archipel : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify(archipel);
  for (const secret of ARCHIPEL.secrets) assert.ok(!text.includes(secret), secret);
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de l'Archipel : « ${word} »`);
  }
});

test("classes de la Ternelande : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify(ternelande);
  for (const secret of TERNELANDE.secrets) assert.ok(!text.includes(secret), secret);
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de la Ternelande : « ${word} »`);
  }
});

test("classes de la Résidence : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([residence, ORIGINES_RESIDENCE, HISTORIQUES_RESIDENCE, REGLES_RESIDENCE, PERSONNALITE_RESIDENCE]);
  for (const secret of RESIDENCE.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Concierge", "Gérance", "Hector est mort", "mort d'Hector", "transfert d'heures", "Compteurs de morts"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur de la Résidence : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de la Résidence : « ${word} »`);
  }
  for (const mot of RESIDENCE.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans la Résidence : « ${mot} »`);
  }
});

test("classes de la Résidence : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Corps", "Réflexes", "Endurance", "Technique", "Instinct", "Aplomb"]);
  for (const c of residence) {
    assert.ok(c.id.startsWith("cp-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
  }
  for (const h of HISTORIQUES_RESIDENCE) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_RESIDENCE.length, 6);
  assert.equal(HISTORIQUES_RESIDENCE.length, 8);
});

test("classes de la Côte des Noyés : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([noyes, ORIGINES_NOYES, HISTORIQUES_NOYES, REGLES_NOYES, PERSONNALITE_NOYES]);
  for (const secret of COTE_DES_NOYES.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Lame de fond", "Lames de fond", "dix lettres", "Louise Marchal", "naufrage"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur de la Côte des Noyés : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de la Côte des Noyés : « ${word} »`);
  }
  for (const mot of COTE_DES_NOYES.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans la Côte des Noyés : « ${mot} »`);
  }
});

test("classes de la Côte des Noyés : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Adresse", "Endurance", "Savoir", "Sang-froid", "Présence"]);
  for (const c of noyes) {
    assert.ok(c.id.startsWith("hr-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
  }
  for (const h of HISTORIQUES_NOYES) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_NOYES.length, 6);
  assert.equal(HISTORIQUES_NOYES.length, 11);
});

test("classes de la Côte des Noyés : le prix des pouvoirs est dit, la Marée ne dépasse pas 9", () => {
  for (const c of noyes) {
    const aPrix = [...c.powers, ...c.subclasses.flatMap((s) => s.powers)].some((p) => /Prix : (Marée \+\d|un Présage)/.test(p.effect));
    if (aPrix && c.id !== "hr-expert") {
      assert.ok(c.powers.some((p) => p.name === "Ce que coûte la vérité"), `${c.name} : pouvoir à prix sans le passif « Ce que coûte la vérité »`);
    }
    for (const p of [...c.powers, ...c.subclasses.flatMap((s) => s.powers)]) {
      const m = p.effect.match(/Prix : Marée \+(\d)/);
      if (m) assert.ok(Number(m[1]) <= 2, `${c.name} : ${p.name} coûte trop de Marée`);
    }
  }
});

test("classes du Grand Sec : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([sec, ORIGINES_SEC, HISTORIQUES_SEC, REGLES_SEC, PERSONNALITE_SEC]);
  for (const secret of GRAND_SEC.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Gardes-Mâts", "Conseil des Eaux", "consortium", "ensemencement", "Rose Faucon", "Lucas Arnaud"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur du Grand Sec : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes du Grand Sec : « ${word} »`);
  }
  for (const mot of GRAND_SEC.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans le Grand Sec : « ${mot} »`);
  }
});

test("classes du Grand Sec : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Agilité", "Endurance", "Savoir", "Instinct", "Présence"]);
  for (const c of sec) {
    assert.ok(c.id.startsWith("pa-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
    const niveaux = c.subclasses.map((s) => s.powers.map((p) => p.level).join(","));
    assert.equal(niveaux[0], niveaux[1], `${c.name} : les deux sous-classes n'ont pas les mêmes niveaux`);
    assert.equal(c.subclasses[0].powers[0].level, 3, `${c.name} : premier pouvoir de sous-classe au niveau 3`);
  }
  for (const h of HISTORIQUES_SEC) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_SEC.length, 6);
  assert.equal(HISTORIQUES_SEC.length, 8);
  for (const o of ORIGINES_SEC) assert.equal(o.subs.length, 2, `${o.name} : deux variantes`);
});

test("classes du Grand Sec : le prix des pouvoirs est dit en godets, au plus 2 par pouvoir", () => {
  for (const c of sec) {
    const tous = [...c.powers, ...c.subclasses.flatMap((s) => s.powers)];
    const aPrix = tous.some((p) => /Prix : \d godets?\./.test(p.effect));
    const aPassif = c.powers.some((p) => p.name === "Ce que coûte l'effort");
    assert.equal(aPrix, aPassif, `${c.name} : pouvoir à prix et passif « Ce que coûte l'effort » vont ensemble`);
    for (const p of tous) {
      const m = p.effect.match(/Prix : (\d) godets?\./);
      if (m) assert.ok(Number(m[1]) <= 2, `${c.name} : ${p.name} coûte trop d'eau`);
    }
  }
});

test("classes du Champ-d'Asile : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([asile, ORIGINES_ASILE, HISTORIQUES_ASILE, REGLES_ASILE, PERSONNALITE_ASILE]);
  for (const secret of CHAMP_D_ASILE.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["1880", "copie", "Traité", "cordelette", "Sorbier"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur du Champ-d'Asile : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes du Champ-d'Asile : « ${word} »`);
  }
  for (const mot of CHAMP_D_ASILE.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans le Champ-d'Asile : « ${mot} »`);
  }
});

test("classes du Champ-d'Asile : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"]);
  for (const c of asile) {
    assert.ok(c.id.startsWith("ws-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
    assert.equal(c.subclasses[0].powers[0].level, 3, `${c.name} : premier pouvoir de sous-classe au niveau 3`);
    assert.ok(!/Dextérité|Agilité|Sagesse|Charisme|Intelligence|Constitution/.test(JSON.stringify(c)), `${c.name} : nom de caractéristique d'un autre genre`);
  }
  for (const h of HISTORIQUES_ASILE) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_ASILE.length, 6);
  assert.equal(HISTORIQUES_ASILE.length, 8);
  for (const o of ORIGINES_ASILE) assert.equal(o.subs.length, 2, `${o.name} : deux variantes`);
  assert.equal(CLASS_NAMES_BY_GENRE.western?.length, 10);
  for (const c of asile) assert.ok(CLASS_NAMES_BY_GENRE.western?.includes(c.name), `${c.name} absent de la liste de noms`);
  assert.ok(REGLES_DU_MONDE.western === REGLES_ASILE);
});

test("classes du Champ-d'Asile : la poudre est comptée, le Nom monte par coup d'éclat", () => {
  for (const c of asile) {
    const tous = [...c.powers, ...c.subclasses.flatMap((s) => s.powers)];
    const poudre = tous.some((p) => /Poudre : \d cartouches?\./.test(p.effect));
    if (poudre) assert.ok(c.powers.some((p) => p.name === "La poudre compte"), `${c.name} : pouvoir à poudre sans passif « La poudre compte »`);
    for (const p of tous) {
      const m = p.effect.match(/Poudre : (\d) cartouches?\./);
      if (m) assert.ok(Number(m[1]) <= 3, `${c.name} : ${p.name} fait partir trop de cartouches`);
    }
    const eclat = tous.some((p) => /Coup d'éclat :/.test(p.effect));
    assert.equal(c.powers.some((p) => p.name === "Ce qu'on raconte"), eclat, `${c.name} : coup d'éclat et passif « Ce qu'on raconte » vont ensemble`);
    for (const p of tous.filter((x) => /Coup d'éclat :/.test(x.effect))) {
      assert.ok(p.recharge === "repos long" && p.uses === 1, `${c.name} : ${p.name} (coup d'éclat) une fois par repos long`);
    }
  }
  const texte = JSON.stringify(REGLES_ASILE);
  for (const mot of ["100 dollars", "500 dollars", "Colt | 17 dollars", "Winchester | 30 dollars", "25 dollars sur parole", "Au plus un point par séance", "1,5 kg"]) assert.ok(texte.includes(mot), `règles du Nom et de la poudre : « ${mot} »`);
});

test("classes des Îles du Vent : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([iles, ORIGINES_ILES, HISTORIQUES_ILES, REGLES_ILES, PERSONNALITE_ILES]);
  for (const secret of ILES_DU_VENT.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Santa Clara", "Larrañaga", "croix rouge", "Matanzas", "registre", "pièce fausse"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur des Îles du Vent : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes des Îles du Vent : « ${word} »`);
  }
  for (const mot of ILES_DU_VENT.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans les Îles du Vent : « ${mot} »`);
  }
});

test("classes des Îles du Vent : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"]);
  for (const c of iles) {
    assert.ok(c.id.startsWith("pi-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
    assert.equal(c.subclasses[0].powers[0].level, 3, `${c.name} : premier pouvoir de sous-classe au niveau 3`);
    assert.ok(!/Dextérité|Agilité|Sagesse|Charisme|Intelligence|Constitution/.test(JSON.stringify(c)), `${c.name} : nom de caractéristique d'un autre genre`);
    assert.ok(c.powers.some((p) => p.level === 20), `${c.name} : pas de pouvoir de niveau 20`);
  }
  for (const h of HISTORIQUES_ILES) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_ILES.length, 6);
  assert.equal(HISTORIQUES_ILES.length, 8);
  for (const o of ORIGINES_ILES) assert.equal(o.subs.length, 2, `${o.name} : deux variantes`);
  assert.equal(CLASS_NAMES_BY_GENRE.pirates?.length, 10);
  for (const c of iles) assert.ok(CLASS_NAMES_BY_GENRE.pirates?.includes(c.name), `${c.name} absent de la liste de noms`);
  assert.ok(REGLES_DU_MONDE.pirates === REGLES_ILES);
});

test("classes des Îles du Vent : un coup, puis recharger ; le coup de main coûte du Moral", () => {
  for (const c of iles) {
    const tous = [...c.powers, ...c.subclasses.flatMap((s) => s.powers)];
    assert.ok(c.powers.some((p) => p.name === "Un coup, puis recharger"), `${c.name} : passif « Un coup, puis recharger » manquant`);
    const coup = tous.filter((p) => /Coup de main :/.test(p.effect));
    assert.equal(c.powers.some((p) => p.name === "Le navire compte"), coup.length > 0, `${c.name} : coup de main et passif « Le navire compte » vont ensemble`);
    assert.ok(coup.length >= 2, `${c.name} : un coup de main aux niveaux 11 et 17`);
    for (const p of coup) assert.ok(p.recharge === "repos long" && p.uses === 1, `${c.name} : ${p.name} (coup de main) une fois par repos long`);
    assert.ok(coup.every((p) => p.level >= 11), `${c.name} : coup de main avant le niveau 11`);
  }
  const texte = JSON.stringify(REGLES_ILES);
  for (const mot of ["Le Moral part à 6", "1 point de Moral", "Un seul coup de main par scène", "Une cargaison de captifs n'est pas une prise", "Tout le monde commence à 1", "De 0 à 3", "un coup, recharger (action)","mal de Siam", "tafia", "4 réaux"]) {
    if (mot === "Le Moral part à 6" || mot === "Tout le monde commence à 1" || mot === "De 0 à 3") continue;
    assert.ok(texte.includes(mot), `règles des Îles du Vent : « ${mot} »`);
  }
  assert.ok(texte.includes("Le Moral part à 6"), "le Moral part à 6");
  assert.ok(texte.includes("de 0 à 3"), "la Chance va de 0 à 3");
  assert.ok(texte.includes("Tout le monde commence à 1"), "la Chance part à 1");
  assert.ok(!/Grains/.test(texte), "les Grains sont dans le guide du MJ, pas dans les règles des joueurs");
  assert.equal(GRAINS_MAX, 4);
  assert.equal(ILES_DU_VENT.campagne?.reserve?.max, 4);
  assert.equal(ILES_DU_VENT.campagne?.reserve?.regle, REGLE_DES_GRAINS);
  assert.equal(ILES_DU_VENT.campagne?.jauge?.depart, 100);
  assert.equal(ILES_DU_VENT.campagne?.jauge?.nom, "la Paix des Îles");
});

test("Îles du Vent : aucun captif parmi les prises, aucun butin humain dans le texte joueur", () => {
  const texte = JSON.stringify([iles, ORIGINES_ILES, HISTORIQUES_ILES, REGLES_ILES, PERSONNALITE_ILES, ILES_DU_VENT.cartes]).toLowerCase();
  for (const mot of ["cargaison d'esclaves", "esclaves à vendre", "prix d'un esclave", "vendre les captifs", "piastres par tête", "ou six esclaves"]) assert.ok(!texte.includes(mot), mot);
});

test("classes de l'Exposition éternelle : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = JSON.stringify([expo, ORIGINES_EXPO, HISTORIQUES_EXPO, REGLES_EXPO, PERSONNALITE_EXPO, EXPOSITION.cartes]);
  for (const secret of EXPOSITION.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Dormeuse", "pièce mère", "pièces mères", "Veilleur", "Delestrade", "dernier plan", "Fosse", "Sujet", "trust", "Pannes", "Pouls"]) {
    assert.ok(!text.toLowerCase().includes(mot.toLowerCase()), `texte joueur de l'Exposition éternelle : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `classes de l'Exposition éternelle : « ${word} »`);
  }
  for (const mot of EXPOSITION.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase()}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans l'Exposition éternelle : « ${mot} »`);
  }
  // Les gens des Villages, les ouvrières et les anarchistes ne sont ni des spectacles ni des caricatures.
  for (const mot of ["sauvage", "indigène", "primitif", "exotique", "pittoresque", "bicot", "nègre"]) assert.ok(!text.toLowerCase().includes(mot), `texte joueur de l'Exposition éternelle : « ${mot} »`);
});

test("classes de l'Exposition éternelle : compétences connues, caractéristiques du genre, ids préfixés", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"]);
  for (const c of expo) {
    assert.ok(c.id.startsWith("ex-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
    assert.equal(c.subclasses[0].powers[0].level, 3, `${c.name} : premier pouvoir de sous-classe au niveau 3`);
    assert.ok(!/Dextérité|Agilité|Sagesse|Charisme|Intelligence|Constitution/.test(JSON.stringify(c)), `${c.name} : nom de caractéristique d'un autre genre`);
    assert.ok(c.powers.some((p) => p.level === 20), `${c.name} : pas de pouvoir de niveau 20`);
    assert.ok(c.powers.some((p) => p.level === 9) && c.powers.some((p) => p.level === 15), `${c.name} : un pouvoir propre aux niveaux 9 et 15`);
  }
  for (const h of HISTORIQUES_EXPO) for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
  assert.equal(ORIGINES_EXPO.length, 6);
  assert.equal(HISTORIQUES_EXPO.length, 8);
  for (const o of ORIGINES_EXPO) assert.equal(o.subs.length, 2, `${o.name} : deux variantes`);
  assert.equal(CLASS_NAMES_BY_GENRE.steampunk?.length, 10);
  for (const c of expo) assert.ok(CLASS_NAMES_BY_GENRE.steampunk?.includes(c.name), `${c.name} absent de la liste de noms`);
  assert.ok(REGLES_DU_MONDE.steampunk === REGLES_EXPO);
});

test("classes de l'Exposition éternelle : les pouvoirs des niveaux 9 et 15 ne se copient pas d'une classe à l'autre", () => {
  for (const niveau of [9, 15]) {
    const pouvoirs = expo.flatMap((c) => c.powers.filter((p) => p.level === niveau));
    assert.equal(new Set(pouvoirs.map((p) => p.name)).size, pouvoirs.length, `niveau ${niveau} : noms en double`);
    assert.equal(new Set(pouvoirs.map((p) => p.effect)).size, pouvoirs.length, `niveau ${niveau} : textes en double`);
  }
});

test("classes de l'Exposition éternelle : la Chaudière fait monter la Pression, et les classes qui en ont savent le dire", () => {
  for (const c of expo) {
    const tous = [...c.powers, ...c.subclasses.flatMap((s) => s.powers)];
    const chaudiere = tous.filter((p) => /Chaudière :/.test(p.effect));
    assert.equal(c.powers.some((p) => p.name === "Sous pression"), chaudiere.length > 0, `${c.name} : pouvoir « Chaudière » et passif « Sous pression » vont ensemble`);
    for (const p of chaudiere) {
      assert.ok(p.action !== "passif" && p.recharge !== "passif", `${c.name} : ${p.name} (Chaudière) n'est pas un passif`);
      assert.ok(/Pression monte de 1/.test(p.effect), `${c.name} : ${p.name} dit de combien monte la Pression`);
    }
  }
  assert.ok(expo.filter((c) => c.powers.some((p) => p.name === "Sous pression")).length >= 3, "au moins trois métiers vivent de la Pression");
  const texte = JSON.stringify(REGLES_EXPO);
  for (const mot of ["Elle part à 0", "de 0 à 10", "la chaudière chauffe", "surcharge", "fuite", "éclatement", "plus 1d6 par tranche de 4 niveaux", "retombe à 4", "deux brevets", "200 francs", "5 francs par semaine", "retenue de 1 franc", "Gens des Villages"]) {
    if (mot === "de 0 à 10") continue;
    assert.ok(texte.includes(mot), `règles de la Pression : « ${mot} »`);
  }
  assert.ok(texte.includes("de 0 à 10"), "la Pression va de 0 à 10");
  assert.ok(!/Pannes/.test(texte), "les Pannes sont dans le guide du MJ, pas dans les règles des joueurs");
  assert.equal(PANNES_MAX, 4);
  assert.equal(EXPOSITION.campagne?.reserve?.max, 4);
  assert.equal(EXPOSITION.campagne?.reserve?.regle, REGLE_DES_PANNES);
});

test("Exposition éternelle : le Pouls, les prix de 1899 et les armes de la bible", () => {
  const jauge = EXPOSITION.campagne?.jauge;
  assert.equal(jauge?.nom, "le Pouls");
  assert.equal(jauge?.depart, 100);
  assert.deepEqual(jauge?.seuils.map((s) => s.valeur), [75, 50, 25, 0]);
  const texte = JSON.stringify(REGLES_EXPO);
  for (const mot of ["Un revolver d'ordonnance | 25 francs", "Une canne-épée | 20 francs", "Un fusil de chasse | 90 francs", "Une lampe à arc de poche | 40 francs", "Une licence de brevet | 200 francs", "Fusil Lebel", "Matraque à tension", "80 francs", "15 francs par mois", "5 francs par mois", "35 centimes", "15 centimes", "1 franc 50", "5 francs", "20 francs", "3 000 francs"]) {
    assert.ok(texte.includes(mot), `prix de 1899 : « ${mot} »`);
  }
  for (const c of expo) assert.ok(c.startingGear.some((g) => /^\d+ francs$/.test(g)), `${c.name} : une somme en francs au départ`);
  for (const h of HISTORIQUES_EXPO) assert.ok(h.gear.some((g) => /^\d+ francs$/.test(g)), `${h.name} : une somme en francs au départ`);
  for (const o of ORIGINES_EXPO) assert.ok(o.traits.some((t) => /licence/.test(t.text)), `${o.name} : dit qui avance la licence`);
});
