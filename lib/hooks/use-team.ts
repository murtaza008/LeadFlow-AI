"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: { displayName: string | null; email: string; avatarUrl: string | null };
};

export type Invite = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  expiresAt: string;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  return res.json();
}

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => json<Member[]>(await fetch(`/api/workspaces/${workspaceId}/members`)),
    enabled: !!workspaceId,
  });
}

export function useInvites(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["invites", workspaceId],
    queryFn: async () => json<Invite[]>(await fetch(`/api/workspaces/${workspaceId}/invites`)),
    enabled: !!workspaceId,
  });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", workspaceId] }),
  });
}
