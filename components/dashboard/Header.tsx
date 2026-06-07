import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardPicker, type DashboardLink } from "./DashboardPicker";
import { ProjectPicker, type ProjectLink } from "./ProjectPicker";

interface Props {
  projects?: ProjectLink[];
  currentProjectSlug?: string;
  /** Optionales Projekt-Logo (Base64 Data-URL) fuer dezente Anzeige */
  currentProjectLogo?: string | null;
  dashboards?: DashboardLink[];
  currentDashboardSlug?: string;
}

export function Header({
  projects,
  currentProjectSlug,
  currentProjectLogo,
  dashboards,
  currentDashboardSlug,
}: Props = {}) {
  const showProjectPicker = projects && projects.length > 0;
  const showDashboardPicker = dashboards && dashboards.length > 0;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-xl font-semibold text-foreground hover:text-accent-text transition-colors"
          >
            Analytics
          </Link>

          {/* Dezentes Projekt-Logo in der Ecke (nur wenn vorhanden) */}
          {currentProjectLogo && (
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-muted/40 border border-border"
              title="Projekt-Logo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentProjectLogo}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </span>
          )}

          {showProjectPicker && (
            <>
              <span aria-hidden className="text-muted-foreground">/</span>
              <ProjectPicker
                projects={projects!}
                currentSlug={currentProjectSlug}
              />
            </>
          )}
          {showDashboardPicker && (
            <>
              <span aria-hidden className="text-muted-foreground">/</span>
              <DashboardPicker
                dashboards={dashboards!}
                currentSlug={currentDashboardSlug}
              />
            </>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {!showDashboardPicker && (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/kunden"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Verwaltung
          </Link>
          <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
