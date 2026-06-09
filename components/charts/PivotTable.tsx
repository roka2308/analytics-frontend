import type { PivotTableModel } from "@/lib/analytics/pivot";

function fmt(n: number | null): string {
  return n == null ? "–" : n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

/**
 * Multi-Level-Pivot-Tabelle. Zeilen-Dimensionen als linke Spalten, Spalten-
 * Dimensionen als (ggf. verkettete) Kopfzeile, Zelle = aggregierte Kennzahl.
 */
export function PivotTable({
  model,
  rowDimLabels,
  colDimLabels,
  measureLabel,
}: {
  model: PivotTableModel;
  rowDimLabels: string[];
  colDimLabels: string[];
  measureLabel: string;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {rowDimLabels.map((l, i) => (
              <th key={`r${i}`} className="px-2 py-1.5 font-medium">
                {l}
              </th>
            ))}
            {model.colPaths.map((cp, ci) => (
              <th key={`c${ci}`} className="px-2 py-1.5 text-right font-medium">
                {cp.join(" · ") || "—"}
              </th>
            ))}
            {model.colPaths.length > 1 && (
              <th className="px-2 py-1.5 text-right font-medium">Gesamt</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {model.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/30">
              {row.path.map((p, pi) => (
                <td key={pi} className="px-2 py-1.5 text-foreground">
                  {p || "—"}
                </td>
              ))}
              {row.cells.map((c, ci) => (
                <td key={ci} className="px-2 py-1.5 text-right tabular-nums text-foreground">
                  {fmt(c)}
                </td>
              ))}
              {model.colPaths.length > 1 && (
                <td className="px-2 py-1.5 text-right font-medium tabular-nums text-foreground">
                  {fmt(row.total)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td className="px-2 py-1.5" colSpan={Math.max(1, rowDimLabels.length)}>
              Gesamt
            </td>
            {model.colTotals.map((t, ci) => (
              <td key={ci} className="px-2 py-1.5 text-right tabular-nums text-foreground">
                {fmt(t)}
              </td>
            ))}
            {model.colPaths.length > 1 && (
              <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                {fmt(model.grandTotal)}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 px-2 text-[11px] text-muted-foreground">
        Wert: {measureLabel}
        {colDimLabels.length ? ` · Spalten: ${colDimLabels.join(" · ")}` : ""}
      </p>
    </div>
  );
}
