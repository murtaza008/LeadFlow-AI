import { cn } from "@/lib/utils";

/** Loading placeholder. Prefer `Skeleton` from ./primitives in new code. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} {...props} />;
}

export { Skeleton };
