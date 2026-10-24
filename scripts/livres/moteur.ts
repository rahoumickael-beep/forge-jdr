// Moteur de mise en page des livres : chaque unité (chapitre, classe, créature…) est d'abord imprimée à part
// par Chromium, en A4 sans marge et sur fond transparent, pour compter ses pages ; le livre est ensuite imprimé
// d'un seul tenant (les polices ne sont embarquées qu'une fois) puis découpé. Assemblage avec pdf-lib : sous chaque page,
// une seule image de parchemin partagée par tout le livre (le PDF reste léger) ; par-dessus, un calque
// transparent avec les en-têtes courants et les folios. Le sommaire se calcule en deux passes.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { chromium, type Page } from "playwright";
import { MONDE } from "./monde";
import { CSS, POLICES } from "./style";
import { esc, HD, md } from "./texte";

export interface Unite {
  /** Titre dans le sommaire. */
  titre: string;
  /** Petit texte à gauche dans le sommaire (« Chapitre 2 », « FP 3 »…). */
  marque?: string;
  /** 1 : entrée principale du sommaire ; 2 : entrée secondaire ; 0 : absente du sommaire. */
  niveau: 0 | 1 | 2;
  /** En-tête courant des pages de l'unité. */
  entete: string;
  /** Pas d'en-tête sur la première page (ouverture de chapitre). */
  ouverture?: boolean;
  /** Contenu HTML, qui coule dans les marges de la page. */
  html: string;
  /** Page pleine sans marges ni parchemin (couverture, planche). */
  pleine?: boolean;
  /** Mise en page de rechange si `html` déborde d'une page (une créature légendaire passe en double page). */
  siLong?: string;
}

export interface Livre {
  fichier: string;
  titre: string;
  couverture: string;
  credits: string;
  unites: Unite[];
  /** Pages à montrer en aperçu PNG (numéros physiques). */
  apercus?: number[];
}

const doc = (body: string, parchemin = true) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="${POLICES}">${MONDE.polices ? `<link rel="stylesheet" href="${MONDE.polices}">` : ""}<style>${CSS}${MONDE.css ?? ""}</style></head><body>${parchemin ? '<div class="parchemin"></div>' : ""}${body}</body></html>`;

async function imprimer(page: Page, html: string, fond = true): Promise<Uint8Array> {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page.pdf({ format: "A4", printBackground: fond, preferCSSPageSize: true });
}

const pagesDe = async (pdf: Uint8Array) => (await PDFDocument.load(pdf)).getPageCount();

/** Ouverture de chapitre : numéro, titre, ornement, chapeau. */
export function ouverture(num: string, titre: string, chapeau = "", orn = "✠") {
  return `<div class="ouverture"><div class="num">${esc(num)}</div><h2>${esc(titre)}</h2><div class="orn">${orn}</div>${chapeau ? `<p class="chapeau">${md(chapeau)}</p>` : ""}</div>`;
}

function sommaire(livre: Livre, debuts: number[]) {
  const lignes = livre.unites
    .map((u, i) => ({ u, n: debuts[i] }))
    .filter(({ u }) => u.niveau > 0)
    .map(({ u, n }) => `<div class="toc${u.niveau === 2 ? " sub" : ""}">${u.niveau === 1 ? `<span class="k">${esc(u.marque ?? "")}</span>` : ""}<span class="t">${esc(u.titre)}</span><span class="d"></span><span class="n">${n}</span></div>`)
    .join("");
  return `<div class="flux"><div class="sommaire"><h2>Sommaire</h2>${lignes}</div></div>`;
}

export async function fabriquer(livre: Livre, out: string) {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();

  // Le parchemin, peint une fois en JPEG.
  const page2 = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: HD ? 3 : 2 }); // ×3 : parchemin à près de 300 dpi pour l'impression
  await page2.setContent(doc("", true));
  const texture = await page2.screenshot({ type: "jpeg", quality: 80 });
  await page2.close();

  const couverture = await imprimer(page, doc(`<section class="couverture">${livre.couverture}</section>`, false));
  const credits = await imprimer(page, doc(`<div class="flux">${livre.credits}</div>`, false));
  const corps: Uint8Array[] = [];
  for (const u of livre.unites) {
    let pdf = await imprimer(page, u.pleine ? doc(u.html, false) : doc(`<div class="flux">${u.html}</div>`, false));
    if (u.siLong && (await pagesDe(pdf)) > 1) {
      u.html = u.siLong;
      pdf = await imprimer(page, doc(`<div class="flux">${u.html}</div>`, false));
    }
    corps.push(pdf);
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  const tailles = await Promise.all(corps.map(pagesDe));

  // Sommaire en deux passes : la première donne son nombre de pages, la seconde les vrais numéros.
  const avant = 1 + (await pagesDe(credits));
  const debutsAvec = (pagesSommaire: number) => {
    let n = avant + pagesSommaire + 1;
    return tailles.map((t) => ((n += t), n - t));
  };
  let tocPages = await pagesDe(await imprimer(page, doc(sommaire(livre, debutsAvec(1)), false)));
  const debuts = debutsAvec(tocPages);
  const toc = await imprimer(page, doc(sommaire(livre, debuts), false));
  tocPages = await pagesDe(toc);

  // Impression d'un seul tenant : chaque morceau commence sur une nouvelle page, donc le découpage retombe
  // sur les mêmes pages. Si le compte ne colle pas, on garde les impressions séparées.
  const morceauxHtml = [
    `<div class="flux">${livre.credits}</div>`,
    sommaire(livre, debuts),
    ...livre.unites.map((u) => (u.pleine ? u.html : `<div class="flux">${u.html}</div>`)),
  ];
  const attendu = [await pagesDe(credits), tocPages, ...tailles];
  const ensemble = await imprimer(page, doc(morceauxHtml.map((h, i) => `<section class="morceau${i ? " suite" : ""}">${h}</section>`).join(""), false));
  const ensDoc = await PDFDocument.load(ensemble);
  const unSeul = ensDoc.getPageCount() === attendu.reduce((a, b) => a + b, 0);
  if (!unSeul) console.warn(`  impression d'un seul tenant : ${ensDoc.getPageCount()} pages au lieu de ${attendu.reduce((a, b) => a + b, 0)}, impressions séparées gardées`);

  const final = await PDFDocument.create();
  final.setTitle(livre.titre);
  final.setAuthor("Mickael et sa table");
  final.setLanguage("fr-FR");
  const fond = await final.embedJpg(texture);
  const morceaux = [
    { pdf: couverture, parchemin: false },
    { pdf: credits, parchemin: true },
    { pdf: toc, parchemin: true },
    ...corps.map((pdf, i) => ({ pdf, parchemin: !livre.unites[i].pleine })),
  ];
  const formesEnsemble = unSeul ? await final.embedPages(ensDoc.getPages()) : [];
  let curseur = 0;
  for (const [i, m] of morceaux.entries()) {
    const formesSrc = unSeul && i > 0 ? formesEnsemble.slice(curseur, (curseur += attendu[i - 1])) : await final.embedPages((await PDFDocument.load(m.pdf)).getPages());
    for (const f of formesSrc) {
      const p = final.addPage([f.width, f.height]);
      if (m.parchemin) p.drawImage(fond, { x: 0, y: 0, width: f.width, height: f.height });
      p.drawPage(f, { x: 0, y: 0 });
    }
  }
  const total = final.getPageCount();

  // Calque : en-tête courant (sauf première page d'une ouverture) et folio (sauf couverture et crédits).
  const entetes: (string | null)[] = Array(total).fill(null);
  const folios: boolean[] = Array(total).fill(false);
  for (let p = avant; p < avant + tocPages; p++) folios[p] = true;
  livre.unites.forEach((u, i) => {
    for (let k = 0; k < tailles[i]; k++) {
      const p = debuts[i] - 1 + k;
      if (u.pleine) continue;
      folios[p] = true;
      if (!(u.ouverture && k === 0)) entetes[p] = u.entete;
    }
  });
  const calqueHtml = entetes
    .map((e, p) => `<div class="calque">${e ? `<div class="run">${esc(e)}</div>` : ""}${folios[p] ? `<div class="folio ${(p + 1) % 2 ? "d" : "g"}">${p + 1}</div>` : ""}</div>`)
    .join("");
  const calque = await PDFDocument.load(await imprimer(page, doc(calqueHtml, false), false));
  const formes = await final.embedPages(calque.getPages());
  final.getPages().forEach((p, i) => {
    if (entetes[i] || folios[i]) p.drawPage(formes[i], { x: 0, y: 0, width: p.getWidth(), height: p.getHeight() });
  });

  const chemin = join(out, `${livre.fichier}.pdf`);
  writeFileSync(chemin, await final.save());
  await browser.close();

  // Aperçus PNG : seulement si pdftoppm (poppler) est installé, ce qui n'est pas le cas par défaut sous Windows.
  try {
    for (const n of livre.apercus ?? []) {
      if (n > total) continue;
      execFileSync("pdftoppm", ["-f", String(n), "-l", String(n), "-r", "70", "-png", "-singlefile", chemin, join(out, `${livre.fichier}-p${n}`)]);
    }
  } catch {
    console.log(`${livre.titre} : aperçus PNG sautés (pdftoppm introuvable)`);
  }
  console.log(`${livre.titre} : ${total} pages → ${chemin}`);
  return { chemin, total, debuts };
}
