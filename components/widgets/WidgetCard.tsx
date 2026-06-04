import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { MetricInfo } from "@/components/dashboard/MetricInfo";
import type { MetricDefinition } from "@/lib/metrics/registry";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  icon?: ReactNode;
  metricDef?: MetricDefinition | null;
  /** Content scrollt bei Ueberlauf (fuer Tabellen) */
  scroll?: boolean;
  /** Content vertikal zentrieren (fuer Donut etc.) */
  center?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Einheitliche Hülle fuer alle Daten-Widgets.
 * - flex-col h-full: fuellt die zugewiesene Rasterhoehe
 * - kompakte Kopfzeile (Icon optional + Titel + Info-Popover)
 * - Content flex-1: Charts/Tabellen fuellen den Rest
 */
export function WidgetCard({
  title,
  icon,
  metricDef,
  scroll,
  center,
  children,
  className,
}: Props) {
  return (
    <Card
      className={cn("relative flex h-full flex-col overflow-hidden", className)}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-4">
        {icon && (
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent-text"
          >
            {icon}
          </span>
        )}
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
          <span className="truncate">{title}</span>
          {metricDef && <MetricInfo metric={metricDef} size="sm" />}
        </h3>
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 px-4 pb-4",
          scroll && "overflow-auto",
          center && "flex items-center"
        )}
      >
        {children}
      </div>
    </Card>
  );
}
