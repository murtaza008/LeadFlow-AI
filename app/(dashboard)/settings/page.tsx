"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Info, Loader2 } from "lucide-react";
import { PageHeader, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentWorkspace, type CurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { PLAN_DETAILS } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** Brand colours offered in the picker; any #rrggbb also works. */
const PRESETS = ["#8a5d00", "#00c27c", "#2563eb", "#7c3aed", "#db2777", "#0f766e", "#334155"];

export default function SettingsPage() {
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <PageHeader eyebrow="Workspace" title="Settings" description="Your workspace's name and colour, how LeadFlow looks for you, and your account." />
      <div className="mt-8 space-y-6">
        {ws ? <WorkspaceForm key={`${ws.id}-${ws.name}-${ws.brandColor}`} ws={ws} /> : <Skeleton className="h-64" />}

        <section aria-labelledby="appearance" className="panel p-5">
          <h2 id="appearance" className="text-[15px] font-semibold text-fg">
            Appearance
          </h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">Light, dark, or follow your device. Saved in this browser.</p>
          <ThemeToggle className="mt-4" />
        </section>

        <section aria-labelledby="account" className="panel p-5">
          <h2 id="account" className="text-[15px] font-semibold text-fg">
            Your account
          </h2>
          <dl className="mt-3 divide-y divide-border text-[14px]">
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-fg-muted">Name</dt>
              <dd className="text-fg">{session?.user?.name ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-fg-muted">Email</dt>
              <dd className="truncate text-fg">{session?.user?.email ?? ""}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-fg-muted">Role here</dt>
              <dd className="text-fg">{ws ? { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" }[ws.role] : ""}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function WorkspaceForm({ ws }: { ws: CurrentWorkspace }) {
  const qc = useQueryClient();
  const canManage = (ws.role === "OWNER" || ws.role === "ADMIN") && !ws.isDemo;
  const [name, setName] = useState(ws.name);
  const [color, setColor] = useState(ws.brandColor);
  const dirty = name.trim() !== ws.name || color.toLowerCase() !== ws.brandColor.toLowerCase();

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${ws.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brandColor: color }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not save");
    },
    onSuccess: () => {
      toast.success("Workspace saved");
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canManage && dirty) save.mutate();
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="workspace" className="panel p-5">
      <h2 id="workspace" className="text-[15px] font-semibold text-fg">
        Workspace
      </h2>
      {!canManage && (
        <p className="mt-2 flex gap-2 text-[13px] text-fg-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
          {ws.isDemo
            ? "Workspace settings are turned off in the shared demo."
            : "Only Owners and Admins can change these."}
        </p>
      )}
      <div className="mt-4">
        <label htmlFor="ws-name" className="text-[13px] font-medium text-fg">
          Name
        </label>
        <input
          id="ws-name"
          value={name}
          minLength={2}
          maxLength={80}
          required
          onChange={(e) => setName(e.target.value)}
          disabled={!canManage}
          className="input-field mt-1.5 disabled:opacity-60"
        />
      </div>
      <fieldset className="mt-5" disabled={!canManage}>
        <legend className="text-[13px] font-medium text-fg">Brand colour</legend>
        <p className="text-[12.5px] text-fg-muted">Marks your workspace in the sidebar.</p>
        <div role="radiogroup" aria-label="Brand colour" className="mt-2.5 flex flex-wrap items-center gap-2">
          {PRESETS.map((c) => {
            const on = color.toLowerCase() === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c}
                onClick={() => setColor(c)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border border-black/10 transition-transform disabled:opacity-60",
                  on ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : "hover:scale-105",
                )}
                style={{ background: c }}
              >
                {on && <Check aria-hidden className="size-4 text-white drop-shadow" />}
              </button>
            );
          })}
          <label className="ml-1 flex items-center gap-2 text-[13px] text-fg-muted">
            Custom
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Custom brand colour"
              className="h-8 w-10 cursor-pointer rounded border border-border bg-surface disabled:opacity-60"
            />
          </label>
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-[13px] text-fg-muted">
          {PLAN_DETAILS[ws.plan].name} plan ·{" "}
          <Link href="/billing" className="prose-link">
            Billing
          </Link>
        </p>
        {canManage && (
          <Button type="submit" variant="primary" disabled={!dirty || save.isPending}>
            {save.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Save changes
          </Button>
        )}
      </div>
    </form>
  );
}
