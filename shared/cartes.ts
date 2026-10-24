// Pioches du MJ : rencontres (le bestiaire), événements et objets (le canon). Le MJ pioche en secret, puis retourne
// la carte devant toute la table ; une carte retournée est publique.
import { crLabel, creaturesFor, fichierCreature, MONDES_PEINTS } from "./bestiary";
import { canonDe } from "./canon";
import { getGenre } from "./genres";
import { ideesDe } from "./idees";
import { Rng } from "./random";
import type { GenreId } from "./types";

export type TypeDeCarte = "rencontre" | "evenement" | "objet";
export const TYPES_DE_CARTE: { id: TypeDeCarte; label: string }[] = [
  { id: "rencontre", label: "Rencontre" },
  { id: "evenement", label: "Événement" },
  { id: "objet", label: "Objet" },
];

export interface Carte {
  id: string;
  type: TypeDeCarte;
  titre: string;
  /** Ligne sous le cartel : région et puissance, ou nature de la carte. */
  sousTitre: string;
  texte: string;
  effet?: string;
  /** Illustration plein cadre (créatures du bestiaire). */
  image?: string;
}

/** Tire une carte du type demandé ; `deja` évite de repiocher les dernières cartes sorties. */
export function tirerCarte(type: TypeDeCarte, genre: GenreId, level: number, seed?: number, deja: string[] = []): Carte {
  const rng = new Rng(seed);
  if (type === "rencontre") {
    // Une créature à nom public cache un secret du canon : le MJ la place, le hasard jamais.
    const toutes = creaturesFor(genre).filter((c) => !c.legendary && !c.publicName && c.cr <= Math.max(1, level + 1));
    const choix = toutes.filter((c) => !deja.includes(`rencontre:${fichierCreature(c)}`));
    const c = choix.length ? rng.pick(choix) : toutes.length ? rng.pick(toutes) : undefined;
    if (c)
      return {
        // Le nom de fichier, pas l'id : l'id de certaines créatures trahit un secret du canon.
        id: `rencontre:${fichierCreature(c)}`,
        type,
        // Le nom public : le vrai nom de certaines créatures trahit un secret du canon.
        titre: c.publicName ?? c.name,
        sousTitre: `${c.region === "Partout" ? "Partout" : c.region} · puissance ${crLabel(c.cr)}`,
        texte: c.lore,
        image: MONDES_PEINTS.has(genre) ? `/cartes/${fichierCreature(c)}.webp` : undefined,
      };
    const g = getGenre(genre);
    const nom = rng.pick(ideesDe(genre).enemies);
    return { id: `rencontre:${nom}`, type, titre: nom, sousTitre: "Rencontre", texte: `${rng.pick(g.places)}.` };
  }
  const canon = canonDe(genre)?.cartes;
  const pioche = type === "evenement" ? canon?.evenements : canon?.objets;
  if (pioche?.length) {
    const choix = pioche.filter((c) => !deja.includes(`${type}:${c.titre}`));
    const c = rng.pick(choix.length ? choix : pioche);
    return { id: `${type}:${c.titre}`, type, titre: c.titre, sousTitre: type === "evenement" ? "Événement" : "Objet", texte: c.texte, effet: c.effet, ...(c.image ? { image: `/cartes/${c.image}.webp` } : {}) };
  }
  // Monde sans canon : les rebondissements et récompenses du genre.
  const g = getGenre(genre);
  const t = rng.pick(type === "evenement" ? ideesDe(genre).twists : ideesDe(genre).rewards);
  return { id: `${type}:${t}`, type, titre: type === "evenement" ? "Rebondissement" : t, sousTitre: type === "evenement" ? "Événement" : "Objet", texte: t };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Carte envoyée par le MJ : on ne garde que des champs propres (l'image doit être une illustration de la table). */
export function nettoyerCarte(v: unknown): Carte | null {
  if (!isObj(v) || !TYPES_DE_CARTE.some((t) => t.id === v.type) || typeof v.titre !== "string" || !v.titre.trim()) return null;
  const image = typeof v.image === "string" && /^\/cartes\/[a-z0-9-]+\.webp$/.test(v.image) ? v.image : undefined;
  const effet = txt(v.effet, 400);
  return {
    id: txt(v.id, 120) || `${v.type}:${txt(v.titre, 80)}`,
    type: v.type as TypeDeCarte,
    titre: txt(v.titre, 80),
    sousTitre: txt(v.sousTitre, 80),
    texte: txt(v.texte, 600),
    ...(effet ? { effet } : {}),
    ...(image ? { image } : {}),
  };
}
