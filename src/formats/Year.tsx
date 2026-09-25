// 年代推定: スライダーと ± ボタンで年を答える
import { useState } from "preact/hooks";
import { getTheme } from "../content";
import { categoryOf } from "../session";
import { Credit, Img } from "../ui";
import type { FormatProps } from "./types";

export function Year({ q, themeId, response, onSubmit }: FormatProps<"year">) {
  const ref = categoryOf(q);
  const period = getTheme(ref.themeId)?.categories.find((c) => c.id === ref.categoryId)?.period;
  const [min, max] = period ? [period[0] - 20, period[1] + 20] : [q.answer - 150, q.answer + 150];
  const [year, setYear] = useState(Math.round((min + max) / 2));
  const yours = response?.type === "year" ? response.year : undefined;
  const pos = (y: number) => `${((y - min) / (max - min)) * 100}%`;
  return (
    <div class="format">
      {q.media?.map((m) => (
        <figure class="stem-media" key={m.src}>
          <Img themeId={themeId} media={m} class="stem-img" />
          <Credit media={m} />
        </figure>
      ))}
      <div class="year-value">
        {response ? (
          <>
            正解 <b>{q.answer}</b>年{yours !== undefined && <span class="sub">（あなた {yours}年・差 {Math.abs(yours - q.answer)}年）</span>}
          </>
        ) : (
          <>
            <b>{year}</b>年
          </>
        )}
      </div>
      <div class="year-track">
        <input
          type="range"
          min={min}
          max={max}
          value={yours ?? year}
          disabled={!!response}
          onInput={(e) => setYear(Number((e.target as HTMLInputElement).value))}
          aria-label="年"
        />
        {response && (
          <div class="year-band" style={{ left: pos(q.answer - q.tolerance), width: `calc(${pos(q.answer + q.tolerance)} - ${pos(q.answer - q.tolerance)})` }} />
        )}
        <div class="year-scale">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      {!response && (
        <>
          <div class="year-steps">
            {[-10, -1, 1, 10].map((d) => (
              <button type="button" key={d} class="btn ghost" onClick={() => setYear((y) => Math.min(max, Math.max(min, y + d)))}>
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
          <div class="actions">
            <button type="button" class="btn primary wide" onClick={() => onSubmit({ type: "year", year })}>
              {year}年で答える
            </button>
          </div>
        </>
      )}
    </div>
  );
}
