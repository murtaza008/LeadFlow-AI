"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type FollowUpWithLead = {
  id: string;
  leadId: string;
  title: string;
  type: "EMAIL" | "CALL" | "TASK";
  dueAt: string;
  done: boolean;
  lead: { name: string; company: string | null };
};

async function fetchFollowUps(): Promise<FollowUpWithLead[]> {
  const res = await fetch("/api/followups");
  if (!res.ok) throw new Error("Failed to load follow-ups");
  return res.json();
}

export function useFollowUps() {
  return useQuery({ queryKey: ["followups"], queryFn: fetchFollowUps });
}

export function useToggleFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Could not update follow-up");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["followups"] }),
  });
}
