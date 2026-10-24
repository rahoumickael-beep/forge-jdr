// Cartes à collectionner et peintures des Îles du Vent : canon, secrets, anachronismes, règles Flux, clichés refusés.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ILES_DU_VENT, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { PEINTURES_ILES } from "./canon/iles-peintures";
import { catalogue } from "./collection";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const cartes = catalogue("pirates");
const trahit = (t: string) => ILES_DU_VENT.secrets.find((s) => t.includes(s));
// Les caractéristiques du monde (shared/iles-regles.ts), que le contrôle des noms propres ne connaît pas encore.
const CARACS = ["Adresse", "Endurance", "Savoir", "Instinct", "Présence"];
// Ce que le jeu garde caché aux joueurs, en plus de la liste du canon.
const CACHES = ["Santa Clara", "Larrañaga", "Matanzas", "croix rouge", "faux", "fausse", "fausses", "Madrid", "Gênes", "registre", "petite-fille", "porte-bonheur"];

test("îles du vent : cartes à collectionner sans secret, sans anachronisme, avec des noms du canon", () => {
  for (const c of cartes) {
    for (const t of [c.nom, c.texte, c.usage]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret`);
      assert.deepEqual(anachronismesDans(t, ILES_DU_VENT), [], `${c.id} : anachronisme`);
      assert.deepEqual(datesImpossibles(t, ILES_DU_VENT), [], `${c.id} : date`);
      assert.ok(!/au-delà/i.test(t), `${c.id} : mot interdit`);
      for (const mot of CACHES) assert.ok(!new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, "iu").test(t), `${c.id} : « ${mot} » est caché aux joueurs`);
    }
    assert.deepEqual(nomsInconnus(`${c.nom}. ${c.texte} ${c.usage}`, ILES_DU_VENT, CARACS), [], `${c.id} : nom hors du canon`);
  }
});

test("îles du vent : aucune carte ne fait d'une personne un objet, un prix ou une récompense", () => {
  const prix = /\b(esclaves?|captifs?|captives?|prisonniers?|plongeurs?|plongeuses?)\b[^.]*\b(piastres?|réaux?|livres?|prix|vaut|vendre|vendu|acheter|butin|prise)\b/i;
  for (const c of cartes) {
    const t = `${c.nom}. ${c.texte} ${c.usage}`;
    assert.ok(!/\b(esclaves?|traite|négrier|négriers)\b/i.test(t), `${c.id} : l'esclavage n'est pas un décor de carte`);
    assert.ok(!prix.test(t), `${c.id} : une personne n'a pas de prix`);
    if (c.famille === "allie") assert.ok(/refuse|demande|ne |n'|pas|quitte/i.test(c.usage), `${c.id} : un allié a son mot à dire`);
  }
});

test("îles du vent : sujets des peintures en anglais, lumière en tête, ni négation, ni anachronisme, ni cliché de cinéma", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["pirates"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const cliches = /\b(jolly roger|skull|crossbones|parrots?|peg ?legs?|wooden legs?|eye ?patch|treasure|buried|walk the plank|plank walking|cutlass between (his|her) teeth|in chains|chained|shackles?|whips?|whipped|slave ships?|slaves?|captives? in)\b/i;
  const ids = Object.keys(PEINTURES_ILES);
  assert.ok(ids.includes("couverture-joueurs") && ids.includes("couverture-mj") && ids.includes("couverture-bestiaire"));
  for (const [id, p] of Object.entries(PEINTURES_ILES)) {
    for (const t of [p.lumiere, p.sujet]) {
      assert.ok(!/[àâçéèêëîïôûùœ]/i.test(t), `${id} : pas en anglais`);
      assert.ok(!negation.test(t), `${id} : négation`);
      assert.ok(!interdit.test(t), `${id} : ${t.match(interdit)?.[0]}`);
      assert.ok(!cliches.test(t), `${id} : cliché ${t.match(cliches)?.[0]}`);
    }
    assert.ok(p.lumiere.length > 10 && p.sujet.length > 80, `${id} : trop court`);
    assert.equal(trahit(p.sujet), undefined, `${id} : secret`);
    for (const mot of ["Santa Clara", "Matanzas", "red cross", "fake coin", "false coin", "forged"]) assert.ok(!p.sujet.toLowerCase().includes(mot.toLowerCase()), `${id} : ${mot}`);
  }
});
