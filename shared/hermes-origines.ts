// Origines jouables et historiques de la Cellule Hermès (contemporain, thriller d'espionnage, novembre 2026), d'après la bible (sections 5 et 9).
// Caractéristiques : 0 Force, 1 Adresse, 2 Endurance, 3 Savoir, 4 Instinct, 5 Présence.
// Les origines sont des métiers d'avant la Cellule, pas des essences : chacune a un petit défaut jouable, un contact, et un argent de départ en euros.
// Les compétences viennent des historiques ; les variantes ne donnent que leur trait propre (bible, section 5).
// Lu par les joueurs : aucun secret du canon ici.
import type { Background, Origin } from "./origins";

export const ORIGINES_HERMES: Origin[] = [
  {
    id: "he-armes",
    genre: "contemporain",
    name: "Gens d'armes",
    blurb: "Soldats de métier, gendarmes, démineurs. On sait se déplacer, tenir un lieu, lire un terrain, et on supporte l'attente.",
    bonus: { 2: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Tenir un lieu", text: "Tu sais te poster, attendre et lire un terrain. Avantage aux tests de Perception et de Survie pour tenir une planque, une surveillance ou un poste de nuit, et tu ne perds rien à attendre six heures dans une voiture." },
      { name: "Un ancien camarade", text: "Tu connais encore quelqu'un à la caserne, à la brigade ou au dépôt. Une fois par mission, il te donne un renseignement sur un lieu, un convoi ou un homme, à voix basse, sans rien écrire. Argent de départ : 200 euros." },
      { name: "Le dos droit", text: "Tout le monde devine que tu as servi. Désavantage à ton premier test de Tromperie de chaque séance pour passer pour un civil sans histoire." },
    ],
    subs: [
      {
        id: "he-armes-para",
        name: "Ancien parachutiste",
        blurb: "Dix ans de régiment, départ après une blessure au genou. Tu as tenu des postes de nuit et tu sais compter les secondes.",
        bonus: { 0: 1, 2: 1 },
        traits: [
          { name: "Un camarade qui trouve", text: "Tu connais un ancien camarade qui te trouve un pistolet une fois par mois de jeu, sans le prix du marché noir. L'arme n'a pas de papiers : tu la rends avant la fin de la mission, ou tu t'en débarrasses." },
        ],
      },
      {
        id: "he-armes-logisticien",
        name: "Logisticien militaire",
        blurb: "Camions, convois, ravitaillement. Tu sais ce qu'un convoi consomme et ce qu'il laisse.",
        bonus: { 2: 1, 3: 1 },
        traits: [
          { name: "Un entrepôt, un camion", text: "Une fois par mission, un ancien collègue te prête un véhicule lourd ou un entrepôt. Tu sais compter les litres : tu sais toujours combien de kilomètres il reste au réservoir, et combien de temps tient une réserve." },
        ],
      },
    ],
  },
  {
    id: "he-enquete",
    genre: "contemporain",
    name: "Gens de l'enquête",
    blurb: "Policiers, inspecteurs, analystes. On connaît les procédures et les failles des procédures.",
    bonus: { 4: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Les failles de la procédure", text: "Tu sais ce qu'un enquêteur remarque, et ce qu'il oublie. Avantage aux tests d'Investigation pour trouver ce que la police aurait manqué sur une scène, et pour deviner ce qu'elle cherche." },
      { name: "Un collègue au téléphone", text: "Il reste dans ta vie un collègue, un greffier, un ancien chef. Une fois par semaine de jeu, tu apprends en dix minutes si une personne a un casier, une plainte ou un mandat. Argent de départ : 180 euros." },
      { name: "L'habitude de poser des questions", text: "On t'a vu venir : désavantage à ton premier test de Discrétion de chaque séance contre un policier ou un agent de sécurité qui connaît la procédure." },
    ],
    subs: [
      {
        id: "he-enquete-pj",
        name: "Enquêteur de police judiciaire",
        blurb: "En disponibilité depuis une affaire que ton chef a classée. Tu en parles peu.",
        bonus: { 4: 1, 5: 1 },
        traits: [
          { name: "Un officier dans la ville", text: "Une fois par mission, tu connais un officier de police dans la ville où tu travailles. Il te répond, il ne te couvre pas." },
        ],
      },
      {
        id: "he-enquete-analyste",
        name: "Analyste de renseignement",
        blurb: "Écrans, notes, schémas. Tu as lu des milliers de pages pour en retenir trois lignes.",
        bonus: { 3: 1, 4: 1 },
        traits: [
          { name: "Lecture en diagonale", text: "Lecture en diagonale : avantage aux tests d'Investigation pour trouver une information dans un dossier de plus de cent pages." },
        ],
      },
    ],
  },
  {
    id: "he-chiffre",
    genre: "contemporain",
    name: "Gens du chiffre",
    blurb: "Informaticiens, techniciens, radios. Les serrures numériques, les réseaux, les téléphones et leurs fuites.",
    bonus: { 1: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Une panne, ça se lit", text: "Tu lis un équipement qui ne marche pas comme un autre lit une lettre. Avantage aux tests d'Investigation pour trouver pourquoi un téléphone, un badge, une alarme ou une caméra se comporte comme il le fait." },
      { name: "Un fournisseur", text: "Tu sais où se trouve le bon fournisseur de matériel dans chaque grande ville : prix honnêtes, aucune question. Tu paies ton matériel 20 % de moins. Argent de départ : 220 euros." },
      { name: "Les yeux dans l'écran", text: "Tu fixes ce qui n'est pas là. Désavantage à ton premier test de Perception de chaque séance sur une scène en mouvement, en plein jour, où il faut regarder autour de toi." },
    ],
    subs: [
      {
        id: "he-chiffre-info",
        name: "Informaticien de sécurité",
        blurb: "Tests d'intrusion, contrats avec des banques. Tu sais ouvrir ce que les autres ferment.",
        bonus: { 1: 1, 3: 1 },
        traits: [
          { name: "Effacer sans témoin", text: "Effacer une trace numérique sans témoin ne demande aucun jet, mais la baisse reste celle de la règle." },
        ],
      },
      {
        id: "he-chiffre-telecoms",
        name: "Technicien télécoms",
        blurb: "Antennes, câbles, brouilleurs. Tu sais où l'on cache un micro parce que tu en as posé.",
        bonus: { 1: 1, 4: 1 },
        traits: [
          { name: "L'antenne du quartier", text: "Tu retrouves en dix minutes l'antenne ou l'armoire de rue qui dessert un quartier. Avantage en Investigation pour remonter l'origine d'un signal." },
        ],
      },
    ],
  },
  {
    id: "he-argent",
    genre: "contemporain",
    name: "Gens de l'argent",
    blurb: "Comptables, banquiers, courtiers. Les flux, les montages, les gens qui paient.",
    bonus: { 3: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Suivre l'argent", text: "Tu lis un relevé comme une carte. Avantage aux tests d'Investigation et d'Histoire sur un bilan, un relevé, une facture, un montage de sociétés." },
      { name: "Un compte qui répond", text: "Une fois par mission, un banquier, un comptable ou un notaire que tu connais répond à ta question sur une société ou un compte, sans note ni trace. Argent de départ : 300 euros." },
      { name: "Les mains propres", text: "Tu n'as jamais porté une arme : désavantage à tes premières attaques de chaque scène de combat avec une arme à feu, le temps de t'y mettre." },
    ],
    subs: [
      {
        id: "he-argent-comptable",
        name: "Expert-comptable judiciaire",
        blurb: "Mandats de tribunaux, audits de faillite. Tu lis un bilan comme une carte.",
        bonus: { 3: 1, 4: 1 },
        traits: [
          { name: "Une porte administrative", text: "Une fois par mission, ta carte d'expert ouvre une porte administrative : un greffe, un registre, un tribunal de commerce." },
        ],
      },
      {
        id: "he-argent-banquier",
        name: "Banquier privé",
        blurb: "Clients riches, discrétion. Tu sais ce qu'un client cache à la façon dont il s'assoit.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Un compte de réserve", text: "Un compte de 1 000 € de réserve, et on te prend pour un client dans n'importe quelle banque. Un virement de cette réserve compte comme un virement non prévu pour l'Empreinte." },
        ],
      },
    ],
  },
  {
    id: "he-monde",
    genre: "contemporain",
    name: "Gens du monde",
    blurb: "Interprètes, journalistes, attachés de presse, diplomates mineurs. Les salons, les langues, les cartes de visite.",
    bonus: { 5: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Une carte de visite", text: "Avantage aux tests de Persuasion et de Représentation dans un salon, un hall d'hôtel ou une réception : tu sais quoi dire, à qui, et qui regarde." },
      { name: "Un nom qu'on reconnaît", text: "Une fois par semaine de jeu, une personne que tu as croisée dans ton ancien métier répond à ton appel, te reçoit dix minutes et te dit ce qu'elle sait. Argent de départ : 250 euros." },
      { name: "Trop de monde te connaît", text: "Tu as été sur des photos. Désavantage à ton premier test de Discrétion de chaque séance dans un lieu où l'on te reconnaît peut-être : un salon, une salle de presse, un hôtel de luxe." },
    ],
    subs: [
      {
        id: "he-monde-interprete",
        name: "Interprète de conférence",
        blurb: "Tu es dans la pièce sans y être.",
        bonus: { 3: 1, 5: 1 },
        traits: [
          { name: "Quatre langues", text: "Tu parles quatre langues, cinq avec un dictionnaire. Tu es dans la pièce, et personne ne te regarde : avantage aux tests de Perception sur une conversation que tu écoutes en faisant semblant d'être un interprète ou un assistant." },
        ],
      },
      {
        id: "he-monde-journaliste",
        name: "Journaliste ou chargé de communication",
        blurb: "Tu as posé des questions à ceux qui ne voulaient pas répondre.",
        bonus: { 4: 1, 5: 1 },
        traits: [
          { name: "Une explication plausible", text: "Tu as une carte de presse, des contacts dans les rédactions, et toujours une explication plausible pour poser des questions. Avantage à tes tests de Persuasion et de Tromperie quand tu poses des questions au nom d'un journal." },
        ],
      },
    ],
  },
  {
    id: "he-passage",
    genre: "contemporain",
    name: "Gens de passage",
    blurb: "Chauffeurs, urgentistes, dockers, livreurs. Les routes, les nuits, les gens qu'on ne remarque pas.",
    bonus: { 0: 1 },
    speed: 6,
    unique: true,
    traits: [
      { name: "Les gens qu'on ne remarque pas", text: "Un livreur, un chauffeur, un infirmier qui passe : personne ne le regarde. Avantage aux tests de Discrétion pour te fondre dans un lieu de passage : une gare, un quai, un hall d'hôpital, une zone de livraison." },
      { name: "Un relais", text: "Sur ta route, il y a un parking, une halte, un poste où l'on te connaît. Une fois par semaine de jeu, tu y trouves une nuit de sommeil, une douche et un café, sans question. Argent de départ : 150 euros." },
      { name: "Des horaires impossibles", text: "Tu as dormi en morceaux pendant des années : désavantage à ton premier test d'Intuition ou de Perception de chaque séance qui commence tôt le matin ou tard la nuit, quand on t'a sorti du lit." },
    ],
    subs: [
      {
        id: "he-passage-routier",
        name: "Chauffeur routier",
        blurb: "Tu connais les parkings, les haltes, les douaniers de chaque col.",
        bonus: { 0: 1, 4: 1 },
        traits: [
          { name: "Toute une nuit au volant", text: "Camions, remorques, permis spéciaux : tu conduis toute une nuit sans fatigue, et un permis poids lourd t'ouvre toute l'Europe." },
        ],
      },
      {
        id: "he-passage-urgentiste",
        name: "Urgentiste",
        blurb: "Tu as vu mourir quelqu'un le premier soir et recommencé le lendemain.",
        bonus: { 2: 1, 4: 1 },
        traits: [
          { name: "Une minute pour tenir", text: "Tu stabilises un blessé en une minute, et ton uniforme n'est arrêté par personne : un cordon de police laisse passer une blouse et un sac rouge." },
        ],
      },
    ],
  },
];

export const HISTORIQUES_HERMES: Background[] = [
  {
    id: "he-h-parachutiste",
    genre: "contemporain",
    name: "Parachutiste",
    blurb: "Tu as tenu des postes de nuit et tu sais compter les secondes.",
    skills: ["Athlétisme", "Perception"],
    tool: "Boussole et cartes d'état-major",
    gear: ["Boussole et carte routière", "Lampe frontale", "Sac à dos neutre", "Couteau de poche", "Rations et gourde", "200 euros"],
    feature: { name: "Le poste de nuit", text: "Tu peux rester immobile et attentif toute une nuit sans en payer la fatigue le lendemain. Un ancien du régiment te trouve un lit et un repas dans n'importe quelle ville de garnison." },
  },
  {
    id: "he-h-logisticien",
    genre: "contemporain",
    name: "Logisticien",
    blurb: "Tu sais ce qu'un convoi consomme et ce qu'il laisse.",
    skills: ["Survie", "Investigation"],
    tool: "Véhicules terrestres",
    gear: ["Carnet de route", "Lampe de poche", "Gilet de chantier", "Couteau de poche", "Gants de travail", "180 euros"],
    feature: { name: "Ce qu'un convoi laisse", text: "Tu lis une plate-forme logistique, un parking de camions ou un plan de chargement et tu sais en dix minutes quand part quoi, et avec qui." },
  },
  {
    id: "he-h-enqueteur",
    genre: "contemporain",
    name: "Enquêteur",
    blurb: "Tu connais les procédures, et ce que les procédures oublient.",
    skills: ["Investigation", "Intimidation"],
    tool: "Matériel de relevé (gants, sachets, loupe)",
    gear: ["Carnet à spirale", "Gants fins et sachets", "Lampe de poche", "Téléphone jetable", "Anciens procès-verbaux photocopiés", "180 euros"],
    feature: { name: "Un collègue qui répond", text: "Dans un commissariat ou une brigade, tu retrouves quelqu'un qui te répond à voix basse. Une fois par semaine de jeu, il te dit si une personne est connue des services ou recherchée." },
  },
  {
    id: "he-h-analyste",
    genre: "contemporain",
    name: "Analyste",
    blurb: "Tu as lu des milliers de pages pour en retenir trois lignes.",
    skills: ["Histoire", "Intuition"],
    tool: "Tableur et logiciel de cartographie",
    gear: ["Ordinateur portable propre", "Cahier de notes", "Marqueurs de couleur", "Carte routière annotée", "Téléphone jetable", "220 euros"],
    feature: { name: "Un schéma en une heure", text: "En une heure, avec un dossier et un tableau, tu fais apparaître les liens entre personnes, dates et lieux d'une affaire. Avantage à ton test d'Investigation pour repérer la lacune la plus importante du dossier." },
  },
  {
    id: "he-h-informaticien",
    genre: "contemporain",
    name: "Informaticien",
    blurb: "Tu sais ouvrir ce que les autres ferment.",
    skills: ["Investigation", "Escamotage"],
    tool: "Outils de réseau et de sécurité informatique",
    gear: ["Ordinateur portable propre", "Clé de chiffrement", "Câbles et adaptateurs", "Sac à dos neutre", "Téléphone jetable", "250 euros"],
    feature: { name: "Une porte dérobée", text: "Dans un bureau ou un hôtel, tu trouves une prise réseau, un terminal ou une borne que personne ne surveille. Avec dix minutes et un ordinateur, tu lis ce que l'équipement du lieu dit sur lui-même." },
  },
  {
    id: "he-h-technicien",
    genre: "contemporain",
    name: "Technicien télécoms",
    blurb: "Tu sais où l'on cache un micro parce que tu en as posé.",
    skills: ["Perception", "Investigation"],
    tool: "Outils de télécommunications",
    gear: ["Mallette d'outils", "Détecteur de champ", "Gilet de chantier et casque", "Téléphone jetable", "Rouleau de câble", "200 euros"],
    feature: { name: "Le gilet qui ouvre", text: "En gilet de chantier avec ta mallette, tu entres sans question dans un local technique, un sous-sol ou un toit-terrasse, à condition que personne ne connaisse l'équipe qui y travaille vraiment." },
  },
  {
    id: "he-h-comptable",
    genre: "contemporain",
    name: "Comptable",
    blurb: "Tu lis un bilan comme une carte.",
    skills: ["Investigation", "Histoire"],
    tool: "Matériel de comptabilité",
    gear: ["Ordinateur portable propre", "Calculatrice", "Dossiers photocopiés", "Costume sombre", "Carte d'expert", "300 euros"],
    feature: { name: "Un bilan en vingt minutes", text: "Tu lis un bilan, un relevé ou un registre de société en vingt minutes et tu sais où l'argent s'arrête. Avantage à ton test d'Investigation pour trouver la ligne qui ne colle pas." },
  },
  {
    id: "he-h-banquier",
    genre: "contemporain",
    name: "Banquier",
    blurb: "Tu sais ce qu'un client cache à la façon dont il s'assoit.",
    skills: ["Persuasion", "Intuition"],
    tool: "Matériel de bureau et cartes de visite",
    gear: ["Costume sombre", "Cartes de visite", "Stylo-plume", "Téléphone jetable", "Montre sobre", "400 euros"],
    feature: { name: "Un accueil de client", text: "Dans une banque, un hôtel ou un bureau d'avocats, on te traite en client : on te sert un thé, on te laisse seul dans la pièce un instant, on ne te demande pas pourquoi tu es venu." },
  },
  {
    id: "he-h-interprete",
    genre: "contemporain",
    name: "Interprète",
    blurb: "Tu es dans la pièce sans y être.",
    skills: ["Persuasion", "Intuition"],
    tool: "Dictionnaires et casque d'interprétation",
    gear: ["Dictionnaires de poche", "Casque d'interprète", "Carnet de notes", "Costume sombre", "Cartes de visite", "250 euros"],
    feature: { name: "Une pièce, quatre langues", text: "Dans une réunion, un salon ou un bureau, on te laisse entendre ce qu'on n'oserait pas dire devant un invité. Tu comprends ce qui se dit en quatre langues, sans qu'on te le fasse remarquer." },
  },
  {
    id: "he-h-journaliste",
    genre: "contemporain",
    name: "Journaliste",
    blurb: "Tu as posé des questions à ceux qui ne voulaient pas répondre.",
    skills: ["Persuasion", "Tromperie"],
    tool: "Appareil photo et enregistreur",
    gear: ["Carte de presse", "Enregistreur discret", "Carnet à spirale", "Appareil photo compact", "Téléphone jetable", "220 euros"],
    feature: { name: "Une carte de presse", text: "Une rédaction, un standard, un attaché de presse te prend au téléphone : une fois par semaine de jeu, tu obtiens un rendez-vous ou un document public que les autres attendraient une semaine." },
  },
  {
    id: "he-h-routier",
    genre: "contemporain",
    name: "Routier",
    blurb: "Tu connais les parkings, les haltes, les douaniers de chaque col.",
    skills: ["Survie", "Perception"],
    tool: "Véhicules terrestres",
    gear: ["Atlas routier", "Thermos", "Lampe frontale", "Gants de travail", "Carte de chauffeur", "160 euros"],
    feature: { name: "Les haltes", text: "Dans toute aire de repos, tout parking de poids lourds, on te laisse passer la nuit et on te dit sans te le demander ce qui a bougé sur la route : barrages, contrôles, accidents." },
  },
  {
    id: "he-h-urgentiste",
    genre: "contemporain",
    name: "Urgentiste",
    blurb: "Tu as vu mourir quelqu'un le premier soir et recommencé le lendemain.",
    skills: ["Médecine", "Intuition"],
    tool: "Matériel de secours",
    gear: ["Trousse de secours complète", "Gants et compresses", "Tenue d'ambulancier", "Lampe stylo", "Téléphone jetable", "160 euros"],
    feature: { name: "On ne refuse pas un secouriste", text: "Un cordon de police, un vigile ou un portier laisse passer quelqu'un qui porte une trousse rouge et dit qu'il y a un blessé. Les services d'urgence te traitent en collègue." },
  },
];

/** Suggestions de personnalité de la Cellule Hermès (le joueur peut toujours écrire la sienne). */
export const PERSONNALITE_HERMES: Record<"trait" | "ideal" | "bond" | "flaw", string[]> = {
  trait: [
    "Je m'assois toujours face à la porte, même chez ma mère.",
    "Je note les plaques d'immatriculation sans le vouloir, et je les oublie après sept jours.",
    "Je compte les sorties d'un lieu avant d'y entrer.",
    "Je ne dis jamais mon prénom en entier, même à des gens que j'aime.",
    "Je laisse mon téléphone dans mon sac, et le sac dans un autre sac.",
    "Je réponds à chaque question par une question, avec politesse.",
  ],
  ideal: [
    "Rentrer chez soi. Le reste est du travail.",
    "La vérité, quand on peut la prouver.",
    "Que mes collègues sortent vivants de chaque mission.",
    "Que personne ne soit puni pour ce qu'il n'a pas fait.",
    "L'ordre. Un monde où les services servent à quelque chose.",
    "La liberté de ne plus rendre de comptes à personne.",
  ],
  bond: [
    "Ma sœur croit que je travaille dans l'import-export. Je lui envoie une carte de chaque ville.",
    "Un ancien camarade m'a trouvé un lit un soir où j'en avais besoin, et je lui dois ça.",
    "J'ai laissé un enfant chez ses grands-parents pour cette mission, et je compte les jours.",
    "La Mercerie est la seule maison où j'ai une clef.",
    "Une inspectrice m'a laissé partir une fois. Je ne sais pas pourquoi.",
    "Quelqu'un à Marseille a gardé mes affaires, au cas où.",
  ],
  flaw: [
    "Je ne peux pas laisser un pli sans réponse, même quand il faudrait.",
    "Je mens sur ce que j'ai fait avant, et je ne me souviens plus des versions.",
    "Je ne fais confiance à personne qui n'a pas pris de risque avec moi.",
    "Je dors mal si je ne sais pas qui possède la clef de la porte.",
    "J'ai peur du bruit d'une arme que l'on charge, et je préfère mourir que l'avouer.",
    "Je dépense l'argent de la Caisse comme si c'était le mien.",
  ],
};
