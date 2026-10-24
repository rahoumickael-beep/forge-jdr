// Bibliothèque de la Côte des Noyés (horreur, 1923) : scénarios écrits à la main, prêts à jouer.
// Code du MJ seulement (comme library.ts) : les secrets des PNJ y sont en clair.
import type { Scenario } from "./types";

/** Campagne « La Côte des Noyés », scénario 1 : ouverture, niveau 1. */
export const NUMERO_ONZE: Scenario = {
  id: "bib-hr-numero-onze",
  title: "Le numéro onze",
  genre: "horreur",
  ton: "sombre",
  level: 1,
  players: 4,
  source: "bibliotheque",
  hook:
    "Le Havre, 13 septembre 1923. Anatole Brévin, directeur de la Havraise, vous remet une lettre de mission, quatre cents francs de frais et un billet pour le train du soir. « Dix noyés en six mois sur la même grève, messieurs-dames, et pas un bateau perdu. Trois de leurs lettres sont adressées à nos assurés. Établissez si c'est un sinistre au sens de nos contrats. Une chance sur trois que ce soit une farce. C'est peu. » Le lendemain, à l'aube, la mer de Saint-Clair rend le onzième.",
  synopsis:
    "Saint-Clair-sur-Mer, Cotentin, 14 septembre 1923. À la basse mer de l'aube, les pêcheurs trouvent un onzième Revenu : Lucien Tellier, trente ans, représentant en draps, complet gris, une alliance, un billet de train pour Cherbourg, une pièce neuve de cinquante centimes frappée en 1924, et une lettre à sa femme Germaine, à Rouen, datée de février 1924. Lucien Tellier est vivant ce matin, en tournée à Elbeuf, et ne sait rien ; les experts ne l'apprendront qu'à la séance suivante. Le maréchal des logis-chef Coquart veut faire emporter le corps par la voiture du parquet et classer ; le docteur Lécuyer veut le garder à sa morgue, où dix autres attendent sans pourrir, mais il lui faut une décharge signée au nom de la Havraise. Dans le bourg, Madame Vauquelin, médium du Cercle Thalassa, propose une séance le soir même « avec le numéro onze ». À la même heure, la chaussée du Rocher-Gris découvre pour une heure et demie, et le gardien du phare fait des signaux : il a vu le douzième arriver sous l'eau. Il faut choisir, ou se séparer. Vers minuit et demi, à la pleine mer, des contrebandiers débarquent de l'eau-de-vie de Jersey sur la grève et n'aiment pas les lanternes. À l'aube, la mer rend le douzième, et sa lettre est adressée à l'un des personnages.",
  acts: [
    {
      title: "La grève",
      location: "La grève de Saint-Clair à la basse mer de l'aube, puis le port",
      summary:
        "Six heures du matin, brume grise, la mer à un kilomètre. Une douzaine de pêcheurs en vareuse, béret à la main, autour d'un homme en complet gris couché sur le dos comme un dormeur. Il est froid, mais sa peau n'a pas la couleur d'un noyé ; ses doigts ne sont pas fripés (Médecine DD 12 : pas d'eau dans la bouche). Dans ses poches : un portefeuille au nom de Lucien Tellier, de Rouen, un billet de train Rouen-Cherbourg sans date, une pièce de cinquante centimes frappée en 1924, et une enveloppe cirée, que le vieux Marcel, le pêcheur qui l'a trouvé, a déjà sortie et garde dans son béret ; il la remet aux premiers venus. La feuille est pliée en deux, la seconde moitié au verso. Une odeur de goémon, et pas de sable sur les semelles. Coquart arrive à bicyclette avec deux gendarmes et une civière : le corps ira à Cherbourg, au parquet, « au sens du Code d'instruction criminelle », par la voiture qui arrive à cinq heures du soir ; d'ici là, un gendarme garde la morgue. Lécuyer, en manteau sur sa chemise de nuit, veut le garder : il ne peut le faire que si les experts signent une décharge au nom de la Havraise avant cinq heures. La lettre : le premier qui la lit en entier risque de la Marée (voir les notes). Compter 40 minutes.",
    },
    {
      title: "La morgue et le bourg",
      location: "La Morgue de l'Abri-du-Marin, l'auberge du Port, le marché, la poste",
      summary:
        "La morgue : une ancienne glacière de poissonnerie, dix tables de pierre, dix draps, dix étiquettes de carton. Il fait froid ; personne ne pourrit. Lécuyer mesure, note, photographie, et dit ses chiffres comme une prière : « Un mètre soixante-douze. Trente ans. Pas d'eau dans les poumons. Expliquez-moi ça. » Il montre les copies des dix lettres (Coquart garde les originales) ; une seule, celle du numéro sept, une jeune femme en manteau vert, contient un nom propre que Lécuyer a raturé sur sa copie parce qu'il « ne veut pas d'histoires avec la Compagnie » (Perspicacité DD 13 pour voir qu'il cache quelque chose ; Persuasion DD 15 : il avoue avoir raturé « le nom d'un navire, je crois », et que Coquart a l'original ; il n'en dit pas davantage, même sous la menace). Au bourg : à la poste, le télégramme pour Madame Germaine Tellier, rue Saint-Romain, à Rouen, part à neuf heures dix ; l'employée promet la réponse « dès que le facteur la trouve » ; à l'auberge, Madame Vauquelin, broche d'argent en forme de vague, invite les experts à une séance à six heures et demie à l'hôtel des Bains ; au marché, un gamin de dix ans, Jules, demande « les gens de l'assurance » de la part du gardien du phare : « Trois éclats de feu à la basse mer du soir. Et venez à pied. » À cinq heures, la voiture du parquet arrive : décharge signée ou corps emporté. Compter 50 minutes.",
    },
    {
      title: "Six heures et demie",
      location: "Le salon de l'hôtel des Bains, ou la chaussée et le phare du Rocher-Gris",
      summary:
        "La séance et la basse mer tombent à la même heure. Le salon : volets clos, six chaises, un guéridon, deux bourgeoises de Cherbourg, un étudiant, et Madame Vauquelin qui fait tourner la table avec son genou (Perspicacité DD 12 pour le voir). Puis, au milieu d'une phrase, elle se tait, et on entend dans la pièce le bruit d'une eau qui monte, très près ; la table se couvre de buée ; une voix d'homme, de sa bouche, dit : « Paul. Dis à Paul. » Chaque personnage qui pose une question à la voix fait une sauvegarde de Sang-froid DD 12 ou gagne 1 de Marée ; la voix répond en cinq mots ou moins, et ne parle que de Paul, et de « l'autre, en bas, qui attend la marée de l'aube ». Puis Madame Vauquelin s'évanouit, et ne fait plus semblant de rien. La chaussée : un mille de galets glissants qui découvrent pour une heure et demie, la mer de chaque côté. Le Bihan attend en haut du phare ; il a allumé sa lanterne en plein jour, à cause de la brume de mer qui revient de l'ouest. Il répète le dernier mot de chaque question puis répond à la précédente : « Le feu ? Le feu… Ça fait quatre ans que je suis seul. » Il montre son carnet : un trait par silhouette vue sous l'eau, quatre cent trente traits, et dit qu'il y en a un autre en bas, qui attend la marée de l'aube. Du haut de la lanterne, quand le faisceau passe dans la brume, on voit une rangée de silhouettes debout dans l'eau, immobiles, tournées vers la côte (sauvegarde de Sang-froid DD 13 : +1 de Marée en cas de réussite, +3 sinon). Il faut repartir avant que la mer ne remonte : trois réussites (Athlétisme ou Acrobaties, DD 12) avant trois échecs ; trois échecs, c'est l'eau jusqu'à la taille et la sauvegarde d'Endurance du froid. Compter 1 heure.",
    },
    {
      title: "La basse mer de l'aube",
      location: "La grève de Saint-Clair la nuit, puis à l'aube du 15 septembre",
      summary:
        "Un pêcheur a promis de veiller sur la grève toute la nuit, à cause du douzième. Vers minuit et demi, à la pleine mer, une barque sans feux accoste : trois contrebandiers débarquent des caisses d'eau-de-vie de Jersey, sans droits. Ils ont des gaffes, un revolver et un chien. Une lanterne sur la grève, à cette heure-là, c'est un douanier : ils tirent d'abord en l'air, puis pas en l'air. On peut se battre, se cacher (Discrétion DD 12), ou leur faire croire qu'on ne les a pas vus contre le prix du silence (Persuasion DD 13 ; ils paient en bouteilles). Leur chef, Gaston Hardouin, connaît la grève mieux que personne : s'il parle, il dit qu'il a vu, la semaine dernière, des gens marcher sous l'eau vers la côte, en habits de ville, « comme une procession ». À l'aube, à la basse mer, les pêcheurs crient : le douzième. Une femme de quarante ans en manteau de voyage. Dans sa poche, une enveloppe cirée, et sur l'enveloppe, le nom et l'adresse d'un des personnages, ou de quelqu'un qu'il aime. Compter 40 minutes.",
    },
  ],
  villain: {
    name: "Raymond Coquart, maréchal des logis-chef",
    motivation:
      "que l'affaire soit classée avant que Paris ne s'en mêle, parce que le procureur l'a exigé, et parce qu'une des lettres qu'il garde dans son tiroir est adressée à sa propre sœur",
    description:
      "Quarante ans, moustache de sous-officier, la vareuse boutonnée jusqu'au col même à six heures du matin. Ancien sergent de la Somme. Il cite le Code au lieu de répondre, et il appelle tout le monde « monsieur », femmes comprises, quand il est en colère. Il boutonne sa vareuse jusqu'au col quand il a peur, et il a peur depuis mars.",
  },
  npcs: [
    {
      name: "Hippolyte Lécuyer",
      role: "Médecin de Saint-Clair, gardien de la morgue",
      secret:
        "Il veut comprendre pourquoi ses morts ne pourrissent pas. Il a ouvert le numéro trois en juillet, et le cœur battait encore, très lentement, un coup par minute ; il l'a recousu et n'en a parlé à personne. Il a raturé sur sa copie le nom du navire écrit dans la lettre du numéro sept.",
      voice: "Parle par mesures et par chiffres, comme on récite : « Un mètre soixante-douze. Trente ans. Pas d'eau dans les poumons. » Essuie ses lunettes chaque fois qu'il ment.",
    },
    {
      name: "Irène Vauquelin",
      role: "Médium du Cercle Thalassa, à l'hôtel des Bains",
      secret:
        "Elle veut de l'argent, puis la vérité. Elle a acheté une lettre de Revenu à un gendarme, et depuis, pendant ses séances, elle entend vraiment quelqu'un qui se noie. Elle a peur, et elle ne s'arrête pas pour autant.",
      voice: "Baisse la voix au milieu des phrases, comme si quelqu'un écoutait derrière la porte. Appelle tout le monde « mon enfant ».",
    },
    {
      name: "Yves Le Bihan",
      role: "Gardien du phare du Rocher-Gris",
      secret:
        "Il veut qu'on le croie. Il a vu les Revenus marcher sous l'eau, en file, vers la côte, et il en tient le compte dans un carnet. Il refuse de parler devant Coquart, qui l'a traité d'ivrogne en juillet.",
      voice: "Répète le dernier mot de ce qu'on lui demande, puis répond à la question d'avant. Ne regarde jamais la mer en parlant d'elle.",
    },
    {
      name: "Gaston Hardouin",
      role: "Contrebandier, chef de la barque de la nuit",
      secret:
        "Il veut que personne ne voie ses caisses. Il a vu la procession sous l'eau la semaine dernière, et il n'est pas retourné en mer depuis ; ce soir, c'est sa dernière livraison, et il a bu pour la faire.",
      voice: "Commence presque chaque phrase par « dame » et la finit par « pas vrai, m'sieur ? ». Mange les r. « Dame, j'ai rien vu. Les caisses, c'est pas à moi, pas vrai, m'sieur ? »",
    },
  ],
  encounters: [
    {
      title: "Les contrebandiers (acte 4)",
      description:
        "Deux contrebandiers, leur chef et un chien sur une grève de nuit, sans lune, les caisses comme seul abri. Ils veulent fuir avec leur chargement, pas tuer : ils se replient vers la barque quand l'un d'eux tombe, ou quand Gaston est touché. Le sable mouillé est un terrain difficile. Une lanterne braquée sur un contrebandier lui impose le désavantage à son prochain tir.",
      enemies: [
        { name: "Contrebandier", count: 2, hp: 9, ac: 11, attack: "Gaffe +3, 1d6+1 perforants", danger: "Faible" },
        { name: "Gaston Hardouin", count: 1, hp: 13, ac: 12, attack: "Revolver d'ordonnance +3, 1d8 perforants, portée 15 m", danger: "Moyen" },
        { name: "Chien de la lande", count: 1, hp: 7, ac: 12, attack: "Morsure +3, 1d6+1 perforants, JS Force DD 11 ou à terre", danger: "Faible" },
      ],
      difficulty: "Moyenne à difficile (évitable)",
    },
    {
      title: "La chaussée (acte 3)",
      description:
        "Pas un combat : la mer. Trois réussites (Athlétisme ou Acrobaties DD 12, un jet par personnage et par tour, l'aide compte) avant trois échecs. Trois échecs : tout le groupe a de l'eau jusqu'à la taille, sauvegarde d'Endurance DD 12 ou un niveau d'épuisement, et quelqu'un doit être tiré (Athlétisme DD 13) avant le tour suivant.",
      enemies: [],
      difficulty: "Moyenne",
    },
  ],
  twists: [
    "Lucien Tellier est vivant, en tournée à Elbeuf. La réponse au télégramme n'arrive qu'à l'aube suivante : « Mon mari en tournée à Elbeuf jusqu'à samedi. Qui êtes-vous ? Germaine Tellier. » Garde-la pour la séance suivante : Germaine ne sait pas que son mari a un double à la morgue.",
    "La lettre du numéro sept, la seule qui nomme le navire, est raturée sur la copie de Lécuyer. L'original est dans le tiroir de Coquart. Ne la donne pas au niveau 1 : c'est le fil de la suite.",
    "Le douzième porte une lettre adressée à un personnage, ou à quelqu'un qu'il aime. Choisis-la avant la séance, et écris-la à la main sur cette trame : « Mon [lien]. Écris-moi vite. Je prends le bateau demain, comme convenu. Ne dis rien à [nom]. » Une page, datée de février 1924 en bas. Celui qui la lit en entier fait la sauvegarde de Sang-froid DD 12, comme pour la lettre du onzième.",
  ],
  rewards: [
    "La décharge signée vaut aux experts l'amitié du docteur Lécuyer, et l'accès à sa morgue pour toute la campagne ; elle vaut aussi un télégramme sec de Brévin.",
    "Le carnet de Le Bihan, ou sa confiance : il fera des signaux chaque fois qu'il verra la procession.",
    "Gaston Hardouin doit un service aux personnages s'ils ne l'ont pas dénoncé : une barque, la nuit, sans questions.",
    "Tout le groupe passe au niveau 2 à la fin de la séance.",
  ],
  gmNotes: `Ce scénario ouvre la campagne. Il doit faire passer trois choses, sans jamais les expliquer : les noyés ne sont pas morts comme les autres ; savoir coûte quelque chose (la Marée) ; les gens de Saint-Clair savent plus qu'ils ne disent, et ont peur des gens de la ville.

Le secret, pour toi seul : les Revenus sont ceux qui seront à bord de la Reine-Hortense, qui coulera dans la nuit du 13 au 14 février 1924. Lucien Tellier y montera. Rien de cela ne doit sortir ce soir. Personne, ce soir, ne prononce le nom du navire.

La lettre du numéro onze. La première moitié se lit sans risque : « Ma chérie, je t'écris vite. On dit que c'est le feu, en bas, mais c'est l'eau qui monte dans le couloir. Les garçons de cabine ne savent rien. Garde la maison, ne la vends pas à ton frère. » Celui qui lit la seconde moitié fait une sauvegarde de Sang-froid DD 12, ou gagne 1 de Marée (et un Présage) : « On ne descend pas les canots du côté où penche le navire. Un officier a crié qu'on avait fermé la porte de la soute avec des hommes dedans. Il fait très froid. Je t'aime. Dis à Paul que je n'ai pas eu peur. » Paul est leur fils, il a six ans.

Durée : environ 3 h 20. Mise en place : 10 minutes. Acte 1 : 40 minutes. Acte 2 : 50 minutes. Acte 3 : 1 heure. Acte 4 : 40 minutes. Si la soirée file, saute les contrebandiers : Gaston vient parler aux experts à l'auberge, ivre, et l'aube arrive plus vite.

Le choix de six heures et demie. Laisse les joueurs se séparer s'ils le veulent : c'est de l'horreur, la séparation fait partie du jeu. Joue les deux scènes en alternance, une minute chacune.

Coquart. Il ne ment pas, il se tait. Si un expert lui parle de sa sœur (il faut avoir vu, à la morgue, la copie de la lettre du numéro neuf, adressée à « Madame Hébert, née Coquart, Cherbourg » : Investigation DD 14), il pâlit, et il laisse le corps à Lécuyer sans décharge.

La Marée ce soir. Un personnage peut gagner beaucoup en une soirée (la chaussée, la lettre, la voix). Plafonne la montée à 3 par personnage pour cette séance ; le reste attend la suivante.

Au micro. Le ressac très loin, les mouettes, une civière qui grince ; pendant la séance, le silence, puis l'eau qui monte dans la pièce. Pour la voix de Lucien, parle bas, et toujours en phrases de cinq mots ou moins.

Règles du monde. La jauge des Passagers ne bouge pas ce soir : elle est à 1 412. Chaque Présage dépensé donne une Lame de fond au MJ. Si tu en as une à l'aube, dépense-la : la mer rend le douzième à trois pas du groupe, au milieu d'eux. Sinon, à dix pas.

Le groupe passe au niveau 2 à la fin de la séance, par jalon, sans compter l'XP.`,
  readAloud: [
    {
      act: 1,
      title: "La grève",
      text: "La mer est partie si loin qu'on ne l'entend plus. La grève est grise, plate, luisante, et la brume tient au ras du sable. Une douzaine de pêcheurs en vareuse forment un cercle, le béret à la main, sans parler. Au milieu, un homme en complet gris est couché sur le dos, les mains le long du corps, les yeux fermés, comme quelqu'un qui fait la sieste. Ses souliers de ville sont propres. Il n'y a pas de sable sur lui. Une mouette se pose à deux pas, le regarde, et repart.",
    },
    {
      act: 2,
      title: "La morgue",
      text: "La glacière sent le poisson et la pierre froide. Dix tables, dix draps, dix étiquettes de carton tenues par une ficelle au gros orteil. Le docteur Lécuyer soulève le premier drap sans prévenir : une jeune femme, la bouche entrouverte, les joues roses. « Le numéro un. Elle est là depuis mars. Six mois. » Il repose le drap avec douceur. « Elle devrait être un squelette. Expliquez-moi ça, vous qui venez du Havre. »",
    },
    {
      act: 3,
      title: "Six heures et demie",
      text: "Dans le salon, la lampe baisse d'elle-même. La table cesse de tourner. Madame Vauquelin a les yeux ouverts et ne vous regarde plus. Puis vous l'entendez tous : de l'eau qui monte, tout près, comme dans une baignoire qu'on remplit dans la pièce d'à côté, sauf qu'il n'y a pas de pièce d'à côté. La table se couvre de buée sous vos doigts. Une voix d'homme sort de la bouche de la médium, très calme : « Paul. Dis à Paul. »",
    },
    {
      act: 4,
      title: "La basse mer de l'aube",
      text: "Les pêcheurs crient avant que vous ne voyiez quoi que ce soit. Puis la brume s'ouvre, et elle est là, à trois pas de vous, sur le sable que vous venez de traverser : une femme en manteau de voyage, un chapeau à voilette encore épinglé. Dans sa main fermée, une enveloppe cirée. Sur l'enveloppe, une adresse que l'un de vous reconnaît.",
    },
  ],
  choices: [
    {
      act: 1,
      title: "Le corps du numéro onze",
      options: [
        { label: "Signer la décharge", consequence: "Le corps reste à la morgue de Lécuyer. Coquart note le nom de la Havraise dans son rapport. Brévin envoie un télégramme : « Vous engagez la maison. Expliquez-vous. »" },
        { label: "Laisser Coquart l'emporter", consequence: "Le corps part pour Cherbourg à cinq heures. Lécuyer en veut aux experts. À l'aube suivante, le douzième est couché à côté de l'endroit où Tellier a été trouvé, et le sable y est sec." },
        { label: "Faire plier Coquart", consequence: "Il faut sa sœur (voir les notes). Réussi, il laisse le corps sans décharge, et devient un allié froid. Raté, la gendarmerie est fermée aux experts pour toute la campagne." },
      ],
    },
    {
      act: 3,
      title: "Six heures et demie",
      options: [
        { label: "Aller à la séance", consequence: "La voix de Lucien, la buée, Madame Vauquelin qui s'évanouit et ne fait plus semblant : elle devient une alliée effrayée. Personne n'est allé au phare : Le Bihan ne fera plus de signaux avant une semaine." },
        { label: "Aller au phare", consequence: "Le carnet, la procession sous l'eau, la Marée. Le Bihan devient un allié. Madame Vauquelin, vexée, garde ce qu'elle a entendu pour un journaliste de Paris." },
        { label: "Se séparer", consequence: "Les deux scènes, chacune avec moins de monde. La chaussée est plus dure à moins de trois. Les deux groupes ont quelque chose à raconter à l'autre, et le MJ joue les deux en alternance." },
      ],
    },
    {
      act: 4,
      title: "Les contrebandiers",
      options: [
        { label: "Se cacher", consequence: "Discrétion DD 12. Ils déchargent et repartent. Personne ne parle à Gaston." },
        { label: "Acheter leur silence", consequence: "Persuasion DD 13 : ils paient en bouteilles, et Gaston raconte la procession. Il doit un service." },
        { label: "Se battre ou les dénoncer", consequence: "Jouer « Les contrebandiers ». Coquart est content, pour une fois. Gaston, pris, ne dira rien de la procession, par rancune." },
      ],
    },
  ],
  mapHint: {
    kind: "nature",
    seed: 1923,
    name: "La grève de Saint-Clair",
    width: 44,
    height: 32,
    labels: ["La grève", "Le port", "Chaussée du Rocher-Gris"],
  },
};
