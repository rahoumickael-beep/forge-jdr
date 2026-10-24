// Ce que la table des joueurs a le droit de connaître du canon de la Résidence : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_RESIDENCE = {
  prenoms: [
    "Camille", "Yanis", "Inès", "Karim", "Léa", "Mehdi", "Sofia", "Théo", "Amina", "Lucas", "Fatou", "Noé", "Chloé", "Bilal", "Maëlle", "Samir",
    "Élise", "Idriss", "Jade", "Rayane", "Anaïs", "Paulo", "Louise", "Tarek", "Mina", "Soren", "Lila", "Dario", "Nour", "Océane", "Ilyes", "Zélie",
  ],
  // Les noms de famille des figures (Valcroze, Lancelin, Dufaure, Marchetti, Ferrandi, Ott, Tessandier, Aït-Larbi) n'y sont pas :
  // un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [
    " Benali", " Moreau", " Diallo", " Garnier", " Nguyen", " Costa", " Lefèvre", " Haddad", " Kowalski", " Mercier", " Traoré", " Roux",
    " Ferreira", " Chevalier", " Sahin", " Bonnet", " Okafor", " Fabre", " Petrov", " Lambert", " Bensaïd", " Vidal", " Da Silva", " Perrin",
  ],
};

/** Lieu de rencontre de chaque quartier, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_RESIDENCE = [
  "une terrasse des Hauts, au-dessus des nuages",
  "un couloir des Blocs, sous la pluie",
  "un marché de nuit dans les cales du Port-Franc",
  "un toit de la Friche, entre les barques",
  "une allée du Jardin, sous le dôme",
  "un quai noyé des Souterrains",
  "une passerelle de la Digue, dans les embruns",
];
