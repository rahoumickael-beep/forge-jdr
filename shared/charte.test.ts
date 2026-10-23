import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CHARTES, promptPeinture } from "./charte";
import { GENRES } from "./genres";

const css = readFileSync(new URL("../client/src/themes.css", import.meta.url), "utf8");

function variables(genre: string): Record<string, string> {
  const debut = css.indexOf(`[data-genre="${genre}"] {`);
  assert.ok(debut >= 0, `${genre} : pas de thème dans themes.css`);
  const bloc = css.slice(debut, css.indexOf("}", debut));
  return Object.fromEntries([...bloc.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const premiere = (pile: string) => pile.split(",")[0].replace(/"/g, "").trim();

test("charte : un genre, une charte", () => {
  for (const g of GENRES) assert.ok(CHARTES[g.id], `${g.id} : pas de charte`);
});

test("charte : l'appli reprend les couleurs et les polices de la charte", () => {
  for (const c of Object.values(CHARTES)) {
    const v = variables(c.genre);
    const p = c.palette;
    for (const [nom, attendu] of [["felt", p.fond], ["paper", p.papier], ["ink", p.encre], ["ink-soft", p.encreDouce], ["brass", p.or], ["blood", p.sang]] as const) {
      assert.ok(v[nom]?.toLowerCase().startsWith(attendu.toLowerCase()), `${c.genre} : --${nom} vaut ${v[nom]}, la charte dit ${attendu}`);
    }
    assert.equal(premiere(v.display), c.polices.titre, `${c.genre} : police de titre`);
    assert.equal(premiere(v.body), c.polices.texte, `${c.genre} : police de texte`);
  }
});

test("charte : chaque prompt est complet et sans gabarit oublié", () => {
  for (const c of Object.values(CHARTES)) {
    for (const cadrage of ["creature", "portrait", "scene", "objet", "couverture"] as const) {
      const p = promptPeinture(c.genre, cadrage, "a lone figure");
      assert.ok(!/[{}]/.test(p), `${c.genre}/${cadrage} : gabarit non remplacé`);
      assert.ok(p.endsWith("a lone figure"));
    }
  }
});
