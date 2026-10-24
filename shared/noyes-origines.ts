// Origines jouables et historiques de la Côte des Noyés (horreur, 1923), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Adresse, 2 Endurance, 3 Savoir, 4 Sang-froid, 5 Présence.
// Les origines sont des milieux, pas des peuples. L'argent se compte en francs.
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_NOYES: Origin[] = [
  {
    id: "hr-gens-cote",
    genre: "horreur",
    name: "Gens de la côte",
    blurb: "Né à Saint-Clair, à la Hague ou dans un port du Cotentin. Pêcheur, fille de pêcheur, douanier. La mer, on la connaît ; on ne la raconte pas.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Les marées et les gens", text: "Tu sais toujours l'heure de la prochaine marée, et tu connais les coutumes : on ne siffle pas face à la mer, on laisse une assiette à la fenêtre les nuits de tempête. Les gens de la côte te parlent : avantage aux tests de Persuasion auprès d'eux. Argent de départ : 300 francs." },
      { name: "Fils de la baie", text: "Avantage à tes sauvegardes d'Endurance contre le froid, y compris celui de l'eau. Langues : le français, le parler normand de la côte." },
    ],
    subs: [
      {
        id: "hr-cote-pecheur",
        name: "Famille de pêcheurs",
        blurb: "Ton père, ton grand-père et ses frères sont partis à l'aube, tous les jours. Tu as des mains qui savent un filet.",
        bonus: { 2: 1, 0: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Mains de filet", text: "Maîtrise des outils de pêcheur et d'Athlétisme. Tu nages tout habillé sans test, et tu as 1 PV de plus par niveau." },
        ],
      },
      {
        id: "hr-cote-douanier",
        name: "Douanier",
        blurb: "Tu surveilles la côte pour l'État. Tu connais chaque anse, chaque chemin, et ceux qui ne sont pas là pour pêcher.",
        bonus: { 4: 2 },
        traits: [
          { name: "Nuit sur la grève", text: "Maîtrise de Perception et de Survie. Tu vois dans le noir à 9 m, à force de veiller, et tu reconnais un signal de nuit ou une cargaison qui n'est pas déclarée." },
        ],
      },
    ],
  },
  {
    id: "hr-revenus-guerre",
    genre: "horreur",
    name: "Revenus de la guerre",
    blurb: "Un ancien combattant, un poilu, ou une infirmière du front. Il a vu Verdun ou la Somme. Il est rentré, et il dort mal.",
    bonus: { 2: 1, 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Endurci", text: "Avantage à tes sauvegardes de Sang-froid contre le Choc d'un cadavre ou d'un massacre. Argent de départ : 200 francs et une petite pension." },
      { name: "Mauvaises nuits", text: "Après chaque repos long, tu as le désavantage à la première sauvegarde de Sang-froid de la journée, sauf si quelqu'un veille avec toi ou si la lampe est restée allumée toute la nuit." },
    ],
    subs: [
      {
        id: "hr-guerre-poilu",
        name: "Ancien poilu",
        blurb: "Quatre ans de tranchée. Tu as porté des morts et des vivants, et tu ne sais pas toujours lesquels.",
        bonus: { 0: 1, 2: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Le front", text: "Maîtrise des armes de guerre et de Survie. Tu as l'avantage aux sauvegardes contre le froid et la faim, et 1 PV de plus par niveau." },
        ],
      },
      {
        id: "hr-guerre-infirmiere",
        name: "Infirmière du front",
        blurb: "Tu as soigné des hommes que personne ne pouvait sauver. Tu sais ce que fait un moignon, et ce que fait un silence.",
        bonus: { 4: 1, 3: 1 },
        traits: [
          { name: "Mains de lazaret", text: "Maîtrise de Médecine et d'Intuition. Tu stabilises un mourant en action bonus, et tu as l'avantage à tes tests de Médecine sur les blessures de guerre." },
        ],
      },
    ],
  },
  {
    id: "hr-bourgeois-ville",
    genre: "horreur",
    name: "Bourgeois de la ville",
    blurb: "De Paris, de Rouen, du Havre : un milieu aisé, des études, des relations. On t'a appris à ne pas te salir les mains.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "De l'argent et des lettres", text: "Argent de départ : 3 000 francs. Une fois par semaine de jeu, une lettre de recommandation t'ouvre une porte : un notaire, un directeur, un préfet te reçoit dans la journée." },
      { name: "Une politesse due", text: "Quelque part, des gens te doivent une politesse. Une fois par repos long, tu demandes à l'un d'eux un petit service qui ne lui coûte pas cher : un renseignement, un lit, une introduction." },
      { name: "Mal vu de la côte", text: "Les gens de la côte te regardent de travers : désavantage à ton premier test de Persuasion avec chacun d'eux, tant que tu ne lui as pas rendu un service." },
    ],
    subs: [
      {
        id: "hr-ville-etudes",
        name: "Études de droit ou de lettres",
        blurb: "Tu as passé dix ans dans les livres, et tu sais lequel ouvrir.",
        bonus: { 3: 2 },
        traits: [
          { name: "Bibliothèque en tête", text: "Maîtrise d'Histoire et d'une langue de plus (latin, anglais ou allemand). Une fois par repos long, tu poses au MJ une question de savoir qui se trouve dans un livre : il répond franchement." },
        ],
      },
      {
        id: "hr-ville-fortune",
        name: "Fortune du Havre",
        blurb: "Ton père arme des navires, ton oncle les assure. Tu as appris très tôt à lire un bilan et un visage.",
        bonus: { 5: 2 },
        traits: [
          { name: "Nom et relations", text: "Maîtrise de Persuasion. Avantage à tes tests de Persuasion et d'Histoire face aux armateurs, aux courtiers et aux notables, qui te prennent d'abord pour l'un des leurs." },
        ],
      },
    ],
  },
  {
    id: "hr-etrangers",
    genre: "horreur",
    name: "Étrangers",
    blurb: "Anglais, Américains, Bretons ou Auvergnats montés à Paris, Russes blancs en exil : quelqu'un qui n'est pas d'ici.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Une langue de plus", text: "Tu parles le français et une autre langue (l'anglais, le breton, l'auvergnat ou le russe), et tu en lis une troisième. Argent de départ : 500 francs." },
      { name: "Un passé introuvable", text: "Personne ne peut vérifier d'où tu viens. Avantage à tes tests de Tromperie sur ton histoire. Mais la côte se méfie : désavantage à ton premier test de Persuasion avec chaque habitant de Saint-Clair." },
    ],
    subs: [
      {
        id: "hr-etranger-outre",
        name: "Outre-Manche ou outre-Atlantique",
        blurb: "Tu viens de Southampton ou de New York. Tu as un passeport, un compte, et un accent qu'on remarque.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Lettre de crédit", text: "Maîtrise de Persuasion. Une fois par semaine de jeu, tu retires 300 francs à une banque d'une grande ville, sans te justifier." },
        ],
      },
      {
        id: "hr-etranger-exil",
        name: "Exilé ou monté à Paris",
        blurb: "Tu as quitté la Russie, la Bretagne ou l'Auvergne avec une valise. Tu as appris à ne rien demander.",
        bonus: { 2: 1, 4: 1 },
        traits: [
          { name: "Sans attaches", text: "Maîtrise de Discrétion et d'Intuition. Tu sais te faire oublier : avantage à tes tests de Discrétion en ville, et tu repères d'instinct ceux qui te suivent." },
        ],
      },
    ],
  },
  {
    id: "hr-enfants-siecle",
    genre: "horreur",
    name: "Enfants du siècle",
    blurb: "Jeunes, nés après 1900. Ils ont grandi pendant la guerre sans y aller : étudiants, garçonnes, jazz et cinéma. Ils ne croient à rien de vieux.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Moderne", text: "Tu conduis une automobile, tu roules à bicyclette, tu sais te servir d'un appareil photographique et d'un poste de T.S.F. Argent de départ : 400 francs." },
      { name: "Ne croit pas aux signes", text: "Avantage à tes sauvegardes de Sang-froid contre la peur née d'une superstition, d'une coutume ou d'un présage (la cloche en mer, le couvert de trop)." },
      { name: "N'écoute pas les vieux", text: "La première fois que tu vois la mer faire ce qu'elle fait, ta sauvegarde de Sang-froid se fait avec le désavantage." },
    ],
    subs: [
      {
        id: "hr-siecle-etudiant",
        name: "Étudiant",
        blurb: "Tu étudies à Caen, à Rouen ou à Paris. Tu ne sais pas encore quoi faire de ce que tu sais.",
        bonus: { 3: 2 },
        traits: [
          { name: "Esprit vif", text: "Maîtrise d'Investigation et de Perception. Une fois par repos long, tu relances un test d'Investigation que tu viens de rater." },
        ],
      },
      {
        id: "hr-siecle-noctambule",
        name: "Noctambule",
        blurb: "Les cinémas, les bals, le jazz, les cafés ouverts toute la nuit. Tu connais les gens de la ville mieux que ses lois.",
        bonus: { 5: 2 },
        traits: [
          { name: "Nuits blanches", text: "Maîtrise de Représentation et d'Escamotage. Tu ne subis aucun désavantage pour avoir veillé, et tu connais un bar, un hôtel ou un garçon d'étage dans chaque ville." },
        ],
      },
    ],
  },
  {
    id: "hr-sensibles",
    genre: "horreur",
    name: "Sensibles",
    blurb: "Ceux qui ont toujours entendu des choses : des enfants qui voyaient des morts, des rêves qui se réalisaient. On les trouve étranges, et ils ont l'habitude.",
    bonus: { 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Déjà un pied dans l'eau", text: "Tu commences avec 1 de Marée et un Présage. Ta Marée ne descend jamais sous 1. Argent de départ : 250 francs." },
      { name: "Entendre d'avance", text: "Une fois par séance, avant un jet d'initiative ou une sauvegarde, tu demandes au MJ si quelque chose va mal tourner : il te répond par oui ou par non." },
    ],
    subs: [
      {
        id: "hr-sensible-morts",
        name: "L'enfant qui voyait les morts",
        blurb: "Tu as toujours su qui était mort dans une maison avant d'y entrer. Tu as appris à ne pas le dire.",
        bonus: { 4: 1, 5: 1 },
        traits: [
          { name: "Sentir la mort", text: "Maîtrise d'Intuition et de Perception. Tu sens un cadavre ou un lieu où quelqu'un est mort de mort violente à moins de 9 m, sans le voir. Tu ne sais rien de plus." },
        ],
      },
      {
        id: "hr-sensible-reves",
        name: "Le rêveur",
        blurb: "Tes rêves se réalisent, un peu en retard. Tu les écris sur un carnet, la nuit, avant d'oublier.",
        bonus: { 3: 1, 4: 1 },
        traits: [
          { name: "Carnet de rêves", text: "Maîtrise d'Histoire et d'Investigation. Après chaque repos long, le MJ te dit en une phrase ce que tu as rêvé, et la chose se révèle vraie ou fausse dans la semaine." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_NOYES: Background[] = [
  {
    id: "hr-h-expert",
    genre: "horreur",
    name: "Expert en sinistres",
    blurb: "Tu travailles pour la Havraise, et tu sais lire un contrat jusqu'à la dernière ligne.",
    skills: ["Investigation", "Intuition"],
    tool: "Outils de bureau et d'enquête",
    gear: ["Lettre de mission de la Havraise", "Calepin et crayons", "Mètre à ruban", "Police d'assurance annotée", "40 francs"],
    feature: { name: "Prévoir", text: "Tu as une lettre de mission : les bureaux, les gares et les banques te reçoivent, et un clerc de la Havraise te répond dans la journée. Les gendarmes, eux, la regardent de travers." },
  },
  {
    id: "hr-h-poilu",
    genre: "horreur",
    name: "Ancien poilu",
    blurb: "Tu as tenu une tranchée, et tu sais ce qu'un mort pèse.",
    skills: ["Athlétisme", "Survie"],
    tool: "Pelle-bêche",
    gear: ["Capote de l'armée usée", "Gourde", "Livret militaire", "Une médaille", "30 francs"],
    feature: { name: "Camarades de régiment", text: "Un ancien du front est quelque part dans chaque ville : un facteur, un gendarme, un tenancier. Il te cache une nuit, te prête une bicyclette ou te parle sans compter." },
  },
  {
    id: "hr-h-infirmiere",
    genre: "horreur",
    name: "Infirmière du front",
    blurb: "Tu as soigné des hommes que personne ne pouvait sauver.",
    skills: ["Médecine", "Intuition"],
    tool: "Trousse d'infirmière",
    gear: ["Blouse et voile", "Trousse d'infirmière", "Carnet de malades", "Une photographie de sept hommes", "30 francs"],
    feature: { name: "Mains qui savent", text: "Dans un hôpital, un dispensaire ou une cuisine de ferme, on te laisse soigner sans te demander ton diplôme. Un médecin qui t'a vue travailler te reçoit toujours." },
  },
  {
    id: "hr-h-pecheur",
    genre: "horreur",
    name: "Pêcheur de la baie",
    blurb: "Tu connais les marées, la Fosse et ce qu'on n'en dit pas.",
    skills: ["Athlétisme", "Survie"],
    tool: "Outils de pêcheur",
    gear: ["Ciré et bottes", "Gaffe", "Filet et lignes", "Lampe-tempête", "20 francs"],
    feature: { name: "Les pêcheurs se parlent", text: "Dans tout port de la baie, on te prête une barque et on te dit ce qu'on a vu. Tu sais où se pose la mer, à chaque marée." },
  },
  {
    id: "hr-h-journaliste",
    genre: "horreur",
    name: "Journaliste",
    blurb: "Tu as une lettre de mission de ton journal, qui attend un papier.",
    skills: ["Investigation", "Persuasion"],
    tool: "Matériel de sténo",
    gear: ["Lettre de mission du journal", "Carnet de sténo", "Chapeau mou", "Monnaie pour le télégraphe", "40 francs"],
    feature: { name: "Un papier à rendre", text: "Un gendarme, un greffier ou un concierge t'écoute au moins une minute, par crainte de se voir cité. Ton journal t'avance 100 francs de frais par semaine de jeu, en échange de ce que tu lui envoies." },
  },
  {
    id: "hr-h-abbe",
    genre: "horreur",
    name: "Abbé de campagne",
    blurb: "Tu as béni des morts sans nom.",
    skills: ["Histoire", "Intuition"],
    tool: "Missel",
    gear: ["Soutane", "Missel et chapelet", "Étui des saintes huiles", "Cahier de sépultures", "20 francs"],
    feature: { name: "La cure", text: "Dans toute commune qui a un clocher, la cure te loge et te nourrit, et le curé te dit ce que sait le village. Les gens de la côte te laissent entrer dans une maison en deuil." },
  },
  {
    id: "hr-h-medium",
    genre: "horreur",
    name: "Médium",
    blurb: "Tu fais tourner les tables, et parfois les tables répondent.",
    skills: ["Tromperie", "Arcanes / Savoir"],
    tool: "Jeu de tarots",
    gear: ["Nappe et planchette", "Cahier d'écriture automatique", "Bougies", "Robe noire", "30 francs"],
    feature: { name: "Un public", text: "Tu trouves une salle, un guéridon et six personnes qui veulent entendre quelqu'un en une soirée. Elles paient, et l'une d'elles parle un peu trop." },
  },
  {
    id: "hr-h-etudiant-medecine",
    genre: "horreur",
    name: "Étudiant en médecine",
    blurb: "Tu as ouvert des corps à l'école de médecine de Caen.",
    skills: ["Médecine", "Investigation"],
    tool: "Trousse de dissection",
    gear: ["Blouse tachée", "Scalpels et pinces", "Manuel d'anatomie", "Carnet d'amphithéâtre", "30 francs"],
    feature: { name: "L'amphithéâtre", text: "Un médecin ou un interne te laisse examiner un cadavre en son absence. Tu reconnais à vue une blessure, une cause de mort ou un poison courant." },
  },
];

/** Suggestions de personnalité de la Côte des Noyés (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_NOYES: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je laisse toujours la lampe allumée, et je ne dis pas pourquoi.",
    "Je note l'heure de la marée avant de regarder l'heure du train.",
    "Je ne siffle jamais face à la mer.",
    "Je compte les gens autour d'une table avant de m'asseoir.",
    "Je parle à voix basse dans une pièce où il y a un mort.",
    "Je garde un couvert de trop, au cas où.",
  ],
  ideal: [
    "La vérité. Un fait que l'on cache finit par coûter plus cher que celui qu'on dit.",
    "Les familles. Chaque mort a une mère quelque part, et elle doit savoir.",
    "La loi. Sans procès-verbal, il n'y a que des histoires.",
    "L'argent. C'est la seule chose qui ne parle pas.",
    "La côte. On ne laisse pas ses voisins seuls face à la mer.",
    "La science. Tout ce qui existe peut se mesurer, même l'eau.",
  ],
  bond: [
    "Je porte la lettre d'un soldat mort que je n'ai jamais remise.",
    "Mon frère n'est pas revenu de Verdun. Je cherche son nom dans chaque église.",
    "Un pêcheur m'a sauvé la vie. Je lui dois une barque.",
    "J'ai promis à une veuve de savoir pourquoi son mari est parti de nuit.",
    "Je cherche à Caen une fille dont je n'ai que le prénom.",
    "Je dois une explication à ma mère, qui attend depuis trois ans.",
  ],
  flaw: [
    "Je lis le courrier des autres avant qu'on me le demande.",
    "Je ne dors jamais deux nuits de suite dans le même lit.",
    "Je ne supporte pas l'eau calme.",
    "Je mens sur ce que j'ai vu à la guerre.",
    "Je méprise ceux qui croient aux signes, et je les écoute tout de même.",
    "Je ne laisse jamais personne finir sa phrase.",
  ],
};
