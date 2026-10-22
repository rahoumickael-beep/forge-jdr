// Prompts et lecture des réponses pour la génération par IA (LM Studio ou Claude).
// Le même prompt sert aux deux fournisseurs ; la réponse attendue est un objet JSON.
import { getGenre, levelTier, TONS } from "./genres";
import { generateCharacter, generateScenario } from "./generators";
import { uid } from "./random";
import type { Character, GenreId, Scenario, Ton } from "./types";

export type AiKind = "scenario" | "personnage" | "pnj" | "description" | "libre";

export interface AiRequest {
  kind: AiKind;
  genre: GenreId;
  ton: Ton;
  level: number;
  players: number;
  /** Consigne libre du MJ (ex. "une histoire de vengeance dans un monastère"). */
  prompt?: string;
}

/** Règles d'écriture : le texte doit sonner comme celui d'un MJ passionné, pas comme une machine. */
export const STYLE_GUIDE = `Tu écris pour une table de jeu de rôle entre amis, en français, inspirée de D&D.
Règles d'écriture :
- Écris comme un maître du jeu expérimenté qui prépare sa partie : concret, vivant, jouable.
- Des détails précis et sensoriels (une odeur, un bruit, un objet) plutôt que des adjectifs vagues.
- Des noms propres originaux et cohérents avec l'univers. Jamais "Elara", "Lyra", "Kael", "Thorne", "Vex" ni "Eldoria".
- Pas de formules toutes faites : évite "dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "sombre secret", "tapisserie".
- Pas de morale ni de conclusion. Phrases courtes, verbes d'action.
- Chaque PNJ veut quelque chose et a une façon de parler reconnaissable.
- Donne au MJ des choses à faire jouer : indices, choix, conséquences.`;

function context(req: AiRequest): string {
  const g = getGenre(req.genre);
  const ton = TONS.find((t) => t.id === req.ton)?.label ?? req.ton;
  return `Univers : ${g.label} (${g.pitch}) Ton : ${ton}. Niveau des personnages : ${req.level} (palier ${levelTier(req.level).label}). Nombre de joueurs : ${req.players}.
Caractéristiques utilisées : ${g.stats.join(", ")} (valeurs de 3 à 20, 10 = moyenne). Classes typiques : ${g.archetypes.join(", ")}.${req.prompt ? `\nConsigne du MJ : ${req.prompt}` : ""}`;
}

const SCENARIO_SHAPE = `{"title": string, "hook": string, "synopsis": string,
"acts": [{"title": string, "summary": string, "location": string}],
"villain": {"name": string, "motivation": string, "description": string},
"npcs": [{"name": string, "role": string, "secret": string}],
"encounters": [{"title": string, "description": string, "difficulty": "Facile"|"Moyenne"|"Difficile"|"Mortelle",
  "enemies": [{"name": string, "count": number, "hp": number, "ac": number, "attack": string, "danger": "Faible"|"Moyen"|"Élevé"}]}],
"twists": [string], "rewards": [string]}`;

const CHARACTER_SHAPE = `{"name": string, "archetype": string, "origin": string, "description": string, "backstory": string,
"personality": string, "stats": {"<nom de caractéristique>": number}, "hpMax": number, "ac": number, "speed": number,
"equipment": [string], "abilities": [string], "role": string}`;

export function buildPrompt(req: AiRequest): { system: string; user: string } {
  const ctx = context(req);
  switch (req.kind) {
    case "scenario":
      return {
        system: STYLE_GUIDE,
        user: `${ctx}\n\nÉcris un scénario prêt à jouer en une ou deux soirées : 3 ou 4 actes, 3 PNJ, une rencontre de combat par acte sauf le premier, adaptée au niveau (PV et CA cohérents avec D&D 5e), 2 rebondissements, 2 récompenses.\nRéponds uniquement avec un objet JSON de cette forme :\n${SCENARIO_SHAPE}`,
      };
    case "personnage":
    case "pnj":
      return {
        system: STYLE_GUIDE,
        user: `${ctx}\n\nCrée ${req.kind === "pnj" ? "un personnage non joueur mémorable (indique son rôle dans l'histoire dans \"role\")" : "un personnage joueur prêt à jouer"} de niveau ${req.level}. Utilise exactement les caractéristiques listées.\nRéponds uniquement avec un objet JSON de cette forme :\n${CHARACTER_SHAPE}`,
      };
    case "description":
      return {
        system: STYLE_GUIDE,
        user: `${ctx}\n\nÉcris une description à lire à voix haute aux joueurs, 4 à 6 phrases, à la deuxième personne du pluriel. Réponds uniquement avec un objet JSON : {"text": string}`,
      };
    default:
      return { system: STYLE_GUIDE, user: `${ctx}\n\nRéponds uniquement avec un objet JSON : {"text": string}` };
  }
}

/** Extrait le premier objet JSON d'une réponse, même entouré de texte ou de balises ```json. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("La réponse de l'IA ne contient pas de JSON.");
  let depth = 0;
  let inString = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
  }
  throw new Error("La réponse de l'IA est incomplète (JSON coupé).");
}

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);
const num = (v: unknown, fallback: number) => (typeof v === "number" && isFinite(v) ? v : Number(v) || fallback);
const arr = <T>(v: unknown, map: (x: any) => T): T[] => (Array.isArray(v) ? v.map(map) : []);

/** Complète une réponse partielle avec le générateur aléatoire pour ne jamais casser l'interface. */
export function toScenario(raw: any, req: AiRequest): Scenario {
  const base = generateScenario({ genre: req.genre, ton: req.ton, level: req.level, players: req.players });
  const acts = arr(raw?.acts, (a) => ({ title: str(a?.title, "Acte"), summary: str(a?.summary, ""), location: str(a?.location, "") }));
  const encounters = arr(raw?.encounters, (e) => ({
    title: str(e?.title, "Rencontre"),
    description: str(e?.description, ""),
    difficulty: str(e?.difficulty, "Moyenne"),
    enemies: arr(e?.enemies, (en) => ({
      name: str(en?.name, "Ennemi"),
      count: Math.max(1, Math.round(num(en?.count, 1))),
      hp: Math.max(1, Math.round(num(en?.hp, 10))),
      ac: Math.round(num(en?.ac, 12)),
      attack: str(en?.attack, "+4, 1d8+2"),
      danger: str(en?.danger, "Moyen"),
    })),
  }));
  const npcs = arr(raw?.npcs, (n) => ({ name: str(n?.name, ""), role: str(n?.role, ""), secret: str(n?.secret, "") }))
    .filter((n) => n.name)
    .slice(0, 8);
  const twists = arr(raw?.twists, (t) => str(t, "")).filter(Boolean);
  const rewards = arr(raw?.rewards, (t) => str(t, "")).filter(Boolean);
  return {
    ...base,
    id: uid("s_"),
    title: str(raw?.title, base.title),
    hook: str(raw?.hook, base.hook),
    synopsis: str(raw?.synopsis, base.synopsis),
    acts: acts.length ? acts : base.acts,
    villain: {
      name: str(raw?.villain?.name, base.villain.name),
      motivation: str(raw?.villain?.motivation, base.villain.motivation),
      description: str(raw?.villain?.description, base.villain.description),
    },
    npcs: npcs.length ? npcs : base.npcs,
    encounters: encounters.length ? encounters : base.encounters,
    twists: twists.length ? twists : base.twists,
    rewards: rewards.length ? rewards : base.rewards,
    source: "ia",
  };
}

export function toCharacter(raw: any, req: AiRequest): Character {
  const base = generateCharacter({ genre: req.genre, level: req.level, npc: req.kind === "pnj" });
  const g = getGenre(req.genre);
  const stats: Record<string, number> = {};
  for (const s of g.stats) stats[s] = Math.min(20, Math.max(3, Math.round(num(raw?.stats?.[s], base.stats[s]))));
  const hpMax = Math.max(1, Math.round(num(raw?.hpMax, base.hpMax)));
  return {
    ...base,
    name: str(raw?.name, base.name),
    archetype: str(raw?.archetype, base.archetype),
    origin: str(raw?.origin, base.origin),
    description: str(raw?.description, base.description),
    backstory: str(raw?.backstory, base.backstory),
    personality: str(raw?.personality, base.personality),
    stats,
    hp: hpMax,
    hpMax,
    ac: Math.round(num(raw?.ac, base.ac)),
    speed: Math.round(num(raw?.speed, base.speed)),
    equipment: arr(raw?.equipment, (x) => str(x, "")).filter(Boolean).slice(0, 10),
    abilities: arr(raw?.abilities, (x) => str(x, "")).filter(Boolean).slice(0, 10),
    role: req.kind === "pnj" ? str(raw?.role, base.role ?? "PNJ") : undefined,
  };
}
