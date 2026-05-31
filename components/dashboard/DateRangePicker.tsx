"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ranges = [
  { label: "Heute", value: "today" },
  { label: "7 Tage", value: "7" },
  { label: "30 Tage", value: "30" },
  { label: "90 Tage", value: "90" },
];

export function DateRangePicker() {
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "7";

  return (
    <div
      role="tablist"
      aria-label="Zeitraum auswählen"
      className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm"
    >
      {ranges.map(({ label, value }) => {
        const isActive = current === value;
        return (
          <Link
            key={value}
            href={`/dashboard?range=${value}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
