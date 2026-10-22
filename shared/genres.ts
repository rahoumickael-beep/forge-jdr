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
  hooks: string[];
  villains: string[];
  motivations: string[];
  /** Ennemis rangés du plus faible au plus fort. */
  enemies: string[];
  twists: string[];
  rewards: string[];
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
    nameStart: ["Bastienne", "Hubert", "Maëlle", "Colin", "Gaudry", "Ombeline", "Jacquet", "Perrine", "Thiébaut", "Aubin", "Gisle", "Ferréol", "Odile", "Brunissende", "Enguerrand", "Mahaut", "Guérin", "Isaure"],
    nameEnd: [" Crolle", " Lescot", " Varlet", " Clouet", " Saulnier", " Mainferrée", " Pell", " Tourbier", " de Gué", " Cirier", " Brac", " Ravel", " Fosseux", " Marchois"],
    places: ["les tourbières des Noyes", "les faubourgs d'Aube-Close", "un fort du Mur des Neuf Cents", "une abbaye du Val Cierge", "les salines de Port-Lagune", "un ossuaire muré des Monts Ossiers", "une clairière ronde de la Brune", "une oasis du Verre-Rouge"],
    hooks: ["Un apprenti cloueur n'est pas revenu d'un village sur pilotis.", "Les morts d'un cimetière du Val se sont agenouillés devant l'autel avant de partir vers l'est.", "Une légion de Hersende réquisitionne le sel d'un village qui en a besoin pour ses morts.", "Un Revenu demande qu'on retrouve la personne qui l'a vu revenir.", "Un scribe de la Chancellerie propose de l'or pour un rouleau volé."],
    villains: ["un passeur qui pousse les morts sur la Marche", "un inquisiteur de la Cire qui cloue les vivants", "un Peseur renégat qui veut mesurer le Sceau", "un connétable d'os qui commande une légion morte", "un contremaître de la Hanse qui fait travailler les morts"],
    motivations: ["rejoindre un être aimé noyé il y a deux hivers", "prouver que le Dieu-Empereur se relèvera", "garder le sel pour sa seule famille", "obéir à une voix qui parle la nuit"],
    enemies: ["Levés", "Loups de bruyère", "Bandits des routes", "Légionnaires d'os", "Noyés", "Pleureurs", "Gardes du Seuil", "Inquisiteurs de la Cire", "Porte-Voix", "Wyverne des Ossiers", "Colonne de la Marche", "Ver des Ossiers", "Bouche de Gorvan", "Connétable d'os", "Reine sous le Sel"],
    twists: ["Le commanditaire savait que le village était perdu.", "Le mort qu'on chasse protège quelqu'un.", "La voix qui guide le méchant connaît des choses qu'un mort seul savait.", "Les morts ne marchent pas au hasard : ils suivent une ligne droite."],
    rewards: ["Un marteau en fer froid forgé à la main", "50 pièces d'or et un clou à l'oreille", "Un laissez-passer de la Chancellerie", "Une part dans une saline", "La reconnaissance des Veilleuses", "Une carte des lignes de la Marche"],
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
    hooks: ["Les morts reviennent chaque nuit sans lune.", "Une enfant prophétesse est réclamée par trois factions.", "Le seigneur local paie en or pour chaque tête de sorcière.", "La pluie est devenue rouge."],
    villains: ["un inquisiteur fanatique", "une sorcière vieille de trois siècles", "un dieu oublié qui se réveille", "un seigneur vampire"],
    motivations: ["purifier le monde par le feu", "échapper à sa propre damnation", "nourrir une faim sans fin"],
    enemies: ["Rats géants", "Pillards", "Chiens de guerre", "Goules", "Possédés", "Chevaliers morts", "Abomination", "Vampire", "Horreur des fosses", "Archidémon"],
    twists: ["Les héros sont porteurs de la malédiction.", "L'Église a créé le monstre.", "Le seul remède exige un sacrifice."],
    rewards: ["Une relique bénie", "Une bourse d'argent terni", "Le pardon d'un crime", "Une lame forgée en enfer"],
    traits: ["hanté par son passé", "cynique", "dévot jusqu'à l'aveuglement", "survivant à tout prix"],
  },
  {
    id: "science-fiction",
    label: "Science-fiction",
    pitch: "Vaisseaux, planètes lointaines, aliens et empires galactiques.",
    theme: { background: "#0b1220", floor: "#3a4a62", wall: "#1a2333", water: "#1f6f8b", vegetation: "#2e7a5f", road: "#55657d", door: "#e0a33a", grid: "rgba(120,180,255,.18)" },
    stats: ["Physique", "Réflexes", "Technique", "Science", "Perception", "Influence"],
    archetypes: ["Pilote", "Ingénieure", "Soldat d'élite", "Diplomate", "Xénobiologiste", "Contrebandier", "Médecin de bord", "Psionique"],
    origins: ["Terrien", "Colon martien", "Androïde", "Né dans le vide", "Alien Vrask", "Clone"],
    equipment: ["Pistolet laser", "Combinaison spatiale", "Scanner portable", "Drone de reconnaissance", "Kit de réparation", "Bouclier personnel", "Stimulants", "Carte d'accès volée"],
    abilities: ["Pilotage acrobatique", "Piratage", "Tir de précision", "Premiers soins avancés", "Télékinésie", "Négociation interstellaire"],
    nameStart: ["Ax", "Cy", "Dex", "Ka", "Lyr", "Nov", "Or", "Qu", "Rho", "Ve", "Zan"],
    nameEnd: ["ion", "ara", "ex", "is", "on", "a-7", "ix", "us", "elle"],
    places: ["la station orbitale Kepler-9", "un vaisseau fantôme à la dérive", "la colonie minière de Thalassa", "la capitale impériale", "une planète-jungle inexplorée"],
    hooks: ["Un signal de détresse vient d'un vaisseau disparu il y a 200 ans.", "L'IA de la station refuse d'ouvrir les sas.", "Une cargaison ultra-secrète doit traverser le blocus.", "Un artefact alien réagit à la présence d'un héros."],
    villains: ["une IA devenue consciente", "une amirale rebelle", "une méga-corporation", "une reine alien"],
    motivations: ["libérer les machines", "contrôler la seule source d'énergie", "sauver son espèce à tout prix"],
    enemies: ["Drones de sécurité", "Pirates de l'espace", "Robots ouvriers déréglés", "Soldats impériaux", "Créatures xéno", "Mech de combat", "Assassin synthétique", "Reine xéno", "Croiseur ennemi"],
    twists: ["Le commanditaire est un clone.", "La planète est un être vivant.", "L'équipage est déjà mort depuis longtemps."],
    rewards: ["Un vaisseau d'occasion", "10 000 crédits", "Des coordonnées secrètes", "Une IA compagnon"],
    traits: ["curieux de tout", "ancien militaire discipliné", "blagueur sous pression", "obsédé par le profit"],
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
    hooks: ["Un employé corpo veut déserter avec des données explosives.", "Votre fixer a disparu, il vous doit de l'argent.", "Un virus efface les souvenirs des gens dans la rue.", "Une star de la musique est en réalité une IA."],
    villains: ["un PDG immortel", "un gang de cyberpsychos", "une IA voyou", "un flic qui vend la ville"],
    motivations: ["télécharger son esprit dans le réseau", "contrôler toute la ville", "effacer son passé"],
    enemies: ["Gangers", "Agents de sécurité", "Drones de police", "Cyberpsycho", "Escouade corpo", "Netrunner ennemi", "Mech anti-émeute", "Assassin chromé", "IA voyou"],
    twists: ["Le client est votre propre clone numérique.", "Les données volées contiennent vos souvenirs.", "La corporation finance aussi la rébellion."],
    rewards: ["Un implant de pointe", "50 000 eddies", "Un appartement en hauteur", "Un contact chez les corpos"],
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
    hooks: ["Un ami vous envoie une lettre puis disparaît.", "Un tableau change chaque nuit.", "Des disparitions suivent les marées.", "Un héritage vous attend dans une maison isolée."],
    villains: ["un culte d'adorateurs", "une entité venue d'ailleurs", "un médecin aux expériences interdites", "un fantôme vengeur"],
    motivations: ["ouvrir la porte aux Grands Anciens", "vaincre la mort", "se venger des vivants"],
    enemies: ["Villageois hostiles", "Cultistes", "Chiens possédés", "Profonds", "Goule", "Spectre", "Shoggoth", "Avatar d'un dieu"],
    twists: ["Un des héros descend des cultistes.", "La créature essayait de vous prévenir.", "Tout se passe dans un rêve partagé."],
    rewards: ["Un tome de savoir interdit", "La vérité (coûte de la santé mentale)", "Un héritage maudit"],
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
    hooks: ["La dernière source d'eau pure est menacée.", "Un abri scellé vient de s'ouvrir.", "Une caravane promet un passage vers une terre verte.", "Un enfant ne craint pas les radiations."],
    villains: ["un seigneur de guerre", "une IA militaire d'avant-guerre", "un prophète mutant", "une compagnie de l'eau"],
    motivations: ["contrôler l'eau", "relancer les missiles", "créer une nouvelle humanité"],
    enemies: ["Rats radioactifs", "Pillards", "Chiens mutants", "Goules irradiées", "Raiders motorisés", "Mutant géant", "Robot de guerre", "Béhémoth"],
    twists: ["La terre verte est un piège.", "Le seigneur de guerre protège un secret vital.", "L'abri cache l'origine de l'apocalypse."],
    rewards: ["Un véhicule blindé", "Un stock de munitions", "Un accès à l'eau", "Une carte d'avant-guerre"],
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
    hooks: ["Le gang Dalton prend la ville en otage.", "Une mine d'or est hantée.", "Un train transporte un prisonnier très recherché.", "Le shérif a été assassiné en plein jour."],
    villains: ["un baron du chemin de fer", "un hors-la-loi légendaire", "un shérif corrompu", "un marchand d'élixirs"],
    motivations: ["posséder toute la vallée", "se venger de la ville", "trouver le filon perdu"],
    enemies: ["Coyotes", "Voleurs de bétail", "Hommes de main", "Pistoleros", "Gang de hors-la-loi", "Chasseur de primes rival", "Le Baron et sa garde"],
    twists: ["Le shérif est le chef du gang.", "L'or est maudit.", "Le prisonnier est innocent."],
    rewards: ["Une prime de 1 000 $", "Un ranch", "Un étalon noir", "Une étoile de marshal"],
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
    hooks: ["Une carte mène au trésor du capitaine Flint.", "Le navire est encalminé près d'une île qui bouge.", "La Marine offre le pardon contre une mission suicide.", "Une sirène propose un marché."],
    villains: ["un capitaine maudit", "un gouverneur cruel", "une sorcière des mers", "le Kraken"],
    motivations: ["briser sa malédiction", "régner sur les mers", "récupérer son cœur volé"],
    enemies: ["Crabes géants", "Marins ivres", "Soldats de la Marine", "Pirates rivaux", "Équipage fantôme", "Sirènes", "Capitaine maudit", "Kraken"],
    twists: ["Le trésor est une personne.", "La carte est fausse mais le vrai trésor est à bord.", "Le capitaine a vendu l'équipage."],
    rewards: ["Un coffre de doublons", "Un navire", "Une lettre de marque", "Une boussole magique"],
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
    hooks: ["Une invention capable d'arrêter le temps a été volée.", "Les automates de la ville se mettent à grève.", "Un dirigeable royal a disparu dans un orage.", "Un savant fou défie la reine."],
    villains: ["un savant fou", "une guilde secrète", "un automate qui se rêve empereur", "un baron de l'industrie"],
    motivations: ["remplacer les humains par des machines", "réécrire l'histoire", "prouver son génie"],
    enemies: ["Voyous des docks", "Automates de garde", "Agents de la guilde", "Araignée mécanique", "Tank à vapeur", "Colosse d'airain"],
    twists: ["La reine est un automate.", "Le savant voulait sauver la ville.", "L'invention vient du futur."],
    rewards: ["Un brevet lucratif", "Un dirigeable", "Une invention unique", "Une médaille royale"],
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
    hooks: ["Un témoin clé doit survivre jusqu'au procès.", "Une clé USB contient la liste des agents infiltrés.", "Un milliardaire a disparu de son yacht.", "Un virus informatique bloque la ville."],
    villains: ["un trafiquant international", "une taupe dans les services", "un milliardaire mégalomane", "une hackeuse anarchiste"],
    motivations: ["faire tomber le gouvernement", "s'enrichir", "venger sa famille"],
    enemies: ["Voyous", "Gardes du corps", "Mercenaires", "Policiers corrompus", "Tueur à gages", "Commando", "Le cerveau de l'opération"],
    twists: ["Votre contact est la taupe.", "La victime a organisé sa disparition.", "Le gouvernement est derrière tout ça."],
    rewards: ["Une prime", "Une nouvelle identité", "Un dossier compromettant", "Un contact haut placé"],
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
