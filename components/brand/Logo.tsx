import { cn } from "@/lib/utils";

/**
 * LeadFlow mark: three bars getting shorter, a ranked list read top-down.
 * The highest-scoring lead sits at the top.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6 shrink-0", className)}>
      <rect width="24" height="24" rx="6" fill="var(--accent)" />
      <rect x="5.5" y="6.5" width="13" height="2.6" rx="1.3" fill="var(--accent-fg)" />
      <rect x="5.5" y="10.7" width="9.5" height="2.6" rx="1.3" fill="var(--accent-fg)" opacity="0.82" />
      <rect x="5.5" y="14.9" width="6" height="2.6" rx="1.3" fill="var(--accent-fg)" opacity="0.64" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-[16px] font-semibold tracking-[-0.02em] text-fg">
        LeadFlow<span className="text-fg-subtle"> AI</span>
      </span>
    </span>
  );
}
