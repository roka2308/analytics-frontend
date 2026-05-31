"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  GitCompare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const QUICK_PRESETS = [
  { value: "today", label: "Heute" },
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
] as const;

const MORE_PRESETS = [
  { value: "yesterday", label: "Gestern" },
  { value: "this-month", label: "Dieser Monat" },
  { value: "last-month", label: "Letzter Monat" },
  { value: "this-quarter", label: "Dieses Quartal" },
  { value: "this-year", label: "Dieses Jahr" },
] as const;

const COMPARE_OPTIONS = [
  { value: "none", label: "Kein Vergleich" },
  { value: "previous", label: "Vorperiode" },
  { value: "year", label: "Vorjahr" },
] as const;

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = searchParams.get("range") ?? "7";
  const currentCompare = searchParams.get("compare") ?? "none";
  const isCustom = currentPreset === "custom";

  const [customFrom, setCustomFrom] = useState(searchParams.get("from") ?? "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") ?? "");

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const setPreset = (preset: string) => {
    updateParams({ range: preset, from: null, to: null });
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    updateParams({ range: "custom", from: customFrom, to: customTo });
  };

  const setCompare = (compare: string) => {
    updateParams({ compare: compare === "none" ? null : compare });
  };

  const allPresets = [...QUICK_PRESETS, ...MORE_PRESETS];
  const matchedMore = MORE_PRESETS.find((p) => p.value === currentPreset);
  const morePresetLabel = matchedMore?.label ?? "Mehr…";

  const compareOption = COMPARE_OPTIONS.find((c) => c.value === currentCompare);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Schnell-Presets */}
      <div
        role="tablist"
        aria-label="Zeitraum auswählen"
        className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm"
      >
        {QUICK_PRESETS.map(({ label, value }) => {
          const isActive = currentPreset === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setPreset(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          );
        })}

        {/* Mehr-Dropdown fuer erweiterte Presets + Custom */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Erweiterte Zeitraumauswahl"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              (matchedMore || isCustom)
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {isCustom ? "Eigener Zeitraum" : morePresetLabel}
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[260px]">
            <DropdownMenuLabel>Zeitraum</DropdownMenuLabel>
            {MORE_PRESETS.map((p) => (
              <DropdownMenuItem
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={p.value === currentPreset ? "bg-muted" : ""}
              >
                {p.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Eigener Zeitraum</DropdownMenuLabel>
            <div className="px-2 pb-2 space-y-2">
              <label className="block text-xs text-muted-foreground">
                Von
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-0.5 block w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Bis
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-0.5 block w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </label>
              <button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Übernehmen
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Vergleichs-Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Vergleich auswählen"
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            currentCompare !== "none"
              ? "text-accent-text"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {compareOption?.label ?? "Kein Vergleich"}
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuLabel>Vergleichszeitraum</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COMPARE_OPTIONS.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => setCompare(c.value)}
              className={c.value === currentCompare ? "bg-muted" : ""}
            >
              {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
