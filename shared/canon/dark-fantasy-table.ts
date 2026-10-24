// Ce que la table des joueurs a le droit de connaître du canon de la Ternelande : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_TERNELANDE = {
  prenoms: ["Anseau", "Béatrix", "Clément", "Douce", "Évrard", "Fleurie", "Gauvain", "Hodierne", "Isembart", "Jehanne", "Lambert", "Mabile", "Nivelon", "Oudine", "Perrin", "Richilde", "Sanche", "Tiphaine", "Ursin", "Yolande", "Aubri", "Guiraude"],
  // Les noms de famille des figures (Vauclair, Malhaume, Vair…) n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [" Gelin", " Fauvel", " Rognon", " Lagel", " Pierrefroide", " Brumel", " Charnois", " Tourbet", " Mauclerc", " Vergne", " Haquin", " Rousset"],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_TERNELANDE = [
  "les ruelles gelées de Haute-Cendre",
  "le bord des Neiges Hautes",
  "un lac gelé de Vaugelée",
  "une clairière des Blancs-Bois",
  "un village brûlé des Comtés Rouges",
  "les faubourgs de Saint-Mémoire",
  "une ferme abandonnée des Landes Effacées",
  "les quais de Brise-Glace",
];
