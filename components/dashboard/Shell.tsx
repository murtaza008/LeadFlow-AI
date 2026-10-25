"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { DEMO_BANNER_MESSAGE } from "@/lib/demo";

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
      <main className="flex min-w-0 flex-1 flex-col">
        {data.isDemo && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-mint/30 bg-mint-dim px-4 py-2 text-center text-[13px] text-foreground">
            <span className="inline-flex items-center gap-1.5 font-600">
              <Info className="h-3.5 w-3.5 text-mint" />
              {DEMO_BANNER_MESSAGE}
            </span>
            <Link href="/signup" className="font-600 text-mint hover:underline">
              Create your own free account →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
