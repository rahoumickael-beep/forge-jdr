// Accès au code du MJ : les fichiers dist/assets/mj-* contiennent le bestiaire, la bibliothèque et le canon, secrets
// compris. Le serveur ne les sert qu'au navigateur qui a présenté la clé MJ d'une partie (cookie posé par /api/mj/acces).
// En développement (Vite sur 5173), rien n'est gardé : c'est la machine du MJ.
import { getRoom } from "./rooms";

export const COOKIE_MJ = "forge_mj";
export const FICHIER_MJ = /^\/assets\/mj-[^/]*$/;

/** Valeur du cookie si la clé est la bonne, sinon rien. */
export function cookieMJ(code: unknown, gmKey: unknown): string | undefined {
  const room = typeof code === "string" ? getRoom(code) : undefined;
  if (!room || typeof gmKey !== "string" || gmKey !== room.gmKey) return undefined;
  return encodeURIComponent(`${room.state.code}:${gmKey}`);
}

/** Le navigateur qui envoie ces cookies est-il le MJ d'une partie en cours ? */
export function estMJ(cookies: string | undefined): boolean {
  const brut = (cookies ?? "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE_MJ}=`))?.slice(COOKIE_MJ.length + 1);
  if (!brut) return false;
  let valeur: string;
  try {
    valeur = decodeURIComponent(brut);
  } catch {
    return false;
  }
  const i = valeur.indexOf(":");
  return i > 0 && cookieMJ(valeur.slice(0, i), valeur.slice(i + 1)) !== undefined;
}
