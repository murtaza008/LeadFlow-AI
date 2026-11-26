"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Info, Loader2, MailPlus, UsersRound } from "lucide-react";
import { PageHeader, Badge, EmptyState, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useInvites, useMembers, useSendInvite, type Invite } from "@/lib/hooks/use-team";
import { q } from "@/lib/queries";
import { formatCurrency, initials } from "@/lib/format";
import { timeAgo } from "@/lib/time";

const ROLE = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;
const ROLE_HELP = {
  OWNER: "Created the workspace. Can invite people, change settings and billing.",
  ADMIN: "Can invite people, change settings and billing.",
  MEMBER: "Works leads, the pipeline and follow-ups.",
} as const;

export default function TeamPage() {
  const { data: ws } = useCurrentWorkspace();
  const membersQ = useMembers(ws?.id);
  const invitesQ = useInvites(ws?.id);
  const leadsQ = useQuery(q.leads());
  const canInvite = ws?.role === "OWNER" || ws?.role === "ADMIN";

  const owned = useMemo(() => {
    const m = new Map<string, { open: number; value: number; won: number }>();
    for (const l of leadsQ.data ?? []) {
      if (!l.assignedToId) continue;
      const o = m.get(l.assignedToId) ?? { open: 0, value: 0, won: 0 };
      if (l.status === "WON") o.won += 1;
      else if (l.status !== "LOST") {
        o.open += 1;
        o.value += l.value;
      }
      m.set(l.assignedToId, o);
    }
    return m;
  }, [leadsQ.data]);

  const members = membersQ.data ?? [];
  const invites = invitesQ.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader eyebrow="Workspace" title="Team" description="Everyone in this workspace sees the same leads, pipeline and follow-ups." />

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="members" className="panel overflow-hidden">
          <h2 id="members" className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-[15px] font-semibold text-fg">
            Members
            <span className="tabular rounded-full bg-sunken px-2 text-[12px] font-medium text-fg-muted">{members.length}</span>
          </h2>
          {membersQ.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <ul className="stagger divide-y divide-border">
              {members.map((m, i) => {
                const name = m.user.displayName?.trim() || m.user.email.split("@")[0];
                const stats = owned.get(m.userId);
                return (
                  <li key={m.id} style={staggerStyle(i)} className="flex items-center gap-3 px-5 py-3">
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[12px] font-semibold text-fg">
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <HoverCard
                        delay="long"
                        trigger={
                          <span tabIndex={0} className="block truncate rounded-sm text-[14px] font-medium text-fg outline-none underline decoration-border-strong decoration-dotted underline-offset-4">
                            {name}
                          </span>
                        }
                      >
                        <p className="font-medium">{name}</p>
                        <p className="text-[13px] text-fg-muted">{ROLE_HELP[m.role]}</p>
                        <HoverStats
                          rows={[
                            { label: "Open deals owned", value: stats ? `${stats.open} · ${formatCurrency(stats.value)}` : "0" },
                            { label: "Deals won", value: stats?.won ?? 0 },
                            { label: "Joined", value: timeAgo(m.createdAt) },
                          ]}
                        />
                      </HoverCard>
                      <p className="truncate text-[12.5px] text-fg-muted">{m.user.email}</p>
                    </div>
                    <Badge tone={m.role === "MEMBER" ? "neutral" : "accent"}>{ROLE[m.role]}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {canInvite && !ws?.isDemo && <InviteForm wsId={ws.id} />}
          {ws?.isDemo && (
            <p className="panel flex gap-2.5 p-4 text-[13.5px] text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
              Inviting people is turned off in the shared demo so it stays the same for every visitor. In your own
              workspace, Owners and Admins invite teammates here.
            </p>
          )}
          {!canInvite && ws && (
            <p className="panel flex gap-2.5 p-4 text-[13.5px] text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
              Only Owners and Admins can invite people. Ask one of them to add a teammate.
            </p>
          )}

          <section aria-labelledby="invites" className="panel p-5">
            <h2 id="invites" className="text-[15px] font-semibold text-fg">
              Pending invites
            </h2>
            {invitesQ.isLoading ? (
              <Skeleton className="mt-3 h-16" />
            ) : invites.length === 0 ? (
              <EmptyState
                className="px-2 py-6"
                icon={<UsersRound />}
                title="No pending invites"
                description={canInvite ? "Invite someone and share the link with them." : "Invites Owners and Admins send show up here."}
              />
            ) : (
              <>
                <p className="mt-1 text-[13px] text-fg-muted">Invites aren&rsquo;t emailed. Copy the link and send it yourself; it works for 14 days.</p>
                <ul className="mt-3 divide-y divide-border">
                  {invites.map((inv) => (
                    <InviteRow key={inv.id} inv={inv} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InviteRow({ inv }: { inv: Invite }) {
  const [copied, setCopied] = useState(false);
  const expired = new Date(inv.expiresAt) < new Date();
  async function copy() {
    if (!inv.token) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Your browser blocked the clipboard.");
    }
  }
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-fg">{inv.email}</p>
        <p className="text-[12.5px] text-fg-muted">
          {ROLE[inv.role]} · {expired ? "expired" : `expires ${timeAgo(inv.expiresAt)}`}
        </p>
      </div>
      {inv.token && !expired && (
        <Button size="sm" onClick={copy} aria-label={`Copy invite link for ${inv.email}`}>
          {copied ? <Check aria-hidden className="text-success-text" /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      )}
    </li>
  );
}

function InviteForm({ wsId }: { wsId: string }) {
  const send = useSendInvite(wsId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await send.mutateAsync({ email: email.trim(), role });
      toast.success(`Invite created for ${email.trim()}`, { description: "Copy its link below and send it to them." });
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the invite");
    }
  }

  return (
    <section aria-labelledby="invite-title" className="panel p-5">
      <h2 id="invite-title" className="text-[15px] font-semibold text-fg">
        Invite a teammate
      </h2>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <div>
          <label htmlFor="invite-email" className="text-[13px] font-medium text-fg">
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="input-field mt-1.5"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { value: "MEMBER", label: "Member" },
              { value: "ADMIN", label: "Admin" },
            ]}
          />
          <Button type="submit" variant="primary" disabled={send.isPending || !email.trim()}>
            {send.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <MailPlus aria-hidden />}
            Create invite
          </Button>
        </div>
        <p className="text-[12.5px] text-fg-muted">{ROLE_HELP[role]}</p>
      </form>
    </section>
  );
}
