// Partie de test automatique : un MJ et un joueur dans deux navigateurs.
// Usage : npm run build && npm run playtest   (lance son propre serveur sur le port 3999)
import { execSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const PORT = 3999;
const URL = `http://localhost:${PORT}`;
const win = process.platform === "win32";
const server = spawn("npx", ["tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: mkdtempSync(join(tmpdir(), "forge-")) },
  stdio: ["ignore", "pipe", "inherit"],
  shell: win, // sous Windows, npx est un script .cmd
  detached: !win, // groupe de processus à part : on tue npx, tsx et le serveur d'un coup
});
await new Promise((resolve) => server.stdout.on("data", (d) => String(d).includes("prête") && resolve()));

// CHROMIUM_PATH permet d'utiliser un Chromium déjà installé (ex. /opt/pw-browsers/chromium).
let browser;
const fail = (msg) => {
  console.error("ÉCHEC :", msg);
  process.exitCode = 1;
};

try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const gm = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  gm.setDefaultTimeout(10000);
  gm.on("pageerror", (e) => fail(`erreur JS côté MJ : ${e.message}`));
  console.log("Navigateur du MJ ouvert");
  await gm.goto(URL);
  await gm.fill("#pseudo", "Mickael");
  await gm.fill("#campagne", "Les Cendres de Valmer");
  await gm.getByRole("button", { name: "Ouvrir la table" }).click();
  await gm.getByRole("button", { name: "Poser sur la table" }).click();
  await gm.getByRole("button", { name: "Tout révéler" }).click();
  const code = (await gm.locator(".code-chip").textContent()).trim();
  console.log("Partie créée :", code);

  const pl = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  pl.setDefaultTimeout(10000);
  pl.on("pageerror", (e) => fail(`erreur JS côté joueur : ${e.message}`));
  await pl.goto(`${URL}/?partie=${code}`);
  await pl.fill("#pseudo", "Léa");
  await pl.getByRole("button", { name: "S'asseoir à la table" }).click();
  await pl.getByRole("button", { name: "Tirer un personnage" }).click();
  await pl.fill("#pj-nom", "Brunhild");
  await pl.getByRole("button", { name: "C'est mon personnage" }).click();
  await pl.waitForTimeout(400);

  // Le joueur sélectionne son pion via le serveur puis le déplace avec les flèches.
  const before = await gm.evaluate(() => window.__forge?.());
  const tok = await pl.evaluate(() => window.__forge?.().tokens.find((t) => t.name === "Brunhild"));
  if (!tok) fail("le pion du joueur n'apparaît pas");
  else {
    const box = await pl.locator('canvas[aria-label="Carte de jeu"]').boundingBox();
    // Clique sur le pion : on retrouve sa position écran grâce au helper de debug.
    const pos = await pl.evaluate((id) => window.__forgeTokenScreen?.(id), tok.id);
    await pl.mouse.click(box.x + pos.x, box.y + pos.y);
    await pl.keyboard.press("ArrowRight");
    await pl.waitForTimeout(500);
    const after = await gm.evaluate((id) => window.__forge?.().tokens.find((t) => t.id === id), tok.id);
    if (!after || after.x === tok.x) fail(`le MJ ne voit pas le déplacement (avant ${tok.x}, après ${after?.x})`);
    else console.log(`Déplacement synchronisé : x ${tok.x} → ${after.x}`);
  }
  await pl.getByRole("button", { name: "d20" }).click();
  await gm.waitForTimeout(400);
  const log = await gm.locator(".log").textContent();
  if (!log.includes("Léa")) fail("le lancer de dé du joueur n'arrive pas chez le MJ");
  // Document remis à Léa seule : il doit arriver chez elle, avec la mention qu'il lui est réservé.
  await gm.getByRole("tab", { name: "Narration" }).click();
  await gm.fill("#handout-title", "Lettre cachetée de cire grise");
  await gm.fill("#handout-text", "Ne dis rien aux autres.");
  await gm.getByRole("group", { name: "Destinataires" }).getByLabel("Léa").check();
  await gm.getByRole("button", { name: "Remettre à Léa" }).click();
  await gm.screenshot({ path: "playtest-mj-document.png" });
  await pl.getByRole("tab", { name: "Documents" }).click();
  await pl.getByText("Remis à toi seul.").waitFor();
  console.log("Document remis à un seul joueur : reçu");
  await gm.getByRole("tab", { name: "Carte" }).click();
  await gm.screenshot({ path: "playtest-mj.png" });
  await pl.screenshot({ path: "playtest-joueur.png" });
  // Ligne de vue : on recache tout, le joueur ne doit plus voir que ce que voit son pion.
  await gm.getByRole("button", { name: "Tout cacher" }).click();
  await pl.waitForTimeout(500);
  const view = await pl.evaluate(() => window.__forge?.());
  if (!view?.visible?.length) fail("le joueur ne reçoit pas sa ligne de vue");
  else if (view.visible.length > view.map.width * view.map.height * 0.5) fail("la ligne de vue traverse les murs");
  else console.log(`Ligne de vue : ${view.visible.length} cases visibles`);
  await pl.screenshot({ path: "playtest-joueur-vue.png" });
  // Créateur de personnage pas à pas : un deuxième joueur passe toutes les étapes.
  const p2 = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  p2.setDefaultTimeout(10000);
  p2.on("pageerror", (e) => fail(`erreur JS côté joueur 2 : ${e.message}`));
  await p2.goto(`${URL}/?partie=${code}`);
  await p2.fill("#pseudo", "Tom");
  await p2.getByRole("button", { name: "S'asseoir à la table" }).click();
  await p2.getByRole("button", { name: "Créer pas à pas" }).click();
  await p2.getByRole("button", { name: /Revenus/ }).click();
  await p2.screenshot({ path: "playtest-createur-origine.png" });
  await p2.getByRole("button", { name: "Suivant" }).click();
  await p2.getByRole("button", { name: /Chasseur de morts/ }).click();
  await p2.getByRole("button", { name: "Suivant" }).click();
  await p2.getByRole("button", { name: /Cloueur/ }).click();
  await p2.getByRole("button", { name: "Suivant" }).click();
  for (const [stat, n] of [["Force", 7], ["Constitution", 6], ["Sagesse", 2]]) for (let i = 0; i < n; i++) await p2.getByRole("button", { name: `Monter ${stat}` }).click();
  await p2.screenshot({ path: "playtest-createur-carac.png" });
  await p2.getByRole("button", { name: "Suivant" }).click();
  const next = p2.getByRole("button", { name: "Suivant" });
  while (await next.isDisabled()) await p2.locator('.cc-chip[aria-pressed="false"]:not([disabled])').first().click();
  await p2.getByRole("button", { name: "Suivant" }).click();
  await p2.fill("#cc-nom", "Aubin Clouet");
  await p2.locator(".cc-trait").first().locator(".cc-chip").nth(1).click();
  await p2.getByRole("button", { name: "Suivant" }).click();
  await p2.getByRole("button", { name: "Suivant" }).click();
  await p2.screenshot({ path: "playtest-createur-recap.png" });
  await p2.getByRole("button", { name: "Entrer dans l'histoire" }).click();
  await p2.waitForTimeout(500);
  const aubin = await gm.evaluate(() => window.__forge?.().characters.find((c) => c.name === "Aubin Clouet"));
  if (!aubin) fail("le personnage créé pas à pas n'arrive pas chez le MJ");
  else console.log(`Créateur : ${aubin.name}, ${aubin.origin}, ${aubin.archetype}, PV ${aubin.hp}, CA ${aubin.ac}`);

  // --- Combat : le MJ pose un Levé du bestiaire en vue de Brunhild, le combat doit partir tout seul ---
  await gm.getByRole("tab", { name: "Bestiaire" }).click();
  await gm.getByPlaceholder("Chercher une créature").fill("Levé");
  await gm.locator(".beast-row", { hasText: /^Levé/ }).click();
  await gm.getByRole("button", { name: "Poser sur la carte" }).click();
  await gm.waitForTimeout(400);
  const spot = await pl.evaluate(() => {
    const v = window.__forge?.();
    const me = v.tokens.find((t) => t.name === "Brunhild");
    const seen = new Set(v.visible ?? []);
    const taken = new Set(v.tokens.map((t) => t.y * v.map.width + t.x));
    for (let r = 2; r <= 5; r++)
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
        const i = (me.y + dy) * v.map.width + me.x + dx;
        if (seen.has(i) && !taken.has(i) && [1, 4, 5, 6].includes(v.map.tiles[i])) return { x: me.x + dx, y: me.y + dy };
      }
    return null;
  });
  if (!spot) fail("aucune case en vue de Brunhild pour poser le monstre");
  else {
    const leve = await gm.evaluate(() => window.__forge?.().tokens.find((t) => t.creatureId === "leve"));
    if (!leve) fail("le Levé n'a pas été posé depuis le bestiaire");
    await gm.evaluate(({ id, x, y }) => window.__forgeSend("token:move", { id, x, y }), { id: leve.id, ...spot });
    await pl.waitForTimeout(1500);
    if (!(await pl.locator(".combat-intro").count())) fail("pas d'animation de combat chez le joueur");
    await pl.screenshot({ path: "playtest-combat-sceau.png" });
    await pl.waitForTimeout(2600);
    const combat = await gm.evaluate(() => window.__forge?.().combat);
    if (!combat || combat.cause !== "auto") fail("le combat ne s'est pas lancé tout seul");
    const items = await pl.locator(".frieze-item").count();
    if (items < 2) fail(`frise d'initiative incomplète (${items})`);
    await gm.screenshot({ path: "playtest-combat-mj.png" });
    await pl.screenshot({ path: "playtest-combat-joueur.png" });
    await gm.getByRole("button", { name: "Tour suivant" }).first().click();
    await gm.waitForTimeout(300);
    const turn = await gm.evaluate(() => window.__forge?.().initiative.turn);
    if (turn !== 1) fail("le tour suivant ne passe pas");
    await gm.getByRole("tab", { name: "Combat" }).click();
    await gm.getByRole("button", { name: "Fin du combat" }).click();
    await gm.waitForTimeout(600);
    if (await gm.evaluate(() => window.__forge?.().combat)) fail("le combat repart alors que le MJ l'a terminé");
    console.log(`Combat : lancé tout seul, ${items} combattants, tour suivant et fin du combat OK`);
  }

  // --- Combat de navires des Îles du Vent : la table passe en « pirates », le vocabulaire change, un canonnier tire, l'abordage change la carte ---
  const envoyer = (page, evt, payload) => page.evaluate(([e, p]) => window.__forgeSend(e, p), [evt, payload]);
  await envoyer(gm, "settings:set", { genre: "pirates" });
  await gm.getByRole("tab", { name: "Carte" }).click();
  await gm.locator("#map-kind").selectOption({ label: "Pleine mer (navires)" });
  await gm.getByRole("button", { name: "Poser sur la table" }).click();
  await gm.waitForTimeout(400);
  await envoyer(gm, "vaisseau:creer", { modele: "sloop", nom: "Pie-Noire", equipage: "groupe" });
  await envoyer(gm, "vaisseau:creer", { modele: "galion-garde-cote", nom: "Garde-côte", equipage: "autre" });
  await gm.waitForTimeout(400);
  const navires = await gm.evaluate(() => window.__forge?.().vaisseaux);
  const nous = navires?.find((v) => v.nom === "Pie-Noire");
  const eux = navires?.find((v) => v.nom === "Garde-côte");
  if (!nous || !eux) fail("les navires ne sont pas créés");
  else {
    await envoyer(gm, "vaisseau:poser", nous.id);
    await envoyer(gm, "vaisseau:poser", eux.id);
    await envoyer(gm, "vaisseau:modifier", { id: eux.id, cache: false });
    const brunhild = await gm.evaluate(() => window.__forge?.().characters.find((c) => c.name === "Brunhild"));
    const poste = await envoyer(pl, "vaisseau:poste", { id: nous.id, poste: "artilleur", characterId: brunhild.id });
    if (!poste.ok) fail(`le joueur ne peut pas prendre le poste de canonnier : ${poste.error}`);
    await gm.getByRole("tab", { name: "Navires" }).click();
    const panneauMJ = await gm.locator('[role="tabpanel"]').innerText();
    if (!panneauMJ.includes("Mettre à l'eau") || /hangar|Vaisseau|Bouclier/i.test(panneauMJ)) fail(`le panneau du MJ parle encore de vaisseaux : ${panneauMJ.slice(0, 200)}`);
    await pl.getByRole("tab", { name: "Navire", exact: true }).click();
    const panneau = await pl.locator('[role="tabpanel"]').innerText();
    if (!/Canonnier/.test(panneau) || !/Gréement/.test(panneau) || /Bouclier|Tourelle|Pilote|Artilleur|Vaisseau|Détecteur/i.test(panneau)) fail(`l'écran du navire garde des mots de SF : ${panneau.slice(0, 300)}`);
    // Un poste qu'on ne tient pas ne se joue pas ; le sien, si.
    const refus = await envoyer(pl, "vaisseau:action", { id: nous.id, action: "esquive" });
    if (refus.ok) fail("un joueur a joué le poste de barreur sans le tenir");
    await pl.locator('select[aria-label="Navire visé"]').first().selectOption({ label: "Garde-côte" });
    await pl.getByRole("button", { name: "Tirer", exact: true }).click();
    await pl.waitForTimeout(500);
    const journal = await gm.locator(".log").textContent();
    if (!journal.includes("tire une pièce de Canons de 8 sur Garde-côte")) fail("le tir du canonnier n'arrive pas au journal");
    const apresTir = await gm.evaluate((id) => window.__forge?.().vaisseaux.find((v) => v.id === id).armes[0].chargees, nous.id);
    if (apresTir !== 3) fail(`la pièce tirée n'est pas vide (${apresTir} chargées sur 4)`);
    const vueJoueur = await pl.evaluate(() => JSON.stringify(window.__forge?.().vaisseaux.find((v) => v.equipage === "autre")));
    if (/"(moral|hommes|hommesMax|perdus)":/.test(vueJoueur)) fail("le joueur voit le Moral ou l'équipage d'un autre navire");
    await pl.screenshot({ path: "playtest-navire-joueur.png" });
    // Abordage : les grappins tiennent (réglés par le MJ), le capitaine l'ordonne, la table passe aux deux ponts.
    await envoyer(gm, "vaisseau:modifier", { id: nous.id, grappins: eux.id });
    await envoyer(gm, "vaisseau:modifier", { id: eux.id, grappins: nous.id });
    const ab = await envoyer(gm, "vaisseau:action", { id: nous.id, action: "aborder", cibleId: eux.id });
    if (!ab.ok) fail(`l'abordage est refusé : ${ab.error}`);
    await gm.waitForTimeout(500);
    const apres = await gm.evaluate(() => window.__forge?.());
    if (apres.map.kind !== "pont") fail(`la carte n'est pas passée aux ponts (${apres.map.kind})`);
    else if (apres.tokens.some((t) => t.vaisseauId)) fail("les pions des navires sont restés sur la carte des ponts");
    else if (apres.vaisseaux.find((v) => v.id === nous.id).moral !== 5) fail("l'abordage n'a pas coûté 1 de Moral");
    else console.log("Navires : vocabulaire de mer, tir du canonnier, poste refusé, abordage aux deux ponts OK");
    await gm.screenshot({ path: "playtest-navire-ponts.png" });
  }

  console.log(before ? "Captures : playtest-mj.png, playtest-joueur.png, playtest-joueur-vue.png" : "");
} catch (err) {
  fail(err.message);
} finally {
  await browser?.close();
  try {
    if (win) execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-server.pid);
  } catch {}
}
if (!process.exitCode) console.log("Partie de test réussie.");
process.exit();
