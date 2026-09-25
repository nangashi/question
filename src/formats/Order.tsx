// 並べ替え: 項目を順番にタップして番号を振る
import { useState } from "preact/hooks";
import type { FormatProps } from "./types";

export function Order({ q, response, onSubmit }: FormatProps<"order">) {
  const [picked, setPicked] = useState<string[]>([]);
  if (response) {
    const order = response.type === "order" ? response.order : [];
    return (
      <ol class="result-list">
        {q.answer.map((id, i) => {
          const e = q.entries.find((x) => x.id === id)!;
          const ok = order[i] === id;
          const yours = order.indexOf(id);
          return (
            <li key={id} class={ok ? "correct" : "wrong"}>
              <span class="num">{i + 1}</span>
              <span class="grow">{e.text}</span>
              <span class="mark">{ok ? "○" : yours >= 0 ? `あなた: ${yours + 1}番目` : "未回答"}</span>
            </li>
          );
        })}
      </ol>
    );
  }
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div class="format">
      <p class="hint">古いものから順にタップ。もう一度タップで取り消し</p>
      <div class="order-list">
        {q.entries.map((e) => {
          const n = picked.indexOf(e.id);
          return (
            <button type="button" key={e.id} class={`order-item${n >= 0 ? " on" : ""}`} onClick={() => toggle(e.id)}>
              <span class="num">{n >= 0 ? n + 1 : ""}</span>
              <span class="grow">{e.text}</span>
            </button>
          );
        })}
      </div>
      <div class="actions">
        <button type="button" class="btn ghost" onClick={() => setPicked([])} disabled={picked.length === 0}>
          やり直す
        </button>
        <button type="button" class="btn primary" disabled={picked.length !== q.entries.length} onClick={() => onSubmit({ type: "order", order: picked })}>
          この順で答える
        </button>
      </div>
    </div>
  );
}
