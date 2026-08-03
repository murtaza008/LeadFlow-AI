"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, DollarSign, Target, TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/motion/CountUp";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { useLeads } from "@/lib/hooks/use-leads";
import { formatCurrency, initials, priorityStyle } from "@/lib/format";

type FocusPick = {
  leadId: string;
  reason: string;
  name: string;
  company: string | null;
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  value: number;
};

async function fetchFocus(): Promise<{ picks: FocusPick[]; error?: string }> {
  const res = await fetch("/api/recommendations");
  if (res.status === 501) return { picks: [], error: (await res.json()).error };
  if (!res.ok) throw new Error("Could not load recommendations");
  return res.json();
}

export default function DashboardPage() {
  const { data: leads = [], isLoading } = useLeads();
  const focus = useQuery({ queryKey: ["recommendations"], queryFn: fetchFocus, enabled: leads.length > 0 });

  const hot = leads.filter((l) => l.priority === "HOT").length;
  const openValue = leads
    .filter((l) => l.status !== "WON" && l.status !== "LOST")
    .reduce((sum, l) => sum + l.value, 0);
  const avgScore = leads.length
    ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
    : 0;
  const wonCount = leads.filter((l) => l.status === "WON").length;
  const winRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0;
  const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Flame} label="Hot leads" value={hot} accent="ember" sub="ready to close" />
          <StatCard
            icon={DollarSign}
            label="Open pipeline"
            value={openValue}
            format={formatCurrency}
            accent="mint"
            sub="active deal value"
          />
          <StatCard icon={Target} label="Avg. lead score" value={avgScore} accent="mint" sub="across all leads" />
          <StatCard
            icon={TrendingUp}
            label="Win rate"
            value={winRate}
            format={(n) => `${Math.round(n)}%`}
            accent="mint"
            sub={`${wonCount} won`}
          />
        </div>

        {focus.data && focus.data.picks.length > 0 && (
          <div className="mt-6 rounded-xl border border-mint/30 bg-mint-dim/40 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-mint" />
              <h2 className="font-display text-[15px] font-700 text-foreground">
                Focus on these today
              </h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {focus.data.picks.map((p) => (
                <Link
                  key={p.leadId}
                  href={`/leads/${p.leadId}`}
                  className="rounded-md border border-border bg-card p-3 transition-colors hover:border-mint/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[13px] font-600 text-foreground">{p.name}</span>
                    <ScoreBadge score={p.score} size="sm" />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{p.company ?? "—"}</p>
                  <p className="mt-1.5 text-[12px] leading-snug text-foreground/80">{p.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-[16px] font-700 text-foreground">Priority leads</h2>
              <p className="text-[12px] text-muted-foreground">Highest-scoring opportunities right now</p>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-[13px] font-600 text-mint hover:underline"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topLeads.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[15px] font-600 text-foreground">No leads yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Add your first lead to start scoring.</p>
              <Link
                href="/leads"
                className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-[13px] font-600 text-primary-foreground"
              >
                Go to Leads
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topLeads.map((lead) => {
                const p = priorityStyle[lead.priority];
                return (
                  <li key={lead.id}>
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[12px] font-700 text-secondary-foreground">
                        {initials(lead.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-600 text-foreground">{lead.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {lead.title ? `${lead.title} · ` : ""}
                          {lead.company ?? "—"}
                        </p>
                      </div>
                      <span className={`hidden rounded-full px-2.5 py-0.5 text-[11px] font-600 sm:inline ${p.className}`}>
                        {p.label}
                      </span>
                      <span className="mono-data w-16 shrink-0 text-right text-[13px] text-foreground">
                        {formatCurrency(lead.value)}
                      </span>
                      <ScoreBadge score={lead.score} size="sm" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  format,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
  accent: "mint" | "ember";
  format?: (n: number) => string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-500 text-muted-foreground">{label}</span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              accent === "ember" ? "bg-ember-dim text-ember" : "bg-secondary text-mint"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mono-data mt-3 text-[26px] font-700 text-foreground">
          <CountUp value={value} format={format} />
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
