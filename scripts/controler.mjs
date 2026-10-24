// Contrôle sans IA d'un travail délégué : Opus ne lit que le bilan (quelques lignes), sauf alerte.
//   node scripts/controler.mjs [--depuis <commit>] [--tests] [chemins…]
// Par défaut : ce qui a changé depuis le dernier commit (fichiers suivis et nouveaux).
// --tests : ajoute les types et les tests du canon. Code de sortie 1 s'il y a une alerte.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
let depuis = "HEAD";
let tests = false;
const chemins = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--depuis") depuis = args[++i];
  else if (args[i] === "--tests") tests = true;
  else chemins.push(args[i]);
}
const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });
const portee = chemins.length ? ` -- ${chemins.map((c) => `"${c}"`).join(" ")}` : "";

// Tics d'écriture d'IA et mots creux : à ne pas laisser passer dans un livre vendu.
const TICS = [
  /au c(œ|oe)ur d(e|u|es)/i, /\bnich(é|ée|és|ées)\b/i, /myst(é|e)rieu(x|se|ses)/i, /tapisserie/i, /t(é|e)moigne(nt)? d/i,
  /\bv(é|e)ritable\b/i, /il est important de/i, /\bincontournable/i, /\bfascinant/i, /\bimmersi(f|ve)/i,
  /\bun m(é|e)lange de\b/i, /\bà la fois\b.*\bet\b/i, /\bsubtil(e|es|s)?\b/i, /\bdans l'ombre de\b/i, /\bun rappel\b/i,
];
const fichiers = [
  ...new Set([
    ...sh(`git diff --name-only ${depuis}${portee}`).split("\n"),
    ...sh(`git ls-files --others --exclude-standard${portee}`).split("\n"),
  ]),
].filter((f) => f && existsSync(f));

const alertes = [];
let ajoutees = 0;
let retirees = 0;
let mots = 0;
const tics = [];
let typo = 0;
for (const f of fichiers) {
  const neuf = !sh(`git ls-files "${f}"`).trim();
  const lignes = neuf
    ? readFileSync(f, "utf8").split("\n").map((l) => `+${l}`)
    : sh(`git diff -U0 ${depuis} -- "${f}"`).split("\n").filter((l) => /^[+-](?![+-]{2})/.test(l));
  for (const l of lignes) {
    if (l[0] === "-") { retirees++; continue; }
    ajoutees++;
    if (!/\.(md|ts|tsx|json)$/.test(f)) continue;
    const texte = l.slice(1);
    if (/\.md$/.test(f)) mots += texte.split(/\s+/).filter(Boolean).length;
    for (const t of TICS) {
      const m = texte.match(t);
      if (m) tics.push(`${f.split("/").pop()} « ${m[0]} »`);
    }
    // Typographie française : espace avant ; : ! ? dans le texte (pas dans le code ni les liens).
    if (/\.md$/.test(f)) typo += (texte.replace(/https?:\/\/\S+|`[^`]*`|\|/g, "").match(/[^\s  («][;!?]|[^\s  \d(«*][:](?=\s)/g) ?? []).length;
  }
}

console.log(`Fichiers : ${fichiers.length} (${fichiers.slice(0, 6).map((f) => f.split("/").pop()).join(", ")}${fichiers.length > 6 ? "…" : ""}) · +${ajoutees} −${retirees} lignes · ${mots} mots ajoutés en Markdown`);
if (retirees > ajoutees / 3 && retirees > 20) alertes.push(`beaucoup de lignes retirées (${retirees}) : texte existant réécrit ?`);
if (tics.length) alertes.push(`${tics.length} tic(s) d'écriture : ${[...new Set(tics)].slice(0, 6).join(", ")}`);
if (typo > 5) alertes.push(`${typo} ponctuations sans espace avant (; : ! ?)`);

if (tests) {
  for (const [nom, cmd] of [["types", "npx tsc --noEmit -p ."], ["canon", "npx tsx --test shared/canon.test.ts"]]) {
    try {
      sh(cmd);
      console.log(`Tests ${nom} : ok`);
    } catch (e) {
      const sortie = `${e.stdout ?? ""}${e.stderr ?? ""}`;
      const echecs = sortie.split("\n").filter((l) => /error TS|✖|not ok|AssertionError/.test(l)).slice(0, 4);
      alertes.push(`tests ${nom} en échec : ${echecs.join(" | ").slice(0, 400)}`);
    }
  }
}
console.log(alertes.length ? `ALERTES :\n- ${alertes.join("\n- ")}` : "Aucune alerte.");
process.exit(alertes.length ? 1 : 0);
