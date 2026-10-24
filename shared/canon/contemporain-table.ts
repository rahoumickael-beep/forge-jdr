// Ce que la table des joueurs a le droit de connaître du canon de la Cellule Hermès : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.
// La table publique ne contient aucun secret.

export const NOMS_HERMES = {
  // Prénoms d'état civil de l'Europe de 2026 : France, Belgique, Luxembourg, Suisse, Italie, Pays-Bas, et les familles venues du Maghreb,
  // de Turquie, du Portugal et d'Europe de l'Est qui vivent dans ces pays. Rien de rare.
  prenoms: [
    "Antoine", "Camille", "Nicolas", "Sophie", "Julien", "Émilie", "Thomas", "Claire", "Mathieu", "Élodie", "Romain", "Aurélie", "Pierre", "Marion", "Vincent", "Laure",
    "Karim", "Samira", "Yacine", "Leïla", "Nadia", "Mehdi", "Amel",
    "Luc", "Sven", "Femke", "Joris", "Anouk",
    "Matteo", "Giulia", "Lorenzo", "Chiara",
    "Rui", "Inês", "Ana", "Tiago",
    "Emre", "Selin", "Piotr", "Katarzyna", "Mirela", "Dragan",
  ],
  // Les noms de famille des figures (Mercadier, Chassagne, Vareilles, Dunoyer, Aldebert, Scalvini, Tournemine, Brandvold, Lemarchand, Aldenhove,
  // Zumbrunn, Brinkhof, Pastorelli, Orlhac, Meyssonnier, Kerdilès, Deluchat, Maréchal, Roux) n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  familles: [
    " Fournier", " Garnier", " Lambert", " Fontaine", " Chevallier", " Marchand", " Mercier", " Blanc", " Guérin", " Muller", " Henry", " Roussel",
    " Perrin", " Morel", " Girault", " Bonnet", " Dupuis", " Lefèvre", " Masson",
    " Peeters", " Janssens", " Maes", " Willems", " Jacobs", " De Smet", " Wagner", " Schmit", " Weber", " Hoffmann",
    " Benali", " Haddad", " Mansouri", " Belkacem", " Cherif",
    " Moretti", " Colombo", " Ricci", " Bianchi", " Greco",
    " Pereira", " Carvalho", " Fernandes", " Santos",
    " Yilmaz", " Kowalski", " Nowak", " Petrović", " Popescu",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_HERMES = [
  "l'arrière-boutique de la Mercerie, rideau baissé, autour de la table de coupe",
  "la maison de maître d'Ixelles, devant la plaque de cuivre de l'agence Aldenhove",
  "la barrière d'une ancienne caserne au sud de Luxembourg-Ville, à six heures du matin",
  "un salon boisé de Genève, une chemise cartonnée posée entre deux tasses de thé",
  "le quai du vieux port franc de Trieste, devant un entrepôt de pierre aux portes grandes ouvertes",
  "une rangée de conteneurs bleus de la Maasvlakte, à quatre heures du matin",
  "le Café de la Tourette, sur les quais de la Joliette, à l'ouverture de cinq heures",
];
