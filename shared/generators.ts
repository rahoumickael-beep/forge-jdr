// Générateurs aléatoires (sans IA) : personnages, PNJ, rencontres, scénarios, butin.
// Règles inspirées de D&D : 6 caractéristiques, modificateur = (valeur - 10) / 2, CA, PV, initiative au d20.
import { creaturesFor, toEncounterEnemy } from "./bestiary";
import { getGenre, levelTier } from "./genres";
import { Rng, uid } from "./random";
import type { Character, Encounter, GenreId, Scenario, Ton } from "./types";

export function modifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function formatMod(value: number): string {
  const m = modifier(value);
  return m >= 0 ? `+${m}` : `${m}`;
}

/** Bonus de maîtrise façon D&D 5e. */
export function proficiency(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

export function makeName(genre: GenreId, rng: Rng): string {
  const g = getGenre(genre);
  const raw = rng.pick(g.nameStart) + rng.pick(g.nameEnd);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** 4d6, on garde les 3 meilleurs. */
function rollStat(rng: Rng): number {
  const d = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)].sort((a, b) => b - a);
  return d[0] + d[1] + d[2];
}

export interface CharacterOptions {
  genre: GenreId;
  level: number;
  archetype?: string;
  origin?: string;
  name?: string;
  seed?: number;
  npc?: boolean;
}

export function generateCharacter(opts: CharacterOptions): Character {
  const rng = new Rng(opts.seed);
  const g = getGenre(opts.genre);
  const level = Math.min(20, Math.max(1, opts.level));
  const archetype = opts.archetype || rng.pick(g.archetypes);
  const origin = opts.origin || rng.pick(g.origins);
  const stats: Record<string, number> = {};
  for (const s of g.stats) stats[s] = rollStat(rng);
  // +1 à une caractéristique tous les 4 niveaux, comme les améliorations de D&D
  for (let i = 0; i < Math.floor(level / 4); i++) {
    const s = rng.pick(g.stats);
    stats[s] = Math.min(20, stats[s] + 2);
  }
  const con = modifier(stats[g.stats[2]]);
  const dex = modifier(stats[g.stats[1]]);
  const hitDie = rng.pick([6, 8, 10, 12]);
  const hpMax = Math.max(1, hitDie + con + (level - 1) * (Math.floor(hitDie / 2) + 1 + con));
  const ac = 10 + dex + rng.int(1, 6);
  const name = opts.name || makeName(opts.genre, rng);
  const trait = rng.pick(g.traits);
  const place = rng.pick(g.places);
  return {
    id: uid("c_"),
    name,
    genre: opts.genre,
    level,
    archetype,
    origin,
    description: `${origin} ${archetype.toLowerCase()} de niveau ${level}, ${trait}.`,
    backstory: `${name} a grandi près de ${place}. ${rng.pick([
      "Un événement tragique l'a poussé·e sur les routes.",
      "Une dette envers une personne dangereuse l'oblige à partir à l'aventure.",
      "Un rêve récurrent lui montre un lieu qu'il faut trouver.",
      "Ancien membre d'un groupe dissous, il·elle cherche ses compagnons perdus.",
      "Une prophétie mal comprise a fait de lui·elle un paria.",
    ])}`,
    personality: trait,
    stats,
    hp: hpMax,
    hpMax,
    ac,
    speed: rng.pick([5, 6, 6, 7]),
    equipment: rng.pickMany(g.equipment, 3 + Math.min(3, Math.floor(level / 5))),
    abilities: rng.pickMany(g.abilities, 1 + Math.min(4, Math.floor(level / 3))),
    role: opts.npc ? rng.pick(["Allié", "Informateur", "Marchand", "Rival", "Commanditaire", "Traître caché"]) : undefined,
  };
}

/** Profil de danger d'un ennemi selon sa position dans la liste du genre. */
function enemyProfile(index: number, total: number, level: number) {
  const ratio = (index + 1) / total;
  const hp = Math.round(6 + ratio * 30 * Math.max(1, level / 3));
  const ac = 10 + Math.round(ratio * 8);
  const atk = 2 + Math.round(ratio * 6) + Math.floor(level / 4);
  const dmgDie = ratio < 0.3 ? "1d6" : ratio < 0.6 ? "1d8" : ratio < 0.85 ? "2d8" : "3d10";
  return { hp, ac, attack: `+${atk}, ${dmgDie}+${Math.ceil(ratio * 4)}` };
}

/** Lieu typique de chaque région d'Aubreterre, pour qu'une rencontre se passe là où vit la créature. */
const REGION_PLACES: Record<string, string> = {
  "Le Couronnement": "les faubourgs d'Aube-Close",
  "Les Marches de Fer": "un fort du Mur des Neuf Cents",
  "Le Val Cierge": "une abbaye du Val Cierge",
  "Les Noyes": "les tourbières des Noyes",
  "La Côte des Sels": "les salines de Port-Lagune",
  "Les Monts Ossiers": "un ossuaire muré des Monts Ossiers",
  "La Brune": "une clairière ronde de la Brune",
  "Le Verre-Rouge": "une oasis du Verre-Rouge",
  "Le Dessous": "une fissure sous la Rotonde",
};

export function generateEncounter(genre: GenreId, level: number, players = 4, seed?: number): Encounter {
  const rng = new Rng(seed);
  const g = getGenre(genre);
  const tier = levelTier(level).index;
  const n = g.enemies.length;
  // On choisit des ennemis dans la tranche correspondant au palier.
  const lo = Math.floor((tier / 4) * n);
  const hi = Math.min(n - 1, Math.floor(((tier + 1.6) / 4) * n));
  const difficulty = rng.pick(["Facile", "Moyenne", "Difficile", "Mortelle"]);
  const diffFactor = { Facile: 0.6, Moyenne: 1, Difficile: 1.4, Mortelle: 1.9 }[difficulty]!;
  const kinds = rng.int(1, 2);
  // Genre avec un bestiaire : de vraies créatures, au nombre fixé par un budget de PX façon Guide du maître.
  const beasts = creaturesFor(genre).filter((c) => c.cr <= Math.max(0.5, level) && c.cr >= Math.min(level / 4, 2) && !c.legendary);
  if (beasts.length) {
    const budget = players * 50 * level * diffFactor * (level < 3 ? 1 : 1.5);
    // Deux créatures d'une même région (ou de partout), et le lieu qui va avec.
    const first = rng.pick(beasts);
    const mates = beasts.filter((c) => c !== first && (c.region === first.region || c.region === "Partout" || first.region === "Partout"));
    const picked = kinds > 1 && mates.length ? [first, rng.pick(mates)] : [first];
    const region = picked.find((c) => c.region !== "Partout")?.region;
    const enemies = picked.map((c) => {
      const count = Math.max(1, Math.min(8, Math.round(budget / picked.length / (c.xp * (kinds > 1 ? 2 : 1.5)))));
      return { ...toEncounterEnemy(c, count, level), creatureId: c.id };
    });
    const place = (region && REGION_PLACES[region]) || rng.pick(g.places);
    return {
      title: `${enemies.map((e) => e.name).join(" et ")} — ${place}`,
      description: `Près de ${place}. ${rng.pick(["Ils attendent sur la route que les héros arrivent.", "Le terrain est mauvais : boue, eau ou éboulis.", "Un innocent est pris entre deux feux.", "Quelqu'un, parmi eux, veut d'abord parler.", "La nuit tombe, et la lumière manque."])}`,
      enemies,
      difficulty,
    };
  }
  const enemies = Array.from({ length: kinds }, () => {
    const idx = rng.int(lo, hi);
    const p = enemyProfile(idx, n, level);
    const count = Math.max(1, Math.round(((players * diffFactor) / (1 + idx / n * 3)) * rng.int(5, 12) / 10));
    return { name: g.enemies[idx], count, hp: p.hp, ac: p.ac, attack: p.attack, danger: idx > n * 0.75 ? "Élevé" : idx > n * 0.4 ? "Moyen" : "Faible" };
  });
  const place = rng.pick(g.places);
  return {
    title: `${enemies.map((e) => e.name).join(" et ")} — ${place}`,
    description: `Les héros sont surpris près de ${place}. ${rng.pick([
      "L'ennemi a tendu une embuscade.",
      "Le terrain est piégé.",
      "Un innocent est pris entre deux feux.",
      "Les adversaires veulent négocier avant de combattre.",
      "Un orage rend la visibilité mauvaise.",
    ])}`,
    enemies,
    difficulty,
  };
}

export function generateLoot(genre: GenreId, level: number, seed?: number): string[] {
  const rng = new Rng(seed);
  const g = getGenre(genre);
  const coins = rng.int(10, 60) * level;
  return [`${coins} pièces (ou équivalent local)`, ...rng.pickMany(g.equipment, 2), ...(rng.chance(0.25 + level / 40) ? [rng.pick(g.rewards)] : [])];
}

export interface ScenarioOptions {
  genre: GenreId;
  ton: Ton;
  level: number;
  players: number;
  seed?: number;
}

const ACT_TITLES = ["L'appel", "L'enquête", "La confrontation", "Le dénouement"];
const TON_FLAVOR: Record<Ton, string> = {
  epique: "Le destin du monde est en jeu.",
  sombre: "Personne n'en sortira indemne.",
  humoristique: "Rien ne se passera comme prévu, et c'est tant mieux.",
  mysterieux: "Chaque réponse amène une nouvelle question.",
};

export function generateScenario(opts: ScenarioOptions): Scenario {
  const rng = new Rng(opts.seed);
  const g = getGenre(opts.genre);
  const tier = levelTier(opts.level);
  const villainName = makeName(opts.genre, rng);
  const villainKind = rng.pick(g.villains);
  const places = rng.pickMany(g.places, 4);
  const hook = rng.pick(g.hooks);
  const actsCount = tier.index >= 2 ? 4 : 3;
  const acts = Array.from({ length: actsCount }, (_, i) => ({
    title: ACT_TITLES[i] ?? `Acte ${i + 1}`,
    location: places[i % places.length],
    summary: [
      `Les héros sont recrutés : ${hook.toLowerCase()}`,
      `Ils suivent une piste jusqu'à ${places[1] ?? places[0]} et découvrent l'implication de ${villainName}.`,
      `Affrontement à ${places[2] ?? places[0]} contre les forces de ${villainName}.`,
      `Dernier face-à-face avec ${villainName}, ${villainKind}, à ${places[3] ?? places[0]}.`,
    ][i],
  }));
  if (actsCount === 3) acts[2].summary = `Face-à-face final avec ${villainName}, ${villainKind}, à ${acts[2].location}.`;
  const encounters = Array.from({ length: actsCount - 1 }, (_, i) =>
    generateEncounter(opts.genre, opts.level + i, opts.players, (opts.seed ?? Date.now()) + i * 97),
  );
  return {
    id: uid("s_"),
    title: `${rng.pick(["Le secret de", "L'ombre sur", "La chute de", "Le réveil de", "Les larmes de", "La malédiction de"])} ${places[0].replace(/^(la|le|les|l'|un|une) /i, "")}`,
    genre: opts.genre,
    ton: opts.ton,
    level: opts.level,
    players: opts.players,
    hook,
    synopsis: `${hook} Derrière tout cela se cache ${villainName}, ${villainKind}, qui veut ${rng.pick(g.motivations)}. ${TON_FLAVOR[opts.ton]} Aventure de palier ${tier.label.toLowerCase()} pour ${opts.players} joueurs de niveau ${opts.level}.`,
    acts,
    villain: { name: villainName, motivation: rng.pick(g.motivations), description: `${villainName} est ${villainKind}, ${rng.pick(g.traits)}.` },
    npcs: Array.from({ length: 3 }, () => ({
      name: makeName(opts.genre, rng),
      role: rng.pick(["Commanditaire", "Informateur", "Allié inattendu", "Marchand", "Témoin", "Rival"]),
      secret: rng.pick(["travaille en secret pour le méchant", "cache un objet important", "est recherché·e par les autorités", "est un parent d'un héros", "ment sur son identité", "n'a aucun secret, mais tout le monde le soupçonne"]),
    })),
    encounters,
    twists: rng.pickMany(g.twists, 2),
    rewards: rng.pickMany(g.rewards, 2),
    source: "aleatoire",
  };
}
