// Contenu des livres propre aux Îles du Vent (pirates, Antilles, 1716) : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (papier de gazette jauni, encre brune, rouge sang, bleu de mer profonde,
// laiton). Polices d'un imprimé de 1716 : IM Fell (caractères gravés à Oxford vers 1670) pour les titres et petites capitales,
// Cormorant Garamond pour le texte courant, Pirata One seulement pour la couverture et les lettrines.
// Les sujets des planches clés viennent de shared/canon/iles-peintures.ts, comme pour ComfyUI.
// Rien du secret dans ce que lisent les joueurs : ni le faux argent, ni le nom de la frégate blanche, ni ses caisses.
// Les marrons, les plongeurs et les captifs sont montrés debout, le regard droit, jamais enchaînés ni en décor.
import { PEINTURES_ILES as P } from "../../shared/canon/iles-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_ILES = `
body { font-family: "Cormorant Garamond", serif; font-weight: 500; color: #22180c; }
.parchemin { background-color: #ead8ae; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(106,82,48,.30) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "IM Fell English SC", serif; color: #22180c; letter-spacing: .03em; }
h3 { border-bottom-color: #2a6a6a; }
.cols { column-rule-color: #22180c33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #9a2a1a; }
strong { color: #120c05; font-weight: 700; }
.lettrine::first-letter { font-family: "Pirata One", serif; color: #9a2a1a; }
.tete .sous, .cover-kicker, .cover-foot, .ouverture .num { font-family: "IM Fell English SC", serif; letter-spacing: .16em; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #6a5230; font-style: italic; }
.illu img { border-color: #22180c; box-shadow: 0 0 0 1.2mm #ead8ae, 0 0 0 1.6mm #a3804a, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(42,106,106,.10); border-color: #a3804a; }
.encart.dark { background: #08161f; color: #ead8ae; border-color: #d6b24a; }
.encart.dark h4 { color: #d6b24a; }
.encart.dark strong { color: #f4e4b8; }
.statblock { background: #dcc490; border-color: #22180c; }
.statblock h4, .abil { color: #9a2a1a; }
.statblock h5 { border-bottom-color: #9a2a1a; }
.statblock hr { background: linear-gradient(90deg, #d6b24a, transparent); }
.couverture { background: #08161f; }
.cover-kicker, .cover-foot { color: #d6b24a; letter-spacing: .24em; }
.couverture h1 { font-family: "Pirata One", serif; color: #f1e2b4; text-shadow: 0 2px 0 #0b2a30, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "IM Fell English SC", serif; color: #ead8ae; }
.cover-rule { background: linear-gradient(90deg, transparent, #d6b24a, transparent); }
`;

export const ILES_LIVRES: Monde = {
  id: "iles",
  genre: "pirates",
  nom: "Les Îles du Vent",
  de: "des Îles du Vent",
  a: "dans les Îles du Vent",
  campagne: "Les Îles du Vent",
  dossier: "content/iles-du-vent",
  css: CSS_ILES,
  polices: "https://fonts.googleapis.com/css2?family=Pirata+One&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait au bord de la mer des Antilles, le printemps de 1716.",
    illuMonde: ["region-anse-aux-lames", sujet("region-anse-aux-lames"), "large", "L'Anse-aux-Lames, au soleil couchant, quand un brigantin rentre en tirant un coup de canon."],
    chapeauOrigines: "Six façons d'être venu aux Îles.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note ta langue, tes amis dans les ports, et le petit défaut que ton pays te laisse.",
    chapeauClasses: "Dix métiers de bord, et chacun se paie en Moral.",
    encartCreation: `<aside class="encart"><h4>Le Moral et la Chance</h4><p>Avant de choisir ta classe, retiens deux choses. Le <strong>Moral</strong> est celui de l'équipage : de 0 à 10, il part à 6, et il ne remonte jamais tout seul. Chaque <strong>coup de main</strong> en coûte un point. Et ta <strong>Chance</strong> se compte en jetons, de 0 à 3 : tu commences avec un, tu en gagnes en respectant une coutume qui coûte quelque chose, et tu en dépenses un pour relancer un jet.</p></aside>`,
    chapeauRegles: "Le Moral du navire, la Chance, le coup de main, la chasse-partie, la piastre et la mer.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "Les Îles du Vent · un monde pour la cinquième édition",
    figures: {
      capitaine: "a ship's captain in a tricorn hat and a long blue coat standing on a quarterdeck at dawn, one hand on the rail, speaking to a crew gathered below on the main deck, their faces turned up to listen",
      canonnier: "a gunner in a stained canvas shirt kneeling behind an iron cannon on a gun deck, a lit slow match in one hand, squinting along the barrel at an enemy ship through the open port, sunlight cutting through powder smoke",
      boucanier: "a buccaneer hunter in a leather cap and a bloodied bull-hide apron standing at the edge of a green forest clearing, a long musket on his shoulder and two hunting dogs at his heels, smoke rising from a drying rack behind him",
      chirurgien: "a ship's surgeon in shirtsleeves bent over a wounded sailor on a sea chest by lantern light in the cockpit of a ship, a needle and thread in hand, an open case of brass instruments beside him, a steady and tired expression",
      gabier: "a topman in a striped shirt and a knotted headscarf standing barefoot on a yard high above the deck, one arm around the mast, hauling in canvas against a bright wind with the sea shining far below",
      bretteur: "a duellist in a shirt with rolled sleeves and a fine waistcoat holding a thin sword low in one hand and a dagger in the other on a sunlit quay, his weight forward, a half smile on his face",
      "maitre-de-manoeuvre": "a boatswain with a silver whistle on a chain around his neck and a rope coil on his shoulder, standing on a heaving deck at the foot of the mainmast with the crew hauling on ropes behind him in rhythm",
      contrebandier: "a smuggler in a dark coat and a wide hat slipping along a moonlit quay between stacked barrels, a lantern hooded in one hand, a small rowing boat waiting at the stone steps below",
      aumonier: "a ship's chaplain in a plain black cassock with a small wooden cross, standing on a deck in the golden light of late afternoon and reading from an open book to a circle of sailors with bowed heads, the sea calm behind him",
      plongeur: "a pearl-fisher diver in a short canvas tunic standing at the edge of a rowing boat on clear turquoise water, a rope looped at her waist and a heavy stone in her hands, taking a deep breath before the dive, her gaze straight down into the blue",
    },
    portraits: {
      "pi-flibustiers": "a buccaneer-born young sailor with sun-browned skin and a red sash, standing barefoot on the deck of a sloop with one hand on a rope, the bay of a small port glittering behind her, at ease on a moving deck",
      "pi-boucaniers": "a hunter of the forests of the island in a leather hat and an old shirt dark with smoke, crouching by a fire of drying meat with a long musket across his knees and a dog lying beside him",
      "pi-marrons": "a free woman of the mountain villages standing upright on a rock above a forested ravine, a conch shell at her belt and a cloth wrapped around her head, her steady gaze on the valley below",
      "pi-france": "a young Frenchman from a Breton port in a worn dark coat and a knitted cap, a sea bag over his shoulder, looking up the gangway of a ship at a harbour crowded with masts, curious and a little afraid",
      "pi-espagne": "a Creole woman from Havana in a wide-sleeved dress of dark silk and a lace shawl, a small gold cross at her throat, standing on a balcony of white stone above a harbour, composed and observant",
      "pi-toutes-mers": "a weathered freed Black seaman who has sailed under many flags, with a red scarf and a patched jacket, sitting on a barrel on a crowded quay with a pipe in his mouth and a coil of rope on his knee, listening to five languages at once",
      "pi-flibustiers-mousse": "a ten-year-old ship's boy of a buccaneer family perched high in the rigging of a sloop with his bare feet on a rope, grinning against a bright sky, one hand shading his eyes",
      "pi-flibustiers-quai": "a girl of the quay in a faded blue dress and a straw hat, counting coins into her palm at a stall of fish and fruit beside a stone wharf, ships at anchor behind her, quick and sharp-eyed",
      "pi-boucaniers-boucan": "a buccaneer hunter sitting on a log in the forest, skinning a boar with a long knife beside a smoking wooden rack, two dogs watching, the green light of the trees on his lined face",
      "pi-boucaniers-engage": "a lean man in a patched shirt and a bundle on his back, who has served three years of contract labour and walked out of it, standing at the edge of a forest path and looking back once at a distant plantation",
      "pi-marrons-libre": "a young man born free in the mountains, tall, in a short cloth tunic, a machete at his belt, standing guard on a ridge path in the mist with a conch shell raised toward his lips",
      "pi-marrons-evade": "a woman in a torn work dress who has just reached the edge of the mountain forest, one hand on a tree, looking back down the slope at the plain with her chin high and her breath still fast",
      "pi-france-cadet": "a young cadet of a Saint-Malo family in a good coat gone shabby and a sword that is too long for him, standing on a quay at dawn beside a trunk with a ship's name painted on it, his chin up",
      "pi-france-deserteur": "a deserter from a royal ship in a ragged blue naval jacket and bare feet, crouching in the shade of a warehouse on a harbour wall, a loaf of bread in his hands, watching the street from under his brows",
      "pi-espagne-havane": "a young man of Havana in a short black jacket and a white collar, a prayer book in one hand and a ledger in the other, on the steps of a stone church under a hard noon sun",
      "pi-espagne-carthagene": "a pilot of Cartagena in a faded green coat and a wide straw hat, standing at the stern rail of a small ship holding an old brass compass up to the light, the coast of a green shore behind him",
      "pi-toutes-mers-nord": "a Northern sailor, an Irishman with red hair and freckles in a patched sea jacket, laughing with his head back on the forecastle of a ship, a tin mug in his hand and a coil of rope at his feet",
      "pi-toutes-mers-libre": "a free man of the islands in a clean white shirt and a waistcoat, standing in the doorway of a small workshop of sailcloth with a needle in one hand, a ship's sail across his knees, his eyes on the street",
    },
  },
  mj: {
    planches: {
      "Les Îles en une page": ["region-anse-aux-lames", sujet("region-anse-aux-lames"), "L'Anse-aux-Lames, au soleil couchant."],
      "Les îles": ["region-bancs-de-floride", sujet("region-bancs-de-floride"), "Les bancs de Floride, sur l'eau claire, à six brasses d'une épave."],
      "Les puissances": ["figure-arriaga", sujet("figure-arriaga"), "Don Ignacio de Arriaga, gouverneur de La Havane."],
      "Le Navire et la Chance": ["region-fosse-de-bahama", sujet("region-fosse-de-bahama"), "La fosse de Bahama, au crépuscule."],
      "Les origines jouables": ["region-mornes", sujet("region-mornes"), "Un sentier de crête des mornes de Saint-Domingue."],
      "La vie dans les îles": ["region-nassau", sujet("region-nassau"), "Nassau : la chasse-partie, lue à voix haute."],
      "Chronologie": ["region-la-havane", sujet("region-la-havane"), "La baie de La Havane, au matin."],
      "Figures marquantes": ["figure-faucheux", sujet("figure-faucheux"), "Nicolas Faucheux, dit Bras-de-Fer."],
      "Historiques": ["figure-mere-abla", sujet("figure-mere-abla"), "Mère Abla, cheffe des marrons des mornes."],
      "La campagne": ["region-saint-pierre", sujet("region-saint-pierre"), "Le quai de Saint-Pierre, sous le volcan."],
      "Première séance": ["figure-vaucelles", sujet("figure-vaucelles"), "Monsieur de Vaucelles, lieutenant du roi."],
    },
    introRencontres: "Un combat dans les Îles du Vent se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais ici, un abordage se compte aussi en Moral et en poudre : comptez les deux.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Un coup de canon s'entend de loin, et un homme perdu se compte. Chaque combat qui coûte un homme à l'équipage fait baisser le Moral, et le Moral commande ce que l'équipage accepte de faire la prochaine fois. Les armes à poudre tirent un coup avant de recharger. Laissez toujours une sortie : un cap à doubler, un parlementaire, une voile qui paraît.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que le Moral et la poudre y changent.",
    planchesScenarios: { "bib-pi-barre-noire": "warm lantern light at midnight in a crowded harbour tavern of palm thatch and ship timber, a dark silver ingot set on a barrel head in the middle of the room, a hook-handed captain, a merchant in a grey coat and a young woman diver watching it, sailors packed shoulder to shoulder along the walls" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets des Îles du Vent · la Flotte · le Navire blanc",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes de mer et de côte",
        titre: "Les bêtes de mer et de côte",
        chapeau: "Elles n'ont pas signé de chasse-partie.",
        texte: [
          "Physalies, barracudas, requins des bancs et requins tigres, crocodiles des mangroves, grands requins blancs : les bêtes de la mer et de la côte n'ont rien d'extraordinaire. Elles ont faim, elles suivent le sang et la ferraille, et elles connaissent l'eau mieux que ceux qui y plongent. Un plongeur ne les affronte pas : il remonte avant.",
        ],
        illu: ["famille-betes-de-mer-et-de-cote", "three sharks circling in clear turquoise water over the masts of a sunken ship, a shoal of barracuda glinting above them and a mangrove shore in the distance, the sun in shafts through the surface"],
      },
      {
        id: "Gens de mer",
        titre: "Les gens de mer",
        chapeau: "Un équipage, c'est une paie, et une chasse-partie.",
        texte: [
          "Matelots de pont, flibustiers de l'abordage, boucaniers de la Tortue, canonniers de bordée, quartiers-maîtres et capitaines de sloop : les gens de mer sont les équipages des Frères de la Côte. Ils ne sont pas tous cruels, ni tous braves. La plupart ont signé pour une part et se battent pour la toucher. Ces fiches servent aussi de PNJ : on négocie avec un quartier-maître, on achète un canonnier, on perd un matelot.",
        ],
        illu: ["famille-gens-de-mer", "a pirate crew boarding a merchant ship in thick powder smoke at midday, men swinging across on ropes with cutlasses and boarding axes, a quartermaster shouting orders from the rail, sunlight low through the smoke"],
      },
      {
        id: "Soldats et chasseurs",
        titre: "Les soldats et les chasseurs",
        chapeau: "Chacun sert un roi, une prime ou un chien.",
        texte: [
          "Chiens de chasse, soldats espagnols du camp de plongée, chasseurs de marrons et leur chef, sentinelles des mornes, garde-côtes du roi, corsaires anglais de la Jamaïque : chacun défend quelque chose, une colonie, une paie, un village. Les sentinelles des mornes défendent des gens qui veulent rester libres ; elles ne sont pas des monstres, et le livre ne les traite pas comme tels.",
        ],
        illu: ["famille-soldats-et-chasseurs", "a Spanish soldier in a breastplate and a plumed hat facing a mountain lookout on a narrow ridge path at dawn, a conch shell at the lookout's belt, a hunting dog straining on a leash between them, mist rising from the forest below"],
      },
      {
        id: "Figures et navires",
        titre: "Les figures et les navires",
        chapeau: "Le plus craint des capitaines, et ce qui flotte.",
        texte: [
          "Le capitaine Faucheux, le capitaine du Navire blanc, un sloop de flibustiers, un galion garde-côte, et l'ouragan : quelques fiches pour les grandes scènes. Un navire a des points de coque, des canons et un Moral ; l'ouragan est un danger plus qu'une créature. Les figures peuvent se lire seules, mais elles sont toujours accompagnées d'un équipage.",
        ],
        illu: ["famille-figures-et-navires", "a sloop, a brigantine and a great galleon sailing in line under a high summer sky, white cloud over a deep blue sea, a distant storm front on the horizon, a pale-hulled frigate small and still on the far edge of the sea"],
      },
    ],
    avantPropos: `<h3>Les règles du Moral</h3>
      <p>Les créatures des Îles partagent deux contraintes. <strong>Le Moral</strong> : un équipage adverse a le sien, et quand il tombe à 1 ou à 0, il cesse de se battre ou se mutine. <strong>La poudre</strong> : les armes à feu tirent un coup avant de recharger, et un adversaire qui a tiré cherche un abri ou son sabre.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes de mer et de côte, les gens de mer, les soldats et les chasseurs, les figures et les navires. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que veulent vraiment les chefs. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-cinq créatures · puissance 1/8 à 15",
  },
};
