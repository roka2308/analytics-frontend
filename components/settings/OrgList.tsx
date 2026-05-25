"use client";

import { useState, useTransition } from "react";
import {
  createOrgAction,
  deleteOrgAction,
  renameOrgAction,
} from "@/lib/actions/organizations";
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

interface Org {
  id: string;
  name: string;
}

interface Props {
  orgs: Org[];
}

export function OrgList({ orgs }: Props) {
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
      const r = await createOrgAction(formData);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Organisation angelegt.");
        (document.getElementById("add-org-form") as HTMLFormElement)?.reset();
      }
    });
  };

  const handleRename = (orgId: string) => {
    reset();
    startTransition(async () => {
      const r = await renameOrgAction(orgId, editName);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Name aktualisiert.");
        setEditingId(null);
      }
    });
  };

  const handleDelete = (orgId: string, name: string) => {
    if (!confirm(`Organisation "${name}" wirklich löschen?`)) return;
    reset();
    startTransition(async () => {
      const r = await deleteOrgAction(orgId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Organisation gelöscht.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organisationen</CardTitle>
          <CardDescription>
            Z.B. eine Organisation pro Beratungskunde. Jede Org hat ihre eigenen Sites und Nutzer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine Organisationen vorhanden.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {orgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between py-3">
                  {editingId === org.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRename(org.id)}
                          disabled={isPending}
                        >
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
                      <p className="text-sm font-medium text-slate-900">{org.name}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(org.id);
                            setEditName(org.name);
                            reset();
                          }}
                          disabled={isPending}
                        >
                          Umbenennen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(org.id, org.name)}
                          disabled={isPending}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
          <CardTitle>Neue Organisation anlegen</CardTitle>
          <CardDescription>
            Lege eine Organisation für einen weiteren Kunden / Mandanten an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="add-org-form" action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  name="name"
                  type="text"
                  placeholder="z.B. Kunde XY GmbH"
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
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
