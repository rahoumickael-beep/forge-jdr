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
  magicien: "a studious young woman wizard seated at an oak desk in a round brick tower room, plain freckled face, bare natural lips, tired thoughtful eyes, brown hair pinned under a linen coif, brown wool gown with a frayed collar, her right hand raised palm up with a bright tongue of orange magical fire floating in the air just above her open palm, her left hand resting flat on a thick open ledger of handwritten spells with columns of brown ink script, ink-stained fingers with short plain nails, stacked leather-bound grimoires on the desk, a brass balance scale with two round pans hanging by a chain from an iron hook in the brick wall behind her shoulder",
  voleur: "the painted scene fills the whole picture edge to edge, a lean gaunt young man, a medieval thief, seen from the waist up, crouching low on the mossy slate ridge of a steep roof, wearing a long-sleeved tunic of dark charcoal wool, a close-fitting jerkin of black leather and a deep grey-green wool hood drawn over his head, a coil of rough hemp rope slung over his left shoulder and across his chest, his right hand gripping a short plain dagger, a heavy gold signet ring on his left forefinger, below and behind him a narrow canal of dark water between tall timber houses with slate roofs, mist drifting over the water, the masts of moored cogs in a salt harbour in the distance",
  clerc: "side view of a broad-faced middle-aged peasant washerwoman priestess with red chapped hands, coarse undyed wool dress and linen headscarf, her sleeves bunched up to her shoulders leaving both arms bare from shoulder to wrist, she bends over the head end of a grey stone slab that runs across the bottom of the picture, with her left hand she wipes the brow of a dead grey-bearded man with a wet cloth, her right palm rests on his forehead, a small pale-gold holy radiance like a halo of sparks around her right hand and his brow, the dead man's face stern and solemn, mouth shut in a straight line, eyes closed, ash-grey skin, a white sheet pulled up to his chin, a broad flat wooden washing bat with a short handle thrust through the rope belt at her hip like a sword, a wooden bucket of water on the slab beside his head, behind her a rough stone chapel wall with a carved relief of a closed door beneath a crown",
  rodeur: "wide outdoor landscape painting of a flat misty peat bog under a heavy sky of grey rain clouds, a hooded huntress crouched low among tall brown bulrushes, black bog water around her thighs, her left fist closed around the middle of a long plain yew bow held upright beside her, the bow a single curved wooden stave with one thin string running from its top tip to its bottom tip, her right hand holding one goose-feathered arrow against her chest, a leather quiver full of arrows on her back, hood and cloak of faded green wool, wary face turned toward the fog ahead, dense reeds on every side, grey marsh fog and dead alder trunks fading into the distance, a heron rising from the reeds",
  barde: "a mourning singer in black veil at a village funeral, a small hurdy-gurdy, villagers listening, candles",
  paladin: "a bareheaded oath-sworn knight of about forty, short dark hair, weathered stern face, steady solemn eyes, wearing a long sleeveless plain off-white surcoat over a full shirt of grey iron chainmail, mail sleeves and mail collar clearly visible, the surcoat bare and undecorated, a broad leather sword belt at his waist with a single forearm-long black iron nail with a flat square head hanging from it on a leather thong like a holy relic, his left arm holding one single wooden heater shield painted ochre, the shield emblem is a tall arched double door shut tight, drawn in dark umber, with a small three-pointed iron crown hovering just above the doorway, his right hand resting on the pommel of a sheathed sword, the lower edge of the painting fading into plain shadow",
  druide: "an old druid woman holding a clod of peat in both hands, roots and moss growing over her arms, inside an ancient oak forest",
  barbare: "a colossal bare-chested weathered human barbarian with a shaved head, a short dark beard and sun-browned skin, massive shoulders and arms, mouth wide open in a furious roar, dozens of thick translucent splinters of dark wine-coloured glass sticking out of the skin of his chest, shoulders and forearms, each glass splinter sharp and three-dimensional with dried blood around it, both fists gripping the long ash haft of a heavy two-handed greataxe raised upright in front of his chest, the broad crescent iron axe head attached to the top of the haft beside his face, coarse undyed brown wool cloak hanging from one shoulder, wide leather belt, behind him a deep umber gloom of whirling brown sand and dust fading into darkness, a few dull dark-red glass shards half buried in the sand at his feet, sombre brown, olive and dark umber background, face and chest picked out from the shadow",
  moine: "a silent monk in grey robes balancing on a temple wall above vineyards at dusk, hands open, a sealed mouth embroidered on his hood",
  ensorceleur: "a young human sorceress of dragon blood in a plain undyed wool dress with a hood fallen on her shoulders, rows of small overlapping bronze-green reptile scales growing out of her skin along the side of her neck, up her jaw and over one cheekbone like a lizard's hide, fierce amber eyes bright as embers with slit pupils, both bare hands held open in front of her chest, palms up, each palm cupping a small burst of orange fire and flying sparks, a shard of red glass hanging on a leather cord at her throat, behind her a sheer cliff of white limestone rock",
  occultiste: "a warlock at a lonely crossroads at night, a coin under a stone, a pale disembodied hand resting on his shoulder from the empty darkness behind",
  "chasseur-de-morts": "a hard-faced medieval hunter of the dead with a grey stubbled jaw, a small iron nail worn as an earring, a wide-brimmed brown pilgrim hat, a sleeveless brigandine coat of dark red canvas covered in rows of iron rivet heads over a wool shirt, he kneels on one knee in the mud and holds up in his right fist one cold iron hammer, a short wooden handle and a heavy black iron head beside his cheek, between the fingers of his left hand one long forged iron nail with a square head, a linen pouch of white salt and a leather pouch of nails at his belt, behind him a dead peasant lies on his back on an old wooden door laid on the mud, seen side-on and whole from head to boots, grey waxen face, closed eyes, hands crossed on his chest, a brown wool tunic stained with dark blood, thatched timber cottages of a muddy hamlet in the dark behind them",
  veilleur: "a weary middle-aged man with a stubbled hollow-cheeked face and dark rings under his eyes, hood of a dark wool cloak over a plain brown leather jerkin, kneeling on the earthen doorstep of a thatched timber farmhouse with a rough oak doorpost beside him, his head bowed and turned sideways, one ear lowered toward the ground, his left palm pressed flat on the bare earth, his eyes half closed in tense listening, his right hand holding up a small square wrought-iron box lantern with a pointed iron roof and a ring handle, four tiny panes of deep cobalt blue glass around one stubby tallow candle, a tall ash staff with an iron-shod foot and notched carvings leaning against the doorpost, behind him dark ploughed furrows stretching away, and standing motionless in the furrows several gaunt villagers with ashen grey skin, sunken closed eyes and torn linen burial shrouds, waiting at the edge of the blue haze",
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
  humain: "two men standing shoulder to shoulder outdoors on a worn Roman-style flagstone road that runs behind them toward distant grey moorland hills under a wide cloudy sky, on the left a slender young scribe of the imperial capital in a long dark blue wool robe with a leather satchel, holding an open parchment scroll in one hand and a goose quill in the other, a brass inkpot hanging at his belt, his fingertips stained black with ink, on the right a broad-shouldered battle-hardened soldier of about forty with a short dark beard and a scarred face, wearing a knee-length riveted chainmail hauberk over a padded gambeson, a heavy red wool cloak pinned at his shoulder, both hands gripping the shaft of a tall spear planted on the stones, both men wearing medieval leather ankle boots with wrapped wool leg bindings, the two faces clearly visible and complete",
  elfe: "close head-and-shoulders portrait of a centuries-old elf matriarch with dark ash-grey skin, her face, neck and hands the deep slate grey and walnut brown of old oak bark, fine vertical furrows like tree bark creasing her cheeks, brow and knuckles, as if carved from the oak behind her, long grave face, heavy-lidded black eyes, long pointed ears jutting through her hair, long black braids tangled with thick clumps of green moss and grey lichen, a dark green wool cloak over a worn leather jerkin, a yew longbow with a taut bowstring slung across her shoulder, colossal furrowed mossy oak trunks filling the background, cool grey-green forest shade",
  nain: "a squat broad dwarf warrior as wide as he is tall, a dented round iron skullcap with a heavy iron mail hood covering his ears, cheeks and neck, heavy brow, broad flat nose, deep-set stubborn eyes, weathered patient face, a long lead-grey beard in three thick braids down to his belt, small pale finger bones knotted into each braid like beads, a smooth flat grey pebble scratched with simple tally notches hanging from a short leather thong at his throat, thick wool tunic over iron mail, broad leather belt, his huge blunt hand resting on the haft of a stone hammer, behind him fills the whole background a colossal mountain gate of grey granite carved with a wall of large solemn bearded stone heads in deep relief like a cathedral portal, the central seam of the gate choked with thick dull grey lead that has bulged out between the stones and run down over the carved beards in hardened drips, several open handprints pressed into the soft grey lead",
  "petites-gens": "a stocky grinning little bog-man three feet tall, broad shoulders, thick short limbs, big muddy bare feet, round weathered clean-shaven face with ruddy cheeks, short curly brown hair, small rounded human ears, a grown man of forty with child-sized stature, wearing a patched brown wool tunic, leather apron and rolled hose caked with peat mud, holding upright in both hands a single tall peat spade twice his height, long ash-wood shaft ending in a narrow flat iron blade, standing on a rough plank walkway laid on wooden stakes driven into still black bog water, a stack of dark cut peat bricks beside him reaching his waist, reeds and low mist on the water",
  "demi-orc": "an orc-blooded woman, half-orc warrior, broad-shouldered and muscular, grey-green skin, orcish face with a heavy protruding lower jaw and pronounced underbite, snarling with her mouth slightly open, two short thick ivory tusks growing from her lower jaw at the corners of her mouth, jutting upward outside her lower lip and reaching her upper lip, ordinary human-sized nose, small pointed ears, old scar across her cheek, hard stare, black braids under a sand-colored headwrap, layered ochre desert robes of a caravan guard, both hands gripping a tall iron-tipped spear planted upright, behind her red sand dunes scattered with flat shards of fused red glass under a dusky sky",
  revenu: "a revenant woman with pale bluish skin and black fingernails, hood, standing in a graveyard, calm sad eyes, breath not fogging in the cold",
  "sang-dore": "close-up of a supernatural young nobleman with solid bright metallic gold eyes, his irises pure shining liquid gold like two burning candle flames, golden eyes catching the eye of the viewer, his face and hands gilded with a fine luminous gold-leaf sheen like a gilded church statue, shimmering gold skin bright even on the dark shadowed half of his face, gold dust sparkling on his cheekbones and knuckles, kneeling upright in prayer with hands clasped before a rough grey stone altar topped by two thin beeswax candles, empty stone chapel with a round arched window behind him, plain coarse brown wool tunic, short dark hair, serene grave face",
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
  chapitre("Aubreterre", "Ce que tout le monde sait en Pallène, au printemps de l'an 7 du Glas.", `${illustration("joueurs-rotonde", "medium shot at eye level, a life-sized dead old king seated upright on a low square slab of black basalt, his body intact, his skin smooth yellowish-white like old tallow, his eyes open and glassy, mouth shut, hands flat on his thighs, a narrow crude crown of black rusted iron bands with four blunt iron points, a long faded grey wool robe, a great frozen flood of white candle wax poured over his shins and knees and the slab, the wax swallowing his legs to the knees and spreading across the floor in thick smooth rippled sheets, the wax surface crowded with thousands of cold black charred wick stubs and broken grey candle stumps, a thin pale shaft of sun from a tiny hole at the apex of the dome striking the iron crown, dark verdigris-green copper dome plates curving overhead, three medieval pilgrims in hooded brown cloaks kneeling in the near foreground with bowed heads, the same size as the king, deep brown shadows", "large", "La Rotonde du Trône, un jour de pèlerinage.")}<div class="cols">${monde.html}</div>`, "Le monde");

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
    couverture: `${illustration("couverture-joueurs", "close view from behind of two pairs of adventurers on a grassy hilltop, large figures filling the bottom third, the left pair: a broad dead-hunter in a rust-red leather coat with a heavy crossbow across his back and a war hammer in his right hand, beside him a grey-robed mage woman holding up a small brass balance scale with two pans in her left hand, the right pair: a ranger in a dark green hooded cloak gripping a longbow, beside him a bearded watcher in a black wool coat whose raised right arm holds up an iron lantern with a cold blue flame, all four facing the valley; just below them down the slope a long single-file procession of gaunt walking corpses, grey rotting skin, bare ribs, torn burial shrouds, backs to the viewer, the nearest ones large and clearly dead, the line winding across a flat plain of wheat fields and canals to the gate of a distant walled town, three rings of grey stone ramparts, blue slate roofs, in the centre a squat round rotunda with a smooth blank dome of green copper; upper half of the canvas a dark empty umber sky, a thin pale rose band along the horizon", "pleine")}
      <div class="cover-title"><div class="cover-kicker">Le Trône du Dieu Mort</div><h1>Livre<br>des joueurs</h1><div class="cover-rule"></div><div class="cover-sub">Aubreterre · un monde pour la cinquième édition</div></div>
      <div class="cover-foot">Règles complètes · niveaux 1 à 20</div>`,
    credits: CREDITS_SRD("Livre des joueurs d'Aubreterre"),
    unites,
    apercus: [1, 5, 6],
  };
}
