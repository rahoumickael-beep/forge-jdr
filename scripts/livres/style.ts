// Feuille de style des livres d'Aubreterre : parchemin, Cinzel, EB Garamond, deux colonnes.
// Couleurs et polices de base tirées de la charte fantasy (shared/charte.ts), comme dans l'appli.
import { CHARTES } from "../../shared/charte";

const { palette: P, polices: F } = CHARTES.fantasy;

export const POLICES =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=IM+Fell+English+SC&display=swap";

const BRUIT_FIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .18  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const TACHES =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='4' seed='4'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .2  0 0 0 .16 0'/></filter><rect width='100%' height='100%' filter='url(%23m)'/></svg>\")";

export const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: "${F.texte}", Georgia, serif; color: ${P.encre}; font-size: 10.2pt; line-height: 1.34; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Fond de parchemin répété sur chaque page imprimée (élément fixe). */
.parchemin { position: fixed; inset: 0; z-index: -1; background-color: ${P.papier};
  background-image: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(110,70,30,.28) 100%), ${BRUIT_FIN}, ${TACHES}; }

/* Le texte coule de page en page ; les marges sont recopiées sur chaque fragment. */
.flux { padding: 21mm 17mm 19mm; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.cols { column-count: 2; column-gap: 8mm; column-rule: .4pt solid #a07a4066; orphans: 3; widows: 3; }
.saut { break-before: page; height: 0; }
.morceau.suite { break-before: page; }
.bloc { break-inside: avoid; }

h1, h2, h3, h4, h5 { font-family: "${F.titre}", serif; font-weight: 600; color: #6e2414; margin: 0; break-after: avoid; }
h3 { font-size: 13pt; margin: 3.5mm 0 1.5mm; border-bottom: .6pt solid #a07a40; padding-bottom: .6mm; }
h4 { font-size: 10.8pt; margin: 2.6mm 0 .8mm; }
h5 { font-size: 9.6pt; margin: 2mm 0 .6mm; }
.cols > h3:first-child, .cols > h4:first-child { margin-top: 0; }
p { margin: 0 0 2.2mm; text-align: justify; hyphens: auto; }
ul, ol { margin: 0 0 2.4mm; padding-left: 5mm; }
li { margin-bottom: .8mm; text-align: justify; hyphens: auto; }
li::marker { color: #8a5a2a; }
strong { color: #3a2010; }
.lettrine::first-letter { font-family: "Cinzel Decorative", serif; float: left; font-size: 38pt; line-height: .82; padding: 1mm 2mm 0 0; margin-bottom: -1mm; color: #7a2e1c; text-shadow: 1px 1px 0 #d9b56a; }
.orn { text-align: center; color: #8a5a2a; font-size: 16pt; margin: 2mm 0; }
.center { text-align: center; }

/* Ouverture de chapitre */
.ouverture { text-align: center; margin: 4mm 0 5mm; }
.ouverture .num { font-family: "IM Fell English SC", serif; color: #8a5a2a; letter-spacing: .2em; font-size: 10.5pt; }
.ouverture h2 { font-size: 28pt; letter-spacing: .03em; margin-top: 1mm; text-shadow: 0 1px 0 #f6e9c9; }
.ouverture .chapeau { font-style: italic; color: #5a3a1e; font-size: 11.6pt; max-width: 140mm; margin: 2mm auto 0; text-align: center; }

/* Têtes de fiche (classe, origine, créature) */
.tete { text-align: center; margin-bottom: 4mm; break-after: avoid; }
.tete h2 { font-size: 26pt; letter-spacing: .04em; text-shadow: 0 1px 0 #f6e9c9; }
.tete .pitch { text-align: center; font-style: italic; color: #5a3a1e; font-size: 11.6pt; margin-top: 1mm; }
.tete .sous { font-family: "IM Fell English SC", serif; color: #8a5a2a; letter-spacing: .14em; font-size: 9.6pt; }

/* Illustrations */
.illu { margin: 0 0 3.5mm; position: relative; break-inside: avoid; }
.illu img { display: block; width: 100%; height: 100%; object-fit: cover; border: 1.2pt solid #3a2614; box-shadow: 0 0 0 1.2mm #efe2c4, 0 0 0 1.6mm #8a5a2a, 2px 4px 10px rgba(0,0,0,.35); }
.illu.large { height: 84mm; margin-bottom: 5mm; }
.illu.colonne { height: 92mm; }
.illu.portrait { height: 70mm; }
.illu.pleine { position: absolute; inset: 0; margin: 0; }
.illu.pleine img { border: 0; box-shadow: none; }
.illu figcaption { font-style: italic; font-size: 8.6pt; text-align: center; color: #5a3a1e; margin-top: 2.6mm; }
.illu.wait.pleine { height: 100%; }
.wait-inner { height: 100%; border: 1pt dashed #8a5a2a; background: repeating-linear-gradient(45deg, rgba(138,90,42,.06) 0 6px, transparent 6px 12px); padding: 4mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 1.5mm; }
.wait-title { font-family: Cinzel, serif; color: #7a2e1c; font-size: 10pt; }
.wait-inner code { font-size: 8pt; color: #5a3a1e; }
.wait-inner p { font-size: 7.6pt; line-height: 1.25; text-align: center; color: #6a4a2a; margin: 0; }

/* Encadrés */
.encart { break-inside: avoid; margin: 3mm 0; padding: 3mm 4mm; background: rgba(122,46,28,.08); border-top: 1.4pt solid #7a2e1c; border-bottom: 1.4pt solid #7a2e1c; }
.encart h4 { font-size: 10.5pt; margin: 0 0 1mm; }
.encart p, .encart li { font-size: 9.8pt; }
.encart p:last-child, .encart ul:last-child { margin-bottom: 0; }
.encart.dark { background: #2c2118; color: #efe2c4; border-color: #b8893e; }
.encart.dark h4 { color: #e2c27a; }
.encart.dark strong { color: #f3dca6; }

/* Listes de définitions (traits, aptitudes) */
.feats { margin: 0 0 2mm; }
.feats dt { font-family: Cinzel, serif; font-size: 9.2pt; color: #6e2414; font-weight: 600; margin-top: 1.2mm; break-after: avoid; }
.feats dd { margin: 0; text-align: justify; hyphens: auto; }

/* Tableaux */
table.tab, table.progress { width: 100%; border-collapse: collapse; margin: 1mm 0 3.5mm; font-size: 9pt; break-inside: avoid; }
.tab th, .progress th { font-family: Cinzel, serif; font-size: 8.2pt; text-align: left; color: #6e2414; border-bottom: 1pt solid #6e2414; padding: .8mm 1.6mm; vertical-align: bottom; }
.tab td, .progress td { padding: .5mm 1.6mm; vertical-align: top; }
.tab tr:nth-child(even) td, .progress tr:nth-child(even) td { background: rgba(160,122,64,.14); }
table.tab.long { break-inside: auto; }
.progress td:first-child, .progress td:nth-child(2) { width: 13mm; font-variant-numeric: tabular-nums; }

/* Pouvoirs de classe */
.power { break-inside: avoid; margin-bottom: 2.4mm; }
.power h4 { font-size: 10.2pt; margin: 0; }
.power-meta { font-style: italic; font-size: 8.8pt; color: #7a5a3a; margin-bottom: .6mm; }
.power p { margin: 0; }

/* Fiche de créature 5e */
.statblock { break-inside: avoid; background: #f5ead0; padding: 3mm 3.5mm; border-top: 2.2pt solid #7a2e1c; border-bottom: 2.2pt solid #7a2e1c; box-shadow: 1px 2px 6px rgba(0,0,0,.25); font-size: 9.4pt; margin-bottom: 3mm; }
.statblock h4 { font-size: 14pt; color: #6e2414; margin: 0; }
.statblock h5 { font-size: 10.6pt; border-bottom: .6pt solid #7a2e1c; margin: 2mm 0 1mm; }
.statblock p { margin: 0 0 .8mm; text-align: left; hyphens: auto; }
.statblock hr { border: 0; height: 1.6pt; background: linear-gradient(90deg, #7a2e1c, transparent); margin: 1.4mm 0; }
.sb-type { font-style: italic; font-size: 9pt; }
.abil { width: 100%; text-align: center; font-size: 9pt; color: #6e2414; }
.abil th { font-family: Cinzel, serif; font-size: 8.4pt; }

/* Page de créature : planche plus basse, et la fiche passe d'une colonne à l'autre comme dans les manuels 5e. */
.creature .illu.large { height: 74mm; }
.creature.longue .illu.large { height: 150mm; }
.creature .statblock { break-inside: auto; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.creature .statblock h5, .creature .statblock p, .creature .statblock table { break-inside: avoid; }
.creature .statblock h5 { break-after: avoid; }

/* Sommaire */
.sommaire { max-width: 150mm; margin: 0 auto; }
.sommaire h2 { text-align: center; font-size: 24pt; margin-bottom: 6mm; }
.toc { display: flex; align-items: baseline; gap: 2mm; margin: 0 0 1.6mm; break-inside: avoid; }
.toc .t { font-family: Cinzel, serif; font-size: 11pt; color: #6e2414; }
.toc .k { font-family: "IM Fell English SC", serif; color: #8a5a2a; font-size: 9.6pt; letter-spacing: .1em; width: 24mm; flex: none; }
.toc .d { flex: 1; border-bottom: 1pt dotted #a07a40; transform: translateY(-1mm); }
.toc .n { font-family: Cinzel, serif; font-size: 11pt; color: #5a3a1e; font-variant-numeric: tabular-nums; }
.toc.sub { margin-left: 26mm; }
.toc.sub .t { font-family: "EB Garamond", serif; font-size: 10.4pt; color: #3a2614; }

/* Couverture */
.couverture { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #1a120c; }
.couverture .illu.wait .wait-inner { background: radial-gradient(ellipse at 50% 40%, #4a3524, #120c08 75%); border: 0; color: #d9c49a; justify-content: flex-end; padding-bottom: 34mm; }
.couverture .illu.wait .wait-inner p, .couverture .illu.wait code { color: #b39a6e; max-width: 120mm; }
.couverture::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,6,4,.85) 0%, transparent 32%, transparent 62%, rgba(10,6,4,.92) 100%); pointer-events: none; }
.cover-title { position: absolute; top: 18mm; left: 0; right: 0; text-align: center; z-index: 2; }
.cover-kicker { font-family: "IM Fell English SC", serif; color: #d9b56a; letter-spacing: .4em; font-size: 12pt; }
.couverture h1 { font-family: "Cinzel Decorative", serif; font-size: 48pt; line-height: 1.02; color: #f1d58e; text-shadow: 0 2px 0 #5a3a10, 0 0 30px rgba(0,0,0,.9); margin-top: 3mm; letter-spacing: .02em; }
.cover-rule { width: 80mm; height: 8px; margin: 5mm auto; background: linear-gradient(90deg, transparent, #c9a048, transparent); mask: radial-gradient(circle, #000 1.5px, transparent 2px) 0 0/8px 8px; }
.cover-sub { font-family: Cinzel, serif; color: #e7d3a4; font-size: 11pt; letter-spacing: .12em; }
.cover-foot { position: absolute; bottom: 14mm; left: 0; right: 0; text-align: center; z-index: 2; font-family: "IM Fell English SC", serif; color: #cdb07a; letter-spacing: .3em; font-size: 10pt; }

/* Page de crédits */
.credits { min-height: 257mm; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.credits > div { max-width: 125mm; }
.credits h2 { text-align: center; font-size: 20pt; font-variant: small-caps; }
.legal { margin-top: 12mm; font-size: 8.4pt; color: #5a3a1e; }
.legal p { text-align: left; }

/* Calque des en-têtes et folios (imprimé par-dessus, fond transparent) */
.calque { width: 210mm; height: 297mm; position: relative; break-after: page; }
.calque .run { position: absolute; top: 9mm; left: 17mm; right: 17mm; text-align: center; font-family: "IM Fell English SC", serif; font-size: 9pt; color: #7a2e1c; letter-spacing: .08em; border-bottom: .4pt solid #7a2e1c88; padding-bottom: 1.5mm; }
.calque .folio { position: absolute; bottom: 8mm; font-family: Cinzel, serif; font-size: 9pt; color: #5a3a1e; }
.calque .folio.g { left: 17mm; } .calque .folio.d { right: 17mm; }
.calque .folio::before, .calque .folio::after { content: "—"; margin: 0 2.4mm; color: #a07a40; }
`;
