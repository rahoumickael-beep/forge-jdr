// Vraie table SF : un MJ et une joueuse, carte d'espace, le cargo du groupe et une corvette ennemie, un poste tenu, un tir.
// Usage : npm run build && node scripts/apercu-vaisseaux.mjs [dossier]
// Captures : vaisseaux-mj.png, vaisseaux-joueur.png, vaisseaux-mobile.png. Toute erreur JS fait échouer le script.
import { execSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const PORT = Number(process.env.APERCU_PORT || 3997);
const URL = `http://localhost:${PORT}`;
const OUT = process.argv[2] || ".";
const win = process.platform === "win32";
mkdirSync(OUT, { recursive: true });
const server = spawn("npx", ["tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: mkdtempSync(join(tmpdir(), "forge-")) },
  stdio: ["ignore", "pipe", "inherit"],
  shell: win,
  detached: !win,
});
await new Promise((resolve) => server.stdout.on("data", (d) => String(d).includes("prête") && resolve()));
const fail = (msg) => {
  console.error("ÉCHEC :", msg);
  process.exitCode = 1;
};
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const gm = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  gm.setDefaultTimeout(15000);
  gm.on("pageerror", (e) => fail(`erreur JS côté MJ : ${e.message}`));
  gm.on("console", (m) => m.type() === "error" && fail(`console MJ : ${m.text()}`));
  await gm.goto(URL);
  await gm.fill("#pseudo", "MJ");
  await gm.getByRole("button", { name: /Science-fiction/ }).click();
  await gm.getByRole("button", { name: "Ouvrir la table" }).click();
  await gm.getByRole("tab", { name: "Carte" }).click();
  await gm.selectOption("#map-kind", "espace");
  await gm.getByRole("button", { name: "Poser sur la table" }).click();
  await gm.waitForTimeout(600);
  const code = (await gm.locator(".code-chip").textContent()).trim();

  const pl = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  pl.setDefaultTimeout(15000);
  pl.on("pageerror", (e) => fail(`erreur JS côté joueur : ${e.message}`));
  pl.on("console", (m) => m.type() === "error" && fail(`console joueur : ${m.text()}`));
  await pl.goto(`${URL}/?partie=${code}`);
  await pl.fill("#pseudo", "Léa");
  await pl.getByRole("button", { name: "S'asseoir à la table" }).click();
  await pl.getByRole("button", { name: "Tirer un personnage" }).click();
  await pl.fill("#pj-nom", "Soline");
  await pl.getByRole("button", { name: "C'est mon personnage" }).click();
  await pl.waitForTimeout(400);

  // Le MJ sort le cargo du groupe et une corvette, montre la corvette et pose les deux.
  const mj = (e, p) => gm.evaluate(([e, p]) => window.__forgeSend(e, p), [e, p]);
  await mj("vaisseau:creer", { modele: "cargo-leger", nom: "Pie-Grièche", equipage: "groupe" });
  await mj("vaisseau:creer", { modele: "corvette-de-douane", nom: "Corvette de douane", equipage: "autre" });
  await gm.waitForTimeout(300);
  const vs = await gm.evaluate(() => window.__forge().vaisseaux);
  const [nous, eux] = vs;
  for (const r of [await mj("vaisseau:modifier", { id: eux.id, cache: false }), await mj("vaisseau:poser", nous.id), await mj("vaisseau:poser", eux.id)]) if (!r.ok) fail(`MJ : ${r.error}`);

  // La joueuse met son personnage à l'artillerie et tire.
  await pl.getByRole("tab", { name: "Vaisseau" }).click();
  const perso = await pl.evaluate(() => window.__forge().characters.find((c) => c.name === "Soline")?.id);
  const joue = (e, p) => pl.evaluate(([e, p]) => window.__forgeSend(e, p), [e, p]);
  const poste = await joue("vaisseau:poste", { id: nous.id, poste: "artilleur", characterId: perso });
  if (!poste.ok) fail(`poste : ${poste.error}`);
  const tir = await joue("vaisseau:action", { id: nous.id, action: "tirer", cibleId: eux.id, arme: 0 });
  if (!tir.ok) fail(`tir : ${tir.error}`);
  const refus = await joue("vaisseau:action", { id: nous.id, action: "reparer" });
  if (refus.ok) fail("la joueuse a pu jouer un poste que son personnage ne tient pas");
  await pl.waitForTimeout(600);
  const journal = await pl.evaluate(() => window.__forge().chat.at(-1)?.text ?? "");
  if (!/tire avec Tourelle dorsale sur Corvette de douane/.test(journal)) fail(`journal : ${journal}`);

  await gm.getByRole("tab", { name: "Vaisseaux" }).click();
  await gm.waitForTimeout(500);
  await gm.screenshot({ path: join(OUT, "vaisseaux-mj.png") });
  await pl.screenshot({ path: join(OUT, "vaisseaux-joueur.png") });
  await pl.setViewportSize({ width: 400, height: 860 });
  await pl.waitForTimeout(600);
  await pl.screenshot({ path: join(OUT, "vaisseaux-mobile.png") });
  console.log(`Journal : ${journal}`);
} catch (err) {
  fail(err.message);
} finally {
  await browser?.close();
  try {
    if (win) execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-server.pid);
  } catch {}
}
if (!process.exitCode) console.log("Vaisseaux vérifiés.");
process.exit();
