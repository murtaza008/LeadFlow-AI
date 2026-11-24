"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Info } from "lucide-react";

/**
 * Shown above the app in the shared demo workspace. Publishes its height as
 * --banner-h so full-height screens (the pipeline board) can subtract it.
 */
export function DemoBanner() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--banner-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--banner-h");
    };
  }, []);

  return (
    <div ref={ref} className="border-b border-border bg-accent-soft text-fg">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-[13px]">
        <span className="inline-flex items-center gap-1.5">
          <Info aria-hidden className="size-3.5 text-accent-text" />
          You&rsquo;re in the shared demo workspace. Deleting and inviting are off, and data resets daily.
        </span>
        <Link href="/signup" className="font-medium text-accent-text underline underline-offset-4 hover:decoration-2">
          Create your own workspace
        </Link>
      </div>
    </div>
  );
}
