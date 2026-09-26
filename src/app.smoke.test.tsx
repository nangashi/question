// @vitest-environment jsdom
// 全画面の描画と、全出題形式の回答〜結果表示までを通す動作確認
import { render } from "preact";
import { act } from "preact/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./app";
import { content, contentErrors, getItem } from "./content";
import { allEntries, resetProgressForTest } from "./progress";

let root: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById("app")!;
  window.scrollTo = () => {};
});

async function go(hash: string) {
  await act(async () => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}
const click = async (el: Element | null | undefined) => {
  expect(el, "クリック対象がない").toBeTruthy();
  await act(async () => (el as HTMLElement).click());
};
const buttons = (text: RegExp | string) =>
  [...root.querySelectorAll("button")].filter((b) => (typeof text === "string" ? b.textContent?.includes(text) : text.test(b.textContent ?? "")));

describe("画面", () => {
  it("ホーム・テーマ・サブカテゴリ・知識カードが描画できる", async () => {
    await act(async () => render(<App />, root));
    await go("#/");
    expect(root.textContent).toContain("今日の学習");
    await go("#/t/japanese-history");
    expect(root.textContent).toContain("宗教の移り変わり");
    await go("#/t/japanese-history/religion");
    expect(root.textContent).toContain(getItem("jh-religion-kokubunji")!.item.title);
    await go("#/item/jh-religion-kokubunji");
    expect(root.textContent).toContain("つながり");
    // 読み物は 1 ページで通して読め、見出しごとに問題へ移れる
    await go("#/read/painting/overview");
    expect(root.querySelectorAll(".lesson-h2").length).toBeGreaterThan(1);
    expect(root.querySelector(".section-quiz")).toBeTruthy();
    // 読み物の中に作品の画像とキャプションが出る
    expect(root.querySelector(".lesson-figure figcaption")).toBeTruthy();
    expect(root.textContent).toContain("問題を解く");
  });
});

describe("全出題形式", () => {
  it("すべての形式で回答して結果画面まで進める", async () => {
    resetProgressForTest();
    await act(async () => render(<App />, root));
    await go("#/play?scope=formats");
    const seen: string[] = [];
    for (let i = 0; i < 20 && !root.textContent?.includes("おつかれさまでした"); i++) {
      const chip = [...root.querySelectorAll(".chip")].at(-1)?.textContent ?? "";
      seen.push(chip);
      if (root.querySelector(".order-item")) {
        for (const b of root.querySelectorAll(".order-item")) await click(b);
        await click(buttons("この順で答える")[0]);
      } else if (root.querySelector(".match-item")) {
        const cols = root.querySelectorAll(".match .col");
        const lefts = cols[0]!.querySelectorAll("button");
        const rights = cols[1]!.querySelectorAll("button");
        for (let k = 0; k < lefts.length; k++) {
          await click(lefts[k]);
          await click(cols[1]!.querySelectorAll("button")[k] ?? rights[k]);
        }
        await click(buttons("これで答える")[0]);
      } else if (root.querySelector(".classify")) {
        for (const row of root.querySelectorAll(".classify-row")) await click(row.querySelector(".seg button"));
        await click(buttons("これで答える")[0]);
      } else if (root.querySelector(".year-track")) {
        await click(buttons("+10")[0]);
        await click(buttons(/年で答える/)[0]);
      } else if (root.querySelector(".map-scroll")) {
        await act(async () => {
          root.querySelector("path.region")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        await click(buttons(/で答える/)[0]);
      } else {
        await click(root.querySelector(".choice"));
      }
      expect(root.querySelector(".verdict-bar"), `${chip} の判定が出ない`).toBeTruthy();
      expect(root.textContent).toContain("解説");
      await click(buttons("自信あり")[0] ?? buttons("次へ")[0]);
    }
    expect(root.textContent).toContain("おつかれさまでした");
    // 解いた問題はすべて学習記録に残る
    expect(allEntries().length).toBe(seen.length);
    // ホームに、解いた問題の知識カードが出る
    await go("#/");
    expect(root.textContent).toContain("最近学んだ知識");
    expect(new Set(seen)).toEqual(new Set(["択一", "画像", "部分指定", "並べ替え", "組み合わせ", "分類", "年代推定", "地図"]));
  });

  it("別の画面へ移ってから戻ると、出題の続きから再開できる", async () => {
    localStorage.clear();
    await act(async () => render(<App />, root));
    await go("#/play?scope=formats");
    const playHash = location.hash;
    expect(playHash).toMatch(/&s=/);
    const first = root.querySelector(".prompt")?.textContent;
    // 1 問目を「わからない」で答えて 2 問目へ進む
    await click(buttons("わからない")[0]);
    await click(buttons("次へ")[0]);
    const second = root.querySelector(".prompt")?.textContent;
    expect(second).not.toBe(first);
    // 別の画面へ移り、戻る
    await go("#/item/jh-religion-kokubunji");
    await go(playHash);
    expect(root.querySelector(".prompt")?.textContent).toBe(second);
    expect(root.textContent).toContain("2/");
  });

  it("新しく始めると、別の出題になる", async () => {
    localStorage.clear();
    await act(async () => render(<App />, root));
    await go("#/play?scope=formats");
    const firstHash = location.hash;
    await go("#/");
    await go("#/play?scope=formats");
    expect(location.hash).not.toBe(firstHash);
    expect(root.textContent).toContain("1/");
  });

  it("テスト用サンプル（src/test/fixtures/content/）は検証を通り、全形式を含む", () => {
    expect(contentErrors).toEqual([]);
    const sample = [...content.categories].filter(([key]) => key.startsWith("sample/")).flatMap(([, c]) => c.questions);
    expect(new Set(sample.map((q) => q.type))).toEqual(new Set(["choice", "order", "match", "classify", "year", "map"]));
    expect(sample.some((q) => q.type === "choice" && q.media?.some((m) => m.markers))).toBe(true);
  });
});
