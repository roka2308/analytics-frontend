import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MetricInfo } from "@/components/dashboard/MetricInfo";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span>{displayTitle}</span>
          {def && <MetricInfo metric={def} size="md" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Seite</TableHead>
                <TableHead className="text-right w-24">Besuche</TableHead>
                <TableHead>Top-Ereignisse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center text-xs font-mono text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground truncate max-w-xs">
                    {row.page}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.totalVisits.toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
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
      </CardContent>
    </Card>
  );
}
