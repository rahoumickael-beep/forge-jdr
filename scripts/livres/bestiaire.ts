// Bestiaire d'Aubreterre : une fiche par créature, regroupées par famille et classées par puissance.
import { BESTIARY as TOUT_LE_BESTIAIRE, crLabel, modOf, STAT_ORDER, type Creature, type CreatureAction, type Family } from "../../shared/bestiary";
import { getGenre } from "../../shared/genres";
import { MONDE } from "./monde";
import { ouverture, type Livre, type Unite } from "./moteur";
import { CREDITS_SRD } from "./communs";
import { averageDiceLabel, esc, illustration, md } from "./texte";

/** Le bestiaire du monde qu'on fabrique. */
const BESTIARY = TOUT_LE_BESTIAIRE.filter((c) => c.genre === MONDE.genre);

const sign = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);
// Noms des caractéristiques du genre (Puissance, Réflexes… en SF), dans l'ordre For Dex Con Int Sag Cha.
const NOMS_STATS = getGenre(MONDE.genre).stats;
const STAT_LONG: Record<string, string> = Object.fromEntries(STAT_ORDER.map((s, i) => [s, NOMS_STATS[i]]));
const STAT_COURT: Record<string, string> = Object.fromEntries(STAT_ORDER.map((s, i) => [s, NOMS_STATS[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3).toUpperCase()]));

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

const FAMILLES = MONDE.bestiaire.familles;

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
      ${MONDE.bestiaire.avantPropos}
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
        <div class="creature">
        <div class="cols">${illustration(c.id, c.illustration, "colonne")}
          <p class="lettrine">${md(c.lore)}</p>
          ${ficheDeStats(c)}
          <aside class="encart dark"><h4>Au MJ</h4><p>${md(c.gmNotes)}</p></aside>
        </div></div>`,
        // Trop long pour une page : grande planche, récit et note au MJ d'abord, la fiche entière en regard.
        siLong: `<div class="tete"><div class="sous">${esc(f.titre)} · ${esc(c.region)} · Puissance ${crLabel(c.cr)}</div><h2>${esc(c.name)}</h2></div>
        <div class="creature longue">
        <div class="cols">${illustration(c.id, c.illustration, "colonne")}<p class="lettrine">${md(c.lore)}</p><aside class="encart dark"><h4>Au MJ</h4><p>${md(c.gmNotes)}</p></aside></div>
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
    fichier: `bestiaire-${MONDE.id}`,
    titre: `Bestiaire ${MONDE.de}`,
    couverture: `${illustration("couverture-bestiaire", MONDE.bestiaire.couverture, "pleine")}
      <div class="cover-title"><div class="cover-kicker">${MONDE.campagne}</div><h1>Bestiaire<br>${MONDE.de}</h1><div class="cover-rule"></div><div class="cover-sub">${MONDE.bestiaire.sousTitre}</div></div>
      <div class="cover-foot">Pour la cinquième édition</div>`,
    credits: CREDITS_SRD(`Bestiaire ${MONDE.de}`),
    unites,
    apercus: [1, 6, 7, 8, 9, 40, 41],
  };
}
