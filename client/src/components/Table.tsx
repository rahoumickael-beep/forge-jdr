import { lazy, Suspense, useCallback, useState } from "react";
import { getGenre } from "../../../shared/genres";
import type { RoomView } from "../../../shared/types";
import { forgetSession, gmKeyFor, toast, useStore } from "../store";
import { DiceTray, Log } from "./Dice";
import { CombatIntro } from "./CombatIntro";
import { CarteRetournee } from "./Cartes";
import { CollectionPanel } from "./Collection";
import { DesSurLaTable } from "./DesSurLaTable";
import { InitiativeFrieze } from "./InitiativeFrieze";
import { ChroniquePanel } from "./Chronique";
import { MapCanvas, type MapTool } from "./MapCanvas";
import { HandoutsPanel, MyCharacterPanel, PartyPanel } from "./PlayerPanels";
import { INITIAL_NAV, Rulebook, RulebookOverlay, type BookNav } from "./Rulebook";

/** Code du MJ, chargé à part : le serveur ne sert les fichiers mj-* qu'avec la clé du MJ, posée en cookie juste avant. */
let codeMJ: Promise<typeof import("./mj")> | null = null;
function chargerMJ(code: string) {
  codeMJ ??= fetch("/api/mj/acces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, gmKey: gmKeyFor(code) }) })
    .catch(() => undefined)
    .then(() => import("./mj"))
    .catch((e) => {
      codeMJ = null; // on retentera au prochain rendu
      throw e;
    });
  return codeMJ;
}
const PanneauMJ = lazy(() => chargerMJ(codeDeLaPartie).then((m) => ({ default: m.PanneauMJ })));
const PiocheMJ = lazy(() => chargerMJ(codeDeLaPartie).then((m) => ({ default: m.PiocheMJ })));
let codeDeLaPartie = "";

const GM_TABS = ["Générer", "Carte", "Pions", "Bestiaire", "Combat", "Scénarios", "Narration", "Campagne", "Réglages", "Règles"] as const;
const PLAYER_TABS = ["Mon perso", "Groupe", "Cartes", "Documents", "Chronique", "Règles"] as const;

export function Table({ room }: { room: RoomView }) {
  const { connected } = useStore();
  const isGM = room.you.isGM;
  codeDeLaPartie = room.code;
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
          <DesSurLaTable room={room} />
          {isGM && (
            <Suspense fallback={null}>
              <PiocheMJ room={room} />
            </Suspense>
          )}
          <CarteRetournee room={room} />
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
            {isGM && (
              <Suspense fallback={<p className="small muted">Le MJ ouvre ses carnets…</p>}>
                <PanneauMJ room={room} tab={tab} selectedId={selectedId} onSelect={setSelectedId} />
              </Suspense>
            )}
            {tab === "Chronique" && <ChroniquePanel room={room} />}
            {tab === "Cartes" && <CollectionPanel room={room} />}
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
