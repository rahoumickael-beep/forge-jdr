// Contenu des livres propre à la Côte des Noyés (horreur, 1923) : planches, chapeaux, couvertures,
// familles du bestiaire, et l'habillage de la charte provisoire (papier jauni, sépia, machine à écrire).
// Les sujets des planches clés viennent de shared/canon/noyes-peintures.ts, comme pour ComfyUI.
import { PEINTURES_NOYES as P } from "../../shared/canon/noyes-peintures";
import type { Monde } from "./monde";

const sujet = (id: string) => P[id]?.sujet ?? id;

const CSS_NOYES = `
body { font-family: "Crimson Pro", Georgia, serif; color: #1c1a14; }
.parchemin { background-color: #e4dcc4; background-image: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(28,26,20,.22) 100%); }
h1, h2, h3, h4, h5, .feats dt, .tab th, .progress th, .toc .t, .toc .n, .abil th, .wait-title, .calque .folio { font-family: "Special Elite", monospace; font-weight: 400; color: #1c1a14; }
h3 { border-bottom-color: #5d5744; }
.cols { column-rule-color: #1c1a1433; }
li::marker, .orn, .ouverture .num, .tete .sous, .toc .k, .calque .run { color: #7a1f1f; }
strong { color: #0c0d0b; }
.lettrine::first-letter { font-family: "Special Elite", monospace; color: #7a1f1f; }
.ouverture .chapeau, .tete .pitch, .illu figcaption, .legal { color: #5d5744; }
.illu img { border-color: #1c1a14; box-shadow: 0 0 0 1.2mm #e4dcc4, 0 0 0 1.6mm #9a8f70, 2px 4px 10px rgba(0,0,0,.4); filter: sepia(.25); }
.encart { background: rgba(28,26,20,.06); border-color: #9a8f70; }
.encart.dark { background: #1c1a14; color: #e4dcc4; border-color: #7a1f1f; }
.encart.dark h4 { color: #d6ccb0; }
.encart.dark strong { color: #f0d9b0; }
.statblock { background: #d6ccb0; border-color: #1c1a14; }
.statblock h4, .abil { color: #7a1f1f; }
.statblock h5 { border-bottom-color: #7a1f1f; }
.statblock hr { background: linear-gradient(90deg, #7a1f1f, transparent); }
.couverture { background: #0c0d0b; }
.cover-kicker, .cover-foot { font-family: "Special Elite", monospace; color: #b8ad8a; }
.couverture h1 { font-family: "Special Elite", monospace; font-weight: 400; color: #ece4cc; text-shadow: 0 2px 0 #2a2418, 0 0 30px rgba(0,0,0,.9); }
.cover-sub { font-family: "Special Elite", monospace; color: #d6ccb0; }
.cover-rule { background: linear-gradient(90deg, transparent, #a8b07a, transparent); }
`;

export const NOYES_LIVRES: Monde = {
  id: "noyes",
  genre: "horreur",
  nom: "La Côte des Noyés",
  de: "de la Côte des Noyés",
  a: "sur la Côte des Noyés",
  campagne: "La Côte des Noyés",
  dossier: "content/cote-des-noyes",
  css: CSS_NOYES,
  polices: "https://fonts.googleapis.com/css2?family=Special+Elite&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap",
  joueurs: {
    chapeauMonde: "Ce que tout le monde sait sur la côte, en septembre 1923.",
    illuMonde: ["region-saint-clair", sujet("region-saint-clair"), "large", "Saint-Clair-sur-Mer, à la basse mer."],
    chapeauOrigines: "Six milieux, dans une France qui sort de la guerre.",
    texteOrigines: "Chaque origine a deux variantes. Choisis l'origine, puis la variante, et ajoute leurs bonus à tes caractéristiques. Note l'argent avec lequel tu arrives sur la côte, et le petit défaut que ton milieu te laisse.",
    chapeauClasses: "Dix métiers de 1923, et aucun ne sait ce qui l'attend sur la grève.",
    encartCreation: `<aside class="encart"><h4>La Marée</h4><p>Ton personnage commence à 0 de Marée (1 s'il est Sensible). Elle monte quand il voit ce qu'un homme ne devrait pas voir, et elle ne redescend qu'en s'éloignant de la côte. Chaque point lui donne un Présage. À 10, la mer l'appelle. Personne ne gagne plus de 3 de Marée dans une même scène.</p></aside>`,
    chapeauRegles: "La Marée et les Présages, le Choc, l'argent de 1923, se déplacer, la mer et les marées.",
    couverture: sujet("couverture-joueurs"),
    sousTitre: "La Côte des Noyés · un monde pour la cinquième édition",
    figures: {
      expert: "an insurance claims investigator in a tweed coat and hat crouching on a beach, examining a wet leather wallet with a magnifying glass, a notebook under his arm",
      poilu: "a war veteran of thirty in a patched horizon-blue greatcoat and a beret, a Lebel rifle on his shoulder, walking along a dyke in the wind",
      medecin: "a country doctor with a leather bag kneeling beside a drowned man on wet sand at dawn, checking his pulse",
      abbe: "a young country priest in a black cassock blessing a coffin of rough planks in a small granite church, fishermen's wives in black around him",
      journaliste: "a reporter in a crumpled suit with a notebook and a pencil behind his ear, questioning a fisherman on a harbour quay",
      photographe: "a photographer under the black cloth of a wooden plate camera on a tripod, pointed at a sheet-covered body on a beach",
      pecheur: "a broad fisherman in an oilskin hauling a net into a small boat in a grey choppy sea, a lighthouse behind him",
      medium: "a medium with closed eyes and hands flat on a round table in a shuttered parlour, three guests watching her in candlelight",
      gendarme: "a gendarme in a buttoned tunic and kepi standing beside his bicycle on a coast road, writing in a notebook",
      antiquaire: "an antiquarian in a cluttered shop full of ship models and old charts, reading a water-stained letter through a loupe",
    },
    portraits: {
      "hr-gens-cote": "two people of the Cotentin coast, a fisherman in a smock and beret and a seaweed gatherer in a white coif, standing on a granite quay",
      "hr-revenus-guerre": "a war veteran and a former front-line nurse sitting on a bench in a small seaside town, both looking at the sea, a medal on his coat",
      "hr-bourgeois-ville": "a well-dressed couple from Paris stepping off a train at a small seaside station, a porter carrying their trunk",
      "hr-etrangers": "an English traveller in a tweed cap and a Russian emigre in an old officer's coat sharing a table in a harbour tavern",
      "hr-enfants-siecle": "two young people of the twenties, a girl with bobbed hair and a cloche hat and a boy with a gramophone, laughing on a windy beach",
      "hr-sensibles": "a pale young woman standing alone at the edge of the sea at dusk, her head tilted as if listening to something under the water",
    },
  },
  mj: {
    planches: {
      "La Côte des Noyés en une page": ["region-morgue", sujet("region-morgue"), "La morgue de l'Abri-du-Marin."],
      "La côte": ["region-rocher-gris", sujet("region-rocher-gris"), "La chaussée du Rocher-Gris."],
      "Les puissances": ["region-le-havre", sujet("region-le-havre"), "Le bureau d'Anatole Brévin, au Havre."],
      "Ce que coûte la vérité": ["region-fosse", sujet("region-fosse"), "Ce que remonte la Fosse."],
      "Les origines jouables": ["region-saint-clair", sujet("region-saint-clair"), "Saint-Clair-sur-Mer."],
      "La vie en 1923": ["region-cherbourg", sujet("region-cherbourg"), "La grande rade de Cherbourg."],
      "Figures marquantes": ["figure-le-bihan", sujet("figure-le-bihan"), "Yves Le Bihan, gardien du Rocher-Gris."],
      "La campagne": ["region-hague", sujet("region-hague"), "La Hague, et des lumières au large."],
    },
    introRencontres: "Un combat sur la Côte des Noyés se prépare comme dans la cinquième édition : on additionne les PX des adversaires, on corrige selon leur nombre, et on compare au seuil du groupe. Mais la plupart des menaces de ce monde ne se tuent pas : elles se fuient, se nomment ou s'attendent.",
    encartRencontres: `<aside class="encart"><h4>Ce qu'un combat coûte</h4><p>Ici, les points de vie reviennent ; la Marée, non. Un Revenu qui se lève, une file de silhouettes dans l'eau, une voix dans une séance : comptez ce que la scène a fait monter sur les fiches, jamais plus de 3 par personnage. Et laissez une sortie : la terre ferme, un nom, une porte d'église, la marée qui redescend.</p></aside>`,
    chapeauRencontres: "Les chiffres de la cinquième édition, et ce que la Marée y change.",
    planchesScenarios: { "bib-hr-numero-onze": "a folded letter in a waxed envelope inside an old fisherman's beret on a wet beach at dawn, a new coin beside it, the sea far away in the mist" },
    couverture: sujet("couverture-mj"),
    sousTitre: "Les secrets de la Côte des Noyés · la mer · les Revenus",
  },
  bestiaire: {
    familles: [
      {
        id: "Bêtes de la côte",
        titre: "Les bêtes de la côte",
        chapeau: "Elles vivent avec la mer depuis toujours, et elles le savent mieux que nous.",
        texte: [
          "Goélands de la grève, chiens errants de la lande, chevaux de ferme affolés : les bêtes de la côte n'ont rien de surnaturel. Mais elles sentent avant les hommes ce que la mer va faire, et elles fuient, ou mordent.",
        ],
        illu: ["famille-betes-de-la-cote", "a pack of lean stray dogs running across heather on a clifftop in the wind, gulls wheeling over the cliff edge, a frightened farm horse in the distance"],
      },
      {
        id: "Gens de 1923",
        titre: "Les gens de 1923",
        chapeau: "Les hommes restent le premier danger, même ici.",
        texte: [
          "Contrebandiers, gendarmes, matelots et hommes de main de la Compagnie, adeptes du Cercle Thalassa, anciens poilus qui ne sont jamais vraiment rentrés : ces fiches servent aussi de PNJ. Un contrebandier se paie en bouteilles, un gendarme se fléchit, un homme de main se renvoie à son patron.",
        ],
        illu: ["famille-gens-de-1923", "smugglers unloading wooden crates from a rowing boat on a beach at night, a gendarme with a bicycle watching from the dunes"],
      },
      {
        id: "Ce que rend la mer",
        titre: "Ce que rend la mer",
        chapeau: "Les Revenus, et ce qui les suit.",
        texte: [
          "La mer de Saint-Clair rend des noyés que personne n'a perdus. Certains se lèvent. Certains parlent avec la voix d'un vivant. Les voir coûte de la Marée. Gardez ces pages pour après les premières séances.",
        ],
        illu: ["famille-ce-que-rend-la-mer", "pale drowned figures in city clothes rising from a wet beach at dawn, a lantern dropped on the sand, the sea very far away"],
      },
      {
        id: "La Fosse",
        titre: "La Fosse",
        chapeau: "Ce qui vit au fond, à trois milles au large.",
        texte: [
          "Les pêcheurs évitent la Fosse. Ce qui y vit ne devrait apparaître que tard dans la campagne. La dernière fiche de ce chapitre ne devrait apparaître qu'à la fin.",
        ],
        illu: ["famille-la-fosse", "the edge of a dark underwater trench, a helmeted diver's lamp lighting crabs, eels and lost objects drifting down into the black"],
      },
    ],
    avantPropos: `<h3>Les règles de la mer</h3>
      <p>Les créatures de la mer partagent deux traits. <strong>La Marée</strong> : les voir pour la première fois de la séance demande une sauvegarde de Sang-froid ; un échec fait monter la Marée (jamais plus de 3 par scène et par personnage). <strong>La terre ferme</strong> : elles retournent à l'eau quand la marée remonte, et rien ne les retient sur la terre sèche.</p>
      <h3>Les familles</h3>
      <p>Le livre suit quatre familles : les bêtes de la côte, les gens de 1923, ce que rend la mer, et la Fosse. Dans chaque famille, les créatures sont classées de la plus faible à la plus forte. L'index, à la fin, les range par puissance et par lieu.</p>
      <aside class="encart dark"><h4>Ce livre est pour le MJ</h4><p>Les encadrés « Au MJ » parlent de ce que sont vraiment les Revenus. Si un joueur veut feuilleter le bestiaire, montrez-lui les planches et lisez-lui les textes de présentation.</p></aside>`,
    couverture: sujet("couverture-bestiaire"),
    sousTitre: "Vingt-trois créatures · puissance 1/8 à 20",
  },
};
