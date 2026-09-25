// 組み合わせ: 左をタップしてから右をタップして結ぶ
import { useMemo, useState } from "preact/hooks";
import type { FormatProps } from "./types";

export function Match({ q, response, onSubmit }: FormatProps<"match">) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  // 右側の表示順は正解の並びと揃わないようにずらす
  const right = useMemo(() => [...q.right.slice(1), ...q.right.slice(0, 1)], [q]);
  const correct = Object.fromEntries(q.pairs);

  if (response) {
    const yours = response.type === "match" ? response.pairs : {};
    return (
      <ul class="result-list">
        {q.left.map((l) => {
          const ok = yours[l.id] === correct[l.id];
          const name = (id?: string) => q.right.find((r) => r.id === id)?.text ?? "未回答";
          return (
            <li key={l.id} class={ok ? "correct" : "wrong"}>
              <span class="grow">
                {l.text} — <b>{name(correct[l.id])}</b>
              </span>
              <span class="mark">{ok ? "○" : `あなた: ${name(yours[l.id])}`}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  const pairNo = (leftId: string) => q.left.findIndex((l) => l.id === leftId) + 1;
  const leftOf = (rightId: string) => Object.keys(pairs).find((k) => pairs[k] === rightId);
  const tapLeft = (id: string) => {
    if (pairs[id]) {
      const { [id]: _, ...rest } = pairs;
      setPairs(rest);
    }
    setActive(id);
  };
  const tapRight = (id: string) => {
    if (!active) return;
    const next = Object.fromEntries(Object.entries(pairs).filter(([, r]) => r !== id));
    setPairs({ ...next, [active]: id });
    setActive(null);
  };
  return (
    <div class="format">
      <p class="hint">左を選んでから、右の対応するものをタップ</p>
      <div class="match">
        <div class="col">
          {q.left.map((l) => (
            <button type="button" key={l.id} class={`match-item${active === l.id ? " active" : ""}${pairs[l.id] ? " paired" : ""}`} onClick={() => tapLeft(l.id)}>
              <span class="badge">{pairNo(l.id)}</span>
              {l.text}
            </button>
          ))}
        </div>
        <div class="col">
          {right.map((r) => {
            const l = leftOf(r.id);
            return (
              <button type="button" key={r.id} class={`match-item${l ? " paired" : ""}`} onClick={() => tapRight(r.id)} disabled={!active}>
                <span class="badge">{l ? pairNo(l) : ""}</span>
                {r.text}
              </button>
            );
          })}
        </div>
      </div>
      <div class="actions">
        <button type="button" class="btn ghost" onClick={() => (setPairs({}), setActive(null))} disabled={Object.keys(pairs).length === 0}>
          やり直す
        </button>
        <button type="button" class="btn primary" disabled={Object.keys(pairs).length !== q.left.length} onClick={() => onSubmit({ type: "match", pairs })}>
          これで答える
        </button>
      </div>
    </div>
  );
}
