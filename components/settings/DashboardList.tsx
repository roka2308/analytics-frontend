"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createDashboardAction,
  deleteDashboardAction,
  renameDashboardAction,
  setDefaultDashboardAction,
} from "@/lib/actions/dashboards";
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
import { Star, StarOff, ExternalLink, Pencil, Trash2 } from "lucide-react";

interface Dashboard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface Props {
  dashboards: Dashboard[];
}

export function DashboardList({ dashboards }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>("kpi-basics");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreate = (formData: FormData) => {
    reset();
    formData.set("template", template);
    startTransition(async () => {
      const r = await createDashboardAction(formData);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess(`Dashboard angelegt (${r.data?.slug ?? ""}).`);
        (document.getElementById("add-dashboard-form") as HTMLFormElement)?.reset();
        setTemplate("kpi-basics");
      }
    });
  };

  const handleRename = (id: string) => {
    reset();
    startTransition(async () => {
      const r = await renameDashboardAction(id, editName, editDesc || null);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Dashboard aktualisiert.");
        setEditingId(null);
      }
    });
  };

  const handleSetDefault = (id: string) => {
    reset();
    startTransition(async () => {
      const r = await setDefaultDashboardAction(id);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Standard-Dashboard geändert.");
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Dashboard "${name}" wirklich löschen?`)) return;
    reset();
    startTransition(async () => {
      const r = await deleteDashboardAction(id);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Dashboard gelöscht.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vorhandene Dashboards</CardTitle>
          <CardDescription>
            Lege beliebig viele Dashboards an. Eines ist immer als Standard markiert
            und wird beim Aufruf der Domain angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Dashboards.</p>
          ) : (
            <div className="divide-y divide-border">
              {dashboards.map((d) => (
                <div key={d.id} className="py-3">
                  {editingId === d.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Beschreibung (optional)"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRename(d.id)}
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
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {d.name}
                          {d.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent-text">
                              <Star className="h-3 w-3 fill-current" /> Standard
                            </span>
                          )}
                        </p>
                        {d.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {d.description}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                          /dashboards/{d.slug}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={`/dashboards/${d.slug}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Öffnen"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Öffnen
                        </Link>
                        {!d.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetDefault(d.id)}
                            disabled={isPending}
                            title="Als Standard markieren"
                          >
                            <StarOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(d.id);
                            setEditName(d.name);
                            setEditDesc(d.description ?? "");
                            reset();
                          }}
                          disabled={isPending}
                          title="Umbenennen"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(d.id, d.name)}
                          disabled={isPending}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Löschen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neues Dashboard anlegen</CardTitle>
          <CardDescription>
            Du kannst leer starten oder eines der mitgelieferten Templates nutzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="add-dashboard-form" action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="db-name">Name</Label>
                <Input
                  id="db-name"
                  name="name"
                  type="text"
                  placeholder="z.B. Kampagnen-Übersicht"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="db-template">Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger id="db-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Leer (keine Widgets)</SelectItem>
                    <SelectItem value="kpi-basics">KPI-Grundlage (4 KPI-Karten)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="db-description">Beschreibung (optional)</Label>
                <Input
                  id="db-description"
                  name="description"
                  type="text"
                  placeholder="z.B. Wöchentliche Übersicht für die GF"
                />
              </div>
            </div>

            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Anlegen…" : "Dashboard anlegen"}
              </Button>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                {success}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
