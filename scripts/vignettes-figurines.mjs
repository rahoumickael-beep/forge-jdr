// Vignettes rondes des pions-figurines (un portrait carré de 256 px par créature du bestiaire et par classe)
// et illustrations des cartes de rencontre. Vignettes :
// recadré sur la zone la plus marquante de l'illustration, puis resserré sur le buste (le haut du centre) :
// dans un pion de 40 px, une silhouette en pied ne se lit pas. node scripts/vignettes-figurines.mjs [--refaire]
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

// Une source par monde ; les ids des créatures ne se recoupent pas d'un monde à l'autre (testé).
const SOURCES = ["content/aubreterre/illustrations", "content/archipel/illustrations", "content/residence/illustrations"].filter((d) => existsSync(d));
// Créatures dont le vrai nom trahit un secret : le fichier public prend le nom public (fichierCreature dans shared/bestiary.ts,
// shared/bestiary.test.ts vérifie la concordance). L'adresse d'une image arrive chez les joueurs.
const ALIAS = {
  "bouche-de-gorvan": "bouche-du-dessous",
  "dent-du-mangeur": "dent-du-dessous",
  "langue-de-gorvan": "langue-du-dessous",
  "main-de-gorvan": "main-du-dessous",
  "gorvan-fragment": "ce-qui-attend-en-bas",
  "celui-qui-s-est-leve": "la-silhouette-de-cendrine",
  "gerance": "le-nouveau-gestionnaire",
};
const nomPublic = (f) => (ALIAS[f.replace(/\.jpg$/, "")] ?? f.replace(/\.jpg$/, "")) + ".webp";
const SORTIE = "client/public/pions";
mkdirSync(SORTIE, { recursive: true });
const garder = (f) => !/^(couverture|joueurs|mj|famille|scenario|origine|region|figure)-/.test(f);
let n = 0;
for (const SOURCE of SOURCES) for (const f of readdirSync(SOURCE).filter((f) => f.endsWith(".jpg") && garder(f) && !f.startsWith("carte-"))) {
  const dest = `${SORTIE}/${nomPublic(f)}`;
  if (existsSync(dest) && !process.argv.includes("--refaire")) continue;
  const carre = await sharp(`${SOURCE}/${f}`).resize(512, 512, { fit: "cover", position: sharp.strategy.attention }).toBuffer();
  await sharp(carre).extract({ left: 96, top: 36, width: 320, height: 320 }).resize(256, 256).webp({ quality: 74 }).toFile(dest);
  n++;
}
console.log(`${n} vignette(s) écrite(s) dans ${SORTIE}.`);

// Illustrations des cartes : format portrait, plein cadre, une par créature et par classe (cartes d'alliés).
const CARTES = "client/public/cartes";
mkdirSync(CARTES, { recursive: true });
let k = 0;
for (const SOURCE of SOURCES) for (const f of readdirSync(SOURCE).filter((f) => f.endsWith(".jpg") && garder(f))) {
  const dest = `${CARTES}/${nomPublic(f)}`;
  if (existsSync(dest) && !process.argv.includes("--refaire")) continue;
  await sharp(`${SOURCE}/${f}`).resize(600, 760, { fit: "cover", position: sharp.strategy.attention }).webp({ quality: 78 }).toFile(dest);
  k++;
}
console.log(`${k} illustration(s) de carte écrite(s) dans ${CARTES}.`);
