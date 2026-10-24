// Rendu de la carte, version « dessinée ». Le fond est calculé une fois par carte ; les lumières,
// la brume et les pions sont dessinés à chaque image par MapCanvas.
// Chaque type de carte a son fichier : mapDungeon, mapCave, mapNature, mapVillage, mapSpace.
// Étapes communes dans mapCommon, outils d'encre et d'aquarelle dans mapInk.
import type { MapTheme } from "../../shared/genres";
import type { GameMap } from "../../shared/types";
import { createMapCtx, makeMistPattern, materialFor, type Material } from "./mapCommon";
import { renderCave } from "./mapCave";
import { renderDungeon } from "./mapDungeon";
import { renderMer, renderPont } from "./mapMer";
import { renderNature } from "./mapNature";
import { renderSpace } from "./mapSpace";
import { BASE, hash, shade } from "./mapUtil";
import { renderVillage } from "./mapVillage";

export { BASE, hash, makeMistPattern, materialFor, shade, type Material };

export function renderMapImage(map: GameMap, theme: MapTheme, material: Material): HTMLCanvasElement {
  const c = createMapCtx(map, theme, material);
  switch (map.kind) {
    case "caverne":
      return renderCave(c);
    case "nature":
      return renderNature(c);
    case "village":
      return renderVillage(c);
    case "espace":
      return renderSpace(c);
    case "mer":
      return renderMer(c);
    case "pont":
      return renderPont(c);
    default:
      return renderDungeon(c);
  }
}
