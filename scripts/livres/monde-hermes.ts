// Contenu des livres propre à la Cellule Hermès (contemporain, thriller d'espionnage, Europe, novembre 2026) : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (papier de dossier gris, encre noire, rouge de tampon, fond de classeur).
// Polices d'un dossier administratif : Oswald (titres, tampons, petites capitales de la charte) et Source Sans 3 (texte courant),
// avec IBM Plex Mono pour les numéros de pli et les mentions de service, comme une machine à écrire de bureau.
// Les sujets des planches clés viennent de shared/canon/hermes-peintures.ts, comme pour ComfyUI.
// Rien du secret dans ce que lisent les joueurs : ni ce que le Service est devenu, ni ce que le Cabinet assemble, ni le Coffre, ni le Rachat.
// Aucun logo, aucune marque, aucune vraie personne ; rien de la maison de luxe Hermès.
// Mention légale à faire figurer aux crédits : « Hermès est ici un nom de code de fiction. Aucun lien avec une marque ou une société existante. »
// (Le type Monde n'a pas de champ pour les mentions, CREDITS_SRD est commun à tous les mondes : à ajouter dans scripts/livres/communs.ts.)
import { PEINTURES_HERMES as P } from "../../shared/canon/hermes-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_HERMES = `
body { font-family: "Source Sans 3", "Segoe UI", sans-serif; font-weight: 400; color: #18191b; }
.parchemin { background-color: #eceae4; background-image: linear-gradient(180deg, rgba(255,255,255,.35), transparent 30%), radial-gradient(ellipse at 50% 40%, transparent 60%, rgba(90,92,96,.18) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Oswald", sans-serif; color: #18191b; letter-spacing: .04em; text-transform: uppercase; font-weight: 600; }
h3 { border-bottom-color: #a8a49a; }
.cols { column-rule-color: #18191b33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #b0301f; }
strong { color: #0c0d0e; font-weight: 700; }
.lettrine::first-letter { font-family: "Oswald", sans-serif; font-weight: 700; color: #b0301f; }
.tete .sous, .cover-kicker, .cover-foot, .ouverture .num { font-family: "IBM Plex Mono", monospace; letter-spacing: .18em; text-transform: uppercase; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #5a5c60; font-style: italic; }
.illu img { border-color: #18191b; box-shadow: 0 0 0 1.2mm #eceae4, 0 0 0 1.5mm #a8a49a, 1px 3px 8px rgba(0,0,0,.3); filter: saturate(.85) contrast(1.04); }
.encart { background: rgba(210,74,58,.07); border-color: #a8a49a; border-left: 1.6mm solid #b0301f; }
.encart.dark { background: #111417; color: #eceae4; border-color: #d24a3a; }
.encart.dark h4 { color: #d24a3a; }
.encart.dark strong { color: #ffffff; }
.statblock { background: #dedbd2; border-color: #18191b; }
.statblock h4, .abil { color: #b0301f; }
.statblock h5 { border-bottom-color: #b0301f; }
.statblock hr { background: linear-gradient(90deg, #d24a3a, transparent); }
.couverture { background: #111417; }
.cover-kicker, .cover-foot { color: #d24a3a; letter-spacing: .26em; }
.couverture h1 { font-family: "Oswald", sans-serif; font-weight: 700; color: #eceae4; text-transform: uppercase; letter-spacing: .08em; text-shadow: 0 2px 0 #3a0d08, 0 0 28px rgba(0,0,0,.9); }
.cover-sub { font-family: "IBM Plex Mono", monospace; color: #dedbd2; letter-spacing: .08em; }
.cover-rule { background: linear-gradient(90deg, transparent, #d24a3a, transparent); }
`;

export const HERMES_LIVRES: Monde = {
  id: "hermes",
  genre: "contemporain",
  nom: "La Cellule Hermès",
  de: "de la Cellule Hermès",
  a: "à la Cellule Hermès",
  campagne: "La Cellule Hermès",
  dossier: "content/cellule-hermes",
  css: CSS_HERMES,
  polices: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout coursier sait de la Cellule, en novembre 2026.",
    illuMonde: ["region-paris-la-mercerie", sujet("region-paris-la-mercerie"), "large", "L'arrière-boutique de la Mercerie, rideau baissé, autour de la table de coupe."],
    chapeauOrigines: "Six façons d'arriver à la Cellule, avec un métier derrière soi.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note qui, dans ton ancien métier, te doit un service, et ce que tu ne dois pas dire à la Traitante.",
    chapeauClasses: "Dix métiers de coursier, et chacun laisse une trace différente.",
    encartCreation: `<aside class="encart"><h4>L'Empreinte et les couvertures</h4><p>Avant de choisir ta classe, retiens deux choses. Tu travailles sous une <strong>couverture</strong> : un faux nom, des papiers, une carte rechargeable, un téléphone. Et la Cellule a une seule jauge d'<strong>Empreinte</strong>, de 0 à 10, notée sur la fiche de groupe : elle monte quand on se sert d'une couverture pour un acte risqué, quand une caméra vous prend nettement, quand on tire, et elle ne baisse qu'en se faisant oublier ou en nettoyant ses traces. À 10, la Cellule est grillée.</p></aside>`,
    chapeauRegles: "L'Empreinte, les couvertures, la Caisse en euros, les armes et la loi.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "La Cellule Hermès · un monde pour la cinquième édition",
    figures: {
      chauffeur: "a driver in a dark jacket seated behind the wheel of a plain grey estate car at night, one hand on the wheel and one on the gearstick, eyes on the rear-view mirror, orange street lamps sliding across the windscreen, calm and ready",
      filocheur: "a person in a plain grey coat and a backpack standing in a crowded railway station concourse beside a ticket machine, reading a departure board while their eyes follow a distant figure in the reflection of a shop window, unremarkable and attentive",
      technicien: "a technician in a hi-vis vest and a hard hat crouched at an open junction box on a station wall, a small tool roll beside them and a coil of cable over one shoulder, fingers on a connector, a security camera on the pillar above",
      negociateur: "a negotiator in a good dark coat sitting across a small cafe table from a nervous man, a folded newspaper between them and both hands open and still on the table, a patient and friendly expression, rain on the window",
      infiltre: "a person in a plain polo shirt with a staff lanyard walking through a bright office corridor with a tray of coffee cups, eyes lowered, an easy forgettable face, glass doors and a reception desk behind",
      tireur: "a marksman's silhouette seen from behind in a dark parka on a service staircase, one hand on the rail, the other holding a closed black case, a small window of grey dawn light ahead, calm and still, the weapon kept out of sight",
      medecin: "a doctor in a dark coat kneeling on the tiled floor of a kitchen beside an injured man, a small green medical bag open at her knee, steady hands on a bandage, a single bare ceiling bulb overhead",
      faussaire: "a forger in a worn cardigan bent over a desk lit by a magnifier lamp, tweezers in one hand and a blank passport booklet under the glass, rubber stamps in a tray and a stack of plain paper beside, absorbed and precise",
      analyste: "an analyst in a rumpled shirt at a long table covered in printed photographs, bank statements and a map, a marker pen in one hand, red string between pins, a laptop and a cold coffee, eyes narrowed on a pattern",
      "garde-du-corps": "a bodyguard in a dark overcoat standing half a step behind a client in a hotel lobby, hands loose and visible, a coiled earpiece cable at the neck, eyes moving across the room and the doors, broad shoulders and a calm face",
    },
    portraits: {
      "he-armes": "a former soldier in a plain grey sweater sitting on a bench at a bus stop at night, hands clasped between his knees, a soldier's discipline in his posture, short hair and a scar over one eyebrow, a station behind him",
      "he-enquete": "a plainclothes investigator in a worn leather jacket leaning against a car outside a block of flats at dusk, a notebook in one hand and a cigarette unlit in the other, tired and watchful eyes",
      "he-chiffre": "a security engineer in a hooded sweater sitting cross-legged on a floor between racks of equipment, a laptop on her knees, a cable in her teeth and a screen casting blue light on her face, focused and amused",
      "he-argent": "an accountant in a pressed shirt and a thin tie seated at a desk covered in ledgers and bank slips, a calculator beside a neat stack of files, a pencil behind her ear, a clean and watchful expression",
      "he-monde": "a conference interpreter in a smart jacket standing at the edge of a crowded hotel reception holding a glass of water, a headset around her neck, attentive to two conversations at once, chandeliers behind her",
      "he-passage": "a long-haul driver in a fleece jacket leaning on the door of a truck cab at a motorway rest stop at night, a paper cup in one hand and a map folded in his pocket, sodium lamps behind him",
      "he-armes-para": "a former paratrooper in his forties in a plain jacket standing on a quiet street at night with his hands in his pockets, a limp in his left knee and an easy watchful stance, a faded regimental badge on his keyring",
      "he-armes-logisticien": "a military logistics officer in a fleece jacket checking a clipboard at the rear of a lorry in a depot yard at dawn, pallets and crates stacked behind him, a tidy and unhurried expression",
      "he-enquete-pj": "a detective in a grey raincoat sitting alone at a long table in an empty brigade office, a closed file under his hand, a window of evening light, someone who stayed after the others went home",
      "he-enquete-analyste": "an intelligence analyst in a cardigan at a desk with two screens full of diagrams, a stack of notes held down by a stapler, reading glasses pushed up into her hair, a thin tired smile",
      "he-chiffre-info": "a penetration tester in a plain t-shirt seated at a bank's reception desk with a visitor badge on a lanyard, a laptop in a canvas bag at his feet, innocent and bored, an open door to a server room behind",
      "he-chiffre-telecoms": "a telecoms technician in a hi-vis jacket and a harness at the top of a mast at dawn, a handheld tester in one hand, a city skyline in the grey light behind, wind in the cables",
      "he-argent-comptable": "a forensic accountant in a dark suit carrying a heavy file box up the steps of a court building in the rain, a bundle of ledgers under the other arm, steady and unimpressed",
      "he-argent-banquier": "a private banker in a charcoal suit with a quiet smile pouring tea in a wood-panelled salon, a thick folder on the low table, soft lamps and thick carpet, courtesy as a kind of shield",
      "he-monde-interprete": "a conference interpreter seated in a glass booth with a headset and a microphone, a glass of water and a notepad at her elbow, looking down through the window at a delegation table, calm and invisible",
      "he-monde-journaliste": "a freelance journalist with a press card on a lanyard and a small recorder in her fist, walking quickly down a corridor of a congress centre, a camera bag over one shoulder, quick eyes and a half smile",
      "he-passage-routier": "a lorry driver in a cap and a fleece sitting at a bar counter at a service station at night with a plate of eggs, his keys beside his plate and a road atlas open on the stool next to him, tired and friendly",
      "he-passage-urgentiste": "a paramedic in a hi-vis jacket sitting on the back step of an ambulance at dawn, a paper cup of coffee between her hands and her gloves in her pocket, blue light turning slowly on the wet street behind",
    },
  },
  mj: {
    planches: {
      "La Cellule en une page": ["region-paris-la-mercerie", sujet("region-paris-la-mercerie"), "La Mercerie, rideau baissé : quatre personnes autour de la table de coupe."],
      "Les lieux": ["region-rotterdam-la-maasvlakte", sujet("region-rotterdam-la-maasvlakte"), "La Maasvlakte, à quatre heures du matin."],
      "Les puissances": ["figure-aldebert", sujet("figure-aldebert"), "Judith Aldebert, inspectrice de la Section de contrôle des services."],
      "La règle propre : l'Empreinte": ["region-luxembourg-la-caserne", sujet("region-luxembourg-la-caserne"), "La barrière de l'ancienne caserne, à six heures du matin : une plaque notée à l'entrée."],
      "Les origines jouables": ["region-marseille-la-joliette", sujet("region-marseille-la-joliette"), "Le bar des dockers de la Joliette, à l'ouverture de cinq heures."],
      "La vie d'un coursier": ["region-trieste-le-port-franc", sujet("region-trieste-le-port-franc"), "Le quai du vieux port franc de Trieste, un jour de bora."],
      "Chronologie": ["figure-aldenhove", sujet("figure-aldenhove"), "Gérard Aldenhove, traducteur assermenté, dans son agence d'Ixelles."],
      "Figures marquantes": ["figure-mercadier", sujet("figure-mercadier"), "Suzanne Mercadier, la Traitante de la Cellule."],
      "Historiques": ["region-bruxelles-agence-aldenhove", sujet("region-bruxelles-agence-aldenhove"), "L'agence Aldenhove, rue de la Brasserie : des dictionnaires jusqu'au plafond."],
      "La campagne": ["figure-tournemine", sujet("figure-tournemine"), "Gaël Tournemine, patron du groupe Ostrevent, au-dessus d'un terminal."],
      "Première séance": ["figure-meyssonnier", sujet("figure-meyssonnier"), "Dorian Meyssonnier, d'Ostrevent, observe la rue d'Ixelles depuis une camionnette grise."],
    },
    introRencontres: "Un combat à la Cellule se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais ici, un coup de feu s'entend dans tout l'immeuble, la police est prévenue avant que les coursiers aient quitté les lieux, et l'Empreinte monte de 2 par scène où l'on tire : comptez-la avant de compter les points de vie.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Toutes les armes sont interdites aux coursiers. Un coup de feu entraîne une enquête, des témoins et une balle à retrouver. Un mort entraîne des mois de vigilance. Une créature réduite à 0 PV par une arme à feu est mourante : à la fin de chacun de ses trois premiers tours, elle fait une sauvegarde d'Endurance DD 10, et deux réussites la stabilisent ; sinon elle meurt à la fin de son troisième tour sans soins. Dans la plupart des scènes, on gagne en partant, en parlant ou en payant. Laissez toujours une sortie : un escalier de service, un train qui part, une foule.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que l'Empreinte et la loi y changent.",
    planchesScenarios: { "bib-he-coffret-d-ixelles": "single bare bulb in a narrow stairwell, an old translator's office in a Brussels townhouse, a grey cardboard archive box on a cluttered desk beside a cup of tea, an elderly man in a cardigan holding an envelope against his chest, a grey van parked in the street seen through a rain-streaked window" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de la Cellule Hermès · le Service · la Collection",
  },
  bestiaire: {
    familles: [
      {
        id: "La rue et les témoins",
        titre: "La rue et les témoins",
        chapeau: "Ils ne vous veulent aucun mal, et ils se souviennent de tout.",
        texte: [
          "Voisins qui notent, concierges, serveurs, dockers, habitués d'un bar, vigiles polis, foules de gare : la rue de la Cellule est pleine de gens qui ne sont pas des ennemis. Ils ne tirent pas, ils ne poursuivent pas, ils racontent. Un témoin se paie, se persuade ou se contourne, et chacun d'eux fait monter l'Empreinte de la même façon : en parlant à quelqu'un d'autre.",
        ],
        illu: ["famille-la-rue-et-les-temoins", "a crowded railway station concourse at evening, a concierge in a flowered apron at a glass door, a waiter wiping a cafe table, a security guard in a dark jacket walking the hall, commuters hurrying past with their eyes on their phones, a security camera on every pillar, cold white fluorescent light on wet tiles"],
      },
      {
        id: "Forces de l'ordre",
        titre: "Les forces de l'ordre",
        chapeau: "Ils ne sont pas des monstres, et ils ont des procédures.",
        texte: [
          "Policiers de quartier, douaniers, inspecteurs de la Section, officiers de liaison, équipes d'intervention : ils tiennent une porte, un quai ou un dossier, et la plupart ont une famille qui compte sur leur paie. Ils obéissent à un règlement plus qu'à une haine. On les trompe, on les persuade, on leur échappe en sachant ce que ça coûte. Aucun n'est un ennemi par défaut, et chaque fiche dit comment éviter le combat.",
        ],
        illu: ["famille-forces-de-l-ordre", "a customs officer in a hi-vis jacket and a plain-clothes inspector in a dark suit standing together at the exit of a ferry gangway at dawn, one with a torch and one with a black wallet open, passengers filing past with luggage, grey light and wet concrete"],
      },
      {
        id: "Les privés",
        titre: "Les privés",
        chapeau: "Ils font le même métier que vous, pour un autre client.",
        texte: [
          "Hommes de main, chefs d'équipe, anciens militaires, anciens policiers, équipes de protection et d'extraction du groupe Ostrevent : des professionnels payés 3 800 € par mois, qui rentrent le soir et n'ont pas envie de mourir pour un contrat. Ils sont plus nombreux, mieux équipés et moins patients que vous, mais ils se rendent, se retirent ou négocient quand le prix monte. Ces fiches disent aussi ce qu'ils savent, et ce qu'ils ignorent.",
        ],
        illu: ["famille-les-prives", "a team of men in dark jackets stepping out of a grey van with plain unmarked panels in an industrial car park at dawn, one with a handheld radio, one checking a phone, another closing a sliding door, hard orange floodlight and a stack of blue containers behind"],
      },
      {
        id: "Figures et scènes",
        titre: "Figures et scènes",
        chapeau: "Les gens qui comptent, et les endroits où tout se joue.",
        texte: [
          "Quelques fiches pour les grandes scènes : un chef de groupe, une inspectrice principale, un terminal de port, une salle de coffres, une foule. Une grande scène a ses issues, ses témoins et son horloge. Les figures peuvent se lire seules, mais elles sont toujours accompagnées d'une équipe, d'un horaire et d'une porte qui se ferme.",
        ],
        illu: ["famille-figures-et-scenes", "a vast container terminal at four in the morning with gantry cranes lit orange, a foreman in a hi-vis jacket under a lamp, a customs officer with a torch at the far end of the quay, a lone truck reversing with hazard lights on, drizzle and low cloud over grey water"],
      },
    ],
    avantPropos: `<h3>La loi et la balle</h3>
      <p>Les créatures de la Cellule partagent deux contraintes. <strong>La loi</strong> : un policier, un douanier ou un inspecteur n'est jamais un ennemi par défaut, et un coup de feu ou un mort change la scène pour de bon. <strong>L'Empreinte</strong> : chaque fiche dit ce que coûte un coup de feu, et ce qu'un témoin retient. Les privés et les forces de l'ordre se retirent quand le prix monte, comme les personnages.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : la rue et les témoins, les forces de l'ordre, les privés, les figures et les scènes. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par ville.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que veulent vraiment les chefs. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-cinq créatures · puissance 0 à 15",
  },
};
