// 分類: 各項目の分類先をボタンで選ぶ
import { useState } from "preact/hooks";
import type { FormatProps } from "./types";

export function Classify({ q, response, onSubmit }: FormatProps<"classify">) {
  const [buckets, setBuckets] = useState<Record<string, string>>({});
  const yours = response?.type === "classify" ? response.buckets : undefined;
  return (
    <div class="format">
      <div class="classify">
        {q.entries.map((e) => {
          const state = !response ? "" : yours?.[e.id] === e.bucket ? "correct" : "wrong";
          return (
            <div key={e.id} class={`classify-row ${state}`}>
              <div class="grow">{e.text}</div>
              <div class="seg" role="group" aria-label={e.text}>
                {q.buckets.map((b) => {
                  const on = (response ? yours?.[e.id] : buckets[e.id]) === b.id;
                  const isAnswer = response && e.bucket === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      class={`${on ? "on" : ""}${isAnswer ? " answer" : ""}`}
                      aria-pressed={on}
                      disabled={!!response}
                      onClick={() => setBuckets({ ...buckets, [e.id]: b.id })}
                    >
                      {b.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {!response && (
        <div class="actions">
          <button type="button" class="btn primary wide" disabled={Object.keys(buckets).length !== q.entries.length} onClick={() => onSubmit({ type: "classify", buckets })}>
            これで答える
          </button>
        </div>
      )}
    </div>
  );
}
