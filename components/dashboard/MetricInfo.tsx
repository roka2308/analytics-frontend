"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MetricDefinition } from "@/lib/metrics/registry";

interface Props {
  metric: MetricDefinition;
  /** Klein für KPI-Karten, normal für Widget-Header */
  size?: "sm" | "md";
}

/**
 * Info-Icon mit klickbarem Popover, das Definition, Erklärung und
 * Handlungsempfehlungen einer Metrik zeigt.
 *
 * - Tastatur-zugänglich (Tab + Enter)
 * - Mobile-tauglich (Tap)
 * - Schließt mit Esc oder Klick außerhalb
 */
export function MetricInfo({ metric, size = "sm" }: Props) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Erklärung zu ${metric.label}`}
        className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <Info className={iconSize} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 space-y-3 text-sm"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-text">
            {metric.kind === "kpi" ? "Kennzahl" : "Analyse"}
          </p>
          <h4 className="text-base font-semibold text-foreground">
            {metric.label}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {metric.definition}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Was bedeutet das?
          </p>
          <p className="mt-1 text-sm text-foreground leading-relaxed">
            {metric.explanation}
          </p>
        </div>

        {metric.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Handlungsempfehlungen
            </p>
            <ul className="mt-1 space-y-1 text-sm text-foreground">
              {metric.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-accent-text">•</span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(metric.lowerIsBetter !== undefined || metric.format) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            {metric.format && <span>Format: {metric.format}</span>}
            {metric.lowerIsBetter !== undefined && (
              <span>
                {metric.lowerIsBetter ? "↓ niedriger = besser" : "↑ höher = besser"}
              </span>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
