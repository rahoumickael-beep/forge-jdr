// Origines jouables et historiques de l'Exposition éternelle (steampunk, Paris, octobre 1899), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Adresse, 2 Endurance, 3 Savoir, 4 Instinct, 5 Présence.
// Les origines sont des milieux, pas des essences : chacune a un petit défaut jouable, une licence de brevet avancée par quelqu'un (ou par personne),
// et un argent de départ en francs.
// Les gens des Villages, les ouvrières et les Réfractaires sont des personnes avec leurs raisons, pas des figurants ni des clichés.
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_EXPO: Origin[] = [
  {
    id: "ex-parisiens",
    genre: "steampunk",
    name: "Parisiens de l'Éternelle",
    blurb: "Nés ou élevés à la foire, sans autre ville que celle-ci. On connaît chaque porte, chaque garde, chaque raccourci par les coulisses, et on se mêle à la foule sans qu'on le remarque.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Chaque porte, chaque raccourci", text: "Tu connais les portes, les gardes, les coulisses et les raccourcis du Champ. Avantage aux tests de Discrétion dans une foule. Une fois par semaine de jeu, tu trouves un passage qui évite un contrôle ou un attroupement." },
      { name: "Une licence prêtée par la loge", text: "Ta loge ou ton contremaître t'avance la licence de ton premier brevet, à 5 francs par semaine (voir « Les appareils brevetés »). Argent de départ : 25 francs." },
      { name: "Jamais vu d'autre ville", text: "Hors de Paris, tu as le désavantage à ton premier test de Survie ou de connaissance de la campagne de chaque séance, le temps de t'y faire." },
    ],
    subs: [
      {
        id: "ex-parisiens-foire",
        name: "Enfant de la foire",
        blurb: "Né dans une loge de la Galerie ou un baraquement de la Tour, titulaire d'une carte de Permanent. Le Champ est la seule maison que tu aies connue.",
        bonus: { 1: 1, 5: 1 },
        traits: [
          { name: "Carte de Permanent", text: "Maîtrise de Tromperie et de Perception. Avantage aux tests pour éviter ou tromper un contrôleur, et tu entres dans l'enceinte sans billet." },
        ],
      },
      {
        id: "ex-parisiens-quais",
        name: "Gamin des quais",
        blurb: "Élevé à Grenelle, entre la Seine et les cours. Tu as appris à te faire petit, et à courir plus vite que celui qui crie « au voleur ».",
        bonus: { 1: 1, 2: 1 },
        traits: [
          { name: "Entre la Seine et les cours", text: "Maîtrise d'Acrobaties et d'Escamotage. Avantage aux tests pour te glisser dans un espace étroit, grimper ou prendre un objet sur un étal." },
        ],
      },
    ],
  },
  {
    id: "ex-ateliers",
    genre: "steampunk",
    name: "Gens des ateliers",
    blurb: "Mécaniciens, bobineuses, ajusteurs, ouvriers de la Chambre syndicale. On sait réparer, démonter, démonter vite, et on connaît le salaire de chaque métier.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Des mains qui savent", text: "Avantage aux tests d'Investigation et d'Escamotage pour réparer ou démonter un mécanisme. Tu connais le salaire de chaque métier de la foire, à 50 centimes près." },
      { name: "La caisse de la Chambre", text: "La Chambre syndicale t'avance la licence de ton premier brevet, à 5 francs par semaine, et ouvre pour toi sa caisse de secours. Argent de départ : 20 francs." },
      { name: "Les contrôleurs te regardent deux fois", text: "Désavantage à ton premier test de Persuasion de chaque séance avec un contrôleur ou un officier du Commissariat : ta blouse parle avant toi." },
    ],
    subs: [
      {
        id: "ex-ateliers-meca",
        name: "Mécanicien de la Galerie",
        blurb: "Blouse bleue, clef anglaise, carte syndicale. Tu as fait tes douze heures à côté d'une machine de trente tonnes, et tu l'entends mieux que ton contremaître.",
        bonus: { 2: 1, 3: 1 },
        traits: [
          { name: "Blouse bleue, clef anglaise", text: "Maîtrise d'Investigation et d'Athlétisme. Avantage aux tests de réparation et d'identification d'un mécanisme. Ta carte syndicale t'ouvre les ateliers de Javel." },
        ],
      },
      {
        id: "ex-ateliers-ouvriere",
        name: "Ouvrière des ateliers",
        blurb: "On te paie la moitié, et on parle devant toi comme devant un mur. Mariée, ta paie passe parfois par la poche de ton mari ; tu le sais, et tu comptes les francs à ta façon.",
        bonus: { 4: 1, 5: 1 },
        traits: [
          { name: "Comme devant un mur", text: "Maîtrise de Perception et d'Intuition. Avantage aux tests de Perception sur les gens qui te croient sans importance. Une fois par semaine de jeu, une ouvrière, une blanchisseuse ou une couturière te dit ce qui se dit dans son atelier." },
        ],
      },
    ],
  },
  {
    id: "ex-villages",
    genre: "steampunk",
    name: "Gens des Villages",
    blurb: "Engagés sous contrat de l'Exposition, avec leurs savoir-faire, leurs langues et leurs familles. Des Sénégalais, des Annamites (le Vietnam d'aujourd'hui), mais aussi des Kanaks et des Kabyles : prends la variante qui s'en rapproche, et dis le reste. Derrière la corde, on est regardé, et on regarde.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un savoir-faire que la foire expose", text: "Tu maîtrises un artisanat de ton peuple (tissage, ferronnerie, vannerie, laque, couture ou herboristerie) : avantage aux tests qui s'y rapportent, et tu fabriques ce que tu vends." },
      { name: "Plusieurs langues", text: "Tu parles ta langue, le français et celle d'un autre Village. Avantage aux tests d'Histoire et de Persuasion pour parler à ceux d'un autre Village." },
      { name: "Le livret au Trocadéro", text: "Ton livret d'engagé et ton laissez-passer sont gardés au Trocadéro, et il te faut un permis pour sortir de l'enceinte (voir « La foire, ses portes et ses contrôleurs »). Ton impresario t'avance la licence de ton premier brevet, avec une retenue de 1 franc par semaine. Hors de l'enceinte sans permis, tu es un engagé en fuite. Argent de départ : 8 francs." },
      { name: "Ce qu'on dit devant toi", text: "On parle devant toi comme devant un meuble, et tu entends tout. Avantage aux tests de Perception pour écouter une conversation où l'on te croit sourd ou ignorant." },
    ],
    subs: [
      {
        id: "ex-villages-senegalais",
        name: "Sénégalais du Village",
        blurb: "Wolof, sérère ou bambara, ancien tirailleur ou fils d'artisan. Tu tiens des comptes, des noms et des promesses, et tu en as sur chacun.",
        bonus: { 2: 1, 5: 1 },
        traits: [
          { name: "Forge, métal et parole", text: "Maîtrise de Persuasion et d'Intuition. Avantage aux tests de forge et de métal, et dans les négociations avec les autres Villages." },
        ],
      },
      {
        id: "ex-villages-annamite",
        name: "Annamite du Village",
        blurb: "Couturier, herboriste, laqueur. Tu as appris à soigner par les plantes et à coudre la soie fine, et personne n'a encore su te dire le prix de ce que tu sais.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "Plantes et mains fines", text: "Maîtrise de Médecine et de Perception. Avantage aux tests de Médecine par les plantes et à l'artisanat fin." },
        ],
      },
    ],
  },
  {
    id: "ex-employes",
    genre: "steampunk",
    name: "Employés et Signataires",
    blurb: "Fils de famille, clercs du Commissariat, gens du monde. On porte la redingote, on entre aux Salons, on a un crédit chez les fournisseurs, mais on est surveillé et on dépend d'un patron.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un patron", text: "Ton patron (un père, un chef de bureau) t'avance la licence de ton premier brevet, sans rien te demander tant que tu le sers. Il la reprend, avec l'appareil, si tu le quittes. Argent de départ : 40 francs." },
      { name: "Du crédit chez les fournisseurs", text: "Chez un tailleur, un armurier, un libraire de la foire, tu obtiens une fois par semaine de jeu un article de 20 francs au plus à crédit, à payer le mois suivant." },
      { name: "Surveillé", text: "Tu dépends d'un patron, et on te surveille : désavantage à ton premier test de Discrétion de chaque séance dans un bâtiment du Commissariat." },
    ],
    subs: [
      {
        id: "ex-employes-signataire",
        name: "Fils (ou fille) de Signataire",
        blurb: "Ton père a gravé son nom sur une plaque de cuivre. Il en est fier, et il ferme à clef la porte de son atelier.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Le nom sur la plaque", text: "Maîtrise de Persuasion et d'Histoire. Avantage aux tests de Persuasion auprès des gens du monde. Tu as un compte de 50 francs par mois chez ton père. Argent de départ : 60 francs." },
        ],
      },
      {
        id: "ex-employes-commissariat",
        name: "Employé du Commissariat",
        blurb: "Un bureau, une carte d'accès, un supérieur. Tu sais qui signe quoi, et qui n'ose pas.",
        bonus: { 3: 1, 2: 1 },
        traits: [
          { name: "Un bureau, une carte d'accès", text: "Maîtrise d'Histoire et d'Investigation. Avantage pour entrer dans un bâtiment du Commissariat avec un prétexte, et tu as une idée de l'organigramme : quel service dépend de quel autre." },
        ],
      },
    ],
  },
  {
    id: "ex-visiteurs",
    genre: "steampunk",
    name: "Visiteurs restés",
    blurb: "Venus pour une semaine de curiosité, restés après le billet. On a un regard neuf sur la foire, et personne pour vous attendre.",
    bonus: { 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Un regard neuf", text: "Tu vois ce que les Permanents ne voient plus : avantage à ton premier test de Perception ou d'Intuition de chaque séance sur une scène que tu découvres." },
      { name: "Personne pour t'attendre", text: "Personne ne te cherche. Ta légation (si tu es étranger) ou un notaire de ta ville (si tu es provincial) t'avance la licence de ton premier brevet, à 5 francs par semaine. Argent de départ : 25 francs." },
      { name: "Un billet périmé", text: "Ton billet d'entrée est périmé depuis longtemps : si un contrôleur te demande ta carte de Permanent, tu as le désavantage à ton premier test de Tromperie ou de Persuasion pour t'en tirer." },
    ],
    subs: [
      {
        id: "ex-visiteurs-provincial",
        name: "Provincial",
        blurb: "Un paysan, un petit notaire, un instituteur. Tu as reconnu le premier menteur de la foire dans la première heure.",
        bonus: { 4: 1, 3: 1 },
        traits: [
          { name: "Le bon sens du pays", text: "Maîtrise d'Intuition et de Survie. Avantage aux tests d'Intuition face à un menteur de la ville. Tu parles une langue de plus : le patois de ton pays." },
        ],
      },
      {
        id: "ex-visiteurs-etranger",
        name: "Étranger",
        blurb: "Anglais, Russe, Américain, Italien. Tu as une langue de plus, une légation derrière toi, et des contrôleurs qui te demandent deux fois tes papiers.",
        bonus: { 5: 1, 3: 1 },
        traits: [
          { name: "Une légation derrière toi", text: "Maîtrise d'Histoire et de Persuasion. Tu parles une langue de plus, et tu as des relations dans une légation (le MJ dit laquelle avec toi). Désavantage à ton premier test pour éviter un contrôle." },
        ],
      },
    ],
  },
  {
    id: "ex-butte",
    genre: "steampunk",
    name: "Gens de la Butte",
    blurb: "Artistes sans le sou, camelots, chansonniers, Réfractaires. On connaît les cabarets, les logeurs, les mauvaises compagnies, et la police.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Cabarets, logeurs, police", text: "Tu connais les cabarets, les logeurs, les mauvaises compagnies et la police. Une fois par semaine de jeu, tu trouves une chambre pour la nuit, sans papiers, dans un garni de la Butte." },
      { name: "Sous le manteau", text: "Personne ne t'avance de licence : ton premier appareil est acheté sous le manteau et n'a pas de numéro (voir « Les appareils brevetés »). Argent de départ : 12 francs." },
      { name: "Mal vu de la police", text: "Tu n'as pas toujours donné ton vrai nom : désavantage à ton premier test de Persuasion de chaque séance avec un agent de la Sûreté ou de la police." },
    ],
    subs: [
      {
        id: "ex-butte-artiste",
        name: "Artiste ou chansonnier",
        blurb: "On se déguise, on joue un rôle, on se moque. On rit des puissants, et c'est parfois la seule façon de leur dire quelque chose.",
        bonus: { 1: 1, 5: 1 },
        traits: [
          { name: "Déguisé pour le public", text: "Maîtrise de Représentation et de Tromperie. Avantage à tes tests pour changer d'identité, jouer un rôle ou te moquer d'un puissant sans qu'on te prenne au sérieux." },
        ],
      },
      {
        id: "ex-butte-refractaire",
        name: "Réfractaire",
        blurb: "La craie dans la poche, la Sûreté à tes trousses. Tu ne crois plus qu'on obtienne quoi que ce soit en demandant, et ton signalement est dans un tiroir de la Préfecture.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "La craie dans la poche", text: "Maîtrise de Discrétion et de Survie. Avantage aux tests pour reconnaître un explosif, une cache ou un signe à la craie. Désavantage à ton premier test de Discrétion contre un agent qui t'a déjà vu." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_EXPO: Background[] = [
  {
    id: "ex-h-mecanicien",
    genre: "steampunk",
    name: "Mécanicien",
    blurb: "Tu as monté des machines à la Galerie, tu sais où chaque vis a été serrée.",
    skills: ["Investigation", "Escamotage"],
    tool: "Outils d'ajusteur (clefs, jauge, burette)",
    gear: ["Clef anglaise", "Blouse bleue et gants épais", "Carte syndicale", "Pain et gourde", "25 francs"],
    feature: { name: "Une clef dans chaque atelier", text: "Dans un atelier de mécanique de la foire ou de Javel, on te prête un établi et on te dit sur quoi tout le monde travaille." },
  },
  {
    id: "ex-h-garde",
    genre: "steampunk",
    name: "Garde de l'Exposition",
    blurb: "Tu as porté le képi gris-bleu et la matraque, et tu sais comment on fouille.",
    skills: ["Intimidation", "Perception"],
    tool: "Menottes et sifflet",
    gear: ["Képi gris-bleu défraîchi", "Sifflet de cuivre", "Menottes", "Carnet de ronde", "20 francs"],
    feature: { name: "Un képi qui ouvre", text: "À un poste ou à une porte de l'enceinte, un garde que tu as connu te laisse passer ou te dit ce qui s'est passé de nuit. Les gardes en service te reconnaissent comme l'un des leurs, pour le meilleur et pour le pire." },
  },
  {
    id: "ex-h-reporter",
    genre: "steampunk",
    name: "Reporter ou dessinateur de presse",
    blurb: "Tu as couru la foire un calepin à la main.",
    skills: ["Intuition", "Persuasion"],
    tool: "Calepin et crayons",
    gear: ["Calepin à ressort", "Crayons et plumes", "Carte de presse", "Veston de cycliste", "20 francs"],
    feature: { name: "Un nom dans le journal", text: "Les camelots, les typographes et les cochers te connaissent : une fois par semaine de jeu, l'un d'eux te raconte ce qu'il a vu avant d'aller le dire à la Sûreté." },
  },
  {
    id: "ex-h-interprete",
    genre: "steampunk",
    name: "Interprète",
    blurb: "Tu parles trois langues et tu as traduit les contrats que personne ne lisait.",
    skills: ["Persuasion", "Histoire"],
    tool: "Dictionnaires de poche",
    gear: ["Dictionnaires de poche", "Plume et encre", "Cachet d'interprète", "Redingote râpée", "30 francs"],
    feature: { name: "Trois langues, un contrat", text: "Dans un bureau, une légation ou un comptoir de la foire, on te donne du temps et un siège, et on te laisse relire avant de signer." },
  },
  {
    id: "ex-h-aeronaute",
    genre: "steampunk",
    name: "Aéronaute",
    blurb: "Tu as piloté ou chargé les dirigeables du Commissariat, et tu connais le poids exact d'un ballast.",
    skills: ["Acrobaties", "Perception"],
    tool: "Instruments de pilote (baromètre, boussole)",
    gear: ["Lunettes à verres jaunes", "Corde et mousqueton", "Baromètre de poche", "Casquette de cuir", "25 francs"],
    feature: { name: "Le poids exact d'un ballast", text: "Les équipes d'amarrage te saluent, et un contrôleur des lignes te dit où va tel appareil et quand." },
  },
  {
    id: "ex-h-infirmiere",
    genre: "steampunk",
    name: "Infirmière ou médecin d'hôpital",
    blurb: "Tu as soigné les brûlés de la Galerie et les poitrinaires des Villages.",
    skills: ["Médecine", "Intuition"],
    tool: "Trousse de soins",
    gear: ["Trousse de soins", "Blouse de toile et tablier", "Flacons de teintures", "Linges propres", "15 francs"],
    feature: { name: "On ne refuse pas un médecin", text: "Un dispensaire, une infirmerie ou une cour de Grenelle te laisse entrer, et personne ne te demande de papiers quand il y a un malade." },
  },
  {
    id: "ex-h-bonimenteur",
    genre: "steampunk",
    name: "Bonimenteur",
    blurb: "Tu vends des cartes postales, des billets à la sauvette, des promesses.",
    skills: ["Tromperie", "Représentation"],
    tool: "Jeu de cartes et de bonneteau",
    gear: ["Boîte de cartes postales", "Paquet de billets sans date", "Redingote pailletée", "Jeu de cartes", "12 francs"],
    feature: { name: "Un boniment qui tient", text: "Dans une foule de visiteurs, tu trouves toujours un client, un compère et une sortie. Une fois par semaine de jeu, tu récoltes 5 francs de pourboires sans test." },
  },
  {
    id: "ex-h-etudiant",
    genre: "steampunk",
    name: "Étudiant-ingénieur",
    blurb: "Tu as quitté les cours pour la voir de près, et tu comptes toi-même les boulons.",
    skills: ["Investigation", "Histoire"],
    tool: "Règle à calcul et compas",
    gear: ["Règle à calcul et compas", "Cahiers de cours et croquis", "Loupe d'horloger", "Veston râpé", "35 francs"],
    feature: { name: "Une table et des notes", text: "Un professeur, un camarade ou un répétiteur te prête sa table et ses notes. Tu reconnais à l'œil un appareil qui a été démonté, puis remonté." },
  },
];

/** Suggestions de personnalité de l'Exposition éternelle (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_EXPO: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je pose la main à plat sur tout ce qui tourne, pour sentir si ça ralentit.",
    "Je tape deux fois sur ma poche pour sentir la clef anglaise.",
    "Je compte les marches, les lampes à arc et les sorties.",
    "Je compte les francs à voix basse avant de répondre.",
    "Je note tout sur le dos de ma main, même ce que je ne comprends pas.",
    "Je salue chaque dirigeable qui passe, comme un voisin.",
  ],
  ideal: [
    "Un jour de repos par semaine, la même paie pour tous. Le reste suivra.",
    "La vérité. Une preuve vaut mieux que dix opinions.",
    "Que la foire ne ferme jamais. Elle est tout ce que j'ai.",
    "Rentrer chez soi, vivant, avec ce qu'on a gagné et les papiers en poche.",
    "Le progrès. Il coûte, mais il faut bien que quelqu'un paie.",
    "La liberté. Aucun commissaire ne me dira où je dors.",
  ],
  bond: [
    "Un camarade s'est pris la manche dans une courroie, et je veux qu'on le dise.",
    "J'ai laissé ma mère dans un faubourg de province. Je lui écris le dimanche.",
    "On m'a prêté 200 francs pour une licence, et je n'ai pas fini de les rendre.",
    "Un enfant des Villages m'a appris un mot de sa langue. Je ne l'ai pas oublié.",
    "J'ai trois frères à Grenelle, tous mécaniciens. Je ne les ai pas vus depuis la grève.",
    "Mon père a gravé son nom sur une plaque. Je veux savoir ce qu'il y a derrière.",
  ],
  flaw: [
    "Je ne sais pas dire non à un appareil qu'on me prête.",
    "Je force toujours un peu plus : « juste une fois ».",
    "Je ne pardonne ni aux contrôleurs ni à ceux qui les laissent faire.",
    "Je mens sur ce que j'étais avant d'arriver à la foire.",
    "Je donne mes francs à qui me raconte une bonne histoire.",
    "Je n'ai jamais appris à me taire quand on a tort.",
  ],
};
