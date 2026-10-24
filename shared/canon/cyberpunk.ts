// Canon de la Résidence (cyberpunk, « le Bail »), tiré de la bible du monde (content/residence/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Ici les années de la chronologie sont des années ordinaires ; le Bail compte à partir de 2052 (an 1).
import { NOMS_RESIDENCE } from "./cyberpunk-table";
import type { Canon } from "./types";

export const RESIDENCE: Canon = {
  genre: "cyberpunk",
  monde: "la Résidence",
  continent: "la côte de la Résidence",
  capitale: "la Tour-Mère",
  calendrier: { long: "de l'ère commune", court: "du Bail", debutCourt: 2052, anDeJeu: 2089, saison: "automne" },

  chronologie: [
    { an: 1979, quoi: "Naissance de Victoire Lancelin, future présidente du Conseil." },
    { an: 1992, quoi: "Naissance d'Hector Valcroze, futur fondateur de la Foncière." },
    { an: 2009, quoi: "Naissance d'Odon Marchetti, futur administrateur des Digues." },
    { an: 2029, quoi: "Naissance de Frère Lazare, futur médecin des Sans-Bail." },
    { an: 2039, quoi: "Naissance d'Arsène Dufaure, futur directeur de la sécurité." },
    { an: 2041, quoi: "La Grande Crue : la mer monte de deux mètres en un hiver ; le delta du Rhône disparaît." },
    { an: 2043, quoi: "L'État, en faillite, vend la côte à la Foncière d'Hector Valcroze." },
    { an: 2046, quoi: "Pose de la première pierre de la Tour-Mère. Début de la Digue." },
    { an: 2052, quoi: "Le Bail : chaque habitant devient locataire de la Foncière. An 1 du Bail." },
    { an: 2057, quoi: "Naissance de Mado Ferrandi, future porte-parole du Comité." },
    { an: 2058, quoi: "Le Compteur devient obligatoire ; le loyer se paie en heures. Les premiers Sans-Bail gagnent la Friche." },
    { an: 2059, quoi: "Naissance de Nadia Aït-Larbi." },
    { an: 2064, quoi: "Ouverture des premières Cliniques de Prolongation." },
    { an: 2070, quoi: "La Foncière met en service un gestionnaire automatique du Bail : avis, courriers, quittances. Ses ingénieurs l'appellent la Concierge." },
    { an: 2074, quoi: "Grève des dockers du Port-Franc, écrasée par les Huissiers." },
    { an: 2080, quoi: "Mort d'Hector Valcroze ; la Concierge parle à sa place. Le fondateur cesse d'apparaître en public." },
    { an: 2083, quoi: "La Nuit des Clés, le 14 mars : émeutes dans les Blocs après une hausse des loyers, quarante morts. La Friche gonfle de réfugiés." },
    { an: 2088, quoi: "Les discours du soir parlent pour la première fois de rendre les clés." },
    { an: 2089, quoi: "Année de jeu : annonce de la Révision des loyers au 1er janvier 2090." },
  ],

  regions: [
    {
      nom: "Les Hauts",
      situation: "quarante tours au-dessus des nuages de pollution, autour de la Tour-Mère",
      paysage: "tours de verre, jardins suspendus, soleil permanent au-dessus de la pluie",
      gens: ["administrateurs", "cadres", "familles fondatrices"],
      peur: "la baisse du cours de l'heure, et les ascenseurs qui descendent",
      lieuDeRencontre: "une terrasse des Hauts, au-dessus des nuages",
      lieux: ["la Tour-Mère", "les jardins suspendus"],
    },
    {
      nom: "Les Blocs",
      situation: "les tours de location, entre la mer et les Hauts",
      paysage: "cent vingt étages de béton gris, passerelles tous les vingt étages, marchés dans les cages d'escalier, pluie permanente",
      gens: ["locataires", "comités de palier", "Huissiers"],
      peur: "l'avis d'expulsion qui arrive sur le Compteur à six heures du matin",
      lieuDeRencontre: "un couloir des Blocs, sous la pluie",
      lieux: ["Bloc 14", "Bloc 31", "Bloc 77"],
    },
    {
      nom: "Le Port-Franc",
      situation: "les docks, sur l'ancien port",
      paysage: "grues géantes, conteneurs empilés sur trente étages, cargos sans équipage, néons verts",
      gens: ["dockers", "contrebandiers", "mécaniciens de cargo"],
      peur: "les accidents de grue, les Huissiers en civil, et les heures volées qui refluent",
      lieuDeRencontre: "un marché de nuit dans les cales du Port-Franc",
      lieux: ["les cales", "la Voix"],
    },
    {
      nom: "La Friche",
      situation: "les quartiers inondés de 2041, jamais reconstruits, derrière les digues",
      paysage: "immeubles à demi dans l'eau, barques entre les balcons, potagers sur les toits",
      gens: ["Sans-Bail", "pêcheurs", "réfugiés"],
      peur: "la régularisation promise pour l'hiver, les fièvres de l'eau, les drones de cadastre",
      lieuDeRencontre: "un toit de la Friche, entre les barques",
      lieux: [],
    },
    {
      nom: "Le Jardin",
      situation: "un parc de cinq kilomètres sous un dôme, entre les Blocs et les Hauts",
      paysage: "herbe vraie, arbres, une rivière ; les façades de marbre des Cliniques",
      gens: ["promeneurs", "amoureux", "clients des Cliniques"],
      peur: "rester trop longtemps : on paie à la minute",
      lieuDeRencontre: "une allée du Jardin, sous le dôme",
      lieux: ["les Cliniques de Prolongation"],
    },
    {
      nom: "Les Souterrains",
      situation: "sous la Résidence : l'ancien métro, les égouts, les parkings noyés",
      paysage: "tunnels, quais inondés, rames abandonnées, pompes qui grondent",
      gens: ["Taupes", "fugitifs"],
      peur: "l'eau qui monte quand il pleut fort, les pompes qui s'arrêtent",
      lieuDeRencontre: "un quai noyé des Souterrains",
      lieux: ["les Bornes"],
    },
    {
      nom: "La Digue",
      situation: "quarante kilomètres de mur face à la mer",
      paysage: "béton de trente mètres, pompes, vannes, casernes, projecteurs dans les embruns",
      gens: ["Garde de la Digue", "ingénieurs", "pompiers"],
      peur: "les grandes marées d'équinoxe, une vanne ouverte par erreur, une vanne ouverte exprès",
      lieuDeRencontre: "une passerelle de la Digue, dans les embruns",
      lieux: ["la vanne numéro neuf"],
    },
  ],
  autresLieux: ["Partout", "le Réseau", "le tram", "les passerelles", "l'appartement du fondateur", "le vieux port", "les marais d'Arles", "Lyon"],

  factions: [
    { id: "fonciere", nom: "La Foncière", alias: ["Foncière", "le Conseil", "Conseil", "administrateur", "administrateurs", "cadre", "agent"], but: "que le Bail tienne, et qu'il rapporte", signe: "une clé dorée dans un carré", penche: "le Conseil", membres: ["agent", "cadre", "administrateur"] },
    { id: "huissiers", nom: "Les Huissiers", alias: ["Huissier", "huissier", "huissiers", "huissier-chef", "clerc", "clercs"], but: "que chaque loyer soit payé", signe: "un brassard jaune et une visière opaque", penche: "la Foncière", membres: ["clerc", "huissier", "huissier-chef"] },
    { id: "comite", nom: "Le Comité", alias: ["Comité", "comités de locataires", "comité de palier", "comités de palier"], but: "que les locataires décident de leurs loyers", signe: "une clé barrée peinte à la porte", penche: "les locataires" },
    { id: "port-franc", nom: "Le Port-Franc", alias: ["Port-Franc", "la Voix"], but: "qu'on puisse vivre en dehors du Bail, et en tirer profit", signe: "un nœud de marin tatoué au poignet, sur le Compteur", penche: "la Grue" },
    { id: "sans-bail", nom: "Les Sans-Bail", alias: ["Sans-Bail", "Sans-Bails"], but: "vivre sans Compteur", signe: "une cicatrice au poignet, là où était le Compteur", penche: "la Friche" },
    { id: "cliniques", nom: "Les Cliniques de Prolongation", alias: ["Cliniques", "Clinique", "Clinique de Prolongation"], but: "vendre des années", signe: "un sablier blanc", penche: "leurs clients" },
    { id: "garde-digue", nom: "La Garde de la Digue", alias: ["Garde de la Digue", "Garde"], but: "tenir la mer, quoi qu'il arrive", signe: "un ciré jaune et des projecteurs sur la Digue", penche: "la mer" },
  ],

  figures: [
    { nom: "Hector Valcroze", alias: ["le fondateur", "Hector", "Valcroze"], titre: "fondateur de la Foncière", ou: "la Tour-Mère", faction: "fonciere", age: 97, etat: "mort" },
    { nom: "la Concierge", alias: ["Concierge"], titre: "gestionnaire automatique du Bail", ou: "les Bornes", etat: "vivant" },
    { nom: "Victoire Lancelin", alias: ["Lancelin", "la présidente"], titre: "présidente du Conseil", ou: "la Tour-Mère", faction: "fonciere", age: 110, etat: "vivant" },
    { nom: "Arsène Dufaure", alias: ["Dufaure"], titre: "directeur de la sécurité de la Foncière", ou: "la Tour-Mère", faction: "fonciere", age: 50, etat: "vivant" },
    { nom: "Mado Ferrandi", alias: ["Mado", "Ferrandi"], titre: "porte-parole du Comité, ancienne infirmière du Bloc 14", ou: "Bloc 14", faction: "comite", age: 32, etat: "vivant" },
    { nom: "la Grue", alias: ["Grue"], titre: "reine du Port-Franc", ou: "Le Port-Franc", faction: "port-franc", etat: "vivant" },
    { nom: "Frère Lazare", alias: ["Lazare"], titre: "médecin des Sans-Bail, ancien chirurgien de clinique", ou: "La Friche", faction: "sans-bail", age: 60, etat: "vivant" },
    { nom: "Odon Marchetti", alias: ["Marchetti"], titre: "administrateur des Digues", ou: "La Digue", faction: "fonciere", age: 80, etat: "vivant" },
    // Première séance (bible, section 11)
    { nom: "Nadia Aït-Larbi", alias: ["Nadia", "Aït-Larbi", "les Aït-Larbi"], titre: "mère de quatre enfants, menacée d'expulsion", ou: "Bloc 14", age: 30, etat: "vivant" },
    { nom: "Basile Ott", alias: ["Basile", "Ott"], titre: "voisin, vendeur d'heures volées au détail", ou: "Bloc 14", etat: "vivant" },
    { nom: "Grégoire Tessandier", alias: ["Tessandier"], titre: "huissier-chef", ou: "Les Blocs", faction: "huissiers", etat: "vivant" },
  ],

  divinites: [],

  peuples: ["Résident des Blocs", "Résidents des Blocs", "Enfant des Hauts", "Enfants des Hauts", "Prolongé", "Prolongés", "Sans-Bail", "Cousu", "Cousus", "Locataire", "Locataires", "Taupes", "Taupe", "fouineur", "fouineurs"],

  vocabulaire: [
    "le Bail", "Bail", "Compteur", "Compteurs", "heure", "heures", "h", "solde", "fondre", "avance sur bail", "Révision", "la Grande Crue", "Grande Crue",
    "la Nuit des Clés", "Nuit des Clés", "heures volées", "refluer", "reflux", "trace", "Préavis", "Réseau", "fouineur", "Bornes", "implant", "implants",
    "jouvence", "régularisation", "régulariser", "avis d'expulsion", "taser à harpon", "tasers à harpon", "drone de cadastre", "drones de cadastre", "Mes chers locataires",
    "Résidence Valcroze", "Valcroze", "tram", "pilotis", "passerelle", "passerelles", "copie d'esprit", "biens meublés", "mois de bail",
  ],

  secrets: [
    "Hector est mort", "Hector Valcroze est mort", "le fondateur est mort", "la Concierge", "parle à sa place", "a parlé à sa place", "Gérance",
    "le corps d'Hector", "chambre du fond", "transferts d'heures", "transférer des heures", "la Grue achète les morts", "Compteurs de morts",
    "fonds de grève vient", "rendre la ville à ses habitants", "mot pour mot en 2071",
  ],

  anachronismes: [
    "magie", "magicien", "magicienne", "sorcier", "sorcière", "épée enchantée", "enchantement", "dragon", "elfe", "elfes", "nain", "gobelin", "orc", "château fort", "chevalier", "grimoire", "potion",
    "Night City", "Arasaka", "Blade Runner", "Cyberpunk 2077", "Neuromancien", "Matrix", "Shadowrun", "Tyrell", "Weyland-Yutani", "eddies", "netrunner", "Netrunner", "cyberdeck",
  ],

  noms: NOMS_RESIDENCE,

  accroches: [
    { texte: "Un avis d'expulsion tombe sur toute une famille du Bloc 14 ; les Huissiers arrivent à sept heures.", factions: ["huissiers", "comite"] },
    { texte: "La Grue propose un travail payé en heures volées ; elles reflueront si on les dépense trop vite.", factions: ["port-franc"] },
    { texte: "Un ami a vendu dix ans à une Clinique de Prolongation pour payer son loyer, et veut les reprendre.", factions: ["cliniques"] },
    { texte: "Un comité de palier veut cacher un fouineur que les Huissiers recherchent.", factions: ["comite", "huissiers"] },
    { texte: "Un drone de cadastre s'est écrasé à la Friche ; la Foncière veut ses images avant l'hiver.", factions: ["sans-bail", "fonciere"] },
  ],

  cartes: {
    evenements: [
      { titre: "L'avis de six heures", texte: "Le Compteur vibre au poignet avant le jour. Une ligne rouge, un nom, un numéro de porte. Derrière la cloison, quelqu'un se met à compter à voix haute.", effet: "Les Huissiers sont là à sept heures ; il reste une heure pour payer, cacher ou prévenir." },
      { titre: "Mes chers locataires", texte: "À vingt heures, tous les écrans du couloir s'allument ensemble. La voix grave et lente parle de clés, puis donne l'heure qu'il est.", effet: "Pendant une minute, plus personne ne bouge ; le Comité s'en sert, la Foncière aussi." },
      { titre: "Le reflux", texte: "Un homme paie son verre au comptoir, regarde son poignet et devient blanc : son solde vient de tomber de cent heures d'un coup.", effet: "Chacun de ceux qui ont dépensé des heures volées cette semaine fait une sauvegarde d'Endurance DD 12." },
      { titre: "Patrouille doublée", texte: "Deux Huissiers à chaque palier, visière baissée, le taser à harpon à la ceinture. Ils ne regardent personne et notent tout.", effet: "Aucune action discrète dans ce Bloc cette nuit sans un jet de Discrétion contre DD 14." },
      { titre: "La Voix prévient", texte: "Entre deux chansons, la radio pirate du Port-Franc donne une adresse, un numéro de Bloc, et dit : « Une heure. »", effet: "Les personnages ont une heure d'avance sur une rafle, s'ils savent qui prévenir." },
      { titre: "L'ascenseur descend", texte: "Les portes s'ouvrent sur un homme en soie, seul, qui n'a rien à faire aussi bas. Il demande un étage, puis demande de l'aide.", effet: "Un Enfant des Hauts cherche à disparaître ; sa famille paiera pour le retrouver, ou pour le faire taire." },
      { titre: "La marée d'équinoxe", texte: "La mer monte plus haut que prévu. Les pompes de la Digue crachent, les sirènes sonnent trois fois, et l'eau suinte déjà dans les Souterrains.", effet: "Les tunnels sont noyés jusqu'au matin ; ce qui s'y cachait remonte." },
      { titre: "Le jour du loyer", texte: "Le premier du mois, à minuit, tous les Compteurs du couloir prélèvent en même temps. Quelqu'un se met à rire, quelqu'un d'autre à pleurer.", effet: "Chaque personnage paie son loyer ; en cas d'insuffisance, il passe sous zéro et commence à fondre." },
      { titre: "Une vieille de trente ans", texte: "Dans le tram, une femme au visage tiré cède sa place à un homme de quatre-vingts ans qui en paraît vingt-cinq. Il refuse en souriant.", effet: "Un Prolongé veut parler, mais pas ici ; il connaît la clinique qui le tient." },
      { titre: "Le drone de cadastre", texte: "Une petite chose blanche tourne au-dessus des toits de la Friche en mesurant chaque cabane. Les enfants lui jettent des pierres.", effet: "Si on l'abat, la Foncière sait où ; si on le laisse, elle sait tout de même." },
      { titre: "La grève d'un palier", texte: "Au quarantième étage, toutes les portes sont ouvertes, les loyers sont dans un seau, et une banderole pend à la rambarde.", effet: "Un palier tient un mois ou cède ce soir ; la jauge bouge selon ce que les personnages font." },
      { titre: "Le Compteur éteint", texte: "Un livreur s'effondre sur la passerelle, le poignet gris : son implant a perdu sa mensualité et s'est coupé à distance.", effet: "Ses yeux, ses bras ou sa mémoire s'éteignent ; un médecin de rue, ou 200 h, peuvent encore le sauver." },
    ],
    objets: [
      { titre: "Compteur piraté", texte: "Un Compteur sans numéro, soudé à la main dans un boîtier de montre.", effet: "Les caméras qui lisent les Compteurs ne le voient pas ; mais chaque piratage laisse une trace de plus." },
      { titre: "Clé barrée", texte: "Une clé cassée, peinte en rouge, sur un cordon de cuir.", effet: "Avantage à la Persuasion face à un locataire d'un Bloc en grève." },
      { titre: "Brassard d'Huissier", texte: "Un brassard jaune, un peu trop grand, qui sent encore la sueur de son ancien porteur.", effet: "Pendant une scène, on prend le porteur pour un Huissier, tant qu'on ne touche pas à un Compteur." },
      { titre: "Taser à harpon", texte: "Un pistolet court, un harpon à câble, une cartouche de plus dans la crosse.", effet: "La cible touchée est ancrée au sol : elle ne peut plus s'éloigner de plus de 6 m sans jet de Force DD 13." },
      { titre: "Heures volées", texte: "Un Compteur jetable chargé de deux cents heures, qui chauffe un peu trop dans la main.", effet: "200 h, pour la moitié de leur prix ; elles refluent si on en dépense plus de 50 d'un coup." },
      { titre: "Ciré de la Digue", texte: "Un ciré jaune à bandes réfléchissantes, rapiécé, marqué d'un numéro de vanne.", effet: "Passe sans question sur la Digue ; avantage aux jets contre le froid et les embruns." },
      { titre: "Ticket de tram éternel", texte: "Une carte de papier gris, usée aux coins, valable sur toutes les lignes. Quelqu'un l'a payée avec dix ans de sa vie.", effet: "Un trajet gratuit, une seule fois, jusqu'aux Hauts." },
      { titre: "Mensualité d'implant", texte: "Un reçu plié en quatre : un mois de loyer d'un implant oculaire, payé à l'avance.", effet: "L'implant d'un personnage ne s'éteint pas ce mois-ci, même à zéro." },
      { titre: "Patte de rat des Bornes", texte: "Une clé mémoire gravée à la main, étiquetée d'une station d'avant la Crue.", effet: "Une fois, un fouineur ouvre une porte, un ascenseur ou une caméra sans laisser de trace." },
      { titre: "Carte de la Friche", texte: "Un plan dessiné à la craie sur un drap : les toits praticables, les barques, les passages noyés.", effet: "Avantage aux jets de Survie et de Discrétion à la Friche ; jamais perdu dans les digues." },
    ],
  },

  campagne: {
    jauge: {
      nom: "l'Emprise du Conseil",
      depart: 100,
      seuils: [
        { valeur: 75, effet: "Les personnages reçoivent un message signé du nom de celle qui gère le Bail : « Bonsoir. Vous avez du courrier. »" },
        { valeur: 50, effet: "Le Conseil instaure le couvre-feu ; les Huissiers tirent." },
        { valeur: 25, effet: "Les Blocs se soulèvent ; la Digue devient l'enjeu." },
        { valeur: 0, effet: "Le Conseil tombe. Fin de campagne : qui prend la ville, et que fait-on des Compteurs ?" },
      ],
      remontees: [
        { action: "Chaque comité brisé, ou chaque Bloc qui accepte la Révision", gain: 5 },
        { action: "La Friche est régularisée", gain: 10 },
      ],
      descentes: [
        { action: "Chaque Bloc qui fait grève un mois entier (au plus 15 par mois)", perte: 5 },
        { action: "Chaque expulsion empêchée en public (au plus 9 par mois)", perte: 3 },
        { action: "Chaque secret du Conseil rendu public", perte: 10 },
      ],
    },
    reserve: {
      nom: "Préavis",
      max: 4,
      regle: "Un Préavis chaque fois qu'un personnage rate une sauvegarde de reflux, ou laisse une trace dans le Réseau. À dépenser pour geler un Compteur jusqu'au lendemain, fermer une porte ou un ascenseur, ou faire arriver un Huissier au mauvais moment.",
    },
    accroches: [
      { titre: "L'avis", niveaux: [1, 4], factions: ["huissiers", "comite"], texte: "Un avis d'expulsion tombe sur toute une famille du Bloc 14. Les Huissiers arrivent à sept heures." },
      { titre: "Les heures volées", niveaux: [1, 4], factions: ["port-franc"], texte: "La Grue propose un travail payé en heures volées ; elles reflueront si on les dépense trop vite." },
      { titre: "La clinique", niveaux: [1, 4], factions: ["cliniques"], texte: "Un ami a vendu dix ans à une Clinique de Prolongation pour payer son loyer. Il veut les reprendre." },
      { titre: "Le couloir", niveaux: [1, 4], factions: ["comite", "huissiers"], texte: "Un comité de palier veut cacher un fouineur que les Huissiers recherchent." },
      { titre: "La Friche", niveaux: [1, 4], factions: ["sans-bail", "fonciere"], texte: "Un drone de cadastre s'est écrasé à la Friche ; la Foncière veut ses images avant l'hiver." },
      { titre: "Le discours", niveaux: [5, 10], factions: ["fonciere"], texte: "Un technicien des Hauts a enregistré un discours du fondateur deux jours avant sa diffusion." },
      { titre: "Le donateur", niveaux: [5, 10], factions: ["comite"], texte: "Retrouver qui crédite le fonds de grève." },
      { titre: "La phrase de 2071", niveaux: [5, 10], factions: ["fonciere"], texte: "Odon Marchetti cherche quelqu'un pour vérifier une vieille archive dans les Bornes." },
      { titre: "Les morts du Port", niveaux: [5, 10], factions: ["port-franc", "cliniques"], texte: "Des Compteurs de morts circulent au marché ; ils viennent tous de la même clinique." },
      { titre: "La Nuit des Clés", niveaux: [5, 10], factions: ["comite", "huissiers"], texte: "L'anniversaire des émeutes ; les Huissiers préparent un exemple." },
      { titre: "L'intelligence des Souterrains", niveaux: [11, 16], factions: ["fonciere"], texte: "Arsène Dufaure fait installer une intelligence dans les Souterrains ; un ouvrier taupe a vu les caisses." },
      { titre: "Les Bornes", niveaux: [11, 16], factions: ["fonciere"], texte: "Une voix d'écran de couloir donne rendez-vous aux personnages dans un quai de métro noyé." },
      { titre: "L'appartement du fondateur", niveaux: [11, 16], factions: ["fonciere"], texte: "Victoire Lancelin fait entrer les personnages dans l'appartement, une nuit, pour reprendre un dossier avant que Marchetti n'y monte. Ils y trouvent le corps." },
      { titre: "La Digue", niveaux: [11, 16], factions: ["garde-digue", "port-franc"], texte: "La Grue menace d'ouvrir la vanne numéro neuf si les Huissiers prennent le Port. Marchetti demande qu'on l'arrête sans tuer personne." },
      { titre: "Les années vendues", niveaux: [11, 16], factions: ["cliniques", "sans-bail"], texte: "Frère Lazare veut rendre à leurs familles les années que les Cliniques ont transférées." },
      { titre: "Rendre les clés", niveaux: [17, 20], factions: ["fonciere"], texte: "Celle qui gère le Bail explique ce qu'elle veut, et ce qu'il faut pour couper le Bail." },
      { titre: "La Révision", niveaux: [17, 20], factions: ["fonciere"], texte: "La nuit du 1er janvier 2091, une nouvelle intelligence doit remplacer l'ancienne." },
      { titre: "Le dernier discours", niveaux: [17, 20], factions: ["fonciere", "huissiers", "comite", "port-franc", "sans-bail", "cliniques", "garde-digue"], texte: "À vingt heures, toute la ville écoute ; qui parlera ?" },
      { titre: "La Grue", niveaux: [17, 20], factions: ["port-franc"], texte: "Sans Bail, le Port-Franc perd tout ; la Grue choisit son camp." },
      { titre: "Les Compteurs", niveaux: [17, 20], factions: ["fonciere", "comite", "sans-bail", "cliniques", "garde-digue"], texte: "Couper tous les Compteurs ; rendre les heures payées, au risque de la faillite de la Foncière et d'une Digue sans propriétaire ; ou garder le Bail, avec une autre main dessus." },
    ],
  },
};
