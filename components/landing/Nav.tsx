"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Try it" },
  { href: "#inside", label: "Screens" },
  { href: "#pricing", label: "Pricing" },
];

/** Floating pill bar, inset from the page edges. Solid surface, no blur. */
export function Nav() {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border border-border bg-surface pl-4 pr-2 shadow-[inset_0_1px_0_var(--highlight),var(--shadow-md)]">
        <Link href="/" aria-label="LeadFlow AI home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Sections" className="hidden items-center lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-[13.5px] text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          {authed ? (
            <Link href="/dashboard" data-press="" className={buttonVariants({ variant: "primary", size: "sm", className: "rounded-full" })}>
              Open LeadFlow
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden rounded-full sm:inline-flex" })}>
                Sign in
              </Link>
              <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "sm", className: "rounded-full" })}>
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
