import assert from "node:assert/strict";
import { test } from "node:test";
import { campagnePourJoueur, cloreSeance, nettoyerCampagne, noterFait, nouvelleCampagne, ouvrirSeance, preparerSeance, reglerJauge, reglerReserve, texteDePreparation } from "./campagne";
import { AUBRETERRE, nomsDuCanon } from "./canon";

test("campagne : une partie fantasy démarre avec le Sceau à 100 et une réputation par faction du canon", () => {
  const c = nouvelleCampagne("fantasy");
  assert.equal(c.jauge, 100);
  assert.deepEqual(Object.keys(c.reputations).sort(), AUBRETERRE.factions.map((f) => f.id).sort());
  assert.equal(nouvelleCampagne("contemporain").jauge, null, "un monde sans canon n'a pas de jauge");
  assert.equal(nouvelleCampagne("steampunk").jauge, 100, "le Pouls part à 100");
});

test("campagne : séances ouvertes et closes, « Précédemment » tiré du résumé", () => {
  const c = nouvelleCampagne("fantasy");
  noterFait(c, "hors séance");
  assert.equal(c.seances.length, 0);
  const { precedemment } = ouvrirSeance(c, 1);
  assert.equal(precedemment, "");
  assert.throws(() => ouvrirSeance(c, 2));
  noterFait(c, "Combat contre Levé.");
  noterFait(c, "Combat contre Levé.");
  assert.deepEqual(c.seances[0].faits, ["Combat contre Levé."], "pas de doublon d'affilée");
  cloreSeance(c, "Colin est ramené vivant à la loge.", 3);
  assert.throws(() => cloreSeance(c, "", 4));
  const s2 = ouvrirSeance(c, 5);
  assert.equal(s2.seance.numero, 2);
  assert.equal(s2.precedemment, "Colin est ramené vivant à la loge.");
});

test("campagne : la jauge annonce chaque seuil franchi vers le bas, une seule fois", () => {
  const c = nouvelleCampagne("fantasy");
  assert.deepEqual(reglerJauge(c, 80, AUBRETERRE), []);
  assert.deepEqual(reglerJauge(c, 49, AUBRETERRE).map((s) => s.valeur), [75, 50]);
  assert.deepEqual(reglerJauge(c, 60, AUBRETERRE), []);
  assert.deepEqual(reglerJauge(c, -10, AUBRETERRE).map((s) => s.valeur), [50, 25, 0]);
  assert.equal(c.jauge, 0);
  reglerReserve(c, 9, AUBRETERRE);
  assert.equal(c.reserve, 6, "plafond des Murmures");
});

test("campagne : la vue joueur ne garde rien de secret", () => {
  const c = nouvelleCampagne("fantasy");
  c.fils.push({ id: "f1", texte: "SECRET-FIL", ouvert: true, secret: true, seance: 1 }, { id: "f2", texte: "Qui a arraché les clous ?", ouvert: true, secret: false, seance: 1 });
  c.pnj.push({ id: "n1", nom: "Hubert Lescot", attitude: -1, public: "Le passeur, aimable.", secret: "SECRET-PNJ" });
  c.reserve = 4;
  c.preparation = "SECRET-PREPA";
  const vue = campagnePourJoueur(c);
  const json = JSON.stringify(vue);
  assert.ok(!json.includes("SECRET"));
  assert.equal(vue.jauge, null, "Sceau caché par défaut");
  assert.equal(vue.reserve, 0);
  assert.equal(vue.fils.length, 1);
  c.jaugeVisible = true;
  assert.equal(campagnePourJoueur(c).jauge, 100);
});

test("campagne : un fichier abîmé ou hostile donne une campagne propre", () => {
  const c = nettoyerCampagne({ jauge: 900, reserve: -3, reputations: { confrerie: 12, inconnue: 3 }, fils: [{ id: 3 }, { id: "f", texte: "x".repeat(900) }], pnj: "rien", seances: [{ resume: 4, faits: [1, "a"] }] }, "fantasy");
  assert.equal(c.jauge, 100);
  assert.equal(c.reserve, 0);
  assert.equal(c.reputations.confrerie, 3);
  assert.ok(!("inconnue" in c.reputations));
  assert.equal(c.fils.length, 1);
  assert.equal(c.fils[0].texte.length, 500);
  assert.deepEqual(c.pnj, []);
  assert.deepEqual(c.seances[0].faits, ["a"]);
  assert.deepEqual(nettoyerCampagne(undefined, "fantasy"), nouvelleCampagne("fantasy"));
});

test("préparation : fils, PNJ, factions amies, Sceau, accroches du palier et rencontre prête", () => {
  const c = nouvelleCampagne("fantasy");
  ouvrirSeance(c, 1);
  cloreSeance(c, "Le passeur est démasqué.", 2);
  c.fils.push({ id: "f", texte: "La carte de Colin", ouvert: true, secret: false, seance: 1 }, { id: "g", texte: "Réglé", ouvert: false, secret: false, seance: 1 });
  c.pnj.push({ id: "n", nom: "Mère Gisle", attitude: 2, public: "", secret: "Elle sait lire l'ancienne langue." });
  c.reputations.confrerie = 3;
  c.reputations.peseurs = 1;
  reglerJauge(c, 70, AUBRETERRE);
  const p = preparerSeance({ genre: "fantasy", level: 6, campagne: c });
  assert.equal(p.numero, 2);
  assert.equal(p.precedemment, "Le passeur est démasqué.");
  assert.deepEqual(p.fils.map((f) => f.id), ["f"]);
  assert.deepEqual(p.factions.map((f) => f.nom), ["La Confrérie du Dernier Clou"]);
  assert.equal(p.jauge?.prochain?.valeur, 50);
  assert.match(p.jauge!.effet, /une nuit au lieu de trois/);
  assert.deepEqual(p.accroches.map((a) => a.titre), ["La tour sans porte", "Le rouleau de la nuit du Glas", "Le siège de Clairfont"]);
  assert.ok(p.rencontre && p.rencontre.enemies.length > 0);
  const texte = texteDePreparation(p);
  assert.match(texte, /Mère Gisle \(allié, fortement\)/);
  assert.match(texte, /Prochain seuil à 50/);
});

test("canon : chaque accroche de campagne tient à des factions connues et couvre les niveaux 1 à 20", () => {
  const ids = new Set(AUBRETERRE.factions.map((f) => f.id));
  const accroches = AUBRETERRE.campagne!.accroches;
  for (const a of accroches) assert.ok(a.factions.length && a.factions.every((f) => ids.has(f)), a.titre);
  for (let n = 1; n <= 20; n++) assert.ok(accroches.some((a) => n >= a.niveaux[0] && n <= a.niveaux[1]), `niveau ${n}`);
  const lieux = new Set(nomsDuCanon(AUBRETERRE));
  assert.ok(lieux.has("Gué-Saulnier") && lieux.has("Clairfont"));
});
