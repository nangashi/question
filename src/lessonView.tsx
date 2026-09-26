// 読み物の本文の表示
import { content } from "./content";
import type { Block, Inline } from "./lesson";
import { findThemeMedia } from "./schema";
import { Credit, Img } from "./ui";

function Inlines({ inlines }: { inlines: Inline[] }) {
  return <>{inlines.map((i, k) => (i.strong ? <strong key={k}>{i.text}</strong> : i.text))}</>;
}

function LessonImage({ themeId, src, caption }: { themeId: string; src: string; caption: string }) {
  const media = findThemeMedia(content, themeId, src);
  if (!media) return null;
  return (
    <figure class="lesson-figure">
      <Img themeId={themeId} media={media} class="lesson-img" />
      <figcaption>
        {caption}
        <Credit media={media} />
      </figcaption>
    </figure>
  );
}

export function LessonBody({ blocks, themeId }: { blocks: Block[]; themeId: string }) {
  return (
    <div class="lesson-body">
      {blocks.map((b, k) =>
        b.kind === "p" ? (
          <p key={k}>
            <Inlines inlines={b.inlines} />
          </p>
        ) : b.kind === "img" ? (
          <LessonImage key={k} themeId={themeId} src={b.src} caption={b.caption} />
        ) : (
          <ul key={k}>
            {b.items.map((it, j) => (
              <li key={j}>
                <Inlines inlines={it} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
