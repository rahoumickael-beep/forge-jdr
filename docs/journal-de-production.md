# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 23/10/2026 : travail des cartes et des illustrations commité sur `claude/livre-des-regles` (PR n°2), puis branche `claude/studio` créée à partir de là.
- 23/10/2026 : plan en 7 étapes validé, dans l'ordre ci-dessous.
- 23/10/2026 : carte côté joueur en A′ ; outillage validé avec un serveur MCP pour ComfyUI seulement (pas pour LM Studio).

## Plan
| # | Étape | État |
|---|---|---|
| 1 | Mise à l'abri du travail en cours, journal de production | fait |
| 2 | Fondations sûres : fiches de PNJ hors de la vue joueur, droits des fiches et des pions, import contrôlé, réglages vérifiés, documents remis à certains joueurs | fait (PR n°3) |
| 3 | Outillage Claude Code : hooks en Node, agents Haiku et Sonnet, skills, MCP ComfyUI | fait (PR n°4) |
| 4 | Canon d'Aubreterre en données typées, générateurs branchés dessus, tests de cohérence | à faire |
| 5 | Mémoire de campagne côté serveur, préparation de la séance suivante | à faire |
| 6 | Écrans immersifs : tableau de bord du MJ, fiche cliquable, codex, effets, 400 px | à faire |
| 7+ | Un monde par genre : 3 prémisses, puis noms, puis style, au choix de Mickael | à faire |

## Décisions techniques
- Carte côté joueur : le choix A (n'envoyer que les cases vues) casse le rendu, qui a besoin de toutes les cases et des noms des salles pour meubler, et redessiner coûte 0,3 à 1,5 s par pas. La graine suffit de toute façon à reconstruire la carte. Mickael a choisi A′ le 23/10/2026 : la carte complète reste dans les données (comme Roll20 ou Foundry), rien d'inexploré ne s'affiche ; un joueur voit le nom d'une salle une fois plus de la moitié explorée.
- Performance : rendu à deux vitesses (30 images/s pendant 2 s après un changement ou un geste, 4 au repos). Mesuré : 20 images en 5 s au repos contre 150 avant.

## État au 23/10/2026
- Typecheck, 34 tests, build et partie automatique : tout passe.
- Livres : joueurs 103 p., MJ 34 p., bestiaire 74 p. (aperçus PNG sautés sous Windows, pdftoppm absent).
- Cartes : ~7,5/10. Points faibles : toits du village sages, forêt uniforme, salles vides du donjon plates.
- Illustrations : 99 posées, dont 20 replis à repeindre un jour (liste dans la mémoire de Claude).
- Brouillard : vérifié par `apercu-cartes`, aucune fuite ; les murs devinés sur la capture étaient des couloirs déjà parcourus.

## Points ouverts
- 4 prompts déjà peints enfreignent la règle « route, piquet, mât » (origine-humain, origine-petites-gens, mj-heritiers, famille-betes) : planches gardées, à corriger si on les repeint.
- Planche du demi-orc à repeindre.
- Agrandissement 300 dpi de toutes les planches, version imprimeur des livres.
- Styles graphiques des 9 autres genres.
- Nom définitif du jeu (Forge des Mondes, Mille Royaumes, Le Carrefour des Destins).
- `comfyui/generer-v2.mjs` non suivi : pas à Claude, laissé tel quel.
