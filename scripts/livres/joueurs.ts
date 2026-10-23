// Livre des joueurs : le monde tel que les personnages le connaissent (aucun secret de campagne), les règles
// complètes compatibles 5e, et la création de personnage avec les origines, les 14 classes et leurs sous-classes.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BACKGROUNDS, ORIGINS, PERSONALITY, POINT_BUY_COST, STANDARD_ARRAY, subclassLevel, type Origin } from "../../shared/origins";
import { CLASSES, type CharacterClass, type Power } from "../../shared/rules";
import { GENRES } from "../../shared/genres";
import { CREDITS_SRD } from "./communs";
import { ouverture, type Livre, type Unite } from "./moteur";
import { esc, illustration, markdown, md } from "./texte";

const DOSSIER = "content/aubreterre/joueurs";
const STATS = GENRES.find((g) => g.id === "fantasy")!.stats;

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

/** Sujet de la planche de chaque classe (en anglais pour Flux), dans le monde d'Aubreterre. */
const FIGURES: Record<string, string> = {
  guerrier: "a veteran soldier of the northern wall in a dented breastplate and red cloak, longsword planted in the mud, rain",
  magicien: "a young woman mage in a brick tower study, a brass scale hanging beside her, ledgers of spells, a small flame between her fingers",
  voleur: "a lean thief crouched on a mossy rooftop above the canals of a salt port, rope coiled on his shoulder, a stolen signet ring",
  clerc: "a priestess with rolled-up sleeves washing a body on a stone slab in a chapel, a wooden paddle at her belt, holy light on her hands",
  rodeur: "a ranger woman wading through a misty black peat bog, longbow raised, reeds to her waist",
  barde: "a mourning singer in black veil at a village funeral, a small hurdy-gurdy, villagers listening, candles",
  paladin: "a paladin in white tabard over mail, a great square-headed nail hanging from his belt like a relic, shield bearing a closed door under a crown",
  druide: "an old druid woman holding a clod of peat in both hands, roots and moss growing over her arms, inside an ancient oak forest",
  barbare: "a huge barbarian of the red glass desert, skin streaked with shards of dark glass, roaring, sandstorm behind",
  moine: "a silent monk in grey robes balancing on a temple wall above vineyards at dusk, hands open, a sealed mouth embroidered on his hood",
  ensorceleur: "a sorceress with faint wyvern scales on her neck and cheek, eyes glowing amber, sparks in her palms, cliffs of white limestone",
  occultiste: "a warlock at a lonely crossroads at night, a coin under a stone, a pale disembodied hand resting on his shoulder from the empty darkness behind",
  "chasseur-de-morts": "a grim dead-hunter in brigandine and wide hat, cold iron hammer and a bag of square nails, kneeling over a corpse in a muddy village",
  veilleur: "a watcher holding a blue-glass lantern at the door of a farmhouse at night, listening to the ground, the dead standing still in the fields beyond",
};

function classe(c: CharacterClass): string {
  const court = c.id.replace(/^fantasy-/, "");
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
        <dt>Dé de vie</dt><dd>d${c.hitDie} par niveau ; au niveau 1, ${c.hitDie} + modificateur de Constitution</dd>
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

const PORTRAITS: Record<string, string> = {
  humain: "two travellers on an ancient flagstone causeway, a clerk from the capital with ink-stained fingers and a weathered northern legionary in a red cloak",
  elfe: "a tall forest elf with bark-brown skin and moss in her hair standing between the trunks of colossal oaks, green light",
  nain: "a dwarf with a lead-grey beard braided with small bones, standing before a huge carved door sealed with molten lead",
  "petites-gens": "a halfling peat-cutter on a plank walkway over black water, long spade on his shoulder, mist",
  "demi-orc": "a broad-shouldered half-orc woman caravan guard with grey-green skin, jutting lower tusks and a heavy jaw, desert robes, leaning on a spear, red dunes and glass plates behind her",
  revenu: "a revenant woman with pale bluish skin and black fingernails, hood, standing in a graveyard, calm sad eyes, breath not fogging in the cold",
  "sang-dore": "a young noble with faintly golden skin and eyes like candle flames, simple clothes, kneeling in an empty chapel",
};

function origine(o: Origin): string {
  return `<div class="tete">${o.unique ? '<div class="sous">Origine propre à Aubreterre</div>' : ""}<h2>${esc(o.name)}</h2></div>
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
  const bg = BACKGROUNDS.filter((b) => b.genre === "fantasy");
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
    ${table("Traits", PERSONALITY.trait)}${table("Idéaux", PERSONALITY.ideal)}${table("Liens", PERSONALITY.bond)}${table("Défauts", PERSONALITY.flaw)}
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
      <dt>Points de vie</dt><dd>Le maximum de ton dé de vie, plus ton modificateur de Constitution.</dd>
      <dt>Classe d'armure</dt><dd>10 + modificateur de Dextérité sans armure ; sinon, celle de ton armure.</dd>
      <dt>Initiative</dt><dd>Ton modificateur de Dextérité.</dd>
      <dt>Bonus de maîtrise</dt><dd>+2 du niveau 1 au niveau 4.</dd>
    </dl>
    <aside class="encart"><h4>Les Revenus et les Sang-Doré</h4><p>Ces deux origines n'existent qu'en Aubreterre. Elles posent des questions que le MJ voudra connaître avant la première partie : depuis combien de temps es-tu mort, qui t'a vu revenir, de quel enfant du Dieu descends-tu ? Parlez-en ensemble.</p></aside>
  </div>`;
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
  chapitre("Aubreterre", "Ce que tout le monde sait en Pallène, au printemps de l'an 7 du Glas.", `${illustration("joueurs-rotonde", "a dead god-emperor sitting on a black basalt throne in a dim copper-domed rotunda, iron crown, white candle wax rising to his knees, pilgrims kneeling", "large", "La Rotonde du Trône, un jour de pèlerinage.")}<div class="cols">${monde.html}</div>`, "Le monde");

  for (const f of regles.filter((f) => f < "03")) md1(f);

  chapitre("Créer un personnage", "Huit étapes, et autant de questions à te poser.", creation());

  n++;
  unites.push({ titre: "Les origines", marque: `Chapitre ${n}`, niveau: 1, entete: "Livre des joueurs · Les origines", ouverture: true, html: ouverture(`Chapitre ${n}`, "Les origines", "Cinq peuples de Pallène, et deux qui n'existent nulle part ailleurs.") + `<div class="cols"><p class="lettrine">Ton origine dit de quel peuple tu viens. Chacune a deux variantes, qui disent de quelle région, ou de quelle sorte de mort. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Si le MJ le permet, tu peux placer ces bonus toi-même (+2 et +1 où tu veux).</p><table class="tab"><thead><tr><th>Origine</th><th>Variantes</th></tr></thead><tbody>${ORIGINS.filter((o) => o.genre === "fantasy").map((o) => `<tr><td>${esc(o.name)}</td><td>${o.subs.map((s) => esc(s.name)).join(", ")}</td></tr>`).join("")}</tbody></table></div>` });
  for (const o of ORIGINS.filter((o) => o.genre === "fantasy")) unites.push({ titre: o.name, niveau: 2, entete: "Livre des joueurs · Les origines", html: origine(o) });

  n++;
  const classes = CLASSES.filter((c) => c.genre === "fantasy");
  unites.push({ titre: "Les classes", marque: `Chapitre ${n}`, niveau: 1, entete: "Livre des joueurs · Les classes", ouverture: true, html: ouverture(`Chapitre ${n}`, "Les classes", "Douze métiers connus de toute la cinquième édition, et deux qu'on n'apprend qu'en Aubreterre.") + `<div class="cols"><p class="lettrine">Ta classe dit ce que tu sais faire quand les choses tournent mal. Chacune a deux voies, qu'on choisit au niveau 1, 2 ou 3 selon la classe.</p><table class="tab long"><thead><tr><th>Classe</th><th>Dé</th><th>Rôle</th></tr></thead><tbody>${classes.map((c) => `<tr><td>${esc(c.name)}</td><td>d${c.hitDie}</td><td>${esc(c.role)}</td></tr>`).join("")}</tbody></table></div>` });
  for (const c of classes) unites.push({ titre: c.name, niveau: 2, entete: "Livre des joueurs · Les classes", html: classe(c) });

  chapitre("Historiques et personnalité", "Ce que tu faisais avant, et ce que tu ne sais pas cacher.", historiques());

  for (const f of regles.filter((f) => f >= "03")) md1(f);

  return {
    fichier: "livre-des-joueurs-aubreterre",
    titre: "Livre des joueurs d'Aubreterre",
    couverture: `${illustration("couverture-joueurs", "four adventurers on a hill at dawn looking toward a distant walled city with a copper dome, a dead-hunter, a mage with a brass scale, a ranger, a watcher with a blue lantern, a long line of risen dead walking toward the city below them", "pleine")}
      <div class="cover-title"><div class="cover-kicker">Le Trône du Dieu Mort</div><h1>Livre<br>des joueurs</h1><div class="cover-rule"></div><div class="cover-sub">Aubreterre · un monde pour la cinquième édition</div></div>
      <div class="cover-foot">Règles complètes · niveaux 1 à 20</div>`,
    credits: CREDITS_SRD("Livre des joueurs d'Aubreterre"),
    unites,
    apercus: [1, 5, 6],
  };
}
