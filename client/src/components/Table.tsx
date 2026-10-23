import { useCallback, useState } from "react";
import { getGenre } from "../../../shared/genres";
import type { RoomView } from "../../../shared/types";
import { forgetSession, toast, useStore } from "../store";
import { DiceTray, Log } from "./Dice";
import { CombatIntro } from "./CombatIntro";
import { InitiativeFrieze } from "./InitiativeFrieze";
import { BestiaryPanel, CombatPanel, GeneratePanel, MapPanel, NotesPanel, ScenariosPanel, SettingsPanel, TokensPanel } from "./GmPanels";
import { MapCanvas, type MapTool } from "./MapCanvas";
import { HandoutsPanel, MyCharacterPanel, PartyPanel } from "./PlayerPanels";
import { INITIAL_NAV, Rulebook, RulebookOverlay, type BookNav } from "./Rulebook";

const GM_TABS = ["Générer", "Carte", "Pions", "Bestiaire", "Combat", "Scénarios", "Narration", "Réglages", "Règles"] as const;
const PLAYER_TABS = ["Mon perso", "Groupe", "Documents", "Règles"] as const;

export function Table({ room }: { room: RoomView }) {
  const { connected } = useStore();
  const isGM = room.you.isGM;
  const tabs: readonly string[] = isGM ? GM_TABS : PLAYER_TABS;
  const [tab, setTab] = useState<string>(isGM ? (room.map ? "Générer" : "Carte") : "Mon perso");
  const [tool, setTool] = useState<MapTool>("deplacer");
  const [brush, setBrush] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookNav, setBookNav] = useState<BookNav>(INITIAL_NAV);
  const [bookOpen, setBookOpen] = useState(false);
  const closeBook = useCallback(() => setBookOpen(false), []);

  const invite = `${location.origin}/?partie=${room.code}`;
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      toast("Lien d'invitation copié. Colle-le sur Discord !");
    } catch {
      toast(`Code de la partie : ${room.code}`);
    }
  }

  return (
    <div className="table-layout themed-bg" data-genre={room.genre}>
      <header className="topbar">
        <h1 className="gilded">{room.name}</h1>
        <span className="muted small">{getGenre(room.genre).label} · niveau {room.level}</span>
        <button className="code-chip" onClick={copyInvite} title="Copier le lien d'invitation">{room.code}</button>
        {!connected && <span className="small" style={{ color: "#f0b2a8" }}>Connexion perdue, reconnexion…</span>}
        <div className="players">
          {room.players.map((p) => (
            <span key={p.id} className={`player-chip${p.online ? "" : " offline"}`} title={p.online ? "Connecté" : "Hors ligne"}>
              <i style={{ background: p.color }} />
              {p.name}
              {p.isGM ? " · MJ" : ""}
            </span>
          ))}
        </div>
        <button className="btn small ghost" onClick={forgetSession}>Quitter</button>
      </header>

      <div className="table-main">
        <div style={{ position: "relative", minHeight: 0, display: "grid" }}>
          <MapCanvas room={room} tool={tool} brush={brush} selectedId={selectedId} onSelect={setSelectedId} />
          <InitiativeFrieze room={room} />
          {isGM && room.map && (
            <div className="map-tools" role="toolbar" aria-label="Outils de carte">
              <button className={`btn small${tool === "deplacer" ? " active" : ""}`} onClick={() => setTool("deplacer")}>Déplacer</button>
              <button className={`btn small${tool === "reveler" ? " active" : ""}`} onClick={() => setTool("reveler")}>Révéler</button>
              <button className={`btn small${tool === "cacher" ? " active" : ""}`} onClick={() => setTool("cacher")}>Cacher</button>
              {tool !== "deplacer" && (
                <label className="small" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  Pinceau
                  <input type="range" min={1} max={8} value={brush} onChange={(e) => setBrush(Number(e.target.value))} aria-label="Taille du pinceau" />
                </label>
              )}
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t} role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="panel" role="tabpanel">
            {tab === "Générer" && <GeneratePanel room={room} />}
            {tab === "Carte" && <MapPanel room={room} />}
            {tab === "Pions" && <TokensPanel room={room} selectedId={selectedId} onSelect={setSelectedId} />}
            {tab === "Bestiaire" && <BestiaryPanel room={room} />}
            {tab === "Combat" && <CombatPanel room={room} />}
            {tab === "Scénarios" && <ScenariosPanel room={room} />}
            {tab === "Narration" && <NotesPanel room={room} />}
            {tab === "Réglages" && <SettingsPanel room={room} />}
            {tab === "Mon perso" && <MyCharacterPanel room={room} />}
            {tab === "Groupe" && <PartyPanel room={room} />}
            {tab === "Documents" && <HandoutsPanel room={room} />}
            {tab === "Règles" && <Rulebook room={room} nav={bookNav} onNav={setBookNav} onOpenWide={() => setBookOpen(true)} />}
          </div>
          <div>
            {room.initiative.entries.length > 0 && !room.combat && (
              <div className="small" style={{ padding: "6px 12px", background: "#c9a34e22", borderTop: "1px solid #00000080" }}>
                Round {room.initiative.round} · au tour de <b>{room.initiative.entries[room.initiative.turn]?.name}</b>
              </div>
            )}
            <Log room={room} />
            <DiceTray isGM={isGM} />
          </div>
        </aside>
      </div>
      <CombatIntro room={room} />
      {bookOpen && <RulebookOverlay room={room} nav={bookNav} onNav={setBookNav} onClose={closeBook} />}
    </div>
  );
}
