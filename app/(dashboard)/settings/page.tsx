"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { PLAN_DETAILS } from "@/lib/plans";

const PRESETS = ["#00c27c", "#1a1f16", "#ff6b35", "#e6a817", "#3d6bff", "#8b5cf6"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();

  const [draft, setDraft] = useState<{ name: string; color: string } | null>(null);
  const name = draft?.name ?? ws?.name ?? "";
  const color = draft?.color ?? ws?.brandColor ?? "#00c27c";
  const setName = (v: string) => setDraft({ name: v, color });
  const setColor = (v: string) => setDraft({ name, color: v });
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";

  const save = useMutation({
    mutationFn: async () => {
      if (!ws) return;
      const res = await fetch(`/api/workspaces/${ws.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brandColor: color }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save workspace");
      }
    },
    onSuccess: () => {
      toast.success("Workspace saved");
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Topbar title="Settings" />
      <div className="max-w-2xl flex-1 space-y-5 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManage}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Brand color</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => canManage && setColor(c)}
                    disabled={!canManage}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      color === c ? "ring-2 ring-mint ring-offset-2 ring-offset-card" : "hover:scale-105"
                    }`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
                <span className="mono-data ml-1 text-[12px] text-muted-foreground">{color}</span>
              </div>
            </div>
            <div>
              <Label>Plan</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full bg-mint-dim px-2.5 py-1 text-[11px] font-600 uppercase text-mint">
                  {ws ? PLAN_DETAILS[ws.plan].name : "—"}
                </span>
                <a href="/billing" className="text-[12px] text-mint hover:underline">
                  Manage billing →
                </a>
              </div>
            </div>
            {canManage && (
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save workspace"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="mt-1.5 text-[14px] text-foreground">{session?.user?.name ?? "—"}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="mt-1.5 text-[14px] text-foreground">{session?.user?.email ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
