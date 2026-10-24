// Canon de la Cellule Hermès (contemporain, thriller d'espionnage, Europe, novembre 2026), tiré de la bible du monde (content/cellule-hermes/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; la Cellule compte aussi « de la Cellule » à partir de 2011 (an 0, sa création).
// Ce que le Service est devenu, ce que le Cabinet assemble et ce que prépare le Rachat sont dans les secrets, pas dans la chronologie :
// la chronologie ne dit que ce que tout le monde sait.
// Tout est inventé : le Service, ses cellules, les groupes, les sociétés, les institutions et toutes les personnes. Aucun service, aucune entreprise
// et aucune personne réels n'agit dans le jeu ; les villes, les gares, les ports et les lois générales (frontières ouvertes, caméras, port d'arme interdit) sont réels.
import { NOMS_HERMES } from "./contemporain-table";
import type { Canon } from "./types";

/** Les Écoutes : la réserve du MJ. Code du MJ seulement : jamais importé par le code des joueurs. */
export const ECOUTES_MAX = 4;
export const REGLE_DES_ECOUTES =
  "Chaque fois que la Cellule franchit pour la première fois un seuil d'Empreinte (3, 5, 7 ou 10), le MJ gagne une Écoute : une par seuil et par campagne, quatre au plus. Redescendre ne l'efface pas, remonter ne rend rien. Il en dépense une pour faire entendre quelque chose à quelqu'un. Il y en a deux sortes : l'Écoute de terrain (un témoin parle à l'inspectrice de la Section, un chauffeur prévient Ostrevent, un policier se souvient) et l'Écoute de la Boîte (celui qui lit la Boîte réagit à un message) ; une seule Écoute de la Boîte par séance. Le joueur peut l'annuler en prenant 1 d'Empreinte, sans franchir de seuil nouveau.";

export const CELLULE_HERMES: Canon = {
  genre: "contemporain",
  monde: "la Cellule Hermès",
  continent: "L'Europe",
  capitale: "Paris",
  calendrier: { long: "ordinaire", court: "de la Cellule", debutCourt: 2011, anDeJeu: 2026, saison: "automne" },

  chronologie: [
    { an: 2010, quoi: "Le directeur de la Direction de la Veille et des Liaisons crée un bureau de « liaisons discrètes »." },
    { an: 2011, quoi: "Création de la Cellule Hermès, l'équipe niable du Service. Première Traitante : Odile Maréchal. C'est l'an 0 de la Cellule." },
    { an: 2012, quoi: "Premier pli confié à la Cellule : la remise d'une valise à Trieste." },
    { an: 2014, quoi: "Premier audit interne sur les fonds spéciaux ; le bureau des liaisons discrètes est absorbé par la direction." },
    { an: 2017, quoi: "Création de la Section de contrôle des services." },
    { an: 2019, quoi: "Suzanne Mercadier devient Traitante de la Cellule, en juin." },
    { an: 2020, quoi: "Les confinements du printemps vident les villes ; la Cellule travaille à distance, et la Boîte devient le seul canal." },
    { an: 2021, quoi: "Rumeur : deux anciens coursiers ont disparu après une mission à Trieste." },
    { an: 2022, quoi: "Première publication du Collectif Palimpseste : une série de notes de frais d'une société de sécurité." },
    { an: 2023, quoi: "La Section de contrôle ouvre un dossier sur « des dépenses sans service »." },
    { an: 2024, quoi: "Palimpseste publie une accusation fausse contre un cadre du groupe Ostrevent, qui quitte son poste." },
    { an: 2025, quoi: "Le groupe Ostrevent obtient un contrat de protection avec un grand groupe industriel européen et s'installe à Rotterdam." },
    { an: 2026, quoi: "Année de jeu : en septembre, quatre nouveaux coursiers sont recrutés. En novembre, première séance." },
  ],

  regions: [
    {
      nom: "Paris",
      situation: "au centre, rive droite, près du boulevard de Magenta (10e arrondissement)",
      paysage: "une boutique de tissus au rez-de-chaussée d'un immeuble : rouleaux de coton imprimé, boutons dans des boîtes de biscuits, une machine à coudre dans la vitrine ; au fond, une arrière-boutique avec une table de coupe, une cafetière et un coffre-fort à serrure ancienne ; au-dessus, un deux-pièces sans nom sur la sonnette",
      gens: ["petits commerçants", "livreurs à vélo", "voyageurs de la gare du Nord", "habitants du foyer de travailleurs", "voisins qui regardent par la fenêtre"],
      peur: "le voisinage qui note les allées et venues, le facteur qui a une lettre au mauvais nom, la fuite d'eau qui oblige un plombier à entrer dans l'arrière-boutique",
      lieuDeRencontre: "l'arrière-boutique de la Mercerie, rideau baissé, autour de la table de coupe",
      lieux: ["la Mercerie", "l'arrière-boutique", "la table de coupe", "le boulevard de Magenta", "la gare du Nord", "le 10e arrondissement"],
    },
    {
      nom: "Bruxelles",
      situation: "au nord, à Ixelles, dans les quartiers d'avocats et de lobbyistes",
      paysage: "une maison de maître d'Ixelles à la façade en brique noircie, un escalier à rampe en bois, une plaque de cuivre « Aldenhove & Fils, traductions assermentées » ; à l'intérieur, des dictionnaires jusqu'au plafond, des rames de papier et une imprimante qui n'a jamais tourné à plein régime",
      gens: ["traducteurs", "avocats", "lobbyistes", "étudiants", "concierges"],
      peur: "le client qui arrive sans rendez-vous, la concierge qui voit les visiteurs, le téléphone qui sonne sur la ligne du fond, celle qu'on ne décroche pas",
      lieuDeRencontre: "la maison de maître d'Ixelles, devant la plaque de cuivre de l'agence Aldenhove",
      lieux: ["l'agence Aldenhove", "Ixelles", "la rue de la Brasserie", "la ligne du fond", "Bruxelles-Midi"],
    },
    {
      nom: "Luxembourg",
      situation: "au sud de Luxembourg-Ville, à vingt minutes de la gare",
      paysage: "une ancienne caserne du XXe siècle reconvertie en centre de stockage de données : barrière, guérite, clôture, parking presque vide, panneau « Archives et conservation numérique, accès sur rendez-vous »",
      gens: ["jeunes cadres en gilet sans manches", "chauffeurs de bus transfrontaliers", "vigiles polis", "gardiens de nuit"],
      peur: "les badges, les caméras, les agents de sécurité privés qui connaissent tous les visages, une plaque d'immatriculation notée à l'entrée",
      lieuDeRencontre: "la barrière d'une ancienne caserne au sud de Luxembourg-Ville, à six heures du matin",
      lieux: ["l'ancienne caserne", "la barrière de la caserne", "la guérite", "le hangar", "Luxembourg-Ville"],
    },
    {
      nom: "Genève",
      situation: "au-dessus du lac, dans une rue calme",
      paysage: "une banque privée à porte à digicode, tapis épais, vitrage fumé et portraits de fondateurs ; en sous-sol, une salle de coffres à ouverture temporisée",
      gens: ["gestionnaires de fortune", "clients qui ne se croisent jamais", "agents de la police cantonale"],
      peur: "les cartes d'identité scannées, les fiches de visite, le gestionnaire qui reconnaît un visage, la police cantonale très polie et très exacte",
      lieuDeRencontre: "un salon boisé de Genève, une chemise cartonnée posée entre deux tasses de thé",
      lieux: ["la banque privée", "la salle des coffres", "le salon boisé", "le lac"],
    },
    {
      nom: "Trieste",
      situation: "au fond de l'Adriatique, face aux Balkans",
      paysage: "le vieux port franc : entrepôts de pierre alignés sur le quai, rails oubliés, grues rouillées, ferries pour les Balkans ; sur les collines, des cafés d'où l'on regarde les bateaux, et la bora qui rabat les mouettes contre les vitres",
      gens: ["douaniers", "changeurs", "marins de ferry", "gars de la bande de quai", "serveurs de café"],
      peur: "le vent qui fait claquer les tôles et couvre le bruit des pas, les douaniers qui contrôlent un camion sur dix, la bande de quai qui prend sa part",
      lieuDeRencontre: "le quai du vieux port franc de Trieste, devant un entrepôt de pierre aux portes grandes ouvertes",
      lieux: ["le magasin 31", "le vieux port franc", "le quai", "la bora", "la clinique de la colline"],
    },
    {
      nom: "Rotterdam",
      situation: "à l'embouchure du Rhin, sur la mer du Nord",
      paysage: "le plus grand port d'Europe : des dizaines de kilomètres de quais, de grues et de piles de conteneurs de six étages, des lumières orange la nuit, du vent et des camions ; l'eau est grise, les bureaux sont vitrés",
      gens: ["dockers", "agents de manutention", "douaniers", "syndicalistes", "chauffeurs de camion"],
      peur: "les scanners de la douane, les patrouilles à lampes, les cabines de pilotage, une grue qui s'arrête au mauvais moment, un conteneur qui s'ouvre",
      lieuDeRencontre: "une rangée de conteneurs bleus de la Maasvlakte, à quatre heures du matin",
      lieux: ["la Maasvlakte", "le terminal", "les conteneurs bleus", "la cabine de grue"],
    },
    {
      nom: "Marseille",
      situation: "sur la Méditerranée, aux anciens docks de la Joliette",
      paysage: "les quais de la Joliette, les anciens docks reconvertis en bureaux, les ferries pour l'Algérie, la Corse et la Sardaigne, le soleil qui frappe en novembre et le mistral qui plaque les sacs plastiques contre les grilles ; en bas, un bar de dockers qui ouvre à cinq heures",
      gens: ["dockers", "pêcheurs", "logisticiens", "syndicalistes", "habitués du bar"],
      peur: "les contrôles en civil sur les quais, un habitué qui note une plaque, un règlement de comptes sans rapport avec vous qui fait venir la police",
      lieuDeRencontre: "le Café de la Tourette, sur les quais de la Joliette, à l'ouverture de cinq heures",
      lieux: ["la Joliette", "le Café de la Tourette", "les quais", "le comptoir en zinc"],
    },
  ],
  autresLieux: [
    "Partout", "l'Europe", "Paris-Nord", "la France", "la Belgique", "le Luxembourg", "la Suisse", "l'Italie", "les Pays-Bas", "l'Allemagne", "Berlin", "Ixelles",
    "la mer du Nord", "l'Adriatique", "les Balkans", "la Corse", "la Sardaigne", "l'Algérie", "la Méditerranée", "le commissariat", "le tribunal", "la douane", "la frontière",
    "les consignes", "la gare", "l'aéroport", "l'autoroute", "le péage", "la clinique", "l'hôtel de la gare", "le bar", "la rédaction",
  ],

  factions: [
    { id: "service", nom: "Le Service", alias: ["Service", "la DVL", "DVL", "la Direction de la Veille et des Liaisons", "Direction de la Veille et des Liaisons", "la Cellule", "la Cellule Hermès", "les coursiers", "un coursier"], but: "protéger les intérêts du pays à l'étranger et prévenir ce qu'on ne peut pas voir", signe: "le papier à en-tête gris, une ligne d'espaces autour d'un numéro de pli", penche: "le secret", membres: ["Traitante", "coursier", "agent sous statut", "archiviste"] },
    { id: "section", nom: "La Section de contrôle des services", alias: ["Section de contrôle des services", "la Section", "Section de contrôle", "les inspecteurs de la Section"], but: "vérifier que les services dépensent ce qu'ils déclarent et n'agissent que dans la loi", signe: "une carte tricolore dans un porte-cartes noir, montrée une seule fois", penche: "l'audit", membres: ["inspectrice", "inspecteur", "auditeur"] },
    { id: "partenaires", nom: "Les Partenaires", alias: ["Partenaires", "un Partenaire", "le club des services alliés"], but: "garder les échanges d'informations entre quatre services européens alliés", signe: "une pastille bleue sur la carte d'invitation à une réunion", penche: "l'alliance", membres: ["officier de liaison", "attaché"] },
    { id: "ostrevent", nom: "Le groupe Ostrevent", alias: ["Ostrevent", "groupe Ostrevent", "les hommes d'Ostrevent", "un homme d'Ostrevent"], but: "gagner des contrats : protection de dirigeants, enquêtes d'entreprise, extraction de personnes", signe: "des véhicules gris sans plaque de société, des hommes en blouson sombre, une carte professionnelle en plastique sans photo", penche: "le contrat", membres: ["patron", "homme de main", "ancien militaire", "ancien policier", "chef d'équipe"] },
    { id: "palimpseste", nom: "Le Collectif Palimpseste", alias: ["Collectif Palimpseste", "Palimpseste", "le Collectif", "les lanceurs d'alerte"], but: "rendre publics les abus de surveillance et les dossiers secrets", signe: "un rectangle noir recouvert de lignes de texte superposées", penche: "la fuite", membres: ["porte-parole", "journaliste partenaire", "technicien", "militant"] },
  ],

  figures: [
    { nom: "Suzanne Mercadier", alias: ["Mercadier", "Suzanne", "madame Mercadier", "la Traitante"], titre: "Traitante de la Cellule Hermès", ou: "la Mercerie", faction: "service", age: 58, etat: "vivant" },
    { nom: "Judith Aldebert", alias: ["Aldebert", "Judith", "madame Aldebert", "l'inspectrice"], titre: "inspectrice principale de la Section de contrôle des services", ou: "Paris", faction: "section", age: 44, etat: "vivant" },
    { nom: "Ettore Scalvini", alias: ["Scalvini", "Ettore", "monsieur Scalvini"], titre: "officier de liaison des Partenaires", ou: "Trieste", faction: "partenaires", age: 52, etat: "vivant" },
    { nom: "Gaël Tournemine", alias: ["Tournemine", "Gaël", "monsieur Tournemine"], titre: "patron du groupe Ostrevent", ou: "Rotterdam", faction: "ostrevent", age: 49, etat: "vivant" },
    { nom: "Tessa Brandvold", alias: ["Brandvold", "Tessa", "madame Brandvold"], titre: "porte-parole du Collectif Palimpseste", ou: "Berlin", faction: "palimpseste", age: 36, etat: "vivant" },
    { nom: "Hugo Lemarchand", alias: ["Lemarchand", "Hugo", "monsieur Lemarchand"], titre: "second du Collectif Palimpseste", ou: "Berlin", faction: "palimpseste", etat: "vivant" },
    { nom: "Gérard Aldenhove", alias: ["Aldenhove", "Gérard", "monsieur Aldenhove", "le traducteur assermenté"], titre: "traducteur assermenté, agence Aldenhove", ou: "l'agence Aldenhove", faction: "service", age: 71, etat: "vivant" },
    { nom: "Josiane Pastorelli", alias: ["Pastorelli", "Josiane", "madame Pastorelli", "la patronne de la Tourette"], titre: "patronne du Café de la Tourette", ou: "le Café de la Tourette", age: 55, etat: "vivant" },
    { nom: "Joost Brinkhof", alias: ["Brinkhof", "Joost", "monsieur Brinkhof"], titre: "contremaître au terminal de la Maasvlakte", ou: "la Maasvlakte", etat: "vivant" },
    { nom: "Konrad Zumbrunn", alias: ["Zumbrunn", "Konrad", "monsieur Zumbrunn"], titre: "gestionnaire de la banque privée de Genève", ou: "la salle des coffres", etat: "vivant" },
    { nom: "Dorian Meyssonnier", alias: ["Meyssonnier", "Dorian", "monsieur Meyssonnier"], titre: "chef d'équipe du groupe Ostrevent", ou: "Rotterdam", faction: "ostrevent", etat: "vivant" },
    { nom: "Madame Roux", alias: ["madame Roux", "la mercière", "Roux"], titre: "mercière, propriétaire de la Mercerie", ou: "la Mercerie", etat: "vivant" },
    { nom: "Odile Maréchal", alias: ["Maréchal", "Odile", "madame Maréchal"], titre: "première Traitante de la Cellule Hermès", ou: "Paris", faction: "service" },
    // Entièrement ou en partie dans les secrets
    { nom: "Armand Chassagne", alias: ["Chassagne", "Armand", "monsieur Chassagne"], titre: "ancien directeur du Service, associé du Cabinet", ou: "Luxembourg", faction: "service", age: 67, etat: "vivant" },
    { nom: "Laurent Vareilles", alias: ["Vareilles", "Laurent", "monsieur Vareilles"], titre: "associé gérant du Cabinet Vareilles-Dunoyer", ou: "Paris", faction: "service", age: 51, etat: "vivant" },
    { nom: "Bastien Orlhac", alias: ["Orlhac", "Bastien", "monsieur Orlhac", "l'intendant"], titre: "intendant de l'ancienne caserne", ou: "l'ancienne caserne", faction: "service", etat: "vivant" },
    { nom: "Yann Kerdilès", alias: ["Kerdilès", "Yann"], titre: "ancien coursier, interné sous un autre nom", ou: "la clinique de la colline", faction: "service", etat: "vivant" },
    { nom: "Agnès Deluchat", alias: ["Deluchat", "Agnès"], titre: "ancienne coursière", ou: "Trieste", faction: "service", etat: "mort" },
  ],

  divinites: [],

  peuples: [
    "Gens d'armes", "Gens de l'enquête", "Gens du chiffre", "Gens de l'argent", "Gens du monde", "Gens de passage",
    "Ancien parachutiste", "Logisticien militaire", "Enquêteur de police judiciaire", "Analyste de renseignement", "Informaticien de sécurité", "Technicien télécoms",
    "Expert-comptable judiciaire", "Banquier privé", "Interprète de conférence", "Journaliste ou chargé de communication", "Chauffeur routier", "Urgentiste",
    "Coursier", "Coursiers", "Coursière", "Coursières",
    // Classes
    "Chauffeur", "Filocheur", "Technicien", "Négociateur", "Infiltré", "Tireur", "Médecin", "Faussaire", "Analyste", "Garde du corps",
    // Sous-classes
    "Routier", "Convoyeur", "Filocheur de rue", "Observateur", "Télécoms", "Sécurité informatique", "Interprète", "Intermédiaire", "Couverture longue", "Entrée par la porte",
    "Tireur de position", "Tireur de proximité", "Médecin de passage", "Faussaire de papiers", "Faussaire de comptes", "Analyste de renseignement", "Enquêteur judiciaire",
    "Garde rapprochée", "Escorte",
    // Historiques
    "Parachutiste", "Logisticien", "Enquêteur", "Informaticien", "Comptable", "Banquier", "Journaliste",
  ],

  vocabulaire: [
    "Cellule Hermès", "la Cellule", "Cellule", "coursier", "coursiers", "coursière", "coursières", "Traitante", "pli", "plis", "Boîte", "Caisse", "couverture", "couvertures", "Empreinte",
    "Service", "DVL", "Direction de la Veille et des Liaisons", "Section de contrôle des services", "Section", "Partenaires", "Partenaire", "Ostrevent", "groupe Ostrevent", "Collectif Palimpseste", "Palimpseste",
    "Mercerie", "agence Aldenhove", "Aldenhove & Fils", "Aldenhove", "Café de la Tourette", "magasin 31", "Maasvlakte", "Joliette", "Ixelles", "bora", "euro", "euros", "centime", "centimes",
    "Noté", "Fiché", "Identifié", "Grillé", "se faire oublier", "brûler une couverture", "nettoyer une trace", "nettoyer", "brûler",
    "filature", "filatures", "filocheur", "planque", "repérage", "retrait", "opération", "préparation", "ordre", "délai", "interdiction", "budget",
    "pistolet semi-automatique", "pistolet à impulsion électrique", "matraque télescopique", "couteau de poche", "fusil de chasse", "cartouche", "cartouches", "chargeur", "marché noir",
    "gilet pare-balles", "gilet de chantier", "blouson renforcé", "manteau renforcé", "blouse renforcée", "casquette", "gants fins", "sac à dos",
    "téléphone jetable", "carte SIM", "ordinateur propre", "clé de chiffrement", "balise de suivi", "enregistreur discret", "brouilleur de poche", "kit de crochetage", "appareil photo à téléobjectif",
    "carte prépayée", "carte rechargeable", "espèces", "virement", "relevé bancaire", "distributeur", "pot-de-vin", "pots-de-vin", "consigne",
    "caméra", "caméras", "plaque d'immatriculation", "garde à vue", "avocat commis d'office", "mandat", "témoin", "témoins", "douane", "douanier", "douaniers", "contrôle aléatoire",
    "train", "TGV", "avion", "voiture de location", "poids lourd", "camion", "fourgon", "conteneur", "conteneurs", "grue", "ferry", "ferries", "terminal", "quai", "quais",
    "table de coupe", "double fond", "coffret", "coffre-fort", "coffre", "chemise cartonnée", "papier gris", "en-tête", "traduction assermentée", "traducteur assermenté",
    "Suzanne", "Mercadier", "Judith", "Aldebert", "Ettore", "Scalvini", "Gaël", "Tournemine", "Tessa", "Brandvold", "Hugo", "Lemarchand", "Gérard", "Josiane", "Pastorelli",
    "Joost", "Brinkhof", "Konrad", "Zumbrunn", "Dorian", "Meyssonnier", "Odile", "Maréchal", "Roux", "Armand", "Chassagne", "Laurent", "Vareilles", "Bastien", "Orlhac", "Yann", "Kerdilès", "Agnès", "Deluchat",
    "monsieur", "madame", "mademoiselle", "boulevard", "rue",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle.
  secrets: [
    "Cabinet Vareilles-Dunoyer", "Vareilles-Dunoyer", "le Cabinet", "du Cabinet", "au Cabinet", "au service du Cabinet", "associé du Cabinet", "associés du Cabinet",
    "Armand Chassagne", "Chassagne", "Laurent Vareilles", "Vareilles", "Dunoyer",
    "la Dissolution", "la dissolution de la DVL", "dissolution du Service", "décret du 28 mars 2019", "28 mars 2019", "décret non publié", "décret jamais publié",
    "contrat de conservation", "30 avril 2019", "préserver la mémoire du service",
    "Le Service n'existe plus", "le Service n'existe plus", "le Service est dissous", "la DVL est dissoute", 
    "la Collection", "La Collection", "Collection des dossiers", "dossiers sur des élus", "dossiers sur des juges", "dossiers sur des dirigeants",
    "le Rachat", "Le Rachat", "date limite du Rachat", "vente de la Collection", "consortium dirigé par un État étranger", "émissaire à Genève", "l'acheteur de la Collection",
    "le Coffre", "Le Coffre", "troisième étage de la caserne", "troisième étage de l'ancienne caserne", "disques non reliés au réseau", "archives de papier du Service",
    "Bastien Orlhac", "Orlhac", "Konrad Zumbrunn", "Zumbrunn", "Yann Kerdilès", "Kerdilès", "Agnès Deluchat", "Deluchat",
    "clinique de la colline", "interné sous un autre nom", "deux écartements de 2021",
    "lettre de 2019", "fin du contrat de prestation de l'agence", "coffret d'Aldenhove",
    "le Cabinet lit la Boîte", "serveur de la Boîte", "le serveur est au", "la faille est de confiance", "reçu en moins de deux minutes", "pièces jointes ouvertes avant le destinataire",
    "accusé de réception en juin 2019", "signé l'accusé de réception", "Suzanne sait que",
    "canal direct avec l'inspectrice", "canal direct avec Aldebert", "validée sans preuve", "validé sans preuve",
    "fonds spéciaux sans objet", "agents payés sans poste", "missions sans autorité", "commission interne de 2018",
    "les Écoutes", "Écoute de la Boîte", "Écoute de terrain", "une Écoute", "Écoutes",
    "trois paliers de preuve", "la Collection est complète", "fenêtre de trois mois",
  ],

  anachronismes: [
    // Rien de fantastique ni de science-fiction (la bible dit : rien de surnaturel)
    "sortilège", "sortilèges", "magicien", "magicienne", "sorcier", "sorcière", "fantôme", "fantômes", "malédiction", "vampire", "zombie", "zombies", "elfe", "elfes", "dragon", "orc", "grimoire", "potion", "enchantement",
    "hologramme", "téléportation", "vaisseau spatial", "pistolet laser", "rayon laser", "implant neural", "cyberware", "exosquelette", "voyage dans le temps",
    // Services, entreprises et personnes réels : la bible dit que tout est inventé
    "DGSE", "DGSI", "CIA", "FBI", "NSA", "MI6", "MI5", "Mossad", "KGB", "FSB", "GRU", "BND", "Europol", "Interpol", "Wikileaks", "Snowden", "Assange",
    "Poutine", "Macron", "Trump", "Biden", "Google", "Facebook", "Apple", "Amazon", "Microsoft", "WhatsApp", "Telegram", "Uber", "Tesla",
    // Marques d'armes : on dit « pistolet semi-automatique de 9 mm »
    "Glock", "Beretta", "Taser", "Kalachnikov", "Smith & Wesson",
  ],

  noms: NOMS_HERMES,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "Un pli demande de récupérer un coffret chez un traducteur assermenté d'Ixelles avant vendredi, six heures. La ligne du fond a sonné : celle qu'on ne décroche pas.", factions: ["service"] },
    { texte: "Un homme en parka fume devant un entrepôt de Trieste. Il attend une valise, et vous attendez que quelqu'un d'autre vienne la chercher.", factions: ["partenaires", "service"] },
    { texte: "Une inspectrice en costume sombre vous attend à la sortie d'une gare. Elle a une facture au nom d'une couverture que vous n'avez utilisée qu'une fois.", factions: ["section"] },
    { texte: "Un camion à vide recule sur un quai de Rotterdam. Le conducteur transporte une clé de chiffrement qu'un pli vous ordonne de copier.", factions: ["palimpseste", "service"] },
    { texte: "La patronne d'un bar de dockers de la Joliette a remis une enveloppe à la mauvaise personne et vous demande, sans vous regarder, de la reprendre avant qu'on l'ouvre.", factions: ["partenaires", "ostrevent"] },
    { texte: "Un chef d'équipe en blouson sombre propose un échange : son silence contre un document dans un coffre qu'il n'atteint pas.", factions: ["ostrevent"] },
    { texte: "Une porte-parole de Palimpseste vous donne rendez-vous à Berlin : elle a reçu une fuite qui nomme un coursier.", factions: ["palimpseste"] },
  ],

  cartes: {
    evenements: [
      { titre: "Le contrôle aléatoire", texte: "Deux douaniers en gilet fluo remontent le quai, regardent les valises, puis votre visage. L'un d'eux sourit à demi, comme s'il avait déjà son idée.", effet: "Tromperie ou Persuasion DD 13 pour passer sans fouille. Passer avec un faux document fait monter l'Empreinte de 1 ; une fouille qui trouve une arme ou 10 000 € ou plus en espèces est une garde à vue." },
      { titre: "La caméra du quai", texte: "Au-dessus de l'escalier, un dôme noir tourne lentement. Personne ne le regarde. Il vous a déjà tous les quatre.", effet: "Perception DD 13 pour la repérer avant d'être dessous. Si vous êtes filmés nettement dans une scène d'action, l'Empreinte monte de 1. Un technicien du groupe peut dire où elle regarde." },
      { titre: "L'attente en gare", texte: "Votre train a vingt minutes de retard. Un vigile fait le tour de la salle, une fois, deux fois. Un enfant pleure sur un banc.", effet: "Discrétion DD 12 pour ne pas se faire remarquer par le vigile. Une attente de plus d'une heure sans bouger fait baisser le risque de contrôle : le prochain contrôle aléatoire a un DD de moins 2." },
      { titre: "Le voisin qui note", texte: "À la fenêtre du deuxième, une silhouette tient un carnet. Elle écrit à chaque fois qu'une porte s'ouvre sur la rue.", effet: "Perception DD 12 pour le voir. Persuasion DD 13 pour qu'il oublie, ou un service rendu (un colis déposé). S'il parle à un policier, l'Empreinte monte de 1." },
      { titre: "La fuite d'eau", texte: "Une tache sombre s'étend au plafond de l'arrière-boutique. Le plombier de l'immeuble arrive dans dix minutes, avec sa caisse.", effet: "Il faut cacher ce qui est sur la table de coupe en moins de dix minutes (Escamotage DD 12), ou lui offrir une raison de ne pas entrer (Tromperie DD 13)." },
      { titre: "La ligne du fond", texte: "Dans l'agence, un téléphone fixe sonne à intervalles réguliers, sur un bureau où personne ne s'assied. Le vieux traducteur ne lève pas les yeux.", effet: "Quiconque décroche fait monter l'Empreinte de 1 : la ligne n'est pas à l'agence. Compter les sonneries : Investigation DD 13 pour noter l'intervalle." },
      { titre: "Le comptoir en zinc", texte: "À cinq heures, le bar ouvre. Un docker commande un café serré, un autre une anisette. La patronne essuie des verres sans regarder personne.", effet: "Persuasion DD 12 pour obtenir une information contre un verre. La patronne se souvient des visages : l'Empreinte monte de 1 si on laisse son vrai nom." },
      { titre: "La bora", texte: "Le vent tombe sur les quais comme une main. Les tôles claquent, les mouettes se plaquent contre les vitres, personne n'entend rien.", effet: "Avantage aux tests de Discrétion pour approcher un entrepôt. Désavantage aux tests de Perception qui reposent sur le son." },
      { titre: "Le scanner de la douane", texte: "Un conteneur bleu glisse sous un portique. Sur l'écran, un contour gris, des ombres. L'agent hausse un sourcil et s'arrête.", effet: "Un conteneur déclaré à la légère déclenche un contrôle sur 1 à 2 au d6. Investigation DD 14 pour savoir lequel passera sans être ouvert, ou 2 000 € à l'employé du port." },
      { titre: "Le salon boisé", texte: "Un petit bureau, du thé, une chemise cartonnée posée entre deux tasses. L'homme en face de vous regarde vos mains avant de regarder votre visage.", effet: "Intuition DD 14 pour deviner ce qu'il sait sur vous. Persuasion DD 13 pour qu'il touche à la chemise le premier ; un échec de 5 ou plus laisse une trace : l'Empreinte monte de 1." },
      { titre: "La barrière levée", texte: "À six heures, la barrière se lève. Un gardien boit son café dans un gobelet en carton. Un fourgon blanc entre en marche arrière dans un hangar.", effet: "Une plaque d'immatriculation notée à l'entrée fait monter l'Empreinte de 1. Perception DD 13 pour compter les gardiens et les caméras. Un badge de livraison se loue pour 200 €." },
      { titre: "Le contrôle en civil", texte: "Deux hommes en blouson attendent à la sortie du ferry, les mains dans les poches. Ils n'ont l'air de rien, et ils regardent tout le monde.", effet: "Perception DD 14 pour les repérer avant eux. Désavantage à Tromperie si vous portez des sacs identiques. Les contrôles en civil se font sur les quais de la Joliette et aux gares frontalières." },
    ],
    objets: [
      { titre: "Un téléphone jetable", texte: "Un petit boîtier noir, une carte SIM neuve, aucun nom sur la boîte. Dans un sac plastique, un chargeur déjà usé.", effet: "Il ne dit rien de toi tant que tu ne l'utilises pas avec ton nom. Il vaut 30 à 50 € ; le jeter après trois jours. Appeler un proche avec fait monter l'Empreinte de 1." },
      { titre: "Une balise de suivi", texte: "Un boîtier de la taille d'une boîte d'allumettes, un aimant au dos, une pile qui tient une semaine.", effet: "Escamotage DD 12 pour la poser sans être vu, Investigation DD 14 pour la trouver. Elle vaut 80 €. Le MJ te dit où va le véhicule chaque soir." },
      { titre: "Un pli sur papier gris", texte: "Une feuille pliée en trois, un numéro à quatre chiffres, quelques lignes : un objectif, un délai, une interdiction, un budget.", effet: "On le lit une fois, on le détruit. Le garder laisse une pièce à conviction à quiconque fouille votre sac. Un pli perdu est un pli raté." },
      { titre: "Une carte rechargeable", texte: "Une carte bancaire sans nom de banque visible, au nom d'une couverture. Au dos, un numéro de téléphone qu'on ne compose pas.", effet: "Elle contient le budget du pli. Retirer plus de 500 € le même jour est impossible. La payer plus de 1 000 € d'un coup fait monter l'Empreinte de 1." },
      { titre: "Un kit de crochetage", texte: "Un étui de cuir fin, douze lames, deux tendeurs, un petit miroir. Une odeur de graisse.", effet: "Maîtrise d'outils de cambrioleur. Il vaut 90 €. Crocheter une serrure ordinaire en dix secondes (Escamotage DD 12). Il ne passe pas à une frontière." },
      { titre: "Un enregistreur discret", texte: "Un stylo épais, une prise USB sous le capuchon, huit heures de son.", effet: "Il enregistre une conversation à 5 m. Il vaut 120 €. Un balayage le trouve (Investigation DD 14). Un enregistrement obtenu sans accord est un délit, et une pièce à conviction contre vous." },
      { titre: "Une matraque télescopique", texte: "Un tube noir de vingt centimètres qui se déploie d'un coup de poignet. Le grip est usé.", effet: "1d4 contondants, légère. Elle vaut 30 €. Son port est interdit sans motif légitime : un contrôle qui la trouve vous conduit au commissariat." },
      { titre: "Un gilet de chantier", texte: "Orange fluo, des bandes réfléchissantes, un nom de société effacé sur le dos. Avec une casquette, on a l'air de quelqu'un qui doit être là.", effet: "Avantage au premier test de Tromperie de la scène pour entrer dans un chantier, un entrepôt ou un parking. Il vaut 25 € avec la casquette." },
      { titre: "Une clé de chiffrement", texte: "Un petit objet noir sans marque, un trou pour un cordon. La Boîte ne s'ouvre pas sans.", effet: "Elle ouvre la Boîte, rien d'autre. La perdre, c'est perdre le canal : il faut passer par la Traitante, qui en fait une autre en deux jours. Elle vaut 60 €." },
      { titre: "Un pistolet semi-automatique de 9 mm", texte: "Noir, froid, plus lourd qu'on croit. Un numéro de série limé, un chargeur de quinze cartouches.", effet: "1d10 perforants, portée 15/45 m, quinze coups. Illégal : 1 500 à 3 000 € au marché noir. Une scène où l'on tire fait monter l'Empreinte de 2, plus 1 par blessé grave ou mort. La police est prévenue." },
      { titre: "Un appareil photo à téléobjectif", texte: "Un boîtier lourd, un objectif long comme l'avant-bras, un sac de toile qui ressemble à celui d'un photographe de mariage.", effet: "Photographier à 100 m un visage assez net pour le reconnaître. Il vaut 400 €. Les photos sont une pièce, pas une preuve : le MJ dit qui voudrait les voir." },
    ],
  },

  campagne: {
    jauge: {
      nom: "la Collection",
      monte: true,
      depart: 12,
      max: 100,
      seuils: [
        { valeur: 25, effet: "Le Cabinet place un homme dans l'entourage d'un ministre. Les plis deviennent plus précis, la Caisse paie mieux, Suzanne a l'air plus fatiguée." },
        { valeur: 50, effet: "Première affaire publique : un élu démissionne après la publication de pièces que la Cellule a prises sans savoir à quoi elles servaient. Les Partenaires rompent un canal." },
        { valeur: 75, effet: "Le Cabinet met la Cellule à l'épreuve : un pli demande de nuire à un innocent. Palimpseste menace de publier ce que la Cellule a fait. Suzanne se casse." },
        { valeur: 100, effet: "La Collection est complète. Le Cabinet fixe la vente à la plus proche des deux dates : décembre 2027 ou trois mois après 100. En attendant, il verrouille le Coffre : ménage, renvois, mort de témoins. Les joueurs ont une fenêtre de trois mois. Fin de campagne : qui détient les pièces, qui les a remises à qui, et ce que la Cellule a payé pour cela." },
      ],
      // Ici la jauge monte : « remontees » dit ce qui la fait grandir, « descentes » ce qui la fait reculer.
      remontees: [
        { action: "Une mission menée à bien selon le pli (une fois par séance au plus ; la Collection ne gagne jamais plus de 8 par séance)", gain: 4 },
        { action: "Une mission menée à moitié", gain: 2 },
        { action: "Les joueurs remettent à la Boîte des données sur une tierce personne : photos, documents, enregistrements (une fois par séance au plus)", gain: 3 },
        { action: "La Cellule neutralise un concurrent du Cabinet : un membre de Palimpseste exposé, un cadre d'Ostrevent arrêté", gain: 5 },
        { action: "Chaque mois de jeu, quoi qu'il arrive", gain: 1 },
      ],
      descentes: [
        { action: "Une mission refusée ou sabotée", perte: 3 },
        { action: "Un objet demandé est gardé hors de la Boîte", perte: 6 },
        { action: "Une preuve est remise à un organe extérieur : la Section, un juge, un journaliste (une fois par palier de preuve)", perte: 10 },
      ],
    },
    reserve: {
      nom: "Écoutes",
      max: ECOUTES_MAX,
      regle: REGLE_DES_ECOUTES,
    },
    accroches: [
      // Niveaux 1 à 4 : premiers plis (la séance 1, le coffret d'Aldenhove, est décrite au chapitre 11 de la bible)
      { titre: "La valise de Trieste", niveaux: [1, 4], factions: ["partenaires", "service"], texte: "Remettre une valise à un homme au magasin 31 ; Scalvini le suit et veut savoir ce qu'elle contient. Ouvrir, c'est rompre le pli ; ne pas ouvrir, c'est transporter ce qu'on ignore." },
      { titre: "Le déménagement de Marseille", niveaux: [1, 4], factions: ["service"], texte: "Vider en une nuit l'appartement d'un ancien archiviste du Service, mort la semaine dernière, avant l'huissier. Les cartons contiennent des relevés bancaires et un album de photos. Tout rapporter comme le pli le demande, ou laisser l'album à la fille." },
      { titre: "Le cadre fatigué", niveaux: [1, 4], factions: ["ostrevent"], texte: "Avertissement de contenu : suicide, à discuter avant la séance. Filer un directeur financier de Rotterdam ; il va se jeter d'un pont. C'est l'homme de la fausse accusation de 2024. Le sauver révèle la Cellule, le laisser clôt le pli." },
      { titre: "Les notes de frais", niveaux: [1, 4], factions: ["section", "service"], texte: "Une inspectrice demande à rencontrer un coursier ; elle a une facture au nom d'une couverture. Aider la Section, c'est trahir le Service." },
      { titre: "Le téléphone du chauffeur", niveaux: [1, 4], factions: ["palimpseste", "service"], texte: "Un chauffeur de camion transporte une clé de chiffrement pour Palimpseste ; le pli ordonne de la copier. Copier, c'est exposer des militants ; refuser, c'est désobéir." },
      // Niveaux 5 à 10 : les motifs
      { titre: "La banque de Genève", niveaux: [5, 10], factions: ["service", "ostrevent"], texte: "Récupérer une chemise dans un coffre ; le gestionnaire exige un code que la Traitante ne donne pas. La chemise contient des photos d'un élu en réunion avec un client d'Ostrevent." },
      { titre: "Le bar de la Joliette", niveaux: [5, 10], factions: ["partenaires", "ostrevent"], texte: "Josiane remet à un Partenaire une enveloppe qui n'est pas la bonne ; elle demande à la Cellule de la reprendre avant qu'il ne l'ouvre. L'enveloppe contient la liste des clients d'Ostrevent." },
      { titre: "L'hôtel de la gare", niveaux: [5, 10], factions: ["ostrevent"], texte: "Tournemine propose un échange : son silence contre un document dans un coffre qu'il n'atteint pas. Accepter, c'est travailler pour un concurrent." },
      { titre: "La journaliste de Berlin", niveaux: [5, 10], factions: ["palimpseste"], texte: "Brandvold offre une rencontre à la Cellule ; elle a reçu une fuite qui nomme un coursier. Mentir à une journaliste ou avouer." },
      { titre: "Le plomb", niveaux: [5, 10], factions: ["service", "section"], texte: "Un pli demande de poser un micro chez un juge de Bruxelles ; le juge a un dossier sur la Section. Obéir ou prévenir." },
      // Niveaux 11 à 16 : le Coffre
      { titre: "La caserne", niveaux: [11, 16], factions: ["service"], texte: "La Cellule doit livrer un fourgon à l'ancienne caserne ; le chauffeur dit qu'il a déjà fait le trajet douze fois. Que contient le fourgon ?" },
      { titre: "Le contrat", niveaux: [11, 16], factions: ["section", "ostrevent"], texte: "Aldebert a la trace d'un notaire de Genève qui a enregistré le contrat de conservation ; il faut le copier. Le notaire est un client d'Ostrevent." },
      { titre: "Le deuxième pli", niveaux: [11, 16], factions: ["partenaires", "service"], texte: "Scalvini donne à la Cellule une demande officielle restée sans réponse ; la Traitante refuse de la transmettre. Choisir entre Suzanne et la vérité." },
      { titre: "Le disparu", niveaux: [11, 16], factions: ["service"], texte: "Yann Kerdilès, interné sous un autre nom dans une clinique privée de Trieste, demande à un coursier de le sortir ; Vareilles veut qu'il y reste. Qui est prêt à le protéger ?" },
      { titre: "L'enquête de la presse", niveaux: [11, 16], factions: ["palimpseste", "ostrevent"], texte: "Palimpseste a une pièce authentique sur Ostrevent mais l'a obtenue par un vol ; la publier ruine un homme, la retarder tue le sujet. La Cellule la transmet ou la reprend." },
      // Niveaux 17 à 20 : le Rachat
      { titre: "L'acheteur", niveaux: [17, 20], factions: ["service"], texte: "Un émissaire d'un État étranger arrive à Genève ; il veut voir un échantillon. Voler l'échantillon, c'est prouver au Cabinet que la Cellule sait." },
      { titre: "Le dernier directeur", niveaux: [17, 20], factions: ["service"], texte: "Chassagne demande à la Cellule de le protéger lors de son départ de Luxembourg ; il offre en échange le décret et un pardon." },
      { titre: "La Traitante", niveaux: [17, 20], factions: ["service", "section"], texte: "Suzanne se dénonce à Aldebert ; le Cabinet a besoin d'elle morte. La protéger, c'est tenir tête à des gens qui ont déjà tué." },
      { titre: "Le troisième étage", niveaux: [17, 20], factions: ["palimpseste"], texte: "Brandvold propose de publier la Collection entière en ligne ; Hugo Lemarchand s'y oppose, des milliers de personnes y sont, dont des innocents." },
      { titre: "Le Rachat", niveaux: [17, 20], factions: ["service", "section", "partenaires", "ostrevent", "palimpseste"], texte: "Détruire la Collection (on perd la preuve, et les innocents sont sauvés), la remettre à la Section (l'État la garde), la publier (le public sait, des vies sont détruites), ou la revendre soi-même, par Tournemine, à un autre acheteur (le monde reste comme avant, avec un autre propriétaire)." },
    ],
  },
};
