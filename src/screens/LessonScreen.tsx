// 読み物を 1 本の文章として通して読む（ADR-0010）。
// 見出しは目次と問題との対応に使い、読んでいた位置を覚えて、問題から戻ってきたときに続きから読めるようにする
import { useEffect } from "preact/hooks";
import { getLesson, getTheme } from "../content";
import { sectionLength } from "../lesson";
import { LessonBody } from "../lessonView";
import { href } from "../router";
import { sectionQuestions } from "../session";
import { BackLink, PlayIcon, Screen } from "../ui";

const positionKey = (themeId: string, categoryId: string) => `read:${themeId}/${categoryId}`;

function loadPosition(key: string): number | undefined {
  try {
    const v = localStorage.getItem(key);
    return v === null ? undefined : Number(v);
  } catch {
    return undefined;
  }
}

function savePosition(key: string, y: number): void {
  try {
    localStorage.setItem(key, String(Math.round(y)));
  } catch {
    // 保存できなくても読める
  }
}

const scrollToSection = (n: number) => document.getElementById(`sec-${n}`)?.scrollIntoView({ block: "start" });

export function LessonScreen({ themeId, categoryId, section }: { themeId: string; categoryId: string; section?: number }) {
  const theme = getTheme(themeId);
  const cat = theme?.categories.find((c) => c.id === categoryId);
  const lesson = getLesson(themeId, categoryId);
  const key = positionKey(themeId, categoryId);

  useEffect(() => {
    // 見出しの指定があればそこへ、なければ前回読んでいた位置へ
    if (section) scrollToSection(section);
    else window.scrollTo(0, loadPosition(key) ?? 0);
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => savePosition(key, window.scrollY));
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
    };
  }, [key, section]);

  if (!theme || !cat || !lesson) return <Screen>読み物が見つかりません</Screen>;
  const minutes = Math.max(1, Math.round(lesson.sections.reduce((n, s) => n + sectionLength(s), 0) / 500));
  return (
    <Screen>
      <BackLink href={href.category(themeId, categoryId)} label={cat.name} />
      <h1 class="title">{lesson.title ?? cat.name}</h1>
      {cat.description && <p class="lead">{cat.description}</p>}
      <span class="muted small">約{minutes}分で読めます</span>
      <nav class="card toc" aria-label="目次">
        <span class="muted small bold">目次</span>
        <ol class="section-list">
          {lesson.sections.map((s) => (
            <li key={s.index}>
              <button type="button" onClick={() => scrollToSection(s.index)}>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <article class="card lesson">
        {lesson.sections.map((s) => {
          const count = sectionQuestions(themeId, categoryId, s.index).length;
          return (
            <section class="lesson-section" id={`sec-${s.index}`} key={s.index}>
              <h2 class="lesson-h2">{s.title}</h2>
              <LessonBody blocks={s.blocks} />
              {count > 0 && (
                <a class="section-quiz" href={href.play(`sec:${themeId}/${categoryId}/${s.index}`)}>
                  <PlayIcon />
                  この部分の問題を解く（{count}問）
                </a>
              )}
            </section>
          );
        })}
      </article>
      <div class="sticky-actions">
        <a class="btn primary big" href={href.play(`cat:${themeId}/${categoryId}`)}>
          <PlayIcon />
          {cat.name}の問題を解く
        </a>
      </div>
    </Screen>
  );
}
