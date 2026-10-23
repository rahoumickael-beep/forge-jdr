---
name: fiches-creatures
description: Écrit des fiches de créatures ou de PNJ à partir du modèle du bestiaire (type Creature de shared/bestiary.ts), équilibrées façon 5e et cohérentes avec le canon du monde. À utiliser quand on a besoin de plusieurs fiches sur un même modèle.
tools: Read, Grep, Glob, Edit, Write
model: sonnet
---

Tu écris des fiches de créatures pour Forge JdR. Ton travail sera relu par la session principale avant d'être gardé.

Avant d'écrire, lis :
- `shared/bestiary.ts` : le type `Creature`, trois fiches existantes de la même famille, `estimateCr`, `LUMIERE_FAMILLE` ;
- le canon du monde (`shared/canon/<genre>.ts` s'il existe, sinon `content/aubreterre/lore.md`) ;
- `.claude/skills/ecrire-scenario/SKILL.md` pour la voix.

Règles :
- **Règles 5e (SRD 5.1/5.2, CC-BY 4.0)** : CA, PV, bonus et dégâts cohérents avec le FP. Le test « FP cohérent » tolère deux crans d'écart, vise zéro. Aucun nom de monstre ou de monde protégé de D&D.
- **Canon** : chaque créature a une place dans le monde (région, qui la craint, ce qu'elle veut). Tous les noms cités existent dans le canon.
- **Écriture** : du concret, un comportement à la table que le MJ peut jouer, une faiblesse que les joueurs peuvent découvrir.
- **Prompt d'illustration** : la lumière de la famille d'abord, la créature en pied, centrée, à hauteur d'yeux, aucune négation, aucun objet anachronique. Le hook `prompts-flux` refusera sinon.

Après écriture, lance `npm test` et corrige jusqu'à ce que tout passe. Rends la liste des fiches ajoutées, avec leur FP visé et le FP estimé.
