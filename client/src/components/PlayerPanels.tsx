// Panneaux des joueurs : mon personnage, le groupe, les documents.
import { useState } from "react";
import { getGenre } from "../../../shared/genres";
import { generateCharacter } from "../../../shared/generators";
import { randomSeed } from "../../../shared/random";
import type { Character, RoomView } from "../../../shared/types";
import { tokenForCharacter } from "../placement";
import { send, toast } from "../store";
import { CharacterSheet } from "./Sheets";

export function MyCharacterPanel({ room }: { room: RoomView }) {
  const me = room.you;
  const myTokens = room.tokens.filter((t) => t.ownerId === me.id);
  const mine = room.characters.filter((c) => myTokens.some((t) => t.characterId === c.id));
  const genre = getGenre(room.genre);
  const [draft, setDraft] = useState<Character | null>(null);
  const [archetype, setArchetype] = useState("");

  const roll = () => setDraft(generateCharacter({ genre: room.genre, level: room.level, archetype: archetype || undefined, seed: randomSeed() }));

  async function confirm() {
    if (!draft) return;
    if (!room.map) return toast("Attends que le MJ pose une carte pour placer ton pion.");
    const r = await send("character:upsert", draft);
    if (!r.ok) return;
    await send("token:upsert", tokenForCharacter(room, draft, me.color, me.id));
    setDraft(null);
  }

  return (
    <div className="stack">
      {mine.map((c) => (
        <CharacterSheet key={c.id} c={c} editable />
      ))}
      {mine.length === 0 && (
        <>
          <h3>Créer mon personnage</h3>
          <p className="small muted">Tire un personnage au hasard, change son nom si tu veux, puis pose ton pion sur la carte.</p>
          <label className="field">
            <span>Classe souhaitée</span>
            <select id="pj-classe" className="input" value={archetype} onChange={(e) => setArchetype(e.target.value)}>
              <option value="">Au hasard</option>
              {genre.archetypes.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <button className="btn" onClick={roll}>{draft ? "Relancer" : "Tirer un personnage"}</button>
          {draft && (
            <>
              <label className="field">
                <span>Nom</span>
                <input id="pj-nom" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <CharacterSheet c={draft} editable={false} />
              <button className="btn primary" onClick={confirm}>C'est mon personnage</button>
            </>
          )}
        </>
      )}
      {room.movementLocked && <p className="small muted">Le MJ a bloqué les déplacements pour l'instant.</p>}
      <p className="small muted">Pour bouger : fais glisser ton pion, ou clique dessus puis utilise les flèches du clavier. Double-clic sur la carte pour attirer l'attention.</p>
    </div>
  );
}

export function PartyPanel({ room }: { room: RoomView }) {
  const party = room.characters.filter((c) => room.tokens.some((t) => t.characterId === c.id && t.kind === "joueur"));
  return (
    <div className="stack">
      <h3>Le groupe</h3>
      {party.length === 0 && <p className="small muted">Personne n'a encore créé de personnage.</p>}
      <div className="card-list">
        {party.map((c) => <CharacterSheet key={c.id} c={c} editable={false} />)}
      </div>
    </div>
  );
}

export function HandoutsPanel({ room }: { room: RoomView }) {
  return (
    <div className="stack">
      <h3>Documents</h3>
      {room.handouts.length === 0 && <p className="small muted">Le MJ n'a encore rien distribué.</p>}
      {room.handouts.map((h) => (
        <article key={h.id} className="paper sheet">
          <h4>{h.title}</h4>
          <p className="small" style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{h.text}</p>
        </article>
      ))}
    </div>
  );
}
