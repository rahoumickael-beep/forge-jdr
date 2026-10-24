// Bibliothèque de la Résidence (cyberpunk, « Ville sous bail ») : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « Ville sous bail », scénario 1 : ouverture, niveau 1. */
export const AVIS_DE_SIX_HEURES: Scenario = {
  id: "bib-cp-avis",
  title: "L'avis de six heures",
  genre: "cyberpunk",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Novembre 2089, Bloc 14, cent dix-huitième étage. Il pleut, comme toujours : ce soir, les seaux du couloir débordent. Mado Ferrandi, du Comité, vous paie quarante heures chacun pour une nuit de garde devant la porte 14-118-62 : demain à sept heures, les Huissiers viennent expulser la famille Aït-Larbi, qui doit six cents heures. « Un clerc me l'a dit ce soir ; il y en a qui préviennent, ceux qui ont encore un voisin. Je ne vous demande pas de vous battre. Je vous demande qu'ils ne puissent pas le faire sans que tout l'étage regarde. »",
  synopsis:
    "Nadia Aït-Larbi, trente ans, en paraît trente-huit ; ses quatre enfants et sa belle-mère, Yamina, vivent dans deux pièces au cent dix-huitième étage du Bloc 14. Elle doit six cents heures. Le Comité veut faire de son expulsion la première empêchée en public depuis l'annonce de la Révision, devant les caméras du couloir. Pendant la nuit, Basile Ott, le voisin d'en face, propose de payer la dette en heures volées, à moitié prix ; elles viennent du Port-Franc, et deux gros bras de son fournisseur montent réclamer leur avance. À minuit, l'écran du couloir s'allume tout seul sur le numéro d'appartement d'un personnage : « Bonsoir. Vous avez du courrier. » Dans la boîte du palier, une quittance imprimée, comme on n'en fait plus : le relevé de compte de l'huissier-chef Grégoire Tessandier, trois mois de retard, et l'heure exacte de sa prime. À six heures, l'avis tombe sur le Compteur de Nadia. À sept heures, Tessandier frappe, avec trois clercs.",
  acts: [
    {
      title: "Le couloir",
      location: "Le cent dix-huitième étage du Bloc 14 : le couloir de cent portes, l'appartement des Aït-Larbi, la cage d'escalier",
      summary:
        "Vingt et une heures. Un couloir de trois cents mètres, cent portes grises, un néon sur deux, l'eau qui suinte du plafond dans des seaux. Mado présente les personnages à Nadia, qui leur sert du thé dans des verres dépareillés et compte les bols : « Il reste quatre bols. » Yamina, la belle-mère, regarde la porte et ne parle qu'en arabe aux enfants. Les personnages ont la nuit pour préparer : prévenir les voisins (un test de Persuasion DD 12 par tranche de vingt portes, cinq en tout ; deux réussites, ce sont vingt témoins dans le couloir à sept heures, quatre réussites, quarante), vérifier les caméras du couloir (une simple lecture, sans trace : celle du fond est coupée depuis un mois ; la remettre en marche est un piratage, Technique DD 13, qui laisse une trace), repérer la cage d'escalier de service et l'ascenseur que prendront les Huissiers. Basile Ott, le voisin d'en face, passe la tête par sa porte, fait une blague sur la pluie (« Au moins, on ne paie pas l'eau qui tombe. Pas encore. »), et propose à voix basse : six cents heures volées pour trois cents vraies. Compter 40 minutes.",
    },
    {
      title: "Ceux du Port",
      location: "La cage d'escalier et le palier de l'ascenseur, vers vingt-trois heures",
      summary:
        "Deux gros bras du Port-Franc montent par l'escalier de service, trempés, un nœud de marin tatoué au poignet. Ils viennent chercher l'avance que Basile doit à leur patronne sur la dernière livraison. Basile se cache chez Nadia, sous le lit des enfants, et chuchote : « Si je meurs, dites-leur que j'étais grand. » S'ils trouvent Basile, ils le traînent à l'ascenseur ; si les personnages s'interposent, ils se battent sans tuer, et partent quand l'un d'eux tombe. On peut aussi payer (80 h), ou leur faire croire que Basile a déménagé (Tromperie DD 13, DD 15 s'ils ont vu de la lumière chez Nadia). L'escalier est sans lumière : les gros bras ont une lampe, et qui n'a pas de lumière attaque avec le désavantage. Un gros bras pris parle : « Les heures de Basile ? Elles viennent du Port. Propres. Le gars qui les portait n'en a plus l'usage. » Compter 30 minutes.",
    },
    {
      title: "Le courrier de minuit",
      location: "Le couloir, l'écran de palier et la boîte aux lettres collective",
      summary:
        "À minuit pile, tous les néons du couloir s'éteignent, sauf un. L'écran de palier, qui ne montre d'habitude que les avis et la météo, s'allume sur un fond vert et affiche le numéro d'appartement d'un personnage (ou de celui où il dort), puis : « Bonsoir. Vous avez du courrier. » La boîte aux lettres collective, qui n'a pas servi depuis dix ans, cliquette. Dedans, une quittance imprimée sur papier, pliée en trois : le relevé de compte de Grégoire Tessandier, huissier-chef, Bloc 14 lui aussi, au trente-et-unième étage. Trois mois de retard. Une prime de cent vingt heures s'il clôt l'expulsion avant sept heures et quart. Rien ne dit qui l'envoie. Remonter l'envoi est un piratage (Technique DD 15) : réussi ou raté, il laisse une trace et donne un Préavis au MJ. Il ne mène qu'à un serveur de la Foncière, et à un message qui s'affiche une seconde : « Bonne nuit. » Compter 20 minutes.",
    },
    {
      title: "Sept heures",
      location: "Le couloir du cent dix-huitième étage, de six heures à sept heures et quart",
      summary:
        "À six heures, le Compteur de Nadia vibre : l'avis. Les enfants se réveillent. Les voisins prévenus sortent dans le couloir en pyjama, un gobelet à la main. À sept heures, l'ascenseur s'ouvre : Grégoire Tessandier, brassard jaune et visière relevée, trois clercs avec leurs tasers à harpon, un serrurier. Il lit l'avis une fois, à voix haute, comme le règlement l'exige : « Je dois vous le dire une fois. Libérer les lieux, madame. Article quatre. Quinze minutes de grâce, je les prends sur mon temps. » Puis il attend sept heures et quart en regardant son poignet. Ce qui se passe dépend de ce que les personnages ont préparé : payer la dette (six cents heures, en vraies ou en volées), négocier (Tessandier accepte cinquante heures pour « constater une erreur de calcul » et revenir dans un mois, ou cède devant sa propre quittance si on la lui montre sans témoin), remplir le couloir (avec quarante voisins et la caméra qui tourne, il n'ose pas faire sortir une grand-mère de force : il se retire, et le Comité a son expulsion empêchée en public), ou se battre. Avant sept heures, Mado prend un personnage à part : « Si Nadia perd la porte à sept heures cinq, la vidéo vaut dix Blocs en grève. Tu peux supporter ça ? » Compter 1 h 10.",
    },
  ],
  villain: {
    name: "Grégoire Tessandier, huissier-chef",
    motivation:
      "clore l'expulsion avant sept heures et quart pour toucher sa prime de cent vingt heures, et payer son propre loyer avant qu'un collègue ne vienne chez lui",
    description:
      "Quarante ans, en paraît cinquante-cinq. Grand, les épaules tombantes, le brassard jaune sur un imperméable trop large. Il a grandi au trente-et-unième étage du Bloc 14 et y vit encore. Il cite le règlement au lieu de répondre, et ne dit jamais « expulser », seulement « libérer les lieux ». Il regarde son poignet toutes les deux minutes.",
  },
  npcs: [
    {
      name: "Nadia Aït-Larbi",
      role: "Locataire du 14-118-62, mère de quatre enfants",
      secret:
        "Elle veut garder ses enfants ensemble : en cas d'expulsion, les services de la Foncière placent les enfants des familles sans logement. Elle a déjà vendu cinq ans de sa vie à une Clinique de Prolongation pour payer l'année dernière, et elle ne peut plus en vendre. Elle refusera les heures volées si on lui dit d'où elles viennent.",
      voice: "Compte tout ce qui reste dans la maison : « Il reste quatre bols. Il reste deux jours de thé. » Ne pleure pas devant les enfants ; sort dans le couloir pour le faire.",
    },
    {
      name: "Basile Ott",
      role: "Voisin d'en face, vendeur d'heures volées au détail",
      secret:
        "Il veut sa part : il prend vingt pour cent sur tout ce qu'il vend. Il doit encore une avance au Port-Franc, et il vend dans tout le Bloc des heures prises sur des Compteurs que la Grue achète aux cliniques. Il aime bien Nadia, sincèrement.",
      voice: "Ment avec une blague, et rit le premier : « Volées ? Disons qu'elles ont changé de quartier. »",
    },
    {
      name: "Mado Ferrandi",
      role: "Porte-parole du Comité, commanditaire",
      secret:
        "Elle veut une expulsion empêchée en public, filmée, pour lancer la grève des loyers avant la Révision. Elle paie les personnages avec des heures du fonds de grève, crédité par un donateur qu'elle n'a pas cherché à connaître. Elle préférerait que Nadia soit expulsée devant les caméras plutôt que sauvée en douce par un arrangement : si on paie en douce, elle ne verse que 20 h au lieu de 40, sans les 15 h ; si l'expulsion a lieu et que le groupe la filme, elle paie tout.",
      voice: "Parle vite, tutoie tout le monde, compte les gens par étage : « Le cent dix-septième est avec nous. Le cent dix-neuvième dort. »",
    },
    {
      name: "Yamina Aït-Larbi",
      role: "Belle-mère de Nadia, soixante-dix ans réels",
      secret:
        "Elle a refusé toute sa vie les Cliniques, et elle a encore deux mille heures sur son Compteur, économisées pour ses petits-enfants. Le bail est au nom de Nadia seule : la Foncière ne touche pas au Compteur de Yamina. Elle ne veut pas que Nadia le sache : elle les garde pour le jour où l'aîné, qui a onze ans, en aura dix-huit. Si la porte cède à sept heures et quart, elle paie, et pas avant.",
      voice: "Ne parle qu'en arabe aux enfants et en français aux Huissiers, très poliment. Appelle chaque personnage « mon fils » ou « ma fille ».",
    },
  ],
  encounters: [
    {
      title: "Ceux du Port (acte 2)",
      description:
        "Deux gros bras du Port-Franc dans une cage d'escalier étroite, glissante et sans lumière : terrain difficile sur les marches mouillées, et désavantage pour qui n'a ni lampe ni vision dans le noir. Ils frappent pour faire mal, pas pour tuer : un personnage tombé à 0 PV est stable. Ils partent quand l'un d'eux tombe, ou si on leur paie 80 h.",
      enemies: [{ name: "Gros bras du Port-Franc", count: 2, hp: 16, ac: 12, attack: "Poing américain +4, 1d6+2 contondants", danger: "Faible" }],
      difficulty: "Facile (évitable)",
    },
    {
      title: "Sept heures et quart (acte 4)",
      description:
        "Seulement si la négociation échoue et que les personnages bloquent la porte. Les clercs tirent au taser à harpon pour immobiliser, pas pour tuer. Ils se rendent à 4 PV. Tessandier ne se bat que s'il est frappé, et recule dès qu'il passe sous la moitié des siens. Les voisins comptent : chaque tranche de dix témoins retire un clerc de la première salve, parce qu'il hésite.",
      enemies: [
        { name: "Clerc huissier", count: 3, hp: 9, ac: 13, attack: "Taser à harpon +3, 1d6+1 foudre, entravé (Corps ou Réflexes DD 11 pour arracher le harpon)", danger: "Faible" },
        { name: "Grégoire Tessandier, huissier-chef", count: 1, hp: 22, ac: 14, attack: "Matraque électrique +4, 1d6+2 contondants (+1 foudre si la cible est entravée)", danger: "Moyen" },
      ],
      difficulty: "Difficile (évitable)",
    },
  ],
  twists: [
    "Le courrier de minuit vient de celle qui gère le Bail, qui ne signe pas encore. C'est le premier contact de la campagne : ne l'explique jamais. Si les joueurs demandent qui l'a envoyé, un écran de couloir, plus tard, leur souhaitera seulement « Bonne nuit ».",
    "Yamina a deux mille heures sur son Compteur. Si la porte cède, elle paie les 600 h devant tout le monde : il lui en reste 1 400, et l'aîné ne verra jamais sa part. Nadia ne le lui pardonnera pas tout de suite. Ne la fais payer que si les personnages ont échoué, jamais avant sept heures et quart.",
    "Tessandier est du Bloc 14. Si les personnages montrent sa quittance devant les voisins, il est fini dans son propre Bloc ; s'ils la lui montrent seul, il s'en va et leur doit quelque chose.",
  ],
  rewards: [
    "Quarante heures chacun de Mado Ferrandi, et quinze de plus si l'expulsion est empêchée en public, devant la caméra.",
    "Le Comité doit un service aux personnages si l'expulsion est empêchée sans que personne ne paie la dette en douce.",
    "Grégoire Tessandier doit un service aux personnages s'ils ont gardé sa quittance pour eux.",
    "Basile Ott vend désormais aux personnages au prix de gros, et les prévient quand des heures « reviennent » du Port ; sauf s'ils ont dit à Nadia d'où venaient les siennes : alors il ne leur vend plus rien.",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : tout se paie en heures, et quelqu'un vieillit pour chaque dette réglée ; les Huissiers sont des locataires comme les autres ; quelqu'un, dans le Réseau, regarde les personnages et les aide.

Avant la séance. Chaque joueur note son solde de départ sur sa fiche (Bloc 300 h, Hauts 1 500 h, Prolongé 600 h, Cousu 300 h, Sans-Bail 0). Dis-leur que la dette de Nadia est de 600 h, et laisse-les faire le calcul.

Durée : un peu moins de 3 h. Mise en place : 10 minutes. Acte 1 : 40 minutes. Acte 2 : 30 minutes. Acte 3 : 20 minutes. Acte 4 : 1 h 10. Si la soirée file, saute les gros bras : Basile paie son avance en douce, et l'indice sur la clinique passe par lui.

Tessandier. Il lit, et il regarde son poignet. À sept heures quatorze, il dit au serrurier : « On y va. » Il préfère cinquante heures et un mois de délai à une bagarre filmée : un clerc blessé devant la caméra lui coûte son brassard, pas seulement sa prime. Seul avec les personnages à sept heures dix, il le dit à demi-mot.

Les heures volées. Celui dont le Compteur reçoit les heures de Basile et paie les Huissiers fait la sauvegarde d'Endurance DD 12 (plus de 50 h dans la même journée). Échec : les 600 h refluent aussitôt de son solde, et il passe sous zéro (un personnage des Blocs à 300 h tombe à −300 h : trois niveaux d'épuisement). Si les heures sont passées par le Compteur de Nadia, c'est elle qui fait la sauvegarde ; à −600 h, elle a dépassé le seuil de −500 h : il reste une semaine pour lui rendre 100 h, sinon elle ne se relève plus. C'est un très bon début de campagne, et une très mauvaise semaine pour elle.

Le courrier de minuit. C'est la Concierge, qui ne dit pas son nom. Elle a choisi ceux qui étaient dans le couloir. La quittance ne règle rien ; elle leur donne quelque chose à dire à Tessandier.

Le choix final. Une expulsion empêchée en public lance la grève du Bloc 14. Une dette payée en douce sauve la famille, et Mado ne paie que 20 h. Une bagarre fait une vidéo qui circule dans tous les Blocs avant midi, et met le Bloc 14 sur la liste de la Révision.

Au micro. Une goutte dans un seau toutes les deux secondes, l'ascenseur qui monte une minute entière en grinçant, et le bip des Compteurs à six heures, dans toutes les chambres en même temps.

Règles du monde. L'Emprise du Conseil commence à 100. Expulsion empêchée en public : −3. Combat contre les Huissiers : +5. Chaque piratage laisse une trace ; chaque sauvegarde de reflux ratée donne un Préavis au MJ.

Les deux combats valent une centaine d'XP par personnage ; la négociation et le couloir plein autant. Le groupe passe au niveau 2 à la fin, quoi qu'il ait choisi.`,
  readAloud: [
    {
      act: 1,
      title: "Le couloir",
      text: "Le cent dix-huitième étage sent le béton mouillé et la soupe aux lentilles. Le couloir file tout droit, trois cents mètres, cent portes grises, un néon sur deux. De l'eau tombe du plafond dans des seaux en plastique, à intervalles réguliers, et quelqu'un a peint des numéros sur les seaux pour qu'on ne les vole pas. Devant la porte 62, une petite fille en pyjama vous regarde arriver, puis crie vers l'intérieur : « Maman ! C'est les gardes ! »",
    },
    {
      act: 2,
      title: "L'escalier",
      text: "L'escalier de service n'a plus de lumière depuis le centième étage. On entend monter avant de voir : des pas lourds, réguliers, qui ne se pressent pas, et une voix qui compte les étages à mi-voix, en riant. Une lampe de poche balaie la rambarde trempée. « Cent seize. Cent dix-sept. Basile ? On sait que tu entends. »",
    },
    {
      act: 3,
      title: "Minuit",
      text: "Les néons s'éteignent tous en même temps, sauf celui au-dessus de l'écran de palier. L'écran, qui n'affiche jamais que la météo et les avis, devient vert. Des lettres blanches, une à une, comme tapées à la machine. Un numéro d'appartement : celui où l'un de vous dort cette nuit. Puis : « Bonsoir. Vous avez du courrier. » Derrière vous, dans le mur, la vieille boîte aux lettres collective fait un bruit de clé.",
    },
    {
      act: 4,
      title: "Sept heures",
      text: "À six heures, tous les Compteurs de l'étage bipent en même temps : l'heure du réveil. Celui de Nadia bipe deux fois. Elle regarde son poignet longtemps, puis elle met de l'eau à chauffer. À sept heures, l'ascenseur s'arrête au cent dix-huitième. La porte s'ouvre sur quatre brassards jaunes et un homme qui tient une caisse à outils. Le plus grand relève sa visière, regarde le couloir, compte, puis regarde son poignet. « Je dois vous le dire une fois. »",
    },
  ],
  choices: [
    {
      act: 1,
      title: "Les heures de Basile",
      options: [
        { label: "Acheter les heures volées", consequence: "Trois cents vraies heures pour six cents volées. La dette est payable, mais elles peuvent refluer (sauvegarde d'Endurance DD 12 au paiement). Basile prend sa part." },
        { label: "Refuser", consequence: "Basile hausse les épaules. Il reste dans le jeu : les gros bras viennent quand même le chercher à l'acte 2." },
        { label: "Dire à Nadia d'où elles viennent", consequence: "Nadia refuse de payer avec. Basile en veut aux personnages, mais il leur lâche le nom d'une clinique du Jardin. Elle ne donne rien de plus au niveau 1 : c'est un fil pour plus tard." },
      ],
    },
    {
      act: 2,
      title: "Les gros bras",
      options: [
        { label: "Payer l'avance de Basile", consequence: "80 h. Basile doit un service. Les gros bras redescendent en disant bonsoir." },
        { label: "Les tromper", consequence: "Tromperie DD 13 (DD 15 s'ils ont vu de la lumière chez Nadia) : Basile a déménagé. Réussi, ils repartent, et reviendront dans une semaine. Raté, combat." },
        { label: "Se battre", consequence: "Jouer « Ceux du Port ». La Grue apprend le nom des personnages." },
      ],
    },
    {
      act: 3,
      title: "La quittance de Tessandier",
      options: [
        { label: "La garder pour négocier en tête à tête", consequence: "À sept heures, Tessandier lit la quittance, la plie, et repart sans un mot : délai d'un mois. Il doit un service aux personnages." },
        { label: "La montrer devant les voisins", consequence: "Tessandier repart sous les sifflets. L'expulsion est empêchée en public, mais Tessandier est fini dans son propre Bloc, et un autre huissier-chef, moins pressé, viendra le mois prochain." },
        { label: "La donner à Mado", consequence: "Avant six heures, le Comité l'affiche dans tous les ascenseurs du Bloc. Tessandier la lit en montant, et sa lecture de l'avis dure trois secondes de plus que d'habitude. Il reçoit le jour même son propre avis d'expulsion." },
      ],
    },
    {
      act: 4,
      title: "Sept heures et quart",
      options: [
        { label: "Payer la dette", consequence: "600 h, en vraies (quelqu'un passe sous zéro) ou en volées (sauvegarde de reflux, voir les notes). La famille reste. Mado ne paie que 20 h par personnage : ce n'est pas l'expulsion empêchée qu'elle voulait." },
        { label: "Négocier avec Tessandier", consequence: "50 h ou la quittance : un mois de délai. Rien n'est réglé, mais rien n'a coûté cher." },
        { label: "Remplir le couloir", consequence: "Avec quarante voisins et la caméra qui tourne, Tessandier se retire. Expulsion empêchée en public : −3 sur l'Emprise du Conseil, et la grève du Bloc 14 commence." },
        { label: "Se battre", consequence: "Jouer « Sept heures et quart ». La vidéo circule dans tous les Blocs avant midi : +5 sur l'Emprise du Conseil, le Bloc 14 sur la liste de la Révision, et les personnages ont un nom chez les Huissiers." },
      ],
    },
  ],
  mapHint: {
    kind: "donjon",
    seed: 2089,
    name: "Bloc 14, cent dix-huitième étage",
    width: 40,
    height: 28,
    labels: ["Porte 62", "Écran de palier", "Escalier de service"],
  },
};
