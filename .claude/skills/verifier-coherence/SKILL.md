---
name: verifier-coherence
description: Vérifier qu'un contenu de Forge JdR (scénario, carte, rencontre, prompt, chapitre) respecte le canon de son monde - noms, chronologie, anachronismes, créatures, secrets.
---

# Vérifier la cohérence

Un nom absent du canon est une erreur, pas une liberté.

## Automatique
- `npm test` : les tests du bestiaire, de la charte et des générateurs. Avec le canon (étape 4 du plan), ils vérifient aussi :
  - chaque nom cité existe ;
  - aucune date ne contredit la chronologie ;
  - aucun objet anachronique ;
  - chaque accroche est reliée à une faction ;
  - les rencontres ne prennent que des créatures du bon monde et du bon niveau.
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
