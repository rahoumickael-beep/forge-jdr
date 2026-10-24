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
  "Le monde en une page": ["mj-glas", "midnight in the last winter of a medieval walled city, deep black-blue sky with falling snow, steep blue slate roofs heavy with snow, in the center distance a huge smooth blind dome of green verdigris copper, a seamless rounded hemisphere of solid oxidised green metal on a plain bare stone drum, flanked by tall stone belfries with big bronze bells swinging in their open arches, in the foreground a narrow snowy chandlers' street lined with wooden stalls stacked with tallow candles and dripping wax, a dense crowd of medieval townsfolk in hooded wool cloaks seen from behind, every head tilted back, faces raised upward toward the green copper dome, some pointing up at the swinging bells, hands holding candles", "La nuit du Glas, vue depuis le quartier des Cierges."],
  "Le continent et ses régions": ["mj-pallene", "a medieval mappa mundi painted flat on brown vellum, seen straight from above and filling the frame, one large pale ochre landmass whose coastline is the flat silhouette of a spread left handprint pressed in ochre paint, a round palm with five long thin finger peninsulas fanned wide apart, deep blue-black sea inlets between every finger, the thumb peninsula jutting out sideways to the left, the wrist running off the bottom edge, the landmass dotted with tiny flat map symbols of green tree clusters and brown hill bumps, a small ring of grey towers in the middle of the palm, five thin red ink lines running from the towers out to each fingertip like tendons, a dark verdigris sea with fine combed wave lines, small coiled sea serpents and one kraken drawn in brown ink in the four corners of the sea, everything painted flat like an illuminated manuscript page", "Pallène, d'après une carte de la Chancellerie."],
  "Les trois héritiers": ["mj-heritiers", "exactly three people standing apart around a rough plank war table inside a canvas army tent, a parchment map and wooden markers on the table, tallow candles stuck on the planks, canvas walls and a wooden tent pole behind them; on the left a tall broad-shouldered woman of forty with iron-grey hair hacked very short, a pale white scar running down through her half-closed left eye, weathered stern face, a battered dented old steel breastplate scratched and scuffed, over a faded red wool tunic, bare-headed, fists on the table; in the centre a gaunt stooped old cleric of seventy, bald bare head, clean-shaven hollow cheeks, plain white linen robe with a narrow gold-embroidered stole, wax drips on his right cuff, huge knotted peasant hands holding a thin beeswax taper; on the right a small skinny twelve-year-old street girl with ragged badly cut short black hair, scraped knees, patched brown smock, one brown eye and one golden eye, holding up a small square iron candle lantern with deep blue glass panes; the three avoid each other's eyes, cold wary silence", "Hersende, Cyprien et Ysé ne se sont jamais trouvés dans la même pièce."],
  "Les ordres indépendants": ["mj-ordres", "close half-length view of four medieval guild envoys squeezed shoulder to shoulder along the near side of a bare scrubbed oak board, faces and hands large in the frame, each one showing a token to the others with suspicion, from left to right: a gaunt gravedigger in a hooded brown wool tunic turned in profile so his left ear faces us, a big black square-headed iron nail driven through the earlobe; a heavy salt merchant in a russet wool surcoat with his fat hand flat on the board, a thick gold signet ring on his finger beside a little mound of coarse white salt; a young woman in a grey wool hood holding up at chest height a small square box of black iron with four panes of deep cobalt blue glass and a single candle flame inside; a thin tonsured scribe in a black wool cowl raising his right hand, the whole thumb dyed deep purple, a goose quill in his fingers; behind them, soft and blurred, a packed alehouse of bearded boatmen in linen coifs and wool hoods, rough daub walls, and an open plank doorway onto a wooden quay with moored flat river barges on black water", "Les ordres ne réclament pas le Trône. Ils le font tenir debout."],
  "Le panthéon": ["mj-pantheon", "frontal view of the back wall of a roofless ruined stone chapel, ivy and fallen rubble on the flagstones, the whole wall is one faded flat Romanesque fresco with dark outlines in the style of a 12th century wall painting, three tall flat painted saints side by side with flat gold halos, each saint holds only one object; left saint: a stout laundress in a brown dress with sleeves rolled to the shoulder, bare forearms, gripping upright in both fists a flat pale wooden washing bat shaped like a cricket bat; middle saint: a bearded smith in a leather apron raising high in his right fist one giant black iron spike as long as his forearm, a broad flat square head on top like a huge carpenter's nail, his left hand open and empty at his side; right saint: a thin scribe with a black eyepatch over his left eye, writing with a white goose quill in an open book; on the flagstones at the foot of the painted wall, scattered copper coins and melted candle stubs", "Les saints répondent seuls depuis le Glas."],
  "La magie et son prix": ["mj-magie", "high vantage from the upper floor of a timber house, in the foreground a narrow plank footbridge with a rope handrail crosses a deep gap to an arched opening high in the curved wall of a tall red brick mage tower, beside that arched opening an iron bracket holds a large brass balance scale, central pivot, long horizontal beam and two round brass pans on chains, the beam steeply tipped, the left pan hanging far lower than the right, far below between the houses a small cobbled village square seen from above, a single hairline crack threading across the dark cobbles, filled with a faint dull ochre seam like old candle wax, shuttered houses with candles in their windows, deep indigo evening sky", "La balance des Peseurs penche vers le sol."],
  "Les morts qui se relèvent": ["mj-morts", "the third night of a wake in a poor peasant cottage, wattle and daub walls, sooty roof beams, black wooden shutters barred with a plank, a frail old grandmother with a wrinkled face and a white linen kerchief over her grey hair, a long dark wool dress and shawl, sits on a stool at the head of a rough plank table, her right arm stretched out holding up a small iron lantern by its ring, the lantern's panes of deep cobalt blue glass throwing cold blue patches over the table, on the table lies a dead man wrapped in a tight grey linen shroud bound with cord, his head on a straw bolster near the old woman, the outline of a gaunt face with sunken cheeks and nose under the cloth, his feet tied together at the far end, his right forearm has slipped out of the shroud at his side, a waxy grey-blue hand of a corpse with dark fingernails resting on the planks, two fingers just curling, the old woman leans forward staring at that hand, a wooden bowl of salt and a handful of black iron nails lying in a heap by the bolster, earthen floor, deep shadow", "La troisième nuit."],
  "Origines jouables": ["mj-origines", "a fantasy adventuring company of six travellers busy around a weathered stone wayside cross where two muddy cart tracks meet on bleak heather moorland, three candles burning in a small roofed niche of the cross, the group arranged in a loose circle at different depths, each one doing something: in the right foreground a young woman with smooth bluish-white porcelain skin, rosy lips and a calm beautiful face, dark hair, in a dark green wool travelling gown, leans forward to set a fourth candle in the niche, her bare right forearm stretched out with a wide black satin ribbon tied in a bow around her wrist; beside her a hulking half-orc with olive-green skin, a heavy jaw and two big boar tusks jutting up from his underbite, crouches to unroll a parchment map on his knee; at the centre a tall elf woman with long pointed ears poking through her pale hair, in a forester's hood, points down one track with her longbow; a squat barrel-chested dwarf as wide as he is tall, with a belt-length grey beard, his head only level with the half-orc's shoulder, drinks from a horn; a halfling, a grown man with a full brown beard and the height of a small child, sits on the stone step of the cross eating an apple, his bare hairy feet dangling; behind them a plain human man-at-arms in a padded gambeson and iron kettle hat keeps watch with a spear", ""],
  Historiques: ["mj-historiques", "three fugitive men, exactly three figures, sitting on a pebble riverbank beneath the huge mossy stone arch of an old bridge, the curved stone vault overhead, dark river water and reeds beside them, a small driftwood campfire on the pebbles between them, open night sky beyond the arch, on the left a scarred bearded soldier with a stubbled jaw wearing a military red cloak turned inside out, red lining showing at the seams and hem, a dented short sword across his knees, in the middle a thin young man with a shaved tonsure in a coarse brown wool robe tied with rope, reading a worn prayer book with scribbled margins, on the right a lean weathered salt smuggler in a wide-brimmed hat holding a small brass pocket scale, a leather pouch spilling white salt at his feet", ""],
  "Accroches de scénario": ["mj-accroches", "worm's-eye view looking steeply up from the floor at a towering black basalt throne cut from one raw monolith, standing in a round chamber of grey stone blocks whose walls curve up into a shadowed masonry dome, enthroned on it a heavy-set bearded emperor frozen perfectly still like a statue, full fleshy cheeks, ruddy waxen skin firm and whole, eyes wide open and round, staring straight down at the viewer with a fixed glassy gaze, thick dark wool robe, big hands gripping the basalt armrests, on his head a crude crown that is a simple band of rough hammered black iron with four short square teeth, spotted with rust, his shins and knees buried in a thick white mound of hardened candle wax that rises to the top of his kneecaps and pours down the throne steps in heavy frozen drips, the white wax surface studded with thousands of tiny charred black candle wicks, high above a narrow slit in the dome lets in one crisp sharp-edged diagonal golden beam that strikes the iron crown and his forehead with a bright patch, the rest of the chamber dark umber", "Tout finit sous la Rotonde."],
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
      .map(([t, a, b]) => `<h4>${t}</h4><p>${BESTIARY.filter((c) => c.genre === "fantasy" && c.cr >= (a as number) && c.cr <= (b as number)).sort((x, y) => x.cr - y.cr).map((c) => `${esc(c.name)} (${crLabel(c.cr)})`).join(", ")}.</p>`)
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
      html: `${ouverture(`Scénario ${i + 1} · niveau ${s.level}`, s.title, s.hook.split(". ")[0] + ".")}${illustration(`scenario-${s.id}`, "view from a weathered plank walkway raised on thick timber stilts above a vast misty peat bog of black water and brown reeds; on the left, three round reed-thatched houses perched high on tall crooked timber stilts with wooden ladders down to the water, linked to each other by sagging plank walkways on stilts; below the walkway three bog corpses wade away from us through the black water toward the right of the picture, seen from behind, their dark walnut-brown leathery skin shrunken tight like old tanned hide: a tall bearded man in a rotten wool tunic, a small old woman with a long grey braid, a hunched boy wrapped in a peat-stained sheepskin; far away on the right, a low flat square raft of planks with a tall stooped ferryman pushing it with a long plain wooden shaft dipped into the water", "large")}${scenario(s)}`,
    });
  });

  return {
    fichier: "guide-du-mj-aubreterre",
    titre: "Guide du MJ d'Aubreterre",
    couverture: `${illustration("couverture-mj", "high view looking straight down into a deep round shaft of rough black basalt, at the top edge of the shaft a massive empty throne of black stone stands on the upper landing, beneath the throne a narrow spiral staircase of bare black basalt steps winds downward hugging the curved shaft wall, a small hooded monk in a brown wool robe walks down the steps away from the throne, head bowed toward the depths, holding a single small candle flame cupped in his own hand, the only warm spot in the dark, thin jagged hairline cracks in the black walls seep a faint icy blue shimmer, at the very bottom of the shaft the flat stone floor bears one single colossal sleeping eye carved in low relief, its heavy eyelid shut tight with a curved row of stone lashes, smooth dark stone all around it, deep shadow filling the upper third of the picture", "pleine")}
      <div class="cover-title"><div class="cover-kicker">Le Trône du Dieu Mort</div><h1>Guide<br>du MJ</h1><div class="cover-rule"></div><div class="cover-sub">Les secrets d'Aubreterre · le Sceau · le Dessous</div></div>
      <div class="cover-foot">Réservé au meneur de jeu</div>`,
    credits: CREDITS_SRD("Guide du MJ d'Aubreterre"),
    unites,
    apercus: [1, 5, 6, 12],
  };
}
