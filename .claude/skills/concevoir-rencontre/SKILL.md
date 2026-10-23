---
name: concevoir-rencontre
description: Concevoir une rencontre de combat ou de tension pour Forge JdR, équilibrée façon 5e (budget de PX, FP), avec les créatures du bestiaire du monde et un enjeu qui dépasse le combat.
---

# Concevoir une rencontre

## Les créatures
- Seulement celles du monde : `creaturesFor(genre)` dans `shared/bestiary.ts`. Pas de créature hors bestiaire dans un monde qui en a un.
- La région compte : une créature des Noyes n'a rien à faire dans le Verre-Rouge, sauf si c'est le sujet de la scène.
- Conversion en ennemi de rencontre : `toEncounterEnemy(creature, nombre, niveauDuGroupe)`.

## L'équilibre (SRD 5e)
- Budget de PX façon Guide du maître, comme `generateEncounter` dans `shared/generators.ts` : le budget dépend du nombre de joueurs, de leur niveau et de la difficulté visée.
- Multiplicateur de groupe : plusieurs ennemis valent plus que la somme de leurs PX (×1,5 à 2 ennemis, ×2 de 3 à 6, plus au-delà).
- Le FP d'une créature doit concorder avec ses PV, sa CA, ses dégâts et son bonus (`estimateCr`), à deux crans près au plus.
- Une rencontre « mortelle » est annoncée au MJ, jamais servie par surprise à un groupe de niveau 1.
- Fais relire par l'agent `relecteur-regles`.

## Ce qui rend une rencontre mémorable
- Un enjeu autre que « tuer tout le monde » : protéger quelqu'un, tenir jusqu'à l'aube, voler un objet, fuir.
- Le terrain joue : eau, hauteur, obscurité, porte à tenir. Choisis le type de carte en conséquence (`MapKind`).
- Les monstres ont un comportement : ils fuient à moitié de PV, protègent leur chef, ciblent la lumière.
- Une sortie possible sans combat : négocier, effrayer, payer, ruser.
- Un indice sur l'intrigue gagné en combattant ou en observant.

## Format
Le type `Encounter` (`shared/types.ts`) : titre, description concrète pour le MJ, ennemis chiffrés (`creatureId` renseigné), difficulté.

## Vérifier
`npm test`, puis pose la rencontre sur une carte dans la vraie table : le combat se lance tout seul quand un joueur voit un monstre.
