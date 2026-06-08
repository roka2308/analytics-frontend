"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  grantAccessAction,
  revokeGrantAction,
  setUserRoleAction,
  deleteUserAction,
  resetUserPasswordAction,
} from "@/lib/actions/users";
import { PasswordField } from "./PasswordField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ScopeType = "customer" | "project" | "dashboard";
type Role = "viewer" | "creator" | "admin";

interface Target {
  id: string;
  name: string;
}
export interface GrantView {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  label: string;
  role: Role | null;
}
interface UserVM {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const SCOPE_LABEL: Record<ScopeType, string> = {
  customer: "Kunde",
  project: "Projekt",
  dashboard: "Dashboard",
};

export function UserAccessDetail({
  user,
  targets,
  grants,
}: {
  user: UserVM;
  targets: { customer: Target[]; project: Target[]; dashboard: Target[] };
  grants: GrantView[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(user.role as Role);
  const [newPw, setNewPw] = useState("");
  const [scopeType, setScopeType] = useState<ScopeType>("dashboard");
  const [scopeId, setScopeId] = useState("");
  const [grantRole, setGrantRole] = useState<Role | "">("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectClass =
    "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) => {
    setError(null);
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        if (ok) setMsg(ok);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="heading-display text-2xl text-foreground">{user.name ?? user.email}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {msg && <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{msg}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Globale Rolle</CardTitle>
          <CardDescription>
            Admin darf global alles. Creator/Viewer wirken im Rahmen der unten
            vergebenen Zugriffe (bzw. ihres Heim-Projekts).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="w-48 space-y-1.5">
              <Label>Rolle</Label>
              <select
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="viewer">Viewer</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              disabled={isPending || role === user.role}
              onClick={() => run(() => setUserRoleAction(user.id, role), "Rolle gespeichert.")}
            >
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zugriffe</CardTitle>
          <CardDescription>
            Berechtige diesen Nutzer auf einen Kunden, ein Projekt oder ein
            einzelnes Dashboard. Leere Rolle = globale Rolle gilt im Bereich.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine expliziten Zugriffe.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {grants.map((g) => (
                <li key={g.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-foreground">
                    {SCOPE_LABEL[g.scopeType]}: {g.label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({g.role ?? "global"})
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isPending}
                    onClick={() => run(() => revokeGrantAction(g.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Ebene</Label>
              <select
                className={selectClass}
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value as ScopeType);
                  setScopeId("");
                }}
              >
                <option value="dashboard">Dashboard</option>
                <option value="project">Projekt</option>
                <option value="customer">Kunde</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ziel</Label>
              <select
                className={selectClass}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">— wählen —</option>
                {targets[scopeType].map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <select
                className={selectClass}
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value as Role | "")}
              >
                <option value="">global</option>
                <option value="viewer">Viewer</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button
            disabled={isPending || !scopeId}
            onClick={() =>
              run(() => {
                const p = grantAccessAction({
                  userId: user.id,
                  scopeType,
                  scopeId,
                  role: grantRole === "" ? null : grantRole,
                });
                setScopeId("");
                return p;
              }, "Zugriff erteilt.")
            }
          >
            Zugriff erteilen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
          <CardDescription>
            Setzt ein neues Passwort für diesen Nutzer. Generiere am besten ein
            starkes Passwort und teile es dem Nutzer sicher mit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PasswordField value={newPw} onChange={setNewPw} placeholder="Neues Passwort" />
          <Button
            disabled={isPending || newPw.length < 8}
            onClick={() =>
              run(async () => {
                const r = await resetUserPasswordAction(user.id, newPw);
                if (r.ok) setNewPw("");
                return r;
              }, "Passwort gesetzt.")
            }
          >
            Passwort setzen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Nutzer "${user.email}" wirklich löschen?`))
                startTransition(async () => {
                  const r = await deleteUserAction(user.id);
                  if (!r.ok) setError(r.error ?? "Fehler");
                  else router.push("/zugriffe");
                });
            }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Nutzer löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
