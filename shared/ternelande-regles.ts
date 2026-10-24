// Règles propres à la Ternelande (dark fantasy, « La Dîme »), lues par les joueurs dans le livre en ligne.
// Rien de secret : ni la mort de la Cour, ni ce que boit la terre.
import type { RuleSection } from "./rules";

export const REGLES_TERNELANDE: RuleSection[] = [
  {
    id: "df-souvenirs",
    title: "Les souvenirs",
    body: [
      "Chaque personnage écrit sur sa fiche six souvenirs précis : le visage de sa mère, le nom de son premier cheval, la chanson du mariage, le chemin de la maison. Ils sont son histoire, sa monnaie pour la Dîme, et le prix de sa magie.",
      "Un souvenir est intact, flou ou perdu. Un souvenir flou qu'on use encore est perdu : on le raye, et le personnage ne s'en souviendra plus jamais.",
      "- Raconter : pendant un repos long, un personnage raconte un souvenir flou à un autre personnage ; le souvenir redevient intact. Une fois par palier de niveaux (1 à 4, 5 à 10, 11 à 16, 17 à 20) et par souvenir.",
      "- Nouveaux souvenirs : un à chaque niveau pair, tiré de ce que le personnage a vécu en jeu.",
      "- Vide : un personnage sans aucun souvenir intact. À chaque grand choix moral, le MJ dit ce que ferait quelqu'un qui ne se souvient de personne ; le joueur le fait, ou use un souvenir flou.",
    ],
  },
  {
    id: "df-magie",
    title: "Ce que coûte la magie",
    body: [
      "Les tours et les sorts de niveau 1 et 2 ne coûtent rien.",
      "- Le premier sort de niveau 3 ou plus lancé après un repos long rend flou un souvenir intact, au choix du joueur. Les suivants, jusqu'au repos long, ne coûtent rien de plus.",
      "- Un sort de niveau 6 ou plus rend flou un souvenir à chaque fois.",
      "Les pouvoirs de classe qui coûtent un souvenir le disent : « Ce pouvoir rend flou un souvenir. »",
    ],
  },
  {
    id: "df-dime",
    title: "La nuit de la Dîme",
    body: [
      "Chaque année, la nuit la plus longue, chaque personnage qui vit en Ternelande raye un souvenir de sa fiche (deux en l'an 512), en le nommant devant la pierre de dîme du village.",
      "- Mort à gage : quelqu'un d'autre pose son front sur la pierre à sa place, et nomme un de ses propres souvenirs. C'est interdit.",
      "- Reliquaire : une Gardienne a caché le souvenir dans un objet ; on le garde, si personne ne trouve l'objet. C'est puni de mort.",
      "- Ne rien donner : la pierre garde une trace tiède de chaque front, et les Dîmiers la touchent à l'aube. Un foyer qui n'a pas payé, le Dîmier lui prend un souvenir de plus, et c'est lui qui choisit lequel.",
      "Un souvenir donné à la Dîme compte comme perdu.",
    ],
  },
  {
    id: "df-reflets",
    title: "Les Reflets et le fer froid",
    body: [
      "Les Reflets sont des formes qu'on voit sous la glace des lacs, ou qui marchent la nuit de la Dîme. Le fer froid, battu sans feu, les blesse : une arme de fer froid ignore leur résistance aux armes ordinaires.",
      "Un Reflet qui touche quelqu'un peut lui rendre flou un souvenir (sauvegarde de Volonté). Le sel de veillée jeté sur un seuil l'empêche d'entrer jusqu'à l'aube.",
    ],
  },
  {
    id: "df-argent",
    title: "L'argent et l'hiver",
    body: [
      "| Monnaie | Valeur",
      "| Denier d'argent | la pièce courante",
      "| Sou | douze deniers",
      "| Livre | vingt sous",
      "Ce que coûtent les choses :",
      "| Quoi | Prix",
      "| Un repas d'auberge | 2 deniers",
      "| Une nuit à l'auberge | 4 deniers",
      "| Une épée | 10 livres",
      "| Un mort à gage, au marché noir | 1 à 5 livres",
      "En hiver, une nuit dehors sans abri ni feu donne un niveau d'épuisement, sauf sauvegarde d'Endurance DD 12. On voyage en traîneau sur la neige et sur les lacs gelés ; un jour de traîneau vaut une journée et demie de marche.",
    ],
  },
];
