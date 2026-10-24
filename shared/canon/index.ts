// Canon de chaque monde, et l'outil qui vérifie qu'un texte n'invente pas de noms.
import type { GenreId } from "../types";
import { AUBRETERRE } from "./fantasy";
import { ARCHIPEL } from "./science-fiction";
import { TERNELANDE } from "./dark-fantasy";
import { RESIDENCE } from "./cyberpunk";
import { COTE_DES_NOYES } from "./horreur";
import { GRAND_SEC } from "./post-apo";
import { CHAMP_D_ASILE } from "./western";
import { ILES_DU_VENT } from "./pirates";
import type { Canon } from "./types";

export type { Canon } from "./types";
export { AUBRETERRE, ARCHIPEL, TERNELANDE, RESIDENCE, COTE_DES_NOYES, GRAND_SEC, CHAMP_D_ASILE, ILES_DU_VENT };

export const CANONS: Partial<Record<GenreId, Canon>> = { fantasy: AUBRETERRE, "science-fiction": ARCHIPEL, "dark-fantasy": TERNELANDE, cyberpunk: RESIDENCE, horreur: COTE_DES_NOYES, "post-apo": GRAND_SEC, western: CHAMP_D_ASILE, pirates: ILES_DU_VENT };

export const canonDe = (genre: GenreId): Canon | undefined => CANONS[genre];

/** Mots de règles et d'interface qui prennent une majuscule sans être des noms du monde. */
const TERMES_DE_JEU = [
  "Force", "Dextérité", "Constitution", "Intelligence", "Sagesse", "Charisme",
  "Acrobaties", "Arcanes", "Athlétisme", "Discrétion", "Dressage", "Escamotage", "Histoire", "Intimidation", "Intuition", "Investigation",
  "Médecine", "Nature", "Perception", "Perspicacité", "Persuasion", "Religion", "Représentation", "Survie", "Tromperie",
  // Actions et options de règles citées dans les pouvoirs
  "Attaquer", "Foncer", "Esquiver", "Aider", "Défense", "Duel", "Déluge", "Patience", "Jumelage", "Prudence", "Mutation",
  "Très", "Petite", "Petites", "Petits", "Moyenne", "Moyens", "Grande", "Grandes", "Gigantesque",
  "PV", "CA", "DD", "MJ", "PX", "XP", "FP", "PNJ", "JS", "po", "Discord",
];

/** Tous les noms connus d'un canon, en entier. */
export function nomsDuCanon(c: Canon): string[] {
  return [
    c.monde, c.continent, c.capitale,
    ...c.regions.flatMap((r) => [r.nom, ...r.lieux, ...r.gens]),
    ...c.autresLieux,
    ...c.factions.flatMap((f) => [f.nom, ...(f.alias ?? []), ...(f.membres ?? [])]),
    ...c.figures.flatMap((f) => [f.nom, ...(f.alias ?? [])]),
    ...c.divinites.flatMap((d) => [d.nom, ...(d.alias ?? [])]),
    ...c.peuples,
    ...c.vocabulaire,
    ...c.secrets,
  ];
}

const PETITS_MOTS = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "à", "aux", "sous", "en"]);
const mots = (s: string) => s.split(/[\s'’-]+/).filter((m) => m && !PETITS_MOTS.has(m.toLowerCase()));

/** Groupes de mots à majuscule, hors début de phrase : les candidats au titre de nom propre. */
const GROUPE = /\p{Lu}[\p{L}'’-]*(?:(?:\s|-)(?:(?:de|du|des|la|le|les|aux|à|sous)\s)?(?:d['’]|l['’])?\p{Lu}[\p{L}'’-]*)*/gu;

export function nomsPropres(texte: string): string[] {
  const trouves: string[] = [];
  for (const phrase of texte.split(/[.!?:;«»—\n(]+/)) {
    const corps = phrase.trim().replace(/^\S+/, "");
    for (const m of corps.matchAll(GROUPE)) trouves.push(m[0]);
  }
  return trouves;
}

/** Noms propres d'un texte que le canon ne connaît pas. Un groupe passe si chacun de ses mots est connu. */
export function nomsInconnus(texte: string, c: Canon, autorises: string[] = []): string[] {
  const connus = new Set([...nomsDuCanon(c), ...TERMES_DE_JEU, ...autorises].flatMap((n) => [n, ...mots(n)]).map((m) => m.toLowerCase()));
  return [...new Set(nomsPropres(texte).filter((n) => !connus.has(n.toLowerCase()) && !mots(n).every((m) => connus.has(m.toLowerCase()))))];
}

/** Mots anachroniques présents dans un texte. */
export function anachronismesDans(texte: string, c: Canon): string[] {
  return c.anachronismes.filter((a) => new RegExp(`(^|[^\\p{L}])${a}([^\\p{L}]|$)`, "iu").test(texte));
}

/** Années « an N du Glas » ou « an N du Couronnement » qui tombent après l'année de jeu. */
export function datesImpossibles(texte: string, c: Canon): string[] {
  const { long, court, debutCourt, anDeJeu } = c.calendrier;
  const fautes: string[] = [];
  for (const m of texte.matchAll(/\ban (\d+) (du \p{L}+)/gu)) {
    const n = Number(m[1]);
    if ((m[2] === court && n > anDeJeu - debutCourt) || (m[2] === long && n > anDeJeu)) fautes.push(m[0]);
  }
  return fautes;
}
