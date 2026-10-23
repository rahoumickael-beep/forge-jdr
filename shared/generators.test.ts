import assert from "node:assert/strict";
import { test } from "node:test";
import { extractJson, toScenario } from "./ai";
import { rollDice } from "./dice";
import { GENRES } from "./genres";
import { generateCharacter, generateEncounter, generateScenario, modifier } from "./generators";
import { generateMap, walkable } from "./maps";
import { T, type MapKind } from "./types";

test("modificateurs façon D&D", () => {
  assert.equal(modifier(10), 0);
  assert.equal(modifier(8), -1);
  assert.equal(modifier(15), 2);
  assert.equal(modifier(20), 5);
});

test("dés : formules et bornes", () => {
  const r = rollDice("3d6+2", () => 0.999);
  assert.equal(r.total, 20);
  assert.equal(rollDice("1d20adv", () => 0).kept.length, 1);
  assert.equal(rollDice("4d6kh3", () => 0.5).kept.length, 3);
  assert.throws(() => rollDice("bonjour"));
});

test("même graine, même résultat", () => {
  const a = generateScenario({ genre: "fantasy", ton: "epique", level: 3, players: 4, seed: 42 });
  const b = generateScenario({ genre: "fantasy", ton: "epique", level: 3, players: 4, seed: 42 });
  assert.equal(a.title, b.title);
  assert.deepEqual(a.acts, b.acts);
});

test("chaque genre produit personnages, rencontres et scénarios complets", () => {
  for (const g of GENRES) {
    for (const level of [1, 8, 14, 20]) {
      const c = generateCharacter({ genre: g.id, level, seed: level });
      assert.equal(Object.keys(c.stats).length, 6, g.id);
      assert.ok(c.hpMax > 0 && c.ac >= 10, g.id);
      const e = generateEncounter(g.id, level, 4, level);
      assert.ok(e.enemies.length > 0 && e.enemies.every((x) => x.count > 0 && x.hp > 0), g.id);
      const s = generateScenario({ genre: g.id, ton: "sombre", level, players: 4, seed: level });
      assert.ok(s.acts.length >= 3 && s.acts.every((a) => a.summary), g.id);
    }
  }
});

test("cartes : dimensions et cases praticables", () => {
  for (const kind of ["donjon", "caverne", "nature", "village"] as MapKind[]) {
    for (const seed of [1, 7, 99]) {
      const m = generateMap({ kind, width: 40, height: 30, seed });
      assert.equal(m.tiles.length, 40 * 30, kind);
      const open = m.tiles.filter(walkable).length;
      assert.ok(open > 120, `${kind} trop fermé (${open})`);
    }
  }
});

test("donjon : une seule porte par ouverture, tout reste relié", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const m = generateMap({ kind: "donjon", width: 47, height: 36, seed: seed * 13 + 391 });
    const W = m.width;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= m.height ? T.vide : m.tiles[y * W + x]);
    for (let y = 0; y < m.height; y++)
      for (let x = 0; x < W; x++) {
        if (at(x, y) !== T.porte) continue;
        // Pas de porte à deux cases ou moins d'une autre : un couloir qui longe une salle ne donne plus une rangée de portes.
        for (let dy = 0; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > 2 || (dy === 0 && dx <= 0)) continue;
            assert.notEqual(at(x + dx, y + dy), T.porte, `graine ${m.seed} : portes trop proches en ${x},${y}`);
          }
        // Une porte est dans le mur d'une salle : une case de salle d'un côté, du couloir de l'autre.
        const inRoom = (px: number, py: number) => m.rooms.some((r) => px >= r.x && py >= r.y && px < r.x + r.w && py < r.y + r.h);
        assert.ok(!inRoom(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inRoom(x + dx, y + dy)), `graine ${m.seed} : porte hors d'un mur de salle en ${x},${y}`);
      }
    // Pas de flaque d'une case isolée dans le bassin : chaque case d'eau en touche au moins deux autres.
    for (let y = 0; y < m.height; y++)
      for (let x = 0; x < W; x++) {
        if (at(x, y) !== T.eau) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => at(x + dx, y + dy) === T.eau).length;
        assert.ok(n >= 2, `graine ${m.seed} : case d'eau isolée en ${x},${y}`);
      }
    // La salle du trône a de la place dès qu'une salle d'au moins 5 × 5 existe.
    const throne = m.rooms.find((r) => r.label === "Salle du trône");
    if (throne && m.rooms.some((r, i) => i > 0 && r.w >= 5 && r.h >= 5)) assert.ok(throne.w >= 5 && throne.h >= 5, `graine ${m.seed} : salle du trône trop petite`);
    // Toutes les cases praticables forment un seul bloc.
    const open = m.tiles.map(walkable);
    const start = open.indexOf(true);
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const c = stack.pop()!;
      const x = c % W;
      const y = Math.floor(c / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= m.height || !open[n] || seen.has(n)) continue;
        seen.add(n);
        stack.push(n);
      }
    }
    assert.equal(seen.size, open.filter(Boolean).length, `graine ${m.seed} : cases coupées du reste`);
  }
});

test("lecture du JSON renvoyé par une IA bavarde", () => {
  const raw = extractJson('<think>hmm</think>Voici : ```json\n{"title": "Le Puits", "acts": [{"title": "A", "summary": "B {x}", "location": "C"}]}\n``` Bonne partie !');
  const s = toScenario(raw, { kind: "scenario", genre: "fantasy", ton: "epique", level: 2, players: 4 });
  assert.equal(s.title, "Le Puits");
  assert.equal(s.acts[0].summary, "B {x}");
  assert.ok(s.npcs.length > 0, "complété par le générateur");
});

test("village : noms uniques, portes ouvertes, rues qui serpentent, tout reste relié", () => {
  let curved = 0;
  for (let seed = 1; seed <= 60; seed++) {
    for (const [width, height] of [[47, 36], [24, 40], [14, 12]]) {
      const m = generateMap({ kind: "village", width, height, seed: seed * 7 + 190 });
      const W = m.width;
      const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= m.height ? T.vide : m.tiles[y * W + x]);
      // Chaque lieu porte un nom, et ce nom n'apparaît qu'une fois.
      const labels = m.rooms.map((r) => r.label ?? "");
      assert.equal(new Set(labels).size, labels.length, `graine ${m.seed} (${width}×${height}) : noms en double ${labels.join(", ")}`);
      assert.ok(labels.every(Boolean), `graine ${m.seed} : lieu sans nom`);
      // Chaque lieu est une pièce fermée de murs, avec au moins une porte qui donne sur une case praticable.
      for (const r of m.rooms) {
        let doors = 0;
        for (let y = r.y; y < r.y + r.h; y++)
          for (let x = r.x; x < r.x + r.w; x++) {
            const ring = x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1;
            if (!ring) continue;
            assert.ok(at(x, y) === T.mur || at(x, y) === T.porte, `graine ${m.seed} : ${r.label} n'est pas fermé en ${x},${y}`);
            if (at(x, y) === T.porte) doors++;
          }
        assert.ok(doors >= 1, `graine ${m.seed} : ${r.label} sans porte`);
      }
      if (width === 47) {
        assert.ok(m.rooms.some((r) => r.label === "Temple") && m.rooms.some((r) => r.label === "Auberge"), `graine ${m.seed} : il manque le temple ou l'auberge`);
        // La grand-rue n'est pas une droite : elle n'entre pas et ne sort pas à la même hauteur.
        const rowAt = (x: number) => [...Array(m.height).keys()].find((y) => at(x, y) === T.route);
        if (rowAt(0) !== rowAt(W - 1)) curved++;
      }
      // Toutes les cases praticables forment un seul bloc.
      const open = m.tiles.map(walkable);
      const start = open.indexOf(true);
      const seen = new Set([start]);
      const stack = [start];
      while (stack.length) {
        const c = stack.pop()!;
        const x = c % W;
        const y = Math.floor(c / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = (y + dy) * W + x + dx;
          if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= m.height || !open[n] || seen.has(n)) continue;
          seen.add(n);
          stack.push(n);
        }
      }
      assert.equal(seen.size, open.filter(Boolean).length, `graine ${m.seed} (${width}×${height}) : cases coupées du reste`);
    }
  }
  assert.ok(curved >= 45, `grand-rue trop souvent droite (${curved} sur 60)`);
});

test("village : rue coudée et cour fermée d'un muret, sans rien couper du praticable", () => {
  let yards = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const m = generateMap({ kind: "village", width: 47, height: 36, seed: seed * 13 + 5 });
    const W = m.width;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= m.height ? T.vide : m.tiles[y * W + x]);
    const inRoom = (x: number, y: number) => m.rooms.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
    // muret : case de mur hors des lieux, avec du praticable des deux côtés (une seule case d'épaisseur)
    let thin = 0;
    for (let y = 0; y < m.height; y++)
      for (let x = 0; x < W; x++) {
        if (at(x, y) !== T.mur || inRoom(x, y)) continue;
        const h = walkable(at(x - 1, y)) && walkable(at(x + 1, y));
        const v = walkable(at(x, y - 1)) && walkable(at(x, y + 1));
        if (h || v) thin++;
      }
    if (thin >= 12) yards++;
    // aucune porte ne donne sur un mur : la case devant chaque porte est praticable
    for (const r of m.rooms)
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          if (at(x, y) !== T.porte) continue;
          const out = x === r.x ? [x - 1, y] : x === r.x + r.w - 1 ? [x + 1, y] : y === r.y ? [x, y - 1] : [x, y + 1];
          assert.ok(walkable(at(out[0], out[1])), `graine ${m.seed} : porte de ${r.label} bouchée`);
        }
  }
  assert.equal(yards, 60, `cour murée absente sur ${60 - yards} graines`);
});

test("village : chaque lieu a une porte à quelques pas d'une rue, et aucune rue ne finit en cul-de-sac", () => {
  for (let seed = 1; seed <= 60; seed++) {
    for (const [width, height] of [[47, 36], [24, 40], [14, 12]]) {
      const m = generateMap({ kind: "village", width, height, seed: seed * 7 + 190 });
      const W = m.width;
      const H = m.height;
      const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? T.vide : m.tiles[y * W + x]);
      const road = (x: number, y: number) => at(x, y) === T.route || at(x, y) === T.eau;
      const inRoom = (x: number, y: number) => m.rooms.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
      // une case de rue a au moins deux voisines de rue, sauf au bord de la carte (la rue en sort)
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (at(x, y) !== T.route) continue;
          const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => road(x + dx, y + dy)).length;
          assert.ok(n >= 2, `graine ${m.seed} (${width}×${height}) : cul-de-sac en ${x},${y}`);
        }
      // la porte principale de chaque lieu rejoint une rue en 4 pas au plus, par l'extérieur
      for (const r of m.rooms) {
        let best = Infinity;
        for (let y = r.y; y < r.y + r.h; y++)
          for (let x = r.x; x < r.x + r.w; x++) {
            if (at(x, y) !== T.porte) continue;
            const o = x === r.x ? [x - 1, y] : x === r.x + r.w - 1 ? [x + 1, y] : y === r.y ? [x, y - 1] : [x, y + 1];
            const seen = new Set([o[1] * W + o[0]]);
            let ring = [o];
            for (let d = 0; d <= 4 && ring.length && d < best; d++) {
              if (ring.some(([a, b]) => road(a, b))) best = d;
              const next: number[][] = [];
              for (const [a, b] of ring)
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                  const [nx, ny] = [a + dx, b + dy];
                  if (seen.has(ny * W + nx) || !walkable(at(nx, ny)) || inRoom(nx, ny)) continue;
                  seen.add(ny * W + nx);
                  next.push([nx, ny]);
                }
              ring = next;
            }
          }
        assert.ok(best <= 4, `graine ${m.seed} (${width}×${height}) : ${r.label} loin de toute rue`);
      }
    }
  }
});

test("village : aucun quart de carte vide, des ruelles entre les maisons", () => {
  let withAlley = 0;
  for (let seed = 1; seed <= 60; seed++) {
    for (const [width, height] of [[47, 36], [24, 40]]) {
      const m = generateMap({ kind: "village", width, height, seed: seed * 7 + 190 });
      const W = m.width;
      const H = m.height;
      const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? T.vide : m.tiles[y * W + x]);
      // chaque quart porte au moins 8 % de cases bâties (murs et portes) : pas de grand pré sans rien
      for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        let built = 0;
        let area = 0;
        for (let y = Math.floor((qy * H) / 2); y < Math.floor(((qy + 1) * H) / 2); y++)
          for (let x = Math.floor((qx * W) / 2); x < Math.floor(((qx + 1) * W) / 2); x++) {
            area++;
            if (at(x, y) === T.mur || at(x, y) === T.porte) built++;
          }
        assert.ok(built / area >= 0.08, `graine ${m.seed} (${width}×${height}) : quart ${qx},${qy} presque vide (${((100 * built) / area).toFixed(1)} %)`);
      }
      if (width !== 47) continue;
      // ruelle : une case de rue serrée entre deux murs
      let alley = false;
      for (let y = 0; y < H && !alley; y++)
        for (let x = 0; x < W && !alley; x++)
          if (at(x, y) === T.route && ((at(x - 1, y) === T.mur && at(x + 1, y) === T.mur) || (at(x, y - 1) === T.mur && at(x, y + 1) === T.mur))) alley = true;
      if (alley) withAlley++;
    }
  }
  assert.ok(withAlley >= 50, `trop peu de ruelles entre deux maisons (${withAlley} villages sur 60)`);
});
