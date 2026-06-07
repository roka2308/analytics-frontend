"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import { createOrgAction, deleteOrgAction } from "@/lib/actions/organizations";
import { createDashboardInProjectAction, deleteDashboardAction } from "@/lib/actions/dashboards";
import { addDataSourceAction, removeDataSourceAction } from "@/lib/actions/dataSources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ProjectVM {
  id: string;
  name: string;
  slug: string;
  dashboards: { id: string; name: string; slug: string }[];
  dataSources: { id: string; label: string; matomoSiteId: number | null }[];
}

export function ProjectsManager({
  customerId,
  projects,
}: {
  customerId: string;
  projects: ProjectVM[];
}) {
  const router = useRouter();
  const [newProject, setNewProject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Fehler");
      else router.refresh();
    });
  };

  const createProject = () => {
    const fd = new FormData();
    fd.set("name", newProject);
    fd.set("customerId", customerId);
    run(async () => {
      const r = await createOrgAction(fd);
      if (r.ok) setNewProject("");
      return r;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            placeholder="Neues Projekt – Name"
            onKeyDown={(e) => e.key === "Enter" && newProject.trim() && createProject()}
          />
        </div>
        <Button onClick={createProject} disabled={isPending || !newProject.trim()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Projekt
        </Button>
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Projekte für diesen Kunden.</p>
      ) : (
        projects.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Projekt "${p.name}" löschen? (inkl. Dashboards & Datenquellen)`))
                    run(() => deleteOrgAction(p.id));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <DashboardsBlock project={p} isPending={isPending} run={run} />
              <DataSourcesBlock project={p} isPending={isPending} run={run} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function DashboardsBlock({
  project,
  isPending,
  run,
}: {
  project: ProjectVM;
  isPending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dashboards
      </p>
      {project.dashboards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Dashboards.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {project.dashboards.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-sm text-foreground">{d.name}</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/projekte/${project.slug}/dashboards/${d.slug}`}>
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Öffnen
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/projekte/${project.slug}/dashboards/${d.slug}/edit`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Bearbeiten
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Dashboard "${d.name}" löschen?`))
                      run(() => deleteDashboardAction(d.id));
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neues Dashboard – Name"
          className="h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              run(async () => {
                const r = await createDashboardInProjectAction(project.id, name);
                if (r.ok) setName("");
                return r;
              });
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || !name.trim()}
          onClick={() =>
            run(async () => {
              const r = await createDashboardInProjectAction(project.id, name);
              if (r.ok) setName("");
              return r;
            })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Dashboard
        </Button>
      </div>
    </div>
  );
}

function DataSourcesBlock({
  project,
  isPending,
  run,
}: {
  project: ProjectVM;
  isPending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [label, setLabel] = useState("");
  const [siteId, setSiteId] = useState("");

  const add = () => {
    const fd = new FormData();
    fd.set("organizationId", project.id);
    fd.set("type", "matomo");
    fd.set("label", label);
    fd.set("matomoSiteId", siteId);
    run(async () => {
      const r = await addDataSourceAction(fd);
      if (r.ok) {
        setLabel("");
        setSiteId("");
      }
      return r;
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Datenquellen (Matomo)
      </p>
      {project.dataSources.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Datenquellen.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {project.dataSources.map((ds) => (
            <li key={ds.id} className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-sm text-foreground">
                {ds.label}
                {ds.matomoSiteId != null && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    Site #{ds.matomoSiteId}
                  </span>
                )}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Datenquelle "${ds.label}" entfernen?`))
                    run(() => removeDataSourceAction(ds.id));
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Bezeichnung"
          className="h-9"
        />
        <Input
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="Matomo-Site-ID"
          className="h-9 w-36"
          inputMode="numeric"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || !label.trim() || !siteId.trim()}
          onClick={add}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Quelle
        </Button>
      </div>
    </div>
  );
}
