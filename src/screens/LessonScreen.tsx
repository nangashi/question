// 読み物を 1 節ずつ読み、節ごとに問題を解く（ADR-0010）
import { getLesson, getTheme } from "../content";
import { LessonBody } from "../lessonView";
import { href } from "../router";
import { sectionQuestions } from "../session";
import { BackLink, PlayIcon, Screen } from "../ui";

export function LessonScreen({ themeId, categoryId, section }: { themeId: string; categoryId: string; section: number }) {
  const theme = getTheme(themeId);
  const cat = theme?.categories.find((c) => c.id === categoryId);
  const lesson = getLesson(themeId, categoryId);
  const s = lesson?.sections.find((x) => x.index === section);
  if (!theme || !cat || !lesson || !s) return <Screen>読み物が見つかりません</Screen>;
  const total = lesson.sections.length;
  const count = sectionQuestions(themeId, categoryId, section).length;
  return (
    <Screen>
      <BackLink href={href.category(themeId, categoryId)} label={cat.name} />
      <div class="lesson-head">
        <span class="muted small bold">第{section}節 / 全{total}節</span>
        <div class="progress" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
          {lesson.sections.map((x) => (
            <span key={x.index} class={x.index <= section ? "done" : ""} />
          ))}
        </div>
      </div>
      <h1 class="title">{s.title}</h1>
      <article class="card lesson">
        <LessonBody blocks={s.blocks} />
      </article>
      <div class="stack tight">
        {count > 0 && (
          <a class="btn primary big" href={href.play(`sec:${themeId}/${categoryId}/${section}`)}>
            <PlayIcon />
            この節の問題を解く（{count}問）
          </a>
        )}
        <div class="grid2">
          {section > 1 ? (
            <a class="btn ghost" href={href.read(themeId, categoryId, section - 1)}>‹ 前の節</a>
          ) : (
            <span />
          )}
          {section < total ? (
            <a class="btn ghost" href={href.read(themeId, categoryId, section + 1)}>次の節 ›</a>
          ) : (
            <a class="btn ghost" href={href.category(themeId, categoryId)}>読み終える</a>
          )}
        </div>
      </div>
    </Screen>
  );
}
