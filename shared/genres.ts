import { LIEUX_AUBRETERRE, NOMS_AUBRETERRE } from "./canon/fantasy-table";
import { LIEUX_ARCHIPEL, NOMS_ARCHIPEL } from "./canon/science-fiction-table";
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
    pitch: "Monde cruel, magie corrompue, survie et choix moraux.",
    theme: { background: "#141212", floor: "#5d5650", wall: "#2a2422", water: "#2b3f45", vegetation: "#3b4a2c", road: "#4e4238", door: "#6b2a20", grid: "rgba(0,0,0,.35)" },
    stats: ["Vigueur", "Agilité", "Endurance", "Savoir", "Volonté", "Présence"],
    archetypes: ["Chasseur de sorcières", "Mercenaire", "Hérétique", "Chirurgien-barbier", "Pèlerin maudit", "Chevalier déchu", "Sorcière des ronces", "Fossoyeur"],
    origins: ["Paysan des marches", "Noble ruiné", "Enfant de la peste", "Moine renégat", "Survivant d'un massacre"],
    equipment: ["Arbalète lourde", "Hachette rouillée", "Pieu en frêne", "Huile sainte", "Scie d'amputation", "Relique douteuse", "Masque à bec", "Chapelet d'ossements"],
    abilities: ["Rituel de sang", "Résister à la folie", "Traque nocturne", "Exorcisme", "Coup de grâce", "Pacte interdit"],
    nameStart: ["Aldr", "Bael", "Corv", "Grim", "Hesk", "Mord", "Ulr", "Wex", "Sev", "Rav"],
    nameEnd: ["ric", "mund", "gar", "wald", "a", "ine", "ok", "ard"],
    places: ["la cathédrale effondrée", "le village pestiféré de Hollowmere", "la forêt des pendus", "le champ de bataille éternel", "l'abbaye des sœurs muettes"],
    traits: ["hanté par son passé", "cynique", "dévot jusqu'à l'aveuglement", "survivant à tout prix"],
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
    pitch: "Mégapoles néon, implants, hackers et corporations.",
    theme: { background: "#0d0716", floor: "#2c2440", wall: "#130d20", water: "#1aa6b7", vegetation: "#3b8f4a", road: "#3d3357", door: "#ff3fa4", grid: "rgba(255,63,164,.15)" },
    stats: ["Corps", "Réflexes", "Tech", "Intelligence", "Cool", "Empathie"],
    archetypes: ["Netrunner", "Solo", "Fixer", "Techie", "Médecin des rues", "Journaliste", "Nomade", "Flic corrompu"],
    origins: ["Gosse des bas-fonds", "Ex-employé corpo", "Nomade des Badlands", "Enfant de star", "Augmenté militaire"],
    equipment: ["Pistolet intelligent", "Lame-mante", "Cyberdeck", "Lunettes thermiques", "Manteau blindé", "Grenade EMP", "Faux identifiants", "Moto électrique"],
    abilities: ["Piratage de réseau", "Réflexes boostés", "Intimidation", "Contacts dans la rue", "Bricolage d'implants", "Camouflage optique"],
    nameStart: ["Jax", "Kiro", "Neo", "Rook", "Vex", "Zara", "Tak", "Mika", "Nyx", "Rex"],
    nameEnd: [" Volt", " Chrome", " Zero", " Byte", " Ghost", " Razor", " Silk"],
    places: ["le marché noir de Kowloon-2", "la tour Arasaka-Nova", "le club Néon Lotus", "les égouts du district 9", "le data-center sous-marin"],
    traits: ["paranoïaque", "accro à l'adrénaline", "code d'honneur de rue", "vend n'importe qui"],
  },
  {
    id: "horreur",
    label: "Horreur",
    pitch: "Enquêtes, créatures indicibles et santé mentale fragile.",
    theme: { background: "#0e0f0d", floor: "#4a4a40", wall: "#1c1d19", water: "#203a36", vegetation: "#2f3d26", road: "#3e3c33", door: "#7a1f1f", grid: "rgba(0,0,0,.4)" },
    stats: ["Force", "Dextérité", "Constitution", "Intelligence", "Pouvoir", "Santé mentale"],
    archetypes: ["Détective privé", "Professeur d'occultisme", "Journaliste", "Médecin", "Antiquaire", "Prêtre", "Photographe", "Ancien soldat"],
    origins: ["Bostonien", "Aristocrate anglais", "Fermier du Vermont", "Immigrée italienne", "Universitaire de Miskatonic"],
    equipment: ["Revolver", "Lampe torche", "Carnet de notes", "Appareil photo", "Livre interdit", "Flasque de whisky", "Crucifix", "Pied-de-biche"],
    abilities: ["Fouiller", "Bibliothèque", "Psychologie", "Occultisme", "Premiers soins", "Discrétion"],
    nameStart: ["Ar", "Ed", "Har", "Lav", "Ru", "Wil", "Abi", "Cor", "Eli", "Mar"],
    nameEnd: ["thur", "gar", "vey", "inia", "dolph", "bur", "gail", "nelia", "jah", "tha"],
    places: ["le manoir Blackwood", "l'asile d'Arkham", "le village de pêcheurs d'Innsmouth", "la bibliothèque interdite", "le phare abandonné"],
    traits: ["sceptique", "nerveux", "fasciné par l'occulte", "insomniaque"],
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
