// Créateur de personnage pas à pas, façon Baldur's Gate 3.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatMod, modifier, proficiency } from "../../../shared/personnages";
import { getGenre } from "../../../shared/genres";
import { uid } from "../../../shared/random";
import {
  backgroundsFor,
  originsFor,
  PERSONALITY,
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  STANDARD_ARRAY,
  subclassLevel,
  type Origin,
  type StatBonus,
  type SubOrigin,
} from "../../../shared/origins";
import { classesFor, type CharacterClass, type Power, type Subclass } from "../../../shared/rules";
import type { Character, RoomView } from "../../../shared/types";
import { send, toast } from "../store";

const STEPS = ["Origine", "Classe", "Historique", "Caractéristiques", "Compétences", "Personnalité", "Apparence", "Récapitulatif"] as const;
type TraitKey = keyof typeof PERSONALITY;
const TRAIT_LABELS: Record<TraitKey, string> = { trait: "Trait de caractère", ideal: "Idéal", bond: "Lien", flaw: "Défaut" };

function mergeBonus(...list: (StatBonus | undefined)[]): number[] {
  const out = [0, 0, 0, 0, 0, 0];
  for (const b of list) if (b) for (const [k, v] of Object.entries(b)) out[Number(k)] += v ?? 0;
  return out;
}

function armorClass(cls: CharacterClass, sub: SubOrigin | undefined, subclass: Subclass | undefined, mods: number[]): number {
  const [, dex, con, , wis] = mods;
  const armor = cls.armor.toLowerCase();
  const gear = cls.startingGear.join(" ").toLowerCase();
  let ac = 10 + dex;
  if (cls.id.endsWith("moine")) ac = 10 + dex + wis;
  else if (cls.id.endsWith("barbare")) ac = 10 + dex + con;
  else if (/toutes les armures|lourde/.test(armor)) ac = 16;
  else if (/intermédiaire/.test(armor)) ac = 14 + Math.min(dex, 2);
  else if (/légère/.test(armor)) ac = 11 + dex;
  if (sub?.id === "os-sec" || subclass?.id === "ensorceleuse-draconique") ac = Math.max(ac, 13 + dex);
  if (/bouclier/.test(armor) && /bouclier/.test(gear)) ac += 2;
  return ac;
}

function hitPoints(cls: CharacterClass, sub: SubOrigin | undefined, subclass: Subclass | undefined, level: number, con: number): number {
  const perLevel = cls.hitDie / 2 + 1 + con;
  const extra = (sub?.hpPerLevel ?? 0) + (subclass?.id === "ensorceleuse-draconique" ? 1 : 0);
  return Math.max(1, cls.hitDie + con + (level - 1) * perLevel + extra * level);
}

/** Réduit une image envoyée par le joueur à un petit portrait JPEG. */
async function toPortrait(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const g = cv.getContext("2d")!;
  const s = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * s;
  const h = bitmap.height * s;
  g.drawImage(bitmap, (size - w) / 2, (size - h) / 3, w, h);
  return cv.toDataURL("image/jpeg", 0.82);
}

export function CharacterCreator({ room, onDone, onClose }: { room: RoomView; onDone: (c: Character) => void; onClose: () => void }) {
  const genre = getGenre(room.genre);
  const statNames = genre.stats;
  const origins = originsFor(room.genre);
  const classes = classesFor(room.genre);
  const backgrounds = backgroundsFor(room.genre);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const method = room.abilityMethod ?? "points";

  const [step, setStep] = useState(0);
  const [originId, setOriginId] = useState(origins[0]?.id ?? "");
  const [subId, setSubId] = useState(origins[0]?.subs[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subclassId, setSubclassId] = useState("");
  const [bgId, setBgId] = useState(backgrounds[0]?.id ?? "");
  const [base, setBase] = useState<number[]>([8, 8, 8, 8, 8, 8]);
  const [pool, setPool] = useState<number[] | null>(method === "fixe" ? STANDARD_ARRAY : null);
  const [assign, setAssign] = useState<(number | null)[]>([null, null, null, null, null, null]);
  const [moveBonus, setMoveBonus] = useState(false);
  const [bonus2, setBonus2] = useState(0);
  const [bonus1, setBonus1] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [traits, setTraits] = useState<Record<TraitKey, string>>({ trait: "", ideal: "", bond: "", flaw: "" });
  const [appearance, setAppearance] = useState("");
  const [portrait, setPortrait] = useState<string | undefined>();
  const [rolling, setRolling] = useState(false);

  const origin: Origin | undefined = origins.find((o) => o.id === originId);
  const sub = origin?.subs.find((s) => s.id === subId) ?? origin?.subs[0];
  const cls = classes.find((c) => c.id === classId);
  const level = room.level;
  // La sous-classe n'existe qu'à partir de son niveau (1, 2 ou 3 selon la classe) ; la première est prise par défaut.
  const subclassOpen = !!cls && cls.subclasses.length > 0 && level >= subclassLevel(cls.id);
  const subclass = subclassOpen ? (cls!.subclasses.find((s) => s.id === subclassId) ?? cls!.subclasses[0]) : undefined;
  const bg = backgrounds.find((b) => b.id === bgId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Accolades : scrollTo renvoie une promesse dans les Chromium récents, qu'un effet ne doit pas renvoyer.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(".cc-body")?.scrollTo({ top: 0 });
  }, [step]);

  // Scores avant bonus d'origine
  const raw = method === "points" ? base : assign.map((i) => (i === null || !pool ? 8 : pool[i]));
  const bonus = moveBonus ? mergeBonus({ [bonus2]: 2 } as StatBonus, { [bonus1]: 1 } as StatBonus) : mergeBonus(origin?.bonus, sub?.bonus);
  const scores = raw.map((v, i) => v + bonus[i]);
  const mods = scores.map(modifier);
  const spent = base.reduce((sum, v) => sum + POINT_BUY_COST[v], 0);
  const scoresReady = method === "points" ? spent <= POINT_BUY_BUDGET : !!pool && assign.every((a) => a !== null);

  const fixedSkills = bg?.skills ?? [];
  const skillChoices = (cls?.skills.from ?? []).filter((s) => !fixedSkills.includes(s));
  const skillCount = cls?.skills.choose ?? 0;

  const hp = cls ? hitPoints(cls, sub, subclass, level, mods[2]) : 0;
  const ac = cls ? armorClass(cls, sub, subclass, mods) : 10;
  const speed = sub?.speed ?? origin?.speed ?? 6;
  const powers = useMemo(() => (cls?.powers ?? []).filter((p) => p.level <= level), [cls, level]);
  const subPowers = useMemo(() => (subclass?.powers ?? []).filter((p) => p.level <= level), [subclass, level]);

  const canNext = [
    !!origin && !!sub,
    !!cls,
    !!bg,
    scoresReady,
    skills.length === Math.min(skillCount, skillChoices.length),
    name.trim().length > 0,
    true,
    true,
  ][step];

  async function rollScores() {
    setRolling(true);
    const values: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await send("dice:roll", { expr: "4d6kh3", label: `Caractéristique ${i + 1} de ${name || room.you.name}` });
      if (!r.ok || typeof r.total !== "number") break;
      values.push(r.total);
    }
    setRolling(false);
    if (values.length === 6) {
      setPool(values.sort((a, b) => b - a));
      setAssign([null, null, null, null, null, null]);
    }
  }

  function build(): Character {
    const statObj = Object.fromEntries(statNames.map((n, i) => [n, scores[i]]));
    const t = traits;
    return {
      id: uid("c_"),
      name: name.trim(),
      genre: room.genre,
      level,
      archetype: cls!.name,
      classId: cls!.id,
      subclass: subclass?.id,
      origin: sub ? sub.name : origin!.name,
      subOrigin: sub?.id,
      background: bg?.name,
      description: appearance.trim() || `${sub?.name ?? origin?.name}, ${cls!.name.toLowerCase()}.`,
      backstory: bg ? `${bg.name}. ${bg.blurb} ${bg.feature.name} : ${bg.feature.text}` : "",
      personality: [t.trait, t.ideal && `Idéal : ${t.ideal}`, t.bond && `Lien : ${t.bond}`, t.flaw && `Défaut : ${t.flaw}`].filter(Boolean).join(" "),
      traits: t,
      stats: statObj,
      hp,
      hpMax: hp,
      ac,
      speed,
      skills: [...fixedSkills, ...skills],
      equipment: [...cls!.startingGear, ...(bg?.gear ?? [])],
      abilities: [
        ...powers.map((p) => p.name),
        ...subPowers.map((p) => p.name),
        ...(origin?.traits ?? []).map((x) => x.name),
        ...(sub?.traits ?? []).map((x) => x.name),
        ...(bg ? [bg.feature.name] : []),
      ],
      appearance: appearance.trim() || undefined,
      portrait,
    };
  }

  return (
    <div className="rb-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="rb-dialog cc-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="rb-dialog-head">
          <h2 id={titleId} className="gilded">Créer un personnage</h2>
          <span className="muted small">{genre.label} · niveau {level}</span>
          <button type="button" className="btn small" onClick={onClose}>Fermer <kbd>Échap</kbd></button>
        </header>
        <div className="cc-layout">
          <nav className="cc-steps" aria-label="Étapes">
            <ol>
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button type="button" className="rb-toc-item" aria-current={i === step ? "step" : undefined} disabled={i > step} onClick={() => setStep(i)}>
                    <span className="rb-toc-num">{i + 1}</span>
                    {s}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="cc-body">
            {step === 0 && (
              <section>
                <h3 className="cc-title">D'où viens-tu ?</h3>
                <div className="cc-cards">
                  {origins.map((o) => (
                    <button key={o.id} type="button" className="cc-card" aria-pressed={o.id === originId} onClick={() => { setOriginId(o.id); setSubId(o.subs[0]?.id ?? ""); }}>
                      <strong>{o.name}</strong>
                      {o.unique && <span className="cc-tag">Propre à Aubreterre</span>}
                      <span className="cc-card-text">{o.blurb}</span>
                    </button>
                  ))}
                </div>
                {origin && (
                  <div className="paper cc-detail">
                    <h4>{origin.name}</h4>
                    <p className="cc-meta">
                      Déplacement {(sub?.speed ?? origin.speed) * 1.5} m{origin.darkvision ? ` · vision dans le noir ${origin.darkvision * 1.5} m` : ""}
                      {" · "}
                      {bonusText(mergeBonus(origin.bonus, sub?.bonus), statNames)}
                    </p>
                    <TraitList traits={origin.traits} />
                    <h4>Lignée</h4>
                    <div className="cc-cards two">
                      {origin.subs.map((s) => (
                        <button key={s.id} type="button" className="cc-card light" aria-pressed={s.id === sub?.id} onClick={() => setSubId(s.id)}>
                          <strong>{s.name}</strong>
                          <span className="cc-card-text">{s.blurb}</span>
                        </button>
                      ))}
                    </div>
                    {sub && <TraitList traits={sub.traits} />}
                  </div>
                )}
              </section>
            )}

            {step === 1 && (
              <section>
                <h3 className="cc-title">Quelle est ta voie ?</h3>
                <div className="cc-cards">
                  {classes.map((c) => (
                    <button key={c.id} type="button" className="cc-card" aria-pressed={c.id === classId} onClick={() => { setClassId(c.id); setSubclassId(""); setSkills([]); }}>
                      <strong>{c.name}</strong>
                      <span className="cc-tag">{c.role}</span>
                      <span className="cc-card-text">{c.pitch}</span>
                    </button>
                  ))}
                </div>
                {cls && (
                  <div className="paper cc-detail">
                    <h4>{cls.name}</h4>
                    <p className="cc-meta">
                      Dé de vie d{cls.hitDie} · {cls.mainStats.join(" et ")} · sauvegardes : {cls.saves.join(", ")}
                    </p>
                    <p className="small">{cls.armor}. {cls.weapons}.</p>
                    <h4>Pouvoirs jusqu'au niveau {level}</h4>
                    <PowerList powers={powers} />
                    {subclassOpen ? (
                      <>
                        <h4>{cls.subclassTitle}</h4>
                        <div className="cc-cards two" role="group" aria-label={cls.subclassTitle}>
                          {cls.subclasses.map((s) => (
                            <button key={s.id} type="button" className="cc-card light" aria-pressed={s.id === subclass?.id} onClick={() => setSubclassId(s.id)}>
                              <strong>{s.name}</strong>
                              <span className="cc-card-text">{s.pitch}</span>
                            </button>
                          ))}
                        </div>
                        {subclass && (
                          <>
                            <p className="small">{subclass.description}</p>
                            <PowerList powers={subPowers} />
                            {subclass.powers.some((p) => p.level > level) && (
                              <p className="small muted">Plus tard : {subclass.powers.filter((p) => p.level > level).map((p) => `${p.name} (niv. ${p.level})`).join(", ")}.</p>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      cls.subclasses.length > 0 && (
                        <p className="small muted">
                          {cls.subclassTitle} au niveau {subclassLevel(cls.id)} : {cls.subclasses.map((s) => s.name).join(" ou ")}.
                        </p>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section>
                <h3 className="cc-title">Qu'as-tu fait avant ?</h3>
                <div className="cc-cards">
                  {backgrounds.map((b) => (
                    <button key={b.id} type="button" className="cc-card" aria-pressed={b.id === bgId} onClick={() => { setBgId(b.id); setSkills([]); }}>
                      <strong>{b.name}</strong>
                      <span className="cc-card-text">{b.blurb}</span>
                    </button>
                  ))}
                </div>
                {bg && (
                  <div className="paper cc-detail">
                    <h4>{bg.name}</h4>
                    <p className="cc-meta">Compétences : {bg.skills.join(", ")} · {bg.tool}</p>
                    <p className="small">Équipement : {bg.gear.join(", ")}.</p>
                    <TraitList traits={[bg.feature]} />
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section>
                <h3 className="cc-title">Tes caractéristiques</h3>
                {method === "points" && (
                  <p className="cc-budget">
                    Points restants : <strong className={spent > POINT_BUY_BUDGET ? "over" : ""}>{POINT_BUY_BUDGET - spent}</strong> sur {POINT_BUY_BUDGET}
                  </p>
                )}
                {method === "des" && !pool && (
                  <div className="stack">
                    <p className="small">Le MJ a choisi les dés : 4d6 par caractéristique, on garde les trois meilleurs. Les six lancers s'affichent dans le journal pour toute la table.</p>
                    <button type="button" className="btn primary" disabled={rolling} onClick={rollScores}>{rolling ? "Les dés roulent…" : "Lancer mes six caractéristiques"}</button>
                  </div>
                )}
                {pool && method !== "points" && <p className="small">Répartis ces valeurs : {pool.join(", ")}.</p>}
                {(method === "points" || pool) && (
                  <div className="cc-stats">
                    {statNames.map((n, i) => (
                      <div key={n} className="cc-stat">
                        <span className="cc-stat-name">{n}</span>
                        {method === "points" ? (
                          <div className="cc-stepper">
                            <button type="button" className="btn small" aria-label={`Baisser ${n}`} disabled={base[i] <= 8} onClick={() => setBase(base.map((v, j) => (j === i ? v - 1 : v)))}>−</button>
                            <span>{base[i]}</span>
                            <button type="button" className="btn small" aria-label={`Monter ${n}`} disabled={base[i] >= 15 || spent - POINT_BUY_COST[base[i]] + POINT_BUY_COST[base[i] + 1] > POINT_BUY_BUDGET} onClick={() => setBase(base.map((v, j) => (j === i ? v + 1 : v)))}>+</button>
                          </div>
                        ) : (
                          <select className="input small" aria-label={n} value={assign[i] ?? ""} onChange={(e) => setAssign(assign.map((a, j) => (j === i ? (e.target.value === "" ? null : Number(e.target.value)) : a === Number(e.target.value) ? null : a)))}>
                            <option value="">—</option>
                            {pool!.map((v, k) => (
                              <option key={k} value={k}>{v}{assign.includes(k) && assign[i] !== k ? " (pris)" : ""}</option>
                            ))}
                          </select>
                        )}
                        {bonus[i] ? <span className="cc-bonus">+{bonus[i]}</span> : <span className="cc-bonus" />}
                        <span className="cc-total">{scores[i]}</span>
                        <span className="cc-mod">{formatMod(scores[i])}</span>
                      </div>
                    ))}
                  </div>
                )}
                <label className="small cc-check">
                  <input type="checkbox" checked={moveBonus} onChange={(e) => setMoveBonus(e.target.checked)} /> Placer moi-même les bonus d'origine (+2 et +1)
                </label>
                {moveBonus && (
                  <div className="row">
                    <label className="field">
                      <span>+2</span>
                      <select className="input" value={bonus2} onChange={(e) => setBonus2(Number(e.target.value))}>
                        {statNames.map((n, i) => <option key={n} value={i} disabled={i === bonus1}>{n}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>+1</span>
                      <select className="input" value={bonus1} onChange={(e) => setBonus1(Number(e.target.value))}>
                        {statNames.map((n, i) => <option key={n} value={i} disabled={i === bonus2}>{n}</option>)}
                      </select>
                    </label>
                  </div>
                )}
                {cls && <p className="small muted">Conseil pour {cls.name.toLowerCase()} : {cls.mainStats.join(" et ")} en priorité.</p>}
              </section>
            )}

            {step === 4 && (
              <section>
                <h3 className="cc-title">Ce que tu sais faire</h3>
                <p className="small">Ton historique t'apprend : <strong>{fixedSkills.join(", ")}</strong>. Choisis encore {Math.min(skillCount, skillChoices.length)} compétence(s) de {cls?.name.toLowerCase()}.</p>
                <div className="cc-chips">
                  {skillChoices.map((s) => {
                    const on = skills.includes(s);
                    return (
                      <button key={s} type="button" className="cc-chip" aria-pressed={on} disabled={!on && skills.length >= skillCount} onClick={() => setSkills(on ? skills.filter((x) => x !== s) : [...skills, s])}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                <p className="small muted">Bonus de maîtrise au niveau {level} : +{proficiency(level)}.</p>
              </section>
            )}

            {step === 5 && (
              <section>
                <h3 className="cc-title">Qui es-tu ?</h3>
                <label className="field">
                  <span>Nom</span>
                  <input id="cc-nom" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Le nom que les autres crieront dans la bataille" />
                </label>
                {(Object.keys(TRAIT_LABELS) as TraitKey[]).map((k) => (
                  <div key={k} className="cc-trait">
                    <label className="field">
                      <span>{TRAIT_LABELS[k]}</span>
                      <textarea className="input" rows={2} value={traits[k]} maxLength={300} onChange={(e) => setTraits({ ...traits, [k]: e.target.value })} />
                    </label>
                    <div className="cc-chips">
                      {PERSONALITY[k].map((p) => (
                        <button key={p} type="button" className="cc-chip small" aria-pressed={traits[k] === p} onClick={() => setTraits({ ...traits, [k]: p })}>{p}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {step === 6 && (
              <section>
                <h3 className="cc-title">À quoi ressembles-tu ?</h3>
                <div className="cc-portrait-row">
                  <div className="cc-portrait">{portrait ? <img src={portrait} alt={`Portrait de ${name}`} /> : <span>{name.slice(0, 1).toUpperCase() || "?"}</span>}</div>
                  <div className="stack" style={{ flex: 1 }}>
                    <label className="field">
                      <span>Description</span>
                      <textarea className="input" rows={4} value={appearance} maxLength={600} onChange={(e) => setAppearance(e.target.value)} placeholder="Taille, cicatrices, vêtements, ce qu'on remarque en premier…" />
                    </label>
                    <label className="btn small" style={{ alignSelf: "flex-start" }}>
                      Envoyer une image
                      <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPortrait(await toPortrait(f).catch(() => { toast("Image illisible."); return undefined; })); }} />
                    </label>
                    <p className="small muted">Bientôt : portraits peints générés par le ComfyUI du MJ à partir de ta description, ou choisis dans la galerie.</p>
                  </div>
                </div>
              </section>
            )}

            {step === 7 && cls && (
              <section className="paper cc-summary">
                <div className="cc-portrait-row">
                  <div className="cc-portrait">{portrait ? <img src={portrait} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</div>
                  <div>
                    <h3 className="cc-name">{name}</h3>
                    <p className="cc-meta">{sub?.name} · {cls.name}{subclass ? ` (${subclass.name})` : ""} · {bg?.name} · niveau {level}</p>
                    <p className="cc-meta">PV {hp} · CA {ac} · déplacement {speed} cases</p>
                  </div>
                </div>
                <div className="cc-stats compact">
                  {statNames.map((n, i) => (
                    <div key={n} className="cc-stat"><span className="cc-stat-name">{n}</span><span className="cc-total">{scores[i]}</span><span className="cc-mod">{formatMod(scores[i])}</span></div>
                  ))}
                </div>
                <p className="small"><strong>Compétences :</strong> {[...fixedSkills, ...skills].join(", ")}</p>
                <p className="small"><strong>Pouvoirs :</strong> {[...powers, ...subPowers].map((p) => p.name).join(", ")}</p>
                {traits.trait && <p className="small"><em>{traits.trait}</em></p>}
              </section>
            )}
          </div>
        </div>
        <footer className="cc-foot">
          <button type="button" className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Retour</button>
          <span className="small muted">{STEPS[step]} · étape {step + 1} sur {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Suivant</button>
          ) : (
            <button type="button" className="btn primary" onClick={() => onDone(build())}>Entrer dans l'histoire</button>
          )}
        </footer>
      </div>
    </div>
  );
}

function PowerList({ powers }: { powers: Power[] }) {
  return (
    <ul className="cc-powers">
      {powers.map((p) => (
        <li key={p.name}>
          <strong>{p.name}</strong> <span className="muted small">niv. {p.level} · {p.action} · {p.recharge === "à volonté" ? "à volonté" : p.recharge === "passif" ? "toujours actif" : `${p.uses ?? 1} fois par ${p.recharge}`}</span>
          <div className="small">{p.effect}</div>
        </li>
      ))}
    </ul>
  );
}

function TraitList({ traits }: { traits: { name: string; text: string }[] }) {
  return (
    <dl className="cc-traits">
      {traits.map((t) => (
        <div key={t.name}>
          <dt>{t.name}</dt>
          <dd>{t.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function bonusText(b: number[], names: string[]) {
  const parts = b.map((v, i) => (v ? `${names[i]} +${v}` : "")).filter(Boolean);
  return parts.length ? parts.join(", ") : "bonus au choix";
}
