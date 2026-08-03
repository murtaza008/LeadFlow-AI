"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useMembers, useInvites, useSendInvite } from "@/lib/hooks/use-team";
import { initials } from "@/lib/format";

export default function TeamPage() {
  const { data: workspace } = useCurrentWorkspace();
  const { data: members = [], isLoading } = useMembers(workspace?.id);
  const { data: invites = [] } = useInvites(workspace?.id);
  const canInvite = workspace?.role === "OWNER" || workspace?.role === "ADMIN";

  return (
    <>
      <Topbar
        title="Team"
        action={canInvite && <InviteDialog workspaceId={workspace?.id} />}
      />
      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-[15px] font-700 text-foreground">Members</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar>
                    <AvatarFallback>{initials(m.user.displayName ?? m.user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-600 text-foreground">
                      {m.user.displayName ?? m.user.email}
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground">{m.user.email}</p>
                  </div>
                  <span className="eyebrow text-mint">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {invites.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-[15px] font-700 text-foreground">Pending invites</h2>
            </div>
            <ul className="divide-y divide-border">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-[14px] text-foreground">{i.email}</span>
                  <span className="eyebrow text-muted-foreground">{i.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function InviteDialog({ workspaceId }: { workspaceId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const send = useSendInvite(workspaceId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await send.mutateAsync({ email: email.trim(), role });
      toast.success(`Invite sent to ${email.trim()}`);
      setEmail("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send invite");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
          />
          <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
