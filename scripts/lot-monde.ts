// Lot complet d'un monde pour ComfyUI : ses créatures (prompt du bestiaire) puis les planches de ses livres.
// npx tsx scripts/lot-monde.ts <genre> <monde>   →   comfyui/lot-<monde>.json
// Puis : node comfyui/generer.mjs comfyui/lot-<monde>.json http://127.0.0.1:8188 <monde>
import { readFileSync, writeFileSync } from "node:fs";
import { creaturesFor, illustrationSeed } from "../shared/bestiary";
import type { GenreId } from "../shared/types";

const [genre, monde] = process.argv.slice(2) as [GenreId, string];
const creatures = creaturesFor(genre).map((c) => ({ id: c.id, prompt: c.illustration, seed: illustrationSeed(c.id) }));
const livres = JSON.parse(readFileSync(`comfyui/prompts-${monde}-livres.json`, "utf8"));
const ids = new Set(creatures.map((c) => c.id));
const lot = [...creatures, ...livres.filter((x: { id: string }) => !ids.has(x.id))];
writeFileSync(`comfyui/lot-${monde}.json`, JSON.stringify(lot, null, 2) + "\n");
console.log(`${creatures.length} créatures + ${lot.length - creatures.length} planches → comfyui/lot-${monde}.json`);
