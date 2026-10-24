// Classe d'armure de départ : lue dans l'armure que le personnage porte vraiment,
// d'après les tables d'armures des livres des joueurs de chaque monde.

export interface Armure {
  /** CA de base. */
  base: number;
  /** Plafond du modificateur d'agilité (0 : armure lourde, rien ne s'ajoute). */
  max?: number;
  /** La pièce protège sans compter comme une armure (défenses « sans armure » permises). */
  commeSansArmure?: boolean;
}

/** Du plus précis au plus général : la première qui correspond l'emporte. */
const TABLE: [RegExp, Armure][] = [
  // Lourdes
  [/armure blanche|harnois/, { base: 18, max: 0 }],
  [/composite lourde|carapace de chantier|clibanion/, { base: 17, max: 0 }],
  [/cotte de mailles|combinaison de vide blindée/, { base: 16, max: 0 }],
  [/broigne/, { base: 14, max: 0 }],
  // Intermédiaires
  [/composite renforcée|demi-plate/, { base: 15, max: 2 }],
  [/composite intermédiaire|plaques anti-émeute|cuirasse|écailles/, { base: 14, max: 2 }],
  [/combinaison de vide rapiécée/, { base: 12, max: 2, commeSansArmure: true }],
  [/plastron composite|combinaison de vide(?! légère)|chemise de mailles|brigandine|armure de fibre/, { base: 13, max: 2 }],
  [/pelisse|\bpeaux\b|capote/, { base: 12, max: 2 }],
  // Légères
  [/justaucorps de buffle|veste de buffle|\bbuffle\b/, { base: 12 }],
  [/cuir renforcé|cuir clouté|pourpoint clouté|pare-éclats|armure légère d'huissier/, { base: 12 }],
  [
    /matelassée|gambison|cuir bouilli|armure de cuir|pourpoint de cuir|veste de cuir|manteau de cuir|caban|tablier de cuir|toile huileuse|(manteau|manteau long|blouse) renforcée?|veste à doubles poches|combinaison de vol|combinaison de vide légère|blouson de fibre|blouse de fibre|combinaison de fibre|gilet de fibre/,
    { base: 11 },
  ],
];

/** L'armure la plus solide de l'équipement, ou rien. */
export function armurePortee(equipement: readonly string[]): Armure | undefined {
  let meilleure: Armure | undefined;
  for (const objet of equipement) {
    const texte = objet.toLowerCase();
    const trouvee = TABLE.find(([re]) => re.test(texte))?.[1];
    if (trouvee && (!meilleure || trouvee.base > meilleure.base)) meilleure = trouvee;
  }
  return meilleure;
}

/** « Sans armure, ta CA vaut 10 + Dextérité + Sagesse. » → base et caractéristiques ajoutées. */
export function defenseSansArmure(texte: string, stats: readonly string[]): { base: number; stats: number[]; sansBouclier: boolean } | undefined {
  const m = /Sans armure( ni bouclier)?, (?:ta )?CA (?:vaut )?(\d+)((?: \+ [A-ZÀ-Ý][a-zà-ÿ]+)+)/.exec(texte);
  if (!m) return undefined;
  const noms = m[3].split(" + ").map((s) => s.trim()).filter(Boolean);
  const indices = noms.map((n) => stats.indexOf(n));
  if (indices.some((i) => i < 0)) return undefined;
  return { base: Number(m[2]), stats: indices, sansBouclier: !!m[1] };
}

/**
 * CA de départ.
 * @param maitrise texte des armures maîtrisées par la classe (pour le bouclier)
 * @param equipement équipement porté
 * @param pouvoirs textes des pouvoirs et traits acquis (défenses « sans armure »)
 * @param stats noms des six caractéristiques du monde
 * @param mods modificateurs des six caractéristiques
 */
export function classeArmureDepart(maitrise: string, equipement: readonly string[], pouvoirs: readonly string[], stats: readonly string[], mods: readonly number[]): number {
  const agi = mods[1];
  const armure = armurePortee(equipement);
  const bouclier = /bouclier/i.test(maitrise) && equipement.some((o) => /bouclier/i.test(o));
  let ca = 10 + agi;
  if (armure) ca = armure.base + (armure.max === undefined ? agi : Math.min(agi, armure.max));
  if (!armure || armure.commeSansArmure) {
    for (const texte of pouvoirs) {
      const d = defenseSansArmure(texte, stats);
      if (!d || (d.sansBouclier && bouclier)) continue;
      ca = Math.max(ca, d.base + d.stats.reduce((s, i) => s + mods[i], 0));
    }
  }
  return ca + (bouclier ? 2 : 0);
}

const SOMME = /^(\d[\d  ]*) (godets|francs|dollars|piastres|lumens|lm|h|po|pa|livres?|sous)$/;

/** « Argent de départ : 30 dollars, une selle… » dans un trait d'origine → « 30 dollars ». */
export function argentDOrigine(texte: string): string | undefined {
  const m = /Argent de départ : (\d(?:[\d  ]*\d)?) ([a-zàâéèêôû]+)/i.exec(texte);
  return m && SOMME.test(`${m[1]} ${m[2]}`) ? `${m[1]} ${m[2]}` : undefined;
}

/**
 * Équipement de départ : classe puis historique, sans doublon ni seconde gourde.
 * Un objet déjà cité au début d'un autre (« Lasso de crin » et « Lasso de crin de douze mètres ») ne compte qu'une fois.
 * Les sommes de même monnaie s'additionnent, sauf dans les mondes où l'on garde la plus haute.
 */
/** Mondes dont le livre dit : l'argent de départ est la plus haute des sommes, pas leur total. */
export const PLUS_HAUTE_SOMME = new Set(["post-apo", "western", "pirates"]);

export function equipementDeDepart(classe: readonly string[], historique: readonly string[], plusHauteSomme = false): string[] {
  const objets: string[] = [];
  const sommes = new Map<string, number>();
  const mot = (o: string) => o.toLowerCase().split(/[ ,]/)[0];
  for (const objet of [...classe, ...historique]) {
    const m = SOMME.exec(objet.trim());
    if (m) {
      const valeur = Number(m[1].replace(/\s/g, ""));
      const avant = sommes.get(m[2]);
      sommes.set(m[2], avant === undefined ? valeur : plusHauteSomme ? Math.max(avant, valeur) : avant + valeur);
      continue;
    }
    const bas = objet.toLowerCase();
    if (objets.some((o) => o.toLowerCase().startsWith(bas) || bas.startsWith(o.toLowerCase()))) continue;
    if (mot(objet) === "gourde" && objets.some((o) => mot(o) === "gourde")) continue;
    objets.push(objet);
  }
  for (const [monnaie, valeur] of sommes) objets.push(`${valeur} ${monnaie}`);
  return objets;
}
