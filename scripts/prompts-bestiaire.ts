// Refait comfyui/prompts-bestiaire.json depuis le bestiaire (une planche par créature, graines conservées).
// npx tsx scripts/prompts-bestiaire.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { BESTIARY } from "../shared/bestiary";

const FICHIER = "comfyui/prompts-bestiaire.json";
const anciennes: { id: string; seed: number }[] = existsSync(FICHIER) ? JSON.parse(readFileSync(FICHIER, "utf8")) : [];
const graine = new Map(anciennes.map((p) => [p.id, p.seed]));
const lot = BESTIARY.map((c, i) => ({ id: c.id, name: c.name, prompt: c.illustration, seed: graine.get(c.id) ?? 5000 + i, width: 1024, height: 1344 }));
writeFileSync(FICHIER, JSON.stringify(lot, null, 2) + "\n");
console.log(`${lot.length} prompts → ${FICHIER}`);
