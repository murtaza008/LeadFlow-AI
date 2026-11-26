"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Menu as MenuIcon, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Kbd } from "@/components/ui/primitives";
import { Notifications } from "./Notifications";
import { navItems, isActive } from "./nav";
import { q } from "@/lib/queries";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { cn } from "@/lib/utils";

/** The app's top bar: breadcrumb and search on the left; today's follow-ups, notifications and theme on the right. */
export function AppBar({
  ws,
  onOpenNav,
  onOpenSearch,
  onWarmSearch,
  isMac,
}: {
  ws: CurrentWorkspace;
  onOpenNav: () => void;
  onOpenSearch: () => void;
  /** Hover/focus on the search button: start downloading the palette. */
  onWarmSearch: () => void;
  isMac: boolean;
}) {
  const pathname = usePathname();
  const current = navItems.find((n) => isActive(pathname, n.href));
  const sub = /^\/leads\/[^/]+/.test(pathname) ? "Profile" : null;
  const { data: summary } = useQuery(q.summary(ws.id));
  const due = summary ? summary.followUps.dueToday + summary.followUps.overdue : null;
  const late = (summary?.followUps.overdue ?? 0) > 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-3 shadow-[var(--shadow-xs)] sm:px-5">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        data-press=""
        className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg lg:hidden"
      >
        <MenuIcon className="size-[18px]" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 shrink-0 items-center gap-1.5 text-[13.5px] md:flex">
        <span className="max-w-40 truncate text-fg-muted">{ws.name}</span>
        {current && (
          <>
            <span aria-hidden className="text-fg-subtle">/</span>
            <span className={sub ? "text-fg-muted" : "font-medium text-fg"} aria-current={sub ? undefined : "page"}>
              {current.label}
            </span>
          </>
        )}
        {sub && (
          <>
            <span aria-hidden className="text-fg-subtle">/</span>
            <span className="font-medium text-fg" aria-current="page">
              {sub}
            </span>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        onPointerEnter={onWarmSearch}
        onFocus={onWarmSearch}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className="flex h-9 w-full max-w-[19rem] items-center gap-2.5 rounded-md bg-sunken px-3 text-[13.5px] text-fg-muted transition-colors hover:text-fg max-md:ml-auto max-sm:size-9 max-sm:justify-center max-sm:px-0 md:ml-4"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 text-left max-sm:sr-only">Search leads or jump to…</span>
        <span className="flex gap-1 max-sm:hidden" aria-hidden>
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1 max-md:ml-0">
        {due !== null && (
          <Link
            href="/follow-ups"
            className={cn(
              "mr-1 hidden h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors sm:inline-flex",
              late
                ? "border-danger-soft bg-danger-soft text-danger-text hover:border-danger-text"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            <CalendarClock aria-hidden className="size-3.5" />
            {due === 0 ? "Nothing due today" : `${due} follow-up${due === 1 ? "" : "s"} due`}
            {late && <span className="sr-only">, some overdue</span>}
          </Link>
        )}
        <Notifications wsId={ws.id} />
        <ThemeToggle className="max-sm:hidden" />
      </div>
    </header>
  );
}
