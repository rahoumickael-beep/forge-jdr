// Création de personnage façon Baldur's Gate 3 : origines, historiques, personnalité.
// Contenu du monde fantasy d'Aubreterre (voir la bible du monde dans les fichiers du projet) ;
// celui de l'Archipel (SF) est dans archipel-origines.ts.
import { HISTORIQUES_ARCHIPEL, ORIGINES_ARCHIPEL, PERSONNALITE_ARCHIPEL } from "./archipel-origines";
import { HISTORIQUES_TERNELANDE, ORIGINES_TERNELANDE, PERSONNALITE_TERNELANDE } from "./ternelande-origines";
import { HISTORIQUES_RESIDENCE, ORIGINES_RESIDENCE, PERSONNALITE_RESIDENCE } from "./residence-origines";
import { HISTORIQUES_NOYES, ORIGINES_NOYES, PERSONNALITE_NOYES } from "./noyes-origines";
import { HISTORIQUES_SEC, ORIGINES_SEC, PERSONNALITE_SEC } from "./sec-origines";
import { HISTORIQUES_ASILE, ORIGINES_ASILE, PERSONNALITE_ASILE } from "./asile-origines";
import { HISTORIQUES_ILES, ORIGINES_ILES, PERSONNALITE_ILES } from "./iles-origines";
import { HISTORIQUES_EXPO, ORIGINES_EXPO, PERSONNALITE_EXPO } from "./expo-origines";
import { HISTORIQUES_HERMES, ORIGINES_HERMES, PERSONNALITE_HERMES } from "./hermes-origines";
import type { GenreId } from "./types";

/** Index des caractéristiques : 0 For, 1 Dex, 2 Con, 3 Int, 4 Sag, 5 Cha (noms adaptés au genre). */
export type StatBonus = Partial<Record<0 | 1 | 2 | 3 | 4 | 5, number>>;

export interface SubOrigin {
  id: string;
  name: string;
  blurb: string;
  bonus: StatBonus;
  speed?: number; // en cases, remplace celle de l'origine
  hpPerLevel?: number;
  traits: { name: string; text: string }[];
}

export interface Origin {
  id: string;
  genre: GenreId;
  name: string;
  blurb: string;
  bonus: StatBonus;
  speed: number; // en cases de 1,5 m
  darkvision?: number; // en cases
  traits: { name: string; text: string }[];
  subs: SubOrigin[];
  /** Origine propre au monde, absente des règles de base. */
  unique?: boolean;
}

export interface Background {
  id: string;
  genre: GenreId;
  name: string;
  blurb: string;
  skills: string[];
  tool: string;
  gear: string[];
  feature: { name: string; text: string };
}

export const ORIGINS: Origin[] = [
  {
    id: "humain",
    genre: "fantasy",
    name: "Humains",
    blurb: "Majoritaires partout. Polyvalents, ambitieux, divisés par provinces plus que par sang.",
    bonus: {},
    speed: 6,
    traits: [{ name: "Polyvalence", text: "Une maîtrise de compétence en plus, au choix. Langues : le pallénien et une autre." }],
    subs: [
      {
        id: "couronnais",
        name: "Couronnais",
        blurb: "Gens des villes et de la plaine d'Aube-Close, élevés à l'ombre du Code.",
        bonus: { 3: 2, 5: 1 },
        traits: [
          { name: "Citer le Code", text: "Avantage aux jets d'Histoire et de Persuasion qui touchent à la loi ou à l'administration impériale." },
          { name: "Plume de l'Empire", text: "Maîtrise des fournitures de calligraphie ou du nécessaire de faussaire." },
        ],
      },
      {
        id: "marchois",
        name: "Marchois",
        blurb: "Gens des Marches de Fer, au nord, où l'on brûle les morts avant qu'ils ne se lèvent.",
        bonus: { 2: 2, 0: 1 },
        traits: [
          { name: "Né sous le vent", text: "Résistance aux dégâts de froid." },
          { name: "Fils des forts", text: "Maîtrise des armures intermédiaires." },
        ],
      },
    ],
  },
  {
    id: "elfe",
    genre: "fantasy",
    name: "Elfes de la Brune",
    blurb: "Grands, lents à parler, la peau grise ou brune comme l'écorce. Les plus vieux se souviennent de deux dieux.",
    bonus: { 1: 2 },
    speed: 6,
    darkvision: 12,
    traits: [
      { name: "Ascendance féerique", text: "Avantage contre l'état charmé, immunité au sommeil magique." },
      { name: "Transe", text: "Quatre heures de transe valent une nuit de sommeil." },
      { name: "Sens aiguisés", text: "Maîtrise de Perception." },
    ],
    subs: [
      {
        id: "chenes",
        name: "Elfe des Chênes",
        blurb: "Gardiens de la forêt, qui comptent les années en anneaux d'arbre.",
        bonus: { 4: 1 },
        speed: 7,
        traits: [
          { name: "Se fondre", text: "Peut tenter de se cacher dès qu'il est un peu masqué par la végétation, la pluie ou la brume." },
          { name: "Arc de la Brune", text: "Maîtrise de l'arc long et de l'arc court." },
        ],
      },
      {
        id: "memoire",
        name: "Elfe de Mémoire",
        blurb: "Lignées anciennes qui gardent les souvenirs d'avant l'Empire.",
        bonus: { 3: 1 },
        traits: [
          { name: "Tour appris", text: "Un tour de magie de magicienne au choix." },
          { name: "Souvenir d'avant", text: "Une fois par repos long, avantage à un jet d'Histoire ou d'Arcanes." },
          { name: "Oreille fine", text: "Entend les Murmures qu'une voix adresse à un allié à 6 cases. Le MJ le prévient." },
        ],
      },
    ],
  },
  {
    id: "nain",
    genre: "fantasy",
    name: "Nains des Ossiers",
    blurb: "Larges, patients, têtus. Exilés depuis qu'ils ont muré leurs cités. Ceux qui ont perdu leur ossuaire portent au cou une pierre gravée du nom de leurs ancêtres.",
    bonus: { 2: 2 },
    speed: 5,
    darkvision: 12,
    traits: [
      { name: "Résistance naine", text: "Avantage aux sauvegardes contre le poison, résistance aux dégâts de poison." },
      { name: "Pas lourd", text: "L'armure lourde ne réduit pas son déplacement." },
      { name: "Armes des Ossiers", text: "Maîtrise de la hache d'armes, de la hachette et des marteaux." },
    ],
    subs: [
      {
        id: "plomb",
        name: "Nain de Plomb",
        blurb: "Ceux qui ont muré les portes et n'en parlent jamais.",
        bonus: { 0: 2 },
        traits: [
          { name: "Fermer la porte", text: "Avantage pour barricader, sceller ou verrouiller, et pour tenir une porte fermée." },
          { name: "Cuir et mailles", text: "Maîtrise des armures légères et intermédiaires." },
        ],
      },
      {
        id: "ossuaire",
        name: "Nain Ossuaire",
        blurb: "Gardiens des morts, prêtres et maçons à la fois.",
        bonus: { 4: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Endurant", text: "+1 PV par niveau." },
          { name: "Parler aux ancêtres", text: "Une fois par repos long, peut interroger un nain mort (n'importe quel mort à partir du niveau 5), sans coût en Murmures." },
        ],
      },
    ],
  },
  {
    id: "petites-gens",
    genre: "fantasy",
    name: "Petites gens",
    blurb: "Hauts d'un mètre, rieurs, durs au mal. Ils ont une réputation de chance, et la cultivent.",
    bonus: { 1: 2 },
    speed: 5,
    traits: [
      { name: "Chanceux", text: "Relance un 1 obtenu sur un d20 et garde le second résultat." },
      { name: "Brave", text: "Avantage contre l'état effrayé." },
      { name: "Agilité", text: "Peut traverser l'espace d'une créature plus grande." },
    ],
    subs: [
      {
        id: "tourbier",
        name: "Tourbier",
        blurb: "Des Noyes, où l'on marche dans l'eau jusqu'aux chevilles toute l'année.",
        bonus: { 2: 1 },
        traits: [
          { name: "Pieds de vase", text: "Ignore le terrain difficile dû à la boue, aux marais et à l'eau peu profonde." },
          { name: "Souffle long", text: "Retient son souffle quinze minutes. Résistance au poison." },
        ],
      },
      {
        id: "saunier",
        name: "Saunier",
        blurb: "De la Côte des Sels, où tout se pèse et tout se vend.",
        bonus: { 5: 1 },
        traits: [
          { name: "Le sel dans la poche", text: "Connaît toujours le prix des choses à dix pour cent près." },
          { name: "Gens de quai", text: "Maîtrise de Persuasion ou d'Intuition, et des bateaux." },
        ],
      },
    ],
  },
  {
    id: "demi-orc",
    genre: "fantasy",
    name: "Demi-orcs",
    blurb: "Descendants des auxiliaires des légions et des peuples du désert. Respectés aux Marches, méprisés à Aube-Close.",
    bonus: { 0: 2, 2: 1 },
    speed: 6,
    darkvision: 12,
    traits: [
      { name: "Menaçant", text: "Maîtrise d'Intimidation." },
      { name: "Endurance implacable", text: "Une fois par repos long, tombe à 1 PV au lieu de 0." },
    ],
    subs: [
      {
        id: "legionnaire",
        name: "Demi-orc Légionnaire",
        blurb: "Fils et filles de vétérans, élevés au son du tambour de rang.",
        bonus: {},
        traits: [
          { name: "Discipline de rang", text: "Avec un bouclier, peut utiliser sa réaction pour imposer le désavantage à une attaque contre un allié adjacent." },
          { name: "Armure de légion", text: "Maîtrise des armures intermédiaires." },
        ],
      },
      {
        id: "verre",
        name: "Demi-orc du Verre",
        blurb: "Nomades du Verre-Rouge, le désert du sud.",
        bonus: {},
        traits: [
          { name: "Attaques sauvages", text: "Un dé de dégâts d'arme en plus sur un critique au corps à corps." },
          { name: "Lire le verre", text: "Résistance au feu. Sait toujours où est le sud et sent venir une tempête une heure à l'avance." },
        ],
      },
    ],
  },
  {
    id: "revenu",
    genre: "fantasy",
    unique: true,
    name: "Revenus",
    blurb: "Morts, puis revenus avec leur esprit. Peau pâle, ongles noirs, voix rauque. Ils se souviennent de la descente, du froid, et d'une présence immense qui les a repoussés.",
    bonus: { 2: 2 },
    speed: 6,
    darkvision: 12,
    traits: [
      { name: "Déjà mort", text: "Résistance aux dégâts nécrotiques, avantage contre le poison et les maladies. N'a besoin ni de respirer, ni de manger, ni de boire." },
      { name: "Corps froid", text: "Ne récupère que la moitié de ses dés de vie lors d'un repos long." },
      { name: "Les morts le reconnaissent", text: "Les Levés ne l'attaquent pas en premier, tant qu'il ne les attaque pas." },
    ],
    subs: [
      {
        id: "recent",
        name: "Revenu Récent",
        blurb: "Mort il y a moins de dix ans, le corps presque intact.",
        bonus: { 5: 1 },
        traits: [
          { name: "Passer pour vivant", text: "Avec un peu de fard, avantage aux jets de Tromperie pour cacher sa condition." },
          { name: "Chaleur volée", text: "Une fois par repos long, en touchant une créature consentante : 1d8 + niveau PV temporaires." },
        ],
      },
      {
        id: "os-sec",
        name: "Os-Sec",
        blurb: "Mort il y a des siècles, souvent un ancien soldat ou un Noyé revenu à lui.",
        bonus: { 0: 1 },
        traits: [
          { name: "Carcasse", text: "Sans armure, CA 13 + Dextérité. Immunisé contre l'état empoisonné." },
          { name: "Ancienne langue", text: "Parle la langue d'avant l'Empire et garde des fragments sur les deux dieux." },
          { name: "Rabibocher", text: "Une fois par repos court, une action pour remettre un os en place et récupérer 1d6 PV." },
        ],
      },
    ],
  },
  {
    id: "sang-dore",
    genre: "fantasy",
    unique: true,
    name: "Sang-Doré",
    blurb: "Descendants des épouses mortelles d'Ostral. Yeux dorés, peau qui luit faiblement dans le noir. Depuis le Glas, certains enfants naissent avec les yeux gris.",
    bonus: { 5: 2 },
    speed: 6,
    darkvision: 12,
    traits: [
      { name: "Sang du Trône", text: "Les héritiers et les Porte-Voix le reconnaissent comme de la famille." },
      { name: "Langue de cour", text: "Parle le céleste, la langue de cour d'Ostral." },
    ],
    subs: [
      {
        id: "claire",
        name: "Lignée Claire",
        blurb: "L'éclat d'Ostral, intact.",
        bonus: { 4: 1 },
        traits: [
          { name: "Mains guérisseuses", text: "Une fois par repos long, une action pour rendre autant de PV que son niveau. Résistance aux dégâts radiants." },
          { name: "Éclat", text: "Au niveau 3, une fois par repos long : une minute de lumière qui ajoute son niveau en dégâts radiants, une fois par tour." },
        ],
      },
      {
        id: "grise",
        name: "Lignée Grise",
        blurb: "Les yeux gris pâle. Ils entendent l'autre voix.",
        bonus: { 3: 1 },
        traits: [
          { name: "Marque du Dessous", text: "Résistance aux dégâts nécrotiques. Tour de magie thaumaturgie." },
          { name: "La voix amicale", text: "Une fois par repos long, peut poser une question à la voix qu'il entend. Elle répond toujours honnêtement. Le MJ gagne 1 Murmure." },
        ],
      },
    ],
  },
  ...ORIGINES_ARCHIPEL,
  ...ORIGINES_TERNELANDE,
  ...ORIGINES_RESIDENCE,
  ...ORIGINES_NOYES,
  ...ORIGINES_SEC,
  ...ORIGINES_ASILE,
  ...ORIGINES_ILES,
  ...ORIGINES_EXPO,
  ...ORIGINES_HERMES,
];

export const BACKGROUNDS: Background[] = [
  {
    id: "deserteur",
    genre: "fantasy",
    name: "Déserteur des légions",
    blurb: "Tu as quitté les rangs de Hersende, et tu sais pourquoi.",
    skills: ["Athlétisme", "Survie"],
    tool: "Jeu de dés",
    gear: ["Manteau rouge retourné", "Épée courte cabossée", "Sauf-conduit falsifié", "10 po"],
    feature: { name: "Les copains de rang", text: "Dans n'importe quel fort ou camp de légion, quelqu'un te doit quelque chose, ou te reconnaîtra. À toi de savoir si c'est une bonne chose." },
  },
  {
    id: "novice",
    genre: "fantasy",
    name: "Novice défroqué",
    blurb: "Tu as fui un monastère du Val Cierge, ou on t'en a chassé.",
    skills: ["Histoire", "Intuition"],
    tool: "Une langue au choix",
    gear: ["Robe de bure", "Cierge béni", "Livre de prières annoté dans les marges", "8 po"],
    feature: { name: "Les mots de passe", text: "Tu connais les gestes, les répons et les horaires de l'Église. Tu peux te faire passer pour un frère et obtenir le gîte dans un temple." },
  },
  {
    id: "cloueur",
    genre: "fantasy",
    name: "Cloueur",
    blurb: "Tu as été apprenti à la Confrérie du Dernier Clou.",
    skills: ["Médecine", "Intimidation"],
    tool: "Outils de forgeron",
    gear: ["Marteau", "Vingt clous de fer", "Poche de sel", "Flacon de goudron", "10 po"],
    feature: { name: "Le clou à l'oreille", text: "Les gens du peuple t'ouvrent leur porte quand il y a un mort dans la maison, et te nourrissent. Les loges de la Confrérie te logent." },
  },
  {
    id: "saunier-hanse",
    genre: "fantasy",
    name: "Saunier de la Hanse",
    blurb: "Les salines d'abord, puis les comptoirs.",
    skills: ["Persuasion", "Intuition"],
    tool: "Instruments de navigateur",
    gear: ["Balance de poche", "Bourse de sel fin", "Chevalière à réservoir", "15 po"],
    feature: { name: "Crédit au comptoir", text: "Dans tout port de Pallène, la Hanse te fait crédit jusqu'à 50 po, à rembourser sous un mois. Au-delà, elle envoie quelqu'un." },
  },
  {
    id: "copiste",
    genre: "fantasy",
    name: "Copiste de la Chancellerie",
    blurb: "Tu as recopié des ordonnances à Aube-Close, et lu des choses que tu n'aurais pas dû.",
    skills: ["Histoire", "Investigation"],
    tool: "Fournitures de calligraphie",
    gear: ["Encrier d'encre violette", "Liasse de papiers d'archives", "10 po"],
    feature: { name: "Le pouce violet", text: "Les fonctionnaires de l'Empire te reconnaissent comme l'un des leurs. Tu obtiens registres et actes en un jour au lieu d'un mois." },
  },
  {
    id: "enfant-glas",
    genre: "fantasy",
    name: "Enfant du Glas",
    blurb: "Tu as perdu ta famille la nuit de la mort du Dieu, ou l'hiver d'après. Tu as grandi sur les routes.",
    skills: ["Discrétion", "Escamotage"],
    tool: "Outils de voleur",
    gear: ["Bouton dépareillé (porte-bonheur)", "Couteau", "Couverture trouée", "5 po"],
    feature: { name: "Les petits yeux", text: "Les orphelins et les gamins des rues te renseignent pour un repas. Ils savent tout ce qui se passe au ras du sol." },
  },
  {
    id: "pleureuse",
    genre: "fantasy",
    name: "Pleureuse à gages",
    blurb: "On te paie pour pleurer aux enterrements, et maintenant pour veiller les morts trois nuits.",
    skills: ["Représentation", "Tromperie"],
    tool: "Vielle, flûte ou tambourin",
    gear: ["Voile de deuil", "Instrument", "Fiole de larmes d'oignon", "8 po"],
    feature: { name: "La bienvenue des endeuillés", text: "Dans toute maison en deuil, on t'accueille, on te nourrit et on te parle. Les gens disent tout à qui pleure leurs morts." },
  },
  {
    id: "pelerin",
    genre: "fantasy",
    name: "Pèlerin de la Cire",
    blurb: "Tu as marché jusqu'à Aube-Close pour allumer un cierge devant le Dieu mort, et tu n'es jamais vraiment rentré.",
    skills: ["Survie", "Intuition"],
    tool: "Une langue au choix",
    gear: ["Bâton de marche", "Besace de cierges", "Insigne de plomb de la Rotonde", "6 po"],
    feature: { name: "La route des pèlerins", text: "Tu sais où trouver un abri gratuit, de l'eau potable et des nouvelles fraîches à chaque étape. Les gens de la route te protègent." },
  },
  ...HISTORIQUES_ARCHIPEL,
  ...HISTORIQUES_TERNELANDE,
  ...HISTORIQUES_RESIDENCE,
  ...HISTORIQUES_NOYES,
  ...HISTORIQUES_SEC,
  ...HISTORIQUES_ASILE,
  ...HISTORIQUES_ILES,
  ...HISTORIQUES_EXPO,
  ...HISTORIQUES_HERMES,
];

/** Suggestions de personnalité. Le joueur peut toujours écrire la sienne. */
export const PERSONALITY: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je compte tout : les pas, les pièces, les morts.",
    "Je parle aux cadavres avant de les fouiller. Par politesse.",
    "Je ris trop fort aux enterrements, et je ne sais pas m'en empêcher.",
    "Je garde toujours un morceau de pain dans ma poche, au cas où.",
    "Je réponds aux questions par d'autres questions.",
    "Je dors avec mes bottes.",
  ],
  ideal: [
    "La loi. Le Code a tenu six siècles, il peut encore tenir.",
    "Les vivants d'abord. Les dieux se débrouilleront.",
    "La vérité, même quand elle brûle les mains.",
    "Ma famille. Le reste du monde peut bien s'écrouler.",
    "La liberté. Aucun héritier ne mérite cette couronne.",
    "L'argent. C'est la seule chose qui ne ment pas.",
  ],
  bond: [
    "J'ai cloué ma propre sœur. Je veux savoir pourquoi elle s'est relevée.",
    "Je porte une lettre d'Ostral que je n'ai jamais osé ouvrir.",
    "Ysé m'a souri une fois, sur une place, et depuis je la sers.",
    "Je dois une vie à un chasseur de morts dont j'ignore le nom.",
    "Mon village a été brûlé deux fois, par deux camps. Je n'oublie aucun des deux.",
    "Quelqu'un m'a enterré vivant. Je compte le lui rendre.",
  ],
  flaw: [
    "J'entends parfois mon père mort m'appeler, et je réponds.",
    "Je ne laisse jamais une dette impayée, même quand il faudrait.",
    "Je mens sur mon passé, et je ne me souviens plus de toutes les versions.",
    "Je bois pour faire taire les cloches.",
    "Je méprise les gens d'Aube-Close et je le leur fais sentir.",
    "J'ai peur du noir depuis le Glas, et je préfère mourir que l'avouer.",
  ],
};

/** Suggestions de personnalité du monde de la partie. */
export const personnaliteDe = (genre: GenreId): typeof PERSONALITY => (genre === "science-fiction" ? PERSONNALITE_ARCHIPEL : genre === "dark-fantasy" ? PERSONNALITE_TERNELANDE : genre === "cyberpunk" ? PERSONNALITE_RESIDENCE : genre === "horreur" ? PERSONNALITE_NOYES : genre === "post-apo" ? PERSONNALITE_SEC : genre === "western" ? PERSONNALITE_ASILE : genre === "pirates" ? PERSONNALITE_ILES : genre === "steampunk" ? PERSONNALITE_EXPO : genre === "contemporain" ? PERSONNALITE_HERMES : PERSONALITY);

/** Achat par points (27 points, valeurs de 8 à 15). */
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export type AbilityMethod = "points" | "des" | "fixe";
export const ABILITY_METHODS: { id: AbilityMethod; label: string }[] = [
  { id: "points", label: "Achat par points (27 points)" },
  { id: "des", label: "Lancer 4d6, garder les 3 meilleurs" },
  { id: "fixe", label: "Valeurs fixes (15, 14, 13, 12, 10, 8)" },
];

/** Niveau où chaque classe choisit sa sous-classe (comme BG3). */
export const SUBCLASS_LEVEL: Record<string, number> = {
  clerc: 1,
  occultiste: 1,
  ensorceleuse: 1,
  ensorceleur: 1,
  magicienne: 2,
  magicien: 2,
  druide: 2,
  veilleur: 2,
};

export function subclassLevel(classId: string): number {
  const key = classId.replace(/^[a-z]+-/, "");
  return SUBCLASS_LEVEL[key] ?? 3;
}

export const originsFor = (genre: GenreId) => ORIGINS.filter((o) => o.genre === genre);
export const backgroundsFor = (genre: GenreId) => BACKGROUNDS.filter((b) => b.genre === genre);
