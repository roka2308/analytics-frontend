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

export function DimensionMetricConfig({
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
  const [metric, setMetric] = useState<string>((initialConfig.metric as string) ?? "");
  const [limit, setLimit] = useState<number>((initialConfig.limit as number) ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetch(`/api/matomo/reports?siteId=${siteId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => active && setCatalog(d.reports ?? []))
      .catch((e) => active && setLoadError(e instanceof Error ? e.message : "Fehler"));
    return () => {
      active = false;
    };
  }, [siteId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ReportMeta[]>();
    for (const r of catalog ?? []) {
      if (!r.dimension) continue;
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const current = useMemo(
    () => (catalog ?? []).find((r) => `${r.module}.${r.action}` === reportKey) ?? null,
    [catalog, reportKey],
  );
  const metricEntries = current ? Object.entries(current.metrics) : [];

  const save = () => {
    setError(null);
    setSuccess(null);
    if (!current) {
      setError("Bitte eine Dimension wählen.");
      return;
    }
    const config = {
      ...initialConfig,
      apiModule: current.module,
      apiAction: current.action,
      reportLabel: current.label,
      metric: metric || metricEntries[0]?.[0] || "nb_visits",
      limit,
    };
    delete (config as Record<string, unknown>).source;
    startTransition(async () => {
      const r = await updateWidgetConfigAction({ widgetId, config, title: title.trim() || null });
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
          Katalog nicht verfügbar: {loadError}
        </p>
      ) : !catalog ? (
        <p className="text-xs text-muted-foreground">Katalog wird geladen…</p>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Dimension</Label>
            <select
              className={selectClass}
              value={reportKey}
              onChange={(e) => {
                setReportKey(e.target.value);
                setMetric("");
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Metrik</Label>
                <select className={selectClass} value={metric} onChange={(e) => setMetric(e.target.value)}>
                  {metricEntries.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Anzahl</Label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}
                />
              </div>
            </div>
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
