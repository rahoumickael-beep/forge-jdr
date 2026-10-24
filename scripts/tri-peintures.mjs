// Tri des peintures d'un monde : chaque sujet du lot sort en 4 variantes dans ComfyUI.
//   node scripts/tri-peintures.mjs planches <monde>         → comfyui/sorties/<monde>/tri/<id>.jpg (2×2, lettres A à D) + a-trier.md
//   node scripts/tri-peintures.mjs poser <monde> choix.json  → content/<monde>/illustrations/<id>.jpg ({ "<id>": "B", ... })
// Le bas de chaque image est recadré de 9 % (fausses signatures de Flux).
// Dossier de sortie de ComfyUI : COMFY_OUTPUT, sinon celui de Pinokio.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [mode, monde, fichierChoix] = process.argv.slice(2);
if (!["planches", "poser"].includes(mode) || !monde) {
  console.error("Usage : node scripts/tri-peintures.mjs planches|poser <monde> [choix.json]");
  process.exit(1);
}
const SORTIE_COMFY = join(process.env.COMFY_OUTPUT ?? "C:/pinokio/api/comfy.git/app/output", monde);
const lot = JSON.parse(readFileSync(`comfyui/lot-${monde}.json`, "utf8"));
const LETTRES = ["A", "B", "C", "D"];

/** Les 4 variantes d'un sujet, dans l'ordre de sortie de ComfyUI. */
function variantes(id) {
  return readdirSync(SORTIE_COMFY)
    .filter((f) => f.startsWith(`${id}_`) && /_\d+_\.png$/.test(f))
    .sort()
    .slice(-4)
    .map((f) => join(SORTIE_COMFY, f));
}

async function recadree(fichier) {
  const { width, height } = await sharp(fichier).metadata();
  return sharp(fichier).extract({ left: 0, top: 0, width, height: Math.round(height * 0.91) });
}

if (mode === "planches") {
  const dossier = `comfyui/sorties/${monde}/tri`;
  mkdirSync(dossier, { recursive: true });
  const liste = [`# Tri des peintures : ${monde}`, ""];
  for (const job of lot) {
    const fichiers = variantes(job.id);
    if (fichiers.length < 4) {
      console.warn(`${job.id} : ${fichiers.length} variante(s) seulement`);
      if (!fichiers.length) continue;
    }
    const w = 512;
    const h = Math.round((w * (job.height ?? 1344) * 0.91) / (job.width ?? 1024));
    const cases = await Promise.all(
      fichiers.map(async (f, i) => {
        const img = await (await recadree(f)).resize(w, h).toBuffer();
        const lettre = Buffer.from(
          `<svg width="${w}" height="${h}"><rect x="8" y="8" width="44" height="44" fill="black" opacity="0.7"/><text x="30" y="42" font-size="32" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">${LETTRES[i]}</text></svg>`,
        );
        return { input: await sharp(img).composite([{ input: lettre }]).toBuffer(), left: (i % 2) * w, top: Math.floor(i / 2) * h };
      }),
    );
    await sharp({ create: { width: 2 * w, height: 2 * h, channels: 3, background: "#000" } })
      .composite(cases)
      .jpeg({ quality: 82 })
      .toFile(join(dossier, `${job.id}.jpg`));
    liste.push(`## ${job.id}`, `Planche : ${dossier}/${job.id}.jpg`, `Prompt : ${job.prompt}`, "");
  }
  writeFileSync(join(dossier, "a-trier.md"), liste.join("\n"));
  console.log(`${lot.length} planches dans ${dossier}, liste dans ${dossier}/a-trier.md`);
} else {
  const choix = JSON.parse(readFileSync(fichierChoix, "utf8"));
  const dest = `content/${monde}/illustrations`;
  mkdirSync(dest, { recursive: true });
  for (const [id, lettre] of Object.entries(choix)) {
    const f = variantes(id)[LETTRES.indexOf(String(lettre).trim().toUpperCase())];
    if (!f || !existsSync(f)) {
      console.warn(`${id} : variante ${lettre} introuvable`);
      continue;
    }
    await (await recadree(f)).jpeg({ quality: 90, mozjpeg: true }).toFile(join(dest, `${id}.jpg`));
  }
  console.log(`${Object.keys(choix).length} peintures posées dans ${dest}`);
}
