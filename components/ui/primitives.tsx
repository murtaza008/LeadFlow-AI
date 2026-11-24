import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Stagger index for `.stagger` children, capped so long lists don't drag. */
export function staggerStyle(i: number): CSSProperties {
  return { "--i": Math.min(i, 15) } as CSSProperties;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...props} />;
}

export function PanelHeader({
  title,
  description,
  action,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-fg">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-sunken text-fg-muted",
  accent: "bg-accent-soft text-accent-text",
  success: "bg-success-soft text-success-text",
  hot: "bg-hot-soft text-hot-text",
  cold: "bg-cold-soft text-cold-text",
  danger: "bg-danger-soft text-danger-text",
  outline: "border border-border text-fg-muted",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-2 px-1 font-mono text-[10.5px] text-fg-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("skeleton", className)} style={style} />;
}

/** Empty state: what goes here, plus one action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted [&_svg]:size-[18px]">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Page title block used at the top of every app screen. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-[26px] font-semibold leading-tight text-fg md:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14.5px] text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
