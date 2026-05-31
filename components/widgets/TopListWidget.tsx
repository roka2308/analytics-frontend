import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          {displayTitle}
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Seite</TableHead>
                <TableHead className="text-right w-28">Besuche</TableHead>
                <TableHead className="text-right w-36">Seitenaufrufe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center text-xs font-mono text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground truncate max-w-xs">
                    {r.label}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.visits.toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.pageviews.toLocaleString("de-DE")}
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
