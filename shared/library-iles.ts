// Bibliothèque des Îles du Vent (pirates, Antilles, 1716) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
// Les ennemis viennent du bestiaire du monde (shared/iles-bestiaire.ts) : PV, CA et attaque ne se recopient pas à la main.
import { BESTIARY, toEncounterEnemy } from "./bestiary";
import type { Encounter, Scenario } from "./types";

/** Une ligne d'ennemi tirée de la fiche du bestiaire, pour un groupe de niveau 1. */
function ennemi(creatureId: string, count: number): Encounter["enemies"][number] {
  const fiche = BESTIARY.find((c) => c.id === creatureId && c.genre === "pirates");
  if (!fiche) throw new Error(`Créature inconnue du bestiaire des Îles du Vent : ${creatureId}`);
  return { ...toEncounterEnemy(fiche, count, 1), creatureId };
}

/** Campagne « Les Îles du Vent », scénario 1 : ouverture, niveaux 1 et 2. */
export const LA_BARRE_NOIRE: Scenario = {
  id: "bib-pi-barre-noire",
  title: "La barre noire",
  genre: "pirates",
  ton: "epique",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Printemps 1716, l'Anse-aux-Lames. Le capitaine Isidore Le Goff, patron du sloop Pie-Noire, tient table au Grand Hunier et paie une piastre d'avance à qui signe sa chasse-partie pour une course en Floride. Il ajoute qu'une barre d'argent remontée la semaine dernière se vend ce soir à minuit, et qu'il aimerait que des gens de confiance restent dans la salle jusqu'à l'aube. « Je ne demande pas d'où vous venez. Je demande si vous savez compter, et si vous savez fermer la bouche, pas vrai ? »",
  synopsis:
    "Le Grand Hunier, au soleil couchant. Le Goff veut quarante hommes avant l'aube : il n'en a que vingt-deux. Il met aux enchères une barre d'argent noire de coquillages, remontée par Nanon, affranchie qui plonge à la part pour lui. Trois acheteurs : Bras-de-Fer, qui offre le plus et menace les autres ; Mr. Truscott, qui offre en livres anglaises et sourit ; maître Duclos-Varenne, négociant de Saint-Pierre, qui parle poli et n'a l'air de rien. L'enchère se tient à minuit. Pendant les offres, Nanon prend un personnage à part : la barre n'était pas seule. Il y a une caisse entière sous l'épave d'un petit navire, et elle seule sait où ; sur le dessous du couvercle, une petite croix peinte en rouge. Le Goff veut garder le secret et l'emmener ; elle veut sa part, et par-dessus tout sortir son frère du camp espagnol. Ce que personne ne dit : Le Goff doit de l'argent à Duclos-Varenne, qui bat les autres à l'enchère avec cette dette ; Nanon a déjà vendu à Truscott un cap et une demi-journée de mer ; Duclos-Varenne agit pour le compte de Vaucelles. Vers une heure, les hommes de Bras-de-Fer tentent de voler la barre au Grand Hunier. À l'aube, la Pie-Noire appareille, et il faut décider si l'on signe, qui l'on a aidé, et ce qu'on emporte de la nuit.",
  acts: [
    {
      title: "Le Grand Hunier, au soleil couchant",
      location: "La taverne du Grand Hunier et le quai de l'Anse-aux-Lames",
      summary:
        "Le jour tombe sur la baie, vingt navires à l'ancre. Un brigantin vient de rentrer en tirant son coup de canon, et le quai court vers lui. Le Goff, quarante-cinq ans, a pris la grande table du fond. Une chasse-partie graissée est ouverte devant lui, un encrier, une bourse de piastres : il note les noms, paie la piastre d'avance, finit chaque phrase par « pas vrai ? ». Il parle un français de Saint-Malo. Autour de la salle : Bras-de-Fer (Nicolas Faucheux, un crochet de fer, il parle en comptant, trois mots à la fois) debout contre un pilier, deux de ses hommes derrière lui ; Mr. Truscott, assis seul, qui commande du vin et sourit à tout le monde ; maître Duclos-Varenne, en habit propre de Saint-Pierre, qui ne mange pas. Nanon, trente ans, tient la porte de la cuisine et compte les gens du regard avant de leur répondre. La barre est dans un coffre fermé à deux clefs derrière Le Goff ; il la montre une fois, à qui veut, sur un linge : un bloc d'argent noir de coquillages, gros comme un pain, qui pèse comme deux. Sur le quai, devant la porte, quatorze captifs de la sucrerie déchargent une barge de barriques, enchaînés deux à deux, sous un commis et deux gardes armés. Un garçon d'une douzaine d'années tombe devant la taverne avec son baril. Le commis le relève au manche du fouet. Le quai regarde son pot. Nanon, sur le seuil de la cuisine, ne bouge pas (voir le choix « La barge »). Les personnages se présentent, ne signent pas encore : ils jouent avec la Chance, pas avec le Moral. Le Moral de la Pie-Noire est à 5 à l'aube et se compte à partir de là ; ceux qui voient le groupe tenir la porte pèsent sur le vote de l'aube (+1 au Moral si personne n'est tombé). Le premier coup de main se dépense après la signature. Chacun choisit à qui parler avant minuit. Perception DD 13 pour voir que Nanon n'est pas à l'aise ; Intuition DD 13 pour voir que Le Goff regarde Duclos-Varenne plus souvent qu'un vendeur ne regarde un acheteur. Une heure et demie ici ; ne coupe pas les présentations.",
    },
    {
      title: "L'enchère de minuit",
      location: "La grande salle du Grand Hunier, sous les lanternes",
      summary:
        "Minuit. Le crieur, un vieux matelot du Grand Hunier, lève la barre sur son linge ; la salle se tait. Mise à prix : cent piastres. Bras-de-Fer ouvre à « Cent vingt piastres. », un coup de crochet sur la table, puis « Cent quarante. », et monte par paliers de vingt en comptant tout haut. Truscott monte en livres sterling, converties à voix haute, avec un sourire poli ; il lâche à trois cents sans que cela paraisse le gêner (Intuition DD 13 : il regarde Nanon plus que la barre). Le Goff, entre deux offres : « On signe, pas vrai ? » Duclos-Varenne reprend la dernière phrase de chacun et surenchérit par billets sur Saint-Pierre ; Le Goff accepte ses billets. À trois cent quarante, Bras-de-Fer pose la main sur son pistolet, bien en vue ; à trois cent soixante, Duclos-Varenne emporte la barre. La salle bouge. La barre retourne dans le coffre, à deux clefs, dans l'arrière-salle : Duclos-Varenne la fera prendre à l'aube par son commis. Pendant les offres ou juste après, Nanon prend un personnage à part, dans la cuisine, la voix très basse : « Il y a une caisse. Une caisse entière, sous l'épave d'un petit navire, à une demi-journée de mer. Moi seule connais la place exacte. Le Goff veut me l'enlever. » Elle dit que le dessous du couvercle porte une petite croix peinte en rouge, et ne dit pas pourquoi. Elle demande de la discrétion, et sa part. Si on lui parle de Truscott, elle ne répond pas (Intuition DD 14 : elle a peur de lui, pas de Le Goff). Sinon, la nuit file. Une heure ici.",
    },
    {
      title: "Une heure : le vol",
      location: "L'arrière-salle du Grand Hunier, la cuisine et le quai derrière la taverne",
      summary:
        "Une heure du matin. La salle est presque vide. Quatre hommes de Bras-de-Fer entrent par la porte de la cuisine, après avoir fait taire le chien de la cuisine avec un os trempé de tafia : un flibustier du Vengeance-de-Rouen, qui sait ce qu'il vient prendre, et trois matelots de pont engagés pour la nuit, qui savent seulement qu'ils auront une piastre chacun. Ils veulent le coffre. Le Goff dort à demi sur sa table, ou fait semblant ; Nanon veille dans la cuisine et les voleurs la trouveront devant eux. Un personnage qui veille près de la cuisine les entend venir (Perception DD 13) et gagne un round ; sinon, on n'entend que le coffre qu'on traîne. Combat dans l'arrière-salle, tables renversées, lanternes à la chaîne : une lanterne qui tombe met le feu à la toile de la cloison, et le Grand Hunier est couvert de palmes ; éteindre le feu coûte un effort du groupe, pas un point de Moral, puisque l'équipage n'est pas encore le leur. S'ils volent la barre, ils fuient par le quai : l'un d'eux, pressé, laisse tomber le sac à l'eau, sous les marches de pierre, où deux barracudas suivent les abats de la cuisine. Un nageur doit aller chercher la barre à trois brasses, ou la laisser à la baie. Lis seulement la première phrase du texte à lire si personne ne veille ; sinon lis tout. Une demi-heure ici, plus le quai.",
    },
    {
      title: "L'aube : la Pie-Noire appareille",
      location: "Le quai de l'Anse-aux-Lames, puis le pont de la Pie-Noire",
      summary:
        "Gris sur la baie, la marée qui monte. Le Goff, un linge noué sur le front, fait lire la chasse-partie à voix haute par le quartier-maître, article par article ; à chaque article, l'équipage dit oui. Les personnages signent, ou non. Le Moral de la Pie-Noire est à 5 et se compte à partir de là : +1 si personne n'est tombé dans la nuit (ceux qui ont vu le groupe tenir la porte pèsent sur le vote), +1 si le partage de la nuit (la piastre d'avance, la part promise, ce qui est dû à Nanon) est fait devant tout l'équipage ; −2 si l'équipage apprend que Le Goff lui a menti. Sur le quai, Duclos-Varenne, qui n'a pas dormi, réclame sa barre (ou ce qu'il en reste) et laisse entendre qu'il connaît le montant de la dette de Le Goff. Truscott a quitté sa chambre avant l'aube sans payer : un canot l'attendait au fond de la baie, cap au sud-ouest. Bras-de-Fer, s'il a été humilié, regarde la Pie-Noire sortir de la baie et ne dit rien. La Pie-Noire sort entre les deux caps. Nanon est à bord ou sur le quai, selon ce qu'on lui a promis. Un quart d'heure ici, puis le récit de l'appareillage.",
    },
  ],
  villain: {
    name: "Nicolas Faucheux, dit Bras-de-Fer, capitaine du brigantin Vengeance-de-Rouen",
    motivation:
      "avoir la barre d'argent et ce qu'elle annonce : il a compris qu'une barre aussi propre vient d'une épave que personne n'a encore vidée, et il veut le plus gros coup de l'histoire. Il perd l'enchère, il envoie ses hommes la reprendre dans la nuit, et il garde la chasse-partie à la lettre : il ne tuera pas, il ne volera pas un équipage entier, il volera un coffre",
    description:
      "Quarante ans, grand, large, une main de fer à la place de la gauche perdue à Carthagène, une veste rouge usée. Il parle en comptant, trois mots à la fois, et un coup de crochet sur la table entre deux. Il ne paraît pas dans le combat : il regarde, debout, et l'on pense qu'il compte les coups. On ne le combat pas dans ce scénario (fiche de FP 8). Il respecte la chasse-partie, et c'est ce qui le tient.",
  },
  npcs: [
    {
      name: "Isidore Le Goff",
      role: "Patron du sloop Pie-Noire, quarante-cinq ans",
      secret:
        "Il veut un équipage avant l'aube, et il doit de l'argent à Duclos-Varenne : l'enchère ne lui rapporte rien de plus que l'effacement de sa dette. Il ne veut pas qu'on le sache, ni que l'équipage apprenne que la barre est déjà perdue pour lui. Il sait qu'il y a une caisse et veut l'emmener sans donner à Nanon la part qu'elle réclame.",
      voice: "Un français de Saint-Malo, des phrases longues qui se finissent toutes par « pas vrai ? ». Compte ses hommes à voix basse.",
    },
    {
      name: "Nanon",
      role: "Affranchie, plongeuse à la part pour Le Goff, trente ans",
      secret:
        "Elle veut sortir son frère, plongeur au camp espagnol des bancs de Floride : elle n'a pas besoin d'argent pour cela, elle a besoin d'un navire et de gens qui ne la trahissent pas. Elle a vendu à Truscott un cap et une demi-journée de mer, pas la place exacte : il lui a promis d'acheter son frère au camp espagnol. Elle ne le croit qu'à moitié, et elle a peur de ce qu'elle a fait. Elle ne sait pas ce que la croix peinte en rouge veut dire.",
      voice: "Parle bas. Compte les gens du regard avant de répondre. Ne jure jamais, et regarde la mer quand elle ment.",
    },
    {
      name: "Maître Duclos-Varenne",
      role: "Négociant de Saint-Pierre de la Martinique",
      secret:
        "Il veut la barre pour le compte de Vaucelles, qu'il ne nomme pas. Le Régent demande au lieutenant du roi pourquoi l'Espagne est si nerveuse depuis le naufrage, et Vaucelles veut une vraie barre de la Capitana à faire peser et essayer. Il ne dira rien de la dette de Le Goff tant qu'elle lui sert, et il règle l'enchère en billets sur Saint-Pierre, que Le Goff accepte parce qu'ils effacent sa dette.",
      voice: "Poli. Répète la dernière phrase de son interlocuteur avant de répondre, en la mettant presque à la forme d'une question.",
    },
    {
      name: "Mr. Truscott",
      role: "Agent de la Compagnie anglaise, venu de Kingston",
      secret:
        "Il n'a pas besoin de la barre. Il tient de Nanon un cap ; il lui faut quelqu'un qui connaisse les bancs pour trouver la place. Il enchérit pour que la salle le voie, et il regarde qui Nanon prend à part. Il sait qu'il y a une caisse, pas ce qu'elle porte. Il paiera en livres sterling n'importe quel personnage qui connaît la place, et il paiera sans sourire, pour une fois.",
      voice: "Un français lent, avec des « fort bien ». Convertit tous les prix à voix haute, en livres, en piastres, en livres tournois. Sourit avant de répondre.",
    },
    {
      name: "Nicolas Faucheux, dit Bras-de-Fer",
      role: "Capitaine du brigantin Vengeance-de-Rouen",
      secret:
        "Il porte sur lui une pièce qu'il prend pour un porte-bonheur et qu'il tourne dans sa poche quand il compte. Il s'est arrêté à trois cent quarante exprès : un capitaine qui paie trop cher devant son équipage perd sa part dans l'estime de ses hommes, alors il a envoyé quatre des siens. Un homme qui lui tient tête devant son équipage l'intéresse plus qu'un homme qui lui obéit.",
      voice: "Trois mots à la fois, et un coup de crochet sur la table. Compte tout, y compris les gens qui lui parlent.",
    },
  ],
  encounters: [
    {
      title: "Le vol au Grand Hunier (acte 3)",
      description:
        "Un flibustier du Vengeance-de-Rouen et trois matelots de pont, dans l'arrière-salle. Enjeu : la barre dans son coffre, mais aussi Nanon, qui veille dans la cuisine, et le Grand Hunier lui-même (une lanterne qui tombe met le feu à la cloison de toile et aux palmes). Le flibustier tire d'abord son pistolet chargé à l'avance, puis sort le sabre. Au premier tour, il ne fait qu'une attaque. Il saute à l'eau ou se rend sous la moitié de ses PV (« sa part »). Les matelots de pont lâchent leur poignard dès que le flibustier tombe, que l'un d'eux est neutralisé ou qu'on leur promet la vie sauve. Les armes à feu tirent un seul coup : recharger prend une action, compte-le. Sorties sans combat : voir venir les voleurs (Perception DD 13) et bloquer la porte avec la table ; payer les matelots de pont plus que Bras-de-Fer (2 piastres chacun) ; lire à voix haute devant la salle l'article 2 de la chasse-partie de la Pie-Noire, qui débarque sur un banc celui qui vole l'équipage (Persuasion DD 12) ; ou laisser Nanon leur dire qui est dans le coffre. Éteindre le feu avant qu'il ne prenne : Athlétisme DD 12 avec un seau.",
      enemies: [ennemi("flibustier-de-l-abordage", 1), ennemi("matelot-de-pont", 3)],
      difficulty: "Moyenne à difficile (260 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
    {
      title: "La barre sous les marches (acte 3)",
      description:
        "Seulement si le sac tombe à l'eau. Deux barracudas rôdent sous les marches de pierre du quai, attirés par les abats de la cuisine. Enjeu : repêcher la barre à trois brasses d'eau, et aider le voleur qui a plongé après le sac, saigné, à remonter. Les barracudas mordent ce qui brille (une bague, une dent de laiton, la lame d'un poignard) et ce qui saigne ; la barre, noire de coquillages, ne les intéresse pas. Banc de deux : avantage à l'attaque si l'un d'eux est à 1,5 m de la cible. Ils fuient si l'on frappe l'eau d'une rame ou si l'on jette un poisson mort à 9 m. Un plongeur de métier comme Nanon descend sans histoire (Athlétisme DD 10). Un troisième arrive si quelqu'un saigne dans l'eau (300 PX ajustés : difficile au niveau 1). Sortie sans combat : attendre l'étale et la marée basse, ou envoyer Nanon avec une corde. Le voleur qui se noie et qui parle, une fois sorti de l'eau, dit qui l'a payé.",
      enemies: [ennemi("barracuda", 2)],
      difficulty: "Facile à moyenne (150 PX ajustés pour quatre personnages de niveau 1) ; évitable",
    },
  ],
  twists: [
    "La barre de l'enchère n'est qu'un échantillon : la caisse entière est sous l'épave d'un petit navire, et Nanon est la seule à savoir où. Truscott a un cap, pas une place. Sous le couvercle, une petite croix peinte en rouge. Ce soir, personne ne sait ce qu'elle veut dire.",
    "Duclos-Varenne l'emporte parce que Le Goff accepte ses billets sur Saint-Pierre : la dette de Le Goff vaut plus que les piastres des autres. Le Goff vend à un créancier. Quand l'équipage l'apprend, le Moral baisse de 2.",
    "Bras-de-Fer n'a pas besoin de tuer. S'il perd la barre, il a un autre atout : il sait que Le Goff doit payer son équipage et qu'il ne le peut pas. Il laisse au groupe le choix de signer la chasse-partie de Le Goff, ou celle du Vengeance-de-Rouen.",
  ],
  rewards: [
    "Une piastre d'avance chacun, payée par Le Goff à la signature, et la part promise : une part de matelot.",
    "Une dette de Bras-de-Fer, si on lui a laissé la barre ou si on lui a tenu tête devant son équipage : il rend un service, une fois, sans en parler.",
    "La confiance de Nanon, si on ne l'a pas trahie. Elle conduit le groupe à la caisse, puis au camp des bancs où son frère plonge sous la garde des soldats. Le sortir du camp est une libération de plongeurs : la Paix des Îles baisse de 5 (une fois par séance au plus) et le gouverneur durcit le camp.",
    "Le sloop Pie-Noire, ses vingt-deux hommes et Le Goff pour capitaine : un navire, une chasse-partie et un Moral à 5. Si le groupe prend le commandement, le Moral repart à 6.",
    "Tout le groupe passe au niveau 2 à l'appareillage.",
  ],
  gmNotes: `À faire sentir sans le dire : les billets de Duclos-Varenne valent plus que les piastres des autres, parce que Le Goff est endetté, et la part de Nanon dépend de qui l'écoute ce soir. La caisse et sa petite croix peinte en rouge sont un indice que rien n'explique encore.

D'où vient la caisse (MJ seul, à ne pas dire aux joueurs). Selon la bible, les caisses marquées d'une croix ont été chargées à La Havane dans la cale de la Capitana, puis triées à part par les soldats du camp dans une chaloupe. Celle-ci est tombée de la chaloupe de tri pendant un grain, la semaine dernière, et gît sous les restes d'une pinasse de la Flotte, hors de la route de la Santa Clara, qui n'a pas pu la reprendre. Nanon l'a trouvée en remontant la barre voisine. Ne l'explique à personne : même Nanon croit que c'est une caisse comme les autres.

La chasse-partie de la Pie-Noire (quatre articles, à lire à voix haute au quatrième acte ; à chacun l'équipage dit oui).
1. Chaque homme a une voix. Le capitaine a deux parts, le matelot une, le quartier-maître une et demie.
2. Qui vole un camarade ou l'équipage est débarqué sur un banc, avec une gourde d'eau et un pistolet chargé d'une seule charge.
3. Le blessé touche sa part comme s'il avait combattu, et le membre perdu est payé avant le partage, selon le barème.
4. Une prise qui amène son pavillon ne perd que sa cargaison, et aucune personne ne se partage.

La croix rouge et la caisse. Le secret de la campagne (voir la bible, section 1) ne paraît pas du tout ce soir. Personne ne sait ce que veut dire la croix, pas même Nanon, pas même Truscott. Si un joueur demande, la bonne réponse est « on ne sait pas », et le soir passe. Ne dis jamais « c'est le faux » : le mot n'est pas prononcé avant les niveaux 5 et plus. La croix est un détail qui revient, rien de plus.

Les captifs. Les Îles de 1716 sont un monde d'esclavage : les captifs de la sucrerie déchargent la barge sur le quai, et le frère de Nanon est plongeur réduit en esclavage au camp espagnol. Si un joueur demande ce qu'ils valent, Le Goff hausse les épaules : ça se règle à la sucrerie, pas à sa table. Nanon détourne les yeux. Garde la scène sèche. Aucune part, aucun point de Moral ne s'y attache.

Le Moral. Avant la signature, il n'est pas à eux : ils jouent avec la Chance, pas avec le Moral. Le Moral de la Pie-Noire est à 5 à l'aube et se compte à partir de là ; ceux qui voient le groupe tenir la porte pèsent sur le vote de l'aube (+1 au Moral si personne n'est tombé). Ensuite : +1 si le partage de la nuit (la piastre d'avance, la part promise, ce qui est dû à Nanon) est compté à voix haute devant tout l'équipage ; −2 si l'équipage apprend que Le Goff lui a menti (la dette, la caisse). Un coup de main coûte 1 point de Moral, un seul par scène, et le premier se dépense après la signature : la scène du vol n'en offre pas. La Chance : un jeton à qui verse sa ration de tafia à la mer avant l'appareillage (coutume qui coûte).

L'équilibre. Deux rencontres : le vol (260 PX ajustés, un flibustier et trois matelots de pont) et les barracudas (150 PX ajustés), pour quatre personnages. Bras-de-Fer (FP 8), Truscott et Duclos-Varenne ne se combattent pas ce soir : si les joueurs tirent sur Bras-de-Fer, annonce-leur d'abord que c'est mortel et que son équipage est sur le quai. Deux armes à feu par personnage au plus ; chaque tir est un coup, puis une action pour recharger.

Qui emporte la barre ? Le scénario tient dans tous les cas. Si le groupe défend la barre, Duclos-Varenne la prend à l'aube et Le Goff efface sa dette sans un réal, donc Nanon n'a pas sa part. S'il laisse Bras-de-Fer la prendre contre un service ou une part, Le Goff perd la face devant son équipage. S'il la vend à Truscott, c'est un vol contre Duclos-Varenne, et Vaucelles l'apprend. S'il suit Nanon et la caisse, il trahit Le Goff qui paie, et le Moral baisse de 2 si l'équipage l'apprend.

Au micro. La baie la nuit, les lanternes qui grincent à leur chaîne, le rire du crieur, le crochet de Bras-de-Fer sur la table, trois coups, deux coups, un coup. Les voix baissent pour Nanon. Les autres parlent fort.

La Paix des Îles commence à 100 et ne bouge pas ce soir. Si Bras-de-Fer est humilié devant son équipage ou si le feu prend le Grand Hunier, c'est une rumeur de plus à l'Anse-aux-Lames, pas un seuil.

Environ trois heures et demie. Si la soirée file, saute la scène du quai : le voleur ne laisse pas tomber le sac, il s'enfuit par la cuisine, et le groupe décide de la poursuivre ou non.`,
  readAloud: [
    {
      act: 1,
      title: "Le Grand Hunier",
      text: "Le soleil tombe dans la baie, et vingt navires y tournent lentement sur leur ancre. Un brigantin vient de rentrer toutes voiles dehors, un coup de canon a roulé sur le quai, la foule court. Au Grand Hunier, il y a moins de bruit qu'on ne croirait. Au fond, un homme à la peau tannée a étalé sur la table un parchemin graissé, un encrier, une bourse de piastres, et il appelle les gens un par un par leur nom, ou par ce qu'ils lui en disent. « Une piastre d'avance, mes amis, et une part de matelot à la fin de la course. On signe ? Pas vrai ? »",
    },
    {
      act: 2,
      title: "L'enchère",
      text: "Minuit. Les lanternes balancent à leur chaîne. Le crieur lève sur un linge blanc un bloc d'argent noir de coquillages, gros comme un pain, et la salle ne dit plus rien. « Cent piastres. » Un homme en veste rouge usée, un crochet de fer à la place de la main gauche, lève deux doigts : « Cent vingt piastres. » Un coup de crochet sur la table. « Cent quarante. » Au fond, Le Goff se penche vers les premiers rangs : « On signe, pas vrai ? » Dans un coin, un Anglais sourit et convertit à voix basse. Derrière, un petit homme en habit propre reprend chaque offre en répétant la dernière phrase, tout bas, comme pour s'assurer qu'il l'a bien entendue.",
    },
    {
      act: 3,
      title: "Une heure",
      text: "Dans l'arrière-salle, une seule lanterne tient encore. Dehors, la mer clapote contre les pilotis, et dans la cuisine un chien a cessé d'aboyer. Une planche craque. Une autre. Quelqu'un a poussé la porte de la cuisine du plat de la main, doucement, comme on ouvre chez soi. Le coffre est derrière vous, fermé à deux clefs. Dans l'embrasure paraissent quatre ombres, et l'une d'elles tient un pistolet chargé à hauteur de poitrine.",
    },
    {
      act: 4,
      title: "L'appareillage",
      text: "L'aube arrive grise, et la marée monte. Sur le quai, devant le sloop noir, un quartier-maître lit un parchemin à voix haute, un article à la fois, et à chaque article quelques dizaines de voix répondent oui. La Pie-Noire grince sur ses amarres. Au bout du quai, un homme en habit propre vous regarde sans faire un geste. Plus loin, dans les palétuviers, un crochet de fer brille un instant, puis disparaît.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "La barge",
      options: [
        { label: "Donner de l'eau et un temps de repos", consequence: "Persuasion DD 12 : le commis cède pour un réal. Le garçon boit, la file attend. Nanon l'a vu." },
        { label: "S'interposer", consequence: "Intimidation DD 15 contre un commis et deux gardes armés. Si l'on frappe, plainte chez le lieutenant du roi, et Le Goff regrette de les avoir recrutés. Même en cas de réussite, les captifs repartent à la sucrerie : qui veut les libérer commence une autre histoire, celle des mornes et de Mère Abla." },
        { label: "Regarder son pot", consequence: "Le quai fait pareil. Nanon a vu qui a bougé, et elle ne parle à la cuisine qu'à ceux qui ont fait quelque chose." },
      ],
    },
    {
      act: 2,
      title: "La caisse de Nanon",
      options: [
        { label: "En parler à Le Goff", consequence: "Le Goff promet une part à Nanon, ou fait semblant. S'il ment et qu'on le sait, le Moral baisse de 2 à l'aube. Nanon se souviendra de qui l'a trahie." },
        { label: "Se taire et suivre Nanon", consequence: "Nanon vous ouvre la route de la caisse et du camp espagnol où se trouve son frère. Trahir Le Goff qui paie : sa part de la Pie-Noire se paie plus tard." },
        { label: "Dire à Truscott ce qu'on sait", consequence: "Truscott a un cap, pas une place : il paie en livres sterling et sourit. L'épave passe aux Anglais, et Nanon vous voit comme ceux qui l'ont vendue." },
      ],
    },
    {
      act: 3,
      title: "La barre",
      options: [
        { label: "La défendre pour Le Goff", consequence: "Duclos-Varenne la prend à l'aube. Le Goff a effacé sa dette sans un réal, donc Nanon n'a pas sa part. Bras-de-Fer note qui a tenu la porte." },
        { label: "La laisser à Bras-de-Fer contre un service", consequence: "Un protecteur qui n'oublie rien. Il rend le service une fois, au pire moment. Le Goff perd la face devant son équipage." },
        { label: "La vendre à Truscott", consequence: "C'est un vol contre Duclos-Varenne, donc Vaucelles l'apprend. Bras-de-Fer a perdu sa nuit, et Le Goff traite le groupe en voleurs." },
        { label: "Éviter le combat", consequence: "Le groupe paie les matelots, lit l'article 2 de la chasse-partie, bloque la porte. Le flibustier rentre sans la barre, et Bras-de-Fer cherche qui a été plus malin que lui." },
      ],
    },
    {
      act: 4,
      title: "La chasse-partie",
      options: [
        { label: "Signer la chasse-partie de Le Goff", consequence: "Une part de matelot et la Pie-Noire : le groupe a un navire et un Moral à 5. Si le groupe devient capitaine, le Moral repart à 6." },
        { label: "Signer avec Bras-de-Fer", consequence: "Le Vengeance-de-Rouen est le brigantin le plus craint de la Côte. Plus de part, plus de danger." },
        { label: "Ne signer avec personne", consequence: "Le groupe reste à terre avec ses piastres d'avance, une caisse en tête, et un frère à sortir du camp. Le sloop sort sans lui." },
      ],
    },
  ],
  mapHint: {
    kind: "village",
    seed: 1716,
    name: "Le Grand Hunier, à l'Anse-aux-Lames",
    width: 40,
    height: 30,
    labels: ["Le Grand Hunier", "Le quai de pierre", "La batterie"],
  },
};
