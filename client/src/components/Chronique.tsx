// Chronique des joueurs : ce que le groupe retient de la campagne. Chargée par les joueurs : rien du canon ici,
// les noms (jauge, factions) arrivent avec la vue envoyée par le serveur (campagnePourJoueur).
import type { RoomView } from "../../../shared/types";

export const ATTITUDES = ["Hostile", "Méfiant", "Neutre", "Bienveillant", "Allié"];
export const attitude = (n: number) => ATTITUDES[n + 2] ?? "Neutre";

export function ChroniquePanel({ room }: { room: RoomView }) {
  const c = room.campagne;
  const closes = c.seances.filter((s) => s.fin).reverse();
  const fils = c.fils.filter((f) => f.ouvert);
  const amis = c.noms?.factions ?? [];
  return (
    <div className="stack">
      <h3>Chronique</h3>
      {c.jauge !== null && c.noms?.jauge && <p className="small">{c.noms.jauge[0].toUpperCase() + c.noms.jauge.slice(1)} : {c.jauge}</p>}
      {closes.length === 0 && <p className="small muted">Rien encore. Le MJ écrit ici ce qu'on retient de chaque séance.</p>}
      {closes.map((s) => (
        <article key={s.numero} className="paper sheet">
          <h4>Séance {s.numero}</h4>
          <p className="small" style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{s.resume || s.faits.join(" ")}</p>
        </article>
      ))}
      {fils.length > 0 && (
        <div className="section stack">
          <h3>Ce qui reste en suspens</h3>
          <ul className="small">{fils.map((f) => <li key={f.id}>{f.texte}</li>)}</ul>
        </div>
      )}
      {c.pnj.length > 0 && (
        <div className="section stack">
          <h3>Gens croisés</h3>
          {c.pnj.map((p) => <p key={p.id} className="small"><strong>{p.nom}</strong> · {attitude(p.attitude)}{p.public ? ` : ${p.public}` : ""}</p>)}
        </div>
      )}
      {amis.length > 0 && (
        <div className="section stack">
          <h3>Réputation</h3>
          {amis.map((f) => <p key={f.id} className="small">{f.nom} : {c.reputations[f.id]} / 3</p>)}
        </div>
      )}
    </div>
  );
}
