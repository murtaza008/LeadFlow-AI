import {
  BarChart3,
  CalendarClock,
  CreditCard,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceSummary } from "@/lib/workspace-summary";
import type { PrefetchName } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** What the page is for, shown in the hover card and the command palette. */
  description: string;
  /** Live numbers for the hover card, built from the workspace summary. */
  stats?: (s: WorkspaceSummary) => { label: string; value: string }[];
  /** Data the page reads first; prefetched when the nav item is hovered. */
  prefetch?: PrefetchName[];
  keywords?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

const n = (v: number) => v.toLocaleString("en-US");

export const navGroups: NavGroup[] = [
  {
    label: "Sell",
    items: [
      {
        href: "/dashboard",
        label: "Today",
        icon: LayoutDashboard,
        description: "Who to call today, what's overdue and how the pipeline is moving.",
        stats: (s) => [
          { label: "Hot leads still open", value: n(s.leads.hotOpen) },
          { label: "Follow-ups due today", value: n(s.followUps.dueToday) },
          { label: "Overdue", value: n(s.followUps.overdue) },
        ],
        prefetch: ["leads", "followups"],
        keywords: "home dashboard focus overview",
      },
      {
        href: "/leads",
        label: "Leads",
        icon: Users,
        description: "Every lead with its AI score. Search, filter and open a profile.",
        stats: (s) => [
          { label: "All leads", value: n(s.leads.total) },
          { label: "Open", value: n(s.leads.open) },
          { label: "Added this week", value: n(s.leads.newThisWeek) },
        ],
        prefetch: ["leads"],
        keywords: "contacts prospects people companies",
      },
      {
        href: "/pipeline",
        label: "Pipeline",
        icon: KanbanSquare,
        description: "Drag deals between stages. Moving a lead runs the follow-up rules.",
        stats: (s) => [
          { label: "Open pipeline value", value: formatCurrency(s.leads.openValue) },
          { label: "Qualified", value: n(s.leads.byStage.QUALIFIED) },
          { label: "Won", value: n(s.leads.byStage.WON) },
        ],
        prefetch: ["leads"],
        keywords: "kanban board stages deals",
      },
      {
        href: "/follow-ups",
        label: "Follow-ups",
        icon: CalendarClock,
        description: "Calls, emails and tasks the automations scheduled, by due date.",
        stats: (s) => [
          { label: "Overdue", value: n(s.followUps.overdue) },
          { label: "Due today", value: n(s.followUps.dueToday) },
          { label: "Upcoming", value: n(s.followUps.upcoming) },
        ],
        prefetch: ["followups"],
        keywords: "tasks reminders calls emails todo",
      },
    ],
  },
  {
    label: "Understand",
    items: [
      {
        href: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Funnel, lead sources, score spread and weekly wins.",
        stats: (s) => {
          const closed = s.leads.byStage.WON + s.leads.byStage.LOST;
          return [
            { label: "Won", value: n(s.leads.byStage.WON) },
            { label: "Lost", value: n(s.leads.byStage.LOST) },
            {
              label: "Win rate (closed deals)",
              value: closed ? `${Math.round((s.leads.byStage.WON / closed) * 100)}%` : "No closed deals",
            },
          ];
        },
        prefetch: ["analytics"],
        keywords: "reports charts metrics funnel",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        href: "/team",
        label: "Team",
        icon: UsersRound,
        description: "Who's in the workspace, their roles and pending invites.",
        stats: (s) => [
          { label: "Members", value: n(s.members) },
          { label: "Pending invites", value: n(s.pendingInvites) },
        ],
        prefetch: ["members", "invites"],
        keywords: "members invite people roles",
      },
      {
        href: "/billing",
        label: "Billing",
        icon: CreditCard,
        description: "Your plan and payment details.",
        keywords: "plan upgrade subscription stripe",
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        description: "Workspace name and brand colour.",
        keywords: "preferences workspace brand colour",
      },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
