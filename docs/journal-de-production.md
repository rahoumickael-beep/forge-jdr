# Journal de production

Mémoire du projet d'une session à l'autre : décisions, choix de Mickael, ce qui reste.

## Choix de Mickael
- 24/10/2026, tout en A : piratage de la Résidence au prix × maîtrise (à appliquer) ; Champ-d’Asile : convois d’esclaves tolérés avant 1865, jamais légalisé ; « Cellule Hermès » gardé, Service en France ; Villages coloniaux de l’Exposition dénoncés, origines jouables gardées ; Escrimeur à la place du Veilleur ; interface cyberpunk en orange sodium et sarcelle (fait) ; **nom du jeu : Forge des Mondes**.
- 24/10/2026 : styles des 8 mondes **validés** selon les recommandations : dark fantasy A, cyberpunk **C** (huile noire, sodium et sarcelle), horreur A, post-apo A, western A, pirates A, steampunk **B** (affiche Art nouveau, or et sarcelle), thriller **B** (roman graphique noir, une touche de rouge). Les dix chartes de `charte.ts` sont validées.
- 24/10/2026 : tokens : **Opus reste le cerveau** (délègue et contrôle) ; travail délégué vers Antigravity gratuit (`scripts/deleguer.mjs`). OmniRoute : **A, pas maintenant**, seulement si Antigravity sature souvent.
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

## Décisions techniques
- Carte côté joueur : le choix A (n'envoyer que les cases vues) casse le rendu, qui a besoin de toutes les cases et des noms des salles pour meubler, et redessiner coûte 0,3 à 1,5 s par pas. La graine suffit de toute façon à reconstruire la carte. Mickael a choisi A′ le 23/10/2026 : la carte complète reste dans les données (comme Roll20 ou Foundry), rien d'inexploré ne s'affiche ; un joueur voit le nom d'une salle une fois plus de la moitié explorée.
- Performance : rendu à deux vitesses (30 images/s pendant 2 s après un changement ou un geste, 4 au repos). Mesuré : 20 images en 5 s au repos contre 150 avant.

## Bilan au 25/10/2026
- Les dix mondes ont leur bible, leur canon, leurs classes et origines, leur bestiaire, leurs cartes, leur scénario de départ et leur livre des joueurs ; les dix jeux de livres PDF sont envoyés.
- Créateur de personnage corrigé pour tous : CA d'après l'armure portée, équipement sans doublon, argent de départ lu dans l'origine.
- Réserves du MJ (Grains, Pannes, Écoutes) dans le code du MJ seulement.
- Reste : styles graphiques des 8 mondes (choix de Mickael), puis les peintures ; relecture des noms par Mickael.

- Navires (Îles du Vent) faits le 24/10, détail dans les archives. Reste : équipage adverse à poser à la main après l'abordage, ponts toujours de même forme, hauts-fonds sans effet, ni vent ni courants.

## Peintures des mondes, un à la fois (choix de Mickael, 24/10/2026)
- Méthode : `npx tsx scripts/lot-monde.ts <genre> <monde>` (créatures + planches des livres) puis `node comfyui/generer.mjs comfyui/lot-<monde>.json http://127.0.0.1:8188 <monde>`. Tri des 4 variantes délégué (Gemini par `scripts/deleguer.mjs` ou qwen3-vl local), Opus contrôle par sondage. Un monde fini avant le suivant.
- Tri : `node scripts/tri-peintures.mjs planches <monde>` (2×2 lettrées), Gemini choisit (`choix.json`), Opus sonde, puis `poser <monde> choix.json`. Gemini s’est trompé 2 fois sur 3 au sondage (anachronisme, défaut d’anatomie) : toujours regarder la planche-contact.
- Ternelande : 56 peintures posées et livres refaits le 24/10, à montrer à Mickael. À repeindre : meute-affamee, brigand-des-landes, arbaletrier-de-compagnie, reflet, classe-fossoyeur, ours-des-neiges (trop gentil), origine-df-humain (manteau rouge XIXᵉ).

## Outils de délégation (24/10)
- Antigravity : **une seule tâche longue à la fois** (la seconde lancée en parallèle revient vide, sans erreur). Délai porté à 30 min.
- Contrôle à trois étages (choix A de Mickael) : `node scripts/controler.mjs [--tests] [chemins]` (sans IA, bilan de 5 lignes) ; `node scripts/relire.mjs --sortie f.md [chemins]` (relecture croisée par une autre IA via OmniRoute) ; Haiku/Sonnet seulement sur alerte.
- OmniRoute 3.8.52 sur 127.0.0.1:20128 (config dans ~/.omniroute/.env, clé client dans .env du projet) : Google AI Studio + Mistral branchés ; offres gratuites encore capricieuses (429, Pro en attente).

## Points ouverts
- 4 prompts déjà peints enfreignent la règle « route, piquet, mât » (origine-humain, origine-petites-gens, mj-heritiers, famille-betes) : planches gardées, à corriger si on les repeint.
- Planche du demi-orc à repeindre.
- Agrandissement 300 dpi de toutes les planches, version imprimeur des livres.
- Appliquer le nom « Forge des Mondes » (interface, livres) et le prix du piratage × maîtrise (Résidence).
- `comfyui/generer-v2.mjs` non suivi : pas à Claude, laissé tel quel.
