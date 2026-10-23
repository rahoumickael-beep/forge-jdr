// Page de travail : apercu.html?kind=donjon&seed=391&genre=fantasy&size=36 (kind=encre : planche des outils d'encre)
// Dessine la carte avec le même moteur que la table, sans partie ni serveur.
import { getGenre } from "../../shared/genres";
import { generateMap } from "../../shared/maps";
import type { GenreId, MapKind } from "../../shared/types";
import { renderInkSheet } from "./apercuEncre";
import { renderTokensPreview } from "./apercuPions";
import { materialFor, renderMapImage } from "./mapRender";

const q = new URLSearchParams(location.search);
const kind = (q.get("kind") || "donjon") as MapKind;
const genre = (q.get("genre") || "fantasy") as GenreId;
const size = Number(q.get("size") || 36);
const map = generateMap({ kind, width: Math.round(size * 1.3), height: size, seed: Number(q.get("seed") || 391) });
const t0 = performance.now();
// kind=encre : planche d'essai des outils de mapInk au lieu d'une carte.
const image = (kind as string) === "encre" ? renderInkSheet(Number(q.get("seed") || 391)) : renderMapImage(map, getGenre(genre).theme, materialFor(genre));
const ms = Math.round(performance.now() - t0);
// pions=1 (vue d'un joueur) ou pions=mj : pions d'exemple, lumière et brouillard par-dessus la carte.
const pions = q.get("pions");
// La police des initiales et des étiquettes, comme à la table (sans attendre plus de 3 s si le réseau manque).
if (pions) await Promise.race([Promise.all([document.fonts.load('20px "IM Fell English SC"'), document.fonts.load('italic 600 16px "Cormorant Garamond"')]), new Promise((ok) => setTimeout(ok, 3000))]);
const shown = pions && (kind as string) !== "encre" ? renderTokensPreview(map, image, pions) : image;
document.body.appendChild(shown);
(window as unknown as { apercu: object }).apercu = { ms, width: shown.width, height: shown.height };
