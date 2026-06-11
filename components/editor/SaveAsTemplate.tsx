"use client";

import { useState, useTransition } from "react";
import { LayoutTemplate } from "lucide-react";
import { saveDashboardAsTemplateAction } from "@/lib/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveAsTemplate({ dashboardId }: { dashboardId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (form: HTMLFormElement) => {
    setError(null);
    setSuccess(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await saveDashboardAsTemplateAction(dashboardId, fd);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setSuccess("Als Vorlage gespeichert.");
        form.reset();
        setOpen(false);
      }
    });
  };

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <LayoutTemplate className="mr-1.5 h-4 w-4" /> Als Vorlage speichern
        </Button>
        {success && <span className="text-xs text-success">{success}</span>}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-2"
    >
      <div className="space-y-1">
        <Label className="text-xs">Vorlagen-Name</Label>
        <Input name="name" required className="h-9 w-48" placeholder="z.B. Shop-Übersicht" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Kategorie</Label>
        <Input name="category" className="h-9 w-36" placeholder="z.B. Shop" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Beschreibung</Label>
        <Input name="description" className="h-9 w-56" placeholder="optional" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Speichern…" : "Speichern"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Abbrechen
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
