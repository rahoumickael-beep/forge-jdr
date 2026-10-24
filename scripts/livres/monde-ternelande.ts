// Contenu des livres propre à la Ternelande (dark fantasy, « La Dîme ») : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (papier gris de cendre, encre noire, rouge sang, Pirata One).
// Les sujets des planches clés viennent de shared/canon/ternelande-peintures.ts, comme pour ComfyUI.
import { PEINTURES_TERNELANDE as P } from "../../shared/canon/ternelande-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_TERNELANDE = `
body { font-family: "Crimson Pro", Georgia, serif; color: #1d1512; }
.parchemin { background-color: #d8cfc0; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(29,21,18,.22) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Pirata One", serif; font-weight: 400; color: #1d1512; }
h3 { border-bottom-color: #7a1d14; }
.cols { column-rule-color: #1d151233; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #7a1d14; }
strong { color: #0f0d0d; }
.lettrine::first-letter { font-family: "Pirata One", serif; color: #7a1d14; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #5a4a40; }
.illu img { border-color: #1d1512; box-shadow: 0 0 0 1.2mm #d8cfc0, 0 0 0 1.6mm #7a1d14, 2px 4px 10px rgba(0,0,0,.4); }
.encart { background: rgba(29,21,18,.07); border-color: #5a4a40; }
.encart.dark { background: #1d1512; color: #e8e0d2; border-color: #7a1d14; }
.encart.dark h4 { color: #d8cfc0; }
.encart.dark strong { color: #f0c4b8; }
.statblock { background: #cfc5b3; border-color: #1d1512; }
.statblock h4, .abil { color: #7a1d14; }
.statblock h5 { border-bottom-color: #7a1d14; }
.statblock hr { background: linear-gradient(90deg, #7a1d14, transparent); }
.couverture { background: #0f0d0d; }
.cover-kicker, .cover-foot { font-family: "IM Fell English SC", serif; color: #c9b9a0; }
.couverture h1 { font-family: "Pirata One", serif; font-weight: 400; color: #ece3d4; text-shadow: 0 2px 0 #3a0d08, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "IM Fell English SC", serif; color: #e0d4c2; }
.cover-rule { background: linear-gradient(90deg, transparent, #b8402f, transparent); }
`;

export const TERNELANDE_LIVRES: Monde = {
  id: "ternelande",
  genre: "dark-fantasy",
  nom: "La Ternelande",
  de: "de la Ternelande",
  a: "en Ternelande",
  campagne: "La Dîme",
  dossier: "content/ternelande",
  css: CSS_TERNELANDE,
  polices: "https://fonts.googleapis.com/css2?family=Pirata+One&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=IM+Fell+English+SC&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait en Ternelande, l'hiver de l'an 512 de la Dîme.",
    illuMonde: ["region-haute-cendre", sujet("region-haute-cendre"), "large", "Haute-Cendre, la nuit de la Dîme, devant la grande pierre."],
    chapeauOrigines: "Cinq peuples, et chacun paie la Dîme à sa façon.",
    texteOrigines: "Chaque peuple a deux variantes, qui disent d'où tu viens. Choisis le peuple, puis la variante, et ajoute leurs bonus à tes caractéristiques. Si le MJ le permet, tu peux placer ces bonus toi-même (+2 et +1 où tu veux).",
    chapeauClasses: "Dix métiers d'hiver, et la moitié se paient en souvenirs.",
    encartCreation: `<aside class="encart"><h4>Six souvenirs</h4><p>Avant de choisir ta classe, écris sur ta fiche six souvenirs précis, avec un nom ou un objet : « le couteau que mon père m'a donné à dix ans », « la chanson de la noce de ma sœur ». Un Effacé n'en écrit que deux. Tu les useras pour lancer de grands sorts, et tu en donneras deux à la Dîme cet hiver. Choisis-les pour qu'ils te manquent.</p></aside>`,
    chapeauRegles: "Les souvenirs, ce que coûte la magie, la nuit de la Dîme, les Reflets et le fer froid, l'argent et l'hiver.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "La Ternelande · un monde pour la cinquième édition",
    figures: {
      chasseur: "a grim witch hunter in a long black coat and a wide-brimmed hat, a crossbow on his back and iron chains coiled at his belt, standing in the snow before a burnt cottage",
      mercenaire: "a scarred foreign mercenary in a dented breastplate and a fur cloak, leaning on a long pike at the edge of a frozen village, breath smoking",
      chirurgien: "a barber surgeon in a stained leather apron kneeling beside a wounded soldier on straw, a bone saw and a row of small knives laid on a cloth",
      pelerin: "a gaunt pilgrim in a rough wool cloak and iron-shod staff walking alone through deep snow, a string of carved wooden name tablets hanging from his neck",
      sorciere: "a young witch with bramble thorns woven in her hair kneeling at the foot of a white birch, a wooden cup of clear sap in her hands, crows in the branches",
      memorialiste: "a monk scribe in woollen gloves writing standing at a desk in a cold scriptorium, a grey leather register open before him, his breath visible",
      fossoyeur: "a broad gravedigger in a hooded coat leaning on a spade among snowy grave mounds, a small bronze bell hanging from his belt",
      "coupe-jarret": "a lean cutthroat in a patched grey hood crouched on a snowy rooftop, a long thin knife in one hand and a purse in the other",
      dimier: "a renegade tithe rider in a torn grey cloak holding a smooth pewter mask in one bare hand, his fingers white with frost, a dark village behind him",
      complainteur: "a wandering singer with a hurdy-gurdy on his back, singing before a crowd of mourners by a hearth fire in a peasant house",
    },
    portraits: {
      "df-humain": "two humans side by side in the snow, on the left a hard northern fisherman in a fur hood with a fish spear, on the right a smiling southern merchant in a red wool coat with a purse at his belt",
      "df-gris-de-sang": "a young woman with ash-grey skin, ash-grey hair and pale eyes, seated alone at the far end of a long family table, the others looking away",
      "df-efface": "a grown man with a blank gentle face learning to tie a knot from a child on a heather moor, a walled-up farmhouse behind them",
      "df-sylvain": "a tall slender forest dweller with skin pale as birch bark and hair like grey moss, standing among white birches with a small cup of clear sap",
      "df-houilleur": "a short broad miner with a soot-streaked face and an unlit iron lamp hanging at his neck, reciting by a hearth to his family in a rock hall",
    },
  },
  mj: {
    planches: {
      "La Ternelande en une page": ["region-neiges-hautes", sujet("region-neiges-hautes"), "Un cairn des Neiges Hautes, et ce qu'on y laisse."],
      "Les Comtés": ["region-vaugelee", sujet("region-vaugelee"), "Vaugelée, et les visages sous la glace."],
      "Les puissances": ["region-comtes-rouges", sujet("region-comtes-rouges"), "Un Dîmier sur un champ de bataille des Comtés Rouges."],
      "La mémoire et la magie": ["region-blancs-bois", sujet("region-blancs-bois"), "Le lait d'oubli, au pied d'un bouleau des Blancs-Bois."],
      "Les peuples jouables": ["region-brise-glace", sujet("region-brise-glace"), "Brise-Glace, la nuit de la Dîme."],
      "La vie en Ternelande": ["region-saint-memoire", sujet("region-saint-memoire"), "Le scriptorium de Saint-Mémoire."],
      "Figures marquantes": ["figure-odeline", sujet("figure-odeline"), "Mère Odeline, abbesse des Registres."],
      "La campagne": ["region-landes-effacees", sujet("region-landes-effacees"), "Les Landes Effacées."],
    },
    introRencontres: "Un combat en Ternelande se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Le bestiaire donne la puissance et les PX de chaque créature.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>En Ternelande, les blessures guérissent ; les souvenirs, non. Un Reflet qui touche, un grand sort lancé pour s'en sortir, un Dîmier qui pose la main : comptez ce que le combat a pris sur les fiches, pas seulement les points de vie. Et laissez une sortie : le sel sur un seuil, un nom qu'on retrouve, une porte d'église.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que les souvenirs y changent.",
    planchesScenarios: { "bib-df-deux-souvenirs": "a dented pewter thimble resting on a round loaf of rye bread in a wicker basket, on a rough tavern table beside an unfinished baby's knitted sock and two needles" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de la Ternelande · la Dîme · la Cour Grise",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes d'hiver",
        titre: "Les bêtes d'hiver",
        chapeau: "L'hiver dure cinq mois, et les bêtes ont faim pendant tout ce temps.",
        texte: [
          "Loups d'hiver, ours des neiges, brochets sous la glace, rennes et corbeaux : ces bêtes n'ont rien de surnaturel, sauf les corbeaux de dîme, qui suivent les cavaliers gris d'un village à l'autre. Elles sont maigres, elles sont nombreuses, et la neige leur donne l'avantage.",
        ],
        illu: ["famille-betes-d-hiver", "a pack of lean winter wolves crossing a frozen lake at the edge of a snowy forest, a flock of crows wheeling above them, a lone sled on the ice far away"],
      },
      {
        id: "Gens de la Dîme",
        titre: "Les gens de la Dîme",
        chapeau: "On se bat plus souvent contre des hommes que contre des monstres. Ils ont tous une bonne raison.",
        texte: [
          "Brigands des Landes, soldats et arbalétriers des compagnies franches, écuyers et Dîmiers, sorcières de sève, prêcheurs des Sans-Nom, chevaliers d'outre-mer : la plupart des combats de la campagne opposent des gens qui paient la Dîme, qui la prennent, ou qui refusent de la payer. Ces fiches servent aussi de PNJ.",
        ],
        illu: ["famille-gens-de-la-dime", "a snowy village crossroads where grey-cloaked riders in smooth pewter masks face a band of foreign mercenaries in dented breastplates, villagers watching from shuttered windows"],
      },
      {
        id: "Choses de la terre",
        titre: "Les choses de la terre",
        chapeau: "Ce qui pousse là où le sol a trop bu. Gardez ces pages pour plus tard.",
        texte: [
          "Racines qui sortent des puits, pierres de dîme qui s'éveillent, bois blancs qui marchent : ces choses ne devraient pas être combattues avant que les joueurs aient vu les Landes Effacées. La dernière de ce chapitre ne devrait apparaître qu'en fin de campagne.",
        ],
        illu: ["famille-choses-de-la-terre", "pale roots as thick as arms rising out of an old village well in the snow, curling around the stone rim, a dropped bucket on its side"],
      },
      {
        id: "Reflets",
        titre: "Les Reflets",
        chapeau: "Ce qu'on voit sous la glace des lacs, et qui marche la nuit de la Dîme.",
        texte: [
          "Les Reflets ont été quelqu'un. Les pêcheurs de Vaugelée disent que ce sont les noyés qu'on a oubliés ; le Père de leur paroisse dit qu'il faut leur rendre leur nom. Le fer froid les blesse, le sel sur un seuil les arrête, et un nom retrouvé les fait taire.",
        ],
        illu: ["famille-reflets", "pale drowned figures rising through cracks in the ice of a frozen lake at night, a fisherman's lantern lying on the ice beside a hole, the island village dark behind"],
      },
    ],
    avantPropos: `<h3>Les règles de l'hiver</h3>
      <p>Les Reflets partagent deux traits. <strong>Ce qui a été quelqu'un</strong> : ils ne prennent que la moitié des dégâts des armes ordinaires, mais le fer froid, battu sans feu, les blesse en entier. <strong>Le nom</strong> : un Reflet dont on dit le vrai nom cesse d'attaquer pour la scène. Le sel de veillée jeté sur un seuil les arrête jusqu'à l'aube.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes d'hiver, les gens de la Dîme, les choses de la terre et les Reflets. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que boit vraiment la terre. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-quatre créatures · puissance 1/8 à 20",
  },
};
