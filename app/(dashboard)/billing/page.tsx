"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Info, Loader2 } from "lucide-react";
import { PageHeader, Badge, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { EVERY_PLAN, PLAN_DETAILS, type PlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

const ORDER: PlanKey[] = ["FREE", "TEAM", "AGENCY"];

export default function BillingPage() {
  const { data: ws, refetch } = useCurrentWorkspace();
  const [busy, setBusy] = useState<PlanKey | "portal" | null>(null);
  const canManage = (ws?.role === "OWNER" || ws?.role === "ADMIN") && !ws?.isDemo;

  async function choose(plan: "TEAM" | "AGENCY") {
    if (!ws) return;
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ws.id, plan }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not start checkout");
      if (body.url) {
        window.location.assign(body.url);
        return;
      }
      toast.success(`Switched to ${PLAN_DETAILS[plan].name}`, { description: "Stripe isn't set up here, so the plan changed right away." });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    if (!ws) return;
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ws.id }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Could not open the billing portal");
      window.location.assign(body.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the billing portal");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Billing"
        description="Every plan includes the whole product. Plans differ only in price."
        actions={
          canManage && ws?.plan !== "FREE" ? (
            <Button onClick={portal} disabled={busy === "portal"}>
              {busy === "portal" ? <Loader2 aria-hidden className="animate-spin" /> : <ExternalLink aria-hidden />}
              Manage payment
            </Button>
          ) : undefined
        }
      />

      {!ws ? (
        <Skeleton className="mt-8 h-72" />
      ) : (
        <>
          {!canManage && (
            <p className="mt-6 flex gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13.5px] text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
              {ws.isDemo ? "Checkout and billing changes are turned off in the shared demo." : "Only Owners and Admins can change the plan."}
            </p>
          )}
          <ul className="panel mt-6 divide-y divide-border overflow-hidden">
            {ORDER.map((key) => {
              const p = PLAN_DETAILS[key];
              const current = ws.plan === key;
              const upgrade = ORDER.indexOf(key) > ORDER.indexOf(ws.plan);
              return (
                <li key={key} className={cn("grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center", current && "bg-accent-soft/50")}>
                  <div>
                    <h2 className="flex flex-wrap items-baseline gap-3 text-[17px] font-semibold text-fg">
                      {p.name}
                      <span className="tabular font-display text-[24px]">{p.price === 0 ? "Free" : `$${p.price}`}</span>
                      {p.price > 0 && <span className="text-[13px] font-normal text-fg-muted">a month</span>}
                      {current && <Badge tone="accent">Current plan</Badge>}
                    </h2>
                    <p className="mt-1 text-[14px] text-fg-muted">{p.tagline}</p>
                  </div>
                  {canManage && upgrade && key !== "FREE" ? (
                    <Button variant="primary" className="sm:w-44" disabled={busy !== null} onClick={() => choose(key as "TEAM" | "AGENCY")}>
                      {busy === key && <Loader2 aria-hidden className="animate-spin" />}
                      Switch to {p.name}
                    </Button>
                  ) : current ? (
                    <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-success-text sm:w-44 sm:justify-end">
                      <Check aria-hidden className="size-4" /> You&rsquo;re on this plan
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="included" className="panel mt-6 p-5">
            <h2 id="included" className="text-[15px] font-semibold text-fg">
              Included on every plan
            </h2>
            <ul className="mt-3 grid gap-2 text-[14px] text-fg sm:grid-cols-2">
              {EVERY_PLAN.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-fg-muted">
              Payments go through Stripe in test mode, so no real card is ever charged. Moving to a lower plan or cancelling
              is done in the Stripe billing portal.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
