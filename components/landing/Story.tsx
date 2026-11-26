"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SceneFallback } from "./SceneFallback";
import type { HoverInfo } from "./scene/CssScene";
import { cn } from "@/lib/utils";

// The scene is client-only (it measures its box); the still image shows until it mounts.
const Scene = dynamic(() => import("./scene/CssScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <SceneFallback />
    </div>
  ),
});

const STEPS = [
  {
    label: "Capture",
    title: "Every lead in one list",
    body: "Add a lead with name, company, title, source, deal value and notes. The moment it's saved, LeadFlow books an email follow-up for the next 24 hours.",
  },
  {
    label: "Score",
    title: "A score from 0 to 100, with the reasons",
    body: "Gemini reads the title, company, source, deal value, stage and notes, then returns a score, a Hot, Warm or Cold tier, a one-line summary and 2 to 4 reasons.",
  },
  {
    label: "Focus",
    title: "The few leads to work today",
    body: "Your 25 highest-scoring open leads go to Gemini, which picks up to 5 with a reason for each. Any pick that isn't in your list is dropped, and the picks are reused for 6 hours.",
  },
  {
    label: "Pipeline",
    title: "Five stages, drag to move",
    body: "New, Contacted, Qualified, Won and Lost. Drop a card in a new column and the change is written to the lead's timeline.",
  },
  {
    label: "Follow up",
    title: "Follow-ups that book themselves",
    body: "Moving a lead to Qualified adds a \"Send proposal\" task due in 2 days. Overdue follow-ups are flagged in the Follow-ups list and in your notifications.",
  },
] as const;

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * The scroll story: the 3D scene fills a pinned screen while the section
 * scrolls past; a rail along the bottom names the five steps and shows the
 * current one. Every step's text is in the DOM for screen readers.
 */
export function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const barRef = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [tip, setTip] = useState<(NonNullable<HoverInfo> & { w: number }) | null>(null);
  const reducedMotion = useReducedMotion();

  // Scroll progress through the section, 0..4 (one unit per stage change).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const t = Math.min(Math.max(-rect.top / Math.max(total, 1), 0), 1);
      progressRef.current = t * (STEPS.length - 1);
      if (barRef.current) barRef.current.style.transform = `scaleX(${t.toFixed(4)})`;
      setStep(Math.min(STEPS.length - 1, Math.round(progressRef.current)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Render only while on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tooltip position relative to the stage, computed in the event handler.
  const onHover = useCallback((info: HoverInfo) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!info || !r) return setTip(null);
    setTip({ ...info, x: info.x - r.left, y: info.y - r.top, w: r.width });
  }, []);

  const current = STEPS[step];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-title"
      className="relative h-[440svh] border-b border-border bg-surface-2"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-20">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-4 sm:px-6">
          <h2 id="how-title" className="max-w-xl text-[26px] font-semibold leading-tight text-fg md:text-[34px]">
            One pipeline, followed from a new lead to the follow-up.
          </h2>
          <p className="hidden shrink-0 font-mono text-[12px] text-fg-muted md:block">
            Point at a card to see the lead
          </p>
        </div>

        <div
          ref={stageRef}
          className="pointer-events-none relative mx-auto min-h-0 w-full max-w-6xl flex-1 lg:pointer-events-auto"
          onPointerLeave={() => setTip(null)}
        >
          <Scene progressRef={progressRef} active={active} reducedMotion={reducedMotion} onHover={onHover} />
          {tip && (
            <div
              role="tooltip"
              className="panel-raised pointer-events-none absolute z-20 max-w-72 px-3 py-2 text-[12.5px]"
              style={{ left: Math.max(0, Math.min(tip.x + 14, tip.w - 290)), top: tip.y + 14 }}
            >
              <p className="font-medium text-fg">{tip.title}</p>
              <p className="mt-0.5 text-fg-muted">{tip.detail}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:py-5">
            <div key={step} aria-hidden className="rise min-h-[96px]">
              <p className="text-[18px] font-semibold leading-snug text-fg md:text-[20px]">{current.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-fg-muted">{current.body}</p>
            </div>
            <div>
              <ol className="grid grid-cols-5 gap-1">
                {STEPS.map((s, i) => (
                  <li key={s.label} aria-current={i === step ? "step" : undefined} className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-[12px] font-medium transition-colors duration-300 sm:text-[13px]",
                        i === step ? "text-fg" : i < step ? "text-fg-muted" : "text-fg-subtle",
                      )}
                    >
                      <span className="font-mono text-[11px]">{String(i + 1).padStart(2, "0")} </span>
                      <span className={cn(i !== step && "max-sm:hidden")}>{s.label}</span>
                    </span>
                    <span className="sr-only">
                      : {s.title}. {s.body}
                    </span>
                  </li>
                ))}
              </ol>
              <span aria-hidden className="mt-2 block h-0.5 overflow-hidden rounded-full bg-sunken">
                <span ref={barRef} className="block h-full origin-left scale-x-0 bg-accent" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
