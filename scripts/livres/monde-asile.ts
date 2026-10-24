// Contenu des livres propre au Champ-d'Asile (western, Brazos et Comanchería, 1878) : planches, chapeaux,
// couvertures, familles du bestiaire, et l'habillage de la charte provisoire (papier d'affiche jauni, encre brune, rouge sang, Rye).
// Les sujets des planches clés viennent de shared/canon/asile-peintures.ts, comme pour ComfyUI.
import { PEINTURES_ASILE as P } from "../../shared/canon/asile-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_ASILE = `
body { font-family: "Crimson Pro", serif; font-weight: 400; color: #2e1a0a; }
.parchemin { background-color: #ecd5a8; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(116,81,42,.28) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Rye", serif; color: #2e1a0a; letter-spacing: .02em; }
h3 { border-bottom-color: #d8963c; }
.cols { column-rule-color: #2e1a0a33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #9a2f1a; }
strong { color: #1c130c; font-weight: 700; }
.lettrine::first-letter { font-family: "Rye", serif; color: #9a2f1a; }
.tete .sous, .cover-kicker, .cover-foot, .ouverture .num { font-family: "Playfair Display SC", serif; letter-spacing: .14em; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #74512a; }
.illu img { border-color: #2e1a0a; box-shadow: 0 0 0 1.2mm #ecd5a8, 0 0 0 1.6mm #a07a44, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(216,150,60,.1); border-color: #a07a44; }
.encart.dark { background: #1c130c; color: #f1e0b8; border-color: #d8963c; }
.encart.dark h4 { color: #ecb868; }
.encart.dark strong { color: #ffe2a8; }
.statblock { background: #e0c48e; border-color: #2e1a0a; }
.statblock h4, .abil { color: #9a2f1a; }
.statblock h5 { border-bottom-color: #9a2f1a; }
.statblock hr { background: linear-gradient(90deg, #d8963c, transparent); }
.couverture { background: #1c130c; }
.cover-kicker, .cover-foot { color: #d8963c; letter-spacing: .22em; }
.couverture h1 { font-family: "Rye", serif; color: #f4e2b4; text-shadow: 0 2px 0 #5a2a10, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "Playfair Display SC", serif; color: #ecd5a8; }
.cover-rule { background: linear-gradient(90deg, transparent, #d8963c, transparent); }
`;

export const ASILE_LIVRES: Monde = {
  id: "asile",
  genre: "western",
  nom: "Le Champ-d'Asile",
  de: "du Champ-d'Asile",
  a: "dans le Champ-d'Asile",
  campagne: "Le Champ-d'Asile",
  dossier: "content/champ-d-asile",
  css: CSS_ASILE,
  polices: "https://fonts.googleapis.com/css2?family=Rye&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Playfair+Display+SC:wght@400;700&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait au bord des Grandes Plaines, le printemps de 1878.",
    illuMonde: ["region-bonne-esperance", sujet("region-bonne-esperance"), "large", "Bonne-Espérance, à midi, quand l'ombre du clocher touche le marché."],
    chapeauOrigines: "Six façons d'être venu au Champ.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note ta langue, tes amis, et le petit défaut que ton pays te laisse.",
    chapeauClasses: "Dix métiers de la frontière, et chacun se paie en réputation.",
    encartCreation: `<aside class="encart"><h4>Ton Nom et ta poudre</h4><p>Avant de choisir ta classe, retiens deux choses. Ton <strong>Nom</strong> commence à zéro : il monte quand tu fais un coup d'éclat devant témoins, et ce qu'on raconte de toi finit par arriver avant toi. Et tes <strong>cartouches</strong> se comptent : une par attaque, notées sur ta fiche. Compte-les avant chaque départ.</p></aside>`,
    chapeauRegles: "Le Nom et ce qu'il coûte, la poudre comptée, le dollar et la piastre, la piste.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "Le Champ-d'Asile · un monde pour la cinquième édition",
    figures: {
      pistolero: "a lean gunfighter in a long duster standing alone in the dust of a quiet street at noon, one hand hanging near the holster of a revolver, hat brim low, a stillness before the draw",
      vaquero: "a vaquero on a sorrel horse in a flat-brimmed hat and leather chaps, swinging a rope in a wide loop across a green valley, longhorn cattle below",
      sherif: "a sheriff in a dark vest with a star on his chest, standing on the plank porch of a jailhouse with a shotgun in the crook of his arm, watching the street with tired patience",
      joueur: "a gambler in a black frock coat and a brocade vest sitting at a saloon table, a fan of cards in one hand and a gold coin turning between the fingers of the other, an oil lamp on the table",
      eclaireur: "a scout on a lean horse on a ridge at sunrise, a carbine across the saddle, studying a long line of dust on the plain far below",
      "chasseur-de-primes": "a bounty hunter in a wide hat and a worn coat leading a prisoner on a rope behind his horse across a dry creek bed, a folded poster in his breast pocket",
      medecin: "a country doctor with a leather bag kneeling by a lamp beside a wounded man on a kitchen table, needle and thread in hand, his sleeves rolled",
      predicateur: "a preacher in a black coat holding an open black book and a lever-action rifle slung across his back, standing in a wagon bed before a small crowd under a cottonwood tree",
      "hors-la-loi": "an outlaw on a horse at the mouth of a rocky canyon at dusk, a bandana pulled over her face, her revolver holstered, a wanted poster nailed to a tree behind her",
      arpenteur: "a surveyor in a waistcoat and a straw hat setting up a brass sighting instrument on a tripod in tall grass, a chain on the ground and a stake in his other hand",
    },
    portraits: {
      "ws-asiliens": "an old-family Asilien rancher in a black coat standing on the gallery of a stone ranch house, a cavalry sabre on the wall behind him, prairie beyond the rail",
      "ws-creoles": "a Creole woman in a bright calico dress and a straw hat stepping off a river steamer onto a landing with a carpet bag, a warm smile and sharp eyes",
      "ws-vaqueros": "a young vaquero in a wide hat and a short embroidered jacket mounted bareback, patting the neck of a spotted horse in a corral at dawn",
      "ws-comancheria": "a Comanche horseman in a leather shirt and leggings with a long braid, sitting calmly on a painted horse on a red canyon rim at dusk, a rolled trade blanket across his lap, dignified and unhurried",
      "ws-est": "a young man from the East in a bowler hat and a travelling suit, a carpet bag in each hand, stepping off a train at a raw timber station, looking up at the huge sky",
      "ws-revenants": "a tired veteran in a faded blue army coat with the insignia cut off, sitting alone on a porch step at night with a tin cup, a lamp on the rail, eyes on the dark",
      "ws-asiliens-rancho": "a young rancher's daughter in riding clothes on a bay horse in a field of high grass, a rope coiled at her saddle, her family's stone house in the distance",
      "ws-asiliens-ville": "a young clerk of Bonne-Espérance in a waistcoat and a straw hat crossing the market square, a ledger under his arm, a church steeple behind him",
      "ws-creoles-fleuve": "a Creole boatman with rolled sleeves leaning on a pole at the rail of a flat river barge at golden hour, a coil of rope at his feet",
      "ws-creoles-salon": "a Creole gentleman in a pale frock coat and a silk hat seated at a lamplit table in a small salon, a deck of cards and a glass of wine in front of him",
      "ws-vaqueros-ranch": "a rancher's vaquero asleep sitting up against a saddle at a camp fire on the open plain, his hat tilted over his eyes, horses hobbled in the dark",
      "ws-vaqueros-sud": "a Tejano from a village across the Concho on a grey mule at a river ford at night, a rolled blanket on his back, looking over his shoulder",
      "ws-comancheria-quahadi": "a Comanche rider in a buckskin shirt galloping bareback across the high prairie at sunrise, a lance in one hand, the red canyon rim behind him, wind in his horse's mane",
      "ws-comancheria-croix": "a young man of mixed Comanche and Asilien family at the counter of a trading post, translating between a trader and a rider in a leather shirt, a stone cross visible through the doorway",
      "ws-est-rail": "a railway worker in suspenders swinging a sledgehammer on a rail spike, his crew in a line along the track, the sun low and the engine waiting behind them",
      "ws-est-bureau": "a clerk in a stiff collar and sleeve garters at a high desk by an oil lamp, a telegraph key at his elbow and a map of the railway pinned to the wall",
      "ws-revenants-union": "a former Union cavalryman in a faded blue coat sitting beside a campfire, cleaning a carbine, a bugle hanging from his saddle",
      "ws-revenants-confedere": "a former Confederate officer in a grey coat with the buttons cut away, standing at the edge of a burned field at dawn, hat in hand",
    },
  },
  mj: {
    planches: {
      "Le Champ-d'Asile en une page": ["region-bonne-esperance", sujet("region-bonne-esperance"), "Bonne-Espérance, sur le haut Brazos."],
      "Les terres du Champ": ["region-croix-de-pierre", sujet("region-croix-de-pierre"), "La Croix-de-Pierre, entre deux cavaliers."],
      "Les puissances": ["figure-saint-gilles", sujet("figure-saint-gilles"), "Hippolyte de Saint-Gilles, président de l'Assemblée."],
      "Le Nom et la poudre": ["figure-burke", sujet("figure-burke"), "Le capitaine Burke, au gué de la frontière."],
      "Les origines jouables": ["region-frontiere-du-sud", sujet("region-frontiere-du-sud"), "Un gué du Concho, au clair de lune."],
      "La vie dans le Champ": ["region-ranchos", sujet("region-ranchos"), "La galerie d'un rancho du Brazos, au coucher du soleil."],
      "Chronologie": ["region-fort-rail", sujet("region-fort-rail"), "Le bout des rails de Fort-Rail."],
      "Figures marquantes": ["figure-chef-comanche", sujet("figure-chef-comanche"), "Celui-qui-Compte-les-Chevaux, chef des Quahadi."],
      "Historiques": ["figure-ortiz", sujet("figure-ortiz"), "Joseph Ortiz, traitant de la Croix-de-Pierre."],
      "La campagne": ["region-comancheria", sujet("region-comancheria"), "Un campement de tipis, dans un canyon de la Rivière Rouge."],
      "Première séance": ["figure-la-veuve", sujet("figure-la-veuve"), "Marguerite Lacoste, dite la Veuve."],
    },
    introRencontres: "Un combat dans le Champ-d'Asile se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais ici, une fusillade se compte aussi en cartouches et en Nom : comptez les deux.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Un coup de feu s'entend de loin, et un coup d'éclat se raconte. Chaque cartouche tirée est une cartouche de moins, et tout combat vu par des témoins fait monter, ou descendre, le Nom de ceux qui s'y battent. Laissez toujours une sortie : un cheval, un gué, une parole.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que la poudre et le Nom y changent.",
    planchesScenarios: { "bib-ws-diligence": "a stagecoach stopped on a dusty trail at a river ford, a felled tree lying across the road, six riders on horseback fanning out from the willows, a woman in a black mourning veil at their head raising one gloved hand, the driver and a guard on the box with their hands open" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets du Champ-d'Asile · le Traité · le rail",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes de la prairie",
        titre: "Les bêtes de la prairie",
        chapeau: "Elles n'ont pas lu le Traité.",
        texte: [
          "Coyotes, crotales, loups gris, pumas des canyons, bisons solitaires et ours des canyons : les bêtes de la prairie n'ont rien d'extraordinaire. Elles ont faim, elles ont chaud, et elles connaissent la piste mieux que ceux qui la suivent. Deux fiches, le stampede de longhorns et l'incendie de prairie, ne sont pas des créatures mais des dangers.",
        ],
        illu: ["famille-betes-de-la-prairie", "a pack of coyotes watching a covered wagon camp from the edge of a moonlit prairie, a rattlesnake coiled on a warm rock in the foreground, a lone bison on the far ridge"],
      },
      {
        id: "Gens de la loi",
        titre: "Les gens de la loi",
        chapeau: "Une étoile, un mandat, et chacun sa loi.",
        texte: [
          "Miliciens de l'Assemblée, adjoints du shérif, rurales du capitán Arredondo, Rangers du Texas, gardiens du traité : chacun porte la loi d'un autre pays, ou d'une autre époque. Ils ne sont pas tous honnêtes, mais la plupart se croient justes, et ils tirent rarement les premiers.",
        ],
        illu: ["famille-gens-de-la-loi", "a Texas Ranger with a silver star and a mounted Mexican rural in a grey sombrero facing each other across a river ford at dawn, their horses breathing steam, a militiaman watching from the bank"],
      },
      {
        id: "Hors-la-loi",
        titre: "Les hors-la-loi",
        chapeau: "Certains ont une bonne raison, d'autres un bon cheval.",
        texte: [
          "Voleurs de chevaux, cavaliers de la Bande des Lys, desperados de la frontière, tireurs et leur cheffe : on les affronte sur la piste, au gué, au bord d'une voie. Ces fiches servent aussi de PNJ : un voleur se négocie, un desperado se contourne.",
        ],
        illu: ["famille-hors-la-loi", "outlaw riders in dusters and bandanas on a ridge above a railway line at dusk, a steam train approaching in the valley below, one rider raising a hand to the others"],
      },
      {
        id: "Gens du rail",
        titre: "Les gens du rail",
        chapeau: "Ceux qui posent la voie, et ceux qui la gardent.",
        texte: [
          "Gardes de la compagnie, contremaîtres irlandais, chasseurs de bisons américains, l'avocat et ses hommes, et le train blindé : le rail avance, et il avance avec des gens qui ont une paie à gagner. Beaucoup sont de braves gens ; le chemin de fer, lui, ne l'est pas.",
        ],
        illu: ["famille-gens-du-rail", "railway workers laying rails across the open prairie at sunset, a foreman on a handcar with a ledger, a locomotive waiting behind, two armed company guards on horseback watching the horizon"],
      },
    ],
    avantPropos: `<h3>Les règles de la poudre</h3>
      <p>Les créatures du Champ partagent deux contraintes. <strong>Les cartouches</strong> : un adversaire armé compte ses coups comme les joueurs, et quand il n'en a plus il cherche un abri ou une sortie. <strong>Le Nom</strong> : un combat devant témoins se raconte, et ceux qui y survivent reviennent avec une histoire.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes de la prairie, les gens de la loi, les hors-la-loi, et les gens du rail. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que veulent vraiment les chefs. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-quatre créatures · puissance 1/8 à 15",
  },
};
