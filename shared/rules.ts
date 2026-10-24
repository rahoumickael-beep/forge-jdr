// Livre des règles de Forge JdR : règles de base inspirées de D&D 5e, classes et pouvoirs.
// Brouillon v0.2 : les 14 classes fantasy sont complètes ; les 10 classes de l'Archipel (SF) sont dans archipel-classes.ts.
import { CLASSES_ARCHIPEL } from "./archipel-classes";
import type { GenreId } from "./types";

export type Recharge = "à volonté" | "repos court" | "repos long" | "passif";
export type ActionType = "action" | "action bonus" | "réaction" | "passif";

export interface Power {
  name: string;
  level: number; // niveau où on l'obtient
  action: ActionType;
  recharge: Recharge;
  uses?: number; // nombre d'utilisations avant recharge (si pas à volonté)
  range?: string;
  effect: string;
}

export interface CharacterClass {
  id: string;
  genre: GenreId;
  name: string;
  role: string; // à quoi il sert dans le groupe
  pitch: string; // une phrase pour donner envie
  hitDie: 6 | 8 | 10 | 12;
  mainStats: string[];
  saves: string[]; // jets de sauvegarde maîtrisés
  armor: string;
  weapons: string;
  skills: { choose: number; from: string[] };
  startingGear: string[];
  powers: Power[];
  /** Nom de la sous-classe dans cette classe : « Serment », « Patron », « Voie primitive »… */
  subclassTitle: string;
  /** Choisie au niveau donné par `subclassLevel()` (shared/origins.ts). */
  subclasses: Subclass[];
}

export interface Subclass {
  id: string;
  name: string;
  pitch: string; // une phrase pour la carte du créateur
  description: string;
  powers: Power[];
}

export interface RuleSection {
  id: string;
  title: string;
  /** Paragraphes ; une ligne qui commence par "- " est un élément de liste, "| " une ligne de tableau. */
  body: string[];
}

// --- Repères chiffrés, partagés par les générateurs et le livre ---

export const DIFFICULTY_CLASSES = [
  { dd: 5, label: "Très facile" },
  { dd: 10, label: "Facile" },
  { dd: 15, label: "Moyenne" },
  { dd: 20, label: "Difficile" },
  { dd: 25, label: "Très difficile" },
  { dd: 30, label: "Presque impossible" },
];

/** Points d'expérience nécessaires pour atteindre chaque niveau (table de D&D 5e). */
export const XP_BY_LEVEL = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export const ABILITY_IMPROVEMENT_LEVELS = [4, 8, 12, 16, 19];

export const SKILLS: { name: string; stat: number }[] = [
  // stat = index de la caractéristique (0 Force … 5 Charisme), noms adaptés au genre ailleurs
  { name: "Athlétisme", stat: 0 },
  { name: "Acrobaties", stat: 1 },
  { name: "Discrétion", stat: 1 },
  { name: "Escamotage", stat: 1 },
  { name: "Arcanes / Savoir", stat: 3 },
  { name: "Investigation", stat: 3 },
  { name: "Histoire", stat: 3 },
  { name: "Médecine", stat: 4 },
  { name: "Perception", stat: 4 },
  { name: "Survie", stat: 4 },
  { name: "Intuition", stat: 4 },
  { name: "Dressage", stat: 4 },
  { name: "Persuasion", stat: 5 },
  { name: "Tromperie", stat: 5 },
  { name: "Intimidation", stat: 5 },
  { name: "Représentation", stat: 5 },
];

export const CONDITIONS: { name: string; effect: string }[] = [
  { name: "À terre", effect: "Se relever coûte la moitié du déplacement. Désavantage aux attaques ; les attaques au contact contre toi ont l'avantage." },
  { name: "Aveuglé", effect: "Rate tout ce qui demande la vue. Désavantage aux attaques ; les attaques contre toi ont l'avantage." },
  { name: "Charmé", effect: "Ne peut pas attaquer celui qui l'a charmé, qui a l'avantage pour lui parler." },
  { name: "Effrayé", effect: "Désavantage aux tests tant que la source de la peur est en vue. Ne peut pas s'en approcher." },
  { name: "Empoisonné", effect: "Désavantage aux attaques et aux tests de caractéristique." },
  { name: "Entravé", effect: "Déplacement 0. Désavantage aux attaques et en Dextérité ; les attaques contre toi ont l'avantage." },
  { name: "Étourdi", effect: "Aucune action ni réaction, déplacement 0. Rate les sauvegardes de Force et Dextérité." },
  { name: "Inconscient", effect: "Lâche ce qu'il tient, tombe à terre. Toute attaque au contact qui touche est un critique." },
  { name: "Invisible", effect: "Avantage aux attaques ; les attaques contre toi ont le désavantage." },
  { name: "Paralysé", effect: "Comme étourdi, et toute attaque au contact qui touche est un critique." },
];

export const DEATH_RULES = [
  { id: "heroique", label: "Héroïque (D&D)", text: "À 0 PV, le personnage tombe inconscient. À chacun de ses tours il lance 1d20 : 10 ou plus = un succès, moins = un échec. Trois succès : il se stabilise. Trois échecs : il meurt. Un 20 le relève avec 1 PV, un 1 compte pour deux échecs." },
  { id: "indulgent", label: "Indulgent", text: "À 0 PV, le personnage est hors combat jusqu'à la fin de la scène, puis se relève avec 1 PV et une cicatrice ou un défaut à jouer." },
  { id: "impitoyable", label: "Impitoyable", text: "À 0 PV, le personnage est mourant : sans soins avant la fin de son prochain tour, il meurt. Des dégâts égaux à ses PV max le tuent sur le coup." },
];

export const CORE_RULES: RuleSection[] = [
  {
    id: "principe",
    title: "Le principe",
    body: [
      "Le maître du jeu (MJ) décrit le monde. Les joueurs disent ce que font leurs personnages. Quand le résultat est incertain, on lance un dé à vingt faces (d20).",
      "Test = 1d20 + modificateur de caractéristique (+ bonus de maîtrise si le personnage est entraîné). Si le total atteint le degré de difficulté (DD) fixé par le MJ, c'est réussi.",
      "| DD | Difficulté",
      ...DIFFICULTY_CLASSES.map((d) => `| ${d.dd} | ${d.label}`),
      "Avantage : on lance deux d20 et on garde le meilleur. Désavantage : on garde le pire. Les deux s'annulent.",
      "Un 20 naturel sur une attaque est un coup critique (on double les dés de dégâts). Un 1 naturel rate toujours.",
    ],
  },
  {
    id: "caracteristiques",
    title: "Caractéristiques",
    body: [
      "Six caractéristiques, de 3 à 20. Leur nom change selon le genre (en cyberpunk, la Force devient Corps), mais leur rôle reste le même.",
      "- Force : porter, frapper, grimper.",
      "- Dextérité : esquiver, viser, être discret. Sert à l'initiative.",
      "- Constitution : encaisser, résister. Ajoute des PV à chaque niveau.",
      "- Intelligence : savoir, analyser, magie apprise.",
      "- Sagesse : percevoir, comprendre les gens, magie divine.",
      "- Charisme : convaincre, impressionner, magie innée.",
      "Modificateur = (valeur − 10) ÷ 2, arrondi à l'inférieur. 10 donne +0, 14 donne +2, 8 donne −1.",
      "Création : lancer 4d6 et garder les 3 meilleurs, six fois. Ou répartir 15, 14, 13, 12, 10, 8.",
    ],
  },
  {
    id: "maitrise",
    title: "Maîtrise et compétences",
    body: [
      "Le bonus de maîtrise s'ajoute à ce que ton personnage sait faire : ses armes, ses compétences, ses jets de sauvegarde de classe et ses pouvoirs.",
      "| Niveau | Bonus de maîtrise",
      "| 1 à 4 | +2",
      "| 5 à 8 | +3",
      "| 9 à 12 | +4",
      "| 13 à 16 | +5",
      "| 17 à 20 | +6",
      `Compétences : ${SKILLS.map((s) => s.name).join(", ")}.`,
    ],
  },
  {
    id: "combat",
    title: "Combat",
    body: [
      "Initiative : chacun lance 1d20 + Dextérité. On joue du plus haut au plus bas, puis on recommence (un round dure 6 secondes).",
      "À ton tour : un déplacement (en cases de 1,5 m), une action, éventuellement une action bonus. Une réaction par round, même hors de ton tour.",
      "- Actions courantes : attaquer, lancer un pouvoir, foncer (double déplacement), se désengager, esquiver (les attaques contre toi ont le désavantage), aider, se cacher, utiliser un objet.",
      "Attaque : 1d20 + modificateur + maîtrise. Si le total atteint la classe d'armure (CA) de la cible, elle touche ; on lance les dégâts.",
      "Sur la grille, une diagonale compte une case. Quitter la portée d'un ennemi au contact sans te désengager lui offre une attaque d'opportunité.",
      "Abri : un demi-abri donne +2 à la CA, un abri aux trois quarts +5.",
    ],
  },
  {
    id: "pouvoirs",
    title: "Pouvoirs",
    body: [
      "Chaque classe gagne des pouvoirs en montant de niveau. Un pouvoir est soit à volonté, soit limité à un nombre d'utilisations qui reviennent après un repos court ou un repos long.",
      "DD des pouvoirs = 8 + bonus de maîtrise + modificateur de la caractéristique principale de la classe. Bonus d'attaque des pouvoirs = maîtrise + ce même modificateur.",
      "Sur la fiche, on coche une utilisation quand on s'en sert ; le repos décoche tout ce qui revient.",
    ],
  },
  {
    id: "repos",
    title: "Repos et soins",
    body: [
      "Repos court (une heure) : dépenser des dés de vie (un par niveau) pour récupérer 1 dé de vie + Constitution chacun. Les pouvoirs « repos court » reviennent.",
      "Repos long (une nuit) : tous les PV, la moitié des dés de vie dépensés, tous les pouvoirs.",
    ],
  },
  {
    id: "mort",
    title: "Tomber à 0 PV",
    body: [
      "Le MJ choisit la règle au début de la campagne (Réglages de la partie) :",
      ...DEATH_RULES.map((d) => `- ${d.label} : ${d.text}`),
    ],
  },
  {
    id: "progression",
    title: "Progression",
    body: [
      "Les personnages vont du niveau 1 au niveau 20. Le MJ choisit : points d'expérience (table ci-dessous) ou passage de niveau aux grands moments de l'histoire.",
      "| Niveau | XP requis",
      ...XP_BY_LEVEL.slice(2).map((xp, i) => `| ${i + 2} | ${xp.toLocaleString("fr-FR")}`),
      `À chaque niveau : un dé de vie de PV en plus (ou la moyenne + 1) + Constitution. Aux niveaux ${ABILITY_IMPROVEMENT_LEVELS.join(", ")} : +2 à une caractéristique ou +1 à deux.`,
    ],
  },
  {
    id: "etats",
    title: "États",
    body: CONDITIONS.map((c) => `- ${c.name} : ${c.effect}`),
  },
];

const P = (level: number, name: string, action: ActionType, recharge: Recharge, effect: string, extra: Partial<Power> = {}): Power => ({ level, name, action, recharge, effect, ...extra });

type BaseClass = Omit<CharacterClass, "subclassTitle" | "subclasses">;

const BASE_CLASSES: BaseClass[] = [
  {
    id: "fantasy-guerrier",
    genre: "fantasy",
    name: "Guerrier",
    role: "Tank, dégâts au contact",
    pitch: "Celui qui tient la ligne quand tout s'effondre.",
    hitDie: 10,
    mainStats: ["Force", "Constitution"],
    saves: ["Force", "Constitution"],
    armor: "Toutes les armures et boucliers",
    weapons: "Toutes les armes",
    skills: { choose: 2, from: ["Athlétisme", "Acrobaties", "Intimidation", "Perception", "Survie", "Histoire"] },
    startingGear: ["Cotte de mailles", "Épée longue et bouclier", "Arbalète légère et 20 carreaux", "Sac d'explorateur"],
    powers: [
      P(1, "Second souffle", "action bonus", "repos court", "Récupère 1d10 + niveau PV.", { uses: 1 }),
      P(1, "Style de combat", "passif", "passif", "Choisis : Défense (+1 CA), Duel (+2 dégâts à une main) ou Armes lourdes (relance les 1 et 2 aux dégâts)."),
      P(2, "Fougue", "passif", "repos court", "Une action supplémentaire pendant ton tour.", { uses: 1 }),
      P(3, "Coup tactique", "passif", "repos court", "Quand tu touches : +1d8 dégâts et la cible est repoussée de 3 m, désarmée ou mise à terre (sauvegarde de Force).", { uses: 3 }),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une quand tu prends l'action Attaquer (trois au niveau 11, quatre au niveau 20)."),
      P(9, "Indomptable", "réaction", "repos long", "Relance un jet de sauvegarde raté.", { uses: 1 }),
      P(13, "Rempart", "réaction", "repos court", "Un allié à 1,5 m qui va être touché : l'attaque te vise à la place, avec désavantage.", { uses: 2 }),
      P(17, "Dernier debout", "passif", "repos long", "La première fois que tu tombes à 0 PV, tu restes à 1 PV et tu gagnes 2 × niveau PV temporaires.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-magicien",
    genre: "fantasy",
    name: "Magicienne",
    role: "Dégâts de zone, contrôle",
    pitch: "Elle a passé dix ans dans des livres pour pouvoir faire ça en une seconde.",
    hitDie: 6,
    mainStats: ["Intelligence"],
    saves: ["Intelligence", "Sagesse"],
    armor: "Aucune",
    weapons: "Dagues, bâtons, arbalètes légères",
    skills: { choose: 2, from: ["Arcanes / Savoir", "Histoire", "Investigation", "Médecine", "Intuition"] },
    startingGear: ["Bâton", "Grimoire", "Sacoche de composantes", "Sac d'érudit"],
    powers: [
      P(1, "Trait de feu", "action", "à volonté", "Attaque à distance : 1d10 feu (2d10 au niveau 5, 3d10 au 11, 4d10 au 17).", { range: "36 m" }),
      P(1, "Projectile magique", "action", "repos long", "Trois fléchettes qui touchent toujours : 1d4 + 1 force chacune.", { uses: 2, range: "36 m" }),
      P(1, "Bouclier", "réaction", "repos long", "+5 CA jusqu'à ton prochain tour, même contre l'attaque qui allait te toucher.", { uses: 2 }),
      P(3, "Toile d'araignée", "action", "repos long", "Cube de 6 m : sauvegarde de Dextérité ou entravé. Terrain difficile.", { uses: 2, range: "18 m" }),
      P(5, "Boule de feu", "action", "repos long", "Sphère de 6 m de rayon : 8d6 feu, moitié si sauvegarde de Dextérité réussie.", { uses: 2, range: "45 m" }),
      P(5, "Récupération arcanique", "passif", "repos long", "Pendant un repos court, récupère une utilisation d'un pouvoir de niveau 5 ou moins.", { uses: 1 }),
      P(9, "Porte dimensionnelle", "action", "repos long", "Toi et un allié consentant vous téléportez à 150 m dans un lieu que tu connais ou vois.", { uses: 1 }),
      P(13, "Mur de force", "action", "repos long", "Un mur invisible et indestructible pendant 10 minutes.", { uses: 1, range: "36 m" }),
      P(17, "Arrêt du temps", "action", "repos long", "Tu joues 1d4 + 1 tours d'affilée. Tout s'arrête si tu touches quelqu'un d'autre.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-voleur",
    genre: "fantasy",
    name: "Voleur",
    role: "Dégâts ciblés, discrétion, pièges",
    pitch: "Ce qu'il ne peut pas crocheter, il le convainc de s'ouvrir.",
    hitDie: 8,
    mainStats: ["Dextérité"],
    saves: ["Dextérité", "Intelligence"],
    armor: "Armures légères",
    weapons: "Armes courantes, épées courtes, rapières, arcs courts",
    skills: { choose: 4, from: ["Acrobaties", "Discrétion", "Escamotage", "Investigation", "Perception", "Tromperie", "Persuasion", "Intimidation", "Intuition"] },
    startingGear: ["Rapière", "Arc court et 20 flèches", "Armure de cuir", "Outils de voleur", "Sac de cambrioleur"],
    powers: [
      P(1, "Attaque sournoise", "passif", "à volonté", "Une fois par tour, +1d6 dégâts si tu as l'avantage ou un allié au contact de la cible (+1d6 tous les deux niveaux)."),
      P(1, "Expertise", "passif", "passif", "Double maîtrise dans deux compétences (deux de plus au niveau 6)."),
      P(2, "Ruse", "action bonus", "à volonté", "Foncer, se désengager ou se cacher en action bonus."),
      P(3, "Mains agiles", "action bonus", "à volonté", "Escamotage, crochetage ou utiliser un objet en action bonus."),
      P(5, "Esquive instinctive", "réaction", "à volonté", "Divise par deux les dégâts d'une attaque que tu vois venir."),
      P(9, "Coup bas", "passif", "repos court", "Quand ton attaque sournoise touche : la cible est aveuglée ou ralentie jusqu'à ton prochain tour (sauvegarde de Constitution).", { uses: 2 }),
      P(13, "Insaisissable", "passif", "passif", "Aucune attaque n'a l'avantage contre toi tant que tu n'es pas neutralisé."),
      P(17, "Coup de chance", "passif", "repos court", "Transforme un échec en 20 naturel.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-clerc",
    genre: "fantasy",
    name: "Clerc",
    role: "Soins, protection, renfort",
    pitch: "Sa foi soigne les blessures. Elle en provoque aussi.",
    hitDie: 8,
    mainStats: ["Sagesse"],
    saves: ["Sagesse", "Charisme"],
    armor: "Armures légères et intermédiaires, boucliers",
    weapons: "Armes courantes",
    skills: { choose: 2, from: ["Histoire", "Intuition", "Médecine", "Persuasion", "Arcanes / Savoir"] },
    startingGear: ["Masse d'armes", "Cotte d'écailles", "Bouclier et symbole sacré", "Sac d'ecclésiastique"],
    powers: [
      P(1, "Flamme sacrée", "action", "à volonté", "Sauvegarde de Dextérité ou 1d8 radiant (progresse comme le trait de feu).", { range: "18 m" }),
      P(1, "Soins", "action", "repos long", "Au toucher : 1d8 + Sagesse PV (+1d8 par utilisation supplémentaire dépensée).", { uses: 3 }),
      P(1, "Bénédiction", "action", "repos long", "Trois alliés ajoutent 1d4 à leurs attaques et sauvegardes pendant 1 minute.", { uses: 2, range: "9 m" }),
      P(2, "Renvoi des morts-vivants", "action", "repos court", "Les morts-vivants à 9 m fuient pendant 1 minute (sauvegarde de Sagesse).", { uses: 1 }),
      P(5, "Esprits gardiens", "action", "repos long", "Aura de 4,5 m pendant 1 minute : les ennemis y sont ralentis et subissent 3d8 radiant (moitié si sauvegarde).", { uses: 1 }),
      P(9, "Soins de groupe", "action", "repos long", "Jusqu'à six alliés à 9 m récupèrent 3d8 + Sagesse PV.", { uses: 1 }),
      P(13, "Bouclier de la foi", "réaction", "repos court", "Un allié touché par une attaque : réduit les dégâts de 2d10 + Sagesse.", { uses: 2 }),
      P(17, "Intervention divine", "action", "repos long", "Ta divinité agit : le MJ décide de la forme (miracle, guérison totale, foudre).", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-rodeur",
    genre: "fantasy",
    name: "Rôdeuse",
    role: "Dégâts à distance, pistage, nature",
    pitch: "Elle sait ce qui est passé ici, quand, et combien ils étaient.",
    hitDie: 10,
    mainStats: ["Dextérité", "Sagesse"],
    saves: ["Force", "Dextérité"],
    armor: "Armures légères et intermédiaires, boucliers",
    weapons: "Toutes les armes",
    skills: { choose: 3, from: ["Athlétisme", "Discrétion", "Investigation", "Perception", "Survie", "Dressage", "Intuition"] },
    startingGear: ["Arc long et 20 flèches", "Deux épées courtes", "Armure de cuir clouté", "Sac d'explorateur"],
    powers: [
      P(1, "Proie désignée", "action bonus", "repos long", "Pendant 1 heure, +1d6 dégâts contre une cible et avantage pour la pister.", { uses: 2 }),
      P(1, "Explorateur", "passif", "passif", "Le groupe ne se perd pas en milieu naturel ; tu repères les traces et les embuscades (avantage en Survie)."),
      P(3, "Compagnon animal", "passif", "passif", "Un loup, un faucon ou un ours brun qui agit à ton tour. Il a ses propres PV (5 × ton niveau)."),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une."),
      P(5, "Pluie de flèches", "action", "repos long", "Toutes les créatures dans un cercle de 3 m : attaque à distance chacune, 2d8 perforant.", { uses: 1, range: "45 m" }),
      P(9, "Camouflage", "action", "repos court", "Invisible tant que tu ne bouges pas et n'attaques pas, pendant 10 minutes.", { uses: 1 }),
      P(13, "Tir mortel", "passif", "repos court", "Une attaque à distance qui touche devient un critique.", { uses: 1 }),
      P(17, "Tueuse d'ennemis", "passif", "passif", "Une fois par tour, ajoute ta Sagesse à une attaque ou aux dégâts contre ta proie désignée."),
    ],
  },
  {
    id: "fantasy-barde",
    genre: "fantasy",
    name: "Barde",
    role: "Soutien, charme, polyvalence",
    pitch: "Sa chanson fait pleurer les rois. Sa voix peut aussi briser un crâne.",
    hitDie: 8,
    mainStats: ["Charisme"],
    saves: ["Dextérité", "Charisme"],
    armor: "Armures légères",
    weapons: "Armes courantes, rapières, épées longues",
    skills: { choose: 3, from: SKILLS.map((s) => s.name) },
    startingGear: ["Rapière", "Instrument de musique", "Armure de cuir", "Sac d'artiste"],
    powers: [
      P(1, "Inspiration", "action bonus", "repos long", "Un allié gagne un d6 à ajouter à un test, une attaque ou une sauvegarde (d8 au niveau 5, d10 au 10, d12 au 15).", { uses: 3 }),
      P(1, "Moquerie cruelle", "action", "à volonté", "Sauvegarde de Sagesse ou 1d4 psychique et désavantage à sa prochaine attaque.", { range: "18 m" }),
      P(1, "Mot de guérison", "action bonus", "repos long", "1d4 + Charisme PV à distance.", { uses: 2, range: "18 m" }),
      P(3, "Touche-à-tout", "passif", "passif", "Ajoute la moitié de ta maîtrise aux tests où tu n'es pas maîtrisé."),
      P(5, "Hypnose", "action", "repos long", "Une créature : sauvegarde de Sagesse ou charmée et incapable d'agir pendant 1 minute.", { uses: 1, range: "36 m" }),
      P(9, "Chant de repos", "passif", "passif", "Pendant un repos court, chaque allié qui dépense des dés de vie récupère 1d8 PV de plus."),
      P(13, "Contre-charme", "réaction", "repos court", "Annule un pouvoir ou un effet de peur ou de charme qui vise un allié à 9 m.", { uses: 2 }),
      P(17, "Paroles de création", "action", "repos long", "Un ennemi à 30 PV ou moins meurt, ou un allié à 0 PV se relève avec la moitié de ses PV.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-paladin",
    genre: "fantasy",
    name: "Paladin",
    role: "Tank, dégâts sacrés, aura",
    pitch: "Il a juré. Il tiendra parole, même contre son propre camp.",
    hitDie: 10,
    mainStats: ["Force", "Charisme"],
    saves: ["Sagesse", "Charisme"],
    armor: "Toutes les armures et boucliers",
    weapons: "Toutes les armes",
    skills: { choose: 2, from: ["Athlétisme", "Intuition", "Intimidation", "Médecine", "Persuasion", "Histoire"] },
    startingGear: ["Épée longue et bouclier", "Cotte de mailles", "Cinq javelines", "Symbole sacré"],
    powers: [
      P(1, "Imposition des mains", "action", "repos long", "Réserve de 5 × niveau PV à distribuer au toucher, ou 5 points pour guérir un poison.", { uses: 1 }),
      P(1, "Sens divin", "action", "repos long", "Repère les morts-vivants, démons et créatures célestes à 18 m.", { uses: 3 }),
      P(2, "Châtiment divin", "passif", "repos long", "Quand tu touches au contact : +2d8 radiant (+1d8 contre morts-vivants et démons).", { uses: 3 }),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une."),
      P(6, "Aura de protection", "passif", "passif", "Toi et les alliés à 3 m ajoutez ton Charisme à vos jets de sauvegarde."),
      P(9, "Serment inébranlable", "action bonus", "repos long", "Pendant 1 minute : immunisé à la peur et au charme, avantage aux attaques contre la cible de ton serment.", { uses: 1 }),
      P(13, "Aura de courage", "passif", "passif", "Les alliés à 3 m ne peuvent pas être effrayés."),
      P(17, "Avatar", "action", "repos long", "Pendant 1 minute : ailes, lumière vive, résistance à tous les dégâts, +1d8 radiant à chaque attaque.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-druide",
    genre: "fantasy",
    name: "Druide",
    role: "Contrôle, soins, métamorphose",
    pitch: "La forêt lui parle. Parfois, elle lui demande de mordre.",
    hitDie: 8,
    mainStats: ["Sagesse"],
    saves: ["Intelligence", "Sagesse"],
    armor: "Armures légères et intermédiaires sans métal, boucliers en bois",
    weapons: "Bâtons, cimeterres, dagues, frondes, lances",
    skills: { choose: 2, from: ["Arcanes / Savoir", "Dressage", "Intuition", "Médecine", "Perception", "Survie"] },
    startingGear: ["Cimeterre", "Bouclier en bois", "Armure de cuir", "Focaliseur druidique (branche de houx)"],
    powers: [
      P(1, "Gourdin magique", "action bonus", "à volonté", "Ton bâton utilise ta Sagesse et inflige 1d8 pendant 1 minute."),
      P(1, "Enchevêtrement", "action", "repos long", "Carré de 6 m : sauvegarde de Force ou entravé par les racines pendant 1 minute.", { uses: 2, range: "27 m" }),
      P(1, "Baies nourricières", "action", "repos long", "Dix baies qui rendent 1 PV chacune et nourrissent pour la journée.", { uses: 1 }),
      P(2, "Forme sauvage", "action", "repos court", "Deviens un animal (loup, ours, araignée géante…) pour 1 heure, avec ses PV en plus des tiens.", { uses: 2 }),
      P(5, "Appel de la foudre", "action", "repos long", "Pendant 10 minutes, une fois par tour : 3d10 foudre dans un cercle de 1,5 m (moitié si sauvegarde).", { uses: 1, range: "36 m" }),
      P(9, "Mur d'épines", "action", "repos long", "Un mur de ronces de 18 m : 7d8 perforant à qui le traverse.", { uses: 1, range: "36 m" }),
      P(13, "Langage de la terre", "action", "repos long", "Pendant 10 minutes, les plantes et la pierre te racontent ce qui s'est passé ici dans la journée.", { uses: 1 }),
      P(17, "Forme élémentaire", "action", "repos long", "Deviens un élémentaire de feu, d'eau, d'air ou de terre pour 1 heure.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-barbare",
    genre: "fantasy",
    name: "Barbare",
    role: "Tank, dégâts au contact",
    pitch: "Il ne sait pas parer. Il n'en a jamais eu besoin.",
    hitDie: 12,
    mainStats: ["Force", "Constitution"],
    saves: ["Force", "Constitution"],
    armor: "Armures légères et intermédiaires, boucliers",
    weapons: "Toutes les armes",
    skills: { choose: 2, from: ["Athlétisme", "Intimidation", "Perception", "Survie", "Dressage"] },
    startingGear: ["Hache à deux mains", "Deux hachettes", "Quatre javelines", "Sac d'explorateur"],
    powers: [
      P(1, "Rage", "action bonus", "repos long", "Pendant 1 minute : +2 dégâts au contact (+3 au niveau 9, +4 au 16), résistance aux dégâts contondants, perforants et tranchants, avantage en Force. Pas de pouvoir à lancer pendant la rage. Une utilisation de plus aux niveaux 3, 6 et 12.", { uses: 2 }),
      P(1, "Défense sans armure", "passif", "passif", "Sans armure, ta CA vaut 10 + Dextérité + Constitution. Le bouclier reste permis."),
      P(2, "Attaque téméraire", "passif", "à volonté", "À ta première attaque du tour, tu peux frapper sans te couvrir : avantage à tes attaques de Force ce tour-ci, mais les attaques contre toi ont l'avantage jusqu'à ton prochain tour."),
      P(3, "Frénésie", "action bonus", "à volonté", "Pendant ta rage, une attaque au contact de plus à chaque tour. Quand la rage s'arrête, désavantage aux attaques et aux tests jusqu'à ton prochain repos court."),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une. Ton déplacement augmente de 3 m si tu ne portes pas d'armure lourde."),
      P(9, "Critique brutal", "passif", "passif", "Sur un coup critique au contact, lance un dé de dégâts d'arme de plus (deux au niveau 13, trois au 17)."),
      P(13, "Rage implacable", "passif", "passif", "Pendant ta rage, si tu tombes à 0 PV sans mourir sur le coup : sauvegarde de Constitution DD 10 pour rester à 1 PV. Le DD monte de 5 à chaque réussite et revient à 10 après un repos court."),
      P(17, "Colère sans fond", "passif", "passif", "Ta rage ne s'arrête que si tu le décides ou si tu tombes inconscient. Si tu commences un combat sans rage disponible, tu en récupères une."),
    ],
  },
  {
    id: "fantasy-moine",
    genre: "fantasy",
    name: "Moine",
    role: "Dégâts rapides, mobilité, neutralisation",
    pitch: "Il frappe trois fois pendant que tu dégaines.",
    hitDie: 8,
    mainStats: ["Dextérité", "Sagesse"],
    saves: ["Force", "Dextérité"],
    armor: "Aucune",
    weapons: "Armes courantes, épées courtes",
    skills: { choose: 2, from: ["Acrobaties", "Athlétisme", "Discrétion", "Histoire", "Intuition", "Arcanes / Savoir"] },
    startingGear: ["Bâton", "Dix fléchettes", "Bol en bois et chapelet de buis", "Sac d'explorateur"],
    powers: [
      P(1, "Arts martiaux", "passif", "à volonté", "Tes coups à mains nues font 1d6 (1d8 au niveau 5, 1d10 au 11, 1d12 au 17) et utilisent ta Dextérité. Après une attaque à mains nues ou au bâton, une frappe à mains nues en action bonus."),
      P(1, "Défense sans armure", "passif", "passif", "Sans armure ni bouclier, ta CA vaut 10 + Dextérité + Sagesse."),
      P(2, "Souffle", "action bonus", "repos court", "Réserve de points de souffle égale à ton niveau. Déluge de coups (1 point : deux frappes à mains nues), Patience (1 point : esquiver), Pas du vent (1 point : foncer ou se désengager, sauts doublés)."),
      P(3, "Parade de projectiles", "réaction", "à volonté", "Réduis les dégâts d'une attaque à distance de 1d10 + Dextérité + niveau. Si tu tombes à 0, tu attrapes le projectile ; pour 1 point de souffle, tu le renvoies (attaque à distance, dégâts d'arts martiaux).", { range: "9 m" }),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une."),
      P(5, "Frappe étourdissante", "passif", "repos court", "Quand tu touches au contact, dépense 1 point de souffle : sauvegarde de Constitution ou étourdi jusqu'à la fin de ton prochain tour."),
      P(7, "Dérobade", "passif", "passif", "Contre une zone qui demande une sauvegarde de Dextérité : aucun dégât si tu la réussis, moitié si tu la rates."),
      P(13, "Corps de pierre", "passif", "passif", "Immunisé au poison et aux maladies. Maîtrise de tous les jets de sauvegarde ; 1 point de souffle pour relancer un échec."),
      P(17, "Paume vibrante", "action", "repos long", "Tu touches une créature et laisses une vibration dans ses os. Plus tard, quand tu veux (une action, même à distance) : sauvegarde de Constitution ou elle tombe à 0 PV ; si elle réussit, 10d10 nécrotique.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-ensorceleur",
    genre: "fantasy",
    name: "Ensorceleuse",
    role: "Dégâts magiques, puissance brute",
    pitch: "Personne ne lui a rien appris. C'est bien ce qui inquiète les Peseurs.",
    hitDie: 6,
    mainStats: ["Charisme"],
    saves: ["Constitution", "Charisme"],
    armor: "Aucune",
    weapons: "Dagues, bâtons, frondes, arbalètes légères",
    skills: { choose: 2, from: ["Arcanes / Savoir", "Intuition", "Intimidation", "Persuasion", "Tromperie", "Histoire"] },
    startingGear: ["Arbalète légère et 20 carreaux", "Deux dagues", "Éclat de verre rouge (focaliseur)", "Sac d'explorateur"],
    powers: [
      P(1, "Lignée", "passif", "passif", "Ton pouvoir vient du sang, pas des livres. Ta lignée, choisie dès le niveau 1, fixe ton élément, celui de l'Éclat, de la Gerbe et de l'Éclair, et ce qu'elle a laissé dans ton corps."),
      P(1, "Éclat", "action", "à volonté", "Attaque à distance : 1d10 de ton élément (2d10 au niveau 5, 3d10 au 11, 4d10 au 17).", { range: "36 m" }),
      P(1, "Gerbe", "action", "repos long", "Cône de 4,5 m : 3d6 de ton élément, moitié si sauvegarde de Dextérité réussie.", { uses: 2 }),
      P(2, "Métamagie", "passif", "repos long", "Points de sorcellerie égaux à ton niveau. Accélération (2 points : un pouvoir qui prend une action se lance en action bonus), Jumelage (1 point : un pouvoir à cible unique en vise une deuxième), Prudence (1 point : tes alliés réussissent d'office la sauvegarde contre ta zone), Mutation (1 point : change le type de dégâts)."),
      P(3, "Pas de brume", "action bonus", "repos long", "Tu disparais et réapparais dans un endroit que tu vois.", { uses: 2, range: "9 m" }),
      P(5, "Éclair", "action", "repos long", "Ligne de 30 m sur 1,5 m : 8d6 de ton élément, moitié si sauvegarde de Dextérité réussie.", { uses: 2 }),
      P(9, "Le Souffle te porte", "action bonus", "repos court", "Pendant 10 minutes, tu voles à ta vitesse normale.", { uses: 1 }),
      P(13, "Désintégration", "action", "repos long", "Un rayon : sauvegarde de Dextérité ou 10d6 + 40 force. Une créature réduite à 0 PV tombe en poussière.", { uses: 1, range: "18 m" }),
      P(17, "Débordement", "action bonus", "repos long", "Tu récupères tous tes points de sorcellerie. Pendant 1 minute, une métamagie par tour ne coûte rien.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-occultiste",
    genre: "fantasy",
    name: "Occultiste",
    role: "Dégâts à distance, malédictions, manipulation",
    pitch: "Une voix lui a offert ce qu'il voulait. Il n'a pas demandé son nom.",
    hitDie: 8,
    mainStats: ["Charisme"],
    saves: ["Sagesse", "Charisme"],
    armor: "Armures légères",
    weapons: "Armes courantes",
    skills: { choose: 2, from: ["Arcanes / Savoir", "Histoire", "Intimidation", "Investigation", "Tromperie", "Intuition"] },
    startingGear: ["Arbalète légère et 20 carreaux", "Deux dagues", "Armure de cuir", "Un objet qui appartenait à un mort (focaliseur)", "Sac d'érudit"],
    powers: [
      P(1, "Patron", "passif", "passif", "Une voix t'a parlé la première et tu lui as répondu. Ton patron, choisi dès le niveau 1, te donne ses premiers dons dès le niveau 1. Le MJ sait qui parle vraiment ; toi, pas toujours."),
      P(1, "Décharge occulte", "action", "à volonté", "Attaque à distance : 1d10 force. Un rayon de plus aux niveaux 5, 11 et 17, sur la même cible ou sur d'autres.", { range: "36 m" }),
      P(1, "Maléfice", "action bonus", "repos court", "Pendant 1 heure : +1d6 nécrotique à chaque coup contre la cible, et désavantage à ses tests d'une caractéristique au choix. Si elle meurt, tu passes le maléfice à une autre en action bonus.", { uses: 2, range: "27 m" }),
      P(2, "Faveurs", "passif", "passif", "Deux faveurs du patron (une de plus aux niveaux 5, 9, 13 et 17) : Décharge repoussante (repousse de 3 m), Décharge vorace (+Charisme aux dégâts), Yeux de nuit (vision dans le noir, même magique), Mille visages (déguisement à volonté), Voix volée (tu imites une voix entendue une fois)."),
      P(3, "Pacte", "passif", "passif", "Pacte de la lame (une arme qui apparaît dans ta main et utilise ton Charisme), du grimoire (trois tours de magie de n'importe quelle classe) ou de la chaîne (un familier : corbeau, rat ou chat noir, qui touche à ta place pour tes pouvoirs)."),
      P(5, "Bouche d'en bas", "action", "repos court", "Sphère de 6 m de rayon pendant 1 minute : noir complet, terrain difficile, 2d6 froid au début du tour de ceux qui y sont et 2d6 acide à la fin (sauvegarde de Dextérité contre l'acide).", { uses: 2, range: "45 m" }),
      P(9, "Demander au patron", "action", "repos long", "Trois questions, trois réponses courtes et honnêtes. Dans Aubreterre, le MJ prend un Murmure.", { uses: 1 }),
      P(13, "Cercle de mort", "action", "repos long", "Sphère de 18 m de rayon : 8d6 nécrotique, moitié si sauvegarde de Constitution réussie.", { uses: 1, range: "45 m" }),
      P(17, "La voix d'un absent", "action", "repos long", "Jusqu'à cinq créatures entendent un mort qu'elles ont aimé. Sauvegarde de Sagesse ou elles obéissent pendant 1 heure à un ordre d'une phrase qui ne les tue pas. Celles qui réussissent sont effrayées jusqu'à ton prochain tour.", { uses: 1, range: "18 m" }),
    ],
  },
  {
    id: "fantasy-chasseur-de-morts",
    genre: "fantasy",
    name: "Chasseur de morts",
    role: "Dégâts contre les morts, contrôle au contact",
    pitch: "Huit sous la paire de talons, et il rapporte les clous pour le prouver.",
    hitDie: 10,
    mainStats: ["Force", "Sagesse"],
    saves: ["Constitution", "Sagesse"],
    armor: "Armures légères et intermédiaires, boucliers",
    weapons: "Toutes les armes",
    skills: { choose: 3, from: ["Athlétisme", "Médecine", "Intimidation", "Perception", "Survie", "Investigation", "Arcanes / Savoir"] },
    startingGear: ["Marteau de cloueur en fer froid", "Vingt clous à tête carrée et une poche de sel", "Brigandine", "Trois pots de goudron et un briquet", "Arbalète légère et 20 carreaux"],
    powers: [
      P(1, "Fer froid", "passif", "passif", "Une fois par tour, tes armes de la Confrérie font +1d4 radiant à un mort-vivant (1d6 au niveau 5, 1d8 au 11, 1d10 au 17)."),
      P(1, "Œil du cloueur", "passif", "passif", "Devant un corps, tu sais s'il va se relever et dans combien de nuits. Avantage pour pister les morts-vivants et trouver leurs nids."),
      P(1, "Clouer", "action", "à volonté", "Un mort-vivant à 0 PV ou un cadavre au contact : un clou dans chaque talon, un dans chaque paume, du sel dans la bouche. Il ne se relève plus, ni à la troisième nuit ni par magie. La Confrérie paie la prime sur les clous."),
      P(2, "Clou au pied", "passif", "repos court", "Quand tu touches au contact : vitesse 0 jusqu'à la fin de son prochain tour (sauvegarde de Force, avec désavantage pour un mort-vivant).", { uses: 2 }),
      P(3, "Pot de goudron", "action", "repos court", "Cercle de 3 m : 2d6 feu (moitié si sauvegarde de Dextérité). Le sol brûle 1 minute : 1d6 feu à qui y entre ou y finit son tour. Les morts brûlés là ne se relèvent pas. 3d6 au niveau 9, 4d6 au 13.", { uses: 2, range: "9 m" }),
      P(5, "Attaque supplémentaire", "passif", "passif", "Deux attaques au lieu d'une."),
      P(6, "Veillée de loge", "action", "repos long", "Le rituel de la veillée en une heure au lieu de trois nuits, sur tous les corps dans 9 m. Pendant 24 heures, rien ne s'y relève, et les alliés qui y prennent un repos court récupèrent un dé de vie de plus.", { uses: 1 }),
      P(9, "Sel dans la bouche", "réaction", "repos court", "Un mort-vivant à 1,5 m va attaquer ou parler : tu lui enfonces du sel dans la gorge. Sauvegarde de Constitution ou il perd son action. Marche aussi contre la voix d'un Porte-Voix.", { uses: 2 }),
      P(13, "Maître-cloueur", "passif", "passif", "Résistance aux dégâts nécrotiques. Les morts-vivants ne peuvent ni t'effrayer ni te charmer. Ton Fer froid marche aussi contre ceux qui commandent aux morts."),
      P(17, "Les neuf clous", "action", "repos long", "Tu cloues debout un mort-vivant au contact. Sauvegarde de Constitution : s'il la rate, il est détruit s'il a 100 PV ou moins, sinon il subit 10d10 radiant et reste entravé 1 minute. S'il la réussit, 5d10 radiant.", { uses: 1 }),
    ],
  },
  {
    id: "fantasy-veilleur",
    genre: "fantasy",
    name: "Veilleur du sceau",
    role: "Soutien, contrôle, résistance aux Murmures",
    pitch: "Il entend le sceau craquer comme une poutre la nuit, et il n'en dort plus.",
    hitDie: 8,
    mainStats: ["Sagesse"],
    saves: ["Constitution", "Sagesse"],
    armor: "Armures légères et intermédiaires",
    weapons: "Armes courantes",
    skills: { choose: 2, from: ["Intuition", "Médecine", "Perception", "Histoire", "Arcanes / Savoir", "Persuasion"] },
    startingGear: ["Lanterne au verre bleu", "Bâton ferré", "Armure de cuir", "Neuf clous et un sachet de sel", "Craie et bâtons de cire"],
    powers: [
      P(1, "Oreille fêlée", "passif", "passif", "Tu sens à 18 m les corps qui vont se relever et les endroits où le sceau est fendu. Quand le MJ dépense un Murmure contre toi ou un allié à 9 m, il doit te le dire."),
      P(1, "Lanterne froide", "action", "à volonté", "Sauvegarde de Sagesse ou 1d8 radiant, et un mort-vivant touché ne peut pas s'approcher de toi jusqu'à ton prochain tour (progresse comme le trait de feu).", { range: "9 m" }),
      P(1, "Tiens bon", "réaction", "repos long", "Un allié à 9 m rate une sauvegarde de Sagesse ou de Charisme : il la relance et ajoute ta Sagesse.", { uses: 2 }),
      P(2, "Repousser les morts", "action", "repos court", "Les morts-vivants à 9 m : sauvegarde de Sagesse ou repoussés de 6 m, incapables d'approcher pendant 1 minute. Prix : un dé de vie dépensé sans le lancer pour leur imposer le désavantage.", { uses: 1 }),
      P(3, "Cercle de sel", "action", "repos long", "Cercle de 3 m de rayon, tracé en une minute (en une action si tu paies un dé de vie). Pendant 1 heure, les morts-vivants n'y entrent pas et n'attaquent pas au contact ceux qui sont dedans, sauf sauvegarde de Charisme réussie à chaque tour.", { uses: 1 }),
      P(5, "Poids du sceau", "action", "repos long", "Sphère de 6 m pendant 1 minute : les ennemis y ont la moitié de leur vitesse et pas de réaction ; un mort-vivant qui y commence son tour est entravé jusqu'au suivant (sauvegarde de Sagesse). Prix : un dé de vie.", { uses: 2, range: "27 m" }),
      P(9, "Renforcer le sceau", "action", "repos long", "Dix minutes de prière les mains à plat sur une fissure, une tombe ou un autel. Le MJ perd tous les Murmures qu'il a en réserve. Dans Aubreterre, la jauge du Sceau remonte de 1 (une fois par mois de jeu). Prix : la moitié de tes dés de vie restants.", { uses: 1 }),
      P(13, "Sourd aux voix", "passif", "passif", "Toi et les alliés à 3 m ne pouvez être ni charmés ni forcés à obéir. Quand le MJ dépense un Murmure contre l'un d'eux, tu peux le prendre à sa place."),
      P(17, "Devenir le couvercle", "action", "repos long", "Pendant 1 minute, rien ne se relève à 36 m de toi, aucun pouvoir ne donne de Murmure, et chaque mort-vivant dans la zone a le désavantage à tout et subit 4d10 radiant au début de son tour (moitié si sauvegarde de Sagesse). Prix : à la fin, tu tombes à 1 PV et tu perds tous tes dés de vie.", { uses: 1 }),
    ],
  },
];

// --- Sous-classes ---
// Deux par classe. Le niveau d'entrée suit subclassLevel() (shared/origins.ts) ; les pouvoirs suivants
// tombent sur les niveaux que la table de base laisse vides, en suivant le rythme de la 5e.

const SUBCLASSES: Record<string, { title: string; list: Subclass[] }> = {
  "fantasy-guerrier": {
    title: "École d'armes",
    list: [
      {
        id: "guerrier-veteran-des-neuf-cents",
        name: "Vétéran des Neuf Cents",
        pitch: "Trente hivers sur le Mur, et il frappe toujours au même endroit : là où ça casse.",
        description: "Les forts du Mur des Neuf Cents forment des soldats qui ne font rien de compliqué. Ils frappent juste, marchent loin et dorment debout. Pas de botte secrète : des années de répétition, jusqu'à ce que chaque coup trouve le défaut de l'armure.",
        powers: [
          P(3, "Coup qui porte", "passif", "passif", "Tes attaques d'arme font un coup critique sur 19 ou 20."),
          P(7, "Pas de marche", "passif", "passif", "Ajoute la moitié de ta maîtrise aux tests de Force, de Dextérité et de Constitution que tu ne maîtrises pas. Tu peux marcher une journée et une nuit d'affilée sans prendre d'épuisement."),
          P(10, "Deuxième garde", "passif", "passif", "Choisis un deuxième style de combat parmi ceux du guerrier."),
          P(15, "Coup qui tranche", "passif", "passif", "Tes attaques d'arme font un coup critique sur 18, 19 ou 20."),
        ],
      },
      {
        id: "guerrier-garde-du-seuil",
        name: "Garde du Seuil",
        pitch: "On lui a appris à tenir une porte. Pour lui, tout le reste est une porte aussi.",
        description: "La Garde du Seuil veille sur la Rotonde d'Aube-Close depuis six siècles. Ses hommes ne poursuivent jamais personne : ils restent devant, bouclier levé, et ce qui veut passer doit passer sur eux. Depuis le Glas, la Garde repousse les Levés à la fourche dans les fossés de chaux, et ses vétérans se louent cher.",
        powers: [
          P(3, "Fermer la porte", "passif", "à volonté", "Une créature que tu touches avec une attaque d'opportunité tombe à vitesse 0 jusqu'à la fin du tour. Se désengager ne l'empêche pas de provoquer ton attaque d'opportunité."),
          P(7, "Bouclier levé", "réaction", "à volonté", "Avec un bouclier au bras : une créature que tu vois attaque un allié à 1,5 m de toi. Elle a le désavantage à cette attaque."),
          P(10, "Derrière moi", "passif", "passif", "Les alliés à 1,5 m de toi gagnent +1 à la CA et aux sauvegardes de Dextérité tant que tu n'es pas neutralisé."),
          P(15, "Personne ne passe", "action bonus", "repos long", "Pendant 1 minute, tu tiens une ligne de trois cases devant toi. Une créature qui veut la franchir fait une sauvegarde de Force ; si elle la rate, elle s'arrête là. Qu'elle passe ou non, tu l'attaques une fois sans dépenser ta réaction (une fois par créature et par tour).", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-magicien": {
    title: "Discipline",
    list: [
      {
        id: "magicienne-main-de-braise",
        name: "Main de braise",
        pitch: "Elle sait exactement où s'arrête sa boule de feu, au pouce près, et elle ne te le dira pas.",
        description: "La discipline du feu tenu en laisse. Les Peseurs la jugent gaspilleuse, les légions d'Hersende la paient au mois. Une main de braise apprend d'abord à ne pas brûler les siens, ensuite à brûler tout le reste.",
        powers: [
          P(2, "Zone épargnée", "passif", "à volonté", "Quand tu lances un pouvoir de zone, choisis jusqu'à 1 + ton Intelligence créatures que tu vois : elles réussissent la sauvegarde d'office et ne subissent aucun dégât."),
          P(6, "Braise qui colle", "passif", "passif", "Quand ton Trait de feu rate, la cible subit quand même des dégâts de feu égaux à ton Intelligence. Quand une créature réussit sa sauvegarde contre l'un de tes pouvoirs de dégâts, elle en subit quand même la moitié, même si le pouvoir ne le prévoit pas."),
          P(10, "Feu nourri", "passif", "passif", "Ajoute ton Intelligence à un jet de dégâts de chacun de tes pouvoirs de magicienne."),
          P(14, "Pousser la flamme", "passif", "repos long", "Sur un pouvoir de niveau 5 ou moins, compte chaque dé de dégâts à son maximum. Tu peux recommencer avant ton repos long, mais chaque fois de plus te coûte 2d12 nécrotique par fois déjà utilisée, que rien ne réduit.", { uses: 1 }),
        ],
      },
      {
        id: "magicienne-peseuse",
        name: "Peseuse de la Tour",
        pitch: "Elle tient le compte de chaque sort lancé dans sa vie. Du tien aussi, si tu restes assez longtemps.",
        description: "On entre chez les Peseurs par une passerelle au troisième étage d'une tour sans porte. On en sort avec une balance de laiton au cou et un registre qu'on remplit jusqu'à sa mort. La Peseuse ne lance pas plus de sorts que les autres : elle sait mieux ce qu'ils coûtent, et comment faire payer ceux des autres.",
        powers: [
          P(2, "Balance de laiton", "passif", "passif", "Tu sens tout pouvoir lancé à 18 m de toi, sa direction, et s'il est puissant (pouvoir de niveau 5 ou plus). Dans Aubreterre, tu sais chaque fois que le MJ gagne un Murmure à cette distance."),
          P(6, "Contrepoids", "réaction", "repos court", "Une créature à 18 m lance un pouvoir : fais un test d'Intelligence (tu ajoutes ta maîtrise) contre DD 10 + son niveau ou son FP. Si tu réussis, le pouvoir échoue et l'utilisation est perdue.", { uses: 1, range: "18 m" }),
          P(10, "Tare", "passif", "passif", "Avantage aux sauvegardes contre les pouvoirs, et résistance aux dégâts qu'ils infligent."),
          P(14, "Le grand registre", "action", "repos long", "Tu poses ta balance au sol. Pendant 1 minute, dans une sphère de 9 m autour d'elle, un ennemi qui lance un pouvoir subit 4d10 force et fait une sauvegarde de Constitution : s'il la rate, le pouvoir échoue. Tes propres pouvoirs n'y donnent aucun Murmure.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-voleur": {
    title: "Spécialité",
    list: [
      {
        id: "voleur-coupe-bourse",
        name: "Coupe-bourse de Port-Lagune",
        pitch: "Il a appris le métier sur des passerelles qui bougent, au-dessus d'une eau qui pue la saumure.",
        description: "À Port-Lagune, les rues sont des canaux et les toits se touchent. Les coupe-bourses y grimpent mieux que les chats et volent la chevalière d'un armateur pendant qu'il serre la main de quelqu'un d'autre. Un vrai voleur, à l'ancienne : vite dedans, vite dehors.",
        powers: [
          P(3, "Pieds de pilotis", "passif", "passif", "Grimper ne te coûte pas de déplacement en plus. Tes sauts gagnent 30 cm par point de Dextérité. Une passerelle qui bouge, un pont mouillé ou un toit d'ardoise ne te font jamais tomber."),
          P(7, "Pas de bruit", "passif", "passif", "Avantage aux tests de Discrétion si tu ne parcours pas plus de la moitié de ta vitesse ce tour-ci."),
          P(11, "Lire les sceaux", "passif", "passif", "Tu utilises n'importe quel objet magique ou parchemin, quelle que soit la classe qu'il demande. Au toucher, tu reconnais un faux sceau de la Hanse, de l'Église ou de la Chancellerie."),
          P(15, "Premier dans la pièce", "passif", "passif", "Au premier round d'un combat, tu joues deux tours : le premier à ton initiative, le second à ton initiative moins 10."),
        ],
      },
      {
        id: "voleur-plume-muette",
        name: "Plume muette",
        pitch: "Elle n'écrit jamais « je ». Elle écrit ce que tu as fait mardi soir, et à qui.",
        description: "La Chancellerie Muette n'existe plus, officiellement. Ses agents ont le pouce taché d'encre violette et des dossiers sur tout le monde. Ils forgent des laissez-passer, apprennent les secrets et frappent quand l'autre ne regarde plus. Ils citent le Code en tranchant une gorge.",
        powers: [
          P(3, "Faussaire", "passif", "passif", "Maîtrise du nécessaire de faussaire et du nécessaire de déguisement. Tu imites une écriture vue une fois. En une heure, tu fabriques un laissez-passer qu'un garde ordinaire accepte sans test."),
          P(7, "Dossier", "action", "repos court", "Une minute à observer ou à faire parler une créature hors combat. Le MJ te dit sa sauvegarde la plus faible et une chose qu'elle veut cacher. Pendant 1 heure, avantage aux tests de Persuasion, de Tromperie et d'Intimidation contre elle.", { uses: 2 }),
          P(11, "Faux témoin", "réaction", "repos court", "Une créature à 9 m va t'attaquer : oppose ta Tromperie à son Intuition. Si tu gagnes, elle doit choisir une autre cible, ou perdre l'attaque s'il n'y en a pas.", { uses: 2, range: "9 m" }),
          P(15, "Rayé des registres", "action", "repos long", "Pendant 8 heures, aucune magie ne te trouve ni ne lit tes pensées, et ceux qui t'ont vu oublient ton visage dès que tu sors de leur vue. Pendant ce temps, ton attaque sournoise fait +2d6 contre une créature qui ne t'a pas vu avant ce tour.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-clerc": {
    title: "Domaine",
    list: [
      {
        id: "clerc-battoir-de-sainte-mauve",
        name: "Battoir de Sainte Mauve",
        pitch: "Les manches retroussées au-dessus du coude, même en janvier, et les mains rouges d'eau froide.",
        description: "Sainte Mauve a lavé les corps d'une épidémie entière sans tomber malade. Ses clercs soignent les vivants, lavent les morts et ne demandent à personne de quel camp il vient. Les Veilleuses les prient d'entrer dans les fermes. Leur symbole est un battoir de bois, et ils savent s'en servir.",
        powers: [
          P(1, "Eau de lavoir", "passif", "passif", "Maîtrise des armures lourdes. Quand tu rends des PV avec un pouvoir, la cible récupère en plus 2 + la moitié de ton niveau."),
          P(6, "Laver l'autre", "passif", "passif", "Quand tu rends des PV à une autre créature, tu récupères toi aussi 1d6 PV."),
          P(10, "Jamais malade", "passif", "passif", "Immunisé aux maladies. Une fois par tour, tes attaques d'arme font +1d8 radiant (2d8 au niveau 14)."),
          P(14, "Les mains suffisent", "passif", "passif", "Quand tu rends des PV avec un pouvoir, compte chaque dé à son maximum."),
        ],
      },
      {
        id: "clerc-ruban-de-saint-ruben",
        name: "Ruban de Saint Ruben",
        pitch: "Son saint est mort deux fois. Il sait comment on s'y prend, et comment on revient.",
        description: "Ruben est mort au gibet, revenu trois jours après, et il a passé un an à enterrer les autres avant de se recoucher de lui-même. Un évêque l'a canonisé en secret. L'Église déclare son culte hérétique, les Rendus le prient. Ses clercs portent un ruban noir au poignet et se tiennent au bord de la tombe, du côté des vivants.",
        powers: [
          P(1, "Au bord du trou", "action bonus", "à volonté", "Une créature à 0 PV à 9 m se stabilise. Tu sens à 18 m les créatures à 0 PV, les morts-vivants et les Rendus.", { range: "9 m" }),
          P(6, "Pas encore", "réaction", "repos long", "Un allié à 9 m tombe à 0 PV sans mourir sur le coup : il reste à 1 PV.", { uses: 1, range: "9 m" }),
          P(10, "Ce qui ne se relève pas", "passif", "passif", "Une créature qui meurt à 9 m de toi ne se relève pas en mort-vivant. Une fois par tour, quand tu touches une créature qui a perdu plus de la moitié de ses PV, +2d8 nécrotique."),
          P(14, "Revenir une fois", "action", "repos long", "Au toucher, tu ramènes une créature morte depuis moins de 10 minutes, avec 1 PV. Dans Aubreterre, elle revient sans Cicatrice du Dessous, ou comme Rendue si son joueur le préfère.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-rodeur": {
    title: "Piste",
    list: [
      {
        id: "rodeuse-pisteuse-des-marches",
        name: "Pisteuse des Marches",
        pitch: "Au dégel, elle compte les os qui remontent, et elle sait lesquels marchent encore en rang.",
        description: "Les collines des Marches de Fer rendent chaque printemps des légions entières de morts. Les pisteuses vont devant les colonnes d'Hersende, repèrent les rangs et frappent les gros d'abord. Elles chassent ce qui est nombreux et ce qui est grand, et elles se battent dans la bruyère mouillée sans jamais glisser.",
        powers: [
          P(3, "Fendre le rang", "passif", "à volonté", "Une fois par tour, +1d8 dégâts à une créature qui n'a plus tous ses PV."),
          P(7, "Pas dans la boue", "passif", "passif", "Le terrain difficile non magique ne te ralentit pas. Les attaques d'opportunité contre toi ont le désavantage."),
          P(11, "Tailler dans la masse", "passif", "à volonté", "Quand tu prends l'action Attaquer, une attaque de plus contre une autre créature à 1,5 m de ta première cible (ou à 3 m d'elle si tu tires)."),
          P(15, "Lire le coup", "réaction", "à volonté", "Une attaque que tu vois te touche : tu divises ses dégâts par deux."),
        ],
      },
      {
        id: "rodeuse-passeuse-des-noyes",
        name: "Passeuse des Noyes",
        pitch: "Elle connaît les planches qui tiennent, et celles qu'on a posées pour que tu tombes.",
        description: "Dans les tourbières de l'ouest, on circule sur des passerelles que la brume efface. Les passeuses guident les voyageurs pour quelques pièces et une prière à la Mère Tourbe. Depuis que les Noyés sortent de l'eau, elles se battent aussi. Elles se battent mieux dans l'eau noire que n'importe qui sur la terre ferme.",
        powers: [
          P(3, "Brume au ras des joncs", "action bonus", "repos court", "Un banc de brume de 6 m de rayon autour de toi pendant 1 minute : on n'y voit rien. Toi, tu y vois à 9 m.", { uses: 2 }),
          P(7, "Eau noire", "passif", "passif", "Vitesse de nage égale à ta vitesse. Tu retiens ton souffle 10 minutes. Avantage aux tests pour échapper à une prise ou à des liens."),
          P(11, "Tirer sous l'eau", "passif", "à volonté", "Une fois par tour, quand tu touches une créature : sauvegarde de Force ou elle tombe à terre. Si elle a de l'eau ou de la boue jusqu'aux chevilles, elle est aussi entravée jusqu'à ton prochain tour."),
          P(15, "Ce que la tourbe garde", "action", "repos long", "Pendant 1 minute, le sol dans un rayon de 6 m devient tourbière. Terrain difficile pour tes ennemis. Ceux qui y commencent leur tour subissent 3d8 contondant et font une sauvegarde de Force ou sont entravés jusqu'au suivant.", { uses: 1, range: "27 m" }),
        ],
      },
    ],
  },
  "fantasy-barde": {
    title: "Répertoire",
    list: [
      {
        id: "barde-recitante-du-code",
        name: "Récitante du Code",
        pitch: "Neuf cents articles par cœur, et au moins un pour chaque occasion de te faire taire.",
        description: "À Aube-Close, les juges récitent le Code d'Ostral sans le lire. Certains en ont fait un art : ils plaident, ils citent, ils coupent la parole au bon moment. La récitante sait un peu de tout et le dit mieux que tout le monde. Article 312 : on ne discute pas le prix d'un chou.",
        powers: [
          P(3, "Couper la parole", "réaction", "à volonté", "Une créature à 18 m fait un jet d'attaque, un test ou un jet de dégâts : dépense une Inspiration et soustrais son dé au résultat.", { range: "18 m" }),
          P(6, "Jurisprudence", "passif", "passif", "Choisis deux pouvoirs à utilisations limitées d'autres classes fantasy, d'un niveau égal ou inférieur à ton niveau moins 3. Ils deviennent des pouvoirs de barde et utilisent ton Charisme."),
          P(10, "Citer l'article", "action", "repos court", "Jusqu'à trois créatures à 18 m qui te comprennent : sauvegarde de Sagesse ou elles obéissent à un ordre d'un mot (« Fuis », « Lâche », « À genoux ») à leur prochain tour.", { uses: 1, range: "18 m" }),
          P(14, "Le mot juste", "passif", "à volonté", "Quand tu fais un test de caractéristique, tu peux dépenser une Inspiration et ajouter son dé au résultat, même après avoir vu le d20."),
        ],
      },
      {
        id: "barde-pleureuse-du-val",
        name: "Pleureuse du Val",
        pitch: "Elle chante aux veillées du Val Cierge, et les morts l'écoutent jusqu'au dernier couplet.",
        description: "Dans le Val, on ne brûle personne : on veille, on chante, on attend la troisième nuit. Les pleureuses louent leur voix aux familles. Depuis le Glas, on a remarqué que les morts se tiennent tranquilles tant qu'elles chantent, et qu'ils ont l'air de les écouter.",
        powers: [
          P(3, "Complainte", "action", "repos court", "Autant de créatures que ton Charisme (au moins une), à 9 m, qui t'entendent : sauvegarde de Sagesse ou elles ne font que se déplacer jusqu'à la fin de leur prochain tour. Une créature blessée se réveille. Les morts-vivants ont le désavantage à cette sauvegarde.", { uses: 1, range: "9 m" }),
          P(6, "Pleurer pour deux", "réaction", "à volonté", "Un allié à 9 m subit des dégâts : dépense une Inspiration et réduis ces dégâts de son dé + ton Charisme.", { range: "9 m" }),
          P(10, "La voix des absents", "action", "repos long", "Tu chantes dix minutes au-dessus d'un mort. Il répond à cinq questions, en peu de mots. Dans Aubreterre, aucune phrase venue d'en bas ne se glisse dans ses réponses quand c'est toi qui demandes.", { uses: 1 }),
          P(14, "Dernier couplet", "action", "repos long", "Pendant 1 minute, chaque allié à 9 m qui tombe à 0 PV reste à 1 PV (une fois chacun), et tes alliés ont l'avantage aux sauvegardes contre la peur et le charme.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-paladin": {
    title: "Serment",
    list: [
      {
        id: "paladin-serment-du-seuil",
        name: "Serment du Seuil",
        pitch: "Il garde une porte. Il ne sait pas ce qu'il y a derrière, et ça ne change rien.",
        description: "Le serment le plus ancien de l'Église d'Ostral : se tenir entre ceux qu'on protège et ce qui vient. Le paladin du Seuil jure de ne jamais ouvrir une porte qu'on lui a confiée et de ne jamais laisser passer un mort. Depuis le Glas, beaucoup se demandent quelle porte leur dieu gardait.",
        powers: [
          P(3, "Arme consacrée", "action bonus", "repos court", "Pendant 1 minute, ajoute ton Charisme à tes jets d'attaque avec une arme. L'arme éclaire à 6 m.", { uses: 1 }),
          P(7, "Seuil gardé", "passif", "passif", "Toi et les alliés à 3 m ne pouvez pas être charmés (30 m au niveau 18). Un allié déjà charmé ne l'est plus en entrant dans cette zone."),
          P(15, "Porte close", "passif", "passif", "Les morts-vivants, démons, fées, élémentaires et célestes ont le désavantage pour te toucher, et ne peuvent ni te charmer, ni t'effrayer, ni te posséder."),
          P(20, "La porte du Dieu", "action", "repos long", "Pendant 1 minute, une lumière vive de 9 m sort de toi. Un ennemi qui y commence son tour subit 10 radiant. Avantage à tes sauvegardes contre les pouvoirs des morts-vivants et des démons.", { uses: 1 }),
        ],
      },
      {
        id: "paladin-serment-de-saint-brac",
        name: "Serment de Saint Brac",
        pitch: "Il a juré sur un clou à tête carrée, et il garde le clou entre les dents quand il se bat.",
        description: "Saint Brac a forgé, dit-on, les clous qui tiennent la couronne de fer sur la tête du Dieu. Ses paladins sont des forgerons, des légionnaires, parfois des maîtres-cloueurs de la Confrérie. Ils jurent de fixer ce qui doit rester en place : un mort dans sa tombe, un ennemi sur le sol, une parole donnée.",
        powers: [
          P(3, "Clou de Brac", "action bonus", "repos court", "Tu plantes un clou dans le sol près d'une créature que tu vois. Pendant 1 minute, elle ne peut pas s'éloigner à plus de 9 m du clou (sauvegarde de Force à la fin de chacun de ses tours pour l'arracher), et tes attaques contre elle font +1d6 radiant.", { uses: 1, range: "9 m" }),
          P(7, "Fer de forge", "passif", "passif", "Tes armes au contact comptent comme magiques et en fer froid. Toi et les alliés à 3 m avez la résistance aux dégâts nécrotiques (30 m au niveau 18)."),
          P(15, "Enclume", "passif", "passif", "Tant que tu portes une armure lourde, tu as la résistance aux dégâts contondants, perforants et tranchants."),
          P(20, "Forgé debout", "action", "repos long", "Pendant 1 minute : +2 à la CA, résistance à tous les dégâts sauf psychiques, et chaque créature que tu touches au contact fait une sauvegarde de Force ou reste clouée sur place (vitesse 0) jusqu'à la fin de son prochain tour.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-druide": {
    title: "Cercle",
    list: [
      {
        id: "druide-cercle-de-la-mere-tourbe",
        name: "Cercle de la Mère Tourbe",
        pitch: "Elle croit que les morts doivent redevenir de la terre. Elle donne un coup de main.",
        description: "La Mère Tourbe n'a ni temple ni prêtres, seulement des vieilles qui vivent sur pilotis dans les Noyes. Ses druides servent la pluie et ce qui pourrit pour faire pousser. Ils détestent les Levés, non par peur, mais parce qu'un mort debout, c'est un mort qui refuse de nourrir le sol.",
        powers: [
          P(2, "Ce qui pourrit fait pousser", "passif", "à volonté", "Quand une créature meurt à 9 m de toi, toi ou un allié à 9 m récupère 1d8 PV (une fois par tour). D'une action, au toucher, un cadavre tombe en terreau et ne se relève jamais."),
          P(6, "Main de tourbe", "action", "repos court", "Une créature à 18 m : 2d8 contondant et sauvegarde de Force, ou elle est entravée par la boue jusqu'à la fin de ton prochain tour.", { uses: 2, range: "18 m" }),
          P(10, "Peau de tourbe", "passif", "passif", "Résistance aux dégâts nécrotiques et de poison. Immunisé aux maladies."),
          P(14, "Rendre à la terre", "action", "repos long", "Une créature à 18 m : sauvegarde de Constitution ou 10d8 nécrotique, moitié si elle réussit. Un mort-vivant tué ainsi devient une motte de terre noire, et une touffe de bruyère y pousse dans l'heure.", { uses: 1, range: "18 m" }),
        ],
      },
      {
        id: "druide-cercle-de-la-brune",
        name: "Cercle de la Brune",
        pitch: "Les chênes de la Brune ont la largeur d'une maison, et elle connaît chacun par son nom.",
        description: "Les elfes de la Brune confient leurs morts aux arbres, qui les absorbent. Leurs druides gardent la mémoire des troncs et le chemin des clairières. Ils puisent leur force dans la forêt elle-même, et ils savent, mieux que personne, que certains arbres rendent depuis le Glas ce qu'ils avaient pris.",
        powers: [
          P(2, "Racines qui écoutent", "passif", "repos long", "Pendant un repos court, récupère une utilisation d'un pouvoir de druide de niveau 5 ou moins. Tu ne te perds jamais en forêt.", { uses: 1 }),
          P(6, "Marche des sous-bois", "passif", "passif", "Le terrain difficile non magique ne te ralentit pas. Les ronces et les épines ne te blessent pas. Avantage aux sauvegardes contre les plantes animées ou ensorcelées."),
          P(10, "Écorce", "action bonus", "repos court", "Pendant 1 heure, ta CA ne descend pas sous 16, même en forme sauvage.", { uses: 1 }),
          P(14, "Pris dans le bois", "action", "repos long", "Un tronc jaillit sous une créature à 18 m : sauvegarde de Dextérité ou elle est enfermée dans le bois, entravée, et subit 4d10 contondant au début de chacun de ses tours pendant 1 minute. Sauvegarde de Force à la fin de chacun de ses tours pour sortir.", { uses: 1, range: "18 m" }),
        ],
      },
    ],
  },
  "fantasy-barbare": {
    title: "Voie primitive",
    list: [
      {
        id: "barbare-berserker-des-marches",
        name: "Berserker des Marches",
        pitch: "Il a passé l'hiver sur le Mur avec une hache et sans manteau. Il n'a pas eu froid.",
        description: "Les Marchois brûlent leurs morts et se battent dans le vent. Les berserkers des forts sont ceux qu'on envoie en premier quand les os remontent au dégel : ils entrent dans la mêlée en hurlant, ne reculent devant rien, et laissent derrière eux de quoi faire un bûcher.",
        powers: [
          P(3, "Fumée grasse", "passif", "passif", "Pendant ta rage : résistance au froid, et tes attaques au contact font +1d6 feu aux morts-vivants. Un mort-vivant que tu réduis à 0 PV s'embrase et ne se relève pas."),
          P(6, "Rien dans la tête", "passif", "passif", "Pendant ta rage, tu ne peux être ni charmé ni effrayé. Un effet de ce genre déjà sur toi s'arrête le temps de la rage."),
          P(10, "Cri du Mur", "action", "repos court", "Les créatures de ton choix à 9 m qui t'entendent : sauvegarde de Sagesse ou effrayées jusqu'à la fin de ton prochain tour. À chacun de tes tours, tu peux prolonger d'une action.", { uses: 1, range: "9 m" }),
          P(14, "Coup pour coup", "réaction", "à volonté", "Pendant ta rage, une créature à 1,5 m te blesse : tu l'attaques au contact."),
        ],
      },
      {
        id: "barbare-fils-du-verre",
        name: "Fils du Verre",
        pitch: "Sa peau garde des éclats de verre rouge. Il a cessé de les retirer.",
        description: "Les clans du Verre-Rouge racontent que le désert est né d'un combat entre deux géants de lumière. Certains enfants naissent avec du verre sous la peau. Quand ils entrent en rage, le verre chante comme les plaques des dunes, et on raconte qu'ils grandissent.",
        powers: [
          P(3, "Peau de verre", "passif", "passif", "Pendant ta rage, une créature qui te touche au contact subit 1d6 tranchant (2d6 au niveau 10, 3d6 au 14)."),
          P(6, "Pieds dans le sable", "passif", "passif", "Résistance aux dégâts de feu, et la chaleur du désert ne te fatigue pas. Le sable et les éboulis ne te ralentissent pas. Pendant ta rage, rien ne te met à terre contre ton gré."),
          P(10, "Chant du verre", "action bonus", "repos court", "Pendant ta rage : les créatures de ton choix à 3 m font une sauvegarde de Constitution ou subissent 3d8 tonnerre et sont assourdies jusqu'à la fin de ton prochain tour (moitié des dégâts sinon).", { uses: 1 }),
          P(14, "Géant de lumière", "passif", "repos long", "Quand tu entres en rage, tu peux grandir d'une taille pour toute la rage : allonge de 3 m au contact, avantage en Force, et +1d8 radiant à chaque coup au contact.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-moine": {
    title: "Règle",
    list: [
      {
        id: "moine-main-ouverte",
        name: "Main ouverte",
        pitch: "Il n'a jamais tenu d'arme. Il n'a jamais perdu un combat non plus.",
        description: "La règle la plus répandue des abbayes : le corps comme seule arme, le souffle comme seule réserve. Ses moines frappent pour déséquilibrer, renverser, repousser. Ils soignent leurs propres blessures en respirant, et on dit que les plus anciens ne marchent plus tout à fait sur le sol.",
        powers: [
          P(3, "Main ouverte", "passif", "à volonté", "Chaque frappe du Déluge de coups qui touche impose un choix : sauvegarde de Dextérité ou à terre, sauvegarde de Force ou repoussée de 4,5 m, ou plus de réaction jusqu'à la fin de ton prochain tour."),
          P(6, "Paume qui soigne", "action", "repos long", "Tu récupères 3 × ton niveau PV.", { uses: 1 }),
          P(11, "Tranquillité", "passif", "repos long", "Après un repos long, une créature qui veut t'attaquer ou te viser d'un pouvoir fait d'abord une sauvegarde de Sagesse ; si elle la rate, elle doit choisir une autre cible. L'effet s'arrête dès que tu attaques ou que tu blesses quelqu'un.", { uses: 1 }),
          P(15, "Pas qui ne pèse pas", "passif", "passif", "Ton déplacement augmente de 3 m. Tu marches sur l'eau, sur la boue et sur les murs pendant ton tour sans tomber, et tu ignores le terrain difficile."),
        ],
      },
      {
        id: "moine-frere-du-silence",
        name: "Frère du Silence du Val",
        pitch: "Vingt ans sans dire un mot. Le jour où il crie, les vitraux de l'abbaye tombent.",
        description: "Dans une abbaye blanche du Val Cierge, entre les ruches et les vignes, les frères du Silence ont fait vœu de ne plus parler. Ils mouchent les cierges du bout des doigts, passent sans bruit dans les couloirs et gardent tout ce qu'ils ont à dire pour un seul cri.",
        powers: [
          P(3, "Vœu de silence", "passif", "à volonté", "Tant que tu n'as pas parlé depuis ton dernier repos, avantage en Discrétion et en Intuition. Quand tu touches à mains nues, 1 point de souffle : la cible ne peut plus parler, ni lancer de pouvoir qui demande la voix, jusqu'à la fin de son prochain tour."),
          P(6, "Moucher les cierges", "action bonus", "à volonté", "2 points de souffle : une sphère de 4,5 m de silence et de noir complet autour d'un point à 18 m, pendant 1 minute. Toi, tu y vois. Les flammes non magiques s'y éteignent.", { range: "18 m" }),
          P(11, "Pas de cire", "action bonus", "à volonté", "1 point de souffle : tu passes d'une zone d'ombre ou de noir à une autre que tu vois, à 18 m, sans traverser l'espace entre les deux. Ta première attaque après ce pas a l'avantage.", { range: "18 m" }),
          P(15, "Le cri", "action", "repos long", "Tu romps ton vœu. Cône de 9 m : 8d8 tonnerre et assourdis pendant 1 minute, moitié et pas assourdis si sauvegarde de Constitution réussie. Plus de Vœu de silence jusqu'à ton prochain repos long.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-ensorceleur": {
    title: "Lignée",
    list: [
      {
        id: "ensorceleuse-draconique",
        name: "Draconique",
        pitch: "Sa grand-mère gardait des écailles de wyverne dans une boîte à couture. Elle, elle les a sous la peau.",
        description: "Une bête ailée des Monts Ossiers, quelque part dans l'arbre de famille, et personne n'en parle au repas. Le sang se voit : des écailles sur la nuque, des dents trop pointues, une chaleur qui monte quand elle s'énerve. Choisis ton élément : feu, froid ou foudre.",
        powers: [
          P(1, "Écailles", "passif", "passif", "Sans armure, ta CA vaut 13 + Dextérité. +1 PV par niveau. Ton élément est le feu, le froid ou la foudre, au choix, une fois pour toutes."),
          P(6, "Sang qui chauffe", "passif", "passif", "Ajoute ton Charisme aux dégâts de tes pouvoirs de ton élément (un jet par pouvoir). 1 point de sorcellerie : résistance à ton élément pendant 1 heure."),
          P(14, "Ailes", "action bonus", "à volonté", "Des ailes sortent de ton dos : vitesse de vol égale à ta vitesse, jusqu'à ce que tu les replies d'une action bonus. Pas d'ailes sous une armure qui ne leur laisse pas de place."),
          P(18, "Regard de la bête", "action", "repos long", "Les créatures de ton choix à 18 m : sauvegarde de Sagesse ou charmées, ou effrayées, à ton choix, pendant 1 minute. Elles refont la sauvegarde à la fin de chacun de leurs tours.", { uses: 1, range: "18 m" }),
        ],
      },
      {
        id: "ensorceleuse-sang-gris",
        name: "Sang gris",
        pitch: "Tu entends parfois une voix aimable. Elle connaît ton prénom d'enfant.",
        description: "Ça a commencé la nuit du Glas, ou ça a toujours été là et le Glas l'a réveillé. Tes veines sont grises sous la peau, tes mains froides, et ton pouvoir sent la terre retournée. Les Peseurs voudraient t'étudier. Les Veilleuses te regardent avec pitié. La voix, elle, est toujours gentille.",
        powers: [
          P(1, "Sang gris", "passif", "repos long", "Résistance aux dégâts nécrotiques. Ton élément est nécrotique. Une fois par repos long, quand tu tombes à 0 PV sans mourir sur le coup, tu restes à 1 PV. Dans Aubreterre, le MJ prend alors un Murmure.", { uses: 1 }),
          P(6, "Ce qui nourrit", "passif", "passif", "Quand un de tes pouvoirs réduit une créature à 0 PV, tu gagnes des PV temporaires égaux à ton niveau + ton Charisme."),
          P(14, "Peau froide", "passif", "passif", "Vision dans le noir à 36 m. Les morts-vivants sans esprit te prennent pour l'un des leurs et ne t'attaquent pas tant que tu ne les as pas attaqués."),
          P(18, "La voix aimable", "action", "repos long", "Pendant 1 minute, tes pouvoirs ignorent la résistance aux dégâts nécrotiques et traitent l'immunité comme une résistance. Chaque créature que tu tues pendant ce temps se relève à ton service jusqu'à la fin de la minute, puis tombe en poussière. Dans Aubreterre, le MJ prend 2 Murmures.", { uses: 1 }),
        ],
      },
    ],
  },
  "fantasy-occultiste": {
    title: "Patron",
    list: [
      {
        id: "occultiste-dame-des-carrefours",
        name: "La Dame des Carrefours",
        pitch: "Une pièce sous une pierre, à un croisement, la nuit. Elle a répondu, et elle a gardé la pièce.",
        description: "Plus vieille que l'Empire, la Dame des Carrefours protège les colporteurs, les voleurs et les déserteurs. L'Église la tolère sans l'aimer. Ses occultistes ne restent jamais là où on les attend : ils changent de route, de visage, de place, et laissent leurs poursuivants au mauvais croisement.",
        powers: [
          P(1, "Pièce sous la pierre", "réaction", "repos court", "Une attaque te touche : tu deviens invisible jusqu'à la fin de ton prochain tour et tu te déplaces de la moitié de ta vitesse. En voyage, à chaque croisement, tu sais quelle route mène au danger.", { uses: 1 }),
          P(6, "Deux chemins", "action bonus", "repos court", "Tu te téléportes à 9 m dans un endroit que tu vois, ou tu échanges ta place avec un allié consentant à 9 m. Ta prochaine attaque ce tour-ci a l'avantage.", { uses: 2, range: "9 m" }),
          P(10, "Péage", "réaction", "repos court", "Une créature à 9 m se déplace vers toi : sauvegarde de Sagesse ou elle s'arrête, perd le reste de son déplacement et subit 3d6 psychique.", { uses: 2, range: "9 m" }),
          P(14, "Le mauvais croisement", "action", "repos long", "Une créature à 18 m : sauvegarde de Charisme ou elle disparaît sur une route qui n'existe pas. Elle revient à la fin de ton prochain tour, à sa place ou à la plus proche libre, et subit 8d10 psychique.", { uses: 1, range: "18 m" }),
        ],
      },
      {
        id: "occultiste-defunt-aime",
        name: "Le Défunt aimé",
        pitch: "Ta mère est morte il y a trois hivers. Depuis, elle te parle tous les soirs.",
        description: "La voix a celle d'un proche mort : un père, une sœur, un amour noyé. Elle sait des choses que seul ce proche savait. Elle t'aime, elle te protège, elle te demande parfois de petits services. Tu ne lui as jamais demandé comment elle est revenue. Le MJ sait qui parle vraiment.",
        powers: [
          P(1, "La voix", "passif", "repos long", "Télépathie à 9 m avec toute créature qui parle une langue. Une fois par repos long, la voix te souffle un conseil : avantage à un test de caractéristique.", { uses: 1 }),
          P(6, "Main froide sur l'épaule", "réaction", "repos court", "Une créature attaque un allié à 9 m : elle entend la voix d'un de ses propres morts et a le désavantage. Si elle rate quand même, elle est effrayée jusqu'à la fin de son prochain tour.", { uses: 1, range: "9 m" }),
          P(10, "Plus peur de rien", "passif", "passif", "Immunisé à l'état effrayé. Résistance aux dégâts nécrotiques. Personne ne lit tes pensées sans ton accord."),
          P(14, "Viens me voir", "action", "repos long", "Une créature à 18 m : sauvegarde de Sagesse ou elle entend la voix d'un mort qu'elle a aimé. Pendant 1 minute, elle est charmée, ne fait que marcher vers toi, et subit 4d10 psychique à chaque tour où on l'en empêche. Dans Aubreterre, le MJ prend un Murmure.", { uses: 1, range: "18 m" }),
        ],
      },
    ],
  },
  "fantasy-chasseur-de-morts": {
    title: "Métier de loge",
    list: [
      {
        id: "chasseur-bruleur",
        name: "Brûleur",
        pitch: "Ce qu'il ne cloue pas, il le brûle. Ce qu'il ne brûle pas, il le cloue deux fois.",
        description: "Dans les loges du nord, on a appris des Marchois que le feu ne se trompe jamais. Les brûleurs sentent le goudron à trois rues, portent des gants de cuir roussi et se font maudire par les curés du Val. Ils s'en moquent : un tas de cendres ne se relève pas à la troisième nuit.",
        powers: [
          P(3, "Torche de loge", "action bonus", "à volonté", "Ton arme s'enflamme pendant 1 minute : +1d4 feu à chaque coup (1d6 au niveau 11). Un mort-vivant touché ne régénère pas jusqu'à ton prochain tour."),
          P(7, "Goudron épais", "passif", "passif", "Ton Pot de goudron gagne une utilisation et un rayon de 4,5 m. Résistance aux dégâts de feu."),
          P(11, "Bûcher", "passif", "à volonté", "Un mort-vivant que tu réduis à 0 PV éclate en flammes : 2d6 feu aux créatures à 1,5 m de lui, moitié si sauvegarde de Dextérité réussie."),
          P(15, "Cendres", "action", "repos long", "Cône de feu de 9 m : 8d6 feu, moitié si sauvegarde de Dextérité réussie. Les morts-vivants ont le désavantage à cette sauvegarde, et ceux qu'elle tue ne se relèvent jamais.", { uses: 1 }),
        ],
      },
      {
        id: "chasseur-fossoyeur-de-loge",
        name: "Fossoyeur de loge",
        pitch: "Il creusait les fosses d'Aube-Close avant la Confrérie. Il les creuse toujours, en plus profond.",
        description: "La Confrérie du Dernier Clou est née chez les fossoyeurs, la deuxième année du Glas. Les vieux du métier gardent leur pelle plutôt qu'un marteau. Ils connaissent les morts mieux que personne, savent les remettre en terre en une minute, et ouvrent le sol sous ceux qui refusent d'y rester.",
        powers: [
          P(3, "Pelle de fossoyeur", "passif", "à volonté", "Ta pelle est une arme de guerre en fer froid (1d8 tranchant, 1d10 à deux mains). Tu creuses une fosse d'1,5 m en une minute. Une fois par tour, quand tu touches au contact : sauvegarde de Force ou la cible tombe à terre."),
          P(7, "Six pieds", "action", "repos court", "Tu ouvres le sol sous une créature à 1,5 m : sauvegarde de Dextérité ou elle tombe dans une fosse de 3 m, subit 1d6 contondant et reste entravée jusqu'à ce qu'elle en sorte (Athlétisme contre le DD de tes pouvoirs, une action).", { uses: 1 }),
          P(11, "Connaître les morts", "passif", "passif", "Au toucher d'un cadavre, tu sais comment il est mort et tu vois ses six dernières secondes. Avantage aux sauvegardes contre les pouvoirs des morts-vivants."),
          P(15, "La fosse commune", "action", "repos long", "Carré de 6 m : le sol s'effondre. Chaque créature : sauvegarde de Dextérité ou 6d10 contondant, enterrée et entravée, moitié et rien d'autre si elle réussit. Un mort-vivant enterré ainsi ne remonte pas avant 24 heures.", { uses: 1, range: "18 m" }),
        ],
      },
    ],
  },
  "fantasy-veilleur": {
    title: "Veille",
    list: [
      {
        id: "veilleur-lanterne-bleue",
        name: "Lanterne bleue",
        pitch: "La lanterne ne s'éteint jamais, ni en plein jour, ni sous la pluie, ni quand il a peur.",
        description: "Les Veilleuses vivent chez l'habitant, lavent les corps, accouchent les femmes et soignent sans demander à qui elles parlent. Leurs veilleurs du sceau portent la même lanterne au verre bleu. Dans sa lumière, les blessés tiennent et les morts restent couchés.",
        powers: [
          P(2, "Veiller", "action bonus", "repos long", "Ta lanterne éclaire en bleu à 9 m. Un allié dans cette lumière récupère 1d6 + ta Sagesse PV.", { uses: 3, range: "9 m" }),
          P(6, "Trois nuits en une", "passif", "passif", "Dans la lumière de ta lanterne, les créatures à 0 PV se stabilisent seules et les morts ne se relèvent pas."),
          P(10, "Lumière qui brûle", "passif", "passif", "Un mort-vivant qui commence son tour dans la lumière de ta lanterne subit 1d8 radiant (2d8 au niveau 14)."),
          P(14, "La Plus Ancienne", "action", "repos long", "Chaque allié à 9 m récupère 4d8 + ta Sagesse PV et se débarrasse d'un état : aveuglé, charmé, effrayé ou empoisonné.", { uses: 1, range: "9 m" }),
        ],
      },
      {
        id: "veilleur-oreille-du-dessous",
        name: "Oreille du Dessous",
        pitch: "Il colle l'oreille contre les dalles, et il entend quelque chose respirer en bas.",
        description: "Certains veilleurs n'écoutent pas les morts : ils écoutent ce qui les fait lever. Ils dorment par terre, la joue sur la pierre, et savent quand une fissure s'ouvre à trois rues. Les Rendus les trouvent rassurants. Les prêtres les trouvent bizarres. Eux ne dorment plus beaucoup.",
        powers: [
          P(2, "Écouter les dalles", "passif", "passif", "Tu entends à travers 3 m de pierre ou de terre. Avantage en Perception. On ne te surprend pas tant que tu es conscient."),
          P(6, "Répondre au murmure", "réaction", "repos long", "Une créature à 18 m lance un pouvoir qui charme, effraie ou force à obéir : les cibles ont l'avantage à leur sauvegarde. Dans Aubreterre, tu peux aussi annuler un Murmure que le MJ dépense à 9 m de toi : il est perdu, et tu subis 1d10 psychique.", { uses: 2, range: "18 m" }),
          P(10, "Ce qui marche dessus", "action", "repos court", "La main à plat sur le sol : pendant 10 minutes, tu sens à 36 m toute créature qui touche le sol, même invisible ou derrière un mur.", { uses: 1 }),
          P(14, "Retourner la voix", "réaction", "repos long", "Une créature à 18 m vise toi ou un allié avec un pouvoir qui charme, effraie ou force à obéir : le pouvoir échoue et frappe son lanceur à la place, qui fait la sauvegarde.", { uses: 1, range: "18 m" }),
        ],
      },
    ],
  },
};

export const CLASSES: CharacterClass[] = [
  ...BASE_CLASSES.map((c) => ({
    ...c,
    subclassTitle: SUBCLASSES[c.id]?.title ?? "Sous-classe",
    subclasses: SUBCLASSES[c.id]?.list ?? [],
  })),
  ...CLASSES_ARCHIPEL,
];

/** La sous-classe d'un personnage, s'il en a choisi une. */
export function subclassOf(classId: string | undefined, subclassId: string | undefined): Subclass | undefined {
  if (!classId || !subclassId) return undefined;
  return CLASSES.find((c) => c.id === classId)?.subclasses.find((s) => s.id === subclassId);
}

/** Noms provisoires des classes pour les autres genres, à remplir après validation des classes fantasy. */
export const CLASS_NAMES_BY_GENRE: Partial<Record<GenreId, string[]>> = {
  "dark-fantasy": ["Mercenaire", "Sorcière des ronces", "Coupe-jarret", "Inquisiteur", "Chasseur de sorcières", "Pèlerin maudit"],
  cyberpunk: ["Solo", "Netrunner", "Fixer", "Médecin des rues", "Techie", "Nomade"],
  horreur: ["Ancien soldat", "Occultiste", "Détective", "Médecin", "Journaliste", "Prêtre"],
  "post-apo": ["Pillard", "Mutant", "Éclaireuse", "Docteur des ruines", "Mécano", "Chef de convoi"],
  western: ["Pistolero", "Prédicateur", "Joueur de poker", "Médecin itinérant", "Éclaireur", "Shérif"],
  pirates: ["Maître d'armes", "Sorcier vaudou", "Corsaire", "Chirurgien de bord", "Canonnier", "Capitaine"],
  steampunk: ["Duelliste", "Inventeuse", "Espionne", "Automate", "Aéronaute", "Aristocrate"],
  contemporain: ["Ancien militaire", "Hackeuse", "Voleur de luxe", "Médecin urgentiste", "Agent secret", "Avocate"],
};

export function classesFor(genre: GenreId): CharacterClass[] {
  return CLASSES.filter((c) => c.genre === genre);
}
