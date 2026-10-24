import { LIEUX_AUBRETERRE, NOMS_AUBRETERRE } from "./canon/fantasy-table";
import { LIEUX_ARCHIPEL, NOMS_ARCHIPEL } from "./canon/science-fiction-table";
import { LIEUX_TERNELANDE, NOMS_TERNELANDE } from "./canon/dark-fantasy-table";
import { LIEUX_RESIDENCE, NOMS_RESIDENCE } from "./canon/cyberpunk-table";
import { LIEUX_COTE_DES_NOYES, NOMS_COTE_DES_NOYES } from "./canon/horreur-table";
import type { GenreId, Ton } from "./types";

/** Couleurs de rendu de la carte pour un genre. */
export interface MapTheme {
  background: string;
  floor: string;
  wall: string;
  water: string;
  vegetation: string;
  road: string;
  door: string;
  grid: string;
}

export interface Genre {
  id: GenreId;
  label: string;
  pitch: string;
  theme: MapTheme;
  stats: string[]; // noms des caractéristiques
  archetypes: string[];
  origins: string[];
  equipment: string[];
  abilities: string[];
  nameStart: string[];
  nameEnd: string[];
  places: string[];
  traits: string[];
}

export const TONS: { id: Ton; label: string }[] = [
  { id: "epique", label: "Épique" },
  { id: "sombre", label: "Sombre" },
  { id: "humoristique", label: "Humoristique" },
  { id: "mysterieux", label: "Mystérieux" },
];

const classicStats = ["Force", "Dextérité", "Constitution", "Intelligence", "Sagesse", "Charisme"];

export const GENRES: Genre[] = [
  {
    id: "fantasy",
    label: "Fantasy",
    pitch: "Aubreterre : le Dieu-Empereur est mort sur son trône, et les morts ne restent plus couchés.",
    theme: { background: "#2b2a24", floor: "#c9b98f", wall: "#5a4a36", water: "#3f7ea6", vegetation: "#5d8a3c", road: "#a88c5a", door: "#8a4f22", grid: "rgba(40,30,20,.25)" },
    stats: classicStats,
    archetypes: ["Guerrier", "Magicienne", "Voleur", "Clerc", "Rôdeuse", "Barde", "Paladin", "Druide", "Barbare", "Moine", "Ensorceleuse", "Occultiste", "Chasseur de morts", "Veilleur du sceau"],
    origins: ["Humain", "Elfe de la Brune", "Nain des Ossiers", "Petite gens", "Demi-orc", "Revenu", "Sang-Doré"],
    equipment: ["Épée longue", "Arc court", "Marteau de cloueur", "Sac de clous en fer froid", "Brigandine", "Bouclier aux armes d'Aube-Close", "Potion de soin", "Lanterne au verre bleu", "Grimoire de Peseur", "Sachet de sel bénit", "Pot de goudron", "Sauf-conduit de la Chancellerie"],
    abilities: ["Boule de feu", "Attaque sournoise", "Soin des blessures", "Rage du berserker", "Pas brumeux", "Inspiration bardique", "Châtiment divin", "Forme animale", "Clouer un mort", "Veillée"],
    nameStart: NOMS_AUBRETERRE.prenoms,
    nameEnd: NOMS_AUBRETERRE.familles,
    places: LIEUX_AUBRETERRE,
    traits: ["compte tout, même les morts", "parle aux cadavres avant de les fouiller", "garde toujours du sel dans sa poche", "ne dort plus depuis le Glas", "cite le Code pour tout", "refuse de brûler un mort"],
  },
  {
    id: "dark-fantasy",
    label: "Dark fantasy",
    pitch: "La Ternelande : chaque hiver, on donne un souvenir pour que le printemps revienne. La magie se paie de la même monnaie.",
    theme: { background: "#141212", floor: "#5d5650", wall: "#2a2422", water: "#2b3f45", vegetation: "#3b4a2c", road: "#4e4238", door: "#6b2a20", grid: "rgba(0,0,0,.35)" },
    stats: ["Vigueur", "Agilité", "Endurance", "Savoir", "Volonté", "Présence"],
    archetypes: ["Chasseur de sorcières", "Mercenaire", "Chirurgien-barbier", "Pèlerin", "Sorcière des ronces", "Mémorialiste", "Fossoyeur", "Coupe-jarret", "Dîmier renégat", "Complainteur"],
    origins: ["Humain ternois", "Humain des Comtés", "Gris-de-Sang", "Effacé", "Sylvain", "Houilleur"],
    equipment: ["Épée bâtarde", "Arbalète de chasse", "Faux de guerre", "Couteau de fer froid", "Brigandine", "Lanterne sourde", "Trousse de chirurgien-barbier", "Fiole de lait d'oubli", "Reliquaire de fil rouge", "Registre de paroisse", "Masque d'étain volé", "Peau de loup d'hiver"],
    abilities: ["Attaque sournoise", "Brûler un souvenir", "Chant de complainte", "Amputer", "Flairer le sorcier", "Coup de faux", "Pister sur la neige", "Rendre un nom", "Tenir la veillée", "Mentir au Dîmier"],
    nameStart: NOMS_TERNELANDE.prenoms,
    nameEnd: NOMS_TERNELANDE.familles,
    places: LIEUX_TERNELANDE,
    traits: ["ne sait plus le nom de sa mère", "compte les hivers sur ses doigts", "porte le manteau d'un mort qu'il a oublié", "refuse de toucher une pierre de dîme", "se signe devant chaque Registre", "chante à voix basse pour ne pas oublier"],
  },
  {
    id: "science-fiction",
    label: "Science-fiction",
    pitch: "L'Archipel : on saute d'étoile en étoile par les Phares, et les Phares s'éteignent un à un.",
    theme: { background: "#0b1220", floor: "#3a4a62", wall: "#1a2333", water: "#1f6f8b", vegetation: "#2e7a5f", road: "#55657d", door: "#e0a33a", grid: "rgba(120,180,255,.18)" },
    stats: ["Puissance", "Réflexes", "Endurance", "Technique", "Instinct", "Présence"],
    archetypes: ["Chantre", "Pilote", "Mécanicienne", "Fusilier", "Contrebandière", "Chasseur de primes", "Médecin de bord", "Diplomate", "Ferrailleur", "Capitaine"],
    origins: ["Humain ancrien", "Humain frangier", "Vaëlle", "Tarrak", "Ikki", "Ourdi", "Ouvré"],
    equipment: ["Pistolet brûleur", "Fusil brûleur", "Lame vibrante", "Matraque électrique", "Combinaison de vide", "Trousse de mécanicien", "Trousse de médecin de bord", "Grappin magnétique", "Faux transpondeur", "Carte des Routes annotée", "Sauf-conduit hégémonique", "Éclat de pierre de Phare"],
    abilities: ["Esquive en vrille", "Tir de couverture", "Réparation de fortune", "Pousser par le Chant", "Entendre la pierre", "Négocier une dette", "Pirater un transpondeur", "Saut en resquille", "Premiers soins de bord", "Fouiller une épave"],
    nameStart: NOMS_ARCHIPEL.prenoms,
    nameEnd: NOMS_ARCHIPEL.familles,
    places: LIEUX_ARCHIPEL,
    traits: ["compte ses dettes à voix haute", "touche la coque avant chaque saut", "n'a jamais vu un Phare de près", "garde un éclat de cristal dans sa botte", "parle aux moteurs", "refuse de payer le Péage par principe"],
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    pitch: "La Résidence : une ville entière appartient à une société, et le loyer se paie avec les heures de sa vie.",
    theme: { background: "#0d0716", floor: "#2c2440", wall: "#130d20", water: "#1aa6b7", vegetation: "#3b8f4a", road: "#3d3357", door: "#ff3fa4", grid: "rgba(255,63,164,.15)" },
    stats: ["Corps", "Réflexes", "Endurance", "Technique", "Instinct", "Aplomb"],
    archetypes: ["Fouineur", "Solo", "Médic de rue", "Huissier défroqué", "Coursier", "Syndicaliste", "Fixeur", "Mécano", "Prêcheur des Sans-Bail", "Journaliste"],
    origins: ["Résident des Blocs", "Enfant des Hauts", "Prolongé", "Sans-Bail", "Cousu", "Locataire"],
    equipment: ["Taser à harpon", "Pistolet à aiguilles", "Matraque électrique", "Lame de céramique", "Armure légère en fibre", "Compteur piraté", "Brassard d'Huissier", "Clé barrée", "Ciré de la Digue", "Trousse de médic de rue", "Lunettes de visée", "Carte de la Friche"],
    abilities: ["Entrer dans le Réseau", "Effacer sa trace", "Négocier un arrangement", "Soigner un corps qui fond", "Courir les passerelles", "Parler au nom du palier", "Réparer un implant", "Tenir une porte", "Mentir à un Huissier", "Écouter la Voix"],
    nameStart: NOMS_RESIDENCE.prenoms,
    nameEnd: NOMS_RESIDENCE.familles,
    places: LIEUX_RESIDENCE,
    traits: ["compte tout en heures", "vérifie son solde avant de s'asseoir", "garde un avis d'expulsion plié dans sa poche", "parle bas, comme dans les Hauts", "ne dort jamais sans entendre la pluie", "salue chaque caméra par son numéro"],
  },
  {
    id: "horreur",
    label: "Horreur",
    pitch: "La Côte des Noyés : Cotentin, 1923. La mer rend des noyés habillés en voyageurs, et des experts d'assurances lisent leurs lettres.",
    theme: { background: "#0e0f0d", floor: "#4a4a40", wall: "#1c1d19", water: "#203a36", vegetation: "#2f3d26", road: "#3e3c33", door: "#7a1f1f", grid: "rgba(0,0,0,.4)" },
    stats: ["Force", "Adresse", "Endurance", "Savoir", "Sang-froid", "Présence"],
    archetypes: ["Expert en sinistres", "Ancien poilu", "Médecin", "Abbé", "Journaliste", "Photographe", "Pêcheur", "Médium", "Gendarme", "Antiquaire"],
    origins: ["Gens de la côte", "Revenus de la guerre", "Bourgeois de la ville", "Étrangers", "Enfants du siècle", "Sensibles"],
    equipment: ["Revolver d'ordonnance de 1892", "Lampe-tempête", "Carnet de notes", "Appareil photographique à soufflet", "Lettre de mission de la Havraise", "Flasque de calvados", "Gaffe de pêcheur", "Table des marées"],
    abilities: ["Poser les bonnes questions", "Lire un contrat", "Tenir une tranchée", "Soigner un corps qui ne pourrit pas", "Connaître les marées", "Bénir les morts", "Faire parler un témoin", "Tenir sa lampe dans le vent", "Écouter la mer"],
    nameStart: NOMS_COTE_DES_NOYES.prenoms,
    nameEnd: NOMS_COTE_DES_NOYES.familles,
    places: LIEUX_COTE_DES_NOYES,
    traits: ["vérifie les marées avant de sortir", "ne siffle jamais face à la mer", "garde une lettre non ouverte dans sa poche", "compte les couverts sur la table", "dort avec la lampe allumée", "parle de la mer comme d'une voisine"],
  },
  {
    id: "post-apo",
    label: "Post-apocalyptique",
    pitch: "Ruines, mutants, pénurie et clans rivaux.",
    theme: { background: "#1f1a12", floor: "#a38b5e", wall: "#4b3f2c", water: "#5d7d4a", vegetation: "#6b7a3a", road: "#7c6a4a", door: "#b5532a", grid: "rgba(40,30,10,.25)" },
    stats: ["Force", "Perception", "Endurance", "Charisme", "Intelligence", "Chance"],
    archetypes: ["Pillard", "Mécano", "Éclaireuse", "Docteur des ruines", "Chef de convoi", "Mutant", "Ancien de l'abri", "Chasseur de primes"],
    origins: ["Né dans un abri", "Enfant des sables", "Mutant des terres irradiées", "Ex-soldat", "Membre d'une secte"],
    equipment: ["Fusil à pompe bricolé", "Masque à gaz", "Compteur Geiger", "Batte cloutée", "Rations", "Eau purifiée", "Pièces détachées", "Buggy rouillé"],
    abilities: ["Fouille de ruines", "Résistance aux radiations", "Bricolage", "Marchandage", "Conduite folle", "Survie"],
    nameStart: ["Ash", "Dust", "Rust", "Max", "Fury", "Sca", "Bolt", "Jin", "Kat"],
    nameEnd: ["", "y", "er", "ie", "o", "ka"],
    places: ["la ville morte de Néo-Paris", "le marché du Cratère", "le barrage fortifié", "l'abri 77", "l'autoroute des carcasses"],
    traits: ["débrouillard", "méfiant", "garde l'espoir", "un peu fou"],
  },
  {
    id: "western",
    label: "Western",
    pitch: "Duels, chercheurs d'or, hors-la-loi et frontière sauvage.",
    theme: { background: "#2a1d12", floor: "#d0a868", wall: "#6d4a2a", water: "#4e8aa3", vegetation: "#8a9a4a", road: "#b58a52", door: "#5a3218", grid: "rgba(60,30,10,.22)" },
    stats: ["Poigne", "Vitesse", "Résistance", "Astuce", "Instinct", "Bagout"],
    archetypes: ["Pistolero", "Shérif", "Chasseur de primes", "Joueur de poker", "Prospecteur", "Médecin itinérant", "Éclaireur", "Prédicateur"],
    origins: ["Texan", "Immigré irlandais", "Ancien confédéré", "Fille de rancher", "Vagabond de l'Est"],
    equipment: ["Colt Peacemaker", "Winchester", "Lasso", "Cheval fidèle", "Jeu de cartes truqué", "Dynamite", "Étoile de shérif", "Flasque de bourbon"],
    abilities: ["Dégainer vite", "Pister", "Bluffer", "Monter à cheval", "Soigner", "Tir à la hanche"],
    nameStart: ["Jed", "Wy", "Cal", "Doc", "Hank", "Ma", "Bil", "Jo", "Sam"],
    nameEnd: ["att", "ly", "eb", "die", "sey", "ton", "ry"],
    places: ["la ville de Dusty Creek", "le canyon du Diable", "la mine d'or abandonnée", "le train de Santa Fe", "le saloon du Dernier Verre"],
    traits: ["taciturne", "beau parleur", "justicier", "joueur invétéré"],
  },
  {
    id: "pirates",
    label: "Pirates",
    pitch: "Haute mer, abordages, trésors et îles maudites.",
    theme: { background: "#0f2533", floor: "#d8c08a", wall: "#6a4b2c", water: "#2a6f9b", vegetation: "#3f8a4a", road: "#b39463", door: "#7a3e1c", grid: "rgba(0,30,50,.2)" },
    stats: ["Force", "Agilité", "Robustesse", "Ruse", "Navigation", "Panache"],
    archetypes: ["Capitaine", "Canonnier", "Navigatrice", "Cuisinier de bord", "Corsaire", "Sorcier vaudou", "Mousse", "Maître d'armes"],
    origins: ["Port-Royal", "Tortuga", "Marine royale déserteuse", "Esclave libéré", "Fils de marchand"],
    equipment: ["Sabre d'abordage", "Pistolet à silex", "Longue-vue", "Boussole étrange", "Rhum", "Grappin", "Carte au trésor", "Perroquet bavard"],
    abilities: ["Abordage", "Navigation aux étoiles", "Duel", "Tirer au canon", "Vaudou", "Intimidation"],
    nameStart: ["Bart", "Cal", "Jack", "Anne", "Mor", "Red", "Fla", "Sil"],
    nameEnd: ["holomew", "ico", " le Noir", "gan", "beard", "nt", "ver"],
    places: ["l'île de la Tortue", "le Triangle des Brumes", "le fort espagnol", "la crique du Squelette", "l'épave du Hollandais"],
    traits: ["fanfaron", "superstitieux", "loyal à l'équipage", "cupide"],
  },
  {
    id: "steampunk",
    label: "Steampunk",
    pitch: "Vapeur, engrenages, dirigeables et inventions folles.",
    theme: { background: "#1d1712", floor: "#a88d6a", wall: "#4a3726", water: "#3d6b70", vegetation: "#58703e", road: "#8a7050", door: "#b07a2a", grid: "rgba(50,30,10,.25)" },
    stats: ["Muscle", "Adresse", "Endurance", "Génie", "Sang-froid", "Prestance"],
    archetypes: ["Inventeuse", "Aéronaute", "Détective", "Duelliste", "Automate", "Aristocrate", "Mécanicien", "Espionne"],
    origins: ["Londonien", "Parisienne des toits", "Automate conscient", "Ouvrier des forges", "Exploratrice coloniale"],
    equipment: ["Pistolet à vapeur", "Lunettes de laiton", "Canne-épée", "Bras mécanique", "Jet-pack expérimental", "Clé à molette", "Montre à gousset", "Plans secrets"],
    abilities: ["Invention improvisée", "Pilotage de dirigeable", "Déduction", "Escrime", "Réparation", "Mondanités"],
    nameStart: ["Ada", "Ver", "Bar", "Cor", "Edm", "Pen", "Thad", "Wil"],
    nameEnd: ["lovelace", "ne", "naby", "delia", "und", "elope", "deus", "helmina"],
    places: ["les docks de Londres", "le dirigeable Impératrice", "l'usine du Docteur Gearhart", "l'Exposition universelle", "les catacombes à vapeur"],
    traits: ["excentrique", "snob", "génial mais distrait", "intrépide"],
  },
  {
    id: "contemporain",
    label: "Contemporain / Thriller",
    pitch: "Monde actuel, espions, complots et enquêtes.",
    theme: { background: "#16191d", floor: "#9aa1a6", wall: "#3b4148", water: "#3b7ca8", vegetation: "#4f8a4a", road: "#5d646b", door: "#c4752a", grid: "rgba(0,0,0,.2)" },
    stats: ["Physique", "Agilité", "Résistance", "Intellect", "Vigilance", "Charme"],
    archetypes: ["Agent secret", "Hackeuse", "Policier", "Journaliste", "Médecin urgentiste", "Ancien militaire", "Voleur de luxe", "Avocate"],
    origins: ["Parisien", "Marseillaise", "New-Yorkais", "Ex-agent de l'Est", "Fille de diplomate"],
    equipment: ["Pistolet compact", "Smartphone crypté", "Faux passeport", "Kit de crochetage", "Gilet pare-balles", "Voiture rapide", "Ordinateur portable", "Oreillette"],
    abilities: ["Infiltration", "Piratage", "Conduite", "Interrogatoire", "Combat rapproché", "Déguisement"],
    nameStart: ["Alex", "Sam", "Léa", "Max", "Nina", "Hugo", "Inès", "Karim", "Zoé"],
    nameEnd: [" Moreau", " Laurent", " Petit", " Garcia", " Roux", " Benali", " Martin"],
    places: ["un gala à Monaco", "le métro parisien", "un laboratoire secret en Suisse", "un yacht au large", "un entrepôt sur les docks du Havre"],
    traits: ["calme", "impulsif", "idéaliste", "pragmatique"],
  },
];

export function getGenre(id: GenreId): Genre {
  return GENRES.find((g) => g.id === id) ?? GENRES[0];
}

/** Paliers de niveau, utilisés pour doser les scénarios. */
export function levelTier(level: number): { label: string; index: number } {
  if (level <= 4) return { label: "Débutant", index: 0 };
  if (level <= 10) return { label: "Aguerri", index: 1 };
  if (level <= 16) return { label: "Héroïque", index: 2 };
  return { label: "Légendaire", index: 3 };
}
