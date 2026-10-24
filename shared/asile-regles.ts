// Règles propres au Champ-d'Asile (western, 1878), lues par les joueurs dans le livre en ligne.
// Rien de secret. Le Nom (la réputation) et la poudre comptée remplacent la magie ; l'argent se compte en dollars.
import type { RuleSection } from "./rules";

export const REGLES_ASILE: RuleSection[] = [
  {
    id: "ws-nom",
    title: "Le Nom",
    body: [
      "Dans le Champ, personne ne jette de sort et personne ne guérit d'un geste. Il y a des hommes et des femmes qui tirent plus vite, montent mieux, mentent mieux que les autres, et ça se sait. Chaque personnage a un Nom, de 0 à 10 : ce qu'on raconte de lui dans les saloons. Tout le monde commence à 0. Note-le sur ta fiche.",
      "Comment il monte :",
      "- Il monte d'un point quand tu fais un coup d'éclat devant témoins : un duel gagné, un train arrêté, une évasion, une arrestation devant la ville, ou un pouvoir de classe marqué « Coup d'éclat ». Le MJ décide s'il y a coup d'éclat.",
      "- Des témoins, ce sont au moins deux personnes qui ne sont pas de ton groupe et qui parleront. Sans témoin, un exploit ne fait pas de Nom.",
      "- Au plus un point par séance et par personnage, deux si un journal le publie. Un exploit de groupe donne un point à chacun, dans la même limite.",
      "Comment il baisse :",
      "- Il redescend d'un point après un mois de jeu sans témoin ni combat.",
      "- On peut aussi le faire baisser exprès : payer un faux témoin, se faire passer pour mort, obtenir une grâce. Compte de 2 à 5 points, au prix d'une aventure que le MJ prépare.",
      "- Un tricheur surpris la main dans le sac perd un point.",
      "Les classes qui vivent de leur réputation (Pistolero, Vaquero, Shérif, Joueur, Chasseur de primes, Prédicateur, Hors-la-loi) ont le passif « Ce qu'on raconte » : elles ont des pouvoirs marqués « Coup d'éclat » qui font monter le Nom, et elles choisissent ce que la rumeur dit d'elles quand leur Nom atteint 3, 5 ou 7.",
    ],
  },
  {
    id: "ws-nom-donne",
    title: "Ce que donne le Nom",
    body: [
      "À partir de 3, les gens te reconnaissent : avantage aux tests d'Intimidation face à qui connaît ta réputation, et on te fait crédit de 25 dollars sur parole par palier de 3 (25 à 3, 50 à 6, 75 à 9). Ce crédit est une avance sur parole : ne pas la rendre se sait.",
      "À partir de 6, on t'offre du travail sans que tu le demandes : un rancher, un shérif, un banquier ou un chef te cherche et propose un contrat.",
      "Un Nom de 10 est une légende : on te reconnaît à un bout de phrase, un cheval, une silhouette.",
    ],
  },
  {
    id: "ws-nom-coute",
    title: "Ce que coûte le Nom",
    body: [
      "Le Nom attire autant qu'il protège. À chaque palier, le MJ prépare la personne qui vient :",
      "- 3 : les primes. Un shérif, un Ranger ou un rural s'intéresse à toi. Ta tête est mise à prix : 100 dollars.",
      "- 5 : les jeunes. Une fois par séance, quelqu'un veut se faire un nom en te provoquant. Tu peux refuser, mais on le saura.",
      "- 7 : les professionnels. Un chasseur de primes ou un tueur à gages vient pour toi, avec un plan. La prime passe à 500 dollars.",
      "- 10 : la légende. Tu ne peux plus entrer dans une ville sans qu'on le sache dans l'heure, et quelqu'un, quelque part, a décidé que tu mourrais cette année.",
      "Un Nom bas n'est pas une honte : un personnage à 2 passe partout. Un Nom haut ouvre des portes et en ferme à clé. C'est à toi de choisir ce qu'on raconte.",
    ],
  },
  {
    id: "ws-poudre",
    title: "La poudre",
    body: [
      "Les cartouches comptent. Chaque personnage tient sur sa fiche le nombre de cartouches de chaque arme.",
      "- Une cartouche par attaque avec une arme à feu, y compris celles que tes pouvoirs ajoutent (« Poudre : N cartouches » dit combien un pouvoir en fait partir en tout).",
      "- Revolver : 6 coups, recharger les six prend une action. Winchester : 15 coups. Le fusil de chasse et le Sharps se rechargent après chaque tir, en action.",
      "- 50 cartouches pèsent 1,5 kg.",
      "- On pille 1d6 cartouches sur un ennemi tombé. On ne ramasse pas ses douilles.",
      "Une boîte de 50 cartouches coûte 1 dollar à Fort-Rail, 2 à Bonne-Espérance, 5 à la Croix-de-Pierre.",
      "Colt (revolver) : 1d8 perforants, portée 12/36 m. Winchester : 1d8 perforants, portée 30/90 m. Fusil de chasse : 2d6 perforants, portée 9/27 m. Sharps : 2d8 perforants, portée 36/108 m, un coup par action. Ce sont des armes courantes pour toutes les classes.",
      "Un personnage qui n'a plus de cartouches se bat au couteau, au sabre ou à la crosse. Compter les balles fait la tension d'un duel : ne laisse pas le joueur y échapper.",
    ],
  },
  {
    id: "ws-voyager",
    title: "Voyager",
    body: [
      "On compte en jours de cheval. À cheval, on fait quarante à soixante kilomètres par jour, selon le terrain. Il faut cinq jours pour traverser le Champ d'est en ouest, de la gare de Fort-Rail à la Croix-de-Pierre.",
      "Forcer l'allure ajoute vingt kilomètres : le cheval fait une sauvegarde d'Endurance DD 12, ou il boite (vitesse réduite de moitié) jusqu'à un repos long. Un cheval éreinté se remplace : 60 dollars pour un bon cheval.",
      "La diligence relie Fort-Rail à Bonne-Espérance deux fois par semaine. Une place coûte 5 dollars, un bagage 1 dollar. Elle s'arrête aux relais pour changer les chevaux, et les voleurs de la route le savent.",
      "Le train va jusqu'à Fort-Rail et pas plus loin : la voie s'arrête devant une borne de pierre. Un billet de Saint-Louis à Fort-Rail coûte 25 dollars en seconde classe.",
      "Dans la Comanchería, on va à cheval, ou on n'y va pas. Passer la Croix-de-Pierre sans s'être présenté au poste de traite est une faute grave : on y vend la farine, le sucre, le café, et on y demande la permission. Une visite se prépare, un cadeau se choisit, et on ne tire pas sur le gibier d'un campement.",
      "Les nuits en plein air : un feu se voit à trois kilomètres, et réchauffe. Un campement sans feu passe inaperçu, mais on y a froid, et les chevaux s'agitent. Une veille par nuit suffit en groupe de quatre.",
    ],
  },
  {
    id: "ws-argent",
    title: "L'argent de 1878",
    body: [
      "Le dollar américain et la piastre d'argent du Champ valent la même chose. Cent cents font un dollar. Quelques prix :",
      "| Quoi | Prix",
      "| Un repas | 25 cents",
      "| Une nuit à l'auberge | 1 dollar",
      "| Une nuit dans une grange | 25 cents",
      "| Un couteau | 1 dollar",
      "| Un Colt | 17 dollars",
      "| Un Winchester | 25 dollars",
      "| Un fusil de chasse | 12 dollars",
      "| Un fusil Sharps | 30 dollars",
      "| Une boîte de 50 cartouches | 1 à 5 dollars",
      "| Un bon cheval | 60 dollars",
      "| Une selle | 10 dollars",
      "| Une place de diligence | 5 dollars",
      "| Le salaire d'un vaquero | 30 dollars par mois",
      "| Le salaire d'un shérif | 75 dollars par mois",
      "Au départ, tu prends la plus haute des sommes de ta classe, de ton origine et de ton historique, pas leur total.",
      "Un vaquero qui ne dépense rien met deux mois à s'acheter un Colt et sa selle. Un Colt 17 dollars, une boîte de cartouches 1 à 5 : on fait vite le compte de ce que coûte un duel.",
      "On ne paie pas toujours en argent. Une dette d'honneur, un service rendu, une parole donnée valent parfois plus qu'un billet. Dans le Champ, un Asilien préfère une piastre d'argent à un billet.",
    ],
  },
];
