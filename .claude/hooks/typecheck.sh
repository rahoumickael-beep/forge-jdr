#!/usr/bin/env bash
# Après chaque modification d'un fichier TypeScript, vérifie les types.
# Code de sortie 2 : Claude voit les erreurs et les corrige tout de suite.
input=$(cat)
case "$input" in
  *.ts\"*|*.tsx\"*) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.."
[ -d node_modules ] || exit 0
out=$(npx tsc --noEmit -p tsconfig.json 2>&1)
if [ $? -ne 0 ]; then
  echo "Erreurs TypeScript à corriger :" >&2
  echo "$out" | head -40 >&2
  exit 2
fi
exit 0
