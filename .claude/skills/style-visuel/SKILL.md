---
name: style-visuel
description: Règles de design de Forge JdR - modifier l'interface sans qu'elle ait l'air générique ou générée par une IA.
---

# Style visuel

Direction : une table de jeu le soir. Feutre vert sombre, bois, fiches en papier ligné, accents laiton. Un seul thème sombre, volontaire.

- Couleurs : uniquement les variables de `client/src/styles.css` (`--felt`, `--wood`, `--paper`, `--ink`, `--brass`, `--blood`, `--moss`). Pas de couleur en dur dans les composants, sauf les couleurs de pions et de thèmes de carte.
- Typo : `--display` (IM Fell English SC) pour les titres et la narration seulement ; `--body` (Source Sans 3) pour le reste ; `--mono` pour codes et chiffres alignés.
- Les fiches (personnages, scénarios, documents) utilisent `.paper`. Le reste de l'interface est sur bois/feutre.
- À éviter : dégradés violets, emoji comme icônes, cartes arrondies partout avec ombre, tout centrer, Inter.
- Textes de l'interface : tutoiement, phrases courtes, verbes qui disent ce qui se passe (« Poser sur la table », « Distribuer »).
- Le rendu de carte (`MapCanvas.tsx`) imite une carte dessinée : grain par case (`hash`), hachures sur les murs, vaguelettes sur l'eau. Garder ce côté fait main.
- Vérifie toujours à 400 px de large (la barre latérale passe sous la carte).
