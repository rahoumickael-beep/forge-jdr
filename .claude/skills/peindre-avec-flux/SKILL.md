---
name: peindre-avec-flux
description: Écrire des prompts Flux Schnell et produire des illustrations dans le ComfyUI de Mickael (file, suivi, tri, recadrage, agrandissement 300 dpi) sans casser la charte du monde.
---

# Peindre avec Flux

ComfyUI tourne sur le PC de Mickael (Pinokio, `http://127.0.0.1:8188`, `flux1-schnell-fp8`, 4 étapes, cfg 1).

**On ajoute à la file, on ne la vide jamais et on n'arrête jamais ce qui tourne.**

## Écrire le prompt
- **La lumière en premier.** Pour une créature, c'est celle de sa famille (`LUMIERE_FAMILLE` dans `shared/bestiary.ts`) : une lumière par famille.
- **Le style vient de la charte** : `stylePeinture(genre, cadrage, lumiere)` dans `shared/charte.ts`. Ne le réécris pas à la main.
- **Cadrage fixe par type** : créature en pied, centrée, à hauteur d'yeux ; portrait à mi-corps de trois quarts ; scène en plan large ; objet seul sur un drap sombre.
- **Jamais de négation** (« no », « without », « sans ») : Flux dessine ce qu'on nie. Décris ce qu'on voit à la place (« bare head » plutôt que « no helmet »).
- **Fantasy** : monde préindustriel, peinture à l'huile. Aucun mot qui appelle des poteaux ou des câbles (route, piquet, mât).
- **Concret et visuel** : matières, couleurs, posture, ce que tient la main. Évite les abstractions (« menacing aura »).
- **Les règles sont dans `comfyui/regles-flux.json`.** Le hook `prompts-flux` et le serveur MCP les appliquent.

## Produire
Avec le serveur MCP `comfyui` (déclaré dans `.mcp.json`) :
1. `comfyui_etat` : la file et la mémoire vidéo.
2. `comfyui_mettre_en_file` avec `lots: [{ id, prompt, seed?, width?, height?, variantes? }]`. Les prompts fautifs sont refusés.
3. `comfyui_suivre` avec les `prompt_id` : une image prend environ 5 s, une série de 4 environ 20 s.
4. `comfyui_recuperer` : les images arrivent dans `comfyui/sorties/` (hors Git), les 9 % du bas sont coupés (fausses signatures).

Sans MCP : `node comfyui/generer.mjs <lot.json>`.

## Trier
- Regarde chaque variante.
- Fais contrôler les prompts par l'agent `verif-prompts` (Haiku) avant un gros lot.
- Garde la meilleure variante, convertis-la en JPEG et pose-la dans `content/<monde>/illustrations/<id>.jpg`.
- Si aucune ne convient, corrige le prompt et reporte la correction dans sa source (`shared/bestiary.ts` ou `scripts/livres/*.ts`) : sinon, la fabrication suivante des livres l'écrasera.

## Agrandir pour l'impression
`node comfyui/agrandir.mjs` (RealESRGAN ×4), puis `npm run livres:impression`.

## Budget
- Annonce le nombre d'images avant de lancer un lot de plus de 20 prompts.
- Les vérifications répétitives vont à Haiku, les réécritures de prompts à Sonnet (voir la mémoire « économiser les tokens »).
