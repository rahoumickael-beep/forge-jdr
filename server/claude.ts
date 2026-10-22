// Génération par Claude, optionnelle : active seulement si ANTHROPIC_API_KEY est défini sur le serveur.
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function claudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function generateWithClaude(system: string, user: string): Promise<string> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude a refusé cette demande. Reformule la consigne.");
  return response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
}
