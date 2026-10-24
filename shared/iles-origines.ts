// Origines jouables et historiques des Îles du Vent (pirates, Antilles, 1716), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Adresse, 2 Endurance, 3 Savoir, 4 Instinct, 5 Présence.
// Les origines sont des milieux, pas des essences : chacune a un petit défaut jouable, et l'argent de départ se compte en piastres.
// Les Marrons, les Africains libres et les Caraïbes des îles sont des personnes avec leurs raisons, pas des figurants ni des clichés.
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_ILES: Origin[] = [
  {
    id: "pi-flibustiers",
    genre: "pirates",
    name: "Flibustiers de la Côte",
    blurb: "Né à Saint-Domingue ou à la Tortue, fils ou fille de flibustiers. On a appris à naviguer avant de lire, et on sait où se vend une prise.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Le pied marin", text: "Avantage aux tests de mer et de manœuvre. Un pont qui roule ne te gêne pas, et tu t'y déplaces sans désavantage. Argent de départ : 15 piastres." },
      { name: "Où vendre une prise", text: "Tu connais tous les ports où l'on peut vendre une prise sans trop de questions. Une fois par semaine de jeu, tu trouves un acheteur et un prix honnête pour une marchandise de bord." },
      { name: "Marqué par la Côte", text: "Dans un port du roi, on reconnaît un flibustier à sa démarche. Désavantage à ton premier test de Persuasion avec chaque officier ou fonctionnaire du roi." },
    ],
    subs: [
      {
        id: "pi-flibustiers-mousse",
        name: "Mousse de la Côte",
        blurb: "À neuf ans tu montais aux haubans, à douze tu tenais la barre par beau temps. Le pont d'un sloop est la seule maison que tu aies connue.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Né au gréement", text: "Maîtrise d'Acrobaties et de Survie. Tu grimpes dans un gréement à vitesse normale, et tu devines le temps six heures à l'avance." },
        ],
      },
      {
        id: "pi-flibustiers-quai",
        name: "Enfant du quai",
        blurb: "Tu as grandi à l'Anse-aux-Lames, entre les barriques et les chasses-parties. Tu sais ce que vaut un mot donné, et combien coûte un mot repris.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Les comptes du quai", text: "Maîtrise de Persuasion et d'Histoire. Tu estimes la valeur d'une prise à 10 % près, et un patron de taverne te prête une table au fond." },
        ],
      },
    ],
  },
  {
    id: "pi-boucaniers",
    genre: "pirates",
    name: "Boucaniers",
    blurb: "Chasseurs des bois de Saint-Domingue, qui fument la viande sur le boucan et tirent mieux que personne. On est mal à l'aise en ville.",
    bonus: { 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Tir de boucanier", text: "Avantage aux attaques à distance à longue portée avec une arme à feu, et aux tests de Survie en forêt. Argent de départ : 10 piastres et un fusil boucanier." },
      { name: "Viande du boucan", text: "Tu fumes la viande de façon qu'elle tienne un mois : le groupe, avec une journée de chasse, a ses rations pour une semaine. Les bêtes à cornes sauvages te sont familières." },
      { name: "Mal à l'aise en ville", text: "Désavantage à tes tests de Persuasion et de Tromperie dans un bourg de plus de cent habitants : tu sens le boucan, et on te le fait remarquer." },
    ],
    subs: [
      {
        id: "pi-boucaniers-boucan",
        name: "Chasseur du boucan",
        blurb: "Tu as passé dix ans dans les bois de l'île avec un fusil, une meute et un couteau. Les autres chasseurs te laissent la plaine.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Le fusil et la meute", text: "Maîtrise de Survie et de Dressage. Tu dresses un chien de chasse en une semaine, et ta meute (deux chiens) te prévient d'une présence à 36 m." },
        ],
      },
      {
        id: "pi-boucaniers-engage",
        name: "Engagé devenu boucanier",
        blurb: "Tu as signé trois ans de travail pour payer ton passage, tu t'es enfui dans les bois, et les boucaniers t'ont pris. Tu sais ce que vaut la liberté et ce qu'il en coûte.",
        bonus: { 0: 1, 2: 1 },
        traits: [
          { name: "Dos usé, jarret solide", text: "Maîtrise d'Athlétisme et de Discrétion. Tu portes le double sans te plaindre, et tu repères un maître d'habitation ou un chasseur de marrons avant qu'il ne te voie." },
        ],
      },
    ],
  },
  {
    id: "pi-marrons",
    genre: "pirates",
    name: "Marrons",
    blurb: "Nés libres dans les mornes, ou évadés d'une plantation. On connaît le prix de la liberté, on a des alliés dans les villages cachés, et un planteur a mis une prime sur sa tête.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Les mornes pour maison", text: "Avantage aux tests de Discrétion et de Survie dans les montagnes et la forêt. Tu trouves un sentier là où les autres voient un mur. Argent de départ : 5 piastres et une machette." },
      { name: "Les villages des mornes", text: "Dans les mornes, un village de marrons t'accueille pour une nuit sans poser de question, et on y échange des nouvelles. Une fois par semaine de jeu, un éclaireur te dit ce qui se passe sur les routes." },
      { name: "Une prime sur ta tête", text: "Un planteur, quelque part, paie pour ta capture, vivant ou mort. Dans une ville de plantation, le MJ peut faire venir un chasseur de marrons ; tu as le désavantage à tes tests de Persuasion avec un planteur." },
    ],
    subs: [
      {
        id: "pi-marrons-libre",
        name: "Né libre dans les mornes",
        blurb: "Tes parents ont fui avant ta naissance. Tu as grandi dans un village de crête, défendu par des pièges et des sentinelles. La plaine est pour toi un pays étranger.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Sentinelle de crête", text: "Maîtrise de Perception et de Discrétion. Tu entends une conque à trois kilomètres et tu sais y répondre, et les pièges des mornes (fosses, lianes, pieux) ne te surprennent jamais." },
        ],
      },
      {
        id: "pi-marrons-evade",
        name: "Évadé de la plantation",
        blurb: "Tu as été vendu, enchaîné, battu. Tu as couru une nuit entière et les mornes t'ont recueilli. Tu connais les plantations de l'intérieur, et ce qu'elles coûtent à ceux qui y travaillent.",
        bonus: { 0: 1, 3: 1 },
        traits: [
          { name: "Les plantations de l'intérieur", text: "Maîtrise d'Intuition et de Survie. Tu sais lire un maître, un commandeur ou un régisseur d'un regard, et tu reconnais les routes qu'on prend pour fuir." },
        ],
      },
    ],
  },
  {
    id: "pi-france",
    genre: "pirates",
    name: "Gens de France",
    blurb: "Arrivé de Saint-Malo, de Dieppe ou de La Rochelle : engagé, cadet de famille, déserteur. On sait lire, on connaît les lois et les usages du royaume, et on parle aux officiers comme à des égaux.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Lettré", text: "Tu sais lire, écrire et compter. Avantage aux tests d'Histoire et d'Investigation sur un contrat, une lettre ou un acte. Argent de départ : 20 piastres." },
      { name: "Parler aux officiers", text: "Tu connais les usages du royaume : avantage aux tests de Persuasion avec un officier, un fonctionnaire ou un notable français, qui te traite en égal." },
      { name: "Mal d'un pays qu'on ne connaît pas", text: "Tu n'as pas le pied marin ni le pied des bois : désavantage à ton premier test de mer ou de Survie de chaque séance, le temps de t'y faire." },
    ],
    subs: [
      {
        id: "pi-france-cadet",
        name: "Cadet de Saint-Malo",
        blurb: "Tu es le troisième fils d'un armateur : rien à hériter, tout à prouver. On t'a donné une éducation, un pistolet et un billet pour les Îles.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Un nom d'armateur", text: "Maîtrise de Persuasion et d'Histoire. Dans un port français, un négociant te reçoit et te fait crédit de 10 piastres sur parole." },
        ],
      },
      {
        id: "pi-france-deserteur",
        name: "Déserteur de La Rochelle",
        blurb: "Tu as porté le mousquet du roi, puis tu as déserté pour une raison que tu gardes pour toi. Une corde t'attend en France.",
        bonus: { 0: 1, 2: 1 },
        traits: [
          { name: "Discipline de soldat", text: "Maîtrise d'Athlétisme et d'Intimidation. Tu sais tenir une ligne, obéir et commander. Tu reconnais l'uniforme d'une garde-côte à sa coupe, et ses habitudes." },
        ],
      },
    ],
  },
  {
    id: "pi-espagne",
    genre: "pirates",
    name: "Espagnols et Créoles de Cuba",
    blurb: "Né à La Havane, à Carthagène ou à Saint-Domingue espagnol. On parle la langue de l'Empire, on connaît ses ports et ses prêtres, mais un Espagnol chez les flibustiers doit prouver sa loyauté.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "La langue de l'Empire", text: "Tu parles l'espagnol, le français et un peu de latin d'Église. Avantage aux tests de Persuasion et d'Intuition avec un Espagnol, un prêtre ou un marchand de l'Empire. Argent de départ : 15 piastres." },
      { name: "Ports et chapelles", text: "Tu connais les ports espagnols, leurs prêtres et leurs usages. Une fois par semaine de jeu, un sacristain, un douanier ou un marchand te donne une information ou une introduction." },
      { name: "Loyauté à prouver", text: "Chez les flibustiers, on te surveille : désavantage à ton premier test de Persuasion avec chaque équipage de la Côte, tant que tu n'as pas fait tes preuves à bord." },
    ],
    subs: [
      {
        id: "pi-espagne-havane",
        name: "Créole de La Havane",
        blurb: "Tu es né sous les arcades de La Havane, entre le Morro et les églises. Tu sais ce qu'on dit dans un salon, un confessionnal et une taverne.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Les arcades et les sacristies", text: "Maîtrise de Persuasion et d'Histoire. Tu passes pour un notable d'Espagne devant un étranger, et tu sais mentir en latin." },
        ],
      },
      {
        id: "pi-espagne-carthagene",
        name: "Marin de Carthagène",
        blurb: "Tu as servi sur un galion ou une barque de pêche, entre Carthagène et La Havane. Le pont d'un navire de roi n'a pas de secret pour toi.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Les routes du galion", text: "Maîtrise de Survie et de Perception. Tu connais les routes de l'argent, les passes et les mouillages espagnols." },
        ],
      },
    ],
  },
  {
    id: "pi-toutes-mers",
    genre: "pirates",
    name: "Gens de toutes les mers",
    blurb: "Anglais, Hollandais, Irlandais, Africains libres, Caraïbes des îles : tous ceux que la mer a jetés ici. On a une langue de plus, des contacts dans un port étranger, et un passé que personne ne vérifie.",
    bonus: { 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Une langue de plus", text: "Tu parles le français, l'anglais ou le hollandais au choix, et une langue de plus que le MJ t'accorde selon ton passé. Argent de départ : 15 piastres." },
      { name: "Un port étranger", text: "Tu connais quelqu'un dans un port étranger (le MJ dit lequel avec toi) : un hôte, un mouilleur, un tavernier. Une fois par semaine de jeu, il te dit ce qui se murmure là-bas." },
      { name: "Un passé que personne ne vérifie", text: "Quand tu racontes qui tu étais, on te croit : avantage à ton premier test de Tromperie par séance. Mais ce passé a un trou, et le MJ le connaît." },
    ],
    subs: [
      {
        id: "pi-toutes-mers-nord",
        name: "Marin du Nord",
        blurb: "Anglais, Hollandais ou Irlandais, tu as quitté Bristol, Amsterdam ou Cork sur un navire marchand, et tu n'es jamais rentré.",
        bonus: { 0: 1, 4: 1 },
        traits: [
          { name: "Quarts de l'Atlantique", text: "Maîtrise d'Athlétisme et de Survie. Tu fais des quarts sans te plaindre, et tu connais la route des Açores aux Antilles." },
        ],
      },
      {
        id: "pi-toutes-mers-libre",
        name: "Libre des îles",
        blurb: "Africain libre, affranchi ou Caraïbe des îles : tu as gagné ou gardé ta liberté, et tu connais chaque crique de ton île, chaque courant, chaque maître de port.",
        bonus: { 2: 1, 5: 1 },
        traits: [
          { name: "Chaque crique", text: "Maîtrise de Perception et d'Intuition. Tu repères un mouillage ou une patrouille avant qu'elle ne te voie, et tu lis un maître de port à ses mains. Tu es libre, et ça se voit : on te traite avec un respect prudent." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_ILES: Background[] = [
  {
    id: "pi-h-matelot",
    genre: "pirates",
    name: "Matelot",
    blurb: "Tu as servi sur un navire marchand ou du roi.",
    skills: ["Athlétisme", "Perception"],
    tool: "Outils de gréement (aiguille à voile, épissoir)",
    gear: ["Aiguille à voile et épissoir", "Couteau de gabier", "Bonnet de laine", "Gourde", "10 piastres"],
    feature: { name: "Un quart de plus", text: "Sur un navire en route, tu te fais une place à bord sans contrat. Un ancien du bord te redit où mouille tel navire et qui le commande." },
  },
  {
    id: "pi-h-boucanier",
    genre: "pirates",
    name: "Boucanier",
    blurb: "Tu as chassé le bœuf sauvage dans les bois de Saint-Domingue.",
    skills: ["Survie", "Dressage"],
    tool: "Outils de dépeçage",
    gear: ["Couteau à dépecer", "Peau de bœuf séchée", "Cuir de ceinture et poire à poudre", "Gourde", "8 piastres"],
    feature: { name: "Le gibier et ses chemins", text: "Tu sais où passent les bœufs sauvages, où campent les chasseurs et à qui vendre les peaux. Un tanneur ou un marchand de viande fumée te rachète tes prises sans te voler." },
  },
  {
    id: "pi-h-engage",
    genre: "pirates",
    name: "Engagé",
    blurb: "Tu as signé trois ans de travail pour payer ton voyage, et tu t'es enfui.",
    skills: ["Athlétisme", "Survie"],
    tool: "Outils de défricheur",
    gear: ["Hache de défricheur", "Chemise de toile rapiécée", "Couteau", "Gourde", "5 piastres"],
    feature: { name: "Un maître qui te cherche", text: "Tu sais comment se cache un fuyard et comment on le retrouve. Dans un bourg, tu sais quel habitant le dénoncerait, et quel autre le nourrirait sans rien dire." },
  },
  {
    id: "pi-h-marron",
    genre: "pirates",
    name: "Marron",
    blurb: "Tu as vécu libre dans les mornes.",
    skills: ["Discrétion", "Survie"],
    tool: "Machette et cordes de lianes",
    gear: ["Machette", "Cordes de lianes", "Conque (ou sifflet de bois)", "Gourde de calebasse", "5 piastres"],
    feature: { name: "Une conque répond", text: "Où que tu sois dans les mornes, un signal de conque est compris par une sentinelle, qui te laisse passer ou te cache. Un village de marrons te donne un lit pour une nuit." },
  },
  {
    id: "pi-h-chirurgien",
    genre: "pirates",
    name: "Chirurgien de bord",
    blurb: "Tu as scié des jambes entre deux bordées.",
    skills: ["Médecine", "Intuition"],
    tool: "Coffre de chirurgien (scie, bistouri, aiguilles)",
    gear: ["Coffre de chirurgien", "Linges propres et eau-de-vie", "Flacon de quinquina", "Tablier de cuir", "12 piastres"],
    feature: { name: "Il faut un chirurgien", text: "Un équipage ne refuse jamais un chirurgien. Sur n'importe quel navire de la Côte, tu es reçu à bord pour une traversée, et personne ne te demande ton passé." },
  },
  {
    id: "pi-h-cadet",
    genre: "pirates",
    name: "Cadet de famille",
    blurb: "Ta famille t'a envoyé aux Îles pour t'oublier.",
    skills: ["Histoire", "Persuasion"],
    tool: "Papier à lettres et sceau de famille",
    gear: ["Lettre de recommandation", "Habit de drap fin", "Montre de gousset", "Pistolet à silex de famille", "25 piastres"],
    feature: { name: "Un nom d'ailleurs", text: "Ton nom ouvre la porte d'un notable, d'un armateur ou d'un officier du roi. Mais on te rappelle ce que tu dois à ta famille, et ce que ta famille doit aux autres." },
  },
  {
    id: "pi-h-plongeur",
    genre: "pirates",
    name: "Plongeur d'épaves",
    blurb: "Tu sais descendre à six brasses et remonter. Tu l'as fait libre, affranchi ou sous le fouet ; dis lequel.",
    skills: ["Athlétisme", "Perception"],
    tool: "Corde et pierre de lest",
    gear: ["Corde de chanvre de vingt brasses", "Pierre de lest", "Couteau d'épave", "Sac de toile étanche", "5 piastres"],
    feature: { name: "Six brasses, sans casque", text: "Tu retiens ton souffle quatre minutes de plus qu'un autre. Sur une épave, tu trouves en une heure ce qu'un autre met une journée à chercher, et tu sais ce que vaut une barre remontée." },
  },
  {
    id: "pi-h-contrebandier",
    genre: "pirates",
    name: "Contrebandier",
    blurb: "Tu sais quel douanier se paie, et combien.",
    skills: ["Tromperie", "Escamotage"],
    tool: "Faux fonds et cachettes",
    gear: ["Coffre à double fond", "Lettre de passe contrefaite", "Poignard", "Gourde", "18 piastres"],
    feature: { name: "Un douanier qui se paie", text: "Dans un port où tu as déjà travaillé, tu sais quel douanier ou quel commis accepte de regarder ailleurs, et à quel prix. Faire passer une caisse te coûte un quart de moins." },
  },
];

/** Suggestions de personnalité des Îles du Vent (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_ILES: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je salue chaque navire à l'ancre comme un voisin.",
    "Je touche le mât avant de monter à bord, et je ne l'avoue à personne.",
    "Je compte les voiles à l'horizon, avant de répondre à une question.",
    "Je ne m'assois jamais le dos à la porte, ni à la mer.",
    "Je ne dis jamais mon vrai nom la première fois.",
    "Je donne ma ration de tafia à ceux qui ont plus soif que moi.",
  ],
  ideal: [
    "La part. Chacun sa part, devant tout le monde, ou rien.",
    "La liberté. Aucun roi, aucun planteur, aucun maître ne me dira où aller.",
    "La parole donnée. On peut me pendre, on ne me fera pas mentir.",
    "Les miens. L'équipage d'abord, le reste peut couler.",
    "La paix. Ça coûte moins cher que la guerre, pour ceux qui n'ont rien.",
    "L'argent. Les rois n'ont que ça, et ils nous le prennent.",
  ],
  bond: [
    "Un homme m'a sorti de l'eau un jour de grain. Je lui dois ma vie, et il le sait.",
    "J'ai laissé ma sœur dans un port du roi. Je lui écris chaque mois, et elle ne répond pas.",
    "Je cherche l'homme qui a vendu mon village à des négriers.",
    "Mon capitaine m'a appris à lire. Je ne le trahirai pas, quoi qu'il fasse.",
    "J'ai enterré un camarade sur une plage sans nom, et je veux y retourner.",
    "Une dette d'argent me suit de port en port. Un jour il faudra la payer.",
  ],
  flaw: [
    "Je ne laisse jamais une insulte sans réponse.",
    "Je bois quand les autres dorment.",
    "Je mens sur ce que j'ai fait avant d'arriver aux Îles.",
    "Je ne fais confiance à aucun homme du roi, même quand il a raison.",
    "Je ne sais pas dire non à une partie de dés.",
    "Je ne pardonne ni aux planteurs ni à ceux qui leur vendent.",
  ],
};
