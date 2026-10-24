// Canon de l'Exposition éternelle (steampunk, Paris, octobre 1899), tiré de la bible du monde (content/exposition-eternelle/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; les Permanents comptent aussi « de l'Exposition » à partir de 1889 (an 0, l'ouverture).
// Ce que la machine sous le sol est, ce que le Commissariat en tire et ce que prépare la Nuit du Siècle sont dans les secrets, pas dans la chronologie :
// la chronologie ne dit que ce que tout le monde sait.
// Tous les personnages sont inventés. L'Exposition de 1889 a bien eu lieu au Champ-de-Mars ; ses créateurs, comme les personnes réelles de l'époque, n'ont aucune place ici.
import { NOMS_EXPOSITION } from "./steampunk-table";
import type { Canon } from "./types";

/** Les Pannes : la réserve du MJ. Code du MJ seulement : jamais importé par le code des joueurs. */
export const PANNES_MAX = 4;
export const REGLE_DES_PANNES =
  "Chaque fois qu'un personnage franchit un seuil de Pression (3, 5, 7 ou 10), le MJ gagne une Panne (quatre au plus). Il en dépense une pour faire défaillir un appareil au pire moment : un feu de signalisation qui s'éteint, un guichet automate qui verrouille la porte, un dirigeable qui ne repart pas. Un même personnage ne rapporte qu'une Panne par seuil, une seule fois par séance. Le joueur peut l'annuler en prenant 1 de Pression. Annuler une Panne en prenant 1 de Pression ne donne pas de nouvelle Panne si ce point franchit un seuil.";

export const EXPOSITION: Canon = {
  genre: "steampunk",
  monde: "l'Exposition éternelle",
  continent: "Paris",
  capitale: "Le Trocadéro",
  calendrier: { long: "ordinaire", court: "de l'Exposition", debutCourt: 1889, anDeJeu: 1899, saison: "automne" },

  chronologie: [
    { an: 1790, quoi: "La fête de la Fédération, au Champ-de-Mars." },
    { an: 1867, quoi: "Exposition universelle au Champ-de-Mars." },
    { an: 1878, quoi: "Exposition universelle ; construction du Trocadéro." },
    { an: 1887, quoi: "Janvier : début de la construction de la Tour." },
    { an: 1888, quoi: "Création du Bureau des Brevets. Les premiers Signataires sont choisis." },
    { an: 1889, quoi: "6 mai : ouverture de l'Exposition universelle. C'est l'an 0 de l'Exposition." },
    { an: 1889, quoi: "6 novembre : l'Exposition devait fermer. Le gouvernement la proroge par décret ; le 12, la Chambre ratifie le décret à une voix de majorité par une loi de prorogation, qui sera renouvelée chaque 31 décembre." },
    { an: 1890, quoi: "Les premiers Permanents s'installent. Première nuit où la lumière baisse à Grenelle." },
    { an: 1891, quoi: "Première ligne de dirigeables, du Trocadéro aux Invalides." },
    { an: 1892, quoi: "Première grève des mécaniciens : la troupe tire, trois morts." },
    { an: 1893, quoi: "Des bombes anarchistes éclatent à Paris." },
    { an: 1894, quoi: "Lois d'exception contre les anarchistes : le Commissariat obtient le droit d'armer ses gardes." },
    { an: 1895, quoi: "Les Villages deviennent permanents. Les automates remplacent les guichetiers." },
    { an: 1897, quoi: "Un incendie dans un baraquement sert de prétexte au Commissariat : fouille générale des Permanents et nouveau règlement des Villages." },
    { an: 1898, quoi: "La Chambre syndicale ouvre sa caisse de secours. Un hiver tue neuf personnes au Village annamite. Le Palais de l'Électricité est inauguré." },
    { an: 1899, quoi: "Année de jeu : en septembre, la grâce de l'Affaire ; en octobre, la lumière baisse chaque semaine à Grenelle, et l'on a cessé de compter. Le Commissariat annonce la Nuit du Siècle pour le 31 décembre 1900." },
  ],

  regions: [
    {
      nom: "La Galerie des Machines",
      situation: "au Champ-de-Mars, du côté de Javel",
      paysage: "un hangar de verre et de fer de quatre cents mètres, sans un pilier au milieu, des machines à vapeur de trente tonnes sur des socles de marbre, et sous la verrière des ponts roulants qui portent des visiteurs sur des plates-formes grillagées, comme des cages",
      gens: ["mécaniciens", "contrôleurs", "ouvrières de bobinage", "visiteurs en habit", "nettoyeurs de nuit"],
      peur: "une courroie qui happe une manche, une chaudière qui lâche, les contrôleurs qui demandent la carte, les nuits où les machines ralentissent toutes ensemble avec un bruit de bête qui expire",
      lieuDeRencontre: "la Galerie des Machines, à minuit, sous les ponts roulants, quand les lampes à arc se mettent à vaciller",
      lieux: ["la Galerie des Machines", "la machine n° 7", "les ponts roulants", "les ateliers de bobinage", "la porte des Machines", "le sous-sol de la Galerie"],
    },
    {
      nom: "La Tour",
      situation: "au milieu du Champ",
      paysage: "trois cents mètres de dentelle de fer, le phare électrique à son sommet, des mâts d'amarrage pour les dirigeables du Commissariat sur la troisième plate-forme, et dessous un jardin d'agrément et des buvettes",
      gens: ["employés des lignes aériennes", "contrôleurs de billets", "photographes de la plate-forme", "aéronautes", "visiteurs du dimanche"],
      peur: "le vent quand un dirigeable tire sur son amarre, les accidents que le Commissariat appelle des accidents",
      lieuDeRencontre: "la troisième plate-forme de la Tour, à l'amarre d'un dirigeable gris, au-dessus des toits de Paris dans la brume",
      lieux: ["la Tour", "la troisième plate-forme", "les mâts d'amarrage", "le jardin de la Tour", "le phare électrique"],
    },
    {
      nom: "Le Trocadéro",
      situation: "sur la rive droite de la Seine, face au Champ",
      paysage: "le palais aux deux tours qui domine la Seine, devenu l'hôtel du Commissariat, avec ses fontaines éclairées, sa grande salle des brevets, ses bureaux à lambris et ses gardes à chaque palier",
      gens: ["fonctionnaires du Commissariat", "Signataires", "gardes", "visiteurs de la salle des brevets"],
      peur: "les registres, un employé qui demande « votre numéro de brevet ? » quand on n'en a pas",
      lieuDeRencontre: "les fontaines du Trocadéro, allumées en cascade, devant la salle des brevets",
      lieux: ["le Trocadéro", "l'hôtel du Commissariat", "la salle des brevets", "le Bureau des Brevets", "les fontaines du Trocadéro"],
    },
    {
      nom: "Le Palais de l'Électricité",
      situation: "au bout du Champ",
      paysage: "une halle de verre inaugurée en 1898, d'où partent tous les câbles de la foire, avec des dynamos hautes comme des maisons, des tableaux de marbre et des mécaniciens en blouse blanche",
      gens: ["électriciens", "mécaniciens en blouse blanche", "gardes"],
      peur: "les courts-circuits, les brûlures, les nuits où le tableau général s'éteint et se rallume",
      lieuDeRencontre: "la halle de verre du Palais de l'Électricité, entre les dynamos hautes comme des maisons",
      lieux: ["le Palais de l'Électricité", "le tableau général", "les dynamos"],
    },
    {
      nom: "Les Villages",
      situation: "sur l'esplanade des Invalides",
      paysage: "des reconstitutions derrière des cordes tendues : un village sénégalais de cases et de greniers à mil, un village annamite avec sa pagode et sa maison sur pilotis, un pavillon kanak, des échoppes kabyles, et au pied de chaque corde un guichet",
      gens: ["engagés sous contrat", "interprètes", "impresarios", "visiteurs", "enfants nés dans l'enceinte"],
      peur: "l'hiver qui tue de la poitrine, la visite des médecins du Muséum, qu'on les renvoie « au pays » sans eux, ou qu'on ne les renvoie jamais",
      lieuDeRencontre: "l'esplanade des Invalides, devant les grilles des Villages, à l'heure où les gardes les ferment",
      lieux: ["l'esplanade des Invalides", "le village sénégalais", "le village annamite", "le pavillon kanak", "les échoppes kabyles", "les grilles des Villages"],
    },
    {
      nom: "Grenelle et Javel",
      situation: "derrière la foire, le long de la Seine",
      paysage: "le faubourg ouvrier : cheminées, usines à gaz, entrepôts, cités de briques où dorment les mécaniciens, cours étroites, fils à linge, enseignes de gargotes, et une Seine qui charrie de la suie",
      gens: ["ouvriers de la Galerie et leurs familles", "bobineuses", "typographes", "gargotiers", "enfants des cours"],
      peur: "le chômage quand un automate remplace un guichetier, les nuits de grand courant où les lampes baissent et les enfants toussent",
      lieuDeRencontre: "la porte de Javel, à six heures du soir, à la relève des mécaniciens",
      lieux: ["le boulevard de Grenelle", "la porte de Javel", "les cités de briques", "les cours de Javel", "l'imprimerie de La Sirène de Javel"],
    },
    {
      nom: "Les Carrières",
      situation: "sous le Champ-de-Mars",
      paysage: "l'ancienne carrière de calcaire : des galeries à piliers, des flaques d'eau claire, des voûtes qui sentent le salpêtre ; les plans de l'Inspection générale des carrières datent de 1830 et s'arrêtent au bord du Champ-de-Mars",
      gens: ["ouvriers de l'Inspection", "gamins de Grenelle"],
      peur: "l'effondrement, les rats, les trois morts de 1886 et la comptine qu'on en a faite",
      lieuDeRencontre: "l'escalier de pierre qui descend vers les Carrières, devant la grille repeinte",
      lieux: ["l'escalier de pierre", "les galeries à piliers", "la grille repeinte", "les puits de Grenelle"],
    },
    {
      nom: "La Butte",
      situation: "Montmartre, au nord de Paris",
      paysage: "une colline de moulins, de vignes et de cabarets, d'où l'on voit, la nuit, le Champ allumé comme une braise",
      gens: ["peintres sans le sou", "chansonniers", "couturières", "camelots", "cocottes", "anarchistes"],
      peur: "les rafles de la Sûreté, la police qui ferme les cabarets",
      lieuDeRencontre: "une table de zinc dans un cabaret de la rue des Saules, avec le Champ qui clignote au loin",
      lieux: ["Montmartre", "la rue des Saules", "les cabarets de la Butte", "les moulins de la Butte"],
    },
  ],
  autresLieux: [
    "Partout", "l'Éternelle", "le Champ", "le Champ-de-Mars", "les Invalides", "Paris", "la Seine", "la rive droite", "la rive gauche", "le Muséum", "la Préfecture", "la Sûreté", "la Chambre",
    "Versailles", "Saint-Pétersbourg", "New York", "la Manche", "Rennes", "Londres", "l'Angleterre", "la Russie", "l'Italie", "l'Amérique", "la France", "l'Europe", "le Sénégal", "le Vietnam",
    "l'Annam", "le Tonkin", "la Nouvelle-Calédonie", "la Kabylie", "l'Algérie", "l'allée des Palmiers", "les quartiers voisins", "les Salons", "la rue de Grenelle", "la rue Montmartre",
    "le dépôt de l'enceinte", "la loge", "la légation", "la Compagnie", "l'Affaire", "le procès de Rennes", "l'omnibus", "le tramway", "le fiacre",
  ],

  factions: [
    { id: "commissariat", nom: "Le Commissariat général", alias: ["Commissariat général", "le Commissariat", "la Commission", "les gardes", "les contrôleurs", "les gardes du Commissariat", "le Bureau des Brevets"], but: "que l'Exposition ne ferme jamais", signe: "une roue dentée couronnée de lauriers, gravée sur les képis et sur les plaques de cuivre", penche: "la foire", membres: ["commissaire", "garde", "contrôleur", "fonctionnaire", "dessinateur"] },
    { id: "signataires", nom: "Le Syndicat des Signataires", alias: ["Syndicat des Signataires", "les Signataires", "un Signataire", "les brevetés"], but: "que leurs noms restent sur les plaques de cuivre, et que les brevets rapportent", signe: "la plaque « Breveté S.G.D.G. »", penche: "les droits", membres: ["Signataire", "doyen", "inventeur", "mécène"] },
    { id: "chambre", nom: "La Chambre syndicale des mécaniciens", alias: ["Chambre syndicale", "la Chambre syndicale", "les syndiqués", "les grévistes", "La Sirène de Javel"], but: "un jour de repos par semaine, la journée de dix heures, la même paie pour les ouvrières", signe: "la clef anglaise passée à la ceinture", penche: "la grève", membres: ["secrétaire", "mécanicien", "bobineuse", "typographe"] },
    { id: "villages", nom: "Le Conseil des Villages", alias: ["Conseil des Villages", "les Villages", "les engagés", "les gens des Villages"], but: "rentrer chez soi, vivants, avec ce qu'on a gagné et les papiers en poche", signe: "la médaille de laiton numérotée, retournée contre la poitrine", penche: "le silence", membres: ["doyen", "comptable", "délégué", "interprète", "nettoyeur de nuit"] },
    { id: "refractaires", nom: "Les Réfractaires", alias: ["Réfractaires", "Réfractaire", "les anarchistes", "un anarchiste", "la bande"], but: "détruire l'Exposition, qui a pris un quartier de Paris, affamé ses ouvriers et exhibé des hommes", signe: "une roue brisée tracée à la craie", penche: "la bombe", membres: ["voix", "colleur d'affiches", "imprimeur", "artificier"] },
  ],

  figures: [
    { nom: "Léon-Ambroise Faverolle", alias: ["Faverolle", "le Commissaire général", "le Commissaire Faverolle", "Léon-Ambroise"], titre: "Commissaire général de l'Exposition", ou: "Le Trocadéro", faction: "commissariat", age: 61, etat: "vivant" },
    { nom: "Aymeric Delestrade", alias: ["Delestrade", "le docteur Delestrade", "docteur Delestrade", "Aymeric"], titre: "médecin, chef des Veilleurs", ou: "La Galerie des Machines", faction: "commissariat", age: 48, etat: "vivant" },
    { nom: "Hortense Quillebeuf", alias: ["Quillebeuf", "madame Quillebeuf", "mademoiselle Quillebeuf", "la directrice du Bureau des Brevets"], titre: "directrice du Bureau des Brevets", ou: "Le Trocadéro", faction: "commissariat", etat: "vivant" },
    { nom: "Félicien Dorlhac", alias: ["Dorlhac", "monsieur Dorlhac", "le doyen des Signataires"], titre: "doyen des Signataires", ou: "le boulevard de Grenelle", faction: "signataires", age: 55, etat: "vivant" },
    { nom: "Victorine Cordebard", alias: ["Cordebard", "madame Cordebard", "la secrétaire de la Chambre"], titre: "secrétaire de la Chambre syndicale", ou: "Grenelle et Javel", faction: "chambre", age: 44, etat: "vivant" },
    { nom: "Samba Ndoye", alias: ["Ndoye", "le sergent Ndoye", "le doyen du Village sénégalais"], titre: "doyen du Village sénégalais", ou: "Les Villages", faction: "villages", age: 50, etat: "vivant" },
    { nom: "Nguyễn Thị Hạnh", alias: ["Hạnh", "madame Hạnh", "madame Nguyễn Thị Hạnh", "Nguyễn Thị"], titre: "comptable du Conseil des Villages", ou: "Les Villages", faction: "villages", age: 38, etat: "vivant" },
    { nom: "Anatole Gerfaux", alias: ["Gerfaux", "monsieur Gerfaux", "la voix des Réfractaires"], titre: "voix des Réfractaires", ou: "La Butte", faction: "refractaires", age: 33, etat: "vivant" },
    { nom: "Blanche Mauvezin", alias: ["Mauvezin", "mademoiselle Mauvezin", "la reporter de La Sirène de Javel"], titre: "reporter à La Sirène de Javel", ou: "Grenelle et Javel", faction: "chambre", age: 29, etat: "vivant" },
    // À la première séance (bible, section 11)
    { nom: "Gabriel Pétrel", alias: ["Pétrel", "le jeune Pétrel", "le petit Pétrel"], titre: "jeune mécanicien, nettoyeur du sous-sol de la machine n° 7", ou: "La Galerie des Machines", age: 19, etat: "vivant" },
  ],

  divinites: [],

  peuples: [
    "Parisiens de l'Éternelle", "Parisien", "Parisiens", "Parisienne", "Parisiennes", "Enfant de la foire", "Gamin des quais",
    "Gens des ateliers", "Mécanicien de la Galerie", "Ouvrière des ateliers",
    "Gens des Villages", "Sénégalais du Village", "Annamite du Village", "Sénégalais", "Sénégalaise", "Annamite", "Annamites", "Kanak", "Kanaks", "Kabyle", "Kabyles",
    "Wolof", "Sérère", "Bambara", "Vietnamien", "Vietnamienne",
    "Employés et Signataires", "Fils de Signataire", "Fille de Signataire", "Employé du Commissariat",
    "Visiteurs restés", "Visiteur", "Visiteurs", "Provincial", "Étranger", "Anglais", "Russe", "Américain", "Italien", "Français", "Françaises",
    "Gens de la Butte", "Artiste ou chansonnier", "Réfractaire",
    // Classes
    "Mécanicien", "Aéronaute", "Garde", "Reporter", "Médecin", "Chansonnier", "Réfractaire", "Ingénieur", "Interprète", "Escrimeur",
    // Historiques
    "Garde de l'Exposition", "Reporter ou dessinateur de presse", "Infirmière ou médecin d'hôpital", "Bonimenteur", "Étudiant-ingénieur",
    // Sous-classes
    "Ajusteur de la Galerie", "Bobineur", "Pilote de ligne", "Ballonnier", "Brigadier d'équipe", "Matraque de poste", "Reporter d'enquête", "Dessinateur de presse",
    "Médecin d'hôpital", "Herboriste", "Monte-en-l'air", "Camelot", "Imprimeur-colleur", "Artificier", "Calculateur", "Inventeur",
    "Interprète des Villages", "Interprète de légation", "Maître d'armes", "Boxeur de savate",
  ],

  vocabulaire: [
    "Exposition éternelle", "l'Éternelle", "Éternelle", "Exposition universelle", "Exposition", "Commissariat", "Commissaire général", "Commissariat général",
    "Permanent", "Permanents", "Signataire", "Signataires", "Grand Brevet", "Grands Brevets", "brevet", "brevets", "Breveté S.G.D.G.", "S.G.D.G.", "licence", "licences",
    "appareil", "appareils", "Pression", "Chaudière", "purge", "purger", "forcer", "Panne", "Pannes", "Pouls", "Nuit du Siècle", "nuit de grand courant", "nuits de grand courant", "grand courant",
    "loi de prorogation", "prorogation", "Bureau des Brevets", "Chambre syndicale", "Conseil des Villages", "Réfractaires", "Réfractaire", "Sûreté", "Préfecture", "Muséum",
    "Champ", "Champ-de-Mars", "Trocadéro", "Galerie des Machines", "Tour", "Palais de l'Électricité", "Villages", "Grenelle", "Javel", "Carrières", "Butte", "Invalides",
    "franc", "francs", "centime", "centimes", "sou", "sous", "an XI", "de l'Exposition",
    "dirigeable", "dirigeables", "ballon", "ballons", "nacelle", "ballast", "amarre", "amarrage", "enveloppe", "automate", "automates", "automate à cames", "came", "cames", "Cocher mécanique",
    "chemin de fer du Champ", "viaduc", "pneumatique", "télégraphe", "téléphone", "lampe à arc", "lampes à arc", "dynamo", "dynamos", "chaudière", "chaudières", "vapeur", "courroie", "courroies",
    "accumulateur", "manomètre", "soupape", "bâti", "pont roulant", "ponts roulants", "bobinage", "bobineuse", "bobineuses", "orgue à vapeur", "clef anglaise",
    "matraque à tension", "matraque", "revolver d'ordonnance", "Lebel", "fusil Lebel", "fusil de chasse", "canne-épée", "canne plombée", "sabre-baïonnette", "épée de salle d'armes", "dynamite", "mèche",
    "gant à ressort", "canne-grappin", "cuirasse à vapeur", "lance-vapeur", "bottes à ressorts", "lampe à arc de poche", "képi", "gris-bleu", "médaille de laiton", "roue brisée", "roue dentée", "plaque de cuivre",
    "La Sirène de Javel", "Sirène", "impresario", "impresarios", "engagé", "engagés", "livret d'engagé", "laissez-passer", "permis de sortie", "carte de Permanent", "carte syndicale", "carte de presse",
    "gargote", "gargotes", "garni", "omnibus", "tramway", "fiacre", "fiacres", "wolof", "sérère", "bambara", "annamite", "kanak", "kabyle", "tirailleur", "tirailleurs", "pagode", "case", "cases",
    "chansonnier", "chansonniers", "cabaret", "cabarets", "camelot", "camelots", "cocotte", "cocottes", "anarchiste", "anarchistes", "terrassier", "terrassiers", "salle d'armes", "savate", "boxe française",
    "Léon-Ambroise", "Faverolle", "Aymeric", "Delestrade", "Quillebeuf", "Hortense", "Dorlhac", "Félicien", "Cordebard", "Victorine", "Samba", "Ndoye", "Nguyễn", "Thị", "Hạnh", "Gerfaux", "Anatole",
    "Mauvezin", "Blanche", "Pétrel", "Gabriel", "monsieur", "madame", "mademoiselle", "docteur", "Mr", "boulevard", "rue",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle.
  // « Fosse » et « Veilleur » seuls ne figurent pas ici : d'autres mondes les emploient dans des textes que lisent les joueurs.
  secrets: [
    "Dormeuse", "la Dormeuse", "pièce mère", "pièces mères", "Le Sujet", "le Sujet", "descend à la Fosse", "descend dans la Fosse", "galerie vers la Fosse", "salle de la Dormeuse",
    "Veilleurs", "un Veilleur", "le Veilleur", "Delestrade", "Aymeric", "chef des Veilleurs",
    "dernier plan", "Grand Courant continu", "courant continu de douze heures", "plan d'une invention", "morceau de son propre corps", "machine sous le sol",
    "Aucune des inventions n'est de ceux qui la signent", "n'ont jamais compris ce qu'ils signaient", "collection d'antiquités",
    "trois terrassiers", "terrassiers de 1886", "six terrassiers", "six hommes descendus",
    "quatre nuits par mois", "huit nuits de grand courant", "nuits de grand courant par mois",
    "falsifiant les registres", "réduit le courant", "cadran qui mesure", "carte des Veilleurs",
    "indicateur de la Sûreté", "informateur à la Sûreté", "trust anglais", "payés par un trust", "corrompu avec de la soie",
    "payée pour se taire", "neuf passages", "chariot de rebut", "came de tête", "jeune ouvrière en secret",
    "pièces en service", "vitrines blindées", "coffres du Bureau", "choisit un Signataire",
  ],

  anachronismes: [
    // Rien d'après 1899
    "avion", "avions", "aéroplane", "aéroplanes", "hélicoptère", "hélicoptères", "taxi", "taxis", "métro", "métropolitain", "autobus", "bakélite", "néon", "nucléaire", "atomique", "laser", "radar",
    "radio", "robot", "robots", "cyborg", "ordinateur", "internet", "smartphone", "télévision", "mitraillette", "pistolet automatique", "Browning", "char d'assaut", "tank",
    "Grande Guerre", "Première Guerre mondiale", "Seconde Guerre mondiale", "Zeppelin", "Titanic", "Hitler", "Lénine",
    // Rien de fantastique (la bible dit : pas de magie, et la machine n'est jamais expliquée)
    "sortilège", "sortilèges", "magicien", "magicienne", "sorcier", "sorcière", "fantôme", "fantômes", "malédiction", "vampire", "zombie", "zombies", "elfe", "elfes", "dragon", "orc", "grimoire", "potion", "enchantement",
    // Personnes réelles et licences : l'Exposition cite la Tour, la Galerie et l'époque, pas leurs créateurs
    "Eiffel", "Dutert", "Contamin", "Alphand", "Edison", "Tesla", "Dreyfus", "Zola", "Clemenceau", "Esterhazy", "Picquart", "Loubet", "Marconi", "Santos-Dumont",
    "Jules Verne", "Sherlock Holmes", "Capitaine Nemo", "Phileas Fogg", "Arsène Lupin", "Fantômas", "Nautilus",
  ],

  noms: NOMS_EXPOSITION,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "Un contrôleur arrête un enfant sans billet à la porte de la Tour ; les gardes veulent le retenir un mois au dépôt de l'enceinte, et son frère offre vingt francs à qui attestera qu'il avait un billet.", factions: ["commissariat"] },
    { texte: "Un guichetier automate se bloque et broie la main d'un visiteur ; on veut étouffer l'incident.", factions: ["signataires"] },
    { texte: "Un enfant du Village s'évanouit en dansant pour le public ; les gardes refusent le médecin.", factions: ["villages"] },
    { texte: "Une courroie emporte un ouvrier de la Galerie ; une secrétaire de la Chambre cherche des témoins, les contrôleurs veulent qu'on dise que c'était sa faute.", factions: ["chambre"] },
    { texte: "Une roue brisée est tracée à la craie sur un mur du Trocadéro, et la Sûreté cherche des coupables dans les Villages.", factions: ["refractaires", "villages"] },
    { texte: "À Grenelle, la lumière baisse deux fois, trois fois dans la semaine, et revient. Les mécaniciens disent qu'on tire dessus.", factions: ["chambre", "commissariat"] },
    { texte: "Un reporter de La Sirène de Javel cherche quelqu'un qui sache lire un brevet.", factions: ["chambre", "signataires"] },
  ],

  cartes: {
    evenements: [
      { titre: "La lumière baisse à Grenelle", texte: "Les lampes à arc de la rue faiblissent l'une après l'autre, dans l'ordre exact de la rue, puis reviennent. Dans les cours, on a cessé de lever la tête.", effet: "Tout appareil en marche à 100 m ralentit une minute ; un test d'Adresse DD 12 évite de perdre le fil d'un travail fin. Un mécanicien qui l'a senti te dit combien de fois cette semaine, contre un verre (Persuasion DD 10)." },
      { titre: "Le contrôle à la porte", texte: "Deux contrôleurs et un garde fouillent à l'entrée. L'un demande la carte, l'autre le numéro de brevet.", effet: "Tromperie ou Persuasion DD 13 pour passer sans carte ; sans carte, 5 francs d'amende. Un appareil sans numéro est saisi, un revolver aussi : on les laisse en consigne, ou on les cache (Escamotage DD 14)." },
      { titre: "Le guichet qui se bloque", texte: "L'automate du guichet rend un franc de trop, puis plus rien : sa file s'allonge, et ses cames tournent à vide.", effet: "Un test d'Investigation DD 12 trouve la goupille. Sinon, il faut un mécanicien : 10 francs, ou la patience de toute la file." },
      { titre: "Le Grand Brevet du trimestre", texte: "Une cloche sonne, un voile tombe sur la place du Trocadéro, et trente mille personnes applaudissent une machine neuve.", effet: "Une foule serrée : Athlétisme ou Acrobaties DD 12 pour la traverser sans perdre sa bourse. Un reporter cherche un témoin parmi ceux qui n'applaudissent pas." },
      { titre: "La relève de six heures", texte: "Quatre mille hommes en blouse bleue sortent de la Galerie par la porte de Javel, un pain sous le bras, et croisent les quatre mille qui entrent. Personne ne se parle ; chacun tape deux fois sa poche.", effet: "Retrouver quelqu'un dans la relève : Perception DD 14. Faire passer un mot par la Chambre : Persuasion DD 12 auprès d'un mécanicien." },
      { titre: "La corde des Villages", texte: "Une femme est assise sur le seuil de sa case, derrière la corde, un panier de fibres sur les genoux. Un enfant de Paris lui lance une pièce. Elle ne lève pas les yeux. Elle compte.", effet: "Une scène, pas un décor : qui regarde ? Un personnage peut s'arrêter et lui parler (Persuasion DD 12 pour une information). Les gardes de la corde lèvent la tête à la fin du tour." },
      { titre: "La craie du Trocadéro", texte: "Une roue brisée à la craie sur le mur, encore fraîche. Deux gardes frottent avec un chiffon qui n'enlève rien.", effet: "Investigation DD 13 : la main qui a tracé ça est gauchère, haute et pressée. La Sûreté arrive en dix minutes." },
      { titre: "Le dirigeable de Versailles", texte: "Un dirigeable gris est amarré à la plate-forme, la rosée tombe de l'enveloppe sur les pardessus, un contrôleur compte les passagers sur une ardoise.", effet: "Monter coûte 20 francs, ou Persuasion DD 14 auprès du contrôleur. Par grand vent, Acrobaties ou Athlétisme DD 12 sur la passerelle, sinon 1d6 dégâts de chute." },
      { titre: "La chaudière qui lâche", texte: "Un sifflement aigu, une courroie qui claque. Les ouvriers de la Galerie reculent d'un pas, tous ensemble.", effet: "Chaque personnage à 6 m : sauvegarde d'Adresse DD 13, ou 2d6 dégâts de feu (moitié si elle réussit)." },
      { titre: "Le concert d'orgue à vapeur", texte: "Le soir à la Galerie, un orgue à vapeur couvre le bruit des machines. Les mécaniciens parlent à voix basse, la bouche près de l'oreille.", effet: "Une soirée pour parler : Persuasion DD 12 pour une information. Le bruit couvre ce qui se dit à deux pas : avantage aux tests de Discrétion pour une conversation." },
      { titre: "La carte postale de la Butte", texte: "Chez un cabaretier de la rue des Saules, une carte postale de la Tour avec une moustache dessinée. Au dos, une adresse à l'encre violette.", effet: "Investigation DD 13 : l'adresse mène à un chansonnier qui cache quelqu'un. Il ne dira rien sans un verre et sans un nom." },
      { titre: "Les grilles de six heures", texte: "Les gardes ferment les grilles des Villages. La serrure est neuve, et un homme pleure dehors avec un enfant dans les bras.", effet: "Qui est dehors à six heures passe la nuit dehors. Persuasion DD 15 ou Tromperie DD 14 auprès du garde de la grille ; le Conseil des Villages a ses propres moyens, mais il veut quelque chose en retour." },
    ],
    objets: [
      { titre: "Un revolver d'ordonnance", texte: "Un 8 mm à six coups, la crosse usée par la paume d'un autre, un numéro limé sous le canon.", effet: "1d8 perforants, portée 12/36 m, six coups puis une action pour recharger. Il vaut 25 francs ; dans l'enceinte, on le laisse en consigne (50 centimes)." },
      { titre: "Une canne-épée", texte: "Un jonc de bambou, un pommeau d'argent terni, et une lame de soixante centimètres qui ne sort qu'à l'ordre de la main.", effet: "1d6 perforants, finesse, on ne la voit pas avant de la tirer. Elle vaut 20 francs, et passe la fouille aux portes sur un test d'Escamotage DD 12." },
      { titre: "Une lampe à arc de poche", texte: "Un tube de laiton et un arc qui crache une lumière blanche et dure. Le numéro de brevet est gravé sur le culot.", effet: "Éclaire à 9 m une heure ; à plein régime, un éclair aveugle (sauvegarde d'Endurance DD 12) mais la Pression monte de 1. Elle vaut 40 francs, plus la licence de 200." },
      { titre: "Une clef anglaise", texte: "Vingt-cinq centimètres d'acier gras, le manche usé à la forme d'une main.", effet: "1d6 contondants, polyvalente (1d8). Elle vaut 3 francs, et avantage aux tests pour dévisser, serrer ou forcer un boulon rouillé." },
      { titre: "Une carte de Permanent", texte: "Un carton jauni, un tampon de cuivre, trois lignes à l'encre : un nom, une loge, une date.", effet: "Entrée sans billet dans l'enceinte. Elle coûte 5 francs par mois ; la perdre, c'est repasser par le Trocadéro." },
      { titre: "Un numéro de La Sirène de Javel", texte: "Quatre pages mal pliées, une encre qui laisse des traces. En une, un mécanicien mort, et la date du dernier avis de grève.", effet: "5 centimes. Avantage à un test de Persuasion avec un mécanicien ou une ouvrière à qui on le montre ; un garde qui le trouve sur toi le saisit." },
      { titre: "Une médaille de laiton retournée", texte: "Un rond de laiton numéroté, épinglé à l'envers, numéro contre la poitrine.", effet: "Dans les Villages, elle te désigne comme un ami du Conseil : un lit, un repas, une information contre un service. Ailleurs, un garde la remarque." },
      { titre: "Une matraque à tension", texte: "Une tige de cuivre gainée de cuir, lourde comme un manche de marteau, qui tiédit dans la main.", effet: "1d6 contondants + 1d6 foudre, sauvegarde d'Endurance DD 12 ou désavantage jusqu'à la fin du prochain tour ; six décharges. Elle vaut 80 francs au marché noir, et c'est déjà un délit." },
      { titre: "Un gant à ressort", texte: "Un gant de cuir clouté, un ressort sous la paume, et un numéro de brevet gravé sur le poignet.", effet: "Coups de poing de 1d6 ; à plein régime, 2d6 de force et la cible est repoussée de 3 m (Force DD 12), la Pression monte de 1. Il vaut 60 francs, plus la licence." },
      { titre: "Un calepin à ressort", texte: "Un petit carnet de cuir au ressort fatigué, couvert de noms, de dates et de chiffres, à moitié en abréviations.", effet: "Avantage à un test d'Investigation sur ce qui y est noté. Qui le perd perd aussi ce qu'il a retenu : le MJ dit ce que tu ne retrouves pas." },
    ],
  },

  campagne: {
    jauge: {
      nom: "le Pouls",
      depart: 100,
      max: 100,
      seuils: [
        { valeur: 75, effet: "Le Commissariat passe à huit nuits de grand courant par mois ; des quartiers de Grenelle restent dans le noir ; la Chambre syndicale réclame une enquête." },
        { valeur: 50, effet: "Les premiers plans « mal formés » : un Grand Brevet échoue en public (un dirigeable brûle au-dessus du Trocadéro, un automate frappe un visiteur). Faverolle étouffe l'affaire et se hâte." },
        { valeur: 25, effet: "Les pièces mères en service faiblissent : le moteur du dirigeable l'Éternelle cale en vol, le Commissariat rappelle des appareils, des émeutes éclatent, la Chambre hésite sur la prorogation." },
        { valeur: 0, effet: "L'Arrêt : la Dormeuse s'arrête. Toutes les pièces mères en service s'éteignent, la Galerie se tait, le Champ passe dans le noir en quelques minutes. Fin de campagne : qui a la preuve, qui l'a rendue publique, et quel Paris sort de la nuit ?" },
      ],
      remontees: [
        { action: "Une nuit de grand courant interrompue : câble coupé, grève de nuit, panne volontaire (elle annule le −3 du mois ; une fois par séance au plus)", gain: 5 },
        { action: "Delestrade obtient une réduction durable du courant (une seule fois)", gain: 10 },
      ],
      descentes: [
        { action: "Un mois de jeu où une nuit de grand courant est menée jusqu'au bout", perte: 3 },
        { action: "Un Grand Brevet dévoilé au public (une fois par séance au plus)", perte: 4 },
        { action: "Un personnage emploie une pièce mère en jeu (une fois par séance au plus)", perte: 2 },
        { action: "Le Commissariat commande une grande pièce taillée sur un original (une fois par séance au plus)", perte: 5 },
        { action: "La foule descend dans la Fosse : chacun voudra emporter un morceau (une seule fois)", perte: 20 },
      ],
    },
    reserve: {
      nom: "Pannes",
      max: PANNES_MAX,
      regle: REGLE_DES_PANNES,
    },
    accroches: [
      { titre: "Le billet", niveaux: [1, 4], factions: ["commissariat"], texte: "Un contrôleur arrête un enfant sans billet à la porte de la Tour ; les gardes veulent le retenir un mois au dépôt de l'enceinte, ce que le règlement autorise, et son frère offre vingt francs à qui attestera qu'il avait un billet." },
      { titre: "L'automate de la porte", niveaux: [1, 4], factions: ["signataires"], texte: "Un guichetier automate de Dorlhac se bloque et broie la main d'un visiteur ; on veut étouffer l'incident." },
      { titre: "Les pièces de monnaie", niveaux: [1, 4], factions: ["villages"], texte: "Un enfant du Village s'évanouit en dansant pour le public ; les gardes refusent le médecin." },
      { titre: "L'accident de la Galerie", niveaux: [1, 4], factions: ["chambre"], texte: "Une courroie emporte un ouvrier ; Cordebard cherche des témoins, les contrôleurs veulent qu'on dise que c'était sa faute." },
      { titre: "La craie", niveaux: [1, 4], factions: ["refractaires", "villages"], texte: "Une bombe qui n'a pas éclaté dans les latrines du Trocadéro ; la Sûreté cherche des coupables dans les Villages." },
      { titre: "La veuve d'un Signataire", niveaux: [5, 10], factions: ["signataires", "commissariat"], texte: "Un vieux Signataire est mort ; sa veuve demande aux personnages de vider son atelier avant le Bureau, et ils y trouvent un appareil sans plan." },
      { titre: "Les nuits de grand courant", niveaux: [5, 10], factions: ["commissariat", "chambre"], texte: "La lumière baisse à Grenelle ; un enfant du quartier meurt de fièvre ; la Chambre demande un relevé des heures. Les personnages tiennent le carnet : le publier sauve des enfants, le garder arme la grève." },
      { titre: "Le calepin", niveaux: [5, 10], factions: ["chambre", "signataires"], texte: "Mauvezin a recoupé les dates de quarante brevets avec les registres du dépôt légal ; elle cherche quelqu'un qui sache lire un plan." },
      { titre: "La couturière", niveaux: [5, 10], factions: ["villages", "commissariat"], texte: "Hạnh sait quelles caisses entrent à 3 heures du matin par la porte des annexes, et propose de les montrer contre l'aide d'un témoin étranger." },
      { titre: "La pièce qui chauffe", niveaux: [5, 10], factions: ["commissariat"], texte: "Une pièce mère volée, petite, est en vente dans un café de la Butte ; Delestrade veut la récupérer avant les contrôleurs." },
      { titre: "L'escalier de Javel", niveaux: [11, 16], factions: ["chambre"], texte: "Cordebard connaît un puits dans une cour de Javel qui rejoint la carrière ; elle demande à descendre avec les personnages, pour la première fois depuis la mort de son mari." },
      { titre: "Le registre", niveaux: [11, 16], factions: ["commissariat", "signataires"], texte: "Les registres de Quillebeuf, au troisième étage du Trocadéro, prouvent que les brevets précèdent les dépôts ; il faut les copier une nuit de grand courant." },
      { titre: "L'enterrement", niveaux: [11, 16], factions: ["villages", "commissariat"], texte: "Un mort au Village, et le Muséum réclame le corps pour ses collections ; la famille veut l'enterrer, le Commissariat refuse de rendre le permis." },
      { titre: "La grève", niveaux: [11, 16], factions: ["chambre", "refractaires", "commissariat"], texte: "La Galerie s'arrête ; Faverolle fait venir des automates, et la troupe ; les Réfractaires profitent du désordre pour frapper. Les impresarios opposent les engagés aux grévistes, la Chambre leur en veut, et le Conseil des Villages n'y est pour rien." },
      { titre: "La bombe de Gerfaux", niveaux: [11, 16], factions: ["refractaires", "chambre"], texte: "Il veut faire sauter le Palais de l'Électricité pendant une nuit de grand courant ; cela couperait le courant (+5 au Pouls) et tuerait quatre-vingts ouvriers." },
      { titre: "Le vote", niveaux: [17, 20], factions: ["commissariat", "signataires"], texte: "Faverolle achète la douzième prorogation avec un cadeau à chaque député, un petit appareil taillé sur une pièce mère ; il faut en saisir un." },
      { titre: "Le dirigeable", niveaux: [17, 20], factions: ["signataires", "commissariat"], texte: "L'Éternelle doit s'élever pour la Nuit du Siècle, et son moteur est une pièce mère qui faiblit ; Dorlhac vient avouer et propose un marché : il livre le moteur à ceux qui le sabotent, à condition qu'on laisse son nom sur la plaque." },
      { titre: "Le docteur", niveaux: [17, 20], factions: ["commissariat"], texte: "Delestrade veut ouvrir la Fosse devant trois témoins choisis (un médecin, un ingénieur, un journaliste), pas devant le public : il sait que la foule l'achèverait. Il a besoin d'une diversion pour échapper aux Veilleurs." },
      { titre: "Le nettoyage de nuit", niveaux: [17, 20], factions: ["villages", "commissariat"], texte: "Ndoye vend l'accès à la Fosse que ses gens ont mémorisé, contre la promesse d'un avocat et de papiers." },
      { titre: "La Nuit du Siècle", niveaux: [17, 20], factions: ["commissariat", "signataires", "chambre", "villages", "refractaires"], texte: "Laisser la Dormeuse donner tout ce qu'elle a (Faverolle a peut-être raison : dix ans d'éclat si le dernier plan marche, et le moteur de l'Éternelle meurt avec elle si ce n'est pas le cas) ; couper le courant et la laisser dormir (elle vit encore des années, le Commissariat tombe, l'Éternelle ferme) ; montrer la Fosse au public (la foule descend et l'emporte pièce à pièce) ; ou l'enterrer à jamais sous une dalle (Faverolle l'aurait voulu autrement, et les inventions s'arrêteront quand même)." },
    ],
  },
};
