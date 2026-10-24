// Sujets des peintures Flux de la Cellule Hermès (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte contemporain (promptPeinture) : roman graphique noir, encre franche, une seule touche de rouge (choix de Mickael, 24/10/2026).
// Couvertures des livres, images fortes des lieux (lore.md, section 2) et figures marquantes. Rien du secret : ni ce que le Service est devenu,
// ni ce que le Cabinet assemble, ni le Coffre, ni le Rachat ; la caserne de Luxembourg n'est montrée que de l'extérieur, barrière et guérite.
// Novembre 2026, Europe : gares, trains, caméras, téléphones, conteneurs. Rien de surnaturel, rien de futuriste.
// Aucun logo, aucune marque, aucune vraie personne, aucun vrai bâtiment officiel reconnaissable (ni ministère, ni palais de justice, ni siège de service),
// et jamais rien de la maison de luxe Hermès : le nom de la Cellule ne se voit pas à l'image.
// Les visages sont inventés ; personne n'est montré en train de tirer ni en victime : la violence reste hors cadre.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_HERMES: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "single bare bulb in a dim stairwell, cold fluorescent glow from a station platform behind",
    sujet: "four people in plain dark coats and backpacks walking away along an empty railway platform at dawn, one of them carrying a sealed grey paper envelope, a departure board glowing above them, security cameras on the pillars, a train waiting with its doors open, a wet floor reflecting the lights",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "single desk lamp in a dark back room, cold blue glow of a laptop screen",
    sujet: "a cutting table in the back room of a fabric shop at night, a spread road map weighed down by a thermos and a pair of tailor's scissors, a beige coat over a chair, a grey sealed envelope with a four-digit number written on it, shelves of cotton rolls and button boxes in the shadows, the shop shutter lowered and a thin line of street light under it",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "orange sodium floodlight on a wet container quay at night, sweeping amber beam of a patrol lamp",
    sujet: "a row of anonymous men in dark jackets and a grey van with a bare number plate parked between stacks of blue shipping containers, a dock worker in a hi-vis vest watching from a crane ladder, a customs officer with a torch at the far end of the quay, wind pushing plastic bags along the ground",
  },
  // ——— Les lieux ———
  "region-paris-la-mercerie": {
    cadrage: "scene",
    lumiere: "single seamstress lamp over a cutting table at eleven at night, shop shutter lowered",
    sujet: "the back room of a fabric shop in Paris, four people around a long cutting table with a road map unfolded over a dress pattern, rolls of printed cotton on shelves, buttons in biscuit tins, an old sewing machine in the front window behind a curtain, a strongbox with an old key lock in the corner, quiet and tense faces lit from one side",
  },
  "region-bruxelles-agence-aldenhove": {
    cadrage: "scene",
    lumiere: "grey overcast daylight through tall windows, warm tungsten glow from a reading lamp",
    sujet: "the ground floor of a blackened red-brick townhouse in Brussels, a polished copper nameplate beside the door, inside a room lined floor to ceiling with dictionaries, reams of paper stacked on a wooden desk, a rotary telephone on a bare table at the back, an old man in a cardigan and half-moon glasses reading by the window",
  },
  "region-luxembourg-la-caserne": {
    cadrage: "scene",
    lumiere: "cold blue dawn light at six in the morning, yellow glow from a guard booth",
    sujet: "the entrance of a former barracks converted into a data storage site on the edge of a city, a striped barrier arm, a small guard booth with a lit window, a tall wire fence, an almost empty car park with three cars, a sign reading archives and digital preservation by appointment, a security guard drinking from a paper cup, a camera on a pole",
  },
  "region-geneve-la-banque": {
    cadrage: "scene",
    lumiere: "soft warm lamplight on dark wood panelling, grey lake light through frosted glass",
    sujet: "a wood-panelled private bank salon above a lake, thick carpet, a low table with two cups of tea and a cardboard folder set between them, framed portraits of founders on the walls, a keypad door half open onto a staircase going down, a manager in a charcoal suit watching hands before faces",
  },
  "region-trieste-le-port-franc": {
    cadrage: "scene",
    lumiere: "low cold winter sun through a gale, hard white light on stone and wet iron",
    sujet: "the old free port of a harbour town, a long quay lined with stone warehouses with their doors wide open, forgotten rails in the paving, rusted cranes against a pale sky, a ferry leaving for the far shore, seagulls flattened against the windows by a strong wind, a man in a parka smoking before a warehouse numbered thirty-one",
  },
  "region-rotterdam-la-maasvlakte": {
    cadrage: "scene",
    lumiere: "orange floodlight in the dark before dawn, sweeping white beam of a patrol lamp, grey drizzle",
    sujet: "a vast container terminal at four in the morning, rows of blue shipping containers six high, gantry cranes lit orange, a lone truck reversing with its hazard lights on, a foreman in a hi-vis jacket and hard hat holding a clipboard under a lamp, grey water and wind-bent flags behind",
  },
  "region-marseille-la-joliette": {
    cadrage: "scene",
    lumiere: "hard low November sun on stone quays, warm yellow glow from a bar window at five in the morning",
    sujet: "the old docks of a Mediterranean port converted into offices, ferries moored at the quay for the islands, plastic bags pinned against iron railings by a strong north wind, inside a dockers' bar a zinc counter, two men with short coffees and a woman wiping glasses with her eyes on the glass",
  },
  // ——— Figures marquantes ———
  "figure-mercadier": {
    cadrage: "portrait",
    lumiere: "single seamstress lamp from the side, warm tungsten light in a back room",
    sujet: "a fifty-eight-year-old woman with short grey hair and glasses on a chain, in a beige coat, a steel thermos of tea at her elbow, sitting at a cutting table with a folded grey sheet of paper under her hand, a tired and watchful expression, spools of thread on the shelf behind her",
  },
  "figure-aldebert": {
    cadrage: "portrait",
    lumiere: "hard white overhead light on a station concourse, cold daylight behind",
    sujet: "a forty-four-year-old woman with dark hair tied back, in a dark suit and small earrings, a heavy leather briefcase in one hand and a tricolour card in a black wallet shown once to the camera, standing at the exit of a railway station, calm and exact, her eyes on the viewer",
  },
  "figure-scalvini": {
    cadrage: "portrait",
    lumiere: "bright winter sun on a harbour terrace, hard shadows",
    sujet: "a fifty-two-year-old man with a short beard and a linen jacket, a worn leather watch strap on his wrist, seated at a harbour cafe table with a small cup and a folded newspaper, ferries and cranes behind him, a patient courteous expression that waits for the truth",
  },
  "figure-tournemine": {
    cadrage: "portrait",
    lumiere: "cold overcast light through a glass office wall above a port",
    sujet: "a forty-nine-year-old large man with a shaved head, a wedding ring and a signet ring, in a dark jacket and an open collar, standing at a glass office window above a container terminal with his hands behind his back, a flat unreadable expression, grey vehicles parked below",
  },
  "figure-brandvold": {
    cadrage: "portrait",
    lumiere: "blue glow of two phone screens and a laptop in a dim shared flat",
    sujet: "a thirty-six-year-old woman with short bleached hair and a worn backpack at her feet, two phones on the table in front of her, sitting in a cramped shared flat with cables and papers on every surface, leaning forward with an intense and amused look, a mug going cold",
  },
  "figure-aldenhove": {
    cadrage: "portrait",
    lumiere: "warm tungsten glow of a reading lamp in a room full of paper",
    sujet: "a seventy-one-year-old man in a cardigan and half-moon glasses, standing behind a desk piled with dictionaries and bound translations, one hand resting on a closed drawer, a kind and guarded face that wants only a quiet retirement",
  },
  "figure-pastorelli": {
    cadrage: "portrait",
    lumiere: "warm yellow bar light at five in the morning, cold blue dawn through the window",
    sujet: "a fifty-five-year-old woman behind a zinc counter wiping a glass with a cloth, sleeves rolled, a gold chain at her neck, eyes lowered and attentive, bottles of anisette and rows of small coffee cups behind her, a docker's cap hanging on a hook",
  },
  "figure-meyssonnier": {
    cadrage: "portrait",
    lumiere: "dim dashboard glow and orange street lamp through a van windscreen",
    sujet: "a man of about forty in a dark jacket seated in the passenger seat of a parked grey van, a small spotting scope held to one eye, a thermos in the door pocket, a street of tall houses in the windscreen, patient and professional, his jaw set",
  },
};
