import { Table2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTopPagesForRange } from "@/lib/matomo/transforms";
import type { WidgetProps } from "@/lib/widgets/types";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { InlineBar } from "@/components/charts/InlineBar";
import { WidgetCard } from "./WidgetCard";

export interface TopListConfig {
  source: "pages";
  limit?: number;
}

export async function TopListWidget({
  config,
  title,
  ctx,
}: WidgetProps<TopListConfig>) {
  const limit = config.limit ?? 10;

  let rows: Awaited<ReturnType<typeof getTopPagesForRange>> = [];
  let error: string | null = null;

  try {
    rows = await getTopPagesForRange(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      limit
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden";
  }

  const displayTitle = title ?? "Top-Seiten";
  const def = getMetricDefinition("top-pages");
  const maxVisits = rows.reduce((m, r) => Math.max(m, r.visits), 0);

  return (
    <WidgetCard
      title={displayTitle}
      icon={<Table2 className="h-4 w-4" />}
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
              <TableHead className="h-8 w-8 text-center">#</TableHead>
              <TableHead className="h-8">Seite</TableHead>
              <TableHead className="h-8 w-40">Besuche</TableHead>
              <TableHead className="h-8 w-24 text-right">Aufrufe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="py-2 text-center font-mono text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-xs truncate py-2 font-mono text-xs text-foreground">
                  {r.label}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-right text-sm tabular-nums text-foreground">
                      {r.visits.toLocaleString("de-DE")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <InlineBar fraction={maxVisits ? r.visits / maxVisits : 0} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2 text-right text-sm tabular-nums text-muted-foreground">
                  {r.pageviews.toLocaleString("de-DE")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WidgetCard>
  );
}
