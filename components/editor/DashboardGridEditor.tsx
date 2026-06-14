"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import {
  Plus,
  Check,
  Settings2,
  Trash2,
  X,
  Loader2,
  GripVertical,
  BarChart3,
  LineChart,
  Table2,
  Type,
  PieChart,
  AlignLeft,
  Compass,
} from "lucide-react";
import {
  addWidgetAction,
  deleteWidgetAction,
  saveWidgetLayoutsAction,
} from "@/lib/actions/widgets";
import { listWidgetMeta, getWidgetMeta } from "@/lib/widgets/meta";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetConfigForm } from "./WidgetConfigForm";
import { ReportWidgetConfig } from "./ReportWidgetConfig";
import { DimensionMetricConfig } from "./DimensionMetricConfig";
import { cn } from "@/lib/utils";
import "./grid-editor.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "kpi-card": BarChart3,
  "line-chart": LineChart,
  "top-list": Table2,
  "text-block": Type,
  breakdown: AlignLeft,
  donut: PieChart,
  "bar-chart": BarChart3,
  report: Compass,
};

interface EditorWidget {
  id: string;
  type: string;
  title: string | null;
  config: Record<string, unknown>;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  dashboardId: string;
  projectSlug: string;
  dashboardSlug: string;
  initialWidgets: {
    id: string;
    type: string;
    title: string | null;
    config: Record<string, unknown>;
    layout: { x: number; y: number; w: number; h: number };
  }[];
  /** Matomo-Site fuer katalog-getriebene Config-UIs (Report-Explorer) */
  siteId?: number;
}

export function DashboardGridEditor({
  dashboardId,
  projectSlug,
  dashboardSlug,
  initialWidgets,
  siteId,
}: Props) {
  const [items, setItems] = useState<EditorWidget[]>(() =>
    initialWidgets.map((w) => ({
      id: w.id,
      type: w.type,
      title: w.title,
      config: w.config,
      x: w.layout.x,
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h,
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const widgetMetaList = listWidgetMeta();
  const selected = items.find((i) => i.id === selectedId) ?? null;

  // Layout fuer RGL
  const layout: Layout[] = useMemo(
    () =>
      items.map((it) => ({
        i: it.id,
        x: it.x,
        y: it.y,
        w: it.w,
        h: it.h,
        minW: 2,
        minH: 2,
      })),
    [items]
  );

  const scheduleSave = useCallback((current: EditorWidget[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      const r = await saveWidgetLayoutsAction(
        current.map((it) => ({
          id: it.id,
          layout: { x: it.x, y: it.y, w: it.w, h: it.h },
        }))
      );
      setSaveState(r.ok ? "saved" : "idle");
      if (r.ok) setTimeout(() => setSaveState("idle"), 1500);
    }, 700);
  }, []);

  const handleLayoutChange = (next: Layout[]) => {
    setItems((prev) => {
      const merged = prev.map((it) => {
        const l = next.find((n) => n.i === it.id);
        return l ? { ...it, x: l.x, y: l.y, w: l.w, h: l.h } : it;
      });
      // nur speichern, wenn sich wirklich etwas geaendert hat
      const changed = merged.some((m, idx) => {
        const p = prev[idx];
        return m.x !== p.x || m.y !== p.y || m.w !== p.w || m.h !== p.h;
      });
      if (changed) scheduleSave(merged);
      return merged;
    });
  };

  const handleAdd = async (type: string) => {
    const meta = getWidgetMeta(type);
    if (!meta) return;
    const r = await addWidgetAction({ dashboardId, type });
    if (r.ok && r.data) {
      const newItem: EditorWidget = {
        id: r.data.id,
        type,
        title: null,
        config: { ...meta.defaultConfig },
        x: 0,
        y: 9999, // ans Ende, RGL setzt korrekt
        w: meta.defaultLayout.w,
        h: meta.defaultLayout.h,
      };
      setItems((prev) => {
        const next = [...prev, newItem];
        scheduleSave(next);
        return next;
      });
      setSelectedId(r.data.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Widget wirklich entfernen?")) return;
    await deleteWidgetAction(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Editor-Toolbar */}
      <div className="sticky top-[3.5rem] z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 md:top-16">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent-text">
            <GripVertical className="h-3.5 w-3.5" />
            Bearbeitungsmodus
          </span>
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Speichern…
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="h-3 w-3" /> Gespeichert
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-4 w-4" />
                Widget hinzufügen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
              <DropdownMenuLabel>Widget-Typ wählen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {widgetMetaList.map((m) => {
                const Icon = TYPE_ICONS[m.type] ?? BarChart3;
                return (
                  <DropdownMenuItem key={m.type} onClick={() => handleAdd(m.type)}>
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{m.label}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" asChild>
            <Link href={`/projekte/${projectSlug}/dashboards/${dashboardSlug}`}>
              <Check className="mr-1.5 h-4 w-4" />
              Fertig
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Noch keine Widgets. Füge oben rechts das erste hinzu.
          </p>
        </div>
      ) : (
        <div className={cn("rgl-edit", selected && "lg:pr-[340px]")}>
          <div className="editor-grid-bg">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout, md: layout, sm: layout }}
            breakpoints={{ lg: 1024, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 12, sm: 1 }}
            rowHeight={84}
            margin={[16, 16]}
            isDraggable
            isResizable
            draggableCancel=".no-drag"
            onLayoutChange={handleLayoutChange}
            compactType="vertical"
          >
            {items.map((it) => {
              const meta = getWidgetMeta(it.type);
              const Icon = TYPE_ICONS[it.type] ?? BarChart3;
              const isSel = it.id === selectedId;
              return (
                <div key={it.id}>
                  <div
                    className={cn(
                      "group flex h-full cursor-grab flex-col rounded-xl border bg-card p-4 transition-colors active:cursor-grabbing",
                      isSel
                        ? "border-accent ring-2 ring-accent/30"
                        : "border-border hover:border-accent/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {it.title ?? meta?.label ?? it.type}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {meta?.label ?? it.type}
                          </p>
                        </div>
                      </div>
                      <div className="no-drag flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setSelectedId(isSel ? null : it.id)}
                          title="Einstellungen"
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                            isSel ? "text-accent-text" : "text-muted-foreground"
                          )}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(it.id)}
                          title="Entfernen"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20">
                      <span className="text-xs text-muted-foreground">
                        {meta?.description ?? "Vorschau im Dashboard"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
          </div>
        </div>
      )}

      {/* Seiten-Panel fuer Konfiguration */}
      {selected && (
        <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[340px] overflow-y-auto border-l border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {getWidgetMeta(selected.type)?.label ?? selected.type}
              </p>
              <p className="text-xs text-muted-foreground">Widget-Einstellungen</p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Panel schließen"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            {getWidgetMeta(selected.type)?.customConfig ? (
              siteId ? (
                (() => {
                  const Comp =
                    selected.type === "report" ? ReportWidgetConfig : DimensionMetricConfig;
                  return (
                    <Comp
                      key={selected.id}
                      widgetId={selected.id}
                      siteId={siteId}
                      initialTitle={selected.title}
                      initialConfig={selected.config}
                      onSaved={(data) => {
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === selected.id
                              ? { ...it, title: data.title, config: data.config }
                              : it
                          )
                        );
                      }}
                    />
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">
                  Für dieses Widget wird eine Matomo-Datenquelle im Projekt benötigt.
                </p>
              )
            ) : getWidgetMeta(selected.type)?.configSchema ? (
              <WidgetConfigForm
                key={selected.id}
                widgetId={selected.id}
                initialTitle={selected.title}
                initialConfig={selected.config}
                schema={getWidgetMeta(selected.type)!.configSchema!}
                onSaved={(data) => {
                  setItems((prev) =>
                    prev.map((it) =>
                      it.id === selected.id
                        ? { ...it, title: data.title, config: data.config }
                        : it
                    )
                  );
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Für diesen Widget-Typ gibt es keine Einstellungen.
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
