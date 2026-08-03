"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckSquare,
  BarChart3,
  UsersRound,
  CreditCard,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/follow-ups", label: "Follow-ups", icon: CheckSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ workspaceName, plan }: { workspaceName: string; plan: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-dark bg-growth md:flex">
      <Link href="/dashboard" className="flex h-16 items-center gap-2 border-b border-border-dark px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint text-[13px] font-800 text-growth">
          L
        </span>
        <span className="font-display text-[15px] font-700 text-leaf">LeadFlow AI</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-500 transition-colors ${
                active ? "bg-mint/10 text-mint" : "text-fog hover:bg-white/5 hover:text-leaf"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border-dark px-5 py-4">
        <p className="eyebrow text-fog truncate">{workspaceName}</p>
        <p className="mt-0.5 text-[12px] capitalize text-fog/70">{plan.toLowerCase()} plan</p>
      </div>
    </aside>
  );
}
