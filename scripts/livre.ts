// Maquette du livre des règles d'Aubreterre, en A4 deux colonnes.
// npx tsx scripts/livre.ts [dossier de sortie]  →  maquette.html, maquette.pdf et un PNG par page.
// Les illustrations sont lues dans content/aubreterre/illustrations/<id>.(png|jpg) ; à défaut, un cadre
// d'attente affiche le prompt ComfyUI à générer.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { ORIGINS } from "../shared/origins";
import { CLASSES, type Power } from "../shared/rules";

const OUT = resolve(process.argv[2] || "dist-livre");
const ILLU_DIR = resolve("content/aubreterre/illustrations");
mkdirSync(OUT, { recursive: true });

const STYLE = "oil painting, dark fantasy rulebook plate, visible brush strokes, muted earth palette, dramatic chiaroscuro, candlelight, painterly, by an old master";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/« /g, "«&nbsp;").replace(/ »/g, "&nbsp;»").replace(/ ([:;!?])/g, "&nbsp;$1");

function illustration(id: string, prompt: string, cls = "", caption = "") {
  for (const ext of ["jpg", "png", "webp"]) {
    const p = join(ILLU_DIR, `${id}.${ext}`);
    if (existsSync(p)) {
      const data = readFileSync(p).toString("base64");
      return `<figure class="illu ${cls}"><img src="data:image/${ext === "jpg" ? "jpeg" : ext};base64,${data}" alt="">${caption ? `<figcaption>${md(caption)}</figcaption>` : ""}</figure>`;
    }
  }
  return `<figure class="illu wait ${cls}"><div class="wait-inner"><span class="wait-title">Illustration à générer</span><code>${esc(id)}</code><p>${esc(STYLE)}, ${esc(prompt)}</p></div>${caption ? `<figcaption>${md(caption)}</figcaption>` : ""}</figure>`;
}

/** Paragraphes d'une section du lore (entre deux titres). */
function loreSection(title: string): string[] {
  const text = readFileSync("content/aubreterre/lore.md", "utf8");
  const start = text.indexOf(`### ${title}`);
  if (start < 0) return [];
  const rest = text.slice(start).split("\n").slice(1);
  const out: string[] = [];
  for (const line of rest) {
    if (/^#{2,3} /.test(line) || line.startsWith("---")) break;
    if (line.trim()) out.push(line.trim());
  }
  return out;
}

const recharge = (p: Power) => (p.recharge === "à volonté" ? "à volonté" : p.recharge === "passif" ? "toujours actif" : `${p.uses ?? 1}×/${p.recharge}`);

function page(inner: string, opts: { n?: number; header?: string; cls?: string } = {}) {
  return `<section class="page ${opts.cls ?? ""}">
    ${opts.header ? `<header class="run"><span>${esc(opts.header)}</span></header>` : ""}
    <div class="frame">${inner}</div>
    ${opts.n ? `<footer class="folio"><span>${opts.n}</span></footer>` : ""}
  </section>`;
}

// ---------- Pages ----------
const cover = `<section class="page cover">
  ${illustration("couverture", "a dead god-emperor sitting on a black basalt throne, iron crown, candle wax rising to his knees, pilgrims kneeling in shadow, vast cathedral hall, cold blue light from cracks in the floor", "full")}
  <div class="cover-title">
    <div class="cover-kicker">Livre des règles</div>
    <h1>Le Trône<br>du Dieu Mort</h1>
    <div class="cover-rule"></div>
    <div class="cover-sub">Aubreterre · un monde pour la cinquième édition</div>
  </div>
</section>`;

const credits = page(`
  <div class="credits">
    <h2 class="small-caps">Le Trône du Dieu Mort</h2>
    <p class="center">Livre des règles d'Aubreterre</p>
    <div class="orn">❦</div>
    <p class="center">Conception, monde et règles : Mickael et sa table.<br>Illustrations : peintures générées avec Flux, retouchées et choisies à la main.</p>
    <div class="legal">
      <p>Ce livre utilise le Document de référence du système 5.1 (« SRD 5.1 ») de Wizards of the Coast LLC, disponible sur https://dnd.wizards.com/resources/systems-reference-document. Le SRD 5.1 est publié sous licence Creative Commons Attribution 4.0 International, consultable sur https://creativecommons.org/licenses/by/4.0/legalcode.</p>
      <p>Aubreterre, ses lieux, ses peuples, ses classes propres et ses personnages sont des créations originales.</p>
    </div>
  </div>`, { cls: "plain" });

const monde = loreSection("Le règne").concat(loreSection("La nuit du Glas"));
const chapter = page(`
  <div class="chapter-head">
    <div class="chapter-num">Chapitre premier</div>
    <h2>Le monde en une page</h2>
    <div class="orn">✠</div>
  </div>
  ${illustration("glas", "the night all the bells rang alone, a gothic imperial city at night under snow, bell towers, crowds in the streets looking up, a faint pale glow from the palace", "wide", "La nuit du Glas, vue depuis le quartier des Cierges.")}
  <div class="cols">
    ${monde.slice(0, 7).map((p, i) => `<p${i === 0 ? ' class="lettrine"' : ""}>${md(p)}</p>`).join("")}
    <aside class="encart"><h4>Ce que personne ne sait</h4><p>Ostral ne s'est pas fait tuer. Il s'est donné la mort pour sceller son frère. Gardez ce secret le plus longtemps possible : c'est le cœur de la campagne.</p></aside>
  </div>`, { n: 7, header: "Chapitre premier · Le monde" });

const cdm = CLASSES.find((c) => c.id === "fantasy-chasseur-de-morts")!;
const levels = Array.from({ length: 20 }, (_, i) => i + 1);
const classPage1 = page(`
  <div class="class-head">
    <h2>${esc(cdm.name)}</h2>
    <p class="pitch">${md(cdm.pitch)}</p>
  </div>
  <div class="cols">
    ${illustration("classe-chasseur", "a grim dead-hunter in a brigandine and wide hat, cold iron hammer and a bag of square nails, kneeling over a corpse in a muddy village at dusk, salt in his palm", "col")}
    <p class="lettrine">Dans les villages de Pallène, on reconnaît la maison d'un mort à la paire de sabots posée devant la porte, et celle d'un cloueur au marteau pendu à la fenêtre. Les membres de la Confrérie du Dernier Clou passent là où les prêtres ne viennent plus. Ils regardent le corps, ils comptent les nuits, et quand il le faut, ils clouent.</p>
    <p>Un chasseur de morts n'a pas de sorts. Il a du fer froid, du sel, du goudron et trois siècles de gestes appris par cœur. Il est payé à la prime, sur les clous qu'il rapporte.</p>
    <h3>Aptitudes de classe</h3>
    <dl class="feats">
      <dt>Dé de vie</dt><dd>d${cdm.hitDie} par niveau</dd>
      <dt>Caractéristiques</dt><dd>${esc(cdm.mainStats.join(" et "))}</dd>
      <dt>Sauvegardes</dt><dd>${esc(cdm.saves.join(", "))}</dd>
      <dt>Armures</dt><dd>${esc(cdm.armor)}</dd>
      <dt>Armes</dt><dd>${esc(cdm.weapons)}</dd>
      <dt>Compétences</dt><dd>${cdm.skills.choose} au choix : ${esc(cdm.skills.from.join(", "))}</dd>
      <dt>Équipement</dt><dd>${esc(cdm.startingGear.join(", "))}</dd>
    </dl>
  </div>`, { n: 42, header: "Chapitre trois · Les classes" });

const classPage2 = page(`
  <table class="progress">
    <thead><tr><th>Niv.</th><th>Maîtrise</th><th>Aptitudes</th></tr></thead>
    <tbody>${levels.map((l) => `<tr><td>${l}</td><td>+${Math.ceil(l / 4) + 1}</td><td>${cdm.powers.filter((p) => p.level === l).map((p) => esc(p.name)).join(", ") || "—"}</td></tr>`).join("")}</tbody>
  </table>
  <div class="cols">
    ${cdm.powers.map((p) => `<div class="power"><h4>${esc(p.name)}</h4><div class="power-meta">Niveau ${p.level} · ${esc(p.action)} · ${recharge(p)}${p.range ? ` · ${esc(p.range)}` : ""}</div><p>${md(p.effect)}</p></div>`).join("")}
  </div>`, { n: 43, header: "Chapitre trois · Les classes" });

const rev = ORIGINS.find((o) => o.id === "revenu")!;
const originPage = page(`
  <div class="class-head">
    <h2>${esc(rev.name)}</h2>
    <p class="pitch">« Je me souviens du froid. Et de quelqu'un, en bas, qui m'a renvoyé. »</p>
  </div>
  <div class="cols">
    <p class="lettrine">${md(rev.blurb)}</p>
    ${illustration("origine-revenu", "portrait of a revenant woman, pale bluish skin, black fingernails, hood, standing in a graveyard at dawn, calm sad eyes, breath not fogging in the cold air", "col")}
    <h3>Traits des Revenus</h3>
    <dl class="feats">${rev.traits.map((t) => `<dt>${esc(t.name)}</dt><dd>${md(t.text)}</dd>`).join("")}</dl>
    ${rev.subs.map((s) => `<h3>${esc(s.name)}</h3><p><em>${md(s.blurb)}</em></p><dl class="feats">${s.traits.map((t) => `<dt>${esc(t.name)}</dt><dd>${md(t.text)}</dd>`).join("")}</dl>`).join("")}
    <aside class="encart dark"><h4>Jouer un Revenu</h4><p>L'Église veut te clouer, les Marches veulent te brûler. Les Rendus te protègent, mais ils attendent quelque chose en retour. Décide avec le MJ depuis combien de temps tu es mort, et qui t'a vu revenir.</p></aside>
  </div>`, { n: 21, header: "Chapitre deux · Les origines" });

const creaturePage = page(`
  ${illustration("bestiaire-leve", "a risen corpse walking east across a misty peat bog at dawn, old leather-tanned skin, iron nail in one heel, villagers on stilt houses watching in silence", "wide")}
  <div class="cols">
    <h2 class="beast-name">Levé</h2>
    <p class="beast-lore lettrine">Un mort qui s'est relevé sans son esprit, à la troisième nuit. Il marche vers l'est, vers Aube-Close, en ligne droite, à travers l'eau, les haies et les maisons. Il n'attaque que ce qui lui barre la route.</p>
    <div class="statblock">
      <h4>Levé</h4>
      <div class="sb-type">Mort-vivant de taille moyenne, sans alignement</div>
      <hr>
      <p><strong>Classe d'armure</strong> 8</p>
      <p><strong>Points de vie</strong> 22 (3d8 + 9)</p>
      <p><strong>Vitesse</strong> 6 m</p>
      <hr>
      <table class="abil"><tr><th>FOR</th><th>DEX</th><th>CON</th><th>INT</th><th>SAG</th><th>CHA</th></tr><tr><td>13 (+1)</td><td>6 (−2)</td><td>16 (+3)</td><td>3 (−4)</td><td>6 (−2)</td><td>5 (−3)</td></tr></table>
      <hr>
      <p><strong>Immunités</strong> poison ; empoisonné, épuisé</p>
      <p><strong>Sens</strong> vision dans le noir 18 m, Perception passive 8</p>
      <p><strong>Langues</strong> —</p>
      <p><strong>Puissance</strong> 1/4 (50 PX)</p>
      <hr>
      <p><strong><em>La Marche.</em></strong> Le Levé avance vers Aube-Close. Il ignore les créatures qui ne lui barrent pas la route et ne l'attaquent pas.</p>
      <p><strong><em>Obstiné.</em></strong> Réduit à 0 PV par des dégâts autres que radiants ou de feu, il se relève avec 1 PV à la prochaine nuit, sauf s'il est cloué.</p>
      <h5>Actions</h5>
      <p><strong><em>Coup.</em></strong> <em>Attaque au corps à corps :</em> +3 au toucher, allonge 1,5 m. <em>Touché :</em> 4 (1d6 + 1) contondant.</p>
    </div>
    <aside class="encart"><h4>Au MJ</h4><p>Montrez la règle de la Marche par les gestes avant de la dire : un Levé qui écarte un enfant de son chemin du revers de la main, sans lui faire de mal, en dit plus qu'une explication.</p></aside>
  </div>`, { n: 118, header: "Bestiaire · Les morts" });

const fonts = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=IM+Fell+English+SC&display=swap";

const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #555; }
body { font-family: "EB Garamond", Georgia, serif; color: #2a1d12; font-size: 10.2pt; line-height: 1.34; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page {
  width: 210mm; height: 297mm; position: relative; overflow: hidden; margin: 0 auto 10mm; page-break-after: always; break-after: page;
  background-color: #efe2c4;
  background-image:
    radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(110,70,30,.28) 100%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .18  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='4'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .2  0 0 0 .16 0'/></filter><rect width='100%' height='100%' filter='url(%23m)'/></svg>");
}
.frame { position: absolute; inset: 19mm 17mm 18mm 17mm; display: flex; flex-direction: column; }
.frame > * { flex: none; }
.run { position: absolute; top: 9mm; left: 17mm; right: 17mm; text-align: center; font-family: "IM Fell English SC", serif; font-size: 9pt; color: #7a2e1c; letter-spacing: .08em; border-bottom: .4pt solid #7a2e1c88; padding-bottom: 1.5mm; }
.folio { position: absolute; bottom: 8mm; left: 0; right: 0; text-align: center; font-family: Cinzel, serif; font-size: 9pt; color: #5a3a1e; }
.folio span::before, .folio span::after { content: "—"; margin: 0 3mm; color: #a07a40; }
h1, h2, h3, h4, h5 { font-family: Cinzel, serif; font-weight: 600; color: #6e2414; margin: 0; }
h3 { font-size: 13pt; margin: 3mm 0 1.5mm; border-bottom: .6pt solid #a07a40; padding-bottom: .6mm; break-after: avoid; }
p { margin: 0 0 2.2mm; text-align: justify; hyphens: auto; }
.frame > .cols { column-count: 2; column-gap: 8mm; column-rule: .4pt solid #a07a4066; column-fill: balance; flex: 0 1 auto; min-height: 0; overflow: hidden; }
.lettrine::first-letter { font-family: "Cinzel Decorative", serif; float: left; font-size: 38pt; line-height: .82; padding: 1mm 2mm 0 0; margin-bottom: -1mm; color: #7a2e1c; text-shadow: 1px 1px 0 #d9b56a; }
.orn { text-align: center; color: #8a5a2a; font-size: 16pt; margin: 2mm 0; }
.center { text-align: center; }
.small-caps { font-variant: small-caps; text-align: center; font-size: 20pt; }
.chapter-head { text-align: center; margin-bottom: 3mm; }
.chapter-num { font-family: "IM Fell English SC", serif; color: #8a5a2a; letter-spacing: .2em; font-size: 10pt; }
.chapter-head h2 { font-size: 26pt; letter-spacing: .03em; }
.class-head { text-align: center; margin-bottom: 4mm; }
.class-head h2 { font-size: 30pt; letter-spacing: .04em; text-shadow: 0 1px 0 #f6e9c9; }
.pitch { text-align: center; font-style: italic; color: #5a3a1e; font-size: 12pt; margin-top: 1mm; }
.illu { margin: 0 0 3mm; position: relative; break-inside: avoid; }
.illu img { display: block; width: 100%; height: 100%; object-fit: cover; border: 1.2pt solid #3a2614; box-shadow: 0 0 0 1.2mm #efe2c4, 0 0 0 1.6mm #8a5a2a, 2px 4px 10px rgba(0,0,0,.35); }
.illu.wide { height: 82mm; margin-bottom: 5mm; }
.illu.col { height: 70mm; }
.illu.full { position: absolute; inset: 0; margin: 0; }
.illu.full img { border: 0; box-shadow: none; }
.illu figcaption { font-style: italic; font-size: 8.6pt; text-align: center; color: #5a3a1e; margin-top: 2.6mm; }
.illu.wait { height: 70mm; }
.illu.wide.wait { height: 82mm; }
.illu.full.wait { height: 100%; }
.cover .wait-inner { justify-content: flex-end !important; padding-bottom: 30mm !important; }
.wait-inner { height: 100%; border: 1pt dashed #8a5a2a; background: repeating-linear-gradient(45deg, rgba(138,90,42,.06) 0 6px, transparent 6px 12px); padding: 4mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 1.5mm; }
.wait-title { font-family: Cinzel, serif; color: #7a2e1c; font-size: 10pt; }
.wait-inner code { font-size: 8pt; color: #5a3a1e; }
.wait-inner p { font-size: 7.6pt; line-height: 1.25; text-align: center; color: #6a4a2a; margin: 0; }
.encart { break-inside: avoid; margin: 3mm 0; padding: 3mm 4mm; background: rgba(122,46,28,.08); border-top: 1.4pt solid #7a2e1c; border-bottom: 1.4pt solid #7a2e1c; position: relative; }
.encart h4 { font-size: 10.5pt; margin-bottom: 1mm; }
.encart p { margin: 0; font-size: 10pt; }
.encart.dark { background: #2c2118; color: #efe2c4; border-color: #b8893e; }
.encart.dark h4 { color: #e2c27a; }
.feats { margin: 0 0 2mm; }
.feats dt { font-family: Cinzel, serif; font-size: 9.2pt; color: #6e2414; font-weight: 600; margin-top: 1.2mm; break-after: avoid; }
.feats dd { margin: 0; }
.progress { width: 100%; border-collapse: collapse; margin-bottom: 4mm; font-size: 9.2pt; }
.progress th { font-family: Cinzel, serif; font-size: 8.4pt; text-align: left; color: #6e2414; border-bottom: 1pt solid #6e2414; padding: .8mm 2mm; }
.progress td { padding: .5mm 2mm; }
.progress tr:nth-child(even) td { background: rgba(160,122,64,.14); }
.progress td:first-child, .progress td:nth-child(2) { width: 14mm; font-variant-numeric: tabular-nums; }
.power { break-inside: avoid; margin-bottom: 2.4mm; }
.power h4 { font-size: 10.4pt; }
.power-meta { font-style: italic; font-size: 8.8pt; color: #7a5a3a; margin-bottom: .6mm; }
.power p { margin: 0; }
.beast-name { font-size: 22pt; margin-bottom: 1mm; }
.statblock { break-inside: avoid; background: #f5ead0; padding: 3mm 3.5mm; border-top: 2.2pt solid #7a2e1c; border-bottom: 2.2pt solid #7a2e1c; box-shadow: 1px 2px 6px rgba(0,0,0,.25); font-size: 9.6pt; margin-bottom: 3mm; }
.statblock h4 { font-size: 14pt; color: #6e2414; }
.statblock h5 { font-size: 11pt; border-bottom: .6pt solid #7a2e1c; margin: 2mm 0 1mm; }
.statblock p { margin: 0 0 .8mm; text-align: left; }
.statblock hr { border: 0; height: 1.6pt; background: linear-gradient(90deg, #7a2e1c, transparent); margin: 1.4mm 0; }
.sb-type { font-style: italic; font-size: 9pt; }
.abil { width: 100%; text-align: center; font-size: 9pt; color: #6e2414; }
.abil th { font-family: Cinzel, serif; font-size: 8.4pt; }
.cover { background: #1a120c; }
.cover .illu.wait .wait-inner { background: radial-gradient(ellipse at 50% 40%, #4a3524, #120c08 75%); border: 0; color: #d9c49a; }
.cover .illu.wait .wait-inner p, .cover .illu.wait code { color: #b39a6e; max-width: 120mm; }
.cover::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,6,4,.85) 0%, transparent 32%, transparent 62%, rgba(10,6,4,.92) 100%); pointer-events: none; }
.cover-title { position: absolute; top: 18mm; left: 0; right: 0; text-align: center; z-index: 2; }
.cover-kicker { font-family: "IM Fell English SC", serif; color: #d9b56a; letter-spacing: .4em; font-size: 12pt; }
.cover h1 { font-family: "Cinzel Decorative", serif; font-size: 50pt; line-height: 1.02; color: #f1d58e; text-shadow: 0 2px 0 #5a3a10, 0 0 30px rgba(0,0,0,.9); margin-top: 3mm; letter-spacing: .02em; }
.cover-rule { width: 80mm; height: 8px; margin: 5mm auto; background: linear-gradient(90deg, transparent, #c9a048, transparent); mask: radial-gradient(circle, #000 1.5px, transparent 2px) 0 0/8px 8px; }
.cover-sub { font-family: Cinzel, serif; color: #e7d3a4; font-size: 11pt; letter-spacing: .12em; }
.plain .frame { display: flex; align-items: center; justify-content: center; }
.credits { max-width: 120mm; }
.legal { margin-top: 12mm; font-size: 8.4pt; color: #5a3a1e; }
.legal p { text-align: left; }
@media screen { body { padding: 10mm 0; } }
`;

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Le Trône du Dieu Mort — maquette</title>
<link rel="stylesheet" href="${fonts}"><style>${css}</style></head><body>
${cover}${credits}${chapter}${originPage}${classPage1}${classPage2}${creaturePage}
</body></html>`;

writeFileSync(join(OUT, "maquette.html"), html);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pg = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1.5 });
await pg.setContent(html, { waitUntil: "networkidle" });
await pg.evaluate(() => document.fonts.ready);
await pg.pdf({ path: join(OUT, "maquette.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
const pages = await pg.$$(".page");
for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: join(OUT, `page-${i + 1}.png`) });
await browser.close();
console.log(`Maquette : ${pages.length} pages dans ${OUT}`);
