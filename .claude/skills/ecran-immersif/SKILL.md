---
name: ecran-immersif
description: Concevoir ou modifier un écran du MJ ou des joueurs de Forge JdR pour qu'il soit immersif à la table (soirée entre amis sur Discord), lisible à 400 px et jamais générique.
---

# Écran immersif

Pense à une soirée entre amis : chacun chez soi, le vocal sur Discord, la table ouverte dans le navigateur. Il n'y a pas de chat texte : le journal sert aux dés, à la narration et aux événements.

## Principes
- **Le MJ** pilote sans chercher : la scène en cours, les PNJ présents (portrait, ce qu'ils veulent), les notes secrètes, la jauge du Sceau et les horloges de menace, en un coup d'œil. Une action fréquente se fait en un clic.
- **Le joueur** joue sans lire de règles : cliquer une caractéristique ou une attaque lance le dé. Son codex ne garde que ce que son personnage a découvert.
- **Les moments forts** se voient : critique, mort, révélation, début de combat (le sceau de cire qui se brise). Les effets restent courts et discrets, rien d'agressif, et ils respectent `prefers-reduced-motion`.
- **Transitions de scène soignées**, sons discrets, qu'on peut couper.
- **Le style** suit le skill `style-visuel` et la charte du genre (`shared/charte.ts`, `client/src/themes.css`).

## Contraintes techniques
- **Le serveur décide.** Toute action passe par un événement Socket.IO avec vérification des droits. Ce qui est secret ne part pas chez le joueur (`viewFor`), et un test le prouve.
- **400 px de large** : la barre latérale passe sous la carte, et chaque bouton reste à 32 px de haut au moins.
- **Performance** : la carte dessine 30 images/s pendant l'action et 4 au repos (`MapCanvas.tsx`). Un nouvel effet ne doit pas la garder éveillée en permanence.
- **Accessibilité** : rôles ARIA (les onglets sont des `tab`), contraste suffisant sur le papier et sur le feutre, focus visible.

## Vérifier
1. `npm run typecheck`, `npm test`.
2. `npm run build && npm run playtest`. Ajoute une étape au script si l'écran apporte une action nouvelle.
3. Captures avant et après, à 1400 px et à 400 px de large. Montre-les à Mickael.
4. Pour explorer à la main : serveur MCP `playwright` sur `npm run dev` (http://localhost:5173).
