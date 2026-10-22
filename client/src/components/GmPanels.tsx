// Panneaux du maître du jeu.
import { ABILITY_METHODS } from "../../../shared/origins";
import { DEATH_RULES } from "../../../shared/rules";
import { DEFAULT_VISION } from "../../../shared/vision";
import { useEffect, useMemo, useState } from "react";
import { toCharacter, toScenario, type AiKind } from "../../../shared/ai";
import { GENRES, TONS } from "../../../shared/genres";
import { generateCharacter, generateEncounter, generateLoot, generateScenario, modifier } from "../../../shared/generators";
import { generateMap } from "../../../shared/maps";
import { randomSeed } from "../../../shared/random";
import type { Character, Encounter, GameMap, GenreId, MapKind, RoomView, Scenario, Ton, Token } from "../../../shared/types";
import { generateAi, listLmModels, loadAiSettings, saveAiSettings, type AiSettings } from "../ai";
import { tokenForCharacter, tokensForEncounter } from "../placement";
import { send, toast } from "../store";
import { CharacterSheet, EncounterBlock, ScenarioSheet } from "./Sheets";

type GenKind = "scenario" | "personnage" | "pnj" | "rencontre" | "butin" | "description";

const GEN_LABELS: Record<GenKind, string> = {
  scenario: "Scénario",
  personnage: "Personnage joueur",
  pnj: "PNJ",
  rencontre: "Rencontre",
  butin: "Butin",
  description: "Description à lire",
};

type Result =
  | { kind: "scenario"; value: Scenario }
  | { kind: "personnage" | "pnj"; value: Character }
  | { kind: "rencontre"; value: Encounter }
  | { kind: "butin"; value: string[] }
  | { kind: "description"; value: string };

export function GeneratePanel({ room }: { room: RoomView }) {
  const [kind, setKind] = useState<GenKind>("scenario");
  const [genre, setGenre] = useState<GenreId>(room.genre);
  const [ton, setTon] = useState<Ton>(room.ton);
  const [level, setLevel] = useState(room.level);
  const [players, setPlayers] = useState(Math.max(1, room.players.filter((p) => !p.isGM).length) || 4);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const ai = loadAiSettings();

  function randomly() {
    const seed = randomSeed();
    switch (kind) {
      case "scenario":
        return setResult({ kind, value: generateScenario({ genre, ton, level, players, seed }) });
      case "personnage":
      case "pnj":
        return setResult({ kind, value: generateCharacter({ genre, level, seed, npc: kind === "pnj" }) });
      case "rencontre":
        return setResult({ kind, value: generateEncounter(genre, level, players, seed) });
      case "butin":
        return setResult({ kind, value: generateLoot(genre, level, seed) });
      case "description":
        return setResult({ kind, value: "Choisis l'IA dans Réglages pour écrire des descriptions sur mesure. En attendant : décris un bruit, une odeur, et ce qui bouge dans l'ombre." });
    }
  }

  async function withAi() {
    if (kind === "rencontre" || kind === "butin") return randomly();
    setBusy(true);
    try {
      const req = { kind: kind as AiKind, genre, ton, level, players, prompt };
      const raw = (await generateAi(req, ai, room.code)) as any;
      if (kind === "scenario") setResult({ kind, value: toScenario(raw, req) });
      else if (kind === "personnage" || kind === "pnj") setResult({ kind, value: toCharacter(raw, req) });
      else setResult({ kind: "description", value: String(raw?.text ?? "") });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const placeEncounter = (e: Encounter) => {
    if (!room.map) return toast("Génère d'abord une carte.");
    void send("token:bulk", tokensForEncounter(room, e)).then((r) => r.ok && toast("Ennemis placés, cachés aux joueurs."));
  };

  return (
    <div className="stack">
      <h3>Générer</h3>
      <div className="row">
        <label className="field">
          <span>Quoi</span>
          <select id="gen-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as GenKind)}>
            {Object.entries(GEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Genre</span>
          <select id="gen-genre" className="input" value={genre} onChange={(e) => setGenre(e.target.value as GenreId)}>
            {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label className="field">
          <span>Ton</span>
          <select id="gen-ton" className="input" value={ton} onChange={(e) => setTon(e.target.value as Ton)}>
            {TONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Niveau</span>
          <input id="gen-level" className="input" type="number" min={1} max={20} value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} />
        </label>
        <label className="field">
          <span>Joueurs</span>
          <input id="gen-players" className="input" type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value) || 1)} />
        </label>
      </div>
      {ai.provider !== "aucune" && (
        <label className="field">
          <span>Consigne pour l'IA (facultatif)</span>
          <textarea id="gen-prompt" className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Une vengeance dans un monastère de montagne, avec un traître parmi les moines" />
        </label>
      )}
      <div className="row">
        <button className="btn" onClick={randomly}>Tirer au hasard</button>
        {ai.provider !== "aucune" && (
          <button className="btn primary" onClick={withAi} disabled={busy}>
            {busy ? <><span className="spinner" /> L'IA écrit…</> : `Écrire avec ${ai.provider === "lmstudio" ? "LM Studio" : "Claude"}`}
          </button>
        )}
      </div>
      {ai.provider === "aucune" && <p className="small muted">Astuce : branche LM Studio dans Réglages pour des textes écrits sur mesure.</p>}

      {result && (
        <div className="section stack">
          {result.kind === "scenario" && (
            <ScenarioSheet
              s={result.value}
              onPlaceEncounter={placeEncounter}
              actions={<button className="btn small primary" onClick={() => send("scenario:add", result.value).then((r) => r.ok && toast("Scénario rangé dans l'onglet Scénarios."))}>Garder</button>}
            />
          )}
          {(result.kind === "personnage" || result.kind === "pnj") && (
            <>
              <CharacterSheet c={result.value} editable={false} />
              <div className="row">
                <button className="btn small primary" onClick={() => send("character:upsert", result.value).then((r) => r.ok && toast("Ajouté aux personnages."))}>Garder</button>
                <button
                  className="btn small"
                  onClick={async () => {
                    if (!room.map) return toast("Génère d'abord une carte.");
                    await send("character:upsert", result.value);
                    await send("token:bulk", [tokenForCharacter(room, result.value, result.kind === "pnj" ? "#6b5b3e" : "#3d6b8a")]);
                  }}
                >
                  Garder et placer
                </button>
              </div>
            </>
          )}
          {result.kind === "rencontre" && (
            <div className="paper sheet prose small">
              <EncounterBlock e={result.value} onPlace={() => placeEncounter(result.value)} />
            </div>
          )}
          {result.kind === "butin" && (
            <div className="paper sheet small">
              <ul>{result.value.map((l, i) => <li key={i}>{l}</li>)}</ul>
              <button className="btn small" onClick={() => send("narrate", { text: `Butin : ${result.value.join(", ")}.` })}>Annoncer aux joueurs</button>
            </div>
          )}
          {result.kind === "description" && (
            <div className="paper sheet small">
              <p style={{ margin: 0 }}>{result.value}</p>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn small" onClick={() => send("narrate", { text: result.value })}>Lire à la table</button>
                <button className="btn small" onClick={() => send("scene:set", { text: result.value.slice(0, 300) })}>Afficher sur la carte</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MAP_KINDS: { id: MapKind; label: string }[] = [
  { id: "donjon", label: "Donjon" },
  { id: "caverne", label: "Cavernes" },
  { id: "nature", label: "Extérieur" },
  { id: "village", label: "Village" },
];

export function MapPanel({ room }: { room: RoomView }) {
  const [kind, setKind] = useState<MapKind>("donjon");
  const [size, setSize] = useState(36);
  const [seed, setSeed] = useState(randomSeed());
  const [name, setName] = useState("");
  const preview: GameMap = useMemo(() => generateMap({ kind, width: Math.round(size * 1.3), height: size, seed, name: name || undefined }), [kind, size, seed, name]);

  return (
    <div className="stack">
      <h3>Carte</h3>
      <div className="row">
        <label className="field">
          <span>Type</span>
          <select id="map-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as MapKind)}>
            {MAP_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Taille</span>
          <select id="map-size" className="input" value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={20}>Petite</option>
            <option value={36}>Moyenne</option>
            <option value={50}>Grande</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Nom affiché</span>
        <input id="map-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={preview.name} />
      </label>
      <MiniMap map={preview} room={room} />
      <div className="row">
        <button className="btn" onClick={() => setSeed(randomSeed())}>Autre tirage</button>
        <button className="btn primary" onClick={() => send("map:set", { map: preview, keepTokens: false }).then((r) => r.ok && toast("Carte posée sur la table."))}>
          Poser sur la table
        </button>
      </div>
      <p className="small muted">Graine {seed} : note-la pour retrouver exactement cette carte.</p>

      <div className="section stack">
        <h3>Brouillard de guerre</h3>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={room.fogEnabled} onChange={(e) => send("fog:enabled", { enabled: e.target.checked })} /> Activer le brouillard
        </label>
        <div className="row">
          <button className="btn small" onClick={() => send("fog:all", { hidden: false })}>Tout révéler</button>
          <button className="btn small" onClick={() => send("fog:all", { hidden: true })}>Tout cacher</button>
        </div>
        <label className="field">
          <span>Ce que voient les joueurs</span>
          <select id="vision-mode" className="input" value={room.visionMode} onChange={(e) => send("settings:set", { visionMode: e.target.value })}>
            <option value="dynamique">Ligne de vue de leurs pions</option>
            <option value="manuel">Ce que je révèle au pinceau</option>
          </select>
        </label>
        {room.visionMode === "dynamique" ? (
          <>
            <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={room.sharedVision} onChange={(e) => send("settings:set", { sharedVision: e.target.checked })} /> Vision partagée (chacun voit ce que voit le groupe)
            </label>
            <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={room.mapKnown} onChange={(e) => send("settings:set", { mapKnown: e.target.checked })} /> Donner la carte des lieux (plan visible, sans les créatures)
            </label>
            <p className="small muted">Les murs bloquent la vue. Les zones déjà explorées restent visibles en pénombre. La portée de vision se règle par pion dans l'onglet Pions.</p>
          </>
        ) : (
          <p className="small muted">Utilise les pinceaux en bas à gauche de la carte pour révéler les salles au fur et à mesure.</p>
        )}
      </div>
    </div>
  );
}

function MiniMap({ map, room }: { map: GameMap; room: RoomView }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const cv = document.createElement("canvas");
    const s = 4;
    cv.width = map.width * s;
    cv.height = map.height * s;
    const g = cv.getContext("2d")!;
    const theme = GENRES.find((x) => x.id === room.genre)!.theme;
    const colors = [theme.background, theme.floor, theme.wall, theme.water, theme.vegetation, theme.road, theme.door];
    map.tiles.forEach((t, i) => {
      g.fillStyle = colors[t];
      g.fillRect((i % map.width) * s, Math.floor(i / map.width) * s, s, s);
    });
    setUrl(cv.toDataURL());
  }, [map, room.genre]);
  return url ? <img src={url} alt={`Aperçu : ${map.name}`} style={{ width: "100%", imageRendering: "pixelated", borderRadius: 3, border: "1px solid #ffffff20" }} /> : null;
}

const TOKEN_COLORS = ["#7a2a22", "#3d6b8a", "#6b5b3e", "#4f7a4a", "#5b3a6b", "#8a6a1f", "#2f2f2f", "#a34f7a"];

export function TokensPanel({ room, selectedId, onSelect }: { room: RoomView; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Token["kind"]>("monstre");
  const [hp, setHp] = useState(10);
  const [color, setColor] = useState(TOKEN_COLORS[0]);
  const update = (t: Token, patch: Partial<Token>) => send("token:upsert", { ...t, ...patch });

  return (
    <div className="stack">
      <h3>Pions</h3>
      <div className="row">
        <label className="field" style={{ flexBasis: "100%" }}>
          <span>Nouveau pion</span>
          <input id="tok-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Garde du pont" />
        </label>
        <label className="field">
          <span>Type</span>
          <select id="tok-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as Token["kind"])}>
            <option value="monstre">Monstre</option>
            <option value="pnj">PNJ</option>
            <option value="objet">Objet / repère</option>
            <option value="joueur">Joueur</option>
          </select>
        </label>
        <label className="field">
          <span>PV</span>
          <input id="tok-hp" className="input" type="number" min={0} value={hp} onChange={(e) => setHp(Number(e.target.value) || 0)} />
        </label>
      </div>
      <div className="row" style={{ alignItems: "center" }}>
        {TOKEN_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`Couleur ${c}`} className="token-dot" style={{ background: c, cursor: "pointer", outline: color === c ? "2px solid var(--brass)" : "none" }} />
        ))}
      </div>
      <button
        className="btn"
        disabled={!room.map}
        onClick={() => {
          const map = room.map!;
          void send("token:upsert", { id: "", name: name || "Pion", kind, color, x: Math.floor(map.width / 2), y: Math.floor(map.height / 2), hp: hp || undefined, hpMax: hp || undefined, hidden: kind === "monstre" });
          setName("");
        }}
      >
        Ajouter au centre de la carte
      </button>

      <div className="section">
        {room.tokens.length === 0 && <p className="small muted">Aucun pion pour l'instant.</p>}
        {room.tokens.map((t) => (
          <div key={t.id} className="token-row" style={{ background: t.id === selectedId ? "#c9a34e18" : undefined }}>
            <span className="token-dot" style={{ background: t.color }} />
            <button className="btn ghost small name" style={{ justifyContent: "flex-start" }} onClick={() => onSelect(t.id)} title="Sélectionner (flèches du clavier pour déplacer)">
              {t.name}
              {t.hpMax ? ` · ${t.hp ?? t.hpMax}/${t.hpMax}` : ""}
            </button>
            {t.hpMax ? (
              <>
                <button className="btn small" onClick={() => update(t, { hp: Math.max(0, (t.hp ?? t.hpMax!) - 1) })} aria-label="Retirer 1 PV">−</button>
                <button className="btn small" onClick={() => update(t, { hp: Math.min(t.hpMax!, (t.hp ?? 0) + 1) })} aria-label="Ajouter 1 PV">+</button>
              </>
            ) : null}
            {t.kind === "joueur" && room.visionMode === "dynamique" && (
              <select className="input small" style={{ width: "auto" }} value={t.vision ?? DEFAULT_VISION} onChange={(e) => update(t, { vision: Number(e.target.value) })} title="Portée de vision" aria-label={`Vision de ${t.name}`}>
                <option value={2}>3 m</option>
                <option value={4}>6 m</option>
                <option value={6}>9 m</option>
                <option value={10}>15 m</option>
                <option value={16}>24 m</option>
                <option value={40}>Illimitée</option>
              </select>
            )}
            <button className="btn small" onClick={() => update(t, { hidden: !t.hidden })} title={t.hidden ? "Montrer aux joueurs" : "Cacher aux joueurs"}>
              {t.hidden ? "Caché" : "Visible"}
            </button>
            <button className="btn small danger" onClick={() => send("token:remove", t.id)} aria-label={`Supprimer ${t.name}`}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CombatPanel({ room }: { room: RoomView }) {
  const { entries, turn, round } = room.initiative;
  function rollAll() {
    const list = room.tokens
      .filter((t) => t.kind !== "objet")
      .map((t) => {
        const c = room.characters.find((x) => x.id === t.characterId);
        const dex = c ? modifier(Object.values(c.stats)[1] ?? 10) : 0;
        return { tokenId: t.id, name: t.name, value: Math.floor(Math.random() * 20) + 1 + dex };
      });
    void send("initiative:set", { entries: list });
    void send("narrate", { text: `Le combat commence ! Initiative : ${[...list].sort((a, b) => b.value - a.value).map((e) => `${e.name} (${e.value})`).join(", ")}.` });
  }
  return (
    <div className="stack">
      <h3>Combat</h3>
      <div className="row">
        <button className="btn primary" onClick={rollAll} disabled={!room.tokens.length}>Lancer l'initiative</button>
        <button className="btn" onClick={() => send("initiative:set", { entries: [] })} disabled={!entries.length}>Fin du combat</button>
      </div>
      {entries.length > 0 && (
        <>
          <p className="small muted">Round {round}</p>
          <ol className="init-list">
            {entries.map((e, i) => (
              <li key={i} className={i === turn ? "current" : ""}>
                <span className="val">{e.value}</span>
                <span>{e.name}</span>
              </li>
            ))}
          </ol>
          <div className="row">
            <button className="btn" onClick={() => send("initiative:step", { delta: -1 })}>Précédent</button>
            <button className="btn primary" onClick={() => send("initiative:step", { delta: 1 })}>Tour suivant</button>
          </div>
        </>
      )}
      <div className="section stack">
        <h3>Déplacements</h3>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={room.movementLocked} onChange={(e) => send("settings:set", { movementLocked: e.target.checked })} /> Bloquer les déplacements des joueurs
        </label>
      </div>
    </div>
  );
}

export function ScenariosPanel({ room }: { room: RoomView }) {
  const place = (e: Encounter) => {
    if (!room.map) return toast("Génère d'abord une carte.");
    void send("token:bulk", tokensForEncounter(room, e));
  };
  return (
    <div className="stack">
      <h3>Scénarios</h3>
      {room.scenarios.length === 0 && <p className="small muted">Les scénarios que tu gardes depuis l'onglet Générer arrivent ici. Les joueurs ne les voient pas.</p>}
      <div className="card-list">
        {room.scenarios.map((s) => (
          <ScenarioSheet key={s.id} s={s} onPlaceEncounter={place} actions={<button className="btn small danger" onClick={() => send("scenario:remove", s.id)}>Jeter</button>} />
        ))}
      </div>
      <h3 style={{ marginTop: 12 }}>Personnages et PNJ</h3>
      <div className="card-list">
        {room.characters.map((c) => (
          <CharacterSheet
            key={c.id}
            c={c}
            editable
            onPlace={room.map && !room.tokens.some((t) => t.characterId === c.id) ? () => send("token:bulk", [tokenForCharacter(room, c, c.role ? "#6b5b3e" : "#3d6b8a")]) : undefined}
            onRemove={() => send("character:remove", c.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function NotesPanel({ room }: { room: RoomView }) {
  const [notes, setNotes] = useState(room.gmNotes ?? "");
  const [scene, setScene] = useState(room.scene);
  const [narration, setNarration] = useState("");
  const [hTitle, setHTitle] = useState("");
  const [hText, setHText] = useState("");
  useEffect(() => {
    const t = setTimeout(() => notes !== room.gmNotes && send("notes:set", { text: notes }), 800);
    return () => clearTimeout(t);
  }, [notes]);
  return (
    <div className="stack">
      <h3>Narration</h3>
      <label className="field">
        <span>Lire à la table</span>
        <textarea id="narration" className="input" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="La porte cède. Derrière, une odeur de cire froide et de fer." />
      </label>
      <button className="btn" disabled={!narration.trim()} onClick={() => send("narrate", { text: narration }).then(() => setNarration(""))}>Envoyer dans le journal</button>
      <label className="field">
        <span>Bandeau sur la carte</span>
        <input id="scene" className="input" value={scene} onChange={(e) => setScene(e.target.value)} placeholder="Nuit tombante, pluie fine" />
      </label>
      <div className="row">
        <button className="btn small" onClick={() => send("scene:set", { text: scene })}>Afficher</button>
        <button className="btn small" onClick={() => { setScene(""); void send("scene:set", { text: "" }); }}>Effacer</button>
      </div>

      <div className="section stack">
        <h3>Documents pour les joueurs</h3>
        <input id="handout-title" className="input" value={hTitle} onChange={(e) => setHTitle(e.target.value)} placeholder="Titre : Lettre trouvée sur le cadavre" />
        <textarea id="handout-text" className="input" value={hText} onChange={(e) => setHText(e.target.value)} placeholder="Texte du document" />
        <button className="btn" disabled={!hTitle.trim()} onClick={() => send("handout:add", { title: hTitle, text: hText }).then(() => { setHTitle(""); setHText(""); })}>Distribuer</button>
        {room.handouts.map((h) => (
          <div key={h.id} className="token-row">
            <span className="name">{h.title}</span>
            <button className="btn small danger" onClick={() => send("handout:remove", h.id)}>Retirer</button>
          </div>
        ))}
      </div>

      <div className="section stack">
        <h3>Notes secrètes</h3>
        <textarea id="gm-notes" className="input" style={{ minHeight: 200 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ce que les joueurs ne savent pas encore…" />
        <p className="small muted">Enregistrées automatiquement. Jamais envoyées aux joueurs.</p>
      </div>
    </div>
  );
}

export function SettingsPanel({ room }: { room: RoomView }) {
  const [ai, setAi] = useState<AiSettings>(loadAiSettings);
  const [models, setModels] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const update = (patch: Partial<AiSettings>) => {
    const next = { ...ai, ...patch };
    setAi(next);
    saveAiSettings(next);
  };
  async function test() {
    setTesting(true);
    try {
      const list = await listLmModels(ai.lmUrl);
      setModels(list);
      if (!ai.lmModel && list[0]) update({ lmModel: list[0] });
      toast(list.length ? `LM Studio répond : ${list.length} modèle(s).` : "LM Studio répond, mais aucun modèle n'est chargé.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "LM Studio ne répond pas. Vérifie que le serveur est démarré et que CORS est activé.");
    } finally {
      setTesting(false);
    }
  }
  function exportRoom() {
    const blob = new Blob([JSON.stringify(room, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${room.name.replace(/[^\w-]+/g, "_")}-${room.code}.json`;
    a.click();
  }
  async function importRoom(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const r = await send("room:import", data);
      if (r.ok) toast("Partie restaurée.");
    } catch {
      toast("Ce fichier n'est pas une sauvegarde de partie.");
    }
  }
  return (
    <div className="stack">
      <h3>Règles de la partie</h3>
      <label className="field">
        <span>Caractéristiques à la création</span>
        <select id="ability-method" className="input" value={room.abilityMethod} onChange={(e) => send("settings:set", { abilityMethod: e.target.value })}>
          {ABILITY_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Mort des personnages</span>
        <select id="death-rule" className="input" value={room.deathRule} onChange={(e) => send("settings:set", { deathRule: e.target.value })}>
          {DEATH_RULES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </label>
      <p className="small muted">{DEATH_RULES.find((d) => d.id === room.deathRule)?.text}</p>
      <h3>Joueurs</h3>
      {room.players.map((p) => (
        <div key={p.id} className="token-row">
          <span className="token-dot" style={{ background: p.color }} />
          <span className="name">{p.name}{p.isGM ? " (MJ)" : ""}</span>
          <span className={`status-dot${p.online ? "" : " off"}`} title={p.online ? "Connecté" : "Hors ligne"} />
          {!p.isGM && <button className="btn small danger" onClick={() => send("player:kick", p.id)}>Retirer</button>}
        </div>
      ))}

      <div className="section stack">
        <h3>Campagne</h3>
        <div className="row">
          <label className="field">
            <span>Genre</span>
            <select id="set-genre" className="input" value={room.genre} onChange={(e) => send("settings:set", { genre: e.target.value })}>
              {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Niveau du groupe</span>
            <input id="set-level" className="input" type="number" min={1} max={20} value={room.level} onChange={(e) => send("settings:set", { level: Number(e.target.value) || 1 })} />
          </label>
        </div>
        <div className="row">
          <button className="btn small" onClick={exportRoom}>Télécharger la sauvegarde</button>
          <label className="btn small">
            Restaurer…
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importRoom(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="section stack">
        <h3>Intelligence artificielle</h3>
        <label className="field">
          <span>Fournisseur</span>
          <select id="ai-provider" className="input" value={ai.provider} onChange={(e) => update({ provider: e.target.value as AiSettings["provider"] })}>
            <option value="aucune">Aucune (générateurs aléatoires)</option>
            <option value="lmstudio">LM Studio (sur mon ordinateur)</option>
            <option value="claude">Claude (clé API sur le serveur)</option>
          </select>
        </label>
        {ai.provider === "lmstudio" && (
          <>
            <label className="field">
              <span>Adresse du serveur LM Studio</span>
              <input id="ai-url" className="input" value={ai.lmUrl} onChange={(e) => update({ lmUrl: e.target.value })} />
            </label>
            <div className="row">
              <label className="field">
                <span>Modèle</span>
                {models.length ? (
                  <select id="ai-model" className="input" value={ai.lmModel} onChange={(e) => update({ lmModel: e.target.value })}>
                    {models.map((m) => <option key={m}>{m}</option>)}
                  </select>
                ) : (
                  <input id="ai-model" className="input" value={ai.lmModel} onChange={(e) => update({ lmModel: e.target.value })} placeholder="modèle chargé par défaut" />
                )}
              </label>
              <button className="btn" onClick={test} disabled={testing}>{testing ? "Test…" : "Tester"}</button>
            </div>
            <p className="small muted">Dans LM Studio : onglet Developer, démarre le serveur et coche « Enable CORS ». Seul ton navigateur de MJ parle à LM Studio.</p>
          </>
        )}
      </div>
    </div>
  );
}
