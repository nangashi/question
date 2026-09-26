import { render } from "preact";
import { App } from "./app";
import { initProgress } from "./progress";
import "./styles.css";

// 学習記録がブラウザの判断で消されないよう、永続化を求める（ADR-0003）。認められなくても使える
void navigator.storage?.persist?.().catch(() => false);

await initProgress();
render(<App />, document.getElementById("app")!);
