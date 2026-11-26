"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { Badge } from "@/components/ui/primitives";
import { formatCurrency, priorityStyle, statusLabel } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import type { Lead } from "@/lib/hooks/use-leads";
import { cn } from "@/lib/utils";

/**
 * The lead's name as a link to its profile, with a hover preview built from
 * data the list already has (no extra request). Long open delay, so moving
 * the mouse down a list doesn't pop cards everywhere.
 */
export function LeadHoverCard({
  lead,
  children,
  className,
}: {
  lead: Lead;
  children?: ReactNode;
  className?: string;
}) {
  const tier = priorityStyle[lead.priority];
  const owner = lead.assignedTo ? lead.assignedTo.displayName?.trim() || lead.assignedTo.email.split("@")[0] : "Unassigned";
  return (
    <HoverCard
      delay="long"
      width={320}
      trigger={
        <Link href={`/leads/${lead.id}`} className={cn("min-w-0 truncate font-medium text-fg hover:underline", className)}>
          {children ?? lead.name}
        </Link>
      }
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lead.name}</p>
          <p className="truncate text-[13px] text-fg-muted">{[lead.title, lead.company].filter(Boolean).join(" · ") || "No company"}</p>
        </div>
        <ScoreBadge score={lead.score} priority={lead.priority} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge className={tier.className}>{tier.label}</Badge>
        <Badge tone="outline">{statusLabel[lead.status]}</Badge>
        {lead.source && <Badge tone="neutral">{lead.source}</Badge>}
      </div>
      {lead.aiSummary && <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-fg-muted">{lead.aiSummary}</p>}
      <HoverStats
        rows={[
          { label: "Deal value", value: formatCurrency(lead.value) },
          { label: "Owner", value: owner },
          { label: "Last change", value: timeAgo(lead.updatedAt) },
        ]}
      />
    </HoverCard>
  );
}
