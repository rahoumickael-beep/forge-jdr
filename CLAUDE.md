# Forge JdR

Table de jeu de rôle en ligne pour Mickael et ses amis (4 joueurs + un MJ, vocal sur Discord).
Le MJ génère scénarios, personnages, rencontres et cartes dans le genre de son choix ; chaque joueur déplace son pion depuis chez lui en temps réel.
Ambition : qualité d'un jeu vendu en boutique (livres A4 illustrés, mondes profonds, table immersive).

Mickael écrit en français : interface, textes de jeu, commentaires et messages de commit en français.
Pour tout choix de goût ou de direction, propose-lui 3 options A/B/C avec ta recommandation.
Lis `docs/journal-de-production.md` en début de session (court : choix de Mickael, état, points ouverts). Tiens-le court : le détail d’une étape finie va dans `docs/journal-archives-2026-10.md`, à ne lire qu’en cas de doute.

## Organisation
- `shared/` : code commun client/serveur. Types (`types.ts`), genres (`genres.ts`), charte graphique par genre (`charte.ts`), règles (`rules.ts`, `origins.ts`), bestiaire (`bestiary.ts`), bibliothèque de scénarios (`library.ts`), combat (`combat.ts`), ligne de vue (`vision.ts`), générateurs à graine (`generators.ts`, `maps.ts`), dés (`dice.ts`), IA (`ai.ts`), mémoire de campagne et préparation des séances (`campagne.ts`). Canon de chaque monde : `shared/canon/` (`fantasy.ts` pour Aubreterre ; `index.ts` vérifie noms, dates et anachronismes ; `shared/canon.test.ts` l'applique à tout le contenu).
- `server/` : Express + Socket.IO. `rooms.ts` garde les parties en mémoire, les sauve dans `data/<CODE>.json`, filtre ce que chaque joueur voit (`viewFor`) et contrôle les imports (`sanitizeImport`). `index.ts` contient toutes les actions temps réel. `rooms.test.ts` prouve qu'aucun secret ne part chez un joueur.
- Frontière MJ / joueurs : le code des joueurs n'importe jamais `bestiary`, `library`, `canon`, `generators`, `idees`, `campagne` ou `cartes` (valeurs). Le code du MJ passe par `client/src/components/mj.tsx`, chargé à part et servi seulement avec la clé du MJ (`server/acces-mj.ts`). `npm run build && npm run verifier-secrets` le contrôle.
- `client/` : React + Vite. `store.ts`, `components/MapCanvas.tsx` (carte, rendu à deux vitesses), rendu par type dans `mapDungeon.ts`, `mapCave.ts`, `mapNature.ts`, `mapVillage.ts` (outils communs `mapCommon.ts`, `mapInk.ts`, pions-figurines et brouillard `mapTokens.ts` ; vignettes peintes dans `client/public/pions/`, refaites par `node scripts/vignettes-figurines.mjs --refaire`), `GmPanels.tsx`, `PlayerPanels.tsx`, `CharacterCreator.tsx`, `CombatIntro.tsx`, `CampagnePanel.tsx` (onglets Campagne du MJ et Chronique des joueurs), `InitiativeFrieze.tsx`, `Rulebook.tsx`, `Sheets.tsx`. Thèmes : `themes.css` (doit concorder avec `charte.ts`, un test le vérifie).
- `content/<monde>/` : lore, chapitres des livres en Markdown, illustrations. Aubreterre (fantasy) est la référence de qualité.
- `scripts/livres/` : fabrication des trois livres PDF. `comfyui/` : lots d'illustrations Flux, règles des prompts (`regles-flux.json`), serveur MCP (`mcp-comfyui.mjs`), agrandissement.

## Règles du projet
- Règles inspirées de D&D 5e, limitées au SRD 5.1/5.2 (CC-BY 4.0, crédité) pour pouvoir vendre : 6 caractéristiques (noms adaptés au genre), modificateur `(valeur-10)/2`, CA, PV, initiative au d20, cases de 1,5 m, niveaux 1 à 20.
- Le serveur est l'autorité : toute action passe par un événement Socket.IO avec vérification des droits (MJ, ou propriétaire du pion ou de la fiche). Jamais de secret du MJ dans `viewFor` côté joueur ; tout nouveau champ secret est filtré et testé.
- Cohérence : tout contenu généré (scénario, PNJ, carte, rencontre, prompt d'image, texte de livre) s'appuie sur le canon du monde ; un nom absent du canon est une erreur.
- L'IA est optionnelle. LM Studio est appelé **depuis le navigateur du MJ** (`client/src/ai.ts`, `localhost:1234`) ; Claude passe par `/api/claude` si `ANTHROPIC_API_KEY` est défini. Sans IA, tout marche avec les générateurs, qui complètent aussi une réponse IA incomplète (`toScenario`, `toCharacter`).
- Pas de chat texte : le vocal se fait sur Discord. Le journal sert aux dés, à la narration et aux événements.
- Design et écriture : skills `style-visuel`, `ecran-immersif` et `ecrire-scenario`. Rien ne doit avoir l'air générique ou écrit par une IA.

## Illustrations (ComfyUI, Flux Schnell)
- ComfyUI tourne sur le PC de Mickael (Pinokio, `http://127.0.0.1:8188`, `flux1-schnell-fp8`, 4 étapes, cfg 1). Ajouter des tâches seulement : ne jamais vider la file ni arrêter ce qui tourne.
- Serveur MCP `comfyui` : `comfyui_etat`, `comfyui_mettre_en_file`, `comfyui_suivre`, `comfyui_recuperer` (images dans `comfyui/sorties/`, bas recadré de 9 %). Skill `peindre-avec-flux`.
- Prompts : jamais de négation (Flux dessine ce qu'on nie), la lumière en premier, le style vient de `charte.ts`. Une lumière par famille de créatures. Règles dans `comfyui/regles-flux.json`, appliquées par les tests, le hook `prompts-flux` et le serveur MCP.
- Fantasy : peinture à l'huile, monde préindustriel, aucun objet moderne.
- Seule la charte fantasy est validée ; les 9 autres sont provisoires jusqu'au choix de Mickael.

## Économie de tokens (abonnement Pro : Mickael a vu la moitié de sa limite partir en une nuit)
- Modèle du projet : Sonnet (`.claude/settings.json`). Opus seulement sur demande (`/model opus`) pour le code difficile ; revenir ensuite à Sonnet.
- Pas de Workflow ni de lot de plus de 3 sous-agents sans l’accord de Mickael, avec une estimation du coût. Sous-agents : Haiku pour vérifier, Sonnet pour écrire ; jamais Opus.
- Lire des morceaux de fichiers (`grep -n`, `sed -n`), pas des fichiers entiers ; ne jamais relire un fichier déjà lu ou qu’on vient de modifier.
- Sorties des commandes filtrées : `npm test 2>&1 | tail -20`, build et playtest avec `| tail`. Le hook de fin lance déjà les tests : ne pas les relancer à la main juste avant.
- Une relecture par contenu (pas trois en parallèle) sauf livre destiné à l’impression.
- Mickael absent (nuit) : finir l’étape en cours, committer, s’arrêter. Pas de travail « en attendant » qui dépend de ses choix.

## Outillage Claude Code
- Sous-agents (`.claude/agents/`) :
  - `model: haiku` : `verif-prompts`, `verif-canon`, `relecteur-ortho`, `resume-tests` ;
  - `model: sonnet` : `fiches-creatures`, `relecteur-lore`, `relecteur-regles` ;
  - session principale : architecture, conception des mondes, arbitrages. Toujours vérifier le travail d'un sous-agent avant de l'intégrer.
- Skills (`.claude/skills/`) : `batir-un-monde`, `verifier-coherence`, `peindre-avec-flux`, `concevoir-rencontre`, `fabriquer-livres`, `ecran-immersif`, `ecrire-scenario`, `style-visuel`, `ajouter-genre`, `tester-partie`.
- Hooks en Node (`.claude/hooks/`, marchent sous Windows) :
  - installation des dépendances au démarrage ;
  - refus d'un prompt Flux fautif avant écriture ;
  - contrôle des types après chaque modification ;
  - `npm test` en fin de tâche si du code a changé.
- Ne jamais arrêter les processus node de Mickael (`npm run dev` peut tourner) : arrêter un processus seulement par son PID ou son port.

## Commandes
- `npm run dev` : serveur (3001) + client (5173) avec rechargement.
- `npm run typecheck`, `npm test` : avant chaque commit.
- `npm run build && npm run playtest` : partie automatique MJ + joueur (skill `tester-partie`), avant de livrer une étape d'interface.
- `node scripts/apercu-cartes.mjs <dossier> <genre>` : vraie table sur chaque type de carte, avec contrôle de fuite du brouillard.
- `npm run livres` / `npm run livres:impression` : les trois livres PDF (écran / imprimeur 300 dpi).
- `npm run build && npm start` : version de production sur un seul port.
- Mickael est sous Windows : hooks en Node, attention aux chemins et aux fins de ligne CRLF ; dans un heredoc Bash, `\\` devient `\` (écrire les fichiers qui contiennent des barres obliques inverses avec l'outil d'écriture).
