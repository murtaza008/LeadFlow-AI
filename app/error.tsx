"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { Button, buttonVariants } from "@/components/ui/button";

/** Shown when a page crashes. Says what happened and offers a retry. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <CenteredPage>
      <div className="panel p-8">
        <p className="font-mono text-[13px] text-danger-text">Something broke</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight text-fg">This page hit an error</h1>
        <p className="mt-2 text-[14.5px] text-fg-muted">
          Your data is safe. Try again, and if it keeps happening, reload the page.
          {error.digest && <span className="mt-2 block font-mono text-[12px]">Reference: {error.digest}</span>}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>
            Go to Today
          </Link>
        </div>
      </div>
    </CenteredPage>
  );
}
