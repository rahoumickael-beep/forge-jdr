// Rendu des cartes à graine fixe, pour comparer avant/après : node scripts/apercu-rendu.mjs [dossier] [types] [graine] [genre]
//   APERCU_PORT=5201 node scripts/apercu-rendu.mjs …  pour lancer plusieurs aperçus en parallèle
//   types : liste séparée par des virgules (donjon,caverne,nature,village par défaut)
// Pour chaque type : <type>-vue.png (carte entière réduite) et <type>-zoom.png (centre à taille réelle, 48 px par case).
import { spawn, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const OUT = process.argv[2] || "apercu";
const KINDS = (process.argv[3] || "donjon,caverne,nature,village").split(",");
const SEED = process.argv[4] || "391";
const GENRE = process.argv[5] || "fantasy";
const EXTRA = process.env.APERCU_QUERY ? `&${process.env.APERCU_QUERY}` : ""; // ex. APERCU_QUERY=pions=1
const PORT = Number(process.env.APERCU_PORT || 5199); // un port par personne qui capture en même temps
const win = process.platform === "win32";
mkdirSync(OUT, { recursive: true });

const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "inherit"], shell: win, detached: !win });
await new Promise((resolve) => vite.stdout.on("data", (d) => String(d).includes(String(PORT)) && resolve()));
const stop = () => {
  try {
    if (win) execSync(`taskkill /pid ${vite.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-vite.pid);
  } catch {}
};
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", (e) => console.log("erreur JS :", e.message));
  for (const kind of KINDS) {
    await page.goto(`http://localhost:${PORT}/apercu.html?kind=${kind}&seed=${SEED}&genre=${GENRE}${EXTRA}`);
    const info = await page.waitForFunction(() => window.apercu, null, { timeout: 120000 }).then((h) => h.jsonValue());
    const png = await page.locator("canvas").screenshot();
    const full = join(OUT, `${kind}-plein.png`);
    await sharp(png).toFile(full);
    await sharp(png).resize({ width: 1400 }).toFile(join(OUT, `${kind}-vue.png`));
    const left = Math.max(0, Math.round(info.width / 2 - 450));
    const top = Math.max(0, Math.round(info.height / 2 - 300));
    await sharp(png).extract({ left, top, width: Math.min(900, info.width), height: Math.min(600, info.height) }).toFile(join(OUT, `${kind}-zoom.png`));
    console.log(`${kind} : ${info.width}×${info.height} px, rendu en ${info.ms} ms`);
    const extra = await page.evaluate(() => window.pions);
    if (extra) console.log(`  pions : préparation ${extra.setup} ms, une image ${extra.frame} ms ${JSON.stringify(extra.steps ?? {})}`);
  }
} finally {
  await browser?.close();
  stop();
}
process.exit();
