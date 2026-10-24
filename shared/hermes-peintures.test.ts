// Cartes à collectionner et peintures de la Cellule Hermès : canon, secrets, anachronismes, règles Flux, marques et personnes réelles.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CELLULE_HERMES, anachronismesDans, datesImpossibles, nomsInconnus } from "./canon";
import { PEINTURES_HERMES } from "./canon/hermes-peintures";
import { catalogue } from "./collection";
import REGLES_FLUX from "../comfyui/regles-flux.json";

const cartes = catalogue("contemporain");
const trahit = (t: string) => CELLULE_HERMES.secrets.find((s) => t.includes(s));
// Les caractéristiques du monde, que le contrôle des noms propres ne connaît pas encore.
const CARACS = ["Force", "Adresse", "Endurance", "Savoir", "Instinct", "Présence"];
// Ce que le jeu garde caché aux joueurs, en plus de la liste du canon.
const CACHES = ["Cabinet", "Collection", "Coffre", "Rachat", "Écoute", "Écoutes", "Dissolution", "dissous", "dissoute", "Kerdilès", "Deluchat", "Orlhac", "Zumbrunn", "Chassagne", "Vareilles"];
// Tics d'écriture du projet (shared/rules.test.ts).
const BANNED = ["dans un monde où", "au cœur de", "un voile de mystère", "le destin", "une aura", "palpable", "tapisserie", "sombre secret", "véritable", "au-delà", "tisser", "tisse"];
// Aucune marque, ni d'arme, ni de véhicule, ni de téléphone, ni de service réel.
const MARQUES = /\b(glock|beretta|taser|kalachnikov|smith|wesson|walther|sig sauer|iphone|android|samsung|whatsapp|telegram|signal|google|uber|tesla|bmw|mercedes|audi|renault|peugeot|citro[eë]n|volkswagen|dgse|dgsi|cia|fbi|interpol|europol|hermès)\b/i;

test("hermes : cartes à collectionner sans secret, sans anachronisme, sans marque, avec des noms du canon", () => {
  assert.equal(cartes.length, 30);
  assert.equal(new Set(cartes.map((c) => c.id)).size, 30);
  for (const f of ["objet", "allie", "faveur"]) assert.equal(cartes.filter((c) => c.famille === f).length, 10, f);
  for (const c of cartes) {
    for (const t of [c.nom, c.texte, c.usage]) {
      assert.equal(trahit(t), undefined, `${c.id} : secret`);
      assert.deepEqual(anachronismesDans(t, CELLULE_HERMES), [], `${c.id} : anachronisme`);
      assert.deepEqual(datesImpossibles(t, CELLULE_HERMES), [], `${c.id} : date`);
      assert.ok(!MARQUES.test(t), `${c.id} : marque ${t.match(MARQUES)?.[0]}`);
      for (const mot of BANNED) assert.ok(!t.toLowerCase().includes(mot), `${c.id} : mot interdit « ${mot} »`);
      for (const mot of CACHES) assert.ok(!new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, "u").test(t), `${c.id} : « ${mot} » est caché aux joueurs`);
    }
    assert.deepEqual(nomsInconnus(`${c.nom}. ${c.texte} ${c.usage}`, CELLULE_HERMES, CARACS), [], `${c.id} : nom hors du canon`);
  }
});

test("hermes : les cartes suivent les règles du monde (euros, Empreinte, armes de la table)", () => {
  const AUTORISEES = /couteau de poche|matraque télescopique|manche de pioche|barre de chantier|pistolet à impulsion électrique|pistolet semi-automatique de 9 mm|fusil de chasse/i;
  for (const c of cartes) {
    const t = `${c.nom}. ${c.texte} ${c.usage}`;
    assert.ok(!/\bfrancs?\b|\bdollars?\b|\bcrédits?\b.*\bcr\b/i.test(t), `${c.id} : l'argent se compte en euros`);
    assert.ok(!/\b(pistolet|revolver|fusil|carabine|mitraillette|grenade|arme)\b/i.test(c.nom) || AUTORISEES.test(c.nom), `${c.id} : arme hors de la table des armes`);
    for (const m of t.matchAll(/l'Empreinte (?:baisse|monte) de (\d+)/g)) assert.ok(Number(m[1]) <= 3, `${c.id} : l'Empreinte ne baisse jamais de plus de 3 par mission`);
  }
  assert.ok(catalogue("contemporain").find((c) => c.id === "ch-pistolet-9-mm")!.usage.includes("monter l'Empreinte de 2"));
});

test("hermes : aucune carte ne fait d'une personne un objet, un prix ou une récompense", () => {
  const prix = /\b(coursiers?|coursières?|témoins?|otages?|captifs?|prisonniers?|policiers?|douaniers?)\b[^.]*\b(vaut|vendre|vendu|acheter|achetée?s?|prix de)\b/i;
  for (const c of cartes) {
    const t = `${c.nom}. ${c.texte} ${c.usage}`;
    assert.ok(!/\b(esclaves?|otages? comme|trafic d'êtres|monnaie d'échange)\b/i.test(t), `${c.id} : une personne n'est pas une monnaie`);
    assert.ok(!prix.test(t), `${c.id} : une personne n'a pas de prix`);
    if (c.famille === "allie") assert.ok(/refuse|demande|ne |n'|pas|quitte/i.test(c.usage), `${c.id} : un allié a son mot à dire`);
  }
});

test("hermes : sujets des peintures en anglais, lumière en tête, ni négation, ni marque, ni personne réelle, ni rien d'Hermès", () => {
  const interdit = new RegExp(REGLES_FLUX.anachronismes["contemporain"], "i");
  const negation = new RegExp(REGLES_FLUX.negation, "i");
  const cliches = /\b(spy|spies|trench ?coats?|fedora|sunglasses|hoodie|matrix|neon|hacker|james bond|secret agent|masked|silenced|assassin|hostage|victim|corpse|dead body|blood|bleeding|aiming|pointing a gun|firing)\b/i;
  const ids = Object.keys(PEINTURES_HERMES);
  assert.ok(ids.includes("couverture-joueurs") && ids.includes("couverture-mj") && ids.includes("couverture-bestiaire"));
  for (const v of ["paris-la-mercerie", "bruxelles-agence-aldenhove", "luxembourg-la-caserne", "geneve-la-banque", "trieste-le-port-franc", "rotterdam-la-maasvlakte", "marseille-la-joliette"]) {
    assert.ok(ids.includes(`region-${v}`), `lieu ${v}`);
  }
  for (const [id, p] of Object.entries(PEINTURES_HERMES)) {
    for (const t of [p.lumiere, p.sujet]) {
      assert.ok(!/[àâçéèêëîïôûùœ]/i.test(t), `${id} : pas en anglais`);
      assert.ok(!negation.test(t), `${id} : négation`);
      assert.ok(!interdit.test(t), `${id} : ${t.match(interdit)?.[0]}`);
      assert.ok(!cliches.test(t), `${id} : cliché ${t.match(cliches)?.[0]}`);
      assert.ok(!MARQUES.test(t), `${id} : marque`);
      assert.ok(!/\b(logos?|brands?|trademarks?|hermes|herm[eè]s|birkin|kelly bag|silk scarf|orange box|carr[eé])\b/i.test(t), `${id} : rien de la maison de luxe`);
    }
    assert.ok(p.lumiere.length > 10 && p.sujet.length > 80, `${id} : trop court`);
    assert.equal(trahit(p.sujet), undefined, `${id} : secret`);
    for (const mot of ["cabinet", "collection", "the vault", "buyer", "resale", "dissolved", "dissolution", "third floor", "kerdil", "deluchat"]) assert.ok(!p.sujet.toLowerCase().includes(mot), `${id} : ${mot}`);
  }
});
