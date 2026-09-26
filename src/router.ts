// ハッシュルーティング（ADR-0009）
import { useEffect, useState } from "preact/hooks";

export type Route =
  | { name: "home" }
  | { name: "theme"; themeId: string }
  | { name: "category"; themeId: string; categoryId: string }
  | { name: "play"; scope: string; sessionId?: string }
  | { name: "item"; itemId: string }
  | { name: "read"; themeId: string; categoryId: string; section?: number }
  | { name: "data" };

export function parseRoute(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  if (parts[0] === "t" && parts[1] && parts[2]) return { name: "category", themeId: parts[1], categoryId: parts[2] };
  if (parts[0] === "t" && parts[1]) return { name: "theme", themeId: parts[1] };
  if (parts[0] === "play") return { name: "play", scope: params.get("scope") ?? "all", sessionId: params.get("s") ?? undefined };
  if (parts[0] === "item" && parts[1]) return { name: "item", itemId: parts[1] };
  if (parts[0] === "data") return { name: "data" };
  if (parts[0] === "read" && parts[1] && parts[2])
    return { name: "read", themeId: parts[1], categoryId: parts[2], section: Number(params.get("n")) || undefined };
  return { name: "home" };
}

export const href = {
  home: () => "#/",
  theme: (themeId: string) => `#/t/${themeId}`,
  category: (themeId: string, categoryId: string) => `#/t/${themeId}/${categoryId}`,
  play: (scope: string, sessionId?: string) =>
    `#/play?scope=${encodeURIComponent(scope)}${sessionId ? `&s=${encodeURIComponent(sessionId)}` : ""}`,
  item: (itemId: string) => `#/item/${itemId}`,
  data: () => "#/data",
  /** section を省くと、前回読んでいた位置から表示する */
  read: (themeId: string, categoryId: string, section?: number) =>
    `#/read/${themeId}/${categoryId}${section ? `?n=${section}` : ""}`,
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
