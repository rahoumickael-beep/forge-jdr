// Origines jouables et historiques du Champ-d'Asile (western, 1878), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Adresse, 2 Endurance, 3 Savoir, 4 Instinct, 5 Présence.
// Les origines sont des milieux, pas des essences : chacune a un petit défaut jouable, et l'argent de départ se compte en dollars.
// Les Gens de la Comanchería (Numunuu, Quahadi) sont un peuple réel : on décrit des usages et une langue, jamais un cliché.
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_ASILE: Origin[] = [
  {
    id: "ws-asiliens",
    genre: "western",
    name: "Asiliens de souche",
    blurb: "Descendant des grognards et des familles de 1818. On a un nom connu, des cousins partout et un sabre au-dessus de la cheminée.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un nom connu", text: "Avantage aux tests de Persuasion et d'Intuition pour obtenir de l'aide dans le Champ : un lit, un repas, un cheval prêté. Argent de départ : 35 dollars et un objet de famille." },
      { name: "Cousins partout", text: "Dans chaque village du Champ, quelqu'un est de ta famille ou connaît ton père. Une fois par semaine de jeu, il te dit ce qui se raconte." },
      { name: "Le poids du nom", text: "Désavantage à tes tests de Discrétion pour passer inaperçu dans le Champ : on te reconnaît, et on te doit le respect, ou des comptes." },
    ],
    subs: [
      {
        id: "ws-asiliens-rancho",
        name: "Famille de rancho",
        blurb: "Tu as grandi dans une maison de pierre à galerie, entre des bœufs et un sabre d'Empire. Tu n'as pas d'argent, mais tu as de la terre.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Les terres du Brazos", text: "Maîtrise de Dressage et d'Histoire. Dans les ranchos du Brazos, on te donne une couchette et un cheval frais, et on te dit qui a vendu à qui." },
        ],
      },
      {
        id: "ws-asiliens-ville",
        name: "Famille de Bonne-Espérance",
        blurb: "Ton père siégeait à l'Assemblée ou tenait boutique sur la place. Tu sais voter à main levée, et à qui parler le lundi.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "La place et l'Assemblée", text: "Maîtrise de Persuasion et d'Histoire. Tu sais où se prennent les décisions, et tu obtiens un rendez-vous avec un membre de l'Assemblée en moins d'un jour." },
        ],
      },
    ],
  },
  {
    id: "ws-creoles",
    genre: "western",
    name: "Créoles de Louisiane",
    blurb: "Venu par le Mississippi et la Rivière Rouge. On parle français, anglais et créole, et on connaît les gens du fleuve.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Langues du fleuve", text: "Tu parles le français, l'anglais et le créole. Avantage aux tests de Persuasion et d'Intuition là où l'on commerce : marché, quai, comptoir. Argent de départ : 30 dollars." },
      { name: "Les gens du fleuve", text: "Dans une ville de bord de rivière, un batelier, un docker ou un cuisinier te connaît ou connaît quelqu'un de ta famille. Une fois par semaine de jeu, il te donne un renseignement ou une place sur un bateau." },
      { name: "Pas de racines ici", text: "Tu n'as ni terre ni cousin au Champ. La première fois que tu demandes de l'aide à une famille de souche, tu as le désavantage au test." },
    ],
    subs: [
      {
        id: "ws-creoles-fleuve",
        name: "Fils du fleuve",
        blurb: "Tu as grandi sur un quai de La Nouvelle-Orléans, entre les balles de coton et les chants de la rivière. Tu sais te débrouiller partout.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Quai et bateau", text: "Maîtrise d'Athlétisme et de Perception. Tu nages comme tu marches, et tu repères une fausse monnaie ou une balle de coton trafiquée à vingt pas." },
        ],
      },
      {
        id: "ws-creoles-salon",
        name: "Famille de négociants",
        blurb: "Les tiens vendaient du sucre, du tabac, des étoffes. Tu as appris à compter avant de lire, et à sourire avant de demander.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Comptes et cartes", text: "Maîtrise de Persuasion et d'Escamotage. Tu estimes la valeur d'une marchandise à 10 % près, et un marchand te vend au prix coûtant la première fois." },
        ],
      },
    ],
  },
  {
    id: "ws-vaqueros",
    genre: "western",
    name: "Vaqueros",
    blurb: "Mexicain ou Tejano, élevé dans les ranchos du sud. On connaît la frontière du sud comme sa poche et les chevaux comme sa famille.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "En selle depuis l'enfance", text: "Avantage à tous les tests d'Athlétisme, d'Acrobaties et de Dressage faits en selle. Argent de départ : 25 dollars, une selle et une paire d'éperons." },
      { name: "La frontière du sud", text: "Tu connais les gués du Concho, les villages, les routes et les mots de passe du sud. Avantage aux tests de Survie et de Perception le long de la frontière." },
      { name: "Mal vu des étoiles", text: "Désavantage à ton premier test de Persuasion avec chaque Ranger et chaque rural : ils ont appris à se méfier de ceux qui connaissent les gués." },
    ],
    subs: [
      {
        id: "ws-vaqueros-ranch",
        name: "Vaquero de rancho",
        blurb: "Tu as mené des bœufs au Kansas et ramené des chevaux. Tu connais chaque rancher du Brazos et son compte en banque.",
        bonus: { 2: 1, 4: 1 },
        traits: [
          { name: "Du Brazos au Kansas", text: "Maîtrise de Dressage et de Survie. Un rancher t'embauche sans discuter à 30 dollars par mois, et te prête un cheval frais." },
        ],
      },
      {
        id: "ws-vaqueros-sud",
        name: "Tejano de la frontière",
        blurb: "Tu viens d'un village du sud, de l'autre côté du Concho. Tu parles trois langues et tu sais ce qui passe la nuit.",
        bonus: { 3: 1, 1: 1 },
        traits: [
          { name: "Trois langues et un gué", text: "Maîtrise de Discrétion et d'Intuition. Tu parles l'espagnol, l'anglais et le français ; tu trouves un passage de nuit sans lumière." },
        ],
      },
    ],
  },
  {
    id: "ws-comancheria",
    genre: "western",
    name: "Gens de la Comanchería",
    blurb: "Numunuu, « le Peuple », ou enfant de deux mondes né au poste de la Croix-de-Pierre. On parle la langue de la traite et on connaît les usages des deux camps.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Langue de la traite", text: "Tu parles le français, la langue des Numunuu et la langue de la traite, mêlée d'espagnol. Tu connais les usages des deux camps : qui offre le premier, qui s'assoit où. Avantage aux tests de Persuasion et d'Intuition pour négocier, et de Dressage pour calmer ou dresser un cheval. Argent de départ : 20 dollars et un cheval de ton choix." },
      { name: "Chez toi à l'ouest", text: "À l'ouest de la Croix-de-Pierre, tu es chez toi : avantage aux tests de Survie et de Perception dans la Comanchería, et personne ne te demande qui tu es." },
      { name: "Étranger à Fort-Rail", text: "À Fort-Rail et chez les gens de l'Est, tu as le désavantage à ton premier test de Persuasion avec chaque inconnu : on te regarde avant de t'écouter." },
    ],
    subs: [
      {
        id: "ws-comancheria-quahadi",
        name: "Numunuu des Quahadi",
        blurb: "Ce que Bonne-Espérance a mis dans des livres, ton camp le dit à voix haute, depuis plus longtemps qu'eux.",
        bonus: { 1: 1, 2: 1 },
        traits: [
          { name: "Cavalier du Llano", text: "Maîtrise de Survie et d'Histoire. Tu connais les points d'eau du Llano et les récits de ton camp, mot pour mot. Tu montes sans selle sans désavantage." },
        ],
      },
      {
        id: "ws-comancheria-croix",
        name: "Enfant de la Croix-de-Pierre",
        blurb: "Né au poste de traite d'un père asilien ou d'une mère comanche, ou l'inverse. Tu as grandi entre deux feux, assis aux deux tables.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Deux tables", text: "Maîtrise de Persuasion et d'Intuition. Tu sers d'interprète entre deux camps : chacun te fait confiance un peu plus qu'à l'autre." },
        ],
      },
    ],
  },
  {
    id: "ws-est",
    genre: "western",
    name: "Gens de l'Est",
    blurb: "Américain, Irlandais, Allemand, venu avec le rail ou contre lui. On connaît les villes, la loi américaine, l'argent, et on ne parle le français qu'à moitié.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "La loi et l'argent", text: "Tu parles l'anglais, un peu d'allemand ou de gaélique, et tu connais le droit américain, le télégraphe et le prix des choses. Avantage aux tests d'Histoire et d'Investigation sur un contrat, un mandat ou un acte. Argent de départ : 40 dollars." },
      { name: "Les villes", text: "Dans une ville de l'Est ou une gare, tu t'y retrouves : avantage aux tests d'Investigation et de Persuasion pour trouver un renseignement, une chambre, un avocat." },
      { name: "Français à moitié", text: "Tu as le désavantage à tes tests de Persuasion ou de Tromperie en français avec un Asilien de souche. Tu comprends tout, tu rates les nuances." },
    ],
    subs: [
      {
        id: "ws-est-rail",
        name: "Ouvrier du rail",
        blurb: "Tu as posé des traverses de Saint-Louis à Fort-Rail. Tu as des mains fendues, un cœur qui compte les jours, et un camarade enterré le long de la voie.",
        bonus: { 0: 1, 2: 1 },
        hpPerLevel: 1,
        traits: [
          { name: "Mains de voie", text: "Maîtrise d'Athlétisme et de Perception. Tu as 1 PV de plus par niveau, et tu manies un marteau, une pioche ou une barre à mine sans désavantage." },
        ],
      },
      {
        id: "ws-est-bureau",
        name: "Clerc ou géomètre de l'Est",
        blurb: "Tu as quitté un bureau de Saint-Louis pour la prairie. Tu as vu des cartes que personne ici n'a vues.",
        bonus: { 3: 1, 4: 1 },
        traits: [
          { name: "Cartes et registres", text: "Maîtrise d'Investigation et d'Histoire. Tu lis un tracé, un plan ou un registre deux fois plus vite, et tu sais si un papier est faux." },
        ],
      },
    ],
  },
  {
    id: "ws-revenants",
    genre: "western",
    name: "Revenants de la guerre",
    blurb: "Ancien soldat de la Sécession, du côté de l'Union ou de la Confédération. On est venu chercher l'oubli, et on a trouvé un pays.",
    bonus: { 0: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Endurci au feu", text: "Avantage aux sauvegardes contre la peur quand on te tire dessus. Tu sais où se mettre sous le feu. Argent de départ : 25 dollars et une médaille ou un insigne de régiment." },
      { name: "Un homme de rang", text: "Tu sais obéir, commander et tenir une ligne. Avantage aux tests d'Intimidation et d'Athlétisme quand tu agis en groupe." },
      { name: "Le souvenir revient", text: "Une fois par séance, au pire moment (un tir, un cri, une odeur de poudre), le MJ peut te demander une sauvegarde de Présence DD 10 : en cas d'échec, tu es effrayé jusqu'à la fin de ton prochain tour." },
    ],
    subs: [
      {
        id: "ws-revenants-union",
        name: "Soldat de l'Union",
        blurb: "Tu as porté le bleu, sous un colonel ou un sergent. Tu as gardé de la discipline et de l'amertume.",
        bonus: { 2: 1, 5: 1 },
        traits: [
          { name: "Le bleu", text: "Maîtrise d'Athlétisme et d'Intimidation. Dans une ville de l'Est, un ancien de l'Union te doit un service, et un ancien de l'autre camp te surveille." },
        ],
      },
      {
        id: "ws-revenants-confedere",
        name: "Soldat de la Confédération",
        blurb: "Tu as porté le gris, jusqu'au bout ou jusqu'à la désertion. Tu as perdu une cause et appris à te passer de beaucoup.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Le gris", text: "Maîtrise de Discrétion et de Survie. Tu sais vivre sur le pays et dormir à la belle étoile ; un ancien du sud te donne un abri, un ancien du nord te regarde de travers." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_ASILE: Background[] = [
  {
    id: "ws-h-vaquero",
    genre: "western",
    name: "Vaquero",
    blurb: "Tu as mené des troupeaux du Brazos au Kansas.",
    skills: ["Dressage", "Survie"],
    tool: "Matériel de selle (lasso, selle, éperons)",
    gear: ["Lasso de crin", "Selle et éperons", "Chapeau à larges bords", "Gourde", "25 dollars"],
    feature: { name: "La piste à bétail", text: "Tu connais les pistes du Kansas, leurs relais et leurs gués. Avantage aux tests de Survie pour trouver de l'eau et du fourrage pour des bêtes sur une piste, et un vieux de la piste te redit ce qu'il sait." },
  },
  {
    id: "ws-h-soldat",
    genre: "western",
    name: "Ancien soldat",
    blurb: "Tu as fait la guerre de Sécession.",
    skills: ["Athlétisme", "Intimidation"],
    tool: "Matériel de campement",
    gear: ["Veste usée de l'armée", "Gamelle et couverture", "Insigne de régiment", "Couteau", "20 dollars"],
    feature: { name: "Un ancien de ton régiment", text: "Un ancien de ton régiment, quelque part, te doit un service. Une fois par semaine de jeu, il te donne un abri, un renseignement ou une introduction." },
  },
  {
    id: "ws-h-joueur",
    genre: "western",
    name: "Joueur professionnel",
    blurb: "Tu vis des cartes et de ton sang-froid.",
    skills: ["Escamotage", "Tromperie"],
    tool: "Jeu de cartes",
    gear: ["Deux jeux de cartes", "Jetons d'ivoire", "Gilet brodé", "Derringer de manche", "50 dollars"],
    feature: { name: "Le jeu du lieu", text: "Dans toute ville, tu trouves une partie en moins d'une heure. Tu connais les règles locales, les mauvais perdants et les parieurs qui perdent trop." },
  },
  {
    id: "ws-h-arpenteur",
    genre: "western",
    name: "Arpenteur",
    blurb: "Tu as planté des piquets pour le rail, ou contre lui.",
    skills: ["Investigation", "Survie"],
    tool: "Outils d'arpenteur (mire, chaîne)",
    gear: ["Mire de laiton", "Chaîne d'arpenteur", "Carnet de relevés", "Piquets et maillet", "30 dollars"],
    feature: { name: "Un bureau de comté", text: "Dans un bureau de comté ou de compagnie, un clerc te laisse consulter les cartes et les registres, et te dit qui est venu les voir récemment." },
  },
  {
    id: "ws-h-pasteur",
    genre: "western",
    name: "Pasteur ou prêtre",
    blurb: "Tu as porté une parole dans des endroits qui n'en voulaient pas.",
    skills: ["Histoire", "Persuasion"],
    tool: "Livre noir et chandeliers",
    gear: ["Livre noir usé", "Habit noir et col", "Chapelet ou psautier", "Gourde", "15 dollars"],
    feature: { name: "Un banc pour toi", text: "Dans une église, une mission ou un presbytère, on te donne un lit et un repas, et on te dit ce qu'on y raconte." },
  },
  {
    id: "ws-h-rail",
    genre: "western",
    name: "Ouvrier du rail",
    blurb: "Tu as posé des traverses de Saint-Louis à Fort-Rail.",
    skills: ["Athlétisme", "Perception"],
    tool: "Outils de voie (marteau, barre à mine)",
    gear: ["Marteau de forgeron", "Barre à mine", "Gants de cuir épais", "Gourde", "20 dollars"],
    feature: { name: "Un contremaître te connaît", text: "Sur un chantier du rail, un contremaître t'embauche pour la journée, te dit où passe la voie cette semaine et qui est payé pour regarder ailleurs." },
  },
  {
    id: "ws-h-bisons",
    genre: "western",
    name: "Chasseur de bisons",
    blurb: "Tu as tué plus de bêtes que tu ne veux le dire.",
    skills: ["Survie", "Perception"],
    tool: "Outils de dépeçage",
    gear: ["Fusil Sharps", "Couteau à dépecer", "Peau de bison cousue", "Cartouches roulées à la main", "25 dollars"],
    feature: { name: "Le gibier et ses chemins", text: "Tu sais où passent les troupeaux, où campent les chasseurs et à qui vendre les peaux. Un traitant te rachète tes prises sans te voler." },
  },
  {
    id: "ws-h-fils",
    genre: "western",
    name: "Fils de famille",
    blurb: "Ton nom ouvre les portes de Bonne-Espérance, et en ferme d'autres.",
    skills: ["Histoire", "Persuasion"],
    tool: "Papier à lettres et sceau de famille",
    gear: ["Lettre de recommandation", "Redingote", "Montre de gousset", "Sceau de famille", "50 dollars"],
    feature: { name: "Un nom qui ouvre", text: "Dans le Champ, un rancher ou un membre de l'Assemblée te reçoit à sa table. Mais on te rappelle ce que tu dois à ta famille, et ce que ta famille doit aux autres." },
  },
];

/** Suggestions de personnalité du Champ-d'Asile (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_ASILE: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je ne tourne jamais le dos à la porte.",
    "Je parle à mon cheval plus qu'aux gens.",
    "Je compte mes cartouches chaque soir, deux fois.",
    "Je cite l'Empereur, souvent de travers.",
    "Je regarde toujours l'horizon, côté voie du rail.",
    "Je ne dis jamais mon nom en entier.",
  ],
  ideal: [
    "La parole donnée. Ce qu'on a promis à genoux, on le tient debout.",
    "La terre. Elle est à ceux qui la travaillent, pas à ceux qui la mesurent.",
    "La loi. Mal faite ou pas, c'est la seule qu'on ait.",
    "La liberté. Aucun rail ne m'arrêtera.",
    "Les miens. Le reste peut brûler.",
    "L'argent. On s'en passe, jusqu'au jour où on en a besoin.",
  ],
  bond: [
    "Mon père m'a laissé un sabre d'Empire. Je dois savoir pourquoi il ne l'a jamais décroché.",
    "J'ai juré à un homme mourant de porter une lettre à San Antonio.",
    "Un vieux rancher m'a pris à son service quand personne ne voulait de moi. Je lui dois ma loyauté.",
    "Ma sœur est restée à La Nouvelle-Orléans. Je lui écris chaque mois et elle ne répond pas.",
    "J'ai enterré un camarade le long de la voie, et personne ne l'a su.",
    "Je cherche l'homme qui a brûlé la ferme de ma famille.",
  ],
  flaw: [
    "Je ne laisse jamais une insulte sans réponse.",
    "Je bois quand les autres dorment.",
    "Je mens sur ce que j'ai fait pendant la guerre.",
    "Je ne fais confiance à personne qui porte un col empesé.",
    "Je ne sais pas dire non à une partie de cartes.",
    "Je ne pardonne ni au rail, ni à ceux qui lui ont vendu.",
  ],
};
