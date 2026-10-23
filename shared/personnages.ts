// Personnages tirés au hasard et calculs de caractéristiques, partagés par la table des joueurs.
// Ce module ne lit que genres.ts : la réserve du MJ (idees.ts, canon, bestiaire) reste dans generators.ts.
import { getGenre } from "./genres";
import { Rng, uid } from "./random";
import type { Character, GenreId } from "./types";

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
