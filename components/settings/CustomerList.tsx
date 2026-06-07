"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createCustomerAction,
  deleteCustomerAction,
  renameCustomerAction,
} from "@/lib/actions/customers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  slug: string;
  projectCount?: number;
}

interface Props {
  customers: Customer[];
}

export function CustomerList({ customers }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreate = (formData: FormData) => {
    reset();
    startTransition(async () => {
      const r = await createCustomerAction(formData);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Kunde angelegt.");
        (document.getElementById("add-customer-form") as HTMLFormElement)?.reset();
      }
    });
  };

  const handleRename = (id: string) => {
    reset();
    startTransition(async () => {
      const r = await renameCustomerAction(id, editName);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Name aktualisiert.");
        setEditingId(null);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Kunde "${name}" wirklich löschen?`)) return;
    reset();
    startTransition(async () => {
      const r = await deleteCustomerAction(id);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Kunde gelöscht.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kunden</CardTitle>
          <CardDescription>
            Oberste Ebene. Ein Kunde bündelt mehrere Projekte, eigene Nutzer und
            sein Branding (Logo + Farben), das alle Projekte erben.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Kunden vorhanden.</p>
          ) : (
            <div className="divide-y divide-border">
              {customers.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  {editingId === c.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRename(c.id)} disabled={isPending}>
                          Speichern
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          disabled={isPending}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/kunden/${c.slug}`}
                          className="text-sm font-medium text-foreground hover:text-accent-text"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {c.projectCount ?? 0} Projekt(e) · /kunden/{c.slug}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/kunden/${c.slug}`}>Öffnen</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.name);
                            reset();
                          }}
                          disabled={isPending}
                        >
                          Umbenennen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={isPending}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Löschen
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Kunden anlegen</CardTitle>
          <CardDescription>
            Der URL-Slug wird automatisch aus dem Namen abgeleitet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="add-customer-form" action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="customer-name">Kundenname</Label>
                <Input
                  id="customer-name"
                  name="name"
                  type="text"
                  placeholder="z.B. Telekom Deutschland GmbH"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Anlegen…" : "Anlegen"}
                </Button>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{success}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
