// Bestiaire d'Aubreterre (campagne « Le Trône du Dieu Mort »), et BESTIARY qui réunit tous les mondes
// (celui de l'Archipel est dans archipel-bestiaire.ts, les outils de fiche dans fiches.ts).
// Fiches façon D&D 5e : FP 0 à 20, distances en mètres (1 case = 1,5 m).
// Tout est original ou tiré du folklore : aucune créature protégée hors SRD 5.1.
import { BESTIAIRE_ARCHIPEL } from "./archipel-bestiaire";
import { stylePeinture } from "./charte";
import { cost, fabriquerCreature, hit, modOf, multi, recharge, save, special, type CreatureInput } from "./fiches";
import type { Encounter, GenreId } from "./types";

export { illustrationStyle, LUMIERE_FAMILLE, modOf, xpForCr } from "./fiches";

export type Stat = "For" | "Dex" | "Con" | "Int" | "Sag" | "Cha";
export const STAT_ORDER: Stat[] = ["For", "Dex", "Con", "Int", "Sag", "Cha"];

export type Size = "Très petite" | "Petite" | "Moyenne" | "Grande" | "Très grande" | "Gigantesque";

/** Familles d'Aubreterre */
export type FamilleAubreterre = "Morts" | "Bêtes" | "Humanoïdes" | "Monstruosités" | "Créatures du Dessous";
/** Familles de l'Archipel */
export type FamilleArchipel = "Faune des mondes" | "Équipages" | "Machines" | "Choses des Routes";
export type Family = FamilleAubreterre | FamilleArchipel;

export type Region =
  // Aubreterre
  | "Le Couronnement"
  | "Les Marches de Fer"
  | "Le Val Cierge"
  | "Les Noyes"
  | "La Côte des Sels"
  | "Les Monts Ossiers"
  | "La Brune"
  | "Le Verre-Rouge"
  | "Le Dessous"
  // L'Archipel
  | "Solenne"
  | "Valcourt"
  | "Ancre"
  | "Ilvaë"
  | "Karrag"
  | "La Frange"
  | "Les Brisants"
  | "Les Mondes Éteints"
  | "le Grand Large"
  | "Partout";

export interface Speed {
  marche: number; // en mètres
  vol?: number;
  nage?: number;
  escalade?: number;
  fouissement?: number;
  stationnaire?: boolean; // vol sur place
}

/** Une attaque chiffrée : jet d'attaque contre la CA. */
export interface Attack {
  kind: "contact" | "distance";
  toHit: number;
  reach: string; // « 1,5 m » au contact, « 9/36 m » à distance
  damage: string; // « 2d6+3 »
  damageType: string;
  extra?: { damage: string; damageType: string }; // dégâts supplémentaires d'un autre type
}

/** Un effet à jet de sauvegarde (souffle, cri, sort…). */
export interface SaveEffect {
  stat: Stat;
  dc: number;
  damage?: string;
  damageType?: string;
  /** Nombre de cibles qu'on compte pour l'équilibre (2 pour une zone, façon Guide du maître). */
  targets?: number;
}

export interface CreatureAction {
  name: string;
  /** Effets en plus des dégâts (état, poussée, empoignade…). */
  text: string;
  attack?: Attack;
  save?: SaveEffect;
  /** Attaques multiples : nom de l'action → nombre de fois par tour. */
  multiattack?: Record<string, number>;
  recharge?: string; // « 5-6 », « 2/jour »…
  cost?: number; // actions légendaires : coût en actions
}

export interface Trait {
  name: string;
  text: string;
  /** Dégâts moyens par round ajoutés par ce trait (pour l'équilibre). */
  dpr?: number;
}

export interface Creature {
  id: string;
  name: string;
  /** Nom affiché aux joueurs quand le vrai nom trahit un secret du canon. */
  publicName?: string;
  genre: GenreId;
  family: Family;
  size: Size;
  type: string; // « mort-vivant », « bête », « humanoïde (humain) »…
  region: Region;
  // Combat
  cr: number; // facteur de puissance : 0, 0.125, 0.25, 0.5, 1…20
  xp: number;
  ac: number;
  acNote: string;
  hp: number;
  hpDice: string;
  speed: Speed;
  // Caractéristiques, dans l'ordre For Dex Con Int Sag Cha
  stats: [number, number, number, number, number, number];
  saves?: Partial<Record<Stat, number>>;
  skills?: Record<string, number>;
  vulnerabilities?: string[];
  resistances?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses: string;
  languages: string;
  // Capacités
  traits: Trait[];
  actions: CreatureAction[];
  bonusActions?: CreatureAction[];
  reactions?: CreatureAction[];
  legendary?: { perRound: number; text: string; actions: CreatureAction[] };
  // Texte
  lore: string; // lisible par les joueurs
  gmNotes: string; // pour le MJ seulement
  illustration: string; // prompt Flux Schnell, commence par ILLUSTRATION_STYLE
}

/** Style commun à toutes les planches d'Aubreterre, sans la lumière (qui ouvre le prompt). */
export const ILLUSTRATION_STYLE = stylePeinture("fantasy", "creature", "");

// --- Repères de la 5e (Guide du maître, création de monstres) ---

export const CR_STEPS = [0, 0.125, 0.25, 0.5, ...Array.from({ length: 30 }, (_, i) => i + 1)];

export function crLabel(cr: number): string {
  return cr === 0.125 ? "1/8" : cr === 0.25 ? "1/4" : cr === 0.5 ? "1/2" : String(cr);
}

export function proficiencyForCr(cr: number): number {
  return cr < 5 ? 2 : Math.min(9, Math.floor((cr - 1) / 4) + 2);
}


/** PV maximum attendus pour chaque FP (index de CR_STEPS). */
function hpCeiling(i: number): number {
  const low = [6, 35, 49, 70, 85];
  if (i < low.length) return low[i];
  const cr = CR_STEPS[i];
  if (cr <= 19) return 85 + (cr - 1) * 15;
  return 400 + (cr - 20) * 45;
}

/** Dégâts par round maximum attendus pour chaque FP. */
function dprCeiling(i: number): number {
  const low = [1, 3, 5, 8, 14];
  if (i < low.length) return low[i];
  const cr = CR_STEPS[i];
  if (cr <= 19) return 14 + (cr - 1) * 6;
  return 140 + (cr - 20) * 18;
}

function expectedAc(cr: number): number {
  return cr <= 3 ? 13 : cr <= 4 ? 14 : cr <= 7 ? 15 : cr <= 9 ? 16 : cr <= 12 ? 17 : cr <= 16 ? 18 : 19;
}

function expectedAttack(cr: number): number {
  return cr <= 2 ? 3 : cr <= 3 ? 4 : cr <= 4 ? 5 : cr <= 7 ? 6 : cr <= 10 ? 7 : cr <= 15 ? 8 : cr <= 16 ? 9 : 10;
}

function expectedDc(cr: number): number {
  return cr <= 3 ? 13 : cr <= 4 ? 14 : cr <= 7 ? 15 : cr <= 10 ? 16 : cr <= 12 ? 17 : cr <= 16 ? 18 : 19;
}

/** Moyenne d'une formule « 2d6+3 », « 1d4-1 » ou « 5 ». */
export function averageDice(formula: string): number {
  const f = formula.replace(/\s/g, "");
  if (/^\d+$/.test(f)) return Number(f);
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(f);
  if (!m) throw new Error(`Formule de dés illisible : ${formula}`);
  return (Number(m[1]) * (Number(m[2]) + 1)) / 2 + Number(m[3] ?? 0);
}

function actionDamage(a: CreatureAction): number {
  if (a.attack) return averageDice(a.attack.damage) + (a.attack.extra ? averageDice(a.attack.extra.damage) : 0);
  if (a.save?.damage) return averageDice(a.save.damage) * (a.save.targets ?? 1);
  return 0;
}

/** Dégâts moyens par round, calculés sur trois rounds comme le conseille le Guide du maître. */
export function damagePerRound(c: Creature): number {
  const byName = new Map(c.actions.map((a) => [a.name, a]));
  const multi = c.actions
    .filter((a) => a.multiattack)
    .map((a) => Object.entries(a.multiattack!).reduce((s, [n, k]) => s + k * actionDamage(byName.get(n) ?? a), 0));
  const plain = c.actions.filter((a) => !a.recharge && !a.multiattack).map(actionDamage);
  const base = Math.max(0, ...multi, ...plain);
  const burst = Math.max(0, ...c.actions.filter((a) => a.recharge).map(actionDamage));
  let dpr = burst > base ? (burst + 2 * base) / 3 : base;
  dpr += Math.max(0, ...(c.bonusActions ?? []).map(actionDamage));
  dpr += c.traits.reduce((s, t) => s + (t.dpr ?? 0), 0);
  if (c.legendary) {
    const best = Math.max(0, ...c.legendary.actions.map((a) => actionDamage(a) / (a.cost ?? 1)));
    dpr += best * c.legendary.perRound;
  }
  return Math.round(dpr * 10) / 10;
}

function bestAttackBonus(c: Creature): { bonus: number; isDc: boolean } {
  const all = [...c.actions, ...(c.bonusActions ?? [])];
  const hits = all.filter((a) => a.attack).map((a) => a.attack!.toHit);
  if (hits.length) return { bonus: Math.max(...hits), isDc: false };
  const dcs = all.filter((a) => a.save).map((a) => a.save!.dc);
  return { bonus: dcs.length ? Math.max(...dcs) : 10, isDc: true };
}

const PHYSICAL = /contondant|perforant|tranchant/;

function stepIndex(value: number, ceiling: (i: number) => number): number {
  for (let i = 0; i < CR_STEPS.length; i++) if (value <= ceiling(i)) return i;
  return CR_STEPS.length - 1;
}

const clampIndex = (i: number) => Math.max(0, Math.min(CR_STEPS.length - 1, i));

/**
 * FP estimé à partir des PV, de la CA, des dégâts et du bonus d'attaque (méthode du Guide du maître).
 * Sert au test d'équilibre et au MJ qui veut retoucher une fiche.
 */
export function estimateCr(c: Creature): { defensive: number; offensive: number; estimate: number; dpr: number } {
  const cr = c.cr;
  // Résistances et immunités aux armes ordinaires : PV effectifs multipliés.
  let mult = 1;
  if ((c.immunities ?? []).some((d) => PHYSICAL.test(d))) mult = cr <= 10 ? 2 : cr <= 16 ? 1.5 : 1.25;
  else if ((c.resistances ?? []).some((d) => PHYSICAL.test(d))) mult = cr <= 4 ? 2 : cr <= 10 ? 1.5 : cr <= 16 ? 1.25 : 1;
  let def = stepIndex(c.hp * mult, hpCeiling);
  def = clampIndex(def + Math.trunc((c.ac - expectedAc(CR_STEPS[def])) / 2));
  // Résistance légendaire (3/jour) : comptée comme deux crans de défense à partir du FP 10.
  if (c.legendary && cr >= 10) def = clampIndex(def + 2);

  const dpr = damagePerRound(c);
  let off = stepIndex(dpr, dprCeiling);
  const atk = bestAttackBonus(c);
  const expected = atk.isDc ? expectedDc(CR_STEPS[off]) : expectedAttack(CR_STEPS[off]);
  off = clampIndex(off + Math.trunc((atk.bonus - expected) / 2));

  const mean = (CR_STEPS[def] + CR_STEPS[off]) / 2;
  const estimate = CR_STEPS.reduce((best, s) => (Math.abs(s - mean) < Math.abs(best - mean) ? s : best), 0);
  return { defensive: CR_STEPS[def], offensive: CR_STEPS[off], estimate, dpr };
}

// --- Fabrication des fiches (outils communs dans fiches.ts) ---

const creature = (input: CreatureInput): Creature => fabriquerCreature("fantasy", input);

// Immunités récurrentes des morts
const MORT_IMMUN = ["poison"];
const MORT_ETATS = ["empoisonné", "épuisement"];
const TENACE: Trait = {
  name: "Ne tombe pas",
  text: "Quand des dégâts le font tomber à 0 PV, il fait un jet de sauvegarde de Constitution (DD 5 + dégâts subis), sauf contre des dégâts radiants ou un coup critique. En cas de réussite, il reste à 1 PV.",
};
const MARCHE: Trait = {
  name: "La Marche",
  text: "Sans maître, il marche vers Aube-Close en ligne droite, à travers champs, rivières et clôtures. Il n'attaque que les vivants qui se trouvent sur son chemin.",
};
const CLOUER: Trait = {
  name: "Clouer",
  text: "S'il tombe à 0 PV, il se relève la nuit suivante avec tous ses PV, sauf si on le brûle ou si on le cloue : un clou dans chaque talon, un dans chaque paume, du sel dans la bouche (une action, marteau et quatre clous).",
};

// --- Les fiches, par FP croissant ---

const CREATURES_AUBRETERRE: Creature[] = [
  // ===== FP 0 à 1/2 =====
  creature({
    id: "corneille-des-pieux",
    name: "Corneille des pieux",
    family: "Bêtes", size: "Très petite", type: "bête", region: "Le Couronnement",
    cr: 0, ac: 12, acNote: "", hd: 1, speed: { marche: 3, vol: 15 },
    stats: [2, 14, 10, 4, 12, 6],
    skills: { Perception: 3 },
    languages: "—",
    traits: [
      { name: "Bavarde", text: "Elle répète les derniers mots qu'elle a entendus près d'un mort, avec la voix exacte de celui qui les a dits. Un test de Perspicacité DD 10 révèle que c'est un oiseau." },
    ],
    actions: [hit("Bec", "contact", 4, "1,5 m", "1", "perforants")],
    lore: "Elles suivent les lignes de pieux le long des routes impériales depuis six siècles et savent à quelle heure on pend. Les rouliers leur jettent du pain pour qu'elles se taisent.",
    gmNotes: "Une corneille qui a picoré l'œil d'un Porte-Voix répète des phrases de Gorvan pendant des jours : « Il suffit de la retirer. » C'est un indice que les joueurs peuvent trouver dès le niveau 1, sans le comprendre.",
    scene: "a ragged black crow perched on the crooked dead branch of a lone gibbet oak, open wheat plain and thatched hamlet behind, beak half open as if speaking, late afternoon light raking from the side, a rope still knotted below it",
  }),
  creature({
    id: "matin-leve",
    name: "Mâtin levé",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Partout",
    cr: 0.125, ac: 11, acNote: "", hd: 2, speed: { marche: 12 },
    stats: [13, 12, 14, 2, 8, 3],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      { name: "Flair des vivants", text: "Avantage aux tests de Sagesse (Perception) fondés sur l'odorat pour trouver une créature vivante." },
      { name: "Encore dressé", text: "Si quelqu'un l'appelle par le nom qu'il portait vivant, il s'arrête un round et gémit. Une fois par combat." },
    ],
    actions: [hit("Morsure", "contact", 3, "1,5 m", "1d6+1", "perforants")],
    lore: "Le chien de la ferme revient la troisième nuit et gratte à la porte comme avant. Il ne remue plus la queue. Il ne mord que ce qui se trouve entre lui et Aube-Close.",
    gmNotes: "Les bêtes mortes ne se relèvent qu'une fois la jauge du Sceau sous 75. Le premier mâtin levé que croisent les joueurs est donc un signal : le sceau vient de céder un cran. Les fermiers le prennent d'abord pour un chien enragé.",
    scene: "a zombie farm mastiff, the starved undead carcass of a broad-headed guard dog with heavy sagging jowls, seen in three-quarter view, sitting stiff and upright in dark trampled mud, gaunt skeletal body, grey decaying hide hanging in torn flaps from its side so the bare curved ribs show, dead blind eyes covered by a thick pale white film like cataracts, white pupilless eyes, slack grey lips, rusted iron collar around its neck, a short length of chain ending in a broken split link resting on the mud, tail lying flat and still on the ground, directly behind it a weathered oak plank door of a thatched cottage, the lower half of the door shredded with long deep pale gouges from scratching paws, an iron lantern with a candle flame on a hook beside the door frame, cold bluish-grey shadows over the yard",
  }),
  creature({
    id: "bleu-des-marches",
    name: "Bleu des Marches",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Les Marches de Fer",
    cr: 0.125, ac: 13, acNote: "armure matelassée, bouclier", hd: 2, speed: { marche: 9 },
    stats: [11, 10, 11, 9, 10, 9],
    languages: "pallénien",
    traits: [
      { name: "Serrer les rangs", text: "+1 à la CA tant qu'un autre légionnaire allié se tient à 1,5 m de lui." },
      { name: "Quinze ans", text: "Quand il tombe sous la moitié de ses PV, il fait un jet de sauvegarde de Sagesse DD 10. En cas d'échec, il lâche sa lance et s'enfuit." },
    ],
    actions: [hit("Lance", "contact", 2, "1,5 m ou 6/18 m", "1d6", "perforants")],
    lore: "Une recrue de quinze ans dans un manteau rouge taillé pour un homme. Il chante faux en marchant pour ne pas penser à ce qui suit la colonne.",
    gmNotes: "La moitié des légions de Hersende ressemble à ça. Un bleu capturé parle volontiers : il sait quel fort manque de vivres et que la Générale « parle toute seule la nuit ». Il demande qu'on prévienne sa mère, à Fort-Brac.",
    scene: "a frightened fifteen-year-old soldier in an oversized red wool cloak and quilted gambeson, round wooden shield and spear, standing in heather on a windswept grey hill, rain, a stone fort and a black pyre smoke plume in the distance, overcast diffuse light",
  }),
  creature({
    id: "crabe-des-salines",
    name: "Crabe des salines",
    family: "Bêtes", size: "Petite", type: "bête", region: "La Côte des Sels",
    cr: 0.125, ac: 15, acNote: "carapace", hd: 3, speed: { marche: 9, nage: 9 },
    stats: [12, 11, 11, 1, 9, 3],
    senses: "vision aveugle 9 m",
    languages: "—",
    traits: [
      { name: "Amphibie", text: "Respire à l'air libre et sous l'eau." },
      { name: "Mangeur de saumure", text: "Il sent un cadavre salé à 30 m et creuse les cercueils pleins de sel pour atteindre le corps." },
    ],
    actions: [hit("Pince", "contact", 3, "1,5 m", "1d6+1", "contondants", "La cible est empoignée (évasion DD 11). Le crabe a deux pinces et peut empoigner deux cibles.")],
    lore: "Des crabes rose pâle, larges comme un bouclier, qui grouillent sous les pilotis de Port-Lagune. Depuis que le sel va dans les cercueils, ils ont appris à les ouvrir.",
    gmNotes: "Une nuée de crabes autour d'un cimetière de la Côte veut dire qu'on y a enterré des corps salés. Les sauniers les chassent la nuit, à la lanterne, et vendent la carapace aux ciriers du Val.",
    scene: "side profile of one shield-sized pale crab, its broad flat shell the whitish pastel pink of raw shrimp flesh and rose quartz, frosted all over with a thick crust of white salt crystals like rime, two heavy pale pink claws forcing apart the splintered boards of a wooden coffin, the coffin lying flat on a wet plank jetty, a classic six-sided coffin shape, wide at the shoulders and narrow at the feet, its lid smashed in and its planks burst open, the inside packed full with coarse white salt spilling out through the cracks, the crab dragging its pink body up over the broken edge, a row of thick dark oak piles standing in black still lagoon water behind the jetty, a bleached white noon sky with a small fierce white sun straight overhead, short black shadows under the crab, far off a flat chequer of white salt pans glittering on the shore",
  }),
  creature({
    id: "leve",
    name: "Levé",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Partout",
    cr: 0.25, ac: 8, acNote: "", hd: 3, speed: { marche: 6 },
    stats: [13, 6, 16, 3, 6, 5],
    saves: { Sag: 0 },
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "comprend les langues qu'il parlait de son vivant mais ne parle pas",
    traits: [TENACE, MARCHE, CLOUER],
    actions: [hit("Coup", "contact", 3, "1,5 m", "1d6+1", "contondants")],
    lore: "Un mort qui se lève à la troisième nuit et part vers la capitale en ligne droite. Il garde les habits de son enterrement. Dans chaque village, quelqu'un a le marteau et les clous.",
    gmNotes: "La Marche, ce sont des milliers de Levés. Ils suivent des lignes droites qui convergent sous la Rotonde : un joueur qui note leur cap sur une carte trouve le point de chute. Par groupes de dix, ils sont une vraie menace pour un village.",
    scene: "a heavy-set middle-aged peasant man with a full fleshy face, thick nose, stubbled jaw and plain human ears, sleepwalking in strict side profile from left to right through waist-high ripe wheat, his whole skin ashen grey-white like old candle wax, purple-blue blotches on the throat and hands, grey-blue lips pressed shut, glassy half-closed eyes staring ahead, a strip of white linen bound under his chin and knotted on top of his head as on a laid-out body, short hair clotted with brown soil, wearing a long shapeless undyed linen shroud to the shins smeared with brown earth, both arms hanging straight down, swollen grey fingers, bare grey feet black with mud, clumps of soil dropping from the hem, body stiff and upright like a carved wooden saint carried in procession, ahead of him on the far right horizon a distant walled town under one broad low dome of green verdigris copper, the dome level with his gaze, red-gold sunrise sky low behind the dome, the man edged in a thin golden rim, his long shadow falling back across the wheat toward the viewer, heavy brown-umber sky above",
  }),
  creature({
    id: "loup-de-bruyere",
    name: "Loup de bruyère",
    family: "Bêtes", size: "Moyenne", type: "bête", region: "Les Marches de Fer",
    cr: 0.25, ac: 13, acNote: "armure naturelle", hd: 2, speed: { marche: 12 },
    stats: [12, 15, 12, 3, 12, 6],
    skills: { Perception: 3, Discrétion: 4 },
    languages: "—",
    traits: [
      { name: "Odorat aiguisé", text: "Avantage aux tests de Sagesse (Perception) fondés sur l'odorat." },
      { name: "Tactique de meute", text: "Avantage à l'attaque si un allié non neutralisé se tient à 1,5 m de la cible." },
      { name: "Suiveur de fumée", text: "La meute suit la fumée des bûchers. Elle n'attaque jamais un Levé." },
    ],
    actions: [hit("Morsure", "contact", 4, "1,5 m", "2d4+2", "perforants", "Si la cible est une créature, jet de sauvegarde de Force DD 11 ou elle tombe à terre.")],
    lore: "Des loups gris aux pattes noires de suie, qui rôdent autour des forts à l'heure des bûchers. Les Marchois disent qu'ils mangent les os que le feu n'a pas pris.",
    gmNotes: "Les loups ont compris que les Levés n'ont rien à manger et que les vivants qui les combattent sont fatigués. Une meute attaque toujours juste après un assaut de morts, quand les blessés traînent derrière.",
    scene: "a lean grey wolf with soot-blackened paws standing on a heather ridge, fur blown by a strong wind, behind it a burning pyre outside a grey stone fort sending up thick greasy smoke, cold dusk light, low clouds",
  }),
  creature({
    id: "nuee-de-rats-des-fosses",
    name: "Nuée de rats des fossés",
    family: "Bêtes", size: "Moyenne", type: "nuée de bêtes Très petites", region: "Le Couronnement",
    cr: 0.25, ac: 10, acNote: "", hd: 7, speed: { marche: 9, escalade: 9 },
    stats: [9, 11, 9, 2, 10, 3],
    resistances: ["contondants", "perforants", "tranchants"],
    conditionImmunities: ["charmé", "effrayé", "empoigné", "entravé", "étourdi", "à terre", "paralysé", "pétrifié"],
    senses: "vision dans le noir 9 m",
    languages: "—",
    traits: [
      { name: "Nuée", text: "Elle occupe l'espace d'une autre créature et passe par un trou de rat. Elle ne récupère pas de PV et ne gagne pas de PV temporaires." },
      { name: "Pattes de chaux", text: "Les rats sortent des fossés de chaux vive. Une créature mordue a la peau qui brûle : elle ne peut pas récupérer de PV par les dés de vie avant d'avoir lavé la plaie à l'eau." },
    ],
    actions: [hit("Morsures", "contact", 2, "0 m", "2d6", "perforants", "Une créature dans l'espace de la nuée. 1d6 seulement si la nuée a la moitié de ses PV ou moins.")],
    lore: "Des rats blancs comme du plâtre, la queue rongée par la chaux, qui vivent dans les fossés autour des faubourgs. Ils ont faim en permanence, parce que les Levés jetés dans la chaux ne pourrissent pas.",
    gmNotes: "On les rencontre dans les égouts d'Aube-Close et dans les fosses où la Garde du Seuil brûle les morts en secret. Suivre les rats, c'est trouver les fosses.",
    scene: "a seething mass of chalk-white rats with red eyes pouring out of a ditch filled with lime powder at the edge of a medieval city, slate roofs and city walls behind, torchlight from above, white dust in the air",
  }),
  creature({
    id: "bouc-des-vertebres",
    name: "Bouc des vertèbres",
    family: "Bêtes", size: "Moyenne", type: "bête", region: "Les Monts Ossiers",
    cr: 0.25, ac: 11, acNote: "", hd: 3, speed: { marche: 12, escalade: 9 },
    stats: [14, 13, 12, 3, 12, 5],
    languages: "—",
    traits: [
      { name: "Charge", text: "S'il parcourt au moins 6 m en ligne droite avant de toucher, +2d6 dégâts contondants et la cible fait un jet de sauvegarde de Force DD 12 ou tombe à terre.", dpr: 2 },
      { name: "Pied sûr", text: "Avantage aux jets de sauvegarde de Force et de Dextérité contre ce qui le ferait tomber." },
      { name: "Fou de plomb", text: "Il lèche les coulures de plomb des portes naines et en devient enragé : il charge tout ce qui bouge près d'une porte murée." },
    ],
    actions: [hit("Cornes", "contact", 4, "1,5 m", "1d6+2", "contondants")],
    lore: "Des boucs blancs aux cornes spiralées, qui vivent sur les arêtes calcaires. Les nains disent qu'ils ont léché le plomb des portes murées et qu'ils n'ont plus toute leur tête.",
    gmNotes: "Un troupeau de boucs agités près d'une paroi indique une porte d'ossuaire scellée au plomb. Un nain Ossuaire sait les calmer avec du sel.",
    scene: "a feral white mountain goat with a matted shaggy coat, bare neck, a short beard and two ringed horns coiling back in tight spirals, standing side-on with all four hooves gripping a narrow shelf of pale limestone on a sheer cliff, its neck craned up to the cliff wall, mouth open, long pink tongue lapping at a thick dribble of dull grey lead, mad bulging yellow eyes rimmed with white, foam on its lips, the cliff wall carved into a low squat arch of dark granite blocks, the arch filled solid with tightly fitted masonry, every joint of the masonry stuffed with grey lead that has melted and run down the rock in long hardened drips, angular dwarven knotwork chiselled around the arch, rime frost on the stone, crisp cold morning air, pale grey-blue sky, far below a wild larch forest in deep blue shadow",
  }),
  creature({
    id: "legionnaire-d-os",
    name: "Légionnaire d'os",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Les Marches de Fer",
    cr: 0.5, ac: 14, acNote: "restes d'armure, bouclier", hd: 2, speed: { marche: 9 },
    stats: [10, 14, 15, 6, 8, 5],
    vulnerabilities: ["contondants"],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "comprend l'ancien parler des légions mais ne parle pas",
    traits: [
      { name: "Pas cadencé", text: "Tant que trois légionnaires d'os ou plus avancent ensemble, chacun inflige 1d4 dégâts supplémentaires à son attaque.", dpr: 2.5 },
      { name: "Ordre de marche", text: "Ils obéissent encore aux sonneries de trompe des légions. Un personnage qui sait les jouer (Représentation DD 13) peut les faire reculer d'un round." },
    ],
    actions: [
      hit("Glaive", "contact", 4, "1,5 m", "1d6+2", "perforants"),
      hit("Javelot", "distance", 4, "9/36 m", "1d6+2", "perforants"),
    ],
    lore: "Quand la terre dégèle, des légions entières d'os remontent des vieux champs de bataille en ordre de marche. Ils portent encore les plaques de bronze de régiments disparus depuis trois siècles.",
    gmNotes: "Les Marches n'ont jamais brûlé leurs morts avant le Glas : six siècles de guerre contre la steppe dorment sous la bruyère. Chaque plaque de régiment vaut 1 pa auprès des archivistes de la Chancellerie, qui tiennent le compte des disparus.",
    scene: "a human-sized walking skeleton soldier filling the foreground from head to feet, bare weathered bones the dull brown-grey of old dug-up bone, empty eye sockets, visible ribcage, spine and pelvis between hanging scraps of corroded verdigris bronze scale armour, tattered strips of rotten dark red wool cloth on the shoulders, a small green bronze regiment plaque hanging from a cord at its ribs, a round battered wooden shield strapped to its left forearm, a short straight sword held low in its right hand, a javelin slung on its back, behind it a long column of identical skeleton soldiers marching in tight file up a heather hillside, their feet climbing out of muddy half-frozen earth with patches of melting snow, heavy slanting grey rain streaks across the whole scene, sky entirely filled with low dense rain clouds the colour of wet slate, cold steel-blue tint, a line of small square stone forts along the far ridge, the bottom edge of the canvas is dark wet heather and mud",
  }),
  creature({
    id: "mort-des-salines",
    name: "Mort des salines",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "La Côte des Sels",
    cr: 0.5, ac: 12, acNote: "croûte de sel", hd: 4, speed: { marche: 6 },
    stats: [14, 8, 15, 3, 6, 5],
    resistances: ["perforants", "tranchants"],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      { name: "Enchaîné", text: "Des chaînes aux chevilles : il ne peut pas Foncer et ne s'éloigne jamais à plus de 6 m de l'anneau où on l'a fixé, sauf si on le détache." },
      { name: "Larmes de sel", text: "Quand il tombe à 0 PV, il éclate en poussière de sel : chaque créature à 1,5 m fait un jet de sauvegarde de Constitution DD 12 ou elle est aveuglée jusqu'à la fin de son prochain tour." },
    ],
    actions: [hit("Râteau à sel", "contact", 4, "1,5 m", "1d8+2", "contondants")],
    lore: "La peau craquelée de cristaux, il râtelle le sel au bord d'un bassin rose sans jamais lever la tête. La Hanse jure qu'elle n'emploie que des vivants.",
    gmNotes: "Le secret de la Hanse : des Levés cloués aux chevilles, parce que les morts ne mangent pas. Chaque chaîne porte un numéro qui renvoie au registre d'un comptoir de Port-Lagune. Un seul registre suffit pour que l'Église excommunie la Hanse. Et ces morts ont été salés, ce qui prouve que le sel ne marche pas sur tous.",
    scene: "a dead human salt worker seen from the side, stooped forward, a dried corpse with a gaunt human face, sunken closed eyes and hollow cheeks, his whole body caked in a thick rough crust of white salt like hoarfrost, white salt crystals clustered on his shoulders, arms, ribs and shins, salt flaking from his cracked brown skin, a short ragged loincloth, head hanging down with his gaze on the ground, both arms reaching forward along one long wooden handle, pushing a flat wooden salt rake through a ridge of white salt, standing barefoot in the shallow rose-pink brine of a square evaporation pond edged by a low clay dyke, a heavy iron shackle on each ankle, a thick iron chain trailing from the shackles across the mud to a big iron ring set in a square grey stone block, tall cone-shaped mounds of white salt behind him, a bleached white noon sky with a tiny white-hot sun high overhead, harsh short shadows, far along the dyke a tiny standing overseer in a long brown medieval robe under a round cloth sunshade",
  }),
  creature({
    id: "attendant",
    name: "Attendant",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Le Couronnement",
    cr: 0.5, ac: 11, acNote: "robe de bure", hd: 4, speed: { marche: 9 },
    stats: [11, 12, 10, 10, 9, 14],
    skills: { Religion: 2, Persuasion: 4 },
    languages: "pallénien",
    traits: [
      { name: "Rejoindre la Marche", text: "Quand il tombe à 0 PV, il se relève au début de son prochain tour comme un Levé, avec 22 PV, et part vers Aube-Close." },
      { name: "Sans peur des morts", text: "Les Levés ne l'attaquent pas. Il ne peut pas être effrayé par un mort-vivant." },
    ],
    actions: [
      hit("Couteau de la Marche", "contact", 3, "1,5 m", "1d4+1", "perforants", "Le couteau a trempé dans la cire d'un cierge de la Rotonde.", { damage: "1d6", damageType: "nécrotiques" }),
      save("Étreinte", "Dex", 12, "La cible est empoignée (évasion DD 12) ; l'attendant a l'avantage pour la frapper au couteau tant qu'il la tient."),
    ],
    lore: "Il marche au bord de la route impériale avec des dizaines d'autres, en chantant, une corde autour du cou. Il croit que les morts vont à Aube-Close pour ressusciter le Dieu, et il veut en être.",
    gmNotes: "Les Attendants se tuent en groupe sur les routes pour rejoindre la Marche. Leur meneur, un ancien juge, cite le Code à l'envers. Ce sont des fous dangereux, mais ils ont vu juste sur un point : les morts vont bien vers le Trône.",
    scene: "a thin living medieval peasant man with sunburnt weathered skin, hollow cheeks, rosy lips and a short unkempt beard, mouth open singing a hymn, eyes rolled up toward the sky in rapture, hood of a coarse dark brown monk's habit pushed back, a frayed hemp rope noose hanging loosely around his neck, his right hand gripping a small iron knife with a wooden handle, his left hand raising a thick burning wax candle with a tiny flame, bare dirty feet on a rutted dirt cart track of packed earth, behind him a long dense crowd of dozens of hooded peasants in brown habits walking in file and carrying candles, golden wheat fields stretching flat to the horizon, a small copper dome far away, heavy grey clouds filling the sky at dusk",
  }),
  creature({
    id: "nuee-d-abeilles-cirieres",
    name: "Nuée d'abeilles cirières",
    family: "Bêtes", size: "Moyenne", type: "nuée de bêtes Très petites", region: "Le Val Cierge",
    cr: 0.5, ac: 12, acNote: "", hd: 5, speed: { marche: 1.5, vol: 9 },
    stats: [3, 14, 10, 1, 10, 2],
    resistances: ["contondants", "perforants", "tranchants"],
    conditionImmunities: ["charmé", "effrayé", "empoigné", "entravé", "étourdi", "à terre", "paralysé", "pétrifié"],
    senses: "vision aveugle 3 m",
    languages: "—",
    traits: [
      { name: "Nuée", text: "Elle occupe l'espace d'une autre créature et passe par un trou d'abeille. Elle ne récupère pas de PV." },
      { name: "Fumée", text: "Une créature qui tient une torche fumante ou un enfumoir a l'avantage aux jets de sauvegarde contre la nuée, et la nuée a le désavantage pour l'attaquer." },
    ],
    actions: [hit("Piqûres", "contact", 4, "0 m", "2d4", "perforants", "Une créature dans l'espace de la nuée. Moitié moins de dés si la nuée a la moitié de ses PV ou moins.", { damage: "1d4", damageType: "poison" })],
    lore: "Le Val produit la cire de tout le continent. Depuis le Glas, certaines ruches bâtissent leurs rayons ailleurs que dans les paniers : dans la bouche ouverte des morts, entre les côtes.",
    gmNotes: "Une nuée qui sort d'un Levé indique qu'il marche depuis des semaines. La cire de ces rayons est grise et ne prend pas la flamme : les ciriers la vendent quand même, mélangée à la bonne. Les cierges de la Rotonde en contiennent.",
    scene: "a vast airborne swarm of thousands of tiny honeybees, each bee a minute amber speck with translucent wings, rising in a tall twisting column that fills the upper half of the painting like drifting gold dust, the swarm streaming upward out of the chest of a dead man standing upright in the lower half, an emaciated human corpse with leathery grey-brown skin, a shaved bald head and a smooth hairless chin, the jaw hanging wide open with a slab of ash-grey wax honeycomb of hexagonal cells inside the mouth, two thin arms hanging at his sides ending in bony human hands, the chest cavity split open with the ribs spread apart, flat ash-grey honeycomb combs with hexagonal cells built vertically in the gaps between the ribs, a plain undyed linen loincloth, two thin legs and bare bony feet on dry earth, behind him a steep hillside of stepped dry-stone terrace walls with low grapevines on each step, white monastery walls and a romanesque bell tower at the top of the hill, warm golden late summer haze full of insects, a plain band of painted earth along the bottom edge",
  }),
  creature({
    id: "scarabee-de-verre",
    name: "Scarabée de verre",
    family: "Monstruosités", size: "Moyenne", type: "monstruosité", region: "Le Verre-Rouge",
    cr: 0.5, ac: 15, acNote: "carapace de verre", hd: 3, speed: { marche: 9, fouissement: 3 },
    stats: [12, 12, 13, 1, 8, 4],
    vulnerabilities: ["tonnerre"],
    senses: "perception des vibrations 9 m",
    languages: "—",
    traits: [
      { name: "Éclats", text: "Quand il subit des dégâts contondants, sa carapace se fêle : chaque créature à 1,5 m subit 1d4 dégâts tranchants.", dpr: 1 },
      { name: "Chant", text: "Quand le vent passe sur sa carapace, elle chante. On l'entend à 100 m." },
    ],
    actions: [
      hit("Mandibules", "contact", 3, "1,5 m", "1d8+1", "tranchants"),
      save("Reflet", "Con", 11, "Cône de 4,5 m, en plein soleil seulement. Échec : aveuglé jusqu'à la fin de son prochain tour.", undefined, undefined, 1, "5-6"),
    ],
    lore: "Un scarabée gros comme un chien, à la carapace de verre rouge sombre, qui creuse sous les plaques chantantes du désert. Les caravaniers font sonner une cloche pour couvrir son chant.",
    gmNotes: "Les scarabées mangent le verre et le recrachent en boulettes. Dans leurs galeries, on trouve des éclats d'un verre plus ancien, doré, qui reste tiède : des fragments de la bataille des deux dieux.",
    scene: "the storm clouds breaking open over the horizon onto a fat orange setting sun sitting just behind the creature, a glass sculpture come alive: a beetle as big as a hound cast entirely in one piece of dark garnet glass like a cathedral window, its whole body, head, six legs and two hooked mandibles made of the same clear wine-red glass, the sun shining straight through it so the body turns ruby and throws a red stain on the sand, fine white crack lines across the back, seen from the front three quarters close to the ground, three jointed glass legs splayed on each side like a crab, its rear half still buried in a spray of red sand, crawling out from under the tilted edge of a thin black glass sheet half sunk in the dune, a few small glass pellets and warm golden shards in the sand, long purple shadows on rippled dunes",
  }),

  // ===== FP 1 à 3 =====
  creature({
    id: "pleureur",
    name: "Pleureur",
    family: "Morts", size: "Moyenne", type: "mort-vivant (esprit)", region: "Partout",
    cr: 1, ac: 12, acNote: "", hd: 6, speed: { marche: 0, vol: 9, stationnaire: true },
    stats: [1, 14, 10, 10, 11, 12],
    resistances: ["acide", "feu", "foudre", "tonnerre", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["charmé", "empoigné", "empoisonné", "entravé", "épuisement", "à terre", "paralysé", "pétrifié"],
    senses: "vision dans le noir 18 m",
    languages: "les langues qu'il parlait de son vivant",
    traits: [
      { name: "Le dernier jour", text: "Il répète sans fin les gestes de son dernier jour, à l'endroit où il est mort : il pétrit le pain, il ferme les volets, il appelle son fils. Tant qu'on ne l'interrompt pas, il ne voit personne." },
      { name: "Interrompu", text: "Si une créature le touche, lui barre le passage ou lui parle de sa mort, il devient hostile jusqu'à l'aube." },
      { name: "Intangible", text: "Il traverse créatures et objets comme un terrain difficile. Il subit 1d10 dégâts de force s'il finit son tour dans un objet." },
    ],
    actions: [
      hit("Main froide", "contact", 4, "1,5 m", "2d6", "nécrotiques"),
      save("Cri du dernier jour", "Sag", 11, "Chaque créature à 9 m qui l'entend. Moitié des dégâts en cas de réussite ; en cas d'échec, effrayée 1 minute (nouveau jet à la fin de chacun de ses tours).", "3d6", "psychiques", 2, "5-6"),
    ],
    lore: "Une femme translucide pétrit une pâte qui n'existe pas dans une boulangerie vide. Elle refait les mêmes gestes depuis l'hiver du Glas. Les voisins ont appris à passer de l'autre côté de la rue.",
    gmNotes: "Un Pleureur sait toujours ce qui s'est passé le jour de sa mort, et rien d'autre. Si les joueurs rejouent la scène avec lui sans l'interrompre (Représentation ou Perspicacité DD 13), il finit son geste et disparaît en laissant un indice : un nom, une clé, un mot sur le coupable.",
    scene: "a semi-transparent see-through spectral woman baker in a linen apron and head veil, seen in three-quarter view, the edge of the wooden table and the cold dark brick oven clearly visible through her body and apron, her skin colourless grey-blue like thin smoke, the hem of her dress fading into floor mist, bent forward over a bare flour-dusted kneading table, both fists pressed down and folding into empty air just above the wood, the tabletop holding only scattered flour and faint handprints, her features smeared and blurred as if seen through tears, mouth open in a silent sob, alone in a long-abandoned medieval bakery with cobwebs, cracked plaster and drifting dust motes, a small grey window with wooden shutters behind her",
  }),
  creature({
    id: "legionnaire-de-hersende",
    name: "Légionnaire de Hersende",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Les Marches de Fer",
    cr: 1, ac: 16, acNote: "chemise de mailles, bouclier", hd: 5, speed: { marche: 9 },
    stats: [14, 12, 14, 10, 11, 10],
    skills: { Athlétisme: 4, Survie: 2 },
    resistances: ["froid"],
    languages: "pallénien",
    traits: [
      { name: "Brûler les morts", text: "Chaque légionnaire porte une torche et une fiole d'huile. Un mort-vivant qu'il réduit à 0 PV alors qu'il est en feu ne se relève jamais." },
    ],
    actions: [
      multi("Deux attaques de glaive.", { Glaive: 2 }),
      hit("Glaive", "contact", 4, "1,5 m", "1d6+2", "perforants"),
      hit("Pilum", "distance", 4, "9/36 m", "1d6+2", "perforants", "Si la cible tient un bouclier, le pilum s'y plante : désavantage à ses attaques tant qu'elle ne prend pas une action pour l'arracher."),
    ],
    reactions: [
      special("Mur de boucliers", "Quand un allié à 1,5 m est attaqué, le légionnaire impose le désavantage à l'attaque s'il tient un bouclier."),
    ],
    lore: "Manteau rouge, bouclier rond, odeur de fumée grasse. Il a servi six ans au Mur des Neuf Cents et il a brûlé plus de camarades qu'il n'en a enterré.",
    gmNotes: "Les légions sont épuisées : un légionnaire sur deux a plus de cinquante ans ou moins de seize. Ils obéissent à Hersende parce qu'elle tape elle-même sur les clous. Un légionnaire qu'on aide à brûler ses morts devient un allié pour toute la campagne.",
    scene: "a lone weary human soldier of fifty, bare head with short cropped grey hair, round human ears, a short grey beard, a broad lined tired face, wearing a long-sleeved shirt of riveted iron chain mail down to mid-thigh under a heavy red wool cloak dark with rain, a round wooden shield painted red strapped on his left forearm, a short stubby leaf-bladed gladius in a short brown scabbard on his right hip, a small round clay flask of oil tied to his belt, his right fist raised gripping a plain rough wooden stick wrapped in tarred rags at its top end, the rags burning with a ragged orange flame, brown leather boots planted on wet grey flagstones with a band of empty puddled stone below his feet, behind him a square stone fort courtyard with a bare grey stone wall, a tall pyre of stacked logs burning with two corpses wrapped in white linen shrouds lying on top, sheets of falling rain, a flat featureless grey rain-cloud sky, orange reflections of the flames on the wet stones",
  }),
  creature({
    id: "crapaud-de-vase",
    name: "Crapaud-de-vase",
    family: "Bêtes", size: "Grande", type: "bête", region: "Les Noyes",
    cr: 1, ac: 11, acNote: "", hd: 6, speed: { marche: 6, nage: 12 },
    stats: [15, 13, 13, 2, 10, 3],
    senses: "vision dans le noir 9 m",
    languages: "—",
    traits: [
      { name: "Amphibie", text: "Respire à l'air libre et sous l'eau." },
      { name: "Bond", text: "Saute jusqu'à 6 m en longueur et 3 m en hauteur, avec ou sans élan." },
    ],
    actions: [
      hit("Morsure", "contact", 4, "1,5 m", "1d10+2", "perforants", "La cible est empoignée (évasion DD 12) ; tant qu'elle l'est, le crapaud ne peut pas mordre une autre cible.", { damage: "1d6", damageType: "poison" }),
      special("Avaler", "Le crapaud avale une créature Moyenne ou plus petite qu'il empoigne. Elle est aveuglée, entravée et subit 2d4 dégâts d'acide au début de chaque tour du crapaud. S'il meurt, elle sort en rampant avec 1,5 m de déplacement."),
    ],
    lore: "Un crapaud brun de la taille d'une barque, qui dort dans la vase sous les passerelles et ne montre que ses yeux. Les coupeurs de tourbe tapent sur les planches avant de traverser.",
    gmNotes: "Les vieilles des Noyes disent qu'un crapaud-de-vase qui a avalé un Noyé coasse dans l'ancienne langue pendant trois jours. C'est vrai, et un Elfe de Mémoire peut comprendre deux mots : « Mangeur » et « en bas ».",
    scene: "two round golden eyes with horizontal black pupils and a broad wart-covered mud-brown back rising just above the flat black water of a peat bog pool, the rest of the huge toad hidden deep below the surface, the dark body outline faintly visible under the water, a rotting plank walkway crossing high over the pool with its boards resting on posts of wet timber, the toad lying beneath the planks, dark water filling the lower half of the picture, tall reeds along both edges, low thick mist on the water, two stilt houses with heavy reed roofs standing in the mist far behind, soft grey dawn colours of peat brown and moss green, empty margins all around the scene",
  }),
  creature({
    id: "ciree-de-la-rotonde",
    name: "Cirée de la Rotonde",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Le Couronnement",
    cr: 2, ac: 13, acNote: "cire durcie", hd: 8, speed: { marche: 6 },
    stats: [15, 8, 16, 3, 6, 5],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      TENACE,
      { name: "Chandelle", text: "S'il subit des dégâts de feu, la cire s'allume : il éclaire à 6 m, ses coups infligent 1d6 dégâts de feu en plus, et il perd 5 PV au début de chacun de ses tours. Une action d'eau ou de sable l'éteint.", dpr: 2 },
    ],
    actions: [
      multi("Deux coups.", { Coup: 2 }),
      hit("Coup", "contact", 4, "1,5 m", "1d8+2", "contondants"),
    ],
    lore: "Un Levé couvert de cire blanche de la tête aux pieds, avec des mèches éteintes plantées dans les épaules. On le croise dans les sous-sols de la capitale, là où il ne devrait y avoir personne.",
    gmNotes: "Ce sont les Levés qui ont franchi les fossés et gratté les murs de la Rotonde. La Garde du Seuil les traîne aux fosses pour les brûler, malgré l'interdit ; la cire des cierges fond sur eux et ils ressortent. Un Cirée dans une cave prouve que les fosses existent.",
    scene: "a shambling dead man of ordinary human build and height, his entire body from scalp to toes encased in a thick lumpy shell of opaque white candle wax, as if a hundred church candles had melted over him, every part of him smooth white wax, his face a blurred white wax mask with two dark hollows for eyes and a dark slack mouth, heavy layered white drips hanging from his chin, elbows and fingertips, five-fingered human hands and flat bare human feet with five toes, all thickly crusted in white wax, dozens of short charred black cotton wick stubs, cold and dead, poking out of the white wax on his shoulders and crown like black stubble, one single tiny flame flickering on a wick in the middle of his forehead, that small flame the only warm source in the scene, casting golden warmth over the glossy white wax and the nearest rough stones, a low vaulted stone cellar dissolving into pitch black darkness behind him, deep black shadow all around, strong candle chiaroscuro",
  }),
  creature({
    id: "mort-beni",
    name: "Mort béni",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Le Val Cierge",
    cr: 2, ac: 12, acNote: "", hd: 7, speed: { marche: 9 },
    stats: [14, 10, 14, 6, 14, 10],
    resistances: ["radiants"],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 18 m",
    languages: "comprend le pallénien et récite les répons sans comprendre",
    traits: [
      { name: "Génuflexion", text: "La première fois du combat qu'il voit un autel ou le symbole d'Ostral, il s'agenouille et perd son action. Ensuite, ses coups infligent des dégâts radiants en plus." },
      { name: "Prière muette", text: "Un personnage qui prie avec lui à genoux (action, Religion DD 13) le fait se coucher pour de bon." },
    ],
    actions: [
      multi("Deux coups de chapelet.", { "Chapelet de fer": 2 }),
      hit("Chapelet de fer", "contact", 4, "1,5 m", "1d6+2", "contondants", "", { damage: "1d4", damageType: "radiants" }),
    ],
    lore: "On dit dans le Val que certains morts s'agenouillent devant les autels avant d'attaquer. C'est vrai. Ils se signent, puis ils frappent avec le chapelet qu'on leur avait mis dans les mains.",
    gmNotes: "Ce qui reste d'Ostral répond encore aux prières, faiblement : les morts bénis le sentent. C'est l'indice que le Dieu n'est pas complètement mort. Cyprien les cite comme preuve que les morts viennent rendre hommage ; il n'a qu'à moitié tort.",
    scene: "a dead monk kneeling upright on both knees, seen in side profile, facing a stone altar crowded with tall beeswax candles, the kneeling figure fills most of the frame, his body is a dried mummified corpse with shrunken grey-brown leathery skin stretched tight over the skull, deep sunken eye sockets, hollow cheeks, thin withered lips pulled back from the teeth, bony fingers like dry twigs pressed palm to palm in prayer and wrapped in a dark rusted iron rosary, head bowed toward the altar, wearing a long bone-white linen burial robe stained with grave earth, his robe covers his folded legs on the floor, behind him a row of three more withered corpses in white burial robes kneeling with bowed heads, whitewashed stone walls of a bare Romanesque abbey chapel, a tall narrow window of pale cold blue-grey glass on one side, warm amber candle flames on the altar",
  }),
  creature({
    id: "anguille-machoire",
    name: "Anguille-mâchoire",
    family: "Bêtes", size: "Grande", type: "bête", region: "Les Noyes",
    cr: 2, ac: 13, acNote: "peau visqueuse", hd: 7, speed: { marche: 1.5, nage: 12 },
    stats: [16, 15, 12, 1, 10, 3],
    skills: { Discrétion: 4 },
    senses: "vision aveugle 9 m (sous l'eau)",
    languages: "—",
    traits: [
      { name: "Eau noire", text: "Dans l'eau de tourbe, elle est invisible pour qui se tient au-dessus. Sa première attaque contre une créature sur une passerelle a l'avantage." },
      { name: "Respiration aquatique", text: "Ne respire que sous l'eau." },
    ],
    actions: [
      hit("Morsure", "contact", 5, "3 m", "2d8+3", "perforants", "La cible est empoignée (évasion DD 13). Au tour suivant, l'anguille l'entraîne sous l'eau : la cible doit retenir son souffle."),
    ],
    lore: "Longue comme trois hommes, la tête plate et des dents tournées vers l'arrière. Elle vit sous les passerelles et attend que quelqu'un se penche pour remplir un seau.",
    gmNotes: "Les pêcheurs d'anguilles des Noyes vivent de leurs petites sœurs. Celles-ci ont grossi depuis le Glas parce qu'elles mangent les Noyés qui ne sortent pas assez vite de la tourbe. On trouve parfois des bijoux anciens dans leur ventre.",
    scene: "a gigantic European eel filling the whole height of the picture, a single thick snake-like ribbon of smooth glossy jet-black slimy skin, bursting upward from black peat water in a tall curve, flat broad head with a wide open mouth full of thin needle teeth curved backward like fish hooks, a small wooden stave bucket with a rope handle falling in mid-air beside it, tilted and spilling water, narrow plank walkway across the bottom of the picture, tall reeds, thick white mist, flying water drops",
  }),
  creature({
    id: "lanterne-de-tourbe",
    name: "Lanterne de tourbe",
    family: "Morts", size: "Très petite", type: "mort-vivant (esprit)", region: "Les Noyes",
    cr: 2, ac: 17, acNote: "", hd: 9, speed: { marche: 0, vol: 15, stationnaire: true },
    stats: [1, 22, 10, 13, 14, 11],
    resistances: ["acide", "feu", "nécrotiques", "tonnerre", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["froid", "poison"],
    conditionImmunities: ["à terre", "empoigné", "empoisonné", "entravé", "épuisement", "inconscient", "paralysé"],
    senses: "vision dans le noir 36 m",
    languages: "le parler des Noyes, mais ne parle pas",
    traits: [
      { name: "Lumière trompeuse", text: "Elle prend l'apparence d'une lanterne au verre bleu, celle des Veilleuses, et mène les voyageurs vers l'eau profonde. Perspicacité DD 14 : la lumière est froide." },
      { name: "Éteinte", text: "Par une action bonus, elle devient invisible jusqu'à ce qu'elle attaque ou se rallume." },
    ],
    actions: [hit("Toucher glacé", "contact", 8, "1,5 m", "2d8", "froid")],
    bonusActions: [
      special("Boire la chaleur", "Une créature à 0 PV à 1,5 m fait un jet de sauvegarde de Constitution DD 10 ou elle meurt. La lanterne regagne 3d6 PV."),
    ],
    lore: "Une petite lumière bleue qui flotte au-dessus des joncs, à hauteur d'homme, et qui s'éloigne quand on l'appelle. Les gens des Noyes ont toujours dit de ne jamais suivre une Veilleuse la nuit.",
    gmNotes: "Ce sont les âmes de coupeurs de tourbe noyés, que plus personne ne reçoit en bas. Leur imitation des lanternes de Veilleuses rend les vraies Veilleuses suspectes : un village peut refuser l'aide d'une Veilleuse qui arrive la nuit, et la chasser.",
    scene: "seen from low on a narrow old plank walkway, a small round medieval lantern of deep blue glass, a blue glass globe the size of an apple with a tiny pointed black iron cap, hovering alone in mid-air at a man's head height above black bog water, thick fog all around and above it, cold blue radiance pouring from the blue glass, its long blue reflection on the still black water directly beneath it, tall black reeds in the middle distance, wet grey-blue planks catching blue reflections, the walkway runs toward the lantern and its last plank breaks off jagged above deep black water an arm's length short of the reflection, dense blue-black fog filling the whole sky, blue and black palette, the blue lantern the single bright point of the painting, dark still water along the bottom edge",
  }),
  creature({
    id: "sanglier-de-la-brune",
    name: "Sanglier de la Brune",
    family: "Bêtes", size: "Grande", type: "bête", region: "La Brune",
    cr: 2, ac: 12, acNote: "armure naturelle", hd: 5, speed: { marche: 12 },
    stats: [17, 10, 17, 2, 7, 5],
    languages: "—",
    traits: [
      { name: "Charge", text: "S'il parcourt au moins 6 m en ligne droite avant de toucher, +2d6 dégâts tranchants et la cible fait un jet de sauvegarde de Force DD 13 ou tombe à terre.", dpr: 3 },
      { name: "Implacable", text: "Une fois par repos court, s'il subit 10 dégâts ou moins qui le feraient tomber à 0 PV, il reste à 1 PV." },
    ],
    actions: [hit("Défenses", "contact", 5, "1,5 m", "2d6+3", "tranchants")],
    lore: "Un sanglier noir haut comme un poney, qui fouille les clairières rondes où rien ne pousse. Les elfes ne le chassent pas : ils disent qu'il sait où creuser.",
    gmNotes: "Les sangliers déterrent ce qu'il y a sous les clairières rondes. Un sanglier abattu peut avoir des esquilles d'os pris dans les défenses, et parfois une petite plaque de verre doré du Verre-Rouge, ce qui n'a rien à faire dans une forêt du nord-est.",
    scene: "wide view from a distance across a forest clearing, in the middle stands a huge shaggy black wild boar seen from behind at three-quarters, rump and humped bristly back toward the viewer, the whole animal small in the frame with wide margins of earth around it, its head pushed down into a shallow hole it is digging, face hidden in the soil, the clearing is a perfect circle of bare churned dark brown earth sharply edged by a thick ring of green ferns and moss, a few small whitish chips of old bone scattered in the dug soil near its forelegs, colossal ancient oak trunks as wide as houses standing around the circle, deep green shade under a dense leafy canopy, still and silent woods",
  }),
  creature({
    id: "compagnon-cloueur",
    name: "Compagnon-cloueur",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Partout",
    cr: 2, ac: 14, acNote: "cuir clouté", hd: 9, speed: { marche: 9 },
    stats: [14, 14, 12, 10, 13, 10],
    skills: { Médecine: 3, Religion: 2, Perception: 3 },
    languages: "pallénien, argot des fossoyeurs",
    traits: [
      { name: "Fer froid", text: "Contre un mort-vivant, ses coups de marteau infligent 1d4 dégâts radiants en plus, une fois par tour.", dpr: 2.5 },
      { name: "Goudron et chaux", text: "Avantage aux jets de sauvegarde contre les maladies et contre la peur des morts-vivants." },
    ],
    actions: [
      multi("Deux coups de marteau.", { "Marteau de cloueur": 2 }),
      hit("Marteau de cloueur", "contact", 4, "1,5 m", "1d8+2", "contondants"),
      hit("Clou de jet", "distance", 4, "6/18 m", "1d4+2", "perforants"),
    ],
    reactions: [
      special("Talon", "Quand un mort-vivant à 1,5 m tombe à 0 PV, le compagnon lui plante un clou dans le talon : il ne se relève pas."),
    ],
    lore: "Un clou de fer à tête carrée dans le lobe de l'oreille gauche, deux encoches sur la tête. Il sent le goudron et la chaux et se fait payer à la paire de talons.",
    gmNotes: "Payé au cadavre, il gonfle volontiers ses comptes : il garde des clous de rechange pour prouver des morts qu'il n'a pas cloués. Il a sur lui un bout de carte avec des lignes tirées à la règle, recopié dans sa loge, sans savoir ce qu'elles veulent dire.",
    scene: "seen in left profile, a burly English village gravedigger with a thick neck and a shaven head marked by two short scars, a heavy black iron nail with a square head hanging from his fleshy earlobe like a crude earring, black tarred leather coat covered in round iron studs, kneeling in brown mud at the feet of a dead old peasant laid on a plank under a grey linen sheet, his left hand pressing a long iron nail against the bare heel of the dead man, his right hand raising a blunt iron hammer with a thick square head and a short ash handle, a fat leather purse of nails hanging at his hip, white lime powder on his boots, a small iron lantern set in the mud beside the plank, a narrow lane of dark mud between timber cottages with thatched roofs, dusk sky of dull ochre",
  }),
  creature({
    id: "main-nue",
    name: "Main-Nue",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Le Val Cierge",
    cr: 2, ac: 12, acNote: "", hd: 9, speed: { marche: 9 },
    stats: [12, 14, 12, 10, 13, 16],
    skills: { Religion: 2, Intimidation: 5 },
    conditionImmunities: ["effrayé"],
    languages: "pallénien",
    traits: [
      { name: "Elle nous voit", text: "Quand une Main-Nue tombe à 0 PV, les autres Mains-Nues à 9 m ont l'avantage aux attaques jusqu'à la fin de leur prochain tour." },
      { name: "Marque brûlée", text: "Elles se sont brûlé la paume gauche au fer rouge pour imiter la marque d'Ysé : un rond et neuf stries." },
    ],
    actions: [
      multi("Un coup de bâton et une paume.", { "Bâton de pèlerin": 1, Paume: 1 }),
      hit("Bâton de pèlerin", "contact", 3, "1,5 m", "1d6+1", "contondants"),
      hit("Paume", "contact", 5, "1,5 m", "2d8", "radiants", "La paume brûlée touche la peau nue."),
    ],
    reactions: [
      special("Prendre le coup", "Quand une créature à 1,5 m qu'elle protège est touchée, la Main-Nue prend le coup à sa place."),
    ],
    lore: "Des pèlerins qui suivent l'Enfant en marchant pieds nus parmi les morts, sans arme, la main gauche en avant. Ils campent dans la boue autour de la ferme fortifiée et ne dorment presque pas.",
    gmNotes: "Les Mains-Nues tueront quiconque essaie d'emmener Ysé, y compris les Veilleuses si elles hésitent. Ysé a peur d'eux et ne le dit à personne. Leur meneuse entend une voix la nuit qui lui dit que l'Enfant doit aller à Aube-Close : Gorvan prépare le terrain.",
    scene: "the whole figure from the top of her head down to her bare toes, a thin medieval peasant woman of forty walking toward us out of a muddy pilgrim camp, a plain human face with hollow cheeks and fierce devout eyes, a coarse undyed linen headscarf tied under the chin hiding her hair and ears, a long mud-stained grey wool tunic with long sleeves, a rope belt, both bare feet ankle-deep in brown mud at the bottom of the picture; on the left side of the picture her fist closes tightly around a knotted wooden walking staff, the staff foot sunk in the mud beside her bare foot; on the right side of the picture her other arm reaches straight out toward us, the open hand shown flat and large in the foreground, inside of the hand facing us, thumb on the outer edge of the picture; branded into the middle of that palm like a cattle brand, a dark brown seared circle the size of a coin with nine short seared rays around it, a crude sun stamped by a branding iron into scabbed skin; behind her, barefoot pilgrims in brown rags, patched canvas tents, smoky cookfires, grey evening sky",
  }),
  creature({
    id: "noye",
    name: "Noyé",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Les Noyes",
    cr: 3, ac: 11, acNote: "peau tannée", hd: 9, speed: { marche: 6, nage: 9 },
    stats: [16, 8, 15, 6, 10, 12],
    saves: { Sag: 2 },
    resistances: ["feu", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision dans le noir 18 m",
    languages: "l'ancienne langue, d'avant l'Empire",
    traits: [
      { name: "Sorti de la tourbe", text: "Il ne respire pas et peut rester immobile sous l'eau aussi longtemps qu'il veut. Dans l'eau de tourbe, il a l'avantage aux tests de Discrétion." },
      { name: "Ancienne langue", text: "Un sur trois répond si on lui parle dans la langue d'avant l'Empire." },
    ],
    actions: [
      multi("Il fixe une cible du regard, puis frappe.", { Poing: 1 }),
      hit("Poing", "contact", 5, "1,5 m", "2d6+3", "contondants", "La cible ne peut pas récupérer de PV avant la fin de son prochain tour.", { damage: "2d6", damageType: "nécrotiques" }),
      save("Regard de tourbe", "Sag", 11, "Une créature à 18 m qui le voit. Échec : effrayée jusqu'à la fin de son prochain tour. Si elle rate de 5 ou plus, elle est aussi paralysée pour la même durée."),
    ],
    lore: "Mort il y a trois, cinq, dix siècles, la peau tannée brun-roux et les cheveux teints par la tourbe. Il sort de l'eau intact, avec ses bracelets de cuivre et le nœud de la corde qui l'a tué.",
    gmNotes: "Les Noyés se souviennent des deux dieux. Celui qui parle dit toujours la même chose : « Ils ne nous laissent pas descendre. » Il ne ment pas : en bas, Gorvan attend derrière le sceau et repousse les âmes. Un Noyé apaisé (rituel de la veillée) peut redevenir de la tourbe, ce que veut la Mère Tourbe.",
    scene: "a drowned medieval peasant man preserved by the peat, realistic ordinary human face of a gaunt middle-aged farmer with a broad nose, thin closed lips and a short wet beard, long wet auburn hair plastered over the sides of his head and falling past his shoulders, smooth leathery reddish-brown tanned skin like old saddle leather, standing waist-deep in still black peat water among tall brown reeds, his arms hanging straight at his sides, a thin hammered copper bangle of shiny metallic orange on each wrist, a braided brown leather cord knotted tight around his throat, deep-set dark sunken eyes staring straight at the viewer, the water surface cutting his body at the waist, thick pale grey morning fog filling the marsh behind him, a soft grey sky",
  }),
  creature({
    id: "porte-voix",
    name: "Porte-Voix",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Partout",
    cr: 3, ac: 14, acNote: "cuir clouté", hd: 6, speed: { marche: 9 },
    stats: [16, 14, 16, 13, 14, 16],
    skills: { Perspicacité: 4, Tromperie: 5, Perception: 4 },
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques qui ne sont pas en fer froid"],
    immunities: ["poison"],
    conditionImmunities: ["empoisonné", "épuisement"],
    senses: "vision dans le noir 18 m",
    languages: "toutes celles que parle son interlocuteur",
    traits: [
      { name: "La voix des vôtres", text: "Il parle avec la voix de quelqu'un que son interlocuteur a perdu. Chacun entend une voix différente." },
      { name: "Yeux d'eau de vaisselle", text: "Ses yeux sont gris clair. Perception DD 12 pour le remarquer dans la pénombre." },
      { name: "Le nom", text: "Si quelqu'un prononce à voix haute le nom de Gorvan à 9 m de lui, il fait un jet de sauvegarde de Charisme DD 18. Échec : neutralisé jusqu'à la fin de son prochain tour." },
      { name: "À bientôt", text: "Quand il tombe à 0 PV, il dit « À bientôt » et s'effondre." },
    ],
    actions: [
      multi("Deux coups d'épée longue, ou un coup d'épée et Prendre le souffle.", { "Épée longue": 2 }),
      hit("Épée longue", "contact", 5, "1,5 m", "1d10+3", "tranchants", "Tenue à deux mains."),
      hit("Prendre le souffle", "contact", 5, "1,5 m", "1d6+3", "nécrotiques", "Les PV maximum de la cible baissent du même montant jusqu'au prochain repos long."),
      save("Suggestion", "Sag", 13, "À volonté, avec la voix d'un défunt aimé. Une créature qui l'entend suit une suggestion raisonnable pendant 8 heures (concentration)."),
    ],
    lore: "Un mort qui parle, avec intelligence, et toujours avec la voix de quelqu'un que vous avez perdu. Ses yeux sont gris clair, comme de l'eau de vaisselle. Personne n'a jamais su d'où ils viennent.",
    gmNotes: "Gorvan habite ces corps directement. Ils cherchent les reliques d'Ostral pour les détruire, approchent les héritiers et recrutent des Rendus. Chaque mort-vivant animé par un sort a 1 chance sur 6 par aube de devenir Porte-Voix. Sous 50 de jauge, il y en a dans toutes les villes.",
    scene: "a dead man of forty embalmed and dressed for his own wake, sitting sideways on a low wooden bench beside a tavern table, his whole body visible from boots to head, an ordinary handsome human face with full intact flesh, small rounded human ears half hidden under short combed dark hair, clean-shaven, ashen grey-white waxen skin like cold tallow, lilac-grey bloodless lips curved in a soft patient smile, milky washed-out pale grey irises almost white, a plain long dark brown leather coat covered in small round iron studs, a coarse undyed linen tunic, a sheathed two-handed longsword lying horizontally across both thighs, his two hands resting flat on the leather scabbard in his lap, the heavy oak table at his right elbow holding a single short tallow candle in a clay dish and a wooden cup, the dark hooded back of a listener at the lower left corner, dark timber walls, deep warm amber shadows",
  }),
  creature({
    id: "garde-du-seuil",
    name: "Garde du Seuil",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Le Couronnement",
    cr: 3, ac: 18, acNote: "cotte de mailles, bouclier", hd: 8, speed: { marche: 9 },
    stats: [16, 11, 14, 10, 13, 12],
    skills: { Perception: 3, Religion: 2 },
    languages: "pallénien, céleste de cour",
    traits: [
      { name: "Gardien des portes", text: "Les créatures à 1,5 m de lui traitent ce terrain comme difficile." },
    ],
    actions: [
      multi("Deux coups de masse bénie.", { "Masse bénie": 2 }),
      hit("Masse bénie", "contact", 5, "1,5 m", "1d6+3", "contondants", "", { damage: "1d6", damageType: "radiants" }),
      hit("Arbalète légère", "distance", 2, "24/96 m", "1d8", "perforants"),
    ],
    reactions: [
      special("Barrer le seuil", "Quand une créature à 1,5 m s'éloigne, le garde l'attaque à la masse. S'il touche, le déplacement de la cible tombe à 0 pour ce tour."),
    ],
    lore: "Cotte de mailles blanchie à la chaux, tabard frappé de la porte fermée et de la couronne. Ils gardent la Rotonde et repoussent les Levés à la fourche, sur les fossés, chaque semaine.",
    gmNotes: "La Garde brûle les Levés en secret dans les sous-sols, malgré l'interdit de l'Église, et Cyprien fait semblant de ne pas le savoir. Un garde avec de la cendre sur les bottes peut être fait chanter. C'est par leurs fosses qu'on descend vers le puits.",
    scene: "a tall lean young human soldier of slender build, long legs and narrow waist, his head small in proportion to his tall body, standing straight like a sentry, bareheaded with short dark brown hair, a narrow stern clean-shaven face with a long jaw and thin lips, rounded human ears, chain mail hauberk painted chalk-white with lime wash down to his knees, over it a long plain off-white linen surcoat reaching his shins, on the chest one small painted badge: a dark-red arched wooden door with black iron hinges, closed, topped by a small gold crown, his right hand raising a short iron mace up against his right shoulder, its heavy round iron head of six sharp flanges clearly beside his cheek, a white almond-shaped shield strapped to his left forearm, tall leather boots dusted grey with ash up to the ankles, standing on wide stone steps before tall closed bronze double doors in a stone archway, high above the wall the outside of a round stone church with a broad green copper roof shaped like a bowl turned upside down, two burning torches flaming in iron brackets on either side of the doors, dark smoke drifting across the stone wall",
  }),
  creature({
    id: "contremaitre-a-l-ombrelle",
    name: "Contremaître à l'ombrelle",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "La Côte des Sels",
    cr: 3, ac: 15, acNote: "cuir clouté", hd: 10, speed: { marche: 9 },
    stats: [11, 16, 12, 14, 13, 15],
    skills: { Perspicacité: 3, Persuasion: 4, Tromperie: 4 },
    languages: "pallénien, trois accents de port",
    traits: [
      { name: "Tout a un prix", text: "Une fois par combat, il propose une somme à un adversaire (Perspicacité DD 13 pour savoir s'il paiera vraiment). S'il accepte, le combat s'arrête pour lui." },
    ],
    actions: [
      multi("Deux attaques de lame d'ombrelle.", { "Lame d'ombrelle": 2 }),
      hit("Lame d'ombrelle", "contact", 5, "1,5 m", "1d8+3", "perforants", "Une rapière cachée dans le manche de l'ombrelle."),
      hit("Fouet à chaîne", "contact", 5, "3 m", "1d4+3", "tranchants", "La cible fait un jet de sauvegarde de Force DD 13 ou elle tombe à terre."),
    ],
    bonusActions: [
      special("Siffler les chaînes", "Jusqu'à deux Morts des salines à 9 m qui l'entendent se déplacent et attaquent avec leur réaction."),
    ],
    reactions: [special("Parade", "+2 à la CA contre une attaque au contact qui le toucherait, s'il voit l'attaquant.")],
    lore: "Chapeau de paille, ombrelle blanche et livre de comptes sous le bras. Il compte tout par lignes de bassin : « C'est trois couronnes la ligne, monsieur, et je vous fais grâce de la pause. »",
    gmNotes: "Il sait que la Hanse emploie des morts et il a le registre sur lui. Si on l'accule, il propose une grosse somme pour faire disparaître un inspecteur de l'Église. Il paie vraiment : c'est sa seule qualité.",
    scene: "a plump clean-shaven medieval human merchant with a round pink smiling face and shrewd small eyes, a wide-brimmed woven straw hat on his head, a long belted ochre wool tunic down to his knees over brown hose, plain soft leather medieval shoes, his right fist gripping the long ivory shaft of an open white cloth parasol held high above his hat, his left arm clamping a thick leather-bound ledger against his ribs, a coiled whip of fine iron chain hanging from his leather belt, standing on a narrow earthen dyke between flat pink salt evaporation ponds at noon, behind him three gaunt barefoot human laborers with grey wrinkled skin crusted in white salt, ragged linen rags, iron chains linking their ankles, bent over wooden rakes, a blazing white sun high in a pale bleached sky, glittering salt crystals everywhere",
  }),

  // ===== FP 4 à 6 =====
  creature({
    id: "ancetre-mure",
    name: "Ancêtre muré",
    family: "Morts", size: "Moyenne", type: "mort-vivant (nain)", region: "Les Monts Ossiers",
    cr: 4, ac: 17, acNote: "harnois ancestral, bouclier", hd: 11, speed: { marche: 7.5 },
    stats: [17, 9, 17, 10, 12, 8],
    saves: { Con: 5 },
    resistances: ["nécrotiques"],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 36 m",
    languages: "nain, ancien nain",
    traits: [
      { name: "Tient la montagne", text: "On ne peut ni le pousser ni le faire tomber à terre contre son gré." },
      { name: "Nom gravé", text: "Si quelqu'un lit à voix haute son nom sur une pierre d'ancêtres, il fait un jet de sauvegarde de Sagesse DD 13. Échec : il s'arrête, montre le sol du doigt et ne combat plus pendant 1 minute." },
    ],
    actions: [
      multi("Deux coups de marteau de guerre.", { "Marteau de guerre": 2 }),
      hit("Marteau de guerre", "contact", 5, "1,5 m", "1d8+3", "contondants"),
      save("Plomb fondu", "Dex", 13, "Il crache le plomb qu'on a coulé sur lui : cône de 4,5 m. Moitié des dégâts en cas de réussite.", "4d6", "feu", 2, "5-6"),
    ],
    lore: "Un nain mort en armure de famille, la barbe tressée de fils d'or, la bouche et la gorge pleines de plomb refroidi. Il frappe contre les portes de plomb depuis la nuit du Glas.",
    gmNotes: "Trois cités naines ont muré leurs niveaux inférieurs avec leurs familles encore dedans. Les ancêtres ne sont pas méchants : ils montrent tous le sol, plus bas, comme pour dire « là ». Un nain Ossuaire qui leur parle apprend qu'ils ont « senti quelqu'un ouvrir les yeux » sous la montagne.",
    scene: "a squat broad dwarf king's corpse standing guard, short legs, barrel chest, grey parchment skin and closed sunken eyes, his lips stretched around a thick gag of solid pewter-grey metal that fills his mouth, a heavy frozen icicle of hardened grey lead hanging from that gag down his chin to his chest, long grey beard split into three braids bound with wide gold rings, a mail hood covering his head and cheeks under a low iron crown-helm, ornate engraved ancestral plate armour, thick square iron boots, a round iron shield on his left arm, a plain iron warhammer resting on his right shoulder in his right fist, behind him a towering stone door carved with stern bearded ancestor faces, its cracks filled with grey lead, rough black rock walls of a low cave hall, an iron brazier of red embers at his feet throwing orange from below",
  }),
  creature({
    id: "souffle-du-dessous",
    name: "Souffle du Dessous",
    family: "Créatures du Dessous", size: "Grande", type: "élémentaire (Dessous)", region: "Le Dessous",
    cr: 4, ac: 14, acNote: "", hd: 8, speed: { marche: 0, vol: 15, stationnaire: true },
    stats: [14, 18, 14, 6, 10, 10],
    resistances: ["froid", "foudre", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["à terre", "empoigné", "empoisonné", "entravé", "épuisement", "inconscient", "paralysé", "pétrifié"],
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      { name: "Relever", text: "À la fin de chacun de ses tours, chaque cadavre dans son espace ou à 3 m se relève en Levé, sans maître, et part vers Aube-Close." },
      { name: "Forme de vent", text: "Il passe par une fente de 2,5 cm et peut entrer dans l'espace d'une autre créature." },
      { name: "Odeur", text: "Un vent tiède qui sent la cave et le lait tourné. On le sent avant de le voir." },
    ],
    actions: [
      multi("Deux caresses.", { Caresse: 2 }),
      hit("Caresse", "contact", 6, "1,5 m", "1d8+4", "nécrotiques"),
      save("Tourbillon", "Con", 12, "Chaque créature dans son espace. Moitié des dégâts en cas de réussite ; en cas d'échec, ses PV maximum baissent du même montant jusqu'au prochain repos long.", "3d8", "nécrotiques", 2, "4-6"),
    ],
    lore: "Les mineurs nains l'appellent le Bâillement : un courant d'air tiède qui remonte des fissures, couche les flammes des lampes et fait se lever les morts sur son passage.",
    gmNotes: "C'est le souffle de Gorvan, littéralement. Il sort par les fissures du sceau et suit les galeries jusqu'à la surface. Là où il passe, les Levés se lèvent en une heure. Fermer une fissure (sanctification, ou un sort de niveau 4+ qui coûte un Murmure) l'arrête.",
    scene: "wide view of a timbered dwarven mine gallery with rough rock walls and crooked wooden props, a jagged crack crosses the rock floor in the lower middle, out of it surges a huge column of churning dusty grey-yellow air three times the height of a man filling the centre of the picture, the swirling haze shapes a giant faceless figure with a round misty head, broad shoulders and two long arms of vapour stretched out to the right, its smoky hands hovering above a dead dwarf miner, the dead miner rests on a flat raised rock shelf at mid-height on the right side, ashen grey skin, filmy eyes, his torso stiffly lifting off the stone and one rigid arm reaching up toward the vapour hands, his bearded head in full view at the middle of the picture, on a rock ledge at the left two tallow candles in a clay dish, their flames stretched flat and horizontal toward the column like tiny flags in a strong wind, grit and dust whirling in spirals, a sickly ochre haze seeping up from deep in the crack, the lowest part of the picture is plain dark rock floor",
  }),
  creature({
    id: "gueule-de-saumure",
    name: "Gueule-de-saumure",
    family: "Monstruosités", size: "Grande", type: "monstruosité", region: "La Côte des Sels",
    cr: 4, ac: 14, acNote: "armure naturelle", hd: 11, speed: { marche: 3, nage: 12 },
    stats: [18, 12, 16, 2, 12, 5],
    skills: { Perception: 3 },
    senses: "vision aveugle 18 m (sous l'eau)",
    languages: "—",
    traits: [
      { name: "Sang dans l'eau", text: "Avantage aux attaques contre une créature qui n'a pas tous ses PV, si elle est dans l'eau." },
      { name: "Amphibie", text: "Respire à l'air libre et sous l'eau." },
    ],
    actions: [
      multi("Une morsure et un coup de queue.", { Morsure: 1, Queue: 1 }),
      hit("Morsure", "contact", 6, "1,5 m", "2d8+4", "perforants", "La cible est empoignée (évasion DD 14)."),
      hit("Queue", "contact", 6, "3 m", "1d10+4", "contondants"),
    ],
    lore: "Un poisson pâle long comme une galère, la gueule bordée de cristaux de sel au lieu de lèvres. Il remonte les canaux de Port-Lagune la nuit, quand les barges des morts passent.",
    gmNotes: "La Hanse jette dans les canaux les morts qui ne travaillent plus, lestés de sacs de sel. La gueule-de-saumure s'en nourrit et suit les barges. Si les joueurs la tuent, on trouve dans son ventre des chaînes numérotées : la preuve du trafic.",
    scene: "a huge pale grey-white fish as long as a galley, shaped like a giant carp with scales, gills, dorsal fin and tail fin, one round dull eye on each side of its head, bursting head-first out of a black canal in a spray of water, its long scaly body arching half out of the water, its gaping mouth has bare jaw edges encrusted with thick jagged white rock salt crystals like a crust of salt around rows of teeth, wooden stilt houses with thatched roofs on both banks, iron lanterns with small orange flames hanging from the houses, orange lantern reflections on the black water, deep darkness, black sky, in the foreground floating flat on the water surface beside the fish, a low wooden barge loaded with sacks of salt and grey shrouded bodies bound with iron chains",
  }),
  creature({
    id: "raie-des-dunes",
    name: "Raie des dunes",
    family: "Monstruosités", size: "Grande", type: "monstruosité", region: "Le Verre-Rouge",
    cr: 4, ac: 15, acNote: "armure naturelle", hd: 12, speed: { marche: 6, fouissement: 12 },
    stats: [16, 16, 14, 2, 13, 4],
    skills: { Discrétion: 7 },
    senses: "perception des vibrations 18 m",
    languages: "—",
    traits: [
      { name: "Nage du sable", text: "Elle se déplace sous le sable meuble comme dans l'eau, sans laisser de trace." },
      { name: "Sous le sable", text: "Sa première attaque contre une créature qui ne l'a pas repérée a l'avantage." },
    ],
    actions: [
      multi("Un coup de dard et un coup d'aile.", { Dard: 1, Aile: 1 }),
      hit("Dard", "contact", 5, "3 m", "1d10+3", "perforants", "Jet de sauvegarde de Constitution DD 13 : en cas de réussite, les dégâts de poison sont réduits de moitié.", { damage: "3d6", damageType: "poison" }),
      hit("Aile", "contact", 5, "1,5 m", "1d8+3", "tranchants"),
    ],
    bonusActions: [special("S'enfouir", "Elle disparaît sous le sable meuble à son emplacement.")],
    lore: "Une raie couleur de sable, large comme une tente, qui nage sous les dunes. On voit seulement le sable frémir, puis la queue se lever.",
    gmNotes: "Les raies évitent le verre noir. Une caravane perdue peut survivre en campant sur une plaque de verre, au prix d'une nuit à écouter ce qui chante dessous.",
    scene: "natural history engraving of a stingray, seen from behind and a little above so that only its flat back shows, a sand-coloured stingray the width of a nomad tent bursting at a slant out of a dull rust-red dune, its lower edge still dragging in the sand, its whole body one flat smooth rhombus like a kite, rough grainy hide crusted with dry sand, thick curtains of sand pouring off both wing tips, a long whip tail rising from the rear point of the rhombus and curling forward over the back, the tail ending in a single jagged saw-toothed barb aimed at a rider, a robed rider on a shaggy two-humped bactrian camel running away down the slope in the right foreground, the rider looking back over his shoulder, the camel twice as tall as the stingray is thick, a cracked slab of black volcanic glass half sunk in the sand at bottom left, the sky a deep red sunset with the last thin rim of the sun sinking behind the dunes at the horizon, long dark shadows stretching across the sand, gusts of sand blowing across the whole scene",
  }),
  creature({
    id: "colonne-de-la-marche",
    name: "Colonne de la Marche",
    family: "Morts", size: "Très grande", type: "nuée de morts-vivants Moyens", region: "Le Couronnement",
    cr: 5, ac: 8, acNote: "", hd: 10, speed: { marche: 6 },
    stats: [16, 6, 18, 3, 6, 5],
    resistances: ["contondants", "perforants", "tranchants"],
    immunities: MORT_IMMUN,
    conditionImmunities: ["charmé", "effrayé", "empoigné", "empoisonné", "entravé", "épuisement", "étourdi", "à terre", "paralysé", "pétrifié"],
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      { name: "Nuée de morts", text: "Elle occupe l'espace des autres créatures. Elle ne récupère pas de PV. À la moitié de ses PV, ses coups font moitié moins de dés." },
      { name: "Emporter", text: "Une créature qui commence son tour dans son espace fait un jet de sauvegarde de Force DD 14 ou elle est entraînée de 6 m vers Aube-Close et tombe à terre." },
      MARCHE,
    ],
    actions: [
      multi("Deux salves de coups.", { Coups: 2 }),
      hit("Coups", "contact", 6, "0 m", "4d8", "contondants", "Une créature dans l'espace de la colonne."),
    ],
    lore: "Une centaine de Levés serrés épaule contre épaule sur la route impériale, qui avancent du même pas. Les paysans la voient venir à deux lieues, à la poussière.",
    gmNotes: "Une colonne ne dévie jamais. Elle passe à travers une haie, un mur de ferme, une rivière. Un village sur son trajet n'a que deux choix : partir, ou creuser un fossé de chaux en travers de la route et tenir une nuit.",
    scene: "bird's-eye view from a high hilltop, a narrow raised medieval causeway of uneven rough-hewn cobblestones with tufts of grass between the stones and muddy cart ruts, winding gently through a vast plain of ripe golden wheat, the whole causeway packed edge to edge by one dense column of a hundred gaunt walking human corpses crowded shoulder to shoulder, all striding in step in the same direction along the cobbles, emaciated peasant men and women with ashen grey skin stretched over their cheekbones, hollow eyes, hanging jaws, long tangled hair on bare heads, rotting wool tunics and rags, a few rusted mail shirts, pale ochre dust billowing from their feet and hanging over the column, farther along the causeway in their path a tiny huddle of thatched timber cottages around a squat grey stone chapel with a short square belfry, distant horizon of low blue hills and dark forest, the whole daytime sky a churning mass of heavy mustard-yellow thunderclouds",
  }),
  creature({
    id: "sonneur-du-glas",
    name: "Sonneur du Glas",
    family: "Morts", size: "Moyenne", type: "mort-vivant (esprit)", region: "Le Couronnement",
    cr: 5, ac: 13, acNote: "", hd: 18, speed: { marche: 0, vol: 12, stationnaire: true },
    stats: [1, 14, 10, 10, 12, 17],
    resistances: ["acide", "feu", "foudre", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["froid", "nécrotiques", "poison", "tonnerre"],
    conditionImmunities: ["charmé", "empoigné", "empoisonné", "entravé", "épuisement", "à terre", "paralysé", "pétrifié"],
    senses: "vision dans le noir 18 m",
    languages: "pallénien",
    traits: [
      { name: "Intangible", text: "Il traverse créatures et objets comme un terrain difficile." },
      { name: "Neuf cents coups", text: "Il compte à voix haute. Quand il arrive à neuf cents, il disparaît jusqu'à la nuit suivante. Il en est rarement à moins de huit cents." },
    ],
    actions: [
      multi("Deux mains froides.", { "Main froide": 2 }),
      hit("Main froide", "contact", 5, "1,5 m", "3d6", "nécrotiques"),
      save("Glas", "Con", 14, "Chaque créature à 9 m. Moitié des dégâts en cas de réussite ; en cas d'échec, assourdie jusqu'à la fin de son prochain tour.", "4d10", "tonnerre", 2, "4-6"),
    ],
    lore: "Un sonneur en blouse de toile, pendu à une corde de cloche qui n'existe pas. Il tire, et on entend la cloche. Il compte les coups à voix basse.",
    gmNotes: "La nuit du Glas, les cloches d'Aube-Close ont sonné seules neuf cents coups. Les sonneurs qui ont essayé de les arrêter sont morts les bras arrachés. Leurs esprits continuent. Un Sonneur qu'on laisse finir son compte dit, au neuf centième coup, l'article du Code qui correspond : un indice si le MJ le veut.",
    scene: "a ghost shaped entirely of drifting pale blue-grey smoke and swirling dust, in the form of a gaunt bareheaded peasant bell-ringer with cropped hair, a short coarse linen smock with rolled sleeves sketched in faint wisps, double exposure effect, the dark oak beams and rough stone blocks behind him plainly showing through his face, chest and arms, his body unravelling into a long trailing tail of smoke below the waist, drifting high in mid-air at the height of the bell, leaning far back with both arms reaching up and pulling down hard, his clenched hands wrapped around a thin twisting thread of white vapour that rises from his fists toward the bell and dissolves halfway, his lips parted mid-count, sunken patient empty eyes, above him one enormous dark bronze bell tipped steeply sideways in full swing on its oak headstock, its rim smeared with motion blur, sheets of dust and grit falling from the rafters through the smoke, inside a cramped belfry of rough grey stone and black oak timbers, pale grey rays slanting through slatted wooden louvres, an open trapdoor in the floorboards far below",
  }),
  creature({
    id: "mangeur-de-bucher",
    name: "Mangeur de bûcher",
    family: "Monstruosités", size: "Grande", type: "géant", region: "Les Marches de Fer",
    cr: 5, ac: 15, acNote: "peau de cendre", hd: 10, speed: { marche: 12 },
    stats: [19, 10, 18, 6, 9, 7],
    skills: { Perception: 2 },
    immunities: ["feu"],
    senses: "vision dans le noir 18 m",
    languages: "comprend le pallénien",
    traits: [
      { name: "Régénération de cendre", text: "Il regagne 10 PV au début de son tour s'il se trouve à 3 m d'un feu ou de cendres chaudes. Du sel jeté dans le feu (action) ou de l'eau l'en empêche ce tour-ci." },
      { name: "Odorat", text: "Avantage aux tests de Perception fondés sur l'odorat." },
    ],
    actions: [
      multi("Une morsure et deux coups de griffes.", { Morsure: 1, Griffes: 2 }),
      hit("Morsure", "contact", 7, "1,5 m", "1d8+4", "perforants"),
      hit("Griffes", "contact", 7, "1,5 m", "2d6+4", "tranchants"),
    ],
    lore: "Un géant gris aux bras trop longs, couvert de cendre, qui sort de la bruyère la nuit pour manger les os des bûchers. Les forts doublent la garde autour du feu.",
    gmNotes: "Depuis que les Marchois brûlent leurs morts, il a toujours à manger, et il grossit. Il préfère la cendre aux vivants, mais il ne fait pas la différence avec un garde qui dort près du feu. Hersende paie 50 po la tête.",
    scene: "a hulking two-legged giant built like an enormous gaunt bald man, broad human face with heavy brow, flat nose and blunt jaw, dull grey skin caked in pale powdery ash like a man rolled in a cold hearth, ragged hide loincloth, absurdly long arms hanging past his knees ending in huge knuckled hands, squatting on bent human legs atop the collapsed smouldering embers of a funeral pyre of charred logs, a blackened human skeleton half-buried in the cinders, one hand pushing a charred bone between his teeth while the other grips a burnt thighbone, pale bones scattered over the ashes, small orange sparks drifting upward into a starless pitch-black sky, dim ember tones of brown and orange rising from below onto his chest and face, dark heather moor, behind him a rough fieldstone fort wall where a small cloaked watchman holds a burning wooden torch aloft",
  }),
  creature({
    id: "porte-aigle",
    name: "Porte-Aigle des Marches",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Les Marches de Fer",
    cr: 5, ac: 18, acNote: "demi-plates, bouclier", hd: 15, speed: { marche: 9 },
    stats: [18, 12, 14, 12, 13, 15],
    saves: { For: 7, Con: 5 },
    skills: { Athlétisme: 7, Intimidation: 5 },
    resistances: ["froid"],
    languages: "pallénien, orc",
    traits: [
      { name: "Tenir le Mur", text: "Les légionnaires alliés à 9 m qui le voient ont l'avantage aux jets de sauvegarde contre la peur." },
    ],
    actions: [
      multi("Trois coups d'épée longue.", { "Épée longue": 3 }),
      hit("Épée longue", "contact", 7, "1,5 m", "1d8+4", "tranchants"),
      hit("Javelot", "distance", 7, "9/36 m", "1d6+4", "perforants"),
    ],
    bonusActions: [special("« Compris ? »", "Un légionnaire allié à 9 m qui l'entend attaque une fois avec sa réaction.")],
    reactions: [special("Parade", "+3 à la CA contre une attaque au contact qui le toucherait.")],
    lore: "Il porte l'aigle de bronze de sa légion sur une hampe et l'épée de l'autre main. Il a vingt ans de Mur derrière lui et il finit ses phrases comme la Générale.",
    gmNotes: "Les porte-aigles sont les seuls officiers que Hersende écoute. L'un d'eux a vu la Générale parler seule dans sa tente et répondre à quelqu'un. Il ne l'a dit à personne. Gagner sa confiance, c'est obtenir ce témoignage.",
    scene: "a weathered fifty-year-old human soldier standing on the paved walkway of a long high stone fortress wall with square battlements, bareheaded, short grey hair plastered by rain, a thick white scar running across his cheek and nose, a broken nose, a grim lined face, wearing dented steel half plate with a plain steel breastplate over chainmail and a soaked dark red wool cloak, his left fist gripping a tall straight wooden staff planted on the stones, a small cast bronze eagle figure with spread wings bolted to the very top of the staff, his right hand holding a long steel sword pointed down at his side, heavy slanting rain streaks, wet glistening stones, behind him along the same wall three life-sized helmeted soldiers in red cloaks with tall rectangular shields and spears, beyond the wall a grey choppy sea and dark mountains under heavy grey storm clouds",
  }),
  creature({
    id: "charme-pendu",
    name: "Charme pendu",
    family: "Monstruosités", size: "Très grande", type: "plante", region: "La Brune",
    cr: 5, ac: 13, acNote: "écorce", hd: 11, speed: { marche: 6 },
    stats: [21, 6, 18, 8, 12, 7],
    vulnerabilities: ["feu"],
    resistances: ["contondants", "perforants"],
    senses: "perception des vibrations 18 m",
    languages: "elfique ancien, qu'il ne parle plus",
    traits: [
      { name: "Immobile", text: "Tant qu'il ne bouge pas, on ne le distingue pas d'un vieux charme." },
      { name: "Fruits", text: "Des squelettes d'elfes pendent à ses branches. Chaque round, il peut en lancer un." },
    ],
    actions: [
      multi("Deux coups de branche.", { Branche: 2 }),
      hit("Branche", "contact", 8, "4,5 m", "3d6+5", "contondants"),
      hit("Lancer un pendu", "distance", 8, "18/54 m", "2d8+5", "contondants", "Le squelette se brise sur la cible et se relève à côté d'elle en Légionnaire d'os (sans le Pas cadencé)."),
    ],
    lore: "Un charme si vieux que son tronc s'est tordu en spirale. À ses branches pendent des squelettes aux bras croisés, comme des fruits. Il marche, quand personne ne regarde.",
    gmNotes: "Les elfes confient leurs morts aux arbres. Depuis le Glas, certains arbres les rendent, et celui-ci refuse de les lâcher : il les garde et s'en sert. Les elfes de la Brune paieraient cher qu'on l'abatte sans le brûler, car le feu détruit aussi les morts qu'il porte.",
    scene: "a colossal old hornbeam tree shaped like a giant walking on its roots, its grey trunk wrung into a deep corkscrew spiral, three massive roots raised like striding legs above a mossy forest floor, two long bare limbs reaching straight out sideways like outstretched arms toward the left and right edges of the painting, from the far tip of each limb hang two elf skeletons, far out in open air with wide empty mist between them and the trunk, each skeleton hangs by a short green woody stem growing out of the top of its skull, like an apple hanging from its twig, the skeletons slender and tall with long narrow elf skulls, whole bodies, legs together, feet pointing down, each one laid to rest like a stone tomb effigy, hands resting flat on the opposite shoulders so the forearms make an X across the ribcage, serene and still, ivory bone wrapped in a few strands of ivy, ancient forest of giant trunks behind, deep green gloom, mist",
  }),
  creature({
    id: "pris-dans-le-chene",
    name: "Pris-dans-le-chêne",
    family: "Morts", size: "Moyenne", type: "mort-vivant (elfe)", region: "La Brune",
    cr: 6, ac: 15, acNote: "écorce", hd: 13, speed: { marche: 9 },
    stats: [18, 14, 16, 12, 14, 10],
    vulnerabilities: ["feu"],
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: MORT_IMMUN, conditionImmunities: MORT_ETATS,
    senses: "vision dans le noir 36 m",
    languages: "elfique, ancienne langue",
    traits: [
      { name: "Passer par l'arbre", text: "Une fois par tour, il entre dans un arbre vivant et ressort d'un autre arbre à 18 m, en dépensant 1,5 m de déplacement." },
      { name: "Bras levés", text: "Il ne frappe jamais un elfe en premier." },
    ],
    actions: [
      multi("Deux griffes d'écorce.", { "Griffes d'écorce": 2 }),
      hit("Griffes d'écorce", "contact", 7, "1,5 m", "2d8+4", "tranchants"),
      save("Rendre", "Dex", 14, "Des racines jaillissent dans un rayon de 6 m. Échec : entravée (évasion DD 14). Moitié des dégâts et pas d'entrave en cas de réussite.", "4d8", "perforants", 2, "5-6"),
    ],
    lore: "Un squelette d'elfe à moitié pris dans le bois, comme dans de l'ambre, qui s'arrache du tronc fendu. Ses doigts bougent encore quand il est immobile.",
    gmNotes: "Les vieux elfes se souviennent qu'il y avait deux dieux, et leurs morts aussi. Un Pris-dans-le-chêne qu'on immobilise (entravé une minute) gratte sur l'écorce deux silhouettes identiques, l'une assise, l'autre sous elle.",
    scene: "the gnarled trunk of a colossal split oak filling the frame, an elf skeleton grown into the oak like a carved relief in the bark, its pelvis, legs and spine sealed inside the wood grain, only the ribcage, skull and arms wrenched out of the trunk, thick ridged bark and moss grown over and between the ribs, a long narrow elongated skull with high sharp cheekbones and a tapered jaw straining forward, mouth gaping, both arms jerked upward and outward in violent effort, bony fingers hooked like claws ripping chunks of bark, splinters and wood fibres stretched taut between the bones and the trunk, brown oak leaves tumbling around it, emerald green sunbeams slanting down through the forest canopy behind the oak",
  }),
  creature({
    id: "wyverne-des-ossiers",
    name: "Wyverne des Ossiers",
    family: "Monstruosités", size: "Grande", type: "dragon", region: "Les Monts Ossiers",
    cr: 6, ac: 13, acNote: "armure naturelle", hd: 13, speed: { marche: 6, vol: 24 },
    stats: [19, 10, 16, 5, 12, 6],
    skills: { Perception: 4 },
    senses: "vision dans le noir 18 m",
    languages: "—",
    traits: [
      { name: "Nid d'os", text: "Elle niche sur les pics en vertèbres et tapisse son nid d'os de bouc. Elle descend sur tout ce qui sort des bouches d'aération des ossuaires." },
    ],
    actions: [
      multi("Une morsure et un coup de dard. En vol, elle peut remplacer la morsure par ses serres.", { Morsure: 1, Dard: 1 }),
      hit("Morsure", "contact", 7, "3 m", "2d6+4", "perforants"),
      hit("Serres", "contact", 7, "1,5 m", "2d8+4", "tranchants"),
      hit("Dard", "contact", 7, "3 m", "2d6+4", "perforants", "Jet de sauvegarde de Constitution DD 14 : moitié des dégâts de poison en cas de réussite.", { damage: "7d6", damageType: "poison" }),
    ],
    lore: "Une wyverne blanc sale, de la couleur du calcaire, qui plane au-dessus des arêtes. Les nains l'appelaient la Fossoyeuse, bien avant le Glas.",
    gmNotes: "Les wyvernes mangent les ancêtres murés qui sortent par les bouches d'aération : pour les nains exilés, c'est une insulte et une bénédiction à la fois. Un nid contient des bijoux funéraires nains que leurs familles rachèteront.",
    scene: "side profile of a lean wyvern standing like a giant eagle on two scaly hind legs, its two leathery wings raised high above its back like a heraldic bird, the wings are its only forelimbs, the whole beast is chalk-white and pale grey like weathered limestone and old marble, white wing membranes with grey veins, long lizard head like a monitor lizard with a smooth bare skull and an open jaw of teeth, long whip tail arching up over its back ending in a large barbed arrowhead stinger like a scorpion sting, gripping the tip of a sharp white limestone crag notched like a row of vertebrae, a shallow nest of goat skulls with curled horns and goat bones packed under its talons, far below a steep valley of dark green larch trees and a jade-green mountain torrent, crisp clear pale blue alpine sky with thin white clouds, distant snowy peaks",
  }),
  creature({
    id: "inquisiteur-de-la-cire",
    name: "Inquisiteur de la Cire",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Le Val Cierge",
    cr: 6, ac: 18, acNote: "demi-plates, bouclier", hd: 18, speed: { marche: 9 },
    stats: [16, 12, 14, 12, 16, 14],
    saves: { Sag: 6, Cha: 5 },
    skills: { Religion: 4, Perspicacité: 6, Intimidation: 5 },
    languages: "pallénien, céleste de cour",
    traits: [
      { name: "Flair de l'hérétique", text: "Il sait quand une créature à 9 m a lancé un sort de niveau 4 ou plus depuis l'aube : la cire de son cierge pleure noir." },
      { name: "Lanceur de sorts", text: "Sagesse (DD 14). 3/jour : bénédiction, détection du mal et du bien, silence." },
    ],
    actions: [
      multi("Deux coups de masse et une flamme sacrée.", { "Masse de l'Église": 2, "Flamme sacrée": 1 }),
      hit("Masse de l'Église", "contact", 6, "1,5 m", "1d6+3", "contondants", "", { damage: "2d6", damageType: "radiants" }),
      save("Flamme sacrée", "Dex", 14, "Une créature à 18 m qu'il voit. Le couvert ne la protège pas.", "2d8", "radiants"),
      save("Cire brûlante", "Dex", 14, "Une créature à 9 m. Échec : entravée par la cire qui durcit (évasion DD 14), bouche scellée : elle ne peut plus parler ni lancer de sorts à composante verbale.", "4d6", "feu", 1, "5-6"),
    ],
    lore: "Robe blanche sur une armure noircie à la suie, un cierge allumé fixé à l'épaule. Il dit toujours la même chose avant de juger : « Rien ne se perd, tout se scelle. »",
    gmNotes: "Les inquisiteurs chassent les Peseurs, les Rendus et les clercs de Saint Ruben. Ils obéissent à Cyprien, mais certains trouvent qu'il est trop doux. L'un d'eux tient une liste de noms où figure celui d'un joueur Rendu ou Sang-Doré : le MJ choisit lequel.",
    scene: "portrait of an ordinary middle-aged human man, a stern church inquisitor with a bare shaved head, a lean weathered face, grey stubble, thin pressed lips and hard pale eyes, wearing a long plain white wool robe over sooty black iron half plate armour, dirty charcoal-black breastplate and pauldrons smudged with ash, a thick white church candle bolted upright on top of his left shoulder plate with a small flame burning beside his ear, thick black wax running down from the candle over the pauldron and dripping across the breastplate in long black streaks, his right hand in a mail glove gripping a short iron flanged mace with a heavy ribbed head, his left hand holding an open leather-bound ledger filled with handwritten names, plain brown leather boots on his feet, standing on the flagstones of a whitewashed abbey cloister with round arches at dusk, terraced vineyards on the hills behind",
  }),
  creature({
    id: "nuee-de-remontes",
    name: "Nuée de remontés",
    family: "Créatures du Dessous", size: "Grande", type: "nuée d'esprits", region: "Le Dessous",
    cr: 6, ac: 13, acNote: "", hd: 20, speed: { marche: 0, vol: 12, stationnaire: true },
    stats: [6, 16, 10, 8, 10, 18],
    resistances: ["acide", "feu", "froid", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison", "psychiques"],
    conditionImmunities: ["charmé", "effrayé", "empoigné", "empoisonné", "entravé", "épuisement", "étourdi", "à terre", "paralysé", "pétrifié"],
    senses: "vision dans le noir 36 m",
    languages: "toutes, en même temps",
    traits: [
      { name: "Nuée d'âmes", text: "Elle occupe l'espace des autres créatures et traverse les murs. Elle ne récupère pas de PV." },
      { name: "Terreur", text: "Les âmes ont vu ce qui attend en bas. Une créature qui commence son tour dans son espace entend des centaines de voix crier « Pas en bas ! »." },
    ],
    actions: [
      multi("Deux étreintes.", { "Mille mains": 2 }),
      hit("Mille mains", "contact", 6, "0 m", "3d8", "psychiques", "Une créature dans l'espace de la nuée."),
      save("Chercher un corps", "Cha", 15, "Une créature dans son espace. Échec : une âme entre en elle jusqu'à la fin de son prochain tour ; le MJ dirige ses actions, et elle supplie qu'on ne la renvoie pas.", undefined, undefined, 1, "5-6"),
    ],
    lore: "Un tourbillon de visages gris, d'enfants, de soldats, de vieilles femmes, qui s'agrippent aux vivants. Ils ne veulent pas tuer : ils veulent un corps où se cacher.",
    gmNotes: "Les âmes descendent, trouvent Gorvan qui attend derrière le sceau, et remontent terrifiées. Une créature possédée un round se souvient de ce que l'âme a vu : une immense présence qui ouvre la bouche. C'est la première image de Gorvan que les joueurs reçoivent.",
    scene: "seen from behind the shoulder of a cloaked traveller kneeling on the flagstones of a narrow stone crypt, his right fist gripping a short wooden torch wrapped in tarred rags with one small orange flame, in front of him a long jagged crack splits the floor and shines bright silver-white like molten tin, from the crack a spiralling column of pale grey translucent mist rises toward the vault, the mist shaped into many weeping human faces like faded portraits, a plump frightened child, a bearded soldier in a kettle helmet, a wrinkled grandmother in a linen wimple, a young mother, each with soft lips, full hair and tearful pleading eyes, dozens of thin misty arms stretching out of the spiral and clutching his sleeve, his cloak and his torch arm, the whole column smeared and twisted by fast circular motion, stone coffins along both walls",
  }),

  creature({
    id: "maitre-cloueur",
    name: "Maître-cloueur",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Partout",
    cr: 6, ac: 16, acNote: "cuirasse goudronnée", hd: 20, speed: { marche: 9 },
    stats: [18, 14, 14, 12, 15, 11],
    saves: { Con: 5, Sag: 5 },
    skills: { Médecine: 5, Religion: 4, Perception: 5, Intimidation: 3 },
    resistances: ["nécrotiques"],
    languages: "pallénien, argot des fossoyeurs",
    traits: [
      { name: "Fer froid", text: "Une fois par tour, quand il touche un mort-vivant, +1d4 dégâts radiants, et le mort-vivant ne peut pas utiliser « Ne tombe pas » ni se régénérer avant la fin de son prochain tour.", dpr: 2.5 },
      { name: "Huit cents compagnons", text: "Dans une ville où la Confrérie a une loge, il peut réunir 1d6 compagnons-cloueurs en une heure." },
    ],
    actions: [
      multi("Trois coups de marteau.", { "Marteau de maître": 3 }),
      hit("Marteau de maître", "contact", 7, "1,5 m", "1d8+4", "contondants"),
      hit("Clou de jet", "distance", 5, "6/18 m", "1d4+2", "perforants"),
    ],
    bonusActions: [
      save("Clouer d'un geste", "Con", 13, "Un mort-vivant à terre ou à 20 PV ou moins, à 1,5 m. Échec : il est cloué et détruit."),
    ],
    lore: "Trois encoches sur la tête du clou qu'il porte à l'oreille. Il a les mains couvertes de petites cicatrices blanches et il compte les morts en paires de talons.",
    gmNotes: "À réputation 3 avec la Confrérie, un maître-cloueur montre la carte : les Levés suivent des lignes droites qui convergent toutes sous la Rotonde. Il la garde dans la doublure de sa cuirasse. Il penche pour Hersende, protège Ysé sans le dire et déteste Cyprien.",
    scene: "a stocky old Flemish peasant gravedigger as painted by Pieter Bruegel the Elder, broad weathered red face, big fleshy nose, grey bristly hair cut short, round fleshy human ears with heavy earlobes, a long black iron nail hanging from his right earlobe like a crude earring, three small notches cut into the nail's square head, wearing a black tarred leather cuirass laced at the sides over a coarse grey wool smock, a broad leather belt with a row of long black iron nails slotted upright through loops all around his waist and a small white cloth pouch of salt tied at his hip, his right fist wrapped around the ash-wood handle of a long iron hammer with a heavy blunt square head, the hammer resting on his right shoulder, his left hand hanging at his side holding a small iron lantern with horn panes, both hands rough and crossed with many small white scars, standing in a grey fog among crooked wooden grave markers, at his feet a dead man in a linen shroud lying on his back in the mud with thick iron nails hammered through both wrists and both ankles into the earth",
  }),
  // ===== FP 7 à 10 =====
  creature({
    id: "vieille-noyee",
    name: "Vieille Noyée",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Les Noyes",
    cr: 7, ac: 14, acNote: "peau tannée, colliers de cuivre", hd: 17, speed: { marche: 6, nage: 12 },
    stats: [16, 8, 16, 12, 18, 14],
    saves: { Sag: 7, Cha: 5 },
    skills: { Religion: 4, Nature: 4, Perception: 7 },
    resistances: ["feu", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision dans le noir 36 m",
    languages: "l'ancienne langue, parler des Noyes",
    traits: [
      { name: "Servante de la Mère Tourbe", text: "Sagesse (DD 15). À volonté : brume, communication avec les morts (sans Murmure). 1/jour : croissance végétale, sur les joncs seulement." },
      { name: "Elle se souvient", text: "Elle a connu le temps où mourir était naturel, et elle le dit à qui parle l'ancienne langue." },
    ],
    actions: [
      multi("Deux coups de poing.", { Poing: 2 }),
      hit("Poing", "contact", 6, "1,5 m", "2d6+3", "contondants", "", { damage: "2d6", damageType: "nécrotiques" }),
      save("Appel de la tourbe", "For", 15, "La tourbe aspire tout dans un rayon de 9 m autour d'elle. Échec : entravée et à terre (évasion DD 15). Moitié des dégâts en cas de réussite.", "6d6", "contondants", 2, "5-6"),
    ],
    lore: "Une très vieille femme à la peau de cuir, couverte de colliers de cuivre verdis, qui sort de l'eau en s'appuyant sur une rame. Les gens des Noyes l'appellent « la vieille d'avant » et lui laissent des anguilles sur les pilotis.",
    gmNotes: "Elle était la prêtresse de la Mère Tourbe il y a neuf siècles. Elle n'est pas hostile au départ : elle veut que les Noyés redescendent et redeviennent de la terre. Si les joueurs lui promettent d'« ouvrir le chemin », elle parle de « celui qui mangeait », qui recevait les morts avant, et dit qu'il a faim depuis trop longtemps pour qu'on le laisse sortir tel quel.",
    scene: "a hunched toothless old crone of ninety, Tollund bog body come back to life, her face and arms the deep walnut brown of an old leather saddle, cracked with a thousand wrinkles, a sodden hood of coarse brown wool pulled over her head and ears, long wet dark copper-red hair spilling from the hood down over her chest, a heavy pile of green verdigris copper necklaces and torcs on her breast, she wades waist-deep out of black peat water through tall brown reeds, both knotted hands clasped on the top of one long wooden boat oar held upright beside her, its wide flat blade in the water, kind patient grandmother eyes, behind her an old wooden jetty on stilts where a dozen long black snake-like eels hang by their heads from a rope, thick grey marsh fog filling the whole background",
  }),
  creature({
    id: "wyverne-levee",
    name: "Wyverne levée",
    family: "Morts", size: "Grande", type: "mort-vivant (dragon)", region: "Les Monts Ossiers",
    cr: 7, ac: 13, acNote: "os et cuir", hd: 14, speed: { marche: 6, vol: 24 },
    stats: [20, 10, 18, 3, 10, 5],
    resistances: ["nécrotiques"],
    immunities: MORT_IMMUN, conditionImmunities: ["charmé", "effrayé", ...MORT_ETATS],
    senses: "vision dans le noir 36 m",
    languages: "—",
    traits: [
      { name: "Ailes trouées", text: "Elle ne peut pas voler plus de deux rounds de suite. Si elle tombe à moins de la moitié de ses PV, elle ne vole plus." },
      MARCHE,
    ],
    actions: [
      multi("Une morsure et un coup de dard.", { Morsure: 1, Dard: 1 }),
      hit("Morsure", "contact", 8, "3 m", "2d8+5", "perforants"),
      hit("Dard", "contact", 8, "3 m", "2d6+5", "perforants", "", { damage: "4d6", damageType: "nécrotiques" }),
      save("Souffle de charnier", "Con", 15, "Cône de 9 m d'air pourri. Moitié des dégâts en cas de réussite ; en cas d'échec, empoisonnée jusqu'à la fin de son prochain tour.", "6d8", "nécrotiques", 2, "5-6"),
    ],
    lore: "Une wyverne morte depuis des années, les ailes en lambeaux tendus sur les os. Elle vole par sauts, retombe, rampe, puis reprend son vol, toujours vers l'ouest.",
    gmNotes: "Elle suit la Marche comme un Levé, mais en sautant les montagnes. Elle passe au-dessus d'un village tous les trois jours environ : les joueurs peuvent prévoir son trajet avec la carte de la Confrérie et l'attendre.",
    scene: "the rotting corpse of a giant quetzalcoatlus pterosaur leaping off a pale limestone ridge, seen from the side, its two huge wings spread wide and high above its back like a bat, each wing a long bony arm with a single elongated finger bone, the wing membrane rotted into torn grey rags with big ragged holes showing the dark storm clouds through them, its two clawed hind feet kicking off the rock, gaunt shrunken body of dry cracked grey-brown hide split open over bare ribs, long narrow head with the front half a bare yellowed skull with an empty eye socket and the back half dried rotten hide, a long whip-thin reptile tail ending in a hooked barbed bone stinger trailing down onto the stone, heavy black storm clouds filling the whole sky, far behind on a crag a squat collapsed stump of a round dwarven stone watchtower, half its wall fallen into rubble",
  }),
  creature({
    id: "echo-de-verre",
    name: "Écho de verre",
    family: "Créatures du Dessous", size: "Grande", type: "créature artificielle", region: "Le Verre-Rouge",
    cr: 8, ac: 17, acNote: "verre fondu", hd: 15, speed: { marche: 9 },
    stats: [20, 10, 18, 3, 10, 1],
    vulnerabilities: ["contondants"],
    resistances: ["perforants et tranchants d'armes non magiques"],
    immunities: ["feu", "poison", "psychiques", "radiants"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé", "pétrifié"],
    senses: "vision aveugle 18 m",
    languages: "—",
    traits: [
      { name: "Né du chant", text: "Il se forme quand le verre chante sans vent, et se défait en sable à l'aube s'il n'a pas tué." },
      { name: "Transparent", text: "Immobile sur une plaque de verre, il est invisible. Perception DD 18 pour le repérer." },
    ],
    actions: [
      multi("Deux coups tranchants.", { "Bras de verre": 2 }),
      hit("Bras de verre", "contact", 8, "3 m", "2d10+5", "tranchants"),
      save("Chant", "Con", 15, "Chaque créature à 9 m. Moitié des dégâts en cas de réussite ; en cas d'échec, étourdie jusqu'à la fin de son prochain tour.", "5d10", "tonnerre", 2, "5-6"),
    ],
    lore: "Une silhouette de verre sombre, plus grande qu'un homme, qui se lève d'une plaque chantante. On voit le crépuscule à travers son corps, et ses gestes laissent une note dans l'air.",
    gmNotes: "Les Échos rejouent des fragments de la bataille d'Ostral et de Gorvan : chacun prend la pose d'un des deux géants de lumière. Celui qui imite Ostral attaque celui qui imite Gorvan s'ils se croisent. Les joueurs peuvent provoquer ce combat.",
    scene: "a giant figure of smoky clear glass three times the height of a man, shaped like a tall stained-glass church window come alive, its torso and legs made of large flat panes of tinted glass joined at sharp edges, the crimson dusk sky and the red setting sun on the horizon seen right through its chest like through a window pane, its head a smooth tall egg of polished glass as blank as a bottle, two very long thin arms of cut glass tapering into jagged sword-like shards that reach down to its knees, it climbs up out of a cracked black glass slab split in three pieces half sunk in red sand, wide rolling red sand dunes stretching away to the horizon under a deep crimson and mauve dusk sky, rings of sound rippling through the air around its raised arm like ripples spreading on a pond, the sand around the slab trembling in concentric rings, long violet shadows across the dunes",
  }),
  creature({
    id: "peseur-renegat",
    name: "Peseur renégat",
    family: "Humanoïdes", size: "Moyenne", type: "humanoïde (humain)", region: "Le Couronnement",
    cr: 8, ac: 15, acNote: "armure du mage ; 20 avec bouclier", hd: 24, speed: { marche: 9 },
    stats: [9, 14, 12, 20, 15, 11],
    saves: { Int: 8, Sag: 5 },
    skills: { Arcanes: 11, Histoire: 8, Investigation: 8 },
    languages: "pallénien, céleste de cour, elfique, nain",
    traits: [
      { name: "Registre", text: "Il note chaque sort qu'il lance. Chaque sort de niveau 4 ou plus qu'il lance donne 1 Murmure au MJ, comme pour un personnage." },
      { name: "Balance de laiton", text: "Il sait quand un sort de niveau 4 ou plus est lancé à 10 m de lui." },
    ],
    actions: [
      multi("Deux contrepoids.", { Contrepoids: 2 }),
      hit("Contrepoids", "distance", 8, "36 m", "4d8", "force", "Un poids de laiton spectral qui écrase la cible."),
      save("Boule de feu", "Dex", 16, "Sphère de 6 m de rayon à 45 m. Moitié des dégâts en cas de réussite.", "8d6", "feu", 2, "3/jour"),
      save("Cône de froid", "Con", 16, "Cône de 18 m. Moitié des dégâts en cas de réussite. Sort de niveau 5 : le MJ gagne 1 Murmure.", "8d8", "froid", 2, "1/jour"),
    ],
    reactions: [special("Bouclier", "+5 à la CA jusqu'au début de son prochain tour, y compris contre l'attaque qui le déclenche. 3/jour.")],
    lore: "Une balance de laiton au cou, un registre relié sous le bras, de l'encre sur les doigts. Il ne lance jamais un sort sans en noter l'heure.",
    gmNotes: "Un jeune Peseur qui travaille pour Hersende et lui conseille de « couper la tête du problème » : retirer la couronne pour voir. Il a mesuré la courbe qui descend et pense qu'un grand choc fera tout repartir. Il a tort, mais ses chiffres sont justes, et les joueurs peuvent les lui voler.",
    scene: "a gaunt bookkeeper monk of thirty with a short dark beard and a tonsured head, broad plain human face, standing on a worn stone floor in a long brick-red wool robe splattered with black ink stains, ink-blackened fingers, on his chest a small brass merchant's scale on a leather necklace, two tiny dishes on a short beam tipped sharply sideways, a thick closed brown leather account book with a blank cover clamped tight under his left armpit, his right arm thrust upward with open palm, a large square block of brass floating just above the palm, the brass block half transparent like smoke, loose parchment sheets spinning around him in a wide spiral, behind him bare red brick walls and dark oak shelves of scrolls, beeswax candles in iron holders",
  }),
  creature({
    id: "ver-des-ossiers",
    name: "Ver des Ossiers",
    family: "Monstruosités", size: "Très grande", type: "monstruosité", region: "Les Monts Ossiers",
    cr: 9, ac: 16, acNote: "anneaux calcaires", hd: 16, speed: { marche: 9, fouissement: 9 },
    stats: [22, 8, 20, 1, 8, 4],
    saves: { Con: 9 },
    senses: "perception des vibrations 18 m, vision aveugle 9 m",
    languages: "—",
    traits: [
      { name: "Creuseur de calcaire", text: "Il traverse la roche tendre et laisse derrière lui un tunnel de 3 m de diamètre." },
      { name: "Os dans la peau", text: "Il avale les ossuaires entiers. Des crânes nains sont pris dans ses anneaux et claquent quand il bouge." },
    ],
    actions: [
      multi("Une morsure et un coup d'anneaux.", { Morsure: 1, Anneaux: 1 }),
      hit("Morsure", "contact", 10, "3 m", "3d10+6", "perforants", "Une cible Moyenne ou plus petite fait un jet de sauvegarde de Dextérité DD 17 ou elle est avalée : aveuglée, entravée, 4d6 dégâts d'acide au début de chaque tour du ver. Infliger 30 dégâts en un tour depuis l'intérieur la libère."),
      hit("Anneaux", "contact", 10, "3 m", "2d10+6", "contondants", "La cible fait un jet de sauvegarde de Force DD 17 ou tombe à terre."),
    ],
    lore: "Un ver blanc gros comme une tour, qui creuse le calcaire et avale les os des ossuaires nains. Quand il passe sous une cité, on entend claquer des milliers de dents.",
    gmNotes: "Le ver a creusé jusque dans les niveaux murés. Ses tunnels relient les ossuaires entre eux, et l'un d'eux descend beaucoup plus bas que les mines, vers une chaleur qui ne vient pas de la roche. C'est un chemin possible vers le Dessous, loin d'Aube-Close.",
    scene: "a colossal pale worm with segmented limestone-white rings bursting through the wall of a dwarven ossuary, hundreds of skulls embedded in its flesh, a circular maw of grinding teeth, bones raining down, dust, torchlight from fleeing dwarves",
  }),
  creature({
    id: "bouche-de-gorvan",
    name: "Bouche de Gorvan",
    publicName: "Bouche du Dessous",
    family: "Morts", size: "Moyenne", type: "mort-vivant", region: "Partout",
    cr: 10, ac: 16, acNote: "armure naturelle", hd: 17, speed: { marche: 9 },
    stats: [18, 16, 18, 16, 16, 20],
    saves: { Dex: 7, Sag: 7, Cha: 9 },
    skills: { Perspicacité: 7, Tromperie: 9, Persuasion: 9, Perception: 7 },
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques qui ne sont pas en fer froid"],
    immunities: ["poison"],
    conditionImmunities: ["charmé", "empoisonné", "épuisement"],
    senses: "vision dans le noir 36 m",
    languages: "toutes celles que parle son interlocuteur",
    traits: [
      { name: "Régénération", text: "Il regagne 10 PV au début de son tour, sauf s'il a subi des dégâts radiants ou un coup d'arme en fer froid depuis son dernier tour." },
      { name: "La voix des vôtres", text: "Comme un Porte-Voix, avec la voix d'un mort aimé. Il connaît des détails que seul ce mort pouvait savoir." },
      { name: "Le nom", text: "Si quelqu'un prononce le nom de Gorvan à 9 m de lui, jet de sauvegarde de Charisme DD 18. Échec : neutralisé jusqu'à la fin de son prochain tour." },
    ],
    actions: [
      multi("Deux mains froides.", { "Main froide": 2 }),
      hit("Main froide", "contact", 8, "1,5 m", "2d6+4", "contondants", "", { damage: "3d6", damageType: "nécrotiques" }),
      save("Voix multiple", "Sag", 17, "Chaque créature à 9 m entend à la fois tous ses morts. Moitié des dégâts en cas de réussite ; en cas d'échec, charmée jusqu'à la fin de son prochain tour.", "6d8", "psychiques", 2, "5-6"),
      save("Suggestion", "Sag", 17, "À volonté, avec la voix d'un défunt aimé."),
    ],
    bonusActions: [special("Relever", "Un cadavre à 9 m se relève en Levé qui lui obéit.")],
    lore: "Il a l'air d'un homme fatigué et bien élevé, qui écoute plus qu'il ne parle. Puis il ouvre la bouche, et c'est votre mère qui vous appelle par votre surnom d'enfant.",
    gmNotes: "Ce sont eux qui parlent aux héritiers. L'un est assis dans le noir, en face de Hersende, pendant le siège de Clairfont. Ils ne mentent presque jamais : ils choisissent les vérités utiles. Quand on en détruit un, il dit « À bientôt », et le MJ gagne 1 Murmure.",
    scene: "a weary, kindly middle-aged man seen in three-quarter view seated on a low wooden bench at the left of the picture, turned toward an empty folding camp chair of wood and leather at the right, a single thick beeswax candle in a heavy iron dish on a small wooden crate between them, the inside of a dim canvas army tent with sagging stitched walls behind, bare trampled earth floor, his shoulder-length straight grey hair falling over his ears, ashen pale skin, a gaunt clean-shaven face, very pale washed-out grey eyes, his mouth open in speech with lips apart and lower jaw dropped as if halfway through a sentence, one hand lifted gently toward the empty chair, wearing a long hooded grey wool cloak of fine weave over a belted ankle-length grey wool cote, a thin ribbon of grey candle smoke rising and spreading into a wide translucent veil around his head, the veil of smoke swirling into several ghostly transparent faces drawn only in wisps of smoke, an old woman, a young man, a child, their features soft and see-through like breath on glass",
  }),
  // ===== FP 11 à 16 =====
  creature({
    id: "chair-du-sceau",
    name: "Chair du Sceau",
    family: "Créatures du Dessous", size: "Très grande", type: "céleste (fragment d'Ostral)", region: "Le Dessous",
    cr: 11, ac: 18, acNote: "chair dorée et basalte", hd: 18, speed: { marche: 0 },
    stats: [22, 6, 20, 10, 18, 20],
    saves: { Con: 9, Sag: 8 },
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["radiants", "poison"],
    conditionImmunities: ["à terre", "aveuglé", "charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision aveugle 36 m, ne voit rien plus loin",
    languages: "comprend le céleste de cour, ne parle pas",
    traits: [
      { name: "Enraciné", text: "Il fait partie de la paroi du puits et ne se déplace pas." },
      { name: "Chaque blessure ouvre", text: "Pour chaque tranche de 50 dégâts qu'il subit, la jauge du Sceau baisse de 1." },
      { name: "Reconnaît le sang", text: "Il n'attaque jamais un Sang-Doré, un héritier ni Ysé." },
    ],
    actions: [
      multi("Trois coups de nervure.", { Nervure: 3 }),
      hit("Nervure", "contact", 10, "6 m", "2d10+6", "radiants"),
      save("Sang doré", "Con", 17, "Il saigne une lumière dorée dans un rayon de 9 m. Moitié des dégâts en cas de réussite ; en cas d'échec, aveuglée jusqu'à la fin de son prochain tour.", "8d8", "radiants", 2, "5-6"),
    ],
    lore: "Sur les parois du puits, des nervures de chair dorée descendent dans le noir, épaisses comme des troncs, fendues par endroits. Elles se tendent vers ce qui bouge.",
    gmNotes: "C'est le corps d'Ostral prolongé dans la pierre : le sceau lui-même. Il se défend contre tout ce qui descend, sans distinguer amis et ennemis, et le combattre l'abîme. La bonne solution n'est pas de le vaincre : c'est de passer sans le blesser (Discrétion DD 17, ou un Sang-Doré en tête de file).",
    scene: "the inside of a narrow vertical well of rough black basalt columns plunging straight down into a pitch-black void, its walls overgrown by enormous cords of raw golden flesh as thick as oak trunks, wet and fibrous like exposed muscle and sinew, sunk deep into the cracks of the rock and branching across the stone like tree roots, the cords torn open in several places with molten gold pouring out of the gashes like bright blood and spattering the basalt, the nearest cords peeling away from the wall and stretching across the void toward four tiny adventurers holding torches on a narrow ledge cut into the well wall, the adventurers very small against the immense wall, warm gold against cold black",
  }),
  creature({
    id: "dent-du-mangeur",
    name: "Dent du Mangeur",
    publicName: "Dent du Dessous",
    family: "Créatures du Dessous", size: "Grande", type: "aberration", region: "Le Dessous",
    cr: 12, ac: 16, acNote: "chair compactée", hd: 22, speed: { marche: 12, escalade: 9 },
    stats: [22, 10, 20, 3, 10, 8],
    saves: { For: 10, Con: 9 },
    resistances: ["nécrotiques", "acide"],
    immunities: ["poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné"],
    senses: "vision aveugle 18 m",
    languages: "—",
    traits: [
      { name: "Faim", text: "Elle regagne des PV égaux à la moitié des dégâts de sa morsure." },
      { name: "Fait de restes", text: "Elle est faite de ce que Gorvan a mâché puis recraché : des corps à moitié digérés soudés ensemble. Un sort de communication avec les morts lancé sur elle obtient vingt réponses à la fois." },
    ],
    actions: [
      multi("Une morsure et deux coups de griffes.", { Morsure: 1, Griffes: 2 }),
      hit("Morsure", "contact", 10, "1,5 m", "5d10+6", "perforants", "Si la cible est à 0 PV, elle est avalée et ne peut pas être ramenée par retour à la vie."),
      hit("Griffes", "contact", 10, "3 m", "2d8+6", "tranchants"),
    ],
    lore: "Une gueule sur pattes, faite de corps fondus les uns dans les autres, qui grimpe les parois en tâtant. On l'entend mâcher avant de la voir.",
    gmNotes: "Les Dents montent par les fissures quand la jauge tombe sous 25. Elles sont la preuve physique que Gorvan dévore : un joueur qui en examine une (Médecine DD 15) reconnaît des morts récents, enterrés à Aube-Close le mois dernier.",
    scene: "side profile view of a huge hunched four-legged creature crawling diagonally upward across a cracked black basalt cliff face inside a deep cavern shaft, its belly pressed to the rock, its bulky body is a heap of raw pink and grey human flesh, half-dissolved naked human torsos, shoulders, buttocks and thighs melted into one another like soft wax, three or four sagging human faces with shut eyelids sunk into its wet flanks, its legs are long fused human arms with splayed fingers groping and gripping cracks in the stone, its entire front end is one gaping mouth split vertically from bottom to top, a tall narrow slit like a torn seam, edged with crooked yellowed human molars and incisors of mismatched sizes, slimy glistening flesh dripping thick mucus down the rock, thin veins of gold ore running through the black stone, deep shadows",
  }),
  creature({
    id: "connetable-d-os",
    name: "Thiébaut Mainferrée, le Connétable d'os",
    family: "Morts", size: "Moyenne", type: "mort-vivant (Grand Mort)", region: "Les Marches de Fer",
    cr: 13, ac: 20, acNote: "harnois de plates, bouclier", hd: 19, speed: { marche: 9 },
    stats: [20, 11, 20, 14, 14, 18],
    saves: { For: 10, Con: 10, Sag: 7 },
    skills: { Athlétisme: 10, Histoire: 7, Intimidation: 9 },
    resistances: ["nécrotiques"],
    immunities: MORT_IMMUN, conditionImmunities: ["effrayé", ...MORT_ETATS],
    senses: "vision dans le noir 36 m",
    languages: "ancienne langue, pallénien (avec un fort accent)",
    traits: [
      { name: "Résistance légendaire (3/jour)", text: "S'il rate un jet de sauvegarde, il peut choisir de le réussir." },
      { name: "Chef de guerre", text: "Les morts-vivants alliés à 18 m ont l'avantage aux jets de sauvegarde et ne peuvent pas être repoussés." },
    ],
    actions: [
      multi("Trois coups d'épée bâtarde.", { "Épée bâtarde": 3 }),
      hit("Épée bâtarde", "contact", 10, "1,5 m", "2d8+5", "tranchants", "", { damage: "2d8", damageType: "nécrotiques" }),
      special("Rassembler l'escorte", "Il frappe le sol du pied : 2d4 Légionnaires d'os sortent de terre à 9 m de lui. 1/jour."),
    ],
    reactions: [special("Parade", "+4 à la CA contre une attaque au contact qui le toucherait.")],
    legendary: {
      perRound: 3,
      text: "Il fait 3 actions légendaires par round, une à la fois, à la fin du tour d'une autre créature.",
      actions: [
        special("Avancer", "Il se déplace de la moitié de sa vitesse sans provoquer d'attaque d'opportunité."),
        special("Ordre", "Un mort-vivant allié qu'il voit attaque une fois avec sa réaction."),
        cost(hit("Frappe", "contact", 10, "1,5 m", "2d8+5", "tranchants", "Une attaque d'épée bâtarde.", { damage: "2d8", damageType: "nécrotiques" }), 2),
      ],
    },
    lore: "Il y a six cents ans, il commandait une des tribus qui se battaient pour la plaine. Il a refusé de poser les armes devant Ostral, et on l'a retrouvé mort dans son lit, le visage paisible. Il s'est réveillé avec le même visage.",
    gmNotes: "Grand Mort qui réclame ses terres, aujourd'hui sous le Mur des Neuf Cents. Il méprise Ostral et ne sait rien de Gorvan. Il peut se rallier à Hersende si elle lui rend une colline (il respecte les gens qui tiennent un mur), ou à Gorvan si un Porte-Voix lui parle avec la voix de sa femme. Les joueurs peuvent arriver avant l'un ou l'autre.",
    scene: "full length figure seen from head to boots in the middle distance, a broad-shouldered human warlord standing tall on a purple heather moor, short cropped grey hair, round human ears, ashen grey skin, his calm face carved like a stone tomb effigy with eyelids shut, polished bronze breastplate over dark iron plate armour on arms and legs, a ragged wolf-fur cloak hanging in torn strips, a round bronze shield strapped to his left forearm, his right gauntlet resting on the pommel of one long bastard sword driven point-first into the earth beside his boot, on either side of him two man-sized skeleton soldiers in rusted iron helmets and torn mail shirts heaving themselves waist-deep up out of the broken black soil, bony hands gripping the heather, behind them a heaving sky of black thunderclouds above a flat moor, a few small crows high in the clouds",
  }),
  creature({
    id: "langue-de-gorvan",
    name: "Langue de Gorvan",
    publicName: "Langue du Dessous",
    family: "Créatures du Dessous", size: "Très grande", type: "aberration", region: "Le Dessous",
    cr: 14, ac: 17, acNote: "armure naturelle", hd: 22, speed: { marche: 6, escalade: 6 },
    stats: [24, 10, 20, 14, 16, 22],
    saves: { Con: 10, Sag: 8, Cha: 11 },
    skills: { Tromperie: 11, Perspicacité: 8 },
    resistances: ["nécrotiques", "psychiques"],
    immunities: ["poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "à terre"],
    senses: "vision aveugle 36 m",
    languages: "toutes",
    traits: [
      { name: "Elle goûte", text: "Une créature qu'elle empoigne lui apprend un souvenir : le MJ peut poser une question au joueur, qui doit répondre franchement." },
      { name: "Mensonge à volonté", text: "Elle lance suggestion à volonté (DD 19), avec la voix d'un mort aimé." },
    ],
    actions: [
      multi("Deux coups de fouet, puis Goûter une créature empoignée.", { Fouet: 2, Goûter: 1 }),
      hit("Fouet", "contact", 12, "6 m", "3d10+7", "contondants", "La cible est empoignée (évasion DD 19)."),
      save("Goûter", "Sag", 19, "Une créature qu'elle empoigne. Moitié des dégâts en cas de réussite.", "6d10", "psychiques"),
    ],
    lore: "Une langue grise et humide, longue comme une rue, qui sort d'une fissure et tâte les murs. Elle parle avec la voix de vos morts, très doucement, très près.",
    gmNotes: "Gorvan pousse cette chose par les fissures pour goûter le monde : elle ramène des souvenirs, des noms, des secrets, qui lui servent ensuite dans les voix des Porte-Voix. Ce que la Langue apprend d'un joueur, Gorvan le sait. Le MJ peut le rejouer plus tard.",
    scene: "close view at floor level inside a small round marble chapel, in the foreground a wide jagged black crack splits the white marble floor and the thick root of one giant human tongue heaves up out of it, the root plunging straight down into the black depth of the crack, ash-grey tongue flesh exactly like a real human tongue in an anatomy book, smooth, soft and swollen, slick with saliva, one deep central furrow along its whole length, fine pale papillae speckling its upper surface, the tongue rises in one long unbroken sweep, coils once around a thick marble column, and its broad flat spatula-shaped tip presses wetly against the cheek and chest of a peasant man in a brown wool tunic who kneels pinned at the foot of the column, both his hands gripping the column, his head turned aside, his eyes shut, toppled iron candlesticks, scattered candles and smooth flat puddles of spilled white wax on the cracked floor, a few small candle flames, faint gold falling from the high dome, close, intimate and uneasy mood",
  }),
  creature({
    id: "roi-des-noyes",
    name: "Le Roi des Noyes",
    family: "Morts", size: "Moyenne", type: "mort-vivant (Grand Mort)", region: "Les Noyes",
    cr: 15, ac: 18, acNote: "cotte de fer des marais, bouclier de chêne", hd: 22, speed: { marche: 9, nage: 12 },
    stats: [20, 10, 20, 14, 18, 18],
    saves: { Con: 10, Sag: 9, Cha: 9 },
    skills: { Histoire: 7, Perception: 9 },
    resistances: ["feu", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision dans le noir 36 m",
    languages: "l'ancienne langue",
    traits: [
      { name: "La cour sous l'eau", text: "Tant qu'il est dans les Noyes, 2d6 Noyés de sa cour le suivent à distance et le rejoignent en 1d4 rounds s'il les appelle." },
      { name: "Couronne de fer des marais", text: "Il porte une couronne de fer brut, plus ancienne que celle d'Ostral. Il ne l'a jamais enlevée et ne la donnera à personne." },
    ],
    actions: [
      multi("Trois coups de sceptre.", { "Sceptre de tourbe": 3 }),
      hit("Sceptre de tourbe", "contact", 10, "1,5 m", "3d6+5", "contondants", "", { damage: "3d8", damageType: "nécrotiques" }),
      save("Jugement d'avant", "Sag", 17, "Une créature à 18 m qui l'entend. Échec : elle tombe à genoux, à terre, et ne peut pas se relever avant la fin de son prochain tour.", undefined, undefined, 1, "5-6"),
    ],
    bonusActions: [special("Appel de la cour", "1d4 Noyés sortent de l'eau à 9 m de lui. 1/jour.")],
    lore: "Un roi d'avant l'Empire, enterré dans la tourbe avec sa cour il y a mille ans. Il se tient debout dans l'eau jusqu'à la taille, la couronne de fer sur la tête, tourné vers l'est.",
    gmNotes: "Il a vu Ostral arriver dans la plaine et il a plié le genou, un des premiers. Il sait qu'il y avait deux frères et que l'un « a mangé ». Il veut une seule chose : que son peuple puisse redescendre. Il peut devenir un allié décisif de fin de campagne, ou se rallier au Mangeur si on lui promet que les Noyés pourront enfin partir.",
    scene: "a thousand-year-old human king preserved in a peat bog like the Tollund Man, seen in three-quarter view turned toward the left of the picture, a gaunt old man's face with sunken cheeks, closed lips and leathery reddish-brown tanned skin, long matted black hair hanging over the sides of his head down to his shoulders, a heavy crude band of black hammered iron on his brow as a crown, a rusted iron mail coat, standing waist-deep in dark brown peat water, his right hand gripping a short carved sceptre of black bog oak reaching to his chest, his left forearm bearing a round oak shield, behind him a few bareheaded bog men and women with shrunken brown human faces and matted hair standing silently among tall reeds, all of them turned toward the left, the whole sky a flat even sheet of pale grey mist above the reeds",
  }),
  creature({
    id: "geant-fige",
    name: "Géant figé du Verre",
    family: "Créatures du Dessous", size: "Gigantesque", type: "céleste déchu", region: "Le Verre-Rouge",
    cr: 16, ac: 18, acNote: "peau de verre", hd: 18, speed: { marche: 12 },
    stats: [27, 8, 22, 10, 14, 16],
    saves: { For: 13, Con: 11, Sag: 7 },
    vulnerabilities: ["tonnerre"],
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["feu", "radiants"],
    conditionImmunities: ["charmé", "effrayé", "épuisement", "pétrifié"],
    senses: "vision parfaite 36 m",
    languages: "céleste ancien",
    traits: [
      { name: "Réveil lent", text: "Les deux premiers rounds, il a le désavantage aux attaques : il se dégage du verre." },
      { name: "Fragile", text: "Un coup critique contre lui ouvre une fêlure : +2d10 dégâts pour toutes les attaques suivantes contre lui jusqu'à la fin du combat." },
    ],
    actions: [
      multi("Deux coups de poing.", { "Poing de verre": 2 }),
      hit("Poing de verre", "contact", 13, "4,5 m", "4d10+8", "contondants"),
      save("Lumière morte", "Dex", 19, "Cône de 18 m de lumière blanche sans chaleur. Moitié des dégâts en cas de réussite.", "12d8", "radiants", 2, "5-6"),
    ],
    lore: "Sous le verre du désert, on voit des formes immenses figées, comme des insectes dans la glace. Certaines nuits, l'une d'elles bouge un doigt.",
    gmNotes: "Les géants de lumière étaient les serviteurs de Gorvan lors de la bataille du Verre-Rouge. Ostral les a fondus dans le sable. Quand la jauge du Sceau tombe sous 25, ils se réveillent un par un et marchent vers le nord. Un géant réveillé connaît le vrai nom de son maître et le crie en marchant.",
    scene: "a colossal humanoid giant filling the upper two thirds of the picture, its whole body made of translucent smoky obsidian glass like a huge cracked bottle, broad glass shoulders, a smooth bald glass head with a single enormous round eye half opened in the middle of its face, its torso and arms seamed with jagged bright white cracks, icy white brilliance trapped inside the glass shining through every crack, its legs and hips still sunk in a vast flat sheet of black glass that covers the dusky red sand, both long glass arms wrenched free, one huge clenched glass fist slammed down on the black sheet, the sheet splintering into a web of cracks around the fist, large black glass shards hurled up into the air around the giant, at the bottom of the picture a tiny caravan of six camels and robed travellers running away toward the viewer, each traveller holding a small brass hand lantern with a warm orange flame, the travellers tiny next to the giant's fist, a dark blue night sky full of small stars above the desert",
  }),
  // ===== FP 17 à 20 =====
  creature({
    id: "reine-sous-le-sel",
    name: "Amarante, la Reine sous le Sel",
    family: "Morts", size: "Moyenne", type: "mort-vivant (Grand Mort)", region: "La Côte des Sels",
    cr: 17, ac: 17, acNote: "sel cristallisé", hd: 24, speed: { marche: 9 },
    stats: [10, 14, 18, 22, 18, 20],
    saves: { Con: 10, Int: 12, Sag: 10 },
    skills: { Arcanes: 18, Histoire: 12, Perspicacité: 10 },
    resistances: ["froid", "foudre", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision parfaite 36 m",
    languages: "ancienne langue, céleste ancien, pallénien",
    traits: [
      { name: "Résistance légendaire (3/jour)", text: "Si elle rate un jet de sauvegarde, elle peut choisir de le réussir." },
      { name: "Le sel est à moi", text: "Le sel ne la gêne pas : au contraire, chaque poignée de sel à 9 m lui obéit. Le sel bénit de la Hanse ne fonctionne pas sur les morts qu'elle a relevés." },
      { name: "Lanceuse de sorts", text: "Intelligence (DD 20). À volonté : main du mage, message. 3/jour : contresort, mur de force, nuage mortel. 1/jour : flétrissement." },
    ],
    actions: [
      multi("Deux touchers de sel.", { "Toucher de sel": 2 }),
      hit("Toucher de sel", "contact", 12, "1,5 m", "4d10", "nécrotiques", "La cible se dessèche : elle a le désavantage aux jets de sauvegarde de Constitution jusqu'à la fin de son prochain tour."),
      save("Déshydrater", "Con", 20, "Une créature à 18 m. Moitié des dégâts en cas de réussite.", "10d10", "nécrotiques", 1, "3/jour"),
      save("Tempête de sel", "Dex", 20, "Rayon de 12 m autour d'elle. Moitié des dégâts en cas de réussite ; en cas d'échec, aveuglée jusqu'à la fin de son prochain tour.", "14d6", "tranchants", 2, "5-6"),
    ],
    legendary: {
      perRound: 3,
      text: "Elle fait 3 actions légendaires par round, une à la fois, à la fin du tour d'une autre créature.",
      actions: [
        hit("Toucher de sel", "contact", 12, "1,5 m", "4d10", "nécrotiques", "Un toucher de sel."),
        special("Pas de sel", "Elle se téléporte dans un tas de sel à 18 m."),
        cost(special("Relever les sauniers", "Tous les Morts des salines à 36 m se déplacent et attaquent avec leur réaction."), 2),
      ],
    },
    lore: "La plus grande pyramide de sel de la Côte n'a jamais été entamée : les sauniers disent qu'elle porte malheur. Dedans, assise, il y a une reine embaumée au sel il y a huit cents ans, et elle a ouvert les yeux.",
    gmNotes: "Amarante régnait sur la Côte avant l'Empire et embaumait ses morts au sel pour qu'ils travaillent après la mort : la Hanse a retrouvé sa méthode sans le savoir. Elle explique pourquoi le sel ne marche pas sur tous les morts. Elle veut récupérer ses salines et ses sujets, et elle négocie avec la Hanse comme d'égale à égale. Elle se fiche des deux dieux : elle a survécu aux deux.",
    scene: "the withered mummy of an ancient queen seated alone and upright on a plain cube of rough white salt, a slender female mummy of human size, dark brown leathery skin shrunk tight over her skull and cheekbones, a small shrunken nose, thin dry lips pressed shut, a neck of dry tendons, her eyes wide open with pale glassy grey irises staring calmly at the viewer, thick crusts of sparkling white salt crystals growing over her brow, cheeks, collarbones, shoulders and forearms, a long faded crimson burial gown stiff with white salt crystals falling straight to the floor and hiding her feet, a thin circlet of jagged white salt crystals on her head, her right hand held up at shoulder height with withered fingers spread and a small whirl of loose white salt grains spinning above the palm, her left hand resting flat on her knee, behind her the sloping white salt walls of a hollow pyramid chamber meeting in shadow overhead, two thin bright cracks in the walls, broken iron chains lying in coils on the white salt floor",
  }),
  creature({
    id: "main-de-gorvan",
    name: "Main de Gorvan",
    publicName: "Main du Dessous",
    family: "Créatures du Dessous", size: "Gigantesque", type: "aberration (fragment de dieu)", region: "Le Couronnement",
    cr: 18, ac: 19, acNote: "armure naturelle", hd: 18, speed: { marche: 0 },
    stats: [28, 10, 24, 8, 14, 22],
    saves: { For: 15, Con: 13, Cha: 12 },
    resistances: ["radiants", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison", "psychiques"],
    conditionImmunities: ["aveuglé", "charmé", "effrayé", "empoisonné", "épuisement", "à terre", "paralysé"],
    senses: "vision aveugle 36 m",
    languages: "toutes, par la bouche de ses doigts",
    traits: [
      { name: "Sortie du puits", text: "Elle sort par le sol de la Rotonde et ne quitte pas son trou. Elle atteint tout à 9 m du bord." },
      { name: "Cinq bouches", text: "Chaque doigt a une bouche qui parle avec la voix d'un mort aimé d'un des joueurs. Les joueurs ont le désavantage aux jets de concentration à 9 m d'elle." },
      { name: "La couronne", text: "Elle cherche la couronne. Si une créature la tient ou la porte à portée, la Main ne vise qu'elle." },
    ],
    actions: [
      multi("Deux coups de doigt, puis Serrer une créature empoignée.", { Doigt: 2, Serrer: 1 }),
      hit("Doigt", "contact", 15, "9 m", "4d12+9", "contondants", "La cible est empoignée (évasion DD 23). La Main peut tenir deux créatures."),
      save("Serrer", "For", 23, "Une créature qu'elle empoigne. Moitié des dégâts en cas de réussite.", "4d10+9", "contondants"),
    ],
    lore: "Le sol de la Rotonde s'ouvre et une main sort, grise, de la taille d'une maison. Chaque doigt a une bouche. Toutes parlent en même temps, avec des voix que vous connaissez.",
    gmNotes: "Elle sort quand la jauge du Sceau tombe sous 10, ou à la seconde où la couronne quitte la tête du mort. Ce n'est pas Gorvan, seulement ce qu'il arrive à faire passer par la fissure. Si elle saisit la couronne, la jauge tombe à 0. La détruire fait remonter la jauge de 5 et le dieu se tait pour une nuit.",
    scene: "one colossal ash-grey human right hand the size of a house, anatomically normal like a giant statue cast from a real man's hand, one thumb jutting out to the left side and four fingers side by side (index, middle, ring, and a shorter little finger), wrist rising out of a jagged hole in the cracked marble floor of a dark domed rotunda, palm facing the viewer, the five fingers spread and bent toward us, the tip of every finger and of the thumb split open into a small human mouth with pale grey lips and teeth, five open whispering mouths in a row, cadaverous ash-grey skin with dark veins, thick rivers of white melted wax creeping across the marble and spilling over the broken edge down into the hole, far behind the hand, small but clear, a mummified dead emperor with shrunken grey skin tight over his skull, empty eye sockets, a gold crown on his head, slumped on a tall carved stone throne, one narrow shaft of pale sky falling from the round opening at the top of the dome",
  }),
  creature({
    id: "gorvan-fragment",
    name: "Gorvan, le Frère du Dessous (fragment)",
    publicName: "Ce qui attend en bas",
    family: "Créatures du Dessous", size: "Grande", type: "fiélon (fragment de dieu)", region: "Le Dessous",
    cr: 20, ac: 20, acNote: "armure naturelle", hd: 25, speed: { marche: 12, vol: 12, stationnaire: true },
    stats: [22, 16, 24, 22, 20, 28],
    saves: { Dex: 9, Con: 13, Sag: 11, Cha: 15 },
    skills: { Perspicacité: 11, Persuasion: 15, Tromperie: 15, Perception: 11 },
    resistances: ["radiants", "froid", "feu", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["nécrotiques", "poison", "psychiques"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé"],
    senses: "vision parfaite 36 m",
    languages: "toutes",
    traits: [
      { name: "Résistance légendaire (3/jour)", text: "S'il rate un jet de sauvegarde, il peut choisir de le réussir." },
      { name: "Recevoir les morts", text: "Toute créature qui meurt à 36 m de lui est avalée : elle ne peut pas revenir, sauf par souhait ou si on détruit ce fragment dans l'heure." },
      { name: "Son nom", text: "La première fois de chaque round qu'une créature prononce « Gorvan » à voix haute, il perd sa réaction et ne peut plus faire d'action légendaire avant la fin du round." },
      { name: "Il n'a pas tort", text: "Il dit qu'Ostral a volé six siècles à l'ordre des choses. Un personnage qui l'écoute une minute fait un jet de sauvegarde de Sagesse DD 23 ou il doute : désavantage aux attaques contre lui jusqu'à la fin du combat." },
    ],
    actions: [
      multi("Trois touchers qui digèrent.", { "Toucher qui digère": 3 }),
      hit("Toucher qui digère", "contact", 12, "3 m", "3d10+6", "nécrotiques", "Les PV maximum de la cible baissent du même montant jusqu'au prochain repos long."),
      save("Bouchée", "Con", 21, "Il ouvre la bouche, et c'est un puits : cône de 18 m. Moitié des dégâts en cas de réussite. Une créature réduite à 0 PV est avalée.", "12d10", "nécrotiques", 2, "5-6"),
    ],
    legendary: {
      perRound: 3,
      text: "Il fait 3 actions légendaires par round, une à la fois, à la fin du tour d'une autre créature.",
      actions: [
        save("Voix", "Sag", 23, "Une créature qui l'entend. Échec : elle obéit à une suggestion d'un mot, dite avec la voix d'un mort aimé."),
        special("Glisser", "Il se déplace de toute sa vitesse sans provoquer d'attaque d'opportunité."),
        cost(hit("Mordre", "contact", 12, "3 m", "4d10+6", "nécrotiques", "Une créature à 0 PV ainsi mordue est avalée."), 2),
      ],
    },
    lore: "Il a le visage d'Ostral. Le même, exactement, mais la peau de la couleur de la pâte crue et les yeux gris clair. Il sourit, il est drôle, il vous appelle par votre prénom. Derrière lui, la bouche du puits respire.",
    gmNotes: "Un fragment, pas le dieu entier : ce que Gorvan arrive à faire tenir hors du sceau quand la jauge tombe à 0 ou quand les joueurs descendent jusqu'à lui. Il préfère négocier : il propose d'épargner les proches des joueurs, et il tient parole. Le vaincre referme le puits un an. Pour une table de niveau 20 bien équipée, ajoutez-lui 100 PV et une troisième attaque de Bouchée par jour.",
    scene: "a giant regal man seated upright on a massive cracked black basalt throne, the throne hovering in empty air above the round black mouth of a bottomless stone well, seen from below, his bare feet hanging over the void, the proud marble-bust face of a Roman emperor, high cheekbones, straight nose, firm jaw, short cropped grey hair, round human ears, clean-shaven, skin chalky and bloodless like unbaked bread dough, ash-white face and hands with grey lips, wide pale silver-grey eyes like clouded glass, a gracious charming smile of a host greeting old friends, one open hand extended toward the viewer in invitation, draped in a simple undyed wool toga hanging in long folds from one shoulder, torn ribbons of golden flesh like ripped veins drifting in the air around the throne, deep in the black well a few faint pale human faces, cold grey mist breathing up out of the well and catching on his face from beneath, the rest of the scene black",
  }),
  creature({
    id: "ostral-le-dieu-mort",
    name: "Ostral, le Dieu-Empereur mort",
    family: "Morts", size: "Moyenne", type: "mort-vivant (dieu)", region: "Le Couronnement",
    cr: 20, ac: 21, acNote: "cire et fer", hd: 26, speed: { marche: 9 },
    stats: [24, 14, 26, 20, 24, 28],
    saves: { For: 13, Con: 14, Sag: 13, Cha: 15 },
    skills: { Histoire: 11, Perspicacité: 13, Intimidation: 15 },
    resistances: ["nécrotiques", "contondants, perforants et tranchants d'armes non magiques"],
    immunities: ["poison", "radiants"],
    conditionImmunities: ["charmé", "effrayé", "empoisonné", "épuisement", "paralysé", "pétrifié"],
    senses: "vision parfaite 36 m",
    languages: "toutes",
    traits: [
      { name: "Résistance légendaire (3/jour)", text: "S'il rate un jet de sauvegarde, il peut choisir de le réussir." },
      { name: "Le couvercle", text: "Tant que la couronne de fer est sur sa tête, il ne se lève pas. Il se lève seulement si quelqu'un l'ôte, et il se bat pour la reprendre." },
      { name: "Neuf cents articles", text: "Il récite le Code à voix haute, un article par round, dans l'ordre. Un juge ou un Copiste peut lui répondre par l'article suivant (Histoire DD 20, action) : il s'arrête une seconde, et toutes ses attaques ont le désavantage jusqu'à la fin de son prochain tour." },
    ],
    actions: [
      multi("Deux coups de la Main du Code.", { "Main du Code": 2 }),
      hit("Main du Code", "contact", 13, "1,5 m", "3d8+7", "contondants", "", { damage: "3d8", damageType: "radiants" }),
      special("Reprendre la couronne", "Il arrache la couronne à une créature à 1,5 m qui la tient (jet opposé de Force contre son Athlétisme, avec l'avantage pour lui). S'il la remet sur sa tête, il se rassoit et redevient le sceau."),
    ],
    legendary: {
      perRound: 3,
      text: "Il fait 3 actions légendaires par round, une à la fois, à la fin du tour d'une autre créature.",
      actions: [
        special("Avancer", "Il se déplace de la moitié de sa vitesse, la cire craquant sous ses pas."),
        cost(save("Article premier : « Ici. »", "Sag", 21, "Chaque créature à 9 m. Moitié des dégâts en cas de réussite ; en cas d'échec, elle est à terre et ne peut pas se déplacer avant la fin de son prochain tour.", "4d10", "radiants", 2), 2),
        cost(special("Garde", "Jusqu'au début de son prochain tour, toute créature qui s'approche à 1,5 m de lui subit 2d10 dégâts radiants."), 2),
      ],
    },
    lore: "Le Dieu-Empereur assis dans la pénombre de la Rotonde, les yeux ouverts, enfoncé jusqu'aux genoux dans la cire. Sa peau a la couleur du pain cuit. Il ne pourrit pas.",
    gmNotes: "En option, pour une fin de campagne où quelqu'un ôte la couronne. Le corps se lève, couvert de cire, et ne veut qu'une chose : remettre la couronne sur sa tête et se rasseoir. Il n'est pas un ennemi, il est le sceau qui se défend ; s'il réussit, la jauge revient à 10. Variante plus noire : si Gorvan est déjà dehors, il se glisse dans le corps de son frère, les yeux d'Ostral deviennent gris clair, et la fiche reste la même avec les traits de Gorvan en plus.",
    scene: "an embalmed emperor preserved like a funeral effigy, beardless, smooth whole flesh the golden-brown of baked bread crust, face slack and expressionless as a waxwork mannequin, eyes wide open, dull and glassy like a doll's eyes, unblinking fixed stare, a plain band of black iron as a crown slipped sideways over one temple, a faded umber robe stiff with drips of wax, his body leaning forward as he pushes himself up from a heavy throne cut from rough grey granite blocks, his knees and shins sealed inside a great hill of melted white candle wax, centuries of layered drips and frozen runs like pale stalactites, the hill studded with stubby half-burnt candle stumps with short charred black wicks, long jagged cracks splitting the wax around his knees, flakes of wax falling, a vast circular hall of dark stone columns fading into deep shadow, a soft slanting dusty ray falling from high above out of frame across his face and shoulders",
  }),
];

/** Toutes les créatures de tous les mondes ; creaturesFor(genre) pour un seul. */
export const BESTIARY: Creature[] = [...CREATURES_AUBRETERRE, ...BESTIAIRE_ARCHIPEL];

/** Créatures d'un genre (pour l'instant, seul le monde fantasy d'Aubreterre en a). */
export function creaturesFor(genre: GenreId): Creature[] {
  return BESTIARY.filter((c) => c.genre === genre);
}

function describeAttack(a: CreatureAction): string {
  if (a.attack) {
    const x = a.attack;
    const extra = x.extra ? ` + ${x.extra.damage} ${x.extra.damageType}` : "";
    return `${a.name} (${x.toHit >= 0 ? "+" : ""}${x.toHit}, ${x.damage} ${x.damageType}${extra})`;
  }
  if (a.save?.damage) return `${a.name} (JS ${a.save.stat} DD ${a.save.dc}, ${a.save.damage} ${a.save.damageType})`;
  return a.name;
}

/** Résumé de l'attaque principale, pour une ligne de rencontre. */
export function attackSummary(c: Creature): string {
  const byName = new Map(c.actions.map((a) => [a.name, a]));
  const m = c.actions.find((a) => a.multiattack);
  if (m) {
    return Object.entries(m.multiattack!)
      .map(([n, k]) => `${k > 1 ? `${k} × ` : ""}${describeAttack(byName.get(n) ?? { name: n, text: "" })}`)
      .join(" + ");
  }
  const first = c.actions.find((a) => a.attack || a.save?.damage);
  return first ? describeAttack(first) : c.actions[0]?.name ?? "—";
}

/**
 * Ligne d'ennemi au format de `Encounter["enemies"]`.
 * Le danger dépend du FP, rapporté au niveau du groupe s'il est donné.
 */
/** Nom d'un pion tel que le voit un joueur : le nom public remplace le vrai nom de la créature. */
/** Nom de fichier des illustrations d'une créature (pion, carte) : le nom public quand le vrai nom trahit un secret,
 * puisque l'adresse de l'image arrive chez les joueurs. scripts/vignettes-figurines.mjs nomme les fichiers pareil. */
export function fichierCreature(c: Creature): string {
  if (!c.publicName) return c.id;
  return c.publicName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Mondes dont les créatures ont leurs peintures (vignettes et cartes, faites par scripts/vignettes-figurines.mjs). */
export const MONDES_PEINTS = new Set<GenreId>(["fantasy", "science-fiction"]);

/** Figurine peinte d'une créature, ou rien. */
export function pionDeCreature(creatureId?: string): string | undefined {
  const c = creatureId ? BESTIARY.find((x) => x.id === creatureId) : undefined;
  return c && MONDES_PEINTS.has(c.genre) ? `/pions/${fichierCreature(c)}.webp` : undefined;
}

export function nomVuParLesJoueurs(nom: string, creatureId?: string): string {
  const c = creatureId ? BESTIARY.find((x) => x.id === creatureId) : undefined;
  return c?.publicName ? nom.split(c.name).join(c.publicName) : nom;
}

export function toEncounterEnemy(c: Creature, count: number, partyLevel?: number): Encounter["enemies"][number] {
  const ratio = partyLevel ? c.cr / partyLevel : undefined;
  const danger =
    ratio !== undefined
      ? ratio < 0.5 ? "Faible" : ratio <= 1 ? "Moyen" : "Élevé"
      : c.cr <= 1 ? "Faible" : c.cr <= 6 ? "Moyen" : "Élevé";
  return {
    name: c.name,
    count: Math.max(1, Math.round(count)),
    hp: c.hp,
    ac: c.ac,
    attack: `FP ${crLabel(c.cr)} — ${attackSummary(c)}`,
    danger,
  };
}

/** Graine fixe d'illustration, tirée de l'id (FNV-1a), pour relancer un lot à l'identique. */
export function illustrationSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
