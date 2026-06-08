"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Copy, Check } from "lucide-react";
import { createUserAction, inviteUserAction } from "@/lib/actions/users";
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
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const invite = (form: HTMLFormElement) => {
    setError(null);
    setInviteUrl(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await inviteUserAction(fd);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setInviteUrl(r.inviteUrl ?? null);
        form.reset();
        setPw("");
        setAdding(false);
        router.refresh();
      }
    });
  };

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQ && matchRole;
  });

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

      {inviteUrl && (
        <div className="mx-3 mb-2 rounded-md border border-accent/30 bg-accent/5 p-2">
          <p className="mb-1 text-xs font-medium text-foreground">
            Einladungslink (kopieren & an den Nutzer senden):
          </p>
          <div className="flex items-center gap-1">
            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded border border-input bg-background px-2 py-1 font-mono text-[11px] text-foreground"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* ignore */
                }
              }}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setInviteUrl(null)}
            className="mt-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Schließen
          </button>
        </div>
      )}

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
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "…" : "Anlegen"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={(e) => {
                const form = (e.currentTarget as HTMLElement).closest("form");
                if (form) invite(form as HTMLFormElement);
              }}
            >
              Einladen
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {users.length > 5 && (
        <div className="space-y-2 px-4 pb-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nutzer suchen…"
            className="h-8"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">Alle Rollen</option>
            <option value="admin">Admin</option>
            <option value="creator">Creator</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {users.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Noch keine Nutzer.</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Keine Treffer.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((u) => {
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
