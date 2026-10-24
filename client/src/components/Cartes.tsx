// Cartes de la table, en « relique noire » : illustration plein cadre fondue dans le noir, cadre de laiton riveté,
// cartel gravé. Le MJ pioche en secret ; une carte retournée pivote devant tout le monde, puis reste posée au coin du plateau.
import { useEffect, useRef, useState } from "react";
import type { Carte, TypeDeCarte } from "../../../shared/cartes";
import type { RoomView } from "../../../shared/types";
import { send, toast } from "../store";

const LIBELLE_TYPE: Record<TypeDeCarte, string> = { rencontre: "Rencontre", evenement: "Événement", objet: "Objet" };
const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Emblème gravé des cartes sans illustration : une cloche pour l'événement, une clé pour l'objet. */
function Embleme({ type }: { type: TypeDeCarte }) {
  return (
    <svg viewBox="0 0 120 120" className="carte-embleme" aria-hidden="true">
      <defs>
        <linearGradient id={`laiton-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a8" />
          <stop offset=".45" stopColor="#b8862c" />
          <stop offset="1" stopColor="#5a3a0c" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#laiton-${type})`} strokeWidth="2" />
      <circle cx="60" cy="60" r="46" fill="none" stroke={`url(#laiton-${type})`} strokeWidth=".8" strokeDasharray="2 3" />
      {type === "evenement" ? (
        <g fill="none" stroke={`url(#laiton-${type})`} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M60 24 v6" />
          <path d="M42 74 C42 50 46 34 60 32 C74 34 78 50 78 74 L84 82 H36 Z" />
          <path d="M54 86 a6 6 0 0 0 12 0" />
          <path d="M28 52 q-6 8 0 16 M92 52 q6 8 0 16 M21 47 q-10 13 0 26 M99 47 q10 13 0 26" strokeWidth="2" />
        </g>
      ) : (
        <g fill="none" stroke={`url(#laiton-${type})`} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="60" cy="38" r="13" />
          <circle cx="60" cy="38" r="5" />
          <path d="M60 51 V92 M60 72 h11 M60 82 h8 M60 92 h12" />
        </g>
      )}
    </svg>
  );
}

/** Face d'une carte. La largeur vient du parent ; tout le reste se règle en pourcentage de la carte. */
export function CarteFace({ carte }: { carte: Carte }) {
  return (
    <div className={`carte carte-${carte.type}`}>
      {carte.image ? <div className="carte-art" style={{ backgroundImage: `url(${carte.image})` }} /> : <div className="carte-art carte-art-cuir"><Embleme type={carte.type} /></div>}
      <span className="carte-rivet r1" />
      <span className="carte-rivet r2" />
      <span className="carte-rivet r3" />
      <span className="carte-rivet r4" />
      <div className="carte-type">{LIBELLE_TYPE[carte.type]}</div>
      <div className="carte-bas">
        <div className="carte-cartel">
          <h3>{carte.titre}</h3>
        </div>
        <div className="carte-sous">{carte.sousTitre}</div>
        <p className="carte-texte">{carte.texte}</p>
        {carte.effet && <p className="carte-effet">{carte.effet}</p>}
      </div>
    </div>
  );
}

/** Dos de carte : cuir noir, rosace et couronne de laiton. */
export function CarteDos({ label }: { label?: string }) {
  return (
    <div className="carte carte-dos">
      <span className="carte-rivet r1" />
      <span className="carte-rivet r2" />
      <span className="carte-rivet r3" />
      <span className="carte-rivet r4" />
      <svg viewBox="0 0 120 190" className="carte-dos-motif" aria-hidden="true">
        <defs>
          <linearGradient id="laiton-dos" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe7a8" />
            <stop offset=".5" stopColor="#a87a2c" />
            <stop offset="1" stopColor="#4a3008" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="100" height="170" rx="6" fill="none" stroke="url(#laiton-dos)" strokeWidth="1.2" />
        <rect x="15" y="15" width="90" height="160" rx="4" fill="none" stroke="url(#laiton-dos)" strokeWidth=".5" />
        <g transform="translate(60 95)" fill="none" stroke="url(#laiton-dos)" strokeWidth="1.1">
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} rx="9" ry="30" transform={`rotate(${i * 15})`} />
          ))}
          <circle r="34" />
          <circle r="12" fill="#1a1008" />
          <path d="M-8 -2 l3 -8 l5 5 l5 -5 l3 8 Z" fill="url(#laiton-dos)" stroke="none" />
          <rect x="-6" y="0" width="12" height="7" rx="1" fill="url(#laiton-dos)" stroke="none" />
        </g>
      </svg>
      {label && <div className="carte-dos-label">{label}</div>}
    </div>
  );
}

/** Pioches du MJ, posées sur la table au bord du plateau. Le MJ voit sa carte avant de décider de la retourner. */
export function CarteRetournee({ room }: { room: RoomView }) {
  const carte = room.carte;
  const [grande, setGrande] = useState(false);
  const vu = useRef<number | null>(carte?.at ?? null);
  useEffect(() => {
    if (carte && carte.at !== vu.current) {
      vu.current = carte.at;
      setGrande(true);
    }
    if (!carte) setGrande(false);
  }, [carte?.at]);
  useEffect(() => {
    if (!grande) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGrande(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grande]);
  if (!carte) return null;
  return (
    <>
      {!grande && (
        <button className="carte-posee" onClick={() => setGrande(true)} aria-label={`Revoir la carte : ${carte.titre}`}>
          <CarteFace carte={carte} />
        </button>
      )}
      {grande && (
        <div className="carte-voile" role="dialog" aria-label={`Carte retournée : ${carte.titre}`} onClick={() => setGrande(false)}>
          <div className="carte-scene" onClick={(e) => e.stopPropagation()}>
            <div className={`carte-grande carte-pivot${reducedMotion ? " sans-pivot" : ""}`} key={carte.at}>
              <div className="carte-pivot-dos">
                <CarteDos />
              </div>
              <div className="carte-pivot-face">
                <CarteFace carte={carte} />
                <span className="carte-eclat" />
              </div>
            </div>
            <div className="carte-actions">
              <button className="btn" onClick={() => setGrande(false)}>Poser sur la table</button>
              {room.you.isGM && (
                <button className="btn ghost" onClick={() => send("carte:ranger")}>Ranger la carte</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
