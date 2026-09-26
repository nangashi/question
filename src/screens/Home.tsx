import { activeQuestions, content, getItem, getQuestion } from "../content";
import { allEntries, distribution, streakDays } from "../progress";
import { href } from "../router";
import { Screen, StarBar, StarCounts } from "../ui";

/** 最近解いた問題の知識カード（新しい順、重複なし） */
function recentItemIds(n: number): string[] {
  const ids = allEntries()
    .sort((a, b) => b.at - a.at)
    .flatMap((e) => getQuestion(e.questionId)?.question.itemIds ?? []);
  return [...new Set(ids)].slice(0, n);
}

export function Home() {
  const all = distribution(activeQuestions());
  const recent = recentItemIds(3)
    .map((id) => getItem(id))
    .filter((x) => x !== undefined);
  return (
    <Screen>
      <div class="row between">
        <h1 class="title">今日の学習</h1>
        {streakDays() > 0 && <span class="pill">{streakDays()}日連続</span>}
      </div>
      <section class="card today">
        <div class="grid2">
          <div>
            <div class="muted small">復習</div>
            <div class="bignum">{all.due}<small>問</small></div>
          </div>
          <div>
            <div class="muted small">新しい問題</div>
            <div class="bignum accent">{all.fresh}<small>問</small></div>
          </div>
        </div>
        <a class="btn primary big" href={href.play("all")}>おまかせで5問</a>
      </section>
      <section class="stack">
        <h2 class="section">テーマ</h2>
        {content.themes.map((t) => {
          const d = distribution(activeQuestions((r) => r.themeId === t.id));
          // テーマ画面と同じく、問題のあるサブカテゴリだけを数える（ADR-0001）
          const cats = t.categories.filter((c) => activeQuestions((r) => r.key === `${t.id}/${c.id}`).length > 0).length;
          return (
            <a class="card link" href={href.theme(t.id)} key={t.id}>
              <div class="row between">
                <span class="card-title">{t.name}<span class="muted small"> {cats}のサブカテゴリ</span></span>
                <span class="accent small bold">復習 {d.due} ›</span>
              </div>
              <StarBar d={d} />
              <StarCounts d={d} />
            </a>
          );
        })}
      </section>
      {recent.length > 0 && <section class="stack">
        <h2 class="section">最近学んだ知識</h2>
        <div class="grid3">
          {recent.map(({ item, ref }) => {
            const t = content.themes.find((x) => x.id === ref.themeId);
            const qs = activeQuestions().filter((q) => q.itemIds.includes(item.id));
            return (
              <a class="card mini link" href={href.item(item.id)} key={item.id}>
                <span class="muted tiny">{item.year?.from} ・ {t?.name}</span>
                <span class="bold small">{item.title}</span>
                <StarBar d={distribution(qs)} thin />
              </a>
            );
          })}
        </div>
      </section>}
      <a class="btn text small" href={href.data()}>学習記録の書き出し・読み込み</a>
    </Screen>
  );
}
