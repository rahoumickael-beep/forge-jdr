# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 24/10/2026 : style de la SF (Les Phares) : **A, couverture de poche des années 70** (gouache à l’aérographe, bleus outremer et ambre), contre l’huile usée et la sérigraphie. Charte SF validée. Odile Varlet repeinte et posée (pas encore bleutée, mais mouillée et pâle).
- 24/10/2026 : chaque monde est **un jeu à part entière** (classes, origines, bestiaire, scénarios, cartes à jouer, thème d’interface, trois livres PDF), au niveau d’Aubreterre. Les huit autres prémisses A collent à la vision de Mickael.
- 24/10/2026 : la SF est du **space opera à la Star Wars** (on va de planète en planète) : la Flotte Lente est abandonnée pour **Les Phares** (voir `docs/mondes-propositions.md`). Plusieurs espèces jouables ; un ordre mystique (équivalent de la Force, pouvoir qui coûte) ; blasters et lames ; combats de vaisseaux à postes (pilote, artilleur, mécanicien, capitaine) ; l’équipage part avec un vieux cargo endetté. Monde complet et jouable avant de passer au suivant ; illustrations seulement après le choix du style. Claude pousse sur GitHub après chaque étape qui passe les tests.
- 24/10/2026 : prémisses des neuf autres mondes, toutes en A (`docs/mondes-propositions.md`) : La Dîme, La Flotte Lente, Ville sous bail, La Côte des Noyés 1923, Le Grand Sec, Le Champ-d’Asile 1878, Les Îles du Vent 1715, L’Exposition éternelle, Cellule Hermès. On commence par la SF (le monde que la table veut jouer ensuite). Noms : Claude choisit, Mickael relit. Styles graphiques : 3 essais A/B/C par genre avant de peindre.
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
- Secrets du MJ hors du code des joueurs (24/10, nuit) : le code du MJ (`client/src/components/mj.tsx`, panneaux, pioche, campagne) est chargé à part dans `dist/assets/mj-*.js`, que le serveur ne sert qu'avec la clé du MJ (cookie posé par `/api/mj/acces`, `server/acces-mj.ts`). La réserve du MJ des genres (accroches, méchants, ennemis, rebondissements, récompenses) est passée de `genres.ts` à `shared/idees.ts` ; les personnages tirés au hasard à `shared/personnages.ts` ; le déplacement à `maps.ts` ; noms et lieux de rencontre d'Aubreterre dans `shared/canon/fantasy-table.ts`. Le serveur calcule la figurine (`Token.pion`), le sous-titre du combat et les noms de la Chronique ; il retire `creatureId` de la vue joueur. Les 5 créatures au nom secret ont des fichiers d'image à leur nom public (`bouche-du-dessous.webp`…). Contrôle : `npm run build && npm run verifier-secrets`. En développement (Vite), rien n'est gardé : c'est la machine du MJ.
- Peintures des cartes (24/10, nuit) : 38 posées (27 cartes à collectionner, 11 événements, 9 objets de la pioche, qui reprennent les peintures des objets de la collection). 4 à refaire, sujets corrigés et remis en file : Ruban noir (peu lisible), Clou de saint Brac (un marteau au lieu du clou), Odile Varlet (ni peau bleutée ni air de noyée), Le glas du hameau (croix chrétienne, hors canon : l'Église d'Ostral a pour signe la porte fermée).
- Demande de Mickael (24/10, nuit) : bâtir les 9 autres mondes, textes et images. Prémisses A/B/C et recommandations dans `docs/mondes-propositions.md` ; il a choisi les neuf A, en commençant par la SF.

## État au 23/10/2026
- Typecheck, 34 tests, build et partie automatique : tout passe.
- Livres : joueurs 103 p., MJ 34 p., bestiaire 74 p. (aperçus PNG sautés sous Windows, pdftoppm absent).
- Cartes : ~7,5/10. Points faibles : toits du village sages, forêt uniforme, salles vides du donjon plates.
- Illustrations : 99 posées, dont 20 replis à repeindre un jour (liste dans la mémoire de Claude).
- Brouillard : vérifié par `apercu-cartes`, aucune fuite ; les murs devinés sur la capture étaient des couloirs déjà parcourus.

## Monde SF : l’Archipel (« Les Phares »), 24/10/2026
- Bible `content/archipel/lore.md` : Phares (cocons des Dormeurs, secret), Hégémonie de la Maison Clermaure, Orgues de Valcourt, Chantres et Dissonants, 6 espèces (humains ancriens et frangiers, Vaëlles, Tarrak, Ikki, Ourdis, Ouvrés), 8 régions, 20 accroches, jauge « les Phares allumés » (131), réserve « Dissonance », première séance (la *Pie-Grièche*, Barnabé Coquerel, Rakka Sel-Noir, prix, Routes).
- Noms choisis par Claude (Mickael relira). Après relecture : Iselin devient Anselme Morvaut (trop proche d’Iselle), la princesse devient Ombeline de Clermaure, la classe « Brûleur » devient Fusilier (le brûleur est l’arme).
- Canon typé `shared/canon/science-fiction.ts` (+ table publique), branché dans `CANONS` ; test commun à tous les mondes `shared/canons.test.ts`. Listes de `genres.ts` et `idees.ts` reprises du canon ; caractéristiques SF : Puissance, Réflexes, Endurance, Technique, Instinct, Présence.
- Classes (`shared/archipel-classes.ts`) : Chantre, Pilote, Mécanicienne, Fusilier, Contrebandière, Chasseur de primes, Médecin de bord, Diplomate, Ferrailleur, Capitaine (le Capitaine remplace l’Éclaireuse, à cause des postes de vaisseau). Espèces et historiques dans `shared/archipel-origines.ts`. Relues par l’agent des règles, puis rééquilibrées : économie de l’Écho (réserve 2 × niveau + 4, trouble au-delà de niveau + 2, perte de connaissance seulement en dépassant le maximum, repos court 1d4, repos long complet), version à pied des pouvoirs de poste, soins et ordres bornés.
- Bestiaire (`shared/archipel-bestiaire.ts`, écrit par l’agent des fiches, relu et testé) : 25 créatures, 4 familles, FP 1/8 à 20 ; boss « Celui-qui-s’est-levé », vu des joueurs comme « La Silhouette de Cendrine ». Outils de fiche communs à tous les mondes dans `shared/fiches.ts` ; `BESTIARY` réunit les mondes, `creaturesFor(genre)` les sépare.
- Vaisseaux (`shared/vaisseaux.ts`) : sept modèles, fiche, postes (capitaine, pilote, artilleur, mécanicien, vigie), actions jouées par le serveur. Le vaisseau du groupe est un pion « joueur » (il voit, le pilote le déplace) ; les autres, des pions « monstre ». Carte « Espace » (`mapSpace.ts`). Onglet Vaisseau des joueurs, panneau Vaisseaux du MJ. Partie automatique : `node scripts/apercu-vaisseaux.mjs`.
- Corrigé en passant : la jauge de campagne était plafonnée à 100 (les 131 Phares seraient retombés à 100).
- Scénario d’ouverture « La première mensualité » (`shared/library-archipel.ts`), relu trois fois (canon, cohérence, orthographe) et repris : rencontres à l’échelle du niveau 1, branche du refus, choix à chaque acte. 30 cartes à collectionner, pioches de 12 événements et 10 objets.
- Règles du monde dans le livre en ligne (`shared/archipel-regles.ts`) : Chant et Écho, sauts et Péage, postes, combat spatial, dette.
- Peintures (style A) : 23 créatures + 2 repeintes (Garde Hégémonique trop proche d’une licence connue, Rakka trop frêle), 17 planches clés (couvertures, régions, figures) ; 21 planches de livre en file (espèces, classes, familles, scénario). Outil `comfyui/recuperer-lot.mjs`.
- Livres : la fabrique est devenue indépendante du monde (`scripts/livres/monde.ts`, `--monde=archipel`) ; Aubreterre sort à l’identique. `npm run livres:archipel` : livre des joueurs (107 p., huit chapitres adaptés par deux agents puis vérifiés), guide du MJ (30 p.), bestiaire (40 p.).
- Partie automatique SF (`node scripts/apercu-vaisseaux.mjs`) : créateur pas à pas, poste, tir, refus d’un poste non tenu.
- Essais de style des 8 autres mondes en file (ids dans `comfyui/sorties/ids-essais-mondes.txt`) : à montrer à Mickael.
- Reste pour l’Archipel : poser les 21 planches de livre, les relectures des chapitres 04 à 07 (règles, orthographe), la carte des Routes (illustration), la repeinture de Solenne.

## Points ouverts
- 4 prompts déjà peints enfreignent la règle « route, piquet, mât » (origine-humain, origine-petites-gens, mj-heritiers, famille-betes) : planches gardées, à corriger si on les repeint.
- Planche du demi-orc à repeindre.
- Agrandissement 300 dpi de toutes les planches, version imprimeur des livres.
- Styles graphiques des 9 autres genres.
- Nom définitif du jeu (Forge des Mondes, Mille Royaumes, Le Carrefour des Destins).
- `comfyui/generer-v2.mjs` non suivi : pas à Claude, laissé tel quel.
