// Vraie table, chaque type de carte : un MJ et un joueur, pion déplacé, brouillard actif.
// Usage : npm run build && node scripts/apercu-cartes.mjs [dossier] [genre]
// Captures : carte-<type>-mj.png (MJ, 1400 px), carte-<type>-joueur.png (joueur, 1400 px),
// carte-<type>-mobile.png (joueur, 400 px de large). Toute erreur JS est signalée et fait échouer le script.
import { execSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const PORT = Number(process.env.APERCU_PORT || 3998);
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
  await gm.getByRole("button", { name: "Ouvrir la table" }).click();
  await gm.getByRole("button", { name: "Poser sur la table" }).click();
  const code = (await gm.locator(".code-chip").textContent()).trim();

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const pl = await ctx.newPage();
  pl.setDefaultTimeout(15000);
  pl.on("pageerror", (e) => fail(`erreur JS côté joueur : ${e.message}`));
  pl.on("console", (m) => m.type() === "error" && fail(`console joueur : ${m.text()}`));
  await pl.goto(`${URL}/?partie=${code}`);
  await pl.fill("#pseudo", "Léa");
  await pl.getByRole("button", { name: "S'asseoir à la table" }).click();
  await pl.getByRole("button", { name: "Tirer un personnage" }).click();
  await pl.fill("#pj-nom", "Brunhild");
  await pl.getByRole("button", { name: "C'est mon personnage" }).click();
  await pl.waitForTimeout(400);

  for (const kind of ["donjon", "caverne", "nature", "village"]) {
    await gm.getByRole("tab", { name: "Carte" }).click().catch(() => {});
    await gm.selectOption("#map-kind", kind);
    await gm.getByRole("button", { name: "Poser sur la table" }).click();
    await gm.waitForTimeout(600);
    // Brouillard actif : tout caché, le joueur ne voit que ce que voit son pion.
    const fog = gm.getByLabel("Activer le brouillard");
    if ((await fog.count()) && !(await fog.isChecked())) await fog.check();
    await gm.getByRole("button", { name: "Tout cacher" }).click();
    await pl.waitForTimeout(500);
    const tok = await pl.evaluate(() => window.__forge?.().tokens.find((t) => t.name === "Brunhild"));
    if (!tok) {
      fail(`${kind} : pas de pion pour Brunhild`);
      continue;
    }
    // Déplacement par le serveur (comme le ferait un glisser), vers la case libre la plus proche :
    // le pion garde sa place d'une carte à l'autre et peut être tombé dans la roche.
    const dest = await pl.evaluate((t) => {
      const v = window.__forge?.();
      const W = v.map.width;
      const H = v.map.height;
      for (let r = 1; r < Math.max(W, H); r++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = t.x + dx;
            const y = t.y + dy;
            const i = y * W + x;
            if (x >= 0 && y >= 0 && x < W && y < H && [1, 4, 5, 6].includes(v.map.tiles[i]) && !v.tokens.some((o) => o.y * W + o.x === i)) return { x, y };
          }
      return null;
    }, tok);
    if (dest) {
      await pl.evaluate(({ id, x, y }) => window.__forgeSend("token:move", { id, x, y }), { id: tok.id, ...dest });
      await pl.waitForTimeout(500);
      const after = await gm.evaluate((id) => window.__forge?.().tokens.find((t) => t.id === id), tok.id);
      if (after?.x !== dest.x || after?.y !== dest.y) fail(`${kind} : le MJ ne voit pas le déplacement`);
    } else fail(`${kind} : aucune case libre autour du pion`);
    const view = await pl.evaluate(() => window.__forge?.());
    const seen = view?.visible?.length ?? 0;
    if (!seen || seen > view.map.width * view.map.height * 0.5) fail(`${kind} : ligne de vue suspecte (${seen} cases)`);
    await pl.waitForTimeout(700);
    // Secret du MJ : une case jamais explorée (au moins une case de la lisière) doit être totalement opaque chez le joueur.
    const leaks = await pl.evaluate(() => window.__forgeFogLeaks?.());
    if (leaks === undefined || leaks === null) fail(`${kind} : contrôle du brouillard indisponible`);
    else if (!(await pl.evaluate(() => window.__forgeFogLeaks(256)?.length ?? 0))) fail(`${kind} : le contrôle du brouillard ne lit rien (seuil impossible sans résultat)`);
    else if (leaks.length) fail(`${kind} : la carte transparaît dans ${leaks.length} cases inexplorées (ex. ${leaks.slice(0, 5).join(", ")})`);
    await gm.screenshot({ path: join(OUT, `carte-${kind}-mj.png`) });
    await pl.setViewportSize({ width: 1400, height: 900 });
    await pl.waitForTimeout(400);
    await pl.screenshot({ path: join(OUT, `carte-${kind}-joueur.png`) });
    await pl.setViewportSize({ width: 400, height: 860 });
    await pl.waitForTimeout(600);
    await pl.screenshot({ path: join(OUT, `carte-${kind}-mobile.png`) });
    await pl.setViewportSize({ width: 1400, height: 900 });
    console.log(`${kind} : pion ${tok.x},${tok.y} → ${dest?.x},${dest?.y}, ${seen} cases visibles`);
  }
} catch (err) {
  fail(err.message);
} finally {
  await browser?.close();
  try {
    if (win) execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-server.pid);
  } catch {}
}
if (!process.exitCode) console.log("Table vérifiée.");
process.exit();
