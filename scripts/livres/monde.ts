// Le monde dont on fabrique les livres : npx tsx scripts/livres/index.ts tout dist-livre --monde=archipel
// Aubreterre par défaut. Chaque monde fournit ses planches, ses chapeaux, ses couvertures et ses familles.
import type { Family } from "../../shared/bestiary";
import type { GenreId } from "../../shared/types";
import { ARCHIPEL_LIVRES } from "./monde-archipel";
import { ASILE_LIVRES } from "./monde-asile";
import { AUBRETERRE_LIVRES } from "./monde-aubreterre";
import { ILES_LIVRES } from "./monde-iles";
import { NOYES_LIVRES } from "./monde-noyes";
import { RESIDENCE_LIVRES } from "./monde-residence";
import { SEC_LIVRES } from "./monde-sec";
import { TERNELANDE_LIVRES } from "./monde-ternelande";

export interface FamilleDuLivre {
  id: Family;
  titre: string;
  chapeau: string;
  texte: string[];
  illu: [string, string];
}

export interface Monde {
  /** Suffixe des fichiers : livre-des-joueurs-<id>.pdf */
  id: string;
  genre: GenreId;
  nom: string;
  /** « d'Aubreterre », « de l'Archipel » */
  de: string;
  /** « à Aubreterre », « à l'Archipel » */
  a: string;
  campagne: string;
  /** content/<monde> : lore.md, joueurs/*.md, illustrations/ */
  dossier: string;
  /** Feuille de style ajoutée après la commune (couleurs, polices du monde), et polices Google à charger. */
  css?: string;
  polices?: string;
  joueurs: {
    chapeauMonde: string;
    illuMonde: [string, string, "large" | "colonne" | "pleine" | "portrait", string];
    chapeauOrigines: string;
    texteOrigines: string;
    chapeauClasses: string;
    encartCreation: string;
    chapeauRegles?: string;
    couverture: string;
    sousTitre: string;
    figures: Record<string, string>;
    portraits: Record<string, string>;
  };
  mj: {
    planches: Record<string, [string, string, string]>;
    introRencontres: string;
    encartRencontres: string;
    chapeauRencontres: string;
    planchesScenarios: Record<string, string>;
    couverture: string;
    sousTitre: string;
  };
  bestiaire: {
    familles: FamilleDuLivre[];
    avantPropos: string;
    couverture: string;
    sousTitre: string;
  };
}

const MONDES: Record<string, Monde> = { aubreterre: AUBRETERRE_LIVRES, archipel: ARCHIPEL_LIVRES, ternelande: TERNELANDE_LIVRES, residence: RESIDENCE_LIVRES, noyes: NOYES_LIVRES, sec: SEC_LIVRES, asile: ASILE_LIVRES, iles: ILES_LIVRES };
const choix = process.argv.find((a) => a.startsWith("--monde="))?.slice("--monde=".length) ?? "aubreterre";
if (!MONDES[choix]) throw new Error(`Monde inconnu : ${choix} (${Object.keys(MONDES).join(", ")})`);

export const MONDE: Monde = MONDES[choix];
