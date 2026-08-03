"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

type Analytics = {
  funnel: { stage: string; label: string; count: number; value: number }[];
  bySource: { source: string; count: number }[];
  scoreDistribution: { bucket: string; count: number }[];
  weekly: { week: string; created: number; won: number }[];
  totals: { total: number; won: number; avgScore: number; winRate: number };
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "var(--color-graphite)",
  CONTACTED: "var(--color-fog)",
  QUALIFIED: "var(--color-amber)",
  WON: "var(--color-mint)",
  LOST: "var(--color-danger)",
};

async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

const tooltipStyle = {
  background: "var(--color-growth)",
  border: "none",
  borderRadius: 8,
  color: "var(--color-leaf)",
  fontSize: 12,
  padding: "8px 10px",
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });

  return (
    <>
      <Topbar title="Analytics" />
      <div className="flex-1 overflow-auto p-6">
        {isLoading || !data ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.funnel} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={80}
                      tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)" }}
                      contentStyle={tooltipStyle}
                      formatter={(v, _n, p) => [
                        `${v} leads · ${formatCurrency(p.payload.value)}`,
                        "",
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {data.funnel.map((f) => (
                        <Cell key={f.stage} fill={STAGE_COLORS[f.stage]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.scoreDistribution} margin={{ left: -16 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="var(--color-mint)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads by source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.bySource} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="source"
                      width={90}
                      tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="var(--color-graphite)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Created vs. won, last 8 weeks</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.weekly} margin={{ left: -16 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="created" name="Created" stroke="var(--color-fog)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="won" name="Won" stroke="var(--color-mint)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
