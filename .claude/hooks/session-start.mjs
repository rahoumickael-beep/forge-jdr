// Au démarrage d'une session : installe les dépendances si elles manquent.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!existsSync(join(root, "node_modules"))) {
  try {
    execSync("npm install --no-audit --no-fund", { cwd: root, stdio: "ignore", shell: true });
    console.log("Dépendances installées.");
  } catch {
    console.log("npm install a échoué : lance-le à la main.");
  }
}
