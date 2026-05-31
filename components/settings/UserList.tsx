"use client";

import { useState, useTransition } from "react";
import {
  createUserAction,
  deleteUserAction,
  reassignUserOrgAction,
} from "@/lib/actions/users";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "viewer";
  organizationId: string | null;
  orgName: string;
}

interface Org {
  id: string;
  name: string;
}

interface Props {
  users: UserRow[];
  orgs: Org[];
  currentUserId: string;
}

export function UserList({ users, orgs, currentUserId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [selectedOrg, setSelectedOrg] = useState<string>(orgs[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    formData.set("role", role);
    formData.set("organizationId", selectedOrg);
    startTransition(async () => {
      const r = await createUserAction(formData);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Nutzer angelegt.");
        (document.getElementById("add-user-form") as HTMLFormElement)?.reset();
        setRole("viewer");
      }
    });
  };

  const handleDelete = (userId: string, email: string) => {
    if (!confirm(`Konto "${email}" wirklich löschen?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await deleteUserAction(userId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Nutzer entfernt.");
    });
  };

  const handleReassign = (userId: string, orgId: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await reassignUserOrgAction(userId, orgId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Organisation aktualisiert.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nutzerkonten</CardTitle>
          <CardDescription>
            Admins verwalten alles. Viewer sehen nur die Sites ihrer eigenen Organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {u.name ?? u.email}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">(du)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.role === "admin" ? "Admin" : "Viewer"} ·{" "}
                    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                      {u.orgName}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {u.role === "viewer" && (
                    <Select
                      value={u.organizationId ?? ""}
                      onValueChange={(v) => handleReassign(u.id, v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Org wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgs.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {u.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={isPending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Nutzer anlegen</CardTitle>
          <CardDescription>
            Du legst Passwort, Rolle und Organisation fest. Der Nutzer kann sein Passwort später selbst ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-sm text-warning">
              Lege zuerst eine Organisation an, dann kannst du Nutzer anlegen.
            </p>
          ) : (
            <form id="add-user-form" action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Name (optional)</Label>
                  <Input id="user-name" name="name" type="text" placeholder="Max Mustermann" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">E-Mail</Label>
                  <Input
                    id="user-email"
                    name="email"
                    type="email"
                    required
                    placeholder="kunde@firma.de"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-password">Passwort (min. 8 Zeichen)</Label>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-org">Organisation</Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger id="user-org">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="user-role">Rolle</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "admin" | "viewer")}>
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer (sieht nur Sites der eigenen Org)</SelectItem>
                      <SelectItem value="admin">Admin (sieht und verwaltet alles)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Anlegen…" : "Nutzer anlegen"}
                </Button>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              {success && (
                <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                  {success}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
