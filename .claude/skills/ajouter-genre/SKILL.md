---
name: ajouter-genre
description: Ajouter ou enrichir un genre de jeu (fantasy, SF, western…) dans Forge JdR - classes, ennemis, lieux, thème de carte.
---

# Ajouter ou enrichir un genre

Tout le contenu d'un genre vit dans `shared/genres.ts`, dans le tableau `GENRES`.

1. Ajoute l'identifiant au type `GenreId` dans `shared/types.ts`.
2. Ajoute une entrée dans `GENRES` en remplissant **tous** les champs de l'interface `Genre` :
   - `stats` : exactement 6 caractéristiques, dans l'ordre Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme (renommées pour l'univers). Le code suppose que la 2e sert à l'initiative et la 3e aux PV.
   - `enemies` : du plus faible au plus fort, au moins 7. Les rencontres piochent dans la tranche correspondant au niveau.
   - `theme` : couleurs de la carte. Vérifie le contraste sol/mur et que les pions restent lisibles.
   - Listes de texte : au moins 5 entrées chacune, en français, concrètes. Pas de noms clichés (voir le skill `ecrire-scenario`).
3. Lance `npm test` : le test « chaque genre produit… » vérifie toutes les combinaisons de niveaux.
4. Lance `npm run build && npm run playtest` et regarde `playtest-mj.png` pour le rendu de la carte.
