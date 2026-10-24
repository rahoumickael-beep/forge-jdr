// Bibliothèque du Champ-d'Asile (western, 1878) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « Le Champ-d'Asile », scénario 1 : ouverture, niveau 1. */
export const DILIGENCE_DE_FORT_RAIL: Scenario = {
  id: "bib-ws-diligence",
  title: "La diligence de Fort-Rail",
  genre: "western",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Printemps 1878. La diligence de Fort-Rail part pour Bonne-Espérance deux fois par semaine, un jour et demi de piste. Le vieux Bastide, son cocher, paie deux dollars par jour à qui sait tenir un fusil, parce que la Bande des Lys rôde sur la Fourche. « Je demande pas qui vous êtes. Je demande si vous tirez droit, et si vous savez quand ne pas tirer. »",
  synopsis:
    "La diligence quitte Fort-Rail un mardi à l'aube avec trois passagers : Elijah Moss, géomètre de la Southwestern & Pacific, et sa sacoche de cartes ; Clémence Roux, fille du vieux Roux du rancho Wagram, qui rentre chez elle ; Jean Sorbier, qui se dit marchand de bestiaux. Toinou Brassac, le garde de Bastide, renseigne la Bande des Lys pour vingt dollars. Vers quatre heures, au gué de la Fourche, un peuplier est couché en travers de la piste : Marguerite Lacoste, la Veuve, et ses cavaliers veulent la sacoche du géomètre, rien d'autre. Dedans : le tracé du rail, qui coupe le rancho Wagram en deux, et une liste de propriétaires « à convaincre », dont le vieux Roux. Sorbier est un chasseur de primes ; il a un mandat des Rangers contre la Veuve, mort ou vif, et il tirera. Le soir, à Bonne-Espérance, Hippolyte de Saint-Gilles, président de l'Assemblée, invite les voyageurs à dîner : il veut savoir ce qu'il y avait dans la sacoche. Ce qu'il ne dit pas : son propre rancho, Marengo, est sur le tracé, et il l'a déjà vendu.",
  acts: [
    {
      title: "Fort-Rail, à l'aube",
      location: "La gare de Fort-Rail et le relais de la diligence",
      summary:
        "Six heures du matin. Le train de nuit vient d'arriver ; la locomotive s'est arrêtée au bout des rails, à dix mètres de la borne de pierre gravée d'un aigle, d'une abeille et de 1820. Le relais de la diligence est une grange peinte en rouge. Le vieux Bastide attelle Ney et Murat, deux chevaux gris qu'il appelle par leur nom, et compte ses passagers. Elijah Moss arrive en costume trop neuf, la sacoche serrée contre la poitrine ; il dit « monsieur » à tout le monde. Clémence Roux monte sans attendre qu'on l'aide. Jean Sorbier s'assoit face à la porte et ne la quitte plus des yeux. Toinou Brassac, le garde de Bastide, va au saloon d'en face « chercher du tabac » et revient sans tabac (Perception DD 13 pour le remarquer). Un homme en costume gris, à la fenêtre de l'hôtel de la compagnie, regarde partir la diligence : c'est Thaddeus Crane. Une demi-heure ici ; ne t'attarde pas sur Brassac.",
    },
    {
      title: "Le gué de la Fourche",
      location: "La piste du Brazos, au gué de la Fourche, vers quatre heures",
      summary:
        "Une piste de terre rouge dans la prairie, des peupliers le long de la rivière. Au gué, un peuplier abattu barre la piste ; sur le tronc, une encoche fraîche à la hache, pas un trait de scie du rail. Bastide arrête la voiture. Trois cavaliers sortent des arbres, foulards sur le visage, une fleur de lys gravée sur la crosse des fusils ; une femme en voile de deuil s'avance au pas, seule : la Veuve. Elle parle bas, et elle remercie avant de demander : « La sacoche de monsieur Moss, et personne n'a mal. » Trois autres cavaliers restent sur la crête, fusils levés : si on tire, ils visent la voiture et les chevaux à 30 m, et ne descendent qu'au round 3. Sorbier, dans la voiture, sort son revolver. Les personnages ont quelques secondes pour décider : donner la sacoche, négocier (Persuasion DD 13 : elle prend les cartes et rend la liste, qu'elle juge sans valeur sans le tracé), se battre, ou empêcher Sorbier de tirer. Brassac, s'il est surveillé, lève les mains le premier. Cinquante minutes au gué.",
    },
    {
      title: "Après le gué",
      location: "La piste, l'après-midi, et un rancho isolé où l'on s'arrête",
      summary:
        "Quoi qu'il soit arrivé, il faut repartir : un cheval blessé, un mort peut-être, Moss qui tremble. La nuit tombe au rancho Austerlitz, où le vieux Gaspard Lenoir offre l'abri et la soupe : « On a entendu des coups de feu vers la Fourche. Racontez. » Là, Moss ne tient plus : il ouvre la sacoche à la lampe pour vérifier ses cartes, et Clémence lit la liste par-dessus son épaule : le tracé coupe le rancho Wagram en deux, et la liste « à convaincre » porte six noms, dont celui du vieux Roux. Clémence pâlit. Si la sacoche est partie avec la Veuve, Moss redessine le tracé de mémoire pour Clémence (Investigation DD 13 pour qu'il se rappelle la liste), et la Veuve fera porter la liste à Wagram dans la semaine, avec son reçu. Quand on lui parle de la sacoche, Lenoir dit seulement : « Les cartes, c'est rien. C'est les signatures qui comptent. » Si Sorbier a tiré sur la Veuve, il réclame sa part de témoins : il veut qu'on raconte qu'il l'a eue (ou ratée). Si Brassac a été démasqué, Bastide serre les dents et le garde sur le siège, sans fusil, parce qu'il ne peut pas payer un remplaçant ; si les personnages exigent qu'il parte, Bastide le laisse à Austerlitz. Quarante minutes, soupe comprise.",
    },
    {
      title: "Le dîner de Saint-Gilles",
      location: "La maison d'Hippolyte de Saint-Gilles, à Bonne-Espérance, le lendemain soir",
      summary:
        "Une grande maison à colonnes, un aigle de bronze sur la cheminée, une argenterie aux armes de l'Empire. Saint-Gilles, soixante-dix ans, canne à pommeau d'argent, reçoit les voyageurs avec une politesse de cour et cite l'Empereur de travers. Il veut savoir ce qu'il y avait dans la sacoche, qui l'a vue, et ce qu'ils comptent en dire. Il offre cinquante dollars à chacun pour « un service discret » : remettre la sacoche, si on l'a, à son notaire, et ne rien dire à l'Assemblée avant la séance de samedi ; si la sacoche est partie, il paie pour qu'on dise à l'Assemblée que le gué n'était qu'un vol ordinaire. Ce qu'il ne dit pas : son rancho Marengo est sur le tracé, et il l'a vendu au rail le mois dernier. Un personnage qui a vu la liste remarque que le nom de Saint-Gilles n'y est pas, alors que ses terres sont sur la carte (Investigation DD 12). Clémence Roux est là aussi, avec son père : le vieux Roux veut savoir s'il doit vendre. Prends ton temps ici : c'est la scène qui lance la campagne.",
    },
  ],
  villain: {
    name: "Thaddeus Crane, avocat de la Southwestern & Pacific",
    motivation:
      "faire passer le rail à travers le Champ ferme par ferme ; les cartes de Moss sont son plan d'achat, et si l'Assemblée les lit avant samedi, les ventes s'arrêtent. Il a fait voyager Moss par la diligence pour ne laisser aucune trace de la compagnie",
    description:
      "Quarante ans, grand, mince, costume gris, lunettes cerclées d'or. Il ne paraît pas dans ce scénario : on le voit seulement à la fenêtre de l'hôtel de la compagnie, à Fort-Rail, au départ de la diligence. Il parle un français appris dans les livres et appelle tout le monde « mon ami ». Il n'a jamais tiré sur personne ; il signe.",
  },
  npcs: [
    {
      name: "Marguerite Lacoste, la Veuve",
      role: "Cheffe de la Bande des Lys",
      secret:
        "Elle veut les cartes pour les montrer à l'Assemblée et prouver que le rail achète en douce. Sa bande compte moins de quinze personnes, et elle a peur à chaque attaque. Elle vient de Louisiane, d'où la fleur de lys ; son mari a été tué quand le rail a brûlé leur ferme, l'an dernier. Elle paie Toinou Brassac vingt dollars par voyage.",
      voice: "Ne parle jamais plus fort qu'un murmure. Laisse un reçu signé « Les Lys », payable « à la fin du rail ». Dit « merci » avant de demander.",
    },
    {
      name: "Jean Sorbier",
      role: "Chasseur de primes, se dit marchand de bestiaux",
      secret:
        "Il veut la prime de la Veuve : cinq cents dollars, morte ou vive, sur un mandat des Rangers cousu dans la doublure de son manteau. Il a besoin de témoins : sans récit, pas de Nom, et sans Nom, plus de contrats. Il tirera sur elle quoi qu'il arrive, sauf si on l'en empêche par la force ou par une meilleure affaire.",
      voice: "Parle bétail, poids et prix, même quand on lui parle d'autre chose. Ne quitte jamais la porte des yeux.",
    },
    {
      name: "Elijah Moss",
      role: "Géomètre de la Southwestern & Pacific",
      secret:
        "Il veut finir son tracé avant le 1er mai, sa prime en dépend. Il a honte de la liste « à convaincre » : il sait ce que « convaincre » veut dire à Fort-Rail. Si on le rassure, il raconte que Crane a déjà acheté des terres sur le tracé, sans dire à qui.",
      voice: "Dit « monsieur » à tout le monde, même à la Veuve. Serre sa sacoche quand il a peur, c'est-à-dire tout le temps.",
    },
    {
      name: "Clémence Roux",
      role: "Fille du vieux Roux, du rancho Wagram",
      secret:
        "Elle veut empêcher la vente de Wagram. Elle cache que son père a déjà reçu une offre du rail et qu'il hésite, parce qu'il est endetté. Si elle voit la liste, elle demandera aux personnages de l'aider à la montrer à l'Assemblée samedi.",
      voice: "Parle sec, en phrases courtes, et ne dit « monsieur » à personne. Monte à cheval mieux que tous les hommes de la voiture.",
    },
    {
      name: "Hippolyte de Saint-Gilles",
      role: "Président de l'Assemblée de Bonne-Espérance",
      secret:
        "Il veut que personne ne parle des cartes avant samedi : son rancho Marengo est sur le tracé, et il l'a vendu au rail le mois dernier, en secret, comme ses voisins le feront après lui. Il croit sincèrement que ses fils ne mangeront que s'il vend.",
      voice: "Cite l'Empereur, souvent de travers. Pose sa main sur le bras de celui à qui il parle, comme un vieil ami.",
    },
  ],
  encounters: [
    {
      title: "Le gué de la Fourche (acte 2)",
      description:
        "Seulement si quelqu'un tire. La Veuve et trois cavaliers au gué ; les trois de la crête tirent dès le round 1 à 30 m, mais seulement sur la voiture et les chevaux, et descendent au round 3. Toute la Bande recule dès que la Veuve passe sous 8 PV ou que deux cavaliers tombent : ils veulent la sacoche, pas des morts. Sorbier (CA 12, 13 PV, revolver +3, 1d8+1) tire une fois par tour sur la Veuve. La diligence donne un abri à trois quarts (+5 à la CA). Chaque tir coûte une cartouche ; compte-les. Sorbier tire sur la Veuve à son premier tour, quoi qu'on lui dise.",
      enemies: [
        { name: "Cavalier de la Bande des Lys", count: 6, hp: 9, ac: 12, attack: "Winchester +3, 1d8+1 perforants, portée 30/90 m", danger: "Faible" },
        { name: "Marguerite Lacoste, la Veuve", count: 1, hp: 16, ac: 13, attack: "Revolver +4, 1d8+2 perforants, portée 12/36 m (le second reste au ceinturon)", danger: "Moyen" },
      ],
      difficulty: "Difficile si on tire en premier ; évitable",
    },
  ],
  twists: [
    "Toinou Brassac, le second garde de Bastide, renseigne la Bande : il a dit à la Veuve qui voyageait et combien d'hommes gardaient la voiture. Démasqué, il supplie : il a une femme malade à Fort-Rail et vingt dollars, c'est un mois de remèdes.",
    "Saint-Gilles a déjà vendu son rancho au rail, en secret. Son nom manque à la liste « à convaincre » parce qu'il est déjà convaincu. C'est le premier fil de la campagne : l'Assemblée elle-même vend le Champ.",
    "Jean Sorbier a besoin d'un récit plus que d'un cadavre. Si les personnages lui promettent de raconter partout qu'il a chassé la Veuve du gué, il peut la laisser partir, et il dira à Fort-Rail qu'elle est blessée.",
  ],
  rewards: [
    "Deux dollars par jour et par personne, payés par Bastide, et cinq de plus chacun si personne n'est mort à bord.",
    "Le Nom : un coup d'éclat au gué devant témoins (Bastide, Moss, Clémence, la Bande) donne +1 à celui qui l'a fait, une seule fois dans la séance ; un coup d'éclat de groupe donne +1 à chacun. Si les personnages abattent la Veuve, Sorbier réclame la prime de 500 dollars, mandat en main, et menace de dire à Fort-Rail que c'est lui : qui garde le récit garde le Nom.",
    "La Veuve, amie hors-la-loi, si on lui a laissé les cartes ou si on l'a protégée de Sorbier : une fois, elle indique un gué sans garde ou une cache de cartouches.",
    "Clémence Roux et le vieux Roux, alliés au rancho Wagram, si on leur montre la liste.",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `À faire sentir sans le dire : le rail achète le Champ en douce, et des Asiliens l'aident ; la Bande des Lys vole pour une cause, et elle a peur ; un nom se fait devant témoins, et ça se paie.

Le secret de la campagne (voir la bible, section 1) ne paraît pas du tout ce soir. Personne n'en parle. Ce que les personnages découvrent, c'est seulement que le rail achète, et que le président de l'Assemblée a déjà vendu.

Un peu plus de trois heures en tout. Si la soirée file, saute l'arrêt au rancho Austerlitz : Moss ouvre la sacoche dans la voiture, et la diligence arrive directement à Bonne-Espérance.

La Veuve. Elle ne tire pas la première. Si un personnage la menace sans tirer, elle répond par la parole : « Monsieur, je vous remercie de ne pas avoir tiré. » Si on lui laisse les cartes, elle laisse un reçu signé « Les Lys ».

Sorbier. Il tire sur la Veuve à son premier tour au gué, sauf si un personnage le retient (Athlétisme contre Athlétisme, ou une promesse de récit, voir les rebondissements). Un coup d'éclat pour lui fait monter son Nom à lui, pas celui des personnages.

Les cartouches. Chaque personnage commence avec ce que donne sa classe. Au gué, chaque tir en coûte une. On pille 1d6 cartouches sur un cavalier tombé.

Au micro. Les roues cerclées de fer sur la terre rouge, le claquement du harnais, l'eau du gué. La Veuve est la seule voix qui ne couvre rien : les joueurs doivent se taire pour l'entendre.

Les Titres commencent à 100 et ne bougent pas ce soir. Si les cartes arrivent à l'Assemblée samedi par la main des personnages, c'est +5 au prochain compte : une vente empêchée.

Niveau 2 pour tout le monde à Bonne-Espérance, quoi qu'il soit arrivé à la sacoche.`,
  readAloud: [
    {
      act: 1,
      title: "Fort-Rail",
      text: "La locomotive s'est arrêtée au bout des rails, et elle fume encore. À dix pas devant elle, dans l'herbe, il y a une borne de pierre de la hauteur d'un enfant, avec un aigle, une abeille et un chiffre gravés : 1820. Au-delà de la borne, l'herbe monte jusqu'à l'horizon, sans un piquet. Devant une grange peinte en rouge, un vieil homme attelle deux chevaux gris en leur parlant comme à des amis : « Allez, Ney. Allez, Murat. On a du monde aujourd'hui. »",
    },
    {
      act: 2,
      title: "Le gué",
      text: "Un peuplier est couché en travers de la piste, juste avant l'eau, les racines encore pleines de terre fraîche. Bastide tire sur les rênes et jure entre ses dents. Trois cavaliers sortent des arbres, foulard sur le nez. Une femme en noir, voile de deuil baissé, s'avance au pas, seule, les mains loin de ses revolvers. Elle s'arrête à dix pas de la voiture et parle si bas qu'il faut tendre l'oreille : « Je vous remercie de vous arrêter. »",
    },
    {
      act: 3,
      title: "Austerlitz",
      text: "Le rancho Austerlitz est une maison de pierre à galerie, au bout d'une allée de mesquites. Un vieil homme est assis sur la galerie, un sabre de cavalerie posé sur les genoux, et il regarde arriver la diligence sans se lever. Au-dessus de la porte, un aigle de bois a perdu une aile. « Entrez. Il y a de la soupe. On a entendu des coups de feu vers la Fourche. Racontez. »",
    },
    {
      act: 4,
      title: "Le dîner",
      text: "La salle à manger de Saint-Gilles sent la cire et le tabac. Sur la cheminée, un aigle de bronze. Sur la table, une argenterie trop belle pour la prairie, frappée d'une abeille. Le vieux président vous accueille un par un, la main posée sur votre bras, et vous place lui-même. « Asseyez-vous, mes amis. Comme disait l'Empereur à Waterloo : un homme qui a bien dîné ne perd jamais. » Il dispose les verres en rang, comme une compagnie, et compte les convives deux fois.",
    },
  ],
  choices: [
    {
      act: 2,
      title: "La sacoche",
      options: [
        { label: "Donner la sacoche", consequence: "La Veuve remercie, laisse un reçu « Les Lys », et part. Moss pleure. Crane saura qui était à bord. La Veuve vous doit un service." },
        { label: "Négocier", consequence: "Persuasion DD 13 : elle prend les cartes, rend la sacoche et les papiers personnels de Moss. Elle se souviendra de vous comme de gens raisonnables." },
        { label: "Se battre", consequence: "Jouer « Le gué de la Fourche ». Victoire : la Bande recule, la sacoche reste ; un coup d'éclat pour qui a tenu le gué." },
        { label: "Empêcher Sorbier de tirer", consequence: "Athlétisme contre Athlétisme, ou une promesse de récit. Sorbier enrage mais garde son mandat ; la Veuve voit qui l'a protégée." },
      ],
    },
    {
      act: 3,
      title: "Toinou Brassac",
      options: [
        { label: "Le livrer à Bastide", consequence: "Bastide le garde sur le siège, sans fusil, ou le laisse à Austerlitz si vous l'exigez. La Bande perd son informateur, et la Veuve le saura." },
        { label: "Le couvrir", consequence: "Il vous doit sa place. Il continuera à renseigner la Bande, et vous aussi, si vous le payez." },
      ],
    },
    {
      act: 4,
      title: "Saint-Gilles",
      options: [
        { label: "Accepter ses cinquante dollars", consequence: "Vous remettez la sacoche à son notaire, ou vous taisez ce que vous savez, et l'Assemblée n'en saura rien samedi. Saint-Gilles vous ouvre ses portes, et vous devez votre silence. Le vieux Roux hésite, puis vend à la fin du mois : −5 sur les Titres au prochain compte." },
        { label: "Montrer la liste à l'Assemblée", consequence: "Avec Clémence Roux, samedi. Saint-Gilles devient un ennemi poli. Le vieux Roux ne vend pas : +5 sur les Titres au prochain compte." },
        { label: "Vendre la liste à quelqu'un d'autre", consequence: "Après le dîner : un messager de la Veuve passe la nuit même et paie vingt dollars ; Crane en paie cent, mais il faut deux jours de cheval jusqu'à Fort-Rail. Chacun saura que vous vendez." },
      ],
    },
  ],
  mapHint: {
    kind: "nature",
    seed: 1878,
    name: "Le gué de la Fourche",
    width: 44,
    height: 30,
    labels: ["Le gué", "Le peuplier abattu", "La crête"],
  },
};
