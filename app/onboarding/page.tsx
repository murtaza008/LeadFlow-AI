"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { Button } from "@/components/ui/button";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: ws, isLoading } = useCurrentWorkspace();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && ws) router.push("/dashboard");
  }, [isLoading, ws, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not create the workspace.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create the workspace.");
      setLoading(false);
    }
  }

  return (
    <CenteredPage>
      <form onSubmit={onSubmit} className="panel p-8">
        <p className="eyebrow">Step 1 of 1</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight text-fg">Name your workspace</h1>
        <p className="mt-2 text-[14.5px] text-fg-muted">
          Your leads, pipeline and follow-ups live here. Use your company or team name; you can change it later.
        </p>
        <label htmlFor="ws-name" className="mt-6 block text-[13px] font-medium text-fg">
          Workspace name
        </label>
        <input
          id="ws-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Sales"
          required
          minLength={2}
          maxLength={80}
          className="input-field mt-1.5 h-11 text-[15px]"
        />
        {err && (
          <p role="alert" className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-[13.5px] text-danger-text">
            {err}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={loading || name.trim().length < 2}>
          {loading && <Loader2 aria-hidden className="animate-spin" />}
          {loading ? "Creating…" : "Create workspace"}
        </Button>
        <p className="mt-4 text-[12.5px] text-fg-muted">Next: add your first lead and score it with AI.</p>
      </form>
    </CenteredPage>
  );
}
