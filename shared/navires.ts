// Navires des Îles du Vent (pirates, Antilles, 1716) : postes, modèles, pièces d'artillerie, actions et vocabulaire.
// shared/vaisseaux.ts les consulte quand la partie est de genre « pirates » (`marine(genre)`) et joue les actions (jouerNavire).
// Les chiffres des pièces viennent de shared/iles-regles.ts (canon de 8 : 4d10, 36 m ; pierrier : 2d8, 18 m) ; les CA
// et les équipages, des fiches de navires de shared/iles-bestiaire.ts. Une case de la carte fait 1,5 m : 36 m = 24 cases, 18 m = 12 cases.
// Rien de secret ici : les joueurs lisent ces tables dans le livre.
import type { ActionDePoste, Marine, Modele, PosteDef } from "./vaisseaux";

/** Portée du canon de 8 (36 m) et du pierrier (18 m) en cases de 1,5 m. */
export const PORTEE_CANON = 24;
export const PORTEE_PIERRIER = 12;
/** Les grappins ne mordent qu'à cette distance (en cases, de centre à centre). */
export const PORTEE_GRAPPINS = 3;

export const POSTES_NAVIRE: PosteDef[] = [
  { id: "capitaine", nom: "Capitaine", stat: 5, role: "Crie les ordres, mène l'abordage : tout l'équipage frappe plus juste." },
  { id: "pilote", nom: "Barreur", stat: 1, role: "Tient la barre : vire de bord, prend le vent, fuit." },
  { id: "artilleur", nom: "Canonnier", stat: 1, role: "Sert les pièces : tire, recharge, lâche la bordée." },
  { id: "mecanicien", nom: "Maître de manœuvre", stat: 2, role: "Aveugle les voies d'eau, rétablit le gréement." },
  { id: "vigie", nom: "Gabier de vigie", stat: 4, role: "Guette depuis la hune, désigne la cible, lance les grappins." },
];

const canon = (bonus: number, pieces: number) => ({ nom: "Canons de 8", bonus, degats: "4d10", portee: PORTEE_CANON, pieces, chargees: pieces, servants: 2 });
const pierrier = (bonus: number, pieces: number) => ({ nom: "Pierriers", bonus, degats: "2d8", portee: PORTEE_PIERRIER, pieces, chargees: pieces, servants: 1, contre: "hommes" as const });

export const MODELES_NAVIRE: Modele[] = [
  {
    id: "sloop",
    nom: "Sloop",
    description: "Un grand mât, un long beaupré, quarante hommes à la part. Le navire des flibustiers : il passe où une frégate s'échoue.",
    taille: 2, coque: 100, boucliers: 40, ca: 15, vitesse: 12, soute: 4, hommes: 40,
    armes: [canon(5, 4), pierrier(4, 2)],
    defauts: [{ nom: "Faible tirant d'eau", texte: "Il passe sur les hauts-fonds où un navire plus lourd s'échoue. Sur une case de haut-fond, c'est le MJ qui décide ce qu'un autre navire risque." }],
  },
  {
    id: "goelette",
    nom: "Goélette",
    description: "Deux mâts, des voiles auriques, une coque fine. Les contrebandiers l'aiment parce qu'elle remonte au vent mieux que tout ce qui flotte.",
    taille: 2, coque: 110, boucliers: 45, ca: 15, vitesse: 11, soute: 6, hommes: 30,
    armes: [canon(5, 4), pierrier(4, 4)],
    defauts: [{ nom: "Remonte au vent", texte: "Sa coque fine tient le près mieux que tout ce qui flotte : quand la chasse se joue contre le vent, le MJ lui laisse l'avantage de la route." }],
  },
  {
    id: "brigantin",
    nom: "Brigantin",
    description: "Deux mâts à voiles carrées, une vingtaine de mètres, soixante hommes. Le navire des Frères de la Côte quand la prise vaut le risque.",
    taille: 3, coque: 150, boucliers: 60, ca: 16, vitesse: 10, soute: 8, hommes: 60,
    armes: [canon(5, 6), pierrier(4, 4)],
    defauts: [],
  },
  {
    id: "fregate",
    nom: "Frégate",
    description: "Trois mâts, deux ponts de canons, cent soixante hommes et un pavillon de roi. Un navire de guerre, qu'un équipage libre ne combat qu'à la nuit ou au vent.",
    taille: 3, coque: 240, boucliers: 90, ca: 17, vitesse: 9, soute: 10, hommes: 160,
    armes: [canon(6, 8), pierrier(5, 6)],
    defauts: [],
  },
  {
    id: "galion-garde-cote",
    nom: "Galion garde-côte",
    description: "Une haute coque de chêne peinte de rouge et d'or, deux ponts de canons, deux cents hommes. Il garde la chaîne d'un port et les routes de la Floride.",
    taille: 4, coque: 260, boucliers: 110, ca: 17, vitesse: 6, soute: 20, hommes: 200,
    armes: [canon(5, 8), pierrier(4, 6)],
    defauts: [{ nom: "Haute coque, lent", texte: "Il vire mal et lentement. Ses sabords bas ne sont pas faits pour ce qui passe sous son vent : le MJ décide ce que valent ses pièces contre un navire plus petit qui le contourne." }],
  },
];

export const ACTIONS_NAVIRE: ActionDePoste[] = [
  { id: "ordre", poste: "capitaine", nom: "Crier l'ordre", texte: "Test de Présence DD 12 : réussi, chaque tir du navire a +2 jusqu'au prochain round." },
  { id: "aborder", poste: "capitaine", nom: "Ordonner l'abordage", texte: "Les grappins doivent tenir les deux navires. Coup de main : coûte 1 de Moral, impossible à 1 ou moins. Les équipages passent au combat à pied sur le pont.", cible: true },
  { id: "esquive", poste: "pilote", nom: "Virer de bord", texte: "Test d'Adresse : +2 CA jusqu'au prochain round (DD 12), +4 sur 18 ou plus. Impossible si le gréement est tombé." },
  { id: "vent", poste: "pilote", nom: "Prendre le vent", texte: "Test d'Adresse DD 12 : réussi, la vitesse monte d'un quart (au moins une case) jusqu'au prochain round. Impossible si le gréement est tombé." },
  { id: "fuir", poste: "pilote", nom: "Fuir", texte: "Test d'Adresse contre un DD de 12 plus la vitesse du poursuivant moins la tienne (de 8 à 18). Deux réussites avant la troisième touche, et le navire décroche. Impossible si le gréement est tombé.", cible: true },
  { id: "tirer", poste: "artilleur", nom: "Tirer", texte: "Une pièce : d20 + Adresse + bonus de l'arme contre la CA. Le canon frappe la coque, ou le gréement avec −2. Le pierrier balaie le pont et fauche des hommes.", cible: true, arme: true },
  { id: "bordee", poste: "artilleur", nom: "Bordée", texte: "Toutes les pièces chargées de l'arme tirent ensemble, chacune avec son jet.", cible: true, arme: true },
  { id: "recharger", poste: "artilleur", nom: "Recharger", texte: "Toutes les pièces de l'arme choisie sont rechargées. Une pièce tirée reste vide jusque-là.", arme: true },
  { id: "reparer", poste: "mecanicien", nom: "Aveugler les voies d'eau", texte: "La coque regagne 1d8 + Endurance points." },
  { id: "boucliers", poste: "mecanicien", nom: "Rétablir le gréement", texte: "Le gréement regagne 2d6 + Endurance points." },
  { id: "designer", poste: "vigie", nom: "Guetter la cible", texte: "Test d'Instinct DD 12 : réussi, le prochain tir du navire a l'avantage." },
  { id: "grappins", poste: "vigie", nom: "Lancer les grappins", texte: `Test d'Adresse DD 12, à ${PORTEE_GRAPPINS} cases au plus de l'autre navire : réussi, les deux navires sont accrochés.`, cible: true, stat: 1 },
  { id: "couper", poste: "vigie", nom: "Couper les grappins", texte: "Test de Force DD 12 : réussi, les navires se décrochent.", stat: 0 },
];

export const MARINE_NAVIRES: Marine = {
  id: "pirates",
  navire: true,
  postes: POSTES_NAVIRE,
  actions: ACTIONS_NAVIRE,
  modeles: MODELES_NAVIRE,
  mots: {
    nom: "Navire",
    nomPluriel: "Navires",
    le: "le navire",
    du: "du navire",
    reserve: "Gréement",
    particularites: "Particularités",
    mettreEnMer: "Mettre à l'eau",
    neuf: "Remettre en état",
    exemple: "Nom (la Pie-Noire…)",
    vide: "Le MJ n'a pas encore mis votre navire à l'eau.",
    desempare: "À la dérive",
    desempareTexte: "plus de barre ni de pièces servies jusqu'à une réparation.",
    nouveauRound: "Nouveau round (virages, ordres et cibles guettées retombent)",
    nouveauRoundJournal: "Nouveau round : virages, ordres et cibles guettées retombent.",
    finDeCombat: "Fin du combat naval (hommes perdus remis à zéro)",
    finDeCombatJournal: "Fin du combat naval : le compte des hommes perdus repart à zéro.",
    visee: "Navire visé",
    ordreEffet: "ordre du capitaine (+2 aux tirs)",
    viseeEffet: "cible guettée (avantage)",
    ventEffet: "vent pris (vitesse accrue)",
    poser: "Pose le pion du navire sur la carte (de préférence une carte de pleine mer)",
    equipageGroupe: "Celui du groupe",
    equipageAutre: "PNJ ou ennemi",
    carte: "mer",
    carteLabel: "Pleine mer (navires)",
  },
};
