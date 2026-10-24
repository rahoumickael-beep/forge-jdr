// Fabrication des fiches de créatures, commune à tous les mondes : PV, PX, sens, prompt d'illustration.
// Les bestiaires (bestiary.ts pour Aubreterre, archipel-bestiaire.ts pour l'Archipel) s'en servent ;
// bestiary.ts réunit le tout dans BESTIARY.
import { stylePeinture } from "./charte";
import type { Attack, Creature, CreatureAction, Family, Size, Stat } from "./bestiary";
import type { GenreId } from "./types";

/** Chaque famille a sa lumière : on reconnaît la famille d'une créature au premier coup d'œil. */
export const LUMIERE_FAMILLE: Record<Family, string> = {
  // Aubreterre
  Bêtes: "late afternoon natural light, ochre and moss green tones",
  Morts: "cold silver-grey light, grey-green tones, low ground mist",
  Humanoïdes: "torchlight and candlelight, warm browns and dried blood red",
  Monstruosités: "stormy sky, hard contrast, slate and rust tones",
  "Créatures du Dessous": "near darkness, a single pale cold light rising from below",
  // L'Archipel
  "Faune des mondes": "warm amber light of an alien sun, ochre and teal tones",
  Équipages: "harsh white deck lights and orange warning lamps, steel blue and rust tones",
  Machines: "cold blue indicator lights and sparks, gunmetal and amber tones",
  "Choses des Routes": "pale shimmering light from nowhere, deep violet and silver tones",
  // La Ternelande
  "Bêtes d'hiver": "flat white winter daylight and snow glare, grey-blue tones",
  "Gens de la Dîme": "torch and lantern light in falling snow, soot black and dried blood red",
  "Choses de la terre": "dim grey light seeping up from the frozen ground, bone and lichen tones",
  Reflets: "cold blue light filtered through thick ice, grey and drowned green tones",
  // La Résidence
  "Bêtes de la ville": "sodium orange streetlight through drizzle and steam, wet asphalt and rust tones",
  "Gens du Bail": "neon magenta and cyan reflections in falling rain, wet concrete and yellow armband tones",
  "Drones et automates": "cold white scanner beams cutting through rain mist, gunmetal and indicator green tones",
  Cousus: "sickly green clinic glow and flickering red warning lamps, pale skin and chrome tones",
  // La Côte des Noyés
  "Bêtes de la côte": "grey dawn mist over the tidal flats, wet shingle and seaweed tones",
  "Gens de 1923": "paraffin lamp and lighthouse lantern in rain, sepia and tarred wool tones",
  "Ce que rend la mer": "flat pre-dawn grey light on wet sand, drowned pallor and cold silver tones",
  "La Fosse": "faint green light seen from underwater, murk and drifting silt tones",
};

/** Préfixe des prompts d'illustration d'une famille, tiré de la charte du genre (shared/charte.ts). */
export const illustrationStyle = (family: Family, genre: GenreId = "fantasy") => stylePeinture(genre, "creature", LUMIERE_FAMILLE[family]);

/** Retire d'une scène les morceaux qui imposent leur propre lumière (la famille décide). */
export const sansLumiere = (scene: string) =>
  scene
    .split(", ")
    .filter((part, i) => i === 0 || !/\b(light|lit|backlight|backlit|overcast|moonlight|sunlight|glow)\b/i.test(part))
    .join(", ")
    .replace(/ (at|in the|under the) (dawn|dusk|sunset|sunrise|noon|midday|night)\b/gi, "");

const XP_BY_CR: Record<string, number> = {
  "0": 10, "0.125": 25, "0.25": 50, "0.5": 100, "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000,
  "14": 11500, "15": 13000, "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000,
  "28": 120000, "29": 135000, "30": 155000,
};

export function xpForCr(cr: number): number {
  return XP_BY_CR[String(cr)] ?? 0;
}

export const modOf = (v: number) => Math.floor((v - 10) / 2);

const HIT_DIE: Record<Size, number> = { "Très petite": 4, Petite: 6, Moyenne: 8, Grande: 10, "Très grande": 12, Gigantesque: 20 };

export type CreatureInput = Omit<Creature, "genre" | "xp" | "hp" | "hpDice" | "illustration" | "senses"> & {
  /** Nombre de dés de vie ; le dé dépend de la taille, le bonus de la Constitution. */
  hd: number;
  /** Sens sans la Perception passive, ajoutée automatiquement. */
  senses?: string;
  /** Description de la planche, en anglais, sans le préfixe de style. */
  scene: string;
};

/** Une fiche complète à partir de l'essentiel : PV, PX, Perception passive et prompt sont calculés. */
export function fabriquerCreature(genre: GenreId, input: CreatureInput): Creature {
  const { hd, scene, senses, ...rest } = input;
  const die = HIT_DIE[input.size];
  const bonus = hd * modOf(input.stats[2]);
  const hp = Math.floor((hd * (die + 1)) / 2) + bonus;
  const passive = 10 + (input.skills?.Perception ?? modOf(input.stats[4]));
  return {
    ...rest,
    genre,
    xp: xpForCr(input.cr),
    hp,
    hpDice: `${hd}d${die}${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ""}`,
    senses: `${senses ? `${senses}, ` : ""}Perception passive ${passive}`,
    illustration: `${illustrationStyle(input.family, genre)}, ${sansLumiere(scene)}`,
  };
}

// Raccourcis d'écriture
export const hit = (name: string, kind: Attack["kind"], toHit: number, reach: string, damage: string, damageType: string, text = "", extra?: Attack["extra"]): CreatureAction => ({
  name,
  text,
  attack: { kind, toHit, reach, damage, damageType, ...(extra ? { extra } : {}) },
});
export const save = (name: string, stat: Stat, dc: number, text: string, damage?: string, damageType?: string, targets = 1, recharge?: string): CreatureAction => ({
  name,
  text,
  save: { stat, dc, ...(damage ? { damage, damageType, targets } : {}) },
  ...(recharge ? { recharge } : {}),
});
export const multi = (text: string, multiattack: Record<string, number>): CreatureAction => ({ name: "Attaques multiples", text, multiattack });
export const special = (name: string, text: string, recharge?: string): CreatureAction => ({ name, text, ...(recharge ? { recharge } : {}) });
export const recharge = (a: CreatureAction, r: string): CreatureAction => ({ ...a, recharge: r });
export const cost = (a: CreatureAction, n: number): CreatureAction => ({ ...a, cost: n });
