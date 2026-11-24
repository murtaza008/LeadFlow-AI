"use client";

import * as M from "@radix-ui/react-dropdown-menu";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Non-modal: the rest of the page is never aria-hidden while focus is still reachable. */
export function Menu(props: ComponentProps<typeof M.Root>) {
  return <M.Root modal={false} {...props} />;
}
export const MenuTrigger = M.Trigger;
export const MenuGroup = M.Group;
export const MenuRadioGroup = M.RadioGroup;

export function MenuContent({
  children,
  className,
  align = "end",
  ...props
}: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className={cn("panel-raised z-50 min-w-52 p-1 text-sm outline-none", className)}
        {...props}
      >
        {children}
      </M.Content>
    </M.Portal>
  );
}

const item =
  "relative flex h-8 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-[13.5px] text-fg outline-none " +
  "data-[highlighted]:bg-sunken data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-fg-subtle";

export function MenuItem({ className, ...props }: ComponentProps<typeof M.Item>) {
  return <M.Item className={cn(item, className)} {...props} />;
}

export function MenuRadioItem({ className, children, ...props }: ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem className={cn(item, "pr-8", className)} {...props}>
      {children}
      <M.ItemIndicator className="absolute right-2.5 size-1.5 rounded-full bg-accent-text" />
    </M.RadioItem>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <M.Label className="px-2.5 pb-1 pt-2 eyebrow">{children}</M.Label>;
}

export function MenuSeparator() {
  return <M.Separator className="-mx-1 my-1 h-px bg-border" />;
}
