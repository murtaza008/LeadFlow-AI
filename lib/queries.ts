"use client";

import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { ActivityEvent } from "@/lib/activity";
import type { WorkspaceSummary } from "@/lib/workspace-summary";
import type { Lead } from "@/lib/hooks/use-leads";
import type { FollowUpWithLead } from "@/lib/hooks/use-followups";
import type { Invite, Member } from "@/lib/hooks/use-team";

/**
 * Shared query definitions. Pages, hooks and the shell use the same keys, so
 * hovering a nav item prefetches exactly the data the page will read.
 */

export type AnalyticsResponse = {
  funnel: { stage: Lead["status"]; label: string; count: number; value: number }[];
  bySource: { source: string; count: number }[];
  scoreDistribution: { bucket: string; count: number }[];
  weekly: { week: string; created: number; won: number }[];
  totals: { total: number; won: number; avgScore: number; winRate: number };
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
  analytics: () =>
    queryOptions({
      queryKey: ["analytics"],
      queryFn: () => getJson<AnalyticsResponse>("/api/analytics", "analytics"),
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
