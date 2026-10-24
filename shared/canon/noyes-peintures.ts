// Sujets des peintures Flux de la Côte des Noyés (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte horreur (promptPeinture), validée par Mickael le 24/10/2026.
// Couvertures des livres, images fortes des lieux (lore.md, section 2) et figures marquantes. Rien du secret.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_NOYES: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "grey dawn mist over a wet beach",
    sujet: "a circle of fishermen in smocks holding their berets, standing on a vast flat beach at low tide around a man in a grey city suit lying on his back as if asleep, four investigators in coats and hats walking toward them from the harbour",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "a single lighthouse beam sweeping through night fog",
    sujet: "a granite lighthouse on a small islet at night, its beam sweeping over a calm sea where a long row of dark heads stands in the water facing the coast, a causeway of shingle leading back to the shore",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "dim green light deep under the sea",
    sujet: "a diver in an old copper helmet standing on the dark sea floor at the edge of a deep trench, a lost leather suitcase and a child's shoe at his feet, pale drifting shapes far below",
  },
  // ——— La côte ———
  "region-saint-clair": {
    cadrage: "scene",
    lumiere: "grey dawn mist over a wet beach",
    sujet: "a grey granite fishing town at the end of a bay, a square church tower, boats resting on the mud of a tidal harbour, a closed seaside hotel with shuttered windows, a small railway station",
  },
  "region-morgue": {
    cadrage: "scene",
    lumiere: "the yellow glow of a single oil lamp in a cold stone room",
    sujet: "ten stone tables in a row in an old fish ice house, ten bodies under white sheets, a cardboard label hanging from each, a country doctor in a waistcoat writing in a notebook",
  },
  "region-rocher-gris": {
    cadrage: "scene",
    lumiere: "moonlight and a lighthouse beam",
    sujet: "a narrow causeway of wet shingle running out to a lighthouse on a granite islet, the sea coming back on both sides in foaming lines, a lone figure with a lantern hurrying along it",
  },
  "region-hague": {
    cadrage: "scene",
    lumiere: "stormy dusk over high cliffs",
    sujet: "an old woman in a white Norman coif standing at the edge of a hundred-meter cliff among heather and dry-stone walls, a lantern in her hand, looking out over a dark churning sea with a row of distant lights on the horizon",
  },
  "region-cherbourg": {
    cadrage: "scene",
    lumiere: "rain over a great harbour",
    sujet: "a grand ocean liner with three red and black funnels at anchor in a vast harbour behind a long sea wall, a small steam launch carrying men in hats toward it through the rain",
  },
  "region-le-havre": {
    cadrage: "scene",
    lumiere: "the warm glow of a desk lamp in a dark office",
    sujet: "an insurance director's oak office, a map of the English Channel pinned to the wall with ten red pins in the same small bay, filing cabinets to the ceiling, a cigar smoking in an ashtray",
  },
  "region-fosse": {
    cadrage: "scene",
    lumiere: "flat grey light over a dead-calm sea",
    sujet: "a small fishing boat motionless on a sea like oil, a fisherman kneeling at the bow hauling up a net, in its meshes a dripping leather suitcase with a faded hotel label",
  },
  // ——— Figures marquantes ———
  "figure-lecuyer": {
    cadrage: "portrait",
    lumiere: "the yellow glow of a single oil lamp in a cold stone room",
    sujet: "a sixty-year-old country doctor with spectacles and a grey moustache, sleeves rolled up, measuring a forearm with a tape beside a sheet-covered table",
  },
  "figure-vauquelin": {
    cadrage: "portrait",
    lumiere: "candlelight in a shuttered seaside parlour",
    sujet: "a forty-five-year-old Parisian medium in a dark velvet dress with a silver wave brooch, her hands flat on a round table, eyes open and fixed on nothing",
  },
  "figure-le-bihan": {
    cadrage: "portrait",
    lumiere: "a lighthouse beam in fog",
    sujet: "a weathered Breton lighthouse keeper of fifty in an oilskin coat at the top of his lighthouse, holding a small notebook full of pencil tally marks",
  },
  "figure-coquart": {
    cadrage: "portrait",
    lumiere: "grey dawn mist over a wet beach",
    sujet: "a gendarme sergeant of forty with a stiff moustache and a buttoned tunic, a kepi with chin strap, a bicycle leaning against him on a sandy road",
  },
};
