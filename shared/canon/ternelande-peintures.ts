// Sujets des peintures Flux de la Ternelande (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte dark fantasy (promptPeinture), validée par Mickael le 24/10/2026.
// Couvertures des livres, images fortes des Comtés (lore.md, section 2) et figures marquantes.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_TERNELANDE: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "torchlight in falling snow at night",
    sujet: "a line of hooded villagers waiting in the snow inside a small courtyard closed by a rusted iron gate, a tall grey sandstone block at its center, a rider in a long grey cloak and a smooth pewter mask standing beside the stone with bare hands, four travellers with packs and spears watching from the gate",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "cold grey light falling through a broken roof",
    sujet: "a long stone table in a hall of ice, a dozen tall grey figures seated upright around it, made of grey ash, heads slightly bowed as if listening, snow drifting down onto their shoulders through the broken roof",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "cold blue light filtered through thick ice",
    sujet: "a fisherman kneeling at a hole cut in a frozen lake with a lantern in his hand, and under the clear ice all around him dozens of pale drowned faces turned up toward the lantern, a lean winter wolf watching from the reeds",
  },
  // ——— Les Comtés ———
  "region-haute-cendre": {
    cadrage: "scene",
    lumiere: "torchlight in falling snow at night",
    sujet: "a city of dark red brick climbing in a spiral around a rocky spur to a windowless spire, and in a gated courtyard at its foot hundreds of people in a line before a grey standing stone three times the height of a man, a pale breath of mist rising from each bowed head that touches the stone",
  },
  "region-neiges-hautes": {
    cadrage: "scene",
    lumiere: "flat white winter daylight and snow glare",
    sujet: "a reindeer sled of hunters halted before a grey cairn of wind-polished stones on an endless snowfield, the snow swept clean all around except on the stones, where old offerings wait untouched, a knitted cap, a tooth, a strand of red thread",
  },
  "region-vaugelee": {
    cadrage: "scene",
    lumiere: "cold blue light filtered through thick ice",
    sujet: "a fishing village of blackened timber houses with thatched roofs reaching the ground on a small island in a frozen lake, a fisherman kneeling at a hole in the ice with a lantern, pale faces under the clear ice turned toward the lantern",
  },
  "region-blancs-bois": {
    cadrage: "scene",
    lumiere: "pale mist light between white birch trunks",
    sujet: "a witch kneeling at the foot of a colossal white birch as wide as a tower, a cut in the bark and a wooden cup beneath it filling with a clear sap, mist drifting between hundreds of pale birch trunks",
  },
  "region-comtes-rouges": {
    cadrage: "scene",
    lumiere: "low autumn light through rain clouds",
    sujet: "a muddy battlefield among vine-covered hills, hundreds of crows over the dead, a rider in a long grey cloak and a pewter mask passing slowly between the bodies, laying a gloved hand on each forehead, a burnt castle on the hill behind",
  },
  "region-saint-memoire": {
    cadrage: "scene",
    lumiere: "candlelight in a cold stone hall",
    sujet: "a scriptorium as long as a church where hundreds of monks write standing at their desks in woollen gloves, their breath visible, and at the far end shelves of grey leather registers rising to the vault",
  },
  "region-landes-effacees": {
    cadrage: "scene",
    lumiere: "flat grey light under a low heather sky",
    sujet: "a woman on the threshold of a farmhouse on a heather moor, her fingers resting on a painted portrait of a stranger, her face puzzled, behind her on the moor children playing a game, a walled-up door in the farmhouse wall",
  },
  "region-brise-glace": {
    cadrage: "scene",
    lumiere: "torchlight in falling snow at night",
    sujet: "a whaling port of tarred plank houses under black cliffs, whale carcasses on the frozen shore, a foreign whaler in a fur coat standing on the icy quay watching grey-cloaked riders pass while the townsfolk close their shutters",
  },
  // ——— Figures marquantes ———
  "figure-garnier-de-vauclair": {
    cadrage: "portrait",
    lumiere: "dim firelight in a stone hall",
    sujet: "a tired old soldier of sixty with a grey beard and a worn velvet regent's coat over mail, sitting alone at a long empty council table, one hand resting on a sealed letter",
  },
  "figure-odeline": {
    cadrage: "portrait",
    lumiere: "candlelight in a cold stone hall",
    sujet: "an old abbess of seventy blind in one eye, in a black habit with a white quill embroidered on the breast, reading a grey leather register held close to her good eye, ink on her fingers",
  },
  "figure-personne": {
    cadrage: "portrait",
    lumiere: "flat grey light under a low heather sky",
    sujet: "a gaunt preacher of uncertain age in a patched grey cloak, an empty circle drawn in ash on his forehead, speaking softly to a small crowd of ragged people on a heather moor",
  },
  "figure-brunissende": {
    cadrage: "portrait",
    lumiere: "warm hearth light in a timber cottage",
    sujet: "a tiny old midwife of eighty with a needle pinned in the hem of her sleeve, counting on her fingers beside a cradle, braided locks of hair and a pewter thimble on the shelf behind her",
  },
};
