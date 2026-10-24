// Cellule Hermès (contemporain) : mêmes exigences que l'Exposition éternelle (rules.test.ts), avec le canon et les règles de ce monde.
import assert from "node:assert/strict";
import { test } from "node:test";
import { argentDOrigine, armurePortee, classeArmureDepart, equipementDeDepart, PLUS_HAUTE_SOMME } from "./armures";
import { nouvelleCampagne, preparerSeance, reglerJauge } from "./campagne";
import { ECOUTES_MAX, REGLE_DES_ECOUTES } from "./canon/contemporain";
import { CANONS, CELLULE_HERMES, anachronismesDans, canonDe, datesImpossibles } from "./canon";
import { getGenre } from "./genres";
import { ideesDe } from "./idees";
import { HISTORIQUES_HERMES, ORIGINES_HERMES, PERSONNALITE_HERMES } from "./hermes-origines";
import { REGLES_HERMES } from "./hermes-regles";
import { CLASS_NAMES_BY_GENRE, REGLES_DU_MONDE, SKILLS, classesFor } from "./rules";

const hermes = classesFor("contemporain");
const C = CELLULE_HERMES;

const BANNED = [
  "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret",
  "elara", "lyra", "kael", "thorne", "vex", "eldoria", "aldric",
  "véritable", "au-delà", "tisser", "tisse",
];

/** Tout ce que lit un joueur. */
const texteJoueur = () => JSON.stringify([hermes, ORIGINES_HERMES, HISTORIQUES_HERMES, REGLES_HERMES, PERSONNALITE_HERMES, C.cartes, getGenre("contemporain")]);

test("Cellule Hermès : le canon est branché, et seul le genre contemporain y est", () => {
  assert.equal(canonDe("contemporain"), C);
  assert.equal(CANONS.contemporain, C);
  assert.equal(C.genre, "contemporain");
  assert.equal(canonDe("inconnu" as never), undefined);
});

test("Cellule Hermès : aucun secret du canon dans ce que lisent les joueurs", () => {
  const text = texteJoueur();
  for (const secret of C.secrets) assert.ok(!text.includes(secret), secret);
  for (const mot of ["Vareilles", "Dunoyer", "Chassagne", "Dissolution", "Collection", "Rachat", "Coffre", "Écoute", "Orlhac", "Zumbrunn", "Kerdilès", "Deluchat", "conservation", "dissous", "dissoute", "Cabinet", "cabinet"]) {
    assert.ok(!text.includes(mot), `texte joueur de la Cellule Hermès : « ${mot} »`);
  }
  for (const word of BANNED) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${word}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `Cellule Hermès : « ${word} »`);
  }
  for (const mot of C.anachronismes) {
    const re = new RegExp(`(^|[^a-zà-ÿœ])${mot.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zà-ÿœ]|$)`);
    assert.ok(!re.test(text.toLowerCase()), `anachronisme dans la Cellule Hermès : « ${mot} »`);
  }
  assert.deepEqual(anachronismesDans(text, C), [], "anachronismes");
  assert.deepEqual(datesImpossibles(text, C), []);
});

test("Cellule Hermès : compétences connues, caractéristiques du genre, ids préfixés, dix classes", () => {
  const noms = new Set(SKILLS.map((s) => s.name));
  const stats = new Set(["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"]);
  assert.equal(hermes.length, 10);
  assert.equal(new Set(hermes.map((c) => c.id)).size, 10);
  for (const c of hermes) {
    assert.ok(c.id.startsWith("he-"), c.id);
    for (const s of c.skills.from) assert.ok(noms.has(s), `${c.name} : compétence « ${s} » inconnue`);
    for (const s of [...c.mainStats, ...c.saves]) assert.ok(stats.has(s), `${c.name} : caractéristique « ${s} » inconnue`);
    assert.equal(c.subclasses[0].powers[0].level, 3, `${c.name} : premier pouvoir de sous-classe au niveau 3`);
    assert.ok(!/Dextérité|Agilité|Sagesse|Charisme|Intelligence|Constitution/.test(JSON.stringify(c)), `${c.name} : nom de caractéristique d'un autre genre`);
    assert.ok(c.powers.some((p) => p.level === 20), `${c.name} : pas de pouvoir de niveau 20`);
    assert.ok(c.powers.some((p) => p.level === 9) && c.powers.some((p) => p.level === 15), `${c.name} : un pouvoir propre aux niveaux 9 et 15`);
    assert.ok(c.powers.some((p) => p.level >= 11 && p.level <= 17 && /une fois par semaine de jeu|une fois par mission|réseau|te (prête|laisse|donne|dit|passe|fait|souffle|remet|rend|reçoit)|te fait signe|t'évite|à qui tu as|que tu connais|qui t'est/i.test(p.effect)), `${c.name} : un réseau ou une faveur aux niveaux 11 à 17`);
    assert.ok(/^\d+ euros$/.test(c.startingGear[c.startingGear.length - 1]), `${c.name} : une somme en euros au départ`);
  }
  for (const h of HISTORIQUES_HERMES) {
    for (const s of h.skills) assert.ok(noms.has(s), `${h.name} : compétence « ${s} » inconnue`);
    assert.ok(h.gear.some((g) => /^\d+ euros$/.test(g)), `${h.name} : une somme en euros au départ`);
  }
  assert.equal(ORIGINES_HERMES.length, 6);
  assert.equal(HISTORIQUES_HERMES.length, 12);
  for (const o of ORIGINES_HERMES) {
    assert.equal(o.subs.length, 2, `${o.name} : deux variantes`);
    assert.ok(o.traits.some((t) => /Argent de départ : \d+ euros/.test(t.text) && argentDOrigine(t.text)), `${o.name} : argent de départ en euros`);
  }
  assert.deepEqual(CLASS_NAMES_BY_GENRE.contemporain, hermes.map((c) => c.name));
  assert.ok(REGLES_DU_MONDE.contemporain === REGLES_HERMES);
});

test("Cellule Hermès : les pouvoirs des niveaux 9 et 15 ne se copient pas d'une classe à l'autre", () => {
  for (const niveau of [9, 15]) {
    const pouvoirs = hermes.flatMap((c) => c.powers.filter((p) => p.level === niveau));
    assert.equal(new Set(pouvoirs.map((p) => p.name)).size, pouvoirs.length, `niveau ${niveau} : noms en double`);
    assert.equal(new Set(pouvoirs.map((p) => p.effect)).size, pouvoirs.length, `niveau ${niveau} : textes en double`);
  }
});

test("Cellule Hermès : les niveaux hauts donnent des réseaux, pas des surhommes", () => {
  const surhomme = /invulnérable|immortel|vole |volent |téléporte|ressuscite|invisible|surhumain|traverse les murs/i;
  for (const c of hermes) for (const p of [...c.powers, ...c.subclasses.flatMap((s) => s.powers)]) assert.ok(!surhomme.test(p.effect), `${c.name} : ${p.name}`);
});

test("Cellule Hermès : l'Empreinte, les couvertures, la Caisse et les armes de la bible", () => {
  const texte = JSON.stringify(REGLES_HERMES);
  for (const mot of [
    "Elle part à 2", "de 0 à 10", "Noté", "Fiché", "Identifié", "Grillé", "repart de l'Empreinte 5", "800 €", "dix jours", "1 000 €", "De 2 par scène où un coursier tire", "Faveur de réseau : une fois par séance", "ne baisse jamais de plus de 3 par mission", "troisième tour sans soins", "Médecine DD 12", "9/27 m", "15 coups ; changer de chargeur : action bonus", "Manche de pioche",
    "2 400 €", "300 à 1 500 €", "500 € d'un distributeur", "10 000 €", "200 à 500 €", "2 000 €", "garde à vue de 24 à 48 heures",
    "30 à 40 €", "le double au marché noir", "1 500 à 3 000 €", "200 €", "30 €", "sauvegarde d'Endurance DD 15", "ramper jusqu'à la fin du premier tour où elle peut agir", "60 € par jour", "35 à 120 €", "80 à 150 €", "40 à 130 €", "40 à 200 €", "catégorie D", "interdit en Belgique", "90 à 160 €", "12 à 30 €", "600 €",
  ]) {
    assert.ok(texte.includes(mot), `règles de la Cellule : « ${mot} »`);
  }
  assert.ok(!/Écoute/.test(texte), "les Écoutes sont dans le guide du MJ, pas dans les règles des joueurs");
  assert.ok(!/message[^.]{0,40}(lu|ouvert|reçu)[^.]{0,30}avant|(lu|ouvert|reçu)[^.]{0,30}avant (le|son|sa) destinataire/i.test(texteJoueur()), "aucun texte joueur ne parle de message lu, ouvert ou reçu avant le destinataire");
  assert.equal(ECOUTES_MAX, 4);
  assert.equal(C.campagne?.reserve?.max, 4);
  assert.equal(C.campagne?.reserve?.regle, REGLE_DES_ECOUTES);
  assert.equal(C.campagne?.reserve?.nom, "Écoutes");
});

test("Cellule Hermès : la Collection monte de 12 à 100, et chaque seuil franchi est annoncé une fois", () => {
  const jauge = C.campagne?.jauge;
  assert.equal(jauge?.nom, "la Collection");
  assert.equal(jauge?.monte, true);
  assert.equal(jauge?.depart, 12);
  assert.deepEqual(jauge?.seuils.map((s) => s.valeur), [25, 50, 75, 100]);
  const c = nouvelleCampagne("contemporain");
  assert.equal(c.jauge, 12);
  assert.deepEqual(reglerJauge(c, 20, C), []);
  assert.deepEqual(reglerJauge(c, 60, C).map((s) => s.valeur), [25, 50]);
  assert.deepEqual(reglerJauge(c, 55, C), []);
  assert.deepEqual(reglerJauge(c, 120, C).map((s) => s.valeur), [75, 100]);
  assert.equal(c.jauge, 100);
  const prep = preparerSeance({ genre: "contemporain", level: 1, campagne: { ...nouvelleCampagne("contemporain"), jauge: 30 } });
  assert.equal(prep.jauge?.prochain?.valeur, 50);
  assert.ok(prep.jauge?.effet.includes("Cabinet"), "le seuil de 25 est atteint");
  assert.equal(prep.accroches.length, 5, "cinq accroches de campagne aux niveaux 1 à 4");
  assert.equal(C.campagne?.accroches.length, 20);
});

test("Cellule Hermès : tout est inventé, rien de réel, rien après 2026", () => {
  assert.equal(C.calendrier.anDeJeu, 2026);
  assert.ok(C.chronologie.every((e) => e.an <= 2026));
  assert.ok(C.factions.length === 5 && C.figures.length >= 15);
  const tout = JSON.stringify([{ ...C, anachronismes: [] }, getGenre("contemporain"), ideesDe("contemporain")]);
  for (const reel of ["DGSE", "DGSI", "CIA", "FBI", "Interpol", "Europol", "Google", "Facebook", "WhatsApp"]) assert.ok(!tout.includes(reel), reel);
});

test("Cellule Hermès : un gilet pare-balles est une armure, l'argent est en euros", () => {
  const stats = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"];
  const mods = [0, 2, 0, 0, 0, 0];
  const ca = (objet: string, maitrise = "Armures légères") => classeArmureDepart(maitrise, [objet], [], stats, mods);
  assert.equal(ca("Gilet pare-balles souple sous le manteau"), 14, "souple = 12 + Adresse");
  assert.equal(ca("Gilet pare-balles à plaques", "Armures légères et intermédiaires"), 17, "plaques = 15 + Adresse (au plus 2)");
  assert.equal(ca("Blouson renforcé"), 13);
  assert.equal(ca("Manteau renforcé"), 13);
  assert.equal(ca("Blouse renforcée"), 13);
  assert.equal(armurePortee(["Téléphone jetable", "Kit de crochetage"]), undefined);
  for (const c of hermes) {
    const armure = armurePortee(c.startingGear);
    assert.ok(armure, `${c.name} : une protection reconnue dans l'équipement de départ`);
    assert.ok(armure.base <= 12, `${c.name} : pas d'armure intermédiaire au niveau 1`);
  }
  assert.ok(PLUS_HAUTE_SOMME.has("contemporain"));
  assert.deepEqual(equipementDeDepart(["Kit de crochetage", "300 euros"], ["Téléphone jetable", "200 euros"], true), ["Kit de crochetage", "Téléphone jetable", "300 euros"]);
  assert.equal(argentDOrigine("Argent de départ : 200 euros."), "200 euros");
});

test("Cellule Hermès : la table publique tire ses noms et ses lieux du canon", () => {
  const g = getGenre("contemporain");
  assert.deepEqual(g.stats, ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"]);
  assert.deepEqual(g.archetypes, hermes.map((c) => c.name));
  assert.deepEqual(g.origins, ORIGINES_HERMES.map((o) => o.name));
  assert.deepEqual(g.places, C.regions.map((r) => r.lieuDeRencontre));
  assert.equal(ideesDe("contemporain").hooks.length, C.accroches.length);
});
