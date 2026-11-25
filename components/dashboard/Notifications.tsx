"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { timeAgo } from "@/lib/time";
import { AlertTriangle, ArrowRightLeft, Bell, Gauge, PhoneCall, Trophy, UserPlus } from "lucide-react";
import * as M from "@radix-ui/react-dropdown-menu";
import { q } from "@/lib/queries";
import { getSeen, setSeen, subscribeSeen } from "@/lib/seen-store";
import type { ActivityEventType } from "@/lib/activity";
import { cn } from "@/lib/utils";

export const activityIcons: Record<ActivityEventType, { icon: typeof Bell; tone: string }> = {
  "lead.won": { icon: Trophy, tone: "text-success-text" },
  "lead.stage": { icon: ArrowRightLeft, tone: "text-fg-muted" },
  "lead.scored": { icon: Gauge, tone: "text-accent-text" },
  "lead.logged": { icon: PhoneCall, tone: "text-fg-muted" },
  "followup.overdue": { icon: AlertTriangle, tone: "text-danger-text" },
  "member.joined": { icon: UserPlus, tone: "text-fg-muted" },
};

/** Bell with a feed of real workspace events: teammates' deals, AI scores, overdue follow-ups. */
export function Notifications({ wsId }: { wsId: string }) {
  const router = useRouter();
  const { data: events = [], isLoading } = useQuery(q.activity(wsId));
  const seen = useSyncExternalStore(subscribeSeen, () => getSeen(wsId), () => "");
  const unread = events.filter((e) => e.at > seen).length;

  return (
    <M.Root
      modal={false}
      onOpenChange={(open) => {
        if (!open && events[0]) setSeen(wsId, events[0].at);
      }}
    >
      <M.Trigger asChild>
        <button
          type="button"
          data-press=""
          className="relative inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
        >
          <Bell aria-hidden className="size-[18px]" />
          <span className="sr-only">{unread > 0 ? `Notifications, ${unread} new` : "Notifications"}</span>
          {unread > 0 && (
            <span
              aria-hidden
              className="pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg ring-2 ring-bg"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </M.Trigger>
      <M.Portal>
        <M.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="panel-raised z-50 w-[min(92vw,380px)] p-0 outline-none"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <M.Label className="text-sm font-semibold text-fg">Activity</M.Label>
            <span className="text-[12px] text-fg-muted">Last 14 days</span>
          </div>
          <M.Group aria-label="Recent events" className="max-h-[min(70vh,420px)] overflow-y-auto p-1.5 scrollbar-thin">
            {/* Loading and empty states are disabled items, so the menu always has valid children. */}
            {isLoading && (
              <M.Item disabled className="block px-3 py-6 text-center text-sm text-fg-muted outline-none">
                Loading activity…
              </M.Item>
            )}
            {!isLoading && events.length === 0 && (
              <M.Item disabled className="block px-4 py-8 text-center outline-none">
                <span className="block text-sm font-medium text-fg">Nothing new yet</span>
                <span className="mt-1 block text-[13px] text-fg-muted">
                  Teammates&rsquo; stage changes, AI scores, logged calls and overdue follow-ups show up here.
                </span>
              </M.Item>
            )}
            {events.map((e) => {
              const { icon: Icon, tone } = activityIcons[e.type];
              const isNew = e.at > seen;
              return (
                <M.Item
                  key={e.id}
                  onSelect={() => router.push(e.href)}
                  className="flex cursor-pointer gap-3 rounded-md px-2.5 py-2.5 outline-none data-[highlighted]:bg-sunken"
                >
                  <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug text-fg">
                      {e.title}
                      {isNew && <span className="sr-only"> (new)</span>}
                    </p>
                    {e.detail && <p className="mt-0.5 truncate text-[12.5px] text-fg-muted">{e.detail}</p>}
                    <p className="mt-0.5 text-[12px] text-fg-muted">
                      {timeAgo(new Date(e.at))}
                    </p>
                  </div>
                  {isNew && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent-text" />}
                </M.Item>
              );
            })}
          </M.Group>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
