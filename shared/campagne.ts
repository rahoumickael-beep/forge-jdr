// Mémoire de campagne : séances, fils ouverts, PNJ croisés, réputations, jauge du monde et réserve du MJ.
// Le serveur la garde dans RoomState ; la vue joueur n'en reçoit que ce qui n'est pas secret.
import { canonDe } from "./canon";
import type { Canon } from "./canon";
import { generateEncounter } from "./generators";
import type { Campagne, Encounter, FilOuvert, GenreId, PnjConnu, RoomState, Seance } from "./types";

const MAX_FAITS = 200;
const borne = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

export function nouvelleCampagne(genre: GenreId): Campagne {
  const canon = canonDe(genre);
  return {
    seances: [],
    fils: [],
    pnj: [],
    reputations: Object.fromEntries((canon?.factions ?? []).map((f) => [f.id, 0])),
    jauge: canon?.campagne?.jauge?.depart ?? null,
    jaugeVisible: false,
    reserve: 0,
    preparation: "",
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Campagne lue sur disque ou importée : on ne garde que ce qui a la bonne forme. */
export function nettoyerCampagne(v: unknown, genre: GenreId): Campagne {
  const base = nouvelleCampagne(genre);
  if (!isObj(v)) return base;
  const liste = (x: unknown) => (Array.isArray(x) ? x.filter(isObj) : []);
  const seances: Seance[] = liste(v.seances).slice(-500).map((s, i) => ({
    numero: i + 1,
    debut: Number(s.debut) || 0,
    ...(Number(s.fin) ? { fin: Number(s.fin) } : {}),
    resume: txt(s.resume, 4000),
    faits: (Array.isArray(s.faits) ? s.faits : []).map((f) => txt(f, 300)).filter(Boolean).slice(-MAX_FAITS),
  }));
  const fils: FilOuvert[] = liste(v.fils).filter((f) => typeof f.id === "string" && typeof f.texte === "string").map((f) => ({
    id: f.id as string,
    texte: txt(f.texte, 500),
    ouvert: f.ouvert !== false,
    secret: f.secret === true,
    seance: borne(Number(f.seance) || 0, 0, 9999),
  }));
  const pnj: PnjConnu[] = liste(v.pnj).filter((p) => typeof p.id === "string" && typeof p.nom === "string").map((p) => ({
    id: p.id as string,
    nom: txt(p.nom, 80),
    attitude: borne(Number(p.attitude) || 0, -2, 2),
    public: txt(p.public, 1000),
    secret: txt(p.secret, 2000),
  }));
  const reputations = { ...base.reputations };
  if (isObj(v.reputations)) for (const id of Object.keys(reputations)) reputations[id] = borne(Number(v.reputations[id]) || 0, 0, 3);
  const max = canonDe(genre)?.campagne?.reserve?.max ?? 6;
  return {
    seances,
    fils,
    pnj,
    reputations,
    jauge: base.jauge === null ? null : borne(typeof v.jauge === "number" ? v.jauge : base.jauge, 0, jaugeMax(canonDe(genre))),
    jaugeVisible: v.jaugeVisible === true,
    reserve: borne(Number(v.reserve) || 0, 0, max),
    preparation: txt(v.preparation, 20000),
  };
}

export const seanceEnCours = (c: Campagne): Seance | undefined => {
  const s = c.seances[c.seances.length - 1];
  return s && !s.fin ? s : undefined;
};

/** Ouvre la séance suivante. Rend le « Précédemment » à lire à la table (résumé de la dernière séance close). */
export function ouvrirSeance(c: Campagne, now = Date.now()): { seance: Seance; precedemment: string } {
  if (seanceEnCours(c)) throw new Error("Une séance est déjà ouverte.");
  const derniere = c.seances[c.seances.length - 1];
  const seance: Seance = { numero: c.seances.length + 1, debut: now, resume: "", faits: [] };
  c.seances.push(seance);
  return { seance, precedemment: derniere ? derniere.resume || derniere.faits.join(" ") : "" };
}

export function cloreSeance(c: Campagne, resume: string, now = Date.now()): Seance {
  const s = seanceEnCours(c);
  if (!s) throw new Error("Aucune séance ouverte.");
  s.fin = now;
  s.resume = resume.slice(0, 4000);
  return s;
}

/** Note un fait public dans la séance ouverte (rien si aucune séance n'est ouverte). */
export function noterFait(c: Campagne, texte: string) {
  const s = seanceEnCours(c);
  if (!s || !texte.trim()) return;
  if (s.faits[s.faits.length - 1] === texte) return;
  s.faits.push(texte.slice(0, 300));
  if (s.faits.length > MAX_FAITS) s.faits.shift();
}

/** Plafond de la jauge d'un monde : 100, ou plus si elle part plus haut (131 Phares dans l'Archipel). */
export const jaugeMax = (canon: Canon | undefined) => canon?.campagne?.jauge?.max ?? Math.max(100, canon?.campagne?.jauge?.depart ?? 100);

/** Règle la jauge ; rend les seuils franchis vers le bas, à annoncer au MJ. */
export function reglerJauge(c: Campagne, valeur: number, canon: Canon | undefined): { valeur: number; effet: string }[] {
  if (c.jauge === null) return [];
  const avant = c.jauge;
  c.jauge = borne(valeur, 0, jaugeMax(canon));
  return (canon?.campagne?.jauge?.seuils ?? []).filter((s) => avant > s.valeur && c.jauge! <= s.valeur);
}

export function reglerReserve(c: Campagne, n: number, canon: Canon | undefined) {
  c.reserve = borne(n, 0, canon?.campagne?.reserve?.max ?? 6);
}

/** Ce qu'un joueur reçoit de la campagne : ni fils secrets, ni notes sur les PNJ, ni réserve, ni préparation. */
export function campagnePourJoueur(c: Campagne, genre?: GenreId): Campagne {
  const canon = genre ? canonDe(genre) : undefined;
  const jauge = c.jaugeVisible ? canon?.campagne?.jauge?.nom : undefined;
  return {
    ...c,
    noms: {
      ...(jauge ? { jauge } : {}),
      factions: (canon?.factions ?? []).filter((f) => (c.reputations[f.id] ?? 0) > 0).map((f) => ({ id: f.id, nom: f.nom })),
    },
    fils: c.fils.filter((f) => !f.secret),
    pnj: c.pnj.map((p) => ({ ...p, secret: "" })),
    jauge: c.jaugeVisible ? c.jauge : null,
    reserve: 0,
    preparation: "",
  };
}

export interface Preparation {
  numero: number;
  precedemment: string;
  fils: FilOuvert[];
  pnj: PnjConnu[];
  /** Factions qui vont bouger : celles qui apprécient le groupe (réputation 2 ou 3). */
  factions: { nom: string; reputation: number; note: string }[];
  jauge?: { nom: string; valeur: number; effet: string; prochain?: { valeur: number; effet: string } };
  accroches: { titre: string; texte: string }[];
  rencontre?: Encounter;
}

/** Fiche de préparation de la séance suivante, sans IA : tout vient de la mémoire de campagne et du canon. */
export function preparerSeance(st: Pick<RoomState, "genre" | "level" | "campagne">): Preparation {
  const c = st.campagne;
  const canon = canonDe(st.genre);
  const closes = c.seances.filter((s) => s.fin);
  const derniere = closes[closes.length - 1];
  const numero = c.seances.length + (seanceEnCours(c) ? 0 : 1);
  const faction = (id: string) => canon?.factions.find((f) => f.id === id);
  const factions = Object.entries(c.reputations)
    .filter(([, r]) => r >= 2)
    .map(([id, r]) => ({
      nom: faction(id)?.nom ?? id,
      reputation: r,
      note: r === 3 ? `Alliée : elle offre son meilleur secret, et attend un service en retour.` : `Elle tend la main : une offre, une demande d'aide, un messager.`,
    }));
  const j = canon?.campagne?.jauge;
  const seuils = j?.seuils ?? [];
  const jauge = j && c.jauge !== null
    ? {
        nom: j.nom,
        valeur: c.jauge,
        effet: seuils.filter((s) => c.jauge! <= s.valeur).map((s) => s.effet).join(" ") || "Rien n'a encore changé dans le monde.",
        prochain: seuils.find((s) => c.jauge! > s.valeur),
      }
    : undefined;
  // Accroches du palier, en commençant par celles dont les factions comptent le plus pour le groupe.
  const poids = (f: string[]) => -Math.max(0, ...f.map((id) => c.reputations[id] ?? 0));
  const accroches = (canon?.campagne?.accroches ?? [])
    .filter((a) => st.level >= a.niveaux[0] && st.level <= a.niveaux[1])
    .sort((a, b) => poids(a.factions) - poids(b.factions))
    .map(({ titre, texte }) => ({ titre, texte }));
  return {
    numero,
    precedemment: derniere ? derniere.resume || derniere.faits.join(" ") : "",
    fils: c.fils.filter((f) => f.ouvert),
    pnj: c.pnj.filter((p) => p.attitude !== 0),
    factions,
    jauge,
    accroches,
    rencontre: generateEncounter(st.genre, st.level, 4, numero * 7919),
  };
}

/** La fiche en texte, à copier dans les notes ou à lire avant de jouer. */
export function texteDePreparation(p: Preparation): string {
  const l: string[] = [`Séance ${p.numero}`];
  if (p.precedemment) l.push("", "Précédemment", p.precedemment);
  if (p.fils.length) l.push("", "Fils ouverts", ...p.fils.map((f) => `- ${f.texte}${f.secret ? " (secret)" : ""}`));
  if (p.pnj.length) l.push("", "PNJ à faire revenir", ...p.pnj.map((x) => `- ${x.nom} (${x.attitude > 0 ? "allié" : "hostile"}${Math.abs(x.attitude) === 2 ? ", fortement" : ""})${x.secret ? ` : ${x.secret}` : ""}`));
  if (p.factions.length) l.push("", "Factions qui bougent", ...p.factions.map((f) => `- ${f.nom} (${f.reputation}/3) : ${f.note}`));
  if (p.jauge) l.push("", `${p.jauge.nom[0].toUpperCase()}${p.jauge.nom.slice(1)} : ${p.jauge.valeur}`, p.jauge.effet, ...(p.jauge.prochain ? [`Prochain seuil à ${p.jauge.prochain.valeur} : ${p.jauge.prochain.effet}`] : []));
  if (p.accroches.length) l.push("", "Accroches du palier", ...p.accroches.map((a) => `- ${a.titre} : ${a.texte}`));
  if (p.rencontre) l.push("", "Rencontre prête", `- ${p.rencontre.title} (${p.rencontre.difficulty}) : ${p.rencontre.description}`);
  return l.join("\n");
}
