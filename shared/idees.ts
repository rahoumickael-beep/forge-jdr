// Réserve du maître du jeu, genre par genre : accroches, méchants, ennemis, rebondissements, récompenses.
// Séparée de genres.ts parce que les joueurs chargent genres.ts : rien de ce qui suit ne doit arriver chez eux
// (scripts/verifier-secrets-client.ts le contrôle sur le site fabriqué).
import { AUBRETERRE } from "./canon/fantasy";
import { ARCHIPEL } from "./canon/science-fiction";
import { TERNELANDE } from "./canon/dark-fantasy";
import { RESIDENCE } from "./canon/cyberpunk";
import { COTE_DES_NOYES } from "./canon/horreur";
import { GRAND_SEC } from "./canon/post-apo";
import { CHAMP_D_ASILE } from "./canon/western";
import { ILES_DU_VENT } from "./canon/pirates";
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
    hooks: COTE_DES_NOYES.accroches.map((a) => a.texte),
    villains: ["un directeur d'assurances qui ne veut sauver que ses millions", "un président de compagnie qui a économisé sur les chaloupes", "une médium qui vend les voix des noyés", "un gendarme qui garde les lettres dans un tiroir", "des contrebandiers qui n'aiment pas les lanternes sur la grève"],
    motivations: ["que le navire parte à l'heure malgré tout", "classer l'affaire avant que Paris ne s'en mêle", "faire taire les experts", "savoir ce que valent les lettres avant de payer"],
    enemies: ["Contrebandiers", "Noyés qui marchent", "Crabes de la Fosse", "Congres de la Fosse", "Chiens de la lande", "Hommes de main de la Compagnie", "File des Revenus", "Ce qui vit dans la Fosse", "La mer elle-même"],
    twists: ["La lettre est adressée à l'un d'entre vous.", "Le noyé de la morgue est vivant à Caen.", "Un passager sauvé ne reviendra plus sur la grève, et la mer prendra quelqu'un d'autre.", "La lettre a été écrite pour que quelqu'un la lise à temps."],
    rewards: ["Une lettre de recommandation d'un ministre", "Quatre cents francs de frais", "La confiance de la mère Hamel", "Un Présage de plus", "Une copie des lettres originales", "L'amitié d'un armateur"],
  },
  "post-apo": {
    hooks: GRAND_SEC.accroches.map((a) => a.texte),
    villains: ["un Maître-Puisatier qui ferme le puits pour garder son prix", "une Prévôte qui paie en secret ceux qui entretiennent les Mâts", "une cheffe de Horde qui détourne l'eau vers le camp du Mur", "un prédicateur qui veut tout abattre sans savoir ce que ça coûte", "un patron de convoi qui écoule de l'eau coupée de sel"],
    motivations: ["remplir sa gourde avant la fin de la semaine", "payer le droit de passage d'un convoi", "retrouver la source d'un puits qui s'est tu", "passer le Mur avant l'hiver"],
    enemies: ["Chiens sauvages", "Vautours", "Pillards de la Horde", "Arbalétriers puisatiers", "Scorpions géants de la chaleur", "Taureaux de Vaccarès", "Chars à voile armés", "Gardes de Montclair", "Gardes-Mâts", "Tempête de sable", "Le Mât qui se défend"],
    twists: ["Le godet n'est pas de l'eau propre, mais de l'eau coupée de sel.", "Le guide connaît la Horde, et elle le connaît.", "La citerne n'était vide que pour ceux qui ne connaissaient pas le puits d'à côté.", "Le gamin qui montre le chemin est payé par les deux camps."],
    rewards: ["Cent godets scellés", "Une carte des puits", "Un laissez-passer de Montclair", "Une cartouche de plus", "La confiance du Vieux Fabre", "Une place sur un char à voile pour le prochain convoi"],
  },
  "western": {
    hooks: CHAMP_D_ASILE.accroches.map((a) => a.texte),
    villains: ["un avocat du rail qui compte les piquets de ses géomètres comme d'autres les bouteilles", "un président d'Assemblée qui pense d'abord à ses fils", "un jeune guerrier qui veut la guerre avant la date", "un Ranger payé pour trouver des raisons d'entrer dans le Champ", "un chasseur de primes qui tirera quoi qu'il arrive"],
    motivations: ["sauver le rancho de la famille", "toucher une prime avant la fin du mois", "faire passer un troupeau au Kansas", "gagner un nom qu'on cite dans les saloons"],
    enemies: ["Coyotes", "Crotales", "Voleurs de chevaux", "Hommes du rail", "Rangers en civil", "Rurales du sud", "Chasseurs de bisons", "Hors-la-loi de la Bande des Lys", "Chasseur de primes rival", "Garde de la compagnie"],
    twists: ["Le garde de la diligence renseigne la Bande.", "Le vendeur du rancho n'est pas celui qui signe.", "Le chasseur de primes a un mandat contre la mauvaise personne.", "Le vieux chef n'est pas venu pour la guerre, mais pour être entendu."],
    rewards: ["Cent dollars sur parole", "Une boîte de cinquante cartouches", "La confiance du vieux Roux", "Un cheval du rancho Eylau", "Une piastre d'argent du Champ", "Un point de Nom devant témoins"],
  },
  "pirates": {
    hooks: ILES_DU_VENT.accroches.map((a) => a.texte),
    villains: ["un capitaine de la Côte qui vend ses prises au même port que les négriers", "un gouverneur qui pend un pirate par semaine pour plaire à Madrid", "un agent de Kingston qui paie des capitaines pour attaquer à sa place", "un chasseur de marrons qui travaille à la prime", "un quartier-maître qui compte autrement que la chasse-partie"],
    motivations: ["toucher sa part avant la saison des ouragans", "libérer un frère ou une sœur plongeur dans un camp espagnol", "rembourser une dette avant qu'on ne vienne la réclamer", "gagner un pavillon qu'on respecte", "obtenir une grâce du lieutenant du roi"],
    enemies: ["Requins", "Barracudas", "Crocodiles des marais", "Chiens de chasse", "Matelots de la Marine", "Soldats espagnols", "Chasseurs de marrons", "Corsaires anglais", "Garde-côtes du roi", "Pirates rivaux", "L'ouragan"],
    twists: ["Le patron qui paie la course doit de l'argent à celui qu'on doit voler.", "La prise est chargée de personnes, pas de marchandise, et l'équipage doit décider ce qu'elle devient.", "Le plongeur que tu sauves connaît le chemin d'un village de marrons.", "Le capitaine qui t'a engagé n'a jamais lu la chasse-partie qu'il fait signer."],
    rewards: ["Cent piastres, comptées devant tout l'équipage", "Une chasse-partie signée à ton nom", "La confiance d'un village des mornes", "Un jeton de Chance de plus", "Une grâce du lieutenant du roi", "Un sloop d'occasion"],
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
