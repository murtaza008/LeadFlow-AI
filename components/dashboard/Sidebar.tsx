"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { buttonVariants } from "@/components/ui/button";
import { navGroups, isActive, type NavItem } from "./nav";
import { AccountMenu } from "./UserMenu";
import { q, prefetchers } from "@/lib/queries";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { cn } from "@/lib/utils";

export const planLabel = { FREE: "Starter", TEAM: "Team", AGENCY: "Agency" } as const;
export const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

type Box = { y: number; h: number };

/**
 * The app's navigation: a dark graphite rail in both themes. Primary action
 * on top, grouped pages with live hover previews, account at the bottom.
 */
export function Sidebar({
  ws,
  onNavigate,
  onSignOut,
  previews = true,
}: {
  ws: CurrentWorkspace;
  onNavigate?: () => void;
  onSignOut: () => void;
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
    <div className="flex h-full flex-col bg-rail text-rail-fg">
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-rail-accent"
          aria-label="LeadFlow AI, today"
        >
          <LogoMark />
          <span className="font-display text-[16px] font-semibold tracking-[-0.02em]">
            LeadFlow<span className="text-rail-muted"> AI</span>
          </span>
        </Link>
      </div>

      <div className="px-3 pt-1">
        <Link
          href="/leads?new=1"
          onClick={onNavigate}
          data-press=""
          className={buttonVariants({ variant: "primary", className: "w-full justify-start" })}
        >
          <Plus aria-hidden /> Add a lead
        </Link>
      </div>

      <nav
        ref={navRef}
        aria-label="Main"
        className="relative mt-5 flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin"
        onPointerLeave={() => setHover(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(null);
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 rounded-md bg-rail-hover transition-[transform,height,opacity] duration-200 ease-[var(--ease-out-expo)]"
          style={{
            transform: `translateY(${hover?.y ?? active?.y ?? 0}px)`,
            height: hover?.h ?? 0,
            opacity: hover ? 1 : 0,
          }}
        />
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 rounded-md bg-rail-active transition-[transform,height] duration-300 ease-[var(--ease-out-expo)]"
            style={{ transform: `translateY(${active.y}px)`, height: active.h }}
          >
            <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-rail-accent" />
          </span>
        )}

        {navGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <div className="px-2.5 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-rail-muted">{group.label}</div>
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
                      disabled={!previews}
                      trigger={
                        <Link
                          href={item.href}
                          aria-current={on ? "page" : undefined}
                          onClick={onNavigate}
                          onPointerEnter={(e) => onEnter(e, item)}
                          onFocus={(e) => onEnter(e, item)}
                          className={cn(
                            "relative z-10 flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors duration-150 focus-visible:outline-rail-accent",
                            on ? "font-medium text-rail-fg" : "text-rail-muted hover:text-rail-fg",
                          )}
                        >
                          <Icon aria-hidden className={cn("size-4 shrink-0", on && "text-rail-accent")} />
                          <span className="flex-1">{item.label}</span>
                          {overdue > 0 && (
                            <span className="rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-5 text-danger-fg">
                              {overdue}
                              <span className="sr-only"> overdue</span>
                            </span>
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

      <div className="border-t border-rail-border p-2">
        <AccountMenu ws={ws} onSignOut={onSignOut} members={summary?.members} />
      </div>
    </div>
  );
}
