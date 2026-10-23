// Vignettes rondes des pions-figurines : un portrait carré de 256 px par créature du bestiaire et par classe,
// recadré sur la zone la plus marquante de l'illustration, puis resserré sur le buste (le haut du centre) :
// dans un pion de 40 px, une silhouette en pied ne se lit pas. node scripts/vignettes-figurines.mjs [--refaire]
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

const SOURCE = "content/aubreterre/illustrations";
const SORTIE = "client/public/pions";
mkdirSync(SORTIE, { recursive: true });
const garder = (f) => !/^(couverture|joueurs|mj|famille|scenario|origine)-/.test(f);
let n = 0;
for (const f of readdirSync(SOURCE).filter((f) => f.endsWith(".jpg") && garder(f))) {
  const dest = `${SORTIE}/${f.replace(/\.jpg$/, ".webp")}`;
  if (existsSync(dest) && !process.argv.includes("--refaire")) continue;
  const carre = await sharp(`${SOURCE}/${f}`).resize(512, 512, { fit: "cover", position: sharp.strategy.attention }).toBuffer();
  await sharp(carre).extract({ left: 96, top: 36, width: 320, height: 320 }).resize(256, 256).webp({ quality: 74 }).toFile(dest);
  n++;
}
console.log(`${n} vignette(s) écrite(s) dans ${SORTIE}.`);
