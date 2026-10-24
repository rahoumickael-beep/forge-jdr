// Fiche du vaisseau (ou du navire) du groupe, onglet des joueurs, et panneau du MJ.
// Les mots viennent du genre de la partie (marine dans shared/vaisseaux.ts) : un navire de pirates ne parle ni de boucliers ni de hangar.
// Rien de secret ici : le serveur n'envoie aux joueurs ni vaisseau caché, ni note du MJ, ni Moral d'un autre équipage (vaisseauxPourJoueur).
import { useState } from "react";
import type { RoomView } from "../../../shared/types";
import { estNavire, etatGreement, marine, vitesseEffective, type Marine, type Poste, type Vaisseau } from "../../../shared/vaisseaux";
import { send, toast } from "../store";

const agir = async (event: string, payload: unknown) => {
  const r = await send(event, payload);
  if (!r.ok) toast(r.error ?? "Impossible.");
};

/** Le jeu de règles et de mots de ce vaisseau : un navire garde ses mots même si la partie a changé de genre. */
const marineDe = (room: RoomView, v: Vaisseau): Marine => marine(estNavire(v) ? "pirates" : room.genre);

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
  const mar = marineDe(room, v);
  const { mots } = mar;
  const [cible, setCible] = useState("");
  const [arme, setArme] = useState(0);
  const [viser, setViser] = useState<"coque" | "greement">("coque");
  const autres = room.vaisseaux.filter((x) => x.id !== v.id);
  const mesFiches = room.characters.filter((c) => isGM || c.ownerId === room.you.id);
  const nomDe = (id?: string) => room.characters.find((c) => c.id === id)?.name;
  const tenuParMoi = (p: Poste) => isGM || mesFiches.some((c) => c.id === v.postes[p]);
  const desempare = v.coque === 0;
  const greement = mar.navire ? etatGreement(v) : "intact";
  const accroche = v.grappins ? room.vaisseaux.find((x) => x.id === v.grappins)?.nom : undefined;
  const effets = [
    v.effets.ordre && mots.ordreEffet,
    v.effets.visee && mots.viseeEffet,
    v.effets.vent && mots.ventEffet,
    accroche && `accroché à ${accroche}`,
    v.fuite && `fuite en cours : ${v.fuite.reussites} réussite sur 2, ${v.fuite.touches} touche${v.fuite.touches > 1 ? "s" : ""} sur 3`,
  ].filter(Boolean);
  const vitesse = vitesseEffective(v);

  return (
    <article className="paper sheet stack">
      <div>
        <h4>{v.nom}</h4>
        <p className="sub">
          {mar.modeles.find((m) => m.id === v.modele)?.nom} · CA {v.ca}{v.effets.esquive ? ` (+${v.effets.esquive} en ${mar.navire ? "virant" : "esquive"})` : ""} · vitesse {vitesse} case{vitesse > 1 ? "s" : ""}
          {vitesse !== v.vitesse ? ` (sur ${v.vitesse})` : ""} · {mar.navire ? "cale" : "soute"} {v.soute}
        </p>
        {desempare && <p className="small" style={{ color: "var(--blood)" }}><strong>{mots.desempare}</strong> : {mots.desempareTexte}</p>}
        {greement === "abime" && <p className="small" style={{ color: "var(--blood)" }}><strong>Gréement abîmé</strong> : le navire va moins vite et manœuvre mal (désavantage aux tests de manœuvre).</p>}
        {greement === "tombe" && <p className="small" style={{ color: "var(--blood)" }}><strong>Gréement tombé</strong> : vitesse réduite de moitié, le navire ne vire plus, ne prend plus le vent et ne fuit plus.</p>}
      </div>
      <Jauge label="Coque" valeur={v.coque} max={v.coqueMax} couleur="var(--blood)" />
      <Jauge label={mots.reserve} valeur={v.boucliers} max={v.bouclierMax} couleur="var(--brass)" />
      {mar.navire && v.moral !== undefined && <Jauge label="Moral de l'équipage" valeur={v.moral} max={10} couleur="var(--moss)" />}
      {mar.navire && v.hommes !== undefined && v.hommesMax !== undefined && <Jauge label="Hommes à bord" valeur={v.hommes} max={v.hommesMax} couleur="var(--moss)" />}
      <div className="small">
        <strong>Armes</strong>
        <ul>
          {v.armes.map((a) => (
            <li key={a.nom}>
              {a.nom}
              {a.pieces ? ` (${a.chargees ?? a.pieces} chargée${(a.chargees ?? a.pieces) > 1 ? "s" : ""} sur ${a.pieces})` : ""} : +{a.bonus}, {a.degats}, portée {a.portee} cases
              {a.servants ? `, ${a.servants} servant${a.servants > 1 ? "s" : ""}` : ""}
            </li>
          ))}
        </ul>
      </div>
      {v.defauts.length > 0 && (
        <div className="small">
          <strong>{mots.particularites}</strong>
          <ul>{v.defauts.map((d) => <li key={d.nom}><em>{d.nom}.</em> {d.texte}</li>)}</ul>
        </div>
      )}
      {v.ameliorations.length > 0 && <p className="small"><strong>Améliorations :</strong> {v.ameliorations.join(", ")}.</p>}
      {effets.length > 0 && <p className="small muted">Ce round : {effets.join(", ")}.</p>}

      <div className="stack">
        <strong className="small">Postes</strong>
        {mar.postes.map((p) => {
          const tenant = v.postes[p.id];
          const actions = mar.actions.filter((a) => a.poste === p.id);
          const jouables = desempare ? actions.filter((a) => ["reparer", "boucliers", "couper"].includes(a.id)) : actions;
          const aCible = jouables.some((a) => a.cible);
          const aArme = jouables.some((a) => a.arme || a.id === "tirer");
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
              {tenuParMoi(p.id) && jouables.length > 0 && (
                <div className="row">
                  {aCible && (
                    <select className="input small" value={cible} onChange={(e) => setCible(e.target.value)} aria-label={mots.visee}>
                      <option value="">Viser…</option>
                      {autres.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
                    </select>
                  )}
                  {aArme && v.armes.length > 1 && (
                    <select className="input small" value={arme} onChange={(e) => setArme(Number(e.target.value))} aria-label="Arme">
                      {v.armes.map((a, i) => <option key={a.nom} value={i}>{a.nom}</option>)}
                    </select>
                  )}
                  {mar.navire && jouables.some((a) => a.id === "tirer") && (
                    <select className="input small" value={viser} onChange={(e) => setViser(e.target.value as "coque" | "greement")} aria-label="Ce que vise le canon">
                      <option value="coque">Viser la coque</option>
                      <option value="greement">Viser le gréement (−2)</option>
                    </select>
                  )}
                  {jouables.map((a) => (
                    <button
                      key={a.id}
                      className="btn small primary"
                      title={a.texte}
                      disabled={a.cible && !cible}
                      onClick={() => agir("vaisseau:action", { id: v.id, action: a.id, cibleId: a.cible ? cible : undefined, arme, viser })}
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
  const { mots, navire } = marine(room.genre);
  const nous = room.vaisseaux.filter((v) => v.equipage === "groupe");
  const enVue = room.vaisseaux.filter((v) => v.equipage !== "groupe");
  if (!nous.length) return <div className="stack"><h3>{mots.nom}</h3><p className="small muted">{mots.vide}</p></div>;
  return (
    <div className="stack">
      <h3>{mots.nom}</h3>
      {nous.map((v) => <FicheVaisseau key={v.id} room={room} v={v} />)}
      {enVue.length > 0 && (
        <div className="section stack">
          <h3>En vue</h3>
          {enVue.map((v) => (
            <p key={v.id} className="small">
              <strong>{v.nom}</strong> · CA {v.ca} · coque {v.coque}/{v.coqueMax} · {mots.reserve.toLowerCase()} {v.boucliers}/{v.bouclierMax}
              {navire && etatGreement(v) === "tombe" ? " (tombé)" : ""}
              {v.grappins ? " · accroché" : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Panneau du MJ : sortir un vaisseau d'un modèle, le poser, le cacher, le réparer, ouvrir un nouveau round. */
export function VaisseauxMJ({ room }: { room: RoomView }) {
  const mar = marine(room.genre);
  const { mots } = mar;
  const [modele, setModele] = useState(mar.modeles[0].id);
  const [nom, setNom] = useState("");
  const [equipage, setEquipage] = useState<Vaisseau["equipage"]>(room.vaisseaux.some((v) => v.equipage === "groupe") ? "autre" : "groupe");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const remettreEnEtat = (v: Vaisseau) =>
    agir("vaisseau:modifier", {
      id: v.id,
      coque: v.coqueMax,
      boucliers: v.bouclierMax,
      ...(estNavire(v) ? { hommes: v.hommesMax, perdus: 0, armes: v.armes.map((a) => ({ ...a, chargees: a.pieces })) } : {}),
    });
  return (
    <div className="stack">
      <h3>{mots.nomPluriel}</h3>
      <div className="row">
        <select className="input" value={modele} onChange={(e) => setModele(e.target.value)} aria-label="Modèle">
          {mar.modeles.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        <input className="input" placeholder={mots.exemple} value={nom} onChange={(e) => setNom(e.target.value)} aria-label={`Nom ${mots.du}`} />
        <select className="input" value={equipage} onChange={(e) => setEquipage(e.target.value as Vaisseau["equipage"])} aria-label="Équipage">
          <option value="groupe">{mots.equipageGroupe}</option>
          <option value="autre">{mots.equipageAutre}</option>
        </select>
        <button className="btn primary" onClick={async () => { await agir("vaisseau:creer", { modele, nom, equipage }); setNom(""); }}>{mots.mettreEnMer}</button>
      </div>
      <p className="small muted">{mar.modeles.find((m) => m.id === modele)?.description}</p>
      {room.vaisseaux.length > 0 && (
        <div className="row">
          <button className="btn small" onClick={() => agir("vaisseau:round", {})}>{mots.nouveauRound}</button>
          {mots.finDeCombat && <button className="btn small" onClick={() => agir("vaisseau:fin", {})}>{mots.finDeCombat}</button>}
        </div>
      )}
      {room.vaisseaux.map((v) => (
        <div key={v.id} className="stack" style={{ gap: 4 }}>
          <div className="row" style={{ alignItems: "center" }}>
            <button className="btn small" onClick={() => setOuvert(ouvert === v.id ? null : v.id)} aria-expanded={ouvert === v.id}>
              {v.nom} · {v.coque}/{v.coqueMax}{v.cache ? " · caché" : ""}
            </button>
            <button className="btn small" onClick={() => agir("vaisseau:poser", v.id)} title={mots.poser}>{v.tokenId ? "Reposer" : "Poser"}</button>
            <button className="btn small" onClick={() => agir("vaisseau:modifier", { id: v.id, cache: !v.cache })}>{v.cache ? "Montrer" : "Cacher"}</button>
            <button className="btn small" onClick={() => remettreEnEtat(v)}>{mots.neuf}</button>
            <button className="btn small" onClick={() => window.confirm(`Supprimer ${v.nom} ?`) && agir("vaisseau:supprimer", v.id)}>Supprimer</button>
          </div>
          {ouvert === v.id && (
            <>
              <FicheVaisseau room={room} v={v} />
              {estNavire(v) && (
                <div className="row">
                  <label className="field small">
                    <span>Moral (0 à 10)</span>
                    <input key={`moral-${v.moral}`} className="input" type="number" min={0} max={10} defaultValue={v.moral ?? 6} onBlur={(e) => agir("vaisseau:modifier", { id: v.id, moral: Number(e.target.value) })} />
                  </label>
                  <label className="field small">
                    <span>Hommes à bord</span>
                    <input key={`hommes-${v.hommes}`} className="input" type="number" min={0} max={v.hommesMax ?? 0} defaultValue={v.hommes ?? 0} onBlur={(e) => agir("vaisseau:modifier", { id: v.id, hommes: Number(e.target.value) })} />
                  </label>
                </div>
              )}
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
