// Bibliothèque de l'Exposition éternelle (steampunk, Paris, octobre 1899) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
// Les ennemis viennent du bestiaire du monde (shared/expo-bestiaire.ts) : PV, CA et attaque ne se recopient pas à la main.
import { BESTIARY, toEncounterEnemy } from "./bestiary";
import type { Encounter, Scenario } from "./types";

/** Une ligne d'ennemi tirée de la fiche du bestiaire, pour un groupe de niveau 1. */
function ennemi(creatureId: string, count: number): Encounter["enemies"][number] {
  const fiche = BESTIARY.find((c) => c.id === creatureId && c.genre === "steampunk");
  if (!fiche) throw new Error(`Créature inconnue du bestiaire de l'Exposition : ${creatureId}`);
  return { ...toEncounterEnemy(fiche, count, 1), creatureId };
}

/** Campagne « L'Exposition éternelle », scénario 1 : ouverture, niveaux 1 et 2. */
export const LA_SOIREE_DU_COCHER: Scenario = {
  id: "bib-ex-soiree-du-cocher",
  title: "La soirée du Cocher",
  genre: "steampunk",
  ton: "mysterieux",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Mardi 17 octobre 1899, sous la verrière de la Galerie des Machines. Félicien Dorlhac, doyen des Signataires, présente à trois cents invités en habit son Cocher mécanique, un automate qui conduit un fiacre sans jamais se tromper de rue. Dorlhac manque de bras pour servir le champagne et porter les plateaux : l'impresario des Villages engage valets et nettoyeurs pour la soirée, deux francs et le souper. Victorine Cordebard, secrétaire de la Chambre syndicale, vous a glissé vingt francs à chacun pour une seule chose. « Il y a un petit mécanicien, Gabriel Pétrel, dix-neuf ans, il nettoie le sous-sol de la machine n° 7. Il dit qu'il a trouvé quelque chose. Je veux qu'il sorte de la Galerie vivant, avec ce qu'il a, et qu'on me l'amène rue de Javel. Bon. Vous avez compris ? »",
  synopsis:
    "La Galerie des Machines, à sept heures du soir. Les ponts roulants portent les invités d'un bout à l'autre du hangar sur leurs plates-formes grillagées, un orgue à vapeur joue une valse, on boit dans des nacelles. Dorlhac va faire monter son Cocher sur le siège d'un fiacre devant tout le monde. Les personnages sont invités ou valets d'un soir (les gens des Villages ont été engagés par leur impresario, qui veut ses hommes à la corde avant minuit) et cherchent Pétrel, que Cordebard leur a décrit : un garçon maigre, un chiffon dans la poche, qui bégaie sur les noms de machines. À 21 h 40, la nuit de grand courant que le Commissariat a refusé de décaler fait baisser les lampes à arc, les machines ralentissent, et le Cocher ne s'arrête plus : il tourne dans l'allée des invités, le bras tendu, jusqu'à ce que ses cames se décrochent. Dans la confusion, Pétrel donne aux personnages une pièce de la taille d'un pouce, gris-vert, tiède, qui fait faire un quart de tour à la lampe quand on l'approche, ou la cache dans le fiacre. Ils ne savent pas ce que c'est. Quatre personnes la veulent : Cordebard pour le garçon, Dorlhac parce qu'il croit y voir la clé de son automate, Blanche Mauvezin de La Sirène de Javel contre un papier signé, et Hortense Quillebeuf, directrice du Bureau des Brevets, qui fouille la salle des yeux. Un homme en manteau gris, des lunettes rondes, un cadran de laiton noué au poignet, suit Pétrel depuis le début avec deux contrôleurs et ne parle à personne. À 22 h 10 les gardes ferment les portes. Les personnages ont vingt minutes pour sortir, par le pont roulant, par les ateliers de bobinage ou par le sous-sol, avec ou sans Pétrel. Ce que personne ne dit : Pétrel a montré la pièce à un camarade, qui a parlé ; Quillebeuf craint plus l'homme gris que les voleurs ; Cordebard a payé les personnages avec l'argent de la caisse de secours, à l'insu du bureau de la Chambre.",
  acts: [
    {
      title: "La soirée sous la verrière",
      location: "La Galerie des Machines : l'allée des invités, les nacelles à champagne, la machine n° 7",
      summary:
        "Sept heures du soir. Quatre cents mètres de verre et de fer sans un pilier, des machines de trente tonnes sur leurs socles de marbre, des lampes à arc suspendues, des invités qui montent sur les plates-formes grillagées des ponts roulants et regardent la fête depuis leur cage. Les personnages arrivent par la porte des Machines. On fouille : les revolvers vont en consigne contre un jeton de laiton (50 centimes), les cannes-épées passent sur un test d'Escamotage DD 12. Les valets reçoivent un plateau et une veste blanche de l'impresario, les invités une coupe. Dorlhac, cinquante-cinq ans, fait le tour de la salle en citant le numéro de son brevet et en demandant « n'est-ce pas ? » après chaque affirmation ; le Cocher attend, immobile, sur le siège d'un fiacre laqué, avec un cheval alezan qui est le seul à avoir l'air inquiet. Cordebard est dans les ateliers de bobinage, en tablier, derrière la porte de service. Elle fait signe de là à un personnage, puis disparaît ; Pétrel est près de la même porte, un chiffon à la main, et regarde le plafond. Avant 21 h 40, les personnages peuvent aborder Pétrel, parler à Mauvezin (crayon, calepin, qui suit Dorlhac), croiser Quillebeuf (« Numéro de brevet ? », elle note) et voir passer l'homme en manteau gris, deux contrôleurs derrière lui, le cadran à la main. Perception DD 13 pour remarquer que le cadran de laiton frémit quand l'homme s'approche de Pétrel. Intuition DD 12 pour voir que Pétrel serre sa poche gauche comme on serre un enfant. Un coupe-bourse de la foule travaille près du buffet : un personnage se découvre allégé de cinq francs (Athlétisme DD 13 pour le rattraper dans la cohue, ou un franc de bon cœur pour qu'il nomme l'impresario qui le protège). Les gardes parlent devant les valets des Villages comme devant du mobilier. Compte vingt minutes de jeu : la table n'a pas besoin des deux heures et demie de la soirée. Ne coupe pas les présentations de Dorlhac.",
    },
    {
      title: "21 h 40 : le Cocher ne s'arrête plus",
      location: "L'allée des invités, entre les ponts roulants et les nacelles",
      summary:
        "À 21 h 40, la lumière baisse. Les lampes à arc faiblissent l'une après l'autre dans l'ordre exact de la Galerie, les machines ralentissent ensemble avec un bruit de bête qui expire, l'orgue à vapeur flanche sur une note. Le Cocher, qui venait de tendre son bras, ne reçoit plus d'ordre : ses cames ne retombent pas, il avance, fouette le vide, et tourne en rond dans l'allée, bras tendu, entre les nacelles. Il frappe tout ce qui entre dans l'arc de son bras, invités, valets et cheval compris, et ne se décroche qu'au bout de trois rounds. Ce n'est pas un combat : il n'a pas de PV à vider, c'est une scène de sauvetage. Dans l'allée, sept invités trop lents ou trop saouls (un vieux monsieur à canne, deux dames, un provincial en habit, un reporter étranger, deux jeunes gens qui rient encore). Un coup par round, sur le point de l'allée que le MJ a annoncé (la scène ignore volontairement la multiattaque de la fiche). Contre un personnage resté dans l'arc : +4, 1d8+2 contondants, et sauvegarde de Force DD 12 ou repoussé de 3 m. Un personnage de niveau 1 touché par ce coup ne descend pas sous 1 PV : le bras le cueille, il finit au sol, vivant. Les invités, eux, peuvent mourir : un vieux monsieur à canne laissé deux rounds dans l'arc est tué. Tirer un invité de son chemin : Acrobaties ou Athlétisme DD 12 (deux invités à la fois si le résultat atteint 15). Dételer le cheval (Dressage DD 12) lui évite d'être frappé par le bras. Couper la courroie du siège (Adresse DD 13, un coup de couteau, de clef anglaise ou de canne-épée suffit) est ce qui arrête le Cocher. Si un personnage préfère courir vers Pétrel, il le peut : les invités qu'il laisse font leur chance seuls, et deux d'entre eux sont blessés. Dorlhac, pâle, hurle des ordres contradictoires ; les mécaniciens de la Galerie ne bougent pas, ils lèvent les yeux vers les lampes. Pendant ces trois rounds, Pétrel traverse l'allée en courant, un chiffon dans la main, et pose quelque chose dans la main d'un personnage proche, s'il y arrive. Il murmure : « Pas aux gardes. Pas à l'homme gris. » S'il n'y arrive pas, il glisse l'objet dans la caisse du fiacre. Le fiacre est surveillé par deux valets de Dorlhac : récupérer l'objet avant 22 h demande Escamotage DD 13 ou la complicité d'un valet (seconde version du texte à lire de l'acte 3). Trois rounds en jeu, vingt minutes à la table.",
    },
    {
      title: "Qui veut la pièce",
      location: "L'allée, les nacelles, la porte de service, puis l'arrière des ateliers de bobinage",
      summary:
        "Le Cocher s'est décroché, la lumière revient en tremblant, les invités ramassent leurs chapeaux. Les personnages ont la pièce, ou savent où elle est. Quatre personnes viennent à eux dans les quinze minutes. Dorlhac, la voix cassée, remercie ceux qui ont aidé et glisse : « Mon cher, ce que le jeune homme vous a donné, j'en ai besoin, n'est-ce pas ? Le brevet est à moi, la plaque aussi. » Mauvezin, tout sourire, propose un marché : l'objet contre un papier signé, avec le nom des personnages en bas, qui prouve qu'il existe ; elle publie ou se tait, au choix. Quillebeuf, d'un ton très calme : « Numéro de brevet ? » Elle n'en a pas besoin, elle veut la pièce, et sa carte lui donne deux gardes si on lui refuse. Cordebard, à voix basse, depuis un coin des ateliers de bobinage : « Amenez-le-moi. Les deux. » À 22 h, les gardes de la porte se mettent à fouiller la Galerie par petits groupes ; à 22 h 10 ils ferment les portes. L'homme en manteau gris n'a pas bougé : il a regardé son cadran. Le groupe doit s'organiser : cacher la pièce, cacher Pétrel (qui tremble, et dit que sa mère est à l'hôpital Beaujon, que l'objet vaut ses soins), choisir à qui la remettre ou la garder. Ceux qui connaissent la maison savent que les contrôleurs de la porte de service ont lâché deux chiens de garde dans le passage derrière les ateliers : il faut les passer pour atteindre le monte-charge du sous-sol. Voir le choix « La pièce » et la rencontre « Les contrôleurs et les chiens ». Vingt minutes ici.",
    },
    {
      title: "22 h 10 : les portes sont fermées",
      location: "Au choix : un pont roulant, les ateliers de bobinage, le sous-sol de la Galerie et son monte-charge",
      summary:
        "Les personnages ont vingt minutes pour sortir avec Pétrel, ou sans lui. Par le pont roulant : monter sur une plate-forme grillagée (Athlétisme DD 12) et se laisser porter jusqu'à la passerelle de la porte de Javel, où personne ne regarde les cages. Sous l'arche, une poterne de service pour la relève du matin, fermée au loquet côté Galerie : un personnage qui y arrive l'ouvre en une action. La cabine d'un pont est vide, mais l'homme gris voit tout ce qui se déplace au plafond. Si Dorlhac est reconnaissant, il fait arrêter une plate-forme à la passerelle (il tient les ponts roulants jusqu'à minuit). Par les ateliers de bobinage, au sous-sol de la Galerie : les ouvrières travaillent cette nuit sur dérogation du Commissariat, payées moitié. La doyenne du rang (cinquante ans, mère de trois, qui répond toujours par le nom de la machine qu'elle conduit) ne cache personne pour un service de la Chambre. Elle cache le groupe contre une chose précise : porter une réclamation au contremaître, à son nom à elle, et c'est elle qui sera punie s'il la lit. Les contrôleurs fouillent rang par rang. Par le monte-charge : il descend jusqu'à une grille, au pied de la machine n° 7, et un garde du Commissariat tient la porte, la lampe à la main. Derrière la grille, une porte que le garde ne touche jamais : ne dis rien de ce qu'il y a derrière. Le passage vers la rue passe par le local où les nettoyeurs de nuit du Village rangent leurs seaux : le doyen des nettoyeurs de nuit, soixante ans, qui ne parle qu'à la troisième question, connaît le puits de Grenelle et le montre contre un service. Le combat contre le garde n'est pas nécessaire, mais il est possible. Après trois rounds, l'homme en manteau gris paraît en haut de l'escalier, le cadran à la main, sans un mot, et propose de conduire Pétrel « à l'infirmerie du Trocadéro », d'une voix très douce. Un engagé des Villages qui n'est pas à la corde à minuit est noté sur le registre de l'impresario (voir les notes) ; pour sortir de l'enceinte il lui faut un permis : un mot de Ndoye au garde de la grille (Persuasion DD 13), un service dû au Conseil des Villages, ou Persuasion DD 15 devant l'employé du Trocadéro. À 22 h 30, la ronde des gardes de nuit passe aux portes ; après, on ne sort plus sans papiers. Sorti ou emmené, Pétrel laisse un chiffon sur une marche du monte-charge. Le matin, rue de Javel, Cordebard compte les francs. Trente minutes ici, plus le récit de la sortie.",
    },
  ],
  villain: {
    name: "L'homme au manteau gris",
    motivation:
      "retrouver la pièce que Pétrel a trouvée et le garçon qui l'a eue entre les mains, sans bruit et sans témoin, pour les conduire « à l'infirmerie du Trocadéro ». Il ne tue pas dans la Galerie : on ne revoit pas ensuite celui qu'il emmène. Il a été prévenu par le camarade de Pétrel, et il attend que le cadran désigne le porteur",
    description:
      "Un manteau de laine grise sans insigne, des lunettes rondes, un cadran de laiton noué au poignet, une matraque à tension qu'il tient comme un parapluie. Pâle, la voix très douce, il ne crie jamais, ne siffle pas, n'appelle personne ; devant lui, les contrôleurs s'écartent sans qu'on leur ait rien dit. Il n'est pas fait pour être combattu dans ce scénario (fiche de FP 4 : mortelle pour quatre personnages de niveau 1). S'il est pris à partie devant la foule, il se retire dès le round suivant. Ne le fais pas parler aux joueurs plus de trois phrases : il demande l'objet, il propose l'infirmerie, il note le nom de ceux qui refusent.",
  },
  npcs: [
    {
      name: "Félicien Dorlhac",
      role: "Doyen des Signataires, cinquante-cinq ans, inventeur du Cocher mécanique",
      secret:
        "Il veut que la soirée réussisse et qu'on lise son nom sur la plaque ; une fois le Cocher décroché, il veut savoir ce que Pétrel avait, parce qu'il croit y voir la clé de sa came de tête. Il cache que son Cocher n'a jamais tenu un essai de plus de deux heures sans erreur, et que le brevet du Cocher n'est pas tout à fait de lui : il a signé ce qu'on lui a remis. Il paiera pour que personne ne démonte l'automate devant témoins, et il tient les ponts roulants à ses ordres jusqu'à minuit.",
      voice: "Phrases longues et polies qui s'achèvent sur une attente : on doit répondre par un compliment. Cite le numéro de son brevet en s'épongeant le front avec une pochette de soie ; il demande « n'est-ce pas ? » après chaque affirmation.",
    },
    {
      name: "Victorine Cordebard",
      role: "Secrétaire de la Chambre syndicale des mécaniciens, quarante-quatre ans",
      secret:
        "Elle veut que Pétrel sorte vivant de la Galerie avec ce qu'il a, et qu'il le lui apporte, rue de Javel, avant qu'on le prenne pour un voleur. Elle a payé les vingt francs de chaque personnage avec l'argent de la caisse de secours, sans prévenir le bureau de la Chambre ; si cela se sait, elle perd sa place. Elle ne sait pas ce que Pétrel a trouvé, et elle craint de le savoir. Son mari était un des trois terrassiers morts de la poitrine en 1886 (ne le dis pas ce soir). Quand elle voit la pièce, elle recule d'un pas.",
      voice: "Phrases courtes, avec un nom d'ouvrier dans chacune (un bobineur, un ajusteur). Elle ne dit « monsieur » à personne. Elle ne dit « Bon. » qu'une fois, pour clore.",
    },
    {
      name: "Gabriel Pétrel",
      role: "Jeune mécanicien de dix-neuf ans, nettoyeur du sous-sol de la machine n° 7",
      secret:
        "Il veut sortir de la Galerie avec la pièce avant qu'on le prenne pour un voleur, pour payer l'hôpital de sa mère, malade de la poitrine. Il cache qu'il l'a déjà montrée à un camarade, qui a parlé aux contrôleurs. Il ne sait pas ce que c'est : il l'a trouvée dans un chariot de rebut, enveloppée dans un chiffon, et elle était tiède. Delestrade l'y a fait glisser ; ni Pétrel ni les personnages ne peuvent le deviner ce soir.",
      voice: "Bégaie sur les noms de machines (« la… la… la machine sept »), jamais sur les chiffres. Tient sa poche gauche d'une main et s'excuse trop souvent.",
    },
    {
      name: "Hortense Quillebeuf",
      role: "Directrice du Bureau des Brevets, au Trocadéro",
      secret:
        "Elle veut retrouver la pièce avant que les Veilleurs sachent qu'elle a quitté la vitrine du Bureau. Elle cache sa rivalité avec Delestrade, qui lui retire des pièces et ne lui rend aucun compte. Elle craint plus l'homme en manteau gris que les voleurs, et elle donnera un ordre écrit à qui lui rapporte la pièce avant lui. Elle fait son métier, qui est de noter.",
      voice: "Sèche et polie. « Numéro de brevet ? » avant toute autre phrase. Elle ne regarde jamais celui à qui elle parle, mais son crayon, et elle note tout, même ce qu'on ne lui dit pas.",
    },
    {
      name: "Blanche Mauvezin",
      role: "Reporter à La Sirène de Javel, vingt-neuf ans",
      secret:
        "Elle veut un papier signé qui prouve que l'objet existe, avec les noms de ceux qui l'ont eu en main : c'est la preuve qu'il manque à sa série sur les brevets. Elle sait depuis le mois dernier que le papier et l'imprimeur de La Sirène de Javel sont payés par un trust anglais de machines. Elle n'a pas de preuve écrite, et ne le dira à personne : si elle publie, elle publie pour eux. Elle ne trahira pas Cordebard, mais elle publiera ce qu'on ne lui défend pas de publier.",
      voice: "Pose trois questions à la fois, note la réponse à la dernière. Répète les chiffres qu'on lui donne en les soulignant du doigt.",
    },
    {
      name: "L'homme au manteau gris",
      role: "Une présence du Commissariat que personne ne nomme",
      secret:
        "C'est un Veilleur. Il a pour ordre de ramener l'objet et celui qui l'a touché « à l'infirmerie du Trocadéro », et son cadran de laiton frémit à moins de dix-huit mètres d'une pièce mère. Il ne parle à personne tant qu'il n'est pas sûr. Il n'a pas été envoyé pour tuer et ne tuera pas dans la Galerie ; il ne sait pas non plus qui d'autre en a l'ordre.",
      voice: "Une voix très douce, trois phrases au plus. Ne hausse jamais le ton. Regarde le cadran avant de regarder la personne.",
    },
  ],
  encounters: [
    {
      title: "Les contrôleurs et les chiens (acte 3)",
      description:
        "Deux contrôleurs de billets et deux chiens de garde du Commissariat, lâchés dans le passage derrière les ateliers de bobinage à 22 h pour la fouille. Enjeu : Pétrel et la pièce, mais aussi les ouvrières du bobinage, que les contrôleurs punissent d'une nuit de paie si on les trouve à cacher quelqu'un, et la nuit de la Galerie elle-même (un chien blessé aboie, et tout le poste vient). Les contrôleurs poinçonnent d'abord, tirent leur sifflet ensuite. Le premier sifflet appelle deux gardes en 1d4 rounds : ils sont à la porte de service, pas aux ponts roulants. Chaque chien a son maître, un des deux contrôleurs. Les chiens attaquent en meute (avantage si un autre est à 1,5 m de la cible), mais n'attaquent pas un enfant qui leur tourne le dos et s'arrêtent si leur maître est neutralisé. Les contrôleurs fuient dès que l'un des chiens est tué. Sorties sans combat : un franc au contrôleur (Persuasion DD 11, il note la chose sur son ardoise) ; un morceau de viande du buffet pour les chiens (Dressage DD 12) ; la doyenne du rang de bobinage qui ouvre une porte de service contre une réclamation portée au contremaître ; un mot de Cordebard remis à un contrôleur dont l'enfant est malade à Grenelle ; ou passer par le pont roulant et laisser le passage derrière soi.",
      enemies: [ennemi("controleur-de-billets", 2), ennemi("chien-de-garde-du-commissariat", 2)],
      difficulty: "Moyenne (240 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
    {
      title: "Le garde du monte-charge (acte 4)",
      description:
        "Un garde du Commissariat à la porte du monte-charge du sous-sol, matraque à tension en main, sabre-baïonnette à gauche, revolver à droite. Enjeu : la sortie par le sous-sol, que personne d'autre ne connaît, et Pétrel, que la présence de l'homme en manteau gris, au bout du compte, décide de laisser partir ou de reprendre. Le garde frappe d'abord à la matraque (une décharge sur le premier coup qui touche), tire seulement si on lève une arme à feu. Il recule devant un témoin de la presse (Mauvezin) ou un reçu signé d'un Signataire. À sa mort, le sifflet du poste voisin sonne. L'enceinte est fermée aux personnages et leurs cartes de Permanent sont saisies. L'homme gris note les noms. Sorties sans combat : cinq francs bien placés (Persuasion DD 12) ; Intimidation DD 14 devant témoins ; un ordre écrit de Quillebeuf obtenu au troisième acte ; une diversion (couper la lampe à arc de la salle des machines, déclencher le sifflet d'une chaudière, crier « à la corde ! » dans l'allée) qui l'envoie vérifier ailleurs ; ou passer par le pont roulant ou les ateliers de bobinage. Après trois rounds, l'homme gris paraît en haut de l'escalier et propose l'infirmerie. Annonce-le avant le premier coup.",
      enemies: [ennemi("garde-du-commissariat", 1)],
      difficulty: "Moyenne sur le papier (200 PX ajustés pour quatre personnages de niveau 1), mais le combat se perd presque toujours : après trois rounds, l'homme gris paraît ; évitable",
    },
  ],
  twists: [
    "La nuit de grand courant tombe à 21 h 40 parce que le Commissariat a refusé de la décaler pour la soirée : le Cocher s'emballe, la lumière baisse pour tout Grenelle, et personne dans la Galerie ne s'en étonne. Seuls les mécaniciens lèvent les yeux vers les lampes.",
    "Delestrade a pris la pièce dans la vitrine de Quillebeuf (elle ne l'a pas encore compris) et l'a fait glisser dans le chariot de rebut. Il n'a prévenu aucun autre Veilleur : l'homme gris obéit à l'ordre général de ramener toute pièce sortie. Delestrade a donc lancé le garçon sans le protéger. Ce soir, aucun joueur ne peut le savoir.",
    "Le camarade à qui Pétrel a montré la pièce a parlé aux contrôleurs. Quand Pétrel l'apprend, il pleure, puis dit qu'il aurait dû se taire. Cordebard ne lui reproche rien.",
    "Quillebeuf et Delestrade se disputent la pièce sans se parler : elle a quitté la vitrine du Bureau avant que Quillebeuf s'en rende compte. Leur rivalité vaut plus à la table que la pièce.",
  ],
  rewards: [
    "Les vingt francs de Cordebard, déjà en poche, et trente francs de plus si Pétrel arrive rue de Javel, payés sur la caisse de secours de la Chambre. Pour un valet, deux francs de l'impresario et le souper, retenue de un franc déduite.",
    "La reconnaissance de Cordebard : une alliée de la Chambre syndicale, qui connaît les ateliers, les contremaîtres et les gens de la relève de six heures. Un laissez-passer de la Chambre pour la porte de Javel (il ne vaut rien pour un engagé des Villages, qui a besoin d'un permis).",
    "Un papier signé de Mauvezin, si on le lui donne : l'article paraît dans La Sirène de Javel, sans la pièce, avec le nom des personnages et celui du Cocher. Un reporter ami, un dossier de plus au Trocadéro.",
    "La gratitude de Dorlhac, si on a sauvé ses invités : une invitation à sa table, une plaque de cuivre qui ouvre une porte, et la certitude qu'il paie pour garder le silence.",
    "Tout le groupe passe au niveau 2 à l'aube, rue de Javel, ou au matin suivant, quel que soit le sort de la pièce.",
  ],
  gmNotes: `À faire sentir sans le dire : la lumière baisse pour tout Grenelle quand le Cocher s'emballe, et la Galerie ne s'en étonne pas. Dorlhac veut ramasser les morceaux avant qu'un mécanicien ne les lise. Pétrel est un mécanicien de dix-neuf ans qui a ramassé un objet chaud pour payer l'hôpital de sa mère. Il peut refuser de la remettre à qui que ce soit, ou la vendre à celui qui paie les soins. Laisse-le répondre avant le groupe. L'homme en manteau gris n'a pas d'ennemi dans la salle : il attend que le cadran désigne le porteur.

La chronologie, minute par minute (à garder sous les yeux).
19 h : ouverture de la soirée, la valse à vapeur. 21 h 00 : Dorlhac monte sur l'estrade. 21 h 30 : le Cocher est tiré à l'avant, le cheval inquiet. 21 h 40 : la lumière baisse, le Cocher s'emballe (trois rounds). 21 h 55 : le calme revient, les quatre personnes viennent à eux. 22 h 00 : les gardes fouillent la Galerie par petits groupes. 22 h 10 : les portes sont fermées. 22 h 30 : la ronde des gardes de nuit passe aux portes ; après, on ne sort plus sans papiers.

Les secrets du MJ (à ne jamais dire aux joueurs). La pièce est une pièce mère, taillée dans une machine que personne ne comprend. Delestrade, chef des Veilleurs, a pris la pièce dans la vitrine de Quillebeuf (elle ne l'a pas encore compris) et l'a fait glisser dans le chariot de rebut. Il n'a prévenu aucun autre Veilleur : l'homme gris obéit à l'ordre général de ramener toute pièce sortie. Delestrade a donc lancé le garçon sans le protéger. Il y a derrière une machine sous le sol, que personne ne nomme dans ce scénario : la lumière qui baisse, le cadran qui frémit, le « quelque chose » de Pétrel viennent du même endroit. Si un joueur demande ce que c'est, la bonne réponse est « on ne sait pas », et la soirée continue. Ne prononce jamais les mots qui appartiennent aux niveaux supérieurs : ils reviendront plus tard, dans la campagne. Cette pièce est un indice qui revient, rien de plus.

Les Pannes (réserve du MJ, règle des Pannes du canon). Chaque fois qu'un personnage franchit un seuil de Pression (3, 5, 7 ou 10), tu gagnes une Panne, quatre au plus. Pour ce scénario, les Pannes utiles sont : une lampe à arc qui s'éteint au pire moment de la sortie, le monte-charge qui bloque entre deux étages, la passerelle du pont roulant qui se met à glisser. Un joueur peut l'annuler en prenant 1 de Pression. À niveau 1, personne n'a beaucoup d'appareils : une Panne ou deux au plus suffisent. Un appareil forcé près de l'homme gris fait frémir son cadran plus fort (Perception DD 13 pour le remarquer).

Le Cocher mécanique n'entre pas dans le budget des rencontres. Sa fiche (FP 2, 450 PX) dépasse le seuil mortel d'un groupe de niveau 1 : la scène en fait un sauvetage. La scène ignore volontairement la multiattaque de la fiche : un seul coup par round (+4, 1d8+2 contondants). Annonce avant chaque round le point de l'allée visé. Sept invités se trouvent sur son trajet ; il se décroche tout seul au bout de trois rounds. Un personnage de niveau 1 touché ne descend pas sous 1 PV ; un invité laissé deux rounds dans l'arc peut mourir. Si personne ne sauve personne, deux invités sont blessés, un vieux monsieur est tué et le reporter étranger écrit sa version.

Les valets. Les personnages des Villages ont été engagés par leur impresario : deux francs et le souper, un livret d'engagé gardé au Trocadéro, et un permis nécessaire pour sortir de l'enceinte. Un engagé qui n'est pas à la corde à minuit est noté sur le registre de l'impresario : cinq francs de retenue par semaine pendant un mois, et son livret passe en tête de la pile au Trocadéro. S'il sort de l'enceinte sans permis, c'est un mois de dépôt. Le Conseil des Villages (Ndoye, madame Hạnh) peut couvrir la retenue, et en attend un service. Les gardes parlent devant les valets des Villages comme devant du mobilier ; c'est une chance pour ceux qui ont une chose à cacher. Un valet qui parle à Pétrel ou qui prend la pièce le fait sous les yeux de deux contrôleurs : Discrétion DD 12. Les ouvrières du bobinage ne sont jamais des ennemies : elles cachent contre un service de la Chambre, et elles perdent leur nuit si on les dénonce. Les Réfractaires et les Gens des Villages ne sont jamais des ennemis par défaut, et aucune rencontre de ce scénario ne les met en scène.

L'équilibre. Deux rencontres : les contrôleurs et les chiens (240 PX ajustés) et le garde du monte-charge (200 PX ajustés), pour quatre personnages de niveau 1. L'homme en manteau gris (FP 4, mortelle) ne se combat pas : ne lui laisse pas faire plus de trois phrases, et ne le fais pas attaquer. Les armes à feu sont interdites dans l'enceinte : les revolvers sont en consigne, les personnages n'ont pas d'arme à feu au départ, et un garde qui en trouve une la saisit. Les appareils brevetés sont permis. La matraque à tension est réservée aux gardes : l'acheter est un délit.

Qui emporte la pièce ? Le scénario tient dans tous les cas. Si le groupe la remet à Cordebard, il a une alliée de la Chambre et un ennemi au Trocadéro (Quillebeuf note leurs noms). S'il la donne à Dorlhac, c'est un Signataire reconnaissant qui n'a rien à offrir, et Cordebard sait à qui l'on a livré la pièce. S'il la remet à Quillebeuf, elle note les noms, écrit un ordre de passage et ne dit pas qu'elle a perdu l'objet ; Cordebard l'apprend avant l'aube. S'il la confie à Mauvezin, c'est la presse, et un trust étranger derrière : l'article paraît, avec les noms. S'il la laisse à l'homme au manteau gris, Pétrel est emmené à l'infirmerie du Trocadéro. On dit qu'il est soigné. Personne ne le revoit, et Cordebard ne le pardonnera pas. S'il la garde, la Pression ne bouge pas, mais le cadran frémit chaque fois qu'on croise un manteau gris, et Quillebeuf, Mauvezin et Dorlhac ne l'oublient pas.

Le Pouls passe à 97 : la nuit de grand courant de ce mois est menée jusqu'au bout (−3). Si un personnage emploie la pièce mère en jeu, −2 de plus. Rien d'autre ne le fait bouger.

Au micro. Le verre qui vibre au-dessus de la salle, l'orgue à vapeur qui flanche, le clic d'un sifflet de contrôleur, la valse qui reprend trop tôt. Cordebard parle bas. Dorlhac parle fort et trop vite. L'homme gris ne parle presque pas.

Environ trois heures et demie. Si la soirée file, saute la scène de l'acte 3 : la pièce est déjà dans le fiacre, et le groupe décide de la chercher avant 22 h 10 ou de partir sans elle.`,
  readAloud: [
    {
      act: 1,
      title: "La Galerie des Machines",
      text: "Quatre cents mètres de verre et de fer, sans un pilier au milieu. Sous la verrière, des machines de trente tonnes reposent sur des socles de marbre, et trois cents invités en habit boivent à leurs pieds, la coupe à la main. Là-haut, des ponts roulants glissent sur leurs rails et portent des dames en robe claire sur des plates-formes grillagées, comme dans des cages. Un orgue à vapeur joue une valse. Au milieu de l'allée, sur le siège d'un fiacre laqué, un homme de cuivre en livrée attend, immobile, le bras sur les genoux ; devant lui, un cheval alezan roule de l'œil. Quelqu'un vous met un plateau dans les mains.",
    },
    {
      act: 2,
      title: "21 h 40",
      text: "La lumière baisse. Une lampe à arc, puis la suivante, dans l'ordre exact de la salle, et les machines ralentissent ensemble avec un bruit de bête qui expire. L'orgue à vapeur flanche sur une note. L'homme de cuivre vient de tendre le bras ; il ne le repose pas. Il avance, fouette le vide, et se met à tourner dans l'allée, entre les nacelles, le bras tendu devant lui comme une barrière. Un vieux monsieur à canne ne s'écarte pas. Le cheval hennit. Un jeune homme crie le nom de sa fiancée. Plus haut, un pont roulant s'est arrêté au-dessus de l'allée, et une dame agite son mouchoir dans sa cage.",
    },
    {
      act: 3,
      title: "Ce que le petit vous a donné",
      text: "Le cheval s'est calmé, le bras de cuivre est retombé, les lampes reviennent en tremblant. Dans votre main, quelque chose de la taille d'un pouce, gris-vert, tiède comme un galet resté au soleil. Contre le mur, un garçon maigre s'essuie les mains à un chiffon et dit : « Pas aux gardes. Pas à l'homme gris. Ce que j'ai pris à la… à la sept, c'est pas à moi. » Au bout de l'allée, un homme en manteau gris regarde un cadran noué à son poignet, puis le plafond, puis vous. À quelques pas, une femme au chignon strict lève son crayon : « Numéro de brevet ? »",
    },
    {
      act: 3,
      title: "Les mains vides (si la pièce est dans le fiacre)",
      text: "Le cheval s'est calmé, le bras de cuivre est retombé, les lampes reviennent en tremblant. Vos mains sont vides. Pétrel est contre le mur, les mains vides, et regarde le fiacre. Au bout de l'allée, un homme en manteau gris regarde un cadran noué à son poignet, puis le plafond, puis vous. À quelques pas, une femme au chignon strict lève son crayon : « Numéro de brevet ? »",
    },
    {
      act: 4,
      title: "Les portes",
      text: "Dix heures dix. Les portes de la Galerie se ferment l'une après l'autre dans un grand bruit de fer, et un garde, dehors, tourne une clef. Dans le passage des ateliers, les métiers à bobiner tournent à vide, et des ouvrières en tablier vous regardent sans dire un mot. Un chien aboie quelque part, plus bas. Sur la passerelle du pont roulant, une plate-forme grillagée vient de s'arrêter, ouverte. Du fond d'un escalier monte l'odeur de l'huile chaude.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "Le garçon",
      options: [
        { label: "Aborder Pétrel tout de suite", consequence: "Il bégaie, se méfie, ne dit rien de la pièce. Mais il sait que quelqu'un le garde, et il cherchera ce visage dans la cohue à 21 h 40." },
        { label: "Le suivre de loin", consequence: "Discrétion DD 12 pour ne pas être vu des contrôleurs. On apprend qu'il serre sa poche gauche, qu'un camarade le regarde de travers, et que l'homme en manteau gris le suit aussi." },
        { label: "Prévenir Quillebeuf qu'un garçon cache quelque chose", consequence: "Elle note tout, remercie, et envoie deux gardes : ils arrivent à 21 h 38 devant la porte de service, et ne prennent Pétrel que quand le courant baisse. Dans la panne, il leur échappe et traverse l'allée. Cordebard ne vous le pardonnera pas, et l'homme gris sait désormais qui parle." },
      ],
    },
    {
      act: 2,
      title: "Le Cocher",
      options: [
        { label: "Tirer les invités de son chemin", consequence: "Acrobaties ou Athlétisme DD 12 : deux invités sauvés par réussite. Dorlhac se souvient de qui a sauvé les siens, et le reporter étranger écrit des choses aimables." },
        { label: "Dételer le cheval et couper la courroie", consequence: "Dressage DD 12 pour le cheval, puis Adresse DD 13 pour la courroie : seule la courroie arrête le Cocher avant les trois rounds. Un mécanicien de la Galerie regarde le geste et le retient : la Chambre apprend que quelqu'un sait arrêter une machine." },
        { label: "Courir vers Pétrel pendant le désordre", consequence: "Pétrel vous donne la pièce de la main à la main, sans témoin. Les invités laissés sur place font leur chance seuls, et deux d'entre eux sont blessés. Dorlhac vous reproche votre absence." },
      ],
    },
    {
      act: 3,
      title: "La pièce",
      options: [
        { label: "La remettre à Cordebard", consequence: "Une alliée de la Chambre syndicale, qui paie et qui se souvient. Un ennemi au Trocadéro : Quillebeuf note vos noms." },
        { label: "La donner à Dorlhac", consequence: "Une table, une plaque et la certitude qu'il paie pour qu'on se taise. Cordebard apprend que vous avez livré la pièce à celui qui a le plus à cacher." },
        { label: "La remettre à Quillebeuf", consequence: "Elle note votre nom, écrit un ordre de passage pour le garde du monte-charge et ne dit pas qu'elle a perdu l'objet. Cordebard l'apprend avant l'aube, et ce n'est pas elle qui le raconte." },
        { label: "La confier à Mauvezin, contre un papier signé", consequence: "La presse, et une page dans La Sirène de Javel avec vos noms. Un trust étranger paie le papier du journal, ce que Mauvezin sait et ne dit à personne." },
        { label: "La laisser à l'homme en manteau gris", consequence: "Pétrel est emmené à l'infirmerie du Trocadéro. On dit qu'il est soigné. Personne ne le revoit, et Cordebard ne vous le pardonnera pas. Il regarde les mains du personnage qui l'a tenue : « Vous aussi, vous avez eu froid aux doigts. Passez à l'infirmerie demain. » Il note son nom." },
        { label: "La garder", consequence: "Le cadran frémit chaque fois qu'on croise un manteau gris. Quillebeuf, Mauvezin et Dorlhac n'oublient pas qui l'a." },
      ],
    },
    {
      act: 4,
      title: "La sortie",
      options: [
        { label: "Par le pont roulant", consequence: "Athlétisme DD 12 pour la plate-forme grillagée. Personne ne regarde les cages, mais l'homme en manteau gris voit tout ce qui bouge au plafond. Sous l'arche de la passerelle de Javel, une poterne de service s'ouvre en une action." },
        { label: "Par les ateliers de bobinage", consequence: "La doyenne du rang cache le groupe contre une réclamation portée au contremaître, à son nom à elle : c'est elle qui sera punie s'il la lit. Les contrôleurs fouillent rang par rang." },
        { label: "Par le sous-sol et son monte-charge", consequence: "Un garde tient la porte. Après trois rounds, l'homme gris paraît en haut de l'escalier et propose l'infirmerie. Un nettoyeur de nuit montre le puits de Grenelle contre un service." },
        { label: "Sortir sans Pétrel", consequence: "La sortie est facile, et vous la payez : Pétrel est pris, la pièce vous reste ou non, et Cordebard ne vous le pardonnera pas." },
      ],
    },
  ],
  mapHint: {
    kind: "donjon",
    seed: 1899,
    name: "La Galerie des Machines, soirée de Dorlhac",
    width: 40,
    height: 30,
    labels: ["La Galerie des Machines", "Les ponts roulants", "Les ateliers de bobinage", "Le sous-sol de la Galerie"],
  },
};
