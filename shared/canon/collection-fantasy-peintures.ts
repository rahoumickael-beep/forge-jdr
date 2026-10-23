// Sujets des peintures Flux des cartes à collectionner d'Aubreterre (en anglais pour Flux ; jamais de négation).
// Le style vient de la charte (promptPeinture) ; une lumière par famille de cartes, le cadrage selon la famille.
import type { Cadrage } from "../charte";
import type { Famille } from "../collection";

export const LUMIERE_COLLECTION: Record<Famille, string> = {
  objet: "a single candle flame beside it, warm amber light pooling on the cloth, deep black surroundings",
  allie: "torchlight and candlelight, warm browns and dried blood red",
  faveur: "dusk light through wood smoke, muted gold and slate tones",
};
export const CADRAGE_COLLECTION: Record<Famille, Cadrage> = { objet: "objet", allie: "portrait", faveur: "scene" };

/** Sujet de chaque carte sans illustration existante (id → sujet). */
export const SUJETS_COLLECTION: Record<string, string> = {
  "clous-tete-carree": "nine hand-forged square-headed iron nails laid in a neat row on a scrap of dark linen, rough black iron, a small iron hammer beside them",
  "sel-benit": "a small stitched linen pouch spilling a pinch of coarse white salt, its neck sealed with a drop of white wax, on dark cloth",
  "cierge-benit": "a tall white beeswax church candle, barely burned, a frozen drip of wax on its side, standing on dark cloth",
  "ruban-noir": "a worn black silk ribbon tied in a loose bow, lying across dark velvet",
  "insigne-rotonde": "a small cast lead pilgrim badge showing a closed door beneath a crown, threaded on a leather cord, on dark cloth",
  "pot-de-goudron": "a small earthenware pot of glossy black pine tar with a wooden spatula, tar dripping down its side, on dark cloth",
  "lanterne-bleue": "a small iron hand lantern with glowing pale blue glass panes, its flame lit, standing on dark cloth",
  "marteau-fer-froid": "a heavy hand-forged iron hammer, its wooden handle blackened with tar, lying diagonally on dark cloth",
  "laissez-passer": "a folded parchment document with a large red wax imperial seal and lines of violet ink handwriting, on dark cloth",
  "chevaliere-sel": "a heavy silver signet ring with a hinged bezel opened to show a tiny chamber of white salt, on dark cloth",
  "balance-laiton": "a tiny brass balance-scale pendant on a fine chain, its two little pans tilted, on dark cloth",
  "encre-violette": "a squat glass inkwell full of deep violet ink, a goose quill resting in it, violet stains on the cloth",
  "clou-saint-brac": "a single ancient square-headed iron nail, thick and pitted, resting on a folded white altar cloth embroidered with gold thread",
  "relique-ostral": "a fragment of polished black basalt resting in a fold of white linen embroidered with a closed door in gold thread, a faint warm glow on the stone",
  "pleureuse": "a hired mourner woman in a black mourning veil, eyes red from weeping, holding a small hurdy-gurdy against her chest",
  "passeur-noyes": "a weathered peat-bog ferryman with a grey beard and a wide felt hat, holding a long wooden punting staff, black water and reeds behind him",
  "copiste": "a young imperial scribe in a dark wool robe, his right thumb stained violet with ink, clutching a bundle of archive scrolls",
  "saunier-hanse": "a shrewd salt merchant in a fine salt-stained coat and a silver signet ring, weighing coarse white salt on a small brass balance",
  "peseur": "an elderly mage in a dark scholar's gown, a small brass balance pendant on his chest, a thick leather ledger under his arm",
  "mere-gisle": "an old peat-bog wise woman with deep wrinkles and a woollen shawl, holding a clod of dark peat in both hands, a necklace of reed charms",
  "odile-varlet": "an elegant drowned merchant woman come back from death, pale bluish skin and dark lips, a wry smile, a rich water-stained silk gown, a black ribbon at her left wrist",
  "faveur-pelerins": "a muddy pilgrim camp at dusk, hundreds of small campfires stretching to the horizon, pilgrims with walking staffs and candles",
  "faveur-confrerie": "the inside of a nailers' guild lodge, rough oak tables, hammers and bundles of iron nails hanging on the wall, men with an iron nail through the left earlobe sharing bread",
  "faveur-veilleuses": "a healer of a lay sisterhood in a plain grey dress tending a sick man in a cottage, a lantern with blue glass glowing on the table",
  "faveur-hanse": "a salt merchants' counting house beside a lagoon, white pyramids of salt outside the window, two merchants shaking hands over an open ledger",
  "faveur-chancellerie": "vast vaulted archives under a city, endless shelves of scrolls, scribes with violet-stained thumbs writing by candlelight",
  "faveur-peseurs": "a tall narrow brick tower with its only door high up on the third floor, a wooden footbridge lowered toward it, a mage crossing",
  "faveur-rendus": "a hidden cellar where pale bluish dead men and women sit around a single candle, black ribbons tied at their wrists, quietly playing dice",
  "faveur-legions": "a grey stone fort on a heather moor in the rain, soldiers in red cloaks swinging the gate open, a smoking pyre in the yard",
  "benediction-enfant": "a small girl with short black hair holding the hand of a kneeling traveler among pilgrim campfires, risen dead men sitting calmly on the ground behind them",
};

/** Cartes d'événement de la pioche du MJ (les objets de la pioche reprennent les peintures de la collection). */
export const LUMIERE_EVENEMENTS = "pale overcast light fading to dusk, slate blue shadows, a few warm lantern glows";
export const SUJETS_EVENEMENTS: Record<string, string> = {
  "evenement-glas": "a small stone village church at nightfall, its bell swinging alone in the open belfry, frightened villagers in nightshirts holding candles at their doors and looking up",
  "evenement-file-des-leves": "a long line of pale dead villagers in burial shrouds walking one behind another across a muddy cart track through heather, all at the same pace, two travelers stepping aside",
  "evenement-barrage": "a heavy iron chain stretched across a narrow stone bridge, two guards in long white cloaks beside a wooden lectern with an open register, one searching a traveler's sack",
  "evenement-recruteurs": "a sergeant in a red cloak lining up village men in front of a timber barn, mothers watching from small cottage windows, a muddy farmyard",
  "evenement-pelerins": "a vast muddy pilgrim camp, hundreds of small campfires, an old pilgrim woman pointing east, small bare footprints of a child pressed in the mud in the foreground",
  "evenement-sel": "a market stall in a timber village square, a salt merchant chalking a high price on a slate board, a weeping woman before the stall beside a wheelbarrow carrying a shrouded body",
  "evenement-veillee": "an exhausted woman in a plain grey dress sitting beside a shrouded corpse laid on a table in a cottage, her head nodding with sleep, a lantern with blue glass beside her",
  "evenement-faux-clous": "a sly peddler with a wooden tray of iron nails at a village crossing, a customer bending one of the nails between two fingers",
  "evenement-rendu": "a pale man with bluish skin standing at a farmhouse door, a black ribbon tied at his left wrist, the wary farmer gripping a hammer behind the half-open door",
  "evenement-attendants": "people lying in a neat row at the edge of a heath, hands crossed on their chests, braided reed bracelets on their wrists, one of them with eyes open",
  "evenement-inquisiteur": "an inquisitor in a heavy white robe, white wax dripped on his wrist, with armed men searching a village graveyard at dusk, a scorched patch of earth beside an open grave",
  "evenement-voix": "a traveler asleep wrapped in a cloak beside a dying campfire, the faint translucent figure of a woman kneeling at his side and whispering in his ear",
};
