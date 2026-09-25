import { activeQuestions, getCategory, getTheme } from "../content";
import { distribution } from "../mockProgress";
import { href } from "../router";
import { BackLink, PlayLink, Screen, StarBar, StarCounts } from "../ui";

export function ThemeScreen({ themeId }: { themeId: string }) {
  const theme = getTheme(themeId);
  if (!theme) return <Screen>テーマが見つかりません</Screen>;
  const d = distribution(activeQuestions((r) => r.themeId === themeId));
  return (
    <Screen>
      <BackLink href={href.home()} label="ホーム" />
      <h1 class="title">{theme.name}</h1>
      <section class="card">
        <div class="row between">
          <span class="muted small bold">{theme.name}全体</span>
          <span class="muted small"><b class="ink">{d.s3}</b> / {d.total}問 ★★★</span>
        </div>
        <StarBar d={d} thick />
        <StarCounts d={d} />
        <PlayLink big href={href.play(`theme:${themeId}`)} label={`${theme.name}全体を解く`} />
      </section>
      <h2 class="section">サブカテゴリ</h2>
      <div class="stack tight">
        {theme.categories.map((c) => {
          const content = getCategory(themeId, c.id);
          const qs = activeQuestions((r) => r.key === `${themeId}/${c.id}`);
          if (!content || qs.length === 0)
            return (
              <div class="cat-row pending" key={c.id}>
                <span class="bold">{c.name}</span>
                <span class="muted small">問題を準備中</span>
              </div>
            );
          const cd = distribution(qs);
          return (
            <div class="cat-row card" key={c.id}>
              <a class="grow cat-link" href={href.category(themeId, c.id)}>
                <span>
                  <span class="card-title">{c.name}</span>
                  {c.period && <span class="muted tiny"> {c.period[0]}〜{c.period[1]}</span>}
                </span>
                <StarBar d={cd} />
                <span class="muted small">
                  ★★★ {cd.s3} / {cd.total}問{cd.due > 0 && <b class="accent"> ・ 復習 {cd.due}</b>}
                </span>
              </a>
              <PlayLink href={href.play(`cat:${themeId}/${c.id}`)} label={`${c.name}の問題を解く`} />
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
