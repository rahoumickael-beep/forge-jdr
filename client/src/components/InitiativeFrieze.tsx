import type { RoomView, Token } from "../../../shared/types";
import { figurineDe } from "../figurines";
import { send } from "../store";

/** État de santé vague, comme les joueurs le perçoivent : on ne voit pas les PV d'un ennemi. */
function etat(t: Token | undefined): string {
  if (!t?.hpMax || t.hp === undefined) return "";
  const r = t.hp / t.hpMax;
  return r <= 0 ? "À terre" : r < 0.25 ? "Au bord de la mort" : r < 0.5 ? "En sang" : r < 1 ? "Blessé" : "Indemne";
}

const initiales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Piste d'initiative pendant un combat : une réglette de bois au bord du plateau, un jeton par combattant, le jeton actif avancé. */
export function InitiativeFrieze({ room }: { room: RoomView }) {
  const { entries, turn, round } = room.initiative;
  if (!room.combat || !entries.length) return null;
  const isGM = room.you.isGM;
  const current = entries[turn];
  const currentToken = room.tokens.find((t) => t.id === current?.tokenId);
  const myTurn = !!currentToken && currentToken.ownerId === room.you.id;

  return (
    <div className="frieze" aria-label="Ordre d'initiative">
      <div className="frieze-round">
        <span>Round</span>
        <b>{round}</b>
      </div>
      <ol className="frieze-list">
        {entries.map((e, i) => {
          const t = room.tokens.find((x) => x.id === e.tokenId);
          const portrait = t ? figurineDe(t, t.characterId ? room.characters.find((c) => c.id === t.characterId) : undefined) : undefined;
          const ennemi = t?.kind === "monstre";
          const down = t?.hp !== undefined && t.hp <= 0;
          const hp = isGM || !ennemi ? (t?.hpMax ? `${t.hp ?? t.hpMax}/${t.hpMax} PV` : "") : etat(t);
          return (
            <li key={`${e.tokenId ?? e.name}-${i}`} className={`frieze-item${i === turn ? " current" : ""}${ennemi ? " foe" : ""}${down ? " down" : ""}`} title={`${e.name} · initiative ${e.value}${hp ? ` · ${hp}` : ""}`}>
              <span className="frieze-medal" style={{ background: t?.color ?? "#555", ["--pion" as string]: t?.color ?? "#555" }}>
                {portrait ? <img src={portrait} alt="" /> : <span>{initiales(e.name)}</span>}
              </span>
              <span className="frieze-name">{e.name}</span>
              <span className="frieze-meta">{e.value}{hp ? ` · ${hp}` : ""}</span>
            </li>
          );
        })}
      </ol>
      {isGM ? (
        <div className="frieze-actions">
          <button className="btn small" onClick={() => send("initiative:step", { delta: -1 })} aria-label="Tour précédent">‹</button>
          <button className="btn small primary" onClick={() => send("initiative:step", { delta: 1 })}>Tour suivant</button>
        </div>
      ) : (
        myTurn && <div className="frieze-yours">À toi de jouer</div>
      )}
    </div>
  );
}
