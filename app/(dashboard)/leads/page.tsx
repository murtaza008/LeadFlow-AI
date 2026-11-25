"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, SearchX, UserRoundSearch } from "lucide-react";
import { PageHeader, EmptyState, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";
import { LeadHoverCard } from "@/components/leads/LeadHoverCard";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import type { Lead } from "@/lib/hooks/use-leads";
import type { FollowUpWithLead } from "@/lib/hooks/use-followups";
import { q } from "@/lib/queries";
import { formatCurrency, statusLabel, type Priority, type Status } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type StageFilter = Status | "ALL";
type TierFilter = Priority | "ALL";
type Sort = "score" | "value" | "newest" | "updated";

const SORTS: Record<Sort, { label: string; fn: (a: Lead, b: Lead) => number }> = {
  score: { label: "Highest score", fn: (a, b) => b.score - a.score },
  value: { label: "Biggest deal", fn: (a, b) => b.value - a.value },
  newest: { label: "Newest", fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  updated: { label: "Recently changed", fn: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
};

const ownerName = (l: Lead) => (l.assignedTo ? l.assignedTo.displayName?.trim() || l.assignedTo.email.split("@")[0] : null);

/** Opens "Add a lead" when the URL has ?new=1 (sidebar button, command palette). */
function NewLeadFromUrl() {
  const params = useSearchParams();
  const router = useRouter();
  if (params.get("new") !== "1") return null;
  return <LeadFormDialog key={params.toString()} defaultOpen onClosed={() => router.replace("/leads", { scroll: false })} />;
}

export default function LeadsPage() {
  const leadsQ = useQuery(q.leads());
  const followQ = useQuery(q.followups());
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("ALL");
  const [tier, setTier] = useState<TierFilter>("ALL");
  const [sort, setSort] = useState<Sort>("score");

  const leads = useMemo(() => leadsQ.data ?? [], [leadsQ.data]);
  const nextFollowUp = useMemo(() => {
    const m = new Map<string, FollowUpWithLead>();
    for (const f of followQ.data ?? []) {
      if (f.done) continue;
      const cur = m.get(f.leadId);
      if (!cur || f.dueAt < cur.dueAt) m.set(f.leadId, f);
    }
    return m;
  }, [followQ.data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads
      .filter(
        (l) =>
          (stage === "ALL" || l.status === stage) &&
          (tier === "ALL" || l.priority === tier) &&
          (!needle || `${l.name} ${l.company ?? ""} ${l.email ?? ""} ${l.title ?? ""}`.toLowerCase().includes(needle)),
      )
      .sort(SORTS[sort].fn);
  }, [leads, query, stage, tier, sort]);

  const filtering = query.trim() !== "" || stage !== "ALL" || tier !== "ALL";
  function clear() {
    setQuery("");
    setStage("ALL");
    setTier("ALL");
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <Suspense fallback={null}>
        <NewLeadFromUrl />
      </Suspense>
      <PageHeader
        eyebrow="Sell"
        title="Leads"
        description={leadsQ.isLoading ? "Loading leads…" : `${leads.length} leads, ${leads.filter((l) => l.priority === "HOT").length} of them Hot.`}
        actions={
          <LeadFormDialog
            trigger={
              <Button variant="primary">
                <Plus aria-hidden /> Add a lead
              </Button>
            }
          />
        }
      />

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search leads</span>
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, title or email"
            className="input-field pl-8"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={stage} onValueChange={(v) => setStage(v as StageFilter)}>
            <SelectTrigger className="w-40" aria-label="Filter by stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All stages</SelectItem>
              {(Object.keys(statusLabel) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Segmented
            label="Tier"
            value={tier}
            onChange={setTier}
            options={[
              { value: "ALL", label: "All" },
              { value: "HOT", label: "Hot" },
              { value: "WARM", label: "Warm" },
              { value: "COLD", label: "Cold" },
            ]}
          />
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-44" aria-label="Sort leads">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORTS) as Sort[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SORTS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p aria-live="polite" className="mt-3 text-[13px] text-fg-muted">
        {!leadsQ.isLoading && (filtering ? `Showing ${filtered.length} of ${leads.length} leads` : `${leads.length} leads`)}
      </p>

      {leadsQ.isLoading ? (
        <div className="panel mt-3 space-y-2 p-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="panel mt-3">
          <EmptyState
            icon={<UserRoundSearch />}
            title="No leads yet"
            description="Add your first lead. LeadFlow books a follow-up for it and you can score it with AI from its profile."
            action={
              <LeadFormDialog
                trigger={
                  <Button variant="primary">
                    <Plus aria-hidden /> Add a lead
                  </Button>
                }
              />
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel mt-3">
          <EmptyState
            icon={<SearchX />}
            title="No leads match"
            description="Try another name or company, or clear the filters."
            action={<Button onClick={clear}>Clear filters</Button>}
          />
        </div>
      ) : (
        <>
          {/* Table on wider screens */}
          <div className="panel mt-3 hidden overflow-hidden md:block">
            <table className="w-full text-[13.5px]">
              <caption className="sr-only">Leads, sorted by {SORTS[sort].label.toLowerCase()}</caption>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {["Lead", "Stage", "Score", "Value", "Owner", "Next follow-up", "Last change"].map((h, i) => (
                    <th key={h} scope="col" className={cn("eyebrow h-10 px-4 font-medium", i === 2 || i === 3 ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="stagger">
                {filtered.map((l, i) => {
                  const next = nextFollowUp.get(l.id);
                  const late = next && new Date(next.dueAt) < new Date();
                  return (
                    <tr key={l.id} style={staggerStyle(i)} className="border-b border-border transition-colors last:border-0 hover:bg-surface-2">
                      <td className="max-w-[18rem] px-4 py-2.5">
                        <div className="flex min-w-0 flex-col">
                          <LeadHoverCard lead={l} />
                          <span className="truncate text-[12.5px] text-fg-muted">{[l.title, l.company].filter(Boolean).join(" · ") || "No company"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-fg-muted">{statusLabel[l.status]}</td>
                      <td className="px-4 py-2.5 text-right">
                        <ScoreBadge score={l.score} priority={l.priority} size="sm" />
                      </td>
                      <td className="tabular px-4 py-2.5 text-right text-fg">{formatCurrency(l.value)}</td>
                      <td className="px-4 py-2.5 text-fg-muted">{ownerName(l) ?? "Unassigned"}</td>
                      <td className={cn("max-w-[14rem] truncate px-4 py-2.5", late ? "font-medium text-danger-text" : "text-fg-muted")}>
                        {next ? `${next.title} · ${late ? "overdue" : timeAgo(next.dueAt)}` : "None"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-fg-muted">{timeAgo(l.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards on phones */}
          <ul className="stagger mt-3 space-y-2 md:hidden">
            {filtered.map((l, i) => (
              <li key={l.id} style={staggerStyle(i)} className="panel flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 text-[14px]">
                    <LeadHoverCard lead={l} />
                  </p>
                  <p className="truncate text-[12.5px] text-fg-muted">
                    {statusLabel[l.status]} · {l.company ?? "No company"} · {formatCurrency(l.value)}
                  </p>
                </div>
                <ScoreBadge score={l.score} priority={l.priority} size="sm" />
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-6 text-[12.5px] text-fg-muted">
        Tip: press <kbd className="rounded border border-border bg-surface-2 px-1 font-mono text-[11px]">Ctrl</kbd>{" "}
        <kbd className="rounded border border-border bg-surface-2 px-1 font-mono text-[11px]">K</kbd> anywhere to jump to a lead.{" "}
        <Link href="/pipeline" className="prose-link">
          Open the pipeline
        </Link>{" "}
        to move deals between stages.
      </p>
    </div>
  );
}
