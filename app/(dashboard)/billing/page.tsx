"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { PLAN_DETAILS } from "@/lib/plans";
import { cn } from "@/lib/utils";

type PlanKey = "FREE" | "TEAM" | "AGENCY";

export default function BillingPage() {
  const { data: workspace, refetch } = useCurrentWorkspace();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function upgrade(plan: "TEAM" | "AGENCY") {
    if (!workspace) return;
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, plan }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Checkout failed");
      if (body.url) {
        window.location.assign(body.url);
      } else {
        toast.success(`Switched to the ${PLAN_DETAILS[plan].name} plan (demo mode — no Stripe keys set).`);
        refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function openPortal() {
    if (!workspace) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not open billing portal");
      window.location.assign(body.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Billing" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div>
            <p className="eyebrow text-muted-foreground">Current plan</p>
            <p className="mt-1 font-display text-xl font-700 text-foreground">
              {workspace ? PLAN_DETAILS[workspace.plan as PlanKey].name : "—"}
            </p>
          </div>
          <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
            {portalLoading ? "Opening…" : "Manage billing"}
          </Button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {(Object.keys(PLAN_DETAILS) as PlanKey[]).map((key) => {
            const plan = PLAN_DETAILS[key];
            const current = workspace?.plan === key;
            const featured = key === "TEAM";
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-xl border p-6",
                  featured ? "border-mint shadow-[0_20px_60px_-30px_var(--color-mint)]" : "border-border",
                )}
              >
                {featured && <p className="eyebrow mb-2 text-mint">Most popular</p>}
                <h3 className="font-display text-xl font-700 text-foreground">{plan.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{plan.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-700 text-foreground">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price !== 0 && <span className="mono-data text-[12px] text-muted-foreground">/mo</span>}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
                      {f}
                    </li>
                  ))}
                </ul>
                {current ? (
                  <Button disabled className="mt-6" variant="outline">
                    Current plan
                  </Button>
                ) : key === "FREE" ? (
                  <Button disabled className="mt-6" variant="outline">
                    Included
                  </Button>
                ) : (
                  <Button
                    className="mt-6"
                    onClick={() => upgrade(key as "TEAM" | "AGENCY")}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === key ? "Redirecting…" : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
