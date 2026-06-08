"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Pencil, Star } from "lucide-react";
import {
  createOrgAction,
  deleteOrgAction,
  renameOrgAction,
  moveProjectToCustomerAction,
} from "@/lib/actions/organizations";
import {
  createDashboardInProjectAction,
  deleteDashboardAction,
  renameDashboardAction,
  setDefaultDashboardAction,
} from "@/lib/actions/dashboards";
import {
  addDataSourceAction,
  removeDataSourceAction,
  updateDataSourceAction,
} from "@/lib/actions/dataSources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DangerConfirm } from "./DangerConfirm";

export interface ProjectVM {
  id: string;
  name: string;
  slug: string;
  dashboards: { id: string; name: string; slug: string; isDefault: boolean }[];
  dataSources: { id: string; type: string; label: string; matomoSiteId: number | null }[];
}

export function ProjectsManager({
  customerId,
  projects,
  customers,
}: {
  customerId: string;
  projects: ProjectVM[];
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [newProject, setNewProject] = useState("");
  const [editProjId, setEditProjId] = useState<string | null>(null);
  const [editProjName, setEditProjName] = useState("");
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
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              {editProjId === p.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Input
                    value={editProjName}
                    onChange={(e) => setEditProjName(e.target.value)}
                    className="h-8 max-w-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={isPending || !editProjName.trim()}
                    onClick={() =>
                      run(async () => {
                        const r = await renameOrgAction(p.id, editProjName);
                        if (r.ok) setEditProjId(null);
                        return r;
                      })
                    }
                  >
                    Speichern
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditProjId(null)}>
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {customers.length > 1 && (
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        value=""
                        disabled={isPending}
                        title="Projekt zu anderem Kunden verschieben"
                        onChange={(e) => {
                          const cid = e.target.value;
                          if (cid) run(() => moveProjectToCustomerAction(p.id, cid));
                        }}
                      >
                        <option value="">Verschieben…</option>
                        {customers
                          .filter((c) => c.id !== customerId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              → {c.name}
                            </option>
                          ))}
                      </select>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => {
                        setEditProjId(p.id);
                        setEditProjName(p.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DangerConfirm
                      word={p.name}
                      title={`Projekt „${p.name}" löschen`}
                      description={
                        <>
                          Das entfernt das Projekt inkl. aller Dashboards und Datenquellen.
                          Wiederherstellung über den Papierkorb möglich.
                        </>
                      }
                      onConfirm={async () => {
                        const r = await deleteOrgAction(p.id);
                        if (r.ok) router.refresh();
                        return r;
                      }}
                      trigger={(open) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isPending}
                          onClick={open}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    />
                  </div>
                </>
              )}
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
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            >
              {editId === d.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 max-w-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={isPending || !editName.trim()}
                    onClick={() =>
                      run(async () => {
                        const r = await renameDashboardAction(d.id, editName, null);
                        if (r.ok) setEditId(null);
                        return r;
                      })
                    }
                  >
                    Speichern
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-sm text-foreground">
                    {d.name}
                    {d.isDefault && (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent-text">
                        Standard
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending || d.isDefault}
                      title={d.isDefault ? "Standard-Dashboard" : "Als Standard setzen"}
                      onClick={() => run(() => setDefaultDashboardAction(d.id))}
                    >
                      <Star
                        className={
                          "h-3.5 w-3.5 " + (d.isDefault ? "fill-accent text-accent" : "")
                        }
                      />
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projekte/${project.slug}/dashboards/${d.slug}`}>
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Öffnen
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projekte/${project.slug}/dashboards/${d.slug}/edit`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Editor
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => {
                        setEditId(d.id);
                        setEditName(d.name);
                      }}
                    >
                      Umbenennen
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
                </>
              )}
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
  const [type, setType] = useState<"matomo" | "sql">("matomo");
  const [label, setLabel] = useState("");
  const [siteId, setSiteId] = useState("");
  const [config, setConfig] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [eLabel, setELabel] = useState("");
  const [eSiteId, setESiteId] = useState("");

  const canAdd =
    !!label.trim() && (type === "matomo" ? !!siteId.trim() : true);

  const add = () => {
    const fd = new FormData();
    fd.set("organizationId", project.id);
    fd.set("type", type);
    fd.set("label", label);
    if (type === "matomo") fd.set("matomoSiteId", siteId);
    else fd.set("config", config);
    run(async () => {
      const r = await addDataSourceAction(fd);
      if (r.ok) {
        setLabel("");
        setSiteId("");
        setConfig("");
      }
      return r;
    });
  };

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Datenquellen
      </p>
      {project.dataSources.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Datenquellen.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {project.dataSources.map((ds) =>
            editId === ds.id ? (
              <li key={ds.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <Input
                  value={eLabel}
                  onChange={(e) => setELabel(e.target.value)}
                  placeholder="Bezeichnung"
                  className="h-8 flex-1"
                  autoFocus
                />
                {ds.type === "matomo" && (
                  <Input
                    value={eSiteId}
                    onChange={(e) => setESiteId(e.target.value)}
                    placeholder="Site-ID"
                    className="h-8 w-28"
                    inputMode="numeric"
                  />
                )}
                <Button
                  size="sm"
                  disabled={isPending || !eLabel.trim()}
                  onClick={() =>
                    run(async () => {
                      const fields: { label: string; matomoSiteId?: number } = {
                        label: eLabel.trim(),
                      };
                      if (ds.type === "matomo") fields.matomoSiteId = Number(eSiteId);
                      const r = await updateDataSourceAction(ds.id, fields);
                      if (r.ok) setEditId(null);
                      return r;
                    })
                  }
                >
                  Speichern
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                  Abbrechen
                </Button>
              </li>
            ) : (
              <li key={ds.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0 truncate text-sm text-foreground">
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                    {ds.type}
                  </span>
                  {ds.label}
                  {ds.matomoSiteId != null && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      Site #{ds.matomoSiteId}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => {
                      setEditId(ds.id);
                      setELabel(ds.label);
                      setESiteId(ds.matomoSiteId != null ? String(ds.matomoSiteId) : "");
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
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
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "matomo" | "sql")}
          className={selectClass}
        >
          <option value="matomo">Matomo</option>
          <option value="sql">SQL</option>
        </select>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Bezeichnung"
          className="h-9 flex-1"
        />
        {type === "matomo" ? (
          <Input
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            placeholder="Matomo-Site-ID"
            className="h-9 w-36"
            inputMode="numeric"
          />
        ) : (
          <Input
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            placeholder="Config (JSON, optional)"
            className="h-9 w-56"
          />
        )}
        <Button size="sm" variant="outline" disabled={isPending || !canAdd} onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Quelle
        </Button>
      </div>
    </div>
  );
}
