import { google } from "@ai-sdk/google";
import { APICallError, generateObject, wrapLanguageModel, type LanguageModelMiddleware } from "ai";
import { z } from "zod";
import { FOCUS_MAX_PICKS, keepKnownPicks } from "@/lib/focus";

/** Free-tier Gemini models. Rolling aliases, so they stay valid as Google
 * retires versions. When the main model is overloaded (Google returns 503
 * "high demand", or 429 when the free quota is hit) or too slow, the same
 * request goes to the lighter model instead of failing. */
export const PRIMARY_MODEL = "gemini-flash-latest";
export const FALLBACK_MODEL = "gemini-flash-lite-latest";

/** How long the main model gets to answer before the fallback takes over. */
export const PRIMARY_TIMEOUT_MS = 10_000;

/** Errors worth retrying on another model: overloaded, rate limited, or a server error. */
export function isOverloaded(error: unknown): boolean {
  return APICallError.isInstance(error) && [429, 500, 502, 503, 504].includes(error.statusCode ?? 0);
}

type FallbackModel = Pick<ReturnType<typeof google>, "doGenerate" | "doStream">;
type CallOptions = Parameters<FallbackModel["doGenerate"]>[0];

/**
 * Runs `call` on the main model with a time limit, and sends the same call to
 * `fallback` when the main model is overloaded or too slow. A cancel from the
 * caller (params.abortSignal) is never treated as overload, and real errors
 * such as a 400 are passed through.
 */
async function withFallback<T>(
  params: CallOptions,
  primary: (params: CallOptions) => PromiseLike<T>,
  fallback: (params: CallOptions) => PromiseLike<T>,
  timeoutMs: number,
): Promise<T> {
  const timeout = new AbortController();
  const signal = params.abortSignal ? AbortSignal.any([params.abortSignal, timeout.signal]) : timeout.signal;
  const timer = setTimeout(() => timeout.abort(new Error("primary model timed out")), timeoutMs);
  try {
    return await primary({ ...params, abortSignal: signal });
  } catch (error) {
    if (params.abortSignal?.aborted) throw error;
    if (!timeout.signal.aborted && !isOverloaded(error)) throw error;
    console.warn(`[gemini] ${PRIMARY_MODEL} ${timeout.signal.aborted ? "too slow" : "unavailable"}, using ${FALLBACK_MODEL}`);
    return fallback(params);
  } finally {
    clearTimeout(timer);
  }
}

/** Sends the call to `fallback` when the wrapped model is overloaded or too slow. */
export function fallbackMiddleware(fallback: FallbackModel, timeoutMs = PRIMARY_TIMEOUT_MS): LanguageModelMiddleware {
  return {
    wrapGenerate: ({ model, params }) =>
      withFallback(params, (p) => model.doGenerate(p), (p) => fallback.doGenerate(p), timeoutMs),
    wrapStream: ({ model, params }) =>
      withFallback(params, (p) => model.doStream(p), (p) => fallback.doStream(p), timeoutMs),
  };
}

function model() {
  return wrapLanguageModel({ model: google(PRIMARY_MODEL), middleware: fallbackMiddleware(google(FALLBACK_MODEL)) });
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to enable it.");
    this.name = "AiNotConfiguredError";
  }
}

function requireAi() {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
}

export type LeadProfile = {
  name: string;
  company?: string | null;
  title?: string | null;
  email?: string | null;
  source?: string | null;
  value: number;
  status: string;
  notes?: string | null;
};

function describeLead(lead: LeadProfile): string {
  return [
    `Name: ${lead.name}`,
    lead.title && `Title: ${lead.title}`,
    lead.company && `Company: ${lead.company}`,
    lead.email && `Email: ${lead.email}`,
    lead.source && `Source: ${lead.source}`,
    `Deal value: $${lead.value.toLocaleString()}`,
    lead.status && `Current pipeline stage: ${lead.status}`,
    lead.notes && `Notes: ${lead.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const ScoreSchema = z.object({
  score: z.number().int().min(0).max(100).describe("0-100 likelihood the deal closes"),
  priority: z.enum(["HOT", "WARM", "COLD"]),
  summary: z.string().describe("One concise sentence on why."),
  reasons: z.array(z.string()).min(2).max(4).describe("Short bullet reasons behind the score."),
});

export type ScoreResult = z.infer<typeof ScoreSchema>;

/** Scores a lead 0-100 on likelihood to close, with a priority tier and reasoning. */
export async function scoreLead(lead: LeadProfile): Promise<ScoreResult> {
  requireAi();
  const { object } = await generateObject({
    model: model(),
    schema: ScoreSchema,
    system:
      "You are a B2B sales lead-scoring engine. Given a lead profile, estimate the likelihood the deal will close and how ready the lead is to buy. Be decisive and realistic — most leads are not hot.",
    prompt: `Score this lead:\n\n${describeLead(lead)}`,
  });
  return object;
}

const InsightsSchema = z.object({
  insight: z.string().describe("One or two sentences of insight about this customer/deal."),
  nextAction: z.string().describe("A single, specific, actionable next step."),
});

export type InsightsResult = z.infer<typeof InsightsSchema>;

/** Generates a short insight + suggested next action for a customer profile. */
export async function generateCustomerInsights(
  lead: LeadProfile,
  recentActivity: string[],
): Promise<InsightsResult> {
  requireAi();
  const activityBlock =
    recentActivity.length > 0
      ? `Recent activity:\n${recentActivity.map((a) => `- ${a}`).join("\n")}`
      : "No activity logged yet.";
  const { object } = await generateObject({
    model: model(),
    schema: InsightsSchema,
    system:
      "You are a sales assistant. Read the lead profile and recent activity, then give the rep a sharp, specific insight and one concrete next action. No fluff, no generic advice.",
    prompt: `${describeLead(lead)}\n\n${activityBlock}`,
  });
  return object;
}

const FocusSchema = z.object({
  picks: z
    .array(
      z.object({
        leadId: z.string(),
        reason: z.string().describe("One short sentence on why this lead needs attention today."),
      }),
    )
    .min(1)
    .max(FOCUS_MAX_PICKS),
});

/** Ranks a workspace's open leads and returns the top few to focus on today. */
export async function recommendDailyFocus(
  leads: (LeadProfile & { id: string; score: number; priority: string })[],
): Promise<{ leadId: string; reason: string }[]> {
  requireAi();
  if (leads.length === 0) return [];
  const list = leads
    .map(
      (l) =>
        `- id=${l.id} | ${l.name} @ ${l.company ?? "—"} | score=${l.score} | priority=${l.priority} | stage=${l.status} | value=$${l.value.toLocaleString()}`,
    )
    .join("\n");
  const { object } = await generateObject({
    model: model(),
    schema: FocusSchema,
    system:
      "You are a sales manager triaging today's pipeline. Pick the leads a rep should focus on today — highest score/value/urgency first — and give one short reason each. Only return ids from the provided list.",
    prompt: `Open leads:\n${list}`,
  });
  return keepKnownPicks(object.picks, leads);
}
