/**
 * Zentrale Date-Range-Logik.
 *
 * Eine "Range" ist immer ein {from, to}-Paar im Format YYYY-MM-DD.
 * Damit reicht Matomo period=range mit date=from,to in allen Faellen.
 *
 * Compare-Modus bestimmt, wie der Vergleichszeitraum aufgebaut wird:
 *  - "previous": gleicher Tag-Abstand direkt davor (z.B. letzte 7 Tage -> 7 Tage davor)
 *  - "year"    : exakt 1 Jahr zurueck (gleiche Wochentage approximativ)
 *  - "none"    : kein Vergleich
 */

export type CompareMode = "none" | "previous" | "year";

export type RangePreset =
  | "today"
  | "yesterday"
  | "7"
  | "30"
  | "90"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "this-year"
  | "custom";

export interface DateRangeValue {
  preset: RangePreset;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  compare: CompareMode;
  /** Anzahl Tage im Zeitraum (>= 1) */
  days: number;
  /** Menschenlesbares Label fuer UI */
  label: string;
}

export interface CompareRange {
  from: string;
  to: string;
  label: string;
}

// ──────────────────────────────────────────────────────────────
// Date-Helpers (lokal, ohne Date-Lib – wir bleiben minimal)
// ──────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function daysBetweenInclusive(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

// ──────────────────────────────────────────────────────────────
// Range aus URL-Parametern aufbauen
// ──────────────────────────────────────────────────────────────

interface ResolveInput {
  preset?: string;
  from?: string;
  to?: string;
  compare?: string;
  /** Optionales Heute fuer Tests (Default: jetzt) */
  today?: Date;
}

export function resolveDateRange(input: ResolveInput): DateRangeValue {
  const today = input.today ?? new Date();
  const compare: CompareMode =
    input.compare === "previous" || input.compare === "year"
      ? input.compare
      : "none";

  // Custom Range
  if (input.preset === "custom" && input.from && input.to) {
    const from = parseIso(input.from);
    const to = parseIso(input.to);
    const days = Math.max(1, daysBetweenInclusive(from, to));
    return {
      preset: "custom",
      from: toIso(from),
      to: toIso(to),
      compare,
      days,
      label: `${formatHuman(from)} – ${formatHuman(to)}`,
    };
  }

  const preset = (input.preset as RangePreset) ?? "7";

  switch (preset) {
    case "today": {
      const iso = toIso(today);
      return { preset, from: iso, to: iso, compare, days: 1, label: "Heute" };
    }
    case "yesterday": {
      const y = addDays(today, -1);
      const iso = toIso(y);
      return { preset, from: iso, to: iso, compare, days: 1, label: "Gestern" };
    }
    case "7":
    case "30":
    case "90": {
      const n = parseInt(preset, 10);
      const from = addDays(today, -(n - 1));
      return {
        preset,
        from: toIso(from),
        to: toIso(today),
        compare,
        days: n,
        label: `letzte ${n} Tage`,
      };
    }
    case "this-month": {
      const from = startOfMonth(today);
      return {
        preset,
        from: toIso(from),
        to: toIso(today),
        compare,
        days: daysBetweenInclusive(from, today),
        label: "Dieser Monat",
      };
    }
    case "last-month": {
      const from = startOfMonth(addDays(startOfMonth(today), -1));
      const to = endOfMonth(from);
      return {
        preset,
        from: toIso(from),
        to: toIso(to),
        compare,
        days: daysBetweenInclusive(from, to),
        label: "Letzter Monat",
      };
    }
    case "this-quarter": {
      const from = startOfQuarter(today);
      return {
        preset,
        from: toIso(from),
        to: toIso(today),
        compare,
        days: daysBetweenInclusive(from, today),
        label: "Dieses Quartal",
      };
    }
    case "this-year": {
      const from = startOfYear(today);
      return {
        preset,
        from: toIso(from),
        to: toIso(today),
        compare,
        days: daysBetweenInclusive(from, today),
        label: "Dieses Jahr",
      };
    }
    default: {
      // Fallback wie "7"
      const from = addDays(today, -6);
      return {
        preset: "7",
        from: toIso(from),
        to: toIso(today),
        compare,
        days: 7,
        label: "letzte 7 Tage",
      };
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Vergleichszeitraum berechnen
// ──────────────────────────────────────────────────────────────

export function computeCompareRange(range: DateRangeValue): CompareRange | null {
  if (range.compare === "none") return null;

  const from = parseIso(range.from);
  const to = parseIso(range.to);

  if (range.compare === "year") {
    const cFrom = new Date(from);
    cFrom.setFullYear(cFrom.getFullYear() - 1);
    const cTo = new Date(to);
    cTo.setFullYear(cTo.getFullYear() - 1);
    return {
      from: toIso(cFrom),
      to: toIso(cTo),
      label: "Vorjahr",
    };
  }

  // "previous": gleichlanger Block direkt davor
  const cTo = addDays(from, -1);
  const cFrom = addDays(cTo, -(range.days - 1));
  return {
    from: toIso(cFrom),
    to: toIso(cTo),
    label: range.days === 1 ? "Vortag" : `vorherige ${range.days} Tage`,
  };
}

function formatHuman(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ──────────────────────────────────────────────────────────────
// Matomo-Format
// ──────────────────────────────────────────────────────────────

export function toMatomoDate(range: { from: string; to: string }): string {
  // Matomo akzeptiert period=range mit date=YYYY-MM-DD,YYYY-MM-DD
  // Einzeltage werden ebenfalls als from,to mit gleichem Datum uebergeben.
  return `${range.from},${range.to}`;
}
