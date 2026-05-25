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
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {ranges.map(({ label, value }) => (
        <Link
          key={value}
          href={`/dashboard?range=${value}`}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            current === value
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
