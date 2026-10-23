---
name: fabriquer-livres
description: Fabriquer et vérifier les livres PDF de Forge JdR (livre des joueurs, guide du MJ, bestiaire), en version écran ou imprimeur, sous Windows.
---

# Fabriquer les livres

## Commandes
- `npm run livres` : les trois livres dans `dist-livre/`. Écrit aussi `dist-livre/illustrations-a-peindre.json` et `comfyui/prompts-livres.json`.
- `npm run livres:impression` : version imprimeur à 300 dpi dans `dist-livre-impression/`. Les images agrandies doivent être dans `content/aubreterre/illustrations-hd` (`node comfyui/agrandir.mjs`).
- Un seul livre : `npx tsx scripts/livres/index.ts joueurs|mj|bestiaire dist-livre`.

## Où est quoi
- `scripts/livres/moteur.ts` : mise en page et PDF.
- `style.ts` : charte des livres, tirée de `shared/charte.ts`.
- `texte.ts` : Markdown vers pages.
- `joueurs.ts`, `mj.ts`, `bestiaire.ts` : contenu de chaque livre.
- Chapitres en Markdown : `content/aubreterre/joueurs/*.md`.
- Planches : `content/aubreterre/illustrations/<id>.jpg`. Une planche absente laisse un cadre d'attente.

## Windows
- **Fins de ligne CRLF** : le Markdown est lu correctement depuis le commit f11bd2e. Garde ce comportement si tu touches à `texte.ts`.
- **pdftoppm absent** : les aperçus PNG sont sautés, c'est normal. Pour regarder une page, ouvre le PDF ou utilise le skill `pdf`.

## Avant de livrer une version
1. `npm run livres` sans erreur, et note le nombre de pages de chaque livre (joueurs ~103, MJ ~34, bestiaire ~74 en octobre 2026). Un livre qui fond d'un coup trahit un chapitre mal lu.
2. Relecture par l'agent `relecteur-ortho` sur les chapitres modifiés.
3. Vérifie qu'aucun secret du MJ n'apparaît dans le livre des joueurs (agent `verif-canon`). Gorvan reste dans le guide du MJ.
4. Crédits et licences : mention SRD 5.1/5.2 (CC-BY 4.0), aucun contenu protégé de D&D, crédits des polices et des outils d'illustration.
5. Regarde quelques pages au hasard : une illustration par page au plus, pas de titre seul en bas de page, tableaux lisibles.
