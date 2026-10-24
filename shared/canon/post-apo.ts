// Canon du Grand Sec (post-apocalyptique, sud de la France, 2071), tiré de la bible du monde (content/grand-sec/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; on compte aussi « du Sec » à partir de 2031 (an 0, la dernière pluie sur Avignon).
// Le réseau des trente-deux Mâts et ce qu'il fait des nuages sont dans les secrets, pas dans la chronologie : rien n'y dépasse l'année de jeu.
import { NOMS_GRAND_SEC } from "./post-apo-table";
import type { Canon } from "./types";

export const GRAND_SEC: Canon = {
  genre: "post-apo",
  monde: "le Grand Sec",
  continent: "le Bas-Pays",
  capitale: "Avignon-la-Sèche",
  calendrier: { long: "de l'ère commune", court: "du Sec", debutCourt: 2031, anDeJeu: 2071, saison: "été" },

  chronologie: [
    { an: 2029, quoi: "Construction d'un domaine de luxe au sommet du Ventoux." },
    { an: 2031, quoi: "La dernière pluie sur Avignon, le 4 octobre : an 0 du Sec." },
    { an: 2034, quoi: "Le Rhône cesse de couler au sud de Valence." },
    { an: 2034, quoi: "La République ferme ses barrages au nord." },
    { an: 2038, quoi: "La République du Nord construit le Mur de Valence." },
    { an: 2040, quoi: "Le consortium propriétaire du domaine disparaît ; les Fontainiers prennent le domaine du Mont Chauve et fondent Montclair." },
    { an: 2041, quoi: "Les premiers réfugiés campent au pied du Mur : c'est la Porte-d'Attente." },
    { an: 2043, quoi: "Les Puisatiers forent le Grand Puits d'Avignon." },
    { an: 2046, quoi: "Premiers chars à voile sur la Route du Rhône." },
    { an: 2053, quoi: "La guerre des Puits : Nîmes et Avignon se battent pour la nappe ; Nîmes perd." },
    { an: 2062, quoi: "La Horde du Mistral apparaît sur la Route." },
    { an: 2068, quoi: "La Cigale prend la tête de la Horde du Mistral." },
    { an: 2071, quoi: "Année de jeu : le Grand Puits a baissé de dix mètres ; les Mâts chantent la nuit." },
  ],

  regions: [
    {
      nom: "La Route du Rhône",
      situation: "le lit du fleuve mort, de Valence à la mer",
      paysage: "trois cents mètres de sable gris et de galets, des quais qui dominent le vide, des ponts qui ne passent plus au-dessus de rien, des péniches couchées sur le flanc",
      gens: ["Bateliers de sable", "patrons de convoi", "gens des relais"],
      peur: "les jours sans vent, la Horde du Mistral, les tempêtes de sable qui montent du sud",
      lieuDeRencontre: "un char à voile arrêté en plein lit du fleuve, sous le soleil de midi",
      lieux: ["le pont d'Aramon", "Beaucaire", "les relais de la Route"],
    },
    {
      nom: "Avignon-la-Sèche",
      situation: "sur la rive du Rhône mort, à trois jours et quarante godets de Valence",
      paysage: "la ville des papes à moitié ensablée, des remparts transformés en citerne, et au centre du Palais le Grand Puits, avec son treuil à manège et ses gardes",
      gens: ["Puisatiers", "arbalétriers", "marchands", "gens des puits"],
      peur: "que le Grand Puits baisse encore",
      lieuDeRencontre: "la file du Grand Puits, dans la cour du Palais",
      lieux: ["le Grand Puits", "le Palais", "le tribunal des Puisatiers"],
    },
    {
      nom: "Les Salins",
      situation: "la côte, de Marseille à la Camargue",
      paysage: "des plages noires de suie, des bouilleries de cuivre qui fument jour et nuit, des cuves de sel que les enfants raclent",
      gens: ["Saliniers", "bouilleurs de sel", "pêcheurs"],
      peur: "la fin du bois : il n'y a plus une forêt à trois jours de la côte",
      lieuDeRencontre: "une plage noire de suie, entre les alambics des bouilleries",
      lieux: ["Marseille", "les bouilleries"],
    },
    {
      nom: "Les Cévennes",
      situation: "les montagnes à l'ouest du Rhône, avec les crêtes du Diois et des Préalpes au nord-est",
      paysage: "des châtaigniers morts, gris comme des os, des restanques effondrées, des villages de pierre abandonnés, et sur les crêtes les Mâts, des tours de métal blanc de quarante mètres",
      gens: ["Montagnards", "villageois des sources taries", "Gardes-Mâts"],
      peur: "les Mâts qui chantent la nuit, et les gens en blanc qui tirent sur ceux qui approchent",
      lieuDeRencontre: "une crête des Cévennes, au pied d'un Mât qui tourne",
      lieux: ["le Diois", "le Vercors", "le centre de maintenance des Cévennes", "le centre de maintenance du Diois"],
    },
    {
      nom: "Le Mont Chauve et Montclair",
      situation: "le Ventoux, qu'on voit depuis Avignon, une montagne isolée",
      paysage: "des cailloux blancs jusqu'au sommet, puis la seule forêt verte du Bas-Pays, des citernes pleines, et la ville fortifiée de Montclair dans les murs d'un ancien domaine de luxe",
      gens: ["Fontainiers", "gardes de Montclair", "caravaniers"],
      peur: "de perdre la grâce, les pillards du bas, les péchés qui fâchent le ciel",
      lieuDeRencontre: "la route en lacets du Mont Chauve, au bord de la pluie",
      lieux: ["Montclair", "la porte basse de Montclair", "la salle du Conseil des Eaux"],
    },
    {
      nom: "Le Mur de Valence",
      situation: "à Valence, sur la frontière du nord",
      paysage: "un rempart de béton de vingt mètres qui barre la vallée, des miradors, des projecteurs, et derrière, au nord, des champs verts qu'on voit depuis les collines",
      gens: ["gens de la Porte-d'Attente", "soldats de la République", "passeurs"],
      peur: "les projecteurs, et la rumeur qu'on va ouvrir la porte",
      lieuDeRencontre: "le camp de la Porte-d'Attente, au pied du Mur de Valence",
      lieux: ["la Porte-d'Attente", "Valence"],
    },
    {
      nom: "La Camargue de sel",
      situation: "le delta du Rhône, à l'embouchure",
      paysage: "un désert blanc de sel craquelé, des carcasses de chevaux, des mas abandonnés, et l'étang de Vaccarès où des flamants maigres picorent des poissons que le sel a momifiés",
      gens: ["Gardians du sel", "caravaniers de sel"],
      peur: "le mirage, les sables mouvants de sel, les bêtes de Vaccarès",
      lieuDeRencontre: "une plaine de sel de la Camargue, sous un ciel blanc",
      lieux: ["l'étang de Vaccarès"],
    },
  ],
  autresLieux: ["Partout", "Nîmes", "les Alpilles", "les Préalpes", "le Ventoux", "le Rhône", "la Provence", "le Midi", "la République du Nord", "la France", "le nord", "le sud", "les ponts de la Route"],

  factions: [
    { id: "puisatiers", nom: "Les Puisatiers d'Avignon", alias: ["Puisatiers", "Puisatier", "la guilde des Puisatiers", "les arbalétriers d'Avignon"], but: "que le Grand Puits donne, et que l'eau reste à Avignon", signe: "un seau et une corde", penche: "le godet", membres: ["Maître-Puisatier", "Puisatier", "arbalétrier"] },
    { id: "fontainiers", nom: "Les Fontainiers de Montclair", alias: ["Fontainiers", "Fontainier", "Fontainière", "le Conseil des Eaux", "Conseil des Eaux", "gardes de Montclair"], but: "garder la grâce", signe: "une goutte d'argent sur fond bleu", penche: "la prière", membres: ["Prévôte des Eaux", "Fontainier", "garde de Montclair"] },
    { id: "bateliers", nom: "Les Bateliers de sable", alias: ["Bateliers", "Batelier", "Batelière", "Bateliers de la Route"], but: "que la Route reste ouverte et que le vent souffle", signe: "une voile carrée cousue sur l'épaule", penche: "le vent", membres: ["patron", "batelier", "vigie"] },
    { id: "horde", nom: "La Horde du Mistral", alias: ["Horde du Mistral", "la Horde", "Horde", "pillards de la Horde"], but: "prendre l'eau aux autres", signe: "une main peinte en rouge sur la voile", penche: "la terreur", membres: ["pillard", "pilote de char", "chanteur"] },
    { id: "penitents", nom: "Les Pénitents de la Pluie", alias: ["Pénitents", "Pénitent", "Pénitente", "Pénitents de la Pluie"], but: "faire revenir la pluie par la prière et la pénitence", signe: "une cagoule grise et un bâton de pluie", penche: "la ferveur", membres: ["Pénitent", "prédicateur"] },
    { id: "gardesmats", nom: "Les Gardes-Mâts", alias: ["Gardes-Mâts", "Garde-Mât", "Garde-Mâts"], but: "que les Mâts tournent", signe: "une combinaison blanche rapiécée et des lunettes noires", penche: "le devoir", membres: ["doyenne", "technicien", "garde"] },
    { id: "porte", nom: "Le camp de la Porte-d'Attente", alias: ["Porte-d'Attente", "gens de la Porte", "le camp du Mur"], but: "que la porte du Mur s'ouvre", signe: "un feu de camp contre le béton", penche: "l'espoir", membres: ["passeur", "gamin de la Porte"] },
    { id: "republique", nom: "La République du Nord", alias: ["République du Nord", "la République", "République", "soldats de la République"], but: "garder sa pluie et son fleuve", signe: "des projecteurs sur le béton", penche: "le mur", membres: ["officier", "sentinelle"] },
  ],

  figures: [
    { nom: "Sixtine Peyrol", alias: ["Peyrol", "la Prévôte des Eaux", "la Prévôte"], titre: "Prévôte des Eaux de Montclair", ou: "Montclair", faction: "fontainiers", age: 50, etat: "vivant" },
    { nom: "Baptistin Roumanille", alias: ["Roumanille", "Maître-Puisatier Roumanille", "le Maître-Puisatier"], titre: "Maître-Puisatier d'Avignon", ou: "le Palais", faction: "puisatiers", age: 60, etat: "vivant" },
    { nom: "Marius Fabre", alias: ["Fabre", "le Vieux Fabre", "Vieux Fabre"], titre: "le plus grand patron des Bateliers de sable", ou: "La Route du Rhône", faction: "bateliers", age: 70, etat: "vivant" },
    { nom: "La Cigale", alias: ["Cigale", "la cheffe de la Horde"], titre: "cheffe de la Horde du Mistral", ou: "La Route du Rhône", faction: "horde", age: 30, etat: "vivant" },
    { nom: "Anselme Garcin", alias: ["Frère Anselme", "frère Anselme", "Garcin"], titre: "prédicateur des Pénitents de la Pluie", ou: "La Route du Rhône", faction: "penitents", age: 68, etat: "vivant" },
    { nom: "Zélie Brun", alias: ["Brun", "la doyenne Brun", "la doyenne"], titre: "doyenne des Gardes-Mâts", ou: "le centre de maintenance des Cévennes", faction: "gardesmats", age: 62, etat: "vivant" },
    { nom: "Lucas Arnaud", alias: ["Lucas", "le gamin de la Porte"], titre: "gamin de la Porte-d'Attente", ou: "la Porte-d'Attente", faction: "porte", age: 14, etat: "vivant" },
    // À la première séance (bible, section 11)
    { nom: "Rose Faucon", alias: ["Faucon", "Rose"], titre: "jeune femme qui cherche une place pour Beaucaire", ou: "La Route du Rhône", etat: "vivant" },
  ],

  divinites: [],

  peuples: [
    "Gens des puits", "Gens du puits", "Enfants de la Route", "Enfant de la Route", "Saliniers", "Salinier", "Gens de la Porte-d'Attente", "Gens de la Porte", "Montagnards", "Montagnard", "Descendus de Montclair", "Descendu de Montclair",
    "Gardians du sel", "Gardian du sel", "Gardian", "Pillard repenti", "Enfant du Mur", "Fouilleur des ruines", "Fouilleur", "Bouilleur de sel", "Sourcière", "Mécano des ruines", "Médecin des sables", "Chef de convoi",
    "Batelier", "Pillard", "Pénitent", "Puisatier",
  ],

  vocabulaire: [
    "godet", "godets", "Soif", "gourde", "gourdes", "Prix", "Coup de mistral", "Coups de mistral", "Grand Sec", "Sec", "du Sec", "Bas-Pays", "la Route", "Route", "mistral", "marin", "char à voile", "chars à voile", "relais",
    "grâce", "caravane", "caravane du premier du mois", "laissez-passer", "bouillerie", "bouilleries", "alambic", "alambics", "capsule", "capsules", "sceau", "Mât", "Mâts", "Mont Chauve", "Ventoux",
    "citerne", "citernes", "puits", "puits sauvage", "puits sauvages", "restanque", "restanques", "bories", "châtaigniers", "Belle-Méjane", "la Belle-Méjane", "barils", "baril", "arbalète", "arbalètes", "arbalétrier", "arbalétriers",
    "fronde", "machette", "harpon", "harpons", "lance", "lances", "fusil", "fusils", "cartouche", "cartouches", "Porte", "Mur", "Palais", "Conseil", "Rhône", "Valence", "Avignon", "Montclair", "Beaucaire", "Aramon",
    "tribunal", "treuil", "manège", "sel", "bois", "éclipse", "flamants", "taureaux", "taureaux de Vaccarès", "Vaccarès", "mas", "sables mouvants de sel", "mirage", "tempête de sable", "tempêtes de sable",
    "Félibrige", "capsule de métal", "la caravane de Montclair", "Garde-Mât", "doigts du diable", "idoles du Sec", "bâton de pluie", "cagoule grise", "combinaison blanche", "lunettes noires",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle. Les Mâts eux-mêmes sont publics : on ne cache que ce qu'ils font.
  secrets: [
    "ensemencement des nuages", "tours d'ensemencement", "la pluie est volée", "poussent les nuages", "pousser les nuages", "poussé les nuages", "plans du consortium", "sans eux, il pleuvrait partout",
    "Ils nous paient pour ça", "Ne jamais les laisser s'arrêter", "trente-deux Mâts", "trente-deux tours", "le consortium a planté", "domaine de luxe, aujourd'hui Montclair", "Montclair perd sa pluie",
    "le Conseil des Eaux sait", "Conseil des Eaux le savent", "savent ce que font les Mâts", "sait ce que font les Mâts", "connaît le secret des Mâts", "la pluie revient sur le Bas-Pays", "Montclair redevient une montagne sèche",
    "paie les Gardes-Mâts", "paie ceux qui les entretiennent", "à quinze ans de la fin", "n'a plus que quinze ans", "accord secret avec Montclair", "négocie en secret avec Montclair",
    "moitié de l'eau prise va au camp", "moitié de son butin va à la Porte-d'Attente", "La Cigale est née à la Porte-d'Attente", "elle est née à la Porte-d'Attente", "passe déjà, une nuit par mois", "conduit d'eau sous le béton",
    "logo d'une société qui faisait de la météo", "cahier de sa mère", "technicienne du consortium", "pièces détachées monter vers les Mâts", "monter vers les Cévennes payé en eau", "montée pour compter les gardes", "Rose Faucon est de la Horde",
    "ne rendent personne malade", "tirent pour protéger les tours", "branchent leurs pompes sur les panneaux", "brancher leurs pompes sur les panneaux", "Les Pénitents ont raison sur les Mâts",
  ],

  anachronismes: [
    // Rien de magique ni de fantasy
    "sortilège", "sortilèges", "magie", "magicien", "magicienne", "sorcier", "sorcière", "épée enchantée", "enchantement", "dragon", "elfe", "elfes", "nain", "gobelin", "orc", "grimoire", "potion",
    // Licences connues
    "Mad Max", "Fallout", "Waterworld", "Dune", "Fremen", "Fremens", "épice", "Interceptor", "Imperator Furiosa",
    // Rien d'électronique en état de marche courant
    "smartphone", "téléphone portable", "internet", "wifi", "télévision en marche", "télévision", "ordinateur portable", "ordinateur", "GPS", "satellite", "drone", "radiation", "radiations", "radioactif", "radioactifs", "mutant", "mutants", "abri antiatomique",
  ],

  noms: NOMS_GRAND_SEC,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "Le Vieux Fabre cherche des gardes pour un char à voile d'Avignon à Beaucaire ; la Horde guette au pont d'Aramon.", factions: ["bateliers", "horde"] },
    { texte: "Un village creuse un puits sans payer la guilde, et le Maître-Puisatier veut qu'on le bouche.", factions: ["puisatiers"] },
    { texte: "Des capsules au sceau d'Avignon circulent, pleines d'eau salée : les Puisatiers accusent les Saliniers.", factions: ["puisatiers"] },
    { texte: "Frère Anselme mène deux cents Pénitents vers une citerne privée.", factions: ["penitents"] },
    { texte: "Lucas Arnaud, à la Porte-d'Attente, vend le plan d'un passage sous le Mur.", factions: ["porte", "republique"] },
    { texte: "Un village des Cévennes paie pour qu'on aille voir pourquoi les Mâts chantent la nuit.", factions: ["gardesmats"] },
  ],

  cartes: {
    evenements: [
      { titre: "Le vent tombe", texte: "La voile pend d'un coup, le char s'arrête en plein lit du fleuve. Plus un souffle, le ciel blanc, l'ombre du mât qui raccourcit sur le sable.", effet: "Quatre heures d'immobilité au soleil : sauvegarde d'Endurance DD 10 pour chacun, ou un godet de plus à boire dans l'heure." },
      { titre: "Le mur de sable", texte: "Au sud, l'horizon devient brun, puis monte. Les bateliers amarrent les barils et se couvrent le visage.", effet: "Tempête de sable : avantage aux jets de Discrétion, désavantage à la Perception, et une heure à l'abri sous le char." },
      { titre: "La file du Grand Puits", texte: "Deux cents personnes serpentent dans la cour du Palais, bidons au bras. Au bout, un Puisatier en tablier de cuir verse l'eau au godet près, sous l'œil de quatre arbalétriers.", effet: "Une heure d'attente, ou deux godets pour passer devant ; une altercation peut tout arrêter." },
      { titre: "Le godet qui sonne creux", texte: "La capsule a le sceau d'Avignon, mais elle pèse trop peu. À l'ouverture, une eau saumâtre qui pique la langue.", effet: "Le marchand jure son innocence : un jet de Perspicacité DD 13 dit s'il ment." },
      { titre: "La caravane du premier du mois", texte: "Descendue du Mont Chauve, la caravane de Montclair avance entre deux rangs de fusils, ses barils couverts de bâches bleues.", effet: "Qui s'en approche sans laissez-passer se fait arrêter ; qui l'escorte est payé en godets." },
      { titre: "La main rouge", texte: "Sur une voile au loin, une main peinte en rouge. Puis une autre. Puis quelqu'un qui chante, très fort, une chanson qu'on connaît.", effet: "La Horde du Mistral attaque : un char rapide par personnage, et la moitié de l'eau en jeu." },
      { titre: "La procession", texte: "Cagoules grises, pieds nus sur la caillasse, un bâton de pluie qui bat la mesure. Ils chantent des psaumes sans boire une goutte.", effet: "Les Pénitents bloquent la piste ; Frère Anselme parle volontiers à qui boit avec lui." },
      { titre: "La citerne vide", texte: "Les gens du village jurent qu'elle était pleine l'an dernier. Au fond, une croûte de boue grise et un chien mort.", effet: "Pas d'eau ici : il faut un autre point d'eau avant la nuit, ou un niveau d'épuisement au matin." },
      { titre: "Le Mât qui chante", texte: "Dans la nuit, de la crête, un chant très long, comme une cigale qui n'arrêterait jamais. Les chiens du village se couchent, la queue entre les pattes.", effet: "Sauvegarde d'Instinct DD 12 pour ceux qui dorment dehors, ou le sommeil est perdu et le repos long n'en est pas un." },
      { titre: "Les projecteurs", texte: "Le Mur de Valence s'allume d'un coup, de haut en bas, blanc sur blanc. Dans le camp, personne ne bouge.", effet: "Qui bouge dans la lumière est vu des miradors ; les gens de la Porte-d'Attente sont les seuls à savoir où se mettre." },
      { titre: "Le taureau noir", texte: "Au loin, dans la plaine de sel, un troupeau de taureaux noirs tremble dans la chaleur. Le Gardian retient son cheval et ne dit rien.", effet: "Sauvegarde d'Instinct DD 13 pour reconnaître un mirage ; un échec envoie le groupe vers les sables mouvants de sel." },
      { titre: "La cartouche à cinq godets", texte: "Un homme déplie un chiffon : trois cartouches, graissées, rangées côte à côte. Il en veut quinze godets.", effet: "Une cartouche vaut cinq godets ; un marchandage de Persuasion DD 13 la ramène à quatre." },
    ],
    objets: [
      { titre: "Une gourde de douze godets", texte: "Une gourde de cuir et de métal cabossé qui tient trois litres, le bouchon attaché par une lanière.", effet: "Douze godets en réserve ; on peut y garder l'eau d'un jour et demi." },
      { titre: "Une capsule scellée", texte: "Un godet d'eau propre dans une capsule de métal, au sceau de celui qui l'a tiré. Les doigts gardent la fraîcheur.", effet: "Vaut un quart de litre d'eau propre ; la monnaie courante du Bas-Pays." },
      { titre: "Une arbalète lourde de Puisatier", texte: "Un bras de ressort de camion, une crosse de bois noir, une corde tressée. Un seau et une corde gravés dans le fût.", effet: "Dégâts d'arbalète lourde ; son porteur est reconnu comme homme d'Avignon." },
      { titre: "Un voile de batelier", texte: "Une toile de voile carrée, épaisse, cousue sur l'épaule et qui sert aussi de cape.", effet: "Avantage contre le coup de chaleur pour qui s'en couvre ; les Bateliers saluent celui qui la porte." },
      { titre: "Des lunettes noires de Garde-Mât", texte: "Des lunettes de soudeur, le cuir usé, un verre fendu mais teinté.", effet: "Avantage aux jets de Perception contre l'éblouissement ; les Gardes-Mâts les reconnaissent de loin." },
      { titre: "Un laissez-passer de Montclair", texte: "Un carré de toile cirée, une goutte d'argent sur fond bleu, un numéro tracé à la main.", effet: "Ouvre la porte basse de Montclair, pour un mois ; un faux se repère à un jet d'Investigation DD 14." },
      { titre: "Une machette de bouilleur", texte: "Une lame large, rouillée sur le dos, la poignée entourée de ficelle de sel.", effet: "Arme courante qui coupe aussi le bois ; un godet de bois trouvé en vaut deux." },
      { titre: "Un harpon de batelier", texte: "Une hampe de frêne, un fer barbelé, trois mètres de corde. On s'en sert pour tirer les barils d'une barque ou d'un char.", effet: "Portée de 6 m ; ramène un objet ou un adversaire à soi sur un jet de Force réussi." },
      { titre: "Une carte des puits", texte: "Un plan dessiné à la main sur un morceau de toile, des croix de couleur à chaque puits qui donne encore.", effet: "Avantage aux jets de Survie pour trouver de l'eau dans le Bas-Pays ; quelqu'un la voudra." },
      { titre: "Un cahier de relevés d'avant le Sec", texte: "Un cahier à spirale, la couverture jaunie. Des colonnes de chiffres, des dates, des noms de sources, tout est d'avant 2031.", effet: "Avantage aux jets d'Investigation pour trouver une nappe ou une citerne oubliée ; un sourcier de métier le paierait cher." },
    ],
  },

  campagne: {
    jauge: {
      nom: "les Puits vivants",
      depart: 60,
      max: 60,
      seuils: [
        { valeur: 50, effet: "Les Puisatiers ferment le Grand Puits aux étrangers ; Avignon se barricade." },
        { valeur: 35, effet: "La Porte-d'Attente marche sur Montclair." },
        { valeur: 20, effet: "La guerre de l'eau : chaque clan contre tous." },
        { valeur: 0, effet: "Le Bas-Pays meurt. Les Mâts arrêtés avant ce seuil sauvent le Bas-Pays ; arrêtés après, ils ne sauvent que les survivants." },
      ],
      remontees: [
        { action: "Un Mât arrêté (une vallée retrouve des orages la saison suivante) ; à partir du quatrième, +1 seulement", gain: 3 },
        { action: "Un puits sauvé ou recreusé", gain: 5 },
        { action: "La vérité sur les Mâts est connue de tout le Bas-Pays", gain: 10 },
      ],
      descentes: [
        { action: "Chaque mois, quoi qu'il arrive (le Sec continue) ; 2 par mois d'été à partir de l'an 41", perte: 1 },
        { action: "Un puits détruit dans une guerre ou un pillage", perte: 5 },
      ],
    },
    reserve: {
      nom: "Coups de mistral",
      max: 4,
      regle: "Un Coup de mistral chaque fois qu'un personnage boit de l'eau sale, ou paie un pouvoir sans avoir l'eau ; un seul par scène. À dépenser pour faire tomber le vent sous un char, lever une tempête de sable, ou faire trouver une citerne vide là où on attendait de l'eau, si une rumeur l'avait annoncée.",
    },
    accroches: [
      { titre: "Le convoi", niveaux: [1, 4], factions: ["bateliers", "horde"], texte: "Escorter un char à voile du Vieux Fabre de Beaucaire à Avignon ; la Horde guette au pont." },
      { titre: "Le puits sauvage", niveaux: [1, 4], factions: ["puisatiers"], texte: "Un village creuse un puits sans payer la guilde ; Roumanille veut qu'on le bouche." },
      { titre: "Les godets faux", niveaux: [1, 4], factions: ["puisatiers"], texte: "Des capsules au sceau d'Avignon circulent, pleines d'eau salée. Roumanille accuse les Saliniers ; les Saliniers accusent Roumanille d'écouler son eau saumâtre." },
      { titre: "La procession", niveaux: [1, 4], factions: ["penitents"], texte: "Frère Anselme mène deux cents Pénitents vers une citerne privée." },
      { titre: "Le gamin de la Porte", niveaux: [1, 4], factions: ["porte", "horde", "republique"], texte: "Lucas Arnaud vend un plan du conduit sous le Mur. La Cigale veut le même plan, et un officier de la République paie pour que personne ne le possède." },
      { titre: "La caravane", niveaux: [5, 10], factions: ["fontainiers"], texte: "La caravane de Montclair est attaquée ; Sixtine Peyrol paie cher pour savoir qui a vendu l'itinéraire." },
      { titre: "Les pièces détachées", niveaux: [5, 10], factions: ["bateliers"], texte: "Le Vieux Fabre raconte le convoi qu'il a vu monter vers les Cévennes." },
      { titre: "Les Mâts qui chantent", niveaux: [5, 10], factions: ["gardesmats"], texte: "Un village des Cévennes paie pour qu'on aille voir pourquoi les tours chantent la nuit." },
      { titre: "Le cahier de la doyenne", niveaux: [5, 10], factions: ["gardesmats"], texte: "Zélie Brun cherche, en cachette de sa famille, quelqu'un qui sache lire des schémas ; les Gardes-Mâts refusent qu'on le lise." },
      { titre: "Le Grand Puits", niveaux: [5, 10], factions: ["puisatiers"], texte: "Roumanille fait descendre une équipe au fond du puits pour savoir ce qui reste, escortée par ses arbalétriers, et veut que ce qu'elle verra reste secret." },
      { titre: "Montclair", niveaux: [11, 16], factions: ["fontainiers"], texte: "Entrer dans la citadelle, avec ou sans laissez-passer." },
      { titre: "La salle fermée", niveaux: [11, 16], factions: ["fontainiers"], texte: "Les archives du Conseil des Eaux, dans une salle fermée à clé." },
      { titre: "La Horde", niveaux: [11, 16], factions: ["horde"], texte: "La Cigale propose une alliance contre Montclair ; elle veut les Mâts intacts, pour les retourner." },
      { titre: "Le premier Mât", niveaux: [11, 16], factions: ["gardesmats", "penitents"], texte: "Arrêter une tour, et voir pleuvoir sur une vallée." },
      { titre: "Le Mur", niveaux: [11, 16], factions: ["porte", "republique"], texte: "Un émissaire de la République arrive à Avignon et offre aux personnages d'ouvrir la Porte contre les plans des Mâts." },
      { titre: "La marche sur Montclair", niveaux: [17, 20], factions: ["porte", "horde"], texte: "Dix mille personnes montent la route en lacets." },
      { titre: "Le centre de maintenance", niveaux: [17, 20], factions: ["gardesmats"], texte: "Là où tout se règle, et où Zélie Brun attend." },
      { titre: "Le Conseil des Eaux", niveaux: [17, 20], factions: ["fontainiers"], texte: "Sixtine Peyrol propose de partager l'eau, sans arrêter les Mâts." },
      { titre: "Les Pénitents", niveaux: [17, 20], factions: ["penitents"], texte: "Frère Anselme veut tout abattre, y compris ce qui fait vivre trois villages." },
      { titre: "La pluie", niveaux: [17, 20], factions: ["puisatiers", "fontainiers", "bateliers", "horde", "penitents", "gardesmats", "porte", "republique"], texte: "Arrêter tous les Mâts (la pluie revient partout en trois saisons, Montclair redevient sèche) ; les régler pour partager (il faut quelqu'un qui sache, et Montclair qui accepte) ; ou les garder, et vendre la pluie." },
    ],
  },
};
