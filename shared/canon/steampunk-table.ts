// Ce que la table des joueurs a le droit de connaître du canon de l'Exposition éternelle : les noms à tirer et les lieux de rencontre.
// Les joueurs chargent ce fichier (par genres.ts) ; le reste du canon reste dans le code du MJ.
// La table publique ne contient aucun secret.

export const NOMS_EXPOSITION = {
  // Parisiens de 1899 (prénoms d'état civil, rien de rare), puis les noms que portent à l'Éternelle les gens des Villages
  // (Sénégal, Annam, Kabylie) et les visiteurs restés (Russie, Italie, Angleterre, Amérique), tels qu'un registre de 1899 les écrit.
  prenoms: [
    "Armand", "Berthe", "Lucien", "Eugénie", "Marcel", "Jeanne", "Julien", "Marguerite", "Albert", "Léonie", "Théophile", "Augustine",
    "Fernand", "Clémence", "Hippolyte", "Eulalie", "Paul", "Mathilde", "Joseph", "Germaine", "Honoré", "Odette",
    "Mamadou", "Fatou", "Ibrahima", "Aminata", "Ousmane", "Awa", "Cheikh", "Khady",
    "Minh", "Lan", "Thanh", "Hùng", "Mai",
    "Amar", "Tassadit", "Ouali", "Dihya",
    "Arthur", "Eleanor", "Ivan", "Anastasia", "Giacomo", "Lucia", "Henry", "Clara",
  ],
  // Les noms de famille des figures (Faverolle, Delestrade, Quillebeuf, Dorlhac, Cordebard, Ndoye, Nguyễn, Gerfaux, Mauvezin, Pétrel)
  // n'y sont pas : un PNJ tiré au hasard ne doit pas devenir l'une d'elles. Aucun nom de personne réelle de l'époque non plus.
  familles: [
    " Barbier", " Lenoir", " Poulain", " Brunet", " Colas", " Gaudin", " Pasquier", " Rivière", " Chevalier", " Dufour", " Lemaire", " Girard",
    " Boyer", " Cordier", " Vasseur", " Mallet", " Perrot", " Tessier", " Joubert", " Hamon",
    " Diop", " Sow", " Fall", " Sarr", " Diallo", " Seck", " Thiam", " Gueye",
    " Trần", " Lê", " Phạm", " Võ",
    " Haddad", " Boudjema", " Mebarek",
    " Whitfield", " Petrov", " Rinaldi", " Hargrove", " Ferraro", " Volkov",
  ],
};

/** Lieu de rencontre de chaque région, dans l'ordre des régions du canon (shared/canons.test.ts vérifie la concordance). */
export const LIEUX_EXPOSITION = [
  "la Galerie des Machines, à minuit, sous les ponts roulants, quand les lampes à arc se mettent à vaciller",
  "la troisième plate-forme de la Tour, à l'amarre d'un dirigeable gris, au-dessus des toits de Paris dans la brume",
  "les fontaines du Trocadéro, allumées en cascade, devant la salle des brevets",
  "la halle de verre du Palais de l'Électricité, entre les dynamos hautes comme des maisons",
  "l'esplanade des Invalides, devant les grilles des Villages, à l'heure où les gardes les ferment",
  "la porte de Javel, à six heures du soir, à la relève des mécaniciens",
  "l'escalier de pierre qui descend vers les Carrières, devant la grille repeinte",
  "une table de zinc dans un cabaret de la rue des Saules, avec le Champ qui clignote au loin",
];
