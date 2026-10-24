// Ce que la table des joueurs a le droit de connaître du canon du Champ-d'Asile : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.
// Rien ici ne touche au Traité : la table publique ne contient aucun secret.

export const NOMS_CHAMP_D_ASILE = {
  // Français du XIXe siècle, Créoles de Louisiane, Mexicains et Tejanos, Allemands du Texas, Irlandais, Américains.
  prenoms: [
    "Anatole", "Eugénie", "Théodore", "Célestine", "Ambroise", "Philomène", "Aristide", "Zoé", "Honoré", "Adèle", "Gustave", "Léonie",
    "Octave", "Clotilde", "Narcisse", "Mathilde", "Prosper", "Joséphine", "Baptiste", "Apolline", "Évariste", "Delphine",
    "Alcide", "Désirée", "Placide", "Odalie", "Toussaint", "Coralie",
    "Rafael", "Inés", "Joaquín", "Lupe", "Mateo", "Dolores", "Esteban", "Rosario", "Tomás", "Catalina", "Anselmo", "Pilar",
    "Friedrich", "Greta", "Johann", "Liesel", "Konrad", "Ottilie", "Wilhelm", "Hedwig",
    "Patrick", "Maeve", "Brendan", "Nora", "Cormac", "Bridie", "Declan", "Sheila",
    "Silas", "Abigail", "Amos", "Prudence", "Josiah", "Lucinda", "Clayton", "Hattie",
    "Étienne", "Marthe", "Jules", "Rose",
  ],
  // Les noms de famille des figures (Saint-Gilles, Crane, Lacoste, Burke, Ortiz, Dutour, Duvernet, Hale, Arredondo, Sorbier, Moss, Roux, Bastide)
  // n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles.
  // Les noms comanches sont des traductions françaises inventées, comme les donneraient les Asiliens ; aucun n'est celui d'un chef réel.
  familles: [
    " Lemercier", " Vauquelin", " Delaunay", " Montauban", " Faucheux", " Beauchamp", " Chevalier", " Mercadier", " Larrieu", " Ducasse",
    " Boisvert", " Pelletier", " Lacombe", " Rochefort", " Tessier", " Marchand", " Cormier", " Dufresne",
    " Broussard", " Thibodeaux", " Guidry", " Fontenot", " Landry", " Boudreaux", " Hébert", " Bergeron",
    " Garza", " Villarreal", " Treviño", " Salinas", " Cantú", " Guerra", " Montemayor", " Olivares", " Zamora", " Benavides",
    " Schulz", " Hoffmann", " Brandt", " Vogel", " Kessler", " Reinhardt", " Lindner", " Roth",
    " O'Connor", " Doyle", " Gallagher", " Keegan", " Brennan", " Fitzgerald", " McCarthy", " Dunne",
    " Harlan", " Whitaker", " Coleman", " Pruitt", " Garrett", " Tillman", " Stokes", " Mercer",
    " Cheval-Gris", " Rivière-Haute", " Herbe-Longue", " Ciel-Clair", " Plume-de-Hibou", " Pas-Tranquille", " Eau-Claire", " Feu-du-Soir",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_CHAMP_D_ASILE = [
  "la place de Bonne-Espérance, à midi, quand l'ombre du clocher touche le marché",
  "le bout des rails de Fort-Rail, devant la borne de pierre de 1820",
  "la galerie d'un rancho du Brazos, au coucher du soleil",
  "la croix de pierre, au bord du plateau, entre deux cavaliers qui se regardent",
  "un canyon rouge de la Comanchería, au crépuscule, près d'un campement de tipis",
  "un gué du Concho, au clair de lune",
];
