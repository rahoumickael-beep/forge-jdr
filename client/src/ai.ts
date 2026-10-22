// Génération par IA côté MJ.
// - LM Studio : le navigateur du MJ appelle directement le serveur local (API compatible OpenAI, port 1234).
// - Claude : passe par notre serveur, qui garde la clé API.
// - Aucune : on utilise les générateurs aléatoires.
import { buildPrompt, extractJson, type AiRequest } from "../../shared/ai";
import { gmKeyFor } from "./store";

export type Provider = "aucune" | "lmstudio" | "claude";

export interface AiSettings {
  provider: Provider;
  lmUrl: string;
  lmModel: string;
}

const DEFAULTS: AiSettings = { provider: "aucune", lmUrl: "http://localhost:1234/v1", lmModel: "" };

export function loadAiSettings(): AiSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("forge:ai") || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function saveAiSettings(s: AiSettings) {
  try {
    localStorage.setItem("forge:ai", JSON.stringify(s));
  } catch {
    /* tant pis, réglage non mémorisé */
  }
}

/** Liste les modèles chargés dans LM Studio. */
export async function listLmModels(url: string): Promise<string[]> {
  const res = await fetch(`${url.replace(/\/$/, "")}/models`);
  if (!res.ok) throw new Error(`LM Studio répond ${res.status}.`);
  const data = await res.json();
  return (data?.data ?? []).map((m: { id: string }) => m.id);
}

async function callLmStudio(s: AiSettings, system: string, user: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${s.lmUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: s.lmModel || undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 4000,
        stream: false,
      }),
    });
  } catch {
    throw new Error("Impossible de joindre LM Studio. Vérifie que le serveur local est démarré et que CORS est activé.");
  }
  if (!res.ok) throw new Error(`LM Studio a répondu ${res.status} : ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callClaude(code: string, system: string, user: string): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, gmKey: gmKeyFor(code), system, user }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data.text;
}

/** Envoie la demande au fournisseur choisi et renvoie l'objet JSON produit. */
export async function generateAi(req: AiRequest, settings: AiSettings, roomCode: string): Promise<unknown> {
  const { system, user } = buildPrompt(req);
  const text = settings.provider === "claude" ? await callClaude(roomCode, system, user) : await callLmStudio(settings, system, user);
  return extractJson(text);
}
