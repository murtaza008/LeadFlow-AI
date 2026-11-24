"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/primitives";
import { navGroups, isActive, type NavItem } from "./nav";
import { q, prefetchers } from "@/lib/queries";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { cn } from "@/lib/utils";

export const planLabel = { FREE: "Starter", TEAM: "Team", AGENCY: "Agency" } as const;
export const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

type Box = { y: number; h: number };

export function Sidebar({
  ws,
  onNavigate,
  previews = true,
}: {
  ws: CurrentWorkspace;
  onNavigate?: () => void;
  /** Hover previews; off in the mobile drawer, where there is no hover. */
  previews?: boolean;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Box | null>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const queryClient = useQueryClient();
  const { data: summary } = useQuery(q.summary(ws.id));

  // One sliding highlight for the active page.
  useLayoutEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setActive(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
  }, [pathname]);

  function onEnter(e: React.PointerEvent<HTMLAnchorElement> | React.FocusEvent<HTMLAnchorElement>, item: NavItem) {
    const el = e.currentTarget;
    setHover({ y: el.offsetTop, h: el.offsetHeight });
    for (const name of item.prefetch ?? []) void prefetchers[name](queryClient, ws.id);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-md" aria-label="LeadFlow AI, today">
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <HoverCard
          side="right"
          align="start"
          disabled={previews === false}
          trigger={
            <Link
              href="/settings"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 shadow-[inset_0_1px_0_var(--highlight)] transition-colors hover:border-border-strong"
            >
              <span
                aria-hidden
                className="size-7 shrink-0 rounded-md border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                style={{ background: ws.brandColor }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-fg">{ws.name}</span>
                <span className="block text-[11.5px] text-fg-muted">
                  {planLabel[ws.plan]} plan · {roleLabel[ws.role]}
                </span>
              </span>
            </Link>
          }
        >
          <p className="font-medium">{ws.name}</p>
          <p className="mt-0.5 text-[13px] text-fg-muted">Workspace name, brand colour and plan.</p>
          <HoverStats
            rows={[
              { label: "Plan", value: planLabel[ws.plan] },
              { label: "Your role", value: roleLabel[ws.role] },
              { label: "Members", value: summary ? summary.members : "…" },
            ]}
          />
        </HoverCard>
      </div>

      <nav
        ref={navRef}
        aria-label="Main"
        className="relative mt-4 flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin"
        onPointerLeave={() => setHover(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(null);
        }}
      >
        {/* hover highlight follows the pointer */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 rounded-md bg-sunken transition-[transform,height,opacity] duration-200 ease-[var(--ease-out-expo)]"
          style={{
            transform: `translateY(${hover?.y ?? active?.y ?? 0}px)`,
            height: hover?.h ?? 0,
            opacity: hover ? 1 : 0,
          }}
        />
        {/* active highlight slides between pages */}
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 rounded-md border border-border bg-surface shadow-[inset_0_1px_0_var(--highlight),var(--shadow-xs)] transition-[transform,height] duration-300 ease-[var(--ease-out-expo)]"
            style={{ transform: `translateY(${active.y}px)`, height: active.h }}
          >
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
          </span>
        )}

        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <div className="eyebrow px-2.5 pb-1.5">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const on = isActive(pathname, item.href);
                const Icon = item.icon;
                const stats = summary && item.stats ? item.stats(summary) : null;
                const overdue = item.href === "/follow-ups" ? (summary?.followUps.overdue ?? 0) : 0;
                return (
                  <li key={item.href}>
                    <HoverCard
                      side="right"
                      align="start"
                      width={272}
                      disabled={previews === false}
                      trigger={
                        <Link
                          href={item.href}
                          aria-current={on ? "page" : undefined}
                          onClick={onNavigate}
                          onPointerEnter={(e) => onEnter(e, item)}
                          onFocus={(e) => onEnter(e, item)}
                          className={cn(
                            "relative z-10 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors duration-150",
                            on ? "font-medium text-fg" : "text-fg-muted hover:text-fg",
                          )}
                        >
                          <Icon
                            aria-hidden
                            className={cn("size-4 shrink-0", on ? "text-accent-text" : "text-fg-subtle")}
                          />
                          <span className="flex-1">{item.label}</span>
                          {overdue > 0 && (
                            <Badge tone="danger" className="px-1.5 text-[11px]">
                              {overdue}
                              <span className="sr-only"> overdue</span>
                            </Badge>
                          )}
                        </Link>
                      }
                    >
                      <p className="flex items-center gap-2 font-medium">
                        <Icon aria-hidden className="size-4 text-accent-text" /> {item.label}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{item.description}</p>
                      {stats && <HoverStats rows={stats} />}
                    </HoverCard>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
