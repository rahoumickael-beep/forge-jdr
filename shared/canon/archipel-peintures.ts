// Sujets des peintures Flux de l'Archipel (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte SF (promptPeinture) : couverture de poche des années 70, gouache à l'aérographe.
// Couvertures des livres, images fortes des régions (lore.md, section 2) et figures marquantes.
import type { Cadrage } from "../charte";

export interface Peinture {
  cadrage: Cadrage;
  lumiere: string;
  sujet: string;
}

export const PEINTURES_ARCHIPEL: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "warm amber dusk light against a deep ultramarine sky",
    sujet: "a battered old cargo starship climbing away from an orange desert spaceport of adobe domes, a colossal pale spiral shell tower rising from the sand behind it, its spiral glowing, four tiny figures standing on the open loading ramp looking up",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "cold pale light running up a spiral tower, deep violet space",
    sujet: "a colossal pale spiral shell tower floating in space above a terraced city planet, a black cathedral-like machine of pipes clamped to its flank venting steam, a long line of tiny starships circling the tower",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "rust-red nebula glow and harsh white lamps",
    sujet: "a tiny scavenger in a pressure suit standing on the hull of a dead six-kilometer battleship inside a red and violet nebula, a lamp in hand, pale translucent figures drifting between the wrecks around her",
  },
  // ——— Régions ———
  "region-solenne": {
    cadrage: "scene",
    lumiere: "dusk light and a cold glow running up the spiral",
    sujet: "a colossal pale spiral shell tower in low orbit above a planet-wide city of white terraces, a black organ-like machine of pipes clamped to its flank like a leech, jets of steam, a ring of tiny ships circling it like gulls",
  },
  "region-valcourt": {
    cadrage: "scene",
    lumiere: "red dwarf sunlight through rust-colored smog",
    sujet: "a gigantic new organ machine of pipes and coils, tall as a cathedral, rolling out of an immense foundry on a platform pulled by tugboats, thousands of workers in helmets watching from steel walkways, chimneys ten kilometers high behind",
  },
  "region-ancre": {
    cadrage: "scene",
    lumiere: "grey dawn light through fine rain",
    sujet: "a procession of villagers in rain cloaks walking along a stone causeway across a misty lake toward a pale spiral tower in the water, laying broken crystal blades at the foot of a black pipe machine, a gaunt figure in a long black coat watching",
  },
  "region-ilvae": {
    cadrage: "scene",
    lumiere: "deep green underwater light falling from far above",
    sujet: "a tall blue-green humanoid diver with gills at the neck floating before a submerged pale spiral tower, its glow lighting shoals of fish, a huge hand-shaped imprint pressed into the stone",
  },
  "region-karrag": {
    cadrage: "scene",
    lumiere: "orange forge fire in an underground hall",
    sujet: "a great hall carved in black basalt where forty massive grey four-armed people hammer together on a single armor plate, sparks flying, their mouths open in a work chant, chains and hooks hanging from the vault",
  },
  "region-frange": {
    cadrage: "scene",
    lumiere: "warm amber dusk light and orange dust",
    sujet: "a battered cargo starship landing in orange dust on a frontier spaceport of adobe domes, a half-buried pale spiral tower behind the town, its spiral light going dark for one second, dockworkers shielding their eyes",
  },
  "region-brisants": {
    cadrage: "scene",
    lumiere: "blood-red nebula glow",
    sujet: "a tiny scavenger in a pressure suit standing on the hull of a dead battleship six kilometers long inside a red and violet nebula, thousands of shipwrecks drifting around, a lamp in her hand",
  },
  "region-mondes-eteints": {
    cadrage: "scene",
    lumiere: "faint starlight on grey stone",
    sujet: "the dead grey shell of a colossal spiral tower split open from top to bottom, floating alone in darkness, and far behind it an immense pale silhouette walking slowly away into the stars",
  },
  // ——— Figures ———
  "figure-ildefonse": {
    cadrage: "portrait",
    lumiere: "cold white palace light from a high window",
    sujet: "an old emperor of eighty with a hard thin face and sunken eyes, a white high-collared robe embroidered with a crowned tower, one bony hand resting on a cane topped with pale stone",
  },
  "figure-ombeline": {
    cadrage: "portrait",
    lumiere: "warm candle-like light from one side",
    sujet: "a young princess of twenty-four with dark braided hair and an attentive careful gaze, a white court gown with a high collar, her hand resting on a small pale stone pendant",
  },
  "figure-malachie-orsat": {
    cadrage: "portrait",
    lumiere: "cold blue light from below",
    sujet: "a very tall thin man of fifty with grey hair combed back and a gentle tired face, a long black coat with a mouth sewn shut embroidered on the chest, a blackened crystal blade held upright",
  },
  "figure-ysolde-valcourt": {
    cadrage: "portrait",
    lumiere: "red furnace glow",
    sujet: "a stern woman of forty-seven with short iron-grey hair and precise eyes, a black coat with a golden organ pipe brooch, holding a thick ledger of figures",
  },
  "figure-neva-arrault": {
    cadrage: "portrait",
    lumiere: "warm amber dusk light",
    sujet: "a weathered woman commander of forty with a scar across her jaw and a loud laugh, a faded navy officer coat with the insignia torn off and an open red star painted on the shoulder",
  },
  "figure-quassi": {
    cadrage: "portrait",
    lumiere: "green light through water and glass",
    sujet: "an ancient blue-green aquatic matriarch with deep wrinkled skin and closed gills, floating in a tall glass water tank, jeweled rings on long webbed fingers, a shrewd faint smile",
  },
};
