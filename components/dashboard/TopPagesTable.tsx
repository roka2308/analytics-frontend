import { getTopPages } from "@/lib/matomo/transforms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  siteId: number;
  period: "day" | "week" | "month" | "range";
  date: string;
}

export async function TopPagesTable({ siteId, period, date }: Props) {
  let pages: Awaited<ReturnType<typeof getTopPages>> = [];
  let error: string | null = null;

  try {
    pages = await getTopPages(siteId, period, date);
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden";
  }

  if (error) {
    return (
      <p className="text-sm text-slate-400">Top-Seiten konnten nicht geladen werden.</p>
    );
  }

  if (pages.length === 0) {
    return (
      <p className="text-sm text-slate-400">Keine Seitendaten für diesen Zeitraum.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Seite</TableHead>
          <TableHead className="text-right w-28">Besuche</TableHead>
          <TableHead className="text-right w-36">Seitenaufrufe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page, i) => (
          <TableRow key={i}>
            <TableCell className="font-mono text-xs text-slate-600 truncate max-w-xs">
              {page.label}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {page.visits.toLocaleString("de-DE")}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {page.pageviews.toLocaleString("de-DE")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
