"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateWidgetConfigAction } from "@/lib/actions/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReportMeta {
  uniqueId: string;
  category: string;
  label: string;
  module: string;
  action: string;
  dimension: string | null;
  metrics: Record<string, string>;
}

interface Props {
  widgetId: string;
  siteId: number;
  initialTitle: string | null;
  initialConfig: Record<string, unknown>;
  onSaved?: (data: { title: string | null; config: Record<string, unknown> }) => void;
}

const selectClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function ReportWidgetConfig({
  widgetId,
  siteId,
  initialTitle,
  initialConfig,
  onSaved,
}: Props) {
  const [catalog, setCatalog] = useState<ReportMeta[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle ?? "");
  const [reportKey, setReportKey] = useState<string>(
    initialConfig.apiModule && initialConfig.apiAction
      ? `${initialConfig.apiModule}.${initialConfig.apiAction}`
      : "",
  );
  const [metrics, setMetrics] = useState<string[]>(
    Array.isArray(initialConfig.metrics) ? (initialConfig.metrics as string[]) : [],
  );
  const [display, setDisplay] = useState<string>((initialConfig.display as string) ?? "table");
  const [limit, setLimit] = useState<number>((initialConfig.limit as number) ?? 10);
  const [sortColumn, setSortColumn] = useState<string>((initialConfig.sortColumn as string) ?? "");

  const refKey = (r?: { module: string; action: string }) => (r ? `${r.module}.${r.action}` : "");
  const pivotRowsInit = (initialConfig.pivotRows as { module: string; action: string }[]) ?? [];
  const pivotColsInit = (initialConfig.pivotCols as { module: string; action: string }[]) ?? [];
  const groupDimsInit = (initialConfig.groupDims as { module: string; action: string }[]) ?? [];
  const [rowDim2, setRowDim2] = useState<string>(refKey(pivotRowsInit[1] ?? groupDimsInit[1]));
  const [colDim1, setColDim1] = useState<string>(refKey(pivotColsInit[0]));
  const [colDim2, setColDim2] = useState<string>(refKey(pivotColsInit[1]));
  const [groupDim3, setGroupDim3] = useState<string>(refKey(groupDimsInit[2]));
  const [pivotMeasure, setPivotMeasure] = useState<string>((initialConfig.pivotMeasure as string) ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetch(`/api/matomo/reports?siteId=${siteId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (active) setCatalog(d.reports ?? []);
      })
      .catch((e) => {
        if (active) setLoadError(e instanceof Error ? e.message : "Katalog konnte nicht geladen werden");
      });
    return () => {
      active = false;
    };
  }, [siteId]);

  // Nach Kategorie gruppieren (nur Reports mit Dimension sind sinnvoll explorierbar)
  const grouped = useMemo(() => {
    const map = new Map<string, ReportMeta[]>();
    for (const r of catalog ?? []) {
      if (!r.dimension) continue;
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const renderDims = () =>
    grouped.map(([cat, reports]) => (
      <optgroup key={cat} label={cat}>
        {reports.map((r) => (
          <option key={r.uniqueId} value={`${r.module}.${r.action}`}>
            {r.label}
          </option>
        ))}
      </optgroup>
    ));

  const current = useMemo(
    () => (catalog ?? []).find((r) => `${r.module}.${r.action}` === reportKey) ?? null,
    [catalog, reportKey],
  );
  const metricEntries = current ? Object.entries(current.metrics) : [];

  const toggleMetric = (id: string) =>
    setMetrics((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const save = () => {
    setError(null);
    setSuccess(null);
    if (!current) {
      setError("Bitte einen Report wählen.");
      return;
    }
    const refFromKey = (key: string) => {
      const r = (catalog ?? []).find((x) => `${x.module}.${x.action}` === key);
      return r ? { module: r.module, action: r.action, label: r.label } : null;
    };
    const base = {
      ...initialConfig,
      apiModule: current.module,
      apiAction: current.action,
      reportLabel: current.label,
      display,
      limit,
    };
    let config: Record<string, unknown>;
    if (display === "pivot") {
      const rowRefs = [refFromKey(reportKey), refFromKey(rowDim2)].filter(Boolean);
      const colRefs = [refFromKey(colDim1), refFromKey(colDim2)].filter(Boolean);
      if (colRefs.length === 0) {
        setError("Bitte mindestens eine Spalten-Dimension wählen.");
        return;
      }
      const measure = pivotMeasure || "nb_visits";
      config = {
        ...base,
        pivotRows: rowRefs,
        pivotCols: colRefs,
        pivotMeasure: measure,
        pivotMeasureLabel: current.metrics[measure] ?? measure,
      };
    } else if (display === "grouped") {
      const dimRefs = [refFromKey(reportKey), refFromKey(rowDim2), refFromKey(groupDim3)].filter(
        Boolean,
      );
      const ids = metrics.length ? metrics : metricEntries.map(([id]) => id);
      const groupMetrics = ids.map((id) => ({ id, label: current.metrics[id] ?? id }));
      config = { ...base, groupDims: dimRefs, groupMetrics };
    } else {
      config = { ...base, metrics, sortColumn: sortColumn || undefined };
    }
    startTransition(async () => {
      const r = await updateWidgetConfigAction({
        widgetId,
        config,
        title: title.trim() || null,
      });
      if (!r.ok) setError(r.error ?? "Fehler");
      else {
        setSuccess("Gespeichert.");
        onSaved?.({ title: title.trim() || null, config });
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Titel (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eigener Titel" />
      </div>

      {loadError ? (
        <p className="rounded-md bg-warning/10 px-2 py-1.5 text-xs text-foreground">
          Report-Katalog nicht verfügbar: {loadError}
        </p>
      ) : !catalog ? (
        <p className="text-xs text-muted-foreground">Katalog wird geladen…</p>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Report / Dimension</Label>
            <select
              className={selectClass}
              value={reportKey}
              onChange={(e) => {
                setReportKey(e.target.value);
                setMetrics([]);
                setSortColumn("");
              }}
            >
              <option value="">— wählen —</option>
              {grouped.map(([cat, reports]) => (
                <optgroup key={cat} label={cat}>
                  {reports.map((r) => (
                    <option key={r.uniqueId} value={`${r.module}.${r.action}`}>
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {current && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Darstellung</Label>
                  <select className={selectClass} value={display} onChange={(e) => setDisplay(e.target.value)}>
                    <option value="table">Tabelle</option>
                    <option value="bar">Balken</option>
                    <option value="donut">Donut</option>
                    <option value="line">Linie (Verlauf)</option>
                    <option value="area">Fläche (Verlauf)</option>
                    <option value="kpi">KPI (Einzelwert)</option>
                    <option value="pivot">Pivot (Kreuztabelle)</option>
                    <option value="grouped">Gruppierte Tabelle (mehrdim.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{display === "pivot" ? "Anzahl je Ebene" : "Anzahl Zeilen"}</Label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}
                  />
                </div>
              </div>

              {display === "pivot" ? (
                <div className="space-y-2 rounded-md border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Zeilen-Dimension 1 = der oben gewählte Report. Weitere Ebenen ergänzen –
                    mehr Ebenen bedeuten mehr Matomo-Abfragen.
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">Zeilen-Dimension 2 (optional)</Label>
                    <select className={selectClass} value={rowDim2} onChange={(e) => setRowDim2(e.target.value)}>
                      <option value="">— keine —</option>
                      {renderDims()}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Spalten-Dimension 1</Label>
                    <select className={selectClass} value={colDim1} onChange={(e) => setColDim1(e.target.value)}>
                      <option value="">— wählen —</option>
                      {renderDims()}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Spalten-Dimension 2 (optional)</Label>
                    <select className={selectClass} value={colDim2} onChange={(e) => setColDim2(e.target.value)}>
                      <option value="">— keine —</option>
                      {renderDims()}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Wert (Kennzahl)</Label>
                    <select
                      className={selectClass}
                      value={pivotMeasure}
                      onChange={(e) => setPivotMeasure(e.target.value)}
                    >
                      <option value="">Besuche (Standard)</option>
                      {metricEntries.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {display === "grouped" && (
                    <div className="space-y-2 rounded-md border border-border p-2">
                      <p className="text-[11px] text-muted-foreground">
                        Dimension 1 = der oben gewählte Report. Weitere Ebenen verschachteln die
                        Tabelle (mehr Ebenen = mehr Matomo-Abfragen).
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Dimension 2 (optional)</Label>
                        <select className={selectClass} value={rowDim2} onChange={(e) => setRowDim2(e.target.value)}>
                          <option value="">— keine —</option>
                          {renderDims()}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dimension 3 (optional)</Label>
                        <select className={selectClass} value={groupDim3} onChange={(e) => setGroupDim3(e.target.value)}>
                          <option value="">— keine —</option>
                          {renderDims()}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Metriken</Label>
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                      {metricEntries.map(([id, label]) => (
                        <label key={id} className="flex items-center gap-2 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={metrics.includes(id)}
                            onChange={() => toggleMetric(id)}
                            className="h-3.5 w-3.5 rounded border-input"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Keine Auswahl = alle Metriken des Reports.
                    </p>
                  </div>

                  {display !== "grouped" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Sortieren nach</Label>
                      <select className={selectClass} value={sortColumn} onChange={(e) => setSortColumn(e.target.value)}>
                        <option value="">Standard</option>
                        {metricEntries.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
        {error && (
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{error}</span>
        )}
        {success && (
          <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">{success}</span>
        )}
      </div>
    </div>
  );
}
