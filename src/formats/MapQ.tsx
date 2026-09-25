// 地図: 地域をタップして選び、決定する。小さな地域のために拡大できる
import { useState } from "preact/hooks";
import { content } from "../content";
import type { FormatProps } from "./types";

export function MapQ({ q, response, onSubmit }: FormatProps<"map">) {
  const map = content.maps.get(q.map)!;
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const yours = response?.type === "map" ? response.regionId : undefined;
  const name = (id?: string | null) => map.regions.find((r) => r.id === id)?.name;
  const cls = (id: string) => {
    if (response) return id === q.answer ? "correct" : id === yours ? "wrong" : "";
    return id === selected ? "selected" : "";
  };
  return (
    <div class="format">
      <div class="map-scroll">
        <svg viewBox={map.viewBox} style={{ width: `${zoom * 100}%` }} role="group" aria-label={map.name}>
          <rect x="30" y="40" width="270" height="220" class="map-inset" />
          {map.regions.map((r) => (
            <path key={r.id} d={r.d} class={`region ${cls(r.id)}`} onClick={() => !response && setSelected(r.id)}>
              <title>{r.name}</title>
            </path>
          ))}
        </svg>
      </div>
      <div class="map-bar">
        <span class="map-selected">
          {response ? (
            <>正解: <b>{name(q.answer)}</b>{yours !== q.answer && <> ／ あなた: {name(yours) ?? "未回答"}</>}</>
          ) : selected ? (
            <>選択中: <b>{name(selected)}</b></>
          ) : (
            "地図をタップして選ぶ"
          )}
        </span>
        <span class="zoom">
          <button type="button" class="btn ghost small" onClick={() => setZoom((z) => Math.max(1, z - 1))} disabled={zoom === 1} aria-label="縮小">−</button>
          <button type="button" class="btn ghost small" onClick={() => setZoom((z) => Math.min(3, z + 1))} disabled={zoom === 3} aria-label="拡大">＋</button>
        </span>
      </div>
      <div class="credit">{map.credit}</div>
      {!response && (
        <div class="actions">
          <button type="button" class="btn primary wide" disabled={!selected} onClick={() => selected && onSubmit({ type: "map", regionId: selected })}>
            {selected ? `${name(selected)}で答える` : "地域を選んでください"}
          </button>
        </div>
      )}
    </div>
  );
}
