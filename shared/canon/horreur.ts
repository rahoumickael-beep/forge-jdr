// Canon de la Côte des Noyés (horreur, Cotentin, 1923), tiré de la bible du monde (content/cote-des-noyes/lore.md).
// Ajouter un nom ici est une décision : on la note dans docs/journal-de-production.md.
// Les années de la chronologie sont des années ordinaires ; on compte aussi « de l'Armistice » à partir de 1918 (an 0).
// L'événement de février 1924 est dans les secrets, pas dans la chronologie : rien n'y dépasse l'année de jeu.
import { NOMS_COTE_DES_NOYES } from "./horreur-table";
import type { Canon } from "./types";

export const COTE_DES_NOYES: Canon = {
  genre: "horreur",
  monde: "la Côte des Noyés",
  continent: "le Cotentin",
  capitale: "Saint-Clair-sur-Mer",
  calendrier: { long: "de l'ère commune", court: "de l'Armistice", debutCourt: 1918, anDeJeu: 1923, saison: "automne" },

  chronologie: [
    { an: 1693, quoi: "Le curé de Saint-Clair note dans le registre de la paroisse une mort rendue par la mer, trois semaines avant le naufrage d'un caboteur." },
    { an: 1843, quoi: "Naissance d'Anne Hamel, future ramasseuse de varech de la Hague." },
    { an: 1863, quoi: "Naissance d'Hippolyte Lécuyer, futur médecin de Saint-Clair." },
    { an: 1868, quoi: "Naissance d'Anatole Brévin, futur directeur de la Havraise." },
    { an: 1873, quoi: "Naissance d'Yves Le Bihan, futur gardien du Rocher-Gris." },
    { an: 1873, quoi: "Naissance d'Edmond Lemarquand, futur président de la Compagnie des Paquebots de la Manche." },
    { an: 1878, quoi: "Naissance d'Irène Vauquelin, future médium du Cercle Thalassa." },
    { an: 1883, quoi: "Naissance de Raymond Coquart, futur maréchal des logis-chef de Saint-Clair." },
    { an: 1889, quoi: "L'embranchement de Cherbourg atteint Saint-Clair-sur-Mer." },
    { an: 1890, quoi: "Construction du phare du Rocher-Gris." },
    { an: 1898, quoi: "Naissance de Louise Marchal." },
    { an: 1912, quoi: "Le curé bénit la Fosse après la disparition de trois barques." },
    { an: 1914, quoi: "La guerre : trois cent soixante hommes de Saint-Clair partent, deux cent quatre-vingt-six reviennent." },
    { an: 1918, quoi: "L'Armistice, le 11 novembre : an 0 de l'Armistice." },
    { an: 1919, quoi: "Yves Le Bihan devient gardien du Rocher-Gris." },
    { an: 1921, quoi: "Fondation de la Compagnie des Paquebots de la Manche ; commande de la Reine-Hortense aux chantiers de Saint-Nazaire." },
    { an: 1923, quoi: "Mars : le premier Revenu sur la grève de Saint-Clair ; lancement de la Reine-Hortense à Saint-Nazaire." },
    { an: 1923, quoi: "Juillet : arrivée du Cercle Thalassa à l'hôtel des Bains." },
    { an: 1923, quoi: "Septembre : essais de la Reine-Hortense en rade de Cherbourg. Année de jeu." },
  ],

  regions: [
    {
      nom: "Saint-Clair-sur-Mer",
      situation: "au fond de la baie de Saint-Clair, sur la côte ouest du Cotentin",
      paysage: "un bourg de granit gris, un port d'échouage, une église à clocher carré, la gare au bout de l'embranchement de Cherbourg",
      gens: ["pêcheurs", "marchands de poisson", "douaniers", "familles bourgeoises en villégiature"],
      peur: "les journalistes de Paris, et la mer quand elle est trop calme",
      lieuDeRencontre: "la grève de Saint-Clair, à l'aube, à marée basse",
      lieux: ["l'hôtel des Bains", "l'auberge du Port", "la gare", "l'église", "la grève", "la baie de Saint-Clair"],
    },
    {
      nom: "La Morgue de l'Abri-du-Marin",
      situation: "au bout du port de Saint-Clair",
      paysage: "une ancienne glacière de poissonnerie, des tables de pierre, des blocs de glace livrés de Cherbourg",
      gens: ["le médecin", "les familles des disparus"],
      peur: "que les morts ne pourrissent pas",
      lieuDeRencontre: "la morgue de l'Abri-du-Marin, sous la lampe à pétrole",
      lieux: ["l'Abri-du-Marin"],
    },
    {
      nom: "Le Rocher-Gris",
      situation: "un îlot à un mille de la côte, relié à la terre par une chaussée de galets",
      paysage: "un phare, une chaussée qui ne découvre qu'aux basses mers de vives-eaux, une heure et demie à chaque fois",
      gens: ["le gardien"],
      peur: "rester coincé sur la chaussée quand la mer remonte",
      lieuDeRencontre: "la chaussée de galets du Rocher-Gris",
      lieux: ["le phare du Rocher-Gris", "la chaussée de galets"],
    },
    {
      nom: "La Hague",
      situation: "la pointe nord-ouest du Cotentin",
      paysage: "landes de bruyère, murets de pierre sèche, falaises de cent mètres, et le raz, un courant que les bateaux évitent",
      gens: ["bergers", "ramasseurs de varech"],
      peur: "le raz, les naufrageurs d'autrefois, la cloche qu'on entend en mer",
      lieuDeRencontre: "la lande de la Hague, au bord de la falaise",
      lieux: ["le raz Blanchard", "le nez de Jobourg", "Carteret"],
    },
    {
      nom: "Cherbourg",
      situation: "le grand port militaire et transatlantique, au nord du Cotentin",
      paysage: "la digue du large, la grande rade où les paquebots mouillent à l'ancre, des vedettes qui font la navette avec les quais",
      gens: ["marins de la Royale", "dockers", "employés de la Compagnie", "voyageurs américains"],
      peur: "le chômage depuis la guerre, les grèves des dockers",
      lieuDeRencontre: "un quai de la grande rade de Cherbourg, sous la pluie",
      lieux: ["la grande rade", "la digue du large"],
    },
    {
      nom: "Le Havre",
      situation: "sur l'estuaire de la Seine, siège de la Havraise",
      paysage: "un immeuble de pierre blanche rue de Paris, des bureaux de chêne, des classeurs jusqu'au plafond",
      gens: ["assureurs", "armateurs", "courtiers"],
      peur: "le sinistre qui ruine une compagnie en une nuit",
      lieuDeRencontre: "un bureau de la Havraise, rue de Paris, au Havre",
      lieux: ["la rue de Paris"],
    },
    {
      nom: "La Fosse",
      situation: "au large de Saint-Clair, à trois milles",
      paysage: "un trou dans le fond de la mer que les pêcheurs évitent ; les filets en remontent des montres arrêtées, des souliers d'enfant, des lettres",
      gens: ["pêcheurs imprudents"],
      peur: "ce qui remonte dans les filets",
      lieuDeRencontre: "une barque de pêche immobile au-dessus de la Fosse",
      lieux: [],
    },
  ],
  autresLieux: ["Partout", "Caen", "Rouen", "Paris", "Southampton", "New York", "Saint-Nazaire", "la Manche", "la Royale", "l'île de Sein", "Verdun", "la Somme", "la Bretagne", "la Normandie", "le Code d'instruction criminelle", "la sacristie", "l'évêché"],

  factions: [
    { id: "havraise", nom: "La Havraise", alias: ["Havraise", "expert", "experts", "les experts de la Havraise"], but: "ne pas payer ce qu'on ne doit pas, et savoir ce qu'on devra", signe: "une ancre dans un cercle, avec la devise « Prévoir »", penche: "les chiffres", membres: ["expert", "actuaire", "courtier"] },
    { id: "compagnie", nom: "La Compagnie des Paquebots de la Manche", alias: ["Compagnie des Paquebots", "la Compagnie", "Compagnie"], but: "que la Reine-Hortense parte en février, pleine, à l'heure", signe: "un léopard d'or sur une cheminée rouge", penche: "la publicité", membres: ["officier", "matelot", "soutier", "maître d'équipage"] },
    { id: "gendarmerie", nom: "La Gendarmerie et le Parquet", alias: ["Gendarmerie", "Parquet", "gendarme", "gendarmes", "le procureur", "procureur", "brigade"], but: "que l'ordre règne et que les morts aient un nom", signe: "le bicorne et la grenade", penche: "le classement", membres: ["gendarme", "maréchal des logis", "procureur"] },
    { id: "cote", nom: "Les gens de la côte", alias: ["gens de la côte", "les anciens"], but: "que la mer les laisse vivre", signe: "une croix de bois flotté au-dessus des portes", penche: "la mer", membres: ["pêcheur", "ramasseur de varech", "douanier"] },
    { id: "thalassa", nom: "Le Cercle Thalassa", alias: ["Cercle Thalassa", "Thalassa"], but: "parler aux morts", signe: "une vague stylisée sur une broche d'argent", penche: "les vivants qui paient", membres: ["médium", "adepte"] },
  ],

  figures: [
    { nom: "Anatole Brévin", alias: ["Brévin"], titre: "directeur de la Havraise", ou: "Le Havre", faction: "havraise", age: 55, etat: "vivant" },
    { nom: "Hippolyte Lécuyer", alias: ["Lécuyer", "docteur Lécuyer", "le docteur"], titre: "médecin de Saint-Clair", ou: "La Morgue de l'Abri-du-Marin", age: 60, etat: "vivant" },
    { nom: "Raymond Coquart", alias: ["Coquart", "maréchal des logis-chef Coquart"], titre: "maréchal des logis-chef de gendarmerie", ou: "Saint-Clair-sur-Mer", faction: "gendarmerie", age: 40, etat: "vivant" },
    { nom: "Yves Le Bihan", alias: ["Le Bihan"], titre: "gardien du phare du Rocher-Gris", ou: "Le Rocher-Gris", faction: "cote", age: 50, etat: "vivant" },
    { nom: "Anne Hamel", alias: ["la mère Hamel", "mère Hamel", "Hamel"], titre: "ramasseuse de varech", ou: "La Hague", faction: "cote", age: 80, etat: "vivant" },
    { nom: "Edmond Lemarquand", alias: ["Lemarquand"], titre: "président de la Compagnie des Paquebots de la Manche", ou: "Cherbourg", faction: "compagnie", age: 50, etat: "vivant" },
    { nom: "Irène Vauquelin", alias: ["Madame Vauquelin", "Vauquelin"], titre: "médium, fondatrice du Cercle Thalassa", ou: "l'hôtel des Bains", faction: "thalassa", age: 45, etat: "vivant" },
    // Dans les lettres et à la première séance (bible, sections 8 et 11)
    { nom: "Louise Marchal", alias: ["Marchal", "mademoiselle Marchal"], titre: "institutrice", ou: "Caen", age: 25, etat: "vivant" },
    { nom: "Lucien Tellier", alias: ["Tellier", "le numéro onze"], titre: "représentant en draps, mari de Germaine Tellier", ou: "Rouen", etat: "vivant" },
    { nom: "Gaston Hardouin", alias: ["Gaston", "Hardouin"], titre: "contrebandier", ou: "Saint-Clair-sur-Mer", etat: "vivant" },
    { nom: "Marcel", alias: ["le vieux Marcel"], titre: "pêcheur de Saint-Clair, qui a trouvé le numéro onze", ou: "Saint-Clair-sur-Mer", etat: "vivant" },
    { nom: "Madame Hébert", alias: ["Hébert"], titre: "sœur de Raymond Coquart, destinataire de la lettre du numéro neuf", ou: "Cherbourg", etat: "vivant" },
    { nom: "Jules", alias: ["le petit Jules"], titre: "gamin de Saint-Clair, messager du phare", ou: "Saint-Clair-sur-Mer", etat: "vivant" },
    { nom: "Germaine Tellier", alias: ["Madame Tellier", "Tellier"], titre: "destinataire de la lettre du numéro onze", ou: "Rouen", etat: "vivant" },
  ],

  divinites: [],

  peuples: [
    "Gens de la côte", "Gens de la Côte", "Revenus de la guerre", "Revenu de la guerre", "Bourgeois de la ville", "Bourgeoise de la ville", "Étrangers", "Étranger", "Enfants du siècle", "Enfant du siècle", "Sensibles", "Sensible",
    "pêcheur", "pêcheurs", "poilu", "poilus", "infirmière", "abbé", "journaliste", "photographe", "médium", "gendarme", "antiquaire",
  ],

  vocabulaire: [
    "Revenu", "Revenus", "lettre", "lettres", "Marée", "Présage", "Présages", "Choc", "Lame de fond", "Lames de fond", "les Passagers", "Passagers",
    "la Reine-Hortense", "Reine-Hortense", "depuis l'Armistice", "Armistice", "raz", "raz Blanchard", "vives-eaux", "varech", "marée basse", "marée haute", "grève", "grèves",
    "numéro onze", "numéro sept", "numéro douze", "numéro quatre", "franc", "francs", "Lebel", "Berthier", "Hotchkiss", "Renault", "Royale", "scaphandre", "gaffe", "gaffes", "harpon", "harpons",
    "Code d'instruction criminelle", "Prévoir", "Saint-Clair", "baie de Saint-Clair", "Côte des Noyés", "Cotentin", "Jobourg", "Carteret", "dactylographiée", "garçonne", "garçonnes",
    "chaloupe", "chaloupes", "soute à charbon", "soute", "paquebot", "paquebots", "vedette", "vedettes", "Verdun", "la Somme", "tranchée", "tranchées", "sinistre", "sinistres", "expert", "experts",
    "décharge", "contrat", "contrats", "police d'assurance", "prime", "primes", "contrebandiers", "contrebandier", "noyé", "noyés", "séance", "séances", "table tournante", "tables tournantes",
    "écriture automatique", "souscription", "souscriptions", "lettre de mission", "T.S.F.", "télégraphe",
  ],

  // Chaînes que les joueurs ne doivent pas lire avant que la campagne les révèle. « Reine-Hortense » seul est public : tout le monde connaît le navire.
  secrets: [
    "passagers de la Reine-Hortense", "13 au 14 février 1924", "13 février 1924", "14 février 1924", "se souvient en avant", "Revenu en avance", "Revenus en avance",
    "ne sont pas encore morts", "pas encore morts", "ne pourrissent pas parce", "devanciers", "devancier", "rend en avance", "rendre en avance",
    "mille quatre cent douze", "1 412 personnes", "coulera dans le raz", "la Reine-Hortense coulera", "la Reine-Hortense va couler", "sera rendu avant d'être pris", "ce qu'elle prend, elle le rend avant",
    "le cœur battait encore", "un coup par minute", "cœur de Lécuyer", "a ouvert un Revenu", "sa mère était un devancier",
    "quarante millions", "résilier sa part", "résilier le contrat", "cloisons de la soute", "chaloupes sont du modèle d'avant-guerre", "pas aux normes",
    "dix lettres originales", "lettre adressée à sa propre sœur", "tiroir de Coquart", "a acheté une lettre", "entend vraiment quelqu'un se noyer",
    "numéro sept est Louise Marchal", "Louise Marchal est vivante", "institutrice à Caen", "les Revenus marchent sous l'eau", "un trait par silhouette", "quatre cent trente",
    "lettres sont celles qu'ils écriront", "écriront à bord", "fermé la soute", "porte de la soute avec des hommes dedans",
  ],

  anachronismes: [
    "télévision", "téléviseur", "radio portative", "ordinateur", "téléphone portable", "smartphone", "internet", "plastique", "carte de presse", "gare maritime",
    "nylon", "transistor", "photocopie", "photocopieuse", "tracteur à chenilles", "supermarché", "autoroute", "avion de ligne", "hélicoptère", "radar", "sonar",
    "sortilège", "sortilèges", "magie", "magicien", "magicienne", "sorcier", "sorcière", "épée enchantée", "enchantement", "dragon", "elfe", "elfes", "nain", "gobelin", "orc", "grimoire", "potion",
    "Cthulhu", "Lovecraft", "Arkham", "Innsmouth", "Miskatonic", "Necronomicon", "Nécronomicon", "L'Appel de Cthulhu", "Grands Anciens", "Profonds", "Shoggoth", "Dagon",
  ],

  noms: NOMS_COTE_DES_NOYES,

  // Accroches ouvertes aux joueurs-tirages : rien de secret.
  accroches: [
    { texte: "Un onzième noyé arrive sur la grève à l'aube, une lettre cirée dans la poche ; la Havraise veut savoir si c'est un sinistre.", factions: ["havraise", "cote"] },
    { texte: "Le maréchal des logis-chef garde les lettres dans un tiroir et ne les prêtera à personne.", factions: ["gendarmerie"] },
    { texte: "Madame Vauquelin demande cinq cents francs et l'accès à la morgue, en échange de ce que dira « le numéro sept ».", factions: ["thalassa", "gendarmerie"] },
    { texte: "La mère Hamel fait enterrer un noyé sans nom, de nuit, contre l'avis du maire.", factions: ["cote"] },
    { texte: "Le gardien du Rocher-Gris envoie un enfant chercher « les gens de l'assurance ».", factions: ["cote", "havraise"] },
    { texte: "La Compagnie invite les experts à une traversée d'essai en rade de Cherbourg.", factions: ["compagnie", "havraise"] },
  ],

  cartes: {
    evenements: [
      { titre: "Le onzième à l'aube", texte: "La mer est très loin. Sur le sable, une rangée de pêcheurs en vareuse, le béret à la main, autour d'un homme en manteau de ville couché comme un dormeur.", effet: "Un nouveau noyé sur la grève : le gendarme veut le faire emporter avant que quiconque l'examine." },
      { titre: "La chaussée découvre", texte: "À la basse mer de vives-eaux, la chaussée de galets du Rocher-Gris sort de l'eau, luisante. Le phare allume et éteint son feu trois fois.", effet: "Une heure et demie pour aller au phare et en revenir ; la mer remonte plus vite qu'un cheval au galop." },
      { titre: "La mer trop calme", texte: "Pas une ride dans la baie, pas un oiseau. Les vieux se signent sur le pas des portes et rentrent leurs enfants.", effet: "Tous les personnages font une sauvegarde de Sang-froid DD 12, ou la Marée monte d'un point." },
      { titre: "La séance de six heures et demie", texte: "Dans la salle de l'hôtel des Bains, les rideaux sont tirés, une broche d'argent brille sur la nappe. Une voix de femme baisse, baisse, puis cesse.", effet: "Madame Vauquelin fait une révélation à la table ; elle ne peut pas se tenir à deux endroits à la fois, et les experts non plus." },
      { titre: "Une assiette à la fenêtre", texte: "Dans les hameaux de la Hague, les nuits de tempête, une assiette reste posée sur chaque appui de fenêtre. Personne ne dit pour qui.", effet: "Un habitant de la Hague parle plus volontiers à qui respecte la coutume." },
      { titre: "La cloche en mer", texte: "Dans le vent, très loin, une cloche sonne, comme à bord d'un navire. Il n'y a aucun navire à la ronde.", effet: "Sauvegarde de Sang-froid DD 12 pour ceux qui l'entendent ; les bergers s'enferment chez eux." },
      { titre: "Le filet de la Fosse", texte: "Dans les mailles, une montre arrêtée, un soulier d'enfant, une valise de cuir ruisselante avec une étiquette d'hôtel dont l'eau a effacé le nom.", effet: "Un indice matériel, mais le pêcheur qui l'a remonté refuse d'y retourner." },
      { titre: "Les dockers en grève", texte: "À Cherbourg, les grues sont à l'arrêt, les dockers assis sur les bollards. Les vedettes ne font plus la navette avec la grande rade.", effet: "Impossible de monter à bord d'un paquebot cette journée sans pot-de-vin ou sans appui de la Compagnie." },
      { titre: "Le télégramme du Havre", texte: "Un télégramme du bureau de la rue de Paris, quelques mots secs : « Rapport complet avant jeudi. Prévoir. »", effet: "Le directeur exige un compte rendu ; un personnage doit choisir ce qu'il y met." },
      { titre: "Les journalistes de Paris", texte: "Un chapeau mou et un appareil à soufflet descendent du train de Cherbourg. Le monsieur demande où l'on couche les noyés.", effet: "La presse arrive à Saint-Clair : le gendarme se ferme, les gens de la côte aussi." },
      { titre: "La carriole du docteur", texte: "Le docteur Lécuyer passe à la hâte, sa Renault pleine de blocs de glace, et refuse de répondre à quiconque avant d'être arrivé à la morgue.", effet: "On peut le suivre : il sait quelque chose sur le dernier corps, et il ne l'a dit à personne." },
      { titre: "Le feu éteint, la nuit", texte: "Au Rocher-Gris, le faisceau du phare s'arrête en plein tour, le temps de dix respirations, puis reprend, comme si quelqu'un était passé devant.", effet: "Un personnage en mer ou sur la grève voit, au bord de l'eau, quelque chose qui n'y était pas." },
    ],
    objets: [
      { titre: "Une lettre cirée", texte: "Une enveloppe protégée par de la cire, l'encre à peine fanée, une adresse en France ou en Angleterre.", effet: "La première moitié se lit sans risque ; lire la seconde fait monter la Marée, sauf sauvegarde de Sang-froid DD 12." },
      { titre: "Une pièce neuve", texte: "Une pièce de monnaie sans une rayure, frappée d'une année qui n'est pas encore venue.", effet: "Un indice qu'on peut montrer à un expert ; avantage à la Persuasion devant un sceptique qui la tient en main." },
      { titre: "Le carnet de traits", texte: "Un carnet de toile cirée, des pages entières de petits traits serrés, en groupes de cinq.", effet: "Un compte à suivre ; avantage aux jets d'Investigation sur les allées et venues du phare." },
      { titre: "Une étiquette d'hôtel", texte: "Un petit carré de papier gommé, mouillé, collé au flanc d'une valise. Le nom de l'hôtel est lisible, pas celui du voyageur.", effet: "Une piste pour remonter à un voyageur ; il faut l'aller voir sur place." },
      { titre: "Revolver d'ordonnance de 1892", texte: "Un lourd revolver à barillet, la crosse usée par les mains d'un autre. Six cartouches dans une boîte de carton.", effet: "Arme de poing classique ; son porteur se fait remarquer en ville." },
      { titre: "Lampe-tempête", texte: "Une lampe à pétrole à cage de fer et à verre épais, qu'on porte à bout de bras sur la grève.", effet: "Éclaire 9 m dans le vent et la pluie ; ne s'éteint pas sur un jet raté de Survie." },
      { titre: "Lettre de mission de la Havraise", texte: "Un papier à en-tête, une ancre dans un cercle, la signature d'un directeur qui compte tout.", effet: "Ouvre les portes des bureaux et des gares ; les gendarmes la regardent de travers." },
      { titre: "Broche du Cercle Thalassa", texte: "Une vague stylisée en argent ternie, sur une épingle de revers.", effet: "Une fois par séance, avantage à la Persuasion face à un adepte du Cercle ; un sceptique y voit de la crédulité." },
      { titre: "Carte des marées", texte: "Un tableau imprimé des heures et des coefficients, gribouillé au crayon de marges et de repères.", effet: "Avantage aux jets de Survie pour traverser une chaussée ou une grève sans être surpris." },
      { titre: "Gaffe de pêcheur", texte: "Une longue perche de frêne ferrée d'un crochet, lissée par vingt ans de paumes.", effet: "Portée de 3 m ; avantage pour attraper ou repousser ce qui flotte." },
    ],
  },

  campagne: {
    jauge: {
      nom: "les Passagers",
      depart: 1412,
      max: 1512,
      seuils: [
        { valeur: 1000, effet: "Les Revenus de ceux qui ne monteront plus à bord disparaissent de la morgue, une nuit, avec leurs lettres. Lécuyer perd ses preuves ; si Louise Marchal ne monte plus, le numéro sept disparaît avec la seule lettre qui nomme le navire." },
        { valeur: 500, effet: "La mer cesse de rendre des voyageurs ; elle commence à rendre des gens de la côte." },
        { valeur: 100, effet: "La mer réclame. Chaque nuit de tempête, un personnage à 5 de Marée ou plus entend son nom : sauvegarde de Sang-froid DD 14, ou +1 de Marée." },
        { valeur: 0, effet: "La Reine-Hortense ne coulera pas. Fin de campagne : que prend la mer à la place ?" },
      ],
      remontees: [
        { action: "La Compagnie avance le départ ou remplit davantage le navire", gain: 100 },
      ],
      descentes: [
        { action: "Une personne nommée convaincue de ne pas embarquer", perte: 1 },
        { action: "Une famille ou un groupe convaincu de ne pas embarquer", perte: 10 },
        { action: "Une chaloupe de plus peut être descendue (palan réparé, officier remplacé)", perte: 50 },
        { action: "Une tranche de cabines remboursée par la Compagnie (presse, procès, chantage)", perte: 100 },
        { action: "Le feu n'est que circonscrit (cloisons réparées, pompes en marche) : le naufrage devient lent", perte: 300 },
      ],
    },
    reserve: {
      nom: "Lames de fond",
      max: 4,
      regle: "Une Lame de fond chaque fois qu'un personnage dépense un Présage. À dépenser pour qu'une chose prévue arrive malgré tout, pour faire monter la mer plus vite qu'elle ne devrait, ou pour faire apparaître un Revenu là où on ne l'attend pas.",
    },
    accroches: [
      { titre: "Le numéro douze", niveaux: [1, 4], factions: ["havraise"], texte: "Un Revenu arrive à l'aube, et sa lettre est adressée à un personnage, ou à un proche d'un personnage." },
      { titre: "La copie", niveaux: [1, 4], factions: ["gendarmerie"], texte: "Les lettres de la morgue sont des copies ; Coquart garde les originales, et ne les prêtera à personne." },
      { titre: "La séance", niveaux: [1, 4], factions: ["thalassa"], texte: "Madame Vauquelin demande cinq cents francs et l'accès à la morgue, en échange de ce que dira « le numéro sept »." },
      { titre: "Les devanciers", niveaux: [1, 4], factions: ["cote"], texte: "La mère Hamel fait enterrer un Revenu sans nom, de nuit, contre l'avis du maire ; des contrebandiers qui se servent de la grève la nuit n'aiment pas les témoins." },
      { titre: "Le phare", niveaux: [1, 4], factions: ["cote"], texte: "Yves Le Bihan envoie un enfant chercher « les gens de l'assurance » ; il refuse de parler devant Coquart." },
      { titre: "Louise Marchal", niveaux: [5, 10], factions: ["havraise"], texte: "Retrouver à Caen la femme du numéro sept, vivante." },
      { titre: "Le registre de 1693", niveaux: [5, 10], factions: ["cote"], texte: "Le curé cache dans la sacristie un registre que l'évêché a demandé de brûler." },
      { titre: "La traversée d'essai", niveaux: [5, 10], factions: ["compagnie"], texte: "Monter à bord de la Reine-Hortense en rade de Cherbourg, et voir la soute à charbon, alors que les hommes de Lemarquand surveillent les invités." },
      { titre: "La Fosse", niveaux: [5, 10], factions: ["cote"], texte: "Descendre en scaphandre là où la mer se souvient." },
      { titre: "Le cœur qui bat", niveaux: [5, 10], factions: ["havraise"], texte: "Le docteur Lécuyer demande aux experts d'assister à une seconde autopsie." },
      { titre: "Les quarante millions", niveaux: [11, 16], factions: ["havraise", "compagnie"], texte: "Brévin veut résilier le contrat ; Lemarquand veut faire taire les experts." },
      { titre: "Les passagers", niveaux: [11, 16], factions: ["compagnie"], texte: "La liste des réservations, et mille quatre cents noms. On ne peut pas tous les prévenir : la presse provoque la panique, le chantage à la Compagnie la rend dangereuse." },
      { titre: "L'officier", niveaux: [11, 16], factions: ["compagnie"], texte: "La lettre du numéro quatre accuse le second capitaine d'avoir fermé la soute ; il ne l'a pas encore fait." },
      { titre: "Ce que la mer veut", niveaux: [11, 16], factions: ["cote"], texte: "À mesure que les passagers renoncent, la mer rend des gens de Saint-Clair." },
      { titre: "Le procès", niveaux: [11, 16], factions: ["gendarmerie", "havraise"], texte: "La Compagnie attaque la Havraise pour diffamation ; les lettres sont des pièces à conviction." },
      { titre: "À bord", niveaux: [17, 20], factions: ["havraise", "compagnie", "gendarmerie", "cote", "thalassa"], texte: "Embarquer sur la Reine-Hortense, si elle part, en faux passagers ou dans l'équipage." },
      { titre: "La soute", niveaux: [17, 20], factions: ["compagnie"], texte: "L'incendie, à deux heures du matin." },
      { titre: "Les chaloupes", niveaux: [17, 20], factions: ["compagnie", "cote"], texte: "Faire descendre ce qui ne descend pas." },
      { titre: "Le prix", niveaux: [17, 20], factions: ["cote"], texte: "La mer a pris l'habitude d'être payée ; quelqu'un doit entrer dans l'eau." },
      { titre: "Le dernier Revenu", niveaux: [17, 20], factions: ["havraise", "compagnie", "gendarmerie", "cote", "thalassa"], texte: "À l'aube du 14 février, sur la grève de Saint-Clair, la mer rend un dernier corps. Qui est-ce ?" },
    ],
  },
};
