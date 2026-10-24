// Vaisseaux : fiche, modèles, postes et actions de poste pour le combat de vaisseaux (l'Archipel) et de navires (les Îles du Vent).
// Fonctions pures : le serveur les appelle (server/index.ts), les tests les vérifient (vaisseaux.test.ts).
// Le serveur lance les dés ; chaque joueur ne joue que le poste que tient son personnage.
// Deux mondes ont un combat de ce genre. Les constantes POSTES, ACTIONS et MODELES sont celles de l'Archipel (science-fiction) ;
// shared/navires.ts porte celles des Îles du Vent, et `marine(genre)` choisit le jeu de règles et de mots du genre de la partie.
// Les identifiants de poste et d'action restent les mêmes d'un monde à l'autre (la fiche sauvegardée ne change pas) ; seuls
// les noms, les chiffres et le vocabulaire changent. Dans un navire, `boucliers` est le gréement.
import { rollDice, type DiceResult } from "./dice";
import { getGenre } from "./genres";
import { MARINE_NAVIRES, PORTEE_GRAPPINS } from "./navires";
import { uid } from "./random";
import type { Character, GenreId } from "./types";

export type Poste = "capitaine" | "pilote" | "artilleur" | "mecanicien" | "vigie";

export interface PosteDef {
  id: Poste;
  nom: string;
  stat: number;
  role: string;
}

/** Les postes, dans l'ordre de la fiche. `stat` : index de la caractéristique (0 Puissance … 5 Présence en SF). */
export const POSTES: PosteDef[] = [
  { id: "capitaine", nom: "Capitaine", stat: 5, role: "Donne les ordres : tout l'équipage frappe plus juste." },
  { id: "pilote", nom: "Pilote", stat: 1, role: "Esquive, poursuit, fuit." },
  { id: "artilleur", nom: "Artilleur", stat: 1, role: "Tient les tourelles." },
  { id: "mecanicien", nom: "Mécanicien", stat: 3, role: "Répare la coque, relance les boucliers." },
  { id: "vigie", nom: "Vigie", stat: 4, role: "Lit les détecteurs, désigne les cibles. Un Chantre y sent les coups venir." },
];

export interface Arme {
  nom: string;
  /** Bonus de l'arme au jet d'attaque, en plus de l'artilleur. */
  bonus: number;
  degats: string;
  /** Portée en cases de la carte. */
  portee: number;
  /** Navires : nombre de pièces de ce type (huit canons de 8 : `pieces: 8`). Absent dans un vaisseau. */
  pieces?: number;
  /** Navires : pièces chargées. Un coup, puis recharger. */
  chargees?: number;
  /** Navires : hommes qu'il faut pour servir une pièce. */
  servants?: number;
  /** Navires : « hommes » quand la pièce balaie le pont (le pierrier) ; sinon elle frappe la coque ou le gréement. */
  contre?: "hommes";
}

export interface Defaut {
  nom: string;
  texte: string;
}

export interface Vaisseau {
  id: string;
  nom: string;
  modele: string;
  /** « groupe » : le vaisseau des joueurs, qu'ils voient en entier ; « autre » : PNJ, ennemis. */
  equipage: "groupe" | "autre";
  coque: number;
  coqueMax: number;
  boucliers: number;
  bouclierMax: number;
  ca: number;
  /** Déplacement en cases par round sur la carte d'espace. */
  vitesse: number;
  /** Taille du pion en cases. */
  taille: number;
  soute: number;
  armes: Arme[];
  defauts: Defaut[];
  ameliorations: string[];
  /** Poste → fiche de personnage qui le tient. */
  postes: Partial<Record<Poste, string>>;
  /** Pion du vaisseau sur la carte, s'il est posé. */
  tokenId?: string;
  /** Effets qui durent jusqu'au prochain round : esquive (+CA), cible désignée par la vigie, ordre du capitaine, vent pris (navires). */
  effets: { esquive?: number; visee?: boolean; ordre?: boolean; vent?: boolean };
  /** Navires : Moral de l'équipage, de 0 à 10 (iles-regles.ts). */
  moral?: number;
  /** Navires : hommes à bord, au plus `hommesMax`. */
  hommes?: number;
  hommesMax?: number;
  /** Navires : hommes perdus depuis le début de ce combat (le Moral baisse de 1 au premier, de 1 de plus au-delà de cinq). */
  perdus?: number;
  /** Navires : id du navire auquel celui-ci est accroché par les grappins. */
  grappins?: string;
  /** Navires : fuite en cours, deux réussites avant la troisième touche. */
  fuite?: { reussites: number; touches: number };
  /** Un vaisseau caché n'est pas envoyé aux joueurs. */
  cache?: boolean;
  /** Notes du MJ, jamais envoyées aux joueurs. */
  notes?: string;
}

export interface Modele {
  id: string;
  nom: string;
  description: string;
  taille: number;
  coque: number;
  boucliers: number;
  ca: number;
  vitesse: number;
  soute: number;
  armes: Arme[];
  defauts: Defaut[];
  /** Navires : équipage au complet. */
  hommes?: number;
}

export const MODELES: Modele[] = [
  {
    id: "cargo-leger",
    nom: "Cargo léger",
    description: "Quarante ans de Routes, une soute pour six conteneurs, quatre couchettes. Le vaisseau de départ de l'équipage.",
    taille: 2, coque: 60, boucliers: 20, ca: 13, vitesse: 8, soute: 6,
    armes: [{ nom: "Tourelle dorsale", bonus: 4, degats: "2d8", portee: 12 }],
    defauts: [
      { nom: "Le compensateur tousse", texte: "Au premier saut de chaque séance, jet de Technique DD 12 du mécanicien, ou tout l'équipage est empoisonné (nausée) une heure." },
      { nom: "Le transpondeur ment", texte: "Il annonce encore l'ancien nom du vaisseau, recherché pour contrebande à Valcourt." },
      { nom: "La tourelle se bloque", texte: "Sur un 1 naturel au tir, la tourelle dorsale se bloque jusqu'à ce qu'on aille la débloquer à la main, dehors." },
    ],
  },
  {
    id: "chasseur",
    nom: "Chasseur",
    description: "Un seul pilote, deux canons, plus de moteur que de coque. La Ligue en aligne des escadrilles.",
    taille: 1, coque: 25, boucliers: 10, ca: 16, vitesse: 14, soute: 0,
    armes: [{ nom: "Canons jumelés", bonus: 5, degats: "2d6", portee: 10 }],
    defauts: [],
  },
  {
    id: "corvette-de-douane",
    nom: "Corvette de douane",
    description: "Blanche, frappée de la tour couronnée. Elle arraisonne les cargos à la sortie des Phares.",
    taille: 2, coque: 80, boucliers: 30, ca: 14, vitesse: 10, soute: 2,
    armes: [{ nom: "Tourelle de proue", bonus: 5, degats: "2d10", portee: 14 }],
    defauts: [],
  },
  {
    id: "corsaire",
    nom: "Corsaire de la Ligue",
    description: "Un cargo armé jusqu'aux écoutilles, peint d'une étoile rouge, rapide et mal entretenu.",
    taille: 2, coque: 70, boucliers: 25, ca: 15, vitesse: 12, soute: 3,
    armes: [
      { nom: "Canon de proue", bonus: 6, degats: "3d8", portee: 14 },
      { nom: "Tourelle ventrale", bonus: 5, degats: "2d8", portee: 12 },
    ],
    defauts: [{ nom: "Moteurs fatigués", texte: "Après trois rounds à pleine vitesse, la vitesse tombe à la moitié jusqu'à une réparation." }],
  },
  {
    id: "remorqueur-ferrailleur",
    nom: "Remorqueur de ferrailleurs",
    description: "Une carcasse de remorqueur couverte de grappins et de chalumeaux, qui découpe les épaves, et les vaisseaux vivants si on la laisse approcher.",
    taille: 3, coque: 90, boucliers: 10, ca: 12, vitesse: 6, soute: 10,
    armes: [
      { nom: "Harpon magnétique", bonus: 4, degats: "2d6", portee: 6 },
      { nom: "Chalumeau de coque", bonus: 4, degats: "4d6", portee: 2 },
    ],
    defauts: [],
  },
  {
    id: "fregate",
    nom: "Frégate hégémonique",
    description: "Le bras armé de l'Hégémonie dans la Frange : une batterie de proue, deux tourelles et une garnison.",
    taille: 3, coque: 200, boucliers: 80, ca: 17, vitesse: 10, soute: 4,
    armes: [
      { nom: "Batterie de proue", bonus: 8, degats: "4d10", portee: 20 },
      { nom: "Tourelles latérales", bonus: 7, degats: "2d10", portee: 14 },
    ],
    defauts: [],
  },
  {
    id: "cuirasse",
    nom: "Cuirassé hégémonique",
    description: "Six kilomètres d'acier blanc. Quand un cuirassé sort d'un Phare, on ne le combat pas : on le fuit.",
    taille: 4, coque: 500, boucliers: 200, ca: 18, vitesse: 6, soute: 20,
    armes: [
      { nom: "Grande batterie", bonus: 10, degats: "8d10", portee: 24 },
      { nom: "Tourelles de défense", bonus: 9, degats: "3d10", portee: 16 },
    ],
    defauts: [],
  },
];

// --- Actions de poste ---

export interface ActionDePoste {
  id: string;
  poste: Poste;
  nom: string;
  texte: string;
  /** Il faut viser un autre vaisseau. */
  cible?: boolean;
  /** Navires : l'action porte sur une arme (le joueur la choisit). */
  arme?: boolean;
  /** Navires : caractéristique de l'action, quand elle n'est pas celle du poste (index, comme `PosteDef.stat`). */
  stat?: number;
}

/** Les mots que l'écran affiche : aucun mot de science-fiction dans une partie de pirates, et inversement. */
export interface Mots {
  nom: string;
  nomPluriel: string;
  le: string;
  du: string;
  /** Nom de la seconde réserve de points (les boucliers d'un vaisseau, le gréement d'un navire). */
  reserve: string;
  particularites: string;
  mettreEnMer: string;
  neuf: string;
  exemple: string;
  vide: string;
  desempare: string;
  desempareTexte: string;
  nouveauRound: string;
  nouveauRoundJournal: string;
  /** Bouton de fin de combat du MJ, quand le monde en a un. */
  finDeCombat?: string;
  finDeCombatJournal?: string;
  visee: string;
  ordreEffet: string;
  viseeEffet: string;
  ventEffet?: string;
  poser: string;
  equipageGroupe: string;
  equipageAutre: string;
  /** Type de carte du combat. */
  carte: "espace" | "mer";
  carteLabel: string;
}

/** Le jeu de règles et de mots d'un monde : postes, actions, modèles, vocabulaire. */
export interface Marine {
  id: "science-fiction" | "pirates";
  /** Vrai pour un navire à voile : gréement, Moral, hommes, pièces à recharger, grappins, abordage. */
  navire: boolean;
  postes: PosteDef[];
  actions: ActionDePoste[];
  modeles: Modele[];
  mots: Mots;
}

const MARINE_VAISSEAUX: Marine = {
  id: "science-fiction",
  navire: false,
  postes: POSTES,
  /** Lu à l'appel, après la définition de ACTIONS plus bas. */
  get actions() {
    return ACTIONS;
  },
  modeles: MODELES,
  mots: {
    nom: "Vaisseau",
    nomPluriel: "Vaisseaux",
    le: "le vaisseau",
    du: "du vaisseau",
    reserve: "Boucliers",
    particularites: "Défauts",
    mettreEnMer: "Sortir du hangar",
    neuf: "Remettre à neuf",
    exemple: "Nom (la Pie-Grièche…)",
    vide: "Le MJ n'a pas encore sorti votre vaisseau du hangar.",
    desempare: "Désemparé",
    desempareTexte: "plus de moteurs ni d'armes jusqu'à une réparation.",
    nouveauRound: "Nouveau round (esquives et ordres retombent)",
    nouveauRoundJournal: "Nouveau round : esquives, ordres et cibles désignées retombent.",
    visee: "Vaisseau visé",
    ordreEffet: "ordre du capitaine (+2 aux tirs)",
    viseeEffet: "cible désignée (avantage)",
    poser: "Pose le pion du vaisseau sur la carte (de préférence une carte d'espace)",
    equipageGroupe: "Celui du groupe",
    equipageAutre: "PNJ ou ennemi",
    carte: "espace",
    carteLabel: "Espace (vaisseaux)",
  },
};

/** Les règles et les mots du genre de la partie. Les Îles du Vent ont leurs navires ; tout autre genre garde les vaisseaux de l'Archipel. */
export function marine(genre: GenreId | string | undefined): Marine {
  return genre === "pirates" ? MARINE_NAVIRES : MARINE_VAISSEAUX;
}

/** Ce genre a-t-il un combat de vaisseaux ou de navires ? (L'onglet n'existe que là, ou dès qu'une partie en compte un.) */
export const avecVaisseaux = (genre: GenreId | string | undefined) => genre === "science-fiction" || genre === "pirates";

/** Ce vaisseau est-il un navire à voile ? On le reconnaît à son modèle. */
export const estNavire = (v: Pick<Vaisseau, "modele">) => MARINE_NAVIRES.modeles.some((m) => m.id === v.modele);

export const modele = (id: string, genre?: GenreId | string) => marine(genre).modeles.find((m) => m.id === id);

export function nouveauVaisseau(modeleId: string, nom: string, equipage: Vaisseau["equipage"], genre: GenreId | string = "science-fiction"): Vaisseau {
  const m = modele(modeleId, genre) ?? marine(genre).modeles[0];
  const navire = marine(genre).navire;
  return {
    id: uid("v_"),
    nom: nom.trim().slice(0, 40) || m.nom,
    modele: m.id,
    equipage,
    coque: m.coque,
    coqueMax: m.coque,
    boucliers: m.boucliers,
    bouclierMax: m.boucliers,
    ca: m.ca,
    vitesse: m.vitesse,
    taille: m.taille,
    soute: m.soute,
    armes: m.armes.map((a) => ({ ...a })),
    defauts: m.defauts.map((d) => ({ ...d })),
    ameliorations: [],
    postes: {},
    effets: {},
    cache: equipage === "autre",
    ...(navire ? { moral: 6, hommes: m.hommes ?? 20, hommesMax: m.hommes ?? 20, perdus: 0 } : {}),
  };
}

export const ACTIONS: ActionDePoste[] = [
  { id: "ordre", poste: "capitaine", nom: "Donner l'ordre", texte: "Test de Présence DD 12 : réussi, chaque tir du vaisseau a +2 jusqu'au prochain round." },
  { id: "esquive", poste: "pilote", nom: "Esquiver", texte: "Test de Réflexes : +2 CA jusqu'au prochain round (DD 12), +4 sur 18 ou plus." },
  { id: "tirer", poste: "artilleur", nom: "Tirer", texte: "Attaque : d20 + Réflexes + bonus de l'arme contre la CA de la cible. Les boucliers prennent les dégâts avant la coque.", cible: true },
  { id: "reparer", poste: "mecanicien", nom: "Réparer la coque", texte: "La coque regagne 1d8 + Technique points." },
  { id: "boucliers", poste: "mecanicien", nom: "Relancer les boucliers", texte: "Les boucliers regagnent 2d6 + Technique points." },
  { id: "designer", poste: "vigie", nom: "Désigner une cible", texte: "Test d'Instinct DD 12 : réussi, le prochain tir du vaisseau a l'avantage." },
];

const maitrise = (niveau: number) => 2 + Math.floor((Math.max(1, niveau) - 1) / 4);
const mod = (v: number | undefined) => Math.floor(((v ?? 10) - 10) / 2);
const signe = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Modificateur d'un personnage pour une caractéristique donnée par son index, avec les noms du genre. */
export function modPerso(c: Character | undefined, genre: GenreId, stat: number): number {
  if (!c) return 0;
  const noms = getGenre(genre).stats;
  return mod(c.stats[noms[stat]]);
}

/** Les dégâts touchent d'abord les boucliers, puis la coque. Rend ce qui est passé sur la coque. */
export function encaisser(v: Vaisseau, degats: number): number {
  const surBoucliers = Math.min(v.boucliers, degats);
  v.boucliers -= surBoucliers;
  const surCoque = Math.min(v.coque, degats - surBoucliers);
  v.coque -= surCoque;
  return surCoque;
}

export interface ResultatAction {
  texte: string;
  /** Jets à rejouer sur la table, dans l'ordre. */
  jets: DiceResult[];
  /** Navires : l'abordage est ordonné, les équipages passent au combat à pied (le serveur change la carte). */
  abordage?: { avec: string };
}

export interface OptionsAction {
  cible?: Vaisseau;
  /** Index de l'arme utilisée. */
  arme?: number;
  /** Navires : le canon frappe la coque (par défaut) ou le gréement. */
  viser?: "coque" | "greement";
  /** Navires : distance en cases entre les deux pions, si les deux sont posés sur la carte. */
  distance?: number;
}

// --- Navires (les Îles du Vent) : gréement, Moral, hommes, pièces, grappins ---

export type EtatGreement = "intact" | "abime" | "tombe";

/** Le gréement (la réserve `boucliers` d'un navire) : abîmé à la moitié ou moins, tombé à zéro. */
export function etatGreement(v: Vaisseau): EtatGreement {
  if (v.bouclierMax <= 0) return "intact";
  if (v.boucliers <= 0) return "tombe";
  return v.boucliers * 2 <= v.bouclierMax ? "abime" : "intact";
}

/**
 * Vitesse du pion en cases par round. Gréement abîmé : trois quarts (arrondi bas, au moins 1) ; tombé : la moitié.
 * Vent pris : un quart de plus, au moins une case, sauf gréement tombé.
 */
export function vitesseEffective(v: Vaisseau): number {
  if (!estNavire(v)) return v.vitesse;
  const g = etatGreement(v);
  let vit = v.vitesse;
  if (g === "tombe") vit = Math.max(1, Math.floor(vit / 2));
  else if (g === "abime") vit = Math.max(1, Math.floor((vit * 3) / 4));
  if (v.effets.vent && g !== "tombe") vit += Math.max(1, Math.ceil(vit / 4));
  return vit;
}

/** Moral : de 0 à 10. À 8 ou plus l'équipage suit (avantage aux tests de manœuvre), à 3 ou moins il murmure (désavantage). */
const moralDe = (v: Vaisseau) => v.moral ?? 6;

/** Avantage (+1) ou désavantage (−1) aux tests de manœuvre : le Moral et le gréement s'annulent s'ils jouent en sens contraire. */
export function modeManoeuvre(v: Vaisseau): -1 | 0 | 1 {
  const m = moralDe(v) >= 8 ? 1 : moralDe(v) <= 3 ? -1 : 0;
  const g = etatGreement(v) === "abime" ? -1 : 0;
  const s = m + g;
  return s > 0 ? 1 : s < 0 ? -1 : 0;
}

/** Le Moral baisse (jamais sous 0). Rend la phrase du journal. */
function baisserMoral(v: Vaisseau, n: number, raison: string): string {
  if (n <= 0) return "";
  const avant = moralDe(v);
  v.moral = Math.max(0, avant - n);
  let t = ` ${raison} Le Moral de ${v.nom} tombe à ${v.moral}.`;
  if (avant > 1 && v.moral <= 1) t += v.equipage === "groupe" ? " La mutinerie menace." : " Ses hommes parlent d'amener le pavillon.";
  return t;
}

/** Des hommes tombent. Le Moral baisse de 1 au premier perdu du combat, et de 1 de plus au-delà de cinq. */
function perdreHommes(v: Vaisseau, n: number): string {
  const perdus = Math.min(v.hommes ?? 0, Math.max(0, n));
  if (!perdus) return "";
  v.hommes = (v.hommes ?? 0) - perdus;
  const avant = v.perdus ?? 0;
  v.perdus = avant + perdus;
  const chute = (avant === 0 ? 1 : 0) + (avant <= 5 && v.perdus > 5 ? 1 : 0);
  return ` ${perdus} homme${perdus > 1 ? "s" : ""} tombe${perdus > 1 ? "nt" : ""} (${v.hommes} à bord).${baisserMoral(v, chute, "L'équipage compte ses morts.")}`;
}

/** Fin d'un combat naval : le compte des hommes perdus et la fuite repartent à zéro. */
export function finDeCombat(v: Vaisseau) {
  v.perdus = 0;
  v.fuite = undefined;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** Les actions de poste d'un navire. Le serveur lance les dés ; rien ici n'est secret. */
function jouerNavire(
  v: Vaisseau,
  action: ActionDePoste,
  poste: PosteDef,
  genre: GenreId,
  perso: Character | undefined,
  opts: OptionsAction,
  random: () => number,
): ResultatAction {
  const m = modPerso(perso, genre, action.stat ?? poste.stat);
  const qui = perso?.name ?? poste.nom;
  const maitrisee = m + (perso ? maitrise(perso.level) : 0);
  const d20 = (bonus: number, mode: number = 0) => rollDice(`1d20${mode > 0 ? "adv" : mode < 0 ? "dis" : ""}${signe(bonus)}`, random);
  const manoeuvre = modeManoeuvre(v);
  const noteMode = (mode: number) => (mode > 0 ? " avec l'avantage" : mode < 0 ? " avec le désavantage" : "");
  const cible = opts.cible;
  const aLaDerive = v.coque <= 0;
  const gref = etatGreement(v);

  if (aLaDerive && !["reparer", "boucliers", "couper"].includes(action.id)) throw new Error(`${v.nom} est à la dérive : plus de barre ni de pièces servies.`);
  if (action.cible && (!cible || cible.id === v.id)) throw new Error("Choisis un autre navire.");

  switch (action.id) {
    case "ordre": {
      const r = d20(maitrisee);
      v.effets.ordre = r.total >= 12;
      return { jets: [r], texte: `${qui} crie l'ordre (${r.total}) : ${v.effets.ordre ? "tout l'équipage tire à +2 ce round." : "personne n'entend dans la fumée."}` };
    }
    case "esquive": {
      if (gref === "tombe") throw new Error("Le gréement est tombé : le navire ne vire plus.");
      const r = d20(maitrisee, manoeuvre);
      v.effets.esquive = r.total >= 18 ? 4 : r.total >= 12 ? 2 : 0;
      return { jets: [r], texte: `${qui} vire ${v.nom} de bord${noteMode(manoeuvre)} (${r.total}) : ${v.effets.esquive ? `+${v.effets.esquive} CA jusqu'au prochain round.` : "le navire n'obéit pas assez vite."}` };
    }
    case "vent": {
      if (gref === "tombe") throw new Error("Le gréement est tombé : il n'y a plus de voile pour prendre le vent.");
      const r = d20(maitrisee, manoeuvre);
      v.effets.vent = r.total >= 12;
      return { jets: [r], texte: `${qui} cherche le vent${noteMode(manoeuvre)} (${r.total}) : ${v.effets.vent ? `${v.nom} gagne en vitesse jusqu'au prochain round (${vitesseEffective(v)} cases).` : "les voiles faseyent."}` };
    }
    case "fuir": {
      if (gref === "tombe") throw new Error("Le gréement est tombé : le navire ne fuit plus.");
      const dd = clamp(12 + vitesseEffective(cible!) - vitesseEffective(v), 8, 18);
      const r = d20(maitrisee, manoeuvre);
      const touches = v.fuite?.touches ?? 0;
      if (r.total < dd) {
        v.fuite = { reussites: v.fuite?.reussites ?? 0, touches };
        return { jets: [r], texte: `${qui} tente de semer ${cible!.nom}${noteMode(manoeuvre)} (${r.total} contre DD ${dd}) : raté, le poursuivant colle au sillage et tire une fois.` };
      }
      const reussites = (v.fuite?.reussites ?? 0) + 1;
      if (reussites >= 2) {
        v.fuite = undefined;
        return { jets: [r], texte: `${qui} sème ${cible!.nom}${noteMode(manoeuvre)} (${r.total} contre DD ${dd}) : deuxième réussite, ${v.nom} décroche et disparaît.` };
      }
      v.fuite = { reussites, touches };
      return { jets: [r], texte: `${qui} tente de semer ${cible!.nom}${noteMode(manoeuvre)} (${r.total} contre DD ${dd}) : première réussite, encore une avant la troisième touche.` };
    }
    case "designer": {
      const r = d20(maitrisee);
      v.effets.visee = r.total >= 12;
      return { jets: [r], texte: `${qui} guette depuis la hune (${r.total}) : ${v.effets.visee ? "cible repérée, le prochain tir a l'avantage." : "trop de fumée sur l'eau."}` };
    }
    case "reparer": {
      const r = rollDice(`1d8${signe(m)}`, random);
      const gain = Math.max(1, Math.min(v.coqueMax - v.coque, r.total));
      const etaitALaDerive = v.coque <= 0;
      v.coque += gain;
      return { jets: [r], texte: `${qui} aveugle les voies d'eau de ${v.nom} : +${gain} (${v.coque}/${v.coqueMax}).${etaitALaDerive ? ` ${v.nom} répond de nouveau à la barre.` : ""}` };
    }
    case "boucliers": {
      const r = rollDice(`2d6${signe(m)}`, random);
      const gain = Math.max(0, Math.min(v.bouclierMax - v.boucliers, r.total));
      const tombait = v.boucliers <= 0;
      v.boucliers += gain;
      return { jets: [r], texte: `${qui} rétablit le gréement de ${v.nom} : +${gain} (${v.boucliers}/${v.bouclierMax}).${tombait && gain > 0 ? " Les voiles reprennent le vent." : ""}` };
    }
    case "recharger": {
      const arme = v.armes[opts.arme ?? 0];
      if (!arme) throw new Error("Ce navire n'a pas cette arme.");
      const pieces = arme.pieces ?? 1;
      if ((arme.chargees ?? pieces) >= pieces) throw new Error(`Toutes les pièces de ${arme.nom} sont chargées.`);
      const avant = arme.chargees ?? 0;
      arme.chargees = pieces;
      return { jets: [], texte: `${qui} fait recharger ${arme.nom} de ${v.nom} : ${pieces - avant} pièce${pieces - avant > 1 ? "s" : ""} prête${pieces - avant > 1 ? "s" : ""} (${pieces}/${pieces}).` };
    }
    case "tirer":
    case "bordee": {
      const arme = v.armes[opts.arme ?? 0];
      if (!arme) throw new Error("Ce navire n'a pas cette arme.");
      const pieces = arme.pieces ?? 1;
      const chargees = arme.chargees ?? pieces;
      if (chargees < 1) throw new Error(`Plus une pièce de ${arme.nom} n'est chargée : recharge.`);
      if (opts.distance !== undefined && opts.distance > arme.portee) throw new Error(`${cible!.nom} est hors de portée (${opts.distance} cases, ${arme.nom} : ${arme.portee}).`);
      // Les servants : un homme par servant et par pièce tirée.
      const servants = arme.servants ?? 1;
      const aServir = v.hommes === undefined ? chargees : Math.floor(v.hommes / servants);
      const n = Math.min(action.id === "bordee" ? chargees : 1, aServir);
      if (n < 1) throw new Error(`Il ne reste pas assez d'hommes pour servir ${arme.nom}.`);
      const viseGreement = opts.viser === "greement" && arme.contre !== "hommes";
      const bonus = arme.bonus + m + (v.effets.ordre ? 2 : 0) - (viseGreement ? 2 : 0);
      const avantage = !!v.effets.visee;
      v.effets.visee = false;
      const ca = cible!.ca + (cible!.effets.esquive ?? 0);
      const jets: DiceResult[] = [];
      let touches = 0;
      let total = 0;
      let critiques = 0;
      for (let i = 0; i < n; i++) {
        const r = d20(bonus, avantage ? 1 : 0);
        jets.push(r);
        const naturel = r.kept[0];
        if (naturel === 1 || (naturel !== 20 && r.total < ca)) continue;
        const d = rollDice(arme.degats, random);
        jets.push(d);
        let pris = d.total;
        if (naturel === 20) {
          const c = rollDice(arme.degats, random);
          jets.push(c);
          pris += c.total;
          critiques++;
        }
        touches++;
        total += pris;
      }
      arme.chargees = chargees - n;
      const tir = action.id === "bordee" ? `lâche la bordée de ${arme.nom} de ${v.nom} sur ${cible!.nom}` : `tire une pièce de ${arme.nom} sur ${cible!.nom}`;
      const jetTexte = n === 1 ? `${jets[0].total} contre CA ${ca}` : `${n} pièces contre CA ${ca}`;
      if (!touches) return { jets, texte: `${qui} ${tir} (${jetTexte}) : tout porte à l'eau.` };
      const crit = critiques ? (critiques > 1 ? `${critiques} coups critiques, ` : "coup critique, ") : "";
      const bilan = n === 1 ? "" : `${touches} pièce${touches > 1 ? "s" : ""} sur ${n} touche${touches > 1 ? "nt" : ""} : `;
      let suite: string;
      if (arme.contre === "hommes") {
        suite = ` ${crit}${bilan}${total} points de mitraille balaient le pont de ${cible!.nom}.${perdreHommes(cible!, Math.ceil(total / 3))}`;
      } else if (viseGreement) {
        const avantGr = cible!.boucliers;
        cible!.boucliers = Math.max(0, avantGr - total);
        suite = ` ${crit}${bilan}${total} dégâts dans le gréement (${cible!.boucliers}/${cible!.bouclierMax}).`;
        if (avantGr > 0 && cible!.boucliers === 0) suite += ` Le gréement de ${cible!.nom} tombe !${baisserMoral(cible!, 1, "Le gréement est en pièces.")}`;
      } else {
        cible!.coque = Math.max(0, cible!.coque - total);
        suite = ` ${crit}${bilan}${total} dégâts dans la coque (${cible!.coque}/${cible!.coqueMax}).`;
        if (cible!.coque === 0) suite += ` ${cible!.nom} est à la dérive !`;
      }
      if (cible!.fuite && cible!.fuite.reussites < 2) {
        cible!.fuite.touches += touches;
        if (cible!.fuite.touches >= 3) {
          cible!.fuite = undefined;
          suite += ` La fuite de ${cible!.nom} échoue : trois touches.`;
        }
      }
      return { jets, texte: `${qui} ${tir} (${jetTexte}) :${suite}` };
    }
    case "grappins": {
      if (opts.distance !== undefined && opts.distance > PORTEE_GRAPPINS) throw new Error(`${cible!.nom} est trop loin pour les grappins (${opts.distance} cases, ${PORTEE_GRAPPINS} au plus).`);
      const r = d20(maitrisee, manoeuvre);
      if (r.total < 12) return { jets: [r], texte: `${qui} lance les grappins${noteMode(manoeuvre)} (${r.total}) : ils retombent à l'eau.` };
      v.grappins = cible!.id;
      cible!.grappins = v.id;
      return { jets: [r], texte: `${qui} lance les grappins${noteMode(manoeuvre)} (${r.total}) : ils mordent la lisse de ${cible!.nom}. Les deux navires sont accrochés.` };
    }
    case "couper": {
      if (!v.grappins) throw new Error("Aucun grappin n'accroche ce navire.");
      const r = d20(maitrisee);
      if (r.total < 12) return { jets: [r], texte: `${qui} s'acharne sur les aussières (${r.total}) : elles tiennent encore.` };
      if (cible && cible.grappins === v.id) cible.grappins = undefined;
      v.grappins = undefined;
      return { jets: [r], texte: `${qui} coupe les grappins (${r.total}) : ${v.nom} se décroche.` };
    }
    case "aborder": {
      if (v.grappins !== cible!.id || cible!.grappins !== v.id) throw new Error("Les grappins ne tiennent pas encore les deux navires.");
      if (moralDe(v) <= 1) throw new Error("L'équipage ne suit plus : pas de coup de main à ce Moral.");
      const suite = baisserMoral(v, 1, "Un abordage est un coup de main.");
      return { jets: [], abordage: { avec: cible!.id }, texte: `${qui} ordonne l'abordage : ${v.nom} et ${cible!.nom} sont bord à bord, les équipages passent au combat à pied.${suite}` };
    }
  }
  throw new Error("Action inconnue.");
}

/**
 * Joue une action de poste : lance les dés, applique l'effet et rend la ligne du journal.
 * `cible` est requis pour tirer ; `arme` est l'index de l'arme utilisée. Un navire (genre « pirates ») joue ses propres actions.
 */
export function jouerAction(
  genre: GenreId,
  v: Vaisseau,
  actionId: string,
  perso: Character | undefined,
  opts: OptionsAction = {},
  random: () => number = Math.random,
): ResultatAction {
  const mar = marine(genre);
  if (mar.navire) {
    const a = mar.actions.find((x) => x.id === actionId);
    if (!a) throw new Error("Action inconnue.");
    return jouerNavire(v, a, mar.postes.find((p) => p.id === a.poste)!, genre, perso, opts, random);
  }
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action) throw new Error("Action inconnue.");
  const poste = POSTES.find((p) => p.id === action.poste)!;
  const m = modPerso(perso, genre, poste.stat);
  const qui = perso?.name ?? poste.nom;
  const test = (bonus: number, avantage = false) => rollDice(`1d20${avantage ? "adv" : ""}${signe(bonus)}`, random);

  switch (action.id) {
    case "ordre": {
      const r = test(m + (perso ? maitrise(perso.level) : 0));
      v.effets.ordre = r.total >= 12;
      return { jets: [r], texte: `${qui} donne l'ordre (${r.total}) : ${v.effets.ordre ? "tout l'équipage tire à +2 ce round." : "personne n'entend dans le vacarme."}` };
    }
    case "esquive": {
      const r = test(m + (perso ? maitrise(perso.level) : 0));
      v.effets.esquive = r.total >= 18 ? 4 : r.total >= 12 ? 2 : 0;
      return { jets: [r], texte: `${qui} lance ${v.nom} en esquive (${r.total}) : ${v.effets.esquive ? `+${v.effets.esquive} CA jusqu'au prochain round.` : "la manœuvre ne donne rien."}` };
    }
    case "designer": {
      const r = test(m + (perso ? maitrise(perso.level) : 0));
      v.effets.visee = r.total >= 12;
      return { jets: [r], texte: `${qui} lit les détecteurs (${r.total}) : ${v.effets.visee ? "cible désignée, le prochain tir a l'avantage." : "trop de bruit sur les écrans."}` };
    }
    case "reparer": {
      const r = rollDice(`1d8${signe(m)}`, random);
      const gain = Math.max(1, Math.min(v.coqueMax - v.coque, r.total));
      v.coque += gain;
      return { jets: [r], texte: `${qui} répare la coque de ${v.nom} : +${gain} (${v.coque}/${v.coqueMax}).` };
    }
    case "boucliers": {
      const r = rollDice(`2d6${signe(m)}`, random);
      const gain = Math.max(0, Math.min(v.bouclierMax - v.boucliers, r.total));
      v.boucliers += gain;
      return { jets: [r], texte: `${qui} relance les boucliers de ${v.nom} : +${gain} (${v.boucliers}/${v.bouclierMax}).` };
    }
    case "tirer": {
      const cible = opts.cible;
      if (!cible || cible.id === v.id) throw new Error("Choisis un vaisseau à viser.");
      const arme = v.armes[opts.arme ?? 0];
      if (!arme) throw new Error("Ce vaisseau n'a pas cette arme.");
      const bonus = arme.bonus + m + (v.effets.ordre ? 2 : 0);
      const r = test(bonus, !!v.effets.visee);
      v.effets.visee = false;
      const naturel = r.kept[0];
      const ca = cible.ca + (cible.effets.esquive ?? 0);
      if (naturel === 1 || (naturel !== 20 && r.total < ca)) {
        return { jets: [r], texte: `${qui} tire avec ${arme.nom} sur ${cible.nom} (${r.total} contre CA ${ca}) : manqué.${naturel === 1 && v.defauts.some((d) => d.nom === "La tourelle se bloque") ? " La tourelle se bloque !" : ""}` };
      }
      const d = rollDice(arme.degats, random);
      const critique = naturel === 20 ? rollDice(arme.degats, random) : undefined;
      const total = d.total + (critique?.total ?? 0);
      const surCoque = encaisser(cible, total);
      const etat = cible.coque === 0 ? ` ${cible.nom} est désemparé !` : ` (boucliers ${cible.boucliers}, coque ${cible.coque}/${cible.coqueMax})`;
      return {
        jets: [r, d, ...(critique ? [critique] : [])],
        texte: `${qui} tire avec ${arme.nom} sur ${cible.nom} (${r.total} contre CA ${ca}) : ${naturel === 20 ? "coup critique, " : ""}${total} dégâts, dont ${surCoque} sur la coque.${etat}`,
      };
    }
  }
  throw new Error("Action inconnue.");
}

/** Début d'un round : les effets d'esquive, d'ordre et de visée retombent. */
export function nouveauRound(v: Vaisseau) {
  v.effets = {};
}

// --- Sauvegarde et vue des joueurs ---

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const entier = (v: unknown, min: number, max: number, defaut: number) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v as number))) : defaut);
const texte = (v: unknown, max: number, defaut = "") => (typeof v === "string" ? v.slice(0, max) : defaut);

/** Vaisseaux d'une sauvegarde ou d'un import : seuls les champs connus, bornés. */
export function nettoyerVaisseaux(data: unknown, genre: GenreId | string = "science-fiction"): Vaisseau[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isObj).slice(0, 30).map((x) => {
    const modeleId = texte(x.modele, 40, marine(genre).modeles[0].id);
    // Un modèle de navire reste un navire, quel que soit le genre de la partie au moment où on lit la sauvegarde.
    const base = nouveauVaisseau(modeleId, texte(x.nom, 40), x.equipage === "groupe" ? "groupe" : "autre", estNavire({ modele: modeleId }) ? "pirates" : genre);
    const navire = estNavire(base);
    const coqueMax = entier(x.coqueMax, 1, 5000, base.coqueMax);
    const bouclierMax = entier(x.bouclierMax, 0, 5000, base.bouclierMax);
    const postes: Vaisseau["postes"] = {};
    if (isObj(x.postes)) for (const p of POSTES) if (typeof x.postes[p.id] === "string") postes[p.id] = (x.postes[p.id] as string).slice(0, 40);
    const hommesMax = entier(x.hommesMax, 0, 2000, base.hommesMax ?? 0);
    const equipageNavire: Partial<Vaisseau> = navire
      ? {
          moral: entier(x.moral, 0, 10, base.moral ?? 6),
          hommesMax,
          hommes: entier(x.hommes, 0, hommesMax, hommesMax),
          perdus: entier(x.perdus, 0, 2000, 0),
          grappins: typeof x.grappins === "string" && x.grappins ? x.grappins.slice(0, 40) : undefined,
          fuite: isObj(x.fuite) ? { reussites: entier(x.fuite.reussites, 0, 1, 0), touches: entier(x.fuite.touches, 0, 2, 0) } : undefined,
        }
      : {};
    return {
      ...base,
      id: texte(x.id, 40) || base.id,
      coqueMax,
      coque: entier(x.coque, 0, coqueMax, coqueMax),
      bouclierMax,
      boucliers: entier(x.boucliers, 0, bouclierMax, bouclierMax),
      ca: entier(x.ca, 5, 30, base.ca),
      vitesse: entier(x.vitesse, 0, 40, base.vitesse),
      taille: entier(x.taille, 1, 6, base.taille),
      soute: entier(x.soute, 0, 100, base.soute),
      armes: Array.isArray(x.armes)
        ? x.armes.filter(isObj).slice(0, 6).map((a): Arme => {
            const arme: Arme = { nom: texte(a.nom, 40, "Arme"), bonus: entier(a.bonus, -5, 20, 0), degats: /^\d+d\d+([+-]\d+)?$/.test(String(a.degats)) ? String(a.degats) : "1d6", portee: entier(a.portee, 1, 60, 10) };
            if (navire && Number.isFinite(a.pieces)) {
              arme.pieces = entier(a.pieces, 1, 60, 1);
              arme.chargees = entier(a.chargees, 0, arme.pieces, arme.pieces);
              arme.servants = entier(a.servants, 0, 4, 1);
              if (a.contre === "hommes") arme.contre = "hommes";
            }
            return arme;
          })
        : base.armes,
      defauts: Array.isArray(x.defauts) ? x.defauts.filter(isObj).slice(0, 6).map((d) => ({ nom: texte(d.nom, 60, "Défaut"), texte: texte(d.texte, 400) })) : base.defauts,
      ameliorations: Array.isArray(x.ameliorations) ? x.ameliorations.filter((a) => typeof a === "string").slice(0, 12).map((a) => (a as string).slice(0, 80)) : [],
      postes,
      tokenId: typeof x.tokenId === "string" ? x.tokenId.slice(0, 40) : undefined,
      effets: {},
      cache: typeof x.cache === "boolean" ? x.cache : base.cache,
      notes: texte(x.notes, 4000) || undefined,
      ...equipageNavire,
    };
  });
}

/**
 * Ce que voit un joueur : ni vaisseau caché, ni note du MJ. De l'équipage d'un autre navire il ne voit ni le Moral,
 * ni le nombre d'hommes, ni la fuite en cours : le journal dit ce qui se voit (un homme qui tombe, un pavillon qu'on amène).
 */
export function vaisseauxPourJoueur(vs: Vaisseau[]): Vaisseau[] {
  return vs
    .filter((v) => !v.cache)
    .map(({ notes: _n, ...v }) => (v.equipage === "groupe" ? v : { ...v, moral: undefined, hommes: undefined, hommesMax: undefined, perdus: undefined, fuite: undefined }));
}

/** Le pion d'un vaisseau suit sa fiche : coque, CA, nom, caché ou non ; celui du groupe est déplacé par le joueur du pilote. */
export function synchroniserPions(st: { tokens: import("./types").Token[]; characters: Character[] }, v: Vaisseau) {
  const t = v.tokenId ? st.tokens.find((x) => x.id === v.tokenId) : undefined;
  if (!t) return;
  t.name = v.nom;
  t.hp = v.coque;
  t.hpMax = v.coqueMax;
  t.ac = v.ca + (v.effets.esquive ?? 0);
  t.size = v.taille;
  t.speed = vitesseEffective(v);
  t.hidden = !!v.cache;
  if (v.equipage === "groupe") t.ownerId = st.characters.find((c) => c.id === v.postes.pilote)?.ownerId;
}
