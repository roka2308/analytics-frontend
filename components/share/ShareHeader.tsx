import { Eye } from "lucide-react";

interface Props {
  projectName: string;
  projectLogo: string | null;
  dashboardName: string;
  shareLabel: string | null;
}

/**
 * Header fuer Read-Only-Share-Ansichten.
 *
 * Bewusst minimal:
 *  - Kein User-Menue, kein Settings-Link, kein Theme-Toggle
 *    (wir vermitteln eindeutig "Diese Sicht gehoert dem Empfaenger,
 *     kein Account erforderlich")
 *  - Projekt-Logo + Projekt-Name als Branding-Anker
 *  - Optional: shareLabel zeigt, fuer welchen Zweck der Link erstellt wurde
 *  - Read-only-Hinweis mit Auge-Icon
 */
export function ShareHeader({
  projectName,
  projectLogo,
  dashboardName,
  shareLabel,
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {projectLogo && (
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-muted/40 border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={projectLogo}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {projectName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {dashboardName}
              {shareLabel && (
                <>
                  <span className="mx-1.5">·</span>
                  {shareLabel}
                </>
              )}
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          aria-label="Read-only-Ansicht"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Read-only</span>
        </div>
      </div>
    </header>
  );
}
