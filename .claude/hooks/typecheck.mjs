// Après chaque modification d'un fichier TypeScript, vérifie les types.
// Code de sortie 2 : Claude voit les erreurs et les corrige tout de suite.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const file = String(input.tool_input?.file_path ?? "");
if (!/\.tsx?$/.test(file)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
if (!existsSync(tsc)) process.exit(0);
try {
  execFileSync(process.execPath, [tsc, "--noEmit", "-p", "tsconfig.json"], { cwd: root, encoding: "utf8", stdio: "pipe" });
} catch (err) {
  const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.split("\n").slice(0, 40).join("\n");
  console.error(`Erreurs TypeScript à corriger :\n${out}`);
  process.exit(2);
}
