// Ce que la table des joueurs a le droit de connaître du canon d'Aubreterre : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_AUBRETERRE = {
  prenoms: ["Bastienne", "Hubert", "Maëlle", "Colin", "Gaudry", "Ombeline", "Jacquet", "Perrine", "Thiébaut", "Aubin", "Gisle", "Ferréol", "Odile", "Brunissende", "Enguerrand", "Mahaut", "Guérin", "Isaure"],
  // Les noms de famille des figures (Crolle, Lescot, Varlet, Pell, Mainferrée…) n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [" Clouet", " Saulnier", " Tourbier", " de Gué", " Cirier", " Ravel", " Fosseux", " Marchois", " Corbin", " Mortemer", " Sauvelet", " Bourrache", " Lattier"],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canon.test.ts vérifie la concordance). */
export const LIEUX_AUBRETERRE = [
  "les faubourgs d'Aube-Close",
  "un fort du Mur des Neuf Cents",
  "une abbaye du Val Cierge",
  "les tourbières des Noyes",
  "les salines de Port-Lagune",
  "un ossuaire muré des Monts Ossiers",
  "une clairière ronde de la Brune",
  "une oasis du Verre-Rouge",
];
