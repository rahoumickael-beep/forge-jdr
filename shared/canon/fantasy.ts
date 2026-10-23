// Canon d'Aubreterre (fantasy), tiré de la bible du monde (content/aubreterre/lore.md)
// et des noms que la bibliothèque et le bestiaire ont ajoutés depuis. Ajouter un nom ici est une décision :
// on la note dans docs/journal-de-production.md.
import type { Canon } from "./types";

export const AUBRETERRE: Canon = {
  genre: "fantasy",
  monde: "Aubreterre",
  continent: "Pallène",
  capitale: "Aube-Close",
  calendrier: { long: "du Couronnement", court: "du Glas", debutCourt: 614, anDeJeu: 621, saison: "printemps" },

  chronologie: [
    { an: 0, quoi: "Ostral s'assoit sur le bloc de basalte de la plaine et dit « Ici. » ; début du Couronnement." },
    { an: 511, quoi: "Naissance de Gédéon Pell, futur Premier Scribe." },
    { an: 551, quoi: "Naissance de Cyprien, fils de cirier du Val Cierge." },
    { an: 563, quoi: "Naissance de Hersende, dernière enfant vivante d'Ostral et d'une mortelle." },
    { an: 609, quoi: "Naissance d'Ysé dans les faubourgs d'Aube-Close." },
    { an: 614, quoi: "Le Glas : les cloches sonnent neuf cents coups, Ostral meurt sur le Trône. An 0 du Glas." },
    { an: 615, quoi: "Début de la guerre des héritiers (an 1 du Glas)." },
    { an: 616, quoi: "Les fossoyeurs d'Aube-Close fondent la Confrérie du Dernier Clou (an 2 du Glas)." },
    { an: 616, quoi: "Odile Varlet meurt noyée et revient (an 2 du Glas)." },
    { an: 618, quoi: "Saint Ruben le Rappelé est canonisé en secret (an 4 du Glas)." },
    { an: 618, quoi: "Les mages de Hersende lancent des tempêtes de feu : le plus gros creux du registre des Peseurs (an 4 du Glas)." },
    { an: 621, quoi: "Printemps de l'an 7 du Glas : année de jeu." },
  ],

  regions: [
    {
      nom: "Le Couronnement",
      situation: "la plaine du centre, au creux de la paume",
      paysage: "blé, colza, canaux droits ; Aube-Close et ses trois enceintes",
      gens: ["Couronnais", "fonctionnaires", "juges", "boutiquiers"],
      peur: "la Marche, et le jour où la couronne quittera la tête du mort",
      lieuDeRencontre: "les faubourgs d'Aube-Close",
      lieux: ["Aube-Close", "la Rotonde du Trône", "le Trône", "les fossés de chaux", "la tour des Peseurs", "les archives de la Chancellerie", "l'ossuaire d'Aube-Close"],
    },
    {
      nom: "Les Marches de Fer",
      situation: "le nord",
      paysage: "collines rases, bruyère, vent ; une ligne de forts de la mer à la montagne",
      gens: ["Marchois", "légionnaires", "demi-orcs légionnaires"],
      peur: "les vieux champs de bataille, d'où remontent des légions d'os",
      lieuDeRencontre: "un fort du Mur des Neuf Cents",
      lieux: ["le Mur des Neuf Cents", "Fort-Brac"],
    },
    {
      nom: "Le Val Cierge",
      situation: "le centre-est, pays de l'Église",
      paysage: "vallées douces, vignes en terrasses, abbayes blanches, ruches",
      gens: ["moines", "vignerons", "ciriers", "frères du Silence"],
      peur: "le jour où les grilles des cimetières céderont, et les morts bénis",
      lieuDeRencontre: "une abbaye du Val Cierge",
      lieux: ["Clairfont"],
    },
    {
      nom: "Les Noyes",
      situation: "les tourbières de l'ouest",
      paysage: "eau noire, brume, passerelles de planches, maisons sur pilotis",
      gens: ["Noyois", "coupeurs de tourbe", "pêcheurs d'anguilles", "petites gens tourbiers"],
      peur: "les Noyés, morts de plusieurs siècles qui sortent intacts de l'eau",
      lieuDeRencontre: "les tourbières des Noyes",
      lieux: ["Gué-Saulnier", "Saint-Ferréol-des-Joncs", "le Champ des Mottes", "la grande passerelle des Noyes"],
    },
    {
      nom: "La Côte des Sels",
      situation: "le sud-ouest",
      paysage: "marais salants blancs et roses, pyramides de sel, lagunes",
      gens: ["sauniers", "armateurs", "petites gens sauniers", "Ombrelles"],
      peur: "la pénurie de sel, et les inspecteurs de l'Église",
      lieuDeRencontre: "les salines de Port-Lagune",
      lieux: ["Port-Lagune"],
    },
    {
      nom: "Les Monts Ossiers",
      situation: "l'est",
      paysage: "montagnes de calcaire blanc en vertèbres, galeries naines, mélèzes, torrents verts",
      gens: ["nains de Plomb", "nains Ossuaires"],
      peur: "ce qui gratte derrière les portes de plomb, et le déshonneur",
      lieuDeRencontre: "un ossuaire muré des Monts Ossiers",
      lieux: ["les portes de plomb"],
    },
    {
      nom: "La Brune",
      situation: "la forêt du nord-est",
      paysage: "chênes et charmes larges comme des maisons, clairières rondes où rien ne pousse",
      gens: ["elfes des Chênes", "elfes de Mémoire"],
      peur: "les clairières rondes, et les arbres qui rendent leurs morts",
      lieuDeRencontre: "une clairière ronde de la Brune",
      lieux: ["les clairières rondes"],
    },
    {
      nom: "Le Verre-Rouge",
      situation: "le désert du sud",
      paysage: "dunes rouges, plaques de verre noir qui chantent, oasis fortifiées, ruines d'avant l'Empire",
      gens: ["clans nomades", "caravaniers", "demi-orcs du Verre"],
      peur: "les nuits où le verre chante sans vent, et ce qu'on voit dessous",
      lieuDeRencontre: "une oasis du Verre-Rouge",
      lieux: [],
    },
  ],
  autresLieux: ["Le Dessous", "le puits", "Partout"],

  factions: [
    { id: "hersende", nom: "Les légions de Hersende", alias: ["légions", "légion", "Générale"], but: "prendre Aube-Close et brûler les morts par décret", signe: "le manteau rouge", penche: "elle-même", membres: ["légionnaire", "bleu", "Porte-Aigle"] },
    { id: "eglise", nom: "L'Église d'Ostral", alias: ["Église", "Grand Prêtre", "Garde du Seuil", "inquisiteur de la Cire", "vicaire"], but: "que l'Église hérite du Trône et que la couronne reste sur le corps", signe: "la cire au poignet", penche: "Cyprien" },
    { id: "yse", nom: "Les pèlerins de l'Enfant", alias: ["Enfant", "pèlerins", "Mains-Nues"], but: "protéger Ysé", signe: "pieds nus, la main gauche en avant", penche: "Ysé" },
    { id: "confrerie", nom: "La Confrérie du Dernier Clou", alias: ["Confrérie", "cloueur", "cloueuse", "Dernier Clou"], but: "que les morts restent couchés", signe: "un clou à tête carrée à l'oreille gauche", penche: "Hersende, et Ysé sans le dire", membres: ["apprenti", "compagnon", "maître-cloueur"] },
    { id: "hanse", nom: "La Hanse du Sel", alias: ["Hanse", "Ombrelles", "contremaître"], but: "que la guerre dure assez pour que le sel reste cher", signe: "une pincée de sel dans la poignée de main", penche: "Hersende et Cyprien à la fois" },
    { id: "peseurs", nom: "Les Peseurs", alias: ["Peseur", "Peseuse", "tour sans porte"], but: "mesurer ce que coûte la magie", signe: "une balance de laiton en pendentif", penche: "contre l'Église, vers Ysé" },
    { id: "veilleuses", nom: "Les Veilleuses", alias: ["Veilleuse", "Plus Ancienne"], but: "veiller les morts, soigner, protéger Ysé", signe: "une lanterne au verre bleu", penche: "Ysé" },
    { id: "chancellerie", nom: "La Chancellerie Muette", alias: ["Chancellerie", "scribe", "Premier Scribe"], but: "faire respecter le Code et garder le secret", signe: "le pouce droit taché d'encre violette", penche: "la régence de Cyprien, à contrecœur" },
    { id: "rendus", nom: "Les Rendus", alias: ["Rendu", "Rendue", "Revenu"], but: "être reconnus comme des personnes", signe: "un ruban noir au poignet gauche", penche: "qui leur promettra des droits" },
    { id: "attendants", nom: "Les Attendants", alias: ["Attendant", "passeur"], but: "pousser les morts sur la Marche pour que le Dieu se relève", signe: "un bracelet de jonc tressé", penche: "la voix" },
    { id: "elfes", nom: "Les elfes de la Brune", alias: ["elfes", "elfe"], but: "se taire sur ce dont ils se souviennent", signe: "la peau couleur d'écorce", penche: "personne" },
    { id: "nains", nom: "Les nains des Ossiers", alias: ["nains", "nain"], but: "rouvrir un jour leurs ossuaires", signe: "une pierre plate au cou, gravée des ancêtres", penche: "personne" },
  ],

  figures: [
    { nom: "Ostral", alias: ["le Dieu-Empereur", "le Dieu"], titre: "Dieu-Empereur, mort sur son trône", ou: "la Rotonde du Trône", etat: "dieu" },
    { nom: "Gorvan", alias: ["le Jumeau", "le Frère du Dessous", "le Mangeur", "l'Autre"], titre: "jumeau d'Ostral, scellé sous le Trône", ou: "Le Dessous", etat: "dieu" },
    { nom: "Hersende", alias: ["la Générale"], titre: "la Générale, dernière enfant d'Ostral", ou: "Les Marches de Fer", faction: "hersende", age: 58, etat: "vivant" },
    { nom: "Cyprien", alias: ["le Grand Prêtre"], titre: "Grand Prêtre", ou: "Aube-Close", faction: "eglise", age: 70, etat: "vivant" },
    { nom: "Ysé", alias: ["l'Enfant"], titre: "l'Enfant qui calme les morts", ou: "Le Val Cierge", faction: "yse", age: 12, etat: "vivant" },
    { nom: "Gédéon Pell", alias: ["Maître Gédéon Pell", "le Premier Scribe"], titre: "Premier Scribe de la Chancellerie Muette", ou: "Aube-Close", faction: "chancellerie", age: 110, etat: "vivant" },
    { nom: "Odile Varlet", alias: ["Dame Odile Varlet"], titre: "porte-parole des Rendus", ou: "Aube-Close", faction: "rendus", etat: "rendu" },
    { nom: "Thiébaut Mainferrée", alias: ["le Connétable d'os"], titre: "connétable d'une légion morte", ou: "Les Marches de Fer", etat: "mort" },
    { nom: "Amarante", alias: ["la Reine sous le Sel"], titre: "reine de la Côte d'avant l'Empire, embaumée au sel", ou: "La Côte des Sels", etat: "mort" },
    { nom: "Le Roi des Noyes", titre: "Grand Mort des tourbières", ou: "Les Noyes", etat: "mort" },
    // Ce que rend la tourbe (bibliothèque)
    { nom: "Bastienne Crolle", titre: "maîtresse-cloueuse de la loge de Saint-Ferréol", ou: "Saint-Ferréol-des-Joncs", faction: "confrerie", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Colin Ferrat", alias: ["Colin"], titre: "apprenti cloueur", ou: "Gué-Saulnier", faction: "confrerie", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Hubert Lescot", alias: ["Lescot"], titre: "passeur de Gué-Saulnier, Attendant", ou: "Gué-Saulnier", faction: "attendants", age: 50, etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Maëlle", titre: "femme de Lescot, noyée il y a deux hivers", ou: "le Champ des Mottes", etat: "mort", scenario: "bib-fantasy-tourbe" },
    { nom: "Jacquet", titre: "neveu de Lescot", ou: "Gué-Saulnier", faction: "attendants", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Odon Brasque", alias: ["Brasque", "le sergent Brasque"], titre: "sergent recruteur de Hersende", ou: "Gué-Saulnier", faction: "hersende", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Anthelme Gaudru", alias: ["Gaudru", "le vicaire Gaudru", "Frère Anthelme Gaudru"], titre: "vicaire envoyé par Cyprien", ou: "Gué-Saulnier", faction: "eglise", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "Mère Gisle", alias: ["Gisle"], titre: "vieille de la Mère Tourbe, lit l'ancienne langue", ou: "Gué-Saulnier", etat: "vivant", scenario: "bib-fantasy-tourbe" },
    { nom: "L'Aïeul", titre: "chef des Noyés de la roselière", ou: "Gué-Saulnier", etat: "mort", scenario: "bib-fantasy-tourbe" },
    { nom: "Pépin", titre: "fils du tonnelier, neuf ans, entend une dame la nuit", ou: "Gué-Saulnier", age: 9, etat: "vivant", scenario: "bib-fantasy-tourbe" },
  ],

  divinites: [
    { nom: "Ostral", alias: ["le Dieu-Empereur"], domaines: ["Ordre", "Lumière", "Guerre"], symbole: "une porte fermée sous une couronne" },
    { nom: "Sainte Mauve des Lavandières", alias: ["Sainte Mauve"], domaines: ["Vie"], symbole: "un battoir de bois" },
    { nom: "Saint Brac le Forgeron", alias: ["Saint Brac"], domaines: ["Forge", "Guerre"], symbole: "un clou à tête carrée" },
    { nom: "Le Borgne Sévin", alias: ["Sévin"], domaines: ["Savoir"], symbole: "un œil fermé à l'encre violette" },
    { nom: "La Dame des Carrefours", domaines: ["Ruse"], symbole: "deux chemins qui se croisent" },
    { nom: "La Mère Tourbe", domaines: ["Nature", "Tempête"], symbole: "une motte de tourbe tenue à deux mains" },
    { nom: "Saint Ruben le Rappelé", alias: ["Saint Ruben"], domaines: ["Tombe"], symbole: "un ruban noir" },
  ],

  peuples: [
    "Humains", "Couronnais", "Marchois",
    "Elfes de la Brune", "Elfe des Chênes", "Elfe de Mémoire",
    "Nains des Ossiers", "Nain de Plomb", "Nain Ossuaire",
    "Petites gens", "Tourbier", "Saunier",
    "Demi-orcs", "Demi-orc Légionnaire", "Demi-orc du Verre",
    "Revenus", "Revenu Récent", "Os-Sec",
    "Sang-Doré", "Lignée Claire", "Lignée Grise",
    "Noyois",
  ],

  vocabulaire: [
    // Le monde et son histoire
    "le Glas", "la Marche", "le Code", "le Code d'Ostral", "l'Empire", "le Trône", "la couronne de fer", "le sceau", "le Sceau", "le Souffle",
    "l'ancienne langue", "le pallénien", "la langue céleste", "Dieu", "Église", "Couronnement",
    // Les morts
    "Levé", "Levés", "Noyé", "Noyés", "Noyée", "Pleureur", "Pleureurs", "Porte-Voix", "Grand Mort", "Grands Morts", "Cirée", "Cirée de la Rotonde",
    "Main-Nue", "Mains-Nues", "Sonneur du Glas", "Pris-dans-le-chêne", "la Fossoyeuse", "Colonne de la Marche", "Écho de verre", "Échos", "les Dents", "le Bâillement",
    // Mécaniques du monde
    "Murmure", "Murmures", "la jauge du Sceau", "Cicatrice du Dessous", "la veillée",
    // Titres et ordres secondaires
    "Garde du Seuil", "Seuil", "Ombrelles", "frères du Silence", "Silence du Val", "Plus Ancienne", "Grand Prêtre", "Générale", "Premier Scribe", "Main du Code",
    // Objets nommés
    "la Grenouille",
  ],

  secrets: ["Gorvan", "Frère du Dessous", "le Mangeur", "Mon frère attend", "jumeau scellé"],

  anachronismes: [
    "fusil", "pistolet", "revolver", "mousquet", "poudre à canon", "électricité", "électrique", "téléphone", "camion",
    "locomotive", "usine", "plastique", "béton", "goudronné", "ampoule", "montre-bracelet", "lunettes de soleil", "photographie",
    "journal imprimé", "minute près", "OK", "stress",
  ],

  noms: {
    prenoms: ["Bastienne", "Hubert", "Maëlle", "Colin", "Gaudry", "Ombeline", "Jacquet", "Perrine", "Thiébaut", "Aubin", "Gisle", "Ferréol", "Odile", "Brunissende", "Enguerrand", "Mahaut", "Guérin", "Isaure"],
    // Les noms de famille des figures (Crolle, Lescot, Varlet, Pell, Mainferrée…) n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
    familles: [" Clouet", " Saulnier", " Tourbier", " de Gué", " Cirier", " Ravel", " Fosseux", " Marchois", " Corbin", " Mortemer", " Sauvelet", " Bourrache", " Lattier"],
  },

  accroches: [
    { texte: "Un apprenti cloueur n'est pas revenu d'un village sur pilotis.", factions: ["confrerie"] },
    { texte: "Les morts d'un cimetière du Val se sont agenouillés devant l'autel avant de partir vers l'est, et l'Église veut qu'on se taise.", factions: ["eglise"] },
    { texte: "Une légion de Hersende réquisitionne le sel d'un village qui en a besoin pour ses morts.", factions: ["hersende", "hanse"] },
    { texte: "Un Revenu demande qu'on retrouve la personne qui l'a vu revenir.", factions: ["rendus"] },
    { texte: "Un scribe de la Chancellerie propose de l'or pour un rouleau volé.", factions: ["chancellerie"] },
  ],
};
