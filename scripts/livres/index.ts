// Fabrique les livres d'un monde en PDF (Aubreterre par défaut).
// npx tsx scripts/livres/index.ts [joueurs|mj|bestiaire|tout] [dossier de sortie] [--monde=archipel] [--hd]
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { BESTIARY, illustrationSeed } from "../../shared/bestiary";
import { bestiaire } from "./bestiaire";
import { livreDesJoueurs } from "./joueurs";
import { guideMj } from "./mj";
import { fabriquer, type Livre } from "./moteur";
import { MONDE } from "./monde";
import { illustrationsDemandees } from "./texte";

const quoi = process.argv[2] || "tout";
const out = resolve(process.argv[3] || "dist-livre");
const LIVRES: Record<string, () => Livre | Promise<Livre>> = { joueurs: livreDesJoueurs, mj: guideMj, bestiaire };

for (const [id, faire] of Object.entries(LIVRES)) {
  if (quoi !== "tout" && quoi !== id) continue;
  await fabriquer(await faire(), out);
}
// Lot de prompts pour comfyui/generer.mjs : toutes les planches que les livres attendent.
// Graine tirée de l'id : une planche garde la même graine d'une fabrication à l'autre.
const lot = [...illustrationsDemandees.values()].map((x) => ({ ...x, seed: illustrationSeed(x.id) }));
writeFileSync(join(out, "illustrations-a-peindre.json"), JSON.stringify(lot, null, 2));
console.log(`${lot.length} planches attendues → ${join(out, "illustrations-a-peindre.json")}`);
if (quoi === "tout") {
  // Les créatures ont leur propre lot (comfyui/prompts-bestiaire.json) ; ici, le reste des livres.
  const creatures = new Set(BESTIARY.map((c) => c.id));
  const livres = lot.filter((x) => !creatures.has(x.id));
  // Un lot par monde : comfyui/prompts-livres.json (Aubreterre), comfyui/prompts-<monde>-livres.json (les autres).
  const lotLivres = MONDE.id === "aubreterre" ? "comfyui/prompts-livres.json" : `comfyui/prompts-${MONDE.id}-livres.json`;
  writeFileSync(resolve(lotLivres), JSON.stringify(livres, null, 2) + "\n");
  console.log(`${livres.length} planches hors bestiaire → ${lotLivres}`);
}
