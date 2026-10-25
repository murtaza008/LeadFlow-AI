"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateLead, useUpdateLead, type Lead } from "@/lib/hooks/use-leads";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useMembers } from "@/lib/hooks/use-team";

const UNASSIGNED = "none";

const EMPTY_FORM = {
  name: "",
  company: "",
  title: "",
  email: "",
  phone: "",
  source: "",
  value: "",
  notes: "",
  owner: "",
};

function formFrom(lead: Lead): typeof EMPTY_FORM {
  return {
    name: lead.name,
    company: lead.company ?? "",
    title: lead.title ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    source: lead.source ?? "",
    value: lead.value ? String(lead.value) : "",
    notes: lead.notes ?? "",
    owner: lead.assignedToId ?? UNASSIGNED,
  };
}

/** Add a lead, or edit one when `lead` is given. */
export function LeadFormDialog({ trigger, lead }: { trigger: ReactNode; lead?: Lead }) {
  const editing = Boolean(lead);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const create = useCreateLead();
  const update = useUpdateLead();
  const { data: workspace } = useCurrentWorkspace();
  const { data: members = [] } = useMembers(workspace?.id);
  const pending = create.isPending || update.isPending;

  function set<K extends keyof typeof form>(key: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  function onOpenChange(next: boolean) {
    if (next) setForm(lead ? formFrom(lead) : EMPTY_FORM);
    setOpen(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (lead) {
        await update.mutateAsync({
          id: lead.id,
          patch: {
            name: form.name.trim(),
            company: form.company.trim() || null,
            title: form.title.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            source: form.source.trim() || null,
            value: form.value ? Number(form.value) : 0,
            notes: form.notes.trim() || null,
            assignedToId: form.owner && form.owner !== UNASSIGNED ? form.owner : null,
          },
        });
        toast.success("Lead updated");
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          company: form.company.trim() || undefined,
          title: form.title.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          source: form.source.trim() || undefined,
          value: form.value ? Number(form.value) : undefined,
          notes: form.notes.trim() || undefined,
          assignedToId: form.owner || undefined,
        });
        toast.success(`${form.name.trim()} added to leads`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : editing ? "Could not update lead" : "Could not add lead");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit lead" : "Add a lead"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Re-score with AI after editing so the score reflects the new details."
              : "A follow-up is scheduled automatically once the lead is created."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoFocus
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Jordan Blake"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Co"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="VP Sales"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="jordan@acme.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 0100"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="Referral"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="value">Deal value ($)</Label>
              <Input
                id="value"
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="15000"
                className="mt-1.5"
              />
            </div>
            {members.length > 1 && (
              <div className="col-span-2">
                <Label>Owner</Label>
                <Select value={form.owner || undefined} onValueChange={(v) => set("owner", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Assign to me" />
                  </SelectTrigger>
                  <SelectContent>
                    {editing && <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>}
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.displayName ?? m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Context that helps the AI score this lead well…"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {editing ? (pending ? "Saving…" : "Save changes") : pending ? "Adding…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
