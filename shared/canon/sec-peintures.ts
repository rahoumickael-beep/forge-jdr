// Sujets des peintures Flux du Grand Sec (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte post-apo (promptPeinture), provisoire tant que Mickael n'a pas choisi.
// Couvertures des livres, images fortes du Bas-Pays (lore.md, section 2) et figures marquantes. Rien du secret.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_SEC: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "white noon sun, bleached sky, ochre dust",
    sujet: "a twelve-meter sand yacht on truck wheels racing down a dry riverbed three hundred meters wide under a white sky, its square patched sail full of wind, a child standing at the top of the mast, four travellers with water skins and scarves on the deck",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "summer storm light, rain curtain against a bright dry valley",
    sujet: "a lone white mountain with a green forest only at its summit, a summer storm pouring rain on the top and stopping sharply halfway down the slope, people on the dry stony plain below looking up at the falling water",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "evening backlight and campfire embers",
    sujet: "raiders on a sand yacht with a red hand painted on its sail charging across a dry riverbed at dusk, a wild dog pack running alongside, a broken stone bridge arch ahead",
  },
  // ——— Le Bas-Pays ———
  "region-route": {
    cadrage: "scene",
    lumiere: "white noon sun, bleached sky, ochre dust",
    sujet: "a dry riverbed of grey sand and pebbles three hundred meters wide between old stone quays, bridges spanning nothing, a barge lying on its side, sand yachts with square sails moving in the distance",
  },
  "region-avignon": {
    cadrage: "scene",
    lumiere: "harsh midday sun in a stone courtyard",
    sujet: "a long queue of two hundred people with water cans winding through the courtyard of a half-buried medieval palace, at its end a well keeper in a leather apron pouring water by the cup under the eye of four crossbowmen",
  },
  "region-salins": {
    cadrage: "scene",
    lumiere: "smoky sunlight over a sooty beach",
    sujet: "a black sooty beach with a row of twenty copper stills smoking under the sun, children scraping white salt from the bottom of vats with shovels taller than themselves, piles of olive stumps beside each still",
  },
  "region-cevennes": {
    cadrage: "scene",
    lumiere: "orange sunset over grey mountains",
    sujet: "a ridge at sunset with a row of tall white metal towers with blades and antennas turning slowly against the orange sky, dead grey chestnut trees and collapsed stone terraces in the foreground",
  },
  "region-mont-chauve": {
    cadrage: "scene",
    lumiere: "summer storm light, rain curtain against a bright dry valley",
    sujet: "a winding road up a bare white stony mountain, a fortified town and a green pine forest at the summit under a dark storm cloud, rain falling on the top and stopping at mid-slope",
  },
  "region-mur": {
    cadrage: "scene",
    lumiere: "searchlights at night",
    sujet: "a twenty-meter concrete wall across a valley at night lit by searchlights, a vast camp of tents and corrugated metal sheds against it as far as the eye can see, storm clouds over green fields beyond the wall",
  },
  "region-camargue": {
    cadrage: "scene",
    lumiere: "blinding white salt glare",
    sujet: "a rider on a thin horse in the middle of a cracked white salt plain, a long pole in hand, and far away, shimmering in the heat, a herd of black bulls",
  },
  // ——— Figures marquantes ———
  "figure-fabre": {
    cadrage: "portrait",
    lumiere: "white noon sun, bleached sky, ochre dust",
    sujet: "a seventy-year-old sand yacht captain with an oak peg leg and a weathered face, one hand on the mast of his patched-sail sand yacht, squinting at the wind",
  },
  "figure-la-cigale": {
    cadrage: "portrait",
    lumiere: "evening backlight and campfire embers",
    sujet: "a small fast woman of thirty with a red painted hand, standing on the prow of a raider sand yacht, singing, her scarf whipping in the wind",
  },
  "figure-roumanille": {
    cadrage: "portrait",
    lumiere: "harsh midday sun in a stone courtyard",
    sujet: "a heavy bald well keeper of sixty in a leather apron, wet hands resting on the wooden winch of a deep well in a palace courtyard",
  },
  "figure-zelie-brun": {
    cadrage: "portrait",
    lumiere: "orange sunset over grey mountains",
    sujet: "a sixty-year-old woman in a patched white overall and dark goggles, holding an old notebook full of technical drawings, white metal towers behind her on the ridge",
  },
};
