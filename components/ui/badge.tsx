import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-600 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        mint: "bg-mint-dim text-mint",
        ember: "bg-ember-dim text-ember",
        amber: "bg-[color-mix(in_oklab,var(--color-amber)_15%,transparent)] text-amber",
        danger: "bg-[color-mix(in_oklab,var(--color-danger)_15%,transparent)] text-danger",
        outline: "border border-border text-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
