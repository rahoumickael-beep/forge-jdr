// Captures de chaque type de carte, pour juger le rendu : node scripts/apercu-cartes.mjs [dossier]
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const PORT = 3998;
const OUT = process.argv[2] || ".";
const server = spawn("npx", ["tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: mkdtempSync(join(tmpdir(), "forge-")) },
  stdio: ["ignore", "pipe", "inherit"],
  detached: true,
});
await new Promise((resolve) => server.stdout.on("data", (d) => String(d).includes("prête") && resolve()));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const gm = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  gm.on("pageerror", (e) => console.log("erreur JS :", e.message));
  await gm.goto(`http://localhost:${PORT}`);
  await gm.fill("#pseudo", "MJ");
  await gm.getByRole("button", { name: "Ouvrir la table" }).click();
  await gm.getByRole("tab", { name: "Carte" }).click().catch(() => gm.getByRole("button", { name: "Carte" }).click());
  for (const kind of ["nature", "village", "caverne", "donjon"]) {
    await gm.selectOption("#map-kind", kind);
    await gm.getByRole("button", { name: "Poser sur la table" }).click();
    await gm.getByRole("button", { name: "Tout révéler" }).click();
    await gm.waitForTimeout(1200);
    await gm.screenshot({ path: join(OUT, `carte-${kind}.png`) });
    console.log("capture", kind);
  }
} finally {
  await browser?.close();
  try { process.kill(-server.pid); } catch {}
}
process.exit();
