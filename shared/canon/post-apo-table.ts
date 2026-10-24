// Ce que la table des joueurs a le droit de connaître du canon du Grand Sec : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.

export const NOMS_GRAND_SEC = {
  prenoms: [
    "Mireille", "Jean-Baptiste", "Estève", "Magali", "Titouan", "Noémie", "Yanis", "Fatima", "Clément", "Stella", "Rémi", "Aïcha",
    "Gaëtan", "Sabine", "Mathis", "Nadia", "Florian", "Éliane", "Joris", "Lina", "Théophane", "Manon", "Karim", "Adeline",
    "Basile", "Sonia", "Raphaël", "Yasmine", "Mattéo", "Carmen", "Hugo", "Djamila", "Victorin", "Lucie", "Enzo", "Mélanie",
  ],
  // Les noms de famille des figures (Peyrol, Roumanille, Fabre, Garcin, Brun, Arnaud, Faucon) n'y sont pas :
  // un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [
    " Reynaud", " Mistre"," Bonnefoy", " Aubanel", " Martel", " Blanc", " Pellegrin", " Giraud", " Bérenger", " Igolen", " Bouchard", " Ricard",
    " Lombard", " Imbert", " Arnoux", " Sauvan", " Moulin", " Barnier", " Ben Salah", " Benamar", " Ruiz", " Navarro", " Lopez", " Esposito",
    " Marcellin", " Cardinal", " Boyer", " Rey", " Agostini", " Zerrouki", " Dupuy", " Teissier", " Chabaud", " Vial", " Roux", " Carbonel",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_GRAND_SEC = [
  "un char à voile arrêté en plein lit du fleuve, sous le soleil de midi",
  "la file du Grand Puits, dans la cour du Palais",
  "une plage noire de suie, entre les alambics des bouilleries",
  "une crête des Cévennes, au pied d'un Mât qui tourne",
  "la route en lacets du Mont Chauve, au bord de la pluie",
  "le camp de la Porte-d'Attente, au pied du Mur de Valence",
  "une plaine de sel de la Camargue, sous un ciel blanc",
];
