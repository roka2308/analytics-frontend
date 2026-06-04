interface Props {
  /** Wert 0..1 (Anteil am Maximum) */
  fraction: number;
}

/**
 * Schmaler horizontaler Balken fuer Tabellen-Zellen.
 * Magenta-Akzent, dezent. Server-Component-tauglich (kein Client noetig).
 */
export function InlineBar({ fraction }: Props) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-accent/70"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
