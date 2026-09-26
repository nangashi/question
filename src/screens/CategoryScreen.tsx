import { activeQuestions, getCategory, getItem, getLesson, getTheme, yearRange } from "../content";
import { distribution } from "../progress";
import { href } from "../router";
import { sectionLength } from "../lesson";
import { BackLink, PlayLink, Screen, StarBar, StarCounts } from "../ui";

export function CategoryScreen({ themeId, categoryId }: { themeId: string; categoryId: string }) {
  const theme = getTheme(themeId);
  const cat = theme?.categories.find((c) => c.id === categoryId);
  const data = getCategory(themeId, categoryId);
  if (!theme || !cat || !data) return <Screen>サブカテゴリが見つかりません</Screen>;
  const qs = activeQuestions((r) => r.key === `${themeId}/${categoryId}`);
  const range = yearRange(themeId, categoryId);
  const lesson = getLesson(themeId, categoryId);
  const d = distribution(qs);
  // ほかのサブカテゴリ・テーマとのつながりの数
  const outer = new Map<string, number>();
  for (const it of data.items)
    for (const l of it.links ?? [])
      for (const id of l.itemIds) {
        const ref = getItem(id)?.ref;
        if (!ref || ref.key === `${themeId}/${categoryId}`) continue;
        const t = getTheme(ref.themeId)!;
        const label = `${t.name} / ${t.categories.find((c) => c.id === ref.categoryId)?.name}`;
        outer.set(label, (outer.get(label) ?? 0) + 1);
      }
  const items = [...data.items].sort((a, b) => (a.year?.from ?? 0) - (b.year?.from ?? 0));
  return (
    <Screen>
      <BackLink href={href.theme(themeId)} label={theme.name} />
      <h1 class="title">{cat.name}</h1>
      {cat.description && <p class="lead">{cat.description}</p>}
      {range && <span class="muted small">{range[0]}〜{range[1]}</span>}
      {lesson && (
        <a class="card link reading-entry" href={href.read(themeId, categoryId)}>
          <span class="row between">
            <span class="card-title">読み物を読む</span>
            <span class="muted small">約{Math.max(1, Math.round(lesson.sections.reduce((n, s) => n + sectionLength(s), 0) / 500))}分 ›</span>
          </span>
          <span class="muted small">この時代の流れを、教科書のように通して読めます。読んでから解いても、先に解いてもかまいません。</span>
        </a>
      )}
      <section class="card">
        <StarBar d={d} thick />
        <StarCounts d={d} />
        <PlayLink big href={href.play(`cat:${themeId}/${categoryId}`)} label={`${cat.name}を解く`} />
      </section>
      <h2 class="section">知識カード</h2>
      <div class="card list">
        {items.map((it) => {
          const iq = qs.filter((q) => q.itemIds.includes(it.id));
          return (
            <a class="list-row" href={href.item(it.id)} key={it.id}>
              <span class="grow item-row">
                <span>{it.title}</span>
                <StarBar d={distribution(iq)} thin />
              </span>
              <span class="chevron" aria-hidden="true">›</span>
            </a>
          );
        })}
      </div>
      {outer.size > 0 && (
        <>
          <h2 class="section">ほかのサブカテゴリ・テーマとのつながり</h2>
          <div class="chips">
            {[...outer].map(([label, n]) => (
              <span class="chip" key={label}>{label} <b>{n}</b></span>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
