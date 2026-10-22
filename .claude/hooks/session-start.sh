#!/usr/bin/env bash
# Installe les dépendances au démarrage d'une session si elles manquent.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.."
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund >/dev/null 2>&1 && echo "Dépendances installées."
fi
exit 0
