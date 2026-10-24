// Contenu des livres propre à l'Exposition éternelle (steampunk, Paris, octobre 1899) : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (papier d'affiche jauni, encre brune, laiton et cuivre, rouge de plomb, fond de suie).
// Polices d'une affiche de 1899 : Abril Fatface (didone grasse des titres d'affiche) pour la couverture et les lettrines,
// Playfair Display SC pour les titres et petites capitales (charte), Crimson Pro pour le texte courant.
// Les sujets des planches clés viennent de shared/canon/expo-peintures.ts, comme pour ComfyUI.
// Rien du secret dans ce que lisent les joueurs : ni ce qui dort sous le Champ, ni ce que le Commissariat en tire, ni la Nuit du Siècle.
// Les Gens des Villages sont montrés debout, le regard droit, à leur ouvrage, jamais en spectacle.
import { PEINTURES_EXPO as P } from "../../shared/canon/expo-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_EXPO = `
body { font-family: "Crimson Pro", Georgia, serif; font-weight: 400; color: #2a1a0c; }
.parchemin { background-color: #e8d8b8; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(110,82,50,.28) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Playfair Display SC", serif; color: #2a1a0c; letter-spacing: .03em; }
h3 { border-bottom-color: #c98a3c; }
.cols { column-rule-color: #2a1a0c33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #8a2a1a; }
strong { color: #170d05; font-weight: 700; }
.lettrine::first-letter { font-family: "Abril Fatface", serif; color: #8a2a1a; }
.tete .sous, .cover-kicker, .cover-foot, .ouverture .num { font-family: "Playfair Display SC", serif; letter-spacing: .16em; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #6e5232; font-style: italic; }
.illu img { border-color: #2a1a0c; box-shadow: 0 0 0 1.2mm #e8d8b8, 0 0 0 1.6mm #9c7a4a, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(201,138,60,.12); border-color: #9c7a4a; }
.encart.dark { background: #17110c; color: #e8d8b8; border-color: #c98a3c; }
.encart.dark h4 { color: #c98a3c; }
.encart.dark strong { color: #f3e6c8; }
.statblock { background: #d9c39a; border-color: #2a1a0c; }
.statblock h4, .abil { color: #8a2a1a; }
.statblock h5 { border-bottom-color: #8a2a1a; }
.statblock hr { background: linear-gradient(90deg, #c98a3c, transparent); }
.couverture { background: #17110c; }
.cover-kicker, .cover-foot { color: #c98a3c; letter-spacing: .24em; }
.couverture h1 { font-family: "Abril Fatface", serif; font-weight: 400; color: #f3e6c8; text-shadow: 0 2px 0 #3a1a08, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "Playfair Display SC", serif; color: #e8d8b8; }
.cover-rule { background: linear-gradient(90deg, transparent, #c98a3c, transparent); }
`;

export const EXPO_LIVRES: Monde = {
  id: "expo",
  genre: "steampunk",
  nom: "L'Exposition éternelle",
  de: "de l'Exposition éternelle",
  a: "à l'Exposition éternelle",
  campagne: "L'Exposition éternelle",
  dossier: "content/exposition-eternelle",
  css: CSS_EXPO,
  polices: "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Playfair+Display+SC:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait au Champ-de-Mars, l'automne de 1899.",
    illuMonde: ["region-galerie-des-machines", sujet("region-galerie-des-machines"), "large", "La Galerie des Machines, sous sa verrière, à l'heure où la vapeur monte."],
    chapeauOrigines: "Six façons d'être venu à l'Éternelle, ou d'y être né.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note qui t'avance ta licence, ce que tu lui dois chaque semaine, et le petit défaut que ta condition te laisse.",
    chapeauClasses: "Dix métiers de la foire, et chacun se paie en Pression.",
    encartCreation: `<aside class="encart"><h4>La Pression et les brevets</h4><p>Avant de choisir ta classe, retiens deux choses. À l'Éternelle, il n'y a pas de magie : il y a des <strong>appareils brevetés</strong>, loués à ton nom contre une licence de 200 francs qu'on t'avance. Et il y a la <strong>Pression</strong>, de 0 à 10, notée sous tes points de vie : elle monte chaque fois que tu emploies un appareil à plein régime (la mention « Chaudière »), et elle ne baisse qu'à la purge ou au repos. À 10, l'appareil éclate.</p></aside>`,
    chapeauRegles: "La Pression, les appareils brevetés, les francs de 1899 et les portes de la foire.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "L'Exposition éternelle · un monde pour la cinquième édition",
    figures: {
      mecanicien: "a mechanic in a blue smock with a spanner in his belt standing with one flat palm on the iron frame of a great steam engine in a machine hall, eyes half closed, listening to its rhythm, steam rising in the warm light of a glass roof",
      aeronaute: "an airship pilot in an oiled-canvas jacket and raised flying goggles standing at the open gangway of a grey dirigeable moored at a high platform, one hand on the mooring rope, the roofs of Paris spread far below in the pink evening mist",
      garde: "a fairground guard in a grey-blue kepi and a lined greatcoat standing at an iron turnstile gate with a brass-tipped baton in one hand and a ticket slate in the other, a crowd of visitors waiting in the gaslight, a tired and watchful expression",
      reporter: "a young reporter in a plain jacket and a straw boater, a stenographer's notebook open in one hand and a pencil behind her ear, pushing through a dense crowd of top hats and bonnets at a fairground gate, her eyes fixed on something just out of frame",
      medecin: "a doctor in shirtsleeves and a long white apron kneeling beside an injured mechanic on the floor of an iron machine hall, a leather case of instruments open at his knee, steady hands on a bandage, steam drifting in the lamplight",
      chansonnier: "a cabaret songwriter in a green coat and a soft felt hat standing on a barrel at the corner of a hillside street at night, one hand on his chest and one raised, singing to a laughing crowd of painters and seamstresses under a gas lamp",
      refractaire: "a young man in a dark cap and a red scarf crouched at the foot of a stone wall at night, a stub of white chalk in his hand, tracing a broken wheel on the bricks, a lit lattice tower in the haze far behind him, quick and calm",
      ingenieur: "an engineer in a waistcoat and rolled sleeves bent over a drawing table in a workshop skylit by grey daylight, a pair of brass dividers in one hand and an unfinished apparatus of copper tubes and springs on the bench beside him",
      interprete: "an interpreter in a neat dark coat standing between two groups of people on a lamplit esplanade, one hand lifted to each side as if carrying words across, a brass pocket watch chain across his waistcoat, an attentive and patient expression",
      escrimeur: "a fencing master in a white jacket and a black waistcoat holding a thin sword low in one hand in a fencing hall of polished boards and tall windows, his weight forward on the back foot, a light touch of amusement at his mouth",
    },
    portraits: {
      "ex-parisiens": "a child of the fairground aged fourteen in a too-big jacket and a flat cap, standing at the edge of a crowded lamplit avenue between iron pavilions, hands in pockets, quick eyes following everything at once",
      "ex-ateliers": "a worker couple in blue smocks and a bobbin-winder's apron walking home through a courtyard of red brick tenements at dusk, a loaf of bread under one arm, washing lines overhead, tired and together",
      "ex-villages": "a woman of the fairground's villages seated upright on the threshold of her house, a basket of weaving fibres on her knees, her hands busy and her direct calm gaze meeting the viewer as an equal, an indigo cloth wrapped around her head",
      "ex-employes": "a young clerk in a black coat and a stiff collar climbing the steps of a grand palace with a leather portfolio under his arm, a brass plate pinned to his lapel, polite and slightly anxious, fountains cascading behind him",
      "ex-visiteurs": "a provincial traveller in a travelling coat with a carpet bag at her feet, stopping on a lamplit avenue to look up at a lattice iron tower disappearing into the haze, curious and a little afraid",
      "ex-butte": "a painter in a smock and a floppy hat sitting on a stool on a hillside street at night, a sketchbook on his knee, a glowing fairground spread out below him across the city, a bottle of wine at his feet",
      "ex-parisiens-foire": "a girl of the fairground in a patched pinafore running between the legs of the crowd at a lit gate, a brass entry token in her fist, laughing over her shoulder at a guard who has noticed too late",
      "ex-parisiens-quais": "a boy of the riverbank in rolled trousers crouching on a stone quay at the water's edge, a coil of line and a tin can beside him, steamboats and lanterns behind him on the river, sharp and quiet",
      "ex-ateliers-meca": "a machinist in a blue smock wiping his hands on a rag at the open door of a workshop in a brick courtyard, a spanner in his belt, the evening shift whistle blowing over the rooftops behind him",
      "ex-ateliers-ouvriere": "a woman bobbin-winder at a long table of copper coils in a basement workshop under hanging lamps, her hands working fast and her head turned to listen to a neighbour, a small tin lunch pail beside the work",
      "ex-villages-senegalais": "a Senegalese blacksmith in a long tunic standing at his forge in front of a round thatched house, a hammer in one hand and a bar of glowing iron on the anvil, sparks flying, his steady gaze lifted to the viewer",
      "ex-villages-annamite": "an Annamese herbalist in a dark tunic and a conical hat pushed back, seated on the steps of a house on stilts sorting dried plants into small paper packets, calm and careful, a pagoda roof behind her",
      "ex-employes-signataire": "a young man of good family in a grey frock coat with a brass patent plate on the lapel, standing in his father's workshop beside a gleaming apparatus, one hand on the lever and a look that is both proud and uneasy",
      "ex-employes-commissariat": "an office clerk in a dark coat and sleeve protectors seated at a high desk piled with registers in a panelled hall, a pen poised and a gaze lifted toward the door, a gaslight over his shoulder",
      "ex-visiteurs-provincial": "a young woman from a provincial town in a plain travelling dress and a straw hat, a guidebook open in one hand, standing at the gate of a great fairground and counting the coins in her glove with the other",
      "ex-visiteurs-etranger": "a foreign visitor in a good travelling coat and a bowler hat standing on a river bridge at dusk, a camera case on a strap and a passport in his hand, lights of a vast fairground glittering on the water below him",
      "ex-butte-artiste": "a young chansonnier in a green coat tapping a rhythm on a marble-topped zinc table in a cabaret, a glass of absinthe before him and a laughing crowd behind him, caught between one verse and the next",
      "ex-butte-refractaire": "a young woman in a dark cap and a shawl leaning in a lamplit doorway of a hillside street, a stub of white chalk between her fingers, eyes on the street below, a roll of posters under her arm",
    },
  },
  mj: {
    planches: {
      "L'Éternelle en une page": ["region-la-tour", sujet("region-la-tour"), "La troisième plate-forme de la Tour, à l'amarre d'un dirigeable."],
      "Les lieux de l'Éternelle": ["region-galerie-des-machines", sujet("region-galerie-des-machines"), "La Galerie des Machines, sous sa verrière."],
      "Les puissances": ["region-le-trocadero", sujet("region-le-trocadero"), "Le Trocadéro, ses fontaines allumées devant la salle des brevets."],
      "La Pression et les brevets": ["region-palais-de-l-electricite", sujet("region-palais-de-l-electricite"), "Le Palais de l'Électricité : des dynamos hautes comme des maisons."],
      "Les origines jouables": ["region-grenelle-et-javel", sujet("region-grenelle-et-javel"), "La porte de Javel, à six heures du soir, à la relève."],
      "La vie à l'Éternelle": ["region-les-villages", sujet("region-les-villages"), "L'esplanade des Invalides, au bout de l'après-midi."],
      "Chronologie": ["region-les-carrieres", sujet("region-les-carrieres"), "L'escalier de pierre qui descend vers les Carrières."],
      "Figures marquantes": ["figure-faverolle", sujet("figure-faverolle"), "Léon-Ambroise Faverolle, Commissaire général."],
      "Historiques": ["figure-cordebard", sujet("figure-cordebard"), "Victorine Cordebard, secrétaire de la Chambre syndicale."],
      "La campagne": ["region-la-butte", sujet("region-la-butte"), "La Butte, la nuit, avec le Champ allumé au loin."],
      "Première séance": ["figure-petrel", sujet("figure-petrel"), "Gabriel Pétrel, nettoyeur du sous-sol de la machine n° 7."],
    },
    introRencontres: "Un combat à l'Éternelle se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais ici, un coup de feu s'entend dans toute la foire, et une machine en marche se compte aussi : comptez la Pression, et ce que les gardes feront à la porte.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Dans l'enceinte, les armes à feu sont interdites, et un coup de feu attire les gardes en quelques minutes. Chaque appareil employé à plein régime fait monter la Pression de son porteur, et la Pression commande ce qui casse. Une vapeur qui fuit, une courroie qui happe, un câble qui mord font autant de dégâts que n'importe quelle épée. Laissez toujours une sortie : une grille, un dirigeable qui part, un attroupement.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que la Pression et la foire y changent.",
    planchesScenarios: { "bib-ex-soiree-du-cocher": "flickering electric light dimming under the vast iron and glass nave of a machine hall at night, a brass mechanical coachman automaton running out of control across a polished floor, guests in evening dress scattering, a young apprentice in a work smock clutching a small cog to his chest, a woman mechanic in a blue blouse reaching for a drive belt" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de l'Exposition éternelle · le Commissariat · la machine sous le sol",
  },
  bestiaire: {
    familles: [
      {
        id: "Automates et machines de la foire",
        titre: "Les automates et les machines de la foire",
        chapeau: "Elles obéissent à une came, et c'est pire.",
        texte: [
          "Allumeurs de réverbères, guichetiers, cochers mécaniques, automates de ronde et de manutention, ponts roulants emballés : les machines de la foire n'ont ni colère ni pitié. Elles suivent une came, un tampon, un règlement. Elles se bloquent quand on les gêne et frappent quand elles ne comprennent pas. On les arrête avec une clef anglaise plus souvent qu'avec une épée, et un mécanicien dans le groupe vaut mieux qu'un fusil.",
        ],
        illu: ["famille-automates-et-machines-de-la-foire", "a row of clockwork automata in ticket-collectors' caps and lamplighters' coats standing at iron turnstile gates in a crowded fairground at dusk, brass cams turning behind glass chest panels, white steam drifting between them, visitors passing without a glance"],
      },
      {
        id: "Gens de la foire et de la pègre",
        titre: "Les gens de la foire et de la pègre",
        chapeau: "Ils se débrouillent, chacun à sa manière.",
        texte: [
          "Coupe-bourses de la foule, impresarios des Villages, casseurs de la Butte, receleurs du marché noir, artificiers réfractaires : la foire fait vivre ceux qui s'en servent comme ceux qui la fuient. Ces fiches servent surtout de PNJ : on négocie avec un receleur, on suit un coupe-bourse, on discute avec un artificier. Ils n'ont pas tous le choix, et le livre ne les traite pas en monstres.",
        ],
        illu: ["famille-gens-de-la-foire-et-de-la-pegre", "a crowded lamplit lane behind a fairground at night, a thin pickpocket in a flat cap sliding past a stout man in a top hat, a fence behind a market stall of brass trinkets, a young man with a roll of posters under his arm at the corner, yellow gaslight and drifting smoke"],
      },
      {
        id: "Gardes, Sûreté et Commissariat",
        titre: "Les gardes, la Sûreté et le Commissariat",
        chapeau: "Chacun tient une porte, un registre ou un ordre.",
        texte: [
          "Contrôleurs de billets, chiens de garde, gardes, brigadiers, inspecteurs de la Sûreté, capitaines de la garde : ils tiennent la foire ouverte, et la plupart ont une famille qui compte sur leur paie. Ils obéissent à un règlement, pas à une cruauté. On les trompe, on les persuade, on leur désobéit en sachant ce que ça coûte. Les fiches suivantes donnent aussi ce qu'ils savent, et ce qu'ils ignorent.",
        ],
        illu: ["famille-gardes-surete-et-commissariat", "a squad of fairground guards in grey-blue kepis and lined greatcoats on the steps of a grand palace at night, brass-tipped batons in hand, a clerk with a ledger at their side, fountains lit in cascade behind them, a hard white lamp glare on their faces"],
      },
      {
        id: "Figures et grandes machines",
        titre: "Les figures et les grandes machines",
        chapeau: "Les puissants, et ce qui les fait tenir.",
        texte: [
          "Un dirigeable du Commissariat, la machine n° 7, l'Éternelle, le Grand Brevet du siècle : quelques fiches pour les grandes scènes. Une grande machine a des points de coque, des mécanismes qui s'arrêtent un à un, et un équipage qui court. Un Grand Brevet est un danger plus qu'une créature. Les figures peuvent se lire seules, mais elles sont toujours accompagnées d'un cortège.",
        ],
        illu: ["famille-figures-et-grandes-machines", "a huge grey dirigeable with a brass gondola moored beside a lattice iron tower at dusk, a crowd of tiny figures on the platform below, behind them a vast glass hall lit from within and a column of white steam climbing into a violet sky"],
      },
    ],
    avantPropos: `<h3>La Pression et la poudre</h3>
      <p>Les créatures de l'Éternelle partagent deux contraintes. <strong>Le règlement</strong> : dans l'enceinte, un coup de feu appelle les gardes, et les gardes n'attendent pas d'explications. <strong>La vapeur</strong> : les machines ont leurs points faibles (une soupape, une courroie, une came), et un adversaire qui force son appareil en paie le prix, comme les personnages.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les automates et les machines de la foire, les gens de la foire et de la pègre, les gardes, la Sûreté et le Commissariat, les figures et les grandes machines. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que veulent vraiment les chefs. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-quatre créatures · puissance 0 à 15",
  },
};
