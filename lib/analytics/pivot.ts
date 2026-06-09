// =============================================================
//  Generische Pivot-/Aggregations-Engine (rein, datenquellen-agnostisch)
//
//  Eingabe: long-format Records {dims, values}. Konfiguration: beliebig viele
//  Zeilen- und Spalten-Dimensionen + eine Kennzahl + Aggregation.
//  -> Multi-Level-Pivot (mehr als 2 Ebenen). Wiederverwendbar fuer Matomo
//     (Segment-Crossing) UND SQL-Tabellen.
// =============================================================

export interface PivotRecord {
  dims: Record<string, string>;
  values: Record<string, number>;
}

export type AggFn = "sum" | "avg" | "min" | "max" | "count";

export interface PivotConfig {
  rowDims: string[];
  colDims: string[];
  measure: string;
  agg?: AggFn;
}

export interface PivotTableModel {
  rowDimCount: number;
  colDimCount: number;
  /** Blatt-Spaltenpfade (je ein Array der Spalten-Dimensionswerte) */
  colPaths: string[][];
  rows: { path: string[]; cells: (number | null)[]; total: number }[];
  colTotals: number[];
  grandTotal: number;
}

const SEP = "";

function aggregate(vals: number[], agg: AggFn): number {
  if (vals.length === 0) return 0;
  switch (agg) {
    case "avg":
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    case "min":
      return Math.min(...vals);
    case "max":
      return Math.max(...vals);
    case "count":
      return vals.length;
    case "sum":
    default:
      return vals.reduce((s, v) => s + v, 0);
  }
}

export function buildPivot(records: PivotRecord[], cfg: PivotConfig): PivotTableModel {
  const agg = cfg.agg ?? "sum";
  const rowPaths: string[][] = [];
  const colPaths: string[][] = [];
  const rowSeen = new Map<string, number>();
  const colSeen = new Map<string, number>();
  const buckets = new Map<string, number[]>();

  const pathOf = (r: PivotRecord, dims: string[]) => dims.map((d) => r.dims[d] ?? "");

  for (const r of records) {
    const rp = pathOf(r, cfg.rowDims);
    const cp = pathOf(r, cfg.colDims);
    const rk = rp.join(SEP);
    const ck = cp.join(SEP);
    if (!rowSeen.has(rk)) {
      rowSeen.set(rk, rowPaths.length);
      rowPaths.push(rp);
    }
    if (!colSeen.has(ck)) {
      colSeen.set(ck, colPaths.length);
      colPaths.push(cp);
    }
    const bk = `${rk}${ck}`;
    const arr = buckets.get(bk) ?? [];
    arr.push(Number(r.values[cfg.measure] ?? 0));
    buckets.set(bk, arr);
  }

  const rows = rowPaths.map((rp) => {
    const rk = rp.join(SEP);
    const cells = colPaths.map((cp) => {
      const arr = buckets.get(`${rk}${cp.join(SEP)}`);
      return arr ? aggregate(arr, agg) : null;
    });
    const total = cells.reduce<number>((s, c) => s + (c ?? 0), 0);
    return { path: rp, cells, total };
  });

  const colTotals = colPaths.map((_, ci) =>
    rows.reduce<number>((s, row) => s + (row.cells[ci] ?? 0), 0),
  );
  const grandTotal = colTotals.reduce((s, c) => s + c, 0);

  return {
    rowDimCount: cfg.rowDims.length,
    colDimCount: cfg.colDims.length,
    colPaths,
    rows,
    colTotals,
    grandTotal,
  };
}
