// Sujets des peintures Flux de la Résidence (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte cyberpunk (promptPeinture), provisoire tant que Mickael n'a pas choisi.
// Couvertures des livres, images fortes des quartiers (lore.md, section 2) et figures marquantes.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_RESIDENCE: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "neon magenta and cyan reflections in falling rain",
    sujet: "a long apartment tower corridor four hundred meters above a drowned city at night, a hundred identical grey doors, buckets catching rain from the ceiling, four young tenants standing guard in front of one door with a family behind them, green numbers glowing on their wrists",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "cold blue light of a single screen in a dark room",
    sujet: "an empty penthouse office at the top of a glass tower above yellow clouds, a tall leather armchair facing a wall of screens that all show the same old man's face speaking, the city far below in the rain",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "sodium orange streetlight through drizzle and steam",
    sujet: "eviction officers in yellow armbands and opaque visors coming out of a tower elevator into a crowded rainy corridor, a surveillance drone hovering above them, a guard dog straining on its leash",
  },
  // ——— Les quartiers ———
  "region-hauts": {
    cadrage: "scene",
    lumiere: "bright clean sunlight above a sea of yellow smog clouds",
    sujet: "a reception on a garden terrace at the top of a glass tower, guests in silk who all look thirty, and an old waiter with trembling hands holding out a tray, the sea of yellow clouds below the railing",
  },
  "region-blocs": {
    cadrage: "scene",
    lumiere: "neon magenta and cyan reflections in falling rain",
    sujet: "a concrete residential corridor three hundred meters high with hundreds of identical doors, a family sitting on its suitcases in front of one of them while an officer in a yellow armband changes the lock",
  },
  "region-port-franc": {
    cadrage: "scene",
    lumiere: "green neon in the dark hold of a cargo ship",
    sujet: "a night market in the hold of a cargo ship, stalls made of containers, a young-looking old woman counting glowing wrist implants on the plate of a brass scale, dockers in rain capes queuing",
  },
  "region-friche": {
    cadrage: "scene",
    lumiere: "grey dawn light over flooded ruins",
    sujet: "the roof of a half-drowned apartment building covered in vegetable gardens, children fishing from a sixth floor window with rowing boats tied between the balconies, distant towers like a lit cliff in the rain",
  },
  "region-jardin": {
    cadrage: "scene",
    lumiere: "soft artificial daylight under a vast glass dome",
    sujet: "a park bench under a lime tree inside a huge glass dome, a tired woman in a cheap raincoat checking the green numbers on her wrist before sitting down, white marble clinic facades behind the trees",
  },
  "region-souterrains": {
    cadrage: "scene",
    lumiere: "headlights of an abandoned subway train",
    sujet: "a flooded metro platform knee-deep in black water, lit by the still-burning headlights of an abandoned train, a half-erased station name in old tiles on the wall, a maintenance worker wading with a lamp",
  },
  "region-digue": {
    cadrage: "scene",
    lumiere: "white floodlights in a night storm",
    sujet: "a thirty-meter concrete sea wall in a night storm, waves higher than the wall breaking under the floodlights, figures in yellow oilskins clinging to the railings, giant pumps and valves along the wall",
  },
  // ——— Figures marquantes ———
  "figure-victoire-lancelin": {
    cadrage: "portrait",
    lumiere: "bright clean sunlight above a sea of yellow smog clouds",
    sujet: "an elegant woman who looks thirty-five with very old eyes, pale grey suit, a golden key pin on her lapel, smiling kindly behind a glass desk in a sunlit tower office",
  },
  "figure-mado-ferrandi": {
    cadrage: "portrait",
    lumiere: "neon magenta and cyan reflections in falling rain",
    sujet: "a tired woman of thirty who looks forty, former nurse in a worn parka, a crossed-out key painted on the door behind her, talking fast to a crowd of neighbours in a stairwell",
  },
  "figure-la-grue": {
    cadrage: "portrait",
    lumiere: "green neon in the dark hold of a cargo ship",
    sujet: "a tall woman of uncertain age standing on top of a stack of containers in a dark port, a long coat, a sailor's knot tattooed over the glowing implant on her wrist, harbour cranes behind her",
  },
  "figure-frere-lazare": {
    cadrage: "portrait",
    lumiere: "grey dawn light over flooded ruins",
    sujet: "a gaunt sixty-year-old former surgeon with a scar on his left wrist, rolled sleeves, stitching a young man's wrist in a boat moored between flooded balconies",
  },
};
