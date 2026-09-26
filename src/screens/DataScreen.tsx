// 学習記録の書き出し・読み込み（ADR-0003）。ログインなしで使うときの唯一のバックアップ手段
import { useState } from "preact/hooks";
import { z } from "zod";
import { allEntries, isStorageAvailable, mergeEntries } from "../progress";
import { importEntries, type ReviewEntry } from "../reviewLog";
import { href } from "../router";
import { BackLink, Screen } from "../ui";

const backupSchema = z.object({
  version: z.literal(1),
  entries: z.array(
    z.object({
      id: z.string(),
      questionId: z.string(),
      at: z.number(),
      outcome: z.enum(["correct", "near", "partial", "wrong"]),
      rating: z.enum(["Again", "Hard", "Good"]),
    }),
  ),
});

function download(): void {
  const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: allEntries() }, null, 1);
  const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `question-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataScreen() {
  const [message, setMessage] = useState<string>();
  const entries = allEntries();
  const answered = new Set(entries.map((e) => e.questionId)).size;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = backupSchema.parse(JSON.parse(await file.text()));
      const added = mergeEntries(parsed.entries as ReviewEntry[]);
      if (isStorageAvailable()) await importEntries(parsed.entries as ReviewEntry[]);
      setMessage(`${added}件の記録を追加しました（すでにある記録は重複しません）。`);
    } catch {
      setMessage("読み込めませんでした。このアプリで書き出したファイルか確認してください。");
    }
  };

  return (
    <Screen>
      <BackLink href={href.home()} label="ホーム" />
      <h1 class="title">学習記録</h1>
      <section class="card">
        <div class="muted small">この端末に保存されている記録</div>
        <div>
          解答 <b>{entries.length}</b>回 ・ 解いた問題 <b>{answered}</b>問
        </div>
        <p class="muted small" style={{ margin: 0 }}>
          記録はこの端末のブラウザに保存されています。端末を変えるときや、念のための控えとして、ファイルに書き出しておけます。
        </p>
      </section>
      <button type="button" class="btn primary big" onClick={download} disabled={entries.length === 0}>
        記録をファイルに書き出す
      </button>
      <label class="btn ghost big file-input">
        書き出したファイルを読み込む
        <input type="file" accept="application/json,.json" onChange={(e) => onFile((e.target as HTMLInputElement).files?.[0])} />
      </label>
      {message && <div class="notice">{message}</div>}
    </Screen>
  );
}
