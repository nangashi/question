// 読み物の本文の表示
import type { Block, Inline } from "./lesson";

function Inlines({ inlines }: { inlines: Inline[] }) {
  return <>{inlines.map((i, k) => (i.strong ? <strong key={k}>{i.text}</strong> : i.text))}</>;
}

export function LessonBody({ blocks }: { blocks: Block[] }) {
  return (
    <div class="lesson-body">
      {blocks.map((b, k) =>
        b.kind === "p" ? (
          <p key={k}>
            <Inlines inlines={b.inlines} />
          </p>
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
