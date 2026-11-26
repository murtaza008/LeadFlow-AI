"use client";

import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { ActivityEvent } from "@/lib/activity";
import type { WorkspaceSummary } from "@/lib/workspace-summary";
import type { Lead } from "@/lib/hooks/use-leads";
import type { FollowUpWithLead } from "@/lib/hooks/use-followups";
import type { Invite, Member } from "@/lib/hooks/use-team";
import type { Analytics, RangeDays } from "@/lib/analytics-calc";

/**
 * Shared query definitions. Pages, hooks and the shell use the same keys, so
 * hovering a nav item prefetches exactly the data the page will read.
 */

/** GET /api/analytics, with Dates serialised to strings by JSON. */
export type AnalyticsResponse = Analytics;

export type FocusPick = {
  leadId: string;
  reason: string;
  name: string;
  company: string | null;
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  value: number;
};

/** Fetches JSON; on failure throws the API's own error message when it has one. */
export async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to load ${what}`);
  }
  return res.json() as Promise<T>;
}

export const q = {
  leads: () =>
    queryOptions({
      queryKey: ["leads"],
      queryFn: () => getJson<Lead[]>("/api/leads", "leads"),
    }),
  followups: () =>
    queryOptions({
      queryKey: ["followups"],
      queryFn: () => getJson<FollowUpWithLead[]>("/api/followups", "follow-ups"),
    }),
  analytics: (days: RangeDays = 30) =>
    queryOptions({
      queryKey: ["analytics", days],
      queryFn: () => getJson<AnalyticsResponse>(`/api/analytics?days=${days}`, "analytics"),
    }),
  /**
   * Today's AI focus picks. The server reuses stored picks for 6 hours, so this
   * rarely calls Gemini; never prefetched on hover for the same reason.
   * A 501 means AI isn't configured: shown as a message, not an error.
   */
  focus: () =>
    queryOptions({
      queryKey: ["recommendations"],
      queryFn: async (): Promise<{ picks: FocusPick[]; error?: string }> => {
        const res = await fetch("/api/recommendations");
        if (res.status === 501) return { picks: [], error: ((await res.json()) as { error: string }).error };
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load today's focus");
        }
        return res.json();
      },
      staleTime: 5 * 60_000,
    }),
  members: (wsId: string) =>
    queryOptions({
      queryKey: ["members", wsId],
      queryFn: () => getJson<Member[]>(`/api/workspaces/${wsId}/members`, "members"),
    }),
  invites: (wsId: string) =>
    queryOptions({
      queryKey: ["invites", wsId],
      queryFn: () => getJson<Invite[]>(`/api/workspaces/${wsId}/invites`, "invites"),
    }),
  summary: (wsId: string) =>
    queryOptions({
      queryKey: ["summary", wsId],
      queryFn: () => getJson<WorkspaceSummary>(`/api/workspaces/${wsId}/summary`, "summary"),
      staleTime: 30_000,
    }),
  activity: (wsId: string) =>
    queryOptions({
      queryKey: ["activity", wsId],
      queryFn: () => getJson<ActivityEvent[]>(`/api/workspaces/${wsId}/activity`, "activity"),
      staleTime: 60_000,
      refetchInterval: 120_000,
    }),
};

/** Queries the nav can prefetch on hover. Never anything that calls the AI. */
export type PrefetchName = "leads" | "followups" | "analytics" | "members" | "invites";

export const prefetchers: Record<PrefetchName, (qc: QueryClient, wsId: string) => Promise<void>> = {
  leads: (qc) => qc.prefetchQuery(q.leads()),
  followups: (qc) => qc.prefetchQuery(q.followups()),
  analytics: (qc) => qc.prefetchQuery(q.analytics()),
  members: (qc, id) => qc.prefetchQuery(q.members(id)),
  invites: (qc, id) => qc.prefetchQuery(q.invites(id)),
};
