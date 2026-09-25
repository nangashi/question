// 択一（画像付き問題文・画像の選択肢・マーカーによる部分指定を含む）
import { Credit, Img } from "../ui";
import type { FormatProps } from "./types";

export function Choice({ q, themeId, response, onSubmit }: FormatProps<"choice">) {
  const answered = response !== undefined;
  const chosen = response?.type === "choice" ? response.choiceId : undefined;
  const markerMedia = q.media?.find((m) => m.markers);
  const imageChoices = q.choices.some((c) => c.media);
  const state = (id: string) => (!answered ? "" : id === q.answer ? "correct" : id === chosen ? "wrong" : "dim");
  const pick = (id: string) => !answered && onSubmit({ type: "choice", choiceId: id });

  return (
    <div class="format">
      {q.media?.map((m) => (
        <figure class="stem-media" key={m.src}>
          <div class="marker-wrap">
            <Img themeId={themeId} media={m} class="stem-img" />
            {m.markers?.map((mk) => (
              <button
                type="button"
                key={mk.id}
                class={`marker ${state(mk.id)}`}
                style={{ left: `${mk.x * 100}%`, top: `${mk.y * 100}%` }}
                onClick={() => pick(mk.id)}
                aria-label={`マーカー ${mk.label}`}
              >
                {mk.label}
              </button>
            ))}
          </div>
          <Credit media={m} />
        </figure>
      ))}
      <div class={imageChoices ? "choices image-grid" : markerMedia ? "choices marker-grid" : "choices"}>
        {q.choices.map((c, i) => (
          <button type="button" key={c.id} class={`choice ${state(c.id)}`} onClick={() => pick(c.id)} disabled={answered && state(c.id) === "dim"}>
            {c.media ? (
              <>
                <Img themeId={themeId} media={c.media} class="choice-img" />
                <span class="choice-label">{String.fromCharCode(65 + i)}</span>
              </>
            ) : (
              <span class="choice-text">{c.text}</span>
            )}
            {answered && c.id === q.answer && <span class="pill ok">正解</span>}
            {answered && c.id === chosen && c.id !== q.answer && <span class="pill ng">あなたの回答</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
