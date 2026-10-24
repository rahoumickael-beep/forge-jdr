// Cartes à collectionner et peintures de l'Exposition éternelle : canon, secrets, anachronismes, règles Flux, personnes respectées.
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPOSITION, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { PEINTURES_EXPO } from "./canon/expo-peintures";
import { catalogue } from "./collection";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const cartes = catalogue("steampunk");
const trahit = (t: string) => EXPOSITION.secrets.find((s) => t.includes(s));
// Les caractéristiques du monde, que le contrôle des noms propres ne connaît pas encore.
const CARACS = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"];
// Ce que le jeu garde caché aux joueurs, en plus de la liste du canon.
const CACHES = ["Dormeuse", "Fosse", "Veilleur", "Veilleurs", "Sujet", "pièce mère", "pièces mères", "Panne", "Pannes", "trust", "Nuit du Siècle"];

test("expo : cartes à collectionner sans secret, sans anachronisme, avec des noms du canon", () => {
  assert.equal(cartes.length, 30);
  for (const c of cartes) {
    for (const t of [c.nom, c.texte, c.usage]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret`);
      assert.deepEqual(anachronismesDans(t, EXPOSITION), [], `${c.id} : anachronisme`);
      assert.deepEqual(datesImpossibles(t, EXPOSITION), [], `${c.id} : date`);
      assert.ok(!/au-delà/i.test(t), `${c.id} : mot interdit`);
      for (const mot of CACHES) assert.ok(!new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, "iu").test(t), `${c.id} : « ${mot} » est caché aux joueurs`);
    }
    assert.deepEqual(nomsInconnus(`${c.nom}. ${c.texte} ${c.usage}`, EXPOSITION, CARACS), [], `${c.id} : nom hors du canon`);
  }
});

test("expo : aucune carte ne fait d'une personne un objet, un prix ou une récompense", () => {
  const prix = /\b(engagés?|engagées?|captifs?|prisonniers?|indigènes?|sauvages?)\b[^.]*\b(francs?|centimes?|prix|vaut|vendre|vendu|acheter|louer|loué|attraction|spectacle)\b/i;
  for (const c of cartes) {
    const t = `${c.nom}. ${c.texte} ${c.usage}`;
    assert.ok(!/\b(esclaves?|zoo humain|indigènes?|sauvages?|exotiques?)\b/i.test(t), `${c.id} : les Villages ne sont pas un décor de carte`);
    assert.ok(!prix.test(t), `${c.id} : une personne n'a pas de prix`);
    if (c.famille === "allie") assert.ok(/refuse|demande|ne |n'|pas|quitte/i.test(c.usage), `${c.id} : un allié a son mot à dire`);
  }
});

test("expo : sujets des peintures en anglais, lumière en tête, ni négation, ni anachronisme, ni personne réelle, ni spectacle", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["steampunk"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const cliches = /\b(goggles|top hat and goggles|cogs? everywhere|victorian airship pirates?|loincloth|savages?|tribal|natives?|exotic|primitive|zoo|freak ?show|in chains|chained|shackles?|cage[sd]? (people|man|woman|children))\b/i;
  const ids = Object.keys(PEINTURES_EXPO);
  assert.ok(ids.includes("couverture-joueurs") && ids.includes("couverture-mj") && ids.includes("couverture-bestiaire"));
  for (const [id, p] of Object.entries(PEINTURES_EXPO)) {
    for (const t of [p.lumiere, p.sujet]) {
      assert.ok(!/[àâçéèêëîïôûùœ]/i.test(t), `${id} : pas en anglais`);
      assert.ok(!negation.test(t), `${id} : négation`);
      assert.ok(!interdit.test(t), `${id} : ${t.match(interdit)?.[0]}`);
      assert.ok(!cliches.test(t), `${id} : cliché ${t.match(cliches)?.[0]}`);
    }
    assert.ok(p.lumiere.length > 10 && p.sujet.length > 80, `${id} : trop court`);
    assert.equal(trahit(p.sujet), undefined, `${id} : secret`);
    for (const mot of ["dormeuse", "sleeper", "mother piece", "foundry of", "night of the century", "veilleur"]) assert.ok(!p.sujet.toLowerCase().includes(mot), `${id} : ${mot}`);
  }
});
