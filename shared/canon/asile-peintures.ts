// Sujets des peintures Flux du Champ-d'Asile (en anglais pour Flux ; jamais de négation ; la lumière en premier).
// Le style vient de la charte western (promptPeinture), validée par Mickael le 24/10/2026 : peinture de l'Ouest du XIXe siècle.
// Couvertures des livres, images fortes des terres du Champ (lore.md, section 2) et figures marquantes. Rien du secret :
// ni le Traité ni sa date n'apparaissent dans un sujet.
// 1878 : chevaux, diligences, locomotives à vapeur, lampes à huile, télégraphe. Rien d'après.
// Les Numunuu sont un peuple réel : cavaliers, familles, chevaux, tipis, étoffes et cuirs cousus ; jamais de coiffe de cinéma ni de caricature.
import type { Peinture } from "./archipel-peintures";

export const PEINTURES_ASILE: Record<string, Peinture> = {
  // ——— Couvertures ———
  "couverture-joueurs": {
    cadrage: "couverture",
    lumiere: "golden late afternoon sun low over the prairie, ochre dust",
    sujet: "a stagecoach drawn by six horses galloping along a dusty trail across open prairie toward a distant brick and whitewashed wood town with a wooden church steeple, a driver in a wide hat leaning forward, three travellers and a guard on the roof, a steam locomotive trailing white smoke far behind on the horizon",
  },
  "couverture-mj": {
    cadrage: "couverture",
    lumiere: "dusk light, red sky over the plateau",
    sujet: "a tall stone cross six feet high standing on the edge of a red plateau at dusk, two riders on horseback facing each other ten paces apart on either side of it, one in a wide hat with a carbine across his saddle, the other bare-headed with a long braid and a blanket over his shoulder, vast empty prairie behind them",
  },
  "couverture-bestiaire": {
    cadrage: "couverture",
    lumiere: "storm light, dark sky and a band of low gold sun",
    sujet: "outlaw riders in dusters galloping across a river ford at dusk behind a pack of stolen horses, spray flying, a masked woman in a black mourning veil leading them, a stand of mesquite on the far bank and a steam train on a distant ridge",
  },
  // ——— Les terres du Champ ———
  "region-bonne-esperance": {
    cadrage: "scene",
    lumiere: "high noon sun, hard shadows on a dusty square",
    sujet: "a small town of sun-dried brick and bleached wood on a bend of a river, a square plaza with a wooden church steeple casting its long shadow across the horse market, a faded blue white and red cloth hanging from an upstairs window, tobacco leaves drying on a balcony",
  },
  "region-fort-rail": {
    cadrage: "scene",
    lumiere: "evening steam light, orange sky",
    sujet: "a steam locomotive standing still at the end of the rails at dusk, white steam rising into an orange sky, a raw timber station, canvas tents and saloons behind it, and ten paces ahead of the engine on the open prairie a small stone boundary marker carved with an eagle and a bee",
  },
  "region-ranchos": {
    cadrage: "scene",
    lumiere: "golden sunset on a stone porch",
    sujet: "a stone ranch house with a long covered gallery at sunset, an old rancher in a black coat sitting with a cavalry sabre across his knees, looking out over a corral of horses and longhorn cattle, and far off a file of surveyors carrying sighting rods and wooden stakes across the grass",
  },
  "region-croix-de-pierre": {
    cadrage: "scene",
    lumiere: "golden late afternoon sun low over the prairie, ochre dust",
    sujet: "a stone cross six feet high at the edge of a plateau, a trading post of low timber and stone behind it, two riders stopped ten paces apart on either side, one a Mexican vaquero in a flat-brimmed hat and one a Comanche rider in a leather shirt, each with a long gun across the saddle, their horses quiet",
  },
  "region-comancheria": {
    cadrage: "scene",
    lumiere: "dusk light, red sky over the plateau",
    sujet: "a red canyon at dusk with a river running through it, forty tipis of painted hide along the bank, smoke rising from cooking fires, children watering horses at the river, and sacks of flour sewn end to end hanging at a tipi door with the name of the town printed upside down on the cotton",
  },
  "region-frontiere-du-sud": {
    cadrage: "scene",
    lumiere: "moonlight on a river ford, silver and deep blue",
    sujet: "a river ford under a full moon, a herd of horses crossing the shallow water in silence with their manes silvered, a lone rider in a grey sombrero on the dark hill above lighting a cigarette, mesquite scrub and a low adobe village in the distance",
  },
  // ——— Figures marquantes ———
  "figure-saint-gilles": {
    cadrage: "portrait",
    lumiere: "high noon sun, hard shadows on a dusty square",
    sujet: "a seventy-year-old man with white hair and a stiff back in a black frock coat, a silver-topped cane in one hand, standing on the steps of a columned assembly hall in a small frontier town, a proud and tired expression",
  },
  "figure-crane": {
    cadrage: "portrait",
    lumiere: "evening steam light, orange sky",
    sujet: "a tall thin forty-year-old lawyer in a grey suit and gold-rimmed spectacles, a leather document case under his arm, standing on a railway platform at dusk beside a steam locomotive, a polite smile that does not reach his eyes",
  },
  "figure-chef-comanche": {
    cadrage: "portrait",
    lumiere: "dusk light, red sky over the plateau",
    sujet: "a dignified seventy-five-year-old Comanche elder with long grey braids and a deeply lined face, wrapped in a trade blanket, seated before his tipi at the edge of a red canyon, calm eyes that look at the viewer as at an equal, a good horse standing behind him",
  },
  "figure-la-veuve": {
    cadrage: "portrait",
    lumiere: "storm light, dark sky and a band of low gold sun",
    sujet: "a thirty-five-year-old Creole woman in a black mourning veil and a long duster, black braided hair, a revolver on each hip, standing beside her horse on a ridge above a railway line at dusk, calm and watchful",
  },
  "figure-burke": {
    cadrage: "portrait",
    lumiere: "golden late afternoon sun low over the prairie, ochre dust",
    sujet: "a fifty-year-old Texas Ranger with a grey moustache and a weathered face, a silver star cut from a coin pinned to his vest, a lever-action carbine resting on his shoulder, standing beside his horse at a river crossing",
  },
  "figure-ortiz": {
    cadrage: "portrait",
    lumiere: "golden late afternoon sun low over the prairie, ochre dust",
    sujet: "a fifty-five-year-old trader with a broad dark face and a short grey beard, a wide-brimmed hat and a leather vest, leaning on the counter of a plank-walled trading post stacked with hides, flour sacks and rifles, a hand open in greeting",
  },
};
