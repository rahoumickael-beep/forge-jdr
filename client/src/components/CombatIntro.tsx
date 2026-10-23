import { useEffect, useRef, useState } from "react";
import { BESTIARY, crLabel } from "../../../shared/bestiary";
import { charte } from "../../../shared/charte";
import type { RoomView } from "../../../shared/types";

/** Durée de l'animation d'ouverture du combat, en millisecondes. */
export const INTRO_MS = 2900;

/** Coup sourd du sceau puis craquement, synthétisés (pas de fichier son). */
function playSeal() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const thud = ctx.createOscillator();
    const g = ctx.createGain();
    thud.frequency.setValueAtTime(110, t);
    thud.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    thud.connect(g).connect(ctx.destination);
    thud.start(t);
    thud.stop(t + 0.55);
    // Craquement : bruit filtré, une seconde plus tard.
    const len = Math.floor(ctx.sampleRate * 0.25);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3 * (Math.random() < 0.08 ? 1 : 0.25);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    src.connect(hp).connect(g2).connect(ctx.destination);
    src.start(t + 1.05);
    setTimeout(() => void ctx.close(), 2000);
  } catch {
    /* pas de son : tant pis */
  }
}

/** Bord irrégulier d'un sceau de cire, toujours le même pour un combat donné. */
function sealPath(seed: number) {
  let s = seed || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const r = 88 + rnd() * 9 - (i % 3 === 0 ? 5 : 0);
    pts.push(`${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/**
 * Ouverture du combat : un sceau de cire frappe l'écran, se fend, et le nom de l'adversaire apparaît.
 * Couleurs, police et ornement viennent de la charte du genre, comme le reste de la table.
 */
export function CombatIntro({ room }: { room: RoomView }) {
  const combat = room.combat;
  const seen = useRef<string | null>(combat?.id ?? null); // pas d'animation pour un combat déjà en cours à l'arrivée
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    if (!combat || combat.id === seen.current) return;
    seen.current = combat.id;
    if (Date.now() - combat.startedAt > 15000) return;
    setPlaying(combat.id);
    playSeal();
    const t = setTimeout(() => setPlaying(null), INTRO_MS);
    return () => clearTimeout(t);
  }, [combat]);

  if (!playing || !combat) return null;
  const first = room.tokens.find((t) => t.id === combat.monsterIds[0]);
  const creature = first?.creatureId ? BESTIARY.find((c) => c.id === first.creatureId) : undefined;
  const others = combat.monsterIds.length - 1;
  const name = first?.name ?? "Quelque chose approche";
  const sub = creature ? `${creature.type.charAt(0).toUpperCase()}${creature.type.slice(1)} · Puissance ${crLabel(creature.cr)}` : "";
  const c = charte(room.genre);
  const seed = parseInt(combat.id.slice(-5), 36);

  return (
    <div className="combat-intro" role="alert" aria-live="assertive" onClick={() => setPlaying(null)}>
      <div className="ci-vignette" />
      <div className="ci-title">
        <div className="ci-kicker">{combat.cause === "auto" ? "Rencontre" : "Combat"}</div>
        <div className="ci-name gilded">{name}</div>
        {sub && <div className="ci-sub">{sub}</div>}
        {others > 0 && <div className="ci-sub">et {others} autre{others > 1 ? "s" : ""}</div>}
      </div>
      <svg className="ci-seal" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="ci-wax" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#fff" stopOpacity=".35" />
            <stop offset=".3" stopColor="var(--blood)" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".55" />
          </radialGradient>
          <filter id="ci-organic" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed={seed % 97} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
          </filter>
          <filter id="ci-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="g" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="ci-emboss"><feGaussianBlur stdDeviation="1.4" /></filter>
          <clipPath id="ci-left"><path d="M0 0 H104 L96 60 L108 100 L92 140 L102 200 H0 Z" /></clipPath>
          <clipPath id="ci-right"><path d="M104 0 H200 V200 H102 L92 140 L108 100 L96 60 Z" /></clipPath>
        </defs>
        {(["left", "right"] as const).map((side) => (
          <g key={side} className={`ci-half ci-${side}`} clipPath={`url(#ci-${side})`}>
            <g filter="url(#ci-organic)">
              <path d={sealPath(seed)} fill="var(--blood)" />
              <path d={sealPath(seed)} fill="url(#ci-wax)" />
              <path d={sealPath(seed)} fill="#000" filter="url(#ci-grain)" />
              <circle cx="31" cy="168" r="7" fill="var(--blood)" />
              <circle cx="176" cy="44" r="4.5" fill="var(--blood)" />
            </g>
            <circle cx="100" cy="101.5" r="62" fill="none" stroke="#000000" strokeOpacity=".45" strokeWidth="5" filter="url(#ci-emboss)" />
            <circle cx="100" cy="98.5" r="62" fill="none" stroke="#ffffff" strokeOpacity=".16" strokeWidth="2.5" filter="url(#ci-emboss)" />
            <circle cx="100" cy="100" r="54" fill="#00000022" />
            <text x="100" y="122" textAnchor="middle" fontSize="64" fill="#00000066" style={{ fontFamily: `"${c.polices.deco}", serif` }}>{c.ornements.chapitre}</text>
            <text x="99" y="120" textAnchor="middle" fontSize="64" fill="#ffffff30" style={{ fontFamily: `"${c.polices.deco}", serif` }}>{c.ornements.chapitre}</text>
          </g>
        ))}
        <path className="ci-crack" d="M104 0 L96 60 L108 100 L92 140 L102 200" fill="none" stroke="#1a0805" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
