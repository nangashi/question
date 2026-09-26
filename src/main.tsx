import { render } from "preact";
import { App } from "./app";
import { initProgress } from "./progress";
import "./styles.css";

await initProgress();
render(<App />, document.getElementById("app")!);
