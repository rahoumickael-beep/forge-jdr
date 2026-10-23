// Agrandit les illustrations pour l'impression à 300 dpi (à exécuter sur ton PC, ComfyUI démarré).
// node comfyui/agrandir.mjs [http://127.0.0.1:8188]
// Modèle : RealESRGAN_x4plus.pth dans ComfyUI/models/upscale_models (licence BSD, usage commercial permis).
// Chaque image de content/aubreterre/illustrations passe par le modèle (×4), est ramenée à couvrir une page A4 à 300 dpi (2480 × 3508 px)
// et enregistrée en JPEG dans content/aubreterre/illustrations-hd, hors du dépôt Git.
// Une image déjà agrandie et plus récente que l'originale est sautée.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";
import sharp from "sharp";

const base = process.argv[2] || "http://127.0.0.1:8188";
const SRC = new URL("../content/aubreterre/illustrations/", import.meta.url);
const DST = new URL("../content/aubreterre/illustrations-hd/", import.meta.url);
const A4 = { width: 2480, height: 3508 }; // A4 à 300 dpi
mkdirSync(DST, { recursive: true });
const workflow = JSON.parse(readFileSync(new URL("./agrandir-api.json", import.meta.url), "utf8"));
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const fichiers = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
let faits = 0;
for (const f of fichiers) {
  const id = basename(f, extname(f));
  const src = new URL(f, SRC);
  const dst = new URL(`${id}.jpg`, DST);
  if (existsSync(dst) && statSync(dst).mtimeMs > statSync(src).mtimeMs) continue;

  // 1. Envoi de l'image dans le dossier input de ComfyUI.
  const form = new FormData();
  form.append("image", new Blob([readFileSync(src)]), f);
  form.append("subfolder", "aubreterre");
  form.append("overwrite", "true");
  const up = await fetch(`${base}/upload/image`, { method: "POST", body: form });
  if (!up.ok) {
    console.error(`${id} : envoi refusé (${up.status})`);
    continue;
  }
  const { name, subfolder } = await up.json();

  // 2. Agrandissement ×4 par le modèle.
  const wf = structuredClone(workflow);
  wf["1"].inputs.image = subfolder ? `${subfolder}/${name}` : name;
  wf["4"].inputs.filename_prefix = `aubreterre-hd/${id}`;
  const res = await fetch(`${base}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: wf }) });
  if (!res.ok) {
    console.error(`${id} : ComfyUI a refusé (${res.status}) ${await res.text()}`);
    continue;
  }
  const { prompt_id } = await res.json();

  // 3. Attente du résultat, puis mise à la taille d'impression.
  let image;
  for (let essai = 0; essai < 600 && !image; essai++) {
    await attendre(1000);
    const h = await (await fetch(`${base}/history/${prompt_id}`)).json();
    image = h[prompt_id]?.outputs?.["4"]?.images?.[0];
  }
  if (!image) {
    console.error(`${id} : pas de résultat après 10 minutes`);
    continue;
  }
  const q = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
  const png = Buffer.from(await (await fetch(`${base}/view?${q}`)).arrayBuffer());
  writeFileSync(dst, await sharp(png).resize({ ...A4, fit: "outside" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
  faits++;
  console.log(`${id} : agrandie`);
}
console.log(`${faits} image(s) agrandie(s) → content/aubreterre/illustrations-hd. Puis : npm run livres:impression`);
