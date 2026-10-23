// Vignette peinte d'une figurine, partagée par la carte et la piste d'initiative.
import { BESTIARY } from "../../shared/bestiary";
import { CLASSES } from "../../shared/rules";
import type { Character, Token } from "../../shared/types";

/** Portrait de la fiche, sinon l'illustration de la créature, sinon celle de la classe du personnage (Aubreterre seulement). */
export function figurineDe(t: Token, sheet: Character | undefined): string | undefined {
  if (sheet?.portrait) return sheet.portrait;
  if (t.creatureId && BESTIARY.some((c) => c.id === t.creatureId && c.genre === "fantasy")) return `/pions/${t.creatureId}.webp`;
  const cls = sheet?.genre === "fantasy" ? CLASSES.find((c) => c.genre === "fantasy" && c.name === sheet.archetype) : undefined;
  return cls ? `/pions/classe-${cls.id.replace(/^fantasy-/, "")}.webp` : undefined;
}
