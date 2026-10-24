// Origines jouables et historiques de la Résidence (cyberpunk, « le Bail »), d'après la bible (sections 4, 5 et 9).
// Caractéristiques : 0 Corps, 1 Réflexes, 2 Endurance, 3 Technique, 4 Instinct, 5 Aplomb.
// « h » veut dire heures de Compteur, la monnaie.
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_RESIDENCE: Origin[] = [
  {
    id: "cp-resident-blocs",
    genre: "cyberpunk",
    name: "Résident des Blocs",
    blurb: "Né dans un Bloc, élevé dans un couloir. Il connaît tout le monde, et il doit des heures à la moitié.",
    bonus: {},
    speed: 6,
    traits: [
      { name: "Né dans un couloir", text: "Un réseau de voisins dans un Bloc : trois ou quatre familles te cachent, te nourrissent et te préviennent des Huissiers. Une maîtrise de compétence en plus, au choix. Langues : le français et une langue de palier." },
      { name: "Solde et retard", text: "Solde de départ : 300 h. Tu as un loyer en retard : 100 h à régler avant la fin de l'année, sans quoi le palier le réclame." },
    ],
    subs: [
      {
        id: "cp-enfant-de-palier",
        name: "Enfant de palier",
        blurb: "Tu as grandi entre les portes d'un seul couloir, et tu sais ce que chacun vaut au prix de son loyer.",
        bonus: { 5: 2, 4: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Tout le monde se connaît", text: "Avantage aux tests de Persuasion auprès des gens des Blocs, et 1 PV de plus par niveau (les Blocs tiennent). Tu sais qui doit quoi à qui dans ton couloir." },
        ],
      },
      {
        id: "cp-ouvrier-des-cages",
        name: "Fils de chantier",
        blurb: "Ton père a monté des Blocs, ta mère les a réparés. Tu as appris à lever, à pousser, à tenir.",
        bonus: { 2: 2, 0: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Mains qui savent", text: "Maîtrise des outils de chantier et d'Athlétisme. Tu portes, tires et soulèves comme si ton Corps était supérieur de 2, et tu as 1 PV de plus par niveau." },
        ],
      },
    ],
  },
  {
    id: "cp-enfant-des-hauts",
    genre: "cyberpunk",
    name: "Enfant des Hauts",
    blurb: "Né dans une famille de cadres ou d'administrateurs, tombé dans les Blocs pour une raison qu'il ne raconte pas. Il a gardé un capital d'heures, des manières et un nom.",
    bonus: { 5: 2, 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un capital", text: "Solde de départ : 1 500 h. Toute dépense de 300 h ou plus d'un coup est signalée à ta famille, qui sait alors où tu es." },
      { name: "Manières et un nom", text: "Maîtrise de Persuasion. Avantage aux tests de Persuasion et d'Histoire face aux gens des Hauts, qui te prennent d'abord pour l'un des leurs." },
      { name: "Une famille qui te cherche", text: "Ta famille a lancé des gens à tes trousses : un cousin, un avocat, un agent. Le MJ les envoie quand il juge que tu t'es fait remarquer." },
    ],
    subs: [
      {
        id: "cp-hauts-fugueur",
        name: "Fugueur",
        blurb: "Tu es parti un soir de réception, sans rien dire. Ta famille te cherche encore.",
        bonus: { 3: 1 },
        traits: [
          { name: "Parti sans prévenir", text: "Maîtrise d'Escamotage et de Discrétion. Tu sais quitter une salle sans qu'on te voie, et tu connais les ascenseurs de service des Hauts." },
        ],
      },
      {
        id: "cp-hauts-renie",
        name: "Renié",
        blurb: "La famille t'a coupé les vivres, mais pas le capital. Tu as appris à vivre en bas, et à te méfier de ceux qui te sourient.",
        bonus: { 2: 1 },
        traits: [
          { name: "Dur à cuire des Blocs", text: "Maîtrise d'Intuition. Tu as l'avantage aux sauvegardes contre le charme et les ordres de ceux qui te parlent avec des manières." },
        ],
      },
    ],
  },
  {
    id: "cp-prolonge",
    genre: "cyberpunk",
    name: "Prolongé",
    blurb: "Un vieux de quatre-vingts ou cent ans, rajeuni à trente par une Clinique qui lui réclame encore le contrat. Il se souvient d'avant la Crue.",
    bonus: { 3: 2, 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "D'avant la Crue", text: "Maîtrise d'Histoire. Une fois par repos long, tu demandes au MJ un renseignement vrai sur le monde d'avant 2041 : un lieu, une loi, une façon de faire. Tu parles aussi la langue du siècle dernier." },
      { name: "L'échéance", text: "Solde de départ : 600 h. Chaque premier du mois, ta Clinique prélève 30 h. Si tu manques une échéance, elle reprend des années : tu prends un niveau d'épuisement, que seul le paiement de l'échéance retire." },
    ],
    subs: [
      {
        id: "cp-prolonge-temoin",
        name: "Témoin de la Crue",
        blurb: "Tu avais vingt ans quand la mer est montée. Tu as vu les quartiers bas disparaître en un hiver.",
        bonus: { 2: 1 },
        traits: [
          { name: "Rescapé", text: "Maîtrise de Survie. Tu reconnais à l'œil une digue qui tient et une qui va lâcher, et tu as l'avantage aux sauvegardes contre l'eau, le froid et la noyade." },
        ],
      },
      {
        id: "cp-prolonge-chantiers",
        name: "Ancien des premiers chantiers",
        blurb: "Tu as bâti les premiers Blocs, quand ils n'avaient pas encore de numéro.",
        bonus: { 5: 1 },
        traits: [
          { name: "Plans de tête", text: "Maîtrise d'Investigation. Tu connais les plans, les gaines et les accès de service d'un Bloc ancien ; une fois par repos long, tu sais où mène un couloir ou une trappe qui n'est plus sur les plans." },
        ],
      },
    ],
  },
  {
    id: "cp-sans-bail",
    genre: "cyberpunk",
    name: "Sans-Bail",
    blurb: "Né à la Friche, ou qui a arraché son Compteur. Il ne paie rien et n'existe pour aucun système de la Foncière.",
    bonus: { 4: 1, 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Sans Compteur", text: "Pas de solde ni de dette : tu ne fonds jamais. Pas d'implant (rien ne les tiendrait). Les caméras et les lecteurs qui lisent les Compteurs ne te voient pas. Mais ni tram, ni ascenseur, ni porte de la Foncière, ni soins de Clinique ne s'ouvrent pour toi." },
      { name: "Troc et service", text: "Solde de départ : 0 h. Tu paies en troc et en service : le MJ donne une valeur en heures à ce que tu offres. Les achats en heures te sont fermés, sauf si quelqu'un paie pour toi." },
    ],
    subs: [
      {
        id: "cp-sans-bail-friche",
        name: "Né à la Friche",
        blurb: "Tu as grandi sur un toit entre deux immeubles noyés. Tu n'as jamais eu de Compteur à arracher.",
        bonus: { 3: 1 },
        traits: [
          { name: "Pied de barque", text: "Maîtrise des barques et de Survie. Tu nages à ta vitesse et tu te repères dans les ruines inondées, sans te perdre." },
        ],
      },
      {
        id: "cp-sans-bail-arrache",
        name: "Arraché",
        blurb: "Tu as eu un Compteur. Tu as une cicatrice au poignet et une dette que tu ne paieras plus.",
        bonus: { 5: 1 },
        traits: [
          { name: "Ancien payeur", text: "Maîtrise d'Histoire. Tu connais le Bail de l'intérieur : avantage aux tests sur les lois et les loyers. Les Huissiers te reconnaissent à ta cicatrice et te traitent en fugitif." },
        ],
      },
    ],
  },
  {
    id: "cp-cousu",
    genre: "cyberpunk",
    name: "Cousu",
    blurb: "Un corps refait aux implants, loués pièce à pièce : yeux, bras, colonne. Souvent un ancien docker ou un ancien Huissier.",
    bonus: { 2: 1, 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Corps loué", text: "Solde de départ : 300 h. Tu commences avec deux implants loués, selon ta variante, pour un loyer total de 55 h par mois. Un implant dont le loyer n'est pas payé s'éteint à distance, et reste éteint jusqu'au paiement." },
      { name: "Fiché", text: "Un Cousu est toujours fiché : les Huissiers t'arrêtent pour un contrôle avant de contrôler les autres, et les lecteurs de Compteur comptent tes implants." },
    ],
    subs: [
      {
        id: "cp-cousu-docker",
        name: "Ancien docker",
        blurb: "Tu as porté des conteneurs vingt ans. La Foncière t'a remplacé le dos et les bras, et te les reloue.",
        bonus: { 0: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Bras de levage", text: "Implant, loyer 25 h par mois. Avantage aux tests et sauvegardes de Corps pour soulever, pousser ou agripper ; tes attaques sans arme font 1d6 + Corps." },
          { name: "Colonne de rechange", text: "Implant, loyer 30 h par mois. 1 PV de plus par niveau, et tu ne prends aucun dégât de chute sur les six premiers mètres." },
        ],
      },
      {
        id: "cp-cousu-huissier",
        name: "Ancien Huissier",
        blurb: "Tu as rendu le brassard, mais pas la visière ni les nerfs. Tu les paies encore.",
        bonus: { 1: 1 },
        traits: [
          { name: "Visière implantée", text: "Implant, loyer 30 h par mois. Tu vois dans le noir à 18 m et tu lis le solde d'un Compteur à 9 m." },
          { name: "Nerfs de rechange", text: "Implant, loyer 25 h par mois. +2 à l'initiative, et tu ne peux pas être surpris tant que tu es conscient." },
        ],
      },
    ],
  },
  {
    id: "cp-locataire",
    genre: "cyberpunk",
    name: "Locataire",
    blurb: "Un esprit sans corps : la copie d'une personne, faite de son vivant, qui a continué après sa mort dans un corps synthétique loué à la Foncière. La loi les appelle des « biens meublés ».",
    bonus: { 3: 1, 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un corps au bail", text: "Tu ne vieillis pas et tu ne fonds pas. Tu n'as pas de Compteur au poignet : ton bail est inscrit dans ton corps, et les lecteurs le lisent comme un Compteur. Ton bail tient lieu de loyer : tu n'as pas d'autre logement à payer. Tu commences avec 6 mois de bail (1 200 h) ; le premier du mois, 200 h sont retirées de ton bail. À zéro, on vient retirer le corps. Un Locataire ne peut pas être Prêcheur des Sans-Bail." },
      { name: "Corps synthétique", text: "Résistance aux dégâts de poison, aucune maladie, pas besoin de manger. Un repos long te demande quatre heures de veille immobile." },
      { name: "Bien meublé", text: "La loi te range avec les meubles : tu ne peux ni signer de bail, ni porter plainte, ni voter au Comité. Un Huissier peut saisir ton corps comme un objet." },
    ],
    subs: [
      {
        id: "cp-locataire-technicien",
        name: "Copie d'un technicien",
        blurb: "Tu es la copie d'un technicien des Blocs, mort sur un chantier. Tu connais ses outils mieux que tu ne connais ton nom.",
        bonus: { 3: 1 },
        traits: [
          { name: "Mémoire de métier", text: "Maîtrise d'Arcanes / Savoir et d'un jeu d'outils au choix. Tu te rappelles tout schéma que tu as déjà vu." },
        ],
      },
      {
        id: "cp-locataire-cadre",
        name: "Copie d'un cadre",
        blurb: "Tu es la copie d'un cadre des Hauts, mort sans l'avoir prévu. Ses manières sont restées.",
        bonus: { 5: 1 },
        traits: [
          { name: "Vieilles manières", text: "Maîtrise de Persuasion. Avantage aux tests de Persuasion face à ceux qui t'ont connu vivant, ou qui ont connu l'original." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_RESIDENCE: Background[] = [
  {
    id: "cp-h-docker",
    genre: "cyberpunk",
    name: "Docker du Port-Franc",
    blurb: "Tu as monté et descendu des conteneurs pour un loyer qui ne baisse jamais.",
    skills: ["Athlétisme", "Intimidation"],
    tool: "Permis de grue et outils de manutentionnaire",
    gear: ["Casque jaune de chantier", "Crochet de docker", "Gants de cuir fendus", "Carnet d'heures supplémentaires", "40 h"],
    feature: { name: "Les cales", text: "Au Port-Franc, tu connais les grues, les cales et ceux qui y vendent. Tu trouves en une soirée où acheter ou vendre sans déclarer, et un docker te cache pour une nuit." },
  },
  {
    id: "cp-h-ancien-huissier",
    genre: "cyberpunk",
    name: "Ancien Huissier",
    blurb: "Tu as changé des serrures pour la Foncière. Tu as rendu ton brassard.",
    skills: ["Intimidation", "Intuition"],
    tool: "Outils de serrurier",
    gear: ["Brassard jaune décousu", "Visière opaque rayée", "Matraque réformée", "Un avis jamais remis", "30 h"],
    feature: { name: "Rendre son brassard", text: "Tu connais la procédure, les tournées et les mots de passe de ton ancienne escouade. Les clercs te prennent d'abord pour un des leurs ; les Huissiers qui te reconnaissent te traitent en traître." },
  },
  {
    id: "cp-h-infirmier",
    genre: "cyberpunk",
    name: "Infirmier de Bloc",
    blurb: "Tu as soigné des gens qui fondaient, sans pouvoir rien y faire.",
    skills: ["Médecine", "Intuition"],
    tool: "Trousse d'infirmier",
    gear: ["Blouse de fibre", "Trousse d'infirmier", "Carnet de patients", "Seringues sous scellé", "20 h"],
    feature: { name: "Le palier se souvient", text: "Dans les Blocs, quelqu'un que tu as soigné te loge, te nourrit et te prévient des Huissiers. Il y en a toujours un à portée de couloir." },
  },
  {
    id: "cp-h-fouineur",
    genre: "cyberpunk",
    name: "Fouineur",
    blurb: "Tu entres dans le Réseau, et tu as déjà laissé une trace.",
    skills: ["Investigation", "Arcanes / Savoir"],
    tool: "Outils de fouineur",
    gear: ["Console de poignet usée", "Câbles et adaptateurs", "Boîtier brouilleur de poche", "Carnet de mots de passe périmés", "20 h"],
    feature: { name: "Une trace derrière toi", text: "Tu commences la partie avec une trace, qui retombe au premier loyer payé. En échange, tu connais le Réseau d'un Bloc : avantage à ton premier test pour y entrer, et un autre fouineur te doit un service." },
  },
  {
    id: "cp-h-coursier",
    genre: "cyberpunk",
    name: "Coursier des passerelles",
    blurb: "Tu livres des colis à pied, par les toits et les passerelles, plus vite que le tram.",
    skills: ["Acrobaties", "Discrétion"],
    tool: "Outils de grimpeur",
    gear: ["Sac thermique à sangle", "Grappin de poignet", "Plan des passerelles griffonné", "Gants de grimpeur", "30 h"],
    feature: { name: "Raccourcis", text: "Tu connais les toits, les passerelles et les raccourcis entre deux Blocs. Dans une course-poursuite en ville, tu trouves une sortie dont personne ne se doute." },
  },
  {
    id: "cp-h-avocat",
    genre: "cyberpunk",
    name: "Avocat de locataires",
    blurb: "Tu as plaidé contre la Foncière dans les couloirs. Tu as perdu.",
    skills: ["Persuasion", "Histoire"],
    tool: "Codes et formulaires du Bail",
    gear: ["Costume usé aux coudes", "Dossiers de plaintes", "Un Bail annoté à la main", "Tampon de greffe périmé", "30 h"],
    feature: { name: "Vice de forme", text: "Une heure sur un avis d'expulsion ou un mandat : un test d'Histoire DD 12 repère le vice de procédure, et l'expulsion est retardée d'un jour." },
  },
  {
    id: "cp-h-friche",
    genre: "cyberpunk",
    name: "Enfant de la Friche",
    blurb: "Tu as grandi sur un toit à demi noyé. Tu sais vivre sans heures.",
    skills: ["Survie", "Discrétion"],
    tool: "Outils de pêcheur",
    gear: ["Barque à demi pontée", "Filet et lignes", "Manteau de pluie rapiécé", "Fanion de la Friche", "Du troc : trois conserves"],
    feature: { name: "Vivre sans heures", text: "À la Friche, tu trouves à manger et à dormir sans un sou d'heure, tu connais les digues et les barques, et les Sans-Bail te reconnaissent comme l'un des leurs." },
  },
  {
    id: "cp-h-taupe",
    genre: "cyberpunk",
    name: "Taupe des Souterrains",
    blurb: "Tu as entretenu les pompes sous la Résidence, dans l'eau jusqu'aux genoux, sans remonter.",
    skills: ["Perception", "Survie"],
    tool: "Outils de plombier et de mécanicien de pompe",
    gear: ["Cuissardes", "Lampe frontale", "Clé à pipe", "Carte des tunnels à moitié effacée", "20 h"],
    feature: { name: "Les tunnels", text: "Tu connais les tunnels, les pompes et les Bornes : tu ne te perds jamais sous terre, et tu sens quand l'eau va monter et par où." },
  },
];

/** Suggestions de personnalité de la Résidence (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_RESIDENCE: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je regarde mon solde avant de m'asseoir, et avant de sourire.",
    "Je compte tout en heures : un repas, une dette, un ami.",
    "Je dis « ça m'a coûté une semaine » pour tout ce qui me pèse.",
    "Je tiens mon poignet gauche caché sous la manche, même au chaud.",
    "Je connais le numéro de porte de tous ceux que je croise.",
    "Je garde un bol de soupe au chaud pour le premier qui sonne.",
  ],
  ideal: [
    "Les locataires. Un Bloc qui se tient vaut une armée.",
    "La liberté. Aucun Bail ne vaut un souffle sans Compteur.",
    "La loyauté. Ceux qui paient pour moi, je les paie en retour.",
    "La vérité. Ce qui est caché finit par coûter plus cher que ce qui est dit.",
    "L'argent. Une heure, c'est la seule chose qui ne ment pas.",
    "L'ordre. Sans quelqu'un pour tenir la Digue, personne n'a rien.",
  ],
  bond: [
    "Je dois 300 h à une voisine qui n'a jamais rien réclamé.",
    "Ma sœur a vendu cinq ans à une Clinique. Je veux les lui rendre.",
    "Un Huissier m'a prévenu la veille d'un avis. Je lui dois une nuit.",
    "J'ai arraché mon Compteur le soir de la Nuit des Clés. Je ne l'ai dit à personne.",
    "Un vieux du Bloc 14 m'a appris à lire. Il fond, et je ne sais pas le payer.",
    "Je cherche quelqu'un dont je n'ai que le numéro d'appartement.",
  ],
  flaw: [
    "Je mens sur mon solde, même quand ça ne sert à rien.",
    "Je n'ai jamais dit non à une dette. Je recommencerais.",
    "Je méprise ceux des Hauts, sans les avoir vus de près.",
    "Je lis le Compteur des autres avant leur visage.",
    "Je garde rancune à tous ceux qui m'ont vu perdre une semaine.",
    "J'ai peur de l'eau qui monte, et je préfère mourir que l'avouer.",
  ],
};
