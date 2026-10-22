// Livre des règles : consultable par tous, dans la barre latérale ou en grand par-dessus la table.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { getGenre } from "../../../shared/genres";
import {
  ABILITY_IMPROVEMENT_LEVELS,
  CLASS_NAMES_BY_GENRE,
  CONDITIONS,
  CORE_RULES,
  DEATH_RULES,
  SKILLS,
  XP_BY_LEVEL,
  classesFor,
  type CharacterClass,
  type Power,
  type RuleSection,
} from "../../../shared/rules";
import type { RoomView } from "../../../shared/types";

export const CHAPTERS = [
  { id: "regles", label: "Règles" },
  { id: "classes", label: "Classes" },
  { id: "competences", label: "Compétences" },
  { id: "etats", label: "États" },
  { id: "mort", label: "Mort" },
  { id: "progression", label: "Progression" },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** Où en est le lecteur : gardé par la table pour survivre aux changements d'onglet et à l'ouverture en grand. */
export interface BookNav {
  chapter: ChapterId;
  query: string;
  classId: string | null;
}
export const INITIAL_NAV: BookNav = { chapter: "regles", query: "", classId: null };

// Ces sections ont leur propre chapitre, avec une mise en page à elles.
const OWN_CHAPTER = new Set(["mort", "progression", "etats"]);
const BASE_RULES = CORE_RULES.filter((s) => !OWN_CHAPTER.has(s.id));
const PROGRESSION = CORE_RULES.find((s) => s.id === "progression");

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const matches = (q: string, ...texts: (string | undefined)[]) => texts.some((t) => t && fold(t).includes(q));

/** La règle de mort choisie, si la partie en porte une (champ facultatif, posé par les réglages du MJ). */
function deathRuleOf(room: RoomView): string | undefined {
  const r = (room as RoomView & { deathRule?: unknown }).deathRule;
  return typeof r === "string" ? r : undefined;
}

function proficiency(level: number) {
  return Math.ceil(level / 4) + 1;
}

export function powerCost(p: Power): string {
  if (p.recharge === "à volonté") return "À volonté";
  if (p.recharge === "passif") return "Toujours actif";
  const rest = p.recharge === "repos court" ? "repos court" : "repos long";
  return p.uses ? `${p.uses} fois par ${rest}` : `Revient après un ${rest}`;
}

function actionLabel(p: Power): string | null {
  if (p.action === "passif") return p.recharge === "passif" || p.recharge === "à volonté" ? null : "Sans action";
  return p.action.charAt(0).toUpperCase() + p.action.slice(1);
}

// --- Rendu du texte des règles : "- " = liste, "| " = tableau (la première ligne est l'en-tête). ---

function Body({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={i} className="rb-list">
          {items.map((it, k) => {
            const cut = it.indexOf(" : ");
            return <li key={k}>{cut > 0 ? <><b>{it.slice(0, cut)}</b> : {it.slice(cut + 3)}</> : it}</li>;
          })}
        </ul>,
      );
    } else if (line.startsWith("| ")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("| ")) rows.push(lines[i++].slice(2).split(" | "));
      const [head, ...rest] = rows;
      blocks.push(
        <table key={i} className="rb-table">
          <thead><tr>{head.map((h, k) => <th key={k} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rest.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>,
      );
    } else {
      blocks.push(<p key={i}>{line}</p>);
      i++;
    }
  }
  return <>{blocks}</>;
}

function Ornament() {
  return (
    <svg className="ornament rb-ornament" viewBox="0 0 340 22" aria-hidden="true">
      <path d="M10 11h130M200 11h130" stroke="currentColor" strokeWidth="1" />
      <path d="M140 11c10-9 20-9 30 0-10 9-20 9-30 0zM170 11c10-9 20-9 30 0-10 9-20 9-30 0z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="170" cy="11" r="2.4" fill="currentColor" />
      <circle cx="6" cy="11" r="1.6" fill="currentColor" />
      <circle cx="334" cy="11" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ChapterTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="rb-chapter-head">
      <h2>{children}</h2>
      {sub && <p className="rb-sub">{sub}</p>}
      <Ornament />
    </header>
  );
}

function RuleBlock({ section }: { section: RuleSection }) {
  return (
    <section className="rb-section">
      <h3>{section.title}</h3>
      <Body lines={section.body} />
    </section>
  );
}

function PowerItem({ p, className }: { p: Power; className?: string }) {
  const meta = [actionLabel(p), powerCost(p), p.range && `portée ${p.range}`].filter(Boolean).join(" · ");
  return (
    <li className="rb-power">
      <div className="rb-power-head">
        <b>{p.name}</b>
        {className && <span className="rb-power-class">{className}, niv. {p.level}</span>}
      </div>
      <div className="rb-power-meta">{meta}</div>
      <p>{p.effect}</p>
    </li>
  );
}

function ClassSheet({ c }: { c: CharacterClass }) {
  const byLevel = new Map<number, Power[]>();
  for (const p of c.powers) byLevel.set(p.level, [...(byLevel.get(p.level) ?? []), p]);
  return (
    <article className="rb-class" aria-labelledby={`rb-${c.id}`}>
      <h3 id={`rb-${c.id}`}>{c.name}</h3>
      <p className="rb-pitch">{c.pitch}</p>
      <dl className="rb-facts">
        <dt>Rôle</dt><dd>{c.role}</dd>
        <dt>Dé de vie</dt><dd>d{c.hitDie}</dd>
        <dt>Caractéristique principale</dt><dd>{c.mainStats.join(" et ")}</dd>
        <dt>Sauvegardes</dt><dd>{c.saves.join(", ")}</dd>
        <dt>Armures</dt><dd>{c.armor}</dd>
        <dt>Armes</dt><dd>{c.weapons}</dd>
        <dt>Compétences</dt><dd>{c.skills.choose} au choix : {c.skills.from.join(", ")}</dd>
        <dt>Équipement de départ</dt><dd>{c.startingGear.join(", ")}</dd>
      </dl>
      <h4 className="rb-powers-title">Pouvoirs</h4>
      {[...byLevel.entries()].map(([level, powers]) => (
        <section key={level} className="rb-level">
          <h5>Niveau {level}</h5>
          <ul className="rb-powers">{powers.map((p) => <PowerItem key={p.name} p={p} />)}</ul>
        </section>
      ))}
    </article>
  );
}

// --- Chapitres ---

function RulesChapter() {
  return (
    <>
      <ChapterTitle>Les règles</ChapterTitle>
      {BASE_RULES.map((s) => <RuleBlock key={s.id} section={s} />)}
    </>
  );
}

function ClassesChapter({ room, nav, onNav }: { room: RoomView; nav: BookNav; onNav: (n: BookNav) => void }) {
  const genre = getGenre(room.genre);
  const classes = classesFor(room.genre);
  if (classes.length === 0) {
    const names = CLASS_NAMES_BY_GENRE[room.genre] ?? [];
    return (
      <>
        <ChapterTitle sub={genre.label}>Les classes</ChapterTitle>
        <ul className="rb-namelist">{names.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="rb-note">Leurs pouvoirs sont encore à l'écriture et arriveront bientôt. D'ici là, les règles de base s'appliquent telles quelles.</p>
      </>
    );
  }
  const current = classes.find((c) => c.id === nav.classId) ?? classes[0];
  return (
    <>
      <ChapterTitle sub={genre.label}>Les classes</ChapterTitle>
      <div className="rb-class-picker" role="group" aria-label="Choisir une classe">
        {classes.map((c) => (
          <button key={c.id} type="button" className="rb-pick" aria-pressed={c.id === current.id} onClick={() => onNav({ ...nav, classId: c.id })}>
            {c.name}
          </button>
        ))}
      </div>
      <ClassSheet c={current} />
    </>
  );
}

function SkillsChapter({ room }: { room: RoomView }) {
  const stats = getGenre(room.genre).stats;
  return (
    <>
      <ChapterTitle>Les compétences</ChapterTitle>
      <p>Chaque compétence dépend d'une caractéristique. Si ton personnage la maîtrise, ajoute ton bonus de maîtrise au test.</p>
      {stats.map((stat, i) => {
        const list = SKILLS.filter((s) => s.stat === i);
        if (!list.length) return null;
        return (
          <section key={stat} className="rb-section">
            <h3>{stat}</h3>
            <p>{list.map((s) => s.name).join(", ")}.</p>
          </section>
        );
      })}
      <p className="rb-note">Aucune compétence ne dépend de {stats[2]} : cette caractéristique sert aux sauvegardes et aux points de vie.</p>
    </>
  );
}

function ConditionsChapter() {
  return (
    <>
      <ChapterTitle>Les états</ChapterTitle>
      <dl className="rb-defs">
        {CONDITIONS.map((c) => (
          <div key={c.name}>
            <dt>{c.name}</dt>
            <dd>{c.effect}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function DeathChapter({ room }: { room: RoomView }) {
  const chosen = DEATH_RULES.find((d) => d.id === deathRuleOf(room));
  if (chosen) {
    return (
      <>
        <ChapterTitle>Tomber à 0 PV</ChapterTitle>
        <section className="rb-chosen" aria-label="Règle de cette partie">
          <span className="rb-chosen-tag">Règle de cette partie</span>
          <h3>{chosen.label}</h3>
          <p>{chosen.text}</p>
        </section>
        <h4 className="rb-powers-title">Les autres options</h4>
        {DEATH_RULES.filter((d) => d !== chosen).map((d) => (
          <section key={d.id} className="rb-section rb-dim">
            <h3>{d.label}</h3>
            <p>{d.text}</p>
          </section>
        ))}
      </>
    );
  }
  return (
    <>
      <ChapterTitle>Tomber à 0 PV</ChapterTitle>
      <p>Le MJ choisit une de ces trois règles au début de la campagne et s'y tient.</p>
      {DEATH_RULES.map((d) => (
        <section key={d.id} className="rb-section">
          <h3>{d.label}</h3>
          <p>{d.text}</p>
        </section>
      ))}
    </>
  );
}

function ProgressionChapter() {
  const prose = PROGRESSION?.body.filter((l) => !l.startsWith("| ")) ?? [];
  return (
    <>
      <ChapterTitle>Progression</ChapterTitle>
      <Body lines={prose} />
      <table className="rb-table rb-xp">
        <thead>
          <tr><th scope="col">Niveau</th><th scope="col">XP requis</th><th scope="col">Maîtrise</th><th scope="col">À noter</th></tr>
        </thead>
        <tbody>
          {XP_BY_LEVEL.slice(1).map((xp, i) => {
            const level = i + 1;
            return (
              <tr key={level}>
                <td>{level}</td>
                <td>{xp.toLocaleString("fr-FR")}</td>
                <td>+{proficiency(level)}</td>
                <td>{ABILITY_IMPROVEMENT_LEVELS.includes(level) ? "+2 en caractéristiques" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function SearchResults({ room, query, onNav, nav }: { room: RoomView; query: string; nav: BookNav; onNav: (n: BookNav) => void }) {
  const q = fold(query.trim());
  const rules = CORE_RULES.map((s) => ({ s, lines: matches(q, s.title) ? s.body : s.body.filter((l) => matches(q, l)) })).filter((r) => r.lines.length);
  const classes = classesFor(room.genre);
  const powers = classes.flatMap((c) => c.powers.filter((p) => matches(q, p.name, p.effect)).map((p) => ({ c, p })));
  const conditions = CONDITIONS.filter((c) => matches(q, c.name, c.effect));
  const skills = SKILLS.filter((s) => matches(q, s.name));
  const total = rules.length + powers.length + conditions.length + skills.length;
  const stats = getGenre(room.genre).stats;

  return (
    <>
      <ChapterTitle sub={total ? `${total} passage${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}` : undefined}>« {query.trim()} »</ChapterTitle>
      {total === 0 && <p>Rien dans le livre ne parle de ça. Essaie un autre mot, ou demande au MJ de trancher.</p>}
      {powers.length > 0 && (
        <section className="rb-section">
          <h3>Pouvoirs</h3>
          <ul className="rb-powers">
            {powers.map(({ c, p }) => (
              <PowerItem key={c.id + p.name} p={p} className={c.name} />
            ))}
          </ul>
        </section>
      )}
      {rules.map(({ s, lines }) => (
        <section key={s.id} className="rb-section">
          <h3>{s.title}</h3>
          <Body lines={lines} />
        </section>
      ))}
      {conditions.length > 0 && (
        <section className="rb-section">
          <h3>États</h3>
          <dl className="rb-defs">
            {conditions.map((c) => <div key={c.name}><dt>{c.name}</dt><dd>{c.effect}</dd></div>)}
          </dl>
        </section>
      )}
      {skills.length > 0 && (
        <section className="rb-section">
          <h3>Compétences</h3>
          <p>{skills.map((s) => `${s.name} (${stats[s.stat]})`).join(", ")}.</p>
        </section>
      )}
      <p>
        <button type="button" className="btn small" onClick={() => onNav({ ...nav, query: "" })}>Effacer la recherche</button>
      </p>
    </>
  );
}

// --- Le livre ---

export function Rulebook({ room, nav, onNav, wide = false, onOpenWide }: {
  room: RoomView;
  nav: BookNav;
  onNav: (n: BookNav) => void;
  wide?: boolean;
  onOpenWide?: () => void;
}) {
  const searchId = useId();
  const searching = nav.query.trim().length > 1;
  return (
    <div className={`rulebook${wide ? " wide" : ""}`}>
      <nav className="rb-toc" aria-label="Sommaire du livre des règles">
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className="rb-toc-item"
                aria-current={!searching && nav.chapter === c.id ? "page" : undefined}
                onClick={() => onNav({ ...nav, chapter: c.id, query: "" })}
              >
                {wide && <span className="rb-toc-num" aria-hidden="true">{["I", "II", "III", "IV", "V", "VI"][i]}</span>}
                {c.label}
              </button>
            </li>
          ))}
        </ol>
        <div className="rb-tools">
          <label htmlFor={searchId} className="rb-search-label">Chercher</label>
          <input
            id={searchId}
            type="search"
            className="input"
            placeholder="sauvegarde, à terre, soins…"
            value={nav.query}
            onChange={(e) => onNav({ ...nav, query: e.target.value })}
          />
          {onOpenWide && (
            <button type="button" className="btn small" onClick={onOpenWide}>Ouvrir en grand</button>
          )}
        </div>
      </nav>
      <div className="rb-page paper">
        <div className="rb-scroll" aria-live={searching ? "polite" : undefined}>
        {searching ? (
          <SearchResults room={room} query={nav.query} nav={nav} onNav={onNav} />
        ) : (
          <>
            {nav.chapter === "regles" && <RulesChapter />}
            {nav.chapter === "classes" && <ClassesChapter room={room} nav={nav} onNav={onNav} />}
            {nav.chapter === "competences" && <SkillsChapter room={room} />}
            {nav.chapter === "etats" && <ConditionsChapter />}
            {nav.chapter === "mort" && <DeathChapter room={room} />}
            {nav.chapter === "progression" && <ProgressionChapter />}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

/** Le livre en grand, par-dessus la table. Échap ou le bouton ferment ; le focus revient où il était. */
export function RulebookOverlay({ room, nav, onNav, onClose }: { room: RoomView; nav: BookNav; onNav: (n: BookNav) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && dialogRef.current) {
        // Garde le focus dans la fenêtre tant qu'elle est ouverte.
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button, input, [href], [tabindex]:not([tabindex='-1'])");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="rb-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="rb-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="rb-dialog-head">
          <h2 id={titleId} className="gilded">Livre des règles</h2>
          <span className="muted small">{getGenre(room.genre).label}</span>
          <button ref={closeRef} type="button" className="btn small" onClick={onClose}>
            Refermer le livre <kbd>Échap</kbd>
          </button>
        </header>
        <Rulebook room={room} nav={nav} onNav={onNav} wide />
      </div>
    </div>
  );
}
