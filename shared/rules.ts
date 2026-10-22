// Livre des règles de Forge JdR : règles de base inspirées de D&D 5e, classes et pouvoirs.
// Brouillon v0.2 : les 14 classes fantasy sont complètes, les autres genres viendront après validation de Mickael.
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
      P(1, "Lignée", "passif", "passif", "D'où vient ton pouvoir : Draconique (CA 13 + Dextérité sans armure, +1 PV par niveau, ton élément est feu, froid ou foudre), Sauvage (sur un 1 au d20 d'un pouvoir, le MJ choisit un effet imprévu ; une fois par repos long, avantage à un jet) ou Sang gris (résistance nécrotique, ton élément est nécrotique, et tu entends parfois une voix aimable)."),
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
      P(1, "Patron", "passif", "passif", "Qui t'a parlé en premier : la Dame des Carrefours (une fois par repos court, quand on te touche, tu deviens invisible jusqu'à ton prochain tour), un saint que l'Église a oublié (une fois par repos long, réserve de 1d6 × niveau PV à rendre d'une action bonus) ou une voix qui a celle d'un proche mort (télépathie à 9 m ; seul le MJ sait qui parle vraiment)."),
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
