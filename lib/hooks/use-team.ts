"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { q } from "@/lib/queries";

export type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  user: { displayName: string | null; email: string; avatarUrl: string | null };
};

export type Invite = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  expiresAt: string;
  createdAt: string;
  /** The invite link token; only sent to Owners and Admins. */
  token?: string;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  return res.json();
}

export function useMembers(workspaceId: string | undefined) {
  return useQuery({ ...q.members(workspaceId ?? ""), enabled: !!workspaceId });
}

export function useInvites(workspaceId: string | undefined) {
  return useQuery({ ...q.invites(workspaceId ?? ""), enabled: !!workspaceId });
}

export function useSendInvite(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: "ADMIN" | "MEMBER" }) =>
      json<Invite>(
        await fetch(`/api/workspaces/${workspaceId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites", workspaceId] });
      qc.invalidateQueries({ queryKey: ["summary", workspaceId] });
    },
  });
}
