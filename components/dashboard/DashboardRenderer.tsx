import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWidgetDefinition } from "@/lib/widgets/registry";
import type { DashboardWidgetRow } from "@/lib/db/queries";
import type { WidgetRenderContext } from "@/lib/widgets/types";

interface Props {
  widgets: DashboardWidgetRow[];
  ctx: WidgetRenderContext;
}

/**
 * Rendert eine Liste von Widgets in einem 12-Spalten-CSS-Grid.
 * Jedes Widget bestimmt ueber widget.layout.w die eigene Breite.
 *
 * Wichtig: Wir spannen NICHT auf 12 Reihen feste Hoehen (das macht der
 * Drag-Drop-Editor in Phase F). Stattdessen "fluten" die Widgets in
 * Lese-Reihenfolge nach Position/Layout-y.
 */
export function DashboardRenderer({ widgets, ctx }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Dieses Dashboard hat noch keine Widgets.
        </p>
      </div>
    );
  }

  // Nach y, dann nach x, dann nach position sortieren
  const sorted = [...widgets].sort((a, b) => {
    if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
    if (a.layout.x !== b.layout.x) return a.layout.x - b.layout.x;
    return a.position - b.position;
  });

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-min">
      {sorted.map((widget) => {
        const def = getWidgetDefinition(widget.type);
        const colSpan = Math.max(1, Math.min(12, widget.layout.w));

        if (!def) {
          // Unbekannter Widget-Typ – defensiv darstellen, Dashboard nicht crashen lassen
          return (
            <div
              key={widget.id}
              className={`col-span-12 sm:col-span-${colSpan}`}
              style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
            >
              <Card className="border-warning/40">
                <CardContent className="p-6">
                  <p className="text-sm text-warning">
                    Unbekannter Widget-Typ: <code className="font-mono">{widget.type}</code>
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }

        const WidgetComponent = def.component;
        return (
          <div
            key={widget.id}
            style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
            className="col-span-12"
          >
            <Suspense
              fallback={
                <Card>
                  <CardContent className="p-6 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              }
            >
              {/* @ts-expect-error – Server-Komponenten in dynamischem JSX */}
              <WidgetComponent
                config={widget.config}
                title={widget.title}
                ctx={ctx}
              />
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
