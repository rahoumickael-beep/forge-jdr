// Fiches papier : personnage, scénario, rencontre.
import { useState } from "react";
import { getGenre, TONS } from "../../../shared/genres";
import { formatMod, modifier } from "../../../shared/personnages";
import type { Character, Encounter, Scenario } from "../../../shared/types";
import { send } from "../store";

export function CharacterSheet({ c, editable, onPlace, onRemove }: { c: Character; editable: boolean; onPlace?: () => void; onRemove?: () => void }) {
  const [open, setOpen] = useState(false);
  const stats = getGenre(c.genre).stats;
  const setHp = (hp: number) => send("character:upsert", { ...c, hp: Math.max(0, Math.min(c.hpMax, hp)) });
  const roll = (stat: string) => send("dice:roll", { expr: `1d20${modifier(c.stats[stat]) >= 0 ? "+" : ""}${modifier(c.stats[stat])}`, label: `${c.name} — ${stat}` });
  return (
    <article className="paper sheet">
      {c.portrait && <img className="sheet-portrait" src={c.portrait} alt={`Portrait de ${c.name}`} />}
      <h4>{c.name}</h4>
      <div className="sub">
        {c.origin} · {c.archetype} · niveau {c.level}
        {c.role ? ` · ${c.role}` : ""}
      </div>
      <div className="vitals">
        <span className="vital">PV {c.hp}/{c.hpMax}</span>
        <span className="vital">CA {c.ac}</span>
        <span className="vital">Déplacement {c.speed} cases</span>
      </div>
      <div className="hp-bar" aria-hidden="true">
        <i style={{ width: `${(c.hp / Math.max(1, c.hpMax)) * 100}%` }} />
      </div>
      {editable && (
        <div className="row" style={{ alignItems: "center" }}>
          <button className="btn small" onClick={() => setHp(c.hp - 1)}>−1 PV</button>
          <button className="btn small" onClick={() => setHp(c.hp - 5)}>−5</button>
          <button className="btn small" onClick={() => setHp(c.hp + 1)}>+1 PV</button>
          <button className="btn small" onClick={() => setHp(c.hpMax)}>Repos</button>
        </div>
      )}
      <div className="stat-grid">
        {stats.map((s) => (
          <button key={s} className="stat" onClick={() => roll(s)} title={`Lancer 1d20 ${formatMod(c.stats[s])} en ${s}`}>
            <small>{s}</small>
            <strong>{c.stats[s]}</strong>
            <em>{formatMod(c.stats[s])}</em>
          </button>
        ))}
      </div>
      <p className="small" style={{ margin: "4px 0" }}>{c.description}</p>
      {open && (
        <div className="prose small">
          <h5>Histoire</h5>
          <p>{c.backstory}</p>
          <h5>Caractère</h5>
          <p>{c.personality}</p>
          <h5>Capacités</h5>
          <div className="tags">{c.abilities.map((a) => <span key={a} className="tagchip">{a}</span>)}</div>
          <h5>Équipement</h5>
          <div className="tags">{c.equipment.map((a) => <span key={a} className="tagchip">{a}</span>)}</div>
        </div>
      )}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn small" onClick={() => setOpen(!open)}>{open ? "Replier" : "Détails"}</button>
        {onPlace && <button className="btn small" onClick={onPlace}>Placer sur la carte</button>}
        {onRemove && <button className="btn small danger" onClick={onRemove}>Retirer</button>}
      </div>
    </article>
  );
}

export function EncounterBlock({ e, onPlace }: { e: Encounter; onPlace?: () => void }) {
  return (
    <div>
      <h5>
        {e.title} <span className="muted small">({e.difficulty})</span>
      </h5>
      <p>{e.description}</p>
      <div style={{ overflowX: "auto" }}>
        <table className="enemy-table">
          <thead>
            <tr><th>Ennemi</th><th>Nb</th><th>PV</th><th>CA</th><th>Attaque</th></tr>
          </thead>
          <tbody>
            {e.enemies.map((en, i) => (
              <tr key={i}><td>{en.name}</td><td>{en.count}</td><td>{en.hp}</td><td>{en.ac}</td><td>{en.attack}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPlace && <button className="btn small" onClick={onPlace}>Placer ces ennemis (cachés)</button>}
    </div>
  );
}

const SOURCE_LABELS: Record<Scenario["source"], string> = { ia: "écrit par l'IA", aleatoire: "tiré au hasard", bibliotheque: "écrit à la main" };
const MAP_KIND_LABELS = { donjon: "donjon", caverne: "cavernes", nature: "extérieur", village: "village" } as const;

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.trim()}</p>)}</>;
}

function ReadAloud({ title, text, onRead }: { title?: string; text: string; onRead?: (text: string) => void }) {
  return (
    <div className="read-aloud">
      <div className="read-aloud-head">
        <span>À lire{title ? ` · ${title}` : ""}</span>
        {onRead && <button className="btn small" onClick={() => onRead(text)} title="Envoyer ce texte dans le journal de la table">Dans le journal</button>}
      </div>
      <p>{text}</p>
    </div>
  );
}

export function ScenarioSheet({ s, onPlaceEncounter, onReadAloud, actions }: { s: Scenario; onPlaceEncounter?: (e: Encounter) => void; onReadAloud?: (text: string) => void; actions?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const readFor = (act: number) => (s.readAloud ?? []).filter((r) => r.act === act);
  return (
    <article className="paper sheet">
      <h4>{s.title}</h4>
      <div className="sub">
        {getGenre(s.genre).label} · {TONS.find((t) => t.id === s.ton)?.label} · niveau {s.level} · {s.players} joueurs · {SOURCE_LABELS[s.source] ?? "tiré au hasard"}
      </div>
      <div className="prose small">
        <p><b>Accroche.</b> {s.hook}</p>
        <p>{s.synopsis}</p>
        {s.mapHint && (
          <p className="muted">Carte proposée : {s.mapHint.name} ({MAP_KIND_LABELS[s.mapHint.kind]}, tirage n°{s.mapHint.seed}).</p>
        )}
        {open && (
          <>
            {s.gmNotes && (
              <div className="gm-notes">
                <h5>Avant de jouer</h5>
                <Paragraphs text={s.gmNotes} />
              </div>
            )}
            {readFor(0).map((r, i) => <ReadAloud key={i} title={r.title} text={r.text} onRead={onReadAloud} />)}
            <h5>Déroulé</h5>
            {s.acts.map((a, i) => (
              <div className="act" key={i}>
                <b>{s.readAloud || s.choices ? `Acte ${i + 1}. ` : ""}{a.title}</b> <span className="muted">— {a.location}</span>
                <p>{a.summary}</p>
                {readFor(i + 1).map((r, k) => <ReadAloud key={k} title={r.title} text={r.text} onRead={onReadAloud} />)}
              </div>
            ))}
            {s.choices && s.choices.length > 0 && (
              <>
                <h5>Les choix</h5>
                {s.choices.map((c, i) => (
                  <div className="choice" key={i}>
                    <b>{c.title}</b> <span className="muted">— acte {c.act}</span>
                    <ul>
                      {c.options.map((o, k) => (
                        <li key={k}><b>{o.label}.</b> {o.consequence}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
            <h5>Le méchant : {s.villain.name}</h5>
            <p>{s.villain.description} Il veut {s.villain.motivation.replace(/^\w/, (m) => m.toLowerCase())}.</p>
            <h5>Personnages non joueurs</h5>
            {s.npcs.map((n, i) => (
              <p key={i}>
                <b>{n.name}</b> ({n.role}) : {n.secret}
                {n.voice && <span className="npc-voice"> Voix : {n.voice}</span>}
              </p>
            ))}
            <h5>Rencontres</h5>
            {s.encounters.map((e, i) => (
              <EncounterBlock key={i} e={e} onPlace={onPlaceEncounter ? () => onPlaceEncounter(e) : undefined} />
            ))}
            <h5>Rebondissements</h5>
            <ul>{s.twists.map((t, i) => <li key={i}>{t}</li>)}</ul>
            <h5>Récompenses</h5>
            <ul>{s.rewards.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </>
        )}
      </div>
      <div className="row">
        <button className="btn small" onClick={() => setOpen(!open)}>{open ? "Replier" : "Lire le scénario"}</button>
        {actions}
      </div>
    </article>
  );
}
