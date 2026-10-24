// Origines jouables et historiques du Grand Sec (post-apocalyptique, an 40 du Sec), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Agilité, 2 Endurance, 3 Savoir, 4 Instinct, 5 Présence.
// Les origines sont des milieux, pas des peuples. L'argent se compte en godets (un quart de litre d'eau propre).
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_SEC: Origin[] = [
  {
    id: "pa-gens-puits",
    genre: "post-apo",
    name: "Gens des puits",
    blurb: "Né dans une ville à puits, Avignon ou Nîmes. On a toujours eu un peu d'eau, et on a toujours eu peur qu'elle baisse.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Nez à citerne", text: "Avantage aux tests d'Investigation et de Survie pour trouver une citerne, un puits ou une réserve dans une ville morte ou une ruine. Argent de départ : 40 godets." },
      { name: "Le prix de tout", text: "Tu sais ce que vaut un seau d'eau, une capsule, une lame : avantage à tes tests d'Intuition et de Persuasion pour estimer ou marchander en godets." },
      { name: "Peur de la soif", text: "Le jour où ta gourde est à moins de quatre godets, tu as le désavantage à ta première sauvegarde d'Instinct contre la peur." },
    ],
    subs: [
      {
        id: "pa-puits-avignon",
        name: "Avignonnais",
        blurb: "Tu as grandi à l'ombre des remparts-citernes, entre le Grand Puits et le tribunal. Un godet frappé d'un sceau, tu sais d'où il vient.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Sceau de la ville", text: "Maîtrise de Persuasion et d'Histoire. Tu reconnais un godet faux, et un Puisatier te reçoit toujours : un lit pour une nuit, une audience brève." },
        ],
      },
      {
        id: "pa-puits-nimes",
        name: "Rescapé de Nîmes",
        blurb: "Ta ville a perdu la guerre des Puits. Tu as gardé les gestes, la mémoire des galeries, et une dent contre Avignon.",
        bonus: { 2: 1, 4: 1 },
        traits: [
          { name: "Galeries perdues", text: "Maîtrise de Survie et de l'outillage de puisatier. Tu sais lire un mur de galerie, et tu as l'avantage aux sauvegardes contre les éboulements. Désavantage à ton premier test de Persuasion avec chaque Avignonnais." },
        ],
      },
    ],
  },
  {
    id: "pa-enfants-route",
    genre: "post-apo",
    name: "Enfants de la Route",
    blurb: "Né sur un char à voile ou dans un relais de la Route. On sait lire le vent et le sable.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Lire le vent", text: "Avantage aux tests de Survie pour prévoir le temps, et aux tests d'Agilité ou d'Instinct pour piloter un char à voile. Argent de départ : 30 godets." },
      { name: "Voyageur sec", text: "Quand tu voyages (char, convoi, marche de plus de quatre heures), ta ration passe à 5 godets (7 en été), au lieu de 6 (8 en été). Ne se cumule pas avec une autre réduction de ration." },
      { name: "Mal de terre ferme", text: "Après trois nuits passées au même endroit, tu as le désavantage à ton initiative et à tes tests de Perception le lendemain, jusqu'à ce que tu aies bougé." },
    ],
    subs: [
      {
        id: "pa-route-char",
        name: "Enfant de char",
        blurb: "Tu es né sous une voile carrée, entre deux caisses de sel. Tu as tenu ta première barre à huit ans.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Tête de mât", text: "Maîtrise d'Acrobaties et de Survie. Tu ne tombes pas d'un char qui roule, et tu estimes à l'œil la distance d'un pont ou d'un relais." },
        ],
      },
      {
        id: "pa-route-relais",
        name: "Gamin de relais",
        blurb: "Tes parents tenaient un relais : l'eau, le fourrage, l'ombre. Tu as vu passer tout le monde, et tu as retenu leurs prix.",
        bonus: { 5: 1, 3: 1 },
        traits: [
          { name: "Tout le monde passe", text: "Maîtrise de Persuasion et d'Intuition. Dans un relais de la Route, on te connaît : l'eau et le fourrage te coûtent un quart de moins." },
        ],
      },
    ],
  },
  {
    id: "pa-saliniers",
    genre: "post-apo",
    name: "Saliniers",
    blurb: "De la côte, des bouilleries. On sait faire l'eau avec la mer et le feu.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Eau de mer", text: "Il te faut un alambic de camp, un fagot et une journée de feu : tu tires 1d6 + 4 godets d'eau douce de l'eau de mer ou saumâtre. Argent de départ : 25 godets et un sac de sel (4 godets)." },
      { name: "Peau de sel", text: "Avantage à tes sauvegardes d'Endurance contre le coup de chaleur et la brûlure du soleil." },
      { name: "Mal de suie", text: "Désavantage à tes sauvegardes d'Endurance contre la fumée, les poussières et les gaz." },
    ],
    subs: [
      {
        id: "pa-sel-bouilleur",
        name: "Bouilleur",
        blurb: "Tu as nourri les feux pendant dix ans. Tu as des bras de forgeron et une toux qui ne passe pas.",
        bonus: { 2: 1, 0: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Mains de bouilleur", text: "Maîtrise d'Athlétisme et d'outils d'alambic. Tu as 1 PV de plus par niveau, et ton alambic donne 2 godets de plus." },
        ],
      },
      {
        id: "pa-sel-pecheur",
        name: "Pêcheur de la côte",
        blurb: "Tu pêches ce que la mer donne encore : des sardines maigres, des coquillages, parfois un thon qui s'est trompé de côte.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Fils de la mer", text: "Maîtrise de Survie et de Perception. Tu nages à ta vitesse, tu retiens ton souffle trois minutes, et tu trouves à manger sur n'importe quelle plage." },
        ],
      },
    ],
  },
  {
    id: "pa-porte-attente",
    genre: "post-apo",
    name: "Gens de la Porte-d'Attente",
    blurb: "Né contre le Mur, dans le camp. On a grandi en regardant des champs verts qu'on n'aurait jamais.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Habitué à se faire petit", text: "Avantage aux tests de Discrétion dans une foule, un camp ou une file. Argent de départ : 10 godets." },
      { name: "Entre miséreux", text: "Avantage aux tests de Persuasion, de Tromperie et d'Intuition auprès des réfugiés, des mendiants et des gens qui n'ont rien." },
      { name: "La distance exacte", text: "Une fois par repos long, si le Mur est en vue, tu as l'avantage à une sauvegarde contre la peur : tu sais exactement à quelle distance il est, et ce que vaut ta vie de ce côté." },
      { name: "Mal vu des installés", text: "Désavantage à ton premier test de Persuasion avec chaque habitant d'une ville à puits ou d'une citadelle." },
    ],
    subs: [
      {
        id: "pa-porte-files",
        name: "Enfant des files",
        blurb: "Tu as passé ton enfance dans la file de l'eau, à tenir la place de ta mère. Tu connais les visages, les tours de rôle, les bonnes histoires.",
        bonus: { 5: 1, 1: 1 },
        traits: [
          { name: "Garder sa place", text: "Maîtrise de Persuasion et d'Intuition. Dans une foule ou une file, personne ne te double ni ne te vole sans que tu le saches." },
        ],
      },
      {
        id: "pa-porte-tole",
        name: "Rat de tôles",
        blurb: "Tu t'es faufilé dans les cabanes, sous les toiles, entre les rouleaux de barbelés. Tu connais chaque trou.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Trous et passages", text: "Maîtrise de Discrétion et d'Escamotage. Tu passes par un trou de la taille de ta tête, et tu ne fais jamais de bruit sur de la tôle." },
        ],
      },
    ],
  },
  {
    id: "pa-montagnards",
    genre: "post-apo",
    name: "Montagnards",
    blurb: "Des Cévennes ou des Alpilles, des villages de pierre. On creuse, on garde des chèvres, on se méfie.",
    bonus: { 0: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Pied de chèvre", text: "Avantage aux tests d'Athlétisme pour grimper et de Survie pour pister dans la montagne. Argent de départ : 20 godets et une chèvre." },
      { name: "Pas peur des tours", text: "Avantage à tes sauvegardes contre la peur près des grandes tours de métal des crêtes, la nuit où elles chantent." },
      { name: "Parler peu", text: "Désavantage à ton premier test de Persuasion ou de Représentation avec chaque inconnu." },
    ],
    subs: [
      {
        id: "pa-montagnards-chevres",
        name: "Gardeur de chèvres",
        blurb: "Tu gardes des chèvres maigres sur des pentes sans herbe. Tu comptes tes bêtes, et tu sais quand l'une d'elles va mourir.",
        bonus: { 4: 1, 2: 1 },
        traits: [
          { name: "Œil de berger", text: "Maîtrise de Dressage et de Perception. Tu vois à trois kilomètres un mouvement dans la montagne, et ta chèvre te suit partout." },
        ],
      },
      {
        id: "pa-montagnards-pierre",
        name: "Creuseur de restanques",
        blurb: "Tu entretiens des murs de pierre sèche qui retiennent la dernière terre. Tu as des mains de maçon et une patience de pierre.",
        bonus: { 0: 1, 2: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Mains de pierre", text: "Maîtrise d'Athlétisme et de l'outillage de maçon. Tu as 1 PV de plus par niveau, et tu creuses ou bâtis deux fois plus vite (ne se cumule pas avec le pouvoir Creuser)." },
        ],
      },
    ],
  },
  {
    id: "pa-descendus",
    genre: "post-apo",
    name: "Descendus de Montclair",
    blurb: "Né Fontainier, chassé ou enfui. On a connu la pluie.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Mains de jardin", text: "Avantage aux tests de Médecine et de Survie pour soigner et cultiver. Tu sais lire, écrire et compter, et tu as une maîtrise d'Histoire. Argent de départ : 15 godets et un sachet de graines." },
      { name: "Soif de la pluie", text: "Ton corps a perdu l'habitude du manque : jusqu'à la fin de la première saison de jeu, ta ration est de 1 godet de plus par jour." },
      { name: "Mal vu du bas", text: "Désavantage à ton premier test de Persuasion avec chaque habitant du Bas-Pays qui sait d'où tu viens." },
    ],
    subs: [
      {
        id: "pa-descendus-chasse",
        name: "Fontainier chassé",
        blurb: "On t'a mis dehors pour un péché que tu n'avoues pas. Tu pries encore chaque matin, tourné vers la montagne.",
        bonus: { 4: 1, 5: 1 },
        traits: [
          { name: "Prière du matin", text: "Maîtrise d'Intuition et d'Histoire. Une fois par repos long, tu relances une sauvegarde de Présence ratée, après une prière." },
        ],
      },
      {
        id: "pa-descendus-fugitif",
        name: "Fugitif",
        blurb: "Tu t'es échappé de nuit, par la porte basse, avec ce que tu portais. Tu sais que quelqu'un te cherche.",
        bonus: { 1: 1, 5: 1 },
        traits: [
          { name: "Pas de nuit", text: "Maîtrise de Discrétion et de Tromperie. Tu as l'avantage aux tests de Discrétion de nuit, et tu vois dans le noir à 9 m." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_SEC: Background[] = [
  {
    id: "pa-h-batelier",
    genre: "post-apo",
    name: "Batelier de sable",
    blurb: "Tu as tenu une voile et un harpon sur la Route.",
    skills: ["Athlétisme", "Survie"],
    tool: "Outils de batelier (cordages, voile)",
    gear: ["Harpon de batelier", "Cordage de vingt mètres", "Chèche et lunettes de sable", "Gourde de douze godets", "30 godets"],
    feature: { name: "Un quai pour une nuit", text: "Dans chaque relais de la Route, un patron de char te laisse un coin de plateau pour la nuit et te dit ce qu'il a vu : un barrage, un convoi, une panne." },
  },
  {
    id: "pa-h-puisatier",
    genre: "post-apo",
    name: "Puisatier",
    blurb: "Tu as tiré l'eau du Grand Puits et frappé des godets.",
    skills: ["Athlétisme", "Intuition"],
    tool: "Outillage de puisatier",
    gear: ["Pioche à manche court", "Tablier de cuir", "Corde et poulie", "Gourde de douze godets", "30 godets"],
    feature: { name: "Un seau pour un confrère", text: "Dans une ville à puits, un puisatier te sert un seau d'eau et t'indique à qui parler. Tu connais le prix exact du godet de la ville." },
  },
  {
    id: "pa-h-bouilleur",
    genre: "post-apo",
    name: "Bouilleur de sel",
    blurb: "Tu as fait de l'eau avec la mer et le feu.",
    skills: ["Médecine", "Survie"],
    tool: "Outils d'alambic",
    gear: ["Gants de cuir épais", "Pelle à sel", "Chèche blanc", "Gourde de douze godets", "20 godets"],
    feature: { name: "Un feu sur la côte", text: "Sur la côte, une bouillerie te prête un feu et une cuve pour la nuit. Tu sais où est l'eau douce la moins chère, et qui la vend." },
  },
  {
    id: "pa-h-pillard",
    genre: "post-apo",
    name: "Pillard repenti",
    blurb: "Tu as couru avec la Horde, et tu t'en es allé.",
    skills: ["Discrétion", "Intimidation"],
    tool: "Outils de crochetage",
    gear: ["Foulard rouge déteint", "Lance courte", "Cuir clouté", "Gourde de dix godets", "20 godets"],
    feature: { name: "Un signe connu", text: "Tu connais les signes de la Horde : une main peinte, un nœud de corde, un caillou retourné. Tu lis ce qu'ils disent, et un ancien compagnon t'écoute encore, parfois." },
  },
  {
    id: "pa-h-penitent",
    genre: "post-apo",
    name: "Pénitent",
    blurb: "Tu as marché dans les processions, et tu ne sais plus si tu y crois.",
    skills: ["Histoire", "Persuasion"],
    tool: "Chapelet de cailloux",
    gear: ["Cagoule grise", "Bâton de pluie", "Cahier de psaumes", "Gourde de douze godets", "10 godets"],
    feature: { name: "Un coin de cave", text: "Dans une chapelle, une cave ou un campement de pénitents, on te laisse dormir et on partage avec toi un repas et un godet d'eau. Les pèlerins te saluent." },
  },
  {
    id: "pa-h-fouilleur",
    genre: "post-apo",
    name: "Fouilleur des ruines",
    blurb: "Tu sais ce qu'il y a encore dans les villes mortes.",
    skills: ["Investigation", "Perception"],
    tool: "Outils de fouilleur",
    gear: ["Pied-de-biche", "Corde et lampe", "Sac à bretelles", "Gourde de dix godets", "20 godets"],
    feature: { name: "Un revendeur", text: "Dans une ville ou un relais, un revendeur te rachète tes trouvailles sans poser de question et te dit ce qui se cherche en ce moment." },
  },
  {
    id: "pa-h-gardian",
    genre: "post-apo",
    name: "Gardian du sel",
    blurb: "Tu as guidé des convois à travers le delta.",
    skills: ["Dressage", "Survie"],
    tool: "Perche de guide",
    gear: ["Perche à fer", "Lasso de vingt mètres", "Chapeau noir", "Gourde de douze godets", "20 godets"],
    feature: { name: "Un gué connu", text: "Dans le delta et sur les plaines de sel, tu trouves toujours un passage à pied sec, et un mas t'héberge pour une nuit." },
  },
  {
    id: "pa-h-mur",
    genre: "post-apo",
    name: "Enfant du Mur",
    blurb: "Tu as grandi à la Porte-d'Attente, et tu connais un passage.",
    skills: ["Discrétion", "Escamotage"],
    tool: "Outils de crochetage",
    gear: ["Couteau", "Corde fine", "Toile de camp", "Gourde de dix godets", "10 godets"],
    feature: { name: "Un trou dans la clôture", text: "Dans un camp, une enceinte ou un quartier fermé, il te faut une nuit pour trouver comment entrer et sortir sans passer par la porte." },
  },
];

/** Suggestions de personnalité du Grand Sec (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_SEC: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je compte mes godets avant de dormir, deux fois.",
    "Je ne gaspille jamais une goutte : je finis même l'eau du bol des autres.",
    "Je lève le nez avant de parler, pour sentir le vent.",
    "Je ne m'assois jamais dos à une porte.",
    "Je donne un nom à tous les chevaux et à toutes les gourdes.",
    "Je ne parle pas avant midi.",
  ],
  ideal: [
    "L'eau pour tous. Un puits qui ne sert qu'à un clan finit par tuer le clan.",
    "La Route. Tant que le vent souffle, il y a un endroit où aller.",
    "Le travail. Ce qu'on répare vaut mieux que ce qu'on pille.",
    "La loyauté. Un convoi ne vaut que par ceux qui y restent.",
    "La foi. Il pleuvra de nouveau, ou on sera digne de la pluie.",
    "La liberté. Aucun mur ne me retiendra.",
  ],
  bond: [
    "Je dois une gourde pleine à quelqu'un qui est mort sans la boire.",
    "Ma sœur est restée à la Porte-d'Attente. Je lui rapporte de l'eau chaque année.",
    "Un vieux patron m'a pris sur son char quand personne ne voulait de moi.",
    "Je cherche un puits que mon père a creusé, et qu'on dit comblé.",
    "J'ai juré à un mourant de remettre sa montre à sa fille.",
    "Je protège un enfant qui ne sait pas encore qu'il porte mon nom.",
  ],
  flaw: [
    "Je ne partage jamais ma dernière gorgée.",
    "Je bois en cachette, quand les autres dorment.",
    "Je mens sur ce que j'ai fait avant le convoi.",
    "Je ne fais confiance à personne qui a plus d'eau que moi.",
    "Je me sens coupable à chaque puits que je quitte, et je repars quand même.",
    "Je déteste ceux de la montagne, sans les connaître.",
  ],
};
