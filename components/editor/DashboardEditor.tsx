"use client";

import { useState, useTransition } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Layers,
} from "lucide-react";
import {
  addWidgetAction,
  deleteWidgetAction,
  moveWidgetToSectionAction,
  reorderWidgetsAction,
} from "@/lib/actions/widgets";
import {
  createSectionAction,
  deleteSectionAction,
  renameSectionAction,
  reorderSectionsAction,
} from "@/lib/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WidgetConfigForm } from "./WidgetConfigForm";
import { listWidgetMeta, getWidgetMeta } from "@/lib/widgets/meta";

interface WidgetItem {
  id: string;
  sectionId: string | null;
  type: string;
  title: string | null;
  config: Record<string, unknown>;
  position: number;
}

interface SectionItem {
  id: string;
  title: string;
  description: string | null;
  position: number;
}

interface Props {
  dashboardId: string;
  dashboardName: string;
  widgets: WidgetItem[];
  sections: SectionItem[];
}

export function DashboardEditor({
  dashboardId,
  dashboardName,
  widgets,
  sections,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionDesc, setEditSectionDesc] = useState("");
  const [newWidgetType, setNewWidgetType] = useState<string>("kpi-card");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const widgetDefs = listWidgetMeta();
  const sectionsById = new Map(sections.map((s) => [s.id, s]));

  // Widgets gruppieren: pro section, plus "ohne section"
  const widgetsBySection = new Map<string | null, WidgetItem[]>();
  for (const w of widgets) {
    const key = w.sectionId;
    if (!widgetsBySection.has(key)) widgetsBySection.set(key, []);
    widgetsBySection.get(key)!.push(w);
  }
  widgetsBySection.forEach((arr) => {
    arr.sort((a, b) => a.position - b.position);
  });

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAddWidget = (sectionId: string | null) => {
    reset();
    startTransition(async () => {
      const r = await addWidgetAction({
        dashboardId,
        type: newWidgetType,
        sectionId,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Widget hinzugefügt.");
        if (r.data?.id) setEditingWidgetId(r.data.id);
      }
    });
  };

  const handleDeleteWidget = (widgetId: string, label: string) => {
    if (!confirm(`Widget "${label}" wirklich entfernen?`)) return;
    reset();
    startTransition(async () => {
      const r = await deleteWidgetAction(widgetId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Widget entfernt.");
    });
  };

  const handleMoveWidget = (
    widget: WidgetItem,
    items: WidgetItem[],
    direction: "up" | "down"
  ) => {
    const idx = items.findIndex((w) => w.id === widget.id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    reset();
    startTransition(async () => {
      const r = await reorderWidgetsAction(
        next.map((w, i) => ({ id: w.id, position: i }))
      );
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
    });
  };

  const handleMoveToSection = (widgetId: string, sectionId: string | null) => {
    reset();
    startTransition(async () => {
      const r = await moveWidgetToSectionAction(widgetId, sectionId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
    });
  };

  const handleCreateSection = () => {
    if (!newSectionTitle.trim()) return;
    reset();
    startTransition(async () => {
      const r = await createSectionAction({
        dashboardId,
        title: newSectionTitle,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Abschnitt angelegt.");
        setNewSectionTitle("");
      }
    });
  };

  const handleRenameSection = (sectionId: string) => {
    reset();
    startTransition(async () => {
      const r = await renameSectionAction({
        sectionId,
        title: editSectionTitle,
        description: editSectionDesc || null,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else {
        setSuccess("Abschnitt aktualisiert.");
        setEditingSectionId(null);
      }
    });
  };

  const handleDeleteSection = (sectionId: string, title: string) => {
    if (
      !confirm(
        `Abschnitt "${title}" löschen? Die Widgets bleiben erhalten (werden freistehend).`
      )
    )
      return;
    reset();
    startTransition(async () => {
      const r = await deleteSectionAction(sectionId);
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Abschnitt gelöscht.");
    });
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const next = [...sections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    reset();
    startTransition(async () => {
      const r = await reorderSectionsAction(
        next.map((s, i) => ({ id: s.id, position: i }))
      );
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
    });
  };

  const renderWidgetRow = (widget: WidgetItem, items: WidgetItem[]) => {
    const def = getWidgetMeta(widget.type);
    const idx = items.findIndex((w) => w.id === widget.id);
    const isEditing = editingWidgetId === widget.id;
    const labelText = widget.title ?? def?.label ?? widget.type;

    return (
      <div
        key={widget.id}
        className="rounded-md border border-border bg-card"
      >
        <div className="flex items-start gap-2 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{labelText}</p>
            <p className="text-xs text-muted-foreground">
              Typ: {def?.label ?? widget.type}
              {def && (
                <>
                  {" "}· <span className="font-mono">{widget.type}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMoveWidget(widget, items, "up")}
              disabled={isPending || idx === 0}
              title="Nach oben"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMoveWidget(widget, items, "down")}
              disabled={isPending || idx === items.length - 1}
              title="Nach unten"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            {sections.length > 0 && (
              <Select
                value={widget.sectionId ?? "__none__"}
                onValueChange={(v) =>
                  handleMoveToSection(widget.id, v === "__none__" ? null : v)
                }
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Freistehend</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setEditingWidgetId(isEditing ? null : widget.id)
              }
              disabled={isPending}
              title={isEditing ? "Schließen" : "Bearbeiten"}
              className={isEditing ? "text-accent-text" : ""}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteWidget(widget.id, labelText)}
              disabled={isPending}
              title="Entfernen"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {isEditing && def?.configSchema && (
          <div className="border-t border-border bg-muted/10 p-3">
            <WidgetConfigForm
              widgetId={widget.id}
              initialTitle={widget.title}
              initialConfig={widget.config}
              schema={def.configSchema}
              onSaved={() => {
                // Form bleibt offen, Daten werden bei naechstem Refresh aktualisiert
              }}
            />
          </div>
        )}
        {isEditing && !def?.configSchema && (
          <div className="border-t border-border bg-muted/10 p-3 text-xs text-muted-foreground">
            Für diesen Widget-Typ gibt es noch keine Konfigurations-UI.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Layers className="h-5 w-5 text-muted-foreground" />
          {dashboardName} – Bearbeiten
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Widgets hinzufügen, konfigurieren, neu sortieren oder in Abschnitte einteilen.
          Die visuelle Drag-Drop-Bearbeitung folgt in einer späteren Phase.
        </p>
      </div>

      {/* Globaler Add-Widget-Bereich */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Widget hinzufügen</CardTitle>
          <CardDescription>
            Wählt den Typ aus – das Widget bekommt Default-Werte und wird unten
            angefügt. Anschließend kannst du es konfigurieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="new-widget-type">
                Widget-Typ
              </Label>
              <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                <SelectTrigger id="new-widget-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widgetDefs.map((d) => (
                    <SelectItem key={d.type} value={d.type}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {widgetDefs.find((d) => d.type === newWidgetType)?.description}
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleAddWidget(null)}
                disabled={isPending}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abschnitte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abschnitte</CardTitle>
          <CardDescription>
            Optional: Gruppiere Widgets in Abschnitte (z.B. „Traffic", „Engagement",
            „Conversion"). Das vereinfacht später die Struktur des Dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine Abschnitte. Alle Widgets liegen freistehend.
            </p>
          )}
          {sections.map((s, i) => (
            <div
              key={s.id}
              className="rounded-md border border-border bg-muted/20 p-3"
            >
              {editingSectionId === s.id ? (
                <div className="space-y-2">
                  <Input
                    value={editSectionTitle}
                    onChange={(e) => setEditSectionTitle(e.target.value)}
                    placeholder="Abschnitts-Titel"
                  />
                  <Input
                    value={editSectionDesc}
                    onChange={(e) => setEditSectionDesc(e.target.value)}
                    placeholder="Beschreibung (optional)"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRenameSection(s.id)}
                      disabled={isPending}
                    >
                      Speichern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSectionId(null)}
                      disabled={isPending}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {s.title}
                    </p>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveSection(s.id, "up")}
                      disabled={isPending || i === 0}
                      title="Nach oben"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveSection(s.id, "down")}
                      disabled={isPending || i === sections.length - 1}
                      title="Nach unten"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingSectionId(s.id);
                        setEditSectionTitle(s.title);
                        setEditSectionDesc(s.description ?? "");
                      }}
                      disabled={isPending}
                      title="Umbenennen"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSection(s.id, s.title)}
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

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Neuer Abschnitt – Titel"
            />
            <Button
              variant="outline"
              onClick={handleCreateSection}
              disabled={isPending || !newSectionTitle.trim()}
            >
              <FolderPlus className="mr-1.5 h-4 w-4" />
              Abschnitt anlegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Widget-Liste nach Sections */}
      <div className="space-y-6">
        {sections.map((s) => {
          const items = widgetsBySection.get(s.id) ?? [];
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
                {s.description && (
                  <CardDescription>{s.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Widgets in diesem Abschnitt.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((w) => renderWidgetRow(w, items))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Freistehende Widgets */}
        {(() => {
          const items = widgetsBySection.get(null) ?? [];
          if (items.length === 0 && sections.length > 0) return null;
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {sections.length > 0 ? "Freistehende Widgets" : "Widgets"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Widgets. Füge oben das erste hinzu.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((w) => renderWidgetRow(w, items))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}
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
    </div>
  );
}
