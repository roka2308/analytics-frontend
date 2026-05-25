"use client";

import { useState, useTransition } from "react";
import { addSiteAction, removeSiteAction } from "@/lib/actions/sites";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Site {
  id: string;
  matomoSiteId: number;
  label: string;
}

interface Props {
  sites: Site[];
}

export function SiteList({ sites }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await addSiteAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Unbekannter Fehler");
      } else {
        setSuccess("Website hinzugefügt.");
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
            Alle Matomo-Sites, die im Dashboard ausgewählt werden können.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-slate-400">
              Noch keine Website verknüpft. Füge unten die erste hinzu.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{site.label}</p>
                    <p className="text-xs text-slate-500">
                      Matomo Site-ID: {site.matomoSiteId}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(site.id, site.label)}
                    disabled={isPending}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
            Die Matomo Site-ID findest du in Matomo unter Administration → Websites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="add-site-form"
            action={handleAdd}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-[140px_1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="matomoSiteId">Matomo Site-ID</Label>
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
                  placeholder="z.B. Kunde XY – Hauptwebsite"
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
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
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
