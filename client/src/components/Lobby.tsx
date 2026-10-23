import { useState } from "react";
import { GENRES, TONS } from "../../../shared/genres";
import type { GenreId, Ton } from "../../../shared/types";
import { gmKeyFor, lastSession, saveSession, send, useStore } from "../store";

export function Lobby() {
  const { connected } = useStore();
  const last = lastSession();
  const [name, setName] = useState(last?.name ?? "");
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get("partie")?.toUpperCase() ?? "");
  const [campaign, setCampaign] = useState("");
  const [genre, setGenre] = useState<GenreId>("fantasy");
  const [ton, setTon] = useState<Ton>("epique");
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await send("room:create", { name: campaign || "Nouvelle campagne", genre, ton, level, gmName: name || "Maître du jeu" });
    setBusy(false);
    if (res.ok) saveSession({ code: String(res.code), name, playerId: String(res.playerId), gmKey: String(res.gmKey) });
  }

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    const prev = last?.code === c ? last : null;
    const res = await send("room:join", { code: c, name: name || "Aventurier", playerId: prev?.playerId, gmKey: gmKeyFor(c) });
    setBusy(false);
    if (res.ok) saveSession({ code: c, name, playerId: String(res.playerId), gmKey: gmKeyFor(c) });
  }

  return (
    <main className="lobby themed-bg" data-genre={genre}>
      <div className="lobby-inner">
        <header className="lobby-title">
          <h1 className="gilded">Forge JdR</h1>
          <div className="ornament" aria-hidden="true" />
          <p>Prépare ta partie, ouvre la table et envoie le code à tes amis. Chacun déplace son pion depuis chez lui.</p>
        </header>

        <label className="field" style={{ maxWidth: 360, margin: "0 auto", width: "100%" }}>
          <span>Ton nom à la table</span>
          <input id="pseudo" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Mickael" maxLength={40} />
        </label>

        <div className="lobby-cards">
          <section className="paper stack">
            <div>
              <h2>Rejoindre une partie</h2>
              <p className="muted small">Le maître du jeu t'a donné un code de 5 lettres.</p>
            </div>
            <label className="field">
              <span>Code de la partie</span>
              <input
                id="code"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="K7QPA"
                maxLength={5}
                style={{ fontFamily: "var(--mono)", letterSpacing: ".3em", fontSize: 20 }}
                onKeyDown={(e) => e.key === "Enter" && join()}
              />
            </label>
            <button className="btn primary" onClick={join} disabled={!connected || busy || code.length < 5}>
              S'asseoir à la table
            </button>
            {last && last.code !== code && (
              <button className="btn" onClick={() => setCode(last.code)}>
                Reprendre ma dernière partie ({last.code})
              </button>
            )}
          </section>

          <section className="paper stack">
            <div>
              <h2>Créer une partie</h2>
              <p className="muted small">Tu seras le maître du jeu. Tout reste modifiable ensuite.</p>
            </div>
            <label className="field">
              <span>Nom de la campagne</span>
              <input id="campagne" className="input" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Les Cendres de Valmer" />
            </label>
            <div className="field">
              <span>Genre</span>
              <div className="genre-grid">
                {GENRES.map((g) => (
                  <button key={g.id} type="button" className="genre-pick" aria-pressed={genre === g.id} onClick={() => setGenre(g.id)} title={g.pitch}>
                    <strong>{g.label}</strong>
                    <small>{g.pitch}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="row">
              <label className="field">
                <span>Ton</span>
                <select id="ton" className="input" value={ton} onChange={(e) => setTon(e.target.value as Ton)}>
                  {TONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Niveau de départ</span>
                <input id="niveau" className="input" type="number" min={1} max={20} value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} />
              </label>
            </div>
            <button className="btn primary" onClick={create} disabled={!connected || busy}>
              Ouvrir la table
            </button>
          </section>
        </div>
        {!connected && <p className="muted small" style={{ textAlign: "center" }}>Connexion au serveur…</p>}
      </div>
    </main>
  );
}
