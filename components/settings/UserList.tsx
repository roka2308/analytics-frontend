"use client";

import { useState, useTransition } from "react";
import { createUserAction, deleteUserAction } from "@/lib/actions/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  createdAt: Date;
}

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    formData.set("role", role);
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (!result.ok) setError(result.error ?? "Unbekannter Fehler");
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
      const result = await deleteUserAction(userId);
      if (!result.ok) setError(result.error ?? "Unbekannter Fehler");
      else setSuccess("Nutzer entfernt.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nutzerkonten</CardTitle>
          <CardDescription>
            Wer hat Zugriff auf das Dashboard? Admins können Nutzer und Sites verwalten,
            Viewer sehen nur das Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {u.name ?? u.email}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-slate-400">(du)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {u.email} · {u.role === "admin" ? "Admin" : "Viewer"}
                  </p>
                </div>
                {u.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(u.id, u.email)}
                    disabled={isPending}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Löschen
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Nutzer anlegen</CardTitle>
          <CardDescription>
            Du legst Passwort und Rolle fest. Der Nutzer kann sein Passwort später selbst ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <Label htmlFor="user-role">Rolle</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "admin" | "viewer")}>
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (nur Dashboard)</SelectItem>
                    <SelectItem value="admin">Admin (alles verwalten)</SelectItem>
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
