// Livre des joueurs : le monde tel que les personnages le connaissent (aucun secret de campagne), les règles
// complètes compatibles 5e, et la création de personnage avec les origines, les 14 classes et leurs sous-classes.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BACKGROUNDS, ORIGINS, personnaliteDe, POINT_BUY_COST, STANDARD_ARRAY, subclassLevel, type Origin } from "../../shared/origins";
import { CLASSES, REGLES_DU_MONDE, type CharacterClass, type Power, type RuleSection } from "../../shared/rules";
import { MODELES } from "../../shared/vaisseaux";
import { GENRES } from "../../shared/genres";
import { CREDITS_SRD } from "./communs";
import { MONDE } from "./monde";
import { ouverture, type Livre, type Unite } from "./moteur";
import { esc, illustration, markdown, md } from "./texte";

const DOSSIER = `${MONDE.dossier}/joueurs`;
const STATS = GENRES.find((g) => g.id === MONDE.genre)!.stats;
const FIGURES = MONDE.joueurs.figures;
const PORTRAITS = MONDE.joueurs.portraits;

/** Chapitre de règles écrit en Markdown : titre pris sur « # Chapitre N — Titre ». */
function chapitreMd(fichier: string) {
  const src = readFileSync(join(DOSSIER, fichier), "utf8").replace(/\r\n?/g, "\n"); // fichiers en CRLF sous Windows
  const titre = (src.match(/^# (?:Chapitre \d+ — )?(.+)$/m)?.[1] ?? fichier).trim();
  return { titre, html: markdown(src) };
}

const recharge = (p: Power) => (p.recharge === "à volonté" ? "à volonté" : p.recharge === "passif" ? "toujours actif" : `${p.uses ?? 1}×/${p.recharge}`);
const pouvoir = (p: Power) =>
  `<div class="power"><h4>${esc(p.name)}</h4><div class="power-meta">Niveau ${p.level} · ${esc(p.action)} · ${recharge(p)}${p.range ? ` · ${esc(p.range)}` : ""}</div><p>${md(p.effect)}</p></div>`;
const bonus = (b: Origin["bonus"]) =>
  Object.entries(b)
    .map(([i, v]) => `${STATS[Number(i)]} ${v! > 0 ? "+" : ""}${v}`)
    .join(", ");


function classe(c: CharacterClass): string {
  const court = c.id.replace(/^[a-z]+-/, "");
  const niv = subclassLevel(c.id);
  const niveauxSc = new Set(c.subclasses[0]?.powers.map((p) => p.level) ?? []);
  const tableau = Array.from({ length: 20 }, (_, i) => i + 1)
    .map((l) => {
      const apt = c.powers.filter((p) => p.level === l).map((p) => esc(p.name));
      if (niveauxSc.has(l)) apt.push(`<em>${l === niv ? esc(c.subclassTitle) : `Pouvoir de ${esc(c.subclassTitle.toLowerCase())}`}</em>`);
      if ([4, 8, 12, 16, 19].includes(l)) apt.push("Amélioration de caractéristiques");
      return `<tr><td>${l}</td><td>+${Math.ceil(l / 4) + 1}</td><td>${apt.join(", ") || "—"}</td></tr>`;
    })
    .join("");
  return `<div class="tete"><div class="sous">${esc(c.role)}</div><h2>${esc(c.name)}</h2><p class="pitch">${md(c.pitch)}</p></div>
    <div class="cols">
      ${illustration(`classe-${court}`, FIGURES[court] ?? c.pitch, "colonne")}
      <h3>Aptitudes de classe</h3>
      <dl class="feats">
        <dt>Dé de vie</dt><dd>d${c.hitDie} par niveau ; au niveau 1, ${c.hitDie} + modificateur de ${STATS[2]}</dd>
        <dt>Caractéristiques principales</dt><dd>${esc(c.mainStats.join(" et "))}</dd>
        <dt>Jets de sauvegarde</dt><dd>${esc(c.saves.join(", "))}</dd>
        <dt>Armures</dt><dd>${esc(c.armor)}</dd>
        <dt>Armes</dt><dd>${esc(c.weapons)}</dd>
        <dt>Compétences</dt><dd>${c.skills.choose} au choix parmi ${esc(c.skills.from.join(", "))}</dd>
        <dt>Équipement de départ</dt><dd>${esc(c.startingGear.join(", "))}</dd>
        <dt>${esc(c.subclassTitle)}</dt><dd>Au niveau ${niv}, choisis : ${c.subclasses.map((s) => esc(s.name)).join(" ou ")}.</dd>
      </dl>
    </div>
    <table class="progress"><thead><tr><th>Niv.</th><th>Maîtrise</th><th>Aptitudes</th></tr></thead><tbody>${tableau}</tbody></table>
    <div class="cols">
      <h3>Pouvoirs de classe</h3>
      ${c.powers.map(pouvoir).join("")}
      ${c.subclasses
        .map((s) => `<h3>${esc(c.subclassTitle)} · ${esc(s.name)}</h3><p><em>${md(s.pitch)}</em></p><p>${md(s.description)}</p>${s.powers.map(pouvoir).join("")}`)
        .join("")}
    </div>`;
}


function origine(o: Origin): string {
  return `<div class="tete">${o.unique ? `<div class="sous">Origine propre ${MONDE.a}</div>` : ""}<h2>${esc(o.name)}</h2></div>
    <div class="cols">
      <p class="lettrine">${md(o.blurb)}</p>
      ${illustration(`origine-${o.id}`, PORTRAITS[o.id] ?? o.blurb, "colonne")}
      <h3>Traits des ${esc(o.name)}</h3>
      <dl class="feats">
        <dt>Caractéristiques</dt><dd>${bonus(o.bonus) || "voir la variante"}</dd>
        <dt>Vitesse</dt><dd>${(o.speed * 1.5).toString().replace(".", ",")} m (${o.speed} cases)</dd>
        ${o.darkvision ? `<dt>Vision dans le noir</dt><dd>${(o.darkvision * 1.5).toString().replace(".", ",")} m</dd>` : ""}
        ${o.traits.map((t) => `<dt>${esc(t.name)}</dt><dd>${md(t.text)}</dd>`).join("")}
      </dl>
      ${o.subs
        .map(
          (s) => `<h3>${esc(s.name)}</h3><p><em>${md(s.blurb)}</em></p><dl class="feats"><dt>Caractéristiques</dt><dd>${bonus(s.bonus)}</dd>${s.speed ? `<dt>Vitesse</dt><dd>${(s.speed * 1.5).toString().replace(".", ",")} m</dd>` : ""}${s.hpPerLevel ? `<dt>Robustesse</dt><dd>+${s.hpPerLevel} PV par niveau</dd>` : ""}${s.traits.map((t) => `<dt>${esc(t.name)}</dt><dd>${md(t.text)}</dd>`).join("")}</dl>`,
        )
        .join("")}
    </div>`;
}

function historiques(): string {
  const bg = BACKGROUNDS.filter((b) => b.genre === MONDE.genre);
  const table = (titre: string, l: string[]) => `<h4>${titre}</h4><table class="tab long"><thead><tr><th>d${l.length}</th><th></th></tr></thead><tbody>${l.map((x, i) => `<tr><td>${i + 1}</td><td>${md(x)}</td></tr>`).join("")}</tbody></table>`;
  return `<div class="cols">
    <p class="lettrine">Ton historique dit ce que faisait ton personnage avant que l'histoire commence. Il donne deux compétences, un outil, un peu d'équipement et un privilège : une porte qui s'ouvre pour toi et pas pour les autres.</p>
    ${bg
      .map(
        (b) => `<div class="bloc"><h3>${esc(b.name)}</h3><p><em>${md(b.blurb)}</em></p><dl class="feats"><dt>Compétences</dt><dd>${esc(b.skills.join(", "))}</dd><dt>Outil</dt><dd>${esc(b.tool)}</dd><dt>Équipement</dt><dd>${esc(b.gear.join(", "))}</dd><dt>${esc(b.feature.name)}</dt><dd>${md(b.feature.text)}</dd></dl></div>`,
      )
      .join("")}
    <h3>Personnalité</h3>
    <p>Choisis ou tire un trait, un idéal, un lien et un défaut. Ils ne t'obligent à rien : ils donnent au MJ et aux autres joueurs une prise sur ton personnage.</p>
    ${table("Traits", personnaliteDe(MONDE.genre).trait)}${table("Idéaux", personnaliteDe(MONDE.genre).ideal)}${table("Liens", personnaliteDe(MONDE.genre).bond)}${table("Défauts", personnaliteDe(MONDE.genre).flaw)}
  </div>`;
}

function creation(): string {
  return `<div class="cols">
    <p class="lettrine">Un personnage se crée en huit étapes, dans l'ordre que tu veux. L'appli de la table les suit une à une avec le bouton « Créer pas à pas » ; ce chapitre les donne pour la fiche papier.</p>
    <ol>
      <li><strong>L'origine.</strong> Ton peuple, et la variante qui dit d'où tu viens exactement. Elle donne des bonus de caractéristiques, une vitesse et des traits.</li>
      <li><strong>La classe.</strong> Ce que tu sais faire. Elle fixe ton dé de vie, tes sauvegardes, tes armes et tes pouvoirs.</li>
      <li><strong>L'historique.</strong> Ce que tu faisais avant. Deux compétences, un outil, un privilège.</li>
      <li><strong>Les caractéristiques.</strong> Par achat de points, valeurs fixes ou dés, selon ce que le MJ a choisi pour la table.</li>
      <li><strong>Les compétences.</strong> Celles de ta classe, en plus de celles de ton historique.</li>
      <li><strong>La personnalité.</strong> Un trait, un idéal, un lien, un défaut.</li>
      <li><strong>L'apparence.</strong> Ton visage, ton allure, ce que les gens remarquent en premier.</li>
      <li><strong>Les chiffres.</strong> Points de vie, classe d'armure, initiative, bonus de maîtrise.</li>
    </ol>
    <h3>Achat par points</h3>
    <p>Tu disposes de 27 points. Chaque caractéristique commence à 8 et ne peut pas dépasser 15 avant les bonus d'origine.</p>
    <table class="tab"><thead><tr><th>Valeur</th>${Object.keys(POINT_BUY_COST).map((v) => `<th>${v}</th>`).join("")}</tr></thead><tbody><tr><td>Coût</td>${Object.values(POINT_BUY_COST).map((v) => `<td>${v}</td>`).join("")}</tr></tbody></table>
    <h3>Valeurs fixes</h3>
    <p>Répartis ${STANDARD_ARRAY.join(", ")} entre les six caractéristiques.</p>
    <h3>Les chiffres de départ</h3>
    <dl class="feats">
      <dt>Points de vie</dt><dd>Le maximum de ton dé de vie, plus ton modificateur de ${STATS[2]}.</dd>
      <dt>Classe d'armure</dt><dd>10 + modificateur de ${STATS[1]} sans armure ; sinon, celle de ton armure.</dd>
      <dt>Initiative</dt><dd>Ton modificateur de ${STATS[1]}.</dd>
      <dt>Bonus de maîtrise</dt><dd>+2 du niveau 1 au niveau 4.</dd>
    </dl>
    ${MONDE.joueurs.encartCreation}
  </div>`;
}

/** Une section de règles du jeu (shared/rules.ts) en HTML : « - » liste, « | » tableau (la première ligne en tête). */
function section(s: RuleSection): string {
  const out: string[] = [`<h3>${esc(s.title)}</h3>`];
  for (let i = 0; i < s.body.length; ) {
    const l = s.body[i];
    if (l.startsWith("- ")) {
      const items: string[] = [];
      while (i < s.body.length && s.body[i].startsWith("- ")) items.push(`<li>${md(s.body[i++].slice(2))}</li>`);
      out.push(`<ul>${items.join("")}</ul>`);
    } else if (l.startsWith("| ")) {
      const rows: string[][] = [];
      while (i < s.body.length && s.body[i].startsWith("| ")) rows.push(s.body[i++].slice(2).split(" | "));
      const [tete, ...reste] = rows;
      out.push(`<table class="tab"><thead><tr>${tete.map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead><tbody>${reste.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    } else {
      out.push(`<p>${md(l)}</p>`);
      i++;
    }
  }
  return out.join("");
}

/** Règles propres au monde, et pour un monde à vaisseaux, le tableau des modèles. */
function reglesDuMonde(sections: RuleSection[]): string {
  const vaisseaux = MONDE.genre === "science-fiction"
    ? `<h3>Les modèles de vaisseau</h3><table class="tab long"><thead><tr><th>Modèle</th><th>Coque</th><th>Boucliers</th><th>CA</th><th>Vitesse</th><th>Armes</th></tr></thead><tbody>${MODELES.map((m) => `<tr><td>${esc(m.nom)}</td><td>${m.coque}</td><td>${m.boucliers}</td><td>${m.ca}</td><td>${m.vitesse}</td><td>${m.armes.map((a) => `${esc(a.nom)} (+${a.bonus}, ${a.degats})`).join(", ")}</td></tr>`).join("")}</tbody></table>`
    : "";
  return `<div class="cols">${sections.map(section).join("")}${vaisseaux}</div>`;
}

export function livreDesJoueurs(): Livre {
  const unites: Unite[] = [];
  let n = 0;
  const chapitre = (titre: string, chapeau: string, html: string, entete = titre) => {
    n++;
    unites.push({ titre, marque: `Chapitre ${n}`, niveau: 1, entete: `Livre des joueurs · ${entete}`, ouverture: true, html: ouverture(`Chapitre ${n}`, titre, chapeau) + html });
  };
  const regles = existsSync(DOSSIER) ? readdirSync(DOSSIER).filter((f) => /^0[1-9].*\.md$/.test(f)).sort() : [];
  const md1 = (f: string, chapeau = "") => {
    const c = chapitreMd(f);
    chapitre(c.titre, chapeau, `<div class="cols">${c.html}</div>`);
  };

  const monde = chapitreMd("00-monde.md");
  chapitre(MONDE.nom, MONDE.joueurs.chapeauMonde, `${illustration(...MONDE.joueurs.illuMonde)}<div class="cols">${monde.html}</div>`, "Le monde");

  for (const f of regles.filter((f) => f < "03")) md1(f);

  chapitre("Créer un personnage", "Huit étapes, et autant de questions à te poser.", creation());

  n++;
  unites.push({ titre: "Les origines", marque: `Chapitre ${n}`, niveau: 1, entete: "Livre des joueurs · Les origines", ouverture: true, html: ouverture(`Chapitre ${n}`, "Les origines", MONDE.joueurs.chapeauOrigines) + `<div class="cols"><p class="lettrine">Ton origine dit de quel peuple tu viens. ${MONDE.joueurs.texteOrigines}</p><table class="tab"><thead><tr><th>Origine</th><th>Variantes</th></tr></thead><tbody>${ORIGINS.filter((o) => o.genre === MONDE.genre).map((o) => `<tr><td>${esc(o.name)}</td><td>${o.subs.map((s) => esc(s.name)).join(", ")}</td></tr>`).join("")}</tbody></table></div>` });
  for (const o of ORIGINS.filter((o) => o.genre === MONDE.genre)) unites.push({ titre: o.name, niveau: 2, entete: "Livre des joueurs · Les origines", html: origine(o) });

  n++;
  const classes = CLASSES.filter((c) => c.genre === MONDE.genre);
  unites.push({ titre: "Les classes", marque: `Chapitre ${n}`, niveau: 1, entete: "Livre des joueurs · Les classes", ouverture: true, html: ouverture(`Chapitre ${n}`, "Les classes", MONDE.joueurs.chapeauClasses) + `<div class="cols"><p class="lettrine">Ta classe dit ce que tu sais faire quand les choses tournent mal. Chacune a deux voies, qu'on choisit au niveau 1, 2 ou 3 selon la classe.</p><table class="tab long"><thead><tr><th>Classe</th><th>Dé</th><th>Rôle</th></tr></thead><tbody>${classes.map((c) => `<tr><td>${esc(c.name)}</td><td>d${c.hitDie}</td><td>${esc(c.role)}</td></tr>`).join("")}</tbody></table></div>` });
  for (const c of classes) unites.push({ titre: c.name, niveau: 2, entete: "Livre des joueurs · Les classes", html: classe(c) });

  chapitre("Historiques et personnalité", "Ce que tu faisais avant, et ce que tu ne sais pas cacher.", historiques());

  const propres = REGLES_DU_MONDE[MONDE.genre];
  if (propres?.length) chapitre("Les règles du monde", MONDE.joueurs.chapeauRegles ?? "", reglesDuMonde(propres));

  for (const f of regles.filter((f) => f >= "03")) md1(f);

  return {
    fichier: `livre-des-joueurs-${MONDE.id}`,
    titre: `Livre des joueurs ${MONDE.de}`,
    couverture: `${illustration("couverture-joueurs", MONDE.joueurs.couverture, "pleine")}
      <div class="cover-title"><div class="cover-kicker">${MONDE.campagne}</div><h1>Livre<br>des joueurs</h1><div class="cover-rule"></div><div class="cover-sub">${MONDE.joueurs.sousTitre}</div></div>
      <div class="cover-foot">Règles complètes · niveaux 1 à 20</div>`,
    credits: CREDITS_SRD(`Livre des joueurs ${MONDE.de}`),
    unites,
    apercus: [1, 5, 6],
  };
}
