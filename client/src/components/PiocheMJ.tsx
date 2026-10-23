// Pioches du MJ : il tire en secret une rencontre, un événement ou un objet, puis retourne la carte devant la table.
// Code du MJ seulement (chargé à part, voir mj.tsx) : la pioche lit le bestiaire et le canon.
import { useRef, useState } from "react";
import { TYPES_DE_CARTE, tirerCarte, type Carte, type TypeDeCarte } from "../../../shared/cartes";
import type { RoomView } from "../../../shared/types";
import { send, toast } from "../store";
import { CarteDos, CarteFace } from "./Cartes";

export function PiocheMJ({ room }: { room: RoomView }) {
  const [tiree, setTiree] = useState<Carte | null>(null);
  const deja = useRef<string[]>([]);
  if (!room.you.isGM || !room.map) return null;
  const tirer = (type: TypeDeCarte) => {
    const c = tirerCarte(type, room.genre, room.level, undefined, deja.current);
    deja.current = [c.id, ...deja.current].slice(0, 8);
    setTiree(c);
  };
  return (
    <>
      <div className="pioches" role="group" aria-label="Pioches de cartes">
        {TYPES_DE_CARTE.map((t) => (
          <button key={t.id} className="pioche" onClick={() => tirer(t.id)} aria-label={`Piocher une carte ${t.label}`} title={`Piocher : ${t.label}`}>
            <span className="pioche-pile" />
            <CarteDos />
            <span className="pioche-nom">{t.label}</span>
          </button>
        ))}
      </div>
      {tiree && (
        <div className="carte-voile" role="dialog" aria-label="Carte piochée" onClick={() => setTiree(null)}>
          <div className="carte-scene" onClick={(e) => e.stopPropagation()}>
            <div className="carte-grande">
              <CarteFace carte={tiree} />
            </div>
            <p className="carte-aparte">Toi seul la vois.</p>
            <div className="carte-actions">
              <button className="btn primary" onClick={() => send("carte:retourner", tiree).then((r) => (r.ok ? setTiree(null) : toast(r.error ?? "La carte n'a pas été retournée.")))}>
                Retourner devant la table
              </button>
              <button className="btn" onClick={() => tirer(tiree.type)}>Piocher une autre</button>
              <button className="btn ghost" onClick={() => setTiree(null)}>Remettre</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** La carte retournée : elle pivote en grand devant tout le monde, puis se pose au coin du plateau. */
