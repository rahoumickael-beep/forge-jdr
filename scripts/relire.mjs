// Relecture croisée gratuite : le texte écrit par une IA est relu par une autre famille d'IA (par OmniRoute).
// Gemini écrit → Mistral relit (par défaut) ; --modele pour choisir. Opus ne lit que les remarques.
//   node scripts/relire.mjs [--depuis <commit>] [--modele mistral/mistral-large-latest] [--sortie f.md] [chemins…]
// Relit les lignes Markdown ajoutées depuis le commit (HEAD par défaut). Clés dans .env (OMNIROUTE_URL, OMNIROUTE_API_KEY).
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
let depuis = "HEAD";
let modeles = ["mistral/mistral-large-latest", "mistral/mistral-medium-3-5", "gemini/gemini-3.8-flash", "gemini/gemini-3.7-flash"];
let sortie = "";
const chemins = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--depuis") depuis = args[++i];
  else if (args[i] === "--modele") modeles = [args[++i]];
  else if (args[i] === "--sortie") sortie = args[++i];
  else chemins.push(args[i]);
}
const env = Object.fromEntries(
  (existsSync(".env") ? readFileSync(".env", "utf8") : "").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const URL_ = process.env.OMNIROUTE_URL ?? env.OMNIROUTE_URL ?? "http://127.0.0.1:20128/v1";
const CLE = process.env.OMNIROUTE_API_KEY ?? env.OMNIROUTE_API_KEY;
if (!CLE) {
  console.error("OMNIROUTE_API_KEY manquant dans .env");
  process.exit(2);
}

const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 << 20 });
const portee = chemins.length ? ` -- ${chemins.map((c) => `"${c}"`).join(" ")}` : "";
const fichiers = [...new Set([...sh(`git diff --name-only ${depuis}${portee}`).split("\n"), ...sh(`git ls-files --others --exclude-standard${portee}`).split("\n")])].filter(
  (f) => f.endsWith(".md") && existsSync(f),
);
const texte = fichiers
  .map((f) => {
    const neuf = !sh(`git ls-files "${f}"`).trim();
    const lignes = neuf ? readFileSync(f, "utf8").split("\n") : sh(`git diff -U0 ${depuis} -- "${f}"`).split("\n").filter((l) => /^\+(?!\+\+)/.test(l)).map((l) => l.slice(1));
    return `### Fichier ${f}\n${lignes.join("\n")}`;
  })
  .join("\n\n");
if (!texte.trim()) {
  console.log("Rien à relire.");
  process.exit(0);
}

const CONSIGNE = `Tu es le relecteur exigeant d'un éditeur de jeux de rôle français. Le texte ci-dessous a été écrit par une autre IA pour un livre vendu en boutique.
Relève au plus 12 problèmes réels, les plus graves d'abord :
- tics d'écriture d'IA, phrases creuses, clichés, listes de trois adjectifs, conclusions morales ;
- contradictions internes (chiffres, distances, noms, dates) ;
- anachronismes pour le genre du monde ;
- un secret de MJ placé dans une section marquée [Joueurs] ;
- fautes de français ou de typographie française.
Format, une ligne par problème : - « citation exacte courte » → problème → correction proposée
Si le texte est bon, réponds seulement : RAS. Pas d'introduction, pas de conclusion.`;

// Morceaux d'environ 5 000 mots pour rester sous les limites des offres gratuites.
const morceaux = [];
let courant = [];
let n = 0;
for (const l of texte.split("\n")) {
  courant.push(l);
  n += l.split(/\s+/).length;
  if (n > 5000) {
    morceaux.push(courant.join("\n"));
    courant = [];
    n = 0;
  }
}
if (courant.length) morceaux.push(courant.join("\n"));

async function demander(contenu) {
  for (const modele of modeles) {
    for (let essai = 0; essai < 3; essai++) {
      const res = await fetch(`${URL_}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CLE}` },
        body: JSON.stringify({ model: modele, messages: [{ role: "system", content: CONSIGNE }, { role: "user", content: contenu }] }),
      }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
      if (res.ok) {
        const r = (await res.json()).choices?.[0]?.message?.content?.trim();
        if (r) return { modele, r };
      }
      if (res.status !== 429) break;
      await new Promise((ok) => setTimeout(ok, 5000 * (essai + 1)));
    }
  }
  return { modele: "aucun", r: "ÉCHEC : aucun modèle n'a répondu (quota ou panne)." };
}

const remarques = [];
for (const [i, m] of morceaux.entries()) {
  const { modele, r } = await demander(m);
  remarques.push(`## Morceau ${i + 1}/${morceaux.length} (${modele})\n${r}`);
}
const tout = remarques.join("\n\n");
const nb = (tout.match(/^- /gm) ?? []).length;
const echecs = (tout.match(/ÉCHEC/g) ?? []).length;
if (sortie) writeFileSync(sortie, tout);
console.log(`${fichiers.length} fichier(s), ${morceaux.length} morceau(x) relus · ${nb} remarque(s)${echecs ? ` · ${echecs} morceau(x) sans réponse` : ""}${sortie ? ` → ${sortie}` : ""}`);
if (!sortie) console.log(tout.slice(0, 4000));
