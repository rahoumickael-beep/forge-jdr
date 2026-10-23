// En fin de tâche : si du code a changé, lance npm test. Si un test casse, Claude reprend la main pour corriger.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
if (input.stop_hook_active) process.exit(0); // déjà relancé une fois : on n'insiste pas

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8", stdio: "pipe", shell: true });
let changed = "";
try {
  changed = run("git status --porcelain -- shared server client scripts comfyui/regles-flux.json");
} catch {
  process.exit(0);
}
if (!/\.(tsx?|mjs|json)\s*$/m.test(changed)) process.exit(0);

try {
  run("npm test");
} catch (err) {
  const out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  const fails = out.split("\n").filter((l) => /✖|not ok|AssertionError|Error:|expected|actual/i.test(l)).slice(0, 40);
  console.error(`npm test échoue après tes modifications :\n${fails.join("\n") || out.slice(-3000)}`);
  process.exit(2);
}
