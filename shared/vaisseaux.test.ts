import assert from "node:assert/strict";
import { test } from "node:test";
import { BESTIAIRE_ILES } from "./iles-bestiaire";
import { REGLES_ILES } from "./iles-regles";
import type { Character, Token } from "./types";
import { ACTIONS, encaisser, estNavire, etatGreement, finDeCombat, jouerAction, marine, MODELES, modeManoeuvre, nettoyerVaisseaux, nouveauRound, nouveauVaisseau, POSTES, synchroniserPions, vaisseauxPourJoueur, vitesseEffective } from "./vaisseaux";

/** Dés pipés : chaque appel rend la valeur suivante de la liste (entre 0 et 1). */
const pipe = (...faces: number[]) => {
  let i = 0;
  return () => faces[i++ % faces.length];
};
/** Valeur à donner à `random` pour obtenir une face précise d'un dé. */
const face = (n: number, cotes: number) => (n - 0.5) / cotes;

const artilleuse = { id: "c1", name: "Soline", level: 5, stats: { Réflexes: 16, Technique: 14, Instinct: 12, Présence: 10, Puissance: 10, Endurance: 12 } } as unknown as Character;

test("vaisseaux : chaque modèle est complet, chaque poste a une action", () => {
  for (const m of MODELES) {
    assert.ok(m.coque > 0 && m.ca >= 10 && m.vitesse > 0 && m.taille >= 1, m.id);
    for (const a of m.armes) assert.match(a.degats, /^\d+d\d+$/, `${m.id} : ${a.nom}`);
  }
  for (const p of POSTES) assert.ok(ACTIONS.some((a) => a.poste === p.id), p.id);
  const cargo = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  assert.equal(cargo.defauts.length, 3, "un vieux cargo a trois défauts");
  assert.equal(cargo.cache, false);
  assert.equal(nouveauVaisseau("fregate", "", "autre").cache, true, "un vaisseau ennemi commence caché");
});

test("vaisseaux : les boucliers prennent les dégâts avant la coque", () => {
  const v = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  assert.equal(encaisser(v, 15), 0);
  assert.equal(v.boucliers, 5);
  assert.equal(encaisser(v, 15), 10);
  assert.deepEqual([v.boucliers, v.coque], [0, 50]);
  encaisser(v, 999);
  assert.equal(v.coque, 0, "la coque ne descend pas sous zéro");
});

test("vaisseaux : un tir touche, désigner donne l'avantage, un 20 double les dés", () => {
  const nous = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  const eux = nouveauVaisseau("corvette-de-douane", "Corvette", "autre");
  // 15 au d20 + 4 (arme) + 3 (Réflexes 16) = 22 contre CA 14 ; dégâts 2d8 : 5 et 5.
  const r = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux, arme: 0 }, pipe(face(15, 20), face(5, 8), face(5, 8)));
  assert.match(r.texte, /22 contre CA 14/);
  assert.equal(eux.boucliers, 20, "10 dégâts sur 30 de boucliers");
  // La vigie désigne, puis un tir critique : 20 naturel, dégâts doublés (deux jets de 2d8).
  jouerAction("science-fiction", nous, "designer", artilleuse, {}, pipe(face(18, 20)));
  assert.equal(nous.effets.visee, true);
  const c = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux, arme: 0 }, pipe(face(20, 20), face(2, 20), face(8, 8), face(8, 8), face(8, 8), face(8, 8)));
  assert.match(c.texte, /coup critique/);
  assert.equal(c.jets.length, 3);
  assert.equal(nous.effets.visee, false, "l'avantage est consommé");
  assert.equal(eux.boucliers + eux.coque, 20 + 80 - 32);
});

test("vaisseaux : un 1 naturel manque, et bloque la tourelle du vieux cargo", () => {
  const nous = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  const eux = nouveauVaisseau("chasseur", "Chasseur", "autre");
  const r = jouerAction("science-fiction", nous, "tirer", artilleuse, { cible: eux }, pipe(face(1, 20)));
  assert.match(r.texte, /manqué\. La tourelle se bloque/);
  assert.equal(eux.coque, eux.coqueMax);
});

test("vaisseaux : esquive et ordre durent un round", () => {
  const v = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  jouerAction("science-fiction", v, "esquive", artilleuse, {}, pipe(face(15, 20)));
  assert.equal(v.effets.esquive, 4, "15 + 3 + 3 = 21 : +4 CA");
  nouveauRound(v);
  assert.deepEqual(v.effets, {});
  assert.throws(() => jouerAction("science-fiction", v, "tirer", artilleuse, {}), /vaisseau à viser/);
});

test("vaisseaux : les joueurs ne voient ni vaisseau caché ni note du MJ ; l'import est borné", () => {
  const nous = { ...nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe"), notes: "La Main Close a posé un traceur dans la soute." };
  const eux = nouveauVaisseau("fregate", "Frégate en embuscade", "autre");
  const vue = vaisseauxPourJoueur([nous, eux]);
  assert.equal(vue.length, 1);
  assert.equal(JSON.stringify(vue).includes("traceur"), false);
  const propre = nettoyerVaisseaux([{ ...nous, coque: 99999, armes: [{ nom: "Canon", bonus: 3, degats: "rm -rf", portee: 10 }] }, "n'importe quoi"]);
  assert.equal(propre.length, 1);
  assert.equal(propre[0].coque, propre[0].coqueMax);
  assert.equal(propre[0].armes[0].degats, "1d6");
});

test("vaisseaux : l'Archipel garde ses mots et ses chiffres, tout autre genre aussi", () => {
  assert.equal(marine("science-fiction").mots.nom, "Vaisseau");
  assert.equal(marine("fantasy").mots.nom, "Vaisseau");
  assert.equal(marine("science-fiction").modeles, MODELES);
  assert.equal(marine("science-fiction").postes, POSTES);
  assert.equal(marine("science-fiction").actions, ACTIONS);
  const cargo = nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe");
  assert.equal(cargo.moral, undefined, "pas de Moral dans un vaisseau");
  assert.equal(estNavire(cargo), false);
  assert.equal(vitesseEffective(cargo), cargo.vitesse);
});

// ——— Les navires des Îles du Vent ———

const canonniere = { id: "c2", name: "Mathurin", level: 3, stats: { Force: 10, Adresse: 16, Endurance: 12, Savoir: 12, Instinct: 12, Présence: 10 } } as unknown as Character;
const capitaine = { id: "c3", name: "Jeanne", level: 3, stats: { Force: 10, Adresse: 12, Endurance: 12, Savoir: 12, Instinct: 12, Présence: 14 } } as unknown as Character;
/** Un dé qui donne toujours la même face : (n - 0.5) / côtés. */
const constant = (n: number, cotes: number) => () => face(n, cotes);
const pirates = "pirates" as const;
const sloop = (nom = "Pie-Noire", equipage: "groupe" | "autre" = "groupe") => nouveauVaisseau("sloop", nom, equipage, pirates);
const galion = () => nouveauVaisseau("galion-garde-cote", "Garde-côte", "autre", pirates);

test("navires : cinq modèles, des chiffres de iles-regles et du bestiaire, aucun mot de science-fiction", () => {
  const m = marine(pirates);
  assert.deepEqual(m.modeles.map((x) => x.id), ["sloop", "goelette", "brigantin", "fregate", "galion-garde-cote"]);
  assert.deepEqual(m.postes.map((p) => p.nom), ["Capitaine", "Barreur", "Canonnier", "Maître de manœuvre", "Gabier de vigie"]);
  for (const mo of m.modeles) {
    assert.ok(mo.coque > 0 && mo.boucliers > 0 && mo.ca >= 10 && mo.vitesse > 0 && mo.taille >= 1 && (mo.hommes ?? 0) > 0, mo.id);
    const canon = mo.armes.find((a) => a.nom === "Canons de 8")!;
    assert.deepEqual([canon.degats, canon.portee, canon.servants], ["4d10", 24, 2], `${mo.id} : canon de 8 = 4d10, 36 m (24 cases), deux servants`);
    const pierrier = mo.armes.find((a) => a.nom === "Pierriers")!;
    assert.deepEqual([pierrier.degats, pierrier.portee, pierrier.servants, pierrier.contre], ["2d8", 12, 1, "hommes"], `${mo.id} : pierrier = 2d8, 18 m (12 cases), un servant`);
  }
  for (const p of m.postes) assert.ok(m.actions.some((a) => a.poste === p.id), p.id);
  // Les chiffres des pièces viennent des règles du livre ; la CA des navires, des fiches du bestiaire.
  const regles = JSON.stringify(REGLES_ILES);
  assert.ok(regles.includes("Canon de 8 | 4d10 contondants | 36 m") && regles.includes("Pierrier | 2d8 perforants | 18 m"));
  const ca = (id: string) => BESTIAIRE_ILES.find((c) => c.id === id)!.ac;
  assert.equal(m.modeles.find((x) => x.id === "sloop")!.ca, ca("sloop-de-flibustiers"));
  assert.equal(m.modeles.find((x) => x.id === "galion-garde-cote")!.ca, ca("galion-garde-cote"));
  assert.ok(m.modeles.find((x) => x.id === "fregate")!.ca <= ca("navire-blanc"), "une frégate ordinaire n'a pas les bordages doublés du Navire blanc");
  // Les textes que l'écran affiche, pas les noms de champs (la réserve du gréement s'appelle `boucliers` dans la fiche).
  const textes: string[] = [];
  JSON.stringify([m.postes, m.actions, m.modeles, m.mots], (k, v) => (typeof v === "string" && k !== "id" && k !== "poste" && textes.push(v), v));
  const texte = textes.join("\n").toLowerCase();
  for (const mot of ["bouclier", "tourelle", "hangar", "vaisseau", "détecteur", "écran", "pilote", "artilleur", "mécanicien", "réflexes", "technique", "phare", "hégémon", "ligue", "espace", "propuls"]) {
    assert.ok(!texte.includes(mot), `vocabulaire des navires : « ${mot} »`);
  }
  assert.equal(m.mots.nom, "Navire");
  assert.equal(m.mots.reserve, "Gréement");
  assert.equal(m.mots.carte, "mer");
  const pie = sloop();
  assert.deepEqual([pie.moral, pie.hommes, pie.perdus], [6, 40, 0]);
  assert.equal(pie.armes[0].chargees, 4);
  assert.equal(estNavire(pie), true);
});

test("navires : le canon tire une pièce, la pièce reste vide jusqu'à ce qu'on recharge", () => {
  const nous = sloop();
  const eux = galion();
  // d20 = 15, +5 (arme) +3 (Adresse 16) = 23 contre CA 17 ; 4d10 : 5+5+5+5 = 20.
  const r = jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 0 }, pipe(face(15, 20), face(5, 10), face(5, 10), face(5, 10), face(5, 10)));
  assert.match(r.texte, /tire une pièce de Canons de 8 sur Garde-côte \(23 contre CA 17\)/);
  assert.equal(eux.coque, eux.coqueMax - 20);
  assert.equal(eux.boucliers, eux.bouclierMax, "le canon ne touche pas le gréement quand on vise la coque");
  assert.equal(nous.armes[0].chargees, 3);
  jouerAction(pirates, nous, "tirer", canonniere, { cible: eux }, constant(1, 2));
  assert.equal(nous.armes[0].chargees, 2);
  const bordee = jouerAction(pirates, nous, "bordee", canonniere, { cible: eux }, constant(15, 20));
  assert.equal(nous.armes[0].chargees, 0, "la bordée vide toutes les pièces chargées");
  assert.match(bordee.texte, /bordée/);
  assert.throws(() => jouerAction(pirates, nous, "tirer", canonniere, { cible: eux }), /recharge/);
  jouerAction(pirates, nous, "recharger", canonniere, { arme: 0 });
  assert.equal(nous.armes[0].chargees, 4);
  assert.throws(() => jouerAction(pirates, nous, "recharger", canonniere, { arme: 0 }), /chargées/);
});

test("navires : bordée complète, 20 naturel, 1 naturel, ordre et cible guettée", () => {
  const nous = sloop();
  const eux = sloop("Sloop adverse", "autre");
  // Chaque pièce : d20 = 15 (+8 = 23 contre CA 15), 4d10 = 8×4 = 32. Quatre pièces : 128 dégâts sur une coque de 100.
  const r = jouerAction(pirates, nous, "bordee", canonniere, { cible: eux, arme: 0 }, () => 0.7);
  assert.match(r.texte, /4 pièces sur 4 touchent : 128 dégâts dans la coque \(0\/100\)/);
  assert.match(r.texte, /à la dérive/);
  assert.equal(eux.coque, 0);
  // Un 1 naturel manque toujours, même contre une CA basse ; un 20 touche toujours et double les dés.
  const a = sloop();
  const b = sloop("Cible", "autre");
  b.ca = 30;
  const rate = jouerAction(pirates, a, "tirer", canonniere, { cible: b }, constant(1, 20));
  assert.match(rate.texte, /tout porte à l'eau/);
  const crit = jouerAction(pirates, a, "tirer", canonniere, { cible: b }, pipe(face(20, 20), face(10, 10), face(10, 10), face(10, 10), face(10, 10), face(10, 10), face(10, 10), face(10, 10), face(10, 10)));
  assert.match(crit.texte, /coup critique, 80 dégâts/);
  // L'ordre du capitaine donne +2 aux tirs ; la cible guettée donne l'avantage (deux dés, le meilleur) et ne sert qu'une fois.
  const c = sloop();
  jouerAction(pirates, c, "ordre", capitaine, {}, constant(15, 20));
  assert.equal(c.effets.ordre, true);
  jouerAction(pirates, c, "designer", canonniere, {}, constant(18, 20));
  assert.equal(c.effets.visee, true);
  const e = sloop("Cible", "autre");
  const t = jouerAction(pirates, c, "tirer", canonniere, { cible: e }, pipe(face(4, 20), face(12, 20), face(5, 10), face(5, 10), face(5, 10), face(5, 10)));
  assert.match(t.texte, /\(22 contre CA 15\)/, "12 + 5 + 3 + 2 de l'ordre");
  assert.equal(c.effets.visee, false);
});

test("navires : viser le gréement coûte 2 ; abîmé le navire ralentit, tombé il ne vire plus et l'équipage perd du cœur", () => {
  const nous = sloop();
  const eux = nouveauVaisseau("brigantin", "Brigantin", "autre", pirates);
  assert.equal(etatGreement(eux), "intact");
  // 15 + 5 + 3 - 2 = 21 contre CA 16 ; 4d10 : 8 × 4 = 32 sur un gréement de 60.
  const r = jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, viser: "greement" }, () => 0.7);
  assert.match(r.texte, /\(21 contre CA 16\)/);
  assert.match(r.texte, /32 dégâts dans le gréement \(28\/60\)/);
  assert.equal(eux.coque, eux.coqueMax);
  assert.equal(etatGreement(eux), "abime");
  assert.equal(vitesseEffective(eux), 7, "trois quarts de 10 cases, arrondi bas");
  assert.equal(modeManoeuvre(eux), -1, "gréement abîmé : désavantage aux tests de manœuvre");
  assert.equal(eux.moral, 6, "le Moral ne bouge pas tant que le gréement tient");
  const r2 = jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, viser: "greement" }, () => 0.7);
  assert.match(r2.texte, /Le gréement de Brigantin tombe/);
  assert.equal(etatGreement(eux), "tombe");
  assert.equal(eux.moral, 5, "le gréement qui tombe coûte 1 de Moral");
  assert.equal(vitesseEffective(eux), 5, "la moitié de 10 cases");
  assert.throws(() => jouerAction(pirates, eux, "esquive", canonniere, {}), /gréement est tombé/);
  assert.throws(() => jouerAction(pirates, eux, "vent", canonniere, {}), /gréement est tombé/);
  assert.throws(() => jouerAction(pirates, eux, "fuir", canonniere, { cible: nous }), /gréement est tombé/);
  // Le maître de manœuvre rétablit le gréement : 2d6 + Endurance (12 : +1).
  const maitre = { ...canonniere, id: "c4", name: "Dossou" } as Character;
  const rep = jouerAction(pirates, eux, "boucliers", maitre, {}, pipe(face(4, 6), face(5, 6)));
  assert.match(rep.texte, /rétablit le gréement de Brigantin : \+10 \(10\/60\)/);
  assert.equal(etatGreement(eux), "abime");
  assert.equal(vitesseEffective(eux), 7);
});

test("navires : virer de bord et prendre le vent suivent le Moral et le gréement", () => {
  const v = sloop();
  // Adresse +3, maîtrise +2 au niveau 3.
  jouerAction(pirates, v, "esquive", canonniere, {}, constant(10, 20));
  assert.equal(v.effets.esquive, 2, "10 + 5 = 15 : +2 CA");
  nouveauRound(v);
  jouerAction(pirates, v, "esquive", canonniere, {}, constant(14, 20));
  assert.equal(v.effets.esquive, 4, "14 + 5 = 19 : +4 CA");
  nouveauRound(v);
  const r = jouerAction(pirates, v, "vent", canonniere, {}, constant(10, 20));
  assert.equal(v.effets.vent, true);
  assert.equal(vitesseEffective(v), 15, "12 cases plus un quart");
  assert.match(r.texte, /gagne en vitesse/);
  nouveauRound(v);
  assert.equal(vitesseEffective(v), 12);
  // Moral à 8 ou plus : deux dés, le meilleur ; à 3 ou moins : le pire.
  v.moral = 9;
  const bon = jouerAction(pirates, v, "esquive", canonniere, {}, pipe(face(3, 20), face(18, 20)));
  assert.equal(bon.jets[0].rolls.length, 2);
  assert.equal(v.effets.esquive, 4, "le meilleur dé : 18 + 5");
  assert.match(bon.texte, /avec l'avantage/);
  v.moral = 2;
  const mauvais = jouerAction(pirates, v, "esquive", canonniere, {}, pipe(face(3, 20), face(18, 20)));
  assert.equal(v.effets.esquive, 0, "le pire dé : 3 + 5");
  assert.match(mauvais.texte, /avec le désavantage/);
  // Moral haut et gréement abîmé s'annulent.
  v.moral = 9;
  v.boucliers = Math.floor(v.bouclierMax / 2);
  assert.equal(modeManoeuvre(v), 0);
  v.moral = 6;
  assert.equal(modeManoeuvre(v), -1);
});

test("navires : le pierrier fauche des hommes, le Moral baisse de 1 au premier et de 1 de plus au-delà de cinq", () => {
  const nous = sloop();
  const eux = galion();
  // 15 + 4 + 3 = 22 contre CA 17 ; 2d8 : 6 + 6 = 12 points, soit 4 hommes.
  const r = jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 1 }, () => 0.701);
  assert.match(r.texte, /mitraille balaient le pont de Garde-côte/);
  assert.equal(eux.coque, eux.coqueMax, "le pierrier ne touche ni la coque ni le gréement");
  assert.equal(eux.hommes! + eux.perdus!, eux.hommesMax);
  const perdus = eux.perdus!;
  assert.ok(perdus >= 1);
  assert.equal(eux.moral, perdus > 5 ? 4 : 5, "−1 au premier homme perdu, −1 de plus au-delà de cinq");
  jouerAction(pirates, nous, "recharger", canonniere, { arme: 1 });
  jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 1 }, () => 0.9);
  assert.ok(eux.perdus! > 5);
  assert.equal(eux.moral, 4, "plus de cinq hommes perdus : −2 en tout");
  finDeCombat(eux);
  assert.equal(eux.perdus, 0);
  // Le compte repart : le prochain homme perdu coûte de nouveau 1 point.
  jouerAction(pirates, nous, "recharger", canonniere, { arme: 1 });
  jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 1 }, () => 0.7);
  assert.equal(eux.moral, 3);
});

test("navires : deux servants par canon, une portée en cases, une coque à zéro ne manœuvre plus", () => {
  const nous = sloop();
  const eux = galion();
  nous.hommes = 1;
  assert.throws(() => jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 0 }), /pas assez d'hommes/);
  nous.hommes = 3;
  const bordee = jouerAction(pirates, nous, "bordee", canonniere, { cible: eux, arme: 0 }, () => 0.7);
  assert.match(bordee.texte, /lâche la bordée/);
  assert.equal(nous.armes[0].chargees, 3, "trois hommes ne servent qu'une pièce de deux servants, même en bordée");
  nous.hommes = 40;
  assert.throws(() => jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 0, distance: 25 }), /hors de portée/);
  jouerAction(pirates, nous, "tirer", canonniere, { cible: eux, arme: 0, distance: 24 }, () => 0.5);
  assert.throws(() => jouerAction(pirates, nous, "tirer", canonniere, {}), /autre navire/);
  nous.coque = 0;
  assert.throws(() => jouerAction(pirates, nous, "esquive", canonniere, {}), /à la dérive/);
  assert.throws(() => jouerAction(pirates, nous, "recharger", canonniere, { arme: 0 }), /à la dérive/);
  const rep = jouerAction(pirates, nous, "reparer", canonniere, {}, constant(4, 8));
  assert.match(rep.texte, /aveugle les voies d'eau/);
  assert.match(rep.texte, /répond de nouveau à la barre/);
});

test("navires : fuir demande deux réussites avant la troisième touche", () => {
  const nous = sloop();
  const eux = galion();
  // DD = 12 + vitesse du poursuivant (6) − la nôtre (12), jamais sous 8.
  const un = jouerAction(pirates, nous, "fuir", canonniere, { cible: eux }, constant(12, 20));
  assert.match(un.texte, /contre DD 8\) : première réussite/);
  assert.deepEqual(nous.fuite, { reussites: 1, touches: 0 });
  // Un galion qui fuit un sloop : DD 12 + 12 − 6 = 18.
  const lent = galion();
  const sur = sloop("Poursuivant", "autre");
  const rate = jouerAction(pirates, lent, "fuir", canonniere, { cible: sur }, constant(10, 20));
  assert.match(rate.texte, /contre DD 18\) : raté/);
  // Les touches comptent : trois, et la fuite échoue.
  nous.fuite = { reussites: 1, touches: 0 };
  const poursuivant = sloop("Poursuivant", "autre");
  const t = jouerAction(pirates, poursuivant, "bordee", canonniere, { cible: nous }, () => 0.7);
  assert.match(t.texte, /La fuite de Pie-Noire échoue : trois touches/);
  assert.equal(nous.fuite, undefined);
  // Deux réussites : le navire décroche.
  const deux = sloop();
  jouerAction(pirates, deux, "fuir", canonniere, { cible: eux }, constant(12, 20));
  const fin = jouerAction(pirates, deux, "fuir", canonniere, { cible: eux }, constant(12, 20));
  assert.match(fin.texte, /décroche/);
  assert.equal(deux.fuite, undefined);
});

test("navires : grappins, couper les grappins, abordage", () => {
  const nous = sloop();
  const eux = galion();
  // Les grappins ne mordent qu'à 3 cases au plus ; le jet est d'Adresse (+3) avec la maîtrise (+2), DD 12.
  assert.throws(() => jouerAction(pirates, nous, "grappins", canonniere, { cible: eux, distance: 4 }), /trop loin/);
  const rate = jouerAction(pirates, nous, "grappins", canonniere, { cible: eux, distance: 3 }, constant(5, 20));
  assert.match(rate.texte, /retombent à l'eau/);
  assert.equal(nous.grappins, undefined);
  assert.throws(() => jouerAction(pirates, nous, "aborder", capitaine, { cible: eux }), /grappins ne tiennent pas/);
  const ok = jouerAction(pirates, nous, "grappins", canonniere, { cible: eux, distance: 2 }, constant(10, 20));
  assert.match(ok.texte, /Les deux navires sont accrochés/);
  assert.deepEqual([nous.grappins, eux.grappins], [eux.id, nous.id]);
  // Couper : Force (+0 ici), maîtrise +2, DD 12.
  const coupe = jouerAction(pirates, nous, "couper", canonniere, { cible: eux }, constant(12, 20));
  assert.match(coupe.texte, /coupe les grappins/);
  assert.deepEqual([nous.grappins, eux.grappins], [undefined, undefined]);
  jouerAction(pirates, nous, "grappins", canonniere, { cible: eux }, constant(10, 20));
  assert.throws(() => jouerAction(pirates, sloop(), "couper", canonniere, {}), /Aucun grappin/);
  // L'abordage est un coup de main : 1 de Moral, impossible à 1 ou moins ; il demande à la table de changer de carte.
  nous.moral = 1;
  assert.throws(() => jouerAction(pirates, nous, "aborder", capitaine, { cible: eux }), /ne suit plus/);
  nous.moral = 6;
  const ab = jouerAction(pirates, nous, "aborder", capitaine, { cible: eux });
  assert.deepEqual(ab.abordage, { avec: eux.id });
  assert.equal(nous.moral, 5);
  assert.match(ab.texte, /combat à pied/);
});

test("navires : la fiche suit le pion, les joueurs ne voient ni le Moral ni les hommes d'un autre équipage", () => {
  const nous = sloop();
  nous.notes = "NOTE-SECRETE : Le Goff doit de l'argent";
  const eux = galion();
  eux.cache = false;
  const cache = nouveauVaisseau("fregate", "Frégate cachée", "autre", pirates);
  const vue = vaisseauxPourJoueur([nous, eux, cache]);
  assert.equal(vue.length, 2);
  const json = JSON.stringify(vue);
  assert.ok(!json.includes("NOTE-SECRETE") && !json.includes("Frégate cachée"));
  assert.equal(vue[0].moral, 6, "le groupe voit le Moral de son propre navire");
  assert.equal(vue[0].hommes, 40);
  assert.deepEqual([vue[1].moral, vue[1].hommes, vue[1].perdus, vue[1].fuite], [undefined, undefined, undefined, undefined]);
  // Le pion suit la vitesse réelle : gréement abîmé, trois quarts.
  const t: Token = { id: "t1", name: "x", x: 1, y: 1, color: "#000", kind: "joueur" };
  nous.tokenId = "t1";
  nous.boucliers = 10;
  synchroniserPions({ tokens: [t], characters: [] }, nous);
  assert.equal(t.speed, 9);
  assert.equal(t.hp, nous.coque);
});

test("navires : l'import et la sauvegarde sont bornés, les pièces et l'équipage gardés", () => {
  const nous = sloop();
  nous.armes[0].chargees = 1;
  nous.moral = 3;
  nous.hommes = 22;
  nous.grappins = "v_autre";
  nous.fuite = { reussites: 1, touches: 2 };
  const [propre] = nettoyerVaisseaux([JSON.parse(JSON.stringify(nous))], pirates);
  assert.deepEqual([propre.armes[0].pieces, propre.armes[0].chargees, propre.armes[0].servants], [4, 1, 2]);
  assert.deepEqual([propre.moral, propre.hommes, propre.hommesMax], [3, 22, 40]);
  assert.equal(propre.grappins, "v_autre");
  assert.deepEqual(propre.fuite, { reussites: 1, touches: 2 });
  assert.equal(propre.armes[1].contre, "hommes");
  const [hors] = nettoyerVaisseaux([{ ...nous, moral: 99, hommes: 99999, hommesMax: 50, armes: [{ nom: "Canon", bonus: 3, degats: "4d10", portee: 24, pieces: 9999, chargees: 9999, servants: 99 }], fuite: { reussites: 9, touches: 9 } }], pirates);
  assert.equal(hors.moral, 10);
  assert.equal(hors.hommes, 50);
  assert.deepEqual([hors.armes[0].pieces, hors.armes[0].chargees, hors.armes[0].servants], [60, 60, 4]);
  assert.deepEqual(hors.fuite, { reussites: 1, touches: 2 });
  // Un modèle de navire reste un navire même si la partie a changé de genre ; un vaisseau n'a pas de Moral.
  const [garde] = nettoyerVaisseaux([JSON.parse(JSON.stringify(nous))], "science-fiction");
  assert.equal(garde.moral, 3);
  const [vaisseau] = nettoyerVaisseaux([{ modele: "cargo-leger", moral: 9, hommes: 9 }], "science-fiction");
  assert.equal(vaisseau.moral, undefined);
});
