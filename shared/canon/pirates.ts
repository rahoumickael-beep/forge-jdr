// Canon des Îles du Vent (pirates, Antilles, 1716), tiré de la bible du monde (content/iles-du-vent/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; on compte aussi « de la Flotte » à partir de 1715 (an 0, le naufrage).
// Ce que la Flotte transportait vraiment, le Navire blanc et le registre de ses caisses sont dans les secrets, pas dans la chronologie :
// la chronologie ne dit que ce que tout le monde sait.
// Tous les personnages sont inventés. Les événements de la campagne s'écartent de l'histoire dès 1716 ; aucun pirate ayant réellement existé n'a sa place ici.
import { GRAINS_MAX, REGLE_DES_GRAINS } from "../iles-regles";
import { NOMS_ILES_DU_VENT } from "./pirates-table";
import type { Canon } from "./types";

export const ILES_DU_VENT: Canon = {
  genre: "pirates",
  monde: "les Îles du Vent",
  continent: "les Antilles",
  capitale: "L'Anse-aux-Lames",
  calendrier: { long: "ordinaire", court: "de la Flotte", debutCourt: 1715, anDeJeu: 1716, saison: "printemps" },

  chronologie: [
    { an: 1665, quoi: "Les Français s'installent sur la côte nord de Saint-Domingue." },
    { an: 1692, quoi: "Un séisme engloutit une partie de Port Royal, en Jamaïque." },
    { an: 1697, quoi: "La paix de Ryswick : l'Espagne reconnaît la partie française de Saint-Domingue." },
    { an: 1701, quoi: "La guerre de Succession d'Espagne commence : douze ans de guerre, pendant lesquels les flibustiers servent comme corsaires." },
    { an: 1703, quoi: "Un incendie achève Port Royal ; les négociants de la Jamaïque s'installent à Kingston." },
    { an: 1713, quoi: "La paix d'Utrecht : plus de lettres de course. Les corsaires deviennent des pirates, et la corde attend ceux qui se font prendre. L'Angleterre obtient en plus l'asiento, le droit de vendre des captifs d'Afrique aux colonies espagnoles pendant trente ans." },
    { an: 1715, quoi: "24 juillet : la Flotte d'Argent appareille de La Havane. Dans la nuit du 30 au 31, une tempête la jette sur les bancs de Floride : mille morts, des millions de piastres au fond. C'est l'an 0 de la Flotte." },
    { an: 1715, quoi: "Septembre : mort de Louis XIV, régence du duc d'Orléans." },
    { an: 1715, quoi: "Décembre : première attaque de pirates contre le camp de plongée espagnol." },
    { an: 1716, quoi: "Année de jeu : l'hiver a vu la seconde attaque du camp ; au printemps, Nassau devient le repaire des pirates, et des marins jurent avoir vu au large de la Floride un navire à la coque blanche qui ne répond à aucun signal." },
  ],

  regions: [
    {
      nom: "L'Anse-aux-Lames",
      situation: "sur la côte nord de Saint-Domingue, au fond d'une baie profonde entre deux caps",
      paysage: "une baie bleu sombre, un bourg de cases de bois sur pilotis, un quai de pierre, une église au toit de palmes, la maison du lieutenant du roi, et sur la colline une batterie de huit canons qui n'a jamais tiré sur un flibustier",
      gens: ["flibustiers", "boucaniers", "marchands", "aubergistes", "couturières", "prêtres", "affranchis", "captifs qui travaillent au quai"],
      peur: "le mal de Siam, les ouragans d'août, la frégate du roi qui viendra un jour faire respecter la paix",
      lieuDeRencontre: "le quai de l'Anse-aux-Lames, au soleil couchant, quand un brigantin rentre en tirant un coup de canon",
      lieux: ["le Grand Hunier", "la taverne du Grand Hunier", "le quai de l'Anse-aux-Lames", "la batterie", "la maison du lieutenant du roi", "l'église de l'Anse-aux-Lames"],
    },
    {
      nom: "Les bancs de Floride",
      situation: "sur la côte basse de la Floride, au nord de Cuba",
      paysage: "une côte de sable et de palétuviers, des eaux turquoise à six brasses, des mâts d'épaves qui dépassent à marée basse, un fort de pieux et un camp de plongée",
      gens: ["soldats espagnols", "plongeurs réduits en esclavage", "pirates", "chasseurs d'épaves de tous les pays", "les Ais, qui vivaient là avant le camp"],
      peur: "les requins, les patrouilles espagnoles, les autres pirates, les nuits sans lune",
      lieuDeRencontre: "une barque sur l'eau claire des bancs de Floride, à six brasses des mâts d'une épave",
      lieux: ["le camp de plongée espagnol", "le fort de pieux", "la Capitana", "les épaves de la Flotte", "la côte de Floride"],
    },
    {
      nom: "La Havane",
      situation: "sur la côte nord de Cuba",
      paysage: "la plus grande ville des Antilles, le port fortifié, le château du Morro à l'entrée de la baie, les galions, les églises et la forteresse de la Real Fuerza, où loge le gouverneur",
      gens: ["marchands", "soldats", "moines", "familiers du Saint-Office"],
      peur: "la peste, les Anglais, le gouverneur depuis qu'il a perdu la Flotte",
      lieuDeRencontre: "la baie de La Havane, au matin, quand on tire la chaîne qui ferme le port",
      lieux: ["le château du Morro", "la Real Fuerza", "la chaîne du port", "la baie de La Havane"],
    },
    {
      nom: "Nassau",
      situation: "sur une petite île des Bahamas",
      paysage: "un port naturel, un fort en ruine, des tentes de voiles volées et des cabanes de planches arrachées aux épaves",
      gens: ["pirates de toutes les nations", "quartiers-maîtres", "marchands de passage"],
      peur: "le jour où un roi enverra une escadre",
      lieuDeRencontre: "les tentes de voiles de Nassau, devant une caisse d'épave où l'on lit la chasse-partie",
      lieux: ["le fort en ruine de Nassau", "les tentes de voiles", "le port naturel de Nassau"],
    },
    {
      nom: "Saint-Pierre de la Martinique",
      situation: "à la Martinique, au pied d'un volcan vert",
      paysage: "la ville française la plus riche des Îles du Vent, un port de commerce, des entrepôts de sucre et de tafia, des centaines de barriques en rangs",
      gens: ["négociants", "planteurs", "administrateurs du roi", "religieux", "captifs des sucreries"],
      peur: "les révoltes des esclaves, les Anglais, la montagne",
      lieuDeRencontre: "le quai de Saint-Pierre de la Martinique, entre les barriques de sucre, sous le volcan",
      lieux: ["le quai de Saint-Pierre", "les entrepôts de sucre", "le volcan de la Martinique"],
    },
    {
      nom: "Les mornes de Saint-Domingue",
      situation: "dans les montagnes de l'intérieur de Saint-Domingue",
      paysage: "des montagnes couvertes de forêt humide, coupées de ravins, où les routes des plantations ne montent pas, des villages cachés défendus par des pièges et des sentinelles",
      gens: ["marrons", "boucaniers", "sentinelles", "chasseurs de marrons"],
      peur: "les chasseurs de marrons et leurs chiens, les planteurs qui paient à la tête",
      lieuDeRencontre: "un sentier de crête des mornes de Saint-Domingue, sous le regard d'une sentinelle",
      lieux: ["le village de Mère Abla", "les sentiers de crête", "les ravins des mornes", "un village de marrons"],
    },
    {
      nom: "La fosse de Bahama",
      situation: "au nord des bancs de Floride, dans le canal de Bahama",
      paysage: "un canal où la mer devient d'un bleu presque noir, à plus de trois cents brasses de fond, et un courant violent qui file vers le nord",
      gens: ["marins de passage"],
      peur: "le gros temps, et tout ce qu'on ne voit pas dans le courant",
      lieuDeRencontre: "la fosse de Bahama, à l'aube, sur une mer d'encre où file un courant",
      lieux: ["le courant de la fosse", "le canal de Bahama"],
    },
  ],
  autresLieux: [
    "Partout", "les Îles", "les Îles du Vent", "les Grandes Antilles", "les Antilles", "la mer des Antilles", "Saint-Domingue", "la Tortue", "la Martinique", "Cuba", "la Jamaïque",
    "Kingston", "Port Royal", "les Bahamas", "la Floride", "Carthagène", "Léogane", "Cadix", "Gênes", "Amsterdam", "Mexico", "Madrid", "Londres", "Paris", "le Conseil de Marine", "la Real Fuerza",
    "Saint-Malo", "Dieppe", "La Rochelle", "Rouen", "l'Espagne", "la France", "l'Angleterre", "la Hollande", "l'Europe", "les Indes", "l'Afrique", "le Pérou",
    "Ryswick", "Utrecht", "Bristol", "Cork", "l'Atlantique", "les Açores", "l'Empire", "la Marine", "guerre de Succession d'Espagne", "Succession d'Espagne", "Louis XIV", "le Régent", "le duc d'Orléans", "la Pie-Noire", "la Vengeance-de-Rouen", "le sloop", "le brigantin",
  ],

  factions: [
    { id: "freres", nom: "Les Frères de la Côte", alias: ["Frères de la Côte", "les Frères", "la Côte", "les flibustiers", "les pirates", "la chasse-partie"], but: "la liberté, la part, et la mort des marchands qui résistent", signe: "le pavillon noir, et chaque capitaine le sien", penche: "la part", membres: ["capitaine", "quartier-maître", "matelot", "flibustier", "boucanier"] },
    { id: "havane", nom: "Le gouverneur de La Havane", alias: ["gouverneur de La Havane", "le gouverneur", "les Espagnols", "l'Espagne", "la Couronne d'Espagne", "les soldats espagnols", "le camp de plongée"], but: "remonter l'argent de la Flotte et pendre les pirates", signe: "la croix de Bourgogne", penche: "l'argent du roi", membres: ["gouverneur", "capitaine", "soldat", "familier du Saint-Office"] },
    { id: "roi", nom: "Le lieutenant du roi à Saint-Domingue", alias: ["lieutenant du roi", "le lieutenant du roi", "les Français", "le roi de France", "la France"], but: "que la colonie prospère et que la paix tienne", signe: "la fleur de lys sur le pavillon blanc du roi", penche: "la paix", membres: ["lieutenant du roi", "officier", "garde-côte"] },
    { id: "compagnie", nom: "Les négociants de Kingston", alias: ["négociants de Kingston", "les négociants de Kingston", "les Anglais", "les corsaires de la Jamaïque", "les corsaires anglais"], but: "le commerce, et l'argent de la Flotte s'il traîne", signe: "la croix de Saint-Georges", penche: "l'argent", membres: ["agent", "négociant", "corsaire"] },
    { id: "marrons", nom: "Les marrons des mornes", alias: ["marrons", "Marrons", "les marrons", "un marron", "une marronne", "les villages cachés"], but: "rester libres, et libérer les autres", signe: "une conque, dont le son porte d'une crête à l'autre", penche: "la liberté", membres: ["cheffe de village", "sentinelle", "éclaireur"] },
    { id: "navire-blanc", nom: "Le Navire blanc", alias: ["Navire blanc", "la voile blanche", "la frégate blanche", "le navire à la coque blanche"], but: "inconnu : on le voit à l'aube, jamais à la tombée du soir, et il ne répond pas aux signaux", signe: "une coque blanche comme un os, sans pavillon", penche: "le silence", membres: ["capitaine", "matelot"] },
  ],

  figures: [
    { nom: "Nicolas Faucheux", alias: ["Faucheux", "Bras-de-Fer", "le capitaine Faucheux", "le capitaine Bras-de-Fer", "Faucheux dit Bras-de-Fer"], titre: "capitaine du brigantin Vengeance-de-Rouen, dit Bras-de-Fer", ou: "L'Anse-aux-Lames", faction: "freres", age: 40, etat: "vivant" },
    { nom: "don Ignacio de Arriaga", alias: ["Arriaga", "don Ignacio", "le gouverneur Arriaga"], titre: "gouverneur de La Havane", ou: "La Havane", faction: "havane", age: 55, etat: "vivant" },
    { nom: "monsieur de Vaucelles", alias: ["Vaucelles", "le lieutenant Vaucelles"], titre: "lieutenant du roi à Saint-Domingue", ou: "L'Anse-aux-Lames", faction: "roi", age: 45, etat: "vivant" },
    { nom: "Mère Abla", alias: ["Abla", "mère Abla"], titre: "cheffe des marrons des mornes", ou: "Les mornes de Saint-Domingue", faction: "marrons", age: 60, etat: "vivant" },
    { nom: "Ama", alias: ["la plongeuse évadée"], titre: "plongeuse évadée, dans les mornes", ou: "Les mornes de Saint-Domingue", faction: "marrons", age: 19, etat: "vivant" },
    { nom: "Josiah Truscott", alias: ["Truscott", "Mr. Truscott", "Mr Truscott", "monsieur Truscott"], titre: "agent des négociants de Kingston", ou: "Kingston", faction: "compagnie", age: 50, etat: "vivant" },
    { nom: "don Esteban de Larrañaga", alias: ["Larrañaga", "don Esteban"], titre: "capitaine du Navire blanc", ou: "La fosse de Bahama", faction: "navire-blanc", age: 35, etat: "vivant" },
    // À la première séance (bible, section 11)
    { nom: "Isidore Le Goff", alias: ["Le Goff", "le capitaine Le Goff"], titre: "patron du sloop Pie-Noire", ou: "L'Anse-aux-Lames", faction: "freres", age: 45, etat: "vivant" },
    { nom: "Nanon", alias: ["la plongeuse de Le Goff"], titre: "affranchie, plongeuse à la part pour Le Goff", ou: "L'Anse-aux-Lames", age: 30, etat: "vivant" },
    { nom: "maître Duclos-Varenne", alias: ["Duclos-Varenne", "Maître Duclos-Varenne"], titre: "négociant de Saint-Pierre", ou: "Saint-Pierre de la Martinique", etat: "vivant" },
  ],

  divinites: [],

  peuples: [
    "Flibustier", "Flibustiers", "Flibustiers de la Côte", "Enfant de la Tortue", "Mousse de la Côte", "Enfant du quai",
    "Boucanier", "Boucaniers", "Chasseur du boucan", "Engagé devenu boucanier",
    "Marron", "Marrons", "Marronne", "Marronnes", "Né libre dans les mornes", "Évadé de la plantation",
    "Gens de France", "Cadet de Saint-Malo", "Déserteur de La Rochelle",
    "Espagnols et Créoles de Cuba", "Espagnol", "Espagnols", "Créole", "Créoles", "Créole de La Havane", "Marin de Carthagène",
    "Gens de toutes les mers", "Marin du Nord", "Libre des îles", "Africain libre", "Africains libres", "Affranchi", "Affranchie", "Affranchis", "Affranchies",
    "Anglais", "Hollandais", "Irlandais", "Français", "Françaises", "Caraïbes", "Caraïbe", "Caraïbes des îles", "Kalinagos", "Kalinago", "Africains", "Africaines", "Ais", "Ai",
    // Classes
    "Capitaine", "Canonnier", "Boucanier", "Chirurgien de bord", "Gabier", "Bretteur", "Maître de manœuvre", "Contrebandier", "Aumônier", "Plongeur",
    // Historiques
    "Matelot", "Engagé", "Cadet de famille", "Plongeur d'épaves",
  ],

  vocabulaire: [
    "chasse-partie", "chasses-parties", "Moral", "Chance", "Grains", "Grain", "Coup de main", "Coups de main", "partage", "part", "parts", "prise", "prises",
    "piastre", "piastres", "huit", "réal", "réaux", "livre tournois", "livres tournois", "livre sterling", "livres sterling", "sou", "sous", "doublon", "doublons",
    "tafia", "mal de Siam", "scorbut", "quinquina", "boucan", "boucaner", "morne", "mornes", "marron", "marrons", "conque",
    "Flotte d'Argent", "la Flotte", "de la Flotte", "an 0 de la Flotte", "Capitana", "Navire blanc", "le Navire blanc", "Pie-Noire", "Vengeance-de-Rouen",
    "Frères de la Côte", "flibustier", "flibustiers", "pirate", "pirates", "corsaire", "corsaires", "lettre de course", "lettres de course",
    "sloop", "brigantin", "goélette", "frégate", "galion", "galions", "navire", "navires", "canon", "canons", "batterie", "bordée", "mât", "mâts", "hunier", "grand hunier", "voile", "voiles",
    "bâbord", "tribord", "proue", "poupe", "pont", "cale", "gaillard", "barre", "haubans", "vergue", "vergues", "ancre", "mouillage", "abordage", "grappin", "grappins",
    "pistolet à silex", "pistolet", "pistolets", "mousquet", "mousquets", "fusil boucanier", "tromblon", "sabre d'abordage", "coutelas", "hache d'abordage", "poignard", "grenade", "grenades", "mèche", "long feu",
    "justaucorps", "buffle", "cuirasse", "tricorne", "longue-vue", "boussole", "compas", "loch", "arbalète de Jacob", "quartier de Davis", "alizés", "ouragan", "ouragans", "brasse", "brasses", "lieue", "lieues", "nœud", "nœuds",
    "quartier-maître", "quartiers-maîtres", "maître de manœuvre", "maître charpentier", "chirurgien", "chirurgien de bord", "gabier", "gabiers", "mousse", "matelot", "matelots", "aumônier",
    "lieutenant du roi", "Régent", "Saint-Office", "familier du Saint-Office", "croix de Bourgogne", "croix de Saint-Georges", "fleur de lys", "pavillon noir", "pavillon blanc",
    "négociants de Kingston", "asiento", "plongeur", "plongeurs", "camp de plongée", "épave", "épaves", "cloche à plongeur",
    "Léogane", "Grand Hunier", "Saint-Pierre", "Morro", "Mère", "Abla", "Ama", "Nanon", "Faucheux", "Bras-de-Fer", "Arriaga", "Vaucelles", "Truscott", "Josiah", "Le Goff", "Isidore", "Duclos-Varenne",
    "Mr", "don", "maître", "monsieur", "mère",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle.
  secrets: [
    "L'argent de la Flotte était faux", "argent de la Flotte était faux", "piastres de plomb", "plomb et d'étain", "pièce fausse", "pièces fausses", "piastres fausses", "fausses piastres",
    "pièce qui sonne faux", "pièces qui sonnent faux", "caisses du faux", "mêle les fausses aux vraies", "mêlé les fausses aux vraies", "frapper à Mexico", "frappé à Mexico",
    "croix rouge", "Santa Clara", "Larrañaga", "blanc de plomb", "Matanzas", "registre des caisses", "registre de Larrañaga",
    "coule les caisses", "coulées dans la fosse", "caisses coulées", "une soixantaine de caisses",
    "Arriaga a fait jeter", "fait jeter la Flotte", "jeté la Flotte à la côte", "ordres scellés", "lettre de Madrid", "Madrid avertit", "analysée à Gênes", "il croit avoir sauvé l'Espagne",
    "paie la Santa Clara", "pouvoir secret", "complicité d'Arriaga", "trois paliers de preuve",
    "paie trois capitaines", "garde une pièce", "lettre du Régent", "ce qui inquiète l'Espagne",
    "sa petite-fille", "petite-fille de Mère Abla", "sa petite fille",
    "doit de l'argent à Duclos-Varenne", "vendu l'emplacement de la caisse", "pour le compte de Vaucelles", "offre à Mère Abla la paix",
  ],

  anachronismes: [
    // Rien d'après 1716
    "automobile", "automobiles", "voiture à moteur", "camion", "camions", "avion", "avions", "aéroplane", "hélicoptère", "revolver", "Colt", "Winchester", "cartouche", "cartouches", "mitrailleuse", "pistolet automatique",
    "fusil à percussion", "capsule fulminante", "pistolet à percussion", "dollar", "dollars", "télégraphe", "télégramme", "bateau à vapeur", "machine à vapeur", "vapeur", "locomotive", "chemin de fer",
    "octant", "sextant", "chronomètre", "photographie", "téléphone", "ampoule électrique", "électricité", "radio", "cinéma", "film", "télévision", "ordinateur", "internet", "smartphone", "moteur à explosion", "pétrole raffiné",
    "Jolly Roger", "fer à vapeur", "Union Jack", "drapeau tricolore", "tricolore", "Louis XV", "Louis XVI", "Napoléon", "Révolution",
    // Rien de magique ni de fantastique, rien du folklore de cinéma
    "sortilège", "sortilèges", "magie", "magicien", "magicienne", "sorcier", "sorcière", "vaudou", "zombie", "zombies", "fantôme", "fantômes", "revenant", "revenants", "malédiction", "maudit", "maudite", "maudits", "kraken",
    "sirène", "sirènes", "dragon", "elfe", "elfes", "nain", "gobelin", "orc", "grimoire", "potion", "épée enchantée", "enchantement", "navire fantôme", "équipage fantôme",
    // Clichés que le jeu refuse
    "carte au trésor", "cartes au trésor", "trésor enterré", "trésors enterrés", "marcher sur la planche", "faire marcher sur la planche", "perroquet sur l'épaule", "jambe de bois", "cache-œil",
    // Licences connues et pirates ayant existé
    "Pirates des Caraïbes", "Jack Sparrow", "Long John Silver", "L'Île au trésor", "Capitaine Crochet", "Monkey Island", "Sea of Thieves", "Black Flag", "Barbe-Noire", "Barbe Noire", "Blackbeard", "Hornigold", "Jennings", "Bellamy", "Rackham", "Anne Bonny", "Stede Bonnet", "La Buse", "Levasseur", "Morgan",
  ],

  noms: NOMS_ILES_DU_VENT,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "Un capitaine de l'Anse-aux-Lames cherche des hommes pour une course en Floride, et la part qu'il promet est trop belle.", factions: ["freres"] },
    { texte: "Une barque de pirates attaque le camp de plongée ; un plongeur appelle à l'aide depuis l'eau.", factions: ["havane"] },
    { texte: "Une barre d'argent couverte de coquillages est mise aux enchères à l'Anse-aux-Lames, et trois capitaines la veulent.", factions: ["freres"] },
    { texte: "Des chasseurs de marrons traversent le quai de l'Anse-aux-Lames avec une évadée enchaînée.", factions: ["marrons"] },
    { texte: "Le lieutenant du roi offre une grâce à qui lui livrera un pirate qu'il ne peut pas pendre lui-même.", factions: ["roi", "freres"] },
    { texte: "Un équipage jure avoir vu, à l'aube, la voile blanche couler quelque chose dans la fosse de Bahama. Personne ne le croit.", factions: ["navire-blanc"] },
    { texte: "Un agent de Kingston paie en livres anglaises et sourit : il veut quelqu'un qui connaisse les bancs de Floride.", factions: ["compagnie"] },
  ],

  cartes: {
    evenements: [
      { titre: "Le coup de canon au large", texte: "Un brigantin rentre dans la baie toutes voiles dehors et tire un coup de canon pour annoncer sa prise. Sur le quai, la foule court.", effet: "Une prise est à vendre ce soir : un test d'Investigation DD 12 dit à qui elle appartient avant que le quai ne se la partage." },
      { titre: "Le grain de l'après-midi", texte: "L'horizon vire au violet, le vent tourne d'un coup. Les anciens posent la main sur la barre sans rien dire.", effet: "Un grain : test de manœuvre DD 13, ou 1d6 de dégâts à la voilure et le Moral baisse de 1." },
      { titre: "La chasse-partie lue à voix haute", texte: "Debout sur une caisse d'épave, un quartier-maître lit la chasse-partie devant trois cents hommes. À chaque article, il attend que la foule crie oui.", effet: "Un personnage peut parler contre un article : test de Persuasion DD 14. Réussi, l'équipage le suit (avantage à ses tests de Persuasion dans l'équipage jusqu'à la fin de la séance) ; raté, il perd la face." },
      { titre: "La barque du plongeur", texte: "Sur l'eau claire des bancs, un plongeur remonte, la corde à la ceinture, une barre d'argent noire de coquillages dans les bras. Sur la plage, à cent pas, un soldat espagnol compte les barres et ne regarde pas l'homme.", effet: "Une scène, pas un butin. Atteindre le plongeur à la nage : Athlétisme DD 13 ; le soldat lève les yeux à la fin du tour." },
      { titre: "Les chiens sur le quai", texte: "Des chasseurs de marrons traversent le bourg, une évadée enchaînée entre eux, deux chiens à la longe. Les marins de l'Anse regardent par-dessus leur pot.", effet: "Intervenir a un prix, se taire aussi. Les chasseurs sont six et armés ; Intimidation DD 16 ou Persuasion DD 15 les fait hésiter, et tout le quai a vu ce que tu as fait." },
      { titre: "Le mal de Siam au mouillage", texte: "Un homme tombe sur le pont en plein soleil, la peau jaune, les yeux rouges. Le chirurgien ne dit rien et se lave les mains.", effet: "Ceux qui l'ont soigné font une sauvegarde d'Endurance DD 11 : un échec donne un niveau d'épuisement et la fièvre (voir les fièvres)." },
      { titre: "La bouée de liège", texte: "Une bouée de liège arrachée de sa ligne passe dans le courant bleu-noir. Très loin, à l'aube, une tache pâle qui s'efface avant qu'on la nomme.", effet: "Test de Perception DD 15 pour la garder des yeux avant qu'elle ne disparaisse. Personne ne répond aux signaux." },
      { titre: "Le tafia de Nassau", texte: "Des barils marqués au fer de dix ports, des tables de bordé arrachées à des épaves, trois cents hommes qui chantent faux.", effet: "Une soirée pour parler à tout le monde : Persuasion DD 12 pour une information. Boire plus d'un pot oblige à une sauvegarde d'Endurance DD 10 le lendemain, sous peine d'un désavantage à son premier test." },
      { titre: "Une voile aux armes du roi", texte: "Une voile paraît au large de l'Anse-aux-Lames, un pavillon blanc à la fleur de lys. Sur le quai, les hommes d'équipage sortent les prises des entrepôts pour les cacher.", effet: "Cacher les prises avant la nuit : Tromperie ou Discrétion DD 13 pour le groupe. Raté, le Moral baisse de 1." },
      { titre: "La tête mise à prix", texte: "Une affiche clouée au poteau du quai : un prix en livres tournois pour un nom que tout le monde connaît. L'encre est fraîche.", effet: "Qui a payé pour la faire écrire ? Investigation DD 13 ou Histoire DD 13 le dit à celui qui sait lire les sceaux." },
      { titre: "Le calme plat", texte: "Plus un souffle depuis trois jours. L'eau est un miroir, la poix fond sur le pont, les hommes regardent l'horizon sans parler.", effet: "Le navire ne bouge pas. Si le capitaine ne trouve rien à dire ni à partager avant le troisième jour, le Moral baisse de 1." },
      { titre: "L'enchère du soir", texte: "Sous les lanternes du Grand Hunier, un crieur lève une barre d'argent noire de coquillages. Trois capitaines se regardent sans se saluer.", effet: "Qui surenchérit ? Chaque offre dite à voix haute peut être suivie d'un coup de couteau : un test d'Intuition DD 13 dit qui prépare le sien." },
    ],
    objets: [
      { titre: "Un pistolet à silex", texte: "Une platine lisse, une crosse noire de sueur, l'initiale d'un autre gravée sous le pontet.", effet: "1d10 perforants, portée 9/27 m, un coup, rechargement long. Il vaut 3 piastres." },
      { titre: "Un sabre d'abordage", texte: "Une lame courte et lourde, une garde de laiton mordue de sel, et une encoche près de la pointe pour chaque pont enlevé.", effet: "1d8 tranchants, finesse. Il vaut 2 piastres." },
      { titre: "Une grenade de terre cuite", texte: "Une boule de grès bouchée de cire, une mèche de chanvre qui dépasse. Elle sent la poudre.", effet: "Mèche allumée, lancée à 9 m : 1d6 contondants dans 3 m, sauvegarde d'Adresse DD 11 pour moitié, et elle met le feu à la toile. 2 piastres." },
      { titre: "Un baril de tafia", texte: "Marqué au fer d'un port que personne ne reconnaît. Le bois est encore humide de la cale.", effet: "Quarante pots, vaut 4 piastres (prix de gros). Versé à la mer avant l'abordage, c'est une coutume qui coûte : un jeton de Chance (une fois par séance)." },
      { titre: "Une bourse de huit", texte: "Des piastres rognées, des pièces coupées en quartiers pour faire l'appoint, l'effigie d'un roi d'Espagne usée au pouce.", effet: "Vaut 8 piastres. À l'Anse-aux-Lames, personne ne regarde les pièces ; à Kingston, on les pèse." },
      { titre: "Une longue-vue de laiton", texte: "Quatre tubes qui coulissent, une lentille rayée, la graisse de la main de trois capitaines sur le cuir.", effet: "Avantage aux tests de Perception à distance : un pavillon se lit à huit kilomètres. Elle vaut 12 piastres." },
      { titre: "Une arbalète de Jacob", texte: "Une longue tige de poirier graduée et trois voyants de bois qui coulissent. Elle mesure la hauteur du soleil, si l'on n'a pas peur de s'y brûler les yeux.", effet: "Avantage aux tests de Survie pour trouver sa latitude. Elle vaut 3 piastres." },
      { titre: "Un coffre de chirurgien", texte: "Une scie, un bistouri, des aiguilles à suture, un flacon de quinquina, des linges que personne n'ose compter.", effet: "Permet de panser, d'amputer et de soigner la fièvre à bord : avantage aux tests de Médecine. Il vaut 15 piastres." },
      { titre: "Une chasse-partie signée", texte: "Un parchemin graissé, vingt-trois croix et signatures au bas, une tache de vin sur l'article des blessés.", effet: "Montrée à un équipage, elle prouve qui a promis quoi : avantage en Persuasion pour réclamer sa part. La perdre est une faute grave : Moral −1 si l'équipage l'apprend." },
      { titre: "Une conque", texte: "Un grand coquillage rose à l'embouchure polie. Son son porte d'une crête à l'autre.", effet: "Soufflée dans les mornes, les sentinelles répondent. Elle ne s'achète pas : celui qui t'en confie une te fait confiance, et la perdre est une faute." },
    ],
  },

  campagne: {
    jauge: {
      nom: "la Paix des Îles",
      depart: 100,
      max: 100,
      seuils: [
        { valeur: 75, effet: "Les gouverneurs envoient des frégates contre les repaires pirates." },
        { valeur: 50, effet: "L'Espagne arme une flotte ; la France rappelle ses navires. Un port ami sur deux ferme ses portes aux pirates." },
        { valeur: 25, effet: "La guerre aux Indes : plus aucune paix entre les îles." },
        { valeur: 0, effet: "La guerre en Europe. Fin de campagne : qui a l'argent, qui a la preuve, et qui est encore vivant ?" },
      ],
      remontees: [
        { action: "Un pirate livré, ou un traité respecté (une fois par séance au plus)", gain: 5 },
        { action: "La frégate blanche disparaît sans que personne ne sache pourquoi (une seule fois)", gain: 10 },
      ],
      descentes: [
        { action: "Un navire de guerre d'une couronne coulé ou pris (une fois par séance au plus)", perte: 5 },
        { action: "Une attaque réussie contre le camp de plongée espagnol (une fois par séance au plus)", perte: 10 },
        { action: "Une libération de plongeurs : elle humilie l'Espagne, et le gouverneur durcit le camp (une fois par séance au plus)", perte: 5 },
        { action: "La preuve de la fraude arrive dans une cour d'Europe (une seule fois)", perte: 20 },
      ],
    },
    reserve: {
      nom: "Grains",
      max: GRAINS_MAX,
      regle: REGLE_DES_GRAINS,
    },
    accroches: [
      { titre: "La chasse-partie", niveaux: [1, 4], factions: ["freres"], texte: "Signer avec un capitaine pour une course en Floride ; la part promise est trop belle." },
      { titre: "Le camp de plongée", niveaux: [1, 4], factions: ["havane"], texte: "Une barque de pirates attaque le camp ; un plongeur appelle à l'aide depuis l'eau." },
      { titre: "La barre noire", niveaux: [1, 4], factions: ["freres"], texte: "Une barre d'argent couverte de coquillages, mise aux enchères à l'Anse-aux-Lames ; trois capitaines la veulent." },
      { titre: "Les chiens", niveaux: [1, 4], factions: ["marrons"], texte: "Des chasseurs de marrons traversent l'Anse-aux-Lames avec une évadée enchaînée." },
      { titre: "Le pavillon blanc", niveaux: [1, 4], factions: ["roi"], texte: "Vaucelles offre une grâce à qui lui livrera un pirate qu'il ne peut pas pendre lui-même." },
      { titre: "La voile blanche", niveaux: [5, 10], factions: ["navire-blanc"], texte: "Un équipage jure l'avoir vue couler des caisses ; personne ne le croit." },
      { titre: "La pièce qui sonne faux", niveaux: [5, 10], factions: ["marrons"], texte: "Ama montre sa pièce ; Mère Abla demande qu'on libère les plongeurs en échange de son histoire." },
      { titre: "Nassau", niveaux: [5, 10], factions: ["freres"], texte: "La république des pirates vote ; quelqu'un veut l'or de la Flotte pour l'acheter." },
      { titre: "Kingston", niveaux: [5, 10], factions: ["compagnie"], texte: "Truscott propose un marché : la Floride contre une commission du gouverneur de la Jamaïque, que Londres n'a pas approuvée." },
      { titre: "Le porte-bonheur de Bras-de-Fer", niveaux: [5, 10], factions: ["freres"], texte: "Faucheux perd sa pièce au jeu ; elle passe de main en main." },
      { titre: "La Santa Clara", niveaux: [11, 16], factions: ["navire-blanc", "freres", "roi"], texte: "Bras-de-Fer veut l'aborder pour le butin, Vaucelles veut qu'on la suive sans tirer ; si on la coule, la paix tient (+10), mais la preuve disparaît." },
      { titre: "Le registre", niveaux: [11, 16], factions: ["navire-blanc", "havane"], texte: "Larrañaga garde le registre ; Arriaga a envoyé quelqu'un pour le lui reprendre. Qui le tient en premier décide de ce qu'il vaut." },
      { titre: "La Havane", niveaux: [11, 16], factions: ["havane"], texte: "Arriaga reçoit les personnages comme émissaires d'un traité, et sait qu'ils cherchent la preuve. Il veut un marché, pas un massacre." },
      { titre: "La lettre du Régent", niveaux: [11, 16], factions: ["roi"], texte: "Vaucelles a besoin d'une preuve pour Paris." },
      { titre: "La fosse de Bahama", niveaux: [11, 16], factions: ["navire-blanc"], texte: "Un plongeur jure avoir vu les caisses depuis un récif. Le groupe a une nuit pour y descendre avant la Santa Clara." },
      { titre: "Gênes", niveaux: [17, 20], factions: ["havane", "roi", "compagnie", "freres", "marrons", "navire-blanc"], texte: "La preuve peut ruiner l'Espagne ; à qui la porter ?" },
      { titre: "La flotte d'Espagne", niveaux: [17, 20], factions: ["havane", "marrons"], texte: "Arriaga arme tout pour reprendre l'épave. Les marrons proposent de livrer les plongeurs pour empêcher la flotte de partir ; le groupe choisit entre arrêter la flotte et libérer les plongeurs." },
      { titre: "La république", niveaux: [17, 20], factions: ["freres"], texte: "Nassau vote le partage du vrai argent. Un capitaine propose de vendre la preuve à l'Espagne pour financer la république ; les autres veulent la garder pour une vraie paix." },
      { titre: "Les plongeurs", niveaux: [17, 20], factions: ["marrons", "havane"], texte: "Libérer les plongeurs de Floride, au prix de tout le reste." },
      { titre: "L'argent", niveaux: [17, 20], factions: ["havane", "roi", "compagnie", "freres", "marrons", "navire-blanc"], texte: "Porter la preuve en Europe et faire tomber l'Espagne (la guerre) ; vendre le silence à Arriaga (une fortune, et la paix) ; ou couler la preuve dans la fosse, partager le vrai argent avec les plongeurs et les marrons, et disparaître." },
    ],
  },
};
