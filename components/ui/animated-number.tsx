"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  /** Formats each frame and the final value. Defaults to a grouped integer. */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  /**
   * Inside an aria-live region: don't count (screen readers would read every
   * frame); set the final text and pop it instead.
   */
  live?: boolean;
};

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-US");
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts from its previous value to `value` with an expo-out curve. The final
 * value is always in `data-value`, so tests never read a number mid-count.
 * Runs outside React (writes textContent from rAF) to keep renders cheap.
 */
export function AnimatedNumber({ value, format = defaultFormat, duration = 900, className, live }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const formatRef = useRef(format);

  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = formatRef.current;
    const start = from.current;
    from.current = value;

    if (live || reduced() || start === value) {
      el.textContent = fmt(value);
      if (live && start !== value && !reduced()) {
        el.animate([{ transform: "scale(1.12)" }, { transform: "scale(1)" }], {
          duration: 260,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        });
      }
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = fmt(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    };
  }, [value, duration, live]);

  return (
    <span
      ref={ref}
      data-value={value}
      className={cn("tabular inline-block", className)}
      suppressHydrationWarning
    >
      {format(live ? value : 0)}
    </span>
  );
}
