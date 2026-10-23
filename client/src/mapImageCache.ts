// Cache des cartes dessinées : la même carte n'est encrée qu'une fois, qu'elle serve à l'aperçu du MJ
// (onglet Carte) ou à la table une fois posée. Une carte pèse ~15 Mo en mémoire : on n'en garde que trois.
import { getGenre } from "../../shared/genres";
import type { GameMap, GenreId } from "../../shared/types";
import { materialFor, renderMapImage } from "./mapRender";

const KEEP = 3;
const images = new Map<string, HTMLCanvasElement>();

/** Clé d'une carte : genre, type, graine, taille, nom, et une empreinte des cases (une carte retouchée est redessinée). */
function keyOf(map: GameMap, genre: GenreId) {
  let h = 2166136261;
  for (let i = 0; i < map.tiles.length; i++) h = Math.imul(h ^ map.tiles[i], 16777619);
  return [genre, map.kind, map.seed, map.width, map.height, map.name, h >>> 0].join("|");
}

/** Image de la carte, prise dans le cache ou dessinée (entre 0,3 et 1,5 s). */
export function mapImage(map: GameMap, genre: GenreId): HTMLCanvasElement {
  const key = keyOf(map, genre);
  const hit = images.get(key);
  if (hit) {
    images.delete(key);
    images.set(key, hit); // la plus récente en dernier
    return hit;
  }
  const img = renderMapImage(map, getGenre(genre).theme, materialFor(genre));
  images.set(key, img);
  while (images.size > KEEP) images.delete(images.keys().next().value!);
  return img;
}

/** Vrai si la carte est déjà dessinée (l'aperçu peut alors s'afficher sans attendre). */
export function hasMapImage(map: GameMap, genre: GenreId) {
  return images.has(keyOf(map, genre));
}
