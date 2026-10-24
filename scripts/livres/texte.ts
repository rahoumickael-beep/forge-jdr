// Outils de texte des livres : échappement, typographie française, petit Markdown, illustrations.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { FIN_DE_STYLE, promptPeinture, type Cadrage } from "../../shared/charte";
import { MONDE } from "./monde";

export const ILLU_DIR = resolve(`${MONDE.dossier}/illustrations`);
/** Version d'impression (--hd) : les images agrandies par comfyui/agrandir.mjs, quand elles existent. */
export const HD = process.argv.includes("--hd");
const ILLU_HD = resolve(`${MONDE.dossier}/illustrations-hd`);


export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Gras, italique et espaces insécables de la typographie française. */
export const md = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/« /g, "«&nbsp;")
    .replace(/ »/g, "&nbsp;»")
    .replace(/ ([:;!?])/g, "&nbsp;$1");

/** Illustrations demandées par les livres, pour le lot ComfyUI. */
export const illustrationsDemandees = new Map<string, { id: string; prompt: string; width: number; height: number }>();

export type Format = "large" | "colonne" | "pleine" | "portrait";
const TAILLES: Record<Format, [number, number]> = { large: [1344, 768], colonne: [896, 1152], pleine: [1024, 1448], portrait: [896, 1152] };
const CADRAGE: Record<Format, Cadrage> = { large: "scene", colonne: "portrait", pleine: "couverture", portrait: "portrait" };

/**
 * Une planche : l'image si elle existe dans content/aubreterre/illustrations, sinon un cadre d'attente avec le prompt.
 * Le style vient de la charte du genre (shared/charte.ts) ; un prompt déjà complet (bestiaire) est gardé tel quel.
 */
export function illustration(id: string, prompt: string, format: Format = "large", legende = "") {
  const complet = FIN_DE_STYLE.test(prompt) ? prompt : promptPeinture(MONDE.genre, CADRAGE[format], prompt);
  const [width, height] = TAILLES[format];
  illustrationsDemandees.set(id, { id, prompt: complet, width, height });
  const cap = legende ? `<figcaption>${md(legende)}</figcaption>` : "";
  for (const p of [...(HD ? [join(ILLU_HD, `${id}.jpg`)] : []), ...["jpg", "png", "webp"].map((ext) => join(ILLU_DIR, `${id}.${ext}`))]) {
    const ext = p.slice(p.lastIndexOf(".") + 1);
    if (existsSync(p)) {
      const data = readFileSync(p).toString("base64");
      return `<figure class="illu ${format}"><img data-id="${id}" src="data:image/${ext === "jpg" ? "jpeg" : ext};base64,${data}" alt="">${cap}</figure>`;
    }
  }
  return `<figure class="illu wait ${format}"><div class="wait-inner"><span class="wait-title">Illustration à peindre</span><code>${esc(id)}</code><p>${esc(complet.replace(FIN_DE_STYLE, ""))}</p></div>${cap}</figure>`;
}

/**
 * Markdown des chapitres :
 * # titre (ignoré, le chapitre a déjà son titre), ## → h3, ### → h4, #### → h5,
 * paragraphes, listes « - », listes numérotées, tableaux « | », encadrés « > » (première ligne en gras = titre),
 * « >! » encadré sombre, « --- » ignoré, « [[saut]] » nouvelle page,
 * « [[illustration id | prompt | légende | format]] ».
 */
export function markdown(src: string): string {
  const lines = src.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  let premier = true;
  const para = (txt: string) => {
    out.push(`<p${premier ? ' class="lettrine"' : ""}>${md(txt)}</p>`);
    premier = false;
  };
  while (i < lines.length) {
    const l = lines[i];
    const t = l.trim();
    if (!t || t === "---") { i++; continue; }
    if (/^# /.test(t)) { i++; continue; }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{2,4}) (.+)$/))) {
      const lvl = m[1].length + 1;
      out.push(`<h${lvl}>${md(m[2])}</h${lvl}>`);
      i++;
      continue;
    }
    if (t === "[[saut]]") { out.push(`<div class="saut"></div>`); i++; continue; }
    if ((m = t.match(/^\[\[illustration (.+)\]\]$/))) {
      const [id, prompt, legende = "", format = "colonne"] = m[1].split("|").map((s) => s.trim());
      out.push(illustration(id, prompt, format as Format, legende));
      i++;
      continue;
    }
    if (t.startsWith(">")) {
      const sombre = t.startsWith(">!");
      const bloc: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        bloc.push(lines[i].trim().replace(/^>!?\s?/, ""));
        i++;
      }
      let titre = "";
      const tm = bloc[0]?.match(/^\*\*(.+?)\*\*\.?$/);
      if (tm) { titre = tm[1]; bloc.shift(); }
      const paras = bloc.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
      out.push(`<aside class="encart${sombre ? " dark" : ""}">${titre ? `<h4>${md(titre)}</h4>` : ""}${paras.map((p) => (p.startsWith("- ") ? `<ul>${p.split(/ (?=- )/).map((x) => `<li>${md(x.slice(2))}</li>`).join("")}</ul>` : `<p>${md(p)}</p>`)).join("")}</aside>`);
      continue;
    }
    if (t.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const r = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!r.every((c) => /^:?-+:?$/.test(c))) rows.push(r);
        i++;
      }
      const [head, ...body] = rows;
      out.push(`<table class="tab"><thead><tr>${head.map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^(- |\d+\. )/.test(t)) {
      const ordered = /^\d+\. /.test(t);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. |\s{2,}\S)/.test(lines[i])) {
        const x = lines[i];
        if (/^\s{2,}\S/.test(x) && items.length) items[items.length - 1] += " " + x.trim();
        else items.push(x.trim().replace(/^(- |\d+\. )/, ""));
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((x) => `<li>${md(x)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4} |>|\||- |\d+\. |\[\[|---$)/.test(lines[i].trim())) {
      buf.push(lines[i].trim());
      i++;
    }
    para(buf.join(" "));
  }
  return out.join("\n");
}

/** « 2d6+3 » → « 10 (2d6 + 3) », façon fiche de la 5e. */
export function averageDiceLabel(formule: string) {
  const f = formule.replace(/\s/g, "");
  if (/^\d+$/.test(f)) return f;
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(f);
  if (!m) return esc(formule);
  const moy = Math.max(1, Math.floor((Number(m[1]) * (Number(m[2]) + 1)) / 2 + Number(m[3] ?? 0)));
  const bonus = m[3] ? ` ${m[3][0] === "-" ? "−" : "+"} ${m[3].slice(1)}` : "";
  return `${moy} (${m[1]}d${m[2]}${bonus})`;
}
