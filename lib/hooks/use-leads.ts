"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Lead = {
  id: string;
  workspaceId: string;
  name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  value: number;
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
  aiSummary: string | null;
  aiReasons: string[];
  notes: string | null;
  scoredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  return res.json();
}

async function fetchLeads(): Promise<Lead[]> {
  return json(await fetch("/api/leads"));
}

export function useLeads() {
  return useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
}

export type CreateLeadInput = {
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  source?: string;
  value?: number;
  notes?: string;
};

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeadInput) =>
      json<Lead>(
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) =>
      json<Lead>(
        await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => json(await fetch(`/api/leads/${id}`, { method: "DELETE" })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export type Activity = {
  id: string;
  type: "NOTE" | "STATUS_CHANGE" | "AI_SCORE" | "EMAIL" | "CALL";
  body: string;
  createdAt: string;
  createdBy: { displayName: string | null; email: string } | null;
};

export type FollowUp = {
  id: string;
  leadId: string;
  title: string;
  type: "EMAIL" | "CALL" | "TASK";
  dueAt: string;
  done: boolean;
};

export type LeadDetail = Lead & { activities: Activity[]; followUps: FollowUp[] };

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => json<LeadDetail>(await fetch(`/api/leads/${id}`)),
    enabled: !!id,
  });
}

export function useScoreLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => json<Lead>(await fetch(`/api/leads/${id}/score`, { method: "POST" })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads", id] });
    },
  });
}

export function useGenerateInsights(id: string) {
  return useMutation({
    mutationFn: async () =>
      json<{ insight: string; nextAction: string }>(
        await fetch(`/api/leads/${id}/insights`, { method: "POST" }),
      ),
  });
}

export function useAddActivity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string; type?: "NOTE" | "EMAIL" | "CALL" }) =>
      json<Activity>(
        await fetch(`/api/leads/${id}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads", id] }),
  });
}
