// Réserve du maître du jeu, genre par genre : accroches, méchants, ennemis, rebondissements, récompenses.
// Séparée de genres.ts parce que les joueurs chargent genres.ts : rien de ce qui suit ne doit arriver chez eux
// (scripts/verifier-secrets-client.ts le contrôle sur le site fabriqué).
import { AUBRETERRE } from "./canon/fantasy";
import { ARCHIPEL } from "./canon/science-fiction";
import { TERNELANDE } from "./canon/dark-fantasy";
import { RESIDENCE } from "./canon/cyberpunk";
import type { GenreId } from "./types";

export interface Idees {
  hooks: string[];
  villains: string[];
  motivations: string[];
  /** Ennemis rangés du plus faible au plus fort. */
  enemies: string[];
  twists: string[];
  rewards: string[];
}

export const IDEES: Record<GenreId, Idees> = {
  "fantasy": {
    hooks: AUBRETERRE.accroches.map((a) => a.texte),
    villains: ["un passeur qui pousse les morts sur la Marche", "un inquisiteur de la Cire qui cloue les vivants", "un Peseur renégat qui veut mesurer le Sceau", "un connétable d'os qui commande une légion morte", "un contremaître de la Hanse qui fait travailler les morts"],
    motivations: ["rejoindre un être aimé noyé il y a deux hivers", "prouver que le Dieu-Empereur se relèvera", "garder le sel pour sa seule famille", "obéir à une voix qui parle la nuit"],
    enemies: ["Levés", "Loups de bruyère", "Bandits des routes", "Légionnaires d'os", "Noyés", "Pleureurs", "Gardes du Seuil", "Inquisiteurs de la Cire", "Porte-Voix", "Wyverne des Ossiers", "Colonne de la Marche", "Ver des Ossiers", "Bouche de Gorvan", "Connétable d'os", "Reine sous le Sel"],
    twists: ["Le commanditaire savait que le village était perdu.", "Le mort qu'on chasse protège quelqu'un.", "La voix qui guide le méchant connaît des choses qu'un mort seul savait.", "Les morts ne marchent pas au hasard : ils suivent une ligne droite."],
    rewards: ["Un marteau en fer froid forgé à la main", "50 pièces d'or et un clou à l'oreille", "Un laissez-passer de la Chancellerie", "Une part dans une saline", "La reconnaissance des Veilleuses", "Une carte des lignes de la Marche"],
  },
  "dark-fantasy": {
    hooks: TERNELANDE.accroches.map((a) => a.texte),
    villains: ["un Dîmier qui prend deux souvenirs là où il en faut un", "un capitaine de compagnie franche qui vend les villages aux trois comtes", "un prêcheur effacé qui veut que tout le monde oublie", "un notaire de Haute-Cendre qui achète des morts à gage", "une sorcière qui a bu trop de sève et ne sait plus qui elle est"],
    motivations: ["retrouver le visage d'un enfant donné à la Dîme", "garder le pouvoir que donne la peur de la Dîme", "prouver que l'hiver finit seul au-delà de la mer", "que la Ternelande oublie tout et recommence"],
    enemies: ["Loups d'hiver", "Corbeaux de dîme", "Brigands des Landes", "Soldats de compagnie", "Écuyers dîmiers", "Reflets", "Dîmiers", "Racines-qui-boivent", "Chevalier de compagnie", "Sylve blanche", "Grand Dîmier", "La Faim de la terre"],
    twists: ["Le mort qu'on a donné à la Dîme était encore vivant.", "La famille qui paie pour un mort à gage a vendu son propre enfant.", "Le Dîmier sous le masque est un voisin.", "Les Registres ont été recopiés, et la copie dit autre chose.", "La pierre de dîme est chaude au toucher, comme si quelque chose buvait."],
    rewards: ["Un reliquaire qui rend un souvenir", "Dix livres d'argent", "Un couteau de fer froid", "Une fiole de lait d'oubli", "Un nom retrouvé dans les Registres", "Une nuit de la Dîme sans payer"],
  },
  "science-fiction": {
    hooks: ARCHIPEL.accroches.map((a) => a.texte),
    villains: ["un Censeur qui entend la pierre et chasse ceux qui l'entendent", "une ingénieure de Valcourt qui pousse les Orgues au-delà des réglages", "un chasseur de primes payé par la Main Close", "un capitaine de la Ligue prêt à saborder n'importe quel Orgue", "un chef de tas des Brisants qui vend les épaves avec leurs morts"],
    motivations: ["solder une dette avant l'extinction de son monde", "retrouver un proche pris dans le convoi perdu", "prouver que les Orgues sont sans danger", "racheter un système entier pour une poignée de lumens"],
    enemies: ["Pillards des Routes", "Ouvrés de garde", "Ferrailleurs armés", "Douaniers de l'Hégémonie", "Chasseurs de primes", "Garde Hégémonique", "Échouées", "Censeurs", "Dissonant", "Orgue détraqué", "Cuirassé hégémonique"],
    twists: ["Le commanditaire travaille pour la Main Close.", "La cargaison bourdonne quand on approche d'un Phare.", "Le Censeur qui les traque entend la pierre.", "Le Phare a clignoté à la seconde où l'Orgue a frappé.", "Le vaisseau qu'on poursuit est celui qui a disparu à Morne-Saline."],
    rewards: ["Une mensualité effacée", "800 lumens", "Un faux transpondeur", "Un éclat de pierre de Phare", "Une Route sans Péage, connue de peu", "La reconnaissance du clan Deux-Enclumes"],
  },
  "cyberpunk": {
    hooks: RESIDENCE.accroches.map((a) => a.texte),
    villains: ["un huissier-chef qui vend ses arrangements", "un administrateur des Hauts qui achète des années aux pauvres", "un médecin de Clinique qui transfère des heures en douce", "une intelligence de la Foncière qui n'obéit plus", "un chef de comité qui s'est fait payer sa grève"],
    motivations: ["payer le loyer du mois sans passer sous zéro", "acheter dix ans de plus à une Clinique", "faire tomber la Révision avant janvier", "retrouver le nom de celui qui crédite le fonds de grève"],
    enemies: ["Clercs", "Huissiers", "Chiens de garde", "Rats des Souterrains", "Drones de cadastre", "Gros bras du Port-Franc", "Cousus de combat", "Huissier-chef", "Corps de garde de la Tour-Mère"],
    twists: ["Les heures volées viennent d'un Compteur de mort que la Clinique n'a pas déclaré.", "Le client est un Enfant des Hauts qui a fui sa famille.", "Le voisin qui prévenait le palier est aussi celui qui vendait les adresses.", "La voix du soir dit une phrase qu'elle n'a jamais prononcée.", "La Foncière finance aussi la grève."],
    rewards: ["Cent heures de loyer payées", "Un Compteur piraté", "Un implant dont le loyer est réglé un an", "Une place dans le tram des Hauts, une fois", "La reconnaissance du Comité du Bloc 14", "Un avis d'expulsion annulé"],
  },
  "horreur": {
    hooks: ["Un ami vous envoie une lettre puis disparaît.", "Un tableau change chaque nuit.", "Des disparitions suivent les marées.", "Un héritage vous attend dans une maison isolée."],
    villains: ["un culte d'adorateurs", "une entité venue d'ailleurs", "un médecin aux expériences interdites", "un fantôme vengeur"],
    motivations: ["ouvrir la porte aux Grands Anciens", "vaincre la mort", "se venger des vivants"],
    enemies: ["Villageois hostiles", "Cultistes", "Chiens possédés", "Profonds", "Goule", "Spectre", "Shoggoth", "Avatar d'un dieu"],
    twists: ["Un des héros descend des cultistes.", "La créature essayait de vous prévenir.", "Tout se passe dans un rêve partagé."],
    rewards: ["Un tome de savoir interdit", "La vérité (coûte de la santé mentale)", "Un héritage maudit"],
  },
  "post-apo": {
    hooks: ["La dernière source d'eau pure est menacée.", "Un abri scellé vient de s'ouvrir.", "Une caravane promet un passage vers une terre verte.", "Un enfant ne craint pas les radiations."],
    villains: ["un seigneur de guerre", "une IA militaire d'avant-guerre", "un prophète mutant", "une compagnie de l'eau"],
    motivations: ["contrôler l'eau", "relancer les missiles", "créer une nouvelle humanité"],
    enemies: ["Rats radioactifs", "Pillards", "Chiens mutants", "Goules irradiées", "Raiders motorisés", "Mutant géant", "Robot de guerre", "Béhémoth"],
    twists: ["La terre verte est un piège.", "Le seigneur de guerre protège un secret vital.", "L'abri cache l'origine de l'apocalypse."],
    rewards: ["Un véhicule blindé", "Un stock de munitions", "Un accès à l'eau", "Une carte d'avant-guerre"],
  },
  "western": {
    hooks: ["Le gang Dalton prend la ville en otage.", "Une mine d'or est hantée.", "Un train transporte un prisonnier très recherché.", "Le shérif a été assassiné en plein jour."],
    villains: ["un baron du chemin de fer", "un hors-la-loi légendaire", "un shérif corrompu", "un marchand d'élixirs"],
    motivations: ["posséder toute la vallée", "se venger de la ville", "trouver le filon perdu"],
    enemies: ["Coyotes", "Voleurs de bétail", "Hommes de main", "Pistoleros", "Gang de hors-la-loi", "Chasseur de primes rival", "Le Baron et sa garde"],
    twists: ["Le shérif est le chef du gang.", "L'or est maudit.", "Le prisonnier est innocent."],
    rewards: ["Une prime de 1 000 $", "Un ranch", "Un étalon noir", "Une étoile de marshal"],
  },
  "pirates": {
    hooks: ["Une carte mène au trésor du capitaine Flint.", "Le navire est encalminé près d'une île qui bouge.", "La Marine offre le pardon contre une mission suicide.", "Une sirène propose un marché."],
    villains: ["un capitaine maudit", "un gouverneur cruel", "une sorcière des mers", "le Kraken"],
    motivations: ["briser sa malédiction", "régner sur les mers", "récupérer son cœur volé"],
    enemies: ["Crabes géants", "Marins ivres", "Soldats de la Marine", "Pirates rivaux", "Équipage fantôme", "Sirènes", "Capitaine maudit", "Kraken"],
    twists: ["Le trésor est une personne.", "La carte est fausse mais le vrai trésor est à bord.", "Le capitaine a vendu l'équipage."],
    rewards: ["Un coffre de doublons", "Un navire", "Une lettre de marque", "Une boussole magique"],
  },
  "steampunk": {
    hooks: ["Une invention capable d'arrêter le temps a été volée.", "Les automates de la ville se mettent à grève.", "Un dirigeable royal a disparu dans un orage.", "Un savant fou défie la reine."],
    villains: ["un savant fou", "une guilde secrète", "un automate qui se rêve empereur", "un baron de l'industrie"],
    motivations: ["remplacer les humains par des machines", "réécrire l'histoire", "prouver son génie"],
    enemies: ["Voyous des docks", "Automates de garde", "Agents de la guilde", "Araignée mécanique", "Tank à vapeur", "Colosse d'airain"],
    twists: ["La reine est un automate.", "Le savant voulait sauver la ville.", "L'invention vient du futur."],
    rewards: ["Un brevet lucratif", "Un dirigeable", "Une invention unique", "Une médaille royale"],
  },
  "contemporain": {
    hooks: ["Un témoin clé doit survivre jusqu'au procès.", "Une clé USB contient la liste des agents infiltrés.", "Un milliardaire a disparu de son yacht.", "Un virus informatique bloque la ville."],
    villains: ["un trafiquant international", "une taupe dans les services", "un milliardaire mégalomane", "une hackeuse anarchiste"],
    motivations: ["faire tomber le gouvernement", "s'enrichir", "venger sa famille"],
    enemies: ["Voyous", "Gardes du corps", "Mercenaires", "Policiers corrompus", "Tueur à gages", "Commando", "Le cerveau de l'opération"],
    twists: ["Votre contact est la taupe.", "La victime a organisé sa disparition.", "Le gouvernement est derrière tout ça."],
    rewards: ["Une prime", "Une nouvelle identité", "Un dossier compromettant", "Un contact haut placé"],
  },
};

export const ideesDe = (genre: GenreId): Idees => IDEES[genre] ?? IDEES.fantasy;
