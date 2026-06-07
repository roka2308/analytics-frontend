"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { renameCustomerAction, deleteCustomerAction } from "@/lib/actions/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CustomerHeaderActions({
  id,
  name,
  slug,
}: {
  id: string;
  name: string;
  slug: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const r = await renameCustomerAction(id, value);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setEditing(false);
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Kunde "${name}" wirklich löschen? Das entfernt ALLE Projekte, Dashboards und Datenquellen dieses Kunden unwiderruflich.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const r = await deleteCustomerAction(id);
      if (!r.ok) setError(r.error ?? "Fehler");
      else router.push("/kunden");
    });
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-9 max-w-xs text-lg"
              autoFocus
            />
            <Button size="sm" onClick={save} disabled={isPending || !value.trim()}>
              Speichern
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Abbrechen
            </Button>
          </div>
        ) : (
          <>
            <h1 className="heading-display text-2xl text-foreground">{name}</h1>
            <p className="text-sm text-muted-foreground">/kunden/{slug}</p>
          </>
        )}
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>

      {!editing && (
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setValue(name);
              setEditing(true);
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Umbenennen
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isPending}
            onClick={remove}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Löschen
          </Button>
        </div>
      )}
    </div>
  );
}
