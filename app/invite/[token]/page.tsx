"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/primitives";

type InviteInfo = {
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  workspaceName: string;
  accepted: boolean;
  expired: boolean;
};

const ROLE = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("This invite link doesn't exist. Ask for a new one.");
        return res.json() as Promise<InviteInfo>;
      })
      .then(setInvite)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Invite not found"));
  }, [token]);

  // After signing in or up, AuthForm sends the visitor back here.
  useEffect(() => {
    if (status === "unauthenticated") sessionStorage.setItem("pending_invite_token", token);
  }, [status, token]);

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not accept the invite");
      }
      toast.success(`You joined ${invite?.workspaceName}`);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept the invite");
      setAccepting(false);
    }
  }

  return (
    <CenteredPage>
      <div className="panel p-8">
        {error ? (
          <>
            <h1 className="text-[24px] font-semibold text-fg">Invite not found</h1>
            <p className="mt-2 text-[14.5px] text-fg-muted">{error}</p>
            <Link href="/" className={buttonVariants({ className: "mt-6" })}>
              Home page
            </Link>
          </>
        ) : !invite ? (
          <div aria-busy="true">
            <h1 className="sr-only">Loading invite</h1>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-3 h-4 w-72" />
            <Skeleton className="mt-6 h-11 w-full" />
          </div>
        ) : (
          <>
            <p className="eyebrow">Team invite</p>
            <h1 className="mt-2 text-[26px] font-semibold leading-tight text-fg">Join {invite.workspaceName}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-fg-muted">
              For <span className="font-medium text-fg">{invite.email}</span>
              <Badge tone="accent">{ROLE[invite.role]}</Badge>
            </p>
            {invite.accepted ? (
              <p className="mt-6 text-[14px] text-fg-muted">This invite has already been used.</p>
            ) : invite.expired ? (
              <p className="mt-6 text-[14px] text-fg-muted">This invite has expired. Ask the person who sent it for a new link.</p>
            ) : status === "authenticated" ? (
              <Button variant="primary" size="lg" className="mt-6 w-full" onClick={accept} disabled={accepting}>
                {accepting && <Loader2 aria-hidden className="animate-spin" />}
                {accepting ? "Joining…" : "Accept invite"}
              </Button>
            ) : (
              <div className="mt-6 space-y-3">
                <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "lg", className: "w-full" })}>
                  Create an account to join
                </Link>
                <p className="text-center text-[13.5px] text-fg-muted">
                  Already have one?{" "}
                  <Link href="/login" className="prose-link">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </CenteredPage>
  );
}
