"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import * as D from "@radix-ui/react-dialog";
import { CornerDownLeft, LogOut, Monitor, Moon, Plus, Search, Sun, UserRound } from "lucide-react";
import { navItems } from "./nav";
import { q } from "@/lib/queries";
import { Kbd } from "@/components/ui/primitives";
import { switchTheme } from "@/components/theme-toggle";
import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type Cmd = {
  id: string;
  group: "Pages" | "Leads" | "Actions";
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
};

function score(c: Cmd, query: string) {
  if (!query) return 1;
  const label = c.label.toLowerCase();
  if (label.startsWith(query)) return 3;
  if (label.includes(query)) return 2;
  if ((c.keywords ?? "").toLowerCase().includes(query) || (c.hint ?? "").toLowerCase().includes(query)) return 1;
  return 0;
}

export function CommandPalette({
  open,
  onOpenChange,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { data: leads } = useQuery({ ...q.leads(), enabled: open });

  const commands = useMemo<Cmd[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      ...navItems.map((n) => ({
        id: `page-${n.href}`,
        group: "Pages" as const,
        label: n.label,
        hint: n.description,
        icon: n.icon,
        keywords: n.keywords,
        run: go(n.href),
      })),
      ...(leads ?? []).map((l) => ({
        id: `lead-${l.id}`,
        group: "Leads" as const,
        label: l.name,
        hint: [l.company, `score ${l.score}`, statusLabel[l.status]].filter(Boolean).join(" · "),
        icon: UserRound,
        keywords: `${l.company ?? ""} ${l.title ?? ""} ${l.email ?? ""} ${l.source ?? ""}`,
        run: go(`/leads/${l.id}`),
      })),
      { id: "add-lead", group: "Actions", label: "Add a lead", icon: Plus, keywords: "new create contact", run: go("/leads?new=1") },
      { id: "theme-light", group: "Actions", label: "Use light theme", icon: Sun, keywords: "appearance", run: () => switchTheme("light", setTheme) },
      { id: "theme-dark", group: "Actions", label: "Use dark theme", icon: Moon, keywords: "appearance", run: () => switchTheme("dark", setTheme) },
      { id: "theme-system", group: "Actions", label: "Use system theme", icon: Monitor, keywords: "appearance", run: () => switchTheme("system", setTheme) },
      { id: "sign-out", group: "Actions", label: "Sign out", icon: LogOut, keywords: "logout", run: onSignOut },
    ];
  }, [leads, router, setTheme, onSignOut]);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: score(c, needle) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    // Without a query, keep each group short.
    const perGroup = needle ? 8 : 6;
    const counts: Record<string, number> = {};
    return scored
      .filter(({ c }) => (counts[c.group] = (counts[c.group] ?? 0) + 1) <= perGroup)
      .map((r) => r.c);
  }, [commands, needle]);

  const grouped = useMemo(() => {
    const order: Cmd["group"][] = ["Pages", "Leads", "Actions"];
    return order
      .map((g) => ({ group: g, items: results.filter((r) => r.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [results]);
  const flat = grouped.flatMap((g) => g.items);
  const activeIndex = Math.min(index, Math.max(flat.length - 1, 0));
  const active = flat[activeIndex];

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function run(c: Cmd | undefined) {
    if (!c) return;
    onOpenChange(false);
    c.run();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((activeIndex + 1) % Math.max(flat.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((activeIndex - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    }
  }

  return (
    <D.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setQuery("");
          setIndex(0);
        }
      }}
    >
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[rgba(10,12,13,0.42)] dark:bg-[rgba(0,0,0,0.6)]" />
        <D.Content
          aria-describedby={undefined}
          className="panel-raised fixed left-1/2 top-[10vh] z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden p-0 outline-none data-[state=open]:animate-[pop-in_200ms_var(--ease-out-expo)]"
        >
          <D.Title className="sr-only">Search and commands</D.Title>
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search aria-hidden className="size-4 shrink-0 text-fg-subtle" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={active ? `cmdk-${active.id}` : undefined}
              aria-autocomplete="list"
              aria-label="Search pages, leads and actions"
              placeholder="Search pages, leads, companies…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIndex(0);
              }}
              onKeyDown={onKey}
              className="h-12 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            />
            <Kbd>Esc</Kbd>
          </div>

          <div ref={listRef} id="cmdk-list" role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {flat.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-fg-muted">
                Nothing matches &ldquo;{query}&rdquo;. Try a page, a lead&rsquo;s name or a company.
              </p>
            )}
            {grouped.map((g) => (
              <div key={g.group} role="group" aria-labelledby={`cmdk-g-${g.group}`} className="mb-1.5 last:mb-0">
                <div id={`cmdk-g-${g.group}`} className="eyebrow px-2.5 pb-1 pt-2">
                  {g.group}
                </div>
                {g.items.map((c) => {
                  const i = flat.indexOf(c);
                  const on = i === activeIndex;
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.id}
                      id={`cmdk-${c.id}`}
                      role="option"
                      aria-selected={on}
                      data-index={i}
                      onPointerMove={() => i !== activeIndex && setIndex(i)}
                      onClick={() => run(c)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px]",
                        on ? "bg-sunken text-fg" : "text-fg-muted",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", on ? "text-accent-text" : "text-fg-subtle")} />
                      <span className="shrink-0 font-medium text-fg">{c.label}</span>
                      {c.hint && <span className="ml-auto min-w-0 truncate pl-3 text-[12.5px] text-fg-muted">{c.hint}</span>}
                      {on && <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-fg-subtle" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[12px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> move
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Enter</Kbd> open
            </span>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
