// Canon du Champ-d'Asile (western, Texas et Comanchería, 1878), tiré de la bible du monde (content/champ-d-asile/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; on compte aussi « de l'Asile » à partir de 1818 (an 0, la fondation).
// La durée du Traité des Deux Rivières et ce qui arrive le 14 juillet 1880 sont dans les secrets, pas dans la chronologie : rien n'y dépasse l'année de jeu.
// Les Comanches (Numunuu) sont un peuple réel : leurs noms de personnes sont des traductions françaises inventées, aucun n'est celui d'un chef réel.
import { NOMS_CHAMP_D_ASILE } from "./western-table";
import type { Canon } from "./types";

export const CHAMP_D_ASILE: Canon = {
  genre: "western",
  monde: "le Champ-d'Asile",
  continent: "les Grandes Plaines",
  capitale: "Bonne-Espérance",
  calendrier: { long: "ordinaire", court: "de l'Asile", debutCourt: 1818, anDeJeu: 1878, saison: "printemps" },

  chronologie: [
    { an: 1815, quoi: "Waterloo. Des officiers de l'Empereur s'exilent en Amérique." },
    { an: 1818, quoi: "Fondation du Champ-d'Asile sur le haut Brazos : an 0 de l'Asile." },
    { an: 1820, quoi: "Le Traité des Deux Rivières est signé avec les Comanches ; le colonel Aimé Duvernet plante la Croix-de-Pierre." },
    { an: 1821, quoi: "Mort de l'Empereur à Sainte-Hélène : le Champ prend le deuil pendant un mois." },
    { an: 1825, quoi: "Fondation de Bonne-Espérance." },
    { an: 1836, quoi: "Le Texas se sépare du Mexique ; le Champ reste à part." },
    { an: 1845, quoi: "Le Texas entre dans l'Union ; le Champ refuse." },
    { an: 1846, quoi: "Lors de l'annexion du Texas, l'Union reconnaît, par un échange de notes que presque personne n'a lu, « les traités passés par les habitants avec les nations indiennes »." },
    { an: 1848, quoi: "La République en France : on en parle à l'Assemblée." },
    { an: 1852, quoi: "Le Second Empire : les vieilles familles boivent au neveu." },
    { an: 1861, quoi: "La guerre de Sécession ; le Champ se déclare neutre." },
    { an: 1862, quoi: "L'intervention française au Mexique : des Asiliens s'engagent, peu reviennent." },
    { an: 1870, quoi: "Sedan : on décroche l'aigle de l'Assemblée pendant un an." },
    { an: 1875, quoi: "Les Comanches qui refusent la réserve passent la Croix-de-Pierre, poursuivis par la cavalerie ; le colonel Hale arrête sa colonne à la croix sur ordre de Washington." },
    { an: 1877, quoi: "Le rail atteint la frontière est ; fondation de Fort-Rail." },
    { an: 1878, quoi: "Année de jeu : le rail veut la terre, l'Assemblée se dispute, et le vieux chef comanche fait dire qu'il viendra à Bonne-Espérance pour le jour du Traité." },
  ],

  regions: [
    {
      nom: "Bonne-Espérance",
      situation: "sur une boucle du haut Brazos, au cœur du Champ",
      paysage: "une petite ville de briques crues et de bois blanchi, une place carrée, l'église au clocher de bois, l'Assemblée à colonnes, l'auberge du Grognard, le marché aux chevaux",
      gens: ["Asiliens", "Créoles de Louisiane", "Allemands du Texas", "Mexicains", "Noirs libres"],
      peur: "le rail, les incendies, les étrangers qui posent trop de questions sur les vieux papiers",
      lieuDeRencontre: "la place de Bonne-Espérance, à midi, quand l'ombre du clocher touche le marché",
      lieux: ["l'Assemblée", "l'église", "l'auberge du Grognard", "le marché aux chevaux", "la place de Bonne-Espérance"],
    },
    {
      nom: "Fort-Rail",
      situation: "à la frontière est du Champ, au bout de la voie",
      paysage: "une gare de bois neuf, des tentes, des saloons, des entrepôts, un hôtel à trois étages, la ligne qui s'arrête net devant un panneau « Champ-d'Asile »",
      gens: ["cheminots", "géomètres", "agents de la compagnie", "gens de l'Est"],
      peur: "rien, sinon qu'on ne vous craigne pas assez",
      lieuDeRencontre: "le bout des rails de Fort-Rail, devant la borne de pierre de 1820",
      lieux: ["la gare de Fort-Rail", "l'hôtel de Fort-Rail", "la borne de 1820"],
    },
    {
      nom: "Les Ranchos du Brazos",
      situation: "la vallée du Brazos, autour de Bonne-Espérance",
      paysage: "des prairies, des bœufs à longues cornes, des maisons de pierre à galerie, des corrals, des chevaux",
      gens: ["vieilles familles", "vaqueros", "Asiliens de souche"],
      peur: "les voleurs de chevaux, la sécheresse, le prix que le rail propose",
      lieuDeRencontre: "la galerie d'un rancho du Brazos, au coucher du soleil",
      lieux: ["le rancho Wagram", "le rancho Austerlitz", "le rancho Eylau", "le rancho Marengo", "Wagram", "Austerlitz", "Marengo", "Eylau"],
    },
    {
      nom: "La Croix-de-Pierre",
      situation: "à l'ouest, au bord du plateau, à cinq jours de cheval de Fort-Rail",
      paysage: "une croix de pierre de six pieds plantée en 1820, un poste de traite, et au-delà la prairie haute",
      gens: ["traitants", "Asiliens de la frontière", "guerriers numunuu"],
      peur: "que la paix se rompe, les chasseurs de bisons américains qui passent la croix",
      lieuDeRencontre: "la croix de pierre, au bord du plateau, entre deux cavaliers qui se regardent",
      lieux: ["le poste de traite de la Croix-de-Pierre", "la croix de pierre"],
    },
    {
      nom: "La Comanchería",
      situation: "les Grandes Plaines à l'ouest de la croix",
      paysage: "le Llano Estacado, les canyons rouges de la Rivière Rouge, les campements de tipis au bord des rivières, des buffles qui se font rares",
      gens: ["Comanches", "Numunuu", "Quahadi"],
      peur: "que les Français oublient leur parole, que les cavaliers bleus trouvent un prétexte pour franchir la croix",
      lieuDeRencontre: "un canyon rouge de la Comanchería, au crépuscule, près d'un campement de tipis",
      lieux: ["le Llano Estacado", "les canyons de la Rivière Rouge", "un campement de tipis"],
    },
    {
      nom: "La Frontière du sud",
      situation: "le long du Rio Concho, au sud du Champ",
      paysage: "des collines de mesquite, des villages mexicains, des gués que tout le monde utilise et que personne ne garde",
      gens: ["contrebandiers", "voleurs de chevaux", "rurales", "Mexicains", "Tejanos"],
      peur: "les bandes, la ley fuga",
      lieuDeRencontre: "un gué du Concho, au clair de lune",
      lieux: ["le Rio Concho", "un gué du Concho", "les villages du sud"],
    },
  ],
  autresLieux: [
    "Partout", "le Champ", "le Brazos", "le haut Brazos", "la Rivière Rouge", "le Rio Grande", "le gué de la Fourche", "le Texas", "le Mexique", "le Nouveau-Mexique",
    "le Kansas", "San Antonio", "Washington", "Saint-Louis", "la Louisiane", "La Nouvelle-Orléans", "le Mississippi", "Cork", "l'Union", "les Grandes Plaines",
    "la piste du Kansas", "la piste", "l'est", "l'ouest", "le sud", "Sainte-Hélène", "Valmy", "Waterloo", "Sedan", "la France",
  ],

  factions: [
    { id: "assemblee", nom: "L'Assemblée de Bonne-Espérance", alias: ["Assemblée", "l'Assemblée", "la milice de l'Assemblée", "la milice"], but: "que le Champ reste libre, et que les familles restent riches", signe: "l'aigle et l'abeille, entrelacés", penche: "les titres", membres: ["président", "ancien", "milicien"] },
    { id: "rail", nom: "La Southwestern & Pacific", alias: ["Southwestern & Pacific", "le rail", "le chemin de fer", "la compagnie", "les hommes du rail"], but: "traverser le Champ jusqu'au Nouveau-Mexique", signe: "une locomotive dans un cercle", penche: "l'argent", membres: ["avocat", "géomètre", "agent de la compagnie", "garde de la compagnie", "cheminot"] },
    { id: "comanches", nom: "Les Comanches de la Comanchería", alias: ["Comanches", "Comanche", "les Quahadi", "Numunuu", "le Peuple", "guerriers numunuu"], but: "garder la terre et les chevaux", signe: "une main d'ocre rouge sur la croupe des chevaux", penche: "la parole donnée", membres: ["chef", "guerrier", "jeune guerrier", "interprète"] },
    { id: "rangers", nom: "Les Rangers du Texas", alias: ["Rangers", "Ranger", "la compagnie de la frontière"], but: "la loi texane, partout où ils peuvent la porter", signe: "une étoile dans un cercle", penche: "le mandat", membres: ["capitaine", "Ranger"] },
    { id: "rurales", nom: "Les rurales", alias: ["rurales", "rural", "les rurales mexicains"], but: "l'argent des ranchos du sud, et une frontière tranquille", signe: "le sombrero gris", penche: "la prime", membres: ["capitán", "rural"] },
    { id: "lys", nom: "La Bande des Lys", alias: ["Bande des Lys", "les Lys", "la Bande"], but: "l'argent, et le Champ libre", signe: "une fleur de lys gravée sur la crosse", penche: "la vengeance", membres: ["hors-la-loi", "cavalier de la Bande"] },
  ],

  figures: [
    { nom: "Hippolyte de Saint-Gilles", alias: ["Saint-Gilles", "le président Saint-Gilles", "le président de l'Assemblée"], titre: "président de l'Assemblée de Bonne-Espérance", ou: "Bonne-Espérance", faction: "assemblee", age: 70, etat: "vivant" },
    { nom: "Thaddeus Crane", alias: ["Crane", "l'avocat du rail"], titre: "avocat de la Southwestern & Pacific", ou: "Fort-Rail", faction: "rail", age: 40, etat: "vivant" },
    { nom: "Celui-qui-Compte-les-Chevaux", alias: ["Compte-les-Chevaux", "le vieux chef", "le chef comanche"], titre: "chef comanche, de la bande des Quahadi", ou: "La Comanchería", faction: "comanches", age: 75, etat: "vivant" },
    { nom: "Loup-qui-ne-Dort-pas", alias: ["Loup-qui-ne-Dort-pas", "Loup"], titre: "chef des jeunes guerriers comanches", ou: "La Comanchería", faction: "comanches", etat: "vivant" },
    { nom: "Marguerite Lacoste", alias: ["Lacoste", "la Veuve", "Marguerite", "Marguerite la Veuve"], titre: "dite la Veuve, cheffe de la Bande des Lys", ou: "Les Ranchos du Brazos", faction: "lys", age: 35, etat: "vivant" },
    { nom: "Ezekiel Burke", alias: ["Burke", "le capitaine Burke"], titre: "capitaine des Rangers de la frontière", ou: "La Frontière du sud", faction: "rangers", age: 50, etat: "vivant" },
    { nom: "Ramón Arredondo", alias: ["Arredondo", "le capitán Arredondo", "capitán Arredondo"], titre: "capitán des rurales", ou: "La Frontière du sud", faction: "rurales", etat: "vivant" },
    { nom: "Joseph Ortiz", alias: ["Ortiz", "le traitant"], titre: "traitant de la Croix-de-Pierre", ou: "La Croix-de-Pierre", age: 55, etat: "vivant" },
    { nom: "Anselme Dutour", alias: ["père Dutour", "le père Dutour", "Dutour", "le curé"], titre: "curé de Bonne-Espérance", ou: "Bonne-Espérance", age: 40, etat: "vivant" },
    { nom: "Aimé Duvernet", alias: ["Duvernet", "le colonel Duvernet", "colonel Duvernet", "le colonel fondateur", "le premier colonel"], titre: "colonel fondateur du Champ-d'Asile, vieux soldat de Valmy", ou: "Bonne-Espérance", etat: "mort" },
    { nom: "Hale", alias: ["colonel Hale", "le colonel Hale"], titre: "colonel de la cavalerie américaine, arrêté à la croix en 1875", ou: "La Croix-de-Pierre", etat: "vivant" },
    // À la première séance (bible, section 11)
    { nom: "Jean Sorbier", alias: ["Sorbier"], titre: "voyageur en manteau de cuir, qui se dit marchand de bestiaux", ou: "Fort-Rail", etat: "vivant" },
    { nom: "Elijah Moss", alias: ["Moss", "le géomètre"], titre: "géomètre du rail", ou: "Fort-Rail", faction: "rail", etat: "vivant" },
    { nom: "Gaspard Lenoir", alias: ["Lenoir", "le vieux Lenoir"], titre: "propriétaire du rancho Austerlitz", ou: "Les Ranchos du Brazos", etat: "vivant" },
    { nom: "Toinou Brassac", alias: ["Toinou", "Brassac"], titre: "garde de la diligence de Fort-Rail", ou: "Fort-Rail", etat: "vivant" },
    { nom: "Clémence Roux", alias: ["Clémence", "mademoiselle Roux"], titre: "fille du vieux Roux, du rancho Wagram", ou: "Les Ranchos du Brazos", etat: "vivant" },
    { nom: "Bastide", alias: ["le vieux Bastide", "le cocher"], titre: "cocher de la diligence de Fort-Rail", ou: "Fort-Rail", etat: "vivant" },
    { nom: "Roux", alias: ["le vieux Roux"], titre: "propriétaire du rancho Wagram", ou: "Les Ranchos du Brazos", etat: "vivant" },
  ],

  divinites: [],

  peuples: [
    "Asilien", "Asiliens", "Asilienne", "Asiliennes", "Asiliens de souche", "Asilien de souche", "Créoles de Louisiane", "Créole de Louisiane", "Créole", "Créoles",
    "Vaqueros", "Vaquero", "Tejano", "Tejanos", "Gens de la Comanchería", "Gens de l'Est", "Revenants de la guerre", "Revenant de la guerre",
    "Comanche", "Comanches", "Numunuu", "Quahadi", "Allemands du Texas", "Mexicains", "Noirs libres", "Irlandais", "Américains",
    // Classes
    "Pistolero", "Shérif", "Joueur", "Éclaireur", "Chasseur de primes", "Médecin de campagne", "Prédicateur", "Hors-la-loi", "Arpenteur",
    // Historiques
    "Ancien soldat", "Joueur professionnel", "Pasteur", "Prêtre", "Ouvrier du rail", "Chasseur de bisons", "Fils de famille",
  ],

  vocabulaire: [
    "Traité", "Traité des Deux Rivières", "Deux Rivières", "l'Asile", "de l'Asile", "Nom", "Coup d'éclat", "Coups d'éclat", "Mauvaises Nouvelles", "Mauvaise Nouvelle", "Titres", "les Titres",
    "Grognard", "grognard", "grognards", "Grognards", "l'Empereur", "Empereur", "Napoléon", "Valmy", "Waterloo", "Sedan", "Sécession", "Union", "Confédération", "Confédéré",
    "ranchos", "rancho", "vaqueros", "vaquero", "piastre", "piastres", "dollar", "dollars", "cents", "Colt", "Winchester", "Sharps", "revolver", "fusil de chasse", "cartouche", "cartouches", "sabre",
    "ley fuga", "tipi", "tipis", "mesquite", "diligence", "locomotive", "télégramme", "télégraphe", "gare", "voie", "rails", "traverses", "piquets", "mire", "mires", "géomètre", "géomètres",
    "bison", "bisons", "buffles", "mustang", "mustangs", "longhorn", "longhorns", "lasso", "corral", "corrals", "galerie", "adobe", "saloon", "saloons", "sombrero gris", "étoile de Ranger",
    "Ney", "Murat", "Cork", "Brazos", "Rivière Rouge", "Concho", "Rio Concho", "Llano", "Llano Estacado", "Rio Grande", "Texas", "Mexique", "Kansas", "Louisiane", "Brazos",
    "Chaque 14 juillet", "14 juillet", "la fête du Traité", "l'aigle et l'abeille", "l'aigle", "l'abeille", "tricolore", "drapeau tricolore", "Croix-de-Pierre", "la croix", "poste de traite", "traite",
    "piste du Kansas", "Fort-Rail", "Southwestern", "Pacific", "gué", "Fourche", "cavalerie", "cavaliers bleus", "milice", "Rangers", "rurales", "capitán", "Veuve", "Lys", "fleur de lys",
    "Bonne-Espérance", "Austerlitz", "Wagram", "Eylau", "Saint-Gilles", "Duvernet", "cordelette", "peau peinte", "main d'ocre rouge",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle. Le 14 juillet, fête du Traité, est public : on ne cache que ce qui arrive en 1880.
  secrets: [
    "soixante ans", "14 juillet 1880", "juillet 1880", "brûlé leur copie", "brûlent leur copie", "copie française", "copie comanche", "deux autres copies", "la copie brûlée",
    "cordelette à soixante nœuds", "cinquante-huit sont défaits", "Il en reste deux", "revient aux Comanches", "reviendra aux Comanches", "deviennent du papier", "devenir du papier", "version orale",
    "avait une durée", "Traité durait", "Traité expire", "le Traité prend fin", "fin du Traité", "date du Traité", "sait la date", "connaît la date",
    "cinq anciens", "quatre anciens", "Saint-Gilles vend", "vend ses terres au rail", "vend en secret", "sait pour le Traité",
    "chute dans l'escalier du clocher", "sous l'autel de saint Louis", "page arrachée", "lettre de 1821", "soudoyé le sacristain",
    "payé par le rail", "le rail le paie", "trouver des raisons", "fait fouiller", "cherche la copie", "trouve la copie", "la brûler, ou la produire",
    "moins de quinze personnes", "a peur de chaque attaque", "la clause est déjà rompue", "chasser les Français avant", "vendu des chevaux volés",
    "chasseur de primes : il a un mandat", "mandat des Rangers cousu", "Jean Sorbier est un chasseur de primes", "l'a renseignée", "parle, un des gardes",
    "liste « à convaincre »", "mention « à convaincre »", "écoute le vieux chef sans le dire",
  ],

  anachronismes: [
    // Rien d'après 1878
    "automobile", "automobiles", "voiture à moteur", "camion", "camions", "avion", "avions", "aéroplane", "hélicoptère", "mitrailleuse moderne", "mitraillette", "pistolet automatique", "Maxim",
    "téléphone portable", "téléphone de poche", "cabine téléphonique", "ligne téléphonique", "ampoule électrique", "éclairage électrique", "lumière électrique", "courant électrique", "électricité", "radio", "cinéma", "film", "télévision", "ordinateur", "internet",
    "smartphone", "photographie en couleur", "grille-pain", "réfrigérateur", "moteur à explosion", "pétrole raffiné", "Peau-Rouge", "Peaux-Rouges",
    // Rien de magique ni de fantasy
    "sortilège", "sortilèges", "magie", "magicien", "magicienne", "sorcier", "sorcière", "épée enchantée", "enchantement", "dragon", "elfe", "elfes", "nain", "gobelin", "orc", "grimoire", "potion",
    // Licences connues
    "Red Dead", "Red Dead Redemption", "Lucky Luke", "Django", "Il était une fois dans l'Ouest", "Deadwood", "Clint Eastwood", "John Wayne", "Calamity Jane", "Billy the Kid", "Buffalo Bill", "Wyatt Earp",
  ],

  noms: NOMS_CHAMP_D_ASILE,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "La diligence de Fort-Rail est attaquée ; parmi les voyageurs, un géomètre du rail.", factions: ["lys", "rail"] },
    { texte: "Le vieux Roux, du rancho Wagram, refuse de vendre au rail ; des hommes viennent la nuit.", factions: ["assemblee", "rail"] },
    { texte: "Un troupeau du Champ passe le gué du Concho ; les rurales du capitán Arredondo abattent avant de demander.", factions: ["rurales"] },
    { texte: "Le capitaine Burke a un mandat contre un Asilien qui n'a rien fait.", factions: ["rangers"] },
    { texte: "À la foire aux chevaux de Bonne-Espérance, le favori de la course est déjà promis au rail par le fils du propriétaire, endetté au jeu.", factions: ["assemblee", "rail"] },
    { texte: "Joseph Ortiz fait dire que le vieux chef veut parler aux Français, mais pas à l'Assemblée.", factions: ["comanches"] },
    { texte: "Des chasseurs de bisons américains passent la croix ; les jeunes guerriers vont répondre.", factions: ["comanches"] },
  ],

  cartes: {
    evenements: [
      { titre: "L'arbre en travers", texte: "Un tronc couché sur la piste, l'écorce encore blanche. Pas un bruit dans les saules, sinon un cheval qui souffle quelque part.", effet: "Embuscade possible : jet de Perception DD 13 pour repérer les cavaliers avant qu'ils ne sortent." },
      { titre: "Le clocher à midi", texte: "L'ombre du clocher touche le marché ; la place se vide d'un coup, les volets claquent, les mères rappellent leurs enfants.", effet: "Un duel ou une arrestation se prépare : un jet d'Intuition DD 12 dit qui l'attend." },
      { titre: "Les mires du rail", texte: "Au loin sur la prairie, une file de géomètres plante des piquets, une mire sur l'épaule. Le vieux rancher les regarde de sa galerie, le sabre sur les genoux.", effet: "Ces piquets sont arrachés ou respectés : le Champ le saura avant la nuit." },
      { titre: "Le gué à la lune", texte: "Un troupeau de chevaux passe l'eau en silence. Sur la colline, la braise d'une cigarette.", effet: "Voleurs de chevaux ou rurales : sauvegarde d'Adresse DD 12 pour ne pas être vu en traversant." },
      { titre: "La voie qui s'arrête", texte: "Une locomotive au bout des rails, la vapeur qui monte dans le soir, et à dix mètres devant elle une petite borne gravée d'un aigle, d'une abeille et du millésime « 1820 ».", effet: "Qui franchit la borne avec un piquet ou un fusil est vu de tout Fort-Rail." },
      { titre: "La croix entre deux cavaliers", texte: "De chaque côté de la croix de pierre, à dix pas, un vaquero asilien et un guerrier comanche se regardent sans bouger, le fusil en travers de la selle.", effet: "Rien n'arrive si personne ne bouge ; un jet de Persuasion DD 13 les fait se saluer." },
      { titre: "Le télégramme", texte: "Un jeune homme court de la gare à l'hôtel, une feuille jaune à la main. Quelques minutes plus tard, trois hommes du rail montent à cheval.", effet: "Le rail a une longueur d'avance : un jet d'Investigation DD 13 pour lire par-dessus l'épaule du télégraphiste." },
      { titre: "Le reçu des Lys", texte: "Le cocher tend un papier plié : « Reçu de la Bande des Lys, payable à la fin du rail », signé de deux fleurs de lys.", effet: "La Bande a passé avant vous. Le reçu, montré au bon endroit, vaut un avantage en Persuasion devant les ranchers." },
      { titre: "La foire aux chevaux", texte: "La place de Bonne-Espérance sent la poussière et le cuir. On parie sur l'étalon d'Eylau ; un jeune homme à l'air triste paie une tournée à tout le monde.", effet: "Un pari, une course, un cheval qui change de main : le Nom d'un personnage peut monter d'un point devant témoins." },
      { titre: "Le bal du samedi", texte: "Un violon, un accordéon, des bottes sur le plancher de l'Assemblée. Les vieux dansent la contredanse, les jeunes des polkas apprises des Allemands.", effet: "Une soirée pour parler à tout le monde : chaque personnage peut tenter un jet de Persuasion DD 12 pour une information." },
      { titre: "Le sac de farine", texte: "À la porte d'un tipi, un sac de farine cousu à d'autres, « Bonne-Espérance » encore lisible à l'envers. Un enfant vous regarde, puis s'en va en courant.", effet: "On vous a vus. Chez les Numunuu, la visite se prépare : offrir la farine ou le sucre vaut un avantage en Persuasion." },
      { titre: "La tempête de la plaine", texte: "L'horizon devient noir au sud-ouest, l'air froid tombe d'un coup, les chevaux tirent sur leurs longes. Puis la grêle.", effet: "Trouver un abri en dix minutes, ou sauvegarde d'Endurance DD 12 : dégâts de grêle 1d6 et chevaux paniqués." },
    ],
    objets: [
      { titre: "Un Colt de l'armée", texte: "Un revolver à six coups, la crosse usée par une autre main, un 17 marqué au couteau sous le pontet.", effet: "Dégâts de revolver, six coups ; recharger prend une action. Il vaut 17 dollars." },
      { titre: "Un Winchester à levier", texte: "Une carabine à levier de 1873, la plaque de couche cabossée, un clou de laiton planté dans la crosse pour chaque saison.", effet: "Quinze coups ; portée longue. Il vaut 30 dollars." },
      { titre: "Une boîte de cinquante cartouches", texte: "Un carton gras, un cachet de cire, l'adresse d'un armurier de Saint-Louis.", effet: "Cinquante cartouches, 1,5 kg ; 1 dollar à Fort-Rail, 2 à Bonne-Espérance, 5 à la Croix-de-Pierre." },
      { titre: "Un sabre d'aïeul", texte: "Un sabre de cavalerie de l'Empire, le fourreau cabossé, une abeille gravée près de la garde. Il a pendu des années au-dessus d'une cheminée.", effet: "Arme de guerre ; un Asilien le reconnaît et vous doit des égards, ou des comptes." },
      { titre: "Une mire de géomètre", texte: "Une mire de laiton dans son étui, une chaîne d'arpenteur, un carnet de piquets marqués d'une locomotive dans un cercle.", effet: "Avantage aux jets de Survie et d'Investigation pour lire un tracé ; le rail la réclame." },
      { titre: "Un sac de farine de Bonne-Espérance", texte: "Du coton gris, le nom de la ville imprimé en bleu, cousu bout à bout avec d'autres en tipi.", effet: "Vaut un cadeau à la Croix-de-Pierre : avantage en Persuasion auprès de qui le reçoit." },
      { titre: "Une étoile de Ranger", texte: "Une étoile dans un cercle, découpée dans une pièce d'argent mexicaine, l'épingle tordue.", effet: "Ouvre la parole d'un shérif ; les rurales et la Bande des Lys la reconnaissent aussi, et pas de la même façon." },
      { titre: "Un jeu de cartes marqué", texte: "Un jeu français aux coins un peu trop doux, que les doigts reconnaissent dans le noir.", effet: "Avantage aux jets d'Escamotage et de Tromperie à la table ; le surprendre avec coûte 1 point de Nom." },
      { titre: "Un lasso de crin", texte: "Quarante pieds de crin tressé, souple, la boucle graissée. Il sent le cheval et la fumée.", effet: "Portée 12 m ; avantage aux jets de Dressage pour attraper une bête ; Force DD 12 pour retenir un cavalier." },
      { titre: "Une piastre d'argent du Champ", texte: "Une pièce épaisse à l'aigle et à l'abeille, usée au pouce. Elle vaut un dollar, et on la préfère.", effet: "Vaut un dollar ; chez les Asiliens, la payer plutôt qu'un billet vous évite une méfiance." },
    ],
  },

  campagne: {
    jauge: {
      nom: "les Titres",
      depart: 100,
      max: 100,
      seuils: [
        { valeur: 75, effet: "Le rail a un pied dans le Champ ; les Rangers entrent en uniforme, avec l'accord tacite de l'Assemblée. Avant, ils viennent en civil." },
        { valeur: 50, effet: "L'Assemblée se divise ; la milice et les hommes du rail se tirent dessus." },
        { valeur: 25, effet: "Le Champ est perdu sur le papier ; seuls les ranchos de l'ouest tiennent." },
        { valeur: 0, effet: "Le rail traverse. Fin de campagne, sauf si le Traité est retrouvé et lu à temps." },
      ],
      remontees: [
        { action: "Une vente empêchée devant l'Assemblée, seulement si le MJ l'avait réellement prévue", gain: 5 },
        { action: "Une fraude du rail prouvée en public", gain: 10 },
      ],
      descentes: [
        { action: "Un grand rancho vendu au rail", perte: 5 },
        { action: "Une ferme brûlée ou volée par la force (cela soude les Asiliens contre le rail et leur donne des alliés)", perte: 10 },
      ],
    },
    reserve: {
      nom: "Mauvaises Nouvelles",
      max: 4,
      regle: "Une Mauvaise Nouvelle chaque fois qu'un personnage franchit un seuil de Nom. À dépenser pour faire arriver au mauvais moment un télégramme à Fort-Rail ou un courrier à cheval ailleurs, un témoin qui reconnaît un visage, ou un cheval qui boite.",
    },
    accroches: [
      { titre: "La diligence", niveaux: [1, 4], factions: ["lys", "rail"], texte: "La diligence de Fort-Rail est attaquée ; parmi les voyageurs, un géomètre du rail." },
      { titre: "Le rancho Wagram", niveaux: [1, 4], factions: ["assemblee", "rail"], texte: "Le vieux Roux refuse de vendre ; des hommes viennent la nuit." },
      { titre: "Les chevaux volés", niveaux: [1, 4], factions: ["rurales"], texte: "Un troupeau du Champ passe le gué du Concho ; les hommes d'Arredondo, les rurales, loués par les ranchos du sud, paient les voleurs à la tête, morts ou vifs, et abattent avant de demander." },
      { titre: "Le mandat", niveaux: [1, 4], factions: ["rangers"], texte: "Le capitaine Burke a un mandat contre un Asilien qui n'a rien fait." },
      { titre: "La foire", niveaux: [1, 4], factions: ["assemblee", "rail"], texte: "À la foire aux chevaux, le favori de la course, un étalon du rancho Eylau, est déjà promis au rail par le fils du propriétaire, endetté au jeu. Le vieux ne sait rien. Qui gagne la course, et à qui revient le cheval ?" },
      { titre: "Les maisons fouillées", niveaux: [5, 10], factions: ["rail"], texte: "Trois maisons de vieilles familles ont été fouillées sans rien voler." },
      { titre: "La sacristie", niveaux: [5, 10], factions: ["assemblee"], texte: "Le père Dutour demande de l'aide pour lire un registre ancien." },
      { titre: "La Veuve", niveaux: [5, 10], factions: ["lys"], texte: "La Veuve propose une alliance contre le rail." },
      { titre: "Le poste de traite", niveaux: [5, 10], factions: ["comanches"], texte: "Joseph Ortiz fait dire que le vieux chef veut parler aux Français, mais pas à l'Assemblée." },
      { titre: "Les chasseurs de bisons", niveaux: [5, 10], factions: ["comanches"], texte: "Des chasseurs américains passent la croix ; les jeunes guerriers vont répondre." },
      { titre: "L'autel de saint Louis", niveaux: [11, 16], factions: ["assemblee", "rail"], texte: "Crane a soudoyé le sacristain. Les personnages ont trois nuits pour ouvrir l'autel avant lui." },
      { titre: "La lettre de 1821", niveaux: [11, 16], factions: ["rail"], texte: "Crane l'a lue dans les archives de Washington, mais l'original est chez son fils, à Fort-Rail, qui la montre à qui paie. Combien, et qui d'autre est déjà passé ?" },
      { titre: "Loup-qui-ne-Dort-pas", niveaux: [11, 16], factions: ["comanches"], texte: "Les jeunes guerriers attaquent un rancho pour forcer la guerre." },
      { titre: "L'Assemblée de 1858", niveaux: [11, 16], factions: ["assemblee"], texte: "L'un des anciens est prêt à parler, mais il vit sous la protection de Saint-Gilles. Le faire parler sans que Saint-Gilles l'apprenne." },
      { titre: "Le train d'or", niveaux: [11, 16], factions: ["lys", "rail"], texte: "Le rail fait passer la paie de ses ouvriers ; la Veuve la veut." },
      { titre: "Le chef à Bonne-Espérance", niveaux: [17, 20], factions: ["comanches"], texte: "Celui-qui-Compte-les-Chevaux vient pour le jour du Traité." },
      { titre: "Crane", niveaux: [17, 20], factions: ["rail", "comanches"], texte: "L'avocat propose de racheter la terre aux Comanches, à son prix." },
      { titre: "L'Assemblée", niveaux: [17, 20], factions: ["assemblee"], texte: "Saint-Gilles veut faire voter la vente de tout le Champ avant la date." },
      { titre: "Les Rangers", niveaux: [17, 20], factions: ["rangers"], texte: "L'armée attend à la frontière, au cas où « les Indiens se soulèveraient »." },
      { titre: "La parole", niveaux: [17, 20], factions: ["assemblee", "rail", "comanches", "rangers", "rurales", "lys"], texte: "Renouveler le Traité en public (le Champ et la Comanchería tiennent ensemble, le rail doit négocier avec les deux) ; laisser la terre revenir aux Comanches (et vivre chez eux, à leurs conditions) ; partager la terre, le Champ à l'est de la Croix, les Comanches à l'ouest, garanti devant témoins ; ou brûler la copie française et convaincre le vieux chef de ne pas produire la sienne (il y a un prix, et c'est lui qui le fixe)." },
    ],
  },
};
