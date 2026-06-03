import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * Topbar fuer das App-Shell-Layout.
 *
 * Links: Titel + optionaler Subtitle (Site, Zeitraum, etc.)
 * Rechts: Custom-Elemente (z.B. DateRangePicker, Edit-Button)
 *         + Theme-Toggle
 */
export function Topbar({ title, subtitle, right }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-0.5 flex flex-wrap items-center text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
