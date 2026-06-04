import { Grid3x3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPageEventCrossTab } from "@/lib/matomo/transforms";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface CrossTabConfig {
  /** Anzahl Seiten in der Pivot-Sicht */
  topPagesLimit?: number;
  /** Anzahl Events je Seite */
  topEventsPerPage?: number;
}

/**
 * Echte Pivot-Sicht: Top-Seiten × ihre Top-Events.
 *
 * Layout:
 *  - Zeile = eine Top-Seite
 *  - Spalte 1: Seite (URL/Label)
 *  - Spalte 2: Gesamt-Besuche der Seite
 *  - Spalte 3+: Top-N Event-Kategorien als kompakte Liste
 *
 * Hinweis fuer Kunden: Funktioniert nur, wenn in Matomo Events
 * (z.B. Add-to-Cart, Newsletter-Signup) sauber getrackt werden.
 */
export async function CrossTabWidget({
  config,
  title,
  ctx,
}: WidgetProps<CrossTabConfig>) {
  const topPagesLimit = config.topPagesLimit ?? 5;
  const topEventsPerPage = config.topEventsPerPage ?? 3;

  let rows: Awaited<ReturnType<typeof getPageEventCrossTab>> = [];
  let error: string | null = null;

  try {
    rows = await getPageEventCrossTab(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      topPagesLimit,
      topEventsPerPage
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden";
  }

  const displayTitle = title ?? "Top-Seiten × Ereignisse";
  const def = getMetricDefinition("page-event-pivot");

  const hasAnyEvents = rows.some((r) => r.topEvents.length > 0);

  return (
    <WidgetCard
      title={displayTitle}
      icon={<Grid3x3 className="h-4 w-4" />}
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
      ) : !hasAnyEvents ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Keine Ereignisse auf den Top-Seiten gefunden.
          </p>
          <p className="text-xs text-muted-foreground">
            Falls diese Sicht für deine Seite relevant sein soll, richte in Matomo
            Event-Tracking ein (z.B. Add-to-Cart, Download, Newsletter-Signup).
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 w-8 text-center">#</TableHead>
              <TableHead className="h-8">Seite</TableHead>
              <TableHead className="h-8 w-20 text-right">Besuche</TableHead>
              <TableHead className="h-8">Top-Ereignisse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="py-2 text-center font-mono text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="max-w-xs truncate py-2 font-mono text-xs text-foreground">
                  {row.page}
                </TableCell>
                <TableCell className="py-2 text-right text-sm tabular-nums">
                  {row.totalVisits.toLocaleString("de-DE")}
                </TableCell>
                <TableCell className="py-2">
                    {row.topEvents.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        (keine Events)
                      </span>
                    ) : (
                      <ul className="space-y-0.5">
                        {row.topEvents.map((ev, j) => (
                          <li
                            key={j}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-foreground">
                              {ev.category}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {ev.visits.toLocaleString("de-DE")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      )}
    </WidgetCard>
  );
}
