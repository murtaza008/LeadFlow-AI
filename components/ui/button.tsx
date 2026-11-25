import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const primary =
  "bg-accent text-accent-fg hover:bg-accent-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.14),var(--shadow-xs)]";
const secondary =
  "bg-surface text-fg border border-border hover:border-border-strong hover:bg-surface-2 shadow-[inset_0_1px_0_var(--highlight),var(--shadow-xs)]";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none " +
    "transition-[background-color,border-color,color,box-shadow] duration-150 " +
    "disabled:opacity-55 disabled:pointer-events-none aria-disabled:opacity-55 aria-disabled:pointer-events-none " +
    "[&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary,
        secondary,
        ghost: "text-fg-muted hover:text-fg hover:bg-sunken",
        inverse: "bg-inverse text-inverse-fg hover:opacity-90",
        danger: "bg-danger text-danger-fg hover:opacity-90",
        "danger-ghost": "text-danger-text hover:bg-danger-soft",
        link: "text-accent-text underline underline-offset-4 hover:decoration-2 px-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-md",
        md: "h-9 px-3.5 text-sm rounded-md",
        lg: "h-11 px-5 text-[15px] rounded-lg",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

/**
 * `data-press` opts the element into the global press feedback (a 0.97 scale
 * run with the Web Animations API on pointer input only; see lib/press.ts).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      data-press=""
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
