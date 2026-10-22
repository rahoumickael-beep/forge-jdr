import { useEffect, useRef, useState } from "react";
import type { RoomView } from "../../../shared/types";
import { send } from "../store";

const DICE = [4, 6, 8, 10, 12, 20, 100];

export function DiceTray({ isGM }: { isGM: boolean }) {
  const [expr, setExpr] = useState("");
  const [secret, setSecret] = useState(false);
  const roll = (e: string) => send("dice:roll", { expr: e, secret });
  return (
    <div className="stack" style={{ padding: "10px 12px", borderTop: "1px solid #00000080", gap: 8 }}>
      <div className="dice-tray">
        {DICE.map((d) => (
          <button key={d} className="die" onClick={() => roll(`1d${d}`)} title={`Lancer 1d${d}`}>
            d{d}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (expr.trim()) void roll(expr.trim());
        }}
      >
        <input id="formule" className="input" style={{ flex: 1, minWidth: 0 }} value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="2d6+3, 1d20adv, 4d6kh3" aria-label="Formule de dés" />
        <button className="btn">Lancer</button>
        {isGM && (
          <label className="small muted" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} /> en secret
          </label>
        )}
      </form>
    </div>
  );
}

export function Log({ room }: { room: RoomView }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [room.chat.length]);
  return (
    <div className="log" ref={ref} aria-live="polite">
      {room.chat.slice(-80).map((m) => (
        <div key={m.id} className={`log-entry ${m.kind}${m.secret ? " secret" : ""}`}>
          {m.kind === "systeme" ? m.text : m.kind === "narration" ? m.text : (
            <>
              <b>{m.from}</b> {m.text}
            </>
          )}
          {m.secret && <span className="tag">secret</span>}
        </div>
      ))}
    </div>
  );
}
