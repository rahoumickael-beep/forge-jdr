// Bibliothèque de la Cellule Hermès (contemporain, thriller d'espionnage, Europe, novembre 2026) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ et du canon y sont en clair.
// Les adversaires viennent du bestiaire du monde (shared/hermes-bestiaire.ts) : PV, CA et attaque ne se recopient pas à la main.
// Règles employées : shared/hermes-regles.ts (Empreinte de 0 à 10, départ à 2 ; couvertures ; Caisse ; armes ; mourant à 0 PV par arme à feu).
import { BESTIARY, toEncounterEnemy } from "./bestiary";
import type { Encounter, Scenario } from "./types";

/** Une ligne d'ennemi tirée de la fiche du bestiaire, pour un groupe de niveau 1. */
function ennemi(creatureId: string, count: number): Encounter["enemies"][number] {
  const fiche = BESTIARY.find((c) => c.id === creatureId && c.genre === "contemporain");
  if (!fiche) throw new Error(`Créature inconnue du bestiaire de la Cellule Hermès : ${creatureId}`);
  return { ...toEncounterEnemy(fiche, count, 1), creatureId };
}

/** Campagne « La Cellule Hermès », scénario 1 : le pli n° 4271, niveaux 1 et 2. */
export const LE_COFFRET_D_IXELLES: Scenario = {
  id: "bib-he-coffret-d-ixelles",
  title: "Le coffret d'Ixelles",
  genre: "contemporain",
  ton: "mysterieux",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Jeudi 5 novembre 2026, 6 h 05, la Mercerie du boulevard de Magenta. Rideau baissé, la cafetière finit de passer. Suzanne Mercadier pose sur la table de coupe un pli de papier gris, vous le laisse lire une fois, puis le reprend : « Pli n° 4271. Objet : récupérer un coffret à l'agence Aldenhove, rue de la Brasserie, Ixelles. Aucune violence. Remise à la Mercerie avant vendredi 6 h. Budget : 1 500 €. » Elle ajoute, sans lever les yeux : « Il a appelé la ligne du fond. On ne décroche jamais la ligne du fond. » Vous avez une heure, le temps de vider le placard du fond. Le train part à 7 h 12.",
  synopsis:
    "Un traducteur assermenté de septante et un ans, Gérard Aldenhove, veut partir à la retraite sans qu'on vienne l'embêter. Il garde dans un coffret trois cents pages de photocopies de courriers reçus depuis 1998 par son agence, qu'il a photocopiées une à une, et une clé de coffre bancaire sans nom de banque. Le Service veut ce coffret à la Mercerie avant vendredi 6 h, et les quatre nouveaux coursiers, recrutés en septembre, partent chercher leur premier pli : le train de 7 h 12 à Paris-Nord, Bruxelles-Midi à 8 h 30, la rue d'Ixelles à 9 h 10. Aldenhove ouvre à 9 h 30 et pas avant. Il tarde, il propose du thé, il dit qu'il préférerait que ce soit quelqu'un d'autre qui prenne le coffret, et il garde dans le double fond de son tiroir une lettre qu'il ne montre qu'à celui qui lui inspire confiance. Une camionnette grise est garée à cinquante mètres depuis 8 h 20 ; à 10 h 15, Dorian Meyssonnier, du groupe Ostrevent, la rejoint à pied et observe la maison à la jumelle. À 10 h 40, une berline noire s'arrête derrière : Judith Aldebert, de la Section de contrôle des services, attend que les coursiers sortent pour les aborder. Elle n'a aucun pouvoir de police et personne avec elle. À 11 h 05, la concierge frappe : un voisin se plaint d'une voiture mal garée. À 11 h 30, les hommes d'Ostrevent montent, et les coursiers ont cinq minutes pour sortir par l'escalier, la cour de service ou la cave. À 13 h, la police belge arrive, appelée par un voisin : tout coursier encore dans la rue est contrôlé. Ce que personne ne dit : Ostrevent était là avant les coursiers sans qu'Aldenhove l'ait prévenu ; Aldebert ne peut rien exiger, mais elle peut signaler un attroupement ; et le pli qui envoie la Cellule chercher ce coffret est un pli qui veut le voir détruit.",
  acts: [
    {
      title: "Le pli n° 4271",
      location: "La Mercerie, boulevard de Magenta ; le train de 7 h 12 ; Bruxelles-Midi ; la rue de la Brasserie, Ixelles",
      summary:
        "6 h 05. Le pli est arrivé par la Boîte à 5 h 52, comme les autres. Les coursiers le lisent une fois, Suzanne le reprend et le range dans le coffre-fort à serrure ancienne. Elle dit que la source a peur, et que le vieil homme a déjà appelé la ligne du fond, celle qu'on ne décroche pas. Elle ouvre le placard de l'arrière-boutique : kit de crochetage, gilet et casquette, téléphone jetable, enregistreur, appareil photo à téléobjectif y sont déjà. Tout le reste s'achète à Bruxelles-Midi, sur le budget de 1 500 € (la Caisse rembourse sur facture, quand elle rembourse). Rien à payer plus de 1 000 € en espèces d'un coup : l'Empreinte monterait de 1. Le pli dit aucune violence, et Suzanne ne signe aucune dépense d'arme. Le train de 7 h 12 quitte Paris-Nord, les billets sont pris au nom de la couverture. À 8 h 30, Bruxelles-Midi ; à 9 h 10, la rue de la Brasserie : une maison de maître en brique noircie, une plaque de cuivre « Aldenhove & Fils, traductions jurées », un escalier à rampe de bois. Aldenhove ouvre à 9 h 30. Il reste vingt minutes de rue. Perception DD 12 repère la camionnette grise, garée à cinquante mètres depuis 8 h 20, vitres embuées, dont personne ne descend. Un voisin à la fenêtre du deuxième note les allées et venues (Perception DD 12 pour le voir ; si les coursiers ont été vus plus de dix minutes devant la maison, il appelle la police, et s'il parle à un policier, l'Empreinte monte de 1). Le choix de la préparation décide du reste de la matinée : la voiture, l'arme, ou le strict nécessaire.",
    },
    {
      title: "9 h 30 : l'agence Aldenhove",
      location: "L'agence Aldenhove : le rez-de-chaussée, le bureau du fond et la ligne du fond, le tiroir à double fond",
      summary:
        "Des dictionnaires jusqu'au plafond, des rames de papier, une imprimante qui n'a jamais tourné à plein régime. Dans le bureau du fond, un téléphone fixe sonne à intervalles réguliers sur un bureau où personne ne s'assied (Investigation DD 13 pour noter l'intervalle ; qui décroche fait monter l'Empreinte de 1). Aldenhove, septante et un ans, cardigan et lunettes à double foyer, ouvre à 9 h 30 pile. Il demande d'abord une preuve qu'on vient du Service : un numéro de pli suffit, et il s'en contente avec un soupir. Il parle poliment, en français puis en néerlandais puis en anglais, en traduisant à voix haute ce qu'il vient de dire. Il propose du thé. Si on regarde la plaque : « Fils, c'est moi. Le père a fondé l'agence en 1961. » Il tarde. Il dit : « Je préférerais que ce soit quelqu'un d'autre qui le prenne. » Le coffret est sur une étagère, fermé par une sangle : trois cents pages de photocopies de courriers adressés à l'agence depuis 1998, faites une à une par prudence, sans lien apparent (les noms de destinataires sont noircis une fois sur deux), et une clé de coffre bancaire marquée d'un numéro, sans nom de banque. La lettre reste dans le double fond du tiroir : Aldenhove ne la sort que si un coursier gagne sa confiance (Intuition DD 13, ou lui garantir qu'il ne sera pas inquiété, ce qui engage celui qui le promet). Lue, elle dit seulement qu'on met fin au contrat de prestation de l'agence, sans mot de plus. Elle ne prouve rien. C'est un premier indice. Il les a photocopiées une à une depuis 1998, par prudence, sans lire plus loin que les en-têtes. Il ne sait pas à quoi elles servent, et il ne dit pas qu'il a appelé la ligne du fond par peur. Il pose ses conditions : sortir de l'agence sans être inquiété, et ne plus voir quelqu'un de la Mercerie. Compte quarante minutes de jeu. Ne coupe pas le thé : c'est dans ces minutes que la table apprend à le connaître.",
    },
    {
      title: "10 h 15 à 11 h 05 : la rue",
      location: "La rue de la Brasserie : la camionnette grise, la berline noire, la concierge, le voisin qui note",
      summary:
        "La camionnette grise est là depuis 8 h 20, à cinquante mètres, vitres embuées, personne n'en descend. À 10 h 15, Meyssonnier la rejoint à pied et monte à l'arrière avec la jumelle ; un technicien est devant un écran, un homme de main surveille la porte de la rue. Il ne bouge pas tant que personne ne le dérange : il attend les coursiers à la sortie, avec le coffret dans les mains. Perception DD 15 pour le voir à la jumelle, DD 12 si on cherche la camionnette. 10 h 40. Une berline noire se gare derrière la camionnette. Judith Aldebert ne descend pas. Elle attend que les coursiers sortent pour les aborder, les photographier et leur proposer un rendez-vous. Elle ne peut rien exiger. Si on lui ferme la porte, elle signale à 12 h 45, sans se nommer, un attroupement devant la maison. Elle parle en listes : premièrement, deuxièmement. Perception DD 12 : il n'y a personne d'autre dans sa voiture, et pas de seconde voiture dans la rue. 11 h 05. La concierge frappe à la porte de l'agence : un voisin se plaint d'une voiture mal garée. Si les coursiers sont venus en voiture, c'est la leur. Le temps compte : chaque minute de plus donne à Ostrevent le temps de monter. Les coursiers peuvent sortir et parler, rester dans la maison, ou chercher une autre issue sans attendre. Voir le choix « Judith Aldebert » et la rencontre « La camionnette grise ».",
    },
    {
      title: "11 h 30 : cinq minutes pour sortir",
      location: "L'escalier de la maison, la cour de service, la cave et la rue d'à côté",
      summary:
        "11 h 30. Meyssonnier monte quand la berline noire se gare derrière lui à 10 h 40 : il ne veut pas laisser l'inspectrice prendre le coffret. Les hommes d'Ostrevent descendent de la camionnette et montent, l'un par l'escalier, l'autre par la cour. Les coursiers ont cinq minutes. Par l'escalier : Discrétion DD 12 pour passer le palier au moment où les deux hommes sont à l'étage. Par la cour de service : Athlétisme DD 13 pour franchir le mur du fond ; sur un échec, 1d6 dégâts contondants et le bruit réveille tout l'immeuble. Par la cave : elle donne sur la rue d'à côté, sans caméra, mais la porte est fermée à clé (Escamotage DD 12 avec le kit de crochetage, ou la clé que donne Aldenhove à qui a sa confiance). Un coursier qui a gardé les mains vides n'est pas arrêté s'il sort seul ; celui qui porte le coffret attire l'œil. À 13 h, la police belge arrive, appelée par le voisin : tout coursier encore dans la rue est contrôlé (papiers, sac) ; une arme trouvée sur lui, c'est une arrestation judiciaire de 24 heures. Le contrôle de 13 h ne concerne que ceux qui restent ou reviennent. Si le groupe est encore dans la maison, Aldenhove ouvre aux policiers lui-même et dit la vérité. Les hommes d'Ostrevent ne sont pas là pour tuer (leur chef a la consigne de ne pas tuer, sauf si on tire le premier), mais ils sont deux de plus que ce que le groupe croyait. Voir le choix « La sortie » et la rencontre « Les deux gardes de l'escalier ». Un coup de feu dans la maison s'entend de la rue : la police est prévenue avant que le groupe soit sorti.",
    },
    {
      title: "Vendredi, 6 h : à qui le coffret ?",
      location: "Bruxelles-Midi, le dernier train du soir (arrivée vers 22 h 30), la Mercerie ; au choix, une autre adresse",
      summary:
        "Les coursiers ont le coffret, ou ils ne l'ont pas. Ils ont jusqu'à vendredi 6 h pour le rendre à la Mercerie, et chaque heure sans le remettre est une heure où quelqu'un d'autre peut le leur prendre. Suzanne attend avec le café. Judith Aldebert a laissé une carte avec un numéro de téléphone. Meyssonnier a laissé un numéro lui aussi, sur un papier glissé dans la poche d'un manteau : c'est celui de Tournemine, qui paie bien. Le site de Palimpseste a une boîte de dépôt anonyme ; un coursier peut y envoyer des scans depuis n'importe quel café, et personne ne vient dans la rue. Remettre le coffret à Suzanne, c'est garder le pli propre ; le donner à Aldebert, c'est trahir la Cellule ; le confier à Meyssonnier, c'est payer Tournemine ; le transmettre à Palimpseste, c'est tout ouvrir. Voir le choix « Le coffret ». À la fin de l'aube, quel que soit le choix, le groupe passe au niveau 2.",
    },
  ],
  villain: {
    name: "Dorian Meyssonnier",
    motivation:
      "rapporter à Tournemine le coffret de l'agence Aldenhove sans mort ni témoin, avant que la Section ou le Service l'ait. Il a la consigne de ne pas tuer, sauf si on tire le premier. Il cherche un accord, pas une bataille : lui offrir ce qu'il vient chercher contre la vie sauve d'Aldenhove et la sortie libre du groupe. S'il croit à un piège, il se retire. Derrière le pli, un autre veut le coffret détruit : Meyssonnier ne le sait pas, et ne le saura pas ce jour-là",
    description:
      "La quarantaine, la barbe courte et grise, une veste sombre au col relevé, une jumelle autour du cou. Il observe depuis une camionnette grise, compte les sorties et dit « OK » : ses hommes savent déjà quoi faire. Il parle peu et ne hausse jamais le ton. Sa fiche (FP 4, 1 100 PX) est mortelle pour quatre personnages de niveau 1 : il ne se combat pas dans ce scénario. S'il est pris à partie devant la maison, il se retire et laisse ses hommes remonter dans la camionnette. Ne lui laisse pas plus de trois phrases : il demande le coffret, il propose un accord, il note les visages.",
  },
  npcs: [
    {
      name: "Suzanne Mercadier",
      role: "Traitante de la Cellule Hermès, cinquante-huit ans, à la Mercerie",
      secret:
        "Elle veut un coffret propre à la Mercerie avant vendredi 6 h et quatre coursiers qui rentrent sans histoire. Elle cache qu'elle sait que le Service a cessé d'exister : elle a signé l'accusé de réception en juin 2019. Elle ne sait ni ce que contient le coffret ni qui a écrit ce pli : il est arrivé par la Boîte à 5 h 52, comme les autres. Elle n'a pas décroché la ligne du fond cette nuit et ne dit pas pourquoi elle ne la décroche jamais. Si un coursier lui dit que la camionnette d'Ostrevent était déjà dans la rue, elle ne répond rien pendant quatre secondes.",
      voice: "Phrases sèches, sans verbe de trop, le regard sur la cafetière plutôt que sur celui à qui elle parle. Finit en « voilà » (« Voilà, on ne demande pas. »). Dit « Bon. » pour clore, et « Vous avez compris ? » une seule fois par séance.",
    },
    {
      name: "Gérard Aldenhove",
      role: "Traducteur assermenté, septante et un ans, agence Aldenhove à Ixelles",
      secret:
        "Il veut partir à la retraite sans être inquiété, et que quelqu'un d'autre garde ce qu'il garde depuis vingt ans. Il cache la lettre dans le double fond du tiroir. Il ne dit pas qu'il a appelé la ligne du fond par peur, ni qu'il ne sait pas à quoi servent les trois cents pages : il les a photocopiées une à une depuis 1998, par prudence, sans lire plus loin que les en-têtes. Il ne sort la lettre que pour celui qui lui inspire confiance (Intuition DD 13), et il donnera la clé de la cave à qui l'a gagnée. Il ne trahira pas un coursier qui lui a tenu parole.",
      voice: "Poli à l'excès. Traduit à voix haute ce qu'il vient de dire, en néerlandais puis en anglais, souvent sans que personne le lui demande. Propose du thé deux fois avant d'entendre la réponse. Dit « septante et un ans » et, quand il s'embrouille : « Je veux dire… c'est tout ce que j'ai. I have nothing else. Meer heb ik niet. »",
    },
    {
      name: "Dorian Meyssonnier",
      role: "Chef d'équipe du groupe Ostrevent, la quarantaine, dans la camionnette grise",
      secret:
        "Il veut le coffret et la clé, pour qu'un client de Tournemine les ait avant la Section. Il cache sa consigne de ne pas tuer : s'il l'avoue, tout le monde se met à tirer sur lui. Il ne dit pas non plus qu'il est arrivé avant les coursiers, ni que personne ne l'a prévenu ce matin : il est là parce qu'on lui a dit de l'être. Il se retire s'il croit à un piège.",
      voice: "Peu de mots, des « OK » courts qui valent un ordre ou une réponse. Regarde la porte avant de regarder la personne. Ne hausse jamais le ton.",
    },
    {
      name: "Judith Aldebert",
      role: "Inspectrice principale de la Section de contrôle des services, quarante-quatre ans",
      secret:
        "Elle veut un coursier vivant et prêt à parler, et une première pièce qui tienne devant un tribunal. Elle cache qu'elle n'a aucun pouvoir de police, ni en France ni en Belgique, et personne avec elle : une carte, un appareil photo, un téléphone. Elle ne peut rien exiger. Si on lui ferme la porte, elle signale à 12 h 45, sans se nommer, un attroupement devant la maison. Elle ne sait pas encore à quelle cellule elle a affaire, ni que le Service a changé de forme.",
      voice: "Parle en listes : premièrement, deuxièmement, et pour finir. Ne montre sa carte tricolore qu'une fois. Les mêmes boucles d'oreilles depuis dix ans, qu'elle touche quand elle attend une réponse.",
    },
    {
      name: "La concierge de la rue de la Brasserie",
      role: "Concierge de la maison d'Ixelles, soixante-deux ans, gardienne des allées et venues",
      secret:
        "Elle veut que la rue soit calme et que la voiture mal garée parte avant midi. Elle cache qu'elle a déjà noté, depuis neuf heures, toutes les personnes entrées chez Aldenhove, et qu'un homme en blouson sombre lui a laissé 50 € ce matin pour qu'elle dise qui sortirait. Elle ne dit rien de cela à moins qu'on ne lui rende un service qu'elle remarque.",
      voice: "Bavarde et inquiète, finit ses phrases par « savez-vous », dit « une fois » à la belge, appelle tout le monde monsieur ou madame, y compris Aldenhove. Fait tourner la clé de la porte dans sa main.",
    },
  ],
  encounters: [
    {
      title: "La camionnette grise (acte 3)",
      description:
        "Un homme de main d'Ostrevent surveille la porte de la rue, à cinquante mètres de la maison, pendant que Meyssonnier observe à la jumelle depuis la camionnette. Enjeu : savoir qui a envoyé Ostrevent avant les coursiers, ne pas être photographié nettement par la caméra de la camionnette (Empreinte +1), et ne pas lui laisser le coffret. L'homme de main n'a pas la consigne de provoquer : il suit à distance, il note, il appelle son chef si le groupe s'approche. Il se rend ou bat en retraite dès qu'il est gravement blessé ou qu'un camarade tombe. Il ne meurt pas pour 3 800 € par mois. Sorties sans combat : Persuasion DD 14 avec un récit de livreur ou de client de l'agence ; Intimidation DD 15 si le groupe est plus nombreux que lui ; couper la route à la camionnette avec une voiture mal garée (Athlétisme DD 13) ; ou ne pas passer devant et sortir par la cave. Ce que chaque option coûte en Empreinte : parler sans se nommer, 0 ; être photographié nettement par la camionnette, +1 ; un blessé grave devant le voisin qui note, +1 ; un coup de feu, +2 et +1 par blessé grave ou mort, et la police belge est prévenue avant 12 h.",
      enemies: [ennemi("homme-de-main-d-ostrevent", 1)],
      difficulty: "Moyenne (200 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
    {
      title: "Les deux gardes de l'escalier (acte 4)",
      description:
        "À 11 h 30, deux gardes d'Ostrevent montent, l'un par l'escalier de la maison, l'autre par la cour : Meyssonnier leur a dit de ne rien casser en ville et de revenir avec ce qui a été demandé. Chacun tient un pistolet semi-automatique de 9 mm sous le blouson, et un garde tue un personnage de niveau 1 en un tour avec deux touches : annonce-le. Enjeu : Aldenhove, qui est dans son bureau et dont la vie, au bout du compte, vaut plus que le coffret ; la sortie sans bruit ; la police belge, qu'un voisin appelle à 13 h quoi qu'il arrive. Ils tirent seulement sur celui qui sort une arme ; sinon ils frappent à la matraque, ou poussent. Une créature réduite à 0 PV par une arme à feu est mourante et meurt à la fin de son troisième tour sans soins (Médecine DD 12 pour la stabiliser, DD 15 sous le feu). Sorties sans combat : Discrétion DD 12 par l'escalier au moment où les deux hommes sont à l'étage ; Athlétisme DD 13 par la cour de service ; Escamotage DD 12 sur la porte de la cave avec le kit de crochetage, ou la clé d'Aldenhove ; Persuasion DD 14 pour leur faire comprendre que leur patron ne gagnera rien à un mort dans la maison. Ce que chaque option coûte en Empreinte : l'escalier ou la cave, 0 ; la cour de service si on tombe du mur, +0 mais le bruit réveille l'immeuble ; un coup de feu dans la maison, +2 et +1 par blessé grave ou mort ; une porte forcée, +1.",
      enemies: [ennemi("garde-d-ostrevent", 2)],
      difficulty: "Difficile (300 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
    {
      title: "Le contrôle de 13 h (acte 4 ou 5)",
      description:
        "Deux policiers de quartier de la zone d'Ixelles, appelés par le voisin du deuxième, arrivent à 13 h devant la maison. Ils ne cherchent personne en particulier : ils veulent savoir à qui est la camionnette, à qui est la voiture mal garée, et pourquoi quatre inconnus sortent d'une agence de traduction à l'heure du déjeuner. Le contrôle ne concerne que ceux qui restent ou reviennent. Enjeu : ne pas finir en arrestation avec le coffret dans les mains, ne pas laisser Aldenhove répondre seul, et ne pas mettre Judith Aldebert face à un contrôle d'identité qui la ferait parler. Ce ne sont pas des ennemis : ils demandent les papiers, notent la plaque et n'ouvrent le feu qu'en cas de légitime défense. Sorties sans combat : Persuasion DD 12 avec un récit propre (client de l'agence, remise de documents) ; Tromperie DD 13 avec des papiers en règle ; partir avant qu'ils notent la plaque ; ou laisser Aldenhove parler : il dit la vérité, qui est ennuyeuse. Ce que chaque option coûte en Empreinte : un récit qui tient, 0 ; un faux document montré, +1 ; une arme trouvée dans le sac, arrestation judiciaire de 24 heures et +1 ; frapper un policier, +2 et la chasse à l'homme, c'est la fin du pli ; tirer, +2 et +1 par blessé grave ou mort, et l'Empreinte peut atteindre 10.",
      enemies: [ennemi("policier-de-quartier", 2)],
      difficulty: "Facile (150 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
  ],
  twists: [
    "Ostrevent est arrivé avant les coursiers sans qu'Aldenhove l'ait prévenu. Meyssonnier ne sait pas qui l'a envoyé ; Tournemine l'a, lui. La séance 1 ne répond pas : une Écoute de la Boîte pourra, plus tard, faire entendre qu'un message a été lu avant son destinataire.",
    "Le pli n° 4271 vient de la Boîte, pas d'une décision de Suzanne. Le Cabinet fait nettoyer ce qu'Aldenhove a gardé avant le Rachat. Il ignore que la lettre de 2019 existe encore, et veut le coffret détruit à la Mercerie.",
    "La clé ouvre un coffre dont le nom de la banque n'est écrit nulle part. Aldenhove ne sait pas non plus ce qu'elle ouvre. La retrouver ailleurs, sur un relevé ou dans un courrier, est le travail d'un autre pli.",
    "Judith Aldebert n'a aucun pouvoir, mais elle a une facture au nom d'une couverture qu'un coursier n'a utilisée qu'une fois. Si un coursier a déjà servi sa couverture pour la voiture de location ou l'hôtel, elle le sait.",
  ],
  rewards: [
    "Le budget de 1 500 € couvre les frais. La prime est de 300 à 1 500 € par mission réussie, selon l'état du coffret, versée sur la carte rechargeable de la couverture. Les dépenses sur facture sont remboursées, quand la Caisse rembourse.",
    "Un contact par ville : Gérard Aldenhove à Ixelles, s'il a eu confiance, et la clé de la cave qui ne lui sert plus.",
    "Une trace du travail de Judith Aldebert : une carte de la Section avec un numéro. Elle vaut une alliée ou une dette, au choix du groupe.",
    "Le coffret : trois cents pages de photocopies et une clé de coffre. Il ne vaut rien tant que personne ne sait quelle banque ouvre la clé.",
    "Tout le groupe passe au niveau 2 à l'aube de vendredi, quel que soit le sort du coffret.",
  ],
  gmNotes: `Avertissement de contenu. La séance contient la menace d'un vieil homme dans sa maison, des hommes armés dans un escalier, des armes à feu possibles et un décès annoncé en séance 3 (hors champ, un accident à Ixelles). À dire avant la séance, avec une porte de sortie pour chacun. La violence, si elle vient, est lourde et brève : le pli dit aucune violence, et la police n'est pas un ennemi par défaut.

À faire sentir sans le dire : un vieil homme qui ne veut plus du coffret qu'il garde, trois équipes devant une porte, et un pli que personne n'a lu jusqu'au bout. Laisse Aldenhove répondre avant le groupe.

La chronologie, minute par minute (à garder sous les yeux).
3 h 10 : Aldenhove appelle la ligne du fond de la Mercerie ; Suzanne ne décroche pas. 5 h 52 : le pli arrive par la Boîte. 6 h 05 : le pli à la Mercerie. 7 h 12 : le train à Paris-Nord. 8 h 20 : la camionnette grise se gare à cinquante mètres. 8 h 30 : Bruxelles-Midi. 9 h 10 : la rue d'Ixelles. 9 h 30 : Aldenhove ouvre. 10 h 15 : Meyssonnier rejoint la camionnette à pied. 10 h 40 : la berline noire se gare derrière. 11 h 05 : la concierge frappe. 11 h 30 : les hommes d'Ostrevent montent ; cinq minutes pour sortir. 12 h 45 : Judith Aldebert signale un attroupement si on lui a fermé la porte. 13 h : la police belge arrive (elle ne concerne que ceux qui restent ou reviennent). Vers 22 h 30 : dernier train de Bruxelles-Midi, arrivée à Paris. Vendredi 6 h : le coffret doit être à la Mercerie.

Le téléphone du bureau du fond sonne toutes les 12 minutes depuis 7 h : c'est le Cabinet qui vérifie, par une ligne ouverte du Service, que quelqu'un occupe l'agence. Décrocher, c'est annoncer qu'on y est (Empreinte +1). Aldenhove a appelé la ligne du fond de la Mercerie à 3 h 10 ; Suzanne n'a pas décroché.

L'Empreinte, tenue par le MJ. Elle part à 2. Elle passe à 3 dès le premier acte risqué : une couverture servie pour la voiture de location, un faux document montré à un policier, un coup de feu. Au franchissement de 3, tu gagnes une Écoute (une par seuil, quatre au plus) : un témoin parle à l'inspectrice, un voisin se souvient d'une plaque, ou le chauffeur prévient Ostrevent. Le joueur peut l'annuler en prenant 1 d'Empreinte, sans franchir de seuil nouveau. Plafond de la règle : l'Empreinte ne baisse jamais de plus de 3 par mission. À 5, la Section et Ostrevent ont un nom ; à 7, une couverture est reliée à un vrai nom ; à 10, un mandat et un témoin : la Cellule doit disparaître. À cette séance, rien ne devrait dépasser 5. Les coûts de chaque option sont écrits dans les rencontres et les choix.

Les couvertures. Chaque coursier a une couverture, une seule : un nom, des papiers, une carte rechargeable. La servir pour un acte risqué fait monter l'Empreinte de 1 (voiture de location, hôtel, compte). La brûler à temps la fait baisser de 2 ; une couverture neuve coûte 800 € et dix jours à la Traitante. Le billet de train est au nom de la couverture et ne compte pas comme acte risqué ; la carte tricolore de la Section, si.

La Caisse. Rien à payer plus de 1 000 € d'un coup en espèces (Empreinte +1). Une arme au marché noir coûte 1 500 à 3 000 € sur la solde du coursier, que la Caisse ne rembourse pas, et Suzanne ne signe aucune dépense de ce genre. Les armes sont un problème, pas un attribut. Un pistolet de plus, c'est une fouille de plus.

Les armes et la règle du mourant. Pistolet semi-automatique de 9 mm : 1d10, 15/45 m, quinze coups, changer de chargeur en action bonus. Matraque télescopique : 1d4. Une créature réduite à 0 PV par une arme à feu est mourante : elle meurt à la fin de son troisième tour sans soins, sans jet contre la mort ; la stabiliser demande une action et Médecine DD 12 (DD 15 sous le feu). Un coup de feu : Empreinte +2 par scène où l'on tire, +1 par blessé grave ou mort. Un mort est une enquête de plusieurs mois. Dis-le à la table avant le premier jet d'attaque.

Les secrets du MJ (à ne jamais dire aux joueurs). Le pli n° 4271 vient de la Boîte, et la Boîte est lue par le Cabinet : le Cabinet veut le coffret détruit à la Mercerie parce qu'il ne sait pas que la lettre de 2019 existe encore. La lettre (à ne donner que sur Intuition DD 13 ou une promesse) porte la date du 28 mars 2019 ; elle n'a aucun sens aujourd'hui, et le MJ ne lit pas la date si les joueurs ne la demandent pas. Si on la demande, donne-la : c'est un premier indice, rien de plus. Ne prononce jamais les mots qui appartiennent aux niveaux supérieurs : ils reviendront plus tard, dans la campagne. Rien dans cette séance ne doit faire penser à une dissolution, à un contrat de conservation ou à une collection.

La jauge de campagne (la Collection, départ à 12). Mission menée à bien selon le pli (coffret remis à la Mercerie) : +4. Mission menée à moitié : +2. Données sur une tierce personne remises à la Boîte (photos de Judith Aldebert, par exemple) : +3, une fois par séance. Coffret gardé hors de la Boîte : −6. Preuve remise à un organe extérieur (la Section, la presse) : −10. Ne dis jamais le nom de la jauge aux joueurs.

L'équilibre. Trois rencontres pour quatre personnages de niveau 1 : la camionnette grise (200 PX ajustés, moyenne), les deux gardes de l'escalier (300, difficile), le contrôle de 13 h (150, facile). Si le groupe combat l'homme de main et les deux gardes en même temps, l'ensemble vaut 800 PX ajustés : mortelle. Meyssonnier lui-même (FP 4, 1 100 PX) ne se combat pas : il se retire. Aldebert (inspectrice de la Section) n'est jamais un ennemi par défaut : si on la frappe, la Section a un dossier, un témoin et une raison. Chaque rencontre a un enjeu qui dépasse le combat et une sortie sans combat, avec son prix en Empreinte.

Qui emporte le coffret ? Le scénario tient dans tous les cas. Remis à Suzanne : le pli est propre, la Boîte reçoit les pièces, Aldenhove est soupçonné de ne plus servir à rien. Si le coffret passe par la Boîte, le Cabinet s'occupe d'Aldenhove : accident à Ixelles, séance 3. Remis à Aldebert : le groupe trahit la Cellule, la Section a sa première pièce, Suzanne l'apprendra avant la fin de la semaine. Confié à Meyssonnier : Tournemine paie bien, et le groupe travaille pour un concurrent. Transmis à Palimpseste (boîte de dépôt anonyme du site, scans envoyés depuis un café, personne ne vient dans la rue) : Palimpseste publie les noms lisibles, et les trois cents pages peuvent détruire des gens qui n'y sont pour rien. Gardé : la clé ne ferme rien tant qu'on ne trouve pas la banque, et chacun le sait.

Au micro. Une maison qui sent le papier et le thé, un téléphone qui sonne dans une pièce où personne n'entre, le pas de quelqu'un dans l'escalier. Aldenhove parle bas, poliment, dans trois langues. Meyssonnier dit presque rien. Aldebert compte sur ses doigts.

Environ trois heures et demie. Si la soirée file, saute l'acte 3 : Aldebert attend déjà à la sortie, et les coursiers choisissent leur issue en descendant l'escalier.`,
  readAloud: [
    {
      act: 1,
      title: "Le pli",
      text: "Six heures cinq. Une boutique de tissus, rideau baissé : des rouleaux de coton imprimé, des boutons dans des boîtes de biscuits, une machine à coudre dans la vitrine. Au fond, une table de coupe et une cafetière qui finit de passer. Suzanne Mercadier pose devant vous un papier gris plié en trois. Vous avez le temps de lire une fois. Quatre lignes : un objectif, un délai, une interdiction, un budget. Elle le reprend avant que vous ayez fini. « Il a appelé la ligne du fond. Bon. Vous avez compris ? »",
    },
    {
      act: 2,
      title: "L'agence",
      text: "Une maison de maître en brique noircie, une plaque de cuivre à la porte : « Aldenhove & Fils, traductions jurées ». Un escalier à rampe de bois. À l'intérieur, des dictionnaires jusqu'au plafond et des rames de papier. Au fond, un bureau où personne ne s'assied, et un téléphone fixe qui sonne, à intervalles réguliers. Un vieil homme en cardigan vous ouvre, regarde derrière vous, puis vous : « Entrez. Come in. Kom binnen. Vous voulez du thé ? Tea ? » Il ne lève pas les yeux vers le téléphone.",
    },
    {
      act: 2,
      title: "La lettre (si Aldenhove la sort)",
      text: "Une feuille pliée en quatre, tirée du double fond d'un tiroir. Du papier gris, un tampon, une signature illisible, une seule phrase tapée à la machine : « Nous mettons fin au contrat de prestation de l'agence. » Aldenhove regarde le mur. « Je veux dire… c'est tout ce que j'ai. I have nothing else. Meer heb ik niet. »",
    },
    {
      act: 3,
      title: "Dix heures quinze",
      text: "Un homme à la barbe courte et grise remonte la rue, un gobelet de café à la main. Il monte à l'arrière d'une camionnette grise, sans plaque de société, garée là depuis ce matin. Au deuxième étage de la maison d'en face, un rideau se soulève, retombe. Une silhouette tient un carnet. Vous avez le coffret sous le bras, ou vous l'aurez dans dix minutes.",
    },
    {
      act: 3,
      title: "Dix heures quarante",
      text: "Une berline noire s'arrête derrière la camionnette. Le moteur ne s'éteint pas. À travers le pare-brise, une femme en costume sombre, les cheveux attachés, une serviette lourde sur le siège passager, ne regarde pas la maison. Elle regarde la porte. Elle attend.",
    },
    {
      act: 4,
      title: "Onze heures trente",
      text: "Une portière claque. Deux hommes en blouson sombre traversent le trottoir sans courir. La porte d'entrée s'ouvre. La concierge tient la clé et ne regarde personne. Aldenhove est debout dans le bureau du fond, une tasse à la main. Il ne dit rien. Il regarde la porte du couloir, puis vous.",
    },
    {
      act: 5,
      title: "Vendredi, cinq heures quarante",
      text: "Le boulevard de Magenta est vide, sauf un livreur qui descend d'un vélo. Au fond, une lumière dans une boutique de tissus. Si Meyssonnier a laissé son numéro, vous avez dans la poche un papier que vous n'avez pas senti glisser.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "La préparation",
      options: [
        { label: "Le strict nécessaire : kit de crochetage, gilet de chantier, téléphone jetable", consequence: "Tout est déjà dans le placard, rien à acheter, aucun acte risqué. Le gilet et la casquette donnent l'avantage au premier test de Tromperie pour entrer. Le kit ouvre la cave (Escamotage DD 12). Vous êtes légers, et vous le serez aussi devant les hommes d'Ostrevent : Empreinte inchangée à 2." },
        { label: "Louer une voiture à Bruxelles-Midi sous couverture", consequence: "Vous gagnez une sortie rapide et une cache pour le coffret, mais une location sous couverture est un acte risqué : l'Empreinte passe de 2 à 3, et vous gagnez une Écoute de terrain pour le MJ. Si la voiture est mal garée, c'est celle dont se plaint la concierge à 11 h 05." },
        { label: "Chercher une arme au marché noir", consequence: "Impossible en une demi-heure sans contact (l'origine Ancien parachutiste en fournit un). 1 500 à 3 000 € sur votre solde, que la Caisse ne rembourse pas. Un contrôle sur le quai de Bruxelles-Midi qui la trouve, c'est une arrestation. Chaque coup de feu : Empreinte +2, plus 1 par blessé grave ou mort." },
        { label: "Observer la rue pendant les vingt minutes d'avance", consequence: "Perception DD 12 repère la camionnette grise, garée depuis 8 h 20. Vous avez vingt minutes pour décider de la sortie avant que Meyssonnier la rejoigne. Mais si les coursiers sont vus plus de dix minutes devant la maison, le voisin du deuxième appelle ; s'il parle à un policier, l'Empreinte monte de 1." },
      ],
    },
    {
      act: 2,
      title: "La lettre",
      options: [
        { label: "Lui garantir qu'il ne sera pas inquiété", consequence: "Il sort la lettre et vous donne la clé de la cave. Celui qui a promis a engagé sa parole : si le coffret passe par la Boîte et qu'Aldenhove est touché, le joueur qui a promis perd le droit de dire qu'il ne savait pas. Pas de jet, pas d'Empreinte." },
        { label: "Gagner sa confiance en parlant (Intuition DD 13)", consequence: "Il sort la lettre au bout de la deuxième tasse de thé. La rencontre dure vingt minutes de plus : Meyssonnier rejoint la camionnette à 10 h 15 et vous êtes encore dans la maison. Un échec le fait se fermer et vous perdez la lettre." },
        { label: "Prendre le coffret et partir sans la lettre", consequence: "Vous gagnez du temps et vous sortez avant que Meyssonnier ne monte à la camionnette. Mais Aldenhove ne vous dira plus rien, la lettre reste dans son tiroir, et le prochain à venir la trouvera. La clé de la cave vous est refusée." },
        { label: "Fouiller le bureau en son absence (Escamotage DD 13)", consequence: "Vous trouvez le double fond. Vous aurez la lettre, mais Aldenhove saura que vous avez fouillé, et il le dit à la concierge. Si le test échoue de 5 ou plus, l'agence note votre passage : Empreinte +1." },
      ],
    },
    {
      act: 3,
      title: "Judith Aldebert",
      options: [
        { label: "Accepter son rendez-vous", consequence: "Elle note vos visages et vous donne une carte avec un numéro : un rendez-vous à Paris samedi, un café, une liste de questions. Vous êtes photographiés nettement, Empreinte +1. Vous avez un contact à la Section, et Suzanne l'apprendra. Ce que vous direz ensuite comptera." },
        { label: "Refuser poliment, sans mentir (Persuasion DD 14)", consequence: "Réussi : elle ne vous photographie pas et vous laisse partir en notant la plaque d'un taxi. Raté : elle photographie, et vous le dit. Elle ne peut rien exiger. Elle rappellera samedi à 9 h et notera ce que vous lui avez répondu aujourd'hui." },
        { label: "Lui mentir (Tromperie DD 15)", consequence: "Elle a déjà posé ses questions numérotées : désavantage au jet si vous avez répondu à l'une d'elles. Un échec de 5 ou plus laisse une trace : l'Empreinte monte de 1. Réussi, elle croit à un client de l'agence et vous suit à distance." },
        { label: "L'ignorer et sortir par une autre issue", consequence: "Elle ne bouge pas : c'est vous qui perdez la matinée. À 12 h 45, elle signale sans se nommer un attroupement devant la maison : un contrôle à 13 h, et vous devez déjà être sortis." },
      ],
    },
    {
      act: 4,
      title: "La sortie",
      options: [
        { label: "Par l'escalier", consequence: "Discrétion DD 12 au moment où les deux gardes sont à l'étage. Aucune Empreinte si vous passez. Sur un échec, ils vous croisent sur le palier et la scène bascule : voir « Les deux gardes de l'escalier »." },
        { label: "Par la cour de service", consequence: "Athlétisme DD 13 pour franchir le mur du fond. Un échec coûte 1d6 dégâts contondants et le bruit réveille l'immeuble ; le voisin note. La voiture, si vous en avez une, est de l'autre côté." },
        { label: "Par la cave", consequence: "Elle donne sur la rue d'à côté, sans caméra. La porte est fermée : Escamotage DD 12 avec le kit, ou la clé d'Aldenhove. Compte trente secondes de plus à la table. C'est le seul chemin qui ne laisse rien derrière vous, sauf Aldenhove, qui reste en haut." },
        { label: "Rester, attendre la police et parler", consequence: "Persuasion DD 12 avec un récit propre. Vous perdez le coffret si vous ne l'avez pas caché, et l'Empreinte monte de 1 si vous donnez un faux document. Si les coursiers partent avec le coffret, Aldenhove le dit aux policiers, ce qui protège les coursiers et le condamne ; s'ils partent sans, Meyssonnier le lui prend." },
      ],
    },
    {
      act: 5,
      title: "Le coffret",
      options: [
        { label: "Le remettre à Suzanne", consequence: "Le pli est propre. La Caisse paie, et la Boîte reçoit les pièces. Si le coffret passe par la Boîte, le Cabinet s'occupe d'Aldenhove : accident à Ixelles, séance 3. Suzanne ne dit rien de ce qu'elle sait." },
        { label: "Le donner à Judith Aldebert", consequence: "Vous trahissez la Cellule. La Section a sa première pièce, et Suzanne l'apprendra avant la fin de la semaine. Un témoin vivant et prêt à parler, c'est ce qu'elle voulait ; elle ne vous protégera pas pour autant." },
        { label: "Le confier à Meyssonnier", consequence: "Tournemine paie bien. Le groupe travaille pour un concurrent, et Meyssonnier n'oublie pas un visage. Vous êtes riches d'un coup et seuls devant la Cellule." },
        { label: "Le transmettre à Palimpseste", consequence: "Le site de Palimpseste a une boîte de dépôt anonyme : vous envoyez des scans depuis n'importe quel café, personne ne vient dans la rue. Palimpseste publie les noms lisibles. Ceux qu'ils citent le lisent dans le journal avant d'avoir été prévenus. La Cellule le saura par la presse avant de le savoir par vous." },
        { label: "Garder le coffret et chercher la banque", consequence: "La clé ne ferme rien tant qu'on ne connaît pas la banque, et chacun sait que vous l'avez. Suzanne attend jusqu'à 6 h, puis consigne le pli raté dans la Boîte ; pas de prime. L'Empreinte de la Cellule monte avec chaque jour." },
      ],
    },
  ],
  mapHint: {
    kind: "village",
    seed: 4271,
    name: "La rue de la Brasserie, Ixelles",
    width: 40,
    height: 30,
    labels: ["L'agence Aldenhove", "La rue de la Brasserie"],
  },
};
