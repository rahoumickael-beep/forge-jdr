// Ce que la table des joueurs a le droit de connaître du canon de l'Archipel : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_ARCHIPEL = {
  prenoms: ["Aurèle", "Bastien", "Corentin", "Delphe", "Esmée", "Félis", "Garance", "Hélier", "Isaure", "Jory", "Lazare", "Maëlys", "Noé", "Octavie", "Paulin", "Romane", "Soline", "Tristan", "Victorine", "Yann", "Zéphyr", "Abel", "Cléo", "Ninon"],
  // Les noms de famille des figures (Arrault, Orsat, Valcourt, Morvaut…) n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [" Morel", " Castagne", " Dufresne", " Lenoir", " Pradel", " Sorbier", " Vautrin", " Bréhat", " Kerlan", " Ferrasse", " Galmier", " Roussel", " Tavernier", " Quillot"],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_ARCHIPEL = [
  "les ruelles de la Basse-Ville de Solenne",
  "une passerelle de la Fonderie des Orgues",
  "la chaussée du lac d'Ancre",
  "une Cité Flottante d'Ilvaë",
  "un hall de clan de Karrag",
  "les docks de Gué-d'Ambre",
  "une épave des Brisants",
  "la coquille éteinte d'un Phare",
];
