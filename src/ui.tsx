// 画面間で共通の部品
import type { ComponentChildren } from "preact";
import { mediaUrl } from "./content";
import type { Distribution } from "./progress";
import type { Media } from "./schema";

/** ★の分布のバー。thick は全体の進捗、thin は知識カードごとの進捗に使う */
export function StarBar({ d, thick, thin }: { d: Distribution; thick?: boolean; thin?: boolean }) {
  const pct = (n: number) => `${d.total === 0 ? 0 : (n / d.total) * 100}%`;
  return (
    <div class={`starbar${thick ? " thick" : ""}${thin ? " thin" : ""}`} aria-hidden="true">
      <span class="s3" style={{ width: pct(d.s3) }} />
      <span class="s2" style={{ width: pct(d.s2) }} />
      <span class="s1" style={{ width: pct(d.s1) }} />
    </div>
  );
}

export function StarCounts({ d }: { d: Distribution }) {
  return (
    <div class="starcounts">
      <span><b>★★★</b> {d.s3}</span>
      <span><b>★★</b> {d.s2}</span>
      <span><b>★</b> {d.s1}</span>
      <span>未学習 {d.fresh}</span>
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span class="stars" aria-label={n === 0 ? "未学習" : `定着度 ${n}`}>
      {"★".repeat(n)}
      <span class="off">{"★".repeat(3 - n)}</span>
    </span>
  );
}

export function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

export function PlayLink({ href, label, big }: { href: string; label: string; big?: boolean }) {
  return (
    <a class={big ? "btn primary play big" : "btn primary play"} href={href} aria-label={label}>
      <PlayIcon />
      {big ? label : "解く"}
    </a>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a class="back" href={href}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {label}
    </a>
  );
}

export function Img({ themeId, media, class: cls }: { themeId: string; media: Media; class?: string }) {
  const url = mediaUrl(themeId, media);
  if (!url)
    return (
      <div class={`img-missing ${cls ?? ""}`} role="img" aria-label={media.alt}>
        画像なし（pnpm fetch:images）
        <small>{media.alt}</small>
      </div>
    );
  return <img class={cls} src={url} alt={media.alt} loading="lazy" />;
}

export function Credit({ media }: { media: Media }) {
  if (!media.credit) return null;
  return (
    <div class="credit">
      {media.sourceUrl ? <a href={media.sourceUrl} target="_blank" rel="noreferrer">{media.credit}</a> : media.credit}
    </div>
  );
}

export function Screen({ children }: { children: ComponentChildren }) {
  return <main class="screen">{children}</main>;
}
