// Sujets des peintures Flux de l'Exposition éternelle (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte steampunk (promptPeinture), provisoire tant que Mickael n'a pas choisi : gravure victorienne rehaussée d'aquarelle.
// Couvertures des livres, images fortes des lieux (lore.md, section 2) et figures marquantes. Rien du secret : ni ce qui dort sous le Champ,
// ni ce que le Commissariat en tire, ni la Nuit du Siècle. Les machines ne sont montrées que comme la foule les voit : vapeur, laiton, courroies, lampes à arc.
// Paris, 1899 : fer, verre, vapeur, électricité naissante, gaz, dirigeables à enveloppe, automates à cames. Rien d'après, aucune magie.
// La Tour peut apparaître, comme dentelle de fer dans le ciel ; aucune personne réelle, aucun créateur de la foire, aucune célébrité.
// Les Gens des Villages sont des personnes : debout, le regard droit, à leur ouvrage, jamais en spectacle ni en bête curieuse ; la corde et le guichet restent dans le décor.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_EXPO: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "pale gaslit haze at dusk, a thousand electric lamps coming alight across a crowded fairground",
    sujet: "a vast fairground of glass halls and iron pavilions at dusk, a lattice iron tower rising into the haze behind a long grey dirigeable moored at its summit, thousands of visitors in top hats and bonnets streaming along a lamplit avenue between steam-powered exhibits, brass pipes and a great clock face glowing above the gate",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "cold blue electric glare from arc lamps in a vast empty iron hall at night",
    sujet: "the interior of an immense glass-and-iron machine hall at midnight, enormous steam engines on marble plinths standing silent in rows, overhead travelling cranes with empty grilled platforms, a single lamp on a long cable swinging slightly, a lone night cleaner far down the aisle with a bucket and a lantern, the glass roof black above",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "hard sodium-yellow gas glare and drifting white steam",
    sujet: "a tall clockwork automaton in a ticket-collector's cap with brass cams turning behind a glass chest panel, standing at an iron turnstile gate, a uniformed guard with a baton at his side and a crowd of visitors halting in the steam behind them, a lattice tower faint in the haze",
  },
  // ——— Les lieux ———
  "region-galerie-des-machines": {
    cadrage: "scene",
    lumiere: "warm gold light through a high glass roof, steam rising in shafts",
    sujet: "the interior of a gigantic glass-and-iron machine hall four hundred metres long under one unbroken roof span, steam engines of thirty tons turning on marble plinths, drive belts running up into the roof, overhead travelling cranes carrying visitors on grilled platforms like cages, mechanics in blue smocks tending the machines below",
  },
  "region-la-tour": {
    cadrage: "scene",
    lumiere: "soft pink evening light over the roofs of Paris, a beam of electric light sweeping from the summit",
    sujet: "the third platform of a lattice iron tower three hundred metres high, a grey dirigeable moored at a mast with its gangway down and a ticket inspector counting passengers on a slate, photographers setting up tripods at the railing, the roofs of Paris spread out in the mist below",
  },
  "region-le-trocadero": {
    cadrage: "scene",
    lumiere: "warm lantern and floodlight glow on cascading water at nightfall",
    sujet: "a grand palace with two tall towers on the bank of a river at nightfall, long cascades of lit fountains falling down its terraces, clerks in dark coats climbing the steps with ledgers, a guard in a grey-blue kepi at every landing, the great hall of patents glowing behind tall windows",
  },
  "region-palais-de-l-electricite": {
    cadrage: "scene",
    lumiere: "bright white electric glare reflecting on polished marble and brass",
    sujet: "a vast glass hall filled with dynamos as tall as houses, switchboards of white marble covered with brass dials and thick cables, mechanics in white smocks walking along iron galleries, blue sparks leaping on a distant terminal, crowds of visitors watching from a railed balcony",
  },
  "region-les-villages": {
    cadrage: "scene",
    lumiere: "late afternoon sun low across an open esplanade, long warm shadows",
    sujet: "an esplanade before a domed building with a long row of village houses behind a low rope, a Senegalese compound of round thatched huts and millet granaries beside an Annamese pagoda and a house on stilts, women weaving and men forging iron at their own work with calm faces, children playing in the lane, a ticket booth at the far end and visitors on the other side of the rope",
  },
  "region-grenelle-et-javel": {
    cadrage: "scene",
    lumiere: "coal smoke and low amber sunset light over a working-class district",
    sujet: "a working-class district of tall chimneys and red brick tenements at six in the evening, thousands of workers in blue smocks streaming out through a factory gate with bread under their arms, washing lines strung across a narrow courtyard, a gas lamp on the corner, a river carrying soot behind the roofs",
  },
  "region-les-carrieres": {
    cadrage: "scene",
    lumiere: "single oil lantern light in a dripping limestone tunnel, damp gleam on stone",
    sujet: "a limestone quarry gallery with square stone pillars supporting the vault, shallow pools of clear water on the floor, a boy from the district holding a lantern at the foot of a worn stone staircase, a freshly painted iron grille at the end of the passage, white salt on the walls",
  },
  "region-la-butte": {
    cadrage: "scene",
    lumiere: "warm yellow lamplight from a cabaret window and a violet night sky",
    sujet: "a hillside street of windmills, vineyards and cabarets at night, a marble-topped zinc table outside a lit cabaret where a chansonnier in a green coat sings to a table of painters and seamstresses, and far below across the city the great fairground glowing like an ember with a lattice tower at its centre",
  },
  // ——— Figures marquantes ———
  "figure-faverolle": {
    cadrage: "portrait",
    lumiere: "warm lamplight from a green banker's lamp in a panelled office",
    sujet: "a sixty-one-year-old man with a white imperial beard and a heavy brow, in a black frock coat with a rosette in the lapel, seated behind a vast desk of dark wood covered in plans and ledgers, one hand resting on a brass bell, a polite and unreadable expression, a window onto fountains behind him",
  },
  "figure-dorlhac": {
    cadrage: "portrait",
    lumiere: "soft grey daylight through a workshop skylight",
    sujet: "a fifty-five-year-old inventor with a well-groomed moustache and spectacles, in a good grey frock coat with a brass plate pinned to the lapel, standing in his workshop beside an unfinished apparatus of copper tubes and springs, a rolled plan under his arm, a smile that is polite and a little too practised",
  },
  "figure-cordebard": {
    cadrage: "portrait",
    lumiere: "grey daylight through a sooty window, steam in the background",
    sujet: "a forty-four-year-old woman with strong forearms and tied-back hair, in a dark wool dress and a canvas apron, a spanner pushed through her belt, standing at a table of union papers in a brick meeting room of the machinists' union, her direct and tired gaze on the viewer",
  },
  "figure-ndoye": {
    cadrage: "portrait",
    lumiere: "late afternoon sun low across an open esplanade, long warm shadows",
    sujet: "a dignified fifty-year-old Senegalese elder in a long indigo boubou and a white cap, a brass medal turned face-in on his chest, standing upright before a round thatched house with his hands folded on a carved staff, his calm direct gaze meeting the viewer as an equal",
  },
  "figure-hanh": {
    cadrage: "portrait",
    lumiere: "soft diffuse daylight through paper screens",
    sujet: "a thirty-eight-year-old Vietnamese woman in a dark ao dai and a fitted jacket, a ledger open before her and a small abacus under her fingers, seated at a plain table in a pagoda hall, composed and watchful, her chin up and her eyes on the viewer",
  },
  "figure-mauvezin": {
    cadrage: "portrait",
    lumiere: "yellow gaslight on a crowded printing-shop floor",
    sujet: "a twenty-nine-year-old woman reporter in a plain dark jacket and a straw boater, a pencil behind her ear and a stenographer's notebook in her hand, leaning on a type case in a cramped printing shop, ink on her fingers, a quick and mocking smile",
  },
  "figure-gerfaux": {
    cadrage: "portrait",
    lumiere: "violet night light and a spill of yellow lamplight from a cabaret door",
    sujet: "a thirty-three-year-old man with a thin face and a black felt hat, a red scarf at his throat and a rolled poster under one arm, leaning in a lamplit doorway of a hillside street, a stub of white chalk in his fingers, an intense and amused expression",
  },
  "figure-petrel": {
    cadrage: "portrait",
    lumiere: "dim amber lantern light in a machine cellar, drifting steam",
    sujet: "a nineteen-year-old mechanic in a patched blue smock with a bucket and a long brush, standing among the iron legs of a huge steam engine in a cellar, grease on his face, a lantern hooked at his belt, looking up with a wary and curious expression",
  },
};
