import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

/** Logo bar + one centred panel: onboarding, invites and the 404 page. */
export function CenteredPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-md" aria-label="LeadFlow AI home">
          <LogoMark />
          <span className="font-display text-[16px] font-semibold tracking-[-0.02em] text-fg">
            LeadFlow<span className="text-fg-subtle"> AI</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
        <div className="rise w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
