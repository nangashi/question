import type { Response } from "../grading";
import type { Question } from "../schema";

export type FormatProps<T extends Question["type"]> = {
  q: Extract<Question, { type: T }>;
  themeId: string;
  /** 回答済みなら回答内容。未回答なら undefined */
  response: Response | undefined;
  onSubmit: (r: Response) => void;
};
