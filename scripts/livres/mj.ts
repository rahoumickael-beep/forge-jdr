// Guide du MJ : la bible du monde (tous les secrets), la magie et les morts, les accroches, les rencontres
// et le scénario d'ouverture de la bibliothèque.
import { readFileSync } from "node:fs";
import { crLabel, BESTIARY } from "../../shared/bestiary";
import { LIBRARY } from "../../shared/library";
import { DIFFICULTY_CLASSES, XP_BY_LEVEL } from "../../shared/rules";
import type { Scenario } from "../../shared/types";
import { CREDITS_SRD } from "./communs";
import { ouverture, type Livre, type Unite } from "./moteur";
import { esc, illustration, markdown, md } from "./texte";

const LORE = readFileSync("content/aubreterre/lore.md", "utf8").replace(/\r\n?/g, "\n"); // fichiers en CRLF sous Windows

/** Sections « ## N. Titre » de la bible, sans les lignes de travail (options de nom). */
function sections() {
  const out: { titre: string; corps: string }[] = [];
  for (const bloc of LORE.split(/\n(?=## )/)) {
    const m = bloc.match(/^## \d+\. (.+)\n/);
    if (!m) continue;
    const corps = bloc
      .slice(m[0].length)
      .split("\n")
      .filter((l) => !/^\*\*Options de nom/.test(l.trim()))
      .join("\n");
    out.push({ titre: m[1].trim(), corps });
  }
  return out;
}

/** Une planche par chapitre de la bible, dans la même lumière que les autres livres. */
const PLANCHES: Record<string, [string, string, string]> = {
  "Le monde en une page": ["mj-glas", "the night all the bells rang alone, a gothic imperial city under snow, bell towers, crowds in the streets looking up toward a copper dome", "La nuit du Glas, vue depuis le quartier des Cierges."],
  "Le continent et ses régions": ["mj-pallene", "an old painted map of a continent shaped like an open hand on a dark sea, a walled capital in the palm, roads like tendons, sea monsters in the margins", "Pallène, d'après une carte de la Chancellerie."],
  "Les trois héritiers": ["mj-heritiers", "three figures around a war table in a candlelit tent, a scarred grey-haired woman general in dented armour, a high priest in white and gold, a twelve-year-old girl holding a blue lantern", "Hersende, Cyprien et Ysé ne se sont jamais trouvés dans la même pièce."],
  "Les ordres indépendants": ["mj-ordres", "a crowded tavern of a river port, a dead-hunter with a square nail in his ear, a salt merchant with a signet ring, a woman with a blue lantern, a scribe with a violet-stained thumb", "Les ordres ne réclament pas le Trône. Ils le font tenir debout."],
  "Le panthéon": ["mj-pantheon", "a ruined chapel with painted saints on the walls, a washerwoman with a wooden paddle, a blacksmith with a square nail, a one-eyed scribe, offerings of coins at their feet", "Les saints répondent seuls depuis le Glas."],
  "La magie et son prix": ["mj-magie", "a mage tower of brick without a door at ground level, a brass scale hanging in a window tilting toward the ground, a crack in the cobbled square below glowing faintly", "La balance des Peseurs penche vers le sol."],
  "Les morts qui se relèvent": ["mj-morts", "a funeral vigil in a farmhouse at night, an old woman with a blue lantern sitting beside a body on a table, the corpse's fingers just starting to move", "La troisième nuit."],
  "Origines jouables": ["mj-origines", "a group of travellers at a crossroads shrine, a human, a tall forest elf, a stout dwarf, a halfling, a half-orc and a pale revenant woman with a black ribbon on her wrist", ""],
  Historiques: ["mj-historiques", "a deserter in a turned red cloak, a defrocked novice, and a salt smuggler sharing a fire under a bridge", ""],
  "Accroches de scénario": ["mj-accroches", "a dead god-emperor on a basalt throne seen from below, candle wax to his knees, an iron crown, a single ray of light from the dome", "Tout finit sous la Rotonde."],
};

function scenario(s: Scenario): string {
  const lire = (act: number) =>
    (s.readAloud ?? [])
      .filter((r) => r.act === act)
      .map((r) => `<aside class="encart"><h4>À lire${r.title ? ` · ${esc(r.title)}` : ""}</h4><p><em>${md(r.text)}</em></p></aside>`)
      .join("");
  const choix = (act: number) =>
    (s.choices ?? [])
      .filter((c) => c.act === act)
      .map((c) => `<aside class="encart dark"><h4>Choix · ${esc(c.title)}</h4><ul>${c.options.map((o) => `<li><strong>${md(o.label)}.</strong> ${md(o.consequence)}</li>`).join("")}</ul></aside>`)
      .join("");
  return `
    <div class="cols">
      <p class="lettrine">${md(s.hook)}</p>
      <h3>L'histoire</h3><p>${md(s.synopsis)}</p>
      ${s.gmNotes ? `<h3>Ce que le scénario doit faire passer</h3>${markdown(s.gmNotes).replace(' class="lettrine"', "")}` : ""}
      ${s.acts
        .map((a, i) => `<h3>Acte ${i + 1} · ${esc(a.title)}</h3><p><em>${md(a.location)}</em></p>${lire(i + 1)}<p>${md(a.summary)}</p>${choix(i + 1)}`)
        .join("")}
      <h3>L'adversaire</h3><h4>${esc(s.villain.name)}</h4><p>${md(s.villain.description)}</p><p><strong>Ce qu'il veut.</strong> ${md(s.villain.motivation)}</p>
      <h3>Les personnages</h3>
      <dl class="feats">${s.npcs.map((n) => `<dt>${esc(n.name)}</dt><dd><em>${md(n.role)}.</em> ${n.voice ? `${md(n.voice)} ` : ""}<strong>Secret :</strong> ${md(n.secret)}</dd>`).join("")}</dl>
      <h3>Les rencontres</h3>
      ${s.encounters
        .map((e) => `<div class="bloc"><h4>${esc(e.title)}</h4><p>${md(e.description)}</p><table class="tab"><thead><tr><th>Adversaire</th><th>Nb</th><th>PV</th><th>CA</th><th>Attaque</th></tr></thead><tbody>${e.enemies.map((x) => `<tr><td>${esc(x.name)}</td><td>${x.count}</td><td>${x.hp}</td><td>${x.ac}</td><td>${esc(x.attack)}</td></tr>`).join("")}</tbody></table><p><em>Difficulté : ${esc(e.difficulty)}.</em></p></div>`)
        .join("")}
      <h3>Retournements</h3><ul>${s.twists.map((t) => `<li>${md(t)}</li>`).join("")}</ul>
      <h3>Récompenses</h3><ul>${s.rewards.map((t) => `<li>${md(t)}</li>`).join("")}</ul>
    </div>`;
}

const SEUILS = [
  [25, 50, 75, 100], [50, 100, 150, 200], [75, 150, 225, 400], [125, 250, 375, 500], [250, 500, 750, 1100],
  [300, 600, 900, 1400], [350, 750, 1100, 1700], [450, 900, 1400, 2100], [550, 1100, 1600, 2400], [600, 1200, 1900, 2800],
  [800, 1600, 2400, 3600], [1000, 2000, 3000, 4500], [1100, 2200, 3400, 5100], [1250, 2500, 3800, 5700], [1400, 2800, 4300, 6400],
  [1600, 3200, 4800, 7200], [2000, 3900, 5900, 8800], [2100, 4200, 6300, 9500], [2400, 4900, 7300, 10900], [2800, 5700, 8500, 12700],
];

function rencontres(): string {
  return `<div class="cols">
    <p class="lettrine">Un combat en Aubreterre se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Le bestiaire donne la puissance et les PX de chaque créature.</p>
    <h3>Seuils de difficulté par personnage</h3>
    <p>Multipliez par le nombre de personnages pour obtenir le seuil du groupe.</p>
    <table class="tab long"><thead><tr><th>Niv.</th><th>Facile</th><th>Moyen</th><th>Difficile</th><th>Mortel</th></tr></thead><tbody>${SEUILS.map((s, i) => `<tr><td>${i + 1}</td>${s.map((x) => `<td>${x.toLocaleString("fr-FR")}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <h3>Le nombre d'adversaires</h3>
    <table class="tab"><thead><tr><th>Adversaires</th><th>Multiplicateur</th></tr></thead><tbody>
      <tr><td>1</td><td>× 1</td></tr><tr><td>2</td><td>× 1,5</td></tr><tr><td>3 à 6</td><td>× 2</td></tr><tr><td>7 à 10</td><td>× 2,5</td></tr><tr><td>11 à 14</td><td>× 3</td></tr><tr><td>15 et plus</td><td>× 4</td></tr>
    </tbody></table>
    <aside class="encart"><h4>Les morts comptent autrement</h4><p>Un groupe de Levés qui marche vers l'est n'est pas une embuscade : tant qu'on ne lui barre pas la route, il passe. Comptez la rencontre comme facile si les joueurs peuvent s'écarter, et laissez-les découvrir ce qui arrive quand ils ne le font pas.</p></aside>
    <h3>Les degrés de difficulté</h3>
    <table class="tab"><thead><tr><th>Tâche</th><th>DD</th></tr></thead><tbody>${DIFFICULTY_CLASSES.map((d) => `<tr><td>${esc(d.label)}</td><td>${d.dd}</td></tr>`).join("")}</tbody></table>
    <h3>Progression</h3>
    <table class="tab long"><thead><tr><th>Niv.</th><th>PX requis</th><th>Niv.</th><th>PX requis</th></tr></thead><tbody>${Array.from({ length: 10 }, (_, i) => `<tr><td>${i + 1}</td><td>${XP_BY_LEVEL[i + 1].toLocaleString("fr-FR")}</td><td>${i + 11}</td><td>${XP_BY_LEVEL[i + 11].toLocaleString("fr-FR")}</td></tr>`).join("")}</tbody></table>
    <h3>Adversaires par palier</h3>
    ${[
      ["Niveaux 1 à 4", 0, 2],
      ["Niveaux 5 à 10", 3, 8],
      ["Niveaux 11 à 16", 9, 15],
      ["Niveaux 17 à 20", 16, 30],
    ]
      .map(([t, a, b]) => `<h4>${t}</h4><p>${BESTIARY.filter((c) => c.cr >= (a as number) && c.cr <= (b as number)).sort((x, y) => x.cr - y.cr).map((c) => `${esc(c.name)} (${crLabel(c.cr)})`).join(", ")}.</p>`)
      .join("")}
  </div>`;
}

export function guideMj(): Livre {
  const unites: Unite[] = [];
  const secs = sections();
  secs.forEach((s, i) => {
    const p = PLANCHES[s.titre];
    unites.push({
      titre: s.titre,
      marque: `Chapitre ${i + 1}`,
      niveau: 1,
      entete: `Guide du MJ · ${s.titre}`,
      ouverture: true,
      html: `${ouverture(`Chapitre ${i + 1}`, s.titre)}${p ? illustration(p[0], p[1], "large", p[2]) : ""}<div class="cols">${markdown(s.corps)}</div>`,
    });
  });
  const n = secs.length;
  unites.push({
    titre: "Construire une rencontre",
    marque: `Chapitre ${n + 1}`,
    niveau: 1,
    entete: "Guide du MJ · Rencontres",
    ouverture: true,
    html: ouverture(`Chapitre ${n + 1}`, "Construire une rencontre", "Les chiffres de la cinquième édition, et ce que les morts y changent.") + rencontres(),
  });
  LIBRARY.filter((s) => s.genre === "fantasy").forEach((s, i) => {
    unites.push({
      titre: s.title,
      marque: i === 0 ? "Scénario" : "",
      niveau: 1,
      entete: `Scénario · ${s.title}`,
      ouverture: true,
      html: `${ouverture(`Scénario ${i + 1} · niveau ${s.level}`, s.title, s.hook.split(". ")[0] + ".")}${illustration(`scenario-${s.id}`, "a village of stilt houses in a misty black peat bog, plank walkways, a flat ferry barge poled by a tall stooped man, risen dead standing waist-deep in the reeds facing east", "large")}${scenario(s)}`,
    });
  });

  return {
    fichier: "guide-du-mj-aubreterre",
    titre: "Guide du MJ d'Aubreterre",
    couverture: `${illustration("couverture-mj", "a hooded figure descending a spiral stair carved in black basalt beneath a throne, holding a candle, cracks of cold light in the walls, an enormous closed eye carved into the stone far below", "pleine")}
      <div class="cover-title"><div class="cover-kicker">Le Trône du Dieu Mort</div><h1>Guide<br>du MJ</h1><div class="cover-rule"></div><div class="cover-sub">Les secrets d'Aubreterre · le Sceau · le Dessous</div></div>
      <div class="cover-foot">Réservé au meneur de jeu</div>`,
    credits: CREDITS_SRD("Guide du MJ d'Aubreterre"),
    unites,
    apercus: [1, 5, 6, 12],
  };
}
