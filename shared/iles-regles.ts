// Règles propres aux Îles du Vent (pirates, Antilles, 1716), lues par les joueurs dans le livre en ligne.
// Rien de secret. Le Moral du navire et la Chance tiennent la place du surnaturel ; l'argent se compte en piastres et en livres tournois.
// La réserve du MJ (les Grains) est exportée à part : elle appartient au guide du MJ, pas aux règles que lisent les joueurs.
import type { RuleSection } from "./rules";

/** Les Grains : la réserve du MJ. Utilisée par le canon (shared/canon/pirates.ts), jamais par le code des joueurs. */
export const GRAINS_MAX = 4;
export const REGLE_DES_GRAINS =
  "Chaque jeton de Chance dépensé par un joueur donne un Grain au MJ (quatre au plus). Il en dépense un pour faire tourner le vent au mauvais moment, faire apparaître une voile à l'horizon, ou faire parler un meneur dans l'équipage.";

export const REGLES_ILES: RuleSection[] = [
  {
    id: "pi-moral",
    title: "Le navire et son Moral",
    body: [
      "Dans les Îles, on ne fait rien seul. Le groupe a un navire, et le navire a un équipage. L'équipage a un Moral, de 0 à 10, noté sur la fiche du navire. Le Moral part à 6.",
      "Comment il monte :",
      "- +1 quand on partage une prise selon la chasse-partie, et que personne n'a de raison de se plaindre (un partage juste).",
      "- +1 quand on gagne un combat sans perdre un seul homme.",
      "- +1 quand on fait escale dans un port ami. Ce bonus ne joue qu'une fois par semaine de jeu.",
      "Comment il baisse :",
      "- −1 par semaine de jeu de retard sur un partage qu'on a promis.",
      "- −1 après un combat qui coûte au moins un homme à l'équipage, −2 si l'équipage en perd plus de cinq.",
      "- −2 quand le capitaine ment à l'équipage et que cela se sait.",
      "Un homme perdu, c'est un homme mort ou laissé à terre. Un blessé que le chirurgien garde en vie à bord n'est pas perdu.",
      "Le Moral ne remonte jamais tout seul, et il ne dépasse pas 10. Une semaine de jeu = une séance, ou sept jours de récit si la séance en couvre plusieurs.",
    ],
  },
  {
    id: "pi-moral-donne",
    title: "Ce que donne le Moral",
    body: [
      "- 8 ou plus : l'équipage suit sans discuter. Avantage aux tests de manœuvre du navire.",
      "- 4 à 7 : l'équipage fait son travail.",
      "- 2 à 3 : on murmure. Désavantage aux tests de manœuvre, et le MJ peut faire parler un meneur dans l'équipage.",
      "- 0 à 1 : mutinerie imminente. Le groupe a une scène pour reprendre la main : un discours, un partage immédiat, le sacrifice d'un meneur. Sinon l'équipage choisit un autre capitaine, ou débarque le groupe à la première terre.",
      "Un test de manœuvre, c'est tout ce qu'on demande au navire et à ceux qui le tiennent : tenir la barre, border les voiles, virer, se placer sous le vent, prendre en chasse, échapper. Il se fait avec Survie pour la route, Athlétisme ou Acrobaties pour la mise en œuvre, au choix du MJ selon l'ordre donné.",
    ],
  },
  {
    id: "pi-coup-de-main",
    title: "Ce que coûte un coup de main",
    body: [
      "Il n'y a rien de surnaturel dans les Îles. Il y a des capitaines, des canonniers, des gabiers qui tirent de leurs hommes plus qu'ils ne devraient. Certains pouvoirs de classe portent la mention « Coup de main » : une manœuvre audacieuse, un abordage sous le feu, une ruse qui exige que tout l'équipage suive.",
      "- Chaque coup de main coûte 1 point de Moral au navire.",
      "- Un seul coup de main par scène, pour tout le navire, quel que soit le nombre de personnages qui en ont un.",
      "- On ne peut pas faire de coup de main quand le Moral est à 1 ou à 0 : l'équipage ne suit plus.",
      "- Chaque pouvoir de ce genre se refait après un repos long, comme les autres grands pouvoirs. Mais le Moral, lui, ne se refait pas.",
      "Un coup de main réussi ne rend pas le Moral. Il a servi, et ça se paie.",
    ],
  },
  {
    id: "pi-captifs",
    title: "Les captifs ne sont pas une prise",
    body: [
      "Une cargaison de captifs n'est pas une prise. Elle ne se partage pas, ne rapporte ni piastres ni Moral, et n'a pas de prix dans ce livre.",
      "Les Antilles de 1716 sont un monde d'esclavage : les plantations, la traite et les marrons sont là, et le jeu ne le cache pas. Le groupe décide de ce que devient une telle cargaison (la déposer à terre, la libérer, l'emmener quelque part) et c'est une scène à jouer, avec des personnes qui ont un nom, des raisons et leur mot à dire. Ce n'est jamais un butin.",
      "Aucun personnage n'est obligé de prendre part à la traite, et le jeu ne la récompense jamais.",
    ],
  },
  {
    id: "pi-chance",
    title: "La Chance",
    body: [
      "Les marins sont superstitieux. Chaque personnage a une Chance : un nombre de jetons, de 0 à 3. Tout le monde commence à 1. Note-la sur ta fiche.",
      "- Tu gagnes un jeton en respectant une coutume qui te coûte quelque chose : verser ta ration de tafia à la mer, perdre ton tour pour toucher le mât avant l'abordage, ne pas siffler à bord, laisser la première part de la prise aux morts. Le MJ juge si la coutume coûte vraiment. Au plus un jeton gagné ainsi par séance et par personnage.",
      "- Tu dépenses un jeton pour relancer un de tes jets (attaque, sauvegarde ou compétence). Tu gardes le second résultat, même s'il est pire.",
      "- Un jeton ne se prête pas, et il ne se dépense pas sur le jet d'un autre.",
      "Personne ne sait si ça marche. Tout le monde le fait.",
    ],
  },
  {
    id: "pi-partage",
    title: "La chasse-partie",
    body: [
      "Chaque équipage signe sa chasse-partie avant d'appareiller : le pacte qui dit qui commande, qui touche quoi, et ce que devient un homme blessé. On la lit à voix haute, article par article, et à chaque article l'équipage dit oui.",
      "Le partage se fait en parts. Une part pour chaque matelot, deux pour le capitaine, une et demie pour le quartier-maître, une et un quart pour le chirurgien, le canonnier, le charpentier et le maître de manœuvre. Un tiers de la prise va d'abord à l'armement du navire (la poudre, les vivres, la réparation), le reste se partage entre les parts.",
      "La chasse-partie dit aussi ce que vaut un membre perdu. Un barème courant : un œil, 100 piastres ; une main, 400 ; une jambe, 500 ; les deux jambes, 800. Cela se prélève avant le partage, sur la prise commune.",
      "Le partage est juste quand il est fait devant tout l'équipage, compte à voix haute, sans que personne ne soit lésé : c'est lui qui donne +1 de Moral. Tout ce qui est partagé est une prise de mer, de la marchandise, de l'argent, des armes. Jamais des personnes.",
    ],
  },
  {
    id: "pi-naviguer",
    title: "Naviguer",
    body: [
      "On mesure les distances en jours de mer, et le vent décide de tout. De la Martinique à Saint-Domingue, cinq jours avec les alizés dans le dos ; quinze jours et plus pour remonter.",
      "Le brigantin, la goélette et le sloop sont les navires des pirates ; le galion et la frégate sont ceux des rois. Un sloop fait de quatre à huit nœuds, soit de quarante à soixante lieues par jour par bon vent. Une lieue marine vaut un peu plus de cinq kilomètres et demi.",
      "On trouve sa latitude au soleil, avec l'arbalète de Jacob ou le quartier de Davis, et on devine sa longitude à l'estime, au loch et au compas. Se perdre est ordinaire. Un test de Survie du pilote fixe la dérive : DD 10 par temps clair, DD 15 sous la pluie ou la nuit, DD 20 par grain.",
      "Les ouragans viennent d'août à octobre. Un navire pris par un ouragan sans abri fait un test de manœuvre DD 15 chaque jour ; un échec coûte de la voilure, un échec de plus de 5 coûte un mât.",
      "Un équipage a besoin d'eau douce et de vivres : comptez une ration par homme et par jour, et un baril d'eau pour trente hommes et trois jours. À court de rations, le Moral baisse de 1 par jour.",
    ],
  },
  {
    id: "pi-argent",
    title: "L'argent de 1716",
    body: [
      "La piastre espagnole, le « huit » (huit réaux), vaut autour de quatre livres et demie tournois. La livre tournois se divise en vingt sous. On ne trouve guère d'autre monnaie d'argent, et chaque nation compte à sa façon : à l'Anse-aux-Lames on te dira le prix en piastres ou en livres, à Kingston en livres sterling. Quelques prix :",
      "| Quoi | Prix",
      "| Un repas à l'auberge | 1 réal",
      "| Une nuit à l'auberge | 2 réaux",
      "| Un pot de tafia | 1 réal",
      "| Un pistolet à silex | 3 piastres",
      "| Un sabre d'abordage | 2 piastres",
      "| Un mousquet | 6 piastres",
      "| Un fusil boucanier | 10 piastres",
      "| Un tromblon | 5 piastres",
      "| Une grenade de fer | 1 piastre",
      "| Une grenade de terre cuite | 4 réaux",
      "| Un coutelas | 1 piastre",
      "| Une hache d'abordage | 2 piastres",
      "| Un poignard | 4 réaux",
      "| Vingt charges de poudre et de plomb | 1 piastre",
      "| Un justaucorps de buffle | 4 piastres",
      "| Une veste de cuir | 2 piastres",
      "| Un sloop d'occasion | 800 piastres",
      "| Une part de prise, pour un simple matelot | de 10 à 1 000 piastres",
      "Au départ, tu prends la plus haute des sommes de ta classe, de ton origine et de ton historique, pas leur total.",
      "Un matelot qui s'équipe d'un pistolet et d'un sabre dépense cinq piastres : c'est le prix de dix nuits à l'auberge. Une dette d'honneur, un service rendu ou une parole donnée valent parfois plus qu'une pièce.",
    ],
  },
  {
    id: "pi-armes",
    title: "Les armes de 1715",
    body: [
      "Toutes les armes de cette table sont des armes courantes pour toutes les classes. Les canons, sur les navires et dans les forts, relèvent du combat naval.",
      "| Arme | Dégâts | Portée | Propriétés | Prix",
      "| Pistolet à silex | 1d10 perforants | 9/27 m | un coup, rechargement long | 3 piastres",
      "| Mousquet | 1d12 perforants | 12/36 m | un coup, rechargement long, deux mains | 6 piastres",
      "| Fusil boucanier | 1d12 perforants | 18/54 m | un coup, rechargement long, deux mains, lourd | 10 piastres",
      "| Tromblon | 2d6 perforants | 6/18 m | un coup, rechargement long, deux mains | 5 piastres",
      "| Sabre d'abordage | 1d8 tranchants | contact | finesse | 2 piastres",
      "| Coutelas | 1d6 tranchants | contact | léger | 1 piastre",
      "| Hache d'abordage | 1d8 tranchants | contact | polyvalente (1d10) | 2 piastres",
      "| Poignard | 1d4 perforants | contact, 6/18 m | léger, finesse, lancer | 4 réaux",
      "| Grenade de fer | 2d6 perforants, rayon 3 m | 9 m | un usage, mèche | 1 piastre",
      "| Grenade de terre cuite | 1d6 contondants, rayon 3 m | 9 m | un usage, mèche, enflamme | 4 réaux",
      "Un coup, puis recharger. Une arme à feu tire un seul coup. La recharger prend une action entière, hors combat comme pendant : on verse la poudre, on bourre, on met la balle, on amorce. Pas d'action bonus, pas d'attaque à la volée. C'est pourquoi les pirates portent deux, quatre, six pistolets chargés à l'avance en bandoulière.",
      "Dégainer ou ranger une arme est une interaction d'objet. Un personnage a au plus deux armes en main. Avec Attaque supplémentaire, on peut tirer deux armes chargées différentes dans la même action Attaquer.",
      "Sur un 1 naturel au d20, l'arme à feu fait long feu : l'attaque rate, et l'arme est à amorcer de nouveau. L'eau fait pire : une arme à feu mouillée (plongeon, grain, embarcation retournée) ne tire plus avant d'avoir été séchée et rechargée.",
      "Les charges : vingt charges de poudre et de plomb pèsent un kilo et coûtent une piastre. Un personnage en porte autant que ses poches le permettent ; le MJ compte celles qu'il dit manquer. Sur un ennemi tombé, on pille 1d6 charges.",
      "Grenades. Allumer la mèche et lancer la grenade prend une action. Qui n'a pas de mèche allumée à portée de main perd une action de plus à en allumer une. Toute créature dans le rayon fait une sauvegarde d'Adresse : DD 12 pour la grenade de fer, DD 11 pour celle de terre cuite ; elle subit la moitié des dégâts si elle réussit. La terre cuite met le feu à ce qui brûle (voiles, toile goudronnée, paille).",
    ],
  },
  {
    id: "pi-armures",
    title: "Ce qu'on porte sur le dos",
    body: [
      "Il n'y a pas d'armure lourde sous les tropiques, et presque personne ne porte de métal. Ce qui protège, c'est le cuir, le buffle et la toile épaisse.",
      "| Tenue | CA | Remarques",
      "| Chemise et culotte de toile | 10 + Adresse | rien de plus",
      "| Veste de cuir | 11 + Adresse | légère",
      "| Justaucorps de buffle | 12 + Adresse | légère, la tenue des boucaniers et des capitaines",
      "| Cuirasse | 14 + Adresse (au plus 2) | surtout aux soldats du roi ; désavantage en Discrétion",
      "Qui tombe à l'eau en cuirasse coule. Il faut une action et un test de Force DD 15 pour la défaire.",
      "Il n'y a pas de bouclier sur un pont de navire : on n'a pas assez de mains.",
    ],
  },
  {
    id: "pi-fievres",
    title: "Les fièvres et le mal de Siam",
    body: [
      "Dans les Îles, la fièvre tue plus de monde que les boulets. Le mal de Siam (la fièvre jaune) rôde dans les ports bas, en saison des pluies, et sur les navires qui ont longtemps mouillé près des mangroves.",
      "Quand le groupe passe plus d'une semaine de jeu dans un port bas ou près d'une mangrove en saison des pluies, chaque personnage fait une sauvegarde d'Endurance DD 11. Qui échoue gagne un niveau d'épuisement et une fièvre : il ne peut pas le perdre avant d'avoir reçu les soins d'un chirurgien (test de Médecine DD 13) puis un repos long.",
      "Le scorbut menace après trois semaines de mer sans vivres frais : un niveau d'épuisement par semaine de plus, jusqu'à une escale. Les agrumes et le quinquina aident ; le tafia, non, quoi qu'en pensent les marins.",
      "Un chirurgien de bord est plus précieux qu'un canon : sans lui, une blessure grave se paie en hommes, donc en Moral.",
    ],
  },
];
