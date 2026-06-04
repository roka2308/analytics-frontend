import { AlignLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBreakdownForRange,
  type BreakdownSource,
} from "@/lib/matomo/transforms";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { InlineBar } from "@/components/charts/InlineBar";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface BreakdownConfig {
  source: BreakdownSource;
  limit?: number;
  metricRefId?: string;
}

const SOURCE_LABELS: Record<BreakdownSource, string> = {
  "device-type": "Gerätetyp",
  "device-brand": "Gerätemarke",
  browser: "Browser",
  os: "Betriebssystem",
  country: "Land",
  "referrer-type": "Traffic-Quelle",
  "search-engine": "Suchmaschine",
  "social-network": "Soziales Netzwerk",
  "event-category": "Event-Kategorie",
  "event-action": "Event-Aktion",
};

export async function BreakdownWidget({
  config,
  title,
  ctx,
}: WidgetProps<BreakdownConfig>) {
  const limit = config.limit ?? 10;
  let rows: Awaited<ReturnType<typeof getBreakdownForRange>> = [];
  let error: string | null = null;

  try {
    rows = await getBreakdownForRange(
      config.source,
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      limit
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden";
  }

  const sourceLabel = SOURCE_LABELS[config.source] ?? "Wert";
  const displayTitle = title ?? `Top ${sourceLabel}`;
  const def = config.metricRefId
    ? getMetricDefinition(config.metricRefId)
    : null;

  const total = rows.reduce((sum, r) => sum + r.visits, 0);
  const maxVisits = rows.reduce((m, r) => Math.max(m, r.visits), 0);

  return (
    <WidgetCard
      title={displayTitle}
      icon={<AlignLeft className="h-4 w-4" />}
      metricDef={def}
      scroll
    >
      {error ? (
        <p className="text-sm text-muted-foreground">
          Daten konnten nicht geladen werden.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine Daten für diesen Zeitraum.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8">{sourceLabel}</TableHead>
              <TableHead className="h-8 w-40">Besuche</TableHead>
              <TableHead className="h-8 w-14 text-right">Anteil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const pct = total > 0 ? (r.visits / total) * 100 : 0;
              return (
                <TableRow key={i}>
                  <TableCell className="max-w-xs truncate py-2 text-sm text-foreground">
                    {r.label}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-foreground">
                        {r.visits.toLocaleString("de-DE")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <InlineBar
                          fraction={maxVisits ? r.visits / maxVisits : 0}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums text-muted-foreground">
                    {pct.toFixed(0)} %
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </WidgetCard>
  );
}
