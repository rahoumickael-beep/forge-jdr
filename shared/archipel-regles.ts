// Règles propres à l'Archipel (science-fiction, « Les Phares »), lues par les joueurs dans le livre en ligne.
// Rien de secret : ni Dormeurs, ni ce que fait vraiment un Orgue.
import type { RuleSection } from "./rules";

export const REGLES_ARCHIPEL: RuleSection[] = [
  {
    id: "sf-chant",
    title: "Le Chant et l'Écho",
    body: [
      "Une personne sur cent mille entend la pierre des Phares. Formée, elle chante une note que personne d'autre n'entend : le Phare s'ouvre, une main se fige, une pensée se laisse lire. Depuis la Nuit des Orgues, chanter est un crime, et la prime pour un Chantre vivant est de vingt mille lumens.",
      "Chaque pouvoir du Chant ajoute de l'Écho : 1 pour les petits, 2 ou 3 pour les grands. La réserve d'un Chantre va de 0 à 2 × niveau + 4.",
      "- Quand l'Écho dépasse le niveau + 2, le Chantre est troublé : désavantage aux tests d'Instinct et aux sauvegardes de concentration. Le MJ peut lui décrire ce qu'il entend.",
      "- Un pouvoir qui ferait dépasser le maximum demande une sauvegarde d'Instinct (DD 10 + l'excédent, 20 au plus). En cas d'échec, le Chantre perd connaissance une minute.",
      "- Un repos court retire 1d4 Écho ; un repos long le retire tout.",
      "La voie Dissonante force le Chant : plus de dégâts, plus d'Écho, et quelque chose, quelque part, s'en souvient.",
    ],
  },
  {
    id: "sf-sauts",
    title: "Sauts, Routes et Péage",
    body: [
      "On ne voyage entre les étoiles qu'en sautant d'un Phare à l'autre, le long des Routes. Les distances se comptent en sauts : Gué-d'Ambre est à deux sauts des Brisants, Ancre à quatre sauts de Solenne.",
      "Un saut se prépare : quelques heures de vol jusqu'au Phare, le Péage au poste de l'Orgue, la file d'attente, puis le saut lui-même, de dix minutes à six heures.",
      "| Saut | Ce qu'il coûte",
      "| Péage d'un petit cargo | 200 à 400 lumens",
      "| Péage d'un gros vaisseau | jusqu'à 2 000 lumens",
      "| Resquille (dans le sillage d'un autre) | test de pilotage DD 13 ; raté : 2d10 à la coque",
      "Sauter en resquille est sévèrement puni. Sortir d'un saut raté, c'est parfois ne pas sortir seul.",
    ],
  },
  {
    id: "sf-vaisseau",
    title: "Le vaisseau et ses postes",
    body: [
      "L'équipage a son vaisseau, avec sa fiche : coque (ses points de vie), boucliers (qui prennent les dégâts avant la coque), CA, vitesse en cases, armes, soute, défauts et améliorations. Un vieux cargo a trois défauts ; on les efface en payant des réparations.",
      "Chaque personnage tient un poste, dans l'onglet Vaisseau. Un personnage ne tient qu'un poste à la fois, et seul celui qui tient un poste peut en jouer les actions.",
      "| Poste | Caractéristique | Actions",
      "| Capitaine | Présence | Donner l'ordre (DD 12) : chaque tir du vaisseau a +2 ce round",
      "| Pilote | Réflexes | Esquiver : +2 CA (DD 12), +4 sur 18 ou plus ; il déplace le pion du vaisseau",
      "| Artilleur | Réflexes | Tirer : d20 + Réflexes + bonus de l'arme contre la CA de la cible",
      "| Mécanicien | Technique | Réparer la coque (1d8 + Technique) ou relancer les boucliers (2d6 + Technique)",
      "| Vigie | Instinct | Désigner une cible (DD 12) : le prochain tir a l'avantage",
      "Le serveur ajoute ta maîtrise aux tests de capitaine, de pilote et de vigie ; un tir ajoute le bonus de l'arme à tes Réflexes. Les bonus de classe (Mains sur le manche, Artilleur, Commandement de bord…) se comptent à la main : annonce-les au MJ. Un 20 naturel au tir double les dés de dégâts ; un 1 naturel manque toujours.",
    ],
  },
  {
    id: "sf-combat-spatial",
    title: "Le combat spatial",
    body: [
      "Le combat se joue sur une carte d'espace, avec les mêmes dés et la même initiative. Le vide se traverse partout ; les astéroïdes bloquent le passage et la vue ; les nébuleuses et les débris se traversent.",
      "À chaque round, chaque poste joue une action. Le MJ ouvre un nouveau round : esquives, ordres et cibles désignées retombent.",
      "Un vaisseau à 0 point de coque est désemparé : plus de moteurs ni d'armes jusqu'à ce qu'une réparation remonte la coque à 1 ou plus. L'équipage peut encore se battre à bord, fuir en capsule ou se rendre.",
      "Fuir remplace l'action du pilote : il doit réussir deux tests de Réflexes (DD fixé par le MJ selon le poursuivant) avant que le vaisseau n'ait été touché trois fois. À chaque test raté, le poursuivant tire une fois.",
    ],
  },
  {
    id: "sf-dette",
    title: "Dette et lumens",
    body: [
      "L'équipage commence avec un cargo de quarante ans acheté à crédit à la Main Close : 40 000 lumens, par mensualités de 2 000, une par séance ou presque. Payer en retard a un prix ; ne pas payer du tout en a un autre.",
      "| Quoi | Prix",
      "| Un repas de dock | 2 lumens",
      "| Une nuit en dortoir | 5 lumens",
      "| Un pistolet brûleur | 250 lumens",
      "| Un fusil brûleur | 600 lumens",
      "| Un plein de carburant | 300 lumens",
      "| Une réparation de coque (par point) | 50 lumens",
      "| Un faux transpondeur | 1 500 lumens",
    ],
  },
];
