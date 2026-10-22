// Lance en lot les illustrations d'Aubreterre sur ton ComfyUI (à exécuter sur ton PC, ComfyUI démarré).
// node comfyui/generer.mjs prompts.json [http://127.0.0.1:8188]
// prompts.json : [{ "id": "couverture", "prompt": "...", "seed": 1, "width": 1024, "height": 1344 }, ...]
// Chaque prompt produit 4 variantes dans le dossier output/aubreterre de ComfyUI. Garde la meilleure,
// renomme-la <id>.png et dépose-la dans content/aubreterre/illustrations.
import { readFileSync } from "node:fs";

const [file, base = "http://127.0.0.1:8188"] = process.argv.slice(2);
if (!file) {
  console.error("Usage : node comfyui/generer.mjs prompts.json [adresse de ComfyUI]");
  process.exit(1);
}
const workflow = JSON.parse(readFileSync(new URL("./flux-schnell-api.json", import.meta.url), "utf8"));
const jobs = JSON.parse(readFileSync(file, "utf8"));

for (const job of jobs) {
  const wf = structuredClone(workflow);
  wf["2"].inputs.text = job.prompt;
  wf["5"].inputs.seed = job.seed ?? Math.floor(Math.random() * 1e9);
  wf["4"].inputs.width = job.width ?? 1024;
  wf["4"].inputs.height = job.height ?? 1344;
  wf["7"].inputs.filename_prefix = `aubreterre/${job.id}`;
  const res = await fetch(`${base}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: wf }) });
  if (!res.ok) {
    console.error(`${job.id} : ComfyUI a refusé (${res.status}) ${await res.text()}`);
    continue;
  }
  console.log(`${job.id} : en file d'attente`);
}
console.log("Tout est envoyé. Les images arrivent dans ComfyUI/output/aubreterre/.");
