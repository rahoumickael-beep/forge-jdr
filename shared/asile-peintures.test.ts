// Cartes à collectionner et peintures du Champ-d'Asile : canon, secrets, anachronismes, règles Flux.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAMP_D_ASILE, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { PEINTURES_ASILE } from "./canon/asile-peintures";
import { catalogue } from "./collection";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const cartes = catalogue("western");
const trahit = (t: string) => CHAMP_D_ASILE.secrets.find((s) => t.includes(s));

test("champ-d'asile : cartes à collectionner sans secret, sans anachronisme, avec des noms du canon", () => {
  for (const c of cartes) {
    for (const t of [c.nom, c.texte, c.usage]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret`);
      assert.deepEqual(anachronismesDans(t, CHAMP_D_ASILE), [], `${c.id} : anachronisme`);
      assert.deepEqual(datesImpossibles(t, CHAMP_D_ASILE), [], `${c.id} : date`);
      assert.ok(!/au-delà/i.test(t), `${c.id} : mot interdit`);
    }
    assert.deepEqual(nomsInconnus(`${c.nom}. ${c.texte} ${c.usage}`, CHAMP_D_ASILE), [], `${c.id} : nom hors du canon`);
  }
});

test("champ-d'asile : sujets des peintures en anglais, lumière en tête, ni négation ni anachronisme ni caricature", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["western"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  for (const [id, p] of Object.entries(PEINTURES_ASILE)) {
    for (const t of [p.lumiere, p.sujet]) {
      assert.ok(!/[àâçéèêëîïôûùœ]/i.test(t), `${id} : pas en anglais`);
      assert.ok(!negation.test(t), `${id} : négation`);
      assert.ok(!interdit.test(t), `${id} : ${t.match(interdit)?.[0]}`);
      assert.ok(!/\b(feathers?|feathered)\b/i.test(t), `${id} : coiffe de plumes`);
    }
    assert.ok(p.lumiere.length > 10 && p.sujet.length > 80, `${id} : trop court`);
    assert.equal(trahit(p.sujet), undefined, `${id} : secret`);
  }
});
