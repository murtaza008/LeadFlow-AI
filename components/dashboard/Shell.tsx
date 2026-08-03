"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useCurrentWorkspace();

  useEffect(() => {
    if (!isLoading && data === null) {
      router.push("/onboarding");
    }
  }, [isLoading, data, router]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="eyebrow animate-soft-pulse text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper text-foreground">
      <Sidebar workspaceName={data.name} plan={data.plan} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
