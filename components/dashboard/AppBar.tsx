"use client";

import { usePathname } from "next/navigation";
import { Menu as MenuIcon, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Kbd } from "@/components/ui/primitives";
import { Notifications } from "./Notifications";
import { UserMenu } from "./UserMenu";
import { navItems, isActive } from "./nav";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";

/** The app's top bar: breadcrumb, search / command palette, notifications, theme, account. */
export function AppBar({
  ws,
  onOpenNav,
  onOpenSearch,
  onWarmSearch,
  onSignOut,
  isMac,
}: {
  ws: CurrentWorkspace;
  onOpenNav: () => void;
  onOpenSearch: () => void;
  /** Hover/focus on the search button: start downloading the palette. */
  onWarmSearch: () => void;
  onSignOut: () => void;
  isMac: boolean;
}) {
  const pathname = usePathname();
  const current = navItems.find((n) => isActive(pathname, n.href));
  const sub = /^\/leads\/[^/]+/.test(pathname) ? "Profile" : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        data-press=""
        className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg lg:hidden"
      >
        <MenuIcon className="size-[18px]" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13.5px] sm:flex">
        <span className="truncate text-fg-muted">{ws.name}</span>
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

      <div className="flex flex-1 justify-end sm:justify-center">
        <button
          type="button"
          onClick={onOpenSearch}
          onPointerEnter={onWarmSearch}
          onFocus={onWarmSearch}
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          className="flex h-9 w-full max-w-[22rem] items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-[13.5px] text-fg-muted shadow-[inset_0_1px_0_var(--highlight)] transition-colors hover:border-border-strong hover:text-fg max-sm:size-9 max-sm:justify-center max-sm:px-0"
        >
          <Search aria-hidden className="size-4 shrink-0" />
          <span className="flex-1 text-left max-sm:sr-only">Search leads or jump to…</span>
          <span className="flex gap-1 max-sm:hidden" aria-hidden>
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <Notifications wsId={ws.id} />
        <ThemeToggle className="max-sm:hidden" />
        <UserMenu ws={ws} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
