# Forge JdR

Une table de jeu de rôle en ligne, pensée pour jouer entre amis avec le vocal sur Discord.

- **Le maître du jeu** crée une partie, choisit le genre (fantasy, dark fantasy, SF, cyberpunk, horreur, post-apo, western, pirates, steampunk, thriller), le ton et le niveau.
- **Il génère** des scénarios, personnages, PNJ, rencontres, butins et cartes (donjon, cavernes, extérieur, village), au hasard ou avec une IA locale.
- **Les joueurs** rejoignent avec un code, créent leur personnage et déplacent leur pion sur la carte en temps réel.
- **Outils du MJ** : brouillard de guerre au pinceau, pions cachés, PV, initiative et tours de combat, blocage des déplacements, narration, bandeau d'ambiance, documents à distribuer, notes secrètes, sauvegarde et restauration.
- Règles inspirées de D&D 5e : d20, 6 caractéristiques, CA, PV, cases de 1,5 m.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. Pour jouer à plusieurs en local, tes amis doivent pouvoir joindre ton ordinateur (voir « Mettre en ligne »).

## Essai dans VS Code

Ouvre le dossier dans VS Code, puis **Terminal > Exécuter la tâche de build** (Ctrl+Maj+B) : la tâche « Essai complet » installe tout, lance les tests, fabrique les trois livres et les ouvre, puis démarre la table sur http://localhost:5173. Pour jouer un joueur en même temps, ouvre une fenêtre privée sur la même adresse et entre le code de la partie. Les tâches une par une sont dans **Terminal > Exécuter la tâche…**.

## Mettre en ligne

Le plus simple : [Render](https://render.com), offre gratuite.
1. Crée un compte Render et connecte GitHub.
2. « New » → « Blueprint » → choisis ce dépôt. Le fichier `render.yaml` fait le reste.
3. Envoie l'adresse obtenue à tes amis, avec le code de la partie (bouton du code en haut : il copie le lien d'invitation).

L'offre gratuite s'endort après 15 minutes sans visite et efface les parties au redémarrage : pense à **Réglages → Télécharger la sauvegarde** en fin de séance, et **Restaurer** la fois suivante.

## IA locale avec LM Studio

1. Dans LM Studio, charge un modèle (sur une RTX 3080 : Gemma 3 12B ou Mistral Nemo 12B pour la vitesse, Gemma 4 31B pour la qualité).
2. Onglet **Developer** : démarre le serveur et active **Enable CORS**.
3. Dans la partie, onglet **Réglages** → Intelligence artificielle → LM Studio → **Tester**.

C'est le navigateur du MJ qui parle à LM Studio : les joueurs n'ont rien à installer.

## IA avec Claude (facultatif)

Ajoute `ANTHROPIC_API_KEY` dans les variables d'environnement du serveur (fichier `.env` en local, réglages Render en ligne), puis choisis « Claude » dans les réglages.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Développement avec rechargement |
| `npm run build && npm start` | Version de production |
| `npm test` | Tests des générateurs, dés et cartes |
| `npm run playtest` | Partie automatique MJ + joueur dans deux navigateurs |

## Travailler avec Claude Code

Le dépôt contient tout ce qu'il faut pour que Claude continue le travail : `CLAUDE.md` (règles du projet), des skills dans `.claude/skills` (ajouter un genre, écrire un scénario, tester une partie, style visuel), un agent relecteur de règles, des hooks (installation automatique, vérification des types après chaque modification) et un serveur MCP Playwright pour piloter un navigateur.
