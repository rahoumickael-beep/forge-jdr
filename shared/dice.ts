// Lancers de dés au format "2d6+3", "d20", "4d6kh3" (garder les 3 meilleurs), "1d20adv" (avantage).

export interface DiceResult {
  expression: string;
  sides: number;
  rolls: number[];
  kept: number[];
  modifier: number;
  total: number;
  detail: string;
}

const RE = /^\s*(\d*)d(\d+)(?:(kh|kl)(\d+))?(adv|dis)?\s*([+-]\s*\d+)?\s*$/i;

export function parseDice(expr: string): boolean {
  return RE.test(expr);
}

export function rollDice(expr: string, random: () => number = Math.random): DiceResult {
  const m = RE.exec(expr);
  if (!m) throw new Error(`Formule de dés invalide : "${expr}". Exemple : 2d6+3`);
  let count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  let keepMode = m[3]?.toLowerCase() as "kh" | "kl" | undefined;
  let keepN = m[4] ? parseInt(m[4], 10) : undefined;
  const advDis = m[5]?.toLowerCase();
  const modifier = m[6] ? parseInt(m[6].replace(/\s/g, ""), 10) : 0;
  if (advDis) {
    count = Math.max(count, 2);
    keepMode = advDis === "adv" ? "kh" : "kl";
    keepN = 1;
  }
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) throw new Error("Entre 1 et 100 dés, de 2 à 1000 faces.");
  const rolls = Array.from({ length: count }, () => Math.floor(random() * sides) + 1);
  let kept = rolls;
  if (keepMode && keepN) {
    const sorted = [...rolls].sort((a, b) => (keepMode === "kh" ? b - a : a - b));
    kept = sorted.slice(0, keepN);
  }
  const total = kept.reduce((a, b) => a + b, 0) + modifier;
  const mod = modifier ? (modifier > 0 ? ` + ${modifier}` : ` - ${-modifier}`) : "";
  const detail = `[${rolls.join(", ")}]${kept !== rolls ? ` garde ${kept.join(", ")}` : ""}${mod}`;
  return { expression: expr.trim(), sides, rolls, kept, modifier, total, detail };
}
