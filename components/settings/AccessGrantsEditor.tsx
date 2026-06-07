"use client";

import { useMemo, useState, useTransition } from "react";
import { grantAccessAction, revokeGrantAction } from "@/lib/actions/users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ScopeType = "customer" | "project" | "dashboard";
type GrantRole = "viewer" | "creator" | "admin";

interface Target {
  id: string;
  name: string;
}

export interface GrantView {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  label: string;
  role: GrantRole | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Props {
  users: UserRow[];
  targets: { customer: Target[]; project: Target[]; dashboard: Target[] };
  grantsByUser: Record<string, GrantView[]>;
}

const SCOPE_LABEL: Record<ScopeType, string> = {
  customer: "Kunde",
  project: "Projekt",
  dashboard: "Dashboard",
};

export function AccessGrantsEditor({ users, targets, grantsByUser }: Props) {
  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id ?? "");
  const [scopeType, setScopeType] = useState<ScopeType>("dashboard");
  const [scopeId, setScopeId] = useState<string>("");
  const [role, setRole] = useState<GrantRole | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const targetOptions = targets[scopeType] ?? [];
  const currentGrants = useMemo(
    () => grantsByUser[selectedUser] ?? [],
    [grantsByUser, selectedUser],
  );

  const handleAdd = () => {
    setError(null);
    setSuccess(null);
    if (!selectedUser) return setError("Bitte einen Nutzer wählen.");
    if (!scopeId) return setError("Bitte ein Ziel wählen.");
    startTransition(async () => {
      const r = await grantAccessAction({
        userId: selectedUser,
        scopeType,
        scopeId,
        role: role === "" ? null : role,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Zugriff erteilt. Seite neu laden, um ihn in der Liste zu sehen.");
    });
  };

  const handleRevoke = (grantId: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await revokeGrantAction(grantId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Zugriff entzogen. Seite neu laden, um die Liste zu aktualisieren.");
    });
  };

  const selectClass =
    "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zugriffsrechte vergeben</CardTitle>
          <CardDescription>
            Berechtige einen Nutzer auf einen Kunden, ein Projekt oder ein
            einzelnes Dashboard. Lässt du die Rolle leer, gilt die globale Rolle
            des Nutzers im jeweiligen Bereich. Admins haben immer vollen Zugriff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nutzer</Label>
              <select
                className={selectClass}
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email} — {u.role}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="space-y-1.5">
              <Label>Ziel ({SCOPE_LABEL[scopeType]})</Label>
              <select
                className={selectClass}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">— wählen —</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Rolle in diesem Bereich (optional)</Label>
              <select
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value as GrantRole | "")}
              >
                <option value="">Globale Rolle des Nutzers</option>
                <option value="viewer">Viewer</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <Button type="button" onClick={handleAdd} disabled={isPending}>
            {isPending ? "Speichern…" : "Zugriff erteilen"}
          </Button>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{success}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestehende Zugriffe</CardTitle>
          <CardDescription>
            Explizite Zugriffe des oben gewählten Nutzers. (Der implizite Zugriff
            auf das Heim-Projekt wird hier nicht angezeigt.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentGrants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine expliziten Zugriffe für diesen Nutzer.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {currentGrants.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {SCOPE_LABEL[g.scopeType]}: {g.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rolle: {g.role ?? "global"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevoke(g.id)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Entziehen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
