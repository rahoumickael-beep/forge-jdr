// Mémoire de campagne : le MJ tient les séances, les fils, les PNJ, les ordres et la jauge ; les joueurs lisent la chronique.
import { useEffect, useMemo, useState } from "react";
import { jaugeMax, preparerSeance, seanceEnCours, texteDePreparation } from "../../../shared/campagne";
import { canonDe } from "../../../shared/canon";
import type { RoomView } from "../../../shared/types";
import { send, toast } from "../store";
import { ATTITUDES, attitude } from "./Chronique";
import { DistributionCartes } from "./Collection";

const dateCourte = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export function CampagnePanel({ room }: { room: RoomView }) {
  const c = room.campagne;
  const canon = canonDe(room.genre);
  const enCours = seanceEnCours(c);
  const [resume, setResume] = useState("");
  const [fil, setFil] = useState("");
  const [filSecret, setFilSecret] = useState(false);
  const [pnjNom, setPnjNom] = useState("");
  const [preparation, setPreparation] = useState(c.preparation);
  const prep = useMemo(() => preparerSeance(room), [room.campagne, room.level, room.genre]);
  useEffect(() => {
    const t = setTimeout(() => preparation !== c.preparation && send("campagne:set", { preparation }), 800);
    return () => clearTimeout(t);
  }, [preparation]);
  const jauge = canon?.campagne?.jauge;
  const reserve = canon?.campagne?.reserve;

  return (
    <div className="stack">
      <h3>Séance</h3>
      {enCours ? (
        <>
          <p className="small">Séance {enCours.numero}, ouverte le {dateCourte(enCours.debut)}. {enCours.faits.length ? `${enCours.faits.length} fait${enCours.faits.length > 1 ? "s" : ""} noté${enCours.faits.length > 1 ? "s" : ""}.` : "Rien de noté pour l'instant."}</p>
          {enCours.faits.length > 0 && <ul className="small">{enCours.faits.slice(-6).map((f, i) => <li key={i}>{f}</li>)}</ul>}
          <label className="field">
            <span>Ce que les joueurs retiendront (lu au début de la prochaine séance)</span>
            <textarea id="seance-resume" className="input" value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Colin est rentré vivant. Le passeur dort en cellule à Saint-Ferréol, et les Noyés ont passé la palissade sans un mort." />
          </label>
          <button className="btn" onClick={() => send("seance:clore", { resume }).then((r) => r.ok && setResume(""))}>Clore la séance</button>
        </>
      ) : (
        <>
          <p className="small muted">{c.seances.length ? `${c.seances.length} séance${c.seances.length > 1 ? "s" : ""} jouée${c.seances.length > 1 ? "s" : ""}. Ouvrir la suivante lit le « Précédemment » à la table.` : "Aucune séance encore. Les combats, cartes et documents se noteront tout seuls une fois la séance ouverte."}</p>
          <button className="btn primary" onClick={() => send("seance:ouvrir")}>Ouvrir la séance {c.seances.length + 1}</button>
        </>
      )}

      <DistributionCartes room={room} />

      <div className="section stack">
        <h3>Fils ouverts</h3>
        <input id="fil-texte" className="input" value={fil} onChange={(e) => setFil(e.target.value)} placeholder="Qui a payé le passeur ?" />
        <div className="row">
          <label className="small"><input type="checkbox" checked={filSecret} onChange={(e) => setFilSecret(e.target.checked)} /> Secret</label>
          <button className="btn small" disabled={!fil.trim()} onClick={() => send("fil:upsert", { texte: fil, secret: filSecret }).then(() => { setFil(""); setFilSecret(false); })}>Noter le fil</button>
        </div>
        {c.fils.map((f) => (
          <div key={f.id} className="token-row">
            <span className="name" style={f.ouvert ? undefined : { textDecoration: "line-through", opacity: 0.6 }}>{f.texte}{f.secret ? <span className="small muted"> · secret</span> : null}</span>
            <button className="btn small" onClick={() => send("fil:upsert", { id: f.id, texte: f.texte, ouvert: !f.ouvert })}>{f.ouvert ? "Dénoué" : "Rouvrir"}</button>
            <button className="btn small danger" onClick={() => send("fil:remove", f.id)}>Retirer</button>
          </div>
        ))}
      </div>

      <div className="section stack">
        <h3>PNJ croisés</h3>
        <div className="row">
          <input id="pnj-nom" className="input" value={pnjNom} onChange={(e) => setPnjNom(e.target.value)} placeholder="Mère Gisle" />
          <button className="btn small" disabled={!pnjNom.trim()} onClick={() => send("pnj:upsert", { nom: pnjNom }).then(() => setPnjNom(""))}>Ajouter</button>
        </div>
        {c.pnj.map((p) => (
          <PnjLigne key={p.id} room={room} id={p.id} />
        ))}
      </div>

      {Object.keys(c.reputations).length > 0 && (
        <details className="section stack">
          <summary><h3 style={{ display: "inline" }}>Réputation du groupe</h3> <span className="small muted">{Object.values(c.reputations).filter((n) => n > 0).length} ordre(s) qui vous connaissent</span></summary>
          {canon?.factions.filter((f) => f.id in c.reputations).map((f) => (
            <div key={f.id} className="token-row">
              <span className="name">{f.nom}</span>
              <select className="input" style={{ width: "auto" }} aria-label={`Réputation auprès de ${f.nom}`} value={c.reputations[f.id]} onChange={(e) => send("campagne:set", { reputation: { id: f.id, valeur: Number(e.target.value) } })}>
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
        </details>
      )}

      {jauge && c.jauge !== null && (
        <div className="section stack">
          <h3>{jauge.nom[0].toUpperCase() + jauge.nom.slice(1)} : {c.jauge}</h3>
          <input type="range" min={0} max={jaugeMax(canon)} value={c.jauge} aria-label={jauge.nom} onChange={(e) => send("campagne:set", { jauge: Number(e.target.value) })} />
          <div className="row">
            {[-3, -1, 1, 2, 5].map((d) => <button key={d} className="btn small" onClick={() => send("campagne:set", { jauge: c.jauge! + d })}>{d > 0 ? `+${d}` : d}</button>)}
          </div>
          <label className="small"><input type="checkbox" checked={c.jaugeVisible} onChange={(e) => send("campagne:set", { jaugeVisible: e.target.checked })} /> Les joueurs voient la jauge</label>
          {prep.jauge?.prochain && <p className="small muted">Sous {prep.jauge.prochain.valeur} : {prep.jauge.prochain.effet}</p>}
        </div>
      )}

      {reserve && (
        <div className="section stack">
          <h3>{reserve.nom} : {c.reserve} / {reserve.max}</h3>
          <div className="row">
            <button className="btn small" disabled={c.reserve >= reserve.max} onClick={() => send("campagne:set", { reserve: c.reserve + 1 })}>Gagner</button>
            <button className="btn small" disabled={c.reserve <= 0} onClick={() => send("campagne:set", { reserve: c.reserve - 1 })}>Dépenser</button>
          </div>
          <p className="small muted">{reserve.regle}</p>
        </div>
      )}

      <div className="section stack">
        <h3>Préparer la séance {prep.numero}</h3>
        <pre className="paper sheet small" style={{ whiteSpace: "pre-wrap", fontFamily: "var(--body)" }}>{texteDePreparation(prep)}</pre>
        <button className="btn small" onClick={() => setPreparation((p) => (p ? `${p}\n\n` : "") + texteDePreparation(prep))}>Copier dans mes notes de préparation</button>
        <label className="field">
          <span>Notes de préparation</span>
          <textarea id="campagne-preparation" className="input" style={{ minHeight: 160 }} value={preparation} onChange={(e) => setPreparation(e.target.value)} placeholder="Ce que je veux faire arriver la prochaine fois…" />
        </label>
        <p className="small muted">Enregistrées automatiquement. Jamais envoyées aux joueurs.</p>
      </div>
    </div>
  );
}

function PnjLigne({ room, id }: { room: RoomView; id: string }) {
  const p = room.campagne.pnj.find((x) => x.id === id)!;
  const [pub, setPub] = useState(p.public);
  const [secret, setSecret] = useState(p.secret);
  const maj = (champs: Partial<typeof p>) => send("pnj:upsert", { ...p, public: pub, secret, ...champs });
  return (
    <details className="paper sheet small">
      <summary><strong>{p.nom}</strong> · {attitude(p.attitude)}</summary>
      <div className="stack" style={{ marginTop: 6 }}>
        <select className="input" aria-label={`Attitude de ${p.nom}`} value={p.attitude} onChange={(e) => maj({ attitude: Number(e.target.value) })}>
          {[-2, -1, 0, 1, 2].map((n) => <option key={n} value={n}>{attitude(n)}</option>)}
        </select>
        <textarea className="input" aria-label="Ce que les joueurs savent" value={pub} onChange={(e) => setPub(e.target.value)} onBlur={() => maj({})} placeholder="Ce que les joueurs savent de lui" />
        <textarea className="input" aria-label="Ce que tu gardes pour toi" value={secret} onChange={(e) => setSecret(e.target.value)} onBlur={() => maj({})} placeholder="Ce que tu gardes pour toi" />
        <button className="btn small danger" onClick={() => send("pnj:remove", p.id).then((r) => r.ok && toast(`${p.nom} retiré de la chronique.`))}>Retirer</button>
      </div>
    </details>
  );
}

/** Ce que les joueurs lisent de la campagne : le serveur leur a déjà retiré les secrets. */
