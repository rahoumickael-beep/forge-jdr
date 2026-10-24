// Cartes à collectionner : chaque joueur a sa collection dans la campagne. Le MJ donne des paquets (et un paquet tombe
// à chaque fin de séance) ; le serveur tire le contenu, le joueur l'ouvre, puis joue ses cartes en partie.
// Jamais d'argent réel : les paquets se gagnent ou se reçoivent, rien ne s'achète ni ne se revend.
import { COLLECTION_AUBRETERRE } from "./canon/collection-fantasy";
import { COLLECTION_ARCHIPEL } from "./canon/collection-science-fiction";
import { COLLECTION_TERNELANDE } from "./canon/collection-dark-fantasy";
import { COLLECTION_RESIDENCE } from "./canon/collection-cyberpunk";
import { Rng } from "./random";
import type { GenreId } from "./types";

export type Rarete = "commune" | "peu-commune" | "rare" | "relique";
export type Famille = "objet" | "allie" | "faveur";

export interface CarteDeCollection {
  id: string;
  nom: string;
  famille: Famille;
  rarete: Rarete;
  /** Une fois : la carte quitte la collection quand on la joue. Par séance : elle se recharge à la séance suivante. */
  recharge: "une-fois" | "par-seance";
  /** Texte d'ambiance. */
  texte: string;
  /** Ce que la carte fait en partie. */
  usage: string;
  /** Illustration (nom de fichier dans /cartes/, sans extension) ; sinon un emblème gravé selon la famille. */
  image?: string;
}

export const RARETES: { id: Rarete; label: string }[] = [
  { id: "commune", label: "Commune" },
  { id: "peu-commune", label: "Peu commune" },
  { id: "rare", label: "Rare" },
  { id: "relique", label: "Relique" },
];
export const FAMILLES: { id: Famille; label: string }[] = [
  { id: "objet", label: "Objet" },
  { id: "allie", label: "Allié" },
  { id: "faveur", label: "Faveur" },
];

/** Contenu d'un paquet : 3 communes, 2 peu communes, et une rare (une relique une fois sur quatre). */
export const PAQUET = { communes: 3, peuCommunes: 2, chanceRelique: 0.25 };
export const TAILLE_PAQUET = PAQUET.communes + PAQUET.peuCommunes + 1;

const CATALOGUES: Partial<Record<GenreId, CarteDeCollection[]>> = { fantasy: COLLECTION_AUBRETERRE, "science-fiction": COLLECTION_ARCHIPEL, "dark-fantasy": COLLECTION_TERNELANDE, cyberpunk: COLLECTION_RESIDENCE };
export const catalogue = (genre: GenreId): CarteDeCollection[] => CATALOGUES[genre] ?? [];
export const carteDuCatalogue = (genre: GenreId, id: string) => catalogue(genre).find((c) => c.id === id);

/** Une carte possédée : l'id du catalogue, et « signature » pour les exemplaires offerts par le MJ. */
export interface Exemplaire {
  id: string;
  signature?: boolean;
  /** Carte « par séance » déjà jouée cette séance. */
  utilisee?: boolean;
}

export interface Collection {
  /** Paquets reçus, pas encore ouverts. */
  paquets: number;
  cartes: Exemplaire[];
}

export const collectionVide = (): Collection => ({ paquets: 0, cartes: [] });

/** Tire le contenu d'un paquet : communes d'abord, la carte rare en dernier (c'est elle qu'on retourne en dernier). */
export function tirerPaquet(genre: GenreId, seed?: number): string[] {
  const rng = new Rng(seed);
  const cat = catalogue(genre);
  if (!cat.length) return [];
  const de =(r: Rarete) => cat.filter((c) => c.rarete === r);
  const sans = (pool: CarteDeCollection[], pris: string[]) => (pool.length > pris.length ? pool.filter((c) => !pris.includes(c.id)) : pool);
  const out: string[] = [];
  for (let i = 0; i < PAQUET.communes; i++) out.push(rng.pick(sans(de("commune"), out)).id);
  for (let i = 0; i < PAQUET.peuCommunes; i++) out.push(rng.pick(sans(de("peu-commune"), out)).id);
  const haute = rng.chance(PAQUET.chanceRelique) && de("relique").length ? de("relique") : de("rare");
  if (haute.length) out.push(rng.pick(haute).id);
  return out.filter(Boolean);
}

/** Collection lue sur disque ou importée : on ne garde que des cartes du catalogue. */
export function nettoyerCollections(v: unknown, genre: GenreId, joueurs: string[]): Record<string, Collection> {
  const out: Record<string, Collection> = {};
  if (!v || typeof v !== "object") return out;
  const ids = new Set(catalogue(genre).map((c) => c.id));
  for (const [pid, c] of Object.entries(v as Record<string, unknown>)) {
    if (!joueurs.includes(pid) || !c || typeof c !== "object") continue;
    const col = c as Record<string, unknown>;
    out[pid] = {
      paquets: Math.max(0, Math.min(99, Math.round(Number(col.paquets) || 0))),
      cartes: (Array.isArray(col.cartes) ? col.cartes : [])
        .filter((e): e is Exemplaire => !!e && typeof e === "object" && ids.has((e as Exemplaire).id))
        .slice(0, 500)
        .map((e) => ({ id: e.id, ...(e.signature === true ? { signature: true } : {}), ...(e.utilisee === true ? { utilisee: true } : {}) })),
    };
  }
  return out;
}
