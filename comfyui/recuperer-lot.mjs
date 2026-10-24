// Récupère d'un coup les images d'un lot de tâches ComfyUI terminées, comme comfyui_recuperer (bas recadré de 9 %),
// et fait une planche-contact par sujet pour choisir la variante.
// node comfyui/recuperer-lot.mjs <fichier « nom id » par ligne> <dossier de sortie> [adresse de ComfyUI]
// Les lignes vides ou qui commencent par # sont ignorées ; une tâche pas encore terminée est signalée et sautée.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [liste, sortie, base = "http://127.0.0.1:8188"] = process.argv.slice(2);
if (!liste || !sortie) {
  console.error("Usage : node comfyui/recuperer-lot.mjs ids.txt comfyui/sorties/dossier [adresse]");
  process.exit(1);
}
const COUPE = 0.09;
mkdirSync(join(sortie, "planches"), { recursive: true });
const lignes = readFileSync(liste, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
let pret = 0;
for (const ligne of lignes) {
  const [nom, id] = ligne.split(/\s+/);
  const h = (await (await fetch(`${base}/history/${encodeURIComponent(id)}`)).json())[id];
  const images = Object.values(h?.outputs ?? {}).flatMap((o) => o.images ?? []);
  if (!images.length) {
    console.log(`${nom} : pas encore terminé`);
    continue;
  }
  const tuiles = [];
  for (const [i, img] of images.entries()) {
    const params = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
    const png = Buffer.from(await (await fetch(`${base}/view?${params}`)).arrayBuffer());
    const { width, height } = await sharp(png).metadata();
    const coupe = await sharp(png).extract({ left: 0, top: 0, width, height: Math.round(height * (1 - COUPE)) }).png().toBuffer();
    writeFileSync(join(sortie, `${nom}-${i + 1}.png`), coupe);
    tuiles.push(await sharp(coupe).resize(360, 360, { fit: "inside" }).toBuffer());
  }
  // Planche : les variantes côte à côte, numérotées dans l'ordre des fichiers.
  const metas = await Promise.all(tuiles.map((t) => sharp(t).metadata()));
  const largeur = metas.reduce((s, m) => s + m.width + 8, -8);
  const hauteur = Math.max(...metas.map((m) => m.height));
  let x = 0;
  const calques = tuiles.map((t, i) => {
    const c = { input: t, left: x, top: 0 };
    x += metas[i].width + 8;
    return c;
  });
  await sharp({ create: { width: largeur, height: hauteur, channels: 3, background: "#ffffff" } }).composite(calques).jpeg({ quality: 80 }).toFile(join(sortie, "planches", `${nom}.jpg`));
  pret++;
}
console.log(`${pret} sujet(s) récupéré(s) dans ${sortie}, planches dans ${join(sortie, "planches")}.`);
