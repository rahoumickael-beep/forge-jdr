// Livre des règles de Forge JdR : règles de base inspirées de D&D 5e, classes et pouvoirs.
// Brouillon v0.1 : les classes fantasy sont complètes, les autres genres viendront après validation de Mickael.
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

export const CLASSES: CharacterClass[] = [
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
];

/** Noms provisoires des classes pour les autres genres, à remplir après validation des classes fantasy. */
export const CLASS_NAMES_BY_GENRE: Partial<Record<GenreId, string[]>> = {
  "dark-fantasy": ["Mercenaire", "Sorcière des ronces", "Coupe-jarret", "Inquisiteur", "Chasseur de sorcières", "Pèlerin maudit"],
  "science-fiction": ["Soldat d'élite", "Psionique", "Contrebandière", "Médecin de bord", "Éclaireur", "Diplomate"],
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
