// ハッシュルーティング（ADR-0009）
import { useEffect, useState } from "preact/hooks";

export type Route =
  | { name: "home" }
  | { name: "theme"; themeId: string }
  | { name: "category"; themeId: string; categoryId: string }
  | { name: "play"; scope: string }
  | { name: "item"; itemId: string };

export function parseRoute(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  if (parts[0] === "t" && parts[1] && parts[2]) return { name: "category", themeId: parts[1], categoryId: parts[2] };
  if (parts[0] === "t" && parts[1]) return { name: "theme", themeId: parts[1] };
  if (parts[0] === "play") return { name: "play", scope: params.get("scope") ?? "all" };
  if (parts[0] === "item" && parts[1]) return { name: "item", itemId: parts[1] };
  return { name: "home" };
}

export const href = {
  home: () => "#/",
  theme: (themeId: string) => `#/t/${themeId}`,
  category: (themeId: string, categoryId: string) => `#/t/${themeId}/${categoryId}`,
  play: (scope: string) => `#/play?scope=${encodeURIComponent(scope)}`,
  item: (itemId: string) => `#/item/${itemId}`,
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
