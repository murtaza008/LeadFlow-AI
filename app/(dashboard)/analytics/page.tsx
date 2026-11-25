"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { buttonVariants } from "@/components/ui/button";
import { Ledger } from "@/components/data/Ledger";
import { Delta } from "@/components/data/Delta";
import { ChartPanel, DataTable } from "@/components/charts/ChartPanel";
import { ColumnChart, Legend, type Series } from "@/components/charts/ColumnChart";
import { BarRows } from "@/components/charts/BarRows";
import { q } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { STAGE_LABEL, type RangeDays } from "@/lib/analytics-calc";

const RANGE_LABEL: Record<RangeDays, string> = { 30: "30 days", 90: "90 days", 365: "12 months" };

/** Percent change, or null when there is nothing to compare with. */
function change(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
}

const TREND_SERIES: Series[] = [
  { key: "created", label: "Leads added", color: "var(--chart-1)" },
  { key: "won", label: "Deals won", color: "var(--chart-2)" },
];
const SCORE_SERIES: Series[] = [{ key: "count", label: "Leads", color: "var(--chart-1)" }];

export default function AnalyticsPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const { data, isLoading, isError, error } = useQuery({ ...q.analytics(days), placeholderData: (prev) => prev });
  const range = RANGE_LABEL[days];

  const header = (
    <PageHeader
      eyebrow="Understand"
      title="Analytics"
      description="How leads come in, move through the pipeline and close."
      actions={
        <Segmented
          label="Date range"
          value={String(days) as `${RangeDays}`}
          onChange={(v) => setDays(Number(v) as RangeDays)}
          options={[
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "365", label: "12 months" },
          ]}
        />
      }
    />
  );

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {header}
        <p role="alert" className="mt-8 rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-[14px] text-danger-text">
          {error.message}
        </p>
      </div>
    );
  }

  if (data && data.totals.total === 0) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {header}
        <div className="panel mt-8">
          <EmptyState
            icon={<BarChart3 />}
            title="No leads to analyse yet"
            description="Charts fill in as you add leads and move them through the pipeline."
            action={
              <Link href="/leads?new=1" className={buttonVariants({ variant: "primary" })}>
                Add a lead
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const cur = data?.period.current;
  const prev = data?.period.previous;
  const vs = `vs previous ${range}`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      {header}

      <Ledger
        className="mt-8"
        loading={isLoading || !data}
        items={[
          {
            label: `Leads added, ${range}`,
            value: cur?.created ?? null,
            foot: cur && prev && (
              <>
                <Delta value={change(cur.created, prev.created)} />
                <span>{vs}</span>
              </>
            ),
            breakdown: cur && prev && (
              <HoverStats
                rows={[
                  { label: `Last ${range}`, value: cur.created },
                  { label: `Previous ${range}`, value: prev.created },
                  { label: "All leads", value: data.totals.total },
                ]}
              />
            ),
          },
          {
            label: `Deals won, ${range}`,
            value: cur?.won ?? null,
            foot: cur && prev && (
              <>
                <Delta value={change(cur.won, prev.won)} good="up" />
                <span>{vs}</span>
              </>
            ),
            breakdown: cur && prev && (
              <HoverStats
                rows={[
                  { label: "Won", value: cur.won },
                  { label: "Lost", value: cur.lost },
                  { label: `Won, previous ${range}`, value: prev.won },
                ]}
              />
            ),
          },
          {
            label: `Won value, ${range}`,
            value: cur?.wonValue ?? null,
            format: formatCurrency,
            foot: cur && prev && (
              <>
                <Delta value={change(cur.wonValue, prev.wonValue)} good="up" />
                <span>{vs}</span>
              </>
            ),
            breakdown: cur && prev && (
              <HoverStats
                rows={[
                  { label: `Last ${range}`, value: formatCurrency(cur.wonValue) },
                  { label: `Previous ${range}`, value: formatCurrency(prev.wonValue) },
                  { label: "Average won deal", value: cur.won ? formatCurrency(cur.wonValue / cur.won) : "No wins yet" },
                ]}
              />
            ),
          },
          {
            label: `Win rate, ${range}`,
            value: cur?.winRate ?? null,
            format: (n) => `${Math.round(n)}%`,
            foot:
              cur && prev ? (
                cur.winRate !== null && prev.winRate !== null ? (
                  <>
                    <Delta value={cur.winRate - prev.winRate} unit=" pts" good="up" />
                    <span>{vs}</span>
                  </>
                ) : (
                  <span>Won ÷ (won + lost) in this period</span>
                )
              ) : null,
            breakdown: cur && (
              <>
                <p className="mt-1 text-[13px] text-fg-muted">Won deals as a share of deals that closed, won or lost.</p>
                <HoverStats
                  rows={[
                    { label: "Won", value: cur.won },
                    { label: "Lost", value: cur.lost },
                    { label: `Previous ${range}`, value: prev?.winRate === null || !prev ? "No closed deals" : `${prev.winRate}%` },
                  ]}
                />
              </>
            ),
          },
          {
            label: "Average AI score",
            value: data?.totals.avgScore ?? null,
            foot: <span>Across all {data?.totals.total ?? 0} leads</span>,
          },
        ]}
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ChartPanel
          title="Leads added and deals won"
          description={days > 90 ? "Per month, last 12 months" : `Per week, last ${range}`}
          chart={
            data ? (
              <>
                <Legend series={TREND_SERIES} />
                <div className="mt-3">
                  <ColumnChart
                    data={data.trend}
                    series={TREND_SERIES}
                    value={(d, s) => (s.key === "created" ? d.created : d.won)}
                    summary={`Leads added and deals won ${days > 90 ? "per month" : "per week"}, last ${range}`}
                    tooltip={(d) => (
                      <>
                        <p className="font-medium text-fg">{days > 90 ? d.label : `Week of ${d.label}`}</p>
                        <HoverStats
                          rows={[
                            { label: "Leads added", value: d.created },
                            { label: "Deals won", value: d.won },
                            { label: "Won value", value: formatCurrency(d.wonValue) },
                          ]}
                        />
                      </>
                    )}
                  />
                </div>
              </>
            ) : (
              <Skeleton className="h-[240px]" />
            )
          }
          table={
            data && (
              <DataTable
                caption="Leads added and deals won"
                columns={[{ label: days > 90 ? "Month" : "Week of" }, { label: "Added", numeric: true }, { label: "Won", numeric: true }, { label: "Won value", numeric: true }]}
                rows={data.trend.map((t) => [t.label, t.created, t.won, formatCurrency(t.wonValue)])}
              />
            )
          }
        />

        <ChartPanel
          title="Pipeline by stage"
          description="Every lead today, with its deal value"
          chart={
            data ? (
              <BarRows
                label="Leads per stage"
                rows={data.funnel.map((f) => ({
                  key: f.stage,
                  label: f.label,
                  value: f.count,
                  display: `${f.count} · ${formatCurrency(f.value)}`,
                }))}
              />
            ) : (
              <Skeleton className="h-[220px]" />
            )
          }
          table={
            data && (
              <DataTable
                caption="Pipeline by stage"
                columns={[{ label: "Stage" }, { label: "Leads", numeric: true }, { label: "Value", numeric: true }]}
                rows={data.funnel.map((f) => [f.label, f.count, formatCurrency(f.value)])}
              />
            )
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
        <ChartPanel
          className="lg:col-span-2"
          title="Where leads come from"
          description="Leads per source, and how often closed deals from it were won"
          chart={
            data ? (
              <>
                <div className="mb-2 flex justify-end">
                  <span className="eyebrow w-16 text-right">Win rate</span>
                </div>
                <BarRows
                  label="Leads per source"
                  rows={data.sources.slice(0, 8).map((s) => ({
                    key: s.source,
                    label: (
                      <HoverCard
                        delay="long"
                        trigger={
                          <span tabIndex={0} className="cursor-default rounded-sm underline decoration-border-strong decoration-dotted underline-offset-4 outline-none">
                            {s.source}
                          </span>
                        }
                      >
                        <p className="font-medium">{s.source}</p>
                        <HoverStats
                          rows={[
                            { label: "Open", value: `${s.open} · ${formatCurrency(s.openValue)}` },
                            { label: "Won", value: s.won },
                            { label: "Lost", value: s.lost },
                          ]}
                        />
                      </HoverCard>
                    ),
                    value: s.total,
                    display: `${s.total} lead${s.total === 1 ? "" : "s"}`,
                    aside: s.winRate === null ? "–" : `${s.winRate}%`,
                  }))}
                />
              </>
            ) : (
              <Skeleton className="h-[220px]" />
            )
          }
          table={
            data && (
              <DataTable
                caption="Leads per source"
                columns={[{ label: "Source" }, { label: "Leads", numeric: true }, { label: "Open", numeric: true }, { label: "Won", numeric: true }, { label: "Lost", numeric: true }, { label: "Win rate", numeric: true }]}
                rows={data.sources.map((s) => [s.source, s.total, s.open, s.won, s.lost, s.winRate === null ? "–" : `${s.winRate}%`])}
              />
            )
          }
        />

        <ChartPanel
          title="AI score spread"
          description="How many leads fall in each score band"
          chart={
            data ? (
              <ColumnChart
                data={data.scoreDistribution.map((b) => ({ key: b.bucket, label: b.bucket.replace("-", "–"), count: b.count }))}
                series={SCORE_SERIES}
                value={(d) => d.count}
                height={200}
                summary="Number of leads in each AI score band"
                tooltip={(d) => (
                  <>
                    <p className="font-medium text-fg">Score {d.label}</p>
                    <HoverStats rows={[{ label: "Leads", value: d.count }, { label: "Share", value: `${data.totals.total ? Math.round((d.count / data.totals.total) * 100) : 0}%` }]} />
                  </>
                )}
              />
            ) : (
              <Skeleton className="h-[200px]" />
            )
          }
          table={
            data && (
              <DataTable
                caption="AI score spread"
                columns={[{ label: "Score band" }, { label: "Leads", numeric: true }]}
                rows={data.scoreDistribution.map((b) => [b.bucket.replace("-", "–"), b.count])}
              />
            )
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section aria-labelledby="top-open" className="panel p-5">
          <h2 id="top-open" className="text-[15px] font-semibold text-fg">
            Biggest open deals
          </h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">The five open leads worth the most</p>
          {data ? (
            data.topOpen.length ? (
              <ol className="stagger mt-4 divide-y divide-border">
                {data.topOpen.map((t, i) => (
                  <li key={t.id} style={{ "--i": i } as React.CSSProperties} className="flex items-center gap-3 py-2.5">
                    <span className="w-4 font-mono text-[12px] text-fg-muted">{i + 1}</span>
                    <Link href={`/leads/${t.id}`} className="min-w-0 flex-1 truncate text-[14px] font-medium text-fg hover:underline">
                      {t.name}
                      {t.company && <span className="font-normal text-fg-muted"> · {t.company}</span>}
                    </Link>
                    <span className="hidden text-[12.5px] text-fg-muted sm:inline">{STAGE_LABEL[t.status]}</span>
                    <span className="tabular w-24 text-right text-[13.5px] text-fg">{formatCurrency(t.value)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-[14px] text-fg-muted">No open deals right now.</p>
            )
          ) : (
            <Skeleton className="mt-4 h-40" />
          )}
        </section>

        <section aria-labelledby="by-owner" className="panel p-5">
          <h2 id="by-owner" className="text-[15px] font-semibold text-fg">
            By owner
          </h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">Open pipeline and wins for each person who owns leads</p>
          {data ? (
            <div className="mt-3 overflow-x-auto">
              <DataTable
                caption="Pipeline by owner"
                columns={[{ label: "Owner" }, { label: "Open", numeric: true }, { label: "Open value", numeric: true }, { label: "Won", numeric: true }, { label: "Won value", numeric: true }]}
                rows={data.owners.map((o) => [o.name, o.open, formatCurrency(o.openValue), o.won, formatCurrency(o.wonValue)])}
              />
            </div>
          ) : (
            <Skeleton className="mt-4 h-40" />
          )}
        </section>
      </div>
    </div>
  );
}
