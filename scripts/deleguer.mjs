// Délègue une tâche à une IA gratuite (Antigravity, quota Google) pour épargner l'abonnement Claude.
// Opus garde la main : il écrit la consigne, lance ce script, puis contrôle le résultat (git diff, tests).
//
//   node scripts/deleguer.mjs [--modele flash|argon|sonnet|opus] [--ecrire] [--sortie fichier] consigne.md
//   node scripts/deleguer.mjs --modele flash "question courte"
//
// --ecrire : l'agent peut modifier les fichiers du dépôt (sinon il lit et répond seulement).
// La réponse est écrite dans --sortie si donné, sinon affichée (coupée à 4 000 caractères).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MODELES = {
  flash: "gemini-3.8-flash-medium", // tâches mécaniques, vérifications
  argon: "gemini-4-argon-medium", // écriture, relecture, code courant
  sonnet: "claude-sonnet-5-5-medium",
  opus: "claude-opus-5-5-medium",
};

const args = process.argv.slice(2);
let modele = "argon";
let ecrire = false;
let sortie = "";
const reste = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--modele") modele = args[++i];
  else if (args[i] === "--ecrire") ecrire = true;
  else if (args[i] === "--sortie") sortie = args[++i];
  else reste.push(args[i]);
}
if (!reste.length || !MODELES[modele]) {
  console.error(`Usage : node scripts/deleguer.mjs [--modele ${Object.keys(MODELES).join("|")}] [--ecrire] [--sortie f] consigne`);
  process.exit(1);
}
const brut = reste.join(" ");
const consigne = existsSync(brut) ? readFileSync(brut, "utf8") : brut;
const cadre =
  "Projet Forge JdR : lis CLAUDE.md pour les règles (français, canon du monde, aucun texte qui sonne IA). " +
  (ecrire ? "Tu peux modifier les fichiers nécessaires, rien d'autre ; ne committe pas, ne lance aucun serveur. " : "Ne modifie aucun fichier. ") +
  "Termine par un résumé de 5 lignes maximum de ce que tu as fait.\n\n";

const agy = join(homedir(), ".gemini", "bin", process.platform === "win32" ? "agy.exe" : "agy");
const opts = ["--model", MODELES[modele], "--print-timeout", "900s", "-p", cadre + consigne];
if (ecrire) opts.unshift("--mode", "accept-edits", "--dangerously-skip-permissions");

let texte;
try {
  texte = execFileSync(agy, opts, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });
} catch (err) {
  console.error(`Échec de la délégation (${MODELES[modele]}) :\n${String(err.stderr || err.message).slice(-1500)}`);
  process.exit(2);
}
if (sortie) {
  writeFileSync(sortie, texte);
  console.log(`Réponse (${texte.length} caractères) dans ${sortie}`);
} else {
  console.log(texte.length > 4000 ? `${texte.slice(0, 4000)}\n[… coupé, ${texte.length} caractères : utiliser --sortie]` : texte);
}
