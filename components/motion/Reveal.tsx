"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Scroll-triggered rise-in. Replays every time the element re-enters the
 * viewport, kept snappy (~0.38s) so repeated triggers don't feel sluggish.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.38, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its children in on mount — used for hero copy and card grids. */
export function Stagger({
  children,
  className,
  step = 0.08,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: step, delayChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
