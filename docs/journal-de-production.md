# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 23/10/2026 : travail des cartes et des illustrations commité sur `claude/livre-des-regles` (PR n°2), puis branche `claude/studio` créée à partir de là.
- 23/10/2026 : plan en 7 étapes validé, dans l'ordre ci-dessous.

## Plan
| # | Étape | État |
|---|---|---|
| 1 | Mise à l'abri du travail en cours, journal de production | fait |
| 2 | Fondations sûres : fiches de PNJ hors de la vue joueur, droits des fiches et des pions, import contrôlé, réglages vérifiés, documents remis à certains joueurs | fait (PR n°3), sauf la carte : voir ci-dessous |
| 3 | Outillage Claude Code : hooks en Node, agents Haiku et Sonnet, skills, MCP ComfyUI (à montrer avant d'installer) | à faire |
| 4 | Canon d'Aubreterre en données typées, générateurs branchés dessus, tests de cohérence | à faire |
| 5 | Mémoire de campagne côté serveur, préparation de la séance suivante | à faire |
| 6 | Écrans immersifs : tableau de bord du MJ, fiche cliquable, codex, effets, 400 px | à faire |
| 7+ | Un monde par genre : 3 prémisses, puis noms, puis style, au choix de Mickael | à faire |

## Décisions techniques
- Carte côté joueur : le choix A (n'envoyer que les cases vues) casse le rendu, qui a besoin de toutes les cases et des noms des salles pour meubler, et redessiner coûte 0,3 à 1,5 s par pas. La graine suffit de toute façon à reconstruire la carte. Variante proposée à Mickael le 23/10/2026, en attente.
- Performance : la carte se redessine 30 fois par seconde en permanence (torches, brume). À passer en rendu à la demande (carte graphique de Mickael à 99 % pendant les essais).

## État au 23/10/2026
- Typecheck, 34 tests, build et partie automatique : tout passe.
- Livres : joueurs 103 p., MJ 34 p., bestiaire 74 p. (aperçus PNG sautés sous Windows, pdftoppm absent).
- Cartes : ~7,5/10. Points faibles : toits du village sages, forêt uniforme, salles vides du donjon plates.
- Illustrations : 99 posées, dont 20 replis à repeindre un jour (liste dans la mémoire de Claude).
- Brouillard : vérifié par `apercu-cartes`, aucune fuite ; les murs devinés sur la capture étaient des couloirs déjà parcourus.

## Points ouverts
- Planche du demi-orc à repeindre.
- Agrandissement 300 dpi de toutes les planches, version imprimeur des livres.
- Styles graphiques des 9 autres genres.
- Nom définitif du jeu (Forge des Mondes, Mille Royaumes, Le Carrefour des Destins).
- `comfyui/generer-v2.mjs` non suivi : pas à Claude, laissé tel quel.
