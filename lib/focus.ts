/**
 * "Focus today": which leads Gemini may choose from, and which of its picks
 * are kept. Used by GET /api/recommendations and by the landing page demo.
 */

export const FOCUS_CANDIDATES = 25;
export const FOCUS_MAX_PICKS = 5;
/** Picks are reused for this long before Gemini is asked again. */
export const FOCUS_TTL_HOURS = 6;

type Rankable = { id: string; status: string; score: number };

/** Open leads only (not Won or Lost), highest score first, at most 25. */
export function focusCandidates<T extends Rankable>(leads: readonly T[]): T[] {
  return leads
    .filter((l) => l.status !== "WON" && l.status !== "LOST")
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, FOCUS_CANDIDATES);
}

/** Drops any pick whose id was not in the list sent to the model, then caps at 5. */
export function keepKnownPicks<P extends { leadId: string }>(picks: readonly P[], candidates: readonly Rankable[]): P[] {
  const known = new Set(candidates.map((c) => c.id));
  return picks.filter((p) => known.has(p.leadId)).slice(0, FOCUS_MAX_PICKS);
}
