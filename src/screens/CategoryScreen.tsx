import { activeQuestions, getCategory, getItem, getTheme } from "../content";
import { distribution, stars } from "../mockProgress";
import { href } from "../router";
import { BackLink, PlayLink, Screen, StarBar, StarCounts, Stars } from "../ui";

export function CategoryScreen({ themeId, categoryId }: { themeId: string; categoryId: string }) {
  const theme = getTheme(themeId);
  const cat = theme?.categories.find((c) => c.id === categoryId);
  const data = getCategory(themeId, categoryId);
  if (!theme || !cat || !data) return <Screen>サブカテゴリが見つかりません</Screen>;
  const qs = activeQuestions((r) => r.key === `${themeId}/${categoryId}`);
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
      <div class="row baseline">
        <h1 class="title">{cat.name}</h1>
        {cat.period && <span class="muted small">{cat.period[0]}〜{cat.period[1]}</span>}
      </div>
      <section class="card">
        <StarBar d={d} thick />
        <StarCounts d={d} />
        <div class="notice">あと<b>2問</b>を★★★にすると、<b>5問</b>解放（モック表示）</div>
        <PlayLink big href={href.play(`cat:${themeId}/${categoryId}`)} label={`${cat.name}を解く`} />
      </section>
      <h2 class="section">知識カード</h2>
      <div class="card list">
        {items.map((it) => {
          const iq = qs.filter((q) => q.itemIds.includes(it.id));
          return (
            <a class="list-row" href={href.item(it.id)} key={it.id}>
              <span class="muted tiny year">{it.year?.from ?? "—"}</span>
              <span class="grow">{it.title}</span>
              <span class="stars-col">
                {iq.map((q) => (
                  <Stars n={stars(q)} key={q.id} />
                ))}
              </span>
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
