// Types partagés entre le serveur et le client.

export type GenreId =
  | "fantasy"
  | "dark-fantasy"
  | "science-fiction"
  | "cyberpunk"
  | "horreur"
  | "post-apo"
  | "western"
  | "pirates"
  | "steampunk"
  | "contemporain";

export type Ton = "epique" | "sombre" | "humoristique" | "mysterieux";

export type MapKind = "donjon" | "caverne" | "nature" | "village";

/** Un type de case de carte. Le rendu dépend du thème visuel du genre. */
export type Tile = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const T = {
  vide: 0, // hors carte / roche
  sol: 1,
  mur: 2,
  eau: 3,
  vegetation: 4,
  route: 5,
  porte: 6,
} as const;

export interface GameMap {
  name: string;
  kind: MapKind;
  seed: number;
  width: number;
  height: number;
  tiles: Tile[]; // width * height, ligne par ligne
  /** Points d'intérêt proposés par le générateur (salles, bâtiments…). */
  rooms: { x: number; y: number; w: number; h: number; label?: string }[];
}

export interface Stats {
  [stat: string]: number;
}

export interface Character {
  id: string;
  name: string;
  genre: GenreId;
  level: number;
  archetype: string; // classe / métier
  origin: string; // peuple / origine
  description: string;
  backstory: string;
  personality: string;
  stats: Stats;
  hp: number;
  hpMax: number;
  ac: number; // classe d'armure, façon D&D
  speed: number; // déplacement en cases par tour
  equipment: string[];
  abilities: string[];
  /** Pour un PNJ : rôle dans l'histoire. */
  role?: string;
}

export interface Encounter {
  title: string;
  description: string;
  enemies: { name: string; count: number; hp: number; ac: number; attack: string; danger: string }[];
  difficulty: string;
}

export interface Scenario {
  id: string;
  title: string;
  genre: GenreId;
  ton: Ton;
  level: number;
  players: number;
  hook: string;
  synopsis: string;
  acts: { title: string; summary: string; location: string }[];
  villain: { name: string; motivation: string; description: string };
  npcs: { name: string; role: string; secret: string }[];
  encounters: Encounter[];
  twists: string[];
  rewards: string[];
  source: "aleatoire" | "ia";
}

export interface Token {
  id: string;
  name: string;
  x: number; // en cases
  y: number;
  color: string;
  kind: "joueur" | "pnj" | "monstre" | "objet";
  ownerId?: string; // id du joueur qui peut le déplacer
  hidden?: boolean; // invisible pour les joueurs
  hp?: number;
  hpMax?: number;
  ac?: number;
  conditions?: string[]; // états : à terre, empoisonné…
  characterId?: string;
  size?: number; // 1 = une case
}

export interface ChatEntry {
  id: string;
  at: number;
  from: string;
  fromId?: string;
  text: string;
  kind: "chat" | "des" | "systeme" | "narration";
  secret?: boolean; // visible du MJ seulement
}

export interface InitiativeEntry {
  tokenId?: string;
  name: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  online: boolean;
  isGM: boolean;
}

export interface Handout {
  id: string;
  title: string;
  text: string;
  at: number;
}

/** État complet d'une partie, tel que le serveur le garde. */
export interface RoomState {
  code: string;
  name: string;
  genre: GenreId;
  ton: Ton;
  level: number;
  createdAt: number;
  map: GameMap | null;
  fog: boolean[] | null; // true = caché pour les joueurs
  fogEnabled: boolean;
  tokens: Token[];
  players: Player[];
  chat: ChatEntry[];
  initiative: { entries: InitiativeEntry[]; turn: number; round: number };
  handouts: Handout[];
  characters: Character[];
  scenarios: Scenario[];
  gmNotes: string; // jamais envoyé aux joueurs
  movementLocked: boolean;
  scene: string; // texte d'ambiance affiché à tous
}

/** Vue envoyée à un client : la version joueur retire les secrets. */
export type RoomView = Omit<RoomState, "gmNotes"> & { gmNotes?: string; you: Player };
