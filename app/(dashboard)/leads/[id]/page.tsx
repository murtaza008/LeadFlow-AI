"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Wand2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Tag,
  DollarSign,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLead,
  useUpdateLead,
  useDeleteLead,
  useScoreLead,
  useGenerateInsights,
  useAddActivity,
} from "@/lib/hooks/use-leads";
import { formatCurrency, initials, priorityStyle, statusLabel, relativeDue, type Status } from "@/lib/format";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lead, isLoading } = useLead(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const scoreLead = useScoreLead(id);
  const insights = useGenerateInsights(id);
  const addActivity = useAddActivity(id);
  const [note, setNote] = useState("");

  if (isLoading || !lead) {
    return (
      <>
        <Topbar title="Lead" />
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  const p = priorityStyle[lead.priority];

  async function onScore() {
    try {
      await scoreLead.mutateAsync();
      toast.success("Lead re-scored by AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not score this lead");
    }
  }

  async function onInsights() {
    try {
      await insights.mutateAsync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate insights");
    }
  }

  async function onStatusChange(status: Status) {
    try {
      await updateLead.mutateAsync({ id, patch: { status } });
      toast.success(`Moved to ${statusLabel[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stage");
    }
  }

  async function onAddNote() {
    if (!note.trim()) return;
    try {
      await addActivity.mutateAsync({ body: note.trim(), type: "NOTE" });
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add note");
    }
  }

  async function onDelete() {
    if (!confirm(`Delete ${lead?.name}? This cannot be undone.`)) return;
    try {
      await deleteLead.mutateAsync(id);
      toast.success("Lead deleted");
      router.push("/leads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete lead");
    }
  }

  return (
    <>
      <Topbar
        title={lead.name}
        action={
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete lead">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-[16px]">{initials(lead.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-700 text-foreground">{lead.name}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${p.className}`}>
                  {p.label}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {lead.title ? `${lead.title} · ` : ""}
                {lead.company ?? "No company"}
              </p>
            </div>
          </div>
          <Select value={lead.status} onValueChange={(v) => onStatusChange(v as Status)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(statusLabel) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                <Detail icon={Mail} label="Email" value={lead.email ?? "—"} />
                <Detail icon={Phone} label="Phone" value={lead.phone ?? "—"} />
                <Detail icon={Building2} label="Source" value={lead.source ?? "—"} />
                <Detail icon={DollarSign} label="Deal value" value={formatCurrency(lead.value)} mono />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Log a call, note, or update…"
                    className="min-h-[44px]"
                  />
                  <Button onClick={onAddNote} disabled={addActivity.isPending || !note.trim()}>
                    Add
                  </Button>
                </div>
                <ul className="space-y-3">
                  {lead.activities.length === 0 && (
                    <li className="text-[13px] text-muted-foreground">No activity yet.</li>
                  )}
                  {lead.activities.map((a) => (
                    <li key={a.id} className="animate-rise-in rounded-md border border-border bg-paper p-3">
                      <div className="flex items-center justify-between">
                        <span className="eyebrow text-mint">{a.type.replace("_", " ")}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{a.body}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>AI score</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={lead.score} size="lg" animate key={lead.scoredAt ?? "0"} />
                  <div>
                    <p className="text-[13px] font-600 text-foreground">
                      {lead.scoredAt ? "Likelihood to close" : "Not scored yet"}
                    </p>
                    {lead.aiSummary && (
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{lead.aiSummary}</p>
                    )}
                  </div>
                </div>
                {lead.aiReasons.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {lead.aiReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-mint" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  onClick={onScore}
                  disabled={scoreLead.isPending}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  {scoreLead.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {lead.scoredAt ? "Re-score with AI" : "Score with AI"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Customer insight</CardTitle>
                <Wand2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {insights.data ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-[13px] leading-relaxed text-foreground">
                        {insights.data.insight}
                      </p>
                      <div className="rounded-md bg-mint-dim px-3 py-2 text-[12px] font-600 text-mint">
                        Next: {insights.data.nextAction}
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      Get a sharp read on this deal and a concrete next step.
                    </p>
                  )}
                </AnimatePresence>
                <Button
                  onClick={onInsights}
                  disabled={insights.isPending}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  {insights.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {insights.data ? "Refresh insight" : "Generate insight"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.followUps.length === 0 && (
                  <p className="text-[13px] text-muted-foreground">No follow-ups scheduled.</p>
                )}
                {lead.followUps.map((f) => {
                  const due = relativeDue(new Date(f.dueAt));
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-[13px] ${f.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {f.title}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-600 ${due.overdue && !f.done ? "text-danger" : "text-muted-foreground"}`}>
                        {f.done ? "Done" : due.label}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="eyebrow">{label}</span>
      </div>
      <p className={`mt-1 truncate text-[13px] font-600 text-foreground ${mono ? "mono-data" : ""}`}>
        {value}
      </p>
    </div>
  );
}
