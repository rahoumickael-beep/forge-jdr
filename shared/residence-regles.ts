// Règles propres à la Résidence (cyberpunk, « le Bail »), lues par les joueurs dans le livre en ligne.
// Rien de secret. Dans ce livre, « h » veut dire heures de Compteur, la monnaie.
import type { RuleSection } from "./rules";

export const REGLES_RESIDENCE: RuleSection[] = [
  {
    id: "cp-heures",
    title: "Les heures et le solde",
    body: [
      "La monnaie de la Résidence est l'heure de Compteur, notée h. Le Compteur est un implant de la taille d'une pièce, sous la peau du poignet gauche, avec un affichage vert. Il montre le solde. On paie en posant son poignet contre un autre Compteur ou contre une borne ; on est crédité de la même manière quand on travaille.",
      "Tant que le solde est positif, payer ne fait pas vieillir : c'est de l'argent. Sous zéro, la dette vieillit le corps (voir « Fondre »).",
      "| Origine | Solde de départ",
      "| Résident des Blocs | 300 h (dont 100 h de loyer en retard)",
      "| Enfant des Hauts | 1 500 h",
      "| Prolongé | 600 h",
      "| Cousu | 150 h",
      "| Sans-Bail | 0 h (pas de Compteur)",
      "| Locataire | 6 mois de bail (1 200 h), retirés de 200 h par mois",
      "Un travail de niveau 1 paie de 40 à 100 h. Chaque premier du mois, le loyer tombe : c'est un rendez-vous, et le MJ le joue.",
      "Les Cliniques de Prolongation rajeunissent le corps contre des heures : un an pour mille heures environ.",
      "On ne peut pas retirer son Compteur sans médecin : il est relié au cœur. Les Sans-Bail le font quand même.",
    ],
  },
  {
    id: "cp-fondre",
    title: "Fondre",
    body: [
      "Un personnage dont le solde passe sous zéro fond : chaque heure de dette fait vieillir son corps d'un jour. En jeu :",
      "- Il gagne un niveau d'épuisement par semaine passée sous zéro.",
      "- Aucun repos ne retire cet épuisement avant le remboursement. Dès que le solde repasse à zéro ou au-dessus, il perd un niveau par repos long.",
      "- À 500 h de dette, le personnage tombe à 0 PV et ne se relève plus.",
      "Les gens des Blocs disent « fondre » ; la Foncière dit « l'avance sur bail ». Un docker qui paie deux cents heures de loyer et en gagne cent quatre-vingts par mois fond de vingt heures chaque mois, et ne le voit que dans le miroir.",
      "La Foncière gagne sur la dette : un jour par heure dû, un an de jouvence pour mille heures payées.",
    ],
  },
  {
    id: "cp-implants",
    title: "Implants et loyers",
    body: [
      "Les implants (yeux, bras, réflexes, mémoire) se louent, comme le reste. Chaque implant a un loyer mensuel en heures. Les pouvoirs de classe qui sont des implants le disent : « Implant, loyer N h par mois. »",
      "- Le premier du mois, le loyer de chaque implant tombe en même temps que celui du logement.",
      "- Un implant dont on ne paie pas le loyer s'éteint à distance : ses pouvoirs ne marchent plus jusqu'au paiement.",
      "- Un personnage sans Compteur ne peut pas porter d'implant. Un Sans-Bail n'en a pas, et un Prêcheur des Sans-Bail non plus.",
      "- Si ton origine t'interdit les implants (Sans-Bail, Locataire), les pouvoirs marqués Implant marchent comme des bricolages : pas de loyer, mais ils s'éteignent à la première panne que le MJ décide, et aucune Clinique ne les répare.",
      "Un implant oculaire coûte 30 h par mois. Les loyers d'implants montent avec leur puissance : une paire de plaques sous la peau coûte quarante heures, un cœur de rechange soixante.",
    ],
  },
  {
    id: "cp-reseau",
    title: "Le Réseau et les traces",
    body: [
      "Le Réseau relie les Compteurs, les portes, les ascenseurs, les caméras, les trams et les écrans. Il appartient à la Foncière, et tout ce qu'on y fait sans droit laisse une trace sur un Compteur.",
      "- Un personnage qui pirate (entre dans le Réseau sans droit) en dehors des pouvoirs de sa classe, avec des outils de fouineur, laisse une trace à chaque fois, réussi ou raté.",
      "- La trace se marque sur ton Compteur ; sans Compteur, elle se marque sur ta console et ton signal : un Sans-Bail ou un Locataire a des traces comme tout le monde.",
      "- Les fouineurs et les autres classes qui piratent ont un « rang » à leurs pouvoirs, de 1 à 9, et paient selon ce rang : rang 1 ou 2, rien ; le premier pouvoir de rang 3 à 5 de la journée, une trace ou 15 h ; un pouvoir de rang 6 à 8, une trace ou 60 h à chaque fois ; un pouvoir de rang 9, deux traces ou 80 h. Le joueur choisit : trace ou heures. Tu ne peux pas payer en heures plus de 100 h par jour pour tes pouvoirs ; pour le reste, ce sont des traces.",
      "- Une trace retombe d'un cran à chaque loyer payé (le premier du mois). La nuit sur console est ouverte à tous : une nuit entière, une fois par semaine, Technique DD 15, avec les outils, et la trace retombe d'un cran.",
      "- À trois traces, une escouade d'Huissiers (un huissier et trois clercs, plus aux niveaux élevés) frappe dans l'heure. Après la visite, qu'on y survive ou qu'on s'enfuie, le personnage repart avec une trace.",
      "Les caméras, les lecteurs et les trams lisent les Compteurs : on sait toujours où vous êtes, sauf si vous êtes Sans-Bail, ou si vous avez un Compteur piraté.",
    ],
  },
  {
    id: "cp-volees",
    title: "Les heures volées et le reflux",
    body: [
      "Les heures volées sont prises sur des Compteurs piratés. Elles coûtent moitié moins que les vraies, et on en trouve au Port-Franc.",
      "Mais elles peuvent refluer. Chaque fois qu'un personnage dépense plus de 50 h volées dans la même journée, il fait une sauvegarde d'Endurance DD 12.",
      "- Échec : toutes les heures volées qu'il a dépensées dans les sept derniers jours refluent. Il les perd de son solde, quitte à passer sous zéro.",
      "- Réussite : rien ne reflue.",
      "Un Compteur qui reflue ne ment pas : la Foncière voit la dette, et les Huissiers aussi.",
    ],
  },
  {
    id: "cp-argent",
    title: "L'argent",
    body: [
      "On paie en heures de Compteur (h). Quelques prix :",
      "| Quoi | Prix",
      "| Un repas au marché d'un Bloc | 1 h",
      "| Un manteau | 168 h (une semaine)",
      "| Un mois de loyer, une pièce | 200 h",
      "| Un pistolet | 400 h",
      "| Un implant oculaire, loyer | 30 h par mois",
      "| Le salaire d'un docker | 180 h par mois",
      "| Le salaire d'un cadre des Hauts | 10 000 h par mois",
      "Les armes de la Résidence : pistolets et fusils à aiguilles, matraques électriques, lames de céramique, armures légères en fibre. Les armes à poudre sont rares et interdites dans les Hauts. Les Huissiers portent des tasers à harpon, qui ancrent un fuyard au sol.",
      "Le Jardin se paie à la minute. Les gens d'ici disent « ça m'a coûté une semaine » pour un manteau, et « elle a vieilli d'un an » quand quelqu'un a perdu son emploi.",
    ],
  },
];
