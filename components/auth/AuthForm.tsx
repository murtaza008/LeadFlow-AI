"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import { TryDemoButton } from "./TryDemoButton";

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const demoUnavailable = useSearchParams().get("demo") === "unavailable";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextDestination() {
    const pending =
      typeof window !== "undefined" ? sessionStorage.getItem("pending_invite_token") : null;
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
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not create your account.");
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Incorrect email or password.");
      router.push(nextDestination());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-paper md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-growth p-10 text-leaf md:flex">
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint text-[13px] font-800 text-growth">
            L
          </span>
          <span className="font-display text-lg font-700">LeadFlow AI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative z-10"
        >
          <p className="eyebrow text-mint">30-day result</p>
          <p className="mt-3 font-display text-3xl font-700 leading-tight">
            127 unscored leads → 8 hot → 3 closed.
          </p>
          <p className="mono-data mt-4 text-[12px] text-fog">
            AI scoring sorted the pipeline in minutes, not weeks.
          </p>
        </motion.div>

        <div className="relative z-10 font-mono text-[11px] text-fog/60">
          © 2026 LeadFlow AI
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-mint) 0%, transparent 45%), radial-gradient(circle at 85% 80%, var(--color-ember) 0%, transparent 40%)",
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="mb-10 flex items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-growth text-[13px] font-800 text-leaf">
              L
            </span>
            <span className="font-display text-lg font-700 text-foreground">LeadFlow AI</span>
          </Link>

          <p className="eyebrow text-mint">{isSignup ? "Free forever · No card" : "Welcome back"}</p>
          <h1 className="mt-3 font-display text-4xl font-700 leading-tight text-foreground">
            {isSignup ? "Start scoring leads." : "Sign in to LeadFlow AI."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isSignup
              ? "Your first scored pipeline in under five minutes."
              : "Pick up right where you left off."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <Field label="Your name" value={name} onChange={setName} type="text" placeholder="Ada Lovelace" autoComplete="name" />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
            />
            {error && (
              <div className="rounded-md border border-danger/30 bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-mint px-5 py-3 text-[15px] font-600 text-growth transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_var(--color-mint)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "One sec…" : isSignup ? "Create account →" : "Sign in →"}
            </button>
          </form>

          {!isSignup && (
            <>
              <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <TryDemoButton
                label="Try demo, no sign-up"
                className="w-full rounded-md border border-border bg-card px-5 py-3 text-[15px] font-600 text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-mint"
              />
              {demoUnavailable && (
                <p className="mt-2 text-center text-[13px] text-danger">
                  The demo is unavailable right now. Please try again in a minute.
                </p>
              )}
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to LeadFlow AI? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-600 text-mint hover:underline"
            >
              {isSignup ? "Sign in" : "Get started free"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="input-field mt-1.5 py-2.5 text-foreground placeholder:text-muted-foreground"
      />
    </label>
  );
}
