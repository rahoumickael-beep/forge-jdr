// Types partagés entre le serveur et le client.
import type { Combat } from "./combat";

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
  // Champs du créateur de personnage (facultatifs : les personnages tirés au hasard ne les ont pas)
  classId?: string;
  /** Sous-classe choisie (id d'une entrée de `subclasses` dans shared/rules.ts). */
  subclass?: string;
  subOrigin?: string;
  background?: string;
  skills?: string[];
  traits?: { trait: string; ideal: string; bond: string; flaw: string };
  appearance?: string;
  /** Portrait en data URL JPEG (petit, ~256 px). */
  portrait?: string;
  /** Joueur à qui appartient la fiche (posé par le serveur). Sans propriétaire, c'est un PNJ du MJ. */
  ownerId?: string;
}

export interface Encounter {
  title: string;
  description: string;
  enemies: { name: string; count: number; hp: number; ac: number; attack: string; danger: string; creatureId?: string }[];
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
  /** voice : façon de parler, tic, mot fétiche (facultatif). */
  npcs: { name: string; role: string; secret: string; voice?: string }[];
  encounters: Encounter[];
  twists: string[];
  rewards: string[];
  source: "aleatoire" | "ia" | "bibliotheque";
  /** Conseils de préparation pour le MJ (paragraphes séparés par une ligne vide). */
  gmNotes?: string;
  /** Textes à lire à voix haute. act : numéro de l'acte à partir de 1, ou 0 pour l'ouverture. */
  readAloud?: { act: number; title?: string; text: string }[];
  /** Choix laissés aux joueurs, avec leurs conséquences. */
  choices?: { act: number; title: string; options: { label: string; consequence: string }[] }[];
  /** Carte proposée, à recréer avec generateMap. labels renomme les points d'intérêt dans l'ordre. */
  mapHint?: { kind: MapKind; seed: number; name: string; width?: number; height?: number; labels?: string[] };
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
  vision?: number; // portée de vue en cases (ligne de vue dynamique)
  characterId?: string;
  size?: number; // 1 = une case
  /** Créature du bestiaire (shared/bestiary.ts) dont ce pion est issu. */
  creatureId?: string;
  /** Bonus d'initiative noté à la main (sinon tiré de la fiche ou du bestiaire). */
  init?: number;
  /** Déplacement en cases par tour (6 par défaut, soit 9 m). */
  speed?: number;
}

export interface ChatEntry {
  id: string;
  at: number;
  from: string;
  fromId?: string;
  text: string;
  kind: "chat" | "des" | "systeme" | "narration";
  secret?: boolean; // visible du MJ seulement
  /** Lancer de dés : de quoi le rejouer sur la table chez chacun (le résultat vient du serveur). */
  roll?: { sides: number; rolls: number[]; kept: number[]; modifier: number; total: number };
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
  /** Joueurs qui reçoivent le document ; absent ou vide : toute la table. */
  to?: string[];
}

import type { Carte } from "./cartes";

/** Une séance de jeu : ce qui s'est passé, pour la raconter la fois suivante. */
export interface Seance {
  numero: number;
  debut: number;
  fin?: number;
  /** « Précédemment » : écrit par le MJ à la clôture, lu aux joueurs à l'ouverture suivante. */
  resume: string;
  /** Notés tout seuls pendant la séance (combats, documents, cartes) : rien de secret. */
  faits: string[];
}

/** Une piste laissée en suspens. Un fil secret reste chez le MJ. */
export interface FilOuvert {
  id: string;
  texte: string;
  ouvert: boolean;
  secret: boolean;
  /** Séance où le fil est apparu. */
  seance: number;
}

/** Un PNJ que le groupe a croisé. */
export interface PnjConnu {
  id: string;
  nom: string;
  /** De -2 (hostile) à +2 (allié). */
  attitude: number;
  /** Ce que les joueurs savent de lui. */
  public: string;
  /** Ce que le MJ garde pour lui. */
  secret: string;
}

/** Mémoire de la campagne, d'une séance à l'autre. */
export interface Campagne {
  seances: Seance[];
  fils: FilOuvert[];
  pnj: PnjConnu[];
  /** Réputation du groupe auprès de chaque faction du canon (id → 0 à 3). */
  reputations: Record<string, number>;
  /** Jauge du monde (le Sceau en fantasy), de 0 à 100 ; null si le monde n'en a pas. */
  jauge: number | null;
  /** Les joueurs voient-ils la jauge ? */
  jaugeVisible: boolean;
  /** Réserve du MJ (les Murmures en fantasy). */
  reserve: number;
  /** Notes du MJ pour la séance suivante. */
  preparation: string;
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
  /** "dynamique" : chaque joueur voit ce que voient les pions du groupe ; "manuel" : le MJ peint le brouillard. */
  visionMode: "dynamique" | "manuel";
  sharedVision: boolean; // les joueurs partagent la vue de tout le groupe
  mapKnown: boolean; // le groupe possède la carte des lieux : le plan est visible en sombre
  /** Méthode de répartition des caractéristiques à la création. */
  abilityMethod: "points" | "des" | "fixe";
  /** Règle de mort choisie par le MJ (id de DEATH_RULES). */
  deathRule: string;
  tokens: Token[];
  players: Player[];
  chat: ChatEntry[];
  initiative: { entries: InitiativeEntry[]; turn: number; round: number };
  /** Combat en cours (null hors combat). */
  combat: Combat | null;
  /** Le combat se lance tout seul quand un pion joueur voit un monstre. */
  autoCombat: boolean;
  /** Monstres d'un combat que le MJ a terminé : ils ne relancent rien tant qu'ils restent en vue. */
  combatDismissed?: string[];
  handouts: Handout[];
  characters: Character[];
  scenarios: Scenario[];
  gmNotes: string; // jamais envoyé aux joueurs
  movementLocked: boolean;
  scene: string; // texte d'ambiance affiché à tous
  campagne: Campagne;
  /** Carte que le MJ a retournée devant la table (publique), avec l'heure du retournement. */
  carte: (Carte & { at: number }) | null;
}

/** Vue envoyée à un client : la version joueur retire les secrets. */
export type RoomView = Omit<RoomState, "gmNotes"> & {
  gmNotes?: string;
  you: Player;
  /** Cases vues en ce moment par ce joueur (ligne de vue dynamique). */
  visible?: number[];
};
