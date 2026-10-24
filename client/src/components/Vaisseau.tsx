// Fiche du vaisseau du groupe (onglet Vaisseau des joueurs) et panneau des vaisseaux du MJ.
// Rien de secret ici : le serveur n'envoie aux joueurs ni vaisseau caché ni note du MJ (vaisseauxPourJoueur).
import { useState } from "react";
import type { RoomView } from "../../../shared/types";
import { ACTIONS, MODELES, POSTES, type Poste, type Vaisseau } from "../../../shared/vaisseaux";
import { send, toast } from "../store";

const agir = async (event: string, payload: unknown) => {
  const r = await send(event, payload);
  if (!r.ok) toast(r.error ?? "Impossible.");
};

function Jauge({ label, valeur, max, couleur }: { label: string; valeur: number; max: number; couleur: string }) {
  return (
    <div className="small">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <span>{label}</span>
        <strong>{valeur} / {max}</strong>
      </div>
      <div className="hp-bar"><i style={{ width: `${max ? (100 * valeur) / max : 0}%`, background: couleur }} /></div>
    </div>
  );
}

/** Une fiche de vaisseau : jauges, armes, défauts, et les postes avec leurs actions. */
export function FicheVaisseau({ room, v }: { room: RoomView; v: Vaisseau }) {
  const isGM = room.you.isGM;
  const [cible, setCible] = useState("");
  const [arme, setArme] = useState(0);
  const autres = room.vaisseaux.filter((x) => x.id !== v.id);
  const mesFiches = room.characters.filter((c) => isGM || c.ownerId === room.you.id);
  const nomDe = (id?: string) => room.characters.find((c) => c.id === id)?.name;
  const tenuParMoi = (p: Poste) => isGM || mesFiches.some((c) => c.id === v.postes[p]);
  const desempare = v.coque === 0;

  return (
    <article className="paper sheet stack">
      <div>
        <h4>{v.nom}</h4>
        <p className="sub">{MODELES.find((m) => m.id === v.modele)?.nom} · CA {v.ca}{v.effets.esquive ? ` (+${v.effets.esquive} en esquive)` : ""} · vitesse {v.vitesse} cases · soute {v.soute}</p>
        {desempare && <p className="small" style={{ color: "var(--blood)" }}><strong>Désemparé</strong> : plus de moteurs ni d'armes jusqu'à une réparation.</p>}
      </div>
      <Jauge label="Coque" valeur={v.coque} max={v.coqueMax} couleur="var(--blood)" />
      <Jauge label="Boucliers" valeur={v.boucliers} max={v.bouclierMax} couleur="var(--brass)" />
      <div className="small">
        <strong>Armes</strong>
        <ul>{v.armes.map((a) => <li key={a.nom}>{a.nom} : +{a.bonus}, {a.degats}, portée {a.portee} cases</li>)}</ul>
      </div>
      {v.defauts.length > 0 && (
        <div className="small">
          <strong>Défauts</strong>
          <ul>{v.defauts.map((d) => <li key={d.nom}><em>{d.nom}.</em> {d.texte}</li>)}</ul>
        </div>
      )}
      {v.ameliorations.length > 0 && <p className="small"><strong>Améliorations :</strong> {v.ameliorations.join(", ")}.</p>}
      {(v.effets.ordre || v.effets.visee) && (
        <p className="small muted">Ce round : {[v.effets.ordre && "ordre du capitaine (+2 aux tirs)", v.effets.visee && "cible désignée (avantage)"].filter(Boolean).join(", ")}.</p>
      )}

      <div className="stack">
        <strong className="small">Postes</strong>
        {POSTES.map((p) => {
          const tenant = v.postes[p.id];
          const actions = ACTIONS.filter((a) => a.poste === p.id);
          return (
            <div key={p.id} className="stack" style={{ gap: 4, borderTop: "1px solid var(--paper-line)", paddingTop: 6 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span className="small"><strong>{p.nom}</strong> — {tenant ? nomDe(tenant) ?? "?" : <em className="muted">personne</em>}</span>
                {(isGM || v.equipage === "groupe") && (
                  <select
                    className="input small"
                    value={tenant && mesFiches.some((c) => c.id === tenant) ? tenant : ""}
                    onChange={(e) => agir("vaisseau:poste", { id: v.id, poste: p.id, characterId: e.target.value || null })}
                    aria-label={`Qui tient le poste ${p.nom}`}
                    style={{ maxWidth: 150 }}
                  >
                    <option value="">{tenant && !mesFiches.some((c) => c.id === tenant) ? "(tenu)" : "Libre"}</option>
                    {mesFiches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <p className="small muted" style={{ margin: 0 }}>{p.role}</p>
              {tenuParMoi(p.id) && !desempare && (
                <div className="row">
                  {p.id === "artilleur" && (
                    <>
                      <select className="input small" value={cible} onChange={(e) => setCible(e.target.value)} aria-label="Vaisseau visé">
                        <option value="">Viser…</option>
                        {autres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
                      </select>
                      {v.armes.length > 1 && (
                        <select className="input small" value={arme} onChange={(e) => setArme(Number(e.target.value))} aria-label="Arme">
                          {v.armes.map((a, i) => <option key={a.nom} value={i}>{a.nom}</option>)}
                        </select>
                      )}
                    </>
                  )}
                  {actions.map((a) => (
                    <button
                      key={a.id}
                      className="btn small primary"
                      title={a.texte}
                      disabled={a.cible && !cible}
                      onClick={() => agir("vaisseau:action", { id: v.id, action: a.id, cibleId: a.cible ? cible : undefined, arme })}
                    >
                      {a.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

/** Onglet des joueurs : le vaisseau du groupe, et les vaisseaux en vue. */
export function VaisseauPanel({ room }: { room: RoomView }) {
  const nous = room.vaisseaux.filter((v) => v.equipage === "groupe");
  const enVue = room.vaisseaux.filter((v) => v.equipage !== "groupe");
  if (!nous.length) return <div className="stack"><h3>Vaisseau</h3><p className="small muted">Le MJ n'a pas encore sorti votre vaisseau du hangar.</p></div>;
  return (
    <div className="stack">
      <h3>Vaisseau</h3>
      {nous.map((v) => <FicheVaisseau key={v.id} room={room} v={v} />)}
      {enVue.length > 0 && (
        <div className="section stack">
          <h3>En vue</h3>
          {enVue.map((v) => (
            <p key={v.id} className="small"><strong>{v.nom}</strong> · CA {v.ca} · coque {v.coque}/{v.coqueMax} · boucliers {v.boucliers}/{v.bouclierMax}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Panneau du MJ : sortir un vaisseau d'un modèle, le poser, le cacher, le réparer, ouvrir un nouveau round. */
export function VaisseauxMJ({ room }: { room: RoomView }) {
  const [modele, setModele] = useState(MODELES[0].id);
  const [nom, setNom] = useState("");
  const [equipage, setEquipage] = useState<Vaisseau["equipage"]>(room.vaisseaux.some((v) => v.equipage === "groupe") ? "autre" : "groupe");
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <div className="stack">
      <h3>Vaisseaux</h3>
      <div className="row">
        <select className="input" value={modele} onChange={(e) => setModele(e.target.value)} aria-label="Modèle">
          {MODELES.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        <input className="input" placeholder="Nom (la Pie-Grièche…)" value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Nom du vaisseau" />
        <select className="input" value={equipage} onChange={(e) => setEquipage(e.target.value as Vaisseau["equipage"])} aria-label="Équipage">
          <option value="groupe">Celui du groupe</option>
          <option value="autre">PNJ ou ennemi</option>
        </select>
        <button className="btn primary" onClick={async () => { await agir("vaisseau:creer", { modele, nom, equipage }); setNom(""); }}>Sortir du hangar</button>
      </div>
      <p className="small muted">{MODELES.find((m) => m.id === modele)?.description}</p>
      {room.vaisseaux.length > 0 && <button className="btn small" onClick={() => agir("vaisseau:round", {})}>Nouveau round (esquives et ordres retombent)</button>}
      {room.vaisseaux.map((v) => (
        <div key={v.id} className="stack" style={{ gap: 4 }}>
          <div className="row" style={{ alignItems: "center" }}>
            <button className="btn small" onClick={() => setOuvert(ouvert === v.id ? null : v.id)} aria-expanded={ouvert === v.id}>
              {v.nom} · {v.coque}/{v.coqueMax}{v.cache ? " · caché" : ""}
            </button>
            <button className="btn small" onClick={() => agir("vaisseau:poser", v.id)} title="Pose le pion du vaisseau sur la carte (de préférence une carte d'espace)">{v.tokenId ? "Reposer" : "Poser"}</button>
            <button className="btn small" onClick={() => agir("vaisseau:modifier", { id: v.id, cache: !v.cache })}>{v.cache ? "Montrer" : "Cacher"}</button>
            <button className="btn small" onClick={() => agir("vaisseau:modifier", { id: v.id, coque: v.coqueMax, boucliers: v.bouclierMax })}>Remettre à neuf</button>
            <button className="btn small" onClick={() => window.confirm(`Supprimer ${v.nom} ?`) && agir("vaisseau:supprimer", v.id)}>Supprimer</button>
          </div>
          {ouvert === v.id && (
            <>
              <FicheVaisseau room={room} v={v} />
              <label className="field small">
                <span>Notes du MJ (jamais montrées aux joueurs)</span>
                <textarea className="input" rows={2} defaultValue={v.notes ?? ""} onBlur={(e) => agir("vaisseau:modifier", { id: v.id, notes: e.target.value })} />
              </label>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
