"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, ViewTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import * as D from "@radix-ui/react-dialog";
import { Sidebar } from "./Sidebar";
import { AppBar } from "./AppBar";
import { navItems } from "./nav";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { SheetContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/primitives";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

// Loaded on first open (Ctrl/Cmd+K or the search button), not with every page.
const loadPalette = () => import("./CommandPalette");
const CommandPalette = dynamic(() => loadPalette().then((m) => m.CommandPalette), { ssr: false });

const noop = () => () => {};
function useIsMac() {
  return useSyncExternalStore(
    noop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: ws, isLoading } = useCurrentWorkspace();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Mount (and download) the palette only once someone asks for it.
  const [paletteUsed, setPaletteUsed] = useState(false);
  const openSearch = useCallback(() => {
    setPaletteUsed(true);
    setSearchOpen(true);
  }, []);
  const isMac = useIsMac();

  useEffect(() => {
    if (!isLoading && ws === null) router.push("/onboarding");
  }, [isLoading, ws, router]);

  // After sign-in, preload every page's code while the browser is idle.
  useEffect(() => {
    if (!ws) return;
    const prefetch = () => {
      navItems.forEach((n) => router.prefetch(n.href));
      void loadPalette();
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetch, 1200);
    return () => clearTimeout(t);
  }, [ws, router]);

  // Ctrl/Cmd+K opens the command palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteUsed(true);
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    // Drop cached workspace data so the next account in this tab never sees it.
    queryClient.clear();
    router.push("/");
    router.refresh();
  }, [queryClient, router]);

  if (isLoading || !ws) return <ShellSkeleton />;

  return (
    // The rail colour is painted on the whole first column, so it runs the full height of long pages.
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--rail)_248px,transparent_248px)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-sm font-medium text-fg shadow-md focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh bg-rail lg:block">
        <Sidebar ws={ws} onSignOut={handleSignOut} />
      </aside>

      <D.Root open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent title="Navigation" className="border-rail-border bg-rail [&>button]:text-rail-muted [&>button]:hover:bg-rail-hover [&>button]:hover:text-rail-fg">
          <Sidebar ws={ws} onNavigate={() => setNavOpen(false)} onSignOut={handleSignOut} previews={false} />
        </SheetContent>
      </D.Root>

      <div className="flex min-w-0 flex-col">
        {ws.isDemo && <DemoBanner />}
        <AppBar
          ws={ws}
          isMac={isMac}
          onOpenNav={() => setNavOpen(true)}
          onOpenSearch={openSearch}
          onWarmSearch={() => void loadPalette()}
        />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
            <div>{children}</div>
          </ViewTransition>
        </main>
      </div>

      {paletteUsed && (
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading workspace">
      <div className="hidden h-dvh bg-rail p-4 lg:block">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-6 h-12 w-full" />
        <div className="mt-6 space-y-2.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-7" style={{ width: `${70 - (i % 3) * 12}%` }} />
          ))}
        </div>
      </div>
      <div>
        <div className="flex h-14 items-center border-b border-border px-5">
          <Skeleton className="mx-auto h-9 w-80 max-w-[60%]" />
        </div>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <Skeleton className="h-8 w-64" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
