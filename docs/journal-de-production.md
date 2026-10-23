# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 23/10/2026 : travail des cartes et des illustrations commité sur `claude/livre-des-regles` (PR n°2), puis branche `claude/studio` créée à partir de là.
- 23/10/2026 : plan en 7 étapes validé, dans l'ordre ci-dessous.
- 23/10/2026 : carte côté joueur en A′ ; outillage validé avec un serveur MCP pour ComfyUI seulement (pas pour LM Studio).
- 23/10/2026 : canon en TypeScript (option A) : `shared/canon/fantasy.ts`, importé par les générateurs, les tests et les livres.
- 24/10/2026 : jeu de cartes à collectionner, en trois étapes (1. paquets et collection au service du JdR ; 2. duel entre amis puis contre un bot ; 3. le reste si le duel plaît). Choix : cartes = objets, alliés, faveurs jouables en partie ; 4 raretés + signature du MJ ; paquets de 6 ; paquets donnés par le MJ + 1 par fin de séance ; jamais d'argent réel. Référence visuelle : Riftbound. Recherche : `docs/recherche-jeu-de-cartes.md`.
- 24/10/2026 : cartes de la table en « relique noire » (option B) ; Mickael veut une DA « de dingue ». Puis idée d'un jeu de cartes à collectionner (paquets, decks, duels contre un bot ou un ami) : avis franc et plan demandés.
- 24/10/2026 : dés sur la table, choisis comme morceau suivant du jeu de plateau.
- 24/10/2026 : vue de 3/4 (plateau incliné) : bouton sur la carte, choix gardé par chaque joueur.
- 24/10/2026 : plateau sur la table (option A) : la carte est un plateau épais posé sur une table de noyer, sous une lampe ; le brouillard reste sur le plateau.
- 24/10/2026 : pions en figurines (option A) : socle dont la tranche porte la couleur du pion, portrait peint tiré des illustrations, figurine soulevée quand on la déplace. Mickael : « comme un jeu de plateau, mais pour notre jeu de rôle » ; c'est le fil de l'étape 6.
- 23/10/2026 : créatures au nom secret (option A) : un nom public pour les joueurs (Bouche, Langue, Main, Dent du Dessous ; « Ce qui attend en bas » pour le fragment de Gorvan), le MJ garde le vrai nom. Chronologie (option A) : Ostral est arrivé il y a 621 ans, le lore est corrigé.

## Plan
| # | Étape | État |
|---|---|---|
| 1 | Mise à l'abri du travail en cours, journal de production | fait |
| 2 | Fondations sûres : fiches de PNJ hors de la vue joueur, droits des fiches et des pions, import contrôlé, réglages vérifiés, documents remis à certains joueurs | fait (PR n°3) |
| 3 | Outillage Claude Code : hooks en Node, agents Haiku et Sonnet, skills, MCP ComfyUI | fait (PR n°4) |
| 4 | Canon d'Aubreterre en TypeScript (`shared/canon/fantasy.ts`), générateurs branchés dessus, tests de cohérence | fait (PR n°5) |
| 5 | Mémoire de campagne côté serveur, préparation de la séance suivante | fait (PR n°5) |
| 6 | (en cours, PR n°5 pour les figurines) Écrans immersifs : tableau de bord du MJ, fiche cliquable, codex, effets, 400 px ; pions en figurines (demande de Mickael du 23/10) | à faire |
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

## Étape 6, premier morceau : les figurines (24/10/2026)
- `scripts/vignettes-figurines.mjs` : 71 vignettes de 256 px (57 créatures, 14 classes), recadrées sur le buste, en WebP (656 Ko en tout).
- Créature du bestiaire : sa vignette ; personnage d'Aubreterre sans portrait : la vignette de sa classe ; sinon le buste dessiné d'avant.
- Le portrait reste à toute taille de case ; les monstres peints ont un disque plus grand et gardent griffes, cornes ou côtes.
- Plateau (`client/src/mapBoard.ts`) : table en planches mise en cache par taille d'écran ; plateau qui suit le zoom (ombre, tranche de carton contrecollé, marge de toile, filets et coins de laiton, nom de la carte doré). Remplace le cadre de case de BD et le flou ambiant du MJ. Le cadrage d'ensemble garde le bord du plateau à l'écran. Il montre les dimensions de la carte, comme un vrai plateau.
- Vue de 3/4 : la scène est peinte à plat dans un calque, puis couchée en perspective par bandes de 2 px (`warpTilted`, 34°) ; les figurines sont dessinées debout sur un socle, de l'arrière vers l'avant ; les clics passent par la projection inverse et une figurine se saisit par son corps. Mickael a demandé une estimation pour une vraie 3D (réponse du 24/10 : en trois niveaux).
- Dés sur la table (`client/src/components/DesSurLaTable.tsx`) : chaque lancer du journal porte ses dés (`ChatEntry.roll`) ; chaque client le rejoue (rebonds, faces qui défilent, arrêt sur la valeur du serveur, choc synthétisé), en couleur du joueur, depuis sa place à la table. Dés écartés grisés, lueur dorée sur un 20 naturel, rouge sur un 1, étiquette du total. Un jet secret n'est rejoué que chez qui le voit. 8 dés au plus à l'écran. Suite possible : piste d'initiative en jetons, cartes de rencontre.
- Piste d'initiative : réglette de noyer, jetons peints (même vignette que la figurine, `client/src/figurines.ts`).
- Cartes (`shared/cartes.ts`, `client/src/components/Cartes.tsx`) : trois pioches du MJ (rencontres du bestiaire, 12 événements et 10 objets écrits dans le canon), aperçu privé, retournement animé devant la table, carte posée au coin du plateau. 57 illustrations de cartes en 600 × 760 (`client/public/cartes/`). Les événements et objets ont un emblème gravé en attendant leurs propres peintures Flux.
- Cartes à collectionner, étape 1 : catalogue de 34 cartes (`shared/canon/collection-fantasy.ts`, contrôlé par le test du canon), paquets tirés par le serveur (`shared/collection.ts`), collection par joueur dans la campagne, ouverture mise en scène (sceau, éventail, lueur de rareté, retournement, cloche), onglet Cartes du joueur, distribution par le MJ dans l'onglet Campagne, cartes « une fois » ou « par séance ». Peintures Flux des 30 cartes sans illustration en cours (sujets dans `shared/canon/collection-fantasy-peintures.ts`).
- Limite connue, à traiter : le code du client contient tout le bestiaire et la bibliothèque, secrets compris ; un joueur curieux peut les lire dans le navigateur. Le nom public protège l'écran, pas le code.

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
