"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * A small set of mutually exclusive options that change what one view shows
 * (date range, metric). A radio group, not tabs: there are no separate panels.
 * One highlight slides to the selected option.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, [value]);

  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[options.indexOf(next)]?.focus();
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cn("relative inline-flex items-center rounded-md border border-border bg-sunken p-0.5", className)}
    >
      {box && (
        <span
          aria-hidden
          className="absolute inset-y-0.5 left-0 rounded-[5px] border border-border bg-surface shadow-[inset_0_1px_0_var(--highlight),var(--shadow-xs)] transition-[transform,width] duration-300 ease-[var(--ease-out-expo)]"
          style={{ width: box.w, transform: `translateX(${box.x}px)` }}
        />
      )}
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative z-10 h-7 rounded-[5px] px-2.5 text-[13px] font-medium transition-colors duration-150",
              on ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
