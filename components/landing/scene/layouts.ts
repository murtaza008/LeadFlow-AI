/**
 * Stage layouts for the landing scene. One continuous set of cards (one per
 * lead in the demo workspace) moves through five stages as you scroll:
 *
 *   0 Capture   – a loose pile of new, unscored leads
 *   1 Score     – cards stack into the five score buckets (a 3D histogram)
 *   2 Focus     – today's picks come forward; other open leads wait behind,
 *                 closed deals drop away
 *   3 Pipeline  – cards settle into the five kanban columns
 *   4 Follow up – New and Qualified leads grow their automatic follow-ups
 *
 * Pure functions (no DOM), so they are cheap to unit test.
 */
import { SCORE_BUCKETS, STAGES as PIPELINE } from "@/lib/analytics-calc";
import { focusCandidates } from "@/lib/focus";
import { SCENE_FOCUS, SCENE_LEADS, type SceneLead } from "./leads";

export const STAGE_COUNT = 5;
export const CARD_W = 1.0;
export const CARD_H = 0.34;
export const CARD_COUNT = SCENE_LEADS.length;

export type Vec3 = [number, number, number];
export type CardTransform = { p: Vec3; r: Vec3; s: number; o: number };

/** Same thresholds the demo seed uses to set each lead's tier. */
export function heatOf(score: number): "hot" | "warm" | "cold" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

/** Deterministic 0..1 noise per card and channel (integer hash, identical everywhere). */
function noise(i: number, k: number) {
  let h = (i * 374761393 + k * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const bucketOf = (score: number) => SCORE_BUCKETS.findIndex((b) => score >= b.min && score <= b.max);

/** Index of each card within its score bucket, highest score at the bottom of the stack. */
const bucketSlot = (() => {
  const slots = new Array<number>(CARD_COUNT).fill(0);
  for (let b = 0; b < SCORE_BUCKETS.length; b++) {
    SCENE_LEADS.map((l, i) => ({ l, i }))
      .filter(({ l }) => bucketOf(l.score) === b)
      .sort((x, y) => y.l.score - x.l.score)
      .forEach(({ i }, k) => (slots[i] = k));
  }
  return slots;
})();

/** Index of each card within its pipeline column, highest score first. */
const columnSlot = (() => {
  const slots = new Array<number>(CARD_COUNT).fill(0);
  for (const stage of PIPELINE) {
    SCENE_LEADS.map((l, i) => ({ l, i }))
      .filter(({ l }) => l.status === stage)
      .sort((x, y) => y.l.score - x.l.score)
      .forEach(({ i }, k) => (slots[i] = k));
  }
  return slots;
})();

/** Open leads in the order Gemini receives them (the real focusCandidates rule). */
export const CANDIDATE_IDS = new Set(focusCandidates(SCENE_LEADS).map((l) => l.id));
export const PICK_RANK = new Map(SCENE_FOCUS.map((p, k) => [p.leadId, k]));

/** Which cards get a follow-up in the last stage, and which one. */
export function followUpKind(lead: SceneLead): "created" | "qualified" | null {
  if (lead.status === "QUALIFIED") return "qualified";
  if (lead.status === "NEW") return "created";
  return null;
}

export const COLUMN_GAP = 1.05;
export const ROW_GAP = 0.3;
export const PIPE_SCALE = 0.7;
const PIPE_TOP = 1.15;

export function pipelinePosition(i: number): Vec3 {
  const lead = SCENE_LEADS[i];
  const c = PIPELINE.indexOf(lead.status);
  return [(c - 2) * COLUMN_GAP, PIPE_TOP - columnSlot[i] * ROW_GAP, 0];
}

/** Last stage: New and Qualified leads side by side, each with room for its follow-up. */
export const FOLLOW_X = { created: -1.75, qualified: 0.55 } as const;

export function followUpPosition(i: number): Vec3 | null {
  const kind = followUpKind(SCENE_LEADS[i]);
  if (!kind) return null;
  return [FOLLOW_X[kind], PIPE_TOP - columnSlot[i] * ROW_GAP, 0.25];
}

export function stageTransform(i: number, stage: number): CardTransform {
  const lead = SCENE_LEADS[i];
  switch (stage) {
    case 0: {
      return {
        p: [-2.15 + noise(i, 1) * 4.3, -1.55 + noise(i, 2) * 3.1, -1.5 + noise(i, 3) * 2.0],
        r: [(noise(i, 4) - 0.5) * 0.6, (noise(i, 5) - 0.5) * 0.9, (noise(i, 6) - 0.5) * 0.7],
        s: 0.7,
        o: 1,
      };
    }
    case 1: {
      const b = bucketOf(lead.score);
      return {
        p: [(b - 2) * 1.02, -1.4 + bucketSlot[i] * 0.27, -bucketSlot[i] * 0.02],
        r: [0, (b - 2) * -0.1, 0],
        s: 0.7,
        o: 1,
      };
    }
    case 2: {
      const rank = PICK_RANK.get(lead.id);
      if (rank !== undefined) {
        return { p: [(rank - 2) * 0.98, 0.05 + Math.abs(rank - 2) * -0.06, 1.15], r: [0, (rank - 2) * -0.14, 0], s: 0.9, o: 1 };
      }
      if (CANDIDATE_IDS.has(lead.id)) {
        const a = (noise(i, 7) - 0.5) * Math.PI * 0.95;
        return { p: [Math.sin(a) * 2.3, 0.85 + noise(i, 8) * 0.7, -1.4 - Math.cos(a) * 0.4], r: [0, -a * 0.5, 0], s: 0.58, o: 0.55 };
      }
      return { p: [(noise(i, 9) - 0.5) * 3.6, -1.85, -2.4], r: [-0.9, 0, 0], s: 0.45, o: 0.12 };
    }
    case 3: {
      return { p: pipelinePosition(i), r: [0, 0, 0], s: PIPE_SCALE, o: 1 };
    }
    default: {
      const at = followUpPosition(i);
      if (at) return { p: at, r: [0, 0, 0], s: PIPE_SCALE, o: 1 };
      const [x, y] = pipelinePosition(i);
      return { p: [x * 1.1, y - 0.2, -2.2], r: [0, 0, 0], s: PIPE_SCALE, o: 0.07 };
    }
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/**
 * Transform of card `i` at continuous progress `p` in [0, STAGE_COUNT - 1].
 * Each card starts its move slightly after its neighbour, so stages flow
 * instead of switching all at once.
 */
export function cardAt(i: number, p: number): CardTransform {
  const clamped = Math.min(Math.max(p, 0), STAGE_COUNT - 1);
  const from = Math.min(Math.floor(clamped), STAGE_COUNT - 2);
  const raw = clamped - from;
  const delay = (noise(i, 11) * 0.3);
  const t = smooth(clamp01((raw - delay) / (1 - 0.3)));
  const a = stageTransform(i, from);
  const b = stageTransform(i, from + 1);
  return {
    p: [lerp(a.p[0], b.p[0], t), lerp(a.p[1], b.p[1], t), lerp(a.p[2], b.p[2], t)],
    r: [lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t), lerp(a.r[2], b.r[2], t)],
    s: lerp(a.s, b.s, t),
    o: lerp(a.o, b.o, t),
  };
}

/** 0..1: how much a stage's labels show at progress p (full at the stage, gone one stage away). */
export function labelVisibility(stage: number, p: number) {
  return smooth(clamp01(1 - Math.abs(p - stage) * 1.4));
}

/** 0..1: score and heat colour appear once the leads are scored. */
export function heatVisibility(p: number) {
  return smooth(clamp01((p - 0.35) / 0.55));
}

/** 0..1: pipeline column headers, from the pipeline stage onward. */
export function columnsVisibility(p: number) {
  return smooth(clamp01((p - 2.5) / 0.5));
}

/** 0..1: follow-up chips in the last stage. */
export function chipVisibility(p: number) {
  return smooth(clamp01((p - 3.35) / 0.55));
}
