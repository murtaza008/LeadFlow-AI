"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import type { ReactNode } from "react";

export function Topbar({
  title,
  workspaceName,
  action,
}: {
  title: string;
  workspaceName?: string;
  action?: ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="font-display text-[18px] font-700 text-foreground">{title}</h1>
        {workspaceName && <p className="text-[12px] text-muted-foreground">{workspaceName}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[13px] font-700 text-secondary-foreground">
              {initials(workspaceName ?? "W")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{workspaceName ?? "Workspace"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
