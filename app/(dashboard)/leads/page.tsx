"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { useLeads, type Lead } from "@/lib/hooks/use-leads";
import { formatCurrency, initials, priorityStyle, statusLabel, type Status } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = Status | "ALL";

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || l.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, status]);

  return (
    <>
      <Topbar
        title="Leads"
        action={
          <LeadFormDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add lead
              </Button>
            }
          />
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads by name, company, or email…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All stages" />
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
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-[15px] font-600 text-foreground">
                {leads.length === 0 ? "No leads yet" : "No leads match your filters"}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {leads.length === 0
                  ? "Add your first lead to start AI scoring."
                  : "Try a different search or stage."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const p = priorityStyle[lead.priority];
  return (
    <TableRow className="cursor-pointer">
      <TableCell>
        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(lead.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-600 text-foreground">{lead.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">
              {lead.title ? `${lead.title} · ` : ""}
              {lead.company ?? "—"}
            </p>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${p.className}`}>
          {p.label}
        </span>
      </TableCell>
      <TableCell className="text-[13px] text-muted-foreground">{statusLabel[lead.status]}</TableCell>
      <TableCell className="hidden text-[13px] text-muted-foreground md:table-cell">
        {lead.assignedTo ? (lead.assignedTo.displayName ?? lead.assignedTo.email) : "—"}
      </TableCell>
      <TableCell className="mono-data text-right text-[13px] font-600 text-foreground">
        {formatCurrency(lead.value)}
      </TableCell>
      <TableCell className="text-right">
        <ScoreBadge score={lead.score} size="sm" className="ml-auto" />
      </TableCell>
    </TableRow>
  );
}
