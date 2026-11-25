"use client";

import { Fragment, useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { ClipboardList, Mail } from "lucide-react";
import { SCORE_BUCKETS, STAGES as PIPELINE, STAGE_LABEL } from "@/lib/analytics-calc";
import { rulesForCreated, rulesForStageChange } from "@/lib/automation-rules";
import { formatCurrency } from "@/lib/format";
import {
  CARD_COUNT,
  CARD_H,
  CARD_W,
  CANDIDATE_IDS,
  COLUMN_GAP,
  PICK_RANK,
  cardAt,
  chipVisibility,
  columnsVisibility,
  followUpKind,
  FOLLOW_X,
  heatOf,
  heatVisibility,
  labelVisibility,
} from "./layouts";
import { SCENE_FOCUS, SCENE_LEADS } from "./leads";

export type HoverInfo = { x: number; y: number; title: string; detail: string } | null;

type Props = {
  /** Target scroll progress in [0, 4]; written by the page, read every frame. */
  progressRef: RefObject<number>;
  active: boolean;
  reducedMotion: boolean;
  onHover: (info: HoverInfo) => void;
};

/** World units the stage must fit, like a camera framing the scene. */
const HALF_W = 2.6;
const HALF_H = 1.72;
const CHIP_W = 1.25;
const CHIP_H = 0.17;

// Chip labels are built from the real automation rules: kind of follow-up and when it's due.
function chipLabel(f: { type: string; dueAt: Date }, now: Date) {
  const days = Math.round((f.dueAt.getTime() - now.getTime()) / 86_400_000);
  return `${f.type === "EMAIL" ? "Email" : "Task"} · ${days} day${days === 1 ? "" : "s"}`;
}
const RULE_NOW = new Date(0);
const CHIP_TEXT = {
  created: chipLabel(rulesForCreated(RULE_NOW).followUps[0], RULE_NOW),
  qualified: chipLabel(rulesForStageChange("CONTACTED", "QUALIFIED", RULE_NOW).followUps[0], RULE_NOW),
} as const;
const CHIP_TITLE = {
  created: rulesForCreated(RULE_NOW).followUps[0].title,
  qualified: rulesForStageChange("CONTACTED", "QUALIFIED", RULE_NOW).followUps[0].title,
} as const;

/** "Elena Vasquez" → "Elena V." so names fit on a small card. */
const shortName = (name: string) => {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

const TIER = { hot: "Hot", warm: "Warm", cold: "Cold" } as const;
const fmt = (n: number) => n.toFixed(3);

function cardInfo(i: number, stage: number): { title: string; detail: string } {
  const l = SCENE_LEADS[i];
  const title = `${l.name} · ${l.company}`;
  switch (stage) {
    case 0:
      return { title, detail: `New lead from ${l.source}, worth ${formatCurrency(l.value)}. Not scored yet.` };
    case 1:
      return { title, detail: `Scored ${l.score} (${TIER[heatOf(l.score)]}): ${l.summary}` };
    case 2: {
      const rank = PICK_RANK.get(l.id);
      if (rank !== undefined) return { title, detail: `Pick ${rank + 1} of ${SCENE_FOCUS.length}: ${SCENE_FOCUS[rank].reason}` };
      if (CANDIDATE_IDS.has(l.id)) return { title, detail: `Open lead, score ${l.score}. Sent to Gemini but not picked today.` };
      return { title, detail: `${STAGE_LABEL[l.status]}, so it is not considered for today's focus.` };
    }
    case 3:
      return { title, detail: `${STAGE_LABEL[l.status]} · ${formatCurrency(l.value)} · score ${l.score}` };
    default: {
      const kind = followUpKind(l);
      if (kind === "qualified") return { title, detail: `Moved to Qualified, so a "Send proposal" task was added, due 2 days later.` };
      if (kind === "created") return { title, detail: `New lead, so a "Reach out within 24h" email follow-up was added.` };
      return { title, detail: `${STAGE_LABEL[l.status]}. No automatic follow-up for this stage.` };
    }
  }
}

/**
 * The landing story in real 3D with CSS transforms (perspective +
 * preserve-3d): works in every browser, no WebGL or GPU driver needed.
 * One card per demo lead moves through the five stages as you scroll;
 * positions come from layouts.ts. Updated in a rAF loop outside React,
 * only while on screen.
 */
export default function CssScene({ progressRef, active, reducedMotion, onHover }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bucketRefs = useRef<(HTMLDivElement | null)[]>([]);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusLabelRef = useRef<HTMLDivElement>(null);
  const followLabelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef({ progress: 0, rx: 0, ry: 0, px: 0, py: 0, unit: 120, frame: 0 });

  function draw() {
    const s = state.current;
    const u = s.unit;
    const p = s.progress;
    const heat = heatVisibility(p);
    const chips = chipVisibility(p);

    for (let i = 0; i < CARD_COUNT; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const t = cardAt(i, p);
      el.style.transform =
        `translate3d(${fmt(t.p[0] * u)}px, ${fmt(-t.p[1] * u)}px, ${fmt(t.p[2] * u)}px) ` +
        `rotateX(${fmt(-t.r[0])}rad) rotateY(${fmt(t.r[1])}rad) rotateZ(${fmt(-t.r[2])}rad) scale(${fmt(t.s)})`;
      el.style.opacity = fmt(t.o);
      el.style.setProperty("--heat", fmt(heat));

      const chip = chipRefs.current[i];
      if (chip) {
        const x = t.p[0] + (CARD_W * t.s) / 2 + CHIP_W / 2 + 0.05;
        chip.style.transform = `translate3d(${fmt(x * u)}px, ${fmt(-t.p[1] * u)}px, ${fmt((t.p[2] + 0.02) * u)}px) scale(${fmt(0.85 + chips * 0.15)})`;
        chip.style.opacity = fmt(chips);
        chip.style.visibility = chips > 0.01 ? "visible" : "hidden";
      }
    }

    const buckets = labelVisibility(1, p);
    bucketRefs.current.forEach((el, b) => {
      if (!el) return;
      el.style.transform = `translate3d(${fmt((b - 2) * 1.02 * u)}px, ${fmt(1.66 * u)}px, 0)`;
      el.style.opacity = fmt(buckets);
      el.style.visibility = buckets > 0.01 ? "visible" : "hidden";
    });

    const cols = columnsVisibility(p) * (1 - chips);
    columnRefs.current.forEach((el, c) => {
      if (!el) return;
      el.style.transform = `translate3d(${fmt((c - 2) * COLUMN_GAP * u)}px, ${fmt(-1.5 * u)}px, 0)`;
      el.style.opacity = fmt(cols);
      el.style.visibility = cols > 0.01 ? "visible" : "hidden";
    });

    followLabelRefs.current.forEach((el, k) => {
      if (!el) return;
      const x = k === 0 ? FOLLOW_X.created : FOLLOW_X.qualified;
      el.style.transform = `translate3d(${fmt((x + 0.5) * u)}px, ${fmt(-1.5 * u)}px, ${fmt(0.25 * u)}px)`;
      el.style.opacity = fmt(chips);
      el.style.visibility = chips > 0.01 ? "visible" : "hidden";
    });

    const focus = labelVisibility(2, p);
    if (focusLabelRef.current) {
      focusLabelRef.current.style.transform = `translate3d(0, ${fmt(-0.5 * u)}px, ${fmt(1.15 * u)}px)`;
      focusLabelRef.current.style.opacity = fmt(focus);
      focusLabelRef.current.style.visibility = focus > 0.01 ? "visible" : "hidden";
    }

    if (worldRef.current) {
      worldRef.current.style.transform = `rotateX(${fmt(s.rx)}deg) rotateY(${fmt(s.ry)}deg)`;
    }
  }

  // Size: one world unit in pixels, so the whole stage fits the box.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const unit = Math.max(40, Math.min(width / (2 * HALF_W), height / (2 * HALF_H)));
      state.current.unit = unit;
      worldRef.current?.style.setProperty("--u", `${unit}px`);
      state.current.frame = 0;
      draw();
    });
    ro.observe(stage);
    state.current.progress = progressRef.current ?? 0;
    return () => ro.disconnect();
    // draw reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop: eases toward the scroll position and the pointer.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      const target = progressRef.current ?? 0;
      const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
      const kp = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
      const moved =
        Math.abs(target - s.progress) > 0.0005 ||
        Math.abs(s.px * 9 - s.ry) > 0.01 ||
        Math.abs(-s.py * 5 - s.rx) > 0.01 ||
        s.frame < 2;
      s.progress += (target - s.progress) * k;
      if (!reducedMotion) {
        s.ry += (s.px * 9 - s.ry) * kp;
        s.rx += (-s.py * 5 - s.rx) * kp;
      }
      if (moved) draw();
      s.frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    state.current.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.current.py = ((e.clientY - r.top) / r.height) * 2 - 1;
  }

  const cardStyle: CSSProperties = {
    width: `calc(var(--u) * ${CARD_W})`,
    height: `calc(var(--u) * ${CARD_H})`,
    marginLeft: `calc(var(--u) * ${-CARD_W / 2})`,
    marginTop: `calc(var(--u) * ${-CARD_H / 2})`,
  };
  const chipStyle: CSSProperties = {
    width: `calc(var(--u) * ${CHIP_W})`,
    height: `calc(var(--u) * ${CHIP_H})`,
    marginLeft: `calc(var(--u) * ${-CHIP_W / 2})`,
    marginTop: `calc(var(--u) * ${-CHIP_H / 2})`,
    visibility: "hidden",
  };
  const labelStyle: CSSProperties = { width: "calc(var(--u) * 0.9)", marginLeft: "calc(var(--u) * -0.45)", textAlign: "center", visibility: "hidden" };

  return (
    <div
      ref={stageRef}
      aria-hidden
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        state.current.px = 0;
        state.current.py = 0;
        onHover(null);
      }}
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
      data-scene="css3d"
    >
      <div
        ref={worldRef}
        className="absolute left-1/2 top-1/2"
        style={{ transformStyle: "preserve-3d", ["--u" as string]: "120px" } as CSSProperties}
      >
        {SCORE_BUCKETS.map((b, i) => (
          <div
            key={b.label}
            ref={(el) => {
              bucketRefs.current[i] = el;
            }}
            className="scene-label absolute left-0 top-0"
            style={labelStyle}
          >
            {b.label.replace("-", "–")}
          </div>
        ))}
        {PIPELINE.map((stage, i) => (
          <div
            key={stage}
            ref={(el) => {
              columnRefs.current[i] = el;
            }}
            className="scene-label absolute left-0 top-0"
            style={labelStyle}
          >
            {STAGE_LABEL[stage]} · {SCENE_LEADS.filter((l) => l.status === stage).length}
          </div>
        ))}
        {(["created", "qualified"] as const).map((kind, k) => (
          <div
            key={kind}
            ref={(el) => {
              followLabelRefs.current[k] = el;
            }}
            className="scene-label absolute left-0 top-0"
            style={{ ...labelStyle, width: "calc(var(--u) * 2.1)", marginLeft: "calc(var(--u) * -1.05)", textAlign: "left" }}
          >
            {kind === "created" ? "New lead → email follow-up" : "Qualified → proposal task"}
          </div>
        ))}
        <div
          ref={focusLabelRef}
          className="scene-label absolute left-0 top-0"
          style={{ ...labelStyle, width: "calc(var(--u) * 3)", marginLeft: "calc(var(--u) * -1.5)" }}
        >
          Today&rsquo;s focus · {SCENE_FOCUS.length} picks from {CANDIDATE_IDS.size} open leads
        </div>

        {SCENE_LEADS.map((l, i) => {
          const kind = followUpKind(l);
          return (
            <Fragment key={l.id}>
              <div
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-scene-card={i}
                data-heat={heatOf(l.score)}
                onPointerEnter={(e) => onHover({ x: e.clientX, y: e.clientY, ...cardInfo(i, Math.round(state.current.progress)) })}
                onPointerMove={(e) => onHover({ x: e.clientX, y: e.clientY, ...cardInfo(i, Math.round(state.current.progress)) })}
                onPointerLeave={() => onHover(null)}
                className="scene-lead absolute left-0 top-0"
                style={cardStyle}
              >
                <span className="scene-lead-name">{shortName(l.name)}</span>
                <span className="scene-lead-score">{l.score}</span>
              </div>
              {kind && (
                <div
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  className="scene-chip absolute left-0 top-0"
                  style={chipStyle}
                >
                  {kind === "qualified" ? (
                    <ClipboardList aria-hidden className="size-[1.1em] shrink-0" />
                  ) : (
                    <Mail aria-hidden className="size-[1.1em] shrink-0" />
                  )}
                  <span className="truncate">
                    {/* "Reach out within 24h" already says when; the proposal task gets its due time added. */}
                    {kind === "created" ? CHIP_TITLE.created : `${CHIP_TITLE.qualified} · ${CHIP_TEXT.qualified.split(" · ")[1]}`}
                  </span>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
