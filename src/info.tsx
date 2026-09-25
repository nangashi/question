// 解説・なぜ・つながり・へぇなどを、同じ見出しの形でまとめて表示する
import type { ComponentChildren } from "preact";
import { getItem } from "./content";
import { href } from "./router";

type IconName = "book" | "why" | "link" | "bulb" | "note";

const icons: Record<IconName, ComponentChildren> = {
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />,
  why: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01" />
    </>
  ),
  link: (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.7 10.6l6.6-3.2M8.7 13.4l6.6 3.2" />
    </>
  ),
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />,
  note: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />,
};

export type InfoSection = { label: string; icon: IconName; body: ComponentChildren };

/** 見出し付きのセクションを 1 枚のカードに並べる。attached は判定の帯の直下に続けて表示する場合 */
export function InfoCard({ sections, attached }: { sections: InfoSection[]; attached?: boolean }) {
  const shown = sections.filter((s) => s.body !== null && s.body !== undefined && s.body !== false);
  if (shown.length === 0) return null;
  return (
    <section class={`info${attached ? " attached" : ""}`}>
      {shown.map((s) => (
        <div class="info-section" key={s.label}>
          <div class="info-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              {icons[s.icon]}
            </svg>
            {s.label}
          </div>
          {s.body}
        </div>
      ))}
    </section>
  );
}

/**
 * 知識カードのつながり。つながりがなければ null。
 * navigable が false のときはリンクにしない（出題中に別の画面へ移ると、解いている流れが途切れるため）
 */
export function LinkList({ itemIds, navigable = true }: { itemIds: string[]; navigable?: boolean }) {
  const links = itemIds.flatMap((id) => getItem(id)?.item.links ?? []).slice(0, 3);
  if (links.length === 0) return null;
  return (
    <div class="link-list">
      {links.map((l, i) => {
        const target = getItem(l.itemIds[0]!);
        const body = (
          <span class="grow">
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
          </span>
        );
        return navigable ? (
          <a class="link-row" href={href.item(l.itemIds[0]!)} key={i}>
            {body}
            <span class="chevron" aria-hidden="true">›</span>
          </a>
        ) : (
          <div class="link-row" key={i}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
