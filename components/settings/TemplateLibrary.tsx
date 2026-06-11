"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Trash2, Plus } from "lucide-react";
import { applyTemplateAction, deleteTemplateAction } from "@/lib/actions/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DangerConfirm } from "./DangerConfirm";

interface TemplateVM {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  widgetCount: number;
}
interface ProjectVM {
  id: string;
  name: string;
  slug: string;
  customerName?: string | null;
}

function groupByCustomer(projects: ProjectVM[]): { customer: string; projects: ProjectVM[] }[] {
  const groups: { customer: string; projects: ProjectVM[] }[] = [];
  const idx = new Map<string, number>();
  for (const p of projects) {
    const c = p.customerName || "Ohne Kunde";
    if (!idx.has(c)) {
      idx.set(c, groups.length);
      groups.push({ customer: c, projects: [] });
    }
    groups[idx.get(c)!].projects.push(p);
  }
  return groups;
}

export function TemplateLibrary({
  templates,
  projects,
  isAdmin,
}: {
  templates: TemplateVM[];
  projects: ProjectVM[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [applyFor, setApplyFor] = useState<string | null>(null);
  const [targetProject, setTargetProject] = useState<string>(projects[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const apply = (templateId: string) => {
    setError(null);
    if (!targetProject) {
      setError("Bitte ein Projekt wählen.");
      return;
    }
    startTransition(async () => {
      const r = await applyTemplateAction(templateId, targetProject);
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        const proj = projects.find((p) => p.id === targetProject);
        if (proj && r.data?.slug) {
          router.push(`/projekte/${proj.slug}/dashboards/${r.data.slug}`);
        } else {
          router.refresh();
        }
      }
    });
  };

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <LayoutTemplate className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Noch keine Vorlagen</p>
        <p className="text-sm text-muted-foreground">
          Speichere ein Dashboard im Editor über „Als Vorlage speichern", um die Library zu füllen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{t.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t.category ? `${t.category} · ` : ""}
                {t.widgetCount} Widget(s)
              </p>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}

              {applyFor === t.id ? (
                <div className="space-y-2">
                  <select
                    value={targetProject}
                    onChange={(e) => setTargetProject(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {groupByCustomer(projects).map((g) => (
                      <optgroup key={g.customer} label={g.customer}>
                        {g.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => apply(t.id)} disabled={isPending || !targetProject}>
                      {isPending ? "Erstelle…" : "Erstellen"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setApplyFor(null)}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => setApplyFor(t.id)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Anwenden
                  </Button>
                  {isAdmin && (
                    <DangerConfirm
                      word={t.name}
                      title={`Vorlage „${t.name}" löschen`}
                      description={<>Die Vorlage wird aus der Library entfernt. Bereits erstellte Dashboards bleiben.</>}
                      onConfirm={async () => {
                        const r = await deleteTemplateAction(t.id);
                        if (r.ok) router.refresh();
                        return r;
                      }}
                      trigger={(open) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={open}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
