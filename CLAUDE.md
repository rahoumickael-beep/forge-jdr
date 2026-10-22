# Forge JdR

Table de jeu de rôle en ligne pour Mickael et ses amis (4 joueurs + un MJ, vocal sur Discord).
Le MJ génère scénarios, personnages, rencontres et cartes dans le genre de son choix ; chaque joueur déplace son pion depuis chez lui en temps réel.

Mickael écrit en français : interface, textes de jeu, commentaires et messages de commit en français.

## Organisation
- `shared/` : code commun client/serveur. Types (`types.ts`), contenu des genres (`genres.ts`), générateurs aléatoires à graine (`generators.ts`, `maps.ts`), dés (`dice.ts`), prompts et lecture des réponses IA (`ai.ts`).
- `server/` : Express + Socket.IO. `rooms.ts` garde les parties en mémoire, les sauve dans `data/<CODE>.json` et filtre ce que chaque joueur voit (`viewFor`). `index.ts` contient toutes les actions temps réel.
- `client/` : React + Vite. `store.ts` (connexion et état), `components/MapCanvas.tsx` (carte en canvas), `GmPanels.tsx` (outils du MJ), `PlayerPanels.tsx`, `Sheets.tsx` (fiches papier).

## Règles du projet
- Règles de jeu inspirées de D&D 5e : 6 caractéristiques (noms adaptés au genre), modificateur `(valeur-10)/2`, CA, PV, initiative au d20, distances en cases de 1,5 m, niveaux 1 à 20.
- Le serveur est l'autorité : toute action passe par un événement Socket.IO avec vérification des droits (MJ, ou propriétaire du pion). Jamais de secret du MJ dans `viewFor` côté joueur.
- L'IA est optionnelle. LM Studio est appelé **depuis le navigateur du MJ** (`client/src/ai.ts`, API compatible OpenAI sur `localhost:1234`) ; Claude passe par `/api/claude` si `ANTHROPIC_API_KEY` est défini. Sans IA, tout doit marcher avec les générateurs aléatoires, et une réponse IA incomplète est complétée par eux (`toScenario`, `toCharacter`).
- Pas de chat texte : le vocal se fait sur Discord. Le journal sert aux dés, à la narration et aux événements.
- Design et écriture : voir les skills `style-visuel` et `ecrire-scenario`. Rien ne doit avoir l'air générique ou écrit par une IA.

## Commandes
- `npm run dev` : serveur (3001) + client (5173) avec rechargement.
- `npm run typecheck`, `npm test` : à lancer avant chaque commit.
- `npm run build && npm run playtest` : partie automatique MJ + joueur dans deux navigateurs (skill `tester-partie`).
- `npm run build && npm start` : version de production sur un seul port.
