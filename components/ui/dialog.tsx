"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlay =
  "fixed inset-0 z-50 bg-[rgba(10,12,15,0.42)] data-[state=open]:animate-[fade-in_160ms_ease-out] dark:bg-[rgba(0,0,0,0.62)]";

const closeButton =
  "flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-sunken hover:text-fg";

/**
 * Centered dialog. Pass `title` (and optionally `description`) to get the
 * standard header; screen readers announce the title. Without `title`, the
 * children must include a <DialogTitle>.
 */
export function DialogContent({
  title,
  description,
  children,
  className,
  hideClose,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "panel-raised fixed left-1/2 top-[10vh] z-50 max-h-[84vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-y-auto p-0 outline-none scrollbar-thin",
          "data-[state=open]:animate-[pop-in_220ms_var(--ease-out-expo)]",
          title === undefined && "p-5",
          className,
        )}
        {...(description || title === undefined ? {} : { "aria-describedby": undefined })}
      >
        {title !== undefined && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <D.Title className="text-base font-semibold text-fg">{title}</D.Title>
              {description && <D.Description className="mt-0.5 text-[13px] text-fg-muted">{description}</D.Description>}
            </div>
            {!hideClose && (
              <D.Close aria-label="Close" className={cn(closeButton, "-mr-1.5 -mt-0.5")}>
                <X className="size-4" />
              </D.Close>
            )}
          </div>
        )}
        {title === undefined && !hideClose && (
          <D.Close aria-label="Close" className={cn(closeButton, "absolute right-3 top-3")}>
            <X className="size-4" />
          </D.Close>
        )}
        {children}
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: D.DialogTitleProps) {
  return <D.Title className={cn("text-base font-semibold text-fg", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: D.DialogDescriptionProps) {
  return <D.Description className={cn("text-[13px] text-fg-muted", className)} {...props} />;
}

/** Side sheet (mobile navigation, record previews). */
export function SheetContent({
  title,
  description,
  side = "left",
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(92vw,22rem)] flex-col border-border bg-surface shadow-lg outline-none",
          side === "left"
            ? "left-0 border-r data-[state=open]:animate-[sheet-left_280ms_var(--ease-out-expo)]"
            : "right-0 border-l data-[state=open]:animate-[sheet-right_280ms_var(--ease-out-expo)]",
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <D.Title className="sr-only">{title}</D.Title>
        {description && <D.Description className="sr-only">{description}</D.Description>}
        <D.Close aria-label="Close" className={cn(closeButton, "absolute right-3 top-3 z-10")}>
          <X className="size-4" />
        </D.Close>
        {children}
      </D.Content>
    </D.Portal>
  );
}
