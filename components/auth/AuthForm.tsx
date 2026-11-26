"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { CalendarClock, Eye, EyeOff, Gauge, KanbanSquare, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { TryDemoButton } from "@/components/demo/TryDemoButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SCENE_LEADS } from "@/components/landing/scene/leads";

// A real scored lead from the demo workspace, shown as an example.
const EXAMPLE = SCENE_LEADS.find((l) => l.id === "demo-lead-01") ?? SCENE_LEADS[0];

const STEPS = [
  { icon: Gauge, title: "Add a lead, score it with AI", body: "Gemini returns a score from 0 to 100, a tier and the reasons." },
  { icon: KanbanSquare, title: "Work it through the pipeline", body: "New, Contacted, Qualified, Won or Lost. Every move is logged." },
  { icon: CalendarClock, title: "Follow-ups book themselves", body: "A 24-hour email for new leads, a proposal task when qualified." },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const demoUnavailable = useSearchParams().get("demo") === "unavailable";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  function nextDestination() {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("pending_invite_token") : null;
    if (pending) {
      sessionStorage.removeItem("pending_invite_token");
      return `/invite/${pending}`;
    }
    return isSignup ? "/onboarding" : "/dashboard";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not create your account.");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("That email and password don't match an account.");
      router.push(nextDestination());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <main id="main" className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md" aria-label="LeadFlow AI home">
            <LogoMark />
            <span className="font-display text-[16px] font-semibold tracking-[-0.02em] text-fg">
              LeadFlow<span className="text-fg-subtle"> AI</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-[30px] font-semibold leading-tight text-fg">{isSignup ? "Create your account" : "Sign in"}</h1>
          <p className="mt-2 text-[14.5px] text-fg-muted">
            {isSignup ? (
              <>
                Already have one?{" "}
                <Link href="/login" className="prose-link">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to LeadFlow?{" "}
                <Link href="/signup" className="prose-link">
                  Create an account
                </Link>
              </>
            )}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate={false}>
            {isSignup && (
              <div>
                <label htmlFor={`${id}-name`} className="text-[13px] font-medium text-fg">
                  Your name <span className="font-normal text-fg-muted">(optional)</span>
                </label>
                <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input-field mt-1.5" />
              </div>
            )}
            <div>
              <label htmlFor={`${id}-email`} className="text-[13px] font-medium text-fg">
                Work email
              </label>
              <input
                id={`${id}-email`}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor={`${id}-password`} className="text-[13px] font-medium text-fg">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id={`${id}-password`}
                  type={show ? "text" : "password"}
                  required
                  minLength={isSignup ? 8 : undefined}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  aria-describedby={isSignup ? `${id}-pw-hint` : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:text-fg"
                >
                  {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                </button>
              </div>
              {isSignup && (
                <p id={`${id}-pw-hint`} className="mt-1.5 text-[12.5px] text-fg-muted">
                  At least 8 characters.
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13.5px] text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 aria-hidden className="animate-spin" />}
              {isSignup ? (loading ? "Creating your account…" : "Create account") : loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[12.5px] text-fg-muted">
            <span className="h-px flex-1 bg-border" />
            or look around first
            <span className="h-px flex-1 bg-border" />
          </div>
          <TryDemoButton label="Open the live demo" size="lg" className="w-full" />
          {demoUnavailable ? (
            <p role="alert" className="mt-2 text-center text-[13px] text-danger-text">
              The demo isn&rsquo;t available right now. Try again in a minute.
            </p>
          ) : (
            <p className="mt-2 text-center text-[12.5px] text-fg-muted">A shared workspace with sample leads. No sign-up, resets daily.</p>
          )}
        </div>
      </main>

      <aside aria-label="What LeadFlow does" className="hidden flex-col justify-center gap-10 bg-rail px-12 py-10 text-rail-fg lg:flex">
        <ol className="space-y-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rail-active">
                  <Icon aria-hidden className="size-[18px] text-rail-accent" />
                </span>
                <div>
                  <p className="font-mono text-[11px] text-rail-muted">{String(i + 1).padStart(2, "0")}</p>
                  <p className="text-[16px] font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-[14px] text-rail-muted">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <figure className="rounded-xl border border-rail-border bg-rail-hover p-5">
          <figcaption className="font-mono text-[11px] uppercase tracking-[0.06em] text-rail-muted">From the demo workspace</figcaption>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{EXAMPLE.name}</p>
              <p className="text-[13px] text-rail-muted">{EXAMPLE.company}</p>
            </div>
            <span className="font-display text-[30px] font-semibold leading-none text-rail-accent">
              {EXAMPLE.score}
              <span className="sr-only"> out of 100</span>
            </span>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-rail-fg">{EXAMPLE.summary}</p>
        </figure>
      </aside>
    </div>
  );
}
