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
import { useCreateLead } from "@/lib/hooks/use-leads";

export function LeadFormDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    source: "",
    value: "",
    notes: "",
  });
  const create = useCreateLead();

  function set<K extends keyof typeof form>(key: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        title: form.title.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        source: form.source.trim() || undefined,
        value: form.value ? Number(form.value) : undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success(`${form.name.trim()} added to leads`);
      setForm({ name: "", company: "", title: "", email: "", phone: "", source: "", value: "", notes: "" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add lead");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a lead</DialogTitle>
          <DialogDescription>
            A follow-up is scheduled automatically once the lead is created.
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
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
