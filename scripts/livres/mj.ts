// Guide du MJ : la bible du monde (tous les secrets), la magie et les morts, les accroches, les rencontres
// et le scénario d'ouverture de la bibliothèque.
import { readFileSync } from "node:fs";
import { crLabel, BESTIARY } from "../../shared/bestiary";
import { LIBRARY } from "../../shared/library";
import { DIFFICULTY_CLASSES, XP_BY_LEVEL } from "../../shared/rules";
import type { Scenario } from "../../shared/types";
import { CREDITS_SRD } from "./communs";
import { MONDE } from "./monde";
import { ouverture, type Livre, type Unite } from "./moteur";
import { esc, illustration, markdown, md } from "./texte";

const LORE = readFileSync(`${MONDE.dossier}/lore.md`, "utf8").replace(/\r\n?/g, "\n"); // fichiers en CRLF sous Windows

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
    // Les niveaux de lecture de la bible ([Joueurs], [MJ], [Secret]) restent dans le texte, pas dans les titres.
    out.push({ titre: m[1].replace(/\s*\[(Joueurs|MJ|Secret)\]/g, "").trim(), corps });
  }
  return out;
}

const PLANCHES = MONDE.mj.planches;

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
    <p class="lettrine">${MONDE.mj.introRencontres}</p>
    <h3>Seuils de difficulté par personnage</h3>
    <p>Multipliez par le nombre de personnages pour obtenir le seuil du groupe.</p>
    <table class="tab long"><thead><tr><th>Niv.</th><th>Facile</th><th>Moyen</th><th>Difficile</th><th>Mortel</th></tr></thead><tbody>${SEUILS.map((s, i) => `<tr><td>${i + 1}</td>${s.map((x) => `<td>${x.toLocaleString("fr-FR")}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <h3>Le nombre d'adversaires</h3>
    <table class="tab"><thead><tr><th>Adversaires</th><th>Multiplicateur</th></tr></thead><tbody>
      <tr><td>1</td><td>× 1</td></tr><tr><td>2</td><td>× 1,5</td></tr><tr><td>3 à 6</td><td>× 2</td></tr><tr><td>7 à 10</td><td>× 2,5</td></tr><tr><td>11 à 14</td><td>× 3</td></tr><tr><td>15 et plus</td><td>× 4</td></tr>
    </tbody></table>
    ${MONDE.mj.encartRencontres}
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
      .map(([t, a, b]) => `<h4>${t}</h4><p>${BESTIARY.filter((c) => c.genre === MONDE.genre && c.cr >= (a as number) && c.cr <= (b as number)).sort((x, y) => x.cr - y.cr).map((c) => `${esc(c.name)} (${crLabel(c.cr)})`).join(", ")}.</p>`)
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
    html: ouverture(`Chapitre ${n + 1}`, "Construire une rencontre", MONDE.mj.chapeauRencontres) + rencontres(),
  });
  LIBRARY.filter((s) => s.genre === MONDE.genre).forEach((s, i) => {
    unites.push({
      titre: s.title,
      marque: i === 0 ? "Scénario" : "",
      niveau: 1,
      entete: `Scénario · ${s.title}`,
      ouverture: true,
      html: `${ouverture(`Scénario ${i + 1} · niveau ${s.level}`, s.title, s.hook.split(". ")[0] + ".")}${illustration(`scenario-${s.id}`, MONDE.mj.planchesScenarios[s.id] ?? s.hook, "large")}${scenario(s)}`,
    });
  });

  return {
    fichier: `guide-du-mj-${MONDE.id}`,
    titre: `Guide du MJ ${MONDE.de}`,
    couverture: `${illustration("couverture-mj", MONDE.mj.couverture, "pleine")}
      <div class="cover-title"><div class="cover-kicker">${MONDE.campagne}</div><h1>Guide<br>du MJ</h1><div class="cover-rule"></div><div class="cover-sub">${MONDE.mj.sousTitre}</div></div>
      <div class="cover-foot">Réservé au meneur de jeu</div>`,
    credits: CREDITS_SRD(`Guide du MJ ${MONDE.de}`),
    unites,
    apercus: [1, 5, 6, 12],
  };
}
