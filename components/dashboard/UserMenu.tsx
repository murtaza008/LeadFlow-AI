"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronsUpDown, CreditCard, LogOut, Settings, Users } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Badge } from "@/components/ui/primitives";
import type { CurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;
const planLabel = { FREE: "Starter", TEAM: "Team", AGENCY: "Agency" } as const;

/** Account and workspace block at the foot of the sidebar; opens the account menu upward. */
export function AccountMenu({
  ws,
  onSignOut,
  members,
}: {
  ws: CurrentWorkspace;
  onSignOut: () => void;
  members?: number;
}) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? null;
  const email = session?.user?.email ?? "";
  const display = name ?? email.split("@")[0];

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          data-press=""
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-rail-hover focus-visible:outline-rail-accent"
        >
          <span
            aria-hidden
            className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-rail-active text-[12px] font-semibold text-rail-fg"
          >
            {initials(display || "?")}
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-[3px] ring-2 ring-rail"
              style={{ background: ws.brandColor }}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-rail-fg">{display || "Account"}</span>
            <span className="block truncate text-[11.5px] text-rail-muted">
              {ws.name} · {roleLabel[ws.role]}
            </span>
          </span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-rail-muted" />
          <span className="sr-only">, account menu</span>
        </button>
      </MenuTrigger>
      <MenuContent side="top" align="start" className="w-[calc(var(--radix-dropdown-menu-trigger-width)+8px)] min-w-60">
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="truncate text-sm font-medium text-fg">{display}</p>
          <p className="truncate text-[12.5px] text-fg-muted">{email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{roleLabel[ws.role]}</Badge>
            <Badge tone="neutral">{planLabel[ws.plan]} plan</Badge>
            {members !== undefined && <Badge tone="outline">{members} members</Badge>}
          </div>
        </div>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/settings">
            <Settings /> Workspace settings
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
