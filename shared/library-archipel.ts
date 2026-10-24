// Bibliothèque de l'Archipel (science-fiction, « Les Phares ») : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « Les Phares », scénario 1 : ouverture, niveau 1. */
export const MENSUALITE: Scenario = {
  id: "bib-sf-mensualite",
  title: "La première mensualité",
  genre: "science-fiction",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "La Pie-Grièche, achetée à crédit la semaine dernière, s'est posée hier dans la poussière de Gué-d'Ambre, et la première mensualité tombe ce soir : 2 000 lumens dus à la Main Close. L'équipage en a 600. Sur le quai, Barnabé Coquerel attend, gilet de soie et deux Tarrak dans le dos, avec une proposition.",
  synopsis:
    "An 1214 du Chant. Coquerel efface la mensualité si l'équipage porte une caisse scellée à deux sauts de là, dans les Brisants, à l'épave de la Sainte-Patience, un ancien vaisseau-école des Chantres. La caisse contient une lame-diapason intacte, que la Vieille Mère Quassi fait passer pour le compte d'un réseau de fidèles. Elle vaut cinquante mille lumens. Coquerel le sait, et il a vendu le renseignement à la Censeure Ludivine Maréchal pour se payer une fuite. Au Phare de Gué-d'Ambre, qui s'éteint une seconde chaque nuit, l'équipage doit choisir : le poste de Péage, où la Censeure inspecte les cargaisons, ou la resquille dans le sillage d'un convoi. Dans les Brisants, la Sainte-Patience est aux mains des ferrailleurs de Tante Escarbille, et Frère Ambroise, le Chantre qui attend la lame, y cache Lison, dix ans, qui entend la pierre. Ambroise refuse de prendre la lame avant d'avoir vu la Pie-Grièche quitter l'épave, et il embarque avec Lison quand les ferrailleurs se retournent contre eux. La corvette de la Censeure sort du saut derrière eux. Au bout de la nuit, l'équipage décide de ce que deviennent la lame et l'enfant, et apprend que la Main Close règle elle-même ses traîtres : Rakka Sel-Noir est venue pour Coquerel.",
  acts: [
    {
      title: "Le quai numéro neuf",
      location: "Les docks de Gué-d'Ambre, au crépuscule",
      summary:
        "Coquerel attend au pied de la rampe. Il réclame les 2 000 lumens, compte les 600, les rend en soupirant, puis propose l'arrangement : la mensualité suspendue trois jours contre une caisse longue comme un bras et demi, scellée à la cire grise, à livrer à la Sainte-Patience dans les Brisants avant trois jours. « Pas de questions, pas de scanner, pas de Péage si vous pouvez l'éviter. » S'ils refusent, il saisit la soute et repart. Le lendemain matin, Rakka Sel-Noir s'assoit dans leur cuisine et attend qu'on lui serve une tasse : elle propose la même caisse, contre un délai d'un mois, et elle demande en passant s'ils ont trouvé Coquerel « nerveux ». S'ils acceptent, deux portefaix chargent la caisse. Pendant la nuit, des rats de soute attaquent le stock de rations pendant que deux pillards affamés tentent de voler la caisse sur la rampe : l'équipage choisit où courir, et ce qu'il ne protège pas est perdu (les rations, ou la caisse jusqu'à une poursuite dans les docks). Indices sur Coquerel, à semer pendant l'acte : il regarde trois fois vers la tour de la capitainerie ; il porte une bague neuve qu'il cache en serrant les mains ; il appelle la caisse « le paquet de la Mère » puis se reprend ; un pillard capturé dit qu'un « type en gilet » leur a donné le numéro du quai. Compter 50 minutes.",
    },
    {
      title: "Le Phare qui clignote",
      location: "L'approche du Phare de Gué-d'Ambre et le poste de Péage",
      summary:
        "La file des vaisseaux tourne autour du Phare à demi enterré. Une fois par nuit, vers la troisième heure, sa spirale s'éteint une seconde, puis se rallume, et les vieux pilotes se signent. Au poste de Péage, une corvette blanche est arrimée à l'Orgue : la Censeure Ludivine Maréchal fait ouvrir les soutes des cargos, un par un, avec une pierre de Phare au bout d'une perche. La caisse bourdonne quand on approche de l'Orgue en marche (le cristal d'une lame-diapason vibre près de la pierre d'un Phare) ; un Chantre l'entend sans qu'on ouvre rien. Choix : payer le Péage et passer l'inspection (cacher la caisse, mentir, payer), ou sauter en resquille dans le sillage d'un convoi de minerai qui part à vide. Le saut lui-même : le compensateur de la Pie-Grièche tousse (Technique DD 12 du mécanicien, sinon nausée). Compter 25 minutes.",
    },
    {
      title: "La Sainte-Patience",
      location: "Les Brisants : l'épave du vaisseau-école, ses dortoirs et sa chapelle",
      summary:
        "Deux sauts plus loin, la nébuleuse rouge, et dans ses épaves, la Sainte-Patience : un vaisseau-école des Chantres abattu pendant la Nuit des Orgues, coque percée, dortoirs d'enfants vides, une chapelle ronde dont les murs sont en pierre de Phare. Onze ans durant, un champ d'épaves l'a cachée ; Tante Escarbille a ouvert la route il y a un mois et a déjà démonté un mur de la chapelle. Elle réclame un droit de passage, ou la caisse. Frère Ambroise se cache dans la chapelle avec Lison. Quand la lame approche de la chapelle, quelque chose bourdonne dans les vitres des casques, et une Échouée sort des cloisons, attirée par l'enfant : elle ne veut pas tuer, elle veut entrer dans la tête de Lison. La lampe des ferrailleurs la repousse (voir les rencontres). Ambroise ne prendra pas la lame ici : « On ne remet pas ce qu'on n'a pas fini de payer. » Quand Escarbille comprend ce que contient la caisse, elle veut sa part ; Ambroise et Lison montent à bord de la Pie-Grièche pour fuir. Compter 1 h 05.",
    },
    {
      title: "La corvette blanche",
      location: "Les Brisants, carte d'espace : épaves, nébuleuse, et la Sainte-Patience",
      summary:
        "La corvette de la Censeure sort du saut : Coquerel lui a donné la destination, Péage payé ou non. Elle somme la Pie-Grièche de livrer la caisse, « et ce qu'elle protège ». Combat spatial à postes, ou fuite dans la nébuleuse : le pilote doit réussir deux tests de Réflexes DD 13 avant que la corvette n'ait touché trois fois la coque. Pendant le combat, une seconde silhouette sort des épaves : le cargo de Rakka Sel-Noir, qui ne tire sur personne. Rakka est venue pour Coquerel, qui a trahi la Vieille Mère, et elle sait qu'il est à bord de la corvette, payé pour reconnaître la caisse. Si on l'appelle (« Rakka, abordez »), elle abat les boucliers de la corvette en un round, puis l'aborde ; l'équipage doit tenir deux rounds avant qu'elle ne prenne le pont. Compter 1 heure.",
    },
  ],
  villain: {
    name: "Ludivine Maréchal, Censeure",
    motivation:
      "ramener à Solenne la lame intacte et l'enfant qui l'entend, avant que son supérieur ne le fasse à sa place ; elle croit sincèrement qu'un enfant qui entend la pierre est un enfant en danger",
    description:
      "Trente-cinq ans, petite, les cheveux tirés si fort que ses tempes blanchissent, le long manteau noir à la bouche cousue brodée sur la poitrine. Élevée dans un orphelinat des Maisons, à Solenne. Elle ne crie jamais, elle demande les choses par leur numéro : « Soute deux, s'il vous plaît. » Elle porte toujours la même pierre de Phare au bout d'une perche, enveloppée de plomb.",
  },
  npcs: [
    {
      name: "Barnabé Coquerel",
      role: "Homme de la Main Close aux docks de Gué-d'Ambre, commanditaire",
      secret:
        "Il veut quitter la Frange avant l'aube. Il a vendu à la Censeure le contenu de la caisse, sa destination et le numéro du quai, contre cinq mille lumens et une place sur la corvette ; il a aussi surpris Ambroise au relais et sait que la lame est « pour une gamine du Chantre ». Il a aussi prévenu deux pillards, pour que l'équipage croie à un vol ordinaire. Il a peur de la Vieille Mère au point de transpirer à son nom.",
      voice: "Gilet de soie élimé aux poches. Compte sur ses doigts bagués en parlant. Dit « mon petit » comme Quassi, par imitation, et toujours une fois de trop.",
    },
    {
      name: "Frère Ambroise",
      role: "Chantre, rang de Voix, caché dans la chapelle de la Sainte-Patience",
      secret:
        "Il veut conduire Lison à Hautes-Combes, chez le dernier Maître-Chantre. Il n'attend pas la lame pour lui : elle est pour Lison, et pour personne d'autre. Il a payé la Main Close avec l'argent de trois familles d'Ancre. Il a un Écho trop haut depuis des semaines et entend, la nuit, quelqu'un qui respire sous la pierre de la chapelle.",
      voice: "Soixante ans, maigre, une barbe mal coupée, les doigts qui tapotent une mesure sur tout ce qu'il touche. Parle bas, et chante à moitié les fins de phrase sans s'en rendre compte.",
    },
    {
      name: "Lison",
      role: "Dix ans, novice, entend la pierre",
      secret:
        "Elle veut qu'on la laisse chanter. Elle s'est enfuie d'un orphelinat d'État de la Frange il y a deux mois. Elle connaît la Censeure : c'est Ludivine Maréchal qui lui a fait poser la main sur la pierre, et qui l'a laissée partir ce jour-là en mentant à son supérieur. Lison ne le dira que si on lui demande pourquoi elle n'a pas peur de la corvette.",
      voice: "Une veste d'adulte roulée aux manches, un bonnet de laine. Répond aux questions par une autre question. Fredonne, très juste, une note qui fait vibrer les vitres.",
    },
    {
      name: "Tante Escarbille",
      role: "Chef de tas des ferrailleurs qui tiennent la Sainte-Patience",
      secret:
        "Elle veut sortir assez de pierre de Phare pour acheter un remorqueur neuf. Elle a démonté un mur de la chapelle pour la revendre, et une Échouée a pris l'un de ses ferrailleurs le soir même. Depuis, elle laisse le Chantre tranquille parce qu'il chante et que la chose se tait quand il chante. Elle vendra la caisse au plus offrant, Censeure comprise, si on ne la paie pas.",
      voice: "Une femme carrée en combinaison rapiécée de vingt couleurs, une lampe de casque toujours allumée. Mesure tout en kilos de ferraille : « Ton cargo, c'est neuf tonnes. Ta vie, c'est quatre-vingts kilos. »",
    },
  ],
  encounters: [
    {
      title: "La rampe, la nuit (acte 1)",
      description:
        "Dans la soute, trois rats de soute éventrent les rations. Sur la rampe, deux pillards affamés arrivent avec un diable pour emporter la caisse. Ils fuient à la moitié de leurs PV. Un pillard pris parle : un type en gilet leur a donné le numéro du quai. Des pillards à bout de forces, pas des tueurs : ce sont les chiffres de ce scénario, plus faibles que la fiche du bestiaire.",
      enemies: [
        { name: "Rat de soute", count: 3, hp: 7, ac: 12, attack: "Morsure +4, 1d4+2 perforants", danger: "Faible" },
        { name: "Pillard affamé", count: 2, hp: 13, ac: 12, attack: "Lame vibrante +3, 1d6+1 tranchants", danger: "Faible" },
      ],
      difficulty: "Moyenne",
    },
    {
      title: "Le droit de passage (acte 3)",
      description:
        "Si l'équipage ne paie pas Tante Escarbille (100 lumens, ou une pièce de la Pie-Grièche), deux de ses ferrailleurs ferment la coursive. Combat en gravité faible : un personnage qui saute plus de 3 m doit réussir un test de Réflexes DD 10 ou dériver d'une case. Escarbille arrête tout dès que l'Échouée apparaît.",
      enemies: [
        { name: "Ferrailleur d'Escarbille", count: 1, hp: 22, ac: 13, attack: "Lame de découpe +4, 1d8+2 tranchants", danger: "Moyen" },
        { name: "Apprenti ferrailleur", count: 1, hp: 13, ac: 12, attack: "Pied-de-biche +3, 1d6+1 contondants", danger: "Faible" },
      ],
      difficulty: "Difficile (évitable)",
    },
    {
      title: "Ce qui sort des cloisons (acte 3)",
      description:
        "Une Échouée sort du mur de la chapelle et va droit vers Lison. Elle ignore qui ne lui barre pas la route. Une lampe de ferrailleur braquée sur elle (action) lui impose le désavantage et l'empêche d'approcher à moins de 3 m du porteur. Le Chant d'Ambroise ou d'un Chantre la calme un tour par réussite d'Instinct DD 12. Elle s'efface si elle tombe à 0 PV, ou au lever du chant de Lison, si quelqu'un pense à le lui demander. Celle-ci est petite, née d'un saut raté récent : elle prend, elle ne casse pas, et son toucher laisse à 1 PV au lieu de 0.",
      enemies: [{ name: "Petite Échouée", count: 1, hp: 22, ac: 12, attack: "Toucher qui se souvient +4, 2d6 psychiques, JS Instinct DD 12 ou effrayé", danger: "Moyen" }],
      difficulty: "Difficile",
    },
    {
      title: "La corvette blanche (acte 4, combat spatial)",
      description:
        "Carte d'espace, Pie-Grièche contre Corvette de douane (coque 80, boucliers 30, CA 14, tourelle +5, 2d10). La Censeure tire d'abord pour désemparer, pas pour tuer. À la moitié de la coque, elle propose de nouveau la reddition. Si Rakka aborde la corvette, elle abat ses boucliers au premier round et prend le pont au troisième.",
      enemies: [
        { name: "Corvette de douane", count: 1, hp: 80, ac: 14, attack: "Tourelle de proue +5, 2d10", danger: "Élevé" },
        { name: "Rakka Sel-Noir (alliée possible, à bord de la corvette)", count: 1, hp: 30, ac: 14, attack: "Deux lames vibrantes +4, 1d8+2 tranchants", danger: "Moyen" },
      ],
      difficulty: "Difficile (fuite possible)",
    },
  ],
  twists: [
    "Coquerel est à bord de la corvette, payé pour reconnaître la caisse. Rakka Sel-Noir le cherche pour la Vieille Mère : la Main Close règle ses traîtres elle-même, et l'équipage qui l'aide gagne une amie à quatre bras.",
    "La Censeure connaît Lison. Elle l'a laissée s'enfuir il y a deux mois, en mentant à son supérieur. Elle est venue la reprendre avant que d'autres ne le fassent, et elle croit la protéger. On peut la retourner, pas l'acheter.",
    "Le Phare de Gué-d'Ambre s'éteint chaque nuit à la même seconde de la troisième heure. Les vieux pilotes accusent l'Orgue ; un personnage qui chronomètre (Investigation DD 13) remarque seulement que c'est réglé comme une respiration. Ne l'explique pas.",
    "Sous la pierre de la chapelle, Ambroise entend quelqu'un respirer. Lison aussi. Elle dit : « Il dort mal. »",
  ],
  rewards: [
    "La mensualité effacée par Coquerel, ou par la Vieille Mère elle-même si l'équipage lui ramène le traître, et alors la suivante aussi.",
    "La prime de la Censeure si on lui livre la lame et l'enfant : 20 000 lumens, de quoi solder la moitié du cargo, et un nom inscrit sur une liste à Solenne.",
    "Si la lame reste à l'équipage : 50 000 lumens au marché noir, et tout l'Archipel aux trousses. Ou une lame-diapason pour le Chantre du groupe.",
    "Réputation 1 auprès des Chantres si Ambroise et Lison partent libres vers Ancre : une adresse à Hautes-Combes, et le diapason gravé sous les tables qui ouvre les portes des fidèles.",
    "Rakka Sel-Noir doit une dette d'honneur à l'équipage s'il l'a aidée à prendre Coquerel.",
    "Une pièce de la Sainte-Patience pour la Pie-Grièche (Tante Escarbille vend à prix d'ami si on l'a payée) : un compensateur neuf, qui efface le défaut « le compensateur tousse ».",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : l'équipage est endetté et chaque choix a un prix en lumens ; chanter et entendre la pierre est un crime, et ceux qui le traquent ne sont pas tous des monstres ; les Phares vont mal (le clignotement, la respiration sous la chapelle).

Durée : environ 3 h 30. Mise en place : 10 minutes. Acte 1 : 50 minutes. Acte 2 : 25 minutes. Acte 3 : 1 h 05. Acte 4 : 1 heure. Si la soirée file, saute les pillards de la rampe (l'indice passe par la bague de Coquerel) et raccourcis le Péage à une seule question de la Censeure.

Le vaisseau. Sors la Pie-Grièche dans l'onglet Vaisseaux avant la séance (modèle Cargo léger, équipage du groupe), et la Corvette de douane, cachée. Au début de l'acte 4, pose une carte d'espace, pose les deux vaisseaux, montre la corvette. Chaque joueur met son personnage à un poste dans l'onglet Vaisseau ; « Nouveau round » à chaque tour du combat.

La Censeure. Elle parle à voix basse, pose chaque phrase comme une pièce sur une table, et ne s'énerve jamais devant témoins. Sa meilleure réplique : « Les orphelinats nourrissent trois fois par jour. Vos caves, combien de fois ? » Si un personnage lui parle de Lison par son prénom, elle baisse sa perche.

Le choix final. Trois issues, toutes jouables : livrer la lame et l'enfant (l'argent, la honte, et un Censeur qui se souviendra d'eux comme de gens raisonnables) ; les remettre à Ambroise (la mensualité effacée, la Censeure en ennemie personnelle, l'amitié des Chantres) ; garder la lame (cinquante mille lumens et tout le monde aux trousses). Ne pousse vers aucune.

Sur Discord. Le décor passe par le son : la poussière qui crisse sous les bottes, le bourdonnement de l'Orgue qui fait vibrer les dents, le silence d'une épave dont les cloisons craquent. Pour Lison, fredonne une seule note tenue.

Règles du monde. La jauge des Phares allumés commence à 131 et ne bouge pas ici, sauf si quelqu'un force un saut à pleine puissance (−1). Un Chantre de l'équipage gagne de l'Écho à chaque chant ; près de la chapelle, chaque chant fait sortir l'Échouée plus vite.

Expérience : environ 300 XP par personnage si tous les combats ont lieu. Fais passer le groupe au niveau 2 à la fin, quel que soit le choix.`,
  readAloud: [
    {
      act: 1,
      title: "Le quai numéro neuf",
      text: "La poussière de Gué-d'Ambre est orange et fine comme de la farine : elle entre dans les filtres, dans les bottes, dans les dents. Le quai numéro neuf est une dalle de terre cuite fendue, entre deux cargos qui fument. Au pied de votre rampe, un homme en gilet de soie compte sur ses doigts, et ses bagues tintent à chaque chiffre. Derrière lui, deux Tarrak tiennent chacun une lampe et ne disent rien. « Deux mille, mon petit. Ce soir. La Vieille Mère n'aime pas attendre, et moi, j'aime encore moins qu'elle attende. »",
    },
    {
      act: 2,
      title: "Le Phare",
      text: "Le Phare de Gué-d'Ambre sort du sable : une spirale de pierre pâle haute de deux kilomètres, enfoncée dans la dune jusqu'aux premiers tuyaux de l'Orgue, et sur son flanc, l'Orgue, noir, hérissé de tuyaux. Une file de vaisseaux tourne autour, feux allumés. Vous attendez votre tour depuis une heure, et c'est la troisième heure de la nuit, quand ça arrive : la lumière qui court dans la spirale faiblit, s'éteint, une seconde, deux. Sur la fréquence commune, quelqu'un jure, quelqu'un prie. Puis la lumière revient, et la file reprend sa ronde comme si de rien n'était.",
    },
    {
      act: 3,
      title: "La Sainte-Patience",
      text: "Dans la nébuleuse, tout est rouge, même le noir. La Sainte-Patience flotte de travers, longue comme un quartier, la coque ouverte d'un côté sur trois ponts. Dans les dortoirs, des couchettes d'enfant, des dizaines, sanglées, les couvertures pliées au carré et grises de givre. Au bout de la coursive, une porte ronde, et derrière, une chapelle aux murs de pierre pâle ; le mur du fond a été découpé au chalumeau, et on voit le vide par le trou. Quand la caisse passe la porte, quelque chose bourdonne dans les vitres de vos casques.",
    },
    {
      act: 4,
      title: "La corvette",
      text: "Elle sort du saut à mille mètres, toute blanche, la tour couronnée peinte sur le flanc. Une voix de femme, calme, sur toutes les fréquences : « Pie-Grièche, ici les Censeurs. Soute deux, s'il vous plaît. Et ce que la caisse protège. Vous avez trois minutes avant que je ne sois obligée de compter à voix haute. » Derrière elle, entre deux épaves, un autre cargo, cabossé, qui ne bouge pas.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "L'arrangement de Coquerel",
      options: [
        { label: "Accepter la caisse", consequence: "La mensualité est suspendue trois jours. L'équipage garde ses 600 lumens : 300 pour un Péage, 100 pour Tante Escarbille, le reste pour le carburant du retour." },
        { label: "Refuser", consequence: "Coquerel saisit la soute. Le lendemain, Rakka Sel-Noir propose la même caisse contre un mois de délai, et elle cherche déjà Coquerel : l'acte 4 la met dans le camp de l'équipage." },
      ],
    },
    {
      act: 3,
      title: "Tante Escarbille",
      options: [
        { label: "Payer 100 lumens", consequence: "Passage libre, et elle vend plus tard un compensateur neuf à prix d'ami." },
        { label: "Payer en service", consequence: "Elle veut les rations, ou une heure du mécanicien sur son remorqueur. Elle devient une amie de tas, et elle parle." },
        { label: "Forcer le passage", consequence: "Jouer « Le droit de passage ». Escarbille vend la position de la Pie-Grièche à la Censeure, qui arrive un round plus tôt." },
      ],
    },
    {
      act: 2,
      title: "Le passage du Phare",
      options: [
        { label: "Payer le Péage et l'inspection", consequence: "300 lumens. La Censeure fait ouvrir la soute : cacher la caisse (Discrétion DD 14), mentir (Tromperie DD 15) ou la laisser bourdonner. Si elle la trouve, elle la laisse passer et suit le cargo : elle veut le destinataire." },
        { label: "Sauter en resquille", consequence: "Test de pilotage (Réflexes DD 13). Réussi : personne ne sait où ils sont allés, sauf Coquerel. Raté : la Pie-Grièche sort du saut secouée, 2d10 à la coque, et le Phare clignote derrière elle (jauge −1 si un joueur a demandé de forcer)." },
      ],
    },
    {
      act: 4,
      title: "La lame et l'enfant",
      options: [
        { label: "Les livrer à la Censeure", consequence: "20 000 lumens. Ambroise est arrêté, Lison retourne à l'orphelinat. La Censeure note les noms de l'équipage comme « collaborateurs » : utile plus tard, et lourd à porter." },
        { label: "Les remettre à Frère Ambroise", consequence: "La mensualité est effacée et Ambroise part vers Ancre avec Lison, si l'équipage le couvre. La Censeure les compte désormais parmi ses affaires personnelles. Réputation 1 auprès des Chantres." },
        { label: "Garder la lame", consequence: "Cinquante mille lumens au marché noir, ou une arme pour le Chantre du groupe. La Main Close, les Censeurs et Ambroise les cherchent. Lison choisit seule où elle va : avec eux." },
        { label: "Livrer Coquerel à Rakka", consequence: "Possible en plus de tout le reste. Rakka emmène le traître à la Vieille Mère, efface la mensualité suivante et doit une dette d'honneur à l'équipage." },
      ],
    },
  ],
  mapHint: {
    kind: "espace",
    seed: 1214,
    name: "Les Brisants, autour de la Sainte-Patience",
    width: 46,
    height: 36,
    labels: ["Phare des Brisants", "La Sainte-Patience"],
  },
};
