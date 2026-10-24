// Contenu des livres propre à l'Archipel (science-fiction, « Les Phares ») : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage « couverture de poche des années 70 » (papier clair, outremer et ambre, Exo 2).
// Les sujets des planches clés viennent de shared/canon/archipel-peintures.ts, comme pour ComfyUI.
import { PEINTURES_ARCHIPEL as P } from "../../shared/canon/archipel-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_ARCHIPEL = `
body { font-family: "Source Serif 4", Georgia, serif; color: #141a2c; }
.parchemin { background-color: #f3efe6; background-image: radial-gradient(ellipse at 50% 40%, transparent 60%, rgba(20,40,90,.16) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Exo 2", sans-serif; color: #1d347a; }
h3 { border-bottom-color: #d98a1e; }
.cols { column-rule-color: #1d347a33; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #b86f12; font-family: "Exo 2", sans-serif; }
strong { color: #0f1730; }
.lettrine::first-letter { font-family: "Exo 2", sans-serif; font-weight: 700; color: #1d347a; }
.ouverture h2, .tete h2 { text-shadow: none; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #3b4566; }
.illu img { border-color: #0f1730; box-shadow: 0 0 0 1.2mm #f3efe6, 0 0 0 1.6mm #d98a1e, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(29,52,122,.07); border-color: #1d347a; }
.encart.dark { background: #0f1d33; color: #e8eefc; border-color: #d98a1e; }
.encart.dark h4 { color: #f2b55a; }
.encart.dark strong { color: #ffd59a; }
.statblock { background: #e9eef8; border-color: #1d347a; }
.statblock h4, .abil { color: #1d347a; }
.statblock h5 { border-bottom-color: #1d347a; }
.statblock hr { background: linear-gradient(90deg, #1d347a, transparent); }
.couverture { background: #060c18; }
.cover-kicker, .cover-foot { font-family: "Exo 2", sans-serif; color: #f2b55a; }
.couverture h1 { font-family: "Exo 2", sans-serif; font-weight: 800; color: #ffe3b0; text-shadow: 0 2px 0 #0b1a40, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "Exo 2", sans-serif; color: #d6ecff; }
.cover-rule { background: linear-gradient(90deg, transparent, #4cc3ff, transparent); }
`;

export const ARCHIPEL_LIVRES: Monde = {
  id: "archipel",
  genre: "science-fiction",
  nom: "L'Archipel",
  de: "de l'Archipel",
  a: "à l'Archipel",
  campagne: "Les Phares",
  dossier: "content/archipel",
  css: CSS_ARCHIPEL,
  polices: "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait dans l'Archipel, en l'an 1214 du Chant.",
    illuMonde: ["region-frange", sujet("region-frange"), "large", "Gué-d'Ambre, au crépuscule, quand le Phare s'éteint une seconde."],
    chapeauOrigines: "Six espèces qui ont appris à vivre au bout des Routes.",
    texteOrigines: "Chacune a deux variantes, qui disent d'où tu viens ou ce que tu étais avant. Choisis l'espèce, puis la variante, et ajoute leurs bonus à tes caractéristiques. Si le MJ le permet, tu peux placer ces bonus toi-même (+2 et +1 où tu veux).",
    chapeauClasses: "Dix métiers de bord et de quai, et un qui est un crime : le Chant.",
    encartCreation: `<aside class="encart"><h4>Les Chantres et les Ouvrés</h4><p>Un Chantre joueur est un autodidacte ou un novice caché : depuis la Nuit des Orgues, plus personne n'a reçu la formation complète. Un Ouvré ne peut pas apprendre le Chant, et aux yeux de la loi, un Ouvré sans maître est un bien volé. Parlez-en avec le MJ avant la première partie : qui te cherche, et pourquoi ?</p></aside>`,
    chapeauRegles: "Le Chant et l'Écho, les sauts et le Péage, le vaisseau et ses postes, le combat spatial, la dette.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "L'Archipel · un monde pour la cinquième édition",
    figures: {
      chantre: "a young woman in a hooded rain cloak kneeling with one hand on a pale stone at the edge of a misty lake, a crystal blade at her belt, a pale spiral tower in the water behind her, eyes closed as if listening",
      pilote: "a small grey-feathered avian pilot with huge black eyes in a patched flight jacket, both hands on the worn control yoke of a cramped cargo ship cockpit, stars streaking through the canopy",
      mecanicienne: "a sturdy woman mechanic in grease-stained overalls and a headlamp, lying under a humming ship engine with a spanner, a small hovering workshop drone holding a lamp beside her",
      fusilier: "a broad deserter soldier in composite armor with the insignia torn off, a heavy plasma rifle braced against his shoulder, holding a narrow ship corridor with sparks raining from the ceiling",
      contrebandiere: "a smirking woman smuggler in a long coat with double pockets, two plasma pistols at her hips, sitting on a stack of unmarked crates in a ship hold, a forged transponder box in her hand",
      chasseur: "a lean bounty hunter in a dusty hooded coat walking through an orange desert spaceport at dusk, a net launcher on her back and a wanted notice crumpled in her fist",
      medecin: "a calm ship doctor in a reinforced coat kneeling beside a wounded crewman in a cargo bay, an injector in one hand, a lamp held in her teeth",
      diplomate: "an elegant envoy in a high-collared court coat standing between a massive four-armed grey alien and a customs officer, palms open, speaking calmly",
      ferrailleur: "a huge scrapper in a patched pressure suit cutting into the hull of a derelict battleship with a cutting torch, sparks flying against a red nebula",
      capitaine: "a weathered captain in a long reinforced coat standing on the loading ramp of a battered cargo ship, a debt contract folded in her breast pocket, her crew behind her",
    },
    portraits: {
      "sf-humain": "two humans side by side on a frontier dock at dusk, on the left a pale composed woman from an old pious world in a grey rain cloak, on the right a sunburnt frontier man in a dusty work jacket with a cargo hook on his shoulder",
      "sf-vaelle": "a tall slender blue-green aquatic alien with smooth skin, closed gills at the neck and large calm dark eyes, standing waist-deep in green water before floating coral towns",
      "sf-tarrak": "a massive grey four-armed alien with leathery plated hide like a rhinoceros, an oath carved into the armor plate of one forearm, hammering on an anvil in an underground forge hall",
      "sf-ikki": "a small avian alien one meter twenty tall with ochre down, huge black eyes and a little voice box at the throat, perched in the pilot seat of a ship, whistling",
      "sf-ourdi": "a slender six-limbed insectoid alien with a glossy lacquered carapace, weaving a rope of hard silk between its fore limbs, alone on a quiet dock looking up at the sky",
      "sf-ouvre": "an old service automaton patched with mismatched parts, a dented brass faceplate with two soft lamp eyes, carrying a cargo crate on a dock, a forged ownership tag hanging from its neck",
    },
  },
  mj: {
    planches: {
      "L'Archipel en une page": ["region-solenne", sujet("region-solenne"), "Le Grand Phare de Solenne, et l'Orgue accroché à son flanc."],
      "Les régions": ["region-brisants", sujet("region-brisants"), "Les Brisants, à mi-chemin entre Solenne et la Frange."],
      "Les puissances": ["region-valcourt", sujet("region-valcourt"), "Un Orgue neuf sort de la Fonderie de Forge-Mère."],
      "Le Chant et son prix": ["region-ancre", sujet("region-ancre"), "Sur la chaussée du lac d'Ancre, on dépose les lames brisées."],
      "Les espèces jouables": ["region-karrag", sujet("region-karrag"), "Un hall de clan de Karrag."],
      "Vaisseaux, sauts et Péage": ["region-frange", sujet("region-frange"), "Gué-d'Ambre, quand le Phare s'éteint une seconde."],
      "Figures marquantes": ["figure-malachie-orsat", sujet("figure-malachie-orsat"), "Malachie Orsat, Grand Censeur."],
      "La campagne": ["region-mondes-eteints", sujet("region-mondes-eteints"), "La coquille de Cendrine."],
    },
    introRencontres: "Un combat dans l'Archipel se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Le bestiaire donne la puissance et les PX de chaque créature. Un combat de vaisseaux se joue à part : voir le livre des joueurs.",
    encartRencontres: `<aside class="encart"><h4>Les dettes comptent aussi</h4><p>Dans l'Archipel, un combat gagné peut coûter plus cher qu'il ne rapporte : une coque à réparer à 50 lumens le point, une prime sur la tête, un Censeur qui se souvient. Laissez toujours une sortie, la fuite, la négociation ou la resquille, et faites payer le prix en lumens plutôt qu'en points de vie.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que la dette y change.",
    planchesScenarios: { "bib-sf-mensualite": "a long crate sealed with grey wax in the dark hold of a battered cargo ship, lit by a single hand lamp, a child's knitted wool cap left on its lid, two crew members watching from the shadows" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de l'Archipel · les Phares · les Orgues",
  },
  bestiaire: {
    familles: [
      {
        id: "Faune des mondes",
        titre: "La faune des mondes",
        chapeau: "Chaque monde a ses bêtes, et elles ne savent pas qu'il y a des Routes.",
        texte: [
          "Rats de soute qui passent d'un monde à l'autre dans les cargaisons, siffleurs des forêts d'Ikkara, bouviers de Karrag, anguilles-lampes et léviathans d'Ilvaë, vers d'ambre des déserts de la Frange : ces créatures n'ont rien de surnaturel. Elles mangent, elles défendent leur territoire, et elles se moquent bien du Péage.",
        ],
        illu: ["famille-faune", "a vast orange desert at dusk where a gigantic segmented amber sand worm rears out of the dunes beside a tiny caravan of cargo hovercraft, a forest moon hanging in the sky"],
      },
      {
        id: "Équipages",
        titre: "Les équipages",
        chapeau: "On se bat rarement contre des monstres. On se bat contre des gens qui ont une dette, une prime ou des ordres.",
        texte: [
          "Pillards des Routes, douaniers, ferrailleurs, chasseurs de primes, Garde Hégémonique, corsaires de la Ligue, Censeurs : la plupart des combats d'une campagne dans l'Archipel opposent des gens qui ont tous de bonnes raisons. Ces fiches servent aussi de PNJ : un douanier peut être acheté, un corsaire peut devenir un allié.",
        ],
        illu: ["famille-equipages", "a crowded customs dock of a frontier spaceport where white-armored guards, a hooded bounty hunter and ragged raiders face each other across stacked cargo crates, a battered cargo ship behind"],
      },
      {
        id: "Machines",
        titre: "Les machines",
        chapeau: "Valcourt fabrique tout. Même ce qui finit par se retourner contre elle.",
        texte: [
          "Drones de surveillance de Solenne, Ouvrés de garde et de guerre, robots d'entretien devenus fous dans les épaves, et l'Orgue détraqué, la plus grande machine qu'on ait jamais combattue. Les machines ne craignent ni le poison ni la peur, mais elles ont des soupapes, des câbles et des maîtres.",
        ],
        illu: ["famille-machines", "rows of identical idle gunmetal war automatons in a vast dim hangar, one of them turning its slit visor toward the viewer, sparks falling from a welding arm"],
      },
      {
        id: "Choses des Routes",
        titre: "Les choses des Routes",
        chapeau: "Ce qui tombe des sauts ratés. Gardez ces pages pour la fin.",
        texte: [
          "Les ferrailleurs disent que les Échouées sont nées dans les Routes. Ils ont raison, sans savoir à quel point. Ces créatures ne devraient pas être combattues avant que les joueurs aient vu un saut mal tourner. La dernière de ce chapitre ne devrait apparaître qu'en fin de campagne.",
        ],
        illu: ["famille-routes", "a drifting cloud of pale translucent figures between dead starships inside a red and violet nebula, a tiny scavenger raising a yellow lamp against them"],
      },
    ],
    avantPropos: `<h3>Les règles des Routes</h3>
      <p>Les Échouées et leurs semblables partagent deux traits. <strong>Rêve déchiré</strong> : elles ne prennent que la moitié des dégâts des armes ordinaires. <strong>La lampe</strong> : une lampe de ferrailleur braquée sur elles les tient à distance. Un Chantre qui chante les calme, et les attire.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : la faune des mondes, les équipages, les machines et les choses des Routes. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par région.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que sont vraiment les Phares. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-cinq créatures · puissance 1/8 à 20",
  },
};
