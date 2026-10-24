// Bibliothèque de la Ternelande (dark fantasy, « La Dîme ») : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « La Dîme », scénario 1 : ouverture, niveau 1. */
export const DEUX_SOUVENIRS: Scenario = {
  id: "bib-df-deux-souvenirs",
  title: "Deux souvenirs",
  genre: "dark-fantasy",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Hiver de l'an 512 de la Dîme. Le bailli de Saint-Ours-des-Glaces vous paie trois sous chacun pour escorter le Dîmier de passage sur la glace du lac, parce qu'une compagnie franche rôde dans Vaugelée. Vous arrivez au village deux jours avant la nuit la plus longue. Le Dîmier descend de cheval, ôte un gant, et annonce dans la cour de la pierre : « Deux. Par foyer. Cette année. »",
  synopsis:
    "Saint-Ours-des-Glaces, quarante foyers sur une île du lac, doit payer pour la première fois deux souvenirs par foyer. Le Dîmier Hugues aux mains froides reste jusqu'à l'aube de la Dîme pour toucher la pierre. La veuve Aude, Gardienne du village, a caché dans un dé à coudre le souvenir de sa fille Isabeau, noyée il y a trois hivers, et demande aux personnages de le garder, parce que le Dîmier fouillera sa maison. Maître Gombert, le meunier, veut acheter un mort à gage à Colin Lagel, veuf et sans le sou : Colin poserait son front sur la pierre à la place du meunier, pour trois livres. La première nuit, les Reflets frappent sous la glace du port ; l'un d'eux est une fillette qui cherche le dé à coudre. À l'aube de la Dîme, la compagnie du Héron arrive sur la glace : Gombert lui a promis du grain et l'a vendu ailleurs. Si les mercenaires sont encore au village à la nuit tombée, Hugues fera payer leur Dîme aux villageois. Ce que personne ne sait, sauf Aude : Hugues est né à Saint-Ours. C'est le frère aîné de Colin Lagel, et il a donné son enfance à la Dîme le jour où il a pris le masque.",
  acts: [
    {
      title: "La route de glace",
      location: "Le lac de Saint-Ours, entre la rive et l'île, en fin d'après-midi",
      summary:
        "Une demi-journée de glace grise, des piquets de saule plantés tous les vingt pas pour marquer le chemin. Hugues avance devant, à cheval, ses deux écuyers derrière, les personnages à pied à côté du traîneau de la Dîme (un coffre de chêne vide, cerclé de fer). Trois loups d'hiver sortent des roseaux gelés et visent le cheval de tête. Hugues ne tire pas l'épée : il regarde, les mains croisées sur le pommeau, et compte ce que vaut son escorte. Après le combat, il dit une phrase, une seule : « Le bailli a bien payé. » Sur l'île, le village : l'église de bois, l'auberge du Gué, le moulin à vent de Gombert, et la cour de la pierre fermée par une grille rouillée. Hugues annonce les deux souvenirs. Le village gronde, puis se tait quand il remet son gant. Compter 40 minutes.",
    },
    {
      title: "Le dé et la masure",
      location: "Le village : la maison de la veuve Aude, le moulin, la masure des Lagel",
      summary:
        "Le lendemain. La veuve Aude attend les personnages à l'auberge, un panier de pain de route sur les genoux. Sous le pain, un dé à coudre d'étain cabossé, tiède. « Gardez-le jusqu'à l'aube d'après-demain. Il fouillera chez moi, pas chez vous. » Elle ne dit pas ce qu'il y a dedans, sauf si on promet. Au moulin, Maître Gombert reçoit les personnages en tablier blanc de farine et leur offre une livre chacun pour « une petite chose de rien » : conduire Colin Lagel jusqu'à la pierre la nuit de la Dîme et s'assurer qu'il dit les bons mots. Dans la masure des Lagel, trois enfants, un feu de tourbe, une marmite vide. Colin a accepté : avec trois livres, ses enfants mangent jusqu'au dégel. Il donnera ses deux souvenirs à lui, puis deux autres pour le meunier : le chemin de la maison de son père et la voix de sa femme. Hugues passe dans toutes les maisons, pose la main sur les coffres et les berceaux, et ne dit rien. Il s'attarde dans la masure des Lagel sans savoir pourquoi. Compter 50 minutes.",
    },
    {
      title: "Ce qui frappe sous la glace",
      location: "Le port de l'île, les trous de pêche et l'église de bois, la nuit",
      summary:
        "Vers minuit, des coups sous la glace, réguliers, comme quelqu'un qui frappe à une porte. Au port, sous la lanterne des pêcheurs, des visages tournés vers le haut, une dizaine, et la glace qui se fend en étoile. Deux Reflets sortent par les trous de pêche. Une fillette les suit, mouillée jusqu'aux cheveux, une robe d'été, et marche droit vers la poche de celui qui porte le dé à coudre. Elle ne frappe pas : elle tend la main. C'est le Reflet d'Isabeau. Maître Gombert, en chemise, crie que c'est un signe de la Cour et qu'il faut livrer la Gardienne. Le Père Josselin, en surplis sur son manteau, dit que ce sont des noyés qu'on a oubliés et qu'il faut leur dire leurs noms. Le sel de veillée jeté sur un seuil arrête les Reflets jusqu'à l'aube ; le Père Josselin en a un sac. Choix : rendre le dé à la fillette (elle le serre, s'en va sous la glace, et Aude oublie sa fille pour de bon), lui dire son nom (Isabeau s'arrête, et pleure de l'eau), ou se battre. Compter 50 minutes.",
    },
    {
      title: "L'aube de la Dîme",
      location: "La glace devant le village, puis la cour de la pierre",
      summary:
        "Au matin, une ligne noire sur le lac : la compagnie du Héron, quarante mercenaires d'outre-mer, des chevaux, un chariot vide. Leur capitaine, Wendel Haak, s'arrête à portée d'arbalète et réclame cent sacs de grain que Maître Gombert lui a vendus et pas livrés. Gombert a vendu ce grain à un marchand de Haute-Cendre, plus cher. Hugues explique les choses au bailli, sans élever la voix : un étranger qui passe la nuit de la Dîme dans le village sera dîmé, et comme la pierre ne connaît pas les étrangers, ce sont les foyers du village qui paieront pour lui. Deux souvenirs par mercenaire. Le village a jusqu'au coucher du soleil. Puis la nuit de la Dîme : la file dans la cour, le front sur la pierre, la buée pâle. Chaque personnage raye ses deux souvenirs, ou triche. À l'aube suivante, Hugues passe la main sur la pierre, et il sait qui n'a pas payé. Compter 1 h 10.",
    },
  ],
  villain: {
    name: "Hugues aux mains froides, Dîmier",
    motivation:
      "que la Dîme soit payée en entier, deux souvenirs par foyer et pas un de moins, parce que sinon le printemps ne reviendra pas ; il le croit comme on croit que le soleil se lève",
    description:
      "Quarante ans, grand, voûté, le manteau gris raide de givre et le masque d'étain pendu à la selle tant qu'il n'est pas dans la cour. Il a ôté ses gants si souvent pour toucher des pierres que ses doigts sont blancs jusqu'à la deuxième phalange. Il ne menace jamais : il explique, patiemment, en comptant. « Quarante foyers. Deux chacun. Quatre-vingts. Il en manque trois. » Il ne se souvient pas de son enfance et n'y pense pas.",
  },
  npcs: [
    {
      name: "La veuve Aude",
      role: "Gardienne de Saint-Ours-des-Glaces, sage-femme",
      secret:
        "Elle veut garder un seul souvenir : le visage d'Isabeau, sa fille, noyée sous la glace il y a trois hivers. Elle l'a mis dans le dé à coudre la semaine dernière. Elle sait que le Reflet sous la glace est sa fille, et elle a peur de la voir. Elle a mis au monde Hugues, il y a quarante ans, dans la masure des Lagel : c'est le frère aîné de Colin. Elle ne le dira qu'à quelqu'un qui a gardé le dé jusqu'au bout.",
      voice: "Une aiguille piquée dans l'ourlet de la manche. Parle en tricotant, sans regarder, et compte les mailles à voix basse au milieu des phrases : « Il fouillera chez moi, trois, quatre, pas chez vous. »",
    },
    {
      name: "Maître Gombert",
      role: "Meunier, le plus riche du village",
      secret:
        "Il veut garder le souvenir de sa femme morte et de son fils parti à la guerre, et il a assez d'argent pour ne rien donner. Il a vendu à Haute-Cendre les cent sacs promis à la compagnie du Héron, et il espère que la compagnie s'en prendra au Dîmier plutôt qu'à lui. Il accusera la Gardienne de tout, Reflets compris, si on le pousse.",
      voice: "Tablier blanc de farine, les mains toujours dedans. Appelle tout le monde « mon brave », femmes comprises. Parle de souvenirs en sacs et en livres : « Deux souvenirs, c'est trois livres le sac. »",
    },
    {
      name: "Colin Lagel",
      role: "Veuf, trois enfants, pêcheur sous la glace",
      secret:
        "Il veut que ses enfants passent l'hiver. Il va donner quatre souvenirs, dont la voix de sa femme, et il n'en a plus que cinq. Il avait un frère aîné, il le sait parce qu'il reste une deuxième paire de patins dans le coffre, mais ne sait plus qui : sa mère l'a donné à la Dîme le jour où ce frère a pris le masque.",
      voice: "Ne regarde personne en face. Répond par oui ou non, puis ajoute une phrase sur ses enfants : « Oui. La petite tousse. »",
    },
    {
      name: "Père Josselin",
      role: "Prêtre de l'Église du Souvenir à Saint-Ours",
      secret:
        "Il veut des noms pour son registre de paroisse. Il tient la liste des noyés du lac depuis vingt ans, et il sait qu'Isabeau est sous la glace. Il a un sac de sel de veillée qu'il ne prête qu'à ceux qui lui donnent un nom.",
      voice: "Un surplis jauni par-dessus un manteau de berger. Commence chaque phrase par le nom de la personne à qui il parle, comme s'il l'inscrivait. Récite les noms des noyés quand il a peur.",
    },
  ],
  encounters: [
    {
      title: "Les loups du lac (acte 1)",
      description:
        "Trois loups d'hiver, maigres, visent le cheval de tête. Ils fuient quand deux sont tombés. Sur la glace, un personnage qui court plus de 6 m dans le tour réussit un test d'Agilité DD 10 ou tombe à terre. Hugues et ses écuyers ne se battent que si un loup les vise eux.",
      enemies: [{ name: "Loup d'hiver", count: 3, hp: 11, ac: 13, attack: "Morsure +4, 2d4+2 perforants, JS Vigueur DD 11 ou à terre", danger: "Faible" }],
      difficulty: "Moyenne",
    },
    {
      title: "Les Reflets du port (acte 3)",
      description:
        "Deux Reflets de noyés sortent des trous de pêche et attaquent qui tient une lanterne. Les armes ordinaires ne leur font que la moitié des dégâts ; le fer froid, tout. Le sel de veillée jeté sur un seuil les arrête. Le Reflet d'Isabeau ne se bat pas : si on la frappe, elle s'efface sous la glace, et Aude le sent. Dire leurs noms (le registre du Père Josselin, Religion DD 12) fait fuir un Reflet.",
      enemies: [{ name: "Reflet de noyé", count: 2, hp: 18, ac: 12, attack: "Toucher glacé +4, 1d8+2 froid, JS Volonté DD 11 ou un souvenir devient flou", danger: "Moyen" }],
      difficulty: "Difficile",
    },
    {
      title: "La compagnie du Héron (acte 4)",
      description:
        "Seulement si l'équipe choisit la force. Wendel Haak envoie cinq hommes, pas quarante : il veut le grain, pas une bataille. Ils se retirent si le capitaine perd la moitié de ses PV ou si deux hommes tombent. Les arbalétriers restent sur la glace et tirent sur qui sort de l'abri des maisons.",
      enemies: [
        { name: "Mercenaire de compagnie", count: 2, hp: 16, ac: 16, attack: "Épée longue +4, 1d8+2 tranchants", danger: "Moyen" },
        { name: "Arbalétrier de compagnie", count: 2, hp: 11, ac: 13, attack: "Arbalète lourde +4, 1d10+2 perforants, portée 30 m", danger: "Faible" },
        { name: "Wendel Haak, capitaine du Héron", count: 1, hp: 39, ac: 17, attack: "Deux coups d'épée +5, 1d8+3 tranchants", danger: "Élevé" },
      ],
      difficulty: "Mortelle (évitable)",
    },
  ],
  twists: [
    "Hugues est le frère aîné de Colin Lagel. Il a donné son enfance à la Dîme le jour où il a pris le masque, et sa mère l'a donné, lui, la même nuit. Aude le sait : elle l'a mis au monde. S'il l'apprend, il ne change pas la règle, mais il regarde la pierre longtemps, et il prend moins à la masure des Lagel.",
    "Le Reflet qui cherche le dé à coudre est Isabeau, la fille d'Aude. Elle ne veut pas punir : elle veut qu'on se souvienne d'elle, et le souvenir dans le dé est le dernier. Le Père Josselin a son nom dans son registre, avec trois lignes : « Huit ans, un trou entre les dents, chantait faux. »",
    "Gombert a vendu le grain de la compagnie à Haute-Cendre. Il a l'argent dans un coffre sous la meule. Avec ses cent vingt livres, on paie la compagnie trois fois.",
  ],
  rewards: [
    "Trois sous par personnage, du bailli, pour l'escorte ; trois de plus si la compagnie repart sans combat.",
    "Le dé à coudre de Gardienne (carte « Dé à coudre de Gardienne ») si Aude garde sa fille : elle le donne vide à l'équipe, pour la prochaine Dîme.",
    "Un nom dans le registre du Père Josselin pour chaque Reflet nommé, et son sac de sel de veillée (carte « Sel de veillée »).",
    "Si Colin ne vend rien : la reconnaissance du village, un traîneau prêté, et la carte « Veillée de famille ».",
    "Si la compagnie repart payée : Wendel Haak doit une bataille à l'équipe (carte « Capitaine de compagnie »).",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : la Dîme coûte quelque chose de vrai, aux joueurs comme aux villageois ; tout le monde triche, et chaque tricherie retombe sur quelqu'un ; ce qui vit sous la glace a été quelqu'un.

Avant la séance. Chaque joueur écrit six souvenirs sur sa fiche (onglet Fiche, partie Souvenirs). Des choses précises, avec un nom ou un objet : « le couteau que mon père m'a donné à dix ans », pas « mon enfance ». Les Effacés en écrivent deux. Ils vont en rayer deux cette nuit : dis-le dès le début, et laisse-les y penser pendant trois heures.

Durée : environ 3 h 30. Mise en place et souvenirs : 15 minutes. Acte 1 : 40 minutes. Acte 2 : 50 minutes. Acte 3 : 50 minutes. Acte 4 : 1 h 10. Si la soirée file, saute les loups (Hugues arrive seul avec l'escorte) et commence au village.

Hugues. Il n'est pas cruel, il est exact. Il compte à voix haute. Il répond à toute question sur la Cour par la même phrase : « La Cour reçoit. Le printemps revient. » Si un personnage le menace, il remet son gant, lentement, et dit au bailli : « Un de plus. »

La nuit de la Dîme. Fais-la jouer à la table, un par un. Chaque joueur dit à voix haute le souvenir qu'il donne, puis le raye (onglet Fiche : il passe à perdu). Les tricheries possibles : un mort à gage (un villageois paie à leur place, et le MJ dira un jour qui), le dé à coudre (un seul souvenir), ou ne rien donner. Ne rien donner se voit à l'aube : Hugues passe sa main sur la pierre, va droit au tricheur, et choisit lui-même le souvenir qu'il prend. Prends-le parmi les intacts, le plus précieux.

Le choix final. Il n'y a pas de bonne fin. Payer la compagnie avec l'argent de Gombert ruine le meunier, qui ne pourra plus payer sa Dîme l'an prochain. Laisser la compagnie au village coûte au village quatre-vingts souvenirs de plus, et la jauge en garde la trace. Se battre fait des morts, et un village qui perd des hommes perd des souvenirs avec eux. Ne pousse vers aucune.

Sur Discord. Le décor passe par le son : la glace qui craque sous les patins, les coups réguliers sous le lac, la grille rouillée de la cour, la buée qu'on entend presque quand un front touche la pierre. Pour Isabeau, parle très bas, et jamais plus de quatre mots.

Règles du monde. La Mémoire du pays commence à 100 et se compte cette nuit-là : −2 par souvenir que les personnages ont perdu pour de bon, −10 si le village ne paie pas. Chaque souvenir perdu donne une Lacune au MJ (le serveur la compte). Garde-en une pour l'acte 4 : un villageois oublie le chemin de la glace au moment de prévenir la compagnie.

Expérience : environ 300 XP par personnage si tous les combats ont lieu. Fais passer le groupe au niveau 2 à la fin, quel que soit le choix.`,
  readAloud: [
    {
      act: 1,
      title: "La route de glace",
      text: "La glace du lac est grise, pas blanche, et elle chante sous les patins du traîneau : une note longue, qui court sous vos pieds jusqu'à la rive d'en face. Des piquets de saule marquent le chemin, un tous les vingt pas. Devant, le Dîmier ne s'est pas retourné une seule fois depuis le matin. Le masque d'étain pend à sa selle et cogne contre l'étrier, à chaque pas du cheval. Dans les roseaux gelés, à votre gauche, quelque chose suit le traîneau depuis un moment.",
    },
    {
      act: 2,
      title: "Le dé à coudre",
      text: "L'auberge du Gué sent la tourbe et la laine mouillée. La veuve Aude s'assoit en face de vous sans demander, un panier sur les genoux, et continue de tricoter. Elle soulève un coin du torchon : du pain de route, et dessous, un dé à coudre en étain, cabossé, de ceux qu'on trouve dans n'importe quelle maison. Elle le pousse vers vous du bout de l'aiguille. Vous le prenez. Il est tiède, comme une main qu'on vient de lâcher.",
    },
    {
      act: 3,
      title: "Les coups sous la glace",
      text: "Ça commence vers minuit. Trois coups, sous le lac, réguliers, puis trois autres. Au port, la lanterne des pêcheurs est restée allumée au bord d'un trou. Sous la glace transparente, tout autour de la lumière, il y a des visages : une dizaine, tournés vers le haut, les yeux ouverts. Ils ne bougent pas. Puis l'un d'eux pose ses deux mains à plat contre la glace, juste sous vos bottes, et la glace se fend en étoile.",
    },
    {
      act: 4,
      title: "La nuit de la Dîme",
      text: "La cour de la pierre est pleine. Les familles attendent en file, sous la neige, sans parler. Le Dîmier se tient à côté de la pierre, le masque sur le visage, les mains nues. Chaque fois qu'un front touche le grès, une buée pâle sort de la tête, monte à peine, et se défait dans la pierre comme du sucre dans l'eau. Colin Lagel passe trois fois. Quand votre tour vient, le grès est tiède sous votre front, et le Dîmier dit : « Nommez. »",
    },
  ],
  choices: [
    {
      act: 2,
      title: "Le dé à coudre",
      options: [
        { label: "Garder le dé pour Aude", consequence: "Hugues fouille la maison d'Aude et ne trouve rien. Le Reflet d'Isabeau, la nuit, vient vers le porteur. À l'aube de la Dîme, Aude raconte qui est Hugues." },
        { label: "Refuser", consequence: "Aude cache le dé dans la glace du port. Hugues le trouve à l'aube et Aude est pendue à la grille de la cour, sauf si l'équipe s'interpose (Persuasion DD 15 auprès du bailli, ou Hugues lui-même s'il sait qui il est)." },
        { label: "Le donner au Dîmier", consequence: "Hugues remercie, une fois. Aude est pendue à l'aube. Le village ne parle plus à l'équipe, et Hugues prend un souvenir de moins à chaque personnage cette nuit." },
      ],
    },
    {
      act: 2,
      title: "Le mort à gage de Colin",
      options: [
        { label: "Laisser faire", consequence: "Colin reçoit trois livres et passe quatre fois. Il oublie la voix de sa femme. Gombert garde sa mémoire." },
        { label: "Payer Colin à la place du meunier", consequence: "Trois livres de la poche de l'équipe. Colin ne vend rien. Gombert cherche un autre vendeur, et propose ensuite d'acheter un souvenir aux personnages eux-mêmes." },
        { label: "Dénoncer Gombert au Dîmier", consequence: "Hugues prend au meunier deux souvenirs de plus, qu'il choisit. Colin ne touche rien, et ses enfants ont faim. Gombert accusera l'équipe devant la compagnie." },
      ],
    },
    {
      act: 3,
      title: "Isabeau",
      options: [
        { label: "Lui rendre le dé", consequence: "Elle le serre et redescend sous la glace. Aude oublie sa fille pour de bon, et ne sait plus pourquoi elle pleure. Les autres Reflets s'en vont avec elle." },
        { label: "Lui dire son nom", consequence: "Le Père Josselin lit les trois lignes de son registre. Isabeau s'arrête, pleure de l'eau, et attend sur la glace jusqu'à l'aube. Aude vient la voir. Réputation auprès de l'Église du Souvenir." },
        { label: "Se battre", consequence: "Jouer « Les Reflets du port ». Si Isabeau est frappée, elle s'efface, et le souvenir du dé refroidit." },
      ],
    },
    {
      act: 4,
      title: "La compagnie du Héron",
      options: [
        { label: "Payer avec l'argent de Gombert", consequence: "La compagnie repart avant la nuit, et Wendel Haak doit un service. Gombert est ruiné et tient l'équipe pour responsable." },
        { label: "Négocier un départ", consequence: "Persuasion ou Intimidation DD 15 : Wendel part contre une partie du grain du village et une promesse. S'il reste, Hugues dîme le village pour quarante étrangers." },
        { label: "Se battre", consequence: "Jouer « La compagnie du Héron ». Victoire : la compagnie repart, et reviendra au printemps. Défaite : le village paie en grain et en souvenirs." },
      ],
    },
  ],
  mapHint: {
    kind: "village",
    seed: 512,
    name: "Saint-Ours-des-Glaces",
    width: 40,
    height: 32,
    labels: ["Cour de la pierre", "Moulin de Gombert", "Le port"],
  },
};
