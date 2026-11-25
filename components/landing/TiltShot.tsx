"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";

/**
 * App screenshot that tilts toward the pointer (CSS vars written outside
 * React). Both theme variants are rendered; CSS shows the one matching the
 * site theme.
 */
export function TiltShot({
  light,
  dark,
  alt,
  priority,
}: {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${x * 7}deg`);
    el.style.setProperty("--rx", `${-y * 5}deg`);
  }

  function reset() {
    ref.current?.style.setProperty("--ry", "0deg");
    ref.current?.style.setProperty("--rx", "0deg");
  }

  return (
    <div className="[perspective:1600px]" onPointerMove={onMove} onPointerLeave={reset}>
      <div
        ref={ref}
        className="overflow-hidden rounded-xl border border-border bg-surface shadow-[inset_0_1px_0_var(--highlight),var(--shadow-lg)] transition-transform duration-500 ease-[var(--ease-out-expo)] will-change-transform"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
      >
        <Image src={light} alt={alt} priority={priority} sizes="(min-width: 1024px) 1100px, 100vw" className="block h-auto w-full dark:hidden" placeholder="blur" />
        <Image src={dark} alt={alt} priority={priority} sizes="(min-width: 1024px) 1100px, 100vw" className="hidden h-auto w-full dark:block" placeholder="blur" />
      </div>
    </div>
  );
}
