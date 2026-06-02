"use client";

import { useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { setDashboardDefaultRangeAction } from "@/lib/actions/dashboards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  dashboardId: string;
  currentPreset: string | null;
  currentFrom: string | null;
  currentTo: string | null;
  currentCompare: string | null;
}

const PRESETS = [
  { value: "__none__", label: "Kein Standard (URL-Wert nutzen)" },
  { value: "today", label: "Heute" },
  { value: "yesterday", label: "Gestern" },
  { value: "7", label: "Letzte 7 Tage" },
  { value: "30", label: "Letzte 30 Tage" },
  { value: "90", label: "Letzte 90 Tage" },
  { value: "this-month", label: "Dieser Monat" },
  { value: "last-month", label: "Letzter Monat" },
  { value: "this-quarter", label: "Dieses Quartal" },
  { value: "this-year", label: "Dieses Jahr" },
  { value: "custom", label: "Eigener Zeitraum" },
];

const COMPARE_OPTIONS = [
  { value: "__none__", label: "Kein Vergleich (URL-Wert nutzen)" },
  { value: "none", label: "Kein Vergleich" },
  { value: "previous", label: "Vorperiode" },
  { value: "year", label: "Vorjahr" },
];

export function DashboardDefaultRangeEditor(props: Props) {
  const [preset, setPreset] = useState<string>(
    props.currentPreset ?? "__none__"
  );
  const [from, setFrom] = useState(props.currentFrom ?? "");
  const [to, setTo] = useState(props.currentTo ?? "");
  const [compare, setCompare] = useState<string>(
    props.currentCompare ?? "__none__"
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    const presetValue = preset === "__none__" ? null : preset;
    const compareValue = compare === "__none__" ? null : compare;
    const fromValue = preset === "custom" ? from || null : null;
    const toValue = preset === "custom" ? to || null : null;

    startTransition(async () => {
      const r = await setDashboardDefaultRangeAction(props.dashboardId, {
        preset: presetValue,
        from: fromValue,
        to: toValue,
        compare: compareValue,
      });
      if (!r.ok) setError(r.error ?? "Unbekannter Fehler");
      else setSuccess("Standard-Zeitraum gespeichert.");
    });
  };

  const hasAny =
    preset !== "__none__" || compare !== "__none__" || from !== "" || to !== "";

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Clock className="h-3 w-3" />
        Standard-Zeitraum
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`preset-${props.dashboardId}`} className="text-xs">
            Zeitraum
          </Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger id={`preset-${props.dashboardId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`compare-${props.dashboardId}`} className="text-xs">
            Vergleich
          </Label>
          <Select value={compare} onValueChange={setCompare}>
            <SelectTrigger id={`compare-${props.dashboardId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARE_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {preset === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`from-${props.dashboardId}`} className="text-xs">
              Von
            </Label>
            <Input
              id={`from-${props.dashboardId}`}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`to-${props.dashboardId}`} className="text-xs">
              Bis
            </Label>
            <Input
              id={`to-${props.dashboardId}`}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
        {hasAny && (
          <button
            type="button"
            onClick={() => {
              setPreset("__none__");
              setCompare("__none__");
              setFrom("");
              setTo("");
            }}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Zurücksetzen (Standard URL-Verhalten)
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          {success}
        </p>
      )}
    </div>
  );
}
