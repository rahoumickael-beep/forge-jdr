---
name: batir-un-monde
description: Construire le monde d'un genre de Forge JdR (prémisse, atlas, factions, histoire, figures, bestiaire, origines et classes) au niveau d'Aubreterre, en faisant choisir Mickael à chaque étape de goût.
---

# Bâtir un monde

Aubreterre (`content/aubreterre/lore.md`) est la référence de qualité. Un monde n'est pas un décor : c'est un conflit ouvert que les joueurs vont faire basculer.

## Mickael choisit, toujours en A/B/C
Ne décide jamais à sa place. À chaque étape, propose trois options et ta recommandation. Pendant qu'il réfléchit, avance sur ta recommandation si c'est réversible.
1. **Prémisse** : 3 options de 2 lignes chacune. Chaque prémisse a un grand secret que personne ne connaît en début de campagne.
2. **Noms** : 3 jeux de noms pour les lieux et les figures clés. Les noms sonnent comme une langue du monde, pas comme un générateur.
3. **Style graphique** : 3 directions (support, palette, lumière, artiste de référence libre de droits). Elles vont dans `shared/charte.ts`, qui reste `provisoire: true` tant qu'il n'a pas choisi.

Note chaque choix dans `docs/journal-de-production.md`.

## Ce qu'il faut écrire
- **Prémisse** et grand secret, sur le modèle Ostral et Gorvan.
- **Atlas** : 6 à 8 régions avec climat, architecture, époque, végétation, ce qu'on y craint. Les cartes générées s'en servent.
- **Factions** : 3 à 5, avec un but, une méthode et un ennemi. Elles se contredisent et aucune n'a tout à fait raison.
- **Croyances et magie** : ce que ça coûte, qui en a peur.
- **Histoire en âges**, avec des dates : la chronologie sert aux tests de cohérence.
- **Figures marquantes** : ce qu'elles veulent, ce qu'elles cachent, comment elles parlent.
- **Conflits ouverts et mystères.**
- **20 accroches** réparties par tranche de niveau (1-4, 5-10, 11-16, 17-20), chacune reliée à une faction.
- **Bestiaire propre** (agent `fiches-creatures`), **origines et classes propres** au genre : de vraies différences de jeu, pas un simple changement de nom.

## Trois niveaux de lecture
Chaque fait est rangé dans un niveau :
- **Joueurs** : ce que tout le monde sait (livre des joueurs).
- **MJ** : ce que le MJ sait (guide du MJ).
- **Secret** : ce que personne ne sait encore (révélations de campagne).

Un secret ne doit jamais apparaître dans un texte pour les joueurs ni partir dans `viewFor`.

## Où ça va
- `content/<monde>/lore.md` : la bible lisible.
- `shared/canon/<genre>.ts` : le canon typé (lieux, factions, figures, chronologie, secrets, vocabulaire interdit). Les générateurs et les tests s'y réfèrent.
- `shared/genres.ts` (listes de tirage), `shared/bestiary.ts`, `shared/origins.ts`, `shared/rules.ts`.

## Relecture avant de livrer
Lance en parallèle :
- `relecteur-lore` (cohérence et voix) ;
- `verif-canon` (noms) ;
- `relecteur-regles` (équilibre) ;
- `relecteur-ortho`.

Lis leurs retours, corrige, puis `npm test`.
