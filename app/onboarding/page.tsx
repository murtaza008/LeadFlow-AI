"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

const ease = [0.16, 1, 0.3, 1] as const;

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
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create workspace.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create workspace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-growth text-[13px] font-800 text-leaf">
            L
          </span>
          <span className="font-display text-lg font-700">LeadFlow AI</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="w-full max-w-lg"
        >
          <p className="eyebrow text-mint">Workspace</p>
          <h1 className="mt-3 font-display text-4xl font-700 leading-tight text-foreground sm:text-5xl">
            Name your workspace.
          </h1>
          <p className="mt-3 text-muted-foreground">
            This is where your leads, pipeline, and team will live.
          </p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Sales"
            required
            minLength={2}
            className="input-field mt-8 py-3 text-lg"
          />
          {err && <p className="mt-3 text-sm text-danger">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-md bg-mint px-6 py-3 text-[15px] font-600 text-growth transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_var(--color-mint)] disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Creating…" : "Enter dashboard →"}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
