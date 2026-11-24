"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreditCard, LogOut, Settings, Users } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Badge } from "@/components/ui/primitives";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

export function UserMenu({ ws, onSignOut }: { ws: CurrentWorkspace; onSignOut: () => void }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? null;
  const email = session?.user?.email ?? "";

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          data-press=""
          className="ml-1 flex size-8 items-center justify-center rounded-full border border-border bg-surface-2 text-[12px] font-semibold text-fg shadow-[inset_0_1px_0_var(--highlight)] transition-colors hover:border-border-strong"
        >
          <span aria-hidden>{initials(name ?? email)}</span>
          <span className="sr-only">Account menu</span>
        </button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="truncate text-sm font-medium text-fg">{name ?? email.split("@")[0]}</p>
          <p className="truncate text-[12.5px] text-fg-muted">{email}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge tone="accent">{roleLabel[ws.role]}</Badge>
            <span className="truncate text-[12px] text-fg-muted">in {ws.name}</span>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/team">
            <Users /> Team
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/billing">
            <CreditCard /> Billing
          </Link>
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={onSignOut}>
          <LogOut /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
