"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type InviteInfo = {
  email: string;
  role: string;
  workspaceName: string;
  accepted: boolean;
  expired: boolean;
};

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
        if (!res.ok) throw new Error("Invite not found");
        return res.json();
      })
      .then(setInvite)
      .catch((e) => setError(e instanceof Error ? e.message : "Invite not found"));
  }, [token]);

  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("pending_invite_token", token);
    }
  }, [status, token]);

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not accept invite");
      }
      toast.success(`You joined ${invite?.workspaceName}`);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invite");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-growth text-[15px] font-800 text-leaf">
          L
        </span>

        {error && <p className="mt-6 text-danger">{error}</p>}

        {!error && !invite && <p className="mt-6 text-muted-foreground">Loading invite…</p>}

        {invite && (
          <>
            <h1 className="mt-6 font-display text-2xl font-700 text-foreground">
              Join {invite.workspaceName}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Invited as <span className="font-600 text-foreground">{invite.email}</span> ·{" "}
              {invite.role.toLowerCase()}
            </p>

            {invite.accepted ? (
              <p className="mt-6 text-[13px] text-muted-foreground">This invite was already used.</p>
            ) : invite.expired ? (
              <p className="mt-6 text-[13px] text-muted-foreground">This invite has expired.</p>
            ) : status === "authenticated" ? (
              <button
                onClick={accept}
                disabled={accepting}
                className="mt-6 w-full rounded-md bg-mint px-5 py-3 text-[15px] font-600 text-growth transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {accepting ? "Joining…" : "Accept invite"}
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="w-full rounded-md bg-mint px-5 py-3 text-[15px] font-600 text-growth transition-all hover:-translate-y-0.5"
                >
                  Create account to accept
                </Link>
                <Link href="/login" className="text-[13px] text-muted-foreground hover:text-mint">
                  Already have an account? Sign in
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
