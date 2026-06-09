import type { PivotRecord } from "@/lib/analytics/pivot";

function fmt(n: number | undefined): string {
  return (n ?? 0).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

/**
 * Mehrdimensionale, gruppierte Tabelle (Outline-Pivot): mehrere Zeilen-
 * Dimensionen verschachtelt (wiederholte Elternwerte werden ausgeblendet),
 * mehrere Metriken als Wertspalten – ohne Spalten-Kreuzung.
 */
export function GroupedTable({
  records,
  dimKeys,
  dimLabels,
  metrics,
}: {
  records: PivotRecord[];
  dimKeys: string[];
  dimLabels: string[];
  metrics: { id: string; label: string }[];
}) {
  let prev: string[] = [];
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {dimLabels.map((l, i) => (
              <th key={`d${i}`} className="px-2 py-1.5 font-medium">
                {l}
              </th>
            ))}
            {metrics.map((m) => (
              <th key={m.id} className="px-2 py-1.5 text-right font-medium">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((rec, ri) => {
            const path = dimKeys.map((k) => rec.dims[k] ?? "");
            const cells = path.map((v, i) => {
              const sameSoFar =
                i < prev.length &&
                path.slice(0, i + 1).join("") === prev.slice(0, i + 1).join("");
              return sameSoFar ? "" : v || "—";
            });
            prev = path;
            return (
              <tr key={ri} className="hover:bg-muted/30">
                {cells.map((c, ci) => (
                  <td
                    key={ci}
                    className={
                      "px-2 py-1.5 text-foreground" + (ci > 0 ? " text-muted-foreground" : "")
                    }
                  >
                    {c}
                  </td>
                ))}
                {metrics.map((m) => (
                  <td key={m.id} className="px-2 py-1.5 text-right tabular-nums text-foreground">
                    {fmt(rec.values[m.id])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
