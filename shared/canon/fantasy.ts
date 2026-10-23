// Canon d'Aubreterre (fantasy), tiré de la bible du monde (content/aubreterre/lore.md)
// et des noms que la bibliothèque et le bestiaire ont ajoutés depuis. Ajouter un nom ici est une décision :
// on la note dans docs/journal-de-production.md.
import { NOMS_AUBRETERRE } from "./fantasy-table";
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

  secrets: ["Gorvan", "Frère du Dessous", "le Mangeur", "du Mangeur", "Mon frère attend", "jumeau scellé"],

  anachronismes: [
    "fusil", "pistolet", "revolver", "mousquet", "poudre à canon", "électricité", "électrique", "téléphone", "camion",
    "locomotive", "usine", "plastique", "béton", "goudronné", "ampoule", "montre-bracelet", "lunettes de soleil", "photographie",
    "journal imprimé", "minute près", "OK", "stress",
  ],

  noms: NOMS_AUBRETERRE,

  accroches: [
    { texte: "Un apprenti cloueur n'est pas revenu d'un village sur pilotis.", factions: ["confrerie"] },
    { texte: "Les morts d'un cimetière du Val se sont agenouillés devant l'autel avant de partir vers l'est, et l'Église veut qu'on se taise.", factions: ["eglise"] },
    { texte: "Une légion de Hersende réquisitionne le sel d'un village qui en a besoin pour ses morts.", factions: ["hersende", "hanse"] },
    { texte: "Un Revenu demande qu'on retrouve la personne qui l'a vu revenir.", factions: ["rendus"] },
    { texte: "Un scribe de la Chancellerie propose de l'or pour un rouleau volé.", factions: ["chancellerie"] },
  ],
  cartes: {
    evenements: [
      { titre: "Le glas du hameau", texte: "Les cloches d'un village voisin sonnent seules, trois coups, au milieu de la nuit. Personne n'est monté au clocher.", effet: "Avant l'aube, les morts de la semaine de ce village sont debout et marchent vers l'est." },
      { titre: "La file des Levés", texte: "Une file de morts traverse la route, l'un derrière l'autre, du même pas, tout droit vers Aube-Close.", effet: "Ils ne s'en prennent qu'à ce qui leur barre le chemin. Les laisser passer coûte une heure.", image: "carte-evenement-file-des-leves" },
      { titre: "Barrage de la Garde du Seuil", texte: "Une chaîne en travers du pont, deux gardes en manteau blanc et un registre. On note les noms, on fouille les sacs.", effet: "Un laissez-passer de la Chancellerie ouvre la chaîne. Sinon : payer, mentir, ou faire le tour par le gué.", image: "carte-evenement-barrage" },
      { titre: "Les recruteurs", texte: "Un sergent des légions de Hersende fait aligner les hommes valides d'un hameau devant la grange. Les mères regardent par les fenêtres.", effet: "Les personnages sont comptés comme valides. Le sergent n'aime pas qu'on discute.", image: "carte-evenement-recruteurs" },
      { titre: "Les pèlerins de l'Enfant", texte: "Un camp de pèlerins dans la boue, des centaines de feux. On dit que l'Enfant est passée ici avant-hier, et qu'aucun mort ne s'est relevé depuis.", effet: "Une nuit au camp est sûre. On y apprend où l'Enfant est allée, et qui la suit.", image: "carte-evenement-pelerins" },
      { titre: "Le sel a triplé", texte: "Au bourg, le saunier de la Hanse affiche un prix trois fois plus haut que la semaine passée. Une femme pleure devant l'étal, son mari mort sur une brouette.", effet: "Le sel coûte le triple jusqu'à la prochaine ville. Celui de l'étal est coupé de craie.", image: "carte-evenement-sel" },
      { titre: "La veillée inachevée", texte: "Une Veilleuse veille un mort depuis deux nuits et ne tient plus debout. Il manque la troisième.", effet: "Quelqu'un doit tenir la lanterne jusqu'à l'aube, ou clouer le mort.", image: "carte-evenement-veillee" },
      { titre: "Les faux clous", texte: "Un colporteur vend des clous à mort pour moitié prix. Ils plient sous l'ongle.", effet: "Un mort cloué avec ces clous se relève quand même, la nuit suivante.", image: "carte-evenement-faux-clous" },
      { titre: "Un Rendu frappe à la porte", texte: "Un homme pâle, un ruban noir noué au poignet gauche, demande à dormir dans la grange. Il dit qu'il n'a pas faim.", effet: "Le village veut le clouer. Les Rendus se souviendront de qui l'a aidé.", image: "carte-evenement-rendu" },
      { titre: "Les Attendants", texte: "Au bord de la route, des gens couchés en rang, les mains croisées, un bracelet de jonc tressé au poignet. L'un d'eux respire encore.", effet: "Il veut rejoindre la Marche. Le sauver, c'est le contrarier.", image: "carte-evenement-attendants" },
      { titre: "L'inquisiteur de la Cire", texte: "Un inquisiteur de la Cire et ses hommes fouillent le cimetière. Ils cherchent qui a brûlé un mort, contre la loi de l'Église.", effet: "Quelqu'un ici l'a fait, par pitié. L'inquisiteur pend à l'aube s'il trouve.", image: "carte-evenement-inquisiteur" },
      { titre: "Une voix dans le sommeil", texte: "Cette nuit, l'un de vous entend en dormant la voix d'un mort qu'il a aimé. Elle lui dit où est le danger, et c'est vrai.", effet: "Le renseignement est exact. La voix reviendra, et elle demandera quelque chose.", image: "carte-evenement-voix" },
    ],
    objets: [
      { titre: "Marteau en fer froid", texte: "Forgé à la main par un compagnon de la Confrérie, le manche noirci de goudron. Il pèse plus lourd qu'il n'en a l'air.", effet: "1d4 dégâts radiants de plus contre un mort-vivant, une fois par tour.", image: "carte-marteau-fer-froid" },
      { titre: "Sachet de sel bénit", texte: "Une pincée de sel blanc dans une toile cousue, bénie au Val Cierge. Ça sent la cire et la mer.", effet: "Dans la bouche d'un mort, il l'empêche de se relever.", image: "carte-sel-benit" },
      { titre: "Clous à tête carrée", texte: "Neuf clous de fer forgé, un pour chaque talon et chaque paume, et quelques-uns pour la suite.", effet: "Clouer un mort prend une minute. Neuf fois sur dix, il reste couché.", image: "carte-clous-tete-carree" },
      { titre: "Lanterne au verre bleu", texte: "La lanterne des Veilleuses. Allumée, elle ne s'éteint ni au vent ni à la pluie.", effet: "Ouvre la porte de toute maison en deuil. Indispensable à la veillée.", image: "carte-lanterne-bleue" },
      { titre: "Laissez-passer de la Chancellerie", texte: "Un parchemin au sceau impérial, signé d'une encre violette. Il ne dit jamais « je ».", effet: "Reconnu par la plupart des gardes, sauf ceux de Hersende.", image: "carte-laissez-passer" },
      { titre: "Balance de laiton", texte: "Un pendentif de Peseur, deux fléaux minuscules. Ils s'inclinent quand quelqu'un lance un grand sort tout près.", effet: "Signale tout sort de niveau 4 ou plus lancé à moins de dix mètres.", image: "carte-balance-laiton" },
      { titre: "Chevalière à réservoir", texte: "Une bague de la Hanse du Sel, un peu de sel sous le chaton. Les comptoirs la reconnaissent.", effet: "Crédit de 50 po dans n'importe quel port, remboursable sous un mois.", image: "carte-chevaliere-sel" },
      { titre: "Ruban noir", texte: "Un ruban de soie noire, usé, à nouer au poignet gauche, là où l'on prenait le pouls.", effet: "Les Rendus vous prennent pour l'un des leurs, ou pour un ami." },
      { titre: "Insigne de plomb de la Rotonde", texte: "Un insigne de pèlerin, la porte fermée sous la couronne, frappé dans le plomb.", effet: "Les pèlerins vous accueillent sur toutes les routes de Pallène.", image: "carte-insigne-rotonde" },
      { titre: "Cierge béni", texte: "Un cierge de cire blanche du Val, à peine entamé, une goutte figée sur le côté.", effet: "Allumé près d'un mort, il le tient tranquille une nuit.", image: "carte-cierge-benit" },
    ],
  },

  campagne: {
    jauge: {
      nom: "le Sceau",
      depart: 100,
      seuils: [
        { valeur: 75, effet: "Les Levés se relèvent en une nuit au lieu de trois. Les animaux morts commencent à se relever aussi." },
        { valeur: 50, effet: "Les Porte-Voix apparaissent dans les villes. Les héritiers entendent la voix en plein jour." },
        { valeur: 25, effet: "La Rotonde se fend. Le corps d'Ostral penche sur son trône. Les Grands Morts se lèvent de leurs tombeaux royaux." },
        { valeur: 0, effet: "Le sceau cède, à moins que quelqu'un ne remplace le corps sur le Trône. Fin de campagne." },
      ],
      remontees: [
        { action: "Rendre au Trône une relique d'Ostral", gain: 5 },
        { action: "Une grande procession de prières", gain: 2 },
        { action: "Finir une bataille sans massacre", gain: 3 },
        { action: "La veillée pratiquée à grande échelle", gain: 1 },
        { action: "Une quête de niveau 11 ou plus réussie autour du sceau", gain: 10 },
      ],
      descentes: [
        { action: "Un mois de jeu (la guerre, les prières qui ne suffisent plus)", perte: 1 },
        { action: "Un sort de niveau 6 à 8", perte: 1 },
        { action: "Un sort de niveau 9", perte: 3 },
      ],
    },
    reserve: {
      nom: "Murmures",
      max: 6,
      regle: "Sort de niveau 4 ou 5 : +1 Murmure. Niveau 6 à 8 : +2. Niveau 9 : +3. Un rituel ne coûte rien. À dépenser pour un désavantage, un mort qui se relève, une voix aimée qui suggère, ou un renseignement soufflé à un ennemi.",
    },
    accroches: [
      { titre: "La Marche à Gué-Saulnier", niveaux: [1, 4], factions: ["confrerie"], texte: "Les Noyés sortent de la tourbe par dizaines ; l'apprenti de la Confrérie n'est pas revenu. On le trouve cloué à un pilotis, vivant, avec « Ils ne nous laissent pas descendre » gravé en ancienne langue, et sa carte des lignes de la Marche." },
      { titre: "Le contremaître à l'ombrelle", niveaux: [1, 4], factions: ["hanse", "eglise"], texte: "Un convoi de sel de la Hanse cache des Levés enchaînés. L'inspection de l'Église veut tout brûler et pendre l'escorte ; le contremaître paie pour faire disparaître le prêtre. Un Levé aux yeux gris appelle un personnage par le prénom de sa mère : premier Porte-Voix." },
      { titre: "Un chien pour l'Enfant", niveaux: [1, 4], factions: ["yse", "veilleuses"], texte: "Ysé a quitté le camp des Veilleuses pour chercher « un chien qui a une voix de papa ». La retrouver avant les hommes de Cyprien et ceux de Hersende. Laquelle des deux voix ment ? « Celle qui dit oui à tout. »" },
      { titre: "La tour sans porte", niveaux: [5, 10], factions: ["peseurs", "eglise"], texte: "Voler pour un Peseur son propre registre, confisqué par l'Église. Les courbes montrent que chaque grand sort fait baisser quelque chose sous Aube-Close ; le plus gros creux date des tempêtes de feu de l'an 4. Introduire les Murmures à voix haute." },
      { titre: "Le rouleau de la nuit du Glas", niveaux: [5, 10], factions: ["chancellerie", "rendus"], texte: "Retrouver le scribe de garde la nuit du Glas, mort depuis et caché chez les Rendus. Il a retenu les dernières paroles du Dieu : « Ne la retirez pas. Mon frère attend. » Trois camps veulent le faire taire." },
      { titre: "Le siège de Clairfont", niveaux: [5, 10], factions: ["hersende", "eglise"], texte: "Hersende assiège une abbaye qui garde ses morts enchaînés dans les caves. Si elle tombe, des centaines de morts sortent ; si elle tient, les légions se vengent sur les villages. La nuit, Hersende parle avec tendresse à un Porte-Voix assis dans le noir." },
      { titre: "Le chêne qui rend", niveaux: [11, 16], factions: ["elfes"], texte: "Les elfes de la Brune parlent si on nettoie une clairière où les arbres rendent leurs morts. Un elfe de Mémoire pris dans un tronc raconte les jumeaux et prononce le vrai nom : Gorvan. Dit devant un Porte-Voix, il le fige un round. Gorvan sait désormais qui sont les personnages." },
      { titre: "Sous la Rotonde", niveaux: [11, 16], factions: ["chancellerie", "eglise"], texte: "Descendre par les archives ou par les fosses de la Garde jusqu'au puits : le corps d'Ostral prolongé dans la pierre, fendu. Chaque sort de niveau 4 ou plus coûte double. Gorvan propose poliment d'épargner leurs proches." },
      { titre: "Le couronnement", niveaux: [17, 20], factions: ["hersende", "eglise", "yse"], texte: "L'héritier le plus fort a pris Aube-Close et lève la main vers la couronne. Le convaincre, l'arrêter devant le peuple, ou le laisser faire. Si la couronne quitte la tête, le Sceau tombe à 0 dans l'heure." },
      { titre: "Celui qui s'assoit", niveaux: [17, 20], factions: ["yse"], texte: "Refaire le sceau : Ysé sur le Trône de son plein gré, un Sang-Doré ou un héritier à sa place, rendre à Gorvan sa fonction sans sa faim, ou le tuer et brûler tous les morts pour toujours. Aucune fin n'est gratuite." },
    ],
  },
};
