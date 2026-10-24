// Les souvenirs d'un personnage (la Ternelande) : son histoire, sa monnaie pour la Dîme et le prix de sa magie.
// Un souvenir est intact, flou ou perdu ; on le rend flou en lançant un grand sort, on le perd en l'usant encore.
// Le serveur nettoie la liste ; un souvenir perdu pour de bon donne une Lacune au MJ (shared/campagne.ts).
import type { GenreId } from "./types";

export type EtatSouvenir = "intact" | "flou" | "perdu";

export interface Souvenir {
  texte: string;
  etat: EtatSouvenir;
}

/** Les mondes où la fiche porte des souvenirs. */
export const MONDES_A_SOUVENIRS = new Set<GenreId>(["dark-fantasy"]);
export const SOUVENIRS_DE_DEPART = 6;
export const SOUVENIRS_MAX = 12;

/** L'état suivant quand on use un souvenir : intact → flou → perdu. Un souvenir perdu le reste. */
export const user = (e: EtatSouvenir): EtatSouvenir => (e === "intact" ? "flou" : "perdu");

/** Raconter un souvenir flou à un autre personnage le rend intact ; un souvenir perdu ne revient pas ainsi. */
export const raconter = (e: EtatSouvenir): EtatSouvenir => (e === "flou" ? "intact" : e);

const ETATS: EtatSouvenir[] = ["intact", "flou", "perdu"];

/** Liste propre : au plus douze souvenirs, du texte court, un état connu. */
export function nettoyerSouvenirs(v: unknown): Souvenir[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({ texte: String(s.texte ?? "").trim().slice(0, 160), etat: ETATS.includes(s.etat as EtatSouvenir) ? (s.etat as EtatSouvenir) : "intact" }))
    .filter((s) => s.texte)
    .slice(0, SOUVENIRS_MAX);
}

/** Combien de souvenirs sont devenus perdus entre deux versions de la fiche (pour la Lacune du MJ). */
export function nouveauxPerdus(avant: Souvenir[] | undefined, apres: Souvenir[] | undefined): number {
  const perdus = (l?: Souvenir[]) => (l ?? []).filter((s) => s.etat === "perdu").length;
  return Math.max(0, perdus(apres) - perdus(avant));
}

/** Vide : plus aucun souvenir intact (et au moins un souvenir écrit). */
export const estVide = (l?: Souvenir[]) => !!l?.length && !l.some((s) => s.etat === "intact");
