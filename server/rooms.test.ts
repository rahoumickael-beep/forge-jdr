// Ce que voit un joueur : aucun secret du MJ ne doit partir chez lui.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BESTIARY } from "../shared/bestiary";
import type { Character } from "../shared/types";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "forge-test-"));
const { addPlayer, createRoom, hideUnseen, sanitizeImport, viewFor } = await import("./rooms");
const { cookieMJ, estMJ, FICHIER_MJ } = await import("./acces-mj");

const fiche = (id: string, name: string, extra: Partial<Character> = {}): Character => ({
  id, name, genre: "fantasy", level: 1, archetype: "Guerrier", origin: "Humain", description: "", backstory: "", personality: "",
  stats: {}, hp: 10, hpMax: 10, ac: 12, speed: 6, equipment: [], abilities: [], ...extra,
});

function partie() {
  const { stored, gm } = createRoom({ name: "Essai", genre: "fantasy", ton: "sombre", level: 3, gmName: "MJ" });
  const lea = addPlayer(stored, "Léa");
  const tom = addPlayer(stored, "Tom");
  const s = stored.state;
  s.gmNotes = "SECRET-NOTES : Cyprien ment sur la relique";
  s.characters.push(
    fiche("c_lea", "Maëlle Crolle", { ownerId: lea.id }),
    fiche("c_ancien", "Colin Brac"), // fiche d'une vieille partie : propriétaire déduit du pion
    fiche("c_pnj", "Mère Ombeline", { role: "SECRET-PNJ : sert Gorvan" }),
  );
  s.tokens.push(
    { id: "t_tom", name: "Colin", x: 1, y: 1, color: "#000", kind: "joueur", ownerId: tom.id, characterId: "c_ancien" },
    { id: "t_cache", name: "SECRET-PION", x: 2, y: 2, color: "#000", kind: "monstre", hidden: true },
  );
  s.handouts.push(
    { id: "h_tous", title: "Avis de la Chancellerie", text: "", at: 0 },
    { id: "h_lea", title: "SECRET-LETTRE pour Léa", text: "", at: 0, to: [lea.id] },
  );
  s.scenarios.push({ id: "sc", title: "SECRET-SCENARIO" } as never);
  s.chat.push({ id: "m1", at: 0, from: "MJ", text: "SECRET-DE : jet caché", kind: "des", secret: true });
  return { stored, gm, lea, tom };
}

test("vue joueur : ni notes, ni scénarios, ni fiches de PNJ, ni pion caché, ni jet secret du MJ", () => {
  const { stored, lea } = partie();
  const json = JSON.stringify(viewFor(stored, lea));
  assert.ok(!json.includes("SECRET-NOTES") && !json.includes("SECRET-PNJ") && !json.includes("SECRET-PION") && !json.includes("SECRET-SCENARIO") && !json.includes("SECRET-DE"));
  assert.ok(!json.includes("Mère Ombeline"));
});

test("vue joueur : ses fiches et celles du groupe, y compris les fiches d'avant le champ propriétaire", () => {
  const { stored, lea } = partie();
  const ids = viewFor(stored, lea).characters.map((c) => c.id).sort();
  assert.deepEqual(ids, ["c_ancien", "c_lea"]);
});

test("documents : un document remis à un joueur n'arrive que chez lui", () => {
  const { stored, lea, tom } = partie();
  assert.deepEqual(viewFor(stored, lea).handouts.map((h) => h.id), ["h_tous", "h_lea"]);
  assert.deepEqual(viewFor(stored, tom).handouts.map((h) => h.id), ["h_tous"]);
});

test("vue joueur : une créature au nom secret n'apparaît que sous son nom public, pion et initiative", () => {
  const { stored, gm, lea } = partie();
  const bouche = BESTIARY.find((c) => c.name === "Bouche de Gorvan")!;
  stored.state.tokens.push({ id: "t_bouche", name: "Bouche de Gorvan 2", x: 3, y: 3, color: "#000", kind: "monstre", creatureId: bouche.id });
  stored.state.initiative.entries.push({ tokenId: "t_bouche", name: "Bouche de Gorvan 2", value: 12 });
  const vue = hideUnseen(viewFor(stored, lea));
  const json = JSON.stringify(vue);
  assert.ok(!/gorvan/i.test(json), "ni le nom ni l'id ni le fichier de la figurine");
  assert.ok(json.includes("Bouche du Dessous 2"));
  assert.equal(vue.tokens.find((t) => t.id === "t_bouche")?.pion, "/pions/bouche-du-dessous.webp");
  assert.ok(JSON.stringify(hideUnseen(viewFor(stored, gm))).includes("Bouche de Gorvan 2"));
});

test("vue joueur : la campagne sans fil secret, sans note de PNJ, sans Murmures, sans préparation, Sceau caché", () => {
  const { stored, gm, lea } = partie();
  const c = stored.state.campagne;
  c.fils.push({ id: "f", texte: "CACHE-FIL", ouvert: true, secret: true, seance: 1 });
  c.pnj.push({ id: "n", nom: "Gaudru", attitude: -1, public: "Le vicaire.", secret: "CACHE-VICAIRE" });
  c.reserve = 5;
  c.preparation = "CACHE-PREPARATION";
  const vue = viewFor(stored, lea);
  assert.ok(!JSON.stringify(vue).includes("CACHE-"));
  assert.equal(vue.campagne.jauge, null);
  assert.equal(vue.campagne.reserve, 0);
  assert.equal(viewFor(stored, gm).campagne.reserve, 5);
});

test("import : la campagne importée est nettoyée", () => {
  const { stored } = partie();
  const st = sanitizeImport({ tokens: [], campagne: { jauge: -40, reserve: 99, fils: "x" } }, stored.state);
  assert.equal(st.campagne.jauge, 0);
  assert.equal(st.campagne.reserve, 6);
  assert.deepEqual(st.campagne.fils, []);
});

test("vue du MJ : il voit tout", () => {
  const { stored, gm } = partie();
  const v = viewFor(stored, gm);
  assert.equal(v.characters.length, 3);
  assert.equal(v.handouts.length, 2);
  assert.match(v.gmNotes ?? "", /SECRET-NOTES/);
});

test("import : refuse un fichier qui n'est pas une partie", () => {
  const { stored } = partie();
  assert.throws(() => sanitizeImport(null, stored.state));
  assert.throws(() => sanitizeImport({ name: "x" }, stored.state));
});

test("import : garde le code et les joueurs, jette les champs inconnus et les valeurs mal typées", () => {
  const { stored } = partie();
  const s = stored.state;
  const out = sanitizeImport(
    { code: "PIRAT", players: [], tokens: [{ id: "t", name: "A", x: 999, y: -4, kind: "joueur", color: "#fff" }, { name: "sans id" }], genre: "inconnu", level: 99, map: { width: 5, height: 5, tiles: [1] }, gmKey: "vol", combat: { monsterIds: [] } },
    s,
  );
  assert.equal(out.code, s.code);
  assert.equal(out.players, s.players);
  assert.equal(out.genre, "fantasy");
  assert.equal(out.level, 3);
  assert.equal(out.map, null); // cases incomplètes : carte refusée
  assert.equal(out.combat, null);
  assert.equal(out.tokens.length, 1);
  assert.deepEqual([out.tokens[0].x, out.tokens[0].y], [39, 0]);
  assert.ok(!("gmKey" in out));
});

test("import : une carte valide passe, avec son brouillard recalculé si besoin", () => {
  const { stored } = partie();
  const map = { name: "Crypte", kind: "donjon", seed: 4, width: 4, height: 4, tiles: new Array(16).fill(1), rooms: [{ x: 0, y: 0, w: 2, h: 2, label: "Autel" }] };
  const out = sanitizeImport({ tokens: [], map }, stored.state);
  assert.equal(out.map?.width, 4);
  assert.equal(out.fog?.length, 16);
  assert.equal(out.map?.rooms[0].label, "Autel");
});

test("code du MJ : servi seulement avec la bonne clé de partie", () => {
  const { stored } = partie();
  const code = stored.state.code;
  assert.equal(cookieMJ(code, "mauvaise"), undefined);
  assert.equal(cookieMJ("ZZZZZZ", stored.gmKey), undefined);
  const bon = cookieMJ(code, stored.gmKey)!;
  assert.ok(estMJ(`theme=sombre; forge_mj=${bon}`));
  assert.ok(!estMJ(undefined));
  assert.ok(!estMJ(`forge_mj=${encodeURIComponent(`${code}:faux`)}`));
  assert.ok(!estMJ("forge_mj=%E0%A4%A"));
  assert.ok(FICHIER_MJ.test("/assets/mj-CGpE8zGg.js"));
  assert.ok(!FICHIER_MJ.test("/assets/index-CBY_I5uX.js"));
});

test("vue joueur : ni vaisseau caché ni note du MJ sur un vaisseau ; l'import des vaisseaux est nettoyé", async () => {
  const { nouveauVaisseau } = await import("../shared/vaisseaux");
  const { stored, lea } = partie();
  const nous = { ...nouveauVaisseau("cargo-leger", "Pie-Grièche", "groupe"), notes: "SECRET-VAISSEAU : traceur dans la soute" };
  const eux = nouveauVaisseau("fregate", "SECRET-FREGATE", "autre");
  stored.state.vaisseaux.push(nous, eux);
  const vue = JSON.stringify(hideUnseen(viewFor(stored, lea)));
  assert.ok(vue.includes("Pie-Grièche"));
  assert.ok(!vue.includes("SECRET-VAISSEAU") && !vue.includes("SECRET-FREGATE"));
  const importee = sanitizeImport({ tokens: [], vaisseaux: [{ ...nous, coque: -40, inconnu: "x" }, 42] }, stored.state);
  assert.equal(importee.vaisseaux.length, 1);
  assert.equal(importee.vaisseaux[0].coque, 0);
  assert.equal("inconnu" in importee.vaisseaux[0], false);
});

test("vue joueur, navires des Îles du Vent : ni navire caché, ni note, ni Moral ni équipage d'un autre navire ; le MJ voit tout", async () => {
  const { nouveauVaisseau } = await import("../shared/vaisseaux");
  const { stored, gm, lea } = (() => {
    const { stored: s, gm: g } = createRoom({ name: "Essai", genre: "pirates", ton: "sombre", level: 3, gmName: "MJ" });
    return { stored: s, gm: g, lea: addPlayer(s, "Léa") };
  })();
  const nous = { ...nouveauVaisseau("sloop", "Pie-Noire", "groupe", "pirates"), notes: "SECRET-NAVIRE : Le Goff doit de l'argent" };
  const garde = { ...nouveauVaisseau("galion-garde-cote", "Garde-côte", "autre", "pirates"), cache: false, moral: 2, hommes: 77, perdus: 3, fuite: { reussites: 1, touches: 1 } };
  const cache = nouveauVaisseau("fregate", "SECRET-FREGATE", "autre", "pirates");
  stored.state.vaisseaux.push(nous, garde, cache);
  const vue = hideUnseen(viewFor(stored, lea));
  assert.equal(JSON.stringify(vue).includes("SECRET-"), false);
  const [a, b] = vue.vaisseaux;
  assert.equal(vue.vaisseaux.length, 2);
  assert.deepEqual([a.moral, a.hommes], [6, 40], "le groupe voit le Moral et l'équipage de son navire");
  assert.deepEqual([b.moral, b.hommes, b.hommesMax, b.perdus, b.fuite], [undefined, undefined, undefined, undefined, undefined]);
  assert.equal(b.coque, b.coqueMax, "la coque d'un navire en vue reste visible");
  const mj = viewFor(stored, gm);
  assert.equal(mj.vaisseaux.length, 3);
  assert.equal(mj.vaisseaux[1].moral, 2);
  const importee = sanitizeImport({ tokens: [], vaisseaux: [{ ...garde, moral: 99, hommes: 5000 }] }, stored.state);
  assert.equal(importee.vaisseaux[0].moral, 10);
  assert.equal(importee.vaisseaux[0].hommes, importee.vaisseaux[0].hommesMax);
});
