// Serveur MCP local pour ComfyUI (Flux Schnell) : mettre un lot en file, suivre, récupérer les images.
// Déclaré dans .mcp.json. Adresse de ComfyUI : variable COMFYUI_URL, sinon http://127.0.0.1:8188.
// Règle de la maison : on ajoute à la file, on ne la vide jamais et on n'arrête jamais ce qui tourne
// (ni /interrupt, ni suppression dans /queue : ces appels n'existent pas ici).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const BASE = (process.env.COMFYUI_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
const WORKFLOW = JSON.parse(readFileSync(join(ICI, "flux-schnell-api.json"), "utf8"));
const REGLES = JSON.parse(readFileSync(join(ICI, "regles-flux.json"), "utf8"));

async function comfy(path, init) {
  const res = await fetch(`${BASE}${path}`, init).catch(() => {
    throw new Error(`ComfyUI ne répond pas sur ${BASE}. Démarre-le dans Pinokio.`);
  });
  if (!res.ok) throw new Error(`ComfyUI a refusé ${path} (${res.status}) : ${(await res.text()).slice(0, 300)}`);
  return res;
}

/** Fautes d'un prompt selon comfyui/regles-flux.json. */
function fautes(prompt, genre) {
  const out = [];
  const n = prompt.match(new RegExp(REGLES.negation, "i"));
  if (n) out.push(`négation « ${n[0].trim()} » (Flux dessine ce qu'on nie)`);
  const liste = REGLES.anachronismes[genre];
  const a = liste && prompt.match(new RegExp(liste, "i"));
  if (a) out.push(`« ${a[0]} » anachronique pour ${genre}`);
  return out;
}

/** Chemin de sortie : toujours dans le projet. */
function dansLeProjet(p) {
  const abs = isAbsolute(p) ? p : resolve(RACINE, p);
  const rel = relative(RACINE, abs);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Destination hors du projet refusée : ${p}`);
  return abs;
}

const OUTILS = {
  comfyui_etat: {
    description: "État de ComfyUI : tâches en cours et en attente, mémoire de la carte graphique.",
    inputSchema: { type: "object", properties: {} },
    async run() {
      const q = await (await comfy("/queue")).json();
      const stats = await (await comfy("/system_stats")).json().catch(() => null);
      const gpu = stats?.devices?.[0];
      const vram = gpu ? `, mémoire vidéo libre ${(gpu.vram_free / 2 ** 30).toFixed(1)} Go sur ${(gpu.vram_total / 2 ** 30).toFixed(1)}` : "";
      return `${q.queue_running.length} en cours, ${q.queue_pending.length} en attente${vram}.`;
    },
  },
  comfyui_mettre_en_file: {
    description:
      "Ajoute des illustrations à la file de ComfyUI (Flux Schnell, 4 étapes, 4 variantes par prompt). Chaque prompt est contrôlé : pas de négation, pas d'objet anachronique pour le genre. Les prompts fautifs sont refusés, les autres partent. N'efface jamais la file.",
    inputSchema: {
      type: "object",
      required: ["lots"],
      properties: {
        lots: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "prompt"],
            properties: {
              id: { type: "string", description: "Nom du fichier, par exemple connetable-d-os" },
              prompt: { type: "string", description: "Prompt anglais, la lumière en premier" },
              seed: { type: "integer" },
              width: { type: "integer", description: "1024 par défaut" },
              height: { type: "integer", description: "1344 par défaut" },
              variantes: { type: "integer", description: "1 à 4, 4 par défaut" },
            },
          },
        },
        dossier: { type: "string", description: "Sous-dossier de sortie de ComfyUI, aubreterre par défaut" },
        genre: { type: "string", description: "Genre pour les anachronismes, fantasy par défaut" },
      },
    },
    async run({ lots, dossier = "aubreterre", genre = "fantasy" }) {
      if (!Array.isArray(lots) || !lots.length) throw new Error("Aucun lot.");
      const lignes = [];
      for (const job of lots) {
        const id = String(job.id ?? "").replace(/[^a-z0-9-]/gi, "-");
        const f = fautes(String(job.prompt ?? ""), genre);
        if (!id || f.length) {
          lignes.push(`${id || "?"} : REFUSÉ, ${f.join(" ; ") || "id manquant"}`);
          continue;
        }
        const wf = structuredClone(WORKFLOW);
        wf["2"].inputs.text = job.prompt;
        wf["5"].inputs.seed = job.seed ?? Math.floor(Math.random() * 1e9);
        wf["4"].inputs.width = job.width ?? 1024;
        wf["4"].inputs.height = job.height ?? 1344;
        wf["4"].inputs.batch_size = Math.max(1, Math.min(4, job.variantes ?? 4));
        wf["7"].inputs.filename_prefix = `${dossier.replace(/[^a-z0-9-]/gi, "-")}/${id}`;
        const r = await (await comfy("/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: wf }) })).json();
        lignes.push(`${id} : en file, prompt_id ${r.prompt_id}, graine ${wf["5"].inputs.seed}`);
      }
      return lignes.join("\n");
    },
  },
  comfyui_suivre: {
    description: "Où en sont des tâches : en attente (position), en cours, terminées (nombre d'images) ou en erreur.",
    inputSchema: { type: "object", required: ["prompt_ids"], properties: { prompt_ids: { type: "array", items: { type: "string" } } } },
    async run({ prompt_ids }) {
      const q = await (await comfy("/queue")).json();
      const lignes = [];
      for (const id of prompt_ids) {
        if (q.queue_running.some((t) => t[1] === id)) {
          lignes.push(`${id} : en cours`);
          continue;
        }
        const pos = q.queue_pending.findIndex((t) => t[1] === id);
        if (pos >= 0) {
          lignes.push(`${id} : en attente, ${pos + 1}e de la file`);
          continue;
        }
        const h = (await (await comfy(`/history/${encodeURIComponent(id)}`)).json())[id];
        if (!h) lignes.push(`${id} : inconnu (ComfyUI redémarré ?)`);
        else if (h.status?.status_str === "error") lignes.push(`${id} : erreur`);
        else lignes.push(`${id} : terminé, ${Object.values(h.outputs ?? {}).flatMap((o) => o.images ?? []).length} image(s)`);
      }
      return lignes.join("\n");
    },
  },
  comfyui_recuperer: {
    description:
      "Télécharge les images d'une tâche terminée dans le projet (comfyui/sorties/<dossier> par défaut), en recadrant le bas (9 % par défaut) pour enlever les fausses signatures. Rend la liste des fichiers, à regarder avant de choisir.",
    inputSchema: {
      type: "object",
      required: ["prompt_id"],
      properties: {
        prompt_id: { type: "string" },
        destination: { type: "string", description: "Dossier dans le projet" },
        recadrer_bas: { type: "number", description: "Part de la hauteur coupée en bas, 0.09 par défaut, 0 pour ne rien couper" },
      },
    },
    async run({ prompt_id, destination, recadrer_bas = 0.09 }) {
      const h = (await (await comfy(`/history/${encodeURIComponent(prompt_id)}`)).json())[prompt_id];
      if (!h) throw new Error("Tâche inconnue ou pas encore terminée.");
      const images = Object.values(h.outputs ?? {}).flatMap((o) => o.images ?? []);
      if (!images.length) throw new Error("Aucune image dans cette tâche.");
      const { default: sharp } = await import("sharp");
      const fichiers = [];
      for (const img of images) {
        const dest = dansLeProjet(destination ?? join("comfyui", "sorties", img.subfolder || ""));
        mkdirSync(dest, { recursive: true });
        const params = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder ?? "", type: img.type ?? "output" });
        const png = Buffer.from(await (await comfy(`/view?${params}`)).arrayBuffer());
        let out = png;
        const coupe = Math.max(0, Math.min(0.3, recadrer_bas));
        if (coupe > 0) {
          const { width, height } = await sharp(png).metadata();
          out = await sharp(png).extract({ left: 0, top: 0, width, height: Math.round(height * (1 - coupe)) }).png().toBuffer();
        }
        const chemin = join(dest, img.filename);
        writeFileSync(chemin, out);
        fichiers.push(relative(RACINE, chemin).replaceAll("\\", "/"));
      }
      return `${fichiers.length} image(s) :\n${fichiers.join("\n")}`;
    },
  },
};

// --- Protocole MCP (JSON-RPC sur l'entrée et la sortie standard, un message par ligne) ---
const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const envoyer = (msg) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...msg })}\n`);

async function traiter(msg) {
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  try {
    if (method === "initialize") {
      const v = VERSIONS.includes(params?.protocolVersion) ? params.protocolVersion : VERSIONS[0];
      return envoyer({ id, result: { protocolVersion: v, capabilities: { tools: {} }, serverInfo: { name: "comfyui-forge", version: "1.0.0" } } });
    }
    if (method === "ping") return envoyer({ id, result: {} });
    if (method === "tools/list") return envoyer({ id, result: { tools: Object.entries(OUTILS).map(([name, o]) => ({ name, description: o.description, inputSchema: o.inputSchema })) } });
    if (method === "tools/call") {
      const outil = OUTILS[params?.name];
      if (!outil) return envoyer({ id, error: { code: -32602, message: `Outil inconnu : ${params?.name}` } });
      try {
        const text = await outil.run(params.arguments ?? {});
        return envoyer({ id, result: { content: [{ type: "text", text }] } });
      } catch (err) {
        return envoyer({ id, result: { content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }], isError: true } });
      }
    }
    envoyer({ id, error: { code: -32601, message: `Méthode inconnue : ${method}` } });
  } catch (err) {
    envoyer({ id, error: { code: -32603, message: err instanceof Error ? err.message : String(err) } });
  }
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return envoyer({ id: null, error: { code: -32700, message: "JSON illisible" } });
  }
  void traiter(msg);
});
