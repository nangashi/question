import { contentErrors } from "./content";
import { useRoute } from "./router";
import { CategoryScreen } from "./screens/CategoryScreen";
import { Home } from "./screens/Home";
import { ItemScreen } from "./screens/ItemScreen";
import { Play } from "./screens/Play";
import { ThemeScreen } from "./screens/ThemeScreen";

export function App() {
  const route = useRoute();
  return (
    <>
      {import.meta.env.DEV && contentErrors.length > 0 && (
        <details class="content-errors">
          <summary>問題データのエラー {contentErrors.length}件</summary>
          <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </details>
      )}
      {route.name === "home" && <Home />}
      {route.name === "theme" && <ThemeScreen themeId={route.themeId} />}
      {route.name === "category" && <CategoryScreen themeId={route.themeId} categoryId={route.categoryId} />}
      {route.name === "play" && <Play key={`${route.scope}/${route.sessionId ?? ""}`} scope={route.scope} sessionId={route.sessionId} />}
      {route.name === "item" && <ItemScreen itemId={route.itemId} />}
    </>
  );
}
