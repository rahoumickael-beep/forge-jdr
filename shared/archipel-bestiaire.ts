// Bestiaire de l'Archipel (science-fiction, « Les Phares »).
// Fiches façon D&D 5e, mêmes outils qu'Aubreterre (fiches.ts) ; le style des planches vient de la charte SF.
// Quatre familles : Faune des mondes, Équipages, Machines, Choses des Routes.
import type { Creature } from "./bestiary";
import { fabriquerCreature, type CreatureInput } from "./fiches";

const creature = (input: CreatureInput): Creature => fabriquerCreature("science-fiction", input);

export const BESTIAIRE_ARCHIPEL: Creature[] = [].map(creature);
