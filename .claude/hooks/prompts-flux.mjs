// Avant d'écrire un prompt Flux : refuse une négation (Flux dessine ce qu'on nie) ou un objet anachronique.
// Règles dans comfyui/regles-flux.json. Seuls les prompts nouveaux ou modifiés sont contrôlés.
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const ti = input.tool_input ?? {};
const file = relative(root, String(ti.file_path ?? "")).replaceAll("\\", "/");

// Fichiers qui contiennent des prompts : Aubreterre (fantasy) ou l'Archipel (science-fiction, fichiers archipel-*).
const jsonPrompts = /^comfyui\/prompts-[^/]+\.json$/.test(file);
const archipel = /^shared\/(canon\/)?archipel-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-archipel\.ts$/.test(file) || /^comfyui\/prompts-archipel[^/]*\.json$/.test(file);
const ternelande = /^shared\/(canon\/)?ternelande-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-ternelande\.ts$/.test(file);
const residence = /^shared\/(canon\/)?residence-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-residence\.ts$/.test(file);
const noyes = /^shared\/(canon\/)?noyes-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-noyes\.ts$/.test(file);
const sec = /^shared\/(canon\/)?sec-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-sec\.ts$/.test(file);
const asile = /^shared\/(canon\/)?asile-[^/]+\.ts$/.test(file) || /^scripts\/livres\/monde-asile\.ts$/.test(file);
const tsPrompts = file === "shared/bestiary.ts" || /^scripts\/livres\/[^/]+\.ts$/.test(file) || archipel || ternelande || residence || noyes || sec || asile;
if (!jsonPrompts && !tsPrompts) process.exit(0);

const regles = JSON.parse(readFileSync(join(root, "comfyui", "regles-flux.json"), "utf8"));
const negation = new RegExp(regles.negation, "i");
const anachronisme = new RegExp(regles.anachronismes[archipel ? "science-fiction" : residence ? "cyberpunk" : noyes ? "horreur" : sec ? "post-apo" : asile ? "western" : ternelande ? "dark-fantasy" : "fantasy"], "i");

/** Prompts trouvés dans un morceau de fichier. */
function prompts(text) {
  if (!text) return [];
  if (jsonPrompts) return [...text.matchAll(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  // TypeScript : les longues chaînes en anglais (scènes, portraits, styles).
  return [...text.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)]
    .map((m) => m[2])
    .filter((s) => s.length >= 100 && /\b(the|with|and|of)\b/.test(s) && !/[éèàùç]/.test(s));
}

const before = new Set(ti.old_string !== undefined ? prompts(ti.old_string) : existsSync(ti.file_path ?? "") ? prompts(readFileSync(ti.file_path, "utf8")) : []);
const written = ti.content ?? ti.new_string ?? (ti.edits ?? []).map((e) => e.new_string).join("\n");
const fautes = [];
for (const p of prompts(written)) {
  if (before.has(p)) continue;
  const n = p.match(negation);
  const a = p.match(anachronisme);
  if (n) fautes.push(`négation « ${n[0].trim()} » : Flux dessinera ce qui est nié. Décris ce qu'on voit à la place.`);
  if (a) fautes.push(archipel || residence || noyes || sec || asile ? `« ${a[0]} » : copie d'une licence connue, objet d'après 1923 ou monde réel, hors du monde.` : `« ${a[0]} » : objet anachronique ou qui appelle des poteaux et des câbles dans un monde préindustriel.`);
  if (n || a) fautes.push(`   … ${p.slice(0, 120)}…`);
}
if (fautes.length) {
  console.error(`Prompt Flux refusé dans ${file} :\n${fautes.join("\n")}`);
  process.exit(2);
}
