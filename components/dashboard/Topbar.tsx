import type { ReactNode } from "react";

/**
 * Page title row for screens that haven't moved to <PageHeader> yet. The app's
 * real top bar (breadcrumb, search, notifications) lives in AppBar.
 */
export function Topbar({
  title,
  action,
}: {
  title: string;
  workspaceName?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-7 sm:px-8">
      <h1 className="text-[26px] font-semibold leading-tight text-fg md:text-[30px]">{title}</h1>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
