---
name: ecrire-scenario
description: Écrire un scénario, un PNJ ou un texte de jeu pour Forge JdR qui sonne comme un vrai maître du jeu et pas comme une IA.
---

# Écrire pour la table

Mickael veut des textes qu'on ne devine pas écrits par une IA. Ces règles valent pour les scénarios de la bibliothèque, les tables aléatoires de `shared/genres.ts` et les prompts de `shared/ai.ts` (`STYLE_GUIDE`).

## Règles
- Concret avant tout : un objet, une odeur, un bruit, un nom de rue. Jamais « une atmosphère mystérieuse ».
- Phrases courtes, verbes d'action, présent de l'indicatif pour le MJ.
- Chaque PNJ : ce qu'il veut, ce qu'il cache, une façon de parler (un tic, un mot fétiche).
- Chaque scène donne aux joueurs un choix et une conséquence.
- Interdits : « dans un monde où », « au cœur de », « un voile de mystère », « le destin », « une aura », « palpable », « tapisserie », « sombre secret », les noms Elara, Lyra, Kael, Thorne, Vex, Eldoria, Aldric.
- Pas de morale finale, pas de résumé enthousiaste.
- Règles inspirées de D&D 5e : CA 10 à 20, PV et attaques cohérents avec le niveau (voir `generateEncounter`).

## Format d'un scénario
Le type `Scenario` de `shared/types.ts` : accroche, synopsis, 3-4 actes (titre, lieu, résumé), méchant, 3 PNJ avec secret, rencontres avec ennemis chiffrés, 2 rebondissements, 2 récompenses.

## Relecture
Relis à voix haute. Si une phrase pourrait apparaître dans n'importe quel scénario, réécris-la avec un détail propre à celui-ci.
