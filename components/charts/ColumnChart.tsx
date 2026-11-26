"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type Series = { key: string; label: string; color: string };
export type Column = { key: string; label: string };

/** A round axis maximum (1, 2, 2.5, 5 × 10^n) at or above `max`. */
export function niceMax(max: number): number {
  if (max <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * pow >= max) return Math.max(4, step * pow);
  }
  return 10 * pow;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Columns on one y-axis: one series or a few side by side (fixed categorical
 * order, never cycled). Bars grow from the baseline; hovering a column shows a
 * rich tooltip. The SVG is an image with a summary label; the same numbers are
 * in the panel's table view for screen readers and keyboard users.
 */
export function ColumnChart<D extends Column>({
  data,
  series,
  value,
  tooltip,
  summary,
  height = 220,
}: {
  data: D[];
  series: Series[];
  value: (d: D, s: Series) => number;
  tooltip?: (d: D) => ReactNode;
  /** Short text alternative, e.g. "Leads created and won per week, last 13 weeks". */
  summary: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const left = 34;
  const bottom = 24;
  const top = 8;
  const plotW = Math.max(0, width - left - 4);
  const plotH = height - top - bottom;
  const max = niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => value(d, s)))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const band = data.length ? plotW / data.length : 0;
  const groupW = Math.min(band * 0.72, series.length * 22);
  const gap = series.length > 1 ? 2 : 0;
  const barW = Math.max(2, (groupW - gap * (series.length - 1)) / series.length);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));

  return (
    <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={summary} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width - 4} y1={y(t)} y2={y(t)} stroke="var(--grid-line)" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--fg-muted)" className="tabular">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const gx = left + i * band + (band - groupW) / 2;
            return (
              <g key={d.key}>
                {hover === i && <rect x={left + i * band} y={top} width={band} height={plotH} fill="var(--sunken)" opacity="0.7" rx="4" />}
                {series.map((s, k) => {
                  const v = value(d, s);
                  const h = Math.max(v > 0 ? 2 : 0, (v / max) * plotH);
                  return (
                    <rect
                      key={s.key}
                      x={gx + k * (barW + gap)}
                      y={top + plotH - h}
                      width={barW}
                      height={h}
                      rx={Math.min(4, barW / 2)}
                      fill={s.color}
                      className="grow-y [transform-box:fill-box]"
                      style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                    />
                  );
                })}
                {i % labelEvery === 0 && (
                  <text x={left + i * band + band / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--fg-muted)">
                    {d.label}
                  </text>
                )}
                {/* Hit area larger than the bars */}
                <rect
                  x={left + i * band}
                  y={top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerMove={() => hover !== i && setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && tooltip && width > 0 && (
        <div
          role="presentation"
          className="panel-raised pointer-events-none absolute z-10 w-52 px-3 py-2.5 text-[12.5px]"
          style={{
            left: Math.min(Math.max(0, left + hover * band + band / 2 - 104), width - 208),
            top: 0,
          }}
        >
          {tooltip(data[hover])}
        </div>
      )}
      {width === 0 && <div style={{ height }} />}
    </div>
  );
}

/** Legend row: swatch + label, in text colours (identity is never colour alone). */
export function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-fg-muted">
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}
