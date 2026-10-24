// Ce que la table des joueurs a le droit de connaître du canon des Îles du Vent : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.
// La table publique ne contient aucun secret.

export const NOMS_ILES_DU_VENT = {
  // Français de la façade atlantique (Normandie, Bretagne, Saintonge), Espagnols des Antilles, Anglais et Irlandais, Hollandais,
  // et noms que portent aux îles des Africains libres ou affranchis (jours de naissance akan, prénoms de la côte de Guinée).
  prenoms: [
    "Mathurin", "Perrine", "Yves", "Jeanne", "Guillaume", "Marguerite", "Pierrick", "Thomasse", "Jacquot", "Anne-Marie", "Olivier", "Gillette",
    "Noël", "Madeleine", "Hervé", "Yvonne", "Gabriel", "Jacquette", "Ambroise", "Mahaut",
    "Diego", "Inés", "Alonso", "Leonor", "Hernando", "Catalina", "Gaspar", "Beatriz",
    "Thomas", "Elizabeth", "Silas", "Hannah", "Nathaniel", "Susannah", "Ezra", "Prudence",
    "Cormac", "Maeve", "Declan", "Nora",
    "Joost", "Griet", "Pieter", "Marijke",
    "Kofi", "Akosua", "Kwame", "Adjoa", "Yao", "Abena", "Kossi", "Sika",
  ],
  // Les noms de famille des figures (Faucheux, Arriaga, Vaucelles, Truscott, Larrañaga, Le Goff, Duclos-Varenne) n'y sont pas :
  // un PNJ tiré au hasard ne doit pas devenir l'une d'elles. Aucun nom de pirate ayant réellement existé non plus.
  familles: [
    " Le Bihan", " Kerjean", " Rouxel", " Gautier", " Lefèvre", " Chauvin", " Bréhier", " Dupuis", " Morvan", " Tanguy", " Delacroix", " Lemoine",
    " Boisseau", " Caradec", " Pellerin", " Moreau", " Guillou", " Mahé",
    " Salcedo", " Ordóñez", " Medina", " Quintana", " Olmedo", " Sepúlveda",
    " Pickering", " Hartley", " Wilcox", " Marsden", " Fothergill", " Ashby",
    " O'Dwyer", " Cassidy", " Brannigan",
    " Van Dijk", " De Vries", " Hoogstraten",
    " Mensah", " Boateng", " Adomako", " Houngbo", " Sagbo",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_ILES_DU_VENT = [
  "le quai de l'Anse-aux-Lames, au soleil couchant, quand un brigantin rentre en tirant un coup de canon",
  "une barque sur l'eau claire des bancs de Floride, à six brasses des mâts d'une épave",
  "la baie de La Havane, au matin, quand on tire la chaîne qui ferme le port",
  "les tentes de voiles de Nassau, devant une caisse d'épave où l'on lit la chasse-partie",
  "le quai de Saint-Pierre de la Martinique, entre les barriques de sucre, sous le volcan",
  "un sentier de crête des mornes de Saint-Domingue, sous le regard d'une sentinelle",
  "la fosse de Bahama, à l'aube, sur une mer d'encre où file un courant",
];
