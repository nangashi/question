import type { Response } from "../grading";
import type { Question } from "../schema";
import { Choice } from "./Choice";
import { Classify } from "./Classify";
import { MapQ } from "./MapQ";
import { Match } from "./Match";
import { Order } from "./Order";
import { Year } from "./Year";

export const formatLabel: Record<Question["type"], string> = {
  choice: "択一",
  order: "並べ替え",
  match: "組み合わせ",
  classify: "分類",
  year: "年代推定",
  map: "地図",
};

export function labelOf(q: Question): string {
  if (q.type === "choice" && q.media?.some((m) => m.markers)) return "部分指定";
  if (q.type === "choice" && (q.media?.length || q.choices.some((c) => c.media))) return "画像";
  return formatLabel[q.type];
}

type Props = { q: Question; themeId: string; response: Response | undefined; onSubmit: (r: Response) => void };

export function QuestionView({ q, ...rest }: Props) {
  switch (q.type) {
    case "choice":
      return <Choice q={q} {...rest} />;
    case "order":
      return <Order q={q} {...rest} />;
    case "match":
      return <Match q={q} {...rest} />;
    case "classify":
      return <Classify q={q} {...rest} />;
    case "year":
      return <Year q={q} {...rest} />;
    case "map":
      return <MapQ q={q} {...rest} />;
  }
}
