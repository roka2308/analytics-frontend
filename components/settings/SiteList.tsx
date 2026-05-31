"use client";

import { useState, useTransition } from "react";
import { addSiteAction, removeSiteAction } from "@/lib/actions/sites";
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

interface SiteRow {
  id: string;
  matomoSiteId: number;
  label: string;
  orgName: string;
}

interface Org {
  id: string;
  name: string;
}

interface Props {
  sites: SiteRow[];
  orgs: Org[];
}

export function SiteList({ sites, orgs }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>(orgs[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const handleAdd = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    formData.set("organizationId", selectedOrg);
    startTransition(async () => {
      const result = await addSiteAction(formData);
      if (!result.ok) setError(result.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Website verknüpft.");
        (document.getElementById("add-site-form") as HTMLFormElement)?.reset();
      }
    });
  };

  const handleRemove = (siteId: string, label: string) => {
    if (!confirm(`Soll "${label}" wirklich entfernt werden?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeSiteAction(siteId);
      if (!result.ok) setError(result.error ?? "Unbekannter Fehler");
      else setSuccess("Website entfernt.");
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verknüpfte Websites</CardTitle>
          <CardDescription>
            Alle Matomo-Sites, gruppiert nach Organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Website verknüpft. Füge unten die erste hinzu.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{site.label}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                        {site.orgName}
                      </span>
                      <span className="ml-2">Matomo Site-ID: {site.matomoSiteId}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(site.id, site.label)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Entfernen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neue Website verknüpfen</CardTitle>
          <CardDescription>
            Wähle Organisation und gib Matomo-Site-ID + Bezeichnung an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-sm text-warning">
              Lege zuerst eine Organisation an, dann kannst du Websites verknüpfen.
            </p>
          ) : (
            <form id="add-site-form" action={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[180px_140px_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="site-org">Organisation</Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger id="site-org">
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
                <div className="space-y-1.5">
                  <Label htmlFor="matomoSiteId">Site-ID</Label>
                  <Input
                    id="matomoSiteId"
                    name="matomoSiteId"
                    type="number"
                    min="1"
                    placeholder="z.B. 2"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label">Bezeichnung</Label>
                  <Input
                    id="label"
                    name="label"
                    type="text"
                    placeholder="z.B. Hauptwebsite"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Hinzufügen…" : "Hinzufügen"}
                  </Button>
                </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
