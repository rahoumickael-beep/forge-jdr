// Contenu des livres propre à la Résidence (cyberpunk, « Ville sous bail ») : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (nuit violette, néon magenta et cyan, Chakra Petch).
// Les sujets des planches clés viennent de shared/canon/residence-peintures.ts, comme pour ComfyUI.
import { PEINTURES_RESIDENCE as P } from "../../shared/canon/residence-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_RESIDENCE = `
body { font-family: "IBM Plex Serif", Georgia, serif; color: #1a1426; }
.parchemin { background-color: #eeeaf2; background-image: radial-gradient(ellipse at 50% 40%, transparent 60%, rgba(40,10,60,.14) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Chakra Petch", sans-serif; color: #2a1240; }
h3 { border-bottom-color: #ff2fa0; }
.cols { column-rule-color: #2a124033; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #c4127a; font-family: "Chakra Petch", sans-serif; }
strong { color: #140a20; }
.lettrine::first-letter { font-family: "Chakra Petch", sans-serif; font-weight: 700; color: #c4127a; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #4b3e5c; }
.illu img { border-color: #140a20; box-shadow: 0 0 0 1.2mm #eeeaf2, 0 0 0 1.6mm #18c6d8, 2px 4px 10px rgba(0,0,0,.35); }
.encart { background: rgba(42,18,64,.06); border-color: #18c6d8; }
.encart.dark { background: #140d24; color: #f6e8ff; border-color: #ff2fa0; }
.encart.dark h4 { color: #6fe8f5; }
.encart.dark strong { color: #ffb3dc; }
.statblock { background: #e6e0ee; border-color: #2a1240; }
.statblock h4, .abil { color: #c4127a; }
.statblock h5 { border-bottom-color: #c4127a; }
.statblock hr { background: linear-gradient(90deg, #ff2fa0, transparent); }
.couverture { background: #0a0612; }
.cover-kicker, .cover-foot { font-family: "Chakra Petch", sans-serif; color: #6fe8f5; }
.couverture h1 { font-family: "Chakra Petch", sans-serif; font-weight: 700; color: #f6e8ff; text-shadow: 0 0 18px rgba(255,47,160,.8), 0 2px 0 #2a1240; }
.cover-sub { font-family: "Chakra Petch", sans-serif; color: #b493d4; }
.cover-rule { background: linear-gradient(90deg, transparent, #ff2fa0, transparent); }
`;

export const RESIDENCE_LIVRES: Monde = {
  id: "residence",
  genre: "cyberpunk",
  nom: "La Résidence",
  de: "de la Résidence",
  a: "dans la Résidence",
  campagne: "Ville sous bail",
  dossier: "content/residence",
  css: CSS_RESIDENCE,
  polices: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout locataire sait de la Résidence, en novembre 2089.",
    illuMonde: ["region-blocs", sujet("region-blocs"), "large", "Les Blocs, un matin d'expulsion."],
    chapeauOrigines: "Six façons d'être né dans une ville qui appartient à quelqu'un d'autre.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note ton solde de départ : c'est ton argent, et c'est ta marge avant de fondre.",
    chapeauClasses: "Dix métiers de la rue, des toits et du Réseau.",
    encartCreation: `<aside class="encart"><h4>Ton solde</h4><p>Avant de choisir ta classe, regarde ton poignet. Ton solde de départ dépend de ton origine : 300 h pour un Résident des Blocs, 1 500 h pour un Enfant des Hauts, rien pour un Sans-Bail. Un loyer d'une pièce coûte 200 h par mois. Sous zéro, tu fonds : un niveau d'épuisement par semaine. Fais le compte avant la première partie.</p></aside>`,
    chapeauRegles: "Les heures et le solde, fondre, les implants et leurs loyers, le Réseau et les traces, les heures volées, l'argent.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "La Résidence · un monde pour la cinquième édition",
    figures: {
      fouineur: "a young hacker crouched in a cramped maintenance closet full of blinking routers, a cracked tablet on her knees, rain on the small window behind her",
      solo: "a scarred bodyguard in a long rain coat with an augmented forearm, holding a needle pistol, standing between his client and a corridor full of shadows",
      medic: "a street medic in a stained parka stitching a wound on a kitchen table in a tiny apartment, instruments laid out on a towel",
      "huissier-defroque": "a former eviction officer with a torn yellow armband in his pocket, prying open a sealed apartment door to let a family back in",
      coursier: "a courier running across a narrow walkway between two towers in the rain, a sealed package strapped to her back",
      syndicaliste: "a tenant organizer standing on a chair in a crowded stairwell, a megaphone in hand, a crossed-out key painted on the wall behind her",
      fixeur: "a smiling middle-man in a sharp jacket sitting in a container bar, three phones on the table, two dockers waiting for his answer",
      mecano: "a mechanic in a cluttered workshop soldering a small drone, a second drone hovering with a lamp over her work",
      precheur: "a preacher with a scar where the wrist implant used to be, speaking to a crowd from a rowing boat between flooded balconies",
      journaliste: "a journalist with a camera and a recorder, crouched behind a parked tram, filming eviction officers dragging a man out of a building",
    },
    portraits: {
      "cp-resident-blocs": "a young tenant of a concrete tower block in a hoodie, leaning on the railing of a walkway, hundreds of lit windows behind him in the rain",
      "cp-enfant-des-hauts": "a young woman in an expensive but worn silk coat standing in a cheap rainy corridor, holding an old family key, looking up toward the towers above the clouds",
      "cp-prolonge": "a man who looks thirty with the posture and eyes of a very old man, wearing an old-fashioned coat, looking at a faded photograph of a city before the flood",
      "cp-sans-bail": "a sunburnt woman with a scar on her left wrist rowing a boat between flooded apartment balconies, vegetables in a crate at her feet",
      "cp-cousu": "a former docker with two mechanical arms and one artificial eye, the rental serial numbers engraved on the metal, waiting in a clinic queue",
      "cp-locataire": "a synthetic body with a smooth pale face and calm human eyes sitting at a kitchen table, a rental contract on the table, a family photograph of a dead woman beside it",
    },
  },
  mj: {
    planches: {
      "La Résidence en une page": ["region-hauts", sujet("region-hauts"), "Les Hauts, au-dessus des nuages."],
      "Les quartiers": ["region-port-franc", sujet("region-port-franc"), "Le marché de nuit du Port-Franc."],
      "Les puissances": ["figure-victoire-lancelin", sujet("figure-victoire-lancelin"), "Victoire Lancelin, présidente du Conseil."],
      "Le Compteur et le Réseau": ["region-souterrains", sujet("region-souterrains"), "Les Souterrains, et ce qui y tourne encore."],
      "Les origines jouables": ["region-friche", sujet("region-friche"), "La Friche, sans Compteur."],
      "La vie dans la Résidence": ["region-jardin", sujet("region-jardin"), "Le Jardin, où l'on paie l'assise."],
      "Figures marquantes": ["figure-la-grue", sujet("figure-la-grue"), "La Grue, reine du Port-Franc."],
      "La campagne": ["region-digue", sujet("region-digue"), "La Digue, une nuit d'équinoxe."],
    },
    introRencontres: "Un combat dans la Résidence se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Le bestiaire donne la puissance et les PX de chaque créature.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Dans la Résidence, chaque combat se paie après : un implant à réparer, une trace dans le Réseau, une vidéo qui circule dans les Blocs, un Huissier qui se souvient d'un visage. Les clercs se rendent, les gros bras se font payer, les drones se débranchent. Laissez toujours une sortie qui coûte des heures plutôt que des points de vie.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que les heures y changent.",
    planchesScenarios: { "bib-cp-avis": "a folded paper receipt sticking out of an old dented collective mailbox in a dark rainy tower corridor, a single green screen glowing above it with the words of a greeting" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de la Résidence · le Bail · le Conseil",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes de la ville",
        titre: "Les bêtes de la ville",
        chapeau: "Elles ne paient pas de loyer, et elles vivent très bien.",
        texte: [
          "Rats des Souterrains, mouettes de la Digue, chiens de garde des Hauts, silures de la Friche : la Résidence a ses bêtes, qui mangent ce que la ville jette. Elles n'ont ni Compteur ni implant, et aucun piratage ne les arrête.",
        ],
        illu: ["famille-betes-de-la-ville", "a swarm of large rats running along a flooded metro tunnel while gulls fight over garbage on a sea wall above, a guard dog barking behind a fence"],
      },
      {
        id: "Gens du Bail",
        titre: "Les gens du Bail",
        chapeau: "On se bat rarement contre des monstres. On se bat contre des locataires qui ont un autre loyer à payer.",
        texte: [
          "Clercs et huissiers, gros bras du Port-Franc, contrebandiers, Garde de la Digue, gardes de la Tour-Mère : la plupart des combats de la campagne opposent des gens qui ont tous un solde à tenir. Ces fiches servent aussi de PNJ : un clerc se rend, un gros bras se paie, un huissier-chef négocie.",
        ],
        illu: ["famille-gens-du-bail", "eviction officers in yellow armbands facing dockers with sailor knot tattoos across a rainy tower walkway, tenants watching from their doors"],
      },
      {
        id: "Drones et automates",
        titre: "Les drones et les automates",
        chapeau: "La Foncière a plus d'yeux que d'employés.",
        texte: [
          "Drones de cadastre, drones d'huissier, tourelles d'ascenseur, automates de maintenance, chargeurs de quai : les machines de la Résidence obéissent au Réseau. On les combat, on les pirate, ou on leur coupe le courant. La dernière de ce chapitre ne devrait apparaître qu'en fin de campagne.",
        ],
        illu: ["famille-drones-et-automates", "a swarm of small survey drones with white scanner beams sweeping a flooded district at night, a heavy dock loader robot standing among containers"],
      },
      {
        id: "Cousus",
        titre: "Les Cousus",
        chapeau: "Des corps refaits pièce à pièce, et loués au mois.",
        texte: [
          "Les Cousus ont remplacé leurs bras, leurs yeux ou leur colonne par des implants de location. Ils sont plus forts que les autres, tant que le loyer est payé. Un Cousu en défaut est un homme dont les bras s'éteignent un par un.",
        ],
        illu: ["famille-cousus", "a heavily augmented man with rented mechanical arms sitting on a clinic bench under flickering lights, rental serial numbers engraved on the metal"],
      },
    ],
    avantPropos: `<h3>Les règles de la ville</h3>
      <p>Les créatures de la Résidence partagent deux traits. <strong>Le loyer</strong> : un implant dont on ne paie plus le loyer s'éteint, et un Cousu en défaut perd ses avantages un par un. <strong>Le Réseau</strong> : drones, tourelles et automates obéissent au Réseau ; un Fouineur peut les retourner, au prix d'une trace.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes de la ville, les gens du Bail, les drones et les automates, et les Cousus. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par quartier.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que cache le Conseil. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-quatre créatures · puissance 1/8 à 20",
  },
};
