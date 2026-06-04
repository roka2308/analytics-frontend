import { Suspense } from "react";
import type { Layout } from "react-grid-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWidgetDefinition } from "@/lib/widgets/registry";
import { DashboardGrid } from "./DashboardGrid";
import type { DashboardWidgetRow } from "@/lib/db/queries";
import type { WidgetRenderContext } from "@/lib/widgets/types";

interface Props {
  widgets: DashboardWidgetRow[];
  ctx: WidgetRenderContext;
}

/**
 * Rendert die Widgets eines Dashboards in einem statischen Raster,
 * das exakt dem Editor-Layout (x, y, w, h) entspricht.
 */
export function DashboardRenderer({ widgets, ctx }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Dieses Dashboard hat noch keine Widgets.
        </p>
      </div>
    );
  }

  const layout: Layout[] = widgets.map((w) => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: Math.max(1, Math.min(12, w.layout.w)),
    h: Math.max(1, w.layout.h),
    static: true,
  }));

  return (
    <DashboardGrid layout={layout}>
      {widgets.map((widget) => {
        const def = getWidgetDefinition(widget.type);

        if (!def) {
          return (
            <div key={widget.id} className="h-full">
              <Card className="h-full border-warning/40">
                <CardContent className="p-6">
                  <p className="text-sm text-warning">
                    Unbekannter Widget-Typ:{" "}
                    <code className="font-mono">{widget.type}</code>
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        }

        const WidgetComponent = def.component;
        return (
          <div key={widget.id} className="h-full overflow-hidden">
            <Suspense
              fallback={
                <Card className="h-full">
                  <CardContent className="space-y-2 p-6">
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
    </DashboardGrid>
  );
}
