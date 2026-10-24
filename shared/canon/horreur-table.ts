// Ce que la table des joueurs a le droit de connaître du canon de la Côte des Noyés : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_COTE_DES_NOYES = {
  prenoms: [
    "Marcel", "Odette", "Lucien", "Berthe", "Émile", "Marguerite", "Joseph", "Eugénie", "Alphonse", "Léontine", "Gaston", "Clémence",
    "Armand", "Célestine", "Prosper", "Madeleine", "Fernand", "Augustine", "Gustave", "Yvonne", "Théophile", "Solange", "Albert", "Hélène",
    "Constant", "Mathilde", "Désiré", "Suzanne", "Octave", "Jeanne", "Baptiste", "Ernestine", "Maurice", "Valentine", "Étienne", "Pierrette",
  ],
  // Les noms de famille des figures (Brévin, Lécuyer, Coquart, Le Bihan, Hamel, Lemarquand, Vauquelin, Marchal, Tellier) n'y sont pas :
  // un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [
    " Lebas", " Duval", " Leroy", " Quesnel", " Lemonnier", " Fontaine", " Hébert", " Lair", " Lecarpentier", " Rouxel", " Letellier", " Bouillon",
    " Moulin", " Blondel", " Pinel", " Cauchois", " Daguenet", " Rivière", " Gosselin", " Pellerin", " Kerbrat", " Morvan", " Bertrand", " Tanguy",
    " Delaunay", " Colin", " Vasseur", " Lefort", " Marchand", " Rolland", " Giraud", " Faure", " Cohen", " Wilkins", " Petrovski", " Sanchez",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_COTE_DES_NOYES = [
  "la grève de Saint-Clair, à l'aube, à marée basse",
  "la morgue de l'Abri-du-Marin, sous la lampe à pétrole",
  "la chaussée de galets du Rocher-Gris",
  "la lande de la Hague, au bord de la falaise",
  "un quai de la grande rade de Cherbourg, sous la pluie",
  "un bureau de la Havraise, rue de Paris, au Havre",
  "une barque de pêche immobile au-dessus de la Fosse",
];
