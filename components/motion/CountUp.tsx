"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

/** Animates a number from 0 to `value` on mount, formatted with `format`. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  duration = 0.8,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const controls = animate(ref.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        ref.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
