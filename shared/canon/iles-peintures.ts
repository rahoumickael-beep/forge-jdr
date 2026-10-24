// Sujets des peintures Flux des Îles du Vent (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte pirates (promptPeinture), provisoire tant que Mickael n'a pas choisi : marine à l'huile du XVIIIe siècle.
// Couvertures des livres, images fortes des îles (lore.md, section 2) et figures marquantes. Rien du secret : ni le faux argent,
// ni le nom de la frégate blanche, ni ce qu'elle charge ou coule. Le Navire blanc n'est montré que comme les marins le voient : une coque pâle sur l'eau.
// 1716 : voiles, bois, goudron, poudre noire, pistolets à silex, mousquets, sabres, lanternes à huile. Rien d'après.
// Aucun cliché de cinéma : ni tête de mort sur le pavillon, ni jambe de bois, ni perroquet, ni cache-œil, ni carte au trésor.
// Les marrons, les plongeurs et les captifs sont des personnes : debout, le regard droit, à leur tâche, jamais enchaînés ni humiliés pour faire un décor.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_ILES: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "golden sunset light over a deep teal bay",
    sujet: "a sloop under full sail entering a deep bay between two rocky capes at sunset, a black cloth pennant at her masthead, a cannon shot puffing white smoke from her bow, twenty ships at anchor ahead and a crowd running along a stone quay toward a small town of timber houses on stilts",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "cold pale dawn light on a dark ink-blue sea",
    sujet: "a tall frigate with a bone-white hull lying still on a calm dark sea at first light, her sails furled and her masthead bare, a thin bank of mist around her, and far in the foreground a small boat of fishermen rowing hard away with their backs turned",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "storm light, a green-black sky and a band of low gold sun",
    sujet: "a small sloop heeled hard in a heavy sea under a towering storm cloud, her crew hauling on the ropes, three sharks circling in the green wave beside her hull, and on the horizon a brigantine with patched dark sails closing in",
  },
  // ——— Les îles ———
  "region-anse-aux-lames": {
    cadrage: "scene",
    lumiere: "golden sunset light over a deep teal bay",
    sujet: "a deep blue bay between two rocky capes at sunset, twenty ships at anchor, a brigantine coming in under every sail and firing a cannon shot to announce her prize, a crowd running along a stone quay, timber houses on stilts, a church with a palm-thatched roof and a hilltop battery of eight cannon",
  },
  "region-bancs-de-floride": {
    cadrage: "scene",
    lumiere: "bright turquoise midday light, hard reflections on shallow water",
    sujet: "a low coast of sand and mangroves on clear turquoise water six fathoms deep, a rowing boat floating above the wreck of a great ship whose masts stand out of the sea, a diver breaking the surface with a rope at his waist and a heavy silver bar blackened and crusted with shells in his arms, and a hundred paces away on the beach a Spanish soldier counting bars in a ledger",
  },
  "region-la-havane": {
    cadrage: "scene",
    lumiere: "soft morning light off the water, pale gold on white stone",
    sujet: "the harbour of Havana at morning, a great chain being hauled across the water to close the port, the stone fortress of the Morro on its headland, galleons and church towers beyond, and on a palace balcony a small thin man in black with his back to the bay, a rosary in his hand, reading his prayers in a low voice",
  },
  "region-nassau": {
    cadrage: "scene",
    lumiere: "warm lantern light and a red evening sky",
    sujet: "tents made of stolen sails and huts of planks torn from wrecks on a white beach at evening, barrels marked with the brands of ten ports, a quartermaster standing on a wreck crate reading a long paper aloud to three hundred men who raise their fists at each article, a ruined fort and a natural harbour crowded with sloops behind them",
  },
  "region-saint-pierre": {
    cadrage: "scene",
    lumiere: "high tropical sun, sharp shadows on a stone quay",
    sujet: "the quay of a French colonial port under a green volcano whose peak wears a cloud that never moves, hundreds of sugar barrels stacked in rows, warehouses with tiled roofs, merchants in long coats checking ledgers, and laden ships at anchor in a calm blue bay",
  },
  "region-mornes": {
    cadrage: "scene",
    lumiere: "green filtered light under a wet forest canopy, mist in the ravines",
    sujet: "a narrow ridge path through steep wet forest in the mountains, a lookout standing upright on a rock above the drop with a conch shell at her belt and her gaze on the valley, and far below in the plain a thin column of smoke from a distant sugar plantation",
  },
  "region-fosse-de-bahama": {
    cadrage: "scene",
    lumiere: "dusk light, indigo water and a thin band of pale gold",
    sujet: "a strait where the sea turns almost black, a fast current streaming north in long dark ribbons, a torn cork buoy swept along on its broken line, and very far at the horizon a single pale shape on the water that is neither a squall nor a sail",
  },
  // ——— Figures marquantes ———
  "figure-faucheux": {
    cadrage: "portrait",
    lumiere: "stormy sea light",
    sujet: "a forty-year-old sea captain with a square jaw and a weathered face, a tricorn hat and a heavy buff coat, an iron hook in place of his left hand resting on a table beside a brass compass, standing on the quarterdeck of a brigantine, a hard and watchful expression",
  },
  "figure-arriaga": {
    cadrage: "portrait",
    lumiere: "soft morning light off the water, pale gold on white stone",
    sujet: "a fifty-five-year-old Spanish governor, small and dry, dressed in black with a white collar, a rosary between his fingers, standing at a palace window with his back half turned to a harbour, a grave and courteous expression",
  },
  "figure-vaucelles": {
    cadrage: "portrait",
    lumiere: "high tropical sun, sharp shadows on a stone quay",
    sujet: "a forty-five-year-old French colonial officer in a powdered wig and a blue coat with gold lace, a linen handkerchief held to his nose, seated at a desk with a quill and a sealed letter beside a window open on a harbour, a smooth polite smile",
  },
  "figure-mere-abla": {
    cadrage: "portrait",
    lumiere: "green filtered light under a wet forest canopy, mist in the ravines",
    sujet: "a dignified sixty-year-old African woman with deep lines at her eyes and a head wrap of indigo cloth, a shawl over her shoulders, seated upright on a stool in front of a thatched house in a mountain village, a conch shell in her lap, her calm direct gaze meeting the viewer as an equal",
  },
  "figure-truscott": {
    cadrage: "portrait",
    lumiere: "warm lantern light and a red evening sky",
    sujet: "a heavy fifty-year-old English merchant in a plum coat and a full white wig, a silk handkerchief in one hand and a ledger under the other arm, standing in a counting house of dark wood at dusk, a smile that is polite and a little too wide",
  },
};
