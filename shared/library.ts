// Bibliothèque de scénarios écrits à la main.
// Contrairement aux scénarios tirés au hasard, ceux-ci sont prêts à jouer : textes à lire, choix, carte proposée.
import { MENSUALITE } from "./library-archipel";
import { NUMERO_ONZE } from "./library-noyes";
import { AVIS_DE_SIX_HEURES } from "./library-residence";
import { PONT_D_ARAMON } from "./library-sec";
import { DEUX_SOUVENIRS } from "./library-ternelande";
import type { Scenario } from "./types";

/** Campagne fantasy « Le Trône du Dieu Mort », scénario 1 : ouverture, niveau 1. */
const TOURBE: Scenario = {
  id: "bib-fantasy-tourbe",
  title: "Ce que rend la tourbe",
  genre: "fantasy",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Un apprenti cloueur est parti il y a six jours pour Gué-Saulnier, un village sur pilotis des Noyes où les vieux morts sortent de la tourbe. Il devait rentrer en trois. Sa maîtresse paie dix pièces d'or par tête pour qu'on le ramène, debout ou couché.",
  synopsis:
    "Printemps de l'an 7 du Glas. Le dégel a ramolli la tourbière de Gué-Saulnier, où les Noyois enterrent leurs morts depuis mille ans. Les Noyés sortent de l'eau par dizaines, la peau tannée comme du vieux cuir, et marchent tous vers l'est, vers Aube-Close. Le village leur barre la route sans le savoir : le sergent Brasque, recruteur de la Générale Hersende, a fait planter une palissade à l'est des pilotis, et les morts passent donc par les maisons. Sur la place, deux héritiers se disputent le village par hommes interposés. Brasque veut brûler la tourbière ; le vicaire Gaudru, envoyé du Grand Prêtre Cyprien, excommuniera quiconque y met le feu. Pendant qu'ils se crient dessus, Hubert Lescot, le passeur, arrache la nuit les clous des vieilles tombes. Il est des Attendants, et la voix de sa femme noyée lui a promis que le Dieu se relèvera quand assez de morts auront rejoint la Marche. Les personnages retrouvent l'apprenti, démasquent le passeur, puis décident à l'aube de ce qu'on fait des Noyés : les brûler, les clouer un par un, ou les laisser passer.",
  acts: [
    {
      title: "La loge des cloueurs",
      location: "Saint-Ferréol-des-Joncs, puis la grande passerelle des Noyes",
      summary:
        "Bastienne Crolle recrute les personnages à la loge de la Confrérie du Dernier Clou : 10 po chacun au retour, et un clou à l'oreille si Colin revient vivant. Elle leur donne la liste de Colin (« 20 clous, 1 poche de sel, 1 marteau, rentrer jeudi ») et le nom du passeur de Gué-Saulnier. Trois heures de marche sur la passerelle. À mi-chemin, trois Levés arrivent en face, en file, du même pas. Si les personnages descendent dans l'eau pour leur laisser la place, les morts passent sans les toucher. S'ils bloquent les planches, c'est le combat. Dans les deux cas, ils viennent d'apprendre la première règle du monde : les morts vont à l'est et ne s'en prennent qu'à ce qui les gêne. Compter 40 minutes.",
    },
    {
      title: "Gué-Saulnier",
      location: "Le village sur pilotis, la place de planches et le vieux débarcadère",
      summary:
        "Le passeur Hubert Lescot leur fait franchir le dernier bras d'eau, aimable, bavard, et refuse leur argent. Sur la place, Brasque et Gaudru se disputent une rangée de tonneaux de poix. Chacun prend ensuite les personnages à part pour les gagner à sa cause. Mère Gisle les mène au vieux débarcadère : Colin y est cloué au pilotis par les manches, vivant, à côté d'une gravure en ancienne langue que Gisle traduit (« Ils ne nous laissent pas descendre »). Dans sa sacoche, sa carte : il a tracé à la règle la route de chaque Noyé croisé, et toutes les lignes filent vers l'est. La nuit, les Noyés cognent contre la palissade puis passent par les maisons : combat des pilotis. Indices sur le passeur, à semer pendant l'acte : de la boue de tourbière sur sa gaffe, alors qu'aucun voyageur ne va par là ; un sac de vieux clous rouillés sous le plancher de sa barge ; le bracelet de jonc tressé des Attendants à son poignet ; la tombe vide de sa femme ; Colin qui se souvient « d'une perche et d'un bracelet ». Compter 1 h 15.",
    },
    {
      title: "Le Champ des Mottes",
      location: "L'îlot funéraire au milieu de la tourbière",
      summary:
        "On y va la nuit en filant Lescot, ou à l'aube en suivant le sillage de sa barge (Survie DD 12). Il arrache les clous des plus vieilles tombes avec sa gaffe, aidé de son neveu Jacquet. Maëlle, sa femme noyée il y a deux hivers, se tient près de lui, debout dans l'eau : il ne l'a jamais clouée. Si on lui parle avant de frapper, Lescot répond volontiers. La voix de Maëlle lui a dit où creuser, et que le Dieu se relèvera quand la route sera pleine. Il se bat dès qu'on touche à sa femme et tente de fuir sur sa barge sous la moitié de ses PV. Détruite, Maëlle dit « À bientôt » avec la voix d'un mort qu'un des personnages a aimé. Les personnages décident ensuite du sort du passeur. Compter 50 minutes.",
    },
    {
      title: "Ce qu'on fait des morts",
      location: "La roselière et la palissade de l'est, à l'aube",
      summary:
        "Une cinquantaine de Noyés attendent dans la roselière, face à la palissade, de l'eau jusqu'à la taille. Ils n'attaquent pas. Leur chef, l'Aïeul, que la famille de Mère Gisle vénère depuis neuf générations, parle en ancienne langue, et Gisle traduit. Brasque veut mettre le feu tout de suite, le vent est bon. Gaudru se plante en travers de la passerelle. Mère Gisle demande qu'on ouvre la palissade. Le village fera ce que diront les personnages : ils ont ramené Colin et démasqué le passeur, on les écoute. Voir « Les choix » pour les conséquences. Compter 45 minutes.",
    },
  ],
  villain: {
    name: "Hubert Lescot, le passeur",
    motivation:
      "rejoindre Maëlle, sa femme noyée il y a deux hivers, et pousser le plus de morts possible sur la Marche, parce que la voix de Maëlle lui a promis que le Dieu se relèvera quand la route sera pleine",
    description:
      "Cinquante ans, grand et voûté, une barbe grise taillée court, les mains crevassées par la perche. Il fait traverser les voyageurs sur sa barge plate pour un sou et une prière, et il parle de sa femme au présent. Il porte au poignet droit un bracelet de jonc tressé, le signe des Attendants. Il n'a rien d'un fou : il est poli, il écoute, il offre la goutte. Il fredonne la chanson de son mariage quand il travaille.",
  },
  npcs: [
    {
      name: "Bastienne Crolle",
      role: "Maîtresse-cloueuse de la loge de Saint-Ferréol, commanditaire",
      secret:
        "Elle a envoyé Colin seul parce que le vicaire Gaudru lui a fait savoir que la Confrérie n'était pas la bienvenue à Gué-Saulnier, et qu'elle n'a pas voulu risquer un compagnon. Elle s'en veut. Elle ne le dira jamais, mais elle paiera le double si Colin revient sans une égratignure.",
      voice:
        "Trois encoches sur le clou de l'oreille. Mâche du goudron de pin. Tape sur la table à chaque mot quand elle s'énerve : « Un. Clou. Par. Talon. »",
    },
    {
      name: "Colin Ferrat",
      role: "Apprenti cloueur, dix-sept ans, celui qu'on cherche",
      secret:
        "Il a surpris le passeur en train d'arracher des clous, a pris un coup de gaffe dans la nuque et ne se souvient que d'une perche et d'un bracelet. Il croit qu'un Noyé a voulu le crucifier. En vérité, le Noyé l'a sorti de l'eau et l'a cloué par les manches pour qu'il ne se noie pas.",
      voice: "Claque des dents. Compte tout à voix haute : les clous, les marches, les morts. « Trente-deux. Ils étaient trente-deux. »",
    },
    {
      name: "Sergent Odon Brasque",
      role: "Recruteur de la Générale Hersende, quatre recrues de quinze ans avec lui",
      secret:
        "Ses ordres, signés de la main de Hersende, tiennent en deux lignes : « Brûle ce qui bouge sous la tourbe. Recrute ce qui marche dessus. » Il doit ramener six garçons à la légion avant la fin du mois. C'est lui qui a fait planter la palissade de l'est, et c'est elle qui fait passer les morts par le village. Il ne le sait pas.",
      voice:
        "Manteau rouge délavé, une cicatrice au menton qu'il gratte quand on le contredit. Imite la Générale sans s'en rendre compte : finit ses phrases par « Compris ? ». Dit « la Générale » comme on dit « ma mère ».",
    },
    {
      name: "Frère Anthelme Gaudru",
      role: "Vicaire envoyé par le Grand Prêtre Cyprien",
      secret:
        "Il porte une lettre scellée de cire blanche : il doit dresser la liste des enfants du village « qui entendent des voix la nuit » et l'envoyer à Aube-Close. Il ne sait pas pourquoi et n'ose pas se le demander. Pépin, neuf ans, le fils du tonnelier, entend une dame qui lui parle la nuit.",
      voice:
        "Jeune, rond, transpire sous sa robe de lin. Cite le Code comme on lance une pierre : « Article 4, mon fils. Le mort appartient au Dieu. » Bénit tout ce qu'il touche, même la soupe. Baisse la voix pour dire « le Grand Prêtre ».",
    },
    {
      name: "Mère Gisle",
      role: "Doyenne de Gué-Saulnier, vieille de la Mère Tourbe, petite gens",
      secret:
        "Elle lit l'ancienne langue, apprise de sa grand-mère, et elle a reconnu l'Aïeul dans la roselière : sa famille dépose du miel sur sa tombe depuis neuf générations. Elle refuse qu'on le brûle. Elle sait aussi que Lescot n'a jamais cloué sa femme, et elle s'est tue par pitié. Son propre fils est sur la liste de Brasque.",
      voice:
        "Un mètre de haut, pipe en terre toujours éteinte. Appelle tout le monde « mon petit », le sergent compris. Parle des morts comme du temps qu'il fait : « Il en est sorti six cette nuit. Ça va se lever vers midi. »",
    },
  ],
  encounters: [
    {
      title: "Ceux qui marchent tout droit (acte 1)",
      description:
        "Sur la passerelle, large de deux cases, trois Levés arrivent de l'ouest en file. Ils avancent de 6 m par tour et n'attaquent que la créature qui leur barre le passage ou qui les frappe. Descendre dans la tourbière à côté des planches : terrain difficile, de l'eau jusqu'à la taille. Une créature qui tombe à l'eau doit réussir un jet de Force DD 10 pour remonter. Vigueur de mort-vivant : quand un Levé tombe à 0 PV, il fait un jet de Constitution DD 5 + dégâts subis ; s'il réussit, il reste à 1 PV (sauf dégâts radiants ou coup critique). Difficile si on se bat, rien du tout si on s'écarte.",
      enemies: [{ name: "Levé", count: 3, hp: 22, ac: 8, attack: "Coup +3, 1d6+1 contondant", danger: "Faible" }],
      difficulty: "Difficile (évitable)",
    },
    {
      title: "La nuit des pilotis (acte 2)",
      description:
        "Vers minuit, trois Noyés sortent de l'eau, buttent contre la palissade de l'est et la longent jusqu'aux maisons. Ils traversent une cabane où dort une famille. Noyé de tourbe : sa poigne agrippe (évasion DD 12) ; à son tour suivant, il traîne la cible agrippée de 1,5 m vers l'eau. Une cible agrippée dans l'eau profonde ne peut pas respirer. Les Noyés ne respirent pas et se déplacent dans l'eau sans pénalité. Deux recrues de Brasque (PV 11, CA 14, lance +3, 1d6+1) tiennent la palissade et paniquent au premier mort. Si les personnages se battent bien, Brasque leur propose de s'engager le soir même.",
      enemies: [{ name: "Noyé de tourbe", count: 3, hp: 16, ac: 11, attack: "Poigne +3, 1d6+1 contondant, agrippé", danger: "Moyen" }],
      difficulty: "Difficile",
    },
    {
      title: "Le passeur (acte 3)",
      description:
        "Au Champ des Mottes, de la tourbe ferme entourée d'eau peu profonde (terrain difficile). Lescot se tient à 3 m de sa barge. Gaffe : allonge 3 m ; sur un coup réussi, la cible fait un jet de Force DD 11 ou tombe à l'eau. Il fuit sur sa barge sous 8 PV. Maëlle, la noyée aux yeux gris, a les yeux couleur d'eau de vaisselle. Une fois par combat, elle parle à une créature à 9 m avec la voix d'un de ses morts : jet de Sagesse DD 11 ou charmée jusqu'à la fin de son prochain tour (elle n'attaque ni Maëlle ni Lescot). Détruite, elle dit « À bientôt » et s'effondre. Jacquet, le neveu, se bat en pleurant et se rend dès qu'il est blessé.",
      enemies: [
        { name: "Hubert Lescot", count: 1, hp: 16, ac: 11, attack: "Gaffe +3, 1d8+1 perforant, allonge 3 m", danger: "Moyen" },
        { name: "Maëlle, la noyée aux yeux gris", count: 1, hp: 22, ac: 11, attack: "Griffes +4, 1d6+2 nécrotique", danger: "Élevé" },
        { name: "Jacquet, Attendant", count: 1, hp: 7, ac: 10, attack: "Faucille +2, 1d4 tranchant", danger: "Faible" },
      ],
      difficulty: "Difficile",
    },
    {
      title: "Le clouage (acte 4, si les personnages choisissent de clouer)",
      description:
        "Il faut entrer dans la roselière et clouer les Noyés un par un. Épreuve de groupe : trois succès avant trois échecs, en Médecine, Religion ou Athlétisme DD 12, un jet par personnage et par tour. Un personnage qui maîtrise les outils de forgeron ou l'historique Cloueur a l'avantage. À chaque échec, un Noyé se réveille et attaque (deux au plus). Trois échecs : un villageois est entraîné sous l'eau et meurt, et il faudra le clouer lui aussi. L'Aïeul ne se défend pas. Il tend lui-même ses paumes.",
      enemies: [{ name: "Noyé éveillé", count: 2, hp: 16, ac: 11, attack: "Poigne +3, 1d6+1 contondant, agrippé", danger: "Moyen" }],
      difficulty: "Moyenne",
    },
  ],
  twists: [
    "Le Noyé a sauvé Colin. Les clous qui le tiennent au pilotis traversent ses manches et sa ceinture, jamais sa chair, et ce sont ceux de sa propre sacoche. On l'a mis hors de l'eau pour qu'il ne se noie pas. Les morts savent clouer.",
    "La palissade du sergent provoque les attaques. Les Noyés vont droit vers l'est ; la palissade leur barre la ligne, alors ils la longent et passent par les maisons. Un personnage qui suit les traces de vase (Survie DD 12) voit qu'elles vont toutes d'ouest en est, parfaitement droites, et ne dévient que devant les pieux.",
    "La voix qui parle à Lescot sait ce que seule Maëlle savait : le nom qu'elle donnait à leur barge (« la Grenouille »), la chanson de leur mariage. Lescot ne ment pas. Quelque chose lui parle : c'est Gorvan, le jumeau scellé. N'explique rien, les joueurs ne doivent pas l'apprendre avant longtemps.",
    "La lettre du vicaire demande la liste des enfants qui entendent des voix la nuit. Si les personnages la lisent, Pépin leur demande, l'air de rien, s'ils « entendent la dame aussi ».",
  ],
  rewards: [
    "10 po par personnage payées par Bastienne au retour, 20 po si Colin revient sans une égratignure. La Confrérie paie en plus 2 po par paire de talons cloués, sur présentation des clous.",
    "Le marteau de Colin, s'il est sauvé : marteau léger en fer froid forgé à la main, qui inflige 1d4 dégâts radiants supplémentaires aux morts-vivants, une fois par tour.",
    "La carte de Colin : les Noyes au trait, et dessus, à la règle, la route de trente-deux morts. Prolongées, toutes les lignes se croisent sur Aube-Close. Ne le dis pas : laisse un joueur prendre la règle.",
    "Le torque de l'Aïeul (bronze, 25 po, bien plus pour un antiquaire) : deux visages identiques gravés dos à dos, l'un les yeux ouverts, l'autre les yeux fermés.",
    "Réputation 1 auprès de la Confrérie du Dernier Clou : un clou à l'oreille, et le droit de dormir dans toutes ses loges.",
    "Selon le choix final : un sauf-conduit des légions signé de Brasque, une lettre de recommandation de Gaudru pour une audience à la Rotonde, ou deux potions de soins (le baume de tourbe de Mère Gisle) et l'amitié de tout le village.",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : les morts marchent tous vers l'est ; les héritiers se battent pour des villages pendant que les morts passent ; quelque chose, en bas, empêche les morts de descendre.

Durée : environ 3 h 30. Acte 1 : 40 minutes. Acte 2 : 1 h 15. Acte 3 : 50 minutes. Acte 4 : 45 minutes. Si la soirée file, saute le combat de la passerelle : les Levés passent à côté des personnages, et la leçon est la même.

Jouer les morts. Levés et Noyés marchent en ligne droite vers l'est, 6 m par tour, à travers l'eau, les haies et les maisons. Ils n'attaquent que ce qui leur barre la route ou ce qui les frappe. Montre-le par les gestes : un Noyé qui écarte un enfant de son chemin du revers de la main, sans lui faire de mal, en dit plus qu'une règle. Les joueurs doivent le comprendre seuls, de préférence après s'être battus pour rien.

Les héritiers. Hersende et Cyprien ne sont pas là, mais leurs hommes parlent en leur nom à chaque phrase. Fais se disputer Brasque et Gaudru devant les joueurs dès l'arrivée, puis demander chacun, en privé, que les personnages se rangent de leur côté. Ysé n'apparaît pas, mais les enfants du village jouent à « Levé, couché ! » et chantent sa comptine : « Couche-toi, couche-toi, la petite te voit. »

L'indice du sceau. Trois pièces, et tu ne les relies pour personne : la gravure (« Ils ne nous laissent pas descendre »), les lignes de la carte de Colin qui se croisent sur Aube-Close, et la phrase de l'Aïeul (« Celui qui était assis ne nous prend plus » : Ostral, qui recevait les morts sur son trône, ne le fait plus). Si un joueur propose une théorie, réponds « Peut-être », et note ce qu'il a dit. Tu en auras besoin dans dix séances.

Sur Discord. Le décor passe par le son : les planches qui grincent, l'eau contre les pilotis, la succion d'un pied qui sort de la tourbe. Les Noyés ne grognent pas, on n'entend que l'eau qui coule de leurs fourrures. Pour l'Aïeul, parle lentement, à mi-voix, dans une langue inventée, puis laisse Mère Gisle traduire avec ta voix normale.

Règles du monde. La jauge du Sceau commence à 100 et ne bouge pas ici. Aucun sort de niveau 4 à ce niveau : pas de Murmures. Un mort qu'on ne cloue pas se relève à la troisième nuit. Un mort cloué (un clou dans chaque talon, un dans chaque paume, du sel dans la bouche) reste couché neuf fois sur dix.

Expérience : environ 150 XP par personnage si tous les combats ont lieu. Fais passer le groupe au niveau 2 à la fin, quel que soit le choix.`,
  readAloud: [
    {
      act: 1,
      title: "La loge",
      text: "La loge de la Confrérie sent le goudron et la chaux. C'est une ancienne tannerie au bord du canal, et sur le mur du fond, quelqu'un a planté des centaines de clous tordus, en rangs, comme des trophées. Une femme large, en tablier de cuir, est assise derrière une table couverte de sel. Un clou lui traverse l'oreille gauche. Elle ne se lève pas. Elle pousse vers vous un papier plié en quatre. « Mon apprenti s'appelle Colin. Dix-sept ans, les oreilles décollées, il compte tout à voix haute. Il est parti pour Gué-Saulnier il y a six jours avec vingt clous et une poche de sel. Il devait rentrer jeudi. On est lundi. Ramenez-le. Debout ou couché, mais ramenez-le. »",
    },
    {
      act: 1,
      title: "La passerelle",
      text: "La passerelle a la largeur de deux hommes : des planches noires posées sur des pieux, et de chaque côté, une eau brune qui ne reflète rien. La brume monte jusqu'aux genoux. Au bout d'une heure, vous les voyez venir. Trois silhouettes avancent sur les planches, droit sur vous, du même pas, sans se presser. La première porte encore son tablier de boucher. Elles ne vous regardent pas. Elles regardent par-dessus votre épaule, vers l'est.",
    },
    {
      act: 2,
      title: "L'arrivée",
      text: "Gué-Saulnier tient debout sur quatre cents pilotis. Des maisons rondes aux toits de roseau, reliées par des passerelles qui grincent, et partout l'odeur de la fumée de tourbe, douce, un peu sucrée. Le passeur qui vous fait traverser le dernier bras d'eau chantonne en poussant sa perche. Sur la place, qui n'est qu'un grand plancher, deux hommes se crient dessus devant une rangée de tonneaux de poix. L'un porte un manteau rouge de légionnaire, l'autre une robe blanche trempée de sueur. Une trentaine de villageois écoutent, les bras croisés. Personne ne vous demande qui vous êtes.",
    },
    {
      act: 2,
      title: "Colin",
      text: "Sous le vieux débarcadère, là où l'eau est la plus noire, un garçon pend à un pilotis, les bras en croix, un mètre au-dessus de l'eau. Des clous de fer traversent ses manches et sa ceinture. Il respire. Il claque des dents si fort que vous l'entendez d'ici. À côté de sa tête, dans le bois, quelqu'un a gravé une ligne de signes anguleux, profonds, avec quelque chose de plus dur qu'un couteau. Le garçon ouvre un œil. « Trente-deux. Ils étaient trente-deux. Je les ai comptés. »",
    },
    {
      act: 3,
      title: "Le Champ des Mottes",
      text: "Le Champ des Mottes est une île de tourbe ferme au milieu de l'eau, hérissée de piquets. Chaque piquet marque une tombe, chaque tombe est une motte noire, plus haute que les autres. Il est minuit. Une lanterne sourde est posée par terre, et à sa lumière, un homme penché sur une tombe tire sur une longue gaffe, à deux mains, avec un bruit de succion. Il fredonne. Près de lui, une femme se tient debout, très droite, de l'eau jusqu'aux chevilles. Elle ne bouge pas. Ses cheveux sont pleins de lentilles d'eau.",
    },
    {
      act: 4,
      title: "L'aube",
      text: "L'aube se lève blanche sur la roselière. Depuis la palissade, vous les comptez : quarante, peut-être cinquante silhouettes debout dans l'eau jusqu'à la taille, entre les joncs. Leur peau a la couleur d'une vieille selle. Certains portent encore des bracelets de bronze, des fourrures pourries, une lance sans fer. Ils regardent tous vers l'est, vers les pieux. Au premier rang, le plus grand lève la main, lentement, et prononce une phrase dans une langue que plus personne ne parle ici. Sauf Mère Gisle, qui retire la pipe de sa bouche.",
    },
    {
      act: 4,
      title: "Ce que dit l'Aïeul (voix de Mère Gisle)",
      text: "« Il dit : laissez-nous passer. » Elle écoute encore, la tête penchée. « Il dit : on ne nous laisse pas descendre. Et il dit que celui qui était assis ne nous prend plus. » Elle remet sa pipe entre ses dents. « Je ne sais pas ce que ça veut dire, mon petit. Et je n'aime pas ne pas savoir. »",
    },
  ],
  choices: [
    {
      act: 3,
      title: "Le sort du passeur",
      options: [
        {
          label: "Le livrer au vicaire",
          consequence:
            "Gaudru l'emmène à Aube-Close pour être jugé selon le Code (article 211, profanation de sépulture). On ne le revoit pas. Plus tard dans la campagne, il peut reparaître dans les sous-sols de la Rotonde, les yeux gris.",
        },
        {
          label: "Le livrer au sergent",
          consequence:
            "Pendu au débarcadère avant midi, puis brûlé. Gaudru hurle au sacrilège et refuse de bénir le village. Les recrues de Brasque vomissent derrière la palissade.",
        },
        {
          label: "Le laisser au village",
          consequence:
            "Mère Gisle le fait asseoir dans sa barge, sans perche, et pousse la barge dans la tourbière. « Il voulait rejoindre sa femme. » Personne ne sait s'il en revient.",
        },
        {
          label: "Le laisser partir",
          consequence:
            "Il remercie, très poliment, et prend la route d'Aube-Close. Les personnages le recroiseront plus tard, à la tête d'une procession d'Attendants.",
        },
      ],
    },
    {
      act: 4,
      title: "Ce qu'on fait des Noyés",
      options: [
        {
          label: "Brûler la tourbière (Brasque)",
          consequence:
            "La poix, le vent d'ouest, une torche. La tourbe brûle trois semaines, sous l'eau même, et la fumée se voit de Saint-Ferréol. Plus un Noyé ne sortira. Le village perd ses aïeux et son gagne-pain : on ne coupera plus de tourbe ici avant dix ans. Brasque emmène six garçons, dont le fils de Mère Gisle. Gaudru excommunie le village depuis la passerelle, en nommant les personnages : ils seront mal reçus dans les églises du Val. Hersende entend parler d'eux en bien.",
        },
        {
          label: "Clouer les morts un par un (Gaudru, la Confrérie)",
          consequence:
            "Jouer la rencontre « Le clouage ». Les Noyés retournent dans la tourbe, cloués, et le village garde ses aïeux. Si l'épreuve échoue, un villageois meurt. Brasque repart sans ses recrues et signale les personnages comme « amis de la prêtraille ». Gaudru écrit à Aube-Close : le Grand Prêtre connaîtra leurs noms, et c'est une bonne chose, pour l'instant. La Confrérie paie les talons.",
        },
        {
          label: "Ouvrir la palissade (Mère Gisle)",
          consequence:
            "Trois pieux à abattre. Les Noyés traversent le village au pas, sans toucher personne, et disparaissent vers l'est. Personne ne meurt à Gué-Saulnier. Mais ils marchent vers Saint-Ferréol, qu'ils atteindront dans trois nuits, et vers la loge de Bastienne. Brasque et Gaudru, d'accord pour une fois, traitent les personnages de fous. En passant, l'Aïeul laisse tomber son torque aux pieds de celui qui a abattu le premier pieu. Courir prévenir Saint-Ferréol ouvre la séance suivante.",
        },
        {
          label: "Autre chose",
          consequence:
            "Si la table trouve une autre voie (veiller les morts trois nuits avec les Veilleuses, dévier la ligne par une passerelle neuve), laisse-la faire et fais payer en temps : trois nuits de veille, une attaque des pilotis par nuit.",
        },
      ],
    },
  ],
  mapHint: {
    kind: "nature",
    seed: 1213,
    name: "La tourbière de Gué-Saulnier",
    width: 46,
    height: 36,
    labels: ["Maison du passeur", "Roselière des Noyés", "Vieux débarcadère"],
  },
};

export const LIBRARY: Scenario[] = [TOURBE, MENSUALITE, DEUX_SOUVENIRS, AVIS_DE_SIX_HEURES, NUMERO_ONZE, PONT_D_ARAMON];
