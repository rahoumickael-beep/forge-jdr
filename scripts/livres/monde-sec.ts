// Contenu des livres propre au Grand Sec (post-apocalyptique, vallée du Rhône asséchée) : planches, chapeaux,
// couvertures, familles du bestiaire, et l'habillage de la charte provisoire (papier ocre, rouille, Stardos Stencil).
// Les sujets des planches clés viennent de shared/canon/sec-peintures.ts, comme pour ComfyUI.
import { PEINTURES_SEC as P } from "../../shared/canon/sec-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_SEC = `
body { font-family: "Oswald", sans-serif; font-weight: 300; color: #241a0d; }
.parchemin { background-color: #e6d6b0; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(120,70,20,.2) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Stardos Stencil", sans-serif; color: #241a0d; }
h3 { border-bottom-color: #e0782a; }
.cols { column-rule-color: #241a0d33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #a8331c; }
strong { color: #17130d; font-weight: 600; }
.lettrine::first-letter { font-family: "Stardos Stencil", sans-serif; color: #a8331c; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #6a5536; }
.illu img { border-color: #241a0d; box-shadow: 0 0 0 1.2mm #e6d6b0, 0 0 0 1.6mm #e0782a, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(224,120,42,.08); border-color: #8f7650; }
.encart.dark { background: #241a0d; color: #f0e2c0; border-color: #e0782a; }
.encart.dark h4 { color: #f5b77a; }
.encart.dark strong { color: #ffd9a8; }
.statblock { background: #dccaa0; border-color: #241a0d; }
.statblock h4, .abil { color: #a8331c; }
.statblock h5 { border-bottom-color: #a8331c; }
.statblock hr { background: linear-gradient(90deg, #e0782a, transparent); }
.couverture { background: #17130d; }
.cover-kicker, .cover-foot { font-family: "Oswald", sans-serif; color: #e0b070; letter-spacing: .2em; }
.couverture h1 { font-family: "Stardos Stencil", sans-serif; color: #f5e3bc; text-shadow: 0 2px 0 #5a2a10, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "Oswald", sans-serif; color: #e6d6b0; }
.cover-rule { background: linear-gradient(90deg, transparent, #e0782a, transparent); }
`;

export const SEC_LIVRES: Monde = {
  id: "sec",
  genre: "post-apo",
  nom: "Le Grand Sec",
  de: "du Grand Sec",
  a: "dans le Bas-Pays",
  campagne: "Le Grand Sec",
  dossier: "content/grand-sec",
  css: CSS_SEC,
  polices: "https://fonts.googleapis.com/css2?family=Stardos+Stencil:wght@400;700&family=Oswald:wght@300;400;600&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait dans le Bas-Pays, l'été de l'an 40 du Sec.",
    illuMonde: ["region-route", sujet("region-route"), "large", "La Route du Rhône, un jour de mistral."],
    chapeauOrigines: "Six façons d'avoir soif.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note tes godets de départ et le petit défaut que ton pays te laisse.",
    chapeauClasses: "Dix métiers du Bas-Pays, et la plupart se paient en eau.",
    encartCreation: `<aside class="encart"><h4>Ta gourde</h4><p>Avant de choisir ta classe, remplis ta gourde : douze godets, trois litres. En été, tu en bois huit par jour pour tenir debout, et tes grands efforts te coûtent de l'eau en plus. Sans ta ration, tu prends un niveau d'épuisement. Compte tes godets avant chaque départ.</p></aside>`,
    chapeauRegles: "La gourde et la soif, ce que coûte l'effort, le coup de chaleur, l'eau sale, l'argent en godets, la Route.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "Le Grand Sec · un monde pour la cinquième édition",
    figures: {
      batelier: "a sand yacht sailor with a harpoon on his back hauling on a rope, the patched square sail full above him, a dry riverbed rushing by",
      puisatier: "a broad well digger in a leather apron turning a wooden winch in a stone well shaft, a heavy hammer at his belt",
      pillard: "a lean former raider with a scarf over her face crouched behind a broken bridge pier, a sling in hand, a red hand tattoo half scrubbed off her wrist",
      sourciere: "a woman kneeling on dry ground with an old geological map spread out, reading the plants and stones, a hand drill and a soil sample beside her",
      mecano: "a scavenger mechanic fixing a rusted water pump with salvaged parts, a folded solar panel on his back",
      gardian: "a rider in a wide hat on a thin grey horse with a long pole, driving black bulls across a white salt plain",
      penitent: "a gaunt penitent in a grey hood carrying a rain stick, walking barefoot in a procession under the white sun",
      medecin: "a desert doctor kneeling beside a collapsed traveller in the shade of a sail, wetting his lips from a small water skin",
      fouilleur: "a scavenger climbing through the half-buried ruins of an old supermarket, a lamp and a bag of salvaged tins",
      chef: "a caravan leader standing on a sand yacht deck with a ledger and a rifle, counting water barrels being loaded",
    },
    portraits: {
      "pa-gens-puits": "a family of well-town people in the shade of medieval ramparts turned into a cistern, holding stamped metal water capsules",
      "pa-enfants-route": "a child of the Route sitting at the top of a sand yacht mast, squinting at the horizon, scarf over the mouth",
      "pa-saliniers": "a salt boiler with soot on her face standing beside a smoking copper still on a black beach",
      "pa-porte-attente": "a young man in front of a vast camp of tents and corrugated sheds, looking up at a high concrete wall",
      "pa-montagnards": "a mountain goatherd among dry stone terraces and dead chestnut trees, a long knife and a coil of rope",
      "pa-descendus": "a pale young woman in a faded blue scarf walking down a dry stony mountain path, looking back at the green summit",
    },
  },
  mj: {
    planches: {
      "Le Bas-Pays en une page": ["region-mont-chauve", sujet("region-mont-chauve"), "Le Mont Chauve, où il pleut encore."],
      "Le Bas-Pays": ["region-avignon", sujet("region-avignon"), "La file du Grand Puits d'Avignon."],
      "Les puissances": ["figure-roumanille", sujet("figure-roumanille"), "Baptistin Roumanille, Maître-Puisatier."],
      "L'eau et la Soif": ["region-salins", sujet("region-salins"), "Les bouilleries des Salins."],
      "Les origines jouables": ["region-mur", sujet("region-mur"), "Le Mur de Valence et la Porte-d'Attente."],
      "La vie dans le Bas-Pays": ["region-camargue", sujet("region-camargue"), "La Camargue de sel."],
      "Figures marquantes": ["figure-la-cigale", sujet("figure-la-cigale"), "La Cigale, cheffe de la Horde du Mistral."],
      "La campagne": ["region-cevennes", sujet("region-cevennes"), "Les Mâts des Cévennes."],
    },
    introRencontres: "Un combat dans le Grand Sec se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais dans le Bas-Pays, la chaleur et la soif tuent plus que les armes : comptez-les.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Un combat au soleil coûte de l'eau avant de coûter du sang : chaque effort payé en godets, chaque heure de chaleur. Les pillards veulent l'eau, pas les morts, et un baril donné vaut souvent mieux qu'une roue cassée. Laissez toujours une sortie qui se paie en godets.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que la soif y change.",
    planchesScenarios: { "bib-pa-aramon": "a single standing arch of a broken stone bridge in the middle of a dry riverbed at dusk, three sand yachts with red hands painted on their sails lying across the passage under it, a man walking alone toward the viewer with open arms" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets du Grand Sec · l'eau · le Mont Chauve",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes du Sec",
        titre: "Les bêtes du Sec",
        chapeau: "Elles ont soif autant que vous, et elles savent où est l'eau.",
        texte: [
          "Chiens sauvages du lit du fleuve, vautours des relais, scorpions de la chaleur, sangliers des Cévennes, taureaux de Vaccarès : les bêtes du Bas-Pays n'ont rien d'étrange. Elles sont affamées, assoiffées, et elles connaissent les points d'eau mieux que les hommes.",
        ],
        illu: ["famille-betes-du-sec", "a pack of wild dogs drinking from a muddy puddle under a broken bridge in a dry riverbed, vultures waiting on the bridge parapet"],
      },
      {
        id: "Gens de la Route",
        titre: "Les gens de la Route",
        chapeau: "Sur la Route, on se bat pour un baril.",
        texte: [
          "Pillards et chars de la Horde, contrebandiers de godets faux, pénitents fanatiques, gardians du sel, patrons de convoi : la plupart des combats de la campagne opposent des gens qui ont soif. Ces fiches servent aussi de PNJ : un pillard se paie en barils, un patron se raisonne en godets.",
        ],
        illu: ["famille-gens-de-la-route", "a caravan of sand yachts stopped at a road relay of stone and canvas, travellers and raiders bargaining over water barrels in the heat"],
      },
      {
        id: "Gens des citadelles",
        titre: "Les gens des citadelles",
        chapeau: "Ceux qui ont de l'eau, et ceux qui la gardent.",
        texte: [
          "Arbalétriers du Grand Puits, gardes de Montclair, sentinelles du Mur, gens en blanc des crêtes : ils ne pillent pas, ils gardent. Ils tirent d'abord sur qui s'approche trop, et ils ont des ordres qu'ils ne discutent pas.",
        ],
        illu: ["famille-gens-des-citadelles", "crossbowmen on the ramparts of a medieval town turned into a cistern, guarding a queue of people with water cans below"],
      },
      {
        id: "Machines d'avant",
        titre: "Les machines d'avant",
        chapeau: "Ce qui tourne encore, quarante ans après.",
        texte: [
          "Pompes folles des relais, épandeur d'avant qui vole encore, et les grandes tours des crêtes : les machines du Bas-Pays sont vieilles, réparées cent fois, et dangereuses quand elles se détraquent. La dernière fiche de ce chapitre ne devrait apparaître qu'en fin de campagne.",
        ],
        illu: ["famille-machines-d-avant", "a rusted old water pump at a desert relay spraying water in a wild arc, travellers ducking away, a tall white metal tower on the ridge behind"],
      },
    ],
    avantPropos: `<h3>Les règles du Sec</h3>
      <p>Les créatures du Bas-Pays partagent deux contraintes. <strong>La chaleur</strong> : un combat entre midi et quatre heures, au soleil, coûte des sauvegardes de chaleur à tout le monde, ennemis compris. <strong>L'eau</strong> : presque tous veulent de l'eau avant de vouloir du sang ; un baril offert arrête plus de combats qu'un fusil.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes du Sec, les gens de la Route, les gens des citadelles, et les machines d'avant. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que font vraiment les tours des crêtes. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-quatre créatures · puissance 1/8 à 17",
  },
};
