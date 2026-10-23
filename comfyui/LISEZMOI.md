# Illustrations avec ComfyUI

Les illustrations des livres sont peintes par Flux Schnell sur le PC du MJ.

1. Démarre ComfyUI (Pinokio). Le modèle attendu est `flux1-schnell-fp8.safetensors` dans `models/checkpoints`.
2. Sur ton PC, dans le dossier du projet : `node comfyui/generer.mjs comfyui/prompts-maquette.json`
   (ajoute l'adresse de ComfyUI en second argument si Pinokio n'utilise pas `http://127.0.0.1:8188`).
3. Chaque prompt donne 4 variantes dans `ComfyUI/output/aubreterre/`. Garde la meilleure, renomme-la
   `<id>.png` (par exemple `couverture.png`) et pose-la dans `content/aubreterre/illustrations/`.
4. `npm run livre` refait le PDF avec tes images à la place des cadres d'attente.

`prompts-bestiaire.json` (dans les fichiers du projet) contient un prompt par créature du bestiaire.

## Agrandir pour l'impression (300 dpi)

1. Télécharge `RealESRGAN_x4plus.pth` (https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth, licence BSD : usage commercial permis) dans `ComfyUI/models/upscale_models`, puis redémarre ComfyUI.
2. `npm install`, puis `node comfyui/agrandir.mjs` : les images agrandies vont dans `content/aubreterre/illustrations-hd` (hors Git, trop lourdes).
3. `npm run livres:impression` : les trois livres en version imprimeur dans `dist-livre-impression`.
