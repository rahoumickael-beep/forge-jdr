---
name: verifier-coherence
description: Vérifier qu'un contenu de Forge JdR (scénario, carte, rencontre, prompt, chapitre) respecte le canon de son monde - noms, chronologie, anachronismes, créatures, secrets.
---

# Vérifier la cohérence

Un nom absent du canon est une erreur, pas une liberté.

## Automatique
- `npm test` : `shared/canon.test.ts` confronte tout le contenu fantasy au canon (`shared/canon/fantasy.ts`) :
  - aucun nom propre absent du canon dans la bibliothèque, le bestiaire, les origines, les historiques, les classes et l'entrée `fantasy` de `genres.ts` (les chapitres de règles en Markdown n'y passent pas, trop de termes de règles) ;
  - aucune date « an N du Glas / du Couronnement » après l'année de jeu, chronologie et âges d'accord ;
  - aucun anachronisme de la liste du canon ;
  - aucun secret (Gorvan…) dans ce que lisent les joueurs ;
  - chaque accroche et chaque figure reliées à une faction connue, chaque créature à une région du canon ;
  - les rencontres tirées au hasard ne prennent que des créatures du monde, à la bonne puissance, dans un lieu du canon ;
  - un PNJ tiré au hasard ne porte jamais le nom d'une figure.
- Pour un texte isolé : `nomsInconnus`, `datesImpossibles` et `anachronismesDans` de `shared/canon/index.ts`.
- Un nom nouveau et voulu s'ajoute dans le canon, pas dans le test, et la décision va dans le journal.
- Le hook `prompts-flux` refuse à l'écriture un prompt Flux qui contient une négation ou un anachronisme (règles dans `comfyui/regles-flux.json`).

## À la main, avec les agents
1. `verif-canon` (Haiku) : liste des noms absents ou anachroniques.
2. `relecteur-lore` (Sonnet) : contradictions, fuites de secrets, voix du monde.
3. Pour une carte : le type et le climat correspondent à la région (un village de Pallène a l'architecture et la végétation de Pallène). Regarde l'aperçu : `node scripts/apercu-rendu.mjs <dossier> <types> <graine> <genre>`.
4. Pour une rencontre : `relecteur-regles`, et le skill `concevoir-rencontre`.

## Secrets
Le serveur filtre ce que voit chaque joueur dans `viewFor` (`server/rooms.ts`), et `server/rooms.test.ts` le prouve. Tout nouveau champ secret de `RoomState` doit y être retiré pour les joueurs, avec un test qui cherche le texte secret dans la vue sérialisée.

## Quand un test de cohérence casse
Corrige le contenu, pas le test, sauf si le canon lui-même doit changer. Dans ce cas, demande à Mickael et note la décision dans `docs/journal-de-production.md`.
