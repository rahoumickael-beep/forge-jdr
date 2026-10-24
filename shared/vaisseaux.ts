// Vaisseaux : fiche, modèles, postes et actions de poste pour le combat spatial (l'Archipel d'abord).
// Fonctions pures : le serveur les appelle (server/index.ts), les tests les vérifient (vaisseaux.test.ts).
// Le serveur lance les dés ; chaque joueur ne joue que le poste que tient son personnage.
import { rollDice, type DiceResult } from "./dice";
import { getGenre } from "./genres";
import { uid } from "./random";
import type { Character, GenreId } from "./types";

export type Poste = "capitaine" | "pilote" | "artilleur" | "mecanicien" | "vigie";

/** Les postes, dans l'ordre de la fiche. `stat` : index de la caractéristique (0 Puissance … 5 Présence en SF). */
export const POSTES: { id: Poste; nom: string; stat: number; role: string }[] = [
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
  /** Portée en cases de la carte d'espace. */
  portee: number;
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
  /** Effets qui durent jusqu'au prochain round : esquive (+CA), cible désignée par la vigie, ordre du capitaine. */
  effets: { esquive?: number; visee?: boolean; ordre?: boolean };
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

export const modele = (id: string) => MODELES.find((m) => m.id === id);

export function nouveauVaisseau(modeleId: string, nom: string, equipage: Vaisseau["equipage"]): Vaisseau {
  const m = modele(modeleId) ?? MODELES[0];
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
  };
}

// --- Actions de poste ---

export interface ActionDePoste {
  id: string;
  poste: Poste;
  nom: string;
  texte: string;
  /** Il faut viser un autre vaisseau. */
  cible?: boolean;
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
}

/**
 * Joue une action de poste : lance les dés, applique l'effet et rend la ligne du journal.
 * `cible` est requis pour tirer ; `arme` est l'index de l'arme utilisée.
 */
export function jouerAction(
  genre: GenreId,
  v: Vaisseau,
  actionId: string,
  perso: Character | undefined,
  opts: { cible?: Vaisseau; arme?: number } = {},
  random: () => number = Math.random,
): ResultatAction {
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
export function nettoyerVaisseaux(data: unknown): Vaisseau[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isObj).slice(0, 30).map((x) => {
    const base = nouveauVaisseau(texte(x.modele, 40, "cargo-leger"), texte(x.nom, 40), x.equipage === "groupe" ? "groupe" : "autre");
    const coqueMax = entier(x.coqueMax, 1, 5000, base.coqueMax);
    const bouclierMax = entier(x.bouclierMax, 0, 5000, base.bouclierMax);
    const postes: Vaisseau["postes"] = {};
    if (isObj(x.postes)) for (const p of POSTES) if (typeof x.postes[p.id] === "string") postes[p.id] = (x.postes[p.id] as string).slice(0, 40);
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
        ? x.armes.filter(isObj).slice(0, 6).map((a) => ({ nom: texte(a.nom, 40, "Arme"), bonus: entier(a.bonus, -5, 20, 0), degats: /^\d+d\d+([+-]\d+)?$/.test(String(a.degats)) ? String(a.degats) : "1d6", portee: entier(a.portee, 1, 60, 10) }))
        : base.armes,
      defauts: Array.isArray(x.defauts) ? x.defauts.filter(isObj).slice(0, 6).map((d) => ({ nom: texte(d.nom, 60, "Défaut"), texte: texte(d.texte, 400) })) : base.defauts,
      ameliorations: Array.isArray(x.ameliorations) ? x.ameliorations.filter((a) => typeof a === "string").slice(0, 12).map((a) => (a as string).slice(0, 80)) : [],
      postes,
      tokenId: typeof x.tokenId === "string" ? x.tokenId.slice(0, 40) : undefined,
      effets: {},
      cache: typeof x.cache === "boolean" ? x.cache : base.cache,
      notes: texte(x.notes, 4000) || undefined,
    };
  });
}

/** Ce que voit un joueur : ni vaisseau caché, ni note du MJ. */
export function vaisseauxPourJoueur(vs: Vaisseau[]): Vaisseau[] {
  return vs.filter((v) => !v.cache).map(({ notes: _n, ...v }) => v);
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
  t.speed = v.vitesse;
  t.hidden = !!v.cache;
  if (v.equipage === "groupe") t.ownerId = st.characters.find((c) => c.id === v.postes.pilote)?.ownerId;
}
