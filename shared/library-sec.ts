// Bibliothèque du Grand Sec (post-apocalyptique, vallée du Rhône asséchée) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « Le Grand Sec », scénario 1 : ouverture, niveau 1. */
export const PONT_D_ARAMON: Scenario = {
  id: "bib-pa-aramon",
  title: "Le pont d'Aramon",
  genre: "post-apo",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Été de l'an 40 du Sec. Le Vieux Fabre cherche quatre gardes pour la Belle-Méjane, son char à voile : vingt barils d'eau de Montclair à descendre d'Avignon à Beaucaire, un jour et une nuit de Route, mistral dans le dos. Vingt godets par jour et par tête, et la gourde pleine au départ. « C'est le tarif batelier, j'ai deux cargaisons de retard. Le mistral est pour nous. La Horde, je sais pas. »",
  synopsis:
    "Marius Fabre, soixante-dix ans, une jambe de chêne, doit livrer quatre mille godets d'eau de Montclair aux Saliniers de Beaucaire, contre le bois qui fera tourner leurs alambics tout l'hiver. Au départ d'Avignon, une jeune femme gantée, Rose Faucon, achète une place avec deux godets et une montre arrêtée. À mi-chemin, le mistral tombe : la Belle-Méjane reste quatre heures en plein lit du fleuve, sous le soleil de l'après-midi. Le soir, au pont d'Aramon, trois chars ferment la seule passe roulable, sous l'arche : Bastien Coulomb, lieutenant de la Horde du Mistral, réclame la moitié de l'eau. Rose enlève son gant : une main peinte en rouge. Elle est montée à Avignon pour compter les gardes. Dans la soute, deux barils sonnent creux : un docker d'Avignon, payé par la Horde, les a vidés avant le départ. À l'aube, à Beaucaire, Honorine Pellegrin, la bouilleuse qui attend l'eau, compte les barils.",
  acts: [
    {
      title: "Le quai d'Avignon",
      location: "Le quai des chars, sous les remparts d'Avignon, à l'aube",
      summary:
        "Six heures du matin, déjà vingt-huit degrés. Le quai est une rampe de pierre qui descend dans le lit du fleuve, où une dizaine de chars à voile attendent, voiles roulées. La Belle-Méjane : douze mètres, six roues de camion, une voile carrée rapiécée de quatre couleurs. Le Vieux Fabre fait charger les vingt barils par des dockers, compte à voix haute et en tapote un sur deux du poing pour l'écouter sonner. Rose Faucon arrive en courant, une manche longue, un gant de cuir à la main droite, le pouce dans la poche : elle va voir sa sœur à Beaucaire, elle a deux godets et une montre qui ne marche plus. Le Vieux Fabre veut huit godets pour la place, et lui dit non ; pendant qu'ils discutent, les deux derniers barils montent à bord sans qu'il les tapote. Un personnage attentif (Perception DD 13) remarque que le docker qui les porte, un rouquin, ne regarde jamais le Vieux Fabre en face, et qu'il a les mains mouillées. Un personnage peut compléter les six godets qui lui manquent, ou pas. À sept heures, un mistral faible se lève : le char avance lentement jusqu'à midi, entre les bancs de galets, et la Belle-Méjane descend dans le lit du fleuve. Compter 30 minutes.",
    },
    {
      title: "Le calme plat",
      location: "Le lit du Rhône, entre Avignon et Aramon, au milieu de l'après-midi",
      summary:
        "Vers deux heures, le mistral tombe d'un coup. La voile pend. Le lit du fleuve, trois cents mètres de sable et de galets, renvoie la chaleur comme un four ; pas d'ombre, sauf celle de la voile. Le Vieux Fabre annonce quatre heures de calme, peut-être six. Trois choix : attendre sous la voile (l'ombre ne couvre que trois places sur six : le Vieux Fabre en prend une, Rose une autre si elle est à bord, les autres tirent au sort ; coup de chaleur à deux heures et à trois heures, sauvegarde d'Endurance DD 10, avec l'avantage à l'ombre, et un godet de plus à boire pour qui reste au soleil ; un seul niveau d'épuisement au plus), pousser le char à la force des bras vers l'ombre d'une pile de pont à un kilomètre (Athlétisme DD 12 en groupe, sauvegarde DD 10 à chaque heure de poussée, sans avantage sauf un godet de plus, deux godets de plus par personne au total ; sous la pile, un trou d'eau croupie : eau sale, Endurance DD 12 ou empoisonné jusqu'au repos long, et un Coup de mistral pour le MJ), ou boire dans la cargaison (un baril, c'est deux cents godets : le Vieux Fabre sort son fusil). Pendant le calme, un vautour se pose sur le mât. Rose demande à monter en haut, pour voir. Si on la laisse, elle fait miroiter le verre de sa montre arrêtée vers le sud ; très loin, sur une pile de pont, un éclat répond (Perception DD 14 pour le voir). Vers six heures, le mistral revient. Compter 40 minutes.",
    },
    {
      title: "Le pont d'Aramon",
      location: "Le pont effondré d'Aramon, à la tombée du jour",
      summary:
        "Le pont d'Aramon n'a plus qu'une arche debout, au milieu du lit. Autour, le lit est semé de dalles de pile, de péniches couchées et de bancs de galets mous : la seule passe roulable est sous l'arche, et trois chars de la Horde la ferment, voiles de toile écrue, une main peinte en rouge sur chacune. Le Vieux Fabre affale et s'arrête à cent mètres. Un homme s'avance seul, sans arme, et chante : Bastien Coulomb, lieutenant de la Cigale. Il veut la moitié de l'eau, dix barils, « pour la Porte » ; il dit qu'il a huit hommes et deux arbalètes sur l'arche. Si Rose est à bord, elle descend du char et enlève son gant : une main peinte en rouge. « Quatre gardes, Bastien. Pas plus. » Le Vieux Fabre crache. Les personnages ont à choisir : payer (dix barils), négocier (Persuasion DD 15, DD 13 si on a compté ses hommes : six barils, ou quatre si les personnages tiennent Rose et la lui rendent sans dommage), forcer le passage (le char file entre deux chars de la Horde, sous l'arche : Agilité DD 15 à la barre, Fabre à +4, ou un personnage Enfant de la Route avec l'avantage ; réussi, une salve d'arbalète touche un personnage au hasard, +3, 1d8+1 ; raté, une roue casse et on se bat), ou se battre. Ce que Bastien ne dit pas : il n'a que cinq hommes, et une seule arbalète marche (Perspicacité DD 13 pour sentir le bluff, Perception DD 15 pour compter). Si Rose est restée sur le quai, Bastien ne sait pas combien vous êtes : il bluffe à huit, et personne ne peut deviner (Perspicacité sans bonus). Compter 1 heure.",
    },
    {
      title: "Beaucaire",
      location: "Les bouilleries de Beaucaire, sur la rive, à l'aube",
      summary:
        "Les alambics fument déjà ; près de chacun, un tas de souches d'olivier marquées à la craie, les dernières des Alpilles. Honorine Pellegrin, la bouilleuse qui a payé l'eau d'avance en bois, attend sur le quai avec ses fils. Elle fait ouvrir les barils un par un et goûte. Deux sonnent creux depuis Avignon : le Vieux Fabre ne le savait pas. Honorine compte 200 godets le baril manquant : sans paiement à la Horde, il manque 400 godets ; après une négociation à six barils, 1 600 ; après dix barils payés, 2 400. Elle ne discute pas : elle veut son eau, ou son bois rendu. Le Vieux Fabre doit payer la différence en godets qu'il n'a pas, ou céder la Belle-Méjane. Les gages des personnages (160 godets à eux quatre) couvrent presque un baril ; au-delà, il faut la caution du Vieux Fabre (sa voile, son fusil) ou le témoignage sur le docker rouquin (Honorine a déjà vu ce visage, sur le quai des Saliniers : elle croit Fabre pour les deux barils vides, et lui laisse un mois pour le reste). Ou laisser le vieil homme se débrouiller. Compter 30 minutes.",
    },
  ],
  villain: {
    name: "Bastien Coulomb, lieutenant de la Horde du Mistral",
    motivation:
      "prendre l'eau de Montclair pour la Porte-d'Attente, où sa mère et ses deux sœurs vivent sous une toile contre le Mur, sans tuer s'il peut l'éviter : chaque mort sur la Route fait monter les prix",
    description:
      "Vingt-cinq ans, grand, brûlé par le soleil, un foulard rouge sur la bouche et une main peinte sur le poignet. Il s'avance toujours seul et sans arme, en chantant la chanson de la Cigale. Il parle calmement, en comptant ce que chacun perd : « Dix barils, c'est rien. Une roue, c'est trois jours. Un mort, c'est un puits de moins, et ça se paie plus cher que tout. »",
  },
  npcs: [
    {
      name: "Marius Fabre, le Vieux Fabre",
      role: "Patron de la Belle-Méjane, commanditaire",
      secret:
        "Il doit déjà deux cargaisons aux Saliniers depuis l'hiver ; celle-ci est sa dernière chance de garder son char. Il a vu, l'an dernier, un convoi de pièces détachées monter vers les Cévennes, payé en eau de Montclair, et il n'en a parlé à personne : qui parle des Mâts ne trouve plus de cargaison.",
      voice: "Parle en vents et en distances : « Mistral force six. Aramon à six heures. » Tapote sa jambe de chêne quand il ment, et crache quand il est d'accord.",
    },
    {
      name: "Rose Faucon",
      role: "Passagère, éclaireuse de la Horde du Mistral",
      secret:
        "Elle a dix-neuf ans et elle est née à la Porte-d'Attente. Elle est montée à Avignon pour compter les gardes et le faire savoir à Bastien depuis le mât. Elle n'aime pas tuer, et elle a pris en amitié celui des personnages qui l'a fait monter. Le docker rouquin, c'est son cousin.",
      voice: "Parle peu, en questions : « Vous avez déjà vu un mur ? » Chante tout bas, toujours la même chanson, sans s'en rendre compte. Garde le pouce dans la poche.",
    },
    {
      name: "Honorine Pellegrin",
      role: "Bouilleuse de sel à Beaucaire, cliente du Vieux Fabre",
      secret:
        "Elle a payé l'eau d'avance en bois, et elle a déjà promis cette eau en salaires à ses six ouvriers. Sans les vingt barils, elle ferme deux alambics et les renvoie. Elle connaît le docker rouquin : il a déjà vendu de l'eau volée sur le quai des Saliniers.",
      voice: "Goûte tout, l'eau, le vin, la soupe, et dit le prix avant de dire si c'est bon : « Deux cents godets le baril. Je goûte. » Ne s'assoit jamais.",
    },
  ],
  encounters: [
    {
      title: "Le pont d'Aramon (acte 3)",
      description:
        "Seulement si la négociation échoue ou si le passage forcé rate. Deux pillards et un arbalétrier sur l'arche (son arme s'enraye sur un 1 ou un 2 au d20) ; un troisième pillard arrive au round 3 depuis un char. Bastien a laissé son harpon sur son char, à cent mètres : il ne combat qu'au round 2. Ils veulent l'eau, pas des morts : ils se replient vers leurs chars quand deux d'entre eux tombent, ou quand Bastien est touché. Le sable du lit est un terrain difficile. Rose ne se bat pas : elle se met à l'abri derrière un baril, et elle regarde qui la protège.",
      enemies: [
        { name: "Pillard de la Horde", count: 3, hp: 9, ac: 12, attack: "Machette +3, 1d6+1 tranchants", danger: "Faible" },
        { name: "Arbalétrier de la Horde", count: 1, hp: 9, ac: 12, attack: "Arbalète légère +3, 1d8+1 perforants, portée 24 m", danger: "Faible" },
        { name: "Bastien Coulomb", count: 1, hp: 16, ac: 13, attack: "Harpon de batelier +4, 1d8+2 perforants, allonge 3 m", danger: "Moyen" },
      ],
      difficulty: "Difficile (évitable)",
    },
    {
      title: "Le calme plat (acte 2)",
      description:
        "Pas un combat : la chaleur. À deux heures et à trois heures, sauvegarde d'Endurance DD 10 ; avantage à l'ombre de la voile (trois places) ou si on boit un godet de plus ; un seul niveau d'épuisement par après-midi. Pousser le char : test de groupe d'Athlétisme DD 12, une sauvegarde par heure de poussée, deux godets de plus par personne, et l'ombre de la pile du pont au bout.",
      enemies: [],
      difficulty: "Moyenne",
    },
  ],
  twists: [
    "Rose Faucon est de la Horde. Elle est montée pour compter les gardes et l'a signalé à Bastien depuis le mât pendant le calme plat, avec le verre de sa montre. Si un personnage l'a prise en amitié, elle peut faire baisser le prix de Bastien, ou le faire monter si on la menace.",
    "Deux barils étaient vides avant le départ : le docker rouquin d'Avignon, le cousin de Rose, les a vidés pour la Horde. Le Vieux Fabre est accusé par Honorine d'avoir revendu l'eau en route.",
    "Le Vieux Fabre a vu monter des pièces détachées vers les Cévennes, payées en eau de Montclair. S'il est sauvé par les personnages, il leur parle, sur le quai, avant de repartir, d'un convoi de pièces monté une nuit vers les Cévennes, sans dire qui payait. C'est le premier fil de la campagne ; le reste attendra.",
  ],
  rewards: [
    "Vingt godets par jour et par personnage, payés par le Vieux Fabre, s'il a encore son char.",
    "Le Vieux Fabre vous garde une place sur la Belle-Méjane à tout moment, tant qu'il a son char.",
    "Rose Faucon, amie dans la Horde, si les personnages l'ont protégée : un mot d'elle ouvre une barricade, une fois.",
    "Honorine Pellegrin doit un service si les personnages lui ramènent le docker rouquin, ou lui disent qui il est.",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Trois choses à faire sentir, sans les dire : l'eau est la seule monnaie, et tout se compte en barils ; la Horde a ses raisons ; quelqu'un, dans les Cévennes, paie pour qu'on se taise.

Avant la séance. Chaque joueur remplit sa gourde : douze godets, et la ration du jour est de huit en été. Dis-le dès le départ : les quatre heures de calme plat vont coûter.

Compte 2 h 40 : dix minutes de gourdes, une demi-heure de quai, quarante minutes de calme plat, une heure au pont, une demi-heure à Beaucaire. Si la soirée file, saute le calme plat : le mistral tient jusqu'à Aramon.

Bastien. Il chante en s'avançant, toujours la même chanson. Il ne ment que sur le nombre de ses hommes. S'il voit qu'on a compté, il rit, et baisse son prix de deux barils.

Le Vieux Fabre et le fusil. S'il voit quelqu'un ouvrir un baril pendant le calme plat, il sort son fusil et vise le mât, pas l'homme : « Le prochain, c'est pas le mât. » Il ne tire jamais le premier.

Au micro. Le grincement des roues sur les galets, la voile qui claque puis qui pend, les cigales sur les berges, et la chanson de Bastien qui arrive avant lui.

La jauge des Puits vivants commence à 60. Payer la Horde ne détruit aucun puits : la jauge ne bouge pas, mais cette eau servira la Cigale, et Honorine ferme deux alambics. Note-le. Boire l'eau croupie sous la pile du pont donne un Coup de mistral au MJ ; dépense-le pour faire tomber le vent au mauvais moment devant Aramon.

Niveau 2 pour tout le monde à Beaucaire, quoi qu'il soit arrivé à l'eau.`,
  readAloud: [
    {
      act: 1,
      title: "Le quai d'Avignon",
      text: "À six heures du matin, il fait déjà chaud. La rampe du quai descend dans le lit du fleuve, et le lit du fleuve est un désert : trois cents mètres de sable gris et de galets, jusqu'à l'autre rive, une ligne de peupliers morts. Une dizaine de chars à voile attendent, roues calées, voiles roulées. Le plus vieux a une voile de quatre couleurs. Un homme à jambe de bois compte des barils à voix haute, et en tapote un sur deux du poing pour l'écouter sonner.",
    },
    {
      act: 2,
      title: "Le calme plat",
      text: "Le vent tombe d'un coup, et la voile s'affaisse contre le mât comme du linge. Le char roule encore vingt mètres sur son élan, puis s'arrête dans un crissement de galets. Le silence. Puis les cigales, sur les berges, de très loin. Le soleil est au-dessus de vous, et le sable du fleuve vous renvoie sa chaleur au visage. Le Vieux Fabre regarde le ciel et dit seulement : « Quatre heures. »",
    },
    {
      act: 3,
      title: "Le pont d'Aramon",
      text: "Le pont d'Aramon n'a plus qu'une arche debout, au milieu du lit : deux piles et un arc, avec rien au-dessus ni en dessous. Sous l'arche, trois chars sont couchés en travers de la passe, voiles de toile écrue, une main peinte en rouge sur chacune. Un homme s'avance seul, les bras ouverts, sans arme. Il chante. La chanson arrive par bribes, à contre-vent.",
    },
    {
      act: 4,
      title: "Beaucaire",
      text: "Beaucaire sent le sel brûlé. Vingt alambics ronflent sur la berge, un enfant racle la croûte blanche d'une cuve avec une pelle trop grande pour lui, et près de chaque cuve attend un tas de souches d'olivier, marquées à la craie. Une femme en tablier de cuir attend sur le quai, entourée de ses fils. Elle ne vous salue pas. Elle regarde les barils, et elle les compte.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "Rose Faucon",
      options: [
        { label: "La faire monter", consequence: "Un personnage complète les six godets qui lui manquent. Rose s'attache à celui qui l'a fait monter, et compte les gardes." },
        { label: "La laisser sur le quai", consequence: "Elle reste à Avignon. À Aramon, Bastien ne sait pas combien vous êtes : il bluffe à huit, et personne ne peut le deviner." },
      ],
    },
    {
      act: 2,
      title: "Le calme plat",
      options: [
        { label: "Attendre sous la voile", consequence: "Sauvegardes de chaleur, une gourde qui baisse. Rose monte au mât, si on la laisse." },
        { label: "Pousser jusqu'à l'ombre du pont", consequence: "Deux godets de plus par personne, mais l'ombre, et un trou d'eau croupie sous la pile (eau sale)." },
        { label: "Ouvrir un baril", consequence: "Le Vieux Fabre sort son fusil. Si on insiste, il cède un baril et ne paiera pas le voyage : « L'eau que vous buvez, c'est votre paie. »" },
      ],
    },
    {
      act: 3,
      title: "Bastien Coulomb",
      options: [
        { label: "Payer dix barils", consequence: "La Horde laisse passer. À Beaucaire il manque douze barils ; le Vieux Fabre perd son char si personne ne l'aide." },
        { label: "Négocier", consequence: "Persuasion DD 15 (DD 13 si on a compté ses hommes) : six barils, ou quatre si Rose parle pour vous. Bastien se souviendra de vous comme de gens raisonnables." },
        { label: "Forcer le passage sous l'arche", consequence: "Agilité du pilote DD 15. Réussi : la Belle-Méjane passe, les arbalètes tirent une salve. Raté : une roue casse, et il faut se battre." },
        { label: "Se battre", consequence: "Jouer « Le pont d'Aramon ». La Horde recule, mais la Cigale apprendra vos noms." },
      ],
    },
    {
      act: 3,
      title: "Rose, si elle est à bord",
      options: [
        { label: "La tenir", consequence: "Bastien baisse à quatre barils pour la récupérer sans dommage. Si les personnages la gardent et l'amènent aux Puisatiers, elle est pendue, et la Horde jure vengeance." },
        { label: "La laisser rejoindre Bastien", consequence: "Elle donne sa montre arrêtée à celui qui l'a fait monter. Un mot d'elle ouvre une barricade de la Horde, une fois." },
      ],
    },
    {
      act: 4,
      title: "Le Vieux Fabre",
      options: [
        { label: "Prêter vos gages au Vieux Fabre", consequence: "160 godets : presque un baril. Sans paiement à la Horde, avec sa caution, il garde la Belle-Méjane, et il vous parle d'un convoi de pièces monté une nuit vers les Cévennes." },
        { label: "Témoigner du docker rouquin", consequence: "Honorine croit le Vieux Fabre et lui laisse un mois pour payer. Elle part chercher le docker. Si Rose est là, elle pâlit." },
        { label: "Le laisser se débrouiller", consequence: "Il cède son char à Honorine. Il reste à Beaucaire, sur le quai, et ne parle plus des Cévennes à personne." },
      ],
    },
  ],
  mapHint: {
    kind: "nature",
    seed: 2071,
    name: "Le lit du Rhône, au pont d'Aramon",
    width: 44,
    height: 30,
    labels: ["L'arche d'Aramon", "La Belle-Méjane", "La berge"],
  },
};
