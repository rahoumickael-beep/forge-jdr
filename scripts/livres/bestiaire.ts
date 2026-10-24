// Bestiaire d'Aubreterre : une fiche par créature, regroupées par famille et classées par puissance.
import { BESTIARY as TOUT_LE_BESTIAIRE, crLabel, modOf, STAT_ORDER, type Creature, type CreatureAction, type Family } from "../../shared/bestiary";
import { ouverture, type Livre, type Unite } from "./moteur";
import { CREDITS_SRD } from "./communs";
import { averageDiceLabel, esc, illustration, md } from "./texte";

/** Le livre du bestiaire est celui d'Aubreterre. */
const BESTIARY = TOUT_LE_BESTIAIRE.filter((c) => c.genre === "fantasy");

const sign = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);
const STAT_COURT: Record<string, string> = { For: "FOR", Dex: "DEX", Con: "CON", Int: "INT", Sag: "SAG", Cha: "CHA" };
const STAT_LONG: Record<string, string> = { For: "Force", Dex: "Dextérité", Con: "Constitution", Int: "Intelligence", Sag: "Sagesse", Cha: "Charisme" };

function vitesse(c: Creature) {
  const s = c.speed;
  const v = [`${String(s.marche).replace(".", ",")} m`];
  if (s.vol) v.push(`vol ${s.vol} m${s.stationnaire ? " (stationnaire)" : ""}`);
  if (s.nage) v.push(`nage ${s.nage} m`);
  if (s.escalade) v.push(`escalade ${s.escalade} m`);
  if (s.fouissement) v.push(`fouissement ${s.fouissement} m`);
  return v.join(", ");
}

function action(a: CreatureAction) {
  const nom = `${a.name}${a.recharge ? ` (${/^\d/.test(a.recharge) && a.recharge.includes("-") ? `recharge ${a.recharge}` : a.recharge})` : ""}${a.cost && a.cost > 1 ? ` (coûte ${a.cost} actions)` : ""}`;
  let corps = "";
  if (a.attack) {
    const k = a.attack;
    corps += `<em>Attaque ${k.kind === "contact" ? "au corps à corps" : "à distance"} :</em> ${sign(k.toHit)} au toucher, ${k.kind === "contact" ? "allonge" : "portée"} ${esc(k.reach)}, une cible. <em>Touché :</em> ${averageDiceLabel(k.damage)} dégâts ${esc(k.damageType)}`;
    if (k.extra) corps += ` plus ${averageDiceLabel(k.extra.damage)} dégâts ${esc(k.extra.damageType)}`;
    corps += ". ";
  } else if (a.save) {
    const s = a.save;
    corps += `<em>Jet de sauvegarde de ${STAT_LONG[s.stat]} DD ${s.dc}.</em> `;
    if (s.damage) corps += `Échec : ${averageDiceLabel(s.damage)} dégâts ${esc(s.damageType ?? "")}. `;
  }
  corps += md(a.text);
  return `<p><strong><em>${esc(nom)}.</em></strong> ${corps}</p>`;
}

export function ficheDeStats(c: Creature) {
  const ligne = (t: string, v?: string) => (v ? `<p><strong>${t}</strong> ${v}</p>` : "");
  const saves = c.saves && Object.keys(c.saves).length ? Object.entries(c.saves).map(([k, v]) => `${STAT_COURT[k][0]}${STAT_COURT[k].slice(1).toLowerCase()} ${sign(v!)}`).join(", ") : "";
  const skills = c.skills ? Object.entries(c.skills).map(([k, v]) => `${k} ${sign(v)}`).join(", ") : "";
  const liste = (l?: string[]) => (l?.length ? esc(l.join(", ")) : "");
  return `<div class="statblock">
    <h4>${esc(c.name)}</h4>
    <div class="sb-type">${esc(c.type.charAt(0).toUpperCase() + c.type.slice(1))} de taille ${esc(c.size.toLowerCase())}</div>
    <hr>
    ${ligne("Classe d'armure", `${c.ac}${c.acNote ? ` (${esc(c.acNote)})` : ""}`)}
    ${ligne("Points de vie", `${c.hp} (${c.hpDice.replace("+", " + ").replace(/(\d)-(\d)/, "$1 − $2")})`)}
    ${ligne("Vitesse", vitesse(c))}
    <hr>
    <table class="abil"><tr>${STAT_ORDER.map((s) => `<th>${STAT_COURT[s]}</th>`).join("")}</tr><tr>${c.stats.map((v) => `<td>${v} (${sign(modOf(v))})</td>`).join("")}</tr></table>
    <hr>
    ${ligne("Jets de sauvegarde", saves)}
    ${ligne("Compétences", esc(skills))}
    ${ligne("Vulnérabilités", liste(c.vulnerabilities))}
    ${ligne("Résistances", liste(c.resistances))}
    ${ligne("Immunités", [liste(c.immunities), liste(c.conditionImmunities)].filter(Boolean).join(" ; "))}
    ${ligne("Sens", esc(c.senses))}
    ${ligne("Langues", esc(c.languages || "—"))}
    ${ligne("Puissance", `${crLabel(c.cr)} (${c.xp.toLocaleString("fr-FR")} PX)`)}
    <hr>
    ${c.traits.map((t) => `<p><strong><em>${esc(t.name)}.</em></strong> ${md(t.text)}</p>`).join("")}
    <h5>Actions</h5>
    ${c.actions.map(action).join("")}
    ${c.bonusActions?.length ? `<h5>Actions bonus</h5>${c.bonusActions.map(action).join("")}` : ""}
    ${c.reactions?.length ? `<h5>Réactions</h5>${c.reactions.map(action).join("")}` : ""}
    ${c.legendary ? `<h5>Actions légendaires</h5><p>${md(c.legendary.text)}</p>${c.legendary.actions.map(action).join("")}` : ""}
  </div>`;
}

const FAMILLES: { id: Family; titre: string; chapeau: string; texte: string[]; illu: [string, string] }[] = [
  {
    id: "Morts",
    titre: "Les morts",
    chapeau: "Ils gardent leurs habits d'enterrement, et souvent leurs habitudes.",
    texte: [
      "Avant le Glas, on enterrait un mort et on n'en parlait plus. Depuis sept ans, chaque veillée est une garde armée. Le mort qui se relève à la troisième nuit sans son esprit devient un **Levé** : il part vers Aube-Close en ligne droite, et c'est tout ce qu'il sait faire. Les autres sont pires, parce qu'ils se souviennent de quelque chose.",
      "Ce chapitre va du mâtin qu'on cloue d'un coup de marteau jusqu'au corps du Dieu-Empereur lui-même. Presque tous partagent quelques règles : la Marche, le refus de tomber, et le clou de fer froid planté dans le talon qui les couche pour de bon.",
    ],
    illu: ["famille-morts", "seen from a high bank, a wide frozen river of grey ice under falling snow, far across the ice a long straight file of a dozen pale barefoot men and women in plain white linen shirts walking one behind another toward the right edge, heads bowed, waxy ashen skin, arms hanging empty at their sides, small and distant figures, in the near foreground on the snowy bank three bearded villagers in heavy brown wool cloaks stand with their backs half turned to us, each raising a big iron hammer in one fist and holding a long iron nail in the other, a fourth villager holds up a small horn lantern, bare black willows on the bank, low heavy snow clouds, blue-grey shadows"],
  },
  {
    id: "Bêtes",
    titre: "Les bêtes",
    chapeau: "Les animaux de Pallène ont appris à vivre avec les morts. Certains en vivent.",
    texte: [
      "Les corneilles suivent les lignes de pieux, les rats creusent sous les fossés de chaux, les loups de bruyère traînent derrière les colonnes de la Marche comme derrière un troupeau. Aucune de ces bêtes n'est maléfique. Elles ont simplement compris, plus vite que les hommes, que le monde avait changé.",
    ],
    illu: ["famille-betes", "side view of a bare windswept heather moor under a low heavy slate-grey dusk sky, wind bending the brown heather and pale grass; across the middle ground a long single-file procession of corpses risen from the grave walks in a perfectly straight line from left to right toward the far horizon, each figure wearing a long plain off-white linen burial shroud, waxen grey-blue skin, sunken cheeks, half-closed eyes, heads hanging forward, arms limp at their sides, bare feet dragging through the heather; far behind the last walker, trailing at a patient distance in the same direction, four gaunt grey heather wolves, each in a different pose, thin legs, ribs showing under short ragged fur, narrow muzzles with mouths closed, tails low, calmly trotting and sniffing the trail like sheepdogs behind a flock; a row of weathered wooden stakes along the procession's path, a dozen black crows wheeling in the grey sky above"],
  },
  {
    id: "Humanoïdes",
    titre: "Les vivants",
    chapeau: "Les morts marchent tout droit. Les vivants, eux, choisissent leur camp.",
    texte: [
      "Légionnaires de Hersende, gardes du Seuil de Cyprien, cloueurs de la Confrérie, contremaîtres de la Hanse : la plupart des combats d'une campagne en Aubreterre opposent des gens qui ont tous de bonnes raisons. Ces fiches servent aussi bien d'adversaires que d'alliés, de mercenaires ou de rivaux.",
    ],
    illu: ["famille-vivants", "a muddy dirt crossroads in heavy rain with deep wheel ruts and brown puddles, two opposing groups of soldiers facing each other across the mud, on the left five legionaries in long red wool cloaks and round iron kettle helmets, each with a round wooden shield and a short sword, weathered bearded faces, on the right five temple guards in plain white linen tabards over grey chainmail, bare weathered faces under mail hoods, each guard holding one single spear upright at his side, a clear gap of mud between the two groups, standing alone in that gap a broad-shouldered man in a dark brown studded leather brigandine and a black hooded coat, an iron nail through his earlobe, a small tar pot hanging from his belt, holding a heavy iron war hammer with a large square iron head resting on his shoulder, the hammer head outlined against the grey sky, far in the background on a distant bare hill a small wooden gallows"],
  },
  {
    id: "Monstruosités",
    titre: "Les monstruosités",
    chapeau: "Le monde n'a pas attendu Gorvan pour avoir des dents.",
    texte: [
      "Wyvernes des Ossiers, raies qui nagent sous les dunes du Verre-Rouge, choses qui mangent ce qu'on laisse sur les bûchers : ces créatures existaient avant le Glas. Certaines ont prospéré depuis, parce qu'il y a beaucoup plus à manger.",
    ],
    illu: ["famille-monstruosites", "a wyvern perched on a white limestone peak shaped like vertebrae, wings half spread, a dwarven watchtower far below, cold mountain light"],
  },
  {
    id: "Créatures du Dessous",
    titre: "Les créatures du Dessous",
    chapeau: "Ce qui remonte par les fissures du Sceau. Gardez ces pages pour la fin.",
    texte: [
      "Ces créatures ne sont pas des morts. Ce sont des morceaux de Gorvan, ou des choses qu'il a digérées et recrachées, qui passent par les fissures quand le Sceau faiblit. Les joueurs ne devraient pas en rencontrer avant d'avoir compris qu'il y a un puits sous le Trône.",
    ],
    illu: ["famille-dessous", "seen from the high gallery of an immense romanesque cathedral, towering arcades and vaulted ceiling far above, tiny wooden pews in rows below, a broad crack across the stone crossing floor, its rim of flagstones slumped and dripping like cooling tallow, pale icy blue vapour streaming up out of the crack, from inside it a tangle of black wet roots and tarry ropes rising, several of them ending in rounded blunt stumps like shapeless mittens of dark flesh, one stump pressing against the floor edge, a ring of tall candles on iron stands around the crack with flames bending toward it, warm amber flames against cold blue, a vast thing pushing up from beneath the nave"],
  },
];

export function bestiaire(): Livre {
  const unites: Unite[] = [];
  unites.push({
    titre: "Lire une fiche",
    marque: "Avant-propos",
    niveau: 1,
    entete: "Bestiaire · Lire une fiche",
    ouverture: true,
    html: `${ouverture("Avant-propos", "Lire une fiche", "Toutes les créatures suivent les règles de la cinquième édition. Distances en mètres, une case vaut 1,5 m.")}
    <div class="cols">
      <p class="lettrine">Chaque créature tient sur une ou deux pages : une planche peinte, ce que les gens en savent, sa fiche de statistiques, puis un encadré réservé au MJ. Le texte au-dessus de la fiche peut être lu aux joueurs. L'encadré, non.</p>
      <h3>La puissance</h3>
      <p>La <strong>Puissance</strong> d'une créature (le facteur de puissance de la 5e) indique le niveau d'un groupe de quatre personnages pour qui elle est un combat difficile mais gagnable. Elle va de 0 à 20. Toutes les fiches de ce livre ont été vérifiées avec la méthode du Guide du maître : points de vie, classe d'armure, dégâts par round et bonus d'attaque.</p>
      <h3>Les règles des morts</h3>
      <p>La plupart des morts d'Aubreterre partagent trois traits. <strong>La Marche</strong> : sans ordre, un mort sans esprit avance vers Aube-Close et n'attaque que ce qui le gêne. <strong>Ne tombe pas</strong> : réduit à 0 PV, il peut rester debout à 1 PV, sauf contre le radiant ou un critique. <strong>Clouer</strong> : un clou de fer froid planté dans le talon d'un mort à terre l'empêche de se relever.</p>
      <h3>Les familles</h3>
      <p>Le livre suit cinq familles : les morts, les bêtes, les vivants, les monstruosités et les créatures du Dessous. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent du Sceau, de Gorvan et de ce qui se cache sous le Trône. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>
    </div>`,
  });

  FAMILLES.forEach((f, i) => {
    const liste = BESTIARY.filter((c) => c.family === f.id).sort((a, b) => a.cr - b.cr);
    unites.push({
      titre: f.titre,
      marque: `Chapitre ${i + 1}`,
      niveau: 1,
      entete: `Bestiaire · ${f.titre}`,
      ouverture: true,
      html: `${ouverture(`Chapitre ${i + 1}`, f.titre, f.chapeau)}
      ${illustration(f.illu[0], f.illu[1], "large")}
      <div class="cols">${f.texte.map((t, k) => `<p${k === 0 ? ' class="lettrine"' : ""}>${md(t)}</p>`).join("")}</div>
      <table class="tab long"><thead><tr><th>Créature</th><th>Puiss.</th><th>Région</th></tr></thead><tbody>${liste.map((c) => `<tr><td>${esc(c.name)}</td><td>${crLabel(c.cr)}</td><td>${esc(c.region)}</td></tr>`).join("")}</tbody></table>`,
    });
    for (const c of liste) {
      unites.push({
        titre: c.name,
        niveau: 2,
        entete: `Bestiaire · ${f.titre}`,
        html: `<div class="tete"><div class="sous">${esc(f.titre)} · ${esc(c.region)} · Puissance ${crLabel(c.cr)}</div><h2>${esc(c.name)}</h2></div>
        <div class="creature">${illustration(c.id, c.illustration, "large")}
        <div class="cols">
          <p class="lettrine">${md(c.lore)}</p>
          ${ficheDeStats(c)}
          <aside class="encart dark"><h4>Au MJ</h4><p>${md(c.gmNotes)}</p></aside>
        </div></div>`,
        // Trop long pour une page : grande planche, récit et note au MJ d'abord, la fiche entière en regard.
        siLong: `<div class="tete"><div class="sous">${esc(f.titre)} · ${esc(c.region)} · Puissance ${crLabel(c.cr)}</div><h2>${esc(c.name)}</h2></div>
        <div class="creature longue">${illustration(c.id, c.illustration, "large")}
        <div class="cols"><p class="lettrine">${md(c.lore)}</p><aside class="encart dark"><h4>Au MJ</h4><p>${md(c.gmNotes)}</p></aside></div>
        <div class="saut"></div>
        <div class="cols">${ficheDeStats(c)}</div></div>`,
      });
    }
  });

  const parFp = [...BESTIARY].sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name, "fr"));
  const regions = [...new Set(BESTIARY.map((c) => c.region))].sort((a, b) => (a === "Partout" ? 1 : b === "Partout" ? -1 : a.localeCompare(b, "fr")));
  unites.push({
    titre: "Index",
    marque: "Annexe",
    niveau: 1,
    entete: "Bestiaire · Index",
    ouverture: true,
    html: `${ouverture("Annexe", "Index", "Toutes les créatures, par puissance puis par région.")}
    <div class="cols">
      <h3>Par puissance</h3>
      <table class="tab long"><thead><tr><th>Puiss.</th><th>Créature</th><th>PX</th></tr></thead><tbody>${parFp.map((c) => `<tr><td>${crLabel(c.cr)}</td><td>${esc(c.name)}</td><td>${c.xp.toLocaleString("fr-FR")}</td></tr>`).join("")}</tbody></table>
      <h3>Par région</h3>
      ${regions.map((r) => `<h4>${esc(r)}</h4><p>${BESTIARY.filter((c) => c.region === r).sort((a, b) => a.cr - b.cr).map((c) => `${esc(c.name)} (${crLabel(c.cr)})`).join(", ")}.</p>`).join("")}
    </div>`,
  });

  return {
    fichier: "bestiaire-aubreterre",
    titre: "Bestiaire d'Aubreterre",
    couverture: `${illustration("couverture-bestiaire", "a wide flat plain of smooth black volcanic glass, glossy and dark like obsidian ice, cracked into great plates and half-swallowed by rippled red sand dunes under a dusky ember-red horizon; deep beneath the glass surface, blurred and greenish as if seen through dark murky ice, the gigantic sleeping face of a fallen giant lying on its back, one huge closed eyelid larger than a tent, serene stone-grey skin, still as a carved effigy, its vast shoulder and outstretched hand fading into the depths of the glass under the dunes; walking across the glass in the middle distance, a tiny caravan of six robed camel drivers leading a line of laden camels, each man holding a small iron hand lantern by its ring, warm reflections on the glossy black surface; deep umber sky above", "pleine")}
      <div class="cover-title"><div class="cover-kicker">Le Trône du Dieu Mort</div><h1>Bestiaire<br>d'Aubreterre</h1><div class="cover-rule"></div><div class="cover-sub">Cinquante-sept créatures · puissance 0 à 20</div></div>
      <div class="cover-foot">Pour la cinquième édition</div>`,
    credits: CREDITS_SRD("Bestiaire d'Aubreterre"),
    unites,
    apercus: [1, 6, 7, 8, 9, 40, 41],
  };
}
