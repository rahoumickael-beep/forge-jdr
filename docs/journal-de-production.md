# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 23/10/2026 : travail des cartes et des illustrations commité sur `claude/livre-des-regles` (PR n°2), puis branche `claude/studio` créée à partir de là.
- 23/10/2026 : plan en 7 étapes validé, dans l'ordre ci-dessous.
- 23/10/2026 : carte côté joueur en A′ ; outillage validé avec un serveur MCP pour ComfyUI seulement (pas pour LM Studio).
- 23/10/2026 : canon en TypeScript (option A) : `shared/canon/fantasy.ts`, importé par les générateurs, les tests et les livres.
- 23/10/2026 : créatures au nom secret (option A) : un nom public pour les joueurs (Bouche, Langue, Main, Dent du Dessous ; « Ce qui attend en bas » pour le fragment de Gorvan), le MJ garde le vrai nom. Chronologie (option A) : Ostral est arrivé il y a 621 ans, le lore est corrigé.

## Plan
| # | Étape | État |
|---|---|---|
| 1 | Mise à l'abri du travail en cours, journal de production | fait |
| 2 | Fondations sûres : fiches de PNJ hors de la vue joueur, droits des fiches et des pions, import contrôlé, réglages vérifiés, documents remis à certains joueurs | fait (PR n°3) |
| 3 | Outillage Claude Code : hooks en Node, agents Haiku et Sonnet, skills, MCP ComfyUI | fait (PR n°4) |
| 4 | Canon d'Aubreterre en TypeScript (`shared/canon/fantasy.ts`), générateurs branchés dessus, tests de cohérence | fait (branche `claude/canon`) |
| 5 | Mémoire de campagne côté serveur, préparation de la séance suivante | fait (branche `claude/canon`) |
| 6 | Écrans immersifs : tableau de bord du MJ, fiche cliquable, codex, effets, 400 px ; pions en figurines (demande de Mickael du 23/10) | à faire |
| 7+ | Un monde par genre : 3 prémisses, puis noms, puis style, au choix de Mickael | à faire |

## Décisions techniques
- Carte côté joueur : le choix A (n'envoyer que les cases vues) casse le rendu, qui a besoin de toutes les cases et des noms des salles pour meubler, et redessiner coûte 0,3 à 1,5 s par pas. La graine suffit de toute façon à reconstruire la carte. Mickael a choisi A′ le 23/10/2026 : la carte complète reste dans les données (comme Roll20 ou Foundry), rien d'inexploré ne s'affiche ; un joueur voit le nom d'une salle une fois plus de la moitié explorée.
- Performance : rendu à deux vitesses (30 images/s pendant 2 s après un changement ou un geste, 4 au repos). Mesuré : 20 images en 5 s au repos contre 150 avant.

## Étape 4 : le canon (23/10/2026)
- `shared/canon/fantasy.ts` : monde, calendrier (an 621 du Couronnement = an 7 du Glas), chronologie, 8 régions et leurs lieux, 12 factions, 20 figures, 7 divinités, peuples, vocabulaire, secrets, anachronismes, réserves de noms, accroches reliées à des factions.
- Ajoutés au canon parce que le bestiaire ou la bibliothèque les avaient créés : Fort-Brac, Mains-Nues, Sonneur du Glas, Pris-dans-le-chêne, la Fossoyeuse, le Bâillement, Amarante, le Roi des Noyes, Thiébaut Mainferrée, les frères du Silence, et les PNJ de « Ce que rend la tourbe ».
- `genres.ts` (lieux, prénoms, noms, accroches) et le lieu des rencontres lisent le canon.
- Les noms de famille des figures (Crolle, Lescot, Varlet, Pell, Mainferrée) sont sortis de la réserve des PNJ tirés au hasard, qui pouvait produire « Hubert Lescot » ou « Bastienne Crolle » ; remplacés par Corbin, Mortemer, Sauvelet, Bourrache, Lattier.
- Noms publics : `publicName` dans le bestiaire ; `hideUnseen` (serveur) remplace le vrai nom dans les pions et l'initiative des joueurs, et l'annonce publique du combat utilise aussi le nom public. Testé dans `server/rooms.test.ts` et `shared/canon.test.ts`.
- Fuite corrigée : le trait « Oreille fine » (Elfe de Mémoire) nommait Gorvan dans le livre des joueurs.

## Étape 5 : la mémoire de campagne (23/10/2026)
- `RoomState.campagne` (`shared/campagne.ts`) : séances (résumé du MJ, faits notés tout seuls : combats, cartes, documents publics), fils ouverts (secrets ou non), PNJ croisés (attitude, ce que savent les joueurs, ce que garde le MJ), réputation auprès de chaque faction du canon (0 à 3), jauge du monde (le Sceau) et réserve du MJ (les Murmures), notes de préparation.
- Ouvrir une séance lit le « Précédemment » dans le journal. Un seuil du Sceau franchi prévient le MJ seul, avec l'effet du lore.
- Fiche de préparation sans IA : précédemment, fils, PNJ marquants, ordres qui bougent, Sceau et prochain seuil, accroches de campagne du palier (les 10 du lore, dans le canon), rencontre prête.
- Vue joueur (onglet Chronique) : ni fil secret, ni note de PNJ, ni Murmures, ni préparation ; le Sceau seulement si le MJ coche « Les joueurs voient la jauge » (décochée par défaut, comme le recommande le lore jusqu'à l'accroche 4).
- Demande de Mickael (23/10) : des pions plus « figurine à déplacer » pour joueurs, monstres et PNJ. À faire à l'étape 6, avec 3 directions à lui proposer.

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
