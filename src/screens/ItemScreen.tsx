import { activeQuestions, getItem, getTheme } from "../content";
import { labelOf } from "../formats";
import { stars } from "../mockProgress";
import { href } from "../router";
import { Credit, Img, PlayLink, Screen, Stars } from "../ui";

export function ItemScreen({ itemId }: { itemId: string }) {
  const found = getItem(itemId);
  if (!found) return <Screen>知識カードが見つかりません</Screen>;
  const { item, ref } = found;
  const theme = getTheme(ref.themeId)!;
  const cat = theme.categories.find((c) => c.id === ref.categoryId)!;
  const qs = activeQuestions().filter((q) => q.itemIds.includes(item.id));
  return (
    <Screen>
      <button type="button" class="back" onClick={() => history.back()}>
        ‹ 戻る
      </button>
      <a class="muted small" href={href.category(ref.themeId, ref.categoryId)}>
        {theme.name} / {cat.name}
      </a>
      <h1 class="title">{item.title}</h1>
      <div class="muted small">
        {[item.year && `${item.year.from}${item.year.to ? `〜${item.year.to}` : ""}年${item.year.approx ? "ごろ" : ""}`, item.place?.name, item.people?.join("・")]
          .filter(Boolean)
          .join(" ・ ")}
      </div>
      {item.media?.map((m) => (
        <figure class="stem-media" key={m.src}>
          <Img themeId={ref.themeId} media={m} class="stem-img" />
          <Credit media={m} />
        </figure>
      ))}
      <section class="card">
        <p class="body">{item.summary}</p>
        {item.trivia && <p class="trivia"><b>へぇ</b> {item.trivia}</p>}
      </section>
      <Links itemIds={[item.id]} />
      <h2 class="section">この知識の問題</h2>
      <div class="card list">
        {qs.map((q) => (
          <div class="list-row" key={q.id}>
            <span class="tag-type">{labelOf(q)}</span>
            <span class="grow small">{q.prompt}</span>
            <Stars n={stars(q)} />
          </div>
        ))}
      </div>
      <PlayLink big href={href.play(`item:${item.id}`)} label="この知識の問題を解く" />
    </Screen>
  );
}

/** 知識カードのつながりを表示する（解説画面と共通） */
export function Links({ itemIds }: { itemIds: string[] }) {
  const links = itemIds.flatMap((id) => getItem(id)?.item.links ?? []);
  if (links.length === 0) return null;
  return (
    <section class="stack tight">
      <h2 class="section">つながり</h2>
      {links.slice(0, 3).map((l, i) => {
        const target = getItem(l.itemIds[0]!);
        return (
          <a class="card link link-card" href={href.item(l.itemIds[0]!)} key={i}>
            <span class="row gap">
              <span class="axis">{l.axis}</span>
              {target && (
                <span class="muted tiny">
                  {target.item.title}
                  {target.item.year && ` ・ ${target.item.year.from}年`}
                </span>
              )}
            </span>
            <span class="small">{l.text}</span>
          </a>
        );
      })}
    </section>
  );
}
