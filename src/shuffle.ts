// 配列をシャッフルした新しい配列を返す（Fisher–Yates）
export function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** ok を満たすまでシャッフルし直す（表示順がそのまま正解になるのを避けるため）。満たせない場合に備えて回数に上限を設ける */
export function shuffleUntil<T>(xs: readonly T[], ok: (a: T[]) => boolean): T[] {
  let a = shuffle(xs);
  for (let i = 0; i < 20 && !ok(a); i++) a = shuffle(xs);
  return a;
}
