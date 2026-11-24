"use client";

import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const subscribe = () => () => {};
/** True only after hydration; the theme is unknown on the server. */
function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Switches theme, revealing the new one in a circle that grows from `origin`
 * (View Transitions API). Falls back to an instant switch without support or
 * with reduced motion.
 */
export function switchTheme(choice: ThemeChoice, setTheme: (t: string) => void, origin?: HTMLElement | null) {
  const root = document.documentElement;
  const next = resolve(choice);
  const apply = () => {
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    setTheme(choice);
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = root.classList.contains("dark") ? "dark" : "light";
  if (!document.startViewTransition || reduced || current === next) {
    apply();
    return;
  }

  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
  const y = rect ? rect.top + rect.height / 2 : 32;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  root.dataset.themeSwitching = "";
  const transition = document.startViewTransition(() => flushSync(apply));
  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  transition.finished.finally(() => delete root.dataset.themeSwitching);
}

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * Light / dark / system as a compact segmented radio group. No popover
 * library, so it is cheap enough for the public pages too.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current: ThemeChoice = hydrated ? ((theme as ThemeChoice | undefined) ?? "system") : "system";

  function choose(i: number) {
    const opt = options[i];
    refs.current[i]?.focus();
    switchTheme(opt.value, setTheme, refs.current[i]);
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    choose((i + step + options.length) % options.length);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-2 p-0.5", className)}
    >
      {options.map((o, i) => {
        const on = current === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            tabIndex={on ? 0 : -1}
            data-press=""
            onClick={() => choose(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full transition-colors duration-150",
              on ? "bg-surface text-fg shadow-[inset_0_1px_0_var(--highlight),var(--shadow-xs)] ring-1 ring-border" : "text-fg-subtle hover:text-fg",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
