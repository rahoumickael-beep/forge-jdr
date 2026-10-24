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
    "Hiver de l'an 512 de la Dîme. Étienne Morel, bailli de Saint-Ours-des-Glaces, vous paie une livre chacun pour escorter le Dîmier de passage depuis la rive jusqu'au village : une compagnie franche rôde dans Vaugelée, et deux écuyers ne suffisent pas contre quarante hommes. Vous arrivez sur l'île deux jours avant la nuit la plus longue. Le Dîmier descend de cheval, ôte un gant, et annonce dans la cour de la pierre : « Deux. Par foyer. Cette année. »",
  synopsis:
    "Saint-Ours-des-Glaces, quarante foyers sur une île d'un lac de Vaugelée, doit payer pour la première fois deux souvenirs par foyer. Le Dîmier Hugues aux mains froides reste jusqu'à l'aube qui suit la Dîme, pour toucher la pierre. La veuve Aude, Gardienne du village, a caché dans un dé à coudre le visage de sa fille Isabeau, noyée sous la glace en 509 ; elle demande aux personnages de le garder jusqu'à ce que la Dîme soit payée, parce que le Dîmier fouille chez chaque Gardienne qu'il repère. Maître Gombert, le meunier, achète un mort à gage à Colin Lagel, veuf sans le sou : Colin posera son front sur la pierre à la place du meunier, pour trois livres. La nuit d'avant la Dîme, les Reflets frappent sous la glace du port ; l'un d'eux est une fillette qui cherche le dé à coudre. Au matin de la Dîme, la compagnie du Héron arrive sur la glace : Gombert lui a vendu cent sacs de grain, a encaissé l'avance, et les a revendus plus cher à Haute-Cendre. Un étranger qui dort sous un toit de l'île la nuit de la Dîme doit deux souvenirs à la pierre ; les mercenaires refusent de payer, et la pierre se rabat sur les foyers qui les abritent. Ce que personne ne sait, sauf Aude : Hugues est né à Saint-Ours. C'est le frère aîné de Colin Lagel. Sa mère l'a donné à la Dîme l'hiver où il a pris le masque, et lui a donné son enfance.",
  acts: [
    {
      title: "La route de glace",
      location: "Le lac de Saint-Ours, entre la rive et l'île, en fin d'après-midi",
      summary:
        "Une demi-journée de glace grise, des piquets de saule plantés tous les vingt pas pour marquer le chemin. Hugues avance devant, à cheval, ses deux écuyers derrière, les personnages à pied à côté du traîneau de la Dîme (un coffre de chêne vide, cerclé de fer). Trois loups d'hiver sortent des roseaux gelés et visent le cheval de tête. Hugues ne tire pas l'épée tant qu'aucun loup ne vient sur lui : il regarde, les mains croisées sur le pommeau, et compte ce que vaut son escorte. Après le combat, il dit une phrase, une seule : « Le bailli a bien payé. » Sur l'île, le village : l'église de bois, l'auberge du Gué, le moulin à vent de Gombert, et la cour de la pierre fermée par une grille rouillée. Hugues annonce les deux souvenirs. Le village gronde, puis se tait quand il remet son gant. Le soir, il dort dans l'église, ses écuyers devant la porte. Compter 40 minutes.",
    },
    {
      title: "Le dé et la masure",
      location: "Le village : l'auberge du Gué, le moulin, la masure des Lagel",
      summary:
        "Le lendemain, veille de la Dîme. La veuve Aude attend les personnages à l'auberge, un panier de pain de route sur les genoux, une aiguille piquée dans l'ourlet de la manche : c'est le signe des Gardiennes, et Hugues l'a vu en arrivant. Sous le pain, un dé à coudre d'étain cabossé, tiède. « Gardez-le jusqu'à ce que la Dîme soit payée. Il fouillera chez moi, pas chez vous. » Elle ne dit ce qu'il y a dedans qu'à qui promet, et alors seulement : « Ma petite. » Au moulin, Maître Gombert reçoit les personnages en tablier blanc de farine et leur offre une livre chacun pour « une petite chose de rien » : conduire Colin Lagel jusqu'à la pierre la nuit de la Dîme et s'assurer qu'il dit les bons mots. Un personnage qui fouille le moulin (Investigation DD 13), ou qui fait parler Colin, apprend que Gombert descend chaque nuit à la cave, sous la meule, où il garde un coffre. Dans la masure des Lagel, trois enfants, un feu de tourbe, une marmite vide. Colin a accepté : avec trois livres, ses enfants mangent jusqu'au dégel. Il donnera ses deux souvenirs à lui, puis deux autres pour le meunier : le chemin de la maison de son père et la voix de sa femme. Dans le coffre, à côté de ses patins, une deuxième paire, plus grande, dont il ne sait plus à qui elle était. Hugues passe dans toutes les maisons, pose la main nue sur les coffres et les berceaux, fouille celle d'Aude de fond en comble. Il s'attarde dans la masure des Lagel, devant le coffre, sans savoir pourquoi. Compter 50 minutes.",
    },
    {
      title: "Ce qui frappe sous la glace",
      location: "Le port de l'île, les trous de pêche et l'église de bois, la nuit d'avant la Dîme",
      summary:
        "Vers minuit, des coups sous la glace, réguliers, comme quelqu'un qui frappe à une porte. Au port, sous la lanterne des pêcheurs, des visages tournés vers le haut, une dizaine, et la glace qui se fend en étoile. Deux Reflets sortent par les trous de pêche. Une fillette les suit, mouillée jusqu'aux cheveux, en robe d'été, et marche droit vers celui qui porte le dé à coudre. Elle ne frappe pas : elle tend la main. Le Père Josselin arrive en courant, son registre sous le bras, en récitant les noms des noyés dans l'ordre où il les a inscrits ; il reconnaît la fillette à son trou entre les dents, et il crie : « Isabeau ! » Maître Gombert, en chemise sur le seuil du moulin, crie que c'est un signe de la Cour et qu'il faut livrer la Gardienne. Le seuil de l'église est à vingt pas : c'est le seul abri ; le sel de veillée jeté dessus arrête les Reflets jusqu'à l'aube, et le Père Josselin donne son sac à qui répète le nom de la fillette. Hugues ne sort pas de l'église. Au matin, il demande qui a fait de la lumière sur la glace. Compter 50 minutes.",
    },
    {
      title: "La nuit de la Dîme",
      location: "La glace devant l'île, le moulin, puis la cour de la pierre",
      summary:
        "Au matin, une ligne noire sur le lac : la compagnie du Héron, quarante mercenaires d'outre-mer, des chevaux, un chariot vide. Leur capitaine, Wendel Haak, s'arrête à portée d'arbalète et réclame les cent sacs de grain pour lesquels il a versé soixante livres d'avance. Gombert les a revendus cent vingt livres à un marchand de Haute-Cendre ; l'argent est dans le coffre, sous la meule. Wendel veut charger le grain au moulin avant la nuit, et dormir au chaud. Hugues explique les choses au bailli, sans élever la voix : un étranger qui dort sous un toit de l'île la nuit de la Dîme doit deux souvenirs à la pierre. Les hommes du Héron n'ont jamais payé, et Wendel dit que la Dîme n'est pas sa dette : alors la pierre se rabat sur les foyers qui les abritent, deux souvenirs par homme. Tant que la compagnie campe sur la glace, elle n'est pas sous un toit. Le village a jusqu'au coucher du soleil. Puis la file dans la cour, sous la neige, le front sur la pierre, la buée pâle. Quand Colin s'avance, un personnage peut dire à Hugues qui il est (Persuasion DD 13 si Aude a parlé ; sinon, Perspicacité DD 15 pour relier les patins du coffre au Dîmier). Chaque personnage raye ses deux souvenirs, ou triche. À l'aube suivante, Hugues passe la main sur la pierre, et il sait qui n'a pas payé. Compter 1 h 10.",
    },
  ],
  villain: {
    name: "Hugues aux mains froides, Dîmier",
    motivation:
      "que la Dîme soit payée en entier, deux souvenirs par foyer, parce que sinon le printemps ne revient pas ; il est passé une fois au bord des Landes Effacées, et il a vu ce qu'est un pays qui n'a pas payé",
    description:
      "Quarante ans, grand, voûté, le manteau gris raide de givre et le masque d'étain pendu à la selle tant qu'il n'est pas dans la cour. Il a ôté ses gants si souvent pour toucher des pierres que ses doigts sont blancs jusqu'à la deuxième phalange. Il explique tout, patiemment, en comptant : « Quarante foyers. Deux chacun. Quatre-vingts. Il en manque trois. » Il a pris le masque à quatorze ans, il y a vingt-six ans ; il ne se souvient pas d'avant, et n'y pense pas.",
  },
  npcs: [
    {
      name: "La veuve Aude",
      role: "Gardienne de Saint-Ours-des-Glaces, sage-femme",
      secret:
        "Elle veut garder un seul souvenir : le visage d'Isabeau, sa fille, l'enfant tardive de ses quarante-trois ans, noyée sous la glace à huit ans. Elle l'a mis dans le dé à coudre la semaine dernière, et elle a peur de voir le Reflet. À quatorze ans, elle aidait la sage-femme quand Hugues est né, dans la masure des Lagel : c'est le frère aîné de Colin. Elle ne le dira qu'à qui a gardé le dé jusqu'au matin de la Dîme, ou n'a pas trahi sa fille sous la glace.",
      voice: "Tricote une chaussette de nourrisson qu'elle défait à chaque fin de phrase. Ne dit jamais le prénom de sa fille : « la petite », « elle ». Le jour où elle dit enfin « Isabeau », elle pose son tricot.",
    },
    {
      name: "Maître Gombert",
      role: "Meunier, le plus riche du village",
      secret:
        "Il veut garder le souvenir de sa femme morte et de son fils parti à la guerre, et il a assez d'argent pour ne rien donner. Il a pris soixante livres d'avance à la compagnie du Héron et revendu le grain cent vingt livres à Haute-Cendre ; le coffre est sous la meule. Il espère que la compagnie s'en prendra au Dîmier plutôt qu'à lui, et il accusera la Gardienne de tout, Reflets compris, si on le pousse.",
      voice: "Tablier blanc de farine, les mains toujours dedans. Appelle tout le monde « mon brave », femmes comprises. Parle des souvenirs comme du blé : « Deux souvenirs, trois livres. Au prix du seigle, mon brave, c'est donné. »",
    },
    {
      name: "Colin Lagel",
      role: "Veuf, trois enfants, pêcheur sous la glace",
      secret:
        "Il veut que ses enfants passent l'hiver. Il a trente-deux ans, et il va donner quatre souvenirs, dont la voix de sa femme. Il avait un frère aîné, il le sait à cause de la deuxième paire de patins dans le coffre, mais ne sait plus qui : il avait six ans quand sa mère l'a donné à la Dîme, l'hiver où ce frère a pris le masque.",
      voice: "Ne regarde personne en face. Répond par oui ou non, puis ajoute une phrase sur ses enfants : « Oui. La petite tousse. »",
    },
    {
      name: "Père Josselin",
      role: "Prêtre de l'Église du Souvenir à Saint-Ours",
      secret:
        "Il veut des noms pour son registre de paroisse. Il tient la liste des noyés du lac depuis vingt ans, et il sait qu'Isabeau est sous la glace. Il garde dans la sacristie un couteau de fer froid qu'il n'a jamais osé sortir, et un sac de sel de veillée.",
      voice: "Un surplis jauni par-dessus un manteau de berger. Commence chaque phrase par le nom de la personne à qui il parle, comme s'il l'inscrivait. Quand il a peur, il récite les noms des noyés dans l'ordre du registre, et s'arrête à celui d'Isabeau.",
    },
    {
      name: "Étienne Morel",
      role: "Bailli de Saint-Ours-des-Glaces, commanditaire",
      secret:
        "Il veut que le village ne soit pas puni. Il savait que Gombert vendait le grain de la compagnie ailleurs, et il l'a laissé faire, parce qu'il doit au meunier deux années de fermage.",
      voice: "Tape de l'index sur la table à chaque fin de phrase, comme on clôt un compte. Dit « on verra » quand il a déjà décidé.",
    },
  ],
  encounters: [
    {
      title: "Les loups du lac (acte 1)",
      description:
        "Trois loups d'hiver, maigres, visent le cheval de tête. Ils fuient quand deux sont tombés. Sur la glace, un personnage qui court plus de 6 m dans le tour réussit un test d'Agilité DD 10 ou tombe à terre. Si aucun personnage n'est tombé au troisième round, Hugues abat lui-même un loup, sans un mot.",
      enemies: [{ name: "Loup d'hiver", count: 3, hp: 11, ac: 13, attack: "Morsure +4, 2d4+2 perforants, JS Vigueur DD 11 ou à terre", danger: "Faible" }],
      difficulty: "Difficile",
    },
    {
      title: "Les Reflets du port (acte 3)",
      description:
        "Deux Reflets de noyés récents sortent des trous de pêche et attaquent qui tient une lanterne. Ce sont les chiffres de ce scénario, plus faibles que la fiche du bestiaire. Les armes ordinaires ne leur font que la moitié des dégâts ; le couteau de fer froid du Père Josselin, tout (il le prête à qui lui donne un nom pour son registre). Un Reflet à 0 PV se défait en eau. Dire son nom à un Reflet (le registre de Josselin, Religion ou Histoire DD 12) le fait cesser d'attaquer pour la scène. Le Reflet d'Isabeau ne se bat pas : si on la frappe, elle s'efface sous la glace, et le dé refroidit.",
      enemies: [{ name: "Reflet de noyé récent", count: 2, hp: 13, ac: 12, attack: "Toucher glacé +3, 1d6+1 froid, JS Volonté DD 11 ou un souvenir devient flou", danger: "Faible" }],
      difficulty: "Difficile (évitable)",
    },
    {
      title: "Le bord de l'île (acte 4)",
      description:
        "Seulement si l'équipe choisit la force. Wendel Haak reste sur la glace, hors de portée, et envoie trois hommes prendre le grain au moulin : il veut le grain, pas une bataille. Six villageois armés de harpons, Colin et le bailli en tête, tiennent la ligne des maisons ; ils absorbent un tir par round. Les arbalétriers tirent depuis la glace, derrière un pavois de 8 PV (désavantage pour les toucher tant qu'il tient). Les mercenaires se retirent quand deux d'entre eux sont tombés.",
      enemies: [
        { name: "Mercenaire de compagnie", count: 1, hp: 16, ac: 16, attack: "Épée longue +4, 1d8+2 tranchants", danger: "Moyen" },
        { name: "Arbalétrier de compagnie", count: 2, hp: 11, ac: 13, attack: "Arbalète lourde +3, 1d10+1 perforants, portée 30 m, un tir par tour", danger: "Faible" },
      ],
      difficulty: "Difficile",
    },
  ],
  twists: [
    "Hugues est le frère aîné de Colin Lagel. Il a pris le masque à quatorze ans ; sa mère l'a donné à la Dîme le même hiver, et lui a donné son enfance. Aude le sait : elle aidait à sa naissance. S'il l'apprend dans la file, il ne dit rien. Colin ne paie que ses deux souvenirs, et Hugues ne prend rien d'autre à la masure, même si le meunier a payé. Le lendemain, il laisse sa seconde paire de gants dans le coffre des Lagel, à côté des patins.",
    "Le Reflet qui cherche le dé à coudre est Isabeau, la fille d'Aude. Elle ne vient pas punir : elle vient chercher le dernier endroit où quelqu'un se souvient d'elle. Le registre du Père Josselin la décrit en trois lignes : « Huit ans, un trou entre les dents, chantait faux. »",
    "Gombert a pris soixante livres d'avance à la compagnie et revendu le grain cent vingt livres. Avec le coffre sous la meule, on rembourse Wendel et on lui paie son dédit : la compagnie repart sans combat, et le meunier est ruiné.",
  ],
  rewards: [
    "Une livre par personnage, du bailli, pour l'escorte ; une demi-livre de plus si la compagnie quitte l'île avant la nuit.",
    "Si Isabeau a entendu son nom : Aude donne à l'équipe son dé à coudre, vide, pour la prochaine Dîme (carte « Dé à coudre de Gardienne »).",
    "Le sac de sel de veillée du Père Josselin (carte « Sel de veillée »), et le nom de chaque personnage qui a nommé un Reflet inscrit dans son registre : réputation 1 auprès de l'Église du Souvenir.",
    "Si Colin ne vend rien : la reconnaissance du village, un traîneau prêté, et la carte « Veillée de famille ».",
    "Si la compagnie repart payée : Wendel Haak doit une bataille à l'équipe (carte « Capitaine de compagnie »).",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : la Dîme coûte quelque chose de vrai, aux joueurs comme aux villageois ; tout le monde triche, et chaque tricherie retombe sur quelqu'un ; ce qui vit sous la glace a été quelqu'un.

Avant la séance. Chaque joueur écrit six souvenirs sur sa fiche (onglet Fiche, partie Souvenirs). Des choses précises, avec un nom ou un objet : « le couteau que mon père m'a donné à dix ans », pas « mon enfance ». Les Effacés en écrivent deux. Ils vont en rayer deux cette nuit : dis-le dès le début, et laisse-les y penser pendant trois heures.

Le calendrier. Acte 1 : l'après-midi, deux jours avant la Dîme. Acte 2 : la veille. Acte 3 : la nuit d'avant la Dîme. Acte 4 : le jour de la Dîme, puis la nuit, puis l'aube où Hugues touche la pierre.

Durée : environ 3 h 30. Mise en place et souvenirs : 15 minutes. Acte 1 : 40 minutes. Acte 2 : 50 minutes. Acte 3 : 50 minutes. Acte 4 : 1 h 10. Si la soirée file, saute les loups (Hugues arrive avec l'escorte sans encombre) et raccourcis la file : un souvenir dit à voix haute, l'autre rayé en silence.

Hugues. Il compte à voix haute et ne hausse jamais le ton. À toute question sur la Cour, la même phrase : « La Cour reçoit. Le printemps revient. » Si un personnage le menace, il remet son gant, lentement, et dit au bailli : « Un de plus. »

Le dé à coudre. Si l'équipe refuse de le garder, Aude le cache dans un trou de pêche, et les Reflets sortent par ce trou, plus nombreux. Si on le donne à Hugues, Isabeau vient quand même la nuit, vers l'église, et la scène se joue sans le dé.

La nuit de la Dîme. Fais-la jouer à la table, un par un. Chaque joueur dit à voix haute le souvenir qu'il donne, puis le passe à perdu sur sa fiche. Les tricheries possibles : un mort à gage (un villageois paie à leur place, et le MJ dira un jour qui), le dé à coudre (un seul souvenir), ou ne rien donner. Ne rien donner se voit à l'aube : Hugues passe sa main sur la pierre, va droit au tricheur, et prend lui-même un souvenir de plus, le plus précieux des intacts. Un Effacé qui n'a que deux souvenirs n'en raye qu'un : la pierre ne sent pas ce qu'elle ne trouve pas. Un Soldat d'une compagnie franche ne paie rien, mais le foyer qui l'abrite paie deux souvenirs de plus pour lui, et tout le village le sait.

Le choix final. Chaque issue coûte un souvenir à quelqu'un. Dis-le une fois, pas deux.

Sur Discord. La glace qui chante sous les patins, trois coups sous le lac, la grille de la cour qui grince. Pour Isabeau, parle très bas, et jamais plus de quatre mots.

Règles du monde. La Mémoire du pays commence à 100 et se compte la nuit de la Dîme : −2 par souvenir que les personnages ont perdu autrement qu'en payant la Dîme (un Reflet, un grand sort, le souvenir de plus pris par Hugues), −10 si le village ne paie pas. Les Lacunes du MJ arrivent avec les souvenirs perdus pour de bon : avant la file de la pierre, tu n'en as que si un Reflet a fait perdre un souvenir à l'acte 3. Sinon, joue une seule fois l'oubli d'un villageois (il ne sait plus le chemin de la glace au moment de prévenir la compagnie), pour installer le principe.

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
      text: "L'auberge du Gué sent la tourbe et la laine mouillée. La veuve Aude s'assoit en face de vous sans demander, un panier sur les genoux, et continue de tricoter. Elle soulève un coin du torchon : du pain de route, et dessous, un dé à coudre en étain, cabossé, de ceux qu'on trouve dans n'importe quelle maison. Elle le pousse vers vous du bout de l'aiguille, et attend. Celui qui le touche le sent tiède, comme une main qu'on vient de lâcher.",
    },
    {
      act: 3,
      title: "Les coups sous la glace",
      text: "Ça commence vers minuit. Trois coups, sous le lac, réguliers, puis trois autres. Au port, la lanterne des pêcheurs est restée allumée au bord d'un trou. Sous la glace transparente, tout autour de la lumière, il y a des visages : une dizaine, tournés vers le haut, les yeux ouverts. Ils ne bougent pas. Puis l'un d'eux pose ses deux mains à plat contre la glace, juste sous vos bottes, et la glace se fend en étoile.",
    },
    {
      act: 4,
      title: "La nuit de la Dîme",
      text: "La cour de la pierre est pleine. Les familles attendent en file, sous la neige, sans parler. Le Dîmier se tient à côté de la pierre, le masque sur le visage, les mains nues. Chaque fois qu'un front touche le grès, une buée pâle sort de la tête, monte à peine, et se défait dans la pierre comme le sel dans la soupe. Colin Lagel s'avance, et il ne regarde personne. Quand votre tour vient, le grès est tiède sous votre front, et le Dîmier dit : « Nommez. »",
    },
  ],
  choices: [
    {
      act: 2,
      title: "Le dé à coudre",
      options: [
        { label: "Garder le dé pour Aude", consequence: "Hugues fouille la maison d'Aude et ne trouve rien. La nuit, le Reflet d'Isabeau vient vers le porteur. Au matin de la Dîme, Aude raconte qui est Hugues." },
        { label: "Refuser", consequence: "Aude cache le dé dans un trou de pêche. Les Reflets sortent par ce trou, plus nombreux. Hugues trouve le dé au matin de la Dîme, et les écuyers pendent Aude à la grille de la cour, sauf si l'équipe s'interpose : Persuasion DD 15 auprès du bailli, ou dire à Hugues qui est Colin." },
        { label: "Le donner au Dîmier", consequence: "Hugues remercie, une fois. Aude est pendue au matin par les écuyers. Le village ne parle plus à l'équipe, et Hugues, cette nuit, ne prend qu'un souvenir à chaque personnage au lieu de deux." },
      ],
    },
    {
      act: 2,
      title: "Le mort à gage de Colin",
      options: [
        { label: "Laisser faire", consequence: "Colin reçoit trois livres et passe quatre fois. Il oublie la voix de sa femme. Gombert garde sa mémoire." },
        { label: "Payer Colin à la place du meunier", consequence: "Trois livres, la paie de trois personnages : vider les bourses, ou prendre l'argent du coffre de Gombert et le donner à Colin. Colin ne vend rien. Gombert propose alors d'acheter un souvenir aux personnages eux-mêmes." },
        { label: "Dénoncer Gombert au Dîmier", consequence: "Hugues prend au meunier deux souvenirs de plus, qu'il choisit. Colin ne touche rien, et ses enfants ont faim. Gombert accuse l'équipe devant la compagnie." },
      ],
    },
    {
      act: 3,
      title: "Isabeau",
      options: [
        { label: "Lui rendre le dé", consequence: "Elle le serre et redescend sous la glace. Aude oublie sa fille pour de bon, et ne sait plus pourquoi elle pleure. Les autres Reflets s'en vont avec elle." },
        { label: "Lui dire son nom", consequence: "Isabeau s'arrête, pleure de l'eau, et attend sur la glace jusqu'à l'aube. Aude vient s'asseoir à côté d'elle. Le Père Josselin donne son sel." },
        { label: "Se battre", consequence: "Jouer « Les Reflets du port ». Si Isabeau est frappée, elle s'efface, et le dé refroidit." },
      ],
    },
    {
      act: 4,
      title: "La compagnie du Héron",
      options: [
        { label: "Payer avec l'argent de Gombert", consequence: "Wendel reprend ses soixante livres et son dédit, et la compagnie quitte le lac avant la nuit. Il doit un service. Gombert est ruiné et tient l'équipe pour responsable." },
        { label: "Négocier un camp sur la glace", consequence: "Persuasion ou Intimidation DD 15 : la compagnie campe sur le lac, sous ses tentes, contre une partie du grain du village. Elle n'est pas sous un toit : personne ne paie pour elle. Ratée, Wendel entre dans l'île au coucher du soleil." },
        { label: "Se battre", consequence: "Jouer « Le bord de l'île ». Victoire : Wendel recule et campe sur la glace, et il n'y a rien à payer pour lui. Défaite : la compagnie prend le grain et dort au moulin, et Hugues dîme les foyers pour quarante étrangers." },
        { label: "Dire à Hugues qui est Colin", consequence: "Possible en plus de tout le reste, dans la file. Colin ne paie que ses deux souvenirs, Hugues ne prend rien d'autre à la masure, et Gombert doit payer lui-même." },
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
