// Cartes à collectionner : la collection du joueur, l'ouverture d'un paquet (sceau, éventail, retournement), et la
// distribution par le MJ. Grammaire des raretés façon Riftbound, en « relique noire » : le métal du cadre et la forme de
// la gemme disent la rareté sans qu'on lise ; plus la carte est rare, plus le cadre s'efface devant la peinture.
import { useEffect, useMemo, useRef, useState } from "react";
import { catalogue, carteDuCatalogue, FAMILLES, RARETES, type CarteDeCollection, type Exemplaire, type Famille } from "../../../shared/collection";
import type { RoomView } from "../../../shared/types";
import { send, toast } from "../store";
import { CarteDos } from "./Cartes";

const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// ——— Sons, synthétisés (pas de fichier) ———
let ctx: AudioContext | null = null;
function son(fn: (c: AudioContext, t: number) => void) {
  try {
    ctx ??= new AudioContext();
    fn(ctx, ctx.currentTime);
  } catch {
    // pas de son : tant pis
  }
}
/** Le sceau de cire qui casse : un craquement sec. */
const sonSceau = () =>
  son((c, t) => {
    const len = Math.floor(c.sampleRate * 0.18);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3 * (Math.random() < 0.12 ? 1 : 0.3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 700;
    const g = c.createGain();
    g.gain.value = 0.5;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  });
/** Une carte qui glisse ou se retourne : un souffle de papier. */
const sonCarte = () =>
  son((c, t) => {
    const len = Math.floor(c.sampleRate * 0.12);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len) * 0.5;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2400;
    const g = c.createGain();
    g.gain.value = 0.25;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  });
/** La rare, et plus encore la relique : une cloche grave. */
const sonCloche = (relique: boolean) =>
  son((c, t) => {
    for (const [f, a] of relique ? [[196, 0.32], [392, 0.16], [587, 0.1], [783, 0.06]] : [[294, 0.22], [588, 0.1], [882, 0.05]]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (relique ? 3.2 : 1.8));
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 3.3);
    }
  });

/** Emblème gravé d'une carte sans peinture, selon sa famille. */
export function EmblemeFamille({ famille }: { famille: Famille }) {
  const id = `laiton-fam-${famille}`;
  return (
    <svg viewBox="0 0 120 120" className="carte-embleme" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a8" />
          <stop offset=".45" stopColor="#b8862c" />
          <stop offset="1" stopColor="#5a3a0c" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#${id})`} strokeWidth="2" />
      <circle cx="60" cy="60" r="46" fill="none" stroke={`url(#${id})`} strokeWidth=".8" strokeDasharray="2 3" />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        {famille === "objet" && (
          <>
            <circle cx="60" cy="38" r="13" />
            <circle cx="60" cy="38" r="5" />
            <path d="M60 51 V92 M60 72 h11 M60 82 h8 M60 92 h12" />
          </>
        )}
        {famille === "allie" && (
          <>
            <path d="M60 30 c-10 0 -16 8 -16 18 c0 9 6 16 16 16 c10 0 16 -7 16 -16 c0 -10 -6 -18 -16 -18 Z" />
            <path d="M34 92 c2 -16 12 -24 26 -24 c14 0 24 8 26 24" />
            <path d="M24 60 l8 -4 M96 60 l-8 -4" strokeWidth="2" />
          </>
        )}
        {famille === "faveur" && (
          <>
            <circle cx="60" cy="58" r="22" />
            <path d="M46 76 l-6 18 l10 -5 l6 9 l4 -18 M74 76 l6 18 l-10 -5 l-6 9 l-4 -18" strokeWidth="2.4" />
            <path d="M52 50 l3 -8 l5 5 l5 -5 l3 8 Z M52 56 h16 v6 h-16 Z" strokeWidth="2" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Une carte de collection. `inclinable` : le reflet doré des rares suit la souris. */
export function CarteCollec({ carte, ex, inclinable = false }: { carte: CarteDeCollection; ex?: Exemplaire; inclinable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const brille = carte.rarete === "rare" || carte.rarete === "relique";
  const bouge = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !inclinable) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
  };
  const repos = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={`carte carte-col rar-${carte.rarete} fam-${carte.famille}${ex?.signature ? " signee" : ""}${inclinable ? " inclinable" : ""}`} onPointerMove={bouge} onPointerLeave={repos}>
      {carte.image ? (
        <div className="carte-art" style={{ backgroundImage: `url(/cartes/${carte.image}.webp)` }} />
      ) : (
        <div className="carte-art carte-art-cuir">
          <EmblemeFamille famille={carte.famille} />
        </div>
      )}
      {brille && <span className="carte-foil" />}
      <span className="carte-rivet r1" />
      <span className="carte-rivet r2" />
      <span className="carte-rivet r3" />
      <span className="carte-rivet r4" />
      <div className="carte-type">{FAMILLES.find((f) => f.id === carte.famille)?.label}</div>
      <div className="carte-bas">
        <div className="carte-cartel">
          <h3>{carte.nom}</h3>
        </div>
        <div className="carte-sous">
          {RARETES.find((r) => r.id === carte.rarete)?.label} · {carte.recharge === "une-fois" ? "une fois" : "par séance"}
        </div>
        <p className="carte-texte">{carte.texte}</p>
        <p className="carte-effet">{carte.usage}</p>
      </div>
      <span className="carte-gemme" title={RARETES.find((r) => r.id === carte.rarete)?.label} />
      {ex?.signature && <span className="carte-signature">Offerte par le MJ</span>}
    </div>
  );
}

/** Ouverture d'un paquet : le sceau, l'éventail face cachée, puis chaque carte qu'on retourne. */
function Ouverture({ ids, genre, onFin }: { ids: string[]; genre: RoomView["genre"]; onFin: () => void }) {
  const cartes = useMemo(() => ids.map((id) => carteDuCatalogue(genre, id)!).filter(Boolean), [ids, genre]);
  const [etape, setEtape] = useState<"scelle" | "ouvert" | "eventail">(reducedMotion ? "eventail" : "scelle");
  const [vues, setVues] = useState<boolean[]>(() => cartes.map(() => reducedMotion));
  const [grande, setGrande] = useState<number | null>(null);
  const toutes = vues.every(Boolean);

  const briser = () => {
    if (etape !== "scelle") return;
    sonSceau();
    setEtape("ouvert");
    setTimeout(() => {
      setEtape("eventail");
      sonCarte();
    }, 900);
  };
  const retourner = (i: number) => {
    if (vues[i]) return setGrande(i);
    const c = cartes[i];
    if (c.rarete === "rare" || c.rarete === "relique") sonCloche(c.rarete === "relique");
    else sonCarte();
    setVues((v) => v.map((x, k) => x || k === i));
  };
  const toutReveler = () => {
    if (etape === "scelle") briser();
    const haute = cartes.findIndex((c, i) => !vues[i] && (c.rarete === "rare" || c.rarete === "relique"));
    if (haute >= 0) sonCloche(cartes[haute].rarete === "relique");
    setEtape("eventail");
    setVues(cartes.map(() => true));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (etape === "scelle") briser();
        else if (!toutes) retourner(vues.findIndex((v) => !v));
        else onFin();
      }
      if (e.key === "Escape") setGrande(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="ouverture" role="dialog" aria-label="Ouverture d'un paquet de cartes">
      {etape !== "eventail" ? (
        <button className={`paquet ${etape}`} onClick={briser} aria-label="Briser le sceau du paquet">
          <span className="paquet-rabat" />
          <span className="paquet-titre">Aubreterre</span>
          <span className="paquet-sous">six cartes</span>
          <span className="paquet-sceau" />
          {etape === "scelle" && <span className="paquet-invite">Briser le sceau</span>}
        </button>
      ) : (
        <div className="eventail">
          {cartes.map((c, i) => (
            <button
              key={i}
              className={`eventail-carte lueur-${c.rarete}${vues[i] ? " vue" : ""}${i === cartes.length - 1 ? " derniere" : ""}`}
              style={{ ["--i" as string]: i, ["--n" as string]: cartes.length }}
              onClick={() => retourner(i)}
              aria-label={vues[i] ? `${c.nom}, ${RARETES.find((r) => r.id === c.rarete)?.label}` : "Retourner cette carte"}
            >
              <span className="eventail-pivot">
                <span className="eventail-dos">
                  <CarteDos />
                </span>
                <span className="eventail-face">
                  <CarteCollec carte={c} />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="ouverture-actions">
        {!toutes && <button className="btn" onClick={toutReveler}>Tout révéler</button>}
        {toutes && <button className="btn primary" onClick={onFin}>Ranger dans ma collection</button>}
      </div>
      {grande !== null && (
        <div className="carte-voile" onClick={() => setGrande(null)}>
          <div className="carte-grande" onClick={(e) => e.stopPropagation()}>
            <CarteCollec carte={cartes[grande]} inclinable />
          </div>
        </div>
      )}
    </div>
  );
}

/** Onglet « Cartes » du joueur : ses paquets, sa collection, et les cartes qu'il joue en partie. */
export function CollectionPanel({ room }: { room: RoomView }) {
  const col = room.collections?.[room.you.id];
  const [ouverture, setOuverture] = useState<string[] | null>(null);
  const [famille, setFamille] = useState<Famille | "toutes">("toutes");
  const [vue, setVue] = useState<number | null>(null);
  const cat = catalogue(room.genre);
  if (!cat.length) return <div className="stack"><h3>Cartes</h3><p className="small muted">Ce monde n'a pas encore de cartes à collectionner.</p></div>;
  const cartes = (col?.cartes ?? []).map((ex, index) => ({ ex, index, carte: carteDuCatalogue(room.genre, ex.id)! })).filter((x) => x.carte);
  // Une pile par carte (et par signature), dans l'ordre des raretés, les plus rares d'abord.
  const ordre = (r: string) => RARETES.findIndex((x) => x.id === r);
  const piles = new Map<string, typeof cartes>();
  for (const x of cartes.filter((x) => famille === "toutes" || x.carte.famille === famille)) {
    const k = `${x.carte.id}${x.ex.signature ? "#s" : ""}`;
    piles.set(k, [...(piles.get(k) ?? []), x]);
  }
  const triees = [...piles.values()].sort((a, b) => ordre(b[0].carte.rarete) - ordre(a[0].carte.rarete) || a[0].carte.nom.localeCompare(b[0].carte.nom));
  const differentes = new Set(cartes.map((x) => x.carte.id)).size;
  const ouvrir = () =>
    send("paquet:ouvrir").then((r) => {
      if (!r.ok) return toast(r.error ?? "Le paquet ne s'ouvre pas.");
      setOuverture((r as unknown as { cartes: string[] }).cartes);
    });
  const enVue = vue !== null ? cartes.find((x) => x.index === vue) : undefined;
  return (
    <div className="stack">
      <h3>Mes cartes</h3>
      <div className="collection-tete">
        <div className="paquet-mini" aria-hidden="true">
          <span className="paquet-sceau" />
        </div>
        <div>
          <p className="small" style={{ margin: 0 }}>
            {col?.paquets ? `${col.paquets} paquet${col.paquets > 1 ? "s" : ""} à ouvrir.` : "Aucun paquet à ouvrir."} {differentes}/{cat.length} cartes différentes.
          </p>
          <button className="btn primary" disabled={!col?.paquets} onClick={ouvrir}>Ouvrir un paquet</button>
        </div>
      </div>
      <div className="row" role="group" aria-label="Famille de cartes">
        {[{ id: "toutes" as const, label: "Toutes" }, ...FAMILLES].map((f) => (
          <button key={f.id} className={`btn small${famille === f.id ? " active" : ""}`} aria-pressed={famille === f.id} onClick={() => setFamille(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {triees.length === 0 && <p className="small muted">Ta collection est vide. Le MJ donne des paquets, et chaque fin de séance en apporte un.</p>}
      <div className="collection-grille">
        {triees.map((pile) => {
          const x = pile.find((p) => !p.ex.utilisee) ?? pile[0];
          return (
            <button key={`${x.carte.id}${x.ex.signature ? "#s" : ""}`} className={`collection-pile${pile.every((p) => p.ex.utilisee) ? " epuisee" : ""}`} onClick={() => setVue(x.index)} aria-label={`${x.carte.nom}, ${pile.length} exemplaire${pile.length > 1 ? "s" : ""}`}>
              <CarteCollec carte={x.carte} ex={x.ex} />
              {pile.length > 1 && <span className="collection-nombre">×{pile.length}</span>}
            </button>
          );
        })}
      </div>
      {enVue && (
        <div className="carte-voile" role="dialog" aria-label={enVue.carte.nom} onClick={() => setVue(null)}>
          <div className="carte-scene" onClick={(e) => e.stopPropagation()}>
            <div className="carte-grande">
              <CarteCollec carte={enVue.carte} ex={enVue.ex} inclinable />
            </div>
            <div className="carte-actions">
              <button
                className="btn primary"
                disabled={!!enVue.ex.utilisee}
                onClick={() => send("collection:jouer", { index: enVue.index }).then((r) => (r.ok ? setVue(null) : toast(r.error ?? "La carte n'a pas été jouée.")))}
              >
                {enVue.ex.utilisee ? "Déjà jouée cette séance" : enVue.carte.recharge === "une-fois" ? "Jouer (la carte part)" : "Jouer (revient à la prochaine séance)"}
              </button>
              <button className="btn ghost" onClick={() => setVue(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
      {ouverture && <Ouverture ids={ouverture} genre={room.genre} onFin={() => setOuverture(null)} />}
    </div>
  );
}

/** Pour le MJ : donner des paquets et offrir des cartes signées. */
export function DistributionCartes({ room }: { room: RoomView }) {
  const joueurs = room.players.filter((p) => !p.isGM);
  const cat = catalogue(room.genre);
  const [cible, setCible] = useState(joueurs[0]?.id ?? "");
  const [offerte, setOfferte] = useState(cat[0]?.id ?? "");
  if (!cat.length) return null;
  return (
    <div className="section stack">
      <h3>Cartes à collectionner</h3>
      {joueurs.length === 0 && <p className="small muted">Personne n'est encore assis à la table.</p>}
      {joueurs.map((j) => {
        const c = room.collections?.[j.id];
        return (
          <div key={j.id} className="token-row">
            <span className="name">
              {j.name} <span className="small muted">· {c?.cartes.length ?? 0} cartes, {c?.paquets ?? 0} paquet{(c?.paquets ?? 0) > 1 ? "s" : ""} fermé{(c?.paquets ?? 0) > 1 ? "s" : ""}</span>
            </span>
            <button className="btn small" onClick={() => send("paquet:donner", { playerId: j.id })}>+1 paquet</button>
          </div>
        );
      })}
      {joueurs.length > 1 && <button className="btn" onClick={() => send("paquet:donner", {})}>Un paquet pour chacun</button>}
      {joueurs.length > 0 && (
        <>
          <p className="small muted">Une carte signée est un cadeau du MJ : on ne la trouve dans aucun paquet sous cette forme.</p>
          <div className="row">
            <select className="input" aria-label="Carte à offrir" value={offerte} onChange={(e) => setOfferte(e.target.value)}>
              {RARETES.slice()
                .reverse()
                .flatMap((r) => cat.filter((c) => c.rarete === r.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({RARETES.find((r) => r.id === c.rarete)?.label})
                  </option>
                ))}
            </select>
            <select className="input" aria-label="Joueur" value={cible} onChange={(e) => setCible(e.target.value)}>
              {joueurs.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
          <button className="btn" disabled={!cible || !offerte} onClick={() => send("carte:offrir", { playerId: cible, id: offerte })}>Offrir la carte signée</button>
        </>
      )}
    </div>
  );
}
