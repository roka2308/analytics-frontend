"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createUserAction } from "@/lib/actions/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./PasswordField";
import { cn } from "@/lib/utils";

interface UserVM {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function UserSidebarList({ users }: { users: UserVM[] }) {
  const pathname = usePathname();
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
      const r = await createUserAction(fd);
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Nutzer</h2>
        <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create(e.currentTarget);
          }}
          className="space-y-2 px-4 pb-3"
        >
          <div className="space-y-1">
            <Label htmlFor="nu-email" className="text-xs">E-Mail</Label>
            <Input id="nu-email" name="email" type="email" required className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nu-name" className="text-xs">Name (optional)</Label>
            <Input id="nu-name" name="name" type="text" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Passwort</Label>
            <PasswordField name="password" value={pw} onChange={setPw} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nu-role" className="text-xs">Rolle</Label>
            <select id="nu-role" name="role" className={selectClass} defaultValue="viewer">
              <option value="viewer">Viewer</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "…" : "Anlegen"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {users.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Noch keine Nutzer.</p>
        ) : (
          <ul className="space-y-0.5">
            {users.map((u) => {
              const active = pathname === `/zugriffe/${u.id}`;
              return (
                <li key={u.id}>
                  <Link
                    href={`/zugriffe/${u.id}`}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent/10 font-medium text-accent-text"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span className="block truncate">{u.name ?? u.email}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {u.email} · {u.role}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
