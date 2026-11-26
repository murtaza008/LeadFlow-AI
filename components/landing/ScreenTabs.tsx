"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { StaticImageData } from "next/image";
import { TiltShot } from "./TiltShot";
import { cn } from "@/lib/utils";

export type Screen = { id: string; label: string; caption: string; light: StaticImageData; dark: StaticImageData; alt: string };

/** Real app screenshots, one panel per tab (proper tabs: each tab owns a panel). */
export function ScreenTabs({ screens }: { screens: Screen[] }) {
  const [current, setCurrent] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + screens.length) % screens.length;
    setCurrent(next);
    tabs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="App screens" className="flex flex-wrap gap-2">
        {screens.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`screen-tab-${s.id}`}
            role="tab"
            type="button"
            aria-selected={i === current}
            aria-controls={`screen-panel-${s.id}`}
            tabIndex={i === current ? 0 : -1}
            data-press=""
            onClick={() => setCurrent(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "h-9 rounded-full border px-4 text-[13.5px] font-medium transition-colors duration-150",
              i === current ? "border-fg bg-fg text-bg" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {screens.map((s, i) => (
        <div
          key={s.id}
          id={`screen-panel-${s.id}`}
          role="tabpanel"
          aria-labelledby={`screen-tab-${s.id}`}
          hidden={i !== current}
          className="mt-6"
        >
          <p className="mb-5 max-w-2xl text-[15px] text-fg-muted">{s.caption}</p>
          <TiltShot light={s.light} dark={s.dark} alt={s.alt} />
        </div>
      ))}
    </div>
  );
}
