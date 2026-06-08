"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { createCustomerUserAction, deleteUserAction } from "@/lib/actions/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./PasswordField";

interface UserVM {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function CustomerUsersManager({
  customerId,
  users,
}: {
  customerId: string;
  users: UserVM[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectClass =
    "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  const create = (form: HTMLFormElement) => {
    setError(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await createCustomerUserAction(customerId, fd);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        form.reset();
        setPw("");
        setAdding(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Diesem Kunden sind noch keine Nutzer zugeordnet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{u.name ?? u.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.role}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/zugriffe/${u.id}`}>
                    <KeyRound className="mr-1 h-3.5 w-3.5" /> Rechte
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Nutzer "${u.email}" löschen?`))
                      startTransition(async () => {
                        const r = await deleteUserAction(u.id);
                        if (!r.ok) setError(r.error ?? "Fehler");
                        else router.refresh();
                      });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create(e.currentTarget);
          }}
          className="space-y-3 rounded-md border border-border p-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">E-Mail</Label>
              <Input id="cu-email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Name (optional)</Label>
              <Input id="cu-name" name="name" type="text" />
            </div>
            <div className="space-y-1.5">
              <Label>Passwort</Label>
              <PasswordField name="password" value={pw} onChange={setPw} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-role">Rolle</Label>
              <select id="cu-role" name="role" className={selectClass} defaultValue="viewer">
                <option value="viewer">Viewer</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Anlegen…" : "Nutzer anlegen"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Nutzer für diesen Kunden
        </Button>
      )}
      {!adding && error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
