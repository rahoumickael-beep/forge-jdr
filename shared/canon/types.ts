// Forme commune du canon d'un monde : ce qui existe, où, quand, et ce que les joueurs ne doivent pas savoir.
// Les générateurs, les tests et les livres lisent le canon ; un nom absent du canon est une erreur.
import type { GenreId } from "../types";

export interface Region {
  nom: string;
  /** Où sur le continent, en quelques mots. */
  situation: string;
  paysage: string;
  /** Peuples et gens qu'on y croise. */
  gens: string[];
  peur: string;
  /** Lieu typique d'une rencontre, écrit pour suivre « près de ». */
  lieuDeRencontre: string;
  /** Lieux nommés de la région. */
  lieux: string[];
}

export interface Figure {
  nom: string;
  /** Autres façons de le nommer dans les textes (titre, surnom, prénom seul). */
  alias?: string[];
  titre: string;
  /** Région ou lieu où on la trouve. */
  ou: string;
  /** Faction (id) à laquelle la figure appartient. */
  faction?: string;
  /** Âge au printemps de l'année de jeu. */
  age?: number;
  /** Mort, Rendu, créature… */
  etat?: "vivant" | "mort" | "rendu" | "dieu";
  /** Scénario de la bibliothèque qui l'a créée, si elle n'est pas dans la bible. */
  scenario?: string;
}

export interface Faction {
  id: string;
  nom: string;
  alias?: string[];
  but: string;
  signe: string;
  /** Vers qui elle penche. */
  penche: string;
  /** Rangs et membres : apprenti, compagnon… */
  membres?: string[];
}

export interface Divinite {
  nom: string;
  alias?: string[];
  domaines: string[];
  symbole: string;
}

export interface Evenement {
  /** Année depuis la fondation (le calendrier long du monde). */
  an: number;
  quoi: string;
}

export interface Accroche {
  texte: string;
  /** Factions (id) que l'accroche met en jeu : il en faut au moins une. */
  factions: string[];
}

/** Une jauge de campagne propre au monde : elle descend, et le monde change à chaque seuil. */
export interface JaugeDuMonde {
  nom: string;
  depart: number;
  /** Du plus haut au plus bas. */
  seuils: { valeur: number; effet: string }[];
  /** Ce qui la fait remonter. */
  remontees: { action: string; gain: number }[];
  /** Ce qui la fait descendre. */
  descentes: { action: string; perte: number }[];
}

/** Accroche de campagne, rangée par palier de niveaux. */
export interface AccrocheDeCampagne {
  titre: string;
  niveaux: [number, number];
  texte: string;
  factions: string[];
}

/** Carte de la pioche du MJ (événement ou objet), retournée devant la table. */
export interface CarteDuMonde {
  titre: string;
  /** Ce que les joueurs lisent. */
  texte: string;
  /** Ce que ça change en jeu, en une phrase. */
  effet: string;
  /** Peinture (nom de fichier dans /cartes/, sans extension). */
  image?: string;
}

export interface Canon {
  genre: GenreId;
  monde: string;
  continent: string;
  capitale: string;
  /** Les deux façons de compter les années. */
  calendrier: {
    long: string; // « du Couronnement »
    court: string; // « du Glas »
    /** Année longue où commence le calendrier court. */
    debutCourt: number;
    /** Année de jeu, dans le calendrier long. */
    anDeJeu: number;
    saison: string;
  };
  chronologie: Evenement[];
  regions: Region[];
  /** Lieux qui n'appartiennent à aucune région (sous la capitale, partout). */
  autresLieux: string[];
  factions: Faction[];
  figures: Figure[];
  divinites: Divinite[];
  /** Peuples jouables et leurs variantes, tels que les nomme `origins.ts`. */
  peuples: string[];
  /** Mots propres au monde : événements, choses, sortes de morts, titres. */
  vocabulaire: string[];
  /** Noms que les joueurs ne doivent pas lire avant que la campagne les révèle. */
  secrets: string[];
  /** Mots qui n'ont rien à faire dans ce monde (en français). */
  anachronismes: string[];
  /** Réserves des générateurs ; aucune combinaison ne doit redonner une figure. */
  noms: { prenoms: string[]; familles: string[] };
  accroches: Accroche[];
  /** La grande ligne de la campagne, dans l'ordre. */
  campagne?: {
    jauge?: JaugeDuMonde;
    /** Réserve du MJ et son plafond. */
    reserve?: { nom: string; max: number; regle: string };
    accroches: AccrocheDeCampagne[];
  };
  /** Pioches de cartes : rien de secret, les joueurs les lisent. */
  cartes?: { evenements: CarteDuMonde[]; objets: CarteDuMonde[] };
}
