// Règles propres au Grand Sec (post-apocalyptique, an 40 du Sec), lues par les joueurs dans le livre en ligne.
// Rien de secret. L'argent se compte en godets ; la gourde et le prix des efforts remplacent la magie.
import type { RuleSection } from "./rules";

export const REGLES_SEC: RuleSection[] = [
  {
    id: "pa-gourde",
    title: "La gourde et la soif",
    body: [
      "Chaque personnage tient sur sa fiche sa gourde : l'eau qu'il porte, en godets. Un godet est un quart de litre d'eau propre, scellé dans une capsule de métal frappée du sceau de celui qui l'a tirée. Une gourde ordinaire en tient douze (trois litres).",
      "Un personnage a besoin de 6 godets par jour (8 en été, ou en marchant au soleil), à boire, en plus de ce qu'il mange. L'épuisement suit la règle à six niveaux du SRD 5.1.",
      "- Un jour sans sa ration complète : un niveau d'épuisement, sauf sauvegarde d'Endurance DD 12.",
      "- Un jour sans boire du tout : un niveau d'épuisement, sans sauvegarde, et un second sur une sauvegarde d'Endurance DD 15 ratée.",
      "- Boire sa ration complète, puis faire un repos long, fait perdre un niveau d'épuisement dû à la soif (en plus de celui que retire le repos long).",
      "Quelques ordres de grandeur : une gourde pleine tient deux jours en été sans bouger, trois en hiver. Un puits de ville vend à la file ; sur la Route, un relais vend l'eau tous les quarante kilomètres.",
    ],
  },
  {
    id: "pa-effort",
    title: "Ce que coûte l'effort",
    body: [
      "Dans le Bas-Pays, il n'y a ni sort ni miracle. Il y a des gens qui poussent leur corps plus loin que les autres, et ça se paie en eau.",
      "- Certains pouvoirs de classe portent un prix : « Prix : N godets ». On verse N godets de la gourde au moment de l'effort, et on les boit d'un trait. Ce prix s'ajoute à la ration du jour.",
      "- Si la gourde ne suffit pas, on peut utiliser le pouvoir quand même : il donne un niveau d'épuisement.",
      "- On ne peut pas payer plus de 4 godets de pouvoirs par jour (8 à partir du niveau 11) : passé ce compte, le corps ne suit plus et le pouvoir ne marche pas.",
      "- Un seul pouvoir à prix par tour. Les godets versés pour un pouvoir ne comptent pas dans la ration : on les boit en plus, ou on les laisse au sol.",
      "Les classes Batelier de sable, Puisatier, Pillard repenti, Mécano des ruines, Gardian, Pénitent, Médecin des sables et Fouilleur ont le passif « Ce que coûte l'effort », qui répète cette règle. La Sourcière et le Chef de convoi n'ont aucun pouvoir à prix : ils paient en savoir et en parole. Le Pénitent peut payer en jeûne, en renonçant à une part de sa ration.",
      "Les pouvoirs sans prix (soigner, réparer, négocier, pister, tirer) sont des savoir-faire humains : ils ne coûtent rien.",
      "Aux niveaux élevés, les classes ne deviennent pas des surhommes. Elles gagnent des relations (un patron de convoi, un maître de puits, un revendeur), des talents et des réserves : une ration réduite, un puits recreusé, un convoi à soi.",
    ],
  },
  {
    id: "pa-chaleur",
    title: "Le coup de chaleur",
    body: [
      "En été, entre midi et quatre heures, au soleil, chaque heure de marche ou d'effort demande une sauvegarde d'Endurance DD 10 (DD 15 en armure lourde ou en combat), avec l'avantage à l'ombre ou si on boit un godet de plus dans l'heure. Un échec donne un niveau d'épuisement, mais pas plus d'un par après-midi (deux en armure lourde).",
      "Les gens du Bas-Pays voyagent la nuit. Une journée de marche de nuit ne demande aucune sauvegarde, mais on ne voit pas plus loin que sa lampe.",
    ],
  },
  {
    id: "pa-eau-sale",
    title: "L'eau sale",
    body: [
      "L'eau des citernes oubliées, des étangs salés et des puits souillés se boit, mais elle demande une sauvegarde d'Endurance DD 12. Un échec, et le personnage est empoisonné jusqu'au prochain repos long.",
      "Une eau qu'on a fait bouillir dix minutes sur un feu, ou filtrée par un Médecin des sables, ne demande plus de sauvegarde. L'eau de mer ne se boit jamais : elle donne un niveau d'épuisement par jour à qui s'y risque.",
    ],
  },
  {
    id: "pa-godets",
    title: "L'argent en godets",
    body: [
      "On paie en godets. Quelques prix :",
      "| Quoi | Prix",
      "| Un repas | 2 godets",
      "| Une nuit à l'abri | 4 godets",
      "| Une semaine de place sur un char à voile | 30 godets",
      "| Un âne | 150 godets",
      "| Une arbalète | 120 godets",
      "| Un fusil | 500 godets",
      "| Une cartouche | 5 godets",
      "| Le salaire d'un manœuvre | 14 godets par jour",
      "| Le salaire d'un batelier | 20 godets par jour",
      "| Le salaire d'un garde de convoi | 30 godets par jour",
      "Un manœuvre qui a payé sa soif met trois mois à s'offrir un fusil.",
      "Les fusils d'avant le Sec existent encore, mais les cartouches sont rares. On se bat surtout à l'arbalète, à la fronde, à la machette, au harpon de batelier. Les Puisatiers ont des arbalètes lourdes, les Fontainiers des fusils, la Horde des chars armés de lances.",
      "Un godet faux (une capsule pleine d'eau salée) est un crime. À Avignon, on peut le prouver en deux minutes : un Puisatier connaît le poids d'une capsule.",
    ],
  },
  {
    id: "pa-route",
    title: "Voyager sur la Route",
    body: [
      "On mesure les distances en jours de marche et en godets : « Avignon, c'est trois jours et quarante godets. » On voyage à pied la nuit, à dos d'âne, ou en char à voile sur la Route du Rhône, le lit de sable et de galets de l'ancien fleuve.",
      "Un char à voile est un plateau monté sur roues de camion, avec une voile carrée et un équipage de six. Chaque convoi a un patron. Les relais de la Route, tous les quarante kilomètres, vendent l'eau, le fourrage et l'ombre.",
      "| Vent | Vitesse du char | Par jour",
      "| Mistral dans le dos (descendre) | 12 km/h | 100 km",
      "| Vent faible | 6 km/h | 50 km",
      "| Marin de face (remonter) | 6 km/h | 50 km",
      "| Calme plat | à l'arrêt | rien",
      "Trois jours de voile pour descendre de Valence à la mer, si le mistral souffle ; deux fois plus pour remonter, au vent du sud qu'on appelle le marin. Le mistral souffle trois jours sur quatre.",
      "Piloter un char demande un test d'Agilité ou d'Instinct (pilotage) : DD 10 en conditions normales, 13 par mistral fort ou de nuit, 15 en tempête de sable. Un échec ralentit le char de moitié ; deux échecs de suite, il verse. Un Batelier de sable ou un Enfant de la Route a l'avantage.",
      "Les jours sans vent, on reste coincé en plein lit : il faut choisir entre attendre (et boire) et pousser (et suer). Une tempête de sable monte du sud : un test de Survie DD 12 pour la voir venir à une heure, un test de pilotage DD 15 pour s'en sortir à l'abri d'un pont, d'une péniche couchée ou d'un quai.",
      "Une semaine de place sur un char coûte 30 godets, un âne 150. Le voyage se paie en eau : prévois la ration de chaque jour de route, et un tiers de plus pour les retards.",
    ],
  },
];
