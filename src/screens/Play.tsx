import { useMemo, useState } from "preact/hooks";
import { getItem, getTheme } from "../content";
import { labelOf, QuestionView } from "../formats";
import { grade, toRating, type Grade, type Rating, type Response } from "../grading";
import { href } from "../router";
import { categoryOf, pickQuestions } from "../session";
import { Screen } from "../ui";
import { Links } from "./ItemScreen";

type Result = { questionId: string; grade: Grade; rating: Rating };

export function Play({ scope }: { scope: string }) {
  const questions = useMemo(() => pickQuestions(scope), [scope]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<Response | undefined>();
  const [results, setResults] = useState<Result[]>([]);

  if (questions.length === 0) return <Screen>出題できる問題がありません</Screen>;
  if (index >= questions.length) return <Summary questions={questions} results={results} scope={scope} />;

  const q = questions[index]!;
  const ref = categoryOf(q);
  const g = response ? grade(q, response) : undefined;
  const next = (confident: boolean) => {
    setResults([...results, { questionId: q.id, grade: g!, rating: toRating(g!, confident) }]);
    setResponse(undefined);
    setIndex(index + 1);
  };
  const cat = getTheme(ref.themeId)?.categories.find((c) => c.id === ref.categoryId);
  const trivia = q.itemIds.map((id) => getItem(id)?.item.trivia).find(Boolean);

  return (
    <Screen>
      <div class="play-head">
        <a class="icon-btn" href={href.home()} aria-label="中断する">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </a>
        <div class="progress" style={{ gridTemplateColumns: `repeat(${questions.length}, 1fr)` }}>
          {questions.map((_, i) => (
            <span key={i} class={i < index || (i === index && response) ? "done" : ""} />
          ))}
        </div>
        <span class="muted small bold">{index + 1}/{questions.length}</span>
      </div>
      <div class="chips">
        <span class="chip accent">{getTheme(ref.themeId)?.name}</span>
        <span class="chip">{cat?.name}</span>
        <span class="chip">{labelOf(q)}</span>
      </div>
      {g && <Verdict g={g} />}
      <p class="prompt">{q.prompt}</p>
      <QuestionView key={q.id} q={q} themeId={ref.themeId} response={response} onSubmit={setResponse} />
      {!response && (
        <button type="button" class="btn text" onClick={() => setResponse({ type: "skip" })}>
          わからない（答えを見る）
        </button>
      )}
      {response && (
        <>
          <section class="card">
            <div class="muted small bold">解説</div>
            <p class="body">{q.explanation}</p>
          </section>
          <Links itemIds={q.itemIds} />
          {trivia && <p class="trivia"><b>へぇ</b> {trivia}</p>}
          <div class="sticky-actions">
            {g?.outcome === "correct" ? (
              <>
                <div class="muted small center">自信はありましたか？</div>
                <div class="grid2">
                  <button type="button" class="btn ghost big" onClick={() => next(false)}>迷った</button>
                  <button type="button" class="btn primary big" onClick={() => next(true)}>自信あり</button>
                </div>
              </>
            ) : (
              <button type="button" class="btn primary big wide" onClick={() => next(false)}>次へ</button>
            )}
            <button type="button" class="btn text small">この問題の誤りを報告</button>
          </div>
        </>
      )}
    </Screen>
  );
}

function Verdict({ g }: { g: Grade }) {
  const text =
    g.outcome === "correct" ? "正解" : g.outcome === "near" ? "惜しい" : g.outcome === "partial" ? `${g.correctCount} / ${g.total} 正解` : "不正解";
  return <div class={`verdict ${g.outcome}`}>{text}</div>;
}

function Summary({ questions, results, scope }: { questions: ReturnType<typeof pickQuestions>; results: Result[]; scope: string }) {
  const correct = results.filter((r) => r.grade.outcome === "correct").length;
  const cats = [...new Map(questions.map((q) => [categoryOf(q).key, categoryOf(q)])).values()];
  return (
    <Screen>
      <h1 class="title">おつかれさまでした</h1>
      <section class="card center">
        <div class="bignum">{correct}<small> / {results.length}問 正解</small></div>
        <div class="muted small">★が増えた問題 {results.filter((r) => r.rating === "Good").length}問（モック表示）</div>
      </section>
      <div class="card list">
        {questions.map((q, i) => {
          const r = results[i];
          return (
            <div class="list-row" key={q.id}>
              <span class={`mark ${r?.grade.outcome}`}>{r?.grade.outcome === "correct" ? "○" : r?.grade.outcome === "wrong" ? "×" : "△"}</span>
              <span class="grow small">{q.prompt}</span>
              <span class="muted tiny">{r?.rating}</span>
            </div>
          );
        })}
      </div>
      <h2 class="section">進捗を見る</h2>
      <div class="stack tight">
        {cats.map((c) => (
          <a class="card link row between" href={href.category(c.themeId, c.categoryId)} key={c.key}>
            <span class="bold">
              {getTheme(c.themeId)?.name} / {getTheme(c.themeId)?.categories.find((x) => x.id === c.categoryId)?.name}
            </span>
            <span class="accent">›</span>
          </a>
        ))}
      </div>
      <div class="grid2">
        <a class="btn ghost big" href={href.home()}>ホーム</a>
        <a class="btn primary big" href={`${href.play(scope)}&r=${Date.now()}`}>もう5問</a>
      </div>
    </Screen>
  );
}
