// 読み物（ADR-0010）の解析。Markdown のうち、見出し・段落・箇条書き・強調・画像だけを扱う

export type Inline = { text: string; strong?: boolean };
export type Block =
  | { kind: "p"; inlines: Inline[] }
  | { kind: "ul"; items: Inline[][] }
  | { kind: "img"; src: string; caption: string };

const IMAGE = /^!\[(.*?)\]\((.+?)\)$/;
export type LessonSection = { index: number; title: string; itemIds: string[]; blocks: Block[] };
export type Lesson = { title?: string; sections: LessonSection[] };

const ITEMS = /^<!--\s*items:\s*(.*?)\s*-->$/;

/** **強調** を分解する */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1]!, strong: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

function toBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", inlines: parseInline(para.join("")) });
    if (list.length) blocks.push({ kind: "ul", items: list.map(parseInline) });
    para = [];
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flush();
    } else if (IMAGE.test(line)) {
      // 画像は単独の行に書く: ![キャプション](images/ファイル名.jpg)
      flush();
      const [, caption = "", src = ""] = IMAGE.exec(line)!;
      blocks.push({ kind: "img", src, caption });
    } else if (line.startsWith("- ")) {
      if (para.length) flush();
      list.push(line.slice(2));
    } else {
      if (list.length) flush();
      // 日本語の文章は行をまたいでもそのまま連結する
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export function parseLesson(md: string): { lesson: Lesson; errors: string[] } {
  const errors: string[] = [];
  const lesson: Lesson = { sections: [] };
  let current: { title: string; itemIds: string[]; lines: string[] } | undefined;
  const close = () => {
    if (!current) return;
    lesson.sections.push({
      index: lesson.sections.length + 1,
      title: current.title,
      itemIds: current.itemIds,
      blocks: toBlocks(current.lines),
    });
  };
  for (const line of md.split(/\r?\n/)) {
    if (line.startsWith("# ")) {
      lesson.title = line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      close();
      current = { title: line.slice(3).trim(), itemIds: [], lines: [] };
    } else if (current && ITEMS.test(line.trim())) {
      current.itemIds = ITEMS.exec(line.trim())![1]!.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim() !== "") {
      errors.push("最初の節（## 見出し）より前に本文がある");
    }
  }
  close();
  if (lesson.sections.length === 0) errors.push("節（## 見出し）がない");
  lesson.sections.forEach((s) => {
    if (s.itemIds.length === 0) errors.push(`節「${s.title}」に <!-- items: ... --> がない`);
    if (s.blocks.length === 0) errors.push(`節「${s.title}」に本文がない`);
  });
  return { lesson, errors };
}

/** 本文の文字数（分量の目安の確認用） */
export function sectionLength(s: LessonSection): number {
  return s.blocks
    .flatMap((b) => (b.kind === "p" ? [b.inlines] : b.kind === "ul" ? b.items : []))
    .flat()
    .reduce((n, i) => n + i.text.length, 0);
}
