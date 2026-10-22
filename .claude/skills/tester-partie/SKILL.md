---
name: tester-partie
description: Vérifier que Forge JdR marche vraiment - tests unitaires, puis une partie automatique avec un MJ et un joueur dans deux navigateurs.
---

# Tester une partie

1. `npm run typecheck` puis `npm test` (générateurs, dés, cartes, lecture des réponses IA).
2. `npm run build` puis `npm run playtest`.
   - Le script lance son propre serveur sur le port 3999 avec un dossier de données temporaire.
   - Le MJ crée une partie et pose une carte, un joueur rejoint, crée son personnage, déplace son pion avec les flèches et lance un d20.
   - Il vérifie que le MJ voit le déplacement et le lancer, puis enregistre `playtest-mj.png` et `playtest-joueur.png`.
   - Dans un conteneur sans navigateurs Playwright à jour : `CHROMIUM_PATH=/opt/pw-browsers/chromium npm run playtest`.
3. Ouvre les deux captures et regarde-les vraiment : carte lisible, pions visibles, rien de coupé.
4. Pour explorer à la main, le serveur MCP `playwright` (dans `.mcp.json`) permet de piloter un navigateur sur `npm run dev` (http://localhost:5173).

Les helpers `window.__forge()` (état de la partie) et `window.__forgeTokenScreen(id)` (position d'un pion à l'écran) existent pour ces tests.
