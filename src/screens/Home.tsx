import { activeQuestions, content, getItem } from "../content";
import { distribution } from "../mockProgress";
import { href } from "../router";
import { Screen, StarBar, StarCounts } from "../ui";

export function Home() {
  const all = distribution(activeQuestions());
  const recent = ["jh-edo-shimabara", "jh-edo-portuguese-ban", "pt-baroque-night-watch"]
    .map((id) => getItem(id))
    .filter((x) => x !== undefined);
  return (
    <Screen>
      <div class="row between">
        <h1 class="title">今日の学習</h1>
        <span class="pill">7日連続</span>
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
        <a class="btn ghost" href={href.play("formats")}>全出題形式を試す（モック）</a>
      </section>
      <section class="stack">
        <h2 class="section">テーマ</h2>
        {content.themes.map((t) => {
          const d = distribution(activeQuestions((r) => r.themeId === t.id));
          return (
            <a class="card link" href={href.theme(t.id)} key={t.id}>
              <div class="row between">
                <span class="card-title">{t.name}<span class="muted small"> {t.categories.length}のサブカテゴリ</span></span>
                <span class="accent small bold">復習 {d.due} ›</span>
              </div>
              <StarBar d={d} />
              <StarCounts d={d} />
            </a>
          );
        })}
      </section>
      <section class="stack">
        <h2 class="section">最近つながった知識</h2>
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
      </section>
    </Screen>
  );
}
