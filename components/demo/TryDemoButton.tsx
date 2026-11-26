"use client";

import { useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Posts to /api/demo/login, which signs in to the shared demo account on the
 * server and redirects to the dashboard. A native form POST, so the password
 * never touches the browser and the button works before hydration.
 */
export function TryDemoButton({
  className,
  label = "Try demo",
  variant = "secondary",
  size = "md",
}: {
  className?: string;
  label?: string;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}) {
  const [pending, setPending] = useState(false);
  return (
    <form action="/api/demo/login" method="post" onSubmit={() => setPending(true)} className="contents">
      <button
        type="submit"
        data-press=""
        disabled={pending}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <PlayCircle aria-hidden />}
        {pending ? "Opening demo…" : label}
      </button>
    </form>
  );
}
