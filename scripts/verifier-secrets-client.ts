// Contrôle après `npm run build` : aucun secret du MJ dans le code qu'un joueur peut télécharger.
// Le code du MJ est rangé dans les fichiers dist/assets/mj-*, que le serveur ne sert qu'avec la clé du MJ ;
// tout le reste (page, script principal, autres morceaux) doit être propre.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BESTIARY } from "../shared/bestiary";
import { CANONS } from "../shared/canon";
import { LIBRARY } from "../shared/library";

const dist = process.argv[2] ?? "dist";
const extrait = (s: string) => s.slice(0, 80);

const marqueurs = new Set<string>();
for (const c of Object.values(CANONS)) for (const s of c?.secrets ?? []) marqueurs.add(s);
for (const b of BESTIARY) if (b.gmNotes) marqueurs.add(extrait(b.gmNotes));
for (const sc of LIBRARY) {
  for (const n of sc.npcs) if (n.secret) marqueurs.add(extrait(n.secret));
  for (const t of sc.twists) marqueurs.add(extrait(t));
  if (sc.villain?.motivation) marqueurs.add(extrait(sc.villain.motivation));
}

const fichiers = [join(dist, "index.html"), ...readdirSync(join(dist, "assets")).filter((f) => !f.startsWith("mj-")).map((f) => join(dist, "assets", f))];
const mj = readdirSync(join(dist, "assets")).filter((f) => f.startsWith("mj-") && f.endsWith(".js"));

const fuites: string[] = [];
for (const f of fichiers) {
  if (!/\.(js|html|css)$/.test(f)) continue;
  // Les accents sont parfois échappés par le bundler : on compare aussi la forme \uXXXX.
  const texte = readFileSync(f, "utf8").replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  for (const m of marqueurs) if (texte.includes(m)) fuites.push(`${f} : « ${m} »`);
}

if (!mj.length) fuites.push("aucun fichier mj-*.js : le code du MJ n'est plus séparé, la frontière est cassée");
if (fuites.length) {
  console.error(`Secrets du MJ visibles par un joueur (${fuites.length}) :\n${fuites.slice(0, 30).join("\n")}`);
  process.exit(1);
}
console.log(`Aucun secret dans le code des joueurs (${marqueurs.size} marqueurs, ${fichiers.length} fichiers ; code du MJ : ${mj.join(", ")}).`);
